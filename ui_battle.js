/**
 * V1.5.1 ui_battle.js (修正版)
 * 職責：局部渲染戰鬥內容，保留地圖與 Boss 按鈕。
 */

const UI_Battle = {
    // --- 1. 渲染戰鬥介面 (修正：改為針對 monster-display) ---
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        // 僅更新怪物資訊區，不觸動其他按鈕
        displayArea.innerHTML = `
            <div class="monster-card">
                <div class="monster-icon">${monster.icon || '👾'}</div>
                <div class="monster-name">
                    ${monster.isBoss ? '<span style="color:#f1c40f; font-weight:bold;">【領主】</span>' : ''}
                    ${monster.name}
                </div>
                <div class="hp-bar-container">
                    <div class="hp-bar" style="width: ${(monster.hp / monster.maxHp) * 100}%"></div>
                    <span class="hp-text">${Math.ceil(monster.hp)} / ${monster.maxHp}</span>
                </div>
            </div>
        `;
        
        // 更新 Boss 按鈕狀態
        this.updateBossButton();
    },

    // --- 2. 挑戰領主按鈕邏輯 ---
    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;

        // 檢查是否滿足擊殺數 (來自 player.js)
        if (player.data.killCount >= GAMEDATA.CONFIG.BOSS_KILL_REQUIRE) {
            btn.style.display = 'block';
            const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
            const bossName = GAMEDATA.MONSTERS[region.bossId].name;
            btn.innerText = `挑戰區域領主 (${bossName})`;
        } else {
            btn.style.display = 'none';
        }
    },

    // --- 3. 地圖選擇彈窗 (保持不變) ---
    showMapSelector: function() {
        let html = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>請選擇歷練區域</h3>
                    <div class="region-tabs" style="display:flex; gap:10px; margin-bottom:15px;">
                        ${GAMEDATA.REGIONS.map(r => `
                            <button class="tab-btn ${player.data.currentRegion === r.id ? 'active' : ''}" 
                                    onclick="UI_Battle.switchRegion('${r.id}')"
                                    ${player.data.unlockedRegions.includes(r.id) ? '' : 'disabled'}>
                                ${r.name} ${player.data.unlockedRegions.includes(r.id) ? '' : '🔒'}
                            </button>
                        `).join('')}
                    </div>
                    <div id="map-list">
                        ${this.renderMapsForRegion(player.data.currentRegion)}
                    </div>
                    <br>
                    <button class="nav-btn" onclick="UI_Battle.closeModal()">離開</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 區域切換邏輯 (新增：支持彈窗內換分頁)
    switchRegion: function(regionId) {
        const region = GAMEDATA.REGIONS.find(r => r.id === regionId);
        if (player.data.unlockedRegions.includes(regionId)) {
            player.data.currentRegion = regionId;
            document.getElementById('map-list').innerHTML = this.renderMapsForRegion(regionId);
        }
    },

    renderMapsForRegion: function(regionId) {
        const region = GAMEDATA.REGIONS.find(r => r.id === regionId);
        return region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" style="padding:10px; border:1px solid #555; margin-bottom:5px; cursor:pointer;">
                <strong>${m.name}</strong> <small>(Lv.${m.level})</small>
                <div style="font-size:12px; color:#888;">掉落：${m.drops.join(', ')}</div>
            </div>
        `).join('');
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeModal();
        Combat.initBattle();
        console.log(`✅ 已前往地圖 ID: ${mapId}`);
    },

    closeModal: function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
};
