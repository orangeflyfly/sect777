/**
 * V1.5 player.js
 * 職責：管理玩家屬性、裝備生成邏輯、離線收益計算、境界突破。
 * 狀態：全量完整版，整合 1.4.1 核心算法與 1.5 新功能。
 */

let player = {
    // --- 1. 核心數據 (繼承 1.4.1 並擴充) ---
    data: {
        name: "修仙者",
        level: 1,
        realm: "練氣初期",
        exp: 0,
        nextExp: 100,
        money: 0,
        // 四維屬性
        str: 10, // 力量 -> 攻擊
        con: 10, // 體質 -> 生命
        dex: 10, // 敏捷 -> 速度/閃避
        int: 10, // 悟性 -> 經驗加成
        // 戰鬥即時狀態
        hp: 100,
        maxHp: 100,
        // 1.5 新增：區域進度
        currentRegion: "qingyun",
        currentMapId: 0, // <--- 補上這行，不然戰鬥引擎會找不到怪
        unlockedRegions: ["qingyun"],
        killCount: 0, // 當前區域擊殺數，用於觸發 Boss
        // 1.5 新增：時間戳與技能熟練度
        lastLogout: Date.now(),
        inventory: [],
        skills: [
            { id: "s001", level: 1, mastery: 0, maxMastery: 100 }, // 烈焰斬
            { id: "s002", level: 1, mastery: 0, maxMastery: 100 }  // 長生功
        ],
        equipment: {
            weapon: null,
            armor: null
        }
    },

    // --- 2. 離線收益系統 (1.5 新增) ---
    calculateOfflineGains: function() {
        const now = Date.now();
        const diffMS = now - this.data.lastLogout;
        const minutes = Math.floor(diffMS / 60000);

        // 只有離線超過設定分鐘數才結算 (預設10分鐘)
        if (minutes >= GAMEDATA.CONFIG.OFFLINE_MIN_MINS) {
            // 基礎收益公式：分鐘 * 等級相關係數
            const expGain = minutes * (this.data.level * 5); 
            const goldGain = minutes * (this.data.level * 2);
            
            this.data.exp += expGain;
            this.data.money += goldGain;
            
            this.checkLevelUp(); // 檢查是否因為離線收益而升級
            return { minutes, expGain, goldGain };
        }
        return null;
    },

    // --- 3. 裝備生成邏輯 (1.4.1 繼承 + 1.5 詞條池與發光支援) ---
    generateItem: function(baseItemName, rarity) {
        const base = GAMEDATA.ITEMS[baseItemName];
        const rarityInfo = GAMEDATA.RARITY[rarity];
        
        // 隨機選取詞條 (根據品級決定詞條數量)
        let prefixes = [];
        let prefixKeys = Object.keys(GAMEDATA.PREFIXES);
        let count = (rarity >= 2) ? rarity - 1 : 0; // 良品1個, 精品2個... 神品4個
        
        for(let i = 0; i < count; i++) {
            let randomKey = prefixKeys[Math.floor(Math.random() * prefixKeys.length)];
            if(!prefixes.includes(randomKey)) {
                prefixes.push(randomKey);
            }
        }

        // 構造裝備對象
        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            name: baseItemName,
            type: base.type,
            rarity: rarity,
            rarityClass: rarityInfo.class, // 1.5 新增：對接 CSS 發光 class
            prefixes: prefixes,
            // 基礎數值繼承 1.4.1 邏輯
            baseAtk: base.baseAtk || 0,
            baseDef: base.baseDef || 0,
            value: base.value * rarity
        };

        this.data.inventory.push(newItem);
        return newItem;
    },

    // --- 4. 屬性計算與升級 (1.4.1 核心算法) ---
    checkLevelUp: function() {
        while (this.data.exp >= this.data.nextExp) {
            this.data.exp -= this.data.nextExp;
            this.data.level++;
            // 經驗曲線：1.5倍遞增
            this.data.nextExp = Math.floor(this.data.nextExp * 1.5);
            
            // 屬性成長
            this.data.str += 2;
            this.data.con += 2;
            this.data.dex += 1;
            this.data.int += 1;
            
            // 滿狀態恢復
            this.data.maxHp = this.data.con * 10;
            this.data.hp = this.data.maxHp;
            
            // 境界自動演化 (簡單邏輯)
            if(this.data.level % 10 === 0) {
                this.updateRealm();
            }
        }
    },

    updateRealm: function() {
        const realms = ["練氣", "筑基", "金丹", "元嬰", "化神", "煉虛", "合體", "大乘"];
        let idx = Math.floor(this.data.level / 10);
        if(idx < realms.length) {
            this.data.realm = realms[idx] + "期";
        }
    },

    // --- 5. 存檔管理 ---
    save: function() {
        this.data.lastLogout = Date.now(); // 存檔時紀錄時間
        localStorage.setItem(GAMEDATA.CONFIG.SAVE_KEY, JSON.stringify(this.data));
    },

    load: function() {
        const saved = localStorage.getItem(GAMEDATA.CONFIG.SAVE_KEY);
        if (saved) {
            this.data = JSON.parse(saved);
            return true;
        }
        return false;
    }
};

console.log("✅ [V1.5 修煉紀錄] player.js 已裝載，離線收益與發光生成邏輯就緒。");
