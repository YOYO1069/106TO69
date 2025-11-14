# 邊美醬 LINE Bot 完整部署指南

## 系統架構

```
LINE Bot (邊美醬)
    ↓
Netlify Functions (Webhook)
    ↓
Supabase (PostgreSQL 資料庫)
    ↓
後台管理系統 (https://rad-paletas-14483a.netlify.app/admin)
```

## 已完成功能

### ✅ LINE Bot 核心功能
1. **對話式預約流程**
   - 11種療程分類選擇（Carousel 展示）
   - 療程項目輸入
   - 客戶資訊收集（姓名、電話）
   - 日期時段選擇
   - 備註說明
   - 預約確認（Flex Message）

2. **預約查詢功能**
   - 查看個人預約記錄
   - 顯示預約狀態（待確認/已確認/已完成/已取消）
   - 最近 5 筆預約展示

3. **預約取消功能**
   - 客戶自行取消預約
   - 自動通知管理員

4. **預約通知功能**
   - 新預約自動通知管理員
   - 預約確認後發送確認訊息給客戶

5. **預約提醒功能**
   - 每天自動檢查明天的預約
   - 發送提醒訊息給客戶

### ✅ 後台管理系統
1. **預約儀表板**
   - 數據總覽（待確認、今日、本週、本月）
   - 狀態統計
   - 熱門療程排行
   - 最近預約列表
   - 快速操作入口

2. **預約行事曆**
   - 月曆視圖
   - 每日預約標記
   - 點擊查看詳情
   - 月份切換

3. **預約管理**
   - 預約列表
   - 狀態篩選
   - 預約詳情
   - 狀態更新
   - 刪除預約

### ✅ 資料庫
- Supabase PostgreSQL
- yuemeiBookings 資料表
- 索引優化
- Row Level Security

## 環境設定

### 1. LINE Bot 設定

在 Netlify 環境變數中設定：

```bash
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
ADMIN_LINE_USER_ID=your_admin_line_user_id
```

取得方式：
1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Provider 和 Messaging API Channel
3. Channel Secret 在「Basic settings」
4. Channel Access Token 在「Messaging API」（需要 Issue）
5. Admin LINE User ID 可透過 webhook 日誌取得

### 2. Supabase 設定

