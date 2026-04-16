/**
 * V3.0 ui_sect.js (天驕降世 - 宗門人事重構版)
 * 職責：管理宗門介面、注入 HTML 結構、處理部門點擊、彈窗渲染與全新抽卡特效
 * 位置：/ui/ui_sect.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { SectSystem } from '../systems/SectSystem.js';
import { DATA_SECT } from '../data/data_sect.js';

export const UI_Sect = {
    // 🟢 宗門庫房專屬商品清單
    vaultItems: [
        { id: 'v_frag_1', name: '殘卷：奔雷訣(卷一)', type: 'fragment', skillName: '奔雷訣', volume: 1, cost: 200, rarity: 4, desc: '宗門不傳之秘，蘊含一絲天地雷劫之威。' },
        { id: 'v_pill_1', name: '洗髓丹', type: 'special', cost: 500, rarity: 3, desc: '伐骨洗髓，服用後似乎能讓修煉之路更加順暢。(功能開發中)' },
        { id: 'v_fruit_1', name: '造化果', type: 'special', cost: 1500, rarity: 5, desc: '奪天地造化之神物，據說能強行提升先天悟性。(功能開發中)' }
    ],

    // 1. 初始化
    init() {
        console.log("【UI_Sect】宗門大陣初始化，注入總部場景...");
        
        this.renderLayout();

        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1, lastCollect: Date.now(),
                workers: 0, farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 }
            };
        }
        if(Player.data && Player.data.sectPoints === undefined) {
            Player.data.sectPoints = 0; 
        }
        
        // 確保 SectSystem 也初始化
        if(SectSystem) SectSystem.init();
    },

    renderLayout() {
        const container = document.getElementById('page-sect');
        if (!container) return;

        container.innerHTML = `
            <div class="sect-header">
                <h2 class="sect-title">青雲宗門總部</h2>
                <div class="sect-subtitle">人界 · 某不知名小世界</div>
            </div>
            
            <div class="sect-hub-grid">
                <div class="dept-card" onclick="UI_Sect.openDept('herb')">
                    <div class="dept-icon">🌿</div>
                    <div class="dept-name">草藥部</div>
                </div>
                <div class="dept-card" onclick="UI_Sect.openDept('iron')">
                    <div class="dept-icon">⛏️</div>
                    <div class="dept-name">鐵礦部</div>
                </div>
                <div class="dept-card" onclick="UI_Sect.openDept('recruit')">
                    <div class="dept-icon">👥</div>
                    <div class="dept-name">招募堂</div>
                </div>
                <div class="dept-card" onclick="UI_Sect.openDept('bounty')">
                    <div class="dept-icon">📜</div>
                    <div class="dept-name">懸賞堂</div>
                </div>
                <div class="dept-card" onclick="UI_Sect.openDept('vault')">
                    <div class="dept-icon">📦</div>
                    <div class="dept-name">宗門庫房</div>
                </div>
                <div class="dept-card" onclick="Core.switchPage('world')">
                    <div class="dept-icon">☯️</div>
                    <div class="dept-name">聚靈大陣</div>
                </div>
            </div>
        `;
    },

    openDept(deptId) {
        if (Player.data && !Player.data.world) {
            this.init();
        }
        
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
                title = "👥 人事招募堂";
                contentHtml = this.renderRecruit();
                break;
            case 'bounty':
                title = "📜 懸賞堂";
                contentHtml = this.renderBounty();
                break;
            case 'vault':
                title = "📦 宗門庫房";
                contentHtml = this.renderVault();
                break;
        }

        this.showModal(title, contentHtml);
    },

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
    // 仙草與靈礦 (同步新版弟子數據)
    // ==========================================
    renderHerb() {
        const wData = Player.data.world;
        const summary = SectSystem.getSummary();
        const farmYield = summary.farm * (wData.farm.level || 1) * 2; // 基礎產能預覽

        return `
            <div style="text-align:center;">
                <p style="color:#cbd5e1; margin-bottom:10px; font-size:14px;">種植靈草，定期產出煉丹素材。</p>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                    <p style="margin:5px 0;">當前等級：<b>Lv.${wData.farm.level}</b></p>
                    <p style="margin:5px 0;">預期產出：<b style="color:#4ade80;">${farmYield} 素材</b> / 10分鐘</p>
                </div>
                ${wData.farm.level > 0 ? `
                    <div style="margin-bottom:15px;">
                        <span style="font-size:16px; font-weight:bold; color:white;">目前派遣弟子: <span style="color:#4ade80;">${summary.farm}</span> 名</span>
                    </div>
                    <button class="btn-eco-action" style="width:100%; padding:12px;" onclick="document.getElementById('sect-modal-overlay').remove(); UI_Sect.openDept('recruit');">
                        前往招募堂指派弟子
                    </button>
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
        const summary = SectSystem.getSummary();
        const mineYield = summary.mine * (wData.mine.level || 1) * 5;

        return `
            <div style="text-align:center;">
                <p style="color:#cbd5e1; margin-bottom:10px; font-size:14px;">開採礦脈，持續為宗門提供靈石。</p>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                    <p style="margin:5px 0;">當前等級：<b>Lv.${wData.mine.level}</b></p>
                    <p style="margin:5px 0;">預期產出：<b style="color:#fbbf24;">${mineYield} 靈石</b> / 分鐘</p>
                </div>
                ${wData.mine.level > 0 ? `
                    <div style="margin-bottom:15px;">
                        <span style="font-size:16px; font-weight:bold; color:white;">目前派遣弟子: <span style="color:#fbbf24;">${summary.mine}</span> 名</span>
                    </div>
                    <button class="btn-eco-action" style="width:100%; padding:12px;" onclick="document.getElementById('sect-modal-overlay').remove(); UI_Sect.openDept('recruit');">
                        前往招募堂指派弟子
                    </button>
                ` : `
                    <button class="btn-eco-action btn-buy" style="width:100%; padding:12px;" onclick="UI_Sect.buildIndustry('mine'); event.stopPropagation()">
                        花費 2000 靈石 開闢靈礦脈
                    </button>
                `}
            </div>
        `;
    },

    // ==========================================
    // 🌟 V3.0 全新招募堂介面
    // ==========================================
    renderRecruit() {
        const summary = SectSystem.getSummary();
        const max = SectSystem.MAX_DISCIPLES;
        const list = Player.data.sect.disciples || [];

        let html = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.3); padding:10px 15px; border-radius:8px; margin-bottom:15px;">
                    <div><span style="font-size:12px; color:#94a3b8;">總人數</span><br><b style="font-size:18px;">${summary.total}/${max}</b></div>
                    <div><span style="font-size:12px; color:#94a3b8;">閒置</span><br><b style="font-size:18px; color:#94a3b8;">${summary.idle}</b></div>
                    <div><span style="font-size:12px; color:#94a3b8;">仙草</span><br><b style="font-size:18px; color:#4ade80;">${summary.farm}</b></div>
                    <div><span style="font-size:12px; color:#94a3b8;">靈礦</span><br><b style="font-size:18px; color:#fbbf24;">${summary.mine}</b></div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-eco-action" style="flex:1; padding:10px; background:var(--glass-dark); border:1px solid #3b82f6;" onclick="UI_Sect.doRecruit(false)">
                        💰 1,000<br>尋覓單人
                    </button>
                    <button class="btn-eco-action" style="flex:1; padding:10px; background:var(--glass-dark); border:1px solid #a855f7;" onclick="UI_Sect.doRecruit(true)">
                        💰 10,000<br><span style="color:#a855f7;">十連保底</span>
                    </button>
                </div>
            </div>
            
            <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                <p style="font-size:13px; color:#cbd5e1; margin-bottom:10px;">弟子名冊</p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:300px; overflow-y:auto; padding-right:5px;">
        `;

        if (list.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#64748b;">宗門空虛，尚無弟子。</div>`;
        } else {
            // 反轉陣列，讓新抽到的排在前面
            [...list].reverse().forEach(d => {
                const rootData = DATA_SECT.ROOT_LEVELS[d.root];
                let statusText = d.status === 'farm' ? '<span style="color:#4ade80;">[草園]</span>' : (d.status === 'mine' ? '<span style="color:#fbbf24;">[礦脈]</span>' : '<span style="color:#94a3b8;">[閒置]</span>');
                
                html += `
                    <div style="background:rgba(0,0,0,0.5); border-left:4px solid ${rootData.color}; border-radius:6px; padding:8px; cursor:pointer; display:flex; flex-direction:column; justify-content:center;"
                         onclick="UI_Sect.showDiscipleDetail('${d.id}')">
                        <div style="font-size:14px; font-weight:bold; color:white; margin-bottom:4px;">${d.name}</div>
                        <div style="font-size:12px; display:flex; justify-content:space-between;">
                            <span style="color:${rootData.color};">${rootData.label.split('/')[0]}</span>
                            ${statusText}
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        return html;
    },

    // ==========================================
    // 🌟 V3.0 弟子詳細面板 (指派與遣散)
    // ==========================================
    showDiscipleDetail(id) {
        const d = Player.data.sect.disciples.find(x => x.id === id);
        if (!d) return;

        const rootData = DATA_SECT.ROOT_LEVELS[d.root];
        
        let traitsHtml = d.traits.map(tKey => {
            let tData = DATA_SECT.TRAITS[tKey];
            let tColor = tData.type === 'buff' ? '#4ade80' : (tData.type === 'debuff' ? '#ef4444' : (tData.type === 'magic' ? '#c084fc' : '#fcd34d'));
            return `<div style="background:rgba(255,255,255,0.05); padding:6px; border-radius:4px; margin-bottom:5px;">
                        <span style="color:${tColor}; font-weight:bold; font-size:13px;">[${tKey}]</span> 
                        <span style="font-size:12px; color:#cbd5e1;">${tData.desc}</span>
                    </div>`;
        }).join('');

        let statsHtml = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:13px; margin:10px 0; background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">
                <div>⚔️ 戰力: <b style="color:white;">${d.stats['戰力']}</b></div>
                <div>🧠 悟性: <b style="color:white;">${d.stats['悟性']}</b></div>
                <div>✨ 機緣: <b style="color:white;">${d.stats['機緣']}</b></div>
                <div>❤️ 體質: <b style="color:white;">${d.stats['體質']}</b></div>
                <div>🧘 修為: <b style="color:white;">${d.stats['修為']}</b></div>
                <div>🔨 匠心: <b style="color:white;">${d.stats['匠心']}</b></div>
            </div>
        `;

        let modalHtml = `
            <div id="disciple-detail-modal" class="modal-overlay" style="z-index:10001;" onclick="this.remove()">
                <div class="modal-box" style="max-width: 300px; background:#1e293b; border:2px solid ${rootData.color};" onclick="event.stopPropagation()">
                    <div style="text-align:center; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:20px; font-weight:bold; color:white;">${d.name}</div>
                        <div style="font-size:14px; color:${rootData.color}; margin-top:5px;">${rootData.label}</div>
                    </div>
                    
                    ${statsHtml}
                    
                    <div style="margin-bottom:15px; max-height:100px; overflow-y:auto;">
                        <div style="font-size:12px; color:#94a3b8; margin-bottom:5px;">本命詞條</div>
                        ${traitsHtml}
                    </div>

                    <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                        <div style="font-size:12px; color:#94a3b8; margin-bottom:5px;">指派任務</div>
                        <div style="display:flex; gap:5px; margin-bottom:10px;">
                            <button style="flex:1; padding:8px; border-radius:5px; border:none; background:${d.status==='idle'?'#94a3b8':'#334155'}; color:white;" onclick="UI_Sect.assignDiscipleJob('${d.id}', 'idle')">閒置</button>
                            <button style="flex:1; padding:8px; border-radius:5px; border:none; background:${d.status==='farm'?'#4ade80':'#334155'}; color:white;" onclick="UI_Sect.assignDiscipleJob('${d.id}', 'farm')">仙草</button>
                            <button style="flex:1; padding:8px; border-radius:5px; border:none; background:${d.status==='mine'?'#fbbf24':'#334155'}; color:white;" onclick="UI_Sect.assignDiscipleJob('${d.id}', 'mine')">靈礦</button>
                        </div>
                        <button style="width:100%; padding:8px; border-radius:5px; border:1px solid #ef4444; background:transparent; color:#ef4444; font-weight:bold;" onclick="UI_Sect.doDismiss('${d.id}')">
                            逐出宗門 (遣散)
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // ==========================================
    // 🌟 V3.0 動作與特效邏輯
    // ==========================================
    doRecruit(isTen) {
        let results = SectSystem.recruit(isTen);
        if (results && results.length > 0) {
            this.playGachaAnimation(results);
        }
    },

    assignDiscipleJob(id, job) {
        SectSystem.assignJob(id, job);
        
        // 🟢 兼容補丁：同步更新舊版 world.workers 數量，確保背景經濟循環不斷
        let sum = SectSystem.getSummary();
        Player.data.world.farm.assigned = sum.farm;
        Player.data.world.mine.assigned = sum.mine;
        Player.save();

        document.getElementById('disciple-detail-modal').remove();
        this.openDept('recruit'); // 刷新列表
    },

    doDismiss(id) {
        if (confirm("確定要將此弟子逐出宗門嗎？此舉不可逆！")) {
            SectSystem.dismissDisciple(id);
            
            // 🟢 同步舊版數量
            let sum = SectSystem.getSummary();
            Player.data.world.farm.assigned = sum.farm;
            Player.data.world.mine.assigned = sum.mine;
            Player.save();

            document.getElementById('disciple-detail-modal').remove();
            this.openDept('recruit');
        }
    },

    /**
     * 🌟 天驕降世特效大陣
     */
    playGachaAnimation(results) {
        // 找出這次抽卡中最高的稀有度
        const highestRarity = Math.max(...results.map(d => DATA_SECT.ROOT_LEVELS[d.root].rarity));
        
        let overlayColor = "rgba(255,255,255,0.8)";
        let textMsg = "靈光乍現";
        let textColor = "#3b82f6";

        if (highestRarity >= 4) { // 天級或仙級
            overlayColor = "rgba(251,191,36, 0.95)";
            textMsg = highestRarity === 5 ? "仙姿佚貌" : "天驕降世";
            textColor = "#fff";
        } else if (highestRarity === 3) { // 地級
            overlayColor = "rgba(168,85,247, 0.9)";
            textMsg = "紫氣東來";
            textColor = "#fff";
        }

        const animHtml = `
            <div id="gacha-anim-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; background:${overlayColor}; z-index:20000; display:flex; flex-direction:column; justify-content:center; align-items:center; transition: opacity 0.3s;">
                <h1 style="font-size:48px; color:${textColor}; text-shadow: 0 0 20px rgba(0,0,0,0.5); letter-spacing:10px; animation: popIn 0.5s ease-out;">${textMsg}</h1>
                <p style="color:#333; margin-top:20px; font-weight:bold;">點擊螢幕查看結果</p>
            </div>
            <style>
                @keyframes popIn {
                    0% { transform: scale(0.1); opacity: 0; }
                    60% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', animHtml);

        // 點擊後關閉動畫，並刷新介面
        document.getElementById('gacha-anim-layer').onclick = () => {
            document.getElementById('gacha-anim-layer').remove();
            UI_Sect.openDept('recruit');
        };
    },

    // ==========================================
    // 舊版功能保留區
    // ==========================================
    renderBounty() {
        if (!Player.data.tasks || Player.data.tasks.length === 0) {
            return `<div class="empty-msg" style="padding:40px 10px;">長老正在整理任務卷宗，請稍後再來。</div>`;
        }
        const currentPoints = Player.data.sectPoints || 0;
        let html = `
            <div style="text-align:center; margin-bottom: 15px;">
                <p style="color:#cbd5e1; font-size:13px; margin-bottom:5px;">提交修仙界素材，換取宗門底蘊。</p>
                <div style="color:#fcd34d; font-weight:bold; font-size:15px; padding: 5px; background:rgba(251,191,36,0.1); border-radius:5px; display:inline-block;">
                    當前貢獻：🌟 ${currentPoints} 點
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        `;
        Player.data.tasks.forEach(task => {
            const itemIndex = Player.data.inventory.findIndex(i => i.id === task.targetId || i.name === task.targetName);
            const currentCount = itemIndex !== -1 ? (Player.data.inventory[itemIndex].count || 1) : 0;
            const isEnough = currentCount >= task.count;
            const countColor = isEnough ? '#4ade80' : '#ef4444';
            const btnBg = isEnough ? 'var(--exp-color)' : 'rgba(255,255,255,0.1)';
            const btnCursor = isEnough ? 'pointer' : 'not-allowed';
            const btnAction = isEnough ? `TaskSystem.submitTask('${task.uuid}')` : '';

            html += `
                <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; text-align:left;">
                    <div style="font-size:12px; color:#94a3b8; margin-bottom:8px; line-height:1.4;">${task.desc}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:rgba(255,255,255,0.05); padding:6px; border-radius:5px;">
                        <span style="font-size:14px; font-weight:bold; color:white;">📦 ${task.targetName}</span>
                        <span style="font-size:13px; font-weight:bold; color:${countColor};">${currentCount} / ${task.count}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#fcd34d; font-size:13px; font-weight:bold;">獎勵: 🌟 ${task.reward}</span>
                        <button style="border:none; border-radius:6px; padding:8px 16px; font-weight:bold; color:white; background:${btnBg}; cursor:${btnCursor}; transition:0.2s;" 
                                onclick="${btnAction}; event.stopPropagation()">
                            交付
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    },

    renderVault() {
        const currentPoints = Player.data.sectPoints || 0;
        let html = `
            <div style="text-align:center; margin-bottom: 15px;">
                <p style="color:#cbd5e1; font-size:13px; margin-bottom:5px;">消耗貢獻點，兌換宗門底蘊寶物。</p>
                <div style="color:#fcd34d; font-weight:bold; font-size:15px; padding: 5px; background:rgba(251,191,36,0.1); border-radius:5px; display:inline-block;">
                    當前貢獻：🌟 ${currentPoints} 點
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        `;
        this.vaultItems.forEach(item => {
            const canAfford = currentPoints >= item.cost;
            const btnBg = canAfford ? 'var(--hp-color)' : 'rgba(255,255,255,0.1)';
            const btnCursor = canAfford ? 'pointer' : 'not-allowed';
            const btnAction = canAfford ? `UI_Sect.buyVaultItem('${item.id}')` : '';

            html += `
                <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                            <div style="font-size:15px; font-weight:bold; color:white; margin-bottom:4px;">${item.name}</div>
                            <div style="font-size:12px; color:#94a3b8; line-height:1.4;">${item.desc}</div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; background:rgba(255,255,255,0.05); padding:8px; border-radius:5px;">
                        <span style="color:#fcd34d; font-size:13px; font-weight:bold;">售價: 🌟 ${item.cost}</span>
                        <button style="border:none; border-radius:6px; padding:6px 16px; font-weight:bold; color:white; background:${btnBg}; cursor:${btnCursor}; transition:0.2s;" 
                                onclick="${btnAction}; event.stopPropagation()">
                            兌換
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    },

    buildIndustry(type) {
        const cost = type === 'mine' ? 2000 : 1000;
        const name = type === 'mine' ? '靈礦脈' : '仙草園';

        if ((Player.data.coin !== undefined ? Player.data.coin : Player.data.coins) < cost) {
            return Msg.log(`開闢【${name}】需要 ${cost} 靈石！`, "system");
        }

        if (Player.data.coin !== undefined) Player.data.coin -= cost;
        else Player.data.coins -= cost;

        Player.data.world[type].level = 1;
        Player.save();
        Msg.log(`轟隆！天地靈氣匯聚，成功開闢【${name}】！`, "gold");
        
        this.openDept(type); 
        if(window.Core) window.Core.updateUI();
    },

    buyVaultItem(itemId) {
        const item = this.vaultItems.find(i => i.id === itemId);
        if (!item) return;

        if ((Player.data.sectPoints || 0) < item.cost) {
            return Msg.log(`貢獻點不足，無法兌換【${item.name}】！`, "system");
        }

        const newItem = {
            id: item.id,
            uuid: `v_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: item.name,
            type: item.type,
            desc: item.desc,
            rarity: item.rarity || 3
        };
        
        if (item.type === 'fragment') {
            newItem.skillName = item.skillName;
            newItem.volume = item.volume;
        }

        if (Player.addItem(newItem)) {
            Player.data.sectPoints -= item.cost;
            Player.save();
            Msg.log(`🎁 消耗 ${item.cost} 點貢獻，成功兌換【${item.name}】！`, "gold");
            this.openDept('vault'); 
            if (window.Core) window.Core.updateUI();
        }
    }
};

window.UI_Sect = UI_Sect;
