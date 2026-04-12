/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js) V1.2.2
 * 【核心修正】：恢復並強化修為介面(Stats)的細節顯示
 */
function UIManager(core) {
    this.core = core;
    this.tab = 'all';
    this.bagFilter = 'all'; 
}

// 1. 介面切換與總渲染
UIManager.prototype.switchPage = function(id) {
    var stages = document.querySelectorAll('.stage');
    for (var i = 0; i < stages.length; i++) { stages[i].style.display = 'none'; }
    var target = document.getElementById("p-" + id);
    if (target) target.style.display = 'flex';
    this.renderAll();
};

UIManager.prototype.renderAll = function() {
    var p = this.core.player;
    var rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
    document.getElementById('val-level').innerText = "境界：" + rarity.n + " (Lv." + p.data.lv + ")";
    document.getElementById('val-money').innerText = "🪙 " + p.data.money;
    document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
    
    this.renderMapDropdown(p);
    this.renderActiveSkills(p);
    this.renderBag(p); 
    this.renderDetailedStats(p); // 渲染修為詳細屬性
    this.renderStats(p);         // 渲染屬性加點與裝備
};

// 2. 修為頁面 - 渲染詳細屬性表
UIManager.prototype.renderDetailedStats = function(p) {
    var list = document.getElementById('detail-stats-list');
    if (!list) return;
    var b = p.battle;
    var regen = (p.data.baseStats.vit * 0.1 + b.regen).toFixed(1);
    
    var html = '<div class="detailed-stats-box">';
    html += '<div class="stat-row-flex"><span>閃避機率</span><b style="color:#00bcd4">' + (b.dodge * 100).toFixed(1) + '%</b></div>';
    html += '<div class="stat-row-flex"><span>吸血比例</span><b style="color:#ff4d4d">' + (b.lifeSteal * 100).toFixed(0) + '%</b></div>';
    html += '<div class="stat-row-flex"><span>每秒回血</span><b style="color:#4caf50">' + regen + '</b></div>';
    html += '<div class="stat-row-flex"><span>天道保底</span><b style="color:gold">' + (b.dmgFloor * 100).toFixed(1) + '%</b></div>';
    html += '<div class="stat-row-flex"><span>當前攻擊</span><b style="color:#eee">' + Math.floor(b.atk) + '</b></div>';
    html += '<div class="stat-row-flex"><span>當前防禦</span><b style="color:#eee">' + Math.floor(b.def) + '</b></div>';
    html += '</div>';
    list.innerHTML = html;
};

// 3. 修為頁面 - 加點與裝備清單
UIManager.prototype.renderStats = function(p) {
    // A. 剩餘點數
    document.getElementById('val-pts').innerText = p.data.pts;
    
    // B. 加點按鈕區
    var list = document.getElementById('stat-list');
    if (list) {
        list.innerHTML = '';
        var names = { str: '力量 (攻擊)', vit: '體質 (生命)', agi: '身法 (閃避)', int: '悟性 (經驗)' };
        var keys = ['str', 'vit', 'agi', 'int'];
        for (var i = 0; i < keys.length; i++) {
            (function(k) {
                var v = p.data.baseStats[k];
                var div = document.createElement('div');
                div.className = 'stat-item';
                div.innerHTML = '<span>' + names[k] + ': <b>' + v + '</b></span> <button class="add-btn" onclick="_X_CORE.addStat(\'' + k + '\')">＋</button>';
                list.appendChild(div);
            })(keys[i]);
        }
    }

    // C. 裝備展示區 (改為長條化)
    var eqArea = document.getElementById('equipment-slots');
    if (eqArea) {
        eqArea.innerHTML = '<h5>當前穿戴</h5>';
        var types = ['weapon', 'body'];
        var self = this;
        for (var j = 0; j < types.length; j++) {
            (function(t) {
                var eq = p.data.equips[t];
                var slot = document.createElement('div');
                slot.className = 'item-slot ' + (eq ? 'rarity-' + eq.rarity : '');
                slot.style.marginBottom = '8px';
                
                var icon = (t === 'weapon' ? '⚔️' : '🛡️');
                var nameText = eq ? eq.name : (t === 'weapon' ? '尋找神兵中...' : '尚未穿戴法衣');
                var statText = eq ? (eq.atk ? "攻+" + eq.atk : "") + (eq.def ? "防+" + eq.def : "") : "暫無屬性";
                
                slot.innerHTML = 
                    '<div class="item-icon">' + icon + '</div>' +
                    '<div class="item-info-main">' +
                    '  <div class="item-name-text">' + nameText + '</div>' +
                    '  <div class="item-stats-text">' + statText + '</div>' +
                    '</div>';
                
                slot.onclick = function() { if (eq) self.core.inventory.showItemDetail(t, true); };
                eqArea.appendChild(slot);
            })(types[j]);
        }
    }
    
    // D. 渲染功法清單
    this.renderSkillList(p);
};

