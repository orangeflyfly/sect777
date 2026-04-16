/**
 * V3.0 SectSystem.js (加固擴充版)
 * 職責：處理弟子招募、機率計算、保底機制、工作指派與遣散
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
        console.log("【SectSystem】宗門人事大腦啟動...");
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
     */
    getSummary() {
        let list = Player.data.sect ? Player.data.sect.disciples : [];
        let summary = { total: list.length, idle: 0, farm: 0, mine: 0 };
        
        list.forEach(d => {
            if (summary[d.status] !== undefined) {
                summary[d.status]++;
            } else {
                summary.idle++; // 防呆：如果狀態異常，歸類為閒置
            }
        });
        return summary;
    },

    /**
     * 啟動招募法陣
     * @param {boolean} isTen - 是否為十連招募
     * @returns {Array|null} - 回傳抽到的弟子陣列，若靈石不足則回傳 null
     */
    recruit(isTen = false) {
        const cost = isTen ? this.COST_TEN : this.COST_SINGLE;
        
        // 🟢 修正 1：兼容 player.data.coin 或 player.data.coins 的防呆設計
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
        
        // 4. 開始抽卡
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
            else if (isTen && i === 9 && !guaranteedLevel) {
                guaranteedLevel = '地';
            }

            const newDisciple = this.generateDisciple(guaranteedLevel);
            results.push(newDisciple);
            Player.data.sect.disciples.push(newDisciple);
        }

        // 5. 更新介面上方的靈石顯示 (若有 Core 則連動 UI)
        if (window.Core && typeof window.Core.updateUI === 'function') {
            window.Core.updateUI();
        }

        // 6. 存入玉簡
        if (Player.save) Player.save();

        return results; // 將結果回傳給 UI 層去播動畫
    },

    /**
     * 核心演算法：生成單一弟子
     */
    generateDisciple(guaranteedLevel = false) {
        // 1. 骰靈根
        let root = this.rollRoot(guaranteedLevel);
        let rootData = DATA_SECT.ROOT_LEVELS[root];

        // 2. 骰姓名
        let name = this.rollName();

        // 3. 骰基礎屬性 (根據靈根倍率放大)
        let stats = {};
        DATA_SECT.BASE_STATS.forEach(stat => {
            // 基礎數值 10~50
            let baseVal = Math.floor(Math.random() * 41) + 10; 
            stats[stat] = Math.floor(baseVal * rootData.multiplier);
        });

        // 4. 骰性格詞條 (30%機率獲得2個，70%機率1個)
        let traits = this.rollTraits();

        // 5. 組裝弟子檔案
        return {
            id: 'D_' + Date.now() + '_' + Math.floor(Math.random() * 10000), // 唯一靈魂印記
            name: name,
            root: root,
            stats: stats,
            traits: traits,
            status: 'idle', // 狀態: idle(閒置), farm(仙草園), mine(靈礦脈)
            level: 1,
            exp: 0
        };
    },

    rollRoot(guaranteedLevel) {
        // 若有大保底，直接升級為天或仙
        if (guaranteedLevel === '天') {
            return Math.random() > 0.1 ? '天' : '仙'; // 保底也有 10% 機率爆出仙級
        }

        let totalWeight = 0;
        let weights = [];
        
        for (let [key, val] of Object.entries(DATA_SECT.ROOT_LEVELS)) {
            // 如果是十連小保底(地級)，強行過濾掉凡骨與玄靈根的機率
            if (guaranteedLevel === '地' && (key === '玄' || key === '黃')) continue;
            
            totalWeight += val.weight;
            weights.push({ key, weight: totalWeight });
        }

        let roll = Math.random() * totalWeight;
        for (let w of weights) {
            if (roll <= w.weight) return w.key;
        }
        return '黃'; // 防呆底線
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
            // 防止抽到重複詞條
            if (!selected.includes(t)) {
                selected.push(t);
            } else {
                i--; // 若重複則重抽
            }
        }
        return selected;
    },

    /**
     * 遣散弟子 (刪除)
     */
    dismissDisciple(discipleId) {
        if (!Player.data.sect) return false;
        
        let list = Player.data.sect.disciples;
        let index = list.findIndex(d => d.id === discipleId);
        
        if (index !== -1) {
            let name = list[index].name;
            list.splice(index, 1); // 將弟子從名冊抹除
            Msg.log(`已發放遣散費，【${name}】離開了宗門。`, "system");
            
            // 更新 UI 與存檔
            if (window.Core && window.Core.updateUI) window.Core.updateUI();
            if (Player.save) Player.save();
            return true;
        }
        return false;
    },

    /**
     * 指派工作
     */
    assignJob(discipleId, newStatus) {
        if (!Player.data.sect) return false;

        let d = Player.data.sect.disciples.find(d => d.id === discipleId);
        if (d) {
            // 判斷中文名稱，用於顯示日誌
            let statusName = newStatus === 'farm' ? '仙草園' : (newStatus === 'mine' ? '靈礦脈' : '散修居(閒置)');
            
            d.status = newStatus;
            Msg.log(`已指派【${d.name}】前往 ${statusName} 執行任務。`, "system");
            
            // 存檔
            if (Player.save) Player.save();
            return true;
        }
        return false;
    }
};

// 🟢 修正 3：掛載至 window 確保全域可用
window.SectSystem = SectSystem;
