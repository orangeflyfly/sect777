/**
 * V1.5.12 ui_battle.js
 * 職責：渲染怪物資訊、執行戰鬥抖動、處理日誌分類切換、管理地圖選擇彈窗。
 * 狀態：全量實裝，禁止簡化。
 */

const UI_Battle = {
    currentLogTab: 'all',

    // 1. 渲染怪物區域 (採增量更新，避免重繪閃爍)
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        const hpPercent = (monster.hp / monster.maxHp) * 100;

        // 檢查卡片是否已存在
        let card = document.getElementById('monster-card-container');
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
                        <div class="hp-bar-container" style="height:20px; background:#000; border:1px solid #444; border-radius:10px; position:relative; overflow:hidden;">
                            <div id="m-hp-bar" class="hp-bar" style="height:100%; background:linear-gradient(90deg, #c0392b, #e74c3c); transition: width 0.3s;"></div>
                            <div id="m-hp-txt" class="hp-text" style="position:absolute; width:100%; text-align:center; color:#fff; font-size:11px; line-height:20px; text-shadow:1px 1px 2px #000;"></div>
                        </div>
                    </div>
                    <div class="click-tip" style="font-size: 10px; color: #666; margin-top: 8px;">點擊妖獸圖標發動手動攻擊</div>
                </div>
            `;
            card = document.getElementById('monster-card-container');
        }

        // 實時更新數值
        const nameTxt = document.getElementById('m-name-txt');
        const hpBar = document.getElementById('m-hp-bar');
        const hpTxt = document.getElementById('m-hp-txt');

        if (nameTxt) {
            nameTxt.innerHTML = `${monster.isBoss ? '<span style="color:var(--legend)">【區域領主】</span>' : ''}${monster.name}`;
        }
        if (hpBar) {
            hpBar.style.width = Math.max(0, hpPercent) + "%";
        }
        if (hpTxt) {
            hpTxt.innerText = `${Math.ceil(Math.max(0, monster.hp))} / ${monster.maxHp}`;
        }
        
        this.updateBossButton();
    },

    // 2. 觸發打擊抖動感 (對接 combat.js)
    triggerShake: function() {
        const card = document.getElementById('monster-card-container');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // 強制重繪
            card.classList.add('shake');
            // 動畫結束後清除 class
            card.onanimationend = () => card.classList.remove('shake');
        }
    },

    // 3. 1.4.1 日誌分類切換邏輯
    switchLog: function(tab) {
        this.currentLogTab = tab;
        
        // 更新按鈕視覺狀態
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            // 透過 onclick 屬性判斷
            if (t.getAttribute('onclick').includes(`'${tab}'`)) {
                t.classList.add('active');
            }
        });

        this.refreshLogVisibility();
    },

    // 核心：即時過濾顯示日誌
    refreshLogVisibility: function() {
        const logs = document.querySelectorAll('.log-item');
        logs.forEach(log => {
            const isCombat = log.classList.contains('combat');
            const isLoot = log.classList.contains('loot');
            const isSystem = log.classList.contains('system');

            if (this.currentLogTab === 'all') {
                log.style.display = 'block';
            } else if (this.currentLogTab === 'combat') {
                // 鬥法分頁顯示：鬥法訊息 + 系統提示
                log.style.display = (isCombat || isSystem) ? 'block' : 'none';
            } else if (this.currentLogTab === 'loot') {
                // 獲取分頁顯示：獲取訊息 + 系統提示
                log.style.display = (isLoot || isSystem) ? 'block' : 'none';
            }
        });
    },

    // 4. 地圖選擇彈窗 (1.4.1 美學風格)
    showMapSelector: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        if (!region) return;

        let mapHtml = region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" 
                 style="background:#1a1a1a; margin-bottom:12px; padding:15px; border-radius:10px; border-left:4px solid var(--gold); cursor:pointer; transition: transform 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff; font-size:1.1em;">${m.name}</strong>
                    <span style="font-size:12px; color:var(--gold);">等級 ${m.level}</span>
                </div>
                <div style="font-size:11px; color:#888; margin-top:6px;">掉落精華: ${m.drops.join('、')}</div>
            </div>
        `).join('');

        let modalHtml = `
            <div id="map-modal" class="modal-overlay">
                <div class="modal-content">
                    <h3 style="color:var(--gold); text-align:center; margin-top:0; letter-spacing:2px;">— 挑選歷練之地 —</h3>
                    <div style="max-height:350px; overflow-y:auto; padding-right:5px;">
                        ${mapHtml}
                    </div>
                    <button onclick="UI_Battle.closeMapModal()" style="width:100%; margin-top:15px; padding:12px; background:#333; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">暫且作罷</button>
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
        player.showToast("已前往新的歷練之地");
    },

    closeMapModal: function() {
        const modal = document.getElementById('map-modal');
        if (modal) modal.remove();
    },

    // 5. 更新領主挑戰按鈕
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

console.log("✅ [V1.5.12] ui_battle.js 戰鬥視覺全量載入。");
