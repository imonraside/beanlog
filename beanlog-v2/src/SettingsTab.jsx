import React from 'react';
import { Moon, Sun, Monitor, Sparkles, Download, Upload, Trash2, HelpCircle, RefreshCw, Smartphone } from 'lucide-react';
import { STORAGE_KEY, RECIPE_STORAGE_KEY, APP_VERSION } from './constants';
import { idb } from './utils';

export const SettingsTab = ({ active, apiKey, setApiKey, showToastMsg, theme, onToggleTheme, onLoadDemoData }) => {
    if (!active && !apiKey) return null;

    const backup = async () => { const data = { beans: await idb.get(`${STORAGE_KEY}_data`), recipes: await idb.get(RECIPE_STORAGE_KEY), key: await idb.get(`${STORAGE_KEY}_key`) }; const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})); const a = document.createElement('a'); a.href=url; a.download=`beanlog_v2_backup_${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
    const restore = (e) => { const f = e.target.files[0]; if (!f || !confirm("현재 데이터를 덮어씌웁니다. 진행할까요?")) return; const r = new FileReader(); r.onload = async (ev) => { try { const d = JSON.parse(ev.target.result); if (d.beans) { await idb.set(`${STORAGE_KEY}_data`, d.beans); showToastMsg("원두 데이터 복원 완료"); } if (d.recipes) { await idb.set(RECIPE_STORAGE_KEY, d.recipes); showToastMsg("레시피 데이터 복원 완료"); } if (d.key) { await idb.set(`${STORAGE_KEY}_key`, d.key); setApiKey(d.key); } } catch { showToastMsg("파일 오류"); } }; r.readAsText(f); };
    const reset = async () => { if (confirm("모든 데이터가 삭제됩니다. 초기화하시겠습니까?")) { await idb.del(`${STORAGE_KEY}_data`); await idb.del(RECIPE_STORAGE_KEY); await idb.del(`${STORAGE_KEY}_key`); location.reload(); } };

    const handleInstallApp = async () => { if (window.deferredPrompt) { window.deferredPrompt.prompt(); const { outcome } = await window.deferredPrompt.userChoice; if (outcome === 'accepted') { window.deferredPrompt = null; } } else { showToastMsg("주소창의 설치 아이콘(⬇️)이나 브라우저 메뉴를 이용해주세요."); } };

    const getThemeIcon = () => { if (theme === 'DARK') return <Moon size={20} />; if (theme === 'LIGHT') return <Sun size={20} />; return <Monitor size={20} />; };

    return (
        <div className={`h-full flex flex-col bg-white dark:bg-slate-900 dark:text-slate-100 ${active ? 'block' : 'hidden'}`}>
            <header className="p-4 pt-4 border-b dark:border-slate-800 flex justify-between items-center">
                <h1 className="font-black text-xl">설정</h1>
                <button onClick={onToggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{getThemeIcon()}</button>
            </header>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Gemini API Key</label><input type="password" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none" value={apiKey} onChange={e=>{setApiKey(e.target.value); idb.set(`${STORAGE_KEY}_key`,e.target.value);}} placeholder="API Key 입력"/></div>
                <div className="pt-8 border-t dark:border-slate-800 space-y-3"><h3 className="font-bold text-sm">데이터 관리</h3><button onClick={onLoadDemoData} className="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2"><Sparkles size={18}/> 데모 데이터 적용</button><button onClick={backup} className="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2"><Download size={18}/> 통합 백업</button><div className="relative"><input type="file" onChange={restore} className="hidden" id="rFile" accept="file" /><label htmlFor="rFile" className="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer"><Upload size={18}/> 복원</label></div><button onClick={reset} className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-2xl mt-4 flex items-center justify-center gap-2"><Trash2 size={18}/> 초기화</button></div>
                <div className="pt-8 border-t dark:border-slate-800 space-y-3"><h3 className="font-bold text-sm">앱 관리</h3><button onClick={handleInstallApp} className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-2"><Smartphone size={18}/> 홈 화면에 앱 설치하기</button><a href="https://imonraside.github.io/beanlog/guide/" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-2xl flex items-center justify-center gap-2"><HelpCircle size={18}/> 도움말 & 가이드</a><button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2"><RefreshCw size={18}/> 앱 새로고침</button></div>
                <div className="pt-10 text-center"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">BeanLog {APP_VERSION}</p></div>
            </div>
        </div>
    );
};