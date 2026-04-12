/**
 * V1.6.0 core.js (加固優化版)
 * 職責：引擎啟動、分頁切換、數據高頻同步、效能優化。
 */

const GameCore = {
    // 元素緩存容器，避免重複掃描 DOM
    uiElements: {},

    // 1. 大陣點火
    init: function() {
        console.log("🕉️ 宗門大陣開始點火...");

        // A. 緩存常用的 UI 元素，大幅提昇效能
        this.cacheElements();

        // B. 載入修士數據 (player.js 必須在此之前載入)
        if (typeof player !== 'undefined') {
            player.load();
        } else {
            console.error("❌ 致命錯誤：找不到 player 模組！");
            return;
        }
        
        // C. 離線收益結算
        this.handleOffline();

        // D. 啟動各類引擎與同步邏輯
        if (typeof Combat !== 'undefined') Combat.initBattle();
        
        this.switchTab('battle');
        this.startGlobalRefresh();
        this.startAutoSave();
        this.updateAutoBtnUI();

        console.log("✅ 宗門運轉穩定。");
    },

    // 2. 緩存 DOM 元素 (優化效能關鍵)
    cacheElements: function() {
        const ids = ['val-level', 'val-money', 'val-exp-bar', 'val-exp-txt', 'val-hp-bar', 'val-hp-txt', 'btn-auto-combat'];
        ids.forEach(id => {
            this.uiElements[id] = document.getElementById(id);
        });
    },

    // 3. 離線收益結算
    handleOffline: function() {
        setTimeout(() => {
            if (player.showToast) player.showToast("✨ 修士歸位，神識重連成功。", "gold");
        }, 1000);
    },

    // 4. 核心分頁切換
    switchTab: function(tabId) {
        const screens = ['battle', 'bag', 'stats', 'shop'];
        
        screens.forEach(id => {
            const el = document.getElementById(`${id}-screen`);
            const btn = document.querySelector(`.nav-btn[onclick*="${id}"]`);
            
            if (el) {
                const isActive = (id === tabId);
                el.style.display = isActive ? 'flex' : 'none';
                if (isActive) el.classList.add('active');
                else el.classList.remove('active');
            }
            
            if (btn) {
                if (id === tabId) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });

        this.triggerRender(tabId);
    },

    triggerRender: function(tabId) {
        // 使用安全調用，防止模組未加載時崩潰
        try {
            switch(tabId) {
                case 'battle':
                    if (typeof Combat !== 'undefined' && Combat.currentMonster) UI_Battle.renderBattle(Combat.currentMonster);
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
        } catch (e) {
            console.warn(`渲染分頁 ${tabId} 時發生非致命錯誤:`, e);
        }
    },

    // 5. 自動練功控制
    toggleAuto: function() {
        player.data.isAuto = !player.data.isAuto;
        this.updateAutoBtnUI();
        
        const msg = player.data.isAuto ? "⚡ 自動練功已啟動" : "💤 已轉為手動運氣";
        player.showToast(msg, player.data.isAuto ? "gold" : "");
        player.save();
    },

    updateAutoBtnUI: function() {
        const btn = this.uiElements['btn-auto-combat'];
        if (btn) {
            btn.classList.toggle('active', player.data.isAuto);
            btn.innerText = player.data.isAuto ? "自動練功：開" : "自動練功：關";
        }
    },

    // 6. 高頻數據同步 (效能加固版)
    startGlobalRefresh: function() {
        setInterval(() => {
            const d = player.data;
            const el = this.uiElements;
            
            // A. 同步等級與境界
            if (el['val-level']) el['val-level'].innerText = `【${d.realm}】 Lv.${d.level}`;

            // B. 同步靈石
            if (el['val-money']) el['val-money'].innerText = `🪙 ${Math.floor(d.money)}`;

            // C. 同步經驗條
            if (el['val-exp-bar'] && el['val-exp-txt']) {
                const expPer = (d.exp / d.nextExp) * 100;
                el['val-exp-bar'].style.width = Math.min(100, expPer) + "%";
                el['val-exp-txt'].innerText = `${Math.floor(expPer)}%`;
            }

            // D. 同步玩家血量條
            if (el['val-hp-bar'] && el['val-hp-txt']) {
                const hpPer = (d.hp / d.maxHp) * 100;
                el['val-hp-bar'].style.width = Math.max(0, hpPer) + "%";
                el['val-hp-txt'].innerText = `${Math.ceil(Math.max(0, d.hp))} / ${Math.ceil(d.maxHp)}`;
            }

            // E. 自然回血邏輯 (保持 1.4.1 傳統，但加入安全邊界)
            if (d.hp < d.maxHp && d.hp > 0) {
                d.hp = Math.min(d.maxHp, d.hp + (d.regen / 5));
            }
        }, 200);
    },

    // 7. 定時存檔
    startAutoSave: function() {
        setInterval(() => {
            player.save();
        }, 30000);
    }
};

// --- 大陣啟動 ---
window.onload = () => {
    GameCore.init();
};
