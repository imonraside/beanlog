import { SCORE_LABELS_KO, DEMO_IMG_1, DEMO_IMG_2 } from './constants';

export const idb = {
    db: null,
    init: () => new Promise((resolve, reject) => {
        if(idb.db) return resolve(idb.db);
        const req = indexedDB.open("BeanLogDB", 1);
        req.onupgradeneeded = (e) => { const db = e.target.result; if(!db.objectStoreNames.contains("store")) db.createObjectStore("store"); };
        req.onsuccess = (e) => { idb.db = e.target.result; resolve(idb.db); };
        req.onerror = (e) => reject(e);
    }),
    get: async (key) => { await idb.init(); return new Promise(r => { const tx = idb.db.transaction("store", "readonly"); const req = tx.objectStore("store").get(key); req.onsuccess = () => r(req.result); req.onerror = () => r(null); }); },
    set: async (key, val) => { await idb.init(); return new Promise(r => { const tx = idb.db.transaction("store", "readwrite"); const req = tx.objectStore("store").put(val, key); req.onsuccess = () => r(true); req.onerror = () => r(false); }); },
    del: async (key) => { await idb.init(); return new Promise(r => { const tx = idb.db.transaction("store", "readwrite"); const req = tx.objectStore("store").delete(key); req.onsuccess = () => r(true); req.onerror = () => r(false); }); }
};

export const migrateStorage = async () => {
    const keys = ["BEAN_LOG_MASTER_FINAL_data", "BEAN_LOG_MASTER_FINAL_recipes", "BEAN_LOG_MASTER_FINAL_key", "BEAN_LOG_MASTER_FINAL_theme", "BEAN_LOG_MASTER_FINAL_note_mode", "BEAN_LOG_MASTER_FINAL_sort_mode"];
    for (const k of keys) {
        const local = localStorage.getItem(k);
        if (local) { try { const parsed = JSON.parse(local); const exists = await idb.get(k); if (!exists) { await idb.set(k, parsed); } } catch {'error'} }
    }
};

export const calcAvg = (scores) => { const values = Object.values(scores).map(v => parseFloat(v)); if (values.some(v => isNaN(v))) return "0.0"; return (values.reduce((a, b) => a + b, 0) / 6).toFixed(1); };
export const getDisplayScore = (tasting) => (tasting.isManualTotal && tasting.totalScore !== undefined) ? Number(tasting.totalScore).toFixed(1) : calcAvg(tasting.scores);
export const getMaxScoreVal = (tastings) => (!tastings.length) ? 0 : Math.max(...tastings.map(t => parseFloat(getDisplayScore(t))));
export const getMaxScore = (tastings) => getMaxScoreVal(tastings).toFixed(1);
export const getBestTastingNote = (tastings) => { if (!tastings || tastings.length === 0) return null; const sorted = [...tastings].sort((a, b) => parseFloat(getDisplayScore(b)) - parseFloat(getDisplayScore(a))); return sorted[0].notes; };
export const calcPricePer100g = (price, weight) => { if(!price || !weight) return null; const p = parseFloat(price.replace(/,/g, '')); const w = parseFloat(weight); if(isNaN(p) || isNaN(w) || w === 0) return null; return Math.round((p / w) * 100).toLocaleString(); };
export const formatWeight = (g) => { const num = parseFloat(g); if (isNaN(num)) return "0g"; if (num >= 1000) return `${(num/1000).toFixed(1)}kg`; return `${num}g`; };
export const formatTime = (sec) => `${Math.floor(sec/60)}:${(sec%60)<10?'0':''}${sec%60}`;

export const generateShareText = (bean, tasting) => {
    const score = getDisplayScore(tasting);
    const scoresText = Object.entries(tasting.scores).map(([key, val]) => `- ${SCORE_LABELS_KO[key]}: ${val}`).join('\n');
    const blendText = (bean.isBlend && bean.blendInfo) 
        ? `블렌드 정보: ${bean.blendInfo.map(b => `${b.country} ${b.variety} ${b.ratio}%`.trim()).join(', ')}` 
        : `국가: ${bean.country || '-'} / 지역: ${bean.region || '-'}`;
    return `[BeanLog 시음 기록]\n원두: ${bean.name}\n${blendText}\n가공: ${bean.processing || '-'} / 로스팅: ${bean.roastingLevel || '-'} (${bean.roastingDate || '-'})\n구매처: ${bean.shop || '-'}\n\n날짜: ${tasting.date}\n평점: ${score}\n[세부 점수]\n${scoresText}\n\n노트: ${tasting.notes || '-'}\n평가: ${tasting.desc || '-'}\n메모: ${tasting.memo || '-'}`;
};

