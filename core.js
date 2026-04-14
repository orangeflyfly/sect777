/**
 * V1.9.0 core.js (練功修練啟動版)
 * 職責：引擎啟動、分頁調度、高頻數據同步、全局初始化。
 * 修正點：
 * 1. 對接 V1.9.0 新版存檔 (SaveManager)。
 * 2. 強化 `updateUI` 邏輯，確保與「境界突破」系統無縫同步。
 * 3. 確保地圖記憶與 `CombatEngine` 的初始化時序正確。
 * 4. 修復 `display: flex` 跑版問題，完美適配基礎容器。
 */

const GameCore = {
    // 1. 啟動大陣
    init() {
        console.log("🕉️ 練功修練：宗門大陣開始點火 (V1.9.0)...");

        // A. 優先初始化玩家神識 (確保能讀取到存檔與地圖記憶)
        if (typeof Player !== 'undefined') {
            Player.init();
        } else {
            console.error("❌ 致命錯誤：找不到 Player 模組！");
            return;
        }

        // B. 初始化各介面模組
        this.initAllUI();

        // C. 啟動戰鬥引擎 (V1.9.0：不傳遞 mapId，讓引擎自己去讀 Player 存檔裡的地圖)
        if (typeof CombatEngine !== 'undefined') {
            CombatEngine.init(); 
        }

        // D. 初次手動刷新一次 UI 與綁定自動迴圈
        this.updateUI();
        this.startGlobalRefresh();
        this.startAutoSave();

        // E. 預設切換至戰鬥畫面
        this.switchPage('battle');

        console.log("✅ 宗門運轉穩定，神識連結成功。");
    },

    /**
     * 初始化所有 UI 模組
     */
    initAllUI() {
        if (typeof UI_Battle !== 'undefined' && UI_Battle.init) UI_Battle.init();
        if (typeof UI_Stats !== 'undefined' && UI_Stats.init) UI_Stats.init(); // 新增：提早初始化修為介面
        if (typeof UI_Bag !== 'undefined' && UI_Bag.init) UI_Bag.init();
    },

    /**
     * 分頁切換調度
     */
    switchPage(pageId) {
        try {
            // 切換隱藏/顯示
            document.querySelectorAll('.game-page').forEach(p => p.style.display = 'none');
            
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                // V1.8.2 / V1.9.0 修正：必須使用 flex，否則會破壞 base.css 裡的 flex-direction: column 佈局
                target.style.display = 'flex'; 
            }

            // 更新底部導覽按鈕狀態
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 根據不同分頁觸發重新渲染
            if (pageId === 'bag' && typeof UI_Bag !== 'undefined') UI_Bag.renderBag();
            if (pageId === 'shop' && typeof UI_Shop !== 'undefined') UI_Shop.renderShop();
            if (pageId === 'stats' && typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            
            console.log(`[Core] 視界已切換至：${pageId}`);
        } catch (e) {
            console.error(`[Core] 分頁 ${pageId} 渲染異常:`, e);
        }
    },

    /**
     * V1.9.0 強化版：提供給坊市、戰鬥引擎的「即時刷新」接口
     */
    updateUI() {
        if (typeof Player === 'undefined' || !Player.data) return;
        
        const d = Player.data;
        const bStats = Player.getBattleStats();

        // A. 同步境界與等級文字 (對齊 V1.9.0 Realm 設定)
        const realmEl = document.getElementById('player-realm');
        if (realmEl) {
            const dataSrc = window.DATA || window.GAMEDATA;
            const realmName = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.REALM_NAMES) 
                ? dataSrc.CONFIG.REALM_NAMES[d.realm || 1] 
                : "未知境界";
            realmEl.innerText = `${realmName} (Lv.${d.level})`;
        }

        // B. 同步靈石
        const coinEl = document.getElementById('player-coin');
        if (coinEl) {
            coinEl.innerText = Math.floor(d.coin || 0);
        }

        // C. 同步經驗條 (新增滿經驗發光提示)
        const expFill = document.getElementById('exp-fill');
        if (expFill) {
            const per = Math.min(100, (d.exp / d.maxExp) * 100);
            expFill.style.width = per + "%";
            
            // 如果經驗滿了，讓經驗條有發光效果提醒突破
            if (per >= 100) {
                expFill.style.boxShadow = "0 0 10px #fbbf24";
                expFill.style.background = "#fbbf24";
            } else {
                expFill.style.boxShadow = "none";
                expFill.style.background = "linear-gradient(90deg, #6366f1, #818cf8)";
            }
        }

        // D. 同步玩家血條 (確保扣血正確顯示)
        if (typeof UI_Battle !== 'undefined') {
            const currentHp = d.hp !== undefined ? Math.max(0, d.hp) : bStats.maxHp;
            UI_Battle.updatePlayerHP(currentHp, bStats.maxHp);
        }
    },

    /**
     * 定時背景刷新 (兜底同步機制)
     */
    startGlobalRefresh() {
        // 將主要同步邏輯抽離到 updateUI 後，這裡只需每 500ms 兜底刷新
        setInterval(() => {
            this.updateUI();
        }, 500);
    },

    /**
     * 定時自動存檔 (保障神識不滅)
     */
    startAutoSave() {
        setInterval(() => {
            if (typeof Player !== 'undefined' && Player.save) {
                Player.save();
                // 為了避免洗版 Console，將備份訊息改為較隱蔽的輸出，或依賴 Debug 模式
                // console.log("[Core] 神識備份完成。");
            }
        }, 30000); // 每 30 秒自動存檔
    }
};

// 確保全域可存取
window.Core = GameCore;
