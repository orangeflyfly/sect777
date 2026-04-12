/**
 * V1.7.0 player.js
 * 職責：玩家數據管理、存檔讀取、經驗/屬性運算、物品獲取邏輯。
 */

const Player = {
    data: null,

    // 1. 初始化玩家數據 (對齊 V1.6 基礎，預防損壞)
    init() {
        const SAVE_KEY = 'CultivationGame_Save_V1.7';
        const savedData = localStorage.getItem(SAVE_KEY);
        
        const INITIAL_PLAYER_DATA = {
            name: "無名修者",
            realm: 0,       // 境界索引 (0=凡人, 1=練氣初期...)
            exp: 0,
            maxExp: 100,
            level: 1,       // 基礎等級 (對應小境界)
            coin: 500,
            stats: {
                str: 10,    // 力量
                con: 10,    // 體質
                dex: 10,    // 敏捷
                int: 10     // 悟性 (V1.7 新增影響經驗加成)
            },
            statPoints: 0,
            inventory: [],  // 儲物袋陣列
            skills: [],     // 已學會的神通
            equipped: {
                weapon: null,
                armor: null
            },
            currentRegion: "region_01",
            currentMap: 101,
            lastSaveTime: Date.now()
        };

        if (savedData) {
            try {
                this.data = JSON.parse(savedData);
                // 數據自動補全：確保新欄位 (如 int) 在舊存檔中也能正常初始化
                this.data.stats = { ...INITIAL_PLAYER_DATA.stats, ...this.data.stats };
                if (this.data.statPoints === undefined) this.data.statPoints = 0;
            } catch (e) {
                console.error("存檔神識受損，重新引氣入體 (重置)");
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

    // 3. 經驗獲取 (V1.7 實裝悟性加成公式)
    gainExp(amount) {
        // 公式：最終經驗 = 基礎經驗 * (1 + 悟性 * 1%)
        // 例如：100 點基礎 EXP，10 點悟性 = 110 點
        const intBonus = this.data.stats.int * 0.01;
        const totalExp = Math.floor(amount * (1 + intBonus));
        const bonusAmount = totalExp - amount;

        this.data.exp += totalExp;
        
        // 檢查是否突破大境界
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
        
        // 每一境界提升，下一階難度增加 1.8 倍
        this.data.maxExp = Math.floor(this.data.maxExp * 1.8);
        
        // 突破贈送屬性點
        this.data.statPoints += 5;
        
        this.save();
        // UI 通知由 main.js 心跳檢測或單獨觸發
    },

    // 5. 屬性點分配
    addStat(type) {
        if (this.data.statPoints > 0) {
            this.data.stats[type]++;
            this.data.statPoints--;
            this.save();
            return true;
        }
        return false;
    },

    // 6. 物品獲取 (V1.7 實裝殘卷溢出與煉化)
    addItem(item) {
        // A. 判定是否為殘卷 (格式："殘卷：技能名-序號")
        if (item.name && item.name.includes("殘卷：")) {
            const hasDuplicate = this.data.inventory.find(i => i.name === item.name);
            
            if (hasDuplicate) {
                // 方案 A：重複殘卷自動煉化為靈石
                const skillName = item.name.split("：")[1].split("-")[0];
                // 從 GAMEDATA 獲取價格，若無則預設 50
                const sellPrice = GAMEDATA.FRAGMENTS[skillName] ? GAMEDATA.FRAGMENTS[skillName].sellPrice : 50;
                
                this.data.coin += sellPrice;
                this.save();
                return { success: true, type: 'refined', price: sellPrice };
            }
        }

        // B. 檢查背包容量 (對齊 Config 50 格)
        if (this.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            return { success: false, reason: '儲物袋空間不足' };
        }

        // C. 成功放入
        const newItem = {
            ...item,
            uuid: Date.now() + Math.random().toString(36).substr(2, 9) // 唯一標識符
        };
        this.data.inventory.push(newItem);
        this.save();
        return { success: true, type: 'normal' };
    },

    // 7. 地圖進入權限檢查 (V1.7 實裝境界硬攔截)
    canAccessMap(mapId) {
        let targetMap = null;
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) { targetMap = map; break; }
        }

        if (!targetMap) return { can: false, reason: "未知地域，無法進入。" };

        // 檢查境界
        if (this.data.realm < targetMap.minRealm) {
            const reqRealmName = GAMEDATA.CONFIG.REALM_NAMES[targetMap.minRealm];
            return { can: false, reason: `修為不足！此地凶險，需達到 [${reqRealmName}] 境界方可進入。` };
        }

        return { can: true };
    },

    // 8. 戰鬥數值即時換算
    getBattleStats() {
        return {
            hp: 100 + (this.data.stats.con * 15),
            atk: 10 + (this.data.stats.str * 3),
            spd: 5 + (this.data.stats.dex * 0.5),
            critRate: 0.05 + (this.data.stats.dex * 0.005) // 敏捷影響暴擊率
        };
    }
};

// 確保全域可用
window.Player = Player;
