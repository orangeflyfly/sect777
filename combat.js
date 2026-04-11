class Combat {
    constructor(core) { this.core = core; this.m = null; this.K = 500; }
    spawn() {
        if (this.core.player.battle.isDead) return;
        const map = GAME_DATA.MAPS[this.core.player.data.mapId];
        const mBase = GAME_DATA.MONSTERS[map.monsters[Math.floor(Math.random() * map.monsters.length)]];
        this.m = { ...mBase, hp: mBase.hp * map.lv, maxHp: mBase.hp * map.lv, atk: mBase.atk * map.lv };
        this.core.ui.log(`遇到了一隻 ${this.m.name}！`, 'combat');
        this.core.ui.renderMonster(this.m);
        this.core.ui.updateHPs(this.core.player, this.m);
    }
    playerAtk() {
        if (!this.m || this.core.player.battle.isDead) return;
        let dmg = Math.max(1, Math.floor(this.core.player.battle.atk * (0.9 + Math.random() * 0.2)));
        if (Math.random() < 0.1) { dmg *= 2; this.core.ui.log(`【暴擊】對 ${this.m.name} 造成 ${dmg}`, 'combat', 'orange'); }
        else { this.core.ui.log(`對 ${this.m.name} 造成 ${dmg}`, 'combat'); }
        this.m.hp -= dmg;
        if (this.core.player.battle.lifeSteal > 0) {
            let heal = Math.floor(dmg * this.core.player.battle.lifeSteal);
            this.core.player.battle.hp = Math.min(this.core.player.battle.maxHp, this.core.player.battle.hp + heal);
        }
        if (this.m.hp <= 0) { this.onMonsterDeath(); } 
        else { setTimeout(() => this.monsterAtk(), 600); }
        this.core.ui.updateHPs(this.core.player, this.m);
    }
    monsterAtk() {
        if (!this.m || this.m.hp <= 0 || this.core.player.battle.isDead) return;
        if (Math.random() < this.core.player.battle.dodge) { this.core.ui.log(`✨ 閃避了攻擊！`, 'combat', 'cyan'); return; }
        let finalDmg = Math.max(Math.floor(this.m.atk * (this.K / (this.K + this.core.player.battle.def))), Math.floor(this.core.player.battle.maxHp * this.core.player.battle.dmgFloor));
        this.core.player.battle.hp -= finalDmg;
        this.core.ui.log(`${this.m.name} 攻擊，受到 ${finalDmg}`, 'combat', 'red');
        if (this.core.player.battle.hp <= 0) this.onPlayerDeath();
        this.core.ui.updateHPs(this.core.player, this.m);
    }
    onMonsterDeath() {
        this.core.ui.log(`擊敗 ${this.m.name}！`, 'combat', 'gold');
        if (this.core.player.addExp(this.m.exp)) this.core.ui.toast("✨ 境界突破！", "gold");
        this.core.player.data.money += this.m.coin;
        this.core.inventory.dropLoot(this.core.player.data.mapId);
        this.m = null; this.core.player.save();
        setTimeout(() => this.spawn(), 1000);
    }
    onPlayerDeath() {
        this.core.player.battle.isDead = true;
        this.core.ui.toast("🕯️ 調息中...", "red");
        setTimeout(() => { this.core.player.battle.hp = this.core.player.battle.maxHp; this.core.player.battle.isDead = false; this.spawn(); }, 5000);
    }
}
