class GameCore {
    constructor() {
        // 先建立玩家與 UI
        this.player = new Player();
        this.ui = new UIManager(this);
        // 再建立依賴 core 的模組
        this.inventory = new Inventory(this);
        this.combat = new Combat(this);
        this.init();
    }
    init() {
        this.ui.renderAll();
        this.combat.spawn();
        setInterval(() => this.mainTick(), 1000);
        setInterval(() => this.battleTick(), 1500);
        this.ui.log("【系統】大圓滿版 V1.0 啟動成功", "system", "gold");
    }
    mainTick() {
        if (this.player.battle.isDead) return;
        const regen = this.player.data.baseStats.vit * 0.1 + this.player.battle.regen;
        if (regen > 0) { 
            this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + (regen/10)); 
            this.ui.updateHPs(this.player, this.combat.m); 
        }
        if (Math.random() < 0.05) this.player.save();
    }
    battleTick() { if (!this.player.battle.isDead && this.combat.m) this.combat.playerAtk(); }
    addStat(key) {
        if (this.player.data.pts > 0) {
            this.player.data.pts--; this.player.data.baseStats[key]++;
            this.player.refresh(); this.player.save(); this.ui.renderAll();
        }
    }
}
// 關鍵：先賦值，後啟動
window._X_CORE = new GameCore();
