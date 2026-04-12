/**
 * 宗門修仙錄 - 介面模組 (ui.js) V1.4
 * 職責：處理所有 DOM 更新、雙色渲染、頁籤切換與日誌過濾
 */
function UIManager(core) {
    this.core = core;
    this.currentBagFilter = 'all';
    this.currentLogFilter = 'all';
}

/**
 * 核心渲染：同步所有數據至畫面
 */
UIManager.prototype.renderAll = function() {
    const p = this.core.player;
    // 頂部資訊
    document.getElementById('val-level').innerText = `${GAME_DATA.REALMS[p.data.realmIdx]} (Lv.${p.data.lv})`;
    document.getElementById('val-money').innerText = `🪙 ${p.data.money}`;
    document.getElementById('val-exp-bar').style.width = `${(p.data.exp / (p.data.lv * 100)) * 100}%`;
    
    // 渲染各個分頁
    this.renderBag();
    this.renderStats();
    this.renderSkills();
    this.renderShop();
    this.updateActiveSkillSlots();
};

/**
 * 暴力美學：渲染 [詞條]·名稱
 */
UIManager.prototype.getItemNameHTML = function(item) {
    if (item.itemType !== 'equip') return item.name;
    let html = "";
    item.affixes.forEach(aff => {
        html += `<span class="affix-tag r-${aff.r}">[${aff.n}]</span>`;
    });
    html += `<span class="r-${item.baseRarity}">·${item.name}</span>`;
    return html;
};

UIManager.prototype.renderBag = function() {
    const p = this.core.player;
    const grid = document.getElementById('bag-grid');
    grid.innerHTML = "";
    document.getElementById('bag-count').innerText = p.data.bag.length;

    p.data.bag.forEach((item, idx) => {
        // 分類過濾
        if (this.currentBagFilter !== 'all' && item.itemType !== this.currentBagFilter) return;

        const slot = document.createElement('div');
        slot.className = `item-slot r-border-${item.baseRarity || 0}`;
        slot.style.borderLeftColor = GAME_DATA.RARITY[item.baseRarity || 0].c;
        slot.onclick = () => this.core.inventory.showItemDetail(idx, false);

        const icon = (item.itemType === 'equip') ? (item.type === 'weapon' ? "⚔️" : "🛡️") : 
                     (item.itemType === 'scroll' ? "📜" : "💎");
        
        slot.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-info">
                <div class="item-name">${this.getItemNameHTML(item)} ${item.count > 1 ? 'x'+item.count : ''}</div>
            </div>
        `;
        grid.appendChild(slot);
    });
};

UIManager.prototype.renderStats = function() {
    const p = this.core.player;
    const list = document.getElementById('detail-stats-list');
    list.innerHTML = `
        <div class="stat-row-flex"><span>攻擊</span><b>${p.battle.atk}</b></div>
        <div class="stat-row-flex"><span>防禦</span><b>${p.battle.def}</b></div>
        <div class="stat-row-flex"><span>生命</span><b>${p.battle.maxHp}</b></div>
        <div class="stat-row-flex"><span>閃避</span><b>${(p.battle.dodge*100).toFixed(1)}%</b></div>
        <div class="stat-row-flex"><span>暴擊</span><b>${(p.battle.crit*100).toFixed(0)}%</b></div>
        <div class="stat-row-flex"><span>吸血</span><b>${(p.battle.lifeSteal*100).toFixed(0)}%</b></div>
        <div class="stat-row-flex"><span>秒回</span><b>${p.battle.regen.toFixed(1)}</b></div>
        <div class="stat-row-flex"><span>靈石加成</span><b>x${p.battle.moneyMul.toFixed(1)}</b></div>
    `;

    // 潛能點與突破按鈕
    document.getElementById('val-pts').innerText = p.data.pts;
    const statBox = document.getElementById('stat-list');
    statBox.innerHTML = "";
    
    // 如果到達瓶頸，顯示突破按鈕
    const nextBreak = GAME_DATA.CONFIG.BREAK_LV[p.data.realmIdx];
    if (p.data.lv >= nextBreak) {
        const btn = document.createElement('button');
        btn.className = "btn-primary";
        btn.style.width = "100%";
        btn.style.marginTop = "10px";
        btn.style.background = "linear-gradient(45deg, #ff4500, #ff8c00)";
        btn.innerText = `突破至 ${GAME_DATA.REALMS[p.data.realmIdx + 1]}`;
        btn.onclick = () => p.breakthrough();
        statBox.appendChild(btn);
    } else {
        const stats = { str: "力量", vit: "體質", agi: "敏捷", int: "悟性" };
        for (let k in stats) {
            const row = document.createElement('div');
            row.className = "stat-row-flex";
            row.innerHTML = `<span>${stats[k]} (${p.data.baseStats[k]})</span><button onclick="_X_CORE.addStat('${k}')">+</button>`;
            statBox.appendChild(row);
        }
    }

    // 渲染裝備位
    const eSlot = document.getElementById('equipment-slots');
    eSlot.innerHTML = "";
    ['weapon', 'body'].forEach(slot => {
        const item = p.data.equips[slot];
        const div = document.createElement('div');
        div.className = "item-slot";
        div.style.marginBottom = "5px";
        if (item) {
            div.innerHTML = `<div class="item-icon">${slot==='weapon'?'⚔️':'🛡️'}</div><div>${this.getItemNameHTML(item)}</div>`;
            div.onclick = () => this.core.inventory.showItemDetail(slot, true);
        } else {
            div.innerHTML = `<div class="item-icon" style="opacity:0.3">${slot==='weapon'?'⚔️':'🛡️'}</div><div style="color:#444">未穿戴</div>`;
        }
        eSlot.appendChild(div);
    });
};

UIManager.prototype.renderSkills = function() {
    const p = this.core.player;
    const list = document.getElementById('learned-skills-list');
    list.innerHTML = "";
    p.data.learnedSkills.forEach(sId => {
        const s = GAME_DATA.SKILLS[sId];
        const isEquipped = p.data.skills.includes(sId);
        const card = document.createElement('div');
        card.className = `skill-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `<div>${s.name}</div><div style="font-size:10px; color:#888">${s.type==='passive'?'被動':'主動'}</div>`;
        card.onclick = () => this.showSkillEquipMenu(sId);
        list.appendChild(card);
    });
};

