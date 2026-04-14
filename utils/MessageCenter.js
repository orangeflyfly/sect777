/**
 * V2.0 MessageCenter.js (飛升模組版)
 * 職責：傳接遊戲訊號，解耦邏輯層與 UI 層
 * 特性：ES Module 導出，提供給 Player, CombatEngine, UI_Stats 等所有模組引用
 */

export const MessageCenter = {
    /**
     * 普通日誌紀錄
     * @param {string} content - 訊息內容
     * @param {string} type - 訊息類型 (system, player-atk, monster-atk, reward)
     */
    log(content, type = 'system') {
        // 保留開發者調試日誌
        console.log(`%c[${type}] %c${content}`, "font-weight: bold; color: #3b82f6;", "color: inherit;");
        
        // 只有在 UI_Battle 存在時才呼叫其渲染邏輯
        // 在 ESM 架構下，UI_Battle 通常會由 core.js 初始化並掛載或被直接引用
        if (window.UI_Battle && typeof window.UI_Battle.log === 'function') {
            window.UI_Battle.log(content, type);
        }
    },

    /**
     * 戰鬥數字彈跳特效
     * @param {number} value - 傷害數值
     * @param {string} target - 目標類型 ('player' 或 'monster')
     */
    damagePop(value, target) {
        console.log(`[傷害彈跳] ${target} 受到了 ${value} 點傷害`);
        
        // 對接 FX 特效引擎
        if (window.FX && typeof window.FX.spawnPopText === 'function') {
            const color = (target === 'monster') ? '#ef4444' : '#f87171';
            window.FX.spawnPopText(value, target, color);
        }
    },

    /**
     * 系統通知 (如彈窗或置頂提示)
     * @param {string} msg - 通知內容
     */
    notify(msg) {
        // 暫時保留簡單方式，未來可擴充為自定義的 Glassmorphism 彈窗
        alert(msg);
    }
};

/**
 * --- 全域對接與別名 ---
 * 雖然是 ES Module，但為了開發方便以及 HTML 上的舊代碼相容，
 * 我們仍可有選擇性地掛載短別名 Msg 到 window 上。
 */
window.MessageCenter = MessageCenter;
window.Msg = MessageCenter;

console.log("%c【系統】訊息傳遞中心模組化完成，Msg 神識已就緒。", "color: #3b82f6; font-weight: bold;");
