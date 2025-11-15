const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getTreatmentKnowledge, generalFAQ, searchTreatment, searchFAQ, recommendTreatment } = require('./knowledge-base');

// LINE Bot 設定
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Supabase 設定
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://clzjdlykhjwrlksyjlfz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsempkbHlraGp3cmxrc3lqbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTM2ODAsImV4cCI6MjA3NTM2OTY4MH0.V6QAoh4N2aSF5CgDYfKTnY8cMQnDV3AYilj7TbpWJcU';

// Gemini AI 設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 管理員 LINE User ID
const ADMIN_LINE_USER_ID = process.env.ADMIN_LINE_USER_ID;

// 對話狀態管理
const conversationStates = new Map();

// 使用 Gemini AI 進行智能客服
async function handleSmartCustomerService(userId, userMessage, conversationHistory = []) {
  if (!genAI) {
    console.warn('Gemini API not configured');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // 載入療程知識庫
    const treatmentKnowledge = await getTreatmentKnowledge();
    
    // 準備知識庫內容
    const knowledgeContext = `
你是 FLOS 曜診所的專業美容顧問「邊美醬」，親切、專業、細心。

療程知識庫：
${Object.entries(treatmentKnowledge).map(([name, info]) => `
【${name}】
- 描述：${info.description}
- 效果：${info.benefits.join('、')}
- 適合：${info.suitableFor.join('、')}
- 不適合：${info.notSuitableFor.join('、')}
- 療程時間：${info.duration}
- 恢復期：${info.recovery}
- 效果維持：${info.effect}
- 價格範圍：${info.priceRange}
`).join('\n')}

常見問題：
${generalFAQ.map(cat => `
【${cat.category}】
${cat.questions.map(q => `Q: ${q.q}\nA: ${q.a}`).join('\n')}
`).join('\n')}

對話歷史：
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

用戶訊息：${userMessage}

請以 JSON 格式回覆：
{
  "intent": "諮詢 | 預約 | 查詢 | 術後護理 | FAQ | 閒聊",
  "topic": "主題（療程名稱或問題類別）",
  "userConcern": "用戶的主要困擾或問題",
  "recommendedTreatments": ["推薦的療程"],
  "shouldShowDetails": true/false,
  "shouldGuideToBooking": true/false,
  "response": "給用戶的回覆（親切、專業、繁體中文，適當使用 emoji）",
  "confidence": 0.0-1.0
}

注意事項：
1. 回覆要親切、專業、易懂
2. 如果用戶詢問療程細節，提供完整資訊
3. 如果用戶有膚質困擾，推薦適合的療程
4. 適時引導用戶預約或諮詢
5. 使用適當的 emoji 讓對話更親切
6. 如果涉及醫療建議，提醒用戶需由醫師評估`;

    const result = await model.generateContent(knowledgeContext);
    const response = result.response.text();
    
    // 提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
}

// 生成療程詳細資訊 Flex Message
function generateTreatmentDetailMessage(treatment) {
  return {
    type: 'flex',
    altText: `${treatment.name} 療程介紹`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${treatment.emoji} ${treatment.name}`,
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#E91E63',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: treatment.description,
            wrap: true,
            size: 'sm',
            color: '#666666',
            margin: 'md'
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '✨ 療程效果',
                weight: 'bold',
                color: '#E91E63',
                size: 'sm'
              },
              ...treatment.benefits.slice(0, 4).map(benefit => ({
                type: 'text',
                text: `• ${benefit}`,
                size: 'xs',
                color: '#666666',
                wrap: true
              }))
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '⏱️', size: 'sm', flex: 0 },
                  { type: 'text', text: '療程時間', color: '#aaaaaa', size: 'xs', flex: 2 },
                  { type: 'text', text: treatment.duration, wrap: true, color: '#666666', size: 'xs', flex: 5 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '🏥', size: 'sm', flex: 0 },
                  { type: 'text', text: '恢復期', color: '#aaaaaa', size: 'xs', flex: 2 },
                  { type: 'text', text: treatment.recovery, wrap: true, color: '#666666', size: 'xs', flex: 5 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '⭐', size: 'sm', flex: 0 },
                  { type: 'text', text: '效果維持', color: '#aaaaaa', size: 'xs', flex: 2 },
                  { type: 'text', text: treatment.effect, wrap: true, color: '#666666', size: 'xs', flex: 5 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '💰', size: 'sm', flex: 0 },
                  { type: 'text', text: '價格範圍', color: '#aaaaaa', size: 'xs', flex: 2 },
                  { type: 'text', text: treatment.priceRange, wrap: true, color: '#666666', size: 'xs', flex: 5 }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'message',
              label: '查看術後護理',
              text: `${treatment.name}術後護理`
            },
            color: '#E91E63'
          },
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'message',
              label: '立即預約',
              text: `我要預約${treatment.name}`
            },
            color: '#FF4081'
          },
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'message',
              label: '更多問題',
              text: `${treatment.name}常見問題`
            }
          }
        ],
        flex: 0
      }
    }
  };
}

// 生成術後護理 Flex Message
function generateAftercareMessage(treatment) {
  return {
    type: 'flex',
    altText: `${treatment.name} 術後護理`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${treatment.emoji} ${treatment.name}`,
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: '術後護理指南',
            size: 'sm',
            color: '#FFFFFF',
            margin: 'xs'
          }
        ],
        backgroundColor: '#E91E63',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '🔴 治療當天',
                weight: 'bold',
                color: '#E91E63',
                size: 'sm'
              },
              ...treatment.aftercare.immediate.map(item => ({
                type: 'text',
                text: `• ${item}`,
                size: 'xs',
                color: '#666666',
                wrap: true
              }))
            ]
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '🟡 第一週',
                weight: 'bold',
                color: '#FF9800',
                size: 'sm'
              },
              ...treatment.aftercare.firstWeek.map(item => ({
                type: 'text',
                text: `• ${item}`,
                size: 'xs',
                color: '#666666',
                wrap: true
              }))
            ]
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '🟢 長期保養',
                weight: 'bold',
                color: '#4CAF50',
                size: 'sm'
              },
              ...treatment.aftercare.longTerm.map(item => ({
                type: 'text',
                text: `• ${item}`,
                size: 'xs',
                color: '#666666',
                wrap: true
              }))
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '💡 如有任何不適，請立即聯絡診所',
                size: 'xs',
                color: '#999999',
                wrap: true,
                align: 'center'
              }
            ]
          }
        ]
      }
    }
  };
}

