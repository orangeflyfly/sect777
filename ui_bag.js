/**
 * V1.6.0 ui_bag.js (加固優化版)
 * 職責：網格渲染、裝備穿脫邏輯、安全熔煉、屬性同步。
 */

const UI_Bag = {
    // 1. 渲染儲物袋主介面
    renderBag: function() {
        const bagArea = document.getElementById('bag-screen');
        if (!bagArea) return;

        const d = player.data;
        const maxSlots = GAMEDATA.CONFIG?.MAX_BAG_SLOTS || 50;
        
        bagArea.innerHTML = `
            <div class="bag-container" style="animation: fade-in 0.3s ease;">
                <div class="equipment-section">
                    <h4 class="section-title">當前穿戴</h4>
                    <div class="equip-row" style="display:flex; gap:12px;">
                        ${this.renderEquipSlot('武 器', d.equipment.weapon, 'weapon')}
                        ${this.renderEquipSlot('法 袍', d.equipment.armor, 'armor')}
                    </div>
                </div>

                <div class="bag-actions">
                    <div class="bag-status">
                        儲物空間：<span id="bag-count" class="highlight">${d.inventory.length}</span> / ${maxSlots}
                    </div>
                    <button class="melt-btn-auto" onclick="UI_Bag.autoMelt()">一鍵熔煉 (凡/良)</button>
                </div>

                <div class="bag-grid" id="main-bag-grid">
                    ${this.renderGrid()}
                </div>
            </div>
        `;
    },

    // 2. 生成穿戴格
    renderEquipSlot: function(label, item, slot) {
        if (!item) {
            return `
                <div class="equip-box empty">
                    <div class="label">${label}</div>
                    <div class="status">未裝備</div>
                </div>
            `;
        }
        return `
            <div class="equip-box r-${item.rarity}" onclick="UI_Bag.showItemDetail('${item.uid}', true)">
                <div class="label">${label}</div>
                <div class="name">${item.name}</div>
                <div class="rarity-glow"></div>
            </div>
        `;
    },

    // 3. 渲染網格 (優化迴圈效能)
    renderGrid: function() {
        const inv = player.data.inventory;
        const maxSlots = GAMEDATA.CONFIG?.MAX_BAG_SLOTS || 50;
        let html = '';

        for (let i = 0; i < maxSlots; i++) {
            const item = inv[i];
            if (item) {
                html += `
                    <div class="item-slot r-${item.rarity}" onclick="UI_Bag.showItemDetail('${item.uid}', false)">
                        <div class="item-icon">${item.type === 'weapon' ? '⚔️' : '🛡️'}</div>
                    </div>`;
            } else {
                html += `<div class="item-slot empty"></div>`;
            }
        }
        return html;
    },

    // 4. 物品詳情 (加固數據展示)
    showItemDetail: function(uid, isEquipped) {
        const d = player.data;
        // 使用嚴格比對找到物品
        let item = isEquipped ? 
            (d.equipment.weapon?.uid === uid ? d.equipment.weapon : d.equipment.armor) :
            d.inventory.find(i => String(i.uid) === String(uid));

        if (!item) return;

        const rarityName = GAMEDATA.CONFIG.RARITY_NAMES[item.rarity - 1] || "凡品";
        const attrMap = {str:'力量', con:'體質', dex:'敏捷', int:'悟性'};
        const attrName = attrMap[item.prefix.attr] || "未知";

        const modalHtml = `
            <div id="item-modal" class="modal-overlay" onclick="if(event.target==this) UI_Bag.closeModal()">
                <div class="modal-content r-${item.rarity} detail-card">
                    <div class="detail-header">
                        <div class="rarity-tag">— ${rarityName} —</div>
                        <h3 class="item-title">${item.name}</h3>
                    </div>

                    <div class="detail-body">
                        <div class="stat-line">
                            <span class="label">加成屬性：</span>
                            <span class="value">${attrName} +${item.prefix.value}</span>
                        </div>
                        <div class="stat-line">
                            <span class="label">回收價值：</span>
                            <span class="value-gold">🪙 ${item.price} 靈石</span>
                        </div>
                    </div>

                    <div class="detail-footer">
                        ${isEquipped ? 
                            `<button class="btn-primary" onclick="UI_Bag.unequip('${item.type}')">卸下裝備</button>` :
                            `<button class="btn-primary" onclick="UI_Bag.equip('${item.uid}')">立即裝備</button>`
                        }
                        ${!isEquipped ? `<button class="btn-danger" onclick="UI_Bag.melt('${item.uid}')">熔煉</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 5. 穿脫邏輯 (加固屬性刷新)
    equip: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => String(i.uid) === String(uid));
        if (idx === -1) return;

        const item = inv[idx];
        const slot = item.type; // weapon 或 armor

        // 核心加固：自動替換並退回背包
        if (player.data.equipment[slot]) {
            inv.push(player.data.equipment[slot]);
        }

        player.data.equipment[slot] = item;
        inv.splice(idx, 1);

        this.finalizeChange(`已穿戴：${item.name}`);
    },

    unequip: function(slot) {
        const inv = player.data.inventory;
        if (inv.length >= (GAMEDATA.CONFIG.MAX_BAG_SLOTS || 50)) {
            player.showToast("儲物袋已滿，無法卸下！");
            return;
        }

        const item = player.data.equipment[slot];
        if (item) {
            inv.push(item);
            player.data.equipment[slot] = null;
            this.finalizeChange(`已卸下：${item.name}`);
        }
    },

    melt: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => String(i.uid) === String(uid));
        if (idx === -1) return;

        const item = inv[idx];
        player.data.money += item.price;
        inv.splice(idx, 1);
        
        this.finalizeChange(`熔煉成功，獲得 🪙${item.price}`);
    },

    autoMelt: function() {
        const inv = player.data.inventory;
        let totalGain = 0;
        let count = 0;

        // 從後往前刪除是標準做法，防止索引偏移
        for (let i = inv.length - 1; i >= 0; i--) {
            if (inv[i].rarity <= 2) {
                totalGain += inv[i].price;
                inv.splice(i, 1);
                count++;
            }
        }

        if (count > 0) {
            player.data.money += totalGain;
            this.finalizeChange(`一鍵熔煉：清理 ${count} 件凡/良品，獲得靈石 🪙${totalGain}`);
        } else {
            player.showToast("儲物袋內無低級品級裝備。");
        }
    },

    // 輔助：統一結算變動
    finalizeChange: function(msg) {
        player.updateDerivedStats(); // 重算四維
        player.save();               // 存檔
        this.closeModal();           // 關彈窗
        this.renderBag();            // 刷新背包 UI
        player.showToast(msg);
        
        // 如果目前在屬性頁面，同步刷新
        if (typeof UI_Stats !== 'undefined' && document.getElementById('stats-screen')?.style.display !== 'none') {
            UI_Stats.renderStats();
        }
    },

    closeModal: function() {
        const modal = document.getElementById('item-modal');
        if (modal) modal.remove();
    }
};

console.log("✅ [V1.6.0] ui_bag.js 儲物系統優化加固完成。");
