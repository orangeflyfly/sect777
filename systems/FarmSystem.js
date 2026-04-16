/**
 * V2.9 FarmSystem.js (仙草園大腦)
 * 職責：管理仙草園的工作門檻、計算弟子產出、處理詞條聯動與修為增長
 * 位置：/systems/FarmSystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const FarmSystem = {
    // 🟢 仙草園專屬靈根門檻 (只有這些靈根能感應草木靈氣)
    ALLOWED_ROOTS: ['水', '木', '天', '仙'],

    init() {
        console.log("【FarmSystem】仙草園大腦啟動，草木靈氣開始匯聚...");
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
     */
    getDiscipleYield(disciple) {
        // 基礎產出：體質越好，越能幹粗活 (假設體質 50，基礎值就是 10)
        let baseYield = 5 + Math.floor((disciple.stats['體質'] || 10) / 10); 
        let multiplier = 1.0;
        let expGain = 2; // 每次工作基礎獲得 2 點修為

        // 🌟 靈根先天威壓加成
        if (disciple.root === '天') multiplier *= 1.2;
        if (disciple.root === '仙') multiplier *= 1.5;

        let isLazy = false;
        let explode = false;

        // 🌟 自動疊加所有相關詞條加成 (包含草木專屬、通用產能、經驗加成)
        disciple.traits.forEach(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            if (!effect) return;

            // 草木專屬加成 (例如：精靈之眷 1.8倍、德魯伊之友 1.3倍、農夫 1.2倍)
            if (effect.farm_mult) multiplier *= effect.farm_mult;
            
            // 通用產能加成 (例如：卷王之王 1.5倍、好吃懶做 0.8倍)
            if (effect.prod_mult) multiplier *= effect.prod_mult;
            
            // 修為獲取加成 (例如：悟性驚人、退婚流主角)
            if (effect.exp_mult) expGain *= effect.exp_mult;

            // 負面/惡搞機率判定
            if (effect.lazy_chance && Math.random() < effect.lazy_chance) isLazy = true;
            if (effect.explode_chance && Math.random() < effect.explode_chance) explode = true;
        });

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
        let levelUps = []; // 紀錄誰升級了

        // 篩選出目前在仙草園工作的弟子
        let farmWorkers = Player.data.sect.disciples.filter(d => d.status === 'farm');

        farmWorkers.forEach(d => {
            let result = this.getDiscipleYield(d);
            totalHerb += result.yield;
            
            // 勞動即修行：增加經驗值
            if (result.exp > 0) {
                d.exp += result.exp;
                // 簡單升級判定 (假設每 100 經驗升 1 級)
                let needExp = d.level * 100;
                if (d.exp >= needExp) {
                    d.level++;
                    d.exp -= needExp;
                    d.stats['戰力'] += 5; // 升級增加一點基礎屬性
                    d.stats['體質'] += 2;
                    levelUps.push(d.name);
                }
            }

            // 特殊事件播報
            if (result.log) Msg.log(result.log, "system");
        });

        // 將產出存入宗門庫房
        if (totalHerb > 0) {
            if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
            Player.data.materials.herb += totalHerb;
        }

        // 若有人升級，發送通知
        if (levelUps.length > 0) {
            Msg.log(`✨ 經過仙草園的辛勤勞作，【${levelUps.join('、')}】境界突破了！`, "gold");
        }

        // 存檔
        if (Player.save) Player.save();
        
        return totalHerb; // 回傳給介面顯示
    }
};
