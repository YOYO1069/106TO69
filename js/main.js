// 劉道玄醫美管理平台 - 主要功能

// 全域變數
let currentUser = null;
let systemConfig = {
    apiBaseUrl: '/api',
    version: '1.0.0',
    debug: true
};

// 用戶角色定義
const USER_ROLES = {
    ADMIN: { id: 'admin', name: '系統管理員', level: 1 },
    PARTNER: { id: 'partner', name: '合作夥伴', level: 2 },
    DOCTOR: { id: 'doctor', name: '醫師', level: 3 },
    STAFF: { id: 'staff', name: '員工', level: 4 }
};

// 預設帳號密碼
const DEFAULT_ACCOUNTS = {
    'admin': { password: 'admin123', role: USER_ROLES.ADMIN },
    'partner': { password: 'partner123', role: USER_ROLES.PARTNER },
    'doctor': { password: 'doctor123', role: USER_ROLES.DOCTOR },
    'staff': { password: 'staff123', role: USER_ROLES.STAFF }
};

// 初始化系統
function initializeSystem() {
    console.log('劉道玄醫美管理平台初始化...');
    
    // 檢查登入狀態
    checkLoginStatus();
    
    // 初始化事件監聽器
    initializeEventListeners();
    
    // 載入系統配置
    loadSystemConfig();
    
    console.log('系統初始化完成');
}

// 檢查登入狀態
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
}

// 更新已登入用戶的UI
function updateUIForLoggedInUser() {
    if (!currentUser) return;
    
    // 更新導航列用戶資訊
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <span class="user-name">${currentUser.role.name}</span>
            <span class="user-role">(${currentUser.username})</span>
        `;
    }
    
    // 根據用戶角色顯示/隱藏功能
    updateUIByRole(currentUser.role);
}

// 根據用戶角色更新UI
function updateUIByRole(role) {
    const restrictedElements = document.querySelectorAll('[data-role-required]');
    
    restrictedElements.forEach(element => {
        const requiredRole = element.getAttribute('data-role-required');
        const requiredLevel = USER_ROLES[requiredRole]?.level || 999;
        
        if (role.level <= requiredLevel) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    });
}

// 初始化事件監聽器
function initializeEventListeners() {
    // 模組卡片點擊事件
    document.addEventListener('click', function(e) {
        const moduleCard = e.target.closest('.module-card');
        if (moduleCard) {
            const cardType = getCardType(moduleCard);
            if (cardType) {
                navigateToModule(cardType);
            }
        }
    });
    
    // 快速操作按鈕
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="quickAction"]')) {
            e.preventDefault();
            const action = e.target.getAttribute('onclick').match(/quickAction\('(.+?)'\)/)[1];
            quickAction(action);
        }
    });
    
    // 登出按鈕
    const logoutBtn = document.querySelector('[onclick="logout()"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// 獲取卡片類型
function getCardType(card) {
    if (card.classList.contains('appointment')) return 'appointment';
    if (card.classList.contains('medical-records')) return 'medical-records';
    if (card.classList.contains('consent-forms')) return 'consent-forms';
    if (card.classList.contains('performance')) return 'performance';
    return null;
}

// 導航到模組
function navigateToModule(moduleType) {
    // 檢查權限
    if (!checkModulePermission(moduleType)) {
        showAlert('您沒有權限存取此功能', 'warning');
        return;
    }
    
    const moduleUrls = {
        'appointment': 'appointment_scheduling_system.html',
        'medical-records': 'medical_records.html',
        'consent-forms': 'consent_forms.html',
        'performance': 'performance_management.html',
        'smart-scheduling': 'smart_scheduling.html',
        'price-management': 'price_management.html'
    };
    
    const url = moduleUrls[moduleType];
    if (url) {
        // 添加載入動畫
        showLoadingOverlay();
        
        // 延遲導航以顯示動畫效果
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    } else {
        showAlert('功能開發中，敬請期待！', 'info');
    }
}

// 檢查模組權限
function checkModulePermission(moduleType) {
    if (!currentUser) {
        // 如果未登入，導向登入頁面
        showLoginModal();
        return false;
    }
    
    // 根據用戶角色檢查權限
    const rolePermissions = {
        'admin': ['appointment', 'medical-records', 'consent-forms', 'performance', 'smart-scheduling', 'price-management'],
        'partner': ['appointment', 'performance'],
        'doctor': ['appointment', 'medical-records', 'consent-forms'],
        'staff': ['appointment', 'medical-records', 'consent-forms']
    };
    
    const userPermissions = rolePermissions[currentUser.role.id] || [];
    return userPermissions.includes(moduleType);
}

// 快速操作
function quickAction(action) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    switch (action) {
        case 'new-appointment':
            navigateToModule('appointment');
            break;
        case 'new-record':
            navigateToModule('medical-records');
            break;
        case 'daily-report':
            generateDailyReport();
            break;
        case 'emergency':
            handleEmergency();
            break;
        default:
            showAlert('功能開發中', 'info');
    }
}

// 生成日報表
function generateDailyReport() {
    showLoadingOverlay();
    
    // 模擬API調用
    setTimeout(() => {
        hideLoadingOverlay();
        
        const reportData = {
            date: new Date().toLocaleDateString('zh-TW'),
            appointments: Math.floor(Math.random() * 20) + 5,
            revenue: Math.floor(Math.random() * 100000) + 50000,
            newPatients: Math.floor(Math.random() * 10) + 2
        };
        
        showReportModal(reportData);
    }, 2000);
}

// 處理緊急情況
function handleEmergency() {
    const emergencyActions = [
        '聯繫值班醫師',
        '啟動緊急預案',
        '通知相關人員',
        '記錄緊急事件'
    ];
    
    showAlert(`緊急處理程序已啟動：\n${emergencyActions.join('\n')}`, 'danger');
}

// 登入功能
function login(username, password) {
    const account = DEFAULT_ACCOUNTS[username];
    
    if (account && account.password === password) {
        currentUser = {
            username: username,
            role: account.role,
            loginTime: new Date().toISOString()
        };
        
        // 保存登入狀態
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新UI
        updateUIForLoggedInUser();
        
        // 顯示成功訊息
        showAlert(`歡迎回來，${account.role.name}！`, 'success');
        
        // 隱藏登入模態框
        hideLoginModal();
        
        return true;
    } else {
        showAlert('帳號或密碼錯誤', 'danger');
        return false;
    }
}

// 登出功能
function logout() {
    if (confirm('確定要登出系統嗎？')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // 重新載入頁面
        window.location.reload();
    }
}

// 顯示登入模態框
function showLoginModal() {
    const modalHtml = `
        <div class="modal fade" id="loginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">系統登入</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="username" class="form-label">帳號</label>
                                <input type="text" class="form-control" id="username" required>
                                <div class="form-text">
                                    測試帳號: admin, partner, doctor, staff
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">密碼</label>
                                <input type="password" class="form-control" id="password" required>
                                <div class="form-text">
                                    密碼格式: [帳號]123 (例如: admin123)
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" onclick="handleLogin()">登入</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除現有的模態框
    const existingModal = document.getElementById('loginModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加新的模態框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 顯示模態框
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

// 處理登入
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (login(username, password)) {
        // 登入成功，模態框會自動隱藏
    }
}

// 隱藏登入模態框
function hideLoginModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (modal) {
        modal.hide();
    }
}

