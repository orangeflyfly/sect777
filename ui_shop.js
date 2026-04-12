_X_UI.shop = {
    renderShop: function(shopData) {
        const container = document.getElementById('shop-list');
        if (!container) return;
        container.innerHTML = shopData.map(item => `
            <div class="shop-card">
                <b>${item.name}</b>
                <p>售價：${item.price} 靈石</p>
                <button onclick="shop.buy('${item.id}')">購買</button>
            </div>
        `).join('');
    }
};
