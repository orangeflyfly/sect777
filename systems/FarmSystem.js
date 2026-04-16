/**
 * V2.9 FarmSystem.js (仙草園大腦)
 * 職責：管理仙草園工作門檻、計算弟子產出、處理詞條聯動與修為增長
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const FarmSystem = {
    // 🟢 仙草園門檻：只有水、木、天、仙靈根能與草木共鳴
    ALLOWED_ROOTS: ['水', '木', '天', '仙'],

    init() {
        console.log("【FarmSystem】仙草園靈氣匯聚，大腦初始化完畢。");
        // 初始化材料庫
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
        
        // 2. 懶人或反骨檢測
        const hasBadTrait = disciple.traits.some(tKey => {
            const effect = DATA_SECT.TRAITS[tKey]?.effect;
            return effect && (effect.refuse_work || effect.reverse_work);
        });

        return !hasBadTrait;
    },

    /**
     * 計算單一弟子產能
     */
    getDiscipleYield(disciple) {
        // 基礎產出受「體質」影響 (每 10 點體質基礎產出 +1)
        let baseYield = 5 + Math.floor((disciple.stats['體質'] || 10) / 10);
        let multiplier = 1.0;
        let expGain = 2; // 基礎勞動經驗

        // 🌟 靈根先天加成
        if (disciple.root === '天') multiplier *= 1.2;
        if (disciple.root === '仙') multiplier *= 1.5;

        let eventLog = null;

        // 🌟 自動疊加詞條效果
        disciple.traits.forEach(tKey => {
            const effect = DATA_SECT.TRAITS[tKey]?.effect;
            if (!effect) return;

            // 草木類詞條 (farm_mult)
            if (effect.farm_mult) multiplier *= effect.farm_mult;
            // 通用產能 (prod_mult)
            if (effect.prod_mult) multiplier *= effect.prod_mult;
            // 修為加成 (exp_mult)
            if (effect.exp_mult) expGain *= effect.exp_mult;

            // 特殊事件判定
            if (effect.lazy_chance && Math.random() < effect.lazy_chance) {
                multiplier = 0;
                eventLog = `【${disciple.name}】在仙草園偷睡覺，毫無產出！`;
            }
            if (effect.explode_chance && Math.random() < effect.explode_chance) {
                multiplier = 0;
                eventLog = `💥 轟！【${disciple.name}】把仙草煉炸了！`;
            }
        });

        return {
            yield: Math.floor(baseYield * multiplier),
            exp: Math.floor(expGain),
            log: eventLog
        };
    },

    /**
     * 定期結算 (每分鐘或每週期呼叫)
     */
    processTick() {
        if (!Player.data.sect?.disciples) return;

        let totalHerb = 0;
        const farmWorkers = Player.data.sect.disciples.filter(d => d.status === 'farm');

        farmWorkers.forEach(d => {
            const result = this.getDiscipleYield(d);
            totalHerb += result.yield;
            
            // 勞動即修行：獲取經驗與升級
            if (result.exp > 0) {
                d.exp += result.exp;
                const nextLevelExp = d.level * 100;
                if (d.exp >= nextLevelExp) {
                    d.level++;
                    d.exp -= nextLevelExp;
                    d.stats['戰力'] += 5;
                    d.stats['體質'] += 2;
                    Msg.log(`✨【${d.name}】在勞動中感悟天地，境界提升至 Lv.${d.level}！`, "gold");
                }
            }

            if (result.log) Msg.log(result.log, "system");
        });

        if (totalHerb > 0) {
            Player.data.materials.herb += totalHerb;
            // 連動更新 UI (如果有 Core)
            if (window.Core?.updateUI) window.Core.updateUI();
        }

        if (Player.save) Player.save();
        return totalHerb;
    }
};
