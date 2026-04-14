/**
 * V2.2 player.js (飛升模組版 - 宗門對接與遺忘測試)
 * 職責：修士狀態管理、境界突破邏輯、屬性點加持、裝備數值計算、道具與殘卷消耗
 * 位置：/entities/player.js
 */

// 1. 引入天地法則與通訊陣法
import { Formula } from '../utils/Formula.js';
import { SaveManager } from '../utils/SaveManager.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const Player = {
    data: null,

    /**
     * 初始化修士數據
     */
    init() {
        console.log("【修士】神識開始跨境對接...");
        try {
            // 從存檔管理模組載入數據
            const savedData = (typeof SaveManager !== 'undefined') ? SaveManager.load() : null;
            
            // 載入數據，若無存檔則初始化新角色
            this.data = savedData || this.getInitialData();
            
            // 🟢 數據補丁：確保舊存檔相容宗門大更新
            if (this.data.realm === undefined) this.data.realm = 1; 
            if (this.data.sectPoints === undefined) this.data.sectPoints = 0;
            if (!this.data.world) {
                this.data.world = {
                    arrayLevel: 1, lastCollect: Date.now(),
                    workers: 0, farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 }
                };
            }

            Msg.log(savedData ? "神識歸位，修為恢復。" : "新進修士踏入凡塵，開啟練功修練之路。", "system");
            
            this.save();
        } catch (e) {
            console.error("【修士】初始化失敗:", e);
        }
    },

    /**
     * 持久化存檔
     */
    save() { 
        if (this.data && typeof SaveManager !== 'undefined') {
            SaveManager.save(this.data); 
        }
    },

    /**
     * 獲得經驗值 (瓶頸期判定)
     */
    gainExp(amount) {
        if (!this.data) return 0;
        
        // 1. 檢查是否處於瓶頸期
        if (this.data.exp >= this.data.maxExp) {
            Msg.log("感應到修為瓶頸，請先嘗試突破境界！", "system");
            return 0;
        }

        // 2. 獲取悟性加成
        const intVal = this.data.stats.int || 10;
        const bonus = Formula.calculateExpBonus(intVal);
        
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;
        
        // 3. 經驗值封頂
        if (this.data.exp >= this.data.maxExp) {
            this.data.exp = this.data.maxExp;
            Msg.log("✨ 體內靈氣充盈，已達修為瓶頸，隨時可嘗試突破！", "gold");
        }
        
        this.save();
        return finalExp;
    },

    /**
     * 境界突破邏輯
     */
    breakthrough() {
        if (!this.data || this.data.exp < this.data.maxExp) return false;
        
        console.log("【核心】開始突破境界...");
        this.levelUp(); // 執行升級程序
        return true;
    },

    /**
     * 等級與境界提升程序
     */
    levelUp() {
        if (!this.data) return;
        
        // 消耗經驗並提升等級
        this.data.exp = 0; 
        this.data.level++;
        
        // 每 10 級提升一個大境界
        if (this.data.level % 10 === 1 && this.data.level > 1) {
            this.data.realm++;
            Msg.log(`🎊 脫胎換骨！境界大突破，已晉升至新天地！`, "gold");
        }
        
        // 重新計算下一級經驗需求
        this.data.maxExp = Formula.calculateNextExp(this.data.maxExp, this.data.level);
        
        // 獲得自由屬性點
        this.data.statPoints += 5;
        
        // 突破時狀態補滿
        const pStats = this.getBattleStats();
        this.data.hp = pStats.maxHp;
        
        Msg.log(`【突破】修為精進，當前修為：Lv.${this.data.level}！`, "gold");

        this.save();

        // 即時刷新 UI (若 UI 模組已掛載)
        if (window.UI_Stats) window.UI_Stats.renderStats(); 
    },

    /**
     * 屬性加點
     */
    addStat(type) {
        if (this.data.statPoints <= 0) return false;

        this.data.stats[type]++;
        this.data.statPoints--;
        
        this.save();
        return true;
    },

    /**
     * 核心：獲取即時戰鬥數值 (基礎屬性 + 裝備加成)
     */
    getBattleStats() {
        const s = this.data.stats || { str: 10, con: 10, dex: 10, int: 10 };
        const equip = this.data.equipped || {};

        let extraAtk = 0;
        let extraHp = 0;
        let extraStats = { str: 0, con: 0, dex: 0, int: 0 };

        // 統計所有裝備屬性
        for (let slot in equip) {
            const item = equip[slot];
            if (item && item.stats) {
                if (item.stats.atk) extraAtk += item.stats.atk;
                if (item.stats.hp) extraHp += item.stats.hp;
                for (let attr in extraStats) {
                    if (item.stats[attr]) extraStats[attr] += item.stats[attr];
                }
            }
        }

        // 對接天道公式模組
        return {
            maxHp: Formula.calculateMaxHp(s.con + extraStats.con) + extraHp,
            atk: Formula.calculateAtk(s.str + extraStats.str) + extraAtk,
            def: Formula.calculateDef(s.dex + extraStats.dex),
            speed: Formula.calculateSpeed(s.dex + extraStats.dex)
        };
    },

    /**
     * 裝備穿戴邏輯
     */
    equipItem(uuid) {
        if (!this.data || !this.data.inventory) return false;
        
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];
        const slot = item.type;

        if (!['weapon', 'armor', 'accessory'].includes(slot)) {
            Msg.log("此物品無法穿戴！", "system");
            return false;
        }

        const oldMaxHp = this.getBattleStats().maxHp;

        // 脫下舊裝備
        if (this.data.equipped[slot]) {
            this.data.inventory.push(this.data.equipped[slot]);
        }

        // 穿上新裝備
        this.data.equipped[slot] = item;
        this.data.inventory.splice(index, 1);

        // 重新換算血量比例 (保持傷勢)
        const newMaxHp = this.getBattleStats().maxHp;
        const hpPercent = this.data.hp / oldMaxHp;
        this.data.hp = Math.max(1, Math.floor(hpPercent * newMaxHp));

        this.save();
        return true;
    },

    /**
     * 裝備卸下邏輯
     */
    unequip(slotId) {
        if (!this.data || !this.data.equipped || !this.data.equipped[slotId]) return false;

        const dataSrc = window.DB || window.DATA || window.GAMEDATA;
        const maxSlots = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.MAX_BAG_SLOTS) || 50; 
        if (this.data.inventory.length >= maxSlots) {
            Msg.log("儲物袋已滿，無法卸下裝備！", "system");
            return false;
        }

        const item = this.data.equipped[slotId];
        const oldMaxHp = this.getBattleStats().maxHp;

        this.data.inventory.push(item);
        this.data.equipped[slotId] = null;

        const newMaxHp = this.getBattleStats().maxHp;
        const hpPercent = this.data.hp / oldMaxHp;
        this.data.hp = Math.max(1, Math.floor(hpPercent * newMaxHp));

        this.save();
        return true;
    },

    /**
     * 道具消耗與神通參悟 (V2.1 五卷合一版)
     */
    consumeItem(uuid) {
        if (!this.data || !this.data.inventory) return false;
        
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];
        let consumedByFragmentLogic = false;

        if (item.type === 'fragment') {
            const skillName = item.skillName || item.name.replace('殘卷：', '');

            // 1. 重複學習判定
            const hasSkill = this.data.skills.some(s => s.name === skillName);
            if (hasSkill) {
                Msg.log(`道友已掌握神通【${skillName}】，無需再次參悟。`, "system");
                return false; 
            }

            // 2. 五合一與門檻判定
            if (item.volume) {
                // 檢查是否集齊卷一至卷五
                const vols = [1, 2, 3, 4, 5];
                const missingVols = [];
                for (let v of vols) {
                    if (!this.data.inventory.some(i => i.type === 'fragment' && i.skillName === skillName && i.volume === v)) {
                        missingVols.push(v);
                    }
                }

                if (missingVols.length > 0) {
                    // 翻譯卷數為中文顯示
                    const volMap = {1:"一", 2:"二", 3:"三", 4:"四", 5:"五"};
                    const missingText = missingVols.map(v => volMap[v]).join('、');
                    Msg.log(`【${skillName}】尚缺卷 ${missingText}，須集齊五卷方可強行參悟！`, "system");
                    return false;
                }

                // 悟性門檻檢查
                if (this.data.stats.int < 12) {
                    Msg.log(`你的悟性不足(需達 12 點)，強行合一恐有走火入魔之虞！`, "system");
                    return false;
                }

                // 扣除卷一到卷五各一張
                for (let v of vols) {
                    const idx = this.data.inventory.findIndex(i => i.type === 'fragment' && i.skillName === skillName && i.volume === v);
                    if (idx !== -1) {
                        if (this.data.inventory[idx].count && this.data.inventory[idx].count > 1) {
                            this.data.inventory[idx].count--;
                        } else {
                            this.data.inventory.splice(idx, 1);
                        }
                    }
                }
                consumedByFragmentLogic = true;

            } else {
                // 兼容：坊市買的舊版殘卷 (無卷數)，直接當作完整秘籍
                if (this.data.stats.int < 12) {
                    Msg.log(`你的悟性不足(需達 12 點)，無法參悟此秘籍！`, "system");
                    return false;
                }
            }

            // 3. 領悟神通
            this.data.skills.push({ 
                id: item.id || `sk_${Date.now()}`, 
                name: skillName, 
                level: 1,
                desc: `集齊五卷殘篇領悟而成的天地神通。`
            });
            Msg.log(`💡 金光大作！五卷合一，領悟神通：【${skillName}】！`, "gold");

        } else if (item.type === 'special' && item.id === 'i001') {
            this.data.coin += 500;
            Msg.log(`💰 打開靈石袋，獲得 500 靈石！`, "gold");
        } else {
            Msg.log("此物品無法直接使用。", "system");
            return false;
        }

        // 處理非五合一邏輯的一般道具消耗 (疊加道具數量扣除)
        if (!consumedByFragmentLogic) {
            const currentIndex = this.data.inventory.findIndex(i => i.uuid === uuid);
            if (currentIndex !== -1) {
                if (this.data.inventory[currentIndex].count && this.data.inventory[currentIndex].count > 1) {
                    this.data.inventory[currentIndex].count--;
                } else {
                    this.data.inventory.splice(currentIndex, 1);
                }
            }
        }

        this.save();
        return true;
    },

    /**
     * 🟢 新增：自散修為 (測試專用，遺忘神通)
     */
    unlearnSkill(skillName) {
        if (!this.data) return false;
        const idx = this.data.skills.findIndex(s => s.name === skillName);
        if (idx !== -1) {
            this.data.skills.splice(idx, 1);
            this.save();
            Msg.log(`⚠️ 你自散修為，強行遺忘了神通【${skillName}】！`, "system");
            if (window.Core) window.Core.updateUI();
            return true;
        }
        Msg.log(`你並未掌握【${skillName}】。`, "system");
        return false;
    },

    /**
     * 獲得物品
     */
    addItem(item) {
        if (!item || !this.data) return false;

        const dataSrc = window.DATA || window.GAMEDATA;
        const maxSlots = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.MAX_BAG_SLOTS) || 50; 
        
        if (this.data.inventory.length >= maxSlots) {
            Msg.log("儲物袋已滿！", "system");
            return false;
        }

        this.data.inventory.push(item);
        this.save();
        return true;
    },

    /**
     * 初始數據
     */
    getInitialData() {
        return {
            realm: 1,      // 境界層級
            level: 1,      // 小等級
            exp: 0, 
            maxExp: 100, 
            coin: 500,
            hp: 100,
            sectPoints: 0, // 🟢 新增：宗門貢獻點
            world: {       // 🟢 新增：宗門產業狀態
                arrayLevel: 1, 
                lastCollect: Date.now(),
                workers: 0, 
                farm: { level: 0, assigned: 0 }, 
                mine: { level: 0, assigned: 0 }
            },
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, 
            inventory: [], 
            skills: [],
            equipped: { weapon: null, armor: null, accessory: null }
        };
    }
};

window.Player = Player;
