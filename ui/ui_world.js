/**
 * V2.4 ui_world.js
 * 職責：洞府渲染、掛機收益、產業多級升級、聚靈陣修復、資源即時顯示
 * 位置：/ui/ui_world.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_World = {
    // 1. 初始化與數據結構加固
    init() {
        console.log("【UI_World】洞府法陣啟動...");
        this.renderLayout();
        
        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1,
                lastCollect: Date.now()
            };
        }
        
        const w = Player.data.world;
        // 確保新屬性存在：耐久度與產業等級
        if (w.workers === undefined) w.workers = 0;
        if (w.durability === undefined) w.durability = 100; // 聚靈陣耐久度
        if (!w.farm) w.farm = { level: 0, assigned: 0 };
        if (!w.mine) w.mine = { level: 0, assigned: 0 };

        Player.save();
        this.calculateOfflineGains(true);
        this.renderWorld();
    },

    // 2. 注入 HTML 骨架
    renderLayout() {
        const container = document.getElementById('page-world');
        if (!container) return;
        container.innerHTML = `
            <div class="page-title">隨身洞府</div>
            <div id="world-resource-bar" class="world-res-bar"></div>
            <div id="world-content" style="flex:1; overflow-y:auto; padding-bottom:20px;"></div>
        `;
    },

    // 3. 渲染動態產出面板
    renderWorld() {
        const container = document.getElementById('world-content');
        const resBar = document.getElementById('world-resource-bar');
        if (!container || !Player.data) return;

        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        // --- 1. 聚靈陣邏輯：計算進度與效率 (受耐久度影響) ---
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 }; // 5分, 30分, 8時
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        const isFull = elapsedSeconds >= maxSeconds;
        if (isFull) elapsedSeconds = maxSeconds;
        
        // 效率受損：耐久度低於 50% 時，靈氣匯聚減緩
        const efficiency = wData.durability < 50 ? 0.5 : 1.0;
        const pendingExp = Math.floor((elapsedSeconds / 10) * efficiency);
        const progressPercent = Math.min(100, (elapsedSeconds / maxSeconds) * 100);

        // --- 2. 產業產出預覽 (根據等級倍增) ---
        const mineYield = wData.mine.assigned * wData.mine.level * 2; 
        const farmYield = wData.farm.assigned * wData.farm.level; 
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        // --- 3. 渲染資源看板 ---
        this.updateResourceBar();

        // --- 4. 主內容渲染 ---
        container.innerHTML = `
            <div class="world-array-card">
                <div class="array-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="array-title">聚靈陣 (階級 ${wData.arrayLevel})</div>
                    <div class="array-durability" style="font-size:12px; color:${wData.durability < 30 ? '#ef4444' : '#94a3b8'}">
                        🔧 耐久: ${wData.durability}%
                    </div>
                </div>

                <div class="array-core ${isFull ? 'full' : 'active'}" style="margin:15px auto;">
                    <div class="array-glow" style="opacity: ${wData.durability / 100}"></div>
                    <span style="font-size:40px; position:relative; z-index:2;">☯️</span>
                </div>
                
                <div class="array-status">
                    <p>當前凝聚靈氣：<b style="color:var(--exp-color)">${pendingExp}</b> EXP ${efficiency < 1 ? '<span style="color:#ef4444;font-size:11px;">(效率受損)</span>' : ''}</p>
                    
                    <div class="array-progress-container" style="width:100%; height:8px; background:#1e293b; border-radius:4px; margin:10px 0; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
                        <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, #60a5fa, #a78bfa); transition:width 0.5s ease;"></div>
                    </div>

                    <p class="time-limit">掛機時限：${this.formatTime(elapsedSeconds)} / ${this.formatTime(maxSeconds)}</p>
                </div>

                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button class="btn-eco-action" style="flex:2; padding:10px;" onclick="UI_World.collectGains()">一鍵收取</button>
                    ${wData.durability < 100 ? `<button class="btn-eco-action" style="flex:1; background:#475569;" onclick="UI_World.repairArray()">修復 (500靈石)</button>` : ''}
                </div>
            </div>

            <div class="world-management-grid">
                <div class="management-card">
                    <h4>👥 散修居</h4>
                    <p>閒置人手：<b>${idleWorkers}</b> / ${wData.workers}</p>
                    <button class="btn-eco-trade btn-buy" style="width:100%; margin-top:10px;" onclick="UI_World.recruitWorker()">
                        💰 1000 招募
                    </button>
                </div>

                <div class="management-card">
                    <h4>⛏️ 靈礦脈 (Lv.${wData.mine.level})</h4>
                    <p>產出：<b>${mineYield}</b> 靈石/分</p>
                    <div class="worker-control">
                        <button onclick="UI_World.assignWorker('mine', -1)">-</button>
                        <span>派遣: ${wData.mine.assigned}</span>
                        <button onclick="UI_World.assignWorker('mine', 1)">+</button>
                    </div>
                    <button class="btn-upgrade-mini" onclick="UI_World.upgradeIndustry('mine')">
                        ${wData.mine.level === 0 ? '✨ 開闢 (2000)' : `🔼 升級 (${wData.mine.level * 5000})`}
                    </button>
                </div>

                <div class="management-card">
                    <h4>🌿 仙草園 (Lv.${wData.farm.level})</h4>
                    <p>產出：<b>${farmYield}</b> 素材/10分</p>
                    <div class="worker-control">
                        <button onclick="UI_World.assignWorker('farm', -1)">-</button>
                        <span>派遣: ${wData.farm.assigned}</span>
                        <button onclick="UI_World.assignWorker('farm', 1)">+</button>
                    </div>
                    <button class="btn-upgrade-mini" onclick="UI_World.upgradeIndustry('farm')">
                        ${wData.farm.level === 0 ? '✨ 開闢 (1000)' : `🔼 升級 (${wData.farm.level * 3000})`}
                    </button>
                </div>
            </div>
        `;
    },

    // 🟢 新增：更新頂部資源看板
    updateResourceBar() {
        const bar = document.getElementById('world-resource-bar');
        if (!bar || !Player.data.inventory) return;

        // 從背包統計特定素材數量
        const countItem = (name) => {
            const item = Player.data.inventory.find(i => i.name === name);
            return item ? (item.count || 1) : 0;
        };

        const herbCount = countItem("仙草精華");
        const oreCount = countItem("凡鐵礦");

        bar.innerHTML = `
            <div class="res-item">🌿 仙草: <span>${herbCount}</span></div>
            <div class="res-item">💎 靈礦: <span>${oreCount}</span></div>
            <div class="res-item">👥 散修: <span>${Player.data.world.workers}</span></div>
        `;
        bar.style.cssText = "display:flex; justify-content:space-around; background:rgba(0,0,0,0.3); padding:8px; border-radius:8px; margin-bottom:15px; font-size:13px; border:1px solid rgba(255,255,255,0.05);";
    },

    // 🟢 新增：修復聚靈陣
    repairArray() {
        if (Player.data.coin < 500) return Msg.log("靈石不足，無法修繕法陣！", "system");
        Player.data.coin -= 500;
        Player.data.world.durability = 100;
        Msg.log("消耗 500 靈石，聚靈陣煥然一新！效率恢復！", "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    // 🟢 強化：多級升級邏輯
    upgradeIndustry(type) {
        const wData = Player.data.world;
        const currentLv = wData[type].level;
        const name = type === 'mine' ? '靈礦脈' : '仙草園';
        
        // 動態計算成本：等級越高越貴
        const baseCost = type === 'mine' ? 2000 : 1000;
        const upgradeCost = currentLv === 0 ? baseCost : currentLv * (type === 'mine' ? 5000 : 3000);

        if (Player.data.coin < upgradeCost) return Msg.log(`靈石不足！升級需要 ${upgradeCost}`, "system");

        Player.data.coin -= upgradeCost;
        wData[type].level += 1;
        
        Msg.log(`🎊 【${name}】晉升至 Lv.${wData[type].level}！產出大幅提升！`, "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    collectGains() {
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        
        const effectiveSeconds = Math.min(elapsedSeconds, maxSeconds);
        const effectiveMinutes = Math.floor(effectiveSeconds / 60);

        // 效率受耐久影響
        const efficiency = wData.durability < 50 ? 0.5 : 1.0;
        const gainedExp = Math.floor((effectiveSeconds / 10) * efficiency);
        const gainedCoins = wData.mine.assigned * wData.mine.level * 2 * effectiveMinutes;
        const gainedMaterials = Math.floor((effectiveMinutes / 10) * wData.farm.assigned * wData.farm.level);

        if (gainedExp <= 0 && gainedCoins <= 0 && gainedMaterials <= 0) {
            Msg.log("收穫尚微，再等等吧。", "system");
            return;
        }

        // 每次領取會損耗 1~3 點耐久
        wData.durability = Math.max(0, wData.durability - (Math.floor(Math.random() * 3) + 1));

        if (gainedExp > 0) Player.gainExp(gainedExp);
        if (gainedCoins > 0) Player.data.coin += gainedCoins;
        if (gainedMaterials > 0) {
            Player.addItem({
                uuid: 'mat_farm_' + Date.now(), name: "仙草精華", type: 'material',
                rarity: 2, count: gainedMaterials, desc: "仙草園培育出的精華。", price: 30
            });
        }

        Msg.log(`收取收益：修為+${gainedExp}, 靈石+${gainedCoins}, 素材+${gainedMaterials}`, "reward");
        wData.lastCollect = Date.now();
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    recruitWorker() {
        if (Player.data.coin < 1000) return Msg.log("靈石不足！", "system");
        Player.data.coin -= 1000;
        Player.data.world.workers++;
        Msg.log("招募成功，洞府人手增加！", "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    assignWorker(type, change) {
        const wData = Player.data.world;
        const target = wData[type];
        if (target.level === 0) return Msg.log("請先開闢該產業！", "system");

        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;
        if (change > 0 && idleWorkers < change) return Msg.log("無閒置人手！", "system");
        if (change < 0 && target.assigned < Math.abs(change)) return Msg.log("無人可撤回！", "system");

        target.assigned += change;
        Player.save();
        this.renderWorld();
    },

    calculateOfflineGains(isLogin = false) {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;
        const elapsed = Math.floor((Date.now() - wData.lastCollect) / 1000);
        if (isLogin && elapsed > 60) {
            Msg.log(`閉關結束，積累了 ${this.formatTime(elapsed)} 的天地靈氣。`, "gold");
        }
    },

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}時${m}分`;
        return `${m}分${s}秒`;
    }
};

window.UI_World = UI_World;
