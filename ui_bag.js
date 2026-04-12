_X_UI.bag = {
    renderInventory: function(items) {
        const container = document.getElementById('inventory-grid');
        if (!container) return;
        container.innerHTML = items.map(item => {
            // 解析前綴與品級
            const rarityClass = `r-${item.rarity || 1}`;
            const prefixHTML = item.prefixes ? item.prefixes.map(p => `<span class="prefix-text">[${p}]</span>`).join('') : '';
            
            return `
                <div class="item-slot ${rarityClass}" onclick="_X_UI.bag.showDetail('${item.id}')">
                    <div class="item-info">
                        ${prefixHTML}<span class="item-name">${item.name}</span>
                    </div>
                </div>
            `;
        }).join('');
    },
    showDetail: function(itemId) {
        // 這裡寫點擊裝備後的詳情彈窗邏輯
        console.log("查看寶物內容:", itemId);
    }
};
