import React, { useRef, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { MapPin, Layers, Flame, Tag, Coffee, Quote, StickyNote } from 'lucide-react';
import { CustomBeanIcon } from './Icons';
import { AccurateRadarChart } from './Charts';
import { SCORE_LABELS_KO } from './constants';
import { getDisplayScore, parseTags } from './utils';

export const ShareModal = ({ bean, tasting, onClose }) => {
    const cardRef = useRef(null);
    const [generatedImg, setGeneratedImg] = useState(null);
    const [isGenerating, setIsGenerating] = useState(true);

    const totalScore = getDisplayScore(tasting);
    const beanTags = parseTags(bean.notes);
    const tastingTags = parseTags(tasting.notes);

    const specs = [
        { label: "Region", value: bean.region, icon: <MapPin size={8} /> },
        { label: "Process", value: bean.processing, icon: <Layers size={8} /> },
        { label: "Roast", value: bean.roastingLevel, icon: <Flame size={8} /> },
        { label: "Variety", value: bean.variety, icon: <Tag size={8} /> }
    ].filter(s => s.value);

    const isIntensity = !!tasting.isIntensity;
    const maxScore = isIntensity ? 5 : 10;

    useEffect(() => {
        const generate = async () => {
            await new Promise(r => setTimeout(r, 800));
            if (cardRef.current) {
                try {
                    const blob = await htmlToImage.toBlob(cardRef.current, {
                        quality: 0.95,
                        backgroundColor: '#ffffff',
                        skipAutoScale: true,
                        pixelRatio: 2,
                        filter: (n) => n.tagName !== 'LINK'
                    });
                    if (blob) {
                        setGeneratedImg(URL.createObjectURL(blob));
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsGenerating(false);
                }
            }
        };
        generate();
    }, []);

    const handleDownload = () => {
        if (generatedImg) {
            const link = document.createElement('a');
            link.download = `BeanLog_${bean.name}_${tasting.date}.jpg`;
            link.href = generatedImg;
            link.click();
        }
    };
    
    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in">
            <div className="fixed top-0 left-[-9999px]">
                <div ref={cardRef} className="w-[320px] bg-white rounded-sm shadow-2xl overflow-hidden font-capture text-slate-800">
                    <div className="relative h-60 bg-slate-200">
                        {bean.mainImage ? (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bean.mainImage})` }} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                <CustomBeanIcon size={128} className="opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                            <div className="flex items-center justify-between mb-2 opacity-100 items-start">
                                <span className="text-[10px] font-black text-white font-capture whitespace-nowrap drop-shadow-md truncate max-w-[70%]">
                                    {bean.shop || "Home Cafe"}
                                </span>
                                <div className="flex flex-col items-end drop-shadow-md">
                                    {bean.roastingDate && (
                                        <span className="text-[8px] font-medium opacity-90 mb-0.5 whitespace-nowrap">
                                            Roast: {bean.roastingDate}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold opacity-100 whitespace-nowrap">
                                        Taste: {tasting.date}
                                    </span>
                                </div>
                            </div>
                            <h1 className="text-lg font-black leading-snug mb-1 line-clamp-2 drop-shadow-md font-capture">{bean.name}</h1>
                            <p className="text-xs font-bold text-amber-400 mb-3 whitespace-nowrap">{bean.country}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {specs.map((s, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded bg-black/40 border border-white/20 text-[9px] font-medium text-slate-100">
                                        <span className="opacity-70 flex items-center">{s.icon}</span>
                                        <span className="leading-none pt-[1.5px] whitespace-nowrap">{s.value}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 flex flex-col gap-4 bg-white">
                        <div className="grid grid-cols-1 gap-3">
                            {beanTags.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <span className="h-[20px] flex items-center justify-center text-[9px] font-black text-amber-700 bg-amber-50 px-2 rounded border border-amber-100 w-14 shrink-0 pt-[1px] gap-1">
                                        <CustomBeanIcon size={10} /> BEAN
                                    </span>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed pt-[1px]">{beanTags.join(', ')}</p>
                                </div>
                            )}
                            {tastingTags.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <span className="h-[20px] flex items-center justify-center text-[9px] font-black text-blue-700 bg-blue-50 px-2 rounded border border-blue-100 w-14 shrink-0 pt-[1px] gap-1">
                                        <Coffee size={10} /> TASTE
                                    </span>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed pt-[1px]">{tastingTags.join(', ')}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 pt-2 border-t border-dashed border-slate-100">
                            {tasting.desc && (
                                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                    <Quote size={12} className="inline text-slate-300 mr-1 -mt-1" />
                                    {tasting.desc}
                                </p>
                            )}
                            {(tasting.memo || bean.memo) && (
                                <div className="flex gap-2 items-start">
                                    <StickyNote size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                    <div className="text-[10px] text-slate-500 font-medium leading-snug whitespace-pre-wrap">
                                        {tasting.memo || bean.memo}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 border-t border-slate-100 p-4 px-5 flex items-center justify-between gap-3">
                        <div className="flex flex-col shrink-0 items-center justify-center">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</span>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none font-capture">{totalScore}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-3 text-[9px] text-slate-500 font-bold border-l border-slate-200 pl-4">
                            {Object.entries(tasting.scores).map(([k, v]) => (
                                isIntensity ? (
                                    <div key={k} className="flex flex-col justify-center gap-1 mb-1 w-full">
                                        <span>{SCORE_LABELS_KO[k]}</span>
                                        <div className="flex gap-[2px]">
                                            {[1, 2, 3, 4, 5].map(l => (
                                                <div key={l} className={`w-1 h-2 rounded-[1px] ${l <= Number(v) ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div key={k} className="flex justify-between w-full items-end">
                                        <span>{SCORE_LABELS_KO[k]}</span>
                                        <span className="dot-line"></span>
                                        <span className="text-slate-900 text-[10px] font-black">
                                            {Number(v).toFixed(1)}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>
                        <div className="w-[70px] h-[70px] shrink-0">
                            <AccurateRadarChart scores={tasting.scores} maxScore={maxScore} />
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 text-white text-center py-2">
                        <p className="text-[8px] font-bold tracking-[0.2em] uppercase opacity-60 font-brand">Recorded with BeanLog</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-6">
                {isGenerating ? (
                    <div className="flex flex-col items-center text-white gap-2">
                        <div className="loader-white"></div>
                        <span className="text-xs">카드 만드는 중...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                        <img src={generatedImg} className="w-[300px] rounded-lg shadow-2xl mb-4" alt="Review Card" />
                        <p className="text-white text-sm font-bold animate-pulse">👆 이미지를 꾹 눌러 저장하세요</p>
                    </div>
                )}
                <button onClick={onClose} className="bg-white/20 text-white px-8 py-3 rounded-full font-bold backdrop-blur-sm hover:bg-white/30 transition-colors">
                    닫기
                </button>
                {generatedImg && (
                    <button onClick={handleDownload} className="text-white/60 text-xs hover:text-white underline">
                        다운로드 버튼으로 저장하기
                    </button>
                )}
            </div>
        </div>
    );
};
