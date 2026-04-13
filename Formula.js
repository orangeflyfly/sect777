/**
 * Formula.js
 * 職責：全遊戲數值公式定義 (集中管理魔術數字)
 */
const Formula = {
    // 1. 生命值公式：基礎 100 + 體質 * 10
    // 這樣 Con 點滿非常有感
    calculateMaxHp(con) {
        return 100 + (con * 10);
    },

    // 2. 攻擊力公式：基礎 10 + 力量 * 2
    calculateAtk(str) {
        return 10 + (str * 2);
    },

    // 3. 經驗獲取倍率：1 + 悟性 * 1%
    // 例如 Int 50，倍率就是 1.5x
    calculateExpBonus(int) {
        return 1 + (int * 0.01);
    },

    // 4. 等級提升需求：前一級需求 * 1.2 (指數成長)
    calculateNextExp(currentMaxExp) {
        return Math.floor(currentMaxExp * 1.2);
    },

    // 5. 暴擊判定 (預留給未來擴充)
    // 假設 100 點敏捷增加 1% 暴擊率
    checkCrit(dex) {
        const critRate = dex * 0.01; 
        return Math.random() < (critRate / 100);
    },

    // 6. 戰鬥傷害浮動：正負 10%
    // 傳入基礎攻擊力，回傳隨機後的傷害
    getDamageRange(baseAtk) {
        const min = baseAtk * 0.9;
        const max = baseAtk * 1.1;
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
};

// 如果你要在 Node.js 測試可以 export，網頁版則直接宣告即可
