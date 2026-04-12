/**
 * 宗門修仙錄 - 玩家模組 (player.js) V1.3.1
 * 職責：管理屬性計算、經驗升級、數據存檔與容錯校正
 */
function Player(core) {
    this.core = core;
    // 讀取存檔並進行數據洗髓，確保新舊版本相容
    const rawData = this.load();
    this.data = this.validateData(rawData);
    this.battle = {}; // 存放戰鬥時的最終計算數值
    this.refresh();
}

/**
 * 數據洗髓：檢查存檔欄位，若有缺失則補齊預設值
 */
Player.prototype.validateData = function(d) {
    const base = this.initData();
    if (!d) return base;
    
    // 確保關鍵欄位存在，防止 forEach 或存取時崩潰
    d.learnedSkills = d.learnedSkills || [];
    d.skills = d.skills || [null, null, null];
    d.baseStats = d.baseStats || base.baseStats;
    d.equips = d.equips || base.equips;
    d.bag = d.bag || [];
    d.pts = (d.pts === undefined) ? base.pts : d.pts;
    d.money = (d.money === undefined) ? base.money : d.money;
    d.mapId = (d.mapId === undefined) ? base.mapId : d.mapId;
    
    return d;
};

/**
 * 初始化全新角色數據
 */
Player.prototype.initData = function() {
    return {
        lv: 1,
        exp: 0,
        money: 0,
        pts: 0, // 潛能點
        baseStats: {
            str: 10, // 力量 -> 攻擊
            vit: 10, // 體質 -> 生命、防禦、回血
            agi: 10, // 身法 -> 閃避
            int: 10  // 悟性 -> 經驗倍率
        },
        equips: {
            weapon: null,
            body: null
        },
        bag: [],
        skills: [null, null, null], // 當前裝備的主動技能
        learnedSkills: [],          // 已參透學會的所有技能 ID
        mapId: 0
    };
};

/**
 * 存檔與讀取邏輯 (使用 V13 專用標籤)
 */
Player.prototype.load = function() { 
    try { 
        const s = localStorage.getItem('X_C_S_V13'); 
        return s ? JSON.parse(s) : null; 
    } catch (e) { 
        console.error("讀取存檔失敗:", e);
        return null; 
    } 
};

Player.prototype.save = function() { 
    localStorage.setItem('X_C_S_V13', JSON.stringify(this.data)); 
};

/**
 * 刷新戰鬥屬性 (將基礎屬性、裝備加成、被動功法加成合併計算)
 */
Player.prototype.refresh = function() {
    const d = this.data;
    // 基礎換算公式
    const b = {
        atk: d.baseStats.str * 2,
        maxHp: d.baseStats.vit * 20,
        def: d.baseStats.vit * 1,
        dodge: d.baseStats.agi * 0.001,
        lifeSteal: 0,
        regen: d.baseStats.vit * 0.1,
        expMul: 1 + (d.baseStats.int * 0.01),
        moneyMul: 1,
        isDead: false
    };

    // 加上裝備屬性
    ['weapon', 'body'].forEach(t => {
        const e = d.equips[t];
        if (e) { 
            if (e.atk) b.atk += e.atk;
            if (e.def) b.def += e.def;
            if (e.hp) b.maxHp += e.hp;
            if (e.dodge) b.dodge += e.dodge;
            if (e.lifeSteal) b.lifeSteal += e.lifeSteal;
            if (e.regen) b.regen += e.regen;
            // 經驗與金錢倍率處理 (假設裝備存的是 1.2 這種形式)
            if (e.exp) b.expMul += (e.exp - 1);
            if (e.money) b.moneyMul += (e.money - 1);
        }
    });

    // 加上被動技能加成 (掃描已學會的技能中是否有被動屬性)
    if (d.learnedSkills) {
        d.learnedSkills.forEach(sId => {
            const s = GAME_DATA.SKILLS[sId];
            if (s && s.type === "passive") {
                if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
                if (s.effect.atkMul) b.atk *= s.effect.atkMul;
                if (s.effect.defMul) b.def *= s.effect.defMul;
            }
        });
    }

    // 數值取整與下限保護
    b.atk = Math.max(1, Math.floor(b.atk));
    b.maxHp = Math.max(10, Math.floor(b.maxHp));
    b.def = Math.floor(b.def);
    
    // 生命值同步邏輯：若目前生命超過最大生命或未初始化，則設為最大值
    if (this.battle.hp === undefined || this.battle.hp > b.maxHp) {
        b.hp = b.maxHp;
    } else {
        b.hp = this.battle.hp;
    }

    this.battle = b;
};

/**
 * 獲得經驗值與升級判定
 */
Player.prototype.addExp = function(v) {
    const earned = Math.floor(v * this.battle.expMul);
    this.data.exp += earned;
    let isLeveledUp = false;
    
    // 升級門檻公式：當前等級 * 100
    while (this.data.exp >= (this.data.lv * 100)) {
        this.data.exp -= (this.data.lv * 100);
        this.data.lv++;
        this.data.pts += 5; // 每級獲得 5 點潛能點
        isLeveledUp = true;
    }
    
    if (isLeveledUp) {
        this.refresh();
    }
    this.save();
    return isLeveledUp;
};
