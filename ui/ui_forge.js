/**
 * V3.5.6 ui_forge.js (煉器大殿面板 - 儲物空間修復版)
 * 職責：顯示鍛造、強化分頁，保底進度條
 * 修正：強化分頁正確讀取 Player.data.equipments 陣列
 * 位置：/ui/ui_forge.js
 */

import { Player } from '../entities/player.js';
import { ForgeSystem } from '../systems/ForgeSystem.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Forge = {
    tab: 'create', // 'create' or 'enhance'
    selectedItemUuid: null,

    init() {
        console.log("【UI_Forge】煉器大殿介面刻印完成。");
        window.UI_Forge = this;
    },

    openModal() {
        const title = "🔨 煉器大殿";
        this.showModal(title, this.renderLayout());
    },

    showModal(title, contentHtml) {
        const existing = document.getElementById('forge-modal-overlay');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="forge-modal-overlay" class="modal-overlay" style="z-index:10007;" onclick="this.remove()">
                <div class="modal-box" style="max-width: 400px; background:var(--glass-dark); border:1px solid #fb923c;" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(251,146,60,0.3); padding-bottom:10px;">
                        <h3 style="color:#fb923c; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('forge-modal-overlay').remove()">✕</button>
                    </div>
                    <div style="display:flex; margin-top:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <button style="flex:1; padding:10px; background:none; border:none; color:${this.tab==='create'?'#fb923c':'#94a3b8'}; border-bottom:2px solid ${this.tab==='create'?'#fb923c':'transparent'}; cursor:pointer; font-weight:bold;" onclick="UI_Forge.switchTab('create')">神兵鍛造</button>
                        <button style="flex:1; padding:10px; background:none; border:none; color:${this.tab==='enhance'?'#fb923c':'#94a3b8'}; border-bottom:2px solid ${this.tab==='enhance'?'#fb923c':'transparent'}; cursor:pointer; font-weight:bold;" onclick="UI_Forge.switchTab('enhance')">法寶強化</button>
                    </div>
                    <div class="modal-body" id="forge-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    switchTab(t) {
        this.tab = t;
        this.selectedItemUuid = null; // 切換分頁時清空選擇
        this.openModal();
    },

    renderLayout() {
        if (this.tab === 'create') return this.renderCreate();
        return this.renderEnhance();
    },

    renderCreate() {
        const d = Player.data;
        const pity = d.forge ? d.forge.pityCount : 0;
        const ore = (d.materials && d.materials.ore) ? d.materials.ore : 0;

        return `
            <div style="text-align:center;">
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                    <div style="font-size:12px; color:#94a3b8; margin-bottom:5px;">當前玄鐵存量</div>
                    <div style="font-size:24px; color:#fbbf24; font-weight:bold;">⛏️ ${ore.toLocaleString()}</div>
                </div>

                <div style="margin-bottom:20px; padding:0 10px;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#fb923c; margin-bottom:5px;">
                        <span>千錘百鍊度</span>
                        <span>${pity} / 100</span>
                    </div>
                    <div style="width:100%; height:10px; background:rgba(0,0,0,0.5); border-radius:5px; overflow:hidden; border:1px solid #fb923c33;">
                        <div style="width:${pity}%; height:100%; background:linear-gradient(90deg, #f97316, #fb923c); box-shadow: 0 0 10px #f97316;"></div>
                    </div>
                    <p style="font-size:10px; color:#64748b; margin-top:5px;">滿100次後，下一次開爐必現「神級」兵刃。</p>
                </div>

                <button onclick="UI_Forge.doForgeAction()" style="width:100%; padding:15px; background:linear-gradient(180deg, #fb923c, #ea580c); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; box-shadow: 0 4px 10px rgba(234,88,12,0.3);">
                    🔥 開爐鍛造 (消耗 50 玄鐵)
                </button>
            </div>
        `;
    },

    renderEnhance() {
        // 🌟 修正：正確讀取 Player.data.equipments 陣列
        const gears = Player.data.equipments || [];
        
        let html = `<div style="padding:0 5px;">`;
        html += `<p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">選擇要強化的法寶 (+8以上有毀損風險)：</p>`;
        html += `<div style="max-height: 250px; overflow-y: auto; padding-right: 5px;">`;
        
        if (gears.length === 0) {
            html += `<div style="text-align:center; padding:30px; color:#475569;">儲物袋內尚無任何法寶</div>`;
        } else {
            // 反轉陣列，讓新打到的裝備在最上面
            [...gears].reverse().forEach(item => {
                const isSelected = this.selectedItemUuid === item.uuid;
                const rarityColors = ['#fff', '#4ade80', '#60a5fa', '#a855f7', '#fbbf24'];
                const color = rarityColors[item.rarity-1] || '#fff';

                html += `
                    <div onclick="UI_Forge.selectItem('${item.uuid}')" style="background:${isSelected?'#fb923c22':'rgba(255,255,255,0.05)'}; border:1px solid ${isSelected?'#fb923c':'rgba(255,255,255,0.1)'}; border-radius:6px; padding:10px; margin-bottom:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="color:${color}; font-weight:bold;">${item.name} <span style="color:#fbbf24;">+${item.plus}</span></div>
                            <div style="font-size:11px; color:#64748b;">攻擊:${item.stats.atk} | 防禦:${item.stats.def}</div>
                        </div>
                        ${isSelected ? '<span style="color:#fb923c; font-size:18px;">🎯</span>' : ''}
                    </div>
                `;
            });
        }
        html += `</div>`; // 結束滾動區域

        if (this.selectedItemUuid) {
            const selectedGear = gears.find(i => i.uuid === this.selectedItemUuid);
            if (selectedGear && selectedGear.plus < 10) {
                const cost = (selectedGear.plus + 1) * 1000;
                html += `
                    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:15px; padding-top:15px; text-align:center;">
                        <button onclick="UI_Forge.doEnhanceAction()" style="width:100%; padding:12px; background:linear-gradient(180deg, #fb923c, #ea580c); color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
                            ⚡ 消耗 ${cost.toLocaleString()} 靈石強化
                        </button>
                    </div>
                `;
            } else if (selectedGear && selectedGear.plus >= 10) {
                html += `
                    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:15px; padding-top:15px; text-align:center; color:#fbbf24; font-weight:bold;">
                        此法寶已達強化極限 (登峰造極)
                    </div>
                `;
            }
        }

        html += `</div>`;
        return html;
    },

    selectItem(uuid) {
        this.selectedItemUuid = uuid;
        this.openModal();
    },

    doForgeAction() {
        const result = ForgeSystem.doForge();
        if (result && result.item) {
            if (result.isDivine) {
                this.playDivineEffect(result.item.name);
            } else {
                Msg.log(`🔨 鍛造完成，獲得：【${result.item.name}】`, "system");
            }
            this.openModal();
        }
    },

    doEnhanceAction() {
        if (!this.selectedItemUuid) return;
        const res = ForgeSystem.doEnhance(this.selectedItemUuid);
        if (res.success) {
            Msg.log(`✨ 強化成功！裝備升級至 +${res.level}`, "reward");
        } else {
            Msg.log(res.msg, res.result === 'broken' ? 'monster-atk' : 'system');
            if (res.result === 'broken') this.selectedItemUuid = null; // 碎了就清空選擇
        }
        this.openModal();
    },

    playDivineEffect(name) {
        const fxHtml = `
            <div id="divine-fx">
                <div class="divine-rays"></div>
                <div class="divine-title">🌅 萬丈金光 🌅</div>
                <h1 class="divine-weapon-name">【${name}】</h1>
                <p class="divine-desc">神兵降世，天下共鳴！</p>
                <button class="divine-btn" onclick="document.getElementById('divine-fx').remove()">收納入庫</button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', fxHtml);
    }
};

window.UI_Forge = UI_Forge;
