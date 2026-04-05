import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { 
    Search, X, Check, ShoppingBag, Plus, Link, ExternalLink, Trash2, Camera, 
    FileText, CheckCircle2, RefreshCw, Zap, Calendar, Star, ChevronLeft, Quote, 
    StickyNote, MapPin, Tag, Layers, User, Mountain, Flame, Coffee, ArrowUpDown, 
    Sparkles, Palette, Image as ImageIcon, Share2, Minus, Calculator, PenTool, ChevronRight, Gift 
} from 'lucide-react';
import { CustomBeanIcon } from './Icons';
import { ImageCropper } from './ImageCropper';
import { FlavorPicker } from './FlavorPicker';
import { ShareModal } from './ShareModal';
import { BeanShareModal } from './BeanShareModal';
import { ScoreButton, ScoreButtonPlus } from './Buttons';
import { RadarChart } from './Charts';
import { STORAGE_KEY, INITIAL_BEAN, INITIAL_TASTING, TAB, TASTE_ITEMS } from './constants';
import { 
    idb, getDisplayScore, getMaxScoreVal, getMaxScore, getBestTastingNote, 
    parseTags, getFlagEmoji, getRoastAge, calcPricePer100g, calcAvg, 
    generateShareText, generateBeanShareText 
} from './utils';

