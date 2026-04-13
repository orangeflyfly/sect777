/**
 * V1.8.1 ui_bag.js
 * 修正點：對接 Player.data 結構、實裝隨機裝備渲染、修復稀有度特效
 */

const UI_Bag = {
    currentFilter: 'all',

    // 1. 初始化分類按鈕
    init() {
        const filterContainer = document.getElementById('bag-filters');
        if (!filterContainer) return;

        const filters = [
            { id: 'all', name: '全部' },
            { id: 'weapon', name: '武器' },
            { id: 'armor', name: '護甲' },
            { id: 'fragment', name: '殘卷' }
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
        this.init(); 
        this.renderBag();
    },

    // 3. 渲染儲物袋內容
    renderBag() {
        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        bagGrid.innerHTML = '';

        // 防禦：檢查玩家數據與資料庫
        const _DATA = window.DATA || window.GAMEDATA;
        if (!Player.data || !Player.data.inventory) {
            bagGrid.innerHTML = '<div class="empty-msg">儲物袋封印中...</div>';
            return;
        }

        const inventory = Player.data.inventory;

        // 執行過濾邏輯
        const filteredItems = inventory.filter(item => {
            if (this.currentFilter === 'all') return true;
            return item.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div class="empty-msg">此分類尚無寶物。</div>';
            return;
        }

        // 生成物品格
        filteredItems.forEach(item => {
            const slot = document.createElement('div');
            // r-1 ~ r-5 對應 fx.css 的金光效果
            slot.className = `bag-slot r-${item.rarity || 1}`;
            
            // 取得屬性描述 (用於提示)
            const statsDesc = item.stats ? Object.entries(item.stats).map(([k, v]) => `${k}+${v}`).join(' ') : '';

            slot.innerHTML = `
                <div class="item-icon">${this.getItemIcon(item.type)}</div>
                <div class="item-name-tag">${item.name}</div>
                ${item.count > 1 ? `<div class="item-count">x${item.count}</div>` : ''}
                <div class="item-hover-tip">${statsDesc}</div>
            `;
            
            // 綁定點擊動作 (預留給穿戴裝備功能)
            slot.onclick = () => this.handleItemClick(item);
            bagGrid.appendChild(slot);
        });
    },

    getItemIcon(type) {
        const icons = { 
            'weapon': '⚔️', 
            'armor': '👕', 
            'accessory': '💍', 
            'fragment': '📜',
            'material': '💎' 
        };
        return icons[type] || '📦';
    },

    handleItemClick(item) {
        // 如果是裝備，未來這裡對接 Player.equip(item.uuid)
        Msg.log(`你查看了 【${item.name}】，感受到一股莫名的靈氣。`, "system");
        
        // 簡單展示屬性
        if (item.stats) {
            console.table(item.stats);
        }
    }
};
