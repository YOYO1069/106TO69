/**
 * OpenAI 增強版智能分析函數
 * 劉道玄醫師預約系統 - AI 驅動的深度分析和洞察
 */

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (!process.env.OPENAI_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration error',
                    message: 'OpenAI API 金鑰未設定'
                })
            };
        }

        const { action, data } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'analyze_customer_intent':
                return await analyzeCustomerIntent(data, headers);
            
            case 'generate_appointment_insights':
                return await generateAppointmentInsights(data, headers);
            
            case 'optimize_scheduling':
                return await optimizeScheduling(data, headers);
            
            case 'analyze_customer_sentiment':
                return await analyzeCustomerSentiment(data, headers);
            
            case 'generate_marketing_insights':
                return await generateMarketingInsights(data, headers);
            
            case 'predict_customer_behavior':
                return await predictCustomerBehavior(data, headers);
            
            case 'generate_personalized_recommendations':
                return await generatePersonalizedRecommendations(data, headers);
            
            case 'analyze_business_performance':
                return await analyzeBusinessPerformance(data, headers);
            
            case 'generate_follow_up_messages':
                return await generateFollowUpMessages(data, headers);
            
            case 'extract_data_insights':
                return await extractDataInsights(data, headers);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid action',
                        message: '不支援的 AI 分析操作'
                    })
                };
        }

    } catch (error) {
        console.error('OpenAI Enhanced Analytics Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'AI 分析服務發生錯誤',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

/**
 * 分析客戶意圖和需求
 */
async function analyzeCustomerIntent(data, headers) {
    try {
        const { customerMessage, customerHistory, appointmentData } = data;

        const prompt = `
作為劉道玄醫師的專業AI分析師，請分析以下客戶資訊：

客戶訊息：${customerMessage}
客戶歷史：${JSON.stringify(customerHistory, null, 2)}
預約資料：${JSON.stringify(appointmentData, null, 2)}

請提供以下分析：
1. 客戶主要意圖和需求
2. 推薦的療程項目
3. 客戶的緊急程度評估
4. 預算範圍推測
5. 最佳聯繫時機
6. 個人化建議

請以JSON格式回應，包含：
{
  "intent": "主要意圖",
  "needs": ["需求1", "需求2"],
  "recommendedTreatments": ["療程1", "療程2"],
  "urgency": "高/中/低",
  "budgetRange": "預算範圍",
  "bestContactTime": "最佳聯繫時間",
  "personalizedAdvice": "個人化建議",
  "confidence": "信心度(0-100)"
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const analysis = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: analysis,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Customer intent analysis failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Analysis failed',
                message: '客戶意圖分析失敗',
                details: error.message
            })
        };
    }
}

/**
 * 生成預約洞察報告
 */
async function generateAppointmentInsights(data, headers) {
    try {
        const { appointments, timeRange, filters } = data;

        const prompt = `
作為劉道玄醫師診所的數據分析專家，請分析以下預約數據：

預約資料：${JSON.stringify(appointments, null, 2)}
時間範圍：${timeRange}
篩選條件：${JSON.stringify(filters, null, 2)}

請提供深度分析報告，包含：
1. 預約趨勢分析
2. 熱門療程排行
3. 客戶來源效果分析
4. 時段偏好分析
5. 季節性模式
6. 改善建議

請以JSON格式回應：
{
  "trends": {
    "growth": "成長趨勢",
    "patterns": ["模式1", "模式2"]
  },
  "popularTreatments": [
    {"treatment": "療程名", "count": 數量, "percentage": 百分比}
  ],
  "sourceAnalysis": {
    "mostEffective": "最有效來源",
    "breakdown": {"來源": 數量}
  },
  "timePreferences": {
    "peakHours": ["熱門時段"],
    "peakDays": ["熱門日期"]
  },
  "seasonalPatterns": "季節性分析",
  "recommendations": ["建議1", "建議2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const insights = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: insights,
                generatedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Appointment insights generation failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Insights generation failed',
                message: '預約洞察生成失敗',
                details: error.message
            })
        };
    }
}

/**
 * 優化排程建議
 */
async function optimizeScheduling(data, headers) {
    try {
        const { currentSchedule, appointmentRequests, constraints } = data;

        const prompt = `
作為劉道玄醫師的智能排程優化專家，請分析並優化以下排程：

當前排程：${JSON.stringify(currentSchedule, null, 2)}
預約請求：${JSON.stringify(appointmentRequests, null, 2)}
限制條件：${JSON.stringify(constraints, null, 2)}

請提供優化建議：
1. 最佳排程安排
2. 時間衝突解決方案
3. 效率提升建議
4. 客戶滿意度優化
5. 醫師工作負荷平衡

請以JSON格式回應：
{
  "optimizedSchedule": [
    {
      "time": "時間",
      "client": "客戶",
      "treatment": "療程",
      "duration": "時長",
      "priority": "優先級"
    }
  ],
  "conflictResolutions": ["解決方案1", "解決方案2"],
  "efficiencyImprovements": ["改善1", "改善2"],
  "satisfactionOptimizations": ["優化1", "優化2"],
  "workloadBalance": "工作負荷分析",
  "estimatedImprovement": "預期改善百分比"
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const optimization = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: optimization,
                optimizedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Scheduling optimization failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Optimization failed',
                message: '排程優化失敗',
                details: error.message
            })
        };
    }
}

/**
 * 分析客戶情感和滿意度
 */
async function analyzeCustomerSentiment(data, headers) {
    try {
        const { customerFeedback, chatHistory, reviewData } = data;

        const prompt = `
作為劉道玄醫師診所的客戶體驗分析專家，請分析以下客戶情感數據：

客戶回饋：${JSON.stringify(customerFeedback, null, 2)}
對話記錄：${JSON.stringify(chatHistory, null, 2)}
評價資料：${JSON.stringify(reviewData, null, 2)}

請提供情感分析報告：
1. 整體滿意度評分
2. 情感趨勢分析
3. 關鍵問題識別
4. 改善機會點
5. 客戶忠誠度預測

請以JSON格式回應：
{
  "overallSentiment": "正面/中性/負面",
  "satisfactionScore": 評分(1-10),
  "sentimentTrends": {
    "positive": 百分比,
    "neutral": 百分比,
    "negative": 百分比
  },
  "keyIssues": ["問題1", "問題2"],
  "improvementOpportunities": ["機會1", "機會2"],
  "loyaltyPrediction": "忠誠度預測",
  "actionItems": ["行動項目1", "行動項目2"],
  "riskCustomers": ["風險客戶列表"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const sentiment = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: sentiment,
                analyzedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Customer sentiment analysis failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Sentiment analysis failed',
                message: '客戶情感分析失敗',
                details: error.message
            })
        };
    }
}

