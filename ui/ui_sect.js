/**
 * V2.2 ui_sect.js (飛升模組版 - 宗門大廳神識)
 * 職責：處理宗門九宮格部門的點擊、彈窗渲染與基礎升級調度
 * 位置：/ui/ui_sect.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Sect = {
    init() {
        // 確保玩家數據有宗門世界欄位
        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1, lastCollect: Date.now(),
                workers: 0, farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 }
            };
        }
        // 🟢 預備：新增宗門貢獻點 (Sect Points)
        if(Player.data && Player.data.sectPoints === undefined) {
            Player.data.sectPoints = 0; 
        }
    },

    /**
     * 開啟指定部門視窗
     */
    openDept(deptId) {
        this.init();
        let title = "";
        let contentHtml = "";

        switch(deptId) {
            case 'herb':
                title = "🌿 草藥部 (仙草園)";
                contentHtml = this.renderHerb();
                break;
            case 'iron':
                title = "⛏️ 鐵礦部 (靈礦脈)";
                contentHtml = this.renderIron();
                break;
            case 'recruit':
                title = "👥 招募堂";
                contentHtml = this.renderRecruit();
                break;
            case 'bounty':
                title = "📜 懸賞堂";
                contentHtml = `<div class="empty-msg" style="padding:40px 10px;">陣法尚未連通，執事長老正在趕路中...<br><span style="font-size:12px; color:#64748b;">(預計下一步實裝)</span></div>`;
                break;
            case 'vault':
                title = "📦 宗門庫房";
                contentHtml = `<div class="empty-msg" style="padding:40px 10px;">庫房大門深鎖，需宗門貢獻點方可開啟。<br><span style="font-size:12px; color:#64748b;">(預計後續實裝)</span></div>`;
                break;
        }

        this.showModal(title, contentHtml);
    },

    /**
     * 渲染共用彈窗底層
     */
    showModal(title, contentHtml) {
        const existing = document.getElementById('sect-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="sect-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="modal-box" style="max-width: 350px; background:var(--glass-dark); border:1px solid var(--card-border);" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3 style="color:#fcd34d; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('sect-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body" id="sect-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // ==========================================
    // 內部渲染邏輯
    // ==========================================
    renderHerb() {
        const wData = Player.data.world;
        const farmYield = wData.farm.assigned * (wData.farm.level || 1);
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        return `
            <div style="text-align:center;">
                <p style="color:#cbd5e1; margin-bottom:10px; font-size:14px;">種植靈草，定期產出煉丹素材。</p>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                    <p style="margin:5px 0;">當前等級：<b>Lv.${wData.farm.level}</b></p>
                    <p style="margin:5px 0;">預期產出：<b style="color:#4ade80;">${farmYield} 素材</b> / 10分鐘</p>
                </div>
                ${wData.farm.level > 0 ? `
                    <div class="worker-control">
                        <button onclick="UI_Sect.assignWorker('farm', -1); event.stopPropagation()">-</button>
                        <span>派遣弟子: ${wData.farm.assigned}</span>
                        <button onclick="UI_Sect.assignWorker('farm', 1); event.stopPropagation()">+</button>
                    </div>
                    <p style="font-size:12px; color:#94a3b8; margin-top:10px;">閒置弟子：${idleWorkers}</p>
                ` : `
                    <button class="btn-eco-action btn-buy" style="width:100%; padding:12px;" onclick="UI_Sect.buildIndustry('farm'); event.stopPropagation()">
                        花費 1000 靈石 開闢仙草園
                    </button>
                `}
            </div>
        `;
    },

    renderIron() {
        const wData = Player.data.world;
        const mineYield = wData.mine.assigned * (wData.mine.level || 1) * 2;
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        return `
            <div style="text-align:center;">
                <p style="color:#cbd5e1; margin-bottom:10px; font-size:14px;">開採礦脈，持續為宗門提供靈石。</p>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                    <p style="margin:5px 0;">當前等級：<b>Lv.${wData.mine.level}</b></p>
                    <p style="margin:5px 0;">預期產出：<b style="color:#fbbf24;">${mineYield} 靈石</b> / 分鐘</p>
                </div>
                ${wData.mine.level > 0 ? `
                    <div class="worker-control">
                        <button onclick="UI_Sect.assignWorker('mine', -1); event.stopPropagation()">-</button>
                        <span>派遣弟子: ${wData.mine.assigned}</span>
                        <button onclick="UI_Sect.assignWorker('mine', 1); event.stopPropagation()">+</button>
                    </div>
                    <p style="font-size:12px; color:#94a3b8; margin-top:10px;">閒置弟子：${idleWorkers}</p>
                ` : `
                    <button class="btn-eco-action btn-buy" style="width:100%; padding:12px;" onclick="UI_Sect.buildIndustry('mine'); event.stopPropagation()">
                        花費 2000 靈石 開闢靈礦脈
                    </button>
                `}
            </div>
        `;
    },

    renderRecruit() {
        const wData = Player.data.world;
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        return `
            <div style="text-align:center;">
                <p style="color:#cbd5e1; margin-bottom:15px; font-size:14px;">招募流浪散修，分派至各部門進行勞作。</p>
                <div style="display:flex; justify-content:space-around; background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:20px;">
                    <div>
                        <div style="font-size:12px; color:#94a3b8;">總弟子數</div>
                        <div style="font-size:24px; font-weight:bold; color:white;">${wData.workers}</div>
                    </div>
                    <div>
                        <div style="font-size:12px; color:#94a3b8;">閒置待命</div>
                        <div style="font-size:24px; font-weight:bold; color:#4ade80;">${idleWorkers}</div>
                    </div>
                </div>
                <button class="btn-eco-trade btn-sell" style="width:100%; padding:12px; font-size:15px;" onclick="UI_Sect.recruitWorker(); event.stopPropagation()">
                    💰 1000 靈石 招募一名散修
                </button>
            </div>
        `;
    },

    // ==========================================
    // 互動數據邏輯
    // ==========================================
    recruitWorker() {
        if (Player.data.coin < 1000) return Msg.log("靈石不足，無法發放安家費！", "system");
        Player.data.coin -= 1000;
        Player.data.world.workers++;
        Player.save();
        Msg.log("一名散修感念恩德，加入宗門！", "gold");
        this.openDept('recruit'); // 刷新當前彈窗
        if(window.Core) window.Core.updateUI();
    },

    assignWorker(type, change) {
        const wData = Player.data.world;
        const target = wData[type];
        const idleWorkers = wData.workers - wData.farm.assigned - wData.mine.assigned;

        if (change > 0 && idleWorkers < change) return Msg.log("閒置人手不足！", "system");
        if (change < 0 && target.assigned < Math.abs(change)) return Msg.log("該處已無人手可撤回！", "system");

        target.assigned += change;
        Player.save();
        this.openDept(type); // 刷新當前彈窗
    },

    buildIndustry(type) {
        const cost = type === 'mine' ? 2000 : 1000;
        const name = type === 'mine' ? '靈礦脈' : '仙草園';

        if (Player.data.coin < cost) return Msg.log(`開闢【${name}】需要 ${cost} 靈石！`, "system");

        Player.data.coin -= cost;
        Player.data.world[type].level = 1;
        Player.save();
        Msg.log(`轟隆！天地靈氣匯聚，成功開闢【${name}】！`, "gold");
        
        this.openDept(type); // 刷新當前彈窗
        if(window.Core) window.Core.updateUI();
    }
};

// 全域對接
window.UI_Sect = UI_Sect;
