const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getTreatmentKnowledge, generalFAQ } = require('./knowledge-base');

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

// 對話狀態管理（使用 Map 儲存用戶預約狀態）
const conversationStates = new Map();

// 預約狀態定義
const BOOKING_STATES = {
  IDLE: 'idle',
  SELECT_BOOKING_TYPE: 'select_booking_type',
  SELECT_TREATMENT: 'select_treatment',
  SELECT_DATE: 'select_date',
  SELECT_TIME: 'select_time',
  INPUT_NAME: 'input_name',
  INPUT_PHONE: 'input_phone',
  SELECT_DOCTOR: 'select_doctor',
  CONFIRM: 'confirm'
};

// 診所營業時間設定
const CLINIC_HOURS = {
  weekday: { start: 10, end: 20 }, // 週一至週五 10:00-20:00
  saturday: { start: 10, end: 18 }, // 週六 10:00-18:00
  sunday: null // 週日公休
};

// 時段間隔（分鐘）
const TIME_SLOT_INTERVAL = 60;

// 醫師列表
const DOCTORS = ['王醫師', '李醫師', '張醫師', '陳醫師'];

/**
 * 生成未來 14 天的日期選項
 */
function generateDateOptions() {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayOfWeek = date.getDay();
    // 跳過週日
    if (dayOfWeek === 0) continue;
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[dayOfWeek];
    
    dates.push({
      date: `${date.getFullYear()}-${month}-${day}`,
      display: `${month}/${day}(${weekDay})`,
      dayOfWeek: dayOfWeek
    });
  }
  
  return dates;
}

/**
 * 生成可用時段選項
 */
function generateTimeSlots(dayOfWeek) {
  const slots = [];
  let hours;
  
  if (dayOfWeek === 6) { // 週六
    hours = CLINIC_HOURS.saturday;
  } else { // 週一至週五
    hours = CLINIC_HOURS.weekday;
  }
  
  if (!hours) return slots;
  
  for (let hour = hours.start; hour < hours.end; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_SLOT_INTERVAL) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }
  
  return slots;
}

/**
 * 生成療程選擇 Carousel
 */
async function generateTreatmentCarousel() {
  const treatments = await getTreatmentKnowledge();
  const treatmentList = Object.values(treatments);
  
  // 每個 Carousel 最多 10 個 bubble
  const bubbles = treatmentList.slice(0, 10).map(treatment => ({
    type: 'bubble',
    size: 'micro',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: treatment.emoji,
          size: '5xl',
          align: 'center',
          gravity: 'center'
        }
      ],
      backgroundColor: '#FFE0F0',
      paddingAll: '20px',
      height: '120px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: treatment.name,
          weight: 'bold',
          size: 'lg',
          align: 'center',
          wrap: true
        },
        {
          type: 'text',
          text: treatment.priceRange,
          size: 'xs',
          color: '#999999',
          align: 'center',
          margin: 'sm'
        }
      ],
      paddingAll: '15px'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '選擇此療程',
            data: `action=select_treatment&treatment=${encodeURIComponent(treatment.name)}`
          },
          style: 'primary',
          color: '#E91E63',
          height: 'sm'
        }
      ],
      paddingAll: '0px'
    }
  }));
  
  return {
    type: 'flex',
    altText: '請選擇療程',
    contents: {
      type: 'carousel',
      contents: bubbles
    }
  };
}

/**
 * 生成日期選擇 Flex Message
 */
function generateDateSelection(step, totalSteps) {
  const dates = generateDateOptions();
  
  // 將日期分成 3 列，每列最多 5 個
  const rows = [];
  for (let i = 0; i < dates.length; i += 5) {
    const rowDates = dates.slice(i, i + 5);
    rows.push({
      type: 'box',
      layout: 'horizontal',
      contents: rowDates.map(d => ({
        type: 'button',
        action: {
          type: 'postback',
          label: d.display,
          data: `action=select_date&date=${d.date}&dayOfWeek=${d.dayOfWeek}`
        },
        style: 'primary',
        color: '#E91E63',
        height: 'md',
        flex: 1,
        margin: 'xs'
      })),
      spacing: 'sm'
    });
  }
  
  return {
    type: 'flex',
    altText: '請選擇日期',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `📅 選擇日期 (${step}/${totalSteps})`,
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: '請選擇您希望的預約日期',
            size: 'sm',
            color: '#FFFFFF',
            margin: 'xs'
          }
        ],
        backgroundColor: '#9C27B0',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: rows,
        spacing: 'sm',
        paddingAll: '20px'
      }
    }
  };
}

