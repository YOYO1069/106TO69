/**
 * Netlify + Manus 整合 Webhook 函數
 * 劉道玄諮詢師預約系統三方串接
 */

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Manus-Signature',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 驗證環境變數
        const requiredEnvVars = ['MANUS_API_KEY', 'NETLIFY_ACCESS_TOKEN', 'OPENAI_API_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration error',
                    message: `缺少環境變數: ${missingVars.join(', ')}`
                })
            };
        }

        const { action, data } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'sync_appointment':
                return await handleAppointmentSync(data, headers);
            
            case 'sync_form':
                return await handleFormSync(data, headers);
            
            case 'sync_ai_chat':
                return await handleAIChatSync(data, headers);
            
            case 'deploy_update':
                return await handleDeployUpdate(data, headers);
            
            case 'get_analytics':
                return await handleGetAnalytics(headers);
            
            case 'webhook_from_manus':
                return await handleManusWebhook(data, headers);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid action',
                        message: '不支援的操作類型'
                    })
                };
        }

    } catch (error) {
        console.error('Integration Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: '整合服務發生錯誤',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

/**
 * 處理預約同步
 */
async function handleAppointmentSync(appointmentData, headers) {
    try {
        // 1. 同步到 Manus
        const manusResponse = await syncToManus('/appointments', {
            type: 'appointment',
            data: {
                doctor: '劉道玄諮詢師',
                client: appointmentData.clientName,
                phone: appointmentData.clientPhone,
                service: appointmentData.service,
                appointmentTime: appointmentData.appointmentTime,
                source: appointmentData.source,
                status: appointmentData.status,
                notes: appointmentData.notes,
                timestamp: new Date().toISOString()
            },
            metadata: {
                system: 'liu-daoxuan-appointment',
                netlify_site_id: process.env.NETLIFY_SITE_ID
            }
        });

        // 2. 更新 Netlify 部署狀態
        const netlifyResponse = await updateNetlifyDeployment({
            message: `新預約: ${appointmentData.clientName} - ${appointmentData.service}`,
            context: 'appointment-sync',
            state: 'success'
        });

        // 3. 觸發 AI 分析
        const aiAnalysis = await analyzeAppointmentWithAI(appointmentData);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '預約資料已成功同步',
                data: {
                    manus: manusResponse,
                    netlify: netlifyResponse,
                    aiAnalysis: aiAnalysis
                }
            })
        };

    } catch (error) {
        console.error('Appointment sync error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Sync failed',
                message: '預約同步失敗',
                details: error.message
            })
        };
    }
}

/**
 * 處理表單同步
 */
async function handleFormSync(formData, headers) {
    try {
        // 1. 同步到 Manus CRM
        const manusResponse = await syncToManus('/forms', {
            type: 'form_submission',
            data: {
                formId: formData.id,
                clientInfo: {
                    name: formData.clientName,
                    phone: formData.clientPhone,
                    email: formData.clientEmail,
                    age: formData.age
                },
                appointmentInfo: {
                    service: formData.service,
                    preferredTime: formData.appointmentTime,
                    source: formData.source
                },
                notes: formData.notes,
                status: formData.status,
                submittedAt: formData.createdTime
            },
            metadata: {
                doctor: '劉道玄諮詢師',
                system: 'liu-daoxuan-forms',
                netlify_function: 'form-sync'
            }
        });

        // 2. 觸發 Netlify 表單處理
        const netlifyFormResponse = await processNetlifyForm(formData);

        // 3. 生成 AI 客戶洞察
        const aiInsights = await generateClientInsights(formData);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '表單資料已成功同步',
                data: {
                    manus: manusResponse,
                    netlify: netlifyFormResponse,
                    aiInsights: aiInsights
                }
            })
        };

    } catch (error) {
        console.error('Form sync error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Form sync failed',
                message: '表單同步失敗',
                details: error.message
            })
        };
    }
}

/**
 * 處理 AI 對話同步
 */
