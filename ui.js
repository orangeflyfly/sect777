/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js) V1.2
 * 採用大圓滿兼容語法，確保無紅線報錯
 */
function UIManager(core) {
    this.core = core;
    this.tab = 'all';
    this.bagFilter = 'all'; // 背包分類狀態：all, equip, scroll
}

// 1. 詳情彈窗控制 (整合裝備與熔煉)
UIManager.prototype.showModal = function(title, body, actionText, actionFn, meltFn) {
    var modal = document.getElementById('item-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    
    var actBtn = document.getElementById('modal-action-btn');
    var meltBtn = document.getElementById('modal-melt-btn');
    
    actBtn.innerText = actionText;
    actBtn.onclick = function() {
        actionFn();
        document.getElementById('item-modal').style.display = 'none';
    };
    
    if (meltFn) {
        meltBtn.style.display = 'inline-block';
        meltBtn.onclick = function() {
            meltFn();
            document.getElementById('item-modal').style.display = 'none';
        };
    } else {
        meltBtn.style.display = 'none';
    }
};

UIManager.prototype.closeModal = function() {
    var modal = document.getElementById('item-modal');
    if (modal) modal.style.display = 'none';
};

// 2. 戰鬥數值更新
UIManager.prototype.updateHPs = function(p, m) {
    var pBar = document.getElementById('p-hp-bar');
    var pTxt = document.getElementById('p-hp-txt');
    if (pBar && pTxt) {
        pBar.style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
        pTxt.innerText = Math.floor(p.battle.hp) + " / " + Math.floor(p.battle.maxHp);
    }

    document.getElementById('val-atk').innerText = Math.floor(p.battle.atk);
    document.getElementById('val-def').innerText = Math.floor(p.battle.def);
    
    var mName = document.getElementById('monster-name');
    var mBar = document.getElementById('m-hp-bar');
    var mTxt = document.getElementById('m-hp-txt');
    
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

UIManager.prototype.renderMonster = function(m) {
    var mPic = document.getElementById('monster-pic');
    if (mPic) mPic.innerText = m ? m.pic : "⏳";
};

// 3. 總渲染邏輯
UIManager.prototype.renderAll = function() {
    var p = this.core.player;
    var rarityIdx = Math.min(4, Math.floor(p.data.lv / 10));
    var rarityName = GAME_DATA.RARITY[rarityIdx].n;
    
    document.getElementById('val-level').innerText = "境界：" + rarityName + " (Lv." + p.data.lv + ")";
    document.getElementById('val-money').innerText = "🪙 " + p.data.money;
    document.getElementById('val-exp-bar').style.width = (p.data.exp / (p.data.lv * 100) * 100) + "%";
    
    this.renderMapDropdown(p);
    this.renderActiveSkills(p);
    this.renderBag(p); // 包含分類邏輯
    this.renderDetailedStats(p);
    this.renderStats(p);
};

// 4. 儲物袋渲染 (長條化 + 資訊透明 + 分類)
UIManager.prototype.renderBag = function(p) {
    var grid = document.getElementById('bag-grid');
    if (!grid) return;

    // 初始化分類按鈕列 (若不存在則建立)
    if (!document.getElementById('bag-filter-bar')) {
        var filterBar = document.createElement('div');
        filterBar.id = 'bag-filter-bar';
        filterBar.className = 'bag-filter-bar';
        var types = [['all', '全部'], ['equip', '法寶'], ['scroll', '殘卷']];
        var self = this;
        for (var k = 0; k < types.length; k++) {
            (function(typeData) {
                var btn = document.createElement('button');
                btn.className = 'filter-btn' + (self.bagFilter === typeData[0] ? ' active' : '');
                btn.innerText = typeData[1];
                btn.onclick = function() {
                    self.bagFilter = typeData[0];
                    self.renderBag(p);
                };
                filterBar.appendChild(btn);
            })(types[k]);
        }
        grid.parentNode.insertBefore(filterBar, grid);
    } else {
        // 更新分類按鈕亮燈狀態
        var btns = document.querySelectorAll('.filter-btn');
        var typeKeys = ['all', 'equip', 'scroll'];
        for (var b = 0; b < btns.length; b++) {
            btns[b].className = 'filter-btn' + (this.bagFilter === typeKeys[b] ? ' active' : '');
        }
    }

    grid.innerHTML = '';
    document.getElementById('bag-count').innerText = p.data.bag.length;
    var self = this;

    for (var i = 0; i < p.data.bag.length; i++) {
        (function(idx) {
            var item = p.data.bag[idx];
            // 分類篩選
            if (self.bagFilter !== 'all' && item.itemType !== self.bagFilter) return;

            var slot = document.createElement('div');
            slot.className = "item-slot rarity-" + (item.rarity || 0);
            
            var icon = item.itemType === 'equip' ? (item.type === 'weapon' ? '🗡️' : '👕') : '📜';
            var statDesc = "";
            if (item.itemType === 'equip') {
                if (item.atk) statDesc += "攻+" + item.atk + " ";
                if (item.def) statDesc += "防+" + item.def + " ";
                if (item.hp) statDesc += "血+" + item.hp;
            } else {
                statDesc = "特殊道具 / 功法殘卷";
            }

            var html = '';
            html += '<div class="item-icon">' + icon + '</div>';
            html += '<div class="item-info-main">';
            html += '  <div class="item-name-text">' + item.name + '</div>';
            html += '  <div class="item-stats-text">' + statDesc + '</div>';
            html += '</div>';
            
            slot.innerHTML = html;
            slot.onclick = function() { self.core.inventory.showItemDetail(idx); };
            grid.appendChild(slot);
        })(i);
    }
};

// 5. 詳細屬性列表
UIManager.prototype.renderDetailedStats = function(p) {
    var list = document.getElementById('detail-stats-list');
    if (!list) return;
    var b = p.battle;
    var regenVal = (p.data.baseStats.vit * 0.1 + b.regen).toFixed(1);
    
    var html = '<div class="detailed-stats-box">';
    html += '<div class="stat-row-flex"><span>閃避機率</span><span style="color:#00bcd4">' + (b.dodge * 100).toFixed(1) + '%</span></div>';
    html += '<div class="stat-row-flex"><span>吸血比例</span><span style="color:#ff4d4d">' + (b.lifeSteal * 100).toFixed(0) + '%</span></div>';
    html += '<div class="stat-row-flex"><span>每秒回血</span><span style="color:#4caf50">' + regenVal + '</span></div>';
    html += '<div class="stat-row-flex"><span>天道保底</span><span style="color:gold">' + (b.dmgFloor * 100).toFixed(1) + '%</span></div>';
    html += '</div>';
    list.innerHTML = html;
};

// 6. 修為加點與技能管理
UIManager.prototype.renderStats = function(p) {
    document.getElementById('val-pts').innerText = p.data.pts;
    var list = document.getElementById('stat-list');
    if (!list) return;
    list.innerHTML = '';
    var names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
    var keys = ['str', 'vit', 'agi', 'int'];
    
    for (var i = 0; i < keys.length; i++) {
        (function(k) {
            var v = p.data.baseStats[k];
            var div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = names[k] + ': <b>' + v + '</b> <button class="add-btn" onclick="_X_CORE.addStat(\'' + k + '\')">＋</button>';
            list.appendChild(div);
        })(keys[i]);
    }

    var eqArea = document.getElementById('equipment-slots');
    if (eqArea) {
        eqArea.innerHTML = '';
        var types = ['weapon', 'body'];
        var self = this;
        for (var j = 0; j < types.length; j++) {
            (function(t) {
                var eq = p.data.equips[t];
                var slot = document.createElement('div');
                slot.className = 'item-slot ' + (eq ? 'rarity-' + eq.rarity : '');
                slot.style.height = '40px'; slot.style.marginBottom = '5px';
                slot.innerHTML = '<div class="item-icon">' + (t === 'weapon' ? '⚔️' : '🛡️') + '</div>' +
                                 '<div class="item-info-main"><div class="item-name-text">' + (eq ? eq.name : '尚未裝備') + '</div></div>';
                slot.onclick = function() { if (eq) self.core.inventory.showItemDetail(t, true); };
                eqArea.appendChild(slot);
            })(types[j]);
        }
    }
    this.renderSkillList(p);
};

UIManager.prototype.renderSkillList = function(p) {
    var list = document.getElementById('stat-list');
    if (!list) return;
    var div = document.createElement('div');
    div.innerHTML = "<hr><h5>已學功法 (點擊裝備/卸下)</h5>";
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
            btn.style.margin = "3px"; btn.style.width = "auto"; btn.style.padding = "5px 10px";
            btn.innerText = s.name + (isEq ? " [已裝配]" : "");
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
                    else self.toast("技能槽已滿", "red");
                }
                p.refresh(); p.save(); self.renderAll();
            };
            div.appendChild(btn);
        })(p.data.learnedSkills[i]);
    }
    list.appendChild(div);
};

