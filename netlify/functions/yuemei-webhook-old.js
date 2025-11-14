const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// LINE Bot 設定
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Supabase 設定
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://clzjdlykhjwrlksyjlfz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsempkbHlraGp3cmxrc3lqbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTM2ODAsImV4cCI6MjA3NTM2OTY4MH0.V6QAoh4N2aSF5CgDYfKTnY8cMQnDV3AYilj7TbpWJcU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 管理員 LINE User ID（從環境變數讀取）
const ADMIN_LINE_USER_ID = process.env.ADMIN_LINE_USER_ID;

// 預約狀態管理（使用記憶體，生產環境應使用 Redis）
const bookingStates = new Map();

// 療程分類
const treatmentCategories = [
  { id: 'hydration', name: '水光針', emoji: '💧' },
  { id: 'microneedle', name: '微針', emoji: '💉' },
  { id: 'hairremoval', name: '除毛', emoji: '✨' },
  { id: 'botox', name: '肉毒', emoji: '💫' },
  { id: 'hairgrowth', name: '育髮', emoji: '🌱' },
  { id: 'laser', name: '雷射', emoji: '⚡' },
  { id: 'hifu', name: '電音波', emoji: '🔊' },
  { id: 'iv', name: '點滴', emoji: '💊' },
  { id: 'bodysculpt', name: '體雕', emoji: '💪' },
  { id: 'coolsculpt', name: '酷捷', emoji: '❄️' },
  { id: 'shockwave', name: '體外震波', emoji: '🌊' },
];

// 時段選項
const timeSlots = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

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

// 取得療程分類選擇訊息
function getCategorySelectionMessage() {
  return {
    type: 'flex',
    altText: '請選擇療程分類',
    contents: {
      type: 'carousel',
      contents: treatmentCategories.map(cat => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: cat.emoji, size: '3xl', align: 'center' },
            { type: 'text', text: cat.name, size: 'lg', weight: 'bold', align: 'center', margin: 'md' }
          ],
          paddingAll: 'lg',
          action: { type: 'message', label: cat.name, text: `選擇分類：${cat.name}` }
        },
        styles: { body: { backgroundColor: '#FFF5F7' } }
      }))
    }
  };
}

// 處理預約流程
async function handleBookingFlow(userId, messageText, replyToken) {
  const currentState = bookingStates.get(userId);

  // 開始預約
  if (!currentState && (messageText.includes('預約') || messageText.includes('掛號'))) {
    bookingStates.set(userId, { step: 'category', data: {} });
    await replyMessage(replyToken, [getCategorySelectionMessage()]);
    return;
  }

  // 取消預約
  if (messageText === '取消預約' || messageText === '重新開始') {
    bookingStates.delete(userId);
    await replyMessage(replyToken, [{ type: 'text', text: '已取消預約流程。如需重新預約，請輸入「預約」。' }]);
    return;
  }

  if (!currentState) {
    await handleGeneralMessage(userId, messageText, replyToken);
    return;
  }

  // 根據步驟處理
  switch (currentState.step) {
    case 'category':
      await handleCategorySelection(userId, messageText, replyToken, currentState);
      break;
    case 'treatment':
      await handleTreatmentSelection(userId, messageText, replyToken, currentState);
      break;
    case 'name':
      await handleNameInput(userId, messageText, replyToken, currentState);
      break;
    case 'phone':
      await handlePhoneInput(userId, messageText, replyToken, currentState);
      break;
    case 'date':
      await handleDateInput(userId, messageText, replyToken, currentState);
      break;
    case 'time':
      await handleTimeInput(userId, messageText, replyToken, currentState);
      break;
    case 'notes':
      await handleNotesInput(userId, messageText, replyToken, currentState);
      break;
  }
}

