import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Award, Coffee, Globe, ShoppingBag, TrendingUp, FileText, Download, Share2, Star, Package, Bot, RefreshCw, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDisplayScore, formatWeight, parseTags, idb } from './utils';
import { CustomBeanIcon } from './Icons';
import { STORAGE_KEY } from './constants';

const StatItem = ({ icon, label, value, unit, bgClass = "bg-white", textClass = "text-slate-400" }) => (
    <div className={`${bgClass} border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm`}>
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${textClass}`}>{icon} {label}</div>
        <div className="text-lg font-black text-slate-800 flex items-baseline gap-0.5 text-center leading-tight">
            {value} {unit && <span className={`text-[10px] font-bold ${textClass}`}>{unit}</span>}
        </div>
    </div>
);

const DNAItem = ({ icon, label, value, textClass = "text-slate-400" }) => (
    <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col justify-center gap-1 shadow-sm">
        <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${textClass}`}>{icon} {label}</div>
        <div className="text-xs font-bold text-slate-800 break-words leading-tight">{value || '-'}</div>
    </div>
);

const Header = ({ monthName, year, title }) => (
    <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
            <div>
                <div className="font-black text-3xl tracking-tighter text-slate-900 leading-none mb-1">{monthName}</div>
                <div className="font-bold text-[10px] tracking-widest text-blue-500 uppercase">{year} {title}</div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900 text-white text-[9px] font-black tracking-widest uppercase shadow-sm">
                <CustomBeanIcon size={10} className="text-white"/> BeanLog
            </div>
        </div>
    </div>
);

