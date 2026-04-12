/**
 * 宗門修仙錄 - 玩家數據模組 (player.js)
 */
class Player {
    constructor() {
        // 初始數據結構
        this.data = {
            lv: 1, 
            exp: 0, 
            money: 100, 
            pts: 0,
            baseStats: { str: 10, vit: 10, agi: 10, int: 10 },
            bag: [],
            equips: { weapon: null, body: null },
            skills: [null, null, null],
            learnedSkills: [0],
            mapId: 0
        };

        // 戰鬥即時數據
        this.battle = { 
            hp: 100, 
            maxHp: 100, 
            atk: 10, 
            def: 5, 
            spd: 10, 
            dodge: 0.05, 
            power: 0, 
            regen: 0, 
            lifeSteal: 0, 
            dmgFloor: 0.005, 
            isDead: false 
        };

        this.load();    // 先讀取存檔
        this.refresh(); // 再計算最終數值
        
        // 確保剛進遊戲時是滿血狀態
        this.battle.hp = this.battle.maxHp;
    }

    // 重新計算屬性 (加點或換裝後調用)
    refresh() {
        const d = this.data; 
        const b = this.battle;

        // 1. 基礎屬性計算
        b.maxHp = d.baseStats.vit * 20 + d.lv * 10;
        b.atk = d.baseStats.str * 3 + d.lv * 2;
        b.def = d.baseStats.vit * 1.5;
        // 閃避曲線：身法越高收益越低，最高 75%
        b.dodge = Math.min(0.75, (d.baseStats.agi / (d.baseStats.agi + 200)));
        
        b.regen = 0; 
        b.lifeSteal = 0; 
        b.dmgFloor = 0.005; // 預設 0.5% 保底傷害

        // 2. 裝備加成計算
        Object.values(d.equips).forEach(eq => {
            if (!eq) return;
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp) b.maxHp += eq.hp;
            if (eq.regen) b.regen += eq.regen;
            if (eq.lifeSteal) b.lifeSteal += eq.lifeSteal;
            // 天道豁免詞條
            if (eq.dmgFloorReduce) b.dmgFloor = Math.max(0.001, b.dmgFloor - eq.dmgFloorReduce);
        });

        // 3. 被動技能加成
        d.skills.forEach(id => {
            if (id !== null && GAME_DATA && GAME_DATA.SKILLS[id]) {
                const s = GAME_DATA.SKILLS[id];
                if (s.type === 'passive' && s.effect) {
                    if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
                    if (s.effect.defMul) b.def *= s.effect.defMul;
                }
            }
        });

        // 4. 戰力綜合評定
        b.power = Math.floor(b.atk * 5 + b.def * 3 + b.maxHp / 10);
        
        // 5. 修正血量上限 (防止血量溢出，但不隨意補滿)
        if (b.hp > b.maxHp) b.hp = b.maxHp;
    }

    save() {
        localStorage.setItem('ImmortalData_V1', JSON.stringify(this.data));
    }

    load() {
        const saved = localStorage.getItem('ImmortalData_V1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // 使用深度合併或逐項賦值，確保 baseStats 不會遺失
                this.data = { ...this.data, ...parsed };
                // 針對嵌套對象進行強化，防止舊數據格式出錯
                if (parsed.baseStats) this.data.baseStats = { ...parsed.baseStats };
                if (parsed.equips) this.data.equips = { ...parsed.equips };
            } catch (e) {
                console.error("存檔讀取失敗，可能是格式不相容");
            }
        }
    }

    addExp(val) {
        this.data.exp += val; 
        let need = this.data.lv * 100;
        if (this.data.exp >= need) {
            this.data.exp -= need; 
            this.data.lv++; 
            this.data.pts += 5; 
            this.refresh(); 
            return true; // 升級了
        }
        return false;
    }
}
