/**
 * V1.5.12 player.js
 * 職責：玩家數據儲存、屬性轉化計算(1.4.1公式)、晉級邏輯、氣泡彈窗系統。
 * 狀態：100% 全量實裝，絕不簡化。
 */

let player = {
    // 1. 核心數據結構
    data: {
        name: "修士",
        level: 1,
        realm: "練氣初期",
        exp: 0,
        nextExp: 100,
        money: 0,
        statPoints: 5,
        
        // 基礎四維 (1.4.1 靈魂數值)
        str: 10, // 力量
        con: 10, // 體質
        dex: 10, // 敏捷
        int: 10, // 悟性
        
        // 衍生戰鬥屬性 (由 updateDerivedStats 計算)
        hp: 100,
        maxHp: 100,
        atk: 20,
        def: 5,
        crit: 5,      // 暴擊率 %
        dodge: 5,     // 閃避率 %
        regen: 1,     // 每秒回血

        // 冒險狀態
        currentRegion: "qingyun",
        currentMapId: 0,
        unlockedRegions: ["qingyun"],
        killCount: 0,
        lastLogout: Date.now(),
        isAuto: false, // 自動練功開關

        // 儲物與裝備
        inventory: [],
        equipment: {
            weapon: null,
            armor: null
        },
        
        // 神通
        skills: []
    },

    // 2. 存取系統 (採用穩定標記)
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

    // 3. 屬性轉化公式 (1.4.1 核心比例)
    updateDerivedStats: function() {
        const d = this.data;
        
        // 累加裝備加成
        let extraStr = 0, extraCon = 0, extraDex = 0, extraInt = 0;
        const equips = [d.equipment.weapon, d.equipment.armor];
        equips.forEach(item => {
            if (item && item.prefix) {
                const p = item.prefix;
                if (p.attr === 'str') extraStr += p.value;
                if (p.attr === 'con') extraCon += p.value;
                if (p.attr === 'dex') extraDex += p.value;
                if (p.attr === 'int') extraInt += p.value;
            }
        });

        // 最終屬性計算
        const totalStr = d.str + extraStr;
        const totalCon = d.con + extraCon;
        const totalDex = d.dex + extraDex;
        const totalInt = d.int + extraInt;

        // --- 1.4.1 公式復刻 ---
        d.maxHp = totalCon * 12 + d.level * 25;      // 體質影響血量
        d.atk = totalStr * 2.5 + d.level * 6;        // 力量影響攻擊
        d.def = Math.floor(totalCon * 0.6);         // 體質影響防禦
        d.crit = Math.min(50, 5 + totalDex * 0.2);  // 敏捷影響暴擊 (上限50%)
        d.dodge = Math.min(40, 5 + totalDex * 0.15);// 敏捷影響閃避 (上限40%)
        d.regen = Math.floor(totalCon * 0.2) + 1;   // 每秒回血

        // 確保當前生命不溢出
        if (d.hp > d.maxHp) d.hp = d.maxHp;
    },

    // 4. 修為提升 (1.4.1 氣泡提醒版)
    addStat: function(type) {
        if (this.data.statPoints > 0) {
            this.data[type]++;
            this.data.statPoints--;
            this.updateDerivedStats();
            this.save();
            
            // 同步渲染修為介面
            if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            
            const attrMap = {str:'力量', con:'體質', dex:'敏捷', int:'悟性'};
            this.showToast(`${attrMap[type]}提升了！`);
        }
    },

    checkLevelUp: function() {
        let leveled = false;
        // 循環檢查是否滿足多次升級
        while (this.data.exp >= this.data.nextExp) {
            this.data.exp -= this.data.nextExp;
            this.data.level++;
            this.data.statPoints += 5;
            this.data.nextExp = Math.floor(this.data.nextExp * 1.6); // 1.6 倍經驗曲線
            leveled = true;
            this.updateRealm();
        }

        if (leveled) {
            this.updateDerivedStats();
            this.data.hp = this.data.maxHp; // 升級滿血
            this.showToast(`✨ 恭喜突破！晉升至【${this.data.realm}】`, "gold");
            this.save();
        }
    },

    updateRealm: function() {
        const lv = this.data.level;
        const realms = ["練氣初期", "練氣中期", "練氣後期", "築基初期", "築基中期", "築基後期", "金丹大能", "元嬰老祖", "化神真尊"];
        const idx = Math.min(realms.length - 1, Math.floor((lv - 1) / 10));
        this.data.realm = realms[idx];
    },

    // 5. 1.4.1 靈魂系統：氣泡訊息 (Toast)
    showToast: function(msg, type = "") {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === "gold") toast.style.borderColor = "#f1c40f";
        toast.innerText = msg;

        container.appendChild(toast);

        // 3秒後消失
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    },

    // 6. 裝備生成器 (對接 data.js 中的 80 詞條)
    generateItem: function(baseName, mapLevel) {
        const prefixes = GAMEDATA.PREFIXES;
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        const newItem = {
            uid: "item_" + Date.now() + Math.floor(Math.random()*1000),
            name: prefix.name + baseName,
            type: (baseName.includes("劍") || baseName.includes("刀")) ? "weapon" : "armor",
            rarity: prefix.rarity,
            prefix: prefix,
            price: prefix.rarity * 50 + mapLevel * 10
        };

        if (this.data.inventory.length < GAMEDATA.CONFIG.MAX_BAG_SLOTS) {
            this.data.inventory.push(newItem);
            return true;
        }
        return false;
    }
};

console.log("✅ [V1.5.12] player.js 修士神魂系統全量注入完成。");
