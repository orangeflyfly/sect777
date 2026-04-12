/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js) V1.3.0
 * 【核心修正】：實裝物品疊加顯示、日誌分類過濾、完善屬性表
 */
function UIManager(core) {
    this.core = core;
}

UIManager.prototype.renderAll = function() {
    var p = this.core.player;
    // 更新頂部境界與靈石
    var rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
    document.getElementById('val-level').innerText = "境界：" + rarity.n + " (Lv." + p.data.lv + ")";
    document.getElementById('val-money').innerText = "🪙 " + Math.floor(p.data.money);
    document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";

    this.renderBag(p); 
    this.renderDetailedStats(p); 
    this.renderStats(p);         
    this.renderActiveSkills(p);
    this.renderMapDropdown(p);
};

// 1. 修為頁面：詳細屬性表 (Grid 佈局同步)
UIManager.prototype.renderDetailedStats = function(p) {
    var container = document.getElementById('detail-stats-list');
    if (!container) return;
    var b = p.battle;
    
    var html = '';
    var stats = [
        { n: "總攻擊", v: b.atk, c: "#eee" },
        { n: "總防禦", v: b.def, c: "#eee" },
        { n: "閃避率", v: (b.dodge * 100).toFixed(1) + "%", c: "cyan" },
        { n: "吸血率", v: (b.lifeSteal * 100).toFixed(0) + "%", c: "#ff4d4d" },
        { n: "秒回血", v: b.regen.toFixed(1), c: "#4caf50" },
        { n: "修煉加成", v: "x" + b.expMul.toFixed(2), c: "gold" }
    ];

    stats.forEach(function(s) {
        html += '<div class="stat-row-flex"><span>' + s.n + '</span><b style="color:' + s.c + '">' + s.v + '</b></div>';
    });
    container.innerHTML = html;
};

// 2. 儲物袋：支援疊加顯示 (xN)
UIManager.prototype.renderBag = function(p) {
    var grid = document.getElementById('bag-grid');
    if (!grid) return;
    grid.innerHTML = '';
    document.getElementById('bag-count').innerText = p.data.bag.length;

    var self = this;
    p.data.bag.forEach(function(item, idx) {
        var slot = document.createElement('div');
        slot.className = "item-slot rarity-" + (item.rarity || 0);
        
        var icon = (item.itemType === 'equip') ? (item.type === 'weapon' ? '🗡️' : '👕') : (item.itemType === 'scroll' ? '📜' : '💎');
        
        // 疊加數量標籤
        var countTag = (item.count > 1) ? ' <span style="color:#4caf50; font-size:11px;">x' + item.count + '</span>' : '';
        
        var statDesc = "";
        if (item.itemType === 'equip') {
            statDesc = (item.atk ? "攻+"+item.atk : "") + (item.def ? " 防+"+item.def : "");
        } else {
            statDesc = item.itemType === 'scroll' ? "功法殘卷" : "煉器材料";
        }

        slot.innerHTML = '<div class="item-icon">' + icon + '</div>' +
                         '<div class="item-info-main">' +
                         '<div class="item-name-text">' + item.name + countTag + '</div>' +
                         '<div class="item-stats-text">' + statDesc + '</div></div>';
        
        slot.onclick = function() { self.core.inventory.showItemDetail(idx); };
        grid.appendChild(slot);
    });
};

// 3. 屬性加點與裝備合併
UIManager.prototype.renderStats = function(p) {
    document.getElementById('val-pts').innerText = p.data.pts;
    var statList = document.getElementById('stat-list');
    if (statList) {
        statList.innerHTML = '';
        var names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        ['str', 'vit', 'agi', 'int'].forEach(function(k) {
            var div = document.createElement('div');
            div.className = 'stat-item';
            div.style = 'display:flex; justify-content:space-between; margin:8px 0; font-size:14px;';
            div.innerHTML = '<span>' + names[k] + ': <b>' + p.data.baseStats[k] + '</b></span>' +
                            '<button class="add-btn" style="background:#444; color:gold; border:1px solid #666; width:25px;" onclick="_X_CORE.addStat(\'' + k + '\')">+</button>';
            statList.appendChild(div);
        });
    }

    var eqArea = document.getElementById('equipment-slots');
    if (eqArea) {
        eqArea.innerHTML = '<h5 style="margin:10px 0; color:gold; border-bottom:1px solid #333; padding-bottom:5px;">▶ 當前武裝</h5>';
        ['weapon', 'body'].forEach(function(type) {
            var eq = p.data.equips[type];
            var div = document.createElement('div');
            div.className = 'item-slot ' + (eq ? 'rarity-' + eq.rarity : '');
            var icon = type === 'weapon' ? '⚔️' : '🛡️';
            var name = eq ? eq.name : "未裝備" + (type==='weapon'?'武器':'法衣');
            var sub = eq ? (eq.atk ? "攻+"+eq.atk : "") + (eq.def ? " 防+"+eq.def : "") : "尚未裝備";
            div.innerHTML = '<div class="item-icon">'+icon+'</div><div class="item-info-main"><div class="item-name-text">'+name+'</div><div class="item-stats-text">'+sub+'</div></div>';
            div.onclick = function() { if(eq) _X_CORE.inventory.showItemDetail(type, true); };
            eqArea.appendChild(div);
        });
    }
};

