/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js)
 */

class UIManager {
    constructor() {
        this.currentLogTab = 'all';
    }

    // 基礎 UI 更新 (血量、經驗、等級)
    updateHPs(p, m) {
        // 玩家血條
        const pPerc = (p.battle.hp / p.battle.maxHp) * 100;
        document.getElementById('p-hp-bar').style.width = pPerc + "%";
        document.getElementById('p-hp-txt').innerText = `${Math.floor(p.battle.hp)} / ${Math.floor(p.battle.maxHp)}`;
        
        // 快捷屬性
        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;

        // 怪物血條
        if (m) {
            const mPerc = (m.hp / m.maxHp) * 100;
            document.getElementById('m-hp-bar').style.width = mPerc + "%";
            document.getElementById('m-hp-txt').innerText = `${Math.floor(m.hp)} / ${Math.floor(m.maxHp)}`;
            document.getElementById('monster-name').innerText = m.name;
        } else {
            document.getElementById('m-hp-bar').style.width = "0%";
            document.getElementById('m-hp-txt').innerText = "尋找對手中...";
            document.getElementById('monster-name').innerText = "歷練中...";
        }
    }

    // 渲染怪物圖片
    renderMonster(m) {
        document.getElementById('monster-pic').innerText = m.pic;
    }

    // 全域彈窗特效 (Toast)
    toast(msg, color = 'gold') {
        const container = document.getElementById('toast-container');
        const div = document.createElement('div');
        div.className = 'toast';
        div.style.borderColor = color;
        div.style.color = color;
        div.innerText = msg;
        container.appendChild(div);
        setTimeout(() => div.remove(), 1500);
    }

    // 日誌系統：支持分類
    log(msg, type = 'system', color = '#eee') {
        const list = document.getElementById('log-list');
        const div = document.createElement('div');
        div.className = `log-item log-type-${type}`;
        div.style.color = color;
        div.innerHTML = `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`;
        
        // 如果不是當前分頁且不是 'all'，則隱藏
        if (this.currentLogTab !== 'all' && this.currentLogTab !== type) {
            div.style.display = 'none';
        }
        
        list.prepend(div);
        // 限制日誌數量防止卡頓
        if (list.children.length > 50) list.lastChild.remove();
    }

    // 切換日誌分頁
    switchLog(tab) {
        this.currentLogTab = tab;
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        const items = document.getElementById('log-list').children;
        for (let item of items) {
            if (tab === 'all') {
                item.style.display = 'block';
            } else {
                item.style.display = item.classList.contains(`log-type-${tab}`) ? 'block' : 'none';
            }
        }
    }

    // 切換主頁面
    switchPage(pageId) {
        const stages = document.querySelectorAll('.stage');
        stages.forEach(s => s.style.display = 'none');
        document.getElementById(`p-${pageId}`).style.display = 'flex';
        this.renderAll();
    }

    // 總渲染 (根據當前頁面刷新內容)
    renderAll() {
        const p = _X_CORE.player;
        // 更新頂部
        document.getElementById('val-level').innerText = `境界：${GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv/10))].n} (Lv.${p.data.lv})`;
        document.getElementById('val-money').innerText = `🪙 ${p.data.money}`;
        const expPerc = (p.data.exp / (p.data.lv * 100)) * 100;
        document.getElementById('val-exp-bar').style.width = expPerc + "%";

        // 渲染儲物袋
        this.renderBag(p);
        // 渲染地圖
        this.renderMaps(p);
        // 渲染屬性
        this.renderStats(p);
    }

    renderBag(p) {
        const grid = document.getElementById('bag-grid');
        grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        p.data.bag.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = `item-slot rarity-${item.rarity || 0}`;
            slot.innerText = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            slot.onclick = () => _X_CORE.inventory.equip(index);
            grid.appendChild(slot);
        });
    }

    renderMaps(p) {
        const list = document.getElementById('map-list');
        list.innerHTML = '';
        GAME_DATA.MAPS.forEach(map => {
            const btn = document.createElement('button');
            btn.className = 'map-item';
            btn.style.padding = "10px";
            btn.style.margin = "5px 0";
            btn.style.background = p.data.mapId === map.id ? "#333" : "#222";
            btn.style.color = p.data.mapId === map.id ? "gold" : "white";
            btn.innerText = `${map.name} (建議等級：${map.lv})`;
            btn.onclick = () => {
                p.data.mapId = map.id;
                this.toast(`前往歷練：${map.name}`);
                this.renderAll();
            };
            list.appendChild(btn);
        });
    }

    renderStats(p) {
        // 顯示剩餘點數
        document.getElementById('val-pts').innerText = p.data.pts;
        
        // 渲染加點按鈕
        const statList = document.getElementById('stat-list');
        statList.innerHTML = '';
        const statNames = { str: '力量 (攻擊)', vit: '體質 (生命/防禦)', agi: '身法 (速度/閃避)', int: '悟性 (經驗)' };
        
        for (let [key, val] of Object.entries(p.data.baseStats)) {
            const div = document.createElement('div');
            div.style.margin = "8px 0";
            div.innerHTML = `
                ${statNames[key]}: <b>${val}</b> 
                <button onclick="_X_CORE.addStat('${key}')" style="margin-left:10px;">＋</button>
            `;
            statList.appendChild(div);
        }

        // 渲染裝備位
        const eqArea = document.getElementById('equipment-slots');
        eqArea.innerHTML = `
            <div style="display:flex; justify-content:space-around;">
                <div onclick="_X_CORE.inventory.unequip('weapon')" style="cursor:pointer">⚔️ 武器: ${p.data.equips.weapon ? p.data.equips.weapon.name : '空'}</div>
                <div onclick="_X_CORE.inventory.unequip('body')" style="cursor:pointer">🛡️ 法衣: ${p.data.equips.body ? p.data.equips.body.name : '空'}</div>
            </div>
        `;
    }
}

console.log("[系統] 傳音幻鏡 (ui.js) 已就緒");
