/**
 * 宗門修仙錄 - 戰鬥邏輯模組 (鬥法台)
 */

class Combat {
    constructor(player) {
        this.p = player;
        this.m = null; // 當前怪物
        this.timer = null;
        this.K = 500;  // 護甲常數 (軟減傷用)
    }

    // 生成怪物
    spawn() {
        if (this.p.battle.isDead) return;
        
        const map = GAME_DATA.MAPS[this.p.data.mapId];
        const mId = map.monsters[Math.floor(Math.random() * map.monsters.length)];
        const mBase = GAME_DATA.MONSTERS[mId];
        
        // 根據地圖等級強化怪物
        const lvScale = map.lv;
        this.m = {
            ...mBase,
            hp: mBase.hp * lvScale,
            maxHp: mBase.hp * lvScale,
            atk: mBase.atk * lvScale
        };
        
        _X_CORE.ui.log(`遇到了一隻 ${this.m.name}！`, 'combat');
        _X_CORE.ui.renderMonster(this.m);
    }

    // 玩家攻擊
    playerAtk() {
        if (!this.m || this.p.battle.isDead) return;

        let dmg = Math.max(1, Math.floor(this.p.battle.atk * (0.9 + Math.random() * 0.2)));
        
        // 簡單爆擊判定 (未來可擴充)
        if (Math.random() < 0.1) {
            dmg *= 2;
            _X_CORE.ui.log(`【暴擊】對 ${this.m.name} 造成了 ${dmg} 點傷害！`, 'combat', 'orange');
        } else {
            _X_CORE.ui.log(`對 ${this.m.name} 造成了 ${dmg} 點傷害。`, 'combat');
        }

        this.m.hp -= dmg;

        // --- 實裝：吸血邏輯 ---
        if (this.p.battle.lifeSteal > 0) {
            const heal = Math.floor(dmg * this.p.battle.lifeSteal);
            if (heal > 0) {
                this.p.battle.hp = Math.min(this.p.battle.maxHp, this.p.battle.hp + heal);
                _X_CORE.ui.log(`吸血觸發：回復了 ${heal} 點生命。`, 'combat', 'green');
            }
        }

        if (this.m.hp <= 0) {
            this.m.hp = 0;
            this.onMonsterDeath();
        } else {
            // 怪物反擊
            setTimeout(() => this.monsterAtk(), 500);
        }
        
        _X_CORE.ui.updateHPs(this.p, this.m);
    }

    // 怪物攻擊 (實裝：軟減傷與保底傷害)
    monsterAtk() {
        if (!this.m || this.m.hp <= 0 || this.p.battle.isDead) return;

        // 1. 閃避判定 (最高 75%)
        if (Math.random() < this.p.battle.dodge) {
            _X_CORE.ui.log(`✨ 巧妙閃避了 ${this.m.name} 的攻擊！`, 'combat', 'cyan');
            return;
        }

        // 2. 軟減傷計算
        const rawDmg = this.m.atk;
        const reduction = this.K / (this.K + this.p.battle.def);
        let finalDmg = Math.floor(rawDmg * reduction);

        // 3. 天道保底判定 (0.5% 或 裝備豁免後的值)
        const floorDmg = Math.floor(this.p.battle.maxHp * this.p.battle.dmgFloor);
        if (finalDmg < floorDmg) {
            finalDmg = floorDmg;
        }

        this.p.battle.hp -= finalDmg;
        _X_CORE.ui.log(`${this.m.name} 發動攻擊，受到 ${finalDmg} 點傷害。`, 'combat', 'red');

        if (this.p.battle.hp <= 0) {
            this.p.battle.hp = 0;
            this.onPlayerDeath();
        }
        
        _X_CORE.ui.updateHPs(this.p, this.m);
    }

    // 擊敗怪物處理
    onMonsterDeath() {
        _X_CORE.ui.log(`擊敗了 ${this.m.name}！`, 'combat', 'gold');
        
        // 獲取經驗與靈石
        const isLevelUp = this.p.addExp(this.m.exp);
        this.p.data.money += this.m.coin;
        _X_CORE.ui.log(`獲得修為 +${this.m.exp}，靈石 +${this.m.coin}`, 'exp');
        
        if (isLevelUp) {
            _X_CORE.ui.toast("✨ 境界突破！獲得屬性點 ✨", "gold");
        }

        // 掉落判定
        _X_CORE.inventory.dropLoot(this.p.data.mapId);

        this.m = null;
        this.p.save();
        
        // 1秒後刷新下一隻
        setTimeout(() => this.spawn(), 1000);
    }

    // 玩家死亡處理 (5秒重生)
    onPlayerDeath() {
        this.p.battle.isDead = true;
        _X_CORE.ui.log(`力戰不敵，眼前一黑...`, 'combat', '#888');
        _X_CORE.ui.toast("🕯️ 身負重傷，打坐調息中...", "red");

        let countdown = 5;
        const respawnTimer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(respawnTimer);
                this.respawn();
            } else {
                _X_CORE.ui.log(`傷勢重塑中... (${countdown}s)`, 'system');
            }
        }, 1000);
    }

    respawn() {
        this.p.battle.hp = this.p.battle.maxHp;
        this.p.battle.isDead = false;
        _X_CORE.ui.toast("🌅 傷勢痊癒，重返歷練！", "green");
        _X_CORE.ui.log(`重新凝聚神識，再戰江湖！`, 'system');
        this.spawn();
    }
}

console.log("[系統] 鬥法台 (combat.js) 已就緒");
