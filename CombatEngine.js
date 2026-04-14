/**
 * V1.8.2 CombatEngine.js
 * 職責：純邏輯戰鬥流程，自動回合切換
 * 修正點：修復玩家無敵狀態、實裝陣亡判定、修復地圖重生鬼打牆 Bug、新增掉落物廣播
 */
const CombatEngine = {
    currentMonster: null,
    isProcessing: false,
    currentMapId: 101, // 記憶當前所在的地圖 ID，避免打完怪飛回新手村

    init(mapId = 101) {
        this.currentMapId = mapId;
        this.spawnMonster(mapId);
    },

    spawnMonster(mapId) {
        const map = this.findMapData(mapId);
        if (!map) return;

        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        const template = DATA.MONSTERS[monsterId];

        this.currentMonster = { ...template, hp: template.hp, maxHp: template.hp };
        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);
        
        // 將 type 改為 system，對齊新版的 CSS 顏色配置
        Msg.log(`【歷練】遇到 ${template.name}！`, "system"); 
    },

    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        this.isProcessing = true;
        this.executeTurn(true);
    },

    executeTurn(isPlayerTurn) {
        const target = isPlayerTurn ? this.currentMonster : Player;
        const attackerAtk = isPlayerTurn ? Player.getBattleStats().atk : this.currentMonster.atk;
        
        const damage = Formula.getDamageRange(attackerAtk);

        if (isPlayerTurn) {
            this.currentMonster.hp -= damage;
            Msg.log(`你攻擊造成 ${damage} 點傷害。`, "player-atk");
        } else {
            // V1.8.2 實裝：玩家真實扣血邏輯
            Player.data.hp -= damage;
            Msg.log(`${this.currentMonster.name} 反擊造成 ${damage} 點傷害。`, "monster-atk");
            
            // 同步更新玩家血條 UI
            if (window.UI_Battle) {
                const pStats = Player.getBattleStats();
                UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
            }
        }

        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);

        // 生死判定
        if (this.currentMonster.hp <= 0) {
            this.handleVictory();
        } else if (!isPlayerTurn && Player.data.hp <= 0) {
            // V1.8.2 實裝：玩家陣亡判定
            this.handleDefeat();
        } else if (isPlayerTurn) {
            // 玩家攻擊完，延遲 0.6 秒換怪物攻擊
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            this.isProcessing = false; // 敵方回合結束，解鎖，等待玩家按鈕
        }
    },

    handleVictory() {
        const m = this.currentMonster;
        Msg.log(`${m.name} 已被擊敗。`, "system");
        const exp = Player.gainExp(m.exp);
        Player.data.coin += m.gold;
        Msg.log(`獲得經驗 ${exp}，靈石 ${m.gold}`, "reward");

        // 隨機掉落
        if (Math.random() < 0.2) {
            const item = ItemFactory.createEquipment();
            Player.addItem(item);
            Msg.log(`🎊 獲得戰利品：【${item.name}】！`, "reward"); // 增加掉落物廣播
        }

        // 同步頂部狀態列的靈石與經驗
        if (window.Core) Core.updateUI();

        this.currentMonster = null;
        setTimeout(() => { 
            this.isProcessing = false; 
            // V1.8.2 修正：根據當前地圖重新生成怪物，不再永遠 101
            this.spawnMonster(this.currentMapId); 
        }, 1500);
    },

    handleDefeat() {
        Msg.log(`你被 ${this.currentMonster.name} 擊敗了... 重傷昏迷。`, "monster-atk");
        this.currentMonster = null;

        // 死亡處理邏輯：由長老救回，恢復滿血
        const pStats = Player.getBattleStats();
        Player.data.hp = pStats.maxHp; 
        
        setTimeout(() => {
            Msg.log(`在宗門長老的救治下，你已甦醒。`, "system");
            if (window.UI_Battle) {
                UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
                UI_Battle.updateMonster(null);
            }
            if (window.Core) Core.updateUI();
            
            // 重新開始當前地圖的歷練
            this.isProcessing = false;
            this.spawnMonster(this.currentMapId);
        }, 2000);
    },

    findMapData(id) {
        for (let r in DATA.REGIONS) {
            const map = DATA.REGIONS[r].maps.find(m => m.id == id);
            if (map) return map;
        }
        return null;
    }
};
