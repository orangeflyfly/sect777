/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js) V1.3.0 圓滿版
 */
function UIManager(core) {
    this.core = core;
    this.bagFilter = 'all'; // 預設顯示全部
}

UIManager.prototype.renderAll = function() {
    var p = this.core.player;
    var rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
    document.getElementById('val-level').innerText = "境界：" + rarity.n + " (Lv." + p.data.lv + ")";
    document.getElementById('val-money').innerText = "🪙 " + Math.floor(p.data.money);
    document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";

    this.renderBag(p); 
    this.renderDetailedStats(p); 
    this.renderStats(p);         
    this.renderActiveSkills(p);
    this.renderMapDropdown(p);
    // 如果在商店分頁，則渲染商店
    if(document.getElementById('p-shop').style.display !== 'none') this.renderShop();
};

// 儲物袋渲染：加入分類過濾
UIManager.prototype.renderBag = function(p) {
    var grid = document.getElementById('bag-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // 過濾邏輯
    var filteredBag = p.data.bag.filter(function(item) {
        if (_X_CORE.ui.bagFilter === 'all') return true;
        return item.itemType === _X_CORE.ui.bagFilter;
    });

    document.getElementById('bag-count').innerText = p.data.bag.length;

    var self = this;
    filteredBag.forEach(function(item, idx) {
        // 找到該物品在原始 bag 中的真實索引
        var realIdx = p.data.bag.indexOf(item);
        var slot = document.createElement('div');
        slot.className = "item-slot rarity-" + (item.rarity || 0);
        
        var typeTag = "";
        var icon = "📦";
        if(item.itemType === 'equip') { typeTag = "【裝備】"; icon = item.type==='weapon'?'🗡️':'👕'; }
        else if(item.itemType === 'scroll') { typeTag = "【殘卷】"; icon = "📜"; }
        else if(item.itemType === 'material') { typeTag = "【材料】"; icon = "🦷"; }

        var countTag = (item.count > 1) ? ' <span style="color:#4caf50">x' + item.count + '</span>' : '';
        
        slot.innerHTML = '<div class="item-icon">' + icon + '</div>' +
                         '<div class="item-info-main">' +
                         '<div class="item-name-text">' + typeTag + item.name + countTag + '</div>' +
                         '<div class="item-stats-text">' + (item.itemType==='equip' ? "點擊查看屬性" : "疊加物品") + '</div></div>';
        
        slot.onclick = function() { self.core.inventory.showItemDetail(realIdx); };
        grid.appendChild(slot);
    });
};

// 設置過濾器
UIManager.prototype.setBagFilter = function(filter) {
    this.bagFilter = filter;
    this.renderBag(this.core.player);
};

// --- (其餘 renderDetailedStats, renderStats, toast 等保持與之前一致) ---
// ... [保留上一版 ui.js 的其餘函數] ...

UIManager.prototype.renderShop = function() {
    var shopGrid = document.getElementById('shop-list');
    if(!shopGrid) return;
    shopGrid.innerHTML = '';
    var self = this;

    GAME_DATA.SHOP_ITEMS.forEach(function(item) {
        var slot = document.createElement('div');
        slot.className = "item-slot rarity-2"; // 商店貨物統一用精品色
        slot.innerHTML = '<div class="item-icon">🛍️</div>' +
                         '<div class="item-info-main">' +
                         '<div class="item-name-text">' + item.name + '</div>' +
                         '<div class="item-stats-text">價格: 🪙' + item.price + '</div></div>';
        slot.onclick = function() { self.core.shop.buy(item); };
        shopGrid.appendChild(slot);
    });
};

UIManager.prototype.switchPage = function(id) {
    var stages = document.querySelectorAll('.stage');
    stages.forEach(function(s) { s.style.display = 'none'; });
    var target = document.getElementById("p-" + id);
    if (target) target.style.display = 'flex';
    if (id === 'shop') this.renderShop(); // 切換到商店時刷一下
    this.renderAll();
};
