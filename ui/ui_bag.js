/**
 * V2.2 ui_bag.js (飛升模組版 - 結構修正)
 * 職責：儲物袋介面管理、物品分類篩選、裝備與消耗品使用對接
 * 位置：/ui/ui_bag.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

const ATTR_MAP = {
    'str': '力量',
    'con': '體質',
    'dex': '敏捷',
    'int': '悟性',
    'hp': '血量',
    'atk': '攻擊',
    'def': '防禦',
    'speed': '速度'
};

export const UI_Bag = {
    currentFilter: 'all',

    init() {
        const filterContainer = document.getElementById('bag-filters');
        if (!filterContainer) return;

        const filters = [
            { id: 'all', name: '全部' },
            { id: 'weapon', name: '武器' },
            { id: 'armor', name: '護甲' },
            { id: 'accessory', name: '飾品' },
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
        const filterContainer = document.getElementById('bag-filters');
        if (filterContainer && filterContainer.innerHTML.trim() === '') {
            this.init(); 
        }

        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        if (!Player.data || !Player.data.inventory) {
            bagGrid.innerHTML = '<div class="empty-msg">儲物袋封印中，感應不到氣息...</div>';
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
            let statsDesc = '無特殊加成';
            if (item.statTexts && item.statTexts.length > 0) {
                statsDesc = item.statTexts.join(' ');
            } else if (item.stats) {
                statsDesc = Object.entries(item.stats).map(([k, v]) => `${ATTR_MAP[k] || k} +${v}`).join(' ');
            }
            
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
        const icons = { 
            weapon: '⚔️', armor: '👕', accessory: '💍', 
            fragment: '📜', material: '💎', special: '🎁' 
        };
        return icons[type] || '📦';
    },

    /**
     * 使用物品邏輯
     */
    useItem(uuid, event) {
        const item = Player.data.inventory.find(i => i.uuid === uuid);
        if (!item) return;

        let success = false;
        
        // 1. 執行使用或裝備邏輯
        if (['weapon', 'armor', 'accessory'].includes(item.type)) {
            success = Player.equipItem(uuid);
            if (success) Msg.log(`👕 你穿上了 【${item.name}】`, "reward");
        } else {
            success = Player.consumeItem(uuid);
        }

        // 2. 執行成功後的回饋 (此區塊已移入 useItem 函式內部)
        if (success) {
            // 對接飄字特效
            if (window.UI_Stats && event) {
                if (typeof window.UI_Stats.createFloatingText === 'function') {
                    window.UI_Stats.createFloatingText(event.target.closest('.eco-card-right'), "完成");
                }
            }
            
            // 刷新儲物袋與全域數據
            this.renderBag();
            if (window.Core) {
                window.Core.updateUI();
            }
        } else {
            // 如果失敗，依然刷新介面（確保殘卷領悟失敗時，狀態也能同步）
            this.renderBag();
        }
    }
};

window.UI_Bag = UI_Bag;
