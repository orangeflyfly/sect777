class XianXiaGame {
    constructor() {
        // 版本號更新至 V050 以確保數據純淨
        const saved = JSON.parse(localStorage.getItem('XX_V050'));
        this.state = saved || {
            p: { 
                lv: 1, xp: 0, nx: 100, pts: 0, 
                str: 5, vit: 5, agi: 5, int: 5,
                job: null // 職業：sword, body, soul
            },
            bag: [],
            eq: { weapon: null, body: null },
            lastSave: Date.now()
        };

        this.curHp = 0;
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        this.jobNames = { sword: "劍修", body: "體修", soul: "靈修" };
        
        // 隨機詞條庫
        this.prefixes = [
            { n: "迅捷的", stat: "agi", bonus: 1.2 },
            { n: "強力的", stat: "str", bonus: 1.2 },
            { n: "厚重的", stat: "vit", bonus: 1.2 },
            { n: "聰慧的", stat: "int", bonus: 1.2 },
            { n: "暴虐的", stat: "critDmg", bonus: 0.5 },
            { n: "仙靈的", stat: "all", bonus: 1.1 }
        ];

        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now() };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, elite: false };
        
        this.init();
    }

    init() {
        this.calc();
        this.curHp = this.finalHp; 
        this.spawn();
        this.renderStats();
        this.update();
        setInterval(() => this.loop(), 100);
    }

    // --- 核心演算：加入職業加成 ---
    calc() {
        const { p, eq } = this.state;
        
        // 職業係數 (預設 1.0)
        let multi = { str: 1, vit: 1, agi: 1, int: 1 };
        if (p.job === 'sword') { multi.agi = 2.0; }
        if (p.job === 'body') { multi.vit = 2.0; }
        if (p.job === 'soul') { multi.int = 2.0; }

        this.baseAtk = (p.str * multi.str) * 3 + (p.lv * 2);
        this.baseHp = (p.vit * multi.vit) * 20 + (p.lv * 10);
        
        this.plusAtk = eq.weapon ? eq.weapon.val : 0;
        this.plusHp = eq.body ? eq.body.val : 0;

        this.finalAtk = this.baseAtk + this.plusAtk;
        this.finalHp = this.baseHp + this.plusHp;
        
        // 衍生屬性
        this.hpRegen = (p.vit * multi.vit) * 0.5 + (p.lv * 0.2);
        this.spd = 0.5 + ((p.agi * multi.agi) * 0.04);
        this.evasion = Math.min(50, (p.agi * multi.agi) * 0.4);
        this.crit = Math.min(50, (p.int * multi.int) * 0.6);
        this.critDmg = 1.5 + ((p.int * multi.int) * 0.01);
    }

    loop() {
        const now = Date.now();
        // 秒回血
        if (now - this.rt.lastRegen >= 1000) {
            if (this.curHp < this.finalHp) {
                this.curHp = Math.min(this.finalHp, this.curHp + this.hpRegen);
                this.update();
            }
            this.rt.lastRegen = now;
        }
        // 自動攻擊
        if (this.rt.auto && now - this.rt.lastAuto >= (1000 / this.spd)) {
            this.atk(false);
            this.rt.lastAuto = now;
        }
        // 技能CD
        if (this.rt.skillCD > 0) {
            this.rt.skillCD -= 100;
            const per = Math.max(0, (this.rt.skillCD / this.rt.skillMaxCD) * 100);
            const cdEl = document.getElementById('skill-cd');
            if (cdEl) cdEl.style.width = per + "%";
        }
    }

    // --- 裝備系統：隨機詞條生成 ---
    drop() {
        const r = Math.random();
        let q = 0;
        if (r < 0.008) q = 4; // 仙品
        else if (r < 0.04) q = 3; // 極品
        else if (r < 0.15) q = 2; // 精品
        else if (r < 0.45) q = 1; // 良品

        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const tNames = type === 'weapon' ? ["長劍", "重錘", "靈珠", "唐刀"] : ["布袍", "輕甲", "重鎧", "法衣"];
        
        // 基礎數值
        let baseVal = (5 + this.state.p.lv * 2.5) * [1, 1.5, 2.8, 4.5, 9][q];
        let prefix = null;
        let prefixName = "";

        // 高品質裝備有機率獲得隨機前綴
        if (q >= 2 && Math.random() < 0.6) {
            prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
            prefixName = prefix.n + " · ";
            baseVal *= (prefix.bonus || 1.1); // 前綴加成
        }

        const item = { 
            id: Date.now(), 
            type, q, 
            val: Math.floor(baseVal * (0.9 + Math.random() * 0.2)), 
            lvReq: Math.max(1, this.state.p.lv + Math.floor(Math.random() * 4) - 2),
            prefix: prefixName,
            name: `${prefixName}${qNames[q]}·${tNames[Math.floor(Math.random()*4)]}` 
        };
        
        if (this.state.bag.length < 20) {
            this.state.bag.push(item);
            this.log(`🎒 獲得：${item.name}`, this.getQColor(q));
        } else {
            this.log("⚠️ 儲物袋已滿，遺憾錯失寶物！", "var(--danger)");
        }
    }

    // --- BUG 修復：裝備卸下邏輯 ---
    unequip(type) {
        if (this.state.bag.length >= 20) {
            alert("儲物袋空間不足，無法卸下裝備！");
            return;
        }
        const item = this.state.eq[type];
        if (item) {
            this.state.bag.push(item);
            this.state.eq[type] = null;
            this.log(`👕 卸下了 ${item.name}`);
            this.calc(); this.update(); this.renderBag(); this.save();
        }
    }

    // --- BUG 修復：一鍵熔煉過濾器 ---
    quickMelt() {
        const filterLv = parseInt(document.getElementById('melt-filter').value);
        // filterLv 1: 凡/良(q<=1), 2: 精品以下(q<=2)
        let count = 0;
        this.state.bag = this.state.bag.filter(i => {
            if (i.q <= filterLv) {
                this.state.p.xp += Math.floor(i.val * 1.5);
                count++;
                return false;
            }
            return true;
        });
        this.log(`🔥 批量熔煉了 ${count} 件裝備，修為大漲！`, "var(--success)");
        this.update(); this.renderBag(); this.save();
    }

    // --- 職業系統邏輯 ---
    showClassModal() {
        document.getElementById('class-modal').style.display = 'flex';
    }

    chooseClass(jobKey) {
        this.state.p.job = jobKey;
        document.getElementById('class-modal').style.display = 'none';
        this.log(`🎊 成功轉職為【${this.jobNames[jobKey]}】，實力暴增！`, "var(--purple)");
        this.calc(); this.update(); this.save();
    }

    // --- UI 渲染與更新 ---
    update() {
        const { p, eq } = this.state;
        const ridx = Math.min(Math.floor((p.lv - 1) / 10), this.realms.length - 1);
        
        // 標籤更新
        document.getElementById('val-realm').innerText = this.realms[ridx];
        document.getElementById('val-lv').innerText = p.lv;
        document.getElementById('val-class').innerText = p.job ? `· ${this.jobNames[p.job]}` : "";
        
        // 經驗與血條文字
        document.getElementById('bar-xp').style.width = (p.xp / p.nx * 100) + "%";
        document.getElementById('val-xp').innerText = Math.floor(p.xp);
        document.getElementById('val-next-xp').innerText = p.nx;
        
        document.getElementById('bar-p-hp').style.width = (this.curHp / this.finalHp * 100) + "%";
        document.getElementById('val-hp-txt').innerText = `${Math.floor(this.curHp)} / ${this.finalHp}`;
        
        // 屬性數值
        document.getElementById('val-atk').innerText = this.finalAtk;
        document.getElementById('val-hp').innerText = `${Math.floor(this.curHp)} / ${this.finalHp}`;
        document.getElementById('val-pts').innerText = p.pts;
        document.getElementById('val-spd').innerText = this.spd.toFixed(2);
        document.getElementById('val-crit').innerText = this.crit.toFixed(1);
        document.getElementById('val-power').innerText = Math.floor(this.finalAtk * 4 + this.finalHp / 2 + this.evasion * 20);
        document.getElementById('val-regen').innerText = this.hpRegen.toFixed(1);
        document.getElementById('val-evasion').innerText = this.evasion.toFixed(1);
        document.getElementById('val-crit-dmg').innerText = this.critDmg.toFixed(2);

        // 裝備欄位文字與按鈕控制
        document.getElementById('eq-weapon').innerText = eq.weapon ? eq.weapon.name : '無';
        document.getElementById('eq-body').innerText = eq.body ? eq.body.name : '無';
        document.getElementById('btn-unequip-weapon').style.display = eq.weapon ? 'block' : 'none';
        document.getElementById('btn-unequip-body').style.display = eq.body ? 'block' : 'none';

        // 怪物資訊
        document.getElementById('m-name').innerText = (this.m.elite ? '🌟 ' : '') + this.m.n;
        document.getElementById('m-hp-txt').innerText = `${Math.floor(this.m.hp)} / ${this.m.mx}`;
        document.getElementById('bar-m-hp').style.width = (this.m.hp / this.m.mx * 100) + "%";

        // 轉職按鈕開啟條件 (等級大於10且未轉職)
        document.getElementById('btn-class').style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';
    }

    // 其餘輔助方法 (atk, manualAtk, onDie, spawn, gainXp, equip, renderBag, renderStats, pop, toggleAuto, switchTab, log, save)
    atk(isManual, x, y, multi = 1) {
        let isCrit = Math.random() * 100 < this.crit;
        let base = this.finalAtk * (isManual ? 1.2 : 1.0) * multi;
        let dmg = Math.floor(isCrit ? base * this.critDmg : base);
        this.m.hp -= dmg;
        this.pop(dmg, isCrit, x, y);
        if (this.m.hp <= 0) { this.onDie(); } 
        else if (!isManual || Math.random() < 0.3) { this.monsterCounterAtk(); }
        this.update();
    }
    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) { this.pop("閃避", false, 120, 180); return; }
        let mDmg = Math.floor(this.m.mx * 0.08); 
        this.curHp -= mDmg;
        if (this.curHp <= 0) { this.log("💀 傷重倒地，只能先行撤退...", "var(--danger)"); this.curHp = Math.floor(this.finalHp * 0.2); this.rt.auto = false; this.update(); }
    }
    onDie() { this.log(`擊殺了 ${this.m.n}，修為 +${this.m.exp}。`); this.gainXp(this.m.exp); if (Math.random() < (this.m.elite ? 0.8 : 0.25)) this.drop(); this.spawn(); }
    spawn() {
        const pLv = this.state.p.lv; this.m.elite = Math.random() < 0.15;
        const names = this.m.elite ? ["狂暴妖虎", "千年屍王", "幽冥使者"] : ["小野豬", "迷途小鬼", "劇毒蜘蛛"];
        this.m.n = names[Math.floor(Math.random() * 3)];
        this.m.mx = Math.floor(50 * Math.pow(1.25, pLv - 1)) * (this.m.elite ? 3 : 1);
        this.m.hp = this.m.mx; this.m.exp = Math.floor((20 + pLv * 5) * (this.m.elite ? 2.5 : 1));
        document.getElementById('m-card').className = `monster-card ${this.m.elite ? 'elite' : ''}`;
    }
    gainXp(amt) {
        const { p } = this.state; p.xp += amt;
        while (p.xp >= p.nx) { p.lv++; p.xp -= p.nx; p.nx = Math.floor(p.nx * 1.5); p.pts += 5; this.log(`🌟 境界突破：LV ${p.lv}`, "var(--gold)"); this.calc(); }
    }
    equip(id) {
        const idx = this.state.bag.findIndex(i => i.id === id); const item = this.state.bag[idx]; const req = item.lvReq || 1;
        if (this.state.p.lv < req) { alert(`修為不足！需要 LV.${req}`); return; }
        const old = this.state.eq[item.type]; if (old) this.state.bag.push(old);
        this.state.eq[item.type] = item; this.state.bag.splice(idx, 1);
        this.calc(); this.update(); this.renderBag(); this.save();
    }
    renderBag() {
        const list = document.getElementById('bag-list');
        list.innerHTML = this.state.bag.map(i => {
            const req = i.lvReq || 1; const can = this.state.p.lv >= req;
            return `
                <div class="item-card quality-${i.q}">
                    <span class="item-prefix">${i.prefix || ""}</span>
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <b>${i.name.replace(i.prefix, "")}</b>
                        <span style="font-size:10px; color:${can?'var(--success)':'var(--danger)'}">Lv.${req}</span>
                    </div>
                    <div style="margin:5px 0; color:#8b949e;">${i.type==='weapon'?'ATK':'HP'} +${i.val}</div>
                    <div class="btn-group">
                        <button class="btn-small" onclick="game.equip(${i.id})">穿戴</button>
                    </div>
                </div>
            `;
        }).join('');
        document.getElementById('bag-count').innerText = this.state.bag.length;
    }
    renderStats() {
        const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        document.getElementById('stat-list').innerHTML = Object.entries(map).map(([k, n]) => `
            <div class="stat-row">
                <span style="font-size: 13px;">${n} (<b>${this.state.p[k]}</b>)</span>
                <button class="btn-plus" onclick="game.addStat('${k}')">+</button>
            </div>
        `).join('');
    }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    pop(dmg, crit, x, y) {
        const d = document.createElement('div'); d.className = 'dmg'; d.innerText = (crit ? '💥 ' : '') + dmg;
        d.style.color = crit ? 'var(--gold)' : (dmg === "閃避" ? 'var(--info)' : '#fff');
        d.style.left = (x || 200) + 'px'; d.style.top = (y || 300) + 'px';
        document.body.appendChild(d); setTimeout(() => d.remove(), 600);
    }
    toggleAuto() { this.rt.auto = !this.rt.auto; const btn = document.getElementById('btn-auto'); btn.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; btn.style.background = this.rt.auto ? "var(--success)" : "#30363d"; }
    switchTab(tab, el) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('p-' + tab).style.display = 'flex'; el.classList.add('active');
        if (tab === 'bag') this.renderBag();
    }
    log(m, c) {
        const b = document.getElementById('log'); if (!b) return;
        const d = document.createElement('div');
        d.style.color = m.includes("擊殺") ? "var(--success)" : (m.includes("💀") ? "var(--danger)" : (c || 'inherit'));
        d.innerHTML = `<span style="color:#555">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
        b.prepend(d); if (b.children.length > 20) b.lastChild.remove();
    }
    respec() { if (!confirm("重置點數？")) return; const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.curHp=this.finalHp; this.renderStats(); this.update(); this.save(); }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_V050', JSON.stringify(this.state)); }
}

const game = new XianXiaGame();
