/**
 * V2.0 CombatEngine.js (飛升模組版)
 * 職責：處理戰鬥流程、怪物生成、傷害判定、獎勵結算
 * 位置：/systems/CombatEngine.js
 */

// 導入所有依賴模組
import { Player } from '../entities/player.js';
import { Formula } from '../utils/Formula.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FX } from '../utils/fx.js';
import { ItemFactory } from '../utils/ItemFactory.js';

export const CombatEngine = {
    currentMonster: null,
    isProcessing: false,
    currentMapId: 101, // 預設地圖 ID

    /**
     * 初始化戰鬥引擎 (地圖記憶邏輯)
     */
    init(mapId = null) {
        // 優先從傳入參數或玩家存檔讀取地圖 ID
        let targetMap = mapId;
        if (!targetMap) {
            targetMap = (Player.data && Player.data.currentMapId) ? Player.data.currentMapId : 101;
        }

        console.log(`%c【戰鬥引擎】啟動歷練，目標地圖 ID: ${targetMap}`, "color: #a78bfa; font-weight: bold;");
        this.currentMapId = targetMap;

        // 寫入存檔，確保刷新頁面不迷路
        if (Player.data) {
            Player.data.currentMapId = targetMap;
            Player.save(); // 呼叫修士自身的存檔方法
        }
        
        // 延遲執行，確保全域資料 (DATA) 與 UI 已經準備就緒
        setTimeout(() => {
            this.spawnMonster(targetMap);
        }, 100); 
    },

    /**
     * 生成怪物
     */
    spawnMonster(mapId) {
        // 安全檢查：從全域獲取地圖數據 (DATA 暫維持全域)
        const dataSrc = window.DATA || window.GAMEDATA;
        if (!dataSrc || !dataSrc.REGIONS) {
            console.error("❌ 戰鬥引擎錯誤：找不到地圖數據庫");
            return;
        }

        const map = this.findMapData(mapId);
        
        if (!map) {
            console.error(`❌ 找不到地圖數據！ID: ${mapId}`);
            Msg.log(`此地妖氣雜亂，尋不到妖獸蹤跡...`, "system");
            return;
        }

        if (!map.monsterIds || map.monsterIds.length === 0) {
            console.error(`❌ 地圖「${map.name}」未配置怪物。`);
            return;
        }

        // 隨機抽選怪物模板
        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        const template = dataSrc.MONSTERS ? dataSrc.MONSTERS[monsterId] : null;
        
        if (!template) {
            console.error(`❌ 找不到怪物模板！ID: ${monsterId}`);
            Msg.log(`感覺到強大的氣息，但對方隱藏了真身...`, "system");
            return;
        }

        // 實例化怪物物件
        this.currentMonster = { 
            ...template, 
            hp: template.hp, 
            maxHp: template.hp 
        };
        
        // 更新 UI (目前 UI 模組仍掛載於 window)
        if (window.UI_Battle && typeof window.UI_Battle.updateMonster === 'function') {
            window.UI_Battle.updateMonster(this.currentMonster);
        }
        
        Msg.log(`【歷練】遇到 ${template.name}！`, "system"); 
    },

    /**
     * 玩家發起攻擊
     */
    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        
        // 檢查修士狀態
        if (Player.data && Player.data.hp <= 0) {
            Msg.log("你體力耗盡，無法發動攻擊！", "system");
            return;
        }

        this.isProcessing = true;
        this.executeTurn(true);
    },

    /**
     * 執行戰鬥回合
     */
    executeTurn(isPlayerTurn) {
        if (!this.currentMonster || !Player.data) {
            this.isProcessing = false;
            return;
        }

        // 決定攻守方數值
        const attackerAtk = isPlayerTurn ? Player.getBattleStats().atk : this.currentMonster.atk;
        
        // 使用 Formula 模組計算傷害
        const damage = Formula.getDamageRange(attackerAtk);

        if (isPlayerTurn) {
            // 玩家回合：怪物受傷
            this.currentMonster.hp -= damage;
            Msg.log(`你攻擊造成 ${damage} 點傷害。`, "player-atk");
            
            // 觸發特效：怪物震動與傷害彈跳
            FX.shake('monster-display');
            FX.spawnPopText(damage, 'monster');
            
        } else {
            // 怪物回合：玩家受傷
            Player.data.hp -= damage;
            Msg.log(`${this.currentMonster.name} 反擊造成 ${damage} 點傷害。`, "monster-atk");
            
            // 觸發特效：修士血條震動與傷害彈跳
            FX.shake('player-hp-fill');
            FX.spawnPopText(damage, 'player');
            
            // 同步 UI 狀態
            if (window.UI_Battle) {
                const pStats = Player.getBattleStats();
                window.UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
            }
        }

        // 刷新怪物狀態 UI
        if (window.UI_Battle) window.UI_Battle.updateMonster(this.currentMonster);

        // 生死判定
        if (this.currentMonster.hp <= 0) {
            this.handleVictory();
        } else if (!isPlayerTurn && Player.data.hp <= 0) {
            this.handleDefeat();
        } else if (isPlayerTurn) {
            // 回合輪替，延遲 600ms
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            // 戰鬥解析結束，解鎖操作
            this.isProcessing = false; 
        }
    },

    /**
     * 戰鬥勝利結算
     */
    handleVictory() {
        const m = this.currentMonster;
        Msg.log(`${m.name} 已被擊敗。`, "system");
        
        // 1. 結算經驗值與靈石
        const exp = Player.gainExp(m.exp);
        Player.data.coin += (m.gold || 0);
        Msg.log(`獲得經驗 ${exp}，靈石 ${m.gold || 0}`, "reward");

        // 2. 獲取獎勵飄字
        if (exp > 0) FX.spawnPopText(`+${exp} EXP`, 'player', '#2ecc71');
        if (m.gold > 0) {
            setTimeout(() => FX.spawnPopText(`+${m.gold} 靈石`, 'player', '#fbbf24'), 250);
        }

        // 3. 隨機掉落裝備 (調用 ItemFactory)
        if (Math.random() < 0.2) {
            const item = ItemFactory.createEquipment();
            if (item) {
                Player.addItem(item);
                Msg.log(`🎊 獲得戰利品：【${item.name}】！`, "reward");
            }
        }

        // 4. 更新全域 UI 
        if (window.Core) window.Core.updateUI();

        this.currentMonster = null;
        
        // 延遲重生
        setTimeout(() => { 
            this.isProcessing = false; 
            this.spawnMonster(this.currentMapId); 
        }, 1500);
    },

    /**
     * 戰鬥失敗處理
     */
    handleDefeat() {
        Msg.log(`你被 ${this.currentMonster.name} 擊敗了... 重傷昏迷。`, "monster-atk");
        this.currentMonster = null;

        // 懲罰與恢復
        const pStats = Player.getBattleStats();
        Player.data.hp = pStats.maxHp; // 宗門救回
        
        setTimeout(() => {
            Msg.log(`在宗門長老的救治下，你已甦醒。`, "system");
            if (window.UI_Battle) {
                window.UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
                window.UI_Battle.updateMonster(null);
            }
            if (window.Core) window.Core.updateUI();
            
            this.isProcessing = false;
            this.spawnMonster(this.currentMapId);
        }, 2000);
    },

    /**
     * 私有：搜尋地圖資料
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

// 全域對接
window.CombatEngine = CombatEngine;
