// calendar_integration.js - 診所行事曆整合功能

// 診所營業時間配置
const CLINIC_SCHEDULE = {
    // 週二到週五: 12:00-20:00
    2: { start: '12:00', end: '20:00' }, // 週二
    3: { start: '12:00', end: '20:00' }, // 週三
    4: { start: '12:00', end: '20:00' }, // 週四
    5: { start: '12:00', end: '20:00' }, // 週五
    // 週六: 11:00-20:00
    6: { start: '11:00', end: '20:00' }, // 週六
    // 週日、週一休診
    0: null, // 週日
    1: null  // 週一
};

// 預約時段配置
const APPOINTMENT_CONFIG = {
    slotDuration: 15, // 15分鐘間隔
    maxPeoplePerSlot: 2, // 每時段最多2人
    appointmentTypes: {
        'single': { name: '單人預約', maxPeople: 1 },
        'double': { name: '雙人預約', maxPeople: 2 },
        'consultation': { name: '諮詢預約', maxPeople: 1 },
        'friends': { name: '朋友相約', maxPeople: 2 }
    }
};

// 生成可用時段
function generateTimeSlots(date) {
    const dayOfWeek = new Date(date).getDay();
    const schedule = CLINIC_SCHEDULE[dayOfWeek];
    
    if (!schedule) {
        return []; // 休診日
    }
    
    const slots = [];
    const startTime = parseTime(schedule.start);
    const endTime = parseTime(schedule.end);
    
    for (let time = startTime; time < endTime; time += APPOINTMENT_CONFIG.slotDuration) {
        const timeStr = formatTime(time);
        slots.push({
            time: timeStr,
            available: true,
            bookedCount: 0,
            maxCapacity: APPOINTMENT_CONFIG.maxPeoplePerSlot
        });
    }
    
    return slots;
}

// 解析時間字串為分鐘數
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 將分鐘數格式化為時間字串
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 行事曆檢視管理
const calendarView = {
    viewMode: 'month',
    currentDate: new Date(),
    selectedDate: null,

    render: function() {
        this.updateTitle();
        if (this.viewMode === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
        this.updateAvailableSlots();
    },

    updateTitle: function() {
        const titleElement = document.getElementById('calendarTitle');
        if (titleElement) {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1;
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                              '七月', '八月', '九月', '十月', '十一月', '十二月'];
            titleElement.textContent = `${year}年 ${monthNames[month - 1]}`;
        }
    },

    renderMonthView: function() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = `
            <div class="calendar-month">
                <div class="calendar-header">
                    <div class="calendar-day-header">日</div>
                    <div class="calendar-day-header">一</div>
                    <div class="calendar-day-header">二</div>
                    <div class="calendar-day-header">三</div>
                    <div class="calendar-day-header">四</div>
                    <div class="calendar-day-header">五</div>
                    <div class="calendar-day-header">六</div>
                </div>
                <div class="calendar-body">
        `;

        for (let week = 0; week < 6; week++) {
            html += '<div class="calendar-week">';
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + week * 7 + day);
                
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isToday(currentDate);
                const isSelected = this.isSelected(currentDate);
                const hasSchedule = this.hasSchedule(currentDate);
                const appointmentCount = this.getAppointmentCount(currentDate);

                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                if (isSelected) dayClass += ' selected';
                if (hasSchedule) dayClass += ' has-schedule';

                html += `
                    <div class="${dayClass}" onclick="calendarView.selectDate('${currentDate.toISOString().split('T')[0]}')">
                        <div class="day-number">${currentDate.getDate()}</div>
                        ${appointmentCount > 0 ? `<div class="appointment-count">${appointmentCount}</div>` : ''}
                    </div>
                `;
            }
            html += '</div>';
        }

        html += '</div></div>';
        calendarGrid.innerHTML = html;
    },

    renderWeekView: function() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        // 週檢視實作
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

        let html = '<div class="calendar-week-view">';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            const dayName = ['日', '一', '二', '三', '四', '五', '六'][i];
            const hasSchedule = this.hasSchedule(date);
            const appointments = this.getAppointmentsForDate(date);

            html += `
                <div class="week-day ${hasSchedule ? 'has-schedule' : ''}">
                    <div class="week-day-header">
                        <div class="day-name">${dayName}</div>
                        <div class="day-date">${date.getDate()}</div>
                    </div>
                    <div class="week-day-appointments">
            `;

            appointments.forEach(appointment => {
                html += `
                    <div class="week-appointment">
                        <div class="appointment-time">${appointment.time}</div>
                        <div class="appointment-patient">${appointment.patientName}</div>
                    </div>
                `;
            });

            html += '</div></div>';
        }

        html += '</div>';
        calendarGrid.innerHTML = html;
    },

    selectDate: function(dateStr) {
        this.selectedDate = dateStr;
        this.render();
        this.updateAvailableSlots();
        
        // 更新預約表單的日期
        const appointmentDateInput = document.getElementById('appointmentDate');
        if (appointmentDateInput) {
            appointmentDateInput.value = dateStr;
        }
    },

    updateAvailableSlots: function() {
        const availableSlotsContainer = document.getElementById('availableSlots');
        if (!availableSlotsContainer || !this.selectedDate) return;

        const slots = generateTimeSlots(this.selectedDate);
        const existingAppointments = this.getAppointmentsForDate(this.selectedDate);

        // 更新時段可用性
        slots.forEach(slot => {
            const bookedCount = existingAppointments.filter(apt => apt.time === slot.time).length;
            slot.bookedCount = bookedCount;
            slot.available = bookedCount < slot.maxCapacity;
        });

        let html = `
            <div class="slots-header">
                <h6>${this.selectedDate} 可用時段</h6>
            </div>
            <div class="slots-grid">
        `;

        if (slots.length === 0) {
            html += '<div class="text-center p-3 text-muted">此日期為休診日</div>';
        } else {
            slots.forEach(slot => {
                const statusClass = slot.available ? 'available' : 'full';
                const statusText = slot.available ? `可預約 (${slot.maxCapacity - slot.bookedCount}/${slot.maxCapacity})` : '已滿';
                
                html += `
                    <div class="time-slot ${statusClass}" onclick="${slot.available ? `openAppointmentModal('${slot.time}')` : ''}">
                        <div class="slot-time">${slot.time}</div>
                        <div class="slot-status">${statusText}</div>
                    </div>
                `;
            });
        }

        html += '</div>';
        availableSlotsContainer.innerHTML = html;
    },

    previousPeriod: function() {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        }
        this.render();
    },

    nextPeriod: function() {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        }
        this.render();
    },

    goToToday: function() {
        this.currentDate = new Date();
        this.render();
    },

    isToday: function(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },

    isSelected: function(date) {
        if (!this.selectedDate) return false;
        return date.toISOString().split('T')[0] === this.selectedDate;
    },

    hasSchedule: function(date) {
        const dayOfWeek = date.getDay();
        return CLINIC_SCHEDULE[dayOfWeek] !== null;
    },

    getAppointmentCount: function(date) {
        const appointments = this.getAppointmentsForDate(date);
        return appointments.length;
    },

    getAppointmentsForDate: function(date) {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return currentTreatments.filter(treatment => treatment.date === dateStr);
    }
};

