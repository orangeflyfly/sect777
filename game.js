/**
 * 仙俠宗門 V0.8.5 - 終極核心引擎
 */

class XianXiaGame {
    constructor() {
        // 使用新版本存檔標籤，防止舊數據衝突
        const saved = JSON.parse(localStorage.getItem('XX_SAVE_V085'));
        this.state = saved || {
            p: { lv: 1, xp: 0, nx: 100, pts: 0, str: 5, vit: 5, agi: 5, int: 5, job: null, money: 0, maxBag: 20, bagBuyCount: 0 },
            bag: [], 
            eq: { weapon: null, body: null },
            curMap: "area1", 
            mapProgress: { area1: 0, area2: 0, area3: 0 }, 
            unlockedMaps: ["area1"],
            materials: {}, // 存儲素材 { "野豬獠牙": 10 }
            scrolls: {},    // 存儲殘卷 { "s1": 3 }
            skills: [],     // 已習得技能 ID 清單
            equippedSkills: [null, null, null] // 裝配中的技能
        };
        this.rt = { auto: false, lastAuto: 0, skillCDs: {}, lastRegen: Date.now(), isBoss: false };
        this.m = { n: "小妖", hp: 50, mx: 50, exp: 20, money: 10 };
        this.realms = ["凡人", "練氣期", "築基期", "金丹期", "元嬰期", "化神期", "煉虛期", "合體期", "大乘期", "渡劫期"];
        
        window.addEventListener('load', () => this.init());
    }

    // 基礎 UI 更新函數
    u(id, val, isStyle = false) {
        const el = document.getElementById(id);
        if (el) { if (isStyle) el.style.width = val; else el.innerText = val; }
    }

    init() {
        this.calc(); 
        this.curHp = this.finalHp;
        this.spawn(); 
        this.update();
        setInterval(() => this.loop(), 100);
        this.log("📜 宗門秘籍 V0.8.5 修正完畢，請宗主查閱。", "var(--gold)");
    }

    // --- 核心計算：屬性透視 ---
    calc() {
        const { p, eq, skills } = this.state;
        let m = { str: 1, vit: 1, agi: 1, int: 1 };
        
        // 流派加成
        if (p.job === 'sword') { m.str = 2.0; m.agi = 2.0; }
        if (p.job === 'body') { m.vit = 2.5; m.str = 1.2; }
        if (p.job === 'soul') { m.int = 2.0; m.agi = 1.5; }

        // 被動技能加成
        let hpMult = 1;
        if (skills.includes('passive_hp')) hpMult = 1.2; // 長生訣加成

        // 裝備與基礎屬性匯總
        this.finalAtk = Math.floor(((p.str * m.str) * 3 + (p.lv * 2) + (eq.weapon ? eq.weapon.val : 0)));
        this.finalHp = Math.floor(((p.vit * m.vit) * 20 + (p.lv * 10) + (eq.body ? eq.body.val : 0)) * hpMult);
        this.hpRegen = (p.vit * m.vit) * 0.5 + (p.lv * 0.2);
        this.spd = 0.5 + ((p.agi * m.agi) * 0.04);
        this.evasion = Math.min(50, (p.agi * m.agi) * 0.4);
        this.crit = Math.min(50, (p.int * m.int) * 0.6);
        this.critDmg = 1.5 + ((p.int * m.int) * 0.01);
    }

    // --- 戰鬥邏輯：受擊與掉落 ---
    atk(isManual) {
        const mCard = document.querySelector('.monster-card');
        if (mCard) { mCard.classList.remove('shake'); void mCard.offsetWidth; mCard.classList.add('shake'); }

        let isC = Math.random() * 100 < this.crit;
        let dmg = Math.floor(this.finalAtk * (isC ? this.critDmg : 1));
        this.m.hp -= dmg;
        this.pop(dmg, isC);

        if (this.m.hp <= 0) {
            this.log(`⚔️ 擊敗 ${this.m.n}，獲靈石 +${this.m.money}`);
            this.state.p.money += this.m.money;
            this.gainXp(this.m.exp);
            this.state.mapProgress[this.state.curMap]++;
            this.drop();
            this.spawn();
        } else if (!isManual || Math.random() < 0.3) {
            this.monsterCounterAtk();
        }
        this.update();
    }

