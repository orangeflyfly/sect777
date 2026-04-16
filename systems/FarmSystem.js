/**
 * V3.2 FarmSystem.js (仙草園大腦 - 團隊光環與境界聯動版)
 * 職責：管理仙草園工作門檻、計算弟子產出、處理【團隊詞條聯動】與修為增長
 * 位置：/systems/FarmSystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const FarmSystem = {
    // 🟢 仙草園專屬靈根門檻 (只有這些靈根能感應草木靈氣)
    ALLOWED_ROOTS: ['水', '木', '天', '仙'],

    init() {
        console.log("【FarmSystem】仙草園大腦啟動，草木靈氣與團隊光環開始匯聚...");
        if (!Player.data.materials) {
            Player.data.materials = { herb: 0, ore: 0 }; // 預設素材庫
        }
    },

    /**
     * 判定弟子是否具備進入仙草園的資格
     */
    canWork(disciple) {
        // 1. 靈根檢測
        if (!this.ALLOWED_ROOTS.includes(disciple.root)) return false;
        
        // 2. 奇葩詞條檢測 (例如：武痴拒絕工作、天生反骨不能去)
        let hasRefuseTrait = disciple.traits.some(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            return effect && (effect.refuse_work || effect.reverse_work);
        });

        if (hasRefuseTrait) return false;

        return true;
    },

    /**
     * 精算單一弟子在仙草園的「單次產能」與「獲得修為」
     * @param {Object} disciple - 弟子資料
     * @param {Object} teamContext - 團隊環境參數 (V3.2 新增)
     */
    getDiscipleYield(disciple, teamContext = { workerCount: 1, buffOthersMult: 1.0, annoyOthersMult: 1.0 }) {
        // 基礎產出：體質越好，越能幹粗活
        let baseYield = 5 + Math.floor((disciple.stats['體質'] || 10) / 10); 
        let multiplier = 1.0;
        let expGain = 2; // 每次工作基礎獲得 2 點修為

        // 🌟 靈根先天威壓加成
        if (disciple.root === '天') multiplier *= 1.2;
        if (disciple.root === '仙') multiplier *= 1.5;

        let isLazy = false;
        let explode = false;
        let isBuffer = false;
        let isAnnoying = false;

        // 🌟 自動疊加所有相關詞條加成
        disciple.traits.forEach(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            if (!effect) return;

            // 標記自身是否為團隊光環散發者
            if (effect.buff_others) isBuffer = true;
            if (effect.annoy_others) isAnnoying = true;

            // 草木專屬加成
            if (effect.farm_mult) multiplier *= effect.farm_mult;
            // 通用產能加成
            if (effect.prod_mult !== undefined) multiplier *= effect.prod_mult; // 包含 0 的情況(畫餅大師)
            // 修為獲取加成
            if (effect.exp_mult) expGain *= effect.exp_mult;

            // 人數環境判定 (V3.2 社恐機制)
            if (effect.loner_buff && teamContext.workerCount === 1) multiplier *= effect.loner_buff;
            if (effect.crowd_debuff && teamContext.workerCount > 1) multiplier *= effect.crowd_debuff;

            // 負面/惡搞機率判定
            if (effect.lazy_chance && Math.random() < effect.lazy_chance) isLazy = true;
            if (effect.explode_chance && Math.random() < effect.explode_chance) explode = true;
        });

        // 🌟 承受團隊光環 (不是自己發出的才承受)
        if (!isBuffer) multiplier *= teamContext.buffOthersMult;
        if (!isAnnoying) multiplier *= teamContext.annoyOthersMult;

        // 判定：被迫營業睡著了
        if (isLazy) {
            return { yield: 0, exp: 0, log: `【${disciple.name}】在仙草園偷睡覺，毫無產出！` };
        }

        // 判定：鍊金狂人把草炸了
        if (explode) {
            return { yield: 0, exp: Math.floor(expGain * 0.5), log: `💥 轟！【${disciple.name}】把一株稀有仙草煉炸了！` };
        }

        return {
            yield: Math.floor(baseYield * multiplier),
            exp: Math.floor(expGain),
            log: null // 正常運作不刷屏
        };
    },

    /**
     * 結算整個仙草園的總產出 (可由 MainLoop 每分鐘呼叫一次)
     */
    processTick() {
        if (!Player.data.sect || !Player.data.sect.disciples) return;

        let totalHerb = 0;

        // 篩選出目前在仙草園工作的弟子
        let farmWorkers = Player.data.sect.disciples.filter(d => d.status === 'farm');
        let workerCount = farmWorkers.length;

        if (workerCount === 0) return 0;

        // 🟢 V3.2 團隊環境解析 (先掃描一圈，收集所有光環)
        let teamBuffMult = 1.0;
        let teamAnnoyMult = 1.0;
        let bufferNames = [];

        farmWorkers.forEach(d => {
            d.traits.forEach(tKey => {
                let effect = DATA_SECT.TRAITS[tKey]?.effect;
                if (!effect) return;
                
                // 畫餅大師：提升全體 20%
                if (effect.buff_others) {
                    teamBuffMult *= effect.buff_others;
                    if (!bufferNames.includes(d.name)) bufferNames.push(d.name);
                }
                // 卷王之王：降低全體 10% (因為太吵或給人壓力)
                if (effect.annoy_others) {
                    teamAnnoyMult *= 0.9; 
                }
            });
        });

        // 偶爾播報一下畫餅大師的功勞
        if (bufferNames.length > 0 && Math.random() < 0.1) {
            Msg.log(`🗣️ 【${bufferNames.join('、')}】正在仙草園畫大餅，其他藥農像打了雞血一樣效率大增！`, "system");
        }

        let teamContext = {
            workerCount: workerCount,
            buffOthersMult: teamBuffMult,
            annoyOthersMult: teamAnnoyMult
        };

        // 🟢 正式結算產出與修為
        farmWorkers.forEach(d => {
            let result = this.getDiscipleYield(d, teamContext);
            totalHerb += result.yield;
            
            // 勞動即修行，呼叫宗門大腦統一處理升級與戰力反哺
            if (result.exp > 0 && window.SectSystem && window.SectSystem.gainExp) {
                window.SectSystem.gainExp(d.id, result.exp);
            }

            // 特殊事件播報
            if (result.log) Msg.log(result.log, "system");
        });

        // 將產出存入宗門庫房
        if (totalHerb > 0) {
            if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
            Player.data.materials.herb += totalHerb;
        }

        if (Player.save) Player.save();
        
        return totalHerb; 
    }
};

window.FarmSystem = FarmSystem;
