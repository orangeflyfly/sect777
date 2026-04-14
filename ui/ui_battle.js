/**
 * V2.0 ui_battle.js (飛升模組版)
 * 職責：歷練介面管理、戰鬥日誌分頁、地圖選擇與突破 UI 對接
 * 位置：/ui/ui_battle.js
 */

// 1. 導入核心邏輯與工具模組
import { Player } from '../entities/player.js';
import { CombatEngine } from '../systems/CombatEngine.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FX } from '../utils/fx.js';

export const UI_Battle = {
    // 1. 初始化監聽器與基礎渲染
    init() {
        console.log("【UI_Battle】歷練法鏡啟動，對接戰場數據...");
        this.renderSkillButtons();
        this.renderLogTabs(); // 初始化日誌分頁標籤
        
        // 初始同步玩家數據
        if (Player.data) {
            const stats = Player.getBattleStats();
            this.updatePlayerHP(Player.data.hp || stats.maxHp, stats.maxHp);
            this.updateExp(Player.data.exp, Player.data.maxExp);
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

    // 3. 更新經驗條與偵測突破 (對接修為介面)
    updateExp(current, next) {
        const fill = document.getElementById('exp-fill');
        if (fill) {
            const percent = Math.max(0, Math.min(100, (current / next) * 100));
            fill.style.width = `${percent}%`;
        }

        // V1.9.0 境界突破連動：當經驗滿時，通知 UI_Stats 顯示突破按鈕
        // 注意：UI_Stats 目前可能仍掛載於 window，採保守檢查調用
        if (current >= next && window.UI_Stats) {
            window.UI_Stats.handleBreakthroughUI();
        }
    },

    // 4. 更新怪物資訊 (觸發受擊 shake 特效)
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

            // V1.9.0 受擊閃爍與震動特效
            const monsterCard = document.getElementById('monster-display');
            if (monsterCard && monster.hp < maxHp) {
                // 如果 FX 模組存在，優先呼叫更專業的震動
                if (FX && FX.shake) {
                    FX.shake('monster-display');
                } else {
                    monsterCard.classList.add('hit-shake');
                    setTimeout(() => monsterCard.classList.remove('hit-shake'), 200);
                }
            }
        } else {
            if (nameEl) nameEl.innerText = "搜尋妖氣中...";
            if (iconEl) iconEl.innerText = "❓";
            if (hpFill) hpFill.style.width = "0%";
            if (hpText) hpText.innerText = "0 / 0";
        }
    },

    // 5. 戰鬥日誌渲染 (分頁機制預留)
    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-type-${type}`;
        
        const colorMap = {
            'player-atk': "#a78bfa",
            'monster-atk': "#ef4444",
            'reward': "#fbbf24",
            'gold': "#fbbf24",
            'system': "#94a3b8"
        };

        logEntry.style.color = colorMap[type] || "var(--text-main)";
        logEntry.innerHTML = `<span class="log-bullet">❯</span> <span class="log-text">${msg}</span>`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日誌長度
        const dataSrc = window.DATA || window.GAMEDATA;
        const limit = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.LOG_LIMIT) || 50;
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }

        // V1.9.0 對接飄字特效 (由 MessageCenter 轉接或此處直接攔截)
        if (type === 'player-atk' || type === 'monster-atk') {
            const val = msg.match(/\d+/); 
            if (val && FX && FX.spawnPopText) {
                const target = (type === 'player-atk') ? 'monster' : 'player';
                FX.spawnPopText(val[0], target);
            }
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

        // 注意：onclick 必須指向 window.UI_Battle 確保 HTML 呼叫得到
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

        // 核心邏輯：此處未來可實裝過濾功能
        Msg.log(`切換日誌頻道：${tabId}`, "system");
    },

    // 7. 渲染技能按鈕
    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        if (!actionContainer) return;

        actionContainer.innerHTML = '';

        // 1. 普通攻擊
        const atkBtn = document.createElement('button');
        atkBtn.className = 'btn-battle-action btn-atk-primary';
        atkBtn.innerHTML = `<span class="act-icon">⚔️</span><span class="act-name">普通攻擊</span>`;
        atkBtn.onclick = () => {
            if (CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        // 2. 動態渲染已習得神通
        if (Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const sBtn = document.createElement('button');
                sBtn.className = 'btn-battle-action btn-atk-skill';
                sBtn.innerHTML = `<span class="act-icon">✨</span><span class="act-name">${skill.name}</span>`;
                sBtn.onclick = () => {
                    if (CombatEngine && !CombatEngine.isProcessing) {
                        Msg.log(`施展神通：【${skill.name}】！`, 'player-atk');
                        CombatEngine.playerAttack();
                    }
                };
                actionContainer.appendChild(sBtn);
            });
        }
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
        const dataSrc = window.DATA || window.GAMEDATA;
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
        const dataSrc = window.DATA || window.GAMEDATA;
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
                    <div class="map-desc-row">
                        <span class="desc-label">出沒妖獸：</span>
                        ${monstersHtml}
                    </div>
                </div>
                <div class="map-action-row">
                    <button class="btn-go-map">前往歷練 ❯</button>
                </div>
            `;
            
            card.onclick = () => {
                this.selectMap(map);
                const modal = document.getElementById('modal-map');
                if (modal) modal.style.display = 'none';
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

// ==========================================
// 🛡️ 全域對接鎖
// ==========================================
window.UI_Battle = UI_Battle;
