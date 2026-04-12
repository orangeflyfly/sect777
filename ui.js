/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js)
 */
class UIManager {
    constructor(core) {
        this.core = core;
        this.tab = 'all';
    }

    // 更新血條與基本數值
    updateHPs(p, m) {
        const pBar = document.getElementById('p-hp-bar');
        const pTxt = document.getElementById('p-hp-txt');
        if (pBar && pTxt) {
            pBar.style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
            pTxt.innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
        }

        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;
        
        const mName = document.getElementById('monster-name');
        const mBar = document.getElementById('m-hp-bar');
        const mTxt = document.getElementById('m-hp-txt');
        
        if (m && m.hp > 0) {
            mBar.style.width = (m.hp / m.maxHp * 100) + "%";
            mTxt.innerText = Math.floor(m.hp) + " / " + Math.floor(m.maxHp);
            mName.innerText = m.name;
        } else {
            if (mBar) mBar.style.width = "0%";
            if (mTxt) mTxt.innerText = "搜尋中...";
            if (mName) mName.innerText = "歷練中...";
        }
    }

    renderMonster(m) { 
        const mPic = document.getElementById('monster-pic');
        if (mPic) mPic.innerText = m ? m.pic : "⏳"; 
    }

    toast(msg, color = 'gold') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'toast'; 
        div.style.color = color; 
        div.innerText = msg;
        container.appendChild(div);
        setTimeout(function() { div.remove(); }, 1500);
    }

    log(msg, type = 'system', color = '#eee') {
        const list = document.getElementById('log-list');
        if (!list) return;
        const div = document.createElement('div');
        div.className = "log-item log-type-" + type;
        div.style.color = color;
        const timeStr = new Date().toLocaleTimeString([], { hour12: false });
        div.innerHTML = "[" + timeStr + "] " + msg;
        
        if (this.tab !== 'all' && this.tab !== type) div.style.display = 'none';
        list.prepend(div);
        if (list.children.length > 50) list.lastChild.remove();
    }

    switchLog(tab) {
        this.tab = tab;
        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        
        // 讓點選的標籤亮起來
        const tabNames = { all: '全部', combat: '戰鬥', loot: '獲取' };
        tabs.forEach(function(t) {
            if (t.innerText === tabNames[tab]) t.classList.add('active');
        });

        const items = document.getElementById('log-list').children;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.style.display = (tab === 'all' || item.classList.contains("log-type-" + tab)) ? 'block' : 'none';
        }
    }

    switchPage(id) {
        const stages = document.querySelectorAll('.stage');
        stages.forEach(function(s) { s.style.display = 'none'; });
        const target = document.getElementById("p-" + id);
        if (target) target.style.display = 'flex';
        this.renderAll();
    }

    renderAll() {
        const p = this.core.player;
        const levelSpan = document.getElementById('val-level');
        const moneySpan = document.getElementById('val-money');
        const expBar = document.getElementById('val-exp-bar');
        
        if (levelSpan) {
            const rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
            levelSpan.innerText = "境界：" + rarity.n + " (Lv." + p.data.lv + ")";
        }
        if (moneySpan) moneySpan.innerText = "🪙 " + p.data.money;
        if (expBar) expBar.style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
        
        this.renderMapDropdown(p);
        this.renderActiveSkills(p);
        this.renderBag(p);
        this.renderDetailedStats(p);
        this.renderStats(p);
    }

    renderMapDropdown(p) {
        const select = document.getElementById('map-select-dropdown');
        if (!select || select.children.length > 0) return; 
        GAME_DATA.MAPS.forEach(function(m) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.innerText = m.name + " (Lv." + m.lv + ")";
            if (p.data.mapId === m.id) opt.selected = true;
            select.appendChild(opt);
        });
    }

    renderActiveSkills(p) {
        const container = document.getElementById('active-skill-slots');
        if (!container) return;
        container.innerHTML = '';
        p.data.skills.forEach(function(id) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot-mini' + (id !== null ? ' equipped' : '');
            if (id !== null) {
                const s = GAME_DATA.SKILLS[id];
                slot.innerText = s.type === 'passive' ? '🧘' : '🔥';
            }
            container.appendChild(slot);
        });
    }

    renderDetailedStats(p) {
        const list = document.getElementById('detail-stats-list');
        if (!list) return;
        const b = p.battle;
        const regenVal = p.data.baseStats.vit * 0.1 + b.regen;
        
        let html = '';
        html += '<div class="stat-row"><span>閃避率</span><span class="stat-val">' + (b.dodge * 100).toFixed(1) + '%</span></div>';
        html += '<div class="stat-row"><span>吸血</span><span class="stat-val">' + (b.lifeSteal * 100).toFixed(0) + '%</span></div>';
        html += '<div class="stat-row"><span>秒回血</span><span class="stat-val">' + regenVal.toFixed(1) + '</span></div>';
        html += '<div class="stat-row"><span>天道保底</span><span class="stat-val">' + (b.dmgFloor * 100).toFixed(1) + '%</span></div>';
        list.innerHTML = html;
    }

    renderBag(p) {
        const grid = document.getElementById('bag-grid');
        if (!grid) return;
        grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        const self = this;
        p.data.bag.forEach(function(item, i) {
            const slot = document.createElement('div');
            slot.className = "item-slot rarity-" + (item.rarity || 0);
            slot.innerText = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            slot.onclick = function() { self.core.inventory.equip(i); };
            grid.appendChild(slot);
        });
    }

    renderStats(p) {
        const ptsEl = document.getElementById('val-pts');
        if (ptsEl) ptsEl.innerText = p.data.pts;
        
        const list = document.getElementById('stat-list'); 
        if (!list) return;
        list.innerHTML = '';
        const names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        
        Object.entries(p.data.baseStats).forEach(function([k, v]) {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = names[k] + ': <b>' + v + '</b> <button class="add-btn" onclick="_X_CORE.addStat(\'' + k + '\')">＋</button>';
            list.appendChild(div);
        });

        const weaponName = p.data.equips.weapon ? p.data.equ
