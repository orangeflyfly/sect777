/**
 * V1.8.1 player.js (最終修正版)
 * 職責：修士狀態管理，對接公式與裝備加成
 * 修正：對接全域配置、補回殘卷煉化邏輯、強化裝備屬性加算安全檢查
 */
const Player = {
    data: null,

    init() {
        const savedData = SaveManager.load();
        this.data = savedData || this.getInitialData();
        Msg.log(savedData ? "神識歸位，修為恢復。" : "新進修士踏入凡塵。", "system");
        this.save();
    },

    save() { 
        if (this.data) SaveManager.save(this.data); 
    },

    gainExp(amount) {
        if (!this.data) return 0;
        const bonus = Formula.calculateExpBonus(this.data.stats.int);
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;
        
        while (this.data.exp >= this.data.maxExp) { 
            this.levelUp(); 
        }
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

        // 統計所有已穿裝備屬性 (強化安全檢查)
        for (let slot in equip) {
            const item = equip[slot];
            if (item && typeof item === 'object' && item.stats) {
                if (item.stats.atk) extraAtk += item.stats.atk;
                if (item.stats.hp) extraHp += item.stats.hp;
                
                for (let attr in extraStats) {
                    if (item.stats[attr]) extraStats[attr] += item.stats[attr];
                }
            }
        }

        // 最終戰鬥數值公式：Formula(基礎點數 + 裝備詞條點數) + 裝備直加數值
        return {
            maxHp: Formula.calculateMaxHp(s.con + extraStats.con) + extraHp,
            atk: Formula.calculateAtk(s.str + extraStats.str) + extraAtk,
            def: Formula.calculateDef(s.dex + extraStats.dex),
            speed: Formula.calculateSpeed(s.dex + extraStats.dex)
        };
    },

    addItem(item) {
        if (!item) return false;

        // 1. 殘卷自動煉化邏輯 (防止重複學習技能)
        if (item.type === 'fragment' && item.targetSkill) {
            const hasSkill = this.data.skills.some(s => s.id === item.targetSkill);
            if (hasSkill) {
                const refund = 100; // 煉化補償靈石
                this.data.coin += refund;
                Msg.log(`已掌握神通，【${item.name}】自動煉化為 ${refund} 靈石。`, "reward");
                this.save();
                return true;
            }
        }

        // 2. 空間檢查 (對齊全域配置)
        const maxSlots = (window.DATA && DATA.CONFIG.MAX_BAG_SLOTS) || 50; 
        if (this.data.inventory.length >= maxSlots) {
            Msg.log("儲物袋空間不足！", "red");
            return false;
        }

        this.data.inventory.push(item);
        Msg.log(`獲得：【${item.name}】`, "reward");
        this.save();
        return true;
    },

    getInitialData() {
        return {
            level: 1, 
            exp: 0, 
            maxExp: 100, 
            coin: 500,
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, 
            inventory: [], 
            skills: [],
            equipped: { weapon: null, armor: null }
        };
    }
};
