/**
 * V3.3 core.js (天道齒輪 - 經濟循環版)
 * 職責：引擎啟動、分頁調度、數據同步、全局初始化、驅動【仙草/靈礦】資源產出
 */

import { Player } from './entities/player.js';
import { CombatEngine } from './systems/CombatEngine.js';
import { DB } from './data/database.js'; 
import { UI_Battle } from './ui/ui_battle.js';
import { UI_Stats } from './ui/ui_stats.js';
import { UI_Bag } from './ui/ui_bag.js';
import { UI_Shop } from './ui/ui_shop.js';
import { UI_World } from './ui/ui_world.js';
import { SectManager } from './systems/SectManager.js'; 
import { TaskSystem } from './systems/TaskSystem.js'; 

export const Core = {
    init() {
        console.log("%c🕉️ 練功修練：V3.3 萬象森羅大陣啟動...", "color: #fbbf24; font-weight: bold; font-size: 1.2em;");

        try {
            Player.init();
            
            // 🟢 安全啟動所有 UI
            this.initAllUI();
            
            CombatEngine.init(); 
            this.updateUI();
            
            // 🟢 安全啟動外部系統 (即使報報錯也不影響主體)
            try { if (SectManager && SectManager.init) SectManager.init(); } catch (e) { console.warn("SectManager 尚未準備好", e); }
            try { if (TaskSystem && TaskSystem.init) TaskSystem.init(); } catch (e) { console.warn("TaskSystem 尚未準備好", e); }

            // 啟動 UI 自動刷新
            this.startGlobalRefresh();

            // 🌟 V3.3 新增：啟動宗門產出齒輪 (天道循環)
            this.startEconomyTick();

            // 預設切換到歷練頁面
            this.switchPage('battle');

            console.log("%c✅ 宗門運轉穩定，生產管線已接通。", "color: #10b981; font-weight: bold;");
        } catch (error) {
            console.error("❌ 飛升大陣點火發生致命錯誤：", error);
        }
    },

    initAllUI() {
        try { if (UI_Battle.init) UI_Battle.init(); } catch(e) { console.error("UI_Battle 啟動失敗", e); }
        try { if (UI_Stats.init) UI_Stats.init(); } catch(e) { console.error("UI_Stats 啟動失敗", e); }
        try { if (UI_Bag.init) UI_Bag.init(); } catch(e) { console.error("UI_Bag 啟動失敗", e); }
        try { if (UI_Shop.init) UI_Shop.init(); } catch(e) { console.error("UI_Shop 啟動失敗", e); }
        try { if (UI_World.init) UI_World.init(); } catch(e) { console.error("UI_World 啟動失敗", e); }
        // 注意：UI_Sect 的 init 若有報錯，確保該檔案存在
        try { if (window.UI_Sect && window.UI_Sect.init) window.UI_Sect.init(); } catch(e) { console.error("UI_Sect 啟動失敗", e); }
    },

    switchPage(pageId) {
        try {
            document.querySelectorAll('.game-page').forEach(p => p.style.display = 'none');
            
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                target.style.display = 'flex'; 
            }

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 觸發特定分頁動態渲染
            switch (pageId) {
                case 'bag': UI_Bag.renderBag(); break;
                case 'shop': UI_Shop.renderShop(); break;
                case 'stats': UI_Stats.renderStats(); break;
                case 'world': UI_World.renderWorld(); break; 
            }
            
            // 浮空鈕切換邏輯
            const btnToSect = document.getElementById('btn-jump-sect');
            const btnToBattle = document.getElementById('btn-jump-battle');

            if (pageId === 'sect' || pageId === 'world') {
                if (btnToSect) btnToSect.style.display = 'none';
                if (btnToBattle) btnToBattle.style.display = 'flex';
            } else {
                if (btnToSect) btnToSect.style.display = 'flex';
                if (btnToBattle) btnToBattle.style.display = 'none';
            }

            console.log(`[Core] 視界切換至：${pageId}`);
        } catch (e) {
            console.error(`[Core] 分頁 ${pageId} 渲染異常:`, e);
        }
    },

    /**
     * 🌟 V3.3 核心：天道經濟齒輪
     * 職責：每 60 秒驅動一次所有生產部門的結算
     */
    startEconomyTick() {
        console.log("%c[天道] 生產齒輪開始咬合 (週期: 60s)", "color: #4ade80;");
        
        setInterval(() => {
            let totalGainsLog = [];

            // 1. 驅動仙草園
            if (window.FarmSystem && window.FarmSystem.processTick) {
                const herbGained = window.FarmSystem.processTick();
                if (herbGained > 0) totalGainsLog.push(`🌿 仙草+${herbGained}`);
            }

            // 2. 驅動靈礦脈
            if (window.MineSystem && window.MineSystem.processTick) {
                const oreGained = window.MineSystem.processTick();
                if (oreGained > 0) totalGainsLog.push(`⛏️ 玄鐵+${oreGained}`);
            }

            // 如果有產出，在控制台小小提醒一下
            if (totalGainsLog.length > 0) {
                console.log(`%c[產出結算] ${totalGainsLog.join(' | ')}`, "color: #4ade80; font-size: 10px;");
                
                // 如果玩家剛好在「世界」頁面，順便幫他刷一下畫面數字
                const currentPage = document.querySelector('.game-page[style*="display: flex"]');
                if (currentPage && currentPage.id === 'page-world' && UI_World.renderWorld) {
                    UI_World.renderWorld();
                }
            }

            // 每一分鐘自動保存一次玉簡
            Player.save();

        }, 60000); // 每一分鐘跳動一次
    },

    updateUI() {
        if (!Player.data) return;
        
        const d = Player.data;
        const bStats = Player.getBattleStats();

        const realmEl = document.getElementById('player-realm');
        if (realmEl) {
            const realmName = (DB.CONFIG && DB.CONFIG.REALM_NAMES) 
                ? DB.CONFIG.REALM_NAMES[d.realm || 1] 
                : "凡人";
            realmEl.innerText = `${realmName} (Lv.${d.level})`;
        }

        const coinEl = document.getElementById('player-coin');
        if (coinEl) {
            coinEl.innerText = Math.floor(d.coin || 0);
        }

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

        if (window.UI_Battle) {
            const currentHp = d.hp !== undefined ? Math.max(0, d.hp) : bStats.maxHp;
            window.UI_Battle.updatePlayerHP(currentHp, bStats.maxHp);
        }
    },

    startGlobalRefresh() {
        setInterval(() => {
            this.updateUI();
        }, 500);
    }
};

window.Core = Core;

// 開發者測試指令
window.DEBUG_RESET = () => {
    if (confirm("⚠️ 警告：這將會清除所有本地存檔並重新開始，確定要逆轉時空嗎？")) {
        localStorage.clear();
        location.reload();
    }
};
