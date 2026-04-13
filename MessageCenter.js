/**
 * MessageCenter.js
 * 職責：傳接遊戲訊號，解耦邏輯層與 UI 層
 * 讓邏輯檔案 (Player.js, CombatEngine.js) 只要負責發送訊息，不需管 UI ID
 */
const Msg = {
    /**
     * 發送通用日誌訊息
     * @param {string} content - 訊息內容
     * @param {string} type - 訊息類型 (對應 CSS class)
     * 常用類型：'system', 'player-atk', 'monster-atk', 'reward', 'gold', 'red'
     */
    log(content, type = 'system') {
        // 1. 同步輸出到開發者控制台，方便除錯
        console.log(`%c[${type.toUpperCase()}] %c${content}`, "font-weight:bold; color:#6366f1", "color:default");

        // 2. 檢查 UI_Battle 模組是否存在
        // 重構後的優點：即使你還沒寫好 UI，邏輯層呼叫 Msg.log 也不會報錯
        if (window.UI_Battle && typeof UI_Battle.log === 'function') {
            UI_Battle.log(content, type);
        }
    },

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
};

// 為了方便呼叫，建立一個短別名
window.Msg = Msg;
