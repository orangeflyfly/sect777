/**
 * V3.4 ui_bounty.js (懸賞堂介面 - 分頁管理版)
 * 職責：物資交付介面、歷練進度顯示、派遣弟子面板
 * 位置：/ui/ui_bounty.js
 */

import { Player } from '../entities/player.js';
import { BountySystem } from '../systems/BountySystem.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Bounty = {
    currentTab: 'task', // 'task' 或 'expedition'

    init() {
        console.log("【UI_Bounty】懸賞堂面板初始化...");
        window.UI_Bounty = this;
    },

    openModal() {
        const title = "📜 懸賞堂 (宗門事務)";
        const contentHtml = this.renderBounty();
        this.showModal(title, contentHtml);
    },

    showModal(title, contentHtml) {
        const existing = document.getElementById('bounty-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="bounty-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="modal-box" style="max-width: 400px; background:var(--glass-dark); border:1px solid #a855f7;" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(168,85,247,0.3); padding-bottom:10px;">
                        <h3 style="color:#e9d5ff; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('bounty-modal-overlay').remove()">✕</button>
                    </div>
                    <div style="display:flex; margin-top:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <button style="flex:1; padding:10px; background:none; border:none; color:${this.currentTab==='task'?'#a855f7':'#94a3b8'}; border-bottom:2px solid ${this.currentTab==='task'?'#a855f7':'transparent'}; cursor:pointer;" onclick="UI_Bounty.switchTab('task')">物資交付</button>
                        <button style="flex:1; padding:10px; background:none; border:none; color:${this.currentTab==='expedition'?'#a855f7':'#94a3b8'}; border-bottom:2px solid ${this.currentTab==='expedition'?'#a855f7':'transparent'}; cursor:pointer;" onclick="UI_Bounty.switchTab('expedition')">外派歷練</button>
                    </div>
                    <div class="modal-body" id="bounty-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.openModal();
    },

    renderBounty() {
        if (this.currentTab === 'task') return this.renderTasks();
        return this.renderExpeditions();
    },

    /**
     * 渲染物資交付任務
     */
    renderTasks() {
        const tasks = Player.data.bounty.tasks || [];
        const sectPoints = Player.data.sectPoints || 0;

        let html = `<div style="text-align:center; color:#94a3b8; font-size:12px; margin-bottom:15px;">當前宗門貢獻點：<b style="color:#fcd34d; font-size:16px;">${sectPoints}</b></div>`;
        
        if (tasks.length === 0) {
            html += `<div style="text-align:center; padding:30px; color:#64748b;">今日懸賞已結清，請明日再來。</div>`;
        } else {
            tasks.forEach(t => {
                let current = (t.key === 'herb' || t.key === 'ore') ? (Player.data.materials[t.key] || 0) : (Player.data.inventory[t.key] || 0);
                const isEnough = current >= t.amount;

                html += `
                    <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:12px; margin-bottom:10px; border:1px solid rgba(168,85,247,0.2);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span style="color:white; font-weight:bold;">${t.name}需求</span>
                            <span style="color:#fcd34d;">🌟 貢獻 +${t.reward}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:13px; color:${isEnough?'#4ade80':'#ef4444'}">${current} / ${t.amount}</span>
                            <button onclick="BountySystem.submitTask('${t.id}')" style="background:${isEnough?'#a855f7':'#475569'}; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">交付</button>
                        </div>
                    </div>
                `;
            });
        }
        return html;
    },

    /**
     * 渲染歷練與派遣介面
     */
    renderExpeditions() {
        const exps = Player.data.bounty.expeditions || [];
        const idleDisciples = Player.data.sect.disciples.filter(d => d.status === 'idle');

        let html = `<div style="margin-bottom:15px;">`;
        html += `<p style="font-size:13px; color:#cbd5e1; margin-bottom:10px;">🏃 歷練中的弟子</p>`;
        
        if (exps.length === 0) {
            html += `<div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); color:#64748b; font-size:12px; border-radius:6px;">目前無人外派</div>`;
        } else {
            exps.forEach(ex => {
                const timeLeft = Math.max(0, Math.floor((ex.endTime - Date.now()) / 1000));
                html += `
                    <div style="background:rgba(168,85,247,0.1); border-left:3px solid #a855f7; padding:8px 12px; border-radius:5px; margin-bottom:8px; display:flex; justify-content:space-between;">
                        <div>
                            <div style="color:white; font-size:13px;">${ex.name}</div>
                            <div style="font-size:11px; color:#a855f7;">目的地：${ex.target}</div>
                        </div>
                        <div style="color:#94a3b8; font-size:12px;">剩餘 ${Math.floor(timeLeft/60)}分${timeLeft%60}秒</div>
                    </div>
                `;
            });
        }
        html += `</div>`;

        html += `<p style="font-size:13px; color:#cbd5e1; margin-bottom:10px;">⛺ 可派遣閒置弟子</p>`;
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:150px; overflow-y:auto;">`;
        
        if (idleDisciples.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:15px; color:#64748b; font-size:12px;">無閒置人手</div>`;
        } else {
            idleDisciples.forEach(d => {
                html += `
                    <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:5px; text-align:center;">
                        <div style="font-size:12px; color:white; margin-bottom:5px;">${d.name}</div>
                        <button onclick="BountySystem.startExpedition('${d.id}', '萬獸林', 5)" style="background:#334155; color:white; border:none; padding:4px; border-radius:4px; font-size:11px; cursor:pointer; width:100%;">前往歷練</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        return html;
    }
};

window.UI_Bounty = UI_Bounty;
