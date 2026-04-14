/**
 * V1.8.2 CombatEngine.js
 * 修正點：加入數據追蹤日誌、防止靜默失敗、強化地圖與怪物尋找邏輯
 */
const CombatEngine = {
    currentMonster: null,
    isProcessing: false,
    currentMapId: 101,

    init(mapId = 101) {
        console.log(`%c【戰鬥引擎】啟動歷練，目標地圖 ID: ${mapId}`, "color: #a78bfa; font-weight: bold;");
        this.currentMapId = mapId;
        
        // 增加一個微小的延遲，確保 DATA 物件已經完全被瀏覽器解析
        setTimeout(() => {
            this.spawnMonster(mapId);
        }, 50);
    },

    spawnMonster(mapId) {
        const map = this.findMapData(mapId);
        
        // 🔍 偵錯：地圖找不到
        if (!map) {
            console.error(`❌ 找不到地圖數據！ID: ${mapId}。請檢查 data_world.js 是否有此 ID。`);
            Msg.log(`此地妖氣雜亂，暫時尋不到妖獸蹤跡... (ID: ${mapId})`, "system");
            return;
        }

        if (!map.monsterIds || map.monsterIds.length === 0) {
            console.error(`❌ 地圖「${map.name}」內沒有配置 monsterIds！`);
            return;
        }

        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        
        // 🔍 偵錯：怪物模板找不到
        const template = DATA.MONSTERS[monsterId];
        if (!template) {
            console.error(`❌ 找不到怪物模板！ID: ${monsterId}。請檢查 data_monsters.js。`);
            Msg.log(`感覺到強大的氣息，但對方隱藏了真身...`, "system");
            return;
        }

        // 成功生成怪物
        this.currentMonster = { ...template, hp: template.hp, maxHp: template.hp };
        
        if (window.UI_Battle) {
            UI_Battle.updateMonster(this.currentMonster);
        }
        
        Msg.log(`【歷練】遇到 ${template.name}！`, "system"); 
    },

    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        this.isProcessing = true;
        this.executeTurn(true);
    },

    executeTurn(isPlayerTurn) {
        if (!this.currentMonster || !Player.data) {
            this.isProcessing = false;
            return;
        }

        const target = isPlayerTurn ? this.currentMonster : Player;
        const attackerAtk = isPlayerTurn ? Player.getBattleStats().atk : this.currentMonster.atk;
        
        const damage = Formula.getDamageRange(attackerAtk);

        if (isPlayerTurn) {
            this.currentMonster.hp -= damage;
            Msg.log(`你攻擊造成 ${damage} 點傷害。`, "player-atk");
        } else {
            Player.data.hp -= damage;
            Msg.log(`${this.currentMonster.name} 反擊造成 ${damage} 點傷害。`, "monster-atk");
            
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
            this.handleDefeat();
        } else if (isPlayerTurn) {
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            this.isProcessing = false; 
        }
    },

    handleVictory() {
        const m = this.currentMonster;
        Msg.log(`${m.name} 已被擊敗。`, "system");
        
        const exp = Player.gainExp(m.exp);
        Player.data.coin += (m.gold || 0);
        Msg.log(`獲得經驗 ${exp}，靈石 ${m.gold || 0}`, "reward");

        if (Math.random() < 0.2) {
            const item = ItemFactory.createEquipment();
            Player.addItem(item);
            Msg.log(`🎊 獲得戰利品：【${item.name}】！`, "reward");
        }

        if (window.Core) Core.updateUI();

        this.currentMonster = null;
        setTimeout(() => { 
            this.isProcessing = false; 
            this.spawnMonster(this.currentMapId); 
        }, 1500);
    },

    handleDefeat() {
        Msg.log(`你被 ${this.currentMonster.name} 擊敗了... 重傷昏迷。`, "monster-atk");
        this.currentMonster = null;

        const pStats = Player.getBattleStats();
        Player.data.hp = pStats.maxHp; 
        
        setTimeout(() => {
            Msg.log(`在宗門長老的救治下，你已甦醒。`, "system");
            if (window.UI_Battle) {
                UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
                UI_Battle.updateMonster(null);
            }
            if (window.Core) Core.updateUI();
            
            this.isProcessing = false;
            this.spawnMonster(this.currentMapId);
        }, 2000);
    },

    findMapData(id) {
        // 這裡使用 == 而非 === 是為了防止數字 101 與字串 "101" 對不上的問題
        for (let r in DATA.REGIONS) {
            const map = DATA.REGIONS[r].maps.find(m => m.id == id);
            if (map) return map;
        }
        return null;
    }
};
