/**
 * V1.6.0 player.js (加固優化版)
 * 職責：玩家數據管理、防禦性存取系統、屬性計算、氣泡彈窗系統。
 * 狀態：100% 全量實裝，包含 1.4.1 公式復刻與數據補全邏輯。
 */

// 1. 定義標準數據藍本 (作為新功能擴充的基準)
const INITIAL_PLAYER_DATA = {
    name: "修士",
    level: 1,
    realm: "練氣初期",
    exp: 0,
    nextExp: 100,
    money: 0,
    statPoints: 5,
    
    // 基礎四維
    str: 10, con: 10, dex: 10, int: 10,
    
    // 衍生戰鬥屬性
    hp: 100,
    maxHp: 100,
    atk: 20,
    def: 5,
    crit: 5,
    dodge: 5,
    regen: 1,

    // 冒險狀態
    currentRegion: "qingyun",
    currentMapId: 0,
    unlockedRegions: ["qingyun"],
    killCount: 0,
    lastLogout: Date.now(),
    isAuto: false,

    // 儲物與裝備
    inventory: [],
    equipment: {
        weapon: null,
        armor: null
    },
    
    // 神通
    skills: []
};

let player = {
    // 引用當前數據
    data: JSON.parse(JSON.stringify(INITIAL_PLAYER_DATA)),

    // 2. 存取系統 (專業加固版：具備版本標記與數據補全)
    save: function() {
        const saveData = {
            version: "1.6.0",
            timestamp: Date.now(),
            payload: this.data
        };
        localStorage.setItem('SectGame_V15_Stable', JSON.stringify(saveData));
        console.log("💾 存檔已安全寫入瀏覽器。");
    },

    load: function() {
        const raw = localStorage.getItem('SectGame_V15_Stable');
        if (!raw) return false;

        try {
            const wrapped = JSON.parse(raw);
            // 兼容性處理：判斷是 1.5.12 舊格式還是 1.6.0 新封裝格式
            const incomingData = wrapped.payload ? wrapped.payload : wrapped;

            // --- 核心加固：數據自動補全 ---
            // 透過展開運算符，將 incomingData 合併到初始藍本中，確保新加入的屬性不會是 undefined
            this.data = { 
                ...INITIAL_PLAYER_DATA, 
                ...incomingData,
                // 特別處理深層對象，防止被整個覆蓋
                equipment: { ...INITIAL_PLAYER_DATA.equipment, ...incomingData.equipment },
                inventory: incomingData.inventory || []
            };
            
            this.updateDerivedStats();
            console.log("✅ 數據載入成功，已完成結構校驗。");
            return true;
        } catch (e) {
            console.error("❌ 存檔解析崩潰，請檢查數據格式:", e);
            return false;
        }
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

        const totalStr = d.str + extraStr;
        const totalCon = d.con + extraCon;
        const totalDex = d.dex + extraDex;
        const totalInt = d.int + extraInt;

        // --- 1.4.1 公式復刻 ---
        d.maxHp = totalCon * 12 + d.level * 25;
        d.atk = totalStr * 2.5 + d.level * 6;
        d.def = Math.floor(totalCon * 0.6);
        d.crit = Math.min(50, 5 + totalDex * 0.2);  // 暴擊上限 50%
        d.dodge = Math.min(40, 5 + totalDex * 0.15); // 閃避上限 40%
        d.regen = Math.floor(totalCon * 0.2) + 1;

        if (d.hp > d.maxHp) d.hp = d.maxHp;
    },

    // 4. 屬性配點
    addStat: function(type) {
        if (this.data.statPoints > 0) {
            this.data[type]++;
            this.data.statPoints--;
            this.updateDerivedStats();
            this.save();
            
            if (typeof UI_Stats !== 'undefined') UI_Stats.renderStats();
            
            const attrMap = {str:'力量', con:'體質', dex:'敏捷', int:'悟性'};
            this.showToast(`${attrMap[type]}提升了！`);
        }
    },

    // 升級邏輯
    checkLevelUp: function() {
        let leveled = false;
        while (this.data.exp >= this.data.nextExp) {
            this.data.exp -= this.data.nextExp;
            this.data.level++;
            this.data.statPoints += 5;
            this.data.nextExp = Math.floor(this.data.nextExp * 1.6);
            leveled = true;
            this.updateRealm();
        }

        if (leveled) {
            this.updateDerivedStats();
            this.data.hp = this.data.maxHp;
            this.showToast(`✨ 恭喜突破！晉升至【${this.data.realm}】`, "gold");
            this.save();
            // 如果有 UI 更新函數，在此處調用
            if (typeof UI_Main !== 'undefined') UI_Main.updateAll();
        }
    },

    updateRealm: function() {
        const lv = this.data.level;
        const realms = ["練氣初期", "練氣中期", "練氣後期", "築基初期", "築基中期", "築基後期", "金丹大能", "元嬰老祖", "化神真尊"];
        const idx = Math.min(realms.length - 1, Math.floor((lv - 1) / 10));
        this.data.realm = realms[idx];
    },

    // 5. 氣泡訊息系統
    showToast: function(msg, type = "") {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === "gold") toast.style.borderColor = "#f1c40f";
        toast.innerText = msg;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    },

    // 6. 裝備生成
    generateItem: function(baseName, mapLevel) {
        // 確保 GAMEDATA 存在防止崩潰
        if (typeof GAMEDATA === 'undefined') return false;

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

        if (this.data.inventory.length < (GAMEDATA.CONFIG?.MAX_BAG_SLOTS || 20)) {
            this.data.inventory.push(newItem);
            return true;
        }
        return false;
    }
};

console.log("✅ [V1.6.0] player.js 已加固，具備防禦性存取機制。");
