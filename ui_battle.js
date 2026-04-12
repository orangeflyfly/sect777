/**
 * V1.5.9 ui_battle.js (強力加固版)
 * 增加自動檢測功能，防止報錯導致遊戲中斷
 */
const UI_Battle = {
    // 渲染怪物核心區域
    renderBattle: function(monster) {
        // 1. 檢查 HTML 容器
        const displayArea = document.getElementById('monster-display');
        if (!displayArea) {
            console.error("❌ 錯誤：HTML 找不到 'monster-display'，請檢查 index.html");
            return;
        }

        // 2. 檢查怪物資料是否存在
        if (!monster) {
            displayArea.innerHTML = "<div style='color:red;'>正在搜尋妖獸...</div>";
            return;
        }

        // 3. 計算血量 (防止除以零)
        const maxHp = monster.maxHp || 1;
        const hp = monster.hp || 0;
        const hpPercent = (hp / maxHp) * 100;

        // 4. 執行渲染 (將 1.4.1 的點擊感找回來)
        try {
            displayArea.innerHTML = `
                <div class="monster-card ${monster.isBoss ? 'r-5' : 'r-2'}">
                    <div class="monster-icon" onclick="Combat.playerAttack(true)" style="cursor:pointer; position:relative;">
                        ${monster.icon || '👾'}
                        <div style="font-size:12px; color:#f1c40f; position:absolute; bottom:-10px; width:100%; text-align:center;">[點擊斬妖]</div>
                    </div>
                    <div class="monster-name" style="margin-top:15px; font-weight:bold;">
                        ${monster.isBoss ? '<span style="color:gold;">【領主】</span>' : ''}${monster.name || '未知生物'}
                    </div>
                    <div class="hp-bar-container" style="background:#000; border:1px solid #444; height:20px; border-radius:10px; margin-top:10px; position:relative; overflow:hidden;">
                        <div class="hp-bar" style="width: ${Math.max(0, hpPercent)}%; background:linear-gradient(to right, #e74c3c, #c0392b); height:100%; transition: width 0.2s;"></div>
                        <span style="position:absolute; width:100%; left:0; top:0; font-size:12px; line-height:20px; color:white; text-shadow:1px 1px 1px #000; text-align:center;">
                            ${Math.ceil(hp)} / ${maxHp}
                        </span>
                    </div>
                </div>
            `;
            this.updateBossButton();
        } catch (e) {
            console.error("❌ 渲染怪物時發生錯誤:", e);
        }
    },

    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;
        // 確保數據存在才比較
        const killCount = (player && player.data) ? player.data.killCount : 0;
        const require = (GAMEDATA && GAMEDATA.CONFIG) ? GAMEDATA.CONFIG.BOSS_KILL_REQUIRE : 10;
        
        btn.style.display = (killCount >= require) ? 'block' : 'none';
    },

    showMapSelector: function() {
        if (!GAMEDATA || !GAMEDATA.REGIONS) {
            alert("數據未載入，無法打開地圖");
            return;
        }
        
        let html = `
            <div class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999; display:flex; justify-content:center; align-items:center;">
                <div class="modal-content" style="background:#222; padding:20px; border-radius:10px; border:1px solid gold; width:80%; max-width:400px;">
                    <h3 style="color:gold; text-align:center;">選擇歷練區域</h3>
                    <div id="modal-map-list" style="max-height:300px; overflow-y:auto;">
                        ${this.renderMaps()}
                    </div>
                    <button onclick="UI_Battle.closeModal()" style="width:100%; margin-top:15px; padding:10px; background:#444; color:white; border:none; border-radius:5px;">離開</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    renderMaps: function() {
        try {
            const currentRegionId = player.data.currentRegion;
            const region = GAMEDATA.REGIONS.find(r => r.id === currentRegionId);
            if (!region) return "找不到區域數據";

            return region.maps.map(m => `
                <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" style="background:#333; margin:8px 0; padding:12px; border-radius:5px; border-left:4px solid #d4af37; cursor:pointer;">
                    <div style="font-weight:bold;">${m.name} <small style="color:#888;">(Lv.${m.level})</small></div>
                    <div style="font-size:11px; color:#aaa; margin-top:4px;">掉落：${m.drops.join(', ')}</div>
                </div>
            `).join('');
        } catch (e) {
            return "地圖渲染失敗";
        }
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeModal();
        if (typeof Combat !== 'undefined') Combat.initBattle();
    },

    closeModal: function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
};
