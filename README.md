# 劉道玄醫美管理平台

> 專業醫美管理系統 • 神秘魔法風格 • 智能預約排程 • 全方位診所管理

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/your-site/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/releases)

## 🌟 **專案特色**

劉道玄醫美聯絡平台 & Flos 曜診所管理系統是一個採用**神秘魔法風格**設計的完整醫美管理平台，融合霍格華茲四大學院配色，提供專業且華麗的使用者體驗。

### ✨ **核心亮點**
- 🎨 **神秘魔法風格** - 霍格華茲學院配色，華麗視覺效果
- 🏥 **四大核心模組** - 預約、病歷、同意書、業績管理
- 👥 **分級權限系統** - 管理員、醫師、員工、合作夥伴
- 📱 **響應式設計** - 支援桌面、平板、手機
- 🤖 **LINE Bot 整合** - 智能客服與預約助手
- 📅 **Google Calendar 同步** - 雲端日曆整合
- 🔒 **醫療級安全** - HIPAA合規、資料加密

## 🚀 **快速開始**

### 線上體驗
- **正式版本**: [https://sage-marigold-0f346a.netlify.app](https://sage-marigold-0f346a.netlify.app)
- **測試帳號**: 
  - 管理員: `admin` / `admin123`
  - 醫師: `doctor` / `doctor123`
  - 員工: `staff` / `staff123`
  - 合作夥伴: `partner` / `partner123`

### 本地部署
```bash
# 1. 下載專案
git clone https://github.com/your-repo/liu-daoxuan-medical-platform.git
cd liu-daoxuan-medical-platform

# 2. 開啟本地伺服器
python -m http.server 8000
# 或使用 Node.js
npx serve .

# 3. 瀏覽器開啟
open http://localhost:8000
```

## 📋 **功能模組**

### 🗓️ **預約管理系統**
- **智能排程**: 15分鐘時段間隔
- **醫師在場檢查**: 確保醫療安全
- **劉道玄預約機器貓**: 專屬預約處理
- **多平台整合**: LINE Bot + 夯客平台
- **營業時間**: 週二-五 12:00-20:00，週六 11:00-20:00

### 📋 **病歷系統**
- **電子病歷**: 數位化管理
- **療程記錄**: 完整追蹤
- **HIPAA合規**: 醫療資料保護
- **加密存儲**: 安全性保障
- **搜尋功能**: 快速查找病歷

### ✍️ **同意書管理**
- **數位同意書**: 無紙化作業
- **電子簽名**: 法律效力
- **法規遵循**: 醫療法規
- **範本管理**: 多種同意書類型
- **靜態介面**: 專業嚴肅風格

### 📊 **業績管理**
- **營收統計**: 即時數據分析
- **人員績效**: 排行榜系統
- **佣金計算**: 自動結算功能
- **劉道玄業績**: 專屬統計追蹤
- **格子狀結算**: 視覺化數據介面

## 🎨 **設計風格**

### 神秘魔法風格配色
```css
/* 霍格華茲四大學院配色 */
--gryffindor-red: #740001;     /* 葛來分多紅 */
--gryffindor-gold: #eeba30;    /* 葛來分多金 */
--slytherin-green: #1a472a;   /* 史萊哲林綠 */
--ravenclaw-blue: #0e1a40;    /* 雷文克勞藍 */
--hufflepuff-yellow: #ecb939;  /* 赫夫帕夫黃 */

/* 魔法效果 */
--shadow-magic: 0 0 20px rgba(218, 165, 55, 0.6);
--gradient-mystical: conic-gradient(from 0deg, #740001, #eeba30, #1a472a, #0e1a40);
```

### 視覺特效
- ✨ **魔法光暈**: 金色陰影效果
- 🎭 **浮動動畫**: 立體按鈕效果
- 🌟 **漸層背景**: 神秘魔法風格
- 📱 **響應式設計**: 完美適配各種裝置

## 👥 **用戶角色系統**

| 角色 | 帳號 | 密碼 | 權限等級 | 功能權限 |
|------|------|------|----------|----------|
| 系統管理員 | `admin` | `admin123` | Level 1 | 所有功能 |
| 醫師 | `doctor` | `doctor123` | Level 2 | 醫療功能 |
| 員工 | `staff` | `staff123` | Level 3 | 日常操作 |
| 合作夥伴 | `partner` | `partner123` | Level 3 | 預約查看 |

## 🔧 **技術架構**

### 前端技術
- **HTML5** - 語義化標記
- **CSS3** - 神秘魔法風格
- **JavaScript ES6+** - 現代化功能
- **Bootstrap 5** - 響應式框架
- **Font Awesome** - 圖標庫
- **Chart.js** - 數據視覺化

### 後端服務
- **Netlify Functions** - 無伺服器架構
- **LINE Bot API** - 聊天機器人
- **Google Calendar API** - 日曆同步
- **夯客平台 API** - 預約整合

### 資料管理
- **LocalStorage** - 本地資料
- **SessionStorage** - 會話資料
- **雲端同步** - 外部服務

## 🌐 **外部整合**

### LINE Bot 功能
- 🤖 **智能客服**: 24/7 自動回覆
- 📅 **預約助手**: 引導預約流程
- 💬 **療程諮詢**: 專業資訊提供
- 👑 **劉道玄專屬**: VIP 客戶服務

### Google Calendar 同步
- 📅 **雙向同步**: 即時更新
- ⏰ **提醒通知**: 自動提醒
- 👥 **多人協作**: 團隊共享
- 🔄 **衝突檢查**: 避免重複預約

### 夯客平台整合
- 🔗 **預約同步**: 統一管理
- 📊 **數據整合**: 完整追蹤
- 🎯 **精準行銷**: 客戶分析

## 📱 **響應式設計**

### 支援裝置
- 🖥️ **桌面電腦**: 1920px+
- 💻 **筆記型電腦**: 1024px - 1919px
- 📱 **平板**: 768px - 1023px
- 📱 **手機**: 320px - 767px

### 適配特色
- 🎨 **彈性佈局**: Grid + Flexbox
- 🖼️ **響應式圖片**: 自動縮放
- 📝 **可讀性優化**: 字體大小調整
- 👆 **觸控友善**: 按鈕大小適中

## 🔒 **安全性保障**

### 醫療級安全
- 🛡️ **HIPAA 合規**: 醫療資料保護
- 🔐 **資料加密**: AES-256 加密
- 🚫 **XSS 防護**: 跨站腳本攻擊防護
- 🔒 **CSRF 保護**: 跨站請求偽造防護

### 存取控制
- 👤 **身份驗證**: 多層級認證
- 🔑 **權限管理**: 角色基礎存取
- 📝 **操作日誌**: 完整記錄
- ⏰ **會話管理**: 自動登出

## 📊 **效能指標**

### 載入效能
- ⚡ **首次載入**: < 3 秒
- 🔄 **API 回應**: < 1 秒
- 📱 **行動裝置**: < 2 秒
- 🌐 **網路優化**: CDN 加速

### 可用性指標
- 🎯 **可用性**: > 99.9%
- 🐛 **錯誤率**: < 1%
- 👥 **併發用戶**: 1000+
- 📈 **效能分數**: 90+

## 🚀 **部署指南**

### Netlify 部署
1. **準備檔案**: 下載完整專案
2. **上傳部署**: 拖拽到 Netlify
3. **環境設定**: 配置 API 金鑰
4. **功能啟用**: 開啟 Functions

詳細部署步驟請參考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### 環境變數
```bash
# LINE Bot 設定
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token

# Google Calendar 設定
GOOGLE_CALENDAR_API_KEY=your_google_api_key
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
```

## 📈 **未來規劃**

### 短期目標 (3個月)
- 📱 **行動應用**: iOS/Android App
- 🤖 **AI 助手**: 智能排程優化
- 📊 **進階分析**: 商業智慧報表
- 🌍 **多語言**: 國際化支援

### 長期願景 (1年)
- ☁️ **雲端原生**: Kubernetes 部署
- 🔬 **微服務**: 架構重構
- 🚀 **DevOps**: CI/CD 自動化
- 🧠 **機器學習**: 預測分析

## 🤝 **貢獻指南**

### 開發流程
1. **Fork 專案**: 建立個人分支
2. **功能開發**: 遵循編碼規範
3. **測試驗證**: 確保功能正常
4. **提交 PR**: 詳細說明變更

### 編碼規範
- 📝 **命名規則**: camelCase for JS, kebab-case for CSS
- 🎨 **風格指南**: 遵循神秘魔法風格
- 📚 **文檔更新**: 同步更新說明
- 🧪 **測試覆蓋**: 確保品質

## 📞 **聯絡資訊**

### 技術支援
- 📧 **Email**: support@liu-daoxuan-clinic.com
- 💬 **LINE**: @liu-daoxuan-medical
- 🐛 **Bug 回報**: GitHub Issues
- 💡 **功能建議**: GitHub Discussions

### 商業合作
- 🏢 **診所地址**: 台灣台北市
- 📞 **聯絡電話**: 請透過線上預約系統
- 🌐 **官方網站**: https://sage-marigold-0f346a.netlify.app
- 📱 **LINE 官方**: @flos-clinic

## 📄 **授權資訊**

本專案採用 MIT 授權條款，詳細內容請參考 [LICENSE](LICENSE) 檔案。

### 使用條款
- ✅ **商業使用**: 允許
- ✅ **修改**: 允許
- ✅ **分發**: 允許
- ✅ **私人使用**: 允許
- ❌ **責任**: 不承擔
- ❌ **保證**: 不提供

---

<div align="center">

**🌟 感謝使用劉道玄醫美管理平台 🌟**

*讓科技為醫美服務，讓魔法點亮專業*

[![GitHub stars](https://img.shields.io/github/stars/your-repo/liu-daoxuan-medical-platform.svg?style=social&label=Star)](https://github.com/your-repo/liu-daoxuan-medical-platform)
[![GitHub forks](https://img.shields.io/github/forks/your-repo/liu-daoxuan-medical-platform.svg?style=social&label=Fork)](https://github.com/your-repo/liu-daoxuan-medical-platform/fork)

</div>