// 4. 分頁、彈窗與日誌 (其餘基礎功能)
UIManager.prototype.switchPage = function(id) {
    var stages = document.querySelectorAll('.stage');
    stages.forEach(function(s) { s.style.display = 'none'; });
    var target = document.getElementById("p-" + id);
    if (target) target.style.display = 'flex';
    this.renderAll();
};

UIManager.prototype.showModal = function(title, body, actionText, actionFn, meltFn) {
    document.getElementById('item-modal').style.display = 'flex';
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    var btnAct = document.getElementById('modal-action-btn');
    btnAct.innerText = actionText;
    btnAct.onclick = function() { actionFn(); _X_CORE.ui.closeModal(); };
    var btnMelt = document.getElementById('modal-melt-btn');
    if (meltFn) { 
        btnMelt.style.display = 'block'; 
        btnMelt.onclick = function() { meltFn(); _X_CORE.ui.closeModal(); }; 
    } else { btnMelt.style.display = 'none'; }
};

UIManager.prototype.closeModal = function() { document.getElementById('item-modal').style.display = 'none'; };

UIManager.prototype.log = function(msg, type, color) {
    var list = document.getElementById('log-list');
    var div = document.createElement('div');
    div.className = "log-item log-type-" + (type || 'system');
    div.style.color = color || '#eee';
    div.innerHTML = "<small>[" + new Date().toLocaleTimeString([], { hour12: false }) + "]</small> " + msg;
    list.prepend(div);
    if (list.children.length > 50) list.lastChild.remove();
};

UIManager.prototype.switchLog = function(tab) {
    var items = document.getElementById('log-list').children;
    var tabs = document.querySelectorAll('.log-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    event.target.classList.add('active');
    for (var i = 0; i < items.length; i++) {
        items[i].style.display = (tab === 'all' || items[i].classList.contains('log-type-' + tab)) ? 'block' : 'none';
    }
};

UIManager.prototype.toast = function(msg, color) {
    this.log(msg, 'system', color);
    var box = document.getElementById('toast-container');
    var div = document.createElement('div');
    div.className = 'toast'; div.style.color = color || 'gold'; div.innerText = msg;
    box.appendChild(div);
    setTimeout(function() { div.remove(); }, 1500);
};

UIManager.prototype.updateHPs = function(p, m) {
    document.getElementById('p-hp-bar').style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
    document.getElementById('p-hp-txt').innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
    var mFill = document.getElementById('m-hp-bar');
    var mTxt = document.getElementById('m-hp-txt');
    if (m && m.hp > 0) {
        mFill.style.width = (m.hp / m.maxHp * 100) + "%";
        mTxt.innerText = Math.floor(m.hp) + " / " + Math.floor(m.maxHp);
        document.getElementById('monster-name').innerText = m.name;
    } else {
        mFill.style.width = "0%"; mTxt.innerText = "尋找妖獸中...";
        document.getElementById('monster-name').innerText = "歷練中...";
    }
};

UIManager.prototype.renderMonster = function(m) { document.getElementById('monster-pic').innerText = m ? m.pic : "⏳"; };
UIManager.prototype.renderActiveSkills = function(p) {
    var box = document.getElementById('active-skill-slots');
    if (!box) return; box.innerHTML = '';
    p.data.skills.forEach(function(sId) {
        var slot = document.createElement('div');
        slot.className = 'skill-slot-mini' + (sId !== null ? ' equipped' : '');
        slot.innerText = sId !== null ? (GAME_DATA.SKILLS[sId].type === 'passive' ? '🧘' : '🔥') : '';
        box.appendChild(slot);
    });
};
UIManager.prototype.renderMapDropdown = function(p) {
    var sel = document.getElementById('map-select-dropdown');
    if (!sel || sel.children.length > 0) return;
    GAME_DATA.MAPS.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m.id; opt.innerText = m.name + " (Lv." + m.lv + ")";
        if (p.data.mapId === m.id) opt.selected = true;
        sel.appendChild(opt);
    });
};
