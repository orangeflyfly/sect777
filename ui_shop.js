/**
 * V1.8.2 ui_shop.js (經濟系統雙修版)
 * 修正點：精品卡片佈局、實裝毛玻璃確認彈窗、結合動態跳字
 */
const UI_Shop = {
    currentTab: 'buy', 

    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬', type: 'fragment', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：回春術', type: 'fragment', price: 800, rarity: 2 },
        { id: 'i001', name: '低階靈石袋', type: 'special', price: 1000, rarity: 3 },
        { id: 'i002', name: '粗糙的布衣', type: 'armor', price: 200, rarity: 1, stats: { con: 2 } }
    ],

    renderShop() {
        const shopArea = document.getElementById('shop-content'); 
        if (!shopArea) return;

        shopArea.innerHTML = `
            <div class="eco-tabs">
                <button class="eco-tab-btn ${this.currentTab === 'buy' ? 'active' : ''}" onclick="UI_Shop.setTab('buy')">坊市購買</button>
                <button class="eco-tab-btn ${this.currentTab === 'sell' ? 'active' : ''}" onclick="UI_Shop.setTab('sell')">儲物出售</button>
            </div>
            <div id="shop-list-container">
                ${this.currentTab === 'buy' ? this.renderBuyList() : this.renderSellList()}
            </div>
        `;
    },

    setTab(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // V1.8.2：雙欄精品卡片佈局
    renderBuyList() {
        return `
            <div class="eco-grid-2x2">
                ${this.shopItems.map(item => `
                    <div class="eco-shop-card r-${item.rarity}">
                        <div class="eco-shop-icon r-bg-${item.rarity}">${UI_Bag.getItemIcon(item.type)}</div>
                        <div class="eco-shop-name r-txt-${item.rarity}">${item.name}</div>
                        <button class="btn-eco-trade btn-buy" onclick="UI_Shop.showTradeModal('buy', '${item.id}')">
                            💰 ${item.price} 購買
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // V1.8.2：出售列表沿用儲物袋的列表設計，但按鈕改為出售
    renderSellList() {
        const inv = Player.data ? Player.data.inventory : [];
        if (inv.length === 0) return `<div class="empty-msg">儲物袋空空如也...</div>`;

        return `
            <div class="eco-list-wrapper">
                ${inv.map(item => {
                    const price = item.price || Math.floor(item.value * 0.5) || 10;
                    return `
                    <div class="eco-list-card r-${item.rarity || 1}">
                        <div class="eco-card-left"><div class="eco-icon-box r-bg-${item.rarity || 1}">${UI_Bag.getItemIcon(item.type)}</div></div>
                        <div class="eco-card-mid">
                            <div class="eco-item-name r-txt-${item.rarity || 1}">${item.name}</div>
                            <div class="eco-item-desc">回收價: 💰 ${price}</div>
                        </div>
                        <div class="eco-card-right">
                            <button class="btn-eco-action btn-sell" onclick="UI_Shop.showTradeModal('sell', '${item.uuid}')">出售</button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // V1.8.2 實裝毛玻璃確認彈窗
    showTradeModal(actionType, id) {
        let item, title, desc, btnText, btnColor, actionCall;
        
        if (actionType === 'buy') {
            item = this.shopItems.find(i => i.id === id);
            title = "購買確認";
            desc = `花費 <b style="color:var(--coin-color)">${item.price} 靈石</b> 購買【${item.name}】？`;
            btnText = "確認購買";
            btnColor = "var(--exp-color)";
            actionCall = `UI_Shop.executeBuy('${id}', event)`;
        } else {
            item = Player.data.inventory.find(i => i.uuid === id);
            const price = item.price || Math.floor(item.value * 0.5) || 10;
            title = "出售確認";
            desc = `將【${item.name}】換取 <b style="color:var(--coin-color)">${price} 靈石</b>？`;
            btnText = "忍痛出售";
            btnColor = "var(--hp-color)";
            actionCall = `UI_Shop.executeSell('${id}', event)`;
        }

        const modalHtml = `
            <div id="trade-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="detail-glass-card trade-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4>${title}</h4>
                        <button onclick="document.getElementById('trade-modal-overlay').remove()">✕</button>
                    </div>
                    <div style="text-align:center; margin: 20px 0; font-size:15px;">${desc}</div>
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button style="flex:1; padding:10px; border-radius:8px; border:none; background:rgba(255,255,255,0.1); color:var(--text-main); cursor:pointer;" 
                                onclick="document.getElementById('trade-modal-overlay').remove()">再想想</button>
                        <button style="flex:1; padding:10px; border-radius:8px; border:none; background:${btnColor}; color:white; font-weight:bold; cursor:pointer;" 
                                onclick="${actionCall}; document.getElementById('trade-modal-overlay').remove()">
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    executeBuy(itemId, event) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (ShopLogic.buy(item)) {
            if (window.UI_Stats && event) UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `-${item.price}`);
            this.renderShop(); 
            if (window.Core) Core.updateUI(); 
        }
    },

    executeSell(itemUuid, event) {
        if (ShopLogic.sell(itemUuid)) {
            if (window.UI_Stats && event) UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `+靈石`);
            this.renderShop();
            if (window.Core) Core.updateUI();
        }
    }
};
