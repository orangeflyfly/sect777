/**
 * 宗門修仙錄 - 核心控制模組 (core.js) V1.2.2
 * 【核心修正】：總調度所有模組，實裝天道重生保險
 */
var _X_CORE = null;

function GameCore() {
    this.player = new Player(this);
    this.inventory = new Inventory(this);
    this.combat = new Combat(this);
    this.ui = new UIManager(this);
    // 🆕 冊封萬寶閣長老
    this.shop = new Shop(this); 
    
    this.auto = true;
    this.timer = null;
    this.regenTimer = null;
}

   
    

// 1. 初始化遊戲
GameCore.prototype.init = function() {
    _X_CORE = this; // 註冊全域指標，供 HTML 按鈕使用
    
    // 初始化 UI 畫面
    this.ui.renderAll();
    
    // 刷出第一隻妖獸
    this.combat.spawn();
    
    // 開啟自動化循環
    this.startLoop();
};

// 2. 開啟天道循環 (戰鬥與回血)
GameCore.prototype.startLoop = function() {
    var self = this;
    
    // 戰鬥計時器：每秒跳動一次
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(function() {
        if (self.auto && !self.player.battle.isDead) {
            // 【天道重生鎖】：若沒怪或怪已死(0血)，強制重新生成
            if (!self.combat.m || self.combat.m.hp <= 0) {
                self.combat.spawn();
            } else {
                // 有怪則正常發動攻擊
                self.combat.playerAtk(false);
            }
        }
    }, 1000);

    // 恢復計時器：每秒回血
    if (this.regenTimer) clearInterval(this.regenTimer);
    this.regenTimer = setInterval(function() {
        var p = self.player;
        if (p.battle.hp < p.battle.maxHp && !p.battle.isDead) {
            p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + p.battle.regen);
            self.ui.updateHPs(p, self.combat.m);
        }
    }, 1000);
};

// 3. 切換自動模式
GameCore.prototype.toggleAuto = function(val) {
    this.auto = val;
    this.ui.toast(this.auto ? "開啟自動歷練" : "關閉自動歷練");
};

// 4. 切換歷練地圖
GameCore.prototype.changeMap = function(id) {
    this.player.data.mapId = parseInt(id);
    var map = GAME_DATA.MAPS[this.player.data.mapId];
    this.ui.toast("前往歷練地：" + map.name);
    
    this.combat.spawn(); // 換地圖強制刷怪
    this.player.save();
};

// 5. 屬性加點功能
GameCore.prototype.addStat = function(key) {
    if (this.player.data.pts > 0) {
        this.player.data.pts--;
        this.player.data.baseStats[key]++;
        
        // 刷新數據並渲染畫面
        this.player.refresh();
        this.ui.renderAll();
        this.player.save();
    } else {
        this.ui.toast("潛能點不足", "#888");
    }
};

// --- 陣法開啟 ---
window.onload = function() {
    var core = new GameCore();
    core.init();
};
