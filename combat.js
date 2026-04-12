/**
 * V1.6.0 combat.js (加固優化版)
 * 職責：戰鬥計時器、命中/暴擊/閃避判定、掉落結算、分類日誌。
 * 狀態：100% 全量實裝，優化數據索引與掉落安全性。
 */

const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    // 1. 戰鬥初始化
    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        
        // 使用加固後的 data.js 索引函數
        const region = GAMEDATA.getRegion(player.data.currentRegion);
        if (!region) {
            console.error("❌ 找不到區域數據:", player.data.currentRegion);
            return;
        }

        const map = region.maps.find(m => m.id === player.data.currentMapId) || region.maps[0];
        
        let mData;
        if (isBoss) {
            mData = GAMEDATA.getMonster(region.bossId);
        } else {
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            mData = GAMEDATA.getMonster(mId);
        }

        // 深度複製，確保戰鬥中的 HP 變化不影響原始庫
        this.currentMonster = { ...mData, hp: mData.hp, maxHp: mData.hp };

        // 通知 UI 渲染
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.renderBattle(this.currentMonster);
        }
        
        this.startLoop();
    },

    // 2. 戰鬥計時循環 (加固穩定性)
    startLoop: function() {
        this.stopLoop();
        this.timer = setInterval(() => this.combatTick(), 1000);
    },

    stopLoop: function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    combatTick: function() {
        if (!this.currentMonster) return;

        // A. 檢查自動練功
        if (player.data.isAuto) {
            this.playerAttack(false);
        }

        // B. 檢查怪物死亡 (負血量修正)
        if (this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            this.onMonsterDeath();
            return;
        }

        // C. 怪物反擊
        this.monsterAttack();

        // D. 檢查玩家死亡
        if (player.data.hp <= 0) {
            player.data.hp = 0;
            this.onPlayerDeath();
            return;
        }

        this.refreshUI();
    },

    // 3. 玩家攻擊 (1.4.1 靈魂：手動加成)
    playerAttack: function(isManual = false) {
        if (!this.currentMonster || this.currentMonster.hp <= 0) return;

        let dmg = player.data.atk;
        const isCrit = Math.random() * 100 < player.data.crit;
        
        if (isCrit) dmg *= 2.5;
        if (isManual) {
            dmg *= 1.2; 
            if (typeof UI_Battle !== 'undefined') UI_Battle.triggerShake();
        }

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】攻擊，造成 ${Math.ceil(dmg)} 傷害${isCrit ? ' (暴擊!)' : ''}`, 'combat');

        if (this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            this.onMonsterDeath();
        } else {
            this.refreshUI();
        }
    },

    // 4. 怪物反擊
    monsterAttack: function() {
        const isDodge = Math.random() * 100 < player.data.dodge;
        if (isDodge) {
            this.log(`你施展身法，躲開了【${this.currentMonster.name}】的攻擊`, 'combat');
            return;
        }

        const dmg = Math.max(1, this.currentMonster.atk - player.data.def);
        player.data.hp -= dmg;
        this.log(`【${this.currentMonster.name}】反擊，你失去 ${Math.ceil(dmg)} 生命`, 'combat');
    },

    // 5. 結算與掉落 (對接 80 詞條)
    onMonsterDeath: function() {
        this.stopLoop();
        this.log(`成功擊斃了【${this.currentMonster.name}】！`, 'system');
        
        // 收益增加
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        this.log(`獲得修為：${this.currentMonster.exp}，靈石：${this.currentMonster.gold}`, 'loot');

        // 掉落邏輯加固
        const region = GAMEDATA.getRegion(player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId);
        
        if (map && map.drops) {
            map.drops.forEach(baseName => {
                if (Math.random() < 0.3) { 
                    // 先執行生成，並檢查結果
                    const success = player.generateItem(baseName, map.level);
                    if (success) {
                        const inv = player.data.inventory;
                        const lastItem = inv[inv.length - 1];
                        this.log(`【機緣】獲得寶物：${lastItem.name}`, 'loot');
                    } else {
                        this.log(`【提示】儲物袋已滿，遺憾錯失寶物。`, 'system');
                    }
                }
            });
        }

        // 進度處理
        if (this.isBossBattle) {
            if (region.nextRegion && !player.data.unlockedRegions.includes(region.nextRegion)) {
                player.data.unlockedRegions.push(region.nextRegion);
                player.showToast(`✨ 突破禁制！解鎖新區域`, "gold");
            }
            player.data.killCount = 0;
        } else {
            player.data.killCount++;
        }

        player.checkLevelUp();
        player.save();
        
        // 1.5 秒後開啟下一場
        setTimeout(() => this.initBattle(), 1500);
    },

    onPlayerDeath: function() {
        this.stopLoop();
        this.log(`力戰不支，神魂回歸宗門修補...`, 'system');
        player.data.hp = player.data.maxHp;
        player.save();
        setTimeout(() => this.initBattle(), 3000);
    },

    refreshUI: function() {
        if (typeof UI_Battle !== 'undefined' && this.currentMonster) {
            UI_Battle.renderBattle(this.currentMonster);
        }
    },

    // 日誌優化：加入防錯與類型過濾
    log: function(msg, type) {
        const logBox = document.getElementById('battle-logs');
        if (!logBox) return;

        const div = document.createElement('div');
        div.className = `log-item ${type}`;
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}] `;
        div.innerText = timeStr + msg;

        logBox.prepend(div);

        // 嚴格控制日誌數量
        const limit = (typeof GAMEDATA !== 'undefined' && GAMEDATA.CONFIG.LOG_LIMIT) || 50;
        while (logBox.children.length > limit) {
            logBox.lastChild.remove();
        }
        
        if (typeof UI_Battle !== 'undefined' && UI_Battle.refreshLogVisibility) {
            UI_Battle.refreshLogVisibility();
        }
    }
};

console.log("✅ [V1.6.0] combat.js 戰鬥法則已加固。");
