/**
 * V1.8.2 player.js (終極穩定版)
 * 職責：修士狀態管理，對接公式與裝備加成
 * 修正點：加入依賴安全檢查、強化全域綁定、優化換裝血量計算、修正數據讀取路徑
 */
const Player = {
    data: null,

    /**
     * 初始化修士數據
     */
    init() {
        console.log("【修士】正在引導神識歸位...");
        try {
            // 確保 SaveManager 存在，防止崩潰
            const savedData = (typeof SaveManager !== 'undefined') ? SaveManager.load() : null;
            
            this.data = savedData || this.getInitialData();
            
            if (window.Msg) {
                Msg.log(savedData ? "神識歸位，修為恢復。" : "新進修士踏入凡塵。", "system");
            }
            
            this.save();
        } catch (e) {
            console.error("【修士】初始化失敗:", e);
        }
    },

    /**
     * 儲存神識 (存檔)
     */
    save() { 
        if (this.data && typeof SaveManager !== 'undefined') {
            SaveManager.save(this.data); 
        }
    },

    /**
     * 獲得經驗值
     */
    gainExp(amount) {
        if (!this.data) return 0;
        
        // 安全獲取公式加成
        const intVal = (this.data.stats && this.data.stats.int) ? this.data.stats.int : 10;
        const bonus = (typeof Formula !== 'undefined') ? Formula.calculateExpBonus(intVal) : 1;
        
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;
        
        // 自動突破等級
        while (this.data.exp >= this.data.maxExp) { 
            this.levelUp(); 
        }
        
        this.save();
        return finalExp;
    },

    /**
     * 等級突破
     */
    levelUp() {
        if (!this.data) return;
        
        this.data.exp -= this.data.maxExp;
        this.data.level++;
        
        // 計算下一級經驗 (安全呼叫公式)
        if (typeof Formula !== 'undefined') {
            this.data.maxExp = Formula.calculateNextExp(this.data.maxExp);
        } else {
            this.data.maxExp = Math.floor(this.data.maxExp * 1.5);
        }
        
        this.data.statPoints += 5;
        
        // 升級時補滿血量
        const pStats = this.getBattleStats();
        this.data.hp = pStats.maxHp;
        
        if (window.Msg) {
            Msg.log(`【突破】修為精進，已達 Lv.${this.data.level}！`, "gold");
        }
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

        // 1. 統計所有已穿裝備屬性
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

        // 2. 對接公式計算最終數值 (加入 Formula 安全檢查)
        if (typeof Formula !== 'undefined') {
            return {
                maxHp: Formula.calculateMaxHp(s.con + extraStats.con) + extraHp,
                atk: Formula.calculateAtk(s.str + extraStats.str) + extraAtk,
                def: Formula.calculateDef(s.dex + extraStats.dex),
                speed: Formula.calculateSpeed(s.dex + extraStats.dex)
            };
        } else {
            // 公式缺失時的保底計算
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
        const slot = item.type; // 'weapon', 'armor', 'accessory'

        if (!['weapon', 'armor', 'accessory'].includes(slot)) {
            if (window.Msg) Msg.log("此物品無法裝備！", "system");
            return false;
        }

        // 紀錄換裝前的最大血量比例
        const oldMaxHp = this.getBattleStats().maxHp;

        // 脫下舊裝備
        if (this.data.equipped[slot]) {
            this.data.inventory.push(this.data.equipped[slot]);
        }

        // 穿上新裝備
        this.data.equipped[slot] = item;
        this.data.inventory.splice(index, 1);

        // 換裝後保持血量比例，避免脫裝即死
        const newMaxHp = this.getBattleStats().maxHp;
        const hpPercent = this.data.hp / oldMaxHp;
        this.data.hp = Math.max(1, Math.floor(hpPercent * newMaxHp));

        this.save();
        return true;
    },

    /**
     * 道具消耗與殘卷領悟邏輯
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
                if (window.Msg) Msg.log(`你已經掌握了【${skillName}】，無需再次領悟。`, "system");
                return false; 
            }

            this.data.skills.push({ id: item.id, name: skillName });
            if (window.Msg) Msg.log(`💡 靈光一閃，成功領悟神通：【${skillName}】！`, "gold");

        } else if (item.type === 'special' && item.id === 'i001') {
            this.data.coin += 500;
            if (window.Msg) Msg.log(`💰 打開靈石袋，獲得 500 靈石！`, "gold");
        } else {
            if (window.Msg) Msg.log("此物品無法直接使用。", "system");
            return false;
        }

        // 移除或減少數量
        if (item.count && item.count > 1) {
            item.count--;
        } else {
            this.data.inventory.splice(index, 1);
        }

        this.save();
        return true;
    },

    /**
     * 加入物品到背包
     */
    addItem(item) {
        if (!item || !this.data) return false;

        // 1. 殘卷自動煉化
        if (item.type === 'fragment' && item.targetSkill) {
            const hasSkill = this.data.skills.some(s => s.id === item.targetSkill);
            if (hasSkill) {
                const refund = 100;
                this.data.coin += refund;
                if (window.Msg) Msg.log(`已掌握神通，【${item.name}】自動煉化為 ${refund} 靈石。`, "reward");
                this.save();
                return true;
            }
        }

        // 2. 空間檢查 (修正數據讀取路徑的安全檢查)
        const dataSrc = window.DATA || window.GAMEDATA;
        const maxSlots = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.MAX_BAG_SLOTS) || 50; 
        
        if (this.data.inventory.length >= maxSlots) {
            if (window.Msg) Msg.log("儲物袋空間不足！", "system");
            return false;
        }

        this.data.inventory.push(item);
        this.save();
        return true;
    },

    /**
     * 初始玩家數據模板
     */
    getInitialData() {
        return {
            level: 1, 
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

// ==========================================
// 🛡️ 全域對接鎖：確保 window.Player 絕對存在
// ==========================================
window.Player = Player;
console.log("%c【系統】修士模組 Player 已成功掛載全域。", "color: #10b981; font-weight: bold;");
