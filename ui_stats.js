_X_UI.stats = {
    renderPlayer: function(p) {
        document.getElementById('val-level').innerText = p.level;
        document.getElementById('val-realm').innerText = p.realm;
        document.getElementById('val-exp').innerText = `${Math.floor(p.exp / p.nextExp * 100)}%`;
        // 基礎四維
        document.getElementById('val-str').innerText = p.str;
        document.getElementById('val-con').innerText = p.con;
        document.getElementById('val-dex').innerText = p.dex;
        document.getElementById('val-int').innerText = p.int;
    },
    renderSkills: function(skills) {
        const container = document.getElementById('skill-list');
        if (!container) return;
        container.innerHTML = skills.map(s => {
            const typeLabel = s.type === 'active' ? '<span class="tag-active">【主動神通】</span>' : '<span class="tag-passive">【被動心法】</span>';
            return `<div class="skill-card">${typeLabel} <b>${s.name}</b> (Lv.${s.level || 1})</div>`;
        }).join('');
    }
};
