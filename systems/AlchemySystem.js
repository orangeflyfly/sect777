/**
 * V3.4 AlchemySystem.js (萬象森羅 - 煉丹閣大腦)
 * 職責：管理煉丹師指派、消耗仙草、機率產出丹藥、處理炸爐事件
 * 位置：/systems/AlchemySystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const AlchemySystem = {
    // 🟢 煉丹專屬靈根：火生丹、木生草
    ALLOWED_ROOTS: ['火', '木', '天', '仙'],

    // 🟢 丹藥配方與消耗
    RECIPES: {
        '修為丹': { cost: 15, expBoost: 50, desc: '增加主角修為' },
        '療傷藥': { cost: 10, heal: 100, desc: '歷練中恢復生命' }
    },

    init() {
        console.log("%c【AlchemySystem】煉丹閣地火已點燃，準備開爐...", "color: #ef4444; font-weight: bold;");
        window.AlchemySystem = this;

        // 確保玩家有背包系統來放丹藥
        if (!Player.data.inventory) Player.data.inventory = {};
    },

    /**
     * 判定弟子是否具備煉丹資格
     */
    canWork(disciple) {
        if (!this.ALLOWED_ROOTS.includes(disciple.root)) return false;
        
        let hasRefuseTrait = disciple.traits.some(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            return effect && (effect.refuse_work || effect.reverse_work);
        });

        if (hasRefuseTrait) return false;
        return true;
    },

    /**
     * 計算單一煉丹師的煉製結果 (每分鐘判定一次)
     * 回傳：{ costHerb: 消耗量, itemGained: 獲得物品名, amount: 數量, log: 播報訊息 }
     */
    craft(disciple, externalMult = 1.0) {
        const int = disciple.stats['悟性'] || 10;
        const craft = disciple.stats['匠心'] || 10;
        const luck = disciple.stats['機緣'] || 10;

        // 煉丹基礎成功率：悟性決定
        let successRate = 0.5 + (int / 200); 
        let explodeRate = 0.05 - (craft / 500); // 匠心越高越不容易炸爐
        if (explodeRate < 0.01) explodeRate = 0.01;

        // 天賦與詞條修正
        if (disciple.root === '火') successRate += 0.1;
        if (disciple.root === '天' || disciple.root === '仙') successRate += 0.2;

        let multiplier = 1.0;
        disciple.traits.forEach(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            if (!effect) return;
            if (effect.prod_mult) multiplier *= effect.prod_mult;
            if (effect.explode_chance) explodeRate += effect.explode_chance;
        });

        multiplier *= externalMult;

        // --- 判定開始 ---
        // 1. 炸爐判定
        if (Math.random() < explodeRate) {
            return { costHerb: 5, itemGained: null, amount: 0, log: `💥 轟隆！【${disciple.name}】火候失控，炸爐了！損失了 5 株仙草。` };
        }

        // 2. 成功判定
        if (Math.random() < successRate) {
            // 隨機決定煉出修為丹還是療傷藥 (初期簡化，各 50% 機率)
            const isExpPill = Math.random() < 0.5;
            const targetPill = isExpPill ? '修為丹' : '療傷藥';
            const recipe = this.RECIPES[targetPill];

            // 機緣暴擊判定：一次煉出兩顆
            let amount = 1;
            if (Math.random() < (0.05 + luck / 1000)) amount = 2;
            
            // 套用外部與詞條產能倍率 (這裡影響的是「節省材料」或「額外成丹」的機率，為簡化先直接乘數量)
            amount = Math.max(1, Math.floor(amount * multiplier));

            return { 
                costHerb: recipe.cost, 
                itemGained: targetPill, 
                amount: amount, 
                log: amount > 1 ? `✨【${disciple.name}】丹心通明，一爐煉出了 ${amount} 顆 ${targetPill}！` : null 
            };
        } else {
            // 3. 失敗判定 (變成一攤黑灰)
            return { costHerb: 2, itemGained: null, amount: 0, log: null }; // 默默失敗，消耗少量藥材
        }
    },

    /**
     * 天道結算：處理整個煉丹閣的產出與扣除
     */
    processTick(externalMult = 1.0) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return;
        if (!Player.data.materials || Player.data.materials.herb <= 0) return; // 沒仙草就不開爐

        let alchemists = Player.data.sect.disciples.filter(d => d.status === 'alchemy');
        if (alchemists.length === 0) return
