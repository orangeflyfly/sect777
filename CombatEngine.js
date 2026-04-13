/**
 * V1.8.1 CombatEngine.js
 * 職責：純邏輯戰鬥流程，自動回合切換
 */
const CombatEngine = {
    currentMonster: null,
    isProcessing: false,

    init(mapId = 101) {
        this.spawnMonster(mapId);
    },

    spawnMonster(mapId) {
        const map = this.findMapData(mapId);
        if (!map) return;

        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        const template = DATA.MONSTERS[monsterId];

        this.currentMonster = { ...template, hp: template.hp, maxHp: template.hp };
        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);
        Msg.log(`【歷練】遇到 ${template.name}！`, "monster");
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
            // 此處可擴充玩家扣血邏輯
            Msg.log(`${this.currentMonster.name} 反擊造成 ${damage} 點傷害。`, "monster-atk");
        }

        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);

        // 生死判定
        if (this.currentMonster.hp <= 0) {
            this.handleVictory();
        } else if (isPlayerTurn) {
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            this.isProcessing = false; // 敵方回合結束，解鎖
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
        }

        this.currentMonster = null;
        setTimeout(() => { this.isProcessing = false; this.spawnMonster(101); }, 1500);
    },

    findMapData(id) {
        for (let r in DATA.REGIONS) {
            const map = DATA.REGIONS[r].maps.find(m => m.id == id);
            if (map) return map;
        }
        return null;
    }
};
