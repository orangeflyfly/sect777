/**
 * 宗門修仙錄 - 戰鬥邏輯模組 (combat.js)
 */
class Combat {
    constructor(core) { 
        this.core = core; 
        this.m = null; 
        this.K = 500; // 護甲常數
    }

    // 1. 生成怪物 (加強了邊界檢查)
    spawn() {
        const p = this.core.player;
        if (p.battle.isDead) return;
        
        const map = GAME_DATA.MAPS[p.data.mapId];
        if (!map) {
            this.core.ui.log("此處荒蕪一物，請切換地圖。", "system", "red");
            return;
        }

        // 隨機選取怪物並根據地圖等級強化
        const mPool = map.monsters;
        const mBase = GAME_DATA.MONSTERS[mPool[Math.floor(Math.random() * mPool.length)]];
        
        this.m = { 
            ...mBase, 
            hp: mBase.hp * map.lv, 
            maxHp: mBase.hp * map.lv, 
            atk: mBase.atk * map.lv 
        };

        this.core.ui.log(`遇到了一隻 ${this.m.name}！`, 'combat');
        this.core.ui.renderMonster(this.m);
        this.core.ui.updateHPs(p, this.m);
    }

    // 2. 玩家攻擊 (加入了戰鬥狀態判定)
    playerAtk() {
        const p = this.core.player;
        if (!this.m || p.battle.isDead) return;

        // 計算基礎傷害與震盪值
        const baseAtk = p.battle.atk;
        let dmg = Math.floor(baseAtk * (0.9 + Math.random() * 0.2));
        dmg = Math.max(1, dmg);

        // 暴擊判定 (10% 機率)
        if (Math.random() < 0.1) { 
            dmg *= 2; 
            this.core.ui.log(`【暴擊】對 ${this.m.name} 造成了 ${dmg} 點傷害！`, 'combat', 'orange'); 
        } else { 
            this.core.ui.log(`對 ${this.m.name} 造成了 ${dmg} 點傷害。`, 'combat'); 
        }

        this.m.hp -= dmg;

        // 實裝：已傷害的 % 數回血 (吸血)
        if (p.battle.lifeSteal > 0) {
            const heal = Math.floor(dmg * p.battle.lifeSteal);
            if (heal > 0) {
                p.battle.hp = Math.min(p.battle.maxHp, p.battle.hp + heal);
                // 這裡不頻繁打印吸血日誌以保持清爽
            }
        }

        // 判定怪物是否死亡
        if (this.m.hp <= 0) { 
            this.m.hp = 0;
            this.onMonsterDeath(); 
        } else { 
            // 怪物若未死，0.6秒後反擊
            setTimeout(() => {
                if (this.m && this.m.hp > 0) this.monsterAtk();
            }, 600); 
        }
        
        this.core.ui.updateHPs(p, this.m);
    }

    // 3. 怪物反擊 (修復了冗長計算導致的 X)
    monsterAtk() {
        const p = this.core.player;
        if (!this.m || this.m.hp <= 0 || p.battle.isDead) return;

        // 閃避判定
        if (Math.random() < p.battle.dodge) { 
            this.core.ui.log(`✨ 巧妙閃避了 ${this.m.name} 的攻擊！`, 'combat', 'cyan'); 
            return; 
        }

        // 軟減傷公式：實際傷害 = 原始傷害 * (K / (K + 防禦))
        const rawDmg = this.m.atk;
        const defense = p.battle.def;
        const reduction = this.K / (this.K + defense);
        let finalDmg = Math.floor(rawDmg * reduction);

        // 天道保底傷害判定 (預設 0.5% 最大生命值)
        const floorDmg = Math.floor(p.battle.maxHp * p.battle.dmgFloor);
        if (finalDmg < floorDmg) {
            finalDmg = floorDmg;
        }

        p.battle.hp -= finalDmg;
        this.core.ui.log(`${this.m.name} 發動攻擊，受到 ${finalDmg} 點傷害。`, 'combat', 'red');

        if (p.battle.hp <= 0) {
            p.battle.hp = 0;
            this.onPlayerDeath();
        }
        
        this.core.ui.updateHPs(p, this.m);
    }

    // 4. 擊敗獎勵
    onMonsterDeath() {
        const p = this.core.player;
        this.core.ui.log(`成功擊敗 ${this.m.name}！`, 'combat', 'gold');

        // 經驗與境界判定
        if (p.addExp(this.m.exp)) {
            this.core.ui.toast("✨ 境界突破！獲得屬性點 ✨", "gold");
            this.core.ui.log("恭喜突破境界，修為大增！", "exp", "gold");
        }
        
        p.data.money += this.m.coin;
        this.core.ui.log(`獲得修為 +${this.m.exp}，靈石 +${this.m.coin}`, 'exp');

        // 掉落判定
        this.core.inventory.dropLoot(p.data.mapId);

        // 清除當前怪，存檔，並於 1 秒後尋找新怪
        this.m = null; 
        p.save();
        setTimeout(() => this.spawn(), 1000);
    }

    // 5. 死亡與重生 (5秒原地回滿)
    onPlayerDeath() {
        const p = this.core.player;
        p.battle.isDead = true;
        this.core.ui.log(`眼前一黑，重傷倒地...`, 'combat', '#888');
        this.core.ui.toast("🕯️ 正在原地打坐調息...", "red");

        setTimeout(() => { 
            p.battle.hp = p.battle.maxHp; 
            p.battle.isDead = false; 
            this.core.ui.toast("🌅 傷勢痊癒，重返歷練！", "green");
            this.spawn(); 
        }, 5000);
    }
}
