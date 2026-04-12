/**
 * V1.5.2 combat.js (修正圓滿版)
 * 職責：戰鬥循環、離線收益、熟練度、怪物與玩家攻擊邏輯。
 * 狀態：已補齊 monsterAttack 與 onPlayerDeath 缺失函式。
 */

const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    // --- 1. 遊戲啟動入口 ---
    init: function() {
        if (player.load()) {
            const gains = player.calculateOfflineGains();
            if (gains) {
                this.showOfflinePopup(gains);
            }
        }
        this.initBattle();
    },

    // --- 2. 離線收益彈窗 ---
    showOfflinePopup: function(gains) {
        alert(`【閉關結束】\n您本次閉關歷時 ${gains.minutes} 分鐘\n收穫修為：${gains.expGain}\n收穫靈石：${gains.goldGain}`);
    },

    // --- 3. 戰鬥初始化 ---
    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        
        if (isBoss) {
            const bossData = GAMEDATA.MONSTERS[region.bossId];
            this.currentMonster = JSON.parse(JSON.stringify(bossData));
            this.currentMonster.maxHp = bossData.hp;
        } else {
            const map = region.maps.find(m => m.id === player.data.currentMapId);
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            const mData = GAMEDATA.MONSTERS[mId];
            this.currentMonster = JSON.parse(JSON.stringify(mData));
            this.currentMonster.maxHp = mData.hp;
        }

        UI_Battle.renderBattle(this.currentMonster);
        this.startLoop();
    },

    // --- 4. 戰鬥核心循環 ---
    startLoop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.combatTick();
        }, 1000);
    },

    combatTick: function() {
        if (!this.currentMonster) return;

        // A. 玩家攻擊
        this.playerAttack();

        // B. 檢查怪物死亡
        if (this.currentMonster.hp <= 0) {
            this.onMonsterDeath();
            return;
        }

        // C. 怪物回擊 (先前缺失的函式)
        this.monsterAttack();

        // D. 檢查玩家死亡
        if (player.data.hp <= 0) {
            this.onPlayerDeath();
            return;
        }

        // E. 狀態恢復
        this.processRegen();
        
        // F. 更新 UI
        UI_Battle.renderBattle(this.currentMonster);
    },

    // --- 5. 攻擊邏輯與熟練度 ---
    playerAttack: function() {
        let dmg = player.data.str * 2;
        let isCrit = Math.random() < 0.1;
        if (isCrit) dmg *= 2;

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】發動攻擊，造成 ${dmg} 點傷害${isCrit ? '（爆擊！）' : ''}`, 'player');

        this.gainSkillMastery();
    },

    // 怪物攻擊函式 (補齊處 ✅)
    monsterAttack: function() {
        let dmg = this.currentMonster.atk;
        // 基礎防禦減免 (簡單公式)
        let finalDmg = Math.max(1, dmg - (player.data.con * 0.5));
        
        player.data.hp -= finalDmg;
        this.log(`【${this.currentMonster.name}】反擊，造成 ${Math.ceil(finalDmg)} 點傷害`, 'monster');
    },

    gainSkillMastery: function() {
        player.data.skills.forEach(skill => {
            skill.mastery += 1;
            if (skill.mastery >= skill.maxMastery) {
                skill.level += 1;
                skill.mastery = 0;
                skill.maxMastery = Math.floor(skill.maxMastery * 1.5);
                this.log(`【系統】神通「${GAMEDATA.SKILLS[skill.id].name}」突破至 Lv.${skill.level}！`, 'system');
            }
        });
    },

    // --- 6. 結算邏輯 ---
    onMonsterDeath: function() {
        clearInterval(this.timer);
        this.log(`【系統】${this.currentMonster.name} 已被擊敗！`, 'system');
        
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        
        if (this.isBossBattle) {
            const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
            if (region.nextRegion && !player.data.unlockedRegions.includes(region.nextRegion)) {
                player.data.unlockedRegions.push(region.nextRegion);
                this.log(`【震撼】擊敗領主！${region.nextRegion}地圖已解鎖！`, 'system');
            }
            player.data.killCount = 0;
        } else {
            player.data.killCount++;
        }

        player.checkLevelUp();
        player.save();
        setTimeout(() => this.initBattle(), 1200);
    },

    // 玩家死亡處理 (補齊處 ✅)
    onPlayerDeath: function() {
        clearInterval(this.timer);
        this.log(`【慘烈】你被${this.currentMonster.name}擊敗了，正在原地調息...`, 'system');
        player.data.hp = player.data.maxHp * 0.1; // 復活給 10% 血量
        player.save();
        setTimeout(() => this.initBattle(), 3000); // 3秒後重新挑戰
    },

    processRegen: function() {
        if (player.data.hp < player.data.maxHp) {
            player.data.hp = Math.min(player.data.maxHp, player.data.hp + (player.data.maxHp * 0.01));
        }
    },

    log: function(msg, type) {
        const logList = document.getElementById('battle-logs');
        if (logList) {
            const div = document.createElement('div');
            div.className = `log-item log-${type}`;
            div.innerText = msg;
            logList.prepend(div);
            // 限制日誌數量
            if (logList.children.length > 30) logList.lastChild.remove();
        }
    }
};

console.log("✅ [V1.5.2 戰鬥引擎] 修正版已載入，怪物攻擊邏輯圓滿。");
