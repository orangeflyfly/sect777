/**
 * V2.1 ui_world.js (飛升模組版 - 經營完全體)
 * 職責：小世界介面渲染、聚靈陣修復、靈田靈礦經營、散修招募、離線總結算
 * 位置：/ui/ui_world.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_World = {
    init() {
        console.log("【小世界】洞府法陣初始化...");
        
        // 確保玩家數據有小世界的欄位 (基礎陣法)
        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1,
                lastCollect: Date.now()
            };
        }
        
        // 🟢 數據熱更新 (第五波經營擴充)
        const w = Player.data.world;
        if (w.workers === undefined) w.workers = 0; // 總招募的散修數量
        if (!w.farm) w.farm = { level: 0, assigned: 0 }; // 靈田數據
        if (!w.mine) w.mine = { level: 0, assigned: 0 }; // 靈礦數據

        Player.save();
        
        // 剛進入遊戲時，自動結算一次離線收益
        this.calculateOfflineGains(true);
    },

    renderWorld() {
        const container = document.getElementById('world-content');
        if (!container || !Player.data) return;

        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        // --- 1. 聚靈陣數據 ---
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        const isFull = elapsedSeconds >= maxSeconds;
        if (isFull) elapsedSeconds = maxSeconds;
        const pendingExp = Math.floor(elapsedSeconds / 10);

        // --- 2. 經營產出預覽 (每分鐘產量) ---
        const farmYield = wData.farm.assigned * (wData.farm.level || 1); 
        const mineYield = wData.mine.assigned * (wData.mine.level || 1) * 2; 
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        // --- 3. 渲染介面 ---
        container.innerHTML = `
            <div class="world-array-card">
                <div class="array-title">聚靈陣 (階級 ${wData.arrayLevel})</div>
                <div class="array-core ${isFull ? 'full' : 'active'}">
                    <div class="array-glow"></div>
                    <span style="font-size:40px; position:relative; z-index:2;">☯️</span>
                </div>
                
                <div class="array-status">
                    <p>當前凝聚靈氣：<b style="color:var(--exp-color)">${pendingExp}</b> EXP</p>
                    <p class="time-limit">掛機時限：${this.formatTime(elapsedSeconds)} / ${this.formatTime(maxSeconds)}</p>
                    ${isFull ? '<p style="color:var(--hp-color); font-size:12px;">陣法已飽和，請盡速領取！</p>' : ''}
                </div>

                <button class="btn-eco-action btn-equip" style="width:100%; margin-top:15px; padding:12px; font-size:16px;" 
                        onclick="UI_World.collectGains()">
                    一鍵收取所有收益
                </button>
            </div>

            <div class="world-management-grid">
                <div class="management-card">
                    <h4>👥 散修居</h4>
                    <p>閒置人手：<b>${idleWorkers}</b> / ${wData.workers}</p>
                    <p class="desc">招募散修來幫忙打理產業。</p>
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
                        `<button class="btn-eco-action" style="margin-top:10px; width:100%;" onclick="UI_World.buildIndustry('mine')">花費 2000 開闢靈礦</button>` : ''}
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
                        `<button class="btn-eco-action" style="margin-top:10px; width:100%;" onclick="UI_World.buildIndustry('farm')">花費 1000 開闢靈田</button>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * 🟢 一鍵收取 (包含經驗、靈石、素材)
     */
    collectGains() {
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        
        // 計算實際生效的分鐘數 (不超過陣法上限)
        const effectiveSeconds = Math.min(elapsedSeconds, maxSeconds);
        const effectiveMinutes = Math.floor(effectiveSeconds / 60);

        // 1. 聚靈陣 EXP
        const gainedExp = Math.floor(effectiveSeconds / 10);
        
        // 2. 靈礦 靈石 (每分鐘產量 * 有效分鐘數)
        const mineYieldPerMin = wData.mine.assigned * (wData.mine.level || 1) * 2;
        const gainedCoins = mineYieldPerMin * effectiveMinutes;

        // 3. 靈田 素材 (每10分鐘產量)
        const farmYieldPer10Min = wData.farm.assigned * (wData.farm.level || 1);
        const gainedMaterials = Math.floor((effectiveMinutes / 10) * farmYieldPer10Min);

        if (gainedExp <= 0 && gainedCoins <= 0 && gainedMaterials <= 0) {
            Msg.log("靈氣尚未匯聚，產業也無產出。", "system");
            return;
        }

        // 發放獎勵
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
                rarity: 2, count: gainedMaterials, desc: "仙草園培育出的精華，可出售換取靈石。", price: 30
            };
            Player.addItem(material);
            Msg.log(`🌿 仙草園豐收，獲得 ${gainedMaterials} 份素材！`, "reward");
        }

        wData.lastCollect = Date.now();
        Player.save();
        
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    /**
     * 🟢 招募散修
     */
    recruitWorker() {
        if (Player.data.coin < 1000) {
            return Msg.log("靈石不足，無法發放安家費招募散修！", "system");
        }
        Player.data.coin -= 1000;
        Player.data.world.workers++;
        Msg.log("一名散修感念你的恩德，決定加入洞府！", "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    /**
     * 🟢 派遣/撤回 散修
     */
    assignWorker(type, change) {
        const wData = Player.data.world;
        const target = wData[type];
        
        if (target.level === 0) return Msg.log("該產業尚未開闢！", "system");

        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        if (change > 0 && idleWorkers < change) {
            return Msg.log("閒置人手不足！", "system");
        }
        if (change < 0 && target.assigned < Math.abs(change)) {
            return Msg.log("該處已無人手可撤回！", "system");
        }

        target.assigned += change;
        Player.save();
        this.renderWorld();
    },

    /**
     * 🟢 開闢產業
     */
    buildIndustry(type) {
        const cost = type === 'mine' ? 2000 : 1000;
        const name = type === 'mine' ? '靈礦脈' : '仙草園';

        if (Player.data.coin < cost) return Msg.log(`開闢【${name}】需要 ${cost} 靈石！`, "system");

        Player.data.coin -= cost;
        Player.data.world[type].level = 1;
        Msg.log(`轟隆！天地靈氣匯聚，成功開闢【${name}】！`, "gold");
        
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    calculateOfflineGains(isLogin = false) {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        if (isLogin && elapsedSeconds > 60) {
            Msg.log(`你閉關了 ${this.formatTime(elapsedSeconds)}，洞府已累積了大量收益，請前往收取。`, "gold");
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
