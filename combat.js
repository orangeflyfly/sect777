/**
 * V1.7.0 combat.js
 * 職責：戰鬥邏輯發動、傷害跳字生成、死亡過度動畫、修為加成結算。
 */

const Combat = {
    currentMonster: null,
    combatTimer: null,
    isSearching: false,

    // 初始化戰鬥：進入新地圖或重新載入時呼叫
    init() {
        this.stop();
        this.spawnMonster();
    },

    // 生成怪物
    spawnMonster() {
        if (this.isSearching) return;

        const mapId = Player.data.currentMap;
        let currentMapData = null;

        // 從 GAMEDATA 尋找地圖資料
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) {
                currentMapData = map;
                break;
            }
        }

        if (!currentMapData) return;

        // 隨機抽取怪物
        const randomId = currentMapData.monsterIds[Math.floor(Math.random() * currentMapData.monsterIds.length)];
        const baseMonster = GAMEDATA.getMonster(randomId);

        // 深拷貝怪物數據，避免修改到原始庫
        this.currentMonster = {
            ...baseMonster,
            currentHp: baseMonster.hp
        };

        this.isSearching = false;
        UI_Battle.updateMonster(this.currentMonster);
        UI_Battle.log(`一隻 [${this.currentMonster.name}] 出現在你面前！`, 'system');
        
        // 開始戰鬥循環
        this.startLoop();
    },

    // 戰鬥主循環
    startLoop() {
        if (this.combatTimer) clearInterval(this.combatTimer);
        this.combatTimer = setInterval(() => {
            this.playerAttack();
        }, 1200); // 攻擊頻率
    },

    // 玩家攻擊邏輯
    playerAttack() {
        if (!this.currentMonster || this.isSearching) return;

        const stats = Player.getBattleStats();
        let damage = stats.atk;
        let isCrit = Math.random() < stats.critRate;

        if (isCrit) {
            damage = Math.floor(damage * 2);
        }

        // 扣除怪物血量
        this.currentMonster.currentHp -= damage;
        
        // 1. 生成浮動傷害數字 (V1.7 新增)
        this.createDamagePopup(damage, isCrit, false);

        // 2. 更新 UI 怪物血量
        UI_Battle.updateMonster(this.currentMonster);

        if (this.currentMonster.currentHp <= 0) {
            this.onMonsterDeath();
        } else {
            // 怪物反擊
            setTimeout(() => this.monsterAttack(), 500);
        }
    },

    // 怪物反擊邏輯
    monsterAttack() {
        if (!this.currentMonster || this.currentMonster.currentHp <= 0) return;

        const damage = Math.max(1, this.currentMonster.atk); // 基礎簡化公式
        
        // 生成怪物傷害跳字 (紅色)
        this.createDamagePopup(damage, false, true);
        
        // 這裡可以後續擴展玩家掉血邏輯
        UI_Battle.log(`[${this.currentMonster.name}] 發動反擊，對你造成了 ${damage} 點傷害。`, 'monster');
    },

    // 實裝 V1.7 傷害跳字生成
    createDamagePopup(dmg, isCrit, isFromMonster) {
        const container = document.getElementById('damage-container');
        if (!container) return;

        const popup = document.createElement('span');
        popup.className = 'dmg-popup';
        
        // 判斷類型與樣式
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

        // 隨機位置偏移，避免數字重疊
        const offset = Math.random() * 40 - 20;
        popup.style.left = `calc(50% + ${offset}px)`;
        popup.style.top = `40%`;

        container.appendChild(popup);

        // 動畫結束後自動移除，釋放記憶體
        setTimeout(() => {
            if (popup.parentElement) {
                container.removeChild(popup);
            }
        }, 1000);
    },

    // 怪物死亡處理 (V1.7 優化版)
    onMonsterDeath() {
        this.stop();
        
        // 1. 播放消散動畫 (透過 UI 控制 class)
        UI_Battle.playMonsterDieAnim();

        // 2. 結算獎勵 (實裝悟性加成)
        const expResult = Player.gainExp(this.currentMonster.exp);
        Player.data.coin += this.currentMonster.gold;
        Player.save();

        UI_Battle.log(`擊敗 [${this.currentMonster.name}]！獲得修為：${expResult.totalExp} (+${expResult.bonusAmount} 悟性加成), 靈石：${this.currentMonster.gold}`, 'reward');

        // 3. 處理掉落 (略過基礎逻辑，後續由 ui_battle 整合)
        
        // 4. 進入「搜尋過渡狀態」
        this.searchMonster();
    },

    // 搜尋怪物過渡 (取代 1.6 的 1.5s 停滯)
    searchMonster() {
        this.isSearching = true;
        this.currentMonster = null;
        
        // UI 切換至搜尋狀態
        UI_Battle.showSearching(true);

        // 設定搜尋時間 (1.2秒後出現新怪)
        setTimeout(() => {
            UI_Battle.showSearching(false);
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
