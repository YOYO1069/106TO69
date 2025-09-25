const crypto = require('crypto');

// LINE Bot 設定
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// 劉道玄諮詢師 LINE 官方帳號設定
const LINE_OFFICIAL_URL = 'https://lin.ee/vb6ULgR';
const BOOKING_PORTAL_URL = 'https://sage-marigold-0f346a.netlify.app/booking-portal.html';
const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=6bef0ee912b7ee1742123668e09eff427c258884010b7d36add1d1c9b1510658%40group.calendar.google.com&ctz=Asia%2FTaipei';

// 驗證 LINE 簽名
function verifySignature(body, signature) {
    if (!LINE_CHANNEL_SECRET) {
        console.error('LINE_CHANNEL_SECRET not set');
        return false;
    }
    
    // 如果是測試請求，跳過簽名驗證
    if (signature === 'test-signature') {
        return true;
    }
    
    const hash = crypto
        .createHmac('sha256', LINE_CHANNEL_SECRET)
        .update(body, 'utf8')
        .digest('base64');
    
    return hash === signature;
}

// 發送回覆訊息到 LINE
async function replyMessage(replyToken, messages) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
        console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
        return;
    }

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
        console.error('Failed to send LINE message:', await response.text());
    }
}

// 處理預約相關訊息
function handleAppointmentMessage(messageText, userId) {
    const appointmentKeywords = ['預約', '掛號', '約診', '看診', '諮詢'];
    const isAppointmentRelated = appointmentKeywords.some(keyword => 
        messageText.includes(keyword)
    );

    if (isAppointmentRelated) {
        return [
            {
                type: 'text',
                text: '✨ 歡迎預約劉道玄諮詢師美容諮詢！\n\n🏢 診所地址：台灣台北市忠孝復興\n📞 聯絡方式：請透過線上預約系統\n🌐 官方網站：https://sage-marigold-0f346a.netlify.app\n\n請選擇預約方式：'
            },
            {
                type: 'template',
                altText: '預約選項',
                template: {
                    type: 'buttons',
                    title: '劉道玄諮詢師預約',
                    text: '請選擇您偏好的預約方式',
                    actions: [
                        {
                            type: 'uri',
                            label: '📅 預約傳送門',
                            uri: BOOKING_PORTAL_URL
                        },
                        {
                            type: 'uri',
                            label: '🗓️ 查看行事曆',
                            uri: GOOGLE_CALENDAR_URL
                        },
                        {
                            type: 'message',
                            label: '💬 諮詢服務',
                            text: '我想了解諮詢服務'
                        }
                    ]
                }
            }
        ];
    }

    return null;
}

// 處理療程諮詢訊息
function handleTreatmentMessage(messageText) {
    const treatmentKeywords = ['療程', '治療', '肉毒', '玻尿酸', '雷射', '美白', '點滴'];
    const isTreatmentRelated = treatmentKeywords.some(keyword => 
        messageText.includes(keyword)
    );

    if (isTreatmentRelated) {
        return [
            {
                type: 'text',
                text: '💉 我們提供以下專業療程：\n\n🔸 肉毒桿菌注射\n🔸 玻尿酸填充\n🔸 雷射治療\n🔸 臉部護理\n🔸 美白點滴\n🔸 震波治療\n\n詳細諮詢請預約門診或聯絡我們的專業團隊！'
            },
            {
                type: 'template',
                altText: '療程資訊',
                template: {
                    type: 'carousel',
                    columns: [
                        {
                            title: '肉毒桿菌注射',
                            text: '改善動態皺紋，效果自然',
                            actions: [
                                {
                                    type: 'message',
                                    label: '了解更多',
                                    text: '肉毒桿菌詳細資訊'
                                }
                            ]
                        },
                        {
                            title: '玻尿酸填充',
                            text: '增加容積，修飾輪廓',
                            actions: [
                                {
                                    type: 'message',
                                    label: '了解更多',
                                    text: '玻尿酸詳細資訊'
                                }
                            ]
                        },
                        {
                            title: '雷射治療',
                            text: '改善膚質，淡化色斑',
                            actions: [
                                {
                                    type: 'message',
                                    label: '了解更多',
                                    text: '雷射治療詳細資訊'
                                }
                            ]
                        }
                    ]
                }
            }
        ];
    }

    return null;
}

