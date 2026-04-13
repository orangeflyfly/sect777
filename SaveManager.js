/**
 * V1.8.1 SaveManager.js
 * 職責：數據持久化 (LocalStorage)
 * 修正：加入深拷貝機制，確保存檔動作不影響運行中數據
 */
const SaveManager = {
    // 版本號控管：若未來結構大改，可改為 V1.9 進行資料遷移
    SAVE_KEY: 'CultivationGame_Save_V1.8',

    /**
     * 存檔
     * @param {Object} data - 玩家數據物件
     */
    save(data) {
        if (!data) return false;
        
        try {
            // 修正：使用 JSON 序列化進行深拷貝，避免直接修改原始 Player.data
            const dataToSave = JSON.parse(JSON.stringify(data));
            
            // 更新最後存檔時間（僅在存檔副本中更新）
            dataToSave.lastSaveTime = Date.now();
            
            const jsonStr = JSON.stringify(dataToSave);
            localStorage.setItem(this.SAVE_KEY, jsonStr);
            return true;
        } catch (error) {
            // 錯誤處理：通常是 LocalStorage 空間滿了 (5MB 限制)
            console.error("【司庫房】存檔失敗：", error);
            return false;
        }
    },

    /**
     * 讀檔
     * @returns {Object|null}
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) return null;
            
            const parsedData = JSON.parse(savedData);
            console.log("【司庫房】神識引導成功，數據載入中...");
            return parsedData;
        } catch (error) {
            console.error("【司庫房】讀檔失敗，存檔可能損壞：", error);
            return null;
        }
    },

    /**
     * 重置存檔
     */
    clear() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("【司庫房】神識記憶已抹除，準備重入輪迴。");
    }
};
