/**
 * 宗門修仙錄 - 核心控制模組 (掌門大印)
 * 負責初始化所有系統並啟動遊戲循環
 */

class GameCore {
    constructor() {
        // 1. 按順序實例化所有模組
        this.player = new Player();
        this.ui = new UIManager();
        this.inventory = new Inventory(this.player);
        this.combat = new Combat(this.player);

        // 2. 啟動遊戲
        this.init();
    }

    init() {
        // 渲染初始畫面
        this.ui.renderAll();
        
        // 生成第一隻怪物
        this.combat.spawn();

        // 3. 啟動天道循環 (每秒執行一次)
        setInterval(() => this.mainTick(), 1000);

        // 4. 啟動自動戰鬥循環 (每 1.5 秒攻擊一次)
        setInterval(() => this.battleTick(), 1500);

        this.ui.log("【天道啟動】歡迎回到宗門修仙錄 V1.0", "system", "gold");
        this.ui.toast("✨ 歷練開始 ✨", "gold");
    }

    // 全域定時任務 (回血、存檔、更新顯示)
    mainTick() {
        if (this.player.battle.isDead) return;

        // --- 實裝：自動回血 (體質基礎 + 裝備詞條) ---
        const baseRegen = this.player.data.baseStats.vit * 0.1; // 每 10 點體質每秒回 1 血
        const totalRegen = baseRegen + this.player.battle.regen;
        
        if (totalRegen > 0) {
            this.player.battle.hp = Math.min(this.player.battle.maxHp, this.player.battle.hp + totalRegen);
            this.ui.updateHPs(this.player, this.combat.m);
        }

        // 定時保存 (每 30 秒自動存檔一次)
        if (Math.random() < 0.03) {
            this.player.save();
        }
    }

    // 自動戰鬥邏輯
    battleTick() {
        if (this.player.battle.isDead || !this.combat.m) return;
        
        // 如果有怪且活著，就發動攻擊
        this.combat.playerAtk();
    }

    // 加點介面接口 (供 HTML 按鈕調用)
    addStat(key) {
        if (this.player.data.pts > 0) {
            this.player.data.pts--;
            this.player.data.baseStats[key]++;
            this.player.refresh();
            this.player.save();
            this.ui.renderAll();
            this.ui.toast(`${key} 已提升！`, "green");
        } else {
            this.ui.toast("可用屬性點不足", "red");
        }
    }
}

// --- 萬法歸一：建立全域核心物件 ---
// 將 _X_CORE 掛載到 window，讓 HTML 的 onclick 事件能抓到
window._X_CORE = new GameCore();
