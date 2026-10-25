import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Volume2, 
  Play, 
  Pause, 
  Bookmark, 
  Sparkles, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Sliders, 
  Search, 
  FileText, 
  FileImage, 
  VolumeX, 
  Layers, 
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Ayah, Reciter, PaperTheme, FontStyle } from '../types';
import { fetchPageAyahs, toArabicNumeral } from '../services/quranApi';
import { recordMushafPageRead } from '../services/khatmProgressService';
import { playRealisticPageTurnSound, isPageTurnSoundEnabled, setPageTurnSoundEnabled } from '../services/soundEffects';
import { triggerHaptic } from '../services/deviceService';
import { ALL_SURAHS } from '../data/surahs';
import { ThreeDimensionalMushaf } from './ThreeDimensionalMushaf';

interface RealisticMushafBookProps {
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onBackToSurahs?: () => void;
  selectedReciter: Reciter;
  currentPlayingAyah: { surahId: number; ayahNum: number } | null;
  onPlayAyah: (surahId: number, ayahNum: number) => void;
  onOpenTafsirModal?: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onOpenTadabburAI?: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
  bookmarks?: string[];
  onToggleBookmark?: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  paperTheme?: PaperTheme;
}

export const RealisticMushafBook: React.FC<RealisticMushafBookProps> = ({
  initialPage = 1,
  onPageChange,
  onBackToSurahs,
  selectedReciter,
  currentPlayingAyah,
  onPlayAyah,
  onOpenTafsirModal,
  onOpenTadabburAI,
  bookmarks = [],
  onToggleBookmark,
  paperTheme = 'sepia'
}) => {
  // Engine: 'threejs' (Genuine 3D WebGL Quran on Islamic Wooden Stand) or 'bookSpread' (Classic open 2D/2.5D book spread)
  const [viewEngine, setViewEngine] = useState<'threejs' | 'bookSpread'>('threejs');

  // Current active page in view (1 - 604)
  const [currentPage, setCurrentPage] = useState<number>(initialPage >= 1 && initialPage <= 604 ? initialPage : 1);
  
  // Display Mode: 'image' (Madani Scanned) or 'text' (Interactive Vector Uthmani)
  const [displayMode, setDisplayMode] = useState<'image' | 'text'>('image');
  
  // Layout Spread: 'dual' (open 2-page spread) or 'single' (1-page realistic book)
  const [spreadMode, setSpreadMode] = useState<'dual' | 'single'>('dual');
  
  // Responsive auto-detect dual/single based on screen width
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  
  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isPageTurnSoundEnabled());
  
  // Page Data cache for text mode: Record<pageNumber, Ayahs>
  const [pagesData, setPagesData] = useState<Record<number, any[]>>({});
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  
  // 3D Flip Animation State
  const [isFlipping, setIsFlipping] = useState<'forward' | 'backward' | null>(null);
  const [flipProgress, setFlipProgress] = useState<number>(0);
  
  // Active Ayah Drawer for interactions in text mode
  const [selectedAyahAction, setSelectedAyahAction] = useState<any | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Quick Jump Modal
  const [isJumpModalOpen, setIsJumpModalOpen] = useState<boolean>(false);
  const [surahFilterQuery, setSurahFilterQuery] = useState<string>('');
  
  // Ribbon Bookmark Visual Placement
  const [ribbonToast, setRibbonToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Detect mobile screen on mount & resize
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileScreen(mobile);
      if (mobile) {
        setSpreadMode('single');
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Compute Right and Left page numbers based on Quran physical layout:
  // In RTL Arabic reading: Even page is on the Right, Odd page is on the Left!
  // Special case: Page 1 (Al-Fatihah) can be shown with introductory facing page or alone.
  const getSpreadPages = useCallback((page: number, isDual: boolean) => {
    if (!isDual) {
      return { rightPage: page, leftPage: null };
    }
    if (page === 1) {
      return { rightPage: 1, leftPage: 2 };
    }
    // If page is odd, the even page preceding it is on the right
    const rightPage = page % 2 === 0 ? page : page - 1;
    const leftPage = rightPage + 1 <= 604 ? rightPage + 1 : null;
    return { rightPage, leftPage };
  }, []);

  const { rightPage, leftPage } = getSpreadPages(currentPage, spreadMode === 'dual' && !isMobileScreen);

  // Sync page read with Khatm Progress
  useEffect(() => {
    recordMushafPageRead(currentPage);
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Load page text data when needed for text display mode
  const ensurePageDataLoaded = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > 604) return;
    if (pagesData[pageNum] || loadingPages[pageNum]) return;

    setLoadingPages(prev => ({ ...prev, [pageNum]: true }));
    fetchPageAyahs(pageNum)
      .then(res => {
        setPagesData(prev => ({ ...prev, [pageNum]: res.ayahs }));
      })
      .catch(err => {
        console.warn(`Failed loading text for page ${pageNum}:`, err);
      })
      .finally(() => {
        setLoadingPages(prev => ({ ...prev, [pageNum]: false }));
      });
  }, [pagesData, loadingPages]);

  useEffect(() => {
    if (displayMode === 'text') {
      ensurePageDataLoaded(rightPage);
      if (leftPage) ensurePageDataLoaded(leftPage);
      // Preload next/prev pages
      if (rightPage > 1) ensurePageDataLoaded(rightPage - 1);
      if (rightPage + 2 <= 604) ensurePageDataLoaded(rightPage + 2);
    }
  }, [displayMode, rightPage, leftPage, ensurePageDataLoaded]);

  // Handle Turn Forward (Move to next pages in Quran, turning towards the left)
  const handleTurnNext = useCallback(() => {
    if (isFlipping) return;
    const step = (spreadMode === 'dual' && !isMobileScreen) ? 2 : 1;
    const nextPage = Math.min(604, currentPage + step);
    if (nextPage === currentPage) return;

    triggerHaptic('light');
    if (soundEnabled) playRealisticPageTurnSound(0.4);

    setIsFlipping('forward');
    setTimeout(() => {
      setCurrentPage(nextPage);
      setIsFlipping(null);
    }, 400);
  }, [currentPage, spreadMode, isMobileScreen, isFlipping, soundEnabled]);

  // Handle Turn Backward (Move to previous pages in Quran, turning towards the right)
  const handleTurnPrev = useCallback(() => {
    if (isFlipping) return;
    const step = (spreadMode === 'dual' && !isMobileScreen) ? 2 : 1;
    const prevPage = Math.max(1, currentPage - step);
    if (prevPage === currentPage) return;

    triggerHaptic('light');
    if (soundEnabled) playRealisticPageTurnSound(0.4);

    setIsFlipping('backward');
    setTimeout(() => {
      setCurrentPage(prevPage);
      setIsFlipping(null);
    }, 400);
  }, [currentPage, spreadMode, isMobileScreen, isFlipping, soundEnabled]);

  // Jump to specific page
  const handleJumpToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > 604) return;
    triggerHaptic('medium');
    if (soundEnabled) playRealisticPageTurnSound(0.45);
    setCurrentPage(pageNum);
    setIsJumpModalOpen(false);
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isJumpModalOpen) return;
      if (e.key === 'ArrowLeft') {
        // In Arabic, next page is to the left
        handleTurnNext();
      } else if (e.key === 'ArrowRight') {
        // Previous page is to the right
        handleTurnPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurnNext, handleTurnPrev, isJumpModalOpen]);

  // Touch gesture handling (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Ensure horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swiped towards left -> Next page
        handleTurnNext();
      } else {
        // Swiped towards right -> Previous page
        handleTurnPrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setPageTurnSoundEnabled(next);
    triggerHaptic('light');
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Ribbon Bookmark toggle
  const handleRibbonClick = () => {
    triggerHaptic('medium');
    if (soundEnabled) playRealisticPageTurnSound(0.3);
    const surahMeta = ALL_SURAHS.find(s => s.startPage <= currentPage && (s.startPage + Math.ceil(s.versesCount / 15)) >= currentPage) || ALL_SURAHS[0];
    const bookmarkKey = `${surahMeta.id}-p${currentPage}`;
    
    // Save page bookmark
    try {
      const saved = localStorage.getItem('tawbah_mushaf_ribbon_page');
      if (saved === String(currentPage)) {
        localStorage.removeItem('tawbah_mushaf_ribbon_page');
        setRibbonToast(`تمت إزالة الفاصل الحريري من صفحة ${toArabicNumeral(currentPage)}`);
      } else {
        localStorage.setItem('tawbah_mushaf_ribbon_page', String(currentPage));
        setRibbonToast(`تم تثبيت الفاصل الحريري عند صفحة ${toArabicNumeral(currentPage)} 🔖`);
      }
      setTimeout(() => setRibbonToast(null), 3000);
    } catch {}
  };

  // Stacked pages thickness calculation: gives authentic visual depth of 604 pages
  const rightStackThickness = Math.max(2, Math.round((currentPage / 604) * 22));
  const leftStackThickness = Math.max(2, Math.round(((604 - currentPage) / 604) * 22));

  // Current surah metadata for headers
  const getPageSurahTitle = (pageNum: number) => {
    const found = ALL_SURAHS.slice().reverse().find(s => s.startPage <= pageNum);
    return found ? found.name : 'الفاتحة';
  };

  const getPageJuzNumber = (pageNum: number) => {
    return Math.min(30, Math.max(1, Math.ceil(pageNum / 20)));
  };

  const formatPageUrl = (p: number) => {
    const formatted = String(p).padStart(3, '0');
    return `https://files.quran.app/hafs/madani/width_1024/page${formatted}.png`;
  };

  // Render a single realistic page content (Image or Text)
  const renderPageSheet = (pageNum: number | null, isLeftPage: boolean) => {
    if (!pageNum) {
      // Empty decorative end sheet or frontispiece
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#fbf6e9] dark:bg-[#1a1512] text-amber-900/60 dark:text-amber-200/40 select-none">
          <div className="w-48 h-48 rounded-full border-4 border-double border-amber-600/30 flex items-center justify-center p-4">
            <span className="font-quran text-5xl opacity-40">۞</span>
          </div>
          <span className="font-quran text-lg mt-4 opacity-50">مصحف التوبة الشريف</span>
        </div>
      );
    }

    const ayahs = pagesData[pageNum] || [];
    const isLoading = loadingPages[pageNum];
    const surahTitle = getPageSurahTitle(pageNum);
    const juzNum = getPageJuzNumber(pageNum);

    return (
      <div 
        className={`w-full h-full flex flex-col justify-between relative select-none ${
          isLeftPage ? 'pr-1.5' : 'pl-1.5'
        }`}
      >
        {/* Ornate Header Strip */}
        <div className="px-4 py-2 border-b border-amber-900/15 dark:border-amber-400/15 flex items-center justify-between text-[11px] sm:text-xs font-quran text-amber-900/80 dark:text-amber-200/80 shrink-0 select-none">
          <span className="font-bold">﴿ الجزء {toArabicNumeral(juzNum)} ﴾</span>
          <span className="font-extrabold text-xs sm:text-sm text-amber-950 dark:text-amber-100">سورة {surahTitle}</span>
          <span className="font-bold">صفحة {toArabicNumeral(pageNum)}</span>
        </div>

        {/* Page Content Body */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2 sm:p-4">
          
          {/* A. High-Resolution Scanned Madani Mushaf Image */}
          {displayMode === 'image' && (
            <div className="w-full h-full flex items-center justify-center relative">
              <img
                src={formatPageUrl(pageNum)}
                alt={`مصحف المدينة المنورة صفحة ${pageNum}`}
                loading="eager"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain filter contrast-[1.03] brightness-[0.98] drop-shadow-xs select-none pointer-events-none"
              />
            </div>
          )}

          {/* B. Interactive Vector Uthmani Script */}
          {displayMode === 'text' && (
            <div className="w-full h-full overflow-y-auto no-scrollbar py-2 px-1 text-justify font-quran select-text">
              {isLoading && ayahs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-amber-600 dark:text-amber-300">
                  <div className="w-7 h-7 border-3 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-xs font-bold font-cairo">جاري تحميل صفحة {toArabicNumeral(pageNum)}...</span>
                </div>
              ) : (
                <div className="leading-[2.8] sm:leading-[3.1] text-stone-900 dark:text-stone-100 text-sm sm:text-base md:text-lg">
                  {ayahs.map((ayah, idx) => {
                    const isNewSurah = idx === 0 || ayahs[idx - 1]?.surah?.id !== ayah.surah?.id;
                    const isPlaying = currentPlayingAyah?.surahId === ayah.surah?.id && currentPlayingAyah?.ayahNum === ayah.numberInSurah;
                    const isBookmarked = bookmarks.includes(`${ayah.surah?.id}-${ayah.numberInSurah}`);

                    return (
                      <React.Fragment key={`${ayah.surah?.id}-${ayah.numberInSurah}`}>
                        {/* Surah Header if new surah starts on this page */}
                        {isNewSurah && (
                          <div className="my-3 text-center block select-none">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs font-bold">
                              <span>۞ سورة {ayah.surah?.name} ۞</span>
                            </div>
                            {ayah.surah?.id !== 1 && ayah.surah?.id !== 9 && ayah.numberInSurah === 1 && (
                              <div className="pt-2 text-center text-sm font-quran text-amber-950 dark:text-amber-100 select-none">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                              </div>
                            )}
                          </div>
                        )}

                        <span
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedAyahAction({
                              surahId: ayah.surah?.id,
                              surahName: ayah.surah?.name,
                              ayahNum: ayah.numberInSurah,
                              ayahText: ayah.text
                            });
                          }}
                          className={`cursor-pointer inline px-1 rounded transition-colors duration-150 ${
                            isPlaying
                              ? 'bg-amber-500 text-stone-950 font-black ring-2 ring-amber-400'
                              : 'hover:bg-amber-500/20'
                          } ${isBookmarked ? 'underline decoration-amber-500 decoration-2' : ''}`}
                        >
                          {ayah.text}
                          <span className="ayah-end-symbol text-amber-700 dark:text-amber-400 font-bold mx-1 select-none inline">
                            ۝{toArabicNumeral(ayah.numberInSurah)}
                          </span>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Ornate Footer Strip with Audio Page Trigger */}
        <div className="px-4 py-2 border-t border-amber-900/15 dark:border-amber-400/15 flex items-center justify-between text-[11px] sm:text-xs font-cairo text-amber-900/70 dark:text-amber-300/70 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const firstAyah = ayahs[0];
              if (firstAyah && firstAyah.surah) {
                onPlayAyah(firstAyah.surah.id, firstAyah.numberInSurah);
              } else {
                // Approximate first ayah for this page
                onPlayAyah(1, 1);
              }
            }}
            className="flex items-center gap-1.5 hover:text-amber-950 dark:hover:text-amber-100 transition-colors font-bold"
            title="استماع لتلاوة هذه الصفحة"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>استماع للصفحة</span>
          </button>
          
          <span className="font-quran text-[10px] text-stone-500 dark:text-stone-400">
            مصحف المدينة المنورة
          </span>
        </div>

        {/* Corner Dog-Ear / Curled Page Edge indicator */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (isLeftPage) handleTurnNext();
            else handleTurnPrev();
          }}
          className={`absolute bottom-0 ${isLeftPage ? 'left-0' : 'right-0'} w-9 h-9 cursor-pointer z-10 group/curl`}
          title={isLeftPage ? 'انقر لتقليب الصفحة إلى الأمام' : 'انقر للرجوع إلى الصفحة السابقة'}
        >
          <div 
            className={`w-full h-full transition-all duration-200 group-hover/curl:scale-125 ${
              isLeftPage
                ? 'bg-gradient-to-tr from-black/25 via-amber-700/20 to-transparent [clip-path:polygon(0_100%,100%_100%,0_0)]'
                : 'bg-gradient-to-tl from-black/25 via-amber-700/20 to-transparent [clip-path:polygon(100%_100%,0_100%,100%_0)]'
            }`}
          />
        </div>

      </div>
    );
  };

  if (viewEngine === 'threejs') {
    return (
      <div className="relative w-full h-[calc(100vh-68px)] flex flex-col bg-[#0c0a09] overflow-hidden">
        {/* Top 3D Engine Bar with Switcher */}
        <div className="bg-stone-900/95 border-b border-amber-500/30 px-3 py-2 flex items-center justify-between text-xs z-30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-amber-300 font-quran flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>المصحف الشريف ثلاثي الأبعاد 3D (حامل خشبي إسلامي وتدوير كامل)</span>
            </span>
            <button
              onClick={() => setIsJumpModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
              title="فتح فهرس جميع سور القرآن الكريم (114 سورة)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>فهرس السور</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 p-0.5 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewEngine('threejs');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 shadow-sm"
              title="عرض مجسم 3D في فضاء ثلاثي الأبعاد مع الحامل الخشبي والتدوير الحر"
            >
              🏛️ مجسم 3D
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewEngine('bookSpread');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-stone-300 hover:text-white"
              title="عرض كتاب مفتوح بصفحتين عالي الدقة"
            >
              📖 تصفح كتاب مفتوح
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <ThreeDimensionalMushaf
            initialPage={currentPage}
            onPageChange={(p) => {
              setCurrentPage(p);
              onPageChange?.(p);
            }}
            onBackToSurahs={onBackToSurahs}
            selectedReciter={selectedReciter}
            currentPlayingAyah={currentPlayingAyah}
            onPlayAyah={onPlayAyah}
            onOpenTafsirModal={onOpenTafsirModal}
            onOpenTadabburAI={onOpenTadabburAI}
            bookmarks={bookmarks}
            onToggleBookmark={onToggleBookmark}
            paperTheme={paperTheme}
            onFallbackToBookSpread={() => setViewEngine('bookSpread')}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen flex flex-col justify-between transition-colors duration-300 select-none ${
        isFullscreen ? 'p-2 bg-stone-950 fixed inset-0 z-50 overflow-hidden' : 'py-3 sm:py-6 px-2 sm:px-4 md:px-8'
      }`}
      dir="rtl"
    >
      
      {/* ============================================================ */}
      {/* 1. TOP BOOK CONTROL BAR (شريط التحكم العلوي للمصحف الواقعي)  */}
      {/* ============================================================ */}
      <div className="max-w-6xl mx-auto w-full mb-3 flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 bg-stone-900/90 dark:bg-stone-950/95 border border-amber-500/40 rounded-2xl shadow-xl backdrop-blur-md text-xs font-bold text-stone-200">
        
        {/* Left: Back & Mode Switches */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-stone-800 ml-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewEngine('threejs');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-stone-300 hover:text-white"
              title="التبديل إلى المصحف المجسم 3D"
            >
              🏛️ مجسم 3D
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewEngine('bookSpread');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 shadow-sm"
              title="عرض كتاب مفتوح بصفحتين"
            >
              📖 تصفح كتاب
            </button>
          </div>
          {onBackToSurahs && (
            <button
              onClick={onBackToSurahs}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 transition-all active:scale-95 shadow-sm"
              title="العودة إلى فهرس السور"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>فهرس السور</span>
            </button>
          )}

          {/* Quick Jump Page Dialog */}
          <button
            onClick={() => setIsJumpModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition-all active:scale-95"
            title="انتقال سريع إلى سورة أو جزء أو صفحة"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>انتقال سريع (صفحة {toArabicNumeral(currentPage)})</span>
          </button>

          {/* Display Mode Switcher (Image vs Text) */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                triggerHaptic('light');
                setDisplayMode('image');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                displayMode === 'image'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="طبعة مصحف المدينة الأصلية المصورة"
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>طبعة مصورة</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setDisplayMode('text');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                displayMode === 'text'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="المصحف العثماني التفاعلي مع إمكانية تفسير وسماع الآيات"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>نص تفاعلي</span>
            </button>
          </div>
        </div>

        {/* Right: Spread Mode, Sound & Fullscreen Controls */}
        <div className="flex items-center gap-1.5">
          
          {/* Dual / Single Page Spread Toggle (on tablets/desktops) */}
          {!isMobileScreen && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setSpreadMode(prev => prev === 'dual' ? 'single' : 'dual');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
                spreadMode === 'dual'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-stone-800 text-stone-300 border-stone-700'
              }`}
              title={spreadMode === 'dual' ? 'التبديل إلى صفحة مفردة' : 'التبديل إلى مصحف مفتوح (صفحتين)'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{spreadMode === 'dual' ? 'مصحف مفتوح (صفحتان)' : 'صفحة مفردة'}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`min-h-[34px] min-w-[34px] p-2 rounded-xl border flex items-center justify-center transition-all ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
            title={soundEnabled ? 'صوت تقليب الورق مفعّل' : 'صوت تقليب الورق مكتوم'}
            aria-label="تبديل صوت تقليب الورق"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="min-h-[34px] min-w-[34px] p-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700 flex items-center justify-center transition-all active:scale-95"
            title={isFullscreen ? 'إلغاء وضع ملء الشاشة' : 'تفعيل وضع ملء الشاشة للقراءة المطولة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. THE REALISTIC 3D OPEN MUSHAF (المصحف الواقعي المفتوح)      */}
      {/* ============================================================ */}
      <div 
        className="max-w-6xl mx-auto w-full flex-1 flex items-center justify-center py-2 sm:py-4 px-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Outer Wooden / Velvet Ambient Presentation Mount */}
        <div className="w-full relative flex items-center justify-center perspective-[2500px]">
          
          {/* Leather Book Hardcover Base with Gilded Borders & Stack Thickness */}
          <div 
            className="relative w-full max-w-5xl rounded-3xl p-2 sm:p-4 md:p-5 transition-all duration-300 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] border-4 sm:border-8 border-[#3b2413] dark:border-[#22170f] bg-gradient-to-b from-[#2a1b10] via-[#1a110a] to-[#2a1b10]"
            style={{
              boxShadow: `
                0 30px 80px -15px rgba(0,0,0,0.95),
                ${leftStackThickness}px 0 15px -3px rgba(0,0,0,0.7),
                -${rightStackThickness}px 0 15px -3px rgba(0,0,0,0.7),
                inset 0 0 20px rgba(0,0,0,0.8)
              `
            }}
          >
            
            {/* Gilded Embossed Islamic Border Filigree around Hardcover */}
            <div className="absolute inset-2 sm:inset-3 rounded-2xl border-2 border-amber-600/40 pointer-events-none ring-1 ring-amber-400/20" />
            <div className="absolute top-3 right-3 text-amber-500/40 text-xl font-serif pointer-events-none">❖</div>
            <div className="absolute top-3 left-3 text-amber-500/40 text-xl font-serif pointer-events-none">❖</div>
            <div className="absolute bottom-3 right-3 text-amber-500/40 text-xl font-serif pointer-events-none">❖</div>
            <div className="absolute bottom-3 left-3 text-amber-500/40 text-xl font-serif pointer-events-none">❖</div>

            {/* Left Edge Stacked Page Layers (سمك الورق المتراكم جهة اليسار) */}
            <div 
              className="absolute left-0 top-6 bottom-6 w-3 sm:w-4 rounded-l-md pointer-events-none opacity-80"
              style={{
                background: 'repeating-linear-gradient(to right, #f4ecd8, #e8dcbf 2px, #cbb793 3px, #ede2c8 4px)',
                boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.5)'
              }}
              title="الصفحات المتبقية في المصحف"
            />

            {/* Right Edge Stacked Page Layers (سمك الورق المتراكم جهة اليمين) */}
            <div 
              className="absolute right-0 top-6 bottom-6 w-3 sm:w-4 rounded-r-md pointer-events-none opacity-80"
              style={{
                background: 'repeating-linear-gradient(to left, #f4ecd8, #e8dcbf 2px, #cbb793 3px, #ede2c8 4px)',
                boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5)'
              }}
              title="الصفحات المقروءة في المصحف"
            />

            {/* Silk Ribbon Bookmark (الفاصل الحريري الأندلسي الفاخر) */}
            <div 
              onClick={handleRibbonClick}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 cursor-pointer group/ribbon flex flex-col items-center"
              title="انقر لوضع أو إزالة الفاصل الحريري لحفظ موضع القراءة"
            >
              {/* Ribbon Body */}
              <div className="w-5 sm:w-6 h-36 sm:h-48 bg-gradient-to-r from-red-800 via-rose-700 to-red-900 rounded-b-sm shadow-xl border-x border-red-950 relative overflow-hidden transition-all group-hover/ribbon:brightness-110">
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-amber-400/40 -translate-x-1/2" />
                {/* Gold fringe at ribbon tip */}
                <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-b from-amber-500 to-amber-700 flex items-center justify-around">
                  <div className="w-0.5 h-full bg-amber-300/80" />
                  <div className="w-0.5 h-full bg-amber-300/80" />
                  <div className="w-0.5 h-full bg-amber-300/80" />
                </div>
              </div>
              <span className="text-[10px] text-amber-300 bg-black/80 px-2 py-0.5 rounded-full mt-1 opacity-0 group-hover/ribbon:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                فاصل القراءة 🔖
              </span>
            </div>

            {/* Central Book Spread Paper Platform (المصحف الداخلي المفتوح) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#faf4e6] dark:bg-[#16120e] border border-amber-900/30 dark:border-amber-500/20 shadow-2xl flex min-h-[480px] sm:min-h-[580px] md:min-h-[640px]">
              
              {/* SPREAD MODE A: DUAL PAGES (Two-page open spread) */}
              {spreadMode === 'dual' && !isMobileScreen ? (
                <div className="w-full flex relative">
                  
                  {/* Right Page (صفحة اليمين - الأرقام الزوجية في الغالب) */}
                  <div 
                    onClick={handleTurnPrev}
                    className="w-1/2 relative border-l border-amber-900/20 dark:border-stone-800 transition-all duration-300 cursor-pointer hover:bg-amber-500/[0.01]"
                    style={{
                      background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.06), transparent 70%)',
                      boxShadow: 'inset -20px 0 35px -15px rgba(0,0,0,0.25)'
                    }}
                  >
                    {renderPageSheet(rightPage, false)}
                  </div>

                  {/* Central Spine Gutter Shadow (ظل ثنية الكعب المنتصفية) */}
                  <div 
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 pointer-events-none z-20"
                    style={{
                      background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.35) 100%)'
                    }}
                  />

                  {/* Left Page (صفحة اليسار - الأرقام الفردية) */}
                  <div 
                    onClick={handleTurnNext}
                    className="w-1/2 relative transition-all duration-300 cursor-pointer hover:bg-amber-500/[0.01]"
                    style={{
                      background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06), transparent 70%)',
                      boxShadow: 'inset 20px 0 35px -15px rgba(0,0,0,0.25)'
                    }}
                  >
                    {renderPageSheet(leftPage, true)}
                  </div>

                  {/* 3D Realistic Turning Leaf Overlay during animation */}
                  {isFlipping && (
                    <div 
                      className={`absolute inset-y-0 w-1/2 z-30 pointer-events-none ${
                        isFlipping === 'forward'
                          ? 'left-0 origin-right animate-flip-forward'
                          : 'right-0 origin-left animate-flip-backward'
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        background: 'linear-gradient(to right, #fbf7ee, #eee3cc)',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.45)'
                      }}
                    >
                      {/* Dynamic light gradient simulation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30" />
                    </div>
                  )}

                </div>
              ) : (
                /* SPREAD MODE B: SINGLE REALISTIC PAGE (Mobile or Focus Mode) */
                <div className="w-full relative">
                  <div 
                    className="w-full h-full relative"
                    style={{
                      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1)'
                    }}
                  >
                    {renderPageSheet(currentPage, false)}
                  </div>

                  {/* 3D Page flip overlay for single mode */}
                  {isFlipping && (
                    <div 
                      className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-r from-amber-200/40 via-stone-900/30 to-amber-200/40 animate-pulse"
                    />
                  )}
                </div>
              )}

            </div>

          </div>

          {/* Quick Floating Turn Controls (Floating on Sides) */}
          <button
            onClick={handleTurnPrev}
            disabled={currentPage <= 1}
            className={`absolute right-1 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-900/90 text-amber-300 border border-amber-500/50 shadow-2xl flex items-center justify-center transition-all ${
              currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 hover:bg-amber-500 hover:text-stone-950'
            }`}
            title="الصفحة السابقة (السهم الأيمن)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <button
            onClick={handleTurnNext}
            disabled={currentPage >= 604}
            className={`absolute left-1 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-900/90 text-amber-300 border border-amber-500/50 shadow-2xl flex items-center justify-center transition-all ${
              currentPage >= 604 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 hover:bg-amber-500 hover:text-stone-950'
            }`}
            title="الصفحة التالية (السهم الأيسر)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM SCRUBBER & PAGE SLIDER (شريط التقليب والتقدم)      */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto w-full mt-3 p-3 bg-stone-900/90 dark:bg-stone-950/95 border border-amber-500/40 rounded-2xl shadow-xl backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-sm font-quran">
              صفحة {toArabicNumeral(currentPage)} من ٦٠٤
            </span>
            <span className="text-stone-500 hidden sm:inline">•</span>
            <span className="text-stone-400 hidden sm:inline">الجزء {toArabicNumeral(getPageJuzNumber(currentPage))}</span>
          </div>

          <div className="text-stone-400 text-[11px] font-cairo">
            اسحب لتصفح وتقليب المصحف الشريف
          </div>
        </div>

        {/* Realistic Page Range Slider */}
        <input 
          type="range"
          min={1}
          max={604}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value, 10);
            setCurrentPage(page);
            if (soundEnabled && Math.abs(page - currentPage) >= 5) {
              playRealisticPageTurnSound(0.25);
            }
          }}
          className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* ============================================================ */}
      {/* 4. MODALS & FLYOUTS (النوافذ المنبثقة)                         */}
      {/* ============================================================ */}
      
      {/* Ribbon Bookmark Feedback Toast */}
      {ribbonToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-sm shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Bookmark className="w-4 h-4 fill-stone-950" />
          <span>{ribbonToast}</span>
        </div>
      )}

      {/* Interactive Ayah Action Drawer (When in Text Mode and an Ayah is clicked) */}
      {selectedAyahAction && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-50 p-4 rounded-3xl bg-stone-900/95 text-stone-100 border border-amber-500/50 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <span className="font-quran text-amber-300 font-bold text-sm">
              سورة {selectedAyahAction.surahName} • الآية {toArabicNumeral(selectedAyahAction.ayahNum)}
            </span>
            <button 
              onClick={() => setSelectedAyahAction(null)}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 text-right font-quran text-sm text-stone-200 line-clamp-2">
            {selectedAyahAction.ayahText}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
            {/* Play Ayah */}
            <button
              onClick={() => {
                onPlayAyah(selectedAyahAction.surahId, selectedAyahAction.ayahNum);
                setSelectedAyahAction(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-stone-950" />
              <span>استماع للآية</span>
            </button>

            {/* Tafsir Modal */}
            {onOpenTafsirModal && (
              <button
                onClick={() => {
                  onOpenTafsirModal(
                    selectedAyahAction.surahId,
                    selectedAyahAction.surahName,
                    selectedAyahAction.ayahNum,
                    selectedAyahAction.ayahText
                  );
                  setSelectedAyahAction(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 border border-stone-700 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>التفسير الميسر</span>
              </button>
            )}

            {/* AI Tadabbur */}
            {onOpenTadabburAI && (
              <button
                onClick={() => {
                  onOpenTadabburAI(
                    selectedAyahAction.surahName,
                    selectedAyahAction.surahId,
                    selectedAyahAction.ayahNum,
                    selectedAyahAction.ayahText
                  );
                  setSelectedAyahAction(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>تدبّر</span>
              </button>
            )}

            {/* Bookmark */}
            {onToggleBookmark && (
              <button
                onClick={() => {
                  onToggleBookmark(
                    selectedAyahAction.surahId,
                    selectedAyahAction.surahName,
                    selectedAyahAction.ayahNum,
                    selectedAyahAction.ayahText
                  );
                  setSelectedAyahAction(null);
                }}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700"
                title="حفظ الآية في المحفوظات"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Jump to Surah / Juz Modal */}
      {isJumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h3 className="font-quran text-lg font-bold text-amber-200">الانتقال السريع في المصحف</h3>
              </div>
              <button 
                onClick={() => setIsJumpModalOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-3 relative">
              <input 
                type="text"
                placeholder="ابحث عن اسم السورة أو رقمها..."
                value={surahFilterQuery}
                onChange={(e) => setSurahFilterQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs font-cairo focus:border-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Surah List */}
            <div className="overflow-y-auto flex-1 space-y-1.5 no-scrollbar pr-1">
              {ALL_SURAHS.filter(s => s.name.includes(surahFilterQuery) || s.id.toString() === surahFilterQuery).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleJumpToPage(s.startPage)}
                  className="w-full p-2.5 rounded-xl bg-stone-950/60 hover:bg-amber-500/20 text-right flex items-center justify-between border border-stone-800/80 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">
                      {s.id}
                    </span>
                    <div>
                      <span className="font-quran font-bold text-stone-200 group-hover:text-amber-300">
                        سورة {s.name}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {toArabicNumeral(s.versesCount)} آية
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-400/90 font-quran">
                    صفحة {toArabicNumeral(s.startPage)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
