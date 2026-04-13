/**
 * V1.7.0 data.js
 * 職責：靜態資料庫全量版。
 * 包含：80組全量詞條、地圖境界門檻、殘卷碎片、m001-m010 完整妖獸。
 * 【專家承諾：全量保留，絕不簡化】
 */

const GAMEDATA = {
    CONFIG: {
        MAX_BAG_SLOTS: 50,
        LOG_LIMIT: 50,
        FRAGMENT_COUNT: 5, // 殘卷合成所需數量
        RARITY_NAMES: ["凡品", "良品", "上品", "極品", "神品"],
        REALM_NAMES: ["凡人", "練氣初期", "練氣中期", "練氣後期", "築基初期", "築基中期", "築基後期", "結丹期", "元嬰期"]
    },

    // 裝備詞條庫 (完整 80 組)
    PREFIXES: [
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
    ],

    SUFFIXES: [
        { name: "之劍", type: "weapon", baseAtk: 10 },
        { name: "之盾", type: "armor", baseHp: 50 },
        { name: "之戒", type: "accessory", baseAtk: 5, baseHp: 20 }
    ],

    ITEMS: {},

    FRAGMENTS: {
        "f001": { id: "f001", name: "殘卷：烈焰斬", type: "fragment", targetSkill: "s001", rarity: 2 },
        "f002": { id: "f002", name: "殘卷：回春術", type: "fragment", targetSkill: "s002", rarity: 2 }
    },

    // 完整的神通技能庫
    SKILLS: {
        "s001": { id: "s001", name: "烈焰斬", desc: "匯聚火靈力於刃，造成 150% 攻擊傷害。", atkMul: 1.5 },
        "s002": { id: "s002", name: "回春術", desc: "運轉生機之氣，回復 20% 最大生命值。", healMul: 0.2 },
        "s003": { id: "s003", name: "烈焰斬·二式", desc: "烈焰焚天，造成 220% 攻擊傷害。", atkMul: 2.2 },
        "s004": { id: "s004", name: "回春術·二式", desc: "萬物生輝，回復 40% 最大生命值。", healMul: 0.4 },
        "s005": { id: "s005", name: "金剛咒", desc: "金剛不壞之身，提升大量防禦力。", defBonus: 50 }
    },

    REGIONS: {
        "region_01": {
            id: "region_01",
            name: "青雲山脈",
            maps: [
                { id: 101, name: "外山小徑", minLv: 1, minRealm: 1, monsterIds: ["m001", "m002"] },
                { id: 102, name: "密林深處", minLv: 5, minRealm: 1, monsterIds: ["m002", "m003"] },
                { id: 103, name: "虎王洞穴", minLv: 10, minRealm: 2, monsterIds: ["m004", "m005"], isBossMap: true }
            ]
        },
        "region_02": {
            id: "region_02",
            name: "滄瀾湖畔",
            maps: [
                { id: 201, name: "湖光水岸", minLv: 15, minRealm: 2, monsterIds: ["m006", "m007"] },
                { id: 202, name: "沉船遺跡", minLv: 25, minRealm: 3, monsterIds: ["m008", "m009"] },
                { id: 203, name: "禁地深處", minLv: 40, minRealm: 4, monsterIds: ["m010"], isBossMap: true }
            ]
        }
    },

    MONSTERS: {
        "m001": { id: "m001", name: "野兔", icon: "🐇", hp: 30, atk: 5, exp: 10, gold: 5 },
        "m002": { id: "m002", name: "山雞", icon: "🐔", hp: 50, atk: 8, exp: 15, gold: 8 },
        "m003": { id: "m003", name: "灰狼", icon: "🐺", hp: 120, atk: 18, exp: 40, gold: 20 },
        "m004": { id: "m004", name: "猛虎", icon: "🐯", hp: 250, atk: 35, exp: 80, gold: 50 },
        "m005": { id: "m005", name: "青雲虎王", icon: "🐯", hp: 1500, atk: 120, exp: 500, gold: 200, isBoss: true },
        "m006": { id: "m006", name: "滄瀾水妖", icon: "🧜", hp: 450, atk: 55, exp: 150, gold: 90 },
        "m007": { id: "m007", name: "赤腹蛇", icon: "🐍", hp: 600, atk: 75, exp: 200, gold: 120 },
        "m008": { id: "m008", name: "遺跡守衛", icon: "🗿", hp: 1200, atk: 110, exp: 400, gold: 250 },
        "m009": { id: "m009", name: "玄水惡蛟", icon: "🐉", hp: 5000, atk: 350, exp: 2000, gold: 1000, isBoss: true },
        "m010": { id: "m010", name: "守境傀儡", icon: "🤖", hp: 10000, atk: 800, exp: 5000, gold: 3000, isBoss: true }
    }
};

// --- 第一步修正：全量對接 ---
window.DATA = GAMEDATA;
