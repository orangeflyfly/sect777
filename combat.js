/**
 * 宗門修仙錄 - 戰鬥模組 (combat.js) V1.4
 */
function Combat(core) {
    this.core = core;
    this.m = null;
}

Combat.prototype.spawn = function() {
    const p = this.core.player;
    if (p.battle.isDead) return;
    const map = GAME_DATA.MAPS[p.data.mapId];
    const mBase = GAME_DATA.MONSTERS[map.monsters[Math.floor(Math.random() * map.monsters.length)]];
    const scale = map.lv;
    this.m = {
        ...mBase,
        maxHp: mBase.hp * scale, hp: mBase.hp * scale,
        atk: mBase.atk * scale
    };
    this.core.ui.updateHPs(p, this.m);
};

Combat.prototype.playerAtk = function(isManual) {
    const p = this.core.player;
    if (!this.m || this.m.hp <= 0) { if(isManual) this.spawn(); return; }

    let dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    
    // 1. 暴擊判定
    let isCrit = Math.random() < p.battle.crit;
    if (isCrit) {
        dmg = Math.floor(dmg * p.battle.critDmg);
        this.core.ui.log(`💥 暴擊！造成 ${dmg} 傷害`, 'combat', '#ff4d4d');
    }

    // 2. 主動技能判定 (檢查 3 個槽位)
    p.data.skills.forEach(sId => {
        if (sId !== null) {
            const s = GAME_DATA.SKILLS[sId];
            if (s && s.type === 'active' && Math.random() < s.proc) {
                if (s.effect.dmgMul) {
                    const sDmg = Math.floor(dmg * s.effect.dmgMul);
                    this.m.hp -= sDmg;
                    this.core.ui.log(`🔥 神通：${s.name}，額外重創 ${sDmg}`, 'combat', 'orange');
                }
                if (s.effect.healMul) {
                    const heal = Math.floor(p.battle.maxHp * s.effect.healMul);
                    p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
                    this.core.ui.log(`✨ 神通：${s.name}，回氣 ${heal}`, 'combat', '#4caf50');
                }
            }
        }
    });

    this.m.hp -= dmg;
    if (p.battle.lifeSteal > 0) {
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + Math.floor(dmg * p.battle.lifeSteal));
    }

    if (this.m.hp <= 0) { this.m.hp = 0; this.onDeath(); }
    else { this.core.ui.updateHPs(p, this.m); if(!isManual) setTimeout(() => this.monsterAtk(), 200); }
};

Combat.prototype.monsterAtk = function() {
    const p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    if (Math.random() < p.battle.dodge) {
        this.core.ui.log(`💨 閃避了 ${this.m.name} 的攻擊`, 'combat', 'cyan');
        return;
    }

    const dmg = Math.max(1, Math.floor(this.m.atk * (500 / (500 + p.battle.def))));
    p.battle.hp -= dmg;

    if (p.battle.hp <= 0) {
        p.battle.hp = 0; p.battle.isDead = true;
        this.core.ui.updateHPs(p, this.m);
        this.core.ui.toast("力竭調息中...", "red");
        setTimeout(() => {
            p.battle.hp = p.battle.maxHp; p.battle.isDead = false;
            this.core.ui.log("重返歷練！", "system", "gold");
            this.spawn();
        }, 3000);
    } else { this.core.ui.updateHPs(p, this.m); }
};

Combat.prototype.onDeath = function() {
    const p = this.core.player; const target = this.m; this.m = null;
    this.core.ui.log(`擊敗 ${target.name}！`, 'combat', 'gold');
    if (p.addExp(target.exp)) this.core.ui.toast("✨ 等級提升！", "gold");
    p.data.money += Math.floor(target.coin * p.battle.moneyMul);
    this.core.inventory.dropLoot(p.data.mapId);
    p.save();
    this.core.ui.updateHPs(p, null);
    setTimeout(() => { if (!p.battle.isDead) this.spawn(); }, 1000);
};
