/**
 * V1.7.0 ui_stats.js
 * 職責：修為屬性展示、精確局部加點、本命神通列表渲染。
 * 核心：局部更新技術，確保加點時畫面不閃爍。
 */

const UI_Stats = {
    // 1. 全量渲染 (切換分頁時調用)
    renderStats() {
        const d = Player.data;
        if (!d) return;

        // 更新境界標題
        const realmTitle = document.getElementById('stat-realm-title');
        if (realmTitle) {
            const realmName = GAMEDATA.CONFIG.REALM_NAMES[d.realm] || "凡人";
            realmTitle.innerText = `【${realmName}】 Lv.${d.level}`;
        }

        // 更新屬性數值
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // 更新戰鬥預覽數值 (來自 Player.getBattleStats)
        const bStats = Player.getBattleStats();
        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));

        // 渲染神通列表
        this.renderSkills();
    },

    // 2. 執行加點動作 (由按鈕 onclick="UI_Stats.add('str')" 調用)
    add(type) {
        if (Player.data.statPoints <= 0) {
            UI_Battle.log("潛能點不足，請待突破後再試。", "system");
            return;
        }

        // 呼叫邏輯層執行加點
        const success = Player.addStat(type);
        
        if (success) {
            // 局部刷新：只更新受影響的 DOM，不重繪整個頁面
            const d = Player.data;
            const bStats = Player.getBattleStats();

            this.updateValue(`stat-${type}`, d.stats[type]);
            this.updateValue('stat-points', d.statPoints);
            
            // 同步刷新預覽數值
            this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
            this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));

            // 特殊：如果是加悟性，可以提示經驗加成提升
            if (type === 'int') {
                const bonus = (1 + d.stats.int * 0.01).toFixed(2);
                console.log(`[Stats] 當前經驗獲取倍率：${bonus}x`);
            }
        }
    },

    // 3. 渲染本命神通列表
    renderSkills() {
        const skillContainer = document.getElementById('skills-list');
        if (!skillContainer) return; // 若 HTML 無此 ID 則跳過

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
                <div class="skill-desc">${s.desc}</div>
            </div>
        `).join('');
    },

    // 輔助函式：安全更新數值
    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
};

// 確保全域可用
window.UI_Stats = UI_Stats;
