/**
 * 宗門修仙錄 - 核心控制模組 (core.js) V1.2
 * 修正：加強自動歷練與重生的協調性，徹底解決 0血卡死
 */
var _X_CORE = null;

function GameCore() {
    this.player = new Player(this);
    this.inventory = new Inventory(this);
    this.combat = new Combat(this);
    this.ui = new UIManager(this);
    this.auto = true;
    this.timer = null;
    this.regenTimer = null;
}

GameCore.prototype.init = function() {
    _X_CORE = this; // 註冊為全域變數，供 UI 調用
    this.ui.renderAll();
    this.combat.spawn(); // 開啟遊戲時刷第一隻怪
    this.startLoop();
};

GameCore.prototype.startLoop = function() {
    var self = this;
    
    // 1. 戰鬥與重生循環 (每秒跳動一次)
    this.timer = setInterval(function() {
        if (self.auto && !self.player.battle.isDead) {
            // 【重生鎖】：如果沒怪或數據丟失，強制刷一隻新怪
            if (!self.combat.m || self.combat.m.hp <= 0) {
                self.combat.spawn();
            } else {
                // 有怪則正常攻擊
                self.combat.playerAtk(false);
            }
        }
    }, 1000);

    // 2. 恢復循環 (每秒回血)
    this.regenTimer = setInterval(function() {
        var p = self.player;
        if (p.battle.hp < p.battle.maxHp && !p.battle.isDead) {
            p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + p.battle.regen);
            self.ui.updateHPs(p, self.combat.m);
        }
    }, 1000);
};

// 切換自動歷練
GameCore.prototype.toggleAuto = function(val) {
    this.auto = val;
    this.ui.toast(this.auto ? "開啟自動歷練" : "關閉自動歷練");
};

// 切換地圖
GameCore.prototype.changeMap = function(id) {
    this.player.data.mapId = parseInt(id);
    this.ui.toast("前往：" + GAME_DATA.MAPS[this.player.data.mapId].name);
    this.combat.spawn(); // 換地圖立刻強行刷怪
    this.player.save();
};

// 屬性加點
GameCore.prototype.addStat = function(key) {
    if (this.player.data.pts > 0) {
        this.player.data.pts--;
        this.player.data.baseStats[key]++;
        this.player.refresh();
        this.ui.renderAll();
        this.player.save();
    }
};

// 啟動陣法 (當頁面載入完成)
window.onload = function() {
    var core = new GameCore();
    core.init();
};
