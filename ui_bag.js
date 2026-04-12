/**
 * V1.5.10 ui_bag.js
 * 職責：渲染儲物袋網格、品級特效、裝備詳情彈窗、裝備/卸下邏輯、一鍵熔煉。
 */

const UI_Bag = {
    // 1. 渲染儲物袋主介面
    renderBag: function() {
        const bagArea = document.getElementById('bag-screen');
        if (!bagArea) return;

        const d = player.data;
        
        // 更新背包計數
        const bagCount = document.getElementById('bag-count');
        if (bagCount) bagCount.innerText = d.inventory.length;

        bagArea.innerHTML = `
            <div class="bag-container">
                <div class="equipment-section" style="margin-bottom:20px; background:#1a1a1a; padding:15px; border-radius:10px; border:1px solid #333;">
                    <h4 style="margin-top:0; color:var(--gold); border-bottom:1px solid #333; padding-bottom:8px;">當前裝備</h4>
                    <div style="display:flex; gap:15px;">
                        ${this.renderEquipSlot('武器', d.equipment.weapon, 'weapon')}
                        ${this.renderEquipSlot('法袍', d.equipment.armor, 'armor')}
                    </div>
                </div>

                <div style="margin-bottom:15px; display:flex; gap:10px;">
                    <button class="btn-auto-melt" onclick="UI_Bag.autoMelt()" style="flex:1; padding:10px; background:#c0392b; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">一鍵熔煉 (凡/良)</button>
                </div>

                <div class="bag-grid" id="bag-grid">
                    ${this.renderGrid()}
                </div>
            </div>
        `;
    },

    // 渲染裝備位
    renderEquipSlot: function(label, item, slot) {
        if (!item) {
            return `
                <div class="equip-box" style="flex:1; text-align:center; padding:10px; background:#111; border:1px dashed #444; border-radius:8px;">
                    <div style="font-size:11px; color:#666;">${label}</div>
                    <div style="font-size:20px; margin-top:5px;">空</div>
                </div>
            `;
        }
        return `
            <div class="equip-box r-${item.rarity}" onclick="UI_Bag.showItemDetail('${item.uid}', true)" 
                 style="flex:1; text-align:center; padding:10px; background:#222; border:1px solid; border-radius:8px; cursor:pointer;">
                <div style="font-size:11px; color:#aaa;">${label}</div>
                <div style="font-size:13px; margin-top:5px; color:white; font-weight:bold;">${item.name}</div>
            </div>
        `;
    },

    // 渲染背包網格 (5x10)
    renderGrid: function() {
        const slots = [];
        const inv = player.data.inventory;
        const maxSlots = GAMEDATA.CONFIG.MAX_BAG_SLOTS || 50;

        for (let i = 0; i < maxSlots; i++) {
            const item = inv[i];
            if (item) {
                slots.push(`
                    <div class="item-slot r-${item.rarity}" onclick="UI_Bag.showItemDetail('${item.uid}', false)">
                        <span>${item.type === 'weapon' ? '⚔️' : '🛡️'}</span>
                    </div>
                `);
            } else {
                slots.push(`<div class="item-slot empty"></div>`);
            }
        }
        return slots.join('');
    },

    // 2. 顯示物品詳情彈窗 (1.4.1 華麗版)
    showItemDetail: function(uid, isEquipped) {
        const d = player.data;
        let item;
        
        if (isEquipped) {
            item = d.equipment.weapon?.uid === uid ? d.equipment.weapon : d.equipment.armor;
        } else {
            item = d.inventory.find(i => i.uid == uid);
        }

        if (!item) return;

        const rarityName = GAMEDATA.CONFIG.RARITY_NAMES[item.rarity - 1];
        const attrName = {str:'力量', con:'體質', dex:'敏捷', int:'悟性'}[item.prefix.attr];

        let modalHtml = `
            <div id="item-modal" class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:2000; display:flex; justify-content:center; align-items:center;">
                <div class="modal-content r-${item.rarity}" style="background:#1a1a1a; width:85%; max-width:320px; padding:20px; border:2px solid; border-radius:15px; box-shadow: 0 0 20px rgba(0,0,0,1);">
                    <div style="text-align:center; margin-bottom:15px;">
                        <div style="font-size:12px; color:#888;">品級：${rarityName}</div>
                        <h3 style="margin:5px 0; color:white;">${item.name}</h3>
                        <div style="height:1px; background:#333; margin-top:10px;"></div>
                    </div>
                    
                    <div class="item-attrs" style="margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span style="color:#aaa;">屬性加成:</span>
                            <span style="color:var(--gold); font-weight:bold;">${attrName} +${item.prefix.value}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#aaa;">回收價值:</span>
                            <span style="color:#f1c40f;">🪙 ${item.price}</span>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px;">
                        ${isEquipped ? 
                            `<button onclick="UI_Bag.unequip('${item.type}')" style="flex:1; padding:10px; background:#444; color:white; border:none; border-radius:6px;">卸下</button>` :
                            `<button onclick="UI_Bag.equip('${item.uid}')" style="flex:1; padding:10px; background:var(--gold); color:black; border:none; border-radius:6px; font-weight:bold;">裝備</button>`
                        }
                        ${isEquipped ? '' : `<button onclick="UI_Bag.melt('${item.uid}')" style="flex:1; padding:10px; background:#c0392b; color:white; border:none; border-radius:6px;">熔煉</button>`}
                    </div>
                    <button onclick="UI_Bag.closeModal()" style="width:100%; margin-top:10px; padding:8px; background:none; border:none; color:#666; font-size:12px;">關閉視窗</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 3. 邏輯處理：裝備、卸下、熔煉
    equip: function(uid) {
        const idx = player.data.inventory.findIndex(i => i.uid == uid);
        if (idx === -1) return;
        
        const item = player.data.inventory[idx];
        const slot = item.type; // weapon or armor

        // 如果該位置已有裝備，先卸下到背包
        if (player.data.equipment[slot]) {
            player.data.inventory.push(player.data.equipment[slot]);
        }

        // 穿上新裝備，從背包移除
        player.data.equipment[slot] = item;
        player.data.inventory.splice(idx, 1);

        player.updateDerivedStats();
        player.save();
        this.closeModal();
        this.renderBag();
        alert(`已裝備：${item.name}`);
    },

    unequip: function(slot) {
        const item = player.data.equipment[slot];
        if (!item) return;

        if (player.data.inventory.length >= GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            alert("儲物袋已滿，無法卸下裝備！");
            return;
        }

        player.data.inventory.push(item);
        player.data.equipment[slot] = null;

        player.updateDerivedStats();
        player.save();
        this.closeModal();
        this.renderBag();
    },

    melt: function(uid) {
        const idx = player.data.inventory.findIndex(i => i.uid == uid);
        if (idx === -1) return;
        
        const item = player.data.inventory[idx];
        player.data.money += item.price;
        player.data.inventory.splice(idx, 1);
        
        player.save();
        this.closeModal();
        this.renderBag();
        console.log(`熔煉成功，獲得靈石：${item.price}`);
    },

    // 一鍵熔煉 (1.4.1 高效率版)
    autoMelt: function() {
        const inv = player.data.inventory;
        let meltCount = 0;
        let totalGain = 0;

        // 從後往前刪除，避免索引錯誤
        for (let i = inv.length - 1; i >= 0; i--) {
            if (inv[i].rarity <= 2) { // 熔煉凡品(1)與良品(2)
                totalGain += inv[i].price;
                inv.splice(i, 1);
                meltCount++;
            }
        }

        if (meltCount > 0) {
            player.data.money += totalGain;
            player.save();
            this.renderBag();
            alert(`熔煉完成！清理了 ${meltCount} 件凡庸之物，獲得靈石 🪙 ${totalGain}`);
        } else {
            alert("儲物袋中並無凡品或良品。");
        }
    },

    closeModal: function() {
        const modal = document.getElementById('item-modal');
        if (modal) modal.remove();
    }
};

console.log("✅ [V1.5.10] ui_bag.js 儲物萬寶全量載入，發光、熔煉與對比功能就緒。");
