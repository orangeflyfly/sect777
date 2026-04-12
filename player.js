/**
 * 宗門修仙錄 - 玩家模組 (player.js) V1.4.1
 */
function Player(core) {
    this.core = core;
    this.data = this.validateData(this.load());
    this.battle = {}; 
    this.skillCDs = [0, 0, 0]; // 追蹤三個槽位的冷卻秒數
    this.refresh();
}

Player.prototype.validateData = function(d) {
    var base = {
        lv: 1, exp: 0, money: 0, pts: 0,
        realmIdx: 0, 
        baseStats: { str: 10, vit: 10, agi: 10, int: 10 },
        equips: { weapon: null, body: null },
        bag: [],
        skills: [null, null, null], 
        learnedSkills: [],          
        mapId: 0
    };
    if (!d) return base;
    for (var key in base) { if (d[key] === undefined) d[key] = base[key]; }
    return d;
};

Player.prototype.save = function() { localStorage.setItem('X_C_S_V141', JSON.stringify(this.data)); };
Player.prototype.load = function() { 
    try { return JSON.parse(localStorage.getItem('X_C_S_V141')); } catch(e) { return null; } 
};

Player.prototype.refresh = function() {
    var d = this.data;
    var b = {
        atk: d.baseStats.str * 2,
        maxHp: d.baseStats.vit * 20,
        def: d.baseStats.vit * 1,
        dodge: d.baseStats.agi * 0.001,
        crit: 0.05,        
        critDmg: 1.5,      
        lifeSteal: 0,
        regen: d.baseStats.vit * 0.1,
        expMul: 1 + (d.baseStats.int * 0.01),
        moneyMul: 1,
        isDead: false
    };

    // 裝備多詞條加成
    var slots = ['weapon', 'body'];
    for(var i=0; i<slots.length; i++){
        var eq = d.equips[slots[i]];
        if (eq) {
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp) b.maxHp += eq.hp;
            if (eq.affixes) {
                for(var j=0; j<eq.affixes.length; j++){
                    var aff = eq.affixes[j];
                    if (aff.atk) b.atk *= aff.atk;
                    if (aff.hp) b.maxHp *= aff.hp;
                    if (aff.def) b.def *= aff.def;
                    if (aff.crit) b.crit += aff.crit;
                    if (aff.dodge) b.dodge += aff.dodge;
                    if (aff.lifeSteal) b.lifeSteal += aff.lifeSteal;
                    if (aff.exp) b.expMul *= aff.exp;
                    if (aff.money) b.moneyMul *= aff.money;
                }
            }
        }
    }

    // 被動技能
    for(var k=0; k<d.learnedSkills.length; k++){
        var s = GAME_DATA.SKILLS[d.learnedSkills[k]];
        if (s && s.type === 'passive') {
            if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
            if (s.effect.regenAdd) b.regen += s.effect.regenAdd;
        }
    }

    b.atk = Math.max(1, Math.floor(b.atk));
    b.maxHp = Math.max(10, Math.floor(b.maxHp));
    b.hp = (this.battle.hp === undefined || this.battle.hp > b.maxHp) ? b.maxHp : this.battle.hp;
    this.battle = b;
};

Player.prototype.addExp = function(v) {
    var d = this.data;
    var nextBreak = GAME_DATA.CONFIG.BREAK_LV[d.realmIdx];
    if (d.lv >= nextBreak) {
        this.core.ui.log("⚠️ 修為已達瓶頸，請速前往突破境界！", 'system', 'orange');
        return false;
    }
    d.exp += Math.floor(v * this.battle.expMul);
    var up = false;
    while (d.exp >= d.lv * 100) {
        d.exp -= d.lv * 100; d.lv++; d.pts += 5; up = true;
        if (d.lv >= nextBreak) break;
    }
    if (up) { this.refresh(); this.save(); }
    return up;
};

Player.prototype.breakthrough = function() {
    var d = this.data;
    var nextBreak = GAME_DATA.CONFIG.BREAK_LV[d.realmIdx];
    if (d.lv >= nextBreak) {
        d.realmIdx++;
        d.baseStats.str += 15; d.baseStats.vit += 15;
        this.core.ui.toast("✨ 劫雷已過，境界突破至 " + GAME_DATA.REALMS[d.realmIdx], "gold");
        this.refresh(); this.save(); this.core.ui.renderAll();
    }
};
