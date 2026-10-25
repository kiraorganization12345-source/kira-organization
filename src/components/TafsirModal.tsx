import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronDown, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Info
} from 'lucide-react';
import { TAFSIRS, SIMPLIFIED_TAFSIRS, CLASSICAL_TAFSIRS } from '../data/tafsirs';
import { fetchSurahTafsir, toArabicNumeral } from '../services/quranApi';
import { triggerHaptic } from '../services/deviceService';

interface TafsirModalProps {
  surahId: number;
  surahName: string;
  ayahNum: number;
  ayahText: string;
  onClose: () => void;
  onOpenTadabburAI: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
  surahId,
  surahName,
  ayahNum,
  ayahText,
  onClose,
  onOpenTadabburAI
}) => {
  const [selectedTafsirId, setSelectedTafsirId] = useState<string>('ar.muyassar');
  const [tafsirContent, setTafsirContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(17);
  const [showExtendedMenu, setShowExtendedMenu] = useState<boolean>(false);

  const activeSource = TAFSIRS.find(t => t.id === selectedTafsirId) || TAFSIRS[0];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchSurahTafsir(surahId, selectedTafsirId)
      .then((map) => {
        if (!isMounted) return;
        const text = map[ayahNum];
        if (text && text.trim().length > 0) {
          setTafsirContent(text);
        } else {
          setTafsirContent('تعذر العثور على نص التفسير لهذه الآية في هذه الطبعة.');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load tafsir:', err);
        setError('تعذر تحميل التفسير. يرجى التحقق من الاتصال بالإنترنت.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [surahId, ayahNum, selectedTafsirId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectSource = (id: string) => {
    triggerHaptic('light');
    setSelectedTafsirId(id);
    setShowExtendedMenu(false);
  };

  const handleCopy = () => {
    triggerHaptic('light');
    const textToCopy = `﴿${ayahText}﴾ [سورة ${surahName}: ${ayahNum}]\n\nتفسير ${activeSource.name}:\n${tafsirContent}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const increaseFontSize = () => {
    triggerHaptic('light');
    setFontSize(prev => Math.min(26, prev + 1));
  };

  const decreaseFontSize = () => {
    triggerHaptic('light');
    setFontSize(prev => Math.max(14, prev - 1));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tafsir-modal-title"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="tafsir-modal-title" className="text-base sm:text-lg font-bold font-quran text-amber-950 dark:text-amber-200">
                تفسير الآية {toArabicNumeral(ayahNum)} • سورة {surahName}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-cairo">
                {activeSource.author}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Font Size Adjusters */}
            <div className="flex items-center bg-white/80 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 p-0.5">
              <button
                onClick={decreaseFontSize}
                className="min-h-[32px] min-w-[32px] px-2 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-300 font-bold text-xs transition-colors"
                title="تصغير خط التفسير"
                aria-label="تصغير خط التفسير"
              >
                -
              </button>
              <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300 px-1 min-w-[20px] text-center">
                {fontSize}
              </span>
              <button
                onClick={increaseFontSize}
                className="min-h-[32px] min-w-[32px] px-2 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-300 font-bold text-xs transition-colors"
                title="تكبير خط التفسير"
                aria-label="تكبير خط التفسير"
              >
                +
              </button>
            </div>

            <button
              onClick={onClose}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center justify-center"
              title="إغلاق"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ayah Card Preview */}
        <div className="p-4 sm:p-5 bg-amber-50/50 dark:bg-stone-950/40 border-b border-stone-200 dark:border-stone-800 text-right">
          <p className="font-quran text-xl sm:text-2xl text-stone-900 dark:text-amber-100 leading-relaxed font-normal">
            {ayahText} <span className="text-amber-600 dark:text-amber-400 font-bold select-none mr-1">﴿{toArabicNumeral(ayahNum)}﴾</span>
          </p>
        </div>

        {/* Tafsir Book Tabs */}
        <div className="flex items-center justify-between gap-1.5 px-3 py-2.5 bg-stone-100 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 overflow-x-auto no-scrollbar">
          
          {/* Primary Simplified / Modern Sources */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SIMPLIFIED_TAFSIRS.map((t) => {
              const isSelected = selectedTafsirId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectSource(t.id)}
                  className={`min-h-[36px] whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-750'
                  }`}
                  title={t.description}
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          {/* Classical Sources Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowExtendedMenu(!showExtendedMenu)}
              className={`min-h-[36px] whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                CLASSICAL_TAFSIRS.some(c => c.id === selectedTafsirId)
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/50'
                  : 'bg-white/80 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="عرض كتب تفاسير إضافية"
            >
              <span>تفاسير أخرى</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtendedMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExtendedMenu && (
              <div className="absolute left-0 mt-1.5 w-64 p-1.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl z-20 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2.5 py-1 text-[10px] text-stone-400 font-bold border-b border-stone-100 dark:border-stone-800">
                  أمهات كتب التفسير بالمأثور:
                </div>
                {CLASSICAL_TAFSIRS.map((t) => {
                  const isSelected = selectedTafsirId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectSource(t.id)}
                      className={`w-full text-right p-2 rounded-xl text-xs font-bold transition-colors flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 font-black'
                          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                        {t.author}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Tafsir Text Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          
          {/* Source Description Banner */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200/60 dark:border-stone-800/60 pb-2">
            <span className="font-bold text-amber-700 dark:text-amber-300 font-cairo">
              {activeSource.name}
            </span>
            <span className="text-[11px] text-stone-400">
              {activeSource.description}
            </span>
          </div>

          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-semibold font-cairo">جاري تحميل الشرح والتفسير...</p>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center space-y-3 text-rose-600 dark:text-rose-400 text-xs font-bold font-cairo">
              <p>{error}</p>
              <button
                onClick={() => handleSelectSource(selectedTafsirId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-all font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          {!loading && !error && (
            <div 
              className="text-stone-800 dark:text-stone-200 leading-[2.2] font-cairo text-justify select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              <p className="whitespace-pre-line">{tafsirContent}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900">
          
          <button
            onClick={() => {
              onClose();
              onOpenTadabburAI(surahName, surahId, ayahNum, ayahText);
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs hover:opacity-90 flex items-center gap-2 shadow-md shadow-amber-900/20 active:scale-95 transition-all"
            title="تدبر الآية بالذكاء الاصطناعي"
          >
            <Sparkles className="w-4 h-4" />
            <span>تدبر أكثر بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={handleCopy}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors active:scale-95"
            title="نسخ التفسير إلى الحافظة"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ التفسير'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
