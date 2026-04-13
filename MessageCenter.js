/**
 * MessageCenter.js
 * 職責：統一調度遊戲內的訊息輸出
 */
const Msg = {
    // 發送日誌訊息
    log(content, type = 'system') {
        // 未來這裡可以擴充：發送到控制台、發送到 UI、或是存入歷史紀錄
        console.log(`[${type}] ${content}`);
        
        // 只有在 UI 模組存在時才調用它
        if (window.UI_Battle && UI_Battle.log) {
            UI_Battle.log(content, type);
        }
    },

    // 震動、特效等視覺訊號 (預留)
    flash(target) {
        if (window.FX && FX.shake) {
            FX.shake(target);
        }
    }
};
