/**
 * 宗門修仙錄 - 萬寶閣模組 (shop.js) V1.3.1
 * 職責：負責商品購買判定、靈石扣除與貨物入庫
 */
function Shop(core) {
    this.core = core;
}

/**
 * 購買物品
 * @param {Object} shopItem 來自 GAME_DATA.SHOP_ITEMS 的商品簡化物件
 */
Shop.prototype.buy = function(shopItem) {
    const p = this.core.player;

    // 1. 檢查靈石是否足夠
    if (p.data.money < shopItem.price) {
        this.core.ui.toast("靈石不足，無法購得此寶", "red");
        return;
    }

    // 2. 從數據天書 (data.js) 中查找完整的物品原型
    // 這樣才能獲取殘卷的 target (技能ID) 等關鍵數據
    const baseTemplate = GAME_DATA.ITEMS.find(i => i.name === shopItem.name);
    
    if (!baseTemplate) {
        this.core.ui.toast("此物已絕跡，無法購買", "#888");
        return;
    }

    // 3. 建立準備入庫的物品物件
    const newItem = {
        ...baseTemplate,
        itemType: baseTemplate.type,
        count: 1
    };

    // 4. 嘗試放入儲物袋
    const success = this.core.inventory.addItem(newItem);

    if (success) {
        // 5. 扣除靈石並更新畫面
        p.data.money -= shopItem.price;
        this.core.ui.log(`在萬寶閣購買了 【${newItem.name}】，消耗靈石 🪙${shopItem.price}`, "system", "gold");
        this.core.ui.toast("交易成功");
        
        // 保存存檔並重新渲染
        p.save();
        this.core.ui.renderAll();
    } else {
        // 儲物袋滿了的情況
        this.core.ui.toast("儲物袋已滿，請先熔煉多餘物品", "red");
    }
};
