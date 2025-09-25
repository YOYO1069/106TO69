# LINE Developers Console 設定指南

## 📋 **當前配置資訊**

- **Channel ID**: 2008063743
- **Channel Secret**: 8462dca808786d5b624f8c2042dedd06
- **Webhook URL**: https://sage-marigold-0f346a.netlify.app/.netlify/functions/line-webhook
- **LINE 官方帳號**: https://lin.ee/vb6ULgR

## 🔧 **需要完成的設定**

### 1️⃣ **設定 Webhook URL**
在 LINE Developers Console 的 Messaging API 頁面：
```
Webhook URL: https://sage-marigold-0f346a.netlify.app/.netlify/functions/line-webhook
Use webhook: 啟用 ✅
Verify: 點擊驗證（應該顯示成功）
```

### 2️⃣ **獲取 Channel Access Token**
在 Messaging API 頁面：
1. 找到 "Channel access token" 區域
2. 點擊 "Issue" 生成新的 token
3. 複製生成的 token

### 3️⃣ **其他設定**
- Auto-reply messages: 停用 ❌
- Greeting messages: 啟用 ✅
- Allow bot to join group chats: 停用 ❌

## 🧪 **測試步驟**

1. **Webhook 驗證**: 在 LINE Console 點擊 Verify
2. **加入官方帳號**: https://lin.ee/vb6ULgR
3. **發送測試訊息**: "預約"、"療程"、"你好"
4. **檢查回覆**: 應該收到相應的回覆訊息

## 📱 **預期功能**

### **關鍵字回覆**
- "預約" → 預約選項選單
- "療程" → 療程資訊
- "你好" → 歡迎訊息

### **快速操作**
- 預約傳送門連結
- Google Calendar 整合
- 診所資訊展示

---
**設定完成後，劉道玄諮詢師的 LINE Bot 就可以正常運作了！**
