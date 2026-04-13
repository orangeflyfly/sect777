/**
 * ============================================================
 * V1.7.0 全量極致版 ui_bag.js
 * 職責：儲物袋分頁顯示、物品過濾、詳細描述彈窗
 * 【專家承諾：保留所有過濾與渲染邏輯，僅修正資料檢索斷點，行數不縮減】
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

        // 過濾物品 (對接修正：確保能從 ITEMS, FRAGMENTS 或 SKILLS 找到對應的資料模板)
        const filteredItems = Player.inventory.filter(invItem => {
            // 嘗試從各個資料庫節點尋找物品定義
            const template = (DATA.ITEMS && DATA.ITEMS[invItem.id]) || 
                             (DATA.FRAGMENTS && DATA.FRAGMENTS[invItem.id]) || 
                             (DATA.SKILLS && DATA.SKILLS[invItem.id]);
            
            if (this.currentFilter === 'all') return true;
            return template && template.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div style="color:var(--text-dim); padding:20px;">儲物袋內空空如也...</div>';
            return;
        }

        filteredItems.forEach(invItem => {
            // 獲取正確的物品模板
            const template = (DATA.ITEMS && DATA.ITEMS[invItem.id]) || 
                             (DATA.FRAGMENTS && DATA.FRAGMENTS[invItem.id]) || 
                             (DATA.SKILLS && DATA.SKILLS[invItem.id]);
            
            if (!template) return;

            const slot = document.createElement('div');
            slot.className = 'bag-slot';
            // 這裡套用 style.css 裡的樣式，保留 item-icon 與 item-name-tag 的結構
            slot.innerHTML = `
                <div class="item-icon">${this.getItemIcon(template.type)}</div>
                <div class="item-count">x${invItem.count || 1}</div>
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
            case 'fragment': return '📜'; // 新增殘卷圖示支援
            default: return '📦';
        }
    },

    // 5. 顯示物品詳情 (對應你原有的開發進度)
    showItemDetail(itemId) {
        // 同樣實施多路徑資料檢索
        const item = (DATA.ITEMS && DATA.ITEMS[itemId]) || 
                     (DATA.FRAGMENTS && DATA.FRAGMENTS[itemId]) || 
                     (DATA.SKILLS && DATA.SKILLS[itemId]);
        if (!item) return;
        
        // 此處保留你的開發位置，未來可以彈出 Modal 或是詳細文字
        console.log(`[UI_Bag] 正在查看：${item.name}`, item);
        
        // 為了讓新手也能看到反饋，我們暫時先用一個簡單的 log 提醒
        // 這裡可以使用瀏覽器的 alert 或是自定義 Modal 展示詳情
    }
};
