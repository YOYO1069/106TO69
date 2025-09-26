// appointment_manager.js - 預約管理功能

// 預約管理器
const appointmentManager = {
    // 建立新預約
    createAppointment: async function(appointmentData) {
        try {
            // 驗證預約資料
            if (!this.validateAppointmentData(appointmentData)) {
                throw new Error('預約資料不完整或無效');
            }

            // 檢查時段可用性
            if (!this.isSlotAvailable(appointmentData.date, appointmentData.time, appointmentData.peopleCount)) {
                throw new Error('選擇的時段已滿或不可用');
            }

            // 建立 Google Calendar 事件
            const event = await this.createGoogleCalendarEvent(appointmentData);
            
            // 更新本地記錄
            const appointment = {
                id: event.id,
                patientName: appointmentData.patientName,
                patientPhone: appointmentData.patientPhone,
                date: appointmentData.date,
                time: appointmentData.time,
                duration: appointmentData.duration || 60,
                type: appointmentData.type,
                peopleCount: appointmentData.peopleCount,
                treatment: appointmentData.treatment || '諮詢',
                notes: appointmentData.notes || '',
                status: 'scheduled',
                createdAt: new Date().toISOString()
            };

            // 加入到當前預約列表
            currentTreatments.push(appointment);
            
            // 更新顯示
            calendarView.render();
            updateTodaySummary();
            
            // 記錄日誌
            logToCalendar(`已建立預約：${appointmentData.patientName} - ${appointmentData.date} ${appointmentData.time}`);
            
            return appointment;

        } catch (error) {
            console.error('建立預約時發生錯誤:', error);
            logToCalendar(`建立預約失敗：${error.message}`);
            throw error;
        }
    },

    // 建立 Google Calendar 事件
    createGoogleCalendarEvent: async function(appointmentData) {
        const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (appointmentData.duration || 60) * 60000);

        const event = {
            'summary': `${appointmentData.patientName} - ${appointmentData.treatment || '諮詢'}`,
            'description': `
預約類型：${APPOINTMENT_CONFIG.appointmentTypes[appointmentData.type]?.name || appointmentData.type}
人數：${appointmentData.peopleCount}人
聯絡電話：${appointmentData.patientPhone}
備註：${appointmentData.notes || '無'}
            `.trim(),
            'start': {
                'dateTime': startDateTime.toISOString(),
                'timeZone': 'Asia/Taipei'
            },
            'end': {
                'dateTime': endDateTime.toISOString(),
                'timeZone': 'Asia/Taipei'
            },
            'attendees': [
                {
                    'email': appointmentData.patientEmail || '',
                    'displayName': appointmentData.patientName
                }
            ],
            'reminders': {
                'useDefault': false,
                'overrides': [
                    {'method': 'popup', 'minutes': 60},
                    {'method': 'popup', 'minutes': 15}
                ]
            }
        };

        const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });

        const response = await request;
        return response.result;
    },

    // 驗證預約資料
    validateAppointmentData: function(data) {
        const required = ['patientName', 'patientPhone', 'date', 'time', 'type', 'peopleCount'];
        
        for (const field of required) {
            if (!data[field]) {
                console.error(`缺少必要欄位：${field}`);
                return false;
            }
        }

        // 驗證預約類型
        if (!APPOINTMENT_CONFIG.appointmentTypes[data.type]) {
            console.error(`無效的預約類型：${data.type}`);
            return false;
        }

        // 驗證人數
        const maxPeople = APPOINTMENT_CONFIG.appointmentTypes[data.type].maxPeople;
        if (data.peopleCount > maxPeople) {
            console.error(`人數超過限制：${data.peopleCount} > ${maxPeople}`);
            return false;
        }

        // 驗證日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            console.error(`無效的日期格式：${data.date}`);
            return false;
        }

        // 驗證時間格式
        if (!/^\d{2}:\d{2}$/.test(data.time)) {
            console.error(`無效的時間格式：${data.time}`);
            return false;
        }

        return true;
    },

    // 檢查時段可用性
    isSlotAvailable: function(date, time, peopleCount) {
        const dayOfWeek = new Date(date).getDay();
        
        // 檢查是否為營業日
        if (!CLINIC_SCHEDULE[dayOfWeek]) {
            return false;
        }

        // 檢查時間是否在營業時間內
        const schedule = CLINIC_SCHEDULE[dayOfWeek];
        const appointmentTime = parseTime(time);
        const startTime = parseTime(schedule.start);
        const endTime = parseTime(schedule.end);

        if (appointmentTime < startTime || appointmentTime >= endTime) {
            return false;
        }

        // 檢查該時段的預約數量
        const existingAppointments = currentTreatments.filter(apt => 
            apt.date === date && apt.time === time
        );

        const totalBooked = existingAppointments.reduce((sum, apt) => sum + (apt.peopleCount || 1), 0);
        
        return (totalBooked + peopleCount) <= APPOINTMENT_CONFIG.maxPeoplePerSlot;
    },

    // 更新預約
    updateAppointment: async function(appointmentId, updateData) {
        try {
            // 找到本地預約記錄
            const appointmentIndex = currentTreatments.findIndex(apt => apt.id === appointmentId);
            if (appointmentIndex === -1) {
                throw new Error('找不到預約記錄');
            }

            const appointment = currentTreatments[appointmentIndex];
            
            // 更新 Google Calendar 事件
            await this.updateGoogleCalendarEvent(appointmentId, updateData);
            
            // 更新本地記錄
            Object.assign(appointment, updateData, {
                updatedAt: new Date().toISOString()
            });

            // 更新顯示
            calendarView.render();
            updateTodaySummary();
            
            logToCalendar(`已更新預約：${appointment.patientName}`);
            
            return appointment;

        } catch (error) {
            console.error('更新預約時發生錯誤:', error);
            logToCalendar(`更新預約失敗：${error.message}`);
            throw error;
        }
    },

    // 更新 Google Calendar 事件
    updateGoogleCalendarEvent: async function(eventId, updateData) {
        const request = gapi.client.calendar.events.patch({
            'calendarId': 'primary',
            'eventId': eventId,
            'resource': updateData
        });

        const response = await request;
        return response.result;
    },

    // 取消預約
    cancelAppointment: async function(appointmentId) {
        try {
            // 找到本地預約記錄
            const appointmentIndex = currentTreatments.findIndex(apt => apt.id === appointmentId);
            if (appointmentIndex === -1) {
                throw new Error('找不到預約記錄');
            }

            const appointment = currentTreatments[appointmentIndex];
            
            // 刪除 Google Calendar 事件
            await this.deleteGoogleCalendarEvent(appointmentId);
            
            // 從本地記錄中移除
            currentTreatments.splice(appointmentIndex, 1);

            // 更新顯示
            calendarView.render();
            updateTodaySummary();
            
            logToCalendar(`已取消預約：${appointment.patientName}`);
            
            return true;

        } catch (error) {
            console.error('取消預約時發生錯誤:', error);
            logToCalendar(`取消預約失敗：${error.message}`);
            throw error;
        }
    },

    // 刪除 Google Calendar 事件
    deleteGoogleCalendarEvent: async function(eventId) {
        const request = gapi.client.calendar.events.delete({
            'calendarId': 'primary',
            'eventId': eventId
        });

        await request;
    },

    // 獲取預約詳情
    getAppointmentDetails: function(appointmentId) {
        return currentTreatments.find(apt => apt.id === appointmentId);
    },

    // 搜尋預約
    searchAppointments: function(searchTerm) {
        const term = searchTerm.toLowerCase();
        return currentTreatments.filter(apt => 
            apt.patientName.toLowerCase().includes(term) ||
            apt.patientPhone.includes(term) ||
            apt.treatment.toLowerCase().includes(term)
        );
    }
};

