/**
 * Player.js (V1.8 重構版)
 */
const Player = {
    data: null,

    init() {
        const saved = SaveManager.load();
        this.data = saved || this.getInitialData();
        console.log("修士資料初始化完成");
    },

    // 獲取經驗的動作
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

    // 戰鬥數值獲取 (直接調用公式)
    getBattleStats() {
        const s = this.data.stats;
        return {
            maxHp: Formula.calculateMaxHp(s.con),
            atk: Formula.calculateAtk(s.str)
            // ...以此類推
        };
    },

    save() {
        SaveManager.save(this.data);
    },

    getInitialData() {
        return {
            realm: 0, level: 1, exp: 0, maxExp: 100, coin: 500,
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            inventory: [], skills: []
        };
    }
};
