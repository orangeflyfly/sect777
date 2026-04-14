/**
 * V2.0 database.js
 * 職責：整合所有靜態數據，成為全遊戲唯一的「數據藏經閣」
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
    REGIONS
};

// 暴露給全域以利 Debug (開發完成後可移除)
window.DB = DB;
