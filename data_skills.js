/**
 * V1.7.0 data_skills.js
 * 職責：神通技能與效果定義
 */
window.GAMEDATA = window.GAMEDATA || {};

GAMEDATA.SKILLS = {
    "s001": { id: "s001", name: "烈焰斬", desc: "匯聚火靈力於刃，造成 150% 攻擊傷害。", atkMul: 1.5 },
    "s002": { id: "s002", name: "回春術", desc: "運轉生機之氣，回復 20% 最大生命值。", healMul: 0.2 },
    "s003": { id: "s003", name: "烈焰斬·二式", desc: "烈焰焚天，造成 220% 攻擊傷害。", atkMul: 2.2 },
    "s004": { id: "s004", name: "回春術·二式", desc: "萬物生輝，回復 40% 最大生命值。", healMul: 0.4 },
    "s005": { id: "s005", name: "金剛咒", desc: "金剛不壞之身，提升大量防禦力。", defBonus: 50 }
};

// --- 全量對接核心邏輯 ---
window.DATA = window.GAMEDATA;
