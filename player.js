/**
 * 宗門修仙錄 - 玩家數據模組 (player.js) V1.2
 * 修正：強化數據穩定性，防止存檔/升級時導致程序崩潰
 */
function Player(core) {
    this.core = core;
    this.data = this.load() || this.initData();
    this.battle = {}; // 戰鬥實時數值
    this.refresh();
}

// 1. 初始化新玩家數據
Player.prototype.initData = function() {
    return {
        lv: 1, exp: 0, money: 0, pts: 0,
        baseStats: { str: 10, vit: 10, agi: 10, int: 10 },
        equips: { weapon: null, body: null },
        bag: [],
        skills: [null, null, null], // 三個功法槽位
        learnedSkills: [],
        mapId: 0
    };
};

// 2. 加載存檔 (帶防錯)
Player.prototype.load = function() {
    try {
        var save = localStorage.getItem('X_CULTIVATION_SAVE');
        return save ? JSON.parse(save) : null;
    } catch (e) {
        console.error("存檔讀取失敗:", e);
        return null;
    }
};

// 3. 儲存數據 (天道備份)
Player.prototype.save = function() {
    try {
        localStorage.setItem('X_CULTIVATION_SAVE', JSON.stringify(this.data));
    } catch (e) {
        console.error("存檔失敗:", e);
    }
};

// 4. 增加經驗值與境界提升
Player.prototype.addExp = function(val) {
    this.data.exp += val;
    var up = false;
    // 升級公式：等級 * 100
    while (this.data.exp >= (this.data.lv * 100)) {
        this.data.exp -= (this.data.lv * 100);
        this.data.lv++;
        this.data.pts += 5; // 每級獲得 5 點自由屬性
        up = true;
    }
    if (up) {
        this.refresh();
        this.save();
    }
    return up;
};

// 5. 核心：刷新戰鬥數值 (將所有裝備、功法、屬性加總)
Player.prototype.refresh = function() {
    var d = this.data;
    var b = {};

    // 基礎數值繼承自加點
    b.atk = d.baseStats.str * 2;
    b.maxHp = d.baseStats.vit * 20;
    b.def = d.baseStats.vit * 1;
    b.dodge = d.baseStats.agi * 0.001;     // 每點身法加 0.1% 閃避
    b.lifeSteal = d.baseStats.str * 0.0001; // 基礎微量吸血
    b.regen = d.baseStats.vit * 0.1;       // 基礎每秒回血
    b.dmgFloor = 0.005;                    // 保底受傷 0.5%
    b.isDead = false;

    // A. 穿戴裝備加成
    var types = ['weapon', 'body'];
    for (var i = 0; i < types.length; i++) {
        var eq = d.equips[types[i]];
        if (eq) {
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp) b.maxHp += eq.hp;
            if (eq.regen) b.regen += eq.regen;
            if (eq.lifeSteal) b.lifeSteal += eq.lifeSteal;
        }
    }

    // B. 已裝配功法加成 (被動屬性)
    for (var j = 0; j < d.skills.length; j++) {
        var sId = d.skills[j];
        if (sId !== null) {
            var skill = GAME_DATA.SKILLS[sId];
            if (skill && skill.type === "passive") {
                if (skill.effect.hpMul) b.maxHp *= skill.effect.hpMul;
                if (skill.effect.atkMul) b.atk *= skill.effect.atkMul;
            }
        }
    }

    // 確保數值不為負或 0
    b.atk = Math.max(1, Math.floor(b.atk));
    b.def = Math.max(0, Math.floor(b.def));
    b.maxHp = Math.max(10, Math.floor(b.maxHp));
    
    // 首次初始化或滿血狀態處理
    if (!this.battle.hp || this.battle.hp > b.maxHp) {
        b.hp = b.maxHp;
    } else {
        b.hp = this.battle.hp; // 保留當前血量
    }

    this.battle = b;
};
