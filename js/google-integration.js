/**
 * Google 整合管理器
 * 整合 Google Auth、Google AI (Gemini)、Google Calendar
 */
class GoogleIntegrationManager {
    constructor() {
        this.isGoogleLoaded = false;
        this.isSignedIn = false;
        this.currentUser = null;
        this.gapi = null;
        this.geminiAPI = null;
        
        this.config = {
            // Google Auth 配置
            auth: {
                clientId: this.getEnvVar('GOOGLE_CLIENT_ID'),
                scope: 'profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file'
            },
            // Google AI (Gemini) 配置
            gemini: {
                apiKey: this.getEnvVar('GOOGLE_AI_API_KEY'),
                model: 'gemini-1.5-flash'
            },
            // Google Calendar 配置
            calendar: {
                calendarId: 'primary'
            }
        };
        
        this.initGoogle();
    }
    
    /**
     * 獲取環境變數（從 Netlify Functions 或本地配置）
     */
    getEnvVar(name) {
        // 在生產環境中，這些值會從 Netlify Functions 獲取
        return window.GOOGLE_CONFIG?.[name] || '';
    }
    
    /**
     * 初始化 Google 服務
     */
    async initGoogle() {
        try {
            // 載入 Google API
            await this.loadGoogleAPI();
            
            // 初始化 Google Auth
            await this.initGoogleAuth();
            
            // 初始化 Google AI (Gemini)
            await this.initGoogleAI();
            
            // 初始化 Google Calendar
            await this.initGoogleCalendar();
            
            this.isGoogleLoaded = true;
            this.updateUI();
            
            console.log('✅ Google 整合初始化完成');
        } catch (error) {
            console.error('❌ Google 整合初始化失敗:', error);
            this.showError('Google 服務初始化失敗，請檢查網路連接');
        }
    }
    
