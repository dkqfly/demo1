const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js');

// 加载环境变量
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not installed, skipping .env loading');
}

// 创建uploads目录（如果不存在）
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件路径
const configPath = path.join(__dirname, 'config.json');

// 加载配置
function loadConfig() {
  // 首先尝试从环境变量加载
  let appId = process.env.BAIDU_APP_ID;
  let secretKey = process.env.BAIDU_SECRET_KEY;
  
  // 如果环境变量不存在，尝试从配置文件加载
  if ((!appId || !secretKey) && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      appId = appId || config.appId;
      secretKey = secretKey || config.secretKey;
    } catch (error) {
      console.error('Error loading config file:', error);
    }
  }
  
  return { appId, secretKey };
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 3000;

// 启用CORS
app.use(cors());
app.use(express.json());

// 配置静态文件服务
app.use(express.static(__dirname));

// 百度翻译API配置
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

// 配置API接口
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  // 只返回APP ID，不返回密钥
  res.json({ appId: config.appId || '' });
});

app.post('/api/config', (req, res) => {
  const { appId, secretKey } = req.body;
  
  if (!appId || !secretKey) {
    return res.status(400).json({ error: 'APP ID和密钥不能为空' });
  }
  
  if (saveConfig({ appId, secretKey })) {
    res.json({ message: '配置保存成功' });
  } else {
    res.status(500).json({ error: '配置保存失败' });
  }
});

// 翻译接口
app.post('/api/translate', async (req, res) => {
  try {
    const { text, from, to } = req.body;
    const config = loadConfig();
    
    if (!config.appId || !config.secretKey) {
      return res.status(400).json({ 
        error: 'API未配置', 
        message: '请先访问 config.html 配置百度翻译API密钥' 
      });
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    // 生成salt和签名
    const salt = Date.now();
    const signStr = config.appId + text + salt + config.secretKey;
    const sign = crypto.createHash('md5').update(signStr).digest('hex');

    // 发送请求到百度翻译API
    const params = new URLSearchParams({
      q: text,
      from: from || 'auto',
      to: to || 'zh',
      appid: config.appId,
      salt: salt,
      sign: sign
    });

    const response = await axios.post(BAIDU_API_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 文档上传和翻译接口
app.post('/api/translate/document', upload.single('file'), async (req, res) => {
  try {
    const config = loadConfig();
    
    if (!config.appId || !config.secretKey) {
      return res.status(400).json({ 
        error: 'API未配置', 
        message: '请先访问 config.html 配置百度翻译API密钥' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { to } = req.body;
    const fileName = req.file.originalname;
    const filePath = req.file.path;

    // 读取文件内容
    let rawContent = '';
    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.txt') {
      // 读取文本文件
      rawContent = fs.readFileSync(filePath, 'utf-8');
    } else if (ext === '.docx') {
      // 使用mammoth库解析docx文件
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        rawContent = result.value;
      } catch (error) {
        console.error('Error parsing docx:', error);
      }
    }

    // 清理上传的文件
    fs.unlinkSync(filePath);

    // 检查是否有实际内容需要翻译
    if (!rawContent || rawContent.trim() === '') {
      return res.json({ 
        fileName, 
        content: `[${fileName}] 文档内容为空或无法解析`, 
        translatedContent: `[${fileName}] 文档内容为空或无法解析` 
      });
    }

    // 翻译内容
    let translatedContent = '';
    if (rawContent.length > 5000) {
      // 长文本分批翻译
      const chunks = [];
      for (let i = 0; i < rawContent.length; i += 4500) {
        chunks.push(rawContent.substring(i, i + 4500));
      }

      const translatedChunks = [];
      for (const chunk of chunks) {
        const translated = await translateText(chunk, 'auto', to || 'zh', config);
        translatedChunks.push(translated);
      }

      translatedContent = translatedChunks.join('\n\n');
    } else {
      // 短文本直接翻译
      translatedContent = await translateText(rawContent, 'auto', to || 'zh', config);
    }

    return res.json({ fileName, content: rawContent, translatedContent });
  } catch (error) {
    console.error('Document translation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 图片上传和OCR翻译接口
app.post('/api/translate/image', upload.single('file'), async (req, res) => {
  try {
    const config = loadConfig();
    
    if (!config.appId || !config.secretKey) {
      return res.status(400).json({ 
        error: 'API未配置', 
        message: '请先访问 config.html 配置百度翻译API密钥' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { to } = req.body;
    const fileName = req.file.originalname;
    const filePath = req.file.path;

    // 检查文件类型
    const ext = path.extname(fileName).toLowerCase();
    const supportedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    
    if (!supportedImageTypes.includes(ext)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported image type' });
    }

    // 使用Tesseract.js进行OCR文本提取
    let ocrText = '';
    let rawOcrText = '';
    try {
      const worker = await createWorker('eng+chi_sim');
      const { data: { text } } = await worker.recognize(filePath);
      rawOcrText = text.trim();
      
      if (!rawOcrText) {
        ocrText = `[${fileName}] 图片中未识别到文本`;
      } else {
        ocrText = `[${fileName}] OCR识别结果：\n${rawOcrText}`;
      }
      
      await worker.terminate();
    } catch (error) {
      console.error('OCR error:', error);
      ocrText = `[${fileName}] OCR识别失败：${error.message}\n\n由于环境限制，OCR功能可能无法正常工作。`;
    } finally {
      // 清理上传的文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 翻译识别出的文本（只翻译实际的OCR内容，不翻译前缀）
    let translatedText = '';
    try {
      if (rawOcrText) {
        translatedText = await translateText(rawOcrText, 'auto', to || 'zh', config);
      } else {
        translatedText = ocrText;
      }
    } catch (error) {
      console.error('Translation error:', error);
      translatedText = `翻译失败：${error.message}`;
    }

    return res.json({ fileName, ocrText, translatedText });
  } catch (error) {
    console.error('Image translation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 翻译文本的辅助函数
async function translateText(text, from, to, config) {
  // 生成salt和签名
  const salt = Date.now();
  const signStr = config.appId + text + salt + config.secretKey;
  const sign = crypto.createHash('md5').update(signStr).digest('hex');

  // 发送请求到百度翻译API
  const params = new URLSearchParams({
    q: text,
    from: from || 'auto',
    to: to || 'zh',
    appid: config.appId,
    salt: salt,
    sign: sign
  });

  const response = await axios.post(BAIDU_API_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (response.data.trans_result && response.data.trans_result.length > 0) {
    return response.data.trans_result.map(item => item.dst).join('\n');
  } else {
    throw new Error('Translation failed');
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('百度翻译API代理服务器已启动');
  console.log('');
  
  const config = loadConfig();
  if (!config.appId || !config.secretKey) {
    console.log('⚠️  警告：API密钥未配置');
    console.log('请访问 http://localhost:' + PORT + '/config.html 进行配置');
  } else {
    console.log('✅ API密钥已配置');
  }
});
