/**
 * Manus 平台整合配置
 * 劉道玄醫師預約系統與 Manus 平台串接
 */

class ManusIntegration {
    constructor() {
        this.apiEndpoint = 'https://api.manus.im';
        this.webhookEndpoint = '/.netlify/functions/manus-webhook';
        this.apiKey = process.env.MANUS_API_KEY;
        this.projectId = process.env.MANUS_PROJECT_ID;
        this.init();
    }

    init() {
        console.log('Manus Integration initialized for 劉道玄醫師預約系統');
        this.setupEventListeners();
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 監聽預約事件
        document.addEventListener('appointmentCreated', (event) => {
            this.syncAppointmentToManus(event.detail);
        });

        // 監聽表單提交事件
        document.addEventListener('formSubmitted', (event) => {
            this.syncFormToManus(event.detail);
        });

        // 監聽AI對話事件
        document.addEventListener('aiChatCompleted', (event) => {
            this.logChatToManus(event.detail);
        });
    }

    /**
     * 同步預約資料到 Manus
     */
    async syncAppointmentToManus(appointmentData) {
        try {
            const payload = {
                type: 'appointment',
                data: {
                    doctor: '劉道玄醫師',
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
                    version: '1.0.0'
                }
            };

            const response = await this.sendToManus('/appointments', payload);
            
            if (response.success) {
                console.log('預約資料已同步到 Manus:', response.data);
                this.showNotification('預約資料已同步到 Manus 平台', 'success');
            }

        } catch (error) {
            console.error('Manus 同步失敗:', error);
            this.showNotification('Manus 同步失敗，請稍後重試', 'error');
        }
    }

