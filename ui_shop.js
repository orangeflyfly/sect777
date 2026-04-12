/**
 * V1.5.12 ui_shop.js
 * 職責：渲染坊市介面、處理物品買賣、顯示商品品級。
 * 狀態：100% 復刻宗主原始邏輯，修復切換崩潰。
 */

const UI_Shop = {
    currentTab: 'buy', // 紀錄當前分頁

    // 當前商店貨架內容 (1.4.1 核心商品)
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

        // 使用明確引用 UI_Shop 避免 this 失效
        shopArea.innerHTML = `
            <div class="shop-header">
                <h3>仙家坊市</h3>
                <p>持有靈石: <span id="shop-money" style="color:#f1c40f;">${Math.floor(player.data.money)}</span></p>
            </div>
            <div class="shop-tabs">
                <button class="log-tab ${UI_Shop.currentTab === 'buy' ? 'active' : ''}" onclick="UI_Shop.switchTab('buy')">購買</button>
                <button class="log-tab ${UI_Shop.currentTab === 'sell' ? 'active' : ''}" onclick="UI_Shop.switchTab('sell')">出售</button>
            </div>
            <div id="shop-content" style="margin-top:15px;">
                ${UI_Shop.currentTab === 'buy' ? UI_Shop.renderBuyList() : UI_Shop.renderSellList()}
            </div>
        `;
    },

    // 分頁切換邏輯
    switchTab: function(tab) {
        UI_Shop.currentTab = tab;
        UI_Shop.renderShop();
    },

    // --- 2. 渲染購買清單 ---
    renderBuyList: function() {
        return `
            <div class="shop-grid">
                ${UI_Shop.shopItems.map(item => {
                    const rClass = `r-${item.rarity}`; 
                    return `
                        <div class="shop-item ${rClass}">
                            <div class="item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-price">💰 ${item.price}</span>
                            </div>
                            <button class="buy-btn" onclick="UI_Shop.buyItem('${item.id}')">購買</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // --- 3. 購買邏輯 (對接 1.5 儲物袋結構) ---
    buyItem: function(itemId) {
        const item = UI_Shop.shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (player.data.money >= item.price) {
            // 檢查背包空間 (針對非技能物品)
            if (item.type !== 'skill' && player.data.inventory.length >= (GAMEDATA.CONFIG.MAX_BAG_SLOTS || 50)) {
                player.showToast("儲物袋空間不足！");
                return;
            }

            player.data.money -= item.price;
            
            // 根據類型發放物品
            if (item.type === 'skill') {
                UI_Shop.learnSkill(item.id);
            } else {
                player.data.inventory.push({
                    uid: Date.now() + Math.random(),
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    price: Math.floor(item.price * 0.5), // 回收價
                    prefix: { name: "", attr: "str", value: 0 } // 防止屬性面板報錯
                });
                player.showToast(`成功購買 ${item.name}！`);
            }
            
            player.save();
            UI_Shop.renderShop(); 
        } else {
            player.showToast("靈石不足，仙友請回吧。");
        }
    },

    // --- 4. 出售邏輯 ---
    renderSellList: function() {
        const inv = player.data.inventory;
        if (inv.length === 0) return "<p style='text-align:center; color:#555;'>儲物袋空空如也...</p>";

        return `
            <div class="shop-grid">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity}">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">回收: 💰 ${item.price || 50}</span>
                        </div>
                        <button class="buy-btn" style="background:#632a2a; color:#ff7675;" onclick="UI_Shop.sellItem('${item.uid}')">出售</button>
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
            UI_Shop.renderShop();
            player.showToast(`出售成功，獲得靈石 🪙${item.price || 50}`);
        }
    },

    learnSkill: function(skillId) {
        const exists = player.data.skills.find(s => s.id === skillId);
        if (!exists) {
            player.data.skills.push({ id: skillId, level: 1, mastery: 0, maxMastery: 100 });
            player.showToast(`恭喜習得神通！`, "gold");
        } else {
            player.showToast("已習得此神通，殘卷已轉化為熟練度！");
            exists.mastery += 50;
            if (exists.mastery >= 100) {
                exists.level++;
                exists.mastery = 0;
                player.showToast("神通突破！等級提升！", "gold");
            }
        }
    }
};

console.log("✅ [V1.5 坊市介面] ui_shop.js 已按宗主原版結構修復裝載。");
