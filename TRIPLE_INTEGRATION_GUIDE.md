# 劉道玄諮詢師預約系統 - 三方整合部署指南

## 🎯 **整合架構概覽**

本系統整合了三大平台，提供完整的醫美預約管理解決方案：

```
劉道玄諮詢師預約系統
├── Netlify (網站託管 + Functions)
├── Manus (數據管理 + 分析)
└── OpenAI (AI 助理 + 智能分析)
```

## 📋 **環境變數設定清單**

### 1. Netlify 控制台設定

登入 [Netlify Dashboard](https://app.netlify.com/) → 選擇網站 → **Site settings** → **Environment variables**

```bash
# OpenAI 整合
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Netlify API 整合
NETLIFY_ACCESS_TOKEN=nfp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NETLIFY_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Manus 平台整合
MANUS_API_KEY=manus_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MANUS_PROJECT_ID=liu-daoxuan-medical

# LINE Bot 整合（可選）
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Calendar 整合（可選）
GOOGLE_CALENDAR_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALENDAR_CLIENT_ID=xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

## 🔑 **API 金鑰取得方式**

### 1. OpenAI API 金鑰
1. 登入 [OpenAI Platform](https://platform.openai.com/)
2. 前往 **API Keys** 頁面
3. 點擊 **Create new secret key**
4. 複製金鑰並設定為 `OPENAI_API_KEY`

### 2. Netlify Access Token
1. 登入 [Netlify Dashboard](https://app.netlify.com/)
2. **User Settings** → **Applications** → **Personal access tokens**
3. 點擊 **New access token**
4. 輸入描述：`劉道玄諮詢師預約系統整合`
5. 複製 Token 並設定為 `NETLIFY_ACCESS_TOKEN`

### 3. Netlify Site ID
1. 在 Netlify Dashboard 中選擇您的網站
2. **Site settings** → **General** → **Site details**
3. 複製 **Site ID** 並設定為 `NETLIFY_SITE_ID`

### 4. Manus API 金鑰
1. 登入 [Manus 平台](https://app.manus.im/)
2. 前往 **API Settings** 或 **開發者設定**
3. 生成新的 API 金鑰
4. 設定為 `MANUS_API_KEY`
5. 專案 ID 設定為 `liu-daoxuan-medical`

## 🚀 **部署步驟**

### 步驟 1: 上傳專案
1. 下載 `liu-daoxuan-triple-integration-system-v1.0.0.zip`
2. 登入 [Netlify Dashboard](https://app.netlify.com/)
3. 拖拽 ZIP 檔案到 Netlify 進行部署

### 步驟 2: 設定環境變數
1. 在 Netlify 中前往 **Site settings** → **Environment variables**
2. 逐一添加上述所有環境變數
3. 點擊 **Save** 儲存設定

### 步驟 3: 啟用 Functions
1. Functions 會自動啟用
2. 確認以下 Functions 正常運作：
   - `openai-chat` - AI 助理功能
   - `manus-netlify-integration` - 三方整合核心
   - `line-webhook` - LINE Bot 整合

### 步驟 4: 測試整合
1. 開啟部署的網站
2. 檢查右上角整合狀態指示器
3. 測試 AI 助理功能（右下角機器人圖示）
4. 提交測試預約表單驗證同步功能

## 🔧 **功能驗證清單**

### ✅ **基本功能測試**
- [ ] 網站正常載入
- [ ] 導航選單正常運作
- [ ] 響應式設計在手機上正常顯示

### ✅ **AI 助理測試**
- [ ] 點擊右下角機器人圖示開啟聊天
- [ ] 發送測試訊息獲得回應
- [ ] 建議操作按鈕正常運作

### ✅ **整合狀態測試**
- [ ] 右上角整合狀態指示器顯示
- [ ] Netlify 狀態顯示為綠色（已連接）
- [ ] Manus 狀態顯示為綠色（已連接）
- [ ] OpenAI 狀態顯示為綠色（已連接）

### ✅ **預約系統測試**
- [ ] 填寫預約表單
- [ ] 表單提交成功
- [ ] 資料同步到 Manus（檢查同步佇列）

### ✅ **分析報告測試**
- [ ] 點擊整合面板中的「分析報告」
- [ ] 報告正常顯示統計數據
- [ ] 效能指標正常顯示

## 📊 **整合功能說明**

### 🤖 **AI 助理功能**
- **智能對話**: 回答醫美相關問題
- **預約引導**: 協助客戶完成預約流程
- **意圖識別**: 自動識別客戶需求
- **建議操作**: 提供下一步操作建議

### 🔄 **自動同步功能**
- **預約資料**: 自動同步到 Manus CRM
- **表單提交**: 即時同步客戶資訊
- **AI 對話**: 記錄對話內容和分析
- **離線佇列**: 網路中斷時暫存資料

### 📈 **分析報告功能**
- **預約統計**: 總預約數、轉換率
- **來源分析**: 各社群平台效果
- **效能監控**: 系統回應時間、正常運行時間
- **AI 分析**: 對話品質、客戶滿意度

### 🔔 **即時通知功能**
- **同步狀態**: 即時顯示同步結果
- **錯誤警報**: 自動提醒系統問題
- **連線狀態**: 監控各平台連接狀態

## 🛠️ **故障排除**

### 問題 1: AI 助理無法回應
**可能原因**: OpenAI API 金鑰錯誤或額度不足
**解決方案**: 
1. 檢查 `OPENAI_API_KEY` 是否正確設定
2. 確認 OpenAI 帳戶有足夠額度
3. 查看 Netlify Functions 日誌

### 問題 2: 整合狀態顯示紅色
**可能原因**: API 金鑰錯誤或網路問題
**解決方案**:
1. 檢查所有環境變數是否正確設定
2. 確認 API 金鑰有效且有權限
3. 檢查網路連線狀態

### 問題 3: 資料同步失敗
**可能原因**: Manus API 連接問題
**解決方案**:
1. 檢查 `MANUS_API_KEY` 和 `MANUS_PROJECT_ID`
2. 確認 Manus 平台服務正常
3. 查看同步佇列中的錯誤訊息

### 問題 4: Functions 無法執行
**可能原因**: 環境變數未設定或 Functions 配置錯誤
**解決方案**:
1. 重新部署網站
2. 檢查 `netlify.toml` 配置
3. 確認所有必要的環境變數已設定

## 📞 **技術支援**

### 日誌查看
1. **Netlify Functions 日誌**: Netlify Dashboard → Functions → 選擇 Function → Logs
2. **瀏覽器控制台**: F12 → Console 查看前端錯誤
3. **整合狀態**: 網站右上角整合面板查看即時狀態

### 聯繫支援
- **Netlify 支援**: [Netlify Support](https://www.netlify.com/support/)
- **OpenAI 支援**: [OpenAI Help Center](https://help.openai.com/)
- **Manus 支援**: [Manus Help Center](https://help.manus.im/)

## 🔄 **更新和維護**

### 定期檢查項目
1. **API 金鑰有效期**: 定期更新即將過期的 API 金鑰
2. **使用額度**: 監控 OpenAI 和其他服務的使用額度
3. **效能監控**: 定期查看分析報告確保系統正常運作
4. **安全更新**: 關注各平台的安全更新通知

### 備份建議
1. **環境變數備份**: 安全保存所有 API 金鑰
2. **資料備份**: 定期從 Manus 匯出重要資料
3. **程式碼備份**: 保存專案原始碼到 Git 倉庫

---

**劉道玄諮詢師預約系統現已完成三方整合，提供完整的智能醫美管理解決方案！**
