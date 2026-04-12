/**
 * V1.5.10 ui_battle.js
 * 職責：渲染怪物卡片、處理戰鬥抖動、實裝分類日誌切換、地圖選擇彈窗。
 */

const UI_Battle = {
    currentLogTab: 'all',

    // 1. 渲染怪物區域 (包含 1.4.1 的視覺結構)
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        const hpPercent = (monster.hp / monster.maxHp) * 100;

        // 構建與 1.4.1 相同的 monster-card 結構
        displayArea.innerHTML = `
            <div id="monster-card-container" class="monster-card">
                <div class="monster-visual">
                    <div class="monster-icon" onclick="Combat.playerAttack(true)">
                        ${monster.icon || '👾'}
                    </div>
                </div>
                <div class="monster-name">
                    ${monster.isBoss ? '<span style="color:var(--legend)">【領主】</span>' : ''}${monster.name}
                </div>
                <div class="hp-container monster-hp">
                    <div class="hp-bar-container">
                        <div class="hp-bar" style="width: ${Math.max(0, hpPercent)}%"></div>
                        <div class="hp-text">${Math.ceil(monster.hp)} / ${monster.maxHp}</div>
                    </div>
                </div>
                <div class="click-tip" style="font-size: 10px; color: #666; margin-top: 5px;">點擊圖標手動斬妖</div>
            </div>
        `;
        
        this.updateBossButton();
        this.refreshLogVisibility(); // 確保切換回來時日誌顯示正確
    },

    // 2. 實裝打擊感：抖動效果 (對接 combat.js)
    triggerShake: function() {
        const card = document.getElementById('monster-card-container');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // 觸發重繪，確保動畫能重複播放
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 200);
        }
    },

    // 3. 1.4.1 分類日誌切換邏輯
    switchLog: function(tab) {
        this.currentLogTab = tab;
        
        // 更新按鈕樣式
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            if (t.innerText === (tab === 'all' ? '全部' : tab === 'combat' ? '鬥法' : '獲取')) {
                t.classList.add('active');
            }
        });

        this.refreshLogVisibility();
    },

    refreshLogVisibility: function() {
        const logs = document.querySelectorAll('.log-item');
        logs.forEach(log => {
            if (this.currentLogTab === 'all') {
                log.style.display = 'block';
            } else {
                // 檢查 classList 是否包含對應的分類 (combat, loot, system)
                if (log.classList.contains(this.currentLogTab)) {
                    log.style.display = 'block';
                } else if (this.currentLogTab === 'combat' && log.classList.contains('system')) {
                    // 系統訊息在鬥法頁面也顯示
                    log.style.display = 'block';
                } else {
                    log.style.display = 'none';
                }
            }
        });
    },

    // 4. 地圖選擇彈窗 (1.4.1 美化版)
    showMapSelector: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        if (!region) return;

        let mapHtml = region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" 
                 style="background:#222; margin-bottom:10px; padding:15px; border-radius:8px; border-left:4px solid var(--gold); cursor:pointer;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:white;">${m.name}</strong>
                    <span style="font-size:12px; color:var(--gold);">Lv.${m.level}</span>
                </div>
                <div style="font-size:11px; color:#888; margin-top:5px;">產出: ${m.drops.join('、')}</div>
            </div>
        `).join('');

        let modalHtml = `
            <div id="map-modal" class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:1000; display:flex; justify-content:center; align-items:center;">
                <div class="modal-content" style="background:#1a1a1a; width:85%; max-width:400px; padding:20px; border:1px solid var(--gold); border-radius:12px;">
                    <h3 style="color:var(--gold); text-align:center; margin-top:0;">探索歷練之地</h3>
                    <div style="max-height:350px; overflow-y:auto; padding-right:5px;">
                        ${mapHtml}
                    </div>
                    <button onclick="UI_Battle.closeMapModal()" style="width:100%; margin-top:15px; padding:12px; background:#333; color:white; border:none; border-radius:6px; cursor:pointer;">返回</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeMapModal();
        Combat.initBattle();
        console.log(`✅ 前往地圖 ID: ${mapId}`);
    },

    closeMapModal: function() {
        const modal = document.getElementById('map-modal');
        if (modal) modal.remove();
    },

    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;
        
        const isReady = player.data.killCount >= (GAMEDATA.CONFIG.BOSS_KILL_REQUIRE || 10);
        btn.style.display = isReady ? 'block' : 'none';
        
        if (isReady) {
            const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
            const boss = GAMEDATA.MONSTERS[region.bossId];
            btn.innerText = `挑戰區域領主：${boss.name}`;
        }
    }
};

console.log("✅ [V1.5.10] ui_battle.js 戰鬥視覺全量載入，日誌過濾與抖動已啟動。");
