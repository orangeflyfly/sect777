/**
 * V3.5 ui_sect.js (終極樞紐 - 全設施解耦完美路由版)
 * 職責：管理宗門首頁七大入口，並負責將點擊分配給對應的專屬 UI 模組
 * 位置：/ui/ui_sect.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { SectSystem } from '../systems/SectSystem.js';
import { UI_Recruit } from './ui_recruit.js'; 
import { UI_Farm } from './ui_farm.js';       
import { UI_Mine } from './ui_mine.js';       
import { UI_Alchemy } from './ui_alchemy.js'; 
import { UI_Bounty } from './ui_bounty.js';   
import { UI_Vault } from './ui_vault.js';     // 🌟 新增：正式引入庫房專屬 UI

export const UI_Sect = {
    init() {
        console.log("【UI_Sect】宗門總樞紐初始化，全產業大陣已連接...");
        this.renderLayout();
        this.ensureDataState(); 
        
        if(SectSystem && typeof SectSystem.init === 'function') {
            SectSystem.init();
        }
    },

    ensureDataState() {
        if (Player.data && !Player.data.world) {
            Player.data.world = {
                arrayLevel: 1, lastCollect: Date.now(),
                workers: 0, farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 }, alchemy: { level: 0, assigned: 0 }
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
                <div class="dept-card" onclick="UI_Sect.openDept('alchemy')">
                    <div class="dept-icon">🔥</div>
                    <div class="dept-name">煉丹閣</div>
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
     * 🌟 路由核心：徹底放權，將所有產業點擊導向專屬 UI 模組
     */
    openDept(deptId) {
        this.ensureDataState();

        if (deptId === 'recruit') {
            if (UI_Recruit) UI_Recruit.openModal();
            else if (window.UI_Recruit) window.UI_Recruit.openModal();
            else Msg.log("❌ 招募堂大陣尚未準備完畢，請稍後再試！", "system");
            return;
        }

        if (deptId === 'herb') {
            if (UI_Farm) UI_Farm.openModal();
            else if (window.UI_Farm) window.UI_Farm.openModal();
            else Msg.log("❌ 仙草園大陣尚未準備完畢，請稍後再試！", "system");
            return;
        }

        if (deptId === 'iron') {
            if (UI_Mine) UI_Mine.openModal();
            else if (window.UI_Mine) window.UI_Mine.openModal();
            else Msg.log("❌ 靈礦脈大陣尚未準備完畢，請稍後再試！", "system");
            return;
        }

        if (deptId === 'alchemy') {
            if (UI_Alchemy) UI_Alchemy.openModal();
            else if (window.UI_Alchemy) window.UI_Alchemy.openModal();
            else Msg.log("❌ 煉丹閣大陣尚未準備完畢，請稍後再試！", "system");
            return;
        }

        if (deptId === 'bounty') {
            if (UI_Bounty) UI_Bounty.openModal();
            else if (window.UI_Bounty) window.UI_Bounty.openModal();
            else Msg.log("❌ 懸賞堂大陣尚未準備完畢，請稍後再試！", "system");
            return;
        }

        // 🌟 新增：將宗門庫房完美轉交給 UI_Vault
        if (deptId === 'vault') {
            if (UI_Vault) UI_Vault.openModal();
            else if (window.UI_Vault) window.UI_Vault.openModal();
            else Msg.log("❌ 宗門庫房大陣尚未準備完畢，請稍後再試！", "system");
            return;
        }
    }
};

window.UI_Sect = UI_Sect;
