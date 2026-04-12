/**
 * V1.5.12 core.js
 * 職責：點火啟動、離線結算、分頁切換控制、自動練功開關、高頻數據同步。
 * 狀態：全量實裝，禁止簡化。
 */

const GameCore = {
    // 1. 大陣啟動點火
    init: function() {
        console.log("🕉️ 宗門大陣開始點火...");

        // A. 載入修士存檔
        const hasSave = player.load();
        
        // B. 處理離線閉關收益
        this.handleOffline();

        // C. 啟動戰鬥引擎
        Combat.initBattle();

        // D. 初始化分頁 (預設進入歷練)
        this.switchTab('battle');

        // E. 啟動數據強同步 (每 200ms 刷新一次頂部狀態)
        this.startGlobalRefresh();

        // F. 啟動自動存檔 (每 30 秒一次)
        this.startAutoSave();

        // G. 更新自動練功按鈕視覺
        this.updateAutoBtnUI();

        console.log("✅ 宗門大陣運行平穩，恭迎宗主出關！");
    },

    // 2. 離線收益結算 (1.4.1 氣泡提醒版)
    handleOffline: function() {
        const gains = player.calculateOfflineGains();
        if (gains && gains.minutes > 0) {
            // 延遲一點點顯示，等待介面載入完成
            setTimeout(() => {
                player.showToast(`✨ 閉關結束：獲得修為 ${gains.exp}，靈石 🪙${gains.gold}`, "gold");
            }, 1500);
        }
    },

    // 3. 核心分頁切換 (解決其他頁面沒東西的關鍵)
    switchTab: function(tabId) {
        console.log(`🔮 轉移陣法：前往 ${tabId}`);
        
        const screens = ['battle', 'bag', 'stats', 'shop'];
        
        // A. 隱藏所有頁面，移除所有按鈕激活狀態
        screens.forEach(id => {
            const el = document.getElementById(`${id}-screen`);
            if (el) el.classList.remove('active');
            
            // 尋找對應的導航按鈕
            const btn = document.querySelector(`.nav-btn[onclick*="${id}"]`);
            if (btn) btn.classList.remove('active');
        });

        // B. 顯示目標頁面，激活對應按鈕
        const targetEl = document.getElementById(`${tabId}-screen`);
        const targetBtn = document.querySelector(`.nav-btn[onclick*="${tabId}"]`);
        
        if (targetEl) targetEl.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');

        // C. 核心：強制觸發目標頁面的渲染函式 (確保頁面必有內容)
        this.triggerRender(tabId);
    },

    triggerRender: function(tabId) {
        switch(tabId) {
            case 'battle':
                if (Combat.currentMonster) UI_Battle.renderBattle(Combat.currentMonster);
                break;
            case 'stats':
                if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
                break;
            case 'bag':
                if (typeof UI_Bag !== 'undefined') UI_Bag.renderBag();
                break;
            case 'shop':
                if (typeof UI_Shop !== 'undefined') UI_Shop.renderShop();
                break;
        }
    },

    // 4. 自動練功開關邏輯
    toggleAuto: function() {
        player.data.isAuto = !player.data.isAuto;
        this.updateAutoBtnUI();
        
        if (player.data.isAuto) {
            player.showToast("⚡ 自動練功已啟動", "gold");
        } else {
            player.showToast("💤 已進入手動模式");
        }
        player.save();
    },

    updateAutoBtnUI: function() {
        const btn = document.getElementById('btn-auto-combat');
        if (btn) {
            if (player.data.isAuto) {
                btn.classList.add('active');
                btn.innerText = "自動練功：開";
            } else {
                btn.classList.remove('active');
                btn.innerText = "自動練功：關";
            }
        }
    },

    // 5. 數據強同步 (同步血量條、經驗條、靈石)
    startGlobalRefresh: function() {
        setInterval(() => {
            const d = player.data;
            
            // 同步等級與境界
            const lvlEl = document.getElementById('val-level');
            if (lvlEl) lvlEl.innerText = `【${d.realm}】 Lv.${d.level}`;

            // 同步靈石
            const monEl = document.getElementById('val-money');
            if (monEl) monEl.innerText = `🪙 ${Math.floor(d.money)}`;

            // 同步經驗條
            const expBar = document.getElementById('val-exp-bar');
            const expTxt = document.getElementById('val-exp-txt');
            if (expBar && expTxt) {
                const expPer = (d.exp / d.nextExp) * 100;
                expBar.style.width = Math.min(100, expPer) + "%";
                expTxt.innerText = `${Math.floor(expPer)}%`;
            }

            // 同步玩家血量條 (補回的功能)
            const hpBar = document.getElementById('val-hp-bar');
            const hpTxt = document.getElementById('val-hp-txt');
            if (hpBar && hpTxt) {
                const hpPer = (d.hp / d.maxHp) * 100;
                hpBar.style.width = Math.max(0, hpPer) + "%";
                hpTxt.innerText = `${Math.ceil(Math.max(0, d.hp))} / ${Math.ceil(d.maxHp)}`;
            }
        }, 200);
    },

    // 6. 定時存檔
    startAutoSave: function() {
        setInterval(() => {
            player.save();
            console.log("💾 宗門數據已自動存入識海...");
        }, 30000);
    }
};

// --- 大陣啟動指令 ---
window.onload = () => {
    GameCore.init();
};
