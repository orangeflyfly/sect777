/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js)
 */
class Inventory {
    constructor(core) { 
        this.core = core; 
        this.maxSize = 50; 
    }

    // 1. 掉落判定 (加入了安全檢查)
    dropLoot(mapId) {
        if (this.core.player.data.bag.length >= this.maxSize) {
            this.core.ui.log("儲物袋已滿，機緣擦身而過...", "system", "#888");
            return;
        }

        const map = GAME_DATA.MAPS[mapId];
        if (!map) return;

        const roll = Math.random();
        if (roll < 0.3) {
            // 30% 機率掉落隨機裝備
            this.addEquipment(map.lv);
        } else if (roll < 0.6) {
            // 30% 機率掉落材料或殘卷
            const dropPool = map.drops;
            const randomId = dropPool[Math.floor(Math.random() * dropPool.length)];
            const item = GAME_DATA.ITEMS.find(i => i.id === randomId);
            
            if (item) {
                this.core.player.data.bag.push({ ...item, itemType: item.type });
                this.core.ui.log(`獲得物品：${item.name}`, 'loot', '#4caf50');
            }
        }
    }

    // 2. 生成裝備 (拆解邏輯防止編輯器報錯)
    addEquipment(lv) {
        const type = Math.random() > 0.5 ? 'weapon' : 'body';
        const rarityRoll = Math.random();
        let rarity = 0;

        // 稀有度判定
        if (rarityRoll < 0.02) rarity = 4;      // 神品
        else if (rarityRoll < 0.08) rarity = 3; // 仙品
        else if (rarityRoll < 0.20) rarity = 2; // 精品
        else if (rarityRoll < 0.50) rarity = 1; // 良品

        const prePool = GAME_DATA.AFFIX.PREFIX;
        const sufPool = GAME_DATA.AFFIX.SUFFIX;
        const pre = prePool[Math.floor(Math.random() * prePool.length)];
        const suf = sufPool[Math.floor(Math.random() * sufPool.length)];

        // 分段計算數值，確保穩定
        const mul = (rarity + 1) * lv;
        const finalAtk = Math.floor((pre.atk || 1) * (suf.atk || 1) * mul);
        const finalDef = Math.floor((pre.def || 1) * (suf.def || 1) * mul);
        const finalHp = Math.floor((pre.hp || 1) * (suf.hp || 1) * mul * 10);

        let eq = { 
            uid: Date.now() + Math.random(), 
            type: type, 
            rarity: rarity, 
            name: pre.n + suf.n, 
            atk: finalAtk, 
            def: finalDef, 
            hp: finalHp, 
            itemType: 'equip' 
        };

        // 神級特殊詞條處理
        if (rarity >= 3) {
            if (type === 'body' && Math.random() < 0.5) {
                eq.regen = 5 * lv;
                eq.name += "(回春)";
            }
            if (type === 'body' && rarity === 4) {
                eq.dmgFloorReduce = 0.001;
                eq.name = "【欺天】" + eq.name;
            }
            if (type === 'weapon' && Math.random() < 0.3) {
                eq.lifeSteal = 0.05;
                eq.name += "(嗜血)";
            }
        }

        this.core.player.data.bag.push(eq);
        const color = GAME_DATA.RARITY[rarity].c;
        this.core.ui.log(`獲得裝備：[${GAME_DATA.RARITY[rarity].n}] ${eq.name}`, 'loot', color);
    }

    // 3. 穿戴與卸下 (修正了 UI 刷新的流暢度)
    equip(index) {
        const p = this.core.player;
        const item = p.data.bag[index];
        if (!item || item.itemType !== 'equip') return;

        const old = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(index, 1);

        if (old) p.data.bag.push(old);

        p.refresh();
        this.core.ui.renderAll();
        this.core.ui.toast(`裝備：${item.name}`, GAME_DATA.RARITY[item.rarity].c);
    }

    unequip(type) {
        const p = this.core.player;
        const item = p.data.equips[type];
        if (item) {
            if (p.data.bag.length >= this.maxSize) {
                this.core.ui.toast("儲物袋已滿，無法卸下", "red");
                return;
            }
            p.data.bag.push(item);
            p.data.equips[type] = null;
            p.refresh();
            this.core.ui.renderAll();
        }
    }

    // 4. 一鍵熔煉 (修正熔煉獲得的靈石計算)
    autoMelt() {
        let meltCount = 0;
        let totalGain = 0;
        
        this.core.player.data.bag = this.core.player.data.bag.filter(i => {
            if (i.itemType === 'equip' && i.rarity < 2) {
                meltCount++;
                totalGain += (i.rarity + 1) * 20;
                return false;
            }
            return true;
        });

        this.core.player.data.money += totalGain;
        this.core.ui.toast(`熔煉了 ${meltCount} 件雜物，獲得 ${totalGain} 靈石`);
        this.core.ui.renderAll();
    }
}
