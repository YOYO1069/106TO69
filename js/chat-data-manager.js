/**
 * 聊天資料管理器
 * 整合 Google Sheets API，統一管理聊天資料格式
 */
class ChatDataManager {
    constructor() {
        this.spreadsheetId = '1nmFj0647LO44Gl54DvZEXdNYuZlFLGvueEM1XEqEa8g';
        this.apiKey = null;
        this.accessToken = null;
        this.isInitialized = false;
        
        // 標準化的聊天資料格式
        this.standardFormat = {
            timestamp: '',          // 時間戳記
            platform: '',           // 平台 (LINE, Instagram, Facebook, 電話, 現場)
            customerName: '',       // 客戶姓名
            customerPhone: '',      // 客戶電話
            customerEmail: '',      // 客戶信箱
            inquiryType: '',        // 詢問類型 (預約, 諮詢, 價格, 其他)
            treatment: '',          // 療程項目
            messageContent: '',     // 對話內容
            customerIntent: '',     // 客戶意圖
            responseStatus: '',     // 回應狀態 (已回應, 待回應, 已預約)
            appointmentDate: '',    // 預約日期
            followUpRequired: '',   // 是否需要追蹤
            notes: '',             // 備註
            leadScore: 0,          // 潛在客戶評分 (1-10)
            conversionStatus: ''   // 轉換狀態 (潛在客戶, 已預約, 已完成, 已流失)
        };
        
        this.init();
    }
    
    /**
     * 初始化聊天資料管理器
     */
    async init() {
        try {
            // 從 Google 整合管理器獲取認證
            if (window.googleManager && window.googleManager.isSignedIn) {
                this.accessToken = window.googleManager.currentUser.getAuthResponse().access_token;
            }
            
            // 載入 Google Sheets API
            await this.loadGoogleSheetsAPI();
            
            this.isInitialized = true;
            console.log('✅ 聊天資料管理器初始化完成');
        } catch (error) {
            console.error('❌ 聊天資料管理器初始化失敗:', error);
        }
    }
    
    /**
     * 載入 Google Sheets API
     */
    async loadGoogleSheetsAPI() {
        if (window.gapi && window.gapi.client) {
            await window.gapi.client.load('sheets', 'v4');
            return;
        }
        
        // 如果 gapi 未載入，等待 Google 整合管理器完成初始化
        return new Promise((resolve) => {
            const checkGapi = () => {
                if (window.gapi && window.gapi.client) {
                    window.gapi.client.load('sheets', 'v4').then(resolve);
                } else {
                    setTimeout(checkGapi, 100);
                }
            };
            checkGapi();
        });
    }
    
