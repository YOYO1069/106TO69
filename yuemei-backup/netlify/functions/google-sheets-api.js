/**
 * Google Sheets API 整合 Netlify Function
 * 處理 Google Sheets 讀寫操作和聊天資料分析
 */

const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 環境變數配置
const config = {
    google: {
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        projectId: process.env.GOOGLE_PROJECT_ID
    },
    sheets: {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '1nmFj0647LO44Gl54DvZEXdNYuZlFLGvueEM1XEqEa8g'
    },
    gemini: {
        apiKey: process.env.GOOGLE_AI_API_KEY
    }
};

// Google AI (Gemini) 實例
let geminiAPI = null;
if (config.gemini.apiKey) {
    geminiAPI = new GoogleGenerativeAI(config.gemini.apiKey);
}

// Google Sheets API 實例
let sheetsAPI = null;

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
        // 初始化 Google Sheets API
        if (!sheetsAPI) {
            await initializeGoogleSheets();
        }

        const { action, data } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'read_sheet':
                return await readSheetData(data);
            
            case 'write_sheet':
                return await writeSheetData(data);
            
            case 'append_sheet':
                return await appendSheetData(data);
            
            case 'batch_update_sheet':
                return await batchUpdateSheetData(data);
            
            case 'analyze_chat_content':
                return await analyzeChatContent(data);
            
            case 'batch_analyze_chats':
                return await batchAnalyzeChats(data);
            
            case 'generate_chat_insights':
                return await generateChatInsights(data);
            
            case 'standardize_data_format':
                return await standardizeDataFormat(data);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: '不支援的操作',
                        supportedActions: [
                            'read_sheet',
                            'write_sheet',
                            'append_sheet',
                            'batch_update_sheet',
                            'analyze_chat_content',
                            'batch_analyze_chats',
                            'generate_chat_insights',
                            'standardize_data_format'
                        ]
                    })
                };
        }
    } catch (error) {
        console.error('Google Sheets API 錯誤:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Google Sheets API 處理失敗',
                message: error.message 
            })
        };
    }
};

/**
 * 初始化 Google Sheets API
 */
async function initializeGoogleSheets() {
    try {
        const auth = new GoogleAuth({
            credentials: {
                client_email: config.google.clientEmail,
                private_key: config.google.privateKey,
                project_id: config.google.projectId
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const authClient = await auth.getClient();
        sheetsAPI = google.sheets({ version: 'v4', auth: authClient });
        
        console.log('✅ Google Sheets API 初始化完成');
    } catch (error) {
        console.error('❌ Google Sheets API 初始化失敗:', error);
        throw error;
    }
}

/**
 * 讀取 Google Sheets 資料
 */
async function readSheetData(data) {
    const { range = 'A:Z', spreadsheetId = config.sheets.spreadsheetId } = data;
    
    try {
        const response = await sheetsAPI.spreadsheets.values.get({
            spreadsheetId,
            range
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                data: response.data.values || [],
                range: response.data.range,
                majorDimension: response.data.majorDimension
            })
        };
    } catch (error) {
        throw new Error(`讀取 Google Sheets 失敗: ${error.message}`);
    }
}

/**
 * 寫入 Google Sheets 資料
 */
async function writeSheetData(data) {
    const { 
        range, 
        values, 
        spreadsheetId = config.sheets.spreadsheetId,
        valueInputOption = 'RAW'
    } = data;
    
    try {
        const response = await sheetsAPI.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption,
            resource: { values }
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                updatedCells: response.data.updatedCells,
                updatedColumns: response.data.updatedColumns,
                updatedRows: response.data.updatedRows
            })
        };
    } catch (error) {
        throw new Error(`寫入 Google Sheets 失敗: ${error.message}`);
    }
}

/**
 * 新增資料到 Google Sheets
 */
async function appendSheetData(data) {
    const { 
        range, 
        values, 
        spreadsheetId = config.sheets.spreadsheetId,
        valueInputOption = 'RAW',
        insertDataOption = 'INSERT_ROWS'
    } = data;
    
    try {
        const response = await sheetsAPI.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            insertDataOption,
            resource: { values }
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                updates: response.data.updates,
                spreadsheetId: response.data.spreadsheetId,
                tableRange: response.data.tableRange
            })
        };
    } catch (error) {
        throw new Error(`新增到 Google Sheets 失敗: ${error.message}`);
    }
}

