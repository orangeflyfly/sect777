/**
 * V2.3 data_monsters.js (妖獸開智與擴充版)
 * 職責：存放所有妖獸數據，並為高階妖獸配置專屬技能
 * 狀態：已轉化為 ES Module，支持精準調用
 */

// 1. 導出妖獸數據庫 (MONSTERS)
export const MONSTERS = {
    "m001": { id: "m001", name: "野兔", icon: "🐇", hp: 30, atk: 5, exp: 10, gold: 5 },
    "m002": { id: "m002", name: "山雞", icon: "🐔", hp: 50, atk: 8, exp: 15, gold: 8 },
    "m003": { id: "m003", name: "灰狼", icon: "🐺", hp: 120, atk: 18, exp: 40, gold: 20 },
    "m004": { id: "m004", name: "猛虎", icon: "🐯", hp: 250, atk: 35, exp: 80, gold: 50, skill: '重錘' },
    "m005": { id: "m005", name: "青雲虎王", icon: "🐯", hp: 1500, atk: 120, exp: 500, gold: 200, isBoss: true, skill: '重錘' },
    "m006": { id: "m006", name: "滄瀾水妖", icon: "🧜", hp: 450, atk: 55, exp: 150, gold: 90 },
    "m007": { id: "m007", name: "赤腹蛇", icon: "🐍", hp: 600, atk: 75, exp: 200, gold: 120, skill: '妖毒' },
    "m008": { id: "m008", name: "遺跡守衛", icon: "🗿", hp: 1200, atk: 110, exp: 400, gold: 250, skill: '重錘' },
    "m009": { id: "m009", name: "玄水惡蛟", icon: "🐉", hp: 5000, atk: 350, exp: 2000, gold: 1000, isBoss: true, skill: '妖毒' },
    "m010": { id: "m010", name: "守境傀儡", icon: "🤖", hp: 10000, atk: 800, exp: 5000, gold: 3000, isBoss: true, skill: '重錘' },
    
    // 🟢 V2.3 新增妖獸：擴充歷練生態
    "m011": { id: "m011", name: "魔化野豬", icon: "🐗", hp: 350, atk: 45, exp: 110, gold: 70, skill: '重錘' },
    "m012": { id: "m012", name: "幽林毒蛛", icon: "🕷️", hp: 550, atk: 65, exp: 180, gold: 100, skill: '妖毒' },
    "m013": { id: "m013", name: "嗜血蝙蝠", icon: "🦇", hp: 400, atk: 80, exp: 160, gold: 85 },
    "m014": { id: "m014", name: "烈焰巨猿", icon: "🦍", hp: 900, atk: 95, exp: 300, gold: 180, skill: '重錘' },
    "m015": { id: "m015", name: "萬年樹妖", icon: "🌳", hp: 8500, atk: 600, exp: 4000, gold: 2500, isBoss: true, skill: '妖毒' }
};

/**
 * --- 🛡️ 兼容性法陣 ---
 * 確保尚未飛升的舊系統仍能透過全域變數讀取數據
 */
window.GAMEDATA = window.GAMEDATA || {};
window.GAMEDATA.MONSTERS = MONSTERS;

// --- 數據載入監控 (模組化日誌) ---
const count = Object.keys(MONSTERS).length;
console.log(`%c【藏妖閣】ESM 陣法啟動，已監控到 ${count} 尊妖獸氣息。`, "color: #ef4444; font-weight: bold;");
