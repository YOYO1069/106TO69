/**
 * 劉道玄醫美診所 - 表單整理管理模組
 * 客戶資料管理、表單狀態追蹤、多社群來源整合
 */

class FormManagement {
    constructor() {
        this.forms = new Map();
        this.filters = {
            status: '',
            source: '',
            date: '',
            search: ''
        };
        this.statistics = {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
        };
        this.init();
    }

    init() {
        this.loadFormsFromStorage();
        this.setupEventListeners();
        this.updateStatistics();
    }

    // 從本地存儲載入表單數據
    loadFormsFromStorage() {
        const storedForms = localStorage.getItem('medicalPlatformForms');
        if (storedForms) {
            const formsArray = JSON.parse(storedForms);
            formsArray.forEach(form => {
                this.forms.set(form.id, form);
            });
        } else {
            // 初始化示例數據
            this.initializeSampleData();
        }
    }

    // 初始化示例數據
    initializeSampleData() {
        const sampleForms = [
            {
                id: 'F001',
                clientName: '王小姐',
                clientPhone: '0912-345-678',
                clientEmail: 'wang@example.com',
                service: '肉毒桿菌',
                appointmentTime: '2024-09-25T14:00',
                source: 'line',
                status: 'confirmed',
                createdTime: '2024-09-20T10:30',
                age: 28,
                notes: '第一次施打，需要詳細說明',
                price: 8000,
                deposit: 2000
            },
            {
                id: 'F002',
                clientName: '李先生',
                clientPhone: '0923-456-789',
                clientEmail: 'lee@example.com',
                service: '玻尿酸填充',
                appointmentTime: '2024-09-25T15:00',
                source: 'instagram',
                status: 'pending',
                createdTime: '2024-09-21T16:45',
                age: 35,
                notes: '希望改善法令紋',
                price: 12000,
                deposit: 0
            },
            {
                id: 'F003',
                clientName: '陳小姐',
                clientPhone: '0934-567-890',
                clientEmail: 'chen@example.com',
                service: '皮秒雷射',
                appointmentTime: '2024-09-26T16:00',
                source: 'facebook',
                status: 'completed',
                createdTime: '2024-09-18T14:20',
                age: 32,
                notes: '除斑治療，已完成第一次',
                price: 15000,
                deposit: 5000
            }
        ];

        sampleForms.forEach(form => {
            this.forms.set(form.id, form);
        });

        this.saveFormsToStorage();
    }

    // 儲存表單數據到本地存儲
    saveFormsToStorage() {
        const formsArray = Array.from(this.forms.values());
        localStorage.setItem('medicalPlatformForms', JSON.stringify(formsArray));
    }

    // 新增表單
    addForm(formData) {
        const formId = this.generateFormId();
        const newForm = {
            id: formId,
            ...formData,
            createdTime: new Date().toISOString(),
            status: 'pending'
        };

        this.forms.set(formId, newForm);
        this.saveFormsToStorage();
        this.updateStatistics();
        
        return formId;
    }

    // 更新表單
    updateForm(formId, updates) {
        const form = this.forms.get(formId);
        if (form) {
            Object.assign(form, updates);
            form.updatedTime = new Date().toISOString();
            this.forms.set(formId, form);
            this.saveFormsToStorage();
            this.updateStatistics();
            return true;
        }
        return false;
    }

    // 刪除表單
    deleteForm(formId) {
        const deleted = this.forms.delete(formId);
        if (deleted) {
            this.saveFormsToStorage();
            this.updateStatistics();
        }
        return deleted;
    }

    // 獲取表單
    getForm(formId) {
        return this.forms.get(formId);
    }

    // 獲取所有表單
    getAllForms() {
        return Array.from(this.forms.values());
    }

    // 獲取篩選後的表單
    getFilteredForms() {
        let forms = this.getAllForms();

        // 狀態篩選
        if (this.filters.status) {
            forms = forms.filter(form => form.status === this.filters.status);
        }

        // 來源篩選
        if (this.filters.source) {
            forms = forms.filter(form => form.source === this.filters.source);
        }

        // 日期篩選
        if (this.filters.date) {
            forms = forms.filter(form => 
                form.appointmentTime.startsWith(this.filters.date)
            );
        }

        // 搜尋篩選
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            forms = forms.filter(form => 
                form.clientName.toLowerCase().includes(searchTerm) ||
                form.clientPhone.includes(searchTerm) ||
                (form.clientEmail && form.clientEmail.toLowerCase().includes(searchTerm))
            );
        }

