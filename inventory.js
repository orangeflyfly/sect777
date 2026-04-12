/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.4.1
 * 職責：暴力命名引擎、裝備生成、物品堆疊、熔煉與參透邏輯
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
    
    // 1. 決定本體稀有度 (0-4)
    var rRoll = Math.random();
    var baseRar = 0;
    if (rRoll < 0.02) baseRar = 4;      // 神
    else if (rRoll < 0.08) baseRar = 3; // 仙
    else if (rRoll < 0.20) baseRar = 2; // 精
    else if (rRoll < 0.50) baseRar = 1; // 良

    // 2. 根據本體稀有度決定隨機詞條數量 (神品噴出3個)
    var affixCount = GAME_DATA.RARITY[baseRar].slot || 1;
    var selectedAffixes = [];
    for (var i = 0; i < affixCount; i++) {
        var affPool = GAME_DATA.AFFIX;
        var randomAff = affPool[Math.floor(Math.random() * affPool.length)];
        // 深拷貝詞條數據
        selectedAffixes.push(JSON.parse(JSON.stringify(randomAff)));
    }

    // 3. 構建法寶數據
    var eq = {
        itemType: 'equip',
        type: type,
        baseRarity: baseRar,
        name: baseTemplate.n,
        affixes: selectedAffixes,
        count: 1,
        // 基礎數值隨等級與品級浮動
        atk: Math.floor((baseTemplate.atk || 0) * lv * (1 + baseRar * 0.2)),
        def: Math.floor((baseTemplate.def || 0) * lv * (1 + baseRar * 0.2)),
        hp: Math.floor((baseTemplate.hp || 0) * lv * (1 + baseRar * 0.2))
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
 * 物品放入邏輯 (含堆疊處理)
 */
Inventory.prototype.addItem = function(item) {
    var p = this.core.player;
    // 非裝備嘗試堆疊
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
    // 檢查儲物袋空間
    if (p.data.bag.length >= this.maxSize) {
        this.core.ui.toast("儲物袋已滿，靈氣溢散！", "red");
        return false;
    }
    p.data.bag.push(item);
    return true;
};

/**
 * 顯示物品詳情 (支持暴力名稱渲染)
 */
Inventory.prototype.showItemDetail = function(idx, isEq) {
    var self = this;
    var p = this.core.player;
    var item = isEq ? p.data.equips[idx] : p.data.bag[idx];
    if (!item) return;

    var title = "";
    var body = "";
    
    if (item.itemType === 'equip') {
        // 渲染暴力名稱
        var affs = item.affixes || [];
        for (var i = 0; i < affs.length; i++) {
            title += '<span class="affix-tag r-' + affs[i].r + '">[' + affs[i].n + ']</span>';
        }
        title += '<span class="r-' + (item.baseRarity || 0) + '">·' + item.name + '</span>';
        
        body = '<div style="color:#888; font-size:12px; margin-bottom:8px;">本體品級：' + GAME_DATA.RARITY[item.baseRarity || 0].n + '</div>';
        body += '基礎攻擊: ' + (item.atk || 0) + '<br>基礎防禦: ' + (item.def || 0) + '<br>基礎生命: ' + (item.hp || 0) + '<hr>';
        body += '<div style="color:gold;">詞條靈威：</div>';
        for (var k = 0; k < affs.length; k++) {
            var a = affs[k];
            var effectTxt = "";
            if (a.atk) effectTxt += " 攻擊x" + a.atk;
            if (a.hp) effectTxt += " 生命x" + a.hp;
            if (a.crit) effectTxt += " 暴擊+" + (a.crit*100).toFixed(0) + "%";
            if (a.dodge) effectTxt += " 閃避+" + (a.dodge*100).toFixed(1) + "%";
            if (a.lifeSteal) effectTxt += " 吸血+" + (a.lifeSteal*100).toFixed(0) + "%";
            if (a.exp) effectTxt += " 經驗x" + a.exp;
            if (a.money) effectTxt += " 靈石x" + a.money;
            body += '<div style="font-size:12px;">· [' + a.n + ']:' + effectTxt + '</div>';
        }
    } else {
        title = item.name + (item.count > 1 ? ' x' + item.count : "");
        body = item.desc || "尋常修仙之物。";
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
 * 物品使用與功法參透引導
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

        // 檢查是否已學過
        var alreadyLearned = false;
        for (var j = 0; j < p.data.learnedSkills.length; j++) {
            if (p.data.learnedSkills[j] === base.target) {
                alreadyLearned = true; break;
            }
        }
        if (alreadyLearned) {
            this.core.ui.toast("此神通早已融會貫通"); return;
        }

        if (item.count >= GAME_DATA.CONFIG.SCROLL_NEED) {
            item.count -= GAME_DATA.CONFIG.SCROLL_NEED;
            if (item.count <= 0) p.data.bag.splice(idx, 1);
            p.data.learnedSkills.push(base.target);
            p.save();
            // 關鍵：參透成功後的引導
            this.core.ui.showModal("參透成功！", "你已領悟了新的神通，實力大增。<br>是否立刻前往「神通殿」裝備此招？", "前往修為頁", function() {
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
        this.core.ui.toast("神兵上手，靈氣逼人！");
    }
};

Inventory.prototype.meltItem = function(idx) {
    var p = this.core.player;
    var item = p.data.bag[idx];
    if (!item) return;
    // 根據稀有度決定熔煉所得
    var gain = (item.itemType === 'equip') ? (item.baseRarity + 1) * 100 : 20;
    p.data.money += gain * (item.count || 1);
    p.data.bag.splice(idx, 1);
    p.save();
    this.core.ui.renderAll();
    this.core.ui.toast("熔煉完成，獲得靈石 🪙" + gain);
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
    if (r < 0.20) {
        this.addEquipment(map.lv);
    } else if (r < 0.50) {
        var dropId = map.drops[Math.floor(Math.random() * map.drops.length)];
        var base = null;
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].id === dropId) {
                base = GAME_DATA.ITEMS[i]; break;
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

/**
 * 一鍵熔煉：清理凡品與良品裝備
 */
Inventory.prototype.autoMelt = function() {
    var p = this.core.player;
    var gain = 0;
    var newBag = [];
    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        if (item.itemType === 'equip' && item.baseRarity < 2) {
            gain += (item.baseRarity + 1) * 100;
        } else {
            newBag.push(item);
        }
    }
    if (gain > 0) {
        p.data.bag = newBag;
        p.data.money += gain;
        p.save();
        this.core.ui.renderAll();
        this.core.ui.toast("一鍵熔煉完成，獲得靈石 🪙" + gain);
    } else {
        this.core.ui.toast("儲物袋中並無凡、良之器。");
    }
};
