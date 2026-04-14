/**
 * V2.1 ItemFactory.js (飛升模組版 - 中文化烙印)
 * 職責：裝備生成、隨機詞條組合、稀有度計算
 * 特性：ES Module 導出，提供給 CombatEngine (掉落) 與 UI_Shop (生成商品) 引用
 */

// 屬性翻譯映射陣法 (天工爐專用)
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
     * @param {number} level - 影響生成的基礎強度 (預留)
     */
    createEquipment(level = 1) {
        // 在 ESM 模式下，優先讀取模組化 DB，若無則讀取傳統 DATA
        const d = window.DB || window.DATA || window.GAMEDATA;
        
        if (!d || !d.PREFIXES || !d.SUFFIXES) {
            console.error("【天工爐】資料庫尚未備齊，無法煉製。請檢查 data_items.js 是否載入。");
            return null;
        }

        // 1. 隨機抽選前綴 (Prefix) 與 後綴 (Suffix)
        const prefix = d.PREFIXES[Math.floor(Math.random() * d.PREFIXES.length)];
        const suffix = d.SUFFIXES[Math.floor(Math.random() * d.SUFFIXES.length)];

        // 2. 判定稀有度 (根據前綴數值判定，連動 CSS 樣式)
        const rarity = this.calculateRarity(prefix.value);

        // 3. 構建屬性物件與「中文顯示字串」
        const stats = {};
        const statTexts = []; // 🟢 新增：預先生成中文顯示標籤，供 UI 渲染
        
        // 處理前綴屬性 (例如: str: 10)
        if (prefix.attr) {
            stats[prefix.attr] = prefix.value;
            // 烙印中文：例如 "力量 +10"
            statTexts.push(`${ATTR_MAP[prefix.attr] || prefix.attr} +${prefix.value}`);
        }
        
        // 處理後綴基礎屬性 (血量與攻擊)
        if (suffix.baseAtk) {
            stats.atk = (stats.atk || 0) + suffix.baseAtk;
            statTexts.push(`${ATTR_MAP['atk']} +${suffix.baseAtk}`);
        }
        if (suffix.baseHp) {
            stats.hp = (stats.hp || 0) + suffix.baseHp;
            statTexts.push(`${ATTR_MAP['hp']} +${suffix.baseHp}`);
        }

        // 4. 生成最終裝備物件 (UUID 確保唯一性)
        const equipment = {
            uuid: 'it_' + Date.now() + Math.random().toString(36).substr(2, 5),
            name: `${prefix.name}${suffix.name}`,
            type: suffix.type, // 'weapon', 'armor', 'accessory'
            rarity: rarity,
            stats: stats,      // 引擎用：{ str: 10, atk: 5 }
            statTexts: statTexts, // 🟢 UI 用：['力量 +10', '攻擊 +5']
            price: prefix.value * 5 + (suffix.baseAtk || 0) * 2, // 價值演算法
            desc: `一件帶有${prefix.name}氣息的${suffix.name}。`
        };

        return equipment;
    },

    /**
     * 根據數值計算稀有度
     * 對應 CSS: .r-1 (凡品) 到 .r-5 (混沌神品)
     */
    calculateRarity(val) {
        if (val >= 2000) return 5; // 神品 (混沌)
        if (val >= 300) return 4;  // 極品 (神品)
        if (val >= 50) return 3;   // 上品 (仙品)
        if (val >= 10) return 2;   // 良品 (靈品)
        return 1;                  // 凡品
    }
};

// 掛載到全域，確保那些尚未轉型的舊代碼（如某些 inline HTML）還能找到它
window.ItemFactory = ItemFactory;

console.log("%c【天工爐】造物法則模組化完成，中文化陣法已啟動。", "color: #10b981; font-weight: bold;");