/**
 * 生成時段選擇 Flex Message
 */
function generateTimeSelection(dayOfWeek, step, totalSteps) {
  const slots = generateTimeSlots(dayOfWeek);
  
  // 將時段分成多列，每列 3 個
  const rows = [];
  for (let i = 0; i < slots.length; i += 3) {
    const rowSlots = slots.slice(i, i + 3);
    rows.push({
      type: 'box',
      layout: 'horizontal',
      contents: rowSlots.map(time => ({
        type: 'button',
        action: {
          type: 'postback',
          label: time,
          data: `action=select_time&time=${time}`
        },
        style: 'primary',
        color: '#E91E63',
        height: 'md',
        flex: 1,
        margin: 'xs'
      })),
      spacing: 'sm'
    });
  }
  
  return {
    type: 'flex',
    altText: '請選擇時段',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `⏰ 選擇時段 (${step}/${totalSteps})`,
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: '請選擇您希望的時段（每小時一個時段）',
            size: 'sm',
            color: '#FFFFFF',
            margin: 'xs',
            wrap: true
          }
        ],
        backgroundColor: '#9C27B0',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: rows,
        spacing: 'sm',
        paddingAll: '20px'
      }
    }
  };
}

/**
 * 生成醫師選擇 Flex Message
 */
function generateDoctorSelection(step, totalSteps) {
  return {
    type: 'flex',
    altText: '請選擇醫師',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `👨‍⚕️ 選擇醫師 (${step}/${totalSteps})`,
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: '請選擇您希望的醫師',
            size: 'sm',
            color: '#FFFFFF',
            margin: 'xs'
          }
        ],
        backgroundColor: '#9C27B0',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          ...DOCTORS.map((doctor, idx) => ({
            type: 'button',
            action: {
              type: 'postback',
              label: doctor,
              data: `action=select_doctor&doctor=${encodeURIComponent(doctor)}`
            },
            style: 'primary',
            color: '#E91E63',
            height: 'md',
            margin: idx > 0 ? 'sm' : 'none'
          })),
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '不指定醫師',
              data: 'action=select_doctor&doctor=不指定'
            },
            style: 'link',
            height: 'md',
            margin: 'sm'
          }
        ],
        paddingAll: '20px'
      }
    }
  };
}

/**
 * 生成預約確認 Flex Message
 */
function generateBookingConfirmation(bookingData) {
  return {
    type: 'flex',
    altText: '預約確認',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ 確認預約資訊',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#4CAF50',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', text: '療程', size: 'sm', color: '#999999', flex: 2 },
              { type: 'text', text: bookingData.treatment, size: 'sm', wrap: true, flex: 5, weight: 'bold' }
            ],
            spacing: 'sm'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', text: '日期', size: 'sm', color: '#999999', flex: 2 },
              { type: 'text', text: bookingData.date, size: 'sm', flex: 5 }
            ],
            spacing: 'sm',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', text: '時段', size: 'sm', color: '#999999', flex: 2 },
              { type: 'text', text: bookingData.time, size: 'sm', flex: 5 }
            ],
            spacing: 'sm',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', text: '姓名', size: 'sm', color: '#999999', flex: 2 },
              { type: 'text', text: bookingData.name, size: 'sm', flex: 5 }
            ],
            spacing: 'sm',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', text: '電話', size: 'sm', color: '#999999', flex: 2 },
              { type: 'text', text: bookingData.phone, size: 'sm', flex: 5 }
            ],
            spacing: 'sm',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', text: '醫師', size: 'sm', color: '#999999', flex: 2 },
              { type: 'text', text: bookingData.doctor || '不指定', size: 'sm', flex: 5 }
            ],
            spacing: 'sm',
            margin: 'md'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '✅ 確認預約',
              data: 'action=confirm_booking'
            },
            style: 'primary',
            color: '#4CAF50',
            height: 'md'
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '❌ 取消重新預約',
              data: 'action=cancel_booking'
            },
            style: 'link',
            height: 'md',
            margin: 'sm'
          }
        ],
        paddingAll: '15px'
      }
    }
  };
}

/**
 * 處理預約流程
 */
