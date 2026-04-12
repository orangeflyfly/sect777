/**
 * V1.7.0 ui_battle.js
 * 職責：戰鬥分頁視覺渲染、日誌系統管理(整合版)、地圖名稱顯示。
 * 核心：解決無 ui_log.js 問題，確保所有戰鬥訊息與獎勵能正確顯示並收合。
 */

const UI_Battle = {
    // 1. 初始化戰鬥 UI
    init() {
        console.log("🎨 [UI_Battle] 歷練介面與日誌系統初始化...");
        this.renderMapName();
        this.showSearching(false);
        
        // 初始化日誌狀態 (預設展開)
        const logSystem = document.getElementById('log-system');
        if (logSystem) {
            logSystem.classList.add('expanded');
        }
    },

    // 2. 更新當前地圖名稱
    renderMapName() {
        const mapNameEl = document.getElementById('current-map-name');
        if (!mapNameEl) return;

        const mapId = Player.data.currentMap;
        let foundName = "未知地域";

        // 從 GAMEDATA 遍歷尋找地圖名稱
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) {
                foundName = map.name;
                break;
            }
        }
        mapNameEl.innerText = foundName;
    },

    // 3. 更新怪物卡片資訊
    updateMonster(monster) {
        const monsterCard = document.getElementById('monster-display');
        const iconEl = document.getElementById('monster-icon');
        const nameEl = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-text');

        if (!monster || !monsterCard) return;

        // 恢復顯示並移除死亡效果
        monsterCard.style.display = 'block';
        monsterCard.classList.remove('monster-die');

        iconEl.innerText = monster.icon;
        nameEl.innerText = monster.name;
        
        const hpPercent = Math.max(0, (monster.currentHp / monster.hp) * 100);
        hpFill.style.width = `${hpPercent}%`;
        hpText.innerText = `${Math.ceil(Math.max(0, monster.currentHp))}/${monster.hp}`;
    },

    // 4. 切換搜尋狀態視覺
    showSearching(active) {
        const monsterCard = document.getElementById('monster-display');
        const searchingBox = document.getElementById('searching-display');

        if (!monsterCard || !searchingBox) return;

        if (active) {
            monsterCard.style.display = 'none';
            searchingBox.style.display = 'block';
        } else {
            monsterCard.style.display = 'block';
            searchingBox.style.display = 'none';
        }
    },

    // 5. 觸發怪物死亡消散
    playMonsterDieAnim() {
        const monsterCard = document.getElementById('monster-display');
        if (monsterCard) {
            monsterCard.classList.add('monster-die');
        }
    },

    // 📜 --- 日誌系統核心 (由原本 ui_log 整合而來) ---

    /**
     * 新增日誌訊息
     * @param {string} msg - 內容
     * @param {string} type - 類型 (system, reward, monster, gold, red)
     */
    log(msg, type = 'normal') {
        const logList = document.getElementById('log-list');
        if (!logList) return;

        const div = document.createElement('div');
        div.className = `log-item log-${type}`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        div.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-text">${msg}</span>`;

        logList.appendChild(div);

        // 自動滾動到底部
        logList.scrollTop = logList.scrollHeight;

        // 自動清理舊日誌 (依照 CONFIG.LOG_LIMIT)
        const limit = GAMEDATA.CONFIG.LOG_LIMIT || 50;
        if (logList.childElementCount > limit) {
            logList.removeChild(logList.firstChild);
        }
    },

    // 日誌摺疊切換 (由 index.html 的按鈕 onclick="UI_Battle.toggleLog()" 調用)
    toggleLog() {
        const logSystem = document.getElementById('log-system');
        const toggleBtn = document.getElementById('log-toggle');
        if (!logSystem || !toggleBtn) return;

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

    // 修復 V1.6 可能存在的 showToast 調用，統一日誌處理
    showToast(msg, type) {
        this.log(msg, type || 'system');
    }
};

// 確保全域可用
window.UI_Battle = UI_Battle;

// 對齊 index.html 中的 UI_Log.toggle 調用，防止報錯
window.UI_Log = {
    toggle: () => UI_Battle.toggleLog(),
    add: (msg, type) => UI_Battle.log(msg, type)
};
