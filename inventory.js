/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js)
 */
class Inventory {
    constructor(core) { 
        this.core = core; 
        this.maxSize = 50; 
    }

    // 掉落判定
    dropLoot(mapId) {
        if (this.core.player.data.bag.length >= this.maxSize) return;
        var map = GAME_DATA.MAPS[mapId];
        var roll = Math.random();
        
        if (roll < 0.3) {
            this.addEquipment(map.lv);
        } else if (roll < 0.6) {
            var dropPool = map.drops;
            var randomIdx = Math.floor(Math.random() * dropPool.length);
            var item = GAME_DATA.ITEMS.find(function(i) { return i.id === dropPool[randomIdx]; });
            
            if (item) {
                var newItem = JSON.parse(JSON.stringify(item));
                newItem.itemType = item.type;
                this.core.player.data.bag.push(newItem);
                this.core.ui.log("獲得：" + item.name, 'loot');
            }
        }
    }

    // 使用物品 (參透或穿戴)
    useItem(index) {
        var p = this.core.player;
        var item = p.data.bag[index];
        if (!item) return;

        if (item.itemType === 'scroll') {
            if (p.data.learnedSkills.indexOf(item.target) !== -1) {
                this.core.ui.toast("此功法已學會", "#888");
                return;
            }
            p.data.learnedSkills.push(item.target);
            p.data.bag.splice(index, 1);
            this.core.ui.toast("參透成功：" + item.name, "gold");
            this.core.ui.log("您領悟了新功法！可前往【修為】頁面裝配。", "system", "gold");
        } else if (item.itemType === 'equip') {
            var old = p.data.equips[item.type];
            p.data.equips[item.type] = item;
            p.data.bag.splice(index, 1);
            if (old) p.data.bag.push(old);
            this.core.ui.toast("裝備：" + item.name);
        }
        p.refresh();
        p.save();
        this.core.ui.renderAll();
    }

    // 生成隨機裝備 (已拆解長公式防止報錯)
    addEquipment(lv) {
        var type = Math.random() > 0.5 ? 'weapon' : 'body';
        var roll = Math.random();
        var rarity = 0;
        if (roll < 0.02) rarity = 4; 
        else if (roll < 0.08) rarity = 3; 
        else if (roll < 0.2) rarity = 2; 
        else if (roll < 0.5) rarity = 1;

        var pre = GAME_DATA.AFFIX.PREFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.PREFIX.length)];
        var suf = GAME_DATA.AFFIX.SUFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.SUFFIX.length)];
        
        var baseMul = (rarity + 1) * lv;
        var eqAtk = Math.floor((pre.atk || 1) * (suf.atk || 5) * baseMul);
        var eqDef = Math.floor((pre.def || 1) * (suf.def || 5) * baseMul);
        var eqHp = Math.floor((pre.hp || 1) * (suf.hp || 5) * baseMul * 10);

        var eq = { 
            uid: Date.now() + Math.random(), 
            type: type, 
            rarity: rarity, 
            name: pre.n + suf.n, 
            atk: eqAtk, 
            def: eqDef, 
            hp: eqHp, 
            itemType: 'equip' 
        };

        if (rarity >= 3) {
            if (type === 'body' && Math.random() < 0.5) { eq.regen = 5 * lv; eq.name += "(回春)"; }
            if (type === 'body' && rarity === 4) { eq.dmgFloorReduce = 0.001; eq.name = "【欺天】" + eq.name; }
            if (type === 'weapon' && Math.random() < 0.3) { eq.lifeSteal = 0.05; eq.name += "(嗜血)"; }
        }
        this.core.player.data.bag.push(eq);
        this.core.ui.log("獲得裝備：" + eq.name, 'loot', GAME_DATA.RARITY[rarity].c);
    }

    unequip(type) {
        var p = this.core.player;
        var item = p.data.equips[type];
        if (item && p.data.bag.length < this.maxSize) {
            p.data.bag.push(item); 
            p.data.equips[type] = null;
            p.refresh(); 
            this.core.ui.renderAll();
        }
    }

    autoMelt() {
        var gain = 0;
        this.core.player.data.bag = this.core.player.data.bag.filter(function(i) {
            if (i.itemType === 'equip' && i.rarity < 2) { 
                gain += (i.rarity + 1) * 20; 
                return false; 
            }
            return true;
        });
        this.core.player.data.money += gain;
        this.core.ui.toast("熔煉完成，獲得 " + gain + " 靈石"); 
        this.core.ui.renderAll();
    }
}
