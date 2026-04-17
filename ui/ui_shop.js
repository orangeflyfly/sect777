/**
 * V3.5.9 ui_shop.js (萬物樓 - 物資顯化與終極對接版)
 * 職責：坊市交易介面渲染、對接 ShopLogic 大腦、新增對 materials 數值資源的出售顯示
 * 位置：/ui/ui_shop.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { UI_Bag } from './ui_bag.js'; 
import { ShopLogic } from '../systems/shop.js'; // 🌟 強制引入大腦，不再依賴 window

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
                        <div class="eco-shop-icon r-bg-${item.rarity}">${window.UI_Bag ? window.UI_Bag.getItemIcon(item.type) : '📦'}</div>
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

    /**
     * 🌟 獲取商品精準回收價 (對齊 ShopLogic)
     */
    getItemSellPrice(item) {
        if (item.uuid && item.uuid.startsWith('dict_')) {
            const key = item.name;
            if (key === '仙草' || key === '玄鐵') return 10;
            if (key.includes('造化')) return 500;
            return 50;
        }
        let price = item.price ? Math.floor(item.price * 0.5) : ((item.rarity || 1) * 20);
        if (item.plus) price += item.plus * 200; // 強化過的裝備更值錢
        return price;
    },

    renderSellList() {
        // 🌟 核心改進：讀取歸一化陣列
        let inv = window.UI_Bag ? window.UI_Bag.getNormalizedItems() : [];

        // 🌟 空間顯化：將隱藏在 Player.data.materials 裡的數值資源強制轉化為顯示物件
        if (Player.data && Player.data.materials) {
            if (Player.data.materials.herb > 0) {
                inv.push({
                    uuid: 'dict_herb', // 給予特殊前綴，對接 ShopLogic
                    name: '仙草',
                    displayName: '仙草 (宗門資源)',
                    count: Player.data.materials.herb,
                    type: 'material',
                    rarity: 2
                });
            }
            if (Player.data.materials.ore > 0) {
                inv.push({
                    uuid: 'dict_ore',
                    name: '玄鐵',
                    displayName: '玄鐵 (宗門資源)',
                    count: Player.data.materials.ore,
                    type: 'material',
                    rarity: 2
                });
            }
        }

        if (inv.length === 0) return `<div class="empty-msg">儲物袋空空如也，無物可換靈石...</div>`;

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 15px; border-radius:8px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.1); flex-wrap: wrap; gap: 10px;">
                <div style="font-size:13px; color:#cbd5e1;">清理儲物袋：</div>
                
                <div style="display:flex; gap:5px; align-items:center;">
                    <select id="batch-rarity-select" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:6px; font-size:12px; outline:none; cursor:pointer;">
                        <option value="1">賣凡品 (Lv.1)</option>
                        <option value="2">賣良品 (Lv.2)</option>
                        <option value="3">賣優品 (Lv.3)</option>
                        <option value="4">賣極品 (Lv.4)</option>
                    </select>
                    <button onclick="UI_Shop.executeBatchSell()" style="background:var(--hp-color); color:white; border:none; padding:8px 10px; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size:12px;">
                        🗑️ 批量出售
                    </button>
                    <button onclick="UI_Shop.quickSellDuplicateFragments()" style="background:#a855f7; color:white; border:none; padding:8px 10px; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size:12px;">
                        📜 賣重複殘卷
                    </button>
                </div>
            </div>
            <div class="eco-list-wrapper">
        `;

        html += inv.map((item) => {
            if (!item.uuid) {
                item.uuid = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
            }

            const unitPrice = this.getItemSellPrice(item);
            const countDisplay = item.count && item.count > 1 ? `<span style="color:#fcd34d; font-size:12px; margin-left:5px;">x${item.count.toLocaleString()}</span>` : '';
            const totalPrice = unitPrice * (item.count || 1);

            return `
            <div class="eco-list-card r-${item.rarity || 1}">
                <div class="eco-card-left">
                    <div class="eco-icon-box r-bg-${item.rarity || 1}">${window.UI_Bag ? window.UI_Bag.getItemIcon(item.type) : '📦'}</div>
                </div>
                <div class="eco-card-mid">
                    <div class="eco-item-name r-txt-${item.rarity || 1}">${item.displayName || item.name}${countDisplay}</div>
                    <div class="eco-item-desc">回收總價: 💰 ${totalPrice.toLocaleString()}</div>
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
            // 🌟 修正：先從歸一化陣列尋找，如果找不到再檢查是否為虛擬資源
            let allItems = window.UI_Bag ? window.UI_Bag.getNormalizedItems() : [];
            item = allItems.find(i => i.uuid === uuidOrUid);

            // 如果是虛擬資源物件
            if (!item && uuidOrUid.startsWith('dict_')) {
                const key = uuidOrUid.replace('dict_', '');
                const nameMap = { 'herb': '仙草', 'ore': '玄鐵' };
                item = {
                    uuid: uuidOrUid,
                    name: nameMap[key] || key,
                    count: Player.data.materials[key] || 0
                };
            }
            
            if(!item) {
                Msg.log("❌ 空間波動，找不到該物品！", "system");
                return;
            }
            
            const unitPrice = this.getItemSellPrice(item);
            const totalPrice = unitPrice * (item.count || 1);
            title = "出售確認";
            desc = `將【${item.displayName || item.name}】換取 <b style="color:var(--coin-color)">${totalPrice.toLocaleString()} 靈石</b>？`;
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

        if (ShopLogic && ShopLogic.buy(item)) {
            Player.data.shop.dailyItems.splice(itemIndex, 1);
            Player.save();

            if (window.UI_Stats && event && typeof window.UI_Stats.createFloatingText === 'function') {
                window.UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `-${item.price}`);
            }
            
            Msg.log(`🛒 購買成功：獲得【${item.name}】`, "gold");
            this.renderShop(); 
            if (window.Core) window.Core.updateUI(); 
        }
    },

    executeSell(itemUuid, event) {
        if (ShopLogic) {
            const success = ShopLogic.sell(itemUuid);
            if (success) {
                if (window.UI_Stats && event && typeof window.UI_Stats.createFloatingText === 'function') {
                    window.UI_Stats.createFloatingText(event.target.closest('.detail-glass-card'), `出售成功`);
                }
                this.renderShop();
                if (window.Core) window.Core.updateUI();
            }
        } else {
            Msg.log("❌ 坊市大陣尚未連接 (ShopLogic遺失)！", "red");
        }
    },

    executeBatchSell() {
        const select = document.getElementById('batch-rarity-select');
        if (!select) return;
        
        const rarity = parseInt(select.value, 10);
        const rarityName = select.options[select.selectedIndex].text;

        if (confirm(`確定要將所有未裝備的「${rarityName}」法寶與道具出售嗎？此舉不可逆！`)) {
            if (ShopLogic) {
                const success = ShopLogic.sellBatch(rarity);
                if (success) {
                    this.renderShop();
                    if (window.Core) window.Core.updateUI();
                }
            }
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
