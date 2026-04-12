/**
 * V1.5.12 player.js
 * 職責：玩家數據管理、詳細屬性計算(1.4.1公式)、裝備邏輯、晉級彈窗。
 * 狀態：全量實裝，禁止簡化。
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
        
        // 基礎四維 (1.4.1 核心)
        str: 10, // 力量
        con: 10, // 體質
        dex: 10, // 敏捷
        int: 10, // 悟性
        
        // 詳細戰鬥屬性 (由 updateDerivedStats 計算)
        hp: 100,
        maxHp: 100,
        atk: 20,
        def: 5,
        crit: 5,      // 暴擊率 %
        dodge: 5,     // 閃避率 %
        regen: 1,     // 每秒回血

        // 進度與狀態
        currentRegion: "qingyun",
        currentMapId: 0,
        unlockedRegions: ["qingyun"],
        killCount: 0,
        lastLogout: Date.now(),
        isAuto: false, // 自動練功狀態

        // 背包與裝備
        inventory: [],
        equipment: {
            weapon: null,
            armor: null
        },
        
        // 神通
        skills: []
    },

    // 2. 存取邏輯
    save: function() {
        localStorage.setItem('SectGame_V15_Stable', JSON.stringify(this.data));
    },

    load: function() {
        const saved = localStorage.getItem('SectGame_V15_Stable');
        if (saved) {
            this.data = JSON.parse(saved);
            this.updateDerivedStats();
            return true;
        }
        return false;
    },

    // 3. 詳細數值轉化 (1.4.1 靈魂公式)
    updateDerivedStats: function() {
        const d = this.data;
        
        // A. 統計裝備提供的額外四維
        let extraStr = 0, extraCon = 0, extraDex = 0, extraInt = 0;
        [d.equipment.weapon, d.equipment.armor].forEach(item => {
            if (item && item.prefix) {
                const p = item.prefix;
                if (p.attr === 'str') extraStr += p.value;
                if (p.attr === 'con') extraCon += p.value;
                if (p.attr === 'dex') extraDex += p.value;
                if (p.attr === 'int') extraInt += p.value;
            }
        });

        // B. 計算最終四維
        const tStr = d.str + extraStr;
        const tCon = d.con + extraCon;
        const tDex = d.dex + extraDex;
        const tInt = d.int + extraInt;

        // C. 1.4.1 轉化公式實裝
        d.maxHp = tCon * 12 + d.level * 25;      // 體質影響血量
        d.atk = tStr * 2.5 + d.level * 6;        // 力量影響攻擊
        d.def = Math.floor(tCon * 0.6);         // 體質影響防禦
        d.crit = Math.min(50, 5 + tDex * 0.25); // 敏捷影響暴擊 (上限50%)
        d.dodge = Math.min(40, 5 + tDex * 0.15);// 敏捷影響閃避 (上限40%)
        d.regen = Math.floor(tCon * 0.25) + 1;  // 每秒回血

        // 確保目前血量不超過上限
        if (d.hp > d.maxHp) d.hp = d.maxHp;
    },

    // 4. 加點邏輯
    addStat: function(type) {
        if (this.data.statPoints > 0) {
            this.data[type]++;
            this.data.statPoints--;
            this.updateDerivedStats();
            this.save();
            // 同步渲染介面
            if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            this.showToast(`${type === 'str' ? '力量' : type === 'con' ? '體質' : type === 'dex' ? '敏捷' : '悟性'} +1`);
        }
    },

    // 5. 晉級與境界 (1.4.1 氣泡提醒版)
    checkLevelUp: function() {
        let leveled = false;
        while (this.data.exp >= this.data.nextExp) {
            this.data.exp -= this.data.nextExp;
            this.data.level++;
            this.data.statPoints += 5;
            this.data.nextExp = Math.floor(this.data.nextExp * 1.55);
            leveled = true;
            this.updateRealm();
        }
        if (leveled) {
            this.updateDerivedStats();
            this.data.hp = this.data.maxHp; // 晉級滿血
            this.showToast(`✨ 恭喜晉級：${this.data.realm}！`, "gold");
            this.save();
        }
    },

    updateRealm: function() {
        const lv = this.data.level;
        const realms = ["練氣初期", "練氣中期", "練氣後期", "築基初期", "築基中期", "築基後期", "金丹大能", "元嬰老祖"];
        const idx = Math.min(realms.length - 1, Math.floor((lv - 1) / 10));
        this.data.realm = realms[idx];
    },

    // 6. 1.4.1 氣泡提示函式 (Toast)
    showToast: function(msg, color = "") {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (color === "gold") toast.style.borderColor = "#f1c40f";
        toast.innerText = msg;
        container.appendChild(toast);
        // 動畫結束後移除
        setTimeout(() => toast.remove(), 2800);
    },

    // 7. 裝備生成 (對接 80 詞條)
    generateItem: function(baseName, mapLevel) {
        const prefixes = GAMEDATA.PREFIXES;
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        const newItem = {
            uid: Date.now() + Math.random(),
            name: prefix.name + baseName,
            type: baseName.includes("衣") || baseName.includes("甲") ? "armor" : "weapon",
            rarity: prefix.rarity,
            prefix: prefix,
            price: prefix.rarity * 60 + mapLevel * 15
        };

        if (this.data.inventory.length < GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            this.data.inventory.push(newItem);
            return true;
        }
        return false;
    }
};

console.log("✅ [V1.5.12] player.js 載入成功，屬性轉化與氣泡系統已啟動。");
