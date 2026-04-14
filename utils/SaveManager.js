/**
 * V2.0 SaveManager.js (飛升模組版)
 * 職責：數據持久化 (LocalStorage) 與版本遷移
 * 位置：/utils/SaveManager.js
 */

export const SaveManager = {
    // V1.9.0 存檔金鑰 (目前維持 V1.9 以相容道友當前進度)
    SAVE_KEY: 'CultivationGame_Save_V1.9',
    // 舊版金鑰，用於向下兼容傳承
    LEGACY_KEY: 'CultivationGame_Save_V1.8',

    /**
     * 存檔
     * @param {Object} data - 玩家數據物件
     */
    save(data) {
        if (!data) return false;
        
        try {
            // 使用 JSON 序列化進行深拷貝，避免直接修改運行中的 Player.data 導致物件引用問題
            const dataToSave = JSON.parse(JSON.stringify(data));
            
            // 更新最後存檔時間
            dataToSave.lastSaveTime = Date.now();
            
            const jsonStr = JSON.stringify(dataToSave);
            localStorage.setItem(this.SAVE_KEY, jsonStr);
            return true;
        } catch (error) {
            // 錯誤處理：通常是 LocalStorage 空間滿了 (5MB 限制)
            console.error("【司庫房】存檔失敗，靈氣空間不足：", error);
            return false;
        }
    },

    /**
     * 讀檔 (包含 V1.8 至 V1.9 的無縫升級)
     * @returns {Object|null}
     */
    load() {
        try {
            // 1. 先嘗試讀取 V1.9 最新存檔
            let savedDataStr = localStorage.getItem(this.SAVE_KEY);
            let parsedData = null;

            if (savedDataStr) {
                // 成功讀取最新版
                parsedData = JSON.parse(savedDataStr);
            } else {
                // 2. 若無最新版，嘗試尋找 V1.8 的舊神識 (向下兼容)
                const legacyDataStr = localStorage.getItem(this.LEGACY_KEY);
                if (legacyDataStr) {
                    console.log("%c【司庫房】感應到舊版神識 (V1.8)，正在進行境界轉化與傳承...", "color: #fbbf24;");
                    parsedData = JSON.parse(legacyDataStr);
                    
                    // 3. 數據補丁：注入 V1.9 新增的核心欄位預設值，防止遊戲崩潰
                    if (parsedData.realm === undefined) parsedData.realm = 1;
                    if (parsedData.currentMapId === undefined) parsedData.currentMapId = 101;
                    
                    // 轉化完成後，立刻自動存入 V1.9 的新金鑰中，完成飛升升級
                    this.save(parsedData);
                }
            }

            if (!parsedData) return null;
            
            console.log("【司庫房】神識引導成功，數據載入中...");
            return parsedData;

        } catch (error) {
            console.error("【司庫房】讀檔失敗，存檔可能損壞：", error);
            return null;
        }
    },

    /**
     * 重置存檔 (重入輪迴)
     */
    clear() {
        // 同時抹除新舊版本的記憶，徹底清空
        localStorage.removeItem(this.SAVE_KEY);
        localStorage.removeItem(this.LEGACY_KEY);
        console.log("【司庫房】神識記憶已徹底抹除，準備重入輪迴。");
    }
};

/**
 * --- 全域對接 ---
 * 確保在過渡期內，非模組化的 JS 或 Debug 工具仍能通過 window 存取
 */
window.SaveManager = SaveManager;
