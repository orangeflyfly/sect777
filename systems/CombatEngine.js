/**
 * V2.4 CombatEngine.js (主被動分流與視覺特寫整合版)
 * 職責：處理主動/被動技能、冷卻管理、境界壓制、完整掉落機制、色彩日誌、招式特寫對接
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
    skillCDs: {}, // 存儲技能冷卻狀態 { '烈焰斬': 0 }

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

        setTimeout(() => {
            this.spawnMonster(targetMap);
            this.renderBuffsUI(); 
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

    /**
     * 🟢 執行主動技能 (對接 FX.skillCutIn 異步版)
     */
    async useSkill(skillName) {
        if (this.isProcessing || !this.currentMonster) return;
        
        // 冷卻檢查
        if (this.skillCDs[skillName] > 0) {
            Msg.log(`神通【${skillName}】靈力運轉中，還需 ${this.skillCDs[skillName]} 秒。`, "system");
            return;
        }

        const dataSrc = window.DB || window.DATA;
        const skillDef = dataSrc.SKILLS[skillName];
        if (!skillDef) return;

        this.isProcessing = true;
        
        // --- 🟢 視覺特寫演出 ---
        // 取得技能對應的圖示 (若無則預設 ✨)
        const icon = skillDef.icon || "🔥"; 
        await FX.skillCutIn(skillName, icon); 
        // ----------------------

        // 設置冷卻
        this.skillCDs[skillName] = skillDef.cd || 5;

        // 觸發戰鬥回合結算
        this.processBuffs(); 
        if (Player.data.hp > 0) {
            this.executeTurn(true, skillDef, skillName);
        } else {
            this.handleDefeat();
        }
    },

    /**
     * 🟢 普通攻擊
     */
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
        
        // 境界壓制計算
        const playerRealm = Player.data.realm || 1;
        const monsterLevel = this.currentMonster.level || 1;
        const monsterRealm = Math.floor((monsterLevel - 1) / 10) + 1;
        const realmDiff = Math.max(0, playerRealm - monsterRealm);
        const realmBonus = 1 + (realmDiff * 0.2);

        let attackerAtk = isPlayerTurn ? pStats.atk : this.currentMonster.atk;
        let baseDamage = Formula.getDamageRange(attackerAtk);
        let finalDamage = Math.floor(baseDamage * realmBonus);

        if (isPlayerTurn) {
            if (skillUsed) {
                const playerSkill = Player.data.skills.find(s => s.name === skillName);
                const skillLv = playerSkill ? playerSkill.level : 1;
                const boost = 1 + ((skillLv - 1) * (dataSrc.CONFIG.SKILL_UPGRADE_BOOST || 0.2));
                
                finalDamage = Math.floor(finalDamage * skillUsed.multiplier * boost);
                Msg.log(`🔥 施展神通【${skillName}】(Lv.${skillLv})！`, "gold");
                FX.shake('combat-area');
            } else {
                Msg.log(`你發動普通攻擊，造成 ${finalDamage} 點傷害。`, "default");
            }

            // 觸發攻擊時的被動 (吸血等)
            this.handlePassiveSkills('onAttack', { damage: finalDamage });

            this.currentMonster.hp -= finalDamage;
            FX.shake('monster-display');
            FX.spawnPopText(finalDamage, 'monster');

        } else {
            // 怪物回合 AI
            let monsterFinalDmg = finalDamage;
            if (this.currentMonster.skill && dataSrc.SKILLS[this.currentMonster.skill]) {
                const mSkill = dataSrc.SKILLS[this.currentMonster.skill];
                if (Math.random() < (mSkill.chance || 0.2)) {
                    Msg.log(`⚠️ ${this.currentMonster.name} 發動【${this.currentMonster.skill}】！`, "monster-atk");
                    if (mSkill.type === 'damage') {
                        monsterFinalDmg = Math.floor(monsterFinalDmg * mSkill.multiplier);
                        FX.shake('combat-area');
                    } else if (mSkill.type === 'debuff') {
                        this.applyDebuffToPlayer(mSkill);
                    }
                }
            }

            Player.data.hp -= monsterFinalDmg;
            Msg.log(`${this.currentMonster.name} 造成 ${monsterFinalDmg} 點傷害。`, "monster-atk");
            FX.shake('player-display');
            FX.spawnPopText(monsterFinalDmg, 'player');
            
            if (window.UI_Battle) {
                window.UI_Battle.updatePlayerHP(Player.data.hp, pStats.maxHp);
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
            this.updateCDs();
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
        for (let key in this.skillCDs) {
            if (this.skillCDs[key] > 0) this.skillCDs[key]--;
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

        if (Math.random() < 0.1) {
            const item = ItemFactory.createEquipment();
            if (item) {
                Player.addItem(item);
                Msg.log(`🎊 獲得：【${item.name}】！`, "reward");
            }
        }

        if (Math.random() < 0.6) {
            const matNames = ["妖獸骨骸", "殘破皮毛", "低階妖丹", "陣法殘片"];
            const randomMat = matNames[Math.floor(Math.random() * matNames.length)];
            const material = {
                uuid: 'it_mat_' + Date.now(),
                name: randomMat, type: 'material', rarity: 1, count: 1,
                desc: `從妖獸身上採集的素材。`,
                price: 15
            };
            Player.addItem(material);
            Msg.log(`📦 採集到素材：【${randomMat}】`, "reward");
        }

        if (Math.random() < 0.15) {
            const skillList = ["烈焰斬", "回春術", "青元劍訣", "破軍劍擊", "天雷正法"];
            const skillName = skillList[Math.floor(Math.random() * skillList.length)];
            const volNum = Math.floor(Math.random() * 5) + 1; 
            const volMap = {1:"一", 2:"二", 3:"三", 4:"四", 5:"五"};

            const fragment = {
                uuid: 'frag_' + Date.now(),
                name: `殘卷：${skillName}(卷${volMap[volNum]})`,
                type: 'fragment', skillName: skillName, volume: volNum, rarity: 3, count: 1,
                desc: `記載著部分心法的殘卷。`,
                price: 50
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
