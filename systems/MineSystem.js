/**
 * V3.4 FarmSystem.js (萬象森羅 - 終極產能大腦)
 * 職責：管理仙草園門檻、精算【洞府等級+個人屬性+團隊光環+外部天象】產出
 * 位置：/systems/FarmSystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const FarmSystem = {
    // 🟢 仙草園專屬靈根門檻
    ALLOWED_ROOTS: ['水', '木', '天', '仙'],

    init() {
        console.log("%c【FarmSystem】仙草園大陣啟動，對接全模組共鳴...", "color: #4ade80; font-weight: bold;");
        window.FarmSystem = this;

        if (!Player.data.materials) {
            Player.data.materials = { herb: 0, ore: 0 };
        }
    },

    /**
     * 判定弟子是否具備進入仙草園的資格
     */
    canWork(disciple) {
        // 1. 靈根檢測
        if (!this.ALLOWED_ROOTS.includes(disciple.root)) return false;
        
        // 2. 詞條攔截：天生反骨或拒絕勞動的人
        let hasRefuseTrait = disciple.traits.some(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            return effect && (effect.refuse_work || effect.reverse_work);
        });

        if (hasRefuseTrait) return false;
        return true;
    },

    /**
     * 精算單一弟子在仙草園的「單次產能」
     */
    getDiscipleYield(disciple, teamContext = { workerCount: 1, buffOthersMult: 1.0, annoyOthersMult: 1.0 }) {
        // --- [1] 基礎產能計算 (體質與匠心影響) ---
        const con = disciple.stats['體質'] || 10;
        const craft = disciple.stats['匠心'] || 10;
        const luck = disciple.stats['機緣'] || 10;
        
        let baseYield = 5 + (con * 0.5 + craft * 0.5) * 0.2; 
        
        // --- [2] 洞府等級聯動 ---
        const farmLevel = (Player.data.world && Player.data.world.farm) ? Player.data.world.farm.level : 1;
        let levelMult = 1 + (Math.max(0, farmLevel - 1) * 0.2);

        let multiplier = 1.0 * levelMult;
        let expGain = 2; 

        // --- [3] 靈根天賦加成 ---
        if (disciple.root === '天') multiplier *= 1.3;
        if (disciple.root === '仙') multiplier *= 1.8;

        // --- [4] 詞條效果循環掃描 ---
        let isLazy = false;
        let explode = false;
        let isBuffer = false;
        let isAnnoying = false;
        let critChance = 0.05 + (luck / 1000); 

        disciple.traits.forEach(tKey => {
            let trait = DATA_SECT.TRAITS[tKey];
            if (!trait || !trait.effect) return;
            let effect = trait.effect;

            if (effect.buff_others) isBuffer = true;
            if (effect.annoy_others) isAnnoying = true;
            if (effect.farm_mult) multiplier *= effect.farm_mult;
            if (effect.prod_mult !== undefined) multiplier *= effect.prod_mult; 
            if (effect.exp_mult) expGain *= effect.exp_mult;

            if (effect.loner_buff && teamContext.workerCount === 1) multiplier *= effect.loner_buff;
            if (effect.crowd_debuff && teamContext.workerCount > 1) multiplier *= effect.crowd_debuff;

            if (effect.lazy_chance && Math.random() < effect.lazy_chance) isLazy = true;
            if (effect.explode_chance && Math.random() < effect.explode_chance) explode = true;
        });

        // --- [5] 團隊光環影響 ---
        if (!isBuffer) multiplier *= teamContext.buffOthersMult;
        if (!isAnnoying) multiplier *= teamContext.annoyOthersMult;

        // --- [6] 事件判定與最終結果 ---
        if (isLazy) return { yield: 0, exp: 0, log: `【${disciple.name}】在仙草園偷睡覺，一株草都沒拔...` };
        
        if (explode) {
            return { 
                yield: 0, 
                exp: Math.floor(expGain * 0.5), 
                log: `💥 慘劇！【${disciple.name}】採集時靈力失控，把仙草煉炸了！` 
            };
        }

        let finalYield = baseYield * multiplier;
        let isCrit = Math.random() < critChance;
        if (isCrit) finalYield *= 2;

        return {
            yield: Math.floor(finalYield),
            exp: Math.floor(expGain),
            log: isCrit ? `✨【${disciple.name}】機緣爆發，採集到了雙倍的仙草精華！` : null
        };
    },

    /**
     * 🌟 V3.4 重點：結算整個仙草園產出
     * @param {number} externalMult - 由 Core 傳入的環境事件倍率 (預設 1.0)
     */
    processTick(externalMult = 1.0) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return 0;

        let totalHerb = 0;
        let farmWorkers = Player.data.sect.disciples.filter(d => d.status === 'farm');
        let workerCount = farmWorkers.length;

        if (workerCount === 0) return 0;

        // --- 團隊環境掃描 ---
        let teamBuffMult = 1.0;
        let teamAnnoyMult = 1.0;
        let bufferNames = [];

        farmWorkers.forEach(d => {
            d.traits.forEach(tKey => {
                let effect = DATA_SECT.TRAITS[tKey]?.effect;
                if (effect) {
                    if (effect.buff_others) {
                        teamBuffMult *= effect.buff_others;
                        if (!bufferNames.includes(d.name)) bufferNames.push(d.name);
                    }
                    if (effect.annoy_others) teamAnnoyMult *= 0.9; 
                }
            });
        });

        if (bufferNames.length > 0 && Math.random() < 0.2) {
            Msg.log(`🗣️ 【${bufferNames.join('、')}】正在仙草園畫大餅，眾弟子效率提升！`, "system");
        }

        let teamContext = { workerCount, buffOthersMult: teamBuffMult, annoyOthersMult: teamAnnoyMult };

        // --- 計算個人產出並套用外部倍率 ---
        farmWorkers.forEach(d => {
            let result = this.getDiscipleYield(d, teamContext);
            
            // 🌟 核心修正：在此乘上由天道(Core)傳入的外部倍率
            let actualYield = Math.floor(result.yield * externalMult);
            totalHerb += actualYield;
            
            // 修為反哺
            if (result.exp > 0 && window.SectSystem) {
                window.SectSystem.gainExp(d.id, result.exp);
            }

            if (result.log) Msg.log(result.log, "system");
        });

        // --- 資源入庫與自動保存 ---
        if (totalHerb > 0) {
            if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
            Player.data.materials.herb = (Player.data.materials.herb || 0) + totalHerb;
            
            if (Player.save) Player.save();
            else if (window.Player && window.Player.save) window.Player.save();
        }

        // 回傳真實入庫的總數，讓 Core 播報時數字一致
        return totalHerb; 
    }
};

window.FarmSystem = FarmSystem;
