/**
 * V2.7 ui_bag.js
 * 職責：儲物袋渲染、分類篩選、一鍵售出裝備、一鍵清空重複殘卷、道具使用
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
        console.log("【UI_Bag】啟動儲物袋陣法...");
        this.renderLayout();
        this.renderFilters();
        this.renderBag();
    },

    renderLayout() {
        const container = document.getElementById('page-bag');
        if (!container) return;

        // 🟢 新增：批量操作區域 (Button Group)
        container.innerHTML = `
            <div class="page-title">儲物袋</div>
            
            <div class="bag-actions-bar" style="display: flex; gap: 10px; margin-bottom: 15px; padding: 0 10px;">
                <button class="btn-eco-action btn-sell-all" onclick="UI_Bag.sellAllEquipment()" 
                        style="background: #7f1d1d; flex: 1; font-size: 12px; padding: 8px;">
                    ♻️ 一鍵售出裝備
                </button>
                <button class="btn-eco-action btn-sell-all" onclick="UI_Bag.sellDuplicateFragments()" 
                        style="background: #1e3a8a; flex: 1; font-size: 12px; padding: 8px;">
                    📜 一鍵清重複殘卷
                </button>
            </div>

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

    /**
     * 🟢 新增：一鍵售出所有裝備
     */
    sellAllEquipment() {
        if (!Player.data.inventory || Player.data.inventory.length === 0) return;
        
        const toSell = Player.data.inventory.filter(i => 
            ['weapon', 'armor', 'accessory'].includes(i.type)
        );

        if (toSell.length === 0) return Msg.log("儲物袋內並無可售出的裝備。", "system");

        if (!confirm(`是否將這 ${toSell.length} 件裝備售換為靈石？`)) return;

        let totalGold = 0;
        toSell.forEach(item => {
            // 基礎價格根據稀有度與等級計算
            const basePrice = item.price || (item.rarity * 20) + (item.level || 1) * 5;
            totalGold += basePrice;
        });

        // 從背包移除
        Player.data.inventory = Player.data.inventory.filter(i => 
            !['weapon', 'armor', 'accessory'].includes(i.type)
        );

        Player.data.coin += totalGold;
        Msg.log(`♻️ 一鍵熔煉完成，獲得 ${totalGold} 靈石。`, "gold");
        
        Player.save();
        this.renderBag();
        if (window.Core) window.Core.updateUI();
    },

    /**
     * 🟢 新增：一鍵清理重複殘卷
     * 邏輯：保留每種殘卷(同名同卷數)各1份，其餘售出
     */
    sellDuplicateFragments() {
        if (!Player.data.inventory) return;

        const fragments = Player.data.inventory.filter(i => i.type === 'fragment');
        if (fragments.length === 0) return Msg.log("儲物袋內並無任何殘卷。", "system");

        let totalGold = 0;
        let sellCount = 0;

        // 遍歷所有殘卷，處理 count > 1 的部分
        fragments.forEach(item => {
            const count = item.count || 1;
            if (count > 1) {
                const duplicates = count - 1;
                const pricePerOne = item.price || 30; // 殘卷單價
                totalGold += duplicates * pricePerOne;
                sellCount += duplicates;
                item.count = 1; // 修正數量為 1
            }
        });

        if (sellCount === 0) return Msg.log("你所持有的殘卷皆為孤本，無需清理。", "system");

        Player.data.coin += totalGold;
        Msg.log(`📜 清理了 ${sellCount} 份重複殘卷，獲得 ${totalGold} 靈石。`, "gold");

        Player.save();
        this.renderBag();
        if (window.Core) window.Core.updateUI();
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
