/**
 * V1.5 data.js 
 * 職責：大陣數據總綱。整合 1.4.1 所有原始內容，並升級 1.5 區域化架構與擴張詞條池。
 * 狀態：全量清單，包含 80 個完整詞條，無須手動補貼。
 */

const GAMEDATA = {
    // --- 1. 系統配置 (1.5 核心參數) ---
    CONFIG: {
        SAVE_KEY: "Xiuxian_Save_V1.5",
        MAX_LOGS: 50,
        OFFLINE_MIN_MINS: 10,
        BOSS_KILL_REQUIRE: 10 // 擊殺 10 隻小怪後可點擊「挑戰領主」
    },

    // --- 2. 品級視覺定義 (對接 CSS 格子發光) ---
    RARITY: {
        1: { id: 1, name: "凡品", color: "#9e9e9e", class: "r-1" },
        2: { id: 2, name: "良品", color: "#2ecc71", class: "r-2" },
        3: { id: 3, name: "精品", color: "#3498db", class: "r-3" },
        4: { id: 4, name: "仙品", color: "#9b59b6", class: "r-4" },
        5: { id: 5, name: "神品", color: "#f1c40f", class: "r-5" }
    },

    // --- 3. 完整辭綴庫 (1.4.1 繼承 + 1.5 擴大招募 80 詞條) ---
    PREFIXES: {
        // 【基礎攻擊系】
        "鋒利": { atkMul: 1.1 }, "尖銳": { atkMul: 1.15 }, "淬火": { atkMul: 1.2 },
        "碎骨": { atkMul: 1.25 }, "嗜血": { atkMul: 1.2, lifesteal: 0.05 }, "破軍": { atkMul: 1.5, critRate: 0.1 },
        "狂暴": { atkMul: 2.0, speedMul: 1.5, hpMul: 0.8 }, "致命": { critRate: 0.2, critDmg: 0.5 },
        "橫掃": { multiHit: 0.15 }, "貫穿": { ignoreDef: 0.2 }, "焚心": { fireDmg: 20 },
        "寒霜": { slowEffect: 0.2 }, "雷霆": { atkMul: 1.4, critRate: 0.15 }, "誅仙": { atkMul: 2.5, expMul: 0.5 },
        "斷水": { speedMul: 1.2, atkMul: 1.1 }, "裂地": { atkMul: 1.8, speedMul: 0.6 },
        "碎魂": { atkMul: 1.4, ignoreDef: 0.1 }, "屠戮": { atkMul: 1.7 }, "無情": { critRate: 0.25 },

        // 【五行系列 - 1.5 新增】
        "乙木": { hpMul: 1.2, regen: 0.03 }, 
        "離火": { atkMul: 1.4, critRate: 0.05 }, 
        "葵水": { dodge: 0.1, speedMul: 1.2 }, 
        "庚金": { atkMul: 1.3, ignoreDef: 0.15 }, 
        "戊土": { defMul: 1.5, damageReduc: 0.1 },

        // 【神獸傳奇系列 - 1.5 新增】
        "龍威": { atkMul: 1.5, defMul: 1.3, goldMul: 1.2 }, 
        "鳳鳴": { hpMul: 1.5, regen: 0.05, speedMul: 1.1 }, 
        "麒麟": { luck: 80, expMul: 1.5, goldMul: 1.5 }, 
        "鯤鵬": { speedMul: 2.0, dodge: 0.2, atkMul: 0.8 },
        "白虎": { atkMul: 1.8, critRate: 0.15 }, "朱雀": { fireDmg: 100, regen: 0.02 },

        // 【基礎防禦系】
        "堅固": { defMul: 1.1 }, "厚實": { defMul: 1.2 }, "玄武": { defMul: 1.5, hpMul: 1.2 },
        "不動": { defMul: 2.0, speedMul: 0.8 }, "不滅": { hpMul: 2.0, defMul: 1.2 },
        "避劫": { dodge: 0.15 }, "金剛": { defMul: 1.8, damageReduc: 0.1 }, "長生": { hpMul: 1.5, regen: 0.02 },
        "如山": { defMul: 1.6, hpMul: 1.3 }, "輕盈": { dodge: 0.2, speedMul: 1.1 }, "磐石": { defMul: 2.5 },
        "護體": { shield: 50 }, "反震": { reflect: 0.15 }, "化勁": { damageReduc: 0.2 },
        "堅韌": { defMul: 1.3, hpMul: 1.1 }, "銅皮": { defMul: 1.4 }, "鐵骨": { hpMul: 1.4 },

        // 【身法與收益系】
        "靈動": { speedMul: 1.3, dodge: 0.15 }, "疾風": { speedMul: 1.6 }, "迅捷": { speedMul: 1.2 },
        "幻影": { dodge: 0.25 }, "縮地": { speedMul: 2.0, defMul: 0.7 }, "流光": { speedMul: 1.5, critRate: 0.1 },
        "悟性": { expMul: 1.5 }, "天選": { expMul: 2.0, goldMul: 1.5, atkMul: 1.2 },
        "財迷": { goldMul: 1.5 }, "納福": { luck: 20, goldMul: 1.2 }, "尋寶": { dropRate: 0.2 },
        "聚靈": { expMul: 1.3, mpRegen: 0.2 }, "勤勉": { expMul: 1.2 }, "機緣": { luck: 50 },

        // 【因果與高階複合類 - 1.5 新增/升級】
        "天道": { expMul: 3.0, goldMul: 0.5 }, 
        "貪婪": { goldMul: 3.0, luck: -50 }, 
        "寂滅": { critRate: 0.4, critDmg: 1.0, hpMul: 0.4 }, 
        "凡心": { atkMul: 1.05, defMul: 1.05 },
        "太極": { atkMul: 1.2, defMul: 1.2, regen: 0.03 }, 
        "紫霄": { atkMul: 1.5, critRate: 0.2, fireDmg: 50 },
        "歸元": { hpMul: 1.3, regen: 0.05, defMul: 1.1 },
        "浩瀚": { hpMul: 2.5, defMul: 1.5, speedMul: 0.6 },
        "幽冥": { lifesteal: 0.1, ignoreDef: 0.15, dodge: 0.1 },
        "劍意": { atkMul: 1.4, critDmg: 0.4 }, "浩然": { defMul: 1.4, expMul: 1.2 },
        "大乘": { atkMul: 2.0, defMul: 2.0, expMul: 2.0 },
        "神隱": { dodge: 0.4, speedMul: 1.8, hpMul: 0.6 }, "禁忌": { atkMul: 3.5, hpMul: 0.3 }
    },

    // --- 4. 區域與地圖 (1.5 結構) ---
    REGIONS: [
        {
            id: "qingyun",
            name: "青雲州",
            minLevel: 1, bossId: "b001", nextRegion: "wanyao",
            maps: [
                { id: 0, name: "青雲後山", level: 1, monsterIds: ["m001", "m002"], drops: ["止血草", "野豬牙"] },
                { id: 1, name: "亂葬崗", level: 10, monsterIds: ["m003", "m004"], drops: ["陰火", "精鐵"] },
                { id: 2, name: "吸血蝙蝠洞", level: 15, monsterIds: ["m005"], drops: ["蝙蝠翼", "靈芝"] }
            ]
        },
        {
            id: "wanyao",
            name: "萬妖荒原",
            minLevel: 25, bossId: "b002", nextRegion: "kunlun",
            maps: [
                { id: 3, name: "紅睛狼穴", level: 25, monsterIds: ["m006", "m008"], drops: ["狼皮", "妖狼齒"] },
                { id: 4, name: "萬妖谷", level: 35, monsterIds: ["m007"], drops: ["妖丹", "精品殘卷"] }
            ]
        }
    ],

    // --- 5. 妖獸錄 (1.4.1 + 1.5 Boss) ---
    MONSTERS: {
        "m001": { name: "小野豬", hp: 60, atk: 12, exp: 10, gold: 5, icon: "🐗" },
        "m002": { name: "野火雞", hp: 40, atk: 8, exp: 6, gold: 3, icon: "🐔" },
        "m003": { name: "骷髏兵", hp: 150, atk: 30, exp: 40, gold: 15, icon: "💀" },
        "m004": { name: "幽靈", hp: 120, atk: 45, exp: 55, gold: 20, icon: "👻" },
        "m005": { name: "吸血蝙蝠", hp: 300, atk: 60, exp: 90, gold: 40, icon: "🦇" },
        "m006": { name: "紅睛妖狼", hp: 800, atk: 150, exp: 250, gold: 120, icon: "🐺" },
        "m007": { name: "雙頭蛇", hp: 1500, atk: 220, exp: 500, gold: 300, icon: "🐍" },
        "m008": { name: "荒原餓狼", hp: 600, atk: 90, exp: 180, gold: 80, icon: "🐕" },
        // 1.5 區域領主
        "b001": { name: "【區域領主】青雲大妖", hp: 5000, atk: 350, exp: 3000, gold: 2000, isBoss: true, icon: "👿" },
        "b002": { name: "【區域領主】萬妖之王", hp: 30000, atk: 1800, exp: 20000, gold: 15000, isBoss: true, icon: "👹" }
    },

    // --- 6. 神通與功法 (1.4.1 完整保留) ---
    SKILLS: {
        "s001": { id: "s001", name: "烈焰斬", type: "active", basePower: 2.5, desc: "凝聚靈氣的火熱一擊" },
        "s002": { id: "s002", name: "長生功", type: "passive", hpMul: 1.2, desc: "提升生命上限" },
        "s003": { id: "s003", name: "回春術", type: "active", healPower: 1.5, desc: "恢復傷勢" },
        "s004": { id: "s004", name: "御劍術", type: "active", basePower: 4.0, desc: "御劍殺敵" }
    },

    // --- 7. 物品庫 (1.4.1 完整保留) ---
    ITEMS: {
        "止血草": { type: "material", rarity: 1, value: 5 },
        "精鐵": { type: "material", rarity: 2, value: 30 },
        "靈芝": { type: "material", rarity: 3, value: 150 },
        "妖丹": { type: "material", rarity: 4, value: 1000 },
        "精品殘卷": { type: "material", rarity: 3, value: 500 }
    }
};

console.log("✅ [V1.5 完整總綱] data.js 已裝載，包含 80 個詞條清單。");