    monsterCounterAtk() {
        if (Math.random() * 100 < this.evasion) { this.pop("閃避", false); return; }
        this.curHp -= Math.floor(this.m.mx * 0.05);
        if (this.curHp <= 0) {
            this.curHp = Math.floor(this.finalHp * 0.2); 
            this.rt.auto = false;
            this.log("💀 體力不支，回山門休養。", "var(--danger)");
            this.u('btn-auto', "自動歷練: OFF");
        }
    }

    // --- 掉落：特定地點邏輯 ---
    drop() {
        const map = MAP_DATA[this.state.curMap];
        
        // 1. 掉落特定素材 (50% 機率)
        if (Math.random() < 0.5) {
            const mat = map.materials[Math.floor(Math.random() * map.materials.length)];
            this.state.materials[mat] = (this.state.materials[mat] || 0) + 1;
            this.log(`☘️ 獲得：${mat}`);
        }

        // 2. 掉落特定殘卷 (10% 機率)
        if (map.scroll && Math.random() < 0.10) {
            const sid = map.scroll.id;
            this.state.scrolls[sid] = (this.state.scrolls[sid] || 0) + 1;
            this.log(`📜 獲得：${map.scroll.name}`, "var(--info)");
        }

        // 3. 掉落裝備 (20% 機率)
        if (Math.random() < 0.20 || this.rt.isBoss) {
            const r = Math.random();
            let q = this.rt.isBoss ? (r < 0.3 ? 4 : 3) : (r < 0.01 ? 4 : r < 0.05 ? 3 : r < 0.15 ? 2 : r < 0.4 ? 1 : 0);
            const type = Math.random() < 0.5 ? 'weapon' : 'body';
            const aT = Object.keys(AFFIX_DATA)[Math.floor(Math.random()*4)];
            const qP = [["凡塵的", "生鏽的"], ["精鋼的", "斷裂的·"], ["赤霄", "沉淵"], ["九幽", "戮仙"], ["太初·", "萬劫·"]];
            
            const item = { 
                id: Date.now(), type, q, 
                val: Math.floor((5 + this.state.p.lv * 3) * (q+1)), 
                affixType: aT, 
                name: `${qP[q][Math.floor(Math.random()*2)]}${AFFIX_DATA[aT].list[Math.floor(Math.random()*10)]}${ITEM_BASE[type][Math.floor(Math.random()*6)]}` 
            };
            if (this.state.bag.length < this.state.p.maxBag) {
                this.state.bag.push(item);
                this.log(`🎁 掉落：${item.name}`, this.getQColor(q));
            }
        }
    }

    // --- 殘卷參透：豪賭邏輯 ---
    learnScroll(sid) {
        const scrollData = Object.values(MAP_DATA).find(m => m.scroll && m.scroll.id === sid).scroll;
        if ((this.state.scrolls[sid] || 0) < 5) return;

        // 成功率計算：50% + 每 10 級加 5%，最高 90%
        let chance = 50 + Math.floor(this.state.p.lv / 10) * 5;
        chance = Math.min(90, chance);

        this.state.scrolls[sid] -= 5; // 消耗 5 張

        if (Math.random() * 100 < chance) {
            this.state.skills.push(scrollData.target);
            this.log(`🔥 福至心靈！成功習得仙法：${SKILL_LIB[scrollData.target].name}`, "var(--gold)");
        } else {
            this.log(`💨 參透失敗，殘卷焚毀，下次努力。`, "#888");
        }
        this.update();
        this.save();
    }