    /**
     * 載入 Google API
     */
    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve(window.gapi);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('auth2:client:calendar', () => {
                    this.gapi = window.gapi;
                    resolve(window.gapi);
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * 初始化 Google Auth
     */
    async initGoogleAuth() {
        if (!this.config.auth.clientId) {
            console.warn('⚠️ Google Client ID 未設定');
            return;
        }
        
        await this.gapi.client.init({
            clientId: this.config.auth.clientId,
            scope: this.config.auth.scope,
            discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
            ]
        });
        
        const authInstance = this.gapi.auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
        
        if (this.isSignedIn) {
            this.currentUser = authInstance.currentUser.get();
            this.updateUserInfo();
        }
        
        // 監聽登入狀態變化
        authInstance.isSignedIn.listen((isSignedIn) => {
            this.isSignedIn = isSignedIn;
            if (isSignedIn) {
                this.currentUser = authInstance.currentUser.get();
                this.updateUserInfo();
            } else {
                this.currentUser = null;
                this.clearUserInfo();
            }
            this.updateUI();
        });
    }
    
    /**
     * 初始化 Google AI (Gemini)
     */
    async initGoogleAI() {
        if (!this.config.gemini.apiKey) {
            console.warn('⚠️ Google AI API Key 未設定');
            return;
        }
        
        // 載入 Google AI SDK
        try {
            const { GoogleGenerativeAI } = await import('https://esm.run/@google/generative-ai');
            this.geminiAPI = new GoogleGenerativeAI(this.config.gemini.apiKey);
            console.log('✅ Google AI (Gemini) 初始化完成');
        } catch (error) {
            console.error('❌ Google AI 載入失敗:', error);
        }
    }
    
    /**
     * 初始化 Google Calendar
     */
    async initGoogleCalendar() {
        // Google Calendar API 已在 gapi.client.init 中初始化
        console.log('✅ Google Calendar API 準備就緒');
    }
    
    /**
     * Google 登入
     */
    async signIn() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            this.showSuccess('Google 登入成功！');
        } catch (error) {
            console.error('Google 登入失敗:', error);
            this.showError('Google 登入失敗，請重試');
        }
    }
    
    /**
     * Google 登出
     */
    async signOut() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            this.showSuccess('已登出 Google 帳戶');
        } catch (error) {
            console.error('Google 登出失敗:', error);
            this.showError('登出失敗，請重試');
        }
    }
    
    /**
     * 使用 Google AI 分析預約數據
     */
    async analyzeAppointmentData(appointmentData) {
        if (!this.geminiAPI) {
            throw new Error('Google AI 未初始化');
        }
        
        try {
            const model = this.geminiAPI.getGenerativeModel({ model: this.config.gemini.model });
            
            const prompt = `
作為劉道玄諮詢師的 AI 助理，請分析以下預約數據並提供專業建議：

預約數據：
${JSON.stringify(appointmentData, null, 2)}

請提供：
1. 預約趨勢分析
2. 客戶偏好洞察
3. 排程優化建議
4. 營收提升建議
5. 客戶滿意度改善建議

請以專業、實用的方式回答，並提供具體的行動建議。
            `;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Google AI 分析失敗:', error);
            throw error;
        }
    }
    
    /**
     * 智能預約建議
     */
    async getSmartAppointmentSuggestions(customerProfile, availableSlots) {
        if (!this.geminiAPI) {
            throw new Error('Google AI 未初始化');
        }
        
        try {
            const model = this.geminiAPI.getGenerativeModel({ model: this.config.gemini.model });
            
            const prompt = `
作為劉道玄諮詢師的預約助理，請根據客戶資料推薦最適合的預約時段：

客戶資料：
${JSON.stringify(customerProfile, null, 2)}

可用時段：
${JSON.stringify(availableSlots, null, 2)}

請考慮：
1. 客戶的偏好時間
2. 療程類型和所需時間
3. 客戶的歷史預約記錄
4. 最佳的服務體驗

請推薦 3 個最佳時段，並說明推薦理由。
            `;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('智能預約建議失敗:', error);
            throw error;
        }
    }
    
    /**
     * 同步預約到 Google Calendar
     */
    async syncToGoogleCalendar(appointment) {
        if (!this.isSignedIn) {
            throw new Error('請先登入 Google 帳戶');
        }
        
        try {
            const event = {
                summary: `${appointment.customerName} - ${appointment.treatment}`,
                description: `
客戶：${appointment.customerName}
電話：${appointment.phone}
療程：${appointment.treatment}
備註：${appointment.notes || '無'}

劉道玄諮詢師預約系統
                `,
                start: {
                    dateTime: appointment.startTime,
                    timeZone: 'Asia/Taipei'
                },
                end: {
                    dateTime: appointment.endTime,
                    timeZone: 'Asia/Taipei'
                },
                attendees: [
                    { email: appointment.email }
                ],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1天前
                        { method: 'popup', minutes: 30 }       // 30分鐘前
                    ]
                }
            };
            
            const response = await this.gapi.client.calendar.events.insert({
                calendarId: this.config.calendar.calendarId,
                resource: event
            });
            
            return response.result;
        } catch (error) {
            console.error('Google Calendar 同步失敗:', error);
            throw error;
        }
    }
    
    /**
     * 從 Google Calendar 獲取預約
     */
    async getGoogleCalendarEvents(startDate, endDate) {
        if (!this.isSignedIn) {
            throw new Error('請先登入 Google 帳戶');
        }
        
        try {
            const response = await this.gapi.client.calendar.events.list({
                calendarId: this.config.calendar.calendarId,
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });
            
            return response.result.items;
        } catch (error) {
            console.error('獲取 Google Calendar 事件失敗:', error);
            throw error;
        }
    }
    
    /**
     * 更新用戶資訊顯示
     */
    updateUserInfo() {
        if (!this.currentUser) return;
        
        const profile = this.currentUser.getBasicProfile();
        const userInfo = {
            name: profile.getName(),
            email: profile.getEmail(),
            imageUrl: profile.getImageUrl()
        };
        
        // 更新 UI 顯示用戶資訊
        const userDisplay = document.getElementById('googleUserInfo');
        if (userDisplay) {
            userDisplay.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${userInfo.imageUrl}" alt="用戶頭像" class="rounded-circle me-2" width="32" height="32">
                    <div>
                        <div class="fw-bold">${userInfo.name}</div>
                        <small class="text-muted">${userInfo.email}</small>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 清除用戶資訊顯示
     */
    clearUserInfo() {
        const userDisplay = document.getElementById('googleUserInfo');
        if (userDisplay) {
            userDisplay.innerHTML = '';
        }
    }
    
    /**
     * 更新 UI 狀態
     */
    updateUI() {
        // 更新登入/登出按鈕
        const signInBtn = document.getElementById('googleSignInBtn');
        const signOutBtn = document.getElementById('googleSignOutBtn');
        
        if (signInBtn && signOutBtn) {
            if (this.isSignedIn) {
                signInBtn.style.display = 'none';
                signOutBtn.style.display = 'inline-block';
            } else {
                signInBtn.style.display = 'inline-block';
                signOutBtn.style.display = 'none';
            }
        }
        
        // 更新 Google 服務狀態指示器
        this.updateServiceStatus();
    }
    
    /**
     * 更新服務狀態指示器
     */
    updateServiceStatus() {
        const statusElements = {
            googleAuth: document.getElementById('googleAuthStatus'),
            googleAI: document.getElementById('googleAIStatus'),
            googleCalendar: document.getElementById('googleCalendarStatus')
        };
        
        // Google Auth 狀態
        if (statusElements.googleAuth) {
            statusElements.googleAuth.className = this.isSignedIn ? 
                'status-indicator status-connected' : 'status-indicator status-disconnected';
            statusElements.googleAuth.textContent = this.isSignedIn ? '已連接' : '未連接';
        }
        
        // Google AI 狀態
        if (statusElements.googleAI) {
            statusElements.googleAI.className = this.geminiAPI ? 
                'status-indicator status-connected' : 'status-indicator status-disconnected';
            statusElements.googleAI.textContent = this.geminiAPI ? '已連接' : '未連接';
        }
        
        // Google Calendar 狀態
        if (statusElements.googleCalendar) {
            statusElements.googleCalendar.className = (this.isSignedIn && this.gapi) ? 
                'status-indicator status-connected' : 'status-indicator status-disconnected';
            statusElements.googleCalendar.textContent = (this.isSignedIn && this.gapi) ? '已連接' : '未連接';
        }
    }
    
    /**
     * 顯示成功訊息
     */
    showSuccess(message) {
        console.log('✅', message);
        // 可以整合到現有的通知系統
        if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    }
    
    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        console.error('❌', message);
        // 可以整合到現有的通知系統
        if (window.showNotification) {
            window.showNotification(message, 'error');
        }
    }
    
    /**
     * 獲取當前狀態
     */
    getStatus() {
        return {
            isGoogleLoaded: this.isGoogleLoaded,
            isSignedIn: this.isSignedIn,
            hasGoogleAI: !!this.geminiAPI,
            hasGoogleCalendar: !!(this.isSignedIn && this.gapi),
            currentUser: this.currentUser ? {
                name: this.currentUser.getBasicProfile().getName(),
                email: this.currentUser.getBasicProfile().getEmail()
            } : null
        };
    }
}

// 全域實例
window.googleManager = new GoogleIntegrationManager();

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleIntegrationManager;
}
