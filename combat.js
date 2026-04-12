/**
 * 宗門修仙錄 - 戰鬥模組 (combat.js) V1.3.1
 * 職責：負責怪物生成、戰鬥判定、傷害計算與獎勵發放
 */
function Combat(core) {
    this.core = core;
    this.m = null; // 當前妖獸物件
}

/**
 * 妖獸生成：根據當前地圖等級縮放怪物數值
 */
Combat.prototype.spawn = function() {
    const p = this.core.player;
    // 如果玩家力竭調息中，不生成怪物
    if (p.battle.isDead) return;

    const map = GAME_DATA.MAPS[p.data.mapId];
    const monsterPool = map.monsters;
    const mBase = GAME_DATA.MONSTERS[monsterPool[Math.floor(Math.random() * monsterPool.length)]];

    // 怪物數值隨地圖等級成長 (等級越高，血量攻擊越強)
    const levelScale = map.lv;
    this.m = {
        name: mBase.name,
        pic: mBase.pic,
        maxHp: mBase.hp * levelScale,
        hp: mBase.hp * levelScale,
        atk: mBase.atk * levelScale,
        exp: mBase.exp,
        coin: mBase.coin
    };

    this.core.ui.renderMonster(this.m);
    this.core.ui.updateHPs(p, this.m);
};

/**
 * 玩家攻擊邏輯
 * @param {boolean} isManual 是否為手動點擊觸發
 */
Combat.prototype.playerAtk = function(isManual) {
    const p = this.core.player;
    // 如果沒怪或怪已死
    if (!this.m || this.m.hp <= 0) {
        if (isManual) this.spawn(); // 手動點擊時若無怪則生成
        return;
    }

    // 傷害計算 (基礎攻擊 * 0.9 ~ 1.1 隨機波動)
    let dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    
    // 檢查主動技能觸發 (烈焰斬等)
    p.data.skills.forEach(sId => {
        if (sId !== null) {
            const s = GAME_DATA.SKILLS[sId];
            if (s && s.type === "active" && Math.random() < s.proc) {
                if (s.effect.dmgMul) {
                    dmg *= s.effect.dmgMul;
                    this.core.ui.log(`🔥 觸發神通：${s.name}，造成重創！`, 'combat', 'orange');
                }
                if (s.effect.healMul) {
                    const heal = Math.floor(p.battle.maxHp * s.effect.healMul);
                    p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
                    this.core.ui.log(`✨ 觸發神通：${s.name}，回復 ${heal} 生命`, 'combat', '#4caf50');
                }
            }
        }
    });

    this.m.hp -= dmg;

    // 吸血判定
    if (p.battle.lifeSteal > 0) {
        const heal = Math.floor(dmg * p.battle.lifeSteal);
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
    }

    // 檢查怪物死亡
    if (this.m.hp <= 0) {
        this.m.hp = 0;
        this.core.ui.updateHPs(p, this.m);
        this.onDeath();
    } else {
        // 如果是手動點擊，怪物不立刻反擊；如果是自動，由 core 循環控制或在此觸發
        this.core.ui.updateHPs(p, this.m);
        if (!isManual) {
            // 自動戰鬥時，給予微小延遲增加節奏感
            setTimeout(() => this.monsterAtk(), 200);
        }
    }
};

/**
 * 怪物攻擊邏輯
 */
Combat.prototype.monsterAtk = function() {
    const p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    // 閃避判定
    if (Math.random() < p.battle.dodge) {
        this.core.ui.log(`💨 閃避了 ${this.m.name} 的攻擊`, 'combat', 'cyan');
        return;
    }

    // 傷害計算：怪物攻擊 * (500 / (500 + 玩家防禦)) 減傷公式
    const dmg = Math.max(1, Math.floor(this.m.atk * (500 / (500 + p.battle.def))));
    p.battle.hp -= dmg;

    if (p.battle.hp <= 0) {
        p.battle.hp = 0;
        p.battle.isDead = true;
        this.core.ui.updateHPs(p, this.m);
        this.core.ui.toast("力竭調息中，修復傷勢...", "red");
        
        // 死亡懲罰：暫停戰鬥 3 秒並回滿血
        setTimeout(() => {
            p.battle.hp = p.battle.maxHp;
            p.battle.isDead = false;
            this.core.ui.log("傷勢痊癒，重返歷練！", "system", "gold");
            this.spawn();
        }, 3000);
    } else {
        this.core.ui.updateHPs(p, this.m);
    }
};

/**
 * 擊敗妖獸獎勵結算
 */
Combat.prototype.onDeath = function() {
    const p = this.core.player;
    const target = this.m;
    this.m = null; // 清空當前怪物

    this.core.ui.log(`成功擊敗 ${target.name}！`, 'combat', 'gold');

    // 1. 經驗發放
    const levelUp = p.addExp(target.exp);
    if (levelUp) {
        this.core.ui.toast("✨ 突破！境界提升了！", "gold");
    }

    // 2. 靈石發放
    const coinGain = Math.floor(target.coin * p.battle.moneyMul);
    p.data.money += coinGain;

    // 3. 掉落判定
    this.core.inventory.dropLoot(p.data.mapId);

    p.save();
    
    // 1秒後自動尋找下一隻怪
    setTimeout(() => {
        if (!p.battle.isDead) this.spawn();
    }, 1000);
};
