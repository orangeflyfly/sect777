/**
 * V1.7.0 core.js
 * 職責：引擎啟動、分頁調度、高頻數據同步、全局初始化。
 */

const GameCore = {
    // 1. 啟動大陣
    init() {
        console.log("🕉️ 宗門大陣開始點火 (V1.7.0)...");

        // A. 初始化玩家數據
        if (typeof Player !== 'undefined') {
            Player.init();
        } else {
            console.error("❌ 致命錯誤：找不到 Player 模組！");
            return;
        }

        // B. 初始化 UI 各堂口 (確保 DOM 已加載)
        this.initAllUI();

        // C. 啟動戰鬥引擎
        if (typeof Combat !== 'undefined') {
            Combat.init();
        }

        // D. 啟動核心循環
        this.startGlobalRefresh();
        this.startAutoSave();

        // E. 預設進入歷練分頁
        this.switchPage('battle');

        console.log("✅ 宗門運轉穩定，神識連結成功。");
    },

    // 2. 初始化所有 UI 模組
    initAllUI() {
        if (typeof UI_Battle !== 'undefined') UI_Battle.init();
        if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
        // 由於沒有 ui_log.js，日誌初始化將在 ui_battle 中自動處理
    },

    // 3. 分頁切換邏輯 (對齊 index.html 的 nav 按鈕)
    switchPage(pageId) {
        // 分頁 ID 對應表
        const pages = ['battle', 'stats', 'bag', 'shop'];
        
        pages.forEach(id => {
            const el = document.getElementById(`page-${id}`);
            if (el) {
                el.classList.toggle('active', id === pageId);
            }
        });

        // 觸發對應頁面的重新渲染
        this.triggerRender(pageId);
    },

    triggerRender(pageId) {
        try {
            switch(pageId) {
                case 'stats':
                    if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
                    break;
                case 'bag':
                    if (typeof UI_Bag !== 'undefined') UI_Bag.init();
                    break;
                case 'shop':
                    if (typeof UI_Shop !== 'undefined') UI_Shop.renderShop();
                    break;
            }
        } catch (e) {
            console.warn(`[Core] 分頁 ${pageId} 渲染異常:`, e);
        }
    },

    // 4. 全局數據同步 (每 200ms 刷新一次頂部資訊欄)
    startGlobalRefresh() {
        setInterval(() => {
            const d = Player.data;
            if (!d) return;

            // A. 同步境界文字
            const realmEl = document.getElementById('player-realm');
            if (realmEl) {
                const realmName = GAMEDATA.CONFIG.REALM_NAMES[d.realm] || "未知境界";
                realmEl.innerText = `${realmName} (Lv.${d.level})`;
            }

            // B. 同步靈石 (對齊 player-coin)
            const coinEl = document.getElementById('player-coin');
            if (coinEl) {
                coinEl.innerText = Math.floor(d.coin);
            }

            // C. 同步經驗條 (對齊 exp-fill)
            const expFill = document.getElementById('exp-fill');
            if (expFill) {
                const per = (d.exp / d.maxExp) * 100;
                expFill.style.width = Math.min(100, per) + "%";
            }

            // D. 處理自動戰鬥中的回血邏輯 (V1.7 新增)
            const stats = Player.getBattleStats();
            // 此處可根據需要實裝非戰鬥狀態的回血
        }, 200);
    },

    // 5. 定時存檔 (每 30 秒)
    startAutoSave() {
        setInterval(() => {
            Player.save();
            console.log("💾 存檔成功...");
        }, 30000);
    }
};

/**
 * 導航跳轉介面 (供 index.html 的 onclick 調用)
 * 解決原本 Navigation.switch 的命名衝突
 */
const Navigation = {
    switch(pageId) {
        GameCore.switchPage(pageId);
    }
};

// 最終點火
window.onload = () => {
    GameCore.init();
};
