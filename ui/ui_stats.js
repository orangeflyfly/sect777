/**
 * V2.9 ui_stats.js (淨化歸位版)
 * 職責：管理修為介面、數據渲染、裝備卸載、對接存檔與兵解。
 * 修改：兵解下移、內連樣式清理、徹底防禦 undefined。
 */

import { Player } from '../entities/player.js';
import { Formula } from '../utils/Formula.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

const ATTR_MAP = {
    'str': '力量', 'con': '體質', 'dex': '敏捷', 'int': '悟性',
    'hp': '血量', 'atk': '攻擊', 'def': '防禦', 'speed': '速度'
};

export const UI_Stats = {
    init() {
        console.log("【UI_Stats】靈識歸位，注入淨化場景...");
        this.renderLayout();
        this.renderStats();
    },

    /**
     * 🌟 修改：重新編排結構，並將樣式移往 CSS 類別
     */
    renderLayout() {
        const container = document.getElementById('page-stats');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-scroll-wrapper">
                <div class="page-title">修士明鏡</div>

                <!-- 頂部操作：保留存檔，移去兵解 -->
                <div class="top-action-bar">
                    <button onclick="UI_System.manualSave()" class="btn-celestial-save">💾 凝神存檔</button>
                </div>

                <!-- 當前裝備區 -->
                <div class="equipped-section celestial-panel">
                    <div class="section-label">🧥 當前披掛</div>
                    <div id="equipped-list" class="equip-grid"></div>
                </div>

                <!-- 突破區域 -->
                <div id="breakthrough-area" class="breakthrough-container" style="display:none;">
                    <button id="btn-breakthrough" class="btn-special">應劫突破</button>
                </div>

                <!-- 境界標題 -->
                <div class="realm-badge-container">
                    <h2 id="stat-realm-title" class="realm-title-text"></h2>
                </div>

                <!-- 基礎屬性區 -->
                <div id="stats-content" class="stats-grid"></div>

                <!-- 🌟 兵解按鈕：移至底部並設定獨立樣式 -->
                <div class="footer-system-actions">
                    <button onclick="UI_System.restartGame()" class="btn-celestial-reset">
                        💀 兵解重來
                    </button>
                </div>
            </div>
        `;
    },

    renderStats() {
        if (!Player.data) return;
        const d = Player.data;

        const realmTitle = document.getElementById('stat-realm-title');
        if (realmTitle) {
            const dataSrc = window.DB || window.DATA || window.GAMEDATA;
            const realmName = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.REALM_NAMES) 
                ? dataSrc.CONFIG.REALM_NAMES[d.realm || 1] 
                : "凡人";
            realmTitle.innerText = `【${realmName}】 Lv.${d.level}`;
        }

        this.ensureStatsStructure();
        this.renderEquipped(); 
        this.handleBreakthroughUI();

        // 更新自由點數與基礎值
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // 更新戰鬥面板
        const bStats = Player.getBattleStats();
        const critRate = (Formula && Formula.calculateCritRate) ? Formula.calculateCritRate(d.stats.str, d.stats.dex) : 0;
        const dodgeRate = (Formula && Formula.calculateEvasionRate) ? Formula.calculateEvasionRate(d.stats.dex) : 0;

        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));
        this.updateValue('stat-def-preview', Math.ceil(bStats.def));
        this.updateValue('stat-spd-preview', bStats.speed.toFixed(1));
        this.updateValue('stat-crit-preview', critRate + "%");
        this.updateValue('stat-dodge-preview', dodgeRate + "%");

        this.renderSkills();
    },

    /**
     * 🌟 核心修正：徹底防禦 undefined 並改進可讀性
     */
    renderEquipped() {
        const listContainer = document.getElementById('equipped-list');
        if (!listContainer) return;

        const slots = [
            { id: 'weapon', label: '武器', icon: '⚔️' },
            { id: 'armor', label: '防具', icon: '👕' },
            { id: 'accessory', label: '飾品', icon: '💍' }
        ];

        listContainer.innerHTML = slots.map(slot => {
            // 🛡️ 鏈結式判斷：確保 Player.data.equipped 存在
            const item = (Player.data && Player.data.equipped) ? Player.data.equipped[slot.id] : null;
            
            if (!item || !item.name) {
                return `
                    <div class="equip-slot empty">
                        <span class="slot-icon">${slot.icon}</span>
                        <span class="slot-label">靈物待尋</span>
                    </div>`;
            }

            const rarityClass = `r-${item.rarity || 1}`;

            return `
                <div class="equip-slot ${rarityClass}" onclick="UI_Stats.unequipItem('${slot.id}')">
                    <div class="slot-visual">
                        <span class="slot-icon">${item.icon || slot.icon}</span>
                        <div class="slot-info">
                            <span class="slot-name">${item.name}</span>
                            <small class="slot-hint">點擊卸載</small>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    // --- 保留所有既有功能函數，確保資產完整 ---
    ensureStatsStructure() {
        const container = document.getElementById('stats-content');
        if (!container || container.innerHTML.trim() !== "") return;

        const statsConfig = [
            { id: 'str', name: ATTR_MAP.str, icon: '⚔️' },
            { id: 'con', name: ATTR_MAP.con, icon: '❤️' },
            { id: 'dex', name: ATTR_MAP.dex, icon: '⚡' },
            { id: 'int', name: ATTR_MAP.int, icon: '🧠' }
        ];

        let html = `
            <div class="stat-group-header">自由屬性點: <span id="stat-points" class="highlight">0</span></div>
            <div class="stats-grid-2x2">
        `;

        statsConfig.forEach(s => {
            html += `
                <div class="stat-card stat-card-mini">
                    <div class="stat-card-top">
                        <span class="stat-icon">${s.icon}</span>
                        <span id="stat-${s.id}" class="stat-val-bold">0</span>
                    </div>
                    <div class="stat-card-bottom">
                        <span class="stat-label-name">${s.name}</span>
                        <button class="btn-add-mini" onclick="UI_Stats.addStat('${s.id}', event)">+</button>
                    </div>
                </div>`;
        });

        html += `
            </div>
            <div class="battle-master-card stat-card">
                <div class="card-header">
                    <span>核心戰鬥指標</span>
                    <button class="btn-detail-lens" onclick="UI_Stats.showDetailModal()">詳細 🔍</button>
                </div>
                <div class="battle-grid-3x2">
                    <div class="b-item"><em>${ATTR_MAP.hp}</em><span id="stat-hp-preview">0</span></div>
                    <div class="b-item"><em>${ATTR_MAP.atk}</em><span id="stat-atk-preview">0</span></div>
                    <div class="b-item"><em>${ATTR_MAP.def}</em><span id="stat-def-preview">0</span></div>
                    <div class="b-item"><em>${ATTR_MAP.speed}</em><span id="stat-spd-preview">0</span></div>
                    <div class="b-item"><em>暴擊</em><span id="stat-crit-preview">0%</span></div>
                    <div class="b-item"><em>閃避</em><span id="stat-dodge-preview">0%</span></div>
                </div>
            </div>
            <div class="skills-section">
                <div class="section-title">本命神通</div>
                <div id="skills-list"></div>
            </div>`;
        container.innerHTML = html;
    },

    unequipItem(slotId) {
        const success = Player.unequip(slotId);
        if (success) {
            Msg.log(`已將裝備收回儲物袋。`, "system");
            this.renderStats();
            if (window.Core) window.Core.updateUI();
        }
    },

    addStat(type, event) {
        if (Player.data.statPoints <= 0) return Msg.log("自由點數不足！", "system");
        const success = Player.addStat(type);
        if (success) {
            if (event) this.createFloatingText(event.target, "+1");
            this.renderStats();
            if (window.Core) window.Core.updateUI();
        }
    },

    handleBreakthroughUI() {
        const area = document.getElementById('breakthrough-area');
        if (!area) return;
        if (Player.data.exp >= Player.data.maxExp) {
            area.style.display = 'block';
            const btn = document.getElementById('btn-breakthrough');
            if (btn) {
                const isMajorBreakthrough = (Player.data.level % 10 === 9);
                if (isMajorBreakthrough) {
                    btn.innerText = "⚡ 應劫突破";
                    btn.onclick = () => window.TribulationSystem ? window.TribulationSystem.init() : Msg.log("大陣未佈！", "system");
                } else {
                    btn.innerText = "✨ 提升修為";
                    btn.onclick = () => {
                        if (Player.breakthrough()) {
                            this.renderStats();
                            if (window.Core) window.Core.updateUI();
                        }
                    };
                }
            }
        } else {
            area.style.display = 'none';
        }
    },

    showDetailModal() {
        const d = Player.data;
        const bStats = Player.getBattleStats();
        const reduction = Formula.calculateDamageReduction ? Formula.calculateDamageReduction(bStats.def) : 0;
        const efficiency = (Formula.calculateExpBonus ? Formula.calculateExpBonus(d.stats.int) : 100).toFixed(0);
        const critMult = Formula.calculateCritMultiplier ? Formula.calculateCritMultiplier(d.stats.str) : 1.5;

        const modalHtml = `
            <div id="detail-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="modal-box stat-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4>詳細修為數據</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('detail-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="detail-list">
                        <div class="detail-row"><span>修煉效率</span><b>${efficiency}%</b></div>
                        <div class="detail-row"><span>物理減傷</span><b>${reduction}%</b></div>
                        <div class="detail-row"><span>暴擊倍率</span><b>${critMult.toFixed(2)}x</b></div>
                        <div class="detail-row"><span>血量上限</span><b>${Math.ceil(bStats.maxHp)}</b></div>
                        <div class="detail-row"><span>攻擊總值</span><b>${Math.ceil(bStats.atk)}</b></div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    createFloatingText(target, text) {
        const rect = target.getBoundingClientRect();
        const floatText = document.createElement('div');
        floatText.className = 'float-up-text';
        floatText.innerText = text;
        floatText.style.left = `${rect.left + rect.width / 2}px`;
        floatText.style.top = `${rect.top}px`;
        document.body.appendChild(floatText);
        setTimeout(() => floatText.remove(), 800);
    },

    renderSkills() {
        const skillContainer = document.getElementById('skills-list');
        if (!skillContainer) return;
        const skills = Player.data.skills;
        if (!skills || skills.length === 0) {
            skillContainer.innerHTML = `<div class="empty-msg">尚未領悟任何神通...</div>`;
            return;
        }
        skillContainer.innerHTML = skills.map(s => `
            <div class="skill-card stat-card">
                <div class="skill-info">
                    <span class="skill-name">${s.name}</span>
                    <span class="skill-level">等級 ${s.level || 1}</span>
                </div>
                <div class="skill-desc">${s.desc || '神識傳承中...'}</div>
            </div>`).join('');
    },

    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
};

window.UI_Stats = UI_Stats;
