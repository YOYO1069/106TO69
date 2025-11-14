const fs = require('fs');
const path = require('path');

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('請設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數');
  process.exit(1);
}

// Rich Menu 設定
const richMenuConfig = {
  size: {
    width: 2500,
    height: 1686
  },
  selected: true,
  name: "邊美醬主選單 v4",
  chatBarText: "選單",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: "message", text: "預約" }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: "message", text: "查詢" }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: "message", text: "療程" }
    },
    {
      bounds: { x: 0, y: 843, width: 1250, height: 843 },
      action: { type: "uri", uri: "https://rad-paletas-14483a.netlify.app/admin" }
    },
    {
      bounds: { x: 1250, y: 843, width: 1250, height: 843 },
      action: { type: "message", text: "聯絡我們" }
    }
  ]
};

async function createRichMenu() {
  try {
    console.log('正在建立 Rich Menu...');
    
    const response = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(richMenuConfig)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`建立 Rich Menu 失敗: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Rich Menu 建立成功！');
    console.log('Rich Menu ID:', data.richMenuId);
    
    return data.richMenuId;
  } catch (error) {
    console.error('❌ 建立 Rich Menu 失敗:', error.message);
    throw error;
  }
}

async function uploadRichMenuImage(richMenuId, imagePath) {
  try {
    console.log('正在上傳 Rich Menu 圖片...');
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: imageBuffer
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`上傳圖片失敗: ${error}`);
    }

    console.log('✅ Rich Menu 圖片上傳成功！');
  } catch (error) {
    console.error('❌ 上傳圖片失敗:', error.message);
    throw error;
  }
}

async function setDefaultRichMenu(richMenuId) {
  try {
    console.log('正在設定為預設 Rich Menu...');
    
    const response = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`設定預設 Rich Menu 失敗: ${error}`);
    }

    console.log('✅ 已設定為預設 Rich Menu！');
  } catch (error) {
    console.error('❌ 設定預設 Rich Menu 失敗:', error.message);
    throw error;
  }
}

async function listRichMenus() {
  try {
    const response = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('取得 Rich Menu 列表失敗');
    }

    const data = await response.json();
    console.log('\n📋 現有的 Rich Menu:');
    data.richmenus.forEach(menu => {
      console.log(`- ${menu.name} (ID: ${menu.richMenuId})`);
    });
    
    return data.richmenus;
  } catch (error) {
    console.error('❌ 取得 Rich Menu 列表失敗:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'list') {
    await listRichMenus();
    return;
  }

  if (command === 'upload') {
    const imagePath = args[1];
    
    if (!imagePath) {
      console.error('請提供圖片路徑: node upload-rich-menu.js upload <image-path>');
      process.exit(1);
    }

    if (!fs.existsSync(imagePath)) {
      console.error(`找不到圖片: ${imagePath}`);
      process.exit(1);
    }

    console.log('🚀 開始上傳 Rich Menu...\n');
    
    // 建立 Rich Menu
    const richMenuId = await createRichMenu();
    
    // 上傳圖片
    await uploadRichMenuImage(richMenuId, imagePath);
    
    // 設定為預設
    await setDefaultRichMenu(richMenuId);
    
    console.log('\n🎉 完成！Rich Menu 已成功上傳並設定為預設選單。');
    console.log(`Rich Menu ID: ${richMenuId}`);
    
    return;
  }

  console.log(`
使用方式:
  node upload-rich-menu.js list          - 列出所有 Rich Menu
  node upload-rich-menu.js upload <path> - 上傳並設定 Rich Menu

範例:
  node upload-rich-menu.js upload ./rich-menu-v4.png
  `);
}

main().catch(error => {
  console.error('執行失敗:', error);
  process.exit(1);
});
