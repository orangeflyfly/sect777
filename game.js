/**
 * 仙俠宗門 V0.7.2 - 戰鬥回饋強化版
 * 修正：裝備穿戴 ID 匹配、日誌內容精簡、擊殺提示
 */

console.log("🚀 [系統] 載入 V0.7.2 核心引擎...");

class XianXiaGame {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('XX_SAVE_V071'));
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
        
        window.addEventListener('load', () => this.init());
    }

    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (el) { if (isStyle) el.style.width = val; else el.innerText = val; }
    }

    init() {
        if (typeof MAP_DATA === 'undefined') return console.error("❌ 找不到 data.js");
        this.calc();
        this.curHp = this.finalHp;
        this.spawn();
        this.update();
        setInterval(() => this.loop(), 100);
        this.log("🏮 歷練開始，祝道友早日飛昇。", "var(--gold)");
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
        let isC = Math.random() * 100 < this.crit;
        let dmg = Math.floor(this.finalAtk * (isM ? 1.2 : 1) * multi * (isC ? this.critDmg : 1));
        this.m.hp -= dmg;
        this.pop(dmg, isC, x, y);

        if (this.m.hp <= 0) {
            // 🛠️ 優化：擊殺日誌
            this.log(`⚔️ 擊敗 ${this.m.n}，獲靈石 +${this.m.money}，修為 +${this.m.exp}`);
            
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
            this.curHp = Math.floor(this.finalHp * 0.2);
            this.rt.auto = false;
            this.log("💀 體力不支，暫停歷練。", "var(--danger)");
            const btnAuto = document.getElementById('btn-auto');
            if (btnAuto) btnAuto.innerText = "自動歷練: OFF";
        }
    }

    drop(isB) {
        const r = Math.random();
        let q = isB ? (r < 0.3 ? 4 : 3) : (r < 0.01 ? 4 : r < 0.05 ? 3 : r < 0.15 ? 2 : r < 0.4 ? 1 : 0);
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const map = MAP_DATA[this.state.curMap];
        const types = Object.keys(AFFIX_DATA);
        let aT = types[Math.floor(Math.random() * types.length)];
        if (map.bias && Math.random() < 0.4) aT = map.bias;
        const lib = AFFIX_DATA[aT];
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const item = { 
            id: Date.now(), type, q, 
            val: Math.floor((5 + this.state.p.lv * 3) * (q + 1)), 
            affixType: aT, 
            name: `[${lib.label}] ${lib.list[Math.floor(Math.random()*10)]}${qNames[q]}·${ITEM_BASE[type][Math.floor(Math.random()*6)]}` 
        };
        if (this.state.bag.length < this.state.p.maxBag) {
            this.state.bag.push(item);
            // 🛠️ 優化：掉寶顏色日誌
            this.log(`🎁 獲取寶物：${item.name}`, this.getQColor(q));
        }
    }

    // --- 🛠️ 修正：裝備穿不上去的問題 ---
    equip(id) {
        // 強制轉換傳入的 id 為數字，避免字串匹配失敗
        const targetId = Number(id);
        const idx = this.state.bag.findIndex(i => i.id === targetId);
        
        if (idx === -1) {
            console.error("找不到該物品，ID:", targetId);
            return;
        }

        const item = this.state.bag[idx];
        const oldItem = this.state.eq[item.type];

        // 進行交換
        if (oldItem) {
            this.state.bag.push(oldItem);
        }
        this.state.eq[item.type] = item;
        this.state.bag.splice(idx, 1);

        this.log(`✨ 已裝備：${item.name}`, "var(--success)");
        this.calc(); this.update(); this.renderBag(); this.save();
    }

    gainXp(a) { 
        this.state.p.xp += a; 
        while (this.state.p.xp >= this.state.p.nx) { 
            this.state.p.lv++; 
            this.state.p.xp -= this.state.p.nx; 
            this.state.p.nx = Math.floor(this.state.p.nx * 1.5); 
            this.state.p.pts += 5; 
            this.calc(); 
            // 🛠️ 優化：只顯示等級，不重複顯示境界
            this.log(`✨ 突破！目前等級達到 LV.${this.state.p.lv}`, "var(--gold)");
        } 
    }

    // --- 其餘系統邏輯保持不變 ---
    update() {
        const { p, eq } = this.state;
        const curMap = MAP_DATA[this.state.curMap];
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
        this.u('val-pts', p.pts);
        this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('bag-count', this.state.bag.length);
        this.u('val-bag-max', p.maxBag);
        this.u('val-bag-price', 1000 * Math.pow(2, p.bagBuyCount));
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
        
        const uw = document.getElementById('btn-unequip-weapon'); if (uw) uw.style.display = eq.weapon ? 'block' : 'none';
        const ub = document.getElementById('btn-unequip-body'); if (ub) ub.style.display = eq.body ? 'block' : 'none';
        const bc = document.getElementById('btn-class'); if (bc) bc.style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';
    }

    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    toggleAuto() { this.rt.auto = !this.rt.auto; const btn = document.getElementById('btn-auto'); if (btn) btn.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; }
    switchTab(t, el) { 
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none'); 
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); 
        const target = document.getElementById('p-' + t);
        if (target) target.style.display = 'flex'; 
        if (el) el.classList.add('active'); 
        if (t === 'bag') this.renderBag(); 
        if (t === 'stats') this.renderStats(); 
    }
    renderStats() {
        const m = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        const el = document.getElementById('stat-list');
        if (el) el.innerHTML = Object.entries(m).map(([k, n]) => `<div class="stat-row"><span>${n}: <b>${this.state.p[k]}</b></span><button class="btn-plus" onclick="_X_CORE.addStat('${k}')">+</button></div>`).join('');
    }
    renderBag() {
        const el = document.getElementById('bag-list');
        if (el) el.innerHTML = this.state.bag.map(i => {
            const bonus = AFFIX_DATA[i.affixType].bonus;
            return `<div class="item-card quality-${i.q}"><b>${i.name}</b><div style="font-size:10px;color:var(--info);">${bonus} +${i.val}</div><button onclick="_X_CORE.equip(${i.id})">穿戴</button></div>`;
        }).join('');
    }
    unequip(type) {
        if (this.state.eq[type] && this.state.bag.length < this.state.p.maxBag) {
            this.state.bag.push(this.state.eq[type]);
            this.state.eq[type] = null;
            this.calc(); this.update(); this.renderBag(); this.save();
        }
    }
    quickMelt() {
        const fl = parseInt(document.getElementById('melt-filter').value);
        this.state.bag = this.state.bag.filter(i => {
            if (i.q <= fl) { this.state.p.xp += i.val; return false; }
            return true;
        });
        this.update(); this.renderBag(); this.save();
    }
    showMapModal() {
        const el = document.getElementById('map-list');
        if (el) el.innerHTML = Object.values(MAP_DATA).map(m => {
            const unlocked = this.state.unlockedMaps.includes(m.id);
            const current = this.state.curMap === m.id;
            return `<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; border:1px solid ${current?'var(--gold)':'#333'}; opacity:${unlocked?1:0.5}; margin-bottom:5px;">
                <div style="display:flex; justify-content:space-between;"><b>${m.name}</b><span>Lv.${m.reqLv}</span></div>
                ${unlocked ? `<button onclick="_X_CORE.changeMap('${m.id}')" ${current?'disabled':''}>${current?'歷練中':'前往'}</button>` : `<span style="color:var(--danger);font-size:11px;">🔒 擊敗前地圖首領解鎖</span>`}
            </div>`;
        }).join('');
        document.getElementById('map-modal').style.display = 'flex';
    }
    changeMap(id) { this.state.curMap = id; document.getElementById('map-modal').style.display = 'none'; this.spawn(); this.save(); }
    unlockNext() {
        const ids = Object.keys(MAP_DATA);
        const idx = ids.indexOf(this.state.curMap);
        if (idx < ids.length - 1) {
            const nextId = ids[idx+1];
            if (!this.state.unlockedMaps.includes(nextId)) this.state.unlockedMaps.push(nextId);
        }
    }
    showClassModal() { document.getElementById('class-modal').style.display = 'flex'; }
    chooseClass(j) { this.state.p.job = j; document.getElementById('class-modal').style.display = 'none'; this.calc(); this.update(); this.save(); }
    buyBag() {
        const price = 1000 * Math.pow(2, this.state.p.bagBuyCount);
        if (this.state.p.money >= price) { this.state.p.money -= price; this.state.p.maxBag += 5; this.state.p.bagBuyCount++; this.update(); this.save(); }
    }
    respec() { if (confirm("重置所有屬性點？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.update(); this.renderStats(); this.save(); } }
    pop(d, c, x, y) {
        const e = document.createElement('div');
        e.className = 'dmg';
        e.innerText = (c ? '💥 ' : '') + d;
        e.style.color = c ? 'var(--gold)' : '#fff';
        e.style.left = (x || 200) + 'px'; e.style.top = (y || 300) + 'px';
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 600);
    }
    log(m, c) {
        const b = document.getElementById('log');
        if (b) {
            const d = document.createElement('div');
            d.style.color = c || "#fff";
            d.innerHTML = `<span style="color:#888;font-size:10px;">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
            b.prepend(d);
            if (b.children.length > 20) b.lastChild.remove();
        }
    }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_SAVE_V071', JSON.stringify(this.state)); }
}

window._X_CORE = new XianXiaGame();
