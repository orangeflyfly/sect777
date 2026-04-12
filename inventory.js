/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.3.0
 * 【修正】：補全所有函數，實裝物品疊加與五卷合成
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = GAME_DATA.CONFIG.MAX_BAG_SIZE;
}

// 1. 添加物品 (核心疊加邏輯)
Inventory.prototype.addItem = function(itemData) {
    var p = this.core.player;
    
    // 裝備不疊加
    if (itemData.itemType === 'equip') {
        if (p.data.bag.length >= this.maxSize) return false;
        p.data.bag.push(itemData);
        return true;
    }

    // 材料、殘卷、丹藥 嘗試疊加
    var existingItem = null;
    for (var i = 0; i < p.data.bag.length; i++) {
        if (p.data.bag[i].name === itemData.name && p.data.bag[i].itemType !== 'equip') {
            existingItem = p.data.bag[i];
            break;
        }
    }

    if (existingItem) {
        existingItem.count = (existingItem.count || 1) + (itemData.count || 1);
    } else {
        if (p.data.bag.length >= this.maxSize) return false;
        itemData.count = itemData.count || 1;
        p.data.bag.push(itemData);
    }
    return true;
};

// 2. 顯示詳情
Inventory.prototype.showItemDetail = function(indexOrType, isEquipped) {
    var p = this.core.player;
    var item = isEquipped ? p.data.equips[indexOrType] : p.data.bag[indexOrType];
    if (!item) return;

    var rarityColor = GAME_DATA.RARITY[item.rarity || 0].c;
    var countText = (item.count > 1) ? " (持有: " + item.count + ")" : "";
    var title = '<span style="color:' + rarityColor + '">' + item.name + '</span>' + countText;

    var body = "";
    var actionText = "使用";
    
    if (item.itemType === 'equip') {
        body += "類型：" + (item.type === 'weapon' ? "武器" : "法衣") + "<br>";
        if (item.atk) body += "攻擊：+" + item.atk + "<br>";
        if (item.def) body += "防禦：+" + item.def + "<br>";
        if (item.hp) body += "生命：+" + item.hp + "<br>";
        if (item.dodge) body += "閃避：+" + (item.dodge * 100).toFixed(1) + "%<br>";
        if (item.lifeSteal) body += "吸血：+" + (item.lifeSteal * 100).toFixed(0) + "%<br>";
        actionText = isEquipped ? "卸下" : "裝備";
    } else if (item.itemType === 'scroll') {
        body += "類型：功法殘卷<br>說明：湊齊 5 卷可參透對應神通。<br>當前進度：" + (item.count || 1) + " / 5";
        actionText = "參透";
    } else if (item.itemType === 'material') {
        body += "類型：煉器材料<br>說明：" + (item.desc || "野獸掉落的基礎材料。");
        actionText = "不可使用";
    }

    var self = this;
    var actionFn = function() {
        if (isEquipped) self.unequip(indexOrType);
        else self.useItem(indexOrType);
    };

    var meltFn = (!isEquipped) ? function() { self.meltItem(indexOrType); } : null;
    this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
};

// 3. 使用/參透物品
Inventory.prototype.useItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    if (!item) return;

    if (item.itemType === 'scroll') {
        if (p.data.learnedSkills.indexOf(item.target) !== -1) {
            this.core.ui.toast("此功法已學會", "#888"); return;
        }
        if ((item.count || 1) >= 5) {
            item.count -= 5;
            if (item.count <= 0) p.data.bag.splice(index, 1);
            p.data.learnedSkills.push(item.target);
            this.core.ui.log("✨ 成功參透：" + item.name, "system", "gold");
        } else {
            this.core.ui.toast("數量不足，需 5 卷", "#aaa");
        }
    } else if (item.itemType === 'equip') {
        var old = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(index, 1);
        if (old) this.addItem(old);
        this.core.ui.toast("已穿戴：" + item.name);
    }

    p.refresh(); p.save(); this.core.ui.renderAll();
};

