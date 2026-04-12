/**
 * 宗門修仙錄 - 畫面渲染模組 (ui.js) V1.3.1
 * 職責：同步數據與介面、處理分頁切換、過濾儲物袋與日誌
 */
function UIManager(core) {
    this.core = core;
    this.bagFilter = 'all'; // 儲物袋過濾狀態：all, equip, scroll, material
}

/**
 * 總渲染入口：更新所有可見數值
 */
UIManager.prototype.renderAll = function() {
    const p = this.core.player;
    if(!p || !p.data) return;

    // 1. 更新頂部狀態列
    const rarity = GAME_DATA.RARITY[Math.min(4, Math.floor(p.data.lv / 10))];
    document.getElementById('val-level').innerText = `${rarity.n} (Lv.${p.data.lv})`;
    document.getElementById('val-money').innerText = "🪙 " + Math.floor(p.data.money);
    
    // 經驗條
    const expNeeded = p.data.lv * 100;
    const expPercent = Math.min(100, (p.data.exp / expNeeded) * 100);
    document.getElementById('val-exp-bar').style.width = expPercent + "%";

    // 2. 呼叫各分頁專屬渲染
    this.renderBag(p); 
    this.renderDetailedStats(p); 
    this.renderStats(p); 
    this.renderActiveSkills(p); 
    this.renderMapDropdown(p);

    // 3. 如果在商店頁面，更新商店貨架
    if (document.getElementById('p-shop').style.display !== 'none') {
        this.renderShop();
    }
};

/**
 * 修為頁面：詳細屬性表 (嚴格 Grid 對齊)
 */
UIManager.prototype.renderDetailedStats = function(p) {
    const container = document.getElementById('detail-stats-list');
    if (!container) return;
    const b = p.battle;
    
    const stats = [
        { n: "總攻擊", v: b.atk, c: "#eee" },
        { n: "總防禦", v: b.def, c: "#eee" },
        { n: "閃避率", v: (b.dodge * 100).toFixed(1) + "%", c: "cyan" },
        { n: "吸血率", v: (b.lifeSteal * 100).toFixed(0) + "%", c: "#ff4d4d" },
        { n: "秒回血", v: b.regen.toFixed(1), c: "#4caf50" },
        { n: "經驗倍率", v: "x" + b.expMul.toFixed(2), c: "gold" }
    ];

    let html = "";
    stats.forEach(s => {
        html += `<div class="stat-row-flex"><span>${s.n}</span><b style="color:${s.c}">${s.v}</b></div>`;
    });
    container.innerHTML = html;
};

/**
 * 儲物袋：支援分類篩選與疊加顯示 (xN)
 */