// 預約模態框管理
function openAppointmentModal(time) {
    const modal = new bootstrap.Modal(document.getElementById('calendarAppointmentModal'));
    
    // 設定預約時間
    const appointmentTimeSelect = document.getElementById('appointmentTime');
    if (appointmentTimeSelect) {
        // 清空並重新填充時間選項
        appointmentTimeSelect.innerHTML = '<option value="">請選擇時間</option>';
        
        const slots = generateTimeSlots(calendarView.selectedDate);
        slots.forEach(slot => {
            if (slot.available) {
                const option = document.createElement('option');
                option.value = slot.time;
                option.textContent = slot.time;
                if (slot.time === time) {
                    option.selected = true;
                }
                appointmentTimeSelect.appendChild(option);
            }
        });
    }
    
    modal.show();
}

// 更新今日摘要
function updateTodaySummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = calendarView.getAppointmentsForDate(today);
    const availableSlots = generateTimeSlots(today).filter(slot => slot.available);

    // 更新統計數據
    const elements = {
        'todayTotalAppointments': todayAppointments.length,
        'todayCompletedAppointments': todayAppointments.filter(apt => apt.status === 'completed').length,
        'todayPendingAppointments': todayAppointments.filter(apt => apt.status === 'scheduled').length,
        'todayAvailableSlots': availableSlots.length
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// 匯出今日排程
function exportTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = calendarView.getAppointmentsForDate(today);
    
    if (todayAppointments.length === 0) {
        alert('今日沒有預約記錄');
        return;
    }

    let csvContent = "時間,患者姓名,療程,狀態\n";
    todayAppointments.forEach(appointment => {
        csvContent += `${appointment.time},${appointment.patientName},${appointment.treatment},${appointment.status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `今日排程_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 初始化行事曆檢視
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calendarGrid')) {
        calendarView.render();
    }
});
