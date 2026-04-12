/**
 * V1.5 data.js
 * 職責：存放遊戲所有靜態數據
 * 注意：修改此處會直接影響全遊戲的數值與地圖分布
 */

const GAMEDATA = {
    // --- 1. 區域與秘境 (Regions & Maps) ---
    // 每個區域都有一個守門 Boss，擊敗後才可解鎖下一個 Region
    REGIONS: [
        {
            id: "qingyun",
            name: "青雲州",
            minLevel: 1,
            bossId: "b001", // 青雲大妖
            nextRegion: "wanyao", // 擊敗 Boss 後解鎖的下一區
            maps: [
                { id: 0, name: "青雲後山", level: 1, drops: ["木材", "凡品殘卷", "止血草"] },
                { id: 1, name: "亂葬崗", level: 5, drops: ["陰火", "精鐵", "殘破法寶"] },
                { id: 2, name: "劍塚外圍", level: 10, drops: ["生鏽鐵劍", "劍意殘片"] }
            ]
        },
        {
            id: "wanyao",
            name: "萬妖荒原",
            minLevel: 20,
            bossId: "b002", // 萬妖之王
            nextRegion: "kunlun",
            maps: [
                { id: 3, name: "萬妖谷", level: 20, drops: ["妖丹", "精品殘卷", "獸骨"] },
                { id: 4, name: "赤血河", level: 25, drops: ["血精石", "仙品殘卷", "魔血"] }
            ]
        }
    ],

    // --- 2. 妖獸與領主數據 (Monsters & Bosses) ---
    MONSTERS: {
        // 普通怪物
        "m001": { name: "小野豬", hp: 60, atk: 12, exp: 10, gold: 5 },
        "m002": { name: "腐化殭屍", hp: 150, atk: 25, exp: 30, gold: 15 },
        "m003": { name: "荒原餓狼", hp: 400, atk: 65, exp: 120, gold: 45 },
        
        // 區域領主 (Boss)
        "b001": { 
            name: "【區域領主】青雲大妖", 
            hp: 3000, 
            atk: 120, 
            exp: 1500, 
            gold: 1000, 
            isBoss: true,
            desc: "守護青雲州的古老妖獸，實力深不可測。"
        },
        "b002": { 
            name: "【區域領主】萬妖之王", 
            hp: 15000, 
            atk: 550, 
            exp: 8000, 
            gold: 5000, 
            isBoss: true,
            desc: "萬妖荒原的主宰，雙手沾滿修士鮮血。"
        }
    },

    // --- 3. 神通數據 (Skills) ---
    SKILLS: {
        "s001": { 
            name: "烈焰斬", 
            type: "active", 
            basePower: 3.0, 
            desc: "凝聚靈氣發出烈焰一擊，造成大量傷害。" 
        },
        "s002": { 
            name: "長生功", 
            type: "passive", 
            hpBonus: 1.2, 
            desc: "上古養生功法，永久提升最大血量。" 
        },
        "s003": { 
            name: "御劍術", 
            type: "active", 
            basePower: 4.5, 
            desc: "驅使飛劍取敵首級於千里之外。" 
        }
    }
};

console.log("✅ [數據模組] data.js 加載完成");
