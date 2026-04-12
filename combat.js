/**
 * V1.5.12 combat.js
 * 職責：戰鬥循環控管、命中/閃避/暴擊演算法、掉落結算、分色日誌輸出。
 * 狀態：全量實裝，禁止簡化。
 */

const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    // 1. 戰鬥初始化
    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        
        // 取得當前區域與地圖資料
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId) || region.maps[0];
        
        let mData;
        if (isBoss) {
            mData = GAMEDATA.MONSTERS[region.bossId];
        } else {
            // 從地圖隨機抽取妖獸
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            mData = GAMEDATA.MONSTERS[mId];
        }

        // 深拷貝怪物數據，確保不影響原始庫
        this.currentMonster = {
            ...mData,
            maxHp: mData.hp,
            hp: mData.hp
        };

        // 渲染戰鬥畫面
        if (typeof UI_Battle !== 'undefined') UI_Battle.renderBattle(this.currentMonster);
        
        this.startLoop();
    },

    // 2. 戰鬥主循環 (每秒跳動一次)
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

        // A. 檢查是否開啟自動練功
        if (player.data.isAuto) {
            this.playerAttack(false); // 自動攻擊
        }

        // B. 怪物死亡檢查 (修正負血量顯示)
        if (this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            this.onMonsterDeath();
            return;
        }

        // C. 怪物反擊
        this.monsterAttack();

        // D. 玩家死亡檢查
        if (player.data.hp <= 0) {
            player.data.hp = 0;
            this.onPlayerDeath();
            return;
        }

        // 刷新頂部玩家血量條與怪物血條
        this.updateAllUI();
    },

    // 3. 玩家攻擊邏輯 (1.4.1 打擊抖動核心)
    playerAttack: function(isManual = false) {
        if (!this.currentMonster || this.currentMonster.hp <= 0) return;

        let dmg = player.data.atk;
        
        // 暴擊判定
        const isCrit = Math.random() * 100 < player.data.crit;
        if (isCrit) dmg *= 2.5; // 暴擊 2.5 倍
        
        // 手動點擊加成 (1.4.1 的爽快感來源)
        if (isManual) {
            dmg *= 1.2; 
            if (typeof UI_Battle !== 'undefined') UI_Battle.triggerShake(); // 觸發卡片抖動
        }

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】發動攻擊，造成 ${Math.ceil(dmg)} 點傷害${isCrit ? ' (暴擊!)' : ''}`, 'combat');

        // 手動點擊時即時判定死亡，不等待 Tick
        if (isManual && this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            this.onMonsterDeath();
        }
        
        this.updateAllUI();
    },

    // 4. 怪物攻擊邏輯 (閃避與防禦判定)
    monsterAttack: function() {
        // 閃避判定
        const isDodge = Math.random() * 100 < player.data.dodge;
        if (isDodge) {
            this.log(`你步法玄妙，躲開了【${this.currentMonster.name}】的突襲`, 'combat');
            return;
        }

        // 減傷判定
        let dmg = Math.max(1, this.currentMonster.atk - player.data.def);
        player.data.hp -= dmg;
        this.log(`【${this.currentMonster.name}】反擊，使你失去了 ${Math.ceil(dmg)} 點生命`, 'combat');
    },

    // 5. 戰鬥結算與 80 詞條掉落
    onMonsterDeath: function() {
        this.stopLoop();
        this.log(`成功擊斃了【${this.currentMonster.name}】！`, 'system');
        
        // 基本收益
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        this.log(`獲得修為：${this.currentMonster.exp}，獲得靈石：${this.currentMonster.gold}`, 'loot');

        // 掉落邏輯 (1.4.1 爆率機制)
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId);
        
        if (map && map.drops) {
            map.drops.forEach(baseName => {
                const dropRate = 0.25; // 25% 掉落率
                if (Math.random() < dropRate) {
                    const success = player.generateItem(baseName, map.level);
                    if (success) {
                        const inv = player.data.inventory;
                        const lastItem = inv[inv.length - 1];
                        this.log(`【機緣】獲得寶物：${lastItem.name}`, 'loot');
                    } else {
                        this.log(`儲物袋已滿，眼睜睜看著寶物化為靈氣消散...`, 'system');
                    }
                }
            });
        }

        // Boss 擊殺進度
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
        
        // 1.5 秒後尋找下一個對手
        setTimeout(() => this.initBattle(), 1500);
    },

    onPlayerDeath: function() {
        this.stopLoop();
        this.log(`力戰不支，神魂受創，回歸宗門修補...`, 'system');
        player.data.hp = player.data.maxHp; // 復活滿血
        player.save();
        setTimeout(() => this.initBattle(), 3000);
    },

    // 6. UI 更新中控
    updateAllUI: function() {
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.renderBattle(this.currentMonster);
        }
        // 觸發頂部狀態欄刷新 (core.js 會定時刷，但這裡做即時同步)
    },

    // 7. 1.4.1 分類日誌實現
    log: function(msg, type) {
        const logBox = document.getElementById('battle-logs');
        if (!logBox) return;

        const div = document.createElement('div');
        div.className = `log-item ${type}`; // combat, loot, system
        
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}] `;
        
        div.innerText = timeStr + msg;

        logBox.prepend(div);

        // 即時檢查當前標籤過濾
        if (typeof UI_Battle !== 'undefined') {
            UI_Battle.refreshLogVisibility();
        }

        // 數量限制
        if (logBox.children.length > 60) {
            logBox.lastChild.remove();
        }
    }
};

console.log("✅ [V1.5.12] combat.js 戰鬥法則圓滿載入。");
