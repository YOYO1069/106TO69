// Google Calendar 整合模組
class CalendarIntegration {
    constructor() {
        this.isSignedIn = false;
        this.gapi = null;
        this.calendarId = 'primary';
        this.apiKey = null; // 需要在環境變數中設置
        this.clientId = null; // 需要在環境變數中設置
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/calendar';
    }

    // 初始化 Google Calendar API
    async initialize() {
        try {
            // 載入 Google API
            await this.loadGoogleAPI();
            
            // 初始化 gapi
            await gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: this.clientId
                });
            });

            await gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: this.apiKey,
                    clientId: this.clientId,
                    discoveryDocs: [this.discoveryDoc],
                    scope: this.scopes
                });

                this.gapi = gapi;
                this.updateSigninStatus();
            });

            console.log('Google Calendar API initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Calendar API:', error);
            return false;
        }
    }

    // 載入 Google API 腳本
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 更新登入狀態
    updateSigninStatus() {
        if (!this.gapi) return;

        const authInstance = this.gapi.auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
        
        // 監聽登入狀態變化
        authInstance.isSignedIn.listen(this.updateSigninStatus.bind(this));
    }

    // 登入 Google 帳號
    async signIn() {
        try {
            if (!this.gapi) {
                throw new Error('Google API not initialized');
            }

            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            
            this.isSignedIn = true;
            console.log('Successfully signed in to Google Calendar');
            return true;
        } catch (error) {
            console.error('Failed to sign in:', error);
            return false;
        }
    }

    // 登出 Google 帳號
    async signOut() {
        try {
            if (!this.gapi) return;

            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            
            this.isSignedIn = false;
            console.log('Successfully signed out from Google Calendar');
        } catch (error) {
            console.error('Failed to sign out:', error);
        }
    }

    // 獲取日曆事件
    async getEvents(timeMin, timeMax) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not signed in to Google Calendar');
            }

            const response = await this.gapi.client.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax,
                showDeleted: false,
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.result.items || [];
        } catch (error) {
            console.error('Failed to get calendar events:', error);
            return [];
        }
    }

    // 創建日曆事件
    async createEvent(eventData) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not signed in to Google Calendar');
            }

            const event = {
                summary: eventData.title,
                description: eventData.description || '',
                start: {
                    dateTime: eventData.start,
                    timeZone: 'Asia/Taipei'
                },
                end: {
                    dateTime: eventData.end,
                    timeZone: 'Asia/Taipei'
                },
                attendees: eventData.attendees || [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ]
                }
            };

            const response = await this.gapi.client.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            console.log('Event created:', response.result);
            return response.result;
        } catch (error) {
            console.error('Failed to create calendar event:', error);
            throw error;
        }
    }

    // 更新日曆事件
    async updateEvent(eventId, eventData) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not signed in to Google Calendar');
            }

            const event = {
                summary: eventData.title,
                description: eventData.description || '',
                start: {
                    dateTime: eventData.start,
                    timeZone: 'Asia/Taipei'
                },
                end: {
                    dateTime: eventData.end,
                    timeZone: 'Asia/Taipei'
                }
            };

            const response = await this.gapi.client.calendar.events.update({
                calendarId: this.calendarId,
                eventId: eventId,
                resource: event
            });

            console.log('Event updated:', response.result);
            return response.result;
        } catch (error) {
            console.error('Failed to update calendar event:', error);
            throw error;
        }
    }

    // 刪除日曆事件
    async deleteEvent(eventId) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not signed in to Google Calendar');
            }

            await this.gapi.client.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId
            });

            console.log('Event deleted:', eventId);
            return true;
        } catch (error) {
            console.error('Failed to delete calendar event:', error);
            return false;
        }
    }

    // 檢查時段是否可用
    async checkAvailability(startTime, endTime) {
        try {
            const events = await this.getEvents(startTime, endTime);
            return events.length === 0;
        } catch (error) {
            console.error('Failed to check availability:', error);
            return false;
        }
    }

    // 獲取忙碌時段
    async getBusyTimes(timeMin, timeMax) {
        try {
            if (!this.isSignedIn) {
                return [];
            }

            const response = await this.gapi.client.calendar.freebusy.query({
                resource: {
                    timeMin: timeMin,
                    timeMax: timeMax,
                    items: [{ id: this.calendarId }]
                }
            });

            const busyTimes = response.result.calendars[this.calendarId].busy || [];
            return busyTimes;
        } catch (error) {
            console.error('Failed to get busy times:', error);
            return [];
        }
    }
}

// 夯客平台整合模組
class HankeIntegration {
    constructor() {
        this.apiEndpoint = 'https://api.hanke.com'; // 假設的API端點
        this.apiKey = null; // 需要設置API密鑰
    }

