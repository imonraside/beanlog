import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { List, StickyNote, Settings, Plus, X, Trash2, Calculator, Droplet, Save, Play, Pause, RefreshCw, Clock, ToggleRight, Utensils, Waves, RefreshCcw, Tornado, Target, Check, Timer } from 'lucide-react';
import { CustomBeanIcon } from './Icons';
import { INITIAL_RECIPE, RECIPE_STORAGE_KEY, TAB } from './constants';
import { formatTime, calculateRatio, idb } from './utils';

const MiniIcon = ({ iconType, isMain }) => {
    let IconComp = Droplet; let colorClass = "text-slate-400";
    if (iconType === 'BEAN') return <div className={`flex items-center justify-center ${isMain?'w-8 h-8 bg-amber-100 shadow-sm rounded-full border border-amber-200':'w-6 h-6'}`}><CustomBeanIcon size={isMain?20:16} className="text-amber-700"/></div>;
    switch (iconType) { case 'CLOSE': IconComp = ToggleRight; colorClass = "text-orange-500 rotate-180"; break; case 'OPEN': IconComp = ToggleRight; colorClass = "text-orange-500"; break; case 'STIR': IconComp = Utensils; colorClass = "text-purple-500"; break; case 'SWIRL': IconComp = Waves; colorClass = "text-purple-500"; break; case 'CIRCLE': IconComp = RefreshCcw; colorClass = "text-blue-500"; break; case 'SPIRAL': IconComp = Tornado; colorClass = "text-blue-500"; break; case 'CENTER': IconComp = Target; colorClass = "text-blue-500"; break; case 'POUR': IconComp = Droplet; colorClass = "text-blue-500"; break; case 'CLOCK': IconComp = Clock; colorClass = "text-slate-400"; break; case 'CHECK': IconComp = Check; colorClass = "text-green-500"; break; default: IconComp = Play; }
    return <div className={`flex items-center justify-center ${isMain?'w-8 h-8 bg-white shadow-sm rounded-full border border-slate-100':'w-6 h-6'}`}><IconComp size={isMain?18:14} className={colorClass} strokeWidth={isMain?2.5:2} /></div>;
};

const TimerStepRow = ({ step, isCurrent, isPast, itemRef }) => (
    <div ref={itemRef} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 cursor-pointer ${isCurrent ? `bg-white dark:bg-slate-900 shadow-xl step-active border-l-8 dark:border-slate-800` : (isPast ? 'bg-slate-100 dark:bg-slate-800 opacity-60 grayscale border-transparent step-inactive' : 'bg-white dark:bg-slate-900 border-transparent opacity-70')}`}>
        <div className={`rounded-xl p-1.5 flex items-center gap-1 border shrink-0 min-w-[60px] justify-center transition-colors ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>{step.icons && step.icons.length > 0 ? step.icons.map((item, idx) => <MiniIcon key={idx} iconType={item.icon} isMain={item.type === 'MAIN'} />) : <Clock size={16} className="text-slate-300"/>}</div>
        <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-0.5"><span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-blue-500' : 'text-slate-400'}`}>{step.originalCmd || 'STEP'}</span><span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded">{step.timeRange}</span></div><h3 className={`text-base font-bold leading-tight break-keep flex flex-wrap items-baseline gap-1 ${isCurrent ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'}`}><span>{step.desc}</span>{step.cumWater && (<span className="text-xs text-blue-500 font-medium whitespace-nowrap ml-1">(누적 {step.cumWater}ml{step.pourCount ? ` • ${step.pourCount}차 푸어` : ''})</span>)}</h3></div>
    </div>
);