// 4. 修為頁面 - 渲染已學功法
UIManager.prototype.renderSkillList = function(p) {
    var list = document.getElementById('stat-list');
    if (!list) return;
    
    var div = document.createElement('div');
    div.innerHTML = "<hr><h5>已習得功法 (點擊裝配)</h5>";
    var container = document.createElement('div');
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "5px";

    var self = this;
    for (var i = 0; i < p.data.learnedSkills.length; i++) {
        (function(skillId) {
            var s = GAME_DATA.SKILLS[skillId];
            var isEq = false;
            for (var k = 0; k < p.data.skills.length; k++) {
                if (p.data.skills[k] === skillId) { isEq = true; break; }
            }
            
            var btn = document.createElement('button');
            btn.className = 'filter-btn' + (isEq ? ' active' : '');
            btn.style.width = "auto";
            btn.style.padding = "8px 12px";
            btn.innerHTML = s.name + (isEq ? " <small>[已裝配]</small>" : "");
            
            btn.onclick = function() {
                if (isEq) {
                    for (var m = 0; m < p.data.skills.length; m++) {
                        if (p.data.skills[m] === skillId) { p.data.skills[m] = null; break; }
                    }
                } else {
                    var empty = -1;
                    for (var n = 0; n < p.data.skills.length; n++) {
                        if (p.data.skills[n] === null) { empty = n; break; }
                    }
                    if (empty !== -1) p.data.skills[empty] = skillId;
                    else self.toast("技能欄位已滿", "red");
                }
                p.refresh(); p.save(); self.renderAll();
            };
            container.appendChild(btn);
        })(p.data.learnedSkills[i]);
    }
    div.appendChild(container);
    list.appendChild(div);
};

// --- 以下為通用輔助函數 ---
UIManager.prototype.updateHPs = function(p, m) {
    var pBar = document.getElementById('p-hp-bar');
    var pTxt = document.getElementById('p-hp-txt');
    if (pBar && pTxt) {
        pBar.style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
        pTxt.innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
    }
    var mBar = document.getElementById('m-hp-bar');
    var mTxt = document.getElementById('m-hp-txt');
    var mName = document.getElementById('monster-name');
    if (m && m.hp > 0) {
        mBar.style.width = (m.hp / m.maxHp * 100) + "%";
        mTxt.innerText = Math.floor(m.hp) + " / " + Math.floor(m.maxHp);
        mName.innerText = m.name;
    } else {
        if (mBar) mBar.style.width = "0%";
        if (mTxt) mTxt.innerText = "搜尋中...";
        if (mName) mName.innerText = "歷練中...";
    }
};

