/**
 * V1.8.0 player.js
 * 職責：修士狀態管理、核心行為執行
 * 核心原則：只記錄數據，不計算複雜公式，不直接操作 DOM
 */
const Player = {
    data: null,

    // 1. 初始化修士數據
    init() {
        const savedData = SaveManager.load();
        
        if (savedData) {
            this.data = savedData;
            Msg.log("神識歸位，修為正在恢復...", "system");
        } else {
            this.data = this.getInitialData();
            Msg.log("一名新進修士正式踏上求仙之路。", "system");
        }

        // 啟動自動存檔
        this.save();
    },

    // 2. 數據持久化
    save() {
        SaveManager.save(this.data);
    },

    // 3. 獲取經驗與升級
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
        this.data.statPoints += 5; // 每次突破獲得 5 點自由屬性
        
        Msg.log(`【突破】修為精進，已達等級 Lv.${this.data.level}！`, "gold");
    },

    // 4. 屬性分配
    addStat(type) {
        if (this.data.statPoints > 0) {
            this.data.stats[type]++;
            this.data.statPoints--;
            this.save();
            return true;
        }
        Msg.log("悟性不足，尚無多餘屬性點。", "system");
        return false;
    },

    // 5. 獲取即時戰鬥數值 (根據公式即時換算)
    getBattleStats() {
        const s = this.data.stats;
        // 考慮到未來可能會有裝備加成，這裡可以預留擴充空間
        return {
            maxHp: Formula.calculateMaxHp(s.con),
            atk: Formula.calculateAtk(s.str),
            def: s.dex * 1, // 未來可移入 Formula
            speed: 10 + s.dex * 0.5
        };
    },

    // 6. 儲物袋管理
    addItem(item) {
        if (!item) return false;

        // 處理殘卷重複煉化邏輯
        if (item.type === 'fragment') {
            const hasSkill = this.data.skills.some(s => s.id === item.targetSkill);
            if (hasSkill) {
                const refund = 100;
                this.data.coin += refund;
                Msg.log(`已掌握此神通，【${item.name}】已自動煉化為 ${refund} 靈石。`, "reward");
                this.save();
                return true;
            }
        }

        // 空間檢查
        const maxSlots = (typeof DATA !== 'undefined' ? DATA.CONFIG.MAX_BAG_SLOTS : 50);
        if (this.data.inventory.length >= maxSlots) {
            Msg.log("儲物袋已滿，無法再收納法寶！", "red");
            return false;
        }

        this.data.inventory.push(item);
        Msg.log(`獲得法寶：【${item.name}】`, "reward");
        this.save();
        return true;
    },

    // 7. 初始化預設數據
    getInitialData() {
        return {
            name: "無名修士",
            realm: 0,
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
