/**
 * ============================================================
 * V1.7.0 全量極致版 ui_battle.js
 * 職責：戰鬥畫面渲染、日誌管理、地圖導航、視覺特效
 * 【專家承諾：全量保留日誌樣式與地圖彈窗邏輯，修正資料讀取斷點】
 * ============================================================
 */

const UI_Battle = {
    // 1. 初始化監聽器
    init() {
        console.log("UI_Battle 模組初始化...");
        // 此處預留給未來戰鬥按鈕的事件綁定
    },

    // 2. 更新玩家血條與數值 (精準對接 HTML ID)
    updatePlayerHP(current, max) {
        const fill = document.getElementById('player-hp-fill');
        const valText = document.getElementById('player-hp-val');
        const maxText = document.getElementById('player-hp-max');

        if (fill && valText && maxText) {
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            fill.style.width = `${percent}%`;
            valText.innerText = Math.ceil(current);
            maxText.innerText = Math.ceil(max);
        }
    },

    // 3. 更新經驗條
    updateExp(current, next) {
        const fill = document.getElementById('exp-fill');
        if (fill) {
            const percent = Math.max(0, Math.min(100, (current / next) * 100));
            fill.style.width = `${percent}%`;
        }
    },

    // 4. 更新怪物資訊
    updateMonster(monster) {
        const nameEl = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-val');

        if (nameEl && monster) {
            nameEl.innerText = `${monster.icon || '👾'} ${monster.name}`;
            const percent = Math.max(0, (monster.hp / monster.maxHp) * 100);
            if (hpFill) hpFill.style.width = `${percent}%`;
            if (hpText) hpText.innerText = `${Math.ceil(monster.hp)} / ${monster.maxHp}`;
        }
    },

    // 5. 戰鬥日誌管理 (包含全量顏色分類)
    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-${type}`; // 對應 style.css 裡的 log-player, log-monster 等
        
        // 根據類型添加修飾文字或顏色
        let color = "#f8fafc";
        if (type === 'player-atk') color = "#a78bfa";
        if (type === 'monster-atk') color = "#ef4444";
        if (type === 'reward') color = "#fbbf24";
        if (type === 'gold') color = "#fbbf24";
        if (type === 'system') color = "#94a3b8";

        logEntry.style.color = color;
        logEntry.style.marginBottom = "4px";
        logEntry.style.fontSize = "13px";
        logEntry.innerText = `> ${msg}`;

        logContainer.appendChild(logEntry);

        // 自動捲動到底部
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日誌數量 (對應 data.js 的 LOG_LIMIT)
        const limit = (typeof DATA !== 'undefined' ? DATA.CONFIG.LOG_LIMIT : 50);
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }
    },

    // 6. 顯示地圖選擇彈窗
    showMapSelect() {
        const modal = document.getElementById('modal-map');
        if (modal) {
            modal.style.display = 'flex';
            this.renderRegions();
        }
    },

    // 7. 渲染區域列表 (區域分頁)
    renderRegions() {
        const regionList = document.getElementById('region-list');
        if (!regionList) return;

        regionList.innerHTML = '';
        
        // 遍歷 DATA.REGIONS
        Object.keys(DATA.REGIONS).forEach(regionKey => {
            const region = DATA.REGIONS[regionKey];
            const btn = document.createElement('button');
            btn.className = 'region-tab-btn';
            btn.innerText = region.name;
            btn.onclick = () => this.renderMapsInRegion(regionKey);
            regionList.appendChild(btn);
        });

        // 預設渲染第一個區域的地圖
        if (Object.keys(DATA.REGIONS).length > 0) {
            this.renderMapsInRegion(Object.keys(DATA.REGIONS)[0]);
        }
    },

    // 8. 渲染特定區域的地圖列表
    renderMapsInRegion(regionKey) {
        const mapList = document.getElementById('map-list');
        if (!mapList) return;

        mapList.innerHTML = '';
        const maps = DATA.REGIONS[regionKey].maps;

        maps.forEach(map => {
            const btn = document.createElement('button');
            btn.className = 'map-card';
            // 保留你的原始樣式
            btn.style.padding = "10px";
            btn.style.margin = "5px";
            btn.style.background = "rgba(255,255,255,0.05)";
            btn.style.border = "1px solid var(--border-color)";
            btn.style.borderRadius = "8px";
            btn.style.color = "white";
            btn.style.cursor = "pointer";
            
            btn.innerHTML = `
                <div style="font-weight:bold;">${map.name}</div>
                <small style="color:var(--text-dim)">Lv.${map.minLv}+</small>
            `;
            
            btn.onclick = () => {
                this.selectMap(map);
                const modal = document.getElementById('modal-map');
                if (modal) modal.style.display = 'none';
            };
            mapList.appendChild(btn);
        });
    },

    // 9. 執行地圖切換
    selectMap(map) {
        const mapNameEl = document.getElementById('current-map-name');
        if (mapNameEl) {
            mapNameEl.innerText = map.name;
        }

        this.log(`準備前往「${map.name}」...`, "system");

        // 調用 Combat.js 的地圖初始化
        if (typeof Combat !== 'undefined') {
            Combat.init(map.id);
        }
    }
};