// 其餘通用函數保持不變
UIManager.prototype.toast = function(msg, color) {
    var c = color || 'gold';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'toast'; div.style.color = c; div.innerText = msg;
    container.appendChild(div);
    setTimeout(function() { div.remove(); }, 1500);
};

UIManager.prototype.log = function(msg, type, color) {
    var t = type || 'system'; var c = color || '#eee';
    var list = document.getElementById('log-list');
    if (!list) return;
    var div = document.createElement('div');
    div.className = "log-item log-type-" + t; div.style.color = c;
    div.innerHTML = "[" + new Date().toLocaleTimeString([], { hour12: false }) + "] " + msg;
    if (this.tab !== 'all' && this.tab !== t) div.style.display = 'none';
    list.prepend(div);
    if (list.children.length > 50) list.lastChild.remove();
};

UIManager.prototype.switchLog = function(tab) {
    this.tab = tab;
    var tabs = document.querySelectorAll('.log-tab');
    for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
    var listItems = document.getElementById('log-list').children;
    for (var j = 0; j < listItems.length; j++) {
        var item = listItems[j];
        item.style.display = (tab === 'all' || item.classList.contains("log-type-" + tab)) ? 'block' : 'none';
    }
};

UIManager.prototype.switchPage = function(id) {
    var stages = document.querySelectorAll('.stage');
    for (var i = 0; i < stages.length; i++) { stages[i].style.display = 'none'; }
    var target = document.getElementById("p-" + id);
    if (target) target.style.display = 'flex';
    this.renderAll();
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
