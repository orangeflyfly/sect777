/**
 * 宗門修仙錄 - 玩家數據模組 (player.js) V1.2.2
 * 【核心修正】：完美適配 60 種詞條，實現屬性全自動計算
 */
function Player(core) {
    this.core = core;
    this.data = this.load() || this.initData();
    this.battle = {}; // 存放最終戰鬥數值
    this.refresh();
}

// 1. 初始化數據 (若無存檔)
Player.prototype.initData = function() {
    return {
        lv: 1, exp: 0, money: 0, pts: 0,
        baseStats: { str: 10, vit: 10, agi: 10, int: 10 },
        equips: { weapon: null, body: null },
        bag: [],
        skills: [null, null, null],
        learnedSkills: [],
        mapId: 0
    };
};

// 2. 存檔與讀取
Player.prototype.load = function() {
    try {
        var save = localStorage.getItem('X_CULTIVATION_SAVE');
        return save ? JSON.parse(save) : null;
    } catch (e) { return null; }
};
Player.prototype.save = function() {
    localStorage.setItem('X_CULTIVATION_SAVE', JSON.stringify(this.data));
};

// 3. 核心：全屬性刷新邏輯
Player.prototype.refresh = function() {
    var d = this.data;
    var b = {};

    // --- A. 基礎屬性 (由加點決定) ---
    b.atk = d.baseStats.str * 2;
    b.maxHp = d.baseStats.vit * 20;
    b.def = d.baseStats.vit * 1;
    b.dodge = d.baseStats.agi * 0.001;     // 每點身法 +0.1% 閃避
    b.lifeSteal = 0;                      // 基礎吸血
    b.regen = d.baseStats.vit * 0.1;       // 基礎回血
    b.expMul = 1 + (d.baseStats.int * 0.01); // 悟性加成 (每點 +1%)
    b.moneyMul = 1;                        // 靈石加成
    b.dmgFloor = 0.005;                    // 保底受傷
    b.isDead = false;

    // --- B. 裝備屬性掃描 (自動遍歷 60 種詞條可能產生的屬性) ---
    var types = ['weapon', 'body'];
    for (var i = 0; i < types.length; i++) {
        var eq = d.equips[types[i]];
        if (eq) {
            // 直接累加詞條帶來的數值 (注意：有些是乘法，有些是加法)
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp)  b.maxHp += eq.hp;
            if (eq.dodge) b.dodge += eq.dodge;
            if (eq.lifeSteal) b.lifeSteal += eq.lifeSteal;
            if (eq.regen) b.regen += eq.regen;
            if (eq.exp) b.expMul += (eq.exp - 1); // 經驗倍率疊加
            if (eq.money) b.moneyMul += (eq.money - 1); // 靈石倍率疊加
        }
    }

    // --- C. 功法被動加成 ---
    for (var j = 0; j < d.skills.length; j++) {
        var sId = d.skills[j];
        if (sId !== null) {
            var s = GAME_DATA.SKILLS[sId];
            if (s && s.type === "passive") {
                if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
                if (s.effect.atkMul) b.atk *= s.effect.atkMul;
                if (s.effect.defMul) b.def *= s.effect.defMul;
                if (s.effect.dodgeAdd) b.dodge += s.effect.dodgeAdd;
            }
        }
    }

    // --- D. 最終數值校準 ---
    b.atk = Math.max(1, Math.floor(b.atk));
    b.def = Math.max(0, Math.floor(b.def));
    b.maxHp = Math.max(10, Math.floor(b.maxHp));
    b.dodge = Math.min(0.8, b.dodge); // 閃避上限 80%
    
    // 血量維持
    if (!this.battle.hp || this.battle.hp > b.maxHp) {
        b.hp = b.maxHp;
    } else {
        b.hp = this.battle.hp;
    }

    this.battle = b;
};

// 4. 經驗與升級
Player.prototype.addExp = function(val) {
    var finalExp = Math.floor(val * this.battle.expMul);
    this.data.exp += finalExp;
    var up = false;
    while (this.data.exp >= (this.data.lv * 100)) {
        this.data.exp -= (this.data.lv * 100);
        this.data.lv++;
        this.data.pts += 5;
        up = true;
    }
    if (up) this.refresh();
    this.save();
    return up;
};
