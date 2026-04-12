/**
 * V1.7.0 shop.js
 * 職責：處理坊市購買邏輯、價格判定、隨機靈石袋獎勵。
 * 核心：與 Player.js 的 addItem 聯動，自動處理殘卷回收。
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

    // 2. 特殊物品處理：低階靈石袋 (隨機獎勵)
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
    // 從 GAMEDATA 獲取基礎模版，若無則使用傳入的資料
    const baseTemplate = shopItem; 

    if (baseTemplate) {
        // 深拷貝物件，避免修改到原始商店清單
        const newItem = JSON.parse(JSON.stringify(baseTemplate));
        newItem.count = 1;
        
        // 4. 調用 Player.addItem 進行放入 (此處會自動處理 50 格檢查與殘卷煉化)
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
    } else {
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.log("此物數據異常，無法購買。", "red");
        }
        return false;
    }
};

// 實例化全域 Shop 邏輯模組
window.ShopLogic = new Shop();