// 處理分類選擇
async function handleCategorySelection(userId, messageText, replyToken, state) {
  const selectedCategory = treatmentCategories.find(cat => messageText.includes(cat.name));
  
  if (!selectedCategory) {
    await replyMessage(replyToken, [{ type: 'text', text: '請選擇有效的療程分類，或輸入「取消預約」結束流程。' }]);
    return;
  }

  state.data.category = selectedCategory.name;
  state.step = 'treatment';
  bookingStates.set(userId, state);

  await replyMessage(replyToken, [{
    type: 'text',
    text: `您選擇了「${selectedCategory.emoji} ${selectedCategory.name}」\n\n請輸入您想要的療程名稱\n\n💡 輸入「取消預約」可重新開始`
  }]);
}

// 處理療程選擇
async function handleTreatmentSelection(userId, messageText, replyToken, state) {
  state.data.treatment = messageText;
  state.step = 'name';
  bookingStates.set(userId, state);

  await replyMessage(replyToken, [{ type: 'text', text: `✅ 療程：${messageText}\n\n請輸入您的姓名：` }]);
}

// 處理姓名輸入
async function handleNameInput(userId, messageText, replyToken, state) {
  if (messageText.length < 2) {
    await replyMessage(replyToken, [{ type: 'text', text: '請輸入有效的姓名（至少2個字）' }]);
    return;
  }

  state.data.name = messageText;
  state.step = 'phone';
  bookingStates.set(userId, state);

  await replyMessage(replyToken, [{ type: 'text', text: `✅ 姓名：${messageText}\n\n請輸入您的聯絡電話：` }]);
}

// 處理電話輸入
async function handlePhoneInput(userId, messageText, replyToken, state) {
  const phoneRegex = /^09\d{8}$/;
  if (!phoneRegex.test(messageText.replace(/[-\s]/g, ''))) {
    await replyMessage(replyToken, [{ type: 'text', text: '請輸入有效的手機號碼（格式：09xxxxxxxx）' }]);
    return;
  }

  state.data.phone = messageText;
  state.step = 'date';
  bookingStates.set(userId, state);

  await replyMessage(replyToken, [{
    type: 'text',
    text: `✅ 電話：${messageText}\n\n請輸入希望預約的日期（格式：YYYY-MM-DD，例如：2025-11-20）：`
  }]);
}

// 處理日期輸入
async function handleDateInput(userId, messageText, replyToken, state) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(messageText)) {
    await replyMessage(replyToken, [{ type: 'text', text: '請輸入正確的日期格式（YYYY-MM-DD）' }]);
    return;
  }

  const selectedDate = new Date(messageText);
  if (selectedDate < new Date()) {
    await replyMessage(replyToken, [{ type: 'text', text: '預約日期不能早於今天，請重新輸入' }]);
    return;
  }

  state.data.date = messageText;
  state.step = 'time';
  bookingStates.set(userId, state);

  await replyMessage(replyToken, [{
    type: 'flex',
    altText: '請選擇時段',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '請選擇時段', weight: 'bold', size: 'xl', margin: 'md' },
          { type: 'text', text: `日期：${messageText}`, size: 'sm', color: '#999999', margin: 'md' },
          { type: 'separator', margin: 'lg' },
          ...timeSlots.map(slot => ({
            type: 'button',
            action: { type: 'message', label: slot, text: `選擇時段：${slot}` },
            style: 'primary',
            color: '#E91E63',
            margin: 'sm'
          }))
        ]
      }
    }
  }]);
}

// 處理時段選擇
async function handleTimeInput(userId, messageText, replyToken, state) {
  const selectedTime = timeSlots.find(slot => messageText.includes(slot));
  
  if (!selectedTime) {
    await replyMessage(replyToken, [{ type: 'text', text: '請選擇有效的時段' }]);
    return;
  }

  state.data.time = selectedTime;
  state.step = 'notes';
  bookingStates.set(userId, state);

  await replyMessage(replyToken, [{
    type: 'text',
    text: `✅ 時段：${selectedTime}\n\n如有其他需求或備註，請輸入；若無，請輸入「無」或「完成」：`
  }]);
}

