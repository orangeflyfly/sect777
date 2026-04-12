/**
 * 宗門修仙錄 - 介面模組 (ui.js) V1.4
 */
function UIManager(core) {
    this.core = core;
    this.currentBagFilter = 'all';
}

UIManager.prototype.renderAll = function() {
    const p = this.core.player;
    const elLv = document.getElementById('val-level');
    const elMoney = document.getElementById('val-money');
    const elExp = document.getElementById('val-exp-bar');
    
    if (elLv) elLv.innerText = GAME_DATA.REALMS[p.data.realmIdx] + " (Lv." + p.data.lv + ")";
    if (elMoney) elMoney.innerText = "🪙 " + p.data.money;
    if (elExp) elExp.style.width = (p.data.exp / (p.data.lv * 100)) * 100 + "%";
    
    this.renderBag();
    this.renderStats();
    this.renderSkills();
    this.renderShop();
    this.updateActiveSkillSlots();
};

UIManager.prototype.getItemNameHTML = function(item) {
    if (!item) return "";
    if (item.itemType !== 'equip') return item.name;
    let html = "";
    const affixes = item.affixes || [];
    affixes.forEach(function(aff) {
        html += '<span class="affix-tag r-' + aff.r + '">[' + aff.n + ']</span>';
    });
    html += '<span class="r-' + (item.baseRarity || 0) + '">·' + item.name + '</span>';
    return html;
};

UIManager.prototype.renderBag = function() {
    const self = this;
    const p = this.core.player;
    const grid = document.getElementById('bag-grid');
    if (!grid) return;
    grid.innerHTML = "";
    const elCount = document.getElementById('bag-count');
    if (elCount) elCount.innerText = p.data.bag.length;

    p.data.bag.forEach(function(item, idx) {
        if (self.currentBagFilter !== 'all' && item.itemType !== self.currentBagFilter) return;

        const slot = document.createElement('div');
        slot.className = 'item-slot';
        slot.style.borderLeftColor = GAME_DATA.RARITY[item.baseRarity || 0].c;
        slot.onclick = function() { self.core.inventory.showItemDetail(idx, false); };

        const icon = (item.itemType === 'equip') ? (item.type === 'weapon' ? "⚔️" : "🛡️") : 
                     (item.itemType === 'scroll' ? "📜" : "💎");
        
        slot.innerHTML = '<div class="item-icon">' + icon + '</div>' +
                         '<div class="item-info">' +
                         '<div class="item-name">' + self.getItemNameHTML(item) + ' ' + (item.count > 1 ? 'x'+item.count : '') + '</div>' +
                         '</div>';
        grid.appendChild(slot);
    });
};