const parseStepCommand = (inputStr) => {
    const lower = inputStr.toLowerCase().trim(); const numMatch = lower.match(/(\d+(?:\.\d+)?)/); const value = numMatch ? parseFloat(numMatch[0]) : null;
    let prefixStr = "", suffixStr = "";
    if (value !== null) { const numIndex = lower.indexOf(numMatch[0]); prefixStr = lower.substring(0, numIndex); suffixStr = lower.substring(numIndex + numMatch[0].length); } else { prefixStr = lower; }
    const dict = { pre: { cl: { text: "스위치 닫고", icon: 'CLOSE' }, op: { text: "스위치 열고", icon: 'OPEN' }, st: { text: "젓고", icon: 'STIR' }, sw: { text: "흔들고", icon: 'SWIRL' } }, post: { cl: { text: "스위치 닫기", icon: 'CLOSE' }, op: { text: "스위치 열기", icon: 'OPEN' }, st: { text: "젓기", icon: 'STIR' }, sw: { text: "흔들기", icon: 'SWIRL' } }, style: { c: { text: "Circle", icon: 'CIRCLE' }, s: { text: "Spiral", icon: 'SPIRAL' }, ct: { text: "Center", icon: 'CENTER' }, k: { text: "Center", icon: 'CENTER' } } };
    const analyze = (str, type) => { let temp = str, items = [], foundStyle = null; ['cl', 'op', 'st', 'sw'].forEach(key => { if (temp.includes(key)) { items.push({ ...dict[type][key], key }); temp = temp.replace(key, ''); } }); if (temp.includes('ct') || temp.includes('k')) { foundStyle = dict.style.ct; } else if (temp.includes('s')) { foundStyle = dict.style.s; } else if (temp.includes('c')) { foundStyle = dict.style.c; } return { items, foundStyle }; };
    const pre = analyze(prefixStr, 'pre'), suf = analyze(suffixStr, 'post'); let sentenceParts = [], icons = [];
    pre.items.forEach(item => { let text = item.text; if (value === null && dict.post[item.key]) text = dict.post[item.key].text; sentenceParts.push(text); icons.push({ type: 'PRE', icon: item.icon }); });
    const appliedStyle = pre.foundStyle || suf.foundStyle; let stepMeta = { value: null, isBean: false };
    if (value !== null) { const isBean = lower.includes('g') && !lower.includes('ml'); stepMeta = { value, isBean }; if (isBean) { sentenceParts.push(`+ 원두 ${value}g`); icons.push({ type: 'MAIN', icon: 'BEAN' }); } else { let pourText = `+${value}ml`; if (appliedStyle) pourText += ` (${appliedStyle.text})`; sentenceParts.push(pourText); icons.push({ type: 'MAIN', icon: appliedStyle ? appliedStyle.icon : 'POUR' }); } }
    if (suf.items.length > 0) { if (sentenceParts.length > 0) sentenceParts.push("후"); suf.items.forEach(item => { sentenceParts.push(item.text); icons.push({ type: 'POST', icon: item.icon }); }); }
    return { fullText: sentenceParts.join(' '), icons, stepMeta };
};

const parseRecipe = (data) => {
    const waterSteps = data.water.trim().split(/\s+/), intervalSteps = data.interval.trim().split(/\s+/);
    const [min, sec] = data.endTime.includes(':') ? data.endTime.split(':').map(Number) : [0, parseInt(data.endTime)];
    const totalSec = min * 60 + sec; let accTime = 0, cumWater = 0; const timeline = []; let pourCounter = 0;
    waterSteps.forEach((stepToken, i) => {
        let duration = parseInt(intervalSteps[i] || 0);
        if (i === waterSteps.length - 1 || isNaN(duration) || duration === 0) { const remaining = totalSec - accTime; duration = remaining > 0 ? remaining : 0; }
        const startTime = accTime, endTimeStr = formatTime(accTime + duration), timeRange = `${formatTime(startTime)} ~ ${endTimeStr}`;
        const { fullText, icons, stepMeta } = parseStepCommand(stepToken);
        let currentCumWater = null; let currentPourCount = null;
        if (stepMeta.value && !stepMeta.isBean) { cumWater += stepMeta.value; currentCumWater = cumWater; pourCounter++; currentPourCount = pourCounter; }
        timeline.push({ startTime, duration, timeRange, desc: fullText || stepToken, icons, originalCmd: stepToken, cumWater: currentCumWater, pourCount: currentPourCount });
        accTime += duration;
    });
    if (accTime < totalSec) timeline.push({ startTime: accTime, duration: totalSec - accTime, timeRange: `${formatTime(accTime)} ~ ${formatTime(totalSec)}`, desc: '추출 대기 (Drawdown)', icons: [{ type: 'MAIN', icon: 'CLOCK' }] });
    timeline.push({ startTime: totalSec, timeRange: formatTime(totalSec), desc: '추출 종료 (Finish)', duration: 0, icons: [{ type: 'MAIN', icon: 'CHECK' }] });
    return timeline;
};

