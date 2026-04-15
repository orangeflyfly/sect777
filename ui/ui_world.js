/**
 * V2.3 ui_world.js
 * 職責：小世界渲染、掛機收益計算、資源指派與自動注入 HTML
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_World = {
    // 1. 初始化與數據補完
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
        if (w.workers === undefined) w.workers = 0;
        if (!w.farm) w.farm = { level: 0, assigned: 0 };
        if (!w.mine) w.mine = { level: 0, assigned: 0 };

        Player.save();
        this.calculateOfflineGains(true);
        this.renderWorld();
    },

    // 2. 注入 HTML 骨架 (配合 index.html V2.5)
    renderLayout() {
        const container = document.getElementById('page-world');
        if (!container) return;
        container.innerHTML = `
            <div class="page-title">隨身洞府</div>
            <div id="world-content" style="flex:1; overflow-y:auto; padding-bottom:20px;"></div>
        `;
    },

    // 3. 渲染動態產出面板
    renderWorld() {
        const container = document.getElementById('world-content');
        if (!container || !Player.data) return;

        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        // --- 1. 聚靈陣進度計算 ---
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        const isFull = elapsedSeconds >= maxSeconds;
        if (isFull) elapsedSeconds = maxSeconds;
        
        const pendingExp = Math.floor(elapsedSeconds / 10);
        const progressPercent = Math.min(100, (elapsedSeconds / maxSeconds) * 100);

        // --- 2. 部門產出預覽 ---
        const farmYield = wData.farm.assigned * (wData.farm.level || 1); 
        const mineYield = wData.mine.assigned * (wData.mine.level || 1) * 2; 
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        // --- 3. 渲染內容 (新增進度條視覺) ---
        container.innerHTML = `
            <div class="world-array-card">
                <div class="array-title">聚靈陣 (階級 ${wData.arrayLevel})</div>
                <div class="array-core ${isFull ? 'full' : 'active'}">
                    <div class="array-glow"></div>
                    <span style="font-size:40px; position:relative; z-index:2;">☯️</span>
                </div>
                
                <div class="array-status">
                    <p>當前凝聚靈氣：<b style="color:var(--exp-color)">${pendingExp}</b> EXP</p>
                    
                    <div class="array-progress-container" style="width:100%; height:8px; background:#1e293b; border-radius:4px; margin:10px 0; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
                        <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, #60a5fa, #a78bfa); transition:width 0.5s ease;"></div>
                    </div>

                    <p class="time-limit">掛機時限：${this.formatTime(elapsedSeconds)} / ${this.formatTime(maxSeconds)}</p>
                    ${isFull ? '<p style="color:#ef4444; font-size:12px; font-weight:bold; animation: pulse 1s infinite;">⚠️ 陣法靈氣已飽和！</p>' : ''}
                </div>

                <button class="btn-eco-action btn-equip" style="width:100%; margin-top:15px; padding:12px; font-size:16px;" 
                        onclick="UI_World.collectGains()">
                    一鍵收取收益
                </button>
            </div>

            <div class="world-management-grid">
                <div class="management-card">
                    <h4>👥 散修居</h4>
                    <p>閒置人手：<b>${idleWorkers}</b> / ${wData.workers}</p>
                    <button class="btn-eco-trade btn-buy" onclick="UI_World.recruitWorker()">
                        💰 1000 招募散修
                    </button>
                </div>

                <div class="management-card">
                    <h4>⛏️ 靈礦脈 (Lv.${wData.mine.level})</h4>
                    <p>產出：<b>${mineYield} 靈石</b> / 分鐘</p>
                    <div class="worker-control">
                        <button onclick="UI_World.assignWorker('mine', -1)">-</button>
                        <span>派遣: ${wData.mine.assigned}</span>
                        <button onclick="UI_World.assignWorker('mine', 1)">+</button>
                    </div>
                    ${wData.mine.level === 0 ? 
                        `<button class="btn-eco-action" style="margin-top:10px; width:100%;" onclick="UI_World.buildIndustry('mine')">開闢靈礦 (2000)</button>` : ''}
                </div>

                <div class="management-card">
                    <h4>🌿 仙草園 (Lv.${wData.farm.level})</h4>
                    <p>產出：<b>${farmYield} 素材</b> / 10分鐘</p>
                    <div class="worker-control">
                        <button onclick="UI_World.assignWorker('farm', -1)">-</button>
                        <span>派遣: ${wData.farm.assigned}</span>
                        <button onclick="UI_World.assignWorker('farm', 1)">+</button>
                    </div>
                    ${wData.farm.level === 0 ? 
                        `<button class="btn-eco-action" style="margin-top:10px; width:100%;" onclick="UI_World.buildIndustry('farm')">開闢靈田 (1000)</button>` : ''}
                </div>
            </div>
        `;
    },

    // 4. 收益領取邏輯
    collectGains() {
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        
        const effectiveSeconds = Math.min(elapsedSeconds, maxSeconds);
        const effectiveMinutes = Math.floor(effectiveSeconds / 60);

        const gainedExp = Math.floor(effectiveSeconds / 10);
        const mineYieldPerMin = wData.mine.assigned * (wData.mine.level || 1) * 2;
        const gainedCoins = mineYieldPerMin * effectiveMinutes;
        const farmYieldPer10Min = wData.farm.assigned * (wData.farm.level || 1);
        const gainedMaterials = Math.floor((effectiveMinutes / 10) * farmYieldPer10Min);

        if (gainedExp <= 0 && gainedCoins <= 0 && gainedMaterials <= 0) {
            Msg.log("靈氣尚未匯聚，產業也無產出。", "system");
            return;
        }

        // 發放獎勵與日誌
        if (gainedExp > 0) {
            Player.gainExp(gainedExp);
            Msg.log(`吸收聚靈陣靈氣，修為增加 ${gainedExp} 點！`, "reward");
        }
        if (gainedCoins > 0) {
            Player.data.coin += gainedCoins;
            Msg.log(`⛏️ 靈礦運轉，獲得 ${gainedCoins} 靈石！`, "gold");
        }
        if (gainedMaterials > 0) {
            const material = {
                uuid: 'mat_farm_' + Date.now(), name: "仙草精華", type: 'material',
                rarity: 2, count: gainedMaterials, desc: "仙草園培育出的精華。", price: 30
            };
            Player.addItem(material);
            Msg.log(`🌿 仙草園豐收，獲得 ${gainedMaterials} 份素材！`, "reward");
        }

        wData.lastCollect = Date.now();
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    // 5. 散修招募
    recruitWorker() {
        if (Player.data.coin < 1000) return Msg.log("靈石不足！", "system");
        Player.data.coin -= 1000;
        Player.data.world.workers++;
        Msg.log("一名散修感念恩德，加入洞府！", "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    // 6. 人手派遣
    assignWorker(type, change) {
        const wData = Player.data.world;
        const target = wData[type];
        if (target.level === 0) return Msg.log("該產業尚未開闢！", "system");

        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;
        if (change > 0 && idleWorkers < change) return Msg.log("閒置人手不足！", "system");
        if (change < 0 && target.assigned < Math.abs(change)) return Msg.log("無人可撤回！", "system");

        target.assigned += change;
        Player.save();
        this.renderWorld();
    },

    // 7. 產業建設
    buildIndustry(type) {
        const cost = type === 'mine' ? 2000 : 1000;
        const name = type === 'mine' ? '靈礦脈' : '仙草園';
        if (Player.data.coin < cost) return Msg.log(`靈石不足！需要 ${cost}`, "system");

        Player.data.coin -= cost;
        Player.data.world[type].level = 1;
        Msg.log(`天地靈氣匯聚，成功開闢【${name}】！`, "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    // 8. 離線收益提示
    calculateOfflineGains(isLogin = false) {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        if (isLogin && elapsedSeconds > 60) {
            Msg.log(`你閉關了 ${this.formatTime(elapsedSeconds)}，請領取收益。`, "gold");
        }
    },

    // 9. 時間格式化
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}時${m}分`;
        return `${m}分${s}秒`;
    }
};

window.UI_World = UI_World;
