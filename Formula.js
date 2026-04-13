/**
 * V1.8.1 Formula.js
 * 職責：全遊戲數值公式定義 (集中管理平衡性)
 */
const Formula = {
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
    }
};
