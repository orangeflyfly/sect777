/**
 * V1.6.0 ui_battle.js (戰鬥視覺加固版)
 * 職責：妖獸渲染、抖動特效、地圖導航、日誌過濾。
 */

const UI_Battle = {
    currentLogTab: 'all',
    elements: {}, // UI 元素緩存

    // 1. 渲染妖獸介面
    renderBattle: function(monster) {
        const displayArea = document.getElementById('monster-display');
        if (!displayArea || !monster) return;

        // 骨架防禦性生成
        if (!document.getElementById('monster-card-container')) {
            displayArea.innerHTML = `
                <div id="monster-card-container" class="monster-card">
                    <div class="monster-visual">
                        <div id="m-icon" class="monster-icon" onclick="Combat.playerAttack(true)"></div>
                    </div>
                    <div id="m-name-txt" class="monster-name"></div>
                    <div class="hp-container">
                        <div class="bar-container hp" style="height:20px; border-radius:10px; background:#222; overflow:hidden;">
                            <div id="m-hp-bar" class="bar-fill hp" style="width:100%; height:100%; background:var(--hp-color, #e74c3c); transition: width 0.2s ease-out;"></div>
                            <div id="m-hp-txt" class="bar-text" style="position:absolute; width:100%; text-align:center; line-height:20px; font-size:11px; color:#fff; font-weight:bold;"></div>
                        </div>
                    </div>
                    <div style="font-size:11px; color:var(--text-dim); margin-top:10px; letter-spacing:1px;">點擊圖標手動助戰</div>
                </div>
            `;
            this.cacheMonsterUI();
        }

        const hpPercent = (monster.hp / monster.maxHp) * 100;
        const el = this.elements;

        // 強制更新動態數據
        if (el.icon) el.icon.innerText = monster.icon || '👾';
        if (el.name) {
            el.name.innerHTML = `${monster.isBoss ? '<span class="boss-tag" style="color:var(--legend, #f1c40f); font-size:0.8em; display:block; margin-bottom:4px;">【區域領主】</span>' : ''}${monster.name}`;
        }
        if (el.hpBar) el.hpBar.style.width = Math.max(0, hpPercent) + "%";
        if (el.hpTxt) el.hpTxt.innerText = `${Math.ceil(Math.max(0, monster.hp))} / ${monster.maxHp}`;
        
        this.updateBossButton();
    },

    cacheMonsterUI: function() {
        this.elements = {
            icon: document.getElementById('m-icon'),
            name: document.getElementById('m-name-txt'),
            hpBar: document.getElementById('m-hp-bar'),
            hpTxt: document.getElementById('m-hp-txt'),
            card: document.getElementById('monster-card-container')
        };
    },

    // 2. 執行打擊抖動
    triggerShake: function() {
        const card = this.elements.card || document.getElementById('monster-card-container');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // 觸發重繪
            card.classList.add('shake');
            
            card.addEventListener('animationend', () => {
                card.classList.remove('shake');
            }, { once: true });
        }
    },

    // 3. 日誌過濾系統
    switchLog: function(tab) {
        this.currentLogTab = tab;
        
        // 更新標籤視覺 (優化選擇器)
        document.querySelectorAll('.log-tab').forEach(t => {
            const clickAttr = t.getAttribute('onclick') || "";
            t.classList.toggle('active', clickAttr.includes(`'${tab}'`));
        });

        this.refreshLogVisibility();
    },

    refreshLogVisibility: function() {
        const logs = document.querySelectorAll('.log-item');
        const tab = this.currentLogTab;

        logs.forEach(log => {
            if (tab === 'all') {
                log.style.display = 'block';
            } else {
                const hasClass = log.classList.contains(tab) || log.classList.contains('system');
                log.style.display = hasClass ? 'block' : 'none';
            }
        });
    },

    // 4. 區域選擇彈窗 (適配 V1.6.0 數據結構)
    showMapSelector: function() {
        // 加固：從對象結構中抓取區域
        const region = GAMEDATA.REGIONS[player.data.currentRegion];
        if (!region) return;

        let mapHtml = region.maps.map(m => `
            <div class="map-card" onclick="UI_Battle.selectMap(${m.id})" 
                 style="background:rgba(255,255,255,0.03); margin-bottom:12px; padding:15px; border-radius:10px; border-left:4px solid var(--gold); cursor:pointer; transition: 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fff; font-size:1.1em;">${m.name}</strong>
                    <span style="font-size:12px; color:var(--gold); border:1px solid rgba(212,175,55,0.3); padding:2px 6px; border-radius:4px;">Lv.${m.level}</span>
                </div>
                <div style="font-size:11px; color:#666; margin-top:8px; line-height:1.4;">
                    妖獸出沒: ${m.monsterIds.map(id => {
                        const mData = GAMEDATA.getMonster(id);
                        return mData ? mData.name : "未知";
                    }).join('、')}
                </div>
            </div>
        `).join('');

        let modalHtml = `
            <div id="map-modal" class="modal-overlay" onclick="if(event.target==this) UI_Battle.closeMapModal()">
                <div class="modal-content" style="border:1px solid var(--gold); background: linear-gradient(135deg, #111 0%, #0a0a0a 100%); box-shadow: 0 0 30px rgba(212,175,55,0.2);">
                    <h3 style="color:var(--gold); text-align:center; margin-top:0; letter-spacing:4px;">— 歷練之地 —</h3>
                    <div class="custom-scroll" style="max-height:350px; overflow-y:auto; padding-right:8px;">
                        ${mapHtml}
                    </div>
                    <button class="close-btn" onclick="UI_Battle.closeMapModal()" style="width:100%; margin-top:15px; padding:12px; background:transparent; color:#888; border:1px solid #333; border-radius:6px; cursor:pointer;">暫且作罷</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    selectMap: function(mapId) {
        player.data.currentMapId = mapId;
        player.data.killCount = 0;
        this.closeMapModal();
        
        // 視覺反饋：清空當前戰鬥顯示
        const el = this.elements;
        if (el.name) el.name.innerText = "轉移陣法中...";
        
        Combat.initBattle(); 
        player.showToast("已成功傳送至新區域", "gold");
    },

    closeMapModal: function() {
        const modal = document.getElementById('map-modal');
        if (modal) modal.remove();
    },

    // 5. 更新領主挑戰按鈕
    updateBossButton: function() {
        const btn = document.getElementById('boss-btn');
        if (!btn) return;
        
        const region = GAMEDATA.REGIONS[player.data.currentRegion];
        if (!region) return;

        const req = GAMEDATA.CONFIG?.BOSS_KILL_REQUIRE || 10;
        const isReady = player.data.killCount >= req;
        
        btn.style.display = isReady ? 'block' : 'none';
        
        if (isReady) {
            const boss = GAMEDATA.getMonster(region.bossId);
            btn.innerText = `🔥 挑戰區域領主：${boss.name}`;
            btn.className = "boss-active-btn"; // 建議在 CSS 中加入發光動畫
        }
    }
};

console.log("✅ [V1.6.0] ui_battle.js 歷練視覺系統加固完成。");
