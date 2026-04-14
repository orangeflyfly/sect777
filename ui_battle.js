/**
 * V1.9.0 ui_battle.js
 * 職責：歷練介面管理、戰鬥日誌分頁、地圖選擇與突破 UI 對接
 * 修正點：
 * 1. 實裝日誌分頁切換邏輯 (取代舊有的收合按鈕)。
 * 2. 強化更新怪物資訊的視覺回饋。
 * 3. 預留戰鬥飄字 (Damage FX) 的觸發接口。
 * 4. 加入經驗滿值時的突破按鈕監聽。
 */

const UI_Battle = {
    // 1. 初始化監聽器
    init() {
        console.log("【UI_Battle】練功修練介面啟動...");
        this.renderSkillButtons();
        this.renderLogTabs(); // 初始化日誌分頁標籤
        
        // 初始同步玩家數據
        if (typeof Player !== 'undefined' && Player.data) {
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

    // 3. 更新經驗條與偵測突破
    updateExp(current, next) {
        const fill = document.getElementById('exp-fill');
        if (fill) {
            const percent = Math.max(0, Math.min(100, (current / next) * 100));
            fill.style.width = `${percent}%`;
        }

        // V1.9.0 境界突破連動：當經驗滿時，通知 UI_Stats 顯示突破按鈕
        if (current >= next && window.UI_Stats) {
            UI_Stats.handleBreakthroughUI();
        }
    },

    // 4. 更新怪物資訊 (預留特效接口)
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

            // V1.9.0 預留：受擊閃爍特效 (需配合 fx.css)
            const monsterCard = document.getElementById('monster-display');
            if (monsterCard && monster.hp < maxHp) {
                monsterCard.classList.add('hit-shake');
                setTimeout(() => monsterCard.classList.remove('hit-shake'), 200);
            }
        } else {
            if (nameEl) nameEl.innerText = "搜尋妖氣中...";
            if (iconEl) iconEl.innerText = "❓";
            if (hpFill) hpFill.style.width = "0%";
            if (hpText) hpText.innerText = "0 / 0";
        }
    },

    // 5. 戰鬥日誌渲染 (對齊 V1.9.0 新結構)
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

        // V1.9.0 預留：觸發飄字特效 (對接 fx.js)
        if (type === 'player-atk' || type === 'monster-atk') {
            const val = msg.match(/\d+/); // 萃取數字
            if (val && window.FX) {
                const target = (type === 'player-atk') ? 'monster' : 'player';
                FX.spawnPopText(val[0], target);
            }
        }
    },

    // 6. 渲染日誌分頁標籤 (取代舊收合鈕)
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
        // 切換按鈕樣式
        document.querySelectorAll('.log-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 這裡未來可以加入過濾邏輯
        Msg.log(`切換日誌頻道：${tabId}`, "system");
    },

    // 7. 渲染技能按鈕
    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        if (!actionContainer) return;

        actionContainer.innerHTML = '';

        const atkBtn = document.createElement('button');
        atkBtn.className = 'btn-battle-action btn-atk-primary';
        atkBtn.innerHTML = `<span class="act-icon">⚔️</span><span class="act-name">普通攻擊</span>`;
        atkBtn.onclick = () => {
            if (window.CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        if (typeof Player !== 'undefined' && Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const sBtn = document.createElement('button');
                sBtn.className = 'btn-battle-action btn-atk-skill';
                sBtn.innerHTML = `<span class="act-icon">✨</span><span class="act-name">${skill.name}</span>`;
                sBtn.onclick = () => {
                    if (window.CombatEngine && !CombatEngine.isProcessing) {
                        if (window.Msg) Msg.log(`施展神通：【${skill.name}】！`, 'player-atk');
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
        if (window.Msg) Msg.log(`前往「${map.name}」進行歷練...`, "system");
        if (window.CombatEngine) CombatEngine.init(map.id);
    }
};

// ==========================================
// 🛡️ 全域對接鎖
// ==========================================
window.UI_Battle = UI_Battle;
