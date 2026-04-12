/**
 * V1.5 combat.js
 * 職責：戰鬥循環、傷害計算、熟練度成長、Boss 觸發
 */

const combat = {
    isFighting: false,
    monster: null,
    killCount: 0, // 當前地圖擊殺數

    // --- 1. 開始歷練 ---
    startHunt: function() {
        this.isFighting = true;
        this.spawnMonster();
        this.loop();
    },

    // --- 2. 生成妖獸 (含 Boss 邏輯) ---
    spawnMonster: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        
        // 檢查是否達到 Boss 挑戰門檻 (例如擊殺 10 隻小怪)
        if (this.killCount >= 10) {
            this.monster = JSON.parse(JSON.stringify(GAMEDATA.MONSTERS[region.bossId]));
            _X_UI.battle.log(`【警示】一股強大的妖氣降臨，${this.monster.name} 出現了！`, 'system');
        } else {
            // 隨機從當前地圖產出小怪 (這裡簡化，假設每個區域都有預設怪)
            this.monster = JSON.parse(JSON.stringify(GAMEDATA.MONSTERS["m001"]));
        }
        
        _X_UI.battle.renderMonster(this.monster);
    },

    // --- 3. 戰鬥循環 ---
    loop: function() {
        if (!this.isFighting) return;

        // A. 玩家攻擊怪物
        this.playerAttack();

        // B. 檢查怪物是否死亡
        if (this.monster.hp <= 0) {
            this.onMonsterDefeat();
            return;
        }

        // C. 怪物回擊
        this.monsterAttack();

        // D. 檢查玩家是否死亡
        if (player.data.hp <= 0) {
            this.onPlayerDefeat();
            return;
        }

        // 遞迴調用，模擬戰鬥節奏 (1秒一回合)
        setTimeout(() => this.loop(), 1000);
    },

    // --- 4. 攻擊計算與熟練度 ---
    playerAttack: function() {
        let dmg = player.data.str * 2; // 基礎傷害
        this.monster.hp -= dmg;
        
        _X_UI.battle.log(`你發動攻擊，對敵方造成 ${dmg} 點傷害`, 'damage');
        _X_UI.battle.renderMonster(this.monster);

        // --- V1.5 神通熟練度提升 ---
        player.data.skills.forEach(skill => {
            if (Math.random() < 0.3) { // 30% 機率增加熟練度
                skill.mastery += 1;
                if (skill.mastery >= 100) { // 熟練度滿，自動升級 (簡化邏輯)
                    skill.level += 1;
                    skill.mastery = 0;
                    _X_UI.battle.log(`你的神通【${GAMEDATA.SKILLS[skill.id].name}】突破到了第 ${skill.level} 層！`, 'system');
                }
            }
        });
    },

    monsterAttack: function() {
        let mDmg = this.monster.atk;
        player.data.hp -= mDmg;
        _X_UI.battle.log(`${this.monster.name} 反擊，你受到了 ${mDmg} 點傷害`, 'damage');
        _X_UI.battle.updateHP(player.data.hp, player.data.maxHp);
    },

    // --- 5. 戰鬥結果 ---
    onMonsterDefeat: function() {
        _X_UI.battle.log(`成功擊敗 ${this.monster.name}！獲得靈石 ${this.monster.gold}`, 'drop');
        player.data.money += this.monster.gold;
        
        if (this.monster.isBoss) {
            this.onBossDefeat();
        } else {
            this.killCount++;
        }

        setTimeout(() => this.spawnMonster(), 2000); // 2秒後找下一隻
    },

    onBossDefeat: function() {
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const nextReg = region.nextRegion;
        
        if (!player.data.unlockedRegions.includes(nextReg)) {
            player.data.unlockedRegions.push(nextReg);
            _X_UI.battle.log(`【震撼】你已擊敗區域領主，解鎖了前往【${nextReg}】的道路！`, 'system');
        }
        this.killCount = 0; // 重置擊殺數
    },

    onPlayerDefeat: function() {
        this.isFighting = false;
        _X_UI.battle.log("你體力不支，倒在了歷練的路上...", 'system');
        player.data.hp = player.data.maxHp; // 復活
        _X_UI.battle.updateHP(player.data.hp, player.data.maxHp);
    }
};
