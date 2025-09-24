# Netlify API 與 OpenAI 整合指南

## 📋 **Netlify API 設定步驟**

### 1. 取得 Netlify Personal Access Token (PAT)

1. 登入 [Netlify Dashboard](https://app.netlify.com/)
2. 前往 **User Settings** → **Applications** → **Personal access tokens**
3. 點擊 **New access token**
4. 輸入描述性名稱（例如：劉道玄諮詢師預約系統）
5. 選擇過期日期
6. 點擊 **Generate token**
7. **複製並安全保存 Token**（離開頁面後無法再次查看）

### 2. Netlify API 基本使用

```bash
# 使用 curl 測試 API
curl -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
     https://api.netlify.com/api/v1/sites
```

### 3. 在專案中設定環境變數

在 Netlify Dashboard 中：
1. 前往您的網站設定
2. **Site settings** → **Environment variables**
3. 添加以下環境變數：
   - `NETLIFY_ACCESS_TOKEN`: 您的 Personal Access Token
   - `OPENAI_API_KEY`: 您的 OpenAI API 金鑰

## 🤖 **OpenAI 整合設定**

### 1. 取得 OpenAI API 金鑰

1. 登入 [OpenAI Platform](https://platform.openai.com/)
2. 前往 **API Keys** 頁面
3. 點擊 **Create new secret key**
4. 複製並安全保存 API 金鑰

### 2. 創建 Netlify Function 整合 OpenAI

```javascript
// netlify/functions/openai-chat.js
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.handler = async (event, context) => {
  // 設定 CORS 標頭
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // 處理 OPTIONS 請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message, context: chatContext } = JSON.parse(event.body);

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是劉道玄諮詢師的AI助理，專門協助處理醫美預約相關問題。請用專業且親切的語氣回答。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: completion.data.choices[0].message.content,
        usage: completion.data.usage
      }),
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI 服務暫時無法使用，請稍後再試',
        details: error.message 
      }),
    };
  }
};
```

### 3. 創建智能預約助理功能

```javascript
// netlify/functions/appointment-ai.js
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userMessage, appointmentData } = JSON.parse(event.body);

    const systemPrompt = `
你是劉道玄諮詢師的專業預約助理AI。請根據以下資訊協助客戶：

劉道玄諮詢師資訊：
- 專業美容諮詢師
- 營業時間：週二-五 12:00-20:00，週六 11:00-20:00
- 每時段最多2位客戶
- 時段間隔：15分鐘

主要服務項目：
- 肉毒桿菌注射
- 玻尿酸填充
- 皮秒雷射
- 電波拉皮
- 線雕拉提

請用專業、親切的語氣回答客戶問題，並適時引導預約。
`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    // 分析是否需要預約
    const needsAppointment = userMessage.includes('預約') || 
                           userMessage.includes('約診') || 
                           userMessage.includes('時間');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: completion.data.choices[0].message.content,
        needsAppointment,
        suggestedActions: needsAppointment ? ['查看可預約時段', '填寫預約表單'] : []
      }),
    };
  } catch (error) {
    console.error('Appointment AI Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI 預約助理暫時無法使用',
        details: error.message 
      }),
    };
  }
};
```

## 🔗 **前端整合範例**

### 1. 在預約表單中添加 AI 助理

```javascript
// js/ai-assistant.js
class AIAssistant {
  constructor() {
    this.apiEndpoint = '/.netlify/functions/appointment-ai';
    this.chatHistory = [];
  }

  async sendMessage(message) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: message,
          appointmentData: this.getAppointmentContext()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.chatHistory.push({
          user: message,
          ai: data.response,
          timestamp: new Date().toISOString()
        });
        
        return data;
      } else {
        throw new Error(data.error || '服務暫時無法使用');
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      return {
        response: '抱歉，AI助理暫時無法回應，請直接聯繫我們。',
        error: true
      };
    }
  }

  getAppointmentContext() {
    return {
      currentDate: new Date().toISOString(),
      availableServices: ['肉毒桿菌', '玻尿酸填充', '皮秒雷射', '電波拉皮', '線雕拉提'],
      businessHours: {
        tuesday: '12:00-20:00',
        wednesday: '12:00-20:00',
        thursday: '12:00-20:00',
        friday: '12:00-20:00',
        saturday: '11:00-20:00'
      }
    };
  }
}

// 全域 AI 助理實例
window.aiAssistant = new AIAssistant();
```

### 2. 在 HTML 中添加 AI 聊天介面

```html
<!-- AI 助理聊天框 -->
<div class="ai-chat-container" id="aiChatContainer">
  <div class="ai-chat-header">
    <i class="fas fa-robot"></i>
    劉道玄諮詢師 AI 預約助理
    <button class="ai-chat-toggle" onclick="toggleAIChat()">
      <i class="fas fa-times"></i>
    </button>
  </div>
  <div class="ai-chat-messages" id="aiChatMessages">
    <div class="ai-message">
      您好！我是劉道玄諮詢師的AI預約助理，有什麼可以為您服務的嗎？
    </div>
  </div>
  <div class="ai-chat-input">
    <input type="text" id="aiChatInput" placeholder="輸入您的問題..." onkeypress="handleAIChatKeyPress(event)">
    <button onclick="sendAIMessage()">
      <i class="fas fa-paper-plane"></i>
    </button>
  </div>
</div>

<!-- AI 助理觸發按鈕 -->
<button class="ai-chat-fab" onclick="toggleAIChat()">
  <i class="fas fa-robot"></i>
</button>
```

## 🚀 **部署設定**

### 1. 更新 netlify.toml

```toml
[build]
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"

[functions]
  node_bundler = "esbuild"
```

### 2. 安裝必要的 npm 套件

```json
{
  "dependencies": {
    "openai": "^3.3.0"
  }
}
```

## 🔐 **安全性考量**

1. **環境變數保護**：絕不在前端代碼中暴露 API 金鑰
2. **請求限制**：實施 rate limiting 防止濫用
3. **輸入驗證**：驗證所有用戶輸入
4. **錯誤處理**：不暴露敏感錯誤資訊

## 📊 **監控和分析**

```javascript
// 添加使用統計
const logAIUsage = async (interaction) => {
  await fetch('/.netlify/functions/log-ai-usage', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      userMessage: interaction.userMessage,
      aiResponse: interaction.aiResponse,
      source: 'appointment-system'
    })
  });
};
```

## 🎯 **實際應用場景**

1. **智能預約引導**：AI 協助客戶選擇合適的療程和時間
2. **常見問題回答**：自動回答價格、療程、恢復期等問題
3. **預約確認**：AI 協助確認預約詳情
4. **後續追蹤**：術後關懷和回訪提醒

這個整合方案讓劉道玄諮詢師的預約系統具備智能對話能力，提升客戶體驗和預約效率。
