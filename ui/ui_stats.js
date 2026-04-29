/**
 * V2.8 ui_stats.js (雲境青瓷 - 仙氣重塑版)
 * 職責：管理修為介面、注入 HTML 結構、屬性加點、雷劫觸發、裝備卸載、對接系統存檔/重置
 * 位置：/ui/ui_stats.js
 */

import { Player } from '../entities/player.js';
import { Formula } from '../utils/Formula.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

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
        console.log("【UI_Stats】修士明鏡初始化，注入仙氣場景...");
        this.renderLayout();
        this.renderStats();
    },

    // 🌟 優化：將笨重的色塊按鈕改為優雅的邊框按鈕
    renderLayout() {
        const container = document.getElementById('page-stats');
        if (!container) return;

        container.innerHTML = `
            <div class="page-title">修士明鏡</div>

            <!-- 系統操作區：改為靈氣感透明按鈕 -->
            <div class="system-actions-row" style="display: flex; justify-content: center; gap: 15px; margin-bottom: 25px; padding: 0 10px;">
                <button onclick="UI_System.manualSave()" class="btn-celestial-save" style="background: rgba(45, 212, 191, 0.1); border: 1px solid var(--jade-soft); padding: 8px 0; border-radius: 4px; color: var(--aura-cyan); cursor: pointer; font-weight: bold; flex: 1; font-size: 13px;">
                    💾 凝神存檔
                </button>
                <button onclick="UI_System.restartGame()" class="btn-celestial-reset" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 0; border-radius: 4px; color: #f87171; cursor: pointer; font-weight: bold; flex: 1; font-size: 13px;">
                    💀 兵解重來
                </button>
            </div>

            <!-- 當前裝備區 -->
            <div class="equipped-section celestial-panel">
                <div class="section-label">🧥 當前披掛</div>
                <div id="equipped-list" class="equip-grid"></div>
            </div>

            <div id="breakthrough-area" style="display:none; text-align:center; padding: 15px; margin: 10px 0;">
                <button id="btn-breakthrough" class="btn-special">應劫突破</button>
            </div>

            <!-- 境界標題：增加發光層次 -->
            <div class="realm-badge-container" style="text-align:center; margin-bottom:20px;">
                <h2 id="stat-realm-title" style="display: inline-block; color:var(--gold-bright); text-shadow: 0 0 10px rgba(251,191,36,0.3); letter-spacing: 4px; font-family:'STKaiti',serif;"></h2>
            </div>

            <div id="stats-content" class="stats-grid"></div>
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

        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

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
                </div>
            `;
        });

        html += `
            </div>
            <div class="battle-master-card stat-card" style="margin-top: 20px;">
                <div class="card-header">
                    <span>核心戰鬥指標</span>
                    <button class="btn-detail-lens" onclick="UI_Stats.showDetailModal()">詳細 🔍</button>
                </div>
                <div class="battle-grid-3x2">
                    <div class="b-item"><em>${ATTR_MAP.hp}</em><span id="stat-hp-preview">0</span></div>
                    <div class="b-item"><em>${ATTR_MAP.atk}</em><span id="stat-atk-preview">0</span></div>
                    <div class="b-item)<em>${ATTR_MAP.def}</em><span id="stat-def-preview">0</span></div>
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
     * 🌟 修正：徹底解決 undefined 問題並美化裝備顯示
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
            const item = Player.data.equipped ? Player.data.equipped[slot.id] : null;
            
            // 🛡️ 防呆：如果沒有 item 或 item 內部名稱為空
            if (!item || !item.name) {
                return `
                    <div class="equip-slot empty" style="border: 1px dashed rgba(255,255,255,0.1); opacity: 0.5;">
                        <span class="slot-icon" style="filter: grayscale(1);">${slot.icon}</span>
                        <span class="slot-label" style="font-size: 11px;">空位</span>
                    </div>`;
            }

            // ✅ 修正：使用 item.name || '未知' 確保不出現 undefined
            const itemName = item.name || "靈寶";
            const rarityClass = `r-${item.rarity || 1}`;

            return `
                <div class="equip-slot ${rarityClass}" onclick="UI_Stats.unequipItem('${slot.id}')" style="cursor: pointer; position: relative; border-radius: 4px; overflow: hidden; background: rgba(0,0,0,0.2);">
                    <div class="slot-visual" style="padding: 5px;">
                        <span class="slot-icon">${item.icon || slot.icon}</span>
                        <div class="slot-info">
                            <span class="slot-name" style="color: var(--r${item.rarity || 1}); font-weight: bold; font-size: 12px; display: block;">${itemName}</span>
                            <small style="color: rgba(255,255,255,0.4); font-size: 9px;">點擊卸載</small>
                        </div>
                    </div>
                    <!-- 仙氣裝飾角 -->
                    <div style="position:absolute; top:0; right:0; width:0; height:0; border-style:solid; border-width:0 10px 10px 0; border-color:transparent var(--card-border) transparent transparent;"></div>
                </div>`;
        }).join('');
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

    showDetailModal() {
        const d = Player.data;
        const bStats = Player.getBattleStats();
        const reduction = Formula.calculateDamageReduction ? Formula.calculateDamageReduction(bStats.def) : 0;
        const efficiency = (Formula.calculateExpBonus ? Formula.calculateExpBonus(d.stats.int) : 1 * 100).toFixed(0);
        const critMult = Formula.calculateCritMultiplier ? Formula.calculateCritMultiplier(d.stats.str) : 1.5;

        const modalHtml = `
            <div id="detail-modal-overlay" class="modal-overlay" onclick="this.remove()" style="z-index: 10001;">
                <div class="modal-box stat-card" onclick="event.stopPropagation()" style="padding: 20px; border: 1px solid var(--gold-dull);">
                    <div class="modal-header" style="border-bottom: 1px solid var(--card-border); padding-bottom: 10px; margin-bottom: 15px;">
                        <h4 style="color: var(--gold-bright);">詳細修為數據</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('detail-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="detail-list" style="line-height: 2.2;">
                        <div class="detail-row" style="display:flex; justify-content:space-between;"><span>修煉效率</span><b style="color: var(--jade-green);">${efficiency}%</b></div>
                        <div class="detail-row" style="display:flex; justify-content:space-between;"><span>物理減傷</span><b style="color: var(--sky-blue);">${reduction}%</b></div>
                        <div class="detail-row" style="display:flex; justify-content:space-between;"><span>暴擊倍率</span><b style="color: var(--gold-bright);">${critMult.toFixed(2)}x</b></div>
                        <div class="detail-row" style="display:flex; justify-content:space-between;"><span>血量上限</span><b>${Math.ceil(bStats.maxHp)}</b></div>
                        <div class="detail-row" style="display:flex; justify-content:space-between;"><span>攻擊總值</span><b>${Math.ceil(bStats.atk)}</b></div>
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
            
            if (btn) {
                const isMajorBreakthrough = (Player.data.level % 10 === 9);
                
                if (isMajorBreakthrough) {
                    btn.innerText = "⚡ 應劫突破";
                    btn.className = "btn-special tribulation-btn";
                    btn.onclick = () => {
                        if (window.TribulationSystem) {
                            window.TribulationSystem.init();
                        } else {
                            Msg.log("雷劫大陣未佈置，無法突破！", "system");
                        }
                    };
                } else {
                    btn.innerText = "✨ 提升修為";
                    btn.className = "btn-special";
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

    createFloatingText(target, text) {
        const rect = target.getBoundingClientRect();
        const floatText = document.createElement('div');
        floatText.className = 'float-up-text';
        floatText.innerText = text;
        floatText.style.position = 'fixed';
        floatText.style.left = `${rect.left + rect.width / 2}px`;
        floatText.style.top = `${rect.top}px`;
        floatText.style.color = 'var(--gold-bright)';
        floatText.style.pointerEvents = 'none';
        floatText.style.zIndex = '9999';
        document.body.appendChild(floatText);
        setTimeout(() => floatText.remove(), 800);
    },

    renderSkills() {
        const skillContainer = document.getElementById('skills-list');
        if (!skillContainer) return;
        const skills = Player.data.skills;
        if (!skills || skills.length === 0) {
            skillContainer.innerHTML = `<div class="empty-msg" style="padding: 20px; opacity: 0.5;">尚未領悟任何神通...</div>`;
            return;
        }
        skillContainer.innerHTML = skills.map(s => `
            <div class="skill-card stat-card" style="margin-bottom: 10px; padding: 12px;">
                <div class="skill-info" style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; margin-bottom: 5px;">
                    <span class="skill-name" style="color: var(--aura-cyan); font-weight: bold;">${s.name}</span>
                    <span class="skill-level" style="font-size: 11px; opacity: 0.7;">等級 ${s.level || 1}</span>
                </div>
                <div class="skill-desc" style="font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.4;">${s.desc || '神識傳承中...'}</div>
            </div>`).join('');
    },

    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
};

window.UI_Stats = UI_Stats;
