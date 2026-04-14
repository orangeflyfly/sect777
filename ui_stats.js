/**
 * V1.9.0 ui_stats.js
 * 職責：修士屬性、裝備、神通與突破介面管理
 * 修正點：
 * 1. 實裝「裝備顯影術」，讓穿上的法寶出現在畫面上。
 * 2. 修復加點按鈕邏輯，確保與 Player.js 狀態同步。
 * 3. 預留境界突破 UI 切換邏輯。
 * 4. 配合 2x2 與 3x2 佈局重構 HTML 注入邏輯。
 */

const UI_Stats = {
    /**
     * 初始化監聽
     */
    init() {
        console.log("【介面】修為分頁初始化中...");
        this.renderStats();
    },

    /**
     * 全量渲染：刷新所有數據與結構
     */
    renderStats() {
        if (!Player.data) return;
        const d = Player.data;

        // A. 更新標題 (對接練功修練正名)
        const realmTitle = document.getElementById('stat-realm-title');
        if (realmTitle) {
            // 讀取設定檔中的境界名稱
            const realmName = (DATA.CONFIG && DATA.CONFIG.REALM_NAMES) 
                ? DATA.CONFIG.REALM_NAMES[d.realm || 1] 
                : "凡人";
            realmTitle.innerText = `【${realmName}】 Lv.${d.level}`;
        }

        // B. 初始化或重刷結構
        this.ensureStatsStructure();

        // C. 更新裝備欄位 (解決裝備失蹤問題)
        this.renderEquipped();

        // D. 更新突破按鈕顯示
        this.handleBreakthroughUI();

        // E. 更新基礎屬性數值
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // F. 更新戰鬥指標數值 (含裝備加成)
        const bStats = Player.getBattleStats();
        // 對接 Formula 計算隱藏數值
        const critRate = (typeof Formula !== 'undefined') ? Formula.calculateCritRate(d.stats.str, d.stats.dex) : 5;
        const dodgeRate = (typeof Formula !== 'undefined') ? Formula.calculateEvasionRate(d.stats.dex) : 5;

        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));
        this.updateValue('stat-def-preview', Math.ceil(bStats.def));
        this.updateValue('stat-spd-preview', bStats.speed.toFixed(1));
        this.updateValue('stat-crit-preview', critRate + "%");
        this.updateValue('stat-dodge-preview', dodgeRate + "%");

        // G. 渲染神通
        this.renderSkills();
    },

    /**
     * 結構初始化 (2x2 與 3x2 佈局注入)
     */
    ensureStatsStructure() {
        const container = document.getElementById('stats-content');
        if (!container || container.innerHTML.trim() !== "") return;

        const statsConfig = [
            { id: 'str', name: '力量', icon: '⚔️' },
            { id: 'con', name: '體質', icon: '❤️' },
            { id: 'dex', name: '敏捷', icon: '⚡' },
            { id: 'int', name: '悟性', icon: '🧠' }
        ];

        let html = `
            <div class="stat-group-header">自由屬性點: <span id="stat-points" class="highlight">0</span></div>
            <div class="stats-grid-2x2">
        `;

        statsConfig.forEach(s => {
            html += `
                <div class="stat-card-mini">
                    <div class="stat-card-top">
                        <span class="stat-icon">${s.icon}</span>
                        <span id="stat-${s.id}" class="stat-val-bold">0</span>
                    </div>
                    <div class="stat-card-bottom">
                        <span class="stat-label-name">${s.name}</span>
                        <button class="btn-add-mini" onclick="UI_Stats.addStat('${s.id}', event)">+</button>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div class="battle-master-card">
                <div class="card-header">
                    <span>核心戰鬥指標</span>
                    <button class="btn-detail-lens" onclick="UI_Stats.showDetailModal()">詳細數據 🔍</button>
                </div>
                <div class="battle-grid-3x2">
                    <div class="b-item"><em>血量</em><span id="stat-hp-preview">0</span></div>
                    <div class="b-item"><em>攻擊</em><span id="stat-atk-preview">0</span></div>
                    <div class="b-item"><em>防禦</em><span id="stat-def-preview">0</span></div>
                    <div class="b-item"><em>速度</em><span id="stat-spd-preview">0</span></div>
                    <div class="b-item"><em>暴擊</em><span id="stat-crit-preview">0%</span></div>
                    <div class="b-item"><em>閃避</em><span id="stat-dodge-preview">0%</span></div>
                </div>
            </div>
            <div class="skills-section">
                <div class="section-title">本命神通</div>
                <div id="skills-list"></div>
            </div>
        `;
        container.innerHTML = html;
    },

    /**
     * 渲染裝備槽位 (解決裝備不見的問題)
     */
    renderEquipped() {
        const listContainer = document.getElementById('equipped-list');
        if (!listContainer) return;

        const slots = [
            { id: 'weapon', label: '武器', icon: '⚔️' },
            { id: 'armor', label: '防具', icon: '👕' },
            { id: 'accessory', label: '飾品', icon: '💍' }
        ];

        listContainer.innerHTML = slots.map(slot => {
            const item = Player.data.equipped[slot.id];
            if (!item) {
                return `<div class="equip-slot empty">
                            <span class="slot-icon">${slot.icon}</span>
                            <span class="slot-label">${slot.label} (空)</span>
                        </div>`;
            }
            return `<div class="equip-slot r-${item.rarity || 1}">
                        <span class="slot-icon">${item.icon || '📦'}</span>
                        <div class="slot-info">
                            <span class="slot-name">${item.name}</span>
                            <small>${slot.label}</small>
                        </div>
                    </div>`;
        }).join('');
    },

    /**
     * 處理突破按鈕顯示邏輯
     */
    handleBreakthroughUI() {
        const area = document.getElementById('breakthrough-area');
        if (!area) return;

        // 當經驗值滿的時候，顯示突破按鈕 (預留 V1.9.0 邏輯)
        if (Player.data.exp >= Player.data.maxExp) {
            area.style.display = 'block';
            const btn = document.getElementById('btn-breakthrough');
            if (btn) {
                btn.onclick = () => {
                    if (window.Msg) Msg.log("正在感應天劫，即將實裝突破功能...", "gold");
                    // 未來這裡接 Player.breakthrough();
                };
            }
        } else {
            area.style.display = 'none';
        }
    },

    /**
     * 執行屬性加點
     */
    addStat(type, event) {
        // 安全檢查點數
        if (Player.data.statPoints <= 0) {
            if (window.Msg) Msg.log("剩餘自由點數不足！", "system");
            return;
        }

        // 執行加點邏輯
        Player.data.stats[type]++;
        Player.data.statPoints--;
        
        // 觸發跳字特效
        if (event) this.createFloatingText(event.target, "+1");

        // 存檔並刷新 UI
        Player.save();
        this.renderStats();
        
        // 同步核心 UI (例如頂部血條)
        if (window.Core) Core.updateUI();
        
        if (type === 'int' && window.Msg) {
            Msg.log("悟性精進，對天地靈氣的感應更加敏銳了。", "system");
        }
    },

    /**
     * 詳細數據彈窗
     */
    showDetailModal() {
        const d = Player.data;
        const bStats = Player.getBattleStats();
        
        const reduction = (typeof Formula !== 'undefined') ? Formula.calculateDamageReduction(bStats.def) : 0;
        const efficiency = (typeof Formula !== 'undefined') ? (Formula.calculateExpBonus(d.stats.int) * 100).toFixed(0) : 100;
        const critMult = (typeof Formula !== 'undefined') ? Formula.calculateCritMultiplier(d.stats.str) : 1.5;

        const modalHtml = `
            <div id="detail-modal-overlay" class="modal-overlay" onclick="this.remove()">
                <div class="detail-glass-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4>詳細修為數據</h4>
                        <button onclick="document.getElementById('detail-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="detail-list">
                        <div class="detail-row"><span>修煉效率</span><b class="c-green">${efficiency}%</b></div>
                        <div class="detail-row"><span>物理減傷</span><b class="c-blue">${reduction}%</b></div>
                        <div class="detail-row"><span>暴擊倍率</span><b class="c-gold">${critMult.toFixed(2)}x</b></div>
                        <div class="detail-row"><span>基礎生命</span><b>${Math.ceil(bStats.maxHp)}</b></div>
                        <div class="detail-row"><span>基礎攻擊</span><b>${Math.ceil(bStats.atk)}</b></div>
                    </div>
                    <p class="modal-tip">※ 數值受基礎根骨與穿戴法寶共同影響</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * 創建動態跳字
     */
    createFloatingText(target, text) {
        const rect = target.getBoundingClientRect();
        const floatText = document.createElement('div');
        floatText.className = 'float-up-text';
        floatText.innerText = text;
        floatText.style.left = `${rect.left + rect.width / 2}px`;
        floatText.style.top = `${rect.top}px`;
        document.body.appendChild(floatText);
        setTimeout(() => floatText.remove(), 800);
    },

    /**
     * 渲染神通列表
     */
    renderSkills() {
        const skillContainer = document.getElementById('skills-list');
        if (!skillContainer) return; 

        const skills = Player.data.skills;
        if (!skills || skills.length === 0) {
            skillContainer.innerHTML = `<div class="empty-msg">尚未領悟任何神通...</div>`;
            return;
        }

        skillContainer.innerHTML = skills.map(s => `
            <div class="skill-card">
                <div class="skill-info">
                    <span class="skill-name">${s.name}</span>
                    <span class="skill-level">Lv.${s.level || 1}</span>
                </div>
                <div class="skill-desc">${s.desc || '這是你領悟的強大神通。'}</div>
            </div>
        `).join('');
    },

    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
};

// 確保掛載到全域
window.UI_Stats = UI_Stats;
