/**
 * V1.5 ui_bag.js
 * 職責：渲染儲物袋、裝備欄。實裝品級發光外框、詞條雙色顯示。
 */

const UI_Bag = {
    // --- 1. 渲染儲物袋主介面 ---
    renderBag: function() {
        const bagArea = document.getElementById('bag-screen');
        if (!bagArea) return;

        bagArea.innerHTML = `
            <div class="equipment-slots">
                <h4>人物裝備</h4>
                ${this.renderEquipSlots()}
            </div>
            <hr>
            <div class="inventory-grid">
                <h4>儲物袋 (${player.data.inventory.length}/50)</h4>
                <div class="grid-container">
                    ${this.renderInventory()}
                </div>
            </div>
        `;
    },

    // --- 2. 渲染裝備欄 ---
    renderEquipSlots: function() {
        const slots = ['weapon', 'armor'];
        return slots.map(slot => {
            const item = player.data.equipment[slot];
            if (!item) return `<div class="slot empty">${slot === 'weapon' ? '武器欄' : '防具欄'}</div>`;
            
            return `
                <div class="slot occupied ${item.rarityClass}">
                    ${this.formatItemName(item)}
                </div>
            `;
        }).join('');
    },

    // --- 3. 渲染背包物品 (1.5 核心：發光與雙色) ---
    renderInventory: function() {
        if (player.data.inventory.length === 0) return "<p>儲物袋空空如也...</p>";

        return player.data.inventory.map((item, index) => {
            // item.rarityClass 來自 player.js 生成時注入的 r-1 ~ r-5
            return `
                <div class="bag-item ${item.rarityClass}" onclick="UI_Bag.showItemDetail(${index})">
                    ${this.formatItemName(item)}
                </div>
            `;
        }).join('');
    },

    // --- 4. 雙色名稱渲染邏輯 (1.5 新增：[詞條]青色 + 名稱白色) ---
    formatItemName: function(item) {
        let prefixHtml = "";
        if (item.prefixes && item.prefixes.length > 0) {
            // 將多個詞條組合，並包覆在專門的 CSS class 中
            prefixHtml = `<span class="prefix-text">[${item.prefixes.join('·')}]</span>`;
        }
        return `${prefixHtml}<span class="name-text">${item.name}</span>`;
    },

    // --- 5. 物品詳情彈窗 ---
    showItemDetail: function(index) {
        const item = player.data.inventory[index];
        // 這裡可以擴展裝備、使用、丟棄的按鈕
        alert(`【${item.name}】\n品級：${GAMEDATA.RARITY[item.rarity].name}\n屬性：${item.baseAtk ? '攻擊 +'+item.baseAtk : '防禦 +'+item.baseDef}`);
    }
};

console.log("✅ [V1.5 儲物袋] ui_bag.js 已裝載。品級發光與詞條分色邏輯已就緒。");
