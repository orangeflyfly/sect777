/**
 * 宗門修仙錄 - 介面模組 (ui.js) V1.4.1
 * 職責：雙色渲染、特效觸發、日誌過濾、CD動畫、數值同步
 */
function UIManager(core) {
    this.core = core;
    this.currentBagFilter = 'all';
    this.currentLogFilter = 'all';
}

UIManager.prototype.renderAll = function() {
    var p = this.core.player;
    var elLv = document.getElementById('val-level');
    var elMoney = document.getElementById('val-money');
    var elExpBar = document.getElementById('val-exp-bar');
    var elExpTxt = document.getElementById('val-exp-txt');
    
    if (elLv) elLv.innerText = GAME_DATA.REALMS[p.data.realmIdx] + " (Lv." + p.data.lv + ")";
    if (elMoney) elMoney.innerText = "🪙 " + p.data.money;
    if (elExpBar && elExpTxt) {
        var per = Math.floor((p.data.exp / (p.data.lv * 100)) * 100);
        elExpBar.style.width = per + "%";
        elExpTxt.innerText = per + "%";
    }
    
    this.renderBag();
    this.renderStats();
    this.renderSkills();
    this.renderShop();
    this.updateActiveSkillSlots();
};

UIManager.prototype.getItemNameHTML = function(item) {
    if (!item) return "";
    if (item.itemType !== 'equip') return item.name;
    var html = "";
    var affs = item.affixes || [];
    for (var i = 0; i < affs.length; i++) {
        html += '<span class="affix-tag r-' + affs[i].r + '">[' + affs[i].n + ']</span>';
    }
    html += '<span class="r-' + (item.baseRarity || 0) + '">·' + item.name + '</span>';
    return html;
};

UIManager.prototype.showDamage = function(dmg, isCrit) {
    var parent = document.getElementById('monster-pic').parentElement;
    var div = document.createElement('div');
    div.className = 'damage-popup';
    if (isCrit) div.style.color = 'gold';
    div.innerText = dmg;
    div.style.left = (35 + Math.random() * 30) + "%";
    parent.appendChild(div);
    setTimeout(function() { div.remove(); }, 800);

    var card = document.querySelector('.monster-card');
    if (card) {
        card.classList.add('shake');
        setTimeout(function() { card.classList.remove('shake'); }, 200);
    }
};

