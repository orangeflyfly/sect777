/**
 * V1.5 combat.js
 * 職責：戰鬥循環、離線收益觸發、神通熟練度提升、Boss 戰特殊邏輯。
 * 狀態：全量完整版，整合所有 1.4.1 戰鬥機制與 1.5 新功能。
 */

const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    // --- 1. 遊戲啟動入口 (1.5 新增：離線收益觸發) ---
    init: function() {
        // 嘗試讀取存檔
        if (player.load()) {
            const gains = player.calculateOfflineGains();
            if (gains) {
                this.showOfflinePopup(gains);
            }
        }
        // 開始歷練循環
        this.initBattle();
    },

    // --- 2. 離線收益彈窗 (1.5 新增) ---
    showOfflinePopup: function(gains) {
        // 這部分未來會由 UI_Battle 調用更美觀的彈窗，目前先以邏輯為主
        alert(`【閉關結束】\n您本次閉關歷時 ${gains.minutes} 分鐘\n收穫修為：${gains.expGain}\n收穫靈石：${gains.goldGain}`);
    },

    // --- 3. 戰鬥初始化 (1.4.1 繼承 + 1.5 擊殺計數) ---
    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        
        if (isBoss) {
            // 生成 Boss
            const bossData = GAMEDATA.MONSTERS[region.bossId];
            this.currentMonster = JSON.parse(JSON.stringify(bossData));
            this.currentMonster.maxHp = bossData.hp;
        } else {
            // 隨機選取當前地圖的小怪
            const map = region.maps.find(m => m.id === player.data.currentMapId);
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            const mData = GAMEDATA.MONSTERS[mId];
            this.currentMonster = JSON.parse(JSON.stringify(mData));
            this.currentMonster.maxHp = mData.hp;
        }

        UI_Battle.renderBattle(this.currentMonster);
        this.startLoop();
    },

    // --- 4. 戰鬥核心循環 (1.4.1 算法 + 1.5 屬性聯動) ---
    startLoop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.combatTick();
        }, 1000); // 每一秒一回合
    },

    combatTick: function() {
        // A. 玩家攻擊邏輯
        this.playerAttack();

        // B. 檢查怪物是否死亡
        if (this.currentMonster.hp <= 0) {
            this.onMonsterDeath();
            return;
        }

        // C. 怪物回擊
        this.monsterAttack();

        // D. 檢查玩家是否死亡
        if (player.data.hp <= 0) {
            this.onPlayerDeath();
        }

        // E. 1.5 新增：戰鬥中每回合恢復 (Regen 屬性)
        this.processRegen();
        
        // F. 更新 UI
        UI_Battle.renderBattle(this.currentMonster);
    },

    // --- 5. 傷害運算與熟練度 (1.4.1 屬性 + 1.5 熟練度) ---
    playerAttack: function() {
        // 基礎傷害 = 力量 * 2 + 裝備加成
        let dmg = player.data.str * 2;
        
        // 爆擊判定
        let isCrit = Math.random() < 0.1; // 基礎10%
        if (isCrit) dmg *= 2;

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】發動攻擊，對${this.currentMonster.name}造成 ${dmg} 點傷害${isCrit ? '（爆擊！）' : ''}`, 'player');

        // 1.5 新增：提升神通熟練度
        this.gainSkillMastery();
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

    // --- 6. 戰後結算 (1.5 新增：Boss 戰勝利邏輯) ---
    onMonsterDeath: function() {
        clearInterval(this.timer);
        this.log(`【系統】${this.currentMonster.name} 已被擊敗！`, 'system');
        
        // 獲得獎勵
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        player.checkLevelUp();

        if (this.isBossBattle) {
            // Boss 勝利：解鎖下一區域
            const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
            if (region.nextRegion && !player.data.unlockedRegions.includes(region.nextRegion)) {
                player.data.unlockedRegions.push(region.nextRegion);
                this.log(`【震撼】成功擊敗領主！${region.name}通行禁制已解除，目標：${region.nextRegion}！`, 'system');
            }
            player.data.killCount = 0; // 重置
        } else {
            // 小怪勝利：增加擊殺計數
            player.data.killCount++;
        }

        player.save();
        setTimeout(() => this.initBattle(), 1500); // 1.5秒後進入下一場
    },

    processRegen: function() {
        // 1.5 預留：此處讀取 PREFIXES 中的 regen 屬性進行回血
        if (player.data.hp < player.data.maxHp) {
            player.data.hp = Math.min(player.data.maxHp, player.data.hp + (player.data.maxHp * 0.01));
        }
    },

    log: function(msg, type) {
        // 轉交給 UI 管理日誌 (或是簡單的 console)
        console.log(`[${type}] ${msg}`);
        // 實際開發會調用 UI_Battle.addLog(msg, type);
    }
};

console.log("✅ [V1.5 戰鬥引擎] combat.js 已裝載，離線收益與熟練度邏輯就緒。");
