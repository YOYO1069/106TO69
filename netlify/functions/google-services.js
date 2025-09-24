/**
 * Google 服務整合 Netlify Function
 * 處理 Google Auth、Google AI (Gemini)、Google Calendar 的後端邏輯
 */

const { GoogleAuth } = require('google-auth-library');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 環境變數配置
const config = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    gemini: {
        apiKey: process.env.GOOGLE_AI_API_KEY
    },
    calendar: {
        serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    }
};

// Google AI (Gemini) 實例
let geminiAPI = null;
if (config.gemini.apiKey) {
    geminiAPI = new GoogleGenerativeAI(config.gemini.apiKey);
}

exports.handler = async (event, context) => {
    // 設定 CORS 標頭
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // 處理 OPTIONS 請求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { action, data } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'get_google_config':
                return await getGoogleConfig();
            
            case 'gemini_analyze_appointments':
                return await geminiAnalyzeAppointments(data);
            
            case 'gemini_smart_suggestions':
                return await geminiSmartSuggestions(data);
            
            case 'gemini_customer_insights':
                return await geminiCustomerInsights(data);
            
            case 'calendar_sync':
                return await syncToGoogleCalendar(data);
            
            case 'calendar_get_events':
                return await getGoogleCalendarEvents(data);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: '不支援的操作',
                        supportedActions: [
                            'get_google_config',
                            'gemini_analyze_appointments',
                            'gemini_smart_suggestions',
                            'gemini_customer_insights',
                            'calendar_sync',
                            'calendar_get_events'
                        ]
                    })
                };
        }
    } catch (error) {
        console.error('Google 服務錯誤:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Google 服務處理失敗',
                message: error.message 
            })
        };
    }
};

/**
 * 獲取 Google 配置（前端需要的公開配置）
 */
async function getGoogleConfig() {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
            config: {
                GOOGLE_CLIENT_ID: config.google.clientId,
                // 不暴露敏感資訊
                hasGeminiAPI: !!config.gemini.apiKey,
                hasCalendarAPI: !!config.calendar.serviceAccountKey
            }
        })
    };
}

/**
 * 使用 Gemini 分析預約數據
 */
async function geminiAnalyzeAppointments(data) {
    if (!geminiAPI) {
        throw new Error('Google AI (Gemini) 未配置');
    }

    const { appointments, timeRange } = data;
    
    const model = geminiAPI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
作為劉道玄諮詢師的專業 AI 分析助理，請深度分析以下預約數據：

時間範圍：${timeRange}
預約數據：
${JSON.stringify(appointments, null, 2)}

請提供專業的醫美診所營運分析，包括：

1. **預約趨勢分析**
   - 預約量變化趨勢
   - 熱門時段分析
   - 季節性模式識別

2. **客戶行為洞察**
   - 客戶偏好療程分析
   - 回診率和忠誠度
   - 客戶來源效果評估

3. **營運效率評估**
   - 時段利用率分析
   - 醫師工作負荷評估
   - 預約取消率分析

4. **營收優化建議**
   - 價格策略建議
   - 套餐組合推薦
   - 促銷時機建議

5. **服務品質提升**
   - 客戶滿意度改善
   - 服務流程優化
   - 個人化服務建議

請以專業、實用的方式提供具體的數據洞察和行動建議。
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                analysis: analysis,
                timestamp: new Date().toISOString(),
                dataPoints: appointments.length
            })
        };
    } catch (error) {
        throw new Error(`Gemini 分析失敗: ${error.message}`);
    }
}

/**
 * 智能預約建議
 */
async function geminiSmartSuggestions(data) {
    if (!geminiAPI) {
        throw new Error('Google AI (Gemini) 未配置');
    }

    const { customerProfile, availableSlots, preferences } = data;
    
    const model = geminiAPI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
作為劉道玄諮詢師的智能預約助理，請為客戶推薦最適合的預約時段：

客戶資料：
${JSON.stringify(customerProfile, null, 2)}

可用時段：
${JSON.stringify(availableSlots, null, 2)}

客戶偏好：
${JSON.stringify(preferences, null, 2)}

請考慮以下因素：
1. 客戶的時間偏好和可用性
2. 療程類型和所需時間
3. 客戶的歷史預約記錄
4. 最佳的服務體驗時機
5. 醫師的專業建議

請推薦 3 個最佳時段，並為每個推薦提供：
- 推薦理由
- 預期服務品質
- 個人化建議
- 注意事項

以 JSON 格式回應，包含 recommendations 陣列。
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let suggestions = response.text();
        
        // 嘗試解析 JSON 回應
        try {
            suggestions = JSON.parse(suggestions);
        } catch {
            // 如果不是 JSON 格式，包裝成標準格式
            suggestions = {
                recommendations: [
                    {
                        slot: availableSlots[0],
                        reason: suggestions,
                        confidence: 0.8
                    }
                ]
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                suggestions: suggestions,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        throw new Error(`智能建議生成失敗: ${error.message}`);
    }
}

/**
 * 客戶洞察分析
 */
async function geminiCustomerInsights(data) {
    if (!geminiAPI) {
        throw new Error('Google AI (Gemini) 未配置');
    }

    const { customerData, appointmentHistory } = data;
    
    const model = geminiAPI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
作為劉道玄諮詢師的客戶關係管理 AI，請分析客戶資料並提供深度洞察：

客戶資料：
${JSON.stringify(customerData, null, 2)}

預約歷史：
${JSON.stringify(appointmentHistory, null, 2)}

請提供：

1. **客戶畫像分析**
   - 客戶類型分類
   - 消費行為模式
   - 偏好療程分析

2. **個人化服務建議**
   - 推薦療程組合
   - 最佳服務時機
   - 個人化關懷要點

3. **客戶價值評估**
   - 生命週期價值
   - 忠誠度評分
   - 推薦潛力評估

4. **關係維護策略**
   - 溝通頻率建議
   - 關懷內容建議
   - 促銷策略建議

5. **風險預警**
   - 流失風險評估
   - 滿意度預警
   - 改善建議

請以專業的醫美顧問角度提供實用建議。
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const insights = response.text();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                insights: insights,
                timestamp: new Date().toISOString(),
                customerId: customerData.id
            })
        };
    } catch (error) {
        throw new Error(`客戶洞察分析失敗: ${error.message}`);
    }
}

/**
 * 同步到 Google Calendar
 */
async function syncToGoogleCalendar(data) {
    // 這裡需要使用 Service Account 或 OAuth 2.0
    // 暫時返回模擬回應
    const { appointment } = data;
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
            message: 'Google Calendar 同步功能準備中',
            eventId: `mock_event_${Date.now()}`,
            appointment: appointment
        })
    };
}

/**
 * 獲取 Google Calendar 事件
 */
async function getGoogleCalendarEvents(data) {
    // 這裡需要使用 Service Account 或 OAuth 2.0
    // 暫時返回模擬回應
    const { startDate, endDate } = data;
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
            message: 'Google Calendar 讀取功能準備中',
            events: [],
            timeRange: { startDate, endDate }
        })
    };
}
