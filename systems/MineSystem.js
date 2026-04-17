/**
 * V3.6.1 MineSystem.js (萬象森羅 - 靈礦脈機緣聯動版)
 * 職責：管理鐵礦部、精算產出，並將突發機緣 (偷懶/爆擊/亡靈法師) 即時顯化於微縮視界
 * 位置：/systems/MineSystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const MineSystem = {
    init() {
        console.log("%c【MineSystem】地脈玄鐵感應中，對接微縮視界共鳴...", "color: #fbbf24; font-weight: bold;");
        window.MineSystem = this;

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
        // 1. 詞條攔截：天生反骨或拒絕勞動的人
        let hasRefuseTrait = disciple.traits.some(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            return effect && (effect.refuse_work || effect.reverse_work);
        });

        if (hasRefuseTrait) return false;
        return true;
    },

    /**
     * 🌟 輔助法陣：觸發微縮視界 (UI_Sim) 的專屬事件飄字
     */
    triggerSimBubble(discipleId, text, color = '#0f172a') {
        if (!window.UI_Sim) return;
        const bubble = document.getElementById(`bubble-${discipleId}`);
        if (bubble) {
            bubble.innerText = text;
            bubble.style.color = color;
            bubble.classList.add('sim-bubble-show');
            setTimeout(() => {
                if (bubble) {
                    bubble.classList.remove('sim-bubble-show');
                    bubble.style.color = '#0f172a'; 
                }
            }, 3500);
        }
    },

    /**
     * 精算單一弟子在礦脈的「單次產能」
     * 影響因子：體質(基礎)、匠心(深度)、機緣(尋寶)、礦脈等級(環境)、詞條(聯動)
     */
    getDiscipleYield(disciple) {
        // --- [1] 基礎產能計算 (體質決定耐力，匠心決定採礦精準度) ---
        const con = disciple.stats['體質'] || 10;
        const craft = disciple.stats['匠心'] || 10;
        const luck = disciple.stats['機緣'] || 10;
        
        // 基礎 = (體質*0.6 + 匠心*0.4) 的 25% 加上底值 (礦工比藥農辛苦，底值略低但成長高)
        let baseYield = 3 + (con * 0.6 + craft * 0.4) * 0.25; 
        
        // --- [2] 礦脈等級聯動 (讀取洞府建築等級) ---
        const mineLevel = (Player.data.world && Player.data.world.mine) ? Player.data.world.mine.level : 1;
        let levelMult = 1 + (Math.max(0, mineLevel - 1) * 0.25); // 礦脈每級加成 25%

        let multiplier = 1.0 * levelMult;
        let expGain = 3; // 挖礦勞損體力，基礎修為比種田高 1 點

        // --- [3] 靈根天賦加成 ---
        if (disciple.root === '地') multiplier *= 1.2; // 地靈根天生親和岩石
        if (disciple.root === '天') multiplier *= 1.4;
        if (disciple.root === '仙') multiplier *= 2.0;

        // --- [4] 詞條效果循環掃描 ---
        let isLazy = false;
        let isScary = false;
        let critChance = 0.03 + (luck / 1200); // 尋獲礦髓的機率

        disciple.traits.forEach(tKey => {
            let trait = DATA_SECT.TRAITS[tKey];
            if (!trait || !trait.effect) return;
            let effect = trait.effect;

            // 挖礦專屬
            if (effect.mine_mult) multiplier *= effect.mine_mult;
            // 通用產能
            if (effect.prod_mult !== undefined) multiplier *= effect.prod_mult; 
            // 修為加成
            if (effect.exp_mult) expGain *= effect.exp_mult;

            // 負面與特殊狀態
            if (effect.lazy_chance && Math.random() < effect.lazy_chance) isLazy = true;
            if (effect.scare_workers) isScary = true;
        });

        // --- [5] 事件判定與最終結果 (🌟 結合 UI_Sim 飄字) ---
        if (isLazy) {
            this.triggerSimBubble(disciple.id, "呼... 礦坑好適合睡覺", "#64748b");
            return { yield: 0, exp: 0, log: `【${disciple.name}】在礦道深處偷懶睡覺，弄得灰頭土臉卻沒挖到礦。` };
        }

        // 判定：亡靈法師特效
        let logMsg = null;
        if (isScary && Math.random() < 0.15) {
            this.triggerSimBubble(disciple.id, "起來吧！骷髏苦力！💀", "#9333ea");
            logMsg = `💀 【${disciple.name}】召喚骷髏礦工幫忙，嚇得旁邊的散修驚叫連連！`;
        }

        // 尋礦暴擊判定 (發現礦髓)
        let finalYield = baseYield * multiplier;
        if (Math.random() < critChance) {
            finalYield *= 2.5; // 礦髓暴擊倍率極高
            this.triggerSimBubble(disciple.id, "挖到極品玄鐵了！💎", "#f59e0b");
            logMsg = `💎 【${disciple.name}】挖掘到了一塊極品玄鐵礦髓，產量大爆發！`;
        }

        return {
            yield: Math.floor(finalYield),
            exp: Math.floor(expGain),
            log: logMsg
        };
    },

    /**
     * 🌟 V3.4 核心：結算整個靈礦脈產出
     * @param {number} externalMult - 由 Core 傳入的環境事件倍率 (例如：地脈雷動)
     */
    processTick(externalMult = 1.0) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return 0;

        let totalOre = 0;
        let mineWorkers = Player.data.sect.disciples.filter(d => d.status === 'mine');

        if (mineWorkers.length === 0) return 0;

        mineWorkers.forEach(d => {
            let result = this.getDiscipleYield(d);
            
            // 🌟 套用外部天象倍率
            let actualYield = Math.floor(result.yield * externalMult);
            totalOre += actualYield;
            
            // 勞動即修行，經驗反哺
            if (result.exp > 0 && window.SectSystem) {
                window.SectSystem.gainExp(d.id, result.exp);
            }

            // 特殊事件播報
            if (result.log) Msg.log(result.log, "system");
        });

        // 🌟 資源入庫與自動保存
        if (totalOre > 0) {
            if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
            Player.data.materials.ore = (Player.data.materials.ore || 0) + totalOre;
            
            if (Player.save) Player.save();
            else if (window.Player && window.Player.save) window.Player.save();
        }

        // 回傳真實入庫數字給 Core
        return totalOre; 
    }
};

window.MineSystem = MineSystem;