UIManager.prototype.showSkillEquipMenu = function(sId) {
    const s = GAME_DATA.SKILLS[sId];
    if (s.type === 'passive') {
        this.toast("被動技能無需裝備，參悟後永久生效", "gold");
        return;
    }
    const body = `${s.desc}<br><br>請選擇裝備槽位：`;
    this.showModal(`裝備神通：${s.name}`, body, "放入槽位1", () => this.equipSkill(sId, 0), null);
    // 這裡為了簡化，彈窗內可手動擴展多個按鈕，目前邏輯先裝在 slot 0
};

UIManager.prototype.equipSkill = function(sId, slotIdx) {
    const p = this.core.player;
    // 移除其他槽位的相同技能
    p.data.skills = p.data.skills.map(id => id === sId ? null : id);
    p.data.skills[slotIdx] = sId;
    p.save(); this.renderAll(); this.closeModal();
    this.toast(`已將 ${GAME_DATA.SKILLS[sId].name} 裝備至槽位 ${slotIdx+1}`);
};

UIManager.prototype.updateActiveSkillSlots = function() {
    const p = this.core.player;
    const row = document.getElementById('active-skill-slots');
    row.innerHTML = "";
    p.data.skills.forEach(sId => {
        const slot = document.createElement('div');
        slot.className = "skill-icon-sm";
        if (sId !== null) {
            slot.innerText = GAME_DATA.SKILLS[sId].name[0];
            slot.style.borderColor = "orange";
            slot.title = GAME_DATA.SKILLS[sId].name;
        } else {
            slot.style.opacity = "0.2";
            slot.innerText = "空";
        }
        row.appendChild(slot);
    });
};

UIManager.prototype.updateHPs = function(player, monster) {
    const pHP = document.getElementById('p-hp-bar');
    const mHP = document.getElementById('m-hp-bar');
    if (pHP) {
        const pPer = (player.battle.hp / player.battle.maxHp) * 100;
        pHP.style.width = pPer + "%";
        document.getElementById('p-hp-txt').innerText = `${Math.floor(player.battle.hp)} / ${player.battle.maxHp}`;
    }
    if (mHP && monster) {
        const mPer = (monster.hp / monster.maxHp) * 100;
        mHP.style.width = mPer + "%";
        document.getElementById('m-hp-txt').innerText = `${Math.floor(monster.hp)} / ${monster.maxHp}`;
        document.getElementById('monster-name').innerText = monster.name;
        document.getElementById('monster-pic').innerText = monster.pic;
    } else {
        if (mHP) mHP.style.width = "0%";
        document.getElementById('m-hp-txt').innerText = "搜尋中...";
        document.getElementById('monster-pic').innerText = "⏳";
    }
};

UIManager.prototype.log = function(msg, type, color) {
    const list = document.getElementById('log-list');
    const div = document.createElement('div');
    div.className = `log-item ${type}`;
    if (color) div.style.color = color;
    div.innerHTML = `[${new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`;
    list.prepend(div);
    if (list.childNodes.length > 50) list.lastChild.remove();
};

UIManager.prototype.toast = function(msg, color) {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = 'toast';
    if (color) div.style.borderColor = color; div.style.color = color || 'gold';
    div.innerText = msg;
    container.appendChild(div);
    setTimeout(() => div.remove(), 1800);
};

UIManager.prototype.showModal = function(title, body, btnText, btnFn, meltFn) {
    const m = document.getElementById('item-modal');
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    const actionBtn = document.getElementById('modal-action-btn');
    actionBtn.innerText = btnText;
    actionBtn.onclick = () => { btnFn(); this.closeModal(); };
    
    const meltBtn = document.getElementById('modal-melt-btn');
    if (meltFn) {
        meltBtn.style.display = "block";
        meltBtn.onclick = () => { meltFn(); this.closeModal(); };
    } else { meltBtn.style.display = "none"; }
    
    m.style.display = "flex";
};

UIManager.prototype.closeModal = function() { document.getElementById('item-modal').style.display = "none"; };

UIManager.prototype.switchPage = function(pageId) {
    document.querySelectorAll('.stage').forEach(s => s.style.display = 'none');
    document.getElementById('p-' + pageId).style.display = 'flex';
    this.renderAll();
};

UIManager.prototype.setBagFilter = function(f, e) {
    this.currentBagFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    this.renderBag();
};

UIManager.prototype.renderShop = function() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";
    GAME_DATA.SHOP_ITEMS.forEach(item => {
        const div = document.createElement('div');
        div.className = "item-slot";
        div.style.justifyContent = "space-between";
        div.innerHTML = `<div>${item.name}</div><button class="btn-primary" style="padding:4px 8px">🪙${item.price}</button>`;
        div.onclick = () => this.core.shop.buy(item);
        list.appendChild(div);
    });
};
