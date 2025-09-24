/**
 * 三方整合管理器
 * Netlify + Manus + OpenAI 整合控制中心
 */

class IntegrationManager {
    constructor() {
        this.integrationEndpoint = '/.netlify/functions/manus-netlify-integration';
        this.status = {
            netlify: 'unknown',
            manus: 'unknown',
            openai: 'unknown'
        };
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        console.log('三方整合管理器初始化中...');
        this.setupEventListeners();
        this.checkConnectionStatus();
        this.createIntegrationUI();
        this.startPeriodicSync();
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 監聽網路狀態
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('網路連線中斷，資料將暫存至恢復連線', 'warning');
        });

        // 監聽預約事件
        document.addEventListener('appointmentCreated', (event) => {
            this.syncAppointment(event.detail);
        });

        // 監聽表單提交事件
        document.addEventListener('formSubmitted', (event) => {
            this.syncForm(event.detail);
        });

        // 監聽 AI 對話事件
        document.addEventListener('aiChatCompleted', (event) => {
            this.syncAIChat(event.detail);
        });

        // 監聽部署事件
        document.addEventListener('deploymentTriggered', (event) => {
            this.handleDeployment(event.detail);
        });
    }

    /**
     * 創建整合管理 UI
     */
    createIntegrationUI() {
        // 創建整合狀態指示器
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'integrationStatus';
        statusIndicator.className = 'integration-status-indicator';
        statusIndicator.innerHTML = `
            <div class="integration-header">
                <i class="fas fa-plug"></i>
                <span>整合狀態</span>
                <button class="integration-toggle" onclick="window.integrationManager.togglePanel()">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="integration-panel" id="integrationPanel">
                <div class="service-status">
                    <div class="service-item" id="netlifyStatus">
                        <i class="fab fa-netlify"></i>
                        <span>Netlify</span>
                        <div class="status-dot unknown"></div>
                    </div>
                    <div class="service-item" id="manusStatus">
                        <i class="fas fa-cloud"></i>
                        <span>Manus</span>
                        <div class="status-dot unknown"></div>
                    </div>
                    <div class="service-item" id="openaiStatus">
                        <i class="fas fa-robot"></i>
                        <span>OpenAI</span>
                        <div class="status-dot unknown"></div>
                    </div>
                </div>
                <div class="integration-actions">
                    <button onclick="window.integrationManager.syncAll()" class="sync-btn">
                        <i class="fas fa-sync"></i> 全部同步
                    </button>
                    <button onclick="window.integrationManager.showAnalytics()" class="analytics-btn">
                        <i class="fas fa-chart-bar"></i> 分析報告
                    </button>
                </div>
                <div class="sync-queue" id="syncQueue">
                    <div class="queue-header">同步佇列 (<span id="queueCount">0</span>)</div>
                    <div class="queue-items" id="queueItems"></div>
                </div>
            </div>
        `;

        // 添加樣式
        this.addIntegrationStyles();

        // 添加到頁面
        document.body.appendChild(statusIndicator);
    }

    /**
     * 添加整合 UI 樣式
     */
    addIntegrationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .integration-status-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #d4af37;
                border-radius: 10px;
                color: white;
                font-family: Arial, sans-serif;
                z-index: 1001;
                min-width: 200px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }

            .integration-header {
                padding: 12px 15px;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            }

            .integration-header i {
                color: #d4af37;
            }

            .integration-toggle {
                background: none;
                border: none;
                color: #d4af37;
                margin-left: auto;
                cursor: pointer;
                transition: transform 0.3s;
            }

            .integration-panel {
                padding: 15px;
                display: none;
            }

            .integration-panel.open {
                display: block;
            }

            .service-status {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 15px;
            }

            .service-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 6px;
            }

            .service-item i {
                width: 20px;
                text-align: center;
            }

            .service-item span {
                flex: 1;
                font-size: 14px;
            }

            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-left: auto;
            }

            .status-dot.connected { background: #28a745; }
            .status-dot.disconnected { background: #dc3545; }
            .status-dot.unknown { background: #6c757d; }
            .status-dot.syncing { 
                background: #ffc107; 
                animation: pulse 1s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .integration-actions {
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
            }

            .sync-btn, .analytics-btn {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #d4af37;
                background: rgba(212, 175, 55, 0.1);
                color: #d4af37;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s;
            }

            .sync-btn:hover, .analytics-btn:hover {
                background: rgba(212, 175, 55, 0.2);
            }

            .sync-queue {
                border-top: 1px solid rgba(212, 175, 55, 0.3);
                padding-top: 10px;
            }

            .queue-header {
                font-size: 12px;
                color: #d4af37;
                margin-bottom: 8px;
            }

            .queue-items {
                max-height: 100px;
                overflow-y: auto;
            }

            .queue-item {
                padding: 4px 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
                margin-bottom: 4px;
                font-size: 11px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .queue-item .status {
                color: #ffc107;
                font-size: 10px;
            }

            @media (max-width: 768px) {
                .integration-status-indicator {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 檢查連接狀態
     */
    async checkConnectionStatus() {
        try {
            const response = await fetch(this.integrationEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_analytics' })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateServiceStatus('netlify', 'connected');
                this.updateServiceStatus('manus', 'connected');
                this.updateServiceStatus('openai', 'connected');
            } else {
                throw new Error('Integration service unavailable');
            }

        } catch (error) {
            console.error('連接狀態檢查失敗:', error);
            this.updateServiceStatus('netlify', 'disconnected');
            this.updateServiceStatus('manus', 'disconnected');
            this.updateServiceStatus('openai', 'disconnected');
        }
    }

    /**
     * 更新服務狀態
     */
    updateServiceStatus(service, status) {
        this.status[service] = status;
        const statusElement = document.querySelector(`#${service}Status .status-dot`);
        if (statusElement) {
            statusElement.className = `status-dot ${status}`;
        }
    }

    /**
     * 同步預約資料
     */
    async syncAppointment(appointmentData) {
        const syncItem = {
            id: `appointment_${Date.now()}`,
            type: 'appointment',
            data: appointmentData,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        if (this.isOnline) {
            await this.processSyncItem(syncItem);
        } else {
            this.addToSyncQueue(syncItem);
        }
    }

    /**
     * 同步表單資料
     */
    async syncForm(formData) {
        const syncItem = {
            id: `form_${Date.now()}`,
            type: 'form',
            data: formData,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        if (this.isOnline) {
            await this.processSyncItem(syncItem);
        } else {
            this.addToSyncQueue(syncItem);
        }
    }

    /**
     * 同步 AI 對話
     */
    async syncAIChat(chatData) {
        const syncItem = {
            id: `ai_chat_${Date.now()}`,
            type: 'ai_chat',
            data: chatData,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        if (this.isOnline) {
            await this.processSyncItem(syncItem);
        } else {
            this.addToSyncQueue(syncItem);
        }
    }

    /**
     * 處理部署
     */
    async handleDeployment(deployData) {
        try {
            this.updateServiceStatus('netlify', 'syncing');
            
            const response = await fetch(this.integrationEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deploy_update',
                    data: deployData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.updateServiceStatus('netlify', 'connected');
                this.showNotification('部署已成功觸發', 'success');
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('部署處理失敗:', error);
            this.updateServiceStatus('netlify', 'disconnected');
            this.showNotification('部署失敗: ' + error.message, 'error');
        }
    }

    /**
     * 處理同步項目
     */
    async processSyncItem(syncItem) {
        try {
            syncItem.status = 'syncing';
            this.updateQueueDisplay();

            const response = await fetch(this.integrationEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: `sync_${syncItem.type}`,
                    data: syncItem.data
                })
            });

            const result = await response.json();

            if (result.success) {
                syncItem.status = 'completed';
                this.showNotification(`${syncItem.type} 同步成功`, 'success');
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('同步失敗:', error);
            syncItem.status = 'failed';
            syncItem.error = error.message;
            this.showNotification(`${syncItem.type} 同步失敗`, 'error');
        } finally {
            this.updateQueueDisplay();
        }
    }

    /**
     * 添加到同步佇列
     */
    addToSyncQueue(syncItem) {
        this.syncQueue.push(syncItem);
        this.updateQueueDisplay();
        this.showNotification('資料已加入同步佇列', 'info');
    }

    /**
     * 處理同步佇列
     */
    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) return;

        this.showNotification('開始處理同步佇列...', 'info');

        const pendingItems = this.syncQueue.filter(item => item.status === 'pending');
        
        for (const item of pendingItems) {
            await this.processSyncItem(item);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 避免 API 限制
        }

        // 清理已完成的項目
        this.syncQueue = this.syncQueue.filter(item => 
            item.status !== 'completed' && item.status !== 'failed'
        );

        this.updateQueueDisplay();
    }

    /**
     * 全部同步
     */
    async syncAll() {
        try {
            this.showNotification('開始全部同步...', 'info');

            // 同步所有待處理的表單
            if (window.FormManagement) {
                const forms = window.FormManagement.getAllForms();
                for (const form of forms) {
                    await this.syncForm(form);
                }
            }

            // 同步 AI 對話記錄
            if (window.aiAssistant) {
                const chatHistory = window.aiAssistant.getChatHistory();
                for (const chat of chatHistory) {
                    await this.syncAIChat({
                        messages: [
                            { role: 'user', content: chat.user },
                            { role: 'assistant', content: chat.ai }
                        ],
                        intent: chat.intent,
                        timestamp: chat.timestamp
                    });
                }
            }

            this.showNotification('全部同步完成！', 'success');

        } catch (error) {
            console.error('全部同步失敗:', error);
            this.showNotification('同步過程中發生錯誤', 'error');
        }
    }

    /**
     * 顯示分析報告
     */
    async showAnalytics() {
        try {
            const response = await fetch(this.integrationEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_analytics' })
            });

            const result = await response.json();

            if (result.success) {
                this.displayAnalyticsModal(result.data);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('獲取分析報告失敗:', error);
            this.showNotification('分析報告獲取失敗', 'error');
        }
    }

    /**
     * 顯示分析報告模態框
     */
    displayAnalyticsModal(analyticsData) {
        const modal = document.createElement('div');
        modal.className = 'analytics-modal';
        modal.innerHTML = `
            <div class="analytics-content">
                <div class="analytics-header">
                    <h3>整合分析報告</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="analytics-body">
                    <div class="analytics-summary">
                        <div class="summary-item">
                            <div class="summary-number">${analyticsData.summary.totalAppointments}</div>
                            <div class="summary-label">總預約數</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${analyticsData.summary.totalForms}</div>
                            <div class="summary-label">表單提交</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${analyticsData.summary.aiConversations}</div>
                            <div class="summary-label">AI 對話</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${analyticsData.summary.conversionRate}%</div>
                            <div class="summary-label">轉換率</div>
                        </div>
                    </div>
                    <div class="analytics-performance">
                        <h4>系統效能</h4>
                        <div class="performance-grid">
                            <div class="performance-item">
                                <strong>Netlify 正常運行時間:</strong> ${analyticsData.performance.netlify.uptime || 'N/A'}
                            </div>
                            <div class="performance-item">
                                <strong>Manus API 延遲:</strong> ${analyticsData.performance.manus.apiLatency || 'N/A'}ms
                            </div>
                            <div class="performance-item">
                                <strong>AI 平均回應時間:</strong> ${analyticsData.performance.ai.averageResponseTime || 'N/A'}ms
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加模態框樣式
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .analytics-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }

            .analytics-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #d4af37;
                border-radius: 15px;
                color: white;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .analytics-header {
                padding: 20px;
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .analytics-header h3 {
                margin: 0;
                color: #d4af37;
            }

            .analytics-header button {
                background: none;
                border: none;
                color: #d4af37;
                font-size: 1.2em;
                cursor: pointer;
            }

            .analytics-body {
                padding: 20px;
            }

            .analytics-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .summary-item {
                text-align: center;
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
            }

            .summary-number {
                font-size: 2em;
                font-weight: bold;
                color: #d4af37;
            }

            .summary-label {
                font-size: 0.9em;
                color: rgba(255,255,255,0.8);
                margin-top: 5px;
            }

            .analytics-performance h4 {
                color: #d4af37;
                margin-bottom: 15px;
            }

            .performance-grid {
                display: grid;
                gap: 10px;
            }

            .performance-item {
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 6px;
                font-size: 0.9em;
            }
        `;

        document.head.appendChild(modalStyle);
        document.body.appendChild(modal);
    }

    /**
     * 更新佇列顯示
     */
    updateQueueDisplay() {
        const queueCount = document.getElementById('queueCount');
        const queueItems = document.getElementById('queueItems');

        if (queueCount) {
            queueCount.textContent = this.syncQueue.length;
        }

        if (queueItems) {
            queueItems.innerHTML = this.syncQueue.map(item => `
                <div class="queue-item">
                    <span>${item.type} - ${new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span class="status">${item.status}</span>
                </div>
            `).join('');
        }
    }

    /**
     * 切換面板顯示
     */
    togglePanel() {
        const panel = document.getElementById('integrationPanel');
        const toggle = document.querySelector('.integration-toggle i');
        
        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
            toggle.style.transform = 'rotate(0deg)';
        } else {
            panel.classList.add('open');
            toggle.style.transform = 'rotate(180deg)';
        }
    }

    /**
     * 開始定期同步
     */
    startPeriodicSync() {
        // 每 5 分鐘檢查一次連接狀態
        setInterval(() => {
            this.checkConnectionStatus();
        }, 5 * 60 * 1000);

        // 每 30 秒處理一次同步佇列
        setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        }, 30 * 1000);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (window.MedicalPlatform && window.MedicalPlatform.showAlert) {
            window.MedicalPlatform.showAlert(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 初始化整合管理器
document.addEventListener('DOMContentLoaded', function() {
    window.integrationManager = new IntegrationManager();
    console.log('三方整合管理器已啟動');
});

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationManager;
}
