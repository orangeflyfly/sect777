/**
 * V3.4 ui_mine.js (靈礦脈 UI - 萬象產能版)
 * 職責：顯示礦脈狀態、即時產能、擴建設施、並管理礦工指派
 * 位置：/ui/ui_mine.js
 */

import { Player } from '../entities/player.js';
import { SectSystem } from '../systems/SectSystem.js';
import { MineSystem } from '../systems/MineSystem.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Mine = {
    
    init() {
        console.log("【UI_Mine】靈礦脈介面陣紋刻印完成。");
        window.UI_Mine = this;
    },

    /**
     * 啟動礦脈主面板
     */
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
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid #fbbf24; box-shadow: 0 0 20px rgba(251,191,36,0.2);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
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
        const d = Player.data;
        // 🌟 數據完整性防護
        if (!d.world.mine) d.world.mine = { level: 1, assigned: 0 };
        if (!d.materials) d.materials = { herb: 0, ore: 0 };

        const oreCount = d.materials.ore || 0;
        const mineLevel = d.world.mine.level || 1;
        const allDisciples = d.sect ? d.sect.disciples : [];
        const workers = allDisciples.filter(d => d.status === 'mine');
        const idleDisciples = allDisciples.filter(d => d.status === 'idle');

        // 坑位與升級計算
        const maxSlots = 2 + mineLevel; 
        const upgradeCost = mineLevel * 1500;

        // 🌟 預估產能精算 (呼叫 MineSystem 大腦)
        let totalEstYield = 0;
        workers.forEach(w => {
            const res = MineSystem.getDiscipleYield(w);
            totalEstYield += res.yield;
        });

        let html = `
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <div style="flex:1; text-align:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(251,191,36,0.2);">
                    <div style="font-size:11px; color:#94a3b8;">庫存玄鐵</div>
                    <div style="font-size:20px; font-weight:bold; color:#fbbf24;">${oreCount.toLocaleString()}</div>
                </div>
                <div style="flex:1; text-align:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid #4ade80;">
                    <div style="font-size:11px; color:#94a3b8;">預估產能(次)</div>
                    <div style="font-size:20px; font-weight:bold; color:#4ade80;">+${totalEstYield}</div>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:13px; color:#cbd5e1;">礦坑規模：Lv.${mineLevel}</span>
                    <span style="font-size:12px; color:${workers.length >= maxSlots ? '#ef4444' : '#fbbf24'};">編制：${workers.length} / ${maxSlots}</span>
                </div>
                <button onclick="UI_Mine.upgradeFacility()" style="width:100%; padding:8px; background:linear-gradient(180deg, #fcd34d, #f59e0b); color:#000; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px;">
                    💎 擴建地脈 (需 ${upgradeCost} 靈石)
                </button>
            </div>
        `;

        // 當前礦工列表
        html += `<div style="font-size:13px; color:#fbbf24; margin-bottom:10px; font-weight:bold; display:flex; justify-content:space-between;">
                    <span>⛏️ 在職礦工</span>
                    <span style="font-weight:normal; font-size:11px; color:#94a3b8;">(獲取經驗中)</span>
                 </div>`;
        html += `<div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:20px; max-height:120px; overflow-y:auto; padding-right:5px;">`;
        
        if (workers.length === 0) {
            html += `<div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:6px; color:#64748b; font-size:12px;">尚無弟子下礦，玄鐵產出停滯中。</div>`;
        } else {
            workers.forEach(w => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(251,191,36,0.1); border-left:3px solid #fbbf24; padding:8px 10px; border-radius:5px;">
                        <div>
                            <div style="color:white; font-weight:bold; font-size:13px;">${w.name} <span style="color:#94a3b8; font-weight:normal;">(Lv.${w.level})</span></div>
                            <div style="font-size:11px; color:#fbbf24; margin-top:2px;">屬性：${w.root} | 體質 ${w.stats['體質']}</div>
                        </div>
                        <button onclick="UI_Mine.removeWorker('${w.id}')" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 10px; font-size:11px; cursor:pointer;">召回</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        // 閒置弟子調派
        html += `<div style="font-size:13px; color:#cbd5e1; margin-bottom:10px; font-weight:bold;">⛺ 調派人手</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:180px; overflow-y:auto; padding-right:5px;">`;
        
        if (idleDisciples.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:15px; color:#64748b; font-size:12px;">無閒置弟子。請前往招募堂。</div>`;
        } else {
            idleDisciples.forEach(d => {
                const isGoodMiner = ['地', '金', '天', '仙'].includes(d.root);
                const borderColor = isGoodMiner ? '#fbbf24' : 'rgba(255,255,255,0.1)';

                html += `
                    <div style="background:rgba(0,0,0,0.4); border:1px solid ${borderColor}; padding:8px; border-radius:5px; position:relative;">
                        <div style="color:white; font-size:13px; font-weight:bold;">${d.name}</div>
                        <div style="font-size:10px; color:#94a3b8; margin:3px 0;">${d.root} / 體質 ${d.stats['體質']}</div>
                        <button onclick="UI_Mine.assignWorker('${d.id}')" style="background:#334155; color:white; border:none; border-radius:4px; padding:4px; font-size:11px; cursor:pointer; width:100%; margin-top:5px;">指派下礦</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        return html;
    },

    /**
     * 動作：擴建礦脈
     */
    upgradeFacility() {
        const d = Player.data;
        const currentLevel = d.world.mine.level || 1;
        const cost = currentLevel * 1500;

        if (d.coin < cost) {
            return Msg.log(`❌ 靈石不足！擴建需要 ${cost} 靈石。`, "system");
        }

        d.coin -= cost;
        d.world.mine.level += 1;
        Player.save();
        
        Msg.log(`✅ 靈礦脈已擴建至 Lv.${d.world.mine.level}！產能倍率與坑位提升。`, "reward");
        if (window.Core) window.Core.updateUI();
        this.openModal();
    },

    assignWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        const mineLevel = Player.data.world?.mine?.level || 1;
        const maxSlots = 2 + mineLevel;
        const currentWorkers = Player.data.sect.disciples.filter(x => x.status === 'mine').length;

        if (currentWorkers >= maxSlots) {
            return Msg.log(`❌ 靈礦脈坑位已滿 (${currentWorkers}/${maxSlots})！`, "system");
        }

        // 🌟 串接 MineSystem 的防呆判定
        if (window.MineSystem && !window.MineSystem.canWork(d)) {
            return Msg.log(`❌【${d.name}】資質不符或不願下礦！`, "system");
        }

        SectSystem.assignJob(discipleId, 'mine');
        
        let sum = SectSystem.getSummary();
        Player.data.world.mine.assigned = sum.mine;
        Player.save();

        Msg.log(`✅ 已指派【${d.name}】前往靈礦脈勞作。`, "system");
        this.openModal();
    },

    removeWorker(discipleId) {
        SectSystem.assignJob(discipleId, 'idle');
        
        let sum = SectSystem.getSummary();
        Player.data.world.mine.assigned = sum.mine;
        Player.save();

        this.openModal();
    }
};

window.UI_Mine = UI_Mine;
