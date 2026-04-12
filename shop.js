/**
 * 宗門修仙錄 - 萬寶閣模組 (shop.js) V1.3.0
 */
function Shop(core) {
    this.core = core;
}

Shop.prototype.buy = function(shopItem) {
    var p = this.core.player;
    if (p.data.money < shopItem.price) {
        this.core.ui.toast("靈石不足，無法購買", "red");
        return;
    }

    // 模擬生成一個物品物件
    var newItem = {
        name: shopItem.name,
        itemType: shopItem.type,
        count: 1
    };
    
    // 如果是殘卷，補齊 target 數據
    if (shopItem.type === 'scroll') {
        var base = GAME_DATA.ITEMS.find(function(i){ return i.name === shopItem.name; });
        if (base) newItem.target = base.target;
    }

    if (this.core.inventory.addItem(newItem)) {
        p.data.money -= shopItem.price;
        this.core.ui.log("在萬寶閣購買了 " + shopItem.name, "system", "gold");
        this.core.ui.renderAll();
        p.save();
    } else {
        this.core.ui.toast("儲物袋已滿", "red");
    }
};
