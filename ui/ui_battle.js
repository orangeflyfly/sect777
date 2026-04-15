/**
 * V2.6.1 ui_battle.js
 * 職責：歷練介面渲染、主/被動分流、自動歷練、日誌過濾、地圖選擇修復
 * 位置：/ui/ui_battle.js
 */

import { Player } from '../entities/player.js';
import { CombatEngine } from '../systems/CombatEngine.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FX } from '../utils/fx.js';

export const UI_Battle = {
    autoInterval: null,
    isAuto: false,
    currentLogTab: 'all',

    init() {
        console.log("【UI_Battle】啟動渲染...");
        this.renderLayout(); 
        this.injectAutoToggle();
        this.renderSkillButtons();
        this.renderLogTabs(); 
        
        if (Player.data) {
            const stats = Player.getBattleStats();
            this.updatePlayerHP(Player.data.hp || stats.maxHp, stats.maxHp);
            this.updateExp(Player.data.exp, Player.data.maxExp);
        }
    },

    renderLayout() {
        const container = document.getElementById('page-battle');
        if (!container) return;

        container.innerHTML = `
            <div class="map-nav-header">
                <span id="current-map-name">探尋天機中...</span>
                <button onclick="UI_Battle.showMapSelect()" class="btn-travel">🗺️ 尋找歷練地</button>
            </div>
            
            <div id="combat-area" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px;">
                <div id="player-display" class="monster-card" style="flex:1; border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); transition: transform 0.1s;">
                    <div id="player-icon" class="monster-avatar">🧘‍♂️</div>
                    <h3 style="color: #60a5fa; font-size: 16px;">修士 (你)</h3>
                    <div id="player-buffs" style="min-height: 25px; display: flex; justify-content: center; flex-wrap: wrap; gap: 4px; margin-top: 5px;"></div>
                </div>

                <div style="font-size: 18px; font-weight: bold; color: #ef4444; text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);">VS</div>

                <div id="monster-display" class="monster-card" style="flex:1; transition: transform 0.1s;">
                    <div id="monster-icon" class="monster-avatar">❓</div>
                    <h3 id="monster-name" style="font-size: 16px;">搜尋妖氣中...</h3>
                    <div class="bar-container monster-hp">
                        <div id="monster-hp-fill" class="fill fill-hp" style="width: 100%;"></div>
                        <div class="bar-text" id="monster-hp-val">0 / 0</div>
                    </div>
                </div>
            </div>

            <div id="battle-actions" class="actions-container"></div>

            <div class="log-panel">
                <div class="log-header">
                    <span>📜 戰鬥日誌</span>
                    <div id="log-tabs"></div>
                </div>
                <div id="battle-log" class="log-content"></div>
            </div>
        `;
    },

    injectAutoToggle() {
        const header = document.querySelector('.map-nav-header');
        if (!header || document.getElementById('auto-battle-toggle')) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'auto-battle-toggle';
        toggleBtn.className = 'btn-travel';
        toggleBtn.style.marginLeft = '10px';
        toggleBtn.style.background = '#475569';
        toggleBtn.innerText = '🤖 自動: 關';
        toggleBtn.onclick = () => this.toggleAutoBattle();
        header.appendChild(toggleBtn);
    },

    toggleAutoBattle() {
        this.isAuto = !this.isAuto;
        const btn = document.getElementById('auto-battle-toggle');
        
        if (this.isAuto) {
            btn.innerText = '⚡ 自動: 開';
            btn.style.background = '#059669';
            Msg.log("「自動歷練」陣法啟動。", "system");
            
            this.autoInterval = setInterval(() => {
                if (!CombatEngine.isProcessing && CombatEngine.currentMonster) {
                    if (Player.data.hp / Player.getBattleStats().maxHp < 0.2) {
                        Msg.log("❗ 血量過低，自動歷練停機！", "monster-atk");
                        this.toggleAutoBattle();
                        return;
                    }
                    CombatEngine.playerAttack();
                }
            }, 1600);
        } else {
            btn.innerText = '🤖 自動: 關';
            btn.style.background = '#475569';
            clearInterval(this.autoInterval);
            Msg.log("「自動歷練」陣法關閉。", "system");
        }
    },

    updatePlayerHP(current, max) {
        const fill = document.getElementById('player-hp-fill');
        const valText = document.getElementById('player-hp-val');
        const maxText = document.getElementById('player-hp-max');
        if (fill && valText && maxText) {
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            fill.style.width = `${percent}%`;
            valText.innerText = Math.ceil(current);
            maxText.innerText = Math.ceil(max);
        }
    },

    updateExp(current, next) {
        const fill = document.getElementById('exp-fill');
        if (fill) {
            const percent = Math.max(0, Math.min(100, (current / next) * 100));
            fill.style.width = `${percent}%`;
        }
        if (current >= next && window.UI_Stats) {
            window.UI_Stats.handleBreakthroughUI();
        }
    },

    updateMonster(monster) {
        const nameEl = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-val');
        const iconEl = document.getElementById('monster-icon');
        if (monster) {
            if (nameEl) nameEl.innerText = monster.name;
            if (iconEl) iconEl.innerText = monster.icon || '👾';
            const maxHp = monster.maxHp || monster.hp || 1;
            const percent = Math.max(0, (monster.hp / maxHp) * 100);
            if (hpFill) hpFill.style.width = `${percent}%`;
            if (hpText) hpText.innerText = `${Math.ceil(monster.hp)} / ${maxHp}`;
        } else {
            if (nameEl) nameEl.innerText = "搜尋妖氣中...";
            if (iconEl) iconEl.innerText = "❓";
            if (hpFill) hpFill.style.width = "0%";
            if (hpText) hpText.innerText = "0 / 0";
        }
    },

    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-type-${type}`;
        logEntry.setAttribute('data-type', type); 
        
        const colorMap = {
            'player-atk': "#60a5fa",
            'gold': "#fcd34d",
            'monster-atk': "#ef4444",
            'reward': "#a855f7",
            'system': "#94a3b8",
            'default': "#ffffff"
        };

        logEntry.style.color = colorMap[type] || colorMap['default'];
        logEntry.style.marginBottom = "4px";
        logEntry.style.fontSize = "13px";
        logEntry.innerHTML = `<span style="color:${colorMap['system']}; margin-right:5px;">❯</span>${msg}`;

        if (!this.checkTypeVisible(type)) {
            logEntry.style.display = 'none';
        }

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        const limit = 50;
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }
    },

    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        if (!actionContainer) return;
        actionContainer.innerHTML = '';
        const dataSrc = window.DB || window.DATA;

        const atkBtn = document.createElement('button');
        atkBtn.className = 'btn-battle-action btn-atk-primary';
        atkBtn.innerHTML = `<span class="act-icon">⚔️</span><span class="act-name">普通攻擊</span>`;
        atkBtn.onclick = () => { if (CombatEngine) CombatEngine.playerAttack(); };
        actionContainer.appendChild(atkBtn);

        if (Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const skillDef = dataSrc.SKILLS[skill.name];
                if (!skillDef) return;
                if (skillDef.isPassive) return; 

                const sBtn = document.createElement('button');
                sBtn.className = 'btn-battle-action btn-atk-skill';
                sBtn.id = `btn-skill-${skill.name}`;
                sBtn.style.position = 'relative';
                sBtn.style.overflow = 'hidden';
                sBtn.innerHTML = `
                    <span class="act-icon">✨</span>
                    <span class="act-name">${skill.name}</span>
                    <div id="cd-mask-${skill.name}" style="position:absolute; bottom:0; left:0; width:100%; height:0%; background:rgba(0,0,0,0.6); pointer-events:none; transition:height 0.1s linear;"></div>
                    <div id="cd-text-${skill.name}" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#fff; font-weight:bold; font-size:16px; pointer-events:none;"></div>
                `;
                sBtn.onclick = () => { if (CombatEngine) CombatEngine.useSkill(skill.name); };
                actionContainer.appendChild(sBtn);
            });
        }
        this.updateCooldownDisplay();
    },

    updateCooldownDisplay() {
        const dataSrc = window.DB || window.DATA;
        if (!Player.data || !Player.data.skills) return;

        Player.data.skills.forEach(skill => {
            const skillDef = dataSrc.SKILLS[skill.name];
            if (!skillDef || skillDef.isPassive) return;
            const btn = document.getElementById(`btn-skill-${skill.name}`);
            const mask = document.getElementById(`cd-mask-${skill.name}`);
            const text = document.getElementById(`cd-text-${skill.name}`);
            if (!mask || !text) return;

            const currentCD = CombatEngine.skillCDs[skill.name] || 0;
            const totalCD = skillDef.cd || 5;

            if (currentCD > 0) {
                if (btn) btn.disabled = true;
                const percent = (currentCD / totalCD) * 100;
                mask.style.height = `${percent}%`;
                text.innerText = `${currentCD}s`;
            } else {
                if (btn) btn.disabled = false;
                mask.style.height = '0%';
                text.innerText = '';
            }
        });

        if (document.getElementById('page-battle').style.display !== 'none') {
            requestAnimationFrame(() => this.updateCooldownDisplay());
        }
    },

    renderLogTabs() {
        const tabContainer = document.getElementById('log-tabs');
        if (!tabContainer) return;
        const tabs = [
            { id: 'all', name: '全部' },
            { id: 'battle', name: '戰鬥' },
            { id: 'loot', name: '掉落' }
        ];
        tabContainer.innerHTML = tabs.map(tab => `
            <button class="log-tab-btn ${this.currentLogTab === tab.id ? 'active' : ''}" 
                    onclick="UI_Battle.switchLogTab('${tab.id}', this)">
                ${tab.name}
            </button>
        `).join('');
    },

    switchLogTab(tabId, btn) {
        this.currentLogTab = tabId;
        document.querySelectorAll('.log-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const logs = document.querySelectorAll('.log-item');
        logs.forEach(log => {
            const type = log.getAttribute('data-type');
            if (this.checkTypeVisible(type)) {
                log.style.display = 'block';
            } else {
                log.style.display = 'none';
            }
        });
    },

    checkTypeVisible(type) {
        if (this.currentLogTab === 'all') return true;
        if (this.currentLogTab === 'battle') {
            return ['player-atk', 'monster-atk', 'gold', 'system'].includes(type);
        }
        if (this.currentLogTab === 'loot') {
            return ['reward', 'system'].includes(type);
        }
        return false;
    },

    /**
     * 🟢 修復重點：地圖選擇系統 (骨架顯化版)
     */
    showMapSelect() {
        const modal = document.getElementById('modal-map');
        if (modal) {
            // 先動態注入原本在 index.html 裡的結構
            modal.innerHTML = `
                <div class="map-select-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>🗺️ 選擇歷練之地</h3>
                        <button class="btn-modal-close" onclick="document.getElementById('modal-map').style.display='none'">✕</button>
                    </div>
                    <div id="region-list" class="region-tabs"></div>
                    <div id="map-list" class="map-cards-grid"></div>
                </div>
            `;
            
            modal.style.display = 'flex';
            this.renderRegions(); // 確保 DOM 結構生成後，再呼叫渲染函數
        }
    },

    renderRegions() {
        const regionList = document.getElementById('region-list');
        const dataSrc = window.DB || window.DATA;
        if (!regionList || !dataSrc || !dataSrc.REGIONS) return;
        regionList.innerHTML = '';
        Object.keys(dataSrc.REGIONS).forEach(key => {
            const region = dataSrc.REGIONS[key];
            const btn = document.createElement('button');
            btn.className = 'region-tab-btn';
            btn.innerText = region.name;
            btn.onclick = () => {
                document.querySelectorAll('.region-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderMapsInRegion(key);
            };
            regionList.appendChild(btn);
        });
        const firstKey = Object.keys(dataSrc.REGIONS)[0];
        if (firstKey) {
            if(regionList.firstChild) regionList.firstChild.classList.add('active');
            this.renderMapsInRegion(firstKey);
        }
    },

    renderMapsInRegion(regionKey) {
        const mapList = document.getElementById('map-list');
        const dataSrc = window.DB || window.DATA;
        if (!mapList || !dataSrc) return;
        
        mapList.innerHTML = '';
        dataSrc.REGIONS[regionKey].maps.forEach(map => {
            const card = document.createElement('div');
            card.className = 'map-glass-card';
            
            let monstersHtml = '<div class="map-monster-icons">';
            map.monsterIds.forEach(id => {
                const m = dataSrc.MONSTERS[id];
                monstersHtml += `<span class="m-icon" title="${m ? m.name : '未知'}">${m ? m.icon : '❓'}</span>`;
            });
            monstersHtml += '</div>';

            card.innerHTML = `
                <div class="map-card-content">
                    <div class="map-title-row">
                        <strong class="map-name">${map.name}</strong>
                        <span class="map-lv-badge">Lv.${map.minLv}</span>
                    </div>
                    <div class="map-desc-row">${monstersHtml}</div>
                </div>
                <div class="map-action-row"><button class="btn-go-map">前往歷練 ❯</button></div>
            `;
            
            card.onclick = () => {
                this.selectMap(map);
                document.getElementById('modal-map').style.display = 'none';
            };
            mapList.appendChild(card);
        });
    },

    selectMap(map) {
        const mapNameEl = document.getElementById('current-map-name');
        if (mapNameEl) mapNameEl.innerText = map.name;
        Msg.log(`前往「${map.name}」進行歷練...`, "system");
        if (CombatEngine) CombatEngine.init(map.id);
    }
};

window.UI_Battle = UI_Battle;
