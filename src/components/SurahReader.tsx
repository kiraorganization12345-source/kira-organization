import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  BookOpen, 
  FileText, 
  Bookmark,
  Copy, 
  Share2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  Volume2, 
  Check, 
  Info,
  Layers,
  Sliders,
  Type,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Compass
} from 'lucide-react';
import { SurahDetail, Ayah, PaperTheme, FontStyle, Reciter, NavDisplayMode, TrackingHighlightColor } from '../types';
import { fetchSurahDetail, fetchSurahTafsir, fetchSurahTranslation, toArabicNumeral } from '../services/quranApi';
import { ALL_SURAHS } from '../data/surahs';
import { getTrackingColorConfig, TRACKING_COLORS } from '../data/highlightColors';

interface SurahReaderProps {
  surahId: number;
  onSelectSurah: (id: number) => void;
  selectedReciter: Reciter;
  currentPlayingAyah: { surahId: number; ayahNum: number; mode?: 'verse' | 'surah' } | null;
  onPlayAyah: (surahId: number, ayahNum: number, mode?: 'verse' | 'surah') => void;
  onOpenTafsirModal: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onOpenTadabburAI: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
  paperTheme: PaperTheme;
  onSetPaperTheme?: (theme: PaperTheme) => void;
  fontSize: number;
  fontStyle: FontStyle;
  bookmarks: string[];
  onToggleBookmark: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onToggleBottomNav?: () => void;
  isBottomNavVisible?: boolean;
  navDisplayMode?: NavDisplayMode;
  onSetNavDisplayMode?: (mode: NavDisplayMode) => void;
  trackingColor?: TrackingHighlightColor;
  onSetTrackingColor?: (color: TrackingHighlightColor) => void;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
}

