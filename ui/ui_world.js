/**
 * V3.5.5 ui_world.js (萬象森羅 - 全產業鏈連動版)
 * 職責：洞府渲染、聚靈陣掛機收益與升級、對接真實產能預估、統一升級物價、新增煉器殿入口
 * 位置：/ui/ui_world.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { SectSystem } from '../systems/SectSystem.js';

export const UI_World = {
    init() {
        console.log("【UI_World】洞府法陣啟動，全產業鏈接完畢...");
        this.renderLayout();
        
        if (Player.data && !Player.data.world) {
            Player.data.world = { arrayLevel: 1, lastCollect: Date.now() };
        }
        
        const w = Player.data.world;
        if (w.durability === undefined) w.durability = 100; 
        if (w.arrayGuard === undefined) w.arrayGuard = null; 
        if (!w.farm) w.farm = { level: 0, assigned: 0 };
        if (!w.mine) w.mine = { level: 0, assigned: 0 };
        
        // 確保煉丹閣數據存在
        if (!w.alchemy) w.alchemy = { level: 0, assigned: 0 };
        
        // 🌟 新增：確保煉器殿數據存在
        if (!w.forge) w.forge = { level: 0, assigned: 0 };

        if (w.workers !== undefined) delete w.workers; // 清理舊版本數據

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
        
        const sectSum = window.SectSystem ? window.SectSystem.getSummary() : { total: 0, idle: 0, farm: 0, mine: 0, alchemy: 0, forge: 0 };
        wData.farm.assigned = sectSum.farm;
        wData.mine.assigned = sectSum.mine;
        wData.alchemy.assigned = sectSum.alchemy || 0; 
        // 煉器殿尚未設定專屬派遣狀態前，先給 0
        wData.forge.assigned = sectSum.forge || 0; 

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
        // 🌟 擴增：支援更高階的聚靈陣時間上限
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800, 4: 86400, 5: 259200 }; 
        const maxSeconds = maxTimeMap[wData.arrayLevel] || 300;
        const isFull = elapsedSeconds >= maxSeconds;
        if (isFull) elapsedSeconds = maxSeconds;
        
        const baseEfficiency = wData.durability < 50 ? 0.5 : 1.0;
        const finalEfficiency = baseEfficiency * guardBonus;
        // 🌟 優化：聚靈陣等級也會略微提升基礎獲取量
        const levelBonus = 1 + (wData.arrayLevel - 1) * 0.2;
        const pendingExp = Math.floor((elapsedSeconds / 10) * finalEfficiency * levelBonus);
        const progressPercent = Math.min(100, (elapsedSeconds / maxSeconds) * 100);

        // --- 真實產能連動預估 ---
        let mineYieldEst = 0;
        let farmYieldEst = 0;
        
        if (window.MineSystem && Player.data.sect) {
            const miners = Player.data.sect.disciples.filter(d => d.status === 'mine');
            miners.forEach(w => mineYieldEst += window.MineSystem.getDiscipleYield(w).yield);
        }
        if (window.FarmSystem && Player.data.sect) {
            const farmers = Player.data.sect.disciples.filter(d => d.status === 'farm');
            farmers.forEach(w => farmYieldEst += window.FarmSystem.getDiscipleYield(w, {workerCount: farmers.length, buffOthersMult: 1, annoyOthersMult: 1}).yield);
        }

        // --- 升級費用計算 ---
        const farmCost = wData.farm.level === 0 ? 1000 : wData.farm.level * 1500;
        const mineCost = wData.mine.level === 0 ? 2000 : wData.mine.level * 1500;
        const alcCost = wData.alchemy.level === 0 ? 3000 : wData.alchemy.level * 3000;
        const forgeCost = wData.forge.level === 0 ? 5000 : wData.forge.level * 4000; // 🌟 煉器殿最貴
        const arrayUpgradeCost = wData.arrayLevel * 5000; // 🌟 聚靈陣升級費用

        this.updateResourceBar(sectSum);

        // --- 主內容渲染 ---
        container.innerHTML = `
            <div class="world-array-card" style="position:relative; overflow:hidden;">
                <div style="position:absolute; top:-50%; left:-50%; width:200%; height:200%; background: radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 60%); animation: spin 20s linear infinite; pointer-events:none; z-index:0;"></div>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>

                <div class="array-header" style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:1;">
                    <div class="array-title" style="display:flex; align-items:center; gap:10px;">
                        聚靈大陣 (階級 ${wData.arrayLevel})
                        ${wData.arrayLevel < 5 ? `<button onclick="UI_World.upgradeArray()" style="background:#3b82f6; color:white; border:none; padding:2px 8px; border-radius:4px; font-size:11px; cursor:pointer;">升級 (${arrayUpgradeCost})</button>` : '<span style="font-size:10px; color:#fbbf24;">(已滿階)</span>'}
                    </div>
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
                       ${finalEfficiency !== 1.0 || levelBonus !== 1.0 ? `<span style="color:#4ade80; font-size:11px;">(綜合效率 x${(finalEfficiency * levelBonus).toFixed(2)})</span>` : ''}
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

                <div class="management-card">
                    <h4>🔥 煉丹閣 (Lv.${wData.alchemy.level})</h4>
                    <p>駐守丹師：<b style="color:#ef4444;">${wData.alchemy.assigned}</b> 人</p>
                    <p style="font-size:11px; color:#94a3b8; margin-top:2px;">將仙草煉化為修為丹與療傷藥</p>
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="btn-upgrade-mini" style="flex:1;" onclick="UI_World.upgradeIndustry('alchemy')">
                            ${wData.alchemy.level === 0 ? `✨ 開闢 (${alcCost})` : `🔼 升級 (${alcCost})`}
                        </button>
                        ${wData.alchemy.level > 0 ? `<button class="btn-eco-trade" style="flex:1; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="if(window.UI_Alchemy) UI_Alchemy.openModal(); else Msg.log('煉丹閣管理介面建置中...','system')">開爐</button>` : ''}
                    </div>
                </div>

                <div class="management-card" style="border: 1px solid rgba(251,146,60,0.5); box-shadow: 0 0 10px rgba(251,146,60,0.1);">
                    <h4 style="color:#fb923c;">🔨 煉器大殿 (Lv.${wData.forge.level})</h4>
                    <p style="font-size:11px; color:#94a3b8; margin-top:2px; margin-bottom:8px;">消耗玄鐵鍛造神兵，支援千錘百鍊與靈力強化。</p>
                    <div style="display:flex; gap:5px; margin-top:auto;">
                        <button class="btn-upgrade-mini" style="flex:1;" onclick="UI_World.upgradeIndustry('forge')">
                            ${wData.forge.level === 0 ? `✨ 開闢 (${forgeCost})` : `🔼 升級 (${forgeCost})`}
                        </button>
                        ${wData.forge.level > 0 ? `<button class="btn-eco-trade" style="flex:1; background:#ea580c; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="if(window.UI_Forge) UI_Forge.openModal(); else Msg.log('煉器大殿建置中...','system')">鍛造</button>` : ''}
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
        // 兼容性靈石檢查
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);

        if (currentCoins < 500) return Msg.log("靈石不足，無法修繕法陣！", "system");
        
        if (Player.data.coin !== undefined) Player.data.coin -= 500;
        else Player.data.coins -= 500;

        Player.data.world.durability = 100;
        Msg.log("消耗 500 靈石，聚靈陣煥然一新！效率恢復！", "gold");
        Player.save();
        this.renderWorld();
        if (window.Core) window.Core.updateUI();
    },

    // 🌟 新增：聚靈大陣專屬升級邏輯
    upgradeArray() {
        const d = Player.data;
        const currentLevel = d.world.arrayLevel || 1;
        if (currentLevel >= 5) return Msg.log("聚靈陣已達當前境界巔峰！", "system");

        const cost = currentLevel * 5000;
        let currentCoins = d.coin !== undefined ? d.coin : (d.coins || 0);

        if (currentCoins < cost) return Msg.log(`❌ 靈石不足！升級聚靈陣需要 ${cost.toLocaleString()} 靈石。`, "system");

        if (d.coin !== undefined) d.coin -= cost;
        else d.coins -= cost;

        d.world.arrayLevel += 1;
        
        Player.save();
        Msg.log(`☯️ 陣法轟鳴！聚靈大陣升級至 Lv.${d.world.arrayLevel}，掛機時限與效率皆獲提升！`, "reward");
        
        if (window.Core && window.Core.updateUI) window.Core.updateUI();
        this.renderWorld(); 
    },

    // 🌟 修正：統一升級物價邏輯 (涵蓋四大產業)
    upgradeIndustry(type) {
        const wData = Player.data.world;
        const currentLv = wData[type].level;
        
        let name = '';
        let baseCost = 0;
        let scale = 1500;

        // 判定不同產業的基底價格
        switch (type) {
            case 'mine': name = '靈礦脈'; baseCost = 2000; scale = 1500; break;
            case 'farm': name = '仙草園'; baseCost = 1000; scale = 1500; break;
            case 'alchemy': name = '煉丹閣'; baseCost = 3000; scale = 3000; break; 
            case 'forge': name = '煉器大殿'; baseCost = 5000; scale = 4000; break; // 🌟 煉器殿最貴
        }
        
        const upgradeCost = currentLv === 0 ? baseCost : currentLv * scale; 

        // 兼容性靈石檢查
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);

        if (currentCoins < upgradeCost) return Msg.log(`靈石不足！${currentLv === 0 ? '開闢' : '升級'}需要 ${upgradeCost.toLocaleString()} 靈石`, "system");

        if (Player.data.coin !== undefined) Player.data.coin -= upgradeCost;
        else Player.data.coins -= upgradeCost;

        wData[type].level += 1;
        
        Msg.log(`🎊 【${name}】${currentLv === 0 ? '開闢成功' : '晉升至 Lv.' + wData[type].level}！`, "gold");
        Player.save();
        this.renderWorld();
        if (window.Core && window.Core.updateUI) window.Core.updateUI();
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
            // 優化：有聚靈體質的人排前面
            const sortedIdle = [...idleDisciples].sort((a, b) => {
                const aSpecial = a.traits.includes('聚靈體質') ? 1 : 0;
                const bSpecial = b.traits.includes('聚靈體質') ? 1 : 0;
                return bSpecial - aSpecial;
            });

            sortedIdle.forEach(d => {
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
        
        const maxTimeMap = { 1: 300, 2: 1800, 3: 28800, 4: 86400, 5: 259200 };
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
        const levelBonus = 1 + (wData.arrayLevel - 1) * 0.2;
        
        const gainedExp = Math.floor((effectiveSeconds / 10) * finalEfficiency * levelBonus);

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
        if (window.Core && window.Core.updateUI) window.Core.updateUI();
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
