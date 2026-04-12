/**
 * V1.5.12 ui_shop.js
 * 職責：渲染坊市介面、處理物品買賣、商品品級展示、分頁切換。
 * 狀態：全量實裝，100% 遵照宗主原始架構。
 */

const UI_Shop = {
    currentTab: 'buy', // 預設購買頁面

    // 當前商店貨架內容 (1.4.1 核心商品)
    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬', type: 'skill', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：長生功', type: 'skill', price: 800, rarity: 2 },
        { id: 'i001', name: '止血草', type: 'material', price: 50, rarity: 1 },
        { id: 'i002', name: '精鐵', type: 'material', price: 200, rarity: 2 },
        { id: 'i003', name: '築基丹', type: 'material', price: 2000, rarity: 3 }
    ],

    // --- 1. 渲染坊市主介面 ---
    renderShop: function() {
        const shopArea = document.getElementById('shop-screen');
        if (!shopArea) return;

        shopArea.innerHTML = `
            <div class="shop-container" style="animation: fade-in 0.4s ease;">
                <div class="shop-header" style="text-align:center; padding:15px; background:rgba(212,175,55,0.05); border-radius:12px; border:1px solid rgba(212,175,55,0.2); margin-bottom:15px;">
                    <h3 style="margin:0; color:var(--gold); letter-spacing:2px;">仙家坊市</h3>
                    <p style="margin:8px 0 0 0; font-size:14px; color:var(--text-dim);">
                        持有靈石: <span id="shop-money" style="color:#f1c40f; font-weight:bold;">${Math.floor(player.data.money)}</span>
                    </p>
                </div>
                
                <div class="shop-tabs" style="display:flex; gap:8px; margin-bottom:15px;">
                    <button onclick="UI_Shop.switchTab('buy')" class="log-tab ${this.currentTab === 'buy' ? 'active' : ''}" style="flex:1;">購買</button>
                    <button onclick="UI_Shop.switchTab('sell')" class="log-tab ${this.currentTab === 'sell' ? 'active' : ''}" style="flex:1;">出售</button>
                </div>

                <div id="shop-content">
                    ${this.currentTab === 'buy' ? this.renderBuyList() : this.renderSellList()}
                </div>
            </div>
        `;
    },

    // 標籤切換
    switchTab: function(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // --- 2. 渲染購買清單 (商品發光實裝) ---
    renderBuyList: function() {
        return `
            <div class="shop-grid" style="display:grid; grid-template-columns:1fr; gap:12px;">
                ${this.shopItems.map(item => {
                    const rClass = `r-${item.rarity}`; 
                    return `
                        <div class="shop-item ${rClass}" style="background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                            <div class="item-info">
                                <span class="item-name" style="font-weight:bold; color:#fff; display:block; font-size:15px;">${item.name}</span>
                                <span class="item-price" style="color:#f1c40f; font-size:13px; margin-top:4px; display:inline-block;">💰 ${item.price}</span>
                            </div>
                            <button class="buy-btn" onclick="UI_Shop.buyItem('${item.id}')" style="background:var(--gold); color:#000; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">購買</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // --- 3. 購買邏輯 ---
    buyItem: function(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (player.data.money >= item.price) {
            // 檢查背包空間 (針對非技能物品)
            if (item.type !== 'skill' && player.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
                player.showToast("儲物袋空間不足！");
                return;
            }

            player.data.money -= item.price;
            
            // 根據類型發放物品
            if (item.type === 'skill') {
                this.learnSkill(item.id);
            } else {
                player.data.inventory.push({
                    uid: Date.now() + Math.random(),
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    price: Math.floor(item.price * 0.5), // 回收價為半價
                    prefix: { name: "", attr: "str", value: 0 } // 材料類屬性為0
                });
                player.showToast(`成功購買 ${item.name}`);
            }
            
            player.save();
            this.renderShop(); 
        } else {
            player.showToast("靈石不足，仙友請回吧。");
        }
    },

    // --- 4. 出售邏輯 ---
    renderSellList: function() {
        const inv = player.data.inventory;
        if (inv.length === 0) {
            return `<div style="text-align:center; color:#555; padding:30px;">儲物袋內並無可售之物...</div>`;
        }

        return `
            <div class="shop-grid" style="display:grid; grid-template-columns:1fr; gap:12px;">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity}" style="background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                        <div class="item-info">
                            <span class="item-name" style="color:#fff; font-size:15px;">${item.name}</span>
                            <span class="item-price" style="color:#2ecc71; font-size:12px; margin-top:4px; display:inline-block;">回收價: 💰 ${item.price}</span>
                        </div>
                        <button onclick="UI_Shop.sellItem('${item.uid}')" style="background:#632a2a; color:#ff7675; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">出售</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    sellItem: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => i.uid == uid);
        if (idx !== -1) {
            const item = inv[idx];
            player.data.money += item.price;
            inv.splice(idx, 1);
            player.save();
            this.renderShop();
            player.showToast(`已出售 ${item.name}，獲得靈石 🪙${item.price}`);
        }
    },

    // --- 5. 神通習得與轉化 ---
    learnSkill: function(skillId) {
        const exists = player.data.skills.find(s => s.id === skillId);
        if (!exists) {
            player.data.skills.push({ id: skillId, level: 1, mastery: 0, maxMastery: 100 });
            player.showToast(`✨ 成功習得神通：${skillId}`, "gold");
        } else {
            player.showToast("已習得此神通，殘卷已轉化為熟練度！");
            exists.mastery += 50;
            // 熟練度滿則升級
            if (exists.mastery >= exists.maxMastery) {
                exists.level++;
                exists.mastery = 0;
                player.showToast(`🔥 神通突破！等級提升至 Lv.${exists.level}`, "gold");
            }
        }
    }
};

console.log("✅ [V1.5.12] ui_shop.js 坊市介面已按宗主原版結構圓滿裝載。");
