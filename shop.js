/**
 * 宗門修仙錄 - 萬寶閣模組 (shop.js) V1.4
 */
function Shop(core) {
    this.core = core;
}

Shop.prototype.buy = function(shopItem) {
    const p = this.core.player;
    if (p.data.money < shopItem.price) {
        this.core.ui.toast("靈石不足！", "red"); return;
    }

    const baseTemplate = GAME_DATA.ITEMS.find(i => i.name === shopItem.name);
    // 處理特殊商品 (如靈石袋)
    if (shopItem.name === "低階靈石袋") {
        const bonus = 500 + Math.floor(Math.random() * 1000);
        p.data.money = p.data.money - shopItem.price + bonus;
        this.core.ui.toast(`開啟靈石袋，獲得 🪙${bonus}`);
    } else if (baseTemplate) {
        const newItem = { ...baseTemplate, itemType: baseTemplate.type, count: 1 };
        if (this.core.inventory.addItem(newItem)) {
            p.data.money -= shopItem.price;
            this.core.ui.toast(`購買成功`);
        }
    }
    p.save(); this.core.ui.renderAll();
};
