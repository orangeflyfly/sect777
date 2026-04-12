/**
 * 宗門修仙錄 - 玩家模組 (player.js) V1.4.1
 * 職責：處理存檔、數值洗髓、境界突破邏輯
 */
function Player(core) {
    this.core = core;
    // 初始數據校驗
    this.data = this.validateData(this.load());
    this.battle = {}; 
    this.skillCDs = [0, 0, 0]; 
    this.refresh();
}

/**
 * 數據天衣：確保所有欄位存在，防止空指針錯誤
 */
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
    for (var key in base) {
        if (d[key] === undefined) {
            d[key] = base[key];
        }
    }
    return d;
};

Player.prototype.save = function() {
    localStorage.setItem('X_C_S_V141', JSON.stringify(this.data));
};

Player.prototype.load = function() { 
    try {
        var saved = localStorage.getItem('X_C_S_V141');
        return saved ? JSON.parse(saved) : null;
    } catch(e) {
        return null;
    } 
};

/**
 * 屬性洗髓：將基礎屬性、裝備詞條、被動功法揉合
 */
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

    // 1. 裝備與暴力詞條權重計算
    var slots = ['weapon', 'body'];
    for (var i = 0; i < slots.length; i++) {
        var eq = d.equips[slots[i]];
        if (eq) {
            // 本體加成
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp) b.maxHp += eq.hp;
            // 詞條乘法/加法疊加
            if (eq.affixes && eq.affixes.length > 0) {
                for (var j = 0; j < eq.affixes.length; j++) {
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

    // 2. 被動神通加成
    if (d.learnedSkills && d.learnedSkills.length > 0) {
        for (var k = 0; k < d.learnedSkills.length; k++) {
            var s = GAME_DATA.SKILLS[d.learnedSkills[k]];
            if (s && s.type === 'passive') {
                if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
                if (s.effect.regenAdd) b.regen += s.effect.regenAdd;
            }
        }
    }

    // 3. 數值落地與血量保持
    b.atk = Math.max(1, Math.floor(b.atk));
    b.maxHp = Math.max(10, Math.floor(b.maxHp));
    
    // 繼承當前血量比例，避免刷新時突然暴斃或回滿
    var oldHp = this.battle.hp;
    b.hp = (oldHp === undefined || oldHp > b.maxHp) ? b.maxHp : oldHp;
    
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
    var isLevelUp = false;
    
    while (d.exp >= d.lv * 100) {
        d.exp -= d.lv * 100;
        d.lv++;
        d.pts += 5;
        isLevelUp = true;
        // 觸發等級瓶頸即停止自動升級
        if (d.lv >= nextBreak) break;
    }

    if (isLevelUp) {
        this.refresh();
        this.save();
    }
    return isLevelUp;
};

Player.prototype.breakthrough = function() {
    var d = this.data;
    var nextBreak = GAME_DATA.CONFIG.BREAK_LV[d.realmIdx];
    if (d.lv >= nextBreak) {
        d.realmIdx++;
        // 突破獎勵
        d.baseStats.str += 15;
        d.baseStats.vit += 15;
        this.core.ui.toast("✨ 劫雷已過，境界突破至 " + GAME_DATA.REALMS[d.realmIdx], "gold");
        this.refresh();
        this.save();
        this.core.ui.renderAll();
    }
};
