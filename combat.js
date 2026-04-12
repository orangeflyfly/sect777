/**
 * V1.5.10 combat.js
 * 職責：戰鬥循環、玩家攻擊(含暴擊、抖動)、怪物反擊、掉落結算、分類日誌執行。
 */

const Combat = {
    timer: null,
    currentMonster: null,
    isBossBattle: false,

    // 1. 初始化戰鬥
    init: function() {
        this.initBattle();
    },

    // 2. 建立新戰鬥 (1.4.1 掉落與怪物屬性對接)
    initBattle: function(isBoss = false) {
        this.isBossBattle = isBoss;
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId) || region.maps[0];
        
        let mData;
        if (isBoss) {
            mData = GAMEDATA.MONSTERS[region.bossId];
        } else {
            const mId = map.monsterIds[Math.floor(Math.random() * map.monsterIds.length)];
            mData = GAMEDATA.MONSTERS[mId];
        }

        // 深度複製怪物數據，避免修改到原始庫
        this.currentMonster = JSON.parse(JSON.stringify(mData));
        this.currentMonster.maxHp = mData.hp;
        this.currentMonster.hp = mData.hp;

        if (typeof UI_Battle !== 'undefined') UI_Battle.renderBattle(this.currentMonster);
        this.startLoop();
    },

    // 3. 自動戰鬥循環
    startLoop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.combatTick();
        }, 1000); // 每秒一回合
    },

    combatTick: function() {
        if (!this.currentMonster) return;

        // A. 玩家自動攻擊
        this.playerAttack(false);

        // B. 檢查怪物是否死亡 (修正負血量)
        if (this.currentMonster.hp <= 0) {
            this.currentMonster.hp = 0;
            this.onMonsterDeath();
            return;
        }

        // C. 怪物反擊 (閃避判定)
        this.monsterAttack();

        // D. 檢查玩家是否死亡
        if (player.data.hp <= 0) {
            player.data.hp = 0;
            this.onPlayerDeath();
            return;
        }

        // E. 刷新 UI
        if (typeof UI_Battle !== 'undefined') UI_Battle.renderBattle(this.currentMonster);
    },

    // 4. 攻擊邏輯 (1.4.1 的暴擊與手感)
    playerAttack: function(isManual = false) {
        if (!this.currentMonster) return;

        let dmg = player.data.atk;
        
        // 暴擊判定
        const isCrit = Math.random() * 100 < player.data.crit;
        if (isCrit) dmg *= 2;
        
        // 手動點擊加成 (1.4.1 點擊感)
        if (isManual) {
            dmg *= 1.1; 
            if (typeof UI_Battle !== 'undefined') UI_Battle.triggerShake(); // 觸發抖動
        }

        this.currentMonster.hp -= dmg;
        this.log(`【${player.data.name}】對其造成 ${Math.ceil(dmg)} 點傷害${isCrit ? ' (暴擊!)' : ''}`, 'combat');

        if (isManual) {
            if (this.currentMonster.hp <= 0) {
                this.currentMonster.hp = 0;
                this.onMonsterDeath();
            }
            if (typeof UI_Battle !== 'undefined') UI_Battle.renderBattle(this.currentMonster);
        }
    },

    monsterAttack: function() {
        // 閃避判定
        const isDodge = Math.random() * 100 < player.data.dodge;
        if (isDodge) {
            this.log(`你巧妙地躲開了【${this.currentMonster.name}】的攻擊`, 'combat');
            return;
        }

        // 減傷判定 (1.4.1 公式)
        let dmg = Math.max(1, this.currentMonster.atk - player.data.def);
        player.data.hp -= dmg;
        this.log(`【${this.currentMonster.name}】發動反擊，造成 ${Math.ceil(dmg)} 點傷害`, 'combat');
    },

    // 5. 掉落與獎勵結算 (1.4.1 完整掉落)
    onMonsterDeath: function() {
        clearInterval(this.timer);
        this.log(`擊敗了 ${this.currentMonster.name}！`, 'system');
        
        // 基礎獎勵
        player.data.exp += this.currentMonster.exp;
        player.data.money += this.currentMonster.gold;
        this.log(`獲得修為：${this.currentMonster.exp}，靈石：${this.currentMonster.gold}`, 'loot');

        // 隨機裝備掉落 (1.4.1 爆率系統)
        const region = GAMEDATA.REGIONS.find(r => r.id === player.data.currentRegion);
        const map = region.maps.find(m => m.id === player.data.currentMapId);
        
        if (map && map.drops) {
            map.drops.forEach(baseName => {
                const dropRate = 0.2; // 20% 掉落機率
                if (Math.random() < dropRate) {
                    const success = player.generateItem(baseName, map.level);
                    if (success) {
                        const lastItem = player.data.inventory[player.data.inventory.length - 1];
                        this.log(`掉落寶物：[${lastItem.name}] (已存入儲物袋)`, 'loot');
                    } else {
                        this.log(`儲物袋空間不足，眼睜睜看著寶物消散...`, 'system');
                    }
                }
            });
        }

        // Boss 擊殺判定
        if (this.isBossBattle) {
            if (region.nextRegion && !player.data.unlockedRegions.includes(region.nextRegion)) {
                player.data.unlockedRegions.push(region.nextRegion);
                alert(`恭喜！擊敗領主，解鎖了新區域：${region.nextRegion}`);
            }
            player.data.killCount = 0;
        } else {
            player.data.killCount++;
        }

        player.checkLevelUp();
        player.save();
        
        // 1秒後自動尋找下一個對手
        setTimeout(() => this.initBattle(), 1000);
    },

    onPlayerDeath: function() {
        clearInterval(this.timer);
        this.log(`你已被擊敗，神識回歸宗門修復...`, 'system');
        player.data.hp = player.data.maxHp;
        player.save();
        setTimeout(() => this.initBattle(), 3000);
    },

    // 6. 1.4.1 分類日誌實現
    log: function(msg, type) {
        const logBox = document.getElementById('battle-logs');
        if (!logBox) return;

        const div = document.createElement('div');
        div.className = `log-item ${type}`; // 分類: combat, loot, system
        
        // 記錄時間戳 (1.4.1 細節)
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}] `;
        
        div.innerText = timeStr + msg;

        // 如果當前標籤不是 'all' 且不符合類型，則隱藏 (這部分配合 UI_Battle 控制)
        logBox.prepend(div);
        if (typeof UI_Battle !== 'undefined') UI_Battle.refreshLogVisibility();
        // 限制日誌數量防止卡頓
        if (logBox.children.length > 50) {
            logBox.lastChild.remove();
        }
    }
};

console.log("✅ [V1.5.10] combat.js 戰鬥法則圓滿載入，抖動、掉落、分類日誌就緒。");
