/**
 * V1.8.2 Formula.js
 * 職責：全遊戲數值公式定義 (集中管理平衡性)
 * 修正：新增暴擊、閃避、減傷率、修煉效率等進階換算邏輯
 */
const Formula = {
    // --- 原有基礎公式 (保留，不簡化) ---
    calculateMaxHp(con) { return 100 + (con * 10); },
    calculateAtk(str) { return 10 + (str * 2); },
    
    // 防禦力：敏捷影響，每 2 點敏捷加 1 點防禦
    calculateDef(dex) {
        return Math.floor(dex * 0.5);
    },

    // 速度：影響出手先後手感
    calculateSpeed(dex) {
        return 10 + (dex * 0.2);
    },

    // 經驗加成：悟性每 1 點增加 1%
    calculateExpBonus(int) { 
        return 1 + (int * 0.01); 
    },

    // 等級需求曲線：1.2 倍指數成長
    calculateNextExp(currentMaxExp) { 
        return Math.floor(currentMaxExp * 1.2); 
    },

    // 傷害浮動：正負 10%
    getDamageRange(baseAtk) {
        const min = baseAtk * 0.9;
        const max = baseAtk * 1.1;
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    // --- V1.8.2 新增：進階戰鬥公式 (對接 3x2 卡片與詳細彈窗) ---

    /**
     * 計算暴擊率 (%)
     * 邏輯：力量提供基礎強度，敏捷提供精準度
     */
    calculateCritRate(str, dex) {
        // 基礎 5%，每 20 點敏捷增加 1%，每 50 點力量增加 0.5%
        let rate = 5 + (dex * 0.05) + (str * 0.01);
        return parseFloat(rate.toFixed(2));
    },

    /**
     * 計算閃避率 (%)
     * 邏輯：主要由敏捷驅動
     */
    calculateEvasionRate(dex) {
        // 基礎 3%，每 15 點敏捷增加 1%
        let rate = 3 + (dex * 0.06);
        return parseFloat(rate.toFixed(2));
    },

    /**
     * 計算物理減傷率 (%)
     * 邏輯：非線性公式，防止減傷達到 100% (邊際效用遞減)
     * 公式：Def / (Def + 基準值)
     */
    calculateDamageReduction(def) {
        if (def <= 0) return 0;
        // 基準值設定為 500，代表 500 點防禦時減傷 50%
        let reduction = (def / (def + 500)) * 100;
        return parseFloat(reduction.toFixed(1));
    },

    /**
     * 計算修煉效率 (百分比文字)
     * 邏輯：對應悟性加成，用於詳細資料展示
     */
    calculateStudyEfficiency(int) {
        let bonus = this.calculateExpBonus(int);
        return Math.floor(bonus * 100);
    },

    /**
     * 計算暴擊傷害倍率 (預留)
     * 邏輯：基礎 150%，力量可略微提升
     */
    calculateCritMultiplier(str) {
        return 1.5 + (str * 0.001);
    }
};
