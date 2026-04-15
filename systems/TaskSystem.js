/**
 * V2.2 TaskSystem.js (飛升模組版 - 懸賞任務大腦)
 * 職責：負責生成宗門任務、檢查玩家素材是否足夠、發放宗門貢獻點
 * 位置：/systems/TaskSystem.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const TaskSystem = {
    // 任務模板庫 (後續可以根據玩家境界擴充)
    taskTemplates: [
        { id: 't_herb_1', type: 'collect', targetId: 'mat_herb', targetName: '宗門仙草', count: 10, reward: 50, desc: '煉丹房長老急需一批仙草入藥，速去草藥部收割。' },
        { id: 't_herb_2', type: 'collect', targetId: 'mat_herb', targetName: '宗門仙草', count: 50, reward: 300, desc: '宗主準備開爐煉製大批築基丹，需要大量仙草支援。' },
        { id: 't_stone_1', type: 'collect', targetId: 'i001', targetName: '低階靈石袋', count: 1, reward: 100, desc: '聚靈大陣陣眼靈力枯竭，急需靈石袋補充靈氣。' }
    ],

    init() {
        console.log("【懸賞堂】因果陣法啟動，正在生成懸賞榜單...");
        if (!Player.data) return;
        
        // 確保玩家身上有任務清單
        if (!Player.data.tasks) {
            Player.data.tasks = [];
        }
        
        // 填滿任務榜單
        this.refreshTasks();
    },

    /**
     * 刷新/補充任務，確保榜單上隨時有 3 個任務
     */
    refreshTasks() {
        let changed = false;
        while (Player.data.tasks.length < 3) {
            // 隨機抽選一個任務模板
            const template = this.taskTemplates[Math.floor(Math.random() * this.taskTemplates.length)];
            
            // 賦予唯一 UUID 放入玩家數據中
            Player.data.tasks.push({
                uuid: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                ...template
            });
            changed = true;
        }

        if (changed) Player.save();
    },

    /**
     * 玩家提交任務邏輯
     */
    submitTask(taskUuid) {
        const taskIndex = Player.data.tasks.findIndex(t => t.uuid === taskUuid);
        if (taskIndex === -1) return false;

        const task = Player.data.tasks[taskIndex];

        if (task.type === 'collect') {
            // 1. 檢查儲物袋是否有該物品，且數量足夠
            const itemIndex = Player.data.inventory.findIndex(i => i.id === task.targetId || i.name === task.targetName);
            const currentCount = itemIndex !== -1 ? (Player.data.inventory[itemIndex].count || 1) : 0;

            if (currentCount < task.count) {
                Msg.log(`❌ 提交失敗！你的【${task.targetName}】數量不足（需要 ${task.count} 個，目前 ${currentCount} 個）。`, "system");
                return false;
            }

            // 2. 扣除儲物袋中的物品
            if (currentCount > task.count) {
                Player.data.inventory[itemIndex].count -= task.count;
            } else {
                Player.data.inventory.splice(itemIndex, 1);
            }

            // 3. 發放貢獻點獎勵
            Player.data.sectPoints = (Player.data.sectPoints || 0) + task.reward;
            Msg.log(`✅ 任務完成！獲得 ${task.reward} 點宗門貢獻！`, "reward");

            // 4. 移除已完成任務，並生成新任務遞補
            Player.data.tasks.splice(taskIndex, 1);
            this.refreshTasks();

            // 5. 更新介面
            if (window.UI_Sect) window.UI_Sect.openDept('bounty'); // 重新渲染懸賞堂
            if (window.Core) window.Core.updateUI();
            
            Player.save();
            return true;
        }
        return false;
    }
};

// 暴露給全域
window.TaskSystem = TaskSystem;
