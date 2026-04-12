/**
 * 宗門修仙錄 - 核心啟動器 (core.js) V1.4
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
    console.log("宗門修仙錄 V1.4 啟動...");
    
    // 初始化地圖選單
    const sel = document.getElementById('map-select-dropdown');
    GAME_DATA.MAPS.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.innerText = `${m.name} (Lv.${m.lv})`;
        if (m.id === this.player.data.mapId) opt.selected = true;
        sel.appendChild(opt);
    });

    this.ui.renderAll();
    this.combat.spawn();

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.update(), GAME_DATA.CONFIG.REGEN_TICK);
};

GameCore.prototype.update = function() {
    if (this.auto && !this.player.battle.isDead) {
        if (!this.combat.m || this.combat.m.hp <= 0) this.combat.spawn();
        else this.combat.playerAtk(false);
    }
    // 秒回血邏輯
    if (this.player.battle.hp < this.player.battle.maxHp && !this.player.battle.isDead) {
        this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + this.player.battle.regen);
        this.ui.updateHPs(this.player, this.combat.m);
    }
};

GameCore.prototype.changeMap = function(id) {
    this.player.data.mapId = parseInt(id);
    this.ui.log(`轉場前往：${GAME_DATA.MAPS[this.player.data.mapId].name}`, 'system', 'cyan');
    this.player.save();
    // 修復點擊失效關鍵：強制重置戰鬥實例並重新生成怪物
    this.combat.m = null;
    this.combat.spawn();
    this.ui.renderAll();
};

GameCore.prototype.addStat = function(key) {
    if (this.player.data.pts > 0) {
        this.player.data.pts--;
        this.player.data.baseStats[key]++;
        this.player.refresh();
        this.player.save();
        this.ui.renderAll();
    }
};

GameCore.prototype.toggleAuto = function(val) {
    this.auto = val;
    this.ui.log(val ? "開啟自動歷練" : "關閉自動歷練", "system");
};

// 萬法歸一：啟動大陣
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameCore();
    game.init();
});
