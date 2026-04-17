/**
 * V3.6.0 core.js (萬象天道演化 - 微縮視界接入版)
 * 職責：引擎核心導航、數據完整性防護、戰鬥準備管線、經濟隨機事件驅動、全產業與懸賞結算
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

import { AlchemySystem } from './systems/AlchemySystem.js';
import { BountySystem } from './systems/BountySystem.js'; 
import { VaultSystem } from './systems/VaultSystem.js';
import { ForgeSystem } from './systems/ForgeSystem.js'; // 🌟 引入煉器大殿大腦
import { UI_Sim } from './ui/ui_sim.js'; // 🌟 新增：引入微縮視界介面

export const Core = {
    // 陣法狀態鎖定
    isReady: false,
    version: "V3.6.0", // 🌟 版本升級
    
    // 戰鬥階段控制器 (對接戰鬥準備邏輯)
    battleState: "idle", // idle, preparing, fighting

    /**
     * 陣法點火：啟動全宗門邏輯
     */
    init() {
        console.log(`%c🕉️ 練功修練：${this.version} 萬象森羅大陣啟動...`, "color: #fbbf24; font-weight: bold; font-size: 1.5em; text-shadow: 0 0 12px rgba(251,191,36,0.6);");

        try {
            // 1. 喚醒基礎數據
            Player.init();
            this.ensureDataIntegrity(); 

            // 2. 啟動所有 UI 渲染單元
            this.initAllUI();
            
            // 3. 啟動戰鬥引擎 (預設停留在準備階段)
            CombatEngine.init(); 

            // 4. 喚醒各路子系統大腦
            this.initSystems();

            // 5. 啟動兩大核心循環：高頻 UI 刷新 與 低頻 天道經濟
            this.startGlobalRefresh(); 
            this.startEconomyTick();   

            // 6. 預設顯示畫面
            this.switchPage('battle');

            this.isReady = true;
            console.log("%c✅ 宗門天道運轉穩定，全產業靈脈連接完成。", "color: #10b981; font-weight: bold;");
        } catch (error) {
            console.error("❌ 飛升大陣點火發生致命錯誤，請排查靈脈路徑：", error);
        }
    },

    /**
     * 數據完整性守衛：自動補齊遺失的靈脈屬性
     */
    ensureDataIntegrity() {
        if (!Player.data) return;
        const d = Player.data;
        
        if (!d.world) {
            d.world = { 
                arrayLevel: 1, 
                lastCollect: Date.now(), 
                durability: 100, 
                farm: { level: 1, assigned: 0 }, 
                mine: { level: 1, assigned: 0 },
                alchemy: { level: 0, assigned: 0 },
                forge: { level: 0, assigned: 0 } 
            };
        }
        
        if (!d.world.alchemy) d.world.alchemy = { level: 0, assigned: 0 }; 
        if (!d.world.forge) d.world.forge = { level: 0, assigned: 0 }; 

        if (!d.materials) d.materials = { herb: 0, ore: 0 };
        if (!d.sect) d.sect = { disciples: [] };
        if (!d.skills) d.skills = [];
        if (!d.inventory) d.inventory = {}; 
        if (!d.forge) d.forge = { pityCount: 0, totalForged: 0 }; 
        
        // 修正：產業等級強制脫離「零」的領域 (煉丹閣與煉器殿除外，它們可以是 0 代表未解鎖)
        if (d.world.farm && d.world.farm.level < 1) d.world.farm.level = 1;
        if (d.world.mine && d.world.mine.level < 1) d.world.mine.level = 1;
        
        Player.save();
    },

    /**
     * 初始化全域介面：逐一嘗試喚醒，具備容錯機制
     */
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
                console.error(`${ui.name} 陣紋毀損，無法啟動:`, e);
            }
        });

        // 特別掛載全域宗門與招募系統
        try { 
            if (window.UI_Sect && window.UI_Sect.init) window.UI_Sect.init(); 
            if (window.UI_Recruit && window.UI_Recruit.init) window.UI_Recruit.init();
            if (window.UI_Alchemy && window.UI_Alchemy.init) window.UI_Alchemy.init(); 
            if (window.UI_Bounty && window.UI_Bounty.init) window.UI_Bounty.init();   
            if (window.UI_Vault && window.UI_Vault.init) window.UI_Vault.init(); 
            if (window.UI_Forge && window.UI_Forge.init) window.UI_Forge.init(); 
            if (window.UI_Sim && window.UI_Sim.init) window.UI_Sim.init(); // 🌟 新增：啟動微縮視界
        } catch(e) { 
            console.warn("高級宗門介面模組尚未歸位。"); 
        }
    },

    /**
     * 初始化背景系統：建立產能大腦
     */
    initSystems() {
        const sys = [
            { name: 'SectManager', ref: SectManager },
            { name: 'TaskSystem', ref: TaskSystem },
            { name: 'FarmSystem', ref: window.FarmSystem },
            { name: 'MineSystem', ref: window.MineSystem },
            { name: 'AlchemySystem', ref: AlchemySystem }, 
            { name: 'BountySystem', ref: BountySystem },   
            { name: 'VaultSystem', ref: VaultSystem },
            { name: 'ForgeSystem', ref: ForgeSystem }      
        ];

        sys.forEach(s => {
            try {
                if (s.ref && s.ref.init) s.ref.init();
            } catch (e) {
                console.warn(`${s.name} 系統暫時無法共鳴，可能需要前置條件。`);
            }
        });
    },

    /**
     * 分頁切換大陣：掌管所有頁面的顯示與隱藏
     */
    switchPage(pageId) {
        if (!this.isReady && pageId !== 'battle') return;

        try {
            const pages = document.querySelectorAll('.game-page');
            pages.forEach(p => p.style.display = 'none');
            
            const target = document.getElementById(`page-${pageId}`);
            if (target) {
                target.style.display = 'flex'; 
            }

            // 同步導航按鈕樣式
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[onclick*="'${pageId}'"]`) || 
                        document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
            if (btn) btn.classList.add('active');

            // 觸發特定頁面的即時渲染管線
            this.triggerPageUpdate(pageId);
            
            // 更新浮空跳轉鈕
            this.refreshFloatingControls(pageId);

            console.log(`%c[Core] 天道視界切換至：${pageId}`, "color: #60a5fa; font-style: italic;");
        } catch (e) {
            console.error(`[Core] 視界切換異常，無法降臨於 ${pageId}:`, e);
        }
    },

    /**
     * 頁面更新分流器
     */
    triggerPageUpdate(pageId) {
        switch (pageId) {
            case 'bag': UI_Bag.renderBag?.(); break;
            case 'shop': UI_Shop.renderShop?.(); break;
            case 'stats': UI_Stats.renderStats?.(); break;
            case 'world': UI_World.renderWorld?.(); break; 
            case 'sect': window.UI_Sect?.renderSect?.(); break;
            case 'sim': window.UI_Sim?.updateDisciples?.(); break; // 🌟 新增：切入視界時立刻同步弟子位置
            case 'battle': 
                if (this.battleState === 'idle') this.prepareBattleStage();
                break;
        }
    },

    /**
     * 戰鬥準備階段處理
     */
    prepareBattleStage() {
        this.battleState = "preparing";
        console.log("%c[歷練] 進入戰鬥準備階段...", "color: #fb7185;");
    },

    refreshFloatingControls(pageId) {
        const btnSect = document.getElementById('btn-jump-sect');
        const btnBattle = document.getElementById('btn-jump-battle');
        // 🌟 新增：當進入宗門、世界或模擬視界時，隱藏「回宗門」按鈕
        const hideSect = (pageId === 'sect' || pageId === 'world' || pageId === 'sim');

        if (btnSect) btnSect.style.display = hideSect ? 'none' : 'flex';
        if (btnBattle) btnBattle.style.display = hideSect ? 'flex' : 'none';
    },

    /**
     * 🌟 V3.5 核心：天道經濟循環
     * 職責：精算產出、觸發環境隨機事件、對接數據持久化
     */
    startEconomyTick() {
        const CYCLE = 60000; // 每分鐘一次天道結算
        console.log("%c[天道] 經濟齒輪開始咬合，每 60 秒觀照一次全宗門產出與消耗。", "color: #4ade80; font-weight: bold;");
        
        setInterval(() => {
            if (!this.isReady) return;

            let tickReport = [];
            
            // --- 隨機環境干擾 ---
            let globalMult = 1.0;
            if (Math.random() < 0.15) { 
                const worldEvents = [
                    { msg: "🌈 紫氣東來！產能提升 80%！", mult: 1.8, color: 'gold' },
                    { msg: "⚡ 地脈雷動！產量提升 50%！", mult: 1.5, color: '#fbbf24' },
                    { msg: "🌑 靈氣枯竭... 全產能暫時下降 20%", mult: 0.8, color: '#94a3b8' }
                ];
                const evt = worldEvents[Math.floor(Math.random() * worldEvents.length)];
                globalMult = evt.mult;
                if (window.MessageCenter) window.MessageCenter.log(evt.msg, evt.color);
            }
            
            // --- 1. 結算仙草 ---
            if (window.FarmSystem?.processTick) {
                const herb = window.FarmSystem.processTick(globalMult);
                if (herb > 0) tickReport.push(`🌿 仙草 +${herb}`);
            }

            // --- 2. 結算玄鐵 ---
            if (window.MineSystem?.processTick) {
                const ore = window.MineSystem.processTick(globalMult);
                if (ore > 0) tickReport.push(`⛏️ 玄鐵 +${ore}`);
            }

            // --- 3. 結算煉丹 (消耗仙草，產出丹藥)
            if (AlchemySystem && AlchemySystem.processTick) {
                AlchemySystem.processTick(globalMult);
            }

            // --- 4. 結算懸賞堂歷練 (弟子歸來) 
            if (BountySystem && BountySystem.processTick) {
                BountySystem.processTick();
            }

            // --- 介面即時同步與存檔 ---
            if (tickReport.length > 0) {
                console.log(`%c[天道結算] ${tickReport.join(' | ')} (套用環境倍率 x${globalMult})`, "color: #4ade80;");
                if (this.isPageActive('world')) UI_World.renderWorld();
            }

            Player.save();

        }, CYCLE);
    },

    isPageActive(pageId) {
        const el = document.getElementById(`page-${pageId}`);
        return el && el.style.display !== 'none';
    },

    /**
     * 高頻介面刷新 (500ms)：處理血條、靈石、經驗值
     */
    updateUI() {
        if (!Player.data) return;
        
        const d = Player.data;
        const bStats = Player.getBattleStats();

        // 1. 境界稱號顯示
        const realmEl = document.getElementById('player-realm');
        if (realmEl) {
            const realmName = DB.CONFIG?.REALM_NAMES?.[d.realm || 1] || "凡人";
            realmEl.innerText = `${realmName} (Lv.${d.level})`;
        }

        // 2. 靈石格式化 (1,000 樣式)
        const coinEl = document.getElementById('player-coin');
        if (coinEl) {
            coinEl.innerText = Math.floor(d.coin || 0).toLocaleString();
        }

        // 3. 經驗值進度條與發光效果
        const expFill = document.getElementById('exp-fill');
        if (expFill) {
            const per = Math.min(100, (d.exp / d.maxExp) * 100);
            expFill.style.width = per + "%";
            // 當經驗滿時增加呼吸燈效果
            expFill.className = per >= 100 ? "fill fill-exp exp-full-glow" : "fill fill-exp";
        }

        // 4. 戰鬥 HP 同步
        if (window.UI_Battle) {
            const hp = d.hp !== undefined ? Math.max(0, d.hp) : bStats.maxHp;
            window.UI_Battle.updatePlayerHP(hp, bStats.maxHp);
        }
    },

    startGlobalRefresh() {
        setInterval(() => this.updateUI(), 500);
    }
};

window.Core = Core;

/**
 * 終極時空倒流：清除存檔 (統一定義在此，HTML的會呼叫這個或被這個覆蓋，安全無虞)
 */
window.DEBUG_RESET = () => {
    if (confirm("⚠️ 警告：這將會清除所有本地存檔並重新開始，確定要逆轉時空嗎？")) {
        localStorage.clear();
        location.reload();
    }
};
