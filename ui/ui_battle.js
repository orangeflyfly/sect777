/**
 * V2.1 ui_battle.js (飛升模組版 - 神通顯化與冷卻陣法)
 * 職責：歷練介面管理、戰鬥日誌分頁、地圖選擇、技能按鈕與冷卻渲染
 * 位置：/ui/ui_battle.js
 */

// 1. 導入核心邏輯與工具模組
import { Player } from '../entities/player.js';
import { CombatEngine } from '../systems/CombatEngine.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FX } from '../utils/fx.js';

export const UI_Battle = {
    // 🟢 新增：技能冷卻紀錄 (記錄每個技能的解鎖時間戳)
    skillCooldowns: {},

    // 1. 初始化監聽器與基礎渲染
    init() {
        console.log("【UI_Battle】歷練法鏡啟動，對接戰場數據...");
        this.renderSkillButtons();
        this.renderLogTabs(); // 初始化日誌分頁標籤
        
        // 初始同步玩家數據
        if (Player.data) {
            const stats = Player.getBattleStats();
            this.updatePlayerHP(Player.data.hp || stats.maxHp, stats.maxHp);
            this.updateExp(Player.data.exp, Player.data.maxExp);
        }
    },

    // 2. 更新玩家血條
    updatePlayerHP(current, max) {
        const fill = document.getElementById('player-hp-fill');
        const valText = document.getElementById('player-hp-val');
        const maxText = document.getElementById('player-hp-max');

        if (fill && valText && maxText) {
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            fill.style.width = `${percent}%`;
            valText.innerText = Math.ceil(current);
            maxText.innerText = Math.ceil(max);
        }
    },

    // 3. 更新經驗條與偵測突破 (對接修為介面)
    updateExp(current, next) {
        const fill = document.getElementById('exp-fill');
        if (fill) {
            const percent = Math.max(0, Math.min(100, (current / next) * 100));
            fill.style.width = `${percent}%`;
        }

        if (current >= next && window.UI_Stats) {
            window.UI_Stats.handleBreakthroughUI();
        }
    },

    // 4. 更新怪物資訊 (觸發受擊 shake 特效)
    updateMonster(monster) {
        const nameEl = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-val');
        const iconEl = document.getElementById('monster-icon');

        if (monster) {
            if (nameEl) nameEl.innerText = monster.name;
            if (iconEl) iconEl.innerText = monster.icon || '👾';
            
            const maxHp = monster.maxHp || monster.hp || 1;
            const percent = Math.max(0, (monster.hp / maxHp) * 100);
            
            if (hpFill) hpFill.style.width = `${percent}%`;
            if (hpText) hpText.innerText = `${Math.ceil(monster.hp)} / ${maxHp}`;

            const monsterCard = document.getElementById('monster-display');
            if (monsterCard && monster.hp < maxHp) {
                if (FX && FX.shake) {
                    FX.shake('monster-display');
                } else {
                    monsterCard.classList.add('hit-shake');
                    setTimeout(() => monsterCard.classList.remove('hit-shake'), 200);
                }
            }
        } else {
            if (nameEl) nameEl.innerText = "搜尋妖氣中...";
            if (iconEl) iconEl.innerText = "❓";
            if (hpFill) hpFill.style.width = "0%";
            if (hpText) hpText.innerText = "0 / 0";
        }
    },

    // 5. 戰鬥日誌渲染 (分頁機制預留)
    log(msg, type = 'system') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-item log-type-${type}`;
        
        const colorMap = {
            'player-atk': "#a78bfa",
            'monster-atk': "#ef4444",
            'reward': "#fbbf24",
            'gold': "#fbbf24",
            'system': "#94a3b8"
        };

        logEntry.style.color = colorMap[type] || "var(--text-main)";
        logEntry.innerHTML = `<span class="log-bullet">❯</span> <span class="log-text">${msg}</span>`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        const dataSrc = window.DATA || window.GAMEDATA;
        const limit = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.LOG_LIMIT) || 50;
        while (logContainer.children.length > limit) {
            logContainer.removeChild(logContainer.firstChild);
        }

        if (type === 'player-atk' || type === 'monster-atk') {
            const val = msg.match(/\d+/); 
            if (val && FX && FX.spawnPopText) {
                const target = (type === 'player-atk') ? 'monster' : 'player';
                FX.spawnPopText(val[0], target);
            }
        }
    },

    // 6. 渲染日誌分頁標籤
    renderLogTabs() {
        const tabContainer = document.getElementById('log-tabs');
        if (!tabContainer) return;

        const tabs = [
            { id: 'all', name: '全部' },
            { id: 'battle', name: '戰鬥' },
            { id: 'loot', name: '掉落' }
        ];

        tabContainer.innerHTML = tabs.map(tab => `
            <button class="log-tab-btn ${tab.id === 'all' ? 'active' : ''}" 
                    onclick="UI_Battle.switchLogTab('${tab.id}', this)">
                ${tab.name}
            </button>
        `).join('');
    },

    switchLogTab(tabId, btn) {
        document.querySelectorAll('.log-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Msg.log(`切換日誌頻道：${tabId}`, "system");
    },

    // 7. 🟢 渲染技能按鈕 (重構：加入冷卻遮罩與倒數)
    renderSkillButtons() {
        const actionContainer = document.getElementById('battle-actions');
        if (!actionContainer) return;

        actionContainer.innerHTML = '';

        // 1. 普通攻擊 (無冷卻)
        const atkBtn = document.createElement('button');
        atkBtn.className = 'btn-battle-action btn-atk-primary';
        atkBtn.innerHTML = `<span class="act-icon">⚔️</span><span class="act-name">普通攻擊</span>`;
        atkBtn.onclick = () => {
            if (CombatEngine) CombatEngine.playerAttack();
        };
        actionContainer.appendChild(atkBtn);

        // 2. 動態渲染已習得神通 (包含冷卻陣法)
        if (Player.data && Player.data.skills) {
            Player.data.skills.forEach(skill => {
                const sBtn = document.createElement('button');
                sBtn.className = 'btn-battle-action btn-atk-skill';
                sBtn.id = `btn-skill-${skill.id}`;
                sBtn.style.position = 'relative'; // 確保遮罩定位正確
                sBtn.style.overflow = 'hidden';

                // 檢查是否仍在冷卻中
                const cdEndTime = this.skillCooldowns[skill.id] || 0;
                const now = Date.now();
                const isCooldown = now < cdEndTime;

                sBtn.innerHTML = `
                    <span class="act-icon">✨</span>
                    <span class="act-name">${skill.name}</span>
                    <div id="cd-mask-${skill.id}" style="position:absolute; bottom:0; left:0; width:100%; height:0%; background:rgba(0,0,0,0.6); pointer-events:none; transition:height 0.1s linear;"></div>
                    <div id="cd-text-${skill.id}" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#fff; font-weight:bold; font-size:18px; text-shadow:0 0 5px #000; pointer-events:none;"></div>
                `;

                if (isCooldown) {
                    sBtn.disabled = true;
                    sBtn.style.filter = 'grayscale(0.8)';
                }

                sBtn.onclick = () => this.executeSkill(skill);
                actionContainer.appendChild(sBtn);

                // 如果按鈕生成時仍在冷卻，則繼續播放動畫
                if (isCooldown) {
                    this.startCooldownUI(skill.id, cdEndTime, 8000); // 預設 8 秒 CD
                }
            });
        }
    },

    // 🟢 執行神通邏輯
    executeSkill(skill) {
        if (!CombatEngine || CombatEngine.isProcessing) return;
        
        const now = Date.now();
        // 防呆：如果還在冷卻中，拒絕施放
        if (this.skillCooldowns[skill.id] && now < this.skillCooldowns[skill.id]) {
            Msg.log(`【${skill.name}】仍在冷卻中！`, "system");
            return;
        }

        Msg.log(`施展神通：【${skill.name}】！`, 'player-atk');
        
        // 觸發攻擊 (下一波可在此替換為 CombatEngine.playerSkillAttack)
        CombatEngine.playerAttack(); 

        // 設定冷卻時間 (8000 毫秒 = 8 秒)
        const cdDuration = 8000; 
        this.skillCooldowns[skill.id] = now + cdDuration;
        
        // 刷新按鈕狀態並啟動轉圈動畫
        this.renderSkillButtons();
    },

    // 🟢 啟動冷卻視覺特效
    startCooldownUI(skillId, endTime, totalDuration) {
        const btn = document.getElementById(`btn-skill-${skillId}`);
        const mask = document.getElementById(`cd-mask-${skillId}`);
        const text = document.getElementById(`cd-text-${skillId}`);
        
        if (!btn || !mask || !text) return;

        const updateCD = () => {
            const remaining = endTime - Date.now();
            
            // 冷卻結束
            if (remaining <= 0) {
                btn.disabled = false;
                btn.style.filter = 'none';
                mask.style.height = '0%';
                text.innerText = '';
                return;
            }
            
            // 計算剩餘百分比並更新畫面
            const percent = (remaining / totalDuration) * 100;
            mask.style.height = `${percent}%`;
            text.innerText = (remaining / 1000).toFixed(1) + 's';
            
            // 要求瀏覽器渲染下一幀
            requestAnimationFrame(updateCD);
        };
        
        // 啟動動畫迴圈
        updateCD();
    },

    // 8. 地圖選擇系統
    showMapSelect() {
        const modal = document.getElementById('modal-map');
        if (modal) {
            modal.style.display = 'flex';
            this.renderRegions();
        }
    },

    renderRegions() {
        const regionList = document.getElementById('region-list');
        const dataSrc = window.DATA || window.GAMEDATA;
        if (!regionList || !dataSrc || !dataSrc.REGIONS) return;

        regionList.innerHTML = '';
        Object.keys(dataSrc.REGIONS).forEach(key => {
            const region = dataSrc.REGIONS[key];
            const btn = document.createElement('button');
            btn.className = 'region-tab-btn';
            btn.innerText = region.name;
            btn.onclick = () => {
                document.querySelectorAll('.region-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderMapsInRegion(key);
            };
            regionList.appendChild(btn);
        });
        
        const firstKey = Object.keys(dataSrc.REGIONS)[0];
        if (firstKey) {
            if(regionList.firstChild) regionList.firstChild.classList.add('active');
            this.renderMapsInRegion(firstKey);
        }
    },

    renderMapsInRegion(regionKey) {
        const mapList = document.getElementById('map-list');
        const dataSrc = window.DATA || window.GAMEDATA;
        if (!mapList || !dataSrc) return;
        
        mapList.innerHTML = '';
        dataSrc.REGIONS[regionKey].maps.forEach(map => {
            const card = document.createElement('div');
            card.className = 'map-glass-card';
            
            let monstersHtml = '<div class="map-monster-icons">';
            map.monsterIds.forEach(id => {
                const m = dataSrc.MONSTERS[id];
                monstersHtml += `<span class="m-icon" title="${m ? m.name : '未知'}">${m ? m.icon : '❓'}</span>`;
            });
            monstersHtml += '</div>';

            card.innerHTML = `
                <div class="map-card-content">
                    <div class="map-title-row">
                        <strong class="map-name">${map.name}</strong>
                        <span class="map-lv-badge">Lv.${map.minLv}</span>
                    </div>
                    <div class="map-desc-row">
                        <span class="desc-label">出沒妖獸：</span>
                        ${monstersHtml}
                    </div>
                </div>
                <div class="map-action-row">
                    <button class="btn-go-map">前往歷練 ❯</button>
                </div>
            `;
            
            card.onclick = () => {
                this.selectMap(map);
                const modal = document.getElementById('modal-map');
                if (modal) modal.style.display = 'none';
            };
            mapList.appendChild(card);
        });
    },

    selectMap(map) {
        const mapNameEl = document.getElementById('current-map-name');
        if (mapNameEl) mapNameEl.innerText = map.name;
        Msg.log(`前往「${map.name}」進行歷練...`, "system");
        if (CombatEngine) CombatEngine.init(map.id);
    }
};

// ==========================================
// 🛡️ 全域對接鎖
// ==========================================
window.UI_Battle = UI_Battle;
