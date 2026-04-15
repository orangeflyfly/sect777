/**
 * V2.4.2 ui_battle.js (架構瘦身 - 絕對無損搬遷版)
 * 職責：歷練介面渲染、主/被動分流、自動歷練開關、彩色日誌
 * 位置：/ui/ui_battle.js
 */

import { Player } from '../entities/player.js';
import { CombatEngine } from '../systems/CombatEngine.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FX } from '../utils/fx.js';

export const UI_Battle = {
    autoInterval: null, // 自動歷練計時器
    isAuto: false,      // 自動狀態標記

    // 1. 初始化
    init() {
        console.log("【UI_Battle】歷練法鏡啟動，正在載入主被動分流陣法...");
        
        // 🟢 注入原本在 index.html 的原始 HTML 片段 (保證完全一致)
        this.renderLayout(); 

        this.injectAutoToggle(); // 注入自動開關
        this.renderSkillButtons();
        this.renderLogTabs(); 
        
        if (Player.data) {
            const stats = Player.getBattleStats();
            this.updatePlayerHP(Player.data.hp || stats.maxHp, stats.maxHp);
            this.updateExp(Player.data.exp, Player.data.maxExp);
        }
    },

    // 🟢 瘦身核心：將道友 index.html 的 page-battle 內容完整搬遷至此
    renderLayout() {
        const container = document.getElementById('page-battle');
        if (!container) return;

        // 這裡的 HTML 代碼與道友原來的 index.html 一字不差
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

    // 🟢 新增：在介面注入「自動歷練」按鈕
    injectAutoToggle() {
        const header = document.querySelector('.map-nav-header');
        if (!header || document.getElementById('auto-battle-toggle')) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'auto-battle-toggle';
        toggleBtn.className = 'btn-travel'; // 沿用旅行按鈕樣式
        toggleBtn.style.marginLeft = '10px';
        toggleBtn.style.background = '#475569';
        toggleBtn.innerText = '🤖 自動: 關';
        toggleBtn.onclick = () => this.toggleAutoBattle();
        header.appendChild(toggleBtn);
    },

    // 🟢 新增：自動歷練開關邏輯
    toggleAutoBattle() {
        this.isAuto = !this.isAuto;
        const btn = document.getElementById('auto-battle-toggle');
        
        if (this.isAuto) {
            btn.innerText = '⚡ 自動: 開';
            btn.style.background = '#059669';
            Msg.log("「自動歷練」陣法啟動，修士開始自主尋怪攻擊。", "system");
            
            this.autoInterval = setInterval(() => {
                // 檢查是否正在處理、是否有怪、血量是否過低
                if (!CombatEngine.isProcessing && CombatEngine.currentMonster) {
                    if (Player.data.hp / Player.getBattleStats().maxHp < 0.2) {
                        Msg.log("❗ 血量過低，自動歷練緊急停機！", "monster-atk");
                        this.toggleAutoBattle();
                        return;
                    }
                    CombatEngine.playerAttack();
                }
            }, 1600); // 略慢於戰鬥動畫，避免卡死
        } else {
            btn.innerText = '🤖 自動: 關';
            btn.style.background = '#475569';
            clearInterval(this.autoInterval);
            Msg.log("「自動歷練」陣法已關閉。", "system");
        }
    },

    // 2. 更新玩家血條
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

    // 3. 更新經驗條
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

    // 4. 更新怪物資訊
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

    // 5. 彩色戰鬥日誌 (一字不漏修復版)
    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-type-${type}`;
        
        // 🟢 定義全新的日誌色彩法則
        const colorMap = {
            'player-atk': "#60a5fa",   // 玩家普通攻擊 (淺藍)
            'gold': "#fcd34d",         // 🟢 神通觸發、被動運轉 (金色)
            'monster-atk': "#ef4444",  // 怪物攻擊、中毒、重傷 (紅色)
            'reward': "#a855f7",       // 🟢 獲得獎勵、戰利品 (紫色)
            'system': "#94a3b8",       // 系統提示 (灰色)
            'default': "#ffffff"
        };

        logEntry.style.color = colorMap[type] || colorMap['default'];
        logEntry.style.marginBottom = "4px";
        logEntry.style.fontSize = "13px";
        logEntry.innerHTML = `<span style="color:${colorMap['system']}; margin-right:5px;">❯</span>${msg}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日誌數量
        const limit = 50;
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }
    },

    // 6. 渲染神通區 (主被動分流)
    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        const passiveContainer = document.getElementById('player-buffs'); // 借用 buffs 區顯示被動功法
        if (!actionContainer) return;

        actionContainer.innerHTML = '';
        
        const dataSrc = window.DB || window.DATA;

        // 1. 固定按鈕：普通攻擊
        const atkBtn = document.createElement('button');
        atkBtn.className = 'btn-battle-action btn-atk-primary';
        atkBtn.innerHTML = `<span class="act-icon">⚔️</span><span class="act-name">普通攻擊</span>`;
        atkBtn.onclick = () => {
            if (CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        // 2. 遍歷玩家習得的技能
        if (Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const skillDef = dataSrc.SKILLS[skill.name];
                if (!skillDef) return;

                // 🟢 分流：如果是被動技能，不生成按鈕
                if (skillDef.isPassive) {
                    console.log(`【UI_Battle】偵測到被動功法：${skill.name}，已交由引擎後台運轉。`);
                    return; 
                }

                // 🟢 分流：如果是主動技能，生成戰鬥按鈕
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

                sBtn.onclick = () => {
                    if (CombatEngine) CombatEngine.useSkill(skill.name);
                };
                actionContainer.appendChild(sBtn);
            });
        }
        
        // 啟動 CD UI 監視迴圈
        this.updateCooldownDisplay();
    },

    // 🟢 新增：每幀更新冷卻視覺
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

        // 為了節省資源，只有在歷練頁面才持續更新
        if (document.getElementById('page-battle').style.display !== 'none') {
            requestAnimationFrame(() => this.updateCooldownDisplay());
        }
    },

    // 6. 渲染日誌分頁標籤
    renderLogTabs() {
        const tabContainer = document.getElementById('log-tabs');
        if (!tabContainer) return;
        const tabs = [
            { id: 'all', name: '全部' },
            { id: 'battle', name: '戰鬥' },
            { id: 'loot', name: '掉落' }
        ];
        tabContainer.innerHTML = tabs.map(tab => `
            <button class="log-tab-btn ${tab.id === 'all' ? 'active' : ''}" 
                    onclick="UI_Battle.switchLogTab('${tab.id}', this)">
                ${tab.name}
            </button>
        `).join('');
    },

    switchLogTab(tabId, btn) {
        document.querySelectorAll('.log-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // 目前暫時顯示切換，未來可擴充過濾 logic
    },

    // 8. 地圖選擇系統
    showMapSelect() {
        const modal = document.getElementById('modal-map');
        if (modal) {
            modal.style.display = 'flex';
            this.renderRegions();
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
            
            // 🟢 回歸道友原本的 monstersHtml 拼接邏輯
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
                    <div class="map-desc-row">
                        ${monstersHtml}
                    </div>
                </div>
                <div class="map-action-row">
                    <button class="btn-go-map">前往歷練 ❯</button>
                </div>
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
