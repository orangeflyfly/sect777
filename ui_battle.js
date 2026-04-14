/**
 * V1.8.2 ui_battle.js (歷練介面重塑版)
 * 修正點：補齊全域對接鎖、實裝日誌收合邏輯、強化怪物數據容錯、加入空數據清理
 */

const UI_Battle = {
    // 1. 初始化監聽器
    init() {
        console.log("【UI_Battle】模組啟動：正在加載戰鬥配置...");
        this.renderSkillButtons();
        
        // 初始同步一次玩家狀態 (確保 Player 與數據已加載)
        if (typeof Player !== 'undefined' && Player.data) {
            const stats = Player.getBattleStats();
            this.updatePlayerHP(Player.data.hp || stats.maxHp, stats.maxHp);
            this.updateExp(Player.data.exp, Player.data.maxExp);
        }
    },

    // 2. 更新玩家血條 (對齊 header 裡的 ID)
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
    },

    // 4. 更新怪物資訊 (V1.8.2 強化：支援怪物消失/清空)
    updateMonster(monster) {
        const nameEl = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-val');
        const iconEl = document.getElementById('monster-icon');

        if (monster) {
            // 怪物現身
            if (nameEl) nameEl.innerText = monster.name;
            if (iconEl) iconEl.innerText = monster.icon || '👾';
            
            const maxHp = monster.maxHp || monster.hp || 1;
            const percent = Math.max(0, (monster.hp / maxHp) * 100);
            
            if (hpFill) hpFill.style.width = `${percent}%`;
            if (hpText) hpText.innerText = `${Math.ceil(monster.hp)} / ${maxHp}`;
        } else {
            // 怪物消失 (例如戰鬥結束或搜尋中)
            if (nameEl) nameEl.innerText = "搜尋妖氣中...";
            if (iconEl) iconEl.innerText = "❓";
            if (hpFill) hpFill.style.width = "0%";
            if (hpText) hpText.innerText = "0 / 0";
        }
    },

    // 5. 戰鬥日誌渲染 (由 MessageCenter 呼叫)
    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-type-${type}`;
        
        // 顏色映射
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
        
        // 自動滾動到底部
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日誌長度
        const limit = (typeof DATA !== 'undefined' && DATA.CONFIG && DATA.CONFIG.LOG_LIMIT) || 50;
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }
    },

    // 6. 渲染技能按鈕 (V1.8.2 結構升級)
    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        if (!actionContainer) return;

        actionContainer.innerHTML = '';

        // A. 普通攻擊
        const atkBtn = document.createElement('button');
        atkBtn.className = 'btn-battle-action btn-atk-primary';
        atkBtn.innerHTML = `<span class="act-icon">⚔️</span><span class="act-name">普通攻擊</span>`;
        atkBtn.onclick = () => {
            if (window.CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        // B. 動態技能 (從 Player 數據中讀取)
        if (typeof Player !== 'undefined' && Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const sBtn = document.createElement('button');
                sBtn.className = 'btn-battle-action btn-atk-skill';
                sBtn.innerHTML = `<span class="act-icon">✨</span><span class="act-name">${skill.name}</span>`;
                sBtn.onclick = () => {
                    if (window.CombatEngine && !CombatEngine.isProcessing) {
                        if (window.Msg) Msg.log(`施展神通：【${skill.name}】！`, 'player-atk');
                        CombatEngine.playerAttack(); // 這裡未來可擴充不同技能效果
                    }
                };
                actionContainer.appendChild(sBtn);
            });
        }
    },

    // 7. 地圖選擇彈窗
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
        
        // 預設渲染第一個區域
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
            
            // 生成怪物預覽
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
    },

    // 8. V1.8.2 新增：對接 HTML 的日誌收合功能
    toggleLog() {
        const logSystem = document.getElementById('log-system');
        const toggleBtn = document.getElementById('log-toggle');
        if (!logSystem || !toggleBtn) return;

        if (logSystem.classList.contains('expanded')) {
            logSystem.classList.remove('expanded');
            logSystem.classList.add('collapsed');
            toggleBtn.innerText = "展開 🔽";
        } else {
            logSystem.classList.remove('collapsed');
            logSystem.classList.add('expanded');
            toggleBtn.innerText = "收合 🔼";
        }
    }
};

// ==========================================
// 🛡️ 全域對接鎖：確保 window.UI_Battle 絕對存在
// ==========================================
window.UI_Battle = UI_Battle;
console.log("%c【系統】歷練介面模組 UI_Battle 已成功掛載全域。", "color: #10b981; font-weight: bold;");
