# LINE Bot 設定指南

## 🎯 **設定步驟**

### 1️⃣ **LINE Developers Console 設定**

1. **前往 [LINE Developers Console](https://developers.line.biz/)**
2. **登入您的 LINE 帳號**
3. **創建新的 Provider 或選擇現有的**
4. **創建新的 Messaging API Channel**

### 2️⃣ **Channel 設定**

#### **基本資訊**
- **Channel name**: 劉道玄諮詢師預約系統
- **Channel description**: 專業美容諮詢預約服務
- **Category**: Medical/Healthcare
- **Subcategory**: Beauty/Cosmetic

#### **Messaging API 設定**
1. **Webhook URL**: 
   ```
   https://sage-marigold-0f346a.netlify.app/.netlify/functions/line-webhook
   ```
2. **Use webhook**: 啟用
3. **Allow bot to join group chats**: 停用（個人諮詢用）
4. **Auto-reply messages**: 停用（使用自定義回覆）
5. **Greeting messages**: 啟用

### 3️⃣ **取得必要資訊**

#### **Channel Secret**
- 在 **Basic settings** 頁面
- 複製 **Channel secret**

#### **Channel Access Token**
- 在 **Messaging API** 頁面
- 點擊 **Issue** 生成新的 **Channel access token**
- 複製生成的 token

### 4️⃣ **Netlify 環境變數設定**

在 Netlify 控制台設定以下環境變數：

```
LINE_CHANNEL_SECRET=您的Channel Secret
LINE_CHANNEL_ACCESS_TOKEN=您的Channel Access Token
```

#### **設定步驟**
1. 登入 [Netlify Dashboard](https://app.netlify.com/)
2. 選擇您的網站
3. 前往 **Site settings** → **Environment variables**
4. 點擊 **Add variable** 添加上述變數

### 5️⃣ **測試設定**

#### **Webhook 測試**
1. 在 LINE Developers Console 中點擊 **Verify** 測試 Webhook
2. 應該顯示 **Success**

#### **功能測試**
1. 掃描 QR Code 或訪問: https://lin.ee/vb6ULgR
2. 加入 LINE 官方帳號
3. 發送測試訊息：
   - "預約" → 應該收到預約選項
   - "療程" → 應該收到療程資訊
   - "你好" → 應該收到歡迎訊息

#### **系統測試**
訪問測試頁面：https://sage-marigold-0f346a.netlify.app/line-bot-test.html

## 🔧 **故障排除**

### **常見問題**

#### **401 Invalid signature**
- 檢查 `LINE_CHANNEL_SECRET` 是否正確設定
- 確認 Webhook URL 是否正確

#### **403 Forbidden**
- 檢查 `LINE_CHANNEL_ACCESS_TOKEN` 是否正確設定
- 確認 Token 是否已過期

#### **405 Method not allowed**
- Webhook URL 設定正確
- 確認 LINE 使用 POST 方法發送請求

#### **500 Internal server error**
- 檢查 Netlify Functions 是否部署成功
- 查看 Netlify Functions 日誌

### **檢查清單**

- [ ] LINE Developers Console 已設定
- [ ] Webhook URL 已設定並驗證成功
- [ ] Channel Secret 已複製到 Netlify 環境變數
- [ ] Channel Access Token 已複製到 Netlify 環境變數
- [ ] 網站已重新部署
- [ ] LINE 官方帳號可以正常加入
- [ ] 測試訊息可以正常回覆

## 📱 **LINE 官方帳號資訊**

- **官方連結**: https://lin.ee/vb6ULgR
- **QR Code**: 可在 LINE Developers Console 中找到
- **帳號名稱**: 劉道玄諮詢師預約系統

## 🎯 **功能特色**

### **智能回覆**
- 預約相關關鍵字自動回覆
- 療程諮詢資訊提供
- 診所資訊和聯絡方式

### **快速操作**
- 預約傳送門直接連結
- Google Calendar 整合
- 官方網站導向

### **個人化服務**
- 用戶 ID 記錄
- 對話歷史追蹤
- 智能推薦功能

---

**設定完成後，劉道玄諮詢師的 LINE Bot 就可以正常運作了！**
