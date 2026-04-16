/**
 * V2.9 ui_farm.js (仙草園專屬 UI)
 * 職責：掌管仙草園種植槽、過濾並指派弟子、顯示產能與修為進度
 * 位置：/ui/ui_farm.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FarmSystem } from '../systems/FarmSystem.js';
import { DATA_SECT } from '../data/data_sect.js';

export const UI_Farm = {
    
    /**
     * 開啟仙草園主介面
     */
    openModal() {
        const title = "🌿 仙草園 (草藥部)";
        const contentHtml = this.renderFarm();
        this.showModal(title, contentHtml);
    },

    showModal(title, contentHtml) {
        const existing = document.getElementById('farm-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="farm-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid #4ade80;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3 style="color:#4ade80; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('farm-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body" id="farm-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * 刷新介面內容 (不重開彈窗)
     */
    refresh() {
        const body = document.getElementById('farm-modal-body');
        if (body) {
            body.innerHTML = this.renderFarm();
        } else {
            this.openModal();
        }
    },

    /**
     * 渲染仙草園首頁 (坑位與總覽)
     */
    renderFarm() {
        const wData = Player.data.world;
        const level = wData.farm.level || 0;
        
        // 尚未開闢
        if (level === 0) {
            return `
                <div style="text-align:center; padding:20px;">
                    <p style="color:#94a3b8; margin-bottom:15px;">此處靈氣荒蕪，尚未開闢仙草園。</p>
                    <button class="btn-eco-action btn-buy" style="width:100%; padding:12px;" onclick="UI_Farm.buildFarm()">
                        💰 花費 1000 靈石 開闢仙草園
                    </button>
                </div>
            `;
        }

        // 坑位數量：基礎 2 個，每升一級多 1 個
        const maxSlots = 2 + level; 
        const farmWorkers = Player.data.sect.disciples.filter(d => d.status === 'farm');
        
        // 預估總產出
        let totalYield = 0;
        farmWorkers.forEach(d => {
            totalYield += FarmSystem.getDiscipleYield(d).yield;
        });

        let html = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; display:flex; justify-content:space-around; align-items:center;">
                    <div>
                        <div style="font-size:12px; color:#94a3b8;">當前等級</div>
                        <div style="font-size:18px; font-weight:bold; color:white;">Lv.${level}</div>
                    </div>
                    <div>
                        <div style="font-size:12px; color:#94a3b8;">總產出預估</div>
                        <div style="font-size:18px; font-weight:bold; color:#4ade80;">${totalYield} / 週期</div>
                    </div>
                    <div>
                        <button style="padding:5px 10px; border:1px solid #fbbf24; background:transparent; color:#fbbf24; border-radius:5px; cursor:pointer;"
                                onclick="UI_Farm.upgradeFarm()">升級</button>
                    </div>
                </div>
                <p style="font-size:12px; color:#94a3b8; margin-top:10px;">指派具備【水、木、天、仙】靈根的弟子進行培育。</p>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr; gap:10px; max-height:400px; overflow-y:auto; padding-right:5px; padding-bottom:10px;">
        `;

        // 渲染每一個種植坑位
        for (let i = 0; i < maxSlots; i++) {
            let d = farmWorkers[i]; // 抓取對應的弟子
            
            if (d) {
                // 有弟子駐守
                const rootData = DATA_SECT.ROOT_LEVELS[d.root];
                const yieldData = FarmSystem.getDiscipleYield(d);
                const nextExp = d.level * 100;
                const expPercent = Math.min(100, Math.floor((d.exp / nextExp) * 100));

                html += `
                    <div style="background:rgba(0,0,0,0.4); border:1px solid #334155; border-left:4px solid ${rootData.color}; border-radius:6px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span style="font-weight:bold; color:white;">${d.name} <span style="font-size:11px; color:${rootData.color};">(${d.root})</span></span>
                                <span style="font-size:12px; color:#4ade80; font-weight:bold;">產能: ${yieldData.yield}</span>
                            </div>
                            <div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">境界: Lv.${d.level}</div>
                            <div style="width:100%; background:#1e293b; height:6px; border-radius:3px; overflow:hidden;">
                                <div style="width:${expPercent}%; background:#3b82f6; height:100%;"></div>
                            </div>
                        </div>
                        <button style="margin-left:15px; padding:6px 10px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;"
                                onclick="UI_Farm.unassignWorker('${d.id}')">撤回</button>
                    </div>
                `;
            } else {
                // 空坑位
                html += `
                    <div style="background:rgba(255,255,255,0.05); border:1px dashed #475569; border-radius:6px; padding:15px; text-align:center; cursor:pointer;"
                         onclick="UI_Farm.showAssignList()">
                        <span style="color:#cbd5e1; font-weight:bold;">➕ 指派弟子</span>
                    </div>
                `;
            }
        }

        html += `</div>`;
        return html;
    },

    /**
     * 顯示符合資格的弟子名單 (過濾與替換介面)
     */
    showAssignList() {
        const list = Player.data.sect.disciples.filter(d => d.status === 'idle' && FarmSystem.canWork(d));

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <button style="padding:5px 10px; background:#334155; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="UI_Farm.refresh()">⬅ 返回</button>
                <div style="color:#cbd5e1; font-size:14px;">選擇弟子</div>
            </div>
            <div style="display:grid; grid-template-columns:1fr; gap:8px; max-height:400px; overflow-y:auto; padding-right:5px;">
        `;

        if (list.length === 0) {
            html += `<div style="text-align:center; padding:20px; color:#ef4444;">無符合資格的閒置弟子。<br><span style="font-size:12px; color:#94a3b8;">(需具備 水、木、天、仙 靈根，且無拒絕工作詞條)</span></div>`;
        } else {
            // 排序：先看產能高低
            list.sort((a, b) => FarmSystem.getDiscipleYield(b).yield - FarmSystem.getDiscipleYield(a).yield);

            list.forEach(d => {
                const rootData = DATA_SECT.ROOT_LEVELS[d.root];
                const yieldData = FarmSystem.getDiscipleYield(d);
                
                // 標示有加成的詞條
                let traitsHtml = d.traits.map(tKey => `<span style="font-size:11px; background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:3px; margin-right:4px;">${tKey}</span>`).join('');

                html += `
                    <div style="background:rgba(0,0,0,0.5); border-left:3px solid ${rootData.color}; border-radius:5px; padding:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"
                         onclick="UI_Farm.assignWorker('${d.id}')">
                        <div>
                            <div style="font-size:14px; font-weight:bold; color:white; margin-bottom:4px;">${d.name} <span style="font-size:12px; color:${rootData.color};">(${d.root})</span></div>
                            <div style="margin-bottom:4px;">${traitsHtml}</div>
                            <div style="font-size:12px; color:#94a3b8;">體質: ${d.stats['體質']} | 預期產能: <b style="color:#4ade80;">${yieldData.yield}</b></div>
                        </div>
                        <div style="color:#4ade80; font-size:20px;">➔</div>
                    </div>
                `;
            });
        }
        html += `</div>`;

        // 替換目前 Modal 的內容
        const body = document.getElementById('farm-modal-body');
        if (body) body.innerHTML = html;
    },

    // ==========================================
    // 動作邏輯
    // ==========================================

    buildFarm() {
        const cost = 1000;
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : Player.data.coins;
        
        if (currentCoins < cost) return Msg.log("靈石不足，無法開闢仙草園！", "system");

        if (Player.data.coin !== undefined) Player.data.coin -= cost;
        else Player.data.coins -= cost;

        Player.data.world.farm.level = 1;
        Player.save();
        Msg.log("🌿 靈氣匯聚，仙草園開闢成功！", "gold");
        
        if (window.Core) window.Core.updateUI();
        this.refresh();
    },

    upgradeFarm() {
        const level = Player.data.world.farm.level;
        const cost = level * 2000; // 升級費用遞增
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : Player.data.coins;

        if (currentCoins < cost) return Msg.log(`升級需要 ${cost} 靈石！`, "system");

        if (confirm(`確定花費 ${cost} 靈石將仙草園升級至 Lv.${level + 1} 嗎？ (將增加 1 個種植坑位)`)) {
            if (Player.data.coin !== undefined) Player.data.coin -= cost;
            else Player.data.coins -= cost;

            Player.data.world.farm.level++;
            Player.save();
            Msg.log(`🌿 仙草園升級成功！目前等級 Lv.${level + 1}`, "gold");
            
            if (window.Core) window.Core.updateUI();
            this.refresh();
        }
    },

    assignWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (d) {
            d.status = 'farm';
            
            // 同步舊系統人數
            Player.data.world.farm.assigned = Player.data.sect.disciples.filter(x => x.status === 'farm').length;
            
            Player.save();
            Msg.log(`已指派【${d.name}】進入仙草園培育靈草。`, "system");
            this.refresh();
        }
    },

    unassignWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (d) {
            d.status = 'idle';
            
            // 同步舊系統人數
            Player.data.world.farm.assigned = Player.data.sect.disciples.filter(x => x.status === 'farm').length;
            
            Player.save();
            Msg.log(`【${d.name}】已從仙草園撤回，處於閒置狀態。`, "system");
            this.refresh();
        }
    }
};

window.UI_Farm = UI_Farm;
