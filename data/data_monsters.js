/**
 * V3.5.9 data_monsters.js (妖獸開智與掉落重鑄版)
 * 職責：存放所有妖獸數據，並定義極具特色的掉落物清單
 * 修正：解決「宗門仙草」混亂，區分數值資源與實體材料
 */

export const MONSTERS = {
    "m001": { 
        id: "m001", name: "野兔", icon: "🐇", hp: 30, atk: 5, exp: 10, gold: 5,
        drops: [
            { id: "herb", name: "仙草", type: "resource", chance: 0.3, amount: [1, 2] },
            { id: "rabbit_fur", name: "柔軟兔毛", type: "item", chance: 0.5, rarity: 1 }
        ]
    },
    "m002": { 
        id: "m002", name: "山雞", icon: "🐔", hp: 50, atk: 8, exp: 15, gold: 8,
        drops: [
            { id: "herb", name: "仙草", type: "resource", chance: 0.4, amount: [1, 2] },
            { id: "feather", name: "山雞翎羽", type: "item", chance: 0.4, rarity: 1 }
        ]
    },
    "m003": { 
        id: "m003", name: "灰狼", icon: "🐺", hp: 120, atk: 18, exp: 40, gold: 20,
        drops: [
            { id: "wolf_fang", name: "殘缺狼牙", type: "item", chance: 0.4, rarity: 1 },
            { id: "wolf_hide", name: "灰狼皮", type: "item", chance: 0.3, rarity: 2 }
        ]
    },
    "m004": { 
        id: "m004", name: "猛虎", icon: "🐯", hp: 250, atk: 35, exp: 80, gold: 50, skill: '重錘',
        drops: [
            { id: "herb", name: "仙草", type: "resource", chance: 0.5, amount: [2, 4] },
            { id: "tiger_claw", name: "猛虎利爪", type: "item", chance: 0.3, rarity: 2 }
        ]
    },
    "m005": { 
        id: "m005", name: "青雲虎王", icon: "🐯", hp: 1500, atk: 120, exp: 500, gold: 200, isBoss: true, skill: '重錘',
        drops: [
            { id: "herb", name: "仙草", type: "resource", chance: 1.0, amount: [10, 20] },
            { id: "tiger_soul", name: "虎王精魂", type: "item", chance: 0.2, rarity: 4 },
            { id: "tiger_bone", name: "虎王壯骨", type: "item", chance: 0.5, rarity: 3 }
        ]
    },
    "m006": { 
        id: "m006", name: "滄瀾水妖", icon: "🧜", hp: 450, atk: 55, exp: 150, gold: 90,
        drops: [
            { id: "water_bead", name: "水靈珠碎塊", type: "item", chance: 0.4, rarity: 2 },
            { id: "herb", name: "仙草", type: "resource", chance: 0.3, amount: [3, 5] }
        ]
    },
    "m007": { 
        id: "m007", name: "赤腹蛇", icon: "🐍", hp: 600, atk: 75, exp: 200, gold: 120, skill: '妖毒',
        drops: [
            { id: "snake_gall", name: "赤腹蛇膽", type: "item", chance: 0.4, rarity: 2 },
            { id: "snake_skin", name: "乾枯蛇皮", type: "item", chance: 0.5, rarity: 1 }
        ]
    },
    "m008": { 
        id: "m008", name: "遺跡守衛", icon: "🗿", hp: 1200, atk: 110, exp: 400, gold: 250, skill: '重錘',
        drops: [
            { id: "ore", name: "玄鐵", type: "resource", chance: 0.8, amount: [5, 10] },
            { id: "ancient_iron", name: "鏽蝕古鐵", type: "item", chance: 0.4, rarity: 2 }
        ]
    },
    "m009": { 
        id: "m009", name: "玄水惡蛟", icon: "🐉", hp: 5000, atk: 350, exp: 2000, gold: 1000, isBoss: true, skill: '妖毒',
        drops: [
            { id: "ore", name: "玄鐵", type: "resource", chance: 1.0, amount: [20, 40] },
            { id: "dragon_scale", name: "惡蛟逆鱗", type: "item", chance: 0.1, rarity: 5 },
            { id: "dragon_blood", name: "蛟龍真血", type: "item", chance: 0.3, rarity: 4 }
        ]
    },
    "m010": { 
        id: "m010", name: "守境傀儡", icon: "🤖", hp: 10000, atk: 800, exp: 5000, gold: 3000, isBoss: true, skill: '重錘',
        drops: [
            { id: "ore", name: "玄鐵", type: "resource", chance: 1.0, amount: [50, 100] },
            { id: "golem_core", name: "傀儡動力核心", type: "item", chance: 0.2, rarity: 5 }
        ]
    },
    "m011": { 
        id: "m011", name: "魔化野豬", icon: "🐗", hp: 350, atk: 45, exp: 110, gold: 70, skill: '重錘',
        drops: [
            { id: "boar_tusk", name: "魔化獠牙", type: "item", chance: 0.4, rarity: 2 },
            { id: "herb", name: "仙草", type: "resource", chance: 0.2, amount: [2, 3] }
        ]
    },
    "m012": { 
        id: "m012", name: "幽林毒蛛", icon: "🕷️", hp: 550, atk: 65, exp: 180, gold: 100, skill: '妖毒',
        drops: [
            { id: "spider_silk", name: "劇毒蛛絲", type: "item", chance: 0.5, rarity: 2 },
            { id: "venom_sac", name: "毒囊", type: "item", chance: 0.3, rarity: 3 }
        ]
    },
    "m013": { 
        id: "m013", name: "嗜血蝙蝠", icon: "🦇", hp: 400, atk: 80, exp: 160, gold: 85,
        drops: [
            { id: "bat_wing", name: "嗜血蝠翼", type: "item", chance: 0.4, rarity: 1 },
            { id: "bat_blood", name: "妖蝠之血", type: "item", chance: 0.2, rarity: 2 }
        ]
    },
    "m014": { 
        id: "m014", name: "烈焰巨猿", icon: "🦍", hp: 900, atk: 95, exp: 300, gold: 180, skill: '重錘',
        drops: [
            { id: "ore", name: "玄鐵", type: "resource", chance: 0.5, amount: [3, 6] },
            { id: "ape_fur", name: "烈焰猿鬃", type: "item", chance: 0.4, rarity: 3 }
        ]
    },
    "m015": { 
        id: "m015", name: "萬年樹妖", icon: "🌳", hp: 8500, atk: 600, exp: 4000, gold: 2500, isBoss: true, skill: '妖毒',
        drops: [
            { id: "herb", name: "仙草", type: "resource", chance: 1.0, amount: [30, 60] },
            { id: "tree_heart", name: "萬年木心", type: "item", chance: 0.2, rarity: 5 },
            { id: "spirit_branch", name: "聚靈枯枝", type: "item", chance: 0.5, rarity: 3 }
        ]
    }
};

/**
 * --- 🛡️ 兼容性法陣 ---
 */
window.GAMEDATA = window.GAMEDATA || {};
window.GAMEDATA.MONSTERS = MONSTERS;

const count = Object.keys(MONSTERS).length;
console.log(`%c【藏妖閣】V3.5.9 重鑄版啟動，已監控到 ${count} 尊妖獸及掉落因果。`, "color: #ef4444; font-weight: bold;");
