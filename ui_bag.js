/**
 * ============================================================
 * V1.7.1 究極穩定版 ui_bag.js
 * 職責：儲物袋渲染 (加入強效防崩潰機制)
 * ============================================================
 */

const UI_Bag = {
    currentFilter: 'all',

    // 1. 初始化分類按鈕
    init() {
        console.log("[UI_Bag] 正在嘗試初始化分類按鈕...");
        const filterContainer = document.getElementById('bag-filters');
        
        // 防禦 1：如果 HTML 沒寫這個 ID，不報錯直接退出
        if (!filterContainer) {
            console.warn("[UI_Bag] 找不到 'bag-filters' 容器，請檢查 index.html");
            return;
        }

        const filters = [
            { id: 'all', name: '全部' },
            { id: 'material', name: '材料' },
            { id: 'equipment', name: '裝備' },
            { id: 'consumable', name: '消耗' }
        ];

        filterContainer.innerHTML = filters.map(f => `
            <button class="filter-btn ${this.currentFilter === f.id ? 'active' : ''}" 
                    style="padding:5px 10px; margin-right:5px; cursor:pointer;"
                    onclick="UI_Bag.setFilter('${f.id}')">
                ${f.name}
            </button>
        `).join('');
    },

    // 2. 切換過濾器
    setFilter(type) {
        this.currentFilter = type;
        this.init(); 
        this.renderBag();
    },

    // 3. 渲染儲物袋內容
    renderBag() {
        console.log("[UI_Bag] 正在觸發渲染流程...");
        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) {
            console.warn("[UI_Bag] 找不到 'bag-content' 容器");
            return;
        }

        bagGrid.innerHTML = '';

        // 防禦 2：檢查資料庫是否就緒
        const _DATA = window.DATA || window.GAMEDATA;
        if (!_DATA) {
            bagGrid.innerHTML = '<div style="color:red; padding:10px;">資料庫加載失敗...</div>';
            return;
        }

        // 防禦 3：檢查玩家背包資料是否就緒
        if (!window.Player || !window.Player.inventory) {
            console.warn("[UI_Bag] Player 資料尚未初始化");
            bagGrid.innerHTML = '<div style="color:gray; padding:10px;">儲物袋封印中...</div>';
            return;
        }

        // 執行過濾邏輯
        const inventory = window.Player.inventory;
        const filteredItems = inventory.filter(invItem => {
            const template = (_DATA.ITEMS && _DATA.ITEMS[invItem.id]) || 
                             (_DATA.FRAGMENTS && _DATA.FRAGMENTS[invItem.id]) || 
                             (_DATA.SKILLS && _DATA.SKILLS[invItem.id]);
            
            if (this.currentFilter === 'all') return true;
            return template && template.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div style="color:var(--text-dim); padding:20px; font-size:14px;">儲物袋內尚無此類法寶。</div>';
            return;
        }

        // 生成物品格
        filteredItems.forEach(invItem => {
            const template = (_DATA.ITEMS && _DATA.ITEMS[invItem.id]) || 
                             (_DATA.FRAGMENTS && _DATA.FRAGMENTS[invItem.id]) || 
                             (_DATA.SKILLS && _DATA.SKILLS[invItem.id]);
            
            if (!template) return;

            const slot = document.createElement('div');
            slot.className = 'bag-slot';
            slot.innerHTML = `
                <div class="item-icon" style="font-size:24px;">${this.getItemIcon(template.type)}</div>
                <div class="item-count" style="font-size:10px; color:#888;">x${invItem.count || 1}</div>
                <div class="item-name-tag" style="font-size:10px; margin-top:4px;">${template.name}</div>
            `;
            slot.onclick = () => this.showItemDetail(invItem.id);
            bagGrid.appendChild(slot);
        });
    },

    getItemIcon(type) {
        const icons = { 'equipment': '⚔️', 'material': '💎', 'consumable': '💊', 'fragment': '📜' };
        return icons[type] || '📦';
    },

    showItemDetail(itemId) {
        console.log(`[UI_Bag] 查看物品：${itemId}`);
    }
};
