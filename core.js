/**
 * V2.2.5 core.js (飛升模組版 - 平衡更新與手動存檔)
 * 職責：引擎啟動、分頁調度、數據同步、全局初始化
 */

// 1. 召喚所有子模組的神識
import { Player } from './entities/player.js';
import { CombatEngine } from './systems/CombatEngine.js';
import { DB } from './data/database.js'; 
import { UI_Battle } from './ui/ui_battle.js';
import { UI_Stats } from './ui/ui_stats.js';
import { UI_Bag } from './ui/ui_bag.js';
import { UI_Shop } from './ui/ui_shop.js';
import { UI_World } from './ui/ui_world.js';// 🟢 新增：導入小世界神識
import { SectManager } from './systems/SectManager.js'; // 🟢 新增：導入宗門大腦
import { TaskSystem } from './systems/TaskSystem.js'; // 🟢 新增：導入任務懸賞大腦

export const Core = {
    /**
     * 啟動大陣：點燃宗門火種
     */
    init() {
        console.log("%c🕉️ 練功修練：V2.0 飛升大陣啟動...", "color: #fbbf24; font-weight: bold; font-size: 1.2em;");

        try {
            Player.init();
            this.initAllUI();
            CombatEngine.init(); 
            this.updateUI();
            
            SectManager.init(); // 🟢 啟動宗門大腦，計算離線收益
            TaskSystem.init();  // 🟢 啟動任務大腦，生成懸賞榜單

            this.startGlobalRefresh();
            
            // 🔴 封印心魔：拔除自動存檔，將命運交還給修士手動掌控
            // this.startAutoSave(); 

            this.switchPage('battle');

            console.log("%c✅ 宗門運轉穩定，諸天模組連結成功。", "color: #10b981; font-weight: bold;");
        } catch (error) {
            console.error("❌ 飛升大陣點火失敗，請檢查各卷宗導入路徑：", error);
        }
    },

    initAllUI() {
        if (UI_Battle.init) UI_Battle.init();
        if (UI_Stats.init) UI_Stats.init();
        if (UI_Bag.init) UI_Bag.init();
        // 🟢 初始化小世界 (結算離線收益)
        if (UI_World.init) UI_World.init(); 
    },

    /**
     * 分頁切換調度 (支援 Flex 佈局優化)
     */
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

            // 🟢 觸發特定分頁的即時渲染 (加入 world)
            switch (pageId) {
                case 'bag': UI_Bag.renderBag(); break;
                case 'shop': UI_Shop.renderShop(); break;
                case 'stats': UI_Stats.renderStats(); break;
                case 'world': UI_World.renderWorld(); break; 
            }
            
            // 🟢 新增：處理浮空鈕切換 (界域跳轉邏輯)
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
    },

    // 🔴 封印心魔：保留陣紋但不啟動
    startAutoSave() {
        console.log("[Core] 自動存檔已關閉，請修士善用修為頁面的手動存檔。");
        /*
        setInterval(() => {
            if (Player.save) {
                Player.save();
            }
        }, 30000); 
        */
    }
};

window.Core = Core;

// 🟢 新增：開發者測試指令 (供控制台或秘密按鈕調用)
window.DEBUG_RESET = () => {
    if (confirm("⚠️ 警告：這將會清除所有本地存檔並重新開始，確定要逆轉時空嗎？")) {
        localStorage.clear();
        location.reload();
    }
};
