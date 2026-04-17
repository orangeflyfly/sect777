/**
 * V3.5.6 ForgeSystem.js (煉器與強化總綱 - 儲物空間修復版)
 * 職責：處理玄鐵鍛造(抽卡)、千錘百鍊保底、裝備+1~+10強化、毀損判定
 * 修正：裝備正式存入 Player.data.equipments 專屬陣列，避免與丹藥字典衝突
 * 位置：/systems/ForgeSystem.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const ForgeSystem = {
    // 鍛造消耗：每把 50 玄鐵
    FORGE_COST: 50,
    
    // 強化成功率與風險表 (索引 0 代表 +1)
    // rate: 成功率, loseLevel: 失敗是否掉級, break: 失敗是否毀損
    ENHANCE_TABLE: [
        { rate: 1.0, lose: false, break: false }, // +1
        { rate: 0.9, lose: false, break: false }, // +2
        { rate: 0.8, lose: false, break: false }, // +3
        { rate: 0.7, lose: false, break: false }, // +4
        { rate: 0.6, lose: false, break: false }, // +5
        { rate: 0.5, lose: true,  break: false }, // +6 (失敗掉1級)
        { rate: 0.4, lose: true,  break: false }, // +7
        { rate: 0.3, lose: true,  break: true  }, // +8 (開始有機率毀損!)
        { rate: 0.2, lose: true,  break: true  }, // +9
        { rate: 0.1, lose: true,  break: true  }  // +10 (登峰造極)
    ],

    init() {
        console.log("%c【ForgeSystem】煉器大殿爐火已旺，天道強化法則與獨立儲物空間建立。", "color: #fb923c; font-weight: bold;");
        window.ForgeSystem = this;

        if (!Player.data.forge) {
            Player.data.forge = {
                pityCount: 0,      // 千錘百鍊保底進度
                totalForged: 0     // 總鍛造次數
            };
        }
        // 🌟 確保玩家擁有裝備專屬空間
        if (!Player.data.equipments) {
            Player.data.equipments = [];
        }
    },

    /**
     * 1. 鍛造神兵 (抽卡模式)
     */
    doForge(discipleId = null) {
        const d = Player.data;
        if ((d.materials.ore || 0) < this.FORGE_COST) {
            return Msg.log("❌ 玄鐵不足，無法開爐鍛造！", "system");
        }

        // 扣除材料
        d.materials.ore -= this.FORGE_COST;
        d.forge.pityCount++;
        d.forge.totalForged++;

        // 判定品質
        let rarity = 1; // 1:凡, 2:良, 3:優, 4:極, 5:神
        let roll = Math.random();

        // 保底機制：100次必出神裝
        if (d.forge.pityCount >= 100) {
            rarity = 5;
            d.forge.pityCount = 0;
            Msg.log("🔥 感應到千錘百鍊之意，神兵出世！", "gold");
        } else {
            if (roll < 0.02) rarity = 5;      // 2% 神
            else if (roll < 0.08) rarity = 4; // 6% 極
            else if (roll < 0.20) rarity = 3; // 12% 優
            else if (roll < 0.50) rarity = 2; // 30% 良
            else rarity = 1;                 // 50% 凡
        }

        // 生成裝備
        const itemPool = {
            1: ["精鐵劍", "生鐵甲", "粗製指環"],
            2: ["寒霜刃", "玄武護心鏡", "靈木簪"],
            3: ["赤霄劍", "流光蠶絲袍", "紫金玉佩"],
            4: ["驚雷火隕斧", "九天玄鐵鎧", "星辰護符"],
            5: ["斬仙屠魔大劍", "混元造化真衣", "太虛神鏡"]
        };

        const names = itemPool[rarity];
        const name = names[Math.floor(Math.random() * names.length)];
        
        const newItem = {
            id: 'eq_' + Date.now(),
            uuid: 'U_' + Math.random().toString(36).substr(2, 9),
            name: name,
            type: 'equipment',
            rarity: rarity,
            plus: 0, // 強化等級
            stats: {
                atk: rarity * 50,
                def: rarity * 30
            },
            desc: `由煉器大殿鍛造而出的法寶。`
        };

        // 🌟 修正：精準存入裝備陣列，而非字典
        if (!Player.data.equipments) Player.data.equipments = [];
        Player.data.equipments.push(newItem);
        Player.save();

        return { item: newItem, isDivine: rarity === 5 };
    },

    /**
     * 2. 裝備強化 (加強模式)
     */
    doEnhance(itemUuid, disciple) {
        // 🌟 修正：從裝備陣列中尋找
        const item = Player.data.equipments.find(i => i.uuid === itemUuid);
        if (!item || item.plus >= 10) return { success: false, msg: "裝備已達強化極限或不存在！" };

        const currentPlus = item.plus;
        const config = this.ENHANCE_TABLE[currentPlus];
        
        // 消耗靈石 (強化越貴)
        const cost = (currentPlus + 1) * 1000;
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);

        if (currentCoins < cost) return { success: false, msg: `靈石不足，需要 ${cost.toLocaleString()} 靈石` };
        
        if (Player.data.coin !== undefined) Player.data.coin -= cost;
        else Player.data.coins -= cost;

        // 🌟 弟子加成：匠心越高，成功率提升越高
        let bonus = (disciple ? (disciple.stats['匠心'] || 0) / 1000 : 0);
        let finalRate = config.rate + bonus;

        let roll = Math.random();
        if (roll < finalRate) {
            // --- 成功 ---
            item.plus++;
            item.stats.atk = Math.floor(item.stats.atk * 1.2);
            item.stats.def = Math.floor(item.stats.def * 1.2);
            Player.save();
            return { success: true, result: 'success', level: item.plus };
        } else {
            // --- 失敗 ---
            if (config.break && Math.random() < 0.3) {
                // 毀損：從裝備陣列移除
                Player.data.equipments = Player.data.equipments.filter(i => i.uuid !== itemUuid);
                Player.save();
                return { success: false, result: 'broken', msg: `💥 噗滋！器靈哀鳴，裝備在強光中崩碎了！` };
            } else if (config.lose) {
                item.plus = Math.max(0, item.plus - 1);
                Player.save();
                return { success: false, result: 'fail_drop', msg: `📉 強化失敗，器紋受損，等級跌落至 +${item.plus}` };
            } else {
                return { success: false, result: 'fail', msg: `☁️ 強化失敗，火候未到，所幸裝備無損。` };
            }
        }
    }
};

window.ForgeSystem = ForgeSystem;
