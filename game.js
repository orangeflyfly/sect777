/**
 * 仙俠宗門 V0.8.0 - 核心引擎
 * 實裝：怪物受擊震動、暴擊彈跳、魚目混珠命名、單件熔煉
 */

console.log("🚀 [系統] V0.8.0 核心引擎啟動中...");

class XianXiaGame {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('XX_SAVE_V071'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null, money: 0, maxBag: 20, bagBuyCount: 0 },
            bag: [], eq: { weapon: null, body: null },
            curMap: "area1", mapProgress: { area1: 0, area2: 0, area3: 0 }, unlockedMaps: ["area1"]
        };
        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now(), isBoss: false };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, money: 10 };
        this.jobNames = { sword: "劍修", body: "體修", soul: "靈修" };
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        
        window.addEventListener('load', () => this.init());
    }

    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (el) { if (isStyle) el.style.width = val; else el.innerText = val; }
    }

    init() {
        this.calc(); this.curHp = this.finalHp;
        this.spawn(); this.update();
        setInterval(() => this.loop(), 100);
        this.log("⚔️ 恭喜道友，V0.8.0 修為大成！", "var(--gold)");
    }

    calc() {
        const { p, eq } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        if (p.job === 'sword') { m.str = 2.0; m.agi = 2.0; }
        if (p.job === 'body') { m.vit = 2.5; m.str = 1.2; }
        if (p.job === 'soul') { m.int = 2.0; m.agi = 1.5; }

        let extra = { atk: 1, hp: 1 };
        [eq.weapon, eq.body].forEach(item => {
            if (item && item.affixType) {
                const b = 1 + (item.q * 0.1);
                if (item.affixType === 'str') extra.atk += 0.2 * b;
                if (item.affixType === 'vit') extra.hp += 0.2 * b;
                if (item.affixType === 'agi') m.agi += 0.2 * b;
                if (item.affixType === 'int') m.int += 0.2 * b;
            }
        });
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

    spawn() {
        const map = MAP_DATA[this.state.curMap];
        const pLv = this.state.p.lv;
        const kills = this.state.mapProgress[this.state.curMap] || 0;
        this.rt.isBoss = (kills > 0 && kills % 30 === 0);
        if (this.rt.isBoss) {
            const b = map.boss;
            this.m = { n: `【首領】${b.n}`, mx: Math.floor(100 * Math.pow(1.3, pLv - 1) * b.hpMult), exp: Math.floor((20 + pLv * 5) * b.expMult), money: Math.floor((10 + pLv * 2) * b.goldMult) };
        } else {
            this.m = { n: map.monsters[Math.floor(Math.random() * map.monsters.length)], mx: Math.floor(50 * Math.pow(1.25, pLv - 1)), exp: 20 + pLv * 5, money: 10 + pLv * 2 };
        }
        this.m.hp = this.m.mx;
        this.u('m-name', this.m.n);
        this.update();
    }

    atk(isM, x, y, multi = 1) {
        // --- 視覺特效：怪物抖動 ---
        const mCard = document.querySelector('.monster-card');
        if (mCard) {
            mCard.classList.remove('shake');
            void mCard.offsetWidth; // 強制重繪以重啟動畫
            mCard.classList.add('shake');
        }

        let isC = Math.random() * 100 < this.crit;
        let dmg = Math.floor(this.finalAtk * (isM ? 1.2 : 1) * multi * (isC ? this.critDmg : 1));
        this.m.hp -= dmg;
        this.pop(dmg, isC, x, y);

        if (this.m.hp <= 0) {
            this.log(`⚔️ 擊敗 ${this.m.n}，獲靈石 +${this.m.money}`);
            this.state.p.money += this.m.money;
            this.gainXp(this.m.exp);
            this.state.mapProgress[this.state.curMap]++;
            if (this.rt.isBoss) { this.drop(true); this.unlockNext(); this.rt.isBoss = false; }
            else if (Math.random() < 0.25) { this.drop(false); }
            this.spawn();
        } else if (!isM || Math.random() < 0.3) {
            this.monsterCounterAtk();
        }
        this.update();
    }

    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) { this.pop("閃避", false, 120, 180); return; }
        this.curHp -= Math.floor(this.m.mx * 0.05);
        if (this.curHp <= 0) {
            this.curHp = Math.floor(this.finalHp * 0.2); this.rt.auto = false;
            this.log("💀 體力耗盡，暫停歷練。", "var(--danger)");
            const btn = document.getElementById('btn-auto');
            if (btn) btn.innerText = "自動歷練: OFF";
        }
    }

    // --- 🛠️ 優化：魚目混珠命名邏輯 ---
    drop(isB) {
        const r = Math.random();
        let q = isB ? (r < 0.3 ? 4 : 3) : (r < 0.01 ? 4 : r < 0.05 ? 3 : r < 0.15 ? 2 : r < 0.4 ? 1 : 0);
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const map = MAP_DATA[this.state.curMap];
        const aT = map.bias && Math.random() < 0.4 ? map.bias : Object.keys(AFFIX_DATA)[Math.floor(Math.random() * 4)];
        
        const qPrefixes = [
            ["凡塵的", "生鏽的", "斑駁的", "粗製的"], 
            ["精鋼的", "鋒銳的", "斷裂的·", "殘缺的·"], // 混入帥名魚目混珠
            ["赤霄", "沉淵", "聚靈", "寒光"], 
            ["九幽", "鎮岳", "斷罪", "戮仙"], 
            ["太初·", "荒古·", "無極·", "萬劫·"]
        ];

        const lib = AFFIX_DATA[aT];
        const prefix = qPrefixes[q][Math.floor(Math.random() * qPrefixes[q].length)];
        const coreName = lib.list[Math.floor(Math.random() * lib.list.length)];
        const baseName = ITEM_BASE[type][Math.floor(Math.random() * ITEM_BASE[type].length)];

        const item = { 
            id: Date.now(), type, q, 
            val: Math.floor((5 + this.state.p.lv * 3) * (q + 1)), 
            affixType: aT, 
            name: `${prefix}${coreName}${baseName}` 
        };

        if (this.state.bag.length < this.state.p.maxBag) {
            this.state.bag.push(item);
            this.log(`🎁 掉落：${item.name}`, this.getQColor(q));
        }
    }

    // --- 🛠️ 優化：單件熔煉 ---
    meltItem(id) {
        const idx = this.state.bag.findIndex(i => i.id === Number(id));
        if (idx !== -1) {
            const item = this.state.bag[idx];
            this.state.p.xp += item.val * 2; // 單件給雙倍修為
            this.log(`🔥 熔煉 ${item.name}，獲得修為 ${item.val * 2}`);
            this.state.bag.splice(idx, 1);
            this.gainXp(0); this.renderBag(); this.update(); this.save();
        }
    }

    quickMelt() {
        const fl = parseInt(document.getElementById('melt-filter').value);
        let count = 0;
        this.state.bag = this.state.bag.filter(i => {
            if (i.q <= fl) { this.state.p.xp += i.val; count++; return false; }
            return true;
        });
        this.log(`🔥 批量熔煉了 ${count} 件裝備`);
        this.gainXp(0); this.update(); this.renderBag(); this.save();
    }

    renderBag() {
        const el = document.getElementById('bag-list');
        if (el) el.innerHTML = this.state.bag.map(i => `
            <div class="item-card quality-${i.q}">
                <button class="btn-single-melt" onclick="_X_CORE.meltItem(${i.id})">熔</button>
                <b style="color:${this.getQColor(i.q)}">${i.name}</b>
                <div style="font-size:10px;color:var(--info);margin-top:5px;">${AFFIX_DATA[i.affixType].bonus} +${i.val}</div>
                <button onclick="_X_CORE.equip(${i.id})" style="width:100%;margin-top:5px;">穿戴</button>
            </div>`).join('');
    }

    update() {
        const { p, eq } = this.state;
        const curMap = MAP_DATA[this.state.curMap];
        this.u('val-realm', this.realms[Math.min(Math.floor((p.lv-1)/10), 9)]);
        this.u('val-money', p.money); this.u('val-lv', p.lv);
        this.u('val-map-name', `📍 ${curMap.name}`);
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`);
        this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true);
        this.u('val-xp', Math.floor(p.xp)); this.u('val-next-xp', p.nx);
        this.u('val-pts', p.pts); this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('bag-count', this.state.bag.length); this.u('val-bag-max', p.maxBag);
        this.u('val-bag-price', 1000 * Math.pow(2, p.bagBuyCount));
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
        document.getElementById('btn-unequip-weapon').style.display = eq.weapon ? 'block' : 'none';
        document.getElementById('btn-unequip-body').style.display = eq.body ? 'block' : 'none';
        document.getElementById('btn-class').style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';
    }

    gainXp(a) { 
        this.state.p.xp += a; 
        while (this.state.p.xp >= this.state.p.nx) { 
            this.state.p.lv++; this.state.p.xp -= this.state.p.nx; 
            this.state.p.nx = Math.floor(this.state.p.nx * 1.5); this.state.p.pts += 5; 
            this.calc(); this.log(`🎊 突破！目前修為 LV.${this.state.p.lv}`, "var(--gold)");
        } 
    }
    manualAtk(e) { this.atk(true, e.clientX, e.clientY); }
    useSkill() { if (this.rt.skillCD <= 0) { this.atk(true, 240, 300, 3.5); this.rt.skillCD = this.rt.skillMaxCD; } }
    toggleAuto() { this.rt.auto = !this.rt.auto; document.getElementById('btn-auto').innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    switchTab(t, el) { 
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none'); 
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); 
        document.getElementById('p-' + t).style.display = 'flex'; el.classList.add('active'); 
        if (t === 'bag') this.renderBag(); if (t === 'stats') this.renderStats(); 
    }
    renderStats() {
        const m = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        document.getElementById('stat-list').innerHTML = Object.entries(m).map(([k, n]) => `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>${n}: <b>${this.state.p[k]}</b></span><button onclick="_X_CORE.addStat('${k}')">+</button></div>`).join('');
    }
    equip(id) {
        const idx = this.state.bag.findIndex(i => i.id === Number(id));
        if (idx !== -1) {
            const item = this.state.bag[idx];
            if (this.state.eq[item.type]) this.state.bag.push(this.state.eq[item.type]);
            this.state.eq[item.type] = item; this.state.bag.splice(idx, 1);
            this.calc(); this.update(); this.renderBag(); this.save();
        }
    }
    unequip(type) {
        if (this.state.eq[type] && this.state.bag.length < this.state.p.maxBag) {
            this.state.bag.push(this.state.eq[type]); this.state.eq[type] = null;
            this.calc(); this.update(); this.renderBag(); this.save();
        }
    }
    showMapModal() {
        document.getElementById('map-list').innerHTML = Object.values(MAP_DATA).map(m => {
            const u = this.state.unlockedMaps.includes(m.id);
            return `<div style="margin-bottom:10px; opacity:${u?1:0.5}"><b>${m.name}</b> ${u?`<button onclick="_X_CORE.changeMap('${m.id}')">前往</button>`:`🔒`}</div>`;
        }).join('');
        document.getElementById('map-modal').style.display = 'flex';
    }
    changeMap(id) { this.state.curMap = id; document.getElementById('map-modal').style.display = 'none'; this.spawn(); this.save(); }
    unlockNext() {
        const ids = Object.keys(MAP_DATA); const idx = ids.indexOf(this.state.curMap);
        if (idx < ids.length - 1 && !this.state.unlockedMaps.includes(ids[idx+1])) this.state.unlockedMaps.push(ids[idx+1]);
    }
    showClassModal() { document.getElementById('class-modal').style.display = 'flex'; }
    chooseClass(j) { this.state.p.job = j; document.getElementById('class-modal').style.display = 'none'; this.calc(); this.update(); this.save(); }
    buyBag() {
        const price = 1000 * Math.pow(2, this.state.p.bagBuyCount);
        if (this.state.p.money >= price) { this.state.p.money -= price; this.state.p.maxBag += 5; this.state.p.bagBuyCount++; this.update(); this.save(); }
    }
    respec() { if (confirm("重置點數？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.update(); this.renderStats(); this.save(); } }
    pop(d, c, x, y) {
        const e = document.createElement('div'); 
        e.className = c ? 'dmg dmg-crit' : 'dmg';
        e.innerText = (c ? '💥 ' : '') + d;
        e.style.left = (x || 200) + 'px'; e.style.top = (y || 300) + 'px';
        document.body.appendChild(e); setTimeout(() => e.remove(), 600);
    }
    log(m, c) {
        const b = document.getElementById('log');
        if (b) {
            const d = document.createElement('div'); d.style.color = c || "#fff";
            d.innerHTML = `<span style="color:#888;font-size:10px;">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
            b.prepend(d); if (b.children.length > 25) b.lastChild.remove();
        }
    }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_SAVE_V071', JSON.stringify(this.state)); }
}

window._X_CORE = new XianXiaGame();
