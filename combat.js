/**
 * 宗門修仙錄 - 戰鬥邏輯模組 (combat.js) V1.2
 * 修正：徹底剷除 HP=0 不死 Bug，恢復手動點擊砍怪
 */
function Combat(core) {
    this.core = core;
    this.m = null;   // 當前怪物物件
    this.K = 500;    // 護甲常數
}

// 1. 生成怪物 (加入強制重置)
Combat.prototype.spawn = function() {
    var p = this.core.player;
    if (p.battle.isDead) return;

    // 強制清理舊數據，確保重生
    this.m = null; 

    var map = GAME_DATA.MAPS[p.data.mapId];
    if (!map) return;
    
    var mPool = map.monsters;
    var mBaseId = mPool[Math.floor(Math.random() * mPool.length)];
    var mBase = GAME_DATA.MONSTERS[mBaseId];
    
    // 根據地圖等級強化怪物
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

    // 通知 UI 更新畫面
    this.core.ui.renderMonster(this.m);
    this.core.ui.updateHPs(p, this.m);
};

// 2. 玩家攻擊邏輯 (支援手動點擊)
Combat.prototype.playerAtk = function(isManual) {
    var p = this.core.player;
    
    // 若怪物已死或不存在，點擊則嘗試尋找新怪
    if (!this.m || this.m.hp <= 0) {
        if (isManual) this.spawn();
        return;
    }
    
    if (p.battle.isDead) return;

    // 計算傷害 (浮動 90% ~ 110%)
    var dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    
    // 暴擊判定 (10% 機率)
    if (Math.random() < 0.1) {
        dmg *= 2;
        this.core.ui.log("【暴擊】對 " + this.m.name + " 造成 " + dmg + " 傷害！", 'combat', 'orange');
    } else {
        this.core.ui.log("對 " + this.m.name + " 造成 " + dmg + " 傷害。", 'combat');
    }

    this.m.hp -= dmg;

    // 吸血邏輯
    if (p.battle.lifeSteal > 0) {
        var heal = Math.floor(dmg * p.battle.lifeSteal);
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
    }

    // --- 關鍵：瞬時死亡判定 ---
    if (this.m.hp <= 0) {
        this.m.hp = 0;
        this.onMonsterDeath();
    } else {
        // 若怪物未死，且非手動連點，則觸發怪物反擊
        if (!isManual) {
            var self = this;
            setTimeout(function() {
                if (self.m && self.m.hp > 0) self.monsterAtk();
            }, 600);
        }
    }
    
    this.core.ui.updateHPs(p, this.m);
};

// 3. 怪物反擊邏輯
Combat.prototype.monsterAtk = function() {
    var p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    // 閃避判定
    if (Math.random() < p.battle.dodge) {
        this.core.ui.log("✨ 閃避了 " + this.m.name + " 的攻擊！", 'combat', 'cyan');
        return;
    }

    // 傷害公式：原始傷害 * (K / (K + 防禦))
    var rawDmg = this.m.atk;
    var defense = p.battle.def;
    var reduction = this.K / (this.K + defense);
    var finalDmg = Math.floor(rawDmg * reduction);

    // 天道保底傷害 (最低受到最大血量 0.5% 的傷害)
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

// 4. 擊敗怪物處理
Combat.prototype.onMonsterDeath = function() {
    var p = this.core.player;
    this.core.ui.log("擊敗 " + this.m.name + "！", 'combat', 'gold');
    
    // 獲取獎勵
    if (p.addExp(this.m.exp)) {
        this.core.ui.toast("✨ 境界突破！", "gold");
    }
    p.data.money += this.m.coin;
    
    // 掉落判定
    this.core.inventory.dropLoot(p.data.mapId);
    
    // 徹底清理當前怪物，存檔
    this.m = null; 
    p.save();
    
    // 1秒後重生新怪物
    var self = this;
    setTimeout(function() {
        self.spawn();
    }, 1000);
};

// 5. 玩家死亡處理
Combat.prototype.onPlayerDeath = function() {
    var p = this.core.player;
    p.battle.isDead = true;
    this.core.ui.toast("🕯️ 傷重調息中...", "red");
    this.core.ui.log("歷練失敗，正在原地調息恢復元氣。", "system", "#888");

    var self = this;
    setTimeout(function() {
        p.battle.hp = p.battle.maxHp;
        p.battle.isDead = false;
        self.core.ui.toast("🌅 傷勢痊癒！", "green");
        self.spawn();
    }, 5000);
};
