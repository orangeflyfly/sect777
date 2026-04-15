/**
 * V2.4 fx.js (飛升模組版 - 視覺大成)
 * 職責：處理傷害飄字、經驗獲取提示、受擊震動、招式特寫 (Skill Cut-in)
 * 位置：/utils/fx.js
 */

export const FX = {
    /**
     * 🟢 新增：招式特寫大陣 (Skill Cut-in)
     * 使用方式：await FX.skillCutIn("烈焰斬", "🔥");
     * @param {string} skillName - 神通名稱
     * @param {string} icon - 神通圖示
     */
    async skillCutIn(skillName, icon = "✨") {
        const layer = document.getElementById('skill-cut-in-layer');
        if (!layer) {
            console.warn("【特效】找不到 skill-cut-in-layer，請檢查 index.html。");
            return;
        }

        // 1. 召喚黑屏遮罩
        const overlay = document.createElement('div');
        overlay.className = 'cutin-bg-overlay';
        
        // 2. 召喚招式橫幅
        const banner = document.createElement('div');
        banner.className = 'skill-banner banner-animate';
        banner.innerHTML = `<span>${icon} ${skillName} ${icon}</span>`;
        
        // 3. 召喚瞬閃光效
        const flash = document.createElement('div');
        flash.className = 'skill-flash';

        // 4. 將元素打入特效層
        layer.appendChild(overlay);
        layer.appendChild(banner);
        layer.appendChild(flash);

        console.log(`%c【幻術】施展神通：${skillName}`, "color: #fbbf24; font-weight: bold;");

        // 5. 動畫演出時間 (預設 1200ms)，使用 Promise 確保引擎會等待演出結束
        return new Promise(resolve => {
            setTimeout(() => {
                overlay.remove();
                banner.remove();
                flash.remove();
                resolve(); 
            }, 1200);
        });
    },

    /**
     * 在畫面上生成飄字
     * @param {string|number} text - 顯示內容
     * @param {string} type - 目標類型 ('monster' 或 'player')
     * @param {string} color - 強制指定顏色
     */
    spawnPopText(text, type = 'monster', color = null) {
        // 1. 尋找目標錨點 (修正：對接新版雙方對峙 ID)
        let targetEl;
        if (type === 'monster') {
            targetEl = document.getElementById('monster-display');
        } else if (type === 'player') {
            targetEl = document.getElementById('player-display'); // 🟢 對接 V2.4 對峙位
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
            pop.style.color = (type === 'monster') ? '#ef4444' : '#f87171';
        }

        // 5. 計算隨機偏移量
        const offsetX = (Math.random() - 0.5) * 40; 
        const offsetY = (Math.random() - 0.5) * 20;

        pop.style.left = `${rect.left + rect.width / 2 + offsetX}px`;
        pop.style.top = `${rect.top + offsetY}px`;

        // 6. 放入大陣並開啟動畫
        document.body.appendChild(pop);

        // 7. 動畫結束後自動毀滅
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

        // 確保可以連續觸發震動
        el.classList.remove('fx-shake');
        el.offsetHeight; // 強制重繪
        el.classList.add('fx-shake');
        
        setTimeout(() => {
            el.classList.remove('fx-shake');
        }, 300);
    }
};

/**
 * --- 全域對接 ---
 */
window.FX = FX;

console.log("%c【系統】V2.4 特效引擎重塑完成，招式特寫陣法已刻入。", "color: #ec4899; font-weight: bold;");
