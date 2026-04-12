/**
 * 宗門修仙錄 - 數據天書 (data.js) V1.4.1 完全版
 * 職責：世界規則、品級、60+ 隨機詞條、神通與境界門檻
 */
var GAME_DATA = {
    CONFIG: {
        VERSION: "1.4.1",
        MAX_BAG: 50,
        SCROLL_NEED: 5,        
        BREAK_LV: [10, 20, 30, 40, 50, 60], 
        REGEN_TICK: 1000,
        SKILL_CD: 10000        
    },

    RARITY: [
        { n: "凡品", c: "#888", slot: 1 }, 
        { n: "良品", c: "#4caf50", slot: 1 },
        { n: "精品", c: "#2196f3", slot: 2 }, 
        { n: "仙品", c: "#a333c8", slot: 2 }, 
        { n: "神品", c: "#ff4500", slot: 3 }
    ],

    REALMS: ["煉氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期"],

    MAPS: [
        { id: 0, name: "青雲後山", lv: 1, monsters: [0, 1], drops: [100, 101] },
        { id: 1, name: "亂葬崗", lv: 10, monsters: [2, 3], drops: [102, 103] },
        { id: 2, name: "萬妖谷", lv: 25, monsters: [4, 5], drops: [104, 105] }
    ],

    MONSTERS: [
        { id: 0, name: "野豬", hp: 100, atk: 15, exp: 20, coin: 10, pic: "🐗" },
        { id: 1, name: "吸血蝙蝠", hp: 80, atk: 22, exp: 25, coin: 15, pic: "🦇" },
        { id: 2, name: "骷髏兵", hp: 450, atk: 60, exp: 100, coin: 50, pic: "💀" },
        { id: 3, name: "幽靈", hp: 350, atk: 85, exp: 150, coin: 80, pic: "👻" },
        { id: 4, name: "赤眼妖狼", hp: 1500, atk: 220, exp: 500, coin: 200, pic: "🐺" },
        { id: 5, name: "雙頭蛇", hp: 1300, atk: 300, exp: 700, coin: 350, pic: "🐍" }
    ],

    ITEMS: [
        { id: 100, name: "殘卷：長生功", type: "scroll", target: 0 },
        { id: 101, name: "野豬獠牙", type: "material", desc: "強化材料。" },
        { id: 102, name: "殘卷：烈焰斬", type: "scroll", target: 1 },
        { id: 103, name: "殘卷：回春術", type: "scroll", target: 2 },
        { id: 104, name: "妖狼皮毛", type: "material", desc: "強化材料。" },
        { id: 105, name: "劇毒蛇膽", type: "material", desc: "稀有材料。" }
    ],

    SHOP_ITEMS: [
        { name: "殘卷：長生功", price: 300, type: "scroll" },
        { name: "殘卷：烈焰斬", price: 1200, type: "scroll" },
        { name: "殘卷：回春術", price: 2000, type: "scroll" },
        { name: "低階靈石袋", price: 500, type: "material", desc: "開啟獲得隨機靈石。" }
    ],

    SKILLS: [
        { id: 0, name: "長生功", type: "passive", effect: { hpMul: 1.2, regenAdd: 5 }, desc: "【被動】提升20%生命上限，秒回+5。" },
        { id: 1, name: "烈焰斬", type: "active", proc: 0.2, effect: { dmgMul: 3.0 }, desc: "【主動】造成 300% 傷害。" },
        { id: 2, name: "回春術", type: "active", proc: 0.15, effect: { healMul: 0.35 }, desc: "【主動】恢復 35% 生命上限。" }
    ],

    // --- 暴力美學：60+ 隨機詞條庫 ---
    AFFIX: [
        /* 凡品 (R0) - 15個 */
        { n: "生鏽", r: 0, atk: 0.8 }, { n: "凡人", r: 0, hp: 1.05 }, { n: "笨重", r: 0, dodge: -0.05 },
        { n: "殘缺", r: 0, def: 0.8 }, { n: "陳舊", r: 0, money: 0.9 }, { n: "粗糙", r: 0, atk: 0.9 },
        { n: "平庸", r: 0, exp: 1.02 }, { n: "輕微", r: 0, hp: 1.02 }, { n: "破損", r: 0, def: 0.7 },
        { n: "木納", r: 0, crit: -0.05 }, { n: "路人", r: 0, exp: 0.9 }, { n: "石製", r: 0, def: 1.1 },
        { n: "脆弱", r: 0, hp: 0.8 }, { n: "劣質", r: 0, atk: 0.85 }, { n: "雜亂", r: 0, money: 1.05 },

        /* 良品 (R1) - 15個 */
        { n: "鋒利", r: 1, atk: 1.3 }, { n: "厚實", r: 1, def: 1.3 }, { n: "輕便", r: 1, dodge: 0.03 },
        { n: "堅硬", r: 1, def: 1.5 }, { n: "洗鍊", r: 1, exp: 1.2 }, { n: "磨損", r: 1, atk: 1.1 },
        { n: "制式", r: 1, atk: 1.2, hp: 1.1 }, { n: "打磨", r: 1, crit: 0.02 }, { n: "靈巧", r: 1, dodge: 0.05 },
        { n: "結實", r: 1, hp: 1.3 }, { n: "合格", r: 1, def: 1.2 }, { n: "入門", r: 1, exp: 1.1 },
        { n: "如新", r: 1, money: 1.2 }, { n: "穩重", r: 1, def: 1.4 }, { n: "開刃", r: 1, atk: 1.4 },

        /* 精品 (R2) - 15個 */
        { n: "精良", r: 2, atk: 1.8, def: 1.2 }, { n: "疾風", r: 2, dodge: 0.08 }, { n: "致命", r: 2, crit: 0.1 },
        { n: "護體", r: 2, def: 2.5 }, { n: "聚靈", r: 2, exp: 1.8 }, { n: "奪萃", r: 2, lifeSteal: 0.05 },
        { n: "冷酷", r: 2, crit: 0.15 }, { n: "敏銳", r: 2, dodge: 0.1 }, { n: "強韌", r: 2, hp: 2.0 },
        { n: "破法", r: 2, atk: 2.5 }, { n: "精準", r: 2, crit: 0.12 }, { n: "狂熱", r: 2, atk: 2.0, def: 0.8 },
        { n: "厚重", r: 2, def: 3.0, dodge: -0.05 }, { n: "流暢", r: 2, exp: 2.0 }, { n: "商才", r: 2, money: 2.0 },

        /* 仙品 (R3) - 10個 */
        { n: "玄武", r: 3, def: 6.0, hp: 3.0 }, { n: "嗜血", r: 3, lifeSteal: 0.12, atk: 4.0 }, { n: "通靈", r: 3, exp: 3.0, money: 3.0 },
        { n: "九天", r: 3, atk: 8.0 }, { n: "不滅", r: 3, hp: 8.0 }, { n: "寂滅", r: 3, crit: 0.3 },
        { n: "虛空", r: 3, dodge: 0.25 }, { n: "幽冥", r: 3, lifeSteal: 0.2, atk: 5.0 }, { n: "龍息", r: 3, atk: 10.0, def: 5.0 },
        { n: "神速", r: 3, dodge: 0.3, exp: 2.5 },

        /* 神品 (R4) - 8個 */
        { n: "太初", r: 4, atk: 25.0, hp: 15.0, crit: 0.3 }, { n: "因果", r: 4, dodge: 0.5, def: 20.0 },
        { n: "造化", r: 4, money: 15.0, exp: 15.0 }, { n: "鴻蒙", r: 4, atk: 50.0 }, { n: "滅世", r: 4, crit: 0.8, atk: 30.0 },
        { n: "至尊", r: 4, atk: 20.0, def: 20.0, hp: 20.0 }, { n: "天道", r: 4, exp: 50.0, money: 50.0 },
        { n: "涅槃", r: 4, hp: 100.0, lifeSteal: 0.5 }
    ],

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
