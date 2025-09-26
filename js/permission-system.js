/**
 * 劉道玄曜診所雲整合系統 - 四級權限系統
 * 提供穩定的24小時權限管理
 */

class PermissionSystem {
    constructor() {
        this.permissions = {
            'hidden-admin': {
                level: 1,
                name: '管理員',
                passcode: 'FLOS2024ADMIN',
                duration: 24 * 60 * 60 * 1000, // 24小時
                features: ['all']
            },
            'a-level': {
                level: 2,
                name: 'A級權限',
                passcode: 'CLINIC2024A',
                duration: 24 * 60 * 60 * 1000, // 24小時
                features: ['appointments', 'medical-records', 'treatments', 'statistics', 'performance']
            },
            'b-level': {
                level: 3,
                name: 'B級權限',
                passcode: 'NURSE2024B',
                duration: 24 * 60 * 60 * 1000, // 24小時
                features: ['appointments', 'medical-records', 'treatments']
            },
            'employee': {
                level: 4,
                name: '一般員工',
                passcode: null,
                duration: 0,
                features: ['appointments', 'basic-info']
            }
        };
        
        this.currentUser = null;
        this.sessionKey = 'clinic_permission_session';
        this.init();
    }

    /**
     * 初始化權限系統
     */
    init() {
        this.loadSession();
        this.setupUI();
        this.bindEvents();
        this.startSessionMonitor();
        console.log('🔐 權限系統初始化完成');
    }

