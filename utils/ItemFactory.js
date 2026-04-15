/**
 * V2.2.5 ItemFactory.js (飛升模組版 - 天道平衡與中文化烙印)
 * 職責：裝備生成、隨機詞條組合、嚴格的稀有度機率控制、數值壓縮
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

        // 🟢 封印一：天道機率鎖 (嚴格控制稀有度產出)
        const roll = Math.random();
        let targetRarity = 1;
        if (roll < 0.001) targetRarity = 5;      // 0.1% 機率出神品 (混沌)
        else if (roll < 0.02) targetRarity = 4;  // 1.9% 機率出極品 (神品)
        else if (roll < 0.10) targetRarity = 3;  // 8% 機率出上品 (仙品)
        else if (roll < 0.30) targetRarity = 2;  // 20% 機率出良品 (靈品)
        else targetRarity = 1;                   // 70% 機率出凡品

        // 根據目標稀有度，篩選出符合條件的前綴
        let validPrefixes = d.PREFIXES.filter(p => this.calculateRarity(p.value) === targetRarity);
        
        // 防呆：如果資料庫沒有該階級的詞綴，就降級尋找
        if (validPrefixes.length === 0) {
            validPrefixes = d.PREFIXES.filter(p => this.calculateRarity(p.value) <= targetRarity);
        }
        // 終極防呆：直接用全部詞綴
        if (validPrefixes.length === 0) validPrefixes = d.PREFIXES;

        // 1. 從嚴格篩選過的池子中抽選前綴與後綴
        const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
        const suffix = d.SUFFIXES[Math.floor(Math.random() * d.SUFFIXES.length)];

        // 🟢 封印二：法則壓縮陣 (砍掉 70% 的數值膨脹，保留 30% 強度)
        const squishRate = 0.3; 
        const finalPValue = Math.max(1, Math.floor(prefix.value * squishRate));
        const finalBaseAtk = suffix.baseAtk ? Math.max(1, Math.floor(suffix.baseAtk * squishRate)) : 0;
        const finalBaseHp = suffix.baseHp ? Math.max(1, Math.floor(suffix.baseHp * squishRate)) : 0;

        // 2. 判定稀有度 (直接使用剛才 Roll 到的真實稀有度)
        const rarity = targetRarity;

        // 3. 構建屬性物件與「中文顯示字串」
        const stats = {};
        const statTexts = []; // 預先生成中文顯示標籤，供 UI 渲染
        
        // 處理前綴屬性 (使用壓縮後的 finalPValue)
        if (prefix.attr) {
            stats[prefix.attr] = finalPValue;
            // 烙印中文：例如 "力量 +10"
            statTexts.push(`${ATTR_MAP[prefix.attr] || prefix.attr} +${finalPValue}`);
        }
        
        // 處理後綴基礎屬性 (血量與攻擊，使用壓縮後數值)
        if (finalBaseAtk > 0) {
            stats.atk = (stats.atk || 0) + finalBaseAtk;
            statTexts.push(`${ATTR_MAP['atk']} +${finalBaseAtk}`);
        }
        if (finalBaseHp > 0) {
            stats.hp = (stats.hp || 0) + finalBaseHp;
            statTexts.push(`${ATTR_MAP['hp']} +${finalBaseHp}`);
        }

        // 4. 生成最終裝備物件 (UUID 確保唯一性)
        const equipment = {
            uuid: 'it_' + Date.now() + Math.random().toString(36).substr(2, 5),
            name: `${prefix.name}${suffix.name}`,
            type: suffix.type, // 'weapon', 'armor', 'accessory'
            rarity: rarity,
            stats: stats,      // 引擎用：{ str: 10, atk: 5 }
            statTexts: statTexts, // UI 用：['力量 +10', '攻擊 +5']
            // 價格也稍微壓縮，避免經濟崩盤
            price: Math.floor((finalPValue * 5 + finalBaseAtk * 2) * (rarity * 0.5)) || 10, 
            desc: `一件帶有${prefix.name}氣息的${suffix.name}。`
        };

        return equipment;
    },

    /**
     * 根據數值計算稀有度 (供內部篩選與防呆使用)
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

console.log("%c【天工爐】造物法則模組化完成，雙重平衡封印已啟動。", "color: #10b981; font-weight: bold;");
