class GameCore {
    constructor() {
        this.player = new Player();
        this.ui = new UIManager(this);
        this.inventory = new Inventory(this);
        this.combat = new Combat(this);
        this.isAuto = true; // 預設開啟自動

        window.addEventListener('load', () => this.init());
    }

    init() {
        this.ui.renderAll();
        this.combat.spawn();
        setInterval(() => this.mainTick(), 1000);
        setInterval(() => this.battleTick(), 1500);
        this.ui.log("【天道】V1.0 經典加強版啟動成功", "system", "gold");
    }

    mainTick() {
        if (this.player.battle.isDead) return;
        const regen = this.player.data.baseStats.vit * 0.1 + this.player.battle.regen;
        if (regen > 0) {
            this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + (regen / 10));
            this.ui.updateHPs(this.player, this.combat.m);
        }
    }

    // 自動戰鬥邏輯：加入 isAuto 判定
    battleTick() {
        if (this.isAuto && !this.player.battle.isDead && this.combat.m) {
            this.combat.playerAtk();
        }
    }

    // 地圖切換接口
    changeMap(mapId) {
        this.player.data.mapId = parseInt(mapId);
        this.ui.toast(`切換至：${GAME_DATA.MAPS[mapId].name}`);
        this.combat.m = null; // 強制刷新對手
        this.combat.spawn();
        this.player.save();
    }

    // 自動開關接口
    toggleAuto(checked) {
        this.isAuto = checked;
        this.ui.toast(this.isAuto ? "自動歷練開啟" : "自動歷練暫停", this.isAuto ? "gold" : "#888");
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