/**
 * 生成行銷洞察
 */
async function generateMarketingInsights(data, headers) {
    try {
        const { campaignData, customerSegments, marketTrends } = data;

        const prompt = `
作為劉道玄醫師診所的行銷策略專家，請分析以下行銷數據：

行銷活動數據：${JSON.stringify(campaignData, null, 2)}
客戶分群：${JSON.stringify(customerSegments, null, 2)}
市場趨勢：${JSON.stringify(marketTrends, null, 2)}

請提供行銷洞察報告：
1. 最有效的行銷管道
2. 目標客群分析
3. 內容策略建議
4. 預算分配優化
5. ROI 改善建議

請以JSON格式回應：
{
  "effectiveChannels": [
    {"channel": "管道", "roi": ROI, "effectiveness": "效果評分"}
  ],
  "targetAudience": {
    "primarySegment": "主要客群",
    "characteristics": ["特徵1", "特徵2"],
    "preferences": ["偏好1", "偏好2"]
  },
  "contentStrategy": {
    "themes": ["主題1", "主題2"],
    "formats": ["格式1", "格式2"],
    "timing": "最佳發布時機"
  },
  "budgetOptimization": {
    "recommendations": ["建議1", "建議2"],
    "reallocation": {"管道": "建議預算百分比"}
  },
  "roiImprovements": ["改善策略1", "改善策略2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const insights = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: insights,
                generatedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Marketing insights generation failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Marketing insights failed',
                message: '行銷洞察生成失敗',
                details: error.message
            })
        };
    }
}

/**
 * 預測客戶行為
 */
async function predictCustomerBehavior(data, headers) {
    try {
        const { customerData, historicalPatterns, externalFactors } = data;

        const prompt = `
作為劉道玄醫師診所的客戶行為預測專家，請分析以下數據：

客戶資料：${JSON.stringify(customerData, null, 2)}
歷史模式：${JSON.stringify(historicalPatterns, null, 2)}
外部因素：${JSON.stringify(externalFactors, null, 2)}

請提供客戶行為預測：
1. 再次預約可能性
2. 推薦療程接受度
3. 客戶生命週期價值
4. 流失風險評估
5. 最佳接觸時機

請以JSON格式回應：
{
  "rebookingProbability": 百分比,
  "treatmentReceptivity": {
    "療程名": 接受度百分比
  },
  "lifetimeValue": 預估價值,
  "churnRisk": "高/中/低",
  "optimalContactTiming": {
    "nextContact": "建議聯繫時間",
    "frequency": "聯繫頻率",
    "method": "最佳聯繫方式"
  },
  "behaviorPatterns": ["行為模式1", "行為模式2"],
  "recommendations": ["建議1", "建議2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const prediction = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: prediction,
                predictedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Customer behavior prediction failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Prediction failed',
                message: '客戶行為預測失敗',
                details: error.message
            })
        };
    }
}

