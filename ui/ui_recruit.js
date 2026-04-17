/**
 * V3.5.1 ui_recruit.js (招募堂專屬 UI - 五行自動指派版)
 * 職責：掌管抽卡介面、五行屬性顯示、天驕特效、以及「根據屬性」自動入職邏輯
 * 位置：/ui/ui_recruit.js
 */

import { Player } from '../entities/player.js';
import { SectSystem } from '../systems/SectSystem.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

// 🌟 引入所有生產系統以進行精準指派
import { FarmSystem } from '../systems/FarmSystem.js';
import { MineSystem } from '../systems/MineSystem.js';
import { AlchemySystem } from '../systems/AlchemySystem.js';

export const UI_Recruit = {
    
    init() {
        console.log("【UI_Recruit】招募堂大陣初始化，五行感測與自動入職管線已就緒。");
        window.UI_Recruit = this;
    },

    /**
     * 開啟招募堂主介面
     */
    openModal() {
        const title = "👥 宗門人事招募堂";
        const contentHtml = this.renderRecruit();
        this.showModal(title, contentHtml);
    },

    /**
     * 專屬彈窗渲染
     */
    showModal(title, contentHtml) {
        const existing = document.getElementById('recruit-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="recruit-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid var(--card-border);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                        <h3 style="color:#fcd34d; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('recruit-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body" id="recruit-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * 渲染名冊與按鈕
     * 🌟 優化：加入煉丹與歷練的人數統計
     */
    renderRecruit() {
        const summary = SectSystem.getSummary();
        const max = SectSystem.MAX_DISCIPLES;
        const list = Player.data.sect.disciples || [];

        // 🌟 元素配色表 (同步 UI_Alchemy)
        const elColors = { '火': '#ef4444', '木': '#4ade80', '金': '#fbbf24', '水': '#60a5fa', '土': '#a8a29e', '天': '#fbbf24', '仙': '#c084fc' };

        let html = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-bottom:15px; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px;">
                    <div style="grid-column: 1/4; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:5px;">
                        <span style="font-size:12px; color:#94a3b8;">宗門規模：</span><b style="font-size:16px; color:#fcd34d;">${summary.total}/${max}</b>
                    </div>
                    <div><span style="font-size:10px; color:#94a3b8;">閒置</span><br><b style="color:#cbd5e1;">${summary.idle}</b></div>
                    <div><span style="font-size:10px; color:#94a3b8;">仙草</span><br><b style="color:#4ade80;">${summary.farm}</b></div>
                    <div><span style="font-size:10px; color:#94a3b8;">靈礦</span><br><b style="color:#fbbf24;">${summary.mine}</b></div>
                    <div><span style="font-size:10px; color:#94a3b8;">煉丹</span><br><b style="color:#f87171;">${summary.alchemy}</b></div>
                    <div><span style="font-size:10px; color:#94a3b8;">外派</span><br><b style="color:#c084fc;">${summary.expedition}</b></div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button class="btn-eco-action" style="flex:1; padding:10px; background:var(--glass-dark); border:1px solid #3b82f6;" onclick="UI_Recruit.doRecruit(false)">
                        💰 1,000<br>尋覓單人
                    </button>
                    <button class="btn-eco-action" style="flex:1; padding:10px; background:var(--glass-dark); border:1px solid #a855f7;" onclick="UI_Recruit.doRecruit(true)">
                        💰 10,000<br><span style="color:#a855f7;">十連保底</span>
                    </button>
                </div>
            </div>
            
            <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                <p style="font-size:13px; color:#cbd5e1; margin-bottom:10px;">宗門名冊 (點擊查看詳細)</p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:300px; overflow-y:auto; padding-right:5px;">
        `;

        if (list.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#64748b;">宗門初創，尚無弟子。</div>`;
        } else {
            // 由新到舊排序
            [...list].reverse().forEach(d => {
                const rootData = DATA_SECT.ROOT_LEVELS[d.root];
                const elColor = elColors[d.element] || '#cbd5e1';
                
                // 狀態顯示優化
                const statusMap = {
                    'farm': '<span style="color:#4ade80;">[草園]</span>',
                    'mine': '<span style="color:#fbbf24;">[礦脈]</span>',
                    'alchemy': '<span style="color:#f87171;">[煉丹]</span>',
                    'expedition': '<span style="color:#c084fc;">[外派]</span>',
                    'idle': '<span style="color:#94a3b8;">[閒置]</span>'
                };
                let statusText = statusMap[d.status] || '[未知]';
                const lvl = d.level || 1;

                html += `
                    <div style="background:rgba(0,0,0,0.5); border-left:4px solid ${rootData.color}; border-radius:6px; padding:8px; cursor:pointer;"
                         onclick="UI_Recruit.showDiscipleDetail('${d.id}')">
                        <div style="font-size:14px; font-weight:bold; color:white; white-space:nowrap; overflow:hidden;">Lv.${lvl} ${d.name}</div>
                        <div style="font-size:11px; margin-top:4px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:${elColor}; font-weight:bold;">${d.element}靈根</span>
                            ${statusText}
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        return html;
    },

    /**
     * 渲染弟子詳細與操作面板
     * 🌟 優化：顯示五行屬性與煉丹指派
     */
    showDiscipleDetail(id) {
        const d = Player.data.sect.disciples.find(x => x.id === id);
        if (!d) return;

        const rootData = DATA_SECT.ROOT_LEVELS[d.root];
        const elColors = { '火': '#ef4444', '木': '#4ade80', '金': '#fbbf24', '水': '#60a5fa', '土': '#a8a29e', '天': '#fbbf24', '仙': '#c084fc' };
        const elColor = elColors[d.element] || '#cbd5e1';

        const level = d.level || 1;
        const exp = d.exp || 0;
        const maxExp = d.maxExp || (level * 100);
        const expPercent = Math.min(100, Math.floor((exp / maxExp) * 100));

        let traitsHtml = d.traits.map(tKey => {
            let tData = DATA_SECT.TRAITS[tKey];
            if(!tData) return '';
            let tColor = tData.type === 'buff' ? '#4ade80' : (tData.type === 'debuff' ? '#ef4444' : (tData.type === 'magic' ? '#c084fc' : '#fcd34d'));
            return `<div style="background:rgba(255,255,255,0.05); padding:6px; border-radius:4px; margin-bottom:5px;">
                        <span style="color:${tColor}; font-weight:bold; font-size:13px;">[${tKey}]</span> 
                        <span style="font-size:12px; color:#cbd5e1;">${tData.desc}</span>
                    </div>`;
        }).join('');

        let modalHtml = `
            <div id="disciple-detail-modal" class="modal-overlay" style="z-index:10001;" onclick="this.remove()">
                <div class="modal-box" style="max-width: 320px; background:#1e293b; border:2px solid ${rootData.color}; box-shadow: 0 0 20px ${rootData.color}44;" onclick="event.stopPropagation()">
                    <div style="text-align:center; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:22px; font-weight:bold; color:white;">${d.name}</div>
                        <div style="display:flex; justify-content:center; gap:10px; margin-top:8px;">
                            <span style="font-size:14px; color:${rootData.color}; font-weight:bold;">${rootData.label}</span>
                            <span style="font-size:14px; color:${elColor}; font-weight:bold;">${d.element}靈根</span>
                        </div>
                    </div>
                    
                    <div style="margin: 12px 0; padding: 0 10px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span style="color:#fbbf24; font-weight:bold;">修為境界: Lv.${level}</span>
                            <span style="color:#94a3b8;">${exp} / ${maxExp}</span>
                        </div>
                        <div style="width:100%; height:8px; background:rgba(0,0,0,0.5); border-radius:4px; overflow:hidden;">
                            <div style="width:${expPercent}%; height:100%; background:linear-gradient(90deg, #3b82f6, #60a5fa); transition: width 0.3s;"></div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; margin:12px 0; background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
                        <div>⚔️ 戰力: <b style="color:white;">${d.stats['戰力']}</b></div>
                        <div>🧠 悟性: <b style="color:white;">${d.stats['悟性']}</b></div>
                        <div>✨ 機緣: <b style="color:white;">${d.stats['機緣']}</b></div>
                        <div>❤️ 體質: <b style="color:white;">${d.stats['體質']}</b></div>
                        <div>🔨 匠心: <b style="color:white;">${d.stats['匠心']}</b></div>
                        <div>💎 魅力: <b style="color:white;">${d.stats['魅力'] || 10}</b></div>
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <div style="font-size:12px; color:#94a3b8; margin-bottom:8px;">本命詞條</div>
                        <div style="max-height:100px; overflow-y:auto; padding-right:5px;">${traitsHtml || '<span style="color:#475569; font-style:italic;">暫無特殊詞條</span>'}</div>
                    </div>

                    <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                        <div style="font-size:12px; color:#94a3b8; margin-bottom:8px;">職務指派</div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px; margin-bottom:12px;">
                            <button style="padding:6px; border-radius:4px; border:none; background:${d.status==='idle'?'#94a3b8':'#334155'}; color:white; font-size:11px;" onclick="UI_Recruit.assignDiscipleJob('${d.id}', 'idle')">閒置</button>
                            <button style="padding:6px; border-radius:4px; border:none; background:${d.status==='farm'?'#4ade80':'#334155'}; color:white; font-size:11px;" onclick="UI_Recruit.assignDiscipleJob('${d.id}', 'farm')">仙草</button>
                            <button style="padding:6px; border-radius:4px; border:none; background:${d.status==='mine'?'#fbbf24':'#334155'}; color:white; font-size:11px;" onclick="UI_Recruit.assignDiscipleJob('${d.id}', 'mine')">靈礦</button>
                            <button style="padding:6px; border-radius:4px; border:none; background:${d.status==='alchemy'?'#f87171':'#334155'}; color:white; font-size:11px;" onclick="UI_Recruit.assignDiscipleJob('${d.id}', 'alchemy')">煉丹</button>
                            <button style="padding:6px; border-radius:4px; border:none; background:${d.status==='expedition'?'#c084fc':'#334155'}; color:white; font-size:11px; opacity:0.5; cursor:not-allowed;" onclick="">歷練</button>
                        </div>
                        <button style="width:100%; padding:8px; border-radius:5px; border:1px solid #ef4444; background:transparent; color:#ef4444; font-weight:bold; cursor:pointer; font-size:13px;" onclick="UI_Recruit.doDismiss('${d.id}')">
                            逐出宗門 (遣散)
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * 動作層：執行招募，並啟動「自動指派」
     */
    doRecruit(isTen) {
        let results = SectSystem.recruit(isTen);
        if (results && results.length > 0) {
            // 🌟 核心：針對每一位新弟子執行自動指派
            results.forEach(d => {
                this.autoAssignBackdoor(d);
            });
            
            this.playGachaAnimation(results);
        }
    },

    /**
     * 🌟 V3.5.1 核心：「走後門」自動指派邏輯
     * 修正：根據【element 五行屬性】與部門空位自動分配
     */
    autoAssignBackdoor(disciple) {
        const d = Player.data;
        
        // 1. 優先判定煉丹閣 (火靈根、天/仙靈根)
        const alcLevel = d.world.alchemy?.level || 0;
        if (alcLevel > 0) {
            const maxAlcSlots = 1 + alcLevel;
            const currentAlcWorkers = d.sect.disciples.filter(x => x.status === 'alchemy').length;
            if (currentAlcWorkers < maxAlcSlots && AlchemySystem && AlchemySystem.canWork(disciple)) {
                disciple.status = 'alchemy';
                Msg.log(`🔥 內定：【${disciple.name}】身懷火性，已領往煉丹閣坐鎮。`, "system");
                return;
            }
        }

        // 2. 其次判定仙草園 (木、水、天、仙靈根)
        const farmLevel = d.world.farm.level || 1;
        const maxFarmSlots = 2 + farmLevel;
        const currentFarmWorkers = d.sect.disciples.filter(x => x.status === 'farm').length;
        if (currentFarmWorkers < maxFarmSlots && FarmSystem && FarmSystem.canWork(disciple)) {
            disciple.status = 'farm';
            Msg.log(`🌿 內定：【${disciple.name}】資質親和草木，已直接送往仙草園。`, "system");
            return;
        }

        // 3. 再次判定靈礦脈 (金、土、天、仙靈根)
        const mineLevel = d.world.mine.level || 1;
        const maxMineSlots = 2 + mineLevel;
        const currentMineWorkers = d.sect.disciples.filter(x => x.status === 'mine').length;
        if (currentMineWorkers < maxMineSlots && MineSystem && MineSystem.canWork(disciple)) {
            disciple.status = 'mine';
            Msg.log(`⛏️ 內定：看【${disciple.name}】骨骼精奇，已直接領往下礦。`, "system");
            return;
        }

        // 4. 若無合適位置或已滿，則保持閒置
        disciple.status = 'idle';
    },

    /**
     * 動作層：手動指派工作 (加強防呆)
     */
    assignDiscipleJob(id, job) {
        let d = Player.data.sect.disciples.find(x => x.id === id);
        if (!d) return;

        // 煉丹閣防呆
        if (job === 'alchemy') {
            if (AlchemySystem && !AlchemySystem.canWork(d)) {
                return Msg.log(`❌【${d.name}】並無火木之性，無法煉丹！`, "system");
            }
            const alcLevel = Player.data.world.alchemy?.level || 0;
            const max = 1 + alcLevel;
            const current = Player.data.sect.disciples.filter(x => x.status === 'alchemy').length;
            if (current >= max && d.status !== 'alchemy') {
                return Msg.log(`❌ 煉丹閣席位已滿 (${current}/${max})！`, "system");
            }
        }

        // 仙草園防呆
        if (job === 'farm') {
            if (FarmSystem && !FarmSystem.canWork(d)) {
                return Msg.log(`❌【${d.name}】不具備草木靈根，指派失敗！`, "system");
            }
            const farmLevel = Player.data.world.farm.level || 1;
            const max = 2 + farmLevel;
            const current = Player.data.sect.disciples.filter(x => x.status === 'farm').length;
            if (current >= max && d.status !== 'farm') {
                return Msg.log(`❌ 仙草園坑位已滿 (${current}/${max})！`, "system");
            }
        }

        // 靈礦脈防呆
        if (job === 'mine') {
            if (MineSystem && !MineSystem.canWork(d)) {
                return Msg.log(`❌【${d.name}】資質不符，無法下礦！`, "system");
            }
            const mineLevel = Player.data.world.mine.level || 1;
            const max = 2 + mineLevel;
            const current = Player.data.sect.disciples.filter(x => x.status === 'mine').length;
            if (current >= max && d.status !== 'mine') {
                return Msg.log(`❌ 靈礦脈坑位已滿 (${current}/${max})！`, "system");
            }
        }

        // 執行指派
        SectSystem.assignJob(id, job);
        
        // 同步存檔
        let sum = SectSystem.getSummary();
        if(Player.data.world.farm) Player.data.world.farm.assigned = sum.farm;
        if(Player.data.world.mine) Player.data.world.mine.assigned = sum.mine;
        if(Player.data.world.alchemy) Player.data.world.alchemy.assigned = sum.alchemy;
        
        Player.save();

        Msg.log(`✅ 已將【${d.name}】派往：${job}`, "system");

        if(document.getElementById('disciple-detail-modal')) document.getElementById('disciple-detail-modal').remove();
        this.openModal(); 
    },

    doDismiss(id) {
        if (confirm("確定要將此弟子逐出宗門嗎？此舉不可逆！")) {
            SectSystem.dismissDisciple(id);
            let sum = SectSystem.getSummary();
            if(Player.data.world.farm) Player.data.world.farm.assigned = sum.farm;
            if(Player.data.world.mine) Player.data.world.mine.assigned = sum.mine;
            if(Player.data.world.alchemy) Player.data.world.alchemy.assigned = sum.alchemy;
            Player.save();
            if(document.getElementById('disciple-detail-modal')) document.getElementById('disciple-detail-modal').remove();
            this.openModal();
        }
    },

    playGachaAnimation(results) {
        const highestRarity = Math.max(...results.map(d => DATA_SECT.ROOT_LEVELS[d.root].rarity));
        let overlayColor = "rgba(0,0,0,0.85)";
        let textMsg = "靈光乍現";
        let textColor = "#3b82f6";

        if (highestRarity >= 4) { 
            overlayColor = "rgba(40, 20, 0, 0.95)";
            textMsg = highestRarity === 5 ? "仙姿佚貌" : "天驕降世";
            textColor = "#fbbf24";
        } else if (highestRarity === 3) { 
            overlayColor = "rgba(20, 0, 40, 0.9)";
            textMsg = "紫氣東來";
            textColor = "#a855f7";
        }

        const animHtml = `
            <div id="gacha-anim-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; background:${overlayColor}; z-index:20000; display:flex; flex-direction:column; justify-content:center; align-items:center; cursor:pointer;">
                <h1 style="font-size:48px; color:${textColor}; text-shadow: 0 0 20px ${textColor}; letter-spacing:10px; animation: popIn 0.5s ease-out;">${textMsg}</h1>
                <p style="color:#fff; margin-top:20px; font-weight:bold; opacity:0.7;">點擊螢幕 查看名冊</p>
            </div>
            <style>
                @keyframes popIn {
                    0% { transform: scale(0.1); opacity: 0; }
                    60% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', animHtml);
        document.getElementById('gacha-anim-layer').onclick = () => {
            document.getElementById('gacha-anim-layer').remove();
            this.openModal();
        };
    }
};

window.UI_Recruit = UI_Recruit;