async function handleBookingFlow(userId, event) {
  const state = conversationStates.get(userId) || { 
    state: BOOKING_STATES.IDLE,
    bookingData: {}
  };
  
  // 處理 postback 事件
  if (event.type === 'postback') {
    const params = new URLSearchParams(event.postback.data);
    const action = params.get('action');
    
    switch (action) {
      case 'start_booking':
        // 開始預約流程
        state.state = BOOKING_STATES.SELECT_TREATMENT;
        state.bookingData = {};
        conversationStates.set(userId, state);
        
        return await replyMessage(event.replyToken, [
          { type: 'text', text: '🌸 歡迎預約 FLOS 曜診所療程！\n\n請選擇您想要的療程：' },
          await generateTreatmentCarousel()
        ]);
      
      case 'select_treatment':
        // 選擇療程
        const treatment = params.get('treatment');
        state.bookingData.treatment = treatment;
        state.state = BOOKING_STATES.SELECT_DATE;
        conversationStates.set(userId, state);
        
        return await replyMessage(event.replyToken, [
          { type: 'text', text: `您選擇了：${treatment} ✨` },
          generateDateSelection(2, 5)
        ]);
      
      case 'select_date':
        // 選擇日期
        const date = params.get('date');
        const dayOfWeek = parseInt(params.get('dayOfWeek'));
        state.bookingData.date = date;
        state.bookingData.dayOfWeek = dayOfWeek;
        state.state = BOOKING_STATES.SELECT_TIME;
        conversationStates.set(userId, state);
        
        return await replyMessage(event.replyToken, [
          { type: 'text', text: `您選擇了：${date} 📅` },
          generateTimeSelection(dayOfWeek, 3, 5)
        ]);
      
      case 'select_time':
        // 選擇時段
        const time = params.get('time');
        state.bookingData.time = time;
        state.state = BOOKING_STATES.INPUT_NAME;
        conversationStates.set(userId, state);
        
        // 使用 LIFF 表單輸入姓名和電話
        const liffUrl = `https://rad-paletas-14483a.netlify.app/liff-form.html?userId=${userId}`;
        
        return await replyMessage(event.replyToken, [{
          type: 'flex',
          altText: '請填寫預約資料',
          contents: {
            type: 'bubble',
            size: 'mega',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `✅ 時段已選擇`,
                  weight: 'bold',
                  size: 'lg',
                  color: '#FFFFFF'
                },
                {
                  type: 'text',
                  text: `您選擇了：${time}`,
                  size: 'sm',
                  color: '#FFFFFF',
                  margin: 'xs'
                }
              ],
              backgroundColor: '#9C27B0',
              paddingAll: '20px'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '👉 請點擊下方按鈕填寫預約資料',
                  size: 'md',
                  color: '#333333',
                  wrap: true,
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: '• 姓名\n• 聯絡電話',
                  size: 'sm',
                  color: '#666666',
                  margin: 'md'
                }
              ],
              paddingAll: '20px'
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '📝 填寫預約資料',
                    uri: liffUrl
                  },
                  style: 'primary',
                  color: '#E91E63',
                  height: 'md'
                }
              ],
              paddingAll: '20px'
            }
          }
        }]);
      
      case 'select_doctor':
        // 選擇醫師
        const doctor = params.get('doctor');
        state.bookingData.doctor = doctor === '不指定' ? null : doctor;
        state.state = BOOKING_STATES.CONFIRM;
        conversationStates.set(userId, state);
        
        return await replyMessage(event.replyToken, [
          generateBookingConfirmation(state.bookingData)
        ]);
      
      case 'confirm_booking':
        // 確認預約
        return await confirmBooking(userId, event.replyToken, state.bookingData);
      
      case 'cancel_booking':
        // 取消預約
        conversationStates.delete(userId);
        return await replyMessage(event.replyToken, [{
          type: 'text',
          text: '已取消預約。如需重新預約，請點擊下方選單的「預約」按鈕 🌸'
        }]);
    }
  }
  
  // 處理文字訊息
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text.trim();
    
    // 處理 LIFF 表單回傳資料
    if (text.startsWith('LIFF_FORM_DATA:')) {
      try {
        const formData = JSON.parse(text.replace('LIFF_FORM_DATA:', ''));
        
        if (state.state === BOOKING_STATES.INPUT_NAME) {
          state.bookingData.name = formData.name;
          state.bookingData.phone = formData.phone;
          state.state = BOOKING_STATES.SELECT_DOCTOR;
          conversationStates.set(userId, state);
          
          return await replyMessage(event.replyToken, [
            { type: 'text', text: `收到您的資料！\n姓名：${formData.name}\n電話：${formData.phone} ✅` },
            generateDoctorSelection(4, 5)
          ]);
        }
      } catch (error) {
        console.error('Error parsing LIFF form data:', error);
        return await replyMessage(event.replyToken, [{
          type: 'text',
          text: '❗ 資料處理失敗，請重新填寫'
        }]);
      }
    }
    
    // 根據當前狀態處理輸入
    switch (state.state) {
      case BOOKING_STATES.INPUT_NAME:
        // 輸入姓名
        if (text.length < 2 || text.length > 10) {
          return await replyMessage(event.replyToken, [{
            type: 'text',
            text: '❌ 姓名長度需為 2-10 個字，請重新輸入：'
          }]);
        }
        
        state.bookingData.name = text;
        state.state = BOOKING_STATES.INPUT_PHONE;
        conversationStates.set(userId, state);
        
        return await replyMessage(event.replyToken, [{
          type: 'text',
          text: `您好，${text}！\n\n請輸入您的聯絡電話（格式：0912345678）：`,
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '09xxxxxxxx', text: '09' } }
            ]
          }
        }]);
      
      case BOOKING_STATES.INPUT_PHONE:
        // 輸入電話
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(text)) {
          return await replyMessage(event.replyToken, [{
            type: 'text',
            text: '❌ 電話格式不正確，請輸入 10 碼手機號碼（例如：0912345678）：'
          }]);
        }
        
        state.bookingData.phone = text;
        state.state = BOOKING_STATES.SELECT_DOCTOR;
        conversationStates.set(userId, state);
        
        return await replyMessage(event.replyToken, [
          { type: 'text', text: `電話：${text} ✅` },
          generateDoctorSelection(4, 5)
        ]);
      
      case BOOKING_STATES.IDLE:
      default:
        // 檢查是否為預約相關關鍵字
        if (text.includes('預約') || text.includes('約診') || text.includes('掛號')) {
          state.state = BOOKING_STATES.SELECT_TREATMENT;
          state.bookingData = {};
          conversationStates.set(userId, state);
          
          return await replyMessage(event.replyToken, [
            { type: 'text', text: '🌸 歡迎預約 FLOS 曜診所療程！\n\n請選擇您想要的療程：' },
            await generateTreatmentCarousel()
          ]);
        }
        
        // 其他情況使用智能客服
        return await handleIntelligentCustomerService(userId, text, event.replyToken);
    }
  }
  
  return null;
}

