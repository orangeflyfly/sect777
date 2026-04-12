/**
 * V1.5 ui_stats.js
 * 職責：渲染角色屬性介面、境界顯示、神通列表與熟練度進度條。
 */

const UI_Stats = {
    // --- 1. 渲染屬性主介面 ---
    renderStats: function() {
        const statsArea = document.getElementById('stats-screen');
        if (!statsArea) return;

        const d = player.data;
        statsArea.innerHTML = `
            <div class="stats-card">
                <h3>【${d.realm}】 ${d.name}</h3>
                <div class="level-box">等級: Lv.${d.level}</div>
                
                <div class="attr-grid">
                    <div class="attr-item">力量(攻): <span>${d.str}</span></div>
                    <div class="attr-item">體質(血): <span>${d.con}</span></div>
                    <div class="attr-item">敏捷(速): <span>${d.dex}</span></div>
                    <div class="attr-item">悟性(法): <span>${d.int}</span></div>
                </div>

                <div class="currency-box">
                    <span>靈石: ${d.money}</span>
                </div>
            </div>
            
            <div class="skills-container">
                <h4>已習得神通</h4>
                ${this.renderSkills()}
            </div>
        `;
    },

    // --- 2. 渲染神通列表 (1.5 新增：熟練度進度條) ---
    renderSkills: function() {
        return player.data.skills.map(s => {
            const skillData = GAMEDATA.SKILLS[s.id];
            const progress = (s.mastery / s.maxMastery) * 100;
            
            return `
                <div class="skill-item">
                    <div class="skill-header">
                        <span class="skill-name">${skillData.name} <small>Lv.${s.level}</small></span>
                        <span class="skill-type">${skillData.type === 'active' ? '【主動】' : '【被動】'}</span>
                    </div>
                    <div class="mastery-bar-container">
                        <div class="mastery-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="mastery-text">熟練度: ${s.mastery} / ${s.maxMastery}</div>
                    <p class="skill-desc">${skillData.desc || '暫無描述'}</p>
                </div>
            `;
        }).join('');
    }
};

console.log("✅ [V1.5 角色介面] ui_stats.js 已裝載，屬性與熟練度視覺化就緒。");
