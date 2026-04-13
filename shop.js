/**
 * V1.8.1 shop.js
 * 職責：處理坊市交易邏輯 (購買/出售)
 * 修正點：對接 Msg 訊號台、修正 Player.addItem 回傳判斷、移除過時的 UI 直接調用
 */

function Shop() {
    // 坊市邏輯類初始化
}

/**
 * 執行購買動作
 */
Shop.prototype.buy = function(shopItem) {
    if (!Player || !Player.data) return false;

    // 1. 靈石檢查
    if (Player.data.coin < shopItem.price) {
        Msg.log("靈石不足，仙友請回吧。", "red");
        return false;
    }

    // 2. 特殊物品：低階靈石袋 (隨機開獎邏輯)
    if (shopItem.name === "低階靈石袋") {
        const bonus = 500 + Math.floor(Math.random() * 1000);
        Player.data.coin = Player.data.coin - shopItem.price + bonus;
        
        Msg.log(`開啟靈石袋，獲得 🪙 ${bonus}`, "gold");
        Player.save();
        return true;
    }

    // 3. 一般物品/殘卷購買
    // 深拷貝一份商品數據，避免修改到商店原始模板
    const newItem = JSON.parse(JSON.stringify(shopItem));
    
    // 生成唯一識別碼 (重要：讓商店買來的裝備也能被出售/穿戴)
    newItem.uuid = 'it_' + Date.now() + Math.random().toString(36).substr(2, 5);
    newItem.count = 1;

    // 調用 Player.addItem (V1.8.1 回傳為布林值)
    const success = Player.addItem(newItem);

    if (success) {
        Player.data.coin -= shopItem.price;
        // 注意：Player.addItem 內部已經有 Msg.log 提示獲得物品了
        // 這裡只需要額外記錄存檔
        Player.save();
        return true;
    } else {
        // addItem 失敗通常是背包滿了，該方法內已有 Msg.log 提示
        return false;
    }
};

/**
 * 出售物品功能
 */
Shop.prototype.sell = function(itemUuid) {
    if (!Player || !Player.data) return false;
    
    const inv = Player.data.inventory;
    const index = inv.findIndex(i => i.uuid === itemUuid);
    
    if (index !== -1) {
        const item = inv[index];
        
        // 計算回購價 (V1.8.1 邏輯：隨機裝備使用 price 或自帶價值)
        const sellPrice = item.price ? Math.floor(item.price * 0.5) : 10;
        
        Player.data.coin += sellPrice;
        inv.splice(index, 1); // 從儲物袋移除
        
        Msg.log(`出售【${item.name}】，獲得 🪙 ${sellPrice}`, "system");
        
        Player.save();
        return true;
    }
    
    Msg.log("找不到該物品，無法出售。", "red");
    return false;
};

// 確保全域實例化
window.ShopLogic = new Shop();
