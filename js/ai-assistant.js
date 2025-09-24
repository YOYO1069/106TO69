/**
 * 劉道玄醫師 AI 預約助理前端模組
 * 提供智能對話和預約引導功能
 */

class AIAssistant {
    constructor() {
        this.apiEndpoint = '/.netlify/functions/openai-chat';
        this.chatHistory = [];
        this.isOpen = false;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.createChatInterface();
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    /**
     * 創建聊天介面
     */
    createChatInterface() {
        // 創建 AI 助理容器
        const chatContainer = document.createElement('div');
        chatContainer.id = 'aiChatContainer';
        chatContainer.className = 'ai-chat-container';
        chatContainer.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <i class="fas fa-robot"></i>
                    <span>劉道玄醫師 AI 助理</span>
                </div>
                <button class="ai-chat-close" onclick="window.aiAssistant.toggleChat()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages">
                <!-- 訊息將動態載入 -->
            </div>
            <div class="ai-chat-input">
                <input type="text" id="aiChatInput" placeholder="輸入您的問題..." maxlength="500">
                <button id="aiSendButton" onclick="window.aiAssistant.sendMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div class="ai-chat-suggestions" id="aiChatSuggestions">
                <!-- 建議操作將動態載入 -->
            </div>
        `;

        // 創建觸發按鈕
        const fabButton = document.createElement('button');
        fabButton.id = 'aiChatFab';
        fabButton.className = 'ai-chat-fab';
        fabButton.innerHTML = '<i class="fas fa-robot"></i>';
        fabButton.onclick = () => this.toggleChat();

        // 添加到頁面
        document.body.appendChild(chatContainer);
        document.body.appendChild(fabButton);

        // 添加樣式
        this.addStyles();
    }

    /**
     * 添加 CSS 樣式
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-chat-container {
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: 350px;
                height: 500px;
                background: var(--gradient-card, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                border: 2px solid #d4af37;
                display: none;
                flex-direction: column;
                z-index: 1000;
                font-family: 'Arial', sans-serif;
            }

            .ai-chat-container.open {
                display: flex;
            }

            .ai-chat-header {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 15px;
                border-radius: 13px 13px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .ai-chat-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }

            .ai-chat-title i {
                color: #d4af37;
                font-size: 1.2em;
            }

            .ai-chat-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2em;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: background 0.3s;
            }

            .ai-chat-close:hover {
                background: rgba(255,255,255,0.1);
            }

            .ai-chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ai-message, .user-message {
                padding: 10px 12px;
                border-radius: 12px;
                max-width: 80%;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.4;
            }

            .ai-message {
                background: linear-gradient(135deg, #4682b4 0%, #5a9bd4 100%);
                color: white;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
            }

            .user-message {
                background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
                color: #1a1a2e;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
                font-weight: 500;
            }

            .ai-message.loading {
                background: #6c757d;
                color: white;
            }

            .ai-chat-input {
                padding: 15px;
                display: flex;
                gap: 10px;
                border-top: 1px solid rgba(212, 175, 55, 0.3);
            }

            .ai-chat-input input {
                flex: 1;
                padding: 10px 12px;
                border: 1px solid rgba(212, 175, 55, 0.5);
                border-radius: 20px;
                background: rgba(255,255,255,0.1);
                color: white;
                font-size: 14px;
            }

            .ai-chat-input input::placeholder {
                color: rgba(255,255,255,0.6);
            }

            .ai-chat-input input:focus {
                outline: none;
                border-color: #d4af37;
                box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
            }

            .ai-chat-input button {
                background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                color: #1a1a2e;
                cursor: pointer;
                transition: transform 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-chat-input button:hover {
                transform: scale(1.05);
            }

            .ai-chat-input button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .ai-chat-suggestions {
                padding: 0 15px 15px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .suggestion-btn {
                background: rgba(212, 175, 55, 0.2);
                border: 1px solid rgba(212, 175, 55, 0.5);
                color: #d4af37;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .suggestion-btn:hover {
                background: rgba(212, 175, 55, 0.3);
                border-color: #d4af37;
            }

            .ai-chat-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
                border: none;
                border-radius: 50%;
                color: #1a1a2e;
                font-size: 1.5em;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
                transition: all 0.3s;
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-chat-fab:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
            }

            .ai-chat-fab.has-notification::after {
                content: '';
                position: absolute;
                top: 8px;
                right: 8px;
                width: 12px;
                height: 12px;
                background: #dc3545;
                border-radius: 50%;
                border: 2px solid white;
            }

            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 8px 12px;
            }

            .typing-dot {
                width: 6px;
                height: 6px;
                background: rgba(255,255,255,0.6);
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }

            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30% { transform: translateY(-10px); opacity: 1; }
            }

            @media (max-width: 768px) {
                .ai-chat-container {
                    width: calc(100vw - 40px);
                    height: 70vh;
                    bottom: 90px;
                    right: 20px;
                    left: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // Enter 鍵發送訊息
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement.id === 'aiChatInput') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 點擊外部關閉聊天
        document.addEventListener('click', (e) => {
            const chatContainer = document.getElementById('aiChatContainer');
            const fabButton = document.getElementById('aiChatFab');
            
            if (this.isOpen && 
                !chatContainer.contains(e.target) && 
                !fabButton.contains(e.target)) {
                this.toggleChat();
            }
        });
    }

    /**
     * 顯示歡迎訊息
     */
    showWelcomeMessage() {
        const welcomeMessage = `您好！我是劉道玄醫師的AI預約助理 🤖

我可以協助您：
• 了解醫美療程資訊
• 查詢價格和時間
• 引導預約流程
• 回答常見問題

有什麼可以為您服務的嗎？`;

        this.addMessage(welcomeMessage, 'ai');
        this.showSuggestions(['我想預約', '查看療程項目', '營業時間', '價格諮詢']);
    }

    /**
     * 切換聊天視窗
     */
    toggleChat() {
        const chatContainer = document.getElementById('aiChatContainer');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            chatContainer.classList.add('open');
            document.getElementById('aiChatInput').focus();
        } else {
            chatContainer.classList.remove('open');
        }
    }

    /**
     * 發送訊息
     */
    async sendMessage(messageText = null) {
        const input = document.getElementById('aiChatInput');
        const message = messageText || input.value.trim();
        
        if (!message || this.isLoading) return;

        // 清空輸入框和建議
        if (!messageText) {
            input.value = '';
        }
        this.clearSuggestions();

        // 添加用戶訊息
        this.addMessage(message, 'user');

        // 顯示載入指示器
        this.showTypingIndicator();
        this.setLoading(true);

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: this.getConversationContext(),
                    appointmentData: this.getAppointmentData()
                }),
            });

            const data = await response.json();

            // 移除載入指示器
            this.hideTypingIndicator();

            if (response.ok) {
                // 添加 AI 回應
                this.addMessage(data.response, 'ai');
                
                // 顯示建議操作
                if (data.suggestedActions && data.suggestedActions.length > 0) {
                    this.showSuggestions(data.suggestedActions);
                }

                // 記錄對話
                this.chatHistory.push({
                    user: message,
                    ai: data.response,
                    intent: data.intent,
                    timestamp: new Date().toISOString()
                });

                // 處理特殊意圖
                this.handleSpecialIntent(data.intent);

            } else {
                this.addMessage(data.message || 'AI 服務暫時無法使用，請稍後再試', 'ai');
            }

        } catch (error) {
            console.error('AI Chat Error:', error);
            this.hideTypingIndicator();
            this.addMessage('網路連線有問題，請檢查網路後重試', 'ai');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 添加訊息到聊天視窗
     */
    addMessage(message, type) {
        const messagesContainer = document.getElementById('aiChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * 顯示輸入指示器
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('aiChatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'ai-message loading';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * 隱藏輸入指示器
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * 顯示建議操作
     */
    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('aiChatSuggestions');
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = suggestion;
            btn.onclick = () => this.sendMessage(suggestion);
            suggestionsContainer.appendChild(btn);
        });
    }

    /**
     * 清除建議
     */
    clearSuggestions() {
        const suggestionsContainer = document.getElementById('aiChatSuggestions');
        suggestionsContainer.innerHTML = '';
    }

    /**
     * 設定載入狀態
     */
    setLoading(loading) {
        this.isLoading = loading;
        const sendButton = document.getElementById('aiSendButton');
        const input = document.getElementById('aiChatInput');
        
        sendButton.disabled = loading;
        input.disabled = loading;
        
        if (loading) {
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    /**
     * 獲取對話上下文
     */
    getConversationContext() {
        return this.chatHistory.slice(-5); // 最近5輪對話
    }

    /**
     * 獲取預約相關數據
     */
    getAppointmentData() {
        return {
            currentDate: new Date().toISOString(),
            currentPage: window.location.pathname,
            availableServices: [
                '肉毒桿菌注射',
                '玻尿酸填充', 
                '皮秒雷射',
                '電波拉皮',
                '線雕拉提'
            ],
            businessHours: {
                tuesday: '12:00-20:00',
                wednesday: '12:00-20:00', 
                thursday: '12:00-20:00',
                friday: '12:00-20:00',
                saturday: '11:00-20:00'
            },
            contactMethods: ['LINE', 'Instagram', 'Facebook', '電話']
        };
    }

    /**
     * 處理特殊意圖
     */
    handleSpecialIntent(intent) {
        switch (intent) {
            case 'appointment':
                // 可以自動開啟預約表單或跳轉到預約頁面
                setTimeout(() => {
                    this.showSuggestions(['查看可預約時段', '填寫預約表單', '聯繫客服']);
                }, 1000);
                break;
                
            case 'pricing':
                // 可以顯示價格表或相關資訊
                break;
                
            case 'schedule':
                // 可以顯示營業時間或行事曆
                break;
        }
    }

    /**
     * 清除聊天記錄
     */
    clearChat() {
        const messagesContainer = document.getElementById('aiChatMessages');
        messagesContainer.innerHTML = '';
        this.chatHistory = [];
        this.showWelcomeMessage();
    }

    /**
     * 獲取聊天記錄
     */
    getChatHistory() {
        return this.chatHistory;
    }
}

// 初始化 AI 助理
document.addEventListener('DOMContentLoaded', function() {
    window.aiAssistant = new AIAssistant();
});

// 全域函數供 HTML 調用
window.toggleAIChat = function() {
    if (window.aiAssistant) {
        window.aiAssistant.toggleChat();
    }
};

window.sendAIMessage = function(message) {
    if (window.aiAssistant) {
        window.aiAssistant.sendMessage(message);
    }
};
