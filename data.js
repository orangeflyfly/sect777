/**
 * 宗門修仙錄 - 數據字典 (data.js) V1.2.2
 */
var GAME_DATA = {
    // 稀有度定義
    RARITY: [
        { n: "凡品", c: "#aaa" },
        { n: "良品", c: "#4caf50" },
        { n: "精品", c: "#2196f3" },
        { n: "仙品", c: "#a333c8" },
        { n: "神品", c: "#ffd700" }
    ],
    // 地圖定義
    MAPS: [
        { id: 0, name: "青雲後山", lv: 1, monsters: [0, 1], drops: [100, 101] },
        { id: 1, name: "亂葬崗", lv: 10, monsters: [2, 3], drops: [102, 103] },
        { id: 2, name: "萬妖谷", lv: 25, monsters: [4, 5], drops: [104, 105] }
    ],
    // 怪物定義
    MONSTERS: [
        { id: 0, name: "野豬", hp: 80, atk: 12, exp: 15, coin: 5, pic: "🐗" },
        { id: 1, name: "吸血蝙蝠", hp: 60, atk: 18, exp: 20, coin: 8, pic: "🦇" },
        { id: 2, name: "骷髏兵", hp: 300, atk: 45, exp: 80, coin: 30, pic: "💀" },
        { id: 3, name: "幽靈", hp: 220, atk: 65, exp: 120, coin: 50, pic: "👻" },
        { id: 4, name: "赤眼妖狼", hp: 1200, atk: 180, exp: 450, coin: 150, pic: "🐺" },
        { id: 5, name: "雙頭蛇", hp: 1000, atk: 250, exp: 600, coin: 200, pic: "🐍" }
    ],
    // 裝備詞條定義 (Prefix 前綴, Suffix 後綴)
    AFFIX: {
        PREFIX: [
            { n: "鋒利的", atk: 1.2 }, { n: "厚實的", def: 1.5 }, { n: "輕巧的", spd: 1.5 },
            { n: "太初", atk: 2.5, def: 2, hp: 2 }, { n: "混沌", atk: 4, def: 4 }
        ],
        SUFFIX: [
            { n: "之刃", atk: 10 }, { n: "之盾", def: 15 }, { n: "之心", hp: 100 },
            { n: "萬劫", atk: 100, hp: 500 }, { n: "滅世", atk: 500 }
        ]
    },
    // 功法定義：必須有 type (passive/active) 供 UI 判斷
    SKILLS: [
        { id: 0, name: "長生功", type: "passive", effect: { hpMul: 1.3 }, desc: "增加 30% 生命上限" },
        { id: 1, name: "烈焰斬", type: "active", proc: 0.2, effect: { dmgMul: 3 }, desc: "20%機率造成3倍傷害" },
        { id: 2, name: "回春術", type: "active", proc: 0.15, effect: { healMul: 0.4 }, desc: "15%機率回覆40%生命" }
    ],
    // 物品定義
    ITEMS: [
        { id: 100, name: "殘卷：長生功", price: 100, type: "scroll", target: 0 },
        { id: 101, name: "野豬獠牙", price: 10, type: "material" },
        { id: 102, name: "殘卷：烈焰斬", price: 500, type: "scroll", target: 1 },
        { id: 103, name: "殘卷：回春術", price: 800, type: "scroll", target: 2 }
    ]
};