/**
 * 生成個人化推薦
 */
async function generatePersonalizedRecommendations(data, headers) {
    try {
        const { customerProfile, treatmentHistory, preferences } = data;

        const prompt = `
作為劉道玄醫師的個人化療程顧問，請為以下客戶生成推薦：

客戶檔案：${JSON.stringify(customerProfile, null, 2)}
療程歷史：${JSON.stringify(treatmentHistory, null, 2)}
偏好設定：${JSON.stringify(preferences, null, 2)}

請提供個人化推薦：
1. 推薦療程組合
2. 最佳療程時機
3. 預算友善選項
4. 維護計劃
5. 生活方式建議

請以JSON格式回應：
{
  "recommendedTreatments": [
    {
      "treatment": "療程名",
      "reason": "推薦原因",
      "priority": "優先級",
      "estimatedCost": "預估費用",
      "expectedResults": "預期效果",
      "timeline": "建議時程"
    }
  ],
  "optimalTiming": "最佳療程時機",
  "budgetOptions": [
    {"option": "選項", "cost": "費用", "benefits": "效益"}
  ],
  "maintenancePlan": {
    "frequency": "維護頻率",
    "treatments": ["維護療程"],
    "cost": "年度維護費用"
  },
  "lifestyleAdvice": ["建議1", "建議2"],
  "contraindications": ["注意事項1", "注意事項2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const recommendations = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: recommendations,
                generatedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Personalized recommendations failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Recommendations failed',
                message: '個人化推薦生成失敗',
                details: error.message
            })
        };
    }
}

/**
 * 分析業務績效
 */
async function analyzeBusinessPerformance(data, headers) {
    try {
        const { financialData, operationalMetrics, competitorData } = data;

        const prompt = `
作為劉道玄醫師診所的業務分析專家，請分析以下績效數據：

財務數據：${JSON.stringify(financialData, null, 2)}
營運指標：${JSON.stringify(operationalMetrics, null, 2)}
競爭對手數據：${JSON.stringify(competitorData, null, 2)}

請提供業務績效分析：
1. 營收趨勢分析
2. 成本效益分析
3. 競爭力評估
4. 成長機會識別
5. 風險因素分析

請以JSON格式回應：
{
  "revenueAnalysis": {
    "trend": "趨勢",
    "growth": "成長率",
    "projections": "未來預測"
  },
  "costEfficiency": {
    "analysis": "成本分析",
    "optimizations": ["優化建議"]
  },
  "competitivePosition": {
    "ranking": "市場排名",
    "strengths": ["優勢"],
    "weaknesses": ["劣勢"],
    "opportunities": ["機會"]
  },
  "growthOpportunities": [
    {"opportunity": "機會", "potential": "潛力", "investment": "所需投資"}
  ],
  "riskFactors": ["風險1", "風險2"],
  "strategicRecommendations": ["策略建議1", "策略建議2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const analysis = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: analysis,
                analyzedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Business performance analysis failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Performance analysis failed',
                message: '業務績效分析失敗',
                details: error.message
            })
        };
    }
}

