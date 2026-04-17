/**
 * V3.5.8 ui_bag.js (儲物袋 - 萬物歸一裝備修復版)
 * 職責：儲物袋渲染、分類篩選、裝備穿戴與道具使用
 * 修正：清理陣紋重疊、實作真實的裝備穿脫邏輯、修復丹藥與神兵的空間法則衝突
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

        // 🟢 瘦身：已經把「一鍵售出」等按鈕移除了，這裡只留標題和篩選區，並加入裝備欄位區
        container.innerHTML = `
            <div class="page-title">個人儲物袋</div>
            <div id="bag-equipped" style="margin-bottom: 15px;"></div>
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
     * 🌟 自動判斷法寶部位
     */
    getEquipSlot(name) {
        if (name.includes('甲') || name.includes('袍') || name.includes('鎧') || name.includes('衣') || name.includes('鏡')) return 'armor';
        if (name.includes('簪') || name.includes('佩') || name.includes('符') || name.includes('環')) return 'accessory';
        return 'weapon'; // 劍、斧、刃 等皆歸類為武器
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
                        rarity: key.includes('造化') || key.includes('修為') ? 4 : 3,
                        statTexts: [key === '修為丹' ? '蘊含天地靈氣，大幅提升修為。' : '療傷聖藥，迅速恢復氣血。']
                    });
                }
            });
        }

        // 3. 處理煉器大殿的神兵法寶 (存在獨立的 equipments 陣列)
        if (Array.isArray(d.equipments)) {
            d.equipments.forEach(eq => {
                // 自動分類：根據名稱判斷是武器、護甲還是飾品，以適應 V3.2 的篩選器
                let subType = this.getEquipSlot(eq.name);
                
                // 檢查是否已被裝備，若被裝備則不顯示在背包清單中
                const isEquipped = (d.equipped && (d.equipped.weapon === eq.uuid || d.equipped.armor === eq.uuid || d.equipped.accessory === eq.uuid));
                
                if (!isEquipped) {
                    allItems.push({
                        ...eq,
                        type: subType, // 覆寫原本的 'equipment' 標籤
                        name: `${eq.name} +${eq.plus || 0}` // 將強化等級直接顯示在名字上
                    });
                }
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
        const equipGrid = document.getElementById('bag-equipped');
        if (!bagGrid || !equipGrid) return;

        if (!Player.data) return;

        // --- 🌟 渲染當前裝備區塊 ---
        this.renderEquipped(equipGrid);

        // --- 🌟 渲染背包內容區塊 ---
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
                // 🌟 修復：直接呼叫 UI_Bag.equipItem 而非依賴殘缺的 useItem
                actionBtn = `<button class="btn-eco-action btn-equip" onclick="UI_Bag.equipItem('${item.uuid}', event)">裝備</button>`;
            } else if (item.type === 'consumable') {
                actionBtn = `<button class="btn-eco-action btn-use" onclick="UI_Bag.useItem('${item.uuid}', event)">服用</button>`;
            } else if (item.type === 'fragment' || item.type === 'special') {
                actionBtn = `<button class="btn-eco-action btn-use" onclick="UI_Bag.useItem('${item.uuid}', event)">使用</button>`;
            }

            // 保留你原汁原味的 HTML 與 CSS 類別結構
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

    /**
     * 🌟 渲染頂部裝備欄 (使用與 eco-list-card 相容的樣式)
     */
    renderEquipped(container) {
        const d = Player.data;
        if (!d.equipped) return;

        const slots = [
            { id: 'weapon', name: '武器', typeIcon: '⚔️' },
            { id: 'armor', name: '護甲', typeIcon: '👕' },
            { id: 'accessory', name: '飾品', typeIcon: '💍' }
        ];

        let html = `<div style="font-size:13px; color:#cbd5e1; margin-bottom:8px; font-weight:bold;">⚔️ 當前裝備</div>`;
        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;

        slots.forEach(s => {
            const uuid = d.equipped[s.id];
            if (uuid && Array.isArray(d.equipments)) {
                const item = d.equipments.find(i => i.uuid === uuid);
                if (item) {
                    const rarity = item.rarity || 1;
                    const statsDesc = Object.entries(item.stats).map(([k, v]) => `${ATTR_MAP[k] || k} +${v}`).join(' ');
                    
                    html += `
                        <div class="eco-list-card r-${rarity}" style="border: 1px solid #fbbf24;">
                            <div class="eco-card-left">
                                <div class="eco-icon-box r-bg-${rarity}">${s.typeIcon}</div>
                            </div>
                            <div class="eco-card-mid">
                                <div class="eco-item-name r-txt-${rarity}">${item.name} <span style="color:#fbbf24; font-size:12px;">+${item.plus || 0}</span></div>
                                <div class="eco-item-desc">${statsDesc}</div>
                            </div>
                            <div class="eco-card-right">
                                <button class="btn-eco-action" style="background:#ef4444; color:white; border:none;" onclick="UI_Bag.unequipItem('${s.id}')">卸下</button>
                            </div>
                        </div>
                    `;
                }
            } else {
                html += `
                    <div class="eco-list-card" style="opacity: 0.5;">
                        <div class="eco-card-left">
                            <div class="eco-icon-box" style="background:transparent; border:1px dashed #64748b;">${s.typeIcon}</div>
                        </div>
                        <div class="eco-card-mid">
                            <div class="eco-item-name" style="color:#64748b;">尚無${s.name}</div>
                        </div>
                    </div>
                `;
            }
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    getItemIcon(type) {
        const icons = { 
            weapon: '⚔️', armor: '👕', accessory: '💍', 
            fragment: '📜', material: '💎', special: '🎁', consumable: '💊'
        };
        return icons[type] || '📦';
    },

    /**
     * 🌟 實作真實的裝備穿上邏輯 (直接寫在 UI 避免依賴殘缺的 player.js)
     */
    equipItem(uuid, event) {
        const d = Player.data;
        const item = d.equipments.find(i => i.uuid === uuid);
        if (!item) return;

        const slot = this.getEquipSlot(item.name);

        // 1. 若有舊裝備，先卸下並扣除舊屬性
        const oldUuid = d.equipped[slot];
        if (oldUuid) {
            this.unequipItem(slot, true); // 靜默卸下舊裝備
        }

        // 2. 裝備新法寶
        d.equipped[slot] = item.uuid;
        
        // 3. 增加真實戰力屬性 (確保主角有這兩個屬性)
        d.atk = (d.atk || 10) + (item.stats.atk || 0);
        d.def = (d.def || 5) + (item.stats.def || 0);

        Player.save();
        Msg.log(`👕 裝備成功！你穿上了【${item.name} +${item.plus || 0}】，戰力大增！`, "reward");
        
        if (window.FX && event) {
            window.FX.spawnPopText("戰力提升", 'player', '#fbbf24');
        }
        
        this.renderBag();
        if (window.Core && window.Core.updateUI) window.Core.updateUI();
    },

    /**
     * 🌟 實作真實的裝備卸下邏輯
     */
    unequipItem(slot, silent = false) {
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
            if (window.Core && window.Core.updateUI) window.Core.updateUI();
        }
    },

    /**
     * 處理丹藥與道具使用邏輯
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
        // 🌟 2. 處理常規 UUID 物品 (如殘卷，呼叫 Player.js 邏輯)
        else {
            if (typeof Player.consumeItem === 'function') {
                success = Player.consumeItem(uuid);
            } else {
                Msg.log("特殊物品系統尚未完全連結。", "system");
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
