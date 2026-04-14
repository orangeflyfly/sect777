/**
 * V2.0 ui_bag.js (飛升模組版 - 屬性中文化顯影)
 * 職責：儲物袋介面管理、物品分類篩選、裝備與消耗品使用對接
 * 位置：/ui/ui_bag.js
 */

// 1. 導入必要的神識模組
import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

// 🟢 新增：翻譯對照表 (確保舊存檔內的裝備也能即時翻譯)
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

    /**
     * 初始化過濾器按鈕
     */
    init() {
        const filterContainer = document.getElementById('bag-filters');
        if (!filterContainer) return;

        console.log("【UI_Bag】初始化儲物袋過濾陣法...");

        const filters = [
            { id: 'all', name: '全部' },
            { id: 'weapon', name: '武器' },
            { id: 'armor', name: '護甲' },
            { id: 'accessory', name: '飾品' }, // 配合資料庫結構補齊
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

    /**
     * 切換篩選類別
     */
    setFilter(type) {
        this.currentFilter = type;
        this.init(); 
        this.renderBag();
    },

    /**
     * 核心：渲染儲物袋內容
     */
    renderBag() {
        // --- 關鍵修正：自動喚醒分類按鈕 (保留道友原始邏輯) ---
        const filterContainer = document.getElementById('bag-filters');
        if (filterContainer && filterContainer.innerHTML.trim() === '') {
            this.init(); 
        }
        // -------------------------------------------------

        const bagGrid = document.getElementById('bag-content');
        if (!bagGrid) return;

        // 檢查修士儲物袋是否異常
        if (!Player.data || !Player.data.inventory) {
            bagGrid.innerHTML = '<div class="empty-msg">儲物袋封印中，感應不到氣息...</div>';
            return;
        }

        // 進行類別篩選
        const filteredItems = Player.data.inventory.filter(item => {
            if (this.currentFilter === 'all') return true;
            return item.type === this.currentFilter;
        });

        if (filteredItems.length === 0) {
            bagGrid.innerHTML = '<div class="empty-msg">此分類尚無寶物。</div>';
            return;
        }

        // 渲染列表內容
        bagGrid.innerHTML = filteredItems.map(item => {
            // 🟢 修正：優先讀取中文烙印 (statTexts)，若無則即時翻譯舊裝備
            let statsDesc = '無特殊加成';
            if (item.statTexts && item.statTexts.length > 0) {
                statsDesc = item.statTexts.join(' ');
            } else if (item.stats) {
                statsDesc = Object.entries(item.stats).map(([k, v]) => `${ATTR_MAP[k] || k} +${v}`).join(' ');
            }
            
            const rarity = item.rarity || 1;
            
            let actionBtn = '';
            // 根據物品種類決定操作按鈕
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

    /**
     * 獲取對應種類圖標
     */
    getItemIcon(type) {
        const icons = { 
            weapon: '⚔️', 
            armor: '👕', 
            accessory: '💍', 
            fragment: '📜', 
            material: '💎', 
            special: '🎁' 
        };
        return icons[type] || '📦';
    },

    /**
     * 使用物品邏輯 (對接 Player 模組)
     */
    useItem(uuid, event) {
    const item = Player.data.inventory.find(i => i.uuid === uuid);
    if (!item) return;

    let success = false;
    
    if (['weapon', 'armor', 'accessory'].includes(item.type)) {
        success = Player.equipItem(uuid);
        if (success) Msg.log(`👕 你穿上了 【${item.name}】`, "reward");
    } else {
        // 這裡會執行我們在 Player.js 寫的「五合一」或「已習得」判定
        success = Player.consumeItem(uuid);
    }

    // 🟢 重點：即使失敗，Player.consumeItem 裡面也會透過 Msg.log 發出警告
    // 刷新 UI 讓玩家看到結果
    this.renderBag();
    if (window.Core) window.Core.updateUI();
}

        // 執行成功後，刷新畫面與全域狀態
        if (success) {
            // 對接 UI_Stats 的飄字反饋 (若是模組未載入則跳過)
            if (window.UI_Stats && event) {
                // 如果 UI_Stats 有對應方法則呼叫
                if (typeof window.UI_Stats.createFloatingText === 'function') {
                    window.UI_Stats.createFloatingText(event.target.closest('.eco-card-right'), "完成");
                }
            }
            
            this.renderBag(); // 刷新儲物袋列表
            
            // 刷新全域數據 (血量、靈石等)
            if (window.Core) {
                window.Core.updateUI();
            }
        }
    }
};

// ==========================================
// 🛡️ 全域對接鎖
// ==========================================
window.UI_Bag = UI_Bag;
