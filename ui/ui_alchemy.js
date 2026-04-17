/**
 * V3.4 ui_alchemy.js (煉丹閣專屬面板)
 * 職責：顯示煉丹爐狀態、仙草消耗與丹藥庫存、調派火/木屬性煉丹師
 * 位置：/ui/ui_alchemy.js
 */

import { Player } from '../entities/player.js';
import { SectSystem } from '../systems/SectSystem.js';
import { AlchemySystem } from '../systems/AlchemySystem.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Alchemy = {
    init() {
        console.log("【UI_Alchemy】煉丹閣介面陣紋刻印完成。");
        window.UI_Alchemy = this;
    },

    openModal() {
        const title = "🔥 煉丹閣 (丹藥部)";
        const contentHtml = this.renderAlchemy();
        this.showModal(title, contentHtml);
    },

    showModal(title, contentHtml) {
        const existing = document.getElementById('alchemy-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="alchemy-modal-overlay" class="modal-overlay" style="z-index:10005;" onclick="this.remove()">
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.2);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                        <h3 style="color:#ef4444; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('alchemy-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body" id="alchemy-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    renderAlchemy() {
        const d = Player.data;
        if (!d.world.alchemy) d.world.alchemy = { level: 1, assigned: 0 };
        if (!d.inventory) d.inventory = {};

        const herbCount = (d.materials && d.materials.herb) ? d.materials.herb : 0;
        const expPillCount = d.inventory['修為丹'] || 0;
        const healPillCount = d.inventory['療傷藥'] || 0;
        
        const alcLevel = d.world.alchemy.level || 1;
        const allDisciples = d.sect ? d.sect.disciples : [];
        const workers = allDisciples.filter(x => x.status === 'alchemy');
        const idleDisciples = allDisciples.filter(x => x.status === 'idle');

        const maxSlots = 1 + alcLevel; // 煉丹爐比較珍貴，每級只加1個位置
        const upgradeCost = alcLevel * 3000;

        let html = `
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <div style="flex:1; text-align:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(74,222,128,0.3);">
                    <div style="font-size:11px; color:#94a3b8;">消耗：仙草庫存</div>
                    <div style="font-size:20px; font-weight:bold; color:#4ade80;">${herbCount.toLocaleString()}</div>
                </div>
                <div style="flex:1; text-align:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(239,68,68,0.3);">
                    <div style="font-size:11px; color:#94a3b8;">產出：丹藥庫存</div>
                    <div style="font-size:13px; font-weight:bold; color:#fca5a5; margin-top:5px;">修為丹: ${expPillCount}</div>
                    <div style="font-size:13px; font-weight:bold; color:#fca5a5;">療傷藥: ${healPillCount}</div>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:13px; color:#cbd5e1;">丹爐品階：Lv.${alcLevel}</span>
                    <span style="font-size:12px; color:${workers.length >= maxSlots ? '#ef4444' : '#ef4444'};">控火席位：${workers.length} / ${maxSlots}</span>
                </div>
                <button onclick="UI_Alchemy.upgradeFacility()" style="width:100%; padding:8px; background:linear-gradient(180deg, #f87171, #dc2626); color:#fff; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px;">
                    🔥 升級丹爐 (需 ${upgradeCost} 靈石)
                </button>
            </div>
        `;

        // 當前煉丹師
        html += `<div style="font-size:13px; color:#ef4444; margin-bottom:10px; font-weight:bold;">🔥 坐鎮煉丹師</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:20px; max-height:120px; overflow-y:auto; padding-right:5px;">`;
        
        if (workers.length === 0) {
            html += `<div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:6px; color:#64748b; font-size:12px;">爐火已熄，尚無弟子煉丹。</div>`;
        } else {
            workers.forEach(w => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(239,68,68,0.1); border-left:3px solid #ef4444; padding:8px 10px; border-radius:5px;">
                        <div>
                            <div style="color:white; font-weight:bold; font-size:13px;">${w.name}</div>
                            <div style="font-size:11px; color:#fca5a5; margin-top:2px;">屬性：${w.root} | 悟性 ${w.stats['悟性']} | 匠心 ${w.stats['匠心']}</div>
                        </div>
                        <button onclick="UI_Alchemy.removeWorker('${w.id}')" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 10px; font-size:11px; cursor:pointer;">請出</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        // 調派弟子
        html += `<div style="font-size:13px; color:#cbd5e1; margin-bottom:10px; font-weight:bold;">⛺ 調派人手 (火、木靈根優先)</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:180px; overflow-y:auto; padding-right:5px;">`;
        
        if (idleDisciples.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:15px; color:#64748b; font-size:12px;">無閒置弟子可供調遣。</div>`;
        } else {
            idleDisciples.forEach(d => {
                const isGoodAlc = ['火', '木', '天', '仙'].includes(d.root);
                const borderColor = isGoodAlc ? '#ef4444' : 'rgba(255,255,255,0.1)';

                html += `
                    <div style="background:rgba(0,0,0,0.4); border:1px solid ${borderColor}; padding:8px; border-radius:5px; position:relative;">
                        <div style="color:white; font-size:13px; font-weight:bold;">${d.name}</div>
                        <div style="font-size:10px; color:#94a3b8; margin:3px 0;">${d.root} / 悟性 ${d.stats['悟性']}</div>
                        <button onclick="UI_Alchemy.assignWorker('${d.id}')" style="background:#334155; color:white; border:none; border-radius:4px; padding:4px; font-size:11px; cursor:pointer; width:100%; margin-top:5px;">指派煉丹</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        return html;
    },

    upgradeFacility() {
        const d = Player.data;
        const currentLevel = d.world.alchemy.level || 1;
        const cost = currentLevel * 3000;

        if (d.coin < cost) return Msg.log(`❌ 靈石不足！升級丹爐需要 ${cost} 靈石。`, "system");

        d.coin -= cost;
        d.world.alchemy.level += 1;
        Player.save();
        
        Msg.log(`✅ 煉丹閣已升級至 Lv.${d.world.alchemy.level}！控火席位增加。`, "reward");
        if (window.Core) window.Core.updateUI();
        this.openModal();
    },

    assignWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        const alcLevel = Player.data.world?.alchemy?.level || 1;
        const maxSlots = 1 + alcLevel;
        const currentWorkers = Player.data.sect.disciples.filter(x => x.status === 'alchemy').length;

        if (currentWorkers >= maxSlots) {
            return Msg.log(`❌ 煉丹閣席位已滿 (${currentWorkers}/${maxSlots})！`, "system");
        }

        if (window.AlchemySystem && !window.AlchemySystem.canWork(d)) {
            return Msg.log(`❌【${d.name}】並無火木之性，無法控火煉丹！`, "system");
        }

        SectSystem.assignJob(discipleId, 'alchemy');
        Player.save();
        Msg.log(`✅ 已指派【${d.name}】進入煉丹閣。`, "system");
        this.openModal();
    },

    removeWorker(discipleId) {
        SectSystem.assignJob(discipleId, 'idle');
        Player.save();
        this.openModal();
    }
};

window.UI_Alchemy = UI_Alchemy;
