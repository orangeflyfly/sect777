/**
 * V1.8.2 CombatEngine.js (穩定強化版)
 * 修正點：加入數據安全鎖、防止靜默失敗、強化日誌輸出、確保 UI 更新順序
 */
const CombatEngine = {
    currentMonster: null,
    isProcessing: false,
    currentMapId: 101, // 預設地圖 ID

    /**
     * 初始化戰鬥引擎
     */
    init(mapId = 101) {
        console.log(`%c【戰鬥引擎】啟動歷練，目標地圖 ID: ${mapId}`, "color: #a78bfa; font-weight: bold;");
        this.currentMapId = mapId;
        
        // 延遲執行，確保全域資料 (DATA/GAMEDATA) 與 UI 已經準備就緒
        setTimeout(() => {
            this.spawnMonster(mapId);
        }, 100); 
    },

    /**
     * 生成怪物
     */
    spawnMonster(mapId) {
        // 1. 安全檢查：確保基礎數據庫存在
        const dataSrc = window.DATA || window.GAMEDATA;
        if (!dataSrc || !dataSrc.REGIONS) {
            console.error("❌ 戰鬥引擎錯誤：找不到地圖數據庫 (DATA.REGIONS)");
            return;
        }

        const map = this.findMapData(mapId);
        
        // 🔍 偵錯：地圖找不到
        if (!map) {
            console.error(`❌ 找不到地圖數據！ID: ${mapId}。請檢查 data_world.js。`);
            if (window.Msg) Msg.log(`此地妖氣雜亂，尋不到妖獸蹤跡... (ID: ${mapId})`, "system");
            return;
        }

        if (!map.monsterIds || map.monsterIds.length === 0) {
            console.error(`❌ 地圖「${map.name}」內沒有配置任何怪物 ID。`);
            return;
        }

        // 2. 隨機選取怪物
        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        const template = dataSrc.MONSTERS ? dataSrc.MONSTERS[monsterId] : null;
        
        // 🔍 偵錯：怪物模板找不到
        if (!template) {
            console.error(`❌ 找不到怪物模板！ID: ${monsterId}。請檢查 data_monsters.js。`);
            if (window.Msg) Msg.log(`感覺到強大的氣息，但對方隱藏了真身...`, "system");
            return;
        }

        // 3. 實例化怪物數據
        this.currentMonster = { 
            ...template, 
            hp: template.hp, 
            maxHp: template.hp 
        };
        
        // 4. 更新 UI 介面
        if (window.UI_Battle && typeof UI_Battle.updateMonster === 'function') {
            UI_Battle.updateMonster(this.currentMonster);
        } else {
            console.warn("⚠️ UI_Battle 未就緒，無法更新怪物畫面。");
        }
        
        if (window.Msg) {
            Msg.log(`【歷練】遇到 ${template.name}！`, "system"); 
        }
    },

    /**
     * 玩家發起攻擊
     */
    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        
        // 檢查玩家是否還有血量
        if (Player.data && Player.data.hp <= 0) {
            if (window.Msg) Msg.log("你體力耗盡，無法發動攻擊！", "system");
            return;
        }

        this.isProcessing = true;
        this.executeTurn(true);
    },

    /**
     * 執行戰鬥回合
     */
    executeTurn(isPlayerTurn) {
        // 安全檢查
        if (!this.currentMonster || !Player.data) {
            this.isProcessing = false;
            return;
        }

        // 決定攻守方
        const attackerName = isPlayerTurn ? "你" : this.currentMonster.name;
        const attackerAtk = isPlayerTurn ? Player.getBattleStats().atk : this.currentMonster.atk;
        
        // 計算傷害
        const damage = typeof Formula !== 'undefined' ? Formula.getDamageRange(attackerAtk) : attackerAtk;

        if (isPlayerTurn) {
            // 玩家攻擊怪物
            this.currentMonster.hp -= damage;
            if (window.Msg) Msg.log(`你攻擊造成 ${damage} 點傷害。`, "player-atk");
        } else {
            // 怪物反擊玩家
            Player.data.hp -= damage;
            if (window.Msg) Msg.log(`${this.currentMonster.name} 反擊造成 ${damage} 點傷害。`, "monster-atk");
            
            // 同步更新玩家血條
            if (window.UI_Battle) {
                const pStats = Player.getBattleStats();
                UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
            }
        }

        // 刷新怪物 UI
        if (window.UI_Battle) UI_Battle.updateMonster(this.currentMonster);

        // 生死判定
        if (this.currentMonster.hp <= 0) {
            this.handleVictory();
        } else if (!isPlayerTurn && Player.data.hp <= 0) {
            this.handleDefeat();
        } else if (isPlayerTurn) {
            // 玩家打完換怪物打，延遲 600ms
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            // 怪物打完，回合結束，解除鎖定
            this.isProcessing = false; 
        }
    },

    /**
     * 戰鬥勝利處理
     */
    handleVictory() {
        const m = this.currentMonster;
        if (window.Msg) Msg.log(`${m.name} 已被擊敗。`, "system");
        
        // 獲取獎勵
        const exp = Player.gainExp(m.exp);
        Player.data.coin += (m.gold || 0);
        if (window.Msg) Msg.log(`獲得經驗 ${exp}，靈石 ${m.gold || 0}`, "reward");

        // 隨機掉落裝備
        if (Math.random() < 0.2 && typeof ItemFactory !== 'undefined') {
            const item = ItemFactory.createEquipment();
            Player.addItem(item);
            if (window.Msg) Msg.log(`🎊 獲得戰利品：【${item.name}】！`, "reward");
        }

        // 更新全域數據顯示
        if (window.Core) Core.updateUI();

        this.currentMonster = null;
        
        // 延遲後重生怪物
        setTimeout(() => { 
            this.isProcessing = false; 
            this.spawnMonster(this.currentMapId); 
        }, 1500);
    },

    /**
     * 戰鬥失敗處理
     */
    handleDefeat() {
        if (window.Msg) Msg.log(`你被 ${this.currentMonster.name} 擊敗了... 重傷昏迷。`, "monster-atk");
        this.currentMonster = null;

        // 懲罰與恢復：由宗門救回
        const pStats = Player.getBattleStats();
        Player.data.hp = pStats.maxHp; // 恢復滿血
        
        setTimeout(() => {
            if (window.Msg) Msg.log(`在宗門長老的救治下，你已甦醒。`, "system");
            if (window.UI_Battle) {
                UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
                UI_Battle.updateMonster(null);
            }
            if (window.Core) Core.updateUI();
            
            this.isProcessing = false;
            this.spawnMonster(this.currentMapId);
        }, 2000);
    },

    /**
     * 尋找地圖數據庫
     */
    findMapData(id) {
        const dataSrc = window.DATA || window.GAMEDATA;
        if (!dataSrc || !dataSrc.REGIONS) return null;

        for (let r in dataSrc.REGIONS) {
            const map = dataSrc.REGIONS[r].maps.find(m => m.id == id);
            if (map) return map;
        }
        return null;
    }
};

// 確保全域可存取
window.CombatEngine = CombatEngine;
