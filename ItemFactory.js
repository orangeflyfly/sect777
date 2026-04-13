/**
 * ItemFactory.js
 * 職責：裝備生成、隨機詞條組合、稀有度計算
 */
const ItemFactory = {
    /**
     * 隨機生成一件裝備
     * @param {number} level - 影響生成的基礎強度 (預留)
     */
    createEquipment(level = 1) {
        const d = window.DATA || window.GAMEDATA;
        if (!d || !d.PREFIXES || !d.SUFFIXES) {
            console.error("【天工爐】資料庫尚未備齊，無法煉製。");
            return null;
        }

        // 1. 隨機抽選前綴 (Prefix) 與 後綴 (Suffix)
        const prefix = d.PREFIXES[Math.floor(Math.random() * d.PREFIXES.length)];
        const suffix = d.SUFFIXES[Math.floor(Math.random() * d.SUFFIXES.length)];

        // 2. 判定稀有度 (根據前綴數值或機率)
        const rarity = this.calculateRarity(prefix.value);

        // 3. 構建屬性物件
        const stats = {};
        // 處理前綴屬性 (例如: str: 10)
        stats[prefix.attr] = prefix.value;
        // 處理後綴基礎屬性
        if (suffix.baseAtk) stats.atk = (stats.atk || 0) + suffix.baseAtk;
        if (suffix.baseHp) stats.hp = (stats.hp || 0) + suffix.baseHp;

        // 4. 生成最終裝備物件
        const equipment = {
            uuid: 'it_' + Date.now() + Math.random().toString(36).substr(2, 5),
            name: `${prefix.name}${suffix.name}`,
            type: suffix.type, // 'weapon', 'armor', 'accessory'
            rarity: rarity,
            stats: stats,
            price: prefix.value * 5 + (suffix.baseAtk || 0) * 2, // 隨機計算價值
            desc: `一件帶有${prefix.name}氣息的${suffix.name}。`
        };

        return equipment;
    },

    /**
     * 根據數值計算稀有度
     * 對應 CSS: .r-1 到 .r-5
     */
    calculateRarity(val) {
        if (val >= 2000) return 5; // 神品
        if (val >= 300) return 4;  // 極品
        if (val >= 50) return 3;   // 上品
        if (val >= 10) return 2;   // 良品
        return 1;                  // 凡品
    }
};
