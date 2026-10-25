import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Bookmark, 
  BookOpen, 
  Volume2, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Compass, 
  Headphones, 
  MoveDown, 
  Copy, 
  Check, 
  Sparkles,
  Download,
  FileImage,
  FileText,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Palette,
  RotateCcw,
  ArrowUp,
  Layers,
  Sliders,
  X,
  Search,
  ListFilter
} from 'lucide-react';
import { fetchPageAyahs, getAyahPageNumber, toArabicNumeral } from '../services/quranApi';
import { recordPageRead } from '../services/readingStatsStorage';
import { recordMushafPageRead } from '../services/khatmProgressService';
import { AutoScrollToolbar } from './AutoScrollToolbar';
import { DownloadMushafModal } from './DownloadMushafModal';
import { 
  PaperTheme, 
  FontStyle, 
  NavDisplayMode, 
  TrackingHighlightColor, 
  QuranTextColor,
  GlobalTheme
} from '../types';
import { getTrackingColorConfig, TRACKING_COLORS } from '../data/highlightColors';
import { 
  getQuranTextColorClasses, 
  PAPER_THEME_OPTIONS, 
  QURAN_TEXT_COLOR_OPTIONS 
} from '../data/quranThemes';
import { ALL_SURAHS } from '../data/surahs';
import { getDeviceInfo } from '../services/deviceService';

interface PageReaderProps {
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onSelectSurah: (surahId: number) => void;
  onBackToSurahs?: () => void;
  paperTheme: PaperTheme;
  onSetPaperTheme?: (theme: PaperTheme) => void;
  fontSize: number;
  fontStyle: FontStyle;
  onPlayAyah: (surahId: number, ayahNum: number) => void;
  currentPlayingAyah: { surahId: number; ayahNum: number } | null;
  onOpenTafsirModal?: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onOpenTadabburAI?: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
  bookmarks?: string[];
  onToggleBookmark?: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onToggleBottomNav?: () => void;
  isBottomNavVisible?: boolean;
  navDisplayMode?: NavDisplayMode;
  onSetNavDisplayMode?: (mode: NavDisplayMode) => void;
  trackingColor?: TrackingHighlightColor;
  onSetTrackingColor?: (color: TrackingHighlightColor) => void;
  quranTextColor?: QuranTextColor;
  onSetQuranTextColor?: (color: QuranTextColor) => void;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
  onOpenThemeStudio?: () => void;
  onSwitchToRealisticBook?: () => void;
}

