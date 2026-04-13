/**
 * ============================================================
 * V1.7.0 全量極致版 combat.js
 * 職責：戰鬥數值計算、掉落物機率判定、怪物生成、UI 同步
 * 【專家承諾：保留所有原始邏輯與掉落演算法，僅修正命名斷點】
 * ============================================================
 */

const Combat = {
    currentMonster: null,
    isProcessing: false, // 戰鬥鎖定旗標，防止連點 Bug
    currentMapId: 101,   // 預設地圖 ID (對應 data.js 的數字格式)

    // 1. 初始化戰鬥區域 (由 UI_Battle 切換地圖時呼叫)
    init(mapId) {
        this.currentMapId = mapId || 101;
        this.isProcessing = false;
        this.spawnMonster();
        console.log(`戰鬥系統已定錨至地圖：${this.currentMapId}`);
    },

    // 2. 生成怪物
    spawnMonster() {
        const mapData = this.getMapData(this.currentMapId);
        // 修正對接：你的 data.js 裡定義的是 monsterIds 陣列
        if (!mapData || !mapData.monsterIds) {
            UI_Battle.log("此地荒蕪，尋不見任何妖獸。", "system");
            return;
        }

        // 從地圖怪物池隨機挑選一隻
        const randomIndex = Math.floor(Math.random() * mapData.monsterIds.length);
        const monsterId = mapData.monsterIds[randomIndex];
        const monsterTemplate = DATA.MONSTERS[monsterId];

        if (!monsterTemplate) return;

        // 建立怪物實體 (深拷貝防止改動原始數據)
        // 修正對接：你的資料庫屬性是 hp，此處同步對齊
        this.currentMonster = {
            ...monsterTemplate,
            hp: monsterTemplate.hp, 
            maxHp: monsterTemplate.hp, // 為了 UI 血條顯示補一個最大值
            id: monsterTemplate.id
        };

        // 更新 UI
        UI_Battle.updateMonster(this.currentMonster);
        UI_Battle.log(`一隻 ${monsterTemplate.name} 出現在你面前！`, "monster");
    },

    // 3. 玩家發起攻擊 (主要由 UI 按鈕觸發)
    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        this.isProcessing = true;

        // A. 取得玩家戰鬥數值 (對接 player.js 補齊的函式)
        const pAtk = Player.calculateAttack(); 
        const damage = Math.max(1, Math.floor(pAtk * (0.9 + Math.random() * 0.2)));

        // B. 怪物扣血
        this.currentMonster.hp -= damage;
        UI_Battle.updateMonster(this.currentMonster);
        UI_Battle.log(`你對 ${this.currentMonster.name} 造成了 ${damage} 點傷害。`, "player-atk");

        // C. 檢查怪物是否死亡
        if (this.currentMonster.hp <= 0) {
            this.handleMonsterDeath();
        } else {
            // 怪物反擊 (延遲 500ms)
            setTimeout(() => this.monsterAttack(), 500);
        }
    },

    // 4. 怪物反擊邏輯
    monsterAttack() {
        if (!this.currentMonster) return;

        const mAtk = this.currentMonster.atk;
        const damage = Math.max(1, Math.floor(mAtk * (0.8 + Math.random() * 0.4)));

        // 更新玩家血量 (此處與 Player 物件連動)
        // 注意：目前 player.js 尚未實裝戰鬥中血量暫存，此處維持邏輯
        UI_Battle.log(`${this.currentMonster.name} 發動攻擊，造成 ${damage} 點傷害。`, "monster-atk");
        
        // 戰鬥結束鎖定解除
        this.isProcessing = false;
    },

    // 5. 處理怪物死亡 (結算經驗、金幣、掉落)
    handleMonsterDeath() {
        UI_Battle.log(`${this.currentMonster.name} 哀鳴一聲，倒地身亡。`, "system");

        // A. 結算獎勵
        const expGained = Player.gainExp(this.currentMonster.exp);
        Player.data.coin += this.currentMonster.gold;

        UI_Battle.log(`獲得經驗值 ${expGained}，靈石 ${this.currentMonster.gold}。`, "reward");

        // B. 判定掉落物 (如果有配置 dropPool)
        if (this.currentMonster.dropPool) {
            this.calculateDrops(this.currentMonster.dropPool);
        }

        // C. 重生怪物
        this.currentMonster = null;
        setTimeout(() => {
            this.isProcessing = false;
            this.spawnMonster();
        }, 1500);
    },

    // 6. 掉落物機率演算法 (全量保留原始邏輯)
    calculateDrops(dropPool) {
        if (!dropPool || !Array.isArray(dropPool)) return;

        dropPool.forEach(drop => {
            const roll = Math.random() * 100;
            if (roll <= drop.rate) {
                const count = drop.min === drop.max ? drop.min : 
                              Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;

                if (count > 0) {
                    this.executeDrop(drop.id, count);
                }
            }
        });
    },

    // 7. 執行掉落 (修正日誌顯示對接)
    executeDrop(itemId, count) {
        // 先找出物品模組以便顯示日誌
        const itemTemplate = DATA.ITEMS[itemId] || DATA.FRAGMENTS[itemId] || DATA.SKILLS[itemId];
        if (!itemTemplate) return;

        // 調用 Player.js 的收納邏輯 (已在 player.js 修正為可接收字串 ID)
        Player.addItem(itemId, count); 

        // 顯示獎勵日誌
        UI_Battle.log(`拾獲 ${itemTemplate.name} x ${count}`, 'reward');
    },

    // 8. 輔助函式：取得地圖數據
    getMapData(mapId) {
        // 遍歷 DATA.REGIONS 找到對應的 mapId
        for (let r in DATA.REGIONS) {
            const map = DATA.REGIONS[r].maps.find(m => m.id == mapId);
            if (map) return map;
        }
        return null;
    }
};
