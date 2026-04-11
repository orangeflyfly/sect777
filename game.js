const AFFIX_LIBRARY = {
    str: { label: "破軍系", list: ["猛烈的", "狂暴的", "摧城的", "霸道的", "碎星的", "巨力的", "萬鈞的", "震天的", "開山的", "荒古的"] },
    vit: { label: "不動系", list: ["結實的", "厚重的", "如山的", "不朽的", "磐石的", "玄武的", "固本的", "龍鱗的", "混元的", "不滅的"] },
    agi: { label: "神行系", list: ["迅捷的", "殘影的", "流風的", "絕影的", "逐日的", "騰雲的", "幻影的", "驚雷的", "瞬身的", "極意的"] },
    int: { label: "天啟系", list: ["聰慧的", "通靈的", "玄門的", "太極的", "星辰的", "混沌的", "乾坤的", "悟道的", "靈妙的", "歸一的"] },
    luk: { label: "貪狼系", list: ["幸運的", "招財的", "尋寶的", "富貴的", "玲瓏的", "掠奪的", "聚財的", "納福的", "錦鯉的", "天選的"] },
    spc: { label: "禁忌系", list: ["嗜血的", "穿心的", "致命的", "虛幻的", "狂熱的", "寂滅的", "破甲的", "幽冥的", "聖潔的", "災厄的"] }
};