    // --- 介面渲染：同步更新 ---
    update() {
        const { p, eq, scrolls, skills, equippedSkills } = this.state;
        
        // 1. 詳細屬性面板
        const detailEl = document.getElementById('detail-stats');
        if (detailEl) {
            detailEl.innerHTML = `
                <div class="stat-item">⚔️ 攻擊: <b>${this.finalAtk}</b></div>
                <div class="stat-item">🎯 暴擊: <b>${this.crit.toFixed(1)}%</b></div>
                <div class="stat-item">❤️ 生命: <b>${this.finalHp}</b></div>
                <div class="stat-item">🌿 回復: <b>${this.hpRegen.toFixed(1)}/s</b></div>
                <div class="stat-item">⚡ 攻速: <b>${this.spd.toFixed(1)}</b></div>
                <div class="stat-item">💨 閃避: <b>${this.evasion.toFixed(1)}%</b></div>
            `;
        }

        // 2. 殘卷收集進度 (寶庫分頁)
        const scrollEl = document.getElementById('scroll-collection');
        if (scrollEl) {
            scrollEl.innerHTML = Object.values(MAP_DATA).filter(m => m.scroll).map(m => {
                const count = scrolls[m.scroll.id] || 0;
                const learned = skills.includes(m.scroll.target);
                let chance = 50 + Math.floor(this.state.p.lv / 10) * 5;
                return `<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b style="color:var(--info)">${m.scroll.name}</b><br>
                        <small>進度: ${count}/5 (成功率: ${Math.min(90, chance)}%)</small>
                    </div>
                    ${learned ? '<span style="color:var(--success)">已參透</span>' : `<button onclick="_X_CORE.learnScroll('${m.scroll.id}')" ${count<5?'disabled':''}>參透</button>`}
                </div>`;
            }).join('');
        }

        // 3. 技能裝配顯示
        const slotEls = document.querySelectorAll('.slot');
        equippedSkills.forEach((sid, i) => {
            if (slotEls[i]) {
                if (sid) {
                    slotEls[i].innerText = SKILL_LIB[sid].name;
                    slotEls[i].classList.add('active');
                } else {
                    slotEls[i].innerText = "空";
                    slotEls[i].classList.remove('active');
                }
            }
        });

        // 4. 戰鬥技能按鈕 (動態生成)
        const bar = document.getElementById('skill-bar');
        if (bar) {
            bar.innerHTML = equippedSkills.filter(s => s !== null && SKILL_LIB[s].type === 'active').map(sid => `
                <button onclick="_X_CORE.useSkill('${sid}')" style="min-width:70px;">
                    ${SKILL_LIB[sid].name}
                    <div id="cd-${sid}" style="height:2px; background:var(--gold); width:0%;"></div>
                </button>
            `).join('');
        }

        // 基礎數值更新
        this.u('val-realm', this.realms[Math.min(Math.floor((p.lv-1)/10), 9)]);
        this.u('val-money', p.money); 
        this.u('val-lv', p.lv);
        this.u('val-power', Math.floor(this.finalAtk * 4 + this.finalHp / 2));
        this.u('eq-weapon', eq.weapon ? eq.weapon.name : '無');
        this.u('eq-body', eq.body ? eq.body.name : '無');
        this.u('val-hp-txt', `${Math.floor(this.curHp)} / ${this.finalHp}`);
        this.u('bar-p-hp', (this.curHp / this.finalHp * 100) + "%", true);
        this.u('bar-xp', (p.xp / p.nx * 100) + "%", true);
        this.u('val-xp', Math.floor(p.xp)); 
        this.u('val-next-xp', p.nx);
        this.u('val-pts', p.pts);
        this.u('bag-count', this.state.bag.length);
        this.u('val-bag-max', p.maxBag);
        this.u('val-bag-price', 1000 * Math.pow(2, p.bagBuyCount));
        this.u('val-map-name', `📍 ${MAP_DATA[this.state.curMap].name}`);
        this.u('m-hp-txt', `${Math.floor(this.m.hp)} / ${this.m.mx}`);
        this.u('bar-m-hp', (this.m.hp / this.m.mx * 100) + "%", true);
    }

    // --- 技能裝配彈窗邏輯 ---
    showSkillPick(slotIdx) {
        this.currentPickingSlot = slotIdx;
        const list = document.getElementById('available-skills-list');
        list.innerHTML = this.state.skills.map(sid => `
            <div style="display:flex; justify-content:space-between; background:#111; padding:10px; margin-bottom:5px;">
                <span>${SKILL_LIB[sid].name} <small>(${SKILL_LIB[sid].desc})</small></span>
                <button onclick="_X_CORE.pickSkill('${sid}')">裝配</button>
            </div>
        `).join('') || "目前尚無習得仙法。";
        document.getElementById('skill-modal').style.display = 'flex';
    }

    pickSkill(sid) {
        // 防止重複裝備同一技能
        if (this.state.equippedSkills.includes(sid)) {
            const oldIdx = this.state.equippedSkills.indexOf(sid);
            this.state.equippedSkills[oldIdx] = null;
        }
        this.state.equippedSkills[this.currentPickingSlot] = sid;
        document.getElementById('skill-modal').style.display = 'none';
        this.update(); this.save();
    }

