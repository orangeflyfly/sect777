/**
 * 宗門修仙錄 - 儲物袋模組 (inventory.js) V1.3.1
 * 職責：處理物品疊加、裝備生成、五卷參透與熔煉邏輯
 */
function Inventory(core) {
    this.core = core;
    this.maxSize = 50; // 儲物袋格子上限
}

/**
 * 添加物品：實裝疊加邏輯 (裝備不疊加，其餘依名稱疊加)
 */
Inventory.prototype.addItem = function(data) {
    const p = this.core.player;
    
    // 如果不是裝備，嘗試尋找同名物品進行疊加
    if (data.itemType !== 'equip') {
        const exist = p.data.bag.find(i => i.name === data.name && i.itemType !== 'equip');
        if (exist) {
            exist.count = (exist.count || 0) + (data.count || 1);
            return true;
        }
    }

    // 若無法疊加且格子已滿，則失敗
    if (p.data.bag.length >= this.maxSize) {
        return false;
    }

    // 加入新格子
    data.count = data.count || 1;
    p.data.bag.push(data);
    return true;
};

/**
 * 顯示詳情彈窗：根據物品類型（裝備/殘卷/材料）動態調整按鈕與描述
 */
Inventory.prototype.showItemDetail = function(idx, isEq) {
    const p = this.core.player;
    const item = isEq ? p.data.equips[idx] : p.data.bag[idx];
    if (!item) return;

    const rarityColor = GAME_DATA.RARITY[item.rarity || 0].c;
    const title = `<span style="color:${rarityColor}">${item.name}</span>` + (item.count > 1 ? ` x${item.count}` : "");
    
    let body = "";
    let actionText = "使用";

    if (item.itemType === 'equip') {
        body = `類型：${item.type === 'weapon' ? '武器' : '法衣'}<br>`;
        if (item.atk) body += `攻擊: +${item.atk}<br>`;
        if (item.def) body += `防禦: +${item.def}<br>`;
        if (item.hp) body += `生命: +${item.hp}<br>`;
        if (item.dodge) body += `閃避: +${(item.dodge * 100).toFixed(1)}%<br>`;
        if (item.lifeSteal) body += `吸血: +${(item.lifeSteal * 100).toFixed(0)}%<br>`;
        actionText = isEq ? "卸下" : "穿戴";
    } else if (item.itemType === 'scroll') {
        body = `類型：功法殘卷<br>說明：湊齊 5 卷可嘗試參透。<br>當前進度：<b>${item.count} / 5</b>`;
        actionText = "參透功法";
    } else {
        body = `類型：煉器材料<br>說明：${item.desc || "暫無說明"}`;
        actionText = "不可直接使用";
    }

    // 設置彈窗按鈕邏輯
    const actionFn = () => {
        if (isEq) this.unequip(idx);
        else this.useItem(idx);
    };

    const meltFn = (!isEq) ? () => this.meltItem(idx) : null;

    this.core.ui.showModal(title, body, actionText, actionFn, meltFn);
};

/**
 * 使用物品：處理裝備穿戴與五卷參透
 */
Inventory.prototype.useItem = function(idx) {
    const p = this.core.player;
    const item = p.data.bag[idx];
    if (!item) return;

    if (item.itemType === 'scroll') {
        // 檢查是否已學會該神通
        const base = GAME_DATA.ITEMS.find(i => i.name === item.name);
        if (p.data.learnedSkills.includes(base.target)) {
            this.core.ui.toast("已參透此功法，不需重複學習", "#888");
            return;
        }

        if (item.count >= 5) {
            item.count -= 5;
            if (item.count <= 0) p.data.bag.splice(idx, 1);
            p.data.learnedSkills.push(base.target);
            this.core.ui.log(`✨ 萬卷歸宗！成功參透：${item.name}`, "system", "gold");
            this.core.ui.toast("參透成功！", "gold");
        } else {
            this.core.ui.toast("殘卷不足 (需 5 卷)", "#aaa");
        }
    } else if (item.itemType === 'equip') {
        const oldEquip = p.data.equips[item.type];
        p.data.equips[item.type] = item;
        p.data.bag.splice(idx, 1);
        if (oldEquip) this.addItem(oldEquip);
        this.core.ui.toast(`已穿戴：${item.name}`);
    }

    p.refresh();
    p.save();
    this.core.ui.renderAll();
};

