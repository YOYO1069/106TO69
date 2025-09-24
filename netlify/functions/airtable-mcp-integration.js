/**
 * Airtable MCP Server 整合函數
 * 劉道玄醫師預約系統 - Airtable 數據管理整合
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
        // 驗證環境變數
        if (!process.env.AIRTABLE_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration error',
                    message: 'Airtable API 金鑰未設定'
                })
            };
        }

        const { action, data } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'sync_appointment_to_airtable':
                return await syncAppointmentToAirtable(data, headers);
            
            case 'sync_form_to_airtable':
                return await syncFormToAirtable(data, headers);
            
            case 'get_airtable_records':
                return await getAirtableRecords(data, headers);
            
            case 'search_airtable_records':
                return await searchAirtableRecords(data, headers);
            
            case 'create_airtable_record':
                return await createAirtableRecord(data, headers);
            
            case 'update_airtable_record':
                return await updateAirtableRecord(data, headers);
            
            case 'get_airtable_analytics':
                return await getAirtableAnalytics(headers);
            
            case 'setup_airtable_tables':
                return await setupAirtableTables(headers);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid action',
                        message: '不支援的操作類型'
                    })
                };
        }

    } catch (error) {
        console.error('Airtable Integration Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Airtable 整合服務發生錯誤',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

/**
 * 同步預約資料到 Airtable
 */
async function syncAppointmentToAirtable(appointmentData, headers) {
    try {
        const airtableRecord = {
            fields: {
                '客戶姓名': appointmentData.clientName,
                '聯絡電話': appointmentData.clientPhone,
                '電子郵件': appointmentData.clientEmail || '',
                '療程項目': appointmentData.service,
                '預約時間': appointmentData.appointmentTime,
                '預約來源': appointmentData.source,
                '預約狀態': appointmentData.status || '待確認',
                '備註': appointmentData.notes || '',
                '醫師': '劉道玄醫師',
                '建立時間': new Date().toISOString(),
                '年齡': appointmentData.age || null,
                '性別': appointmentData.gender || '',
                '過往療程': appointmentData.previousTreatments || '',
                '過敏史': appointmentData.allergies || '',
                '期望效果': appointmentData.expectedResults || ''
            }
        };

        const response = await createRecordInAirtable('預約管理', airtableRecord);

        // 同時更新客戶資料表
        await syncClientToAirtable({
            name: appointmentData.clientName,
            phone: appointmentData.clientPhone,
            email: appointmentData.clientEmail,
            age: appointmentData.age,
            gender: appointmentData.gender,
            source: appointmentData.source,
            lastAppointment: appointmentData.appointmentTime,
            totalAppointments: 1
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '預約資料已同步到 Airtable',
                data: {
                    airtableRecordId: response.id,
                    appointmentId: appointmentData.id
                }
            })
        };

    } catch (error) {
        console.error('Appointment sync to Airtable failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Sync failed',
                message: '預約同步到 Airtable 失敗',
                details: error.message
            })
        };
    }
}

/**
 * 同步表單資料到 Airtable
 */
async function syncFormToAirtable(formData, headers) {
    try {
        const airtableRecord = {
            fields: {
                '表單ID': formData.id,
                '客戶姓名': formData.clientName,
                '聯絡電話': formData.clientPhone,
                '電子郵件': formData.clientEmail || '',
                '年齡': formData.age || null,
                '性別': formData.gender || '',
                '感興趣療程': formData.service,
                '偏好時間': formData.appointmentTime || '',
                '來源管道': formData.source,
                '表單狀態': formData.status || '待處理',
                '諮詢內容': formData.notes || '',
                '提交時間': formData.createdTime || new Date().toISOString(),
                '處理狀態': '待聯繫',
                '優先級': formData.priority || '一般',
                '預算範圍': formData.budget || '',
                '過往經驗': formData.previousExperience || ''
            }
        };

        const response = await createRecordInAirtable('諮詢表單', airtableRecord);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '表單資料已同步到 Airtable',
                data: {
                    airtableRecordId: response.id,
                    formId: formData.id
                }
            })
        };

    } catch (error) {
        console.error('Form sync to Airtable failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Form sync failed',
                message: '表單同步到 Airtable 失敗',
                details: error.message
            })
        };
    }
}

/**
 * 同步客戶資料到 Airtable
 */
