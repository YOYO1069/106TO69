/**
 * 四方整合智能管理中心
 * Netlify + Manus + OpenAI + Airtable 統一管理系統
 */

class QuadIntegrationManager {
    constructor() {
        this.services = {
            netlify: { status: 'unknown', endpoint: '/.netlify/functions/manus-netlify-integration' },
            manus: { status: 'unknown', endpoint: '/.netlify/functions/manus-netlify-integration' },
            openai: { status: 'unknown', endpoint: '/.netlify/functions/openai-enhanced-analytics' },
            airtable: { status: 'unknown', endpoint: '/.netlify/functions/airtable-mcp-integration' }
        };
        this.aiInsights = {};
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        console.log('四方整合智能管理中心初始化中...');
        this.setupEventListeners();
        this.createAdvancedUI();
        this.checkAllConnections();
        this.startIntelligentSync();
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 網路狀態監聽
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processIntelligentSync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('網路連線中斷，啟用離線模式', 'warning');
        });

        // 業務事件監聽
        document.addEventListener('appointmentCreated', (event) => {
            this.handleAppointmentEvent(event.detail);
        });

        document.addEventListener('formSubmitted', (event) => {
            this.handleFormEvent(event.detail);
        });

        document.addEventListener('aiChatCompleted', (event) => {
            this.handleAIChatEvent(event.detail);
        });

        document.addEventListener('customerInteraction', (event) => {
            this.analyzeCustomerBehavior(event.detail);
        });
    }

    /**
     * 創建進階管理介面
     */
    createAdvancedUI() {
        const managementPanel = document.createElement('div');
        managementPanel.id = 'quadIntegrationPanel';
        managementPanel.className = 'quad-integration-panel';
        managementPanel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <i class="fas fa-brain"></i>
                    <span>AI 智能管理中心</span>
                </div>
                <div class="panel-controls">
                    <button class="ai-analyze-btn" onclick="window.quadManager.runAIAnalysis()">
                        <i class="fas fa-magic"></i> AI 分析
                    </button>
                    <button class="panel-toggle" onclick="window.quadManager.togglePanel()">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            
            <div class="panel-content" id="quadPanelContent">
                <!-- 服務狀態區 -->
                <div class="services-status">
                    <div class="service-card" id="netlifyCard">
                        <div class="service-icon"><i class="fab fa-netlify"></i></div>
                        <div class="service-info">
                            <div class="service-name">Netlify</div>
                            <div class="service-status">檢查中...</div>
                        </div>
                        <div class="status-indicator unknown"></div>
                    </div>
                    
                    <div class="service-card" id="manusCard">
                        <div class="service-icon"><i class="fas fa-cloud"></i></div>
                        <div class="service-info">
                            <div class="service-name">Manus</div>
                            <div class="service-status">檢查中...</div>
                        </div>
                        <div class="status-indicator unknown"></div>
                    </div>
                    
                    <div class="service-card" id="openaiCard">
                        <div class="service-icon"><i class="fas fa-robot"></i></div>
                        <div class="service-info">
                            <div class="service-name">OpenAI</div>
                            <div class="service-status">檢查中...</div>
                        </div>
                        <div class="status-indicator unknown"></div>
                    </div>
                    
                    <div class="service-card" id="airtableCard">
                        <div class="service-icon"><i class="fas fa-table"></i></div>
                        <div class="service-info">
                            <div class="service-name">Airtable</div>
                            <div class="service-status">檢查中...</div>
                        </div>
                        <div class="status-indicator unknown"></div>
                    </div>
                </div>

                <!-- AI 洞察區 -->
                <div class="ai-insights-section">
                    <div class="section-header">
                        <i class="fas fa-lightbulb"></i>
                        <span>AI 智能洞察</span>
                    </div>
                    <div class="insights-grid" id="aiInsightsGrid">
                        <div class="insight-card loading">
                            <div class="insight-title">正在分析...</div>
                            <div class="insight-content">AI 正在分析您的業務數據</div>
                        </div>
                    </div>
                </div>

                <!-- 智能同步區 -->
                <div class="smart-sync-section">
                    <div class="section-header">
                        <i class="fas fa-sync-alt"></i>
                        <span>智能同步</span>
                        <div class="sync-stats">
                            <span id="syncQueueCount">0</span> 待處理
                        </div>
                    </div>
                    <div class="sync-controls">
                        <button onclick="window.quadManager.syncAll()" class="sync-all-btn">
                            <i class="fas fa-sync"></i> 全部同步
                        </button>
                        <button onclick="window.quadManager.showAnalytics()" class="analytics-btn">
                            <i class="fas fa-chart-line"></i> 深度分析
                        </button>
                        <button onclick="window.quadManager.optimizeOperations()" class="optimize-btn">
                            <i class="fas fa-cogs"></i> 智能優化
                        </button>
                    </div>
                    <div class="sync-queue" id="smartSyncQueue">
                        <!-- 同步項目將動態載入 -->
                    </div>
                </div>

                <!-- 智能建議區 -->
                <div class="ai-recommendations-section">
                    <div class="section-header">
                        <i class="fas fa-star"></i>
                        <span>AI 智能建議</span>
                    </div>
                    <div class="recommendations-list" id="aiRecommendations">
                        <!-- AI 建議將動態載入 -->
                    </div>
                </div>
            </div>
        `;

        // 添加進階樣式
        this.addAdvancedStyles();

        // 添加到頁面
        document.body.appendChild(managementPanel);
    }

    /**
     * 添加進階樣式
     */
    addAdvancedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .quad-integration-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                border: 2px solid #d4af37;
                border-radius: 15px;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                z-index: 1002;
                box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                backdrop-filter: blur(10px);
                max-height: 80vh;
                overflow: hidden;
            }

            .panel-header {
                padding: 20px;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                border-radius: 13px 13px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            }

            .panel-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                font-size: 16px;
            }

            .panel-title i {
                color: #d4af37;
                font-size: 1.2em;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .panel-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .ai-analyze-btn {
                background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
                border: none;
                color: #1a1a2e;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }

            .ai-analyze-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
            }

            .panel-toggle {
                background: none;
                border: none;
                color: #d4af37;
                font-size: 1.2em;
                cursor: pointer;
                transition: transform 0.3s;
            }

            .panel-content {
                max-height: 60vh;
                overflow-y: auto;
                padding: 20px;
                display: none;
            }

            .panel-content.open {
                display: block;
            }

            .services-status {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }

            .service-card {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(212, 175, 55, 0.2);
                border-radius: 10px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s;
                position: relative;
            }

            .service-card:hover {
                background: rgba(255,255,255,0.08);
                border-color: rgba(212, 175, 55, 0.4);
            }

            .service-icon {
                font-size: 1.5em;
                color: #d4af37;
            }

            .service-info {
                flex: 1;
            }

            .service-name {
                font-weight: 600;
                font-size: 14px;
            }

            .service-status {
                font-size: 11px;
                color: rgba(255,255,255,0.7);
            }

            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                position: absolute;
                top: 8px;
                right: 8px;
            }

            .status-indicator.connected { 
                background: #28a745; 
                box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
            }
            .status-indicator.disconnected { 
                background: #dc3545; 
                box-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
            }
            .status-indicator.unknown { 
                background: #6c757d; 
            }
            .status-indicator.syncing { 
                background: #ffc107; 
                animation: pulse 1s infinite;
            }

            .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(212, 175, 55, 0.2);
                font-weight: 600;
                font-size: 14px;
            }

            .section-header i {
                color: #d4af37;
            }

            .sync-stats {
                margin-left: auto;
                font-size: 12px;
                color: rgba(255,255,255,0.7);
            }

            .insights-grid {
                display: grid;
                gap: 10px;
                margin-bottom: 20px;
            }

            .insight-card {
                background: rgba(255,255,255,0.05);
                border-left: 4px solid #d4af37;
                border-radius: 8px;
                padding: 12px;
            }

            .insight-card.loading {
                border-left-color: #6c757d;
            }

            .insight-title {
                font-weight: 600;
                font-size: 13px;
                margin-bottom: 5px;
                color: #d4af37;
            }

            .insight-content {
                font-size: 12px;
                line-height: 1.4;
                color: rgba(255,255,255,0.8);
            }

            .sync-controls {
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }

            .sync-all-btn, .analytics-btn, .optimize-btn {
                flex: 1;
                min-width: 100px;
                padding: 8px 12px;
                border: 1px solid rgba(212, 175, 55, 0.3);
                background: rgba(212, 175, 55, 0.1);
                color: #d4af37;
                border-radius: 6px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .sync-all-btn:hover, .analytics-btn:hover, .optimize-btn:hover {
                background: rgba(212, 175, 55, 0.2);
                border-color: #d4af37;
            }

            .sync-queue {
                max-height: 120px;
                overflow-y: auto;
            }

            .sync-item {
                background: rgba(255,255,255,0.03);
                border-radius: 6px;
                padding: 8px 10px;
                margin-bottom: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
            }

            .sync-item-info {
                flex: 1;
            }

            .sync-item-status {
                color: #ffc107;
                font-weight: 600;
            }

            .recommendations-list {
                max-height: 150px;
                overflow-y: auto;
            }

            .recommendation-item {
                background: rgba(255,255,255,0.03);
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
                border-left: 3px solid #28a745;
            }

            .recommendation-title {
                font-weight: 600;
                font-size: 12px;
                color: #28a745;
                margin-bottom: 4px;
            }

            .recommendation-content {
                font-size: 11px;
                line-height: 1.3;
                color: rgba(255,255,255,0.8);
            }

            @media (max-width: 768px) {
                .quad-integration-panel {
                    width: calc(100vw - 40px);
                    top: 10px;
                    right: 20px;
                    left: 20px;
                }

                .services-status {
                    grid-template-columns: 1fr;
                }

                .sync-controls {
                    flex-direction: column;
                }

                .sync-all-btn, .analytics-btn, .optimize-btn {
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 檢查所有服務連接狀態
     */
    async checkAllConnections() {
        const services = ['netlify', 'manus', 'openai', 'airtable'];
        
        for (const service of services) {
            try {
                await this.checkServiceConnection(service);
            } catch (error) {
                console.error(`${service} 連接檢查失敗:`, error);
                this.updateServiceStatus(service, 'disconnected', error.message);
            }
        }
    }

    /**
     * 檢查單一服務連接
     */
    async checkServiceConnection(serviceName) {
        try {
            let endpoint, testAction;
            
            switch (serviceName) {
                case 'netlify':
                case 'manus':
                    endpoint = this.services.netlify.endpoint;
                    testAction = 'get_analytics';
                    break;
                case 'openai':
                    endpoint = this.services.openai.endpoint;
                    testAction = 'analyze_customer_intent';
                    break;
                case 'airtable':
                    endpoint = this.services.airtable.endpoint;
                    testAction = 'get_airtable_analytics';
                    break;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: testAction,
                    data: { test: true }
                })
            });

            if (response.ok) {
                this.updateServiceStatus(serviceName, 'connected', '服務正常');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            this.updateServiceStatus(serviceName, 'disconnected', error.message);
        }
    }

    /**
     * 更新服務狀態
     */
    updateServiceStatus(serviceName, status, message = '') {
        this.services[serviceName].status = status;
        
        const card = document.getElementById(`${serviceName}Card`);
        if (card) {
            const statusElement = card.querySelector('.status-indicator');
            const statusText = card.querySelector('.service-status');
            
            if (statusElement) {
                statusElement.className = `status-indicator ${status}`;
            }
            
            if (statusText) {
                statusText.textContent = message || this.getStatusText(status);
            }
        }
    }

    /**
     * 獲取狀態文字
     */
    getStatusText(status) {
        const statusTexts = {
            connected: '已連接',
            disconnected: '連接失敗',
            syncing: '同步中',
            unknown: '檢查中'
        };
        return statusTexts[status] || status;
    }

    /**
     * 處理預約事件
     */
    async handleAppointmentEvent(appointmentData) {
        try {
            // 1. 同步到所有平台
            await this.syncToAllPlatforms('appointment', appointmentData);
            
            // 2. AI 分析客戶意圖
            const customerAnalysis = await this.analyzeCustomerWithAI(appointmentData);
            
            // 3. 生成個人化建議
            const recommendations = await this.generateAIRecommendations(appointmentData);
            
            // 4. 更新 UI
            this.updateInsights('新預約分析', customerAnalysis);
            this.updateRecommendations(recommendations);
            
        } catch (error) {
            console.error('預約事件處理失敗:', error);
            this.showNotification('預約處理過程中發生錯誤', 'error');
        }
    }

    /**
     * 處理表單事件
     */
    async handleFormEvent(formData) {
        try {
            // 1. 同步到所有平台
            await this.syncToAllPlatforms('form', formData);
            
            // 2. AI 情感分析
            const sentimentAnalysis = await this.analyzeSentimentWithAI(formData);
            
            // 3. 預測客戶行為
            const behaviorPrediction = await this.predictCustomerBehavior(formData);
            
            // 4. 更新 UI
            this.updateInsights('表單情感分析', sentimentAnalysis);
            this.updateInsights('客戶行為預測', behaviorPrediction);
            
        } catch (error) {
            console.error('表單事件處理失敗:', error);
            this.showNotification('表單處理過程中發生錯誤', 'error');
        }
    }

    /**
     * 處理 AI 對話事件
     */
    async handleAIChatEvent(chatData) {
        try {
            // 1. 記錄到所有平台
            await this.syncToAllPlatforms('ai_chat', chatData);
            
            // 2. 分析對話品質
            const qualityAnalysis = await this.analyzeConversationQuality(chatData);
            
            // 3. 提取客戶洞察
            const customerInsights = await this.extractCustomerInsights(chatData);
            
            // 4. 更新 UI
            this.updateInsights('對話品質分析', qualityAnalysis);
            this.updateInsights('客戶洞察', customerInsights);
            
        } catch (error) {
            console.error('AI 對話事件處理失敗:', error);
        }
    }

    /**
     * 同步到所有平台
     */
    async syncToAllPlatforms(dataType, data) {
        const syncPromises = [];
        
        // 同步到 Manus
        if (this.services.manus.status === 'connected') {
            syncPromises.push(this.syncToManus(dataType, data));
        }
        
        // 同步到 Airtable
        if (this.services.airtable.status === 'connected') {
            syncPromises.push(this.syncToAirtable(dataType, data));
        }
        
        // 等待所有同步完成
        const results = await Promise.allSettled(syncPromises);
        
        // 處理同步結果
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`同步失敗 (${index}):`, result.reason);
            }
        });
    }

    /**
     * 同步到 Manus
     */
    async syncToManus(dataType, data) {
        const response = await fetch(this.services.manus.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: `sync_${dataType}`,
                data: data
            })
        });
        
        if (!response.ok) {
            throw new Error(`Manus 同步失敗: ${response.status}`);
        }
        
        return await response.json();
    }

    /**
     * 同步到 Airtable
     */
    async syncToAirtable(dataType, data) {
        const actionMap = {
            appointment: 'sync_appointment_to_airtable',
            form: 'sync_form_to_airtable',
            ai_chat: 'create_airtable_record'
        };
        
        const response = await fetch(this.services.airtable.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: actionMap[dataType] || 'create_airtable_record',
                data: data
            })
        });
        
        if (!response.ok) {
            throw new Error(`Airtable 同步失敗: ${response.status}`);
        }
        
        return await response.json();
    }

    /**
     * 使用 AI 分析客戶
     */
    async analyzeCustomerWithAI(customerData) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_customer_intent',
                    data: {
                        customerMessage: customerData.notes || '',
                        customerHistory: customerData.history || [],
                        appointmentData: customerData
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('AI 客戶分析失敗:', error);
        }
        
        return null;
    }

    /**
     * 生成 AI 建議
     */
    async generateAIRecommendations(data) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_personalized_recommendations',
                    data: {
                        customerProfile: data,
                        treatmentHistory: data.history || [],
                        preferences: data.preferences || {}
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('AI 建議生成失敗:', error);
        }
        
        return null;
    }

    /**
     * AI 情感分析
     */
    async analyzeSentimentWithAI(data) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_customer_sentiment',
                    data: {
                        customerFeedback: [data.notes || ''],
                        chatHistory: [],
                        reviewData: {}
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('AI 情感分析失敗:', error);
        }
        
        return null;
    }

    /**
     * 預測客戶行為
     */
    async predictCustomerBehavior(data) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'predict_customer_behavior',
                    data: {
                        customerData: data,
                        historicalPatterns: [],
                        externalFactors: {}
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('客戶行為預測失敗:', error);
        }
        
        return null;
    }

    /**
     * 分析對話品質
     */
    async analyzeConversationQuality(chatData) {
        // 實現對話品質分析邏輯
        return {
            quality: 'good',
            satisfaction: 85,
            improvements: ['回應更個人化', '提供更多選項']
        };
    }

    /**
     * 提取客戶洞察
     */
    async extractCustomerInsights(chatData) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'extract_data_insights',
                    data: {
                        rawData: chatData,
                        analysisType: 'customer_conversation',
                        focusAreas: ['intent', 'satisfaction', 'needs']
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('客戶洞察提取失敗:', error);
        }
        
        return null;
    }

    /**
     * 更新洞察顯示
     */
    updateInsights(title, data) {
        const insightsGrid = document.getElementById('aiInsightsGrid');
        if (!insightsGrid || !data) return;
        
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        insightCard.innerHTML = `
            <div class="insight-title">${title}</div>
            <div class="insight-content">${this.formatInsightContent(data)}</div>
        `;
        
        // 移除載入中的卡片
        const loadingCard = insightsGrid.querySelector('.insight-card.loading');
        if (loadingCard) {
            loadingCard.remove();
        }
        
        insightsGrid.appendChild(insightCard);
        
        // 限制顯示數量
        const cards = insightsGrid.querySelectorAll('.insight-card');
        if (cards.length > 3) {
            cards[0].remove();
        }
    }

    /**
     * 格式化洞察內容
     */
    formatInsightContent(data) {
        if (typeof data === 'string') {
            return data;
        }
        
        if (data.intent) {
            return `客戶意圖: ${data.intent}, 信心度: ${data.confidence || 'N/A'}%`;
        }
        
        if (data.overallSentiment) {
            return `情感: ${data.overallSentiment}, 滿意度: ${data.satisfactionScore || 'N/A'}/10`;
        }
        
        if (data.rebookingProbability) {
            return `再次預約可能性: ${data.rebookingProbability}%, 流失風險: ${data.churnRisk}`;
        }
        
        return JSON.stringify(data).substring(0, 100) + '...';
    }

    /**
     * 更新建議顯示
     */
    updateRecommendations(recommendations) {
        const recommendationsList = document.getElementById('aiRecommendations');
        if (!recommendationsList || !recommendations) return;
        
        recommendationsList.innerHTML = '';
        
        if (recommendations.recommendedTreatments) {
            recommendations.recommendedTreatments.slice(0, 3).forEach(treatment => {
                const item = document.createElement('div');
                item.className = 'recommendation-item';
                item.innerHTML = `
                    <div class="recommendation-title">${treatment.treatment}</div>
                    <div class="recommendation-content">${treatment.reason}</div>
                `;
                recommendationsList.appendChild(item);
            });
        }
        
        if (recommendations.actionableInsights) {
            recommendations.actionableInsights.slice(0, 2).forEach(insight => {
                const item = document.createElement('div');
                item.className = 'recommendation-item';
                item.innerHTML = `
                    <div class="recommendation-title">行動建議</div>
                    <div class="recommendation-content">${insight}</div>
                `;
                recommendationsList.appendChild(item);
            });
        }
    }

    /**
     * 運行 AI 分析
     */
    async runAIAnalysis() {
        this.showNotification('正在運行 AI 深度分析...', 'info');
        
        try {
            // 獲取業務數據
            const businessData = await this.getBusinessData();
            
            // 運行多項 AI 分析
            const analyses = await Promise.allSettled([
                this.runBusinessPerformanceAnalysis(businessData),
                this.runMarketingInsightsAnalysis(businessData),
                this.runOperationalOptimization(businessData)
            ]);
            
            // 處理分析結果
            analyses.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const titles = ['業務績效分析', '行銷洞察分析', '營運優化建議'];
                    this.updateInsights(titles[index], result.value);
                }
            });
            
            this.showNotification('AI 分析完成！', 'success');
            
        } catch (error) {
            console.error('AI 分析失敗:', error);
            this.showNotification('AI 分析過程中發生錯誤', 'error');
        }
    }

    /**
     * 獲取業務數據
     */
    async getBusinessData() {
        // 從各平台獲取數據
        const data = {
            appointments: [],
            forms: [],
            analytics: {},
            airtableData: {}
        };
        
        try {
            // 從 Airtable 獲取數據
            if (this.services.airtable.status === 'connected') {
                const airtableResponse = await fetch(this.services.airtable.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_airtable_analytics' })
                });
                
                if (airtableResponse.ok) {
                    const result = await airtableResponse.json();
                    data.airtableData = result.data;
                }
            }
            
            // 從 Manus 獲取數據
            if (this.services.manus.status === 'connected') {
                const manusResponse = await fetch(this.services.manus.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_analytics' })
                });
                
                if (manusResponse.ok) {
                    const result = await manusResponse.json();
                    data.analytics = result.data;
                }
            }
            
        } catch (error) {
            console.error('獲取業務數據失敗:', error);
        }
        
        return data;
    }

    /**
     * 運行業務績效分析
     */
    async runBusinessPerformanceAnalysis(businessData) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_business_performance',
                    data: {
                        financialData: businessData.analytics.summary || {},
                        operationalMetrics: businessData.airtableData.summary || {},
                        competitorData: {}
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('業務績效分析失敗:', error);
        }
        
        return null;
    }

    /**
     * 運行行銷洞察分析
     */
    async runMarketingInsightsAnalysis(businessData) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_marketing_insights',
                    data: {
                        campaignData: businessData.analytics.sources || {},
                        customerSegments: businessData.airtableData.clientsBySource || {},
                        marketTrends: {}
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('行銷洞察分析失敗:', error);
        }
        
        return null;
    }

    /**
     * 運行營運優化分析
     */
    async runOperationalOptimization(businessData) {
        try {
            const response = await fetch(this.services.openai.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'optimize_scheduling',
                    data: {
                        currentSchedule: businessData.appointments || [],
                        appointmentRequests: businessData.forms || [],
                        constraints: {
                            businessHours: '週二-五 12:00-20:00，週六 11:00-20:00',
                            maxPerSlot: 2,
                            slotDuration: 15
                        }
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('營運優化分析失敗:', error);
        }
        
        return null;
    }

    /**
     * 切換面板顯示
     */
    togglePanel() {
        const content = document.getElementById('quadPanelContent');
        const toggle = document.querySelector('.panel-toggle i');
        
        if (content.classList.contains('open')) {
            content.classList.remove('open');
            toggle.style.transform = 'rotate(0deg)';
        } else {
            content.classList.add('open');
            toggle.style.transform = 'rotate(180deg)';
        }
    }

    /**
     * 全部同步
     */
    async syncAll() {
        this.showNotification('開始全部同步...', 'info');
        
        try {
            // 獲取所有待同步數據
            const allData = await this.getAllPendingData();
            
            // 同步到各平台
            for (const dataItem of allData) {
                await this.syncToAllPlatforms(dataItem.type, dataItem.data);
            }
            
            this.showNotification('全部同步完成！', 'success');
            
        } catch (error) {
            console.error('全部同步失敗:', error);
            this.showNotification('同步過程中發生錯誤', 'error');
        }
    }

    /**
     * 獲取所有待同步數據
     */
    async getAllPendingData() {
        // 這裡應該從本地存儲或其他來源獲取待同步的數據
        return [];
    }

    /**
     * 顯示分析報告
     */
    async showAnalytics() {
        await this.runAIAnalysis();
    }

    /**
     * 智能優化操作
     */
    async optimizeOperations() {
        this.showNotification('正在進行智能優化...', 'info');
        
        try {
            const businessData = await this.getBusinessData();
            const optimization = await this.runOperationalOptimization(businessData);
            
            if (optimization) {
                this.updateInsights('智能優化建議', optimization);
                this.showNotification('智能優化完成！', 'success');
            }
            
        } catch (error) {
            console.error('智能優化失敗:', error);
            this.showNotification('優化過程中發生錯誤', 'error');
        }
    }

    /**
     * 開始智能同步
     */
    startIntelligentSync() {
        // 每 10 分鐘檢查一次連接狀態
        setInterval(() => {
            this.checkAllConnections();
        }, 10 * 60 * 1000);

        // 每 30 秒處理一次同步佇列
        setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.processIntelligentSync();
            }
        }, 30 * 1000);

        // 每小時運行一次 AI 分析
        setInterval(() => {
            this.runAIAnalysis();
        }, 60 * 60 * 1000);
    }

    /**
     * 處理智能同步
     */
    async processIntelligentSync() {
        // 實現智能同步邏輯
        console.log('處理智能同步...');
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

// 初始化四方整合管理器
document.addEventListener('DOMContentLoaded', function() {
    window.quadManager = new QuadIntegrationManager();
    console.log('四方整合智能管理中心已啟動');
});

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuadIntegrationManager;
}
