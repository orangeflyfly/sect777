/**
 * V1.7.0 player.js
 * 職責：修士數據管理、存檔讀寫、屬性加點、物品獲取邏輯。
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
                // 數據自動校準：補齊可能缺失的新欄位
                this.data.stats = { ...INITIAL_PLAYER_DATA.stats, ...this.data.stats };
                if (this.data.coin === undefined) this.data.coin = this.data.money || 0;
                if (this.data.statPoints === undefined) this.data.statPoints = 0;
            } catch (e) {
                console.error("識海受損，重啟引氣入體。");
                this.data = INITIAL_PLAYER_DATA;
            }
        } else {
            this.data = INITIAL_PLAYER_DATA;
        }
        this.save();
    },

    // 2. 存檔機制
    save() {
        this.data.lastSaveTime = Date.now();
        localStorage.setItem('CultivationGame_Save_V1.7', JSON.stringify(this.data));
    },

    // 3. 經驗獲取 (實裝悟性加成)
    gainExp(amount) {
        // 公式：最終經驗 = 基礎經驗 * (1 + 悟性 * 1%)
        const intBonus = this.data.stats.int * 0.01;
        const totalExp = Math.floor(amount * (1 + intBonus));
        const bonusAmount = totalExp - amount;

        this.data.exp += totalExp;
        
        // 檢查突破
        if (this.data.exp >= this.data.maxExp) {
            this.levelUp();
        }
        
        this.save();
        return { totalExp, bonusAmount };
    },

    // 4. 境界突破邏輯
    levelUp() {
        this.data.exp -= this.data.maxExp;
        this.data.realm++;
        this.data.level++; // 小境界提升
        
        // 難度曲線：下一階所需經驗提升 1.8 倍
        this.data.maxExp = Math.floor(this.data.maxExp * 1.8);
        
        // 突破贈送潛能點
        this.data.statPoints += 5;
        
        this.save();
        // 提示訊息交由各分頁 UI 處理
    },

    // 5. 屬性加點
    addStat(type) {
        if (this.data.statPoints > 0) {
            this.data.stats[type]++;
            this.data.statPoints--;
            this.save();
            return true;
        }
        return false;
    },

    // 6. 物品獲取 (實裝殘卷溢出煉化)
    addItem(item) {
        // A. 判定殘卷重複
        if (item.name && item.name.includes("殘卷：")) {
            const hasDuplicate = this.data.inventory.find(i => i.name === item.name);
            if (hasDuplicate) {
                const skillName = item.name.split("：")[1].split("-")[0];
                const sellPrice = GAMEDATA.FRAGMENTS[skillName]?.sellPrice || 50;
                
                this.data.coin += sellPrice;
                this.save();
                return { success: true, type: 'refined', price: sellPrice };
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
        return {
            hp: 100 + (this.data.stats.con * 15),
            maxHp: 100 + (this.data.stats.con * 15),
            atk: 10 + (this.data.stats.str * 3),
            spd: 5 + (this.data.stats.dex * 0.5),
            critRate: 0.05 + (this.data.stats.dex * 0.005),
            regen: 1 + (this.data.stats.con * 0.2)
        };
    }
};

// 確保全域可見
window.Player = Player;
