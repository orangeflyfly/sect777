/**
 * V1.8.0 CombatEngine.js
 * 職責：戰鬥流程控制、傷害判定邏輯、獎勵結算
 * 核心：純邏輯運算，透過 MessageCenter 輸出，與 UI 完全解耦
 */
const CombatEngine = {
    currentMonster: null,
    isProcessing: false, // 戰鬥鎖，防止過快點擊或邏輯重疊
    currentMapId: 101,

    // 1. 初始化戰鬥區域
    init(mapId) {
        this.currentMapId = mapId || 101;
        this.isProcessing = false;
        this.spawnMonster();
    },

    // 2. 尋找並生成妖獸
    spawnMonster() {
        // 從世界資料中找出地圖資訊
        const map = this.getMapData(this.currentMapId);
        if (!map || !map.monsterIds) {
            Msg.log("此地靈氣稀薄，尋不見妖獸蹤跡。", "system");
            return;
        }

        // 隨機挑選怪物並建立戰鬥實體
        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        const template = DATA.MONSTERS[monsterId];

        this.currentMonster = {
            ...template,
            hp: template.hp,
            maxHp: template.hp
        };

        // 通知 UI 更新怪物外觀 (如果 UI 已載入)
        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);
        Msg.log(`【歷練】一隻 ${template.name} 攔住了你的去路！`, "monster");
    },

    // 3. 玩家發起進攻 (由 HTML 按鈕觸發)
    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        
        // 鎖定狀態，進入回合流程
        this.isProcessing = true;
        this.executeTurn(true); 
    },

    // 4. 核心回合處理
    executeTurn(isPlayerTurn) {
        const attacker = isPlayerTurn ? "修士" : this.currentMonster.name;
        const target = isPlayerTurn ? this.currentMonster : Player; // 注意：Player 物件
        
        // A. 取得基礎攻擊力
        const attackerAtk = isPlayerTurn ? Player.getBattleStats().atk : this.currentMonster.atk;

        // B. 透過 Formula 計算浮動傷害
        const damage = Formula.getDamageRange(attackerAtk);

        // C. 結算傷害
        if (isPlayerTurn) {
            this.currentMonster.hp -= damage;
            Msg.log(`你揮動法寶，對 ${this.currentMonster.name} 造成 ${damage} 點傷害。`, "player-atk");
        } else {
            // 此處假設 Player.data 有 hp 屬性，若無則暫時不扣 (掛機邏輯)
            Msg.log(`${this.currentMonster.name} 發動反擊，對你造成 ${damage} 點傷害。`, "monster-atk");
        }

        // D. 更新顯示
        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);

        // E. 檢查生死判定
        this.checkBattleStatus(isPlayerTurn);
    },

    // 5. 生死判定與流程跳轉
    checkBattleStatus(wasPlayerTurn) {
        if (this.currentMonster.hp <= 0) {
            // 怪物死亡
            this.handleVictory();
        } else if (wasPlayerTurn) {
            // 怪物沒死，0.5秒後自動發動反擊
            setTimeout(() => this.executeTurn(false), 500);
        } else {
            // 怪物攻擊結束，解鎖，等待玩家下一次點擊或自動戰鬥邏輯
            this.isProcessing = false;
        }
    },

    // 6. 勝利獎勵結算
    handleVictory() {
        const m = this.currentMonster;
        Msg.log(`${m.name} 哀鳴一聲，化作靈氣消散。`, "system");

        // A. 經驗與靈石結算
        const gainedExp = Player.gainExp(m.exp);
        Player.data.coin += m.gold;
        Msg.log(`獲得修為：${gainedExp}，靈石：${m.gold}。`, "reward");

        // B. 掉落判定 (利用 ItemFactory)
        this.processLoot(m);

        // C. 清場並準備下一隻
        this.currentMonster = null;
        setTimeout(() => {
            this.isProcessing = false;
            this.spawnMonster();
        }, 1500);
    },

    // 7. 掉落邏輯 (整合天工爐)
    processLoot(monster) {
        // 基礎 20% 掉寶率
        if (Math.random() < 0.2) {
            const newItem = ItemFactory.createEquipment();
            Player.addItem(newItem);
        }
    },

    // 輔助：尋找地圖資料
    getMapData(id) {
        for (let r in DATA.REGIONS) {
            const map = DATA.REGIONS[r].maps.find(m => m.id == id);
            if (map) return map;
        }
        return null;
    }
};
