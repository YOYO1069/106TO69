// google_calendar.js

const CLIENT_ID = '519705406951-rbdhk7l6et1vd1u83nv49hn1f53bjski.apps.googleusercontent.com'; // TODO: Replace with your client ID
const API_KEY = 'AQ.Ab8RN6I5kcSFUIuQWRPPIoXMBuNvLE8APGXxxM_H4tlqBidyqQ';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.addEventListener('DOMContentLoaded', function() {
    gapiLoaded();
    gisLoaded();
});

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('calendarSignIn').style.display = 'block';
    }
}

const googleCalendar = {
    signIn: function() {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            document.getElementById('calendarSignOut').style.display = 'block';
            document.getElementById('calendarSignIn').style.display = 'none';
            document.getElementById('calendarStatus').classList.remove('alert-warning');
            document.getElementById('calendarStatus').classList.add('alert-success');
            document.getElementById('calendarStatus').innerHTML = '<i class="fas fa-check-circle text-success me-2"></i>已成功連接Google日曆';
            await appointmentSync.syncFromGoogle();
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
    },

    signOut: function() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            document.getElementById('calendarSignIn').style.display = 'block';
            document.getElementById('calendarSignOut').style.display = 'none';
            document.getElementById('calendarStatus').classList.add('alert-warning');
            document.getElementById('calendarStatus').classList.remove('alert-success');
            document.getElementById('calendarStatus').innerHTML = '<i class="fas fa-exclamation-circle text-warning me-2"></i>請連接Google日曆以使用排程功能';
        }
    }
};




const appointmentSync = {
    syncFromGoogle: async function() {
        try {
            const response = await gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 100,
                'orderBy': 'startTime'
            });

            const events = response.result.items;
            if (!events || events.length === 0) {
                console.log('No upcoming events found.');
                logToCalendar('未找到即將到來的預約。');
                return;
            }

            currentTreatments = [];
            events.forEach(event => {
                const start = event.start.dateTime || event.start.date;
                const summaryParts = event.summary.split(' - ');
                const patientName = summaryParts[0];
                const treatmentName = summaryParts.length > 1 ? summaryParts[1] : '諮詢';

                currentTreatments.push({
                    id: event.id,
                    patientName: patientName,
                    treatment: treatmentName,
                    date: start.substring(0, 10),
                    time: start.substring(11, 16),
                    status: 'scheduled'
                });
            });

            calendarView.render();
            updateTodaySummary();
            logToCalendar('已成功從Google日曆同步預約。');

        } catch (error) {
            console.error('Error syncing from Google Calendar:', error);
            logToCalendar('從Google日曆同步時發生錯誤。');
        }
    }
};

function logToCalendar(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    const calendarLog = document.getElementById('calendarLog');
    if(calendarLog){
        calendarLog.appendChild(logEntry);
        calendarLog.scrollTop = calendarLog.scrollHeight;
    }
}


const calendarView = {
    viewMode: 'month', // month or week
    currentDate: new Date(),

    render: function() {
        if (this.viewMode === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
        updateTodaySummary();
    },

    renderMonthView: function() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        // ... (Implementation for month view)
    },

    renderWeekView: function() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        // ... (Implementation for week view)
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

    selectDate: function(dateStr) {
        // ... (Implementation for selecting a date)
    }
};

function updateTodaySummary() {
    // ... (Implementation for updating today's summary)
}

function exportTodaySchedule() {
    // ... (Implementation for exporting today's schedule)
}