// 處理備註並完成預約
async function handleNotesInput(userId, messageText, replyToken, state) {
  if (messageText !== '無' && messageText !== '完成') {
    state.data.notes = messageText;
  }

  try {
    // 儲存到 Supabase
    const { data: booking, error } = await supabase
      .from('yuemeiBookings')
      .insert([{
        lineUserId: userId,
        customerName: state.data.name,
        customerPhone: state.data.phone,
        treatmentCategory: state.data.category,
        treatmentName: state.data.treatment,
        preferredDate: state.data.date,
        preferredTime: state.data.time,
        notes: state.data.notes || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // 清除狀態
    bookingStates.delete(userId);

    // 發送確認訊息給客戶
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
            { type: 'text', text: '您的預約已送出，我們會盡快與您確認！', size: 'sm', color: '#999999', margin: 'md', wrap: true },
            { type: 'separator', margin: 'lg' },
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
                    { type: 'text', text: '療程', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: state.data.category, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: '項目', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: state.data.treatment, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: '日期', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: state.data.date, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: '時段', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: state.data.time, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                }
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
        text: `🔔 新預約通知\n\n客戶：${state.data.name}\n電話：${state.data.phone}\n療程：${state.data.category} - ${state.data.treatment}\n日期：${state.data.date}\n時段：${state.data.time}\n\n請盡快確認預約！`
      }]);
    }

  } catch (error) {
    console.error('Failed to create booking:', error);
    bookingStates.delete(userId);
    await replyMessage(replyToken, [{ type: 'text', text: '抱歉，預約過程發生錯誤，請稍後再試或聯絡客服。' }]);
  }
}

// 處理查詢預約
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
      await replyMessage(replyToken, [{ type: 'text', text: '您目前沒有預約記錄。\n\n輸入「預約」開始新的預約！' }]);
      return;
    }

    const statusText = {
      pending: '⏳ 待確認',
      confirmed: '✅ 已確認',
      completed: '✔️ 已完成',
      cancelled: '❌ 已取消'
    };

    const messages = [{
      type: 'text',
      text: `📋 您的預約記錄（最近 ${bookings.length} 筆）：`
    }];

    bookings.forEach((booking, index) => {
      messages.push({
        type: 'flex',
        altText: `預約 ${index + 1}`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: `預約 #${booking.id}`, weight: 'bold', size: 'lg', color: '#E91E63' },
              { type: 'text', text: statusText[booking.status] || booking.status, size: 'sm', color: '#999999', margin: 'xs' },
              { type: 'separator', margin: 'md' },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                spacing: 'sm',
                contents: [
                  {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      { type: 'text', text: '療程', color: '#aaaaaa', size: 'sm', flex: 2 },
                      { type: 'text', text: `${booking.treatmentCategory} - ${booking.treatmentName}`, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      { type: 'text', text: '日期', color: '#aaaaaa', size: 'sm', flex: 2 },
                      { type: 'text', text: booking.preferredDate, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      { type: 'text', text: '時段', color: '#aaaaaa', size: 'sm', flex: 2 },
                      { type: 'text', text: booking.preferredTime, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                    ]
                  }
                ]
              },
              ...(booking.status === 'pending' || booking.status === 'confirmed' ? [{
                type: 'button',
                action: { type: 'message', label: '取消此預約', text: `取消預約 #${booking.id}` },
                style: 'secondary',
                color: '#999999',
                margin: 'md'
              }] : [])
            ]
          },
          styles: { body: { backgroundColor: '#FFF5F7' } }
        }
      });
    });

    await replyMessage(replyToken, messages.slice(0, 5)); // LINE 限制最多 5 則訊息

  } catch (error) {
    console.error('Failed to query bookings:', error);
    await replyMessage(replyToken, [{ type: 'text', text: '查詢預約時發生錯誤，請稍後再試。' }]);
  }
}

