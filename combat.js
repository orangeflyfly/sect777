/**
 * 宗門修仙錄 - 戰鬥邏輯模組 (combat.js) V1.2.2
 * 【核心修正】：強效除靈，解決 0 血怪不死之身
 */
function Combat(core) {
    this.core = core;
    this.m = null;   // 當前怪物物件
    this.K = 500;    // 防禦常數
}

// 1. 妖獸降臨 (生成怪物)
Combat.prototype.spawn = function() {
    var p = this.core.player;
    if (p.battle.isDead) return;

    this.m = null; // 強制清理

    var map = GAME_DATA.MAPS[p.data.mapId];
    if (!map) return;
    
    var mPool = map.monsters;
    var mBase = GAME_DATA.MONSTERS[mPool[Math.floor(Math.random() * mPool.length)]];
    
    // 根據地圖等級強化怪物數值
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

// 2. 施展神通 (玩家攻擊)
Combat.prototype.playerAtk = function(isManual) {
    var p = this.core.player;
    
    // 邏輯護衛：若沒怪或怪已死，手動點擊則強制刷怪
    if (!this.m || this.m.hp <= 0) {
        if (isManual) this.spawn();
        return;
    }
    
    if (p.battle.isDead) return;

    // 計算傷害 (計算 60 種詞條帶來的攻擊加成)
    var dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    
    // 暴擊判定 (10% 機率雙倍傷害)
    if (Math.random() < 0.1) {
        dmg *= 2;
        this.core.ui.log("【暴擊】對 " + this.m.name + " 造成 " + dmg + " 傷害", 'combat', 'orange');
    } else {
        this.core.ui.log("對 " + this.m.name + " 造成 " + dmg, 'combat');
    }

    this.m.hp -= dmg;

    // 吸血詞條生效
    if (p.battle.lifeSteal > 0) {
        var heal = Math.floor(dmg * p.battle.lifeSteal);
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
    }

    // --- 關鍵修正：先斬後奏 ---
    if (this.m.hp <= 0) {
        this.m.hp = 0;
        this.onMonsterDeath(); 
    } else if (!isManual) {
        // 自動戰鬥時，怪物反擊
        var self = this;
        setTimeout(function() {
            if (self.m && self.m.hp > 0) self.monsterAtk();
        }, 600);
    }
    
    this.core.ui.updateHPs(p, this.m);
};

// 3. 妖獸反撲 (怪物攻擊)
Combat.prototype.monsterAtk = function() {
    var p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    // 閃避詞條判定 (最高 80%)
    if (Math.random() < p.battle.dodge) {
        this.core.ui.log("✨ 閃避了 " + this.m.name + " 的攻擊", 'combat', 'cyan');
        return;
    }

    // 減傷公式
    var reduction = this.K / (this.K + p.battle.def);
    var finalDmg = Math.max(1, Math.floor(this.m.atk * reduction));
    
    // 天道保底受傷 (防止防禦太高變無敵)
    var floorDmg = Math.floor(p.battle.maxHp * p.battle.dmgFloor);
    if (finalDmg < floorDmg) finalDmg = floorDmg;

    p.battle.hp -= finalDmg;
    this.core.ui.log(this.m.name + " 反擊，損血 " + finalDmg, 'combat', 'red');

    if (p.battle.hp <= 0) {
        p.battle.hp = 0;
        this.onPlayerDeath();
    }
    
    this.core.ui.updateHPs(p, this.m);
};

// 4. 超渡亡魂 (結算死亡)
Combat.prototype.onMonsterDeath = function() {
    var p = this.core.player;
    var target = this.m;

    // --- 立刻斷絕因果，怪物設為 null ---
    this.m = null; 
    this.core.ui.updateHPs(p, null); 

    this.core.ui.log("擊敗 " + target.name + "！", 'combat', 'gold');
    
    // 結算獎勵
    if (p.addExp(target.exp)) {
        this.core.ui.toast("✨ 境界提升！", "gold");
    }
    p.data.money += Math.floor(target.coin * p.battle.moneyMul);
    
    // 掉寶判定
    this.core.inventory.dropLoot(p.data.mapId);
    
    p.save();
    
    // 延遲重生，增加真實感
    var self = this;
    setTimeout(function() {
        self.spawn();
    }, 1000);
};

// 5. 兵解重修 (玩家死亡)
Combat.prototype.onPlayerDeath = function() {
    var p = this.core.player;
    p.battle.isDead = true;
    this.core.ui.toast("🕯️ 傷重，原地調息中...", "red");
    
    var self = this;
    setTimeout(function() {
        p.battle.hp = p.battle.maxHp;
        p.battle.isDead = false;
        self.spawn();
    }, 5000);
};