/**
 * 確認預約並儲存到資料庫
 */
async function confirmBooking(userId, replyToken, bookingData) {
  try {
    // 儲存到 Supabase
    const { data, error } = await supabase
      .from('yuemeiBookings')
      .insert([{
        line_user_id: userId,
        customer_name: bookingData.name,
        customer_phone: bookingData.phone,
        treatment_category: bookingData.treatment,
        treatment_name: bookingData.treatment,
        preferred_date: bookingData.date,
        preferred_time: bookingData.time,
        preferred_doctor: bookingData.doctor,
        status: 'pending',
        notes: `透過 LINE Bot 預約（按鈕式流程）`,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('[Supabase] 預約儲存失敗:', error);
      return await replyMessage(replyToken, [{
        type: 'text',
        text: '❌ 預約失敗，請稍後再試或直接聯絡診所。'
      }]);
    }
    
    // 清除對話狀態
    conversationStates.delete(userId);
    
    // 發送確認訊息給客戶
    const confirmMessage = {
      type: 'flex',
      altText: '預約成功',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🎉 預約成功！',
              weight: 'bold',
              size: 'xl',
              color: '#FFFFFF'
            }
          ],
          backgroundColor: '#4CAF50',
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '您的預約已成功送出！',
              size: 'md',
              wrap: true,
              weight: 'bold'
            },
            {
              type: 'text',
              text: '我們會盡快與您聯絡確認預約時間。',
              size: 'sm',
              color: '#666666',
              wrap: true,
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
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: '療程', size: 'sm', color: '#999999', flex: 2 },
                    { type: 'text', text: bookingData.treatment, size: 'sm', wrap: true, flex: 5 }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: '日期', size: 'sm', color: '#999999', flex: 2 },
                    { type: 'text', text: bookingData.date, size: 'sm', flex: 5 }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: '時段', size: 'sm', color: '#999999', flex: 2 },
                    { type: 'text', text: bookingData.time, size: 'sm', flex: 5 }
                  ],
                  margin: 'sm'
                }
              ]
            }
          ],
          paddingAll: '20px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '💡 預約前一天我們會提醒您',
              size: 'xs',
              color: '#999999',
              align: 'center'
            }
          ],
          paddingAll: '15px'
        }
      }
    };
    
    await replyMessage(replyToken, [confirmMessage]);
    
    // 通知管理員
    if (ADMIN_LINE_USER_ID) {
      await pushMessage(ADMIN_LINE_USER_ID, [{
        type: 'text',
        text: `🔔 新預約通知\n\n療程：${bookingData.treatment}\n日期：${bookingData.date}\n時段：${bookingData.time}\n姓名：${bookingData.name}\n電話：${bookingData.phone}\n醫師：${bookingData.doctor || '不指定'}`
      }]);
    }
    
    return true;
  } catch (error) {
    console.error('[確認預約] 錯誤:', error);
    return await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ 預約失敗，請稍後再試或直接聯絡診所。'
    }]);
  }
}