export const PageReader: React.FC<PageReaderProps> = ({
  initialPage = 1,
  onPageChange,
  onSelectSurah,
  onBackToSurahs,
  paperTheme,
  onSetPaperTheme,
  fontSize,
  fontStyle,
  onPlayAyah,
  currentPlayingAyah,
  onOpenTafsirModal,
  onOpenTadabburAI,
  bookmarks = [],
  onToggleBookmark,
  onToggleBottomNav,
  isBottomNavVisible = true,
  navDisplayMode = 'expanded',
  onSetNavDisplayMode,
  trackingColor = 'amber',
  onSetTrackingColor,
  quranTextColor = 'default',
  onSetQuranTextColor,
  isListeningMode = false,
  onToggleListeningMode,
  onOpenThemeStudio,
  onSwitchToRealisticBook
}) => {
  // Detect phone screen or mobile preference to scale font and layout comfortably
  const [isPhoneMode, setIsPhoneMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const info = getDeviceInfo();
    return window.innerWidth < 640 || info.type === 'mobile';
  });

  useEffect(() => {
    const handleResize = () => {
      const info = getDeviceInfo();
      setIsPhoneMode(window.innerWidth < 640 || info.type === 'mobile');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const responsiveFontSize = isPhoneMode ? Math.min(Math.max(fontSize - 8, 17), 20) : fontSize;
  // Reading Flow: 'continuous' (المصحف المتصل لكامل القرآن بدون تقليب) vs 'single' (صفحة واحدة)
  const [readingFlow, setReadingFlow] = useState<'continuous' | 'single'>(() => {
    try {
      return (localStorage.getItem('quran_reading_flow_mode_v2') as 'continuous' | 'single') || 'continuous';
    } catch (e) {
      return 'continuous';
    }
  });

  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  useEffect(() => {
    if (currentPage >= 1 && currentPage <= 604) {
      try {
        localStorage.setItem('quran_last_read_page_v1', currentPage.toString());
      } catch (e) {}
    }
  }, [currentPage]);
  
  // Continuous Flow Pages tracking: array of page numbers currently in DOM
  const [loadedPages, setLoadedPages] = useState<number[]>(() => {
    const start = Math.max(1, Math.min(604, initialPage));
    const pages = [start];
    if (start + 1 <= 604) pages.push(start + 1);
    if (start + 2 <= 604) pages.push(start + 2);
    return pages;
  });

  // Map of page data: pageNumber -> ayahs[]
  const [pagesData, setPagesData] = useState<Record<number, any[]>>({});
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Jump Modal & Quick Navigation
  const [isJumpModalOpen, setIsJumpModalOpen] = useState<boolean>(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [surahFilterQuery, setSurahFilterQuery] = useState<string>('');

  // Inline Quick Color Panel
  const [isColorDrawerOpen, setIsColorDrawerOpen] = useState<boolean>(false);

  // Display Mode: 'image' (طبعة مصحف المدينة الأصلية المصورة) vs 'text' (المصحف الرقمي التفاعلي)
  const [displayMode, setDisplayMode] = useState<'image' | 'text'>('image');
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageFilterMode, setImageFilterMode] = useState<'normal' | 'dark' | 'sepia' | 'emerald'>('normal');

  // UI helpers
  const [showAutoScroll, setShowAutoScroll] = useState<boolean>(false);
  const [selectedAyahAction, setSelectedAyahAction] = useState<any | null>(null);
  const [copiedAyahKey, setCopiedAyahKey] = useState<string | null>(null);
  const [copyFeedbackToast, setCopyFeedbackToast] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const pageContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const activeAyahRef = useRef<HTMLSpanElement | null>(null);

  // Save reading flow mode on change
  const handleSetReadingFlow = (mode: 'continuous' | 'single') => {
    setReadingFlow(mode);
    try {
      localStorage.setItem('quran_reading_flow_mode_v2', mode);
    } catch (e) {}

    if (mode === 'single') {
      setLoadedPages([currentPage]);
    } else {
      const nextPages = [currentPage];
      if (currentPage + 1 <= 604) nextPages.push(currentPage + 1);
      if (currentPage + 2 <= 604) nextPages.push(currentPage + 2);
      setLoadedPages(nextPages);
    }
  };

  // Fetch a page's ayahs and cache in state
  const fetchSinglePageData = useCallback(async (pageNum: number) => {
    if (pagesData[pageNum] || loadingPages[pageNum]) return;

    setLoadingPages(prev => ({ ...prev, [pageNum]: true }));
    try {
      const res = await fetchPageAyahs(pageNum);
      if (res && res.ayahs) {
        setPagesData(prev => ({ ...prev, [pageNum]: res.ayahs }));
      }
    } catch (err) {
      console.warn(`Error fetching page ${pageNum}:`, err);
    } finally {
      setLoadingPages(prev => ({ ...prev, [pageNum]: false }));
    }
  }, [pagesData, loadingPages]);

  // Load initial pages on mount or when loadedPages changes
  useEffect(() => {
    loadedPages.forEach(p => {
      if (!pagesData[p] && !loadingPages[p]) {
        fetchSinglePageData(p);
      }
    });
  }, [loadedPages, fetchSinglePageData, pagesData, loadingPages]);

  // Infinite Scroll Trigger for Continuous Mode
  useEffect(() => {
    if (readingFlow !== 'continuous') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore) {
          setLoadedPages((prev) => {
            const lastPage = prev[prev.length - 1];
            if (!lastPage || lastPage >= 604) return prev;

            const newPages: number[] = [];
            for (let i = 1; i <= 3; i++) {
              const next = lastPage + i;
              if (next <= 604 && !prev.includes(next)) {
                newPages.push(next);
              }
            }

            if (newPages.length === 0) return prev;
            return [...prev, ...newPages];
          });
        }
      },
      { rootMargin: '800px 0px', threshold: 0.05 }
    );

    const currentSentinel = bottomSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [readingFlow, isLoadingMore]);

  // Viewport Observer to detect which page is currently being viewed and update currentPage & stats
  useEffect(() => {
    if (readingFlow !== 'continuous') return;

    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 3;
      let closestPage = currentPage;
      let minDistance = Infinity;

      loadedPages.forEach((p) => {
        const el = pageContainerRefs.current[p];
        if (el) {
          const rect = el.getBoundingClientRect();
          const distance = Math.abs(rect.top - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestPage = p;
          }
        }
      });

      if (closestPage !== currentPage && closestPage >= 1 && closestPage <= 604) {
        setCurrentPage(closestPage);
        onPageChange?.(closestPage);
        recordMushafPageRead(closestPage);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingFlow, loadedPages, currentPage, onPageChange]);

  // Turn page or jump when audio moves
  useEffect(() => {
    if (!currentPlayingAyah) return;
    const { surahId, ayahNum } = currentPlayingAyah;

    // Check if the ayah exists in currently loaded pages
    let foundPage: number | null = null;
    for (const p of loadedPages) {
      const ayahs = pagesData[p];
      if (ayahs && ayahs.some(a => a.surah?.id === surahId && a.numberInSurah === ayahNum)) {
        foundPage = p;
        break;
      }
    }

    if (!foundPage) {
      getAyahPageNumber(surahId, ayahNum)
        .then((targetPage) => {
          if (targetPage && targetPage >= 1 && targetPage <= 604) {
            if (readingFlow === 'single') {
              setCurrentPage(targetPage);
              setLoadedPages([targetPage]);
            } else {
              // Ensure targetPage is loaded in continuous flow
              setLoadedPages(prev => {
                if (prev.includes(targetPage)) return prev;
                return [...prev, targetPage, Math.min(604, targetPage + 1)].sort((a, b) => a - b);
              });
              setCurrentPage(targetPage);
              // Scroll to page
              setTimeout(() => {
                const el = pageContainerRefs.current[targetPage];
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 150);
            }
          }
        })
        .catch(console.warn);
    }
  }, [currentPlayingAyah?.surahId, currentPlayingAyah?.ayahNum, loadedPages, pagesData, readingFlow]);

  // Record initial page as read on mount
  useEffect(() => {
    if (initialPage >= 1 && initialPage <= 604) {
      recordMushafPageRead(initialPage);
    }
  }, [initialPage]);

  // Jump to specific page
  const handleJumpToPageNumber = (target: number) => {
    if (target < 1 || target > 604) return;
    setCurrentPage(target);
    onPageChange?.(target);
    recordMushafPageRead(target);

    if (readingFlow === 'continuous') {
      const pages = [target];
      if (target + 1 <= 604) pages.push(target + 1);
      if (target + 2 <= 604) pages.push(target + 2);
      setLoadedPages(pages);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } else {
      setLoadedPages([target]);
    }
    setIsJumpModalOpen(false);
  };

  // Jump to specific Surah
  const handleJumpToSurah = (surahId: number) => {
    const s = ALL_SURAHS.find(item => item.id === surahId);
    if (s && s.startPage) {
      handleJumpToPageNumber(s.startPage);
    }
  };

  // Jump to specific Juz (30 Ajzaa)
  const handleJumpToJuz = (juzNum: number) => {
    const approxPage = Math.min(604, Math.max(1, (juzNum - 1) * 20 + 2));
    handleJumpToPageNumber(approxPage);
  };

  const handleCopyAyah = (text: string, num: number, surahName: string, surahId: number) => {
    const formatted = `${text} ﴿${toArabicNumeral(num)}﴾ [سورة ${surahName}]`;
    try {
      navigator.clipboard.writeText(formatted);
      const key = `${surahId}-${num}`;
      setCopiedAyahKey(key);
      setCopyFeedbackToast(`تم نسخ الآية (${toArabicNumeral(num)}) من سورة ${surahName} إلى الحافظة 📋`);
      setTimeout(() => setCopiedAyahKey(null), 2500);
      setTimeout(() => setCopyFeedbackToast(null), 3500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  // Paper Theme Classes mapping
  const themeClasses: Record<string, string> = {
    dark: 'bg-stone-950 text-stone-100 border-amber-500/30 shadow-2xl',
    amoled: 'bg-black text-stone-100 border-stone-800 shadow-2xl',
    sepia: 'bg-[#1f1208] text-amber-100 border-amber-700/50 shadow-2xl',
    emerald: 'bg-[#021d16] text-emerald-100 border-emerald-600/50 shadow-2xl',
    navy: 'bg-[#060c1b] text-sky-100 border-blue-700/50 shadow-2xl',
    cream: 'bg-[#fbf7ee] text-amber-950 border-amber-700/30 shadow-lg',
    sand: 'bg-amber-50 text-stone-900 border-amber-400/40 shadow-lg',
    light: 'bg-white text-stone-950 border-stone-300 shadow-lg',
    charcoal: 'bg-slate-900 text-slate-100 border-slate-700 shadow-2xl'
  };
  const activePaperThemeClass = themeClasses[paperTheme] || themeClasses.dark;

  const trackingConfig = getTrackingColorConfig(trackingColor);
  const quranTextColorClass = getQuranTextColorClasses(quranTextColor);

  const getImageFilterStyle = () => {
    switch (imageFilterMode) {
      case 'dark':
        return 'invert-[0.88] hue-rotate-180 brightness-95 contrast-125';
      case 'sepia':
        return 'sepia-[0.35] contrast-[1.04] brightness-[0.98]';
      case 'emerald':
        return 'contrast-[1.05] brightness-[0.95] hue-rotate-[45deg]';
      default:
        return 'contrast-[1.02]';
    }
  };

  // Surah list for jump filter
  const filteredSurahs = ALL_SURAHS.filter(s => 
    s.name.includes(surahFilterQuery) || 
    s.id.toString() === surahFilterQuery
  );

  return (
    <div className={`max-w-4xl mx-auto px-2 sm:px-6 transition-all duration-300 space-y-3 sm:space-y-5 ${
      isListeningMode ? 'py-1 sm:py-2' : 'py-2 sm:py-4'
    }`} dir="rtl">

      {/* ============================================================ */}
      {/* 1. TOP MUSHAF CONTROL HEADER                                 */}
      {/* ============================================================ */}
      {!isListeningMode && (
        <header className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900/95 p-2 sm:p-3 rounded-2xl border border-amber-500/30 shadow-md backdrop-blur-md">
            
            {/* Back Button & Reading Flow Mode */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {onBackToSurahs && (
                <button
                  onClick={onBackToSurahs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 text-xs font-bold border border-amber-500/40 shrink-0 shadow-sm"
                  title="الرجوع إلى فهرس السور الرئيسي"
                >
                  <span>← فهرس السور</span>
                </button>
              )}

              {/* Left Controls: Reading Flow Mode (Continuous vs Single Page) */}
              <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                <button
                  onClick={() => handleSetReadingFlow('continuous')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readingFlow === 'continuous'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="تفعيل وضع التمرير المتصل لكامل المصحف الشريف بدون تقليب الصفحات"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>المصحف المتصل (كامل)</span>
                </button>

                <button
                  onClick={() => handleSetReadingFlow('single')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readingFlow === 'single'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="عرض صفحة واحدة فقط"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>صفحة مفردة</span>
                </button>
              </div>

              {onSwitchToRealisticBook && (
                <button
                  onClick={onSwitchToRealisticBook}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-600/30 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="الانتقال إلى المصحف الواقعي المفتوح بتقليب الصفحات ثلاثي الأبعاد"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>المصحف الواقعي المفتوح 📖</span>
                </button>
              )}
            </div>

            {/* Display Mode: Madani Scanned vs Digital Uthmani Text */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-bold">
              <button
                onClick={() => setDisplayMode('image')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  displayMode === 'image'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="طبعة مصحف المدينة المنورة المصورة الأصلية"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">طبعة المدينة</span>
                <span className="sm:hidden">مصور</span>
              </button>

              <button
                onClick={() => setDisplayMode('text')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  displayMode === 'text'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="عرض المصحف الرقمي بالخط العثماني التفاعلي"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">نص تفاعلي</span>
                <span className="sm:hidden">رقمي</span>
              </button>
            </div>

            {/* Quick Palette / Color Controller Button */}
            <button
              onClick={() => setIsColorDrawerOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isColorDrawerOpen
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                  : 'bg-stone-800 border-stone-700 text-amber-300 hover:bg-stone-750'
              }`}
              title="التحكم في ألوان الورق، الخط، وتظليل الآيات"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span>متحكم الألوان</span>
            </button>

            {/* Jump to Page / Surah / Juz Modal Trigger */}
            <button
              onClick={() => setIsJumpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all"
              title="فهرس المصحف والانتقال السريع إلى أي سورة أو جزء أو صفحة"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>فهرس وانتقال</span>
            </button>

            {/* Auto Scroll Toggle */}
            <button
              onClick={() => setShowAutoScroll(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                showAutoScroll
                  ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-md'
                  : 'bg-stone-800 border-stone-700 text-stone-200 hover:text-amber-300'
              }`}
              title="تفعيل التمرير التلقائي السلس"
            >
              <MoveDown className={`w-3.5 h-3.5 ${showAutoScroll ? 'animate-bounce' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">تمرير تلقائي</span>
            </button>

            {/* Download Mushaf Button */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 text-xs transition-colors"
              title="تحميل مصحف المدينة المنورة"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Single Mode Navigation Buttons (Only shown in single mode) */}
            {readingFlow === 'single' && (
              <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                <button
                  onClick={() => handleJumpToPageNumber(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابقة</span>
                </button>
                <span className="text-xs font-bold text-amber-300 px-2 font-quran">
                  صفحة {toArabicNumeral(currentPage)} من ٦٠٤
                </span>
                <button
                  onClick={() => handleJumpToPageNumber(currentPage + 1)}
                  disabled={currentPage >= 604}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
                >
                  <span>التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* QUICK INLINE COLOR & THEME DRAWER                            */}
          {/* ============================================================ */}
          {isColorDrawerOpen && (
            <div className="p-3.5 rounded-2xl bg-stone-900/95 border border-amber-500/40 space-y-3 animate-fadeIn text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>التحكم الفوري في ألوان المصحف وخلفيات القراءة:</span>
                </div>
                {onOpenThemeStudio && (
                  <button
                    onClick={() => {
                      setIsColorDrawerOpen(false);
                      onOpenThemeStudio();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-colors"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>استوديو ألوان الموقع بالكامل</span>
                  </button>
                )}
              </div>

              {/* Paper Theme Selector */}
              {onSetPaperTheme && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-stone-400 font-bold">خلفية ولون ورق المصحف:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                    {PAPER_THEME_OPTIONS.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => onSetPaperTheme(pt.id)}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                          paperTheme === pt.id
                            ? 'ring-2 ring-amber-400 border-white text-amber-200'
                            : 'border-stone-800 text-stone-400 hover:text-white'
                        }`}
                        style={{ backgroundColor: pt.previewBg }}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pt.previewBorder }} />
                        <span className="truncate w-full text-center">{pt.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Filter Mode (for Madani scanned view) */}
              {displayMode === 'image' && (
                <div className="space-y-1.5 pt-1 border-t border-stone-800/80">
                  <span className="text-[11px] text-stone-400 font-bold">فلتر طبعة المدينة المصورة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'normal', name: 'طبيعي معتمد', bg: '#ffffff', text: '#000' },
                      { id: 'dark', name: 'ليلي عكسي مهدئ', bg: '#1c1917', text: '#fff' },
                      { id: 'sepia', name: 'عتيق أندلسي', bg: '#fef3c7', text: '#78350f' },
                      { id: 'emerald', name: 'واحة زمردية', bg: '#064e3b', text: '#a7f3d0' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setImageFilterMode(f.id as any)}
                        className={`px-3 py-1 rounded-xl border text-[11px] font-bold transition-all ${
                          imageFilterMode === f.id
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                            : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Color for Uthmani digital view */}
              {displayMode === 'text' && onSetQuranTextColor && (
                <div className="space-y-1.5 pt-1 border-t border-stone-800/80">
                  <span className="text-[11px] text-stone-400 font-bold">لون خط الرسم العثماني:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {QURAN_TEXT_COLOR_OPTIONS.map((tc) => (
                      <button
                        key={tc.id}
                        onClick={() => onSetQuranTextColor(tc.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
                          quranTextColor === tc.id
                            ? 'bg-stone-800 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                            : 'bg-stone-900 border-stone-800 text-stone-300'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tc.previewHex }} />
                        <span>{tc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </header>
      )}

      {/* ============================================================ */}
      {/* 2. CONTINUOUS STREAM OF MUSHAF PAGES                         */}
      {/* ============================================================ */}
      <main className="space-y-6 sm:space-y-8">
        
        {loadedPages.map((pageNumber) => {
          const formattedPageNum = String(pageNumber).padStart(3, '0');
          const madaniImageUrl = `https://files.quran.app/hafs/madani/width_1024/page${formattedPageNum}.png`;
          const ayahs = pagesData[pageNumber] || [];
          const isLoadingPage = loadingPages[pageNumber];
          
          // Surah metadata on this page
          const surahNames = Array.from(new Set(ayahs.map(a => a.surah?.name).filter(Boolean)));
          const juzNumber = ayahs.length > 0 && ayahs[0].juz ? ayahs[0].juz : Math.ceil(pageNumber / 20);
          const hizbNumber = ayahs.length > 0 && ayahs[0].hizbQuarter ? Math.ceil(ayahs[0].hizbQuarter / 4) : Math.ceil(juzNumber * 2);

          return (
            <article
              key={pageNumber}
              data-page={pageNumber}
              ref={(el) => (pageContainerRefs.current[pageNumber] = el)}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden ${activePaperThemeClass}`}
            >
              
              {/* Ornate Page Ribbon Header */}
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-amber-500/20 bg-black/20 flex items-center justify-between text-xs sm:text-sm font-quran text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold">﴿ الجزء {toArabicNumeral(juzNumber)} ﴾</span>
                  <span className="text-stone-500 hidden sm:inline">•</span>
                  <span className="text-amber-400/90 hidden sm:inline">الحزب {toArabicNumeral(hizbNumber)}</span>
                </div>

                <div className="font-bold text-center text-amber-200">
                  {surahNames.length > 0 ? `سورة ${surahNames.join(' و')}` : `صفحة ${toArabicNumeral(pageNumber)}`}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold">صفحة {toArabicNumeral(pageNumber)}</span>
                  <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">/ 604</span>
                </div>
              </div>

              {/* Page Content Body */}
              <div className="p-3 sm:p-6 sm:px-8 relative">
                
                {/* MODE A: Authentic High-Res Scanned Madani Mushaf */}
                {displayMode === 'image' && (
                  <div className="flex flex-col items-center justify-center relative min-h-[450px]">
                    <img
                      src={madaniImageUrl}
                      alt={`مصحف المدينة المنورة صفحة ${pageNumber}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{
                        transform: `scale(${imageZoom})`,
                        transformOrigin: 'top center'
                      }}
                      className={`w-full max-w-3xl rounded-xl transition-all duration-300 select-none shadow-sm ${getImageFilterStyle()}`}
                    />
                  </div>
                )}

                {/* MODE B: Interactive Digital Uthmani Text */}
                {displayMode === 'text' && (
                  <div>
                    {isLoadingPage && ayahs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-amber-400 gap-3 font-quran">
                        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>جاري تحميل نص الصفحة {toArabicNumeral(pageNumber)}...</span>
                      </div>
                    ) : (
                      <div 
                        className={`leading-[2.7] sm:leading-[3.1] text-justify font-quran select-text ${quranTextColorClass}`}
                        style={{ 
                          fontSize: `${responsiveFontSize}px`, 
                          fontFamily: fontStyle === 'Amiri Quran' ? "'Amiri Quran', serif" : "'Scheherazade New', serif" 
                        }}
                      >
                        {ayahs.map((ayah, index) => {
                          const isNewSurah = index === 0 || ayahs[index - 1]?.surah?.id !== ayah.surah?.id;
                          const isPlaying = currentPlayingAyah?.surahId === ayah.surah?.id && currentPlayingAyah?.ayahNum === ayah.numberInSurah;
                          const bookmarkKey = `${ayah.surah?.id}-${ayah.numberInSurah}`;
                          const isBookmarked = bookmarks.includes(bookmarkKey);

                          return (
                            <React.Fragment key={`${ayah.surah?.id}-${ayah.numberInSurah}`}>
                              
                              {/* Surah Header Banner when a new Surah starts on this page */}
                              {isNewSurah && (
                                <div className="my-6 text-center select-none block">
                                  <div className="inline-flex items-center justify-center gap-3 px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 border border-amber-500/50 shadow-md">
                                    <span className="text-amber-400 text-lg">۞</span>
                                    <h3 className="font-bold text-xl sm:text-2xl text-amber-200">
                                      سورة {ayah.surah?.name}
                                    </h3>
                                    <span className="text-amber-400 text-lg">۞</span>
                                  </div>

                                  {/* Bismillah (Except for Surah At-Tawbah 9) */}
                                  {ayah.surah?.id !== 9 && (
                                    <div className="text-center font-quran text-lg sm:text-xl text-amber-200/90 my-3 leading-relaxed">
                                      بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Interactive Ayah Text */}
                              <span
                                ref={isPlaying ? activeAyahRef : null}
                                onClick={() => setSelectedAyahAction({
                                  surahId: ayah.surah?.id,
                                  surahName: ayah.surah?.name,
                                  ayahNum: ayah.numberInSurah,
                                  ayahText: ayah.text
                                })}
                                className={`inline cursor-pointer rounded-lg px-1 py-0.5 transition-all duration-200 hover:bg-amber-500/20 ${
                                  isPlaying
                                    ? `${trackingConfig.inlineActiveClasses} ring-2 ring-amber-400/40 shadow-sm font-bold`
                                    : ''
                                } ${isBookmarked ? 'border-b-2 border-amber-400' : ''}`}
                              >
                                {ayah.text}
                                <span className="inline-flex items-center justify-center mx-1.5 px-1.5 py-0.5 rounded-full text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 select-none">
                                  ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
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

              {/* Ornate Page Footer with Quick Actions */}
              <div className="px-4 py-2 bg-black/30 border-t border-amber-500/15 flex items-center justify-between text-xs text-stone-400">
                <span className="font-quran text-amber-300/80">
                  مصحف المدينة المنورة • صفحة {toArabicNumeral(pageNumber)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (ayahs.length > 0) {
                        onPlayAyah(ayahs[0].surah?.id, ayahs[0].numberInSurah);
                      }
                    }}
                    className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>تلاوة الصفحة</span>
                  </button>
                </div>
              </div>

            </article>
          );
        })}

        {/* Bottom Sentinel for Infinite Continuous Loading */}
        {readingFlow === 'continuous' && loadedPages[loadedPages.length - 1] < 604 && (
          <div ref={bottomSentinelRef} className="py-8 flex flex-col items-center justify-center gap-3 text-amber-400 font-quran">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">جاري التمرير وتحميل الصفحات التالية تلقائياً...</span>
          </div>
        )}

        {/* Reached Completion of Quran */}
        {readingFlow === 'continuous' && loadedPages.includes(604) && (
          <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/30 text-center space-y-3 my-8">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
            <h3 className="font-quran font-bold text-2xl text-amber-200">
              تم بحمد الله وعونه ختام المصحف الشريف
            </h3>
            <p className="text-sm text-stone-300 max-w-md mx-auto">
              ﴿ وَتَمَّتْ كَلِمَتُ رَبِّكَ صِدْقًا وَعَدْلًا لَا مُبَدِّلَ لِكَلِمَاتِهِ وَهُوَ السَّمِيعُ الْعَلِيمُ ﴾
            </p>
            <button
              onClick={() => handleJumpToPageNumber(1)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-quran transition-all shadow-md active:scale-95"
            >
              العودة إلى سورة الفاتحة (صفحة ١)
            </button>
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* 3. FLOATING REAL-TIME READING TRACKER & SHORTCUTS            */}
      {/* ============================================================ */}
      <div className="fixed bottom-20 left-4 z-40 flex flex-col items-start gap-2 select-none">
        
        {/* Current Page Floating Pill */}
        <div 
          onClick={() => setIsJumpModalOpen(true)}
          className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900/90 hover:bg-stone-850 text-amber-200 border border-amber-500/40 shadow-xl backdrop-blur-md transition-all active:scale-95"
          title="انقر للانتقال السريع إلى أي سورة أو جزء أو صفحة"
        >
          <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <div className="text-xs font-bold font-quran">
            <span>صفحة {toArabicNumeral(currentPage)}</span>
            <span className="text-stone-400 text-[10px] mx-1.5">•</span>
            <span className="text-amber-300">جزء {toArabicNumeral(Math.ceil(currentPage / 20))}</span>
          </div>
        </div>

        {/* Scroll Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 rounded-2xl bg-stone-900/90 hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-amber-500/40 shadow-xl flex items-center justify-center transition-all active:scale-95"
          title="الصعود إلى أعلى الصفحة"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

      </div>

      {/* ============================================================ */}
      {/* 4. MODAL: JUMP TO SURAH / JUZ / PAGE INDEX                   */}
      {/* ============================================================ */}
      {isJumpModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsJumpModalOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-stone-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-stone-100 animate-scaleUp max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base sm:text-lg text-amber-200 font-quran">
                  فهرس المصحف الشريف والانتقال المباشر
                </h3>
              </div>
              <button 
                onClick={() => setIsJumpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Page Number Input */}
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-stone-900 border border-stone-800">
              <input
                type="number"
                min="1"
                max="604"
                placeholder="أدخل رقم الصفحة مباشرة (1 - 604)..."
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-sm text-stone-100 outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={() => {
                  const p = parseInt(jumpPageInput, 10);
                  if (p >= 1 && p <= 604) {
                    handleJumpToPageNumber(p);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all"
              >
                انتقال
              </button>
            </div>

            {/* Quick Juz (Ajzaa) 1 - 30 Grid */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-300">الانتقال السريع حسب الجزء (الأجزاء ٣٠):</span>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-24 overflow-y-auto p-1 bg-stone-900/60 rounded-xl border border-stone-850">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                  <button
                    key={juz}
                    onClick={() => handleJumpToJuz(juz)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-300 font-bold text-xs text-center border border-stone-700 transition-all font-quran"
                  >
                    جـ {toArabicNumeral(juz)}
                  </button>
                ))}
              </div>
            </div>

            {/* Surah List Filter & Selector */}
            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span>الانتقال حسب السورة (١١٤ سورة):</span>
                <div className="flex items-center gap-1 bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-800">
                  <Search className="w-3 h-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="ابحث باسم السورة..."
                    value={surahFilterQuery}
                    onChange={(e) => setSurahFilterQuery(e.target.value)}
                    className="bg-transparent outline-none text-[11px] text-stone-200 w-28"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 pr-1">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.id}
                    onClick={() => handleJumpToSurah(surah.id)}
                    className="p-2 rounded-xl bg-stone-900/70 hover:bg-stone-800 border border-stone-800 text-right flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold">
                        {surah.id}
                      </span>
                      <span className="font-quran text-xs font-bold text-stone-200 group-hover:text-amber-200 truncate">
                        {surah.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono">
                      ص {surah.startPage}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: AYAH QUICK ACTIONS (Play, Tafsir, Tadabbur, Copy)  */}
      {/* ============================================================ */}
      {selectedAyahAction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedAyahAction(null)}
        >
          <div 
            className="w-full max-w-md bg-stone-950 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-stone-100 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h4 className="font-quran font-bold text-amber-300 text-lg">
                سورة {selectedAyahAction.surahName} • آية {toArabicNumeral(selectedAyahAction.ayahNum)}
              </h4>
              <button 
                onClick={() => setSelectedAyahAction(null)}
                className="w-7 h-7 rounded-full bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800/80 font-quran text-amber-100 text-base leading-loose max-h-40 overflow-y-auto">
              {selectedAyahAction.ayahText} ﴿{toArabicNumeral(selectedAyahAction.ayahNum)}﴾
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold font-quran">
              <button
                onClick={() => {
                  onPlayAyah(selectedAyahAction.surahId, selectedAyahAction.ayahNum);
                  setSelectedAyahAction(null);
                }}
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>استماع للآية</span>
              </button>

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
                  className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تفسير الآية</span>
                </button>
              )}

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
                  className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>تدبر بالذكاء</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleCopyAyah(
                    selectedAyahAction.ayahText,
                    selectedAyahAction.ayahNum,
                    selectedAyahAction.surahName,
                    selectedAyahAction.surahId
                  );
                  setSelectedAyahAction(null);
                }}
                className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ الآية</span>
              </button>
            </div>

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
                className="w-full p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 border border-stone-800 flex items-center justify-center gap-2 text-xs font-bold transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>إضافة إلى العلامات المرجعية</span>
              </button>
            )}

          </div>
        </div>
      )}

      {/* Copy Toast Feedback */}
      {copyFeedbackToast && (
        <aside className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-amber-400 text-xs sm:text-sm">
            <Check className="w-4 h-4" />
            <span>{copyFeedbackToast}</span>
          </div>
        </aside>
      )}

      {/* Auto Scroll Floating Multi-Speed Toolbar */}
      {showAutoScroll && (
        <AutoScrollToolbar
          isPlayingAudio={!!currentPlayingAyah}
          activeAyahElement={activeAyahRef.current}
          onScrollToActiveAyah={() => {
            if (activeAyahRef.current) {
              activeAyahRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            }
          }}
          defaultActive={false}
          onClose={() => setShowAutoScroll(false)}
          onPageEndReached={() => {
            if (currentPage < 604) {
              handleJumpToPageNumber(currentPage + 1);
            }
          }}
          isImageMode={displayMode === 'image'}
        />
      )}

      {/* Download Mushaf Modal (PDF & Offline Storage) */}
      <DownloadMushafModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        currentPage={currentPage}
        onJumpToPage={(p) => handleJumpToPageNumber(p)}
      />

    </div>
  );
};
