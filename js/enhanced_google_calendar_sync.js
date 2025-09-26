// enhanced_google_calendar_sync.js - 增強版 Google Calendar 同步系統
// 基於現有醫療系統，提供完整的雙向同步功能

class EnhancedGoogleCalendarSync {
    constructor() {
        this.CLIENT_ID = '519705406951-rbdhk7l6et1vd1u83nv49hn1f53bjski.apps.googleusercontent.com';
        this.API_KEY = 'AQ.Ab8RN6I5kcSFUIuQWRPPIoXMBuNvLE8APGXxxM_H4tlqBidyqQ';
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar';
        
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.isConnected = false;
        this.syncInProgress = false;
        
        // 同步配置
        this.syncConfig = {
            autoSync: true,
            syncInterval: 300000, // 5分鐘
            lastSyncTime: null,
            conflictResolution: 'google_priority' // google_priority, local_priority, manual
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadGoogleAPIs();
            this.setupEventListeners();
            this.startAutoSync();
        } catch (error) {
            console.error('初始化 Google Calendar 同步失敗:', error);
        }
    }

    async loadGoogleAPIs() {
        return new Promise((resolve, reject) => {
            // 載入 Google APIs
            if (typeof gapi === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    gapi.load('client', async () => {
                        await this.initializeGapiClient();
                        this.loadGIS().then(resolve).catch(reject);
                    });
                };
                document.head.appendChild(script);
            } else {
                await this.initializeGapiClient();
                await this.loadGIS();
                resolve();
            }
        });
    }

    async initializeGapiClient() {
        await gapi.client.init({
            apiKey: this.API_KEY,
            discoveryDocs: [this.DISCOVERY_DOC],
        });
        this.gapiInited = true;
        this.maybeEnableSync();
    }

    async loadGIS() {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.accounts) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.onload = () => {
                    this.initializeGIS();
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                this.initializeGIS();
                resolve();
            }
        });
    }

    initializeGIS() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES,
            callback: (resp) => {
                if (resp.error !== undefined) {
                    throw (resp);
                }
                this.handleAuthSuccess();
            },
        });
        this.gisInited = true;
        this.maybeEnableSync();
    }

    maybeEnableSync() {
        if (this.gapiInited && this.gisInited) {
            this.updateSyncUI();
        }
    }

    // 認證相關方法
    async signIn() {
        try {
            if (gapi.client.getToken() === null) {
                this.tokenClient.requestAccessToken({prompt: 'consent'});
            } else {
                this.tokenClient.requestAccessToken({prompt: ''});
            }
        } catch (error) {
            console.error('Google Calendar 登入失敗:', error);
            this.showNotification('Google Calendar 連接失敗', 'error');
        }
    }

    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.isConnected = false;
            this.updateSyncUI();
            this.showNotification('已中斷 Google Calendar 連接', 'info');
        }
    }

    handleAuthSuccess() {
        this.isConnected = true;
        this.updateSyncUI();
        this.showNotification('Google Calendar 連接成功！', 'success');
        
        // 立即執行一次同步
        this.performFullSync();
    }

    // 同步核心方法
    async performFullSync() {
        if (this.syncInProgress) {
            console.log('同步正在進行中，跳過此次同步');
            return;
        }

        this.syncInProgress = true;
        this.updateSyncStatus('同步中...');

        try {
            // 1. 從 Google Calendar 獲取事件
            const googleEvents = await this.fetchGoogleCalendarEvents();
            
            // 2. 比較本地和遠端事件
            const syncResult = await this.compareAndSync(googleEvents);
            
            // 3. 更新本地資料
            await this.updateLocalData(syncResult);
            
            // 4. 更新 UI
            this.refreshCalendarView();
            
            this.syncConfig.lastSyncTime = new Date();
            this.updateSyncStatus(`同步完成 (${new Date().toLocaleTimeString()})`);
            
            console.log('同步完成:', syncResult);

        } catch (error) {
            console.error('同步失敗:', error);
            this.updateSyncStatus('同步失敗');
            this.showNotification(`同步失敗: ${error.message}`, 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    async fetchGoogleCalendarEvents() {
        const now = new Date();
        const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30天前
        const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90天後

        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': timeMin.toISOString(),
            'timeMax': timeMax.toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 500,
            'orderBy': 'startTime'
        });

        return response.result.items || [];
    }

    async compareAndSync(googleEvents) {
        const localEvents = currentTreatments || [];
        const syncResult = {
            created: [],
            updated: [],
            deleted: [],
            conflicts: []
        };

        // 建立事件映射
        const googleEventMap = new Map();
        const localEventMap = new Map();

        googleEvents.forEach(event => {
            googleEventMap.set(event.id, event);
        });

        localEvents.forEach(event => {
            if (event.id) {
                localEventMap.set(event.id, event);
            }
        });

        // 處理 Google Calendar 中的事件
        for (const googleEvent of googleEvents) {
            const localEvent = localEventMap.get(googleEvent.id);
            
            if (!localEvent) {
                // Google 中有，本地沒有 -> 創建本地事件
                const newLocalEvent = this.convertGoogleEventToLocal(googleEvent);
                syncResult.created.push(newLocalEvent);
            } else {
                // 檢查是否需要更新
                if (this.needsUpdate(googleEvent, localEvent)) {
                    const updatedEvent = this.mergeEvents(googleEvent, localEvent);
                    syncResult.updated.push(updatedEvent);
                }
            }
        }

        // 處理本地事件
        for (const localEvent of localEvents) {
            if (localEvent.id && !googleEventMap.has(localEvent.id)) {
                // 本地有，Google 沒有 -> 可能被刪除
                syncResult.deleted.push(localEvent);
            }
        }

        return syncResult;
    }

    convertGoogleEventToLocal(googleEvent) {
        const start = googleEvent.start.dateTime || googleEvent.start.date;
        const end = googleEvent.end.dateTime || googleEvent.end.date;
        
        // 解析事件標題以提取患者姓名和療程
        const summaryParts = googleEvent.summary.split(' - ');
        const patientName = summaryParts[0] || '未知患者';
        const treatment = summaryParts[1] || '諮詢';

        return {
            id: googleEvent.id,
            patientName: patientName,
            treatment: treatment,
            date: start.substring(0, 10),
            time: start.substring(11, 16),
            duration: this.calculateDuration(start, end),
            status: 'scheduled',
            source: 'google_calendar',
            description: googleEvent.description || '',
            location: googleEvent.location || '',
            attendees: googleEvent.attendees || [],
            lastModified: googleEvent.updated
        };
    }

    needsUpdate(googleEvent, localEvent) {
        // 比較關鍵欄位是否有變化
        const googleModified = new Date(googleEvent.updated);
        const localModified = new Date(localEvent.lastModified || localEvent.updatedAt || 0);
        
        return googleModified > localModified;
    }

    mergeEvents(googleEvent, localEvent) {
        // 根據衝突解決策略合併事件
        if (this.syncConfig.conflictResolution === 'google_priority') {
            return this.convertGoogleEventToLocal(googleEvent);
        } else if (this.syncConfig.conflictResolution === 'local_priority') {
            return localEvent;
        } else {
            // 手動解決衝突
            return this.createConflictEvent(googleEvent, localEvent);
        }
    }

    async updateLocalData(syncResult) {
        // 更新 currentTreatments 陣列
        if (!window.currentTreatments) {
            window.currentTreatments = [];
        }

        // 新增事件
        syncResult.created.forEach(event => {
            currentTreatments.push(event);
        });

        // 更新事件
        syncResult.updated.forEach(updatedEvent => {
            const index = currentTreatments.findIndex(e => e.id === updatedEvent.id);
            if (index !== -1) {
                currentTreatments[index] = updatedEvent;
            }
        });

        // 刪除事件
        syncResult.deleted.forEach(deletedEvent => {
            const index = currentTreatments.findIndex(e => e.id === deletedEvent.id);
            if (index !== -1) {
                currentTreatments.splice(index, 1);
            }
        });

        // 儲存到本地存儲
        this.saveToLocalStorage();
    }

    // 本地到 Google 的同步
    async syncLocalEventToGoogle(localEvent) {
        try {
            const googleEvent = this.convertLocalEventToGoogle(localEvent);
            
            if (localEvent.id && localEvent.source === 'google_calendar') {
                // 更新現有事件
                const response = await gapi.client.calendar.events.update({
                    'calendarId': 'primary',
                    'eventId': localEvent.id,
                    'resource': googleEvent
                });
                return response.result;
            } else {
                // 創建新事件
                const response = await gapi.client.calendar.events.insert({
                    'calendarId': 'primary',
                    'resource': googleEvent
                });
                
                // 更新本地事件 ID
                localEvent.id = response.result.id;
                localEvent.source = 'google_calendar';
                
                return response.result;
            }
        } catch (error) {
            console.error('同步本地事件到 Google 失敗:', error);
            throw error;
        }
    }

    convertLocalEventToGoogle(localEvent) {
        const startDateTime = new Date(`${localEvent.date}T${localEvent.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (localEvent.duration || 60) * 60000);

        return {
            'summary': `${localEvent.patientName} - ${localEvent.treatment}`,
            'description': this.buildEventDescription(localEvent),
            'start': {
                'dateTime': startDateTime.toISOString(),
                'timeZone': 'Asia/Taipei'
            },
            'end': {
                'dateTime': endDateTime.toISOString(),
                'timeZone': 'Asia/Taipei'
            },
            'location': localEvent.location || '',
            'attendees': localEvent.attendees || [],
            'reminders': {
                'useDefault': false,
                'overrides': [
                    {'method': 'popup', 'minutes': 60},
                    {'method': 'popup', 'minutes': 15}
                ]
            }
        };
    }

    buildEventDescription(localEvent) {
        let description = '';
        
        if (localEvent.patientPhone) {
            description += `聯絡電話：${localEvent.patientPhone}\n`;
        }
        
        if (localEvent.peopleCount && localEvent.peopleCount > 1) {
            description += `人數：${localEvent.peopleCount}人\n`;
        }
        
        if (localEvent.type) {
            description += `預約類型：${localEvent.type}\n`;
        }
        
        if (localEvent.notes) {
            description += `備註：${localEvent.notes}\n`;
        }
        
        description += `\n由診所管理系統同步 - ${new Date().toLocaleString()}`;
        
        return description.trim();
    }

    // 自動同步
    startAutoSync() {
        if (this.syncConfig.autoSync) {
            setInterval(() => {
                if (this.isConnected && !this.syncInProgress) {
                    this.performFullSync();
                }
            }, this.syncConfig.syncInterval);
        }
    }

    // Webhook 處理 (模擬)
    setupWebhookListener() {
        // 在實際部署中，這會是一個後端 webhook 端點
        // 這裡模擬 Google Calendar 變更通知
        window.addEventListener('google-calendar-change', (event) => {
            console.log('收到 Google Calendar 變更通知:', event.detail);
            if (this.isConnected) {
                this.performFullSync();
            }
        });
    }

    // UI 更新方法
    updateSyncUI() {
        const syncButton = document.getElementById('calendarSyncButton');
        const syncStatus = document.getElementById('calendarSyncStatus');
        const signInButton = document.getElementById('calendarSignIn');
        const signOutButton = document.getElementById('calendarSignOut');

        if (this.isConnected) {
            if (syncButton) {
                syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> 立即同步';
                syncButton.disabled = false;
                syncButton.onclick = () => this.performFullSync();
            }
            
            if (signInButton) signInButton.style.display = 'none';
            if (signOutButton) {
                signOutButton.style.display = 'block';
                signOutButton.onclick = () => this.signOut();
            }
            
            if (syncStatus) {
                syncStatus.className = 'alert alert-success';
                syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Google Calendar 已連接';
            }
        } else {
            if (syncButton) {
                syncButton.innerHTML = '<i class="fas fa-link"></i> 連接 Google Calendar';
                syncButton.onclick = () => this.signIn();
            }
            
            if (signInButton) {
                signInButton.style.display = 'block';
                signInButton.onclick = () => this.signIn();
            }
            if (signOutButton) signOutButton.style.display = 'none';
            
            if (syncStatus) {
                syncStatus.className = 'alert alert-warning';
                syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 請連接 Google Calendar';
            }
        }
    }

    updateSyncStatus(message) {
        const statusElement = document.getElementById('syncStatusMessage');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    refreshCalendarView() {
        // 更新日曆檢視
        if (typeof calendarView !== 'undefined' && calendarView.render) {
            calendarView.render();
        }
        
        // 更新今日摘要
        if (typeof updateTodaySummary === 'function') {
            updateTodaySummary();
        }
    }

    // 工具方法
    calculateDuration(start, end) {
        const startTime = new Date(start);
        const endTime = new Date(end);
        return Math.round((endTime - startTime) / (1000 * 60)); // 分鐘
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('currentTreatments', JSON.stringify(currentTreatments));
            localStorage.setItem('lastSyncTime', this.syncConfig.lastSyncTime?.toISOString());
        } catch (error) {
            console.error('儲存到本地存儲失敗:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('currentTreatments');
            if (saved) {
                window.currentTreatments = JSON.parse(saved);
            }
            
            const lastSync = localStorage.getItem('lastSyncTime');
            if (lastSync) {
                this.syncConfig.lastSyncTime = new Date(lastSync);
            }
        } catch (error) {
            console.error('從本地存儲載入失敗:', error);
        }
    }

    showNotification(message, type = 'info') {
        // 使用現有的通知系統
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    setupEventListeners() {
        // 監聽本地預約變更
        document.addEventListener('appointment-created', (event) => {
            if (this.isConnected) {
                this.syncLocalEventToGoogle(event.detail);
            }
        });

        document.addEventListener('appointment-updated', (event) => {
            if (this.isConnected) {
                this.syncLocalEventToGoogle(event.detail);
            }
        });

        document.addEventListener('appointment-deleted', (event) => {
            if (this.isConnected && event.detail.id) {
                this.deleteGoogleCalendarEvent(event.detail.id);
            }
        });
    }

    async deleteGoogleCalendarEvent(eventId) {
        try {
            await gapi.client.calendar.events.delete({
                'calendarId': 'primary',
                'eventId': eventId
            });
            console.log('已從 Google Calendar 刪除事件:', eventId);
        } catch (error) {
            console.error('刪除 Google Calendar 事件失敗:', error);
        }
    }

    // 公開 API
    getConnectionStatus() {
        return this.isConnected;
    }

    getSyncStatus() {
        return {
            inProgress: this.syncInProgress,
            lastSync: this.syncConfig.lastSyncTime,
            autoSync: this.syncConfig.autoSync
        };
    }

    toggleAutoSync() {
        this.syncConfig.autoSync = !this.syncConfig.autoSync;
        if (this.syncConfig.autoSync) {
            this.startAutoSync();
        }
        return this.syncConfig.autoSync;
    }
}

// 全域實例
let googleCalendarSync = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    googleCalendarSync = new EnhancedGoogleCalendarSync();
    
    // 載入本地資料
    googleCalendarSync.loadFromLocalStorage();
    
    // 設定 UI 事件監聽器
    setupSyncUIEventListeners();
});

function setupSyncUIEventListeners() {
    // 手動同步按鈕
    const manualSyncBtn = document.getElementById('manualSyncButton');
    if (manualSyncBtn) {
        manualSyncBtn.addEventListener('click', () => {
            if (googleCalendarSync && googleCalendarSync.getConnectionStatus()) {
                googleCalendarSync.performFullSync();
            } else {
                googleCalendarSync.signIn();
            }
        });
    }

    // 自動同步切換
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    if (autoSyncToggle) {
        autoSyncToggle.addEventListener('change', (e) => {
            if (googleCalendarSync) {
                googleCalendarSync.toggleAutoSync();
            }
        });
    }
}

// 匯出給其他模組使用
window.googleCalendarSync = googleCalendarSync;