export const generateBeanShareText = (bean) => {
    const blendText = (bean.isBlend && bean.blendInfo) 
        ? `블렌드 정보: ${bean.blendInfo.map(b => `${b.country} ${b.variety} ${b.ratio}%`.trim()).join(', ')}\n` 
        : `국가: ${bean.country || '-'} / 지역: ${bean.region || '-'}\n품종: ${bean.variety || '-'} / 고도: ${bean.altitude || '-'}\n`;
    return `[BeanLog 원두 기록]\n원두: ${bean.name}\n${blendText}가공: ${bean.processing || '-'} / 로스팅: ${bean.roastingLevel || '-'}\n생산자: ${bean.producer || '-'}\n구매처: ${bean.shop || '-'} / 구매일: ${bean.purchaseDate || '-'}\n로스팅 날짜: ${bean.roastingDate || '-'}\n가격: ${bean.price ? `${Number(bean.price).toLocaleString()}원` : '-'} (${bean.weight || '-'}g)${bean.pricePerCup ? ` / 한잔: ${Number(bean.pricePerCup).toLocaleString()}원` : ''}\n${bean.purchaseUrl ? `링크: ${bean.purchaseUrl}\n` : ''}노트: ${bean.notes || '-'}\n향미: ${bean.flavorDesc || '-'}\n메모: ${bean.memo || '-'}`;
};

export const calculateRatio = (b, w) => { 
    const bean = parseFloat(b)||0; if(bean===0) return "0:0"; 
    let totalWater = 0; const matches = w.trim().match(/(\d+(?:\.\d+)?)(?:g)?/g); 
    if (matches) matches.forEach(m => { if (!m.includes('g')) totalWater += parseFloat(m); }); 
    return `1 : ${(totalWater/bean).toFixed(1)}`; 
};

export const parseTags = (text) => {
    if (!text) return [];
    if (/[,/]/.test(text)) return text.split(/[,/]+/).map(t => t.trim()).filter(Boolean);
    return text.split(/\s+/).map(t => t.trim()).filter(Boolean);
};

export const getFlagEmoji = (countryName) => {
    if (!countryName) return null;
    const lower = countryName.toLowerCase().trim();
    const map = {
        '한국': '🇰🇷', 'korea': '🇰🇷', '대한민국': '🇰🇷', '에티오피아': '🇪🇹', 'ethiopia': '🇪🇹', '콜롬비아': '🇨🇴', 'colombia': '🇨🇴',
        '브라질': '🇧🇷', 'brazil': '🇧🇷', '과테말라': '🇬🇹', 'guatemala': '🇬🇹', '케냐': '🇰🇪', 'kenya': '🇰🇪',
        '코스타리카': '🇨🇷', 'costa rica': '🇨🇷', 'costarica': '🇨🇷', '파나마': '🇵🇦', 'panama': '🇵🇦',
        '엘살바도르': '🇸🇻', 'el salvador': '🇸🇻', 'elsalvador': '🇸🇻', '온두라스': '🇭🇳', 'honduras': '🇭🇳',
        '인도네시아': '🇮🇩', 'indonesia': '🇮🇩', '베트남': '🇻🇳', 'vietnam': '🇻🇳', '예멘': '🇾🇪', 'yemen': '🇾🇪',
        '르완다': '🇷🇼', 'rwanda': '🇷🇼', '부룬디': '🇧🇮', 'burundi': '🇧🇮', '탄자니아': '🇹🇿', 'tanzania': '🇹🇿',
        '멕시코': '🇲🇽', 'mexico': '🇲🇽', '페루': '🇵🇪', 'peru': '🇵🇪', '볼리비아': '🇧🇴', 'bolivia': '🇧🇴',
        '에콰도르': '🇪🇨', 'ecuador': '🇪🇨', '인도': '🇮🇳', 'india': '🇮🇳', '파푸아뉴기니': '🇵🇬', 'papua new guinea': '🇵🇬',
        '미국': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸', '하와이': '🇺🇸', '중국': '🇨🇳', 'china': '🇨🇳', '호주': '🇦🇺', 'australia': '🇦🇺', '니카라과': '🇳🇮',
    };
    for (const [key, emoji] of Object.entries(map)) { if (lower.includes(key)) return emoji; }
    return null;
};

