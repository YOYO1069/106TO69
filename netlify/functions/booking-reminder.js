const { createClient } = require('@supabase/supabase-js');

// LINE Bot 設定
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Supabase 設定
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://clzjdlykhjwrlksyjlfz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsempkbHlraGp3cmxrc3lqbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTM2ODAsImV4cCI6MjA3NTM2OTY4MH0.V6QAoh4N2aSF5CgDYfKTnY8cMQnDV3AYilj7TbpWJcU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 推送訊息
async function pushMessage(userId, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }
  
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
    throw new Error('Failed to send LINE message');
  }
}

// Netlify Scheduled Function
// 每天早上 9:00 執行（需在 Netlify 設定排程）
exports.handler = async (event, context) => {
  try {
    console.log('Starting booking reminder job...');

    // 計算明天的日期範圍
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // 查詢明天的已確認預約
    const { data: bookings, error } = await supabase
      .from('yuemeiBookings')
      .select('*')
      .eq('status', 'confirmed')
      .gte('preferredDate', tomorrow.toISOString())
      .lte('preferredDate', tomorrowEnd.toISOString());

    if (error) {
      console.error('Failed to fetch bookings:', error);
      throw error;
    }

    console.log(`Found ${bookings?.length || 0} bookings for tomorrow`);

    if (!bookings || bookings.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No bookings to remind', count: 0 })
      };
    }

    // 發送提醒訊息
    let successCount = 0;
    let failCount = 0;

    for (const booking of bookings) {
      try {
        await pushMessage(booking.lineUserId, [{
          type: 'flex',
          altText: '預約提醒',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '🔔 預約提醒', weight: 'bold', size: 'xl', color: '#E91E63' },
                { type: 'text', text: '您明天有預約！', size: 'sm', color: '#999999', margin: 'md' },
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
                { type: 'separator', margin: 'lg' },
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'lg',
                  contents: [
                    { type: 'text', text: '📍 FLOS 曜診所', size: 'sm', color: '#666666' },
                    { type: 'text', text: '請準時到達，期待您的光臨！', size: 'xs', color: '#999999', margin: 'sm', wrap: true }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: '#FFF5F7' } }
          }
        }]);
        
        successCount++;
        console.log(`Reminder sent to user ${booking.lineUserId} for booking #${booking.id}`);
      } catch (error) {
        failCount++;
        console.error(`Failed to send reminder for booking #${booking.id}:`, error);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Booking reminders sent',
        total: bookings.length,
        success: successCount,
        failed: failCount
      })
    };

  } catch (error) {
    console.error('Error in booking reminder job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