    useSkill(sid) {
        if (this.rt.skillCDs[sid]) return; // CD 中

        const skill = SKILL_LIB[sid];
        if (sid === 'active_drain') {
            this.atk(true); // 觸發一次攻擊
            this.curHp = Math.min(this.finalHp, this.curHp + (this.finalAtk * 0.5)); // 吸血
            this.log(`🩸 施展嗜血術，回復生命！`);
        } else if (sid === 'active_aoe') {
            this.atk(true); // 爆發傷害
            this.m.hp -= this.finalAtk * 4;
            this.log(`🔥 焚天一怒，驚天動地！`);
        }

        this.rt.skillCDs[sid] = true;
        this.update();
        setTimeout(() => { 
            this.rt.skillCDs[sid] = false; 
            this.log(`✨ 仙法 ${skill.name} 冷卻完畢。`);
        }, skill.cd);
    }

    // --- 其他基礎功能 (不變或微調) ---
    loop() {
        const now = Date.now();
        if (now - this.rt.lastRegen >= 1000) {
            if (this.curHp < this.finalHp) { this.curHp = Math.min(this.finalHp, this.curHp + this.hpRegen); this.update(); }
            this.rt.lastRegen = now;
        }
        if (this.rt.auto && now - this.rt.lastAuto >= (1000 / this.spd)) { this.atk(false); this.rt.lastAuto = now; }
    }

    spawn() {
        const map = MAP_DATA[this.state.curMap];
        const pLv = this.state.p.lv;
        const kills = this.state.mapProgress[this.state.curMap] || 0;
        this.rt.isBoss = (kills > 0 && kills % 30 === 0);
        if (this.rt.isBoss) {
            const b = map.boss;
            this.m = { n: `【首領】${b.n}`, mx: Math.floor(100 * Math.pow(1.3, pLv-1) * b.hpMult), exp: Math.floor((20+pLv*5)*b.expMult), money: Math.floor((10+pLv*2)*b.goldMult) };
        } else {
            this.m = { n: map.monsters[Math.floor(Math.random()*map.monsters.length)], mx: Math.floor(50 * Math.pow(1.25, pLv-1)), exp: 20+pLv*5, money: 10+pLv*2 };
        }
        this.m.hp = this.m.mx; this.u('m-name', this.m.n); this.update();
    }

