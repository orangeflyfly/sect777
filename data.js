/**
 * 宗門修仙錄 - 數據資料庫 (藏經閣)
 * 存放所有靜態數值、怪物、地圖與裝備定義
 */

const GAME_DATA = {
    // 稀有度定義
    RARITY: [
        { n: "凡品", c: "#aaa" },
        { n: "良品", c: "#4caf50" },
        { n: "精品", c: "#2196f3" },
        { n: "仙品", c: "#a333c8" },
        { n: "神品", c: "#ffd700" }
    ],

    // 地圖資料 (包含產出殘卷)
    MAPS: [
        { id: 0, name: "青雲後山", lv: 1, monsters: [0, 1], drops: [100, 101] },
        { id: 1, name: "亂葬崗", lv: 10, monsters: [2, 3], drops: [102, 103] },
        { id: 2, name: "落星湖", lv: 25, monsters: [4, 5], drops: [104, 105] }
    ],

    // 怪物圖鑑
    MONSTERS: [
        { id: 0, name: "野豬", hp: 80, atk: 12, exp: 15, coin: 5, pic: "🐗" },
        { id: 1, name: "吸血蝙蝠", hp: 60, atk: 18, exp: 20, coin: 8, pic: "🦇" },
        { id: 2, name: "骷髏兵", hp: 300, atk: 45, exp: 80, coin: 30, pic: "💀" },
        { id: 3, name: "幽靈", hp: 220, atk: 65, exp: 120, coin: 50, pic: "👻" },
        { id: 4, name: "嗜血狂狼", hp: 800, atk: 150, exp: 450, coin: 150, pic: "🐺" },
        { id: 5, name: "湖底水妖", hp: 1200, atk: 120, exp: 500, coin: 200, pic: "🧞" }
    ],

    // 裝備詞條池 (前綴與後綴)
    AFFIX: {
        PREFIX: [
            { n: "鋒利的", atk: 1.2, def: 1 },
            { n: "厚實的", atk: 1, def: 1.5, hp: 1.2 },
            { n: "太初", atk: 2.5, def: 2, hp: 2 }, // 神級前綴
            { n: "殘破的", atk: 0.8, def: 0.8 }
        ],
        SUFFIX: [
            { n: "之刃", atk: 10 },
            { n: "之盾", def: 15 },
            { n: "萬劫", atk: 100, hp: 500 }, // 神級後綴
            { n: "枯骨", atk: 5, def: -5 }
        ],
        // 特殊神級詞條 (只會出現在高階裝備)
        SPECIAL: {
            REGEN: { n: "回春", desc: "每秒回血", base: 5 },
            HEAVEN: { n: "天道豁免", desc: "保底傷害降低", base: 0.001 }, // 0.1%
            LEECH: { n: "嗜血", desc: "吸血百分比", base: 0.05 } // 5%
        }
    },

    // 技能資料
    SKILLS: [
        { id: 0, name: "長生功", desc: "基礎心法，永久提升生命上限", type: "passive", effect: { hpMul: 1.2 } },
        { id: 1, name: "烈焰斬", desc: "附帶火屬性傷害，攻擊力提升", type: "active", effect: { atkMul: 1.5 } },
        { id: 2, name: "不動如山", desc: "大幅提升防禦，減少受到的傷害", type: "passive", effect: { defMul: 1.5 } },
        { id: 3, name: "青蓮劍歌", desc: "絕世劍法，機率造成三倍傷害", type: "active", effect: { critMul: 3 } }
    ],

    // 材料與殘卷
    ITEMS: [
        { id: 100, name: "殘卷：長生功", price: 100, type: "scroll", target: 0 },
        { id: 101, name: "野豬獠牙", price: 10, type: "material" },
        { id: 102, name: "殘卷：烈焰斬", price: 500, type: "scroll", target: 1 },
        { id: 103, name: "腐朽布片", price: 25, type: "material" }
    ]
};

console.log("[系統] 藏經閣 (data.js) 已就緒");
