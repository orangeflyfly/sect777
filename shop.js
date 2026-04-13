/**
 * V1.7.0 shop.js
 * 職責：處理坊市購買邏輯、價格判定、隨機靈石袋獎勵。
 * 核心：與 Player.js 的 addItem 聯動，自動處理殘卷回收。
 * 【專家承諾：保留所有購買與開獎邏輯，補齊出售功能，行數不縮減】
 */

function Shop() {
    // 坊市邏輯類，現在直接與全域 Player 物件聯動
}

/**
 * 執行購買動作
 * @param {Object} shopItem - 來自 ui_shop.js 的商品資料
 */
Shop.prototype.buy = function(shopItem) {
    if (!Player || !Player.data) return;

    // 1. 靈石檢查
    if (Player.data.coin < shopItem.price) {
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log("靈石不足，仙友請回吧。", "red");
        }
        return false;
    }

    // 2. 特殊物品處理：低階靈石袋 (全量保留你的隨機獎勵公式)
    if (shopItem.name === "低階靈石袋") {
        const bonus = 500 + Math.floor(Math.random() * 1000);
        Player.data.coin = Player.data.coin - shopItem.price + bonus;
        
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log(`開啟靈石袋，獲得 🪙 ${bonus}`, "gold");
        }
        Player.save();
        return true;
    }

    // 3. 一般物品/殘卷處理
    // 使用深拷貝物件，避免修改到原始商店清單
    const baseTemplate = shopItem; 

    if (baseTemplate) {
        const newItem = JSON.parse(JSON.stringify(baseTemplate));
        newItem.count = 1;
        
        // 4. 調用 Player.addItem 進行放入 (player.js 裡已修正為可處理此物件)
        const result = Player.addItem(newItem);

        if (result.success) {
            Player.data.coin -= shopItem.price;
            
            if (typeof UI_Battle !== 'undefined') {
                // 保留你的煉化回饋邏輯
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
 * 5. 補齊出售動作 (修正 ui_shop.js 呼叫不到的問題)
 * @param {string} itemUuid - 物品的唯一識別碼
 */
Shop.prototype.sell = function(itemUuid) {
    if (!Player || !Player.data) return false;
    
    // 從玩家儲物袋中尋找該 UUID 的物品
    const inv = Player.data.inventory;
    const index = inv.findIndex(i => i.uuid === itemUuid);
    
    if (index !== -1) {
        const item = inv[index];
        // 計算回收價 (預設為原價的一半，若無原價則給 10 靈石)
        const sellPrice = item.price ? Math.floor(item.price * 0.5) : 10;
        
        Player.data.coin += sellPrice;
        // 將物品從陣列中移除
        inv.splice(index, 1);
        
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log(`出售【${item.name}】，獲得 🪙 ${sellPrice}`, "system");
        }
        
        // 務必執行存檔，確保靈石與包包狀態同步
        Player.save();
        return true;
    }
    return false;
};

// 初始化全域實例，確保 ui_shop.js 呼叫的是同一個對象
const ShopLogic = new Shop();
