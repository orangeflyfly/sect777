class UIManager {
    constructor(core) { 
        this.core = core; 
        this.tab = 'all'; 
    }

    // 彈窗控制
    showModal(title, body, actionText, actionFn, meltFn) {
        document.getElementById('item-modal').style.display = 'flex';
        document.getElementById('modal-item-name').innerHTML = title;
        document.getElementById('modal-item-desc').innerHTML = body;
        var actBtn = document.getElementById('modal-action-btn');
        var meltBtn = document.getElementById('modal-melt-btn');
        
        actBtn.innerText = actionText;
        actBtn.onclick = () => { actionFn(); this.closeModal(); };
        
        if (meltFn) {
            meltBtn.style.display = 'inline-block';
            meltBtn.onclick = () => { meltFn(); this.closeModal(); };
        } else {
            meltBtn.style.display = 'none';
        }
    }

    closeModal() { document.getElementById('item-modal').style.display = 'none'; }

    updateHPs(p, m) {
        document.getElementById('p-hp-bar').style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
        document.getElementById('p-hp-txt').innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;
        if (m) {
            document.getElementById('m-hp-bar').style.width = (m.hp / m.maxHp * 100) + "%";
            document.getElementById('m-hp-txt').innerText = Math.floor(m.hp) + " / " + Math.floor(m.maxHp);
            document.getElementById('monster-name').innerText = m.name;
        } else {
            document.getElementById('m-hp-bar').style.width = "0%";
            document.getElementById('m-hp-txt').innerText = "搜尋中...";
            document.getElementById('monster-name').innerText = "歷練中...";
        }
    }

    renderMonster(m) { document.getElementById('monster-pic').innerText = m ? m.pic : "⏳"; }

    toast(msg, color = 'gold') {
        var div = document.createElement('div');
        div.className = 'toast'; div.style.color = color; div.innerText = msg;
        document.getElementById('toast-container').appendChild(div);
        setTimeout(() => div.remove(), 1500);
    }

    log(msg, type = 'system', color = '#eee') {
        var list = document.getElementById('log-list');
        var div = document.createElement('div');
        div.className = "log-item log-type-" + type; div.style.color = color;
        div.innerHTML = "[" + new Date().toLocaleTimeString([], { hour12: false }) + "] " + msg;
        if (this.tab !== 'all' && this.tab !== type) div.style.display = 'none';
        list.prepend(div);
        if (list.children.length > 50) list.lastChild.remove();
    }

    switchLog(tab) {
        this.tab = tab;
        document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
        const items = document.getElementById('log-list').children;
        for (var i = 0; i < items.length; i++) {
            items[i].style.display = (tab === 'all' || items[i].classList.contains("log-type-" + tab)) ? 'block' : 'none';
        }
    }

    switchPage(id) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.getElementById("p-" + id).style.display = 'flex';
        this.renderAll();
    }

    renderAll() {
        var p = this.core.player;
        document.getElementById('val-level').innerText = "境界：" + GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))].n + " (Lv." + p.data.lv + ")";
        document.getElementById('val-money').innerText = "🪙 " + p.data.money;
        document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
        this.renderMapDropdown(p);
        this.renderActiveSkills(p);
        this.renderBag(p);
        this.renderDetailedStats(p);
        this.renderStats(p);
    }

    renderMapDropdown(p) {
        var select = document.getElementById('map-select-dropdown');
        if (select.children.length > 0) return;
        GAME_DATA.MAPS.forEach(m => {
            var opt = document.createElement('option');
            opt.value = m.id; opt.innerText = m.name + " (Lv." + m.lv + ")";
            if (p.data.mapId === m.id) opt.selected = true;
            select.appendChild(opt);
        });
    }

    renderActiveSkills(p) {
        var container = document.getElementById('active-skill-slots');
        container.innerHTML = '';
        p.data.skills.forEach(id => {
            var slot = document.createElement('div');
            slot.className = 'skill-slot-mini' + (id !== null ? ' equipped' : '');
            if (id !== null) slot.innerText = GAME_DATA.SKILLS[id].type === 'passive' ? '🧘' : '🔥';
            container.appendChild(slot);
        });
    }

    renderDetailedStats(p) {
        var list = document.getElementById('detail-stats-list');
        var b = p.battle;
        list.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px;">
                <div>閃避: <span style="color:cyan">${(b.dodge * 100).toFixed(1)}%</span></div>
                <div>吸血: <span style="color:red">${(b.lifeSteal * 100).toFixed(0)}%</span></div>
                <div>回血: <span style="color:green">${(p.data.baseStats.vit * 0.1 + b.regen).toFixed(1)}/s</span></div>
                <div>保底傷害: <span style="color:gold">${(b.dmgFloor * 100).toFixed(1)}%</span></div>
            </div>
        `;
    }

    renderBag(p) {
        var grid = document.getElementById('bag-grid'); grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        p.data.bag.forEach((item, i) => {
            var slot = document.createElement('div');
            slot.className = "item-slot rarity-" + (item.rarity || 0);
            slot.innerText = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            // 點擊觸發詳情彈窗
            slot.onclick = () => this.core.inventory.showItemDetail(i);
            grid.appendChild(slot);
        });
    }

    renderStats(p) {
        document.getElementById('val-pts').innerText = p.data.pts;
        var list = document.getElementById('stat-list'); list.innerHTML = '';
        var names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        for (let [k, v] of Object.entries(p.data.baseStats)) {
            var div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `${names[k]}: <b>${v}</b> <button class="add-btn" onclick="_X_CORE.addStat('${k}')">＋</button>`;
            list.appendChild(div);
        }
        
        // 裝備展示區
        var eqArea = document.getElementById('equipment-slots');
        eqArea.innerHTML = '';
        ['weapon', 'body'].forEach(type => {
            var eq = p.data.equips[type];
            var btn = document.createElement('div');
            btn.className = 'item-slot ' + (eq ? 'rarity-'+eq.rarity : '');
            btn.style.width = '100%'; btn.style.fontSize = '12px'; btn.style.marginBottom = '5px';
            btn.innerHTML = (type==='weapon'?'⚔️':'🛡️') + (eq ? eq.name : '空');
            btn.onclick = () => eq && this.core.inventory.showItemDetail(type, true);
            eqArea.appendChild(btn);
        });

        // 技能管理列表
        this.renderSkillList(p);
    }

    renderSkillList(p) {
        var list = document.getElementById('stat-list');
        var div = document.createElement('div');
        div.innerHTML = "<hr><h5>已學功法</h5>";
        p.data.learnedSkills.forEach(id => {
            var s = GAME_DATA.SKILLS[id];
            var isEq = p.data.skills.includes(id);
            var btn = document.createElement('button');
            btn.style.margin = "2px"; btn.style.background = isEq ? "gold" : "#333";
            btn.innerText = s.name + (isEq ? "[卸下]" : "[裝配]");
            btn.onclick = () => {
                if(isEq) p.data.skills[p.data.skills.indexOf(id)] = null;
                else {
                    var empty = p.data.skills.indexOf(null);
                    if(empty !== -1) p.data.skills[empty] = id;
                    else this.toast("格子已滿", "red");
                }
                p.refresh(); p.save(); this.renderAll();
            };
            div.appendChild(btn);
        });
        list.appendChild(div);
    }
}
