/**
 * V3.5.1 ui_alchemy.js (煉丹閣專屬面板 - 五行感知版)
 * 職責：顯示煉丹爐狀態、仙草消耗與丹藥庫存、調派火/木屬性煉丹師
 * 修正：將 UI 顯示邏輯從 root(資質) 全面更換為 element(五行屬性)
 * 位置：/ui/ui_alchemy.js
 */

import { Player } from '../entities/player.js';
import { SectSystem } from '../systems/SectSystem.js';
import { AlchemySystem } from '../systems/AlchemySystem.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Alchemy = {
    init() {
        console.log("【UI_Alchemy】煉丹閣介面陣紋刻印完成，屬性感測器已校準。");
        window.UI_Alchemy = this;
    },

    openModal() {
        const title = "🔥 煉丹閣 (丹道大殿)";
        const contentHtml = this.renderAlchemy();
        this.showModal(title, contentHtml);
    },

    showModal(title, contentHtml) {
        const existing = document.getElementById('alchemy-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="alchemy-modal-overlay" class="modal-overlay" style="z-index:10005;" onclick="UI_Alchemy.close()">
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid #ef4444; box-shadow: 0 0 25px rgba(239,68,68,0.3);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                        <h3 style="color:#fca5a5; margin:0; font-size:18px; text-shadow: 0 0 10px rgba(239,68,68,0.5);">${title}</h3>
                        <button class="btn-modal-close" onclick="UI_Alchemy.close()">✕</button>
                    </div>
                    <div class="modal-body" id="alchemy-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    close() {
        const existing = document.getElementById('alchemy-modal-overlay');
        if (existing) existing.remove();
    },

    /**
     * 渲染核心介面
     */
    renderAlchemy() {
        const d = Player.data;
        // 確保基礎數據存在
        if (!d.world.alchemy) d.world.alchemy = { level: 1, assigned: 0 };
        if (!d.inventory) d.inventory = {};

        const herbCount = (d.materials && d.materials.herb) ? d.materials.herb : 0;
        const expPillCount = d.inventory['修為丹'] || 0;
        const healPillCount = d.inventory['療傷藥'] || 0;
        
        const alcLevel = d.world.alchemy.level || 1;
        const allDisciples = d.sect ? d.sect.disciples : [];
        const workers = allDisciples.filter(x => x.status === 'alchemy');
        const idleDisciples = allDisciples.filter(x => x.status === 'idle');

        const maxSlots = 1 + alcLevel; 
        const upgradeCost = alcLevel * 3000;

        // 🌟 元素配色表
        const elementColors = { '火': '#ef4444', '木': '#4ade80', '天': '#fbbf24', '仙': '#c084fc' };

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
                    <span style="font-size:12px; color:${workers.length >= maxSlots ? '#ef4444' : '#94a3b8'};">控火席位：${workers.length} / ${maxSlots}</span>
                </div>
                <button onclick="UI_Alchemy.upgradeFacility()" style="width:100%; padding:8px; background:linear-gradient(180deg, #f87171, #dc2626); color:#fff; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    🔥 升級丹爐 (需 ${upgradeCost} 靈石)
                </button>
            </div>
        `;

        // --- 當前煉丹師列表 ---
        html += `<div style="font-size:13px; color:#ef4444; margin-bottom:10px; font-weight:bold;">🔥 坐鎮煉丹師</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:20px; max-height:120px; overflow-y:auto; padding-right:5px;">`;
        
        if (workers.length === 0) {
            html += `<div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:6px; color:#64748b; font-size:12px;">爐火已熄，尚無弟子煉丹。</div>`;
        } else {
            workers.forEach(w => {
                const elColor = elementColors[w.element] || '#cbd5e1';
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(239,68,68,0.1); border-left:3px solid #ef4444; padding:8px 10px; border-radius:5px;">
                        <div>
                            <div style="color:white; font-weight:bold; font-size:13px;">${w.name}</div>
                            <div style="font-size:11px; color:#fca5a5; margin-top:2px;">
                                <span style="color:${elColor}; font-weight:bold;">${w.element}靈根</span> | 悟性 ${w.stats['悟性']} | 匠心 ${w.stats['匠心']}
                            </div>
                        </div>
                        <button onclick="UI_Alchemy.removeWorker('${w.id}')" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 10px; font-size:11px; cursor:pointer;">請出</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        // --- 調派人手區域 ---
        html += `<div style="font-size:13px; color:#cbd5e1; margin-bottom:10px; font-weight:bold;">⛺ 調派人手 (火、木靈根優先)</div>`;
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:180px; overflow-y:auto; padding-right:5px;">`;
        
        if (idleDisciples.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:15px; color:#64748b; font-size:12px;">無閒置弟子可供調遣。</div>`;
        } else {
            // 🌟 優化：將具備煉丹天賦的弟子排在前面
            const sortedIdle = [...idleDisciples].sort((a, b) => {
                const aCan = AlchemySystem.ALLOWED_ELEMENTS.includes(a.element) ? 1 : 0;
                const bCan = AlchemySystem.ALLOWED_ELEMENTS.includes(b.element) ? 1 : 0;
                return bCan - aCan;
            });

            sortedIdle.forEach(d => {
                const canWork = AlchemySystem.ALLOWED_ELEMENTS.includes(d.element);
                const elColor = elementColors[d.element] || '#94a3b8';
                const borderColor = canWork ? '#ef4444' : 'rgba(255,255,255,0.1)';

                html += `
                    <div style="background:rgba(0,0,0,0.4); border:1px solid ${borderColor}; padding:8px; border-radius:5px; position:relative; opacity: ${canWork ? 1 : 0.6};">
                        <div style="color:white; font-size:13px; font-weight:bold;">${d.name}</div>
                        <div style="font-size:10px; color:#94a3b8; margin:3px 0;">
                            <span style="color:${elColor}; font-weight:bold;">${d.element}屬性</span> | 悟性 ${d.stats['悟性']}
                        </div>
                        <button onclick="UI_Alchemy.assignWorker('${d.id}')" 
                                style="background:${canWork ? '#ef4444' : '#334155'}; color:white; border:none; border-radius:4px; padding:4px; font-size:11px; cursor:pointer; width:100%; margin-top:5px;">
                            ${canWork ? '指派煉丹' : '資質不符'}
                        </button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        return html;
    },

    /**
     * 升級煉丹爐設施
     */
    upgradeFacility() {
        const d = Player.data;
        const currentLevel = d.world.alchemy.level || 1;
        const cost = currentLevel * 3000;

        // 🟢 修正：兼容性靈石檢查
        let currentCoins = d.coin !== undefined ? d.coin : (d.coins || 0);

        if (currentCoins < cost) {
            return Msg.log(`❌ 靈石不足！升級丹爐需要 ${cost} 靈石。`, "system");
        }

        // 扣除靈石
        if (d.coin !== undefined) d.coin -= cost;
        else d.coins -= cost;

        d.world.alchemy.level += 1;
        Player.save();
        
        Msg.log(`✅ 煉丹閣已升級至 Lv.${d.world.alchemy.level}！控火席位增加，地火愈發純淨。`, "reward");
        
        if (window.Core && window.Core.updateUI) window.Core.updateUI();
        this.openModal(); // 刷新面板
    },

    /**
     * 指派弟子進入煉丹閣
     */
    assignWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        const alcLevel = Player.data.world?.alchemy?.level || 1;
        const maxSlots = 1 + alcLevel;
        const currentWorkers = Player.data.sect.disciples.filter(x => x.status === 'alchemy').length;

        // 1. 檢查席位
        if (currentWorkers >= maxSlots) {
            return Msg.log(`❌ 煉丹閣席位已滿 (${currentWorkers}/${maxSlots})！請先升級丹爐。`, "system");
        }

        // 2. 檢查五行屬性資格 (由大腦 AlchemySystem 判定)
        if (window.AlchemySystem && !window.AlchemySystem.canWork(d)) {
            return Msg.log(`❌【${d.name}】屬性為【${d.element}】，並無火木之性，強行控火恐有炸爐之險！`, "system");
        }

        // 3. 執行指派
        if (SectSystem.assignJob(discipleId, 'alchemy')) {
            Player.save();
            Msg.log(`✅ 已指派【${d.name}】進入煉丹閣，爐火因其氣息而旺盛。`, "system");
            this.openModal();
        }
    },

    /**
     * 將弟子請出煉丹閣
     */
    removeWorker(discipleId) {
        let d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        if (SectSystem.assignJob(discipleId, 'idle')) {
            Player.save();
            Msg.log(`🚶 【${d.name}】收回道火，離開了煉丹大殿。`, "system");
            this.openModal();
        }
    }
};

// 掛載至 window
window.UI_Alchemy = UI_Alchemy;