// 處理劉道玄相關訊息
function handleLiuDaoxuanMessage(messageText) {
    const liuKeywords = ['劉道玄', '劉醫師', '推薦', '介紹'];
    const isLiuRelated = liuKeywords.some(keyword => 
        messageText.includes(keyword)
    );

    if (isLiuRelated) {
        return [
            {
                type: 'text',
                text: '🌟 感謝劉道玄的推薦！\n\n您是劉道玄推薦的貴賓客戶，我們將為您提供專屬的優質服務。\n\n請告知您的需求，我們會安排最適合的療程方案。'
            },
            {
                type: 'template',
                altText: '劉道玄專屬服務',
                template: {
                    type: 'buttons',
                    title: '劉道玄推薦專案',
                    text: '專屬優惠與服務',
                    actions: [
                        {
                            type: 'uri',
                            label: '專屬預約通道',
                            uri: 'https://sage-marigold-0f346a.netlify.app/appointment_scheduling_system.html?source=liu_daoxuan'
                        },
                        {
                            type: 'message',
                            label: '專屬優惠方案',
                            text: '劉道玄專屬優惠'
                        }
                    ]
                }
            }
        ];
    }

    return null;
}

// 處理聯絡資訊訊息
function handleContactMessage(messageText) {
    const contactKeywords = ['聯絡', '電話', '地址', '位置', '怎麼去', '交通'];
    const isContactRelated = contactKeywords.some(keyword => 
        messageText.includes(keyword)
    );

    if (isContactRelated) {
        return [
            {
                type: 'text',
                text: '📍 Flos 曜診所聯絡資訊\n\n📞 電話：請透過線上預約系統\n⏰ 營業時間：\n　週二-五：12:00-20:00\n　週六：11:00-20:00\n　週日、週一：休診\n\n💻 線上預約：24小時開放'
            },
            {
                type: 'template',
                altText: '聯絡方式',
                template: {
                    type: 'buttons',
                    title: '聯絡我們',
                    text: '選擇聯絡方式',
                    actions: [
                        {
                            type: 'uri',
                            label: '線上預約',
                            uri: 'https://sage-marigold-0f346a.netlify.app'
                        },
                        {
                            type: 'message',
                            label: '營業時間',
                            text: '營業時間查詢'
                        }
                    ]
                }
            }
        ];
    }

    return null;
}

// 處理價格諮詢訊息
function handlePriceMessage(messageText) {
    const priceKeywords = ['價格', '費用', '多少錢', '收費', '價位'];
    const isPriceRelated = priceKeywords.some(keyword => 
        messageText.includes(keyword)
    );

    if (isPriceRelated) {
        return [
            {
                type: 'text',
                text: '💰 療程費用說明\n\n我們的收費透明公開，會根據個人需求提供客製化方案。\n\n建議您預約諮詢，讓專業醫師評估後提供最適合的療程建議與報價。'
            },
            {
                type: 'template',
                altText: '費用諮詢',
                template: {
                    type: 'buttons',
                    title: '費用諮詢',
                    text: '了解詳細費用',
                    actions: [
                        {
                            type: 'uri',
                            label: '預約諮詢',
                            uri: 'https://sage-marigold-0f346a.netlify.app/appointment_scheduling_system.html'
                        },
                        {
                            type: 'message',
                            label: '療程項目',
                            text: '療程項目'
                        }
                    ]
                }
            }
        ];
    }

    return null;
}

// 處理預約確認訊息
function handleAppointmentConfirmation(messageText) {
    if (messageText.includes('我要電話預約')) {
        return [
            {
                type: 'text',
                text: '📞 電話預約說明\n\n由於我們重視服務品質，建議您使用線上預約系統，可以：\n\n✅ 即時查看可預約時段\n✅ 選擇適合的療程項目\n✅ 填寫詳細需求\n✅ 收到預約確認通知\n\n如需人工協助，請在營業時間內聯絡我們。'
            }
        ];
    }

    return null;
}

