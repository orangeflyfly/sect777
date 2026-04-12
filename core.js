class GameCore {
    constructor() {
        this.player = new Player();
        this.ui = new UIManager(this);
        this.inventory = new Inventory(this);
        this.combat = new Combat(this);
        this.isAuto = true;

        window.addEventListener('load', () => this.init());
    }

    init() {
        this.ui.renderAll();
        this.combat.spawn();
        setInterval(() => this.mainTick(), 1000);
        setInterval(() => this.battleTick(), 1500);
        this.ui.log("【天道】V1.0 大圓滿版啟動成功", "system", "gold");
    }

    mainTick() {
        if (this.player.battle.isDead) return;
        const regen = this.player.data.baseStats.vit * 0.1 + this.player.battle.regen;
        if (regen > 0) {
            this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + (regen / 10));
            this.ui.updateHPs(this.player, this.combat.m);
        }
        if (Math.random() < 0.05) this.player.save();
    }

    battleTick() {
        if (this.isAuto && !this.player.battle.isDead && this.combat.m) {
            this.combat.playerAtk();
        }
    }

    // 地圖切換
    changeMap(mapId) {
        this.player.data.mapId = parseInt(mapId);
        this.ui.toast("前往：" + GAME_DATA.MAPS[this.player.data.mapId].name);
        this.combat.m = null; 
        this.combat.spawn();
        this.player.save();
    }

    // 自動開關
    toggleAuto(checked) {
        this.isAuto = checked;
        this.ui.toast(this.isAuto ? "自動歷練開啟" : "自動歷練暫停");
    }

    addStat(key) {
        if (this.player.data.pts > 0) {
            this.player.data.pts--;
            this.player.data.baseStats[key]++;
            this.player.refresh();
            this.player.save();
            this.ui.renderAll();
        }
    }
}
window._X_CORE = new GameCore();
