const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// 預約狀態管理
const bookingStates = new Map();

// 療程分類
const treatmentCategories = [
  { id: 'hydration', name: '水光針', emoji: '💧', keywords: ['水光', '水光針', 'hydration'] },
  { id: 'microneedle', name: '微針', emoji: '💉', keywords: ['微針', 'microneedle'] },
  { id: 'hairremoval', name: '除毛', emoji: '✨', keywords: ['除毛', 'hair removal', '脫毛'] },
  { id: 'botox', name: '肉毒', emoji: '💫', keywords: ['肉毒', 'botox'] },
  { id: 'hairgrowth', name: '育髮', emoji: '🌱', keywords: ['育髮', 'hair growth', '生髮'] },
  { id: 'laser', name: '雷射', emoji: '⚡', keywords: ['雷射', 'laser'] },
  { id: 'hifu', name: '電音波', emoji: '🔊', keywords: ['電音波', 'hifu', '音波'] },
  { id: 'iv', name: '點滴', emoji: '💊', keywords: ['點滴', 'iv', '注射'] },
  { id: 'bodysculpt', name: '體雕', emoji: '💪', keywords: ['體雕', 'body sculpt', '塑身'] },
  { id: 'coolsculpt', name: '酷捷', emoji: '❄️', keywords: ['酷捷', 'coolsculpt'] },
  { id: 'shockwave', name: '體外震波', emoji: '🌊', keywords: ['震波', 'shockwave', '體外震波'] },
];

// 使用 Gemini AI 提取預約資訊
async function extractBookingInfo(userMessage, conversationHistory = []) {
  if (!genAI) {
    console.warn('Gemini API not configured');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `你是 FLOS 曜診所的預約助理「邊美醬」。請從用戶訊息中提取預約相關資訊。

療程分類：${treatmentCategories.map(c => c.name).join('、')}

用戶訊息：${userMessage}

對話歷史：
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

請以 JSON 格式回覆，包含以下欄位（如果無法確定則填 null）：
{
  "intent": "預約 | 查詢 | 取消 | 諮詢 | 其他",
  "treatmentCategory": "療程分類名稱（必須是上述分類之一）",
  "treatmentName": "具體療程名稱",
  "customerName": "客戶姓名",
  "customerPhone": "客戶電話（格式：09xxxxxxxx）",
  "preferredDate": "偏好日期（格式：YYYY-MM-DD）",
  "preferredTime": "偏好時段",
  "notes": "備註",
  "confidence": 0.0-1.0,
  "needsClarification": ["需要確認的欄位"],
  "suggestedResponse": "建議回覆給用戶的訊息"
}

注意：
1. 如果用戶說「水光針」，treatmentCategory 應該是「水光針」
2. 電話號碼必須是 10 碼，09 開頭
3. 日期必須是未來的日期
4. 如果資訊不完整，在 needsClarification 列出需要確認的欄位
5. suggestedResponse 要親切、專業，使用繁體中文`;

    const result = await model.generateContent(prompt);
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

// 智能回覆處理
async function handleIntelligentReply(userId, userMessage, replyToken) {
  // 取得對話歷史
  const state = bookingStates.get(userId) || { history: [] };
  state.history = state.history || [];
  state.history.push({ role: 'user', content: userMessage });
  
  // 使用 AI 提取資訊
  const extracted = await extractBookingInfo(userMessage, state.history.slice(-10));
  
  if (!extracted) {
    // AI 無法處理，使用原始流程
    return null;
  }
  
  // 更新狀態
  state.extracted = { ...state.extracted, ...extracted };
  
  // 根據 intent 處理
  if (extracted.intent === '預約') {
    // 檢查是否有足夠資訊
    const required = ['treatmentCategory', 'customerName', 'customerPhone', 'preferredDate', 'preferredTime'];
    const missing = required.filter(field => !state.extracted[field]);
    
    if (missing.length === 0) {
      // 資訊完整，建立預約
      return await createBookingFromExtracted(userId, state.extracted, replyToken);
    } else {
      // 資訊不完整，詢問缺少的資訊
      bookingStates.set(userId, state);
      return await replyMessage(replyToken, [{
        type: 'text',
        text: extracted.suggestedResponse || `好的！我需要一些資訊來幫您預約：\n\n${missing.map(f => {
          const labels = {
            treatmentCategory: '療程分類',
            customerName: '您的姓名',
            customerPhone: '聯絡電話',
            preferredDate: '希望的日期',
            preferredTime: '希望的時段'
          };
          return `• ${labels[f]}`;
        }).join('\n')}\n\n請提供這些資訊，我會幫您安排！`
      }]);
    }
  }
  
  if (extracted.intent === '查詢') {
    return await handleQueryBookings(userId, replyToken);
  }
  
  if (extracted.intent === '諮詢') {
    // 使用 AI 生成諮詢回覆
    return await replyMessage(replyToken, [{
      type: 'text',
      text: extracted.suggestedResponse || '感謝您的詢問！我們的專業團隊會為您提供最適合的療程建議。\n\n如需預約諮詢，請輸入「預約」開始預約流程。'
    }]);
  }
  
  // 其他情況，使用 AI 建議的回覆
  if (extracted.suggestedResponse) {
    state.history.push({ role: 'assistant', content: extracted.suggestedResponse });
    bookingStates.set(userId, state);
    
    return await replyMessage(replyToken, [{
      type: 'text',
      text: extracted.suggestedResponse
    }]);
  }
  
  return null;
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
    bookingStates.delete(userId);
    
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

// 查詢預約
async function handleQueryBookings(userId, replyToken) {
  try {
    const { data: bookings, error } = await supabase
      .from('yuemeiBookings')
      .select('*')
      .eq('lineUserId', userId)
      .order('createdAt', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (!bookings || bookings.length === 0) {
      return await replyMessage(replyToken, [{
        type: 'text',
        text: '您目前沒有預約記錄。\n\n如需預約，請輸入「預約」開始預約流程。'
      }]);
    }
    
    const messages = bookings.map(booking => ({
      type: 'flex',
      altText: '預約記錄',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '📋 預約記錄', weight: 'bold', size: 'lg', color: '#E91E63' },
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              spacing: 'sm',
              contents: [
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '療程', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: booking.treatmentCategory, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '日期', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: booking.preferredDate, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '時段', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: booking.preferredTime, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '狀態', color: '#aaaaaa', size: 'sm', flex: 2 },
                  { type: 'text', text: booking.status === 'pending' ? '待確認' : booking.status === 'confirmed' ? '已確認' : booking.status === 'completed' ? '已完成' : '已取消', wrap: true, color: '#666666', size: 'sm', flex: 5 }
                ]}
              ]
            }
          ]
        }
      }
    }));
    
    return await replyMessage(replyToken, messages.slice(0, 5));
  } catch (error) {
    console.error('Query bookings error:', error);
    return await replyMessage(replyToken, [{
      type: 'text',
      text: '查詢失敗，請稍後再試。'
    }]);
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
        message: 'Yuemei LINE Bot Webhook (AI-Enhanced) is running',
        timestamp: new Date().toISOString(),
        aiEnabled: !!GEMINI_API_KEY
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
          
          // 嘗試使用 AI 智能處理
          const handled = await handleIntelligentReply(userId, userMessage, replyToken);
          
          if (!handled) {
            // AI 無法處理，回退到基本回覆
            await replyMessage(replyToken, [{
              type: 'text',
              text: '您好！我是邊美醬 🌸\n\n我可以協助您：\n• 預約療程\n• 查詢預約記錄\n• 療程諮詢\n\n請告訴我您需要什麼服務？'
            }]);
          }
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
