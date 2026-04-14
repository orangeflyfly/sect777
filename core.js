/**
 * V2.0 core.js (數據對接版)
 * 職責：引擎啟動、分頁調度、數據同步、全局初始化
 * 位置：/core.js (根目錄)
 */

// 1. 召喚所有子模組的神識
import { Player } from './entities/player.js';
import { CombatEngine } from './systems/CombatEngine.js';
import { DB } from './data/database.js'; // 🔹 新增：直接導入藏經閣總索引
import { UI_Battle } from './ui/ui_battle.js';
import { UI_Stats } from './ui/ui_stats.js';
import { UI_Bag } from './ui/ui_bag.js';
import { UI_Shop } from './ui/ui_shop.js';

export const Core = {
    /**
     * 啟動大陣：點燃宗門火種
     */
    init() {
        console.log("%c🕉️ 練功修練：V2.0 飛升大陣啟動...", "color: #fbbf24; font-weight: bold; font-size: 1.2em;");

        try {
            // A. 優先初始化玩家神識 (讀取存檔與境界記憶)
            Player.init();

            // B. 初始化所有介面模組 (掛載 DOM 監聽器)
            this.initAllUI();

            // C. 啟動戰鬥引擎 (自動讀取地圖記憶)
            CombatEngine.init(); 

            // D. 初次手動同步 UI 數據
            this.updateUI();
            
            // E. 開啟定時監控機制
            this.startGlobalRefresh();
            this.startAutoSave();

            // F. 預設顯示歷練畫面
            this.switchPage('battle');

            console.log("%c✅ 宗門運轉穩定，諸天模組連結成功。", "color: #10b981; font-weight: bold;");
        } catch (error) {
            console.error("❌ 飛升大陣點火失敗，請檢查各卷宗導入路徑：", error);
        }
    },

    /**
     * 初始化所有 UI 模組
     */
    initAllUI() {
        if (UI_Battle.init) UI_Battle.init();
        if (UI_Stats.init) UI_Stats.init();
        if (UI_Bag.init) UI_Bag.init();
        // UI_Shop 通常不需特殊 init，渲染時會處理
    },

    /**
     * 分頁切換調度 (支援 Flex 佈局優化)
     */
    switchPage(pageId) {
        try {
            // 隱藏所有分頁
            document.querySelectorAll('.game-page').forEach(p => p.style.display = 'none');
            
            // 顯示目標分頁 (使用 flex 確保佈局正確)
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                target.style.display = 'flex'; 
            }

            // 更新導覽按鈕發光狀態
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 觸發特定分頁的即時渲染
            switch (pageId) {
                case 'bag': UI_Bag.renderBag(); break;
                case 'shop': UI_Shop.renderShop(); break;
                case 'stats': UI_Stats.renderStats(); break;
            }
            
            console.log(`[Core] 視界切換至：${pageId}`);
        } catch (e) {
            console.error(`[Core] 分頁 ${pageId} 渲染異常:`, e);
        }
    },

    /**
     * 即時刷新全域 UI (如頂部狀態列)
     */
    updateUI() {
        if (!Player.data) return;
        
        const d = Player.data;
        const bStats = Player.getBattleStats();

        // A. 同步境界與等級文字 (直接對齊 DB 藏經閣)
        const realmEl = document.getElementById('player-realm');
        if (realmEl) {
            // 🔹 優化：直接從 DB 模組取值，不再看 window.DATA
            const realmName = (DB.CONFIG && DB.CONFIG.REALM_NAMES) 
                ? DB.CONFIG.REALM_NAMES[d.realm || 1] 
                : "凡人";
            realmEl.innerText = `${realmName} (Lv.${d.level})`;
        }

        // B. 同步靈石
        const coinEl = document.getElementById('player-coin');
        if (coinEl) {
            coinEl.innerText = Math.floor(d.coin || 0);
        }

        // C. 同步經驗條 (V1.9.0 滿經驗發光提醒突破)
        const expFill = document.getElementById('exp-fill');
        if (expFill) {
            const per = Math.min(100, (d.exp / d.maxExp) * 100);
            expFill.style.width = per + "%";
            
            if (per >= 100) {
                expFill.style.boxShadow = "0 0 15px #fbbf24";
                expFill.style.background = "#fbbf24";
            } else {
                expFill.style.boxShadow = "none";
                expFill.style.background = "linear-gradient(90deg, #6366f1, #818cf8)";
            }
        }

        // D. 同步歷練分頁的玩家血條
        if (UI_Battle) {
            const currentHp = d.hp !== undefined ? Math.max(0, d.hp) : bStats.maxHp;
            UI_Battle.updatePlayerHP(currentHp, bStats.maxHp);
        }
    },

    /**
     * 定時背景刷新 (每 500ms 兜底)
     */
    startGlobalRefresh() {
        setInterval(() => {
            this.updateUI();
        }, 500);
    },

    /**
     * 定時自動存檔 (每 30 秒一次)
     */
    startAutoSave() {
        setInterval(() => {
            if (Player.save) {
                Player.save();
            }
        }, 30000); 
    }
};

// 確保全域可存取 (供 HTML onclick 調用)
window.Core = Core;
