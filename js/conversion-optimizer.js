/**
 * 預約轉換優化系統
 * 分析轉換漏斗、提供優化建議、執行 A/B 測試
 */

class ConversionOptimizer {
    constructor() {
        this.conversionData = {};
        this.optimizationSuggestions = [];
        this.abTests = [];
        this.charts = {};
        
        this.init();
    }
    
    async init() {
        console.log('🚀 初始化轉換優化系統...');
        
        try {
            await this.loadConversionData();
            this.calculateConversionRates();
            this.renderFunnelData();
            this.initializeCharts();
            await this.generateOptimizationSuggestions();
            this.renderActionItems();
            this.loadABTestResults();
            
            console.log('✅ 轉換優化系統初始化完成');
        } catch (error) {
            console.error('❌ 轉換優化系統初始化失敗:', error);
            this.showError('系統初始化失敗，請重新整理頁面');
        }
    }
    
    async loadConversionData() {
        console.log('📊 載入轉換數據...');
        
        try {
            // 從 Google Sheets 載入轉換數據
            const response = await fetch('/.netlify/functions/google-sheets-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_conversion_data',
                    data: { dateRange: '30days' }
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.conversionData = result.data;
                console.log('✅ 轉換數據載入成功');
            } else {
                // 使用模擬數據
                this.conversionData = this.generateMockConversionData();
                console.log('⚠️ 使用模擬轉換數據');
            }
            
        } catch (error) {
            console.error('❌ 載入轉換數據失敗:', error);
            this.conversionData = this.generateMockConversionData();
        }
    }
    
    generateMockConversionData() {
        return {
            visitors: 1250,
            inquiries: 300,
            leads: 200,
            consultations: 90,
            appointments: 70,
            completions: 60,
            timeSeriesData: this.generateTimeSeriesData(),
            sourceData: {
                'LINE': { visitors: 500, conversions: 35 },
                'Instagram': { visitors: 350, conversions: 18 },
                'Facebook': { visitors: 250, conversions: 12 },
                '電話': { visitors: 100, conversions: 8 },
                '現場': { visitors: 50, conversions: 7 }
            },
            conversionTimes: [
                { stage: 'inquiry_to_lead', avgDays: 1.2 },
                { stage: 'lead_to_consultation', avgDays: 3.5 },
                { stage: 'consultation_to_appointment', avgDays: 2.1 },
                { stage: 'appointment_to_completion', avgDays: 0.4 }
            ]
        };
    }
    