UIManager.prototype.renderBag = function(p) {
    const grid = document.getElementById('bag-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // 執行分類過濾
    const filteredItems = p.data.bag.filter(item => {
        if (this.bagFilter === 'all') return true;
        return item.itemType === this.bagFilter;
    });

    document.getElementById('bag-count').innerText = p.data.bag.length;

    filteredItems.forEach((item) => {
        // 找到該物品在原始陣列中的索引，確保彈窗能正確操作
        const realIdx = p.data.bag.indexOf(item);
        const slot = document.createElement('div');
        slot.className = `item-slot rarity-${item.rarity || 0}`;
        
        let icon = "📦";
        let typeTag = "";
        if (item.itemType === 'equip') {
            icon = item.type === 'weapon' ? '🗡️' : '👕';
            typeTag = "【裝備】";
        } else if (item.itemType === 'scroll') {
            icon = "📜";
            typeTag = "【殘卷】";
        } else {
            icon = "💎";
            typeTag = "【材料】";
        }

        const countTag = (item.count > 1) ? ` <span style="color:#4caf50">x${item.count}</span>` : '';
        
        slot.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-info-main">
                <div class="item-name-text">${typeTag}${item.name}${countTag}</div>
                <div class="item-stats-text">${item.itemType === 'equip' ? '點擊查看詳情' : '疊加物品'}</div>
            </div>`;
        
        slot.onclick = () => this.core.inventory.showItemDetail(realIdx, false);
        grid.appendChild(slot);
    });
};

/**
 * 設定儲物袋過濾器
 */
UIManager.prototype.setBagFilter = function(filter, event) {
    this.bagFilter = filter;
    // 更新按鈕樣式
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(b => b.classList.remove('active'));
    if(event) event.target.classList.add('active');
    
    this.renderBag(this.core.player);
};

/**
 * 修為頁面：潛能加點與當前武裝
 */
UIManager.prototype.renderStats = function(p) {
    document.getElementById('val-pts').innerText = p.data.pts;
    const statList = document.getElementById('stat-list');
    if (statList) {
        statList.innerHTML = '';
        const names = { str: '力量', vit: '體質', agi: '身法', int: '悟性' };
        ['str', 'vit', 'agi', 'int'].forEach(k => {
            const div = document.createElement('div');
            div.className = 'stat-row-flex';
            div.innerHTML = `
                <span>${names[k]}: <b>${p.data.baseStats[k]}</b></span>
                <button onclick="_X_CORE.addStat('${k}')">修煉 +</button>`;
            statList.appendChild(div);
        });
    }

    const eqArea = document.getElementById('equipment-slots');
    if (eqArea) {
        eqArea.innerHTML = '<h5 style="margin:10px 0; color:gold;">▶ 當前穿戴</h5>';
        ['weapon', 'body'].forEach(type => {
            const eq = p.data.equips[type];
            const div = document.createElement('div');
            div.className = `item-slot ${eq ? 'rarity-' + eq.rarity : ''}`;
            const icon = type === 'weapon' ? '⚔️' : '🛡️';
            div.innerHTML = `
                <div class="item-icon">${icon}</div>
                <div class="item-info-main">
                    <div class="item-name-text">${eq ? eq.name : '（空位）'}</div>
                    <div class="item-stats-text">${eq ? '點擊可卸下' : '尚未裝備'}</div>
                </div>`;
            div.onclick = () => { if(eq) this.core.inventory.showItemDetail(type, true); };
            eqArea.appendChild(div);
        });
    }
};

/**
 * 萬寶閣渲染
 */
UIManager.prototype.renderShop = function() {
    const shopGrid = document.getElementById('shop-list');
    if(!shopGrid) return;
    shopGrid.innerHTML = '';

    GAME_DATA.SHOP_ITEMS.forEach(item => {
        const slot = document.createElement('div');
        slot.className = "item-slot rarity-2"; // 商店商品統一使用藍色精品框
        slot.innerHTML = `
            <div class="item-icon">💰</div>
            <div class="item-info-main">
                <div class="item-name-text">${item.name}</div>
                <div class="item-stats-text">價格: 🪙${item.price}</div>
            </div>`;
        slot.onclick = () => this.core.shop.buy(item);
        shopGrid.appendChild(slot);
    });
};

/**
 * 切換分頁
 */
UIManager.prototype.switchPage = function(id) {
    const stages = document.querySelectorAll('.stage');
    stages.forEach(s => s.style.display = 'none');
    
    const target = document.getElementById("p-" + id);
    if (target) {
        target.style.display = 'flex';
        // 若切換到商店，強制重新繪製一次商品
        if (id === 'shop') this.renderShop();
    }
    this.renderAll();
};

/**
 * 通用彈窗顯示
 */
UIManager.prototype.showModal = function(title, body, actionText, actionFn, meltFn) {
    const modal = document.getElementById('item-modal');
    modal.style.display = 'flex';
    document.getElementById('modal-item-name').innerHTML = title;
    document.getElementById('modal-item-desc').innerHTML = body;
    
    const btnAct = document.getElementById('modal-action-btn');
    btnAct.innerText = actionText;
    btnAct.onclick = () => { actionFn(); this.closeModal(); };
    
    const btnMelt = document.getElementById('modal-melt-btn');
    if (meltFn) { 
        btnMelt.style.display = 'block'; 
        btnMelt.onclick = () => { meltFn(); this.closeModal(); }; 
    } else { 
        btnMelt.style.display = 'none'; 
    }
};

UIManager.prototype.closeModal = function() {
    document.getElementById('item-modal').style.display = 'none';
};

/**
 * 日誌紀錄
 */
UIManager.prototype.log = function(msg, type, color) {
    const list = document.getElementById('log-list');
    if(!list) return;
    const div = document.createElement('div');
    div.className = `log-item log-type-${type || 'system'}`;
    div.style.color = color || '#eee';
    div.innerHTML = `<small>[${new Date().toLocaleTimeString([], { hour12: false })}]</small> ${msg}`;
    list.prepend(div);
    if (list.children.length > 50) list.lastChild.remove();
};

/**
 * 日誌分類過濾
 */
UIManager.prototype.switchLog = function(tab, event) {
    const items = document.getElementById('log-list').children;
    const tabs = document.querySelectorAll('.log-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if(event) event.target.classList.add('active');
    
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = (tab === 'all' || items[i].classList.contains('log-type-' + tab)) ? 'block' : 'none';
    }
};

/**
 * 畫面頂部通知 (Toast)
 */
UIManager.prototype.toast = function(msg, color) {
    // 同步發送到系統日誌
    this.log(msg, 'system', color);
    
    const box = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = 'toast';
    div.style.color = color || 'gold';
    div.innerText = msg;
    box.appendChild(div);
    
    // 1.5秒後自動消失
    setTimeout(() => div.remove(), 1500);
};

/**
 * 血條同步更新
 */
UIManager.prototype.updateHPs = function(p, m) {
    // 1. 玩家血條
    const pFill = document.getElementById('p-hp-bar');
    const pTxt = document.getElementById('p-hp-txt');
    if (pFill) pFill.style.width = (p.battle.hp / p.battle.maxHp * 100) + "%";
    if (pTxt) pTxt.innerText = `${Math.floor(p.battle.hp)} / ${p.battle.maxHp}`;
    
    // 2. 怪物血條
    const mFill = document.getElementById('m-hp-bar');
    const mTxt = document.getElementById('m-hp-txt');
    const mName = document.getElementById('monster-name');
    
    if (m && m.hp > 0) {
        if (mFill) mFill.style.width = (m.hp / m.maxHp * 100) + "%";
        if (mTxt) mTxt.innerText = `${Math.floor(m.hp)} / ${m.maxHp}`;
        if (mName) mName.innerText = m.name;
    } else {
        if (mFill) mFill.style.width = "0%";
        if (mTxt) mTxt.innerText = "搜尋妖獸中...";
        if (mName) mName.innerText = "歷練中...";
    }
};

UIManager.prototype.renderMonster = function(m) {
    document.getElementById('monster-pic').innerText = m ? m.pic : "⏳";
};

UIManager.prototype.renderActiveSkills = function(p) {
    const box = document.getElementById('active-skill-slots');
    if (!box) return; box.innerHTML = '';
    p.data.skills.forEach(sId => {
        const slot = document.createElement('div');
        slot.style = "width:30px; height:30px; border:1px solid #444; border-radius:4px; display:inline-flex; align-items:center; justify-content:center; margin-right:5px; font-size:16px; background:#222;";
        if (sId !== null) {
            const s = GAME_DATA.SKILLS[sId];
            slot.innerText = s.type === 'passive' ? '🧘' : '🔥';
            slot.title = s.name;
        }
        box.appendChild(slot);
    });
};

UIManager.prototype.renderMapDropdown = function(p) {
    const sel = document.getElementById('map-select-dropdown');
    if (!sel || sel.children.length > 0) return;
    GAME_DATA.MAPS.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.innerText = `${m.name} (Lv.${m.lv})`;
        if (p.data.mapId === m.id) opt.selected = true;
        sel.appendChild(opt);
    });
};
