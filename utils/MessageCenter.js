/**
 * V2.1 MessageCenter.js
 * 職責：解耦邏輯層與 UI 層，提供全域訊息傳遞 (Msg)
 */

export const MessageCenter = {
    /**
     * 普通日誌紀錄
     * @param {string} content - 內容
     * @param {string} type - 類型 (system, player-atk, monster-atk, reward, gold)
     */
    log(content, type = 'system') {
        // 核心調試日誌
        console.log(`%c[${type}] %c${content}`, "font-weight: bold; color: #3b82f6;", "color: inherit;");
        
        // 對接 UI_Battle 渲染邏輯
        if (window.UI_Battle && typeof window.UI_Battle.log === 'function') {
            window.UI_Battle.log(content, type);
        }
    },

    /**
     * 戰鬥數字彈跳特效
     * @param {number} value - 傷害值
     * @param {string} target - 目標 ('player' 或 'monster')
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
     * 系統通知
     */
    notify(msg) {
        alert(msg);
    }
};

// 全域掛載與別名
window.MessageCenter = MessageCenter;
window.Msg = MessageCenter;

console.log("%c【系統】訊息傳遞中心 Msg 神識已就緒。", "color: #3b82f6; font-weight: bold;");
