/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js)
 */

class Inventory {
    constructor(player) {
        this.p = player;
        this.maxSize = 50;
    }

    // 掉落判定
    dropLoot(mapId) {
        if (this.p.data.bag.length >= this.maxSize) {
            _X_CORE.ui.log("儲物袋已滿，掉落物化為塵埃消失了...", "system", "#888");
            return;
        }

        const map = GAME_DATA.MAPS[mapId];
        const roll = Math.random();

        if (roll < 0.3) { // 30% 機率掉落裝備
            this.addEquipment(map.lv);
        } else if (roll < 0.6) { // 30% 機率掉落材料或殘卷
            const itemId = map.drops[Math.floor(Math.random() * map.drops.length)];
            const item = GAME_DATA.ITEMS.find(i => i.id === itemId);
            this.addItem(item);
        }
    }

    // 生成並添加隨機裝備
    addEquipment(lv) {
        const type = Math.random() > 0.5 ? 'weapon' : 'body';
        const rarityRoll = Math.random();
        let rarity = 0;
        if (rarityRoll < 0.01) rarity = 4;      // 1% 神品
        else if (rarityRoll < 0.05) rarity = 3; // 4% 仙品
        else if (rarityRoll < 0.15) rarity = 2; // 10% 精品
        else if (rarityRoll < 0.40) rarity = 1; // 25% 良品

        const pre = GAME_DATA.AFFIX.PREFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.PREFIX.length)];
        const suf = GAME_DATA.AFFIX.SUFFIX[Math.floor(Math.random() * GAME_DATA.AFFIX.SUFFIX.length)];
        
        const eq = {
            uid: Date.now() + Math.random(),
            type: type,
            rarity: rarity,
            name: pre.n + suf.n,
            atk: Math.floor((pre.atk || 1) * (suf.atk || 0) * lv * (rarity + 1)),
            def: Math.floor((pre.def || 1) * (suf.def || 0) * lv * (rarity + 1)),
            hp: Math.floor((pre.hp || 1) * (suf.hp || 0) * lv * 10 * (rarity + 1))
        };

        // --- 實裝：神級特殊詞條 ---
        if (rarity >= 3) { // 仙品以上有機率帶特殊詞條
            if (type === 'body' && Math.random() < 0.3) {
                eq.regen = GAME_DATA.AFFIX.SPECIAL.REGEN.base * lv;
                eq.name += "(回春)";
            }
            if (type === 'body' && rarity === 4 && Math.random() < 0.5) {
                eq.dmgFloorReduce = GAME_DATA.AFFIX.SPECIAL.HEAVEN.base;
                eq.name = "【欺天】" + eq.name;
            }
            if (type === 'weapon' && Math.random() < 0.2) {
                eq.lifeSteal = GAME_DATA.AFFIX.SPECIAL.LEECH.base;
                eq.name += "(嗜血)";
            }
        }

        this.p.data.bag.push({ ...eq, itemType: 'equip' });
        _X_CORE.ui.log(`獲得裝備：[${GAME_DATA.RARITY[rarity].n}] ${eq.name}`, 'loot', GAME_DATA.RARITY[rarity].c);
    }

    // 添加普通物品
    addItem(item) {
        this.p.data.bag.push({ ...item, itemType: item.type });
        _X_CORE.ui.log(`獲得物品：${item.name}`, 'loot', '#4caf50');
    }

    // 穿上裝備
    equip(index) {
        const item = this.p.data.bag[index];
        if (!item || item.itemType !== 'equip') return;

        const oldEquip = this.p.data.equips[item.type];
        this.p.data.equips[item.type] = item;
        this.p.data.bag.splice(index, 1);

        if (oldEquip) this.p.data.bag.push(oldEquip);

        this.p.refresh();
        this.p.save();
        _X_CORE.ui.toast(`裝備了 ${item.name}`);
        _X_CORE.ui.renderAll();
    }

    // 卸下裝備
    unequip(type) {
        if (this.p.data.bag.length >= this.maxSize) {
            _X_CORE.ui.toast("儲物袋空間不足");
            return;
        }
        const item = this.p.data.equips[type];
        if (item) {
            this.p.data.bag.push(item);
            this.p.data.equips[type] = null;
            this.p.refresh();
            this.p.save();
            _X_CORE.ui.renderAll();
        }
    }

    // 一鍵熔煉 (根據宗主指示：熔煉精品(2)以下)
    autoMelt() {
        let count = 0;
        let gain = 0;
        this.p.data.bag = this.p.data.bag.filter(item => {
            if (item.itemType === 'equip' && item.rarity < 2) {
                count++;
                gain += (item.rarity + 1) * 20;
                return false;
            }
            return true;
        });
        this.p.data.money += gain;
        _X_CORE.ui.toast(`熔煉完成：清理了 ${count} 件雜物，獲得 ${gain} 靈石`);
        _X_CORE.ui.renderAll();
    }
}

console.log("[系統] 儲物袋 (inventory.js) 已就緒");

