/**
 * V1.7.0 data_items.js
 * 職責：裝備詞條庫 (80組)、物品與殘卷資料
 */
window.GAMEDATA = window.GAMEDATA || {};

// 裝備詞條庫
GAMEDATA.PREFIXES = [
    /* 力量系 (Str) - 20組 */
    { name: "破碎的", attr: "str", value: 1 }, { name: "生鏽的", attr: "str", value: 2 },
    { name: "粗糙的", attr: "str", value: 3 }, { name: "沉重的", attr: "str", value: 4 },
    { name: "鋒利的", attr: "str", value: 6 }, { name: "磨損的", attr: "str", value: 7 },
    { name: "精煉的", attr: "str", value: 10 }, { name: "卓越的", attr: "str", value: 15 },
    { name: "無瑕的", attr: "str", value: 20 }, { name: "史詩的", attr: "str", value: 30 },
    { name: "傳說的", attr: "str", value: 50 }, { name: "遠古的", attr: "str", value: 80 },
    { name: "神聖的", attr: "str", value: 120 }, { name: "至尊的", attr: "str", value: 200 },
    { name: "毀滅的", attr: "str", value: 300 }, { name: "永恆的", attr: "str", value: 500 },
    { name: "混沌的", attr: "str", value: 800 }, { name: "開天的", attr: "str", value: 1200 },
    { name: "太初的", attr: "str", value: 2000 }, { name: "無上的", attr: "str", value: 5000 },

    /* 體質系 (Con) - 20組 */
    { name: "堅韌的", attr: "con", value: 1 }, { name: "厚實的", attr: "con", value: 2 },
    { name: "耐用的", attr: "con", value: 3 }, { name: "穩重的", attr: "con", value: 5 },
    { name: "強化的", attr: "con", value: 8 }, { name: "鋼鐵的", attr: "con", value: 12 },
    { name: "不拔的", attr: "con", value: 18 }, { name: "守護的", attr: "con", value: 25 },
    { name: "金剛的", attr: "con", value: 40 }, { name: "磐石的", attr: "con", value: 60 },
    { name: "大地的", attr: "con", value: 100 }, { name: "不朽的", attr: "con", value: 150 },
    { name: "玄武的", attr: "con", value: 250 }, { name: "霸體的", attr: "con", value: 400 },
    { name: "神王的", attr: "con", value: 700 }, { name: "荒古的", attr: "con", value: 1100 },
    { name: "星辰的", attr: "con", value: 1800 }, { name: "萬劫的", attr: "con", value: 3000 },
    { name: "鴻蒙的", attr: "con", value: 5000 }, { name: "永生的", attr: "con", value: 10000 },

    /* 敏捷系 (Dex) - 20組 */
    { name: "輕巧的", attr: "dex", value: 1 }, { name: "靈活的", attr: "dex", value: 2 },
    { name: "迅捷的", attr: "dex", value: 4 }, { name: "疾風的", attr: "dex", value: 6 },
    { name: "幻影的", attr: "dex", value: 10 }, { name: "閃爍的", attr: "dex", value: 15 },
    { name: "無影的", attr: "dex", value: 25 }, { name: "追風的", attr: "dex", value: 40 },
    { name: "流光的", attr: "dex", value: 70 }, { name: "電光的", attr: "dex", value: 110 },
    { name: "虛空的", attr: "dex", value: 180 }, { name: "瞬身的", attr: "dex", value: 300 },
    { name: "極速的", attr: "dex", value: 500 }, { name: "天梭的", attr: "dex", value: 850 },
    { name: "神行的", attr: "dex", value: 1400 }, { name: "破空的", attr: "dex", value: 2200 },
    { name: "時空的", attr: "dex", value: 3500 }, { name: "因果的", attr: "dex", value: 6000 },
    { name: "超脫的", attr: "dex", value: 9000 }, { name: "自在的", attr: "dex", value: 15000 },

    /* 悟性系 (Int) - 20組 */
    { name: "聰慧的", attr: "int", value: 1 }, { name: "冷靜的", attr: "int", value: 2 },
    { name: "睿智的", attr: "int", value: 4 }, { name: "通靈的", attr: "int", value: 7 },
    { name: "冥想的", attr: "int", value: 12 }, { name: "覺醒的", attr: "int", value: 20 },
    { name: "通曉的", attr: "int", value: 35 }, { name: "洞察的", attr: "int", value: 60 },
    { name: "靈犀的", attr: "int", value: 100 }, { name: "悟道的", attr: "int", value: 180 },
    { name: "天機的", attr: "int", value: 320 }, { name: "造化的", attr: "int", value: 550 },
    { name: "乾坤的", attr: "int", value: 900 }, { name: "真理的", attr: "int", value: 1500 },
    { name: "聖賢的", attr: "int", value: 2500 }, { name: "大乘的", attr: "int", value: 4000 },
    { name: "開悟的", attr: "int", value: 6500 }, { name: "萬法的", attr: "int", value: 10000 },
    { name: "至聖的", attr: "int", value: 16000 }, { name: "道源的", attr: "int", value: 30000 }
];

GAMEDATA.SUFFIXES = [
    { name: "之劍", type: "weapon", baseAtk: 10 },
    { name: "之盾", type: "armor", baseHp: 50 },
    { name: "之戒", type: "accessory", baseAtk: 5, baseHp: 20 }
];

GAMEDATA.ITEMS = {};

GAMEDATA.FRAGMENTS = {
    "f001": { id: "f001", name: "殘卷：烈焰斬", type: "fragment", targetSkill: "s001", rarity: 2 },
    "f002": { id: "f002", name: "殘卷：回春術", type: "fragment", targetSkill: "s002", rarity: 2 }
};
