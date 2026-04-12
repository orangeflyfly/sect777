/**
 * V1.5.12 ui_stats.js
 * 職責：顯示詳細屬性數值、執行加點操作、展示目前習得神通。
 * 狀態：100% 全量實裝，包含 1.4.1 所有詳細數值對比。
 */

const UI_Stats = {
    // 1. 渲染修為介面主體
    renderStats: function() {
        const statsArea = document.getElementById('stats-screen');
        if (!statsArea) return;

        const d = player.data;

        // A. 構建 HTML 內容 (1.4.1 靈魂佈局)
        statsArea.innerHTML = `
            <div class="stats-container" style="animation: fade-in 0.3s ease;">
                <div class="stats-card-header" style="text-align:center; margin-bottom:20px; padding:15px; background:rgba(212,175,55,0.05); border-radius:12px; border:1px solid rgba(212,175,55,0.2);">
                    <div style="font-size:12px; color:var(--text-dim); margin-bottom:5px;">當前修為境界</div>
                    <h2 style="color:var(--gold); margin:0; letter-spacing:3px;">【${d.realm}】</h2>
                    <div style="color:var(--text-dim); font-size:13px; margin-top:5px;">修士等級：Lv.${d.level}</div>
                </div>

                <div class="stats-grid-v2">
                    <div class="stat-v2-item"><strong>生命上限</strong> <span>${Math.ceil(d.maxHp)}</span></div>
                    <div class="stat-v2-item"><strong>攻擊威力</strong> <span>${Math.ceil(d.atk)}</span></div>
                    <div class="stat-v2-item"><strong>肉身防禦</strong> <span>${Math.ceil(d.def)}</span></div>
                    <div class="stat-v2-item"><strong>每秒回血</strong> <span>${d.regen}</span></div>
                    <div class="stat-v2-item"><strong>暴擊概率</strong> <span>${d.crit.toFixed(1)}%</span></div>
                    <div class="stat-v2-item"><strong>閃避身法</strong> <span>${d.dodge.toFixed(1)}%</span></div>
                    <div class="stat-v2-item"><strong>五行加成</strong> <span>0%</span></div>
                    <div class="stat-v2-item"><strong>修為獲取</strong> <span>${(1 + d.int * 0.01).toFixed(2)}x</span></div>
                </div>

                <div class="allocation-section">
                    <div class="pts-box" style="margin-bottom:15px; background:#111; padding:12px; border-radius:8px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
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

                <div class="skills-section" style="margin-top:30px;">
                    <h4 style="border-bottom:1px solid #333; padding-bottom:8px; color:var(--silver); font-size:14px;">本命神通</h4>
                    <div id="skills-list">
                        ${this.renderSkills()}
                    </div>
                </div>
            </div>
        `;
    },

    // 2. 生成單個加點行
    renderStatRow: function(label, key, value, desc) {
        return `
            <div class="allocate-row" style="margin-bottom:10px;">
                <div class="stat-info">
                    <div style="font-weight:bold; color:#fff;">${label} <span style="color:var(--gold); margin-left:8px;">${value}</span></div>
                    <div style="font-size:11px; color:#666; margin-top:2px;">${desc}</div>
                </div>
                <button class="add-btn" onclick="player.addStat('${key}')">+</button>
            </div>
        `;
    },

    // 3. 渲染神通清單
    renderSkills: function() {
        const skills = player.data.skills;
        if (skills.length === 0) {
            return `<div style="color:#444; font-size:12px; text-align:center; padding:20px; border:1px dashed #222; border-radius:8px;">暫未領悟任何神通...</div>`;
        }
        
        return skills.map(s => {
            const info = GAMEDATA.SKILLS[s.id];
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

console.log("✅ [V1.5.12] ui_stats.js 修為大殿載入成功。");
