/**
 * V3.5.1 BountySystem.js (懸賞堂核心 - 禁制重複派遣版)
 * 職責：生成隨機懸賞任務、管理弟子外派歷練計時、計算歷練報酬
 * 修正：加入狀態鎖定與 UI 即時重繪呼叫，解決重複點擊派遣問題
 * 位置：/systems/BountySystem.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const BountySystem = {
    // 儲存當前可領取的懸賞任務與正在歷練的弟子
    init() {
        console.log("%c【BountySystem】懸賞卷宗展開，天地因果連動中...", "color: #a855f7; font-weight: bold;");
        window.BountySystem = this;

        if (!Player.data.bounty) {
            Player.data.bounty = {
                tasks: [],        // 物資提交任務
                expeditions: []   // 正在歷練中的弟子數據 [{id: discipleId, endTime: timestamp, target: '秘境名'}]
            };
        }
        
        // 若完全沒任務才刷新，保留玩家存檔中的任務進度
        if (Player.data.bounty.tasks.length === 0) {
            this.refreshDailyTasks();
        }
    },

    /**
     * 生成每日懸賞 (消耗仙草、玄鐵或丹藥)
     */
    refreshDailyTasks() {
        const pool = [
            { name: '🌿 仙草', key: 'herb', amount: 30, reward: 100 },
            { name: '⛏️ 玄鐵', key: 'ore', amount: 20, reward: 150 },
            { name: '💊 修為丹', key: '修為丹', amount: 5, reward: 300 },
            { name: '💊 療傷藥', key: '療傷藥', amount: 5, reward: 250 }
        ];

        // 隨機抽選 3 個任務
        Player.data.bounty.tasks = pool.sort(() => 0.5 - Math.random()).slice(0, 3).map(t => ({
            ...t,
            id: 'task_' + Math.random().toString(36).substr(2, 9)
        }));
        Player.save();
    },

    /**
     * 提交懸賞
     */
    submitTask(taskId) {
        const task = Player.data.bounty.tasks.find(t => t.id === taskId);
        if (!task) return;

        let hasEnough = false;
        // 檢查材料庫或背包
        if (task.key === 'herb' || task.key === 'ore') {
            if ((Player.data.materials[task.key] || 0) >= task.amount) {
                Player.data.materials[task.key] -= task.amount;
                hasEnough = true;
            }
        } else {
            if ((Player.data.inventory[task.key] || 0) >= task.amount) {
                Player.data.inventory[task.key] -= task.amount;
                hasEnough = true;
            }
        }

        if (hasEnough) {
            Player.data.sectPoints = (Player.data.sectPoints || 0) + task.reward;
            Player.data.bounty.tasks = Player.data.bounty.tasks.filter(t => t.id !== taskId);
            Msg.log(`✅ 完成懸賞：${task.name}！獲得貢獻點 +${task.reward}`, "gold");
            Player.save();
            
            // 完成後重繪 UI
            if (window.UI_Bounty) window.UI_Bounty.openModal();
        } else {
            Msg.log(`❌ 物資不足，無法交付此懸賞。`, "system");
        }
    },

    /**
     * 派遣弟子歷練
     * 🌟 修正：加入狀態檢核防護，並連動 UI 即時刷新
     */
    startExpedition(discipleId, zoneName, durationMinutes) {
        const disciple = Player.data.sect.disciples.find(d => d.id === discipleId);
        if (!disciple) return;

        // 🛑 核心防護：嚴禁派遣非閒置弟子，防止重複點擊造成的「分身派遣」
        if (disciple.status !== 'idle') {
            return; 
        }

        // 鎖定狀態
        disciple.status = 'expedition'; 
        const endTime = Date.now() + (durationMinutes * 60000);
        
        Player.data.bounty.expeditions.push({
            id: discipleId,
            name: disciple.name,
            endTime: endTime,
            target: zoneName
        });
        
        Player.save();
        Msg.log(`🚶 【${disciple.name}】已背上行囊，前往【${zoneName}】探索。`, "system");

        // 🌟 關鍵修正：派遣完成後，立即命令 UI 重新繪製畫面，確保按鈕消失、顯示進度
        if (window.UI_Bounty) {
            window.UI_Bounty.openModal(); 
        }
    },

    /**
     * 每分鐘天道結算：檢查歷練是否結束
     */
    processTick() {
        if (!Player.data.bounty || !Player.data.bounty.expeditions || Player.data.bounty.expeditions.length === 0) return;

        const now = Date.now();
        const completed = Player.data.bounty.expeditions.filter(ex => now >= ex.endTime);

        if (completed.length === 0) return;

        completed.forEach(ex => {
            const disciple = Player.data.sect.disciples.find(d => d.id === ex.id);
            if (disciple) {
                // 計算獎勵 (根據弟子戰力與機緣)
                const luck = disciple.stats['機緣'] || 10;
                const coins = 500 + Math.floor(luck * 10);
                const points = 50;
                
                // 兼容處理靈石變數名
                if (Player.data.coin !== undefined) Player.data.coin += coins;
                else if (Player.data.coins !== undefined) Player.data.coins += coins;
                
                Player.data.sectPoints = (Player.data.sectPoints || 0) + points;
                disciple.status = 'idle'; // 回歸閒置
                
                Msg.log(`🎊 【${disciple.name}】從【${ex.target}】歷練歸來！帶回靈石 ${coins}、貢獻 ${points}`, "reward");
                
                // 經驗值反哺
                if (window.SectSystem && typeof window.SectSystem.gainExp === 'function') {
                    window.SectSystem.gainExp(disciple.id, 100);
                }
            }
        });

        // 移除已完成的歷練，並更新存檔
        Player.data.bounty.expeditions = Player.data.bounty.expeditions.filter(ex => now < ex.endTime);
        Player.save();

        // 🌟 結算完畢後，若 UI 開著則自動重繪
        if (window.UI_Bounty && document.getElementById('bounty-modal-overlay')) {
            window.UI_Bounty.openModal();
        }
    }
};

window.BountySystem = BountySystem;
