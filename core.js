/**
 * V3.3.5 core.js (萬象天道迴圈 - 系統共鳴版)
 * 職責：引擎啟動、分頁調度、數據同步、全局初始化、驅動【萬象森羅】全系統運轉
 * 位置：/core.js
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
    // 陣法狀態
    isReady: false,

    init() {
        console.log("%c🕉️ 練功修練：V3.3.5 萬象森羅大陣啟動...", "color: #fbbf24; font-weight: bold; font-size: 1.5em; text-shadow: 0 0 10px rgba(251,191,36,0.5);");

        try {
            // 1. 基礎數據初始化
            Player.init();
            this.ensureDataIntegrity(); // 🌟 新增：數據完整性檢查

            // 2. 啟動所有 UI 介面
            this.initAllUI();
            
            // 3. 啟動戰鬥引擎
            CombatEngine.init(); 

            // 4. 啟動外部子系統 (防崩潰保護)
            this.initSystems();

            // 5. 啟動兩大天道齒輪
            this.startGlobalRefresh(); // UI 高頻刷新
            this.startEconomyTick();   // 經濟產出結算

            // 6. 預設切換至歷練
            this.switchPage('battle');

            this.isReady = true;
            console.log("%c✅ 宗門天道已成，生產管線與靈氣結界同步完成。", "color: #10b981; font-weight: bold;");
        } catch (error) {
            console.error("❌ 飛升大陣點火發生致命錯誤，請檢查檔案路徑：", error);
        }
    },

    /**
     * 🌟 新增：數據完整性檢查 (Data Integrity Guard)
     * 預防因為版本更新導致舊存檔缺乏新屬性而崩潰
     */
    ensureDataIntegrity() {
        const d = Player.data;
        if (!d.world) d.world = { arrayLevel: 1, lastCollect: Date.now(), durability: 100, farm: { level: 1, assigned: 0 }, mine: { level: 1, assigned: 0 } };
        if (!d.materials) d.materials = { herb: 0, ore: 0 };
        if (!d.sect) d.sect = { disciples: [] };
        
        // 確保產業不是 0 級 (0 級會導致產出為 0)
        if (d.world.farm && d.world.farm.level === 0) d.world.farm.level = 1;
        if (d.world.mine && d.world.mine.level === 0) d.world.mine.level = 1;
        
        Player.save();
    },

    initAllUI() {
        const uis = [
            { name: 'UI_Battle', ref: UI_Battle },
            { name: 'UI_Stats', ref: UI_Stats },
            { name: 'UI_Bag', ref: UI_Bag },
            { name: 'UI_Shop', ref: UI_Shop },
            { name: 'UI_World', ref: UI_World }
        ];

        uis.forEach(ui => {
            try {
                if (ui.ref && ui.ref.init) ui.ref.init();
            } catch (e) {
                console.error(`${ui.name} 啟動失敗:`, e);
            }
        });

        // 特別掛載全域 UI_Sect (若有)
        try { 
            if (window.UI_Sect && window.UI_Sect.init) window.UI_Sect.init(); 
            if (window.UI_Recruit && window.UI_Recruit.init) window.UI_Recruit.init();
        } catch(e) { 
            console.warn("部分高級宗門介面尚未掛載完成"); 
        }
    },

    initSystems() {
        const sys = [
            { name: 'SectManager', ref: SectManager },
            { name: 'TaskSystem', ref: TaskSystem },
            { name: 'FarmSystem', ref: window.FarmSystem },
            { name: 'MineSystem', ref: window.MineSystem }
        ];

        sys.forEach(s => {
            try {
                if (s.ref && s.ref.init) s.ref.init();
            } catch (e) {
                console.warn(`${s.name} 系統初始化略過或失敗`);
            }
        });
    },

    /**
     * 分頁調度與即時渲染
     */
    switchPage(pageId) {
        try {
            const pages = document.querySelectorAll('.game-page');
            pages.forEach(p => p.style.display = 'none');
            
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                target.style.display = 'flex'; 
            }

            // 更新導航按鈕狀態
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 🌟 強制執行目標分頁的精準渲染
            this.triggerPageRender(pageId);
            
            // 浮空鈕處理
            this.updateFloatingButtons(pageId);

            console.log(`%c[Core] 視界切換：${pageId}`, "color: #60a5fa;");
        } catch (e) {
            console.error(`[Core] 分頁切換異常:`, e);
        }
    },

    triggerPageRender(pageId) {
        switch (pageId) {
            case 'bag': if (UI_Bag.renderBag) UI_Bag.renderBag(); break;
            case 'shop': if (UI_Shop.renderShop) UI_Shop.renderShop(); break;
            case 'stats': if (UI_Stats.renderStats) UI_Stats.renderStats(); break;
            case 'world': if (UI_World.renderWorld) UI_World.renderWorld(); break; 
            case 'sect': if (window.UI_Sect && window.UI_Sect.renderSect) window.UI_Sect.renderSect(); break;
        }
    },

    updateFloatingButtons(pageId) {
        const btnToSect = document.getElementById('btn-jump-sect');
        const btnToBattle = document.getElementById('btn-jump-battle');
        const isSafePage = (pageId === 'sect' || pageId === 'world');

        if (btnToSect) btnToSect.style.display = isSafePage ? 'none' : 'flex';
        if (btnToBattle) btnToBattle.style.display = isSafePage ? 'flex' : 'none';
    },

    /**
     * 🌟 V3.3.5 核心：天道經濟齒輪 (不准簡化強化版)
     * 職責：精算產出、處理隨機事件、強制同步介面
     */
    startEconomyTick() {
        const TICK_TIME = 60000; // 60秒一週期
        console.log("%c[天道] 生產齒輪開始咬合，每 60 秒進行一次萬象結算。", "color: #4ade80; font-weight: bold;");
        
        setInterval(() => {
            if (!this.isReady) return;

            let report = [];
            
            // --- [1] 隨機事件判定 (天降機緣) ---
            let eventMult = 1.0;
            if (Math.random() < 0.1) {
                const events = [
                    { msg: "🌈 天降甘露，全宗門產能提升 50%！", mult: 1.5 },
                    { msg: "💥 地脈震動，採集受到些許干擾...", mult: 0.8 },
                    { msg: "✨ 靈氣爆發，產量翻倍！", mult: 2.0 }
                ];
                const evt = events[Math.floor(Math.random() * events.length)];
                eventMult = evt.mult;
                window.MessageCenter.log(evt.msg, "gold");
            }

            // --- [2] 執行各部門結算 ---
            // 仙草園
            if (window.FarmSystem && window.FarmSystem.processTick) {
                const gained = window.FarmSystem.processTick();
                if (gained > 0) report.push(`🌿 仙草+${Math.floor(gained * eventMult)}`);
            }

            // 靈礦脈
            if (window.MineSystem && window.MineSystem.processTick) {
                const gained = window.MineSystem.processTick();
                if (gained > 0) report.push(`⛏️ 玄鐵+${Math.floor(gained * eventMult)}`);
            }

            // --- [3] 同步與存檔 ---
            if (report.length > 0) {
                console.log(`%c[天道結算] ${report.join(' | ')}`, "color: #4ade80;");
                
                // 強制刷新世界介面數據
                if (this.isCurrentPage('world')) {
                    UI_World.renderWorld();
                }
            }

            Player.save();

        }, TICK_TIME);
    },

    isCurrentPage(pageId) {
        const el = document.getElementById(`page-${pageId}`);
        return el && el.style.display === 'flex';
    },

    /**
     * 全局介面高頻刷新 (500ms)
     */
    updateUI() {
        if (!Player.data) return;
        
        const d = Player.data;
        const bStats = Player.getBattleStats();

        // 1. 境界與等級
        const realmEl = document.getElementById('player-realm');
        if (realmEl) {
            const realmName = (DB.CONFIG && DB.CONFIG.REALM_NAMES) 
                ? DB.CONFIG.REALM_NAMES[d.realm || 1] 
                : "凡人";
            realmEl.innerText = `${realmName} (Lv.${d.level})`;
        }

        // 2. 靈石顯示 (加強：防 NaN)
        const coinEl = document.getElementById('player-coin');
        if (coinEl) {
            coinEl.innerText = Math.floor(d.coin || 0).toLocaleString();
        }

        // 3. 經驗條
        const expFill = document.getElementById('exp-fill');
        if (expFill) {
            const per = Math.min(100, (d.exp / d.maxExp) * 100);
            expFill.style.width = per + "%";
            expFill.style.filter = per >= 100 ? "brightness(1.5) drop-shadow(0 0 5px #fbbf24)" : "none";
        }

        // 4. 戰鬥 HP (同步)
        if (window.UI_Battle) {
            const currentHp = d.hp !== undefined ? Math.max(0, d.hp) : bStats.maxHp;
            window.UI_Battle.updatePlayerHP(currentHp, bStats.maxHp);
        }
    },

    startGlobalRefresh() {
        setInterval(() => this.updateUI(), 500);
    }
};

window.Core = Core;

// 終極重置指令
window.DEBUG_RESET = () => {
    if (confirm("⚠️ 警告：這將會清除所有本地存檔並重新開始，確定要逆轉時空嗎？")) {
        localStorage.clear();
        location.reload();
    }
};