// 智能客服主處理函數
async function handleIntelligentCustomerService(userId, userMessage, replyToken) {
  // 載入療程知識庫
  const treatmentKnowledge = await getTreatmentKnowledge();
  
  // 取得對話狀態
  let state = conversationStates.get(userId) || { history: [], context: {} };
  state.history = state.history || [];
  state.history.push({ role: 'user', content: userMessage });
  
  // 檢查是否詢問術後護理
  if (userMessage.includes('術後護理') || userMessage.includes('術後照顧') || userMessage.includes('注意事項')) {
    for (const [name, info] of Object.entries(treatmentKnowledge)) {
      if (userMessage.includes(name)) {
        conversationStates.set(userId, state);
        return await replyMessage(replyToken, [
          { type: 'text', text: `為您整理 ${name} 的術後護理指南 📋` },
          generateAftercareMessage(info)
        ]);
      }
    }
  }
  
  // 檢查是否詢問常見問題
  if (userMessage.includes('常見問題') || userMessage.includes('FAQ')) {
    for (const [name, info] of Object.entries(treatmentKnowledge)) {
      if (userMessage.includes(name)) {
        const faqText = `${name} 常見問題：\n\n` + 
          info.faq.map((item, idx) => `${idx + 1}. ${item.q}\n${item.a}`).join('\n\n');
        
        conversationStates.set(userId, state);
        return await replyMessage(replyToken, [{ type: 'text', text: faqText }]);
      }
    }
  }
  
  // 使用 AI 進行智能分析
  const aiResponse = await handleSmartCustomerService(userId, userMessage, state.history.slice(-10));
  
  if (!aiResponse) {
    // AI 無法處理，使用基本回覆
    return await replyMessage(replyToken, [{
      type: 'text',
      text: '您好！我是邊美醬 🌸\n\n我可以協助您：\n• 療程諮詢\n• 預約服務\n• 術後護理指導\n• 常見問題解答\n\n請告訴我您需要什麼服務？'
    }]);
  }
  
  // 更新對話歷史
  state.history.push({ role: 'assistant', content: aiResponse.response });
  state.context = { ...state.context, lastIntent: aiResponse.intent, lastTopic: aiResponse.topic };
  conversationStates.set(userId, state);
  
  const messages = [];
  
  // 添加 AI 回覆
  messages.push({ type: 'text', text: aiResponse.response });
  
  // 如果需要顯示療程詳情
  if (aiResponse.shouldShowDetails && aiResponse.topic) {
    const treatment = treatmentKnowledge[aiResponse.topic];
    if (treatment) {
      messages.push(generateTreatmentDetailMessage(treatment));
    }
  }
  
  // 如果有推薦療程
  if (aiResponse.recommendedTreatments && aiResponse.recommendedTreatments.length > 0) {
    const treatments = aiResponse.recommendedTreatments
      .map(name => treatmentKnowledge[name])
      .filter(Boolean)
      .slice(0, 3);
    
    if (treatments.length > 0) {
      messages.push({
        type: 'flex',
        altText: '推薦療程',
        contents: {
          type: 'carousel',
          contents: treatments.map(t => ({
            type: 'bubble',
            size: 'micro',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: t.emoji, size: '3xl', align: 'center' },
                { type: 'text', text: t.name, size: 'lg', weight: 'bold', align: 'center', margin: 'md' },
                { type: 'text', text: t.priceRange, size: 'xs', color: '#999999', align: 'center', margin: 'sm' }
              ],
              paddingAll: '20px'
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: { type: 'message', label: '了解更多', text: t.name },
                  style: 'primary',
                  color: '#E91E63',
                  height: 'sm'
                }
              ]
            }
          }))
        }
      });
    }
  }
  
  // 如果應該引導預約
  if (aiResponse.shouldGuideToBooking) {
    messages.push({
      type: 'text',
      text: '想要預約嗎？請告訴我您的姓名、電話和希望的時間，我會立即為您安排！ 📅',
      quickReply: {
        items: [
          { type: 'action', action: { type: 'message', label: '立即預約', text: '我要預約' } },
          { type: 'action', action: { type: 'message', label: '再看看', text: '我再想想' } }
        ]
      }
    });
  }
  
  return await replyMessage(replyToken, messages.slice(0, 5));
}

