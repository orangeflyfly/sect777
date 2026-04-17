/**
 * V3.5.2 ui_vault.js (宗門庫房 - 精緻多寶格版)
 * 職責：渲染商品列表、顯示玩家貢獻點、發送購買請求
 * 修正：採用雙列 Grid 佈局解決介面擁擠問題，優化視覺層級
 * 位置：/ui/ui_vault.js
 */

import { Player } from '../entities/player.js';
import { VaultSystem } from '../systems/VaultSystem.js';

export const UI_Vault = {
    isOpen: false,

    init() {
        console.log("【UI_Vault】庫房介面陣紋校準完畢，多寶格佈局已啟動。");
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
            <div id="vault-modal-overlay" class="modal-overlay" style="z-index:10006;" onclick="UI_Vault.closeModal()">
                <div class="modal-box" style="max-width: 420px; width: 90%; background:var(--glass-dark); border:1px solid #eab308; box-shadow: 0 0 30px rgba(0,0,0,0.5);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="border-bottom:1px solid rgba(234,179,8,0.3); padding-bottom:10px;">
                        <h3 style="color:#fde047; margin:0; font-size:18px; letter-spacing:2px;">${title}</h3>
                        <button class="btn-modal-close" onclick="UI_Vault.closeModal()">✕</button>
                    </div>
                    <div class="modal-body" id="vault-modal-body" style="padding: 12px 0 0 0;">
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

        // 🌟 頂部貢獻點顯示優化：更精簡
        let html = `
            <div style="text-align:center; margin-bottom: 12px; background:rgba(251,191,36,0.05); padding:8px; border-radius:8px; border:1px dashed rgba(231,179,8,0.2);">
                <span style="color:#94a3b8; font-size:12px;">當前宗門貢獻：</span>
                <b style="color:#fcd34d; font-size:18px; text-shadow:0 0 10px rgba(251,191,36,0.4);">🌟 ${currentPoints.toLocaleString()}</b>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; max-height: 420px; overflow-y: auto; padding-right: 5px;">
        `;

        items.forEach(item => {
            const canAfford = currentPoints >= item.cost;
            const btnBg = canAfford ? 'linear-gradient(180deg, #facc15, #eab308)' : '#334155';
            const btnColor = canAfford ? '#000' : '#64748b';
            const btnCursor = canAfford ? 'pointer' : 'not-allowed';
            const btnAction = canAfford ? `VaultSystem.buyItem('${item.id}')` : '';

            // 根據稀有度給予名稱顏色與發光效果
            let rarityShadow = 'none';
            let nameColor = '#fff';
            if (item.rarity === 4) { nameColor = '#c084fc'; rarityShadow = '0 0 8px rgba(192,132,252,0.3)'; }
            if (item.rarity === 5) { nameColor = '#fbbf24'; rarityShadow = '0 0 12px rgba(251,191,36,0.4)'; }

            html += `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: ${rarityShadow};">
                    <div>
                        <div style="font-size:14px; font-weight:bold; color:${nameColor}; margin-bottom:4px; line-height:1.2;">${item.name}</div>
                        <div style="font-size:11px; color:#94a3b8; line-height:1.3; margin-bottom:8px; min-height:28px;">${item.desc}</div>
                    </div>
                    
                    <div style="border-top:1px solid rgba(255,255,255,0.05); pt:8px; margin-top:5px;">
                        <div style="text-align:center; margin-bottom:6px;">
                            <span style="color:#fcd34d; font-size:12px; font-weight:bold;">🌟 ${item.cost}</span>
                        </div>
                        <button style="width:100%; border:none; border-radius:4px; padding:6px 0; font-weight:bold; font-size:12px; color:${btnColor}; background:${btnBg}; cursor:${btnCursor}; transition:0.2s;" 
                                onclick="${btnAction}; event.stopPropagation()">
                            ${canAfford ? '兌換' : '貢獻不足'}
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
