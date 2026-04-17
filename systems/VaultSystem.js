/**
 * V3.4 VaultSystem.js (宗門庫房核心)
 * 職責：管理庫房商品清單、處理貢獻點扣除與物品發放
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
        console.log("%c【VaultSystem】宗門庫房大門已開啟，奇珍異寶盤點完畢。", "color: #eab308; font-weight: bold;");
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

        // 建立要發放進背包的物品物件
        const newItem = {
            id: item.id,
            uuid: `vault_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: item.name,
            type: item.type,
            desc: item.desc,
            rarity: item.rarity || 3
        };
        
        // 如果是功法殘卷，加上專屬屬性
        if (item.type === 'fragment') {
            newItem.skillName = item.skillName;
            newItem.volume = item.volume;
        }

        // 呼叫 Player 的背包 API 發放物品
        if (Player.addItem(newItem)) {
            Player.data.sectPoints -= item.cost;
            Player.save();
            Msg.log(`🎁 消耗 ${item.cost} 點貢獻，成功兌換【${item.name}】！`, "gold");
            
            // 通知 UI 更新 (如果介面正開著)
            if (window.UI_Vault && window.UI_Vault.isOpen) {
                window.UI_Vault.openModal(); 
            }
            if (window.Core) window.Core.updateUI();
            return true;
        }
        return false;
    }
};

window.VaultSystem = VaultSystem;
