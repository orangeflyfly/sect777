/**
 * V1.5.12 ui_bag.js
 * 職責：渲染儲物袋網格、展現品級特效、裝備詳情彈窗、裝備/卸下/熔煉核心邏輯。
 * 狀態：100% 全量實裝，包含一鍵熔煉功能。
 */

const UI_Bag = {
    // 1. 渲染儲物袋主介面
    renderBag: function() {
        const bagArea = document.getElementById('bag-screen');
        if (!bagArea) return;

        const d = player.data;
        
        bagArea.innerHTML = `
            <div class="bag-container" style="animation: fade-in 0.3s ease;">
                <div class="equipment-section" style="margin-bottom:20px; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border:1px solid #222;">
                    <h4 style="margin:0 0 12px 0; color:var(--gold); font-size:14px; border-bottom:1px solid #333; padding-bottom:8px;">當前穿戴</h4>
                    <div style="display:flex; gap:12px;">
                        ${this.renderEquipSlot('武 器', d.equipment.weapon, 'weapon')}
                        ${this.renderEquipSlot('法 袍', d.equipment.armor, 'armor')}
                    </div>
                </div>

                <div class="bag-actions" style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:12px; color:var(--text-dim);">
                        儲物空間：<span id="bag-count" style="color:#fff;">${d.inventory.length}</span> / ${GAMEDATA.CONFIG.MAX_BAG_SLOTS}
                    </div>
                    <button class="auto-btn" onclick="UI_Bag.autoMelt()" style="background:#4a1a1a; color:#ff7675; border-color:#632a2a; padding:5px 10px; font-size:11px; border-radius:4px;">一鍵熔煉(凡/良)</button>
                </div>

                <div class="bag-grid">
                    ${this.renderGrid()}
                </div>
            </div>
        `;
    },

    // 2. 生成單個穿戴格
    renderEquipSlot: function(label, item, slot) {
        if (!item) {
            return `
                <div class="equip-box empty" style="flex:1; background:#111; border:1px dashed #444; border-radius:8px; padding:12px; text-align:center;">
                    <div style="font-size:11px; color:#555;">${label}</div>
                    <div style="margin-top:5px; font-size:12px; color:#333;">未裝備</div>
                </div>
            `;
        }
        return `
            <div class="equip-box r-${item.rarity}" onclick="UI_Bag.showItemDetail('${item.uid}', true)" 
                 style="flex:1; background:#1a1a1a; border:1px solid; border-radius:8px; padding:12px; text-align:center; cursor:pointer; position:relative;">
                <div style="font-size:11px; color:var(--text-dim);">${label}</div>
                <div style="margin-top:5px; font-size:13px; color:#fff; font-weight:bold;">${item.name}</div>
            </div>
        `;
    },

    // 3. 渲染 50 格網格 (包含 1.4.1 品級發光)
    renderGrid: function() {
        const slots = [];
        const inv = player.data.inventory;
        const maxSlots = GAMEDATA.CONFIG.MAX_BAG_SLOTS || 50;

        for (let i = 0; i < maxSlots; i++) {
            const item = inv[i];
            if (item) {
                // 有物品：顯示對應品級 Class (r-1 ~ r-5)
                slots.push(`
                    <div class="item-slot r-${item.rarity}" onclick="UI_Bag.showItemDetail('${item.uid}', false)">
                        <span style="filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));">
                            ${item.type === 'weapon' ? '⚔️' : '🛡️'}
                        </span>
                    </div>
                `);
            } else {
                // 空格子
                slots.push(`<div class="item-slot empty"></div>`);
            }
        }
        return slots.join('');
    },

    // 4. 物品詳情彈窗 (對接 80 詞條屬性)
    showItemDetail: function(uid, isEquipped) {
        const d = player.data;
        let item = isEquipped ? 
            (d.equipment.weapon?.uid === uid ? d.equipment.weapon : d.equipment.armor) :
            d.inventory.find(i => i.uid == uid);

        if (!item) return;

        const rarityName = GAMEDATA.CONFIG.RARITY_NAMES[item.rarity - 1];
        const attrName = {str:'力量', con:'體質', dex:'敏捷', int:'悟性'}[item.prefix.attr];

        const modalHtml = `
            <div id="item-modal" class="modal-overlay" onclick="if(event.target==this) UI_Bag.closeModal()">
                <div class="modal-content r-${item.rarity}" style="border:2px solid; animation: modal-in 0.3s ease;">
                    <div style="text-align:center; margin-bottom:15px;">
                        <div style="font-size:12px; color:var(--text-dim); letter-spacing:2px;">— ${rarityName} —</div>
                        <h3 style="margin:8px 0; color:#fff; font-size:1.4em;">${item.name}</h3>
                    </div>

                    <div style="background:rgba(0,0,0,0.5); padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #333;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span style="color:#888;">加成屬性：</span>
                            <span style="color:var(--gold); font-weight:bold;">${attrName} +${item.prefix.value}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#888;">回收價值：</span>
                            <span style="color:#f1c40f;">🪙 ${item.price} 靈石</span>
                        </div>
                    </div>

                    <div style="display:flex; gap:12px;">
                        ${isEquipped ? 
                            `<button onclick="UI_Bag.unequip('${item.type}')" style="flex:1; padding:12px; background:#444; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">卸下裝備</button>` :
                            `<button onclick="UI_Bag.equip('${item.uid}')" style="flex:1; padding:12px; background:var(--gold); color:#000; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">立即裝備</button>`
                        }
                        ${!isEquipped ? `<button onclick="UI_Bag.melt('${item.uid}')" style="flex:1; padding:12px; background:#632a2a; color:#ff7675; border:none; border-radius:8px; cursor:pointer;">熔煉</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 5. 核心邏輯：裝備、卸下、熔煉
    equip: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => i.uid == uid);
        if (idx === -1) return;

        const item = inv[idx];
        const slot = item.type;

        // 若該位置已有裝備，先脫下放回背包
        if (player.data.equipment[slot]) {
            inv.push(player.data.equipment[slot]);
        }

        // 穿上新裝備並從背包移除
        player.data.equipment[slot] = item;
        inv.splice(idx, 1);

        player.updateDerivedStats(); // 關鍵：即時刷新戰鬥數值
        player.save();
        this.closeModal();
        this.renderBag();
        player.showToast(`已穿戴：${item.name}`);
    },

    unequip: function(slot) {
        if (player.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            player.showToast("儲物袋已滿，無法卸下！");
            return;
        }

        const item = player.data.equipment[slot];
        if (item) {
            player.data.inventory.push(item);
            player.data.equipment[slot] = null;
            player.updateDerivedStats();
            player.save();
            this.closeModal();
            this.renderBag();
            player.showToast(`已卸下：${item.name}`);
        }
    },

    melt: function(uid) {
        const inv = player.data.inventory;
        const idx = inv.findIndex(i => i.uid == uid);
        if (idx === -1) return;

        const item = inv[idx];
        player.data.money += item.price;
        inv.splice(idx, 1);

        player.save();
        this.closeModal();
        this.renderBag();
        player.showToast(`熔煉成功，獲得靈石 🪙${item.price}`);
    },

    // 一鍵熔煉 (凡品 & 良品)
    autoMelt: function() {
        const inv = player.data.inventory;
        let count = 0;
        let totalGain = 0;

        for (let i = inv.length - 1; i >= 0; i--) {
            if (inv[i].rarity <= 2) {
                totalGain += inv[i].price;
                inv.splice(i, 1);
                count++;
            }
        }

        if (count > 0) {
            player.data.money += totalGain;
            player.save();
            this.renderBag();
            player.showToast(`一鍵熔煉完成：清理 ${count} 件凡品，獲得靈石 🪙${totalGain}`, "gold");
        } else {
            player.showToast("儲物袋內並無凡品或良品。");
        }
    },

    closeModal: function() {
        const modal = document.getElementById('item-modal');
        if (modal) modal.remove();
    }
};

console.log("✅ [V1.5.12] ui_bag.js 儲物萬寶系統全量載入完成。");
