/**
 * 宗門修仙錄 - 核心控制器 (core.js) V1.3.1
 * 職責：初始化所有模組、管理遊戲主循環、處理地圖切換與屬性加點
 */
var _X_CORE = null;

function GameCore() {
    // 1. 封裝全域指標，確保 HTML 上的 onclick 能準確抓到此執行個體
    _X_CORE = this;

    // 2. 依次點亮各功能模組
    this.player = new Player(this);     // 命魂
    this.inventory = new Inventory(this); // 寶庫
    this.combat = new Combat(this);     // 鬥法
    this.ui = new UIManager(this);       // 顯影
    this.shop = new Shop(this);         // 坊市

    this.auto = true;    // 自動戰鬥開關
    this.timer = null;   // 主循環計時器
}

/**
 * 啟動宗門大陣
 */
GameCore.prototype.init = function() {
    console.log("宗門修仙錄 V1.3.1 啟動中...");

    // 執行初步渲染
    this.ui.renderAll();
    
    // 生成第一隻妖獸
    this.combat.spawn();

    // 啟動主循環 (每秒執行一次)
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
        this.update();
    }, 1000);
};

/**
 * 每秒一次的遊戲更新邏輯
 */
GameCore.prototype.update = function() {
    // 1. 自動戰鬥邏輯
    if (this.auto && !this.player.battle.isDead) {
        // 若無怪或怪已死，則生成新怪
        if (!this.combat.m || this.combat.m.hp <= 0) {
            this.combat.spawn();
        } else {
            // 玩家發動自動攻擊
            this.combat.playerAtk(false);
        }
    }

    // 2. 秒回血邏輯 (戰鬥中或閒置時皆有效)
    if (this.player.battle.hp < this.player.battle.maxHp && !this.player.battle.isDead) {
        const heal = this.player.battle.regen;
        this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + heal);
        this.ui.updateHPs(this.player, this.combat.m);
    }
};

/**
 * 切換自動戰鬥狀態
 */
GameCore.prototype.toggleAuto = function(val) {
    this.auto = val;
    this.ui.log(this.auto ? "開啟自動歷練" : "關閉自動歷練", "system");
};

/**
 * 切換修煉地圖
 */
GameCore.prototype.changeMap = function(id) {
    const mapId = parseInt(id);
    this.player.data.mapId = mapId;
    this.ui.log(`前往修煉地：${GAME_DATA.MAPS[mapId].name}`, "system", "cyan");
    
    // 重置怪物
    this.combat.spawn();
    this.player.save();
};

/**
 * 屬性加點邏輯
 */
GameCore.prototype.addStat = function(key) {
    const p = this.player;
    if (p.data.pts > 0) {
        p.data.pts--;
        p.data.baseStats[key]++;
        
        // 重新計算最終屬性並刷新畫面
        p.refresh();
        this.ui.renderAll();
        p.save();
    } else {
        this.ui.toast("潛能點不足", "#888");
    }
};

/**
 * 萬法歸一：當頁面 DOM 完全加載後，啟動核心
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new GameCore();
        game.init();
    } catch (e) {
        console.error("啟動大陣時發生混亂（程式錯誤）:", e);
    }
});
