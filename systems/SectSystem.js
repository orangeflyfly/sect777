/**
 * V3.5.1 SectSystem.js (五行大圓滿 - 絕不簡化版)
 * 職責：處理弟子招募、機率計算、保底機制、工作指派、遣散，以及【五行屬性】與【境界修為升級】
 * 位置：/systems/SectSystem.js
 */

import { DATA_SECT } from '../data/data_sect.js';
import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const SectSystem = {
    // 招募消耗設定
    COST_SINGLE: 1000,
    COST_TEN: 10000,
    MAX_DISCIPLES: 50, // 預設宗門人數上限

    init() {
        console.log("%c【SectSystem】宗門人事大腦點火，感應五行靈脈中...", "color: #3b82f6; font-weight: bold;");
        // 確保玩家玉簡 (存檔) 中有宗門資料區塊
        if (!Player.data.sect) {
            Player.data.sect = {
                disciples: [],
                pityCount: 0 // 保底計數器
            };
        }
    },

    /**
     * 取得宗門人事統計 (UI 顯示專用)
     * 支援：閒置、農場、礦場、煉丹、歷練五大狀態統計
     */
    getSummary() {
        let list = Player.data.sect ? Player.data.sect.disciples : [];
        // 🌟 統計字典：確保包含所有新增產業狀態
        let summary = { total: list.length, idle: 0, farm: 0, mine: 0, alchemy: 0, expedition: 0 };
        
        list.forEach(d => {
            // 🟢 防呆補丁一：為舊存檔弟子自動開通境界系統
            if (d.level === undefined) d.level = 1;
            if (d.exp === undefined) d.exp = 0;
            if (d.maxExp === undefined) d.maxExp = d.level * 100;

            // 🟢 防呆補丁二：為舊存檔弟子覺醒【五行靈根】
            if (d.element === undefined) {
                d.element = this.rollElement();
            }

            if (summary[d.status] !== undefined) {
                summary[d.status]++;
            } else {
                summary.idle++; // 防呆：如果狀態異常(如舊檔)，歸類為閒置
            }
        });
        return summary;
    },

    /**
     * 啟動招募法陣
     * @param {boolean} isTen - 是否為十連招募
     */
    recruit(isTen = false) {
        const cost = isTen ? this.COST_TEN : this.COST_SINGLE;
        
        // 🟢 修正：兼容 player.data.coin 或 player.data.coins 的防呆設計
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);

        // 1. 檢查靈石餘額
        if (currentCoins < cost) {
            Msg.log("❌ 靈石不足，無法啟動招募法陣！", "monster-atk");
            return null;
        }

        // 2. 檢查空間是否足夠
        let currentCount = Player.data.sect.disciples.length;
        let pulls = isTen ? 10 : 1;
        if (currentCount + pulls > this.MAX_DISCIPLES) {
            Msg.log("❌ 宗門廂房已滿，請先遣散部分弟子！", "monster-atk");
            return null;
        }

        // 3. 扣除靈石 (兼容處理)
        if (Player.data.coin !== undefined) {
            Player.data.coin -= cost;
        } else {
            Player.data.coins -= cost;
        }
        
        // 4. 開始抽卡邏輯
        let results = [];
        for (let i = 0; i < pulls; i++) {
            Player.data.sect.pityCount++;
            let guaranteedLevel = false;
            
            // 🌟 保底機制 1：每 50 抽必出「天級」或「仙級」
            if (Player.data.sect.pityCount >= 50) {
                guaranteedLevel = '天';
                Player.data.sect.pityCount = 0; // 觸發大保底後重置
            } 
            // 🌟 保底機制 2：十連抽的最後一抽，必出「地級」或以上
            else if (isTen && i === pulls - 1 && !guaranteedLevel) {
                guaranteedLevel = '地';
            }

            const newDisciple = this.generateDisciple(guaranteedLevel);
            results.push(newDisciple);
            Player.data.sect.disciples.push(newDisciple);
        }

        // 5. 更新全域 UI (靈石顯示)
        if (window.Core && typeof window.Core.updateUI === 'function') {
            window.Core.updateUI();
        }

        // 6. 存入存檔
        if (Player.save) Player.save();

        return results; // 回傳結果供 UI 動畫使用
    },

    /**
     * 核心演算法：生成單一弟子 (包含資質與五行)
     */
    generateDisciple(guaranteedLevel = false) {
        // 1. 骰資質等級 (天/地/玄/黃) -> 決定屬性倍率
        let rootQuality = this.rollRoot(guaranteedLevel);
        let rootData = DATA_SECT.ROOT_LEVELS[rootQuality];

        // 2. 🌟 骰五行靈根 (金/木/水/火/土) -> 決定工作專長
        let element = this.rollElement();

        // 3. 骰隨機姓名
        let name = this.rollName();

        // 4. 骰基礎屬性 (根據資質倍率放大)
        let stats = {};
        DATA_SECT.BASE_STATS.forEach(stat => {
            // 基礎原始數值 10~50
            let baseVal = Math.floor(Math.random() * 41) + 10; 
            stats[stat] = Math.floor(baseVal * rootData.multiplier);
        });

        // 5. 骰性格詞條 (30%機率獲得2個，70%機率1個)
        let traits = this.rollTraits();

        // 6. 組裝弟子完整檔案
        return {
            id: 'D_' + Date.now() + '_' + Math.floor(Math.random() * 10000), // 唯一標識
            name: name,
            root: rootQuality,   // 資質品質 (影響成長)
            element: element,    // 🌟 五行屬性 (影響煉丹、煉器等職能)
            stats: stats,
            traits: traits,
            status: 'idle',      // 預設狀態: idle
            level: 1,            // 初始境界: Lv.1
            exp: 0,              // 初始經驗
            maxExp: 100          // 初始升級門檻
        };
    },

    /**
     * 五行隨機演算法 (包含特殊稀有靈根)
     */
    rollElement() {
        const elements = ['金', '木', '水', '火', '土'];
        const rand = Math.random();
        
        // 2% 機率覺醒「仙」靈根 (全系精通)
        if (rand < 0.02) return '仙';
        // 5% 機率覺醒「天」靈根 (屬性強化)
        if (rand < 0.05) return '天';
        
        // 一般五行
        return elements[Math.floor(Math.random() * elements.length)];
    },

    rollRoot(guaranteedLevel) {
        // 大保底邏輯
        if (guaranteedLevel === '天') {
            return Math.random() > 0.1 ? '天' : '仙';
        }

        let totalWeight = 0;
        let weights = [];
        
        for (let [key, val] of Object.entries(DATA_SECT.ROOT_LEVELS)) {
            // 十連小保底：過濾掉低階資質
            if (guaranteedLevel === '地' && (key === '玄' || key === '黃')) continue;
            
            totalWeight += val.weight;
            weights.push({ key, weight: totalWeight });
        }

        let roll = Math.random() * totalWeight;
        for (let w of weights) {
            if (roll <= w.weight) return w.key;
        }
        return '黃';
    },

    rollName() {
        let surnames = DATA_SECT.NAME_POOL.SURNAMES;
        let surname = surnames[Math.floor(Math.random() * surnames.length)];

        let categories = Object.keys(DATA_SECT.NAME_POOL.GIVEN_NAMES);
        let randomCategory = categories[Math.floor(Math.random() * categories.length)];
        let givenNames = DATA_SECT.NAME_POOL.GIVEN_NAMES[randomCategory];
        let givenName = givenNames[Math.floor(Math.random() * givenNames.length)];

        return surname + givenName;
    },

    rollTraits() {
        let traitKeys = Object.keys(DATA_SECT.TRAITS);
        let count = Math.random() > 0.7 ? 2 : 1;
        let selected = [];
        
        for (let i = 0; i < count; i++) {
            let r = Math.floor(Math.random() * traitKeys.length);
            let t = traitKeys[r];
            if (!selected.includes(t)) {
                selected.push(t);
            } else {
                i--; // 重複重抽
            }
        }
        return selected;
    },

    /**
     * 遣散弟子
     */
    dismissDisciple(discipleId) {
        if (!Player.data.sect) return false;
        
        let list = Player.data.sect.disciples;
        let index = list.findIndex(d => d.id === discipleId);
        
        if (index !== -1) {
            let name = list[index].name;
            list.splice(index, 1);
            Msg.log(`已發放遣散費，【${name}】離開了宗門。`, "system");
            
            if (window.Core && window.Core.updateUI) window.Core.updateUI();
            if (Player.save) Player.save();
            return true;
        }
        return false;
    },

    /**
     * 指派工作 (擴展版)
     */
    assignJob(discipleId, newStatus) {
        if (!Player.data.sect) return false;

        let d = Player.data.sect.disciples.find(d => d.id === discipleId);
        if (d) {
            const statusMap = {
                'farm': '仙草園',
                'mine': '靈礦脈',
                'alchemy': '煉丹閣',
                'expedition': '外派歷練',
                'idle': '散修居(閒置)'
            };
            let statusName = statusMap[newStatus] || '未知職位';
            
            d.status = newStatus;
            Msg.log(`已指派【${d.name}】前往 ${statusName} 執行任務。`, "system");
            
            if (Player.save) Player.save();
            return true;
        }
        return false;
    },

    /**
     * 🟢 核心機制：弟子獲得修為與升級判定
     * @param {string} discipleId - 弟子ID
     * @param {number} amount - 獲得的修為值
     */
    gainExp(discipleId, amount) {
        if (!Player.data.sect) return false;
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return false;

        // 基礎數據防護
        if (d.level === undefined) d.level = 1;
        if (d.exp === undefined) d.exp = 0;
        if (d.maxExp === undefined) d.maxExp = d.level * 100;

        d.exp += amount;
        let leveledUp = false;

        // 升級迴圈 (支援連跳)
        while (d.exp >= d.maxExp) {
            d.exp -= d.maxExp;
            d.level++;
            d.maxExp = d.level * 100;
            
            // 升級反哺：根據悟性提升戰力
            let statBonus = Math.max(1, Math.floor((d.stats['悟性'] || 10) * 0.1));
            if (!d.stats['戰力']) d.stats['戰力'] = 10;
            if (!d.stats['修為']) d.stats['修為'] = 10;
            
            d.stats['戰力'] += (statBonus + 2);
            d.stats['修為'] += 10;
            
            leveledUp = true;
        }

        if (leveledUp) {
            Msg.log(`✨ 突破！【${d.name}】修為大增，境界提升至 Lv.${d.level}！戰力攀升！`, "system");
            // 若招募堂詳細面板開啟，建議在此觸發局部重新渲染
        }

        if (Player.save) Player.save();
        return { leveledUp: leveledUp, currentLevel: d.level, expGained: amount };
    }
};

// 掛載至 window
window.SectSystem = SectSystem;
