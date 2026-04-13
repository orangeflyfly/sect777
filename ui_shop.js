/**
 * V1.7.0 ui_shop.js
 * 職責：渲染坊市買賣介面、處理分頁切換、調用商店邏輯。
 * 核心：與 ShopLogic (shop.js) 聯動，確保交易數據準確。
 * 【專家承諾：全量保留商品清單與渲染邏輯，行數不縮減】
 */

const UI_Shop = {
    currentTab: 'buy', // 預設為購買分頁

    // 坊市固定販售商品清單 (全量保留，絕不刪減)
    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬-1', type: 'fragment', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：回春術-1', type: 'fragment', price: 800, rarity: 2 },
        { id: 's003', name: '殘卷：烈焰斬-2', type: 'fragment', price: 500, rarity: 2 },
        { id: 'i001', name: '低階靈石袋', type: 'special', price: 1000, rarity: 3 },
        { id: 'i002', name: '粗糙的布衣', type: 'armor', price: 200, rarity: 1, stats: { con: 2 } }
    ],

    // 1. 渲染坊市主介面 (由 core.js 調用)
    renderShop() {
        const shopArea = document.getElementById('shop-content'); // 修正 ID 對應 index.html
        if (!shopArea) return;

        // 構建佈局結構
        shopArea.innerHTML = `
            <div class="shop-tabs" style="display:flex; gap:10px; margin-bottom:15px;">
                <button class="tab-btn ${this.currentTab === 'buy' ? 'active' : ''}" onclick="UI_Shop.setTab('buy')">購買</button>
                <button class="tab-btn ${this.currentTab === 'sell' ? 'active' : ''}" onclick="UI_Shop.setTab('sell')">出售</button>
            </div>
            <div id="shop-list-container">
                ${this.currentTab === 'buy' ? this.renderBuyList() : this.renderSellList()}
            </div>
        `;
    },

    // 2. 切換標籤頁
    setTab(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // 3. 渲染購買列表
    renderBuyList() {
        return `
            <div class="shop-grid" style="display:grid; gap:10px;">
                ${this.shopItems.map(item => `
                    <div class="shop-item r-${item.rarity}" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div class="item-info">
                            <div class="item-name" style="font-weight:bold;">${item.name}</div>
                            <div class="item-price" style="font-size:12px; color:var(--coin-color);">🪙 ${item.price}</div>
                        </div>
                        <button class="buy-btn" onclick="UI_Shop.buyAction('${item.id}')" style="background:var(--accent); color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">購買</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 4. 渲染出售列表 (讀取玩家儲物袋)
    renderSellList() {
        // 使用我們在 player.js 裡建立的相容性映射 Player.inventory
        const inv = Player.inventory;
        
        if (inv.length === 0) return `<div style="color:var(--text-dim); padding:20px;">儲物袋內沒有可出售的物品。</div>`;

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
    sellAction(itemUuid) {
        // 調用 ShopLogic (shop.js) 進行出售，此函式將在下一個檔案中補齊
        if (confirm("確定要出售此物嗎？")) {
            const success = ShopLogic.sell(itemUuid);
            if (success) {
                this.renderShop();
            }
        }
    }
};
