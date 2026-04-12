/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.3.0
 * 【核心修正】：實裝物品疊加系統、五卷合成邏輯、分類管理
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = GAME_DATA.CONFIG.MAX_BAG_SIZE;
}

// 1. 核心：添加物品 (含疊加邏輯)
Inventory.prototype.addItem = function(itemData) {
    var p = this.core.player;
    
    // 裝備不疊加 (因為有隨機詞條)
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

// 2. 顯示詳情 (增加數量顯示)
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
        actionText = isEquipped ? "卸下" : "裝備";
    } else if (item.itemType === 'scroll') {
        body += "類型：功法殘卷<br>說明：湊齊 5 卷可參透對應神通。<br>當前進度：" + (item.count || 1) + " / 5";
        actionText = "參透";
    } else if (item.itemType === 'material') {
        body += "類型：煉器材料<br>說明：" + (item.desc || "暫無說明。");
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

// 3. 使用物品 (實裝五卷參透)
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
    } else if (item.itemType === 'material') {
        this.core.ui.toast("材料需透過特定途徑使用", "#888");
    }

    p.refresh(); p.save(); this.core.ui.renderAll();
};

// 4. 熔煉 (支持疊加物品全部熔煉)
Inventory.prototype.meltItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    var count = item.count || 1;
    var price = 30; // 基礎價格
    if (item.itemType === 'equip') price = (item.rarity + 1) * 30;
    
    var totalGain = price * count;
    p.data.money += totalGain;
    p.data.bag.splice(index, 1);
    
    this.core.ui.log("熔煉 " + item.name + " x" + count + "，獲得🪙" + totalGain, "system");
    p.save(); this.core.ui.renderAll();
};

// 5. 掉落邏輯重聯
Inventory.prototype.dropLoot = function(mapId) {
    var map = GAME_DATA.MAPS[mapId];
    var roll = Math.random();
    
    if (roll < 0.2) { // 20% 掉裝備
        this.addEquipment(map.lv);
    } else if (roll < 0.5) { // 30% 掉落材料或殘卷
        var randId = map.drops[Math.floor(Math.random() * map.drops.length)];
        var base = GAME_DATA.ITEMS.find(function(i){ return i.id === randId; });
        if (base) {
            var newItem = JSON.parse(JSON.stringify(base));
            newItem.itemType = base.type;
            newItem.count = 1;
            this.addItem(newItem);
            this.core.ui.log("獲得：" + newItem.name, 'loot');
        }
    }
};

// (addEquipment 與 unequip 保持原樣，僅需將 unequip 中的 p.data.bag.push 改為 this.addItem)
Inventory.prototype.unequip = function(type) {
    var p = this.core.player;
    var item = p.data.equips[type];
    if (item) {
        if (p.data.bag.length >= this.maxSize) { this.core.ui.toast("儲物袋已滿", "red"); return; }
        p.data.equips[type] = null;
        this.addItem(item); // 使用 addItem 確保可能的疊加
        p.refresh(); p.save(); this.core.ui.renderAll();
    }
};

// ... addEquipment 內部的 p.data.bag.push 也請改為 this.addItem(eq)
