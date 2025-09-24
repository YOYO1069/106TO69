/**
 * 劉道玄醫美診所 - 社群整合模組
 * 整合 LINE、Instagram、Facebook 預約系統
 */

class SocialIntegration {
    constructor() {
        this.socialChannels = {
            line: {
                name: 'LINE 官方帳號',
                icon: 'fab fa-line',
                color: '#00C300',
                webhook: '/api/line-webhook',
                enabled: true
            },
            instagram: {
                name: 'Instagram',
                icon: 'fab fa-instagram',
                color: '#E4405F',
                webhook: '/api/instagram-webhook',
                enabled: true
            },
            facebook: {
                name: 'Facebook',
                icon: 'fab fa-facebook',
                color: '#1877F2',
                webhook: '/api/facebook-webhook',
                enabled: true
            }
        };
        
        this.appointmentSources = new Map();
        this.init();
    }

    init() {
        this.loadSocialStats();
        this.setupEventListeners();
        this.initializeWebhooks();
    }

    // 載入社群統計數據
    loadSocialStats() {
        // 模擬社群來源統計
        const stats = {
            line: {
                total: 156,
                thisWeek: 28,
                percentage: 60
            },
            instagram: {
                total: 65,
                thisWeek: 12,
                percentage: 25
            },
            facebook: {
                total: 39,
                thisWeek: 5,
                percentage: 15
            }
        };

        this.updateSocialStatsDisplay(stats);
    }

    // 更新社群統計顯示
    updateSocialStatsDisplay(stats) {
        Object.keys(stats).forEach(channel => {
            const channelStats = stats[channel];
            const element = document.getElementById(`${channel}-stats`);
            if (element) {
                element.innerHTML = `
                    <div class="social-stat-item">
                        <i class="${this.socialChannels[channel].icon}" style="color: ${this.socialChannels[channel].color}"></i>
                        <span class="stat-number">${channelStats.total}</span>
                        <span class="stat-label">總預約</span>
                        <span class="stat-percentage">${channelStats.percentage}%</span>
                    </div>
                `;
            }
        });
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 社群來源選擇
        const socialSourceSelect = document.getElementById('socialSource');
        if (socialSourceSelect) {
            socialSourceSelect.addEventListener('change', (e) => {
                this.handleSourceChange(e.target.value);
            });
        }

        // 社群預約按鈕
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('social-appointment-btn')) {
                const source = e.target.dataset.source;
                this.handleSocialAppointment(source);
            }
        });
    }

    // 處理來源變更
    handleSourceChange(source) {
        const sourceInfo = this.getSocialChannelInfo(source);
        if (sourceInfo) {
            this.showSourceInfo(sourceInfo);
        }
    }

    // 獲取社群頻道資訊
    getSocialChannelInfo(source) {
        return this.socialChannels[source] || null;
    }

    // 顯示來源資訊
    showSourceInfo(sourceInfo) {
        const infoElement = document.getElementById('source-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="${sourceInfo.icon}" style="color: ${sourceInfo.color}"></i>
                    <strong>${sourceInfo.name}</strong> 預約
                    <p class="mb-0">此預約來自 ${sourceInfo.name}，系統將自動記錄來源資訊</p>
                </div>
            `;
        }
    }

    // 處理社群預約
    handleSocialAppointment(source) {
        const appointment = {
            source: source,
            timestamp: new Date().toISOString(),
            channel: this.socialChannels[source]
        };

        this.recordAppointmentSource(appointment);
        this.redirectToAppointmentForm(source);
    }

    // 記錄預約來源
    recordAppointmentSource(appointment) {
        const key = `appointment_${Date.now()}`;
        this.appointmentSources.set(key, appointment);
        
        // 儲存到 localStorage
        localStorage.setItem('socialAppointmentSources', 
            JSON.stringify(Array.from(this.appointmentSources.entries())));
    }

    // 重定向到預約表單
    redirectToAppointmentForm(source) {
        const url = `appointment_scheduling_system.html?source=${source}`;
        window.location.href = url;
    }

    // 初始化 Webhooks
    initializeWebhooks() {
        // LINE Bot Webhook 處理
        this.setupLineWebhook();
        
        // Instagram Webhook 處理
        this.setupInstagramWebhook();
        
        // Facebook Webhook 處理
        this.setupFacebookWebhook();
    }

    // 設置 LINE Webhook
    setupLineWebhook() {
        // LINE Bot 訊息處理邏輯
        console.log('LINE Webhook initialized');
    }

    // 設置 Instagram Webhook
    setupInstagramWebhook() {
        // Instagram DM 處理邏輯
        console.log('Instagram Webhook initialized');
    }

    // 設置 Facebook Webhook
    setupFacebookWebhook() {
        // Facebook Messenger 處理邏輯
        console.log('Facebook Webhook initialized');
    }

    // 獲取預約來源統計
    getSourceStatistics() {
        const sources = Array.from(this.appointmentSources.values());
        const stats = {};

        Object.keys(this.socialChannels).forEach(channel => {
            const channelAppointments = sources.filter(apt => apt.source === channel);
            stats[channel] = {
                count: channelAppointments.length,
                percentage: sources.length > 0 ? 
                    Math.round((channelAppointments.length / sources.length) * 100) : 0
            };
        });

        return stats;
    }

    // 生成社群預約報表
    generateSocialReport() {
        const stats = this.getSourceStatistics();
        const report = {
            totalAppointments: this.appointmentSources.size,
            sourceBreakdown: stats,
            generatedAt: new Date().toISOString()
        };

        return report;
    }

    // 匯出社群數據
    exportSocialData() {
        const report = this.generateSocialReport();
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `social_appointment_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// 全域社群整合實例
window.SocialIntegration = new SocialIntegration();

// 社群重定向函數（供全域使用）
window.redirectToSocial = {
    line: () => {
        window.SocialIntegration.handleSocialAppointment('line');
    },
    instagram: () => {
        window.SocialIntegration.handleSocialAppointment('instagram');
    },
    facebook: () => {
        window.SocialIntegration.handleSocialAppointment('facebook');
    }
};
