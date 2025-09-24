# Netlify 部署故障排除指南

## 🚨 **404 錯誤解決方案**

### 問題描述
部署到 Netlify 後出現「找不到頁面」錯誤，顯示 404 狀態。

### 🔍 **常見原因和解決方案**

#### 1. **檔案結構問題**
**症狀**: 上傳後找不到 index.html
**解決方案**:
```bash
# 確保 index.html 在根目錄
/
├── index.html          ✅ 必須在根目錄
├── css/
├── js/
└── netlify/
```

#### 2. **ZIP 檔案結構錯誤**
**症狀**: ZIP 檔案包含額外的資料夾層級
**解決方案**:
- 確保 ZIP 檔案直接包含 index.html，而不是在子資料夾中
- 重新打包：`zip -r project.zip . -x "*.zip"`

#### 3. **netlify.toml 配置問題**
**症狀**: 重定向規則不正確
**解決方案**:
```toml
[build]
  publish = "."
  command = "echo 'Build complete'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 4. **_redirects 檔案缺失**
**症狀**: SPA 路由無法正常工作
**解決方案**:
創建 `_redirects` 檔案：
```
/*    /index.html   200
```

### 🛠️ **立即修復步驟**

#### 步驟 1: 檢查部署狀態
1. 登入 [Netlify Dashboard](https://app.netlify.com/)
2. 選擇您的網站
3. 查看 **Deploys** 頁面
4. 檢查最新部署是否成功

#### 步驟 2: 檢查檔案結構
1. 在 Netlify 中點擊 **Site overview**
2. 點擊 **Browse production deploy**
3. 確認 `index.html` 在根目錄

#### 步驟 3: 重新部署
如果檔案結構正確但仍有問題：
1. 前往 **Deploys** 頁面
2. 點擊 **Trigger deploy** → **Deploy site**
3. 等待重新部署完成

#### 步驟 4: 使用修復版本
使用我們提供的修復版本：
1. 下載 `liu-daoxuan-advanced-calendar-integration-v1.0.0.zip`
2. 確保包含以下修復：
   - ✅ 正確的 DOCTYPE 聲明
   - ✅ _redirects 檔案
   - ✅ netlify.toml 配置
   - ✅ 測試頁面 (deploy-check.html)

### 🧪 **測試和驗證**

#### 測試頁面
訪問以下測試頁面確認部署狀態：
- `/deploy-check.html` - 部署狀態檢查
- `/test.html` - 簡單測試頁面

#### 驗證清單
- [ ] 主頁面 (`/`) 正常載入
- [ ] CSS 樣式正確顯示
- [ ] JavaScript 功能正常
- [ ] 導航連結正常工作
- [ ] 子頁面可以訪問

### 🔧 **進階故障排除**

#### 檢查瀏覽器控制台
1. 按 F12 開啟開發者工具
2. 查看 **Console** 頁面
3. 檢查是否有 JavaScript 錯誤
4. 查看 **Network** 頁面檢查資源載入

#### 檢查 Netlify 日誌
1. 在 Netlify Dashboard 中選擇網站
2. 前往 **Functions** 頁面
3. 查看函數執行日誌
4. 檢查是否有錯誤訊息

#### 清除快取
1. 在 Netlify 中前往 **Site settings**
2. 點擊 **Build & deploy**
3. 點擊 **Clear cache and deploy site**

### 📞 **聯繫支援**

如果問題仍然存在：

#### Netlify 官方支援
- **文檔**: [https://docs.netlify.com/](https://docs.netlify.com/)
- **社群**: [https://community.netlify.com/](https://community.netlify.com/)
- **支援**: [https://www.netlify.com/support/](https://www.netlify.com/support/)

#### 提供以下資訊
1. **網站 URL**: 您的 Netlify 網站地址
2. **錯誤訊息**: 完整的錯誤訊息截圖
3. **部署日誌**: Netlify 部署日誌
4. **瀏覽器資訊**: 瀏覽器類型和版本

### 🚀 **預防措施**

#### 部署前檢查
1. **本地測試**: 確保在本地環境正常運行
2. **檔案結構**: 確認 index.html 在根目錄
3. **路徑檢查**: 確保所有連結使用相對路徑
4. **資源檢查**: 確保 CSS/JS 檔案路徑正確

#### 最佳實踐
1. **使用相對路徑**: 避免絕對路徑問題
2. **測試頁面**: 包含簡單的測試頁面
3. **錯誤處理**: 添加適當的錯誤處理
4. **文檔記錄**: 保持部署文檔更新

---

## 🎯 **快速修復命令**

如果您有 Netlify CLI：

```bash
# 安裝 Netlify CLI
npm install -g netlify-cli

# 登入
netlify login

# 部署
netlify deploy --prod --dir .
```

**記住：大多數 404 錯誤都是由於檔案結構或配置問題造成的，按照上述步驟通常可以解決。**
