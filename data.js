/**
 * 宗門修仙錄 - 數據字典 (data.js) V1.3.0
 * 【核心修正】：物品分類明確化、定義五卷合成、商店預裝、境界設定
 */
var GAME_DATA = {
    // --- 全域常數 ---
    CONFIG: {
        NEED_SCROLLS: 5,      // 殘卷合成所需數量
        MAX_BAG_SIZE: 50,     // 儲物袋上限
        REGEN_INTERVAL: 1000, // 每秒回血頻率
        VERSION: "V1.3.0"
    },

    // --- 境界體系 (為突破系統鋪路) ---
    REALMS: [
        { id: 0, name: "凡人", maxLv: 1,  bonus: 1.0 },
        { id: 1, name: "煉氣期", maxLv: 10, bonus: 1.2 },
        { id: 2, name: "築基期", maxLv: 20, bonus: 2.0 },
        { id: 3, name: "金丹期", maxLv: 30, bonus: 4.0 },
        { id: 4, name: "元嬰期", maxLv: 40, bonus: 8.0 },
        { id: 5, name: "化神期", maxLv: 50, bonus: 15.0 }
    ],

    RARITY: [
        { n: "凡品", c: "#aaa" }, { n: "良品", c: "#4caf50" },
        { n: "精品", c: "#2196f3" }, { n: "仙品", c: "#a333c8" },
        { n: "神品", c: "#ffd700" }
    ],

    // --- 萬寶閣 (商店) 貨架 ---
    SHOP_ITEMS: [
        { id: 100, name: "殘卷：長生功", price: 200, type: "scroll" },
        { id: 102, name: "殘卷：烈焰斬", price: 1000, type: "scroll" },
        { id: 103, name: "殘卷：回春術", price: 1500, type: "scroll" },
        { id: 500, name: "小回春丹", price: 50, type: "potion", desc: "瞬回 30% 生命值", effect: { hpRec: 0.3 } }
    ],

    MAPS: [
        { id: 0, name: "青雲後山", lv: 1, monsters: [0, 1], drops: [100, 101] },
        { id: 1, name: "亂葬崗", lv: 10, monsters: [2, 3], drops: [102, 103] },
        { id: 2, name: "萬妖谷", lv: 25, monsters: [4, 5], drops: [104, 105] }
    ],

    MONSTERS: [
        { id: 0, name: "野豬", hp: 80, atk: 12, exp: 15, coin: 5, pic: "🐗" },
        { id: 1, name: "吸血蝙蝠", hp: 60, atk: 18, exp: 20, coin: 8, pic: "🦇" },
        { id: 2, name: "骷髏兵", hp: 300, atk: 45, exp: 80, coin: 30, pic: "💀" },
        { id: 3, name: "幽靈", hp: 220, atk: 65, exp: 120, coin: 50, pic: "👻" },
        { id: 4, name: "赤眼妖狼", hp: 1200, atk: 180, exp: 450, coin: 150, pic: "🐺" },
        { id: 5, name: "雙頭蛇", hp: 1000, atk: 250, exp: 600, coin: 200, pic: "🐍" }
    ],

    // --- 物品詳細定義 (分類修正) ---
    ITEMS: [
        { id: 100, name: "殘卷：長生功", type: "scroll", target: 0 },
        { id: 101, name: "野豬獠牙", type: "material", desc: "野豬的利齒，可出售換取靈石。" },
        { id: 102, name: "殘卷：烈焰斬", type: "scroll", target: 1 },
        { id: 103, name: "殘卷：回春術", type: "scroll", target: 2 },
        { id: 104, name: "妖狼皮毛", type: "material", desc: "厚實的皮毛，可用於製作法衣。" },
        { id: 105, name: "劇毒蛇膽", type: "material", desc: "散發幽光的蛇膽，是珍貴的藥材。" }
    ],

    SKILLS: [
        { id: 0, name: "長生功", type: "passive", effect: { hpMul: 1.3 }, desc: "增加 30% 生命上限" },
        { id: 1, name: "烈焰斬", type: "active", proc: 0.2, effect: { dmgMul: 3 }, desc: "20%機率造成3倍傷害" },
        { id: 2, name: "回春術", type: "active", proc: 0.15, effect: { healMul: 0.4 }, desc: "15%機率回覆40%生命" }
    ],

    // --- 詞條系統 (維持 60 種架構) ---
    AFFIX: {
        PREFIX: [
            // 力量系
            { n: "生鏽的", atk: 0.8 }, { n: "凡人的", atk: 1.1 }, { n: "鋒利的", atk: 1.5 }, { n: "百鍊的", atk: 2.2 }, { n: "寒霜的", atk: 3.5 },
            { n: "赤焰的", atk: 5.0 }, { n: "驚雷的", atk: 8.0 }, { n: "屠龍的", atk: 15.0 }, { n: "開天的", atk: 30.0 }, { n: "滅世", atk: 100.0 },
            // 體質系
            { n: "殘破的", hp: 0.8, def: 0.8 }, { n: "粗布的", hp: 1.1 }, { n: "厚實的", def: 1.5 }, { n: "精鋼的", def: 2.5 }, { n: "磐石的", def: 4.0, hp: 1.5 },
            { n: "玄武的", def: 8.0, hp: 2.0 }, { n: "不朽的", hp: 10.0 }, { n: "長生的", hp: 25.0, regen: 10 }, { n: "至尊的", hp: 50.0, def: 20 }, { n: "混沌", hp: 200.0, def: 100 },
            // 敏捷系
            { n: "笨重的", dodge: -0.05 }, { n: "輕便的", dodge: 0.02 }, { n: "疾風的", dodge: 0.05 }, { n: "幻影的", dodge: 0.08 }, { n: "雷動的", dodge: 0.12 },
            { n: "流光的", dodge: 0.18 }, { n: "瞬身的", dodge: 0.25 }, { n: "無蹤的", dodge: 0.35 }, { n: "踏空的", dodge: 0.5 }, { n: "因果", dodge: 0.8 },
            // 悟性系
            { n: "愚鈍的", exp: 0.5 }, { n: "清醒的", exp: 1.2 }, { n: "睿智的", exp: 1.5 }, { n: "通靈的", exp: 2.0 }, { n: "博學的", exp: 3.0 },
            { n: "入道的", exp: 5.0 }, { n: "窺天的", exp: 10.0 }, { n: "知命的", exp: 20.0 }, { n: "涅槃的", exp: 50.0 }, { n: "真理", exp: 150.0 },
            // 氣運系
            { n: "倒楣的", money: 0.5 }, { n: "平凡的", money: 1.1 }, { n: "幸運的", money: 1.5 }, { n: "招財的", money: 2.5 }, { n: "聚靈的", money: 5.0 },
            { n: "嗜血的", lifeSteal: 0.05 }, { n: "貪婪的", money: 10.0, lifeSteal: 0.08 }, { n: "掠奪的", lifeSteal: 0.15 }, { n: "天選的", money: 100.0 }, { n: "造化", lifeSteal: 0.5, money: 500.0 },
            // 神性系
            { n: "被詛咒的", atk: 2.0, hp: 0.5 }, { n: "妖異的", atk: 1.5, lifeSteal: 0.02 }, { n: "靈氣的", regen: 5 }, { n: "聖潔的", def: 2.0, regen: 10 }, { n: "古老的", atk: 5.0, def: 5.0 },
            { n: "虛空的", dodge: 0.2, atk: 5.0 }, { n: "荒古的", hp: 20.0, atk: 10.0 }, { n: "永恆的", regen: 100, hp: 50.0 }, { n: "輪迴的", atk: 50.0, dodge: 0.3 }, { n: "太初", atk: 500, hp: 500, def: 500 }
        ],
        SUFFIX: [
            { n: "之劍", atk: 10, type: 'weapon' }, { n: "之刃", atk: 12, type: 'weapon' }, { n: "之槍", atk: 15, type: 'weapon' },
            { n: "之袍", def: 5, hp: 50, type: 'body' }, { n: "之甲", def: 15, hp: 120, type: 'body' }, { n: "之鎧", def: 30, hp: 300, type: 'body' }
        ]
    }
};
