/**
 * 劉道玄諮詢師 AI 預約助理
 * 整合 OpenAI GPT 提供智能對話服務
 */

exports.handler = async (event, context) => {
  // 設定 CORS 標頭
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 處理 OPTIONS 請求（CORS preflight）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: '只允許 POST 請求' 
      }),
    };
  }

  try {
    // 檢查 OpenAI API 金鑰
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration error',
          message: 'OpenAI API 金鑰未設定' 
        }),
      };
    }

    // 解析請求內容
    const { message, context: chatContext, appointmentData } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad request',
          message: '請提供訊息內容' 
        }),
      };
    }

    // 使用 fetch 調用 OpenAI API（避免額外依賴）
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是劉道玄諮詢師的專業AI預約助理。請根據以下資訊協助客戶：

劉道玄諮詢師資訊：
- 專業醫美醫師，經驗豐富
- 營業時間：週二-五 12:00-20:00，週六 11:00-20:00
- 每時段最多2位客戶，確保服務品質
- 預約時段間隔：15分鐘

主要服務項目：
1. 肉毒桿菌注射 - 改善動態紋路，價格約 8,000-15,000 元
2. 玻尿酸填充 - 豐唇、填補凹陷，價格約 12,000-25,000 元
3. 皮秒雷射 - 除斑美白，價格約 8,000-20,000 元
4. 電波拉皮 - 緊緻拉提，價格約 30,000-80,000 元
5. 線雕拉提 - 立即拉提效果，價格約 25,000-60,000 元

預約方式：
- LINE 官方帳號（主要）
- Instagram DM
- Facebook 私訊
- 電話預約

請用專業、親切、溫暖的語氣回答客戶問題。
- 適時引導客戶進行預約
- 提供專業建議但不做醫療診斷
- 強調面對面諮詢的重要性
- 回答要簡潔明瞭，不超過200字`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API Error:', errorData);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'AI service error',
          message: 'AI 服務暫時無法使用，請稍後再試或直接聯繫我們',
          details: errorData.error?.message || 'Unknown error'
        }),
      };
    }

    const aiData = await openaiResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content || '抱歉，我無法理解您的問題，請重新描述。';

    // 分析用戶意圖
    const intent = analyzeUserIntent(message);
    
    // 生成建議操作
    const suggestedActions = generateSuggestedActions(intent, message);

    // 記錄使用統計（可選）
    console.log('AI Chat Usage:', {
      timestamp: new Date().toISOString(),
      messageLength: message.length,
      responseLength: aiResponse.length,
      intent: intent,
      usage: aiData.usage
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        intent: intent,
        suggestedActions: suggestedActions,
        usage: aiData.usage,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: '服務暫時無法使用，請稍後再試',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  }
};

/**
 * 分析用戶意圖
 */
function analyzeUserIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('預約') || lowerMessage.includes('約診') || lowerMessage.includes('掛號')) {
    return 'appointment';
  }
  
  if (lowerMessage.includes('價格') || lowerMessage.includes('費用') || lowerMessage.includes('多少錢')) {
    return 'pricing';
  }
  
  if (lowerMessage.includes('時間') || lowerMessage.includes('營業') || lowerMessage.includes('幾點')) {
    return 'schedule';
  }
  
  if (lowerMessage.includes('肉毒') || lowerMessage.includes('玻尿酸') || lowerMessage.includes('雷射') || 
      lowerMessage.includes('電波') || lowerMessage.includes('線雕')) {
    return 'service_inquiry';
  }
  
  if (lowerMessage.includes('地址') || lowerMessage.includes('位置') || lowerMessage.includes('怎麼去')) {
    return 'location';
  }
  
  if (lowerMessage.includes('醫師') || lowerMessage.includes('劉道玄') || lowerMessage.includes('經歷')) {
    return 'doctor_info';
  }
  
  return 'general';
}

/**
 * 生成建議操作
 */
function generateSuggestedActions(intent, message) {
  const actions = [];
  
  switch (intent) {
    case 'appointment':
      actions.push('查看可預約時段', '填寫預約表單', '聯繫客服');
      break;
    case 'pricing':
      actions.push('查看完整價目表', '預約免費諮詢', '了解優惠方案');
      break;
    case 'schedule':
      actions.push('查看營業時間', '立即預約', '設定提醒');
      break;
    case 'service_inquiry':
      actions.push('了解療程詳情', '預約諮詢', '查看案例分享');
      break;
    case 'location':
      actions.push('查看地圖', '交通指南', '停車資訊');
      break;
    case 'doctor_info':
      actions.push('醫師介紹', '專業認證', '成功案例');
      break;
    default:
      actions.push('預約諮詢', '瀏覽服務項目', '聯繫客服');
  }
  
  return actions;
}
