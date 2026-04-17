/**
 * V3.6.1 SectManager.js (萬象森羅 - 宗門總管大腦)
 * 職責：精算各部門弟子的性格加成 (Traits)、處理離線收益、提供全域產能查詢接口
 * 修正：移除舊版衝突的計時器，轉為輔助核心 (對接 core.js 的 startEconomyTick)
 * 位置：/systems/SectManager.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { DATA_SECT } from '../data/data_sect.js'; // 🌟 引入性格數據庫

export const SectManager = {
    init() {
        console.log("【宗門】總管大腦開始運轉，準備精算弟子業力...");
        if (!Player.data || !Player.data.world) return;
        
        // 遊戲啟動時，結算離線時間的收益
        this.processOfflineYield();
    },

    /**
     * 🌟 核心：精算特定部門的「弟子性格綜合加成」
     * @param {string} department - 'farm', 'mine', 'alchemy', 'forge'
     * @returns {number} 該部門的最終效率倍率 (預設 1.0)
     */
    calculateDepartmentMultiplier(department) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return 1.0;

        let totalMultiplier = 1.0;
        let workerCount = 0;
        let activeTraits = [];

        // 1. 找出被指派到這個部門的所有弟子
        const workers = Player.data.sect.disciples.filter(d => d.status === department);
        workerCount = workers.length;

        if (workerCount === 0) return 0; // 沒人工作產能就是 0

        // 2. 累加性格影響
        workers.forEach(d => {
            if (!d.traits) return;

            d.traits.forEach(traitName => {
                const traitData = DATA_SECT.TRAITS[traitName];
                if (!traitData || !traitData.effect) return;
                
                const effect = traitData.effect;
                activeTraits.push(traitName); // 記錄下來，方便未來除錯或 UI 顯示

                // --- 通用產能加成 (如：卷王之王, 好吃懶做) ---
                if (effect.prod_mult) totalMultiplier *= effect.prod_mult;

                // --- 專項產能加成 ---
                if (department === 'farm' && effect.farm_mult) totalMultiplier *= effect.farm_mult;
                if (department === 'mine' && effect.mine_mult) totalMultiplier *= effect.mine_mult;
                if (department === 'alchemy' && effect.alchemy_mult) totalMultiplier *= effect.alchemy_mult;
                if (department === 'forge' && effect.forge_mult) totalMultiplier *= effect.forge_mult;

                // --- 特殊 Debuff 處理 ---
                if (effect.lazy_chance && Math.random() < effect.lazy_chance) {
                    totalMultiplier *= 0; // 偷懶了，這分鐘產出歸零
                }
            });
        });

        // 3. 處理「群體效應」性格 (如：社恐、畫餅大師)
        workers.forEach(d => {
            if (!d.traits) return;
            d.traits.forEach(traitName => {
                const effect = DATA_SECT.TRAITS[traitName]?.effect;
                if (!effect) return;

                if (effect.loner_buff && workerCount === 1) {
                    totalMultiplier *= effect.loner_buff; // 只有自己一人時發威
                }
                if (effect.crowd_debuff && workerCount > 1) {
                    totalMultiplier *= effect.crowd_debuff; // 人多就自閉
                }
                // 畫餅大師：自己產能歸零(上面已乘0)，但讓其他人產能提升
                if (effect.buff_others && workerCount > 1) {
                    totalMultiplier *= effect.buff_others;
                }
                // 卷王之王：吵死別人
                if (effect.annoy_others && workerCount > 1) {
                    totalMultiplier *= 0.8; 
                }
            });
        });

        // 確保倍率不會低於 0
        return Math.max(0, totalMultiplier);
    },

    /**
     * 結算離線收益 (對接 V3.5 資源歸一化)
     */
    processOfflineYield() {
        const wData = Player.data.world;
        const now = Date.now();
        const diffMs = now - (wData.lastCollect || now);
        const diffMinutes = Math.floor(diffMs / 60000); 

        if (diffMinutes > 0) {
            this.giveOfflineYield(diffMinutes);
            wData.lastCollect = now;
            Player.save();
        } else if (!wData.lastCollect) {
            wData.lastCollect = now;
        }
    },

    /**
     * 核心離線產出邏輯 (套用性格加成)
     * @param {number} minutes - 經過的分鐘數
     */
    giveOfflineYield(minutes) {
        const wData = Player.data.world;
        let gotCoin = 0;  // 留著給財神附體用，暫時靈礦改出玄鐵
        let gotHerb = 0;
        let gotOre = 0;

        // --- 1. 靈礦脈 (產出玄鐵) ---
        if (wData.mine && wData.mine.level > 0) {
            // 基礎：每分鐘 = 等級 * 2
            let baseYield = wData.mine.level * 2;
            // 乘上該部門弟子的性格綜合加成
            let mult = this.calculateDepartmentMultiplier('mine');
            
            gotOre = Math.floor(baseYield * mult * minutes);
            if (gotOre > 0) {
                if(!Player.data.materials) Player.data.materials = { herb:0, ore:0 };
                Player.data.materials.ore = (Player.data.materials.ore || 0) + gotOre;
            }
        }

        // --- 2. 仙草園 (產出仙草) ---
        if (wData.farm && wData.farm.level > 0) {
            // 基礎：每 10 分鐘 = 等級 (也就是每分鐘 0.1 * 等級)
            let baseYieldPerMin = (wData.farm.level * 1) / 10;
            let mult = this.calculateDepartmentMultiplier('farm');
            let totalExpected = baseYieldPerMin * mult * minutes;

            gotHerb = Math.floor(totalExpected);
            const remainder = totalExpected - gotHerb;
            if (Math.random() < remainder) gotHerb += 1;

            if (gotHerb > 0) {
                if(!Player.data.materials) Player.data.materials = { herb:0, ore:0 };
                Player.data.materials.herb = (Player.data.materials.herb || 0) + gotHerb;
            }
        }

        // --- 3. 結算財神附體 (全局被動靈石) ---
        if (Player.data.sect && Player.data.sect.disciples) {
            let passiveCoins = 0;
            Player.data.sect.disciples.forEach(d => {
                if (d.traits && d.traits.includes('財神附體')) {
                    // 財神每分鐘給 50 靈石
                    passiveCoins += 50 * minutes;
                }
                // 巨龍血脈偷錢 (每分鐘偷宗門總財產的 0.01%，離線最高結算 1440 分鐘)
                if (d.traits && d.traits.includes('巨龍血脈')) {
                    let capMinutes = Math.min(minutes, 1440); // 防爆
                    let stolen = Math.floor(Player.data.coin * 0.0001 * capMinutes);
                    Player.data.coin = Math.max(0, Player.data.coin - stolen);
                }
            });
            
            if (passiveCoins > 0) {
                gotCoin += passiveCoins;
                Player.data.coin += gotCoin;
            }
        }

        // 華麗提示
        if (gotCoin > 0 || gotHerb > 0 || gotOre > 0) {
            let msgStr = `🌌 離線 ${minutes} 分鐘，弟子為你產出：`;
            if (gotCoin > 0) msgStr += ` ${gotCoin} 靈石`;
            if (gotHerb > 0) msgStr += ` ${gotHerb} 仙草`;
            if (gotOre > 0) msgStr += ` ${gotOre} 玄鐵`;
            Msg.log(msgStr, "reward");
        }
    }
};

window.SectManager = SectManager;
