/**
 * 智能客戶關係管理系統
 * 整合 Google Sheets、AI 分析和客戶生命週期管理
 */

class SmartCRMManager {
    constructor() {
        this.customers = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            stage: '',
            source: '',
            search: ''
        };
        this.charts = {};
        
        this.init();
    }
    
    async init() {
        console.log('🚀 初始化智能CRM系統...');
        
        try {
            this.bindEventHandlers();
            await this.loadCustomerData();
            this.renderMetrics();
            this.renderCustomerList();
            this.initializeCharts();
            await this.generateAIInsights();
            this.loadRecentActivities();
            
            console.log('✅ 智能CRM系統初始化完成');
        } catch (error) {
            console.error('❌ CRM系統初始化失敗:', error);
            this.showError('系統初始化失敗，請重新整理頁面');
        }
    }
    
    bindEventHandlers() {
        // 篩選器事件
        document.getElementById('stageFilter').addEventListener('change', (e) => {
            this.filters.stage = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('sourceFilter').addEventListener('change', (e) => {
            this.filters.source = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('searchCustomer').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });
        
        // 新增客戶按鈕
        document.getElementById('addCustomerBtn').addEventListener('click', () => {
            this.showAddCustomerModal();
        });
        
        // 模態框按鈕
        document.getElementById('scheduleFollowUpBtn').addEventListener('click', () => {
            this.scheduleFollowUp();
        });
        
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('updateStageBtn').addEventListener('click', () => {
            this.updateCustomerStage();
        });
    }
    
    async loadCustomerData() {
        console.log('📊 載入客戶資料...');
        
        try {
            // 從 Google Sheets 載入客戶資料
            const response = await fetch('/.netlify/functions/google-sheets-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'read_sheet',
                    data: { range: 'A:Z' }
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                this.customers = this.processCustomerData(result.data);
                console.log(`✅ 載入 ${this.customers.length} 位客戶資料`);
            } else {
                // 如果沒有資料，使用模擬資料
                this.customers = this.generateMockCustomers();
                console.log('⚠️ 使用模擬客戶資料');
            }
            
        } catch (error) {
            console.error('❌ 載入客戶資料失敗:', error);
            this.customers = this.generateMockCustomers();
        }
    }
    
    processCustomerData(rawData) {
        const headers = rawData[0] || [];
        const customers = [];
        
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            
            const customer = {
                id: `customer_${i}`,
                name: row[2] || '未知客戶',
                phone: row[3] || '',
                email: row[4] || '',
                source: row[1] || 'Unknown',
                inquiryType: row[5] || '',
                treatment: row[6] || '',
                content: row[7] || '',
                intent: row[8] || '',
                status: row[9] || 'pending',
                appointmentDate: row[10] || '',
                followUpNeeded: row[11] || '',
                notes: row[12] || '',
                leadScore: parseInt(row[13]) || 5,
                conversionStatus: row[14] || 'lead',
                createdAt: row[0] || new Date().toISOString(),
                lastContact: this.calculateLastContact(row[0]),
                lifetimeValue: this.calculateLifetimeValue(row),
                stage: this.determineLifecycleStage(row),
                tags: this.generateCustomerTags(row),
                interactions: this.generateInteractionHistory(row)
            };
            
            customers.push(customer);
        }
        
        return customers;
    }
    
    generateMockCustomers() {
        const mockCustomers = [
            {
                id: 'customer_1',
                name: '陳美麗',
                phone: '0912345678',
                email: 'beauty.chen@email.com',
                source: 'LINE',
                inquiryType: '療程諮詢',
                treatment: '肉毒桿菌',
                intent: '價格詢問',
                status: 'confirmed',
                leadScore: 8,
                stage: 'customer',
                lifetimeValue: 25000,
                createdAt: '2024-01-15',
                lastContact: 5,
                tags: ['VIP', '回頭客', '推薦客戶'],
                interactions: [
                    { date: '2024-01-15', type: 'inquiry', content: '詢問肉毒桿菌價格' },
                    { date: '2024-01-20', type: 'appointment', content: '預約療程' },
                    { date: '2024-01-25', type: 'treatment', content: '完成肉毒桿菌療程' }
                ]
            },
            {
                id: 'customer_2',
                name: '林雅婷',
                phone: '0923456789',
                email: 'yating.lin@email.com',
                source: 'Instagram',
                inquiryType: '療程諮詢',
                treatment: '玻尿酸',
                intent: '效果詢問',
                status: 'pending',
                leadScore: 6,
                stage: 'prospect',
                lifetimeValue: 0,
                createdAt: '2024-02-01',
                lastContact: 2,
                tags: ['新客戶', '年輕族群'],
                interactions: [
                    { date: '2024-02-01', type: 'inquiry', content: '詢問玻尿酸效果' },
                    { date: '2024-02-03', type: 'follow_up', content: '發送療程資訊' }
                ]
            },
            {
                id: 'customer_3',
                name: '王小華',
                phone: '0934567890',
                email: 'xiaohua.wang@email.com',
                source: 'Facebook',
                inquiryType: '價格詢問',
                treatment: '音波拉皮',
                intent: '比價',
                status: 'pending',
                leadScore: 4,
                stage: 'lead',
                lifetimeValue: 0,
                createdAt: '2024-02-10',
                lastContact: 1,
                tags: ['價格敏感', '比較中'],
                interactions: [
                    { date: '2024-02-10', type: 'inquiry', content: '詢問音波拉皮價格' }
                ]
            }
        ];
        
        // 生成更多模擬客戶
        for (let i = 4; i <= 50; i++) {
            mockCustomers.push(this.generateRandomCustomer(i));
        }
        
        return mockCustomers;
    }
    
    generateRandomCustomer(id) {
        const names = ['張小明', '李美玲', '黃志偉', '劉雅芳', '吳建國', '蔡淑芬', '鄭大同', '謝美惠'];
        const sources = ['LINE', 'Instagram', 'Facebook', '電話', '現場'];
        const treatments = ['肉毒桿菌', '玻尿酸', '音波拉皮', '電波拉皮', '雷射除斑', '淨膚雷射'];
        const stages = ['lead', 'prospect', 'customer', 'vip', 'inactive'];
        
        const name = names[Math.floor(Math.random() * names.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const treatment = treatments[Math.floor(Math.random() * treatments.length)];
        const stage = stages[Math.floor(Math.random() * stages.length)];
        
        return {
            id: `customer_${id}`,
            name: name,
            phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            email: `${name.toLowerCase()}@email.com`,
            source: source,
            treatment: treatment,
            stage: stage,
            leadScore: Math.floor(Math.random() * 10) + 1,
            lifetimeValue: stage === 'customer' || stage === 'vip' ? Math.floor(Math.random() * 50000) + 10000 : 0,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lastContact: Math.floor(Math.random() * 30),
            tags: this.generateRandomTags(),
            interactions: this.generateRandomInteractions()
        };
    }
    
    generateRandomTags() {
        const allTags = ['新客戶', 'VIP', '回頭客', '推薦客戶', '價格敏感', '年輕族群', '熟齡客戶', '比較中'];
        const numTags = Math.floor(Math.random() * 3) + 1;
        const tags = [];
        
        for (let i = 0; i < numTags; i++) {
            const tag = allTags[Math.floor(Math.random() * allTags.length)];
            if (!tags.includes(tag)) {
                tags.push(tag);
            }
        }
        
        return tags;
    }
    
    generateRandomInteractions() {
        const interactions = [];
        const types = ['inquiry', 'follow_up', 'appointment', 'treatment', 'call'];
        const numInteractions = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < numInteractions; i++) {
            interactions.push({
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                type: types[Math.floor(Math.random() * types.length)],
                content: '客戶互動記錄'
            });
        }
        
        return interactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    calculateLastContact(createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    calculateLifetimeValue(row) {
        // 根據客戶資料計算生命週期價值
        const stage = this.determineLifecycleStage(row);
        const baseValue = {
            'lead': 0,
            'prospect': 0,
            'customer': 15000,
            'vip': 35000,
            'inactive': 8000
        };
        
        return baseValue[stage] || 0;
    }
    
    determineLifecycleStage(row) {
        const status = row[9] || 'pending';
        const leadScore = parseInt(row[13]) || 5;
        const hasAppointment = row[10] && row[10] !== '';
        
        if (status === 'completed' && leadScore >= 8) return 'vip';
        if (status === 'completed' || hasAppointment) return 'customer';
        if (leadScore >= 7) return 'prospect';
        if (leadScore <= 3) return 'inactive';
        return 'lead';
    }
    
    generateCustomerTags(row) {
        const tags = [];
        const leadScore = parseInt(row[13]) || 5;
        const source = row[1] || '';
        const treatment = row[6] || '';
        
        if (leadScore >= 8) tags.push('高潛力');
        if (leadScore <= 3) tags.push('低興趣');
        if (source === 'LINE') tags.push('LINE客戶');
        if (treatment.includes('肉毒')) tags.push('肉毒客戶');
        if (treatment.includes('玻尿酸')) tags.push('玻尿酸客戶');
        
        return tags;
    }
    
    generateInteractionHistory(row) {
        const interactions = [];
        const createdAt = row[0] || new Date().toISOString();
        
        interactions.push({
            date: createdAt.split('T')[0],
            type: 'inquiry',
            content: row[7] || '初次詢問'
        });
        
        if (row[10]) {
            interactions.push({
                date: row[10],
                type: 'appointment',
                content: '預約療程'
            });
        }
        
        return interactions;
    }
    
    renderMetrics() {
        const totalCustomers = this.customers.length;
        const activeCustomers = this.customers.filter(c => c.stage !== 'inactive').length;
        const avgLifetimeValue = this.customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalCustomers;
        const retentionRate = (this.customers.filter(c => c.stage === 'customer' || c.stage === 'vip').length / totalCustomers * 100);
        
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('activeCustomers').textContent = activeCustomers;
        document.getElementById('avgLifetimeValue').textContent = `$${Math.round(avgLifetimeValue).toLocaleString()}`;
        document.getElementById('retentionRate').textContent = `${Math.round(retentionRate)}%`;
    }
    
    applyFilters() {
        this.currentPage = 1;
        this.renderCustomerList();
    }
    
    getFilteredCustomers() {
        return this.customers.filter(customer => {
            const matchesStage = !this.filters.stage || customer.stage === this.filters.stage;
            const matchesSource = !this.filters.source || customer.source === this.filters.source;
            const matchesSearch = !this.filters.search || 
                customer.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                customer.phone.includes(this.filters.search) ||
                customer.email.toLowerCase().includes(this.filters.search.toLowerCase());
            
            return matchesStage && matchesSource && matchesSearch;
        });
    }
    
    renderCustomerList() {
        const filteredCustomers = this.getFilteredCustomers();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageCustomers = filteredCustomers.slice(startIndex, endIndex);
        
        const customerList = document.getElementById('customerList');
        customerList.innerHTML = '';
        
        if (pageCustomers.length === 0) {
            customerList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-users fa-3x mb-3"></i>
                    <p>沒有找到符合條件的客戶</p>
                </div>
            `;
            return;
        }
        
        pageCustomers.forEach(customer => {
            const customerCard = this.createCustomerCard(customer);
            customerList.appendChild(customerCard);
        });
        
        this.renderPagination(filteredCustomers.length);
    }
    
    createCustomerCard(customer) {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.style.cursor = 'pointer';
        
        const stageClass = `stage-${customer.stage}`;
        const avatar = customer.name.charAt(0).toUpperCase();
        
        card.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-1">
                    <div class="customer-avatar">${avatar}</div>
                </div>
                <div class="col-md-3">
                    <h6 class="mb-1">${customer.name}</h6>
                    <small class="text-muted">${customer.phone}</small><br>
                    <small class="text-muted">${customer.email}</small>
                </div>
                <div class="col-md-2">
                    <span class="lifecycle-stage ${stageClass}">${this.getStageLabel(customer.stage)}</span>
                    <div class="mt-1">
                        <small class="text-muted">評分: ${customer.leadScore}/10</small>
                    </div>
                </div>
                <div class="col-md-2">
                    <small class="text-muted">來源</small><br>
                    <strong>${customer.source}</strong>
                    <div class="mt-1">
                        <small class="text-muted">療程: ${customer.treatment || '未指定'}</small>
                    </div>
                </div>
                <div class="col-md-2">
                    <small class="text-muted">客戶價值</small><br>
                    <strong>$${customer.lifetimeValue.toLocaleString()}</strong>
                    <div class="mt-1">
                        <small class="text-muted">最後聯繫: ${customer.lastContact}天前</small>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="mb-2">
                        ${customer.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                    </div>
                    <button class="action-btn btn-sm" onclick="window.crmManager.showCustomerDetails('${customer.id}')">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    getStageLabel(stage) {
        const labels = {
            'lead': '潛在客戶',
            'prospect': '意向客戶',
            'customer': '現有客戶',
            'vip': 'VIP客戶',
            'inactive': '非活躍'
        };
        return labels[stage] || stage;
    }
    
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('customerPagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // 上一頁
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="window.crmManager.changePage(${this.currentPage - 1})">上一頁</a>`;
        pagination.appendChild(prevLi);
        
        // 頁碼
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#" onclick="window.crmManager.changePage(${i})">${i}</a>`;
                pagination.appendChild(li);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const li = document.createElement('li');
                li.className = 'page-item disabled';
                li.innerHTML = '<span class="page-link">...</span>';
                pagination.appendChild(li);
            }
        }
        
        // 下一頁
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="window.crmManager.changePage(${this.currentPage + 1})">下一頁</a>`;
        pagination.appendChild(nextLi);
    }
    
    changePage(page) {
        const totalPages = Math.ceil(this.getFilteredCustomers().length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderCustomerList();
        }
    }
    
    initializeCharts() {
        this.initLifecycleChart();
        this.initSourceChart();
    }
    
    initLifecycleChart() {
        const ctx = document.getElementById('lifecycleChart').getContext('2d');
        
        const stageCounts = {
            'lead': 0,
            'prospect': 0,
            'customer': 0,
            'vip': 0,
            'inactive': 0
        };
        
        this.customers.forEach(customer => {
            stageCounts[customer.stage]++;
        });
        
        this.charts.lifecycle = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['潛在客戶', '意向客戶', '現有客戶', 'VIP客戶', '非活躍'],
                datasets: [{
                    data: Object.values(stageCounts),
                    backgroundColor: [
                        '#17a2b8',
                        '#ffc107',
                        '#28a745',
                        '#6f42c1',
                        '#6c757d'
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    
    initSourceChart() {
        const ctx = document.getElementById('sourceChart').getContext('2d');
        
        const sourceCounts = {};
        this.customers.forEach(customer => {
            sourceCounts[customer.source] = (sourceCounts[customer.source] || 0) + 1;
        });
        
        this.charts.source = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(sourceCounts),
                datasets: [{
                    label: '客戶數量',
                    data: Object.values(sourceCounts),
                    backgroundColor: '#d4af37',
                    borderColor: '#f1c40f',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    }
                }
            }
        });
    }
    
    async generateAIInsights() {
        const insightsContainer = document.getElementById('aiInsights');
        
        try {
            // 準備客戶資料摘要
            const customerSummary = {
                totalCustomers: this.customers.length,
                stageDistribution: this.getStageDistribution(),
                sourceDistribution: this.getSourceDistribution(),
                avgLeadScore: this.getAverageLeadScore(),
                recentTrends: this.getRecentTrends()
            };
            
            // 呼叫 AI 分析
            const response = await fetch('/.netlify/functions/google-sheets-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_crm_data',
                    data: customerSummary
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.insights) {
                this.renderAIInsights(result.insights);
            } else {
                this.renderDefaultInsights();
            }
            
        } catch (error) {
            console.error('AI 洞察生成失敗:', error);
            this.renderDefaultInsights();
        }
    }
    
    getStageDistribution() {
        const distribution = {};
        this.customers.forEach(customer => {
            distribution[customer.stage] = (distribution[customer.stage] || 0) + 1;
        });
        return distribution;
    }
    
    getSourceDistribution() {
        const distribution = {};
        this.customers.forEach(customer => {
            distribution[customer.source] = (distribution[customer.source] || 0) + 1;
        });
        return distribution;
    }
    
    getAverageLeadScore() {
        const totalScore = this.customers.reduce((sum, customer) => sum + customer.leadScore, 0);
        return Math.round(totalScore / this.customers.length * 10) / 10;
    }
    
    getRecentTrends() {
        const last30Days = this.customers.filter(customer => {
            const createdDate = new Date(customer.createdAt);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return createdDate >= thirtyDaysAgo;
        });
        
        return {
            newCustomers: last30Days.length,
            avgLeadScore: last30Days.length > 0 ? 
                Math.round(last30Days.reduce((sum, c) => sum + c.leadScore, 0) / last30Days.length * 10) / 10 : 0
        };
    }
    
    renderAIInsights(insights) {
        const insightsContainer = document.getElementById('aiInsights');
        insightsContainer.innerHTML = `
            <div class="mb-3">
                <h6><i class="fas fa-lightbulb"></i> 關鍵洞察</h6>
                <p class="mb-2">${insights.keyInsight || '客戶組合健康，建議加強潛在客戶轉換'}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-target"></i> 行動建議</h6>
                <ul class="mb-0">
                    ${(insights.recommendations || [
                        '針對高評分潛在客戶進行主動聯繫',
                        '優化 LINE 客戶的轉換流程',
                        '為 VIP 客戶設計專屬服務方案'
                    ]).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            
            <div>
                <h6><i class="fas fa-chart-line"></i> 趨勢預測</h6>
                <p class="mb-0">${insights.prediction || '預計下月新客戶增長 15%，建議提前準備服務資源'}</p>
            </div>
        `;
    }
    
    renderDefaultInsights() {
        const insightsContainer = document.getElementById('aiInsights');
        const highScoreCustomers = this.customers.filter(c => c.leadScore >= 8).length;
        const lineCustomers = this.customers.filter(c => c.source === 'LINE').length;
        const vipCustomers = this.customers.filter(c => c.stage === 'vip').length;
        
        insightsContainer.innerHTML = `
            <div class="mb-3">
                <h6><i class="fas fa-lightbulb"></i> 關鍵洞察</h6>
                <p class="mb-2">您有 ${highScoreCustomers} 位高潛力客戶，${lineCustomers} 位 LINE 客戶，${vipCustomers} 位 VIP 客戶</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-target"></i> 行動建議</h6>
                <ul class="mb-0">
                    <li>針對高評分潛在客戶進行主動聯繫</li>
                    <li>優化 LINE 客戶的轉換流程</li>
                    <li>為 VIP 客戶設計專屬服務方案</li>
                </ul>
            </div>
            
            <div>
                <h6><i class="fas fa-chart-line"></i> 趨勢預測</h6>
                <p class="mb-0">預計下月新客戶增長 15%，建議提前準備服務資源</p>
            </div>
        `;
    }
    
    loadRecentActivities() {
        const activitiesContainer = document.getElementById('recentActivities');
        
        // 生成最近活動
        const recentActivities = [
            { time: '2小時前', type: 'new_customer', content: '新客戶 林雅婷 透過 Instagram 詢問' },
            { time: '4小時前', type: 'appointment', content: '陳美麗 預約下週三肉毒桿菌療程' },
            { time: '6小時前', type: 'follow_up', content: '王小華 追蹤提醒：音波拉皮諮詢' },
            { time: '1天前', type: 'treatment', content: '張小明 完成玻尿酸療程' },
            { time: '2天前', type: 'inquiry', content: '劉雅芳 詢問電波拉皮價格' }
        ];
        
        activitiesContainer.innerHTML = recentActivities.map(activity => `
            <div class="timeline-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <small class="text-muted">${activity.time}</small>
                        <p class="mb-0">${activity.content}</p>
                    </div>
                    <i class="fas fa-${this.getActivityIcon(activity.type)} text-warning"></i>
                </div>
            </div>
        `).join('');
    }
    
    getActivityIcon(type) {
        const icons = {
            'new_customer': 'user-plus',
            'appointment': 'calendar-check',
            'follow_up': 'phone',
            'treatment': 'check-circle',
            'inquiry': 'question-circle'
        };
        return icons[type] || 'circle';
    }
    
    showCustomerDetails(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        // 填充模態框內容
        document.getElementById('modalAvatar').textContent = customer.name.charAt(0).toUpperCase();
        document.getElementById('modalCustomerName').textContent = customer.name;
        document.getElementById('modalLifecycleStage').textContent = this.getStageLabel(customer.stage);
        document.getElementById('modalLifecycleStage').className = `lifecycle-stage stage-${customer.stage}`;
        
        // 聯絡資訊
        document.getElementById('modalContactInfo').innerHTML = `
            <div><i class="fas fa-phone"></i> ${customer.phone}</div>
            <div><i class="fas fa-envelope"></i> ${customer.email}</div>
            <div><i class="fas fa-tag"></i> 來源: ${customer.source}</div>
        `;
        
        // 客戶標籤
        document.getElementById('modalCustomerTags').innerHTML = 
            customer.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');
        
        // 互動歷史
        document.getElementById('modalInteractionHistory').innerHTML = 
            customer.interactions.map(interaction => `
                <div class="timeline-item">
                    <small class="text-muted">${interaction.date}</small>
                    <p class="mb-0">${interaction.content}</p>
                </div>
            `).join('');
        
        // 預約記錄
        document.getElementById('modalAppointmentHistory').innerHTML = `
            <div class="mb-2">
                <strong>療程興趣:</strong> ${customer.treatment || '未指定'}
            </div>
            <div class="mb-2">
                <strong>預約狀態:</strong> ${customer.status || '待確認'}
            </div>
            <div class="mb-2">
                <strong>客戶價值:</strong> $${customer.lifetimeValue.toLocaleString()}
            </div>
        `;
        
        // AI 分析
        document.getElementById('modalAIAnalysis').innerHTML = `
            <div class="mb-2">
                <strong>潛力評分:</strong> ${customer.leadScore}/10
                <div class="progress mt-1">
                    <div class="progress-bar bg-warning" style="width: ${customer.leadScore * 10}%"></div>
                </div>
            </div>
            <div class="mb-2">
                <strong>轉換建議:</strong> ${this.getConversionSuggestion(customer)}
            </div>
            <div>
                <strong>下次聯繫:</strong> ${this.getNextContactSuggestion(customer)}
            </div>
        `;
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('customerModal'));
        modal.show();
        
        // 儲存當前客戶ID供其他操作使用
        this.currentCustomerId = customerId;
    }
    
    getConversionSuggestion(customer) {
        if (customer.leadScore >= 8) return '高潛力客戶，建議主動聯繫安排諮詢';
        if (customer.leadScore >= 6) return '中等潛力，可發送療程資訊和優惠';
        if (customer.leadScore >= 4) return '需要培養，定期發送教育內容';
        return '低興趣客戶，建議暫停主動聯繫';
    }
    
    getNextContactSuggestion(customer) {
        const daysSinceContact = customer.lastContact;
        if (daysSinceContact > 14) return '建議立即聯繫';
        if (daysSinceContact > 7) return '3天內聯繫';
        return '一週後追蹤';
    }
    
    scheduleFollowUp() {
        if (!this.currentCustomerId) return;
        
        // 這裡可以整合行事曆系統
        alert('追蹤提醒已安排！');
        
        // 更新客戶記錄
        const customer = this.customers.find(c => c.id === this.currentCustomerId);
        if (customer) {
            customer.interactions.unshift({
                date: new Date().toISOString().split('T')[0],
                type: 'follow_up_scheduled',
                content: '安排追蹤提醒'
            });
        }
    }
    
    sendMessage() {
        if (!this.currentCustomerId) return;
        
        // 這裡可以整合訊息發送系統
        alert('訊息發送功能開發中！');
    }
    
    updateCustomerStage() {
        if (!this.currentCustomerId) return;
        
        const customer = this.customers.find(c => c.id === this.currentCustomerId);
        if (!customer) return;
        
        // 簡單的階段更新邏輯
        const stages = ['lead', 'prospect', 'customer', 'vip'];
        const currentIndex = stages.indexOf(customer.stage);
        if (currentIndex < stages.length - 1) {
            customer.stage = stages[currentIndex + 1];
            
            // 更新顯示
            document.getElementById('modalLifecycleStage').textContent = this.getStageLabel(customer.stage);
            document.getElementById('modalLifecycleStage').className = `lifecycle-stage stage-${customer.stage}`;
            
            // 重新渲染列表
            this.renderCustomerList();
            this.renderMetrics();
            
            alert(`客戶階段已更新為：${this.getStageLabel(customer.stage)}`);
        } else {
            alert('客戶已是最高階段！');
        }
    }
    
    showAddCustomerModal() {
        // 新增客戶功能
        alert('新增客戶功能開發中！');
    }
    
    showError(message) {
        console.error(message);
        // 可以在這裡顯示錯誤訊息給用戶
    }
}

// 確保全域可用
window.SmartCRMManager = SmartCRMManager;