/**
 * 熔煉：將物品換成靈石 (支持疊加數量一次熔煉)
 */
Inventory.prototype.meltItem = function(idx) {
    const p = this.core.player;
    const item = p.data.bag[idx];
    if (!item) return;

    const count = item.count || 1;
    let unitPrice = 30; 
    if (item.itemType === 'equip') unitPrice = (item.rarity + 1) * 30;
    
    const totalGain = unitPrice * count;
    p.data.money += totalGain;
    p.data.bag.splice(idx, 1);
    
    this.core.ui.log(`熔煉了 ${item.name} x${count}，獲得🪙${totalGain}`, "system");
    p.save();
    this.core.ui.renderAll();
};

/**
 * 卸下裝備
 */
Inventory.prototype.unequip = function(type) {
    const p = this.core.player;
    const item = p.data.equips[type];
    if (item) {
        if (p.data.bag.length >= this.maxSize) {
            this.core.ui.toast("儲物袋已滿，無法卸下", "red");
            return;
        }
        p.data.equips[type] = null;
        this.addItem(item);
        p.refresh();
        p.save();
        this.core.ui.renderAll();
    }
};

/**
 * 一鍵熔煉：清理凡品與良品的裝備
 */
Inventory.prototype.autoMelt = function() {
    const p = this.core.player;
    let gain = 0;
    p.data.bag = p.data.bag.filter(item => {
        if (item.itemType === 'equip' && item.rarity < 2) {
            gain += (item.rarity + 1) * 30;
            return false;
        }
        return true;
    });
    if (gain > 0) {
        p.data.money += gain;
        this.core.ui.toast(`清理完畢，獲得🪙${gain}`);
        p.save();
        this.core.ui.renderAll();
    } else {
        this.core.ui.toast("袋中無低階法寶可供熔煉");
    }
};

/**
 * 掉落判定邏輯
 */
Inventory.prototype.dropLoot = function(mapId) {
    const map = GAME_DATA.MAPS[mapId];
    const r = Math.random();
    
    if (r < 0.2) { // 20% 掉裝備
        this.addEquipment(map.lv);
    } else if (r < 0.5) { // 30% 掉落材料或殘卷
        const dropId = map.drops[Math.floor(Math.random() * map.drops.length)];
        const base = GAME_DATA.ITEMS.find(i => i.id === dropId);
        if (base) {
            const newItem = { ...base, itemType: base.type, count: 1 };
            this.addItem(newItem);
            this.core.ui.log(`獲得：${newItem.name}`, 'loot');
        }
    }
};

/**
 * 隨機生成法寶
 */
Inventory.prototype.addEquipment = function(lv) {
    const type = Math.random() > 0.5 ? 'weapon' : 'body';
    // 稀有度權重
    const rRoll = Math.random();
    let rar = 0;
    if (rRoll < 0.01) rar = 4;      // 神
    else if (rRoll < 0.05) rar = 3; // 仙
    else if (rRoll < 0.15) rar = 2; // 精
    else if (rRoll < 0.4) rar = 1;  // 良

    const prefixes = GAME_DATA.AFFIX.PREFIX;
    const pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffixes = GAME_DATA.AFFIX.SUFFIX.filter(s => s.type === type);
    const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    const eq = {
        itemType: 'equip',
        type: type,
        rarity: rar,
        name: pre.n + suf.n,
        count: 1
    };

    // 根據稀有度與等級縮放數值
    const scale = (rar + 1) * lv;
    const keys = ['atk', 'def', 'hp', 'dodge', 'lifeSteal', 'regen', 'exp', 'money'];
    
    keys.forEach(k => {
        const baseVal = (pre[k] || 0) + (suf[k] || 0);
        if (baseVal !== 0) {
            if (['dodge', 'lifeSteal', 'exp', 'money'].includes(k)) {
                // 機率類與倍率類：不隨等級縮放，僅隨稀有度微調
                eq[k] = baseVal * (1 + rar * 0.1);
            } else {
                // 基礎數值：隨等級與稀有度深度縮放
                eq[k] = Math.floor(baseVal * scale);
            }
        }
    });

    if (this.addItem(eq)) {
        this.core.ui.log(`獲得法寶：${eq.name}`, 'loot', GAME_DATA.RARITY[rar].c);
    }
};