    // 同步預約到夯客平台
    async syncAppointmentToHanke(appointmentData) {
        try {
            const hankeData = {
                customer_name: appointmentData.customerName,
                phone: appointmentData.customerPhone,
                service: appointmentData.treatmentType,
                appointment_time: appointmentData.appointmentDateTime,
                notes: appointmentData.notes || '',
                source: 'liu_daoxuan_clinic'
            };

            // 模擬API調用
            console.log('Syncing to Hanke platform:', hankeData);
            
            // 實際實作時應該調用真實的API
            const response = await this.mockApiCall('/appointments', 'POST', hankeData);
            
            return response;
        } catch (error) {
            console.error('Failed to sync appointment to Hanke:', error);
            throw error;
        }
    }

    // 從夯客平台獲取預約
    async getAppointmentsFromHanke(startDate, endDate) {
        try {
            const params = {
                start_date: startDate,
                end_date: endDate,
                clinic_id: 'liu_daoxuan_clinic'
            };

            // 模擬API調用
            const response = await this.mockApiCall('/appointments', 'GET', null, params);
            
            return response.appointments || [];
        } catch (error) {
            console.error('Failed to get appointments from Hanke:', error);
            return [];
        }
    }

    // 模擬API調用
    async mockApiCall(endpoint, method, data, params) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模擬成功回應
                resolve({
                    success: true,
                    data: data,
                    appointments: [
                        {
                            id: 'HK001',
                            customer_name: '劉道玄客戶A',
                            phone: '0912-345-678',
                            service: '肉毒桿菌注射',
                            appointment_time: '2024-09-25T14:00:00',
                            status: 'confirmed'
                        }
                    ]
                });
            }, 1000);
        });
    }
}

// 預約同步管理器
class AppointmentSyncManager {
    constructor() {
        this.calendarIntegration = new CalendarIntegration();
        this.hankeIntegration = new HankeIntegration();
        this.syncEnabled = false;
    }

    // 初始化同步管理器
    async initialize() {
        try {
            // 初始化 Google Calendar
            const calendarInitialized = await this.calendarIntegration.initialize();
            
            if (calendarInitialized) {
                this.syncEnabled = true;
                console.log('Appointment sync manager initialized');
            }
            
            return this.syncEnabled;
        } catch (error) {
            console.error('Failed to initialize sync manager:', error);
            return false;
        }
    }

    // 同步預約到所有平台
    async syncAppointment(appointmentData) {
        const results = {
            calendar: false,
            hanke: false,
            errors: []
        };

        try {
            // 同步到 Google Calendar
            if (this.calendarIntegration.isSignedIn) {
                const calendarEvent = {
                    title: `${appointmentData.customerName} - ${appointmentData.treatmentType}`,
                    description: `客戶: ${appointmentData.customerName}\n電話: ${appointmentData.customerPhone}\n療程: ${appointmentData.treatmentType}\n備註: ${appointmentData.notes || '無'}`,
                    start: appointmentData.appointmentDateTime,
                    end: new Date(new Date(appointmentData.appointmentDateTime).getTime() + 30 * 60000).toISOString(),
                    attendees: [
                        { email: 'clinic@example.com' }
                    ]
                };

                try {
                    await this.calendarIntegration.createEvent(calendarEvent);
                    results.calendar = true;
                    console.log('Appointment synced to Google Calendar');
                } catch (error) {
                    results.errors.push('Google Calendar sync failed: ' + error.message);
                }
            }

            // 同步到夯客平台
            try {
                await this.hankeIntegration.syncAppointmentToHanke(appointmentData);
                results.hanke = true;
                console.log('Appointment synced to Hanke platform');
            } catch (error) {
                results.errors.push('Hanke platform sync failed: ' + error.message);
            }

        } catch (error) {
            results.errors.push('General sync error: ' + error.message);
        }

        return results;
    }

    // 從所有平台獲取預約
    async getAllAppointments(startDate, endDate) {
        const allAppointments = [];

        try {
            // 從 Google Calendar 獲取
            if (this.calendarIntegration.isSignedIn) {
                const calendarEvents = await this.calendarIntegration.getEvents(startDate, endDate);
                
                calendarEvents.forEach(event => {
                    allAppointments.push({
                        id: event.id,
                        title: event.summary,
                        start: event.start.dateTime || event.start.date,
                        end: event.end.dateTime || event.end.date,
                        source: 'google_calendar',
                        description: event.description || ''
                    });
                });
            }

            // 從夯客平台獲取
            const hankeAppointments = await this.hankeIntegration.getAppointmentsFromHanke(startDate, endDate);
            
            hankeAppointments.forEach(appointment => {
                allAppointments.push({
                    id: appointment.id,
                    title: `${appointment.customer_name} - ${appointment.service}`,
                    start: appointment.appointment_time,
                    end: new Date(new Date(appointment.appointment_time).getTime() + 30 * 60000).toISOString(),
                    source: 'hanke_platform',
                    customerName: appointment.customer_name,
                    phone: appointment.phone,
                    service: appointment.service,
                    status: appointment.status
                });
            });

        } catch (error) {
            console.error('Failed to get all appointments:', error);
        }

        return allAppointments;
    }

