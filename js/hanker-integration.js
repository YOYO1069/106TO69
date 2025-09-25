/**
 * 夯客預約系統整合模組
 * 劉道玄諮詢師預約系統
 */

// 夯客 LIFF 配置
const HANKER_CONFIG = {
    LIFF_URL: 'https://liff.line.me/2008079261-3lyOnYBB',
    LIFF_ID: '2008079261-3lyOnYBB',
    PROVIDER: '夯客預約系統',
    FEATURES: [
        '線上即時預約',
        'LINE 內建預約',
        '自動提醒通知',
        '預約狀態追蹤',
        '取消重新預約'
    ]
};

// 夯客預約系統管理器
class HankerBookingManager {
    constructor() {
        this.liffUrl = HANKER_CONFIG.LIFF_URL;
        this.isLiffReady = false;
        this.init();
    }

    // 初始化夯客系統
    init() {
        console.log('🔥 初始化夯客預約系統...');
        this.setupEventListeners();
        this.checkLiffAvailability();
    }

    // 設定事件監聽器
    setupEventListeners() {
        // 夯客預約按鈕點擊事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('hanker-booking-btn')) {
                e.preventDefault();
                this.openHankerBooking();
            }
        });

        // 預約方式選擇事件
        document.addEventListener('change', (e) => {
            if (e.target.id === 'booking-method-select') {
                this.handleBookingMethodChange(e.target.value);
            }
        });
    }

    // 檢查 LIFF 可用性
    async checkLiffAvailability() {
        try {
            const response = await fetch(this.liffUrl, { 
                method: 'HEAD',
                mode: 'no-cors'
            });
            this.isLiffReady = true;
            console.log('✅ 夯客 LIFF 系統連接正常');
            this.updateBookingButtons();
        } catch (error) {
            console.warn('⚠️ 夯客 LIFF 系統暫時無法連接:', error);
            this.isLiffReady = false;
            this.showFallbackOptions();
        }
    }

    // 開啟夯客預約系統
    openHankerBooking() {
        console.log('🔥 開啟夯客預約系統...');
        
        // 記錄預約來源
        this.trackBookingSource('hanker_liff');
        
        // 在 LINE 內開啟 LIFF
        if (this.isLineEnvironment()) {
            window.open(this.liffUrl, '_blank');
        } else {
            // 非 LINE 環境，顯示提示
            this.showLinePrompt();
        }
    }

    // 檢查是否在 LINE 環境中
    isLineEnvironment() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('line') || 
               userAgent.includes('liff') ||
               window.location.href.includes('liff.line.me');
    }

    // 顯示 LINE 提示
    showLinePrompt() {
        const modal = this.createModal({
            title: '🔥 夯客預約系統',
            content: `
                <div class="hanker-prompt">
                    <div class="hanker-icon">📱</div>
                    <h4>請在 LINE 中開啟預約系統</h4>
                    <p>夯客預約系統需要在 LINE 應用程式中使用，請：</p>
                    <ol>
                        <li>加入劉道玄諮詢師 LINE 官方帳號</li>
                        <li>在 LINE 對話中輸入「預約」</li>
                        <li>點擊「夯客預約系統」按鈕</li>
                    </ol>
                    <div class="hanker-actions">
                        <a href="https://lin.ee/vb6ULgR" target="_blank" class="btn btn-success">
                            <i class="fab fa-line"></i> 加入 LINE 官方帳號
                        </a>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            了解
                        </button>
                    </div>
                </div>
            `,
            size: 'md'
        });
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    // 處理預約方式變更
    handleBookingMethodChange(method) {
        const bookingContainer = document.getElementById('booking-options');
        if (!bookingContainer) return;

        switch (method) {
            case 'hanker':
                this.showHankerOptions(bookingContainer);
                break;
            case 'google':
                this.showGoogleCalendarOptions(bookingContainer);
                break;
            case 'website':
                this.showWebsiteOptions(bookingContainer);
                break;
            default:
                this.showAllOptions(bookingContainer);
        }
    }

    // 顯示夯客預約選項
    showHankerOptions(container) {
        container.innerHTML = `
            <div class="booking-option hanker-option">
                <div class="option-header">
                    <h5>🔥 夯客預約系統</h5>
                    <span class="badge badge-primary">推薦</span>
                </div>
                <div class="option-features">
                    ${HANKER_CONFIG.FEATURES.map(feature => 
                        `<div class="feature-item">✅ ${feature}</div>`
                    ).join('')}
                </div>
                <div class="option-actions">
                    <button class="btn btn-primary hanker-booking-btn">
                        <i class="fas fa-calendar-plus"></i> 立即預約
                    </button>
                    <small class="text-muted">需要在 LINE 中開啟</small>
                </div>
            </div>
        `;
    }

    // 顯示 Google Calendar 選項
    showGoogleCalendarOptions(container) {
        container.innerHTML = `
            <div class="booking-option google-option">
                <div class="option-header">
                    <h5>📅 Google 行事曆</h5>
                    <span class="badge badge-info">傳統</span>
                </div>
                <div class="option-features">
                    <div class="feature-item">✅ 查看可預約時段</div>
                    <div class="feature-item">✅ 同步個人行事曆</div>
                    <div class="feature-item">✅ 電腦手機都可用</div>
                </div>
                <div class="option-actions">
                    <a href="https://calendar.google.com/calendar/embed?src=6bef0ee912b7ee1742123668e09eff427c258884010b7d36add1d1c9b1510658%40group.calendar.google.com&ctz=Asia%2FTaipei" 
                       target="_blank" class="btn btn-info">
                        <i class="fab fa-google"></i> 開啟行事曆
                    </a>
                </div>
            </div>
        `;
    }

    // 顯示網站預約選項
    showWebsiteOptions(container) {
        container.innerHTML = `
            <div class="booking-option website-option">
                <div class="option-header">
                    <h5>🌐 官方網站預約</h5>
                    <span class="badge badge-success">完整</span>
                </div>
                <div class="option-features">
                    <div class="feature-item">✅ 完整預約表單</div>
                    <div class="feature-item">✅ 療程詳細說明</div>
                    <div class="feature-item">✅ 線上諮詢功能</div>
                </div>
                <div class="option-actions">
                    <a href="/appointment_scheduling_system.html" class="btn btn-success">
                        <i class="fas fa-globe"></i> 前往預約
                    </a>
                </div>
            </div>
        `;
    }

    // 顯示所有預約選項
    showAllOptions(container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="booking-card hanker-card">
                        <div class="card-icon">🔥</div>
                        <h6>夯客預約系統</h6>
                        <p>LINE 內建預約，最方便快速</p>
                        <button class="btn btn-primary btn-sm hanker-booking-btn">
                            立即預約
                        </button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="booking-card google-card">
                        <div class="card-icon">📅</div>
                        <h6>Google 行事曆</h6>
                        <p>查看時段，同步行事曆</p>
                        <a href="https://calendar.google.com/calendar/embed?src=6bef0ee912b7ee1742123668e09eff427c258884010b7d36add1d1c9b1510658%40group.calendar.google.com&ctz=Asia%2FTaipei" 
                           target="_blank" class="btn btn-info btn-sm">
                            開啟行事曆
                        </a>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="booking-card website-card">
                        <div class="card-icon">🌐</div>
                        <h6>官方網站</h6>
                        <p>完整預約表單和諮詢</p>
                        <a href="/appointment_scheduling_system.html" class="btn btn-success btn-sm">
                            前往預約
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // 更新預約按鈕狀態
    updateBookingButtons() {
        const hankerButtons = document.querySelectorAll('.hanker-booking-btn');
        hankerButtons.forEach(button => {
            if (this.isLiffReady) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-calendar-plus"></i> 立即預約';
            } else {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 暫時無法使用';
            }
        });
    }

    // 顯示備用選項
    showFallbackOptions() {
        const fallbackNotice = document.createElement('div');
        fallbackNotice.className = 'alert alert-warning hanker-fallback';
        fallbackNotice.innerHTML = `
            <h6><i class="fas fa-info-circle"></i> 夯客預約系統暫時無法使用</h6>
            <p>請使用其他預約方式：</p>
            <div class="fallback-options">
                <a href="https://calendar.google.com/calendar/embed?src=6bef0ee912b7ee1742123668e09eff427c258884010b7d36add1d1c9b1510658%40group.calendar.google.com&ctz=Asia%2FTaipei" 
                   target="_blank" class="btn btn-info btn-sm">
                    📅 Google 行事曆
                </a>
                <a href="/appointment_scheduling_system.html" class="btn btn-success btn-sm">
                    🌐 官方網站預約
                </a>
                <a href="https://lin.ee/vb6ULgR" target="_blank" class="btn btn-primary btn-sm">
                    📱 LINE 官方帳號
                </a>
            </div>
        `;

        // 插入到第一個預約相關元素前
        const firstBookingElement = document.querySelector('.hanker-booking-btn, .booking-container, .appointment-section');
        if (firstBookingElement) {
            firstBookingElement.parentNode.insertBefore(fallbackNotice, firstBookingElement);
        }
    }

    // 追蹤預約來源
    trackBookingSource(source) {
        console.log(`📊 預約來源: ${source}`);
        
        // 發送到 Google Analytics (如果有設定)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'booking_method_selected', {
                'method': source,
                'page_title': document.title,
                'page_location': window.location.href
            });
        }

        // 本地存儲統計
        const bookingStats = JSON.parse(localStorage.getItem('booking_stats') || '{}');
        bookingStats[source] = (bookingStats[source] || 0) + 1;
        bookingStats.last_used = source;
        bookingStats.last_time = new Date().toISOString();
        localStorage.setItem('booking_stats', JSON.stringify(bookingStats));
    }

    // 創建模態框
    createModal({ title, content, size = 'md' }) {
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-dialog modal-${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="close" onclick="this.closest('.modal').remove()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    // 獲取預約統計
    getBookingStats() {
        return JSON.parse(localStorage.getItem('booking_stats') || '{}');
    }

    // 重置預約統計
    resetBookingStats() {
        localStorage.removeItem('booking_stats');
        console.log('📊 預約統計已重置');
    }
}

// 夯客系統工具函數
const HankerUtils = {
    // 檢查 LIFF 環境
    isLiffEnvironment() {
        return window.location.href.includes('liff.line.me') ||
               navigator.userAgent.toLowerCase().includes('liff');
    },

    // 獲取 LIFF ID
    getLiffId() {
        if (this.isLiffEnvironment()) {
            const url = new URL(window.location.href);
            return url.pathname.split('/')[1];
        }
        return null;
    },

    // 格式化預約時間
    formatBookingTime(date, time) {
        const bookingDate = new Date(`${date}T${time}`);
        return {
            date: bookingDate.toLocaleDateString('zh-TW'),
            time: bookingDate.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            weekday: bookingDate.toLocaleDateString('zh-TW', { weekday: 'long' }),
            iso: bookingDate.toISOString()
        };
    },

    // 驗證預約時間
    validateBookingTime(date, time) {
        const bookingDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        const dayOfWeek = bookingDateTime.getDay();
        const hour = bookingDateTime.getHours();

        // 檢查是否為過去時間
        if (bookingDateTime <= now) {
            return { valid: false, message: '不能預約過去的時間' };
        }

        // 檢查營業日 (週二到週六)
        if (dayOfWeek === 0 || dayOfWeek === 1) {
            return { valid: false, message: '週日和週一休診' };
        }

        // 檢查營業時間
        if (dayOfWeek === 6) { // 週六
            if (hour < 11 || hour >= 20) {
                return { valid: false, message: '週六營業時間：11:00-20:00' };
            }
        } else { // 週二到週五
            if (hour < 12 || hour >= 20) {
                return { valid: false, message: '週二至週五營業時間：12:00-20:00' };
            }
        }

        return { valid: true, message: '預約時間有效' };
    }
};

// 初始化夯客預約管理器
let hankerManager;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    hankerManager = new HankerBookingManager();
    console.log('🔥 夯客預約系統已初始化');
});

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HankerBookingManager,
        HankerUtils,
        HANKER_CONFIG
    };
}
