/**
 * V2.4 database.js (神通重塑版 - 文武雙全)
 * 職責：定義主/被動技能法則、新神通庫、以及天道平衡權重
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

    // 🟢 核心重塑：天道神通庫 (區分主動與被動)
    SKILLS: {
        // --- 【主動神通】 (需玩家手動點擊，具備冷卻時間) ---
        '烈焰斬': { 
            id: 's01', isPassive: false, cd: 5, 
            type: 'damage', multiplier: 1.5, effect: 'burn', chance: 0.3, 
            desc: '凝聚烈焰的一擊，有機率灼燒敵人。' 
        },
        '回春術': { 
            id: 's02', isPassive: false, cd: 10, 
            type: 'heal', multiplier: 0.8, 
            desc: '調動天地木靈氣，恢復自身傷勢。' 
        },
        '青元劍訣': { 
            id: 's03', isPassive: false, cd: 6, 
            type: 'damage', multiplier: 1.2, effect: 'bleed', chance: 0.2, 
            desc: '劍氣縱橫，使敵人流血不止。' 
        },
        '破軍劍擊': { 
            id: 's04', isPassive: false, cd: 8, 
            type: 'damage', multiplier: 2.5, effect: 'def_down', chance: 1.0, 
            desc: '大開大闔的霸道一擊，必定削弱敵人防禦。' 
        },
        '天雷正法': { 
            id: 's05', isPassive: false, cd: 15, 
            type: 'true_damage', multiplier: 3.0, 
            desc: '召喚九天玄雷，無視防禦的毀滅性打擊。' 
        },
        '金蟬脫殼': { 
            id: 's06', isPassive: false, cd: 20, 
            type: 'heal_cleanse', multiplier: 0.5, 
            desc: '瞬間遠遁並止血，解除身上所有負面狀態。' 
        },

        // --- 【被動神通】 (後台自動判定，機率觸發或屬性加持) ---
        '長春功': { 
            id: 'p01', isPassive: true, 
            type: 'auto_heal', multiplier: 0.02, 
            desc: '每回合戰鬥自動恢復 2% 最大生命值。' 
        },
        '嗜血魔經': { 
            id: 'p02', isPassive: true, 
            type: 'lifesteal', multiplier: 0.1, chance: 0.15, 
            desc: '攻擊時有機率將傷害的 10% 轉化為自身血量。' 
        },
        '劍心通明': { 
            id: 'p03', isPassive: true, 
            type: 'stat_buff', attr: 'crit', val: 5, 
            desc: '基礎暴擊率永久提升 5%。' 
        },

        // --- 【妖獸專屬】 (通常視為敵方自動施放) ---
        '妖毒': { id: 'm01', isPassive: true, type: 'debuff', effect: 'poison', multiplier: 0.5, duration: 3, desc: '劇毒入骨。' },
        '重錘': { id: 'm02', isPassive: true, type: 'damage', multiplier: 2.5, effect: 'stun', chance: 0.1, desc: '重擊神魂。' }
    },

    // 🟢 天道配置更新
    CONFIG: {
        SKILL_UPGRADE_BOOST: 0.2,
        DOT_DAMAGE_PERCENT: 0.05,
        // 新增：裝備數值極限壓縮率
        EQUIP_COMPRESSION: 0.1, 
        REALM_NAMES: {
            1: "練氣期", 2: "築基期", 3: "結丹期", 4: "元嬰期", 5: "化神期"
        }
    }
};

window.DB = DB;
