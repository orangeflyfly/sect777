/**
 * V1.8.2 ui_stats.js
 * 修正點：精化 2x2 與 3x2 佈局結構、對接藝術化關閉按鈕、優化動態跳字座標
 */

const UI_Stats = {
    // 1. 全量渲染
    renderStats() {
        const d = Player.data;
        if (!d) return;

        // A. 更新境界標題
        const realmTitle = document.getElementById('stat-realm-title');
        if (realmTitle) {
            const config = DATA.CONFIG;
            const realmName = config.REALM_NAMES[d.realm] || "凡人";
            realmTitle.innerText = `【${realmName}】 Lv.${d.level}`;
        }

        // B. 核心：檢查並初始化屬性面板 (防止 HTML 為空)
        this.ensureStatsStructure();

        // C. 更新基礎屬性 (2x2 區塊)
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // D. 更新戰鬥卡片數值 (3x2 區塊)
        const bStats = Player.getBattleStats();
        // 對接 Formula 公式計算暴擊與閃避
        const critRate = Formula.calculateCritRate(d.stats.str, d.stats.dex);
        const dodgeRate = Formula.calculateEvasionRate(d.stats.dex);

        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));
        this.updateValue('stat-def-preview', Math.ceil(bStats.def));
        this.updateValue('stat-spd-preview', bStats.speed.toFixed(1));
        this.updateValue('stat-crit-preview', critRate + "%");
        this.updateValue('stat-dodge-preview', dodgeRate + "%");

        // E. 渲染神通列表
        this.renderSkills();
    },

    // 2. 初始化 HTML 結構 (重構為緊湊型 2x2 與 3x2 佈局)
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

    // 3. 執行加點 (觸發動態跳字與數據刷新)
    addStat(type, event) {
        const success = Player.addStat(type);
        if (success) {
            // 觸發動態跳字：傳入 event.target 以獲取精確座標
            if (event) this.createFloatingText(event.target, "+1");

            // 全面刷新當前頁面數據
            this.renderStats();

            // 特殊處理悟性提升的日誌提示
            if (type === 'int') {
                const bonus = (1 + Player.data.stats.int * 0.01).toFixed(2);
                Msg.log(`悟性精進，靈氣吸收效率變為 ${bonus}x`, "system");
            }
        }
    },

    // 4. B方案：展示詳細數據彈窗 (修正為對接藝術化關閉鈕結構)
    showDetailModal() {
        const d = Player.data;
        const bStats = Player.getBattleStats();
        
        // 從 Formula 獲取進階隱藏數值
        const reduction = Formula.calculateDamageReduction(bStats.def);
        const efficiency = Formula.calculateStudyEfficiency(d.stats.int);
        const critMult = Formula.calculateCritMultiplier(d.stats.str);

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
                        <div class="detail-row"><span>基礎生命</span><b>${Formula.calculateMaxHp(d.stats.con)}</b></div>
                        <div class="detail-row"><span>基礎攻擊</span><b>${Formula.calculateAtk(d.stats.str)}</b></div>
                    </div>
                    <p class="modal-tip">※ 數據受根骨與功法裝備共同影響</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 5. 輔助：創建動態跳字
    createFloatingText(target, text) {
        // 獲取按鈕在螢幕上的位置
        const rect = target.getBoundingClientRect();
        const floatText = document.createElement('div');
        floatText.className = 'float-up-text';
        floatText.innerText = text;
        
        // 設定起始座標為按鈕中心
        floatText.style.left = `${rect.left + rect.width / 2}px`;
        floatText.style.top = `${rect.top}px`;
        
        document.body.appendChild(floatText);
        
        // 動畫結束後自動移除標籤 (時間與 CSS 動畫一致)
        setTimeout(() => floatText.remove(), 800);
    },

    // 6. 渲染神通列表 (對齊技能卡片樣式)
    renderSkills() {
        const skillContainer = document.getElementById('skills-list');
        if (!skillContainer) return; 

        const skills = Player.data.skills;
        
        if (!skills || skills.length === 0) {
            skillContainer.innerHTML = `<div class="empty-msg" style="color:var(--text-dim); text-align:center; padding:10px;">尚未領悟任何神通...</div>`;
            return;
        }

        skillContainer.innerHTML = skills.map(s => `
            <div class="skill-card">
                <div class="skill-info">
                    <span class="skill-name">${s.name}</span>
                    <span class="skill-level">Lv.${s.level || 1}</span>
                </div>
                <div class="skill-desc">${s.desc || '暫無描述'}</div>
            </div>
        `).join('');
    },

    // 7. 基礎數值更新函式
    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
};
