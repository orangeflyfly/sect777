/**
 * Formula.js
 * 職責：全遊戲數值公式定義
 */
const Formula = {
    // 計算最大生命值：基礎 100 + 體質 * 10
    calculateMaxHp(con) {
        return 100 + con * 10;
    },

    // 計算基礎攻擊力：基礎 10 + 力量 * 2
    calculateAtk(str) {
        return 10 + str * 2;
    },

    // 計算經驗加成倍率：1 + 悟性 * 1%
    calculateExpBonus(int) {
        return 1 + (int * 0.01);
    },

    // 下一級經驗需求：前一級 * 1.2
    calculateNextExp(currentMaxExp) {
        return Math.floor(currentMaxExp * 1.2);
    },

    // 計算暴擊判定 (預留給未來)
    isCrit(dex) {
        return Math.random() < (dex * 0.001);
    }
};
