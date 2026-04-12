/**
 * V1.6.0 ui_stats.js (流暢加固版)
 * 職責：屬性展示、精確局部加點、神通列表渲染。
 */

const UI_Stats = {
    // 1. 初始化渲染 (僅在切換分頁或等級提升時全量調用)
    renderStats: function() {
        const statsArea = document.getElementById('stats-screen');
        if (!statsArea) return;

        const d = player.data;

        // 構建骨架 (僅執行一次或必要時更新)
        statsArea.innerHTML = `
            <div class="stats-container" style="animation: fade-in 0.3s ease;">
                <div class="stats-card-header">
                    <div style="font-size:12px; color:var(--text-dim); margin-bottom:5px;">當前修為境界</div>
                    <h2 id="stat-realm" style="color:var(--gold); margin:0; letter-spacing:3px;">【${d.realm}】</h2>
                    <div id="stat-level" style="color:var(--text-dim); font-size:13px; margin-top:5px;">修士等級：Lv.${d.level}</div>
                </div>

                <div class="stats-grid-v2">
                    <div class="stat-v2-item"><strong>生命上限</strong> <span id="stat-maxHp">${Math.ceil(d.maxHp)}</span></div>
                    <div class="stat-v2-item"><strong>攻擊威力</strong> <span id="stat-atk">${Math.ceil(d.atk)}</span></div>
                    <div class="stat-v2-item"><strong>肉身防禦</strong> <span id="stat-def">${Math.ceil(d.def)}</span></div>
                    <div class="stat-v2-item"><strong>每秒回血</strong> <span id="stat-regen">${d.regen}</span></div>
                    <div class="stat-v2-item"><strong>暴擊概率</strong> <span id="stat-crit">${d.crit.toFixed(1)}%</span></div>
                    <div class="stat-v2-item"><strong>閃避身法</strong> <span id="stat-dodge">${d.dodge.toFixed(1)}%</span></div>
                    <div class="stat-v2-item"><strong>五行加成</strong> <span>0%</span></div>
                    <div class="stat-v2-item"><strong>修為獲取</strong> <span id="stat-expMult">${(1 + d.int * 0.01).toFixed(2)}x</span></div>
                </div>

                <div class="allocation-section">
                    <div class="pts-box">
                        <span style="color:var(--text-dim);">剩餘潛能點：</span>
                        <strong id="val-pts" style="color:var(--gold); font-size:1.2em;">${d.statPoints}</strong>
                    </div>

                    <div class="stat-allocate-list">
                        ${this.renderStatRow("力量", "str", d.str, "影響攻擊力加成")}
                        ${this.renderStatRow("體質", "con", d.con, "影響生命、防禦與回血")}
                        ${this.renderStatRow("敏捷", "dex", d.dex, "影響暴擊與閃避率")}
                        ${this.renderStatRow("悟性", "int", d.int, "影響修為獲取速度")}
                    </div>
                </div>

                <div class="skills-section">
                    <h4 style="border-bottom:1px solid #333; padding-bottom:8px; color:var(--silver); font-size:14px;">本命神通</h4>
                    <div id="skills-list">
                        ${this.renderSkills()}
                    </div>
                </div>
            </div>
        `;
    },

    // 2. 生成加點行 (保持與 1.5.12 風格一致)
    renderStatRow: function(label, key, value, desc) {
        return `
            <div class="allocate-row" style="margin-bottom:10px;">
                <div class="stat-info">
                    <div style="font-weight:bold; color:#fff;">${label} <span id="val-${key}" style="color:var(--gold); margin-left:8px;">${value}</span></div>
                    <div style="font-size:11px; color:#666; margin-top:2px;">${desc}</div>
                </div>
                <button class="add-btn" onclick="UI_Stats.handleAllocate('${key}')">+</button>
            </div>
        `;
    },

    // 3. 專業局部更新 (加固關鍵：不重繪，僅改數值)
    handleAllocate: function(key) {
        if (player.data.statPoints <= 0) return;
        
        // 呼叫邏輯層
        player.addStat(key);
        
        // 局部更新 UI，防止閃爍
        const d = player.data;
        this.updateSingleValue('val-pts', d.statPoints);
        this.updateSingleValue(`val-${key}`, d[key]);
        
        // 更新衍生戰鬥屬性
        this.updateSingleValue('stat-maxHp', Math.ceil(d.maxHp));
        this.updateSingleValue('stat-atk', Math.ceil(d.atk));
        this.updateSingleValue('stat-def', Math.ceil(d.def));
        this.updateSingleValue('stat-regen', d.regen);
        this.updateSingleValue('stat-crit', d.crit.toFixed(1) + "%");
        this.updateSingleValue('stat-dodge', d.dodge.toFixed(1) + "%");
        this.updateSingleValue('stat-expMult', (1 + d.int * 0.01).toFixed(2) + "x");
    },

    updateSingleValue: function(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    },

    // 4. 渲染神通清單 (保持原樣，但增加防錯)
    renderSkills: function() {
        const skills = player.data.skills;
        if (!skills || skills.length === 0) {
            return `<div style="color:#444; font-size:12px; text-align:center; padding:20px; border:1px dashed #222; border-radius:8px;">暫未領悟任何神通...</div>`;
        }
        
        return skills.map(s => {
            const info = GAMEDATA.SKILLS[s.id];
            if (!info) return "";
            return `
                <div class="skill-item" style="background:#1a1a1a; padding:12px; border-radius:10px; margin-top:10px; border-left:3px solid var(--rare); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--rare); font-size:14px;">${info.name}</strong>
                        <div style="font-size:11px; color:#777; margin-top:3px;">${info.desc}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:12px; color:var(--gold);">Lv.${s.level}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};

console.log("✅ [V1.6.0] ui_stats.js 局部更新引擎已實裝。");
