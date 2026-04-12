/**
 * 宗門修仙錄 - 戰鬥模組 (combat.js) V1.4.1
 */
function Combat(core) {
    this.core = core;
    this.m = null;
}

Combat.prototype.spawn = function() {
    var p = this.core.player;
    if (p.battle.isDead) return;
    var map = GAME_DATA.MAPS[p.data.mapId];
    var mBase = GAME_DATA.MONSTERS[map.monsters[Math.floor(Math.random() * map.monsters.length)]];
    var scale = map.lv;
    this.m = {
        name: mBase.name, pic: mBase.pic, exp: mBase.exp, coin: mBase.coin,
        maxHp: mBase.hp * scale, hp: mBase.hp * scale,
        atk: mBase.atk * scale
    };
    this.core.ui.updateHPs(p, this.m);
};

Combat.prototype.playerAtk = function(isManual) {
    var p = this.core.player;
    if (!this.m || this.m.hp <= 0) { if(isManual) this.spawn(); return; }

    var dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    var isCrit = Math.random() < p.battle.crit;
    if (isCrit) dmg = Math.floor(dmg * p.battle.critDmg);

    // 觸發打擊特效 (震動與噴字)
    this.core.ui.showDamage(dmg, isCrit);

    // 自動觸發主動技能判定
    for(var i=0; i<p.data.skills.length; i++){
        var sId = p.data.skills[i];
        if (sId !== null) {
            var s = GAME_DATA.SKILLS[sId];
            if (s && s.type === 'active' && Math.random() < s.proc) {
                this.executeSkill(s);
            }
        }
    }

    this.m.hp -= dmg;
    if (p.battle.lifeSteal > 0) {
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + Math.floor(dmg * p.battle.lifeSteal));
    }

    if (this.m.hp <= 0) { this.m.hp = 0; this.onDeath(); }
    else { this.core.ui.updateHPs(p, this.m); if(!isManual) setTimeout(this.monsterAtk.bind(this), 300); }
};

/**
 * 手動施展神通 (由 UI 點擊觸發)
 */
Combat.prototype.manualSkill = function(slotIdx) {
    var p = this.core.player;
    var sId = p.data.skills[slotIdx];
    if (sId === null || !this.m || p.skillCDs[slotIdx] > 0) return;

    var s = GAME_DATA.SKILLS[sId];
    this.core.ui.log("✨ 宗主施展【" + s.name + "】", 'combat', 'orange');
    this.executeSkill(s);

    // 設置 CD 並啟動 UI 計時
    p.skillCDs[slotIdx] = 10; 
    this.core.ui.startCDAnimation(slotIdx, 10);
};

Combat.prototype.executeSkill = function(s) {
    var p = this.core.player;
    if (s.effect.dmgMul && this.m) {
        var sDmg = Math.floor(p.battle.atk * s.effect.dmgMul);
        this.m.hp -= sDmg;
        this.core.ui.showDamage(sDmg, true);
        this.core.ui.log("🔥 神通：" + s.name + " 造成 " + sDmg + " 點重創！", 'combat', 'orange');
    }
    if (s.effect.healMul) {
        var heal = Math.floor(p.battle.maxHp * s.effect.healMul);
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
        this.core.ui.log("✨ 神通：" + s.name + " 回復 " + heal + " 點生命值！", 'combat', '#4caf50');
    }
    this.core.ui.updateHPs(p, this.m);
};

Combat.prototype.monsterAtk = function() {
    var p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    if (Math.random() < p.battle.dodge) {
        this.core.ui.log("💨 瞬身閃避了 " + this.m.name + " 的攻擊", 'combat', 'cyan'); return;
    }

    var dmg = Math.max(1, Math.floor(this.m.atk * (500 / (500 + p.battle.def))));
    p.battle.hp -= dmg;

    if (p.battle.hp <= 0) {
        p.battle.hp = 0; p.battle.isDead = true;
        this.core.ui.updateHPs(p, this.m);
        this.core.ui.toast("力竭倒地，回氣中...", "red");
        setTimeout(function() {
            p.battle.hp = p.battle.maxHp; p.battle.isDead = false;
            _X_CORE.combat.spawn();
        }, 3000);
    } else { this.core.ui.updateHPs(p, this.m); }
};

Combat.prototype.onDeath = function() {
    var p = this.core.player; var target = this.m; this.m = null;
    this.core.ui.log("擊敗 " + target.name + "！", 'combat', 'gold');
    if (p.addExp(target.exp)) this.core.ui.toast("✨ 境界精進！", "gold");
    p.data.money += Math.floor(target.coin * p.battle.moneyMul);
    this.core.inventory.dropLoot(p.data.mapId);
    p.save(); this.core.ui.renderAll();
    setTimeout(this.spawn.bind(this), 1200);
};
