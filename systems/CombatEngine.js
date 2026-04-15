/**
 * V2.3 CombatEngine.js (飛升模組版 - 妖獸開智與神通自動觸發)
 * 職責：處理戰鬥流程、怪物AI、狀態異常(Debuff)、神通倍率計算與獎勵結算
 * 位置：/systems/CombatEngine.js
 */

import { Player } from '../entities/player.js';
import { Formula } from '../utils/Formula.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';
import { FX } from '../utils/fx.js';
import { ItemFactory } from '../utils/ItemFactory.js';

export const CombatEngine = {
    currentMonster: null,
    isProcessing: false,
    currentMapId: 101, 

    init(mapId = null) {
        let targetMap = mapId;
        if (!targetMap) {
            targetMap = (Player.data && Player.data.currentMapId) ? Player.data.currentMapId : 101;
        }

        console.log(`%c【戰鬥引擎】啟動歷練，目標地圖 ID: ${targetMap}`, "color: #a78bfa; font-weight: bold;");
        this.currentMapId = targetMap;

        if (Player.data) {
            Player.data.currentMapId = targetMap;
            Player.save(); 
        }

        setTimeout(() => {
            this.spawnMonster(targetMap);
        }, 100); 
    },

    spawnMonster(mapId) {
        const dataSrc = window.DB || window.DATA || window.GAMEDATA;
        if (!dataSrc || !dataSrc.REGIONS) return console.error("❌ 找不到地圖數據庫");

        const map = this.findMapData(mapId);
        if (!map || !map.monsterIds || map.monsterIds.length === 0) {
            return Msg.log(`此地妖氣雜亂，尋不到妖獸蹤跡...`, "system");
        }

        const monsterId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
        const template = dataSrc.MONSTERS ? dataSrc.MONSTERS[monsterId] : null;

        if (!template) return;

        this.currentMonster = { 
            ...template, 
            hp: template.hp, 
            maxHp: template.hp 
        };

        if (window.UI_Battle && typeof window.UI_Battle.updateMonster === 'function') {
            window.UI_Battle.updateMonster(this.currentMonster);
        }

        Msg.log(`【歷練】遇到 ${template.name}！`, "system"); 
    },

    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        if (Player.data && Player.data.hp <= 0) return Msg.log("你體力耗盡，無法發動攻擊！", "system");

        this.isProcessing = true;
        
        // 🟢 回合開始前，先結算身上的異常狀態 (如中毒)
        this.processBuffs();
        
        if (Player.data.hp > 0) {
            this.executeTurn(true);
        } else {
            this.handleDefeat(); // 毒發身亡
        }
    },

    executeTurn(isPlayerTurn) {
        if (!this.currentMonster || !Player.data) {
            this.isProcessing = false;
            return;
        }

        const dataSrc = window.DB || window.DATA;
        let attackerAtk = isPlayerTurn ? Player.getBattleStats().atk : this.currentMonster.atk;
        let baseDamage = Formula.getDamageRange(attackerAtk);
        let finalDamage = baseDamage;

        if (isPlayerTurn) {
            // 🟢 玩家回合：神通觸發邏輯
            if (Player.data.skills && Player.data.skills.length > 0) {
                // 30% 機率隨機觸發一門已掌握的神通
                if (Math.random() < 0.3) {
                    const randomSkill = Player.data.skills[Math.floor(Math.random() * Player.data.skills.length)];
                    const skillDef = dataSrc.SKILLS ? dataSrc.SKILLS[randomSkill.name] : null;
                    
                    if (skillDef) {
                        // 計算等級加成：每級增加 DB.CONFIG 裡設定的倍率 (預設 0.2)
                        const boost = 1 + ((randomSkill.level - 1) * (dataSrc.CONFIG.SKILL_UPGRADE_BOOST || 0.2));
                        const mult = (skillDef.multiplier || 1.5) * boost;
                        finalDamage = Math.floor(baseDamage * mult);
                        Msg.log(`🔥 觸發神通【${randomSkill.name}】Lv.${randomSkill.level}！威力大增！`, "gold");
                        FX.shake('combat-area'); // 大招震動畫面
                    }
                }
            }

            this.currentMonster.hp -= finalDamage;
            Msg.log(`你攻擊造成 ${finalDamage} 點傷害。`, "player-atk");
            FX.shake('monster-display');
            FX.spawnPopText(finalDamage, 'monster');

        } else {
            // 🟢 怪物回合：妖獸開智 (AI 技能)
            let usedSkill = false;
            
            // 如果怪物有配置技能，且判定發動
            if (this.currentMonster.skill && dataSrc.SKILLS && dataSrc.SKILLS[this.currentMonster.skill]) {
                const skillDef = dataSrc.SKILLS[this.currentMonster.skill];
                
                if (Math.random() < (skillDef.chance || 0.2)) {
                    usedSkill = true;
                    Msg.log(`⚠️ ${this.currentMonster.name} 發動了天賦【${this.currentMonster.skill}】！`, "monster-atk");
                    
                    if (skillDef.type === 'damage') {
                        finalDamage = Math.floor(baseDamage * (skillDef.multiplier || 2.0));
                        FX.shake('combat-area');
                    } else if (skillDef.type === 'debuff') {
                        this.applyDebuffToPlayer(skillDef);
                    }
                }
            }

            Player.data.hp -= finalDamage;
            if (!usedSkill) {
                Msg.log(`${this.currentMonster.name} 撲咬造成 ${finalDamage} 點傷害。`, "monster-atk");
            } else if (finalDamage > baseDamage) {
                Msg.log(`遭受重擊！損失 ${finalDamage} 點氣血。`, "monster-atk");
            }
            
            FX.shake('player-hp-fill');
            FX.spawnPopText(finalDamage, 'player');
            
            if (window.UI_Battle) {
                window.UI_Battle.updatePlayerHP(Player.data.hp, Player.getBattleStats().maxHp);
            }
        }

        if (window.UI_Battle) window.UI_Battle.updateMonster(this.currentMonster);

        // 生死判定
        if (this.currentMonster.hp <= 0) {
            this.handleVictory();
        } else if (!isPlayerTurn && Player.data.hp <= 0) {
            this.handleDefeat();
        } else if (isPlayerTurn) {
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            this.isProcessing = false; 
        }
    },

    // 🟢 處理異常狀態 (中毒結算)
    processBuffs() {
        if (!Player.data || !Player.data.buffs || Player.data.buffs.length === 0) return;

        let toRemove = [];
        Player.data.buffs.forEach((b, idx) => {
            if (b.effect === 'poison') {
                const dmg = Math.max(1, Math.floor(Player.getBattleStats().maxHp * 0.05)); // 毒發扣 5% 最大生命
                Player.data.hp -= dmg;
                Msg.log(`🤢 妖毒發作！損失 ${dmg} 點氣血。`, 'monster-atk');
                FX.spawnPopText(dmg, 'player', '#22c55e');
            }
            
            b.duration--;
            if (b.duration <= 0) {
                toRemove.push(idx);
                Msg.log(`✨ 體內靈氣流轉，【${b.name}】狀態已解除。`, 'system');
            }
        });

        // 移除過期狀態
        for (let i = toRemove.length - 1; i >= 0; i--) {
            Player.data.buffs.splice(toRemove[i], 1);
        }
        
        if (window.UI_Battle) {
            window.UI_Battle.updatePlayerHP(Player.data.hp, Player.getBattleStats().maxHp);
        }
    },

    // 🟢 賦予玩家減益狀態
    applyDebuffToPlayer(skillDef) {
        if (!Player.data.buffs) Player.data.buffs = [];
        
        const existing = Player.data.buffs.find(b => b.effect === skillDef.effect);
        if (existing) {
            existing.duration = skillDef.duration; // 重置持續時間
        } else {
            Player.data.buffs.push({ 
                name: this.currentMonster.skill, 
                effect: skillDef.effect, 
                duration: skillDef.duration 
            });
        }
        Msg.log(`⚠️ 你中了【${this.currentMonster.skill}】！`, "monster-atk");
    },

    handleVictory() {
        const m = this.currentMonster;
        Msg.log(`${m.name} 已被擊敗。`, "system");

        const exp = Player.gainExp(m.exp);
        Player.data.coin += (m.gold || 0);
        Msg.log(`獲得經驗 ${exp}，靈石 ${m.gold || 0}`, "reward");

        if (exp > 0) FX.spawnPopText(`+${exp} EXP`, 'player', '#2ecc71');
        if (m.gold > 0) {
            setTimeout(() => FX.spawnPopText(`+${m.gold} 靈石`, 'player', '#fbbf24'), 250);
        }

        // 🟢 戰利品掉落判定 (已平衡機率)
        if (Math.random() < 0.1) {
            const item = ItemFactory.createEquipment();
            if (item) {
                Player.addItem(item);
                Msg.log(`🎊 獲得戰利品：【${item.name}】！`, "reward");
            }
        }

        if (Math.random() < 0.6) {
            const matNames = ["妖獸骨骸", "殘破皮毛", "低階妖丹", "陣法殘片"];
            const randomMat = matNames[Math.floor(Math.random() * matNames.length)];
            const material = {
                uuid: 'mat_' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: randomMat, type: 'material', rarity: 1, count: 1,
                desc: `從妖獸身上採集的素材，似乎可以用來換取靈石或修復法陣。`,
                price: 15
            };
            Player.addItem(material);
            Msg.log(`📦 採集到素材：【${randomMat}】`, "reward");
        }

        if (Math.random() < 0.15) {
            const skillList = ["烈焰斬", "回春術", "青元劍訣"];
            const skillName = skillList[Math.floor(Math.random() * skillList.length)];
            const volNum = Math.floor(Math.random() * 5) + 1; 
            const volMap = {1:"一", 2:"二", 3:"三", 4:"四", 5:"五"};

            const fragment = {
                uuid: 'frag_' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: `殘卷：${skillName}(卷${volMap[volNum]})`,
                type: 'fragment', skillName: skillName, volume: volNum, rarity: 3, count: 1,
                desc: `記載著【${skillName}】部分心法的殘卷，集齊五卷方可領悟。`,
                price: 50
            };
            Player.addItem(fragment);
            Msg.log(`📜 發現殘卷：【${fragment.name}】！`, "gold");
        }

        if (window.Core) window.Core.updateUI();
        this.currentMonster = null;

        setTimeout(() => { 
            this.isProcessing = false; 
            this.spawnMonster(this.currentMapId); 
        }, 1500);
    },

    handleDefeat() {
        Msg.log(`你被 ${this.currentMonster.name} 擊敗了... 重傷昏迷。`, "monster-atk");
        this.currentMonster = null;

        // 戰敗清除所有狀態
        if (Player.data.buffs) Player.data.buffs = [];

        const pStats = Player.getBattleStats();
        Player.data.hp = pStats.maxHp; 

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

window.CombatEngine = CombatEngine;
