/**
 * V3.6.0 data_sect.js (萬象森羅 - 模擬視界擴充版)
 * 職責：定義弟子生成基礎庫 (含中西姓名、魔法詞條、惡搞屬性、生產基建專屬)
 * 新增：為 2D Colony Sim (宗門模擬) 擴充移動速度、行為標籤與建築座標庫
 * 位置：/data/data_sect.js
 */

export const DATA_SECT = {
    // 1. 賜名法陣：融合東西方命名美學
    NAME_POOL: {
        // 姓氏庫：中式名門 + 西式家族 + 奇葩姓氏
        SURNAMES: [
            // 常見單姓
            "李", "王", "張", "劉", "陳", "楊", "趙", "黃", "周", "吳", "徐", "孫", "胡", "朱", "高", "林", "何", "郭", "馬", "羅", "梁", "宋", "鄭", "謝", "韓", "唐", "馮", "于", "董", "蕭", "程", "曹", "袁", "鄧", "許", "傅", "沈", "曾", "彭", "呂", "蘇", "盧", "蔣", "蔡", "賈", "丁", "魏", "薛", "葉", "閻", "余", "潘", "杜", "戴", "夏", "鍾", "汪", "田", "任", "姜", "范", "方", "石", "姚", "譚", "廖", "鄒", "熊", "金", "陸", "郝", "孔", "白", "崔", "康", "毛", "邱", "秦", "江", "史", "顧", "侯", "邵", "孟", "龍", "萬", "段", "雷", "錢", "湯", "尹", "黎", "易", "常", "武", "喬", "賀", "賴", "龔", "文",
            // 修仙感單姓
            "墨", "風", "雲", "雷", "冷", "夜", "楚", "沐", "白", "姬", "姜", "贏",
            // 霸氣複姓
            "東方", "西門", "南宮", "北冥", "軒轅", "上官", "歐陽", "皇甫", "令狐", "諸葛", "司徒", "司空", "百里", "公孫", "太史", "端木", "慕容", "宇文", "獨孤", "拓跋", "澹臺", "夏侯", "微生",
            // 西式奇幻家族
            "阿格里帕", "斯圖亞特", "彭德拉根", "甘道夫", "波特", "韋恩", "史塔克", "天行者", "索倫", "奧古斯都",
            "巴風特", "莫德凱撒", "瓦倫泰", "喬斯達", "布萊克", "懷特", "雷諾斯", "范特西",
            // 搞怪與迷因
            "苟", "炸天", "甄", "賈", "鐵", "史", "龍傲", "法克", "馬斯克", "坤", "菜"
        ],
        // 名號庫：依風格分類，生成時隨機組合
        GIVEN_NAMES: {
            // 五行與自然
            nature: ["風", "雲", "雪", "雷", "炎", "焱", "淼", "林", "木", "水", "火", "土", "山", "川", "海", "月", "星", "辰", "日", "光", "暗", "影", "夜", "霜", "冰", "霞", "虹", "霽", "嵐"],
            // 劍與戰鬥
            combat: ["劍", "鋒", "刃", "狂", "霸", "戰", "破", "天", "絕", "殺", "無痕", "傲", "孤", "煞", "血", "斬", "裂"],
            // 仙氣與氣質
            spirit: ["凡", "塵", "仙", "靈", "虛", "無", "真", "道", "清", "靜", "逸", "然", "若", "夢", "幻", "音", "妙", "玄", "青", "紫", "玉", "明", "幽", "遠", "歌", "語", "心", "意", "緣"],
            // 西式奇幻 (翻譯感強)
            west: ["亞瑟", "凱瑟琳", "艾德華", "安娜", "比爾", "鮑伯", "莉莉絲", "路西法", "梅林", "葛雷夫", "凱爾", "黛安娜", "約翰"],
            // 魔法與奧術
            magic: ["符文", "禁咒", "奧術", "冥想", "閃現", "火球", "魔導", "星璇", "虛空", "靈媒", "大賢者", "魔女"],
            // 中二與迷因
            meme: ["日天", "弑神", "路過", "是在哈囉", "不可以色色", "想當初", "打五個", "之呼吸", "坤坤"]
        }
    },

    // 2. 靈根資質：修仙與魔法的稀有度
    ROOT_LEVELS: {
        '仙': { weight: 1, color: '#f59e0b', label: '仙靈根/全系魔法使', multiplier: 3.5, rarity: 5 }, 
        '天': { weight: 9, color: '#fbbf24', label: '天靈根/禁咒法師', multiplier: 2.5, rarity: 4 }, 
        '地': { weight: 20, color: '#a855f7', label: '地靈根/元素掌控者', multiplier: 1.8, rarity: 3 },
        '玄': { weight: 30, color: '#3b82f6', label: '玄靈根/見習法師', multiplier: 1.3, rarity: 2 },
        '黃': { weight: 40, color: '#94a3b8', label: '凡骨/魔法絕緣體', multiplier: 1.0, rarity: 1 }   
    },

    // 3. 混沌詞條庫 (Traits)：融合魔法、修仙、搞笑、中二與生產基建
    // 🟢 模擬擴充：在 effect 中植入 move_speed (移動速度倍率) 與 sim_emoji (頭頂冒泡特效)
    TRAITS: {
        // ==========================================
        // 🌟 道友原創精華保留區
        // ==========================================
        // --- ☯️ 修仙類 ---
        '劍骨': { desc: '天生為劍而生，戰力+20%', effect: { atk_mult: 1.2, move_speed: 1.1, sim_emoji: '⚔️' }, type: 'buff' },
        '苟道中人': { desc: '活得久才是王道，體質+50% 但戰力減半', effect: { stat_con_plus: 50, atk_mult: 0.5, move_speed: 0.6, sim_emoji: '🐢' }, type: 'funny' },
        '退婚流主角': { desc: '莫欺少年窮！修煉速度爆表', effect: { exp_mult: 2.5, move_speed: 1.2, sim_emoji: '🔥' }, type: 'special' },
        
        // --- 🧙 魔法奇幻類 ---
        '大賢者': { desc: '通曉古今魔法，悟性+80%', effect: { stat_int_plus: 80, sim_emoji: '📖' }, type: 'magic' },
        '禁忌黑魔法': { desc: '威力巨大但損害神魂，戰力+50% 體質-30%', effect: { stat_atk_plus: 50, stat_con_minus: 30, sim_emoji: '💀' }, type: 'magic' },
        '吟遊詩人': { desc: '到處亂跑不幹活，機緣+40% 產出-20%', effect: { stat_luck_plus: 40, prod_mult: 0.8, move_speed: 1.3, sim_emoji: '🎵' }, type: 'magic' },
        '德魯伊之友': { desc: '與草木溝通，仙草園產出+30%', effect: { farm_mult: 1.3, sim_emoji: '🌱' }, type: 'magic' },
        '魔力過敏': { desc: '一用魔法就打噴嚏，修煉極慢', effect: { exp_mult: 0.3, sim_emoji: '🤧' }, type: 'debuff' },
        
        // --- 🤪 摸不著頭緒 & 搞笑類 ---
        '異世界轉生者': { desc: '滿腦子現代科技。匠心+100%，常說些讓人聽不懂的話', effect: { stat_craft_plus: 100, sim_emoji: '📱' }, type: 'special' },
        '鍵盤仙人': { desc: '能言善辯。悟性+50%，實戰一碰就碎', effect: { stat_int_plus: 50, stat_con_minus: 40, sim_emoji: '⌨️' }, type: 'funny' },
        '禿頭強者': { desc: '我變禿了也變強了。戰力+80%，魅力-100', effect: { atk_mult: 1.8, stat_charm_minus: 100, move_speed: 1.4, sim_emoji: '👨‍🦲' }, type: 'funny' },
        '薛丁格的修為': { desc: '不看面板時很強，一看面板就很弱', effect: { random_stats: true, sim_emoji: '📦' }, type: 'funny' },
        '天選之子(路人版)': { desc: '機緣很高，但僅限於撿到五塊錢', effect: { stat_luck_plus: 20, sim_emoji: '🪙' }, type: 'funny' },
        '被迫營業': { desc: '想回家睡覺。派遣效率有機率減半', effect: { lazy_chance: 0.4, move_speed: 0.5, sim_emoji: '💤' }, type: 'debuff' },
        '中二病晚期': { desc: '「爆裂吧，現實！」戰力隨機在 0.1 到 3 倍之間跳動', effect: { unstable_atk: true, sim_emoji: '👁️‍🗨️' }, type: 'special' },
        '沒靈石會死': { desc: '每分鐘不發工資就想叛逃', effect: { cost_mult: 3.0, sim_emoji: '💸' }, type: 'debuff' },
        '魔法少女(物理)': { desc: '法杖只是裝飾，拳頭才是真理。戰力+60%，悟性-20%', effect: { stat_atk_plus: 60, stat_int_minus: 20, sim_emoji: '💖' }, type: 'funny' }, 
        
        // --- V3.0 擴充詞條包 ---
        '卷王之王': { desc: '修仙界的內卷狂魔。自身產出+50%，但太吵會導致他人的產出降低。', effect: { prod_mult: 1.5, annoy_others: true, move_speed: 1.5, sim_emoji: '🔥' }, type: 'funny' },
        '轉世大能': { desc: '曾經叱吒風雲，現在從零開始。初始屬性極低，但升級給的屬性點翻倍。', effect: { stat_base_minus: 50, growth_mult: 2.0, sim_emoji: '✨' }, type: 'special' },
        '主角的墊腳石': { desc: '注定被主角打臉的反派命。戰力極高，但機緣是負數，出門必遇大災。', effect: { stat_atk_plus: 80, stat_luck_minus: 100, sim_emoji: '🦶' }, type: 'funny' },
        '雷劫絕緣體': { desc: '天道根本懶得劈他。突破境界時免去雷劫，但戰鬥力極度拉垮。', effect: { easy_breakthrough: true, atk_mult: 0.6, sim_emoji: '⛱️' }, type: 'special' },
        '宗門交際花': { desc: '走到哪聊到哪。魅力拉滿，但去仙草園只會顧著聊天忘記採藥。', effect: { stat_charm_plus: 100, prod_mult: 0.5, move_speed: 1.2, sim_emoji: '💬' }, type: 'funny' },
        '巨龍血脈': { desc: '體內流淌著貪婪的龍血。戰力與體質驚人，但每天會私吞宗門 10% 的靈石。', effect: { stat_atk_plus: 60, stat_con_plus: 60, steal_coins: true, sim_emoji: '🐲' }, type: 'magic' },
        '精靈之眷': { desc: '深受自然精靈喜愛。只要派去仙草園，靈草生長速度直接起飛。', effect: { farm_mult: 1.8, sim_emoji: '🧚' }, type: 'magic' },
        '亡靈法師': { desc: '擅長驅使骷髏挖礦。靈礦脈產出+80%，但會把其他膽小的散修嚇跑。', effect: { mine_mult: 1.8, scare_workers: true, sim_emoji: '💀' }, type: 'magic' },
        '時空迷子': { desc: '時常不小心掉進空間裂縫。會隨機消失幾天不幹活，但回來時偶爾會帶回極品神裝。', effect: { time_jump: true, ultra_luck_chance: 0.05, sim_emoji: '🌀' }, type: 'magic' },
        '鍊金術狂人': { desc: '等價交換的信徒。匠心突破天際，但偶爾會把仙草煉成會爆炸的廢物。', effect: { stat_craft_plus: 120, explode_chance: 0.1, sim_emoji: '🧪' }, type: 'magic' },
        '打工人': { desc: '拿多少錢辦多少事。只要工資（靈石）給雙倍，產能直接飆升 200%。', effect: { money_driven: true, move_speed: 1.3, sim_emoji: '💼' }, type: 'funny' },
        '畫餅大師': { desc: '最會講幹話。自身產能為 0，但能忽悠同一產業的其他人多幹 20% 的活。', effect: { prod_mult: 0, buff_others: 1.2, sim_emoji: '🥞' }, type: 'funny' },
        '社恐': { desc: '人多的地方就會發抖。如果該產業只有他一個人，效率+100%；有別人則效率-50%。', effect: { loner_buff: 2.0, crowd_debuff: 0.5, move_speed: 0.8, sim_emoji: '🥶' }, type: 'funny' },
        '玻璃心': { desc: '被罵一下就想退宗。機緣若低於 50，會陷入重度憂鬱，完全罷工。', effect: { emotion_fragile: true, sim_emoji: '💔' }, type: 'debuff' },
        '天生反骨': { desc: '你叫他往東他偏往西。派去挖礦他偏要去種草，完全不受控制。', effect: { reverse_work: true, sim_emoji: '🖕' }, type: 'funny' },
        '氣運之子(偽)': { desc: '抽卡時金光閃閃，特效拉滿，點開一看面板全是戰五渣。', effect: { fake_ssr: true, stat_all_minus: 80, sim_emoji: '🤡' }, type: 'funny' },
        '財神附體': { desc: '什麼都不用做，只要他在宗門裡喘氣，宗門每分鐘就會無中生有產出靈石。', effect: { passive_income: 50, sim_emoji: '💰' }, type: 'buff' },
        '重度網癮': { desc: '整天盯著傳音玉簡看。悟性極高，但體質與視力嚴重衰退。', effect: { stat_int_plus: 90, stat_con_minus: 70, sim_emoji: '📱' }, type: 'funny' },
        '吃貨': { desc: '化悲憤為食慾。給他吃得越多戰鬥力越強，宗門伙食費終結者。', effect: { food_driven_atk: true, cost_mult: 2.5, sim_emoji: '🍗' }, type: 'special' },
        '薛丁格的貓奴': { desc: '吸貓能治百病。若宗門內有靈獸，全屬性+30%；若沒有，全屬性-30%。', effect: { pet_dependent: true, sim_emoji: '🐱' }, type: 'funny' },

        // ==========================================
        // 🛠️ 護法補齊區：生產專精、真實修仙機制、Debuff
        // ==========================================
        '尋脈點穴': { desc: '天生對礦脈敏感，未來靈礦脈產能 x1.8', effect: { mine_mult: 1.8, sim_emoji: '🧭' }, type: 'buff' },
        '黃金礦工': { desc: '挖礦是一門藝術，未來靈礦脈產能 x1.5', effect: { mine_mult: 1.5, sim_emoji: '⛏️' }, type: 'buff' },
        '天生鼎爐': { desc: '控火奇才，未來煉丹房產能 x2.0', effect: { alchemy_mult: 2.0, sim_emoji: '🔥' }, type: 'buff' },
        '巧奪天工': { desc: '打鐵奇才，未來煉器室產能 x2.0', effect: { forge_mult: 2.0, sim_emoji: '🔨' }, type: 'buff' },
        '悟性驚人': { desc: '任何功法一學就會，獲取修為 x1.5', effect: { exp_mult: 1.5, sim_emoji: '💡' }, type: 'buff' },
        '天道酬勤': { desc: '雖然資質平庸，但極度刻苦，獲取修為 x1.3', effect: { exp_mult: 1.3, move_speed: 1.2, sim_emoji: '💦' }, type: 'buff' },
        '天生神力': { desc: '肌肉能解決一切修仙問題！物理戰鬥傷害 x1.5', effect: { combat_mult: 1.5, sim_emoji: '💪' }, type: 'buff' },
        '聚靈體質': { desc: '行走的聚靈陣，若駐守宗門陣眼，靈氣產出暴增', effect: { core_aura_mult: 2.0, sim_emoji: '✨' }, type: 'buff' },
        '好吃懶做': { desc: '產能減半，且有 30% 機率在工作時偷睡覺', effect: { prod_mult: 0.5, lazy_chance: 0.3, move_speed: 0.4, sim_emoji: '🥱' }, type: 'debuff' },
        '病秧子': { desc: '走兩步就喘，體力消耗極快，獲取修為 x0.8', effect: { exp_mult: 0.8, move_speed: 0.6, sim_emoji: '🤒' }, type: 'debuff' },
        '烏鴉嘴': { desc: '去哪哪倒楣，工作時引發意外的機率大幅提升', effect: { explode_chance: 0.3, sim_emoji: '🐦‍⬛' }, type: 'debuff' },
        '龍王贅婿': { desc: '隱忍不發，50%機率罷工，但一旦認真修為獲取 x3.0！', effect: { lazy_chance: 0.5, exp_mult: 3.0, sim_emoji: '🐉' }, type: 'magic' },
        '氣運之子': { desc: '真正的天命之人。未來秘境奇遇獲得極品機率大增', effect: { luck_mult: 3.0, sim_emoji: '🌟' }, type: 'magic' },
        '老爺爺附體': { desc: '戒指裡藏著殘魂，即使閒置不工作，修為也會自動微幅增長', effect: { auto_exp: true, sim_emoji: '💍' }, type: 'magic' }
    },

    BASE_STATS: ['戰力', '悟性', '機緣', '體質', '修為', '匠心'],

    // ==========================================
    // 🟢 模擬視界專屬庫 (Colony Sim Data)
    // ==========================================
    
    // 4. 宗門建築座標映射 (給 2D 模擬地圖使用)
    FACILITIES: {
        'idle': { id: 'idle', name: '宗門廣場', icon: '⛩️', desc: '弟子閒逛、摸魚、觸發機緣之地', color: '#334155' },
        'mine': { id: 'mine', name: '靈礦脈', icon: '⛏️', desc: '鏗鏘作響的挖礦區', color: '#713f12' },
        'farm': { id: 'farm', name: '仙草園', icon: '🌿', desc: '靈氣氤氳的種植區', color: '#14532d' },
        'alchemy': { id: 'alchemy', name: '煉丹閣', icon: '⚗️', desc: '地火常燃的煉丹房', color: '#7f1d1d' },
        'forge': { id: 'forge', name: '煉器殿', icon: '🔨', desc: '火花四濺的打鐵區', color: '#9a3412' }
    },

    // 5. 弟子外觀化身庫 (Avatar Pool)
    AVATARS: {
        // 基礎表情 (對應道心狀態)
        faces: ['😐', '😠', '😌', '😎', '😴', '🤪', '🤩', '🧐'],
        // 基礎道袍顏色 (生成時隨機賦予 css var)
        robes: ['#1e293b', '#0f172a', '#1e1b4b', '#172554', '#14532d', '#3f2c2c', '#4a044e', '#451a03']
    }
};

window.DATA_SECT = DATA_SECT;