UIManager.prototype.renderStats = function() {
    const self = this;
    const p = this.core.player;
    const list = document.getElementById('detail-stats-list');
    if (list) {
        list.innerHTML = '<div class="stat-row-flex"><span>攻擊</span><b>' + (p.battle.atk || 0) + '</b></div>' +
                         '<div class="stat-row-flex"><span>防禦</span><b>' + (p.battle.def || 0) + '</b></div>' +
                         '<div class="stat-row-flex"><span>生命</span><b>' + (p.battle.maxHp || 0) + '</b></div>' +
                         '<div class="stat-row-flex"><span>閃避</span><b>' + ((p.battle.dodge || 0)*100).toFixed(1) + '%</b></div>' +
                         '<div class="stat-row-flex"><span>暴擊</span><b>' + ((p.battle.crit || 0)*100).toFixed(0) + '%</b></div>' +
                         '<div class="stat-row-flex"><span>吸血</span><b>' + ((p.battle.lifeSteal || 0)*100).toFixed(0) + '%</b></div>' +
                         '<div class="stat-row-flex"><span>秒回</span><b>' + (p.battle.regen || 0).toFixed(1) + '</b></div>' +
                         '<div class="stat-row-flex"><span>靈石加成</span><b>x' + (p.battle.moneyMul || 1).toFixed(1) + '</b></div>';
    }

    const elPts = document.getElementById('val-pts');
    if (elPts) elPts.innerText = p.data.pts;
    
    const statBox = document.getElementById('stat-list');
    if (statBox) {
        statBox.innerHTML = "";
        const nextBreak = GAME_DATA.CONFIG.BREAK_LV[p.data.realmIdx];
        if (p.data.lv >= nextBreak) {
            const btn = document.createElement('button');
            btn.className = "btn-primary";
            btn.style.width = "100%";
            btn.style.marginTop = "10px";
            btn.innerText = "突破至 " + GAME_DATA.REALMS[p.data.realmIdx + 1];
            btn.onclick = function() { p.breakthrough(); };
            statBox.appendChild(btn);
        } else {
            const stats = { str: "力量", vit: "體質", agi: "敏捷", int: "悟性" };
            for (let k in stats) {
                const row = document.createElement('div');
                row.className = "stat-row-flex";
                row.innerHTML = '<span>' + stats[k] + ' (' + p.data.baseStats[k] + ')</span><button onclick="_X_CORE.addStat(\'' + k + '\')">+</button>';
                statBox.appendChild(row);
            }
        }
    }

    const eSlot = document.getElementById('equipment-slots');
    if (eSlot) {
        eSlot.innerHTML = "";
        ['weapon', 'body'].forEach(function(slot) {
            const item = p.data.equips[slot];
            const div = document.createElement('div');
            div.className = "item-slot";
            div.style.marginBottom = "5px";
            if (item) {
                div.innerHTML = '<div class="item-icon">' + (slot==='weapon'?'⚔️':'🛡️') + '</div><div>' + self.getItemNameHTML(item) + '</div>';
                div.onclick = function() { self.core.inventory.showItemDetail(slot, true); };
            } else {
                div.innerHTML = '<div class="item-icon" style="opacity:0.3">' + (slot==='weapon'?'⚔️':'🛡️') + '</div><div style="color:#444">未穿戴</div>';
            }
            eSlot.appendChild(div);
        });
    }
};

UIManager.prototype.renderSkills = function() {
    const self = this;
    const p = this.core.player;
    const list = document.getElementById('learned-skills-list');
    if (!list) return;
    list.innerHTML = "";
    p.data.learnedSkills.forEach(function(sId) {
        const s = GAME_DATA.SKILLS[sId];
        const isEquipped = p.data.skills.includes(sId);
        const card = document.createElement('div');
        card.className = 'skill-card ' + (isEquipped ? 'equipped' : '');
        card.innerHTML = '<div>' + s.name + '</div><div style="font-size:10px; color:#888">' + (s.type==='passive'?'被動':'主動') + '</div>';
        card.onclick = function() { self.showSkillEquipMenu(sId); };
        list.appendChild(card);
    });
};

UIManager.prototype.showSkillEquipMenu = function(sId) {
    const self = this;
    const s = GAME_DATA.SKILLS[sId];
    if (!s) return;
    if (s.type === 'passive') {
        this.toast("被動技能永久生效", "gold"); return;
    }
    const body = s.desc + "<br><br>請選擇裝備槽位：";
    this.showModal("裝備神通：" + s.name, body, "放入槽位1", function() { self.equipSkill(sId, 0); }, null);
};

UIManager.prototype.equipSkill = function(sId, slotIdx) {
    const p = this.core.player;
    p.data.skills = p.data.skills.map(function(id) { return id === sId ? null : id; });
    p.data.skills[slotIdx] = sId;
    p.save(); this.renderAll(); this.closeModal();
    this.toast("已裝備至槽位 " + (slotIdx + 1));
};

