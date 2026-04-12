/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js)
 */
class UIManager {
    constructor(core) { 
        this.core = core; 
        this.tab = 'all'; 
    }

    updateHPs(p, m) {
        document.getElementById('p-hp-bar').style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
        document.getElementById('p-hp-txt').innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
        document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
        document.getElementById('val-def').innerText = Math.floor(p.battle.def);
        document.getElementById('val-power').innerText = p.battle.power;
        
        var mName = document.getElementById('monster-name');
        var mBar = document.getElementById('m-hp-bar');
        var mTxt = document.getElementById('m-hp-txt');
        if (m) {
            mBar.style.width = (m.hp / m.maxHp * 100) + "%";
            mTxt.innerText = Math.floor(m.hp) + " / " + Math.floor(m.maxHp);
            mName.innerText = m.name;
        } else {
            mBar.style.width = "0%";
            mTxt.innerText = "搜尋中...";
            mName.innerText = "歷練中...";
        }
    }

    renderMonster(m) { 
        document.getElementById('monster-pic').innerText = m ? m.pic : "⏳"; 
    }

    toast(msg, color) {
        var c = color || 'gold';
        var div = document.createElement('div');
        div.className = 'toast'; div.style.color = c; div.innerText = msg;
        document.getElementById('toast-container').appendChild(div);
        setTimeout(function() { div.remove(); }, 1500);
    }

    log(msg, type, color) {
        var t = type || 'system';
        var c = color || '#eee';
        var list = document.getElementById('log-list');
        var div = document.createElement('div');
        div.className = "log-item log-type-" + t; div.style.color = c;
        var timeStr = new Date().toLocaleTimeString([], { hour12: false });
        div.innerHTML = "[" + timeStr + "] " + msg;
        if (this.tab !== 'all' && this.tab !== t) div.style.display = 'none';
        list.prepend(div);
        if (list.children.length > 50) list.lastChild.remove();
    }

    switchLog(tab) {
        this.tab = tab;
        var tabs = document.querySelectorAll('.log-tab');
        for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
        
        var items = document.getElementById('log-list').children;
        for (var j = 0; j < items.length; j++) {
            items[j].style.display = (tab === 'all' || items[j].classList.contains("log-type-" + tab)) ? 'block' : 'none';
        }
    }

    switchPage(id) {
        var stages = document.querySelectorAll('.stage');
        for (var i = 0; i < stages.length; i++) { stages[i].style.display = 'none'; }
        document.getElementById("p-" + id).style.display = 'flex';
        this.renderAll();
    }

    renderAll() {
        var p = this.core.player;
        var rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
        document.getElementById('val-level').innerText = "境界：" + rarity.n + " (Lv." + p.data.lv + ")";
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
        GAME_DATA.MAPS.forEach(function(m) {
            var opt = document.createElement('option');
            opt.value = m.id; opt.innerText = m.name + " (Lv." + m.lv + ")";
            if (p.data.mapId === m.id) opt.selected = true;
            select.appendChild(opt);
        });
    }

    renderActiveSkills(p) {
        var container = document.getElementById('active-skill-slots');
        container.innerHTML = '';
        p.data.skills.forEach(function(id) {
            var slot = document.createElement('div');
            slot.className = 'skill-slot-mini' + (id !== null ? ' equipped' : '');
            if (id !== null) slot.innerText = GAME_DATA.SKILLS[id].type === 'passive' ? '🧘' : '🔥';
            container.appendChild(slot);
        });
    }

    renderDetailedStats(p) {
        var list = document.getElementById('detail-stats-list');
        var b = p.battle;
        var regenTotal = (p.data.baseStats.vit * 0.1 + b.regen).toFixed(1);
        var html = '';
        html += '<div class="stat-row"><span>閃避率</span><span class="stat-val">' + (b.dodge * 100).toFixed(1) + '%</span></div>';
        html += '<div class="stat-row"><span>吸血</span><span class="stat-val">' + (b.lifeSteal * 100).toFixed(0) + '%</span></div>';
        html += '<div class="stat-row"><span>秒回血</span><span class="stat-val">' + regenTotal + '</span></div>';
        html += '<div class="stat-row"><span>保底傷</span><span class="stat-val">' + (b.dmgFloor * 100).toFixed(1) + '%</span></div>';
        list.innerHTML = html;
    }

    renderBag(p) {
        var grid = document.getElementById('bag-grid'); grid.innerHTML = '';
        document.getElementById('bag-count').innerText = p.data.bag.length;
        var self = this;
        p.data.bag.forEach(function(item, i) {
            var slot = document.createElement('div');
            slot.className = "item-slot rarity-" + (item.rarity || 0);
            slot.innerText = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            slot.onclick = function() { self.core.inventory.useItem(i); };
            grid.appendChild(slot);
        });
    }

    renderStats(p) {
        document.getElementById('val-pts').innerText = p.data.pts;
        var list = document.getElementById('stat-list'); list.innerHTML = '';
        var names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        var keys = Object.keys(p.data.baseStats);
        
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var v = p.data.baseStats[k];
            var div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = names[k] + ': <b>' + v + '</b> <button class="add-btn" onclick="_X_CORE.addStat(\'' + k + '\')">＋</button>';
            list.appendChild(div);
        }
        
        var weaponName = p.data.equips.weapon ? p.data.equips.weapon.name : '空';
        var bodyName = p.data.equips.body ? p.data.equips.body.name : '空';
        document.getElementById('equipment-slots').innerHTML = 
            '<div style="display:flex; gap:10px; margin-top:10px;">' +
            '<button onclick="_X_CORE.inventory.unequip(\'weapon\')">卸下武器: ' + weaponName + '</button>' +
            '<button onclick="_X_CORE.inventory.unequip(\'body\')">卸下法衣: ' + bodyName + '</button>' +
            '</div>';
        
        this.renderSkillEquipList(p);
    }

    renderSkillEquipList(p) {
        var list = document.getElementById('stat-list');
        var title = document.createElement('h5'); 
        title.innerHTML = "<hr>已學功法 (點擊裝配/卸下)"; 
        list.appendChild(title);
        var self = this;
        p.data.learnedSkills.forEach(function(skillId) {
            var s = GAME_DATA.SKILLS[skillId];
            var isEquipped = p.data.skills.indexOf(skillId) !== -1;
            var btn = document.createElement('button');
            btn.style.margin = "5px"; btn.style.padding = "5px";
            btn.style.background = isEquipped ? "gold" : "#333";
            btn.innerText = s.name + (isEquipped ? " [卸下]" : " [裝配]");
            btn.onclick = function() {
                if (isEquipped) {
                    p.data.skills[p.data.skills.indexOf(skillId)] = null;
                } else {
                    var empty = p.data.skills.indexOf(null);
                    if (empty !== -1) p.data.skills[empty] = skillId;
                    else self.toast("技能槽已滿", "red");
                }
                p.refresh(); p.save(); self.renderAll();
            };
            list.appendChild(btn);
        });
    }
}
