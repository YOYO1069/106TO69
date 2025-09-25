#!/usr/bin/env node

/**
 * LINE Bot 功能測試腳本
 * 劉道玄諮詢師預約系統
 */

const https = require('https');
const crypto = require('crypto');

// LINE Bot 配置
const LINE_CONFIG = {
    CHANNEL_SECRET: '8462dca808786d5b624f8c2042dedd06',
    CHANNEL_ACCESS_TOKEN: 'Jj8s+B0kNFfpjcbDBDCDjKjJDNlmK8ykGYKWKzmaDT/rEjXoyZi7Y22feHOSXTlKTdZFs3kd1Hxw59MgilIVJzFKg0tKJOKK1xv/ZTZ+oaUuNmUdui/QIbHwNorVo6BW0yHo7eG7vdJJvY9/wxtsfQdB04t89/1O/w1cDnyilFU=',
    WEBHOOK_URL: 'https://sage-marigold-0f346a.netlify.app/.netlify/functions/line-webhook'
};

// 生成 LINE 簽名
function generateSignature(body, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');
}

// 測試 Webhook 連接
async function testWebhook() {
    console.log('🧪 測試 LINE Bot Webhook...\n');
    
    const testMessage = {
        events: [{
            type: 'message',
            message: {
                type: 'text',
                text: '我要預約'
            },
            replyToken: 'test-reply-token-12345',
            source: { userId: 'test-user-id-12345' },
            timestamp: Date.now()
        }]
    };
    
    const body = JSON.stringify(testMessage);
    const signature = generateSignature(body, LINE_CONFIG.CHANNEL_SECRET);
    
    const options = {
        hostname: 'sage-marigold-0f346a.netlify.app',
        port: 443,
        path: '/.netlify/functions/line-webhook',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'X-Line-Signature': signature,
            'User-Agent': 'LINE-Bot-Test/1.0'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 回應狀態: ${res.statusCode}`);
                console.log(`📋 回應標頭:`, res.headers);
                console.log(`💬 回應內容: ${data}\n`);
                
                if (res.statusCode === 200) {
                    console.log('✅ Webhook 測試成功！');
                } else {
                    console.log('❌ Webhook 測試失敗');
                }
                
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ 連接錯誤:', error.message);
            reject(error);
        });
        
        req.write(body);
        req.end();
    });
}

// 測試 LINE Messaging API
async function testLineAPI() {
    console.log('🔗 測試 LINE Messaging API...\n');
    
    const testData = JSON.stringify({
        to: 'test-user-id',
        messages: [{
            type: 'text',
            text: '這是測試訊息'
        }]
    });
    
    const options = {
        hostname: 'api.line.me',
        port: 443,
        path: '/v2/bot/message/push',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_CONFIG.CHANNEL_ACCESS_TOKEN}`,
            'Content-Length': Buffer.byteLength(testData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 API 回應狀態: ${res.statusCode}`);
                console.log(`💬 API 回應內容: ${data}\n`);
                
                if (res.statusCode === 200 || res.statusCode === 400) {
                    console.log('✅ LINE API 連接正常！');
                    console.log('ℹ️  400 錯誤是正常的（測試用戶 ID 不存在）');
                } else {
                    console.log('❌ LINE API 連接失敗');
                }
                
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ API 連接錯誤:', error.message);
            reject(error);
        });
        
        req.write(testData);
        req.end();
    });
}

// 驗證配置
function validateConfig() {
    console.log('🔍 驗證 LINE Bot 配置...\n');
    
    console.log('📋 配置資訊:');
    console.log(`   Channel Secret: ${LINE_CONFIG.CHANNEL_SECRET.substring(0, 8)}...`);
    console.log(`   Access Token: ${LINE_CONFIG.CHANNEL_ACCESS_TOKEN.substring(0, 20)}...`);
    console.log(`   Webhook URL: ${LINE_CONFIG.WEBHOOK_URL}\n`);
    
    const isValid = LINE_CONFIG.CHANNEL_SECRET && 
                   LINE_CONFIG.CHANNEL_ACCESS_TOKEN && 
                   LINE_CONFIG.WEBHOOK_URL;
    
    if (isValid) {
        console.log('✅ 配置驗證通過\n');
        return true;
    } else {
        console.log('❌ 配置不完整\n');
        return false;
    }
}

// 主要測試函數
async function main() {
    console.log('🤖 LINE Bot 功能測試');
    console.log('劉道玄諮詢師預約系統');
    console.log('='.repeat(50) + '\n');
    
    // 驗證配置
    if (!validateConfig()) {
        process.exit(1);
    }
    
    try {
        // 測試 Webhook
        await testWebhook();
        
        console.log('\n' + '-'.repeat(50) + '\n');
        
        // 測試 LINE API
        await testLineAPI();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 所有測試完成！');
        console.log('\n📋 下一步:');
        console.log('1. 在 LINE Developers Console 驗證 Webhook');
        console.log('2. 加入 LINE 官方帳號: https://lin.ee/vb6ULgR');
        console.log('3. 發送測試訊息: "預約"、"療程"、"你好"');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
        process.exit(1);
    }
}

// 執行測試
if (require.main === module) {
    main();
}

module.exports = {
    testWebhook,
    testLineAPI,
    validateConfig,
    LINE_CONFIG
};
