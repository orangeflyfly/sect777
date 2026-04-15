/**
 * V2.4 ItemFactory.js (天道平衡與等級成長版)
 * 職責：裝備生成、隨機詞條組合、極限數值壓縮(0.1)、等級成長鎖
 * 特性：確保屬性點價值，解決一件神裝穿到老的問題
 */

// 屬性翻譯映射陣法
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

export const ItemFactory = {
    /**
     * 隨機生成一件裝備
     * @param {number} level - 傳入玩家當前等級，用於觸發成長鎖
     */
    createEquipment(level = 1) {
        // 優先讀取資料庫
        const d = window.DB || window.DATA || window.GAMEDATA;
        
        if (!d || !d.PREFIXES || !d.SUFFIXES) {
            console.error("【天工爐】資料庫尚未備齊，無法煉製。");
            return null;
        }

        // 🟢 封印一：天道機率鎖 (保持嚴格稀有度)
        const roll = Math.random();
        let targetRarity = 1;
        if (roll < 0.001) targetRarity = 5;      // 0.1% 神品
        else if (roll < 0.02) targetRarity = 4;  // 1.9% 極品
        else if (roll < 0.10) targetRarity = 3;  // 8% 上品
        else if (roll < 0.30) targetRarity = 2;  // 20% 良品
        else targetRarity = 1;                   // 70% 凡品

        // 篩選符合稀有度的前綴池
        let validPrefixes = d.PREFIXES.filter(p => this.calculateRarity(p.value) === targetRarity);
        
        // 防呆：降級搜索
        if (validPrefixes.length === 0) {
            validPrefixes = d.PREFIXES.filter(p => this.calculateRarity(p.value) <= targetRarity);
        }
        if (validPrefixes.length === 0) validPrefixes = d.PREFIXES;

        // 1. 抽選詞綴
        const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
        const suffix = d.SUFFIXES[Math.floor(Math.random() * d.SUFFIXES.length)];

        // 🟢 封印二：極限壓縮與等級成長鎖
        // 基礎壓縮係數從 0.3 降至 0.1
        const squishRate = (d.CONFIG && d.CONFIG.EQUIP_COMPRESSION) || 0.1; 
        
        // 等級成長加成：每 1 級提供 5% 的數值增長基礎
        // 公式：最終數值 = (原始數值 * 0.1) * (1 + 等級 * 0.05)
        const growthFactor = 1 + (level * 0.05);

        const finalPValue = Math.max(1, Math.floor(prefix.value * squishRate * growthFactor));
        const finalBaseAtk = suffix.baseAtk ? Math.max(1, Math.floor(suffix.baseAtk * squishRate * growthFactor)) : 0;
        const finalBaseHp = suffix.baseHp ? Math.max(1, Math.floor(suffix.baseHp * squishRate * growthFactor)) : 0;

        // 2. 構建屬性與顯示文字
        const stats = {};
        const statTexts = [];
        const rarity = targetRarity;

        // 處理前綴屬性
        if (prefix.attr) {
            stats[prefix.attr] = finalPValue;
            statTexts.push(`${ATTR_MAP[prefix.attr] || prefix.attr} +${finalPValue}`);
        }
        
        // 處理後綴基礎屬性
        if (finalBaseAtk > 0) {
            stats.atk = (stats.atk || 0) + finalBaseAtk;
            statTexts.push(`${ATTR_MAP['atk']} +${finalBaseAtk}`);
        }
        if (finalBaseHp > 0) {
            stats.hp = (stats.hp || 0) + finalBaseHp;
            statTexts.push(`${ATTR_MAP['hp']} +${finalBaseHp}`);
        }

        // 3. 生成裝備物件
        const equipment = {
            uuid: 'it_' + Date.now() + Math.random().toString(36).substr(2, 5),
            name: `${prefix.name}${suffix.name}`,
            type: suffix.type, 
            rarity: rarity,
            level: level, // 記錄生成時的等級
            stats: stats,
            statTexts: statTexts,
            // 價格與等級掛鉤
            price: Math.floor((finalPValue * 5 + finalBaseAtk * 2) * (rarity * 0.5) + (level * 10)) || 10,
            desc: `【Lv.${level} 裝備】帶有${prefix.name}氣息的${suffix.name}。`
        };

        return equipment;
    },

    /**
     * 稀有度判定準則
     */
    calculateRarity(val) {
        if (val >= 2000) return 5; // 神品
        if (val >= 300) return 4;  // 極品
        if (val >= 50) return 3;   // 上品
        if (val >= 10) return 2;   // 良品
        return 1;                  // 凡品
    }
};

window.ItemFactory = ItemFactory;

console.log("%c【天工爐】V2.4 平衡法則啟動：0.1極限壓縮與等級成長鎖已生效。", "color: #10b981; font-weight: bold;");
