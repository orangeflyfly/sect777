/**
 * V1.5.12 combat.js
 * 職責：戰鬥計時器、命中/暴擊/閃避判定、掉落結算、分類日誌。
 * 狀態：100% 全量實裝，包含 1.4.1 抖動觸發與負血量修正。
 */

const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    // 1. 戰鬥初始化 (修正：確保怪物圖標與數據重置)
    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        
        // 獲取區域與地圖
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId) || region.maps[0];
        
        let mData;
        if (isBoss) {
            mData = GAMEDATA.MONSTERS[region.bossId];
        } else {
            // 從地圖對應的怪物池中隨機抽取
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            mData = GAMEDATA.MONSTERS[mId];
        }

        // 深度複製怪物數據，防止污染原始庫
        this.currentMonster = JSON.parse(JSON.stringify(mData));
        this.currentMonster.maxHp = mData.hp; // 記錄最大血量供血條計算

        // 立即通知 UI 渲染 (解決圖標不換的問題)
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.renderBattle(this.currentMonster);
        }
        
        this.startLoop();
    },

    // 2. 戰鬥計時循環
    startLoop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.combatTick();
        }, 1000);
    },

    stopLoop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    },

    combatTick: function() {
        if (!this.currentMonster) return;

        // A. 檢查自動練功
        if (player.data.isAuto) {
            this.playerAttack(false); // 自動攻擊無手動加成
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

        // 每秒同步一次介面
        this.refreshUI();
    },

    // 3. 玩家攻擊 (1.4.1 靈魂：手動點擊加成與抖動)
    playerAttack: function(isManual = false) {
        if (!this.currentMonster || this.currentMonster.hp <= 0) return;

        let dmg = player.data.atk;
        
        // 暴擊判定
        const isCrit = Math.random() * 100 < player.data.crit;
        if (isCrit) dmg *= 2.5;
        
        // 手動加成與抖動觸發
        if (isManual) {
            dmg *= 1.2; // 手動點擊多 20% 傷害
            if (typeof UI_Battle !== 'undefined') {
                UI_Battle.triggerShake(); // 觸發 1.4.1 經典抖動
            }
        }

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】發動攻擊，造成 ${Math.ceil(dmg)} 點傷害${isCrit ? ' (暴擊!)' : ''}`, 'combat');

        // 手動點擊時即時判定死亡，不等待 Tick
        if (this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            this.onMonsterDeath();
        } else {
            this.refreshUI();
        }
    },

    // 4. 怪物反擊 (閃避判定)
    monsterAttack: function() {
        // 閃避判定
        const isDodge = Math.random() * 100 < player.data.dodge;
        if (isDodge) {
            this.log(`你施展身法，躲開了【${this.currentMonster.name}】的攻擊`, 'combat');
            return;
        }

        // 計算扣血 (攻擊 - 防禦，最低 1 點)
        let dmg = Math.max(1, this.currentMonster.atk - player.data.def);
        player.data.hp -= dmg;
        this.log(`【${this.currentMonster.name}】反擊，你失去了 ${Math.ceil(dmg)} 點生命`, 'combat');
    },

    // 5. 結算與掉落 (對接 80 詞條)
    onMonsterDeath: function() {
        this.stopLoop();
        this.log(`成功擊斃了【${this.currentMonster.name}】！`, 'system');
        
        // 基本收益
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        this.log(`獲得修為：${this.currentMonster.exp}，獲得靈石：${this.currentMonster.gold}`, 'loot');

        // 掉落邏輯 (對接 80 詞條)
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId);
        
        if (map && map.drops) {
            map.drops.forEach(baseName => {
                if (Math.random() < 0.3) { // 30% 掉落率
                    const success = player.generateItem(baseName, map.level);
                    if (success) {
                        const inv = player.data.inventory;
                        const lastItem = inv[inv.length - 1];
                        this.log(`【機緣】獲得寶物：${lastItem.name}`, 'loot');
                    }
                }
            });
        }

        // 領主進度與解鎖
        if (this.isBossBattle) {
            if (region.nextRegion && !player.data.unlockedRegions.includes(region.nextRegion)) {
                player.data.unlockedRegions.push(region.nextRegion);
                player.showToast(`✨ 突破禁制！解鎖新區域：${region.nextRegion}`, "gold");
            }
            player.data.killCount = 0;
        } else {
            player.data.killCount++;
        }

        player.checkLevelUp();
        player.save();
        
        // 1.5 秒後尋找下一位受害者
        setTimeout(() => this.initBattle(), 1500);
    },

    onPlayerDeath: function() {
        this.stopLoop();
        this.log(`力戰不支，神魂回歸宗門修補...`, 'system');
        player.data.hp = player.data.maxHp; // 復活滿血
        player.save();
        setTimeout(() => this.initBattle(), 3000);
    },

    // 6. 內部工具
    refreshUI: function() {
        if (typeof UI_Battle !== 'undefined' && this.currentMonster) {
            UI_Battle.renderBattle(this.currentMonster);
        }
    },

    log: function(msg, type) {
        const logBox = document.getElementById('battle-logs');
        if (!logBox) return;

        const div = document.createElement('div');
        div.className = `log-item ${type}`; // combat, loot, system
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}] `;
        div.innerText = timeStr + msg;

        logBox.prepend(div);

        // 數量控制，防止卡頓
        if (logBox.children.length > 50) {
            logBox.lastChild.remove();
        }
        
        // 即時刷新過濾狀態
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.refreshLogVisibility();
        }
    }
};

console.log("✅ [V1.5.12] combat.js 戰鬥法則圓滿注入。");
