/**
 * SaveManager.js
 * 職責：處理數據的持久化儲存 (LocalStorage)
 */
const SaveManager = {
    // 增加版本號，未來如果資料結構大改，可以用來做資料遷移
    SAVE_KEY: 'CultivationGame_Save_V1.8',

    /**
     * 存檔
     * @param {Object} data - 玩家的完整數據物件
     */
    save(data) {
        if (!data) return;
        
        try {
            // 更新最後存檔時間
            data.lastSaveTime = Date.now();
            const jsonStr = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, jsonStr);
            return true;
        } catch (error) {
            console.error("【司庫房】存檔失敗，可能空間已滿或環境異常：", error);
            return false;
        }
    },

    /**
     * 讀檔
     * @returns {Object|null} - 傳回解碼後的物件，若無存檔則回傳 null
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) return null;
            
            return JSON.parse(savedData);
        } catch (error) {
            console.error("【司庫房】讀檔失敗，資料格式可能損壞：", error);
            return null;
        }
    },

    /**
     * 刪除存檔 (通常用於重新開始)
     */
    clear() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("【司庫房】神識記憶已抹除，準備重入輪迴。");
    }
};
