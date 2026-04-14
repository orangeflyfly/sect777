/**
 * V1.9.0 fx.js (戰鬥特效引擎)
 * 職責：處理傷害飄字、經驗獲取提示、受擊震動等視覺回饋
 */

const FX = {
    /**
     * 在畫面上生成飄字
     * @param {string|number} text - 顯示內容
     * @param {string} type - 目標類型 ('monster' 或 'player' 或 'system')
     * @param {string} color - 強制指定顏色 (選填)
     */
    spawnPopText(text, type = 'monster', color = null) {
        // 1. 尋找目標錨點
        let targetEl;
        if (type === 'monster') {
            targetEl = document.getElementById('monster-display');
        } else if (type === 'player') {
            targetEl = document.querySelector('.player-main-stats');
        }

        if (!targetEl) return;

        // 2. 獲取目標位置座標
        const rect = targetEl.getBoundingClientRect();
        
        // 3. 創建飄字元素
        const pop = document.createElement('div');
        pop.className = `fx-pop-text pop-${type}`;
        pop.innerText = text;

        // 4. 設定顏色邏輯
        if (color) {
            pop.style.color = color;
        } else {
            // 預設顏色：怪物受傷紅，玩家受傷紫/紅
            pop.style.color = (type === 'monster') ? '#ef4444' : '#f87171';
        }

        // 5. 計算隨機偏移量 (讓多個數字不會完全重疊)
        const offsetX = (Math.random() - 0.5) * 40; // 左右隨機偏移 20px
        const offsetY = (Math.random() - 0.5) * 20;

        pop.style.left = `${rect.left + rect.width / 2 + offsetX}px`;
        pop.style.top = `${rect.top + offsetY}px`;

        // 6. 放入大陣並開啟動畫
        document.body.appendChild(pop);

        // 7. 動畫結束後(與 CSS 設定一致) 自動毀滅
        setTimeout(() => {
            pop.remove();
        }, 1000);
    },

    /**
     * 畫面受擊震動特效
     * @param {string} targetId - 震動目標 ID
     */
    shake(targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;

        el.classList.add('fx-shake');
        setTimeout(() => {
            el.classList.remove('fx-shake');
        }, 300);
    }
};

// 全域對接
window.FX = FX;
console.log("%c【系統】特效引擎 fx.js 已掛載成功。", "color: #ec4899; font-weight: bold;");
