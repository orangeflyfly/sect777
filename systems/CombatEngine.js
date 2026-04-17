/**
 * V3.5.9 CombatEngine.js (萬象因果 - 專屬掉落與資源歸一版)
 * 職責：處理主動/被動技能、冷卻計時、境界壓制、特效對接、修正妖獸專屬掉落因果
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
    skillCDs: {},     
    heartbeat: null,  

    init(mapId = null) {
        let targetMap = mapId;
        if (!targetMap) {
            targetMap = (Player.data && Player.data.currentMapId) ? Player.data.currentMapId : 101;
        }
        console.log(`%c【戰鬥引擎】啟動歷練，地圖 ID: ${targetMap}`, "color: #a78bfa; font-weight: bold;");
        this.currentMapId = targetMap;

        if (Player.data) {
            Player.data.currentMapId = targetMap;
            Player.save(); 
        }

        this.startHeartbeat();

        setTimeout(() => {
            this.spawnMonster(targetMap);
            this.renderBuffsUI(); 
        }, 100); 
    },

    startHeartbeat() {
        if (this.heartbeat) clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
            this.updateCDs();
        }, 1000);
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

    async useSkill(skillName) {
        if (this.isProcessing || !this.currentMonster) return;
        
        if (this.skillCDs[skillName] > 0) {
            Msg.log(`神通【${skillName}】靈力運轉中，還需 ${this.skillCDs[skillName]} 秒。`, "system");
            return;
        }

        const dataSrc = window.DB || window.DATA;
        const skillDef = dataSrc.SKILLS[skillName];
        if (!skillDef) return;

        this.isProcessing = true;
        
        const icon = skillDef.icon || (skillDef.type === 'heal' ? "✨" : "🔥"); 
        await FX.skillCutIn(skillName, icon); 

        this.skillCDs[skillName] = skillDef.cd || 5;

        this.processBuffs(); 
        if (Player.data.hp > 0) {
            this.executeTurn(true, skillDef, skillName);
        } else {
            this.handleDefeat();
        }
    },

    playerAttack() {
        if (this.isProcessing || !this.currentMonster) return;
        if (Player.data.hp <= 0) return Msg.log("你重傷未癒，無法出招！", "system");

        this.isProcessing = true;
        this.processBuffs(); 
        
        if (Player.data.hp > 0) {
            this.executeTurn(true, null, null); 
        } else {
            this.handleDefeat();
        }
    },

    executeTurn(isPlayerTurn, skillUsed = null, skillName = "") {
        if (!this.currentMonster || !Player.data) {
            this.isProcessing = false;
            return;
        }

        const dataSrc = window.DB || window.DATA;
        const pStats = Player.getBattleStats();
        
        const playerRealm = Player.data.realm || 1;
        const monsterLevel = this.currentMonster.level || 1;
        const monsterRealm = Math.floor((monsterLevel - 1) / 10) + 1;
        const realmDiff = Math.max(0, playerRealm - monsterRealm);
        const realmBonus = 1 + (realmDiff * 0.2);

        let attackerAtk = isPlayerTurn ? pStats.atk : this.currentMonster.atk;
        let baseDamage = Formula.getDamageRange(attackerAtk);
        let finalDamage = Math.floor(baseDamage * realmBonus);

        const dodgeRate = isPlayerTurn ? (this.currentMonster.dodge || 0.05) : (pStats.dodgeRate || 0.05);
        const isDodge = Math.random() < dodgeRate;

        if (isDodge) {
            if (isPlayerTurn) {
                Msg.log(`💨 ${this.currentMonster.name} 身形一閃，躲過了你的攻擊！`, "system");
                FX.spawnPopText("閃避", 'monster', '#94a3b8');
            } else {
                Msg.log(`💨 你腳踏七星，驚險閃避了 ${this.currentMonster.name} 的攻擊！`, "system");
                FX.spawnPopText("閃避", 'player', '#94a3b8');
            }
        } else {
            const critRate = isPlayerTurn ? (pStats.critRate || 0.1) : (this.currentMonster.critRate || 0.05);
            const critDmg = isPlayerTurn ? (pStats.critDmg || 1.5) : (this.currentMonster.critDmg || 1.5);
            const isCrit = Math.random() < critRate;

            if (isCrit) {
                finalDamage = Math.floor(finalDamage * critDmg);
                FX.shake('combat-area'); 
            }

            if (isPlayerTurn) {
                if (skillUsed) {
                    const playerSkill = Player.data.skills.find(s => s.name === skillName);
                    const skillLv = playerSkill ? playerSkill.level : 1;
                    
                    const configBoost = (dataSrc.CONFIG && dataSrc.CONFIG.SKILL_UPGRADE_BOOST) ? Number(dataSrc.CONFIG.SKILL_UPGRADE_BOOST) : 0.2;
                    const safeBoost = isNaN(configBoost) ? 0.2 : configBoost;
                    const boost = 1 + ((skillLv - 1) * safeBoost);
                    
                    let rawMult = skillUsed.multiplier || skillUsed.power || skillUsed.damage || 1.5;
                    let skillMult = Number(rawMult);
                    if (isNaN(skillMult)) skillMult = 1.5;

                    finalDamage = Math.floor(finalDamage * skillMult * boost);

                    if (isNaN(finalDamage)) {
                        console.error("❌ 戰鬥引擎：偵測到 NaN 傷害，啟動強制修正");
                        finalDamage = Math.max(1, Math.floor(baseDamage));
                    }
                }

                const critPrefix = isCrit ? "💥 暴擊！" : "";
                const logType = isCrit ? "gold" : "default";

                if (skillUsed) {
                    Msg.log(`${critPrefix}🔥 施展神通【${skillName}】造成 ${finalDamage} 點傷害。`, logType);
                } else {
                    Msg.log(`${critPrefix}發動普通攻擊，造成 ${finalDamage} 點傷害。`, logType);
                }

                this.handlePassiveSkills('onAttack', { damage: finalDamage });

                this.currentMonster.hp -= finalDamage;
                FX.shake('monster-display');
                FX.spawnPopText(finalDamage, 'monster', isCrit ? '#fcd34d' : null);

            } else {
                let monsterFinalDmg = finalDamage;
                if (this.currentMonster.skill && dataSrc.SKILLS[this.currentMonster.skill]) {
                    const mSkill = dataSrc.SKILLS[this.currentMonster.skill];
                    if (Math.random() < (mSkill.chance || 0.2)) {
                        Msg.log(`⚠️ ${this.currentMonster.name} 發動【${this.currentMonster.skill}】！`, "monster-atk");
                        if (mSkill.type === 'damage') {
                            const mRawMult = mSkill.multiplier || mSkill.power || mSkill.damage || 1.5;
                            let mMult = Number(mRawMult);
                            if (isNaN(mMult)) mMult = 1.5;
                            
                            monsterFinalDmg = Math.floor(monsterFinalDmg * mMult);
                            if (isNaN(monsterFinalDmg)) monsterFinalDmg = Math.floor(baseDamage);
                            
                            FX.shake('combat-area');
                        } else if (mSkill.type === 'debuff') {
                            this.applyDebuffToPlayer(mSkill);
                        }
                    }
                }

                Player.data.hp -= monsterFinalDmg;
                const critPrefix = isCrit ? "💥 致命一擊！" : "";
                Msg.log(`${critPrefix}${this.currentMonster.name} 造成 ${monsterFinalDmg} 點傷害。`, "monster-atk");
                
                FX.shake('player-display');
                FX.spawnPopText(monsterFinalDmg, 'player', isCrit ? '#fcd34d' : null);
                
                if (window.UI_Battle) {
                    window.UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
                }
            }
        }

        if (window.UI_Battle) window.UI_Battle.updateMonster(this.currentMonster);

        if (this.currentMonster.hp <= 0) {
            this.handleVictory();
        } else if (!isPlayerTurn && Player.data.hp <= 0) {
            this.handleDefeat();
        } else if (isPlayerTurn) {
            setTimeout(() => this.executeTurn(false), 600);
        } else {
            this.handlePassiveSkills('onTurnEnd');
            this.isProcessing = false; 
        }
    },

    handlePassiveSkills(trigger, context = {}) {
        const dataSrc = window.DB || window.DATA;
        if (!Player.data.skills) return;

        Player.data.skills.forEach(s => {
            const def = dataSrc.SKILLS[s.name];
            if (!def || !def.isPassive) return;

            if (trigger === 'onTurnEnd' && def.type === 'auto_heal') {
                const heal = Math.floor(Player.getBattleStats().maxHp * def.multiplier);
                Player.data.hp = Math.min(Player.data.hp + heal, Player.getBattleStats().maxHp);
                Msg.log(`☘️ 被動【${s.name}】運轉，恢復 ${heal} 氣血。`, "gold");
            }

            if (trigger === 'onAttack' && def.type === 'lifesteal') {
                if (Math.random() < (def.chance || 0.15)) {
                    const heal = Math.floor(context.damage * def.multiplier);
                    Player.data.hp = Math.min(Player.data.hp + heal, Player.getBattleStats().maxHp);
                    Msg.log(`🧛 被動【${s.name}】觸發，吸取 ${heal} 氣血！`, "gold");
                    FX.spawnPopText(`+${heal}`, 'player', '#ef4444');
                }
            }
        });
    },

    updateCDs() {
        let needsUpdate = false;
        for (let key in this.skillCDs) {
            if (this.skillCDs[key] > 0) {
                this.skillCDs[key]--;
                needsUpdate = true;
            }
        }
    },

    processBuffs() {
        if (!Player.data || !Player.data.buffs || Player.data.buffs.length === 0) return;
        let toRemove = [];
        Player.data.buffs.forEach((b, idx) => {
            if (b.effect === 'poison') {
                const dmg = Math.max(1, Math.floor(Player.getBattleStats().maxHp * 0.05));
                Player.data.hp -= dmg;
                Msg.log(`🤢 妖毒發作，損失 ${dmg} 氣血。`, 'monster-atk');
                FX.spawnPopText(dmg, 'player', '#22c55e');
                FX.shake('player-display');
            }
            b.duration--;
            if (b.duration <= 0) toRemove.push(idx);
        });
        for (let i = toRemove.length - 1; i >= 0; i--) Player.data.buffs.splice(toRemove[i], 1);
        this.renderBuffsUI();
    },

    applyDebuffToPlayer(skillDef) {
        if (!Player.data.buffs) Player.data.buffs = [];
        const existing = Player.data.buffs.find(b => b.effect === skillDef.effect);
        if (existing) existing.duration = skillDef.duration;
        else Player.data.buffs.push({ name: this.currentMonster.skill, effect: skillDef.effect, duration: skillDef.duration });
        this.renderBuffsUI();
    },

    renderBuffsUI() {
        const buffContainer = document.getElementById('player-buffs');
        if (!buffContainer) return;
        if (!Player.data.buffs || Player.data.buffs.length === 0) { buffContainer.innerHTML = ''; return; }
        buffContainer.innerHTML = Player.data.buffs.map(b => {
            const color = b.effect === 'poison' ? '#22c55e' : '#eab308';
            return `<span style="background:${color}; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px;">${b.name}(${b.duration})</span>`;
        }).join('');
    },

    /**
     * 🌟 核心修正：根據妖獸專屬掉落表結算戰利品
     */
    handleVictory() {
        const m = this.currentMonster;
        Msg.log(`${m.name} 已被擊敗！`, "system");

        const exp = Player.gainExp(m.exp);
        Player.data.coin += (m.gold || 0);
        Msg.log(`獲得修為 ${exp}，靈石 ${m.gold || 0}`, "reward");

        if (exp > 0) FX.spawnPopText(`+${exp} EXP`, 'player', '#2ecc71');
        if (m.gold > 0) {
            setTimeout(() => FX.spawnPopText(`+${m.gold} 靈石`, 'player', '#fbbf24'), 250);
        }

        // --- 1. 處理妖獸專屬掉落表 (V3.5.9 新增) ---
        if (m.drops && Array.isArray(m.drops)) {
            m.drops.forEach(drop => {
                if (Math.random() < drop.chance) {
                    if (drop.type === 'resource') {
                        // 🌟 資源歸一：直接增加數值，不再產生 ghost item
                        const amount = Array.isArray(drop.amount) 
                            ? Math.floor(Math.random() * (drop.amount[1] - drop.amount[0] + 1)) + drop.amount[0]
                            : (drop.amount || 1);
                        
                        if (drop.id === 'herb') Player.data.materials.herb += amount;
                        if (drop.id === 'ore') Player.data.materials.ore += amount;
                        
                        Msg.log(`📦 收集到：【${drop.name}】x${amount}`, "reward");
                    } else if (drop.type === 'item') {
                        // 🌟 實體材料：進入 inventory 陣列，可以在商店賣錢
                        const material = {
                            uuid: 'it_mat_' + Date.now() + Math.random().toString(36).substr(2, 5),
                            name: drop.name, 
                            type: 'material', 
                            rarity: drop.rarity || 1, 
                            count: 1,
                            desc: `從${m.name}身上採集的珍稀素材。`,
                            price: 50 // 基礎價值，商店回收用
                        };
                        Player.addItem(material);
                        Msg.log(`📦 採集到素材：【${drop.name}】`, "reward");
                    }
                }
            });
        }

        // --- 2. 隨機裝備掉落 (保留原本 ItemFactory 邏輯) ---
        if (Math.random() < 0.1) {
            const item = ItemFactory.createEquipment(Player.data.level); 
            if (item) {
                Player.addItem(item);
                Msg.log(`🎊 獲得：【${item.name}】！`, "reward");
            }
        }

        // --- 3. 隨機功法殘卷掉落 (保留原本隨機邏輯) ---
        if (Math.random() < 0.15) {
            const skillList = ["烈焰斬", "回春術", "青元劍訣", "破軍劍擊", "天雷正法"];
            const skillName = skillList[Math.floor(Math.random() * skillList.length)];
            const volNum = Math.floor(Math.random() * 5) + 1; 
            const volMap = {1:"一", 2:"二", 3:"三", 4:"四", 5:"五"};

            const fragment = {
                uuid: 'frag_' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: `殘卷：${skillName}(卷${volMap[volNum]})`,
                type: 'fragment', skillName: skillName, volume: volNum, rarity: 3, count: 1,
                desc: `記載著部分心法的殘卷。`,
                price: 150
            };
            Player.addItem(fragment);
            Msg.log(`📜 發現殘卷：【${fragment.name}】！`, "gold");
        }

        Player.data.buffs = [];
        this.renderBuffsUI();
        if (window.Core) window.Core.updateUI();
        this.currentMonster = null;

        setTimeout(() => { 
            this.isProcessing = false; 
            this.spawnMonster(this.currentMapId); 
        }, 1500);
    },

    handleDefeat() {
        Msg.log(`你被 ${this.currentMonster.name} 擊敗了...`, "monster-atk");
        this.currentMonster = null;
        Player.data.buffs = [];
        this.renderBuffsUI();
        Player.data.hp = Player.getBattleStats().maxHp; 
        setTimeout(() => {
            Msg.log(`神魂歸位，你已回到宗門救治。`, "system");
            if (window.UI_Battle) window.UI_Battle.updateMonster(null);
            if (window.Core) window.Core.updateUI();
            this.isProcessing = false;
            this.spawnMonster(this.currentMapId);
        }, 2000);
    },

    findMapData(id) {
        const dataSrc = window.DB || window.DATA || window.GAMEDATA;
        if (!dataSrc || !dataSrc.REGIONS) return null;
        for (let r in dataSrc.REGIONS) {
            const map = dataSrc.REGIONS[r].maps.find(m => m.id == id);
            if (map) return map;
        }
        return null;
    }
};

window.CombatEngine = CombatEngine;