// 4. 熔煉 (支持疊加數量)
Inventory.prototype.meltItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    if (!item) return;

    var count = item.count || 1;
    var price = 30; 
    if (item.itemType === 'equip') price = (item.rarity + 1) * 30;
    
    var totalGain = price * count;
    p.data.money += totalGain;
    p.data.bag.splice(index, 1);
    
    this.core.ui.log("熔煉 " + item.name + " x" + count + "，獲得🪙" + totalGain, "system");
    p.save(); this.core.ui.renderAll();
};

// 5. 卸下裝備
Inventory.prototype.unequip = function(type) {
    var p = this.core.player;
    var item = p.data.equips[type];
    if (item) {
        if (p.data.bag.length >= this.maxSize) { this.core.ui.toast("儲物袋已滿", "red"); return; }
        p.data.equips[type] = null;
        this.addItem(item); 
        p.refresh(); p.save(); this.core.ui.renderAll();
    }
};

// 6. 一鍵熔煉 (排除稀有裝備與材料)
Inventory.prototype.autoMelt = function() {
    var p = this.core.player;
    var gain = 0;
    var newBag = [];
    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        // 只自動熔煉 凡品與良品的裝備
        if (item.itemType === 'equip' && item.rarity < 2) {
            gain += (item.rarity + 1) * 30;
        } else {
            newBag.push(item);
        }
    }
    p.data.bag = newBag;
    p.data.money += gain;
    this.core.ui.toast("清理完畢，獲得🪙" + gain);
    this.core.ui.renderAll();
    p.save();
};

// 7. 掉落與生成
Inventory.prototype.dropLoot = function(mapId) {
    var map = GAME_DATA.MAPS[mapId];
    var roll = Math.random();
    if (roll < 0.2) { 
        this.addEquipment(map.lv);
    } else if (roll < 0.5) {
        var randId = map.drops[Math.floor(Math.random() * map.drops.length)];
        var base = null;
        for(var i=0; i<GAME_DATA.ITEMS.length; i++) {
            if(GAME_DATA.ITEMS[i].id === randId) { base = GAME_DATA.ITEMS[i]; break; }
        }
        if (base) {
            var newItem = JSON.parse(JSON.stringify(base));
            newItem.itemType = base.type;
            newItem.count = 1;
            this.addItem(newItem);
            this.core.ui.log("獲得：" + newItem.name, 'loot');
        }
    }
};

Inventory.prototype.addEquipment = function(lv) {
    var type = Math.random() > 0.5 ? 'weapon' : 'body';
    var rarRoll = Math.random();
    var rar = 0;
    if (rarRoll < 0.01) rar = 4;
    else if (rarRoll < 0.05) rar = 3;
    else if (rarRoll < 0.15) rar = 2;
    else if (rarRoll < 0.4) rar = 1;

    var prefixes = GAME_DATA.AFFIX.PREFIX;
    var pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    var suffixes = GAME_DATA.AFFIX.SUFFIX.filter(function(s) { return s.type === type; });
    var suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    var mul = (rar + 1) * lv;
    var eq = {
        uid: Date.now() + Math.random(),
        itemType: 'equip',
        type: type,
        rarity: rar,
        name: pre.n + suf.n,
        count: 1
    };

    var keys = ['atk', 'def', 'hp', 'dodge', 'lifeSteal', 'regen', 'exp', 'money'];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var baseVal = (pre[k] || 0) + (suf[k] || 0);
        if (baseVal !== 0) {
            if (['exp', 'money', 'dodge', 'lifeSteal'].indexOf(k) !== -1) {
                eq[k] = baseVal * (1 + rar * 0.2); 
            } else {
                eq[k] = Math.floor(baseVal * mul);
            }
        }
    }
    this.addItem(eq);
    this.core.ui.log("掉落法寶：" + eq.name, 'loot', GAME_DATA.RARITY[rar].c);
};
