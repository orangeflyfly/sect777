class UIManager {
    constructor(core) { this.core = core; this.tab = 'all'; }
    updateHPs(p, m) {
        document.getElementById('p-hp-bar').style.width = (p.battle.hp/p.battle.maxHp*100) + "%";
        document.getElementById('p-hp-txt').innerText = `${Math.floor(p.battle.hp)} / ${Math.floor(p.battle.maxHp)}`;
        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;
        if (m) {
            document.getElementById('m-hp-bar').style.width = (m.hp/m.maxHp*100) + "%";
            document.getElementById('m-hp-txt').innerText = `${Math.floor(m.hp)} / ${Math.floor(m.maxHp)}`;
            document.getElementById('monster-name').innerText = m.name;
        }
    }
    renderMonster(m) { document.getElementById('monster-pic').innerText = m.pic; }
    toast(msg, color = 'gold') {
        const div = document.createElement('div'); div.className = 'toast'; div.style.color = color; div.innerText = msg;
        document.getElementById('toast-container').appendChild(div); setTimeout(() => div.remove(), 1500);
    }
    log(msg, type = 'system', color = '#eee') {
        const list = document.getElementById('log-list'); const div = document.createElement('div');
        div.className = `log-item log-type-${type}`; div.style.color = color;
        div.innerHTML = `[${new Date().toLocaleTimeString([], {hour12:false})}] ${msg}`;
        if (this.tab !== 'all' && this.tab !== type) div.style.display = 'none';
        list.prepend(div); if (list.children.length > 50) list.lastChild.remove();
    }
    switchLog(tab) {
        this.tab = tab;
        document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
        const items = document.getElementById('log-list').children;
        for (let i of items) i.style.display = (tab === 'all' || i.classList.contains(`log-type-${tab}`)) ? 'block' : 'none';
    }
    switchPage(id) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.getElementById(`p-${id}`).style.display = 'flex'; this.renderAll();
    }
    renderAll() {
        const p = this.core.player;
        document.getElementById('val-level').innerText = `境界：${GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv/10))].n} (Lv.${p.data.lv})`;
        document.getElementById('val-money').innerText = `🪙 ${p.data.money}`;
        document.getElementById('val-exp-bar').style.width = (p.data.exp/(p.data.lv*100)*100) + "%";
        this.renderBag(p); this.renderStats(p); this.renderMaps(p);
    }
    renderBag(p) {
        const grid = document.getElementById('bag-grid'); grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        p.data.bag.forEach((item, i) => {
            const slot = document.createElement('div'); slot.className = `item-slot rarity-${item.rarity||0}`;
            slot.innerText = item.itemType==='equip' ? (item.type==='weapon'?'🗡️':'👕') : '📜';
            slot.onclick = () => this.core.inventory.equip(i); grid.appendChild(slot);
        });
    }
    renderMaps(p) {
        const list = document.getElementById('map-list'); list.innerHTML = '';
        GAME_DATA.MAPS.forEach(m => {
            const btn = document.createElement('button'); btn.innerText = `${m.name} (Lv.${m.lv})`;
            btn.style.color = p.data.mapId === m.id ? "gold" : "white";
            btn.onclick = () => { p.data.mapId = m.id; this.toast(`前往：${m.name}`); this.renderAll(); };
            list.appendChild(btn);
        });
    }
    renderStats(p) {
        document.getElementById('val-pts').innerText = p.data.pts;
        const list = document.getElementById('stat-list'); list.innerHTML = '';
        const names = { str:'力量', vit:'體質', agi:'身法', int:'悟性' };
        for (let [k, v] of Object.entries(p.data.baseStats)) {
            const div = document.createElement('div'); div.innerHTML = `${names[k]}: <b>${v}</b> <button onclick="_X_CORE.addStat('${k}')">＋</button>`;
            list.appendChild(div);
        }
        document.getElementById('equipment-slots').innerHTML = `武器: <span onclick="_X_CORE.inventory.unequip('weapon')">${p.data.equips.weapon?p.data.equips.weapon.name:'空'}</span> | 法衣: <span onclick="_X_CORE.inventory.unequip('body')">${p.data.equips.body?p.data.equips.body.name:'空'}</span>`;
    }
}
