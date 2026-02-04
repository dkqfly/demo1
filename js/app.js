// 百度翻译API配置
const BAIDU_TRANSLATE_CONFIG = {
    appId: '20230801001777525', // 默认App ID，实际使用时需要替换为有效的ID
    apiKey: 'WpPF_d5vlsdaigk0032vsai8g', // 你的API密钥
    apiUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
};

// 语言代码映射表
const LANGUAGE_CODES = {
    'auto': '自动检测',
    'zh': '中文',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'es': '西班牙语',
    'ru': '俄语',
    'de': '德语',
    'it': '意大利语',
    'pt': '葡萄牙语',
    'ar': '阿拉伯语'
};

// 支持的文档类型
const SUPPORTED_DOC_TYPES = ['.docx', '.rtf', '.txt'];
const SUPPORTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

// 应用主类
class TranslationApp {
    constructor() {
        this.currentTab = 'text';
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // 文字翻译按钮
        document.getElementById('translateBtn').addEventListener('click', () => this.translateText());
        
        // 文档/图片翻译按钮
        document.getElementById('docTranslateBtn').addEventListener('click', () => this.translateDocument());
        
        // 文件输入事件
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 上传按钮点击事件
        document.querySelector('.upload-btn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // 源语言和目标语言选择事件
        document.getElementById('sourceLang').addEventListener('change', (e) => {
            if (e.target.value !== 'auto') {
                console.log('源语言已选择:', LANGUAGE_CODES[e.target.value]);
            }
        });
        
        document.getElementById('targetLang').addEventListener('change', (e) => {
            console.log('目标语言已选择:', LANGUAGE_CODES[e.target.value]);
        });
        
        document.getElementById('docTargetLang').addEventListener('change', (e) => {
            console.log('文档目标语言已选择:', LANGUAGE_CODES[e.target.value]);
        });
    }

    setupTabs() {
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');

        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有活动状态
                tabLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // 添加当前活动状态
                link.classList.add('active');
                const tabId = link.getAttribute('data-tab');
                
                // 根据标签类型获取对应的内容元素
                let contentId;
                if (tabId === 'config') {
                    contentId = 'config';
                } else {
                    contentId = `${tabId}-translate`;
                }
                
                const contentElement = document.getElementById(contentId);
                if (contentElement) {
                    contentElement.classList.add('active');
                }
                
                this.currentTab = tabId;
            });
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            uploadArea.classList.add('drag-over');
        }

        function unhighlight() {
            uploadArea.classList.remove('drag-over');
        }

        uploadArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files);
        }
    }

    handleFileSelect(event) {
        const files = event.target.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (this.isValidFileType(file)) {
                this.addFileToList(file);
            } else {
                alert(`不支持的文件类型: ${file.name}`);
            }
        }
        // 清空文件输入，允许重复选择相同文件
        event.target.value = '';
    }

    isValidFileType(file) {
        const fileName = file.name.toLowerCase();
        const ext = '.' + fileName.split('.').pop();
        return [...SUPPORTED_DOC_TYPES, ...SUPPORTED_IMAGE_TYPES].includes(ext);
    }

    addFileToList(file) {
        // 检查是否已存在同名文件
        if (this.selectedFiles.some(f => f.name === file.name)) {
            alert(`文件已存在: ${file.name}`);
            return;
        }

        this.selectedFiles.push(file);
        this.updateFileList();
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            let fileType = '未知';
            if (SUPPORTED_DOC_TYPES.includes(ext)) {
                fileType = '文档';
            } else if (SUPPORTED_IMAGE_TYPES.includes(ext)) {
                fileType = '图片';
            }

            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileType} | ${(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <button class="remove-file" onclick="app.removeFile(${index})">移除</button>
            `;
            
            fileList.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
    }

    async translateText() {
        const inputText = document.getElementById('textInput').value.trim();
        if (!inputText) {
            alert('请输入要翻译的文字');
            return;
        }

        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;

        if (sourceLang === targetLang) {
            document.getElementById('textOutput').value = inputText;
            return;
        }

        try {
            this.setLoadingState('text', true);
            const result = await this.baiduTranslate(inputText, sourceLang, targetLang);
            document.getElementById('textOutput').value = result;
        } catch (error) {
            console.error('翻译错误:', error);
            document.getElementById('textOutput').value = '翻译失败: ' + error.message;
        } finally {
            this.setLoadingState('text', false);
        }
    }

    async translateDocument() {
        if (this.selectedFiles.length === 0) {
            alert('请选择要翻译的文件');
            return;
        }

        const targetLang = document.getElementById('docTargetLang').value;
        const outputArea = document.getElementById('docOutput');
        outputArea.value = '正在处理文件...';

        try {
            this.setLoadingState('doc', true);
            
            let allResults = [];
            for (const file of this.selectedFiles) {
                const result = await this.processFile(file, targetLang);
                allResults.push(`${result}\n\n`);
            }
            
            outputArea.value = allResults.join('').trim();
        } catch (error) {
            console.error('文档处理错误:', error);
            outputArea.value = '文档处理失败: ' + error.message;
        } finally {
            this.setLoadingState('doc', false);
        }
    }

    async processFile(file, targetLang) {
        const fileName = file.name.toLowerCase();
        const ext = '.' + fileName.split('.').pop();

        if (SUPPORTED_IMAGE_TYPES.includes(ext)) {
            // 图片处理：提取文本并翻译
            return await this.processImage(file, targetLang);
        } else if (SUPPORTED_DOC_TYPES.includes(ext)) {
            // 文档处理：读取内容并翻译
            return await this.processDocument(file, targetLang);
        } else {
            throw new Error(`不支持的文件类型: ${ext}`);
        }
    }

    async processImage(file, targetLang) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('to', targetLang);

            const response = await fetch('/api/translate/image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.translatedText;
        } catch (error) {
            console.error('图片翻译失败:', error);
            throw error;
        }
    }

    async processDocument(file, targetLang) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('to', targetLang);

            const response = await fetch('/api/translate/document', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.translatedContent;
        } catch (error) {
            console.error('文档翻译失败:', error);
            throw error;
        }
    }

    async splitAndTranslate(text, targetLang) {
        // 将长文本分割成较小的部分进行翻译
        const maxLength = 4500; // 百度API单次请求长度限制
        const parts = [];
        const translatedParts = [];

        // 按句子或段落分割文本
        let currentPart = '';
        const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];

        for (const sentence of sentences) {
            if ((currentPart + sentence).length > maxLength) {
                if (currentPart) {
                    parts.push(currentPart.trim());
                    currentPart = sentence;
                } else {
                    // 单个句子就超过限制，按字符分割
                    const chunks = this.splitTextByLength(sentence, maxLength);
                    parts.push(...chunks);
                }
            } else {
                currentPart += sentence;
            }
        }

        if (currentPart) {
            parts.push(currentPart.trim());
        }

        // 逐部分翻译
        for (const part of parts) {
            if (part) {
                const translated = await this.baiduTranslate(part, 'auto', targetLang);
                translatedParts.push(translated);
            }
        }

        return translatedParts.join('\n\n');
    }

    splitTextByLength(text, maxLength) {
        const parts = [];
        for (let i = 0; i < text.length; i += maxLength) {
            parts.push(text.substring(i, i + maxLength));
        }
        return parts;
    }

    // 百度翻译API调用
    async baiduTranslate(query, from, to) {
        // 百度翻译API需要在服务端调用以避免CORS问题和保护密钥
        // 通过后端代理API请求
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: query,
                    from: from,
                    to: to
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error_code) {
                // 根据错误代码提供特定的错误信息
                switch (data.error_code) {
                    case '52001':
                        throw new Error('请求超时，请重试');
                    case '52002':
                        throw new Error('系统错误，请稍后重试');
                    case '52003':
                        throw new Error('API未授权，请检查server.js中的API配置（App ID和API密钥）');
                    case '54001':
                        throw new Error('签名错误，请检查密钥配置');
                    case '54003':
                        throw new Error('访问频率受限，请稍后再试');
                    case '58001':
                        throw new Error('翻译语言不支持');
                    case '52004':
                        throw new Error('账户余额不足，请充值');
                    case '52005':
                        throw new Error('账户无效，请检查API密钥');
                    default:
                        throw new Error(`API错误: ${data.error_code} - ${data.error_msg}`);
                }
            }
            
            // 返回翻译结果
            if (data.trans_result && data.trans_result.length > 0) {
                return data.trans_result.map(item => item.dst).join('\n');
            } else {
                throw new Error('翻译结果为空');
            }
        } catch (error) {
            console.error('翻译API调用失败:', error);
            
            // 如果API调用失败，抛出错误而不是返回模拟结果
            // 这样可以让用户知道真实API调用失败了
            throw error;
        }
    }

    // 模拟翻译功能（作为API调用失败时的后备方案）
    mockTranslation(query, from, to) {
        console.log(`使用模拟翻译: 从 ${from} 到 ${to}, 内容: ${query.substring(0, 50)}...`);
        
        // 创建一个简单的翻译映射用于演示
        const translations = {
            'hello world': {
                'zh': '你好世界',
                'ja': 'こんにちは世界',
                'ko': '안녕하세요 세계',
                'fr': 'Bonjour le monde',
                'de': 'Hallo Welt',
                'es': 'Hola mundo',
                'ru': 'Привет мир',
                'it': 'Ciao mondo',
                'pt': 'Olá mundo',
                'ar': 'مرحبا بالعالم'
            },
            'good morning': {
                'zh': '早上好',
                'ja': 'おはようございます',
                'ko': '좋은 아침',
                'fr': 'bonjour',
                'de': 'Guten Morgen',
                'es': 'buenos días',
                'ru': 'доброе утро',
                'it': 'buongiorno',
                'pt': 'bom dia',
                'ar': 'صباح الخير'
            },
            'thank you': {
                'zh': '谢谢',
                'ja': 'ありがとう',
                'ko': '감사합니다',
                'fr': 'merci',
                'de': 'danke',
                'es': 'gracias',
                'ru': 'спасибо',
                'it': 'grazie',
                'pt': 'obrigado',
                'ar': 'شكراً'
            }
        };

        const lowerQuery = query.toLowerCase();
        if (translations[lowerQuery] && translations[lowerQuery][to]) {
            return translations[lowerQuery][to];
        }

        // 如果没有预设翻译，则返回原始文本加上提示
        return `[百度翻译API调用示例]\n${query}\n\n[注意: 实际部署时需要后端API代理来处理CORS和密钥安全]`;
    }

    setLoadingState(tab, isLoading) {
        const btnId = tab === 'text' ? 'translateBtn' : 'docTranslateBtn';
        const button = document.getElementById(btnId);
        
        if (isLoading) {
            button.disabled = true;
            button.textContent = '翻译中...';
        } else {
            button.disabled = false;
            button.textContent = '翻译';
        }
    }
}

// 配置页面逻辑
document.addEventListener('DOMContentLoaded', () => {
    // 初始化翻译应用
    window.app = new TranslationApp();
    
    // 初始化配置页面
    initConfigPage();
});

function initConfigPage() {
    const configForm = document.getElementById('configForm');
    const configStatus = document.getElementById('configStatus');
    
    // 加载当前配置状态
    loadConfigStatus();
    
    if (configForm) {
        configForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const appId = document.getElementById('appId').value.trim();
            const secretKey = document.getElementById('secretKey').value.trim();
            const messageDiv = document.getElementById('configMessage');
            const submitBtn = document.querySelector('.config-btn');
            
            // 禁用按钮防止重复提交
            submitBtn.disabled = true;
            submitBtn.textContent = '保存中...';
            
            try {
                const response = await fetch('/api/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        appId: appId,
                        secretKey: secretKey
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.className = 'config-message success';
                    messageDiv.textContent = '配置保存成功！请重启服务器使配置生效。';
                    configForm.reset();
                    loadConfigStatus();
                } else {
                    messageDiv.className = 'config-message error';
                    messageDiv.textContent = data.error || '保存失败，请重试';
                }
            } catch (error) {
                messageDiv.className = 'config-message error';
                messageDiv.textContent = '网络错误，请检查服务器是否运行';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '保存配置';
            }
        });
    }
    
    async function loadConfigStatus() {
        if (!configStatus) return;
        
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const data = await response.json();
                if (data.appId) {
                    configStatus.innerHTML = `<span class="status-ok">✅ API已配置 (APP ID: ${data.appId})</span>`;
                    document.getElementById('appId').value = data.appId;
                } else {
                    configStatus.innerHTML = `<span class="status-error">⚠️ API未配置，请在下方输入密钥</span>`;
                }
            } else {
                configStatus.innerHTML = `<span class="status-error">❌ 无法获取配置状态</span>`;
            }
        } catch (error) {
            configStatus.innerHTML = `<span class="status-error">❌ 服务器连接失败</span>`;
        }
    }
}

// 导出类供测试使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationApp;
}