async function syncClientToAirtable(clientData) {
    try {
        // 先搜尋是否已存在該客戶
        const existingClient = await searchRecordsInAirtable('客戶資料', {
            filterByFormula: `{聯絡電話} = "${clientData.phone}"`
        });

        if (existingClient.records && existingClient.records.length > 0) {
            // 更新現有客戶資料
            const clientRecord = existingClient.records[0];
            const updateData = {
                fields: {
                    '最後預約時間': clientData.lastAppointment,
                    '總預約次數': (clientRecord.fields['總預約次數'] || 0) + 1,
                    '最後更新時間': new Date().toISOString(),
                    '客戶狀態': '活躍'
                }
            };

            await updateRecordInAirtable('客戶資料', clientRecord.id, updateData);
        } else {
            // 創建新客戶資料
            const newClientRecord = {
                fields: {
                    '客戶姓名': clientData.name,
                    '聯絡電話': clientData.phone,
                    '電子郵件': clientData.email || '',
                    '年齡': clientData.age || null,
                    '性別': clientData.gender || '',
                    '來源管道': clientData.source,
                    '首次預約時間': clientData.lastAppointment,
                    '最後預約時間': clientData.lastAppointment,
                    '總預約次數': 1,
                    '客戶狀態': '新客戶',
                    '建立時間': new Date().toISOString(),
                    '最後更新時間': new Date().toISOString(),
                    '客戶標籤': ['劉道玄醫師', '醫美客戶'],
                    '生命週期價值': 0,
                    '滿意度評分': null
                }
            };

            await createRecordInAirtable('客戶資料', newClientRecord);
        }

    } catch (error) {
        console.error('Client sync to Airtable failed:', error);
        throw error;
    }
}

/**
 * 獲取 Airtable 記錄
 */
async function getAirtableRecords(data, headers) {
    try {
        const { tableName, maxRecords = 100, view = 'Grid view' } = data;
        
        const response = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=${maxRecords}&view=${encodeURIComponent(view)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Airtable API 錯誤: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: result.records,
                total: result.records.length
            })
        };

    } catch (error) {
        console.error('Get Airtable records failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Get records failed',
                message: '獲取 Airtable 記錄失敗',
                details: error.message
            })
        };
    }
}

/**
 * 搜尋 Airtable 記錄
 */
async function searchAirtableRecords(data, headers) {
    try {
        const { tableName, searchText, fields = [] } = data;
        
        // 構建搜尋公式
        let filterFormula = '';
        if (fields.length > 0) {
            const searchConditions = fields.map(field => 
                `SEARCH("${searchText}", {${field}})`
            ).join(', ');
            filterFormula = `OR(${searchConditions})`;
        } else {
            // 如果沒有指定欄位，搜尋常用欄位
            filterFormula = `OR(SEARCH("${searchText}", {客戶姓名}), SEARCH("${searchText}", {聯絡電話}), SEARCH("${searchText}", {療程項目}))`;
        }

        const response = await searchRecordsInAirtable(tableName, {
            filterByFormula: filterFormula,
            maxRecords: 50
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: response.records || [],
                searchText: searchText,
                total: response.records ? response.records.length : 0
            })
        };

    } catch (error) {
        console.error('Search Airtable records failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Search failed',
                message: 'Airtable 搜尋失敗',
                details: error.message
            })
        };
    }
}

/**
 * 創建 Airtable 記錄
 */
async function createAirtableRecord(data, headers) {
    try {
        const { tableName, fields } = data;
        
        const response = await createRecordInAirtable(tableName, { fields });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '記錄已成功創建',
                data: response
            })
        };

    } catch (error) {
        console.error('Create Airtable record failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Create failed',
                message: '創建 Airtable 記錄失敗',
                details: error.message
            })
        };
    }
}

/**
 * 更新 Airtable 記錄
 */
async function updateAirtableRecord(data, headers) {
    try {
        const { tableName, recordId, fields } = data;
        
        const response = await updateRecordInAirtable(tableName, recordId, { fields });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '記錄已成功更新',
                data: response
            })
        };

    } catch (error) {
        console.error('Update Airtable record failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Update failed',
                message: '更新 Airtable 記錄失敗',
                details: error.message
            })
        };
    }
}

/**
 * 獲取 Airtable 分析數據
 */
