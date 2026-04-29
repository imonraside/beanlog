import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, BarChart3, CalendarDays, Clock, X, ShoppingBag, FileText, Coffee, Image as ImageIcon, LayoutDashboard, Plus, Trash2, Box } from 'lucide-react';
import { CustomBeanIcon } from './Icons';
import { ShareModal } from './ShareModal';
import { STORAGE_KEY, TAB, INITIAL_TASTING } from './constants';
import { idb, getDisplayScore, formatWeight, generateShareText } from './utils';

const GEAR_STORAGE_KEY = `${STORAGE_KEY}_gears`;

const DashboardFilter = ({ selectedYear, onSelectYear, availableYears, selectedMonth, onSelectMonth, availableMonths }) => {
    const [isYearOpen, setIsYearOpen] = useState(false); 
    const [isMonthOpen, setIsMonthOpen] = useState(false);
    
    return (
        <div className="flex gap-2 relative z-20">
            <div className="relative">
                <button 
                    onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }} 
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-2 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform"
                >
                    <span>{selectedYear === 'ALL' ? '전체 기간' : `${selectedYear}년`}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`}/>
                </button>
                {isYearOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsYearOpen(false)}></div>
                        <div className="absolute left-0 top-full mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 flex flex-col max-h-[300px] overflow-y-auto">
                            <button 
                                onClick={() => { onSelectYear('ALL'); setIsYearOpen(false); }} 
                                className={`text-left px-4 py-3 text-xs font-bold transition-colors ${selectedYear === 'ALL' ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                전체 기간
                            </button>
                            {availableYears.map(year => (
                                <button 
                                    key={year} 
                                    onClick={() => { onSelectYear(year); setIsYearOpen(false); }} 
                                    className={`text-left px-4 py-3 text-xs font-bold border-t border-slate-50 dark:border-slate-700 transition-colors ${selectedYear === year ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {year}년
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {selectedYear !== 'ALL' && (
                <div className="relative">
                    <button 
                        onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }} 
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-2 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform"
                    >
                        <span>{selectedMonth === 'ALL' ? '전체 월' : `${parseInt(selectedMonth)}월`}</span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isMonthOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    {isMonthOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMonthOpen(false)}></div>
                            <div className="absolute left-0 top-full mt-2 w-24 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 flex flex-col max-h-[300px] overflow-y-auto">
                                <button 
                                    onClick={() => { onSelectMonth('ALL'); setIsMonthOpen(false); }} 
                                    className={`text-left px-4 py-3 text-xs font-bold transition-colors ${selectedMonth === 'ALL' ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    전체 월
                                </button>
                                {availableMonths.map(month => (
                                    <button 
                                        key={month} 
                                        onClick={() => { onSelectMonth(month); setIsMonthOpen(false); }} 
                                        className={`text-left px-4 py-3 text-xs font-bold border-t border-slate-50 dark:border-slate-700 transition-colors ${selectedMonth === month ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {parseInt(month)}월
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, color, subValue, customIcon, subLabel, onClick }) => (
    <div onClick={onClick} className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} dark:bg-opacity-20`}>{customIcon}</div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
            <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
                {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
            </div>
            {subLabel && <p className="text-[9px] text-slate-400 mt-0.5">{subLabel}</p>}
        </div>
    </div>
);

const CalendarView = ({ tastingDays, purchaseDays = [], gearDays = [], onSelectDate, selectedDate, onMonthChange, viewDate }) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month), firstDay = getFirstDayOfMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1), blanks = Array.from({ length: firstDay }, (_, i) => i);
    
    const isToday = (d) => { const today = new Date(); return d === today.getDate() && month === today.getMonth() && year === today.getFullYear(); };
    const isSelected = (d) => { if (!selectedDate) return false; const target = new Date(selectedDate); return d === target.getDate() && month === target.getMonth() && year === target.getFullYear(); };
    const hasTasting = (d) => { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; return tastingDays.includes(dateStr); };
    const hasPurchase = (d) => { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; return purchaseDays.includes(dateStr); };
    const hasGear = (d) => { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; return gearDays.includes(dateStr); };
    
    const handleDateClick = (d) => { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; onSelectDate(dateStr); };
    const changeMonth = (delta) => { onMonthChange(new Date(year, month + delta, 1)); };
    const changeYear = (delta) => { onMonthChange(new Date(year + delta, month, 1)); };
    
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-1">
                    <button onClick={() => changeYear(-1)} className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-transform rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <ChevronsLeft size={20}/>
                    </button>
                    <button onClick={() => changeMonth(-1)} className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-transform rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <ChevronLeft size={20}/>
                    </button>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-brand tabular-nums">
                    {year}. {String(month + 1).padStart(2, '0')}
                </h3>
                <div className="flex items-center gap-1">
                    <button onClick={() => changeMonth(1)} className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-transform rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <ChevronRight size={20}/>
                    </button>
                    <button onClick={() => changeYear(1)} className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-transform rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <ChevronsRight size={20}/>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day,i) => (
                    <div key={day} className={`text-[9px] font-bold uppercase tracking-wider ${i===0?'text-red-400':(i===6?'text-blue-400':'text-slate-300')}`}>{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map(i => <div key={`blank-${i}`} className="aspect-square"></div>)}
                {days.map(d => (
                    <button 
                        key={d} 
                        onClick={() => handleDateClick(d)} 
                        className={`aspect-square rounded-full flex flex-col items-center justify-center relative transition-all ${isSelected(d) ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md scale-105' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} ${isToday(d) && !isSelected(d) ? 'border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold' : ''}`}
                    >
                        <span className="text-xs font-bold leading-none z-10">{d}</span>
                        <div className="flex gap-0.5 mt-1 h-1">
                            {hasTasting(d) && <span className={`w-1 h-1 rounded-full ${isSelected(d) ? 'bg-amber-400' : 'bg-amber-500'}`}></span>}
                            {hasPurchase(d) && <span className={`w-1 h-1 rounded-full ${isSelected(d) ? 'bg-blue-400' : 'bg-blue-500'}`}></span>}
                            {hasGear(d) && <span className={`w-1 h-1 rounded-full ${isSelected(d) ? 'bg-green-400' : 'bg-green-500'}`}></span>}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const StatsTab = ({ active, onNavigateToBean, navKey }) => {
    const [beans, setBeans] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState('ALL');
    const [gears, setGears] = useState([]);
    const [showGearAddPopup, setShowGearAddPopup] = useState(false);
    const [gearForm, setGearForm] = useState({ name: '', date: new Date().toISOString().split('T')[0], price: '' });
    const scrollRef = useRef(null);
    const [statDetail, setStatDetail] = useState(null);
    const [showExpenditurePopup, setShowExpenditurePopup] = useState(false);
    const [showBeanSelectPopup, setShowBeanSelectPopup] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [tastingMenuIdx, setTastingMenuIdx] = useState(null);
    const [toast, setToast] = useState(null);
    const isLongPress = useRef(false);
    const longPressTimer = useRef(null);

    useEffect(() => {
        if (!active) return;
        const handlePop = (event) => { 
            const modal = event.state ? event.state.modal : null; 
            if (shareData) { setShareData(null); return; }
            if (modal !== 'STAT_DETAIL' && statDetail) setStatDetail(null); 
            if (modal !== 'EXPENDITURE' && showExpenditurePopup) setShowExpenditurePopup(false); 
            if (modal !== 'BEAN_SELECT' && showBeanSelectPopup) setShowBeanSelectPopup(false); 
            if (modal !== 'GEAR_ADD' && showGearAddPopup) setShowGearAddPopup(false); 
        };
        window.addEventListener('popstate', handlePop); return () => window.removeEventListener('popstate', handlePop);
    }, [active, statDetail, showExpenditurePopup, showBeanSelectPopup, showGearAddPopup, shareData]);

    useEffect(() => { 
        if (!active) { 
            setStatDetail(null); 
            setShowExpenditurePopup(false); 
            setShowBeanSelectPopup(false); 
            setShowGearAddPopup(false); 
        } 
    }, [active]);
    
    useEffect(() => { 
        if (active) { 
            idb.get(`${STORAGE_KEY}_data`).then(data => { 
                if (Array.isArray(data)) setBeans(data); 
                if (scrollRef.current) scrollRef.current.scrollTop = 0; 
            }); 
            idb.get(GEAR_STORAGE_KEY).then(data => { 
                if (Array.isArray(data)) setGears(data); 
            }); 
        } 
    }, [active, navKey]);

    const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
    
    const handleTouchStart = (idx) => { 
        isLongPress.current = false; 
        longPressTimer.current = setTimeout(() => { 
            isLongPress.current = true; 
            setTastingMenuIdx(idx); 
            if (navigator.vibrate) navigator.vibrate(50); 
        }, 600); 
    };
    
    const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

    const handleTextShare = async (tasting) => { 
        const bean = beans.find(b => b.id === tasting.beanId); 
        if (!bean) return; 
        
        const text = generateShareText(bean, tasting); 
        
        if (navigator.share) { 
            try { 
                await navigator.share({ text }); 
            } catch (e) { 
                console.log(e); 
            } 
        } else { 
            try { 
                await navigator.clipboard.writeText(text); 
                showToastMsg("텍스트가 복사되었습니다."); 
            } catch { 
                showToastMsg("복사 실패"); 
            } 
        } 
        setTastingMenuIdx(null); 
    };

    const handleEditGear = (gear) => {
        setGearForm(gear);
        window.history.pushState({ tab: TAB.STATS, modal: 'GEAR_ADD' }, '');
        setShowGearAddPopup(true);
    };

    const handleSaveGear = async () => {
        if (!gearForm.name.trim() || !gearForm.price) { 
            showToastMsg("이름과 가격을 입력해주세요."); 
            return; 
        }
        
        let newGears;
        let newGear;
        
        if (gearForm.id) {
            newGears = gears.map(g => g.id === gearForm.id ? gearForm : g);
        } else {
            newGear = { id: Date.now(), ...gearForm };
            newGears = [...gears, newGear];
        }
        
        if (await idb.set(GEAR_STORAGE_KEY, newGears)) { 
            setGears(newGears); 
            if (statDetail && statDetail.type === 'GEAR') { 
                setStatDetail(prev => ({ 
                    ...prev, 
                    items: gearForm.id 
                        ? prev.items.map(item => item.id === gearForm.id ? gearForm : item) 
                        : [newGear, ...prev.items].sort((a, b) => b.date.localeCompare(a.date)) 
                })); 
            } 
            showToastMsg(gearForm.id ? "기물이 수정되었습니다." : "기물이 추가되었습니다."); 
            window.history.back(); 
            setTimeout(() => setGearForm({ name: '', date: new Date().toISOString().split('T')[0], price: '' }), 300); 
        }
    };

    const handleDeleteGear = async (id, e) => {
        e.stopPropagation();
        if (confirm("이 지출 기록을 삭제하시겠습니까?")) {
            const newGears = gears.filter(g => g.id !== id);
            if (await idb.set(GEAR_STORAGE_KEY, newGears)) { 
                setGears(newGears); 
                if (statDetail && statDetail.type === 'GEAR') { 
                    setStatDetail(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) })); 
                } 
            }
        }
    };

    const handleStatClick = (type) => {
        const isMatch = (dateStr) => { 
            if (!dateStr) return false; 
            if (selectedYear === 'ALL') return true; 
            const [y, m] = dateStr.split('-'); 
            if (y !== selectedYear) return false; 
            if (selectedMonth !== 'ALL' && m !== String(selectedMonth).padStart(2, '0')) return false; 
            return true; 
        };
        
        let title = "", items = [], dataType = 'BEAN';
        
        if (type === 'TOTAL_TASTINGS') {
            title = "시음 기록 목록"; dataType = 'TASTING';
            beans.forEach(b => { 
                if (b.tastings) { 
                    b.tastings.forEach(t => { 
                        if (isMatch(t.date)) { 
                            items.push({ ...t, beanId: b.id, beanName: b.name }); 
                        } 
                    }); 
                } 
            });
            items.sort((a, b) => b.date.localeCompare(a.date));
        } else {
            const filteredBeans = beans.filter(b => isMatch(b.purchaseDate));
            const filteredGears = gears.filter(g => isMatch(g.date));
            
            if (type === 'TOTAL_BEANS') { 
                title = "총 원두 목록"; 
                items = filteredBeans.filter(b => parseFloat(b.weight) > 0); 
            } else if (type === 'ACTIVE_BEANS') { 
                title = "보유 원두 목록"; 
                items = filteredBeans.filter(b => parseFloat(b.weight) > 0 && !b.isFinished); 
            } else if (type === 'SOLDOUT_BEANS') { 
                title = "소진 원두 목록"; 
                items = filteredBeans.filter(b => parseFloat(b.weight) > 0 && b.isFinished); 
            } else if (type === 'TOTAL_CUPS') { 
                title = "한잔 커피 목록"; 
                items = filteredBeans.filter(b => { 
                    const weight = parseFloat(b.weight) || 0; 
                    const price = parseFloat(b.price) || 0; 
                    const pricePerCup = parseFloat(b.pricePerCup) || 0; 
                    return pricePerCup > 0 || (weight === 0 && price > 0); 
                }); 
            } else if (type === 'TOTAL_GEARS') { 
                title = "커피 기물 목록"; 
                items = filteredGears; 
                dataType = 'GEAR'; 
            }
            
            if (type === 'TOTAL_GEARS') {
                items.sort((a, b) => b.date.localeCompare(a.date)); 
            } else {
                items.sort((a, b) => (b.purchaseDate || "").localeCompare(a.purchaseDate || ""));
            }
        }
        window.history.pushState({ tab: TAB.STATS, modal: 'STAT_DETAIL' }, ''); 
        setStatDetail({ title, items, type: dataType });
    };

    const stats = useMemo(() => {
        const isMatch = (dateStr) => { 
            if (!dateStr) return false; 
            if (selectedYear === 'ALL') return true; 
            const [y, m] = dateStr.split('-'); 
            if (y !== selectedYear) return false; 
            if (selectedMonth !== 'ALL' && m !== String(selectedMonth).padStart(2, '0')) return false; 
            return true; 
        };
        
        const filteredBeans = beans.filter(b => isMatch(b.purchaseDate)); 
        const isBean = (b) => parseFloat(b.weight) > 0;
        let totalBeans = 0, totalWeight = 0, activeBeans = 0, activeWeight = 0, soldOutBeans = 0, soldOutWeight = 0, totalCups = 0, totalExpenditure = 0, beanExpenditure = 0, coffeeExpenditure = 0, gearExpenditure = 0;
        
        const filteredGears = gears.filter(g => isMatch(g.date)); 
        filteredGears.forEach(g => { 
            const p = parseFloat(g.price) || 0; 
            gearExpenditure += p; 
            totalExpenditure += p; 
        });
        
        filteredBeans.forEach(b => {
            const weight = parseFloat(b.weight) || 0;
            const remaining = b.remainingWeight !== undefined ? parseFloat(b.remainingWeight) : (b.isFinished ? 0 : weight);
            const consumed = weight - remaining;
            const price = parseFloat(b.price) || 0;
            const pricePerCup = parseFloat(b.pricePerCup) || 0;
            
            if (isBean(b)) { 
                totalBeans++; 
                totalWeight += weight; 
                soldOutWeight += consumed;
                if (b.isFinished) { 
                    soldOutBeans++; 
                } else { 
                    activeBeans++; 
                    activeWeight += remaining;
                } 
                beanExpenditure += price; 
                totalExpenditure += price; 
            }
            
            if (pricePerCup > 0) { 
                totalCups++; 
                coffeeExpenditure += pricePerCup; 
                totalExpenditure += pricePerCup; 
            } else if (!isBean(b) && price > 0) { 
                totalCups++; 
                coffeeExpenditure += price; 
                totalExpenditure += price; 
            }
        });
        
        let totalTastings = 0; 
        const tastingMap = {}; 
        const dateSet = new Set();
        const purchaseMap = {}; 
        const purchaseDateSet = new Set();
        const gearMap = {}; 
        const gearDateSet = new Set();
        let monthTastingCount = 0, monthBeansBought = 0, monthGearsBought = 0; 
        const currentYear = viewDate.getFullYear(), currentMonth = viewDate.getMonth();
        
        beans.forEach(bean => {
            if (bean.tastings) { 
                bean.tastings.forEach(t => { 
                    if (isMatch(t.date)) { 
                        totalTastings++; 
                    } 
                    dateSet.add(t.date); 
                    if (!tastingMap[t.date]) tastingMap[t.date] = []; 
                    tastingMap[t.date].push({ ...t, beanId: bean.id, beanName: bean.name }); 
                    
                    const tDate = new Date(t.date); 
                    if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) { 
                        monthTastingCount++; 
                    } 
                }); 
            }
            if (bean.purchaseDate && isBean(bean)) { 
                purchaseDateSet.add(bean.purchaseDate); 
                if (!purchaseMap[bean.purchaseDate]) purchaseMap[bean.purchaseDate] = []; 
                purchaseMap[bean.purchaseDate].push(bean); 
                
                const pDate = new Date(bean.purchaseDate); 
                if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) { 
                    monthBeansBought++; 
                } 
            }
        });
        
        gears.forEach(g => { 
            gearDateSet.add(g.date); 
            if (!gearMap[g.date]) gearMap[g.date] = []; 
            gearMap[g.date].push(g); 
            
            const d = new Date(g.date); 
            if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) monthGearsBought++; 
        });
        
        const availableYears = Array.from(new Set(beans.map(b => b.purchaseDate ? b.purchaseDate.split('-')[0] : null).concat(beans.flatMap(b => b.tastings ? b.tastings.map(t => t.date.split('-')[0]) : [])).concat(gears.map(g => g.date.split('-')[0])))).filter(Boolean).sort().reverse();
        let availableMonths = [];
        if (selectedYear !== 'ALL') { 
            const s = new Set(); 
            beans.forEach(b => { 
                if (b.purchaseDate && b.purchaseDate.startsWith(selectedYear)) s.add(b.purchaseDate.split('-')[1]); 
                if (b.tastings) b.tastings.forEach(t => { if (t.date.startsWith(selectedYear)) s.add(t.date.split('-')[1]); }); 
            }); 
            gears.forEach(g => { if (g.date.startsWith(selectedYear)) s.add(g.date.split('-')[1]); }); 
            availableMonths = Array.from(s).filter(Boolean).sort(); 
        }
        
        return { totalBeans, totalWeight, activeBeans, activeWeight, soldOutBeans, soldOutWeight, totalCups, totalExpenditure, beanExpenditure, coffeeExpenditure, gearExpenditure, totalTastings, tastingMap, tastingDays: Array.from(dateSet), purchaseMap, purchaseDays: Array.from(purchaseDateSet), gearMap, gearDays: Array.from(gearDateSet), monthTastingCount, monthBeansBought, monthGearsBought, availableYears, availableMonths };
    }, [beans, gears, viewDate, selectedYear, selectedMonth]);

    const selectedTastings = stats.tastingMap[selectedDate] || [];
    const selectedPurchases = stats.purchaseMap[selectedDate] || [];
    const selectedGears = stats.gearMap[selectedDate] || [];

    return (
        <div className={`h-full flex flex-col bg-slate-50 dark:bg-slate-950 ${active ? 'block' : 'hidden'}`}>
            {toast && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl z-[120] whitespace-nowrap animate-in fade-in slide-in-from-top-2">{toast}</div>}
            {shareData && <ShareModal bean={shareData.bean} tasting={shareData.tasting} onClose={() => window.history.back()} />}
            {statDetail && (
                <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => window.history.back()}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[60vh] rounded-2xl shadow-xl animate-pop flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {statDetail.title} <span className="text-sm font-normal text-slate-500">({statDetail.items.length})</span>
                                {statDetail.type === 'GEAR' && (
                                    <button onClick={() => { setGearForm({ name: '', date: new Date().toISOString().split('T')[0], price: '' }); window.history.pushState({ tab: TAB.STATS, modal: 'GEAR_ADD' }, ''); setShowGearAddPopup(true); }} className="p-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-transform">
                                        <Plus size={14}/>
                                    </button>
                                )}
                            </h3>
                            <button onClick={() => window.history.back()} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={18}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {statDetail.items.length === 0 ? <div className="text-center text-slate-400 py-10 text-sm">데이터가 없습니다.</div> : statDetail.items.map((item, i) => (
                                <div key={i} onClick={() => { if(statDetail.type === 'BEAN') onNavigateToBean(item.id); else if(statDetail.type === 'TASTING') onNavigateToBean(item.beanId, item); else if(statDetail.type === 'GEAR') handleEditGear(item); }} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-95 transition-transform cursor-pointer">
                                    {statDetail.type === 'GEAR' ? (
                                        <>
                                            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0"><Box size={20} className="text-green-600 dark:text-green-400"/></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h4>
                                                <div className="text-xs text-slate-500 truncate">{item.date}</div>
                                            </div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white">₩{parseFloat(item.price).toLocaleString()}</div>
                                            <button onClick={(e) => handleDeleteGear(item.id, e)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500 hover:text-red-500 ml-1"><Trash2 size={14}/></button>
                                        </>
                                    ) : statDetail.type === 'BEAN' ? (
                                        <>
                                            <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden`}>{item.mainImage ? <img src={item.mainImage} className="w-full h-full object-cover"/> : <CustomBeanIcon size={20} className="text-slate-300"/>}</div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h4>
                                            <div className="text-xs text-slate-500 truncate">{item.shop || '-'} · {item.purchaseDate || '-'}{statDetail.title === '보유 원두 목록' && item.weight ? ` · ${item.remainingWeight !== undefined ? item.remainingWeight : (item.isFinished ? 0 : item.weight)}g` : ''}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 font-black text-xs border dark:border-slate-600 dark:text-white">{getDisplayScore(item)}</div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.beanName}</h4>
                                                <div className="text-xs text-slate-500 truncate">{item.date} · {item.notes || '-'}</div>
                                            </div>
                                        </>
                                    )}
                                    {statDetail.type !== 'GEAR' && <ChevronRight size={16} className="text-slate-300"/>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {showExpenditurePopup && (
                <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => window.history.back()}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-6 shadow-xl animate-pop" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">지출 상세</h3>
                            <button onClick={() => window.history.back()} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={16}/></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총 지출</span>
                                <span className="text-lg font-black text-slate-900 dark:text-white">₩{stats.totalExpenditure.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><CustomBeanIcon size={12}/> 원두 구매</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₩{stats.beanExpenditure.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Coffee size={12}/> 한잔 커피</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₩{stats.coffeeExpenditure.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-2 py-1.5 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer" onClick={() => { window.history.back(); setTimeout(() => handleStatClick('TOTAL_GEARS'), 50); }}>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-2"><Box size={12}/> 커피 기물</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-2">₩{stats.gearExpenditure.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showBeanSelectPopup && (
                <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => window.history.back()}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[60vh] rounded-2xl shadow-xl animate-pop flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CustomBeanIcon size={18} className="text-amber-700 dark:text-amber-500"/> 시음할 원두 선택</h3>
                            <button onClick={() => window.history.back()} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={18}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {beans.filter(b => parseFloat(b.weight) > 0 && !b.isFinished).length === 0 ? (
                                <div className="text-center text-slate-400 py-10 text-sm">보유 중인 원두가 없습니다.</div>
                            ) : (
                                beans.filter(b => parseFloat(b.weight) > 0 && !b.isFinished).sort((a, b) => b.id - a.id).map(bean => (
                                    <div key={bean.id} onClick={() => { window.history.back(); setTimeout(() => { onNavigateToBean(bean.id, { ...INITIAL_TASTING, date: selectedDate, _isNew: true }); }, 50); }} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-95 transition-transform cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden`}>{bean.mainImage ? <img src={bean.mainImage} className="w-full h-full object-cover"/> : <CustomBeanIcon size={20} className="text-slate-300"/>}</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{bean.name}</h4>
                                            <div className="text-xs text-slate-500 truncate">{bean.shop || '-'} · {bean.roastingLevel || '-'}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300"/>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showGearAddPopup && (
                <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => window.history.back()}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-6 shadow-xl animate-pop" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Box size={18} className="text-green-600"/> {gearForm.id ? "기물 수정" : "기물 추가"}</h3>
                            <button onClick={() => window.history.back()} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={16}/></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">기물 이름</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="예: 하리오 V60" value={gearForm.name} onChange={e => setGearForm({...gearForm, name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">구매일</label>
                                <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" value={gearForm.date} onChange={e => setGearForm({...gearForm, date: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">가격</label>
                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="예: 25000" value={gearForm.price} onChange={e => setGearForm({...gearForm, price: e.target.value})}/>
                            </div>
                            <button onClick={handleSaveGear} className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold mt-2 hover:bg-slate-800 dark:hover:bg-slate-200">저장</button>
                        </div>
                    </div>
                </div>
            )}
            <header className="p-4 pt-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><LayoutDashboard className="text-slate-900 dark:text-white"/> Insights</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24" ref={scrollRef}>
                <section>
                    <div className="flex justify-between items-center mb-3 px-1 relative">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><BarChart3 size={14}/> Dashboard</h2>
                        <DashboardFilter selectedYear={selectedYear} onSelectYear={(y) => { setSelectedYear(y); setSelectedMonth('ALL'); }} availableYears={stats.availableYears} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} availableMonths={stats.availableMonths} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label={`${selectedYear === 'ALL' ? '누적' : (selectedMonth === 'ALL' ? `${selectedYear}년` : `${selectedYear}.${selectedMonth}`)} 총 원두`} value={stats.totalBeans} subValue={formatWeight(stats.totalWeight)} customIcon={<CustomBeanIcon size={20} className="text-amber-700"/>} color="bg-amber-100" onClick={() => handleStatClick('TOTAL_BEANS')} />
                        <StatCard label="누적 지출" value={`₩${stats.totalExpenditure.toLocaleString()}`} customIcon={<ShoppingBag size={18} className="text-green-700"/>} color="bg-green-100" onClick={() => { window.history.pushState({ tab: TAB.STATS, modal: 'EXPENDITURE' }, ''); setShowExpenditurePopup(true); }} />
                        <StatCard label="보유 원두" value={stats.activeBeans} subValue={formatWeight(stats.activeWeight)} customIcon={<CustomBeanIcon size={20} className="text-blue-600"/>} color="bg-blue-100" onClick={() => handleStatClick('ACTIVE_BEANS')} />
                        <StatCard label="소진 원두" value={stats.soldOutBeans} subValue={formatWeight(stats.soldOutWeight)} customIcon={<CustomBeanIcon size={20} className="text-slate-500"/>} color="bg-slate-100" onClick={() => handleStatClick('SOLDOUT_BEANS')} />
                        <StatCard label="한잔 커피" value={stats.totalCups} customIcon={<Coffee size={18} className="text-orange-700"/>} color="bg-orange-100" subValue="Cups" onClick={() => handleStatClick('TOTAL_CUPS')} />
                        <StatCard label={`${selectedYear === 'ALL' ? '누적' : (selectedMonth === 'ALL' ? `${selectedYear}년` : `${selectedYear}.${selectedMonth}`)} 시음`} value={stats.totalTastings} customIcon={<FileText size={18} className="text-purple-700"/>} color="bg-purple-100" subValue="Records" onClick={() => handleStatClick('TOTAL_TASTINGS')} />
                    </div>
                </section>
                
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <CalendarDays size={16} className="text-slate-400"/>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Coffee Calendar</h2>
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold text-slate-400">
                        <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 flex items-center gap-1"><Coffee size={10}/> {stats.monthTastingCount}잔</span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1"><CustomBeanIcon size={10} className="text-amber-700 dark:text-amber-500"/> {stats.monthBeansBought}개</span>
                        {stats.monthGearsBought > 0 && <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/30 flex items-center gap-1"><Box size={10}/> {stats.monthGearsBought}개</span>}
                        </div>
                    </div>
                    <CalendarView tastingDays={stats.tastingDays} purchaseDays={stats.purchaseDays} gearDays={stats.gearDays} onSelectDate={setSelectedDate} selectedDate={selectedDate} onMonthChange={setViewDate} viewDate={viewDate} />
                </section>
                
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> {selectedDate}</h2>
                            <button onClick={() => { window.history.pushState({ tab: TAB.STATS, modal: 'BEAN_SELECT' }, ''); setShowBeanSelectPopup(true); }} className="p-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-transform"><Plus size={12}/></button>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{selectedTastings.length} Records</span>
                    </div>
                    {selectedTastings.length > 0 ? (
                        <div className="space-y-3">
                            {selectedTastings.map((t, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 active:scale-95 transition-transform cursor-pointer hover:border-blue-100 dark:hover:border-blue-900 relative overflow-hidden select-none" onTouchStart={() => handleTouchStart(idx)} onTouchEnd={handleTouchEnd} onMouseDown={() => handleTouchStart(idx)} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd} onContextMenu={(e) => { e.preventDefault(); setTastingMenuIdx(idx); }} onClick={() => { if (isLongPress.current) return; if (tastingMenuIdx !== null) { setTastingMenuIdx(null); return; } onNavigateToBean(t.beanId, t); }}>
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-sm text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 shrink-0 shadow-sm">{getDisplayScore(t)}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-0.5">{t.beanName}</h4>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded font-bold">Flavor</span>
                                            <p className="text-xs text-slate-400 truncate flex-1">{t.notes || "-"}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300"/>
                                    {tastingMenuIdx === idx && (
                                        <div className="absolute inset-0 bg-slate-900/95 z-20 flex items-center justify-center gap-6 animate-in fade-in" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); setTastingMenuIdx(null); onNavigateToBean(t.beanId); }} className="flex flex-col items-center text-white gap-1">
                                                <div className="p-2 bg-slate-800 rounded-full"><CustomBeanIcon size={20}/></div>
                                                <span className="text-[10px] font-bold">원두 정보</span>
                                            </button>
                                        <button onClick={(e) => { e.stopPropagation(); const bean = beans.find(b => b.id === t.beanId); if(bean) { window.history.pushState({ tab: TAB.STATS, modal: 'SHARE' }, ''); setShareData({ bean, tasting: t }); } setTastingMenuIdx(null); }} className="flex flex-col items-center text-white gap-1">
                                                <div className="p-2 bg-slate-800 rounded-full"><ImageIcon size={20}/></div>
                                                <span className="text-[10px] font-bold">이미지 공유</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleTextShare(t); }} className="flex flex-col items-center text-white gap-1">
                                                <div className="p-2 bg-slate-800 rounded-full"><FileText size={20}/></div>
                                                <span className="text-[10px] font-bold">텍스트 공유</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setTastingMenuIdx(null); }} className="absolute top-0 right-0 p-4 text-slate-500 hover:text-slate-300">
                                                <X size={20}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-600"><Coffee size={20} /></div>
                            <p className="text-xs font-bold text-slate-400">커피를 마시지 않았어요</p>
                        </div>
                    )}
                </section>
                
                {selectedPurchases.length > 0 && (
                    <section className="mt-6 border-t dark:border-slate-800 pt-6">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14}/> Purchased Beans</h2>
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md">{selectedPurchases.length} Beans</span>
                        </div>
                        <div className="space-y-3">
                            {selectedPurchases.map(bean => (
                                <div key={bean.id} onClick={() => onNavigateToBean(bean.id)} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl active:scale-95 transition-transform cursor-pointer hover:border-blue-100 dark:hover:border-blue-900">
                                    <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden`}>{bean.mainImage ? <img src={bean.mainImage} className="w-full h-full object-cover"/> : <CustomBeanIcon size={24} className="text-amber-700 dark:text-amber-500"/>}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-0.5">{bean.name}</h4>
                                        <div className="text-xs text-slate-500 truncate">{bean.shop || '-'} · {bean.roastingLevel || '-'} · {bean.weight ? `${bean.weight}g` : '-'}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300"/>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                
                {selectedGears.length > 0 && (
                    <section className="mt-6 border-t dark:border-slate-800 pt-6">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Box size={14}/> Purchased Gear</h2>
                            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">{selectedGears.length} Items</span>
                        </div>
                        <div className="space-y-3">
                            {selectedGears.map(gear => (
                                <div key={gear.id} onClick={() => handleEditGear(gear)} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl active:scale-95 transition-transform cursor-pointer hover:border-slate-100 dark:hover:border-slate-800">
                                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0"><Box size={24} className="text-green-600 dark:text-green-400"/></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-0.5">{gear.name}</h4>
                                        <div className="text-xs text-slate-500">₩{parseFloat(gear.price).toLocaleString()}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300"/>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};