/**
 * V1.5.12 ui_battle.js
 * 職責：渲染妖獸畫面、執行打擊抖動、處理地圖選擇、過濾分類日誌。
 * 狀態：100% 全量實裝，修正圖標不換與持續抖動問題。
 */

const UI_Battle = {
    currentLogTab: 'all',

    // 1. 渲染妖獸介面 (修正：確保圖標、名字隨數據強制更新)
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        const hpPercent = (monster.hp / monster.maxHp) * 100;

        // A. 建立基礎骨架 (若不存在則生成)
        let card = document.getElementById('monster-card-container');
        if (!card) {
            displayArea.innerHTML = `
                <div id="monster-card-container" class="monster-card">
                    <div class="monster-visual">
                        <div id="m-icon" class="monster-icon" onclick="Combat.playerAttack(true)"></div>
                    </div>
                    <div id="m-name-txt" class="monster-name"></div>
                    <div class="hp-container">
                        <div class="bar-container hp" style="height:20px; border-radius:10px;">
                            <div id="m-hp-bar" class="bar-fill hp" style="transition: width 0.3s;"></div>
                            <div id="m-hp-txt" class="bar-text" style="line-height:20px; font-size:11px;"></div>
                        </div>
                    </div>
                    <div style="font-size:10px; color:#555; margin-top:10px;">點擊上方圖標手動助戰</div>
                </div>
            `;
        }

        // B. 強制更新動態數據 (核心修正：移出 if 外，確保每隻怪都不同)
        const iconEl = document.getElementById('m-icon');
        const nameTxt = document.getElementById('m-name-txt');
        const hpBar = document.getElementById('m-hp-bar');
        const hpTxt = document.getElementById('m-hp-txt');

        if (iconEl) iconEl.innerText = monster.icon || '👾';
        if (nameTxt) {
            nameTxt.innerHTML = `${monster.isBoss ? '<span style="color:var(--legend); font-size:0.8em;">【區域領主】</span><br>' : ''}${monster.name}`;
        }
        if (hpBar) hpBar.style.width = Math.max(0, hpPercent) + "%";
        if (hpTxt) hpTxt.innerText = `${Math.ceil(Math.max(0, monster.hp))} / ${monster.maxHp}`;
        
        // C. 更新領主按鈕狀態
        this.updateBossButton();
    },

    // 2. 執行打擊抖動 (修正：確保動畫重置，不會持續抖動)
    triggerShake: function() {
        const card = document.getElementById('monster-card-container');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // 強制瀏覽器重繪 (Reflow)
            card.classList.add('shake');
            
            // 監聽動畫結束，自動清理，防止 class 堆積
            card.addEventListener('animationend', () => {
                card.classList.remove('shake');
            }, { once: true });
        }
    },

    // 3. 1.4.1 分類日誌切換與即時過濾
    switchLog: function(tab) {
        this.currentLogTab = tab;
        
        // 更新標籤視覺
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            // 根據按鈕內容或 onclick 判定
            if (t.getAttribute('onclick').includes(`'${tab}'`)) {
                t.classList.add('active');
            }
        });

        this.refreshLogVisibility();
    },

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

    // 4. 區域選擇彈窗 (1.4.1 經典地圖選單)
    showMapSelector: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        if (!region) return;

        let mapHtml = region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" 
                 style="background:#1a1a1a; margin-bottom:12px; padding:15px; border-radius:10px; border-left:4px solid var(--gold); cursor:pointer;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff; font-size:1.1em;">${m.name}</strong>
                    <span style="font-size:12px; color:var(--gold);">等級 ${m.level}</span>
                </div>
                <div style="font-size:11px; color:#888; margin-top:6px;">妖獸出沒: ${m.monsterIds.map(id => GAMEDATA.MONSTERS[id].name).join('、')}</div>
            </div>
        `).join('');

        let modalHtml = `
            <div id="map-modal" class="modal-overlay" onclick="if(event.target==this) UI_Battle.closeMapModal()">
                <div class="modal-content" style="border:1px solid var(--gold); background:#111;">
                    <h3 style="color:var(--gold); text-align:center; margin-top:0;">— 歷練之地 —</h3>
                    <div style="max-height:300px; overflow-y:auto; padding-right:5px;">
                        ${mapHtml}
                    </div>
                    <button onclick="UI_Battle.closeMapModal()" style="width:100%; margin-top:15px; padding:10px; background:#333; color:#fff; border:none; border-radius:6px; font-weight:bold;">暫且作罷</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeMapModal();
        Combat.initBattle(); // 重新點火
        player.showToast("已更換歷練之地");
    },

    closeMapModal: function() {
        const modal = document.getElementById('map-modal');
        if (modal) modal.remove();
    },

    // 5. 更新領主按鈕
    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;
        
        const isReady = player.data.killCount >= (GAMEDATA.CONFIG.BOSS_KILL_REQUIRE || 10);
        btn.style.display = isReady ? 'block' : 'none';
        
        if (isReady) {
            const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
            const boss = GAMEDATA.MONSTERS[region.bossId];
            btn.innerText = `🔥 挑戰區域領主：${boss.name}`;
        }
    }
};

console.log("✅ [V1.5.12] ui_battle.js 歷練視覺系統全量載入。");