export const TimerTab = ({ active, setIsTimerRunning, navKey }) => { 
    const DEFAULT_RECIPES = [
        { id: 1, title: "기본 푸어 오버 20g", bean: "20", water: "60 80 80 80", interval: "30 30 30", endTime: "3:00", memo: "물 온도는 93도가 적당합니다.\n뜸 들이기는 30초 정도 진행해주세요." },
        { id: 2, title: "10g 푸어오버", bean: "10", water: "30 40 40 40", interval: "30 30 30", endTime: "2:10", memo: "" },
        { id: 3, title: "스위치 10g", bean: "10", water: "cl150 10g op", interval: "20 120", endTime: "3:20", memo: "스위치를 닫고 물을 한 번에 붓습니다." },
        { id: 4, title: "스위치 리버스 15g", bean: "15", water: "cl30 15g 30 op 170", interval: "30 30 30 10", endTime: "3:00", memo: "침출식과 투과식을 혼합한 방식입니다." },
        { id: 5, title: "데모용", bean: "15", water: "cl30 15g s30st op ct170sw sw", interval: "3 3 3 3 3", endTime: "0:20", memo: "다양한 사용 예시 레시피입니다." }
    ];

    const [mode, setMode] = useState('EDIT'); 
    const [recipe, setRecipe] = useState({...INITIAL_RECIPE});
    const [recipes, setRecipes] = useState(DEFAULT_RECIPES);
    const [showList, setShowList] = useState(false);
    const [showMemo, setShowMemo] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [time, setTime] = useState(0);
    const [run, setRun] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);
    const scrollRef = useRef(null), itemRefs = useRef([]);
    
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    useEffect(() => { if (active) { idb.get(RECIPE_STORAGE_KEY).then(r => { if(r && Array.isArray(r) && r.length > 0) setRecipes(r); else setRecipes(DEFAULT_RECIPES); }); } }, [active]);
    useEffect(() => { setIsTimerRunning(run); }, [run, setIsTimerRunning]);

    const openRecipeList = () => { window.history.pushState({ tab: TAB.TIMER, modal: 'LIST' }, ''); setShowList(true); };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (active && !run) openRecipeList(); }, [active, navKey]);

    const openMemo = () => { window.history.pushState({ tab: TAB.TIMER, modal: 'MEMO' }, ''); setShowMemo(true); };
    const handleSettingClick = () => { setRun(false); setMode('EDIT'); window.history.replaceState({ tab: TAB.TIMER, mode: 'EDIT' }, ''); };

    useEffect(() => {
        const handlePop = (event) => {
            if(!active) return;
            const modal = event.state ? event.state.modal : null;
            setShowList(modal === 'LIST'); setShowMemo(modal === 'MEMO'); setShowSaveModal(modal === 'SAVE'); setShowDeleteModal(modal === 'DELETE');
            if (mode === 'TIMER') { if (!event.state || event.state.mode !== 'TIMER') { setMode('EDIT'); setRun(false); } }
        };
        window.addEventListener('popstate', handlePop); return () => window.removeEventListener('popstate', handlePop);
    }, [active, mode]);

    useEffect(() => {
        let wakeLock = null;
        const requestWakeLock = async () => { if ('wakeLock' in navigator) { try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) { console.log('Wake Lock Error:', err); } } };
        const releaseWakeLock = async () => { if (wakeLock !== null) { await wakeLock.release(); wakeLock = null; } };
        if (active && mode === 'TIMER') { requestWakeLock(); } else { releaseWakeLock(); }
        return () => { releaseWakeLock(); };
    }, [active, mode]); 

    useEffect(() => { let i; if(run) i = setInterval(() => setTime(p=>{ if(p>=timeline[timeline.length-1]?.startTime){setRun(false);return p;} return p+1; }), 1000); return ()=>clearInterval(i); }, [run, timeline]);
    
    const scrollToStep = (index) => { const list = scrollRef.current; if (!list) return; if (index === 0) { list.scrollTo({ top: 0, behavior: 'smooth' }); return; } const item = itemRefs.current[index]; if (item) { const containerHeight = list.clientHeight; const itemHeight = item.clientHeight; const targetTop = item.offsetTop - (containerHeight / 2) + (itemHeight / 2); list.scrollTo({ top: targetTop, behavior: 'smooth' }); } };
    useLayoutEffect(() => { if (active && mode === 'TIMER') { scrollToStep(stepIdx); } }, [stepIdx, mode, active]);
    useEffect(() => { if(mode==='TIMER') { const idx = timeline.findLastIndex(s=>s.startTime<=time); if(idx!==-1) setStepIdx(idx); } }, [time, mode]);

    const handleSaveRequest = () => { if (!recipe.title?.trim()) { showToastMsg("빈칸을 입력해주세요"); return; } window.history.pushState({ tab: TAB.TIMER, modal: 'SAVE' }, ''); setShowSaveModal(true); };
    const confirmSave = async (isOverwrite) => { let updatedRecipes; if (isOverwrite && recipe.id) { updatedRecipes = recipes.map(r => r.id === recipe.id ? recipe : r); } else { updatedRecipes = [...recipes, { ...recipe, id: Date.now() }]; } setRecipes(updatedRecipes); await idb.set(RECIPE_STORAGE_KEY, updatedRecipes); window.history.back(); };
    const loadR = (r) => { setRecipe(r); if (mode === 'TIMER') { setTimeline(parseRecipe(r)); setTime(0); setRun(false); setStepIdx(0); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); } if (showList) window.history.back(); };
    const handleDelRequest = (id, e) => { e.stopPropagation(); setDeleteTargetId(id); window.history.pushState({ tab: TAB.TIMER, modal: 'DELETE' }, ''); setShowDeleteModal(true); };
    const confirmDelete = async () => { if (deleteTargetId) { const n = recipes.filter(r => r.id !== deleteTargetId); setRecipes(n); await idb.set(RECIPE_STORAGE_KEY, n); } window.history.back(); };
    const startBrewing = () => { if (!recipe.title?.trim() || !recipe.bean?.trim() || !recipe.water?.trim() || !recipe.interval?.trim() || !recipe.endTime?.trim()) { showToastMsg("빈칸을 입력해주세요"); return; } const newTimeline = parseRecipe(recipe); setTimeline(newTimeline); window.history.pushState({ tab: TAB.TIMER, mode: 'TIMER' }, ''); setMode('TIMER'); setTime(0); setRun(false); setStepIdx(0); };
    const handleReset = () => { setRun(false); setTime(0); setStepIdx(0); if (scrollRef.current) { scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); } };
    const toggleRun = () => { if (!run && time === 0) { if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); } setRun(!run); };
    
    const curStep = timeline[stepIdx] || {};
    const curRatio = useMemo(()=>calculateRatio(recipe.bean, recipe.water),[recipe.bean,recipe.water]);

    return (
        <div className={`h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative ${active ? 'block' : 'hidden'}`}>
            {toast && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl z-[120] whitespace-nowrap animate-in fade-in slide-in-from-top-2">{toast}</div>}
            {showSaveModal && (<div className="absolute inset-0 z-[110] bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => window.history.back()}><div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-5 shadow-xl animate-pop" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">레시피 저장</h3><div className="flex flex-col gap-2">{recipe.id && (<button onClick={() => confirmSave(true)} className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30">기존 레시피 덮어쓰기</button>)}<button onClick={() => confirmSave(false)} className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200">새 레시피로 저장</button><button onClick={() => window.history.back()} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-300">취소</button></div></div></div>)}
            {showDeleteModal && (<div className="absolute inset-0 z-[110] bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => window.history.back()}><div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-5 shadow-xl animate-pop" onClick={e => e.stopPropagation()}><div className="flex flex-col items-center gap-2 mb-4"><div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center"><Trash2 size={20} /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white">레시피 삭제</h3><p className="text-sm text-slate-500 dark:text-slate-400 text-center">이 레시피를 정말 삭제하시겠습니까?<br/>삭제된 데이터는 복구할 수 없습니다.</p></div><div className="flex gap-2"><button onClick={() => window.history.back()} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700">취소</button><button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 dark:bg-red-600 text-white rounded-xl font-bold hover:bg-red-600 dark:hover:bg-red-700">삭제</button></div></div></div>)}
            {showList && (<div className="absolute inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-end" onClick={()=>window.history.back()}><div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl h-[85%] p-5 flex flex-col animate-slide-up" onClick={e=>e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg dark:text-white">Saved Recipes</h2><div className="flex items-center gap-3"><button onClick={() => { setRecipe({...INITIAL_RECIPE, id: Date.now()}); setRun(false); setMode('EDIT'); window.history.back(); }} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold flex items-center gap-1"><Plus size={14}/> NEW</button><X onClick={()=>window.history.back()} className="cursor-pointer text-slate-400"/></div></div><div className="flex-1 overflow-y-auto space-y-3 pb-10">{recipes.map(r=>(<div key={r.id} onClick={()=>loadR(r)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between items-center active:scale-95 transition-transform cursor-pointer"><div className="flex items-center gap-3"><div><h3 className="font-bold dark:text-white">{r.title}</h3><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><CustomBeanIcon size={10} className="text-amber-700 dark:text-amber-500"/> {r.bean}g <span className="text-slate-300 dark:text-slate-600">·</span> <Calculator size={10} className="text-orange-400"/> {calculateRatio(r.bean, r.water)} <Droplet size={10} className="text-blue-400 ml-1"/> {r.water}</span></div></div><button onClick={(e)=>handleDelRequest(r.id,e)} className="p-2"><Trash2 size={16} className="text-slate-300 hover:text-red-500"/></button></div>))}</div></div></div>)}
            
            <header className="p-4 pt-4 flex justify-between items-center bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10"><h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Timer className="text-blue-500"/> Brewing Timer</h1><div className="flex gap-2"><button onClick={openRecipeList} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><List size={18}/></button>{mode==='TIMER' && <><button onClick={openMemo} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-amber-500"><StickyNote size={18}/></button><button onClick={handleSettingClick} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><Settings size={18}/></button></>}{mode==='EDIT' && <button onClick={()=>setRecipe({...INITIAL_RECIPE, id: Date.now()})} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-blue-500 dark:text-blue-400 font-bold text-xs flex items-center gap-1"><Plus size={14}/> NEW</button>}</div></header>

            {mode === 'EDIT' && (<div className="flex-1 overflow-y-auto p-6 pb-24 space-y-4"><div className="mb-2"><div className="flex justify-between items-end mb-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Name</label><span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg flex items-center gap-1"><Calculator size={12}/> {curRatio}</span></div><input className="w-full text-2xl font-bold font-brand bg-slate-100 dark:bg-slate-800 dark:text-white rounded-xl p-3 outline-none" value={recipe.title} onChange={e=>setRecipe({...recipe,title:e.target.value})} placeholder="레시피 이름"/></div><div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">원두 (g)</label><input className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl font-bold outline-none border border-transparent focus:border-blue-200" value={recipe.bean} onChange={e=>setRecipe({...recipe,bean:e.target.value})}/></div><div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">물/명령어 (ex: cl 60 sw)</label><input className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl font-bold outline-none border border-transparent focus:border-blue-200" value={recipe.water} onChange={e=>setRecipe({...recipe,water:e.target.value})}/><div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 mt-2"><h4 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-1">Command Guide</h4><div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium"><div className="flex items-center gap-1"><Droplet size={11} className="text-blue-400"/> <span className="text-slate-800 dark:text-slate-200 font-bold">60</span> : 물 60ml</div><div className="flex items-center gap-1"><CustomBeanIcon size={11} className="text-amber-700 dark:text-amber-500"/> <span className="text-slate-800 dark:text-slate-200 font-bold">20g</span> : 원두 20g</div><div>🔒 <span className="text-slate-800 dark:text-slate-200 font-bold">cl</span> : 스위치 닫기</div><div>🔓 <span className="text-slate-800 dark:text-slate-200 font-bold">op</span> : 스위치 열기</div><div>🥄 <span className="text-slate-800 dark:text-slate-200 font-bold">st</span> : 젓기</div><div>👋 <span className="text-slate-800 dark:text-slate-200 font-bold">sw</span> : 흔들기</div><div>⭕ <span className="text-slate-800 dark:text-slate-200 font-bold">c</span> : 원형 푸어</div><div>🌀 <span className="text-slate-800 dark:text-slate-200 font-bold">s</span> : 나선 푸어</div><div>🎯 <span className="text-slate-800 dark:text-slate-200 font-bold">ct</span> : 중앙 푸어</div></div><div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">✨ <b>조합 예시:</b> cl60sw <span className="text-blue-400 text-[10px]">(닫고 60ml 붓고 흔들기)</span></div></div></div><div className="flex gap-2"><div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">간격 (초)</label><input className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl font-bold outline-none border border-transparent focus:border-blue-200" value={recipe.interval} onChange={e=>setRecipe({...recipe,interval:e.target.value})}/></div><div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">종료 시간</label><input className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl font-bold outline-none border border-transparent focus:border-blue-200" value={recipe.endTime} onChange={e=>setRecipe({...recipe,endTime:e.target.value})}/></div></div><textarea className="w-full bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl h-20 text-sm outline-none resize-none placeholder-amber-800/30 dark:text-amber-100" placeholder="메모" value={recipe.memo} onChange={e=>setRecipe({...recipe,memo:e.target.value})}/><div className="flex gap-2 pt-2"><button onClick={handleSaveRequest} className="flex-1 py-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-xl font-bold flex justify-center gap-2"><Save size={18}/> 레시피 저장</button></div><button onClick={startBrewing} className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-lg flex justify-center gap-2"><Play size={20} fill="currentColor"/> 타이머 시작</button></div>)}

            {mode === 'TIMER' && (<div className="flex-1 flex flex-col relative overflow-hidden"><div className="bg-white dark:bg-slate-900 p-6 pb-4 rounded-b-[32px] shadow-sm z-10 text-center relative shrink-0"> <h2 className="text-lg font-bold truncate mb-1 dark:text-white">{recipe.title}</h2><div className="text-xs font-bold text-slate-400 mb-6 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full inline-flex items-center gap-1"><CustomBeanIcon size={12} className="text-amber-700 dark:text-amber-500"/> {recipe.bean}g <span className="mx-1">·</span> <Calculator size={12} className="text-orange-400"/> {curRatio}</div><div className="flex justify-center items-center gap-6 mb-6"><button onClick={handleReset} className="w-14 h-14 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><RefreshCw size={22}/></button><span className="text-6xl font-bold font-brand tabular-nums tracking-tighter w-48 text-center dark:text-white">{formatTime(time)}</span><button onClick={toggleRun} className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${run?'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400':'bg-slate-900 dark:bg-slate-100 dark:text-slate-900'}`}>{run?<Pause size={24} fill="currentColor"/>:<Play size={24} fill="currentColor" className="ml-1"/>}</button></div><div className="w-full max-w-[320px] mx-auto bg-white dark:bg-slate-800 border-2 border-blue-500 shadow-xl rounded-2xl p-4 step-active flex items-center gap-4"><div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 flex items-center justify-center border border-blue-100 dark:border-blue-900/30 w-[70px] shrink-0 h-[70px]">{curStep.icons?.length>0?curStep.icons.map((item, idx)=><MiniIcon key={idx} iconType={item.icon} isMain={item.type==='MAIN'}/>):<Clock size={20} className="text-slate-300"/>}</div><div className="flex-1 text-center"><div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1 break-keep">{curStep.desc}</div>{curStep.cumWater && (<div className="text-sm font-bold text-blue-500 mb-1">(누적 {curStep.cumWater}ml{curStep.pourCount ? ` • ${curStep.pourCount}차 푸어` : ''})</div>)}<div className="text-xs font-bold text-slate-400">{curStep.timeRange}</div></div></div></div><div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative no-scrollbar" ref={scrollRef}><div className="px-5 pt-6 pb-32 space-y-6 relative">{timeline.map((s,i)=>(<div key={i} ref={el=>itemRefs.current[i]=el}><TimerStepRow step={s} isCurrent={i===stepIdx} isPast={i<stepIdx} /></div>))}</div></div>{showMemo && <div className="absolute inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-end" onClick={()=>window.history.back()}><div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h3 className="font-bold flex gap-2 dark:text-white"><StickyNote className="text-amber-500"/> Memo</h3><X onClick={()=>window.history.back()} className="dark:text-slate-400"/></div><div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl text-sm whitespace-pre-wrap min-h-[100px] dark:text-amber-100">{recipe.memo||"메모 없음"}</div></div></div>}</div>)}
        </div>
    );
};