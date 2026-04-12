/**
 * 宗門修仙錄 - 數據天書 (data.js) V1.4
 * 職責：定義世界規則、品級顏色、多重詞條庫與境界門檻
 */
var GAME_DATA = {
    // --- 系統配置 ---
    CONFIG: {
        VERSION: "1.4.0",
        MAX_BAG: 50,
        SCROLL_NEED: 5,        // 參透所需殘卷數
        BREAK_LV: [10, 20, 30, 40, 50], // 境界瓶頸等級
        REGEN_TICK: 1000       // 回血頻率 (ms)
    },

    // --- 品級定義 (對應 CSS 的 r-0 ~ r-4) ---
    RARITY: [
        { n: "凡品", c: "#888", slot: 1 }, 
        { n: "良品", c: "#4caf50", slot: 1 },
        { n: "精品", c: "#2196f3", slot: 2 }, 
        { n: "仙品", c: "#a333c8", slot: 2 }, 
        { n: "神品", c: "#ff4500", slot: 3 } // 神品最多可有 3 詞條
    ],

    // --- 境界名稱 ---
    REALMS: ["煉氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期"],

    // --- 地圖數據 ---
    MAPS: [
        { id: 0, name: "青雲後山", lv: 1, monsters: [0, 1], drops: [100, 101] },
        { id: 1, name: "亂葬崗", lv: 10, monsters: [2, 3], drops: [102, 103] },
        { id: 2, name: "萬妖谷", lv: 25, monsters: [4, 5], drops: [104, 105] }
    ],

    // --- 妖獸數據 ---
    MONSTERS: [
        { id: 0, name: "野豬", hp: 100, atk: 15, exp: 20, coin: 10, pic: "🐗" },
        { id: 1, name: "吸血蝙蝠", hp: 80, atk: 22, exp: 25, coin: 15, pic: "🦇" },
        { id: 2, name: "骷髏兵", hp: 450, atk: 60, exp: 100, coin: 50, pic: "💀" },
        { id: 3, name: "幽靈", hp: 350, atk: 85, exp: 150, coin: 80, pic: "👻" },
        { id: 4, name: "赤眼妖狼", hp: 1500, atk: 220, exp: 500, coin: 200, pic: "🐺" },
        { id: 5, name: "雙頭蛇", hp: 1300, atk: 300, exp: 700, coin: 350, pic: "🐍" }
    ],

    // --- 基礎物品原型 ---
    ITEMS: [
        { id: 100, name: "殘卷：長生功", type: "scroll", target: 0 },
        { id: 101, name: "野豬獠牙", type: "material", desc: "堅硬的材料，可用於強化裝備。" },
        { id: 102, name: "殘卷：烈焰斬", type: "scroll", target: 1 },
        { id: 103, name: "殘卷：回春術", type: "scroll", target: 2 },
        { id: 104, name: "妖狼皮毛", type: "material", desc: "柔韌的皮革，強化防具之用。" },
        { id: 105, name: "劇毒蛇膽", type: "material", desc: "極其稀有的材料。" }
    ],

    // --- 萬寶閣商品 ---
    SHOP_ITEMS: [
        { name: "殘卷：長生功", price: 300, type: "scroll" },
        { name: "殘卷：烈焰斬", price: 1200, type: "scroll" },
        { name: "殘卷：回春術", price: 2000, type: "scroll" },
        { name: "低階靈石袋", price: 500, type: "material", desc: "打開獲得大量隨機靈石。" }
    ],

    // --- 神通數據 ---
    SKILLS: [
        { id: 0, name: "長生功", type: "passive", effect: { hpMul: 1.2, regenAdd: 5 }, desc: "被動：提升 20% 生命上限，每秒額外回血 5 點。" },
        { id: 1, name: "烈焰斬", type: "active", proc: 0.2, effect: { dmgMul: 3, burn: 0.1 }, desc: "主動：20% 機率造成 3 倍傷害並附加焚燒。" },
        { id: 2, name: "回春術", type: "active", proc: 0.15, effect: { healMul: 0.35 }, desc: "主動：15% 機率恢復 35% 生命上限。" }
    ],

    // --- 暴力美學：隨機詞條庫 ---
    // 每個詞條擁有自己的 rarity (0-4)，對應顏色
    AFFIX: [
        { n: "生鏽", r: 0, atk: 0.8 }, { n: "凡人", r: 0, hp: 1.1 }, 
        { n: "鋒利", r: 1, atk: 1.5 }, { n: "厚實", r: 1, def: 1.5 },
        { n: "精良", r: 2, atk: 2.2, def: 1.2 }, { n: "疾風", r: 2, dodge: 0.05 }, { n: "致命", r: 2, crit: 0.1 },
        { n: "玄武", r: 3, def: 5.0, hp: 2.5 }, { n: "嗜血", r: 3, lifeSteal: 0.1, atk: 3.0 }, { n: "通靈", r: 3, exp: 1.5, money: 1.5 },
        { n: "太初", r: 4, atk: 20.0, hp: 10.0, crit: 0.25 }, { n: "因果", r: 4, dodge: 0.4, def: 15.0 }, { n: "造化", r: 4, money: 10.0, exp: 10.0 }
    ],

    // --- 裝備本體後綴 (決定基礎類型) ---
    BASES: {
        weapon: [
            { n: "木劍", atk: 10 }, { n: "鐵劍", atk: 25 }, { n: "精鋼劍", atk: 60 },
            { n: "重劍", atk: 150 }, { n: "神木劍", atk: 400 }, { n: "九幽神劍", atk: 1200 }
        ],
        body: [
            { n: "布衣", def: 5, hp: 50 }, { n: "皮甲", def: 15, hp: 150 }, { n: "鐵甲", def: 40, hp: 400 },
            { n: "銀鎧", def: 100, hp: 1000 }, { n: "金絲甲", def: 250, hp: 2500 }, { n: "玄天道袍", def: 800, hp: 8000 }
        ]
    }
};
