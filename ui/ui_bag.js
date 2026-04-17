/**
 * V3.5.6 ui_bag.js (儲物袋 - 萬物歸一純淨版)
 * 職責：儲物袋渲染、分類篩選、裝備穿戴與道具使用
 * 修正：整合 Array(庫房法寶/煉器裝備) 與 Dictionary(丹藥/材料) 的空間法則衝突
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
        console.log("【UI_Bag】啟動儲物袋純淨陣法，空間法則已重組...");
        this.renderLayout();
        this.renderFilters();
        this.renderBag();
    },

    renderLayout() {
        const container = document.getElementById('page-bag');
        if (!container) return;

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
            { id: 'consumable', name: '丹藥' }, // 🌟 新增丹藥分類
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

    /**
     * 🌟 核心修正：將各方散落的數據整合為統一的渲染陣列
     */
    getNormalizedItems() {
        let allItems = [];
        const d = Player.data;
        if (!d) return allItems;

        // 1. 處理陣列型態的背包物品 (宗門庫房兌換的殘卷、鑰匙等，帶有 uuid)
        if (Array.isArray(d.inventory)) {
            d.inventory.forEach(item => {
                if (typeof item === 'object' && item !== null && item.uuid) {
                    allItems.push(item);
                }
            });
        }

        // 2. 處理字典型態的丹藥 (煉丹閣產出，附加在陣列上的 string key)
        if (d.inventory) {
            Object.keys(d.inventory).forEach(key => {
                // 過濾掉陣列原生的數字 index，只抓取自訂的文字 key
                if (isNaN(key) && typeof d.inventory[key] === 'number' && d.inventory[key] > 0) {
                    allItems.push({
                        uuid: 'dict_' + key, // 賦予虛擬 UUID 以便點擊使用
                        isDict: true,
                        name: key,
                        type: 'consumable',
                        count: d.inventory[key],
                        rarity: key.includes('修為') ? 4 : 3,
                        statTexts: [key === '修為丹' ? '蘊含天地靈氣，大幅提升修為。' : '療傷聖藥，迅速恢復氣血。']
                    });
                }
            });
        }

        // 3. 處理煉器大殿的神兵法寶 (存在獨立的 equipments 陣列)
        if (Array.isArray(d.equipments)) {
            d.equipments.forEach(eq => {
                // 自動分類：根據名稱判斷是武器、護甲還是飾品，以適應 V3.2 的篩選器
                let subType = 'weapon';
                if (eq.name.includes('甲') || eq.name.includes('袍') || eq.name.includes('鎧') || eq.name.includes('衣')) subType = 'armor';
                if (eq.name.includes('鏡') || eq.name.includes('簪') || eq.name.includes('佩') || eq.name.includes('符') || eq.name.includes('環')) subType = 'accessory';
                
                allItems.push({
                    ...eq,
                    type: subType, // 覆寫原本的 'equipment' 標籤
                    name: `${eq.name} +${eq.plus || 0}` // 將強化等級直接顯示在名字上
                });
            });
        }

        // 4. 處理基礎材料 (草、鐵)
        if (d.materials) {
            if (d.materials.herb > 0) {
                allItems.push({ uuid: 'dict_herb', isDict: true, name: '仙草', type: 'material', count: d.materials.herb, rarity: 2, statTexts: ['煉丹閣的基礎材料。'] });
            }
            if (d.materials.ore > 0) {
                allItems.push({ uuid: 'dict_ore', isDict: true, name: '玄鐵', type: 'material', count: d.materials.ore, rarity: 2, statTexts: ['煉器大殿的基礎材料。'] });
            }
        }

        return allItems;
    },

    renderBag() {
        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        const allItems = this.getNormalizedItems();

        if (allItems.length === 0) {
            bagGrid.innerHTML = '<div class="empty-msg">儲物袋封印中，感應不到氣息...</div>';
            return;
        }

        const filteredItems = allItems.filter(item => {
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
                actionBtn = `<button class="btn-eco-action btn-use" onclick="UI_Bag.useItem('${item.uuid}', event)">服用</button>`;
            }

            return `
                <div class="eco-list-card r-${rarity}">
                    <div class="eco-card-left">
                        <div class="eco-icon-box r-bg-${rarity}">${this.getItemIcon(item.type)}</div>
                        ${count > 1 ? `<div class="eco-item-count">x${count.toLocaleString()}</div>` : ''}
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
            fragment: '📜', material: '💎', special: '🎁', consumable: '💊'
        };
        return icons[type] || '📦';
    },

    /**
     * 處理物品使用與裝備邏輯
     */
    useItem(uuid, event) {
        let success = false;

        // 🌟 1. 處理字典型態的消耗品 (丹藥、材料)
        if (uuid.startsWith('dict_')) {
            const key = uuid.replace('dict_', '');
            
            if (key === 'herb' || key === 'ore') {
                Msg.log("❌ 基礎材料無法直接服用，請至煉丹閣或煉器大殿加工！", "system");
                return;
            }

            if (Player.data.inventory && Player.data.inventory[key] > 0) {
                Player.data.inventory[key]--;
                
                // 實作丹藥效果
                if (key === '修為丹') {
                    if (typeof Player.gainExp === 'function') {
                        Player.gainExp(50);
                    } else {
                        Player.data.exp += 50;
                    }
                    Msg.log("💊 吞服【修為丹】，藥力化開，修為大增！", "reward");
                } else if (key === '療傷藥') {
                    if (typeof Player.heal === 'function') {
                        Player.heal(100);
                    } else {
                        Player.data.hp = Math.min(Player.data.maxHp || 100, (Player.data.hp || 0) + 100);
                    }
                    Msg.log("💊 敷上【療傷藥】，氣血迅速恢復！", "reward");
                }
                
                Player.save();
                success = true;
            }
        } 
        // 🌟 2. 處理常規 UUID 物品與裝備 (呼叫 Player.js 邏輯)
        else {
            // 先嘗試從一般 inventory 找
            let item = null;
            if (Array.isArray(Player.data.inventory)) {
                item = Player.data.inventory.find(i => i.uuid === uuid);
            }
            // 若找不到，從 equipments 找
            if (!item && Array.isArray(Player.data.equipments)) {
                item = Player.data.equipments.find(i => i.uuid === uuid);
            }

            if (!item) return;

            if (['weapon', 'armor', 'accessory'].includes(item.type) || item.type === 'equipment') {
                if (typeof Player.equipItem === 'function') {
                    success = Player.equipItem(uuid);
                    if (success) Msg.log(`👕 你穿上了 【${item.name}】`, "reward");
                } else {
                    Msg.log("裝備系統尚未完全連結。", "system");
                }
            } else {
                if (typeof Player.consumeItem === 'function') {
                    success = Player.consumeItem(uuid);
                }
            }
        }

        // 🌟 3. 處理 UI 視覺反饋
        if (success) {
            if (window.FX && event) {
                window.FX.spawnPopText("吸收", 'player', '#4ade80');
            }
            this.renderBag();
            if (window.Core && window.Core.updateUI) {
                window.Core.updateUI();
            }
        }
    }
};

window.UI_Bag = UI_Bag;
