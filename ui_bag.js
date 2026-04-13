/**
 * ============================================================
 * V1.7.0 全量極致版 ui_bag.js
 * 職責：儲物袋分頁顯示、物品過濾、詳細描述彈窗
 * ============================================================
 */

const UI_Bag = {
    currentFilter: 'all',

    // 1. 初始化分類按鈕
    init() {
        const filterContainer = document.getElementById('bag-filters');
        if (!filterContainer) return;

        const filters = [
            { id: 'all', name: '全部' },
            { id: 'material', name: '材料' },
            { id: 'equipment', name: '裝備' },
            { id: 'consumable', name: '消耗' }
        ];

        filterContainer.innerHTML = filters.map(f => `
            <button class="filter-btn ${this.currentFilter === f.id ? 'active' : ''}" 
                    onclick="UI_Bag.setFilter('${f.id}')">
                ${f.name}
            </button>
        `).join('');
    },

    // 2. 切換過濾器
    setFilter(type) {
        this.currentFilter = type;
        this.init(); // 重新渲染按鈕狀態
        this.renderBag();
    },

    // 3. 渲染儲物袋 (核心極致邏輯)
    renderBag() {
        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        bagGrid.innerHTML = '';

        // 過濾物品
        const filteredItems = Player.inventory.filter(invItem => {
            const template = DATA.ITEMS[invItem.id];
            if (this.currentFilter === 'all') return true;
            return template && template.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div style="color:var(--text-dim); padding:20px;">儲物袋內空空如也...</div>';
            return;
        }

        filteredItems.forEach(invItem => {
            const template = DATA.ITEMS[invItem.id];
            const slot = document.createElement('div');
            slot.className = 'bag-slot';
            // 這裡套用 style.css 裡的樣式
            slot.innerHTML = `
                <div class="item-icon">${this.getItemIcon(template.type)}</div>
                <div class="item-count">x${invItem.count}</div>
                <div class="item-name-tag">${template.name}</div>
            `;
            slot.onclick = () => this.showItemDetail(invItem.id);
            bagGrid.appendChild(slot);
        });
    },

    // 4. 根據類型顯示圖示 (極致視覺化)
    getItemIcon(type) {
        switch(type) {
            case 'equipment': return '⚔️';
            case 'material': return '💎';
            case 'consumable': return '💊';
            default: return '📦';
        }
    },

    // 5. 顯示物品詳情 (對應你遺失的詞條顯示)
    showItemDetail(itemId) {
        const item = DATA.ITEMS[itemId];
        if (!item) return;
        
        // 這裡可以使用瀏覽器的 alert 或是自訂的 Modal
        // 為了極致體驗，建議未來實作一個漂亮的 Modal
        alert(`【${item.name}】\n類型：${item.type}\n描述：${item.desc}\n售價：${item.price} 靈石`);
    }
};

// 確保 CSS 裡有對應 bag-slot 的樣式，如果沒有，請告訴我。
