/**
 * 仙俠宗門 V0.7.2 - 數據庫
 */
const AFFIX_DATA = {
    str: { label: "破軍系", bonus: "攻擊", list: ["猛烈的", "狂暴的", "摧城的", "霸道的", "碎星的", "巨力的", "萬鈞的", "震天的", "開山的", "荒古的"] },
    vit: { label: "不動系", bonus: "氣血", list: ["結實的", "厚重的", "如山的", "不朽的", "磐石的", "玄武的", "固本的", "龍鱗的", "混元的", "不滅的"] },
    agi: { label: "神行系", bonus: "身法", list: ["迅捷的", "殘影的", "流風的", "逐日的", "騰雲的", "幻影的", "驚雷的", "瞬身的", "極意的"] },
    int: { label: "天啟系", bonus: "靈力", list: ["聰慧的", "通靈的", "玄門的", "太極的", "星辰的", "混沌的", "乾坤的", "悟道的", "靈妙的", "歸一的"] }
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
