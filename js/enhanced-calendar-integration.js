/**
 * 劉道玄曜診所雲整合系統 - 增強版 Google Calendar 整合
 * 提供穩定的日曆整合功能
 */

class EnhancedCalendarIntegration {
    constructor() {
        this.calendarId = '6bef0ee912b7ee1742123668e09eff427c258884010b7d36add1d1c9b1510658@group.calendar.google.com';
        this.apiKey = null; // 需要設置 Google Calendar API Key
        this.accessToken = null;
        this.isInitialized = false;
        this.events = [];
        this.syncInterval = null;
        
        this.init();
    }

    /**
     * 初始化日曆整合
     */
    async init() {
        try {
            console.log('🗓️ 初始化增強版 Google Calendar 整合...');
            
            // 檢查 Google APIs 是否已載入
            if (typeof gapi !== 'undefined') {
                await this.initializeGoogleAPI();
            } else {
                console.log('⚠️ Google APIs 未載入，使用內嵌模式');
                this.initializeEmbeddedMode();
            }
            
            this.isInitialized = true;
            console.log('✅ Google Calendar 整合初始化完成');
            
        } catch (error) {
            console.error('❌ Google Calendar 整合初始化失敗:', error);
            this.initializeFallbackMode();
        }
    }

    /**
     * 初始化 Google API
     */
    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.apiKey,
                        clientId: 'YOUR_CLIENT_ID', // 需要設置
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                        scope: 'https://www.googleapis.com/auth/calendar.readonly'
                    });
                    
                    console.log('✅ Google API 初始化成功');
                    resolve();
                } catch (error) {
                    console.error('❌ Google API 初始化失敗:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * 初始化內嵌模式
     */
    initializeEmbeddedMode() {
        console.log('📅 使用 Google Calendar 內嵌模式');
        
        // 確保內嵌日曆正確顯示
        this.ensureEmbeddedCalendarDisplay();
        
        // 設置定期重新載入以保持同步
        this.setupEmbeddedSync();
    }

    /**
     * 確保內嵌日曆正確顯示
     */
    ensureEmbeddedCalendarDisplay() {
        const iframe = document.querySelector('.google-calendar-container iframe');
        if (iframe) {
            // 設置正確的日曆 URL
            const calendarUrl = this.buildEmbeddedCalendarUrl();
            iframe.src = calendarUrl;
            
            // 監聽載入事件
            iframe.onload = () => {
                console.log('✅ Google Calendar 內嵌載入完成');
                this.dispatchEvent('calendarLoaded', { mode: 'embedded' });
            };
            
            iframe.onerror = () => {
                console.error('❌ Google Calendar 內嵌載入失敗');
                this.handleEmbeddedError();
            };
        }
    }

    /**
     * 建立內嵌日曆 URL
     */
    buildEmbeddedCalendarUrl() {
        const baseUrl = 'https://calendar.google.com/calendar/embed';
        const params = new URLSearchParams({
            src: this.calendarId,
            ctz: 'Asia/Taipei',
            mode: 'MONTH',
            showTitle: '0',
            showNav: '1',
            showDate: '1',
            showPrint: '0',
            showTabs: '1',
            showCalendars: '0',
            showTz: '0',
            bgcolor: '%23ffffff',
            color: '%23dc143c'
        });
        
        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * 設置內嵌同步
     */
    setupEmbeddedSync() {
        // 每5分鐘重新載入一次以保持同步
        this.syncInterval = setInterval(() => {
            this.refreshEmbeddedCalendar();
        }, 5 * 60 * 1000);
    }

    /**
     * 重新載入內嵌日曆
     */
    refreshEmbeddedCalendar() {
        const iframe = document.querySelector('.google-calendar-container iframe');
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                console.log('🔄 Google Calendar 已重新載入');
            }, 100);
        }
    }

    /**
     * 處理內嵌錯誤
     */
    handleEmbeddedError() {
        const container = document.querySelector('.google-calendar-container');
        if (container) {
            container.innerHTML = `
                <div class="calendar-error">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h5>日曆載入失敗</h5>
                    <p>無法載入 Google Calendar，請檢查網路連線或稍後再試。</p>
                    <button class="btn btn-primary" onclick="window.CalendarIntegration.retryLoad()">
                        <i class="fas fa-redo"></i> 重新載入
                    </button>
                </div>
            `;
        }
    }

    /**
     * 重試載入
     */
    retryLoad() {
        console.log('🔄 重新載入 Google Calendar...');
        const container = document.querySelector('.google-calendar-container');
        if (container) {
            container.innerHTML = `
                <iframe src="${this.buildEmbeddedCalendarUrl()}" 
                        style="border: 0; border-radius: 10px;" 
                        width="100%" 
                        height="600" 
                        frameborder="0" 
                        scrolling="no">
                </iframe>
            `;
            this.ensureEmbeddedCalendarDisplay();
        }
    }

    /**
     * 初始化備用模式
     */
    initializeFallbackMode() {
        console.log('🔧 啟用備用日曆模式');
        
        // 創建本地日曆視圖
        this.createFallbackCalendar();
    }

    /**
     * 創建備用日曆
     */
    createFallbackCalendar() {
        const container = document.querySelector('.google-calendar-container');
        if (container) {
            container.innerHTML = `
                <div class="fallback-calendar">
                    <div class="calendar-header">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.CalendarIntegration.previousMonth()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h5 id="calendar-month-year">${this.getCurrentMonthYear()}</h5>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.CalendarIntegration.nextMonth()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="calendar-grid" id="calendar-grid">
                        ${this.generateCalendarGrid()}
                    </div>
                    <div class="calendar-footer">
                        <small class="text-muted">
                            <i class="fas fa-info-circle"></i>
                            備用日曆模式 - 請聯繫系統管理員設置 Google Calendar 整合
                        </small>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 獲取當前月年
     */
    getCurrentMonthYear() {
        const now = new Date();
        const months = [
            '一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'
        ];
        return `${now.getFullYear()}年 ${months[now.getMonth()]}`;
    }

    /**
     * 生成日曆網格
     */
    generateCalendarGrid() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let html = '<div class="calendar-weekdays">';
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            html += `<div class="weekday">${day}</div>`;
        });
        html += '</div><div class="calendar-days">';
        
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === now.toDateString();
            
            html += `
                <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}">
                    <span class="day-number">${currentDate.getDate()}</span>
                </div>
            `;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        html += '</div>';
        
        return html;
    }

    /**
     * 上一個月
     */
    previousMonth() {
        // 實現月份切換邏輯
        console.log('切換到上一個月');
    }

    /**
     * 下一個月
     */
    nextMonth() {
        // 實現月份切換邏輯
        console.log('切換到下一個月');
    }

    /**
     * 同步日曆
     */
    async syncCalendar() {
        try {
            console.log('🔄 開始同步 Google Calendar...');
            
            if (this.accessToken) {
                await this.fetchCalendarEvents();
            } else {
                // 使用內嵌模式同步
                this.refreshEmbeddedCalendar();
            }
            
            this.dispatchEvent('calendarSynced', { 
                timestamp: new Date().toISOString(),
                eventsCount: this.events.length 
            });
            
            console.log('✅ Google Calendar 同步完成');
            return true;
            
        } catch (error) {
            console.error('❌ Google Calendar 同步失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取日曆事件
     */
    async fetchCalendarEvents() {
        try {
            const response = await gapi.client.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: new Date().toISOString(),
                maxResults: 100,
                singleEvents: true,
                orderBy: 'startTime'
            });
            
            this.events = response.result.items || [];
            console.log(`📅 獲取到 ${this.events.length} 個日曆事件`);
            
            return this.events;
            
        } catch (error) {
            console.error('❌ 獲取日曆事件失敗:', error);
            throw error;
        }
    }

    /**
     * 添加事件到日曆
     */
    async addEvent(eventData) {
        try {
            if (!this.accessToken) {
                throw new Error('未授權 Google Calendar 存取權限');
            }
            
            const event = {
                summary: eventData.title,
                start: {
                    dateTime: eventData.start,
                    timeZone: 'Asia/Taipei'
                },
                end: {
                    dateTime: eventData.end,
                    timeZone: 'Asia/Taipei'
                },
                description: eventData.description || ''
            };
            
            const response = await gapi.client.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });
            
            console.log('✅ 事件已添加到 Google Calendar:', response.result);
            return response.result;
            
        } catch (error) {
            console.error('❌ 添加事件到 Google Calendar 失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取日曆狀態
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasAccessToken: !!this.accessToken,
            eventsCount: this.events.length,
            calendarId: this.calendarId,
            lastSync: this.lastSyncTime
        };
    }

    /**
     * 事件分發
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(`calendar:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 清理資源
     */
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        this.events = [];
        this.isInitialized = false;
        console.log('🗑️ Google Calendar 整合已清理');
    }
}

