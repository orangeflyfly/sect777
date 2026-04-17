/**
 * V3.5.8 player.js (萬象歸一 - 元神洗髓版)
 * 職責：修士狀態管理、境界突破、屬性動態計算、裝備穿戴(支援UUID)、殘卷消耗與靈石袋開啟
 * 修正：全面對接 equipments 裝備空間，修復戰力計算與裝備穿脫邏輯
 * 位置：/entities/player.js
 */

import { Formula } from '../utils/Formula.js';
import { SaveManager } from '../utils/SaveManager.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const Player = {
    data: null,

    init() {
        console.log("【修士】神識開始跨境對接，適應全新空間法則...");
        try {
            const savedData = (typeof SaveManager !== 'undefined') ? SaveManager.load() : null;
            
            this.data = savedData || this.getInitialData();
            
            // --- 數據補丁與空間法則相容 ---
            if (this.data.realm === undefined) this.data.realm = 1; 
            if (this.data.sectPoints === undefined) this.data.sectPoints = 0;
            if (this.data.buffs === undefined) this.data.buffs = [];
            
            // 基礎物資與裝備空間補齊
            if (!this.data.materials) this.data.materials = { herb: 0, ore: 0 };
            if (!this.data.equipments) this.data.equipments = [];
            if (!this.data.equipped) this.data.equipped = { weapon: null, armor: null, accessory: null };

            if (!this.data.world) {
                this.data.world = {
                    arrayLevel: 1, lastCollect: Date.now(),
                    workers: 0, farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 }
                };
            }

            // 🌟 舊存檔相容：如果舊裝備欄裡存的是「物件」，把它轉移到 equipments 並改存 UUID
            ['weapon', 'armor', 'accessory'].forEach(slot => {
                const eq = this.data.equipped[slot];
                if (eq && typeof eq === 'object' && eq.uuid) {
                    if (!this.data.equipments.find(i => i.uuid === eq.uuid)) {
                        this.data.equipments.push(eq);
                    }
                    this.data.equipped[slot] = eq.uuid;
                }
            });

            Msg.log(savedData ? "神識歸位，修為恢復。" : "新進修士踏入凡塵，開啟練功修練之路。", "system");
            this.save();
        } catch (e) {
            console.error("【修士】初始化失敗:", e);
        }
    },

    save() { 
        if (this.data && typeof SaveManager !== 'undefined') {
            SaveManager.save(this.data); 
        }
    },

    gainExp(amount) {
        if (!this.data) return 0;
        
        if (this.data.exp >= this.data.maxExp) {
            Msg.log("感應到修為瓶頸，請先嘗試突破境界！", "system");
            return 0;
        }

        const intVal = this.data.stats.int || 10;
        const bonus = Formula.calculateExpBonus(intVal);
        
        const finalExp = Math.floor(amount * bonus);
        this.data.exp += finalExp;
        
        if (this.data.exp >= this.data.maxExp) {
            this.data.exp = this.data.maxExp;
            Msg.log("✨ 體內靈氣充盈，已達修為瓶頸，隨時可嘗試突破！", "gold");
        }
        
        this.save();
        return finalExp;
    },

    breakthrough() {
        if (!this.data || this.data.exp < this.data.maxExp) return false;
        this.levelUp();
        return true;
    },

    levelUp() {
        if (!this.data) return;
        
        this.data.exp = 0; 
        this.data.level++;
        
        if (this.data.level % 10 === 1 && this.data.level > 1) {
            this.data.realm++;
            Msg.log(`🎊 脫胎換骨！境界大突破，已晉升至新天地！`, "gold");
        }
        
        this.data.maxExp = Formula.calculateNextExp(this.data.maxExp, this.data.level);
        this.data.statPoints += 5;
        
        const pStats = this.getBattleStats();
        this.data.hp = pStats.maxHp;
        
        Msg.log(`【突破】修為精進，當前修為：Lv.${this.data.level}！`, "gold");
        this.save();

        if (window.UI_Stats) window.UI_Stats.renderStats(); 
    },

    addStat(type) {
        if (this.data.statPoints <= 0) return false;
        this.data.stats[type]++;
        this.data.statPoints--;
        this.save();
        return true;
    },

    /**
     * 🌟 核心修復：戰力屬性動態計算
     * 職責：讀取 equipped 中的 UUID，並從 equipments 陣列中提取真實屬性加成
     */
    getBattleStats() {
        const s = this.data.stats || { str: 10, con: 10, dex: 10, int: 10 };
        const equipObj = this.data.equipped || {};
        const eqList = this.data.equipments || [];

        let extraAtk = 0;
        let extraDef = 0;
        let extraHp = 0;
        let extraStats = { str: 0, con: 0, dex: 0, int: 0 };

        // 遍歷當前穿戴的裝備 UUID
        for (let slot in equipObj) {
            const uuid = equipObj[slot];
            if (!uuid) continue;

            const item = eqList.find(i => i.uuid === uuid);
            if (item && item.stats) {
                if (item.stats.atk) extraAtk += item.stats.atk;
                if (item.stats.def) extraDef += item.stats.def;
                if (item.stats.hp) extraHp += item.stats.hp;
                
                for (let attr in extraStats) {
                    if (item.stats[attr]) extraStats[attr] += item.stats[attr];
                }
            }
        }

        return {
            maxHp: Formula.calculateMaxHp(s.con + extraStats.con) + extraHp,
            atk: Formula.calculateAtk(s.str + extraStats.str) + extraAtk,
            def: Formula.calculateDef(s.dex + extraStats.dex) + extraDef,
            speed: Formula.calculateSpeed(s.dex + extraStats.dex)
        };
    },

    /**
     * 🌟 核心修復：裝備穿戴邏輯
     */
    equipItem(uuid) {
        if (!this.data || !this.data.equipments) return false;
        
        const item = this.data.equipments.find(i => i.uuid === uuid);
        if (!item) return false;

        // 自動判斷欄位
        let slot = 'weapon';
        if (item.name.includes('甲') || item.name.includes('袍') || item.name.includes('鎧') || item.name.includes('衣') || item.name.includes('鏡')) slot = 'armor';
        if (item.name.includes('簪') || item.name.includes('佩') || item.name.includes('符') || item.name.includes('環')) slot = 'accessory';

        const oldMaxHp = this.getBattleStats().maxHp;

        // 寫入 UUID
        this.data.equipped[slot] = item.uuid;

        // 動態調整血量百分比
        const newMaxHp = this.getBattleStats().maxHp;
        const hpPercent = this.data.hp / oldMaxHp;
        this.data.hp = Math.max(1, Math.floor(hpPercent * newMaxHp));

        this.save();
        return true;
    },

    /**
     * 🌟 核心修復：裝備卸下邏輯
     */
    unequip(slotId) {
        if (!this.data || !this.data.equipped || !this.data.equipped[slotId]) return false;

        const oldMaxHp = this.getBattleStats().maxHp;

        // 清空該欄位的 UUID
        this.data.equipped[slotId] = null;

        // 動態調整血量百分比
        const newMaxHp = this.getBattleStats().maxHp;
        const hpPercent = this.data.hp / oldMaxHp;
        this.data.hp = Math.max(1, Math.floor(hpPercent * newMaxHp));
        
        this.save();
        return true;
    },

    /**
     * 🟢 核心改進：物品疊加邏輯 (主要用於舊版 drops 或特殊陣列物品)
     */
    addItem(item) {
        if (!item || !this.data) return false;

        const dataSrc = window.DB || window.DATA;
        const maxSlots = (dataSrc && dataSrc.CONFIG && dataSrc.CONFIG.MAX_BAG_SLOTS) || 50;

        // 1. 檢查是否為可疊加類型 (素材、殘卷、特殊道具)
        const stackableTypes = ['material', 'fragment', 'special'];
        
        if (stackableTypes.includes(item.type)) {
            const existing = this.data.inventory.find(i => 
                i.name === item.name && 
                i.type === item.type && 
                (i.volume === item.volume)
            );

            if (existing) {
                existing.count = (existing.count || 1) + (item.count || 1);
                this.save();
                return true;
            }
        }

        if (this.data.inventory.length >= maxSlots) {
            Msg.log("儲物袋已滿！", "system");
            return false;
        }

        if (!item.count) item.count = 1;
        
        this.data.inventory.push(item);
        this.save();
        return true;
    },

    /**
     * 🟢 核心改進：道具消耗、靈石袋開啟、參悟升級
     */
    consumeItem(uuid) {
        if (!this.data || !this.data.inventory) return false;
        
        const index = this.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return false;

        const item = this.data.inventory[index];
        let wasFragmentLogic = false;

        // 1. 處理功法殘卷
        if (item.type === 'fragment') {
            const skillName = item.skillName || item.name.replace('殘卷：', '').split('(')[0];

            if (item.volume) {
                // 五卷合一判定
                const vols = [1, 2, 3, 4, 5];
                const missingVols = [];
                for (let v of vols) {
                    if (!this.data.inventory.some(i => i.type === 'fragment' && i.skillName === skillName && i.volume === v)) {
                        missingVols.push(v);
                    }
                }

                if (missingVols.length > 0) {
                    const volMap = {1:"一", 2:"二", 3:"三", 4:"四", 5:"五"};
                    const missingText = missingVols.map(v => volMap[v]).join('、');
                    Msg.log(`【${skillName}】尚缺卷 ${missingText}，須集齊五卷方可參悟突破！`, "system");
                    return false;
                }

                if (this.data.stats.int < 12) {
                    Msg.log(`你的悟性不足(需達 12 點)，強行參悟恐有走火入魔之虞！`, "system");
                    return false;
                }

                // 消耗五卷
                for (let v of vols) {
                    const idx = this.data.inventory.findIndex(i => i.type === 'fragment' && i.skillName === skillName && i.volume === v);
                    if (idx !== -1) {
                        if (this.data.inventory[idx].count > 1) this.data.inventory[idx].count--;
                        else this.data.inventory.splice(idx, 1);
                    }
                }
                wasFragmentLogic = true;
            }

            // 領悟或升級
            const existingSkill = this.data.skills.find(s => s.name === skillName);
            if (existingSkill) {
                existingSkill.level = (existingSkill.level || 1) + 1;
                Msg.log(`🔥 融會貫通！【${skillName}】境界突破至 Lv.${existingSkill.level}！`, "gold");
            } else {
                this.data.skills.push({ 
                    id: `sk_${Date.now()}`, name: skillName, level: 1,
                    desc: `集五卷殘篇領悟而成的神通。`
                });
                Msg.log(`💡 金光大作！五卷合一，領悟神通：【${skillName}】！`, "gold");
            }
        } 
        // 2. 🟢 處理靈石袋 
        else if (item.type === 'special' && (item.id === 'i001' || item.name.includes('靈石袋'))) {
            const gain = item.value || 500;
            this.data.coin += gain;
            Msg.log(`💰 打開${item.name}，獲得 ${gain} 靈石！`, "gold");
            if (window.FX) window.FX.spawnPopText(`+${gain} 靈石`, 'player', '#fbbf24');
        } 
        else {
            Msg.log("此物品目前無法直接使用。", "system");
            return false;
        }

        // 扣除一般道具數量
        if (!wasFragmentLogic) {
            const currentIndex = this.data.inventory.findIndex(i => i.uuid === uuid);
            if (currentIndex !== -1) {
                if (this.data.inventory[currentIndex].count > 1) {
                    this.data.inventory[currentIndex].count--;
                } else {
                    this.data.inventory.splice(currentIndex, 1);
                }
            }
        }

        this.save();
        if (window.Core && window.Core.updateUI) window.Core.updateUI();
        return true;
    },

    unlearnSkill(skillName) {
        if (!this.data) return false;
        const idx = this.data.skills.findIndex(s => s.name === skillName);
        if (idx !== -1) {
            this.data.skills.splice(idx, 1);
            this.save();
            Msg.log(`⚠️ 你自散修為，強行遺忘了神通【${skillName}】！`, "system");
            if (window.Core && window.Core.updateUI) window.Core.updateUI();
            return true;
        }
        return false;
    },

    getInitialData() {
        return {
            realm: 1, level: 1, exp: 0, maxExp: 100, coin: 500, hp: 100,
            sectPoints: 0, 
            materials: { herb: 0, ore: 0 },
            world: { 
                arrayLevel: 1, lastCollect: Date.now(), workers: 0, 
                farm: { level: 0, assigned: 0 }, mine: { level: 0, assigned: 0 },
                alchemy: { level: 0, assigned: 0 }, forge: { level: 0, assigned: 0 }
            },
            buffs: [],
            stats: { str: 10, con: 10, dex: 10, int: 10 },
            statPoints: 0, inventory: [], skills: [], equipments: [],
            equipped: { weapon: null, armor: null, accessory: null }
        };
    }
};

window.Player = Player;
