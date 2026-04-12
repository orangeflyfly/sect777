/**
 * V1.5.11 ui_shop.js
 * 職責：渲染坊市介面、處理物品買賣、顯示商品品級。
 * 100% 復刻宗主原始結構，並補齊分頁邏輯。
 */

const UI_Shop = {
    currentTab: 'buy', // 紀錄當前標籤

    // 當前商店貨架內容 (1.4.1 核心商品清單)
    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬', type: 'skill', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：長生功', type: 'skill', price: 800, rarity: 2 },
        { id: 'i001', name: '止血草', type: 'material', price: 50, rarity: 1 },
        { id: 'i002', name: '精鐵', type: 'material', price: 200, rarity: 2 }
    ],

    // --- 1. 渲染坊市主介面 ---
    renderShop: function() {
        const shopArea = document.getElementById('shop-screen');
        if (!shopArea) return;

        shopArea.innerHTML = `
            <div class="shop-header" style="text-align:center; padding:10px;">
                <h3 style="color:var(--gold); margin:0;">仙家坊市</h3>
                <p style="font-size:14px;">持有靈石: <span id="shop-money" style="color:#f1c40f;">${Math.floor(player.data.money)}</span></p>
            </div>
            <div class="shop-tabs" style="display:flex; gap:5px; margin-bottom:15px;">
                <button onclick="UI_Shop.switchTab('buy')" class="log-tab ${this.currentTab === 'buy' ? 'active' : ''}" style="flex:1;">購買</button>
                <button onclick="UI_Shop.switchTab('sell')" class="log-tab ${this.currentTab === 'sell' ? 'active' : ''}" style="flex:1;">出售</button>
            </div>
            <div id="shop-content">
                ${this.currentTab === 'buy' ? this.renderBuyList() : this.renderSellList()}
            </div>
        `;
    },

    // 標籤切換邏輯
    switchTab: function(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // --- 2. 渲染購買清單 (1.5 新增：商品發光) ---
    renderBuyList: function() {
        return `
            <div class="shop-grid" style="display:grid; grid-template-columns:1fr; gap:10px; padding:5px;">
                ${this.shopItems.map(item => {
                    const rClass = `r-${item.rarity}`; 
                    return `
                        <div class="shop-item ${rClass}" style="background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                            <div class="item-info">
                                <span class="item-name" style="font-weight:bold; color:white; display:block;">${item.name}</span>
                                <span class="item-price" style="color:#f1c40f; font-size:13px;">💰 ${item.price}</span>
                            </div>
                            <button class="buy-btn" onclick="UI_Shop.buyItem('${item.id}')" style="background:var(--gold); border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">購買</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // --- 3. 購買邏輯 (1.4.1 繼承並優化) ---
    buyItem: function(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (player.data.money >= item.price) {
            player.data.money -= item.price;
            
            // 根據類型發放物品
            if (item.type === 'skill') {
                this.learnSkill(item.id);
            } else {
                // 檢查背包空間
                if (player.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
                    alert("儲物袋空間不足！");
                    player.data.money += item.price; // 退款
                    return;
                }
                player.data.inventory.push({
                    uid: Date.now() + Math.random(),
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    price: Math.floor(item.price * 0.5), // 設定回收價為買價的一半
                    prefix: { name: "", attr: "str", value: 0 } // 材料類給予空詞條防止報錯
                });
            }
            
            player.save();
            this.renderShop(); 
            alert(`成功購買 ${item.name}！`);
        } else {
            alert("靈石不足，仙友請回吧。");
        }
    },

    // --- 4. 出售邏輯 (實裝功能) ---
    renderSellList: function() {
        const inv = player.data.inventory;
        if (inv.length === 0) return "<p style='text-align:center; color:#666; margin-top:20px;'>儲物袋空空如也...</p>";

        return `
            <div class="shop-grid" style="display:grid; grid-template-columns:1fr; gap:10px; padding:5px;">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity}" style="background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                        <div class="item-info">
                            <span class="item-name" style="color:white;">${item.name}</span>
                            <span class="item-price" style="color:#2ecc71; font-size:12px;">回收價: 💰 ${item.price || 50}</span>
                        </div>
                        <button onclick="UI_Shop.sellItem('${item.uid}')" style="background:#c0392b; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">出售</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    sellItem: function(uid) {
        const idx = player.data.inventory.findIndex(i => i.uid == uid);
        if (idx !== -1) {
            const item = player.data.inventory[idx];
            player.data.money += (item.price || 50);
            player.data.inventory.splice(idx, 1);
            player.save();
            this.renderShop();
            console.log(`出售成功，獲得靈石: ${item.price}`);
        }
    },

    learnSkill: function(skillId) {
        // 簡單判定是否已學過
        const exists = player.data.skills.find(s => s.id === skillId);
        if (!exists) {
            player.data.skills.push({ id: skillId, level: 1, mastery: 0, maxMastery: 100 });
            alert(`成功習得神通：${skillId}！`);
        } else {
            alert("已習得此神通，殘卷已轉化為熟練度！");
            exists.mastery += 50;
            // 檢查熟練度升級
            if (exists.mastery >= exists.maxMastery) {
                exists.level++;
                exists.mastery = 0;
                alert("神通突破！等級提升！");
            }
        }
    }
};

console.log("✅ [V1.5 坊市介面] ui_shop.js 已按宗主原版結構修復裝載。");
