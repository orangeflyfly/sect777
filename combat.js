/**
 * V1.7.0 combat.js
 * 職責：戰鬥邏輯運算、傷害跳字觸發、怪物死亡結算、搜尋狀態控制。
 */

const Combat = {
    currentMonster: null,
    combatTimer: null,
    isSearching: false, // 標記是否處於搜尋怪物的過渡期

    // 1. 初始化戰鬥 (進入地圖或重啟時呼叫)
    init() {
        this.stop();
        this.spawnMonster();
    },

    // 2. 生成怪物邏輯
    spawnMonster() {
        if (this.isSearching) return;

        const mapId = Player.data.currentMap;
        let currentMapData = null;

        // 從 GAMEDATA 尋找地圖資料 (對應 data.js 結構)
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) {
                currentMapData = map;
                break;
            }
        }

        if (!currentMapData) {
            console.error("找不到當前地圖數據，無法生成怪物");
            return;
        }

        // 隨機抽取怪物 ID
        const monsterList = currentMapData.monsterIds;
        const randomId = monsterList[Math.floor(Math.random() * monsterList.length)];
        const baseMonster = GAMEDATA.getMonster(randomId);

        // 深拷貝怪物數據，確保不改動到原始庫
        this.currentMonster = {
            ...baseMonster,
            currentHp: baseMonster.hp
        };

        this.isSearching = false;
        
        // 通知 UI 更新 (ui_battle.js 負責渲染)
        UI_Battle.updateMonster(this.currentMonster);
        UI_Log.add(`一隻 [${this.currentMonster.name}] 出現在你面前！`, 'system');
        
        // 開啟戰鬥循環
        this.startLoop();
    },

    // 3. 戰鬥計時器循環
    startLoop() {
        if (this.combatTimer) clearInterval(this.combatTimer);
        // 設定每 1.2 秒攻擊一次 (可根據敏捷 spd 調整)
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

        // 暴擊倍率處理
        if (isCrit) {
            damage = Math.floor(damage * 2);
        }

        // 實際扣血
        this.currentMonster.currentHp -= damage;
        
        // --- V1.7 核心：觸發浮動傷害跳字 ---
        this.createDamagePopup(damage, isCrit, false);

        // 更新 UI 怪物血量
        UI_Battle.updateMonster(this.currentMonster);

        // 判定怪物是否死亡
        if (this.currentMonster.currentHp <= 0) {
            this.onMonsterDeath();
        } else {
            // 怪物沒死，會在 0.5 秒後反擊
            setTimeout(() => this.monsterAttack(), 500);
        }
    },

    // 5. 怪物反擊邏輯
    monsterAttack() {
        if (!this.currentMonster || this.currentMonster.currentHp <= 0) return;

        const monsterDmg = Math.max(1, this.currentMonster.atk);
        
        // --- V1.7 核心：觸發怪物傷害跳字 (紅字) ---
        this.createDamagePopup(monsterDmg, false, true);
        
        // 日誌記錄
        UI_Log.add(`[${this.currentMonster.name}] 發動攻擊，對你造成了 ${monsterDmg} 點傷害。`, 'monster');
        
        // (此處可後續擴充玩家 HP 扣減邏輯)
    },

    // 6. 實裝：傷害跳字 DOM 生成 (V1.7 視覺重點)
    createDamagePopup(dmg, isCrit, isFromMonster) {
        const container = document.getElementById('damage-container');
        if (!container) return;

        const popup = document.createElement('span');
        popup.className = 'dmg-popup';
        
        // 根據類型賦予 CSS 類名 (對應 style.css)
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

        // 隨機位置偏移，讓數字不重疊
        const offset = Math.random() * 40 - 20;
        popup.style.left = `calc(50% + ${offset}px)`;
        popup.style.top = `40%`;

        container.appendChild(popup);

        // 動畫結束後自毀，防止 DOM 過多造成卡頓 (1秒)
        setTimeout(() => {
            if (popup.parentElement) {
                container.removeChild(popup);
            }
        }, 1000);
    },

    // 7. 怪物死亡結算
    onMonsterDeath() {
        this.stop();
        
        // A. 播放消散效果 (透過 UI 控制)
        UI_Battle.playMonsterDieAnim();

        // B. 結算獎勵 (整合 Player.js 的悟性加成)
        const expResult = Player.gainExp(this.currentMonster.exp);
        Player.data.coin += this.currentMonster.gold;
        Player.save();

        UI_Log.add(`擊敗 [${this.currentMonster.name}]！`, 'reward');
        UI_Log.add(`獲得修為：${expResult.totalExp} (+${expResult.bonusAmount} 悟性加成), 靈石：${this.currentMonster.gold}`, 'reward');

        // C. 隨機掉落邏輯 (可擴充)
        // ... (此處可對齊 data.js 的 drops 進行隨機判定)

        // D. 進入搜尋過渡期 (取代 V1.6 的硬停滯)
        this.enterSearchingState();
    },

    // 8. 搜尋怪物的過渡狀態
    enterSearchingState() {
        this.isSearching = true;
        this.currentMonster = null;
        
        // UI 顯示「搜尋中」視覺效果
        UI_Battle.showSearching(true);

        // 1.2 秒後找到下一隻怪，讓流程有節奏感
        setTimeout(() => {
            UI_Battle.showSearching(false);
            this.isSearching = false;
            this.spawnMonster();
        }, 1200);
    },

    // 停止戰鬥 (如切換地圖時)
    stop() {
        if (this.combatTimer) {
            clearInterval(this.combatTimer);
            this.combatTimer = null;
        }
    }
};

// 確保全域可用
window.Combat = Combat;
