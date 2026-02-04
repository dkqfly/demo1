# 多功能翻译工具

基于百度翻译API的多功能翻译软件，支持文字翻译、文档翻译和图片OCR翻译。

## ✨ 功能特点

- 📝 **文字翻译**：支持多种语言互译，自动检测源语言
- 📄 **文档翻译**：支持 .txt、.docx 格式文档翻译
- 🖼️ **图片翻译**：支持 OCR 文字识别和翻译（支持 .jpg、.jpeg、.png、.gif、.bmp）
- 🔒 **安全配置**：支持通过 Web 界面或环境变量配置 API 密钥
- 🎨 **美观界面**：简洁直观的用户界面，支持拖拽上传

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/translation-tool.git
cd translation-tool
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API 密钥

**方式一：通过 Web 界面配置（推荐）**

1. 启动服务器：`npm start`
2. 访问 `http://localhost:3000/config.html`
3. 输入您的百度翻译 APP ID 和密钥
4. 点击保存

**方式二：通过环境变量配置**

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入您的 API 密钥：
   ```
   BAIDU_APP_ID=your_app_id_here
   BAIDU_SECRET_KEY=your_secret_key_here
   ```

**方式三：通过配置文件配置**

直接编辑 `config.json` 文件：
```json
{
  "appId": "your_app_id_here",
  "secretKey": "your_secret_key_here"
}
```

### 4. 启动服务器

```bash
npm start
```

访问 `http://localhost:3000` 开始使用翻译工具。

## 🔑 如何获取百度翻译 API 密钥

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册并登录账号
3. 进入"管理控制台"
4. 创建应用，获取 APP ID 和密钥
5. 标准版免费额度：每月 200 万字符

## 📁 项目结构

```
.
├── config.html          # API 配置页面
├── index.html           # 主页面（翻译界面）
├── server.js            # 后端服务器
├── package.json         # 项目依赖
├── .env.example         # 环境变量模板
├── .gitignore          # Git 忽略文件
├── css/
│   └── style.css       # 样式文件
└── js/
    └── app.js          # 前端逻辑
```

## 🛠️ 技术栈

- **前端**：HTML5、CSS3、JavaScript（原生）
- **后端**：Node.js、Express
- **OCR**：Tesseract.js
- **文档解析**：Mammoth.js
- **翻译 API**：百度翻译 API

## ⚙️ 配置说明

### 支持的文件格式

- **文档**：.txt、.docx
- **图片**：.jpg、.jpeg、.png、.gif、.bmp

### 配置优先级

1. 环境变量（`.env` 文件）
2. 配置文件（`config.json`）
3. Web 界面配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BAIDU_APP_ID` | 百度翻译 APP ID | - |
| `BAIDU_SECRET_KEY` | 百度翻译密钥 | - |
| `PORT` | 服务器端口 | 3000 |

## 📝 使用说明

### 文字翻译

1. 在首页输入要翻译的文字
2. 选择源语言和目标语言
3. 点击"翻译"按钮

### 文档翻译

1. 切换到"文档/图片翻译"标签
2. 拖拽或点击上传文档文件（.txt、.docx）
3. 选择目标语言
4. 点击"翻译"按钮

### 图片翻译

1. 切换到"文档/图片翻译"标签
2. 拖拽或点击上传图片文件
3. 选择目标语言
4. 点击"翻译"按钮，等待 OCR 识别和翻译

## 🔒 安全提示

- ⚠️ **不要将 `.env` 文件或 `config.json` 提交到 GitHub**
- ⚠️ **妥善保管您的 API 密钥，不要泄露给他人**
- ✅ 项目已配置 `.gitignore`，会自动忽略敏感文件

## 🐛 常见问题

### 1. 启动时提示"API 密钥未配置"

请访问 `http://localhost:3000/config.html` 配置您的百度翻译 API 密钥。

### 2. 文档翻译失败

- 确保文档格式正确（支持 .txt、.docx）
- 检查文档内容是否为空
- 确保已配置 API 密钥

### 3. 图片 OCR 识别失败

- 确保图片格式正确（支持 .jpg、.jpeg、.png、.gif、.bmp）
- 确保图片中的文字清晰可见
- OCR 功能需要加载语言包，首次使用可能需要等待

### 4. 翻译报错"访问频率受限"

百度翻译 API 有频率限制，请稍后再试。标准版每秒最多 1 次请求。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请通过 GitHub Issues 联系。
