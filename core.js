/**
 * 宗門修仙錄 - 核心啟動器 (core.js) V1.4.1
 */
var _X_CORE = null;

function GameCore() {
    _X_CORE = this;
    this.player = new Player(this);
    this.inventory = new Inventory(this);
    this.combat = new Combat(this);
    this.ui = new UIManager(this);
    this.shop = new Shop(this);
    this.auto = true;
    this.timer = null;
}

GameCore.prototype.init = function() {
    var self = this;
    var sel = document.getElementById('map-select-dropdown');
    GAME_DATA.MAPS.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m.id; opt.innerText = m.name + " (Lv." + m.lv + ")";
        if (m.id === self.player.data.mapId) opt.selected = true;
        sel.appendChild(opt);
    });
    this.ui.renderAll();
    this.combat.spawn();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(function() { self.update(); }, GAME_DATA.CONFIG.REGEN_TICK);
};

GameCore.prototype.update = function() {
    if (this.auto && !this.player.battle.isDead) {
        if (!this.combat.m || this.combat.m.hp <= 0) this.combat.spawn();
        else this.combat.playerAtk(false);
    }
    // 秒回血
    if (this.player.battle.hp < this.player.battle.maxHp && !this.player.battle.isDead) {
        this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + this.player.battle.regen);
        this.ui.updateHPs(this.player, this.combat.m);
    }
};

GameCore.prototype.changeMap = function(id) {
    this.player.data.mapId = parseInt(id);
    this.ui.log("轉場前往：" + GAME_DATA.MAPS[this.player.data.mapId].name, 'system', 'cyan');
    this.player.save();
    this.combat.m = null; // 重置戰鬥狀態
    this.combat.spawn();
    this.ui.renderAll();
};

GameCore.prototype.addStat = function(key) {
    if (this.player.data.pts > 0) {
        this.player.data.pts--;
        this.player.data.baseStats[key]++;
        this.player.refresh(); this.player.save(); this.ui.renderAll();
    }
};

GameCore.prototype.toggleAuto = function(val) {
    this.auto = val;
    this.ui.log(val ? "開啟自動歷練" : "關閉自動歷練", "system");
};

document.addEventListener('DOMContentLoaded', function() {
    var game = new GameCore();
    game.init();
});
