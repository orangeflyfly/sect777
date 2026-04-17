/**
 * V3.5.9 database.js (天道演化 - 坊市規則擴充版)
 * 職責：整合數據、定義妖獸材料價值、提供資源回收價格配置
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

    SKILLS: {
        '烈焰斬': { id: 's01', isPassive: false, cd: 5, type: 'damage', multiplier: 1.5, effect: 'burn', chance: 0.3, icon: '🔥', desc: '凝聚烈焰的一擊，有機率灼燒敵人。' },
        '回春術': { id: 's02', isPassive: false, cd: 10, type: 'heal', multiplier: 0.8, icon: '✨', desc: '調動天地木靈氣，恢復自身傷勢。' },
        '青元劍訣': { id: 's03', isPassive: false, cd: 6, type: 'damage', multiplier: 1.2, effect: 'bleed', chance: 0.2, icon: '⚔️', desc: '劍氣縱橫，使敵人流血不止。' },
        '破軍劍擊': { id: 's04', isPassive: false, cd: 8, type: 'damage', multiplier: 2.5, effect: 'def_down', chance: 1.0, icon: '💥', desc: '大開大闔的霸道一擊，必定削弱敵人防禦。' },
        '天雷正法': { id: 's05', isPassive: false, cd: 15, type: 'true_damage', multiplier: 3.0, icon: '⚡', desc: '召喚九天玄雷，無視防禦的毀滅性打擊。' },
        '金蟬脫殼': { id: 's06', isPassive: false, cd: 20, type: 'heal_cleanse', multiplier: 0.5, icon: '🦋', desc: '瞬間遠遁並止血，解除身上所有負面狀態。' },
        '長春功': { id: 'p01', isPassive: true, type: 'auto_heal', multiplier: 0.02, icon: '🍃', desc: '每回合戰鬥自動恢復 2% 最大生命值。' },
        '嗜血魔經': { id: 'p02', isPassive: true, type: 'lifesteal', multiplier: 0.1, chance: 0.15, icon: '🧛', desc: '攻擊時有機率將傷害的 10% 轉化為自身血量。' },
        '劍心通明': { id: 'p03', isPassive: true, type: 'stat_buff', attr: 'crit', val: 5, icon: '👁️', desc: '基礎暴擊率永久提升 5%。' },
        '妖毒': { id: 'm01', isPassive: true, type: 'debuff', effect: 'poison', multiplier: 0.5, duration: 3, icon: '🤢' },
        '重錘': { id: 'm02', isPassive: true, type: 'damage', multiplier: 2.5, effect: 'stun', chance: 0.1, icon: '🔨' }
    },

    SHOP: {
        'consumables': [
            { id: 'i001', name: '低階靈石袋', type: 'special', price: 0, value: 500, desc: '裝滿靈石的小袋子，開啟後獲得 500 靈石。' },
            { id: 'c001', name: '小還丹', type: 'consumable', price: 100, effect: 'heal', value: 200, desc: '恢復 200 點氣血。' },
            { id: 'c002', name: '洗髓散', type: 'consumable', price: 1000, effect: 'reset_stats', desc: '重置所有屬性點，重新洗經伐骨。' }
        ],
        'materials': [
            // --- 基礎數值資源 (僅作顯示與定價參考) ---
            { id: 'herb', name: '仙草', type: 'material', price: 20, desc: '煉丹之本。' },
            { id: 'ore', name: '玄鐵', type: 'material', price: 30, desc: '煉器之基。' },
            
            // --- 🌟 妖獸掉落實體材料 (可在商店出售) ---
            { id: 'rabbit_fur', name: '柔軟兔毛', type: 'material', price: 15, rarity: 1 },
            { id: 'feather', name: '山雞翎羽', type: 'material', price: 20, rarity: 1 },
            { id: 'wolf_fang', name: '殘缺狼牙', type: 'material', price: 40, rarity: 1 },
            { id: 'wolf_hide', name: '灰狼皮', type: 'material', price: 100, rarity: 2 },
            { id: 'tiger_claw', name: '猛虎利爪', type: 'material', price: 250, rarity: 2 },
            { id: 'tiger_bone', name: '虎王壯骨', type: 'material', price: 600, rarity: 3 },
            { id: 'tiger_soul', name: '虎王精魂', type: "material", price: 2000, rarity: 4 },
            { id: 'snake_skin', name: '乾枯蛇皮', type: 'material', price: 120, rarity: 1 },
            { id: 'snake_gall', name: '赤腹蛇膽', type: 'material', price: 350, rarity: 2 },
            { id: 'water_bead', name: '水靈珠碎塊', type: 'material', price: 500, rarity: 2 },
            { id: 'ancient_iron', name: '鏽蝕古鐵', type: 'material', price: 450, rarity: 2 },
            { id: 'dragon_blood', name: '蛟龍真血', type: 'material', price: 2500, rarity: 4 },
            { id: 'dragon_scale', name: '惡蛟逆鱗', type: 'material', price: 8000, rarity: 5 },
            { id: 'golem_core', name: '傀儡動力核心', type: 'material', price: 10000, rarity: 5 },
            { id: 'boar_tusk', name: '魔化獠牙', type: 'material', price: 180, rarity: 2 },
            { id: 'spider_silk', name: '劇毒蛛絲', type: 'material', price: 220, rarity: 2 },
            { id: 'venom_sac', name: '毒囊', type: 'material', price: 400, rarity: 3 },
            { id: 'bat_wing', name: '嗜血蝠翼', type: 'material', price: 90, rarity: 1 },
            { id: 'ape_fur', name: '烈焰猿鬃', type: 'material', price: 800, rarity: 3 },
            { id: 'spirit_branch', name: '聚靈枯枝', type: 'material', price: 1200, rarity: 3 },
            { id: 'tree_heart', name: '萬年木心', type: 'material', price: 15000, rarity: 5 }
        ],
        'fragments': [
            { name: '殘卷：烈焰斬(卷一)', type: 'fragment', skillName: '烈焰斬', volume: 1, price: 150 },
            { name: '殘卷：回春術(卷一)', type: 'fragment', skillName: '回春術', volume: 1, price: 150 }
        ]
    },

    CONFIG: {
        MAX_BAG_SLOTS: 50,
        SKILL_UPGRADE_BOOST: 0.2,
        DOT_DAMAGE_PERCENT: 0.05,
        EQUIP_COMPRESSION: 0.1, 
        SELL_RATIO: 0.5, // 物品回收折扣 (原價 50%)
        REALM_NAMES: {
            1: "練氣期", 2: "築基期", 3: "結丹期", 4: "元嬰期", 5: "化神期"
        }
    }
};

window.DB = DB;
