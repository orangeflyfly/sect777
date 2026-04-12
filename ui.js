/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js)
 */
class UIManager {
    constructor(core) { 
        this.core = core; 
        this.tab = 'all'; 
    }

    // 1. 更新血量與數值 (修復了怪物消失時的顯示)
    updateHPs(p, m) {
        // 玩家部分
        const pBar = document.getElementById('p-hp-bar');
        const pTxt = document.getElementById('p-hp-txt');
        if (pBar && pTxt) {
            pBar.style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
            pTxt.innerText = `${Math.floor(p.battle.hp)} / ${Math.floor(p.battle.maxHp)}`;
        }

        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;

        // 怪物部分
        const mName = document.getElementById('monster-name');
        const mBar = document.getElementById('m-hp-bar');
        const mTxt = document.getElementById('m-hp-txt');

        if (m && m.hp > 0) {
            mBar.style.width = (m.hp / m.maxHp * 100) + "%";
            mTxt.innerText = `${Math.floor(m.hp)} / ${Math.floor(m.maxHp)}`;
            mName.innerText = m.name;
        } else {
            mBar.style.width = "0%";
            mTxt.innerText = "0 / 0";
            mName.innerText = "尋找對手中...";
        }
    }

    renderMonster(m) { 
        document.getElementById('monster-pic').innerText = m ? m.pic : "⏳"; 
    }

    toast(msg, color = 'gold') {
        const div = document.createElement('div'); 
        div.className = 'toast'; 
        div.style.color = color; 
        div.innerText = msg;
        document.getElementById('toast-container').appendChild(div); 
        setTimeout(() => div.remove(), 1500);
    }

    log(msg, type = 'system', color = '#eee') {
        const list = document.getElementById('log-list'); 
        const div = document.createElement('div');
        div.className = `log-item log-type-${type}`; 
        div.style.color = color;
        div.innerHTML = `[${new Date().toLocaleTimeString([], {hour12:false})}] ${msg}`;
        
        if (this.tab !== 'all' && this.tab !== type) div.style.display = 'none';
        list.prepend(div); 
        if (list.children.length > 50) list.lastChild.remove();
    }

    // 2. 修復：分頁標籤點擊後會正確發亮
    switchLog(tab) {
        this.tab = tab;
        // 先去掉所有標籤的亮光
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(t => t.classList.remove('active'));
        
        // 讓點擊的那個標籤亮起來 (根據文字判定)
        const tabNames = { all: '全部', combat: '戰鬥', loot: '獲取', exp: '修為' };
        tabs.forEach(t => {
            if (t.innerText === tabNames[tab]) t.classList.add('active');
        });

        const items = document.getElementById('log-list').children;
        for (let i of items) {
            i.style.display = (tab === 'all' || i.classList.contains(`log-type-${tab}`)) ? 'block' : 'none';
        }
    }

    switchPage(id) {
        document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
        document.getElementById(`p-${id}`).style.display = 'flex'; 
        this.renderAll();
    }

    renderAll() {
        const p = this.core.player;
        const rarityName = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv/10))].n;
        document.getElementById('val-level').innerText = `境界：${rarityName} (Lv.${p.data.lv})`;
        document.getElementById('val-money').innerText = `🪙 ${p.data.money}`;
        document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
        this.renderBag(p); 
        this.renderStats(p); 
        this.renderMaps(p);
    }

    renderBag(p) {
        const grid = document.getElementById('bag-grid'); 
        grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        p.data.bag.forEach((item, i) => {
            const slot = document.createElement('div'); 
            slot.className = `item-slot rarity-${item.rarity || 0}`;
            slot.innerText = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            slot.onclick = () => this.core.inventory.equip(i); 
            grid.appendChild(slot);
        });
    }

    renderMaps(p) {
        const list = document.getElementById('map-list'); 
        list.innerHTML = '';
        GAME_DATA.MAPS.forEach(m => {
            const btn = document.createElement('button'); 
            btn.innerText = `${m.name} (建議 Lv.${m.lv})`;
            btn.style.margin = "5px";
            btn.style.color = p.data.mapId === m.id ? "gold" : "white";
            btn.onclick = () => { 
                p.data.mapId = m.id; 
                this.toast(`前往：${m.name}`); 
                this.renderAll(); 
            };
            list.appendChild(btn);
        });
    }

    // 3. 修復：內部的加點按鈕指向更穩定的 this.core
    renderStats(p) {
        document.getElementById('val-pts').innerText = p.data.pts;
        const list = document.getElementById('stat-list'); 
        list.innerHTML = '';
        const names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        
        Object.entries(p.data.baseStats).forEach(([k, v]) => {
            const div = document.createElement('div'); 
            div.style.padding = "5px 0";
            div.innerHTML = `${names[k]}: <b>${v}</b> <button onclick="_X_CORE.addStat('${k}')">＋</button>`;
            list.appendChild(div);
        });

        const weaponName = p.data.equips.weapon ? p.data.equips.weapon.name : '空';
        const bodyName = p.data.equips.body ? p.data.equips.body.name : '空';
        
        document.getElementById('equipment-slots').innerHTML = `
            <div style="padding:10px; background:#222; border-radius:5px;">
                武器: <span style="color:var(--gold)" onclick="_X_CORE.inventory.unequip('weapon')">${weaponName}</span> | 
                法衣: <span style="color:var(--gold)" onclick="_X_CORE.inventory.unequip('body')">${bodyName}</span>
            </div>
        `;
    }
}
