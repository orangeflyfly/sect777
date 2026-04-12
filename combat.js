/**
 * V1.7.0 combat.js
 * 職責：戰鬥邏輯運算、傷害跳字生成、死亡結算、搜尋過渡控制。
 */

const Combat = {
    currentMonster: null,
    combatTimer: null,
    isSearching: false, // 標記是否處於搜尋過渡期

    // 1. 初始化戰鬥
    init() {
        this.stop();
        this.spawnMonster();
    },

    // 2. 隨機生成妖獸
    spawnMonster() {
        if (this.isSearching) return;

        const mapId = Player.data.currentMap;
        let currentMapData = null;

        // 尋找當前地圖數據
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) { currentMapData = map; break; }
        }

        if (!currentMapData) return;

        // 隨機抽取怪物
        const monsterIds = currentMapData.monsterIds;
        const randomId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
        const baseMonster = GAMEDATA.getMonster(randomId);

        // 深拷貝數據，避免污染原始庫
        this.currentMonster = {
            ...baseMonster,
            currentHp: baseMonster.hp
        };

        this.isSearching = false;
        
        // 更新 UI
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.updateMonster(this.currentMonster);
            UI_Battle.showSearching(false);
            UI_Battle.log(`遇到一隻【${this.currentMonster.name}】，牠正不懷好意地看著你。`, 'system');
        }
        
        this.startLoop();
    },

    // 3. 戰鬥計時器
    startLoop() {
        if (this.combatTimer) clearInterval(this.combatTimer);
        // 每 1.2 秒玩家發動一次攻擊
        this.combatTimer = setInterval(() => {
            this.playerAttack();
        }, 1200);
    },

    // 4. 玩家攻擊邏輯
    playerAttack() {
        if (!this.currentMonster || this.isSearching) return;

        const stats = Player.getBattleStats();
        let damage = stats.atk;
        let isCrit = Math.random() < stats.critRate;

        if (isCrit) {
            damage = Math.floor(damage * 2);
        }

        // 扣血
        this.currentMonster.currentHp -= damage;
        
        // 視覺：觸發傷害跳字
        this.createDamagePopup(damage, isCrit, false);

        // UI 更新
        UI_Battle.updateMonster(this.currentMonster);

        // 判定死亡
        if (this.currentMonster.currentHp <= 0) {
            this.onMonsterDeath();
        } else {
            // 怪物於 0.5 秒後反擊
            setTimeout(() => this.monsterAttack(), 500);
        }
    },

    // 5. 妖獸反擊邏輯
    monsterAttack() {
        if (!this.currentMonster || this.currentMonster.currentHp <= 0) return;

        const monsterDmg = Math.max(1, this.currentMonster.atk);
        
        // 視覺：觸發怪物傷害跳字 (紅字)
        this.createDamagePopup(monsterDmg, false, true);
        
        UI_Battle.log(`[${this.currentMonster.name}] 發動反擊，使你損失了 ${monsterDmg} 點生命。`, 'monster');
    },

    // 6. 視覺核心：生成傷害跳字
    createDamagePopup(dmg, isCrit, isFromMonster) {
        const container = document.getElementById('damage-container');
        if (!container) return;

        const popup = document.createElement('span');
        popup.className = 'dmg-popup';
        
        if (isFromMonster) {
            popup.classList.add('dmg-monster');
            popup.innerText = `-${dmg}`;
        } else if (isCrit) {
            popup.classList.add('dmg-crit');
            popup.innerText = `暴擊 -${dmg}`;
        } else {
            popup.classList.add('dmg-normal');
            popup.innerText = `-${dmg}`;
        }

        // 隨機偏移座標，防止重疊
        const offset = Math.random() * 50 - 25;
        popup.style.left = `calc(50% + ${offset}px)`;
        popup.style.top = `40%`;

        container.appendChild(popup);

        // 1秒後自動銷毀 DOM
        setTimeout(() => {
            if (popup.parentElement) container.removeChild(popup);
        }, 1000);
    },

    // 7. 死亡結算
    onMonsterDeath() {
        this.stop();
        
        // 播放消散特效
        UI_Battle.playMonsterDieAnim();

        // 經驗與靈石結算
        const expResult = Player.gainExp(this.currentMonster.exp);
        Player.data.coin += this.currentMonster.gold;
        Player.save();

        UI_Battle.log(`擊敗 [${this.currentMonster.name}]！`, 'reward');
        UI_Battle.log(`獲得修為：${expResult.totalExp} (悟性 +${expResult.bonusAmount}), 靈石：${this.currentMonster.gold}`, 'reward');

        // 進入搜尋過渡期
        this.enterSearchingState();
    },

    // 8. 搜尋過渡期控制
    enterSearchingState() {
        this.isSearching = true;
        this.currentMonster = null;
        
        UI_Battle.showSearching(true);

        // 1.2 秒後找到下一隻怪
        setTimeout(() => {
            this.isSearching = false;
            this.spawnMonster();
        }, 1200);
    },

    stop() {
        if (this.combatTimer) {
            clearInterval(this.combatTimer);
            this.combatTimer = null;
        }
    }
};

window.Combat = Combat;
