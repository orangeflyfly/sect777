/**
 * V2.0 data_world.js
 * 職責：區域與地圖關卡配置
 * 狀態：已轉化為 ES Module，支持地圖導航系統
 */

// 1. 導出區域數據 (REGIONS)
export const REGIONS = {
    "region_01": {
        id: "region_01",
        name: "青雲山脈",
        maps: [
            { id: 101, name: "外山小徑", minLv: 1, minRealm: 1, monsterIds: ["m001", "m002"] },
            { id: 102, name: "密林深處", minLv: 5, minRealm: 1, monsterIds: ["m002", "m003"] },
            { id: 103, name: "虎王洞穴", minLv: 10, minRealm: 2, monsterIds: ["m004", "m005"], isBossMap: true }
        ]
    },
    "region_02": {
        id: "region_02",
        name: "滄瀾湖畔",
        maps: [
            { id: 201, name: "湖光水岸", minLv: 15, minRealm: 2, monsterIds: ["m006", "m007"] },
            { id: 202, name: "沉船遺跡", minLv: 25, minRealm: 3, monsterIds: ["m008", "m009"] },
            { id: 203, name: "禁地深處", minLv: 40, minRealm: 4, monsterIds: ["m010"], isBossMap: true }
        ]
    }
};

/**
 * --- 🛡️ 兼容性法陣 ---
 * 確保 UI_Battle 的地圖選擇器仍能正常讀取
 */
window.GAMEDATA = window.GAMEDATA || {};
window.GAMEDATA.REGIONS = REGIONS;

console.log("%c【山河誌】ESM 陣法啟動，地圖記憶已載入。", "color: #3b82f6; font-weight: bold;");