    // 檢查時段衝突
    async checkTimeConflicts(startTime, endTime) {
        try {
            const appointments = await this.getAllAppointments(startTime, endTime);
            return appointments.length > 0;
        } catch (error) {
            console.error('Failed to check time conflicts:', error);
            return false;
        }
    }

    // 登入 Google Calendar
    async signInToCalendar() {
        return await this.calendarIntegration.signIn();
    }

    // 登出 Google Calendar
    async signOutFromCalendar() {
        await this.calendarIntegration.signOut();
    }

    // 獲取登入狀態
    isCalendarSignedIn() {
        return this.calendarIntegration.isSignedIn;
    }
}

// 劉道玄預約機器貓
class LiuDaoxuanAppointmentBot {
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.specialRules = {
            // 劉道玄客戶的特殊規則
            priorityBooking: true,
            extendedHours: false,
            specialDiscount: 0.1,
            dedicatedTimeSlots: [
                '14:00', '15:00', '16:00' // 專屬時段
            ]
        };
    }

    // 處理劉道玄推薦的預約
    async processLiuDaoxuanAppointment(appointmentData) {
        try {
            // 標記為劉道玄推薦
            appointmentData.source = 'liu_daoxuan';
            appointmentData.priority = 'high';
            appointmentData.discount = this.specialRules.specialDiscount;

            // 檢查專屬時段
            const appointmentTime = new Date(appointmentData.appointmentDateTime).getHours() + ':' + 
                                  new Date(appointmentData.appointmentDateTime).getMinutes().toString().padStart(2, '0');
            
            if (this.specialRules.dedicatedTimeSlots.includes(appointmentTime)) {
                appointmentData.timeSlotType = 'dedicated';
            }

            // 同步到所有平台
            const syncResults = await this.syncManager.syncAppointment(appointmentData);

            // 發送特殊通知
            await this.sendLiuDaoxuanNotification(appointmentData, syncResults);

            return {
                success: true,
                appointmentData: appointmentData,
                syncResults: syncResults
            };

        } catch (error) {
            console.error('Failed to process Liu Daoxuan appointment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 發送劉道玄專屬通知
    async sendLiuDaoxuanNotification(appointmentData, syncResults) {
        try {
            const notification = {
                type: 'liu_daoxuan_appointment',
                customer: appointmentData.customerName,
                treatment: appointmentData.treatmentType,
                datetime: appointmentData.appointmentDateTime,
                discount: appointmentData.discount,
                syncStatus: syncResults
            };

            console.log('Liu Daoxuan appointment notification:', notification);
            
            // 這裡可以整合實際的通知系統
            // 例如：發送 LINE 訊息、Email 等
            
        } catch (error) {
            console.error('Failed to send Liu Daoxuan notification:', error);
        }
    }

    // 獲取劉道玄客戶的預約統計
    async getLiuDaoxuanStats(startDate, endDate) {
        try {
            const allAppointments = await this.syncManager.getAllAppointments(startDate, endDate);
            
            const liuDaoxuanAppointments = allAppointments.filter(appointment => 
                appointment.source === 'liu_daoxuan' || 
                appointment.description?.includes('劉道玄')
            );

            return {
                totalAppointments: liuDaoxuanAppointments.length,
                totalRevenue: liuDaoxuanAppointments.length * 15000, // 假設平均消費
                appointments: liuDaoxuanAppointments
            };

        } catch (error) {
            console.error('Failed to get Liu Daoxuan stats:', error);
            return {
                totalAppointments: 0,
                totalRevenue: 0,
                appointments: []
            };
        }
    }
}

// 全域變數
let appointmentSyncManager = null;
let liuDaoxuanBot = null;

// 初始化日曆整合
async function initializeCalendarIntegration() {
    try {
        appointmentSyncManager = new AppointmentSyncManager();
        const initialized = await appointmentSyncManager.initialize();
        
        if (initialized) {
            liuDaoxuanBot = new LiuDaoxuanAppointmentBot(appointmentSyncManager);
            console.log('Calendar integration initialized successfully');
            return true;
        } else {
            console.log('Calendar integration initialization failed');
            return false;
        }
    } catch (error) {
        console.error('Failed to initialize calendar integration:', error);
        return false;
    }
}

// 匯出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CalendarIntegration,
        HankeIntegration,
        AppointmentSyncManager,
        LiuDaoxuanAppointmentBot,
        initializeCalendarIntegration
    };
}
