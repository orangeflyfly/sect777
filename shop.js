/**
 * 宗門修仙錄 - 坊市模組 (shop.js) V1.4.1
 */
function Shop(core) {
    this.core = core;
}

Shop.prototype.buy = function(shopItem) {
    var p = this.core.player;
    if (p.data.money < shopItem.price) {
        this.core.ui.toast("靈石不足，無法交易！", "red"); return;
    }

    if (shopItem.name === "低階靈石袋") {
        var bonus = 500 + Math.floor(Math.random() * 1000);
        p.data.money = p.data.money - shopItem.price + bonus;
        this.core.ui.toast("開啟靈石袋，獲得 🪙" + bonus);
    } else {
        var baseTemplate = null;
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].name === shopItem.name) {
                baseTemplate = GAME_DATA.ITEMS[i]; break;
            }
        }
        if (baseTemplate) {
            var newItem = JSON.parse(JSON.stringify(baseTemplate));
            newItem.itemType = baseTemplate.type;
            newItem.count = 1;
            if (this.core.inventory.addItem(newItem)) {
                p.data.money -= shopItem.price;
                this.core.ui.toast("購買成功");
            }
        }
    }
    p.save(); this.core.ui.renderAll();
};