    gainXp(a) { 
        this.state.p.xp += a; 
        while (this.state.p.xp >= this.state.p.nx) { 
            this.state.p.lv++; this.state.p.xp -= this.state.p.nx; 
            this.state.p.nx = Math.floor(this.state.p.nx * 1.5); this.state.p.pts += 5; 
            this.calc(); this.log(`🎊 突破至 LV.${this.state.p.lv}`, "var(--gold)");
        } 
    }
    manualAtk(e) { this.atk(true); }
    toggleAuto() { this.rt.auto = !this.rt.auto; document.getElementById('btn-auto').innerText = `自動歷練: ${this.rt.auto ? 'ON' : 'OFF'}`; }
    addStat(k) { if (this.state.p.pts > 0) { this.state.p.pts--; this.state.p[k]++; this.calc(); this.renderStats(); this.update(); this.save(); } }
    switchTab(t, el) { 
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none'); 
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); 
        document.getElementById('p-' + t).style.display = 'flex'; el.classList.add('active'); 
        if (t === 'bag') this.renderBag(); if (t === 'stats') this.renderStats(); if (t === 'shop') this.update();
    }
    renderStats() {
        const m = { str: '力量', vit: '體質', agi: '敏捷', int: '靈力' };
        document.getElementById('stat-list').innerHTML = Object.entries(m).map(([k, n]) => `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>${n}: <b>${this.state.p[k]}</b></span><button onclick="_X_CORE.addStat('${k}')">+</button></div>`).join('');
    }
    renderBag() {
        // 先顯示材料
        let html = '<div style="width:100%; color:var(--info); margin-bottom:5px;">💎 材料與殘卷</div><div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:15px;">';
        for (let mName in this.state.materials) {
            html += `<div class="item-card" style="padding:5px 10px; width:auto;">${mName} x${this.state.materials[mName]} <button onclick="_X_CORE.sellMat('${mName}')" style="padding:2px; font-size:10px;">賣</button></div>`;
        }
        html += '</div><div style="width:100%; color:var(--gold); margin-bottom:5px;">🛡️ 裝備</div>';
        // 再顯示裝備
        html += `<div class="bag-grid">${this.state.bag.map(i => `<div class="item-card quality-${i.q}"><button class="btn-single-melt" onclick="_X_CORE.meltItem(${i.id})">熔</button><b style="color:${this.getQColor(i.q)}">${i.name}</b><div style="font-size:10px;margin-top:5px;">${AFFIX_DATA[i.affixType].bonus} +${i.val}</div><button onclick="_X_CORE.equip(${i.id})" style="width:100%;margin-top:5px;">穿戴</button></div>`).join('')}</div>`;
        document.getElementById('bag-list').innerHTML = html;
    }
    sellMat(mName) { this.state.p.money += this.state.materials[mName] * 20; delete this.state.materials[mName]; this.renderBag(); this.update(); this.save(); }
    meltItem(id) { const idx = this.state.bag.findIndex(i => i.id === Number(id)); if (idx !== -1) { this.state.p.xp += this.state.bag[idx].val * 2; this.state.bag.splice(idx, 1); this.gainXp(0); this.renderBag(); this.update(); this.save(); } }
    quickMelt() { const fl = parseInt(document.getElementById('melt-filter').value); this.state.bag = this.state.bag.filter(i => { if (i.q <= fl) { this.state.p.xp += i.val; return false; } return true; }); this.gainXp(0); this.update(); this.renderBag(); this.save(); }
    equip(id) { const idx = this.state.bag.findIndex(i => i.id === Number(id)); if (idx !== -1) { const item = this.state.bag[idx]; if (this.state.eq[item.type]) this.state.bag.push(this.state.eq[item.type]); this.state.eq[item.type] = item; this.state.bag.splice(idx, 1); this.calc(); this.update(); this.renderBag(); this.save(); } }
    unequip(type) { if (this.state.eq[type] && this.state.bag.length < this.state.p.maxBag) { this.state.bag.push(this.state.eq[type]); this.state.eq[type] = null; this.calc(); this.update(); this.renderBag(); this.save(); } }
    showMapModal() { document.getElementById('map-list').innerHTML = Object.values(MAP_DATA).map(m => { const u = this.state.unlockedMaps.includes(m.id); return `<div style="margin-bottom:10px; opacity:${u?1:0.5}"><b>${m.name}</b> ${u?`<button onclick="_X_CORE.changeMap('${m.id}')">前往</button>`:`🔒`}</div>`; }).join(''); document.getElementById('map-modal').style.display = 'flex'; }
    changeMap(id) { this.state.curMap = id; document.getElementById('map-modal').style.display = 'none'; this.spawn(); this.save(); }
    unlockNext() { const ids = Object.keys(MAP_DATA); const idx = ids.indexOf(this.state.curMap); if (idx < ids.length-1 && !this.state.unlockedMaps.includes(ids[idx+1])) this.state.unlockedMaps.push(ids[idx+1]); }
    showClassModal() { document.getElementById('class-modal').style.display = 'flex'; }
    chooseClass(j) { this.state.p.job = j; document.getElementById('class-modal').style.display = 'none'; this.calc(); this.update(); this.save(); }
    buyBag() { const price = 1000 * Math.pow(2, this.state.p.bagBuyCount); if (this.state.p.money >= price) { this.state.p.money -= price; this.state.p.maxBag += 5; this.state.p.bagBuyCount++; this.update(); this.save(); } }
    respec() { if (confirm("散功重修，將返還所有屬性點，是否繼續？")) { const p = this.state.p; p.pts += (p.str-5)+(p.vit-5)+(p.agi-5)+(p.int-5); p.str=5; p.vit=5; p.agi=5; p.int=5; this.calc(); this.update(); this.renderStats(); this.save(); } }
    pop(d, c) { const e = document.createElement('div'); e.className = c ? 'dmg' : 'dmg'; e.style.color = c ? 'var(--gold)' : '#fff'; e.innerText = (c ? '💥 ' : '') + d; e.style.left = (Math.random()*100+100) + 'px'; e.style.top = '250px'; document.body.appendChild(e); setTimeout(() => e.remove(), 600); }
    log(m, c) { const b = document.getElementById('log'); if (b) { const d = document.createElement('div'); d.style.color = c || "#fff"; d.innerHTML = `<span style="color:#888;font-size:10px;">[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}]</span> ${m}`; b.prepend(d); if (b.children.length > 25) b.lastChild.remove(); } }
    getQColor(q) { return ["#8b949e", "#3fb950", "#58a6ff", "#a371f7", "#f1e05a"][q]; }
    save() { localStorage.setItem('XX_SAVE_V085', JSON.stringify(this.state)); }
}

window._X_CORE = new XianXiaGame();
