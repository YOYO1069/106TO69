/**
 * 劉道玄醫師診所 - 獨立整合系統
 * 整合 Google Services, LINE, OpenAI 等服務
 */

class ClinicIntegrationSystem {
    constructor() {
        this.services = {
            google: { status: 'unknown', endpoint: '/.netlify/functions/google-services' },
            line: { status: 'unknown', endpoint: '/.netlify/functions/line-webhook' },
            openai: { status: 'unknown', endpoint: '/.netlify/functions/openai-chat' },
            airtable: { status: 'unknown', endpoint: '/.netlify/functions/airtable-integration' }
        };
        
        this.isInitialized = false;
        this.syncQueue = [];
        this.retryAttempts = 3;
        this.retryDelay = 2000;
    }

    /**
     * 初始化整合系統
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 初始化診所整合系統...');
            
            // 檢查所有服務狀態
            await this.checkAllServices();
            
            // 設置自動同步
            this.setupAutoSync();
            
            this.isInitialized = true;
            console.log('✅ 診所整合系統初始化完成');
            
            // 觸發初始化完成事件
            this.dispatchEvent('systemReady', { services: this.services });
            
        } catch (error) {
            console.error('❌ 系統初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 檢查所有服務狀態
     */
    async checkAllServices() {
        const checkPromises = Object.keys(this.services).map(service => 
            this.checkServiceStatus(service)
        );
        
        await Promise.allSettled(checkPromises);
    }

    /**
     * 檢查單個服務狀態
     */
    async checkServiceStatus(serviceName) {
        try {
            const service = this.services[serviceName];
            if (!service) return;

            const response = await fetch(`${service.endpoint}/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this.updateServiceStatus(serviceName, 'connected');
            } else {
                this.updateServiceStatus(serviceName, 'error');
            }
        } catch (error) {
            console.warn(`⚠️ ${serviceName} 服務檢查失敗:`, error.message);
            this.updateServiceStatus(serviceName, 'disconnected');
        }
    }

    /**
     * 更新服務狀態
     */
    updateServiceStatus(serviceName, status) {
        if (this.services[serviceName]) {
            this.services[serviceName].status = status;
            this.dispatchEvent('serviceStatusChanged', { service: serviceName, status });
        }
    }

    /**
     * 設置自動同步
     */
    setupAutoSync() {
        // 每5分鐘檢查一次服務狀態
        setInterval(() => {
            this.checkAllServices();
        }, 5 * 60 * 1000);

        // 每30秒處理同步隊列
        setInterval(() => {
            this.processSyncQueue();
        }, 30 * 1000);
    }

    /**
     * 添加數據到同步隊列
     */
    addToSyncQueue(dataType, data, targetServices = null) {
        const syncItem = {
            id: Date.now() + Math.random(),
            dataType,
            data,
            targetServices: targetServices || Object.keys(this.services),
            timestamp: new Date().toISOString(),
            attempts: 0
        };

        this.syncQueue.push(syncItem);
        console.log(`📝 添加到同步隊列: ${dataType}`, syncItem);
    }

    /**
     * 處理同步隊列
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        console.log(`🔄 處理同步隊列 (${this.syncQueue.length} 項目)`);

        const itemsToProcess = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of itemsToProcess) {
            try {
                await this.syncDataItem(item);
            } catch (error) {
                console.error('同步失敗:', error);
                
                // 重試機制
                if (item.attempts < this.retryAttempts) {
                    item.attempts++;
                    setTimeout(() => {
                        this.syncQueue.push(item);
                    }, this.retryDelay * item.attempts);
                }
            }
        }
    }

    /**
     * 同步單個數據項目
     */
    async syncDataItem(item) {
        const { dataType, data, targetServices } = item;
        const syncPromises = [];

        for (const serviceName of targetServices) {
            if (this.services[serviceName]?.status === 'connected') {
                syncPromises.push(this.syncToService(serviceName, dataType, data));
            }
        }

        if (syncPromises.length > 0) {
            await Promise.allSettled(syncPromises);
        }
    }

    /**
     * 同步到指定服務
     */
    async syncToService(serviceName, dataType, data) {
        try {
            const service = this.services[serviceName];
            const response = await fetch(`${service.endpoint}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: dataType,
                    data: data,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ ${serviceName} 同步成功:`, result);
            return result;

        } catch (error) {
            console.error(`❌ ${serviceName} 同步失敗:`, error);
            throw error;
        }
    }

    /**
     * 預約數據同步
     */
    async syncAppointment(appointmentData) {
        this.addToSyncQueue('appointment', appointmentData, ['google', 'line']);
    }

    /**
     * 客戶數據同步
     */
    async syncCustomer(customerData) {
        this.addToSyncQueue('customer', customerData, ['airtable', 'google']);
    }

    /**
     * 療程記錄同步
     */
    async syncTreatment(treatmentData) {
        this.addToSyncQueue('treatment', treatmentData, ['airtable']);
    }

    /**
     * AI分析結果同步
     */
    async syncAIAnalysis(analysisData) {
        this.addToSyncQueue('ai_analysis', analysisData, ['airtable']);
    }

    /**
     * 獲取服務狀態
     */
    getServiceStatus(serviceName = null) {
        if (serviceName) {
            return this.services[serviceName]?.status || 'unknown';
        }
        return this.services;
    }

    /**
     * 獲取系統健康狀態
     */
    getSystemHealth() {
        const connectedServices = Object.values(this.services)
            .filter(service => service.status === 'connected').length;
        const totalServices = Object.keys(this.services).length;
        
        return {
            isHealthy: connectedServices > 0,
            connectedServices,
            totalServices,
            healthPercentage: Math.round((connectedServices / totalServices) * 100),
            services: this.services,
            queueLength: this.syncQueue.length
        };
    }

    /**
     * 事件分發
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(`clinic:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 手動觸發完整同步
     */
    async triggerFullSync() {
        console.log('🔄 觸發完整同步...');
        
        try {
            // 重新檢查所有服務
            await this.checkAllServices();
            
            // 處理待同步項目
            await this.processSyncQueue();
            
            console.log('✅ 完整同步完成');
            this.dispatchEvent('fullSyncComplete', this.getSystemHealth());
            
        } catch (error) {
            console.error('❌ 完整同步失敗:', error);
            throw error;
        }
    }
}

// 全局實例
window.ClinicIntegration = new ClinicIntegrationSystem();

// 自動初始化
document.addEventListener('DOMContentLoaded', () => {
    window.ClinicIntegration.initialize().catch(console.error);
});

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClinicIntegrationSystem;
}
