/**
 * V2.2.5 ui_shop.js (飛升完全體 - 語法除魔版 + 一鍵出售)
 * 職責：坊市交易介面渲染、購買/出售標籤切換、確認彈窗處理、批次出售
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

        // 🟢 新增：一鍵出售按鈕面板
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 15px; border-radius:8px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:13px; color:#cbd5e1;">清理儲物袋：</div>
                <button onclick="UI_Shop.quickSellAll()" style="background:var(--hp-color); color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                    一鍵出售 (凡品/材料)
                </button>
            </div>
            <div class="eco-list-wrapper">
        `;

        html += inv.map(item => {
            const price = item.price || Math.floor((item.value || 20) * 0.5) || 10;
            // 處理堆疊物品的顯示
            const countDisplay = item.count && item.count > 1 ? `<span style="color:#fcd34d; font-size:12px; margin-left:5px;">x${item.count}</span>` : '';
            const totalPrice = price * (item.count || 1);

            return `
            <div class="eco-list-card r-${item.rarity || 1}">
                <div class="eco-card-left">
                    <div class="eco-icon-box r-bg-${item.rarity || 1}">${UI_Bag.getItemIcon(item.type)}</div>
                </div>
                <div class="eco-card-mid">
                    <div class="eco-item-name r-txt-${item.rarity || 1}">${item.name}${countDisplay}</div>
                    <div class="eco-item-desc">回收總價: 💰 ${totalPrice}</div>
                </div>
                <div class="eco-card-right">
                    <button class="btn-eco-action btn-sell" onclick="UI_Shop.showTradeModal('sell', '${item.uuid}')">出售</button>
                </div>
            </div>
            `;
        }).join('');

        html += `</div>`;
        return html;
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
            const totalPrice = price * (item.count || 1);
            title = "出售確認";
            desc = `將【${item.name}】換取 <b style="color:var(--coin-color)">${totalPrice} 靈石</b>？`;
            btnText = "忍痛出售";
            btnColor = "var(--hp-color)";
            actionCall = `UI_Shop.executeSell('${id}', event)`;
        }

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
    },

    // 🟢 新增：一鍵出售邏輯
    quickSellAll() {
        if (!Player.data || !Player.data.inventory || Player.data.inventory.length === 0) return;

        let totalEarned = 0;
        let itemsToRemove = [];

        // 掃描儲物袋，找出 凡品(rarity===1) 或 材料(type==='material')
        Player.data.inventory.forEach((item, index) => {
            const isTrash = (item.rarity === 1) || (item.type === 'material');
            // 排除任務所需的特定道具 (可根據需求調整)
            const isTaskItem = item.id === 'mat_herb' && Player.data.tasks && Player.data.tasks.some(t => t.targetId === 'mat_herb');

            if (isTrash && !isTaskItem) {
                const unitPrice = item.price || Math.floor((item.value || 20) * 0.5) || 10;
                const count = item.count || 1;
                totalEarned += (unitPrice * count);
                itemsToRemove.push(index);
            }
        });

        if (itemsToRemove.length === 0) {
            return Msg.log("儲物袋中沒有可批量出售的凡品或閒置材料。", "system");
        }

        if (confirm(`確定要將所有凡品裝備與非任務材料出售嗎？\n預計獲得：${totalEarned} 靈石`)) {
            // 從後面倒著刪除，避免陣列 index 錯亂
            for (let i = itemsToRemove.length - 1; i >= 0; i--) {
                Player.data.inventory.splice(itemsToRemove[i], 1);
            }
            
            Player.data.coin += totalEarned;
            Player.save();
            
            Msg.log(`💰 一鍵清倉完成！獲得 ${totalEarned} 靈石。`, "gold");
            this.renderShop();
            if (window.Core) window.Core.updateUI();
        }
    }
};

window.UI_Shop = UI_Shop;
