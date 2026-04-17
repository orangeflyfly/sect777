/**
 * V3.5.9 data_items.js (萬象歸一 - 法寶總綱版)
 * 職責：物品數據庫、裝備詞條庫 (80組)、物品模版與殘卷資料
 * 修正：補完妖獸素材模版、擴充裝備後綴、實裝資源歸一化模版
 */

// 1. 導出裝備詞條庫 (Prefixes) - 保持原味 80 組，絕不簡化
export const PREFIXES = [
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

// 2. 導出後綴庫 (Suffixes) - 🌟 擴充：增加法寶多樣性
export const SUFFIXES = [
    /* 武器類 */
    { name: "之劍", type: "weapon", baseAtk: 10 },
    { name: "之刃", type: "weapon", baseAtk: 12 },
    { name: "之斧", type: "weapon", baseAtk: 15 },
    { name: "之杖", type: "weapon", baseAtk: 8, baseInt: 5 },
    
    /* 護甲類 */
    { name: "之盾", type: "armor", baseHp: 50, baseDef: 5 },
    { name: "之甲", type: "armor", baseHp: 80, baseDef: 3 },
    { name: "之袍", type: "armor", baseHp: 40, baseDef: 2, baseInt: 3 },
    
    /* 飾品類 */
    { name: "之戒", type: "accessory", baseAtk: 5, baseHp: 20 },
    { name: "之佩", type: "accessory", baseInt: 10 },
    { name: "之符", type: "accessory", baseDex: 8 },
    { name: "之護心鏡", type: "accessory", baseHp: 100 }
];

// 3. 導出物品庫 - 🌟 補完：定義所有可能出現的實體道具模版
export const ITEMS = {
    // --- 資源歸一化模版 (供商店大腦讀取定價) ---
    "herb": { id: "herb", name: "仙草", type: "material", rarity: 2, desc: "蘊含靈氣的草藥，煉丹必備。" },
    "ore": { id: "ore", name: "玄鐵", type: "material", rarity: 2, desc: "堅硬的礦石，煉器基石。" },

    // --- 妖獸素材模版 (對應 data_monsters.js) ---
    "rabbit_fur": { id: "rabbit_fur", name: "柔軟兔毛", type: "material", rarity: 1, desc: "野兔身上的細毛，可製作低階符紙。" },
    "feather": { id: "feather", name: "山雞翎羽", type: "material", rarity: 1, desc: "山雞尾部的羽毛，質地堅韌。" },
    "wolf_fang": { id: "wolf_fang", name: "殘缺狼牙", type: "material", rarity: 1, desc: "灰狼的犬齒，隱約帶著一絲煞氣。" },
    "wolf_hide": { id: "wolf_hide", name: "灰狼皮", type: "material", rarity: 2, desc: "完整的灰狼皮毛，是製作皮甲的好材料。" },
    "tiger_claw": { id: "tiger_claw", name: "猛虎利爪", type: "material", rarity: 2, desc: "猛虎最鋒利的爪子，透著寒芒。" },
    "tiger_bone": { id: "tiger_bone", name: "虎王壯骨", type: "material", rarity: 3, desc: "虎王的一截脛骨，沉重如鐵。" },
    "tiger_soul": { id: "tiger_soul", name: "虎王精魂", type: "material", rarity: 4, desc: "凝聚了虎王生前殺意的精魄。" },
    "snake_skin": { id: "snake_skin", name: "乾枯蛇皮", type: "material", rarity: 1, desc: "赤腹蛇蛻下的老皮。" },
    "snake_gall": { id: "snake_gall", name: "赤腹蛇膽", type: "material", rarity: 2, desc: "極苦的蛇膽，具有清熱明目之效。" },
    "water_bead": { id: "water_bead", name: "水靈珠碎塊", type: "material", rarity: 2, desc: "破碎的靈珠，依舊散發著水靈力。" },
    "ancient_iron": { id: "ancient_iron", name: "鏽蝕古鐵", type: "material", rarity: 2, desc: "遺跡守衛崩裂落下的金屬殘片。" },
    "dragon_blood": { id: "dragon_blood", name: "蛟龍真血", type: "material", rarity: 4, desc: "玄水惡蛟的一滴本命精血，狂暴無比。" },
    "dragon_scale": { id: "dragon_scale", name: "惡蛟逆鱗", type: "material", rarity: 5, desc: "觸之必怒！蛟龍全身最堅硬的一塊鱗片。" },
    "golem_core": { id: "golem_core", name: "傀儡動力核心", type: "material", rarity: 5, desc: "守境傀儡的核心，跳動著精準的靈力脈衝。" },
    "boar_tusk": { id: "boar_tusk", name: "魔化獠牙", type: "material", rarity: 2, desc: "被魔氣侵染的獠牙，漆黑如墨。" },
    "spider_silk": { id: "spider_silk", name: "劇毒蛛絲", type: "material", rarity: 2, desc: "幽林毒蛛吐出的黏稠絲線。" },
    "venom_sac": { id: "venom_sac", name: "毒囊", type: "material", rarity: 3, desc: "充滿劇毒液體的腺體。" },
    "bat_wing": { id: "bat_wing", name: "嗜血蝠翼", type: "material", rarity: 1, desc: "蝙蝠的膜翼，輕薄如紙。" },
    "ape_fur": { id: "ape_fur", name: "烈焰猿鬃", type: "material", rarity: 3, desc: "烈焰巨猿頸部的毛髮，摸起來微微發燙。" },
    "spirit_branch": { id: "spirit_branch", name: "聚靈枯枝", type: "material", rarity: 3, desc: "萬年樹妖身上充滿靈氣的殘枝。" },
    "tree_heart": { id: "tree_heart", name: "萬年木心", type: "material", rarity: 5, desc: "整棵樹妖的生命精華，萬年方成一寸。" }
};

// 4. 導出殘卷庫
export const FRAGMENTS = {
    "f001": { id: "f001", name: "殘卷：烈焰斬", type: "fragment", targetSkill: "s001", rarity: 2 },
    "f002": { id: "f002", name: "殘卷：回春術", type: "fragment", targetSkill: "s002", rarity: 2 }
};

/**
 * --- 🛡️ 兼容性法陣 ---
 */
window.GAMEDATA = window.GAMEDATA || {};
window.GAMEDATA.PREFIXES = PREFIXES;
window.GAMEDATA.SUFFIXES = SUFFIXES;
window.GAMEDATA.ITEMS = ITEMS;
window.GAMEDATA.FRAGMENTS = FRAGMENTS;

console.log("💎 物品數據庫 V3.5.9 ESM 模組載入成功，法寶總綱已同步。");
