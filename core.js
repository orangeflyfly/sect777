/**
 * V1.8.2 core.js
 * 職責：引擎啟動、分頁調度、高頻數據同步、全局初始化。
 * 修正點：修復 display: flex 跑版問題、對接正確的 Player.data.hp、新增 updateUI 即時刷新接口
 */

const GameCore = {
    // 1. 啟動大陣
    init() {
        console.log("🕉️ 宗門大陣開始點火 (V1.8.2)...");

        if (typeof Player !== 'undefined') {
            Player.init();
        } else {
            console.error("❌ 致命錯誤：找不到 Player 模組！");
            return;
        }

        this.initAllUI();

        if (typeof CombatEngine !== 'undefined') {
            CombatEngine.init(); 
        }

        // 初次手動刷新一次 UI
        this.updateUI();
        this.startGlobalRefresh();
        this.startAutoSave();

        this.switchPage('battle');

        console.log("✅ 宗門運轉穩定，神識連結成功。");
    },

    initAllUI() {
        if (typeof UI_Battle !== 'undefined' && UI_Battle.init) UI_Battle.init();
        if (typeof UI_Bag !== 'undefined' && UI_Bag.init) UI_Bag.init();
    },

    switchPage(pageId) {
        try {
            // 切換隱藏/顯示
            document.querySelectorAll('.game-page').forEach(p => p.style.display = 'none');
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                // V1.8.2 修正：必須使用 flex，否則會破壞 base.css 裡的 flex-direction: column 佈局
                target.style.display = 'flex'; 
            }

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            if (pageId === 'bag' && typeof UI_Bag !== 'undefined') UI_Bag.renderBag();
            if (pageId === 'shop' && typeof UI_Shop !== 'undefined') UI_Shop.renderShop();
            if (pageId === 'stats' && typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            
            console.log(`[Core] 已切換至：${pageId}`);
        } catch (e) {
            console.error(`[Core] 分頁 ${pageId} 渲染異常:`, e);
        }
    },

    // V1.8.2 新增：提供給坊市、戰鬥引擎的「即時刷新」接口
    updateUI() {
        if (!Player || !Player.data) return;
        const d = Player.data;
        const bStats = Player.getBattleStats();

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

        // D. 同步玩家血條
        if (typeof UI_Battle !== 'undefined') {
            // V1.8.2 修正：對接 Player.data.hp，確保扣血能正確顯示
            const currentHp = d.hp !== undefined ? Math.max(0, d.hp) : bStats.maxHp;
            UI_Battle.updatePlayerHP(currentHp, bStats.maxHp);
        }
    },

    // 定時背景刷新
    startGlobalRefresh() {
        // 將主要同步邏輯抽離到 updateUI 後，這裡只需每 500ms 兜底刷新
        setInterval(() => {
            this.updateUI();
        }, 500);
    },

    // 定時存檔
    startAutoSave() {
        setInterval(() => {
            if (Player && Player.save) {
                Player.save();
                console.log("[Core] 神識備份完成。");
            }
        }, 30000);
    }
};

window.Core = GameCore;