UIManager.prototype.renderBag = function(p) {
    var grid = document.getElementById('bag-grid');
    if (!grid) return;
    if (!document.getElementById('bag-filter-bar')) {
        var filterBar = document.createElement('div');
        filterBar.id = 'bag-filter-bar'; filterBar.className = 'bag-filter-bar';
        var types = [['all', '全部'], ['equip', '法寶'], ['scroll', '殘卷']];
        var self = this;
        for (var k = 0; k < types.length; k++) {
            (function(t) {
                var btn = document.createElement('button');
                btn.className = 'filter-btn' + (self.bagFilter === t[0] ? ' active' : '');
                btn.innerText = t[1];
                btn.onclick = function() { self.bagFilter = t[0]; self.renderBag(p); };
                filterBar.appendChild(btn);
            })(types[k]);
        }
        grid.parentNode.insertBefore(filterBar, grid);
    }
    grid.innerHTML = '';
    document.getElementById('bag-count').innerText = p.data.bag.length;
    var self = this;
    for (var i = 0; i < p.data.bag.length; i++) {
        (function(idx) {
            var item = p.data.bag[idx];
            if (self.bagFilter !== 'all' && item.itemType !== self.bagFilter) return;
            var slot = document.createElement('div');
            slot.className = "item-slot rarity-" + (item.rarity || 0);
            var icon = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            var statText = item.itemType === 'equip' ? (item.atk ? "攻+" + item.atk : "") + (item.def ? " 防+" + item.def : "") : "功法殘卷";
            slot.innerHTML = '<div class="item-icon">' + icon + '</div><div class="item-info-main"><div class="item-name-text">' + item.name + '</div><div class="item-stats-text">' + statText + '</div></div>';
            slot.onclick = function() { self.core.inventory.showItemDetail(idx); };
            grid.appendChild(slot);
        })(i);
    }
};

UIManager.prototype.showModal = function(title, body, actionText, actionFn, meltFn) {
    var modal = document.getElementById('item-modal');
    modal.style.display = 'flex';
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    var actBtn = document.getElementById('modal-action-btn');
    var meltBtn = document.getElementById('modal-melt-btn');
    actBtn.innerText = actionText;
    actBtn.onclick = function() { actionFn(); modal.style.display = 'none'; };
    if (meltFn) { meltBtn.style.display = 'inline-block'; meltBtn.onclick = function() { meltFn(); modal.style.display = 'none'; }; }
    else { meltBtn.style.display = 'none'; }
};

UIManager.prototype.renderActiveSkills = function(p) {
    var container = document.getElementById('active-skill-slots');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < p.data.skills.length; i++) {
        var id = p.data.skills[i];
        var slot = document.createElement('div');
        slot.className = 'skill-slot-mini' + (id !== null ? ' equipped' : '');
        if (id !== null) { slot.innerText = GAME_DATA.SKILLS[id].type === 'passive' ? '🧘' : '🔥'; }
        container.appendChild(slot);
    }
};

UIManager.prototype.renderMonster = function(m) {
    var pic = document.getElementById('monster-pic');
    if (pic) pic.innerText = m ? m.pic : "⏳";
};

UIManager.prototype.toast = function(msg, color) {
    var container = document.getElementById('toast-container');
    var div = document.createElement('div');
    div.className = 'toast'; div.style.color = color || 'gold'; div.innerText = msg;
    container.appendChild(div);
    setTimeout(function() { div.remove(); }, 1500);
};

UIManager.prototype.log = function(msg, type, color) {
    var list = document.getElementById('log-list');
    var div = document.createElement('div');
    div.className = "log-item log-type-" + (type || 'system');
    div.style.color = color || '#eee';
    div.innerHTML = "[" + new Date().toLocaleTimeString([], { hour12: false }) + "] " + msg;
    list.prepend(div);
    if (list.children.length > 50) list.lastChild.remove();
};

UIManager.prototype.renderMapDropdown = function(p) {
    var select = document.getElementById('map-select-dropdown');
    if (!select || select.children.length > 0) return;
    for (var i = 0; i < GAME_DATA.MAPS.length; i++) {
        var m = GAME_DATA.MAPS[i];
        var opt = document.createElement('option');
        opt.value = m.id; opt.innerText = m.name + " (Lv." + m.lv + ")";
        if (p.data.mapId === m.id) opt.selected = true;
        select.appendChild(opt);
    }
};