export const getRoastAge = (dateStr) => {
    if (!dateStr) return null;
    const now = new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    const roast = new Date(y, m - 1, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((today - roast) / (86400000));
    return diff >= 0 ? `+${diff}` : `${diff}`;
};

export const getDemoData = () => {
    const now = new Date();
    const d = (days) => new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    return [
        { id: `demo_${Date.now() + 1}`, name: "에티오피아 예가체프 G1", country: "에티오피아", region: "예가체프", variety: "Heirloom", processing: "Washed", altitude: "1900-2200m", roastingLevel: "Light", producer: "", roastingDate: d(15), purchaseDate: d(10), shop: "데모 커피 로스터스", purchaseUrl: "", weight: "200", price: "22000", pricePerCup: "", notes: "자스민, 베르가못, 복숭아, 꿀", flavorDesc: "꽃향기와 함께 상큼한 과일의 산미가 매력적입니다.", memo: "핸드드립으로 내렸을 때 가장 맛이 좋았음.", isFinished: false, isBlend: false, blendInfo: [], mainImage: DEMO_IMG_1, tastings: [{ date: d(5), scores: { acidity: 8.5, balance: 8.0, sweetness: 8.2, cleanCup: 8.5, body: 7.5, flavor: 8.8 }, isManualTotal: false, totalScore: 0, notes: "자스민, 레몬, 복숭아", desc: "향이 폭발적이다. 산미가 기분 좋게 느껴진다.", memo: "하리오 V60 / 93도 / 1:16 비율" }] },
        { id: `demo_${Date.now() + 2}`, name: "하우스 블렌드 '선샤인'", country: "", region: "", variety: "", processing: "", altitude: "", roastingLevel: "Medium", producer: "", roastingDate: d(25), purchaseDate: d(20), shop: "데모 커피 로스터스", purchaseUrl: "", weight: "500", price: "35000", pricePerCup: "", notes: "견과류, 다크 초콜릿, 좋은 밸런스", flavorDesc: "매일 마시기 좋은 고소하고 균형잡힌 커피.", memo: "", isFinished: true, isBlend: true, blendInfo: [{ country: "브라질", variety: "Catuai", ratio: "60" }, { country: "콜롬비아", variety: "Castillo", ratio: "40" }], mainImage: DEMO_IMG_2, tastings: [{ date: d(15), scores: { acidity: 7.0, balance: 8.5, sweetness: 7.8, cleanCup: 8.0, body: 8.2, flavor: 7.5 }, isManualTotal: false, totalScore: 0, notes: "아몬드, 초콜릿, 카라멜", desc: "고소함이 지배적이며, 식었을 때 단맛이 올라온다.", memo: "자동 머신으로 추출" }] },
        { id: `demo_${Date.now() + 3}`, name: "스타벅스 오늘의 커피", shop: "스타벅스", pricePerCup: "4200", weight: "", purchaseDate: d(2), notes: "무난한 맛, 약간의 스모키함", isFinished: false, isBlend: true, tastings: [{ date: d(2), scores: { acidity: 6.5, balance: 7.0, sweetness: 6.5, cleanCup: 7.0, body: 7.5, flavor: 6.5 }, isManualTotal: true, totalScore: "7.0", notes: "스모키, 탄맛", desc: "진하고 무난한 맛.", memo: "" }] },
        { id: `demo_${Date.now() + 4}`, name: "블루보틀 놀라 플로트", shop: "블루보틀", pricePerCup: "7500", weight: "", purchaseDate: d(1), notes: "달콤한 라떼, 아이스크림", isFinished: false, isBlend: true, tastings: [] }
    ];
};