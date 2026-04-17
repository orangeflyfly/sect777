/**
 * V3.5.7 VaultSystem.js (宗門庫房核心 - 空間法則修復版)
 * 職責：管理庫房商品清單、處理貢獻點扣除與物品發放
 * 修正：完美對接 dictionary (字典) 型態的 inventory，解決兌換按鈕失效崩潰的問題
 * 位置：/systems/VaultSystem.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const VaultSystem = {
    // 宗門庫房專屬商品清單 (可隨時擴充)
    items: [
        { id: 'v_frag_1', name: '殘卷：奔雷訣(卷一)', type: 'fragment', skillName: '奔雷訣', volume: 1, cost: 200, rarity: 4, desc: '宗門不傳之秘，蘊含一絲天地雷劫之威。' },
        { id: 'v_pill_1', name: '洗髓丹', type: 'special', cost: 500, rarity: 3, desc: '伐骨洗髓，服用後似乎能強行提升先天資質。' },
        { id: 'v_fruit_1', name: '造化果', type: 'special', cost: 1500, rarity: 5, desc: '奪天地造化之神物，據說能讓人脫胎換骨。' },
        { id: 'v_key_1', name: '殘破的秘境鑰匙', type: 'special', cost: 1000, rarity: 4, desc: '古老秘境的信物，或許能交由懸賞堂開啟特殊歷練。' }
    ],

    init() {
        console.log("%c【VaultSystem】宗門庫房大門已開啟，空間法則修復完畢。", "color: #eab308; font-weight: bold;");
        window.VaultSystem = this;
    },

    /**
     * 購買/兌換物品
     */
    buyItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return false;

        const currentPoints = Player.data.sectPoints || 0;
        if (currentPoints < item.cost) {
            Msg.log(`❌ 貢獻點不足，無法兌換【${item.name}】！需要 ${item.cost} 點。`, "system");
            return false;
        }

        // 🌟 核心修正：將物品以「字典鍵值(Key-Value)」存入 inventory
        // 徹底避開 Player.addItem() 呼叫陣列 push 所導致的崩潰當機
        if (!Player.data.inventory) {
            Player.data.inventory = {};
        }
        
        // 庫房物品（殘卷、丹藥、鑰匙）均為可堆疊的奇珍異寶，直接疊加數量
        if (typeof Player.data.inventory[item.name] !== 'number') {
            Player.data.inventory[item.name] = 0;
        }
        Player.data.inventory[item.name] += 1;

        // 扣除貢獻點
        Player.data.sectPoints -= item.cost;
        
        // 存檔
        Player.save();
        Msg.log(`🎁 消耗 ${item.cost} 點貢獻，成功兌換【${item.name}】！`, "gold");
        
        // 🌟 即時通知 UI 重繪庫房介面，讓貢獻點與按鈕狀態瞬間更新
        if (window.UI_Vault && window.UI_Vault.isOpen) {
            window.UI_Vault.openModal(); 
        }
        
        // 喚醒天道，更新上方資源條
        if (window.Core && window.Core.updateUI) {
            window.Core.updateUI();
        }
        
        return true;
    }
};

window.VaultSystem = VaultSystem;
