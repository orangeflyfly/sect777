/**
 * V1.5 core.js
 * 職責：遊戲主入口、檔案關聯初始化、介面切換邏輯、自動存檔定時器。
 * 狀態：全量完整版，負責連結所有模組。
 */

const GameCore = {
    // --- 1. 大陣啟動 (1.5 新增：模組化初始化流程) ---
    init: function() {
        console.log("🌀 正在啟動 V1.5 大乘飛升大陣...");

        // A. 讀取存檔並嘗試獲取離線收益
        const hasSave = player.load();
        
        // B. 啟動戰鬥引擎 (內含離線結算彈窗邏輯)
        Combat.init();

        // C. 初始化介面顯示
        this.switchTab('battle'); 
        
        // D. 啟動 UI 刷新定時器 (確保數據強同步)
        this.startUIUpdater();

        // E. 啟動自動存檔 (每 30 秒一次)
        this.startAutoSave();

        console.log("✅ 大陣運作正常。歡迎回來，" + player.data.name);
    },

    // --- 2. 介面切換邏輯 (1.4.1 繼承並優化) ---
    switchTab: function(tabId) {
        // 隱藏所有畫面
        const screens = ['battle-screen', 'stats-screen', 'bag-screen', 'shop-screen'];
        screens.forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = 'none';
        });

        // 顯示目標畫面並執行對應渲染
        const target = document.getElementById(tabId + '-screen');
        if (target) {
            target.style.display = 'block';
            
            // 根據切換的標籤，執行該模組的渲染函式
            switch(tabId) {
                case 'stats': UI_Stats.renderStats(); break;
                case 'bag':   UI_Bag.renderBag(); break;
                case 'shop':  UI_Shop.renderShop(); break;
                case 'battle': /* Combat 模組會自動更新 */ break;
            }
        }

        // 更新導航按鈕樣式 (1.5 視覺項)
        this.updateNavButtons(tabId);
    },

    updateNavButtons: function(activeTab) {
        const btns = document.querySelectorAll('.nav-btn');
        btns.forEach(btn => {
            if (btn.getAttribute('onclick').includes(activeTab)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    // --- 3. 全局計時器 (1.5 核心：數據強同步) ---
    startUIUpdater: function() {
        // 每 500 毫秒強制刷新一次當前顯示的介面，確保數值不神隱
        setInterval(() => {
            const activeScreen = this.getActiveScreen();
            if (activeScreen === 'stats') UI_Stats.renderStats();
            if (activeScreen === 'bag') UI_Bag.renderBag();
            // 戰鬥畫面由 Combat 模組獨立推動，故不在此重複渲染
        }, 500);
    },

    getActiveScreen: function() {
        if (document.getElementById('stats-screen').style.display === 'block') return 'stats';
        if (document.getElementById('bag-screen').style.display === 'block') return 'bag';
        if (document.getElementById('shop-screen').style.display === 'block') return 'shop';
        return 'battle';
    },

    // --- 4. 自動存檔系統 ---
    startAutoSave: function() {
        setInterval(() => {
            player.save();
            console.log("💾 靈力穩固，自動存檔完成。");
        }, 30000); // 30秒
    }
};

// --- 最終宣告：網頁載入後立即啟動 ---
window.onload = () => {
    GameCore.init();
};
