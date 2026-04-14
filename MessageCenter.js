/**
 * MessageCenter.js
 * 職責：傳接遊戲訊號，解耦邏輯層與 UI 層
 * 讓邏輯檔案 (Player.js, CombatEngine.js) 只要負責發送訊息，不需管 UI ID
 */

const MessageCenter = {
    /**
     * 普通日誌紀錄
     * @param {string} content - 訊息內容
     * @param {string} type - 訊息類型 (system, player-atk, monster-atk, reward)
     */
    log(content, type = 'system') {
        console.log(`[${type}] ${content}`);
        
        // 只有在 UI_Battle 存在時才呼叫其渲染邏輯
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
        console.log(`[傷害彈跳] ${target} 受到了 ${value} 點傷害`);
        if (window.FX && typeof FX.showDamage === 'function') {
            FX.showDamage(value, target);
        }
    },

    /**
     * 系統通知 (如彈窗或置頂提示)
     * @param {string} msg - 通知內容
     */
    notify(msg) {
        alert(msg); // 暫時用簡單方式，未來可換成 UI 提示
    }
};

// --- 全域對接鎖 ---
// 確保全域可以透過 MessageCenter 呼叫
window.MessageCenter = MessageCenter;

// 為了方便開發者呼叫，建立一個短別名 Msg
window.Msg = MessageCenter;

console.log("%c【系統】訊息傳遞中心已就緒，Msg 別名已綁定。", "color: #3b82f6; font-weight: bold;");
