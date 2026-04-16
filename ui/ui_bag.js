/**
 * V3.2 ui_bag.js (儲物袋純淨版)
 * 職責：儲物袋渲染、分類篩選、裝備穿戴與道具使用 (已將交易功能完全移交至 ui_shop.js)
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
        console.log("【UI_Bag】啟動儲物袋純淨陣法...");
        this.renderLayout();
        this.renderFilters();
        this.renderBag();
    },

    renderLayout() {
        const container = document.getElementById('page-bag');
        if (!container) return;

        // 🟢 瘦身：已經把「一鍵售出」等按鈕移除了，這裡只留標題和篩選區
        container.innerHTML = `
            <div class="page-title">個人儲物袋</div>
            <div id="bag-filters" class="bag-filters"></div>
            <div id="bag-content" class="bag-grid"></div>
        `;
    },

    renderFilters() {
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
        this.renderFilters(); 
        this.renderBag();
    },

    renderBag() {
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
            const count = item.count || 1;
            
            let actionBtn = '';
            if (['weapon', 'armor', 'accessory'].includes(item.type)) {
                actionBtn = `<button class="btn-eco-action btn-equip" onclick="UI_Bag.useItem('${item.uuid}', event)">裝備</button>`;
            } else if (item.type === 'fragment' || item.type === 'special' || item.type === 'consumable') {
                actionBtn = `<button class="btn-eco-action btn-use" onclick="UI_Bag.useItem('${item.uuid}', event)">使用</button>`;
            }

            return `
                <div class="eco-list-card r-${rarity}">
                    <div class="eco-card-left">
                        <div class="eco-icon-box r-bg-${rarity}">${this.getItemIcon(item.type)}</div>
                        ${count > 1 ? `<div class="eco-item-count">x${count}</div>` : ''}
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
            fragment: '📜', material: '💎', special: '🎁', consumable: '🧪'
        };
        return icons[type] || '📦';
    },

    useItem(uuid, event) {
        const item = Player.data.inventory.find(i => i.uuid === uuid);
        if (!item) return;

        let success = false;
        
        if (['weapon', 'armor', 'accessory'].includes(item.type)) {
            success = Player.equipItem(uuid);
            if (success) Msg.log(`👕 你穿上了 【${item.name}】`, "reward");
        } else {
            // 這裡會對接 player.js 裡的 consumeItem (含五合一與靈石袋邏輯)
            success = Player.consumeItem(uuid);
        }

        if (success) {
            if (window.FX && event) {
                // 如果有 FX 模組則調用特效
                window.FX.spawnPopText("完成", 'player', '#60a5fa');
            }
            
            this.renderBag();
            if (window.Core) {
                window.Core.updateUI();
            }
        } else {
            this.renderBag();
        }
    }
};

window.UI_Bag = UI_Bag;
