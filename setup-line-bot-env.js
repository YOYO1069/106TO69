#!/usr/bin/env node

/**
 * LINE Bot 環境變數自動設定腳本
 * 劉道玄諮詢師預約系統
 */

const fs = require('fs');
const path = require('path');

// LINE Bot 配置資訊
const LINE_BOT_CONFIG = {
    CHANNEL_ID: '2008063743',
    CHANNEL_SECRET: '8462dca808786d5b624f8c2042dedd06',
    CHANNEL_ACCESS_TOKEN: 'Jj8s+B0kNFfpjcbDBDCDjKjJDNlmK8ykGYKWKzmaDT/rEjXoyZi7Y22feHOSXTlKTdZFs3kd1Hxw59MgilIVJzFKg0tKJOKK1xv/ZTZ+oaUuNmUdui/QIbHwNorVo6BW0yHo7eG7vdJJvY9/wxtsfQdB04t89/1O/w1cDnyilFU='
    WEBHOOK_URL: 'https://sage-marigold-0f346a.netlify.app/.netlify/functions/line-webhook',
    OFFICIAL_URL: 'https://lin.ee/vb6ULgR'
};

// 生成 Netlify 環境變數設定檔案
function generateNetlifyEnvVars() {
    const envVars = `# LINE Bot 環境變數設定
# 請將以下內容複製到 Netlify 控制台的環境變數設定中

LINE_CHANNEL_SECRET=${LINE_BOT_CONFIG.CHANNEL_SECRET}
LINE_CHANNEL_ACCESS_TOKEN=${LINE_BOT_CONFIG.CHANNEL_ACCESS_TOKEN}

# 其他已設定的環境變數
OPENAI_API_KEY=sk-YaMbCxSCROsT5dgXWhaPPq35AW79eun8mSCAy14FFI21PY-4JKqUXJ8jO-c3v2_oYOIw4YrNkEb2S6ns-sfe0pRJqedq
GOOGLE_SPREADSHEET_ID=1nmFj0647LO44Gl54DvZEXdNYuZlFLGvueEM1XEqEa8g

# LINE Bot 配置資訊
LINE_CHANNEL_ID=${LINE_BOT_CONFIG.CHANNEL_ID}
LINE_WEBHOOK_URL=${LINE_BOT_CONFIG.WEBHOOK_URL}
LINE_OFFICIAL_URL=${LINE_BOT_CONFIG.OFFICIAL_URL}
`;

    fs.writeFileSync('netlify-line-bot-env.txt', envVars);
    console.log('✅ Netlify 環境變數檔案已生成: netlify-line-bot-env.txt');
}

// 生成 LINE Developers Console 設定指南
function generateLineSetupGuide() {
    const guide = `# LINE Developers Console 設定指南

## 📋 **當前配置資訊**

- **Channel ID**: ${LINE_BOT_CONFIG.CHANNEL_ID}
- **Channel Secret**: ${LINE_BOT_CONFIG.CHANNEL_SECRET}
- **Webhook URL**: ${LINE_BOT_CONFIG.WEBHOOK_URL}
- **LINE 官方帳號**: ${LINE_BOT_CONFIG.OFFICIAL_URL}

## 🔧 **需要完成的設定**

### 1️⃣ **設定 Webhook URL**
在 LINE Developers Console 的 Messaging API 頁面：
\`\`\`
Webhook URL: ${LINE_BOT_CONFIG.WEBHOOK_URL}
Use webhook: 啟用 ✅
Verify: 點擊驗證（應該顯示成功）
\`\`\`

### 2️⃣ **獲取 Channel Access Token**
在 Messaging API 頁面：
1. 找到 "Channel access token" 區域
2. 點擊 "Issue" 生成新的 token
3. 複製生成的 token

### 3️⃣ **其他設定**
- Auto-reply messages: 停用 ❌
- Greeting messages: 啟用 ✅
- Allow bot to join group chats: 停用 ❌

## 🧪 **測試步驟**

1. **Webhook 驗證**: 在 LINE Console 點擊 Verify
2. **加入官方帳號**: ${LINE_BOT_CONFIG.OFFICIAL_URL}
3. **發送測試訊息**: "預約"、"療程"、"你好"
4. **檢查回覆**: 應該收到相應的回覆訊息

## 📱 **預期功能**

### **關鍵字回覆**
- "預約" → 預約選項選單
- "療程" → 療程資訊
- "你好" → 歡迎訊息

### **快速操作**
- 預約傳送門連結
- Google Calendar 整合
- 診所資訊展示

---
**設定完成後，劉道玄諮詢師的 LINE Bot 就可以正常運作了！**
`;

    fs.writeFileSync('LINE_SETUP_CURRENT.md', guide);
    console.log('✅ LINE 設定指南已生成: LINE_SETUP_CURRENT.md');
}

// 驗證 LINE Bot 配置
function validateConfig() {
    console.log('🔍 驗證 LINE Bot 配置...\n');
    
    console.log('📋 當前配置：');
    console.log(`   Channel ID: ${LINE_BOT_CONFIG.CHANNEL_ID}`);
    console.log(`   Channel Secret: ${LINE_BOT_CONFIG.CHANNEL_SECRET}`);
    console.log(`   Webhook URL: ${LINE_BOT_CONFIG.WEBHOOK_URL}`);
    console.log(`   官方帳號: ${LINE_BOT_CONFIG.OFFICIAL_URL}\n`);
    
    if (!LINE_BOT_CONFIG.CHANNEL_ACCESS_TOKEN) {
        console.log('⚠️  缺少 Channel Access Token');
        console.log('   請在 LINE Developers Console 生成 token 後更新此腳本\n');
    }
    
    console.log('✅ 配置驗證完成');
}

// 主要執行函數
function main() {
    console.log('🤖 LINE Bot 環境變數設定工具');
    console.log('劉道玄諮詢師預約系統\n');
    
    validateConfig();
    generateNetlifyEnvVars();
    generateLineSetupGuide();
    
    console.log('\n🎯 下一步：');
    console.log('1. 在 LINE Console 生成 Channel Access Token');
    console.log('2. 更新 netlify-line-bot-env.txt 中的 token');
    console.log('3. 將環境變數複製到 Netlify 控制台');
    console.log('4. 在 LINE Console 設定並驗證 Webhook URL');
    console.log('5. 測試 LINE Bot 功能');
}

// 執行腳本
if (require.main === module) {
    main();
}

module.exports = {
    LINE_BOT_CONFIG,
    generateNetlifyEnvVars,
    generateLineSetupGuide,
    validateConfig
};
