/**
 * V2.7 ui_system.js
 * 職責：全域系統操作（存檔、重啟）
 * 位置：/ui/ui_system.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_System = {
    /**
     * 手動存檔：呼叫 Player 的存檔招式
     */
    manualSave() {
        console.log("【系統】修士手動施展存檔神通...");
        if (Player && typeof Player.save === 'function') {
            Player.save();
            // 彈窗提示
            alert('💾 宗門紀載已更新，修為存檔成功！');
            Msg.log("✨ 存檔成功！神識已刻入玉簡。", "gold");
        } else {
            console.error("❌ 存檔失敗：找不到 Player.save");
            Msg.log("❗ 存檔失敗，請確認修為檔案是否完整。", "monster-atk");
        }
    },

    /**
     * 兵解重生：清除 localStorage 並刷網頁
     */
    restartGame() {
        const confirmReset = confirm("❗ 警告：此舉將散盡全身修為（清空存檔），確定要重新開始嗎？");
        
        if (confirmReset) {
            console.log("【系統】修士兵解中...");
            localStorage.clear();
            Msg.log("再見了，這一世的修行... 正在重新投胎...", "system");
            
            setTimeout(() => {
                location.reload();
            }, 500);
        } else {
            Msg.log("你收回了神識，繼續修行。", "system");
        }
    }
};

// 🟢 這是最重要的：掛載到 window，HTML 的按鈕才按得動
window.UI_System = UI_System;
