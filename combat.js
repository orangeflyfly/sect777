/**
 * ============================================================
 * V1.7.0 全量極致版 combat.js
 * 職責：戰鬥數值計算、掉落物機率判定、怪物生成、UI 同步
 * ============================================================
 */

const Combat = {
    currentMonster: null,
    isProcessing: false, // 戰鬥鎖定旗標，防止連點 Bug
    currentMapId: 'map1', // 預設地圖

    // 1. 初始化戰鬥區域 (由 UI_Battle 切換地圖時呼叫)
    init(mapId) {
        this.currentMapId = mapId;
        this.isProcessing = false;
        this.spawnMonster();
        console.log(`戰鬥系統已定錨至地圖：${mapId}`);
    },

    // 2. 生成怪物
    spawnMonster() {
        const mapData = this.getMapData(this.currentMapId);
        if (!mapData || !mapData.monsters) {
            UI_Battle.log("此地荒蕪，尋不見任何妖獸。", "system");
            return;
        }

        // 從地圖怪物池隨機挑選一隻
        const randomIndex = Math.floor(Math.random() * mapData.monsters.length);
        const monsterTemplate = mapData.monsters[randomIndex];

        // 建立怪物實體 (深拷貝防止改動原始數據)
        this.currentMonster = {
            ...monsterTemplate,
            hp: monsterTemplate.maxHp,
            id: monsterTemplate.id
        };

        // 更新 UI
        UI_Battle.updateMonster(this.currentMonster);
    },

    // 3. 玩家攻擊邏輯 (由介面按鈕或定時器觸發)
    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;

        const damage = Player.calculateAttack(); // 假設 Player.js 有此函式
        this.currentMonster.hp -= damage;

        // 戰鬥視覺回饋：震動與日誌
        UI_Battle.triggerShake();
        UI_Battle.log(`你對 ${this.currentMonster.name} 造成了 ${Math.ceil(damage)} 點傷害`, 'monster');

        if (this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            UI_Battle.updateMonster(this.currentMonster);
            this.handleMonsterDeath();
        } else {
            UI_Battle.updateMonster(this.currentMonster);
            // 怪物反擊 (可根據需求設定延遲)
            setTimeout(() => this.monsterAttack(), 500);
        }
    },

    // 4. 怪物反擊邏輯
    monsterAttack() {
        if (!this.currentMonster || this.currentMonster.hp <= 0) return;

        const monsterDmg = this.currentMonster.atk || 5;
        Player.hp -= monsterDmg;
        
        UI_Battle.updatePlayerHP(Player.hp, Player.maxHp);
        UI_Battle.log(`${this.currentMonster.name} 反擊，使你失去了 ${monsterDmg} 點氣血`, 'monster');

        if (Player.hp <= 0) {
            this.handlePlayerDeath();
        }
    },

    // 5. 處理怪物死亡與掉落 (核心修復點)
    handleMonsterDeath() {
        this.isProcessing = true; // 鎖定狀態，結算中
        UI_Battle.log(`${this.currentMonster.name} 哀鳴一聲，化作靈氣消散...`, 'system');

        // 結算掉落物
        this.calculateDrops(this.currentMonster.drops);

        // 結算經驗值
        const expGained = this.currentMonster.exp || 10;
        Player.gainExp(expGained); // 假設 Player.js 處理經驗邏輯
        UI_Battle.log(`修為提升了 ${expGained} 點`, 'system');

        // 延遲後生成下一隻怪物，保持節奏感
        setTimeout(() => {
            this.isProcessing = false;
            this.spawnMonster();
        }, 1500);
    },

    // 6. 掉落物機率演算法 (極致修復：找回丟失的驚喜)
    calculateDrops(dropPool) {
        if (!dropPool || !Array.isArray(dropPool)) return;

        dropPool.forEach(drop => {
            const roll = Math.random() * 100; // 0-100 隨機數
            if (roll <= drop.rate) {
                const count = drop.min === drop.max ? drop.min : 
                              Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;

                if (count > 0) {
                    // 執行實際掉落 (進包包)
                    this.executeDrop(drop.id, count);
                }
            }
        });
    },

    // 7. 執行掉落 (與 Player 及 UI_Bag 連動)
    executeDrop(itemId, count) {
        // 從 DATA 獲取物品詳情
        const itemTemplate = DATA.ITEMS[itemId];
        if (!itemTemplate) return;

        // 調用 Player.js 的收納邏輯
        Player.addItem(itemId, count); 

        // 顯示金色日誌
        UI_Battle.log(`拾獲 ${itemTemplate.name} x ${count}`, 'reward');
    },

    // 8. 輔助函式：取得地圖數據
    getMapData(mapId) {
        // 遍歷 DATA.REGIONS 找到對應的 mapId
        for (let r in DATA.REGIONS) {
            const map = DATA.REGIONS[r].maps.find(m => m.id === mapId);
            if (map) return map;
        }
        return null;
    },

    // 9. 處理玩家死亡
    handlePlayerDeath() {
        UI_Battle.log("你眼前一黑，神魂受創，被迫遁回宗門...", "system");
        Player.hp = Player.maxHp * 0.1; // 復活保留 10% 血量
        UI_Battle.updatePlayerHP(Player.hp, Player.maxHp);
        // 此處可擴充懲罰邏輯，例如扣除靈石
    }
};

// 檔案載入時不自動初始化，由 Core.js 統一控管生命週期