/**
 * 批量更新 Google Sheets 資料
 */
async function batchUpdateSheetData(data) {
    const { 
        requests, 
        spreadsheetId = config.sheets.spreadsheetId 
    } = data;
    
    try {
        const response = await sheetsAPI.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: { requests }
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                replies: response.data.replies,
                spreadsheetId: response.data.spreadsheetId
            })
        };
    } catch (error) {
        throw new Error(`批量更新 Google Sheets 失敗: ${error.message}`);
    }
}

/**
 * 分析單筆聊天內容
 */
async function analyzeChatContent(data) {
    if (!geminiAPI) {
        throw new Error('Google AI (Gemini) 未配置');
    }

    const { messageContent, customerInfo = {} } = data;
    
    const model = geminiAPI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
作為劉道玄諮詢師的專業 AI 助理，請分析以下聊天內容並提供結構化的分析結果：

聊天內容：
"${messageContent}"

客戶資訊：
${JSON.stringify(customerInfo, null, 2)}

請以 JSON 格式回應，包含以下欄位：
{
    "inquiryType": "預約|諮詢|價格|其他",
    "treatment": "具體療程名稱或空字串",
    "customerIntent": "客戶意圖描述",
    "urgency": "高|中|低",
    "leadScore": 1-10的數字評分,
    "followUpRequired": "是|否",
    "suggestedResponse": "建議回應內容",
    "keywords": ["關鍵字陣列"],
    "sentiment": "正面|中性|負面",
    "conversionProbability": 0-1的數字,
    "recommendedActions": ["建議行動陣列"]
}

分析要點：
1. 識別客戶的真實需求和意圖
2. 評估成交可能性和緊急程度
3. 提供個人化的回應建議
4. 考慮醫美行業的專業性和客戶心理
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let analysis = response.text();
        
        // 嘗試解析 JSON 回應
        try {
            analysis = JSON.parse(analysis.replace(/```json\n?|\n?```/g, ''));
        } catch (parseError) {
            // 如果解析失敗，使用基本分析
            analysis = {
                inquiryType: '其他',
                treatment: '',
                customerIntent: analysis,
                urgency: '中',
                leadScore: 5,
                followUpRequired: '是',
                suggestedResponse: '感謝您的詢問，我們會盡快為您安排專業諮詢。',
                keywords: [],
                sentiment: '中性',
                conversionProbability: 0.5,
                recommendedActions: ['專業諮詢', '提供資料']
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
                analysis: analysis,
                timestamp: new Date().toISOString(),
                messageLength: messageContent.length
            })
        };
    } catch (error) {
        throw new Error(`聊天內容分析失敗: ${error.message}`);
    }
}

/**
 * 批量分析聊天資料
 */
async function batchAnalyzeChats(data) {
    if (!geminiAPI) {
        throw new Error('Google AI (Gemini) 未配置');
    }

    const { chatData, batchSize = 10 } = data;
    const results = [];
    
    try {
        // 分批處理以避免 API 限制
        for (let i = 0; i < chatData.length; i += batchSize) {
            const batch = chatData.slice(i, i + batchSize);
            const batchPromises = batch.map(async (chat) => {
                try {
                    const analysisResult = await analyzeChatContent({
                        messageContent: chat.messageContent,
                        customerInfo: {
                            name: chat.customerName,
                            phone: chat.customerPhone,
                            platform: chat.platform
                        }
                    });
                    
                    const analysisData = JSON.parse(analysisResult.body);
                    return {
                        originalData: chat,
                        analysis: analysisData.analysis,
                        success: true
                    };
                } catch (error) {
                    return {
                        originalData: chat,
                        error: error.message,
                        success: false
                    };
                }
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults.map(result => 
                result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
            ));
            
            // 添加延遲以避免 API 速率限制
            if (i + batchSize < chatData.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                results: results,
                summary: {
                    total: chatData.length,
                    successful: successCount,
                    failed: errorCount,
                    successRate: Math.round((successCount / chatData.length) * 100)
                },
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        throw new Error(`批量分析失敗: ${error.message}`);
    }
}

/**
 * 生成聊天洞察報告
 */
async function generateChatInsights(data) {
    if (!geminiAPI) {
        throw new Error('Google AI (Gemini) 未配置');
    }

    const { chatData, timeRange, analysisType = 'comprehensive' } = data;
    
    const model = geminiAPI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
作為劉道玄諮詢師的業務分析專家，請分析以下聊天資料並生成深度洞察報告：

時間範圍：${timeRange}
分析類型：${analysisType}
聊天資料筆數：${chatData.length}

聊天資料摘要：
${JSON.stringify(chatData.slice(0, 10), null, 2)}
${chatData.length > 10 ? `... 還有 ${chatData.length - 10} 筆資料` : ''}

請提供以下分析：

1. **客戶行為模式分析**
   - 詢問高峰時段
   - 平台偏好分析
   - 客戶類型分布

2. **業務機會識別**
   - 高價值潛在客戶
   - 熱門療程需求
   - 轉換機會分析

3. **服務品質評估**
   - 回應效率分析
   - 客戶滿意度指標
   - 改善建議

4. **營收優化建議**
   - 定價策略建議
   - 促銷時機建議
   - 客戶關係管理

5. **競爭優勢分析**
   - 市場定位建議
   - 差異化策略
   - 品牌建設方向

請以專業、實用的方式提供具體的數據洞察和行動建議。
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
                metadata: {
                    dataPoints: chatData.length,
                    timeRange: timeRange,
                    analysisType: analysisType,
                    generatedAt: new Date().toISOString()
                }
            })
        };
    } catch (error) {
        throw new Error(`洞察報告生成失敗: ${error.message}`);
    }
}

