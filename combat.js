/**
 * 宗門修仙錄 - 戰鬥模組 (combat.js) V1.4.1
 * 職責：處理戰鬥循環、手動/自動技能釋放、傷害計算與特效觸發
 */
function Combat(core) {
    this.core = core;
    this.m = null;
}

/**
 * 妖獸降臨：根據地圖生成對應等級的妖獸
 */
Combat.prototype.spawn = function() {
    var p = this.core.player;
    if (p.battle.isDead) return;
    
    var map = GAME_DATA.MAPS[p.data.mapId];
    var mList = map.monsters;
    var mBase = GAME_DATA.MONSTERS[mList[Math.floor(Math.random() * mList.length)]];
    var scale = map.lv;

    this.m = {
        name: mBase.name,
        pic: mBase.pic,
        exp: mBase.exp,
        coin: mBase.coin,
        maxHp: mBase.hp * scale,
        hp: mBase.hp * scale,
        atk: mBase.atk * scale
    };
    
    this.core.ui.updateHPs(p, this.m);
};

/**
 * 玩家攻擊邏輯：含暴擊判定、自動技能觸發與特效
 */
Combat.prototype.playerAtk = function(isManual) {
    var p = this.core.player;
    // 若無怪或怪已死，手動點擊則刷怪
    if (!this.m || this.m.hp <= 0) {
        if (isManual) this.spawn();
        return;
    }

    // 基礎傷害計算
    var dmg = Math.max(1, Math.floor(p.battle.atk * (0.9 + Math.random() * 0.2)));
    var isCrit = Math.random() < p.battle.crit;
    if (isCrit) {
        dmg = Math.floor(dmg * p.battle.critDmg);
    }

    // 觸發 UI 特效：傷害噴字與畫面抖動
    this.core.ui.showDamage(dmg, isCrit);

    // 執行攻擊
    this.m.hp -= dmg;

    // 吸血邏輯
    if (p.battle.lifeSteal > 0) {
        var heal = Math.floor(dmg * p.battle.lifeSteal);
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
    }

    // 自動主動技能觸發 (機率觸發)
    for (var i = 0; i < p.data.skills.length; i++) {
        var sId = p.data.skills[i];
        if (sId !== null) {
            var s = GAME_DATA.SKILLS[sId];
            if (s && s.type === 'active' && Math.random() < (s.proc || 0.1)) {
                this.executeSkill(s);
            }
        }
    }

    if (this.m.hp <= 0) {
        this.m.hp = 0;
        this.onDeath();
    } else {
        this.core.ui.updateHPs(p, this.m);
        // 若非手動連點，則觸發怪物的反擊
        if (!isManual) {
            var self = this;
            setTimeout(function() {
                self.monsterAtk();
            }, 300);
        }
    }
};

/**
 * 手動神通釋放：由 UI 點擊技能槽觸發
 */
Combat.prototype.manualSkill = function(slotIdx) {
    var p = this.core.player;
    var sId = p.data.skills[slotIdx];
    
    // 檢查是否存在技能、怪物、以及冷卻狀態
    if (sId === null || !this.m || p.skillCDs[slotIdx] > 0) return;

    var s = GAME_DATA.SKILLS[sId];
    this.core.ui.log("✨ 宗主施展神通：【" + s.name + "】", 'combat', 'orange');
    
    // 執行效果
    this.executeSkill(s);

    // 設置 CD (10秒) 並啟動 UI 動畫
    p.skillCDs[slotIdx] = 10;
    this.core.ui.startCDAnimation(slotIdx, 10);
};

/**
 * 執行具體技能效果
 */
Combat.prototype.executeSkill = function(s) {
    var p = this.core.player;
    if (s.effect.dmgMul && this.m) {
        var sDmg = Math.floor(p.battle.atk * s.effect.dmgMul);
        this.m.hp -= sDmg;
        this.core.ui.showDamage(sDmg, true); // 神通必噴字
        this.core.ui.log("🔥 " + s.name + " 造成 " + sDmg + " 點重創！", 'combat', 'orange');
    }
    if (s.effect.healMul) {
        var heal = Math.floor(p.battle.maxHp * s.effect.healMul);
        p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
        this.core.ui.log("✨ " + s.name + " 回復 " + heal + " 點生命值！", 'combat', '#4caf50');
    }
    this.core.ui.updateHPs(p, this.m);
};

/**
 * 怪物攻擊邏輯
 */
Combat.prototype.monsterAtk = function() {
    var p = this.core.player;
    if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

    // 閃避判定
    if (Math.random() < p.battle.dodge) {
        this.core.ui.log("💨 瞬身閃避了 " + this.m.name + " 的攻擊", 'combat', 'cyan');
        return;
    }

    // 傷害計算 (防禦減傷公式)
    var dmg = Math.max(1, Math.floor(this.m.atk * (500 / (500 + p.battle.def))));
    p.battle.hp -= dmg;

    if (p.battle.hp <= 0) {
        p.battle.hp = 0;
        p.battle.isDead = true;
        this.core.ui.updateHPs(p, this.m);
        this.core.ui.toast("力竭倒地，回氣中...", "red");
        
        var self = this;
        setTimeout(function() {
            p.battle.hp = p.battle.maxHp;
            p.battle.isDead = false;
            self.spawn();
        }, 3000);
    } else {
        this.core.ui.updateHPs(p, this.m);
    }
};

/**
 * 戰鬥結算
 */
Combat.prototype.onDeath = function() {
    var p = this.core.player;
    var target = this.m;
    this.m = null;

    this.core.ui.log("擊敗 " + target.name + "！", 'combat', 'gold');
    
    // 獲取經驗與等級提升
    if (p.addExp(target.exp)) {
        this.core.ui.toast("✨ 境界精進，修為提升！", "gold");
    }

    // 獲取靈石
    var mGain = Math.floor(target.coin * p.battle.moneyMul);
    p.data.money += mGain;
    this.core.ui.log("獲得靈石：🪙" + mGain, 'loot');

    // 掉落判定
    this.core.inventory.dropLoot(p.data.mapId);

    p.save();
    this.core.ui.renderAll();
    
    // 延遲後生成下一隻怪
    var self = this;
    setTimeout(function() {
        if (!p.battle.isDead) self.spawn();
    }, 1200);
};
