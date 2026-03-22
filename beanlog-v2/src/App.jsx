import React, { useState, useEffect } from 'react';
import { Timer, LayoutDashboard, Settings } from 'lucide-react';
import { CustomBeanIcon } from './Icons';
import { PWASetup } from './PWASetup';
import { BeansTab } from './BeansTab';
import { TimerTab } from './TimerTab';
import { StatsTab } from './StatsTab';
import { SettingsTab } from './SettingsTab';
import { TAB, STORAGE_KEY } from './constants';
import { idb, migrateStorage, getDemoData } from './utils';

function App() {
    const [tab, setTab] = useState(TAB.BEANS);
    const [apiKey, setApiKey] = useState("");
    const [navKey, setNavKey] = useState(0);
    const [navProps, setNavProps] = useState(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [toast, setToast] = useState(null);
    const [theme, setTheme] = useState('SYSTEM');

    useEffect(() => {
        const root = window.document.documentElement;
        const apply = () => {
            const isDark = theme === 'DARK' || (theme === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (isDark) { root.classList.add('dark'); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a'); }
            else { root.classList.remove('dark'); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff'); }
        };
        apply();
        if (theme === 'SYSTEM') { const mq = window.matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', apply); return () => mq.removeEventListener('change', apply); }
    }, [theme]);

    const toggleTheme = () => { const modes = ['LIGHT', 'DARK', 'SYSTEM']; const next = modes[(modes.indexOf(theme) + 1) % modes.length]; setTheme(next); idb.set(`${STORAGE_KEY}_theme`, next); showToastMsg(`테마 변경: ${next === 'SYSTEM' ? '시스템 설정' : (next === 'DARK' ? '다크 모드' : '라이트 모드')}`); };
    const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const loadDemoData = async () => {
        if (confirm("데모 데이터를 추가하시겠습니까? 기존 데이터에 데모용 원두와 시음 기록이 추가됩니다.")) {
            const existingData = await idb.get(`${STORAGE_KEY}_data`) || [];
            const demoData = getDemoData();
            const nonDemoData = existingData.filter(item => !String(item.id).startsWith('demo_'));
            const newData = [...demoData, ...nonDemoData];
            if (await idb.set(`${STORAGE_KEY}_data`, newData)) { showToastMsg("데모 데이터 적용 완료! 앱을 새로고침합니다."); setTimeout(() => window.location.reload(), 1500); } else { showToastMsg("데이터 저장에 실패했습니다."); }
        }
    };

    useEffect(() => { migrateStorage(); idb.get(`${STORAGE_KEY}_key`).then(k => { if (k) setApiKey(k); }); idb.get(`${STORAGE_KEY}_theme`).then(t => { if (t) setTheme(t); }); }, []);

    const updateTab = (newTab) => { if (newTab === TAB.TIMER && isTimerRunning) { window.history.pushState({ tab: TAB.TIMER, mode: 'TIMER' }, ''); setTab(newTab); return; } const newState = { tab: newTab }; if (newTab === TAB.BEANS) { newState.view = 'LIST'; newState.id = null; } else if (newTab === TAB.TIMER) { newState.mode = 'EDIT'; } window.history.pushState(newState, ''); setNavKey(prev => prev + 1); setTab(newTab); };
    const handleNavigateToTasting = (beanId, tasting) => { const view = tasting ? 'EDIT_TASTING' : 'DETAIL'; window.history.pushState({ tab: TAB.BEANS, view: view, id: beanId }, ''); setNavProps({ view: view, beanId: beanId, tasting: tasting }); setTab(TAB.BEANS); };

    useEffect(() => { const handlePop = (event) => { if(event.state && event.state.tab) { setTab(event.state.tab); } else { setTab(TAB.BEANS); } }; window.addEventListener('popstate', handlePop); return () => window.removeEventListener('popstate', handlePop); }, []);

    return (
        <div className="h-[100dvh] flex flex-col bg-white dark:bg-slate-900 max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-300">
            <PWASetup />
            {toast && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl z-[120] whitespace-nowrap animate-in fade-in slide-in-from-top-2">{toast}</div>}
            <div className="flex-1 overflow-hidden relative"><BeansTab active={tab === TAB.BEANS} globalApiKey={apiKey} navProps={navProps} onNavConsumed={() => setNavProps(null)} navKey={navKey} /><TimerTab active={tab === TAB.TIMER} setIsTimerRunning={setIsTimerRunning} navKey={navKey} /><StatsTab active={tab === TAB.STATS} onNavigateToBean={handleNavigateToTasting} navKey={navKey} /><SettingsTab active={tab === TAB.SETTINGS} apiKey={apiKey} setApiKey={setApiKey} showToastMsg={showToastMsg} theme={theme} onToggleTheme={toggleTheme} onLoadDemoData={loadDemoData} /></div>
            <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 z-[50] h-[50px] px-6 transition-colors duration-300">
                <button onClick={() => updateTab(TAB.BEANS)} className={`flex items-center justify-center w-full h-full gap-1 transition-colors ${tab === TAB.BEANS ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'}`}><CustomBeanIcon size={20} className={tab === TAB.BEANS ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'} /></button>
                <button onClick={() => updateTab(TAB.TIMER)} className={`flex items-center justify-center w-full h-full gap-1 transition-colors relative ${tab === TAB.TIMER ? 'text-blue-500' : 'text-slate-300'}`}><Timer size={20} strokeWidth={tab === TAB.TIMER ? 2.5 : 2} />{isTimerRunning && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>}</button>
                <button onClick={() => updateTab(TAB.STATS)} className={`flex items-center justify-center w-full h-full gap-1 transition-colors ${tab === TAB.STATS ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'}`}><LayoutDashboard size={20} strokeWidth={tab === TAB.STATS ? 2.5 : 2} /></button>
                <button onClick={() => updateTab(TAB.SETTINGS)} className={`flex items-center justify-center w-full h-full gap-1 transition-colors ${tab === TAB.SETTINGS ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'}`}><Settings size={20} strokeWidth={tab === TAB.SETTINGS ? 2.5 : 2} /></button>
            </div>
        </div>
    );
}

export default App
