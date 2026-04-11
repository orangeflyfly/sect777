class XianXiaGame {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('XX_V040'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5 },
            bag: [],
            eq: { weapon: null, body: null },
            lastSave: Date.now()
        };

        // 核心狀態：新增當前血量
        this.curHp = 0; 
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        this.rt = { auto: false, lastAuto: 0, skillCD: 0, skillMaxCD: 8000, lastRegen: Date.now() };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, elite: false };
        
        this.init();
    }

    init() {
        this.calc();
        this.curHp = this.finalHp; // 初始化血量
        this.spawn();
        this.renderStats();
        this.update();
        setInterval(() => this.loop(), 100);
    }

    // --- 核心演算優化：衍生屬性邏輯 ---
    calc() {
        const { p, eq } = this.state;
        
        // 基礎四維與裝備
        this.baseAtk = p.str * 3 + (p.lv * 2);
        this.baseHp = p.vit * 20 + (p.lv * 10);
        this.plusAtk = eq.weapon ? eq.weapon.val : 0;
        this.plusHp = eq.body ? eq.body.val : 0;
        
        // 1. 力量衍生：攻擊力 + 破甲(忽略防禦，預留)
        this.finalAtk = this.baseAtk + this.plusAtk;
        
        // 2. 體質衍生：最大生命 + 每秒回血
        this.finalHp = this.baseHp + this.plusHp;
        this.hpRegen = p.vit * 0.5 + (p.lv * 0.2); // 體質越高，回血越快
        
        // 3. 敏捷衍生：攻速 + 閃避率
        this.spd = 0.5 + (p.agi * 0.04); 
        this.evasion = Math.min(45, p.agi * 0.4); // 閃避率上限 45%
        
        // 4. 靈力衍生：暴擊率 + 暴擊傷害
        this.crit = Math.min(50, p.int * 0.6);
        this.critDmg = 1.5 + (p.int * 0.01); // 靈力越高，暴擊倍率越高(1.5x起跳)
    }

    loop() {
        const now = Date.now();

        // 每秒回血邏輯 (Regen)
        if (now - this.rt.lastRegen >= 1000) {
            if (this.curHp < this.finalHp) {
                this.curHp = Math.min(this.finalHp, this.curHp + this.hpRegen);
                this.update();
            }
            this.rt.lastRegen = now;
        }

        // 自動攻擊
        if (this.rt.auto) {
            if (now - this.rt.lastAuto >= (1000 / this.spd)) {
                this.atk(false);
                this.rt.lastAuto = now;
            }
        }

        // 技能 CD 更新
        if (this.rt.skillCD > 0) {
            this.rt.skillCD -= 100;
            const per = (this.rt.skillCD / this.rt.skillMaxCD) * 100;
            document.getElementById('skill-cd').style.width = per + "%";
        }
    }

    // --- 戰鬥邏輯優化：加入閃避與暴傷 ---
    atk(isManual, x, y, multi = 1) {
        // 怪物閃避判定 (未來可加入怪物閃避，目前先寫玩家對怪物)
        let isCrit = Math.random() * 100 < this.crit;
        let baseDmg = this.finalAtk * (isManual ? 1.2 : 1.0) * multi;
        let dmg = Math.floor(isCrit ? baseDmg * this.critDmg : baseDmg);

        this.m.hp -= dmg;
        this.pop(dmg, isCrit, x, y);
        
        if (this.m.hp <= 0) {
            this.onDie();
        } else {
            // 怪物反擊判定 (新增：玩家閃避)
            this.monsterCounterAtk();
        }
        this.update();
    }

    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) {
            this.pop("閃避", false, 100, 150);
            return;
        }
        let mDmg = Math.floor(this.m.mx * 0.05); // 怪物傷害為其最大血量的 5%
        this.curHp -= mDmg;
        if (this.curHp <= 0) {
            this.log("💀 傷勢過重，暫時撤退...", "var(--danger)");
            this.curHp = Math.floor(this.finalHp * 0.2); // 敗北後恢復 20%
            this.rt.auto = false;
            this.update();
        }
    }

    // --- 洗點系統 (Respec) ---
    respec() {
        if (!confirm("確定要耗費神識重置所有屬性點嗎？")) return;
        
        const p = this.state.p;
        // 計算已投入的總點數 (扣除初始 5 點)
        const totalInvested = (p.str - 5) + (p.vit - 5) + (p.agi - 5) + (p.int - 5);
        p.pts += totalInvested;
        
        // 回歸初始值
        p.str = 5; p.vit = 5; p.agi = 5; p.int = 5;
        
        this.log("🔮 時光倒流，屬性已歸零。", "var(--purple)");
        this.calc();
        this.curHp = this.finalHp;
        this.renderStats();
        this.update();
        this.save();
    }

    // --- 其餘邏輯保持並微調 ---
    useSkill() {
        if (this.rt.skillCD <= 0) {
            this.atk(true, 240, 300, 3.5);
            this.rt.skillCD = this.rt.skillMaxCD;
            this.log("💥 御劍術！劍影紛飛。", "var(--info)");
        }
    }

    manualAtk(e) {
        this.atk(true, e.clientX, e.clientY);
    }

    onDie() {
        this.log(`擊殺了 ${this.m.n}，修為 +${this.m.exp}。`);
        this.gainXp(this.m.exp);
        if (Math.random() < (this.m.elite ? 0.8 : 0.25)) this.drop();
        this.spawn();
    }

    spawn() {
        const pLv = this.state.p.lv;
        this.m.elite = Math.random() < 0.15;
        const names = this.m.elite ? ["狂暴妖虎", "千年屍王", "幽冥使者"] : ["小野豬", "迷途小鬼", "劇毒蜘蛛"];
        this.m.n = names[Math.floor(Math.random() * 3)];
        this.m.mx = Math.floor(50 * Math.pow(1.25, pLv - 1)) * (this.m.elite ? 3 : 1);
        this.m.hp = this.m.mx;
        this.m.exp = Math.floor((20 + pLv * 5) * (this.m.elite ? 2.5 : 1));
        document.getElementById('m-card').className = `monster-card ${this.m.elite ? 'elite' : ''}`;
    }

    drop() {
        const r = Math.random();
        let q = 0;
        if (r < 0.03) q = 4; else if (r < 0.1) q = 3; else if (r < 0.25) q = 2; else if (r < 0.5) q = 1;
        const type = Math.random() < 0.5 ? 'weapon' : 'body';
        const qNames = ["凡品", "良品", "精品", "極品", "仙品"];
        const val = Math.floor((q + 1) * (5 + Math.random() * 10) * Math.pow(1.15, this.state.p.lv));
        const item = { id: Date.now(), type, q, val, name: `${qNames[q]}·裝備` };
        if (this.state.bag.length < 20) {
            this.state.bag.push(item);
            this.log(`🎒 拾得：${item.name}`, this.getQColor(q));
        }
    }

    gainXp(amt) {
        const { p } = this.state;
        p.xp += amt;
        while (p.xp >= p.nx) {
            p.lv++; p.xp -= p.nx; p.nx = Math.floor(p.nx * 1.5); p.pts += 5;
            this.log(`🌟 境界提升！等級：LV ${p.lv}`, "var(--gold)");
            this.calc();
        }
    }

    equip(id) {
        const idx = this.state.bag.findIndex(i => i.id === id);
        const item = this.state.bag[idx];
        const old = this.state.eq[item.type];
        if (old) this.state.bag.push(old);
        this.state.eq[item.type] = item;
        this.state.bag.splice(idx, 1);
        this.calc(); this.update(); this.renderBag();
    }

    renderStats() {
        const map = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        document.getElementById('stat-list').innerHTML = Object.entries(map).map(([k, n]) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span>${n} (<b>${this.state.p[k]}</b>)</span>
                <button style="width:30px; background:var(--info); border:0; border-radius:4px; font-weight:bold;" onclick="game.addStat('${k}')">+</button>
            </div>
        `).join('');
    }

    addStat(k) {
        if (this.state.p.pts > 0) {
            this.state.p.pts--; this.state.p[k]++;
            this.calc(); this.renderStats(); this.update(); this.save();
        }
    }

    update() {
        const { p, eq } = this.state;
        const realmIdx = Math.min(Math.floor((p.lv - 1) / 10), this.realms.length - 1);
        document.getElementById('val-realm').innerText = this.realms[realmIdx];
        document.getElementById('val-lv').innerText = p.lv;
        document.getElementById('val-xp').innerText = p.xp;
        document.getElementById('val-next-xp').innerText = p.nx;
        document.getElementById('bar-xp').style.width = (p.xp / p.nx * 100) + "%";
        document.getElementById('val-pts').innerText = p.pts;
        
        // 戰鬥數據
        document.getElementById('val-atk').innerText = this.finalAtk;
        document.getElementById('val-hp').innerText = `${Math.floor(this.curHp)} / ${this.finalHp}`;
        document.getElementById('bar-p-hp').style.width = (this.curHp / this.finalHp * 100) + "%";
        
        document.getElementById('val-spd').innerText = this.spd.toFixed(2);
        document.getElementById('val-crit').innerText = this.crit.toFixed(1);
        document.getElementById('val-power').innerText = Math.floor(this.finalAtk * 4 + this.finalHp / 3 + this.evasion * 10);

        // 衍生數據更新
        document.getElementById('val-regen').innerText = this.hpRegen.toFixed(1);
        document.getElementById('val-evasion').innerText = this.evasion.toFixed(1);
        document.getElementById('val-crit-dmg').innerText = this.critDmg.toFixed(2);

        document.getElementById('m-name').innerText = (this.m.elite ? '🌟 ' : '') + this.m.n;
        document.getElementById('m-hp-txt').innerText = `${Math.floor(this.m.hp)}/${this.m.mx}`;
        document.getElementById('bar-m-hp').style.width = (this.m.hp / this.m.mx * 100) + "%";
        
        document.getElementById('eq-weapon').innerText = eq.weapon ? eq.weapon.name : '無';
        document.getElementById('eq-body').innerText = eq.body ? eq.body.name : '無';
    }

    // 其餘工具方法保持不變... (renderBag, pop, switchTab, log, quickMelt, getQColor, save)
    renderBag() {
        const list = document.getElementById('bag-list');
        list.innerHTML = this.state.bag.map(i => `
            <div class="item-card quality-${i.q}">
                <div style="display:flex; justify-content:space-between;">
                    <b>${i.name}</b>
                    <span>${i.type === 'weapon' ? 'ATK' : 'HP'} +${i.val}</span>
                </div>
                <div class="btn-group">
                    <button class="btn-small" onclick="game.equip(${i.id})">穿戴</button>
                    <button class="btn-small" onclick="game.melt(${i.id})">熔煉</button>
                </div>
            </div>
        `).join('');
        document.getElementById('bag-count').innerText = this.state.bag.length;
    }
    pop(dmg, crit, x, y) {
        const d = document.createElement('div');
        d.className = 'dmg';
        d.innerText = (crit ? '💥 ' : '') + dmg;
        d.style.color = crit ? 'var(--gold)' : (dmg === "閃避" ? 'var(--info)' : '#fff');
        d.style.left = (x || 200) + 'px'; d.style.top = (y || 300) + 'px';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 600);
    }
    melt(id) {
        const idx = this.state.bag.findIndex(i => i.id === id);
        this.state.p.xp += Math.floor(this.state.bag[idx].val * 2);
        this.state.bag.splice(idx, 1);
        this.update(); this.renderBag();
    }
    quickMelt() {
        this.state.bag = this.state.bag.filter(i => {
            if (i.q <= 1) { this.state.p.xp += Math.floor(i.val * 2); return false; }
            return true;
        });
        this.update(); this.renderBag();
    }
    toggleAuto() {
        this.rt.auto = !this.rt.auto;
        document.getElementById('btn-auto').innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`;
        document.getElementById('btn-auto').style.background = this.rt.auto ? "var(--success)" : "#30363d";
    }
    switchTab(tab, el) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('p-' + tab).style.display = 'flex';
        el.classList.add('active');
        if (tab === 'bag') this.renderBag();
    }
    log(m, c) {
        const b = document.getElementById('log');
        const d = document.createElement('div');
        d.style.color = c || 'inherit';
        d.innerHTML = `<span style="color:#555">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`;
        b.prepend(d);
        if (b.children.length > 20) b.lastChild.remove();
    }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_V040', JSON.stringify(this.state)); }
}

const game = new XianXiaGame();
