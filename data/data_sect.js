/**
 * V3.0 data_sect.js (萬象森羅 - 中西合璧擴張版)
 * 職責：定義弟子生成基礎庫 (含中西姓名、魔法詞條、惡搞屬性)
 */

export const DATA_SECT = {
    // 1. 賜名法陣：融合東西方命名美學
    NAME_POOL: {
        // 姓氏庫：中式名門 + 西式家族 + 奇葩姓氏
        SURNAMES: [
            // 中式經典與修仙
            "李", "王", "張", "劉", "陳", "楊", "趙", "黃", "墨", "風", "雲", "夜", "楚", "沐", "姬", "姜", "贏",
            "東方", "西門", "南宮", "北冥", "軒轅", "上官", "歐陽", "皇甫", "慕容", "獨孤", "澹臺",
            // 西式奇幻家族
            "阿格里帕", "斯圖亞特", "彭德拉根", "甘道夫", "波特", "韋恩", "史塔克", "天行者", "索倫", "奧古斯都",
            "巴風特", "莫德凱撒", "瓦倫泰", "喬斯達", "布萊克", "懷特", "雷諾斯", "范特西",
            // 搞怪與迷因
            "苟", "炸天", "甄", "賈", "鐵", "史", "龍傲", "法克", "馬斯克", "坤", "菜"
        ],
        // 名號庫：依風格分類，生成時隨機組合
        GIVEN_NAMES: {
            // 中式仙俠 (1-2字)
            east: ["逍遙", "靈兒", "凡", "傲天", "塵", "雨", "劍", "玄", "青", "雲", "雪", "天", "霸", "二狗", "翠花", "鐵柱", "富貴"],
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

    // 3. 混沌詞條庫 (Traits)：融合魔法、修仙、搞笑與中二
    TRAITS: {
        // --- ☯️ 修仙類 ---
        '劍骨': { desc: '天生為劍而生，戰力+20%', effect: { atk_mult: 1.2 }, type: 'buff' },
        '苟道中人': { desc: '活得久才是王道，體質+50% 但戰力減半', effect: { stat_con_plus: 50, atk_mult: 0.5 }, type: 'funny' },
        '退婚流主角': { desc: '莫欺少年窮！修煉速度爆表', effect: { exp_mult: 2.5 }, type: 'special' },
        
        // --- 🧙 魔法奇幻類 ---
        '大賢者': { desc: '通曉古今魔法，悟性+80%', effect: { stat_int_plus: 80 }, type: 'magic' },
        '禁忌黑魔法': { desc: '威力巨大但損害神魂，戰力+50% 體質-30%', effect: { stat_atk_plus: 50, stat_con_minus: 30 }, type: 'magic' },
        '吟遊詩人': { desc: '到處亂跑不幹活，機緣+40% 產出-20%', effect: { stat_luck_plus: 40, prod_mult: 0.8 }, type: 'magic' },
        '德魯伊之友': { desc: '與草木溝通，仙草園產出+30%', effect: { farm_mult: 1.3 }, type: 'magic' },
        '魔力過敏': { desc: '一用魔法就打噴嚏，修煉極慢', effect: { exp_mult: 0.3 }, type: 'debuff' },
        
        // --- 🤪 摸不著頭緒 & 搞笑類 ---
        '異世界轉生者': { desc: '滿腦子現代科技。匠心+100%，常說些讓人聽不懂的話', effect: { stat_craft_plus: 100 }, type: 'special' },
        '鍵盤仙人': { desc: '能言善辯。悟性+50%，實戰一碰就碎', effect: { stat_int_plus: 50, stat_con_minus: 40 }, type: 'funny' },
        '禿頭強者': { desc: '我變禿了也變強了。戰力+80%，魅力-100', effect: { atk_mult: 1.8, stat_charm_minus: 100 }, type: 'funny' },
        '薛丁格的修為': { desc: '不看面板時很強，一看面板就很弱', effect: { random_stats: true }, type: 'funny' },
        '天選之子(路人版)': { desc: '機緣很高，但僅限於撿到五塊錢', effect: { stat_luck_plus: 20 }, type: 'funny' },
        '被迫營業': { desc: '想回家睡覺。派遣效率有機率減半', effect: { lazy_chance: 0.4 }, type: 'debuff' },
        '中二病晚期': { desc: '「爆裂吧，現實！」戰力隨機在 0.1 到 3 倍之間跳動', effect: { unstable_atk: true }, type: 'special' },
        '沒靈石會死': { desc: '每分鐘不發工資就想叛逃', effect: { cost_mult: 3.0 }, type: 'debuff' },
        '魔法少女(物理)': { desc: '法杖只是裝飾，拳頭才是真理。戰力+60%，悟性-20%', effect: { stat_atk_plus: 60, stat_int_minus: 20 }, type: 'funny' }
        // ==========================================
        // 🌟 V3.0 擴充詞條包 (20種)
        // ==========================================

        // --- ☯️ 修仙與內卷類 ---
        '卷王之王': { desc: '修仙界的內卷狂魔。自身產出+50%，但太吵會導致他人的產出降低。', effect: { prod_mult: 1.5, annoy_others: true }, type: 'funny' },
        '轉世大能': { desc: '曾經叱吒風雲，現在從零開始。初始屬性極低，但升級給的屬性點翻倍。', effect: { stat_base_minus: 50, growth_mult: 2.0 }, type: 'special' },
        '主角的墊腳石': { desc: '注定被主角打臉的反派命。戰力極高，但機緣是負數，出門必遇大災。', effect: { stat_atk_plus: 80, stat_luck_minus: 100 }, type: 'funny' },
        '雷劫絕緣體': { desc: '天道根本懶得劈他。突破境界時免去雷劫，但戰鬥力極度拉垮。', effect: { easy_breakthrough: true, atk_mult: 0.6 }, type: 'special' },
        '宗門交際花': { desc: '走到哪聊到哪。魅力拉滿，但去仙草園只會顧著聊天忘記採藥。', effect: { stat_charm_plus: 100, prod_mult: 0.5 }, type: 'funny' },

        // --- 🧙 西方魔法與奇幻類 ---
        '巨龍血脈': { desc: '體內流淌著貪婪的龍血。戰力與體質驚人，但每天會私吞宗門 10% 的靈石。', effect: { stat_atk_plus: 60, stat_con_plus: 60, steal_coins: true }, type: 'magic' },
        '精靈之眷': { desc: '深受自然精靈喜愛。只要派去仙草園，靈草生長速度直接起飛。', effect: { farm_mult: 1.8 }, type: 'magic' },
        '亡靈法師': { desc: '擅長驅使骷髏挖礦。靈礦脈產出+80%，但會把其他膽小的散修嚇跑。', effect: { mine_mult: 1.8, scare_workers: true }, type: 'magic' },
        '時空迷子': { desc: '時常不小心掉進空間裂縫。會隨機消失幾天不幹活，但回來時偶爾會帶回極品神裝。', effect: { time_jump: true, ultra_luck_chance: 0.05 }, type: 'magic' },
        '鍊金術狂人': { desc: '等價交換的信徒。匠心突破天際，但偶爾會把仙草煉成會爆炸的廢物。', effect: { stat_craft_plus: 120, explode_chance: 0.1 }, type: 'magic' },

        // --- 🤪 現代迷因與社畜類 ---
        '打工人': { desc: '拿多少錢辦多少事。只要工資（靈石）給雙倍，產能直接飆升 200%。', effect: { money_driven: true }, type: 'funny' },
        '畫餅大師': { desc: '最會講幹話。自身產能為 0，但能忽悠同一產業的其他人多幹 20% 的活。', effect: { prod_mult: 0, buff_others: 1.2 }, type: 'funny' },
        '社恐': { desc: '人多的地方就會發抖。如果該產業只有他一個人，效率+100%；有別人則效率-50%。', effect: { loner_buff: 2.0, crowd_debuff: 0.5 }, type: 'funny' },
        '玻璃心': { desc: '被罵一下就想退宗。機緣若低於 50，會陷入重度憂鬱，完全罷工。', effect: { emotion_fragile: true }, type: 'debuff' },
        '天生反骨': { desc: '你叫他往東他偏往西。派去挖礦他偏要去種草，完全不受控制。', effect: { reverse_work: true }, type: 'funny' },

        // --- ✨ 奇特體質與玄學類 ---
        '氣運之子(偽)': { desc: '抽卡時金光閃閃，特效拉滿，點開一看面板全是戰五渣。', effect: { fake_ssr: true, stat_all_minus: 80 }, type: 'funny' },
        '財神附體': { desc: '什麼都不用做，只要他在宗門裡喘氣，宗門每分鐘就會無中生有產出靈石。', effect: { passive_income: 50 }, type: 'buff' },
        '重度網癮': { desc: '整天盯著傳音玉簡看。悟性極高，但體質與視力嚴重衰退。', effect: { stat_int_plus: 90, stat_con_minus: 70 }, type: 'funny' },
        '吃貨': { desc: '化悲憤為食慾。給他吃得越多戰鬥力越強，宗門伙食費終結者。', effect: { food_driven_atk: true, cost_mult: 2.5 }, type: 'special' },
        '薛丁格的貓奴': { desc: '吸貓能治百病。若宗門內有靈獸，全屬性+30%；若沒有，全屬性-30%。', effect: { pet_dependent: true }, type: 'funny' }
      
    },

    BASE_STATS: ['戰力', '悟性', '機緣', '體質', '修為', '匠心']
};