UIManager.prototype.updateActiveSkillSlots = function() {
    const row = document.getElementById('active-skill-slots');
    if (!row) return;
    row.innerHTML = "";
    this.core.player.data.skills.forEach(function(sId) {
        const slot = document.createElement('div');
        slot.className = "skill-icon-sm";
        if (sId !== null && GAME_DATA.SKILLS[sId]) {
            slot.innerText = GAME_DATA.SKILLS[sId].name[0];
            slot.style.borderColor = "orange";
        } else {
            slot.style.opacity = "0.2"; slot.innerText = "空";
        }
        row.appendChild(slot);
    });
};

UIManager.prototype.updateHPs = function(player, monster) {
    const pHP = document.getElementById('p-hp-bar');
    const mHP = document.getElementById('m-hp-bar');
    const pTxt = document.getElementById('p-hp-txt');
    const mTxt = document.getElementById('m-hp-txt');
    
    if (pHP && pTxt) {
        const pPer = (player.battle.hp / player.battle.maxHp) * 100;
        pHP.style.width = pPer + "%";
        pTxt.innerText = Math.floor(player.battle.hp) + " / " + player.battle.maxHp;
    }
    if (mHP && mTxt && monster) {
        const mPer = (monster.hp / monster.maxHp) * 100;
        mHP.style.width = mPer + "%";
        mTxt.innerText = Math.floor(monster.hp) + " / " + monster.maxHp;
        document.getElementById('monster-name').innerText = monster.name;
        document.getElementById('monster-pic').innerText = monster.pic;
    } else if (mHP && mTxt) {
        mHP.style.width = "0%";
        mTxt.innerText = "搜尋中...";
        document.getElementById('monster-pic').innerText = "⏳";
    }
};

UIManager.prototype.log = function(msg, type, color) {
    const list = document.getElementById('log-list');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'log-item ' + type;
    if (color) div.style.color = color;
    const time = new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit'});
    div.innerHTML = '[' + time + '] ' + msg;
    list.prepend(div);
    if (list.childNodes.length > 50) list.lastChild.remove();
};

UIManager.prototype.toast = function(msg, color) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'toast';
    if (color) div.style.borderColor = color; div.style.color = color || 'gold';
    div.innerText = msg;
    container.appendChild(div);
    setTimeout(function() { div.remove(); }, 1800);
};

UIManager.prototype.showModal = function(title, body, btnText, btnFn, meltFn) {
    const m = document.getElementById('item-modal');
    if (!m) return;
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    const actionBtn = document.getElementById('modal-action-btn');
    actionBtn.innerText = btnText;
    actionBtn.onclick = function() { btnFn(); _X_CORE.ui.closeModal(); };
    
    const meltBtn = document.getElementById('modal-melt-btn');
    if (meltFn) {
        meltBtn.style.display = "block";
        meltBtn.onclick = function() { meltFn(); _X_CORE.ui.closeModal(); };
    } else { meltBtn.style.display = "none"; }
    m.style.display = "flex";
};

UIManager.prototype.closeModal = function() {
    const m = document.getElementById('item-modal');
    if (m) m.style.display = "none";
};

UIManager.prototype.switchPage = function(pageId) {
    document.querySelectorAll('.stage').forEach(function(s) { s.style.display = 'none'; });
    const target = document.getElementById('p-' + pageId);
    if (target) target.style.display = 'flex';
    this.renderAll();
};

UIManager.prototype.setBagFilter = function(f, e) {
    this.currentBagFilter = f;
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    this.renderBag();
};

UIManager.prototype.renderShop = function() {
    const list = document.getElementById('shop-list');
    if (!list) return;
    list.innerHTML = "";
    GAME_DATA.SHOP_ITEMS.forEach(function(item) {
        const div = document.createElement('div');
        div.className = "item-slot";
        div.style.justifyContent = "space-between";
        div.innerHTML = '<div>' + item.name + '</div><button class="btn-primary" style="padding:4px 8px">🪙' + item.price + '</button>';
        div.onclick = function() { _X_CORE.shop.buy(item); };
        list.appendChild(div);
    });
};
