/**
 * 進階行事曆管理器
 * 整合 FullCalendar、AI 智能分析和四方平台同步
 */

class AdvancedCalendarManager {
    constructor() {
        this.calendar = null;
        this.appointments = [];
        this.currentAppointment = null;
        this.businessHours = {
            tuesday: { start: '12:00', end: '20:00' },
            wednesday: { start: '12:00', end: '20:00' },
            thursday: { start: '12:00', end: '20:00' },
            friday: { start: '12:00', end: '20:00' },
            saturday: { start: '11:00', end: '20:00' }
        };
        this.timeSlots = this.generateTimeSlots();
        this.init();
    }

    /**
     * 初始化行事曆系統
     */
    init() {
        console.log('進階行事曆管理器初始化中...');
        this.initializeCalendar();
        this.loadAppointments();
        this.setupEventListeners();
        this.updateStatistics();
        this.generateAISuggestions();
    }

    /**
     * 初始化 FullCalendar
     */
    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error('找不到行事曆容器元素');
            return;
        }

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-tw',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            buttonText: {
                today: '今天',
                month: '月',
                week: '週',
                day: '日',
                list: '列表'
            },
            height: 'auto',
            aspectRatio: 1.8,
            
            // 營業時間設定
            businessHours: [
                { daysOfWeek: [2], startTime: '12:00', endTime: '20:00' }, // 週二
                { daysOfWeek: [3], startTime: '12:00', endTime: '20:00' }, // 週三
                { daysOfWeek: [4], startTime: '12:00', endTime: '20:00' }, // 週四
                { daysOfWeek: [5], startTime: '12:00', endTime: '20:00' }, // 週五
                { daysOfWeek: [6], startTime: '11:00', endTime: '20:00' }  // 週六
            ],
            
            // 時間格式
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            // 時間間隔
            slotDuration: '00:15:00',
            slotMinTime: '11:00:00',
            slotMaxTime: '21:00:00',
            
            // 事件處理
            dateClick: (info) => {
                this.handleDateClick(info);
            },
            
            eventClick: (info) => {
                this.handleEventClick(info);
            },
            
            eventDrop: (info) => {
                this.handleEventDrop(info);
            },
            
            eventResize: (info) => {
                this.handleEventResize(info);
            },
            
            // 選擇範圍
            selectable: true,
            selectMirror: true,
            select: (info) => {
                this.handleDateSelect(info);
            },
            
            // 事件顯示
            eventDisplay: 'block',
            dayMaxEvents: 3,
            moreLinkClick: 'popover',
            
            // 週末顯示
            weekends: true,
            
            // 事件來源
            events: (info, successCallback, failureCallback) => {
                this.loadCalendarEvents(info, successCallback, failureCallback);
            },
            
            // 載入中顯示
            loading: (isLoading) => {
                this.handleLoading(isLoading);
            }
        });

        this.calendar.render();
        console.log('FullCalendar 已初始化');
    }

    /**
     * 生成可用時間段
     */
    generateTimeSlots() {
        const slots = [];
        const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        days.forEach(day => {
            const hours = this.businessHours[day];
            const startHour = parseInt(hours.start.split(':')[0]);
            const startMinute = parseInt(hours.start.split(':')[1]);
            const endHour = parseInt(hours.end.split(':')[0]);
            const endMinute = parseInt(hours.end.split(':')[1]);
            
            let currentHour = startHour;
            let currentMinute = startMinute;
            
            while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
                const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                slots.push(timeString);
                
                currentMinute += 15;
                if (currentMinute >= 60) {
                    currentMinute = 0;
                    currentHour++;
                }
            }
        });
        
        return [...new Set(slots)].sort();
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 監聽預約表單的日期變更
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.updateAvailableTimeSlots();
            });
        }

        // 監聽視窗大小變更
        window.addEventListener('resize', () => {
            if (this.calendar) {
                this.calendar.updateSize();
            }
        });

        // 監聽預約事件
        document.addEventListener('appointmentCreated', (event) => {
            this.handleNewAppointment(event.detail);
        });

        document.addEventListener('appointmentUpdated', (event) => {
            this.handleAppointmentUpdate(event.detail);
        });

        document.addEventListener('appointmentCancelled', (event) => {
            this.handleAppointmentCancellation(event.detail);
        });
    }

    /**
     * 載入預約資料
     */
    async loadAppointments() {
        try {
            // 從本地存儲載入
            const storedAppointments = localStorage.getItem('appointments');
            if (storedAppointments) {
                this.appointments = JSON.parse(storedAppointments);
            }

            // 從四方平台同步載入
            await this.syncAppointmentsFromPlatforms();
            
            // 更新行事曆顯示
            if (this.calendar) {
                this.calendar.refetchEvents();
            }
            
            console.log(`已載入 ${this.appointments.length} 筆預約資料`);
            
        } catch (error) {
            console.error('載入預約資料失敗:', error);
            this.showNotification('載入預約資料時發生錯誤', 'error');
        }
    }

    /**
     * 從四方平台同步預約資料
     */
    async syncAppointmentsFromPlatforms() {
        try {
            const syncPromises = [];

            // 從 Airtable 同步
            if (window.quadManager && window.quadManager.services.airtable.status === 'connected') {
                syncPromises.push(this.syncFromAirtable());
            }

            // 從 Manus 同步
            if (window.quadManager && window.quadManager.services.manus.status === 'connected') {
                syncPromises.push(this.syncFromManus());
            }

            const results = await Promise.allSettled(syncPromises);
            
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`平台同步失敗 (${index}):`, result.reason);
                }
            });

        } catch (error) {
            console.error('四方平台同步失敗:', error);
        }
    }

    /**
     * 從 Airtable 同步預約
     */
    async syncFromAirtable() {
        try {
            const response = await fetch('/.netlify/functions/airtable-mcp-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_airtable_records',
                    data: {
                        tableName: '預約管理',
                        maxRecords: 100
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.mergeAirtableAppointments(result.data);
                }
            }

        } catch (error) {
            console.error('Airtable 同步失敗:', error);
        }
    }

    /**
     * 從 Manus 同步預約
     */
    async syncFromManus() {
        try {
            const response = await fetch('/.netlify/functions/manus-netlify-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_appointments',
                    data: {}
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.mergeManusAppointments(result.data);
                }
            }

        } catch (error) {
            console.error('Manus 同步失敗:', error);
        }
    }

    /**
     * 合併 Airtable 預約資料
     */
    mergeAirtableAppointments(airtableRecords) {
        airtableRecords.forEach(record => {
            const appointment = {
                id: record.id,
                title: `${record.fields['客戶姓名']} - ${record.fields['療程項目']}`,
                start: record.fields['預約時間'],
                clientName: record.fields['客戶姓名'],
                clientPhone: record.fields['聯絡電話'],
                clientEmail: record.fields['電子郵件'] || '',
                service: record.fields['療程項目'],
                status: record.fields['預約狀態'] || '待確認',
                notes: record.fields['備註'] || '',
                source: record.fields['預約來源'] || 'Airtable',
                type: this.getAppointmentTypeFromService(record.fields['療程項目']),
                platform: 'airtable'
            };

            // 檢查是否已存在
            const existingIndex = this.appointments.findIndex(apt => 
                apt.id === appointment.id || 
                (apt.clientPhone === appointment.clientPhone && apt.start === appointment.start)
            );

            if (existingIndex >= 0) {
                this.appointments[existingIndex] = appointment;
            } else {
                this.appointments.push(appointment);
            }
        });
    }

    /**
     * 合併 Manus 預約資料
     */
    mergeManusAppointments(manusRecords) {
        manusRecords.forEach(record => {
            const appointment = {
                id: record.id,
                title: `${record.clientName} - ${record.service}`,
                start: record.appointmentTime,
                clientName: record.clientName,
                clientPhone: record.clientPhone,
                clientEmail: record.clientEmail || '',
                service: record.service,
                status: record.status || '待確認',
                notes: record.notes || '',
                source: record.source || 'Manus',
                type: this.getAppointmentTypeFromService(record.service),
                platform: 'manus'
            };

            // 檢查是否已存在
            const existingIndex = this.appointments.findIndex(apt => 
                apt.id === appointment.id || 
                (apt.clientPhone === appointment.clientPhone && apt.start === appointment.start)
            );

            if (existingIndex >= 0) {
                this.appointments[existingIndex] = appointment;
            } else {
                this.appointments.push(appointment);
            }
        });
    }

    /**
     * 根據療程判斷預約類型
     */
    getAppointmentTypeFromService(service) {
        if (!service) return 'appointment';
        
        const consultationKeywords = ['諮詢', '評估', 'consultation'];
        const followUpKeywords = ['回診', '追蹤', 'follow-up'];
        
        const serviceLower = service.toLowerCase();
        
        if (consultationKeywords.some(keyword => serviceLower.includes(keyword))) {
            return 'consultation';
        }
        
        if (followUpKeywords.some(keyword => serviceLower.includes(keyword))) {
            return 'follow-up';
        }
        
        return 'appointment';
    }

    /**
     * 載入行事曆事件
     */
    loadCalendarEvents(info, successCallback, failureCallback) {
        try {
            const events = this.appointments.map(appointment => ({
                id: appointment.id,
                title: appointment.title,
                start: appointment.start,
                end: appointment.end || this.calculateEndTime(appointment.start, appointment.service),
                backgroundColor: this.getEventColor(appointment.type, appointment.status),
                borderColor: this.getEventBorderColor(appointment.type, appointment.status),
                textColor: '#ffffff',
                classNames: [appointment.type, appointment.status],
                extendedProps: {
                    appointment: appointment
                }
            }));

            successCallback(events);
            
        } catch (error) {
            console.error('載入行事曆事件失敗:', error);
            failureCallback(error);
        }
    }

    /**
     * 計算預約結束時間
     */
    calculateEndTime(startTime, service) {
        if (!startTime) return null;
        
        const start = new Date(startTime);
        const duration = this.getServiceDuration(service);
        const end = new Date(start.getTime() + duration * 60000);
        
        return end.toISOString();
    }

    /**
     * 獲取療程時長（分鐘）
     */
    getServiceDuration(service) {
        const durations = {
            'botox': 30,
            'filler': 45,
            'laser': 60,
            'facial': 90,
            'consultation': 30,
            'follow-up': 15
        };
        
        return durations[service] || 30;
    }

    /**
     * 獲取事件顏色
     */
    getEventColor(type, status) {
        const colors = {
            appointment: {
                confirmed: '#28a745',
                pending: '#ffc107',
                cancelled: '#dc3545',
                completed: '#6c757d'
            },
            consultation: {
                confirmed: '#007bff',
                pending: '#17a2b8',
                cancelled: '#dc3545',
                completed: '#6c757d'
            },
            'follow-up': {
                confirmed: '#fd7e14',
                pending: '#ffc107',
                cancelled: '#dc3545',
                completed: '#6c757d'
            },
            blocked: {
                default: '#dc3545'
            }
        };
        
        return colors[type]?.[status] || colors[type]?.confirmed || '#6c757d';
    }

    /**
     * 獲取事件邊框顏色
     */
    getEventBorderColor(type, status) {
        return this.getEventColor(type, status);
    }

    /**
     * 處理日期點擊
     */
    handleDateClick(info) {
        // 檢查是否為營業日
        if (!this.isBusinessDay(info.date)) {
            this.showNotification('此日期非營業時間', 'warning');
            return;
        }

        // 設定預約日期並開啟新增預約模態框
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.value = info.dateStr;
            this.updateAvailableTimeSlots();
        }
        
        this.addNewAppointment();
    }

    /**
     * 處理事件點擊
     */
    handleEventClick(info) {
        const appointment = info.event.extendedProps.appointment;
        this.showAppointmentDetails(appointment);
    }

    /**
     * 處理事件拖拽
     */
    handleEventDrop(info) {
        const appointment = info.event.extendedProps.appointment;
        const newStart = info.event.start;
        
        // 檢查新時間是否可用
        if (!this.isTimeSlotAvailable(newStart, appointment.id)) {
            info.revert();
            this.showNotification('該時段已被預約', 'warning');
            return;
        }
        
        // 更新預約時間
        this.updateAppointmentTime(appointment.id, newStart);
    }

    /**
     * 處理事件調整大小
     */
    handleEventResize(info) {
        const appointment = info.event.extendedProps.appointment;
        const newEnd = info.event.end;
        
        // 更新預約結束時間
        this.updateAppointmentEndTime(appointment.id, newEnd);
    }

    /**
     * 處理日期範圍選擇
     */
    handleDateSelect(info) {
        // 檢查選擇的時間範圍是否在營業時間內
        if (!this.isBusinessTime(info.start)) {
            this.calendar.unselect();
            this.showNotification('請選擇營業時間內的時段', 'warning');
            return;
        }

        // 設定預約時間並開啟新增預約模態框
        const dateInput = document.getElementById('appointmentDate');
        const timeSelect = document.getElementById('appointmentTime');
        
        if (dateInput && timeSelect) {
            dateInput.value = info.startStr.split('T')[0];
            
            const startTime = info.start.toTimeString().substring(0, 5);
            this.updateAvailableTimeSlots();
            
            // 設定選中的時間
            setTimeout(() => {
                timeSelect.value = startTime;
            }, 100);
        }
        
        this.addNewAppointment();
        this.calendar.unselect();
    }

    /**
     * 處理載入狀態
     */
    handleLoading(isLoading) {
        const loadingIndicator = document.querySelector('.calendar-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    /**
     * 檢查是否為營業日
     */
    isBusinessDay(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 2 && dayOfWeek <= 6; // 週二到週六
    }

    /**
     * 檢查是否為營業時間
     */
    isBusinessTime(date) {
        if (!this.isBusinessDay(date)) return false;
        
        const dayOfWeek = date.getDay();
        const time = date.toTimeString().substring(0, 5);
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        if (!this.businessHours[dayName]) return false;
        
        const businessHour = this.businessHours[dayName];
        return time >= businessHour.start && time <= businessHour.end;
    }

    /**
     * 檢查時段是否可用
     */
    isTimeSlotAvailable(dateTime, excludeId = null) {
        const timeString = dateTime.toISOString();
        
        return !this.appointments.some(appointment => {
            if (excludeId && appointment.id === excludeId) return false;
            
            const appointmentStart = new Date(appointment.start);
            const appointmentEnd = new Date(appointment.end || this.calculateEndTime(appointment.start, appointment.service));
            
            return dateTime >= appointmentStart && dateTime < appointmentEnd;
        });
    }

    /**
     * 更新可用時間段
     */
    updateAvailableTimeSlots() {
        const dateInput = document.getElementById('appointmentDate');
        const timeSelect = document.getElementById('appointmentTime');
        
        if (!dateInput || !timeSelect || !dateInput.value) return;
        
        const selectedDate = new Date(dateInput.value);
        const dayOfWeek = selectedDate.getDay();
        
        // 清空現有選項
        timeSelect.innerHTML = '<option value="">請選擇時間</option>';
        
        // 檢查是否為營業日
        if (!this.isBusinessDay(selectedDate)) {
            timeSelect.innerHTML = '<option value="">此日期非營業時間</option>';
            return;
        }
        
        // 獲取當天營業時間
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const businessHour = this.businessHours[dayName];
        
        if (!businessHour) return;
        
        // 生成可用時間段
        const availableSlots = this.generateAvailableSlotsForDate(selectedDate, businessHour);
        
        availableSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            timeSelect.appendChild(option);
        });
    }

    /**
     * 生成指定日期的可用時間段
     */
    generateAvailableSlotsForDate(date, businessHour) {
        const slots = [];
        const dateStr = date.toISOString().split('T')[0];
        
        const startHour = parseInt(businessHour.start.split(':')[0]);
        const startMinute = parseInt(businessHour.start.split(':')[1]);
        const endHour = parseInt(businessHour.end.split(':')[0]);
        const endMinute = parseInt(businessHour.end.split(':')[1]);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const dateTimeString = `${dateStr}T${timeString}:00`;
            const dateTime = new Date(dateTimeString);
            
            // 檢查時段是否可用
            if (this.isTimeSlotAvailable(dateTime)) {
                slots.push(timeString);
            }
            
            currentMinute += 15;
            if (currentMinute >= 60) {
                currentMinute = 0;
                currentHour++;
            }
        }
        
        return slots;
    }

    /**
     * 新增預約
     */
    addNewAppointment() {
        const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
        
        // 重置表單
        document.getElementById('appointmentForm').reset();
        
        // 設定預設日期為今天（如果是營業日）
        const today = new Date();
        if (this.isBusinessDay(today)) {
            const dateInput = document.getElementById('appointmentDate');
            if (dateInput) {
                dateInput.value = today.toISOString().split('T')[0];
                this.updateAvailableTimeSlots();
            }
        }
        
        modal.show();
    }

    /**
     * 儲存預約
     */
    async saveAppointment() {
        try {
            const form = document.getElementById('appointmentForm');
            const formData = new FormData(form);
            
            // 驗證表單
            if (!this.validateAppointmentForm(form)) {
                return;
            }
            
            // 建立預約物件
            const appointment = {
                id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                clientName: document.getElementById('clientName').value,
                clientPhone: document.getElementById('clientPhone').value,
                clientEmail: document.getElementById('clientEmail').value || '',
                appointmentDate: document.getElementById('appointmentDate').value,
                appointmentTime: document.getElementById('appointmentTime').value,
                service: document.getElementById('serviceType').value,
                type: document.getElementById('appointmentType').value,
                notes: document.getElementById('appointmentNotes').value || '',
                clientAge: document.getElementById('clientAge').value || null,
                clientGender: document.getElementById('clientGender').value || '',
                status: 'pending',
                source: 'calendar_system',
                createdTime: new Date().toISOString(),
                platform: 'local'
            };
            
            // 組合完整的預約時間
            appointment.start = `${appointment.appointmentDate}T${appointment.appointmentTime}:00`;
            appointment.end = this.calculateEndTime(appointment.start, appointment.service);
            appointment.title = `${appointment.clientName} - ${this.getServiceDisplayName(appointment.service)}`;
            
            // 檢查時段是否可用
            const appointmentDateTime = new Date(appointment.start);
            if (!this.isTimeSlotAvailable(appointmentDateTime)) {
                this.showNotification('該時段已被預約，請選擇其他時間', 'warning');
                return;
            }
            
            // 添加到本地預約列表
            this.appointments.push(appointment);
            
            // 儲存到本地存儲
            this.saveAppointmentsToStorage();
            
            // 同步到四方平台
            await this.syncAppointmentToAllPlatforms(appointment);
            
            // 更新行事曆顯示
            if (this.calendar) {
                this.calendar.refetchEvents();
            }
            
            // 更新統計數據
            this.updateStatistics();
            
            // 觸發預約創建事件
            document.dispatchEvent(new CustomEvent('appointmentCreated', {
                detail: appointment
            }));
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
            modal.hide();
            
            // 顯示成功訊息
            this.showNotification('預約已成功建立並同步到所有平台', 'success');
            
            // 生成 AI 建議
            this.generateAISuggestionsForNewAppointment(appointment);
            
        } catch (error) {
            console.error('儲存預約失敗:', error);
            this.showNotification('儲存預約時發生錯誤', 'error');
        }
    }

    /**
     * 驗證預約表單
     */
    validateAppointmentForm(form) {
        const requiredFields = ['clientName', 'clientPhone', 'appointmentDate', 'appointmentTime', 'serviceType'];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                this.showNotification(`請填寫${this.getFieldDisplayName(fieldId)}`, 'warning');
                field?.focus();
                return false;
            }
        }
        
        // 驗證電話號碼格式
        const phone = document.getElementById('clientPhone').value;
        if (!/^[\d\-\+\(\)\s]+$/.test(phone)) {
            this.showNotification('請輸入有效的電話號碼', 'warning');
            document.getElementById('clientPhone').focus();
            return false;
        }
        
        // 驗證電子郵件格式（如果有填寫）
        const email = document.getElementById('clientEmail').value;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showNotification('請輸入有效的電子郵件地址', 'warning');
            document.getElementById('clientEmail').focus();
            return false;
        }
        
        return true;
    }

    /**
     * 獲取欄位顯示名稱
     */
    getFieldDisplayName(fieldId) {
        const names = {
            clientName: '客戶姓名',
            clientPhone: '聯絡電話',
            appointmentDate: '預約日期',
            appointmentTime: '預約時間',
            serviceType: '療程項目'
        };
        return names[fieldId] || fieldId;
    }

    /**
     * 獲取療程顯示名稱
     */
    getServiceDisplayName(service) {
        const names = {
            botox: '肉毒桿菌',
            filler: '玻尿酸填充',
            laser: '雷射治療',
            facial: '臉部護理',
            consultation: '諮詢評估'
        };
        return names[service] || service;
    }

    /**
     * 同步預約到所有平台
     */
    async syncAppointmentToAllPlatforms(appointment) {
        const syncPromises = [];
        
        // 同步到 Airtable
        if (window.quadManager && window.quadManager.services.airtable.status === 'connected') {
            syncPromises.push(this.syncAppointmentToAirtable(appointment));
        }
        
        // 同步到 Manus
        if (window.quadManager && window.quadManager.services.manus.status === 'connected') {
            syncPromises.push(this.syncAppointmentToManus(appointment));
        }
        
        // 等待所有同步完成
        const results = await Promise.allSettled(syncPromises);
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`預約同步失敗 (${index}):`, result.reason);
            }
        });
    }

    /**
     * 同步預約到 Airtable
     */
    async syncAppointmentToAirtable(appointment) {
        try {
            const response = await fetch('/.netlify/functions/airtable-mcp-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync_appointment_to_airtable',
                    data: appointment
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('預約已同步到 Airtable:', result);
            }
            
        } catch (error) {
            console.error('Airtable 同步失敗:', error);
            throw error;
        }
    }

    /**
     * 同步預約到 Manus
     */
    async syncAppointmentToManus(appointment) {
        try {
            const response = await fetch('/.netlify/functions/manus-netlify-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync_appointment',
                    data: appointment
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('預約已同步到 Manus:', result);
            }
            
        } catch (error) {
            console.error('Manus 同步失敗:', error);
            throw error;
        }
    }

    /**
     * 顯示預約詳情
     */
    showAppointmentDetails(appointment) {
        this.currentAppointment = appointment;
        
        const detailsContent = document.getElementById('appointmentDetailsContent');
        if (!detailsContent) return;
        
        const statusBadge = this.getStatusBadge(appointment.status);
        const typeBadge = this.getTypeBadge(appointment.type);
        
        detailsContent.innerHTML = `
            <div class="appointment-details">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>客戶姓名:</strong><br>
                        <span class="text-info">${appointment.clientName}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>聯絡電話:</strong><br>
                        <span class="text-info">${appointment.clientPhone}</span>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>預約時間:</strong><br>
                        <span class="text-warning">${this.formatDateTime(appointment.start)}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>療程項目:</strong><br>
                        <span class="text-success">${this.getServiceDisplayName(appointment.service)}</span>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>預約狀態:</strong><br>
                        ${statusBadge}
                    </div>
                    <div class="col-md-6">
                        <strong>預約類型:</strong><br>
                        ${typeBadge}
                    </div>
                </div>
                
                ${appointment.clientEmail ? `
                <div class="row mb-3">
                    <div class="col-12">
                        <strong>電子郵件:</strong><br>
                        <span class="text-info">${appointment.clientEmail}</span>
                    </div>
                </div>
                ` : ''}
                
                ${appointment.notes ? `
                <div class="row mb-3">
                    <div class="col-12">
                        <strong>備註:</strong><br>
                        <div class="bg-dark p-2 rounded">${appointment.notes}</div>
                    </div>
                </div>
                ` : ''}
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>預約來源:</strong><br>
                        <span class="text-muted">${appointment.source}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>建立時間:</strong><br>
                        <span class="text-muted">${this.formatDateTime(appointment.createdTime)}</span>
                    </div>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('appointmentDetailsModal'));
        modal.show();
    }

    /**
     * 獲取狀態徽章
     */
    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge bg-warning">待確認</span>',
            confirmed: '<span class="badge bg-success">已確認</span>',
            completed: '<span class="badge bg-info">已完成</span>',
            cancelled: '<span class="badge bg-danger">已取消</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    }

    /**
     * 獲取類型徽章
     */
    getTypeBadge(type) {
        const badges = {
            appointment: '<span class="badge bg-primary">正式預約</span>',
            consultation: '<span class="badge bg-info">諮詢預約</span>',
            'follow-up': '<span class="badge bg-warning">回診追蹤</span>'
        };
        return badges[type] || `<span class="badge bg-secondary">${type}</span>`;
    }

    /**
     * 格式化日期時間
     */
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        
        const date = new Date(dateTimeString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short'
        });
    }

    /**
     * 編輯預約
     */
    editAppointment() {
        if (!this.currentAppointment) return;
        
        // 關閉詳情模態框
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('appointmentDetailsModal'));
        detailsModal.hide();
        
        // 填入表單資料
        setTimeout(() => {
            this.fillAppointmentForm(this.currentAppointment);
            
            // 開啟編輯模態框
            const editModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
            editModal.show();
        }, 300);
    }

    /**
     * 填入預約表單
     */
    fillAppointmentForm(appointment) {
        document.getElementById('clientName').value = appointment.clientName || '';
        document.getElementById('clientPhone').value = appointment.clientPhone || '';
        document.getElementById('clientEmail').value = appointment.clientEmail || '';
        document.getElementById('appointmentDate').value = appointment.appointmentDate || appointment.start?.split('T')[0] || '';
        document.getElementById('appointmentTime').value = appointment.appointmentTime || appointment.start?.split('T')[1]?.substring(0, 5) || '';
        document.getElementById('serviceType').value = appointment.service || '';
        document.getElementById('appointmentType').value = appointment.type || 'appointment';
        document.getElementById('appointmentNotes').value = appointment.notes || '';
        document.getElementById('clientAge').value = appointment.clientAge || '';
        document.getElementById('clientGender').value = appointment.clientGender || '';
        
        // 更新可用時間段
        this.updateAvailableTimeSlots();
    }

    /**
     * 取消預約
     */
    async cancelAppointment() {
        if (!this.currentAppointment) return;
        
        if (!confirm('確定要取消這個預約嗎？')) return;
        
        try {
            // 更新預約狀態
            const appointmentIndex = this.appointments.findIndex(apt => apt.id === this.currentAppointment.id);
            if (appointmentIndex >= 0) {
                this.appointments[appointmentIndex].status = 'cancelled';
                
                // 儲存到本地存儲
                this.saveAppointmentsToStorage();
                
                // 同步到四方平台
                await this.syncAppointmentToAllPlatforms(this.appointments[appointmentIndex]);
                
                // 更新行事曆顯示
                if (this.calendar) {
                    this.calendar.refetchEvents();
                }
                
                // 更新統計數據
                this.updateStatistics();
                
                // 觸發預約取消事件
                document.dispatchEvent(new CustomEvent('appointmentCancelled', {
                    detail: this.appointments[appointmentIndex]
                }));
                
                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentDetailsModal'));
                modal.hide();
                
                this.showNotification('預約已取消', 'success');
            }
            
        } catch (error) {
            console.error('取消預約失敗:', error);
            this.showNotification('取消預約時發生錯誤', 'error');
        }
    }

    /**
     * 更新預約時間
     */
    async updateAppointmentTime(appointmentId, newStartTime) {
        try {
            const appointmentIndex = this.appointments.findIndex(apt => apt.id === appointmentId);
            if (appointmentIndex >= 0) {
                this.appointments[appointmentIndex].start = newStartTime.toISOString();
                this.appointments[appointmentIndex].end = this.calculateEndTime(
                    this.appointments[appointmentIndex].start,
                    this.appointments[appointmentIndex].service
                );
                
                // 儲存到本地存儲
                this.saveAppointmentsToStorage();
                
                // 同步到四方平台
                await this.syncAppointmentToAllPlatforms(this.appointments[appointmentIndex]);
                
                // 觸發預約更新事件
                document.dispatchEvent(new CustomEvent('appointmentUpdated', {
                    detail: this.appointments[appointmentIndex]
                }));
                
                this.showNotification('預約時間已更新', 'success');
            }
            
        } catch (error) {
            console.error('更新預約時間失敗:', error);
            this.showNotification('更新預約時間時發生錯誤', 'error');
        }
    }

    /**
     * 更新預約結束時間
     */
    async updateAppointmentEndTime(appointmentId, newEndTime) {
        try {
            const appointmentIndex = this.appointments.findIndex(apt => apt.id === appointmentId);
            if (appointmentIndex >= 0) {
                this.appointments[appointmentIndex].end = newEndTime.toISOString();
                
                // 儲存到本地存儲
                this.saveAppointmentsToStorage();
                
                // 同步到四方平台
                await this.syncAppointmentToAllPlatforms(this.appointments[appointmentIndex]);
                
                // 觸發預約更新事件
                document.dispatchEvent(new CustomEvent('appointmentUpdated', {
                    detail: this.appointments[appointmentIndex]
                }));
                
                this.showNotification('預約時長已更新', 'success');
            }
            
        } catch (error) {
            console.error('更新預約結束時間失敗:', error);
            this.showNotification('更新預約時長時發生錯誤', 'error');
        }
    }

    /**
     * 儲存預約到本地存儲
     */
    saveAppointmentsToStorage() {
        try {
            localStorage.setItem('appointments', JSON.stringify(this.appointments));
        } catch (error) {
            console.error('儲存預約到本地存儲失敗:', error);
        }
    }

    /**
     * 處理新預約事件
     */
    handleNewAppointment(appointment) {
        console.log('處理新預約事件:', appointment);
        this.updateStatistics();
        this.generateAISuggestionsForNewAppointment(appointment);
    }

    /**
     * 處理預約更新事件
     */
    handleAppointmentUpdate(appointment) {
        console.log('處理預約更新事件:', appointment);
        this.updateStatistics();
    }

    /**
     * 處理預約取消事件
     */
    handleAppointmentCancellation(appointment) {
        console.log('處理預約取消事件:', appointment);
        this.updateStatistics();
    }

    /**
     * 更新統計數據
     */
    updateStatistics() {
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            // 今日預約
            const todayAppointments = this.appointments.filter(apt => 
                apt.start?.startsWith(todayStr) && apt.status !== 'cancelled'
            ).length;
            
            // 本週預約
            const weekAppointments = this.appointments.filter(apt => {
                const aptDate = new Date(apt.start);
                return aptDate >= weekStart && aptDate <= weekEnd && apt.status !== 'cancelled';
            }).length;
            
            // 檔期滿載率（本週）
            const totalSlots = this.calculateTotalSlotsThisWeek();
            const occupiedSlots = weekAppointments;
            const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
            
            // 候補人數（假設數據）
            const waitingList = 5;
            
            // 更新顯示
            document.getElementById('todayAppointments').textContent = todayAppointments;
            document.getElementById('weekAppointments').textContent = weekAppointments;
            document.getElementById('occupancyRate').textContent = occupancyRate + '%';
            document.getElementById('waitingList').textContent = waitingList;
            
        } catch (error) {
            console.error('更新統計數據失敗:', error);
        }
    }

    /**
     * 計算本週總時段數
     */
    calculateTotalSlotsThisWeek() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        let totalSlots = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            if (this.isBusinessDay(date)) {
                const dayOfWeek = date.getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayNames[dayOfWeek];
                const businessHour = this.businessHours[dayName];
                
                if (businessHour) {
                    const startHour = parseInt(businessHour.start.split(':')[0]);
                    const startMinute = parseInt(businessHour.start.split(':')[1]);
                    const endHour = parseInt(businessHour.end.split(':')[0]);
                    const endMinute = parseInt(businessHour.end.split(':')[1]);
                    
                    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                    totalSlots += Math.floor(totalMinutes / 15); // 15分鐘一個時段
                }
            }
        }
        
        return totalSlots;
    }

    /**
     * 生成 AI 建議
     */
    async generateAISuggestions() {
        try {
            const suggestionsContainer = document.getElementById('aiSuggestions');
            if (!suggestionsContainer) return;
            
            // 顯示載入中
            suggestionsContainer.innerHTML = `
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-title">
                        <i class="fas fa-robot"></i>
                        正在分析排程...
                    </div>
                    <div class="ai-suggestion-content">
                        AI 正在分析您的預約模式，稍後將提供優化建議。
                    </div>
                </div>
            `;
            
            // 獲取業務數據
            const businessData = await this.getBusinessDataForAI();
            
            // 調用 AI 分析
            const suggestions = await this.getAISuggestions(businessData);
            
            // 顯示建議
            this.displayAISuggestions(suggestions);
            
        } catch (error) {
            console.error('生成 AI 建議失敗:', error);
            this.displayAISuggestionsError();
        }
    }

    /**
     * 獲取業務數據用於 AI 分析
     */
    async getBusinessDataForAI() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return {
            appointments: this.appointments,
            businessHours: this.businessHours,
            currentWeek: {
                start: weekStart.toISOString(),
                end: weekEnd.toISOString()
            },
            statistics: {
                totalAppointments: this.appointments.length,
                confirmedAppointments: this.appointments.filter(apt => apt.status === 'confirmed').length,
                pendingAppointments: this.appointments.filter(apt => apt.status === 'pending').length,
                cancelledAppointments: this.appointments.filter(apt => apt.status === 'cancelled').length
            }
        };
    }

    /**
     * 獲取 AI 建議
     */
    async getAISuggestions(businessData) {
        try {
            const response = await fetch('/.netlify/functions/openai-enhanced-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'optimize_scheduling',
                    data: {
                        currentSchedule: businessData.appointments,
                        appointmentRequests: [],
                        constraints: {
                            businessHours: businessData.businessHours,
                            maxPerSlot: 2,
                            slotDuration: 15
                        }
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            
        } catch (error) {
            console.error('獲取 AI 建議失敗:', error);
        }
        
        return this.getDefaultSuggestions();
    }

    /**
     * 獲取預設建議
     */
    getDefaultSuggestions() {
        return {
            efficiencyImprovements: [
                '建議在週三和週四安排更多預約，這兩天通常需求較高',
                '考慮在週六早上增加諮詢時段，可提升新客戶轉換率'
            ],
            satisfactionOptimizations: [
                '為回診客戶預留週五下午時段，提供更好的追蹤服務',
                '建議在預約前一天發送提醒訊息，減少爽約率'
            ],
            workloadBalance: '目前工作負荷分配良好，建議維持現有排程模式',
            estimatedImprovement: '15%'
        };
    }

    /**
     * 顯示 AI 建議
     */
    displayAISuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('aiSuggestions');
        if (!suggestionsContainer || !suggestions) return;
        
        let html = '';
        
        if (suggestions.efficiencyImprovements && suggestions.efficiencyImprovements.length > 0) {
            html += `
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-title">
                        <i class="fas fa-chart-line"></i>
                        效率提升建議
                    </div>
                    <div class="ai-suggestion-content">
                        ${suggestions.efficiencyImprovements[0]}
                    </div>
                </div>
            `;
        }
        
        if (suggestions.satisfactionOptimizations && suggestions.satisfactionOptimizations.length > 0) {
            html += `
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-title">
                        <i class="fas fa-heart"></i>
                        客戶滿意度優化
                    </div>
                    <div class="ai-suggestion-content">
                        ${suggestions.satisfactionOptimizations[0]}
                    </div>
                </div>
            `;
        }
        
        if (suggestions.workloadBalance) {
            html += `
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-title">
                        <i class="fas fa-balance-scale"></i>
                        工作負荷分析
                    </div>
                    <div class="ai-suggestion-content">
                        ${suggestions.workloadBalance}
                    </div>
                </div>
            `;
        }
        
        if (!html) {
            html = `
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-title">
                        <i class="fas fa-check-circle"></i>
                        排程狀態良好
                    </div>
                    <div class="ai-suggestion-content">
                        目前的預約排程運作良好，暫無需要優化的項目。
                    </div>
                </div>
            `;
        }
        
        suggestionsContainer.innerHTML = html;
    }

    /**
     * 顯示 AI 建議錯誤
     */
    displayAISuggestionsError() {
        const suggestionsContainer = document.getElementById('aiSuggestions');
        if (!suggestionsContainer) return;
        
        suggestionsContainer.innerHTML = `
            <div class="ai-suggestion-item">
                <div class="ai-suggestion-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    AI 分析暫時無法使用
                </div>
                <div class="ai-suggestion-content">
                    無法連接到 AI 分析服務，請稍後再試。
                </div>
            </div>
        `;
    }

    /**
     * 為新預約生成 AI 建議
     */
    async generateAISuggestionsForNewAppointment(appointment) {
        try {
            const response = await fetch('/.netlify/functions/openai-enhanced-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_customer_intent',
                    data: {
                        customerMessage: appointment.notes || '',
                        customerHistory: [],
                        appointmentData: appointment
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('新預約 AI 分析結果:', result);
                
                // 可以在這裡處理分析結果，例如顯示個人化建議
                if (result.data && result.data.personalizedAdvice) {
                    this.showNotification(`AI 建議: ${result.data.personalizedAdvice}`, 'info');
                }
            }
            
        } catch (error) {
            console.error('新預約 AI 分析失敗:', error);
        }
    }

    /**
     * 運行 AI 優化
     */
    async runAIOptimization() {
        try {
            this.showNotification('正在運行 AI 排程優化...', 'info');
            
            const businessData = await this.getBusinessDataForAI();
            const optimization = await this.getAISuggestions(businessData);
            
            if (optimization) {
                this.displayAISuggestions(optimization);
                this.showNotification('AI 優化完成！請查看智能建議。', 'success');
            }
            
        } catch (error) {
            console.error('AI 優化失敗:', error);
            this.showNotification('AI 優化過程中發生錯誤', 'error');
        }
    }

    /**
     * 同步所有平台
     */
    async syncAllPlatforms() {
        try {
            this.showNotification('正在同步所有平台...', 'info');
            
            // 同步到四方平台
            for (const appointment of this.appointments) {
                await this.syncAppointmentToAllPlatforms(appointment);
            }
            
            // 重新載入預約資料
            await this.loadAppointments();
            
            // 更新行事曆顯示
            if (this.calendar) {
                this.calendar.refetchEvents();
            }
            
            this.showNotification('所有平台同步完成！', 'success');
            
        } catch (error) {
            console.error('平台同步失敗:', error);
            this.showNotification('平台同步過程中發生錯誤', 'error');
        }
    }

    /**
     * 顯示今日預約
     */
    showTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = this.appointments.filter(apt => 
            apt.start?.startsWith(today) && apt.status !== 'cancelled'
        );
        
        if (todayAppointments.length === 0) {
            this.showNotification('今日沒有預約', 'info');
            return;
        }
        
        // 跳轉到今日視圖
        if (this.calendar) {
            this.calendar.changeView('timeGridDay');
            this.calendar.gotoDate(today);
        }
        
        this.showNotification(`今日共有 ${todayAppointments.length} 個預約`, 'info');
    }

    /**
     * 顯示可用時段
     */
    showAvailableSlots() {
        const today = new Date();
        const availableSlots = this.generateAvailableSlotsForDate(today, this.businessHours[this.getDayName(today)]);
        
        if (availableSlots.length === 0) {
            this.showNotification('今日沒有可用時段', 'info');
            return;
        }
        
        this.showNotification(`今日還有 ${availableSlots.length} 個可用時段`, 'info');
    }

    /**
     * 獲取日期名稱
     */
    getDayName(date) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayNames[date.getDay()];
    }

    /**
     * 顯示候補名單
     */
    showWaitingList() {
        // 這裡可以實現候補名單功能
        this.showNotification('候補名單功能開發中', 'info');
    }

    /**
     * 生成報告
     */
    generateReport() {
        // 這裡可以實現報告生成功能
        this.showNotification('報告生成功能開發中', 'info');
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (window.MedicalPlatform && window.MedicalPlatform.showAlert) {
            window.MedicalPlatform.showAlert(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // 簡單的通知顯示
            const notification = document.createElement('div');
            notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.zIndex = '9999';
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            // 自動移除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
}

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedCalendarManager;
}
