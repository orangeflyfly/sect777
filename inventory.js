class Inventory {
    constructor(core) { this.core = core; this.maxSize = 50; }
    dropLoot(mapId) {
        if (this.core.player.data.bag.length >= this.maxSize) return;
        const map = GAME_DATA.MAPS[mapId]; const roll = Math.random();
        if (roll < 0.3) this.addEquipment(map.lv);
        else if (roll < 0.6) {
            const item = GAME_DATA.ITEMS.find(i => i.id === map.drops[Math.floor(Math.random() * map.drops.length)]);
            this.core.player.data.bag.push({...item, itemType: item.type});
            this.core.ui.log(`獲得：${item.name}`, 'loot');
        }
    }
    addEquipment(lv) {
        const type = Math.random() > 0.5 ? 'weapon' : 'body';
        const rarityRoll = Math.random();
        let rarity = 0;
        if (rarityRoll < 0.02) rarity = 4; else if (rarityRoll < 0.08) rarity = 3; else if (rarityRoll < 0.2) rarity = 2; else if (rarityRoll < 0.5) rarity = 1;
        const pre = GAME_DATA.AFFIX.PREFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.PREFIX.length)];
        const suf = GAME_DATA.AFFIX.SUFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.SUFFIX.length)];
        let eq = { uid: Date.now()+Math.random(), type, rarity, name: pre.n+suf.n, atk: Math.floor((pre.atk||1)*(suf.atk||5)*lv*(rarity+1)), def: Math.floor((pre.def||1)*(suf.def||5)*lv*(rarity+1)), hp: Math.floor((pre.hp||1)*(suf.hp||5)*lv*10*(rarity+1)), itemType:'equip' };
        if (rarity >= 3) {
            if (type === 'body' && Math.random() < 0.5) { eq.regen = 5 * lv; eq.name += "(回春)"; }
            if (type === 'body' && rarity === 4) { eq.dmgFloorReduce = 0.001; eq.name = "【欺天】"+eq.name; }
            if (type === 'weapon' && Math.random() < 0.3) { eq.lifeSteal = 0.05; eq.name += "(嗜血)"; }
        }
        this.core.player.data.bag.push(eq);
        this.core.ui.log(`獲得裝備：${eq.name}`, 'loot', GAME_DATA.RARITY[rarity].c);
    }
    equip(index) {
        const item = this.core.player.data.bag[index]; if (!item || item.itemType !== 'equip') return;
        const old = this.core.player.data.equips[item.type];
        this.core.player.data.equips[item.type] = item;
        this.core.player.data.bag.splice(index, 1);
        if (old) this.core.player.data.bag.push(old);
        this.core.player.refresh(); this.core.ui.renderAll();
    }
    unequip(type) {
        const item = this.core.player.data.equips[type];
        if (item && this.core.player.data.bag.length < this.maxSize) {
            this.core.player.data.bag.push(item); this.core.player.data.equips[type] = null;
            this.core.player.refresh(); this.core.ui.renderAll();
        }
    }
    autoMelt() {
        this.core.player.data.bag = this.core.player.data.bag.filter(i => {
            if (i.itemType === 'equip' && i.rarity < 2) { this.core.player.data.money += 20; return false; }
            return true;
        });
        this.core.ui.toast("熔煉雜物完成"); this.core.ui.renderAll();
    }
}
