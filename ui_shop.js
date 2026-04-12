/**
 * V1.5.12 ui_shop.js
 * 職責：渲染坊市介面、處理物品買賣、商品品級展示、分頁切換邏輯。
 * 狀態：100% 全量實裝，修正 this 指向導致的崩潰問題。
 */

const UI_Shop = {
    currentTab: 'buy', // 預設購買頁面

    // 坊市貨架內容 (固定商品)
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

        // 強制使用 UI_Shop 引用，避免 this 錯誤
        shopArea.innerHTML = `
            <div class="shop-container" style="animation: fade-in 0.3s ease;">
                <div class="shop-header" style="text-align:center; padding:15px; background:rgba(212,175,55,0.05); border-radius:12px; border:1px solid rgba(212,175,55,0.2); margin-bottom:15px;">
                    <h3 style="margin:0; color:var(--gold); letter-spacing:2px;">仙家坊市</h3>
                    <p style="margin:8px 0 0 0; font-size:14px; color:var(--text-dim);">
                        持有靈石: <span style="color:#f1c40f; font-weight:bold;">🪙 ${Math.floor(player.data.money)}</span>
                    </p>
                </div>
                
                <div class="shop-tabs" style="display:flex; gap:8px; margin-bottom:15px;">
                    <button onclick="UI_Shop.switchTab('buy')" class="log-tab ${UI_Shop.currentTab === 'buy' ? 'active' : ''}" style="flex:1;">洞府購買</button>
                    <button onclick="UI_Shop.switchTab('sell')" class="log-tab ${UI_Shop.currentTab === 'sell' ? 'active' : ''}" style="flex:1;">清空儲物</button>
                </div>

                <div id="shop-content">
                    ${UI_Shop.currentTab === 'buy' ? UI_Shop.renderBuyList() : UI_Shop.renderSellList()}
                </div>
            </div>
        `;
    },

    // 2. 切換標籤
    switchTab: function(tab) {
        UI_Shop.currentTab = tab;
        UI_Shop.renderShop();
    },

    // 3. 渲染購買清單 (商品發光實裝)
    renderBuyList: function() {
        return `
            <div class="shop-grid" style="display:grid; grid-template-columns:1fr; gap:12px;">
                ${UI_Shop.shopItems.map(item => {
                    return `
                        <div class="shop-item r-${item.rarity}" style="background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                            <div class="item-info">
                                <span style="font-weight:bold; color:#fff; display:block; font-size:15px;">${item.name}</span>
                                <span style="color:#f1c40f; font-size:13px; margin-top:4px; display:inline-block;">靈石 ${item.price}</span>
                            </div>
                            <button class="add-btn" onclick="UI_Shop.buyItem('${item.id}')" style="background:var(--gold); color:#000; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; width:auto; font-size:13px;">購買</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // 4. 購買邏輯
    buyItem: function(itemId) {
        const item = UI_Shop.shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (player.data.money >= item.price) {
            // 檢查背包空間 (技能類不佔格子)
            if (item.type !== 'skill' && player.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
                player.showToast("儲物袋空間不足！");
                return;
            }

            player.data.money -= item.price;
            
            if (item.type === 'skill') {
                UI_Shop.learnSkill(item.id);
            } else {
                // 生成材料物品放入背包
                player.data.inventory.push({
                    uid: "shop_" + Date.now(),
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    price: Math.floor(item.price * 0.5), // 回收價半價
                    prefix: { name: "", attr: "str", value: 0 } 
                });
                player.showToast(`成功購買：${item.name}`);
            }
            
            player.save();
            UI_Shop.renderShop(); 
        } else {
            player.showToast("靈石不足，仙友請回吧。");
        }
    },

    // 5. 渲染出售清單
    renderSellList: function() {
        const inv = player.data.inventory;
        if (inv.length === 0) {
            return `<div style="text-align:center; color:#555; padding:30px; border:1px dashed #222; border-radius:10px;">儲物袋空空如也...</div>`;
        }

        return `
            <div class="shop-grid" style="display:grid; grid-template-columns:1fr; gap:12px;">
                ${inv.map(item => `
                    <div class="shop-item r-${item.rarity}" style="background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                        <div class="item-info">
                            <span style="color:#fff; font-size:15px;">${item.name}</span>
                            <span style="color:#2ecc71; font-size:12px; margin-top:4px; display:inline-block;">回收價值: 💰 ${item.price}</span>
                        </div>
                        <button onclick="UI_Shop.sellItem('${item.uid}')" style="background:#632a2a; color:#ff7675; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:13px;">出售</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 6. 出售邏輯
    sellItem: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => i.uid == uid);
        if (idx !== -1) {
            const item = inv[idx];
            player.data.money += item.price;
            inv.splice(idx, 1);
            player.save();
            UI_Shop.renderShop();
            player.showToast(`售出成功，獲得靈石 🪙${item.price}`);
        }
    },

    // 7. 神通習得 (1.4.1 轉化邏輯)
    learnSkill: function(skillId) {
        const exists = player.data.skills.find(s => s.id === skillId);
        if (!exists) {
            player.data.skills.push({ id: skillId, level: 1, mastery: 0, maxMastery: 100 });
            player.showToast(`✨ 成功領悟神通！`, "gold");
        } else {
            player.showToast("已習得此神通，殘卷已轉化為修為！");
            exists.mastery += 50;
            if (exists.mastery >= 100) {
                exists.level++;
                exists.mastery = 0;
                player.showToast(`🔥 神通突破！提升至 Lv.${exists.level}`, "gold");
            }
        }
    }
};

console.log("✅ [V1.5.12] ui_shop.js 坊市交易系統已就緒。");