/**
 * 生成追蹤訊息
 */
async function generateFollowUpMessages(data, headers) {
    try {
        const { customerData, appointmentHistory, communicationStyle } = data;

        const prompt = `
作為劉道玄醫師的專業客戶關係專員，請為以下客戶生成追蹤訊息：

客戶資料：${JSON.stringify(customerData, null, 2)}
預約歷史：${JSON.stringify(appointmentHistory, null, 2)}
溝通風格：${JSON.stringify(communicationStyle, null, 2)}

請生成不同情境的追蹤訊息：
1. 術後關懷訊息
2. 預約提醒訊息
3. 生日祝福訊息
4. 促銷活動通知
5. 滿意度調查邀請

請以JSON格式回應：
{
  "postTreatmentCare": {
    "immediate": "術後立即關懷",
    "followUp": "後續追蹤",
    "longTerm": "長期關懷"
  },
  "appointmentReminders": {
    "advance": "提前提醒",
    "dayBefore": "前一天提醒",
    "dayOf": "當天提醒"
  },
  "birthdayMessage": "生日祝福訊息",
  "promotionalMessages": [
    {"occasion": "場合", "message": "訊息內容"}
  ],
  "satisfactionSurvey": "滿意度調查邀請",
  "personalizedTouches": ["個人化元素1", "個人化元素2"],
  "communicationTips": ["溝通建議1", "溝通建議2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-3.5-turbo');
        const messages = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: messages,
                generatedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Follow-up messages generation failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Message generation failed',
                message: '追蹤訊息生成失敗',
                details: error.message
            })
        };
    }
}

/**
 * 提取數據洞察
 */
async function extractDataInsights(data, headers) {
    try {
        const { rawData, analysisType, focusAreas } = data;

        const prompt = `
作為劉道玄醫師診所的數據科學專家，請從以下原始數據中提取洞察：

原始數據：${JSON.stringify(rawData, null, 2)}
分析類型：${analysisType}
關注領域：${JSON.stringify(focusAreas, null, 2)}

請提供數據洞察：
1. 關鍵發現
2. 趨勢識別
3. 異常檢測
4. 相關性分析
5. 可行性建議

請以JSON格式回應：
{
  "keyFindings": ["發現1", "發現2"],
  "trends": [
    {"trend": "趨勢", "direction": "方向", "significance": "重要性"}
  ],
  "anomalies": [
    {"anomaly": "異常", "impact": "影響", "recommendation": "建議"}
  ],
  "correlations": [
    {"variables": ["變數1", "變數2"], "strength": "相關強度", "insight": "洞察"}
  ],
  "actionableInsights": ["可行洞察1", "可行洞察2"],
  "dataQuality": "數據品質評估",
  "nextSteps": ["下一步1", "下一步2"]
}
`;

        const aiResponse = await callOpenAI(prompt, 'gpt-4');
        const insights = parseAIResponse(aiResponse);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: insights,
                extractedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Data insights extraction failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Insights extraction failed',
                message: '數據洞察提取失敗',
                details: error.message
            })
        };
    }
}

// ===== 輔助函數 =====

/**
 * 調用 OpenAI API
 */
async function callOpenAI(prompt, model = 'gpt-3.5-turbo', maxTokens = 1500) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: '你是劉道玄醫師診所的專業AI分析師，請提供準確、實用的分析和建議。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API 錯誤: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * 解析 AI 回應
 */
function parseAIResponse(response) {
    try {
        // 嘗試解析 JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // 如果不是 JSON 格式，返回原始回應
        return {
            analysis: response,
            format: 'text'
        };
    } catch (error) {
        console.error('AI response parsing failed:', error);
        return {
            analysis: response,
            format: 'text',
            parseError: error.message
        };
    }
}
