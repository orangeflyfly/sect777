/**
 * V3.1 MineSystem.js (靈礦脈大腦)
 * 職責：管理鐵礦部的工作門檻、計算玄鐵產出、處理詞條聯動與修為增長
 * 位置：/systems/MineSystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const MineSystem = {
    init() {
        console.log("【MineSystem】靈礦脈大腦啟動，地脈玄鐵開始凝結...");
        if (!Player.data.materials) {
            Player.data.materials = { herb: 0, ore: 0 };
        }
        if (Player.data.materials.ore === undefined) {
            Player.data.materials.ore = 0;
        }
    },

    /**
     * 判定弟子是否具備下礦資格
     */
    canWork(disciple) {
        // 挖礦是苦力活，體質太差（小於 15）且沒有特殊加成的人不建議下礦
        // 但為了遊戲流暢，我們先只攔截「拒絕工作」的心魔詞條
        let hasRefuseTrait = disciple.traits.some(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            return effect && (effect.refuse_work || effect.reverse_work);
        });

        if (hasRefuseTrait) return false;

        return true;
    },

    /**
     * 精算單一弟子在礦脈的「單次產能」與「獲得修為」
     */
    getDiscipleYield(disciple) {
        // 基礎產出：體質與匠心的綜合考量 (挖礦需要力氣，也需要找礦脈的眼光)
        let con = disciple.stats['體質'] || 10;
        let craft = disciple.stats['匠心'] || 10;
        let baseYield = 3 + Math.floor((con * 0.6 + craft * 0.4) / 10); 
        
        let multiplier = 1.0;
        let expGain = 3; // 挖礦比較累，基礎修為給 3 點 (比種田多 1)

        // 靈根加成
        if (disciple.root === '地') multiplier *= 1.2; // 地靈根親和岩石
        if (disciple.root === '天') multiplier *= 1.3;
        if (disciple.root === '仙') multiplier *= 1.6;

        let isLazy = false;
        let isScary = false;

        // 🌟 自動疊加所有相關詞條加成
        disciple.traits.forEach(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            if (!effect) return;

            // 挖礦專屬加成 (如：尋脈點穴、黃金礦工、亡靈法師)
            if (effect.mine_mult) multiplier *= effect.mine_mult;
            
            // 通用產能與經驗加成
            if (effect.prod_mult) multiplier *= effect.prod_mult;
            if (effect.exp_mult) expGain *= effect.exp_mult;

            // 特殊事件判定
            if (effect.lazy_chance && Math.random() < effect.lazy_chance) isLazy = true;
            if (effect.scare_workers) isScary = true;
        });

        if (isLazy) {
            return { yield: 0, exp: 0, log: `【${disciple.name}】在礦坑角落偷懶睡大覺，毫無產出！` };
        }

        let yieldResult = Math.floor(baseYield * multiplier);
        let logMsg = null;

        if (isScary && Math.random() < 0.2) {
            logMsg = `💀 【${disciple.name}】驅使骷髏挖礦，雖然產量大增，但把隔壁礦道的散修嚇暈了！`;
        }

        return {
            yield: yieldResult,
            exp: Math.floor(expGain),
            log: logMsg
        };
    },

    /**
     * 結算整個靈礦脈的總產出 (由 MainLoop 呼叫)
     */
    processTick() {
        if (!Player.data.sect || !Player.data.sect.disciples) return 0;

        let totalOre = 0;
        let mineWorkers = Player.data.sect.disciples.filter(d => d.status === 'mine');

        mineWorkers.forEach(d => {
            let result = this.getDiscipleYield(d);
            totalOre += result.yield;
            
            // 勞動即修行，呼叫宗門大腦統一處理升級
            if (result.exp > 0 && window.SectSystem && window.SectSystem.gainExp) {
                window.SectSystem.gainExp(d.id, result.exp);
            }

            // 特殊事件播報
            if (result.log) Msg.log(result.log, "system");
        });

        // 將產出存入宗門庫房
        if (totalOre > 0) {
            if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
            Player.data.materials.ore = (Player.data.materials.ore || 0) + totalOre;
        }

        if (Player.save) Player.save();
        
        return totalOre; 
    }
};

window.MineSystem = MineSystem;
