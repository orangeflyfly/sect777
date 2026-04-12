/**
 * 宗門修仙錄 - 玩家模組 (player.js) V1.4
 */
function Player(core) {
    this.core = core;
    this.data = this.validateData(this.load());
    this.battle = {}; 
    this.refresh();
}

Player.prototype.validateData = function(d) {
    const base = {
        lv: 1, exp: 0, money: 0, pts: 0,
        realmIdx: 0, // 境界索引
        baseStats: { str: 10, vit: 10, agi: 10, int: 10 },
        equips: { weapon: null, body: null },
        bag: [],
        skills: [null, null, null], // 裝備中的 3 個技能槽
        learnedSkills: [],          // 已學會的技能 ID
        mapId: 0
    };
    if (!d) return base;
    // 確保新舊欄位補齊
    for (let key in base) { if (d[key] === undefined) d[key] = base[key]; }
    return d;
};

Player.prototype.save = function() { localStorage.setItem('X_C_S_V14', JSON.stringify(this.data)); };
Player.prototype.load = function() { 
    try { return JSON.parse(localStorage.getItem('X_C_S_V14')); } catch(e) { return null; } 
};

Player.prototype.refresh = function() {
    const d = this.data;
    const b = {
        atk: d.baseStats.str * 2,
        maxHp: d.baseStats.vit * 20,
        def: d.baseStats.vit * 1,
        dodge: d.baseStats.agi * 0.001,
        crit: 0.05,        // 基礎暴擊 5%
        critDmg: 1.5,      // 基礎暴傷 150%
        lifeSteal: 0,
        regen: d.baseStats.vit * 0.1,
        expMul: 1 + (d.baseStats.int * 0.01),
        moneyMul: 1,
        isDead: false
    };

    // 裝備屬性加成 (支持多詞條疊加)
    ['weapon', 'body'].forEach(slot => {
        const eq = d.equips[slot];
        if (eq) {
            // 1. 本體屬性
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp) b.maxHp += eq.hp;
            // 2. 多詞條屬性 (affixes 陣列)
            if (eq.affixes) {
                eq.affixes.forEach(aff => {
                    if (aff.atk) b.atk *= aff.atk; // 詞條通常是倍率
                    if (aff.hp) b.maxHp *= aff.hp;
                    if (aff.def) b.def *= aff.def;
                    if (aff.crit) b.crit += aff.crit;
                    if (aff.dodge) b.dodge += aff.dodge;
                    if (aff.lifeSteal) b.lifeSteal += aff.lifeSteal;
                    if (aff.exp) b.expMul *= aff.exp;
                    if (aff.money) b.moneyMul *= aff.money;
                });
            }
        }
    });

    // 被動技能加成
    d.learnedSkills.forEach(sId => {
        const s = GAME_DATA.SKILLS[sId];
        if (s && s.type === 'passive') {
            if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
            if (s.effect.regenAdd) b.regen += s.effect.regenAdd;
        }
    });

    b.atk = Math.max(1, Math.floor(b.atk));
    b.maxHp = Math.max(10, Math.floor(b.maxHp));
    b.hp = (this.battle.hp === undefined || this.battle.hp > b.maxHp) ? b.maxHp : this.battle.hp;
    this.battle = b;
};

Player.prototype.addExp = function(v) {
    const d = this.data;
    const nextBreak = GAME_DATA.CONFIG.BREAK_LV[d.realmIdx];
    
    // 檢查是否到達瓶頸
    if (d.lv >= nextBreak) {
        this.core.ui.log(`⚠️ 到達 ${GAME_DATA.REALMS[d.realmIdx]} 瓶頸，請手動突破！`, 'system', 'orange');
        return false;
    }

    d.exp += Math.floor(v * this.battle.expMul);
    let up = false;
    while (d.exp >= d.lv * 100) {
        d.exp -= d.lv * 100;
        d.lv++;
        d.pts += 5;
        up = true;
        // 升級時再次檢查瓶頸
        if (d.lv >= GAME_DATA.CONFIG.BREAK_LV[d.realmIdx]) break;
    }
    if (up) { this.refresh(); this.save(); }
    return up;
};

Player.prototype.breakthrough = function() {
    const d = this.data;
    const nextBreak = GAME_DATA.CONFIG.BREAK_LV[d.realmIdx];
    if (d.lv >= nextBreak) {
        d.realmIdx++;
        d.baseStats.str += 10; d.baseStats.vit += 10; // 突破獎勵
        this.core.ui.toast(`✨ 突破成功！進入 ${GAME_DATA.REALMS[d.realmIdx]}`, 'gold');
        this.refresh(); this.save();
        this.core.ui.renderAll();
    }
};
