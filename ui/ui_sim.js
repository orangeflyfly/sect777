/**
 * V3.6.2 ui_sim.js (萬象森羅 - 宗門微縮視界 + 建築顯化與靈動身法版)
 * 職責：可視化弟子、漫遊AI、隨機性格飄字、實裝點擊指派微操、建築等級動態外觀、弟子轉向
 * 位置：/ui/ui_sim.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';

export const UI_Sim = {
    containerId: 'page-sim',
    updateInterval: null,

    // 定義設施的虛擬座標 (使用百分比)
    facilityCoords: {
        'idle': { x: 50, y: 50 },    // 宗門廣場 (中央)
        'mine': { x: 15, y: 15 },    // 靈礦脈 (左上)
        'farm': { x: 85, y: 15 },    // 仙草園 (右上)
        'alchemy': { x: 15, y: 85 }, // 煉丹閣 (左下)
        'forge': { x: 85, y: 85 }    // 煉器殿 (右下)
    },

    // 🌟 新增：性格與狀態對應的台詞庫 (Route 1)
    bubbleLines: {
        'status_mine': ["鏘！鏘！", "這石頭真硬...", "挖到靈石了？", "腰酸背痛..."],
        'status_farm': ["除草真累", "長快點啊小寶貝", "這株好像快枯了", "靈氣好充沛"],
        'status_alchemy': ["火候！注意火候！", "好香的丹氣", "千萬別炸爐...", "咳咳...煙好大"],
        'status_forge': ["八十！八十！", "這鐵怎麼打不扁", "好燙好燙", "神兵即將出世！"],
        'status_idle': ["今天天氣真好~", "修煉？明天再說", "宗主怎麼還不發工資", "偷閒摸魚真開心"],
        
        // 針對特殊性格的專屬台詞
        'trait_苟道中人': ["外面太危險了...", "活著不好嗎？", "不要看我，我只是路過", "這事有風險，我不幹"],
        'trait_吃貨': ["什麼時候放飯？", "好餓啊...", "那邊那株仙草看起來很好吃", "肚子咕咕叫"],
        'trait_中二病晚期': ["爆裂吧！現實！", "我體內的洪荒之力...", "凡人，仰望我吧！", "漆黑的烈焰啊..."],
        'trait_畫餅大師': ["大家加油！明年給你們換新法寶！", "格局要打開！", "這都是為了宗門的未來！"],
        'trait_打工人': ["只要靈石到位，仙帝我也幹碎", "今天也是充滿幹勁的一天", "我的肝還能撐！"]
    },

    init() {
        console.log("%c【UI_Sim】宗門模擬視界陣法啟動 (支援微操、機緣與建築顯化)...", "color: #38bdf8; font-weight: bold;");
        this.injectStyles(); // 注入專屬 CSS
        this.renderLayout();
        this.startSimulation();
    },

    // 🌟 新增：注入飄字與微操 Modal 的 CSS
    injectStyles() {
        if (document.getElementById('sim-styles')) return;
        const style = document.createElement('style');
        style.id = 'sim-styles';
        style.innerHTML = `
            .sim-speech-bubble {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                background: rgba(255, 255, 255, 0.95);
                color: #0f172a;
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 20;
            }
            .sim-speech-bubble::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -4px;
                border-width: 4px;
                border-style: solid;
                border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
            }
            .sim-bubble-show {
                transform: translateX(-50%) translateY(-5px);
                opacity: 1;
            }
            /* 設施等級浮動標籤 */
            .fac-level-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 10px;
                font-weight: bold;
                border: 1px solid #7f1d1d;
                box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    },

    renderLayout() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let html = `
            <div class="page-title" style="margin-bottom: 10px;">宗門微縮視界</div>
            <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 15px;">觀察弟子百態，點擊弟子名字可【神識傳音】指派工作</div>
            
            <div id="sim-ground" style="position:relative; width:100%; height:60vh; min-height: 400px; background:radial-gradient(circle at center, #1e293b 0%, #020617 100%); border:2px solid #475569; border-radius:16px; overflow:hidden; box-shadow: inset 0 0 50px rgba(0,0,0,0.8);">
        `;

        // 1. 繪製五大設施地標 (加入了 transition 讓升級變大時有動畫)
        if (DATA_SECT && DATA_SECT.FACILITIES) {
            for (let key in DATA_SECT.FACILITIES) {
                const fac = DATA_SECT.FACILITIES[key];
                const pos = this.facilityCoords[key];
                html += `
                    <div id="fac-${key}" class="sim-facility" style="position:absolute; left:${pos.x}%; top:${pos.y}%; transform:translate(-50%, -50%); width:70px; height:70px; background:${fac.color}; border-radius:50%; border:3px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:1; box-shadow: 0 4px 10px rgba(0,0,0,0.5); cursor:help; transition: all 0.5s ease;" title="${fac.desc}">
                        <span style="font-size:28px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${fac.icon}</span>
                        <span style="font-size:10px; color:#f8fafc; font-weight:bold; margin-top:2px; text-shadow:0 1px 2px black;">${fac.name}</span>
                    </div>
                `;
            }
        }

        // 2. 建立小人活動圖層
        html += `<div id="sim-disciples-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; pointer-events:none;"></div>`;
        html += `</div>`;

        container.innerHTML = html;
    },

    startSimulation() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateFacilities(); // 🌟 啟動時先刷新一次建築狀態
        this.updateDisciples();
        
        // 每 2 秒掃描一次
        this.updateInterval = setInterval(() => {
            this.updateFacilities(); // 🌟 定期刷新建築，捕捉玩家剛升級的變化
            this.updateDisciples();
        }, 2000);
    },

    // 🌟 新增：建築等級顯化邏輯
    updateFacilities() {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;

        for (let key in this.facilityCoords) {
            const facEl = document.getElementById(`fac-${key}`);
            if (!facEl) continue;

            let level = 1;
            if (key !== 'idle') {
                level = (wData[key] && wData[key].level !== undefined) ? wData[key].level : 0;
            }

            // 0 級表示未解鎖
            if (level === 0) {
                facEl.style.filter = 'grayscale(100%) opacity(0.4)';
                facEl.title = "尚未建立或解鎖此設施";
            } else {
                facEl.style.filter = 'none';
                
                // 根據等級放大
                const scale = 1 + (level - 1) * 0.05;
                facEl.style.transform = `translate(-50%, -50%) scale(${Math.min(scale, 1.5)})`;
                
                // 等級 5 以上發出靈光
                if (level >= 5) {
                    facEl.style.boxShadow = `0 0 20px ${DATA_SECT.FACILITIES[key].color}, inset 0 0 10px rgba(255,255,255,0.6)`;
                } else {
                    facEl.style.boxShadow = `0 4px 10px rgba(0,0,0,0.5)`;
                }
                
                facEl.title = `${DATA_SECT.FACILITIES[key].name} (Lv.${level})\n${DATA_SECT.FACILITIES[key].desc}`;
                
                // 動態添加或更新右上角 Lv 標籤
                let badge = facEl.querySelector('.fac-level-badge');
                if (key !== 'idle') {
                    if (!badge) {
                        badge = document.createElement('div');
                        badge.className = 'fac-level-badge';
                        facEl.appendChild(badge);
                    }
                    badge.innerText = `Lv.${level}`;
                }
            }
        }
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
            
            // 🌟 A. 首次生成
            if (!el) {
                el = document.createElement('div');
                el.id = `sim-d-${d.id}`;
                el.className = 'sim-disciple';
                el.dataset.lastX = gw / 2; // 🌟 記憶初始 X 座標，用於判斷轉向
                
                let emoji = '😐'; 
                if (d.traits) {
                    for (let t of d.traits) {
                        if (DATA_SECT.TRAITS[t] && DATA_SECT.TRAITS[t].effect && DATA_SECT.TRAITS[t].effect.sim_emoji) {
                            emoji = DATA_SECT.TRAITS[t].effect.sim_emoji;
                            break; 
                        }
                    }
                }

                // 🌟 onclick 觸發微操選單
                el.innerHTML = `
                    <div class="sim-speech-bubble" id="bubble-${d.id}"></div>
                    <div class="sim-avatar-emoji" style="font-size:20px; transition: transform 0.2s; position:relative;">${emoji}</div>
                    <div style="font-size:10px; color:white; background:rgba(0,0,0,0.6); padding:2px 6px; border-radius:4px; margin-top:2px; font-weight:bold; border:1px solid rgba(255,255,255,0.2); pointer-events:auto; cursor:pointer;" onclick="UI_Sim.showDiscipleModal('${d.id}')">${d.name}</div>
                `;
                
                el.style.position = 'absolute';
                el.style.left = '0px';
                el.style.top = '0px';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                el.style.alignItems = 'center';
                el.style.width = '60px';
                
                el.style.transform = `translate(${gw/2 - 30}px, ${gh/2 - 20}px)`;
                layer.appendChild(el);
                
                el.getBoundingClientRect();
            }

            // 🌟 B. 漫遊尋路 AI 強化
            const targetKey = d.status || 'idle';
            const pos = this.facilityCoords[targetKey] || this.facilityCoords['idle'];
            const isIdle = (targetKey === 'idle');

            // 🌟 如果閒置，讓他在廣場大範圍漫遊 (200px)；如果在工作，則在設施旁小範圍移動 (60px)
            const jitterRange = isIdle ? 200 : 60;
            const jitterX = (Math.random() - 0.5) * jitterRange;
            const jitterY = (Math.random() - 0.5) * jitterRange;

            const targetX = (pos.x / 100 * gw) + jitterX - 30; 
            const targetY = (pos.y / 100 * gh) + jitterY - 20;

            let speedMult = 1.0;
            if (d.traits) {
                d.traits.forEach(t => {
                    if (DATA_SECT.TRAITS[t] && DATA_SECT.TRAITS[t].effect && DATA_SECT.TRAITS[t].effect.move_speed) {
                        speedMult *= DATA_SECT.TRAITS[t].effect.move_speed;
                    }
                });
            }
            
            const transitionTime = Math.max(0.5, 3.0 / speedMult); 

            // 🌟 執行移動
            el.style.transition = `transform ${transitionTime}s cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.transform = `translate(${targetX}px, ${targetY}px)`;
            
            // 🌟 靈動身法：判斷前進方向，翻轉頭像
            const prevX = parseFloat(el.dataset.lastX);
            el.dataset.lastX = targetX; // 存下這次的目的地
            
            const avatar = el.querySelector('.sim-avatar-emoji');
            if (avatar) {
                const direction = targetX > prevX ? -1 : 1; // 往右走為 -1 (水平翻轉)，往左為 1 (預設)
                
                // 加入走路時的顛簸感
                if (Math.random() > 0.5) {
                    const tilt = (Math.random() - 0.5) * 20;
                    avatar.style.transform = `translateY(-3px) rotate(${tilt}deg) scaleX(${direction})`;
                    setTimeout(() => { if(avatar) avatar.style.transform = `translateY(0) rotate(0deg) scaleX(${direction})`; }, 300);
                } else {
                    avatar.style.transform = `scaleX(${direction})`;
                }
            }

            // 🌟 C. 天道機緣 (飄字系統 - Route 1)
            // 每2秒有 15% 機率說話
            if (Math.random() < 0.15) {
                this.spawnBubble(d);
            }
        });

        const existingEls = layer.querySelectorAll('.sim-disciple');
        existingEls.forEach(el => {
            const id = el.id.replace('sim-d-', '');
            if (!disciples.find(d => d.id === id)) {
                el.style.opacity = '0';
                el.style.transform += ' scale(0.1)';
                setTimeout(() => el.remove(), 500); 
            }
        });
    },

    // 🌟 Route 1: 飄字邏輯
    spawnBubble(disciple) {
        const bubble = document.getElementById(`bubble-${disciple.id}`);
        if (!bubble || bubble.classList.contains('sim-bubble-show')) return; // 已經在說話就跳過

        let possibleLines = [];
        
        // 1. 加入狀態台詞
        const statusKey = `status_${disciple.status || 'idle'}`;
        if (this.bubbleLines[statusKey]) {
            possibleLines = possibleLines.concat(this.bubbleLines[statusKey]);
        }

        // 2. 加入性格專屬台詞
        if (disciple.traits) {
            disciple.traits.forEach(t => {
                const traitKey = `trait_${t}`;
                if (this.bubbleLines[traitKey]) {
                    // 性格台詞權重加倍 (放進去兩次)
                    possibleLines = possibleLines.concat(this.bubbleLines[traitKey]);
                    possibleLines = possibleLines.concat(this.bubbleLines[traitKey]);
                }
            });
        }

        if (possibleLines.length === 0) return;

        const text = possibleLines[Math.floor(Math.random() * possibleLines.length)];
        bubble.innerText = text;
        bubble.classList.add('sim-bubble-show');

        // 3秒後消失
        setTimeout(() => {
            if (bubble) bubble.classList.remove('sim-bubble-show');
        }, 3000);
    },

    // 🌟 Route 2: 神識微操 (彈出指派選單)
    showDiscipleModal(discipleId) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return;
        const d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        const statusNames = { 'idle': '閒置 (廣場)', 'mine': '靈礦脈', 'farm': '仙草園', 'alchemy': '煉丹閣', 'forge': '煉器殿' };
        const currentStatusStr = statusNames[d.status || 'idle'] || '未知';

        const modalHtml = `
            <div id="sim-modal-overlay" class="modal-overlay" style="z-index:9999;" onclick="this.remove()">
                <div class="detail-glass-card trade-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h4>神識傳音：${d.name}</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('sim-modal-overlay').remove()">✕</button>
                    </div>
                    <div style="text-align:center; margin: 15px 0; font-size:13px; color:#cbd5e1;">
                        當前所在：<span style="color:var(--hp-color); font-weight:bold;">${currentStatusStr}</span><br>
                        性格：${d.traits ? d.traits.join('、') : '無'}
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px;">
                        <button class="btn-eco-action" style="background:#334155; border:1px solid #475569; color:white; border-radius:8px; cursor:pointer;" 
                                onclick="UI_Sim.assignJob('${d.id}', 'idle')">召回廣場 (閒置)</button>
                        <button class="btn-eco-action" style="background:#713f12; border:1px solid #a16207; color:white; border-radius:8px; cursor:pointer;" 
                                onclick="UI_Sim.assignJob('${d.id}', 'mine')">去挖礦 (靈礦脈)</button>
                        <button class="btn-eco-action" style="background:#14532d; border:1px solid #166534; color:white; border-radius:8px; cursor:pointer;" 
                                onclick="UI_Sim.assignJob('${d.id}', 'farm')">去種田 (仙草園)</button>
                        <button class="btn-eco-action" style="background:#7f1d1d; border:1px solid #991b1b; color:white; border-radius:8px; cursor:pointer;" 
                                onclick="UI_Sim.assignJob('${d.id}', 'alchemy')">去煉丹 (煉丹閣)</button>
                        <button class="btn-eco-action" style="background:#9a3412; border:1px solid #c2410c; color:white; border-radius:8px; cursor:pointer; grid-column: span 2;" 
                                onclick="UI_Sim.assignJob('${d.id}', 'forge')">去打鐵 (煉器殿)</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 執行指派邏輯
    assignJob(discipleId, newStatus) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return;
        const d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        // 更新狀態
        d.status = newStatus;
        Player.save();

        // 移除 Modal
        const modal = document.getElementById('sim-modal-overlay');
        if (modal) modal.remove();

        // 飄字回饋
        const bubble = document.getElementById(`bubble-${discipleId}`);
        if (bubble) {
            bubble.innerText = "遵命！宗主！";
            bubble.classList.add('sim-bubble-show');
            setTimeout(() => { bubble.classList.remove('sim-bubble-show'); }, 3000);
        }

        // 強制立刻刷新位置與建築狀態
        this.updateFacilities();
        this.updateDisciples();
    }
};

window.UI_Sim = UI_Sim;