    /**
     * 讀取 Google Sheets 資料
     */
    async readSheetData(range = 'A:Z') {
        if (!this.isInitialized) {
            throw new Error('聊天資料管理器未初始化');
        }
        
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range
            });
            
            return response.result.values || [];
        } catch (error) {
            console.error('讀取 Google Sheets 失敗:', error);
            throw error;
        }
    }
    
    /**
     * 寫入資料到 Google Sheets
     */
    async writeSheetData(range, values) {
        if (!this.isInitialized) {
            throw new Error('聊天資料管理器未初始化');
        }
        
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            });
            
            return response.result;
        } catch (error) {
            console.error('寫入 Google Sheets 失敗:', error);
            throw error;
        }
    }
    
    /**
     * 新增資料到 Google Sheets
     */
    async appendSheetData(range, values) {
        if (!this.isInitialized) {
            throw new Error('聊天資料管理器未初始化');
        }
        
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: values
                }
            });
            
            return response.result;
        } catch (error) {
            console.error('新增到 Google Sheets 失敗:', error);
            throw error;
        }
    }
    
    /**
     * 標準化聊天資料格式
     */
    standardizeData(rawData) {
        const standardized = { ...this.standardFormat };
        
        // 根據原始資料的格式進行轉換
        if (Array.isArray(rawData)) {
            // 如果是陣列格式 (來自 Google Sheets)
            const [
                timestamp, platform, customerName, customerPhone, customerEmail,
                inquiryType, treatment, messageContent, customerIntent, responseStatus,
                appointmentDate, followUpRequired, notes, leadScore, conversionStatus
            ] = rawData;
            
            standardized.timestamp = timestamp || new Date().toISOString();
            standardized.platform = platform || '';
            standardized.customerName = customerName || '';
            standardized.customerPhone = customerPhone || '';
            standardized.customerEmail = customerEmail || '';
            standardized.inquiryType = inquiryType || '';
            standardized.treatment = treatment || '';
            standardized.messageContent = messageContent || '';
            standardized.customerIntent = customerIntent || '';
            standardized.responseStatus = responseStatus || '待回應';
            standardized.appointmentDate = appointmentDate || '';
            standardized.followUpRequired = followUpRequired || '';
            standardized.notes = notes || '';
            standardized.leadScore = parseInt(leadScore) || 0;
            standardized.conversionStatus = conversionStatus || '潛在客戶';
        } else if (typeof rawData === 'object') {
            // 如果是物件格式
            Object.keys(standardized).forEach(key => {
                if (rawData.hasOwnProperty(key)) {
                    standardized[key] = rawData[key];
                }
            });
        }
        
        return standardized;
    }
    
    /**
     * 分析聊天內容並自動填充資訊
     */
    async analyzeAndEnrichData(chatData) {
        try {
            // 使用 AI 分析聊天內容
            const analysis = await this.analyzeWithAI(chatData.messageContent);
            
            // 根據分析結果補充資訊
            const enrichedData = { ...chatData };
            
            if (analysis.inquiryType) {
                enrichedData.inquiryType = analysis.inquiryType;
            }
            
            if (analysis.treatment) {
                enrichedData.treatment = analysis.treatment;
            }
            
            if (analysis.customerIntent) {
                enrichedData.customerIntent = analysis.customerIntent;
            }
            
            if (analysis.leadScore) {
                enrichedData.leadScore = analysis.leadScore;
            }
            
            if (analysis.followUpRequired) {
                enrichedData.followUpRequired = analysis.followUpRequired;
            }
            
            return enrichedData;
        } catch (error) {
            console.error('資料分析和補充失敗:', error);
            return chatData;
        }
    }
    
    /**
     * 使用 AI 分析聊天內容
     */
    async analyzeWithAI(messageContent) {
        try {
            const response = await fetch('/.netlify/functions/google-services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'gemini_analyze_chat',
                    data: {
                        messageContent: messageContent
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return result.analysis;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('AI 分析失敗:', error);
            
            // 回退到基本的關鍵字分析
            return this.basicKeywordAnalysis(messageContent);
        }
    }
    
    /**
     * 基本關鍵字分析 (AI 分析的回退方案)
     */
    basicKeywordAnalysis(messageContent) {
        const content = messageContent.toLowerCase();
        const analysis = {
            inquiryType: '其他',
            treatment: '',
            customerIntent: '',
            leadScore: 5,
            followUpRequired: '是'
        };
        
        // 詢問類型分析
        if (content.includes('預約') || content.includes('約診') || content.includes('掛號')) {
            analysis.inquiryType = '預約';
            analysis.leadScore = 8;
        } else if (content.includes('價格') || content.includes('費用') || content.includes('多少錢')) {
            analysis.inquiryType = '價格';
            analysis.leadScore = 6;
        } else if (content.includes('諮詢') || content.includes('詢問') || content.includes('了解')) {
            analysis.inquiryType = '諮詢';
            analysis.leadScore = 7;
        }
        
        // 療程分析
        const treatments = [
            '肉毒桿菌', '玻尿酸', '雷射', '音波拉皮', '電波拉皮',
            '淨膚雷射', '皮秒雷射', '飛梭雷射', '除毛', '美白針',
            '水光針', '童顏針', '埋線拉皮', '抽脂', '隆鼻'
        ];
        
        for (const treatment of treatments) {
            if (content.includes(treatment)) {
                analysis.treatment = treatment;
                break;
            }
        }
        
        // 客戶意圖分析
        if (content.includes('想要') || content.includes('希望') || content.includes('需要')) {
            analysis.customerIntent = '有明確需求';
            analysis.leadScore += 1;
        } else if (content.includes('考慮') || content.includes('想了解')) {
            analysis.customerIntent = '考慮中';
        } else if (content.includes('比較') || content.includes('其他家')) {
            analysis.customerIntent = '比較階段';
            analysis.leadScore -= 1;
        }
        
        return analysis;
    }
    
    /**
     * 批量處理和統一格式
     */
    async batchProcessData() {
        try {
            // 讀取所有資料
            const rawData = await this.readSheetData();
            
            if (rawData.length === 0) {
                console.log('沒有資料需要處理');
                return;
            }
            
            // 檢查是否有標題行
            const hasHeader = rawData[0] && rawData[0][0] && 
                             (rawData[0][0].includes('時間') || rawData[0][0].includes('timestamp'));
            
            const dataRows = hasHeader ? rawData.slice(1) : rawData;
            const processedData = [];
            
            // 處理每一行資料
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                
                // 標準化格式
                let standardizedData = this.standardizeData(row);
                
                // AI 分析和補充資訊
                if (standardizedData.messageContent) {
                    standardizedData = await this.analyzeAndEnrichData(standardizedData);
                }
                
                // 轉換為陣列格式準備寫回 Google Sheets
                const processedRow = [
                    standardizedData.timestamp,
                    standardizedData.platform,
                    standardizedData.customerName,
                    standardizedData.customerPhone,
                    standardizedData.customerEmail,
                    standardizedData.inquiryType,
                    standardizedData.treatment,
                    standardizedData.messageContent,
                    standardizedData.customerIntent,
                    standardizedData.responseStatus,
                    standardizedData.appointmentDate,
                    standardizedData.followUpRequired,
                    standardizedData.notes,
                    standardizedData.leadScore,
                    standardizedData.conversionStatus
                ];
                
                processedData.push(processedRow);
                
                // 顯示處理進度
                this.updateProgress(i + 1, dataRows.length);
            }
            
            // 準備標題行
            const headers = [
                '時間戳記', '平台', '客戶姓名', '客戶電話', '客戶信箱',
                '詢問類型', '療程項目', '對話內容', '客戶意圖', '回應狀態',
                '預約日期', '需要追蹤', '備註', '潛在客戶評分', '轉換狀態'
            ];
            
            // 寫回 Google Sheets
            const allData = [headers, ...processedData];
            await this.writeSheetData('A:O', allData);
            
            console.log(`✅ 批量處理完成，共處理 ${processedData.length} 筆資料`);
            
            // 顯示處理結果統計
            this.showProcessingResults(processedData);
            
        } catch (error) {
            console.error('批量處理失敗:', error);
            throw error;
        }
    }
    
    /**
     * 更新處理進度
     */
    updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        console.log(`處理進度: ${current}/${total} (${percentage}%)`);
        
        // 更新 UI 進度條
        const progressBar = document.getElementById('processingProgress');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
        }
    }
    
    /**
     * 顯示處理結果統計
     */
    showProcessingResults(processedData) {
        const stats = {
            total: processedData.length,
            platforms: {},
            inquiryTypes: {},
            treatments: {},
            avgLeadScore: 0
        };
        
        let totalLeadScore = 0;
        
        processedData.forEach(row => {
            const [, platform, , , , inquiryType, treatment, , , , , , , leadScore] = row;
            
            // 平台統計
            stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
            
            // 詢問類型統計
            stats.inquiryTypes[inquiryType] = (stats.inquiryTypes[inquiryType] || 0) + 1;
            
            // 療程統計
            if (treatment) {
                stats.treatments[treatment] = (stats.treatments[treatment] || 0) + 1;
            }
            
            // 潛在客戶評分
            totalLeadScore += parseInt(leadScore) || 0;
        });
        
        stats.avgLeadScore = Math.round(totalLeadScore / processedData.length);
        
        console.log('📊 處理結果統計:', stats);
        
        // 更新 UI 顯示統計結果
        this.updateStatsDisplay(stats);
    }
    
    /**
     * 更新統計顯示
     */
    updateStatsDisplay(stats) {
        const statsContainer = document.getElementById('processingStats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <h5>總資料筆數</h5>
                        <div class="stat-number">${stats.total}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h5>平均潛客評分</h5>
                        <div class="stat-number">${stats.avgLeadScore}/10</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h5>主要平台</h5>
                        <div class="stat-text">${Object.keys(stats.platforms)[0] || 'N/A'}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h5>主要詢問</h5>
                        <div class="stat-text">${Object.keys(stats.inquiryTypes)[0] || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 新增單筆聊天資料
     */
    async addChatData(chatData) {
        try {
            // 標準化格式
            let standardizedData = this.standardizeData(chatData);
            
            // AI 分析和補充
            standardizedData = await this.analyzeAndEnrichData(standardizedData);
            
            // 轉換為陣列格式
            const rowData = [
                standardizedData.timestamp || new Date().toISOString(),
                standardizedData.platform,
                standardizedData.customerName,
                standardizedData.customerPhone,
                standardizedData.customerEmail,
                standardizedData.inquiryType,
                standardizedData.treatment,
                standardizedData.messageContent,
                standardizedData.customerIntent,
                standardizedData.responseStatus,
                standardizedData.appointmentDate,
                standardizedData.followUpRequired,
                standardizedData.notes,
                standardizedData.leadScore,
                standardizedData.conversionStatus
            ];
            
            // 新增到 Google Sheets
            await this.appendSheetData('A:O', [rowData]);
            
            console.log('✅ 新增聊天資料成功');
            return standardizedData;
        } catch (error) {
            console.error('新增聊天資料失敗:', error);
            throw error;
        }
    }
    
    /**
     * 匯出處理後的資料
     */
    async exportProcessedData(format = 'json') {
        try {
            const data = await this.readSheetData();
            
            if (format === 'json') {
                const jsonData = JSON.stringify(data, null, 2);
                this.downloadFile(jsonData, 'chat-data.json', 'application/json');
            } else if (format === 'csv') {
                const csvData = data.map(row => row.join(',')).join('\n');
                this.downloadFile(csvData, 'chat-data.csv', 'text/csv');
            }
        } catch (error) {
            console.error('匯出資料失敗:', error);
            throw error;
        }
    }
    
    /**
     * 下載檔案
     */
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// 全域實例
window.chatDataManager = new ChatDataManager();

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatDataManager;
}
