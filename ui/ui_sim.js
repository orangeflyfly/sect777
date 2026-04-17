/**
 * V3.6.4 ui_sim.js (萬象森羅 - 宗門微縮視界 + 防走後門版)
 * 職責：可視化弟子、漫遊AI、隨機性格飄字、實裝點擊指派微操、建築等級動態外觀、弟子轉向
 * 新增：防走後門機制 (assignJob 容量檢測)
 * 位置：/ui/ui_sim.js
 */

import { Player } from '../entities/player.js';
import { DATA_SECT } from '../data/data_sect.js';
import { MessageCenter as Msg } from '../utils/MessageCenter.js';

export const UI_Sim = {
    containerId: 'page-sim',
    updateInterval: null,
    eventInterval: null,
    activeEvent: null, 

    facilityCoords: {
        'idle': { x: 50, y: 50 },    
        'mine': { x: 15, y: 15 },    
        'farm': { x: 85, y: 15 },    
        'alchemy': { x: 15, y: 85 }, 
        'forge': { x: 85, y: 85 }    
    },

    bubbleLines: {
        'status_mine': ["鏘！鏘！", "這石頭真硬...", "挖到靈石了？", "腰酸背痛..."],
        'status_farm': ["除草真累", "長快點啊小寶貝", "這株好像快枯了", "靈氣好充沛"],
        'status_alchemy': ["火候！注意火候！", "好香的丹氣", "千萬別炸爐...", "咳咳...煙好大"],
        'status_forge': ["八十！八十！", "這鐵怎麼打不扁", "好燙好燙", "神兵即將出世！"],
        'status_idle': ["今天天氣真好~", "修煉？明天再說", "宗主怎麼還不發工資", "偷閒摸魚真開心"],
        
        'trait_苟道中人': ["外面太危險了...", "活著不好嗎？", "不要看我，我只是路過", "這事有風險，我不幹"],
        'trait_吃貨': ["什麼時候放飯？", "好餓啊...", "那邊那株仙草看起來很好吃", "肚子咕咕叫"],
        'trait_中二病晚期': ["爆裂吧！現實！", "我體內的洪荒之力...", "凡人，仰望我吧！", "漆黑的烈焰啊..."],
        'trait_畫餅大師': ["大家加油！明年給你們換新法寶！", "格局要打開！", "這都是為了宗門的未來！"],
        'trait_打工人': ["只要靈石到位，仙帝我也幹碎", "今天也是充滿幹勁的一天", "我的肝還能撐！"]
    },

    init() {
        console.log("%c【UI_Sim】宗門模擬視界陣法啟動 (防走後門版)...", "color: #38bdf8; font-weight: bold;");
        this.injectStyles(); 
        this.renderLayout();
        this.startSimulation();
    },

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
            .sim-facility:hover {
                filter: brightness(1.2) !important;
                transform: translate(-50%, -50%) scale(1.1) !important;
            }
            @keyframes upgrade-flash {
                0% { box-shadow: 0 0 0px #fbbf24; filter: brightness(1); }
                50% { box-shadow: 0 0 50px #fbbf24; filter: brightness(2); }
                100% { box-shadow: 0 4px 10px rgba(0,0,0,0.5); filter: brightness(1); }
            }
            .fac-upgrading {
                animation: upgrade-flash 1s ease-out;
            }
            .sim-event-npc {
                position: absolute;
                font-size: 30px;
                cursor: pointer;
                z-index: 15;
                animation: bounce-npc 1s infinite alternate;
                filter: drop-shadow(0 4px 5px rgba(0,0,0,0.6));
            }
            .sim-event-npc:hover { transform: scale(1.2); }
            @keyframes bounce-npc {
                from { transform: translateY(0); }
                to { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    },

    renderLayout() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let html = `
            <div class="page-title" style="margin-bottom: 10px;">宗門微縮視界</div>
            <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 15px;">
                點擊弟子【神識傳音】 | 點擊建築【升級擴建】 | 留意突發事件
            </div>
            
            <div id="sim-ground" style="position:relative; width:100%; height:60vh; min-height: 400px; background:radial-gradient(circle at center, #1e293b 0%, #020617 100%); border:2px solid #475569; border-radius:16px; overflow:hidden; box-shadow: inset 0 0 50px rgba(0,0,0,0.8);">
        `;

        if (DATA_SECT && DATA_SECT.FACILITIES) {
            for (let key in DATA_SECT.FACILITIES) {
                const fac = DATA_SECT.FACILITIES[key];
                const pos = this.facilityCoords[key];
                const clickAction = key === 'idle' ? `Msg.log('宗門廣場，眾弟子休憩交流之地。', 'system')` : `UI_Sim.showFacilityModal('${key}')`;
                
                html += `
                    <div id="fac-${key}" class="sim-facility" onclick="${clickAction}" style="position:absolute; left:${pos.x}%; top:${pos.y}%; transform:translate(-50%, -50%); width:70px; height:70px; background:${fac.color}; border-radius:50%; border:3px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:1; box-shadow: 0 4px 10px rgba(0,0,0,0.5); cursor:pointer; transition: all 0.3s ease;" title="點擊檢視/升級">
                        <span style="font-size:28px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); pointer-events:none;">${fac.icon}</span>
                        <span style="font-size:10px; color:#f8fafc; font-weight:bold; margin-top:2px; text-shadow:0 1px 2px black; pointer-events:none;">${fac.name}</span>
                    </div>
                `;
            }
        }

        html += `<div id="sim-events-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:15; pointer-events:none;"></div>`;
        html += `<div id="sim-disciples-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; pointer-events:none;"></div>`;
        html += `</div>`;

        container.innerHTML = html;
    },

    startSimulation() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.eventInterval) clearInterval(this.eventInterval);
        
        this.updateFacilities(); 
        this.updateDisciples();
        
        this.updateInterval = setInterval(() => {
            this.updateFacilities(); 
            this.updateDisciples();
        }, 2000);

        this.eventInterval = setInterval(() => {
            this.triggerRandomEvent();
        }, 15000);
    },

    showFacilityModal(facKey) {
        if (!Player.data || !Player.data.world) return;
        const wData = Player.data.world;
        const facData = DATA_SECT.FACILITIES[facKey];
        if (!facData) return;

        let currentLevel = wData[facKey] ? wData[facKey].level || 0 : 0;
        
        let costCoin = 1000 * (currentLevel + 1);
        let costOre = 100 * (currentLevel + 1);
        let maxLevel = 10;

        let actionHtml = '';
        if (currentLevel >= maxLevel) {
            actionHtml = `<div style="color:var(--exp-color); font-weight:bold; padding:10px;">已達最高境界，道法自然。</div>`;
        } else {
            actionHtml = `
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:left; font-size:12px; margin-bottom:15px;">
                    <div style="color:#cbd5e1; margin-bottom:5px;">擴建所需資源：</div>
                    <div style="color:var(--coin-color)">靈石：${costCoin.toLocaleString()}</div>
                    <div style="color:#94a3b8">玄鐵：${costOre.toLocaleString()}</div>
                </div>
                <button class="btn-eco-action" style="width:100%; background:var(--exp-color); border:none; color:black; font-weight:bold; padding:10px; border-radius:8px; cursor:pointer;" 
                        onclick="UI_Sim.upgradeFacility('${facKey}', ${costCoin}, ${costOre})">
                    ⚒️ 注入靈氣擴建 (升至 Lv.${currentLevel + 1})
                </button>
            `;
        }

        const modalHtml = `
            <div id="sim-fac-modal" class="modal-overlay" style="z-index:9999;" onclick="this.remove()">
                <div class="detail-glass-card trade-card" onclick="event.stopPropagation()" style="text-align:center;">
                    <div class="modal-header">
                        <h4>${facData.icon} ${facData.name}</h4>
                        <button class="btn-modal-close" onclick="document.getElementById('sim-fac-modal').remove()">✕</button>
                    </div>
                    <div style="margin: 10px 0; font-size:14px; color:#f8fafc; font-weight:bold;">
                        當前境界：<span style="color:var(--hp-color);">Lv.${currentLevel}</span>
                    </div>
                    <div style="margin-bottom: 20px; font-size:12px; color:#94a3b8; line-height:1.5;">
                        ${facData.desc}
                    </div>
                    ${actionHtml}
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    upgradeFacility(facKey, costCoin, costOre) {
        if (!Player.data || !Player.data.world || !Player.data.materials) return;
        
        let currentCoin = Player.data.coin || 0;
        let currentOre = Player.data.materials.ore || 0;

        if (currentCoin < costCoin || currentOre < costOre) {
            Msg.log("❌ 宗門資源不足，無法擴建陣法！", "red");
            return;
        }

        Player.data.coin -= costCoin;
        Player.data.materials.ore -= costOre;
        
        if (!Player.data.world[facKey]) Player.data.world[facKey] = { level: 0, assigned: 0 };
        Player.data.world[facKey].level += 1;
        
        Player.save();
        if (window.Core) window.Core.updateUI();

        const modal = document.getElementById('sim-fac-modal');
        if (modal) modal.remove();

        const facEl = document.getElementById(`fac-${facKey}`);
        if (facEl) {
            facEl.classList.remove('fac-upgrading');
            void facEl.offsetWidth; 
            facEl.classList.add('fac-upgrading');
        }

        Msg.log(`🎊 擴建成功！【${DATA_SECT.FACILITIES[facKey].name}】升級至 Lv.${Player.data.world[facKey].level}`, "gold");
        this.updateFacilities();
    },

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

            if (level === 0) {
                facEl.style.filter = 'grayscale(100%) opacity(0.4)';
            } else {
                facEl.style.filter = 'none';
                const scale = 1 + (level - 1) * 0.05;
                facEl.style.transform = `translate(-50%, -50%) scale(${Math.min(scale, 1.5)})`;
                
                if (level >= 5) {
                    facEl.style.boxShadow = `0 0 20px ${DATA_SECT.FACILITIES[key].color}, inset 0 0 10px rgba(255,255,255,0.6)`;
                } else {
                    facEl.style.boxShadow = `0 4px 10px rgba(0,0,0,0.5)`;
                }
                
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

    triggerRandomEvent() {
        if (this.activeEvent) return; 
        
        const rand = Math.random();
        if (rand < 0.1) {
            this.spawnMerchant();
        } else if (rand < 0.2) {
            this.spawnBeast();
        }
    },

    spawnMerchant() {
        const layer = document.getElementById('sim-events-layer');
        if (!layer) return;

        this.activeEvent = 'merchant';
        Msg.log("🔔 一位【雲遊商人】來到了宗門廣場！", "system");

        const npc = document.createElement('div');
        npc.className = 'sim-event-npc';
        npc.innerHTML = '💰';
        npc.style.left = '50%';
        npc.style.top = '50%';
        npc.style.transform = 'translate(-50%, -50%)';
        npc.style.pointerEvents = 'auto'; 
        
        npc.onclick = () => {
            if (confirm("雲遊商人：嘿嘿，道友，花 500 靈石買個盲盒機緣如何？")) {
                let coin = Player.data.coin || 0;
                if (coin >= 500) {
                    Player.data.coin -= 500;
                    if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
                    
                    if (Math.random() > 0.5) {
                        Player.data.materials.herb += 10;
                        Msg.log("🎁 商人給了你一大包【仙草 x10】！", "gold");
                    } else {
                        Player.data.materials.ore += 10;
                        Msg.log("🎁 商人塞給你一堆【玄鐵 x10】！", "gold");
                    }
                    Player.save();
                    if (window.Core) window.Core.updateUI();
                } else {
                    Msg.log("商人鄙視地看了你一眼：靈石不夠啊，窮鬼。", "red");
                }
            }
            npc.remove();
            this.activeEvent = null;
        };

        layer.appendChild(npc);

        setTimeout(() => {
            if (document.body.contains(npc)) {
                npc.remove();
                this.activeEvent = null;
                Msg.log("🔔 雲遊商人離開了宗門。", "system");
            }
        }, 30000);
    },

    spawnBeast() {
        const layer = document.getElementById('sim-events-layer');
        if (!layer) return;

        this.activeEvent = 'beast';
        Msg.log("⚠️ 警告！一頭【搗亂妖獸】潛入了宗門！快點擊驅逐牠！", "red");

        const npc = document.createElement('div');
        npc.className = 'sim-event-npc';
        npc.innerHTML = '🐺';
        
        const isFarm = Math.random() > 0.5;
        const basePos = isFarm ? this.facilityCoords['farm'] : this.facilityCoords['mine'];
        npc.style.left = `${basePos.x + (Math.random()*10 - 5)}%`;
        npc.style.top = `${basePos.y + (Math.random()*10 - 5)}%`;
        npc.style.transform = 'translate(-50%, -50%)';
        npc.style.pointerEvents = 'auto'; 
        
        npc.onclick = () => {
            if (!Player.data.materials) Player.data.materials = { herb: 0, ore: 0 };
            Player.data.materials.ore += 5;
            Player.data.coin += 200;
            Player.save();
            if (window.Core) window.Core.updateUI();
            
            Msg.log("⚔️ 你親自出手擊殺了妖獸！搜刮獲得 200 靈石與 玄鐵 x5", "gold");
            npc.remove();
            this.activeEvent = null;
        };

        layer.appendChild(npc);

        setTimeout(() => {
            if (document.body.contains(npc)) {
                npc.remove();
                this.activeEvent = null;
                Msg.log("💨 妖獸吃飽喝足，大搖大擺地逃跑了...", "system");
            }
        }, 20000);
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
            
            if (!el) {
                el = document.createElement('div');
                el.id = `sim-d-${d.id}`;
                el.className = 'sim-disciple';
                el.dataset.lastX = gw / 2; 
                
                let emoji = '😐'; 
                if (d.traits) {
                    for (let t of d.traits) {
                        if (DATA_SECT.TRAITS[t] && DATA_SECT.TRAITS[t].effect && DATA_SECT.TRAITS[t].effect.sim_emoji) {
                            emoji = DATA_SECT.TRAITS[t].effect.sim_emoji;
                            break; 
                        }
                    }
                }

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

            const targetKey = d.status || 'idle';
            const pos = this.facilityCoords[targetKey] || this.facilityCoords['idle'];
            const isIdle = (targetKey === 'idle');

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

            el.style.transition = `transform ${transitionTime}s cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.transform = `translate(${targetX}px, ${targetY}px)`;
            
            const prevX = parseFloat(el.dataset.lastX);
            el.dataset.lastX = targetX; 
            
            const avatar = el.querySelector('.sim-avatar-emoji');
            if (avatar) {
                const direction = targetX > prevX ? -1 : 1; 
                
                if (Math.random() > 0.5) {
                    const tilt = (Math.random() - 0.5) * 20;
                    avatar.style.transform = `translateY(-3px) rotate(${tilt}deg) scaleX(${direction})`;
                    setTimeout(() => { if(avatar) avatar.style.transform = `translateY(0) rotate(0deg) scaleX(${direction})`; }, 300);
                } else {
                    avatar.style.transform = `scaleX(${direction})`;
                }
            }

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

    spawnBubble(disciple) {
        const bubble = document.getElementById(`bubble-${disciple.id}`);
        if (!bubble || bubble.classList.contains('sim-bubble-show')) return; 

        let possibleLines = [];
        
        const statusKey = `status_${disciple.status || 'idle'}`;
        if (this.bubbleLines[statusKey]) {
            possibleLines = possibleLines.concat(this.bubbleLines[statusKey]);
        }

        if (disciple.traits) {
            disciple.traits.forEach(t => {
                const traitKey = `trait_${t}`;
                if (this.bubbleLines[traitKey]) {
                    possibleLines = possibleLines.concat(this.bubbleLines[traitKey]);
                    possibleLines = possibleLines.concat(this.bubbleLines[traitKey]);
                }
            });
        }

        if (possibleLines.length === 0) return;

        const text = possibleLines[Math.floor(Math.random() * possibleLines.length)];
        bubble.innerText = text;
        bubble.classList.add('sim-bubble-show');

        setTimeout(() => {
            if (bubble) bubble.classList.remove('sim-bubble-show');
        }, 3000);
    },

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

    // 🌟 修正：加入容量防呆檢測
    assignJob(discipleId, newStatus) {
        if (!Player.data || !Player.data.sect || !Player.data.sect.disciples) return;
        const d = Player.data.sect.disciples.find(x => x.id === discipleId);
        if (!d) return;

        // 🛑 防呆與防走後門：檢查設施容量 (除了廣場 idle 之外)
        if (newStatus !== 'idle') {
            const facLevel = Player.data.world[newStatus] ? Player.data.world[newStatus].level : 0;
            if (facLevel === 0) {
                if(window.MessageCenter) window.MessageCenter.log(`❌ 該設施尚未建立，無法指派！`, "red");
                return;
            }
            
            // 系統設定：設施每 1 級可容納 2 名弟子
            const maxCapacity = facLevel * 2; 
            const currentWorkers = Player.data.sect.disciples.filter(x => x.status === newStatus).length;
            
            if (currentWorkers >= maxCapacity) {
                if(window.MessageCenter) window.MessageCenter.log(`❌ 【${DATA_SECT.FACILITIES[newStatus].name}】已滿員 (目前 ${currentWorkers}/${maxCapacity})，請先升級建築！`, "red");
                return;
            }
        }

        d.status = newStatus;
        Player.save();

        const modal = document.getElementById('sim-modal-overlay');
        if (modal) modal.remove();

        const bubble = document.getElementById(`bubble-${discipleId}`);
        if (bubble) {
            bubble.innerText = "遵命！宗主！";
            bubble.classList.add('sim-bubble-show');
            setTimeout(() => { bubble.classList.remove('sim-bubble-show'); }, 3000);
        }

        this.updateFacilities();
        this.updateDisciples();
    }
};

window.UI_Sim = UI_Sim;
