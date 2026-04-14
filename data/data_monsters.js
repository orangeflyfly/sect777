/**
 * V2.0 data_monsters.js (模組化版)
 * 職責：存放所有妖獸數據
 * 狀態：已轉化為 ES Module，支持精準調用
 */

// 1. 導出妖獸數據庫 (MONSTERS)
export const MONSTERS = {
    "m001": { id: "m001", name: "野兔", icon: "🐇", hp: 30, atk: 5, exp: 10, gold: 5 },
    "m002": { id: "m002", name: "山雞", icon: "🐔", hp: 50, atk: 8, exp: 15, gold: 8 },
    "m003": { id: "m003", name: "灰狼", icon: "🐺", hp: 120, atk: 18, exp: 40, gold: 20 },
    "m004": { id: "m004", name: "猛虎", icon: "🐯", hp: 250, atk: 35, exp: 80, gold: 50 },
    "m005": { id: "m005", name: "青雲虎王", icon: "🐯", hp: 1500, atk: 120, exp: 500, gold: 200, isBoss: true },
    "m006": { id: "m006", name: "滄瀾水妖", icon: "🧜", hp: 450, atk: 55, exp: 150, gold: 90 },
    "m007": { id: "m007", name: "赤腹蛇", icon: "🐍", hp: 600, atk: 75, exp: 200, gold: 120 },
    "m008": { id: "m008", name: "遺跡守衛", icon: "🗿", hp: 1200, atk: 110, exp: 400, gold: 250 },
    "m009": { id: "m009", name: "玄水惡蛟", icon: "🐉", hp: 5000, atk: 350, exp: 2000, gold: 1000, isBoss: true },
    "m010": { id: "m010", name: "守境傀儡", icon: "🤖", hp: 10000, atk: 800, exp: 5000, gold: 3000, isBoss: true }
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
