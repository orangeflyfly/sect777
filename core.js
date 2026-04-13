/**
 * V1.8.1 core.js
 * 職責：引擎啟動、分頁調度、高頻數據同步、全局初始化。
 * 修正：對接 CombatEngine、補齊 HP 同步、優化資料讀取路徑。
 */

const GameCore = {
    // 1. 啟動大陣
    init() {
        console.log("🕉️ 宗門大陣開始點火 (V1.8.1)...");

        // A. 初始化玩家數據 (此處會觸發 SaveManager.load)
        if (typeof Player !== 'undefined') {
            Player.init();
        } else {
            console.error("❌ 致命錯誤：找不到 Player 模組！");
            return;
        }

        // B. 初始化 UI 各堂口結構
        this.initAllUI();

        // C. 啟動戰鬥引擎 (修正命名)
        if (typeof CombatEngine !== 'undefined') {
            CombatEngine.init(); 
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
        if (typeof UI_Battle !== 'undefined' && UI_Battle.init) UI_Battle.init();
        if (typeof UI_Bag !== 'undefined' && UI_Bag.init) UI_Bag.init();
        // UI_Stats 的結構初始化由其內部 ensureStatsStructure 在渲染時處理
    },

    // 3. 分頁切換邏輯
    switchPage(pageId) {
        try {
            // 切換隱藏/顯示
            document.querySelectorAll('.game-page').forEach(p => p.style.display = 'none');
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                // 如果你的 CSS 頁面是網格或彈性佈局，請根據實際情況修改 'block'
                target.style.display = 'block'; 
            }

            // 更新按鈕樣式
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            // 修正選擇器：更精準地抓取包含特定 pageId 的 onclick 屬性按鈕
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 觸發分頁專屬渲染
            if (pageId === 'bag' && typeof UI_Bag !== 'undefined') UI_Bag.renderBag();
            if (pageId === 'shop' && typeof UI_Shop !== 'undefined') UI_Shop.renderShop();
            if (pageId === 'stats' && typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            
            console.log(`[Core] 已切換至：${pageId}`);
        } catch (e) {
            console.error(`[Core] 分頁 ${pageId} 渲染異常:`, e);
        }
    },

    // 4. 全局數據同步 (每 200ms 刷新一次資訊欄)
    startGlobalRefresh() {
        setInterval(() => {
            if (!Player || !Player.data) return;
            const d = Player.data;
            const bStats = Player.getBattleStats(); // 獲取考慮裝備後的最終數值

            // A. 同步境界文字
            const realmEl = document.getElementById('player-realm');
            if (realmEl) {
                const realmName = DATA.CONFIG.REALM_NAMES[d.realm] || "未知境界";
                realmEl.innerText = `${realmName} (Lv.${d.level})`;
            }

            // B. 同步靈石
            const coinEl = document.getElementById('player-coin');
            if (coinEl) {
                coinEl.innerText = Math.floor(d.coin);
            }

            // C. 同步經驗條
            const expFill = document.getElementById('exp-fill');
            if (expFill) {
                const per = (d.exp / d.maxExp) * 100;
                expFill.style.width = Math.min(100, per) + "%";
            }

            // D. 新增：同步玩家血條 (這是 V1.7 漏掉的重點)
            if (typeof UI_Battle !== 'undefined') {
                // 這裡假設戰鬥引擎會動態修改 Player.data.currentHp
                // 如果目前沒做扣血，則預設顯示滿血
                const currentHp = d.currentHp !== undefined ? d.currentHp : bStats.maxHp;
                UI_Battle.updatePlayerHP(currentHp, bStats.maxHp);
            }
        }, 200);
    },

    // 5. 定時存檔 (每 30 秒)
    startAutoSave() {
        setInterval(() => {
            if (Player && Player.save) {
                Player.save();
                // 為了不干擾玩家，存檔提示可以改用 console 或者淡淡的提示
                console.log("[Core] 神識備份完成。");
            }
        }, 30000);
    }
};

// 全域對接
window.Core = GameCore;
