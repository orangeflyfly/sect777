/**
 * 仙俠宗門 V0.8.0 - 數據庫
 */
const AFFIX_DATA = {
    str: { label: "破軍", bonus: "攻擊", list: ["斬龍", "霸王", "毀滅", "碎星", "屠魔", "開山", "荒古", "震天", "萬鈞", "巨力"] },
    vit: { label: "不動", bonus: "氣血", list: ["鎮岳", "玄武", "不朽", "磐石", "龍鱗", "混元", "不滅", "固本", "如山", "厚重"] },
    agi: { label: "神行", bonus: "身法", list: ["瞬身", "幻影", "逐日", "流風", "疾風", "殘影", "驚雷", "極意", "迅捷", "騰雲"] },
    int: { label: "天啟", bonus: "靈力", list: ["乾坤", "混沌", "星辰", "玄門", "悟道", "太極", "歸一", "通靈", "聰慧", "靈妙"] }
};

const MAP_DATA = {
    area1: {
        id: "area1", name: "青雲後山", reqLv: 1, 
        monsters: ["野兔 🐰", "小蛇 🐍", "草精 🌱"],
        boss: { n: "山豬王 🐗", hpMult: 8, expMult: 5, goldMult: 5 },
        bias: "str"
    },
    area2: {
        id: "area2", name: "亂葬崗", reqLv: 11, 
        monsters: ["骷髏 💀", "怨靈 👻", "殭屍 🧟"],
        boss: { n: "千年殭屍王 🧛", hpMult: 12, expMult: 8, goldMult: 10 },
        bias: "vit"
    },
    area3: {
        id: "area3", name: "焚天谷", reqLv: 21, 
        monsters: ["火妖 🔥", "熔岩怪 🪨", "炎雀 🦅"],
        boss: { n: "九天鳳凰 🦢", hpMult: 20, expMult: 15, goldMult: 20 },
        bias: "int"
    }
};

const ITEM_BASE = {
    weapon: ["長劍", "重錘", "靈珠", "唐刀", "法杖", "巨斧"],
    body: ["布袍", "輕甲", "重鎧", "法衣", "道袍", "龍鱗甲"]
};