export const SurahReader: React.FC<SurahReaderProps> = ({
  surahId,
  onSelectSurah,
  selectedReciter,
  currentPlayingAyah,
  onPlayAyah,
  onOpenTafsirModal,
  onOpenTadabburAI,
  paperTheme,
  onSetPaperTheme,
  fontSize,
  fontStyle,
  bookmarks,
  onToggleBookmark,
  onToggleBottomNav,
  isBottomNavVisible = true,
  navDisplayMode = 'expanded',
  onSetNavDisplayMode,
  trackingColor = 'amber',
  onSetTrackingColor,
  isListeningMode = false,
  onToggleListeningMode
}) => {
  const [surahData, setSurahData] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode: 'mushaf' (default unified Mushaf) or 'verse' (detailed cards)
  const [readerMode, setReaderMode] = useState<'verse' | 'mushaf'>('mushaf');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [selectedAyahAction, setSelectedAyahAction] = useState<Ayah | null>(null);

  const activeAyahRef = useRef<HTMLSpanElement | null>(null);

  // Load Surah
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchSurahDetail(surahId)
      .then((detail) => {
        if (isMounted) {
          setSurahData(detail);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError('تعذر تحميل بيانات السورة. يرجى التحقق من الاتصال بالإنترنت.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [surahId]);

  // Load English Translation if enabled
  useEffect(() => {
    if (showTranslation && surahId) {
      fetchSurahTranslation(surahId, 'en.sahih').then(setTranslations);
    }
  }, [showTranslation, surahId]);

  // Scroll active playing verse into view smoothly with fallback timer
  useEffect(() => {
    if (currentPlayingAyah && currentPlayingAyah.surahId === surahId && activeAyahRef.current) {
      const timer = setTimeout(() => {
        if (activeAyahRef.current) {
          activeAyahRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [currentPlayingAyah?.surahId, currentPlayingAyah?.ayahNum, surahId, loading, readerMode]);

  const handleCopyAyah = (text: string, num: number) => {
    navigator.clipboard.writeText(`${text} ﴿${num}﴾ [سورة ${surahData?.name}]`);
    setCopiedAyah(num);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-amber-700 dark:text-amber-300">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="font-bold font-cairo">جاري تحميل سورة الكريمة...</p>
      </div>
    );
  }

  if (error || !surahData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-center space-y-3">
        <p className="text-red-700 dark:text-red-300 font-semibold">{error || 'لم يتم العثور على السورة'}</p>
        <button
          onClick={() => onSelectSurah(surahId)}
          className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const prevSurah = ALL_SURAHS.find(s => s.id === surahId - 1);
  const nextSurah = ALL_SURAHS.find(s => s.id === surahId + 1);

  // Apply paper theme classes
  const themeClasses = {
    dark: 'mushaf-paper-dark border-stone-800 shadow-2xl shadow-black/80',
    light: 'mushaf-paper-light border-stone-300 shadow-lg',
    sepia: 'mushaf-paper-sepia border-amber-300 shadow-lg',
    emerald: 'mushaf-paper-emerald border-emerald-900 shadow-2xl shadow-emerald-950/80',
    navy: 'mushaf-paper-navy border-slate-800 shadow-2xl shadow-slate-950/80',
    sand: 'mushaf-paper-sand border-amber-950 shadow-2xl shadow-amber-950/80'
  }[paperTheme] || 'mushaf-paper-dark border-stone-800';

  const fontClass = {
    'Amiri Quran': 'font-quran',
    'Scheherazade New': 'font-scheherazade',
    'Amiri': 'font-amiri',
    'Cairo': 'font-cairo'
  }[fontStyle];

  const trackingConfig = getTrackingColorConfig(trackingColor);

  const colorBubbles: { id: PaperTheme; title: string; bg: string; border: string }[] = [
    { id: 'dark', title: 'أسود داكن', bg: 'bg-[#0c0a09]', border: 'border-amber-500/60' },
    { id: 'light', title: 'أبيض ناصع', bg: 'bg-white', border: 'border-stone-400' },
    { id: 'sepia', title: 'بيج عتيق', bg: 'bg-[#fbf0d9]', border: 'border-amber-400' },
    { id: 'emerald', title: 'أخضر إسلامي', bg: 'bg-[#032e24]', border: 'border-emerald-500' },
    { id: 'navy', title: 'أزرق نيلي', bg: 'bg-[#0b132b]', border: 'border-blue-500' },
    { id: 'sand', title: 'رملي دافئ', bg: 'bg-[#1f1b18]', border: 'border-amber-700' },
  ];

  return (
    <div className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-300 space-y-6 ${
      isListeningMode ? 'py-2 sm:py-4' : 'py-6'
    }`}>
      
      {/* Top Bar Navigation & Controls (Hidden in Listening Mode) */}
      {!isListeningMode && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-md backdrop-blur-md">
            
            {/* Navigation back and Surah Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectSurah(1)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700"
                title="فهرس السور"
              >
                ← الفهرس
              </button>

              <select
                value={surahId}
                onChange={(e) => onSelectSurah(Number(e.target.value))}
                className="bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-stone-100 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {toArabicNumeral(s.id)}. سورة {s.name} ({s.versesCount} آية)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Mushaf Color Bubbles & View switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Quick Mushaf Color Bubbles & Tracking Highlight Palette */}
              {onSetPaperTheme && (
                <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-stone-800/80 border border-stone-700" title="اختر لون المصحف الشريف">
                  {colorBubbles.map(b => (
                    <button
                      key={b.id}
                      onClick={() => onSetPaperTheme(b.id)}
                      className={`w-5 h-5 rounded-full border transition-all ${b.bg} ${b.border} ${
                        paperTheme === b.id ? 'ring-2 ring-amber-400 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`لون ورق المصحف: ${b.title}`}
                    />
                  ))}
                </div>
              )}

              {/* Quick Tracking Highlight Color Palette */}
              {onSetTrackingColor && (
                <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-stone-800/80 border border-stone-700" title="اختر لون تمييز وتتبع الآية النشطة">
                  <span className="text-[10px] text-stone-400 px-1 font-bold">التتبع:</span>
                  {TRACKING_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => onSetTrackingColor(c.id)}
                      className={`w-4 h-4 rounded-full transition-all shadow-sm ${
                        trackingColor === c.id ? 'ring-2 ring-white scale-125' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`لون تمييز التتبع: ${c.name} (${c.subtext})`}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700">
                <button
                  onClick={() => setReaderMode('verse')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readerMode === 'verse'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>عرض تفاعلي</span>
                </button>

                <button
                  onClick={() => setReaderMode('mushaf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readerMode === 'mushaf'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>نص المصحف المتصل</span>
                </button>
              </div>

              {/* Listening Mode Direct Button in Reader */}
              {onToggleListeningMode && (
                <button
                  onClick={onToggleListeningMode}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-sm group"
                  title="تفعيل وضع الاستماع الخاشع (إخفاء كافة القوائم للتلاوة المستمرة والتركيز)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>وضع الاستماع</span>
                </button>
              )}

              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  showTranslation
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                }`}
              >
                English
              </button>

              {/* Navigation Display Mode Selector / Full-screen Reader */}
              <div className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => onSetNavDisplayMode ? onSetNavDisplayMode('expanded') : onToggleBottomNav?.()}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    navDisplayMode === 'expanded'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="شريط تنقل سفلي كامل"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">شريط كامل</span>
                </button>

                <button
                  onClick={() => onSetNavDisplayMode ? onSetNavDisplayMode('floating') : onToggleBottomNav?.()}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    navDisplayMode === 'floating'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                  title="تقليص إلى أيقونة عائمة معلقة"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">أيقونة معلقة</span>
                </button>

                <button
                  onClick={() => onSetNavDisplayMode ? onSetNavDisplayMode('hidden') : onToggleBottomNav?.()}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all ${
                    navDisplayMode === 'hidden'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                  title="إخفاء شريط التنقل كلياً"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إخفاء</span>
                </button>
              </div>

            </div>

          </div>

          {/* Helper notice for click to toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3.5 py-2 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 gap-2">
            <span>💡 نصيحة: يمكنك النقر مباشرة على أي مساحة داخل صفحة القراءة للتبديل بين الشريط الكامل والأيقونة المعلقة أو الإخفاء.</span>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => onSetNavDisplayMode ? onSetNavDisplayMode(navDisplayMode === 'expanded' ? 'floating' : 'expanded') : onToggleBottomNav?.()}
                className="text-amber-400 hover:underline font-bold"
              >
                {navDisplayMode === 'expanded' ? 'تقليص لأيقونة معلقة' : 'استعادة الشريط الكامل'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Surah Content Frame */}
      <div 
        onClick={(e) => {
          // If clicked directly on the frame or text areas, and not on interactive buttons/inputs
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, select, input, a, [role="button"]');
          if (!isInteractive) {
            if (onSetNavDisplayMode) {
              if (navDisplayMode === 'expanded') {
                onSetNavDisplayMode('floating');
              } else if (navDisplayMode === 'floating') {
                onSetNavDisplayMode('hidden');
              } else {
                onSetNavDisplayMode('expanded');
              }
            } else if (onToggleBottomNav) {
              onToggleBottomNav();
            }
          }
        }}
        className={`rounded-3xl p-6 sm:p-10 shadow-xl border ${themeClasses} transition-colors duration-300 space-y-8 cursor-pointer selection:bg-amber-500/30`}
      >
        
        {/* Decorative Surah Header Frame */}
        <div className="text-center relative py-8 px-4 border-b border-amber-500/30 space-y-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 quran-frame">
          <div className="inline-block px-8 sm:px-12 py-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-amber-500/15 to-amber-500/30 border-2 border-amber-500/60 shadow-md">
            <h2 className="text-4xl sm:text-6xl font-extrabold font-quran text-amber-900 dark:text-amber-200 tracking-wide drop-shadow-md">
              سُورَةُ {surahData.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-amber-800 dark:text-amber-300">
            <span className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">ترتيبها: {toArabicNumeral(surahData.id)}</span>
            <span className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">{surahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
            <span className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">آياتها: {toArabicNumeral(surahData.versesCount)}</span>
            <span className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">الجزء: {toArabicNumeral(surahData.juz)}</span>
          </div>

          {/* Audio Streaming Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onPlayAyah(surahData.id, 1, 'verse')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-all hover:scale-105"
            >
              <Volume2 className="w-5 h-5" />
              <span>بدء التلاوة والمتابعة التلقائية للآيات بصوت {selectedReciter.name}</span>
            </button>

            <button
              onClick={() => onPlayAyah(surahData.id, 1, 'surah')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold text-sm transition-all"
            >
              <Play className="w-4 h-4" />
              <span>استماع للسورة كملف صوتي واحد</span>
            </button>
          </div>

          {/* Bismillah Banner */}
          {surahData.bismillahPre && (
            <div className="pt-4 pb-2 font-quran text-2xl sm:text-4xl text-amber-900 dark:text-amber-100 select-none drop-shadow-sm">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}
        </div>

        {/* --- MODE 1: VERSE BY VERSE (العرض التفاعلي المفصل) --- */}
        {readerMode === 'verse' && (
          <div className="space-y-5">
            {surahData.ayahs.map((ayah) => {
              const isBookmarkKey = `${surahId}-${ayah.numberInSurah}`;
              const isBookmarked = bookmarks.includes(isBookmarkKey);
              const isPlaying = currentPlayingAyah?.surahId === surahId && currentPlayingAyah?.ayahNum === ayah.numberInSurah;

              return (
                <div
                  key={ayah.numberInSurah}
                  ref={isPlaying ? activeAyahRef : null}
                  className={`group relative rounded-2xl p-4 sm:p-6 transition-all border ${
                    isPlaying
                      ? trackingConfig.cardActiveClasses
                      : 'bg-black/5 dark:bg-white/5 border-stone-200/50 dark:border-stone-800/50 hover:border-amber-500/40'
                  }`}
                >
                  {/* Live Reciter Playing Line Banner Indicator */}
                  {isPlaying && (
                    <div className={`mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${trackingConfig.bannerBadgeClasses} text-xs shadow-md`}>
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      <span>يقرأ الآن الشيخ: {selectedReciter.name} ({selectedReciter.subtext})</span>
                    </div>
                  )}
                  
                  {/* Verse Text Display */}
                  <div className="text-right leading-[2.4] select-text pb-4" style={{ fontSize: `${fontSize}px` }}>
                    <span className={`${fontClass} font-normal tracking-wide ${
                      isPlaying ? 'text-amber-950 dark:text-amber-100 font-medium' : ''
                    }`}>
                      {ayah.text}
                    </span>
                    <span className="ayah-end-symbol text-amber-600 dark:text-amber-400 font-quran text-2xl font-bold select-none mr-2">
                      ۝{toArabicNumeral(ayah.numberInSurah)}
                    </span>
                  </div>

                  {/* English Translation if enabled */}
                  {showTranslation && translations[ayah.numberInSurah] && (
                    <div className="text-left text-stone-600 dark:text-stone-300 text-sm font-sans dir-ltr pt-2 border-t border-stone-200/40 dark:border-stone-800/40 italic">
                      {translations[ayah.numberInSurah]}
                    </div>
                  )}

                  {/* Verse Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-200/50 dark:border-stone-800/50 text-xs text-stone-500 dark:text-stone-400">
                    
                    {/* Verse Metadata */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                        آية {toArabicNumeral(ayah.numberInSurah)}
                      </span>
                      <span>صفحة {toArabicNumeral(ayah.page)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      
                      {/* Play Verse Audio */}
                      <button
                        onClick={() => onPlayAyah(surahId, ayah.numberInSurah)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-bold ${
                          isPlaying
                            ? 'bg-amber-500 text-stone-950 shadow-md'
                            : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-200 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300'
                        }`}
                        title="استمع للآية"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isPlaying ? 'إيقاف' : 'استماع'}</span>
                      </button>

                      {/* Tafsir Modal Trigger */}
                      <button
                        onClick={() => onOpenTafsirModal(surahId, surahData.name, ayah.numberInSurah, ayah.text)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-stone-200/60 dark:bg-stone-800/60 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex items-center gap-1 font-bold"
                        title="عرض التفسير والترجمة"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">التفسير</span>
                      </button>

                      {/* AI Tadabbur Trigger */}
                      <button
                        onClick={() => onOpenTadabburAI(surahData.name, surahData.id, ayah.numberInSurah, ayah.text)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-stone-200/60 dark:bg-stone-800/60 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1 font-bold"
                        title="تدبر الآية بالذكاء الاصطناعي"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">تدبّر</span>
                      </button>

                      {/* Bookmark Toggle */}
                      <button
                        onClick={() => onToggleBookmark(surahId, surahData.name, ayah.numberInSurah, ayah.text)}
                        className={`min-h-[38px] p-2.5 rounded-xl transition-colors ${
                          isBookmarked
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'bg-stone-200/60 dark:bg-stone-800/60 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300'
                        }`}
                        title={isBookmarked ? 'إزالة الحفظ' : 'حفظ الآية'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-stone-950' : ''}`} />
                      </button>

                      {/* Copy Verse */}
                      <button
                        onClick={() => handleCopyAyah(ayah.text, ayah.numberInSurah)}
                        className="min-h-[38px] p-2.5 rounded-xl bg-stone-200/60 dark:bg-stone-800/60 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                        title="نسخ النص"
                      >
                        {copiedAyah === ayah.numberInSurah ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* --- MODE 2: MUSHAF CONTINUOUS PARAGRAPH (المصحف الموحد المتصل) --- */}
        {readerMode === 'mushaf' && (
          <div className="space-y-4">
            
            {/* Live Playing Sheikh Mini-Status in Mushaf View */}
            {currentPlayingAyah && currentPlayingAyah.surahId === surahId && (
              <div className={`flex items-center justify-between px-4 py-2 rounded-xl bg-stone-900/80 border ${trackingConfig.borderAccent} text-xs font-bold text-stone-100 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: trackingConfig.hex }} />
                  <span>تلاوة مستمرة: الآية {toArabicNumeral(currentPlayingAyah.ayahNum)} بصوت الشيخ {selectedReciter.name}</span>
                </div>
                <span className="text-[11px] opacity-80">انقر على أي آية لخياراتها</span>
              </div>
            )}

            {/* Seamless unified Mushaf text box */}
            <div 
              className="text-justify leading-[2.6] font-quran select-text p-4 sm:p-8 rounded-2xl bg-black/5 dark:bg-white/5 transition-all"
              style={{ fontSize: `${fontSize + 2}px` }}
            >
              {surahData.ayahs.map((ayah) => {
                const isPlaying = currentPlayingAyah?.surahId === surahId && currentPlayingAyah?.ayahNum === ayah.numberInSurah;
                const isSelected = selectedAyahAction?.numberInSurah === ayah.numberInSurah;

                return (
                  <React.Fragment key={ayah.numberInSurah}>
                    <span
                      ref={isPlaying ? activeAyahRef : null}
                      onClick={() => setSelectedAyahAction(isSelected ? null : ayah)}
                      className={`cursor-pointer transition-colors duration-150 box-decoration-clone inline px-1 rounded ${
                        isPlaying
                          ? trackingConfig.inlineActiveClasses
                          : isSelected
                          ? 'bg-amber-500/20 underline decoration-amber-500 decoration-2'
                          : 'hover:bg-amber-500/15'
                      }`}
                      title={`سورة ${surahData.name} - الآية ${ayah.numberInSurah} (انقر للاستماع والتفسير)`}
                    >
                      {ayah.text}
                    </span>
                    <span 
                      onClick={() => setSelectedAyahAction(isSelected ? null : ayah)}
                      className="ayah-end-symbol text-amber-600 dark:text-amber-400 font-quran text-2xl font-bold select-none mx-1 cursor-pointer hover:opacity-80 inline"
                    >
                      ۝{toArabicNumeral(ayah.numberInSurah)}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Floating Action Drawer for Selected Verse in Unified Mushaf Mode */}
            {selectedAyahAction && (
              <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md transition-all">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs">
                      سورة {surahData.name} • الآية {toArabicNumeral(selectedAyahAction.numberInSurah)}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">صفحة {toArabicNumeral(selectedAyahAction.page)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedAyahAction(null)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-2 py-1"
                  >
                    إغلاق ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                  <button
                    onClick={() => {
                      onPlayAyah(surahId, selectedAyahAction.numberInSurah);
                      setSelectedAyahAction(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>استماع للآية</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTafsirModal(surahId, surahData.name, selectedAyahAction.numberInSurah, selectedAyahAction.text);
                      setSelectedAyahAction(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-500/20 font-bold text-xs"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>التفسير</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTadabburAI(surahData.name, surahData.id, selectedAyahAction.numberInSurah, selectedAyahAction.text);
                      setSelectedAyahAction(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>تدبّر بالذكاء الاصطناعي</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleBookmark(surahId, surahData.name, selectedAyahAction.numberInSurah, selectedAyahAction.text);
                    }}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/20 text-stone-700 dark:text-stone-300"
                    title="حفظ الآية"
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarks.includes(`${surahId}-${selectedAyahAction.numberInSurah}`) ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      handleCopyAyah(selectedAyahAction.text, selectedAyahAction.numberInSurah);
                    }}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/20 text-stone-700 dark:text-stone-300"
                    title="نسخ الآية"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Bottom Prev/Next Surah Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4">
        {nextSurah ? (
          <button
            onClick={() => onSelectSurah(nextSurah.id)}
            className="flex-1 flex items-center justify-start gap-2 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-amber-500 transition-all text-stone-800 dark:text-stone-200"
          >
            <ChevronRight className="w-5 h-5 text-amber-500" />
            <div className="text-right">
              <span className="text-xs text-stone-400 block">السورة التالية</span>
              <span className="font-bold font-quran text-lg">سورة {nextSurah.name}</span>
            </div>
          </button>
        ) : <div className="flex-1"></div>}

        {prevSurah ? (
          <button
            onClick={() => onSelectSurah(prevSurah.id)}
            className="flex-1 flex items-center justify-end gap-2 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-amber-500 transition-all text-stone-800 dark:text-stone-200"
          >
            <div className="text-left">
              <span className="text-xs text-stone-400 block">السورة السابقة</span>
              <span className="font-bold font-quran text-lg">سورة {prevSurah.name}</span>
            </div>
            <ChevronLeft className="w-5 h-5 text-amber-500" />
          </button>
        ) : <div className="flex-1"></div>}
      </div>

    </div>
  );
};