// 從提取的資訊建立預約
async function createBookingFromExtracted(userId, extracted, replyToken) {
  try {
    // 驗證資料
    if (!extracted.customerPhone || !/^09\d{8}$/.test(extracted.customerPhone)) {
      return await replyMessage(replyToken, [{
        type: 'text',
        text: '電話號碼格式不正確，請提供 10 碼的手機號碼（例如：0912345678）'
      }]);
    }
    
    // 建立預約
    const { data, error } = await supabase
      .from('yuemeiBookings')
      .insert([{
        lineUserId: userId,
        customerName: extracted.customerName,
        customerPhone: extracted.customerPhone,
        treatmentCategory: extracted.treatmentCategory,
        treatmentName: extracted.treatmentName || extracted.treatmentCategory,
        preferredDate: extracted.preferredDate,
        preferredTime: extracted.preferredTime,
        notes: extracted.notes,
        status: 'pending'
      }])
      .select();
    
    if (error) throw error;
    
    // 清除狀態
    conversationStates.delete(userId);
    
    // 發送確認訊息
    await replyMessage(replyToken, [{
      type: 'flex',
      altText: '預約完成',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '✅ 預約完成', weight: 'bold', size: 'xl', color: '#E91E63' },
            { type: 'text', text: '感謝您的預約！我們會盡快確認。', size: 'sm', color: '#999999', margin: 'md', wrap: true },
            { type: 'separator', margin: 'lg' },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '姓名', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: extracted.customerName, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '療程', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: extracted.treatmentCategory, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '日期', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: extracted.preferredDate, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '時段', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: extracted.preferredTime, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]}
              ]
            }
          ]
        },
        styles: { body: { backgroundColor: '#FFF5F7' } }
      }
    }]);
    
    // 通知管理員
    if (ADMIN_LINE_USER_ID) {
      await pushMessage(ADMIN_LINE_USER_ID, [{
        type: 'text',
        text: `🔔 新預約通知\n\n姓名：${extracted.customerName}\n療程：${extracted.treatmentCategory}\n日期：${extracted.preferredDate}\n時段：${extracted.preferredTime}\n電話：${extracted.customerPhone}`
      }]);
    }
    
    return true;
  } catch (error) {
    console.error('Create booking error:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '抱歉，預約建立失敗，請稍後再試或聯絡我們。'
    }]);
    return false;
  }
}

// 驗證 LINE 簽名
function verifySignature(body, signature) {
  if (!LINE_CHANNEL_SECRET) return false;
  const hash = crypto.createHmac('sha256', LINE_CHANNEL_SECRET).update(body, 'utf8').digest('base64');
  return hash === signature;
}

// 發送回覆訊息
async function replyMessage(replyToken, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;
  
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
  
  if (!response.ok) {
    console.error('Failed to send LINE message:', await response.text());
  }
}

// 推送訊息
async function pushMessage(userId, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;
  
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ to: userId, messages })
  });
  
  if (!response.ok) {
    console.error('Failed to push LINE message:', await response.text());
  }
}

// Netlify Function Handler
exports.handler = async (event, context) => {
  // 處理 GET 請求（健康檢查）
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Yuemei Smart Customer Service Bot is running',
        timestamp: new Date().toISOString(),
        aiEnabled: !!GEMINI_API_KEY,
        features: ['智能客服', '療程諮詢', '術後護理', 'FAQ', '智能預約']
      })
    };
  }
  
  // 處理 POST 請求（LINE Webhook）
  if (event.httpMethod === 'POST') {
    try {
      const signature = event.headers['x-line-signature'];
      const body = event.body;
      
      // 驗證簽名
      if (!verifySignature(body, signature)) {
        return { statusCode: 401, body: 'Unauthorized' };
      }
      
      const data = JSON.parse(body);
      
      // 處理每個事件
      for (const evt of data.events) {
        if (evt.type === 'message' && evt.message.type === 'text') {
          const userId = evt.source.userId;
          const userMessage = evt.message.text.trim();
          const replyToken = evt.replyToken;
          
          console.log(`Message from ${userId}: ${userMessage}`);
          
          // 使用智能客服處理
          await handleIntelligentCustomerService(userId, userMessage, replyToken);
        }
      }
      
      return { statusCode: 200, body: 'OK' };
    } catch (error) {
      console.error('Webhook error:', error);
      return { statusCode: 500, body: 'Internal Server Error' };
    }
  }
  
  return { statusCode: 405, body: 'Method Not Allowed' };
};
