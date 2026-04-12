/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js)
 * 採用古法兼容語法，確保經脈暢通
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = 50;
}

// 1. 掉落判定 (使用標準迴圈取代 find)
Inventory.prototype.dropLoot = function(mapId) {
    var p = this.core.player;
    if (p.data.bag.length >= this.maxSize) {
        return;
    }

    var map = GAME_DATA.MAPS[mapId];
    var roll = Math.random();

    if (roll < 0.3) {
        this.addEquipment(map.lv);
    } else if (roll < 0.6) {
        var dropPool = map.drops;
        var randomId = dropPool[Math.floor(Math.random() * dropPool.length)];
        var item = null;

        // 古法搜尋物品
        for (var i = 0; i < GAME_DATA.ITEMS.length; i++) {
            if (GAME_DATA.ITEMS[i].id === randomId) {
                item = GAME_DATA.ITEMS[i];
                break;
            }
        }

        if (item) {
            var newItem = {
                id: item.id,
                name: item.name,
                price: item.price,
                type: item.type,
                target: item.target,
                itemType: item.type
            };
            p.data.bag.push(newItem);
            this.core.ui.log("獲得：" + item.name, 'loot');
        }
    }
};

// 2. 使用物品 (參透殘卷或穿戴裝備)
Inventory.prototype.useItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    if (!item) return;

    if (item.itemType === 'scroll') {
        // 學習功法判定
        var alreadyLearned = false;
        for (var i = 0; i < p.data.learnedSkills.length; i++) {
            if (p.data.learnedSkills[i] === item.target) {
                alreadyLearned = true;
                break;
            }
        }

        if (alreadyLearned) {
            this.core.ui.toast("此功法已學會", "#888");
            return;
        }

        p.data.learnedSkills.push(item.target);
        p.data.bag.splice(index, 1);
        this.core.ui.toast("參透成功：" + item.name, "gold");
        this.core.ui.log("領悟新功法！可前往【修為】頁面裝配。", "system", "gold");
    } else if (item.itemType === 'equip') {
        // 穿戴裝備
        var type = item.type;
        var oldEquip = p.data.equips[type];
        p.data.equips[type] = item;
        p.data.bag.splice(index, 1);
        if (oldEquip) {
            p.data.bag.push(oldEquip);
        }
        this.core.ui.toast("裝備：" + item.name);
    }

    p.refresh();
    p.save();
    this.core.ui.renderAll();
};

// 3. 生成裝備 (拆解數值運算)
Inventory.prototype.addEquipment = function(lv) {
    var type = Math.random() > 0.5 ? 'weapon' : 'body';
    var roll = Math.random();
    var rarity = 0;

    if (roll < 0.02) rarity = 4;
    else if (roll < 0.08) rarity = 3;
    else if (roll < 0.20) rarity = 2;
    else if (roll < 0.50) rarity = 1;

    var preList = GAME_DATA.AFFIX.PREFIX;
    var sufList = GAME_DATA.AFFIX.SUFFIX;
    var pre = preList[Math.floor(Math.random() * preList.length)];
    var suf = sufList[Math.floor(Math.random() * sufList.length)];

    var multiplier = (rarity + 1) * lv;
    var finalAtk = Math.floor((pre.atk || 1) * (suf.atk || 5) * multiplier);
    var finalDef = Math.floor((pre.def || 1) * (suf.def || 5) * multiplier);
    var finalHp = Math.floor((pre.hp || 1) * (suf.hp || 5) * multiplier * 10);

    var eq = {
        uid: Date.now() + Math.random(),
        type: type,
        rarity: rarity,
        name: pre.n + suf.n,
        atk: finalAtk,
        def: finalDef,
        hp: finalHp,
        itemType: 'equip'
    };

    // 神級詞條
    if (rarity >= 3) {
        if (type === 'body' && Math.random() < 0.5) {
            eq.regen = 5 * lv;
            eq.name = eq.name + "(回春)";
        }
        if (type === 'body' && rarity === 4) {
            eq.dmgFloorReduce = 0.001;
            eq.name = "【欺天】" + eq.name;
        }
        if (type === 'weapon' && Math.random() < 0.3) {
            eq.lifeSteal = 0.05;
            eq.name = eq.name + "(嗜血)";
        }
    }

    this.core.player.data.bag.push(eq);
    var rarityColor = GAME_DATA.RARITY[rarity].c;
    this.core.ui.log("獲得裝備：" + eq.name, 'loot', rarityColor);
};

// 4. 卸下裝備
Inventory.prototype.unequip = function(type) {
    var p = this.core.player;
    var item = p.data.equips[type];
    if (item) {
        if (p.data.bag.length >= this.maxSize) {
            this.core.ui.toast("儲物袋已滿", "red");
            return;
        }
        p.data.bag.push(item);
        p.data.equips[type] = null;
        p.refresh();
        p.save();
        this.core.ui.renderAll();
    }
};

// 5. 一鍵熔煉 (使用標準迴圈)
Inventory.prototype.autoMelt = function() {
    var p = this.core.player;
    var newBag = [];
    var totalGain = 0;

    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        if (item.itemType === 'equip' && item.rarity < 2) {
            totalGain += (item.rarity + 1) * 20;
        } else {
            newBag.push(item);
        }
    }

    p.data.bag = newBag;
    p.data.money += totalGain;
    this.core.ui.toast("熔煉完成，獲得 " + totalGain + " 靈石");
    this.core.ui.renderAll();
};
