/**
 * V3.5.8 ui_bag.js (儲物袋 - 萬物歸一裝備連動版)
 * 職責：整合顯示丹藥(字典)與神兵(陣列)、實作真實的裝備穿脫與戰力加成系統
 * 位置：/ui/ui_bag.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

const ATTR_MAP = {
    'hp': '血量',
    'atk': '攻擊',
    'def': '防禦'
};

export const UI_Bag = {
    currentFilter: 'all',

    init() {
        console.log("【UI_Bag】儲物袋空間法則已重組，神兵裝備系統正式連線...");
        
        // 🌟 確保玩家擁有「裝備欄位」的數據結構
        if (Player.data && !Player.data.equipped) {
            Player.data.equipped = { weapon: null, armor: null, accessory: null };
        }
        
        this.renderLayout();
        this.renderFilters();
        this.renderBag();
    },

    renderLayout() {
        const container = document.getElementById('page-bag');
        if (!container) return;

        container.innerHTML = `
            <div class="page-title">個人儲物袋</div>
            <div id="bag-filters" class="bag-filters" style="margin-bottom:10px;"></div>
            <div id="bag-content" style="padding:0 15px 20px 15px; overflow-y:auto; height:calc(100vh - 150px);"></div>
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
            { id: 'consumable', name: '丹藥' },
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
     * 🌟 自動判斷法寶部位
     */
    getEquipSlot(name) {
        if (name.includes('甲') || name.includes('袍') || name.includes('鎧') || name.includes('衣')) return 'armor';
        if (name.includes('鏡') || name.includes('簪') || name.includes('佩') || name.includes('符') || name.includes('環')) return 'accessory';
        return 'weapon'; // 劍、斧、刃 等皆歸類為武器
    },

    /**
     * 🌟 核心修正：將各方散落的數據整合為統一的渲染陣列
     */
    getNormalizedItems() {
        let allItems = [];
        const d = Player.data;
        if (!d) return allItems;

        // 1. 處理煉器大殿的神兵法寶 (扣除已裝備在身上的)
        if (Array.isArray(d.equipments)) {
            d.equipments.forEach(eq => {
                const slot = this.getEquipSlot(eq.name);
                const isEquipped = (d.equipped.weapon === eq.uuid || d.equipped.armor === eq.uuid || d.equipped.accessory === eq.uuid);
                
                if (!isEquipped) {
                    allItems.push({
                        ...eq,
                        type: slot, // 賦予正確的分類 (weapon / armor / accessory)
                        displayName: `${eq.name} +${eq.plus || 0}`
                    });
                }
            });
        }

        // 2. 處理字典型態的丹藥與材料
        if (d.inventory) {
            Object.keys(d.inventory).forEach(key => {
                if (isNaN(key) && typeof d.inventory[key] === 'number' && d.inventory[key] > 0) {
                    allItems.push({
                        uuid: 'dict_' + key, 
                        name: key,
                        displayName: key,
                        type: key.includes('鑰匙') || key.includes('卷') ? 'special' : 'consumable',
                        count: d.inventory[key],
                        rarity: key.includes('造化') || key.includes('修為') ? 4 : 3,
                        statTexts: [key === '修為丹' ? '蘊含天地靈氣，大幅提升修為。' : '療傷聖藥，迅速恢復氣血。']
                    });
                }
            });
        }

        // 3. 處理基礎天地靈材
        if (d.materials) {
            if (d.materials.herb > 0) {
                allItems.push({ uuid: 'dict_herb', name: '仙草', displayName: '仙草', type: 'material', count: d.materials.herb, rarity: 2, statTexts: ['煉丹閣的基礎材料。'] });
            }
            if (d.materials.ore > 0) {
                allItems.push({ uuid: 'dict_ore', name: '玄鐵', displayName: '玄鐵', type: 'material', count: d.materials.ore, rarity: 2, statTexts: ['煉器大殿的基礎材料。'] });
            }
        }

        return allItems;
    },

    renderBag() {
        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid || !Player.data) return;

        const d = Player.data;

        // --- 🌟 頂部：目前裝備面板 ---
        let equippedHtml = `
            <div style="background:rgba(0,0,0,0.4); border-radius:8px; padding:15px; margin-bottom:20px; border:1px solid rgba(251,191,36,0.3);">
                <h4 style="color:#fbbf24; margin:0 0 10px 0; border-bottom:1px solid rgba(251,191,36,0.3); padding-bottom:5px;">⚔️ 當前裝備法寶</h4>
                <div style="display:flex; gap:10px; flex-direction:column;">
        `;

        const slots = [
            { id: 'weapon', name: '武器', icon: '⚔️' },
            { id: 'armor', name: '護甲', icon: '👕' },
            { id: 'accessory', name: '飾品', icon: '💍' }
        ];

        slots.forEach(s => {
            const uuid = d.equipped[s.id];
            if (uuid && Array.isArray(d.equipments)) {
                const item = d.equipments.find(i => i.uuid === uuid);
                if (item) {
                    const rarityColors = ['#fff', '#4ade80', '#60a5fa', '#a855f7', '#fbbf24'];
                    const color = rarityColors[item.rarity - 1] || '#fff';
                    equippedHtml += `
                        <div style="background:rgba(255,255,255,0.05); border-left:3px solid ${color}; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="color:${color}; font-weight:bold; font-size:14px;">${s.icon} ${item.name} <span style="color:#fbbf24;">+${item.plus}</span></div>
                                <div style="font-size:11px; color:#94a3b8; margin-top:3px;">攻擊 +${item.stats.atk} | 防禦 +${item.stats.def}</div>
                            </div>
                            <button onclick="UI_Bag.unequip('${s.id}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">卸下</button>
                        </div>
                    `;
                }
            } else {
                // 空欄位顯示
                equippedHtml += `
                    <div style="background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); padding:10px 12px; border-radius:6px; display:flex; align-items:center; color:#64748b; font-size:13px;">
                        ${s.icon} 尚無${s.name}
                    </div>
                `;
            }
        });
        equippedHtml += `</div></div>`;

        // --- 🌟 底部：儲物袋物品列表 ---
        const allItems = this.getNormalizedItems();
        const filteredItems = allItems.filter(item => {
            if (this.currentFilter === 'all') return true;
            return item.type === this.currentFilter;
        });

        let itemsHtml = `<div style="margin-bottom:10px; color:#cbd5e1; font-size:14px; font-weight:bold;">📦 儲物袋物品</div>`;

        if (filteredItems.length === 0) {
            itemsHtml += '<div class="empty-msg" style="text-align:center; color:#64748b; padding:20px;">此分類尚無寶物。</div>';
        } else {
            itemsHtml += filteredItems.map(item => {
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
                    actionBtn = `<button class="btn-eco-action btn-equip" onclick="UI_Bag.equip('${item.uuid}')" style="background:#3b82f6; color:white; border:none; padding:6px 15px; border-radius:4px; font-weight:bold; cursor:pointer;">裝備</button>`;
                } else if (item.type === 'consumable') {
                    actionBtn = `<button class="btn-eco-action btn-use" onclick="UI_Bag.useConsumable('${item.name}')" style="background:#10b981; color:white; border:none; padding:6px 15px; border-radius:4px; font-weight:bold; cursor:pointer;">服用</button>`;
                }

                return `
                    <div class="eco-list-card r-${rarity}" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="eco-icon-box r-bg-${rarity}" style="font-size:24px;">${this.getItemIcon(item.type)}</div>
                            <div>
                                <div class="eco-item-name r-txt-${rarity}" style="font-weight:bold; font-size:14px;">${item.displayName} ${count > 1 ? `<span style="color:#fcd34d; font-size:12px;">x${count.toLocaleString()}</span>` : ''}</div>
                                <div class="eco-item-desc" style="font-size:11px; color:#94a3b8; margin-top:3px;">${statsDesc}</div>
                            </div>
                        </div>
                        <div>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            }).join('');
        }

        bagGrid.innerHTML = equippedHtml + itemsHtml;
    },

    getItemIcon(type) {
        const icons = { 
            weapon: '⚔️', armor: '👕', accessory: '💍', 
            fragment: '📜', material: '💎', special: '🗝️', consumable: '💊'
        };
        return icons[type] || '📦';
    },

    /**
     * 🌟 實作真實的裝備穿脫邏輯 (直接增加主角基礎屬性)
     */
    equip(uuid) {
        const d = Player.data;
        const item = d.equipments.find(i => i.uuid === uuid);
        if (!item) return;

        const slot = this.getEquipSlot(item.name);

        // 1. 若有舊裝備，先卸下並扣除舊屬性
        const oldUuid = d.equipped[slot];
        if (oldUuid) {
            this.unequip(slot, true); // 靜默卸下
        }

        // 2. 裝備新法寶
        d.equipped[slot] = item.uuid;
        
        // 3. 增加真實戰力屬性
        d.atk = (d.atk || 10) + (item.stats.atk || 0);
        d.def = (d.def || 5) + (item.stats.def || 0);

        Player.save();
        Msg.log(`👕 裝備成功！你穿上了【${item.name} +${item.plus || 0}】，戰力大增！`, "reward");
        
        if (window.FX) window.FX.spawnPopText("戰力提升", 'player', '#fbbf24');
        this.renderBag();
        if (window.Core) window.Core.updateUI();
    },

    unequip(slot, silent = false) {
        const d = Player.data;
        const uuid = d.equipped[slot];
        if (!uuid) return;

        const item = d.equipments.find(i => i.uuid === uuid);
        if (item) {
            // 扣除裝備賦予的屬性，確保主角基礎數值不跌破底線
            d.atk = Math.max(10, (d.atk || 10) - (item.stats.atk || 0));
            d.def = Math.max(5,  (d.def || 5) - (item.stats.def || 0));
        }

        d.equipped[slot] = null;
        Player.save();
        
        if (!silent) {
            Msg.log(`🛡️ 卸下了裝備。`, "system");
            this.renderBag();
            if (window.Core) window.Core.updateUI();
        }
    },

    /**
     * 🌟 實作真實的丹藥服用邏輯
     */
    useConsumable(key) {
        if (!Player.data.inventory || Player.data.inventory[key] <= 0) return;
        
        Player.data.inventory[key]--;
        
        if (key === '修為丹') {
            if (typeof Player.gainExp === 'function') Player.gainExp(50);
            else Player.data.exp += 50;
            Msg.log("💊 吞服【修為丹】，藥力化開，修為大增 +50！", "reward");
            if (window.FX) window.FX.spawnPopText("修為大增", 'player', '#60a5fa');
        } else if (key === '療傷藥') {
            if (typeof Player.heal === 'function') Player.heal(100);
            else Player.data.hp = Math.min(Player.data.maxHp || 100, (Player.data.hp || 0) + 100);
            Msg.log("💊 敷上【療傷藥】，氣血迅速恢復 +100！", "reward");
            if (window.FX) window.FX.spawnPopText("恢復", 'player', '#4ade80');
        }

        Player.save();
        this.renderBag();
        if (window.Core) window.Core.updateUI();
    }
};

window.UI_Bag = UI_Bag;
