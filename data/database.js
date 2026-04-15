/**
 * V2.7 database.js
 * 職責：整合全域數據、定義神通圖示與數值、實裝坊市(SHOP)清單、天道平衡配置
 * 位置：/data/database.js
 */

import { ITEMS, PREFIXES, SUFFIXES, FRAGMENTS } from './data_items.js';
import { MONSTERS } from './data_monsters.js';
import { REGIONS } from './data_world.js';

export const DB = {
    ITEMS,
    PREFIXES,
    SUFFIXES,
    FRAGMENTS,
    MONSTERS,
    REGIONS,

    // 🟢 核心：天道神通庫 (同步 UI 圖示與數值)
    SKILLS: {
        // --- 【主動神通】 ---
        '烈焰斬': { 
            id: 's01', isPassive: false, cd: 5, 
            type: 'damage', multiplier: 1.5, effect: 'burn', chance: 0.3, 
            icon: '🔥', // 🟢 同步：確保歷練按鈕與特寫一致
            desc: '凝聚烈焰的一擊，有機率灼燒敵人。' 
        },
        '回春術': { 
            id: 's02', isPassive: false, cd: 10, 
            type: 'heal', multiplier: 0.8, 
            icon: '✨', 
            desc: '調動天地木靈氣，恢復自身傷勢。' 
        },
        '青元劍訣': { 
            id: 's03', isPassive: false, cd: 6, 
            type: 'damage', multiplier: 1.2, effect: 'bleed', chance: 0.2, 
            icon: '⚔️',
            desc: '劍氣縱橫，使敵人流血不止。' 
        },
        '破軍劍擊': { 
            id: 's04', isPassive: false, cd: 8, 
            type: 'damage', multiplier: 2.5, effect: 'def_down', chance: 1.0, 
            icon: '💥',
            desc: '大開大闔的霸道一擊，必定削弱敵人防禦。' 
        },
        '天雷正法': { 
            id: 's05', isPassive: false, cd: 15, 
            type: 'true_damage', multiplier: 3.0, 
            icon: '⚡',
            desc: '召喚九天玄雷，無視防禦的毀滅性打擊。' 
        },
        '金蟬脫殼': { 
            id: 's06', isPassive: false, cd: 20, 
            type: 'heal_cleanse', multiplier: 0.5, 
            icon: '🦋',
            desc: '瞬間遠遁並止血，解除身上所有負面狀態。' 
        },

        // --- 【被動神通】 ---
        '長春功': { 
            id: 'p01', isPassive: true, 
            type: 'auto_heal', multiplier: 0.02, 
            icon: '🍃',
            desc: '每回合戰鬥自動恢復 2% 最大生命值。' 
        },
        '嗜血魔經': { 
            id: 'p02', isPassive: true, 
            type: 'lifesteal', multiplier: 0.1, chance: 0.15, 
            icon: '🧛',
            desc: '攻擊時有機率將傷害的 10% 轉化為自身血量。' 
        },
        '劍心通明': { 
            id: 'p03', isPassive: true, 
            type: 'stat_buff', attr: 'crit', val: 5, 
            icon: '👁️',
            desc: '基礎暴擊率永久提升 5%。' 
        },

        // --- 【妖獸專屬】 ---
        '妖毒': { id: 'm01', isPassive: true, type: 'debuff', effect: 'poison', multiplier: 0.5, duration: 3, icon: '🤢' },
        '重錘': { id: 'm02', isPassive: true, type: 'damage', multiplier: 2.5, effect: 'stun', chance: 0.1, icon: '🔨' }
    },

    // 🟢 核心：坊市法則 (新增商店物資)
    // 職責：定義商店貨架內容
    SHOP: {
        'consumables': [
            { id: 'i001', name: '低階靈石袋', type: 'special', price: 0, value: 500, desc: '裝滿靈石的小袋子，開啟後獲得 500 靈石。' },
            { id: 'c001', name: '小還丹', type: 'consumable', price: 100, effect: 'heal', value: 200, desc: '恢復 200 點氣血。' },
            { id: 'c002', name: '洗髓散', type: 'consumable', price: 1000, effect: 'reset_stats', desc: '重置所有屬性點，重新洗經伐骨。' }
        ],
        'materials': [
            { id: 'm001', name: '凡鐵礦', type: 'material', price: 50, desc: '基礎修繕與煉器材料。' },
            { id: 'm002', name: '靈木', type: 'material', price: 50, desc: '擴建宗門設施必備。' },
            { id: 'm003', name: '止血草', type: 'material', price: 30, desc: '煉製丹藥的基礎材料。' }
        ],
        'fragments': [
            // 商店隨機出售殘卷的範例 (實際邏輯可在 UI_Shop 中隨機生成)
            { name: '殘卷：烈焰斬(卷一)', type: 'fragment', skillName: '烈焰斬', volume: 1, price: 150 },
            { name: '殘卷：回春術(卷一)', type: 'fragment', skillName: '回春術', volume: 1, price: 150 }
        ]
    },

    // 🟢 天道配置更新
    CONFIG: {
        MAX_BAG_SLOTS: 50,           // 🟢 儲物袋上限
        SKILL_UPGRADE_BOOST: 0.2,    // 每升一級神通增強 20%
        DOT_DAMAGE_PERCENT: 0.05,
        EQUIP_COMPRESSION: 0.1, 
        SELL_RATIO: 0.5,             // 物品售出折扣 (原價 50%)
        REALM_NAMES: {
            1: "練氣期", 2: "築基期", 3: "結丹期", 4: "元嬰期", 5: "化神期"
        }
    }
};

window.DB = DB;
