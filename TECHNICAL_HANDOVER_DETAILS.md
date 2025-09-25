# 技術細節承接文件

## 🎨 **光線效果實現細節**

### **客戶明確要求**
> "要有光線從不同方位打入照出磨砂的感覺"
> "底圖也要"
> "格子的格線保持金色沒關係"
> "光線感出來即可"

### **CSS 實現架構**

#### **1. 底圖多方向光線照射**
```css
body {
    background: 
        /* 主光源 - 左上角強烈照射 */
        radial-gradient(ellipse 1200px 900px at 12% 8%, 
            rgba(255, 255, 255, 0.18) 0%, 
            rgba(212, 175, 55, 0.12) 25%, 
            rgba(255, 255, 255, 0.08) 50%, 
            transparent 75%),
        /* 輔助光源 - 右下角大範圍反射 */
        radial-gradient(ellipse 1000px 1200px at 88% 92%, 
            rgba(212, 175, 55, 0.15) 0%, 
            rgba(255, 255, 255, 0.10) 20%, 
            rgba(212, 175, 55, 0.06) 45%, 
            transparent 70%),
        /* 其他光源... */
}
```

#### **2. 光線方向性紋理**
```css
body::before {
    background: 
        /* 主光線方向 - 左上到右下強烈條紋 */
        repeating-linear-gradient(135deg,
            transparent 0px,
            rgba(255, 255, 255, 0.025) 1px,
            rgba(255, 255, 255, 0.025) 3px,
            transparent 4px,
            transparent 12px),
        /* 交叉光線、垂直反射等... */
}
```

#### **3. 動態光線掃射**
```css
body::after {
    background: 
        /* 主要光線掃射 - 從左上角光源 */
        conic-gradient(from 135deg at 15% 15%, 
            transparent 0deg,
            rgba(255, 255, 255, 0.015) 20deg,
            rgba(212, 175, 55, 0.020) 45deg,
            /* ... */),
    animation: lightSweep 35s linear infinite;
}
```

### **卡片光線效果**
```css
.feature-card {
    background: 
        /* 真實多方向光線照射效果 */
        radial-gradient(ellipse 180px 140px at 8% 12%, 
            rgba(255, 255, 255, 0.14) 0%, 
            rgba(212, 175, 55, 0.10) 35%, 
            transparent 75%),
        /* 其他光源... */
    backdrop-filter: blur(20px) saturate(1.6);
    box-shadow: 
        /* 光線反射陰影 */
        inset 3px 3px 6px rgba(255, 255, 255, 0.12),
        inset -2px -2px 4px rgba(0, 0, 0, 0.18),
        /* 其他陰影... */
}
```

---

## 🔧 **AI 管理中心實現**

### **隱藏機制**
```javascript
// 管理員檢查
function checkAdminAccess() {
    const adminKey = localStorage.getItem('admin_access_key');
    return adminKey === 'liu_daoxuan_admin_2024';
}

// 快捷鍵啟用
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        if (!checkAdminAccess()) {
            const key = prompt('請輸入管理員密鑰：');
            if (key === 'liu_daoxuan_admin_2024') {
                localStorage.setItem('admin_access_key', key);
                showAdminPanel();
            }
        } else {
            toggleAdminPanel();
        }
    }
});
```

### **功能方格整合**
- 位置：主頁面功能方格中
- 外觀：與其他功能方格一致
- 識別：金色邊框 + AI 標籤
- 啟用：點擊後驗證管理員權限

---

## 🌐 **服務整合架構**

### **LINE Bot Webhook**
```javascript
// netlify/functions/line-webhook.js
exports.handler = async (event, context) => {
    const signature = event.headers['x-line-signature'];
    const body = event.body;
    
    // 驗證簽名
    if (!validateSignature(body, signature)) {
        return { statusCode: 401 };
    }
    
    // 處理訊息
    const events = JSON.parse(body).events;
    for (const event of events) {
        await handleEvent(event);
    }
    
    return { statusCode: 200 };
};
```

### **OpenAI 整合**
```javascript
// netlify/functions/openai-chat.js
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
    const { message } = JSON.parse(event.body);
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "你是劉道玄醫師診所的AI助理..."
            },
            {
                role: "user",
                content: message
            }
        ]
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            response: completion.choices[0].message.content
        })
    };
};
```