// 主要訊息處理函數
function processMessage(messageText, userId) {
    // 轉換為小寫以便比對
    const text = messageText.toLowerCase();

    // 問候語處理
    if (text.includes('你好') || text.includes('哈囉') || text.includes('hello')) {
        return [
            {
                type: 'text',
                text: '您好！歡迎來到劉道玄醫美 & Flos 曜診所 LINE 官方帳號！👋\n\n我們提供專業的醫美療程服務，包括：\n🔸 肉毒桿菌注射\n🔸 玻尿酸填充\n🔸 雷射治療\n🔸 美白點滴\n\n有任何問題都可以詢問我喔！'
            },
            {
                type: 'template',
                altText: '服務選單',
                template: {
                    type: 'buttons',
                    title: '我可以幫您什麼？',
                    text: '請選擇您需要的服務',
                    actions: [
                        {
                            type: 'message',
                            label: '我要預約',
                            text: '我要預約'
                        },
                        {
                            type: 'message',
                            label: '療程諮詢',
                            text: '療程項目'
                        },
                        {
                            type: 'message',
                            label: '聯絡資訊',
                            text: '聯絡方式'
                        }
                    ]
                }
            }
        ];
    }

    // 依序檢查各種訊息類型
    let response = handleAppointmentMessage(messageText, userId) ||
                  handleTreatmentMessage(messageText) ||
                  handleLiuDaoxuanMessage(messageText) ||
                  handleContactMessage(messageText) ||
                  handlePriceMessage(messageText) ||
                  handleAppointmentConfirmation(messageText);

    // 如果沒有匹配到特定類型，返回預設回應
    if (!response) {
        response = [
            {
                type: 'text',
                text: '感謝您的訊息！😊\n\n如果您需要：\n🔸 預約服務 → 輸入「預約」\n🔸 療程諮詢 → 輸入「療程」\n🔸 聯絡資訊 → 輸入「聯絡」\n🔸 費用諮詢 → 輸入「價格」\n\n或直接告訴我您的需求，我會盡力協助您！'
            }
        ];
    }

    return response;
}

// Netlify Functions 主要處理函數
exports.handler = async (event, context) => {
    // 處理 GET 請求（用於測試）
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: 'LINE Bot Webhook is running',
                timestamp: new Date().toISOString(),
                endpoints: {
                    line_official: LINE_OFFICIAL_URL,
                    booking_portal: BOOKING_PORTAL_URL,
                    google_calendar: GOOGLE_CALENDAR_URL
                }
            })
        };
    }

    // 只處理 POST 請求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // 驗證 LINE 簽名
        const signature = event.headers['x-line-signature'];
        const body = event.body;

        // 如果沒有設定環境變數，返回配置錯誤
        if (!LINE_CHANNEL_SECRET && signature !== 'test-signature') {
            console.error('LINE_CHANNEL_SECRET not configured');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    error: 'LINE Bot not configured',
                    message: 'Please set LINE_CHANNEL_SECRET and LINE_CHANNEL_ACCESS_TOKEN in Netlify environment variables'
                })
            };
        }

        if (!verifySignature(body, signature)) {
            console.error('Invalid signature');
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ error: 'Invalid signature' })
            };
        }

        // 解析請求內容
        const data = JSON.parse(body);
        
        // 處理每個事件
        for (const eventItem of data.events) {
            if (eventItem.type === 'message' && eventItem.message.type === 'text') {
                const messageText = eventItem.message.text;
                const userId = eventItem.source.userId;
                const replyToken = eventItem.replyToken;

                console.log(`Received message: ${messageText} from user: ${userId}`);

                // 處理訊息並生成回應
                const replyMessages = processMessage(messageText, userId);

                // 發送回覆
                await replyMessage(replyToken, replyMessages);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Error processing LINE webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// 測試用的本地處理函數
if (require.main === module) {
    // 本地測試
    const testMessage = '你好';
    const testUserId = 'test-user-123';
    
    console.log('Testing message processing...');
    const response = processMessage(testMessage, testUserId);
    console.log('Response:', JSON.stringify(response, null, 2));
}
