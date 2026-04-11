/**
 * 仙俠宗門 V0.7.1 - 核心引擎 (細節修正版)
 */

class XianXiaGame {
    constructor() {
        // 使用 0.7.1 存檔 Key，確保數據純淨
        const saved = JSON.parse(localStorage.getItem('XX_V071'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null, money: 0, maxBag: 20, bagBuyCount: 0 },
            bag: [], 
            eq: { weapon: null, body: null },
            curMap: "area1",
            mapProgress: { area1: 0, area2: 0, area3: 0 },
            unlockedMaps: ["area1"]
        };

        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now(), isBoss: false };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, money: 10 };
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        this.jobNames = { sword: "劍修", body: "體修", soul: "靈修" };
        
        window.onload = () => this.init();
    }

    // --- 萬能 UI 助手 ---
    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (el) { if (isStyle) el.style.width = val; else el.innerText = val; }
    }

    init() {
        this.calc();
        this.curHp = this.finalHp;
        this.spawn();
        this.renderStats();
        this.update();
        setInterval(() => this.loop(), 100);
        this.log("📜 V0.7.1 細節修正版已加載。", "var(--success)");
    }

    // --- 核心計算 (含流派加成) ---
    calc() {
        const { p, eq } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        
        if (p.job === 'sword') { m.str = 2.0; m.agi = 2.0; }
        if (p.job === 'body') { m.vit = 2.0; m.str = 1.5; }
        if (p.job === 'soul') { m.int = 2.0; m.agi = 1.5; }

        let extra = { atk: 1, hp: 1 };
        [eq.weapon, eq.body].forEach(item => {
            if (item && item.affixType) {
                const bonus = 1 + (item.q * 0.1);
                if (item.affixType === 'str') extra.atk += 0.2 * bonus;
                if (item.affixType === 'vit') extra.hp += 0.2 * bonus;
                if (item.affixType === 'agi') m.agi += 0.2 * bonus;
                if (item.affixType === 'int') m.int += 0.2 * bonus;
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

    // --- 戰鬥循環 ---
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

    // --- 介面更新：修正轉職鈕與卸下鈕顯示 ---
    update() {
        const { p, eq } = this.state;
        const curMap = MAP_DATA[this.state.curMap];
        
        // 頂部
        this.u('val-realm', this.realms[Math.min(Math.floor((p.lv-1)/10), 9)]);
        this.u('val-money', p.money);
        this.u('val-lv', p.lv);
        this.u('val-class', p.job ? `· ${this.jobNames[p.job]}` : "");
        this.u('val-map-name', `📍 ${curMap.name}`);
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`);
        this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true);
        this.u('val-xp', Math.floor(p.xp));
        this.u('val-next-xp', p.nx);

        // 屬性頁
        this.u('val-pts', p.pts);
        this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');

        // 🛠️ 修正 2：卸下按鈕的顯示邏輯
        const uw = document.getElementById('btn-unequip-weapon'); if (uw) uw.style.display = eq.weapon ? 'block' : 'none';
        const ub = document.getElementById('btn-unequip-body'); if (ub) ub.style.display = eq.body ? 'block' : 'none';

        // 🛠️ 修正 5：轉職按鈕顯示邏輯
        const bc = document.getElementById('btn-class');
        if (bc) bc.style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';

        // 背包與戰鬥
        this.u('bag-count', this.state.bag.length);
        this.u('val-bag-max', p.maxBag);
        this.u('val-bag-price', 1000 * Math.pow(2, p.bagBuyCount));
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
    }

    // --- 🛠️ 修正 3：讓屬性描述變清晰 ---
    getBonusName(type) {
        if (!type || !AFFIX_DATA[type]) return "基礎";
        return AFFIX_DATA[type].bonus; // 這裡會從 data.js 抓取「攻擊」、「氣血」等字樣
    }

    renderBag() {
        const l = document.getElementById('bag-list'); if (!l) return;
        l.innerHTML = this.state.bag.map(i => {
            const bonusName = this.getBonusName(i.affixType);
            return `
            <div class="item-card quality-${i.q}">
                <b>${i.name}</b>
                <div style="font-size:10px; color:var(--info); margin:4px 0;">${bonusName} +${i.val}</div>
                <button onclick="game.equip(${i.id})">穿戴</button>
            </div>`;
        }).join('');
    }

    // --- 其餘戰鬥邏輯 ---
    spawn() {
        const map = MAP_DATA[this.state.curMap];
        const pLv = this.state.p.lv;
        const kills = this.state.mapProgress[this.state.curMap];
        this.rt.isBoss = (kills > 0 && kills % 30 === 0);

        if (this.rt.isBoss) {
            const b = map.boss;
            this.m.n = `【首領】${b.n}`;
            this.m.mx = Math.floor(100 * Math.pow(1.3, pLv - 1) * b.hpMult);
            this.m.exp = Math.floor((20 + pLv * 5) * b.expMult);
            this.m.money = Math.floor((10 + pLv * 2) * b.goldMult);
        } else {
            this.m.n = map.monsters[Math.floor(Math.random() * map.monsters.length)];
            this.m.mx = Math.floor(50 * Math.pow(1.25, pLv - 1));
            this.m.exp = 20 + pLv * 5;
            this.m.money = 10 + pLv * 2;
        }
        this.m.hp = this.m.mx;
        this.u('m-name', this.m.n);
        this.update();
    }

    atk(isM, x, y, multi = 1) {
        let isC = Math.random() * 100 < this.crit;
        let dmg = Math.floor(this.finalAtk * (isM ? 1.2 : 1) * multi * (isC ? this.critDmg : 1));
        this.m.hp -= dmg;
        this.pop(dmg, isC, x, y);
        if (this.m.hp <= 0) this.onDie(); 
        else if (!isM || Math.random() < 0.3) this.monsterCounterAtk();
        this.update();
    }

    onDie() {
        this.state.p.money += this.m.money;
        this.gainXp(this.m.exp);
        this.state.mapProgress[this.state.curMap]++;
        if (this.rt.isBoss) { this.drop(true); this.unlockNextMap(); this.rt.isBoss = false; } 
        else if (Math.random() < 0.25) { this.drop(false); }
        this.spawn();
        this.save();
    }

    drop(isBoss) {
        const r = Math.random();
        let q = isBoss ? (r < 0.3 ? 4 : 3) : (r < 0.01 ? 4 : r < 0.05 ? 3 : r < 0.15 ? 2 : r < 0.4 ? 1 : 0);
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const tNames = ITEM_BASE[type];
        const map = MAP_DATA[this.state.curMap];
        const types = Object.keys(AFFIX_DATA);
        let aT = types[Math.floor(Math.random() * types.length)];
        if (map.bias && Math.random() < 0.4) aT = map.bias;
        const lib = AFFIX_DATA[aT];
        const aN = lib.list[Math.floor(Math.random() * lib.list.length)];
        const item = { 
            id: Date.now(), type, q, 
            val: Math.floor((5 + this.state.p.lv * 2.5) * (q + 1)), 
            lvReq: this.state.p.lv, affixType: aT, 
            name: `[${lib.label}] ${aN}${["凡", "良", "精", "極", "仙"][q]}·${tNames[Math.floor(Math.random()*tNames.length)]}` 
        };
        if (this.state.bag.length < this.state.p.maxBag) { this.state.bag.push(item); }
    }

    // --- 🛠️ 修正 4：熔煉邏輯優化 ---
    quickMelt() {
        const fl = parseInt(document.getElementById('melt-filter').value);
        this.state.bag = this.state.bag.filter(i => {
            if (i.q <= fl) {
                this.state.p.xp += Math.floor(i.val * 0.5); // 熔煉給修為
                return false;
            }
            return true;
        });
        this.update(); this.renderBag(); this.save();
    }

    // --- 功能函式 ---
    gainXp(a) { this.state.p.xp += a; while (this.state.p.xp >= this.state.p.nx) { this.state.p.lv++; this.state.p.xp -= this.state.p.nx; this.state.p.nx = Math.floor(this.state.p.nx * 1.5); this.state.p.pts += 5; this.calc(); } }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    toggleAuto() { this.rt.auto = !this.rt.auto; const b = document.getElementById('btn-auto'); b.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; b.style.background = this.rt.auto ? "var(--success)" : "#444c56"; }
    switchTab(t, el) { document.querySelectorAll('.stage').forEach(s => s.style.display = 'none'); document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); document.getElementById('p-' + t).style.display = 'flex'; el.classList.add('active'); if (t === 'bag') this.renderBag(); if (t === 'stats') this.renderStats(); }
    renderStats() { const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' }; const el = document.getElementById('stat-list'); if (el) el.innerHTML = Object.entries(map).map(([k, n]) => `<div class="stat-row"><span>${n}: <b>${this.state.p[k]}</b></span><button class="btn-plus" onclick="game.addStat('${k}')">+</button></div>`).join(''); }
    
    equip(id) { 
        const idx = this.state.bag.findIndex(i => i.id === id); 
        const i = this.state.bag[idx]; 
        const old = this.state.eq[i.type]; 
        if (old) this.state.bag.push(old); 
        this.state.eq[i.type] = i; 
        this.state.bag.splice(idx, 1); 
        this.calc(); this.update(); this.renderBag(); this.save(); 
    }
    
    // 🛠️ 補回卸下邏輯
    unequip(type) {
        const item = this.state.eq[type];
        if (item) {
            if (this.state.bag.length >= this.state.p.maxBag) return alert("儲物袋滿了！");
            this.state.bag.push(item);
            this.state.eq[type] = null;
            this.calc(); this.update(); this.renderBag(); this.save();
        }
    }

    showMapModal() {
        const list = document.getElementById('map-list');
        list.innerHTML = Object.values(MAP_DATA).map(m => {
            const isU = this.state.unlockedMaps.includes(m.id);
            const isC = this.state.curMap === m.id;
            return `<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; border:1px solid ${isC?'var(--gold)':'#333'}; opacity:${isU?1:0.5}">
                <div style="display:flex; justify-content:space-between;"><b>${m.name}</b><span style="font-size:10px;">Lv.${m.reqLv}</span></div>
                ${isU ? `<button onclick="game.changeMap('${m.id}')" ${isC?'disabled':''}>${isC?'歷練中':'前往'}</button>` : `<span style="color:var(--danger); font-size:10px;">🔒 擊敗前地圖首領解鎖</span>`}
            </div>`;
        }).join('');
        document.getElementById('map-modal').style.display = 'flex';
    }

    changeMap(id) { if (this.state.p.lv >= MAP_DATA[id].reqLv) { this.state.curMap = id; document.getElementById('map-modal').style.display='none'; this.spawn(); this.save(); } }
    unlockNextMap() { const ids = Object.keys(MAP_DATA); const idx = ids.indexOf(this.state.curMap); if (idx < ids.length - 1) { const next = ids[idx+1]; if (!this.state.unlockedMaps.includes(next)) this.state.unlockedMaps.push(next); } }
    showClassModal() { document.getElementById('class-modal').style.display = 'flex'; }
    chooseClass(j) { this.state.p.job = j; document.getElementById('class-modal').style.display = 'none'; this.calc(); this.update(); this.save(); this.log(`🎊 成功轉職為 ${this.jobNames[j]}！`, "var(--purple)"); }
    respec() { if (confirm("洗點？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.curHp=this.finalHp; this.renderStats(); this.update(); this.save(); } }
    monsterCounterAtk() { if (Math.random() * 100 < this.evasion) { this.pop("閃避", false, 120, 180); return; } this.curHp -= Math.floor(this.m.mx * 0.05); if (this.curHp <= 0) { this.curHp = Math.floor(this.finalHp * 0.2); this.rt.auto = false; } this.update(); }
    pop(d, c, x, y) { const e = document.createElement('div'); e.className = 'dmg'; e.innerText = (c ? '💥 ' : '') + d; e.style.color = c ? 'var(--gold)' : '#fff'; e.style.left = (x || 200) + 'px'; e.style.top = (y || 300) + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 600); }
    log(m, c) { const b = document.getElementById('log'); if (!b) return; const d = document.createElement('div'); d.style.color = c || "#fff"; d.innerHTML = `<span style="color:#888;font-size:10px;">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`; b.prepend(d); if (b.children.length > 20) b.lastChild.remove(); }
    save() { localStorage.setItem('XX_V071', JSON.stringify(this.state)); }
}
const game = new XianXiaGame();