### **Google Services 整合**
```javascript
// js/google-integration.js
class GoogleIntegration {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.calendarId = process.env.GOOGLE_CALENDAR_ID;
    }
    
    async syncCalendar() {
        // Google Calendar API 同步邏輯
    }
    
    async updateSheets(data) {
        // Google Sheets API 更新邏輯
    }
}
```

---

## 📱 **Hanker LIFF 整合**

### **LIFF 初始化**
```javascript
// js/hanker-integration.js
liff.init({
    liffId: '2008079261-3lyOnYBB'
}).then(() => {
    if (liff.isLoggedIn()) {
        initializeBookingSystem();
    } else {
        liff.login();
    }
});
```

### **預約流程**
1. 用戶點擊預約按鈕
2. 開啟 Hanker LIFF 應用
3. 完成預約後回調系統
4. 同步到 Google Calendar
5. 發送確認訊息

---

## 🎯 **功能頁面架構**

### **行事曆頁面** (`liu-daoxuan-calendar.html`)
- **FullCalendar 整合**：6.1.8 版本
- **多社群來源標示**：不同顏色區分預約來源
- **即時同步**：與 Google Calendar 雙向同步
- **快速新增**：側邊欄快速新增預約功能

### **預約表單管理** (`appointment-form-management.html`)
- **動態表單**：根據療程類型動態生成
- **狀態追蹤**：預約狀態實時更新
- **智能歸類**：自動分類不同來源的預約
- **數據導出**：支援 Excel 和 PDF 導出

### **數據分析頁面**
- **即時儀表板**：關鍵指標實時顯示
- **圖表視覺化**：Chart.js 或 D3.js 實現
- **數據過濾**：多維度數據篩選
- **報表生成**：自動生成分析報表

---

## 🔐 **安全性實現**

### **環境變數保護**
```javascript
// 敏感資訊通過環境變數管理
const config = {
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
};
```

### **API 安全**
- **CORS 設定**：限制來源域名
- **Rate Limiting**：API 調用頻率限制
- **簽名驗證**：LINE Bot webhook 簽名驗證
- **Token 管理**：定期更新 access token

---

## 📊 **性能優化**

### **CSS 優化**
- **Critical CSS**：內聯關鍵 CSS
- **CSS 壓縮**：生產環境自動壓縮
- **選擇器優化**：避免深層嵌套

### **JavaScript 優化**
- **代碼分割**：按功能模組分割
- **懶加載**：非關鍵功能延遲載入
- **緩存策略**：合理使用瀏覽器緩存

### **圖片優化**
- **WebP 格式**：現代瀏覽器使用 WebP
- **響應式圖片**：不同螢幕尺寸使用不同圖片
- **CDN 加速**：Netlify 自動 CDN 加速

---

## 🐛 **常見問題解決**

### **FullCalendar 不顯示**
```javascript
// 檢查 CDN 連結是否完整
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js"></script>

// 確保 DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
});
```

### **光線效果不顯示**
- 檢查 CSS 是否正確載入
- 確認瀏覽器支援 backdrop-filter
- 檢查 z-index 層級設定

### **API 調用失敗**
- 檢查環境變數是否正確設定
- 確認 API 金鑰是否有效
- 檢查網路連接和 CORS 設定

---

## 🔄 **部署流程**

### **自動部署**
1. 推送代碼到 GitHub main 分支
2. Netlify 自動檢測變更
3. 執行建置流程
4. 部署到生產環境
5. 更新 CDN 緩存

### **手動部署**
```bash
# 本地測試
npm run build

# 推送到 GitHub
git add .
git commit -m "更新描述"
git push origin main

# 檢查部署狀態
# 訪問 Netlify Dashboard
```

---

## 📈 **監控和維護**

### **系統監控**
- **Netlify Analytics**：訪問量和性能監控
- **Google Analytics**：用戶行為分析
- **Uptime 監控**：服務可用性監控

### **日誌管理**
- **Netlify Functions Logs**：無伺服器函數日誌
- **Browser Console**：前端錯誤日誌
- **API 調用日誌**：第三方服務調用記錄

### **定期維護**
- **依賴更新**：定期更新 npm 依賴
- **安全補丁**：及時應用安全更新
- **性能優化**：根據監控數據優化性能
- **備份策略**：定期備份重要數據

---

**技術負責人**：AI Assistant  
**最後更新**：2025年9月25日  
**版本**：v1.0.0  
**狀態**：生產環境穩定運行
