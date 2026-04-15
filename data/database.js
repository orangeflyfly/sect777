/**
 * V2.3 database.js (飛升模組版 - 萬法歸宗)
 * 職責：整合所有靜態數據，並定義天道技能法則與平衡權重
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

    // 🟢 新增：天道技能法則 (定義技能的效果類型與基礎數值)
    SKILLS: {
        '烈焰斬': { id: 's01', type: 'damage', multiplier: 1.5, effect: 'burn', chance: 0.3, desc: '附帶灼燒效果的強力一擊' },
        '回春術': { id: 's02', type: 'heal', multiplier: 0.8, desc: '凝聚天地靈氣修復傷勢' },
        '青元劍訣': { id: 's03', type: 'damage', multiplier: 1.2, effect: 'bleed', chance: 0.2, desc: '劍氣縱橫，使敵人流血不止' },
        // 妖獸專屬技能
        '妖毒': { id: 'm01', type: 'debuff', effect: 'poison', multiplier: 0.5, duration: 3, desc: '劇毒入骨，每回合持續扣血' },
        '重錘': { id: 'm02', type: 'damage', multiplier: 2.5, effect: 'stun', chance: 0.1, desc: '勢不可擋的重擊，有機率震懾神魂' }
    },

    // 🟢 新增：平衡權重配置
    CONFIG: {
        // 神通升級倍率：每升一級增加 20% 的技能倍率
        SKILL_UPGRADE_BOOST: 0.2,
        // 狀態異常傷害：中毒每回合扣除最大血量的 5%
        DOT_DAMAGE_PERCENT: 0.05,
        // 裝備稀有度名稱定義
        REALM_NAMES: {
            1: "練氣期", 2: "築基期", 3: "結丹期", 4: "元嬰期", 5: "化神期"
        }
    }
};

window.DB = DB;
