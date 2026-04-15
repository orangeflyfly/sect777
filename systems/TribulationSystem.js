/**
 * V2.4 TribulationSystem.js (架構瘦身 - 渡劫大腦自顯版)
 * 職責：處理渡劫小遊戲、注入 HTML 結構、倒數計時、護盾判定與生死結算
 * 位置：/systems/TribulationSystem.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const TribulationSystem = {
    timeLeft: 5.0,
    maxTime: 5.0,
    shield: 0,
    loopId: null,
    isActive: false,

    /**
     * 🟢 瘦身核心：將道友 index.html 的 tribulation-overlay 內容完整搬遷至此
     */
    renderLayout() {
        const container = document.getElementById('tribulation-overlay');
        if (!container) return;

        // 僅在第一次執行時注入結構，避免重複生成
        if (container.innerHTML !== "") return;

        // 完全保留道友原本在 HTML 裡的標籤、ID 與複雜的內聯樣式
        container.innerHTML = `
            <div id="trib-fx-layer" style="position:absolute; width:100%; height:100%; pointer-events:none; overflow:hidden;"></div>
            
            <h2 id="trib-title" style="color:#fcd34d; text-shadow:0 0 20px #f59e0b; font-size:28px; margin-bottom:10px; z-index:1;">雷劫降臨</h2>
            <div id="trib-subtitle" style="color:#94a3b8; font-size:16px; margin-bottom:40px; z-index:1;">準備突破至新境界</div>

            <div style="width:80%; max-width:300px; margin-bottom:30px; z-index:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="color:#ef4444; font-weight:bold;">天雷降下倒數</span>
                    <span id="trib-timer-text" style="color:#ef4444; font-weight:bold;">5.0s</span>
                </div>
                <div style="width:100%; height:10px; background:#333; border-radius:5px; overflow:hidden;">
                    <div id="trib-timer-bar" style="width:100%; height:100%; background:linear-gradient(90deg, #f87171, #ef4444); transition:width 0.1s linear;"></div>
                </div>
            </div>

            <div style="width:80%; max-width:300px; margin-bottom:50px; z-index:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="color:#60a5fa; font-weight:bold;">護體罡氣</span>
                    <span id="trib-shield-text" style="color:#60a5fa; font-weight:bold;">0%</span>
                </div>
                <div style="width:100%; height:20px; background:#333; border-radius:10px; overflow:hidden; border:2px solid #1e3a8a;">
                    <div id="trib-shield-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #3b82f6, #60a5fa); transition:width 0.1s ease-out; box-shadow:0 0 10px #60a5fa;"></div>
                </div>
            </div>

            <button id="btn-trib-action" onclick="if(window.TribulationSystem) window.TribulationSystem.clickShield()" style="z-index:1; background:linear-gradient(135deg, #3b82f6, #1d4ed8); border:3px solid #60a5fa; color:white; font-size:24px; font-weight:bold; padding:20px 40px; border-radius:50px; cursor:pointer; box-shadow:0 0 30px rgba(59,130,246,0.5); display:none;">
                凝聚罡氣！
            </button>
            
            <button id="btn-trib-start" onclick="if(window.TribulationSystem) window.TribulationSystem.start()" style="z-index:1; background:linear-gradient(135deg, #f59e0b, #d97706); border:3px solid #fcd34d; color:white; font-size:20px; font-weight:bold; padding:15px 30px; border-radius:30px; cursor:pointer; box-shadow:0 0 20px rgba(245,158,11,0.5);">
                引動天雷 (開始渡劫)
            </button>

            <div id="trib-result" style="display:none; z-index:1; text-align:center; background:rgba(0,0,0,0.8); padding:30px; border-radius:15px; border:1px solid #333;">
                <h3 id="trib-result-title" style="font-size:24px; margin-bottom:15px;">結果</h3>
                <p id="trib-result-desc" style="color:#cbd5e1; margin-bottom:20px;">描述</p>
                <button onclick="if(window.TribulationSystem) window.TribulationSystem.close()" style="background:#4b5563; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">返回修為</button>
            </div>
        `;
    },

    /**
     * 初始化雷劫大陣
     */
    init() {
        // 1. 檢查修士狀態是否達到瓶頸
        if (!Player.data || Player.data.exp < Player.data.maxExp) {
            Msg.log("修為尚有欠缺，靈氣未達圓滿，無法引動天雷！", "system");
            return;
        }

        // 🟢 關鍵修正：在初始化數值前，先顯化 UI 結構
        this.renderLayout();

        console.log("⚡ 天地變色，雷劫降臨！");

        // 2. 初始化數值
        this.maxTime = 5.0; // 5秒倒數
        this.timeLeft = this.maxTime;
        this.shield = 0;
        this.isActive = false;

        // 3. 預備 UI
        const realmNames = ["凡人", "練氣", "築基", "結丹", "元嬰", "化神", "合體", "大乘", "渡劫"];
        const nextRealm = realmNames[Player.data.realm] || "未知境界";

        document.getElementById('trib-subtitle').innerText = `準備突破至【${nextRealm}】`;
        
        // 顯示大陣
        document.getElementById('tribulation-overlay').style.display = 'flex';
        document.getElementById('trib-result').style.display = 'none';
        document.getElementById('btn-trib-start').style.display = 'block';
        document.getElementById('btn-trib-action').style.display = 'none';

        this.updateUI();
    },

    /**
     * 點下「引動天雷」開始渡劫
     */
    start() {
        this.isActive = true;
        
        // 切換按鈕狀態
        document.getElementById('btn-trib-start').style.display = 'none';
        document.getElementById('btn-trib-action').style.display = 'block';

        Msg.log("🌩️ 轟隆！第一道天雷劈下！快凝聚罡氣！", "system");

        // 使用 requestAnimationFrame 啟動天道時鐘 (平滑倒數)
        let lastTime = performance.now();
        
        const loop = (now) => {
            if (!this.isActive) return;

            const dt = (now - lastTime) / 1000; 
            lastTime = now;

            this.timeLeft -= dt;
            
            if (this.shield < 0) this.shield = 0;

            this.updateUI();

            // 判斷生死
            if (this.shield >= 100) {
                this.win();
            } else if (this.timeLeft <= 0) {
                this.lose();
            } else {
                this.loopId = requestAnimationFrame(loop);
            }
        };
        
        this.loopId = requestAnimationFrame(loop);
    },

    /**
     * 玩家狂點按鈕凝聚罡氣
     */
    clickShield() {
        if (!this.isActive) return;

        this.shield += 8; 
        if (this.shield > 100) this.shield = 100;

        const btn = document.getElementById('btn-trib-action');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1)', 50);

        this.updateUI();
    },

    /**
     * 渲染血條與倒數條
     */
    updateUI() {
        const timePercent = Math.max(0, (this.timeLeft / this.maxTime) * 100);
        const displayTime = Math.max(0, this.timeLeft).toFixed(1);

        const timerText = document.getElementById('trib-timer-text');
        const timerBar = document.getElementById('trib-timer-bar');
        const shieldText = document.getElementById('trib-shield-text');
        const shieldBar = document.getElementById('trib-shield-bar');

        if(timerText) timerText.innerText = `${displayTime}s`;
        if(timerBar) timerBar.style.width = `${timePercent}%`;
        if(shieldText) shieldText.innerText = `${Math.floor(this.shield)}%`;
        if(shieldBar) shieldBar.style.width = `${this.shield}%`;
    },

    /**
     * 渡劫成功結算
     */
    win() {
        this.isActive = false;
        cancelAnimationFrame(this.loopId);

        // 1. 執行真正的屬性突破
        Player.levelUp(); 

        // 2. 切換 UI
        document.getElementById('btn-trib-action').style.display = 'none';
        const resultBox = document.getElementById('trib-result');
        resultBox.style.display = 'block';

        document.getElementById('trib-result-title').innerText = "✨ 渡劫成功！";
        document.getElementById('trib-result-title').style.color = "#fcd34d";
        document.getElementById('trib-result-desc').innerText = `你成功抗下天雷，境界突破至 Lv.${Player.data.level}！體內靈氣生生不息。`;
        document.getElementById('trib-result-desc').style.color = "#4ade80";

        Msg.log("✨ 渡劫成功！天地靈氣灌注全身！", "gold");
    },

    /**
     * 渡劫失敗結算
     */
    lose() {
        this.isActive = false;
        cancelAnimationFrame(this.loopId);

        // 1. 懲罰機制
        Player.data.hp = Math.max(1, Math.floor(Player.getBattleStats().maxHp * 0.1)); 
        Player.data.exp = Math.max(0, Math.floor(Player.data.exp * 0.8)); 
        Player.save();

        // 2. 切換 UI
        document.getElementById('btn-trib-action').style.display = 'none';
        const resultBox = document.getElementById('trib-result');
        resultBox.style.display = 'block';

        document.getElementById('trib-result-title').innerText = "💀 渡劫失敗！";
        document.getElementById('trib-result-title').style.color = "#ef4444";
        document.getElementById('trib-result-desc').innerText = `護體罡氣碎裂！你被天雷重創，修為受損，經脈盡斷。`;
        document.getElementById('trib-result-desc').style.color = "#fca5a5";

        Msg.log("💀 渡劫失敗！天雷擊穿了你的防禦，重傷垂死。", "system");
    },

    /**
     * 關閉陣法
     */
    close() {
        document.getElementById('tribulation-overlay').style.display = 'none';
        if (window.Core) window.Core.updateUI();
        if (window.UI_Stats) window.UI_Stats.renderStats();
    }
};

window.TribulationSystem = TribulationSystem;