/**
 * 標準化資料格式
 */
async function standardizeDataFormat(data) {
    const { rawData, targetFormat = 'standard' } = data;
    
    const standardFormat = [
        '時間戳記', '平台', '客戶姓名', '客戶電話', '客戶信箱',
        '詢問類型', '療程項目', '對話內容', '客戶意圖', '回應狀態',
        '預約日期', '需要追蹤', '備註', '潛在客戶評分', '轉換狀態'
    ];
    
    try {
        const standardizedData = [];
        
        // 添加標題行
        standardizedData.push(standardFormat);
        
        // 處理每一行資料
        for (const row of rawData) {
            const standardizedRow = new Array(standardFormat.length).fill('');
            
            // 根據原始資料格式進行映射
            if (Array.isArray(row)) {
                // 如果是陣列格式，直接映射
                for (let i = 0; i < Math.min(row.length, standardFormat.length); i++) {
                    standardizedRow[i] = row[i] || '';
                }
            } else if (typeof row === 'object') {
                // 如果是物件格式，根據欄位名稱映射
                const fieldMapping = {
                    'timestamp': 0, 'time': 0, '時間': 0,
                    'platform': 1, '平台': 1,
                    'customerName': 2, 'name': 2, '姓名': 2, '客戶姓名': 2,
                    'customerPhone': 3, 'phone': 3, '電話': 3, '客戶電話': 3,
                    'customerEmail': 4, 'email': 4, '信箱': 4, '客戶信箱': 4,
                    'inquiryType': 5, 'type': 5, '類型': 5, '詢問類型': 5,
                    'treatment': 6, '療程': 6, '療程項目': 6,
                    'messageContent': 7, 'message': 7, '內容': 7, '對話內容': 7,
                    'customerIntent': 8, 'intent': 8, '意圖': 8, '客戶意圖': 8,
                    'responseStatus': 9, 'status': 9, '狀態': 9, '回應狀態': 9,
                    'appointmentDate': 10, 'appointment': 10, '預約日期': 10,
                    'followUpRequired': 11, 'followUp': 11, '追蹤': 11, '需要追蹤': 11,
                    'notes': 12, '備註': 12,
                    'leadScore': 13, 'score': 13, '評分': 13, '潛在客戶評分': 13,
                    'conversionStatus': 14, 'conversion': 14, '轉換': 14, '轉換狀態': 14
                };
                
                Object.keys(row).forEach(key => {
                    const index = fieldMapping[key];
                    if (index !== undefined) {
                        standardizedRow[index] = row[key] || '';
                    }
                });
            }
            
            // 確保時間戳記格式
            if (!standardizedRow[0]) {
                standardizedRow[0] = new Date().toISOString();
            }
            
            standardizedData.push(standardizedRow);
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                standardizedData: standardizedData,
                originalCount: rawData.length,
                standardizedCount: standardizedData.length - 1, // 扣除標題行
                format: targetFormat,
                headers: standardFormat
            })
        };
    } catch (error) {
        throw new Error(`資料格式標準化失敗: ${error.message}`);
    }
}
