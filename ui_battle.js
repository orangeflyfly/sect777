/**
 * V1.8.1 ui_battle.js
 * 修正點：對接 CombatEngine 命名、整合 Msg 訊號、強化技能按鈕點擊鎖
 */

const UI_Battle = {
    // 1. 初始化監聽器
    init() {
        console.log("UI_Battle 模組啟動：正在加載戰鬥配置...");
        this.renderSkillButtons();
        // 初始同步一次玩家狀態
        if (Player.data) {
            const stats = Player.getBattleStats();
            this.updatePlayerHP(stats.maxHp, stats.maxHp); // 初始滿血
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
        }
    },

    // 5. 戰鬥日誌渲染 (由 MessageCenter 呼叫)
    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-${type}`;
        
        // 顏色映射 (保留道友原始設定)
        const colorMap = {
            'player-atk': "#a78bfa",
            'monster-atk': "#ef4444",
            'reward': "#fbbf24",
            'gold': "#fbbf24",
            'system': "#94a3b8"
        };

        logEntry.style.color = colorMap[type] || "#f8fafc";
        logEntry.style.marginBottom = "4px";
        logEntry.style.fontSize = "13px";
        logEntry.innerText = `> ${msg}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日誌長度
        const limit = DATA.CONFIG.LOG_LIMIT || 50;
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }
    },

    // 6. 渲染技能按鈕
    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        if (!actionContainer) return;

        actionContainer.innerHTML = '';

        // A. 普通攻擊
        const atkBtn = document.createElement('button');
        atkBtn.className = 'action-btn primary';
        atkBtn.innerHTML = '⚔️ 普通攻擊';
        atkBtn.onclick = () => {
            // 對接 V1.8.1 戰鬥引擎
            if (window.CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        // B. 動態技能
        if (Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const sBtn = document.createElement('button');
                sBtn.className = 'action-btn skill';
                sBtn.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
                sBtn.innerHTML = `✨ ${skill.name}`;
                sBtn.onclick = () => {
                    if (window.CombatEngine && !CombatEngine.isProcessing) {
                        Msg.log(`施展神通：【${skill.name}】！`, 'player-atk');
                        CombatEngine.playerAttack(); // 未來這裡改為 CombatEngine.useSkill(skill.id)
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
        if (!regionList) return;
        regionList.innerHTML = '';
        
        Object.keys(DATA.REGIONS).forEach(key => {
            const region = DATA.REGIONS[key];
            const btn = document.createElement('button');
            btn.className = 'region-tab-btn';
            btn.innerText = region.name;
            btn.onclick = () => this.renderMapsInRegion(key);
            regionList.appendChild(btn);
        });
        
        // 預設渲染第一個區域
        const firstKey = Object.keys(DATA.REGIONS)[0];
        if (firstKey) this.renderMapsInRegion(firstKey);
    },

    renderMapsInRegion(regionKey) {
        const mapList = document.getElementById('map-list');
        if (!mapList) return;
        mapList.innerHTML = '';
        
        DATA.REGIONS[regionKey].maps.forEach(map => {
            const card = document.createElement('div');
            card.className = 'map-card';
            
            // 生成怪物預覽
            let monstersHtml = '<div class="monster-previews">';
            map.monsterIds.forEach(id => {
                const m = DATA.MONSTERS[id];
                monstersHtml += `<span>${m ? m.icon : '❓'}</span>`;
            });
            monstersHtml += '</div>';

            card.innerHTML = `
                <div class="map-info">
                    <strong>${map.name}</strong>
                    <small>Lv.${map.minLv}</small>
                </div>
                ${monstersHtml}
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
        if (window.CombatEngine) CombatEngine.init(map.id);
    }
};
