/**
 * V1.5.10 core.js
 * 職責：啟動遊戲、全域數據刷新、標籤切換、離線收益彈窗、自動存檔。
 */

const GameCore = {
    init: function() {
        console.log("🕉️ 宗門大陣啟動中...");
        
        // 1. 載入存檔
        player.load();

        // 2. 處理離線收益
        this.handleOffline();

        // 3. 初始化戰鬥
        Combat.init();

        // 4. 預設顯示歷練頁
        this.switchTab('battle');

        // 5. 啟動高頻刷新 (每 200ms 刷新一次頂部狀態)
        this.startGlobalUpdater();

        // 6. 啟動自動存檔 (每 30 秒)
        this.startAutoSave();

        console.log("✅ 宗門大陣運行平穩，恭迎宗主回歸！");
    },

    // 離線收益彈窗 (1.4.1 特色)
    handleOffline: function() {
        const gains = player.calculateOfflineGains();
        if (gains && gains.minutes > 0) {
            // 延遲一點點顯示，確保畫面已加載
            setTimeout(() => {
                alert(`【離線修煉結算】\n\n宗主閉關了 ${gains.minutes} 分鐘\n獲得修為：${gains.exp}\n獲得靈石：${gains.gold}\n\n修行之路，貴在持之以恆！`);
            }, 1000);
        }
    },

    // 分頁切換 (1.4.1 的流暢感)
    switchTab: function(tabId) {
        const screens = ['battle', 'bag', 'stats', 'shop'];
        
        screens.forEach(s => {
            const el = document.getElementById(s + '-screen');
            const btn = document.querySelector(`.nav-btn[onclick*="${s}"]`);
            if (el) el.classList.remove('active');
            if (btn) btn.classList.remove('active');
        });

        // 啟動目標頁面
        const targetScreen = document.getElementById(tabId + '-screen');
        const targetBtn = document.querySelector(`.nav-btn[onclick*="${tabId}"]`);
        
        if (targetScreen) targetScreen.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');

        // 觸發各頁面的初次渲染
        if (tabId === 'battle') {
            if (Combat.currentMonster) UI_Battle.renderBattle(Combat.currentMonster);
        }
        if (tabId === 'stats') UI_Stats.renderStats();
        if (tabId === 'bag') UI_Bag.renderBag();
        if (tabId === 'shop') UI_Shop.renderShop();
    },

    // 全域數據同步
    startGlobalUpdater: function() {
        setInterval(() => {
            const d = player.data;
            
            // 同步頂部狀態
            const lvlEl = document.getElementById('val-level');
            const monEl = document.getElementById('val-money');
            const expBar = document.getElementById('val-exp-bar');
            const expTxt = document.getElementById('val-exp-txt');

            if (lvlEl) lvlEl.innerText = `【${d.realm}】 Lv.${d.level}`;
            if (monEl) monEl.innerText = `🪙 ${Math.floor(d.money)}`;
            
            if (expBar && expTxt) {
                const percent = (d.exp / d.nextExp) * 100;
                expBar.style.width = Math.min(100, percent) + "%";
                expTxt.innerText = Math.floor(percent) + "%";
            }
        }, 200);
    },

    startAutoSave: function() {
        setInterval(() => {
            player.save();
            console.log("💾 陣法自動存檔完成...");
        }, 30000);
    }
};

// 大陣最後的啟動咒語
window.onload = () => {
    GameCore.init();
};
