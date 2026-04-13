/**
 * ItemFactory.js
 * 職責：根據 data_items.js 隨機生成具備詞條的裝備
 */
const ItemFactory = {
    // 隨機生成一件裝備
    createEquipment() {
        // 1. 隨機選一個前綴 (從 GAMEDATA.PREFIXES)
        const prefix = DATA.PREFIXES[Math.floor(Math.random() * DATA.PREFIXES.length)];
        // 2. 隨機選一個後綴 (從 GAMEDATA.SUFFIXES)
        const suffix = DATA.SUFFIXES[Math.floor(Math.random() * DATA.SUFFIXES.length)];

        return {
            uuid: 'it_' + Date.now(),
            name: prefix.name + suffix.name,
            type: suffix.type,
            rarity: this.determineRarity(prefix.value),
            stats: {
                [prefix.attr]: prefix.value,
                ...(suffix.baseAtk ? { atk: suffix.baseAtk } : {}),
                ...(suffix.baseHp ? { hp: suffix.baseHp } : {})
            }
        };
    },

    determineRarity(val) {
        if (val > 1000) return 5; // 神品
        if (val > 100) return 4;  // 極品
        return 1;
    }
};
