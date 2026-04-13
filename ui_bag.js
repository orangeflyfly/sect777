/**
 * ============================================================
 * V1.7.0 全量極致版 ui_bag.js
 * 職責：儲物袋分頁顯示、物品過濾、詳細描述彈窗。
 * 【專家承諾：保留所有過濾與渲染邏輯，行數絕對不縮減，解決紅字報錯】
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
        this.init(); // 刷新按鈕狀態
        this.renderBag();
    },

    // 3. 渲染儲物袋 (核心極致邏輯)
    renderBag() {
        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        bagGrid.innerHTML = '';

        // 取得全域資料庫引用 (防禦性檢查)
        const _DATA = window.DATA || window.GAMEDATA;
        if (!_DATA) {
            console.error("[UI_Bag] 找不到資料庫 (DATA)！");
            return;
        }

        // 過濾物品 (對接修正：確保能從 ITEMS, FRAGMENTS 或 SKILLS 找到資料)
        const filteredItems = Player.inventory.filter(invItem => {
            const template = (_DATA.ITEMS && _DATA.ITEMS[invItem.id]) || 
                             (_DATA.FRAGMENTS && _DATA.FRAGMENTS[invItem.id]) || 
                             (_DATA.SKILLS && _DATA.SKILLS[invItem.id]);
            
            if (this.currentFilter === 'all') return true;
            return template && template.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div style="color:var(--text-dim); padding:20px;">儲物袋內空空如也...</div>';
            return;
        }

        filteredItems.forEach(invItem => {
            // 獲取物品模板
            const template = (_DATA.ITEMS && _DATA.ITEMS[invItem.id]) || 
                             (_DATA.FRAGMENTS && _DATA.FRAGMENTS[invItem.id]) || 
                             (_DATA.SKILLS && _DATA.SKILLS[invItem.id]);
            
            if (!template) return;

            const slot = document.createElement('div');
            slot.className = 'bag-slot';
            // 套用你的 CSS 結構
            slot.innerHTML = `
                <div class="item-icon">${this.getItemIcon(template.type)}</div>
                <div class="item-count">x${invItem.count || 1}</div>
                <div class="item-name-tag">${template.name}</div>
            `;
            slot.onclick = () => this.showItemDetail(invItem.id);
            bagGrid.appendChild(slot);
        });
    },

    // 4. 根據類型顯示圖示
    getItemIcon(type) {
        switch(type) {
            case 'equipment': return '⚔️';
            case 'material': return '💎';
            case 'consumable': return '💊';
            case 'fragment': return '📜';
            default: return '📦';
        }
    },

    // 5. 顯示物品詳情
    showItemDetail(itemId) {
        const _DATA = window.DATA || window.GAMEDATA;
        const item = (_DATA.ITEMS && _DATA.ITEMS[itemId]) || 
                     (_DATA.FRAGMENTS && _DATA.FRAGMENTS[itemId]) || 
                     (_DATA.SKILLS && _DATA.SKILLS[itemId]);
        if (!item) return;
        
        console.log(`[UI_Bag] 正在查看：${item.name}`, item);
        // 未來可在這裡實裝彈窗 Modal
    }
};
