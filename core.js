class GameCore {
    constructor() {
        // 初始化順序優化
        this.player = new Player();
        this.ui = new UIManager(this);
        this.inventory = new Inventory(this);
        this.combat = new Combat(this);
        
        // 確保 DOM 加載完畢後才啟動
        if (document.readyState === 'complete') {
            this.init();
        } else {
            window.addEventListener('load', () => this.init());
        }
    }

    init() {
        try {
            this.ui.renderAll();
            this.combat.spawn();
            
            // 啟動定時器
            setInterval(() => this.mainTick(), 1000);
            setInterval(() => this.battleTick(), 1500);
            
            this.ui.log("【系統】大圓滿版 V1.0 成功覺醒", "system", "gold");
            console.log("[系統] 核心啟動成功");
        } catch (e) {
            console.error("啟動失敗原因:", e);
        }
    }

    mainTick() {
        if (this.player.battle.isDead) return;
        // 每秒回血
        const regen = this.player.data.baseStats.vit * 0.1 + this.player.battle.regen;
        if (regen > 0) {
            this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + (regen/10));
            this.ui.updateHPs(this.player, this.combat.m);
        }
        if (Math.random() < 0.05) this.player.save();
    }

    battleTick() {
        if (!this.player.battle.isDead && this.combat.m) {
            this.combat.playerAtk();
        }
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

// 建立全域對象
window._X_CORE = new GameCore();
