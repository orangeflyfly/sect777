/**
 * SaveManager.js
 * 職責：存檔的加密、寫入、讀取
 */
const SaveManager = {
    SAVE_KEY: 'CultivationGame_Save_V1.8',

    save(data) {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, json);
            return true;
        } catch (e) {
            console.error("存檔失敗:", e);
            return false;
        }
    },

    load() {
        const saved = localStorage.getItem(this.SAVE_KEY);
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("讀取失敗:", e);
            return null;
        }
    }
};
