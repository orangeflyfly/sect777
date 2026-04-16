/**
 * V3.3.1 ui_shop.js (萬物樓 - 終極防呆交易版 + 分頁修復)
 * 職責：坊市交易介面渲染、自動補發 UUID、智能出售重複殘卷、保證交易絕對生效
 * 位置：/ui/ui_shop.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { UI_Bag } from './ui_bag.js'; 

export const UI_Shop = {
    currentTab: 'buy', 
    
    // 🟢 萬物樓總庫存 (商品池)
    MASTER_GOODS: [
        { id: 's001_v1', name: '殘卷：烈焰斬(卷一)', type: 'fragment', skillName: '烈焰斬', volume: 1, price: 500, rarity: 2 },
        { id: 's002_v1', name: '殘卷：回春術(卷一)', type: 'fragment', skillName: '回春術', volume: 1, price: 800, rarity: 2 },
        { id: 's003_v1', name: '殘卷：御劍術(卷一)', type: 'fragment', skillName: '御劍術', volume: 1, price: 1200, rarity: 3 },
        { id: 'i001', name: '低階靈石袋', type: 'special', price: 1000, rarity: 3 },
        { id: 'mat_herb_rare', name: '百年靈芝', type: 'material', price: 300, rarity: 2 },
        { id: 'mat_ore_iron', name: '玄鐵精華', type: 'material', price: 400, rarity: 2 },
        { id: 'box_001', name: '蒙塵的劍匣(盲盒)', type: 'special', price: 2000, rarity: 4 },
        { id: 'box_002', name: '神秘煉丹爐', type: 'special', price: 2500, rarity: 4 }
    ],

    init() {
        console.log("【UI_Shop】萬物樓陣法啟動，交易防呆機制運行中...");
        
        if (!Player.data.shop) {
            Player.data.shop = { dailyItems: [] };
        }

        if (!Player.data.shop.dailyItems || Player.data.shop.dailyItems.length === 0) {
            this.rollDailyItems(false);
        }

        this.renderLayout();
        this.renderShop();
    },

    rollDailyItems(isManual = false) {
        if (isManual) {
            let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);
            if (currentCoins < 100) {
                return Msg.log("❌ 靈石不足，坊市管事拒絕為你調貨！(需 100 靈石)", "system");
            }

            if (Player.data.coin !== undefined) Player.data.coin -= 100;
            else Player.data.coins -= 100;
        }

        let pool = [...this.MASTER_GOODS];
        let newItems = [];
        let count = Math.min(6, pool.length); 

        for (let i = 0; i < count; i++) {
            let r = Math.floor(Math.random() * pool.length);
            let item = Object.assign({}, pool[r]); 
            item.uid = 'shop_' + Date.now() + '_' + i; 
            newItems.push(item);
            pool.splice(r, 1); 
        }

        Player.data.shop.dailyItems = newItems;
        Player.save();

        if (isManual) {
            Msg.log("🔄 耗費 100 靈石，萬物樓已重新進貨！", "gold");
            this.renderShop();
            if (window.Core) window.Core.updateUI();
        }
    },

    renderLayout() {
        const container = document.getElementById('page-shop');
        if (!container) return;

        container.innerHTML = `
            <div class="page-title">萬物樓 (坊市)</div>
            <div id="shop-content" class="shop-grid"></div>
        `;
    },

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

    // 🟢 補回被誤刪的切換分頁法陣
    setTab(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    renderBuyList() {
        let items = Player.data.shop.dailyItems || [];
        
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 15px; border-radius:8px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:13px; color:#cbd5e1;">今日奇珍異寶：</div>
                <button onclick="UI_Shop.rollDailyItems(true)" style="background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                    🔄 刷新進貨 (💰100)
                </button>
            </div>
        `;

        if (items.length === 0) {
            html += `<div class="empty-msg">架上空空如也，請點擊刷新進貨...</div>`;
        } else {
            html += `<div class="eco-grid-2x2">`;
            items.forEach(item => {
                html += `
                    <div class="eco-shop-card r-${item.rarity}">
                        <div class="eco-shop-icon r-bg-${item.rarity}">${UI_Bag.getItemIcon(item.type)}</div>
                        <div class="eco-shop-name r-txt-${item.rarity}">${item.name}</div>
                        <button class="btn-eco-trade btn-buy" onclick="UI_Shop.showTradeModal('buy', '${item.uid}')">
                            💰 ${item.price} 購買
                        </button>
                    </div>
                `;
            });
            html += `</div>`;
        }

        return html;
    },

    renderSellList() {
        const inv = (Player.data && Player.data.inventory) ? Player.data.inventory : [];
        if (inv.length === 0) return `<div class="empty-msg">儲物袋空空如也，無物可換靈石...</div>`;

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 15px; border-radius:8px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:13px; color:#cbd5e1;">清理儲物袋：</div>
                <div style="display:flex; gap:5px;">
                    <button onclick="UI_Shop.quickSellDuplicateFragments()" style="background:#a855f7; color:white; border:none; padding:8px 10px; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size:12px;">
                        📜 賣重複殘卷
                    </button>
                    <button onclick="UI_Shop.quickSellAll()" style="background:var(--hp-color); color:white; border:none; padding:8px 10px; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size:12px;">
                        🗑️ 賣凡品
                    </button>
                </div>
            </div>
            <div class="eco-list-wrapper">
        `;

        html += inv.map((item) => {
            // 🌟 終極防呆：如果舊物品沒有 UUID，立刻賦予一個！保證按鈕絕對有效！
            if (!item.uuid) {
                item.uuid = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
            }

            const price = item.price || Math.floor((item.value || 20) * 0.5) || 10;
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

    showTradeModal(actionType, uuidOrUid) {
        let item, title, desc, btnText, btnColor, actionCall;
        
        if (actionType === 'buy') {
            item = Player.data.shop.dailyItems.find(i => i.uid === uuidOrUid);
            if(!item) return;
            title = "購買確認";
            desc = `花費 <b style="color:var(--coin-color)">${item.price} 靈石</b> 購買【${item.name}】？`;
            btnText = "確認購買";
            btnColor = "var(--exp-color)";
            actionCall = `UI_Shop.executeBuy('${uuidOrUid}', event)`;
        } else {
            // 🟢 安全鎖定：用 UUID 尋找物品，無懼陣列變動
            item = Player.data.inventory.find(i => i.uuid === uuidOrUid);
            if(!item) {
                Msg.log("❌ 空間波動，找不到該物品！", "system");
                return;
            }
            const price = item.price || Math.floor((item.value || 20) * 0.5) || 10;
            const totalPrice = price * (item.count || 1);
            title = "出售確認";
            desc = `將【${item.name}】換取 <b style="color:var(--coin-color)">${totalPrice} 靈石</b>？`;
            btnText = "忍痛出售";
            btnColor = "var(--hp-color)";
            actionCall = `UI_Shop.executeSell('${item.uuid}', event)`;
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

    executeBuy(itemUid, event) {
        const itemIndex = Player.data.shop.dailyItems.findIndex(i => i.uid === itemUid);
        if (itemIndex === -1) return;
        const item = Player.data.shop.dailyItems[itemIndex];

        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);
        if (currentCoins < item.price) {
            return Msg.log("❌ 靈石不足！", "system");
        }

        if (Player.data.coin !== undefined) Player.data.coin -= item.price;
        else Player.data.coins -= item.price;

        let newItem = Object.assign({}, item);
        delete newItem.uid;
        newItem.uuid = 'item_' + Date.now() + Math.floor(Math.random()*1000); 
        if (!Player.data.inventory) Player.data.inventory = [];
        Player.data.inventory.push(newItem);

        Player.data.shop.dailyItems.splice(itemIndex, 1);
        Player.save();

        if (window.UI_Stats && event && typeof window.UI_Stats.createFloatingText === 'function') {
            window.UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `-${item.price}`);
        }
        
        Msg.log(`🛒 購買成功：獲得【${item.name}】`, "gold");
        this.renderShop(); 
        if (window.Core) window.Core.updateUI(); 
    },

    executeSell(itemUuid, event) {
        // 🟢 交易執行：確保賣掉的是對的東西
        const index = Player.data.inventory.findIndex(i => i.uuid === itemUuid);
        if (index === -1) return;

        let item = Player.data.inventory[index];
        const price = item.price || Math.floor((item.value || 20) * 0.5) || 10;
        const totalPrice = price * (item.count || 1);

        Player.data.inventory.splice(index, 1);
        
        if (Player.data.coin !== undefined) Player.data.coin += totalPrice;
        else Player.data.coins += totalPrice;
        
        Player.save();

        if (window.UI_Stats && event && typeof window.UI_Stats.createFloatingText === 'function') {
            window.UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `+${totalPrice}`);
        }
        
        Msg.log(`💰 出售成功：獲得 ${totalPrice} 靈石`, "gold");
        this.renderShop();
        if (window.Core) window.Core.updateUI();
    },

    quickSellAll() {
        if (!Player.data || !Player.data.inventory || Player.data.inventory.length === 0) return;

        let totalEarned = 0;
        let itemsToRemove = [];

        Player.data.inventory.forEach((item, index) => {
            const isTrash = (item.rarity === 1) || (item.type === 'material');
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
            for (let i = itemsToRemove.length - 1; i >= 0; i--) {
                Player.data.inventory.splice(itemsToRemove[i], 1);
            }
            
            if (Player.data.coin !== undefined) Player.data.coin += totalEarned;
            else Player.data.coins += totalEarned;

            Player.save();
            
            Msg.log(`💰 一鍵清倉完成！獲得 ${totalEarned} 靈石。`, "gold");
            this.renderShop();
            if (window.Core) window.Core.updateUI();
        }
    },

    quickSellDuplicateFragments() {
        if (!Player.data || !Player.data.inventory || Player.data.inventory.length === 0) return;

        let totalEarned = 0;
        let itemsToRemove = [];
        let seenFragments = {}; 

        Player.data.inventory.forEach((item, index) => {
            if (item.type === 'fragment') {
                const key = item.name; 
                const unitPrice = item.price || Math.floor((item.value || 20) * 0.5) || 10;

                if (seenFragments[key]) {
                    const count = item.count || 1;
                    totalEarned += (unitPrice * count);
                    itemsToRemove.push(index);
                } else {
                    if (item.count > 1) {
                        const sellAmount = item.count - 1;
                        totalEarned += (unitPrice * sellAmount);
                        item.count = 1; 
                    }
                    seenFragments[key] = true; 
                }
            }
        });

        if (totalEarned === 0) {
            return Msg.log("儲物袋中目前沒有【重複多餘】的殘卷。", "system");
        }

        if (confirm(`確定要將所有「重複多餘」的殘卷打包出售給坊市嗎？(每種將自動保留1份)\n預計獲得：${totalEarned} 靈石`)) {
            for (let i = itemsToRemove.length - 1; i >= 0; i--) {
                Player.data.inventory.splice(itemsToRemove[i], 1);
            }
            
            if (Player.data.coin !== undefined) Player.data.coin += totalEarned;
            else Player.data.coins += totalEarned;

            Player.save();
            
            Msg.log(`📜 多餘殘卷出售完成！獲得 ${totalEarned} 靈石。`, "gold");
            this.renderShop();
            if (window.Core) window.Core.updateUI();
        }
    }
};

window.UI_Shop = UI_Shop;