// 顯示載入覆蓋層
function showLoadingOverlay() {
    const overlayHtml = `
        <div id="loadingOverlay" class="loading-overlay">
            <div class="loading-content">
                <div class="loading"></div>
                <p>載入中...</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', overlayHtml);
}

// 隱藏載入覆蓋層
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// 顯示警告訊息
function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // 自動隱藏
    setTimeout(() => {
        const alert = document.querySelector('.alert:last-of-type');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// 顯示報表模態框
function showReportModal(data) {
    const modalHtml = `
        <div class="modal fade" id="reportModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-bar"></i>
                            日報表 - ${data.date}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h3 class="text-primary">${data.appointments}</h3>
                                        <p class="mb-0">今日預約</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h3 class="text-success">$${data.revenue.toLocaleString()}</h3>
                                        <p class="mb-0">今日營收</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h3 class="text-warning">${data.newPatients}</h3>
                                        <p class="mb-0">新客戶</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        <button type="button" class="btn btn-primary" onclick="exportReport()">匯出報表</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除現有的模態框
    const existingModal = document.getElementById('reportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加新的模態框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 顯示模態框
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

// 匯出報表
function exportReport() {
    showAlert('報表匯出功能開發中', 'info');
}

// 載入系統配置
function loadSystemConfig() {
    // 模擬從API載入配置
    console.log('載入系統配置...');
}

// 工具函數：格式化日期
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-TW');
}

// 工具函數：格式化貨幣
function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD'
    }).format(amount);
}

// 工具函數：生成UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 添加載入覆蓋層樣式
const loadingStyles = `
    <style>
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .loading-content p {
            margin-top: 1rem;
            font-size: 1.1rem;
        }
    </style>
`;

// 將樣式添加到頁面
document.head.insertAdjacentHTML('beforeend', loadingStyles);

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
});

// 導出主要函數供其他模組使用
window.MedicalPlatform = {
    login,
    logout,
    navigateToModule,
    quickAction,
    showAlert,
    formatDate,
    formatCurrency,
    generateUUID,
    getCurrentUser: () => currentUser,
    getUserRoles: () => USER_ROLES
};
