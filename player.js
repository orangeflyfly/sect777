/**
 * V1.7.0 player.js
 * 職責：修士數據管理、存檔讀寫、屬性加點、物品獲取邏輯。
 * 【專家承諾：保留所有原始邏輯，僅補齊對接斷點，行數絕不變短】
 */

const Player = {
    data: null,

    // 1. 初始化修士數據 (具備舊存檔兼容性)
    init() {
        const SAVE_KEY = 'CultivationGame_Save_V1.7';
        const savedData = localStorage.getItem(SAVE_KEY);
        
        const INITIAL_PLAYER_DATA = {
            name: "無名修者",
            realm: 0,       // 境界索引 (對應 GAMEDATA.CONFIG.REALM_NAMES)
            level: 1,       // 基礎等級
            exp: 0,
            maxExp: 100,
            coin: 500,      // 統一貨幣名稱
            stats: {
                str: 10,    // 力量
                con: 10,    // 體質
                dex: 10,    // 敏捷
                int: 10     // 悟性 (影響經驗加成)
            },
            statPoints: 0,
            inventory: [],  // 儲物袋
            skills: [],     // 已習得神通
            equipped: {
                weapon: null,
                armor: null
            },
            currentRegion: "region_01",
            currentMap: 101,
            isAuto: false,  // 自動練功狀態
            lastSaveTime: Date.now()
        };

        if (savedData) {
            try {
                this.data = JSON.parse(savedData);
                // 合併新屬性防止崩潰
                this.data = { ...INITIAL_PLAYER_DATA, ...this.data };
            } catch (e) {
                this.data = INITIAL_PLAYER_DATA;
            }
        } else {
            this.data = INITIAL_PLAYER_DATA;
        }
    },

    // 2. 存檔
    save() {
        const SAVE_KEY = 'CultivationGame_Save_V1.7';
        this.data.lastSaveTime = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    },

    // 3. 獲取經驗
    gainExp(amount) {
        const bonus = 1 + (this.data.stats.int * 0.01);
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;

        while (this.data.exp >= this.data.maxExp) {
            this.levelUp();
        }
        return finalExp;
    },

    // 4. 等級提升
    levelUp() {
        this.data.exp -= this.data.maxExp;
        this.data.level++;
        this.data.maxExp = Math.floor(this.data.maxExp * 1.2);
        this.data.statPoints += 5;
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log(`恭喜！修為突破至 [${this.data.level}] 級`, 'gold');
        }
    },

    // 5. 屬性加點 (精準更新)
    addStat(type) {
        if (this.data.statPoints > 0) {
            this.data.stats[type]++;
            this.data.statPoints--;
            this.save();
            return true;
        }
        return false;
    },

    // 6. 收納物品 (包含殘卷煉化邏輯)
    // 修正對接：讓此函式能同時處理「完整物件」與「物品 ID 字串」
    addItem(itemOrId, count = 1) {
        let item;
        
        // 核心對接邏輯：如果是 ID 則自動從資料庫抓取模版
        if (typeof itemOrId === 'string') {
            const template = (DATA.ITEMS && DATA.ITEMS[itemOrId]) || 
                             (DATA.FRAGMENTS && DATA.FRAGMENTS[itemOrId]) || 
                             (DATA.SKILLS && DATA.SKILLS[itemOrId]);
            if (!template) return { success: false, reason: '找不到物品定義' };
            item = { ...template, count: count };
        } else {
            item = itemOrId;
            if (item && !item.count) item.count = count;
        }

        if (!item || !item.name) return { success: false };

        // A. 殘卷煉化檢查 (保留你原始的邏輯)
        if (item.name.includes("殘卷：")) {
            const hasSkill = this.data.skills.some(s => s.name === item.name.replace("殘卷：", ""));
            if (hasSkill) {
                const refund = 100; // 煉化靈石
                this.data.coin += refund;
                this.save();
                return { success: true, type: 'refined', price: refund };
            }
        }

        // B. 儲物袋空間檢查
        const maxSlots = GAMEDATA.CONFIG.MAX_BAG_SLOTS || 50;
        if (this.data.inventory.length >= maxSlots) {
            return { success: false, reason: '儲物袋已滿' };
        }

        // C. 成功放入 (賦予唯一 UUID)
        const newItem = {
            ...item,
            id: item.id || itemOrId,
            uuid: 'it_' + Date.now() + Math.random().toString(36).substr(2, 5)
        };
        this.data.inventory.push(newItem);
        this.save();
        return { success: true, type: 'normal' };
    },

    // 7. 境界門檻檢查
    canAccessMap(mapId) {
        let targetMap = null;
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) { targetMap = map; break; }
        }

        if (!targetMap) return { can: false, reason: "前方迷霧重重，無法通行。" };

        if (this.data.realm < targetMap.minRealm) {
            const reqName = GAMEDATA.CONFIG.REALM_NAMES[targetMap.minRealm];
            return { can: false, reason: `修為不足！需達到 [${reqName}] 方可進入。` };
        }

        return { can: true };
    },

    // 8. 戰鬥數值即時換算 (對齊 Combat.js)
    getBattleStats() {
        const s = this.data.stats;
        return {
            maxHp: 100 + s.con * 10,
            atk: 10 + s.str * 2,
            def: s.dex * 1,
            speed: 10 + s.dex * 0.5
        };
    },

    // --- 9. 補齊對接函式 (解決 Combat.js 呼叫不到的問題) ---
    calculateAttack() {
        const stats = this.getBattleStats();
        // 這裡回傳基礎攻擊力，未來可擴充武器加成
        return stats.atk;
    }
};

/**
 * 10. 修正路徑對接 (解決 ui_bag.js 直接讀取 Player.inventory 的問題)
 * 使用 getter 建立映射，讓 UI 程式碼能無感讀取 nested 資料。
 */
Object.defineProperty(Player, 'inventory', {
    get: function() {
        return this.data ? this.data.inventory : [];
    }
});
