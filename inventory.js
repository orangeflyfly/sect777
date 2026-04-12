class Inventory {
    constructor(core) { this.core = core; this.maxSize = 50; }

    // 展示詳情彈窗
    showItemDetail(indexOrType, isEquipped = false) {
        var p = this.core.player;
        var item = isEquipped ? p.data.equips[indexOrType] : p.data.bag[indexOrType];
        if (!item) return;

        var title = `<span class="rarity-${item.rarity || 0}">${item.name}</span>`;
        var body = "";
        
        if (item.itemType === 'equip') {
            body += `類型: ${item.type === 'weapon' ? '武器' : '法衣'}<br>`;
            if (item.atk) body += `攻擊: +${item.atk}<br>`;
            if (item.def) body += `防禦: +${item.def}<br>`;
            if (item.hp) body += `生命: +${item.hp}<br>`;
            if (item.regen) body += `回血: +${item.regen}<br>`;
            if (item.lifeSteal) body += `吸血: +${item.lifeSteal * 100}%<br>`;
        } else {
            body += `描述: 這是 ${item.name} 的殘卷，可用於參透功法。`;
        }

        var actionText = isEquipped ? "卸下" : (item.itemType === 'equip' ? "裝備" : "參透");
        var actionFn = () => {
            if (isEquipped) this.unequip(indexOrType);
            else this.useItem(indexOrType);
        };
        
        var meltFn = isEquipped ? null : () => this.meltItem(indexOrType);

        this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
    }

    useItem(index) {
        var p = this.core.player;
        var item = p.data.bag[index];
        if (item.itemType === 'scroll') {
            if (p.data.learnedSkills.includes(item.target)) return this.core.ui.toast("已學會");
            p.data.learnedSkills.push(item.target);
            p.data.bag.splice(index, 1);
            this.core.ui.toast("參透成功", "gold");
        } else {
            var old = p.data.equips[item.type];
            p.data.equips[item.type] = item;
            p.data.bag.splice(index, 1);
            if (old) p.data.bag.push(old);
            this.core.ui.toast("已裝備");
        }
        p.refresh(); p.save(); this.core.ui.renderAll();
    }

    meltItem(index) {
        var item = this.core.player.data.bag[index];
        var gain = (item.rarity + 1) * 20;
        this.core.player.data.money += gain;
        this.core.player.data.bag.splice(index, 1);
        this.core.ui.toast(`熔煉成功，獲得🪙${gain}`);
        this.core.player.save(); this.core.ui.renderAll();
    }

    unequip(type) {
        var p = this.core.player;
        var item = p.data.equips[type];
        if (item && p.data.bag.length < this.maxSize) {
            p.data.bag.push(item); p.data.equips[type] = null;
            p.refresh(); p.save(); this.core.ui.renderAll();
        }
    }

    autoMelt() {
        var p = this.core.player;
        var gain = 0;
        p.data.bag = p.data.bag.filter(item => {
            if (item.itemType === 'equip' && item.rarity < 2) {
                gain += (item.rarity + 1) * 20; return false;
            }
            return true;
        });
        p.data.money += gain;
        this.core.ui.toast(`自動熔煉完成，獲得🪙${gain}`);
        this.core.ui.renderAll();
    }

    dropLoot(mapId) {
        if (this.core.player.data.bag.length >= this.maxSize) return;
        var map = GAME_DATA.MAPS[mapId];
        if (Math.random() < 0.3) this.addEquipment(map.lv);
        else if (Math.random() < 0.6) {
            var id = map.drops[Math.floor(Math.random() * map.drops.length)];
            var item = GAME_DATA.ITEMS.find(i => i.id === id);
            if (item) this.core.player.data.bag.push({...item, itemType: item.type});
        }
    }

    addEquipment(lv) {
        var type = Math.random() > 0.5 ? 'weapon' : 'body';
        var roll = Math.random();
        var rar = roll < 0.02 ? 4 : (roll < 0.1 ? 3 : (roll < 0.3 ? 2 : (roll < 0.6 ? 1 : 0)));
        var pre = GAME_DATA.AFFIX.PREFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.PREFIX.length)];
        var suf = GAME_DATA.AFFIX.SUFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.SUFFIX.length)];
        var eq = { uid: Date.now(), type, rarity: rar, name: pre.n+suf.n, atk: Math.floor((pre.atk||1)*(suf.atk||5)*lv*(rar+1)), def: Math.floor((pre.def||1)*(suf.def||5)*lv*(rar+1)), hp: Math.floor((pre.hp||1)*(suf.hp||5)*lv*10*(rar+1)), itemType: 'equip' };
        if (rar >= 3) {
            if (type === 'body' && Math.random() < 0.5) { eq.regen = 5 * lv; eq.name += "(回春)"; }
            if (type === 'weapon' && Math.random() < 0.3) { eq.lifeSteal = 0.05; eq.name += "(嗜血)"; }
        }
        this.core.player.data.bag.push(eq);
        this.core.ui.log(`獲得：${eq.name}`, 'loot', GAME_DATA.RARITY[rar].c);
    }
}
