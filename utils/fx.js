/**
 * V2.5 fx.js
 * 職責：處理傷害飄字、震動、招式特寫、以及資源獲取特效
 */

export const FX = {
    /**
     * 招式特寫演出 (Skill Cut-in)
     */
    async skillCutIn(skillName, icon = "✨") {
        const layer = document.getElementById('skill-cut-in-layer');
        if (!layer) return;

        const overlay = document.createElement('div');
        overlay.className = 'cutin-bg-overlay';
        
        const banner = document.createElement('div');
        banner.className = 'skill-banner banner-animate';
        banner.innerHTML = `<span>${icon} ${skillName} ${icon}</span>`;
        
        const flash = document.createElement('div');
        flash.className = 'skill-flash';

        layer.appendChild(overlay);
        layer.appendChild(banner);
        layer.appendChild(flash);

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
     * 生成飄字 (傷害/EXP)
     */
    spawnPopText(text, type = 'monster', color = null) {
        let targetEl = (type === 'monster') 
            ? document.getElementById('monster-display') 
            : document.getElementById('player-display');

        if (!targetEl) return;

        const rect = targetEl.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = `fx-pop-text pop-${type}`;
        pop.innerText = text;

        if (color) {
            pop.style.color = color;
        } else {
            pop.style.color = (type === 'monster') ? '#ef4444' : '#f87171';
        }

        const offsetX = (Math.random() - 0.5) * 40; 
        const offsetY = (Math.random() - 0.5) * 20;

        pop.style.left = `${rect.left + rect.width / 2 + offsetX}px`;
        pop.style.top = `${rect.top + offsetY}px`;

        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 1000);
    },

    /**
     * 🟢 新增：靈石/物資噴發特效 (Loot Explosion)
     * @param {HTMLElement} sourceEl - 噴發起點元素 (例如點擊的按鈕)
     * @param {Array} icons - 噴發的圖標陣列 (例如 ['💰', '🌿'])
     */
    spawnLootExplosion(sourceEl, icons = ['💰']) {
        if (!sourceEl) return;
        const rect = sourceEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const particleCount = 12; // 噴發數量

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'fx-loot-particle';
            // 隨機從圖標陣列選一個
            particle.innerText = icons[Math.floor(Math.random() * icons.length)];
            
            // 初始位置
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            
            // 隨機飛行向量
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 50; // 稍微向上噴射

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            document.body.appendChild(particle);

            // 動畫結束後移除
            setTimeout(() => particle.remove(), 1000);
        }
    },

    /**
     * 畫面震動
     */
    shake(targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;

        el.classList.remove('fx-shake');
        el.offsetHeight; 
        el.classList.add('fx-shake');
        
        setTimeout(() => {
            el.classList.remove('fx-shake');
        }, 300);
    }
};

window.FX = FX;
console.log("%c【系統】V2.5 特效引擎強化，靈石噴發陣法已載入。", "color: #ec4899; font-weight: bold;");
