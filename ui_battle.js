/**
 * V1.8.2 ui_battle.js (歷練介面重塑版)
 * 修正點：對接 CombatEngine、優化按鈕與地圖卡片 DOM 結構、預留高級 CSS 接口
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

    // 4. 更新怪物資訊 (預留受擊特效接口)
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
        // V1.8.2 改進：統一使用 class 控制樣式，方便後續 CSS 統一管理
        logEntry.className = `log-item log-type-${type}`;
        
        // 顏色映射 (保留道友原始設定，轉為行內變數確保相容)
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
        const limit = DATA.CONFIG.LOG_LIMIT || 50;
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
            // 對接 V1.8.1 戰鬥引擎
            if (window.CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        // B. 動態技能
        if (Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const sBtn = document.createElement('button');
                sBtn.className = 'btn-battle-action btn-atk-skill';
                sBtn.innerHTML = `<span class="act-icon">✨</span><span class="act-name">${skill.name}</span>`;
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
            btn.onclick = () => {
                // 切換 active 狀態
                document.querySelectorAll('.region-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderMapsInRegion(key);
            };
            regionList.appendChild(btn);
        });
        
        // 預設渲染第一個區域
        const firstKey = Object.keys(DATA.REGIONS)[0];
        if (firstKey) {
            if(regionList.firstChild) regionList.firstChild.classList.add('active');
            this.renderMapsInRegion(firstKey);
        }
    },

    // V1.8.2 地圖卡片結構升級
    renderMapsInRegion(regionKey) {
        const mapList = document.getElementById('map-list');
        if (!mapList) return;
        mapList.innerHTML = '';
        
        DATA.REGIONS[regionKey].maps.forEach(map => {
            const card = document.createElement('div');
            card.className = 'map-glass-card'; // 升級為毛玻璃卡片
            
            // 生成怪物預覽
            let monstersHtml = '<div class="map-monster-icons">';
            map.monsterIds.forEach(id => {
                const m = DATA.MONSTERS[id];
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
