/**
 * V1.5 ui_battle.js
 * 職責：戰鬥畫面渲染、地圖彈窗、Boss 按鈕控制。
 */

const UI_Battle = {
    // --- 1. 渲染戰鬥介面 (1.4.1 繼承 + 1.5 中文化/數值強同步) ---
    renderBattle: function(monster) {
        const battleArea = document.getElementById('battle-screen');
        if (!monster) return;

        // 強制更新血條與名稱 (解決 1.4.1 神隱問題)
        battleArea.innerHTML = `
            <div class="monster-info">
                <div class="monster-icon">${monster.icon || '👾'}</div>
                <div class="monster-name">${monster.isBoss ? '<b style="color:#f1c40f">【領主】</b>' : ''}${monster.name}</div>
                <div class="hp-bar-container">
                    <div class="hp-bar" style="width: ${(monster.hp / monster.maxHp) * 100}%"></div>
                    <span class="hp-text">${Math.ceil(monster.hp)} / ${monster.maxHp}</span>
                </div>
            </div>
            <div id="battle-logs"></div>
        `;
        
        // 1.5 新增：檢查是否達到 Boss 挑戰門檻
        this.updateBossButton();
    },

    // --- 2. 挑戰領主按鈕邏輯 (1.5 新增) ---
    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;

        if (player.data.killCount >= GAMEDATA.CONFIG.BOSS_KILL_REQUIRE) {
            btn.style.display = 'block';
            btn.innerText = `挑戰區域領主 (${GAMEDATA.MONSTERS[GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion).bossId].name})`;
        } else {
            btn.style.display = 'none';
        }
    },

    // --- 3. 地圖選擇彈窗 (1.5 更新：區域分頁化) ---
    showMapSelector: function() {
        // 創建彈窗 HTML
        let html = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>請選擇歷練區域</h3>
                    <div class="region-tabs">
                        ${GAMEDATA.REGIONS.map(r => `
                            <button class="tab-btn ${player.data.currentRegion === r.id ? 'active' : ''}" 
                                    onclick="UI_Battle.switchRegion('${r.id}')"
                                    ${player.data.unlockedRegions.includes(r.id) ? '' : 'disabled'}>
                                ${r.name} ${player.data.unlockedRegions.includes(r.id) ? '' : '🔒'}
                            </button>
                        `).join('')}
                    </div>
                    <div class="map-list">
                        ${this.renderMapsForRegion(player.data.currentRegion)}
                    </div>
                    <button onclick="UI_Battle.closeModal()">關閉</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    renderMapsForRegion: function(regionId) {
        const region = GAMEDATA.REGIONS.find(r => r.id === regionId);
        return region.maps.map(m => `
            <div class="map-card ${player.data.currentMapId === m.id ? 'current' : ''}" 
                 onclick="UI_Battle.selectMap(${m.id})">
                <h4>${m.name} (Lv.${m.level})</h4>
                <p>掉落：${m.drops.join(', ')}</p>
            </div>
        `).join('');
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0; // 切換地圖重置擊殺數
        this.closeModal();
        Combat.initBattle(); // 重新開始戰鬥 (下一動檔案)
        console.log(`✅ 已前往：${mapId}`);
    },

    closeModal: function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
};

console.log("✅ [V1.5 戰鬥視覺] ui_battle.js 已裝載，彈窗地圖系統就緒。");
