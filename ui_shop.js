/**
 * V1.8.1 ui_shop.js
 * 職責：渲染坊市介面、處理分頁、對接 ShopLogic
 * 修正點：對接 Player.data 結構、優化出售列表讀取、統一 Msg 輸出
 */

const UI_Shop = {
    currentTab: 'buy', 

    // 坊市商品清單 (全量保留)
    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬-1', type: 'fragment', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：回春術-1', type: 'fragment', price: 800, rarity: 2 },
        { id: 's003', name: '殘卷：烈焰斬-2', type: 'fragment', price: 500, rarity: 2 },
        { id: 'i001', name: '低階靈石袋', type: 'special', price: 1000, rarity: 3 },
        { id: 'i002', name: '粗糙的布衣', type: 'armor', price: 200, rarity: 1, stats: { con: 2 } }
    ],

    // 1. 渲染坊市主介面
    renderShop() {
        const shopArea = document.getElementById('shop-content'); 
        if (!shopArea) return;

        shopArea.innerHTML = `
            <div class="shop-tabs" style="display:flex; gap:10px; margin: 10px 0 15px 0;">
                <button class="nav-btn ${this.currentTab === 'buy' ? 'active' : ''}" onclick="UI_Shop.setTab('buy')" style="flex:1">購買</button>
                <button class="nav-btn ${this.currentTab === 'sell' ? 'active' : ''}" onclick="UI_Shop.setTab('sell')" style="flex:1">出售</button>
            </div>
            <div id="shop-list-container" class="shop-grid-wrapper">
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
            <div class="shop-grid">
                ${this.shopItems.map(item => `
                    <div class="shop-item r-${item.rarity}">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-price">🪙 ${item.price}</div>
                        </div>
                        <button class="btn-buy" onclick="UI_Shop.buyAction('${item.id}')">購買</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 4. 渲染出售列表 (對接 V1.8.1 的 Player.data.inventory)
    renderSellList() {
        // 重構修正：玩家數據現在存在 Player.data 內
        const inv = Player.data ? Player.data.inventory : [];
        
        if (inv.length === 0) {
            return `<div class="empty-msg" style="color:var(--text-dim); text-align:center; padding:30px;">儲物袋空空如也...</div>`;
        }

        return `
            <div class="shop-grid">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity || 1}">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-price" style="color:#888;">回收: 💰 ${item.price || Math.floor(item.value * 0.5) || 10}</div>
                        </div>
                        <button class="btn-sell" onclick="UI_Shop.sellAction('${item.uuid}')">出售</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 5. 觸發購買
    buyAction(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;

        // 調用 ShopLogic
        const success = ShopLogic.buy(item);
        if (success) {
            this.renderShop(); 
            // 購買成功後同步更新頁頭靈石顯示
            if (window.Core) Core.updateUI(); 
        }
    },

    // 6. 觸發出售
    sellAction(itemUuid) {
        // 配合重構，建議將確認邏輯放在 UI 層
        if (confirm("道友確定要將此法寶換成靈石嗎？")) {
            const success = ShopLogic.sell(itemUuid);
            if (success) {
                this.renderShop();
                if (window.Core) Core.updateUI();
            }
        }
    }
};
