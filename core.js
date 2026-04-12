/**
 * 宗門修仙錄 - 核心啟動器 (core.js) V1.4.1
 * 職責：大陣總調度、自動化循環、屬性分配、地圖切換
 */
var _X_CORE = null;

function GameCore() {
    _X_CORE = this;
    
    // 初始化各個子模組
    this.player = new Player(this);
    this.inventory = new Inventory(this);
    this.combat = new Combat(this);
    this.ui = new UIManager(this);
    this.shop = new Shop(this);

    this.auto = true;
    this.timer = null;
}

/**
 * 啟動大陣：掛載地圖選單並開啟時間軸
 */
GameCore.prototype.init = function() {
    var self = this;
    var sel = document.getElementById('map-select-dropdown');
    
    if (sel) {
        // 清空並重新填入地圖
        sel.innerHTML = "";
        for (var i = 0; i < GAME_DATA.MAPS.length; i++) {
            var m = GAME_DATA.MAPS[i];
            var opt = document.createElement('option');
            opt.value = m.id;
            opt.innerText = m.name + " (Lv." + m.lv + ")";
            if (m.id === self.player.data.mapId) {
                opt.selected = true;
            }
            sel.appendChild(opt);
        }
    }

    // 渲染全介面
    this.ui.renderAll();
    
    // 生成第一隻妖獸
    this.combat.spawn();

    // 啟動主計時器 (每秒一次)
    if (this.timer) {
        clearInterval(this.timer);
    }
    this.timer = setInterval(function() {
        self.update();
    }, GAME_DATA.CONFIG.REGEN_TICK);
};

/**
 * 陣法脈動：處理自動歷練與秒回邏輯
 */
GameCore.prototype.update = function() {
    // 1. 自動歷練邏輯
    if (this.auto && !this.player.battle.isDead) {
        // 若當前無怪，嘗試尋找新妖獸
        if (!this.combat.m || this.combat.m.hp <= 0) {
            this.combat.spawn();
        } else {
            // 自動攻擊 (傳入 false 代表非手動點擊)
            this.combat.playerAtk(false);
        }
    }

    // 2. 生命回氣邏輯 (秒回)
    if (this.player.battle.hp < this.player.battle.maxHp && !this.player.battle.isDead) {
        var regenVal = this.player.battle.regen || 0;
        this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + regenVal);
        // 更新血條顯示
        this.ui.updateHPs(this.player, this.combat.m);
    }
};

/**
 * 挪移大陣：更換歷練地圖
 */
GameCore.prototype.changeMap = function(id) {
    var mapId = parseInt(id);
    this.player.data.mapId = mapId;
    
    // 在日誌留下傳送紀錄
    this.ui.log("轉場前往：【" + GAME_DATA.MAPS[mapId].name + "】", 'system', 'cyan');
    
    // 強制重置戰鬥狀態，防止舊怪遺留
    this.combat.m = null;
    this.player.save();
    
    // 重新生成新區域妖獸
    this.combat.spawn();
    this.ui.renderAll();
};

/**
 * 潛能開發：手動分配屬性點
 */
GameCore.prototype.addStat = function(key) {
    if (this.player.data.pts > 0) {
        this.player.data.pts--;
        this.player.data.baseStats[key]++;
        
        // 數值洗髓並重新渲染
        this.player.refresh();
        this.player.save();
        this.ui.renderAll();
        
        this.ui.toast("靈覺提升！", "gold");
    } else {
        this.ui.toast("潛能不足，多加修煉。", "red");
    }
};

/**
 * 自動/手動開關
 */
GameCore.prototype.toggleAuto = function(val) {
    this.auto = val;
    this.ui.log(val ? "開啟【自動歷練】模式" : "關閉【自動歷練】，進入手動修煉", "system");
};

/**
 * 萬脈歸宗：當天機（網頁）加載完成，啟動大陣
 */
document.addEventListener('DOMContentLoaded', function() {
    // 建立唯一核心實例
    var game = new GameCore();
    game.init();
});
