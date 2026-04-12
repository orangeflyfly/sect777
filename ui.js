/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js) V1.2.2
 * 【核心修正】：恢復修為詳細屬性、裝備長條清單與功法管理
 */
function UIManager(core) {
    this.core = core;
    this.tab = 'all';
    this.bagFilter = 'all'; 
}

// 1. 分頁切換
UIManager.prototype.switchPage = function(id) {
    var stages = document.querySelectorAll('.stage');
    for (var i = 0; i < stages.length; i++) { stages[i].style.display = 'none'; }
    var target = document.getElementById("p-" + id);
    if (target) target.style.display = 'flex';
    this.renderAll();
};

// 2. 總體刷新
UIManager.prototype.renderAll = function() {
    var p = this.core.player;
    var rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
    
    // 頂部狀態
    document.getElementById('val-level').innerText = "境界：" + rarity.n + " (Lv." + p.data.lv + ")";
    document.getElementById('val-money').innerText = "🪙 " + p.data.money;
    document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
    
    this.renderMapDropdown(p);
    this.renderActiveSkills(p);
    this.renderBag(p); 
    this.renderDetailedStats(p); // 恢復修為詳情
    this.renderStats(p);         // 恢復加點與裝備
};

// 3. 修為頁面：詳細屬性表 (閃避、吸血、秒回)
UIManager.prototype.renderDetailedStats = function(p) {
    var container = document.getElementById('detail-stats-list');
    if (!container) return;
    var b = p.battle;
    
    var html = '<div class="detailed-stats-box">';
    html += '<div class="stat-row-flex"><span>閃避機率</span><b style="color:cyan">' + (b.dodge * 100).toFixed(1) + '%</b></div>';
    html += '<div class="stat-row-flex"><span>吸血比例</span><b style="color:red">' + (b.lifeSteal * 100).toFixed(0) + '%</b></div>';
    html += '<div class="stat-row-flex"><span>每秒回血</span><b style="color:green">' + b.regen.toFixed(1) + '</b></div>';
    html += '<div class="stat-row-flex"><span>天道保底</span><b style="color:gold">' + (b.dmgFloor * 100).toFixed(1) + '%</b></div>';
    html += '<div class="stat-row-flex"><span>經驗倍率</span><b>x' + b.expMul.toFixed(2) + '</b></div>';
    html += '<div class="stat-row-flex"><span>靈石加成</span><b>x' + b.moneyMul.toFixed(1) + '</b></div>';
    html += '</div>';
    container.innerHTML = html;
};

// 4. 修為頁面：加點區與當前裝備
UIManager.prototype.renderStats = function(p) {
    // 潛能點
    document.getElementById('val-pts').innerText = p.data.pts;
    
    // 加點列表
    var statList = document.getElementById('stat-list');
    if (statList) {
        statList.innerHTML = '';
        var names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        var keys = ['str', 'vit', 'agi', 'int'];
        for (var i = 0; i < keys.length; i++) {
            (function(k) {
                var v = p.data.baseStats[k];
                var div = document.createElement('div');
                div.className = 'stat-item';
                div.style.display = 'flex'; div.style.justifyContent = 'space-between'; div.style.margin = '10px 0';
                div.innerHTML = '<span>' + names[k] + ': <b>' + v + '</b></span> <button class="add-btn" onclick="_X_CORE.addStat(\'' + k + '\')">＋</button>';
                statList.appendChild(div);
            })(keys[i]);
        }
    }

    // 當前穿戴 (長條清單風格)
    var eqArea = document.getElementById('equipment-slots');
    if (eqArea) {
        eqArea.innerHTML = '<h5 style="margin:10px 0;">當前穿戴</h5>';
        var types = ['weapon', 'body'];
        var self = this;
        for (var j = 0; j < types.length; j++) {
            (function(t) {
                var eq = p.data.equips[t];
                var slot = document.createElement('div');
                slot.className = 'item-slot ' + (eq ? 'rarity-' + eq.rarity : '');
                slot.style.marginBottom = '8px';
                
                var icon = (t === 'weapon' ? '⚔️' : '🛡️');
                var name = eq ? eq.name : (t === 'weapon' ? '空手' : '布衣');
                var stats = eq ? (eq.atk ? "攻+"+eq.atk : "") + (eq.def ? " 防+"+eq.def : "") : "暫無屬性";
                
                slot.innerHTML = '<div class="item-icon">'+icon+'</div><div class="item-info-main"><div class="item-name-text">'+name+'</div><div class="item-stats-text">'+stats+'</div></div>';
                slot.onclick = function() { if(eq) self.core.inventory.showItemDetail(t, true); };
                eqArea.appendChild(slot);
            })(types[j]);
        }
    }
    this.renderSkillList(p);
};

// 5. 儲物袋渲染 (長條化 + 資訊透明)
UIManager.prototype.renderBag = function(p) {
    var grid = document.getElementById('bag-grid');
    if (!grid) return;

    grid.innerHTML = '';
    document.getElementById('bag-count').innerText = p.data.bag.length;
    var self = this;

    for (var i = 0; i < p.data.bag.length; i++) {
        (function(idx) {
            var item = p.data.bag[idx];
            var slot = document.createElement('div');
            slot.className = "item-slot rarity-" + (item.rarity || 0);
            
            var icon = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            var statDesc = "";
            if (item.itemType === 'equip') {
                if (item.atk) statDesc += "攻+" + item.atk + " ";
                if (item.def) statDesc += "防+" + item.def + " ";
                if (item.lifeSteal) statDesc += "吸血+" + (item.lifeSteal*100).toFixed(0) + "%";
            } else { statDesc = "功法殘卷"; }

            slot.innerHTML = '<div class="item-icon">'+icon+'</div><div class="item-info-main"><div class="item-name-text">'+item.name+'</div><div class="item-stats-text">'+statDesc+'</div></div>';
            slot.onclick = function() { self.core.inventory.showItemDetail(idx); };
            grid.appendChild(slot);
        })(i);
    }
};

