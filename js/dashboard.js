// 劉道玄醫美管理平台 - 儀表板功能

// 儀表板數據管理
class DashboardManager {
    constructor() {
        this.statistics = {
            todayAppointments: 0,
            totalRecords: 0,
            pendingConsents: 0,
            monthlyRevenue: 0
        };
        
        this.updateInterval = null;
    }

    // 初始化儀表板
    initialize() {
        this.loadStatistics();
        this.startAutoUpdate();
        this.bindEvents();
    }

    // 載入統計數據
    async loadStatistics() {
        try {
            // 模擬API調用
            const data = await this.fetchStatisticsFromAPI();
            this.updateStatisticsDisplay(data);
        } catch (error) {
            console.error('載入統計數據失敗:', error);
            this.loadMockStatistics();
        }
    }

    // 模擬API調用
    async fetchStatisticsFromAPI() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    todayAppointments: Math.floor(Math.random() * 20) + 5,
                    totalRecords: Math.floor(Math.random() * 500) + 100,
                    pendingConsents: Math.floor(Math.random() * 10) + 2,
                    monthlyRevenue: Math.floor(Math.random() * 100000) + 50000
                });
            }, 1000);
        });
    }

    // 載入模擬數據
    loadMockStatistics() {
        const mockData = {
            todayAppointments: 12,
            totalRecords: 245,
            pendingConsents: 3,
            monthlyRevenue: 85000
        };
        
        this.updateStatisticsDisplay(mockData);
    }

    // 更新統計顯示
    updateStatisticsDisplay(data) {
        this.statistics = { ...data };
        
        // 更新首頁統計卡片
        this.updateElement('todayAppointments', data.todayAppointments);
        this.updateElement('totalRecords', data.totalRecords);
        this.updateElement('pendingConsents', data.pendingConsents);
        this.updateElement('monthlyRevenue', this.formatCurrency(data.monthlyRevenue));
        
        // 添加動畫效果
        this.animateNumbers();
    }

    // 更新元素內容
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // 格式化貨幣
    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // 數字動畫效果
    animateNumbers() {
        const numberElements = document.querySelectorAll('.stats-number span');
        
        numberElements.forEach(element => {
            const finalValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
            const duration = 1500;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentValue = Math.floor(finalValue * this.easeOutCubic(progress));
                
                if (element.textContent.includes('$')) {
                    element.textContent = this.formatCurrency(currentValue);
                } else if (element.textContent.includes('%')) {
                    element.textContent = currentValue + '%';
                } else {
                    element.textContent = currentValue;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // 緩動函數
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // 開始自動更新
    startAutoUpdate() {
        // 每5分鐘更新一次數據
        this.updateInterval = setInterval(() => {
            this.loadStatistics();
        }, 5 * 60 * 1000);
    }

    // 停止自動更新
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // 綁定事件
    bindEvents() {
        // 模組卡片懸停效果
        this.setupCardHoverEffects();
        
        // 快速操作按鈕
        this.setupQuickActions();
        
        // 響應式處理
        this.setupResponsiveHandling();
    }

    // 設置卡片懸停效果
    setupCardHoverEffects() {
        const moduleCards = document.querySelectorAll('.module-card');
        
        moduleCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
            });
        });
    }

    // 設置快速操作
    setupQuickActions() {
        const quickActionButtons = document.querySelectorAll('[onclick*="quickAction"]');
        
        quickActionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 添加點擊動畫
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 150);
            });
        });
    }

    // 設置響應式處理
    setupResponsiveHandling() {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            
            // 調整卡片佈局
            const gridContainer = document.querySelector('.grid-container');
            if (gridContainer) {
                if (isMobile) {
                    gridContainer.style.gridTemplateColumns = '1fr';
                } else {
                    gridContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // 初始調用
    }

    // 獲取統計數據
    getStatistics() {
        return this.statistics;
    }

    // 刷新數據
    refresh() {
        this.loadStatistics();
    }
}

// 通知管理
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
    }

    // 顯示通知
    show(message, type = 'info', duration = 5000) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            timestamp: new Date()
        };
        
        this.notifications.unshift(notification);
        
        // 限制通知數量
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
        
        this.renderNotification(notification, duration);
        
        return notification.id;
    }

    // 渲染通知
    renderNotification(notification, duration) {
        const notificationHtml = `
            <div id="notification-${notification.id}" 
                 class="alert alert-${notification.type} alert-dismissible fade show position-fixed notification-item" 
                 style="top: ${20 + this.getVisibleNotifications().length * 70}px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;">
                <div class="d-flex align-items-center">
                    <i class="fas ${this.getIconForType(notification.type)} me-2"></i>
                    <div class="flex-grow-1">${notification.message}</div>
                    <button type="button" class="btn-close" onclick="notificationManager.dismiss('${notification.id}')"></button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', notificationHtml);
        
        // 自動隱藏
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, duration);
        }
    }

    // 獲取圖標
    getIconForType(type) {
        const icons = {
            'success': 'fa-check-circle',
            'danger': 'fa-exclamation-triangle',
            'warning': 'fa-exclamation-circle',
            'info': 'fa-info-circle'
        };
        
        return icons[type] || icons.info;
    }

    // 關閉通知
    dismiss(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                element.remove();
                this.updateNotificationPositions();
            }, 150);
        }
        
        // 從陣列中移除
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    // 更新通知位置
    updateNotificationPositions() {
        const visibleNotifications = this.getVisibleNotifications();
        visibleNotifications.forEach((notification, index) => {
            const element = document.getElementById(`notification-${notification.id}`);
            if (element) {
                element.style.top = `${20 + index * 70}px`;
            }
        });
    }

    // 獲取可見通知
    getVisibleNotifications() {
        return this.notifications.filter(n => 
            document.getElementById(`notification-${n.id}`)
        );
    }

    // 生成ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 清除所有通知
    clearAll() {
        this.notifications.forEach(notification => {
            this.dismiss(notification.id);
        });
    }
}

// 主題管理
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'default';
        this.themes = {
            default: {
                name: '預設主題',
                primaryColor: '#2c3e50',
                secondaryColor: '#3498db'
            },
            dark: {
                name: '深色主題',
                primaryColor: '#1a1a2e',
                secondaryColor: '#16213e'
            },
            medical: {
                name: '醫療主題',
                primaryColor: '#27ae60',
                secondaryColor: '#2ecc71'
            }
        };
    }

    // 應用主題
    applyTheme(themeName) {
        if (!this.themes[themeName]) return;
        
        const theme = this.themes[themeName];
        const root = document.documentElement;
        
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--secondary-color', theme.secondaryColor);
        
        this.currentTheme = themeName;
        localStorage.setItem('theme', themeName);
        
        // 觸發主題變更事件
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName }
        }));
    }

    // 獲取當前主題
    getCurrentTheme() {
        return this.currentTheme;
    }

    // 獲取可用主題
    getAvailableThemes() {
        return this.themes;
    }

    // 初始化主題
    initialize() {
        this.applyTheme(this.currentTheme);
    }
}

// 全域實例
let dashboardManager;
let notificationManager;
let themeManager;

// 初始化儀表板
function initializeDashboard() {
    dashboardManager = new DashboardManager();
    notificationManager = new NotificationManager();
    themeManager = new ThemeManager();
    
    dashboardManager.initialize();
    themeManager.initialize();
    
    console.log('儀表板系統初始化完成');
}

// 載入統計數據
function loadStatistics() {
    if (dashboardManager) {
        dashboardManager.loadStatistics();
    }
}

// 刷新儀表板
function refreshDashboard() {
    if (dashboardManager) {
        dashboardManager.refresh();
        notificationManager.show('儀表板已刷新', 'success');
    }
}

// 導出函數供全域使用
window.DashboardUtils = {
    initializeDashboard,
    loadStatistics,
    refreshDashboard,
    showNotification: (message, type, duration) => {
        if (notificationManager) {
            return notificationManager.show(message, type, duration);
        }
    },
    changeTheme: (themeName) => {
        if (themeManager) {
            themeManager.applyTheme(themeName);
        }
    },
    getStatistics: () => {
        return dashboardManager ? dashboardManager.getStatistics() : {};
    }
};

// 頁面卸載時清理
window.addEventListener('beforeunload', () => {
    if (dashboardManager) {
        dashboardManager.stopAutoUpdate();
    }
    
    if (notificationManager) {
        notificationManager.clearAll();
    }
});
