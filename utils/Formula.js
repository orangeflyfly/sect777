/**
 * V2.0 Formula.js (飛升模組版)
 * 職責：全遊戲數值公式定義 (集中管理平衡性)
 * 特性：ES Module 導出，提供給 CombatEngine, Player, UI_Stats 等模組引用
 */

export const Formula = {
    // --- 基礎屬性換算 ---
    
    // 生命上限：體質影響
    calculateMaxHp(con) { 
        return 100 + (con * 10); 
    },
    
    // 基礎攻擊：力量影響
    calculateAtk(str) { 
        return 10 + (str * 2); 
    },
    
    // 防禦力：敏捷影響，每 2 點敏捷加 1 點防禦
    calculateDef(dex) {
        return Math.floor(dex * 0.5);
    },

    // 出手速度：敏捷影響
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

    // --- 進階戰鬥公式 (對接 3x2 卡片與詳細彈窗) ---

    /**
     * 計算暴擊率 (%)
     * 邏輯：基礎 5%，敏捷提供精準，力量提供強度
     */
    calculateCritRate(str, dex) {
        // 每 20 點敏捷增加 1%，每 50 點力量增加 0.5%
        let rate = 5 + (dex * 0.05) + (str * 0.02);
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
     * 邏輯：非線性公式 Def / (Def + 基準值)
     */
    calculateDamageReduction(def) {
        if (def <= 0) return 0;
        // 基準值 500 代表 500 防禦時減傷 50%
        let reduction = (def / (def + 500)) * 100;
        return parseFloat(reduction.toFixed(1));
    },

    /**
     * 計算修煉效率 (百分比)
     */
    calculateStudyEfficiency(int) {
        let bonus = this.calculateExpBonus(int);
        return Math.floor(bonus * 100);
    },

    /**
     * 計算暴擊傷害倍率
     * 邏輯：基礎 150%，力量可提升
     */
    calculateCritMultiplier(str) {
        return 1.5 + (str * 0.001);
    }
};
