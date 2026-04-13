/**
 * ============================================================
 * V1.7.0 全量極致版 ui_battle.js
 * 職責：戰鬥畫面渲染、日誌管理、地圖導航、視覺特效
 * ============================================================
 */

const UI_Battle = {
    // 1. 初始化監聽器
    init() {
        console.log("UI_Battle 模組初始化...");
        // 可以在這裡綁定一些初始事件
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
            maxText.innerText = max;
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

    // 4. 更新怪物資訊與震動回饋
    updateMonster(monster) {
        const nameText = document.getElementById('monster-name');
        const icon = document.getElementById('monster-icon');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-text');

        if (monster) {
            nameText.innerText = `${monster.name} (Lv.${monster.level})`;
            icon.innerText = monster.icon || '👾';
            
            const hpPercent = Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100));
            hpFill.style.width = `${hpPercent}%`;
            hpText.innerText = `${Math.ceil(monster.hp)} / ${monster.maxHp}`;

            // 觸發受擊震動效果
            this.triggerShake();
        } else {
            nameText.innerText = "尋覓中...";
            icon.innerText = "❓";
            hpFill.style.width = "0%";
            hpText.innerText = "0 / 0";
        }
    },

    // 5. 觸發戰場震動特效
    triggerShake() {
        const card = document.getElementById('monster-display');
        if (card) {
            card.classList.remove('shake-effect');
            void card.offsetWidth; // 強制重繪觸發動畫
            card.classList.add('shake-effect');
            
            // 動畫結束後自動移除，方便下次觸發
            setTimeout(() => {
                card.classList.remove('shake-effect');
            }, 400);
        }
    },

    // 6. 全量日誌系統 (支援顏色分類)
    log(msg, type = 'system') {
        const logList = document.getElementById('log-list');
        if (!logList) return;

        const item = document.createElement('div');
        item.className = `log-item log-${type}`;
        
        // 根據類型加上前綴或特殊處理
        let prefix = "";
        if (type === 'reward') prefix = "【掉落】";
        if (type === 'monster') prefix = "【戰況】";
        if (type === 'system') prefix = "【傳音】";

        item.innerText = `${prefix} ${msg}`;
        
        logList.appendChild(item);

        // 自動捲動到底部
        logList.scrollTop = logList.scrollHeight;

        // 限制日誌數量，保持極致效能
        if (logList.childElementCount > 100) {
            logList.removeChild(logList.firstChild);
        }
    },

    // 7. 日誌收合切換
    toggleLog() {
        const container = document.getElementById('log-system');
        const btn = document.getElementById('log-toggle');
        
        if (container.classList.contains('expanded')) {
            container.classList.remove('expanded');
            container.classList.add('collapsed');
            btn.innerText = "展開 🔽";
            document.getElementById('log-list').style.height = "40px";
        } else {
            container.classList.remove('collapsed');
            container.classList.add('expanded');
            btn.innerText = "收合 🔼";
            document.getElementById('log-list').style.height = "180px";
        }
    },

    // 8. 地圖選擇介面渲染 (對接數據庫)
    showMapSelect() {
        const modal = document.getElementById('modal-map');
        const regionList = document.getElementById('region-list');
        const mapList = document.getElementById('map-list');
        
        if (!modal || !DATA.REGIONS) return;

        modal.style.display = 'flex';
        regionList.innerHTML = '';
        mapList.innerHTML = '';

        // 渲染區域標籤
        Object.keys(DATA.REGIONS).forEach(regionKey => {
            const region = DATA.REGIONS[regionKey];
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.innerText = region.name;
            btn.onclick = () => this.renderMapsInRegion(regionKey);
            regionList.appendChild(btn);
        });

        // 預設渲染第一個區域的地圖
        this.renderMapsInRegion(Object.keys(DATA.REGIONS)[0]);
    },

    // 9. 渲染特定區域的地圖列表
    renderMapsInRegion(regionKey) {
        const mapList = document.getElementById('map-list');
        mapList.innerHTML = '';
        const maps = DATA.REGIONS[regionKey].maps;

        maps.forEach(map => {
            const btn = document.createElement('button');
            btn.className = 'map-card';
            btn.style.padding = "10px";
            btn.style.margin = "5px";
            btn.style.background = "rgba(255,255,255,0.05)";
            btn.style.border = "1px solid var(--border-color)";
            btn.style.borderRadius = "8px";
            btn.style.color = "white";
            
            btn.innerHTML = `<div>${map.name}</div><small style="color:var(--text-dim)">Lv.${map.minLv}+</small>`;
            
            btn.onclick = () => {
                this.selectMap(map);
                document.getElementById('modal-map').style.display = 'none';
            };
            mapList.appendChild(btn);
        });
    },

    // 10. 執行地圖切換
    selectMap(map) {
        document.getElementById('current-map-name').innerText = map.name;
        this.log(`準備前往「${map.name}」進行歷練...`, 'system');
        
        // 呼叫核心戰鬥邏輯進行切換 (此處對接 combat.js 的 init)
        if (typeof Combat !== 'undefined' && Combat.init) {
            Combat.init(map.id);
        }
    }
};

// 初始化執行
UI_Battle.init();
