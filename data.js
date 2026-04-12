/**
 * V1.7.0 data.js
 * 職責：靜態資料庫。
 * 內容：80組詞條、地圖境界門檻、殘卷碎片、妖獸與神通數據。
 */

const GAMEDATA = {
    // 全域配置
    CONFIG: {
        MAX_BAG_SLOTS: 50,
        LOG_LIMIT: 50,
        FRAGMENT_COUNT: 5,
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
        { name: "嗜血的", attr: "str", value: 20 }, { name: "狂暴的", attr: "str", value: 25 },
        { name: "破軍的", attr: "str", value: 30 }, { name: "屠龍的", attr: "str", value: 40 },
        { name: "震天的", attr: "str", value: 50 }, { name: "焚城的", attr: "str", value: 65 },
        { name: "斷岳的", attr: "str", value: 80 }, { name: "碎星的", attr: "str", value: 100 },
        { name: "造化的", attr: "str", value: 130 }, { name: "混沌的", attr: "str", value: 160 },
        { name: "開天的", attr: "str", value: 200 }, { name: "滅世的", attr: "str", value: 300 },

        /* 體質系 (Con) - 20組 */
        { name: "殘破的", attr: "con", value: 2 }, { name: "龜裂的", attr: "con", value: 4 },
        { name: "堅固的", attr: "con", value: 8 }, { name: "厚重的", attr: "con", value: 12 },
        { name: "玄鐵的", attr: "con", value: 18 }, { name: "精鋼的", attr: "con", value: 25 },
        { name: "守護的", attr: "con", value: 35 }, { name: "磐石的", attr: "con", value: 45 },
        { name: "壁壘的", attr: "con", value: 60 }, { name: "不拔的", attr: "con", value: 80 },
        { name: "不朽的", attr: "con", value: 100 }, { name: "金剛的", attr: "con", value: 130 },
        { name: "神聖的", attr: "con", value: 160 }, { name: "至尊的", attr: "con", value: 200 },
        { name: "乾坤的", attr: "con", value: 250 }, { name: "無極的", attr: "con", value: 320 },
        { name: "永恆的", attr: "con", value: 400 }, { name: "大地的", attr: "con", value: 500 },
        { name: "不死心的", attr: "con", value: 650 }, { name: "真龍的", attr: "con", value: 800 },

        /* 敏捷系 (Dex) - 20組 */
        { name: "輕盈的", attr: "dex", value: 1 }, { name: "簡潔的", attr: "dex", value: 2 },
        { name: "疾風的", attr: "dex", value: 4 }, { name: "靈巧的", attr: "dex", value: 6 },
        { name: "迅捷的", attr: "dex", value: 9 }, { name: "幻影的", attr: "dex", value: 13 },
        { name: "閃爍的", attr: "dex", value: 18 }, { name: "追風的", attr: "dex", value: 24 },
        { name: "無影的", attr: "dex", value: 32 }, { name: "破空的", attr: "dex", value: 42 },
        { name: "流星的", attr: "dex", value: 55 }, { name: "瞬身的", attr: "dex", value: 70 },
        { name: "虛空的", attr: "dex", value: 90 }, { name: "神速的", attr: "dex", value: 120 },
        { name: "自在的", attr: "dex", value: 160 }, { name: "逍遙的", attr: "dex", value: 210 },
        { name: "騰雲的", attr: "dex", value: 280 }, { name: "九天的", attr: "dex", value: 360 },
        { name: "光速的", attr: "dex", value: 480 }, { name: "太虛的", attr: "dex", value: 650 },

        /* 悟性系 (Int) - 20組 */
        { name: "沉穩的", attr: "int", value: 1 }, { name: "寧靜的", attr: "int", value: 2 },
        { name: "睿智的", attr: "int", value: 4 }, { name: "聰慧的", attr: "int", value: 6 },
        { name: "博學的", attr: "int", value: 9 }, { name: "靈動的", attr: "int", value: 13 },
        { name: "通透的", attr: "int", value: 18 }, { name: "覺醒的", attr: "int", value: 24 },
        { name: "明鏡的", attr: "int", value: 32 }, { name: "觀照的", attr: "int", value: 42 },
        { name: "悟道的", attr: "int", value: 55 }, { name: "知命的", attr: "int", value: 70 },
        { name: "通天的", attr: "int", value: 90 }, { name: "造化的", attr: "int", value: 120 },
        { name: "因果的", attr: "int", value: 160 }, { name: "輪迴的", attr: "int", value: 210 },
        { name: "鴻蒙的", attr: "int", value: 280 }, { name: "玄黃的", attr: "int", value: 360 },
        { name: "太極的", attr: "int", value: 480 }, { name: "歸一的", attr: "int", value: 650 }
    ],

    // 區域與地圖 (含境界 minRealm)
    REGIONS: {
        "region_01": {
            id: "region_01", name: "青雲州", bossId: "m005", nextRegion: "region_02",
            maps: [
                { id: 101, name: "新手村後山", level: 1, minRealm: 0, monsterIds: ["m001", "m002"], drops: ["鐵劍", "布衣"] },
                { id: 102, name: "青雲古道", level: 5, minRealm: 1, monsterIds: ["m002", "m003"], drops: ["精鋼劍", "青鋼甲"] },
                { id: 103, name: "迷霧森林", level: 10, minRealm: 2, monsterIds: ["m003", "m004"], drops: ["殘卷：烈焰斬-1", "殘卷：烈焰斬-2", "殘卷：烈焰斬-3"] }
            ]
        },
        "region_02": {
            id: "region_02", name: "滄瀾州", bossId: "m010", nextRegion: "region_03",
            maps: [
                { id: 201, name: "滄瀾江畔", level: 15, minRealm: 3, monsterIds: ["m006", "m007"], drops: ["殘卷：回春術-1", "殘卷：回春術-2"] },
                { id: 202, name: "沉船遺跡", level: 20, minRealm: 4, monsterIds: ["m007", "m008"], drops: ["殘卷：回春術-3"] },
                { id: 203, name: "怒浪礁石", level: 25, minRealm: 5, monsterIds: ["m009"], drops: ["雲瀾道袍"] }
            ]
        }
    },

    // 怪物
    MONSTERS: {
        "m001": { id: "m001", name: "野兔", icon: "🐇", hp: 30, atk: 5, exp: 10, gold: 5 },
        "m002": { id: "m002", name: "山雞", icon: "🐔", hp: 50, atk: 8, exp: 15, gold: 8 },
        "m003": { id: "m003", name: "灰狼", icon: "🐺", hp: 120, atk: 18, exp: 40, gold: 20 },
        "m004": { id: "m004", name: "猛虎", icon: "🐯", hp: 250, atk: 35, exp: 80, gold: 50 },
        "m005": { id: "m005", name: "青雲虎王", icon: "🐯", hp: 1500, atk: 120, exp: 500, gold: 200, isBoss: true }
    },

    // 殘卷與技能關聯
    FRAGMENTS: {
        "烈焰斬": { targetId: "s001", sellPrice: 50 },
        "回春術": { targetId: "s002", sellPrice: 80 }
    },

    SKILLS: {
        "s001": { id: "s001", name: "烈焰斬", desc: "造成 150% 攻擊力的傷害。", baseDmg: 1.5 },
        "s002": { id: "s002", name: "回春術", desc: "每秒回復 10 點生命值。", baseHeal: 10 }
    },

    getMonster(id) { return this.MONSTERS[id] || null; }
};

console.log("✅ [V1.7.0] data.js 基礎數據層加固完成。");
