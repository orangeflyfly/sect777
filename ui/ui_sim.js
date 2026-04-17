/**
 * V3.6.0 ui_sim.js (萬象森羅 - 宗門微縮視界版)
 * 職責：將宗門設施與弟子可視化，處理小人的移動動畫與狀態更新
 * 位置：/ui/ui_sim.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';

export const UI_Sim = {
    containerId: 'page-sim',
    updateInterval: null,

    // 定義設施的虛擬座標 (使用百分比，確保響應式 RWD 佈局)
    facilityCoords: {
        'idle': { x: 50, y: 50 },    // 宗門廣場 (中央)
        'mine': { x: 15, y: 15 },    // 靈礦脈 (左上)
        'farm': { x: 85, y: 15 },    // 仙草園 (右上)
        'alchemy': { x: 15, y: 85 }, // 煉丹閣 (左下)
        'forge': { x: 85, y: 85 }    // 煉器殿 (右下)
    },

    init() {
        console.log("%c【UI_Sim】宗門模擬視界陣法啟動...", "color: #38bdf8; font-weight: bold;");
        this.renderLayout();
        this.startSimulation();
    },

    renderLayout() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let html = `
            <div class="page-title" style="margin-bottom: 10px;">宗門微縮視界</div>
            <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 15px;">觀察弟子們的日常勞作與摸魚百態</div>
            
            <div id="sim-ground" style="position:relative; width:100%; height:60vh; min-height: 400px; background:radial-gradient(circle at center, #1e293b 0%, #020617 100%); border:2px solid #475569; border-radius:16px; overflow:hidden; box-shadow: inset 0 0 50px rgba(0,0,0,0.8);">
        `;

        // 🌟 1. 繪製五大設施地標
        if (DATA_SECT && DATA_SECT.FACILITIES) {
            for (let key in DATA_SECT.FACILITIES) {
                const fac = DATA_SECT.FACILITIES[key];
                const pos = this.facilityCoords[key];
                html += `
                    <div id="fac-${key}" class="sim-facility" style="position:absolute; left:${pos.x}%; top:${pos.y}%; transform:translate(-50%, -50%); width:70px; height:70px; background:${fac.color}; border-radius:50%; border:3px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:1; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <span style="font-size:28px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${fac.icon}</span>
                        <span style="font-size:10px; color:#f8fafc; font-weight:bold; margin-top:2px; text-shadow:0 1px 2px black;">${fac.name}</span>
                    </div>
                `;
            }
        }

        // 🌟 2. 建立小人活動圖層
        html += `<div id="sim-disciples-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; pointer-events:none;"></div>`;
        html += `</div>`;

        container.innerHTML = html;
    },

    startSimulation() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        // 首次渲染小人
        this.updateDisciples();
        
        // 每 2 秒掃描一次弟子狀態，發送尋路指令
        this.updateInterval = setInterval(() => {
            this.updateDisciples();
        }, 2000);
    },

    updateDisciples() {
        const layer = document.getElementById('sim-disciples-layer');
        if (!layer || !Player.data || !Player.data.sect || !Player.data.sect.disciples) return;

        const disciples = Player.data.sect.disciples;
        const ground = document.getElementById('sim-ground');
        if (!ground) return;

        const gw = ground.clientWidth;
        const gh = ground.clientHeight;

        disciples.forEach(d => {
            let el = document.getElementById(`sim-d-${d.id}`);
            
            // 🌟 A. 若弟子是第一次出現在視界中，為其「重塑肉身」
            if (!el) {
                el = document.createElement('div');
                el.id = `sim-d-${d.id}`;
                el.className = 'sim-disciple';
                
                // 決定基礎表情 (從性格庫中抓取)
                let emoji = '😐'; 
                if (d.traits) {
                    for (let t of d.traits) {
                        if (DATA_SECT.TRAITS[t] && DATA_SECT.TRAITS[t].effect && DATA_SECT.TRAITS[t].effect.sim_emoji) {
                            emoji = DATA_SECT.TRAITS[t].effect.sim_emoji;
                            break; // 抓到第一個有表情的性格就使用
                        }
                    }
                }

                // 化身外觀設定
                el.innerHTML = `
                    <div class="sim-avatar-emoji" style="font-size:20px; transition: transform 0.2s;">${emoji}</div>
                    <div style="font-size:10px; color:white; background:rgba(0,0,0,0.6); padding:2px 6px; border-radius:4px; margin-top:2px; font-weight:bold; border:1px solid rgba(255,255,255,0.2); pointer-events:auto; cursor:pointer;" onclick="console.log('點擊了弟子：${d.name}')">${d.name}</div>
                `;
                
                el.style.position = 'absolute';
                el.style.left = '0px';
                el.style.top = '0px';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                el.style.alignItems = 'center';
                el.style.width = '60px';
                
                // 初始誕生點：宗門廣場(中心)
                el.style.transform = `translate(${gw/2 - 30}px, ${gh/2 - 20}px)`;
                layer.appendChild(el);
                
                // 強制重繪以啟動後續的 CSS 動畫
                el.getBoundingClientRect();
            }

            // 🌟 B. 因果尋路：判斷弟子當前狀態，算出目標座標
            const targetKey = d.status || 'idle';
            const pos = this.facilityCoords[targetKey] || this.facilityCoords['idle'];

            // 為了不讓弟子們重疊在一起，加入微小的亂數偏移 (Jitter)
            const jitterX = (Math.random() - 0.5) * 60;
            const jitterY = (Math.random() - 0.5) * 60;

            // 計算最終前往的絕對像素座標 (減去自身寬度的一半以居中)
            const targetX = (pos.x / 100 * gw) + jitterX - 30; 
            const targetY = (pos.y / 100 * gh) + jitterY - 20;

            // 🌟 C. 步速判定：讀取性格中的移動速度加成
            let speedMult = 1.0;
            if (d.traits) {
                d.traits.forEach(t => {
                    if (DATA_SECT.TRAITS[t] && DATA_SECT.TRAITS[t].effect && DATA_SECT.TRAITS[t].effect.move_speed) {
                        speedMult *= DATA_SECT.TRAITS[t].effect.move_speed;
                    }
                });
            }
            
            // 基礎移動時間設為 3 秒，速度倍率越高，秒數越短 (最低不小於 0.5秒)
            const transitionTime = Math.max(0.5, 3.0 / speedMult); 

            // 執行移動！
            el.style.transition = `transform ${transitionTime}s cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.transform = `translate(${targetX}px, ${targetY}px)`;
            
            // 讓小人走路時有微微浮動的跳躍感 (靠隨機 scale 與 rotate 模擬)
            const avatar = el.querySelector('.sim-avatar-emoji');
            if (avatar && Math.random() > 0.5) {
                const tilt = (Math.random() - 0.5) * 20;
                avatar.style.transform = `translateY(-3px) rotate(${tilt}deg)`;
                setTimeout(() => { if(avatar) avatar.style.transform = `translateY(0) rotate(0deg)`; }, 300);
            }
        });

        // 🌟 D. 天道輪迴：如果弟子被解雇了，將其從微縮視界中抹除
        const existingEls = layer.querySelectorAll('.sim-disciple');
        existingEls.forEach(el => {
            const id = el.id.replace('sim-d-', '');
            if (!disciples.find(d => d.id === id)) {
                el.style.opacity = '0';
                el.style.transform += ' scale(0.1)';
                setTimeout(() => el.remove(), 500); // 淡出後移除
            }
        });
    }
};

window.UI_Sim = UI_Sim;
