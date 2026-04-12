/**
 * 宗門修仙錄 - 儲物袋與裝備模組 (inventory.js) V1.2.2
 * 【核心修正】：實裝 60 種詞條隨機生成、單件熔煉與詳情彈窗
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = 50;
}

// 1. 展示法寶/物品詳情彈窗 (與 UI 聯動)
Inventory.prototype.showItemDetail = function(indexOrType, isEquipped) {
    var p = this.core.player;
    var item = isEquipped ? p.data.equips[indexOrType] : p.data.bag[indexOrType];

    if (!item) return;

    var rarityColor = GAME_DATA.RARITY[item.rarity || 0].c;
    var title = '<span style="color:' + rarityColor + '">' + item.name + '</span>';

    // 動態構建屬性描述
    var body = "";
    if (item.itemType === 'equip') {
        body += "類型：" + (item.type === 'weapon' ? "武器" : "法衣") + "<br>";
        if (item.atk) body += "攻擊：+" + item.atk + "<br>";
        if (item.def) body += "防禦：+" + item.def + "<br>";
        if (item.hp) body += "生命：+" + item.hp + "<br>";
        if (item.dodge) body += "閃避：+" + (item.dodge * 100).toFixed(1) + "%<br>";
        if (item.lifeSteal) body += "吸血：+" + (item.lifeSteal * 100).toFixed(0) + "%<br>";
        if (item.regen) body += "秒回：+" + item.regen + "<br>";
        if (item.exp && item.exp > 1) body += "修煉效率：+" + ((item.exp - 1) * 100).toFixed(0) + "%<br>";
        if (item.money && item.money > 1) body += "機緣靈石：+" + ((item.money - 1) * 100).toFixed(0) + "%<br>";
    } else if (item.itemType === 'scroll') {
        body += "描述：記載著神通奧秘的殘卷，參透後可習得新的功法。";
    }

    var actionText = isEquipped ? "卸下" : (item.itemType === 'equip' ? "裝備" : "參透");
    var self = this;
    
    // 定義動作按鈕
    var actionFn = function() {
        if (isEquipped) self.unequip(indexOrType);
        else self.useItem(indexOrType);
    };

    // 只有非裝備中的法寶才能單件熔煉
    var meltFn = (!isEquipped && item.itemType === 'equip') ? function() { self.meltItem(indexOrType); } : null;

    this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
};

// 2. 使用物品 (裝備或學習)
Inventory.prototype.useItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    if (!item) return;

    if (item.itemType === 'scroll') {
        if (p.data.learnedSkills.indexOf(item.target) !== -1) {
            this.core.ui.toast("此功法已學會", "#888"); return;
        }
        p.data.learnedSkills.push(item.target);
        p.data.bag.splice(index, 1);
        this.core.ui.toast("成功參透：" + item.name, "gold");
    } else if (item.itemType === 'equip') {
        var old = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(index, 1);
        if (old) p.data.bag.push(old);
        this.core.ui.toast("已穿戴：" + item.name);
    }

    p.refresh(); p.save(); this.core.ui.renderAll();
};

// 3. 單件熔煉
Inventory.prototype.meltItem = function(index) {
    var p = this.core.player;
    var item = p.data.bag[index];
    var gain = (item.rarity + 1) * 30;
    p.data.money += gain;
    p.data.bag.splice(index, 1);
    this.core.ui.toast("熔煉完成，獲得🪙" + gain);
    p.save(); this.core.ui.renderAll();
};

// 4. 一鍵熔煉 (凡品與良品)
Inventory.prototype.autoMelt = function() {
    var p = this.core.player;
    var gain = 0;
    var newBag = [];
    for (var i = 0; i < p.data.bag.length; i++) {
        var item = p.data.bag[i];
        if (item.itemType === 'equip' && item.rarity < 2) {
            gain += (item.rarity + 1) * 30;
        } else { newBag.push(item); }
    }
    p.data.bag = newBag; p.data.money += gain;
    this.core.ui.toast("清理完畢，共獲得🪙" + gain);
    this.core.ui.renderAll();
};

// 5. 卸下裝備
Inventory.prototype.unequip = function(type) {
    var p = this.core.player;
    var item = p.data.equips[type];
    if (item) {
        if (p.data.bag.length >= this.maxSize) { this.core.ui.toast("儲物袋已滿", "red"); return; }
        p.data.bag.push(item); p.data.equips[type] = null;
        p.refresh(); p.save(); this.core.ui.renderAll();
    }
};

// 6. 掉落與生成 (核心：60詞條隨機邏輯)
Inventory.prototype.dropLoot = function(mapId) {
    if (this.core.player.data.bag.length >= this.maxSize) return;
    var map = GAME_DATA.MAPS[mapId];
    var roll = Math.random();
    if (roll < 0.3) this.addEquipment(map.lv);
    else if (roll < 0.5) {
        var randId = map.drops[Math.floor(Math.random() * map.drops.length)];
        var base = null;
        for(var i=0; i<GAME_DATA.ITEMS.length; i++) { if(GAME_DATA.ITEMS[i].id === randId) base = GAME_DATA.ITEMS[i]; }
        if (base) {
            var item = JSON.parse(JSON.stringify(base));
            item.itemType = base.type;
            this.core.player.data.bag.push(item);
            this.core.ui.log("獲得：" + item.name, 'loot');
        }
    }
};

Inventory.prototype.addEquipment = function(lv) {
    var type = Math.random() > 0.5 ? 'weapon' : 'body';
    var rarRoll = Math.random();
    var rar = 0;
    if (rarRoll < 0.01) rar = 4;      // 神品 1%
    else if (rarRoll < 0.05) rar = 3; // 仙品 4%
    else if (rarRoll < 0.15) rar = 2; // 精品 10%
    else if (rarRoll < 0.4) rar = 1;  // 良品 25%

    // 從 60 個前綴中隨機抽取一個
    var prefixes = GAME_DATA.AFFIX.PREFIX;
    var pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    // 從對應類型的後綴中抽取
    var suffixes = GAME_DATA.AFFIX.SUFFIX.filter(function(s) { return s.type === type; });
    var suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    var mul = (rar + 1) * lv;
    var eq = {
        uid: Date.now() + Math.random(),
        itemType: 'equip',
        type: type,
        rarity: rar,
        name: pre.n + suf.n
    };

    // 繼承前綴與後綴的所有屬性並放大
    var keys = ['atk', 'def', 'hp', 'dodge', 'lifeSteal', 'regen', 'exp', 'money'];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var baseVal = (pre[k] || 0) + (suf[k] || 0);
        if (baseVal !== 0) {
            // 倍率類詞條 (exp, money, dodge, lifeSteal) 處理
            if (['exp', 'money', 'dodge', 'lifeSteal'].indexOf(k) !== -1) {
                eq[k] = baseVal * (1 + rar * 0.2); 
            } else {
                eq[k] = Math.floor(baseVal * mul);
            }
        }
    }

    this.core.player.data.bag.push(eq);
    this.core.ui.log("掉落法寶：" + eq.name, 'loot', GAME_DATA.RARITY[rar].c);
};
