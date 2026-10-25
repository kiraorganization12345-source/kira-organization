import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  ZoomIn, 
  ZoomOut, 
  ChevronDown, 
  Info, 
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { TAFSIRS, SIMPLIFIED_TAFSIRS, CLASSICAL_TAFSIRS } from '../data/tafsirs';
import { fetchSurahTafsir, toArabicNumeral } from '../services/quranApi';
import { triggerHaptic } from '../services/deviceService';

interface InlineVerseTafsirProps {
  surahId: number;
  surahName: string;
  ayahNum: number;
  ayahText: string;
  onClose: () => void;
  onOpenTadabburAI?: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
}

export const InlineVerseTafsir: React.FC<InlineVerseTafsirProps> = ({
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
  const [fontSize, setFontSize] = useState<number>(15);
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

  const handleSelectSource = (sourceId: string) => {
    triggerHaptic('light');
    setSelectedTafsirId(sourceId);
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
    setFontSize(prev => Math.min(24, prev + 1));
  };

  const decreaseFontSize = () => {
    triggerHaptic('light');
    setFontSize(prev => Math.max(13, prev - 1));
  };

  return (
    <div 
      className="mt-3.5 mb-2 rounded-2xl bg-amber-500/[0.04] dark:bg-stone-900/95 border border-amber-500/30 dark:border-amber-500/25 shadow-lg overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-200"
      dir="rtl"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-amber-500/10 dark:bg-stone-850/80 border-b border-amber-500/20">
        
        {/* Title and Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-quran text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200">
                تفسير الآية {toArabicNumeral(ayahNum)}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-cairo">
                سورة {surahName}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-cairo hidden sm:block">
              {activeSource.author}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* Font Controls */}
          <div className="flex items-center bg-white/70 dark:bg-stone-900/80 rounded-xl border border-stone-200/80 dark:border-stone-800 p-0.5 shadow-xs">
            <button
              onClick={decreaseFontSize}
              className="min-h-[32px] min-w-[32px] px-2 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-300 active:scale-95 transition-all text-xs font-bold"
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
              className="min-h-[32px] min-w-[32px] px-2 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-300 active:scale-95 transition-all text-xs font-bold"
              title="تكبير خط التفسير"
              aria-label="تكبير خط التفسير"
            >
              +
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`min-h-[36px] px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-200 border-stone-200/80 dark:border-stone-800 hover:border-amber-500/40'
            }`}
            title="نسخ التفسير إلى الحافظة"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>

          {/* AI Tadabbur Trigger */}
          {onOpenTadabburAI && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenTadabburAI(surahName, surahId, ayahNum, ayahText);
              }}
              className="min-h-[36px] px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
              title="تدبر الآية بعمق بواسطة الذكاء الاصطناعي"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">تدبّر ذكي</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 flex items-center justify-center transition-colors"
            title="إغلاق التفسير"
            aria-label="إغلاق التفسير"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Tafsir Sources Tab Switcher */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2.5 bg-stone-100/70 dark:bg-stone-950/50 border-b border-stone-200/50 dark:border-stone-800/60 overflow-x-auto no-scrollbar">
        
        {/* Primary Modern / Simplified Tafsir Sources */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SIMPLIFIED_TAFSIRS.map((t) => {
            const isSelected = selectedTafsirId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectSource(t.id)}
                className={`min-h-[36px] whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-white/80 dark:bg-stone-850/80 text-stone-600 dark:text-stone-300 border-stone-200/70 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
                title={t.description}
              >
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Additional Classical Sources Toggle */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowExtendedMenu(!showExtendedMenu)}
            className={`min-h-[36px] whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
              CLASSICAL_TAFSIRS.some(c => c.id === selectedTafsirId)
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/50'
                : 'bg-white/60 dark:bg-stone-900/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            title="عرض كتب تفاسير إضافية (ابن كثير، القرطبي، البغوي)"
          >
            <span>تفاسير أخرى</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtendedMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu for Classical Sources */}
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

      {/* Tafsir Body Area */}
      <div className="p-4 sm:p-5">
        
        {/* Source Annotation Banner */}
        <div className="mb-3 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200/40 dark:border-stone-800/40 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-700 dark:text-amber-300 font-cairo">
              {activeSource.name}:
            </span>
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              {activeSource.description}
            </span>
          </div>
          <span className="text-[10px] text-stone-400 font-cairo">
            مصدر معتمد وموثق
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-2.5 py-3 animate-pulse">
            <div className="h-4 bg-amber-500/10 dark:bg-stone-800 rounded-lg w-full" />
            <div className="h-4 bg-amber-500/10 dark:bg-stone-800 rounded-lg w-5/6" />
            <div className="h-4 bg-amber-500/10 dark:bg-stone-800 rounded-lg w-3/4" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-4 text-center space-y-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <p>{error}</p>
            <button
              onClick={() => handleSelectSource(selectedTafsirId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* Tafsir Text Output */}
        {!loading && !error && (
          <div 
            className="text-stone-800 dark:text-stone-200 font-cairo leading-[2.1] text-justify select-text"
            style={{ fontSize: `${fontSize}px` }}
          >
            {tafsirContent}
          </div>
        )}

      </div>

    </div>
  );
};
