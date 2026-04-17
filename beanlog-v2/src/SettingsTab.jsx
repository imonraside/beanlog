import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Sparkles, Download, Upload, Trash2, HelpCircle, RefreshCw, Smartphone, Cloud, X, Unplug } from 'lucide-react';
import { STORAGE_KEY, RECIPE_STORAGE_KEY, APP_VERSION } from './constants';
import { idb } from './utils';

export const SettingsTab = ({ active, apiKey, setApiKey, showToastMsg, theme, onToggleTheme, onLoadDemoData }) => {
    const [isDriveReady, setIsDriveReady] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [autoBackup, setAutoBackup] = useState(false);
    const [backupFiles, setBackupFiles] = useState([]);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        idb.get(`${STORAGE_KEY}_auto_backup`).then(val => setAutoBackup(!!val));
    }, []);

    useEffect(() => {
        const loadGapi = () => new Promise((resolve) => {
            if (window.gapi) return resolve();
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => window.gapi.load('client', resolve);
            document.body.appendChild(script);
        });

        const loadGis = () => new Promise((resolve) => {
            if (window.google?.accounts) return resolve();
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            document.body.appendChild(script);
        });

        Promise.all([loadGapi(), loadGis()]).then(async () => {
            try {
                await window.gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
                setIsDriveReady(true);
            } catch (e) {
                console.error("Google API Init Error:", e);
            }
        });
    }, []);

    const getDriveFiles = async () => {
        const res = await window.gapi.client.drive.files.list({ q: "name contains 'beanlog_backup' and trashed=false", spaces: 'drive', fields: 'files(id, name, modifiedTime, size)', orderBy: 'modifiedTime desc' });
        return res.result.files || [];
    };

    const withDriveAuth = (callback) => {
        if (!isDriveReady) return showToastMsg("구글 드라이브 연동 준비 중입니다. 잠시 후 다시 시도해주세요.");
        const token = window.gapi.client.getToken();
        if (token !== null) { callback(); } else {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: '630876320928-07la4ho6khne02ruqtjhnm6vqvfris9a.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (response) => { if (response.error !== undefined) { showToastMsg("드라이브 연동에 실패했습니다."); throw response; } callback(); },
            });
            client.requestAccessToken();
        }
    };

    const performDriveBackup = async (isSilent = false) => {
        if (!isSilent) { setIsSyncing(true); showToastMsg("구글 드라이브에 백업 중..."); }
        try {
            const data = { beans: await idb.get(`${STORAGE_KEY}_data`), recipes: await idb.get(RECIPE_STORAGE_KEY), key: await idb.get(`${STORAGE_KEY}_key`) };
            const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const metadata = { name: `beanlog_backup_${timestamp}.json`, mimeType: 'application/json' };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);
            
            const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            // keepalive: true 옵션으로 앱이 닫히는 순간에도 요청이 완수되도록 브라우저에 위임합니다.
            const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` }, body: form, keepalive: isSilent });
            if (!res.ok) throw new Error("Upload failed");
            
            // 최신 5개 파일만 남기고 이전 백업본 삭제
            const listRes = await window.gapi.client.drive.files.list({ q: "name contains 'beanlog_backup' and trashed=false", spaces: 'drive', fields: 'files(id)', orderBy: 'modifiedTime desc' });
            const files = listRes.result.files || [];
            if (files.length > 5) {
                await Promise.all(files.slice(5).map(f => window.gapi.client.drive.files.delete({ fileId: f.id })));
            }
            
            localStorage.setItem(`${STORAGE_KEY}_last_auto_backup_date`, new Date().toDateString());
            if (!isSilent) showToastMsg("백업 완료! (최근 5개 유지)");
        } catch (e) { 
            console.error(e); 
            if (!isSilent) showToastMsg("백업에 실패했습니다."); 
        } finally { 
            if (!isSilent) setIsSyncing(false); 
        }
    };

    const handleDriveBackup = () => {
        withDriveAuth(() => performDriveBackup(false));
    };

    const toggleAutoBackup = () => {
        const nextVal = !autoBackup;
        if (nextVal) {
            withDriveAuth(async () => { setAutoBackup(true); await idb.set(`${STORAGE_KEY}_auto_backup`, true); showToastMsg("자동 백업이 활성화되었습니다."); });
        } else {
            setAutoBackup(false); idb.set(`${STORAGE_KEY}_auto_backup`, false); showToastMsg("자동 백업이 비활성화되었습니다.");
        }
    };

    const handleDriveDisconnect = () => {
        if (!confirm("구글 드라이브 연동을 해제하시겠습니까?\n자동 백업도 함께 꺼집니다.")) return;
        
        const token = window.gapi?.client?.getToken();
        if (token) {
            window.google?.accounts?.oauth2?.revoke(token.access_token, () => {
                window.gapi.client.setToken('');
            });
        }
        setAutoBackup(false);
        idb.set(`${STORAGE_KEY}_auto_backup`, false);
        showToastMsg("구글 드라이브 연동이 해제되었습니다.");
    };

    useEffect(() => {
        const handleVisibilityChange = () => { 
            if (document.visibilityState === 'hidden' && autoBackup && isDriveReady && window.gapi?.client?.getToken()) {
                if (localStorage.getItem(`${STORAGE_KEY}_last_auto_backup_date`) !== new Date().toDateString()) {
                    performDriveBackup(true);
                }
            } 
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [autoBackup, isDriveReady]);

    const handleDriveRestoreClick = () => {
        withDriveAuth(async () => {
            setIsSyncing(true); showToastMsg("백업 목록을 불러오는 중...");
            try {
                const files = await getDriveFiles();
                if (!files || files.length === 0) { showToastMsg("백업 파일이 없습니다."); setIsSyncing(false); return; }
                setBackupFiles(files);
                setShowRestoreModal(true);
            } catch (e) { console.error(e); showToastMsg("목록을 불러오는데 실패했습니다."); } finally { setIsSyncing(false); }
        });
    };

    const performRestore = async (file) => {
        if (!confirm(`선택한 백업 파일(${new Date(file.modifiedTime).toLocaleString()})로 복원하시겠습니까?\n현재 데이터는 모두 덮어씌워집니다.`)) return;
        setShowRestoreModal(false);
        setIsSyncing(true); showToastMsg("데이터 복원 중...");
        try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, { headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` } });
            if (!res.ok) throw new Error("Download failed");
            const d = await res.json();
            if (d.beans) { await idb.set(`${STORAGE_KEY}_data`, d.beans); } if (d.recipes) { await idb.set(RECIPE_STORAGE_KEY, d.recipes); } if (d.key) { await idb.set(`${STORAGE_KEY}_key`, d.key); setApiKey(d.key); }
            showToastMsg("복원 완료! 앱을 새로고침합니다."); setTimeout(() => location.reload(), 1500);
        } catch (e) { console.error(e); showToastMsg("복원에 실패했습니다."); } finally { setIsSyncing(false); }
    };

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
            {showRestoreModal && (
                <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowRestoreModal(false)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-pop flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">복원할 백업 선택</h3>
                            <button onClick={() => setShowRestoreModal(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><X size={18}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {backupFiles.map((file, idx) => (
                                <button key={file.id} onClick={() => performRestore(file)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-blue-200 dark:hover:border-slate-600 flex items-center justify-between group">
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{new Date(file.modifiedTime).toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">용량: {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '알 수 없음'} {idx === 0 && <span className="ml-2 text-blue-500 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">최신</span>}</div>
                                    </div>
                                    <Download size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Gemini API Key</label><input type="password" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none" value={apiKey} onChange={e=>{setApiKey(e.target.value); idb.set(`${STORAGE_KEY}_key`,e.target.value);}} placeholder="API Key 입력"/></div>
                <div className="pt-8 border-t dark:border-slate-800 space-y-3">
                    <h3 className="font-bold text-sm">데이터 관리</h3>
                    <button onClick={onLoadDemoData} className="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2"><Sparkles size={18}/> 데모 데이터 적용</button>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <button onClick={handleDriveBackup} disabled={isSyncing} className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                            {isSyncing ? <RefreshCw className="animate-spin" size={18}/> : <Cloud size={18}/>} 
                            <span className="text-xs">드라이브 백업</span>
                        </button>
                        <button onClick={handleDriveRestoreClick} disabled={isSyncing} className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                            {isSyncing ? <RefreshCw className="animate-spin" size={18}/> : <Cloud size={18}/>} 
                            <span className="text-xs">드라이브 복원</span>
                        </button>
                        <label className="relative py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                            <RefreshCw size={18}/>
                            <span className="text-xs">자동 백업</span>
                            <input type="checkbox" checked={autoBackup} onChange={toggleAutoBackup} className="absolute right-4 w-5 h-5 accent-blue-600 cursor-pointer" />
                        </label>
                        <button onClick={handleDriveDisconnect} className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2">
                            <Unplug size={18}/>
                            <span className="text-xs">연동 해제</span>
                        </button>
                        <button onClick={backup} className="py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl flex items-center justify-center gap-2"><Download size={18}/> <span className="text-xs">기기 백업</span></button>
                        <div className="relative"><input type="file" onChange={restore} className="hidden" id="rFile" accept=".json" /><label htmlFor="rFile" className="w-full h-full py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"><Upload size={18}/> <span className="text-xs">기기 복원</span></label></div>
                    </div>
                    <button onClick={reset} className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-2xl mt-4 flex items-center justify-center gap-2"><Trash2 size={18}/> 초기화</button>
                </div>
                <div className="pt-8 border-t dark:border-slate-800 space-y-3"><h3 className="font-bold text-sm">앱 관리</h3><button onClick={handleInstallApp} className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-2"><Smartphone size={18}/> 홈 화면에 앱 설치하기</button><a href="https://imonraside.github.io/beanlog/guide/" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-2xl flex items-center justify-center gap-2"><HelpCircle size={18}/> 도움말 & 가이드</a><button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2"><RefreshCw size={18}/> 앱 새로고침</button></div>
                <div className="pt-10 text-center"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">BeanLog {APP_VERSION}</p></div>
            </div>
        </div>
    );
};