    generateTimeSeriesData() {
        const data = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toISOString().split('T')[0],
                visitors: Math.floor(Math.random() * 50) + 30,
                inquiries: Math.floor(Math.random() * 15) + 5,
                conversions: Math.floor(Math.random() * 5) + 1
            });
        }
        
        return data;
    }
    
    calculateConversionRates() {
        const data = this.conversionData;
        
        this.conversionRates = {
            inquiryRate: (data.inquiries / data.visitors * 100).toFixed(1),
            leadRate: (data.leads / data.inquiries * 100).toFixed(1),
            consultationRate: (data.consultations / data.leads * 100).toFixed(1),
            appointmentRate: (data.appointments / data.consultations * 100).toFixed(1),
            completionRate: (data.completions / data.appointments * 100).toFixed(1),
            overallRate: (data.completions / data.visitors * 100).toFixed(1)
        };
        
        console.log('📈 轉換率計算完成:', this.conversionRates);
    }
    
    renderFunnelData() {
        const data = this.conversionData;
        const rates = this.conversionRates;
        
        // 更新漏斗數據
        document.getElementById('visitorsCount').textContent = data.visitors.toLocaleString();
        document.getElementById('inquiriesCount').textContent = data.inquiries.toLocaleString();
        document.getElementById('leadsCount').textContent = data.leads.toLocaleString();
        document.getElementById('consultationsCount').textContent = data.consultations.toLocaleString();
        document.getElementById('appointmentsCount').textContent = data.appointments.toLocaleString();
        document.getElementById('completionsCount').textContent = data.completions.toLocaleString();
        
        // 更新轉換率和樣式
        this.updateConversionRate('inquiryRate', rates.inquiryRate);
        this.updateConversionRate('leadRate', rates.leadRate);
        this.updateConversionRate('consultationRate', rates.consultationRate);
        this.updateConversionRate('appointmentRate', rates.appointmentRate);
        this.updateConversionRate('completionRate', rates.completionRate);
        
        // 更新關鍵指標
        document.getElementById('overallConversionRate').textContent = `${rates.overallRate}%`;
        
        // 計算平均轉換時間
        const avgTime = this.conversionData.conversionTimes.reduce((sum, item) => sum + item.avgDays, 0);
        document.getElementById('avgConversionTime').textContent = `${avgTime.toFixed(1)}天`;
        
        // 計算客戶獲取成本 (假設每月行銷預算 $50,000)
        const monthlyBudget = 50000;
        const cac = Math.round(monthlyBudget / data.completions);
        document.getElementById('customerAcquisitionCost').textContent = `$${cac}`;
    }
    
    updateConversionRate(elementId, rate) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = `${rate}%`;
        
        // 根據轉換率設定樣式
        const rateValue = parseFloat(rate);
        element.className = 'conversion-rate';
        
        if (rateValue >= 70) {
            element.classList.add(''); // 綠色 (預設)
        } else if (rateValue >= 50) {
            element.classList.add('medium'); // 黃色
        } else {
            element.classList.add('low'); // 紅色
        }
    }
    
    initializeCharts() {
        this.initConversionTrendChart();
        this.initSourceConversionChart();
    }
    
    initConversionTrendChart() {
        const ctx = document.getElementById('conversionTrendChart').getContext('2d');
        const timeSeriesData = this.conversionData.timeSeriesData;
        
        const labels = timeSeriesData.map(item => {
            const date = new Date(item.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        
        this.charts.conversionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '訪客數',
                        data: timeSeriesData.map(item => item.visitors),
                        borderColor: '#d4af37',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: '轉換數',
                        data: timeSeriesData.map(item => item.conversions),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
    
    initSourceConversionChart() {
        const ctx = document.getElementById('sourceConversionChart').getContext('2d');
        const sourceData = this.conversionData.sourceData;
        
        const sources = Object.keys(sourceData);
        const conversionRates = sources.map(source => {
            const data = sourceData[source];
            return (data.conversions / data.visitors * 100).toFixed(1);
        });
        
        this.charts.sourceConversion = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: sources,
                datasets: [{
                    label: '轉換率 (%)',
                    data: conversionRates,
                    backgroundColor: [
                        '#d4af37',
                        '#28a745',
                        '#17a2b8',
                        '#ffc107',
                        '#6f42c1'
                    ],
                    borderColor: [
                        '#f1c40f',
                        '#20c997',
                        '#20c997',
                        '#f39c12',
                        '#8e44ad'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    y: {
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
    
    async generateOptimizationSuggestions() {
        console.log('🧠 生成優化建議...');
        
        try {
            // 準備分析數據
            const analysisData = {
                conversionRates: this.conversionRates,
                conversionData: this.conversionData,
                bottlenecks: this.identifyBottlenecks(),
                trends: this.analyzeTrends()
            };
            
            // 呼叫 AI 分析
            const response = await fetch('/.netlify/functions/google-sheets-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_conversion_optimization',
                    data: analysisData
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.suggestions) {
                this.optimizationSuggestions = result.suggestions;
            } else {
                this.optimizationSuggestions = this.generateDefaultSuggestions();
            }
            
            this.renderOptimizationSuggestions();
            
        } catch (error) {
            console.error('❌ 優化建議生成失敗:', error);
            this.optimizationSuggestions = this.generateDefaultSuggestions();
            this.renderOptimizationSuggestions();
        }
    }
    
    identifyBottlenecks() {
        const rates = this.conversionRates;
        const bottlenecks = [];
        
        if (parseFloat(rates.inquiryRate) < 20) {
            bottlenecks.push({
                stage: 'inquiry',
                rate: rates.inquiryRate,
                severity: 'high',
                description: '網站訪客轉詢問率偏低'
            });
        }
        
        if (parseFloat(rates.leadRate) < 60) {
            bottlenecks.push({
                stage: 'lead',
                rate: rates.leadRate,
                severity: 'medium',
                description: '詢問轉潛在客戶率需要改善'
            });
        }
        
        if (parseFloat(rates.consultationRate) < 40) {
            bottlenecks.push({
                stage: 'consultation',
                rate: rates.consultationRate,
                severity: 'high',
                description: '潛在客戶轉諮詢預約率偏低'
            });
        }
        
        if (parseFloat(rates.appointmentRate) < 70) {
            bottlenecks.push({
                stage: 'appointment',
                rate: rates.appointmentRate,
                severity: 'medium',
                description: '諮詢轉療程預約率可以提升'
            });
        }
        
        if (parseFloat(rates.completionRate) < 80) {
            bottlenecks.push({
                stage: 'completion',
                rate: rates.completionRate,
                severity: 'low',
                description: '預約完成率良好但仍有改善空間'
            });
        }
        
        return bottlenecks;
    }
    
    analyzeTrends() {
        const timeSeriesData = this.conversionData.timeSeriesData;
        const recentData = timeSeriesData.slice(-7); // 最近7天
        const previousData = timeSeriesData.slice(-14, -7); // 前7天
        
        const recentAvg = recentData.reduce((sum, item) => sum + (item.conversions / item.visitors), 0) / recentData.length;
        const previousAvg = previousData.reduce((sum, item) => sum + (item.conversions / item.visitors), 0) / previousData.length;
        
        const trend = recentAvg > previousAvg ? 'improving' : recentAvg < previousAvg ? 'declining' : 'stable';
        const change = ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1);
        
        return {
            trend: trend,
            change: change,
            recentConversionRate: (recentAvg * 100).toFixed(2)
        };
    }
    
    generateDefaultSuggestions() {
        const bottlenecks = this.identifyBottlenecks();
        const suggestions = [];
        
        // 基於瓶頸生成建議
        bottlenecks.forEach(bottleneck => {
            switch (bottleneck.stage) {
                case 'inquiry':
                    suggestions.push({
                        title: '提升網站詢問轉換率',
                        description: '優化網站首頁設計，增加明確的行動呼籲按鈕',
                        impact: 'high',
                        effort: 'medium',
                        expectedImprovement: '+15% 詢問率',
                        actions: [
                            '重新設計首頁 CTA 按鈕',
                            '添加客戶見證和案例',
                            '優化聯絡表單設計',
                            '增加即時聊天功能'
                        ]
                    });
                    break;
                case 'consultation':
                    suggestions.push({
                        title: '改善諮詢預約流程',
                        description: '簡化預約流程，提供更多預約時段選擇',
                        impact: 'high',
                        effort: 'low',
                        expectedImprovement: '+20% 諮詢預約率',
                        actions: [
                            '簡化預約表單',
                            '提供線上預約系統',
                            '增加晚間和週末時段',
                            '發送預約確認和提醒'
                        ]
                    });
                    break;
            }
        });
        
        // 添加通用優化建議
        suggestions.push({
            title: '實施個人化行銷',
            description: '根據客戶來源和興趣提供個人化內容',
            impact: 'medium',
            effort: 'high',
            expectedImprovement: '+10% 整體轉換率',
            actions: [
                '建立客戶分群策略',
                '設計個人化郵件模板',
                '優化社群媒體內容',
                '實施動態網站內容'
            ]
        });
        
        return suggestions;
    }
    
    renderOptimizationSuggestions() {
        const container = document.getElementById('optimizationSuggestions');
        container.innerHTML = '';
        
        this.optimizationSuggestions.forEach((suggestion, index) => {
            const suggestionCard = document.createElement('div');
            suggestionCard.className = 'optimization-card';
            
            const impactColor = {
                'high': 'success',
                'medium': 'warning',
                'low': 'info'
            }[suggestion.impact] || 'secondary';
            
            suggestionCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5>${suggestion.title}</h5>
                    <span class="badge bg-${impactColor}">${suggestion.impact.toUpperCase()} 影響</span>
                </div>
                <p class="text-muted mb-3">${suggestion.description}</p>
                <div class="row mb-3">
                    <div class="col-md-4">
                        <small class="text-muted">預期改善</small><br>
                        <strong class="text-success">${suggestion.expectedImprovement}</strong>
                    </div>
                    <div class="col-md-4">
                        <small class="text-muted">實施難度</small><br>
                        <strong>${suggestion.effort.toUpperCase()}</strong>
                    </div>
                    <div class="col-md-4">
                        <button class="optimization-btn btn-sm" onclick="window.conversionOptimizer.showOptimizationDetails(${index})">
                            <i class="fas fa-eye"></i> 查看詳情
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(suggestionCard);
        });
    }
    
    renderActionItems() {
        const highPriority = document.getElementById('highPriorityActions');
        const mediumPriority = document.getElementById('mediumPriorityActions');
        const lowPriority = document.getElementById('lowPriorityActions');
        
        // 清空現有內容
        [highPriority, mediumPriority, lowPriority].forEach(container => {
            container.innerHTML = '';
        });
        
        // 生成行動項目
        const actionItems = this.generateActionItems();
        
        actionItems.forEach(item => {
            const actionCard = document.createElement('div');
            actionCard.className = `action-item priority-${item.priority}`;
            
            actionCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6>${item.title}</h6>
                    <small class="text-muted">${item.deadline}</small>
                </div>
                <p class="mb-2">${item.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">負責人: ${item.assignee}</small>
                    <span class="badge bg-${item.status === 'pending' ? 'warning' : 'success'}">
                        ${item.status === 'pending' ? '待執行' : '進行中'}
                    </span>
                </div>
            `;
            
            // 根據優先級添加到對應容器
            switch (item.priority) {
                case 'high':
                    highPriority.appendChild(actionCard);
                    break;
                case 'medium':
                    mediumPriority.appendChild(actionCard);
                    break;
                case 'low':
                    lowPriority.appendChild(actionCard);
                    break;
            }
        });
    }
    
    generateActionItems() {
        return [
            {
                title: '優化首頁 CTA 按鈕',
                description: '重新設計首頁的行動呼籲按鈕，提升點擊率',
                priority: 'high',
                deadline: '本週內',
                assignee: '網站設計師',
                status: 'pending'
            },
            {
                title: '設置 A/B 測試',
                description: '針對預約表單進行 A/B 測試',
                priority: 'high',
                deadline: '下週',
                assignee: '行銷專員',
                status: 'in_progress'
            },
            {
                title: '客戶見證收集',
                description: '收集並整理客戶見證內容',
                priority: 'medium',
                deadline: '兩週內',
                assignee: '客服專員',
                status: 'pending'
            },
            {
                title: '社群內容優化',
                description: '優化 Instagram 和 Facebook 內容策略',
                priority: 'medium',
                deadline: '本月底',
                assignee: '社群經理',
                status: 'in_progress'
            },
            {
                title: '客戶滿意度調查',
                description: '設計並實施客戶滿意度調查',
                priority: 'low',
                deadline: '下個月',
                assignee: '客服主管',
                status: 'pending'
            },
            {
                title: '競爭對手分析',
                description: '分析競爭對手的轉換策略',
                priority: 'low',
                deadline: '下個月',
                assignee: '行銷經理',
                status: 'pending'
            }
        ];
    }
    
    loadABTestResults() {
        const container = document.getElementById('abTestResults');
        
        // 模擬 A/B 測試結果
        const abTests = [
            {
                name: '預約表單優化測試',
                status: 'completed',
                duration: '14天',
                variants: [
                    {
                        name: '原始版本',
                        conversions: 45,
                        visitors: 500,
                        conversionRate: 9.0,
                        isWinner: false
                    },
                    {
                        name: '簡化版本',
                        conversions: 62,
                        visitors: 500,
                        conversionRate: 12.4,
                        isWinner: true
                    }
                ],
                improvement: '+37.8%',
                significance: '95%'
            },
            {
                name: '首頁 CTA 按鈕測試',
                status: 'running',
                duration: '7天 (進行中)',
                variants: [
                    {
                        name: '藍色按鈕',
                        conversions: 23,
                        visitors: 250,
                        conversionRate: 9.2,
                        isWinner: false
                    },
                    {
                        name: '金色按鈕',
                        conversions: 28,
                        visitors: 250,
                        conversionRate: 11.2,
                        isWinner: true
                    }
                ],
                improvement: '+21.7%',
                significance: '87%'
            }
        ];
        
        container.innerHTML = abTests.map(test => `
            <div class="ab-test-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5>${test.name}</h5>
                    <span class="badge bg-${test.status === 'completed' ? 'success' : 'warning'}">
                        ${test.status === 'completed' ? '已完成' : '進行中'}
                    </span>
                </div>
                <p class="mb-3">測試時間: ${test.duration}</p>
                
                <div class="row">
                    ${test.variants.map(variant => `
                        <div class="col-md-6">
                            <div class="test-variant">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6>${variant.name}</h6>
                                    ${variant.isWinner ? '<span class="winner-badge">獲勝</span>' : ''}
                                </div>
                                <div class="row">
                                    <div class="col-6">
                                        <small class="text-muted">轉換數</small><br>
                                        <strong>${variant.conversions}</strong>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">轉換率</small><br>
                                        <strong>${variant.conversionRate}%</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${test.status === 'completed' ? `
                    <div class="mt-3 p-3 bg-success bg-opacity-25 rounded">
                        <strong>結果:</strong> ${test.improvement} 改善，統計顯著性 ${test.significance}
                    </div>
                ` : `
                    <div class="mt-3 p-3 bg-warning bg-opacity-25 rounded">
                        <strong>目前領先:</strong> ${test.improvement}，需要更多數據確認顯著性
                    </div>
                `}
            </div>
        `).join('');
    }
    
    showOptimizationDetails(index) {
        const suggestion = this.optimizationSuggestions[index];
        if (!suggestion) return;
        
        const detailsContainer = document.getElementById('optimizationDetails');
        detailsContainer.innerHTML = `
            <h4>${suggestion.title}</h4>
            <p class="text-muted mb-4">${suggestion.description}</p>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <h6>預期改善</h6>
                    <p class="text-success">${suggestion.expectedImprovement}</p>
                </div>
                <div class="col-md-4">
                    <h6>實施難度</h6>
                    <p>${suggestion.effort.toUpperCase()}</p>
                </div>
                <div class="col-md-4">
                    <h6>影響程度</h6>
                    <p>${suggestion.impact.toUpperCase()}</p>
                </div>
            </div>
            
            <h5>實施步驟</h5>
            <ol>
                ${suggestion.actions.map(action => `<li>${action}</li>`).join('')}
            </ol>
        `;
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('optimizationModal'));
        modal.show();
        
        // 儲存當前建議索引
        this.currentSuggestionIndex = index;
    }
    
    async runOptimizationAnalysis() {
        console.log('🔍 執行優化分析...');
        
        // 顯示載入狀態
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 分析中...';
        button.disabled = true;
        
        try {
            // 重新載入數據並分析
            await this.loadConversionData();
            this.calculateConversionRates();
            this.renderFunnelData();
            await this.generateOptimizationSuggestions();
            this.renderActionItems();
            
            alert('✅ 優化分析完成！已更新所有建議和數據。');
            
        } catch (error) {
            console.error('❌ 優化分析失敗:', error);
            alert('❌ 優化分析失敗，請稍後再試。');
        } finally {
            // 恢復按鈕狀態
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
    
    generateReport() {
        console.log('📄 生成優化報告...');
        
        const reportData = {
            date: new Date().toLocaleDateString('zh-TW'),
            conversionRates: this.conversionRates,
            bottlenecks: this.identifyBottlenecks(),
            suggestions: this.optimizationSuggestions,
            trends: this.analyzeTrends()
        };
        
        // 創建報告內容
        const reportContent = `
# 轉換優化分析報告
生成日期: ${reportData.date}

## 轉換漏斗現況
- 整體轉換率: ${reportData.conversionRates.overallRate}%
- 詢問轉換率: ${reportData.conversionRates.inquiryRate}%
- 潛客轉換率: ${reportData.conversionRates.leadRate}%
- 諮詢轉換率: ${reportData.conversionRates.consultationRate}%
- 預約轉換率: ${reportData.conversionRates.appointmentRate}%
- 完成轉換率: ${reportData.conversionRates.completionRate}%

## 主要瓶頸
${reportData.bottlenecks.map(bottleneck => `- ${bottleneck.description} (${bottleneck.rate}%)`).join('\n')}

## 優化建議
${reportData.suggestions.map((suggestion, index) => `
${index + 1}. ${suggestion.title}
   - 預期改善: ${suggestion.expectedImprovement}
   - 實施難度: ${suggestion.effort}
   - 影響程度: ${suggestion.impact}
`).join('\n')}

## 趨勢分析
- 轉換趨勢: ${reportData.trends.trend}
- 變化幅度: ${reportData.trends.change}%
- 近期轉換率: ${reportData.trends.recentConversionRate}%
        `;
        
        // 下載報告
        this.downloadReport(reportContent, `轉換優化報告_${new Date().toISOString().split('T')[0]}.txt`);
        
        alert('📄 優化報告已生成並下載！');
    }
    
    startABTest() {
        console.log('🧪 啟動 A/B 測試...');
        
        // 這裡可以整合實際的 A/B 測試平台
        alert('🧪 A/B 測試功能開發中！將整合專業的 A/B 測試平台。');
    }
    
    exportData() {
        console.log('📊 匯出轉換數據...');
        
        const exportData = {
            conversionData: this.conversionData,
            conversionRates: this.conversionRates,
            optimizationSuggestions: this.optimizationSuggestions,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        this.downloadReport(dataStr, `轉換數據_${new Date().toISOString().split('T')[0]}.json`);
        
        alert('📊 轉換數據已匯出！');
    }
    
    downloadReport(content, filename) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    showError(message) {
        console.error(message);
        // 可以在這裡顯示錯誤訊息給用戶
    }
}

// 確保全域可用
window.ConversionOptimizer = ConversionOptimizer;
