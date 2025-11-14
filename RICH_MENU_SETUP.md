# Rich Menu v4 設定指南

## 概述

Rich Menu v4 是邊美醬 LINE Bot 的主選單，提供快速存取預約、查詢、療程資訊等功能。

## 設計規格

### 尺寸
- 寬度：2500px
- 高度：1686px
- 格式：PNG
- 最大檔案大小：1MB

### 區域配置

Rich Menu 分為 5 個可點擊區域：

#### 上排（3個按鈕）
1. **預約** (左)
   - 位置：x:0, y:0, w:833, h:843
   - 動作：發送訊息「預約」
   - 功能：開始預約流程

2. **查詢** (中)
   - 位置：x:833, y:0, w:834, h:843
   - 動作：發送訊息「查詢」
   - 功能：查詢預約記錄

3. **療程** (右)
   - 位置：x:1667, y:0, w:833, h:843
   - 動作：發送訊息「療程」
   - 功能：查看療程資訊

#### 下排（2個按鈕）
4. **後台管理** (左)
   - 位置：x:0, y:843, w:1250, h:843
   - 動作：開啟網址 `https://rad-paletas-14483a.netlify.app/admin`
   - 功能：進入後台管理系統

5. **聯絡我們** (右)
   - 位置：x:1250, y:843, w:1250, h:843
   - 動作：發送訊息「聯絡我們」
   - 功能：取得聯絡資訊

## 設計建議

### 視覺風格
- 使用粉色系配色，與 FLOS 曜診所品牌一致
- 簡潔的圖示和文字
- 清楚的區域分隔
- 高對比度確保可讀性

### 圖示建議
- 預約：📅 日曆圖示
- 查詢：🔍 搜尋圖示
- 療程：💫 星星圖示
- 後台：⚙️ 設定圖示
- 聯絡：📞 電話圖示

### 文字
- 使用大字體（建議 48-64px）
- 粗體字型
- 白色文字搭配深色背景，或深色文字搭配淺色背景

## 上傳步驟

### 方法 1：使用腳本（推薦）

1. 確保已設定環境變數：
```bash
export LINE_CHANNEL_ACCESS_TOKEN="your_access_token"
```

2. 執行上傳腳本：
```bash
cd /home/ubuntu/netlify-site
node scripts/upload-rich-menu.js upload /path/to/rich-menu-v4.png
```

3. 腳本會自動：
   - 建立 Rich Menu
   - 上傳圖片
   - 設定為預設選單

### 方法 2：使用 LINE Developers Console

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Provider 和 Messaging API Channel
3. 進入「Messaging API」→「Rich menus」
4. 點擊「Create」
5. 上傳圖片並設定區域
6. 設定為預設選單

### 方法 3：使用 API

```bash
# 1. 建立 Rich Menu
curl -X POST https://api.line.me/v2/bot/richmenu \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "size": {"width": 2500, "height": 1686},
    "selected": true,
    "name": "邊美醬主選單 v4",
    "chatBarText": "選單",
    "areas": [...]
  }'

# 2. 上傳圖片
curl -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @rich-menu-v4.png

# 3. 設定為預設
curl -X POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId} \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}"
```

## 管理指令

### 列出所有 Rich Menu
```bash
node scripts/upload-rich-menu.js list
```

### 刪除 Rich Menu
```bash
curl -X DELETE https://api.line.me/v2/bot/richmenu/{richMenuId} \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}"
```

### 取得預設 Rich Menu
```bash
curl -X GET https://api.line.me/v2/bot/user/all/richmenu \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}"
```

## 測試

上傳完成後：

1. 在 LINE 中開啟邊美醬聊天室
2. 點擊左下角的選單按鈕
3. 確認 Rich Menu 正確顯示
4. 測試每個區域的點擊功能：
   - 預約 → 應開始預約流程
   - 查詢 → 應顯示預約記錄
   - 療程 → 應顯示療程資訊
   - 後台 → 應開啟後台網站
   - 聯絡 → 應顯示聯絡資訊

## 注意事項

1. **圖片大小**：確保圖片不超過 1MB
2. **尺寸精確**：必須是 2500x1686px
3. **格式**：僅支援 PNG 和 JPEG
4. **區域座標**：確保區域不重疊且完全覆蓋圖片
5. **測試**：上傳前先在設計工具中標記區域確認位置

## 更新流程

如需更新 Rich Menu：

1. 設計新的圖片
2. 使用腳本上傳新的 Rich Menu
3. 舊的預設 Rich Menu 會自動被取代
4. 如需保留舊版本，先使用 API 取消預設設定

## 疑難排解

### 圖片無法上傳
- 檢查檔案大小是否超過 1MB
- 確認圖片尺寸為 2500x1686px
- 確認格式為 PNG 或 JPEG

### 點擊無反應
- 檢查區域座標是否正確
- 確認 action 設定正確
- 測試 webhook 是否正常運作

### 選單未顯示
- 確認已設定為預設 Rich Menu
- 檢查用戶是否已加入好友
- 嘗試重新開啟聊天室

## 相關資源

- [LINE Rich Menu API 文件](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
- [Rich Menu 設計指南](https://developers.line.biz/en/docs/messaging-api/rich-menu-design-guide/)
- [Rich Menu 範例](https://developers.line.biz/en/docs/messaging-api/rich-menu-examples/)