已設定的環境變數：
```bash
SUPABASE_URL=https://clzjdlykhjwrlksyjlfz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

資料表已建立：
- yuemeiBookings
- 索引：lineUserId, status, preferredDate
- RLS 已啟用

### 3. Netlify 設定

專案已連結：
- 網站：https://rad-paletas-14483a.netlify.app
- 後台：https://rad-paletas-14483a.netlify.app/admin

Functions 端點：
- Webhook：`/.netlify/functions/yuemei-webhook`
- 提醒：`/.netlify/functions/booking-reminder`

## Webhook 設定

### LINE Developers Console 設定

1. 前往 Messaging API 頁面
2. 設定 Webhook URL：
   ```
   https://rad-paletas-14483a.netlify.app/.netlify/functions/yuemei-webhook
   ```
3. 啟用「Use webhook」
4. 關閉「Auto-reply messages」
5. 關閉「Greeting messages」

### 測試 Webhook

```bash
curl -X GET https://rad-paletas-14483a.netlify.app/.netlify/functions/yuemei-webhook
```

應該回傳：
```json
{
  "message": "Yuemei LINE Bot Webhook is running",
  "timestamp": "2025-11-14T..."
}
```

## 排程任務設定

### Netlify Scheduled Functions

1. 在 Netlify 專案設定中啟用 Scheduled Functions
2. 建立排程：
   - Function: `booking-reminder`
   - Schedule: `0 9 * * *` (每天早上 9:00)
   - 或使用 Netlify UI 設定

### 手動觸發測試

```bash
curl -X POST https://rad-paletas-14483a.netlify.app/.netlify/functions/booking-reminder
```

## Rich Menu 設定

### 上傳 Rich Menu v4

1. 準備圖片（2500x1686px PNG，<1MB）

2. 設定環境變數：
```bash
export LINE_CHANNEL_ACCESS_TOKEN="your_access_token"
```

3. 執行上傳腳本：
```bash
cd /home/ubuntu/netlify-site
node scripts/upload-rich-menu.js upload /path/to/rich-menu-v4.png
```

4. 驗證：
   - 在 LINE 中開啟邊美醬
   - 點擊左下角選單按鈕
   - 確認 Rich Menu 顯示正確

詳細說明請參考 `RICH_MENU_SETUP.md`

## 測試流程

### 1. 基本對話測試

在 LINE 中發送：
- 「你好」→ 歡迎訊息
- 「療程」→ 療程分類列表
- 「預約」→ 開始預約流程

### 2. 完整預約流程測試

1. 輸入「預約」
2. 選擇療程分類（例如：水光針）
3. 輸入療程名稱（例如：水光針基礎款）
4. 輸入姓名（例如：王小明）
5. 輸入電話（例如：0912345678）
6. 輸入日期（例如：2025-11-20）
7. 選擇時段
8. 輸入備註或「完成」
9. 確認收到預約完成訊息
10. 管理員應收到新預約通知

### 3. 查詢預約測試

1. 輸入「查詢」
2. 確認顯示預約記錄
3. 點擊「取消此預約」按鈕
4. 確認預約已取消

### 4. 後台測試

1. 前往 https://rad-paletas-14483a.netlify.app/admin
2. 查看預約儀表板
3. 檢查預約行事曆
4. 進入預約管理頁面
5. 更新預約狀態
6. 確認資料同步

### 5. 提醒功能測試

1. 在資料庫中建立明天的預約（status='confirmed'）
2. 手動觸發提醒 Function
3. 確認客戶收到提醒訊息

## 監控和維護

### 查看日誌

**Netlify Functions 日誌：**
1. 前往 Netlify Dashboard
2. 選擇專案
3. Functions → 選擇 function → Logs

**Supabase 日誌：**
1. 前往 Supabase Dashboard
2. 選擇專案
3. Logs → Database 或 API

### 常見問題

#### Webhook 無法接收訊息
1. 檢查 Webhook URL 設定
2. 驗證 LINE_CHANNEL_SECRET
3. 查看 Netlify Functions 日誌
4. 使用 LINE Verify 功能測試

#### 預約無法儲存
1. 檢查 Supabase 連線
2. 確認環境變數正確
3. 查看 Function 日誌錯誤訊息
4. 驗證資料表結構

#### 提醒未發送
1. 確認 Scheduled Function 已啟用
2. 檢查排程設定
3. 手動觸發測試
4. 查看執行日誌

## 效能優化

### 資料庫
- 已建立索引（lineUserId, status, preferredDate）
- 使用 RLS 保護資料
- 定期清理舊資料

### Functions
- 使用記憶體快取（bookingStates）
- 批次處理通知
- 錯誤處理和重試機制

### LINE Bot
- 使用 Flex Messages 提升互動體驗
- Carousel 展示療程分類
- 快速回覆按鈕

## 安全性

### 資料保護
- Webhook 簽名驗證
- Supabase RLS 啟用
- 環境變數加密儲存

### 存取控制
- 管理員 LINE User ID 驗證
- 後台需要登入
- API 金鑰保護

## 擴展建議

### 短期改進
1. **多語言支援**：繁中、英文切換
2. **預約修改**：客戶自行修改預約時間
3. **評價系統**：療程後評價收集
4. **優惠券**：預約時使用優惠碼

### 長期規劃
1. **AI 客服**：整合 LLM 回答常見問題
2. **會員系統**：積分、等級、專屬優惠
3. **推薦系統**：根據歷史推薦療程
4. **多店支援**：擴展到多個分店

## 相關文件

- `LINE_BOT_SETUP.md` - LINE Bot 功能說明（在 flos-clinic-attendance 專案中）
- `RICH_MENU_SETUP.md` - Rich Menu 設定指南
- `supabase-schema.sql` - 資料庫結構

## 支援

如有問題請聯絡：
- GitHub: https://github.com/YOYO1069/106TO69
- LINE Bot: 邊美醬
- 後台: https://rad-paletas-14483a.netlify.app/admin
