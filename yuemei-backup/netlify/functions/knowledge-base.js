// 療程知識庫 - 從 Supabase 動態載入
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://clzjdlykhjwrlksyjlfz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsempkbHlraGp3cmxrc3lqbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTM2ODAsImV4cCI6MjA3NTM2OTY4MH0.V6QAoh4N2aSF5CgDYfKTnY8cMQnDV3AYilj7TbpWJcU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 療程資料緩存
let treatmentCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

/**
 * 從 Supabase 載入療程知識庫
 */
async function loadTreatmentsFromSupabase() {
  const now = Date.now();
  
  // 檢查緩存
  if (treatmentCache && (now - cacheTimestamp) < CACHE_TTL) {
    return treatmentCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('[Supabase] 載入療程失敗:', error);
      return treatmentCache || {}; // 返回緩存或空物件
    }
    
    // 轉換為 name 為 key 的物件
    const knowledgeBase = {};
    data.forEach(treatment => {
      knowledgeBase[treatment.name] = {
        name: treatment.name,
        emoji: treatment.emoji,
        category: treatment.category,
        description: treatment.description,
        benefits: treatment.benefits,
        suitableFor: treatment.suitable_for,
        notSuitableFor: treatment.not_suitable_for,
        duration: treatment.duration,
        recovery: treatment.recovery,
        effect: treatment.effect,
        priceRange: treatment.price_range,
        aftercare: treatment.aftercare,
        faq: treatment.faq
      };
    });
    
    treatmentCache = knowledgeBase;
    cacheTimestamp = now;
    console.log(`[Supabase] 成功載入 ${data.length} 個療程`);
    return knowledgeBase;
  } catch (err) {
    console.error('[Supabase] 載入療程異常:', err);
    return treatmentCache || {};
  }
}

/**
 * 取得療程知識庫（非同步）
 */
async function getTreatmentKnowledge() {
  return await loadTreatmentsFromSupabase();
}

// 常見問題 FAQ
const generalFAQ = [
  {
    category: '預約相關',
    questions: [
      {
        q: '如何預約療程？',
        a: '您可以直接在 LINE 上告訴我「我要預約」，然後提供您的姓名、電話、希望的療程和時間，我會立即為您安排！'
      },
      {
        q: '可以取消預約嗎？',
        a: '可以的！請在預約時間前 24 小時告訴我「取消預約」，我會協助您處理。'
      },
      {
        q: '如何查詢我的預約記錄？',
        a: '請直接告訴我「查詢預約」，我會顯示您的所有預約記錄。'
      },
      {
        q: '預約後會收到確認通知嗎？',
        a: '會的！預約成功後您會立即收到確認訊息，預約前一天我也會提醒您。'
      }
    ]
  },
  {
    category: '療程選擇',
    questions: [
      {
        q: '不知道該選什麼療程？',
        a: '沒問題！告訴我您的膚質困擾（例如：乾燥、痘疤、毛孔粗大），我會推薦最適合您的療程。'
      },
      {
        q: '可以同時做多種療程嗎？',
        a: '可以的！但建議先由醫師評估，有些療程可以搭配，有些需要間隔時間。'
      },
      {
        q: '第一次來適合做什麼療程？',
        a: '建議從溫和的療程開始，例如水光針或微針，讓肌膚逐步適應。'
      }
    ]
  },
  {
    category: '診所資訊',
    questions: [
      {
        q: '診所營業時間？',
        a: 'FLOS 曜診所營業時間：\n週一至週五：10:00 - 20:00\n週六：10:00 - 18:00\n週日公休'
      },
      {
        q: '診所地址在哪裡？',
        a: 'FLOS 曜診所位於台北市信義區，詳細地址請來電洽詢或預約時詢問。'
      },
      {
        q: '有停車場嗎？',
        a: '診所附近有特約停車場，預約時我們會提供詳細資訊。'
      }
    ]
  }
];

/**
 * 搜尋療程
 */
async function searchTreatment(keyword) {
  const treatments = await getTreatmentKnowledge();
  const results = [];
  
  for (const [name, info] of Object.entries(treatments)) {
    if (name.includes(keyword) || 
        info.description.includes(keyword) ||
        info.benefits.some(b => b.includes(keyword))) {
      results.push(info);
    }
  }
  
  return results;
}

/**
 * 搜尋 FAQ
 */
function searchFAQ(keyword) {
  const results = [];
  
  for (const category of generalFAQ) {
    for (const qa of category.questions) {
      if (qa.q.includes(keyword) || qa.a.includes(keyword)) {
        results.push({ ...qa, category: category.category });
      }
    }
  }
  
  return results;
}

/**
 * 根據膚質困擾推薦療程
 */
async function recommendTreatment(concern) {
  const treatments = await getTreatmentKnowledge();
  const recommendations = [];
  
  for (const [name, info] of Object.entries(treatments)) {
    // 檢查是否符合困擾
    if (info.benefits.some(b => b.includes(concern)) ||
        info.suitableFor.some(s => s.includes(concern))) {
      recommendations.push(info);
    }
  }
  
  return recommendations;
}

module.exports = {
  getTreatmentKnowledge,
  generalFAQ,
  searchTreatment,
  searchFAQ,
  recommendTreatment
};
