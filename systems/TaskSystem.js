/**
 * V2.2 TaskSystem.js (飛升模組版 - 因果懸賞大腦)
 * 職責：生成 NPC 任務、檢查素材收集進度、交付任務並給予貢獻點。
 * 位置：/systems/TaskSystem.js
 */

import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const TaskSystem = {
    maxTasks: 3, // 告示牌最多同時顯示 3 個任務

    /**
     * 啟動懸賞系統，確保任務列表存在並補滿
     */
    init() {
        if (!Player.data) return;
        if (!Player.data.tasks) {
            Player.data.tasks = [];
        }
        // 如果任務池不滿，自動補滿
        this.fillTasks();
    },

    /**
     * 補充任務直到達到上限
     */
    fillTasks() {
        if (!Player.data || !Player.data.tasks) return;
        
        let added = false;
        while (Player.data.tasks.length < this.maxTasks) {
            Player.data.tasks.push(this.generateRandomTask());
            added = true;
        }
        
        if (added) Player.save();
    },

    /**
     * 生成單個隨機懸賞任務
     */
    generateRandomTask() {
        // 宗門日常需求模板 (道友可未來自行擴充)
        const templates = [
            { id: 'mat_bone', name: '妖獸骨骸', desc: '外門長老需煉製低階法器，急需妖獸骨骸作為主材。' },
            { id: 'mat_fur', name: '妖獸皮毛', desc: '嚴冬將至，內務堂需大量妖獸皮毛製作禦寒法衣。' },
            { id: 'mat_herb', name: '宗門仙草', desc: '煉丹房弟子操作不慎炸爐，急缺仙草重開一爐。' }
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        const reqCount = Math.floor(Math.random() * 5) + 3; // 隨機需求 3 ~ 7 個
        const reward = reqCount * 10; // 每個素材價值 10 點貢獻

        return {
            taskId: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            reqItemId: template.id,
            reqItemName: template.name,
            reqCount: reqCount,
            rewardPts: reward,
            desc: template.desc
        };
    },

    /**
     * 交付任務邏輯
     */
    submitTask(taskId) {
        if (!Player.data || !Player.data.tasks) return false;

        const taskIndex = Player.data.tasks.findIndex(t => t.taskId === taskId);
        if (taskIndex === -1) return false;

        const task = Player.data.tasks[taskIndex];
        
        // 尋找儲物袋中對應的素材 (比對 id 或 名稱，兼容新舊存檔)
        const invIndex = Player.data.inventory.findIndex(i => 
            i.id === task.reqItemId || (i.name && i.name.includes(task.reqItemName))
        );
        
        // 數量不足判定
        const hasItemCount = invIndex !== -1 ? (Player.data.inventory[invIndex].count || 1) : 0;
        if (hasItemCount < task.reqCount) {
            Msg.log(`素材【${task.reqItemName}】數量不足 (${hasItemCount}/${task.reqCount})，無法交付！`, "system");
            return false;
        }

        // 扣除儲物袋中的素材
        if (Player.data.inventory[invIndex].count) {
            Player.data.inventory[invIndex].count -= task.reqCount;
            if (Player.data.inventory[invIndex].count <= 0) {
                Player.data.inventory.splice(invIndex, 1);
            }
        } else {
            // 如果剛好是舊版沒有 count 屬性的單一物品，直接移除
            Player.data.inventory.splice(invIndex, 1);
        }

        // 發放宗門貢獻點
        Player.data.sectPoints = (Player.data.sectPoints || 0) + task.rewardPts;
        Msg.log(`📜 任務完成！上繳【${task.reqItemName}】x${task.reqCount}，獲得 ${task.rewardPts} 點宗門貢獻。`, "reward");

        // 移除已完成任務，並立刻補上新任務
        Player.data.tasks.splice(taskIndex, 1);
        this.fillTasks();

        Player.save();
        if (window.Core) window.Core.updateUI();
        
        return true;
    }
};

// 暴露給全域以相容 UI 點擊調用
window.TaskSystem = TaskSystem;
