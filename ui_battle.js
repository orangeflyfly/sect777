/**
 * V1.5.7 ui_battle.js
 * 職責：渲染怪物資訊、血條、地圖彈窗。
 */
const UI_Battle = {
    // 渲染怪物核心區域
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        // 計算血量百分比
        const hpPercent = (monster.hp / monster.maxHp) * 100;

        // 重新構建怪物卡片 (包含手動點擊攻擊功能)
        displayArea.innerHTML = `
            <div class="monster-card ${monster.isBoss ? 'r-5' : 'r-2'}">
                <div class="monster-icon" onclick="Combat.playerAttack(true)">
                    ${monster.icon || '👾'}
                    <div class="click-hint">點擊斬妖</div>
                </div>
                <div class="monster-name">
                    ${monster.isBoss ? '<b style="color:gold;">【領主】</b>' : ''}${monster.name}
                </div>
                <div class="hp-bar-container">
                    <div class="hp-bar" style="width: ${Math.max(0, hpPercent)}%"></div>
                    <span class="hp-text">${Math.ceil(monster.hp)} / ${monster.maxHp}</span>
                </div>
            </div>
        `;
        
        this.updateBossButton();
    },

    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;
        // 只有在歷練頁且滿足擊殺數時才顯示
        if (player.data.killCount >= (GAMEDATA.CONFIG.BOSS_KILL_REQUIRE || 10)) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    },

    // 地圖選擇彈窗
    showMapSelector: function() {
        let html = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3 style="color:gold;">選擇歷練區域</h3>
                    <div class="map-list" style="max-height:300px; overflow-y:auto;">
                        ${this.renderMaps()}
                    </div>
                    <button class="nav-btn" onclick="UI_Battle.closeModal()" style="margin-top:15px; width:100%;">關閉</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    renderMaps: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        return region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})">
                <b>${m.name}</b> <small>(Lv.${m.level})</small>
                <div style="font-size:11px; color:#888;">掉落: ${m.drops.join('、')}</div>
            </div>
        `).join('');
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeModal();
        Combat.initBattle(); // 重新開始戰鬥
    },

    closeModal: function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
};
