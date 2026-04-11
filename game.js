class XianXiaGame {
    constructor() {
        // 使用 V053 版本號確保數據結構乾淨
        const saved = JSON.parse(localStorage.getItem('XX_V053'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null },
            bag: [], 
            eq: { weapon: null, body: null }, 
            lastSave: Date.now()
        };

        this.curHp = 0;
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        this.jobNames = { sword: "劍修", body: "體修", soul: "靈修" };
        this.prefixes = [
            { n: "迅捷的", bonus: 1.2 }, { n: "強力的", bonus: 1.2 },
            { n: "厚重的", bonus: 1.2 }, { n: "聰慧的", bonus: 1.2 },
            { n: "暴虐的", bonus: 1.3 }, { n: "仙靈的", bonus: 1.5 }
        ];

        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now() };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, elite: false };
        
        // 確保 DOM 載入後才初始化
        window.onload = () => {
            this.init();
        };
    }

    // --- 安全更新 UI 函數 ---
    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (!el) return;
        if (isStyle) el.style.width = val;
        else el.innerText = val;
    }

    init() {
        this.calc();
        this.curHp = this.finalHp; 
        this.spawn();
        this.renderStats();
        this.update();
        setInterval(() => this.loop(), 100);
        console.log("遊戲初始化完成：V0.5.3 穩定版");
    }

    // --- 數值演算 (含職業加成) ---
    calc() {
        const { p, eq } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        
        // 轉職倍率
        if (p.job === 'sword') m.agi = 2.0;
        if (p.job === 'body') m.vit = 2.0;
        if (p.job === 'soul') m.int = 2.0;

        this.baseAtk = (p.str * m.str) * 3 + (p.lv * 2);
        this.baseHp = (p.vit * m.vit) * 20 + (p.lv * 10);
        
        const wAtk = eq.weapon ? eq.weapon.val : 0;
        const bHp = eq.body ? eq.body.val : 0;

        this.finalAtk = Math.floor(this.baseAtk + wAtk);
        this.finalHp = Math.floor(this.baseHp + bHp);
        
        this.hpRegen = (p.vit * m.vit) * 0.5 + (p.lv * 0.2);
        this.spd = 0.5 + ((p.agi * m.agi) * 0.04);
        this.evasion = Math.min(50, (p.agi * m.agi) * 0.4);
        this.crit = Math.min(50, (p.int * m.int) * 0.6);
        this.critDmg = 1.5 + ((p.int * m.int) * 0.01);
    }

    // --- 核心迴圈 ---
    loop() {
        const now = Date.now();
        // 秒回
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
        // CD 更新
        if (this.rt.skillCD > 0) {
            this.rt.skillCD -= 100;
            const per = Math.max(0, (this.rt.skillCD / this.rt.skillMaxCD) * 100);
            this.u('skill-cd', per + "%", true);
        } else {
            const btn = document.getElementById('btn-skill');
            if (btn) btn.disabled = false;
        }
    }

    // --- 戰鬥系統 ---
    manualAtk(e) {
        this.atk(true, e ? e.clientX : 200, e ? e.clientY : 300);
    }

    useSkill() {
        if (this.rt.skillCD <= 0) {
            this.atk(true, 240, 300, 3.5); // 技能 3.5 倍傷害
            this.rt.skillCD = this.rt.skillMaxCD;
            const btn = document.getElementById('btn-skill');
            if (btn) btn.disabled = true;
            this.log("💥 施展【御劍術】，劍氣縱橫！", "var(--info)");
        }
    }

    atk(isManual, x, y, multi = 1) {
        let isCrit = Math.random() * 100 < this.crit;
        let base = this.finalAtk * (isManual ? 1.2 : 1.0) * multi;
        let dmg = Math.floor(isCrit ? base * this.critDmg : base);

        this.m.hp -= dmg;
        this.pop(dmg, isCrit, x, y);
        
        if (this.m.hp <= 0) {
            this.onDie();
        } else if (!isManual || Math.random() < 0.3) {
            this.monsterCounterAtk();
        }
        this.update();
    }

    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) {
            this.pop("閃避", false, 120, 180);
            return;
        }
        let mDmg = Math.floor(this.m.mx * 0.08); 
        this.curHp -= mDmg;
        if (this.curHp <= 0) {
            this.log("💀 傷重倒地，撤回宗門修養...", "var(--danger)");
            this.curHp = Math.floor(this.finalHp * 0.2);
            this.rt.auto = false;
            this.u('btn-auto', '自動歷練: OFF');
            document.getElementById('btn-auto').style.background = "#30363d";
        }
    }

    // --- 掉落與裝備 ---
    drop() {
        const r = Math.random();
        let q = r < 0.008 ? 4 : r < 0.04 ? 3 : r < 0.15 ? 2 : r < 0.45 ? 1 : 0;
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const tNames = type === 'weapon' ? ["長劍", "重錘", "靈珠", "唐刀"] : ["布袍", "輕甲", "重鎧", "法衣"];
        
        let baseVal = (5 + this.state.p.lv * 2.2) * [1, 1.5, 2.8, 4.5, 9][q];
        let pfx = "";
        
        // 隨機詞條生成
        if (q >= 2 && Math.random() < 0.6) {
            const p = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
            pfx = p.n + " · ";
            baseVal *= p.bonus;
        }

        const item = { 
            id: Date.now(), type, q, 
            val: Math.floor(baseVal), 
            lvReq: Math.max(1, this.state.p.lv + Math.floor(Math.random() * 3) - 1),
            name: pfx + qNames[q] + "·" + tNames[Math.floor(Math.random()*4)]
        };
        
        if (this.state.bag.length < 20) {
            this.state.bag.push(item);
            this.log(`🎒 獲得：${item.name}`, this.getQColor(q));
        } else {
            this.log("⚠️ 儲物袋已滿，無法取得寶物！", "var(--danger)");
        }
    }

    equip(id) {
        const idx = this.state.bag.findIndex(i => i.id === id);
        const item = this.state.bag[idx];
        if (this.state.p.lv < (item.lvReq || 1)) {
            alert(`需要 LV.${item.lvReq} 才能裝備！`); return;
        }
        const old = this.state.eq[item.type];
        if (old) this.state.bag.push(old);
        this.state.eq[item.type] = item;
        this.state.bag.splice(idx, 1);
        this.calc(); this.update(); this.renderBag(); this.save();
    }

    unequip(type) {
        if (this.state.bag.length >= 20) {
            alert("儲物袋滿了！"); return;
        }
        const item = this.state.eq[type];
        if (item) {
            this.state.bag.push(item);
            this.state.eq[type] = null;
            this.calc(); this.update(); this.renderBag(); this.save();
        }
    }

    quickMelt() {
        const filter = parseInt(document.getElementById('melt-filter')?.value || 1);
        let count = 0;
        this.state.bag = this.state.bag.filter(i => {
            if (i.q <= filter) {
                this.state.p.xp += Math.floor(i.val * 1.5);
                count++; return false;
            }
            return true;
        });
        this.log(`🔥 批量熔煉完成，清理了 ${count} 件裝備。`, "var(--success)");
        this.update(); this.renderBag(); this.save();
    }

    // --- 升級與流派 ---
    onDie() {
        this.log(`擊殺了 ${this.m.n}，修為 +${this.m.exp}。`);
        this.gainXp(this.m.exp);
        if (Math.random() < (this.m.elite ? 0.8 : 0.25)) this.drop();
        this.spawn();
    }

    gainXp(amt) {
        const { p } = this.state; p.xp += amt;
        while (p.xp >= p.nx) {
            p.lv++; p.xp -= p.nx; p.nx = Math.floor(p.nx * 1.5); p.pts += 5;
            this.log(`🌟 境界突破：LV ${p.lv}`, "var(--gold)");
            this.calc();
        }
    }

    spawn() {
        const pLv = this.state.p.lv;
        this.m.elite = Math.random() < 0.15;
        this.m.mx = Math.floor(50 * Math.pow(1.25, pLv - 1)) * (this.m.elite ? 3 : 1);
        this.m.hp = this.m.mx;
        this.m.exp = Math.floor((20 + pLv * 5) * (this.m.elite ? 2.5 : 1));
        const mc = document.getElementById('m-card');
        if (mc) mc.className = `monster-card ${this.m.elite ? 'elite' : ''}`;
    }

    chooseClass(job) {
        this.state.p.job = job;
        document.getElementById('class-modal').style.display = 'none';
        this.log(`🎊 恭喜道友轉職為【${this.jobNames[job]}】！`, "var(--purple)");
        this.calc(); this.update(); this.save();
    }

    showClassModal() {
        const modal = document.getElementById('class-modal');
        if (modal) modal.style.display = 'flex';
    }

    // --- 介面更新與渲染 ---
    update() {
        const { p, eq } = this.state;
        const ridx = Math.min(Math.floor((p.lv - 1) / 10), this.realms.length - 1);
        
        this.u('val-realm', this.realms[ridx]);
        this.u('val-lv', p.lv);
        this.u('val-class', p.job ? `· ${this.jobNames[p.job]}` : "");
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true);
        this.u('val-xp', Math.floor(p.xp));
        this.u('val-next-xp', p.nx);
        
        this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`);
        this.u('val-atk', this.finalAtk);
        this.u('val-pts', p.pts);
        this.u('val-spd', this.spd.toFixed(2));
        this.u('val-crit', this.crit.toFixed(1));
        this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2 + this.evasion * 20));
        this.u('val-regen', this.hpRegen.toFixed(1));
        this.u('val-evasion', this.evasion.toFixed(1));
        this.u('val-crit-dmg', this.critDmg.toFixed(2));
        
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('bag-count', this.state.bag.length);
        
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);

        // 卸下按鈕邏輯
        const uw = document.getElementById('btn-unequip-weapon'); if (uw) uw.style.display = eq.weapon ? 'block' : 'none';
        const ub = document.getElementById('btn-unequip-body'); if (ub) ub.style.display = eq.body ? 'block' : 'none';
        
        // 轉職按鈕邏輯
        const bc = document.getElementById('btn-class');
        if (bc) bc.style.display = (p.lv >= 11 && !p.job) ? 'block' : 'none';
    }

    renderStats() {
        const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        const el = document.getElementById('stat-list');
        if (el) el.innerHTML = Object.entries(map).map(([k, n]) => `
            <div class="stat-row">
                <span>${n} (<b>${this.state.p[k]}</b>)</span>
                <button class="btn-plus" onclick="game.addStat('${k}')">+</button>
            </div>
        `).join('');
    }

    renderBag() {
        const list = document.getElementById('bag-list');
        if (!list) return;
        list.innerHTML = this.state.bag.map(i => `
            <div class="item-card quality-${i.q}">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <b>${i.name}</b>
                    <span style="font-size:10px; color:${this.state.p.lv >= (i.lvReq||1) ? 'var(--success)' : 'var(--danger)'}">Lv.${i.lvReq||1}</span>
                </div>
                <div style="margin:5px 0; color:#8b949e;">${i.type==='weapon'?'攻擊':'氣血'} +${i.val}</div>
                <button class="btn-small" onclick="game.equip(${i.id})">穿戴</button>
            </div>
        `).join('');
        this.u('bag-count', this.state.bag.length);
    }

    // --- 輔助功能 ---
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    
    toggleAuto() { 
        this.rt.auto = !this.rt.auto; 
        const btn = document.getElementById('btn-auto'); 
        if (btn) {
            btn.innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`;
            btn.style.background = this.rt.auto ? "var(--success)" : "#30363d";
        }
    }

    switchTab(tab, el) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        const target = document.getElementById('p-' + tab);
        if (target) target.style.display = 'flex';
        if (el) el.classList.add('active');
        if (tab === 'bag') this.renderBag();
        if (tab === 'stats') this.renderStats();
    }

    pop(dmg, crit, x, y) {
        const d = document.createElement('div'); d.className = 'dmg'; 
        d.innerText = (crit ? '💥 ' : '') + dmg;
        d.style.color = crit ? 'var(--gold)' : (dmg === "閃避" ? 'var(--info)' : '#fff');
        d.style.left = (x || 200) + 'px'; d.style.top = (y || 300) + 'px';
        document.body.appendChild(d); setTimeout(() => d.remove(), 600);
    }

    log(m, c) {
        const b = document.getElementById('log'); if (!b) return;
        const d = document.createElement('div');
        d.style.color = m.includes("擊殺") ? "var(--success)" : (m.includes("💀") ? "var(--danger)" : (c || 'inherit'));
        d.innerHTML = `<span style="color:#555">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
        b.prepend(d); if (b.children.length > 20) b.lastChild.remove();
    }

    respec() { 
        if (!confirm("確定要重置所有點數嗎？")) return; 
        const p = this.state.p;
        p.pts += (p.str-5) + (p.vit-5) + (p.agi-5) + (p.int-5);
        p.str=5; p.vit=5; p.agi=5; p.int=5;
        this.calc(); this.curHp=this.finalHp; this.renderStats(); this.update(); this.save();
    }

    save() { localStorage.setItem('XX_V053', JSON.stringify(this.state)); }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
}

// 啟動實例
const game = new XianXiaGame();
