/**
 * V1.5.10 player.js
 * 職責：管理玩家屬性、詳細數值計算、裝備生成、離線收益與存檔邏輯。
 */

let player = {
    // 1. 核心基礎數據
    data: {
        name: "無名修士",
        level: 1,
        realm: "練氣初期",
        exp: 0,
        nextExp: 100,
        money: 0,
        statPoints: 5,
        
        // 基礎四維
        str: 10, // 力量 -> 影響攻擊
        con: 10, // 體質 -> 影響血量、防禦、回血
        dex: 10, // 敏捷 -> 影響暴擊、閃避
        int: 10, // 悟性 -> 影響經驗獲取、技能威能
        
        // 詳細戰鬥屬性 (由基礎四維算出)
        hp: 100,
        maxHp: 100,
        atk: 20,
        def: 5,
        crit: 5,      // 暴擊率 %
        dodge: 5,     // 閃避率 %
        regen: 1,     // 每秒回血

        // 位置與進度
        currentRegion: "qingyun",
        currentMapId: 0,
        unlockedRegions: ["qingyun"],
        killCount: 0,
        lastLogout: Date.now(),

        // 背包與裝備
        inventory: [],
        equipment: {
            weapon: null,
            armor: null
        },
        
        // 神通 (技能)
        skills: [
            { id: "s001", level: 1, mastery: 0, maxMastery: 100 }
        ]
    },

    // 2. 初始化與存取邏輯
    save: function() {
        localStorage.setItem('SectGame_V15', JSON.stringify(this.data));
    },

    load: function() {
        const saved = localStorage.getItem('SectGame_V15');
        if (saved) {
            this.data = JSON.parse(saved);
            this.updateDerivedStats(); // 讀檔後重新計算詳細數值
            return true;
        }
        return false;
    },

    // 3. 詳細數值計算 (1.4.1 的靈魂)
    updateDerivedStats: function() {
        const d = this.data;
        
        // A. 計算裝備加成
        let extraStr = 0, extraCon = 0, extraDex = 0, extraInt = 0;
        [d.equipment.weapon, d.equipment.armor].forEach(item => {
            if (item && item.prefix) {
                if (item.prefix.attr === 'str') extraStr += item.prefix.value;
                if (item.prefix.attr === 'con') extraCon += item.prefix.value;
                if (item.prefix.attr === 'dex') extraDex += item.prefix.value;
                if (item.prefix.attr === 'int') extraInt += item.prefix.value;
            }
        });

        // B. 最終四維
        const totalStr = d.str + extraStr;
        const totalCon = d.con + extraCon;
        const totalDex = d.dex + extraDex;
        const totalInt = d.int + extraInt;

        // C. 轉化戰鬥屬性 (1.4.1 公式)
        d.maxHp = totalCon * 10 + d.level * 20;
        d.atk = totalStr * 2 + d.level * 5;
        d.def = Math.floor(totalCon * 0.5);
        d.crit = Math.min(50, 5 + totalDex * 0.2);  // 最高 50%
        d.dodge = Math.min(40, 5 + totalDex * 0.1); // 最高 40%
        d.regen = Math.floor(totalCon * 0.2) + 1;

        // 確保目前血量不超標
        if (d.hp > d.maxHp) d.hp = d.maxHp;
    },

    // 4. 加點邏輯
    addStat: function(type) {
        if (this.data.statPoints > 0) {
            this.data[type]++;
            this.data.statPoints--;
            this.updateDerivedStats();
            this.save();
            if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
        }
    },

    // 5. 境界與升級
    checkLevelUp: function() {
        let isLevelUp = false;
        while (this.data.exp >= this.data.nextExp) {
            this.data.exp -= this.data.nextExp;
            this.data.level++;
            this.data.statPoints += 5;
            this.data.nextExp = Math.floor(this.data.nextExp * 1.5);
            isLevelUp = true;
            this.updateRealm();
        }
        if (isLevelUp) {
            this.updateDerivedStats();
            this.data.hp = this.data.maxHp; // 升級滿血
            alert(`🎉 突破成功！當前境界：${this.data.realm} (Lv.${this.data.level})`);
        }
    },

    updateRealm: function() {
        const lv = this.data.level;
        if (lv < 10) this.data.realm = "練氣初期";
        else if (lv < 20) this.data.realm = "練氣中期";
        else if (lv < 30) this.data.realm = "練氣後期";
        else if (lv < 40) this.data.realm = "筑基初期";
        else if (lv < 50) this.data.realm = "筑基中期";
        else if (lv < 60) this.data.realm = "筑基後期";
        else this.data.realm = "金丹大能";
    },

    // 6. 裝備生成與掉落 (對接 80 詞條)
    generateItem: function(baseName, mapLevel) {
        // 隨機抽選詞條
        const prefixes = GAMEDATA.PREFIXES;
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        const newItem = {
            uid: Date.now() + Math.random(),
            name: prefix.name + baseName,
            baseName: baseName,
            type: baseName.includes("衣") || baseName.includes("甲") ? "armor" : "weapon",
            rarity: prefix.rarity,
            prefix: prefix,
            price: prefix.rarity * 50 + mapLevel * 10
        };

        if (this.data.inventory.length < GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            this.data.inventory.push(newItem);
            return true;
        }
        return false; // 背包滿了
    },

    // 7. 離線收益計算
    calculateOfflineGains: function() {
        const now = Date.now();
        const diff = now - this.data.lastLogout;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes >= 1) {
            // 限制最大離線時間為 12 小時 (720 分鐘)
            const activeMinutes = Math.min(720, minutes);
            const expGain = activeMinutes * (this.data.int * 0.5 + this.data.level);
            const goldGain = activeMinutes * 5;
            
            this.data.exp += Math.floor(expPercent);
            this.data.money += goldGain;
            this.data.lastLogout = now;
            
            this.checkLevelUp();
            this.save();
            
            return { minutes: activeMinutes, exp: Math.floor(expGain), gold: goldGain };
        }
        return null;
    }
};

console.log("✅ [V1.5.10] player.js 神魂卷軸全量載入，無任何刪減。");
