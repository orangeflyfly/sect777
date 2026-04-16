/**
 * V3.1 ui_mine.js (靈礦脈 UI)
 * 職責：顯示礦脈狀態、庫存、並允許調派/卸任挖礦弟子
 * 位置：/ui/ui_mine.js
 */

import { Player } from '../entities/player.js';
import { SectSystem } from '../systems/SectSystem.js';
import { MineSystem } from '../systems/MineSystem.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Mine = {
    openModal() {
        const title = "⛏️ 靈礦脈 (鐵礦部)";
        const contentHtml = this.renderMine();
        this.showModal(title, contentHtml);
    },

    showModal(title, contentHtml) {
        const existing = document.getElementById('mine-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="mine-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid #fbbf24;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3 style="color:#fbbf24; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('mine-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body" id="mine-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    renderMine() {
        const oreCount = (Player.data.materials && Player.data.materials.ore) ? Player.data.materials.ore : 0;
        const allDisciples = Player.data.sect ? Player.data.sect.disciples : [];
        const workers = allDisciples.filter(d => d.status === 'mine');
        const idleDisciples = allDisciples.filter(d => d.status === 'idle');

        // 坑位計算 (預設3個，後續可綁定建築等級)
        const mineLevel = Player.data.world?.mine?.level || 1;
        const maxSlots = 2 + mineLevel; 

        let html = `
            <div style="text-align:center; margin-bottom:15px; background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; border:1px solid rgba(251,191,36,0.3);">
                <div style="font-size:14px; color:#cbd5e1;">庫房玄鐵儲量</div>
                <div style="font-size:32px; font-weight:bold; color:#fbbf24; text-shadow: 0 0 10px rgba(251,191,36,0.5); margin:5px 0;">${oreCount}</div>
                <div style="font-size:12px; color:#94a3b8;">當前礦坑規模：Lv.${mineLevel} (容納 ${workers.length}/${maxSlots} 人)</div>
            </div>
        `;

        html += `<div style="font-size:13px; color:#fbbf24; margin-bottom:10px; font-weight:bold;">⛏️ 當前礦工</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:20px; max-height:150px; overflow-y:auto; padding-right:5px;">`;
        
        if (workers.length === 0) {
            html += `<div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:6px; color:#64748b; font-size:13px;">礦道寂靜無聲，尚無弟子下礦。</div>`;
        } else {
            workers.forEach(d => {
                const con = d.stats['體質'] || 10;
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(251,191,36,0.1); border-left:3px solid #fbbf24; padding:8px 10px; border-radius:5px;">
                        <div>
                            <span style="color:white; font-weight:bold; font-size:14px;">${d.name}</span>
                            <span style="color:#94a3b8; font-size:12px; margin-left:5px;">Lv.${d.level || 1} | 體質 ${con}</span>
                        </div>
                        <button onclick="UI_Mine.removeWorker('${d.id}')" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 8px; font-size:12px; cursor:pointer;">召回</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        html += `<div style="font-size:13px; color:#cbd5e1; margin-bottom:10px;">⛺ 可調派閒置弟子</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:200px; overflow-y:auto; padding-right:5px;">`;
        
        if (idleDisciples.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:15px; color:#64748b; font-size:13px;">宗門內目前無閒置弟子。</div>`;
        } else {
            idleDisciples.forEach(d => {
                const con = d.stats['體質'] || 10;
                // 檢查是否帶有適合挖礦的詞條來加上高光
                const isGoodMiner = d.traits.some(t => t === '尋脈點穴' || t === '黃金礦工' || t === '亡靈法師' || t === '天生神力');
                const borderColor = isGoodMiner ? '#fbbf24' : 'rgba(255,255,255,0.1)';

                html += `
                    <div style="background:rgba(0,0,0,0.4); border:1px solid ${borderColor}; padding:8px; border-radius:5px; display:flex; flex-direction:column; gap:5px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:white; font-size:13px; font-weight:bold;">${d.name}</span>
                            ${isGoodMiner ? '<span style="font-size:10px; color:#fbbf24; background:rgba(251,191,36,0.2); padding:2px 4px; border-radius:3px;">挖礦專精</span>' : ''}
                        </div>
                        <div style="font-size:11px; color:#94a3b8;">Lv.${d.level || 1} | 體質 ${con}</div>
                        <button onclick="UI_Mine.assignWorker('${d.id}')" style="background:#334155; color:white; border:none; border-radius:4px; padding:5px; font-size:12px; cursor:pointer; width:100%; margin-top:2px;">下礦</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        return html;
    },

    assignWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        const mineLevel = Player.data.world?.mine?.level || 1;
        const maxSlots = 2 + mineLevel;
        const currentWorkers = Player.data.sect.disciples.filter(x => x.status === 'mine').length;

        if (currentWorkers >= maxSlots) {
            return Msg.log(`❌ 靈礦脈坑位已滿 (${currentWorkers}/${maxSlots})，請先升級設施！`, "system");
        }

        if (window.MineSystem && !window.MineSystem.canWork(d)) {
            return Msg.log(`❌ 【${d.name}】天生反骨，打死也不願意下礦！`, "system");
        }

        SectSystem.assignJob(discipleId, 'mine');
        
        let sum = SectSystem.getSummary();
        if(!Player.data.world.mine) Player.data.world.mine = { assigned: 0 };
        Player.data.world.mine.assigned = sum.mine;
        Player.save();

        this.openModal(); // 重新渲染 UI
    },

    removeWorker(discipleId) {
        SectSystem.assignJob(discipleId, 'idle');
        
        let sum = SectSystem.getSummary();
        if(!Player.data.world.mine) Player.data.world.mine = { assigned: 0 };
        Player.data.world.mine.assigned = sum.mine;
        Player.save();

        this.openModal();
    }
};

window.UI_Mine = UI_Mine;
