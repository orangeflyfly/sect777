class Player {
    constructor() {
        this.data = {
            lv: 1, exp: 0, money: 100, pts: 0,
            baseStats: { str: 10, vit: 10, agi: 10, int: 10 },
            bag: [],
            equips: { weapon: null, body: null },
            skills: [null, null, null],
            learnedSkills: [0],
            mapId: 0
        };
        this.battle = { hp: 100, maxHp: 100, atk: 10, def: 5, spd: 10, dodge: 0.05, power: 0, regen: 0, lifeSteal: 0, dmgFloor: 0.005, isDead: false };
        this.load();
        this.refresh();
    }
    refresh() {
        let d = this.data; let b = this.battle;
        b.maxHp = d.baseStats.vit * 20 + d.lv * 10;
        b.atk = d.baseStats.str * 3 + d.lv * 2;
        b.def = d.baseStats.vit * 1.5;
        b.dodge = Math.min(0.75, (d.baseStats.agi / (d.baseStats.agi + 100)));
        b.regen = 0; b.lifeSteal = 0; b.dmgFloor = 0.005;
        Object.values(d.equips).forEach(eq => {
            if (!eq) return;
            if (eq.atk) b.atk += eq.atk; if (eq.def) b.def += eq.def; if (eq.hp) b.maxHp += eq.hp;
            if (eq.regen) b.regen += eq.regen; if (eq.lifeSteal) b.lifeSteal += eq.lifeSteal;
            if (eq.dmgFloorReduce) b.dmgFloor = Math.max(0.001, b.dmgFloor - eq.dmgFloorReduce);
        });
        d.skills.forEach(id => { if (id !== null && GAME_DATA.SKILLS[id].type === 'passive') { 
            let s = GAME_DATA.SKILLS[id]; if (s.effect.hpMul) b.maxHp *= s.effect.hpMul; if (s.effect.defMul) b.def *= s.effect.defMul;
        }});
        b.power = Math.floor(b.atk * 5 + b.def * 3 + b.maxHp / 10);
        if (b.hp > b.maxHp || b.hp <= 0) b.hp = b.maxHp;
    }
    save() { localStorage.setItem('ImmortalData_V1', JSON.stringify(this.data)); }
    load() {
        const saved = localStorage.getItem('ImmortalData_V1');
        if (saved) { try { this.data = Object.assign(this.data, JSON.parse(saved)); } catch (e) {} }
    }
    addExp(val) {
        this.data.exp += val; let need = this.data.lv * 100;
        if (this.data.exp >= need) { this.data.exp -= need; this.data.lv++; this.data.pts += 5; this.refresh(); return true; }
        return false;
    }
}