// 全局實例
window.CalendarIntegration = new EnhancedCalendarIntegration();

// CSS 樣式
const calendarStyles = `
.calendar-error {
    text-align: center;
    padding: 3rem;
    color: #d4af37;
}

.calendar-error .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #dc143c;
}

.fallback-calendar {
    background: rgba(42, 42, 42, 0.9);
    border-radius: 10px;
    padding: 1rem;
    color: #d4af37;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    margin-bottom: 1px;
}

.weekday {
    background: rgba(212, 175, 55, 0.2);
    padding: 0.5rem;
    text-align: center;
    font-weight: bold;
    font-size: 0.9rem;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
}

.calendar-day {
    background: rgba(26, 26, 26, 0.8);
    padding: 0.5rem;
    min-height: 60px;
    border: 1px solid rgba(212, 175, 55, 0.1);
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
}

.calendar-day:hover {
    background: rgba(212, 175, 55, 0.1);
}

.calendar-day.other-month {
    opacity: 0.3;
}

.calendar-day.today {
    background: rgba(212, 175, 55, 0.3);
    border-color: #d4af37;
}

.day-number {
    font-weight: bold;
}

.calendar-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(212, 175, 55, 0.3);
    text-align: center;
}
`;

// 注入樣式
const styleSheet = document.createElement('style');
styleSheet.textContent = calendarStyles;
document.head.appendChild(styleSheet);

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedCalendarIntegration;
}
