/**
 * V3.4 ui_vault.js (宗門庫房介面)
 * 職責：渲染商品列表、顯示玩家貢獻點、發送購買請求
 * 位置：/ui/ui_vault.js
 */

import { Player } from '../entities/player.js';
import { VaultSystem } from '../systems/VaultSystem.js';

export const UI_Vault = {
    isOpen: false,

    init() {
        console.log("【UI_Vault】庫房介面陣紋刻印完成。");
        window.UI_Vault = this;
    },

    openModal() {
        this.isOpen = true;
        const title = "📦 宗門庫房 (萬寶閣)";
        const contentHtml = this.renderVault();
        this.showModal(title, contentHtml);
    },

    closeModal() {
        this.isOpen = false;
        const existing = document.getElementById('vault-modal-overlay');
        if (existing) existing.remove();
    },

    showModal(title, contentHtml) {
        this.closeModal(); // 確保不會重複開啟

        const modalHtml = `
            <div id="vault-modal-overlay" class="modal-overlay" onclick="UI_Vault.closeModal()">
                <div class="modal-box" style="max-width: 380px; background:var(--glass-dark); border:1px solid #eab308; box-shadow: 0 0 15px rgba(234,179,8,0.2);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(234,179,8,0.3); padding-bottom:10px;">
                        <h3 style="color:#fde047; margin:0; font-size:18px;">${title}</h3>
                        <button class="btn-modal-close" onclick="UI_Vault.closeModal()">✕</button>
                    </div>
                    <div class="modal-body" id="vault-modal-body" style="padding: 15px 0 0 0;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    renderVault() {
        const currentPoints = Player.data.sectPoints || 0;
        const items = VaultSystem.items || [];

        let html = `
            <div style="text-align:center; margin-bottom: 15px; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
                <p style="color:#cbd5e1; font-size:13px; margin-bottom:8px;">消耗宗門貢獻點，兌換底蘊寶物與秘境信物。</p>
                <div style="color:#fcd34d; font-weight:bold; font-size:16px; padding: 5px 15px; background:rgba(251,191,36,0.15); border-radius:5px; display:inline-block; border:1px solid rgba(251,191,36,0.3);">
                    當前宗門貢獻：🌟 ${currentPoints}
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        `;

        items.forEach(item => {
            const canAfford = currentPoints >= item.cost;
            const btnBg = canAfford ? 'linear-gradient(180deg, #facc15, #eab308)' : 'rgba(255,255,255,0.1)';
            const btnColor = canAfford ? '#000' : '#94a3b8';
            const btnCursor = canAfford ? 'pointer' : 'not-allowed';
            const btnAction = canAfford ? `VaultSystem.buyItem('${item.id}')` : '';

            // 根據稀有度給予名稱顏色
            let nameColor = 'white';
            if (item.rarity === 4) nameColor = '#a855f7'; // 紫色
            if (item.rarity === 5) nameColor = '#fbbf24'; // 金色

            html += `
                <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; text-align:left; position:relative; overflow:hidden;">
                    ${item.rarity >= 5 ? '<div style="position:absolute; top:-20px; right:-20px; width:40px; height:40px; background:rgba(251,191,36,0.2); filter:blur(10px); border-radius:50%;"></div>' : ''}
                    
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; position:relative; z-index:1;">
                        <div>
                            <div style="font-size:15px; font-weight:bold; color:${nameColor}; margin-bottom:4px; text-shadow:0 0 5px rgba(255,255,255,0.2);">${item.name}</div>
                            <div style="font-size:12px; color:#94a3b8; line-height:1.4;">${item.desc}</div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; background:rgba(0,0,0,0.4); padding:8px; border-radius:5px; position:relative; z-index:1;">
                        <span style="color:#fcd34d; font-size:13px; font-weight:bold;">售價: 🌟 ${item.cost}</span>
                        <button style="border:none; border-radius:4px; padding:6px 16px; font-weight:bold; color:${btnColor}; background:${btnBg}; cursor:${btnCursor}; transition:0.2s; box-shadow: ${canAfford ? '0 2px 5px rgba(0,0,0,0.5)' : 'none'};" 
                                onclick="${btnAction}; event.stopPropagation()">
                            兌換
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    }
};

window.UI_Vault = UI_Vault;