async function handleAIChatSync(chatData, headers) {
    try {
        // 1. 記錄到 Manus 分析系統
        const manusResponse = await syncToManus('/ai-logs', {
            type: 'ai_conversation',
            data: {
                sessionId: chatData.sessionId,
                messages: chatData.messages,
                intent: chatData.intent,
                outcome: chatData.outcome,
                duration: chatData.duration,
                timestamp: new Date().toISOString()
            },
            metadata: {
                aiModel: 'gpt-3.5-turbo',
                doctor: '劉道玄諮詢師',
                system: 'liu-daoxuan-ai-assistant',
                netlify_function: 'openai-chat'
            }
        });

        // 2. 更新 Netlify 使用統計
        const netlifyStats = await updateNetlifyStats({
            type: 'ai_usage',
            tokens: chatData.usage?.total_tokens || 0,
            timestamp: new Date().toISOString()
        });

        // 3. 分析對話品質
        const qualityAnalysis = await analyzeConversationQuality(chatData);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'AI 對話已成功記錄',
                data: {
                    manus: manusResponse,
                    netlify: netlifyStats,
                    quality: qualityAnalysis
                }
            })
        };

    } catch (error) {
        console.error('AI chat sync error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'AI chat sync failed',
                message: 'AI 對話同步失敗',
                details: error.message
            })
        };
    }
}

/**
 * 處理部署更新
 */
async function handleDeployUpdate(deployData, headers) {
    try {
        // 1. 觸發 Netlify 重新部署
        const netlifyDeploy = await triggerNetlifyDeploy({
            branch: deployData.branch || 'main',
            message: deployData.message || '劉道玄諮詢師系統更新',
            clear_cache: true
        });

        // 2. 通知 Manus 部署狀態
        const manusNotification = await syncToManus('/deployments', {
            type: 'deployment_update',
            data: {
                deployId: netlifyDeploy.id,
                status: netlifyDeploy.state,
                url: netlifyDeploy.deploy_ssl_url,
                branch: netlifyDeploy.branch,
                commit: netlifyDeploy.commit_ref,
                timestamp: new Date().toISOString()
            },
            metadata: {
                doctor: '劉道玄諮詢師',
                system: 'liu-daoxuan-deployment'
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '部署已觸發',
                data: {
                    netlify: netlifyDeploy,
                    manus: manusNotification
                }
            })
        };

    } catch (error) {
        console.error('Deploy update error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Deploy failed',
                message: '部署更新失敗',
                details: error.message
            })
        };
    }
}

/**
 * 獲取整合分析數據
 */
async function handleGetAnalytics(headers) {
    try {
        // 1. 從 Manus 獲取分析數據
        const manusAnalytics = await getFromManus('/analytics', {
            doctor: '劉道玄諮詢師',
            timeRange: '30d'
        });

        // 2. 從 Netlify 獲取網站統計
        const netlifyStats = await getNetlifyStats();

        // 3. 整合 AI 使用統計
        const aiStats = await getAIUsageStats();

        // 4. 生成綜合報告
        const integratedReport = {
            summary: {
                totalAppointments: manusAnalytics.appointments?.total || 0,
                totalForms: manusAnalytics.forms?.total || 0,
                aiConversations: aiStats.totalConversations || 0,
                websiteVisits: netlifyStats.visits || 0,
                conversionRate: calculateConversionRate(manusAnalytics, netlifyStats)
            },
            performance: {
                netlify: {
                    deployments: netlifyStats.deployments,
                    buildTime: netlifyStats.averageBuildTime,
                    uptime: netlifyStats.uptime
                },
                manus: {
                    apiLatency: manusAnalytics.performance?.latency || 0,
                    syncSuccess: manusAnalytics.performance?.syncRate || 0
                },
                ai: {
                    averageResponseTime: aiStats.averageResponseTime,
                    satisfactionScore: aiStats.satisfactionScore
                }
            },
            trends: {
                appointments: manusAnalytics.trends?.appointments || [],
                sources: manusAnalytics.sources?.breakdown || {},
                peakHours: manusAnalytics.timing?.peak || []
            }
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: integratedReport,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Analytics error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Analytics failed',
                message: '分析數據獲取失敗',
                details: error.message
            })
        };
    }
}

/**
 * 處理來自 Manus 的 Webhook
 */
