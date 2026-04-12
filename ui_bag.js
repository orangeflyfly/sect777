/**
 * V1.7.0 ui_bag.js
 * 職責：儲物袋渲染、類別過濾、殘卷合成邏輯、裝備/出售處理。
 * 核心：與 Player.js 數據對齊，確保 50 格固定佈局美觀。
 */

const UI_Bag = {
    currentFilter: 'all', // 當前標籤狀態

    init() {
        this.render();
    },

    // 1. 分籤切換 (由 index.html 的 onclick="UI_Bag.filter('...')" 調用)
    filter(type) {
        this.currentFilter = type;
        this.render();
    },

    // 2. 渲染背包網格
    render() {
        const grid = document.getElementById('bag-grid');
        const countEl = document.getElementById('bag-count');
        if (!grid) return;

        grid.innerHTML = '';
        const inventory = Player.data.inventory;
        
        // 更新當前容量顯示
        if (countEl) countEl.innerText = inventory.length;

        // 執行篩選邏輯
        const filteredList = inventory.filter(item => {
            if (this.currentFilter === 'all') return true;
            if (this.currentFilter === 'equip') return item.type === 'weapon' || item.type === 'armor';
            if (this.currentFilter === 'fragment') return item.name && item.name.includes("殘卷：");
            if (this.currentFilter === 'item') return !item.type && !item.name.includes("殘卷：");
            return true;
        });

        // 恆定生成 50 個格子，保持視覺整齊
        const maxSlots = GAMEDATA.CONFIG.MAX_BAG_SLOTS || 50;
        for (let i = 0; i < maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'bag-slot';
            
            const item = filteredList[i];
            if (item) {
                // 品階顏色對應 style.css 中的 r-1 ~ r-5
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
        if (item.name && item.name.includes("殘卷")) return "📜";
        if (item.type === "weapon") return "⚔️";
        if (item.type === "armor") return "👕";
        return "📦";
    },

    // 3. 顯示物品詳情彈窗
    showDetail(item) {
        const modal = document.getElementById('modal-detail');
        const content = document.getElementById('item-detail-content');
        if (!modal || !content) return;

        modal.style.display = 'flex';
        
        // 構建詳情 HTML
        let html = `
            <div class="detail-header r-${item.rarity || 1}">
                <span class="detail-name">${item.name}</span>
                <span class="detail-rarity">${GAMEDATA.CONFIG.RARITY_NAMES[(item.rarity || 1) - 1]}</span>
            </div>
            <div class="detail-body">
                <p class="detail-desc">${item.desc || '一件散發著靈氣的物品。'}</p>
        `;

        // 顯示屬性加成
        if (item.stats) {
            html += `<div class="detail-stats">`;
            for (let s in item.stats) {
                html += `<div>${s.toUpperCase()}: +${item.stats[s]}</div>`;
            }
            html += `</div>`;
        }

        // 殘卷專屬進度顯示
        let canCombine = false;
        if (item.name && item.name.includes("殘卷：")) {
            const progress = this.checkFragmentProgress(item.name);
            html += `
                <div class="fragment-progress">
                    <h4 style="color:var(--accent-color); margin-top:10px;">合成進度 (${progress.count}/5)</h4>
                    <div class="frag-dots-container" style="display:flex; gap:5px; margin-top:5px;">
                        ${progress.listHtml}
                    </div>
                </div>
            `;
            if (progress.count >= 5) canCombine = true;
        }

        // 按鈕區塊
        html += `
            <div class="detail-actions" style="margin-top:20px; display:flex; gap:10px;">
                ${canCombine ? `<button class="btn-primary" onclick="UI_Bag.combineSkill('${item.name}')">領悟神通</button>` : ''}
                ${(item.type === 'weapon' || item.type === 'armor') ? `<button class="btn-primary" onclick="UI_Bag.equipItem('${item.uuid}')">裝備</button>` : ''}
                <button class="btn-danger" onclick="UI_Bag.sellItem('${item.uuid}')">出售 (💰 ${item.price || 10})</button>
                <button class="btn-secondary" onclick="UI_Bag.closeDetail()">關閉</button>
            </div>
        `;

        html += `</div>`;
        content.innerHTML = html;
    },

    // 4. 殘卷拼圖進度檢查
    checkFragmentProgress(fullName) {
        const skillName = fullName.split("：")[1].split("-")[0];
        let count = 0;
        let listHtml = "";

        for (let i = 1; i <= 5; i++) {
            const targetName = `殘卷：${skillName}-${i}`;
            const exists = Player.data.inventory.some(it => it.name === targetName);
            if (exists) count++;
            listHtml += `<span class="frag-dot ${exists ? 'owned' : ''}" style="width:20px; height:20px; border-radius:50%; background:${exists ? '#f1c40f':'#333'}; display:flex; align-items:center; justify-content:center; font-size:10px;">${i}</span>`;
        }
        return { count, listHtml, skillName };
    },

    // 5. 執行合成邏輯
    combineSkill(fullName) {
        const skillName = fullName.split("：")[1].split("-")[0];
        const skillData = Object.values(GAMEDATA.SKILLS).find(s => s.name === skillName);

        if (!skillData) return;

        // 扣除 1-5 號碎片
        for (let i = 1; i <= 5; i++) {
            const targetName = `殘卷：${skillName}-${i}`;
            const index = Player.data.inventory.findIndex(it => it.name === targetName);
            if (index > -1) Player.data.inventory.splice(index, 1);
        }

        // 學習/升級神通
        const existingSkill = Player.data.skills.find(s => s.id === skillData.id);
        if (!existingSkill) {
            Player.data.skills.push({ ...skillData, level: 1 });
            UI_Battle.log(`✨ 成功集齊殘卷！你領悟了神通：【${skillName}】`, 'reward');
        } else {
            existingSkill.level++;
            UI_Battle.log(`✨ 神通【${skillName}】領悟更深一層，提升至 Lv.${existingSkill.level}`, 'reward');
        }

        Player.save();
        this.closeDetail();
        this.render();
    },

    // 6. 裝備邏輯
    equipItem(uuid) {
        const index = Player.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return;
        
        const item = Player.data.inventory[index];
        const type = item.type; // weapon 或 armor
        Player.data.equipped[type] = item;
        
        UI_Battle.log(`裝備了 [${item.name}]`, 'system');
        Player.save();
        this.closeDetail();
        this.render();
    },

    // 7. 出售邏輯
    sellItem(uuid) {
        const index = Player.data.inventory.findIndex(i => i.uuid === uuid);
        if (index === -1) return;

        const item = Player.data.inventory[index];
        const sellPrice = item.price || 10;
        
        Player.data.coin += sellPrice;
        Player.data.inventory.splice(index, 1);
        
        UI_Battle.log(`售出了 [${item.name}]，獲得靈石 x${sellPrice}`, 'system');
        Player.save();
        this.closeDetail();
        this.render();
    },

    closeDetail() {
        const modal = document.getElementById('modal-detail');
        if (modal) modal.style.display = 'none';
    }
};

window.UI_Bag = UI_Bag;