// 6. 功法列表 (渲染於修為頁面)
UIManager.prototype.renderSkillList = function(p) {
    var list = document.getElementById('stat-list');
    if (!list) return;
    var div = document.createElement('div');
    div.innerHTML = "<hr><h5 style='margin:10px 0;'>已學功法 (點擊裝備)</h5>";
    var box = document.createElement('div');
    box.style.display = "flex"; box.style.flexWrap = "wrap"; box.style.gap = "5px";

    var self = this;
    for (var i = 0; i < p.data.learnedSkills.length; i++) {
        (function(sId) {
            var s = GAME_DATA.SKILLS[sId];
            var isEq = p.data.skills.indexOf(sId) !== -1;
            var btn = document.createElement('button');
            btn.className = 'filter-btn' + (isEq ? ' active' : '');
            btn.style.padding = "5px 10px"; btn.style.fontSize = "12px";
            btn.innerHTML = s.name + (isEq ? " <small>●</small>" : "");
            btn.onclick = function() {
                if (isEq) {
                    var idx = p.data.skills.indexOf(sId);
                    if (idx !== -1) p.data.skills[idx] = null;
                } else {
                    var empty = p.data.skills.indexOf(null);
                    if (empty !== -1) p.data.skills[empty] = sId;
                    else self.toast("技能槽已滿", "red");
                }
                p.refresh(); p.save(); self.renderAll();
            };
            box.appendChild(btn);
        })(p.data.learnedSkills[i]);
    }
    div.appendChild(box);
    list.appendChild(div);
};

// 7. 通用彈窗與輔助
UIManager.prototype.showModal = function(title, body, actionText, actionFn, meltFn) {
    var m = document.getElementById('item-modal');
    m.style.display = 'flex';
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    var btnAct = document.getElementById('modal-action-btn');
    var btnMelt = document.getElementById('modal-melt-btn');
    btnAct.innerText = actionText;
    btnAct.onclick = function() { actionFn(); m.style.display = 'none'; };
    if (meltFn) { btnMelt.style.display = 'block'; btnMelt.onclick = function() { meltFn(); m.style.display = 'none'; }; }
    else { btnMelt.style.display = 'none'; }
};
UIManager.prototype.closeModal = function() { document.getElementById('item-modal').style.display = 'none'; };

UIManager.prototype.updateHPs = function(p, m) {
    var pFill = document.getElementById('p-hp-bar');
    var pTxt = document.getElementById('p-hp-txt');
    if (pFill) pFill.style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
    if (pTxt) pTxt.innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
    
    var mFill = document.getElementById('m-hp-bar');
    var mTxt = document.getElementById('m-hp-txt');
    var mName = document.getElementById('monster-name');
    if (m && m.hp > 0) {
        if (mFill) mFill.style.width = (m.hp / m.maxHp * 100) + "%";
        if (mTxt) mTxt.innerText = Math.floor(m.hp) + " / " + Math.floor(m.maxHp);
        if (mName) mName.innerText = m.name;
    } else {
        if (mFill) mFill.style.width = "0%";
        if (mTxt) mTxt.innerText = "搜尋妖獸中...";
        if (mName) mName.innerText = "歷練中...";
    }
};

UIManager.prototype.renderMonster = function(m) { if(document.getElementById('monster-pic')) document.getElementById('monster-pic').innerText = m ? m.pic : "⏳"; };
UIManager.prototype.toast = function(msg, color) {
    var box = document.getElementById('toast-container');
    var div = document.createElement('div');
    div.className = 'toast'; div.style.color = color || 'gold'; div.innerText = msg;
    box.appendChild(div);
    setTimeout(function() { div.remove(); }, 1500);
};
UIManager.prototype.log = function(msg, type, color) {
    var list = document.getElementById('log-list');
    var div = document.createElement('div');
    div.className = "log-item log-type-" + (type || 'system');
    div.style.color = color || '#eee'; div.style.fontSize = "11px"; div.style.marginBottom = "3px";
    div.innerHTML = "[" + new Date().toLocaleTimeString([], { hour12: false }) + "] " + msg;
    list.prepend(div);
    if (list.children.length > 50) list.lastChild.remove();
};
UIManager.prototype.renderActiveSkills = function(p) {
    var box = document.getElementById('active-skill-slots');
    if (!box) return; box.innerHTML = '';
    for (var i = 0; i < p.data.skills.length; i++) {
        var sId = p.data.skills[i];
        var slot = document.createElement('div');
        slot.className = 'skill-slot-mini' + (sId !== null ? ' equipped' : '');
        if (sId !== null) slot.innerText = GAME_DATA.SKILLS[sId].type === 'passive' ? '🧘' : '🔥';
        box.appendChild(slot);
    }
};
UIManager.prototype.renderMapDropdown = function(p) {
    var sel = document.getElementById('map-select-dropdown');
    if (!sel || sel.children.length > 0) return;
    for (var i = 0; i < GAME_DATA.MAPS.length; i++) {
        var m = GAME_DATA.MAPS[i];
        var opt = document.createElement('option');
        opt.value = m.id; opt.innerText = m.name + " (Lv." + m.lv + ")";
        if (p.data.mapId === m.id) opt.selected = true;
        sel.appendChild(opt);
    }
};
UIManager.prototype.switchLog = function(tab) {
    var items = document.getElementById('log-list').children;
    for (var i = 0; i < items.length; i++) {
        items[i].style.display = (tab === 'all' || items[i].classList.contains('log-type-' + tab)) ? 'block' : 'none';
    }
};
