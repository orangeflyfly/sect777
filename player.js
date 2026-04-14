/**
 * V1.9.0 player.js (練功修練核心版)
 * 職責：修士狀態管理、境界突破邏輯、屬性點加持、裝備數值計算
 * 修正點：
 * 1. 廢除自動升級：經驗滿時進入「瓶頸期」，需手動點擊突破。
 * 2. 引入境界系統：新增 realm 欄位，紀錄修士當前大層級。
 * 3. 強化屬性加點：實裝 addStat 邏輯，與 ui_stats.js 完美對接。
 * 4. 裝備比例修復：優化裝備穿脫時的血量百分比換算。
 */
const Player = {
    data: null,

    /**
     * 初始化修士數據
     */
    init() {
        console.log("【修士】引導神識歸位，感應天道中...");
        try {
            const savedData = (typeof SaveManager !== 'undefined') ? SaveManager.load() : null;
            
            // 載入數據，若無存檔則初始化新角色
            this.data = savedData || this.getInitialData();
            
            // 數據補丁：確保舊存檔也有 realm 欄位
            if (this.data && this.data.realm === undefined) {
                this.data.realm = 1; 
            }

            if (window.Msg) {
                Msg.log(savedData ? "神識歸位，修為恢復。" : "新進修士踏入凡塵，開啟練功修練之路。", "system");
            }
            
            this.save();
        } catch (e) {
            console.error("【修士】初始化失敗:", e);
        }
    },

    save() { 
        if (this.data && typeof SaveManager !== 'undefined') {
            SaveManager.save(this.data); 
        }
    },

    /**
     * 獲得經驗值 (V1.9.0 修正：達到瓶頸後不再增加經驗)
     */
    gainExp(amount) {
        if (!this.data) return 0;
        
        // 1. 檢查是否處於瓶頸期 (經驗已滿但未突破)
        if (this.data.exp >= this.data.maxExp) {
            if (window.Msg) Msg.log("感應到修為瓶頸，請先嘗試突破境界！", "system");
            return 0;
        }

        // 2. 安全獲取公式加成
        const intVal = this.data.stats.int || 10;
        const bonus = (typeof Formula !== 'undefined') ? Formula.calculateExpBonus(intVal) : 1;
        
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;
        
        // 3. 經驗值封頂 (確保不會超過 maxExp)
        if (this.data.exp >= this.data.maxExp) {
            this.data.exp = this.data.maxExp;
            if (window.Msg) Msg.log("✨ 體內靈氣充盈，已達修為瓶頸，隨時可嘗試突破！", "gold");
        }
        
        this.save();
        return finalExp;
    },

    /**
     * V1.9.0 新增：境界突破邏輯
     * 由 UI_Stats 中的突破按鈕觸發
     */
    breakthrough() {
        if (!this.data || this.data.exp < this.data.maxExp) return false;

        // 預留：未來可在此加入突破成功率判斷
        // const successChance = Formula.calculateBreakthroughSuccess(this.data);
        
        console.log("【核心】開始突破境界...");
        this.levelUp(); // 執行升級程序
        return true;
    },

    /**
     * 等級與境界提升程序
     */
    levelUp() {
        if (!this.data) return;
        
        // 消耗經驗並提升等級
        this.data.exp = 0; 
        this.data.level++;
        
        // 每 10 級提升一個大境界 (例如：練氣一、練氣二... 轉為 築基)
        if (this.data.level % 10 === 1 && this.data.level > 1) {
            this.data.realm++;
            if (window.Msg) Msg.log(`🎊 脫胎換骨！境界大突破，已晉升至新天地！`, "gold");
        }
        
        // 重新計算下一級經驗需求
        if (typeof Formula !== 'undefined') {
            this.data.maxExp = Formula.calculateNextExp(this.data.maxExp, this.data.level);
        } else {
            this.data.maxExp = Math.floor(this.data.maxExp * 1.6);
        }
        
        // 獲得自由屬性點
        this.data.statPoints += 5;
        
        // 突破時狀態補滿
        const pStats = this.getBattleStats();
        this.data.hp = pStats.maxHp;
        
        if (window.Msg) {
            Msg.log(`【突破】修為精進，當前修為：Lv.${this.data.level}！`, "gold");
        }

        this.save();
        if (window.UI_Stats) UI_Stats.renderStats(); // 即時刷新介面
    },

    /**
     * 屬性加點
     * 與 UI_Stats 對接
     */
    addStat(type) {
        if (this.data.statPoints <= 0) return false;

        this.data.stats[type]++;
        this.data.statPoints--;
        
        this.save();
        return true;
    },

    /**
     * 核心：獲取即時戰鬥數值 (基礎屬性 + 裝備加成)
     */
    getBattleStats() {
        const s = this.data.stats || { str: 10, con: 10, dex: 10, int: 10 };
        const equip = this.data.equipped || {};

        let extraAtk = 0;
        let extraHp = 0;
        let extraStats = { str: 0, con: 0, dex: 0, int: 0 };

        // 統計所有裝備屬性
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

        // 對接公式
        if (typeof Formula !== 'undefined') {
            return {
                maxHp: Formula.calculateMaxHp(s.con + extraStats.con) + extraHp,
                atk: Formula.calculateAtk(s.str + extraStats.str) + extraAtk,
                def: Formula.calculateDef(s.dex + extraStats.dex),
                speed: Formula.calculateSpeed(s.dex + extraStats.dex)
            };
        } else {
            return {
                maxHp: (s.con + extraStats.con) * 10 + extraHp,
                atk: (s.str + extraStats.str) * 2 + extraAtk,
                def: (s.dex + extraStats.dex),
                speed: (s.dex + extraStats.dex)
            };
        }
    },

    /**
     * 裝備穿戴邏輯
     */
    equipItem(uuid) {
        if (!this.data || !this.data.inventory) return false;
        
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];
        const slot = item.type;

        if (!['weapon', 'armor', 'accessory'].includes(slot)) {
            if (window.Msg) Msg.log("此物品無法穿戴！", "system");
            return false;
        }

        const oldMaxHp = this.getBattleStats().maxHp;

        // 脫下
        if (this.data.equipped[slot]) {
            this.data.inventory.push(this.data.equipped[slot]);
        }

        // 穿上
        this.data.equipped[slot] = item;
        this.data.inventory.splice(index, 1);

        // 重新換算血量比例
        const newMaxHp = this.getBattleStats().maxHp;
        const hpPercent = this.data.hp / oldMaxHp;
        this.data.hp = Math.max(1, Math.floor(hpPercent * newMaxHp));

        this.save();
        return true;
    },

    /**
     * 道具消耗
     */
    consumeItem(uuid) {
        if (!this.data || !this.data.inventory) return false;
        
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];

        if (item.type === 'fragment') {
            const skillName = item.name.replace('殘卷：', '');
            const hasSkill = this.data.skills.some(s => s.name === skillName);
            
            if (hasSkill) {
                if (window.Msg) Msg.log(`已掌握神通【${skillName}】。`, "system");
                return false; 
            }
            this.data.skills.push({ id: item.id, name: skillName });
            if (window.Msg) Msg.log(`💡 領悟神通：【${skillName}】！`, "gold");

        } else if (item.type === 'special' && item.id === 'i001') {
            this.data.coin += 500;
            if (window.Msg) Msg.log(`💰 打開靈石袋，獲得 500 靈石！`, "gold");
        } else {
            if (window.Msg) Msg.log("此物品無法直接使用。", "system");
            return false;
        }

        if (item.count && item.count > 1) {
            item.count--;
        } else {
            this.data.inventory.splice(index, 1);
        }

        this.save();
        return true;
    },

    addItem(item) {
        if (!item || !this.data) return false;

        const dataSrc = window.DATA || window.GAMEDATA;
        const maxSlots = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.MAX_BAG_SLOTS) || 50; 
        
        if (this.data.inventory.length >= maxSlots) {
            if (window.Msg) Msg.log("儲物袋已滿！", "system");
            return false;
        }

        this.data.inventory.push(item);
        this.save();
        return true;
    },

    /**
     * 初始數據
     */
    getInitialData() {
        return {
            realm: 1,      // 境界
            level: 1,      // 等級
            exp: 0, 
            maxExp: 100, 
            coin: 500,
            hp: 100,
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, 
            inventory: [], 
            skills: [],
            equipped: { weapon: null, armor: null, accessory: null }
        };
    }
};

window.Player = Player;
