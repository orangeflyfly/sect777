/***
 * V1.6.0 ui_shop.js (專業坊市版)
 * 職責：買賣交易、神通進化、局部 UI 校驗。
 */

const UI_Shop = {
    currentTab: 'buy',

    shopItems: [
        { id: 's001', name: '殘卷：烈焰斬', type: 'skill', price: 500, rarity: 2 },
        { id: 's002', name: '殘卷：回春術', type: 'skill', price: 800, rarity: 2 },
        { id: 's003', name: '殘卷：破天一劍', type: 'skill', price: 5000, rarity: 3 },
        { id: 'i001', name: '洗髓丹', type: 'material', price: 1000, rarity: 3 },
        { id: 'i002', name: '聚靈散', type: 'material', price: 300, rarity: 2 }
    ],

    // 1. 渲染坊市主介面
    renderShop: function() {
        const shopArea = document.getElementById('shop-screen');
        if (!shopArea) return;

        shopArea.innerHTML = `
            <div class="shop-container" style="animation: fade-in 0.3s ease;">
                <div class="shop-header">
                    <h3 style="margin:0; color:var(--gold); letter-spacing:2px;">仙家坊市</h3>
                    <p style="margin:8px 0 0 0; font-size:14px; color:var(--text-dim);">
                        持有靈石: <span id="shop-money-val" style="color:#f1c40f; font-weight:bold;">🪙 ${Math.floor(player.data.money)}</span>
                    </p>
                </div>
                
                <div class="shop-tabs">
                    <button onclick="UI_Shop.switchTab('buy')" class="log-tab ${this.currentTab === 'buy' ? 'active' : ''}">洞府購買</button>
                    <button onclick="UI_Shop.switchTab('sell')" class="log-tab ${this.currentTab === 'sell' ? 'active' : ''}">清空儲物</button>
                </div>

                <div id="shop-content">
                    ${this.currentTab === 'buy' ? this.renderBuyList() : this.renderSellList()}
                </div>
            </div>
        `;
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // 2. 渲染購買清單 (加固樣式標籤)
    renderBuyList: function() {
        return `
            <div class="shop-grid">
                ${this.shopItems.map(item => `
                    <div class="shop-item r-${item.rarity}">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">靈石 ${item.price}</span>
                        </div>
                        <button class="buy-btn" onclick="UI_Shop.buyItem('${item.id}')">購買</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 3. 購買邏輯 (加強安全性與背包檢查)
    buyItem: function(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (player.data.money < item.price) {
            player.showToast("靈石不足，仙友請回吧。");
            return;
        }

        // 背包檢查 (非技能物品)
        if (item.type !== 'skill' && player.data.inventory.length >= (GAMEDATA.CONFIG?.MAX_BAG_SLOTS || 50)) {
            player.showToast("儲物袋空間不足！");
            return;
        }

        // 交易執行
        player.data.money -= item.price;
        
        if (item.type === 'skill') {
            this.learnSkill(item.id);
        } else {
            player.data.inventory.push({
                uid: "shop_" + Date.now() + Math.floor(Math.random()*100),
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                price: Math.floor(item.price * 0.5),
                prefix: { name: "", attr: "none", value: 0 } 
            });
            player.showToast(`成功購買：${item.name}`);
        }
        
        player.save();
        this.syncMoneyUI(); // 局部刷新靈石顯示
        this.renderShop(); // 刷新列表內容
    },

    // 4. 渲染出售清單 (優化：顯示物品品級顏色)
    renderSellList: function() {
        const inv = player.data.inventory;
        if (inv.length === 0) {
            return `<div class="empty-msg">儲物袋空空如也...</div>`;
        }

        return `
            <div class="shop-grid">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity}" style="border-left: 4px solid var(--r${item.rarity}-color, #444);">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="sell-price">回收價值: 💰 ${item.price}</span>
                        </div>
                        <button class="sell-btn" onclick="UI_Shop.sellItem('${item.uid}')">出售</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 5. 出售邏輯 (加強索引精確度)
    sellItem: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => i.uid === uid);
        if (idx === -1) return;

        const item = inv[idx];
        
        // 增加一個極品以上裝備的警告 (非必要可自行刪除)
        if (item.rarity >= 4 && !confirm(`此乃【${item.name}】，確定要變賣嗎？`)) {
            return;
        }

        player.data.money += item.price;
        inv.splice(idx, 1);
        
        player.save();
        this.syncMoneyUI();
        this.renderShop();
        player.showToast(`售出成功，獲得 🪙 ${item.price}`);
    },

    // 6. 靈石局部同步 (加固 UI 體驗)
    syncMoneyUI: function() {
        const el = document.getElementById('shop-money-val');
        if (el) el.innerText = `🪙 ${Math.floor(player.data.money)}`;
    },

    // 7. 神通習得 (1.4.1 轉化邏輯)
    learnSkill: function(skillId) {
        const skills = player.data.skills;
        const exists = skills.find(s => s.id === skillId);
        
        if (!exists) {
            skills.push({ id: skillId, level: 1, mastery: 0, maxMastery: 100 });
            player.showToast(`✨ 成功領悟神通！`, "gold");
        } else {
            exists.mastery += 50;
            if (exists.mastery >= 100) {
                exists.level++;
                exists.mastery -= 100;
                player.showToast(`🔥 神通突破！提升至 Lv.${exists.level}`, "gold");
            } else {
                player.showToast("已習得此神通，殘卷已轉化為熟練度！");
            }
        }
    }
};

console.log("✅ [V1.6.0] ui_shop.js 坊市系統加固完成。");
