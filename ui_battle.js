const UI_Battle = {
    // 渲染戰鬥介面
    renderBattle: function(monster) {
        // 1. 抓取 HTML 裡的容器
        const displayArea = document.getElementById('monster-display');
        
        // 2. 防呆檢查：如果 HTML 沒寫好 ID，這裡就會報錯（打X）
        if (!displayArea) {
            console.error("❌ 找不到 monster-display 容器！請檢查 index.html");
            return;
        }

        if (!monster) return;

        const hpPercent = (monster.hp / monster.maxHp) * 100;

        // 3. 注入 1.4.1 的怪物卡片結構
        displayArea.innerHTML = `
            <div class="monster-card ${monster.isBoss ? 'r-5' : 'r-2'}">
                <div class="monster-icon" onclick="Combat.playerAttack(true)" style="cursor:pointer;">
                    ${monster.icon || '👾'}
                    <div class="click-hint" style="font-size:12px; color:gold;">[點擊斬妖]</div>
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
        // 判斷擊殺數是否達標 (1.5 版新邏輯)
        if (player.data.killCount >= 10) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    },

    showMapSelector: function() {
        // 此處保持之前的彈窗邏輯
        let html = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3 style="color:gold;">選擇歷練區域</h3>
                    <div class="map-list">
                        ${this.renderMaps()}
                    </div>
                    <button class="nav-btn" onclick="UI_Battle.closeModal()" style="margin-top:15px; width:100%;">離開</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    renderMaps: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        return region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" style="border:1px solid #444; margin:5px; padding:10px; cursor:pointer;">
                <b>${m.name}</b> <small>(Lv.${m.level})</small>
            </div>
        `).join('');
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeModal();
        Combat.initBattle();
    },

    closeModal: function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
};
