/**
 * V1.8.1 ui_stats.js
 * 修正點：自動初始化統計面板結構、對齊 V1.8.1 新增的防禦與速度數值
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

        // C. 更新屬性數值
        this.updateValue('stat-str', d.stats.str);
        this.updateValue('stat-con', d.stats.con);
        this.updateValue('stat-dex', d.stats.dex);
        this.updateValue('stat-int', d.stats.int);
        this.updateValue('stat-points', d.statPoints);

        // D. 更新戰鬥預覽數值 (包含 V1.8.1 新增的 def, speed)
        const bStats = Player.getBattleStats();
        this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
        this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));
        this.updateValue('stat-def-preview', Math.ceil(bStats.def));
        this.updateValue('stat-spd-preview', bStats.speed.toFixed(1));

        // E. 渲染神通列表
        this.renderSkills();
    },

    // 新增：初始化 HTML 結構，確保 updateValue 找得到 ID
    ensureStatsStructure() {
        const container = document.getElementById('stats-content');
        if (!container || container.innerHTML.trim() !== "") return;

        // 如果容器是空的，生成屬性條與加點按鈕
        const statsConfig = [
            { id: 'str', name: '力量', icon: '⚔️' },
            { id: 'con', name: '體質', icon: '❤️' },
            { id: 'dex', name: '敏捷', icon: '⚡' },
            { id: 'int', name: '悟性', icon: '🧠' }
        ];

        let html = `
            <div class="stat-group-header">自由屬性點: <span id="stat-points" class="highlight">0</span></div>
            <div class="stats-list">
        `;

        statsConfig.forEach(s => {
            html += `
                <div class="stat-item">
                    <span class="stat-label">${s.icon} ${s.name}</span>
                    <span id="stat-${s.id}" class="stat-val">0</span>
                    <button class="btn-add-stat" onclick="UI_Stats.addStat('${s.id}')">+</button>
                </div>
            `;
        });

        html += `
            </div>
            <div class="battle-preview-box" style="margin-top:20px; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px;">
                <div style="color:var(--accent); margin-bottom:10px; font-size:14px; border-bottom:1px solid #444;">戰鬥能力預覽</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13px;">
                    <div>血量: <span id="stat-hp-preview">0</span></div>
                    <div>攻擊: <span id="stat-atk-preview">0</span></div>
                    <div>防禦: <span id="stat-def-preview">0</span></div>
                    <div>速度: <span id="stat-spd-preview">0</span></div>
                </div>
            </div>
            <div class="skills-section" style="margin-top:20px;">
                <div class="section-title">本命神通</div>
                <div id="skills-list"></div>
            </div>
        `;
        container.innerHTML = html;
    },

    // 2. 執行加點動作
    addStat(type) {
        const success = Player.addStat(type);
        if (success) {
            const d = Player.data;
            const bStats = Player.getBattleStats();

            // 局部更新數值
            this.updateValue(`stat-${type}`, d.stats[type]);
            this.updateValue('stat-points', d.statPoints);
            
            // 同步刷新戰鬥預覽
            this.updateValue('stat-hp-preview', Math.ceil(bStats.maxHp));
            this.updateValue('stat-atk-preview', Math.ceil(bStats.atk));
            this.updateValue('stat-def-preview', Math.ceil(bStats.def));
            this.updateValue('stat-spd-preview', bStats.speed.toFixed(1));

            if (type === 'int') {
                const bonus = (1 + d.stats.int * 0.01).toFixed(2);
                Msg.log(`悟性提升，經驗獲取倍率達到 ${bonus}x`, "system");
            }
        }
    },

    // 3. 渲染神通列表 (對齊 index.html 的 ID)
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

    // 4. 輔助函式
    updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = val;
        }
    }
};
