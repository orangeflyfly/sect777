/**
 * V1.5.12 data.js
 * 職責：全量靜態資料庫 (80+ 詞條、全怪物、全地圖)
 * 狀態：全量實裝，禁止簡化。
 */

const GAMEDATA = {
    CONFIG: {
        MAX_BAG_SLOTS: 50,
        BOSS_KILL_REQUIRE: 10,
        RARITY_NAMES: ["凡品", "良品", "精品", "極品", "神品"],
        RARITY_COLORS: ["#95a5a6", "#2ecc71", "#3498db", "#9b59b6", "#f1c40f"]
    },

    // --- 80 個隨機詞條 (全量列出，絕無刪減) ---
    PREFIXES: [
        /* 凡品 (1-20) */
        { name: "鋒利的", attr: "str", value: 2, rarity: 1 }, { name: "破碎的", attr: "str", value: 1, rarity: 1 },
        { name: "堅固的", attr: "con", value: 2, rarity: 1 }, { name: "破舊的", attr: "con", value: 1, rarity: 1 },
        { name: "輕盈的", attr: "dex", value: 2, rarity: 1 }, { name: "笨重的", attr: "dex", value: 1, rarity: 1 },
        { name: "睿智的", attr: "int", value: 2, rarity: 1 }, { name: "遲鈍的", attr: "int", value: 1, rarity: 1 },
        { name: "生鏽的", attr: "str", value: 1, rarity: 1 }, { name: "粗糙的", attr: "str", value: 2, rarity: 1 },
        { name: "耐用的", attr: "con", value: 3, rarity: 1 }, { name: "平凡的", attr: "con", value: 2, rarity: 1 },
        { name: "迅捷的", attr: "dex", value: 3, rarity: 1 }, { name: "靈活的", attr: "dex", value: 2, rarity: 1 },
        { name: "沉穩的", attr: "int", value: 3, rarity: 1 }, { name: "清醒的", attr: "int", value: 2, rarity: 1 },
        { name: "剛硬的", attr: "str", value: 3, rarity: 1 }, { name: "柔軟的", attr: "dex", value: 3, rarity: 1 },
        { name: "冰冷的", attr: "int", value: 3, rarity: 1 }, { name: "溫熱的", attr: "con", value: 3, rarity: 1 },

        /* 良品 (21-40) */
        { name: "噴火的", attr: "str", value: 6, rarity: 2 }, { name: "淬毒的", attr: "dex", value: 6, rarity: 2 },
        { name: "精湛的", attr: "int", value: 6, rarity: 2 }, { name: "強韌的", attr: "con", value: 6, rarity: 2 },
        { name: "大師的", attr: "str", value: 8, rarity: 2 }, { name: "精準的", attr: "dex", value: 8, rarity: 2 },
        { name: "鋼鐵的", attr: "con", value: 8, rarity: 2 }, { name: "學識的", attr: "int", value: 8, rarity: 2 },
        { name: "野獸之", attr: "str", value: 7, rarity: 2 }, { name: "飛燕之", attr: "dex", value: 7, rarity: 2 },
        { name: "巨岩之", attr: "con", value: 7, rarity: 2 }, { name: "靈貓之", attr: "dex", value: 9, rarity: 2 },
        { name: "嗜血的", attr: "str", value: 10, rarity: 2 }, { name: "不拔的", attr: "con", value: 10, rarity: 2 },
        { name: "破法的", attr: "int", value: 10, rarity: 2 }, { name: "疾行的", attr: "dex", value: 10, rarity: 2 },
        { name: "閃耀的", attr: "int", value: 7, rarity: 2 }, { name: "厚重的", attr: "con", value: 9, rarity: 2 },
        { name: "虎威的", attr: "str", value: 9, rarity: 2 }, { name: "鷹眼的", attr: "dex", value: 9, rarity: 2 },

        /* 精品 (41-60) */
        { name: "狂暴的", attr: "str", value: 18, rarity: 3 }, { name: "幻影的", attr: "dex", value: 18, rarity: 3 },
        { name: "不動的", attr: "con", value: 18, rarity: 3 }, { name: "冥想的", attr: "int", value: 18, rarity: 3 },
        { name: "灼熱的", attr: "str", value: 22, rarity: 3 }, { name: "寒冰的", attr: "int", value: 22, rarity: 3 },
        { name: "疾風的", attr: "dex", value: 22, rarity: 3 }, { name: "大地的", attr: "con", value: 22, rarity: 3 },
        { name: "破滅的", attr: "str", value: 25, rarity: 3 }, { name: "守護的", attr: "con", value: 25, rarity: 3 },
        { name: "智慧的", attr: "int", value: 25, rarity: 3 }, { name: "流星的", attr: "dex", value: 25, rarity: 3 },
        { name: "雷霆的", attr: "str", value: 28, rarity: 3 }, { name: "聖光的", attr: "int", value: 28, rarity: 3 },
        { name: "神速的", attr: "dex", value: 28, rarity: 3 }, { name: "鋼鐵意志的", attr: "con", value: 28, rarity: 3 },
        { name: "深淵的", attr: "int", value: 20, rarity: 3 }, { name: "熔岩的", attr: "str", value: 20, rarity: 3 },
        { name: "狂風的", attr: "dex", value: 20, rarity: 3 }, { name: "不朽的", attr: "con", value: 20, rarity: 3 },

        /* 極品 (61-75) */
        { name: "毀滅之", attr: "str", value: 45, rarity: 4 }, { name: "不朽之", attr: "con", value: 45, rarity: 4 },
        { name: "時空之", attr: "dex", value: 45, rarity: 4 }, { name: "真理之", attr: "int", value: 45, rarity: 4 },
        { name: "巨龍的", attr: "str", value: 50, rarity: 4 }, { name: "泰坦的", attr: "con", value: 50, rarity: 4 },
        { name: "先知的", attr: "int", value: 50, rarity: 4 }, { name: "影流的", attr: "dex", value: 50, rarity: 4 },
        { name: "災厄的", attr: "str", value: 55, rarity: 4 }, { name: "神蹟的", attr: "con", value: 55, rarity: 4 },
        { name: "星辰的", attr: "int", value: 55, rarity: 4 }, { name: "月影的", attr: "dex", value: 55, rarity: 4 },
        { name: "霸主的", attr: "str", value: 60, rarity: 4 }, { name: "至尊的", attr: "con", value: 60, rarity: 4 },
        { name: "賢者的", attr: "int", value: 60, rarity: 4 },

        /* 神品 (76-80+) */
        { name: "混沌·", attr: "str", value: 120, rarity: 5 },
        { name: "鴻蒙·", attr: "con", value: 120, rarity: 5 },
        { name: "天道·", attr: "int", value: 120, rarity: 5 },
        { name: "太虛·", attr: "dex", value: 120, rarity: 5 },
        { name: "【弒神】", attr: "str", value: 150, rarity: 5 },
        { name: "【不死】", attr: "con", value: 150, rarity: 5 },
        { name: "【全知】", attr: "int", value: 150, rarity: 5 },
        { name: "【瞬身】", attr: "dex", value: 150, rarity: 5 },
        { name: "核心·", attr: "str", value: 200, rarity: 5 }
    ],

    // --- 妖獸資料 ---
    MONSTERS: {
        "m001": { name: "草泥兔", hp: 30, atk: 5, gold: 10, exp: 5, icon: "🐇" },
        "m002": { name: "偷雞賊", hp: 50, atk: 8, gold: 15, exp: 10, icon: "👤" },
        "m003": { name: "青青草原蛇", hp: 80, atk: 12, gold: 25, exp: 20, icon: "🐍" },
        "m004": { name: "狂暴野豬", hp: 150, atk: 25, gold: 50, exp: 45, icon: "🐗" },
        "m005": { name: "護山神犬", hp: 500, atk: 60, gold: 200, exp: 150, icon: "🐕", isBoss: true },
        "m101": { name: "烈火鳥", hp: 800, atk: 120, gold: 500, exp: 400, icon: "🐦" },
        "m102": { name: "熔岩巨人", hp: 2000, atk: 250, gold: 1200, exp: 1000, icon: "🗿" },
        "m105": { name: "地獄火領主", hp: 8000, atk: 600, gold: 5000, exp: 4500, icon: "🔥", isBoss: true }
    },

    // --- 地圖與掉落 ---
    REGIONS: [
        {
            id: "qingyun",
            name: "青雲州",
            bossId: "m005",
            nextRegion: "canglan",
            maps: [
                { id: 0, name: "新手村後山", level: 1, monsterIds: ["m001", "m002"], drops: ["粗鐵劍", "布衣"] },
                { id: 1, name: "迷霧森林", level: 5, monsterIds: ["m002", "m003"], drops: ["精鐵劍", "皮甲"] },
                { id: 2, name: "野豬林", level: 10, monsterIds: ["m003", "m004"], drops: ["青鋼劍", "鎖子甲"] }
            ]
        },
        {
            id: "canglan",
            name: "滄瀾州",
            bossId: "m105",
            nextRegion: null,
            maps: [
                { id: 10, name: "烈焰谷", level: 20, monsterIds: ["m101"], drops: ["流火劍", "紅蓮甲"] },
                { id: 11, name: "熔岩深淵", level: 30, monsterIds: ["m102"], drops: ["重玄劍", "岩神鎧"] }
            ]
        }
    ],

    // --- 神通資料 ---
    SKILLS: {
        "s001": { name: "烈焰斬", desc: "附帶火焰傷害，威力不俗", type: "active", baseDmg: 20 },
        "s002": { name: "回春術", desc: "調動靈氣，修復肉身傷勢", type: "heal", baseHeal: 15 },
        "s003": { name: "破天一劍", desc: "引動天地之力，造成毀滅打擊", type: "active", baseDmg: 100 }
    }
};

console.log("✅ [V1.5.12] data.js 全量資料載入完成，80+ 詞條無一遺漏。");
