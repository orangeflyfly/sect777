/**
 * V3.4 ui_world.js (萬象森羅 - 真實數據連動版)
 * 職責：洞府渲染、聚靈陣掛機收益、對接真實產能預估、統一升級物價
 * 位置：/ui/ui_world.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { SectSystem } from '../systems/SectSystem.js';

export const UI_World = {
    init() {
        console.log("【UI_World】洞府法陣啟動，對接宗門大腦與真實產能...");
        this.renderLayout();
        
        if (Player.data && !Player.data.world) {
            Player.data.world = { arrayLevel: 1, lastCollect: Date.now() };
        }
        
        const w = Player.data.world;
        if (w.durability === undefined) w.durability = 100; 
        if (w.arrayGuard === undefined) w.arrayGuard = null; 
        if (!w.farm) w.farm = { level: 0, assigned: 0 };
        if (!w.mine) w.mine = { level: 0, assigned: 0 };

        if (w.workers !== undefined) delete w.workers;

        Player.save();
        this.calculateOfflineGains(true);
        this.renderWorld();
    },

    renderLayout() {
        const container = document.getElementById('page-world');
        if (!container) return;
        container.innerHTML = `
            <div class="page-title">隨身洞府</div>
            <div id="world-resource-bar" class="world-res-bar"></div>
            <div id="world-content" style="flex:1; overflow-y:auto; padding-bottom:20px;"></div>
        `;
    },

    renderWorld() {
        const container = document.getElementById('world-content');
        if (!container || !Player.data) return;

        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        const sectSum = window.SectSystem ? window.SectSystem.getSummary() : { total: 0, idle: 0, farm: 0, mine: 0 };
        wData.farm.assigned = sectSum.farm;
        wData.mine.assigned = sectSum.mine;

        // --- 陣眼駐守邏輯 ---
        let guardName = "無人駐守";
        let guardBonus = 1.0;
        let isGuardActive = false;
        
        if (wData.arrayGuard && Player.data.sect && Player.data.sect.disciples) {
            const guard = Player.data.sect.disciples.find(d => d.id === wData.arrayGuard);
            if (guard) {
                guardName = guard.name;
                isGuardActive = true;
                if (guard.traits && guard.traits.includes('聚靈體質')) {
                    guardBonus = 2.0; 
                    guardName += ' ✨(聚靈)';
                } else {
                    guardBonus = 1.2; 
                }
            } else {
                wData.arrayGuard = null; 
            }
        }

        // --- 聚靈陣邏輯 ---
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 }; 
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        const isFull = elapsedSeconds >= maxSeconds;
        if (isFull) elapsedSeconds = maxSeconds;
        
        const baseEfficiency = wData.durability < 50 ? 0.5 : 1.0;
        const finalEfficiency = baseEfficiency * guardBonus;
        const pendingExp = Math.floor((elapsedSeconds / 10) * finalEfficiency);
        const progressPercent = Math.min(100, (elapsedSeconds / maxSeconds) * 100);

        // 🌟 修正盲點二：真實產能連動 (向 System 大腦要真實數據)
        let mineYieldEst = 0;
        let farmYieldEst = 0;
        
        if (window.MineSystem && Player.data.sect) {
            const miners = Player.data.sect.disciples.filter(d => d.status === 'mine');
            miners.forEach(w => mineYieldEst += window.MineSystem.getDiscipleYield(w).yield);
        }
        if (window.FarmSystem && Player.data.sect) {
            const farmers = Player.data.sect.disciples.filter(d => d.status === 'farm');
            // 簡化團隊光環傳遞，抓取基礎個人產能總和作為預估
            farmers.forEach(w => farmYieldEst += window.FarmSystem.getDiscipleYield(w, {workerCount: farmers.length, buffOthersMult: 1, annoyOthersMult: 1}).yield);
        }

        // 🌟 修正升級費用顯示 (統一與 ui_mine.js 同步，或設定為開闢費用)
        const farmCost = wData.farm.level === 0 ? 1000 : wData.farm.level * 1500;
        const mineCost = wData.mine.level === 0 ? 2000 : wData.mine.level * 1500;

        this.updateResourceBar(sectSum);

        // --- 主內容渲染 ---
        container.innerHTML = `
            <div class="world-array-card" style="position:relative; overflow:hidden;">
                <div style="position:absolute; top:-50%; left:-50%; width:200%; height:200%; background: radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 60%); animation: spin 20s linear infinite; pointer-events:none; z-index:0;"></div>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>

                <div class="array-header" style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:1;">
                    <div class="array-title">聚靈大陣 (階級 ${wData.arrayLevel})</div>
                    <div class="array-durability" style="font-size:12px; color:${wData.durability < 30 ? '#ef4444' : '#94a3b8'}">
                        🔧 耐久: ${wData.durability}%
                    </div>
                </div>

                <div style="text-align:center; position:relative; z-index:1; margin-top:10px;">
                    <div style="font-size:12px; color:#cbd5e1; margin-bottom:5px;">陣眼駐守</div>
                    <button onclick="UI_World.selectArrayGuard()" style="background:rgba(0,0,0,0.5); border:1px solid ${isGuardActive ? '#a855f7' : '#475569'}; color:${isGuardActive ? '#e9d5ff' : '#94a3b8'}; padding:5px 15px; border-radius:15px; font-size:13px; cursor:pointer; box-shadow: ${isGuardActive ? '0 0 10px rgba(168,85,247,0.5)' : 'none'};">
                        🧘‍♂️ ${guardName}
                    </button>
                </div>

                <div class="array-core ${isFull ? 'full' : 'active'}" style="margin:15px auto; position:relative; z-index:1; animation: ${isGuardActive ? 'pulse 2s infinite' : 'none'};">
                    <div class="array-glow" style="opacity: ${wData.durability / 100}"></div>
                    <span style="font-size:40px; position:relative; z-index:2; text-shadow: 0 0 15px #60a5fa;">☯️</span>
                </div>
                
                <div class="array-status" style="position:relative; z-index:1;">
                    <p>當前凝聚靈氣：<b style="color:var(--exp-color); font-size:16px;">${pendingExp}</b> EXP 
                       ${finalEfficiency !== 1.0 ? `<span style="color:${finalEfficiency > 1 ? '#4ade80' : '#ef4444'}; font-size:11px;">(效率 x${finalEfficiency.toFixed(1)})</span>` : ''}
                    </p>
                    
                    <div class="array-progress-container" style="width:100%; height:8px; background:#1e293b; border-radius:4px; margin:10px 0; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
                        <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, #60a5fa, #a78bfa); transition:width 0.5s ease;"></div>
                    </div>

                    <p class="time-limit">掛機時限：${this.formatTime(elapsedSeconds)} / ${this.formatTime(maxSeconds)}</p>
                </div>

                <div style="display:flex; gap:10px; margin-top:15px; position:relative; z-index:1;">
                    <button class="btn-eco-action" style="flex:2; padding:10px; background:var(--exp-color); border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer;" onclick="UI_World.collectGains()">一鍵收取</button>
                    ${wData.durability < 100 ? `<button class="btn-eco-action" style="flex:1; background:#475569; border:none; border-radius:8px; color:white; cursor:pointer;" onclick="UI_World.repairArray()">修復 (💰500)</button>` : ''}
                </div>
            </div>

            <div class="world-management-grid">
                <div class="management-card">
                    <h4>👥 人事招募堂</h4>
                    <p>宗門弟子：<b>${sectSum.total}</b> / ${SectSystem.MAX_DISCIPLES}</p>
                    <p>閒置人手：<b style="color:#94a3b8;">${sectSum.idle}</b></p>
                    <button class="btn-eco-trade btn-buy" style="width:100%; margin-top:10px; background:#3b82f6;" onclick="if(window.UI_Recruit) UI_Recruit.openModal()">
                        前往管理
                    </button>
                </div>

                <div class="management-card">
                    <h4>⛏️ 靈礦脈 (Lv.${wData.mine.level})</h4>
                    <p>真實產能：<b style="color:#4ade80;">+${mineYieldEst}</b> <span style="font-size:10px; color:#94a3b8;">/次</span></p>
                    <p>駐守礦工：<b style="color:#fbbf24;">${sectSum.mine}</b> 人</p>
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="btn-upgrade-mini" style="flex:1;" onclick="UI_World.upgradeIndustry('mine')">
                            ${wData.mine.level === 0 ? `✨ 開闢 (${mineCost})` : `🔼 升級 (${mineCost})`}
                        </button>
                        ${wData.mine.level > 0 ? `<button class="btn-eco-trade" style="flex:1; background:#ca8a04; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="if(window.UI_Mine) UI_Mine.openModal()">入礦</button>` : ''}
                    </div>
                </div>

                <div class="management-card">
                    <h4>🌿 仙草園 (Lv.${wData.farm.level})</h4>
                    <p>真實產能：<b style="color:#4ade80;">+${farmYieldEst}</b> <span style="font-size:10px; color:#94a3b8;">/次</span></p>
                    <p>駐守藥農：<b style="color:#4ade80;">${sectSum.farm}</b> 人</p>
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="btn-upgrade-mini" style="flex:1;" onclick="UI_World.upgradeIndustry('farm')">
                            ${wData.farm.level === 0 ? `✨ 開闢 (${farmCost})` : `🔼 升級 (${farmCost})`}
                        </button>
                        ${wData.farm.level > 0 ? `<button class="btn-eco-trade" style="flex:1; background:#16a34a; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="if(window.UI_Farm) UI_Farm.openModal(); else Msg.log('仙草園管理介面建置中...','system')">入園</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    updateResourceBar(sectSum) {
        const bar = document.getElementById('world-resource-bar');
        if (!bar || !Player.data.materials) return;

        const herbCount = Player.data.materials.herb || 0;
        const oreCount = Player.data.materials.ore || 0;

        bar.innerHTML = `
            <div class="res-item">🌿 仙草: <span style="color:#4ade80; font-weight:bold;">${herbCount.toLocaleString()}</span></div>
            <div class="res-item">⛏️ 玄鐵: <span style="color:#fbbf24; font-weight:bold;">${oreCount.toLocaleString()}</span></div>
            <div class="res-item">👥 弟子: <span>${sectSum.total}/${SectSystem.MAX_DISCIPLES}</span></div>
        `;
        bar.style.cssText = "display:flex; justify-content:space-around; background:rgba(0,0,0,0.5); padding:10px; border-radius:8px; margin-bottom:15px; font-size:13px; border:1px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);";
    },

    repairArray() {
        if (Player.data.coin < 500) return Msg.log("靈石不足，無法修繕法陣！", "system");
        Player.data.coin -= 500;
        Player.data.world.durability = 100;
        Msg.log("消耗 500 靈石，聚靈陣煥然一新！效率恢復！", "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    // 🌟 修正盲點一：統一升級物價邏輯
    upgradeIndustry(type) {
        const wData = Player.data.world;
        const currentLv = wData[type].level;
        const name = type === 'mine' ? '靈礦脈' : '仙草園';
        
        const baseCost = type === 'mine' ? 2000 : 1000;
        const upgradeCost = currentLv === 0 ? baseCost : currentLv * 1500; // 統一後續升級費用為 Lv * 1500

        if (Player.data.coin < upgradeCost) return Msg.log(`靈石不足！${currentLv === 0 ? '開闢' : '升級'}需要 ${upgradeCost} 靈石`, "system");

        Player.data.coin -= upgradeCost;
        wData[type].level += 1;
        
        Msg.log(`🎊 【${name}】${currentLv === 0 ? '開闢成功' : '晉升至 Lv.' + wData[type].level}！`, "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    selectArrayGuard() {
        if (!Player.data.sect || Player.data.sect.disciples.length === 0) {
            return Msg.log("宗門尚無弟子，無法派人駐守！", "system");
        }

        const idleDisciples = Player.data.sect.disciples.filter(d => d.status === 'idle');
        
        let html = `<div style="max-height:300px; overflow-y:auto; padding-right:5px; display:flex; flex-direction:column; gap:8px;">`;
        html += `
            <button onclick="UI_World.setArrayGuard(null)" style="background:#ef4444; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">
                撤除駐守
            </button>
        `;

        if (idleDisciples.length === 0) {
            html += `<div style="text-align:center; color:#94a3b8; margin-top:10px;">無閒置弟子可供調遣。</div>`;
        } else {
            idleDisciples.forEach(d => {
                const isSpecial = d.traits.includes('聚靈體質');
                html += `
                    <div style="background:rgba(0,0,0,0.5); border:1px solid ${isSpecial ? '#a855f7' : '#334155'}; padding:10px; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="color:white; font-weight:bold;">${d.name}</span>
                            ${isSpecial ? '<span style="font-size:10px; color:#e9d5ff; background:#7e22ce; padding:2px 4px; border-radius:3px; margin-left:5px;">聚靈體質</span>' : ''}
                        </div>
                        <button onclick="UI_World.setArrayGuard('${d.id}')" style="background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">駐守</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        const existing = document.getElementById('guard-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="guard-modal" class="modal-overlay" style="z-index:10002;" onclick="this.remove()">
                <div class="modal-box" style="max-width:300px; background:#1e293b; border:1px solid #60a5fa;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4 style="color:white; margin:0;">選擇陣眼駐守</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('guard-modal').remove()">✕</button>
                    </div>
                    <div class="modal-body" style="padding-top:15px;">
                        ${html}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    setArrayGuard(discipleId) {
        Player.data.world.arrayGuard = discipleId;
        Player.save();
        
        const existing = document.getElementById('guard-modal');
        if (existing) existing.remove();
        
        if (discipleId) {
            const d = Player.data.sect.disciples.find(x => x.id === discipleId);
            Msg.log(`【${d.name}】已進入陣眼打坐，聚靈陣開始共鳴！`, "system");
        } else {
            Msg.log("陣眼已騰空。", "system");
        }
        
        this.renderWorld();
    },

    collectGains() {
        const wData = Player.data.world;
        const now = Date.now();
        let elapsedSeconds = Math.floor((now - wData.lastCollect) / 1000);
        
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800 };
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        const effectiveSeconds = Math.min(elapsedSeconds, maxSeconds);

        const baseEfficiency = wData.durability < 50 ? 0.5 : 1.0;
        let guardBonus = 1.0;
        if (wData.arrayGuard && Player.data.sect) {
            const guard = Player.data.sect.disciples.find(d => d.id === wData.arrayGuard);
            if (guard) {
                guardBonus = guard.traits.includes('聚靈體質') ? 2.0 : 1.2;
            }
        }
        const finalEfficiency = baseEfficiency * guardBonus;
        
        const gainedExp = Math.floor((effectiveSeconds / 10) * finalEfficiency);

        if (gainedExp <= 0) {
            Msg.log("靈氣稀薄，再等等吧。", "system");
            return;
        }

        wData.durability = Math.max(0, wData.durability - (Math.floor(Math.random() * 3) + 1));
        Player.gainExp(gainedExp);

        Msg.log(`🌟 吸收陣眼靈氣：修為大增 +${gainedExp} EXP`, "reward");
        wData.lastCollect = Date.now();
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    calculateOfflineGains(isLogin = false) {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;
        const elapsed = Math.floor((Date.now() - wData.lastCollect) / 1000);
        if (isLogin && elapsed > 60) {
            Msg.log(`閉關結束，積累了 ${this.formatTime(elapsed)} 的天地靈氣。`, "gold");
        }
    },

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}時${m}分`;
        return `${m}分${s}秒`;
    }
};

window.UI_World = UI_World;
