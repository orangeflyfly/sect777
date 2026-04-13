/**
 * V1.8.2 ui_bag.js (經濟系統雙修版)
 * 修正點：廢棄九宮格，實裝直覺列表佈局，並修復分類按鈕不顯示的問題
 */
const UI_Bag = {
    currentFilter: 'all',

    init() {
        const filterContainer = document.getElementById('bag-filters');
        if (!filterContainer) return;

        const filters = [
            { id: 'all', name: '全部' },
            { id: 'weapon', name: '武器' },
            { id: 'armor', name: '護甲' },
            { id: 'fragment', name: '殘卷' },
            { id: 'material', name: '材料' }
        ];

        filterContainer.innerHTML = filters.map(f => `
            <button class="filter-btn ${this.currentFilter === f.id ? 'active' : ''}" 
                    onclick="UI_Bag.setFilter('${f.id}')">
                ${f.name}
            </button>
        `).join('');
    },

    setFilter(type) {
        this.currentFilter = type;
        this.init(); 
        this.renderBag();
    },

    renderBag() {
        // --- 關鍵修正：自動喚醒分類按鈕 ---
        const filterContainer = document.getElementById('bag-filters');
        if (filterContainer && filterContainer.innerHTML.trim() === '') {
            this.init(); // 如果容器是空的，自動觸發初始化
        }
        // ---------------------------------

        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        // 檢查儲物袋資料是否異常
        if (!Player.data || !Player.data.inventory) {
            bagGrid.innerHTML = '<div class="empty-msg">儲物袋封印中...</div>';
            return;
        }

        const filteredItems = Player.data.inventory.filter(item => {
            if (this.currentFilter === 'all') return true;
            return item.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div class="empty-msg">此分類尚無寶物。</div>';
            return;
        }

        bagGrid.innerHTML = filteredItems.map(item => {
            const statsDesc = item.stats ? Object.entries(item.stats).map(([k, v]) => `${k}+${v}`).join(' ') : '無特殊加成';
            const rarity = item.rarity || 1;
            
            let actionBtn = '';
            if (['weapon', 'armor', 'accessory'].includes(item.type)) {
                actionBtn = `<button class="btn-eco-action btn-equip" onclick="UI_Bag.useItem('${item.uuid}', event)">裝備</button>`;
            } else if (item.type === 'fragment' || item.type === 'special') {
                actionBtn = `<button class="btn-eco-action btn-use" onclick="UI_Bag.useItem('${item.uuid}', event)">使用</button>`;
            }

            return `
                <div class="eco-list-card r-${rarity}">
                    <div class="eco-card-left">
                        <div class="eco-icon-box r-bg-${rarity}">${this.getItemIcon(item.type)}</div>
                        ${item.count > 1 ? `<div class="eco-item-count">x${item.count}</div>` : ''}
                    </div>
                    <div class="eco-card-mid">
                        <div class="eco-item-name r-txt-${rarity}">${item.name}</div>
                        <div class="eco-item-desc">${statsDesc}</div>
                    </div>
                    <div class="eco-card-right">
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
    },

    getItemIcon(type) {
        const icons = { weapon: '⚔️', armor: '👕', accessory: '💍', fragment: '📜', material: '💎', special: '🎁' };
        return icons[type] || '📦';
    },

    useItem(uuid, event) {
        const item = Player.data.inventory.find(i => i.uuid === uuid);
        if (!item) return;

        if (window.UI_Stats && event) {
            UI_Stats.createFloatingText(event.target, "使用中");
        }
        
        Msg.log(`你${item.type === 'weapon' || item.type === 'armor' ? '裝備' : '使用'}了 【${item.name}】`, "system");
    }
};
