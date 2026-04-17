/**
 * V3.5.1 AlchemySystem.js (萬象森羅 - 丹道屬性對接版)
 * 職責：管理煉丹師指派、消耗仙草、機率產出丹藥、處理炸爐事件
 * 修正：將判定邏輯由 root(資質) 全面更換為 element(五行屬性)
 * 位置：/systems/AlchemySystem.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const AlchemySystem = {
    // 🌟 核心修正：煉丹閣准入五行屬性 (火生丹、木生火、天/仙為造化)
    ALLOWED_ELEMENTS: ['火', '木', '天', '仙'],

    // 🟢 丹藥配方與消耗 (未來可擴充至 JSON 數據庫)
    RECIPES: {
        '修為丹': { cost: 15, expBoost: 50, desc: '增加主角修為' },
        '療傷藥': { cost: 10, heal: 100, desc: '歷練中恢復生命' }
    },

    init() {
        console.log("%c【AlchemySystem】煉丹閣地火重燃，屬性共鳴陣法開啟...", "color: #ef4444; font-weight: bold;");
        window.AlchemySystem = this;

        // 確保玩家數據結構完整，以便存放成品
        if (!Player.data.inventory) {
            Player.data.inventory = {};
        }
    },

    /**
     * 判定弟子是否具備煉丹資格
     * 🌟 優化：檢查 element(五行) 欄位而非 root(資質)
     */
    canWork(disciple) {
        // 若弟子尚未覺醒五行屬性(舊存檔)，由 SectSystem 自動補齊前不予指派
        if (!disciple.element) return false;

        // 只有 火、木、天、仙 屬性弟子可操控煉丹爐
        if (!this.ALLOWED_ELEMENTS.includes(disciple.element)) return false;
        
        // 檢查性格詞條：是否有「懶惰」或「反社會」等不參與工作的效果
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

        // 1. 基礎成功率：由【悟性】決定
        let successRate = 0.5 + (int / 200); 
        
        // 2. 基礎炸爐率：由【匠心】決定 (越高越穩)
        let explodeRate = 0.05 - (craft / 500); 
        if (explodeRate < 0.01) explodeRate = 0.01;

        // 🌟 3. 五行屬性修正 (優化：不再讀取資質 root)
        let multiplier = 1.0;

        if (disciple.element === '火') {
            successRate += 0.12; // 火靈根控火更精準，成功率提升
        }
        if (disciple.element === '木') {
            multiplier *= 1.15;   // 木靈根藥性親和，產能提升
        }
        if (disciple.element === '天' || disciple.element === '仙') {
            successRate += 0.20; // 天級、仙級靈根全方位加成
            multiplier *= 1.25;
        }

        // 4. 性格詞條修正
        disciple.traits.forEach(tKey => {
            let effect = DATA_SECT.TRAITS[tKey]?.effect;
            if (!effect) return;
            if (effect.prod_mult) multiplier *= effect.prod_mult;
            if (effect.explode_chance) explodeRate += effect.explode_chance;
        });

        // 套用全域環境倍率 (如紫氣東來事件)
        multiplier *= externalMult;

        // --- 判定流程 ---

        // A. 炸爐判定 (最優先判定，炸了就直接扣料並結束)
        if (Math.random() < explodeRate) {
            return { 
                costHerb: 5, 
                itemGained: null, 
                amount: 0, 
                log: `💥 轟隆！【${disciple.name}】爐溫失控，炸爐了！損失了 5 株仙草。` 
            };
        }

        // B. 成功判定
        if (Math.random() < successRate) {
            // 目前 50/50 決定煉製種類
            const isExpPill = Math.random() < 0.5;
            const targetPill = isExpPill ? '修為丹' : '療傷藥';
            const recipe = this.RECIPES[targetPill];

            // 機緣暴擊判定 (決定基礎成丹數)
            let amount = 1;
            if (Math.random() < (0.05 + luck / 1000)) amount = 2;
            
            // 套用最終產能乘率 (含木靈根與詞條加成)
            amount = Math.max(1, Math.floor(amount * multiplier));

            return { 
                costHerb: recipe.cost, 
                itemGained: targetPill, 
                amount: amount, 
                log: amount > 1 ? `✨【${disciple.name}】丹成龍虎現！一爐煉出了 ${amount} 顆 ${targetPill}！` : null 
            };
        } else {
            // C. 失敗判定 (消耗少量藥材，變成廢渣)
            return { 
                costHerb: 3, 
                itemGained: null, 
                amount: 0, 
                log: null 
            }; 
        }
    },

    /**
     * 天道結算：處理整個煉丹閣的產出與消耗
     * @param {number} externalMult - 全域產能倍率
     */
    processTick(externalMult = 1.0) {
        // 基礎數據驗證
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return;
        
        // 判定仙草剩餘量，若沒材料則煉丹閣自動熄火
        if (!Player.data.materials || (Player.data.materials.herb || 0) <= 0) {
            return; 
        }

        // 篩選正在工作中的煉丹師
        let alchemists = Player.data.sect.disciples.filter(d => d.status === 'alchemy');
        if (alchemists.length === 0) return;

        let totalHerbCost = 0;
        let gainedItems = {};

        alchemists.forEach(d => {
            // 每次指派前二次檢查材料，若當前結算週期剩餘材料不足以開爐則跳過該弟子
            if ((Player.data.materials.herb || 0) - totalHerbCost < 15) return; 

            // 執行單人煉丹邏輯
            let result = this.craft(d, externalMult);
            totalHerbCost += result.costHerb;

            // 收集產出的丹藥
            if (result.itemGained && result.amount > 0) {
                if (!gainedItems[result.itemGained]) gainedItems[result.itemGained] = 0;
                gainedItems[result.itemGained] += result.amount;
            }

            // 播報特殊事件 (炸爐或暴擊)
            if (result.log) Msg.log(result.log, "system");
        });

        // --- 最終結算存檔 ---

        // 1. 扣除總消耗仙草
        if (totalHerbCost > 0) {
            Player.data.materials.herb = Math.max(0, (Player.data.materials.herb || 0) - totalHerbCost);
        }

        // 2. 將成品丹藥存入玩家背包 (inventory)
        let summaryLogs = [];
        for (let item in gainedItems) {
            if (!Player.data.inventory[item]) Player.data.inventory[item] = 0;
            Player.data.inventory[item] += gainedItems[item];
            summaryLogs.push(`💊 ${item} +${gainedItems[item]}`);
        }

        // 3. 控制台輸出詳情 (供開發者查驗)
        if (summaryLogs.length > 0) {
            console.log(`%c[丹道結算] 本週期消耗仙草 -${totalHerbCost} | 收穫：${summaryLogs.join(' | ')}`, "color: #ef4444; font-weight: bold;");
        }

        // 4. 存檔入玉簡
        Player.save();
    }
};

// 掛載至 window
window.AlchemySystem = AlchemySystem;