export const BeansTab = ({ active, globalApiKey, navProps, onNavConsumed, navKey }) => {
    const VIEW = { 
        LIST: 'LIST', 
        DETAIL: 'DETAIL', 
        EDIT_BEAN: 'EDIT_BEAN', 
        EDIT_TASTING: 'EDIT_TASTING' 
    };
    const NOTE_MODE = { 
        BEAN: 'BEAN', 
        TASTING: 'TASTING' 
    };
    const SORT_MODE = { 
        CREATED_DESC: 'CREATED_DESC', 
        PURCHASE_DESC: 'PURCHASE_DESC', 
        ROAST_DESC: 'ROAST_DESC', 
        SCORE_DESC: 'SCORE_DESC', 
        STATUS_ASC: 'STATUS_ASC' 
    };
    const SORT_LABELS = { 
        [SORT_MODE.CREATED_DESC]: '최근 입력순', 
        [SORT_MODE.PURCHASE_DESC]: '최근 구매일순', 
        [SORT_MODE.ROAST_DESC]: '최근 로스팅순', 
        [SORT_MODE.SCORE_DESC]: '평점 높은순', 
        [SORT_MODE.STATUS_ASC]: '남은 원두 먼저' 
    };

    const [view, setView] = useState(VIEW.LIST);
    const [beans, setBeans] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [editTastingIdx, setEditTastingIdx] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMode, setFilterMode] = useState("ALL");
    const [listNoteMode, setListNoteMode] = useState(NOTE_MODE.BEAN);
    const [sortMode, setSortMode] = useState(SORT_MODE.CREATED_DESC);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [showImportInput, setShowImportInput] = useState(false);
    const [importUrl, setImportUrl] = useState("");
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [shareBeanData, setShareBeanData] = useState(null);
    const [beanMenuIdx, setBeanMenuIdx] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [showFlavorPicker, setShowFlavorPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null);
    const [beanForm, setBeanForm] = useState({ ...INITIAL_BEAN });
    const [tastingForm, setTastingForm] = useState({ ...INITIAL_TASTING });
    const [tempOcrImage, setTempOcrImage] = useState(null);
    const [cropImage, setCropImage] = useState(null);
    const [cropTargetField, setCropTargetField] = useState(null);
    const [cropRatio, setCropRatio] = useState(NaN);
    const [showRandomPopup, setShowRandomPopup] = useState(false);
    const [randomBean, setRandomBean] = useState(null);
    const [tastingMenuIdx, setTastingMenuIdx] = useState(null);
    const [showShopSuggestions, setShowShopSuggestions] = useState(false);
    const [showScorePopup, setShowScorePopup] = useState(false);
    
    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);
    const tastingDescRef = useRef(null);
    const tastingMemoRef = useRef(null);
    const beanFlavorDescRef = useRef(null);
    const beanMemoRef = useRef(null);

    const [shops, setShops] = useState([]);
    const [showShopList, setShowShopList] = useState(false);
    const [showAddShopModal, setShowAddShopModal] = useState(false);
    const [newShop, setNewShop] = useState({ name: "", url: "" });
    const SHOP_STORAGE_KEY = `${STORAGE_KEY}_shops`;
    
    const addBlendInfo = () => setBeanForm(prev => ({ 
        ...prev, 
        blendInfo: [...(prev.blendInfo || []), { country: "", variety: "", ratio: "" }] 
    }));
    
    const removeBlendInfo = (idx) => setBeanForm(prev => ({ 
        ...prev, 
        blendInfo: prev.blendInfo.filter((_, i) => i !== idx) 
    }));
    
    const updateBlendInfo = (idx, field, val) => setBeanForm(prev => ({ 
        ...prev, 
        blendInfo: prev.blendInfo.map((item, i) => i === idx ? { ...item, [field]: val } : item) 
    }));

    useEffect(() => {
        if (active && view === VIEW.EDIT_TASTING) {
            const timer = setTimeout(() => {
                if (tastingDescRef.current) {
                    tastingDescRef.current.style.height = 'auto';
                    tastingDescRef.current.style.height = tastingDescRef.current.scrollHeight + 'px';
                }
                if (tastingMemoRef.current) {
                    tastingMemoRef.current.style.height = 'auto';
                    tastingMemoRef.current.style.height = tastingMemoRef.current.scrollHeight + 'px';
                }
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [active, view, tastingForm.desc, tastingForm.memo]);

    useEffect(() => {
        if (active && view === VIEW.EDIT_BEAN) {
            const timer = setTimeout(() => {
                if (beanFlavorDescRef.current) {
                    beanFlavorDescRef.current.style.height = 'auto';
                    beanFlavorDescRef.current.style.height = beanFlavorDescRef.current.scrollHeight + 'px';
                }
                if (beanMemoRef.current) {
                    beanMemoRef.current.style.height = 'auto';
                    beanMemoRef.current.style.height = beanMemoRef.current.scrollHeight + 'px';
                }
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [active, view, beanForm.flavorDesc, beanForm.memo]);

    const mainRef = useRef(null);
    const scrollMap = useRef({});

    const saveScrollPosition = (currentView, currentId) => { 
        if (mainRef.current) { 
            const key = currentView === VIEW.DETAIL ? `DETAIL-${currentId}` : currentView; 
            scrollMap.current[key] = mainRef.current.scrollTop; 
        } 
    };

    useLayoutEffect(() => { 
        if (active && mainRef.current) { 
            requestAnimationFrame(() => { 
                const key = view === VIEW.DETAIL ? `DETAIL-${selectedId}` : view; 
                mainRef.current.scrollTop = scrollMap.current[key] || 0; 
            }); 
        } 
    }, [view, selectedId]);

    const updateView = (newView, id = null) => { 
        saveScrollPosition(view, selectedId); 
        window.history.pushState({ view: newView, id, tab: TAB.BEANS }, ''); 
        setView(newView); 
        setSelectedId(id); 
    };

    const replaceView = (newView, id = null) => { 
        saveScrollPosition(view, selectedId); 
        window.history.replaceState({ view: newView, id, tab: TAB.BEANS }, ''); 
        setView(newView); 
        setSelectedId(id); 
    };

    const goBack = () => window.history.back();

    const pickRandomBean = () => { 
        const availableBeans = beans.filter(b => !b.isFinished && b.weight && parseFloat(b.weight) > 0); 
        if (availableBeans.length === 0) { 
            showToastMsg("추천할 원두가 없습니다. (조건: 보유 중인 원두)"); 
            return; 
        } 
        const random = availableBeans[Math.floor(Math.random() * availableBeans.length)]; 
        setRandomBean(random); 
        window.history.pushState({ view, id: selectedId, tab: TAB.BEANS, modal: 'RANDOM' }, ''); 
        setShowRandomPopup(true); 
    };

    useEffect(() => {
        if (active && navProps && beans.length > 0) {
            if (navProps.view === 'EDIT_TASTING' && navProps.beanId) {
                const targetBean = beans.find(b => String(b.id) === String(navProps.beanId));
                if (targetBean) {
                    const targetTasting = navProps.tasting || (targetBean.tastings ? targetBean.tastings[0] : null);
                    if (targetTasting) { 
                        setSelectedId(navProps.beanId); 
                        const tIdx = targetBean.tastings.findIndex(t => 
                            t === targetTasting || 
                            (t.date === targetTasting.date && JSON.stringify(t.scores) === JSON.stringify(targetTasting.scores))
                        ); 
                        setEditTastingIdx(tIdx !== -1 ? tIdx : 0); 
                        setTastingForm(targetTasting); 
                        setView(VIEW.EDIT_TASTING); 
                    } else { 
                        setSelectedId(navProps.beanId); 
                        setView(VIEW.DETAIL); 
                    }
                }
            } else if (navProps.view === 'DETAIL' && navProps.beanId) { 
                setSelectedId(navProps.beanId); 
                setView(VIEW.DETAIL); 
            }
            onNavConsumed();
        }
    }, [active, navProps, beans, onNavConsumed]);

    useEffect(() => {
        if (!active) return;
        const handlePop = (event) => {
            if(showAddShopModal) { setShowAddShopModal(false); return; } 
            if(showShopList) { setShowShopList(false); return; } 
            if(showAddMenu) { setShowAddMenu(false); return; } 
            if(showImportInput) { setShowImportInput(false); return; } 
            if(shareBeanData) { setShareBeanData(null); return; } 
            if(beanMenuIdx !== null) { setBeanMenuIdx(null); return; } 
            if(shareData) { setShareData(null); return; } 
            if(cropImage) { setCropImage(null); return; } 
            if(showFlavorPicker) { setShowFlavorPicker(false); return; } 
            if(showRandomPopup) { setShowRandomPopup(false); return; } 
            if(tastingMenuIdx !== null) { setTastingMenuIdx(null); return; } 
            if(showScorePopup) { setShowScorePopup(false); return; }
            
            if (event.state && event.state.tab === TAB.BEANS) { 
                if (event.state.view) { 
                    setView(event.state.view); 
                    if (event.state.id !== undefined) setSelectedId(event.state.id); 
                } 
            } else if (!event.state) { 
                setView(VIEW.LIST); 
                setSelectedId(null); 
            }
        };
        window.addEventListener('popstate', handlePop); 
        return () => window.removeEventListener('popstate', handlePop);
    }, [
        active, shareData, cropImage, showFlavorPicker, showRandomPopup, tastingMenuIdx, 
        shareBeanData, beanMenuIdx, showImportInput, showAddMenu, showShopList, 
        showAddShopModal, showScorePopup
    ]);

    useEffect(() => {
        if (!active) return;
        const params = new URLSearchParams(window.location.search);
        const shareCode = params.get('share');
        if (shareCode) { 
            try { 
                const json = decodeURIComponent(escape(atob(shareCode.replace(/ /g, '+')))); 
                const data = JSON.parse(json); 
                setBeanForm({ ...INITIAL_BEAN, ...data }); 
                setTempOcrImage(null); 
                setView(VIEW.EDIT_BEAN); 
                showToastMsg("공유된 원두 정보를 불러왔습니다."); 
                window.history.replaceState({ view: VIEW.LIST, tab: TAB.BEANS }, '', window.location.pathname); 
                window.history.pushState({ view: VIEW.EDIT_BEAN, tab: TAB.BEANS }, '', window.location.pathname); 
            } catch (e) { 
                console.error(e); 
                showToastMsg("잘못된 공유 링크입니다."); 
            } 
        }
    }, [active]);

    useEffect(() => { 
        if (active && !navProps) { 
            if (new URLSearchParams(window.location.search).has('share')) return; 
            const currentState = window.history.state; 
            if (currentState && currentState.view && currentState.tab === TAB.BEANS) { 
                setView(currentState.view); 
                setSelectedId(currentState.id || null); 
            } else { 
                if (!selectedId) setView(VIEW.LIST); 
            } 
        } 
    }, [active, navProps, navKey]);

    const openLink = (url) => { 
        if (!url) return; 
        let target = url; 
        if (!/^https?:\/\//i.test(target)) { 
            target = 'http://' + target; 
        } 
        window.open(target, '_blank'); 
    };

    useEffect(() => { 
        const load = async () => { 
            try { 
                const loadedData = await idb.get(`${STORAGE_KEY}_data`); 
                if (Array.isArray(loadedData)) { 
                    setBeans(loadedData.map(b => ({ 
                        ...INITIAL_BEAN, 
                        ...b, 
                        tastings: Array.isArray(b.tastings) ? b.tastings : [] 
                    }))); 
                } 
                const loadedShops = await idb.get(SHOP_STORAGE_KEY); 
                if (Array.isArray(loadedShops)) { 
                    setShops(loadedShops); 
                } 
                const savedNoteMode = await idb.get(`${STORAGE_KEY}_note_mode`); 
                if (savedNoteMode) setListNoteMode(savedNoteMode); 
                const savedSortMode = await idb.get(`${STORAGE_KEY}_sort_mode`); 
                if (savedSortMode) setSortMode(savedSortMode); 
            } catch (e) { 
                console.error(e); 
            } 
        }; 
        load(); 
    }, [active]);

    const showToastMsg = (msg) => { 
        setToast(msg); 
        setTimeout(() => setToast(null), 3000); 
    };
    
    const activeBean = useMemo(() => beans.find(b => String(b.id) === String(selectedId)) || null, [beans, selectedId]);
    const isActiveBeanFree = activeBean && activeBean.weight && parseFloat(activeBean.weight) > 0 && activeBean.price && parseFloat(activeBean.price) === 0;
    
    const onSelectFile = (e, field) => { 
        if (e.target.files && e.target.files.length > 0) { 
            const reader = new FileReader(); 
            reader.readAsDataURL(e.target.files[0]); 
            reader.onload = () => { 
                setCropImage(reader.result); 
                setCropTargetField(field); 
                setCropRatio(field === 'main' ? 1 : NaN); 
            }; 
        } 
        e.target.value = null; 
    };
    
    const onCropFinish = (croppedBase64) => { 
        if (cropTargetField === 'main') {
            setBeanForm(prev => ({ ...prev, mainImage: croppedBase64 })); 
        } else if (cropTargetField === 'ocr') {
            setTempOcrImage(croppedBase64); 
        }
        setCropImage(null); 
    };
    
    const runOCR = async () => {
        if (!tempOcrImage) return showToastMsg("분석할 사진을 등록해주세요."); 
        if (!globalApiKey) return showToastMsg("설정 탭에서 API 키를 입력해주세요."); 
        setIsProcessing(true);
        
        try {
            const base64Data = tempOcrImage.split(',')[1]; 
            const promptText = `Analyze the coffee bean image and return a valid JSON object. Rules: 1. Extract 'altitude' (look for 'm', 'masl'). 2. Separate 'notes' (short) and 'flavorDesc'. 3. Translate 'notes', 'flavorDesc', 'memo' to KOREAN. 4. Dates YYYY-MM-DD. 5. Return ONLY JSON. Keys: { "name": "", "country": "", "region": "", "altitude": "", "variety": "", "processing": "", "roastingLevel": "", "producer": "", "shop": "", "roastingDate": "", "purchaseUrl": "", "price": "", "weight": "", "notes": "", "flavorDesc": "", "memo": "" }`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${globalApiKey}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    contents: [{ 
                        parts: [ 
                            { text: promptText }, 
                            { inlineData: { mimeType: "image/jpeg", data: base64Data } } 
                        ] 
                    }], 
                    generationConfig: { responseMimeType: "application/json" } 
                }) 
            });
            
            const res = await response.json(); 
            const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) { 
                const clean = text.replace(/```json|```/g, "").trim(); 
                setBeanForm(p => ({ ...p, ...JSON.parse(clean) })); 
                showToastMsg("정보 입력 완료!"); 
            } else {
                throw new Error();
            }
        } catch (e) { 
            showToastMsg("분석 실패"); 
            console.error(e); 
        } finally { 
            setIsProcessing(false); 
        }
    };
    
    const saveData = async (updatedBeans, nextId, isNew) => { 
        if(await idb.set(`${STORAGE_KEY}_data`, updatedBeans)) { 
            setBeans(updatedBeans); 
            setIsSaving(false); 
            setTimeout(() => { 
                setTempOcrImage(null); 
                if (isNew !== null) { 
                    if (isNew) { 
                        replaceView(VIEW.DETAIL, nextId); 
                    } else { 
                        goBack(); 
                    } 
                } else { 
                    goBack(); 
                } 
            }, 100); 
        } else { 
            setIsSaving(false); 
            showToastMsg("저장 실패!"); 
        } 
    };
    
    const handleSaveBean = () => { 
        if (!beanForm.name.trim()) return showToastMsg("이름 입력 필요"); 
        setIsSaving(true); 
        setTimeout(() => { 
            const isNew = !beanForm.id; 
            const id = isNew ? Date.now() : beanForm.id; 
            const newBean = { ...beanForm, id, tastings: beanForm.tastings || [], ocrImage: null }; 
            let newBeans = !isNew 
                ? beans.map(b => String(b.id) === String(id) ? newBean : b) 
                : [newBean, ...beans]; 
            saveData(newBeans, id, isNew); 
        }, 300); 
    };
    
    const handleSaveTasting = () => { 
        if (!selectedId) return; 
        setIsSaving(true); 
        setTimeout(() => { 
            const newBeans = beans.map(b => { 
                if (String(b.id) === String(selectedId)) { 
                    const tList = [...b.tastings]; 
                    const { _isNew, ...tastingToSave } = tastingForm; 
                    if (editTastingIdx !== null) {
                        tList[editTastingIdx] = tastingToSave; 
                    } else {
                        tList.unshift({ ...tastingToSave, id: Date.now() }); 
                    }
                    return { ...b, tastings: tList }; 
                } 
                return b; 
            }); 
            saveData(newBeans, selectedId, false); 
        }, 300); 
    };
    
    const handleDelete = async () => { 
        if (confirm("삭제하시겠습니까?")) { 
            const newBeans = beans.filter(b => String(b.id) !== String(selectedId)); 
            if (await idb.set(`${STORAGE_KEY}_data`, newBeans)) { 
                setBeans(newBeans); 
                updateView(VIEW.LIST); 
            } 
        } 
    };
    
    const handleDeleteTasting = () => { 
        if (confirm("삭제?")) { 
            const newBeans = beans.map(b => { 
                if (String(b.id) === String(selectedId)) { 
                    return { ...b, tastings: b.tastings.filter((_, i) => i !== editTastingIdx) }; 
                } 
                return b; 
            }); 
            saveData(newBeans, selectedId, false); 
        } 
    };
    
    const updateScore = (id, delta) => { 
        setTastingForm(prev => { 
            let nextVal = prev.scores[id] + delta; 
            if (nextVal < 0) nextVal = 0; 
            if (nextVal > 10) nextVal = 10; 
            nextVal = Math.round(nextVal * 10) / 10; 
            return { ...prev, scores: { ...prev.scores, [id]: nextVal } }; 
        }); 
    };
    
    const handleTextShare = async (bean, tasting) => { 
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
    
    const handleDeleteTastingItem = (idx) => { 
        if (confirm("이 시음 기록을 삭제하시겠습니까?")) { 
            const newBeans = beans.map(b => { 
                if (String(b.id) === String(selectedId)) { 
                    return { ...b, tastings: b.tastings.filter((_, i) => i !== idx) }; 
                } 
                return b; 
            }); 
            saveData(newBeans, selectedId, false); 
            setTastingMenuIdx(null); 
        } 
    };
    
    const handleTouchStart = (idx) => { 
        isLongPress.current = false; 
        longPressTimer.current = setTimeout(() => { 
            isLongPress.current = true; 
            setTastingMenuIdx(idx); 
            if (navigator.vibrate) navigator.vibrate(50); 
        }, 2000); 
    };
    
    const handleTouchEnd = () => { 
        if (longPressTimer.current) clearTimeout(longPressTimer.current); 
    };
    
    const handleBeanTouchStart = (id) => { 
        isLongPress.current = false; 
        longPressTimer.current = setTimeout(() => { 
            isLongPress.current = true; 
            setBeanMenuIdx(id); 
            if (navigator.vibrate) navigator.vibrate(50); 
        }, 2000); 
    };
    
    const handleBeanTouchEnd = () => { 
        if (longPressTimer.current) clearTimeout(longPressTimer.current); 
    };
    
    const handleBeanTextShare = async (bean) => { 
        const text = generateBeanShareText(bean); 
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
        setBeanMenuIdx(null); 
    };

    const handleAppShare = async () => {
        const bean = beans.find(b => b.id === beanMenuIdx); 
        if (!bean) return;
        
        const shareObj = { 
            name: bean.name, country: bean.country, region: bean.region, 
            variety: bean.variety, processing: bean.processing, altitude: bean.altitude, 
            roastingLevel: bean.roastingLevel, producer: bean.producer, shop: bean.shop, 
            roastingDate: bean.roastingDate, purchaseDate: bean.purchaseDate, 
            purchaseUrl: bean.purchaseUrl, price: bean.price, weight: bean.weight, 
            pricePerCup: bean.pricePerCup, notes: bean.notes, flavorDesc: bean.flavorDesc, 
            memo: bean.memo, isBlend: bean.isBlend, blendInfo: bean.blendInfo 
        };
        
        try {
            const json = JSON.stringify(shareObj); 
            const encoded = btoa(unescape(encodeURIComponent(json))); 
            const longUrl = `${window.location.href.split('?')[0]}?share=${encodeURIComponent(encoded)}`; 
            let shareUrl = longUrl;
            
            try { 
                showToastMsg("링크 단축 중..."); 
                const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`); 
                if (res.ok) { 
                    const short = await res.text(); 
                    if(short.startsWith('http')) shareUrl = short; 
                } 
            } catch { 
                console.log("Shortening failed"); 
            }
            
            if (navigator.share) { 
                await navigator.share({ 
                    title: bean.name, 
                    text: `[BeanLog] ${bean.name} 원두 정보 공유`, 
                    url: shareUrl 
                }); 
            } else { 
                await navigator.clipboard.writeText(shareUrl); 
                showToastMsg("공유 링크가 복사되었습니다."); 
            }
        } catch (e) { 
            console.error(e); 
            showToastMsg("공유 실패"); 
        }
        setBeanMenuIdx(null);
    };

    const handleImportBean = async () => {
        if (!importUrl.trim()) return; 
        showToastMsg("링크 정보를 확인하는 중...");
        
        try {
            let shareCode = null; 
            try { 
                const urlObj = new URL(importUrl); 
                shareCode = new URLSearchParams(urlObj.search).get('share'); 
            } catch {'error'}
            
            if (!shareCode) { 
                try { 
                    const res = await fetch(`https://unshorten.me/json/${encodeURIComponent(importUrl)}`); 
                    if (res.ok) { 
                        const json = await res.json(); 
                        if (json.resolved_url) { 
                            shareCode = new URLSearchParams(new URL(json.resolved_url).search).get('share'); 
                        } 
                    } 
                } catch { 
                    console.log("Expansion failed"); 
                } 
            }
            
            if (shareCode) { 
                const json = decodeURIComponent(escape(atob(shareCode.replace(/ /g, '+')))); 
                const data = JSON.parse(json); 
                setBeanForm({ ...INITIAL_BEAN, ...data }); 
                setTempOcrImage(null); 
                updateView(VIEW.EDIT_BEAN); 
                showToastMsg("원두 정보를 불러왔습니다."); 
                setShowImportInput(false); 
                setImportUrl(""); 
            } else { 
                showToastMsg("데이터를 찾을 수 없습니다. (긴 주소를 입력해주세요)"); 
            }
        } catch (e) { 
            console.error(e); 
            showToastMsg("오류가 발생했습니다."); 
        }
    };

    const openShopList = () => { 
        window.history.pushState({ view, id: selectedId, tab: TAB.BEANS, modal: 'SHOP_LIST' }, ''); 
        setShowShopList(true); 
    };
    
    const handleAddShop = async () => { 
        if (!newShop.name.trim()) { 
            showToastMsg("구매처 이름을 입력해주세요."); 
            return; 
        } 
        const updatedShops = [...shops, { ...newShop, id: Date.now() }]; 
        if (await idb.set(SHOP_STORAGE_KEY, updatedShops)) { 
            setShops(updatedShops); 
            setShowAddShopModal(false); 
            setNewShop({ name: "", url: "" }); 
            showToastMsg("구매처가 추가되었습니다."); 
        } else { 
            showToastMsg("저장 실패!"); 
        } 
    };
    
    const handleDeleteShop = async (shopId, e) => { 
        e.stopPropagation(); 
        if (confirm("이 구매처를 목록에서 삭제하시겠습니까?")) { 
            const updatedShops = shops.filter(s => s.id !== shopId); 
            if (await idb.set(SHOP_STORAGE_KEY, updatedShops)) { 
                setShops(updatedShops); 
                showToastMsg("구매처가 삭제되었습니다."); 
            } else { 
                showToastMsg("삭제 실패!"); 
            } 
        } 
    };
    
    const combinedShops = useMemo(() => { 
        const shopMap = new Map(); 
        shops.forEach(shop => { 
            if (shop.name) { 
                shopMap.set(shop.name.toLowerCase(), { id: shop.id, name: shop.name, url: shop.url, isManaged: true }); 
            } 
        }); 
        beans.forEach(bean => { 
            if (bean.shop && bean.purchaseUrl && !shopMap.has(bean.shop.toLowerCase())) { 
                shopMap.set(bean.shop.toLowerCase(), { id: `bean-${bean.id}`, name: bean.shop, url: bean.purchaseUrl, isManaged: false }); 
            } 
        }); 
        return Array.from(shopMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko')); 
    }, [beans, shops]);
    
    const handleShopChange = (e) => { 
        const val = e.target.value; 
        const match = combinedShops.find(s => s.name.toLowerCase() === val.toLowerCase() && s.url); 
        setBeanForm(prev => ({ ...prev, shop: val, purchaseUrl: match ? match.url : prev.purchaseUrl })); 
        if (match && match.url !== beanForm.purchaseUrl) { 
            showToastMsg(`URL 자동 입력: ${match.name}`); 
        } 
    };
    
    const sortedBeans = useMemo(() => { 
        let result = beans; 
        if (filterMode === 'BEAN') result = result.filter(b => b.weight); 
        else if (filterMode === 'CUP') result = result.filter(b => b.pricePerCup); 
        
        if (searchTerm.trim()) { 
            const terms = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0); 
            result = result.filter(bean => { 
                const text = [
                    bean.name, bean.country, bean.region, bean.variety, 
                    bean.processing, bean.roastingLevel, bean.shop, bean.notes, 
                    bean.flavorDesc, bean.memo, 
                    ...(bean.tastings ? bean.tastings.map(t => `${t.notes} ${t.memo}`) : [])
                ].join(" ").toLowerCase(); 
                return terms.every(t => text.includes(t)); 
            }); 
        } 
        return [...result].sort((a, b) => { 
            switch (sortMode) { 
                case SORT_MODE.PURCHASE_DESC: 
                    if (!a.purchaseDate) return 1; 
                    if (!b.purchaseDate) return -1; 
                    return b.purchaseDate.localeCompare(a.purchaseDate); 
                case SORT_MODE.ROAST_DESC: { 
                    const getRank = (item) => { 
                        const isBean = !!item.weight; 
                        if (isBean) return item.isFinished ? 1 : 0; 
                        return 2; 
                    }; 
                    const rankA = getRank(a); 
                    const rankB = getRank(b); 
                    if (rankA !== rankB) return rankA - rankB; 
                    
                    if (!a.roastingDate) return 1; 
                    if (!b.roastingDate) return -1; 
                    return b.roastingDate.localeCompare(a.roastingDate); 
                }
                case SORT_MODE.SCORE_DESC: { 
                    const scoreA = getMaxScoreVal(a.tastings); 
                    const scoreB = getMaxScoreVal(b.tastings); 
                    if (scoreA !== scoreB) return scoreB - scoreA; 
                    return b.id - a.id; 
                }
                case SORT_MODE.STATUS_ASC: { 
                    const getRank = (item) => { 
                        const isBean = !!item.weight; 
                        if (isBean) return item.isFinished ? 1 : 0; 
                        return 2; 
                    }; 
                    const rankA = getRank(a); 
                    const rankB = getRank(b); 
                    if (rankA !== rankB) return rankA - rankB; 
                    return b.id - a.id; 
                }
                case SORT_MODE.CREATED_DESC: 
                default: 
                    return b.id - a.id; 
            } 
        }); 
    }, [beans, searchTerm, filterMode, sortMode]);

    if(!active) return null;

    return (
        <div className={`h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative ${active ? 'block' : 'hidden'}`}>
            {showImportInput && (
                <div className="fixed inset-0 z-[70] bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowImportInput(false)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-6 shadow-xl animate-pop space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">공유 링크로 원두 추가</h3>
                        <input 
                            className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" 
                            placeholder="https://..." 
                            value={importUrl} 
                            onChange={(e) => setImportUrl(e.target.value)} 
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowImportInput(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold">취소</button>
                            <button onClick={handleImportBean} className="flex-1 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold">불러오기</button>
                        </div>
                    </div>
                </div>
            )}
            
            {cropImage && <ImageCropper imageSrc={cropImage} aspectRatio={cropRatio} onComplete={onCropFinish} onCancel={() => setCropImage(null)} />}
            
            {showShopList && (
                <div className="fixed inset-0 z-[70] bg-black/50 dark:bg-black/70 flex items-end" onClick={() => window.history.back()}>
                    <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl h-[60%] p-5 flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-lg dark:text-white flex items-center gap-2"><ShoppingBag size={20}/> 구매처 목록</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowAddShopModal(true)} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold flex items-center gap-1"><Plus size={14}/> 추가</button>
                                <button onClick={() => window.history.back()} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400"><X size={18}/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pb-10">
                            {combinedShops.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">등록된 구매처가 없습니다.</div>
                            ) : (
                                combinedShops.map(shop => (
                                    <div key={shop.id || shop.name} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold dark:text-white truncate">{shop.name}</h3>
                                            {shop.url && <p className="text-xs text-slate-400 truncate">{shop.url}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            {shop.url && <button onClick={() => openLink(shop.url)} className="p-2 bg-white dark:bg-slate-700 rounded-full text-blue-500"><ExternalLink size={16}/></button>}
                                            {shop.isManaged && <button onClick={(e) => handleDeleteShop(shop.id, e)} className="p-2 bg-white dark:bg-slate-700 rounded-full text-red-400"><Trash2 size={16}/></button>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {showAddShopModal && (
                <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddShopModal(false)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-6 shadow-xl animate-pop space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">새 구매처 추가</h3>
                        <input 
                            className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" 
                            placeholder="구매처 이름" 
                            value={newShop.name} 
                            onChange={(e) => setNewShop({...newShop, name: e.target.value})} 
                        />
                        <input 
                            className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" 
                            placeholder="웹사이트 URL (선택)" 
                            value={newShop.url} 
                            onChange={(e) => setNewShop({...newShop, url: e.target.value})} 
                        />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowAddShopModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold">취소</button>
                            <button onClick={handleAddShop} className="flex-1 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold">추가</button>
                        </div>
                    </div>
                </div>
            )}
            
            {shareBeanData && <BeanShareModal bean={shareBeanData} onClose={() => setShareBeanData(null)} />}
            
            {shareData && <ShareModal bean={shareData.bean} tasting={shareData.tasting} onClose={() => setShareData(null)} />}
            
            {showFlavorPicker && (
                <FlavorPicker 
                    onClose={() => setShowFlavorPicker(false)} 
                    onConfirm={(text) => { 
                        if (pickerTarget === 'bean') { 
                            setBeanForm(prev => ({ ...prev, notes: text })); 
                        } else if (pickerTarget === 'tasting') { 
                            setTastingForm(prev => ({ ...prev, notes: text })); 
                        } 
                        setShowFlavorPicker(false); 
                    }} 
                    initialNotes={pickerTarget === 'bean' ? beanForm.notes : tastingForm.notes} 
                />
            )}
            
            {showRandomPopup && randomBean && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={() => window.history.back()}>
                    <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative overflow-hidden animate-[scaleIn_0.2s_ease-out]" style={{ animation: 'pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 flex justify-between items-center border-b border-amber-100 dark:border-amber-900/30">
                            <div className="flex items-center gap-1.5 text-amber-600">
                                <Sparkles size={16} fill="currentColor" />
                                <span className="text-xs font-bold uppercase tracking-wider">Today's Pick</span>
                            </div>
                            <button onClick={() => window.history.back()} className="bg-white dark:bg-slate-800 text-slate-400 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={16}/></button>
                        </div>
                        <div className="p-6 pt-5 text-center flex flex-col items-center gap-1">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1 break-keep word-keep">{randomBean.name}</h2>
                            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                {randomBean.country && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700">{randomBean.country}</span>}
                                {randomBean.roastingLevel && <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-[10px] font-bold border border-amber-100 dark:border-amber-900/30">{randomBean.roastingLevel}</span>}
                            </div>
                            {randomBean.notes && (<p className="text-xs text-slate-400 mb-6 line-clamp-1">"{randomBean.notes}"</p>)}
                            <button onClick={() => { setShowRandomPopup(false); replaceView(VIEW.DETAIL, randomBean.id); }} className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none">상세 정보 보기</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showScorePopup && (
                <div className="fixed inset-0 z-[70] bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowScorePopup(false)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-xl animate-pop space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">점수 입력</h3>
                            <button onClick={() => setShowScorePopup(false)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><X size={18}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {TASTE_ITEMS.map(item => (
                                <div key={item.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center gap-2">
                                    <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <ScoreButton onClick={() => updateScore(item.id, -0.1)} icon={<Minus size={14} className="text-slate-400"/>} />
                                        <input type="number" value={tastingForm.scores[item.id]} onChange={(e) => setTastingForm(prev => ({ ...prev, scores: { ...prev.scores, [item.id]: e.target.value } }))} className="w-12 text-center font-black text-xl bg-transparent outline-none p-0 m-0 border-0 focus:ring-0 dark:text-white" />
                                        <ScoreButtonPlus onClick={() => updateScore(item.id, +0.1)} icon={<Plus size={14} className="text-white"/>} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowScorePopup(false)} className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold">확인</button>
                    </div>
                </div>
            )}
            
            {toast && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl z-[70] whitespace-nowrap">{toast}</div>}

            {view === VIEW.LIST && (
                <>
                    <header className="p-5 pb-3 pt-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-black font-brand flex items-center gap-1 dark:text-white">BeanLog <CustomBeanIcon size={24} className="text-[#4b2c20] dark:text-amber-500"/></h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-brand">Coffee bean archive</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={openShopList} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"><ShoppingBag size={18}/></button>
                                <button onClick={pickRandomBean} className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-900/30 active:scale-95 transition-transform"><Sparkles size={18}/></button>
                                <div className="relative">
                                    <button onClick={() => setShowAddMenu(!showAddMenu)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${showAddMenu ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                        <Plus size={20}/>
                                    </button>
                                    {showAddMenu && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)}></div>
                                            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 p-2 z-30 flex flex-col gap-1 animate-in slide-in-from-top-2">
                                                <button onClick={() => { setShowAddMenu(false); setBeanForm({ ...INITIAL_BEAN }); setTempOcrImage(null); updateView(VIEW.EDIT_BEAN); }} className="text-left px-3 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                    <Plus size={16}/> 직접 추가
                                                </button>
                                                <button onClick={() => { setShowAddMenu(false); setShowImportInput(true); }} className="text-left px-3 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                    <Link size={16}/> 링크로 추가
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 pl-10 rounded-2xl text-sm font-bold outline-none" 
                                placeholder="검색..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <X size={16} fill="currentColor" className="text-slate-300"/>
                                </button>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="flex-1 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {["ALL", "BEAN", "CUP"].map(mode => (
                                    <button 
                                        key={mode} 
                                        onClick={() => setFilterMode(mode)} 
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === mode ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {mode === 'ALL' ? '전체' : (mode === 'BEAN' ? '원두' : '한잔')}
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => { 
                                    const newMode = listNoteMode === NOTE_MODE.BEAN ? NOTE_MODE.TASTING : NOTE_MODE.BEAN; 
                                    setListNoteMode(newMode); 
                                    idb.set(`${STORAGE_KEY}_note_mode`, newMode); 
                                    showToastMsg(newMode === NOTE_MODE.BEAN ? "원두 노트 보기" : "시음 노트 보기"); 
                                }} 
                                className="px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                {listNoteMode === NOTE_MODE.BEAN ? <CustomBeanIcon size={18}/> : <Coffee size={18}/>}
                            </button>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setShowSortMenu(!showSortMenu)} 
                                    className={`h-full px-3 rounded-xl flex items-center justify-center transition-colors ${showSortMenu ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                >
                                    <ArrowUpDown size={16} />
                                </button>
                                {showSortMenu && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)}></div>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 p-2 z-30 flex flex-col gap-1 animate-in slide-in-from-top-2">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b dark:border-slate-700 mb-1">Sort By</div>
                                            {[SORT_MODE.CREATED_DESC, SORT_MODE.PURCHASE_DESC, SORT_MODE.ROAST_DESC, SORT_MODE.SCORE_DESC, SORT_MODE.STATUS_ASC].map(mode => (
                                                <button 
                                                    key={mode} 
                                                    onClick={() => { setSortMode(mode); idb.set(`${STORAGE_KEY}_sort_mode`, mode); setShowSortMenu(false); }} 
                                                    className={`text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${sortMode === mode ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                >
                                                    <span>{SORT_LABELS[mode]}</span> {sortMode === mode && <Check size={14}/>}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {sortMode !== SORT_MODE.CREATED_DESC && (
                            <div className="flex justify-end">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded flex items-center gap-1">{SORT_LABELS[sortMode]} 정렬 중 <ArrowUpDown size={10}/></span>
                            </div>
                        )}
                    </header>
                    
                    <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-24" ref={mainRef}>
                        {sortedBeans.length === 0 ? (
                            <div className="py-20 text-center opacity-40 font-bold">{searchTerm ? "검색 결과 없음" : "기록이 없습니다"}</div>
                        ) : (
                            sortedBeans.map(bean => {
                                const isFree = bean.weight && parseFloat(bean.weight) > 0 && bean.price && parseFloat(bean.price) === 0;
                                return (
                                <div 
                                    key={bean.id} 
                                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border dark:border-slate-800 flex items-start gap-4 active:scale-95 transition-transform relative overflow-hidden select-none" 
                                    onTouchStart={() => handleBeanTouchStart(bean.id)} 
                                    onTouchEnd={handleBeanTouchEnd} 
                                    onMouseDown={() => handleBeanTouchStart(bean.id)} 
                                    onMouseUp={handleBeanTouchEnd} 
                                    onMouseLeave={handleBeanTouchEnd} 
                                    onContextMenu={(e) => { e.preventDefault(); setBeanMenuIdx(bean.id); }} 
                                    onClick={() => { if (isLongPress.current) return; if (beanMenuIdx !== null) { setBeanMenuIdx(null); return; } updateView(VIEW.DETAIL, bean.id); }}
                                >
                                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                                        <div className={`w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center ${bean.isFinished ? 'text-slate-300 dark:text-slate-600' : 'text-amber-800 dark:text-amber-500'}`}>
                                            {bean.mainImage ? <img src={bean.mainImage} className="w-full h-full object-cover"/> : <CustomBeanIcon size={32}/>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {bean.tastings.length > 0 && (
                                                <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 border border-amber-100 dark:border-amber-900/30">
                                                    <Star size={8} fill="currentColor"/> {getMaxScore(bean.tastings)}
                                                </span>
                                            )}
                                            <div className="relative flex items-center justify-center">
                                                {bean.isFinished ? (
                                                    <CustomBeanIcon size={14} className="text-slate-300 dark:text-slate-600"/>
                                                ) : (
                                                    bean.weight ? <CustomBeanIcon size={14} className="text-amber-700 dark:text-amber-500"/> : <Coffee size={14} className="text-slate-700 dark:text-slate-400"/>
                                                )}
                                                {isFree && (
                                                    <div className="absolute -bottom-1 -right-1.5 text-orange-500 drop-shadow-sm">
                                                        <Gift size={10} strokeWidth={2.5} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="font-black text-lg break-words leading-tight text-slate-900 dark:text-slate-100">{bean.name}</h3>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-normal leading-relaxed break-words">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{bean.shop || "-"}</span>
                                            <span className="mx-1">·</span>{bean.roastingLevel || "-"}
                                            <span className="mx-1">·</span>{bean.purchaseDate || "-"}
                                            {bean.weight && bean.roastingDate && !bean.isFinished && (
                                                <>
                                                    <span className="mx-1">·</span>
                                                    <span className="text-amber-600 dark:text-amber-500 font-bold">{getRoastAge(bean.roastingDate)}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="text-slate-400 text-xs mt-1 leading-tight line-clamp-2">
                                            {parseTags(listNoteMode === NOTE_MODE.TASTING ? (getBestTastingNote(bean.tastings) || bean.notes) : bean.notes).join(', ')}
                                        </div>
                                    </div>
                                    
                                    {beanMenuIdx === bean.id && (
                                        <div className="absolute inset-0 bg-slate-900/95 z-20 flex items-center justify-center gap-6 animate-in fade-in" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); setShareBeanData(bean); setBeanMenuIdx(null); }} className="flex flex-col items-center text-white gap-1">
                                                <div className="p-2 bg-slate-800 rounded-full"><ImageIcon size={20}/></div>
                                                <span className="text-[10px] font-bold">원두 카드</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleBeanTextShare(bean); }} className="flex flex-col items-center text-white gap-1">
                                                <div className="p-2 bg-slate-800 rounded-full"><FileText size={20}/></div>
                                                <span className="text-[10px] font-bold">텍스트</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleAppShare(); }} className="flex flex-col items-center text-white gap-1">
                                                <div className="p-2 bg-slate-800 rounded-full"><Share2 size={20}/></div>
                                                <span className="text-[10px] font-bold">앱 공유</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setBeanMenuIdx(null); }} className="absolute top-0 right-0 p-4 text-slate-500 hover:text-slate-300">
                                                <X size={20}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                );
                            })
                        )}
                    </main>
                </>
            )}

            {view === VIEW.DETAIL && activeBean && (
                <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                    <header className="p-4 pt-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900">
                        <button onClick={goBack} className="p-2"><ChevronLeft/></button>
                        <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Detail</span>
                        <button onClick={() => { setBeanForm({ ...activeBean }); setTempOcrImage(null); updateView(VIEW.EDIT_BEAN, activeBean.id); }} className="text-sm font-bold underline px-2">수정</button>
                    </header>
                    
                    <main className="flex-1 overflow-y-auto pb-24" ref={mainRef}>
                        <div className="p-6 pb-0">
                            <div className="flex items-center gap-2 mb-4">
                                <h1 className="text-3xl font-black leading-tight break-words dark:text-white">{activeBean.name}</h1>
                                {activeBean.isFinished && <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded h-fit whitespace-nowrap">SOLD OUT</span>}
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-1/2 aspect-square bg-slate-100 dark:bg-slate-800 relative rounded-2xl overflow-hidden shadow-sm shrink-0">
                                    {activeBean.mainImage ? (
                                        <img src={activeBean.mainImage} className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className={`absolute inset-0 flex items-center justify-center ${activeBean.isFinished ? 'text-slate-300 dark:text-slate-600' : 'text-amber-800 dark:text-amber-500'}`}>
                                            <CustomBeanIcon size={96}/>
                                        </div>
                                    )}
                                </div>
                                <div className="w-1/2 flex flex-wrap content-start gap-1.5">
                                    {activeBean.isBlend && activeBean.blendInfo && activeBean.blendInfo.length > 0 ? (
                                        <div className="w-full space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Blend Info</span>
                                            {activeBean.blendInfo.map((info, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                                                    {info.country && <span className="font-bold dark:text-slate-200">{getFlagEmoji(info.country)} {info.country}</span>}
                                                    {info.variety && <span className="text-slate-500 dark:text-slate-400">{info.variety}</span>}
                                                    {info.ratio && <span className="font-mono text-amber-600 dark:text-amber-500 font-bold ml-auto">{info.ratio}%</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            {activeBean.country && <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">{getFlagEmoji(activeBean.country) ? <span className="text-[11px] leading-none">{getFlagEmoji(activeBean.country)}</span> : <MapPin size={10} />} {activeBean.country}</span>}
                                            {activeBean.region && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"><MapPin size={10} /> {activeBean.region}</span>}
                                            {activeBean.variety && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"><Tag size={10} /> {activeBean.variety}</span>}
                                            {activeBean.processing && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"><Layers size={10} /> {activeBean.processing}</span>}
                                            {activeBean.producer && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"><User size={10} /> {activeBean.producer}</span>}
                                            {activeBean.altitude && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"><Mountain size={10} /> {activeBean.altitude}</span>}
                                        </>
                                    )}
                                    {activeBean.roastingLevel && <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-900/30 flex items-center gap-1"><Flame size={10} /> {activeBean.roastingLevel}</span>}
                                    {activeBean.weight && activeBean.roastingDate && <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"><Calendar size={10} className="text-slate-400"/> {activeBean.roastingDate}</span>}
                                    {activeBean.weight && activeBean.roastingDate && !activeBean.isFinished && <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-bold border border-amber-100 dark:border-amber-900/30 flex items-center gap-1">Roast {getRoastAge(activeBean.roastingDate)}</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {(activeBean.notes || activeBean.flavorDesc) && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 relative">
                                    <Quote size={20} className="absolute top-4 right-4 text-amber-200 dark:text-amber-800 opacity-50" />
                                    <span className="text-[10px] font-bold text-amber-500 uppercase block mb-3">Flavor Notes</span>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {parseTags(activeBean.notes).map((note, idx) => (
                                            <span key={idx} className="bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-900/30 shadow-sm">{note}</span>
                                        ))}
                                    </div>
                                    {activeBean.flavorDesc && <p className="text-amber-900 dark:text-amber-200 text-sm font-medium italic leading-relaxed border-t border-amber-200 dark:border-amber-900/30 pt-3 mt-2">{activeBean.flavorDesc}</p>}
                                </div>
                            )}
                            
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><ShoppingBag size={12}/> Purchase Info</h3>
                                    {activeBean.purchaseUrl && (
                                        <button onClick={() => openLink(activeBean.purchaseUrl)} className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                                            구매처 방문 <ExternalLink size={10}/>
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium dark:text-slate-300">
                                    <span>구매처</span> <span className="font-bold dark:text-white">{activeBean.shop || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium dark:text-slate-300">
                                    <span>구매일</span> <span className="font-bold dark:text-white">{activeBean.purchaseDate || '-'}</span>
                                </div>
                                {isActiveBeanFree ? (
                                    <div className="flex justify-between items-center text-sm font-medium dark:text-slate-300">
                                        <span>가격 ({activeBean.weight}g)</span> 
                                        <span className="font-bold text-orange-500 flex items-center gap-1"><Gift size={14}/> 나눔/샘플</span>
                                    </div>
                                ) : activeBean.weight && activeBean.price && (
                                    <div className="flex justify-between items-center text-sm font-medium dark:text-slate-300">
                                        <span>가격 ({activeBean.weight}g)</span> 
                                        <div className="text-right">
                                            <span className="font-bold block dark:text-white">{Number(activeBean.price).toLocaleString()}원</span>
                                            <span className="text-[10px] text-slate-400">100g당 {calcPricePer100g(activeBean.price, activeBean.weight)}원</span>
                                        </div>
                                    </div>
                                )}
                                {activeBean.pricePerCup && (
                                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-dashed dark:border-slate-800 dark:text-slate-300">
                                        <span>한 잔 가격</span> 
                                        <span className="font-bold text-amber-700 dark:text-amber-500">{Number(activeBean.pricePerCup).toLocaleString()}원</span>
                                    </div>
                                )}
                            </div>
                            
                            {activeBean.memo && (
                                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">
                                    {activeBean.memo}
                                </div>
                            )}
                            
                            <div className="pt-6 border-t dark:border-slate-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-black text-xl dark:text-white">시음 기록</h2>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={async () => { 
                                                const updatedBeans = beans.map(b => String(b.id) === String(activeBean.id) ? { ...b, isFinished: !b.isFinished } : b); 
                                                if(await idb.set(`${STORAGE_KEY}_data`, updatedBeans)) { setBeans(updatedBeans); } 
                                            }} 
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${activeBean.isFinished ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {activeBean.isFinished ? "원두 소진됨" : "원두 보유 중"}
                                        </button>
                                        <button 
                                            onClick={() => { 
                                                setTastingForm({...INITIAL_TASTING}); 
                                                setEditTastingIdx(null); 
                                                updateView(VIEW.EDIT_TASTING, activeBean.id); 
                                            }} 
                                            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold"
                                        >
                                            + 추가
                                        </button>
                                    </div>
                                </div>
                                
                                {activeBean.tastings.length === 0 ? (
                                    <p className="text-center text-slate-400 text-xs py-4">기록이 없습니다.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {activeBean.tastings.map((t, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 flex items-center gap-4 active:scale-95 cursor-pointer relative overflow-hidden select-none" 
                                                onTouchStart={() => handleTouchStart(idx)} 
                                                onTouchEnd={handleTouchEnd} 
                                                onMouseDown={() => handleTouchStart(idx)} 
                                                onMouseUp={handleTouchEnd} 
                                                onMouseLeave={handleTouchEnd} 
                                                onContextMenu={(e) => { e.preventDefault(); setTastingMenuIdx(idx); }} 
                                                onClick={() => { if (isLongPress.current) return; if (tastingMenuIdx !== null) { setTastingMenuIdx(null); return; } setTastingForm(t); setEditTastingIdx(idx); updateView(VIEW.EDIT_TASTING, activeBean.id); }}
                                            >
                                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center font-black border dark:border-slate-700 text-sm dark:text-white">
                                                    {getDisplayScore(t)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm mb-1 dark:text-white">{t.date}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {t.notes ? parseTags(t.notes).map((n, i) => <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded border dark:border-slate-600">{n}</span>) : <span className="text-xs text-slate-300">노트 없음</span>}
                                                    </div>
                                                </div>
                                                
                                                {tastingMenuIdx === idx && (
                                                    <div className="absolute inset-0 bg-slate-900/95 z-20 flex items-center justify-center gap-6 animate-in fade-in" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                                        <button onClick={(e) => { e.stopPropagation(); setShareData({ bean: activeBean, tasting: t }); setTastingMenuIdx(null); }} className="flex flex-col items-center text-white gap-1">
                                                            <div className="p-2 bg-slate-800 rounded-full"><ImageIcon size={20}/></div>
                                                            <span className="text-[10px] font-bold">이미지 공유</span>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleTextShare(activeBean, t); }} className="flex flex-col items-center text-white gap-1">
                                                            <div className="p-2 bg-slate-800 rounded-full"><FileText size={20}/></div>
                                                            <span className="text-[10px] font-bold">텍스트 공유</span>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTastingItem(idx); }} className="flex flex-col items-center text-red-400 gap-1">
                                                            <div className="p-2 bg-red-900/20 rounded-full"><Trash2 size={20}/></div>
                                                            <span className="text-[10px] font-bold">삭제</span>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setTastingMenuIdx(null); }} className="absolute top-0 right-0 p-4 text-slate-500 hover:text-slate-300">
                                                            <X size={20}/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            )}

            {view === VIEW.EDIT_BEAN && (
                <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                    <header className="p-4 pt-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900">
                        <button onClick={() => { goBack(); }} className="p-2"><ChevronLeft/></button>
                        <h1 className="font-black dark:text-white">원두 입력</h1>
                        <button onClick={handleSaveBean} disabled={isSaving} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-bold disabled:bg-slate-300 dark:disabled:bg-slate-700">
                            {isSaving ? '저장...' : '완료'}
                        </button>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-64">
                        <div className="flex gap-4">
                            <label className="flex-1 aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed dark:border-slate-700 relative overflow-hidden active:scale-95 transition-transform">
                                {beanForm.mainImage ? (
                                    <img src={beanForm.mainImage} className="w-full h-full object-cover"/>
                                ) : (
                                    <>
                                        <Camera size={24} className="text-slate-400"/>
                                        <span className="text-[10px] font-bold text-slate-400 mt-1">대표사진</span>
                                    </>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => onSelectFile(e, 'main')} />
                            </label>
                            <label className="flex-1 aspect-square bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-900/30 relative overflow-hidden active:scale-95 transition-transform">
                                {tempOcrImage ? (
                                    <>
                                        <img src={tempOcrImage} className="w-full h-full object-cover opacity-50"/>
                                        <CheckCircle2 className="absolute text-blue-600" size={24}/>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={24} className="text-blue-400"/>
                                        <span className="text-[10px] font-bold text-blue-400 mt-1">OCR 분석용</span>
                                    </>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => onSelectFile(e, 'ocr')} />
                            </label>
                        </div>
                        
                        <button onClick={runOCR} disabled={isProcessing} className="w-full py-3 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 font-bold rounded-2xl flex items-center justify-center gap-2">
                            {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>} 
                            {isProcessing ? "분석 중..." : "AI 정보 자동 입력"}
                        </button>
                        
                        <div className="space-y-4">
                            <input 
                                className="w-full text-2xl font-black border-b dark:border-slate-800 py-2 outline-none bg-transparent dark:text-white" 
                                placeholder="원두 이름 (필수)" 
                                value={beanForm.name} 
                                onChange={e => setBeanForm({...beanForm, name: e.target.value})}
                            />
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <input type="checkbox" checked={beanForm.isBlend} onChange={e => setBeanForm({...beanForm, isBlend: e.target.checked})} className="w-5 h-5 accent-slate-900"/>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">블렌드 원두 (Blend)</label>
                            </div>
                            {beanForm.isBlend ? (
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase">블렌딩 정보</h3>
                                        <button onClick={addBlendInfo} className="text-xs font-bold text-blue-500">+ 추가</button>
                                    </div>
                                    {(beanForm.blendInfo || []).map((info, idx) => (
                                        <div key={idx} className="relative border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input className="flex-1 bg-white dark:bg-slate-900 dark:text-white p-2 rounded-lg text-sm font-bold outline-none border border-slate-200 dark:border-slate-700" placeholder="국가" value={info.country} onChange={e => updateBlendInfo(idx, 'country', e.target.value)} />
                                                    <input className="w-24 bg-white dark:bg-slate-900 dark:text-white p-2 rounded-lg text-sm font-bold outline-none border border-slate-200 dark:border-slate-700" placeholder="비율 (%)" value={info.ratio} onChange={e => updateBlendInfo(idx, 'ratio', e.target.value)} />
                                                </div>
                                                <input className="w-full bg-white dark:bg-slate-900 dark:text-white p-2 rounded-lg text-sm font-bold outline-none border border-slate-200 dark:border-slate-700" placeholder="품종" value={info.variety} onChange={e => updateBlendInfo(idx, 'variety', e.target.value)} />
                                            </div>
                                            <button onClick={() => removeBlendInfo(idx)} className="absolute top-3 right-0 p-1 text-slate-400 hover:text-red-500"><X size={14}/></button>
                                        </div>
                                    ))}
                                    {(!beanForm.blendInfo || beanForm.blendInfo.length === 0) && <div className="text-center text-xs text-slate-400 py-2">블렌딩 정보를 추가해주세요.</div>}
                                    <input className="w-full bg-white dark:bg-slate-900 dark:text-white p-3 rounded-xl text-sm font-bold outline-none border border-slate-200 dark:border-slate-700 mt-2" placeholder="로스팅 포인트" value={beanForm.roastingLevel} onChange={e => setBeanForm({...beanForm, roastingLevel: e.target.value})}/>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="나라 (Country)" value={beanForm.country} onChange={e => setBeanForm({...beanForm, country: e.target.value})}/>
                                        <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="지역 (Region)" value={beanForm.region} onChange={e => setBeanForm({...beanForm, region: e.target.value})}/>
                                        <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="품종" value={beanForm.variety} onChange={e => setBeanForm({...beanForm, variety: e.target.value})}/>
                                        <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="가공 방식" value={beanForm.processing} onChange={e => setBeanForm({...beanForm, processing: e.target.value})}/>
                                        <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="고도 (m)" value={beanForm.altitude} onChange={e => setBeanForm({...beanForm, altitude: e.target.value})}/>
                                        <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="로스팅 포인트" value={beanForm.roastingLevel} onChange={e => setBeanForm({...beanForm, roastingLevel: e.target.value})}/>
                                    </div>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="생산자/농장" value={beanForm.producer} onChange={e => setBeanForm({...beanForm, producer: e.target.value})}/>
                                </>
                            )}
                            
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex flex-col justify-center">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">로스팅 날짜</label>
                                <input type="date" className="bg-transparent font-bold outline-none w-full dark:text-white" value={beanForm.roastingDate} onChange={e => setBeanForm({...beanForm, roastingDate: e.target.value})}/>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">구매 정보</h3>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex flex-col justify-center">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">구매일 (Purchase Date)</label>
                                    <input type="date" className="bg-transparent font-bold outline-none w-full dark:text-white" value={beanForm.purchaseDate} onChange={e => setBeanForm({...beanForm, purchaseDate: e.target.value})}/>
                                </div>
                                <div className="space-y-1 relative z-20">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">구매처 (Shop)</label>
                                    <div className="relative">
                                        <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input className="w-full bg-slate-100 dark:bg-slate-800 dark:text-white p-3 pl-10 rounded-xl text-sm font-bold outline-none" placeholder="예: Momos Coffee" value={beanForm.shop} onChange={handleShopChange} onFocus={() => setShowShopSuggestions(true)} onBlur={() => setTimeout(() => setShowShopSuggestions(false), 200)} autoComplete="off" />
                                        {showShopSuggestions && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-40 overflow-y-auto z-30">
                                                {[...new Set(combinedShops.map(s => s.name).filter(Boolean))].filter(s => s.toLowerCase().includes((beanForm.shop || "").toLowerCase())).map((shop, i) => (
                                                    <button key={i} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0" onClick={() => handleShopChange({ target: { value: shop } })}>{shop}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="구매 URL (http://...)" value={beanForm.purchaseUrl} onChange={e => setBeanForm({...beanForm, purchaseUrl: e.target.value})}/>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2"></div>
                                    <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="용량 (g)" value={beanForm.weight} onChange={e => setBeanForm({...beanForm, weight: e.target.value})}/>
                                    <input className="bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="가격 (원)" value={beanForm.price} onChange={e => setBeanForm({...beanForm, price: e.target.value})}/>
                                </div>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl text-sm font-bold outline-none" placeholder="한 잔 가격 (카페)" value={beanForm.pricePerCup} onChange={e => setBeanForm({...beanForm, pricePerCup: e.target.value})}/>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Flavor Keywords</label>
                                <div className="relative">
                                    <input className="w-full bg-amber-50 dark:bg-amber-900/20 p-4 pr-12 rounded-xl text-sm font-bold text-amber-900 dark:text-amber-400 outline-none placeholder-amber-900/30" placeholder="베리, 초콜릿 (콤마 구분)" value={beanForm.notes} onChange={e => setBeanForm({...beanForm, notes: e.target.value})}/>
                                    <button onClick={() => { setPickerTarget('bean'); setShowFlavorPicker(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"><Palette size={16}/></button>
                                </div>
                            </div>
                            
                            <textarea 
                                ref={beanFlavorDescRef} 
                                className="w-full bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl min-h-[6rem] text-sm font-medium text-amber-900 dark:text-amber-400 outline-none resize-none overflow-hidden" 
                                placeholder="향미에 대한 자세한 설명 (줄글)" 
                                value={beanForm.flavorDesc} 
                                onChange={e => { setBeanForm({...beanForm, flavorDesc: e.target.value}); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                                onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                            />
                            <textarea 
                                ref={beanMemoRef} 
                                className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl min-h-[6rem] text-sm outline-none resize-none overflow-hidden" 
                                placeholder="메모" 
                                value={beanForm.memo} 
                                onChange={e => { setBeanForm({...beanForm, memo: e.target.value}); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                                onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                            />
                        </div>
                        
                        {selectedId && <button onClick={handleDelete} className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center gap-2"><Trash2 size={18}/> 삭제</button>}
                    </main>
                </div>
            )}

            {view === VIEW.EDIT_TASTING && (
                <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                    <header className="p-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900">
                        <button onClick={() => { goBack(); }} className="p-2"><ChevronLeft/></button>
                        <h1 className="font-black dark:text-white">평가 작성</h1>
                        <button onClick={handleSaveTasting} disabled={isSaving} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-full text-xs font-bold disabled:bg-slate-300 dark:disabled:bg-slate-700">
                            {isSaving ? '저장...' : '완료'}
                        </button>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-64">
                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-2xl text-center font-bold outline-none" value={tastingForm.date} onChange={e => setTastingForm({...tastingForm, date: e.target.value})}/>
                        
                        <div className="flex items-center justify-between">
                            <div className="text-center flex-1 flex flex-col items-center">
                                <div className="relative">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-3xl text-4xl font-black shadow-xl mb-2">
                                        {tastingForm.isManualTotal ? (
                                            <input type="number" className="w-full bg-transparent text-center text-white dark:text-slate-900 outline-none" value={tastingForm.totalScore || ""} onChange={(e) => setTastingForm(prev => ({ ...prev, totalScore: e.target.value }))} placeholder="0.0"/>
                                        ) : (
                                            calcAvg(tastingForm.scores)
                                        )}
                                    </div>
                                    <button onClick={() => setTastingForm(prev => { const nextMode = !prev.isManualTotal; return { ...prev, isManualTotal: nextMode, totalScore: nextMode ? calcAvg(prev.scores) : undefined }; })} className="absolute -right-2 -top-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-1.5 rounded-full shadow-md border dark:border-slate-700">
                                        {tastingForm.isManualTotal ? <Calculator size={12}/> : <PenTool size={12}/>}
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{tastingForm.isManualTotal ? "Manual Score" : "Total Score"}</p>
                            </div>
                            <div className="flex-1 flex justify-center cursor-pointer relative active:scale-95 transition-transform" onClick={() => setShowScorePopup(true)}>
                                <RadarChart scores={tastingForm.scores} />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Keywords</label>
                            <div className="relative">
                                <input className="w-full bg-amber-50 dark:bg-amber-900/20 p-4 pr-12 rounded-xl text-sm font-bold text-amber-900 dark:text-amber-400 outline-none placeholder-amber-900/30" placeholder="산미, 단맛 (콤마 구분)" value={tastingForm.notes} onChange={e => setTastingForm({...tastingForm, notes: e.target.value})}/>
                                <button onClick={() => { setPickerTarget('tasting'); setShowFlavorPicker(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"><Palette size={16}/></button>
                            </div>
                        </div>
                        
                        <textarea 
                            ref={tastingDescRef} 
                            className="w-full bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl min-h-[6rem] text-sm font-medium text-amber-900 dark:text-amber-400 outline-none resize-none overflow-hidden" 
                            placeholder="맛에 대한 자세한 평가" 
                            value={tastingForm.desc} 
                            onChange={e => { setTastingForm({...tastingForm, desc: e.target.value}); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                            onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                        />
                        <textarea 
                            ref={tastingMemoRef} 
                            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl min-h-[8rem] text-sm outline-none resize-none overflow-hidden" 
                            placeholder="레시피 / 메모" 
                            value={tastingForm.memo} 
                            onChange={e => { setTastingForm({...tastingForm, memo: e.target.value}); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                            onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                        />
                        
                        {editTastingIdx !== null && (
                            <button onClick={handleDeleteTasting} className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center gap-2 mt-4">
                                <Trash2 size={16}/> 이 기록 삭제
                            </button>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
};