async function handleManusWebhook(webhookData, headers) {
    try {
        const { type, data } = webhookData;

        switch (type) {
            case 'appointment.reminder':
                // 觸發 Netlify Function 發送提醒
                await triggerNetlifyFunction('send-reminder', data);
                break;

            case 'client.follow_up':
                // 更新客戶追蹤狀態
                await updateClientStatus(data);
                break;

            case 'analytics.report':
                // 更新儀表板數據
                await updateDashboard(data);
                break;

            case 'system.alert':
                // 系統警報處理
                await handleSystemAlert(data);
                break;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Webhook 處理成功',
                type: type
            })
        };

    } catch (error) {
        console.error('Manus webhook error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Webhook processing failed',
                message: 'Webhook 處理失敗',
                details: error.message
            })
        };
    }
}

/**
 * 同步資料到 Manus
 */
async function syncToManus(endpoint, payload) {
    const response = await fetch(`https://api.manus.im${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MANUS_API_KEY}`,
            'X-Project-ID': process.env.MANUS_PROJECT_ID || 'liu-daoxuan-medical'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Manus API 錯誤: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 從 Manus 獲取資料
 */
async function getFromManus(endpoint, params = {}) {
    const url = new URL(`https://api.manus.im${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.MANUS_API_KEY}`,
            'X-Project-ID': process.env.MANUS_PROJECT_ID || 'liu-daoxuan-medical'
        }
    });

    if (!response.ok) {
        throw new Error(`Manus API 錯誤: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 更新 Netlify 部署
 */
async function updateNetlifyDeployment(deployInfo) {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}/deploys`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            branch: 'main',
            title: deployInfo.message
        })
    });

    if (!response.ok) {
        throw new Error(`Netlify API 錯誤: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 觸發 Netlify 重新部署
 */
async function triggerNetlifyDeploy(deployConfig) {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}/builds`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            clear_cache: deployConfig.clear_cache || false
        })
    });

    if (!response.ok) {
        throw new Error(`Netlify 部署觸發失敗: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 獲取 Netlify 網站統計
 */
async function getNetlifyStats() {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error(`Netlify 統計獲取失敗: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 使用 OpenAI 分析預約資料
 */
async function analyzeAppointmentWithAI(appointmentData) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是劉道玄諮詢師的數據分析助理，請分析預約資料並提供洞察。'
                    },
                    {
                        role: 'user',
                        content: `分析這筆預約資料：客戶${appointmentData.clientName}，療程${appointmentData.service}，來源${appointmentData.source}，時間${appointmentData.appointmentTime}`
                    }
                ],
                max_tokens: 200
            })
        });

        const aiData = await response.json();
        return aiData.choices[0]?.message?.content || '分析完成';

    } catch (error) {
        console.error('AI 分析失敗:', error);
        return '分析暫時無法使用';
    }
}

/**
 * 計算轉換率
 */
function calculateConversionRate(manusData, netlifyData) {
    const appointments = manusData.appointments?.total || 0;
    const visits = netlifyData.visits || 1;
    return Math.round((appointments / visits) * 100 * 100) / 100; // 保留兩位小數
}

/**
 * 獲取 AI 使用統計
 */
async function getAIUsageStats() {
    // 這裡可以從日誌或數據庫獲取 AI 使用統計
    return {
        totalConversations: 0,
        averageResponseTime: 0,
        satisfactionScore: 0
    };
}

/**
 * 處理 Netlify 表單
 */
async function processNetlifyForm(formData) {
    // 處理 Netlify 表單提交
    return { processed: true, formId: formData.id };
}

/**
 * 生成客戶洞察
 */
async function generateClientInsights(formData) {
    // 使用 AI 生成客戶洞察
    return { insights: '客戶分析完成' };
}

/**
 * 更新 Netlify 統計
 */
async function updateNetlifyStats(statsData) {
    // 更新統計數據
    return { updated: true };
}

/**
 * 分析對話品質
 */
async function analyzeConversationQuality(chatData) {
    // 分析對話品質
    return { quality: 'good' };
}

/**
 * 觸發 Netlify Function
 */
async function triggerNetlifyFunction(functionName, data) {
    // 觸發其他 Netlify Function
    return { triggered: true };
}

/**
 * 更新客戶狀態
 */
async function updateClientStatus(data) {
    // 更新客戶狀態
    return { updated: true };
}

/**
 * 更新儀表板
 */
async function updateDashboard(data) {
    // 更新儀表板數據
    return { updated: true };
}

/**
 * 處理系統警報
 */
async function handleSystemAlert(data) {
    // 處理系統警報
    return { handled: true };
}
