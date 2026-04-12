/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.2
 * 修正：加入詳情彈窗、單件熔煉與分類篩選支援
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = 50;
}

// 1. 展示法寶/物品詳情彈窗
Inventory.prototype.showItemDetail = function(indexOrType, isEquipped) {
    var p = this.core.player;
    var item = null;
    var equipped = isEquipped || false;

    // 判斷是從背包點擊，還是從已裝備位點擊
    if (equipped) {
        item = p.data.equips[indexOrType];
    } else {
        item = p.data.bag[indexOrType];
    }

    if (!item) return;

    // 構建標題 (帶稀有度顏色)
    var rarityColor = GAME_DATA.RARITY[item.rarity || 0].c;
    var title = '<span style="color:' + rarityColor + '">' + item.name + '</span>';

    // 構建內文
    var body = "";
    if (item.itemType === 'equip') {
        body += "類型：" + (item.type === 'weapon' ? "武器" : "法衣") + "<br>";
        if (item.atk) body += "攻擊：+" + item.atk + "<br>";
        if (item.def) body += "防禦：+" + item.def + "<br>";
        if (item.hp) body += "生命：+" + item.hp + "<br>";
        if (item.regen) body += "秒回：+" + item.regen + "<br>";
        if (item.lifeSteal) body += "吸血：+" + (item.lifeSteal * 100) + "%<br>";
    } else if (item.itemType === 'scroll') {
        body += "描述：記載著古老功法的殘卷，參透後可習得新的神通。";
    } else {
        body += "描述：平凡的材料，或許未來有用。";
    }

    // 判斷按鈕文字與功能
    var actionText = "";
    if (equipped) {
        actionText = "卸下";
    } else {
        actionText = (item.itemType === 'equip' ? "裝備" : (item.itemType === 'scroll' ? "參透" : "使用"));
    }

    var self = this;
    var actionFn = function() {
        if (equipped) {
            self.unequip(indexOrType);
        } else {
            self.useItem(indexOrType);
        }
    };

    // 只有在背包中且是裝備時，才顯示熔煉按鈕
    var meltFn = null;
    if (!equipped && item.itemType === 'equip') {
        meltFn = function() {
            self.meltItem(indexOrType);
        };
    }

    this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
};

// 2. 使用物品 (裝備或參透)
Inventory.prototype.useItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    if (!item) return;

    if (item.itemType === 'scroll') {
        // 殘卷邏輯
        var learned = false;
        for (var i = 0; i < p.data.learnedSkills.length; i++) {
            if (p.data.learnedSkills[i] === item.target) {
                learned = true;
                break;
            }
        }
        if (learned) {
            this.core.ui.toast("此功法已了然於胸", "#888");
            return;
        }
        p.data.learnedSkills.push(item.target);
        p.data.bag.splice(index, 1);
        this.core.ui.toast("成功參透：" + item.name, "gold");
    } else if (item.itemType === 'equip') {
        // 裝備邏輯
        var old = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(index, 1);
        if (old) p.data.bag.push(old);
        this.core.ui.toast("已穿戴：" + item.name);
    }

    p.refresh();
    p.save();
    this.core.ui.renderAll();
};

// 3. 單件熔煉
Inventory.prototype.meltItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    if (!item) return;

    var gain = (item.rarity + 1) * 20;
    p.data.money += gain;
    p.data.bag.splice(index, 1);
    
    this.core.ui.toast("熔煉成功，獲得🪙" + gain);
    p.save();
    this.core.ui.renderAll();
};

// 4. 一鍵熔煉 (凡品與良品)
Inventory.prototype.autoMelt = function() {
    var p = this.core.player;
    var gain = 0;
    var newBag = [];
    
    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        if (item.itemType === 'equip' && item.rarity < 2) {
            gain += (item.rarity + 1) * 20;
        } else {
            newBag.push(item);
        }
    }
    
    p.data.bag = newBag;
    p.data.money += gain;
    this.core.ui.toast("一鍵熔煉完成，獲得🪙" + gain);
    this.core.ui.renderAll();
};

// 5. 卸下裝備
Inventory.prototype.unequip = function(type) {
    var p = this.core.player;
    var item = p.data.equips[type];
    if (item) {
        if (p.data.bag.length >= this.maxSize) {
            this.core.ui.toast("儲物袋空間不足", "red");
            return;
        }
        p.data.bag.push(item);
        p.data.equips[type] = null;
        p.refresh();
        p.save();
        this.core.ui.renderAll();
    }
};

// 6. 掉落邏輯
Inventory.prototype.dropLoot = function(mapId) {
    if (this.core.player.data.bag.length >= this.maxSize) return;
    
    var map = GAME_DATA.MAPS[mapId];
    var roll = Math.random();

    if (roll < 0.3) {
        this.addEquipment(map.lv);
    } else if (roll < 0.6) {
        var dropPool = map.drops;
        var randId = dropPool[Math.floor(Math.random() * dropPool.length)];
        var itemBase = null;
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].id === randId) {
                itemBase = GAME_DATA.ITEMS[i];
                break;
            }
        }
        if (itemBase) {
            var item = JSON.parse(JSON.stringify(itemBase));
            item.itemType = itemBase.type;
            this.core.player.data.bag.push(item);
            this.core.ui.log("獲得：" + item.name, 'loot');
        }
    }
};

// 7. 生成隨機裝備
Inventory.prototype.addEquipment = function(lv) {
    var type = Math.random() > 0.5 ? 'weapon' : 'body';
    var roll = Math.random();
    var rar = 0;
    if (roll < 0.02) rar = 4;
    else if (roll < 0.1) rar = 3;
    else if (roll < 0.3) rar = 2;
    else if (roll < 0.6) rar = 1;

    var pre = GAME_DATA.AFFIX.PREFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.PREFIX.length)];
    var suf = GAME_DATA.AFFIX.SUFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.SUFFIX.length)];
    
    var mul = (rar + 1) * lv;
    var eq = {
        uid: Date.now() + Math.random(),
        type: type,
        rarity: rar,
        name: pre.n + suf.n,
        atk: Math.floor((pre.atk || 1) * (suf.atk || 5) * mul),
        def: Math.floor((pre.def || 1) * (suf.def || 5) * mul),
        hp: Math.floor((pre.hp || 1) * (suf.hp || 5) * mul * 10),
        itemType: 'equip'
    };

    // 特殊詞條
    if (rar >= 3) {
        if (type === 'body' && Math.random() < 0.5) {
            eq.regen = 5 * lv;
            eq.name += "(回春)";
        }
        if (type === 'weapon' && Math.random() < 0.3) {
            eq.lifeSteal = 0.05;
            eq.name += "(嗜血)";
        }
    }

    this.core.player.data.bag.push(eq);
    this.core.ui.log("獲得裝備：" + eq.name, 'loot', GAME_DATA.RARITY[rar].c);
};