/**
 * 智能客服處理（保留原有功能）
 */
async function handleIntelligentCustomerService(userId, userMessage, replyToken) {
  // 載入療程知識庫
  const treatmentKnowledge = await getTreatmentKnowledge();
  
  // 檢查是否詢問術後護理
  if (userMessage.includes('術後護理') || userMessage.includes('術後照顧') || userMessage.includes('注意事項')) {
    for (const [name, info] of Object.entries(treatmentKnowledge)) {
      if (userMessage.includes(name)) {
        return await replyMessage(replyToken, [{
          type: 'text',
          text: `為您整理 ${name} 的術後護理指南 📋\n\n🔴 治療當天：\n${info.aftercare.immediate.map(i => `• ${i}`).join('\n')}\n\n🟡 第一週：\n${info.aftercare.firstWeek.map(i => `• ${i}`).join('\n')}\n\n🟢 長期保養：\n${info.aftercare.longTerm.map(i => `• ${i}`).join('\n')}`
        }]);
      }
    }
  }
  
  // 基本回覆
  return await replyMessage(replyToken, [{
    type: 'text',
    text: '您好！我是邊美醬 🌸\n\n我可以協助您：\n• 預約療程\n• 療程諮詢\n• 術後護理指導\n• 常見問題解答\n\n請告訴我您需要什麼服務？',
    quickReply: {
      items: [
        { type: 'action', action: { type: 'postback', label: '📅 我要預約', data: 'action=start_booking' } },
        { type: 'action', action: { type: 'message', label: '💬 療程諮詢', text: '療程諮詢' } },
        { type: 'action', action: { type: 'message', label: '🔍 查詢預約', text: '查詢預約' } }
      ]
    }
  }]);
}

/**
 * 回覆訊息
 */
async function replyMessage(replyToken, messages) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: messages
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LINE API] Reply failed:', errorText);
    }
    
    return response.ok;
  } catch (error) {
    console.error('[LINE API] Reply error:', error);
    return false;
  }
}

/**
 * 推送訊息
 */
async function pushMessage(userId, messages) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: userId,
        messages: messages
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('[LINE API] Push error:', error);
    return false;
  }
}

/**
 * 驗證 LINE Webhook 簽名
 */
function validateSignature(body, signature) {
  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

/**
 * Netlify Function Handler
 */
exports.handler = async (event, context) => {
  // 健康檢查
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Yuemei LINE Bot Webhook (Button Flow) is running',
        timestamp: new Date().toISOString()
      })
    };
  }
  
  // 處理 POST 請求
  if (event.httpMethod === 'POST') {
    // 驗證簽名
    const signature = event.headers['x-line-signature'];
    if (!validateSignature(event.body, signature)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }
    
    try {
      const body = JSON.parse(event.body);
      
      // 處理每個事件
      for (const evt of body.events) {
        const userId = evt.source.userId;
        
        // 處理預約流程
        await handleBookingFlow(userId, evt);
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('[Webhook] Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
