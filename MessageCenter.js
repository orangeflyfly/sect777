/**
 * MessageCenter.js
 * 職責：傳接遊戲訊號，解耦邏輯層與 UI 層
 * 讓邏輯檔案 (Player.js, CombatEngine.js) 只要負責發送訊息，不需管 UI ID
 */
const Msg = {
    log(content, type = 'system') {
        console.log(`[${type}] ${content}`);
        if (window.UI_Battle) UI_Battle.log(content, type);
    }
};
window.Msg = Msg;

    /**
     * 戰鬥數字彈跳特效 (預留給未來擴充)
     * @param {number} value - 傷害數值
     * @param {string} target - 目標類型 ('player' 或 'monster')
     */
    damagePop(value, target) {
        // 未來可以在這裡對接 CSS 動畫，讓數字在螢幕上跳出來
        if (window.FX && FX.showDamage) {
            FX.showDamage(value, target);
        }
    },

    /**
     * 系統通知 (如彈窗或置頂提示)
     */
    notify(msg) {
        alert(msg); // 暫時用最簡單的方式，未來可換成漂亮的 Toast UI
    }
window.Msg = MessageCenter;
};

// 為了方便呼叫，建立一個短別名
window.Msg = Msg;
