/**
 * V2.2 ui_shop.js (飛升完全體 - 語法除魔版)
 * 職責：坊市交易介面渲染、購買/出售標籤切換、確認彈窗處理
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { UI_Bag } from './ui_bag.js'; 
import { ShopLogic } from '../systems/shop.js'; 

export const UI_Shop = {
    currentTab: 'buy', 
    shopItems: [
        { id: 's001_v1', name: '殘卷：烈焰斬(卷一)', type: 'fragment', skillName: '烈焰斬', volume: 1, price: 500, rarity: 2 },
        { id: 's002_v1', name: '殘卷：回春術(卷一)', type: 'fragment', skillName: '回春術', volume: 1, price: 800, rarity: 2 },
        { id: 'i001', name: '低階靈石袋', type: 'special', price: 1000, rarity: 3 }
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

    renderSellList() {
        const inv = (Player.data && Player.data.inventory) ? Player.data.inventory : [];
        if (inv.length === 0) return `<div class="empty-msg">儲物袋空空如也，無物可換靈石...</div>`;

        return `
            <div class="eco-list-wrapper">
                ${inv.map(item => {
                    const price = item.price || Math.floor((item.value || 20) * 0.5) || 10;
                    return `
                    <div class="eco-list-card r-${item.rarity || 1}">
                        <div class="eco-card-left">
                            <div class="eco-icon-box r-bg-${item.rarity || 1}">${UI_Bag.getItemIcon(item.type)}</div>
                        </div>
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

    showTradeModal(actionType, id) {
        let item, title, desc, btnText, btnColor, actionCall;
        
        if (actionType === 'buy') {
            item = this.shopItems.find(i => i.id === id);
            if(!item) return;
            title = "購買確認";
            desc = `花費 <b style="color:var(--coin-color)">${item.price} 靈石</b> 購買【${item.name}】？`;
            btnText = "確認購買";
            btnColor = "var(--exp-color)";
            actionCall = `UI_Shop.executeBuy('${id}', event)`;
        } else {
            item = Player.data.inventory.find(i => i.uuid === id);
            if(!item) return;
            const price = item.price || Math.floor((item.value || 20) * 0.5) || 10;
            title = "出售確認";
            desc = `將【${item.name}】換取 <b style="color:var(--coin-color)">${price} 靈石</b>？`;
            btnText = "忍痛出售";
            btnColor = "var(--hp-color)";
            actionCall = `UI_Shop.executeSell('${id}', event)`;
        }

        // 🟢 修正：移除 Template 中的隱藏字元，並確保 btn-modal-close 類名正確
        const modalHtml = `
            <div id="trade-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="detail-glass-card trade-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4>${title}</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('trade-modal-overlay').remove()">✕</button>
                    </div>
                    <div style="text-align:center; margin: 20px 0; font-size:15px; color:#cbd5e1;">${desc}</div>
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button class="btn-eco-action" style="flex:1; background:rgba(255,255,255,0.1); border:none; color:white; border-radius:8px; cursor:pointer;" 
                                onclick="document.getElementById('trade-modal-overlay').remove()">再想想</button>
                        <button class="btn-eco-action" style="flex:1; background:${btnColor}; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer;" 
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
        if (ShopLogic && ShopLogic.buy(item)) {
            if (window.UI_Stats && event && typeof window.UI_Stats.createFloatingText === 'function') {
                window.UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `-${item.price}`);
            }
            this.renderShop(); 
            if (window.Core) window.Core.updateUI(); 
        }
    },

    executeSell(itemUuid, event) {
        if (ShopLogic && ShopLogic.sell(itemUuid)) {
            if (window.UI_Stats && event && typeof window.UI_Stats.createFloatingText === 'function') {
                window.UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `+靈石`);
            }
            this.renderShop();
            if (window.Core) window.Core.updateUI();
        }
    }
};

window.UI_Shop = UI_Shop;
