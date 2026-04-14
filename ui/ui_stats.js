/**
 * V2.1 ui_stats.js (第一波：修復優化版)
 * 修正點：中文化、裝備卸載邏輯、彈窗按鈕優化
 */

import { Player } from '../entities/player.js';
import { Formula } from '../utils/Formula.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

// 屬性翻譯映射陣法
const ATTR_MAP = {
    'str': '力量',
    'con': '體質',
    'dex': '敏捷',
    'int': '悟性',
    'hp': '血量',
    'atk': '攻擊',
    'def': '防禦',
    'speed': '速度'
};

export const UI_Stats = {
    init() {
        console.log("【UI_Stats】修士明鏡初始化，屬性法陣歸位...");
        this.renderStats();
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
        this.renderEquipped(); // 渲染裝備 (含卸載按鈕)
        this.handleBreakthroughUI();

        // 基礎屬性更新 (對接 ATTR_MAP)
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // 戰鬥指標更新
        const bStats = Player.getBattleStats();
        const critRate = Formula.calculateCritRate(d.stats.str, d.stats.dex);
        const dodgeRate = Formula.calculateEvasionRate(d.stats.dex);

        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));
        this.updateValue('stat-def-preview', Math.ceil(bStats.def));
        this.updateValue('stat-spd-preview', bStats.speed.toFixed(1));
        this.updateValue('stat-crit-preview', critRate + "%");
        this.updateValue('stat-dodge-preview', dodgeRate + "%");

        this.renderSkills();
    },

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
                <div class="stat-card-mini">
                    <div class="stat-card-top">
                        <span class="stat-icon">${s.icon}</span>
                        <span id="stat-${s.id}" class="stat-val-bold">0</span>
                    </div>
                    <div class="stat-card-bottom">
                        <span class="stat-label-name">${s.name}</span>
                        <button class="btn-add-mini" onclick="UI_Stats.addStat('${s.id}', event)">+</button>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div class="battle-master-card">
                <div class="card-header">
                    <span>核心戰鬥指標</span>
                    <button class="btn-detail-lens" onclick="UI_Stats.showDetailModal()">詳細數據 🔍</button>
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
            </div>
        `;
        container.innerHTML = html;
    },

    /**
     * 渲染裝備槽位 (新增：卸載法陣)
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
            const item = Player.data.equipped[slot.id];
            if (!item) {
                return `
                    <div class="equip-slot empty">
                        <span class="slot-icon">${slot.icon}</span>
                        <span class="slot-label">${slot.label}</span>
                    </div>`;
            }
            // 點擊裝備格觸發卸下
            return `
                <div class="equip-slot r-${item.rarity || 1}" onclick="UI_Stats.unequipItem('${slot.id}')">
                    <span class="slot-icon">${item.icon || slot.icon}</span>
                    <div class="slot-info">
                        <span class="slot-name">${item.name}</span>
                        <small class="c-green">點擊脫下</small>
                    </div>
                </div>`;
        }).join('');
    },

    /**
     * 卸下裝備邏輯
     */
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

    showDetailModal() {
        const d = Player.data;
        const bStats = Player.getBattleStats();
        const reduction = Formula.calculateDamageReduction(bStats.def);
        const efficiency = (Formula.calculateExpBonus(d.stats.int) * 100).toFixed(0);
        const critMult = Formula.calculateCritMultiplier(d.stats.str);

        const modalHtml = `
            <div id="detail-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="detail-glass-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4>詳細修為數據</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('detail-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="detail-list">
                        <div class="detail-row"><span>修煉效率</span><b class="c-green">${efficiency}%</b></div>
                        <div class="detail-row"><span>物理減傷</span><b class="c-blue">${reduction}%</b></div>
                        <div class="detail-row"><span>暴擊倍率</span><b class="c-gold">${critMult.toFixed(2)}x</b></div>
                        <div class="detail-row"><span>${ATTR_MAP.hp}上限</span><b>${Math.ceil(bStats.maxHp)}</b></div>
                        <div class="detail-row"><span>${ATTR_MAP.atk}總值</span><b>${Math.ceil(bStats.atk)}</b></div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleBreakthroughUI() {
        const area = document.getElementById('breakthrough-area');
        if (!area) return;
        if (Player.data.exp >= Player.data.maxExp) {
            area.style.display = 'block';
            const btn = document.getElementById('btn-breakthrough');
            if (btn) btn.onclick = () => {
                if (Player.breakthrough()) {
                    this.renderStats();
                    if (window.Core) window.Core.updateUI();
                }
            };
        } else {
            area.style.display = 'none';
        }
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
            <div class="skill-card">
                <div class="skill-info">
                    <span class="skill-name">${s.name}</span>
                    <span class="skill-level">Lv.${s.level || 1}</span>
                </div>
                <div class="skill-desc">${s.desc || '修復中...'}</div>
            </div>`).join('');
    },

    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
};

window.UI_Stats = UI_Stats;
