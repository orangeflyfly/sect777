/**
 * 宗門修仙錄 - 玩家數據模組 (本命命牌)
 */

class Player {
    constructor() {
        // 基礎存檔數據
        this.data = {
            lv: 1,
            exp: 0,
            money: 100,
            pts: 0,
            // 基礎四大屬性
            baseStats: {
                str: 10, // 力量 -> 攻擊
                vit: 10, // 體質 -> 生命、防禦
                agi: 10, // 身法 -> 速度、閃避
                int: 10  // 悟性 -> 經驗、技能加成
            },
            bag: [],
            equips: { weapon: null, body: null },
            skills: [null, null, null], // 三個技能槽位
            learnedSkills: [0], // 預設習得基礎心法
            mapId: 0
        };

        // 戰鬥即時數據 (由計算得出)
        this.battle = {
            hp: 100, maxHp: 100,
            atk: 10, def: 5,
            spd: 10, dodge: 0.05,
            power: 0,
            regen: 0,        // 每秒回血
            lifeSteal: 0,    // 吸血 %
            dmgFloor: 0.005, // 保底傷害 (天道鐵律 0.5%)
            isDead: false
        };

        this.load(); // 啟動時讀取存檔
        this.refresh(); // 計算最終屬性
    }

    // 計算最終戰鬥屬性 (包含裝備、技能加成)
    refresh() {
        let d = this.data;
        let b = this.battle;

        // 1. 基礎加成
        b.maxHp = d.baseStats.vit * 20 + d.lv * 10;
        b.atk = d.baseStats.str * 3 + d.lv * 2;
        b.def = d.baseStats.vit * 1.5; // 體質轉防禦
        b.spd = d.baseStats.agi * 1;
        b.dodge = Math.min(0.75, (d.baseStats.agi / (d.baseStats.agi + 100))); // 閃避曲線
        b.regen = 0;
        b.lifeSteal = 0;
        b.dmgFloor = 0.005; // 初始 0.5%

        // 2. 裝備加成
        Object.values(d.equips).forEach(eq => {
            if (!eq) return;
            if (eq.atk) b.atk += eq.atk;
            if (eq.def) b.def += eq.def;
            if (eq.hp) b.maxHp += eq.hp;
            // 特殊詞條
            if (eq.regen) b.regen += eq.regen;
            if (eq.lifeSteal) b.lifeSteal += eq.lifeSteal;
            if (eq.dmgFloorReduce) b.dmgFloor = Math.max(0.001, b.dmgFloor - eq.dmgFloorReduce);
        });

        // 3. 技能加成 (被動)
        d.skills.forEach(skillId => {
            if (skillId === null) return;
            const s = GAME_DATA.SKILLS[skillId];
            if (s && s.type === 'passive') {
                if (s.effect.hpMul) b.maxHp *= s.effect.hpMul;
                if (s.effect.defMul) b.def *= s.effect.defMul;
            }
        });

        // 計算戰力 (Power)
        b.power = Math.floor(b.atk * 5 + b.def * 3 + b.maxHp / 10);
        
        // 確保血量不超過上限
        if (b.hp > b.maxHp) b.hp = b.maxHp;
    }

    // 存檔與讀取
    save() {
        localStorage.setItem('ImmortalData_V1', JSON.stringify(this.data));
        console.log("[系統] 命牌存檔成功");
    }

    load() {
        const saved = localStorage.getItem('ImmortalData_V1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = Object.assign(this.data, parsed);
                console.log("[系統] 命牌讀取成功");
            } catch (e) {
                console.error("讀取失敗:", e);
            }
        }
    }

    // 增加經驗值
    addExp(val) {
        this.data.exp += val;
        let need = this.data.lv * 100;
        if (this.data.exp >= need) {
            this.data.exp -= need;
            this.data.lv++;
            this.data.pts += 5;
            this.refresh();
            return true; // 代表升級了
        }
        return false;
    }
}

console.log("[系統] 本命命牌 (player.js) 已就緒");