        return forms;
    }

    // 設置篩選器
    setFilter(filterType, value) {
        this.filters[filterType] = value;
    }

    // 清除篩選器
    clearFilters() {
        this.filters = {
            status: '',
            source: '',
            date: '',
            search: ''
        };
    }

    // 更新統計數據
    updateStatistics() {
        const forms = this.getAllForms();
        
        this.statistics = {
            total: forms.length,
            pending: forms.filter(f => f.status === 'pending').length,
            confirmed: forms.filter(f => f.status === 'confirmed').length,
            completed: forms.filter(f => f.status === 'completed').length,
            cancelled: forms.filter(f => f.status === 'cancelled').length
        };

        this.broadcastStatisticsUpdate();
    }

    // 廣播統計更新
    broadcastStatisticsUpdate() {
        const event = new CustomEvent('formStatisticsUpdated', {
            detail: this.statistics
        });
        document.dispatchEvent(event);
    }

    // 生成表單ID
    generateFormId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `F${timestamp}${random}`.slice(-10);
    }

    // 驗證表單數據
    validateFormData(formData) {
        const required = ['clientName', 'clientPhone', 'service', 'appointmentTime', 'source'];
        const missing = required.filter(field => !formData[field]);
        
        if (missing.length > 0) {
            return {
                valid: false,
                errors: missing.map(field => `${field} 為必填欄位`)
            };
        }

        // 電話號碼格式驗證
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(formData.clientPhone.replace(/[-\s]/g, ''))) {
            return {
                valid: false,
                errors: ['電話號碼格式不正確']
            };
        }

        // Email格式驗證（如果有提供）
        if (formData.clientEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.clientEmail)) {
                return {
                    valid: false,
                    errors: ['Email格式不正確']
                };
            }
        }

        return { valid: true, errors: [] };
    }

    // 匯出表單數據
    exportForms(format = 'json') {
        const forms = this.getAllForms();
        
        switch (format) {
            case 'json':
                return this.exportAsJSON(forms);
            case 'csv':
                return this.exportAsCSV(forms);
            case 'excel':
                return this.exportAsExcel(forms);
            default:
                return this.exportAsJSON(forms);
        }
    }

    // 匯出為JSON
    exportAsJSON(forms) {
        const data = JSON.stringify(forms, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `預約表單_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // 匯出為CSV
    exportAsCSV(forms) {
        const headers = ['表單編號', '客戶姓名', '聯絡電話', '預約項目', '預約時間', '來源', '狀態', '建立時間'];
        const csvContent = [
            headers.join(','),
            ...forms.map(form => [
                form.id,
                form.clientName,
                form.clientPhone,
                form.service,
                form.appointmentTime,
                form.source,
                form.status,
                form.createdTime
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `預約表單_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // 批量操作
    bulkOperation(formIds, operation) {
        let successCount = 0;
        
        formIds.forEach(formId => {
            switch (operation) {
                case 'confirm':
                    if (this.updateForm(formId, { status: 'confirmed' })) {
                        successCount++;
                    }
                    break;
                case 'complete':
                    if (this.updateForm(formId, { status: 'completed' })) {
                        successCount++;
                    }
                    break;
                case 'cancel':
                    if (this.updateForm(formId, { status: 'cancelled' })) {
                        successCount++;
                    }
                    break;
                case 'delete':
                    if (this.deleteForm(formId)) {
                        successCount++;
                    }
                    break;
            }
        });

        return successCount;
    }

    // 獲取來源統計
    getSourceStatistics() {
        const forms = this.getAllForms();
        const sourceStats = {};

        forms.forEach(form => {
            if (!sourceStats[form.source]) {
                sourceStats[form.source] = 0;
            }
            sourceStats[form.source]++;
        });

        return sourceStats;
    }

    // 獲取狀態統計
    getStatusStatistics() {
        return { ...this.statistics };
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 監聽統計更新事件
        document.addEventListener('formStatisticsUpdated', (event) => {
            this.onStatisticsUpdated(event.detail);
        });
    }

    // 統計更新回調
    onStatisticsUpdated(statistics) {
        // 更新UI中的統計顯示
        const elements = {
            totalForms: document.getElementById('totalForms'),
            pendingForms: document.getElementById('pendingForms'),
            confirmedForms: document.getElementById('confirmedForms'),
            completedForms: document.getElementById('completedForms')
        };

        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                const statKey = key.replace('Forms', '').toLowerCase();
                if (statKey === 'total') {
                    element.textContent = statistics.total;
                } else {
                    element.textContent = statistics[statKey] || 0;
                }
            }
        });
    }

    // 同步表單數據（模擬API同步）
    async syncForms() {
        try {
            // 模擬API調用
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 這裡可以實現真實的API同步邏輯
            console.log('Forms synced successfully');
            
            return { success: true, message: '表單數據已同步' };
        } catch (error) {
            console.error('Sync failed:', error);
            return { success: false, message: '同步失敗，請稍後再試' };
        }
    }

    // 生成報表
    generateReport(type = 'monthly') {
        const forms = this.getAllForms();
        const now = new Date();
        
        let filteredForms;
        
        switch (type) {
            case 'daily':
                const today = now.toISOString().split('T')[0];
                filteredForms = forms.filter(form => 
                    form.appointmentTime.startsWith(today)
                );
                break;
            case 'weekly':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredForms = forms.filter(form => 
                    new Date(form.appointmentTime) >= weekAgo
                );
                break;
            case 'monthly':
            default:
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filteredForms = forms.filter(form => 
                    new Date(form.appointmentTime) >= monthAgo
                );
                break;
        }

        return {
            period: type,
            totalForms: filteredForms.length,
            sourceBreakdown: this.getSourceBreakdown(filteredForms),
            statusBreakdown: this.getStatusBreakdown(filteredForms),
            revenueEstimate: this.calculateRevenue(filteredForms),
            generatedAt: now.toISOString()
        };
    }

    // 獲取來源分佈
    getSourceBreakdown(forms) {
        const breakdown = {};
        forms.forEach(form => {
            breakdown[form.source] = (breakdown[form.source] || 0) + 1;
        });
        return breakdown;
    }

    // 獲取狀態分佈
    getStatusBreakdown(forms) {
        const breakdown = {};
        forms.forEach(form => {
            breakdown[form.status] = (breakdown[form.status] || 0) + 1;
        });
        return breakdown;
    }

    // 計算營收估算
    calculateRevenue(forms) {
        return forms.reduce((total, form) => {
            if (form.status === 'completed' && form.price) {
                return total + form.price;
            }
            return total;
        }, 0);
    }
}

// 全域表單管理實例
window.FormManagement = new FormManagement();

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormManagement;
}
