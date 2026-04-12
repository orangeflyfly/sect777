/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.4
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = GAME_DATA.CONFIG.MAX_BAG;
}

/**
 * 暴力命名引擎：生成 [詞條]·名稱
 */
Inventory.prototype.addEquipment = function(lv) {
    const p = this.core.player;
    const type = Math.random() > 0.5 ? 'weapon' : 'body';
    const baseList = GAME_DATA.BASES[type];
    const baseTemplate = baseList[Math.floor(Math.random() * baseList.length)];
    
    // 決定本體稀有度
    const rRoll = Math.random();
    let baseRar = 0;
    if (rRoll < 0.02) baseRar = 4;
    else if (rRoll < 0.08) baseRar = 3;
    else if (rRoll < 0.20) baseRar = 2;
    else if (rRoll < 0.50) baseRar = 1;

    // 決定詞條數量
    const affixCount = GAME_DATA.RARITY[baseRar].slot || 1;
    const selectedAffixes = [];
    for (let i = 0; i < affixCount; i++) {
        const aff = GAME_DATA.AFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.length)];
        selectedAffixes.push(JSON.parse(JSON.stringify(aff))); // 深拷貝
    }

    const eq = {
        itemType: 'equip',
        type: type,
        baseRarity: baseRar,
        name: baseTemplate.n,
        affixes: selectedAffixes,
        count: 1,
        atk: Math.floor((baseTemplate.atk || 0) * lv),
        def: Math.floor((baseTemplate.def || 0) * lv),
        hp: Math.floor((baseTemplate.hp || 0) * lv)
    };

    if (this.addItem(eq)) {
        let displayName = "";
        eq.affixes.forEach(function(a) { displayName += "[" + a.n + "]"; });
        displayName += "·" + eq.name;
        this.core.ui.log("獲得法寶：" + displayName, 'loot', GAME_DATA.RARITY[baseRar].c);
    }
};

Inventory.prototype.addItem = function(item) {
    const p = this.core.player;
    if (item.itemType !== 'equip') {
        const exist = p.data.bag.find(function(i) { return i.name === item.name && i.itemType !== 'equip'; });
        if (exist) { exist.count += (item.count || 1); return true; }
    }
    if (p.data.bag.length >= this.maxSize) {
        this.core.ui.toast("儲物袋已滿！", "red");
        return false;
    }
    p.data.bag.push(item);
    return true;
};

Inventory.prototype.showItemDetail = function(idx, isEq) {
    const self = this;
    const p = this.core.player;
    const item = isEq ? p.data.equips[idx] : p.data.bag[idx];
    if (!item) return;

    let title = "";
    let body = "";
    
    if (item.itemType === 'equip') {
        const affixes = item.affixes || [];
        affixes.forEach(function(aff) {
            title += '<span class="affix-tag r-' + aff.r + '">[' + aff.n + ']</span>';
        });
        title += '<span class="r-' + (item.baseRarity || 0) + '">·' + item.name + '</span>';
        
        body = '<div style="color:#888; font-size:12px; margin-bottom:8px;">品級：' + GAME_DATA.RARITY[item.baseRarity || 0].n + '</div>';
        body += '基礎攻擊: ' + (item.atk || 0) + '<br>基礎防禦: ' + (item.def || 0) + '<br>基礎生命: ' + (item.hp || 0) + '<hr>';
        body += '<div style="color:gold;">詞條加成：</div>';
        affixes.forEach(function(aff) {
            if (aff.atk) body += '· 攻擊倍率: x' + aff.atk + '<br>';
            if (aff.crit) body += '· 暴擊機率: +' + (aff.crit*100).toFixed(0) + '%<br>';
            if (aff.dodge) body += '· 閃避機率: +' + (aff.dodge*100).toFixed(0) + '%<br>';
            if (aff.lifeSteal) body += '· 吸血倍率: +' + (aff.lifeSteal*100).toFixed(0) + '%<br>';
        });
    } else {
        title = item.name + (item.count > 1 ? ' x' + item.count : "");
        body = item.desc || "尋常之物。";
    }

    const actionText = (item.itemType === 'equip') ? (isEq ? "卸下" : "穿戴") : 
                       (item.itemType === 'scroll' ? "參透功法" : "不可使用");
    
    const actionFn = function() {
        if (isEq) self.unequip(idx);
        else self.useItem(idx);
    };

    const meltFn = (!isEq) ? function() { self.meltItem(idx); } : null;
    this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
};

Inventory.prototype.useItem = function(idx) {
    const p = this.core.player;
    const item = p.data.bag[idx];
    if (!item) return;

    if (item.itemType === 'scroll') {
        const base = GAME_DATA.ITEMS.find(function(i) { return i.name === item.name; });
        if (!base) return;
        if (p.data.learnedSkills.includes(base.target)) {
            this.core.ui.toast("已習得此神通"); return;
        }
        if (item.count >= GAME_DATA.CONFIG.SCROLL_NEED) {
            item.count -= GAME_DATA.CONFIG.SCROLL_NEED;
            if (item.count <= 0) p.data.bag.splice(idx, 1);
            p.data.learnedSkills.push(base.target);
            p.save();
            this.core.ui.showModal("參透成功！", "你已領悟新神通。<br>是否立刻前往「神通殿」裝備？", "前往修為頁", () => {
                _X_CORE.ui.switchPage('stats');
            }, null);
        } else {
            this.core.ui.toast("殘卷不足 (需" + GAME_DATA.CONFIG.SCROLL_NEED + "卷)");
        }
    } else if (item.itemType === 'equip') {
        const old = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(idx, 1);
        if (old) this.addItem(old);
        p.refresh(); p.save(); this.core.ui.renderAll();
        this.core.ui.toast("裝備成功");
    }
};

Inventory.prototype.meltItem = function(idx) {
    const p = this.core.player;
    const item = p.data.bag[idx];
    if (!item) return;
    const gain = (item.itemType === 'equip') ? (item.baseRarity + 1) * 50 : 20;
    p.data.money += gain * (item.count || 1);
    p.data.bag.splice(idx, 1);
    p.save(); this.core.ui.renderAll();
    this.core.ui.toast("熔煉獲得 🪙" + gain);
};

Inventory.prototype.unequip = function(type) {
    const p = this.core.player;
    const item = p.data.equips[type];
    if (item && this.addItem(item)) {
        p.data.equips[type] = null;
        p.refresh(); p.save(); this.core.ui.renderAll();
    }
};

Inventory.prototype.dropLoot = function(mapId) {
    const map = GAME_DATA.MAPS[mapId];
    const r = Math.random();
    if (r < 0.15) { this.addEquipment(map.lv); }
    else if (r < 0.45) {
        const dropId = map.drops[Math.floor(Math.random() * map.drops.length)];
        const base = GAME_DATA.ITEMS.find(function(i) { return i.id === dropId; });
        if (base) {
            this.addItem({ ...base, itemType: base.type, count: 1 });
            this.core.ui.log("獲得：" + base.name, 'loot');
        }
    }
};

Inventory.prototype.autoMelt = function() {
    const p = this.core.player;
    let gain = 0;
    p.data.bag = p.data.bag.filter(function(i) {
        if (i.itemType === 'equip' && i.baseRarity < 2) {
            gain += (i.baseRarity + 1) * 50; return false;
        }
        return true;
    });
    if (gain > 0) {
        p.data.money += gain; p.save(); this.core.ui.renderAll();
        this.core.ui.toast("一鍵清空，獲得 🪙" + gain);
    }
};
