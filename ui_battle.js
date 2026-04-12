/**
 * V1.5.11 ui_battle.js (修正版)
 * 職責：渲染戰鬥、即時日誌過濾、穩定抖動機制。
 */

const UI_Battle = {
    currentLogTab: 'all',

    // 1. 渲染怪物區域
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        const hpPercent = (monster.hp / monster.maxHp) * 100;

        // 僅在怪物更換或初始化時才重刷整個 HTML，減少閃爍
        // 這裡我們優化為：如果結構已存在，只更新數值
        const card = document.getElementById('monster-card-container');
        if (!card) {
            displayArea.innerHTML = `
                <div id="monster-card-container" class="monster-card">
                    <div class="monster-visual">
                        <div class="monster-icon" onclick="Combat.playerAttack(true)">
                            ${monster.icon || '👾'}
                        </div>
                    </div>
                    <div id="m-name-txt" class="monster-name"></div>
                    <div class="hp-container monster-hp">
                        <div class="hp-bar-container">
                            <div id="m-hp-bar" class="hp-bar"></div>
                            <div id="m-hp-txt" class="hp-text"></div>
                        </div>
                    </div>
                    <div class="click-tip" style="font-size: 10px; color: #666; margin-top: 5px;">點擊圖標手動斬妖</div>
                </div>
            `;
        }

        // 實時更新數值
        const nameTxt = document.getElementById('m-name-txt');
        const hpBar = document.getElementById('m-hp-bar');
        const hpTxt = document.getElementById('m-hp-txt');

        if (nameTxt) nameTxt.innerHTML = `${monster.isBoss ? '<span style="color:var(--legend)">【領主】</span>' : ''}${monster.name}`;
        if (hpBar) hpBar.style.width = Math.max(0, hpPercent) + "%";
        if (hpTxt) hpTxt.innerText = `${Math.ceil(Math.max(0, monster.hp))} / ${monster.maxHp}`;
        
        this.updateBossButton();
    },

    // 2. 穩定抖動機制
    triggerShake: function() {
        const card = document.getElementById('monster-card-container');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // 強制重繪
            card.classList.add('shake');
            // 動畫結束後自動移除，避免 class 堆積
            card.onanimationend = () => card.classList.remove('shake');
        }
    },

    // 3. 改進的日誌切換 (不依賴文字判定)
    switchLog: function(tab) {
        this.currentLogTab = tab;
        
        // 更新按鈕樣式 (改用索引或更穩定的方式)
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            // 根據傳入的 tab 字串來比對 (對應 HTML onclick 傳入的值)
            if (tab === 'all' && t.getAttribute('onclick').includes('all')) t.classList.add('active');
            if (tab === 'combat' && t.getAttribute('onclick').includes('combat')) t.classList.add('active');
            if (tab === 'loot' && t.getAttribute('onclick').includes('loot')) t.classList.add('active');
        });

        this.refreshLogVisibility();
    },

    // 核心修正：讓日誌過濾更徹底
    refreshLogVisibility: function() {
        const logs = document.querySelectorAll('.log-item');
        logs.forEach(log => {
            const isCombat = log.classList.contains('combat');
            const isLoot = log.classList.contains('loot');
            const isSystem = log.classList.contains('system');

            if (this.currentLogTab === 'all') {
                log.style.display = 'block';
            } else if (this.currentLogTab === 'combat') {
                log.style.display = (isCombat || isSystem) ? 'block' : 'none';
            } else if (this.currentLogTab === 'loot') {
                log.style.display = (isLoot || isSystem) ? 'block' : 'none';
            }
        });
    },

    // 4. 地圖選擇彈窗
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
