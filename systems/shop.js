/**
 * V3.5.8 shop.js (萬象歸一 - 坊市交易大腦版)
 * 職責：處理坊市交易邏輯 (購買/出售)、支援裝備空間與字典空間、新增一鍵批量出售
 * 位置：/systems/shop.js
 */

// 1. 導入必要的神識模組
import { Player } from '../entities/player.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const ShopLogic = {
    /**
     * 執行購買動作
     * @param {Object} shopItem - 商店商品數據
     */
    buy(shopItem) {
        if (!Player || !Player.data) return false;

        // 1. 靈石檢查
        let currentCoins = Player.data.coin !== undefined ? Player.data.coin : (Player.data.coins || 0);

        if (currentCoins < shopItem.price) {
            Msg.log("靈石不足，仙友請回吧。", "red");
            return false;
        }

        // 2. 特殊物品：低階靈石袋 (隨機開獎機緣)
        if (shopItem.name === "低階靈石袋") {
            const bonus = 500 + Math.floor(Math.random() * 1000);
            
            if (Player.data.coin !== undefined) Player.data.coin = Player.data.coin - shopItem.price + bonus;
            else Player.data.coins = Player.data.coins - shopItem.price + bonus;
            
            Msg.log(`開啟靈石袋，獲得 🪙 ${bonus}`, "gold");
            Player.save();
            return true;
        }

        // 3. 一般物品/殘卷/法寶購買
        // 深拷貝一份商品數據，避免修改到商店原始模板 (確保煉器爐純淨)
        const newItem = JSON.parse(JSON.stringify(shopItem));
        
        // 生成唯一識別碼 (UUID)，確保購買的寶物能被獨立識別與出售
        newItem.uuid = 'it_' + Date.now() + Math.random().toString(36).substr(2, 5);
        newItem.count = 1;

        let success = false;

        // 🌟 核心修正：若是裝備法寶，精準送入 equipments 陣列
        if (['weapon', 'armor', 'accessory', 'equipment'].includes(newItem.type)) {
            if (!Player.data.equipments) Player.data.equipments = [];
            Player.data.equipments.push(newItem);
            success = true;
        } else {
            // 調用 Player 模組的添加物品功能 (存入 inventory 陣列)
            success = Player.addItem(newItem);
        }

        if (success) {
            if (Player.data.coin !== undefined) Player.data.coin -= shopItem.price;
            else Player.data.coins -= shopItem.price;
            // 存檔紀錄
            Player.save();
            return true;
        } else {
            // addItem 失敗（通常是儲物袋滿了），Player 模組內已有對應 Msg 提示
            return false;
        }
    },

    /**
     * 出售物品功能
     * @param {string} itemUuid - 物品唯一識別碼
     */
    sell(itemUuid) {
        if (!Player || !Player.data) return false;
        
        // 🛑 防呆：檢查是否正穿戴在身上
        const eqp = Player.data.equipped || {};
        if (eqp.weapon === itemUuid || eqp.armor === itemUuid || eqp.accessory === itemUuid) {
            Msg.log("此法寶正穿戴於身，請先卸下再出售！", "system");
            return false;
        }

        let foundArray = null;
        let index = -1;
        let item = null;

        // 1. 先找裝備庫 (equipments)
        if (Array.isArray(Player.data.equipments)) {
            index = Player.data.equipments.findIndex(i => i.uuid === itemUuid);
            if (index !== -1) {
                foundArray = Player.data.equipments;
                item = foundArray[index];
            }
        }

        // 2. 若不在裝備庫，再找儲物袋 (inventory 陣列)
        if (!item && Array.isArray(Player.data.inventory)) {
            index = Player.data.inventory.findIndex(i => i.uuid === itemUuid);
            if (index !== -1) {
                foundArray = Player.data.inventory;
                item = foundArray[index];
            }
        }
        
        // 3. 處理字典型態的丹藥與材料 (含有 dict_ 前綴)
        if (!item && itemUuid.startsWith('dict_')) {
            const key = itemUuid.replace('dict_', '');
            if (Player.data.inventory && Player.data.inventory[key] > 0) {
                Player.data.inventory[key]--;
                
                // 定義材料與丹藥的回收價
                let sellPrice = 50; 
                if (key === '仙草' || key === '玄鐵') sellPrice = 10;
                if (key.includes('造化')) sellPrice = 500;
                
                if (Player.data.coin !== undefined) Player.data.coin += sellPrice;
                else Player.data.coins += sellPrice;
                
                Msg.log(`出售【${key}】，獲得 🪙 ${sellPrice}`, "system");
                Player.save();
                return true;
            }
            return false;
        }

        // 4. 正式結算陣列物品
        if (item && foundArray) {
            // 計算回收價 (五折回收或基礎價值)
            let sellPrice = item.price ? Math.floor(item.price * 0.5) : ((item.rarity || 1) * 20);
            
            // 🌟 強化過的裝備回收價大幅提升
            if (item.plus) {
                sellPrice += item.plus * 200; 
            }
            
            if (Player.data.coin !== undefined) Player.data.coin += sellPrice;
            else Player.data.coins += sellPrice;
            
            // 如果是堆疊物品則扣除數量
            if (item.count > 1) {
                item.count--;
            } else {
                foundArray.splice(index, 1); // 徹底移除
            }
            
            Msg.log(`出售【${item.name}】，獲得 🪙 ${sellPrice.toLocaleString()}`, "system");
            Player.save();
            return true;
        }
        
        Msg.log("空間法則中找不到該物品，無法出售。", "red");
        return false;
    },

    /**
     * 🌟 新增：批量出售功能 (支援下拉選單指定的稀有度)
     * @param {number} targetRarity - 目標稀有度 (1:凡, 2:良, 3:優, 4:極, 5:神)
     */
    sellBatch(targetRarity) {
        if (!Player || !Player.data) return false;

        let totalEarned = 0;
        let soldCount = 0;

        const eqp = Player.data.equipped || {};

        // 1. 批量賣裝備 (equipments 陣列)
        if (Array.isArray(Player.data.equipments)) {
            // 倒序遍歷以安全刪除陣列元素
            for (let i = Player.data.equipments.length - 1; i >= 0; i--) {
                const item = Player.data.equipments[i];
                const isEquipped = (eqp.weapon === item.uuid || eqp.armor === item.uuid || eqp.accessory === item.uuid);
                
                // 條件：稀有度相符，且未裝備
                if (item.rarity === targetRarity && !isEquipped) {
                    let sellPrice = item.price ? Math.floor(item.price * 0.5) : (item.rarity * 20);
                    if (item.plus) sellPrice += item.plus * 200;

                    totalEarned += sellPrice;
                    soldCount++;
                    Player.data.equipments.splice(i, 1);
                }
            }
        }

        // 2. 批量賣背包陣列物品 (inventory 陣列，例如殘卷)
        if (Array.isArray(Player.data.inventory)) {
            for (let i = Player.data.inventory.length - 1; i >= 0; i--) {
                const item = Player.data.inventory[i];
                if (item.uuid && item.rarity === targetRarity) {
                    let sellPrice = item.price ? Math.floor(item.price * 0.5) : (item.rarity * 20);
                    let count = item.count || 1;
                    
                    totalEarned += sellPrice * count;
                    soldCount += count;
                    Player.data.inventory.splice(i, 1);
                }
            }
        }

        if (soldCount > 0) {
            if (Player.data.coin !== undefined) Player.data.coin += totalEarned;
            else Player.data.coins += totalEarned;
            
            Msg.log(`一鍵清空了 ${soldCount} 件「${this.getRarityName(targetRarity)}」法寶/道具，共獲得 🪙 ${totalEarned.toLocaleString()}`, "gold");
            Player.save();
            return true;
        } else {
            Msg.log(`儲物袋中沒有未裝備的「${this.getRarityName(targetRarity)}」可供出售。`, "system");
            return false;
        }
    },

    getRarityName(r) {
        const names = { 1: '凡品', 2: '良品', 3: '優品', 4: '極品', 5: '神品' };
        return names[r] || '凡品';
    }
};

/**
 * --- 全域對接鎖 ---
 * 確保 UI_Shop 裡面的 onclick="UI_Shop.executeBuy" 
 * 呼叫到 ShopLogic 時能正確對接
 */
window.ShopLogic = ShopLogic;

console.log("%c【系統】坊市律令 V3.5.8 模組化完成，支援萬象空間與批量交易。", "color: #fbbf24; font-weight: bold;");
