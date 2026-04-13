/**
 * V1.8.0 player.js
 * 職責：修士狀態管理、行為執行、數據封裝
 */
const Player = {
    data: null,

    // 初始化修士 (從 SaveManager 讀取或建立新角色)
    init() {
        const savedData = SaveManager.load();
        
        if (savedData) {
            this.data = savedData;
            Msg.log("神識連結成功，修為恢復中...", "system");
        } else {
            this.data = this.getInitialData();
            Msg.log("新一代修士踏入凡塵，開啟求仙之路。", "system");
        }
        this.save();
    },

    // 存檔 (調用司庫房)
    save() {
        SaveManager.save(this.data);
    },

    // 獲取經驗
    gainExp(amount) {
        const bonus = Formula.calculateExpBonus(this.data.stats.int);
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;

        while (this.data.exp >= this.data.maxExp) {
            this.levelUp();
        }
        this.save();
        return finalExp;
    },

    // 等級提升
    levelUp() {
        this.data.exp -= this.data.maxExp;
        this.data.level++;
        this.data.maxExp = Formula.calculateNextExp(this.data.maxExp);
        this.data.statPoints += 5;
        Msg.log(`【突破】修為精進，當前等級：Lv.${this.data.level}！`, "gold");
    },

    // 屬性加點
    addStat(type) {
        if (this.data.statPoints > 0) {
            this.data.stats[type]++;
            this.data.statPoints--;
            this.save();
            return true;
        }
        return false;
    },

    // 即時換算戰鬥數值 (動態從 Formula 獲取，不再寫死公式)
    getBattleStats() {
        const s = this.data.stats;
        return {
            maxHp: Formula.calculateMaxHp(s.con),
            atk: Formula.calculateAtk(s.str),
            def: s.dex * 1, // 未來可放入 Formula
            speed: 10 + s.dex * 0.5
        };
    },

    // 收納物品
    addItem(itemOrId, count = 1) {
        // ... (保留你原本的 Inventory 邏輯，但將 UI 輸出改為 Msg.log)
        // 範例：
        // if (success) Msg.log(`拾獲 ${item.name} x${count}`, "reward");
    },

    getInitialData() {
        return {
            realm: 0, level: 1, exp: 0, maxExp: 100, coin: 500,
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, inventory: [], skills: [],
            equipped: { weapon: null, armor: null }
        };
    }
};
