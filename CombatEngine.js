/**
 * CombatEngine.js
 * 職責：純粹的戰鬥流程控管 (不含 UI)
 */
const CombatEngine = {
    currentMonster: null,
    isLock: false, // 戰鬥鎖

    // 初始化一場戰鬥
    spawn(monsterId) {
        const template = DATA.MONSTERS[monsterId];
        if (!template) return;

        // 建立實體，使用 Formula 計算最終數值
        this.currentMonster = {
            ...template,
            hp: template.hp,
            maxHp: template.hp
        };
        
        Msg.log(`${template.name} 擋住了你的去路！`, 'monster');
    },

    // 核心攻擊流程
    executeAttack(attacker, target, isPlayer = true) {
        if (this.isLock || !target || target.hp <= 0) return;

        // 1. 計算傷害 (交給 Formula)
        let dmg = isPlayer ? Player.getBattleStats().atk : attacker.atk;
        dmg = Math.floor(dmg * (0.9 + Math.random() * 0.2));

        // 2. 扣除生命
        target.hp -= dmg;
        Msg.log(`${attacker.name} 發動攻擊，造成 ${dmg} 點傷害。`, isPlayer ? 'player-atk' : 'monster-atk');

        // 3. 檢查死亡
        if (target.hp <= 0) {
            this.handleDeath(target, isPlayer);
        }
    },

    handleDeath(entity, isPlayer) {
        if (!isPlayer) {
            Msg.log(`${entity.name} 灰飛煙滅。`, 'system');
            // 掉落獎勵邏輯...
            this.spawn(entity.id); // 重新生成
        } else {
            Msg.log(`你被 ${entity.name} 擊敗了，修為倒退...`, 'red');
        }
    }
};