    /**
     * 同步表單資料到 Manus
     */
    async syncFormToManus(formData) {
        try {
            const payload = {
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
                    doctor: '劉道玄醫師',
                    system: 'liu-daoxuan-forms'
                }
            };

            const response = await this.sendToManus('/forms', payload);
            
            if (response.success) {
                console.log('表單資料已同步到 Manus:', response.data);
            }

        } catch (error) {
            console.error('表單同步到 Manus 失敗:', error);
        }
    }

    /**
     * 記錄 AI 對話到 Manus
     */
    async logChatToManus(chatData) {
        try {
            const payload = {
                type: 'ai_conversation',
                data: {
                    sessionId: chatData.sessionId || this.generateSessionId(),
                    messages: chatData.messages,
                    intent: chatData.intent,
                    outcome: chatData.outcome,
                    duration: chatData.duration,
                    timestamp: new Date().toISOString()
                },
                metadata: {
                    aiModel: 'gpt-3.5-turbo',
                    doctor: '劉道玄醫師',
                    system: 'liu-daoxuan-ai-assistant'
                }
            };

            await this.sendToManus('/ai-logs', payload);

        } catch (error) {
            console.error('AI 對話記錄到 Manus 失敗:', error);
        }
    }

    /**
     * 發送資料到 Manus API
     */
    async sendToManus(endpoint, payload) {
        const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Project-ID': this.projectId
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
    async getFromManus(endpoint, params = {}) {
        const url = new URL(`${this.apiEndpoint}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Project-ID': this.projectId
            }
        });

        if (!response.ok) {
            throw new Error(`Manus API 錯誤: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 獲取 Manus 儀表板數據
     */
    async getManusAnalytics() {
        try {
            const analytics = await this.getFromManus('/analytics', {
                doctor: '劉道玄醫師',
                timeRange: '30d'
            });

            return {
                totalAppointments: analytics.appointments?.total || 0,
                totalForms: analytics.forms?.total || 0,
                aiConversations: analytics.aiChats?.total || 0,
                conversionRate: analytics.conversion?.rate || 0,
                popularServices: analytics.services?.popular || [],
                peakHours: analytics.timing?.peak || [],
                sourceBreakdown: analytics.sources?.breakdown || {}
            };

        } catch (error) {
            console.error('獲取 Manus 分析數據失敗:', error);
            return null;
        }
    }

    /**
     * 同步客戶資料到 Manus CRM
     */
    async syncClientToManus(clientData) {
        try {
            const payload = {
                type: 'client_profile',
                data: {
                    personalInfo: {
                        name: clientData.name,
                        phone: clientData.phone,
                        email: clientData.email,
                        age: clientData.age,
                        gender: clientData.gender
                    },
                    medicalHistory: {
                        previousTreatments: clientData.previousTreatments || [],
                        allergies: clientData.allergies || [],
                        medications: clientData.medications || []
                    },
                    appointmentHistory: clientData.appointments || [],
                    preferences: {
                        preferredTime: clientData.preferredTime,
                        communicationMethod: clientData.communicationMethod,
                        reminderSettings: clientData.reminderSettings
                    },
                    tags: ['劉道玄醫師', '醫美客戶'],
                    lastUpdated: new Date().toISOString()
                },
                metadata: {
                    doctor: '劉道玄醫師',
                    source: 'appointment-system'
                }
            };

            const response = await this.sendToManus('/clients', payload);
            return response;

        } catch (error) {
            console.error('客戶資料同步到 Manus 失敗:', error);
            throw error;
        }
    }

    /**
     * 設定 Manus Webhook
     */
    async setupManusWebhook() {
        try {
            const webhookConfig = {
                url: `${window.location.origin}${this.webhookEndpoint}`,
                events: [
                    'appointment.created',
                    'appointment.updated',
                    'appointment.cancelled',
                    'form.submitted',
                    'client.updated',
                    'ai.conversation.completed'
                ],
                secret: this.generateWebhookSecret(),
                active: true
            };

            const response = await this.sendToManus('/webhooks', webhookConfig);
            
            if (response.success) {
                console.log('Manus Webhook 設定成功:', response.data);
                localStorage.setItem('manus_webhook_id', response.data.id);
            }

        } catch (error) {
            console.error('Manus Webhook 設定失敗:', error);
        }
    }

    /**
     * 處理 Manus Webhook 事件
     */
    async handleManusWebhook(event) {
        try {
            switch (event.type) {
                case 'appointment.reminder':
                    await this.handleAppointmentReminder(event.data);
                    break;
                
                case 'client.follow_up':
                    await this.handleClientFollowUp(event.data);
                    break;
                
                case 'analytics.report':
                    await this.handleAnalyticsReport(event.data);
                    break;
                
                default:
                    console.log('未處理的 Manus 事件:', event.type);
            }

        } catch (error) {
            console.error('處理 Manus Webhook 失敗:', error);
        }
    }

    /**
     * 處理預約提醒
     */
    async handleAppointmentReminder(data) {
        // 發送預約提醒通知
        this.showNotification(
            `提醒：${data.clientName} 的預約時間為 ${data.appointmentTime}`,
            'info'
        );

        // 可以整合 LINE Bot 發送提醒
        if (window.lineBot) {
            await window.lineBot.sendReminder(data);
        }
    }

    /**
     * 處理客戶追蹤
     */
    async handleClientFollowUp(data) {
        // 顯示追蹤提醒
        this.showNotification(
            `需要追蹤客戶：${data.clientName}`,
            'warning'
        );

        // 可以自動創建追蹤任務
        if (window.taskManager) {
            await window.taskManager.createFollowUpTask(data);
        }
    }

    /**
     * 處理分析報表
     */
    async handleAnalyticsReport(data) {
        // 更新儀表板數據
        if (window.dashboard) {
            await window.dashboard.updateAnalytics(data);
        }
    }

    /**
     * 生成會話 ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 生成 Webhook 密鑰
     */
    generateWebhookSecret() {
        return 'webhook_' + Math.random().toString(36).substr(2, 32);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        // 使用現有的通知系統
        if (window.MedicalPlatform && window.MedicalPlatform.showAlert) {
            window.MedicalPlatform.showAlert(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 獲取 Manus 連接狀態
     */
    async getConnectionStatus() {
        try {
            const response = await this.getFromManus('/health');
            return {
                connected: true,
                status: response.status,
                lastSync: response.lastSync,
                version: response.version
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * 手動同步所有資料到 Manus
     */
    async syncAllToManus() {
        try {
            this.showNotification('開始同步資料到 Manus...', 'info');

            // 同步預約資料
            if (window.FormManagement) {
                const forms = window.FormManagement.getAllForms();
                for (const form of forms) {
                    await this.syncFormToManus(form);
                }
            }

            // 同步 AI 對話記錄
            if (window.aiAssistant) {
                const chatHistory = window.aiAssistant.getChatHistory();
                for (const chat of chatHistory) {
                    await this.logChatToManus({
                        messages: [
                            { role: 'user', content: chat.user },
                            { role: 'assistant', content: chat.ai }
                        ],
                        intent: chat.intent,
                        timestamp: chat.timestamp
                    });
                }
            }

            this.showNotification('資料同步到 Manus 完成！', 'success');

        } catch (error) {
            console.error('同步到 Manus 失敗:', error);
            this.showNotification('同步到 Manus 失敗，請稍後重試', 'error');
        }
    }
}

// 初始化 Manus 整合
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否有 Manus API 配置
    if (typeof process !== 'undefined' && process.env && process.env.MANUS_API_KEY) {
        window.manusIntegration = new ManusIntegration();
        console.log('Manus 整合已啟用');
    } else {
        console.log('Manus API 配置未找到，跳過整合');
    }
});

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ManusIntegration;
}
