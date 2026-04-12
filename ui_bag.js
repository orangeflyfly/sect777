/**
 * V1.7.0 ui_bag.js
 * 職責：儲物袋渲染、類別過濾、殘卷合成邏輯、物品處置。
 */

const UI_Bag = {
    currentFilter: 'all', // 當前過濾標籤

    init() {
        this.render();
    },

    // 1. 執行過濾切換
    filter(type) {
        this.currentFilter = type;
        // 更新 Tab 視覺狀態
        document.querySelectorAll('.bag-tab').forEach(btn => {
            const btnText = btn.innerText;
            const typeMap = { '全部': 'all', '裝備': 'equip', '殘卷': 'fragment', '材料': 'item' };
            btn.classList.toggle('active', typeMap[btnText] === type);
        });
        this.render();
    },

    // 2. 渲染背包網格
    render() {
        const grid = document.getElementById('bag-grid');
        const countEl = document.getElementById('bag-count');
        if (!grid) return;

        grid.innerHTML = '';
        const inventory = Player.data.inventory;
        countEl.innerText = inventory.length;

        // 執行邏輯過濾 (不影響原始數據)
        const filteredList = inventory.filter(item => {
            if (this.currentFilter === 'all') return true;
            if (this.currentFilter === 'equip') return item.type === 'weapon' || item.type === 'armor';
            if (this.currentFilter === 'fragment') return item.name && item.name.includes("殘卷：");
            if (this.currentFilter === 'item') return !item.type && !item.name.includes("殘卷：");
            return true;
        });

        // 生成 50 個格子 (固定格數保持美觀)
        for (let i = 0; i < GAMEDATA.CONFIG.MAX_BAG_SLOTS; i++) {
            const slot = document.createElement('div');
            slot.className = 'bag-slot';
            
            const item = filteredList[i];
            if (item) {
                slot.innerHTML = `
                    <div class="item-icon r-${item.rarity || 1}">${this.getItemIcon(item)}</div>
                    ${item.count > 1 ? `<span class="item-count">${item.count}</span>` : ''}
                `;
                slot.onclick = () => this.showDetail(item);
            }
            grid.appendChild(slot);
        }
    },

    // 取得物品圖標邏輯
    getItemIcon(item) {
        if (item.name.includes("殘卷")) return "📜";
        if (item.type === "weapon") return "⚔️";
        if (item.type === "armor") return "👕";
        return "📦";
    },

    // 3. 顯示物品詳情 (含殘卷合成檢查)
    showDetail(item) {
        const modal = document.getElementById('modal-detail');
        const content = document.getElementById('item-detail-content');
        const useBtn = document.getElementById('btn-use-item');
        const sellBtn = document.getElementById('btn-sell-item');

        modal.style.display = 'flex';
        
        let html = `
            <div class="detail-header r-${item.rarity || 1}">
                <span class="detail-name">${item.name}</span>
                <span class="detail-rarity">${GAMEDATA.CONFIG.RARITY_NAMES[(item.rarity || 1) - 1]}</span>
            </div>
            <div class="detail-body">
                <p class="detail-desc">${item.desc || '這是一件神祕的物品。'}</p>
        `;

        // 裝備屬性顯示
        if (item.stats) {
            html += `<div class="detail-stats">`;
            for (let s in item.stats) {
                html += `<div>${s.toUpperCase()}: +${item.stats[s]}</div>`;
            }
            html += `</div>`;
        }

        // 殘卷拼圖進度檢查
        let canCombine = false;
        let fragmentInfo = null;
        if (item.name.includes("殘卷：")) {
            fragmentInfo = this.checkFragmentProgress(item.name);
            html += `
                <div class="fragment-progress">
                    <h4>合成進度 (${fragmentInfo.count}/5)</h4>
                    <div class="fragment-list">${fragmentInfo.listHtml}</div>
                </div>
            `;
            if (fragmentInfo.count >= 5) canCombine = true;
        }

        html += `</div>`;
        content.innerHTML = html;

        // 按鈕功能邏輯
        sellBtn.onclick = () => this.sellItem(item);

        if (canCombine) {
            useBtn.innerText = "合成修煉";
            useBtn.style.display = "block";
            useBtn.onclick = () => this.combineSkill(item.name);
        } else if (item.type === 'weapon' || item.type === 'armor') {
            useBtn.innerText = "裝備";
            useBtn.style.display = "block";
            useBtn.onclick = () => this.equipItem(item);
        } else {
            useBtn.style.display = "none";
        }
    },

    // 4. 檢查殘卷拼圖進度
    checkFragmentProgress(fullName) {
        // fullName 格式: "殘卷：烈焰斬-1"
        const skillName = fullName.split("：")[1].split("-")[0];
        let count = 0;
        let listHtml = "";

        for (let i = 1; i <= 5; i++) {
            const targetName = `殘卷：${skillName}-${i}`;
            const exists = Player.data.inventory.some(it => it.name === targetName);
            if (exists) count++;
            listHtml += `<span class="frag-dot ${exists ? 'owned' : ''}">${i}</span>`;
        }

        return { count, listHtml, skillName };
    },

    // 5. 執行合成邏輯
    combineSkill(fullName) {
        const skillName = fullName.split("：")[1].split("-")[0];
        const skillData = Object.values(GAMEDATA.SKILLS).find(s => s.name === skillName);

        if (!skillData) return;

        // 1. 扣除 1-5 號碎片
        for (let i = 1; i <= 5; i++) {
            const targetName = `殘卷：${skillName}-${i}`;
            const index = Player.data.inventory.findIndex(it => it.name === targetName);
            if (index > -1) Player.data.inventory.splice(index, 1);
        }

        // 2. 學習技能 (加入玩家技能庫)
        if (!Player.data.skills.some(s => s.id === skillData.id)) {
            Player.data.skills.push(skillData);
            UI_Battle.log(`✨ 成功集齊殘卷！你領悟了神通：【${skillName}】`, 'reward');
        } else {
            UI_Battle.log(`✨ 成功集齊殘卷！你的神通【${skillName}】感悟加深了（後續實裝升級）。`, 'reward');
        }

        Player.save();
        this.closeDetail();
        this.render();
    },

    // 6. 裝備物品邏輯
    equipItem(item) {
        const type = item.type; // weapon 或 armor
        Player.data.equipped[type] = item;
        UI_Battle.log(`裝備了 [${item.name}]`, 'system');
        Player.save();
        this.closeDetail();
        this.render();
    },

    // 7. 出售物品邏輯
    sellItem(item) {
        const price = item.price || 10;
        Player.data.coin += price;
        const index = Player.data.inventory.findIndex(i => i.uuid === item.uuid);
        if (index > -1) {
            Player.data.inventory.splice(index, 1);
        }
        Player.save();
        this.closeDetail();
        this.render();
        UI_Battle.log(`出售了 [${item.name}]，獲得靈石 x${price}`, 'system');
    },

    closeDetail() {
        document.getElementById('modal-detail').style.display = 'none';
    }
};

window.UI_Bag = UI_Bag;
