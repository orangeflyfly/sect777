/**
 * V1.5 ui_shop.js
 * 職責：渲染坊市介面、處理物品買賣、顯示商品品級。
 */

const UI_Shop = {
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

        shopArea.innerHTML = `
            <div class="shop-header">
                <h3>仙家坊市</h3>
                <p>持有靈石: <span id="shop-money">${player.data.money}</span></p>
            </div>
            <div class="shop-tabs">
                <button onclick="UI_Shop.switchTab('buy')">購買</button>
                <button onclick="UI_Shop.switchTab('sell')">出售</button>
            </div>
            <div id="shop-content">
                ${this.renderBuyList()}
            </div>
        `;
    },

    // --- 2. 渲染購買清單 (1.5 新增：商品發光) ---
    renderBuyList: function() {
        return `
            <div class="shop-grid">
                ${this.shopItems.map(item => {
                    const rClass = `r-${item.rarity}`; // 獲取品級 Class
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

    // --- 3. 購買邏輯 (1.4.1 繼承並優化) ---
    buyItem: function(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (player.data.money >= item.price) {
            player.data.money -= item.price;
            
            // 根據類型發放物品
            if (item.type === 'skill') {
                this.learnSkill(item.id);
            } else {
                player.data.inventory.push({
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    rarityClass: `r-${item.rarity}`
                });
            }
            
            player.save();
            this.renderShop(); // 刷新介面
            alert(`成功購買 ${item.name}！`);
        } else {
            alert("靈石不足，仙友請回吧。");
        }
    },

    // --- 4. 出售邏輯 (1.5 優化：批量賣出材料) ---
    renderSellList: function() {
        // 此處 logic 可顯示玩家背包中可出售的物品
        return "<p>出售功能開發中，請先專注歷練...</p>";
    },

    learnSkill: function(skillId) {
        // 簡單判定是否已學過
        const exists = player.data.skills.find(s => s.id === skillId);
        if (!exists) {
            player.data.skills.push({ id: skillId, level: 1, mastery: 0, maxMastery: 100 });
        } else {
            alert("已習得此神通，殘卷已轉化為熟練度！");
            exists.mastery += 50;
        }
    }
};

console.log("✅ [V1.5 坊市介面] ui_shop.js 已裝載，商品流轉系統就緒。");
