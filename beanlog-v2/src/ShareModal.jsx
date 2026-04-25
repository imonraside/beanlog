import React, { useRef, useState } from 'react';
import { X, Download, Share2, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { CustomBeanIcon } from './Icons';
import { SCORE_LABELS_KO } from './constants';
import { parseTags, getFlagEmoji } from './utils';

export const ShareModal = ({ bean, tasting, onClose }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateImage = async () => {
        if (!cardRef.current) return null;
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, { 
                quality: 1, 
                pixelRatio: 2, 
                cacheBust: true,
                skipAutoScale: true,
            });
            return dataUrl;
        } catch (err) {
            console.error(err);
            alert("이미지 렌더링에 실패했습니다.");
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        const dataUrl = await generateImage();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `beanlog_${bean.name}_share.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    const handleShare = async () => {
        const dataUrl = await generateImage();
        if (dataUrl) {
            try {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `beanlog_share.png`, { type: 'image/png' });
                
                if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: bean.name });
                } else {
                    alert("이 브라우저에서는 이미지 직접 공유를 지원하지 않습니다. 다운로드를 이용해주세요.");
                }
            } catch (err) {
                console.error(err);
                alert("공유 중 오류가 발생했습니다.");
            }
        }
    };

    const notes = parseTags(tasting ? tasting.notes : bean.notes);
    
    // 상세 내용 추출 (시음 모드 vs 원두 모드 분기)
    const descText = tasting ? tasting.desc : bean.flavorDesc;
    const memoText = tasting ? tasting.memo : bean.memo;
    
    // 감성적인 그라데이션 배경 테마
    const bgGradient = "bg-gradient-to-br from-[#FFF8F0] via-[#FCEBDB] to-[#F1DECD]";
    const textColor = "text-[#4A2E1B]";

    const specs = [
        { label: "Region", value: bean.region },
        { label: "Variety", value: bean.variety },
        { label: "Process", value: bean.processing },
        { label: "Altitude", value: bean.altitude },
        { label: "Producer", value: bean.producer },
        { label: "Roast", value: bean.roastingLevel },
        { label: "Roast Date", value: bean.roastingDate },
        { label: "Shop", value: bean.shop },
    ].filter(s => s.value);

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 overflow-y-auto animate-in fade-in" onClick={onClose}>
            <div className="min-h-full flex flex-col items-center justify-center p-4 py-10">
                <div className="w-full max-w-[300px] flex justify-between items-center mb-4 text-white shrink-0" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold flex items-center gap-2"><ImageIcon size={16}/> 이미지 공유</h3>
                    <button onClick={onClose} className="p-1 bg-white/20 rounded-full hover:bg-white/30"><X size={18}/></button>
                </div>

                {/* 캡처용 컨테이너 */}
                <div className="relative w-[280px] rounded-3xl overflow-hidden shadow-2xl shrink-0" onClick={e => e.stopPropagation()}>
                    <div ref={cardRef} className={`w-full min-h-[497px] h-fit ${bgGradient} flex flex-col`}>
                        
                        <div className={`relative z-10 flex flex-col pb-5 flex-1`}>
                            <div className="flex-1 flex flex-col justify-center">
                                
                                <div className="relative px-5 pt-6 pb-4 mb-3 overflow-hidden">
                                    {bean.mainImage && (
                                        <>
                                            <div className="absolute inset-0 bg-cover bg-center opacity-50 blur-none scale-110" style={{ backgroundImage: `url("${bean.mainImage}")` }}></div>
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#FFF8F0]/30 via-[#FCEBDB]/60 to-[#FCEBDB]"></div>
                                        </>
                                    )}
                                    <div className="relative z-10">
                                        <div className="mb-5 mt-1">
                                            <div className="flex justify-between items-start mb-1">
                                                {bean.country ? <span className={`text-sm font-bold opacity-80 ${textColor}`}>{getFlagEmoji(bean.country) || '☕'} {bean.country}</span> : <span />}
                                                <div className="flex items-center gap-1.5 opacity-80">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-[#4A2E1B] text-white`}><CustomBeanIcon size={10}/></div>
                                                    <span className={`font-black tracking-widest text-[10px] uppercase ${textColor}`}>BeanLog</span>
                                                </div>
                                            </div>
                                            <h1 className={`text-2xl font-black ${textColor} leading-tight break-keep`}>{bean.name}</h1>
                                        </div>
                                        
                                        <div className={`grid grid-cols-2 gap-x-3 gap-y-2 border-y border-black/10 py-3`}>
                                            {bean.isBlend && bean.blendInfo && bean.blendInfo.length > 0 && (
                                                <div className="col-span-2 space-y-1 mb-1">
                                                    <span className={`text-[8px] font-bold uppercase tracking-wider opacity-60 ${textColor}`}>Blend Info</span>
                                                    {bean.blendInfo.map((info, idx) => (
                                                        <div key={idx} className={`text-[10px] font-bold ${textColor} flex justify-between`}>
                                                            <span>{getFlagEmoji(info.country)} {info.country} {info.variety}</span>
                                                            <span>{info.ratio}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {specs.map((s, idx) => (
                                                <div key={idx} className="flex flex-col min-w-0">
                                                    <span className={`text-[8px] font-bold uppercase tracking-wider opacity-60 ${textColor}`}>{s.label}</span>
                                                    <span className={`text-[10px] font-bold ${textColor} truncate`}>{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 flex flex-col flex-1 justify-start">
                                    {notes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {notes.map((note, idx) => (<span key={idx} className={`bg-white/70 text-[#4A2E1B] px-2 py-1 rounded-md text-[9px] font-bold shadow-sm`}>{note}</span>))}
                                        </div>
                                    )}

                                    {tasting && (
                                        <div className={`bg-white/40 backdrop-blur-sm border border-white/40 rounded-lg py-1.5 px-2 shadow-sm mb-3 flex justify-between items-center w-full`}>
                                            {Object.entries(tasting.scores).map(([key, val]) => (
                                                <span key={key} className={`text-[9px] font-bold ${textColor} flex items-center gap-0.5`}>
                                                    <span className="opacity-60">{SCORE_LABELS_KO[key] || key}</span>
                                                    <span className="font-black">{val}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5 flex-1 justify-start">
                                        {descText && (
                                            <div className={`bg-white/40 p-2.5 rounded-xl flex-shrink-0 backdrop-blur-sm`}>
                                                <p className={`text-[11px] font-medium leading-relaxed whitespace-pre-wrap ${textColor}`}>"{descText}"</p>
                                            </div>
                                        )}
                                        {memoText && (
                                            <div className={`bg-black/5 p-2.5 rounded-xl flex-shrink-0 backdrop-blur-sm`}>
                                                <p className={`text-[10px] font-medium leading-snug opacity-70 whitespace-pre-wrap ${textColor}`}>{memoText}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {tasting && tasting.date && (
                                        <div className={`mt-4 text-right text-[9px] font-bold opacity-60 ${textColor}`}>
                                            Tasted on {tasting.date}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="w-full max-w-[280px] flex gap-3 mt-6 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={handleDownload} disabled={isGenerating} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"><Download size={18}/> 다운로드</button>
                    <button onClick={handleShare} disabled={isGenerating} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"><Share2 size={18}/> 공유하기</button>
                </div>
            </div>
        </div>
    );
};
