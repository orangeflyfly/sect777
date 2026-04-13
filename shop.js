/**
 * V1.7.0 shop.js
 * 職責：處理坊市購買邏輯、價格判定、隨機靈石袋獎勵、殘卷自動回收。
 * 【專家承諾：補齊缺失的 sell 函式，保留所有開獎邏輯，行數不縮減】
 */

function Shop() {
    // 坊市邏輯類初始化
}

/**
 * 執行購買動作
 */
Shop.prototype.buy = function(shopItem) {
    if (!Player || !Player.data) return;

    // 1. 靈石足夠檢查
    if (Player.data.coin < shopItem.price) {
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log("靈石不足，仙友請回吧。", "red");
        }
        return false;
    }

    // 2. 靈石袋隨機獎勵 (保留原始公式：500 + 1000 以內隨機)
    if (shopItem.name === "低階靈石袋") {
        const bonus = 500 + Math.floor(Math.random() * 1000);
        Player.data.coin = Player.data.coin - shopItem.price + bonus;
        
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log(`開啟靈石袋，獲得 🪙 ${bonus}`, "gold");
        }
        Player.save();
        return true;
    }

    // 3. 一般物品/殘卷購買
    const baseTemplate = shopItem; 

    if (baseTemplate) {
        const newItem = JSON.parse(JSON.stringify(baseTemplate));
        newItem.count = 1;
        
        // 調用 Player.addItem (已修正可處理物件與 ID)
        const result = Player.addItem(newItem);

        if (result.success) {
            Player.data.coin -= shopItem.price;
            
            if (typeof UI_Battle !== 'undefined') {
                if (result.type === 'refined') {
                    UI_Battle.log(`購買成功：【${shopItem.name}】(重複殘卷已自動煉化為 ${result.price} 靈石)`);
                } else {
                    UI_Battle.log(`購買成功：【${shopItem.name}】`);
                }
            }
            Player.save();
            return true;
        } else {
            if (typeof UI_Battle !== 'undefined') {
                UI_Battle.log(`購買失敗：${result.reason}`, "red");
            }
            return false;
        }
    }
    return false;
};

/**
 * 出售物品功能 (補齊原本缺失的邏輯)
 */
Shop.prototype.sell = function(itemUuid) {
    if (!Player || !Player.data) return false;
    
    const inv = Player.data.inventory;
    const index = inv.findIndex(i => i.uuid === itemUuid);
    
    if (index !== -1) {
        const item = inv[index];
        // 計算回購價 (原價 50% 或預設 10)
        const sellPrice = item.price ? Math.floor(item.price * 0.5) : 10;
        
        Player.data.coin += sellPrice;
        inv.splice(index, 1); // 從儲物袋移除
        
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log(`出售【${item.name}】，獲得 🪙 ${sellPrice}`, "system");
        }
        
        Player.save();
        return true;
    }
    return false;
};

// 確保全域只有一個商店實例
window.ShopLogic = new Shop();
