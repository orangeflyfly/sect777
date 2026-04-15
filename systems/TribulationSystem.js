/**
 * V2.3 TribulationSystem.js (飛升模組版 - 雷劫大腦)
 * 職責：處理玩家境界突破時的「渡劫小遊戲」、倒數計時、護盾判定與生死結算。
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
     * 初始化雷劫大陣
     */
    init() {
        // 1. 檢查修士狀態是否達到瓶頸
        if (!Player.data || Player.data.exp < Player.data.maxExp) {
            Msg.log("修為尚有欠缺，靈氣未達圓滿，無法引動天雷！", "system");
            return;
        }

        console.log("⚡ 天地變色，雷劫降臨！");

        // 2. 初始化數值 (未來可根據境界 Player.data.realm 提升難度)
        this.maxTime = 5.0; // 5秒倒數
        this.timeLeft = this.maxTime;
        this.shield = 0;
        this.isActive = false;

        // 3. 預備 UI
        const realmNames = ["凡人", "練氣", "築基", "結丹", "元嬰", "化神", "合體", "大乘", "渡劫"];
        const nextRealm = realmNames[Player.data.realm] || "未知境界";

        document.getElementById('trib-subtitle').innerText = `準備突破至【${nextRealm}】`;
        
        // 顯示大陣，隱藏結果與狂點按鈕，顯示開始按鈕
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

            const dt = (now - lastTime) / 1000; // 換算成秒
            lastTime = now;

            this.timeLeft -= dt;
            
            // 可選難度：護盾隨時間微幅衰減，讓點擊更有壓力 (目前先註解，保持純粹拚手速)
            // this.shield -= 15 * dt; 
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

        // 每次點擊增加 8% 護盾
        this.shield += 8; 
        if (this.shield > 100) this.shield = 100;

        // 視覺回饋：按鈕微縮放
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

        document.getElementById('trib-timer-text').innerText = `${displayTime}s`;
        document.getElementById('trib-timer-bar').style.width = `${timePercent}%`;

        document.getElementById('trib-shield-text').innerText = `${Math.floor(this.shield)}%`;
        document.getElementById('trib-shield-bar').style.width = `${this.shield}%`;
    },

    /**
     * 渡劫成功結算
     */
    win() {
        this.isActive = false;
        cancelAnimationFrame(this.loopId);

        // 1. 呼叫修士本源，執行真正的屬性突破
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

        // 1. 懲罰機制：重傷 (血量剩 10%)，修為倒退 (經驗扣除 20%)
        Player.data.hp = Math.max(1, Math.floor(Player.data.hp * 0.1)); 
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
     * 關閉陣法，回歸修為頁面
     */
    close() {
        document.getElementById('tribulation-overlay').style.display = 'none';
        
        // 刷新主畫面，確保血量與等級顯示正確
        if (window.Core) window.Core.updateUI();
        if (window.UI_Stats) window.UI_Stats.renderStats();
    }
};

// 暴露給全域
window.TribulationSystem = TribulationSystem;
