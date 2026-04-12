class UIManager {
    constructor(core) {
        this.core = core;
        this.tab = 'all';
    }

    // 更新血條與基本數值
    updateHPs(p, m) {
        document.getElementById('p-hp-bar').style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
        document.getElementById('p-hp-txt').innerText = `${Math.floor(p.battle.hp)} / ${Math.floor(p.battle.maxHp)}`;
        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;
        
        const mName = document.getElementById('monster-name');
        const mBar = document.getElementById('m-hp-bar');
        const mTxt = document.getElementById('m-hp-txt');
        if (m) {
            mBar.style.width = (m.hp / m.maxHp * 100) + "%";
            mTxt.innerText = `${Math.floor(m.hp)} / ${Math.floor(m.maxHp)}`;
            mName.innerText = m.name;
        } else {
            mBar.style.width = "0%";
            mTxt.innerText = "搜尋中...";
            mName.innerText = "歷練中...";
        }
    }

    renderMonster(m) { document.getElementById('monster-pic').innerText = m ? m.pic : "⏳"; }

    toast(msg, color = 'gold') {
        const div = document.createElement('div');
        div.className = 'toast'; div.style.color = color; div.innerText = msg;
        document.getElementById('toast-container').appendChild(div);
        setTimeout(() => div.remove(), 1500);
    }

    log(msg, type = 'system', color = '#eee') {
        const list = document.getElementById('log-list');
        const div = document.createElement('div');
        div.className = `log-item log-type-${type}`;
        div.style.color = color;
        div.innerHTML = `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg}`;
        if (this.tab !== 'all' && this.tab !== type) div.style.display = 'none';
        list.prepend(div);
        if (list.children.length > 50) list.lastChild.remove();
    }

    switchLog(tab) {
        this.tab = tab;
        document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
        const items = document.getElementById('log-list').children;
        for (let i of items) i.style.display = (tab === 'all' || i.classList.contains(`log-type-${tab}`)) ? 'block' : 'none';
    }

    switchPage(id) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.getElementById(`p-${id}`).style.display = 'flex';
        this.renderAll();
    }

    // 總渲染：補回所有缺失細節
    renderAll() {
        const p = this.core.player;
        document.getElementById('val-level').innerText = `境界：${GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))].n} (Lv.${p.data.lv})`;
        document.getElementById('val-money').innerText = `🪙 ${p.data.money}`;
        document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
        
        this.renderMapDropdown(p);
        this.renderActiveSkills(p);
        this.renderBag(p);
        this.renderDetailedStats(p);
        this.renderStats(p); // 基礎加點
    }

    // 1. 地圖下拉選單 (回歸)
    renderMapDropdown(p) {
        const select = document.getElementById('map-select-dropdown');
        if (select.children.length > 0) return; // 避免重複填充
        GAME_DATA.MAPS.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.innerText = `${m.name} (Lv.${m.lv})`;
            if (p.data.mapId === m.id) opt.selected = true;
            select.appendChild(opt);
        });
    }

    // 2. 戰鬥功法格子 (回歸)
    renderActiveSkills(p) {
        const container = document.getElementById('active-skill-slots');
        container.innerHTML = '';
        p.data.skills.forEach(id => {
            const slot = document.createElement('div');
            slot.className = 'skill-slot-mini' + (id !== null ? ' equipped' : '');
            if (id !== null) {
                const s = GAME_DATA.SKILLS[id];
                slot.innerText = s.type === 'passive' ? '🧘' : '🔥';
                slot.title = s.name;
            }
            container.appendChild(slot);
        });
    }

    // 3. 詳細屬性列表 (回歸)
    renderDetailedStats(p) {
        const list = document.getElementById('detail-stats-list');
        const b = p.battle;
        list.innerHTML = `
            <div class="stat-row"><span>閃避率</span><span class="stat-val">${(b.dodge * 100).toFixed(1)}%</span></div>
            <div class="stat-row"><span>吸血</span><span class="stat-val">${(b.lifeSteal * 100).toFixed(0)}%</span></div>
            <div class="stat-row"><span>秒回血</span><span class="stat-val">${(p.data.baseStats.vit * 0.1 + b.regen).toFixed(1)}</span></div>
            <div class="stat-row"><span>天道保底</span><span class="stat-val">${(b.dmgFloor * 100).toFixed(1)}%</span></div>
        `;
    }

    renderBag(p) {
        const grid = document.getElementById('bag-grid'); grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        p.data.bag.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = `item-slot rarity-${item.rarity || 0}`;
            slot.innerText = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            slot.onclick = () => this.core.inventory.equip(i);
            grid.appendChild(slot);
        });
    }

    renderStats(p) {
        document.getElementById('val-pts').innerText = p.data.pts;
        const list = document.getElementById('stat-list'); list.innerHTML = '';
        const names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        for (let [k, v] of Object.entries(p.data.baseStats)) {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `${names[k]}: <b>${v}</b> <button class="add-btn" onclick="_X_CORE.addStat('${k}')">＋</button>`;
            list.appendChild(div);
        }
        document.getElementById('equipment-slots').innerHTML = `
            <div style="display:flex; gap:10px;">
                <button onclick="_X_CORE.inventory.unequip('weapon')">卸下武器: ${p.data.equips.weapon ? p.data.equips.weapon.name : '空'}</button>
                <button onclick="_X_CORE.inventory.unequip('body')">卸下法衣: ${p.data.equips.body ? p.data.equips.body.name : '空'}</button>
            </div>
        `;
    }
}
