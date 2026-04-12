/**
 * 宗門修仙錄 - 坊市模組 (shop.js) V1.4.1
 * 職責：處理物品購買、價格判定、靈石袋隨機獎勵
 */
function Shop(core) {
    this.core = core;
}

/**
 * 購買邏輯
 */
Shop.prototype.buy = function(shopItem) {
    var p = this.core.player;
    // 1. 靈石檢查
    if (p.data.money < shopItem.price) {
        this.core.ui.toast("靈石不足，無法完成交易！", "red");
        return;
    }

    // 2. 特殊物品處理 (靈石袋)
    if (shopItem.name === "低階靈石袋") {
        var bonus = 500 + Math.floor(Math.random() * 1000);
        p.data.money = p.data.money - shopItem.price + bonus;
        this.core.ui.toast("開啟靈石袋，獲得 🪙" + bonus);
    } else {
        // 3. 一般物品/殘卷處理
        var baseTemplate = null;
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].name === shopItem.name) {
                baseTemplate = GAME_DATA.ITEMS[i];
                break;
            }
        }

        if (baseTemplate) {
            // 深拷貝物件
            var newItem = JSON.parse(JSON.stringify(baseTemplate));
            newItem.itemType = baseTemplate.type;
            newItem.count = 1;
            
            // 嘗試放入儲物袋
            if (this.core.inventory.addItem(newItem)) {
                p.data.money -= shopItem.price;
                this.core.ui.toast("購買成功：【" + shopItem.name + "】");
            }
        } else {
            this.core.ui.toast("此物已售罄或數據異常", "red");
        }
    }

    // 存檔並重繪
    p.save();
    this.core.ui.renderAll();
};
