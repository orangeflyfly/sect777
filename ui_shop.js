/**
 * V1.7.0 ui_shop.js
 * 職責：渲染坊市買賣介面、處理分頁切換、調用商店邏輯。
 * 核心：與 ShopLogic (shop.js) 聯動，確保交易數據準確。
 */

const UI_Shop = {
    currentTab: 'buy', // 預設為購買分頁

    // 坊市固定販售商品清單
    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬-1', type: 'fragment', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：回春術-1', type: 'fragment', price: 800, rarity: 2 },
        { id: 's003', name: '殘卷：烈焰斬-2', type: 'fragment', price: 500, rarity: 2 },
        { id: 'i001', name: '低階靈石袋', type: 'special', price: 1000, rarity: 3 },
        { id: 'i002', name: '粗糙的布衣', type: 'armor', price: 200, rarity: 1, stats: { con: 2 } }
    ],

    // 1. 渲染坊市主介面 (由 core.js 調用)
    renderShop() {
        const shopArea = document.getElementById('shop-list');
        if (!shopArea) return;

        // 構建佈局結構
        shopArea.innerHTML = `
            <div class="shop-header" style="margin-bottom:15px; text-align:center;">
                <h3 style="color:var(--accent-color);">仙家坊市</h3>
                <p style="font-size:12px; color:#888;">當前持有：<span style="color:#f1c40f;">💰 ${Math.floor(Player.data.coin)}</span></p>
                <div class="bag-tabs" style="margin-top:10px;">
                    <button class="${this.currentTab === 'buy' ? 'active' : ''}" onclick="UI_Shop.switchTab('buy')">坊市購買</button>
                    <button class="${this.currentTab === 'sell' ? 'active' : ''}" onclick="UI_Shop.switchTab('sell')">清空儲物</button>
                </div>
            </div>
            <div id="shop-content-inner">
                ${this.currentTab === 'buy' ? this.renderBuyList() : this.renderSellList()}
            </div>
        `;
    },

    // 2. 分頁切換
    switchTab(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // 3. 生成購買列表
    renderBuyList() {
        if (this.shopItems.length === 0) return `<div class="empty-msg">坊市目前空無一物...</div>`;

        return `
            <div class="shop-grid" style="display:grid; gap:10px;">
                ${this.shopItems.map(item => `
                    <div class="shop-item r-${item.rarity || 1}" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div class="item-info">
                            <div class="item-name" style="font-weight:bold;">${item.name}</div>
                            <div class="item-price" style="font-size:12px; color:#f1c40f;">💰 ${item.price}</div>
                        </div>
                        <button class="buy-btn" onclick="UI_Shop.buyAction('${item.id}')" style="background:var(--accent-color); border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">購買</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 4. 生成出售列表 (讀取玩家背包)
    renderSellList() {
        const inv = Player.data.inventory;
        if (inv.length === 0) return `<div class="empty-msg">儲物袋空空如也，沒什麼好賣的。</div>`;

        return `
            <div class="shop-grid" style="display:grid; gap:10px;">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity || 1}" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div class="item-info">
                            <div class="item-name" style="font-weight:bold;">${item.name}</div>
                            <div class="item-price" style="font-size:12px; color:#888;">回收價: 💰 ${item.price || 10}</div>
                        </div>
                        <button class="sell-btn" onclick="UI_Shop.sellAction('${item.uuid}')" style="background:#e74c3c; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">出售</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 5. 觸發購買動作
    buyAction(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;

        // 調用 ShopLogic (shop.js) 進行實際交易
        const success = ShopLogic.buy(item);
        
        if (success) {
            this.renderShop(); // 交易成功刷新介面
        }
    },

    // 6. 觸發出售動作
    sellAction(uuid) {
        // 直接調用 UI_Bag 的出售邏輯，保持代碼一致性
        if (typeof UI_Bag !== 'undefined') {
            UI_Bag.sellItem(uuid);
            this.renderShop(); // 刷新介面
        }
    }
};

// 確保全域可用
window.UI_Shop = UI_Shop;
