/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.4
 * 職責：處理暴力命名引擎、物品堆疊、裝備生成與使用邏輯
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = GAME_DATA.CONFIG.MAX_BAG;
}

/**
 * 暴力命名引擎：生成 [詞條]·名稱
 */
Inventory.prototype.addEquipment = function(lv) {
    var p = this.core.player;
    var type = Math.random() > 0.5 ? 'weapon' : 'body';
    var baseList = GAME_DATA.BASES[type];
    var baseTemplate = baseList[Math.floor(Math.random() * baseList.length)];
    
    // 決定本體稀有度
    var rRoll = Math.random();
    var baseRar = 0;
    if (rRoll < 0.02) baseRar = 4;
    else if (rRoll < 0.08) baseRar = 3;
    else if (rRoll < 0.20) baseRar = 2;
    else if (rRoll < 0.50) baseRar = 1;

    // 根據稀有度決定詞條數量
    var affixCount = GAME_DATA.RARITY[baseRar].slot || 1;
    var selectedAffixes = [];
    for (var i = 0; i < affixCount; i++) {
        var aff = GAME_DATA.AFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.length)];
        // 手動深拷貝，避免直接引用原始數據
        var affClone = JSON.parse(JSON.stringify(aff));
        selectedAffixes.push(affClone);
    }

    // 構建裝備物件 (不使用 ... 擴展運算符)
    var eq = {
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
        var displayName = "";
        for (var j = 0; j < eq.affixes.length; j++) {
            displayName += "[" + eq.affixes[j].n + "]";
        }
        displayName += "·" + eq.name;
        this.core.ui.log("獲得法寶：" + displayName, 'loot', GAME_DATA.RARITY[baseRar].c);
    }
};

/**
 * 物品放入邏輯
 */
Inventory.prototype.addItem = function(item) {
    var p = this.core.player;
    // 非裝備嘗試疊加
    if (item.itemType !== 'equip') {
        var exist = null;
        for (var i = 0; i < p.data.bag.length; i++) {
            if (p.data.bag[i].name === item.name && p.data.bag[i].itemType !== 'equip') {
                exist = p.data.bag[i];
                break;
            }
        }
        if (exist) {
            exist.count += (item.count || 1);
            return true;
        }
    }
    // 檢查背包空間
    if (p.data.bag.length >= this.maxSize) {
        this.core.ui.toast("儲物袋已滿！", "red");
        return false;
    }
    p.data.bag.push(item);
    return true;
};

/**
 * 顯示詳情 (兼容雙色名稱渲染)
 */
Inventory.prototype.showItemDetail = function(idx, isEq) {
    var self = this;
    var p = this.core.player;
    var item = isEq ? p.data.equips[idx] : p.data.bag[idx];
    if (!item) return;

    var title = "";
    var body = "";
    
    if (item.itemType === 'equip') {
        var affs = item.affixes || [];
        for (var i = 0; i < affs.length; i++) {
            title += '<span class="affix-tag r-' + affs[i].r + '">[' + affs[i].n + ']</span>';
        }
        title += '<span class="r-' + (item.baseRarity || 0) + '">·' + item.name + '</span>';
        
        body = '<div style="color:#888; font-size:12px; margin-bottom:8px;">品級：' + GAME_DATA.RARITY[item.baseRarity || 0].n + '</div>';
        body += '基礎攻擊: ' + (item.atk || 0) + '<br>基礎防禦: ' + (item.def || 0) + '<br>基礎生命: ' + (item.hp || 0) + '<hr>';
        body += '<div style="color:gold;">詞條加成：</div>';
        for (var k = 0; k < affs.length; k++) {
            var a = affs[k];
            if (a.atk) body += '· 攻擊倍率: x' + a.atk + '<br>';
            if (a.crit) body += '· 暴擊機率: +' + (a.crit * 100).toFixed(0) + '%<br>';
            if (a.dodge) body += '· 閃避機率: +' + (a.dodge * 100).toFixed(1) + '%<br>';
            if (a.lifeSteal) body += '· 吸血率: +' + (a.lifeSteal * 100).toFixed(0) + '%<br>';
        }
    } else {
        title = item.name + (item.count > 1 ? ' x' + item.count : "");
        body = item.desc || "尋常之物。";
    }

    var actionText = (item.itemType === 'equip') ? (isEq ? "卸下" : "穿戴") : 
                     (item.itemType === 'scroll' ? "參透功法" : "不可使用");
    
    var actionFn = function() {
        if (isEq) self.unequip(idx);
        else self.useItem(idx);
    };

    var meltFn = (!isEq) ? function() { self.meltItem(idx); } : null;
    this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
};