// 處理取消預約
async function handleCancelBooking(userId, messageText, replyToken) {
  const match = messageText.match(/取消預約\s*#?(\d+)/);
  if (!match) {
    await replyMessage(replyToken, [{ type: 'text', text: '請提供正確的預約編號，例如：取消預約 #123' }]);
    return;
  }

  const bookingId = parseInt(match[1]);

  try {
    // 檢查預約是否屬於該用戶
    const { data: booking, error: fetchError } = await supabase
      .from('yuemeiBookings')
      .select('*')
      .eq('id', bookingId)
      .eq('lineUserId', userId)
      .single();

    if (fetchError || !booking) {
      await replyMessage(replyToken, [{ type: 'text', text: '找不到此預約記錄，請確認預約編號是否正確。' }]);
      return;
    }

    if (booking.status === 'cancelled') {
      await replyMessage(replyToken, [{ type: 'text', text: '此預約已經取消過了。' }]);
      return;
    }

    if (booking.status === 'completed') {
      await replyMessage(replyToken, [{ type: 'text', text: '已完成的預約無法取消。' }]);
      return;
    }

    // 更新狀態為已取消
    const { error: updateError } = await supabase
      .from('yuemeiBookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    await replyMessage(replyToken, [{
      type: 'text',
      text: `✅ 預約已取消\n\n預約編號：#${bookingId}\n療程：${booking.treatmentCategory} - ${booking.treatmentName}\n日期：${booking.preferredDate}\n時段：${booking.preferredTime}\n\n如需重新預約，請輸入「預約」。`
    }]);

    // 通知管理員
    if (ADMIN_LINE_USER_ID) {
      await pushMessage(ADMIN_LINE_USER_ID, [{
        type: 'text',
        text: `🔔 預約取消通知\n\n客戶：${booking.customerName}\n預約編號：#${bookingId}\n療程：${booking.treatmentCategory} - ${booking.treatmentName}\n日期：${booking.preferredDate}\n時段：${booking.preferredTime}\n\n客戶已取消此預約。`
      }]);
    }

  } catch (error) {
    console.error('Failed to cancel booking:', error);
    await replyMessage(replyToken, [{ type: 'text', text: '取消預約時發生錯誤，請稍後再試或聯絡客服。' }]);
  }
}

// 處理一般訊息
async function handleGeneralMessage(userId, messageText, replyToken) {
  const text = messageText.toLowerCase();

  // 查詢預約
  if (text.includes('查詢') || text.includes('我的預約')) {
    await handleQueryBookings(userId, replyToken);
    return;
  }

  // 取消預約
  if (text.includes('取消預約')) {
    await handleCancelBooking(userId, messageText, replyToken);
    return;
  }

  // 問候語
  if (text.includes('你好') || text.includes('哈囉') || text.includes('hello')) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '您好！歡迎來到 FLOS 曜診所 - 邊美醬 💕\n\n我們提供專業的醫美療程服務！\n\n輸入「預約」開始預約\n輸入「查詢」查看預約記錄\n輸入「療程」查看療程資訊'
    }]);
    return;
  }

  // 療程諮詢
  if (text.includes('療程') || text.includes('項目')) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: `💫 我們提供以下療程分類：\n\n${treatmentCategories.map(cat => `${cat.emoji} ${cat.name}`).join('\n')}\n\n輸入「預約」即可開始預約流程！`
    }]);
    return;
  }

  // 預設回應
  await replyMessage(replyToken, [{
    type: 'text',
    text: '感謝您的訊息！😊\n\n如需預約請輸入「預約」\n查看療程請輸入「療程」\n查詢預約請輸入「查詢」'
  }]);
}

// Netlify Function Handler
exports.handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Yuemei LINE Bot Webhook is running', timestamp: new Date().toISOString() })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const signature = event.headers['x-line-signature'];
    const body = event.body;

    if (!verifySignature(body, signature)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const data = JSON.parse(body);

    for (const eventItem of data.events) {
      if (eventItem.type === 'message' && eventItem.message.type === 'text') {
        const messageText = eventItem.message.text;
        const userId = eventItem.source.userId;
        const replyToken = eventItem.replyToken;

        await handleBookingFlow(userId, messageText, replyToken);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
