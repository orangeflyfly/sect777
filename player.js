/**
 * V1.7.0 player.js
 * 職責：玩家數據管理、存檔讀取、經驗加成計算、物品獲取邏輯。
 */

const Player = {
    data: null,

    // 初始化數據 (對齊 V1.6.0 防禦性架構)
    init() {
        const savedData = localStorage.getItem('CultivationGame_Save_V1.7');
        const INITIAL_PLAYER_DATA = {
            name: "無名修者",
            realm: 0, // 凡人
            exp: 0,
            maxExp: 100,
            level: 1,
            coin: 500,
            stats: {
                str: 10, // 力量
                con: 10, // 體質
                dex: 10, // 敏捷
                int: 10  // 悟性
            },
            statPoints: 0,
            inventory: [],
            skills: [],
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
                // 數據補全機制：防止舊版存檔缺少新欄位 (如 int)
                this.data.stats = { ...INITIAL_PLAYER_DATA.stats, ...this.data.stats };
            } catch (e) {
                console.error("存檔損壞，初始化新數據");
                this.data = INITIAL_PLAYER_DATA;
            }
        } else {
            this.data = INITIAL_PLAYER_DATA;
        }
        this.save();
    },

    // 存檔
    save() {
        this.data.lastSaveTime = Date.now();
        localStorage.setItem('CultivationGame_Save_V1.7', JSON.stringify(this.data));
    },

    // 獲得修為 (實裝 V1.7 悟性加成)
    gainExp(amount) {
        // 公式：最終經驗 = 基礎經驗 * (1 + 悟性 * 1%)
        const intBonus = this.data.stats.int * 0.01;
        const totalExp = Math.floor(amount * (1 + intBonus));
        const bonusAmount = totalExp - amount;

        this.data.exp += totalExp;
        
        // 檢查升級 (大境界突破)
        if (this.data.exp >= this.data.maxExp) {
            this.levelUp();
        }
        
        this.save();
        return { totalExp, bonusAmount };
    },

    // 突破境界
    levelUp() {
        this.data.exp -= this.data.maxExp;
        this.data.realm++;
        this.data.maxExp = Math.floor(this.data.maxExp * 1.8);
        this.data.statPoints += 5; // 突破給予屬性點
        
        const realmName = GAMEDATA.CONFIG.REALM_NAMES[this.data.realm] || "更高境界";
        // 這裡後續由 UI 顯示特效
        this.save();
    },

    // 增加屬性
    addStat(type) {
        if (this.data.statPoints > 0) {
            this.data.stats[type]++;
            this.data.statPoints--;
            this.save();
            return true;
        }
        return false;
    },

    // 獲得物品 (實裝殘卷溢出煉化)
    addItem(item) {
        // 1. 檢查是否為殘卷碎片 (格式範例: "殘卷：烈焰斬-1")
        if (item.name && item.name.includes("殘卷：")) {
            const hasDuplicate = this.data.inventory.find(i => i.name === item.name);
            
            if (hasDuplicate) {
                // 方案 A：自動煉化為靈石
                const skillName = item.name.split("：")[1].split("-")[0];
                const sellPrice = GAMEDATA.FRAGMENTS[skillName] ? GAMEDATA.FRAGMENTS[skillName].sellPrice : 50;
                
                this.data.coin += sellPrice;
                this.save();
                return { success: true, type: 'refined', price: sellPrice };
            }
        }

        // 2. 檢查背包空間
        if (this.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            return { success: false, reason: '背包已滿' };
        }

        // 3. 正常存入背包
        this.data.inventory.push({
            ...item,
            uuid: Date.now() + Math.random().toString(36).substr(2, 9)
        });
        this.save();
        return { success: true, type: 'normal' };
    },

    // 檢查地圖進入權限 (境界門檻)
    canAccessMap(mapId) {
        // 尋找地圖所在的區域
        let targetMap = null;
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) {
                targetMap = map;
                break;
            }
        }

        if (!targetMap) return { can: false, reason: "未知地域" };

        // 硬性攔截邏輯
        if (this.data.realm < targetMap.minRealm) {
            const reqName = GAMEDATA.CONFIG.REALM_NAMES[targetMap.minRealm];
            return { can: false, reason: `修為不足！此地需達到 [${reqName}] 方可進入。` };
        }

        return { can: true };
    },

    // 計算當前戰鬥屬性 (加成後)
    getBattleStats() {
        return {
            hp: 100 + (this.data.stats.con * 15),
            atk: 10 + (this.data.stats.str * 3),
            spd: 5 + (this.data.stats.dex * 0.5),
            critRate: 0.05 + (this.data.stats.dex * 0.005)
        };
    }
};

// 確保全局可用
window.Player = Player;