/**
 * 物品使用與功法參透
 */
Inventory.prototype.useItem = function(idx) {
    var self = this;
    var p = this.core.player;
    var item = p.data.bag[idx];
    if (!item) return;

    if (item.itemType === 'scroll') {
        var base = null;
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].name === item.name) {
                base = GAME_DATA.ITEMS[i];
                break;
            }
        }
        if (!base) return;

        if (p.data.learnedSkills.indexOf(base.target) !== -1) {
            this.core.ui.toast("已習得此神通");
            return;
        }

        if (item.count >= GAME_DATA.CONFIG.SCROLL_NEED) {
            item.count -= GAME_DATA.CONFIG.SCROLL_NEED;
            if (item.count <= 0) p.data.bag.splice(idx, 1);
            p.data.learnedSkills.push(base.target);
            p.save();
            this.core.ui.showModal("參透成功！", "你已領悟新神通。<br>是否立刻前往「神通殿」裝備？", "前往修為頁", function() {
                _X_CORE.ui.switchPage('stats');
            }, null);
        } else {
            this.core.ui.toast("殘卷不足 (需" + GAME_DATA.CONFIG.SCROLL_NEED + "卷)");
        }
    } else if (item.itemType === 'equip') {
        var old = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(idx, 1);
        if (old) this.addItem(old);
        p.refresh();
        p.save();
        this.core.ui.renderAll();
        this.core.ui.toast("裝備成功");
    }
};

Inventory.prototype.meltItem = function(idx) {
    var p = this.core.player;
    var item = p.data.bag[idx];
    if (!item) return;
    var gain = (item.itemType === 'equip') ? (item.baseRarity + 1) * 50 : 20;
    p.data.money += gain * (item.count || 1);
    p.data.bag.splice(idx, 1);
    p.save();
    this.core.ui.renderAll();
    this.core.ui.toast("熔煉獲得 🪙" + gain);
};

Inventory.prototype.unequip = function(type) {
    var p = this.core.player;
    var item = p.data.equips[type];
    if (item && this.addItem(item)) {
        p.data.equips[type] = null;
        p.refresh();
        p.save();
        this.core.ui.renderAll();
    }
};

Inventory.prototype.dropLoot = function(mapId) {
    var map = GAME_DATA.MAPS[mapId];
    var r = Math.random();
    if (r < 0.15) {
        this.addEquipment(map.lv);
    } else if (r < 0.45) {
        var dropId = map.drops[Math.floor(Math.random() * map.drops.length)];
        var base = null;
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].id === dropId) {
                base = GAME_DATA.ITEMS[i];
                break;
            }
        }
        if (base) {
            var newItem = JSON.parse(JSON.stringify(base));
            newItem.itemType = base.type;
            newItem.count = 1;
            this.addItem(newItem);
            this.core.ui.log("獲得：" + base.name, 'loot');
        }
    }
};

Inventory.prototype.autoMelt = function() {
    var p = this.core.player;
    var gain = 0;
    var newBag = [];
    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        if (item.itemType === 'equip' && item.baseRarity < 2) {
            gain += (item.baseRarity + 1) * 50;
        } else {
            newBag.push(item);
        }
    }
    if (gain > 0) {
        p.data.bag = newBag;
        p.data.money += gain;
        p.save();
        this.core.ui.renderAll();
        this.core.ui.toast("一鍵清空，獲得 🪙" + gain);
    }
};
