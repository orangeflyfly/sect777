window._X_UI = window._X_UI || {};
_X_UI.battle = {
    log: function(msg, type = 'normal') {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;
        let color = "#ddd";
        if (type === 'damage') color = "#ff4d4d";
        if (type === 'heal') color = "#2ecc71";
        if (type === 'drop') color = "#f1c40f";
        if (type === 'system') color = "#3498db";

        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        logContainer.insertAdjacentHTML('afterbegin', `<p style="color:${color}">[${time}] ${msg}</p>`);
        if (logContainer.children.length > 50) logContainer.removeChild(logContainer.lastChild);
    },
    updateHP: function(current, max) {
        const bar = document.getElementById('player-hp-bar');
        const text = document.getElementById('player-hp-text');
        if (bar) bar.style.width = Math.max(0, (current / max) * 100) + "%";
        if (text) text.innerText = `${Math.floor(current)} / ${Math.floor(max)}`; // 強制顯影
    },
    renderMonster: function(monster) {
        document.getElementById('monster-name').innerText = monster ? `【${monster.name}】` : "尋覓妖獸中...";
        const mBar = document.getElementById('monster-hp-bar');
        if (mBar) mBar.style.width = monster ? (monster.hp / monster.maxHp * 100) + "%" : "0%";
    }
};
