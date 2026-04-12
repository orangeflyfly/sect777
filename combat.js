/**
 * V1.5.7 combat.js
 * 職責：處理玩家與怪物的每一刀傷害。
 */
const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    init: function() {
        this.initBattle();
    },

    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId) || region.maps[0];
        
        let mData;
        if (isBoss) {
            mData = GAMEDATA.MONSTERS[region.bossId];
        } else {
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            mData = GAMEDATA.MONSTERS[mId];
        }

        this.currentMonster = JSON.parse(JSON.stringify(mData));
        this.currentMonster.maxHp = mData.hp;
        this.currentMonster.hp = mData.hp;

        UI_Battle.renderBattle(this.currentMonster);
        this.startLoop();
    },

    startLoop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.combatTick(), 1000); // 每秒自動打一刀
    },

    combatTick: function() {
        if (!this.currentMonster) return;
        this.playerAttack(false); // 自動攻擊
        if (this.currentMonster.hp <= 0) return this.onMonsterDeath();
        
        this.monsterAttack();
        if (player.data.hp <= 0) return this.onPlayerDeath();

        UI_Battle.renderBattle(this.currentMonster);
    },

    // 攻擊邏輯 (isManual = true 代表玩家點擊)
    playerAttack: function(isManual = false) {
        if (!this.currentMonster) return;
        
        let dmg = player.data.str * 2;
        if (isManual) dmg *= 1.2; // 手動點擊額外加成 20% 傷害
        
        let isCrit = Math.random() < 0.1;
        if (isCrit) dmg *= 2;

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】${isManual ? '奮力' : ''}一擊，造成 ${Math.ceil(dmg)} 點傷害`, isCrit ? 'system' : 'player');

        if (isManual) UI_Battle.renderBattle(this.currentMonster); // 手動點擊立即刷血條
    },

    monsterAttack: function() {
        let dmg = Math.max(1, this.currentMonster.atk - (player.data.con * 0.5));
        player.data.hp -= dmg;
        this.log(`【${this.currentMonster.name}】反擊，造成 ${Math.ceil(dmg)} 點傷害`, 'monster');
    },

    onMonsterDeath: function() {
        clearInterval(this.timer);
        this.log(`【系統】擊敗了 ${this.currentMonster.name}！`, 'system');
        
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        
        if (!this.isBossBattle) player.data.killCount++;
        
        player.checkLevelUp();
        player.save();
        setTimeout(() => this.initBattle(), 1000);
    },

    onPlayerDeath: function() {
        clearInterval(this.timer);
        this.log(`【慘烈】你倒下了，正在原地調息...`, 'system');
        player.data.hp = player.data.maxHp;
        setTimeout(() => this.initBattle(), 3000);
    },

    log: function(msg, type) {
        const logBox = document.getElementById('battle-logs');
        if (!logBox) return;
        const div = document.createElement('div');
        div.className = `log-item log-${type}`;
        div.innerText = msg;
        logBox.prepend(div);
        if (logBox.children.length > 20) logBox.lastChild.remove();
    }
};
