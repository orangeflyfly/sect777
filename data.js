/**
 * V1.5 data.js
 * 職責：存放靜態數據（區域、地圖、妖獸、神通、裝備詞條）
 */

const GAMEDATA = {
    // --- 1. 區域與秘境 (Region-Based Maps) ---
    REGIONS: [
        {
            id: "qingyun",
            name: "青雲州",
            minLevel: 1,
            bossId: "b001", // 青雲大妖
            maps: [
                { id: 0, name: "青雲後山", level: 1, drops: ["木材", "凡品殘卷"] },
                { id: 1, name: "亂葬崗", level: 5, drops: ["陰火", "精鐵"] }
            ]
        },
        {
            id: "wanyao",
            name: "萬妖荒原",
            minLevel: 20,
            bossId: "b002", // 萬妖之王
            maps: [
                { id: 2, name: "萬妖谷", level: 20, drops: ["妖丹", "精品殘卷"] },
                { id: 3, name: "赤血河", level: 25, drops: ["血精石", "仙品殘卷"] }
            ]
        }
    ],

    // --- 2. 妖獸數據 (Monsters) ---
    MONSTERS: {
        "m001": { name: "小野豬", hp: 50, atk: 10, exp: 5, gold: 2 },
        "b001": { name: "【區域領主】青雲大妖", hp: 2000, atk: 80, exp: 500, gold: 200, isBoss: true }
    },

    // --- 3. 神通數據 (Skills) ---
    SKILLS: {
        "s001": { name: "烈焰斬", type: "active", basePower: 3.0, desc: "凝聚靈氣發出烈焰一擊" },
        "s002": { name: "長生功", type: "passive", hpBonus: 1.2, desc: "提升最大血量" }
    }
};