async function getAirtableAnalytics(headers) {
    try {
        // 獲取各表格的統計數據
        const appointmentStats = await getTableStats('預約管理');
        const formStats = await getTableStats('諮詢表單');
        const clientStats = await getTableStats('客戶資料');

        // 計算關鍵指標
        const analytics = {
            summary: {
                totalAppointments: appointmentStats.total,
                totalForms: formStats.total,
                totalClients: clientStats.total,
                conversionRate: formStats.total > 0 ? Math.round((appointmentStats.total / formStats.total) * 100) : 0
            },
            appointmentsByStatus: await getRecordsByField('預約管理', '預約狀態'),
            appointmentsBySource: await getRecordsByField('預約管理', '預約來源'),
            appointmentsByService: await getRecordsByField('預約管理', '療程項目'),
            formsByStatus: await getRecordsByField('諮詢表單', '表單狀態'),
            clientsBySource: await getRecordsByField('客戶資料', '來源管道'),
            recentActivity: await getRecentActivity()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Get Airtable analytics failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Analytics failed',
                message: 'Airtable 分析數據獲取失敗',
                details: error.message
            })
        };
    }
}

/**
 * 設定 Airtable 表格結構
 */
async function setupAirtableTables(headers) {
    try {
        // 這個函數用於初始化 Airtable 表格結構
        // 實際使用時需要手動在 Airtable 中創建表格和欄位
        
        const tableStructures = {
            '預約管理': [
                '客戶姓名', '聯絡電話', '電子郵件', '療程項目', '預約時間',
                '預約來源', '預約狀態', '備註', '醫師', '建立時間', '年齡', '性別'
            ],
            '諮詢表單': [
                '表單ID', '客戶姓名', '聯絡電話', '電子郵件', '年齡', '性別',
                '感興趣療程', '偏好時間', '來源管道', '表單狀態', '諮詢內容', '提交時間'
            ],
            '客戶資料': [
                '客戶姓名', '聯絡電話', '電子郵件', '年齡', '性別', '來源管道',
                '首次預約時間', '最後預約時間', '總預約次數', '客戶狀態', '建立時間'
            ]
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Airtable 表格結構資訊',
                data: {
                    tableStructures,
                    instructions: '請在 Airtable 中手動創建這些表格和欄位'
                }
            })
        };

    } catch (error) {
        console.error('Setup Airtable tables failed:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Setup failed',
                message: 'Airtable 表格設定失敗',
                details: error.message
            })
        };
    }
}

// ===== 輔助函數 =====

/**
 * 在 Airtable 中創建記錄
 */
async function createRecordInAirtable(tableName, recordData) {
    const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recordData)
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Airtable 創建記錄失敗: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * 在 Airtable 中搜尋記錄
 */
async function searchRecordsInAirtable(tableName, params) {
    const queryParams = new URLSearchParams(params);
    
    const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${queryParams}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Airtable 搜尋失敗: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 在 Airtable 中更新記錄
 */
async function updateRecordInAirtable(tableName, recordId, updateData) {
    const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        }
    );

    if (!response.ok) {
        throw new Error(`Airtable 更新記錄失敗: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * 獲取表格統計數據
 */
async function getTableStats(tableName) {
    try {
        const response = await searchRecordsInAirtable(tableName, {
            maxRecords: 1,
            fields: ['建立時間']
        });
        
        // 這裡簡化處理，實際應該獲取完整統計
        return {
            total: response.records ? response.records.length : 0
        };
    } catch (error) {
        console.error(`獲取 ${tableName} 統計失敗:`, error);
        return { total: 0 };
    }
}

/**
 * 按欄位分組統計記錄
 */
async function getRecordsByField(tableName, fieldName) {
    try {
        const response = await searchRecordsInAirtable(tableName, {
            fields: [fieldName],
            maxRecords: 100
        });

        const groupedData = {};
        if (response.records) {
            response.records.forEach(record => {
                const value = record.fields[fieldName] || '未分類';
                groupedData[value] = (groupedData[value] || 0) + 1;
            });
        }

        return groupedData;
    } catch (error) {
        console.error(`按 ${fieldName} 分組統計失敗:`, error);
        return {};
    }
}

/**
 * 獲取最近活動
 */
async function getRecentActivity() {
    try {
        // 獲取最近的預約和表單
        const recentAppointments = await searchRecordsInAirtable('預約管理', {
            maxRecords: 5,
            sort: [{ field: '建立時間', direction: 'desc' }]
        });

        const recentForms = await searchRecordsInAirtable('諮詢表單', {
            maxRecords: 5,
            sort: [{ field: '提交時間', direction: 'desc' }]
        });

        return {
            recentAppointments: recentAppointments.records || [],
            recentForms: recentForms.records || []
        };
    } catch (error) {
        console.error('獲取最近活動失敗:', error);
        return {
            recentAppointments: [],
            recentForms: []
        };
    }
}
