import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Play, Bookmark, BookOpen, Volume2, Eye, EyeOff, Maximize2, Compass } from 'lucide-react';
import { fetchPageAyahs, getAyahPageNumber, toArabicNumeral } from '../services/quranApi';
import { PaperTheme, FontStyle, Reciter, NavDisplayMode, TrackingHighlightColor } from '../types';
import { getTrackingColorConfig, TRACKING_COLORS } from '../data/highlightColors';

interface PageReaderProps {
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onSelectSurah: (surahId: number) => void;
  paperTheme: PaperTheme;
  onSetPaperTheme?: (theme: PaperTheme) => void;
  fontSize: number;
  fontStyle: FontStyle;
  onPlayAyah: (surahId: number, ayahNum: number) => void;
  currentPlayingAyah: { surahId: number; ayahNum: number } | null;
  onToggleBottomNav?: () => void;
  isBottomNavVisible?: boolean;
  navDisplayMode?: NavDisplayMode;
  onSetNavDisplayMode?: (mode: NavDisplayMode) => void;
  trackingColor?: TrackingHighlightColor;
  onSetTrackingColor?: (color: TrackingHighlightColor) => void;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
}

export const PageReader: React.FC<PageReaderProps> = ({
  initialPage = 1,
  onPageChange,
  onSelectSurah,
  paperTheme,
  onSetPaperTheme,
  fontSize,
  fontStyle,
  onPlayAyah,
  currentPlayingAyah,
  onToggleBottomNav,
  isBottomNavVisible = true,
  navDisplayMode = 'expanded',
  onSetNavDisplayMode,
  trackingColor = 'amber',
  onSetTrackingColor,
  isListeningMode = false,
  onToggleListeningMode
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageAyahs, setPageAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPageAyahs(currentPage)
      .then((res) => {
        if (isMounted) {
          setPageAyahs(res.ayahs);
          setLoading(false);
          if (onPageChange) onPageChange(currentPage);
        }
      })
      .catch((err) => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  // Automatically turn the page if the playing ayah moves to another page
  useEffect(() => {
    if (!currentPlayingAyah) return;
    const { surahId, ayahNum } = currentPlayingAyah;

    // Check if the current page already contains this ayah
    const isAyahOnThisPage = pageAyahs.some(
      a => a.surah?.id === surahId && a.numberInSurah === ayahNum
    );

    if (!isAyahOnThisPage && pageAyahs.length > 0) {
      getAyahPageNumber(surahId, ayahNum)
        .then((targetPage) => {
          if (targetPage && targetPage !== currentPage && targetPage >= 1 && targetPage <= 604) {
            setCurrentPage(targetPage);
          }
        })
        .catch(console.warn);
    }
  }, [currentPlayingAyah?.surahId, currentPlayingAyah?.ayahNum, pageAyahs, currentPage]);

  const handleNextPage = () => {
    if (currentPage < 604) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= 604) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  const activeAyahRef = useRef<HTMLSpanElement | null>(null);

  // Auto-scroll active playing verse on page view with safety timeout
  useEffect(() => {
    if (currentPlayingAyah && activeAyahRef.current) {
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
  }, [currentPlayingAyah?.surahId, currentPlayingAyah?.ayahNum, loading, pageAyahs]);

  // Extract Surah names present on this page
  const pageSurahs = Array.from(new Set(pageAyahs.map(a => a.surah.name)));
  const pageJuz = pageAyahs.length > 0 ? pageAyahs[0].juz : 1;

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
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300 space-y-6 ${
      isListeningMode ? 'py-2 sm:py-4' : 'py-6'
    }`}>
      
      {/* Top Page Controls (Hidden in Listening Mode) */}
      {!isListeningMode && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-md backdrop-blur-md">
            
            {/* Prev Page Button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة</span>
            </button>

            {/* Quick Color Palette Bubbles & Tracking Highlight Palette */}
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

            {/* Quick Tracking Highlight Palette */}
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

            {/* Listening Mode Direct Button in Page Reader */}
            {onToggleListeningMode && (
              <button
                onClick={onToggleListeningMode}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-sm group"
                title="تفعيل وضع الاستماع الخاشع (إخفاء كافة القوائم للتلاوة المستمرة والتركيز)"
              >
                <Headphones className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>وضع الاستماع</span>
              </button>
            )}

            {/* Jump To Page Input */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-semibold">
                صفحة {toArabicNumeral(currentPage)} من ٦٠٤
              </span>
              <input
                type="number"
                min="1"
                max="604"
                placeholder="انتقل لصفحة..."
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                className="w-24 px-2 py-1 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-100 outline-none focus:ring-2 focus:ring-amber-500 text-center font-bold"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-stone-800 text-amber-300 text-xs font-bold hover:bg-stone-700 border border-stone-700"
              >
                ذهاب
              </button>
            </form>

            {/* Next Page Button & Navigation Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Navigation Display Mode Selector */}
              <div className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => onSetNavDisplayMode ? onSetNavDisplayMode('expanded') : onToggleBottomNav?.()}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    navDisplayMode === 'expanded'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="شريط تنقل كامل"
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
                  title="تقليص إلى أيقونة معلقة"
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
                  title="إخفاء كلي"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إخفاء</span>
                </button>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= 604}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
              >
                <span>الصفحة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Helper notice for click to toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3.5 py-2 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 gap-2">
            <span>💡 نصيحة: انقر على أي مساحة داخل صفحة المصحف للتبديل بين الشريط الكامل والأيقونة المعلقة أو الإخفاء.</span>
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

      {/* Mushaf Page View Box */}
      <div 
        onClick={(e) => {
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
        className={`rounded-3xl p-6 sm:p-10 shadow-xl border ${themeClasses} min-h-[600px] flex flex-col justify-between space-y-6 transition-all duration-300 quran-frame cursor-pointer selection:bg-amber-500/30`}
      >
        
        {/* Page Top Frame Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300">
          <div>
            {pageSurahs.map((name, idx) => (
              <span key={name} className="ml-2">
                سورة {name} {idx < pageSurahs.length - 1 ? '• ' : ''}
              </span>
            ))}
          </div>

          <div className="text-amber-600 dark:text-amber-400">
            الجزء {toArabicNumeral(pageJuz)}
          </div>
        </div>

        {/* Page Content */}
        {loading ? (
          <div className="my-auto text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-stone-500 font-bold">جاري تحميل صفحة المصحف الشريف...</p>
          </div>
        ) : (
          <div className="text-justify leading-[2.8] select-text font-quran" style={{ fontSize: `${fontSize + 3}px` }}>
            {pageAyahs.map((ayah, idx) => {
              const isPlaying = currentPlayingAyah?.surahId === ayah.surah.id && currentPlayingAyah?.ayahNum === ayah.numberInSurah;
              
              // Check if Bismillah or Surah header should be rendered
              const isFirstInSurah = ayah.numberInSurah === 1;

              return (
                <React.Fragment key={`${ayah.surah.id}-${ayah.numberInSurah}`}>
                  
                  {/* Surah Header if first verse of surah */}
                  {isFirstInSurah && (
                    <div className="block my-6 text-center select-none">
                      <div 
                        onClick={() => onSelectSurah(ayah.surah.id)}
                        className="inline-block px-6 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition-colors"
                      >
                        <h3 className="font-quran text-2xl font-bold text-amber-800 dark:text-amber-300">
                          سُورَةُ {ayah.surah.name}
                        </h3>
                      </div>
                      {ayah.surah.id !== 1 && ayah.surah.id !== 9 && (
                        <div className="block mt-4 font-quran text-2xl text-amber-900 dark:text-amber-200">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verse Text */}
                  <span
                    ref={isPlaying ? activeAyahRef : null}
                    onClick={() => onPlayAyah(ayah.surah.id, ayah.numberInSurah)}
                    className={`cursor-pointer transition-colors duration-150 box-decoration-clone inline px-1 rounded ${
                      isPlaying
                        ? trackingConfig.inlineActiveClasses
                        : 'hover:bg-amber-500/15'
                    }`}
                    title={`سورة ${ayah.surah.name} - الآية ${ayah.numberInSurah} (انقر للاستماع)`}
                  >
                    {ayah.text}
                  </span>

                  {/* Verse End Marker */}
                  <span className="ayah-end-symbol text-amber-600 dark:text-amber-400 font-quran text-2xl font-bold select-none mx-0.5 inline">
                    ۝{toArabicNumeral(ayah.numberInSurah)}
                  </span>

                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Page Footer */}
        <div className="pt-4 border-t border-amber-500/20 text-center font-bold text-xs text-amber-800 dark:text-amber-300">
          - {toArabicNumeral(currentPage)} -
        </div>

      </div>

    </div>
  );
};
