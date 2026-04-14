/**
 * V2.1 ui_world.js (飛升模組版 - 洞府與掛機系統)
 * 職責：小世界介面渲染、聚靈陣修復邏輯、離線收益計算
 * 位置：/ui/ui_world.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_World = {
    init() {
        console.log("【小世界】洞府法陣初始化...");
        // 確保玩家數據有小世界的欄位
        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1,       // 聚靈陣等級 (1級只能掛 5 分鐘)
                lastCollect: Date.now() // 上次領取收益的時間
            };
            Player.save();
        }
        
        // 剛進入遊戲時，自動結算一次離線收益
        this.calculateOfflineGains(true);
    },

    renderWorld() {
        const container = document.getElementById('world-content');
        if (!container || !Player.data) return;

        const wData = Player.data.world;
        
        // 計算當前累積了多少時間 (秒)
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        // 聚靈陣等級決定「掛機時間上限」
        // 等級 1: 5分鐘(300秒), 等級 2: 30分鐘(1800秒), 等級 3: 8小時(28800秒)
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        
        const isFull = elapsedSeconds >= maxSeconds;
        if (isFull) elapsedSeconds = maxSeconds;

        // 計算預計收益 (每 10 秒 1 點經驗，可隨機掉落素材)
        const pendingExp = Math.floor(elapsedSeconds / 10);

        container.innerHTML = `
            <div class="world-array-card">
                <div class="array-title">聚靈陣 (修復度: 階級 ${wData.arrayLevel})</div>
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
                    吸收靈氣 (領取收益)
                </button>
            </div>

            <div class="world-upgrade-card">
                <h4>修復聚靈陣</h4>
                <p style="font-size:12px; color:var(--text-dim); margin-bottom:10px;">
                    投入戰鬥中獲得的「陣法殘片」來修復法陣，延長掛機時間。
                </p>
                <button class="btn-eco-trade btn-buy" onclick="UI_World.upgradeArray()">
                    消耗 5 個 [陣法殘片] 進行修復
                </button>
            </div>
        `;
    },

    collectGains() {
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        if (elapsedSeconds >= maxSeconds) elapsedSeconds = maxSeconds;

        const gainedExp = Math.floor(elapsedSeconds / 10);
        
        if (gainedExp <= 0) {
            Msg.log("靈氣尚未匯聚，無法吸收。", "system");
            return;
        }

        Player.gainExp(gainedExp);
        Msg.log(`吸收聚靈陣靈氣，修為增加 ${gainedExp} 點！`, "reward");

        // 重置掛機時間
        wData.lastCollect = Date.now();
        Player.save();
        
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    upgradeArray() {
        // 這邊預留給道友後續實作「檢查儲物袋是否有陣法殘片」的邏輯
        Msg.log("修復功能尚在鑄造中，需要特定素材方可啟動...", "system");
    },

    calculateOfflineGains(isLogin = false) {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        // 如果離線超過 60 秒，登入時給予提示
        if (isLogin && elapsedSeconds > 60) {
            Msg.log(`你閉關了 ${this.formatTime(elapsedSeconds)}，洞府已凝聚了天地靈氣。`, "gold");
        }
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}分${s}秒`;
    }
};

window.UI_World = UI_World;