// 預約表單處理
function handleAppointmentForm() {
    const form = document.getElementById('calendarAppointmentForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const appointmentData = {
            patientName: formData.get('patientName'),
            patientPhone: formData.get('patientPhone'),
            patientEmail: formData.get('patientEmail') || '',
            date: formData.get('appointmentDate'),
            time: formData.get('appointmentTime'),
            duration: parseInt(formData.get('appointmentDuration')) || 60,
            type: formData.get('appointmentType'),
            peopleCount: parseInt(formData.get('peopleCount')) || 1,
            treatment: formData.get('treatment') || '諮詢',
            notes: formData.get('notes') || ''
        };

        try {
            // 顯示載入狀態
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '建立中...';
            submitBtn.disabled = true;

            // 建立預約
            await appointmentManager.createAppointment(appointmentData);
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('calendarAppointmentModal'));
            modal.hide();
            
            // 重置表單
            form.reset();
            
            // 顯示成功訊息
            showNotification('預約建立成功！', 'success');

        } catch (error) {
            showNotification(`預約建立失敗：${error.message}`, 'error');
        } finally {
            // 恢復按鈕狀態
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 建立通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
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

// 初始化預約表單處理
document.addEventListener('DOMContentLoaded', function() {
    handleAppointmentForm();
});