export const MonthlyReport = ({ beans, gears, year, month, onClose }) => {
    const pagesRef = useRef([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedFiles, setGeneratedFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [aiSummary, setAiSummary] = useState(null);
    const [aiTastingSummaries, setAiTastingSummaries] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const reportStats = useMemo(() => {
        if (!year || !month || year === 'ALL' || month === 'ALL') return null;

        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const beanMap = new Map(beans.map(b => [b.id, b]));

        const monthlyTastings = [];
        beans.forEach(bean => {
            if (bean.tastings) {
                bean.tastings.forEach(tasting => {
                    if (tasting.date && tasting.date.startsWith(monthStr)) {
                        monthlyTastings.push({ ...tasting, bean: beanMap.get(bean.id) });
                    }
                });
            }
        });

        if (monthlyTastings.length === 0) return { isEmpty: true, tastingCount: 0 };

        let beanExpenditure = 0, coffeeExpenditure = 0, gearExpenditure = 0;
        beans.filter(b => b.purchaseDate && b.purchaseDate.startsWith(monthStr) && parseFloat(b.weight) > 0).forEach(b => beanExpenditure += parseFloat(b.price) || 0);
        monthlyTastings.forEach(t => {
            const bean = t.bean;
            const isCup = (parseFloat(bean.weight) || 0) === 0 && (parseFloat(bean.price) > 0 || parseFloat(bean.pricePerCup) > 0);
            if (isCup) coffeeExpenditure += parseFloat(bean.pricePerCup) || parseFloat(bean.price) || 0;
        });
        gears.filter(g => g.date && g.date.startsWith(monthStr)).forEach(g => gearExpenditure += parseFloat(g.price) || 0);
        const totalExpenditure = beanExpenditure + coffeeExpenditure + gearExpenditure;

        const consumedWeight = monthlyTastings.length * 18;

        monthlyTastings.sort((t1, t2) => parseFloat(getDisplayScore(t2)) - parseFloat(getDisplayScore(t1)));

        const topBeanTasting = monthlyTastings.find(t => t.bean && (parseFloat(t.bean.weight) || 0) > 0);
        const topCupTasting = monthlyTastings.find(t => t.bean && (parseFloat(t.bean.weight) || 0) === 0);

        const countFrequency = (arr) => {
            if (!arr || arr.length === 0) return null;
            const frequency = arr.reduce((acc, value) => { if (value && value.trim()) { const v = value.trim(); acc[v] = (acc[v] || 0) + 1; } return acc; }, {});
            const sorted = Object.entries(frequency).sort(([, a], [, b]) => b - a);
            return sorted.length > 0 ? sorted[0][0] : null;
        };
        
        const beansTastedInMonth = [...new Set(monthlyTastings.map(t => t.bean))];

        return {
            isEmpty: false,
            tastingCount: monthlyTastings.length,
            totalExpenditure,
            consumedWeight,
            bestBean: topBeanTasting ? { ...topBeanTasting.bean, score: getDisplayScore(topBeanTasting) } : null,
            bestCup: topCupTasting ? { ...topCupTasting.bean, score: getDisplayScore(topCupTasting) } : null,
            topCountry: countFrequency(beansTastedInMonth.map(b => b.country)),
            topVariety: countFrequency(beansTastedInMonth.map(b => b.variety)),
            topProcess: countFrequency(beansTastedInMonth.map(b => b.processing)),
            topShop: countFrequency(beansTastedInMonth.map(b => b.shop)),
            topTastings: monthlyTastings.slice(0, 3),
        };
    }, [beans, gears, year, month]);

    useEffect(() => {
        const fetchAiSummary = async () => {
            if (!reportStats || reportStats.isEmpty || reportStats.topTastings.length === 0) return;
            setIsAiLoading(true);
            try {
                const apiKey = await idb.get(`${STORAGE_KEY}_key`);
                if (!apiKey) {
                    setIsAiLoading(false);
                    return;
                }
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });
                
                const tastingsData = reportStats.topTastings.map((t, index) => ({
                    id: index,
                    beanName: t.bean.name,
                    notes: t.notes,
                    desc: t.desc,
                    memo: t.memo
                }));
                
                const prompt = `다음은 내가 한 달 동안 쓴 Top 3 커피 시음 후기 데이터야.
이 데이터를 바탕으로 다음 두 가지를 분석해서 JSON 형식으로 작성해 줘.
1. "vibe": 이번 달 나의 커피 취향이나 분위기를 감성적인 인스타그램용 한 줄 평(20~40자 내외)으로 요약 (따옴표 없이 핵심 문장만, 내용에 어울리는 이모지 포함)
2. "summaries": 각 시음 기록(id)에 대해 원래의 후기(desc, memo)와 노트(notes)를 바탕으로, 인스타그램 카드에 들어갈 법한 2~3줄 분량의 매력적인 시음 요약평을 작성해줘. 커피(☕)나 과일(🍓, 🍋) 등 내용에 어울리는 이모지를 문장 곳곳에 적절히 섞어줘. id 순서대로 배열에 담아줘. (원래 후기가 비어있으면 원두 이름과 노트만으로 그럴싸하게 작성해)

데이터:
${JSON.stringify(tastingsData)}`;

                const result = await model.generateContent(prompt);
                let responseText = result.response.text();
                if (responseText.startsWith('```json')) {
                    responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                }
                const parsed = JSON.parse(responseText);
                setAiSummary(parsed.vibe || "이번 달도 향긋한 커피와 함께 ☕");
                setAiTastingSummaries(parsed.summaries || []);
            } catch (error) {
                console.error("AI 요약 실패:", error);
            } finally {
                setIsAiLoading(false);
            }
        };
        
        fetchAiSummary();
    }, [reportStats]);

    const generateImages = async () => {
        if (generatedFiles.length > 0) return generatedFiles;
        setIsGenerating(true); setProgress(0);
        await new Promise(r => setTimeout(r, 100));

        const files = [];
        try {
            const nodes = pagesRef.current.filter(Boolean);
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const dataUrl = await toPng(node, {
                    pixelRatio: 3, cacheBust: false, width: 320,
                    style: { transform: 'scale(1)', transformOrigin: 'top left', WebkitTextSizeAdjust: 'none', margin: '0' }
                });
                
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `BeanLog_Report_${year}_${month}_${i+1}.png`, { type: 'image/png' });
                files.push(file);
                
                setProgress(Math.round(((i + 1) / nodes.length) * 100));
                await new Promise(r => setTimeout(r, 50));
            }
            
            setGeneratedFiles(files);
            return files;
        } catch (err) { 
            console.error(err); 
            return null; 
        } finally { 
            setIsGenerating(false); 
        }
    };

    const handleDownload = async () => {
        const files = await generateImages();
        if (files && files.length > 0) {
            files.forEach((file, idx) => {
                setTimeout(() => {
                    try {
                        const url = URL.createObjectURL(file);
                        const link = document.createElement('a');
                        link.download = file.name;
                        link.href = url;
                        link.click();
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    } catch (e) { console.error(e); }
                }, idx * 300);
            });
        }
    };

    const handleShare = async () => {
        const alreadyGenerated = generatedFiles.length > 0;
        const files = await generateImages();
        if (files && files.length > 0) {
            try {
                if (navigator.share && navigator.canShare && navigator.canShare({ files: files })) {
                    await navigator.share({ files: files, title: `${month}월 커피 리포트`, text: `BeanLog ${month}월 커피 리포트` });
                } else {
                    alert("이 기기나 브라우저에서는 다중 이미지 직접 공유를 지원하지 않습니다. '저장' 버튼을 이용해주세요.");
                }
            } catch (err) {
                if (err.name === 'NotAllowedError' && !alreadyGenerated) {
                    alert("이미지 준비가 완료되었습니다.\n공유 창을 띄우려면 '공유' 버튼을 한 번 더 눌러주세요.");
                } else if (err.name !== 'AbortError') {
                    alert("공유 중 오류가 발생했습니다. 저장 버튼을 이용해보세요.");
                }
            }
        }
    };

    const monthName = `${parseInt(month)}월`;

    const pages = [];
    if (reportStats && !reportStats.isEmpty) {
        // Page 1: Overview
        pages.push(
            <div key="page1" className="w-[320px] h-[400px] bg-[#FAFAFA] flex flex-col p-6 font-sans border border-slate-200 box-border text-slate-900 shrink-0">
                <Header monthName={monthName} year={year} title="OVERVIEW" />
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="grid grid-cols-3 gap-2">
                        <StatItem icon={<CustomBeanIcon size={12}/>} label="Beans" value={formatWeight(reportStats.consumedWeight)} unit="" bgClass="bg-amber-50" textClass="text-amber-600" />
                        <StatItem icon={<Coffee size={12}/>} label="Cups" value={reportStats.tastingCount} unit="잔" bgClass="bg-orange-50" textClass="text-orange-600" />
                        <StatItem icon={<ShoppingBag size={12}/>} label="Spent" value={reportStats.totalExpenditure.toLocaleString()} unit="원" bgClass="bg-green-50" textClass="text-green-600" />
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm mt-2">
                        <h3 className="font-bold text-[11px] uppercase tracking-widest text-slate-600 flex items-center gap-1.5 mb-3"><Bot size={14} className="text-blue-500"/> 가장 많이 시음한</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <DNAItem icon={<Globe size={12}/>} label="Country" value={reportStats.topCountry} textClass="text-blue-500" />
                            <DNAItem icon={<Package size={12}/>} label="Variety" value={reportStats.topVariety} textClass="text-purple-500" />
                            <DNAItem icon={<TrendingUp size={12}/>} label="Process" value={reportStats.topProcess} textClass="text-rose-500" />
                            <DNAItem icon={<ShoppingBag size={12}/>} label="Roastery" value={reportStats.topShop} textClass="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        );

        // Page 2: Best of the Month
        pages.push(
            <div key="page2" className="w-[320px] h-[400px] bg-[#FAFAFA] flex flex-col p-6 font-sans border border-slate-200 box-border text-slate-900 shrink-0">
                <Header monthName={monthName} year={year} title="BEST OF MONTH" />
                <div className="flex-1 flex flex-col gap-3 justify-center">
                    {reportStats.bestBean && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
                            <div className="text-[10px] font-bold flex items-center gap-1.5 text-amber-600 uppercase tracking-widest"><CustomBeanIcon size={12}/> BEST BEAN</div>
                            <div className="font-black text-lg text-amber-950 break-keep leading-tight">{reportStats.bestBean.name}</div>
                            <div className="text-2xl font-black text-amber-600 mt-1">{reportStats.bestBean.score} <span className="text-[10px] text-amber-500/70">/ 10</span></div>
                        </div>
                    )}
                    {reportStats.bestCup && (
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
                            <div className="text-[10px] font-bold flex items-center gap-1.5 text-orange-600 uppercase tracking-widest"><Coffee size={12}/> BEST CUP</div>
                            <div className="font-black text-lg text-orange-950 break-keep leading-tight">{reportStats.bestCup.name}</div>
                            <div className="text-2xl font-black text-orange-600 mt-1">{reportStats.bestCup.score} <span className="text-[10px] text-orange-500/70">/ 10</span></div>
                        </div>
                    )}
                    {!reportStats.bestBean && !reportStats.bestCup && <div className="text-center text-slate-400 text-sm font-bold">베스트 기록이 없습니다.</div>}
                </div>
            </div>
        );

        // Page 3~5: Top 3 Moments
        reportStats.topTastings.forEach((t, i) => {
            pages.push(
                <div key={`moment${i}`} className="w-[320px] h-[400px] bg-[#FAFAFA] flex flex-col p-6 font-sans border border-slate-200 box-border text-slate-900 shrink-0">
                    <Header monthName={monthName} year={year} title={`TOP MOMENT 0${i + 1}`} />
                    <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <div className="font-black text-xl text-slate-800 break-words leading-tight mb-2">{t.bean.name}</div>
                        <div className="flex items-center gap-1 font-black text-amber-500 text-lg mb-3">
                            <Star size={14} fill="currentColor"/> {getDisplayScore(t)}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                            {parseTags(t.notes).map((note, idx) => (
                                <span key={idx} className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100">{note}</span>
                            ))}
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col gap-2">
                            {isAiLoading ? (
                                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-400">
                                    <RefreshCw size={16} className="animate-spin text-indigo-400" />
                                    <span className="text-[10px] font-bold">AI 요약 중...</span>
                                </div>
                            ) : aiTastingSummaries[i] ? (
                                <div className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-words">{aiTastingSummaries[i]}</div>
                            ) : (
                                <>
                                    {t.desc && <div className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-words line-clamp-4">{t.desc}</div>}
                                    {t.memo && <div className="text-[10px] text-slate-500 font-medium leading-snug whitespace-pre-wrap mt-auto bg-slate-50 p-2 rounded-lg line-clamp-2">{t.memo}</div>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        });

        // Page 6: AI Vibe
        if (aiSummary || isAiLoading) {
            pages.push(
                <div key="page_ai" className="w-[320px] h-[400px] bg-gradient-to-br from-[#2A1610] via-[#190F0B] to-[#0A0503] flex flex-col p-6 font-sans border border-[#3A2218] box-border text-white shrink-0 relative overflow-hidden">
                    {/* 배경 은은한 조명 효과 (Glow) */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="mb-8 relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-black text-3xl tracking-tighter text-amber-50 leading-none mb-1">{monthName}</div>
                                <div className="font-bold text-[10px] tracking-widest text-amber-500/80 uppercase">{year} MONTHLY VIBE</div>
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-200 text-[9px] font-black tracking-widest uppercase shadow-sm border border-amber-500/20">
                                <Sparkles size={10} className="text-amber-400"/> AI
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                        <div className="text-5xl text-amber-500/20 font-serif mb-1 leading-none self-start ml-4">"</div>
                        {isAiLoading ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <RefreshCw size={24} className="animate-spin text-amber-500/70" />
                                <p className="text-sm font-bold text-amber-100/50">이번 달 커피 취향을<br/>분석하고 있어요...</p>
                            </div>
                        ) : (
                            <div className="text-[17px] font-serif font-medium leading-loose break-keep px-4 text-amber-50 tracking-wide">
                                {aiSummary}
                            </div>
                        )}
                        <div className="text-5xl text-amber-500/20 font-serif mt-1 leading-none self-end mr-4">"</div>
                    </div>

                    <div className="mt-auto text-center relative z-10 pb-2">
                        <div className="w-8 h-[1px] bg-amber-500/30 mx-auto mb-3"></div>
                        <p className="text-[8px] text-amber-100/40 font-bold uppercase tracking-widest">Analyzed by Gemini AI</p>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 overflow-y-auto animate-in fade-in" onClick={onClose}>
            <div className="min-h-full flex flex-col items-center justify-center p-4 py-10">
                <div className="w-full max-w-[320px] flex justify-between items-center mb-4 text-white shrink-0" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Award size={20}/> 월별 리포트
                    </h3>
                    <button onClick={onClose} className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><X size={18}/></button>
                </div>

                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                    {reportStats?.isEmpty ? (
                        <div className="w-[320px] h-[400px] bg-[#FAFAFA] flex flex-col items-center justify-center rounded-2xl text-slate-400">
                            <Coffee size={40} className="mb-3 opacity-30"/>
                            <p className="font-bold text-sm">이번 달 기록이 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-[320px] overflow-hidden rounded-2xl shadow-2xl shrink-0 bg-white" onClick={e => e.stopPropagation()}>
                                <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentSlide * 320}px)` }}>
                                    {pages.map((page, i) => (
                                        <div key={i} className="w-[320px] shrink-0">{page}</div>
                                    ))}
                                </div>
                                {pages.length > 1 && (
                                    <>
                                        <button onClick={() => setCurrentSlide(p => Math.max(0, p - 1))} className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 text-white backdrop-blur-sm ${currentSlide === 0 ? 'opacity-0' : 'opacity-100'}`}><ChevronLeft size={20}/></button>
                                        <button onClick={() => setCurrentSlide(p => Math.min(pages.length - 1, p + 1))} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 text-white backdrop-blur-sm ${currentSlide === pages.length - 1 ? 'opacity-0' : 'opacity-100'}`}><ChevronRight size={20}/></button>
                                    </>
                                )}
                                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                    {pages.map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-4 bg-slate-800' : 'w-1.5 bg-slate-300'}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="absolute top-0 left-[-9999px] flex flex-col gap-10">
                                {pages.map((page, i) => (
                                    <div key={i} ref={el => pagesRef.current[i] = el}>{page}</div>
                                ))}
                            </div>
                        </>
                    )}
                    
                    <div className="flex flex-col items-center min-h-[32px] justify-center mt-2 mb-4">
                        <p className={`text-xs font-bold ${isGenerating ? 'text-white/80' : 'text-white/80 animate-in fade-in'} ${!isGenerating && 'mt-2'}`}>
                            {isAiLoading ? "AI가 시음 기록을 요약하고 있어요..." : 
                             isGenerating ? `이미지 변환 중... ${progress}%` : 
                             "인스타그램에 여러 장으로 공유해 보세요"}
                        </p>
                        {isGenerating && (
                            <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-white/90 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-[320px] flex gap-3 mt-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={handleDownload} disabled={isGenerating || reportStats?.isEmpty || isAiLoading} className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${isGenerating || reportStats?.isEmpty || isAiLoading ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'}`}><Download size={18}/> 저장</button>
                    <button onClick={handleShare} disabled={isGenerating || reportStats?.isEmpty || isAiLoading} className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${isGenerating || reportStats?.isEmpty || isAiLoading ? 'bg-blue-500/50 text-white/50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}><Share2 size={18}/> 공유</button>
                </div>
            </div>
        </div>
    );
};