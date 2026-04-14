/**
 * V2.0 shop.js (飛升模組版)
 * 職責：處理坊市交易邏輯 (購買/出售)
 * 位置：/systems/shop.js
 */

// 1. 導入必要的神識模組
import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const ShopLogic = {
    /**
     * 執行購買動作
     * @param {Object} shopItem - 商店商品數據
     */
    buy(shopItem) {
        if (!Player || !Player.data) return false;

        // 1. 靈石檢查
        if (Player.data.coin < shopItem.price) {
            Msg.log("靈石不足，仙友請回吧。", "red");
            return false;
        }

        // 2. 特殊物品：低階靈石袋 (隨機開獎機緣)
        if (shopItem.name === "低階靈石袋") {
            const bonus = 500 + Math.floor(Math.random() * 1000);
            Player.data.coin = Player.data.coin - shopItem.price + bonus;
            
            Msg.log(`開啟靈石袋，獲得 🪙 ${bonus}`, "gold");
            Player.save();
            return true;
        }

        // 3. 一般物品/殘卷購買
        // 深拷貝一份商品數據，避免修改到商店原始模板 (確保煉器爐純淨)
        const newItem = JSON.parse(JSON.stringify(shopItem));
        
        // 生成唯一識別碼 (UUID)，確保購買的寶物能被獨立識別與出售
        newItem.uuid = 'it_' + Date.now() + Math.random().toString(36).substr(2, 5);
        newItem.count = 1;

        // 調用 Player 模組的添加物品功能
        const success = Player.addItem(newItem);

        if (success) {
            Player.data.coin -= shopItem.price;
            // 存檔紀錄
            Player.save();
            return true;
        } else {
            // addItem 失敗（通常是儲物袋滿了），Player 模組內已有對應 Msg 提示
            return false;
        }
    },

    /**
     * 出售物品功能
     * @param {string} itemUuid - 物品唯一識別碼
     */
    sell(itemUuid) {
        if (!Player || !Player.data) return false;
        
        const inv = Player.data.inventory;
        const index = inv.findIndex(i => i.uuid === itemUuid);
        
        if (index !== -1) {
            const item = inv[index];
            
            // 計算回收價 (V1.8.1 邏輯：五折回收或基礎價值)
            const sellPrice = item.price ? Math.floor(item.price * 0.5) : 10;
            
            Player.data.coin += sellPrice;
            inv.splice(index, 1); // 從儲物袋移除
            
            Msg.log(`出售【${item.name}】，獲得 🪙 ${sellPrice}`, "system");
            
            Player.save();
            return true;
        }
        
        Msg.log("找不到該物品，無法出售。", "red");
        return false;
    }
};

/**
 * --- 全域對接鎖 ---
 * 確保 UI_Shop 裡面的 onclick="UI_Shop.executeBuy" 
 * 呼叫到 ShopLogic 時能正確對接
 */
window.ShopLogic = ShopLogic;

console.log("%c【系統】坊市律令模組化完成，交易因果已定。", "color: #fbbf24; font-weight: bold;");
