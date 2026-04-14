/**
 * V2.2 SectManager.js (飛升模組版 - 宗門大腦)
 * 職責：負責宗門產業（靈田、礦脈）的背景運行、離線收益結算。
 * 位置：/systems/SectManager.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const SectManager = {
    intervalId: null,

    init() {
        console.log("【宗門】宗門大腦開始運轉...");
        if (!Player.data || !Player.data.world) return;
        
        // 1. 遊戲啟動時，先結算離線時間的收益
        this.processOfflineYield();
        
        // 2. 啟動每分鐘一次的掛機結算
        this.startTick();
    },

    /**
     * 結算離線收益
     */
    processOfflineYield() {
        const wData = Player.data.world;
        const now = Date.now();
        const diffMs = now - (wData.lastCollect || now);
        const diffMinutes = Math.floor(diffMs / 60000); // 換算經過了幾分鐘

        if (diffMinutes > 0) {
            this.giveYield(diffMinutes, true);
            wData.lastCollect = now;
            Player.save();
        } else if (!wData.lastCollect) {
            wData.lastCollect = now;
        }
    },

    /**
     * 啟動背景時鐘 (每分鐘跳動一次)
     */
    startTick() {
        if (this.intervalId) clearInterval(this.intervalId);
        
        this.intervalId = setInterval(() => {
            if (!Player.data || !Player.data.world) return;
            
            // 每過 1 分鐘給予一次收益 (非離線狀態，不彈飄字)
            this.giveYield(1, false);
            
            Player.data.world.lastCollect = Date.now();
            Player.save();
            
            // 刷新全域 UI (比如右上角的靈石變動)
            if (window.Core) window.Core.updateUI();
            
        }, 60000); // 60000 毫秒 = 1分鐘
    },

    /**
     * 核心產出邏輯
     * @param {number} minutes - 經過的分鐘數
     * @param {boolean} isOffline - 是否為離線結算 (用來決定要不要噴日誌)
     */
    giveYield(minutes, isOffline) {
        const wData = Player.data.world;
        let gotCoin = 0;
        let gotHerb = 0;

        // 1. 鐵礦部產出 (靈石)
        // 公式：每分鐘 = 人數 * 等級 * 2
        if (wData.mine && wData.mine.level > 0 && wData.mine.assigned > 0) {
            const mineYieldPerMin = wData.mine.assigned * wData.mine.level * 2;
            gotCoin = mineYieldPerMin * minutes;
            Player.data.coin += gotCoin;
        }

        // 2. 草藥部產出 (仙草)
        // 公式：每 10 分鐘 = 人數 * 等級。我們換算成每分鐘的機率累積。
        if (wData.farm && wData.farm.level > 0 && wData.farm.assigned > 0) {
            const farmYieldPer10Min = wData.farm.assigned * wData.farm.level;
            const yieldPerMin = farmYieldPer10Min / 10;
            
            gotHerb = Math.floor(yieldPerMin * minutes);
            
            // 處理小數機率 (例如 0.5 會有 50% 機率額外多產 1 個)
            const remainder = (yieldPerMin * minutes) - gotHerb;
            if (Math.random() < remainder) gotHerb += 1;

            if (gotHerb > 0) {
                this.addHerbItem(gotHerb);
            }
        }

        // 只有離線結算且真的有拿到東西時，才跳出華麗的提示
        if (isOffline && (gotCoin > 0 || gotHerb > 0)) {
            let msgStr = `🌌 離線 ${minutes} 分鐘，宗門弟子為你產出：`;
            if (gotCoin > 0) msgStr += ` ${gotCoin} 靈石`;
            if (gotHerb > 0) msgStr += ` ${gotHerb} 株仙草`;
            Msg.log(msgStr, "reward");
        }
    },

    /**
     * 將仙草塞入儲物袋 (支援疊加)
     */
    addHerbItem(count) {
        const existing = Player.data.inventory.find(i => i.id === 'mat_herb');
        if (existing) {
            // 如果已經有仙草，直接疊加數量
            existing.count = (existing.count || 1) + count;
        } else {
            // 否則新增一疊仙草
            Player.data.inventory.push({
                id: 'mat_herb',
                uuid: `mat_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                name: '宗門仙草',
                type: 'material',
                count: count,
                desc: '仙草園產出的靈草，生機盎然，可用於煉丹或交付宗門任務。',
                rarity: 2,
                price: 5
            });
        }
    }
};

window.SectManager = SectManager;
