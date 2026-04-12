/**
 * 宗門修仙錄 - 戰鬥邏輯模組 (combat.js) V1.2.1
 * 【核心修正】：強制優先清理怪物數據，防止 0血卡死
 */
function Combat(core) {
    this.core = core;
    this.m = null;
    this.K = 500;
}

Combat.prototype.spawn = function() {
    var p = this.core.player;
    if (p.battle.isDead) return;

    // 1. 強制重置數據與 UI
    this.m = null;
    this.core.ui.renderMonster(null); 

    var map = GAME_DATA.MAPS[p.data.mapId];
    if (!map) return;
    
    var mPool = map.monsters;
    var mBaseId = mPool[Math.floor(Math.random() * mPool.length)];
    var mBase = GAME_DATA.MONSTERS[mBaseId];
    
    // 2. 構建新怪物
    this.m = { 
        id: mBase.id,
        name: mBase.name,
        pic: mBase.pic,
        hp: mBase.hp * map.lv, 
        maxHp: mBase.hp * map.lv, 
        atk: mBase.atk * map.lv,
        exp: mBase.exp,
        coin: mBase.coin
    };

    this.core.ui.renderMonster(this.m);
    this.core.ui.updateHPs(p, this.m);
};

Combat.prototype.playerAtk = function(isManual) {
    var p = this.core.player;
    
    // 如果沒怪或血量歸零，手動點擊會強制刷怪
    if (!this.m || this.m.hp <= 0) {
        if (isManual) this.spawn();
        return;
    }
    
    if (p.battle.isDead) return;

    var dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    
    if (Math.random() < 0.1) {
        dmg *= 2;
        this.core.ui.log("【暴擊】對 " + this.m.name + " 造成 " + dmg, 'combat', 'orange');
    } else {
        this.core.ui.log("對 " + this.m.name + " 造成 " + dmg, 'combat');
    }

    this.m.hp -= dmg;

    // 瞬間判定：血量一旦歸零，立刻執行死亡邏輯
    if (this.m.hp <= 0) {
        this.m.hp = 0;
        this.onMonsterDeath();
    } else {
        if (!isManual) {
            var self = this;
            setTimeout(function() {
                if (self.m && self.m.hp > 0) self.monsterAtk();
            }, 600);
        }
    }
    this.core.ui.updateHPs(p, this.m);
};

Combat.prototype.onMonsterDeath = function() {
    var p = this.core.player;
    var currentMonster = this.m; // 暫存怪物資訊發獎勵

    // --- 第一步：斬草除根 (關鍵) ---
    // 立刻將怪物設為 null，並清空 UI，這樣主循環就不會再抓到這隻死怪
    this.m = null; 
    this.core.ui.updateHPs(p, null);
    this.core.ui.renderMonster(null);

    // --- 第二步：結算獎勵 ---
    this.core.ui.log("擊敗 " + currentMonster.name + "！", 'combat', 'gold');
    if (p.addExp(currentMonster.exp)) {
        this.core.ui.toast("✨ 境界突破！", "gold");
    }
    p.data.money += currentMonster.coin;
    this.core.inventory.dropLoot(p.data.mapId);
    
    // --- 第三步：後台存檔 ---
    p.save();
    
    // --- 第四步：準備重生 ---
    var self = this;
    setTimeout(function() {
        self.spawn();
    }, 800);
};

Combat.prototype.monsterAtk = function() {
    var p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    if (Math.random() < p.battle.dodge) {
        this.core.ui.log("✨ 閃避了 " + this.m.name + " 的攻擊！", 'combat', 'cyan');
        return;
    }

    var reduction = this.K / (this.K + p.battle.def);
    var finalDmg = Math.floor(this.m.atk * reduction);
    var floorDmg = Math.floor(p.battle.maxHp * p.battle.dmgFloor);
    if (finalDmg < floorDmg) finalDmg = floorDmg;

    p.battle.hp -= finalDmg;
    this.core.ui.log(this.m.name + " 反擊，受到 " + finalDmg + " 傷害。", 'combat', 'red');

    if (p.battle.hp <= 0) {
        p.battle.hp = 0;
        this.onPlayerDeath();
    }
    this.core.ui.updateHPs(p, this.m);
};

Combat.prototype.onPlayerDeath = function() {
    var p = this.core.player;
    p.battle.isDead = true;
    this.core.ui.toast("🕯️ 傷重調息中...", "red");
    var self = this;
    setTimeout(function() {
        p.battle.hp = p.battle.maxHp;
        p.battle.isDead = false;
        self.spawn();
    }, 5000);
};
