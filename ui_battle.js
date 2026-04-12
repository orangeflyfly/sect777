/**
 * V1.7.0 ui_battle.js
 * 職責：戰鬥分頁 UI 渲染、日誌摺疊控制、三級地圖選擇與境界檢查。
 */

const UI_Battle = {
    // 1. 初始化
    init() {
        this.renderMapName();
        // 確保進入頁面時日誌是展開的
        const logSystem = document.getElementById('log-system');
        if (logSystem) logSystem.classList.add('expanded');
    },

    // 2. 更新地圖名稱顯示
    renderMapName() {
        const mapNameEl = document.getElementById('current-map-name');
        const mapId = Player.data.currentMap;
        
        // 從資料庫找地圖名稱
        let name = "未知地域";
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) {
                name = map.name;
                break;
            }
        }
        if (mapNameEl) mapNameEl.innerText = name;
    },

    // 3. 更新怪物卡片資訊
    updateMonster(monster) {
        const display = document.getElementById('monster-display');
        const icon = document.getElementById('monster-icon');
        const name = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-text');

        if (!monster) return;

        display.classList.remove('monster-die'); // 確保新怪物沒有死亡效果
        icon.innerText = monster.icon;
        name.innerText = monster.name;
        
        const hpPercent = (monster.currentHp / monster.hp) * 100;
        hpFill.style.width = `${hpPercent}%`;
        hpText.innerText = `${Math.ceil(monster.currentHp)}/${monster.hp}`;
    },

    // 4. 實裝：日誌摺疊功能
    toggleLog() {
        const logSystem = document.getElementById('log-system');
        const toggleBtn = document.getElementById('log-toggle');
        
        if (logSystem.classList.contains('expanded')) {
            logSystem.classList.remove('expanded');
            logSystem.classList.add('collapsed');
            toggleBtn.innerText = "展開 🔽";
        } else {
            logSystem.classList.remove('collapsed');
            logSystem.classList.add('expanded');
            toggleBtn.innerText = "收合 🔼";
        }
    },

    // 5. 實裝：搜尋狀態切換 (解決卡住感)
    showSearching(active) {
        const monsterCard = document.getElementById('monster-display');
        const searchingBox = document.getElementById('searching-display');

        if (active) {
            monsterCard.style.display = 'none';
            searchingBox.style.display = 'block';
        } else {
            monsterCard.style.display = 'block';
            searchingBox.style.display = 'none';
        }
    },

    // 6. 實裝：死亡消散動畫
    playMonsterDieAnim() {
        const monsterCard = document.getElementById('monster-display');
        monsterCard.classList.add('monster-die');
    },

    // 7. 戰鬥日誌輸出
    log(msg, type = 'normal') {
        const logList = document.getElementById('log-list');
        if (!logList) return;

        const div = document.createElement('div');
        div.className = `log-item log-${type}`;
        
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        div.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;

        logList.appendChild(div);

        // 自動捲動到底部
        logList.scrollTop = logList.scrollHeight;

        // 限制日誌數量，防止手機版過卡
        if (logList.childElementCount > GAMEDATA.CONFIG.LOG_LIMIT) {
            logList.removeChild(logList.firstChild);
        }
    },

    // 8. 實裝：三級地圖選擇器 (區域 -> 地圖)
    showMapSelector() {
        const modal = document.getElementById('modal-map');
        modal.style.display = 'flex';
        this.renderRegions();
    },

    // 渲染區域清單 (第一層)
    renderRegions() {
        const regionList = document.getElementById('region-list');
        const mapList = document.getElementById('map-list');
        regionList.innerHTML = '';
        mapList.innerHTML = ''; // 清空地圖層

        for (let rId in GAMEDATA.REGIONS) {
            const region = GAMEDATA.REGIONS[rId];
            const btn = document.createElement('button');
            btn.className = 'region-btn';
            if (Player.data.currentRegion === rId) btn.classList.add('active');
            
            btn.innerText = region.name;
            btn.onclick = () => this.renderMaps(rId);
            regionList.appendChild(btn);
        }
    },

    // 渲染特定區域的地圖 (第二層)
    renderMaps(regionId) {
        const mapList = document.getElementById('map-list');
        mapList.innerHTML = '';
        
        // 高亮選中的區域按鈕
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText === GAMEDATA.REGIONS[regionId].name);
        });

        const region = GAMEDATA.REGIONS[regionId];
        region.maps.forEach(map => {
            const btn = document.createElement('button');
            btn.className = 'map-btn';
            
            // 境界檢查 (預覽)
            const isLocked = Player.data.realm < map.minRealm;
            const reqRealmName = GAMEDATA.CONFIG.REALM_NAMES[map.minRealm];

            btn.innerHTML = `
                <div class="map-info">
                    <span class="map-name">${map.name}</span>
                    <span class="map-level">建議等級: Lv.${map.level}</span>
                </div>
                ${isLocked ? `<span class="map-lock">🔒 需達 ${reqRealmName}</span>` : ''}
            `;

            if (isLocked) {
                btn.classList.add('locked');
            }

            btn.onclick = () => this.selectMap(regionId, map.id);
            mapList.appendChild(btn);
        });
    },

    // 執行切換地圖 (實裝硬性攔截)
    selectMap(regionId, mapId) {
        const access = Player.canAccessMap(mapId);
        
        if (!access.can) {
            alert(access.reason); // 後續可換成更漂亮的 Toast
            return;
        }

        // 執行切換
        Player.data.currentRegion = regionId;
        Player.data.currentMap = mapId;
        Player.save();

        this.renderMapName();
        this.closeMapSelector();
        this.log(`進入了新的歷練地...`, 'system');

        // 重啟戰鬥循環
        Combat.init();
    },

    closeMapSelector() {
        document.getElementById('modal-map').style.display = 'none';
    }
};

window.UI_Battle = UI_Battle;
