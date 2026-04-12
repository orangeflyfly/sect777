const GameCore = {
    init: function() {
        player.load();
        Combat.init();
        this.switchTab('battle'); 
        this.startGlobalUpdater(); // 啟動全域刷新
        this.startAutoSave();
    },

    // 介面切換
    switchTab: function(tabId) {
        const screens = ['battle-screen', 'stats-screen', 'bag-screen', 'shop-screen'];
        screens.forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = 'none';
        });
        document.getElementById(tabId + '-screen').style.display = 'flex';
        
        // 觸發各頁面渲染
        if(tabId === 'stats') UI_Stats.renderStats();
        if(tabId === 'bag') UI_Bag.renderBag();
        if(tabId === 'shop') UI_Shop.renderShop();
    },

    // 核心更新器：解決經驗值消失的問題
    startGlobalUpdater: function() {
        setInterval(() => {
            const d = player.data;
            
            // 1. 更新頂部等級與境界
            document.getElementById('val-level').innerText = `【${d.realm}】 Lv.${d.level}`;
            
            // 2. 更新靈石
            document.getElementById('val-money').innerText = `🪙 ${Math.floor(d.money)}`;
            
            // 3. 更新經驗條
            const expPercent = (d.exp / d.nextExp) * 100;
            document.getElementById('val-exp-bar').style.width = Math.min(100, expPercent) + "%";
            document.getElementById('val-exp-txt').innerText = Math.floor(expPercent) + "%";
            
            // 4. 如果在歷練頁，由 Combat 模組更新怪物血量，這裡只需確保基本數值同步
        }, 200); // 提高刷新頻率至 0.2 秒，讓數值更流暢
    },

    startAutoSave: function() {
        setInterval(() => player.save(), 30000);
    }
};

window.onload = () => GameCore.init();
