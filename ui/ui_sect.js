/**
 * V3.0 ui_sect.js (終極樞紐瘦身版 - 完美防護)
 * 職責：管理宗門首頁六大入口，並負責將點擊分配給對應的專屬 UI 模組
 * 位置：/ui/ui_sect.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { SectSystem } from '../systems/SectSystem.js';
import { UI_Recruit } from './ui_recruit.js'; // 🟢 引入招募專屬 UI
import { UI_Farm } from './ui_farm.js';       // 🟢 引入仙草園專屬 UI

export const UI_Sect = {
    // 宗門庫房專屬商品清單
    vaultItems: [
        { id: 'v_frag_1', name: '殘卷：奔雷訣(卷一)', type: 'fragment', skillName: '奔雷訣', volume: 1, cost: 200, rarity: 4, desc: '宗門不傳之秘，蘊含一絲天地雷劫之威。' },
        { id: 'v_pill_1', name: '洗髓丹', type: 'special', cost: 500, rarity: 3, desc: '伐骨洗髓，服用後似乎能讓修煉之路更加順暢。(功能開發中)' },
        { id: 'v_fruit_1', name: '造化果', type: 'special', cost: 1500, rarity: 5, desc: '奪天地造化之神物，據說能强行提升先天悟性。(功能開發中)' }
    ],

    init() {
        console.log("【UI_Sect】宗門總樞紐初始化...");
        this.renderLayout();
        this.ensureDataState(); // 獨立抽出的數據防護
        
        if(SectSystem && typeof SectSystem.init === 'function') {
            SectSystem.init();
        }
    },

    /**
     * 🟢 新增：獨立的數據狀態防護，避免重複渲染畫面
     */
    ensureDataState() {
        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1, lastCollect: Date.now(),
                workers: 0, farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 }
            };
        }
        if(Player.data && Player.data.sectPoints === undefined) {
            Player.data.sectPoints = 0; 
        }
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

    /**
     * 🌟 路由核心：分配任務給各堂口
     */
    openDept(deptId) {
        // 確保點擊前數據是存在的，且不觸發畫面重繪
        this.ensureDataState();

        // 🟢 徹底放權：如果是招募堂，呼叫外部模組並中斷
        if (deptId === 'recruit') {
            if (UI_Recruit) {
                UI_Recruit.openModal();
            } else if (window.UI_Recruit) {
                window.UI_Recruit.openModal();
            } else {
                Msg.log("❌ 招募堂大陣尚未準備完畢，請稍後再試！", "system");
            }
            return;
        }

        // 🟢 徹底放權：如果是仙草園，呼叫外部模組並中斷
        if (deptId === 'herb') {
            if (UI_Farm) {
                UI_Farm.openModal();
            } else if (window.UI_Farm) {
                window.UI_Farm.openModal();
            } else {
                Msg.log("❌ 仙草園大陣尚未準備完畢，請稍後再試！", "system");
            }
            return;
        }
        
        let title = "";
        let contentHtml = "";

        switch(deptId) {
            case 'iron':
                title = "⛏️ 鐵礦部 (靈礦脈)";
                contentHtml = this.renderIron();
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
    // 未分家的舊部門 (等未來 V4.0 再分)
    // ==========================================
    
    renderIron() {
        const wData = Player.data.world;
        const summary = SectSystem.getSummary();
        const mineYield = summary.mine * (wData.mine.level || 1) * 5;

        return `
            <div style="text-align:center;">
                <p style="color:#cbd5e1; margin-bottom:10px; font-size:14px;">開採礦脈，由指派的弟子提供產能。</p>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                    <p style="margin:5px 0;">當前等級：<b>Lv.${wData.mine.level}</b></p>
                    <p style="margin:5px 0;">預期產出：<b style="color:#fbbf24;">${mineYield} 靈石</b> / 分鐘</p>
                </div>
                ${wData.mine.level > 0 ? `
                    <div style="margin-bottom:15px;">
                        <span style="font-size:16px; font-weight:bold; color:white;">目前派遣弟子: <span style="color:#fbbf24;">${summary.mine}</span> 名</span>
                    </div>
                    <button class="btn-eco-action" style="width:100%; padding:12px; font-weight:bold;" onclick="document.getElementById('sect-modal-overlay').remove(); UI_Sect.openDept('recruit');">
                        前往【招募堂】指派工作
                    </button>
                ` : `
                    <button class="btn-eco-action btn-buy" style="width:100%; padding:12px;" onclick="UI_Sect.buildIndustry('mine'); event.stopPropagation()">
                        花費 2000 靈石 開闢靈礦脈
                    </button>
                `}
            </div>
        `;
    },

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