UIManager.prototype.switchLog = function(type, event) {
    this.currentLogFilter = type;
    var tabs = document.querySelectorAll('.log-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    if (event) event.target.classList.add('active');

    var logs = document.querySelectorAll('.log-item');
    for (var j = 0; j < logs.length; j++) {
        var log = logs[j];
        if (type === 'all') log.style.display = 'block';
        else if (type === 'combat' && log.classList.contains('combat')) log.style.display = 'block';
        else if (type === 'loot' && log.classList.contains('loot')) log.style.display = 'block';
        else log.style.display = 'none';
    }
};

UIManager.prototype.updateActiveSkillSlots = function() {
    var self = this;
    var p = this.core.player;
    var row = document.getElementById('active-skill-slots');
    if (!row) return;
    row.innerHTML = "";
    
    for (var i = 0; i < p.data.skills.length; i++) {
        var sId = p.data.skills[i];
        var slot = document.createElement('div');
        slot.className = "skill-icon-sm";
        (function(idx) {
            if (sId !== null) {
                var s = GAME_DATA.SKILLS[sId];
                slot.innerText = s.name[0];
                slot.style.borderColor = "orange";
                slot.onclick = function() { self.core.combat.manualSkill(idx); };
                var mask = document.createElement('div');
                mask.className = "skill-cd-mask";
                mask.id = "skill-cd-" + idx;
                slot.appendChild(mask);
            } else {
                slot.innerText = "空"; slot.style.opacity = "0.3";
            }
        })(i);
        row.appendChild(slot);
    }
};

UIManager.prototype.startCDAnimation = function(slotIdx, duration) {
    var mask = document.getElementById("skill-cd-" + slotIdx);
    if (!mask) return;
    var start = Date.now();
    var timer = setInterval(function() {
        var elapsed = Date.now() - start;
        var remain = (duration * 1000) - elapsed;
        if (remain <= 0) {
            mask.style.height = "0%";
            clearInterval(timer);
            _X_CORE.player.skillCDs[slotIdx] = 0;
        } else {
            mask.style.height = (remain / (duration * 1000) * 100) + "%";
        }
    }, 100);
};

UIManager.prototype.updateHPs = function(player, monster) {
    var pBar = document.getElementById('p-hp-bar');
    var mBar = document.getElementById('m-hp-bar');
    var pTxt = document.getElementById('p-hp-txt');
    var mTxt = document.getElementById('m-hp-txt');
    
    if (pBar && pTxt) {
        pBar.style.width = (player.battle.hp / player.battle.maxHp * 100) + "%";
        pTxt.innerText = Math.floor(player.battle.hp) + " / " + player.battle.maxHp;
    }
    if (mBar && mTxt && monster) {
        mBar.style.width = (monster.hp / monster.maxHp * 100) + "%";
        mTxt.innerText = Math.floor(monster.hp) + " / " + monster.maxHp;
        document.getElementById('monster-name').innerText = monster.name;
        document.getElementById('monster-pic').innerText = monster.pic;
    } else if (mBar && mTxt) {
        mBar.style.width = "0%"; mTxt.innerText = "搜尋中...";
        document.getElementById('monster-pic').innerText = "⏳";
    }
};

UIManager.prototype.renderBag = function() {
    var self = this; var p = this.core.player; var grid = document.getElementById('bag-grid');
    if (!grid) return; grid.innerHTML = "";
    document.getElementById('bag-count').innerText = p.data.bag.length;
    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        if (self.currentBagFilter !== 'all' && item.itemType !== self.currentBagFilter) continue;
        (function(idx, itm) {
            var slot = document.createElement('div');
            slot.className = 'item-slot';
            slot.style.borderLeftColor = GAME_DATA.RARITY[itm.baseRarity || 0].c;
            slot.onclick = function() { self.core.inventory.showItemDetail(idx, false); };
            var icon = (itm.itemType === 'equip') ? (itm.type === 'weapon' ? "⚔️" : "🛡️") : (itm.itemType === 'scroll' ? "📜" : "💎");
            slot.innerHTML = '<div class="item-icon">' + icon + '</div><div class="item-info"><div class="item-name">' + self.getItemNameHTML(itm) + ' ' + (itm.count > 1 ? 'x'+itm.count : '') + '</div></div>';
            grid.appendChild(slot);
        })(i, item);
    }
};

UIManager.prototype.renderStats = function() {
    var self = this; var p = this.core.player;
    var list = document.getElementById('detail-stats-list');
    if (list) {
        list.innerHTML = '<div class="stat-row-flex"><span>攻擊</span><b>' + p.battle.atk + '</b></div>' +
                         '<div class="stat-row-flex"><span>生命</span><b>' + p.battle.maxHp + '</b></div>' +
                         '<div class="stat-row-flex"><span>防禦</span><b>' + p.battle.def + '</b></div>' +
                         '<div class="stat-row-flex"><span>秒回</span><b>' + p.battle.regen.toFixed(1) + '</b></div>';
    }
    document.getElementById('val-pts').innerText = p.data.pts;
    var statBox = document.getElementById('stat-list');
    statBox.innerHTML = "";
    var nextBreak = GAME_DATA.CONFIG.BREAK_LV[p.data.realmIdx];
    if (p.data.lv >= nextBreak) {
        var bBtn = document.createElement('button'); bBtn.className = "btn-primary"; bBtn.style.width = "100%";
        bBtn.innerText = "突破境界"; bBtn.onclick = function() { p.breakthrough(); };
        statBox.appendChild(bBtn);
    } else {
        var sMap = {str:"力量", vit:"體質", agi:"敏捷", int:"悟性"};
        for(var k in sMap) {
            var row = document.createElement('div'); row.className = "stat-row-flex";
            row.innerHTML = '<span>' + sMap[k] + '(' + p.data.baseStats[k] + ')</span><button onclick="_X_CORE.addStat(\''+k+'\')">+</button>';
            statBox.appendChild(row);
        }
    }
    var eSlot = document.getElementById('equipment-slots'); eSlot.innerHTML = "";
    ['weapon', 'body'].forEach(function(s) {
        var itm = p.data.equips[s]; var div = document.createElement('div'); div.className = "item-slot";
        div.innerHTML = itm ? '<div class="item-icon">'+(s==='weapon'?'⚔️':'🛡️')+'</div>' + self.getItemNameHTML(itm) : '<div style="color:#444">未穿戴</div>';
        if(itm) div.onclick = function() { self.core.inventory.showItemDetail(s, true); };
        eSlot.appendChild(div);
    });
};

