/**
 * V1.5.10 ui_stats.js
 * 職責：渲染詳細屬性面板、處理潛能點分配、顯示境界進度。
 */

const UI_Stats = {
    // 1. 核心渲染函式
    renderStats: function() {
        const statsArea = document.getElementById('stats-screen');
        if (!statsArea) return;

        const d = player.data;

        // 構建詳細屬性 HTML (復刻 1.4.1 佈局)
        statsArea.innerHTML = `
            <div class="stats-container">
                <div class="stats-card-header" style="text-align:center; margin-bottom:20px;">
                    <h2 style="color:var(--gold); margin:0;">【${d.realm}】</h2>
                    <div style="color:#888; font-size:13px; margin-top:5px;">修為等級：Lv.${d.level}</div>
                </div>

                <div class="stats-grid-v2">
                    <div class="stat-v2-item"><strong>生命上限:</strong> <span>${Math.ceil(d.maxHp)}</span></div>
                    <div class="stat-v2-item"><strong>攻擊力:</strong> <span>${Math.ceil(d.atk)}</span></div>
                    <div class="stat-v2-item"><strong>物理防禦:</strong> <span>${Math.ceil(d.def)}</span></div>
                    <div class="stat-v2-item"><strong>每秒回血:</strong> <span>${d.regen}</span></div>
                    <div class="stat-v2-item"><strong>暴擊率:</strong> <span>${d.crit.toFixed(1)}%</span></div>
                    <div class="stat-v2-item"><strong>閃避率:</strong> <span>${d.dodge.toFixed(1)}%</span></div>
                    <div class="stat-v2-item"><strong>靈石加成:</strong> <span>0%</span></div>
                    <div class="stat-v2-item"><strong>修為獲取:</strong> <span>${(1 + d.int * 0.01).toFixed(2)}x</span></div>
                </div>

                <div class="allocation-section">
                    <div class="pts-box" style="margin-bottom:15px; background:#222; padding:10px; border-radius:5px; border:1px solid #444; display:flex; justify-content:space-between;">
                        <span>可用潛能點:</span>
                        <strong id="val-pts" style="color:var(--gold);">${d.statPoints}</strong>
                    </div>

                    <div class="stat-allocate-list">
                        ${this.renderStatRow("力量", "str", d.str, "影響攻擊力")}
                        ${this.renderStatRow("體質", "con", d.con, "影響生命、防禦、回血")}
                        ${this.renderStatRow("敏捷", "dex", d.dex, "影響暴擊、閃避")}
                        ${this.renderStatRow("悟性", "int", d.int, "影響修為獲取")}
                    </div>
                </div>

                <div class="skills-section" style="margin-top:25px;">
                    <h4 style="border-bottom:1px solid #333; padding-bottom:5px; color:var(--silver);">已習得神通</h4>
                    <div id="skills-list">
                        ${this.renderSkills()}
                    </div>
                </div>
            </div>
        `;
    },

    // 生成加點單行
    renderStatRow: function(label, key, value, desc) {
        return `
            <div class="allocate-row" style="background:#1a1a1a; padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;">
                <div class="stat-info">
                    <div style="font-weight:bold; color:#e0e0e0;">${label}: <span style="color:var(--gold);">${value}</span></div>
                    <div style="font-size:11px; color:#666;">${desc}</div>
                </div>
                <button class="add-btn" onclick="player.addStat('${key}')">+</button>
            </div>
        `;
    },

    // 渲染技能清單
    renderSkills: function() {
        if (player.data.skills.length === 0) return `<div style="color:#666; font-size:12px;">暫無神通...</div>`;
        
        return player.data.skills.map(s => {
            const info = GAMEDATA.SKILLS[s.id];
            return `
                <div class="skill-item" style="background:#222; padding:10px; border-radius:6px; margin-top:8px; border-left:3px solid var(--rare);">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color:var(--rare);">${info.name}</strong>
                        <span style="font-size:11px; color:#888;">等級 ${s.level}</span>
                    </div>
                    <div style="font-size:11px; color:#aaa; margin-top:4px;">${info.desc}</div>
                </div>
            `;
        }).join('');
    }
};

console.log("✅ [V1.5.10] ui_stats.js 修為面板全量載入，詳細屬性與加點已啟動。");