class XianXiaGame {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('XX_V068'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null, money: 0, maxBag: 20, bagBuyCount: 0 },
            bag: [], eq: { weapon: null, body: null }
        };
        this.curHp = 0;
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        this.jobNames = { sword: "劍修", body: "體修", soul: "靈修" };
        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now() };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, elite: false, money: 0 };
        window.onload = () => this.init();
    }

    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (!el) return;
        if (isStyle) el.style.width = val;
        else el.innerText = val;
    }

    init() {
        this.calc(); this.curHp = this.finalHp; this.spawn(); this.renderStats(); this.update();
        setInterval(() => this.loop(), 100);
    }

    calc() {
        const { p, eq } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        if (p.job === 'sword') m.agi = 2.0;
        if (p.job === 'body') m.vit = 2.0;
        if (p.job === 'soul') m.int = 2.0;

        let extra = { atkPct: 1, hpPct: 1 };
        [eq.weapon, eq.body].forEach(item => {
            if (item && item.affixType) {
                const bonus = 1 + (item.q * 0.05);
                if (item.affixType === 'str') extra.atkPct += 0.15 * bonus;
                if (item.affixType === 'vit') extra.hpPct += 0.15 * bonus;
                if (item.affixType === 'agi') m.agi += 0.2 * bonus;
                if (item.affixType === 'int') m.int += 0.2 * bonus;
            }
        });

        this.finalAtk = Math.floor(((p.str * m.str) * 3 + (p.lv * 2) + (eq.weapon?eq.weapon.val:0)) * extra.atkPct);
        this.finalHp = Math.floor(((p.vit * m.vit) * 20 + (p.lv * 10) + (eq.body?eq.body.val:0)) * extra.hpPct);
        this.hpRegen = (p.vit * m.vit) * 0.5 + (p.lv * 0.2);
        this.spd = 0.5 + ((p.agi * m.agi) * 0.04);
        this.evasion = Math.min(50, (p.agi * m.agi) * 0.4);
        this.crit = Math.min(50, (p.int * m.int) * 0.6);
        this.critDmg = 1.5 + ((p.int * m.int) * 0.01);
    }

    loop() {
        const now = Date.now();
        if (now - this.rt.lastRegen >= 1000) {
            if (this.curHp < this.finalHp) { this.curHp = Math.min(this.finalHp, this.curHp + this.hpRegen); this.update(); }
            this.rt.lastRegen = now;
        }
        if (this.rt.auto && now - this.rt.lastAuto >= (1000 / this.spd)) { this.atk(false); this.rt.lastAuto = now; }
        if (this.rt.skillCD > 0) {
            this.rt.skillCD -= 100;
            this.u('skill-cd', (this.rt.skillCD / this.rt.skillMaxCD * 100) + "%", true);
        }
    }

    generateAffix(quality) {
        if (quality < 1 && Math.random() > 0.2) return null;
        const types = Object.keys(AFFIX_LIBRARY);
        const type = types[Math.floor(Math.random() * types.length)];
        const lib = AFFIX_LIBRARY[type];
        return { name: lib.list[Math.floor(Math.random() * lib.list.length)], type, label: lib.label };
    }

    drop() {
        const r = Math.random();
        let q = r < 0.008 ? 4 : r < 0.04 ? 3 : r < 0.15 ? 2 : r < 0.45 ? 1 : 0;
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const tNames = type === 'weapon' ? ["長劍", "重錘", "靈珠", "唐刀"] : ["布袍", "輕甲", "重鎧", "法衣"];
        let baseVal = (5 + this.state.p.lv * 2.2) * [1, 1.5, 2.8, 4.5, 9][q];
        const affix = this.generateAffix(q);
        const fullName = (affix ? `[${affix.label}] ${affix.name}` : "") + qNames[q] + "·" + tNames[Math.floor(Math.random()*4)];
        const item = { id: Date.now(), type, q, val: Math.floor(baseVal), lvReq: Math.max(1, this.state.p.lv + Math.floor(Math.random()*3)-1), affixType: affix?affix.type:null, name: fullName };
        if (this.state.bag.length < this.state.p.maxBag) { this.state.bag.push(item); this.log(`獲得：${item.name}`, this.getQColor(q)); }
        else this.log("儲物袋滿了！", "var(--danger)");
    }

    buyBag() {
        const price = 1000 * Math.pow(2, this.state.p.bagBuyCount);
        if (this.state.p.money >= price) { this.state.p.money -= price; this.state.p.maxBag += 5; this.state.p.bagBuyCount++; this.update(); this.save(); }
        else alert("靈石不足！需要 " + price);
    }

    update() {
        const { p, eq } = this.state;
        this.u('val-realm', this.realms[Math.min(Math.floor((p.lv-1)/10), 9)]);
        this.u('val-money', p.money); this.u('val-lv', p.lv); this.u('val-class', p.job ? `· ${this.jobNames[p.job]}` : "");
        this.u('val-bag-max', p.maxBag); this.u('val-bag-price', 1000 * Math.pow(2, p.bagBuyCount));
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`);
        this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true);
        this.u('val-xp', Math.floor(p.xp)); this.u('val-next-xp', p.nx);
        this.u('val-atk', this.finalAtk); this.u('val-pts', p.pts);
        this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('bag-count', this.state.bag.length);
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
        
        const bc = document.getElementById('btn-class'); if (bc) bc.style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';
        const uw = document.getElementById('btn-unequip-weapon'); if (uw) uw.style.display = eq.weapon ? 'block' : 'none';
        const ub = document.getElementById('btn-unequip-body'); if (ub) ub.style.display = eq.body ? 'block' : 'none';
    }

    atk(isManual, x, y, multi = 1) {
        let isCrit = Math.random() * 100 < this.crit;
        let dmg = Math.floor(this.finalAtk * (isManual ? 1.2 : 1.0) * multi * (isCrit ? this.critDmg : 1));
        this.m.hp -= dmg; this.pop(dmg, isCrit, x, y);
        if (this.m.hp <= 0) this.onDie(); 
        else if (!isManual || Math.random() < 0.3) this.monsterCounterAtk();
        this.update();
    }

    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) { this.pop("閃避", false, 120, 180); return; }
        this.curHp -= Math.floor(this.m.mx * 0.08);
        if (this.curHp <= 0) { this.log("💀 傷重倒地...", "var(--danger)"); this.curHp = Math.floor(this.finalHp * 0.2); this.rt.auto = false; }
        this.update();
    }

    onDie() {
        this.state.p.money += this.m.money; this.gainXp(this.m.exp);
        if (Math.random() < (this.m.elite ? 0.8 : 0.25)) this.drop();
        this.spawn();
    }

    spawn() {
        const pLv = this.state.p.lv; this.m.elite = Math.random() < 0.15;
        this.m.mx = Math.floor(50 * Math.pow(1.25, pLv - 1)) * (this.m.elite ? 3 : 1);
        this.m.hp = this.m.mx; this.m.exp = Math.floor((20 + pLv * 5) * (this.m.elite ? 2.5 : 1));
        this.m.money = Math.floor((10 + pLv * 3) * (this.m.elite ? 5 : 1));
    }

    renderBag() {
        const list = document.getElementById('bag-list'); if (!list) return;
        list.innerHTML = this.state.bag.map(i => `
            <div class="item-card quality-${i.q}">
                <b>${i.name}</b>
                <div style="color:var(--info); font-size:10px;">屬性 +${i.val}</div>
                <button onclick="game.equip(${i.id})">穿戴</button>
            </div>`).join('');
        this.u('bag-count', this.state.bag.length);
    }

    renderStats() {
        const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        const el = document.getElementById('stat-list'); if (!el) return;
        el.innerHTML = Object.entries(map).map(([k, n]) => `<div class="stat-row"><span>${n} (<b>${this.state.p[k]}</b>)</span><button onclick="game.addStat('${k}')">+</button></div>`).join('');
    }

    equip(id) {
        const idx = this.state.bag.findIndex(i => i.id === id); const item = this.state.bag[idx];
        if (this.state.p.lv < item.lvReq) { alert("修為不足！"); return; }
        const old = this.state.eq[item.type]; if (old) this.state.bag.push(old);
        this.state.eq[item.type] = item; this.state.bag.splice(idx, 1);
        this.calc(); this.update(); this.renderBag(); this.save();
    }

    unequip(type) {
        if (this.state.bag.length >= this.state.p.maxBag) { alert("儲物袋滿了！"); return; }
        const item = this.state.eq[type]; if (item) { this.state.bag.push(item); this.state.eq[type] = null; this.calc(); this.update(); this.renderBag(); this.save(); }
    }

    quickMelt() {
        const fl = parseInt(document.getElementById('melt-filter').value);
        this.state.bag = this.state.bag.filter(i => { if (i.q <= fl) { this.state.p.xp += Math.floor(i.val * 1.5); return false; } return true; });
        this.update(); this.renderBag(); this.save();
    }

    gainXp(amt) { this.state.p.xp += amt; while (this.state.p.xp >= this.state.p.nx) { this.state.p.lv++; this.state.p.xp -= this.state.p.nx; this.state.p.nx = Math.floor(this.state.p.nx * 1.5); this.state.p.pts += 5; this.calc(); } }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    toggleAuto() { this.rt.auto = !this.rt.auto; const btn = document.getElementById('btn-auto'); btn.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; btn.style.background = this.rt.auto ? "var(--success)" : "#30363d"; }
    switchTab(tab, el) { 
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('p-' + tab).style.display = 'flex'; el.classList.add('active');
        if (tab === 'bag') this.renderBag(); if (tab === 'stats') this.renderStats();
    }
    chooseClass(j) { this.state.p.job = j; document.getElementById('class-modal').style.display='none'; this.calc(); this.update(); this.save(); }
    showClassModal() { document.getElementById('class-modal').style.display='flex'; }
    respec() { if (confirm("洗點？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.curHp=this.finalHp; this.renderStats(); this.update(); this.save(); } }
    useSkill() { if (this.rt.skillCD <= 0) { this.atk(true, 240, 300, 3.5); this.rt.skillCD = this.rt.skillMaxCD; } }
    manualAtk(e) { this.atk(true, e.clientX, e.clientY); }
    pop(dmg, crit, x, y) {
        const d = document.createElement('div'); d.className = 'dmg'; d.innerText = (crit ? '💥 ' : '') + dmg;
        d.style.color = crit ? 'var(--gold)' : (dmg === "閃避" ? 'var(--info)' : '#fff');
        d.style.left = (x || 200) + 'px'; d.style.top = (y || 300) + 'px';
        document.body.appendChild(d); setTimeout(() => d.remove(), 600);
    }
    log(m, c) {
        const b = document.getElementById('log'); if (!b) return;
        const d = document.createElement('div'); d.style.color = c || 'inherit';
        d.innerHTML = `<span style="color:#555">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
        b.prepend(d); if (b.children.length > 20) b.lastChild.remove();
    }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_V068', JSON.stringify(this.state)); }
}
const game = new XianXiaGame();
