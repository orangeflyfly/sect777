/**
 * 仙俠宗門 V0.7.0 - 核心引擎
 * 特色：數據分家、地圖切換、Boss 系統
 */

class XianXiaGame {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('XX_V070'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null, money: 0, maxBag: 20, bagBuyCount: 0 },
            bag: [], 
            eq: { weapon: null, body: null },
            curMap: "area1", // 預設在地圖 1
            mapProgress: { area1: 0, area2: 0, area3: 0 }, // 記錄各地圖擊殺數
            unlockedMaps: ["area1"] // 已解鎖地圖
        };

        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now(), isBoss: false };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, money: 10 };
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        
        window.onload = () => this.init();
    }

    // --- 萬能 UI 更新助手 ---
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
        this.log("📜 成功連結藏經閣，V0.7.0 啟動！", "var(--info)");
    }

    // --- 核心計算：從 data.js 讀取加成 ---
    calc() {
        const { p, eq } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        
        // 職業加成
        if (p.job === 'sword') m.agi = 2.0;
        if (p.job === 'body') m.vit = 2.0;
        if (p.job === 'soul') m.int = 2.0;

        // 裝備詞條加成
        let extra = { atk: 1, hp: 1 };
        [eq.weapon, eq.body].forEach(item => {
            if (item && item.affixType) {
                const bonus = 1 + (item.q * 0.1); // 品質影響詞條威力
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

    // --- 生成怪物/Boss 邏輯 ---
    spawn() {
        const map = MAP_DATA[this.state.curMap];
        const pLv = this.state.p.lv;
        
        // 判定是否召喚 Boss (每擊殺 30 隻且該圖未通關)
        const kills = this.state.mapProgress[this.state.curMap];
        this.rt.isBoss = (kills > 0 && kills % 30 === 0);

        if (this.rt.isBoss) {
            const b = map.boss;
            this.m.n = `【首領】${b.n}`;
            this.m.mx = Math.floor(100 * Math.pow(1.3, pLv - 1) * b.hpMult);
            this.m.exp = Math.floor((20 + pLv * 5) * b.expMult);
            this.m.money = Math.floor((10 + pLv * 2) * b.goldMult);
            this.log(`⚠️ 強大氣息出現：${this.m.n}！`, "var(--danger)");
        } else {
            const mName = map.monsters[Math.floor(Math.random() * map.monsters.length)];
            this.m.n = mName;
            this.m.mx = Math.floor(50 * Math.pow(1.25, pLv - 1));
            this.m.exp = 20 + pLv * 5;
            this.m.money = 10 + pLv * 2;
        }
        this.m.hp = this.m.mx;
        this.u('m-name', this.m.n);
        this.update();
    }

    atk(isManual, x, y, multi = 1) {
        let isCrit = Math.random() * 100 < this.crit;
        let dmg = Math.floor(this.finalAtk * (isManual ? 1.2 : 1.0) * multi * (isCrit ? this.critDmg : 1));
        this.m.hp -= dmg;
        this.pop(dmg, isCrit, x, y);
        if (this.m.hp <= 0) this.onDie(); 
        else if (!isManual || Math.random() < 0.3) this.monsterCounterAtk();
        this.update();
    }

    onDie() {
        this.state.p.money += this.m.money;
        this.gainXp(this.m.exp);
        this.log(`🗡️ 擊殺 ${this.m.n}！靈石+${this.m.money}`, "white");
        
        // 增加地圖進度
        this.state.mapProgress[this.state.curMap]++;
        
        // Boss 掉落與解鎖邏輯
        if (this.rt.isBoss) {
            this.drop(true); // Boss 必掉高品質
            this.unlockNextMap();
            this.rt.isBoss = false;
        } else if (Math.random() < 0.25) {
            this.drop(false);
        }
        this.spawn();
        this.save();
    }

    // --- 掉落系統：連結 data.js 的 Bias ---
    drop(isBossDrop) {
        const r = Math.random();
        let q = isBossDrop ? (r < 0.3 ? 4 : 3) : (r < 0.01 ? 4 : r < 0.05 ? 3 : r < 0.2 ? 2 : r < 0.5 ? 1 : 0);
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const tNames = ITEM_BASE[type];
        
        // 詞條抽取邏輯
        const map = MAP_DATA[this.state.curMap];
        const types = Object.keys(AFFIX_DATA);
        // 如果地圖有偏好(Bias)，提高該系機率
        let aT = types[Math.floor(Math.random() * types.length)];
        if (map.bias && Math.random() < 0.4) aT = map.bias;

        const lib = AFFIX_DATA[aT];
        const aN = lib.list[Math.floor(Math.random() * lib.list.length)];
        
        const item = { 
            id: Date.now(), type, q, 
            val: Math.floor((5 + this.state.p.lv * 2.5) * (q + 1)), 
            lvReq: this.state.p.lv, affixType: aT, 
            name: `[${lib.label}] ${aN}${qNames[q]}·${tNames[Math.floor(Math.random()*tNames.length)]}` 
        };

        if (this.state.bag.length < this.state.p.maxBag) {
            this.state.bag.push(item);
            this.log(`🎁 掉落：${item.name}`, this.getQColor(q));
        }
    }

    // --- 地圖管理 ---
    showMapModal() {
        const list = document.getElementById('map-list');
        list.innerHTML = Object.values(MAP_DATA).map(m => {
            const isUnlocked = this.state.unlockedMaps.includes(m.id);
            const isCurrent = this.state.curMap === m.id;
            return `
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; border:1px solid ${isCurrent?'var(--gold)':'#333'}; opacity:${isUnlocked?1:0.5}">
                    <div style="display:flex; justify-content:space-between;">
                        <b>${m.name}</b>
                        <span style="font-size:10px; color:#888;">Lv.${m.reqLv}</span>
                    </div>
                    <p style="font-size:10px; color:#aaa; margin:5px 0;">${m.desc}</p>
                    ${isUnlocked ? 
                        `<button onclick="game.changeMap('${m.id}')" ${isCurrent?'disabled':''}>${isCurrent?'歷練中':'前往'}</button>` : 
                        `<span style="color:var(--danger); font-size:10px;">🔒 尚未解鎖</span>`
                    }
                </div>
            `;
        }).join('');
        document.getElementById('map-modal').style.display = 'flex';
    }

    changeMap(id) {
        if (this.state.p.lv < MAP_DATA[id].reqLv) return alert("等級不足！");
        this.state.curMap = id;
        document.getElementById('map-modal').style.display = 'none';
        this.log(`🚀 傳送至地圖：${MAP_DATA[id].name}`, "var(--info)");
        this.spawn();
        this.save();
    }

    unlockNextMap() {
        const mapIds = Object.keys(MAP_DATA);
        const curIdx = mapIds.indexOf(this.state.curMap);
        if (curIdx < mapIds.length - 1) {
            const nextId = mapIds[curIdx + 1];
            if (!this.state.unlockedMaps.includes(nextId)) {
                this.state.unlockedMaps.push(nextId);
                this.log(`🎊 恭喜！解鎖了新地圖：${MAP_DATA[nextId].name}`, "var(--gold)");
            }
        }
    }

    // --- 介面與其他邏輯 (簡化版) ---
    update() {
        const { p, eq } = this.state;
        const curMap = MAP_DATA[this.state.curMap];
        this.u('val-realm', this.realms[Math.min(Math.floor((p.lv-1)/10), 9)]);
        this.u('val-money', p.money);
        this.u('val-lv', p.lv);
        this.u('val-map-name', `📍 ${curMap.name}`);
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`);
        this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true);
        this.u('val-xp', p.xp); this.u('val-next-xp', p.nx);
        this.u('val-atk', this.finalAtk); this.u('val-pts', p.pts);
        this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('bag-count', this.state.bag.length);
        this.u('val-bag-max', p.maxBag);
        this.u('val-bag-price', 1000 * Math.pow(2, p.bagBuyCount));
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
    }

    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) { this.pop("閃避", false, 120, 180); return; }
        this.curHp -= Math.floor(this.m.mx * 0.05);
        if (this.curHp <= 0) { this.log("💀 傷重倒地...", "var(--danger)"); this.curHp = Math.floor(this.finalHp * 0.2); this.rt.auto = false; }
        this.update();
    }

    gainXp(a) { this.state.p.xp += a; while (this.state.p.xp >= this.state.p.nx) { this.state.p.lv++; this.state.p.xp -= this.state.p.nx; this.state.p.nx = Math.floor(this.state.p.nx * 1.5); this.state.p.pts += 5; this.calc(); } }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    toggleAuto() { this.rt.auto = !this.rt.auto; const b = document.getElementById('btn-auto'); b.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; b.style.background = this.rt.auto ? "var(--success)" : "#444c56"; }
    switchTab(t, el) { document.querySelectorAll('.stage').forEach(s => s.style.display = 'none'); document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); document.getElementById('p-' + t).style.display = 'flex'; el.classList.add('active'); if (t === 'bag') this.renderBag(); if (t === 'stats') this.renderStats(); }
    renderBag() { const l = document.getElementById('bag-list'); if (l) l.innerHTML = this.state.bag.map(i => `<div class="item-card quality-${i.q}"><b>${i.name}</b><div style="font-size:10px;color:var(--info);">屬性 +${i.val}</div><button onclick="game.equip(${i.id})">穿戴</button></div>`).join(''); }
    renderStats() { const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' }; const el = document.getElementById('stat-list'); if (el) el.innerHTML = Object.entries(map).map(([k, n]) => `<div class="stat-row"><span>${n}: <b>${this.state.p[k]}</b></span><button class="btn-plus" onclick="game.addStat('${k}')">+</button></div>`).join(''); }
    equip(id) { const idx = this.state.bag.findIndex(i => i.id === id); const i = this.state.bag[idx]; const old = this.state.eq[i.type]; if (old) this.state.bag.push(old); this.state.eq[i.type] = i; this.state.bag.splice(idx, 1); this.calc(); this.update(); this.renderBag(); this.save(); }
    quickMelt() { const fl = parseInt(document.getElementById('melt-filter').value); this.state.bag = this.state.bag.filter(i => { if (i.q <= fl) { this.state.p.xp += i.val; return false; } return true; }); this.update(); this.renderBag(); this.save(); }
    buyBag() { const p = 1000 * Math.pow(2, this.state.p.bagBuyCount); if (this.state.p.money >= p) { this.state.p.money -= p; this.state.p.maxBag += 5; this.state.p.bagBuyCount++; this.update(); this.save(); } }
    respec() { if (confirm("重置點數？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.curHp=this.finalHp; this.renderStats(); this.update(); this.save(); } }
    manualAtk(e) { this.atk(true, e.clientX, e.clientY); }
    useSkill() { if (this.rt.skillCD <= 0) { this.atk(true, 240, 300, 3.5); this.rt.skillCD = this.rt.skillMaxCD; } }
    pop(d, c, x, y) { const e = document.createElement('div'); e.className = 'dmg'; e.innerText = (c ? '💥 ' : '') + d; e.style.color = c ? 'var(--gold)' : '#fff'; e.style.left = (x || 200) + 'px'; e.style.top = (y || 300) + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 600); }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    log(m, c) {
        const b = document.getElementById('log'); if (!b) return;
        const d = document.createElement('div'); d.style.color = c || "#ffffff";
        d.innerHTML = `<span style="color:#888;font-size:10px;">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
        b.prepend(d); if (b.children.length > 20) b.lastChild.remove();
    }
    save() { localStorage.setItem('XX_V070', JSON.stringify(this.state)); }
}
const game = new XianXiaGame();