UIManager.prototype.renderSkills = function() {
    var self = this; var p = this.core.player; var list = document.getElementById('learned-skills-list');
    if(!list) return; list.innerHTML = "";
    for(var i=0; i<p.data.learnedSkills.length; i++) {
        (function(sId) {
            var s = GAME_DATA.SKILLS[sId]; var isEq = p.data.skills.indexOf(sId) !== -1;
            var card = document.createElement('div'); card.className = 'skill-card ' + (isEq ? 'equipped' : '');
            card.innerHTML = '<div>' + s.name + '</div><div style="font-size:9px;color:#888">' + s.type + '</div>';
            card.onclick = function() { self.showSkillEquipMenu(sId); };
            list.appendChild(card);
        })(p.data.learnedSkills[i]);
    }
};

UIManager.prototype.showSkillEquipMenu = function(sId) {
    var self = this; var s = GAME_DATA.SKILLS[sId];
    if(s.type === 'passive') { this.toast("被動技能已生效"); return; }
    this.showModal("裝備神通", s.desc, "放入一號位", function() {
        var p = self.core.player;
        p.data.skills = p.data.skills.map(function(id){ return id === sId ? null : id; });
        p.data.skills[0] = sId; p.save(); self.renderAll();
    }, null);
};

UIManager.prototype.log = function(msg, type, color) {
    var list = document.getElementById('log-list');
    if(!list) return; var div = document.createElement('div'); div.className = 'log-item ' + type;
    if(color) div.style.color = color;
    div.innerHTML = '[' + new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit'}) + '] ' + msg;
    list.prepend(div); if(list.childNodes.length > 50) list.lastChild.remove();
};

UIManager.prototype.toast = function(m, c) {
    var con = document.getElementById('toast-container');
    var d = document.createElement('div'); d.className = 'toast'; d.style.color = c || 'gold'; d.innerText = m;
    con.appendChild(d); setTimeout(function(){ d.remove(); }, 1800);
};

UIManager.prototype.showModal = function(t, b, bt, bf, mf) {
    var m = document.getElementById('item-modal');
    document.getElementById('modal-item-name').innerHTML = t;
    document.getElementById('modal-item-desc').innerHTML = b;
    var ab = document.getElementById('modal-action-btn'); ab.innerText = bt;
    ab.onclick = function(){ bf(); _X_CORE.ui.closeModal(); };
    var mb = document.getElementById('modal-melt-btn');
    if(mf) { mb.style.display = "block"; mb.onclick = function(){ mf(); _X_CORE.ui.closeModal(); }; }
    else mb.style.display = "none";
    m.style.display = "flex";
};

UIManager.prototype.closeModal = function() { document.getElementById('item-modal').style.display = "none"; };

UIManager.prototype.switchPage = function(p) {
    document.querySelectorAll('.stage').forEach(function(s){ s.style.display = 'none'; });
    document.getElementById('p-' + p).style.display = 'flex'; this.renderAll();
};

UIManager.prototype.setBagFilter = function(f, e) {
    this.currentBagFilter = f;
    document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
    e.target.classList.add('active'); this.renderBag();
};

UIManager.prototype.renderShop = function() {
    var list = document.getElementById('shop-list'); if(!list) return; list.innerHTML = "";
    GAME_DATA.SHOP_ITEMS.forEach(function(item) {
        var div = document.createElement('div'); div.className = "item-slot"; div.style.justifyContent = "space-between";
        div.innerHTML = '<div>'+item.name+'</div><button class="btn-primary" style="padding:4px">🪙'+item.price+'</button>';
        div.onclick = function() { _X_CORE.shop.buy(item); }; list.appendChild(div);
    });
};
