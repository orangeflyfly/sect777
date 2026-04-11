const AFFIX_LIBRARY = {
    str: { label: "破軍", list: ["猛烈的", "狂暴的", "摧城的", "霸道的", "碎星的"] },
    vit: { label: "不動", list: ["堅毅的", "厚重的", "如山的", "不朽的", "磐石的"] },
    agi: { label: "神行", list: ["迅捷的", "殘影的", "流風的", "絕影的", "逐日的"] },
    int: { label: "天啟", list: ["聰慧的", "通靈的", "玄門的", "太極的", "星辰的"] },
    spc: { label: "禁忌", list: ["嗜血的", "穿心的", "致命的", "虛幻的", "災厄的"] }
};

class XianXiaGame {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('XX_V069'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null, money: 0, maxBag: 20, bagBuyCount: 0 },
            bag: [], eq: { weapon: null, body: null }
        };
        this.curHp = 0;
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now() };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, elite: false, money: 0 };
        window.onload = () => this.init();
    }

    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (el) { if (isStyle) el.style.width = val; else el.innerText = val; }
    }

    init() {
        this.calc(); this.curHp = this.finalHp; this.spawn(); this.renderStats(); this.update();
        setInterval(() => this.loop(), 100);
        this.log("📜 歡迎回到修仙世界...", "#58a6ff");
    }

    calc() {
        const { p, eq } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        if (p.job === 'sword') m.agi = 2.0;
        if (p.job === 'body') m.vit = 2.0;
        if (p.job === 'soul') m.int = 2.0;
        let extra = { atk: 1, hp: 1 };
        [eq.weapon, eq.body].forEach(i => { if (i && i.affixType === 'str') extra.atk += 0.2; if (i && i.affixType === 'vit') extra.hp += 0.2; });
        this.finalAtk = Math.floor(((p.str * m.str) * 3 + (p.lv * 2) + (eq.weapon ? eq.weapon.val : 0)) * extra.atk);
        this.finalHp = Math.floor(((p.vit * m.vit) * 20 + (p.lv * 10) + (eq.body ? eq.body.val : 0)) * extra.hp);
        this.hpRegen = (p.vit * m.vit) * 0.5 + (p.lv * 0.2);
        this.spd = 0.5 + ((p.agi * m.agi) * 0.04);
        this.evasion = Math.min(50, (p.agi * m.agi) * 0.4);
        this.crit = Math.min(50, (p.int * m.int) * 0.6);
        this.critDmg = 1.5 + ((p.int * m.int) * 0.01);
    }

    loop() {
        const now = Date.now();
        if (now - this.rt.lastRegen >= 1000) { if (this.curHp < this.finalHp) { this.curHp = Math.min(this.finalHp, this.curHp + this.hpRegen); this.update(); } this.rt.lastRegen = now; }
        if (this.rt.auto && now - this.rt.lastAuto >= (1000 / this.spd)) { this.atk(false); this.rt.lastAuto = now; }
        if (this.rt.skillCD > 0) { this.rt.skillCD -= 100; this.u('skill-cd', (this.rt.skillCD / this.rt.skillMaxCD * 100) + "%", true); }
    }

    onDie() {
        // 🛠️ 修復點：重新把日誌寫入
        this.log(`🗡️ 擊殺 ${this.m.n}！獲得修為+${this.m.exp}，靈石+${this.m.money}`, "#3fb950");
        this.state.p.money += this.m.money;
        this.gainXp(this.m.exp);
        if (Math.random() < (this.m.elite ? 0.8 : 0.25)) this.drop();
        this.spawn();
    }

    drop() {
        const r = Math.random();
        let q = r < 0.008 ? 4 : r < 0.04 ? 3 : r < 0.15 ? 2 : r < 0.45 ? 1 : 0;
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const tNames = type === 'weapon' ? ["長劍", "唐刀"] : ["布袍", "輕甲"];
        const types = Object.keys(AFFIX_LIBRARY);
        const aT = types[Math.floor(Math.random() * types.length)];
        const affix = AFFIX_LIBRARY[aT];
        const aN = affix.list[Math.floor(Math.random() * affix.list.length)];
        const item = { id: Date.now(), type, q, val: Math.floor((5 + this.state.p.lv * 2) * (q + 1)), lvReq: this.state.p.lv, affixType: aT, name: `[${affix.label}] ${aN}${qNames[q]}·${tNames[Math.floor(Math.random()*2)]}` };
        if (this.state.bag.length < this.state.p.maxBag) { this.state.bag.push(item); this.log(`🎁 掉落：${item.name}`, this.getQColor(q)); }
        this.update();
    }

    log(m, c) {
        const b = document.getElementById('log'); if (!b) return;
        const d = document.createElement('div');
        d.style.color = c || "#ffffff"; // 預設白色，絕不變黑
        d.style.marginBottom = "2px";
        d.innerHTML = `<span style="color:#888;font-size:10px;">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}]</span> ${m}`;
        b.prepend(d); if (b.children.length > 20) b.lastChild.remove();
    }

    // --- 以下為通用功能保持不變 ---
    u(id, val, isStyle = false) { const el = document.getElementById(id); if (el) { if (isStyle) el.style.width = val; else el.innerText = val; } }
    spawn() { const pLv = this.state.p.lv; this.m.elite = Math.random() < 0.15; this.m.mx = Math.floor(50 * Math.pow(1.2, pLv - 1)) * (this.m.elite ? 3 : 1); this.m.hp = this.m.mx; this.m.exp = 20 + pLv * 5; this.m.money = 10 + pLv * 2; }
    update() {
        const { p, eq } = this.state;
        this.u('val-realm', this.realms[Math.min(Math.floor((p.lv-1)/10), 9)]); this.u('val-money', p.money); this.u('val-lv', p.lv);
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`); this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true); this.u('val-xp', p.xp); this.u('val-next-xp', p.nx);
        this.u('val-atk', this.finalAtk); this.u('val-pts', p.pts); this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無'); this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('bag-count', this.state.bag.length); this.u('val-bag-max', p.maxBag);
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`); this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
        const bc = document.getElementById('btn-class'); if (bc) bc.style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';
    }
    atk(isM, x, y, multi = 1) { let isC = Math.random() * 100 < this.crit; let dmg = Math.floor(this.finalAtk * (isM ? 1.2 : 1) * multi * (isC ? this.critDmg : 1)); this.m.hp -= dmg; this.pop(dmg, isC, x, y); if (this.m.hp <= 0) this.onDie(); else if (!isM || Math.random() < 0.3) this.monsterCounterAtk(); this.update(); }
    monsterCounterAtk() { if (Math.random() * 100 < this.evasion) { this.pop("閃避", false, 120, 180); return; } this.curHp -= Math.floor(this.m.mx * 0.05); if (this.curHp <= 0) { this.log("💀 傷重倒地...", "var(--danger)"); this.curHp = Math.floor(this.finalHp * 0.2); this.rt.auto = false; } this.update(); }
    gainXp(a) { this.state.p.xp += a; while (this.state.p.xp >= this.state.p.nx) { this.state.p.lv++; this.state.p.xp -= this.state.p.nx; this.state.p.nx = Math.floor(this.state.p.nx * 1.5); this.state.p.pts += 5; this.calc(); } }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    toggleAuto() { this.rt.auto = !this.rt.auto; const b = document.getElementById('btn-auto'); b.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; b.style.background = this.rt.auto ? "var(--success)" : "#444c56"; }
    switchTab(t, el) { document.querySelectorAll('.stage').forEach(s => s.style.display = 'none'); document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); document.getElementById('p-' + t).style.display = 'flex'; el.classList.add('active'); if (t === 'bag') this.renderBag(); if (t === 'stats') this.renderStats(); }
    renderBag() { const l = document.getElementById('bag-list'); if (l) l.innerHTML = this.state.bag.map(i => `<div class="item-card"><b>${i.name}</b><div style="font-size:10px;color:var(--info);">屬性 +${i.val}</div><button onclick="game.equip(${i.id})">穿戴</button></div>`).join(''); }
    renderStats() { const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' }; const el = document.getElementById('stat-list'); if (el) el.innerHTML = Object.entries(map).map(([k, n]) => `<div class="stat-row"><span>${n}: <b>${this.state.p[k]}</b></span><button class="btn-plus" onclick="game.addStat('${k}')">+</button></div>`).join(''); }
    equip(id) { const idx = this.state.bag.findIndex(i => i.id === id); const i = this.state.bag[idx]; if (this.state.p.lv < i.lvReq) return alert("等級不足"); const old = this.state.eq[i.type]; if (old) this.state.bag.push(old); this.state.eq[i.type] = i; this.state.bag.splice(idx, 1); this.calc(); this.update(); this.renderBag(); this.save(); }
    quickMelt() { const fl = parseInt(document.getElementById('melt-filter').value); this.state.bag = this.state.bag.filter(i => { if (i.q <= fl) { this.state.p.xp += i.val; return false; } return true; }); this.update(); this.renderBag(); this.save(); }
    buyBag() { const p = 1000 * Math.pow(2, this.state.p.bagBuyCount); if (this.state.p.money >= p) { this.state.p.money -= p; this.state.p.maxBag += 5; this.state.p.bagBuyCount++; this.update(); this.save(); } }
    respec() { if (confirm("重置點數？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.curHp=this.finalHp; this.renderStats(); this.update(); this.save(); } }
    manualAtk(e) { this.atk(true, e.clientX, e.clientY); }
    useSkill() { if (this.rt.skillCD <= 0) { this.atk(true, 240, 300, 3.5); this.rt.skillCD = this.rt.skillMaxCD; } }
    pop(d, c, x, y) { const e = document.createElement('div'); e.className = 'dmg'; e.innerText = (c ? '💥 ' : '') + d; e.style.color = c ? 'var(--gold)' : '#fff'; e.style.left = (x || 200) + 'px'; e.style.top = (y || 300) + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 600); }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_V069', JSON.stringify(this.state)); }
}
const game = new XianXiaGame();
