/**
 * V1.7.0 ui_battle.js
 * 職責：戰鬥分頁視覺渲染、怪物卡片更新、搜尋狀態切換、死亡特效控制。
 * 注意：日誌與地圖邏輯已拆分至獨立檔案，此處僅負責戰鬥主體視覺。
 */

const UI_Battle = {
    // 1. 初始化戰鬥 UI 狀態
    init() {
        console.log("🎨 [UI_Battle] 正在初始化歷練介面...");
        this.renderMapName();
        this.showSearching(false); // 確保初始不顯示搜尋中
    },

    // 2. 更新當前地圖名稱顯示
    renderMapName() {
        const mapNameEl = document.getElementById('current-map-name');
        if (!mapNameEl) return;

        const mapId = Player.data.currentMap;
        let foundName = "未知地域";

        // 從 GAMEDATA 遍歷尋找地圖名稱
        for (let rId in GAMEDATA.REGIONS) {
            const map = GAMEDATA.REGIONS[rId].maps.find(m => m.id === mapId);
            if (map) {
                foundName = map.name;
                break;
            }
        }
        mapNameEl.innerText = foundName;
    },

    // 3. 更新怪物卡片資訊 (血條、圖標、名字)
    updateMonster(monster) {
        const monsterCard = document.getElementById('monster-display');
        const iconEl = document.getElementById('monster-icon');
        const nameEl = document.getElementById('monster-name');
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-text');

        if (!monster || !monsterCard) return;

        // A. 確保怪物卡片是顯示狀態且移除死亡效果
        monsterCard.style.display = 'block';
        monsterCard.classList.remove('monster-die');

        // B. 更新文字與圖標
        iconEl.innerText = monster.icon;
        nameEl.innerText = monster.name;
        
        // C. 計算並更新血條
        const hpPercent = Math.max(0, (monster.currentHp / monster.hp) * 100);
        hpFill.style.width = `${hpPercent}%`;
        hpText.innerText = `${Math.ceil(Math.max(0, monster.currentHp))}/${monster.hp}`;
    },

    // 4. 切換「搜尋妖獸」視覺狀態 (解決打死怪後的空白感)
    showSearching(active) {
        const monsterCard = document.getElementById('monster-display');
        const searchingBox = document.getElementById('searching-display');

        if (!monsterCard || !searchingBox) return;

        if (active) {
            // 隱藏怪物，顯示搜尋文字
            monsterCard.style.display = 'none';
            searchingBox.style.display = 'block';
        } else {
            // 顯示怪物，隱藏搜尋文字
            monsterCard.style.display = 'block';
            searchingBox.style.display = 'none';
        }
    },

    // 5. 觸發怪物死亡消散動畫 (對應 style.css 中的 .monster-die)
    playMonsterDieAnim() {
        const monsterCard = document.getElementById('monster-display');
        if (monsterCard) {
            monsterCard.classList.add('monster-die');
        }
    },

    // 6. 介面清理 (切換頁面或重置時使用)
    clear() {
        const hpFill = document.getElementById('monster-hp-fill');
        const hpText = document.getElementById('monster-hp-text');
        if (hpFill) hpFill.style.width = '0%';
        if (hpText) hpText.innerText = '0/0';
    }
};

// 確保全域可用
window.UI_Battle = UI_Battle;
