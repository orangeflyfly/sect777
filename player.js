/**
 * V1.8.1 player.js
 * 職責：修士狀態管理，對接公式與裝備加成
 */
const Player = {
    data: null,

    init() {
        const savedData = SaveManager.load();
        this.data = savedData || this.getInitialData();
        Msg.log(savedData ? "神識歸位，修為恢復。" : "新進修士踏入凡塵。", "system");
        this.save();
    },

    save() { SaveManager.save(this.data); },

    gainExp(amount) {
        if (!this.data) return 0;
        const bonus = Formula.calculateExpBonus(this.data.stats.int);
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;
        while (this.data.exp >= this.data.maxExp) { this.levelUp(); }
        this.save();
        return finalExp;
    },

    levelUp() {
        this.data.exp -= this.data.maxExp;
        this.data.level++;
        this.data.maxExp = Formula.calculateNextExp(this.data.maxExp);
        this.data.statPoints += 5;
        Msg.log(`【突破】修為精進，已達 Lv.${this.data.level}！`, "gold");
    },

    /**
     * 核心：獲取即時戰鬥數值 (基礎屬性 + 裝備加成)
     */
    getBattleStats() {
        const s = this.data.stats;
        const equip = this.data.equipped;

        let extraAtk = 0;
        let extraHp = 0;
        let extraStats = { str: 0, con: 0, dex: 0, int: 0 };

        // 統計所有已穿裝備屬性
        for (let slot in equip) {
            const item = equip[slot];
            if (item && item.stats) {
                if (item.stats.atk) extraAtk += item.stats.atk;
                if (item.stats.hp) extraHp += item.stats.hp;
                for (let attr in extraStats) {
                    if (item.stats[attr]) extraStats[attr] += item.stats[attr];
                }
            }
        }

        return {
            maxHp: Formula.calculateMaxHp(s.con + extraStats.con) + extraHp,
            atk: Formula.calculateAtk(s.str + extraStats.str) + extraAtk,
            def: Formula.calculateDef(s.dex + extraStats.dex),
            speed: Formula.calculateSpeed(s.dex + extraStats.dex)
        };
    },

    addItem(item) {
        if (!item) return false;
        // 空間檢查
        const maxSlots = 50; 
        if (this.data.inventory.length >= maxSlots) {
            Msg.log("儲物袋已滿！", "red");
            return false;
        }
        this.data.inventory.push(item);
        Msg.log(`獲得：【${item.name}】`, "reward");
        this.save();
        return true;
    },

    getInitialData() {
        return {
            level: 1, exp: 0, maxExp: 100, coin: 500,
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, inventory: [], skills: [],
            equipped: { weapon: null, armor: null }
        };
    }
};
