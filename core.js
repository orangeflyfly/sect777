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
        try {
            // 切換隱藏/顯示
            document.querySelectorAll('.game-page').forEach(p => p.style.display = 'none');
            const target = document.getElementById(`page-${pageId}`);
            if (target) target.style.display = 'block';

            // 更新按鈕樣式
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 觸發各分頁的專屬渲染
            if (pageId === 'bag' && typeof UI_Bag !== 'undefined') UI_Bag.renderBag();
            if (pageId === 'shop' && typeof UI_Shop !== 'undefined') UI_Shop.renderShop();
            if (pageId === 'stats' && typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            
            console.log(`[Core] 已切換至：${pageId}`);
        } catch (e) {
            console.error(`[Core] 分頁 ${pageId} 渲染異常:`, e);
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
            if (Player && Player.save) {
                Player.save();
                console.log("[Core] 神識備份成功 (Auto-Saved)");
            }
        }, 30000);
    }
};

// 修正對接：確保 HTML 的 Core.switchPage 能夠指向 GameCore 物件
window.Core = GameCore;

// 頁面載入後自動啟動
window.onload = () => GameCore.init();
