/**
 * V1.8.2 player.js (終極修正版)
 * 職責：修士狀態管理，對接公式與裝備加成
 * 修正：補齊當前 HP 初始值、實裝裝備穿脫邏輯 (equipItem)、實裝道具消耗邏輯 (consumeItem)
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
        
        // 升級時補滿血量
        const pStats = this.getBattleStats();
        this.data.hp = pStats.maxHp;
        
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

    // ==========================================
    // V1.8.2 新增：裝備穿戴邏輯
    // ==========================================
    equipItem(uuid) {
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];
        const slot = item.type; // 'weapon', 'armor', 'accessory' 等

        if (!['weapon', 'armor', 'accessory'].includes(slot)) {
            Msg.log("此物品無法裝備！", "system");
            return false;
        }

        // 紀錄換裝前的最大血量
        const oldMaxHp = this.getBattleStats().maxHp;

        // 若該部位已有裝備，先脫下放回背包
        if (this.data.equipped[slot]) {
            this.data.inventory.push(this.data.equipped[slot]);
        }

        // 穿上新裝備，並從背包移除
        this.data.equipped[slot] = item;
        this.data.inventory.splice(index, 1);

        // 換裝後處理血量比例 (避免脫下加血裝備時死掉)
        const newMaxHp = this.getBattleStats().maxHp;
        this.data.hp = Math.max(1, Math.floor((this.data.hp / oldMaxHp) * newMaxHp));

        this.save();
        return true;
    },

    // ==========================================
    // V1.8.2 新增：道具使用與殘卷煉化邏輯
    // ==========================================
    consumeItem(uuid) {
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];

        if (item.type === 'fragment') {
            // 領悟殘卷神通
            const skillName = item.name.replace('殘卷：', ''); // 簡單萃取技能名稱
            const hasSkill = this.data.skills.some(s => s.name === skillName);
            
            if (hasSkill) {
                Msg.log(`你已經掌握了【${skillName}】，無需再次領悟。`, "system");
                return false; 
            }

            // 存入神通庫 (為了相容性，先建構簡單物件，未來可對接 DATA.SKILLS)
            this.data.skills.push({ id: item.id, name: skillName });
            Msg.log(`💡 靈光一閃，成功領悟神通：【${skillName}】！`, "gold");

        } else if (item.type === 'special') {
            if (item.id === 'i001') { // 針對低階靈石袋的特判
                this.data.coin += 500;
                Msg.log(`💰 打開靈石袋，獲得 500 靈石！`, "gold");
            }
        } else {
            Msg.log("此物品無法直接使用。", "system");
            return false;
        }

        // 消耗品扣除數量或移除
        if (item.count && item.count > 1) {
            item.count--;
        } else {
            this.data.inventory.splice(index, 1);
        }

        this.save();
        return true;
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
            Msg.log("儲物袋空間不足！", "system"); // 修正：配合新 log 系統改為 system
            return false;
        }

        this.data.inventory.push(item);
        this.save();
        return true;
    },

    getInitialData() {
        return {
            level: 1, 
            exp: 0, 
            maxExp: 100, 
            coin: 500,
            hp: 50, // V1.8.2 補齊：初始血量，避免 combat engine 報錯
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, 
            inventory: [], 
            skills: [],
            equipped: { weapon: null, armor: null, accessory: null } // 補齊飾品欄位
        };
    }
};