    /**
     * 載入已存在的會話
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                // 檢查會話是否過期
                if (session.expiresAt && now < session.expiresAt) {
                    this.currentUser = session;
                    this.updateUI();
                    console.log(`✅ 載入有效會話: ${session.permission}`);
                } else {
                    this.clearSession();
                    console.log('⏰ 會話已過期，已清除');
                }
            }
        } catch (error) {
            console.error('載入會話失敗:', error);
            this.clearSession();
        }
    }

    /**
     * 設置UI元素
     */
    setupUI() {
        // 創建權限提示模態框
        if (!document.getElementById('permission-modal')) {
            const modal = document.createElement('div');
            modal.id = 'permission-modal';
            modal.className = 'permission-modal';
            modal.innerHTML = `
                <div class="permission-modal-content">
                    <h3>權限驗證</h3>
                    <p>請輸入通行碼以存取此功能</p>
                    <input type="password" id="permission-input" placeholder="請輸入通行碼" />
                    <div class="permission-buttons">
                        <button id="permission-submit">確認</button>
                        <button id="permission-cancel">取消</button>
                    </div>
                    <div id="permission-error" class="permission-error"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // 創建權限狀態指示器
        if (!document.getElementById('permission-status')) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'permission-status';
            statusDiv.className = 'permission-status';
            document.body.appendChild(statusDiv);
        }

        this.updateUI();
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 模態框事件
        const modal = document.getElementById('permission-modal');
        const submitBtn = document.getElementById('permission-submit');
        const cancelBtn = document.getElementById('permission-cancel');
        const input = document.getElementById('permission-input');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handlePermissionSubmit());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hidePermissionModal());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handlePermissionSubmit();
                }
            });
        }

        // 點擊模態框外部關閉
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hidePermissionModal();
                }
            });
        }

        // 登出按鈕
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="logout"]')) {
                this.logout();
            }
        });
    }

    /**
     * 檢查權限
     */
    checkPermission(requiredFeature) {
        if (!this.currentUser) {
            return false;
        }

        const permission = this.permissions[this.currentUser.permission];
        if (!permission) {
            return false;
        }

        // 管理員有所有權限
        if (permission.features.includes('all')) {
            return true;
        }

        return permission.features.includes(requiredFeature);
    }

    /**
     * 請求權限
     */
    async requestPermission(requiredFeature, callback = null) {
        // 如果已有足夠權限，直接執行
        if (this.checkPermission(requiredFeature)) {
            if (callback) callback();
            return true;
        }

        // 顯示權限輸入模態框
        return new Promise((resolve) => {
            this.showPermissionModal((success) => {
                if (success && callback) {
                    callback();
                }
                resolve(success);
            });
        });
    }

    /**
     * 顯示權限模態框
     */
    showPermissionModal(callback = null) {
        const modal = document.getElementById('permission-modal');
        const input = document.getElementById('permission-input');
        const errorDiv = document.getElementById('permission-error');

        if (modal && input && errorDiv) {
            modal.style.display = 'flex';
            input.value = '';
            input.focus();
            errorDiv.textContent = '';
            
            this.permissionCallback = callback;
        }
    }

    /**
     * 隱藏權限模態框
     */
    hidePermissionModal() {
        const modal = document.getElementById('permission-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.permissionCallback = null;
    }

    /**
     * 處理權限提交
     */
    handlePermissionSubmit() {
        const input = document.getElementById('permission-input');
        const errorDiv = document.getElementById('permission-error');
        
        if (!input || !errorDiv) return;

        const passcode = input.value.trim();
        const permission = this.validatePasscode(passcode);

        if (permission) {
            this.login(permission);
            this.hidePermissionModal();
            
            if (this.permissionCallback) {
                this.permissionCallback(true);
            }
        } else {
            errorDiv.textContent = '通行碼錯誤，請重新輸入';
            input.value = '';
            input.focus();
        }
    }

    /**
     * 驗證通行碼
     */
    validatePasscode(passcode) {
        for (const [key, permission] of Object.entries(this.permissions)) {
            if (permission.passcode === passcode) {
                return key;
            }
        }
        return null;
    }

    /**
     * 登入
     */
    login(permissionLevel) {
        const permission = this.permissions[permissionLevel];
        if (!permission) return false;

        const now = Date.now();
        const session = {
            permission: permissionLevel,
            name: permission.name,
            level: permission.level,
            loginTime: now,
            expiresAt: permission.duration > 0 ? now + permission.duration : null
        };

        this.currentUser = session;
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        
        this.updateUI();
        this.dispatchEvent('permissionChanged', session);
        
        console.log(`✅ 登入成功: ${permission.name}`);
        return true;
    }

    /**
     * 登出
     */
    logout() {
        this.clearSession();
        this.updateUI();
        this.dispatchEvent('permissionChanged', null);
        console.log('👋 已登出');
    }

    /**
     * 清除會話
     */
    clearSession() {
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
    }

    /**
     * 更新UI
     */
    updateUI() {
        const statusDiv = document.getElementById('permission-status');
        if (!statusDiv) return;

        if (this.currentUser) {
            const permission = this.permissions[this.currentUser.permission];
            const timeLeft = this.getTimeLeft();
            
            statusDiv.innerHTML = `
                <div class="permission-info">
                    <span class="permission-badge ${this.currentUser.permission}">
                        ${permission.name}
                    </span>
                    ${timeLeft ? `<span class="time-left">${timeLeft}</span>` : ''}
                    <button data-action="logout" class="logout-btn">登出</button>
                </div>
            `;
            statusDiv.style.display = 'block';
        } else {
            statusDiv.style.display = 'none';
        }

        // 更新功能卡片顯示
        this.updateFeatureCards();
    }

    /**
     * 更新功能卡片顯示
     */
    updateFeatureCards() {
        const cards = document.querySelectorAll('.function-card[data-permission]');
        
        cards.forEach(card => {
            const requiredPermission = card.getAttribute('data-permission');
            if (this.checkPermission(requiredPermission)) {
                card.style.display = 'block';
                card.classList.remove('permission-locked');
            } else {
                card.style.display = 'none';
                card.classList.add('permission-locked');
            }
        });
    }

    /**
     * 獲取剩餘時間
     */
    getTimeLeft() {
        if (!this.currentUser || !this.currentUser.expiresAt) {
            return null;
        }

        const now = Date.now();
        const timeLeft = this.currentUser.expiresAt - now;
        
        if (timeLeft <= 0) {
            return null;
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * 開始會話監控
     */
    startSessionMonitor() {
        setInterval(() => {
            if (this.currentUser && this.currentUser.expiresAt) {
                const now = Date.now();
                if (now >= this.currentUser.expiresAt) {
                    console.log('⏰ 會話已過期');
                    this.logout();
                } else {
                    this.updateUI(); // 更新剩餘時間顯示
                }
            }
        }, 60000); // 每分鐘檢查一次
    }

    /**
     * 事件分發
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(`permission:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 獲取當前用戶信息
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 獲取權限等級
     */
    getPermissionLevel() {
        return this.currentUser ? this.currentUser.level : 4; // 默認為最低權限
    }
}

// 全局實例
window.PermissionSystem = new PermissionSystem();

// CSS 樣式
const permissionStyles = `
.permission-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    justify-content: center;
    align-items: center;
}

.permission-modal-content {
    background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
    border: 2px solid rgba(212, 175, 55, 0.6);
    border-radius: 15px;
    padding: 2rem;
    text-align: center;
    color: #d4af37;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    min-width: 300px;
}

.permission-modal-content h3 {
    margin-bottom: 1rem;
    color: #d4af37;
}

.permission-modal-content p {
    margin-bottom: 1.5rem;
    color: rgba(212, 175, 55, 0.8);
}

.permission-modal-content input {
    width: 100%;
    padding: 0.8rem;
    margin-bottom: 1rem;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    background: rgba(26, 26, 26, 0.8);
    color: #d4af37;
    font-size: 1rem;
}

.permission-modal-content input:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.permission-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.permission-buttons button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
}

.permission-buttons button:first-child {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.8), rgba(184, 134, 11, 0.8));
    color: #1a1a2e;
}

.permission-buttons button:last-child {
    background: linear-gradient(145deg, rgba(128, 128, 128, 0.8), rgba(96, 96, 96, 0.8));
    color: white;
}

.permission-buttons button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.permission-error {
    color: #ff6b6b;
    font-size: 0.9rem;
    margin-top: 1rem;
    min-height: 1.2rem;
}

.permission-status {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1001;
    display: none;
}

.permission-info {
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 10px;
    padding: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    backdrop-filter: blur(10px);
}

.permission-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
}

.permission-badge.hidden-admin {
    background: linear-gradient(135deg, #8B0000, #DC143C);
    color: #fff;
}

.permission-badge.a-level {
    background: linear-gradient(135deg, #4169E1, #1E90FF);
    color: #fff;
}

.permission-badge.b-level {
    background: linear-gradient(135deg, #32CD32, #228B22);
    color: #fff;
}

.permission-badge.employee {
    background: linear-gradient(135deg, #696969, #808080);
    color: #fff;
}

.time-left {
    color: rgba(212, 175, 55, 0.8);
    font-size: 0.8rem;
}

.logout-btn {
    background: linear-gradient(145deg, rgba(220, 20, 60, 0.8), rgba(139, 0, 0, 0.8));
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
}

.logout-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(220, 20, 60, 0.3);
}

.function-card.permission-locked {
    opacity: 0.5;
    pointer-events: none;
}
`;

// 注入樣式
const styleSheet = document.createElement('style');
styleSheet.textContent = permissionStyles;
document.head.appendChild(styleSheet);

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionSystem;
}
