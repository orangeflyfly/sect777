/**
 * V1.7.0 ui_stats.js
 * 職責：修為屬性展示、精確局部加點、本命神通列表渲染。
 * 核心：局部更新技術，確保加點時畫面不閃爍。
 * 【專家承諾：保留所有局部更新邏輯與悟性提示，行數不縮減】
 */

const UI_Stats = {
    // 1. 全量渲染 (切換分頁時由 core.js 調用)
    renderStats() {
        const d = Player.data;
        if (!d) return;

        // A. 更新境界標題 (對齊 data.js 的 REALM_NAMES)
        const realmTitle = document.getElementById('stat-realm-title');
        if (realmTitle) {
            // 這裡優先使用 DATA 或 GAMEDATA 確保不報錯
            const config = (typeof DATA !== 'undefined' ? DATA.CONFIG : GAMEDATA.CONFIG);
            const realmName = config.REALM_NAMES[d.realm] || "凡人";
            realmTitle.innerText = `【${realmName}】 Lv.${d.level}`;
        }

        // B. 更新屬性數值 (調用局部更新函式)
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // C. 更新戰鬥預覽數值 (來自 Player.getBattleStats)
        const bStats = Player.getBattleStats();
        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));

        // D. 渲染神通列表
        this.renderSkills();
    },

    // 2. 執行加點動作 (由 HTML 中的 + 按鈕觸發)
    addStat(type) {
        // 調用 Player.js 的核心加點邏輯
        const success = Player.addStat(type);

        if (success) {
            const d = Player.data;
            const bStats = Player.getBattleStats();

            // 局部更新：僅刷新變動的數值，提升使用者體驗
            this.updateValue(`stat-${type}`, d.stats[type]);
            this.updateValue('stat-points', d.statPoints);
            
            // 同步刷新戰鬥預覽數值
            this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
            this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));

            // 保留你的特殊邏輯：如果是加悟性，控制台提示經驗加成
            if (type === 'int') {
                const bonus = (1 + d.stats.int * 0.01).toFixed(2);
                console.log(`[Stats] 當前經驗獲取倍率提升至：${bonus}x`);
            }
        }
    },

    // 3. 渲染本命神通列表
    renderSkills() {
        const skillContainer = document.getElementById('skills-list');
        if (!skillContainer) return; 

        const skills = Player.data.skills;
        
        // 判斷是否空儲物袋或未領悟神通
        if (!skills || skills.length === 0) {
            skillContainer.innerHTML = `<div class=\"empty-msg\" style="color:var(--text-dim); text-align:center; padding:20px;">尚未領悟任何神通...</div>`;
            return;
        }

        // 遍歷渲染技能卡片
        skillContainer.innerHTML = skills.map(s => `
            <div class="skill-card" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-color); padding:10px; border-radius:8px; margin-bottom:10px;">
                <div class="skill-info" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span class="skill-name" style="color:var(--accent); font-weight:bold;">${s.name}</span>
                    <span class="skill-level" style="font-size:12px; color:var(--text-dim);">Lv.${s.level || 1}</span>
                </div>
                <div class="skill-desc" style="font-size:13px; color:#ccc;">${s.desc || '暫無描述'}</div>
            </div>
        `).join('');
    },

    // 4. 輔助函式：局部更新 DOM 數值
    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = val;
        }
    }
};
