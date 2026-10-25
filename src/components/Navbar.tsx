import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  FileText, 
  Bookmark, 
  Search, 
  Calendar, 
  Clock, 
  Sun, 
  Moon,
  Volume2, 
  Type, 
  Compass, 
  Sparkles,
  Menu,
  X,
  Heart,
  Eye,
  Headphones,
  Minimize2,
  Maximize2,
  EyeOff,
  Smartphone,
  Palette,
  BarChart3,
  Bell,
  Radio,
  Trophy,
  ChevronDown,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { ViewMode, PaperTheme, FontStyle, Reciter, NavDisplayMode, TrackingHighlightColor, QuranTextColor, NavThemeColor, GlobalTheme, SiteMode } from '../types';
import { RECITERS } from '../data/reciters';
import { TRACKING_COLORS } from '../data/highlightColors';
import { QURAN_TEXT_COLOR_OPTIONS, NAV_THEME_OPTIONS, getNavThemeConfig } from '../data/quranThemes';
import { toArabicNumeral } from '../services/quranApi';
import { useKhatmProgress } from '../services/khatmProgressService';
import { KhatmCelebrationCanvas } from './KhatmCelebrationCanvas';
import quranBrandIcon from '../assets/images/quran_brand_icon_1786468911622.jpg';

interface NavbarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  selectedReciter: Reciter;
  setSelectedReciter: (r: Reciter) => void;
  paperTheme: PaperTheme;
  setPaperTheme: (t: PaperTheme) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontStyle: FontStyle;
  setFontStyle: (s: FontStyle) => void;
  bookmarkCount: number;
  onOpenSearch: () => void;
  siteMode?: SiteMode;
  onToggleSiteMode?: () => void;
  eyeComfortMode?: boolean;
  onToggleEyeComfortMode?: () => void;
  isAudioActiveInBackground?: boolean;
  onRestoreAudioPlayer?: () => void;
  navDisplayMode?: NavDisplayMode;
  onSetNavDisplayMode?: (mode: NavDisplayMode) => void;
  trackingColor?: TrackingHighlightColor;
  onSetTrackingColor?: (color: TrackingHighlightColor) => void;
  quranTextColor?: QuranTextColor;
  onSetQuranTextColor?: (color: QuranTextColor) => void;
  navTheme?: NavThemeColor;
  onSetNavTheme?: (theme: NavThemeColor) => void;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
  onOpenQuranModeModal?: () => void;
  globalTheme?: GlobalTheme;
  onOpenThemeSwitcher?: () => void;
  onOpenAndroidInstall?: () => void;
  onOpenNotifications?: () => void;
  onOpenLiveVoice?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  selectedReciter,
  setSelectedReciter,
  paperTheme,
  setPaperTheme,
  fontSize,
  setFontSize,
  fontStyle,
  setFontStyle,
  bookmarkCount,
  onOpenSearch,
  siteMode = 'dark',
  onToggleSiteMode,
  eyeComfortMode = true,
  onToggleEyeComfortMode,
  isAudioActiveInBackground = false,
  onRestoreAudioPlayer,
  navDisplayMode = 'expanded',
  onSetNavDisplayMode,
  trackingColor = 'amber',
  onSetTrackingColor,
  quranTextColor = 'default',
  onSetQuranTextColor,
  navTheme = 'stone',
  onSetNavTheme,
  isListeningMode = false,
  onToggleListeningMode,
  onOpenQuranModeModal,
  globalTheme = 'amber',
  onOpenThemeSwitcher,
  onOpenAndroidInstall,
  onOpenNotifications,
  onOpenLiveVoice
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mushafColorMenuOpen, setMushafColorMenuOpen] = useState(false);
  const { progress: khatmProgress, syncPages } = useKhatmProgress();
  const [khatmDropdownOpen, setKhatmDropdownOpen] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const prevIsCompletedRef = useRef(khatmProgress.isCompleted);

  // Smart Navigation Auto-Hide & Reveal on Scroll with smooth effects
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          setIsScrolled(currentScrollY > 15);

          // If near top (within 70px), always show navbar
          if (currentScrollY < 70) {
            setIsNavVisible(true);
          } else if (currentScrollY > lastScrollYRef.current + 8) {
            // Scrolling down -> hide navbar seamlessly with effects
            setIsNavVisible(false);
            setSettingsOpen(false);
            setMushafColorMenuOpen(false);
            setKhatmDropdownOpen(false);
          } else if (currentScrollY < lastScrollYRef.current - 10) {
            // Scrolling up -> reveal smoothly
            setIsNavVisible(true);
          }
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger celebratory canvas animation when user reaches 100% milestone
  useEffect(() => {
    if (khatmProgress.isCompleted && !prevIsCompletedRef.current) {
      setCelebrationKey((prev) => prev + 1);
    }
    prevIsCompletedRef.current = khatmProgress.isCompleted;
  }, [khatmProgress.isCompleted]);

  const triggerKhatmCelebration = () => {
    setCelebrationKey((prev) => prev + 1);
  };

  const handleTestMilestoneCompletion = () => {
    const allPages = Array.from({ length: 604 }, (_, i) => i + 1);
    syncPages(allPages);
    setCelebrationKey((prev) => prev + 1);
  };

  const handleResetKhatmProgress = () => {
    syncPages([1]);
  };

  const navThemeConfig = getNavThemeConfig(navTheme);

  const mushafThemes: { id: PaperTheme; name: string; bgClass: string; borderClass: string; textColor: string }[] = [
    { id: 'dark', name: 'أسود ملكي', bgClass: 'bg-[#0c0a09]', borderClass: 'border-amber-500/60', textColor: 'text-amber-200' },
    { id: 'light', name: 'أبيض ناصع', bgClass: 'bg-white', borderClass: 'border-stone-300', textColor: 'text-stone-900' },
    { id: 'sepia', name: 'بيج عتيق', bgClass: 'bg-[#fbf0d9]', borderClass: 'border-amber-400', textColor: 'text-amber-950' },
    { id: 'emerald', name: 'أخضر إسلامي', bgClass: 'bg-[#032e24]', borderClass: 'border-emerald-500', textColor: 'text-emerald-100' },
    { id: 'navy', name: 'أزرق نيلي', bgClass: 'bg-[#0b132b]', borderClass: 'border-blue-500', textColor: 'text-blue-100' },
    { id: 'sand', name: 'رملي دافئ', bgClass: 'bg-[#1f1b18]', borderClass: 'border-amber-700', textColor: 'text-amber-100' }
  ];

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'surahs', label: 'المصحف (السور)', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'realistic_book', label: 'مصحف ثلاثي الأبعاد 3D', icon: <BookOpen className="w-4 h-4 text-amber-400" /> },
    { id: 'mushaf_page', label: 'قراءة بالصفحات', icon: <FileText className="w-4 h-4" /> },
    { id: 'listening', label: 'وضع الاستماع', icon: <Headphones className="w-4 h-4 text-teal-400" /> },
    { id: 'stats', label: 'إحصائيات القراءة', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
    { id: 'khatma', label: 'خطة الختمة', icon: <Calendar className="w-4 h-4" /> },
    { id: 'ai_assistant', label: 'وضع الذكاء الاصطناعي', icon: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> },
    { id: 'athkar', label: 'الأذكار والادعية', icon: <Heart className="w-4 h-4" /> },
    { id: 'prayers', label: 'أوقات الصلاة', icon: <Clock className="w-4 h-4" /> },
    { id: 'bookmarks', label: 'المحفوظات', icon: <Bookmark className="w-4 h-4" /> }
  ];

  return (
    <header className={`sticky top-0 z-40 text-stone-100 backdrop-blur-2xl border-b transition-all duration-300 transform ${
      isNavVisible ? 'translate-y-0 opacity-100 shadow-2xl' : '-translate-y-full opacity-0 pointer-events-none'
    } ${
      isScrolled 
        ? 'bg-black/95 border-amber-500/40 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.9)] ring-1 ring-amber-400/20' 
        : 'bg-black/90 border-amber-500/25 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 space-x-reverse cursor-pointer group" onClick={() => setActiveView('surahs')}>
            <div className="relative w-11 h-11 rounded-2xl bg-black border-2 border-amber-400/80 overflow-hidden shadow-lg shadow-amber-900/40 transition-transform group-hover:scale-105 shrink-0">
              <img 
                src={quranBrandIcon} 
                alt="شعار القرآن الكريم" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-300/40 pointer-events-none"></div>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-amber-100 font-quran tracking-wide flex items-center gap-2">
                <span className="gold-text-gradient font-bold">موقع التوبة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 font-cairo">
                  القرآن الكريم
                </span>
              </h1>
              <p className="text-[11px] text-amber-200/70 font-cairo hidden sm:block">تلاوات القراء • المصحف الشريف • تفسير الميسر • تدبر ذكي</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 space-x-reverse">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20'
                      : 'text-stone-300 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'bookmarks' && bookmarkCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-stone-950 text-amber-300' : 'bg-amber-500 text-stone-950'
                    }`}>
                      {bookmarkCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 space-x-reverse">
            
            {/* Khatm Completion Progress Widget in Main Header */}
            <div className="relative">
              <button
                onClick={() => setKhatmDropdownOpen(!khatmDropdownOpen)}
                className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-b ${
                  khatmProgress.isCompleted
                    ? 'from-amber-950/80 via-stone-900 to-emerald-950/80 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                    : 'from-stone-900 via-stone-900/95 to-stone-950 hover:from-stone-850 hover:to-stone-900 text-stone-200 border-amber-500/40 hover:border-amber-400'
                } text-xs font-bold transition-all shadow-md shadow-amber-950/25 group shrink-0 relative`}
                title="نسبة ختم القرآن الكريم - انقر لعرض التفاصيل وخطة الختمة"
                aria-label="نسبة ختم القرآن الكريم"
              >
                <div className={`relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${
                  khatmProgress.isCompleted
                    ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-md animate-bounce'
                    : 'bg-amber-500/15 border border-amber-400/40 text-amber-400 group-hover:scale-105'
                } transition-transform shrink-0`}>
                  <Trophy className="w-3.5 h-3.5" />
                </div>

                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="font-extrabold text-[11px] sm:text-xs text-amber-200 flex items-center gap-1">
                      <span>الختمة</span>
                      {khatmProgress.isCompleted && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-sans">
                          تمت 🌟
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      {khatmProgress.percentageFormatted}
                    </span>
                  </div>
                  
                  <div className="relative flex items-center gap-1.5 mt-0.5">
                    {/* Progress Bar Track */}
                    <div className="relative w-14 sm:w-24 md:w-28 h-2 bg-black rounded-full overflow-hidden border border-stone-800">
                      <div
                        className={`h-full ${
                          khatmProgress.isCompleted
                            ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 animate-pulse'
                            : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300'
                        } rounded-full transition-all duration-700 ease-out shadow-[0_0_6px_rgba(245,158,11,0.6)]`}
                        style={{ width: `${Math.min(100, Math.max(khatmProgress.completedPagesCount > 0 ? 2 : 0, khatmProgress.percentage))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono hidden xs:inline">
                      {toArabicNumeral(khatmProgress.completedPagesCount)}/٦٠٤
                    </span>

                    {/* Subtle canvas celebration particles floating directly on the progress bar on 100% completion */}
                    {khatmProgress.isCompleted && (
                      <div className="absolute -inset-x-2 -inset-y-3 pointer-events-none">
                        <KhatmCelebrationCanvas
                          isCompleted={khatmProgress.isCompleted}
                          triggerKey={celebrationKey}
                          density="subtle"
                          ambientGlow={true}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 group-hover:text-amber-300 transition-transform ${khatmDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* Interactive Khatm Details Popover */}
              {khatmDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setKhatmDropdownOpen(false)} />
                  <div className="absolute left-0 sm:right-0 mt-2 w-72 sm:w-80 p-4 bg-stone-950/98 border border-amber-500/40 rounded-2xl shadow-2xl z-50 space-y-3.5 backdrop-blur-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-amber-100">ختمة القرآن الكريم</h4>
                          <p className="text-[10px] text-stone-400">معدل الإنجاز التراكمي لصفحات المصحف</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setKhatmDropdownOpen(false)}
                        className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Milestone Celebratory Card if 100% Completed */}
                    {khatmProgress.isCompleted && (
                      <div className="relative overflow-hidden p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 via-stone-900 to-emerald-950/80 border border-amber-400/80 text-center space-y-2 shadow-xl">
                        <KhatmCelebrationCanvas isCompleted={true} triggerKey={celebrationKey} density="vibrant" />
                        <div className="flex items-center justify-center gap-1.5 text-amber-300 font-black text-xs">
                          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                          <span>مبارك! تم ختم القرآن الكريم كاملاً بحمد الله</span>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-[10px] text-stone-300 leading-relaxed">
                          هنيئاً لك هذا الأجر العظيم ومبارك إتمام قراءة المصحف الشريف كاملاً (٦٠٤ صفحة).
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerKhatmCelebration();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <span>🎉 إعادة عرض الاحتفال بالختمة</span>
                        </button>
                      </div>
                    )}

                    {/* Progress Bar & Metrics */}
                    <div className="space-y-2 bg-stone-900/80 p-3 rounded-xl border border-stone-800/80 relative">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-stone-300">نسبة الإنجاز في المصحف</span>
                        <span className="text-amber-400 font-extrabold text-sm font-mono">
                          {khatmProgress.percentageFormatted}
                        </span>
                      </div>

                      <div className="relative w-full h-3 bg-black rounded-full overflow-hidden border border-stone-700/80 p-0.5">
                        <div
                          className={`h-full ${
                            khatmProgress.isCompleted
                              ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 animate-pulse'
                              : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300'
                          } rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(245,158,11,0.6)]`}
                          style={{ width: `${Math.min(100, Math.max(khatmProgress.completedPagesCount > 0 ? 1 : 0, khatmProgress.percentage))}%` }}
                        />
                        {khatmProgress.isCompleted && (
                          <div className="absolute inset-0 pointer-events-none">
                            <KhatmCelebrationCanvas
                              isCompleted={true}
                              triggerKey={celebrationKey}
                              density="subtle"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="bg-black/60 p-2 rounded-lg border border-stone-800">
                          <div className="text-stone-400 text-[10px]">الصفحات المقروءة</div>
                          <div className="text-amber-200 font-extrabold text-xs">
                            {toArabicNumeral(khatmProgress.completedPagesCount)} <span className="text-[10px] text-stone-400">من ٦٠٤</span>
                          </div>
                        </div>
                        <div className="bg-black/60 p-2 rounded-lg border border-stone-800">
                          <div className="text-stone-400 text-[10px]">الصفحات المتبقية</div>
                          <div className="text-emerald-300 font-extrabold text-xs">
                            {toArabicNumeral(khatmProgress.remainingPages)} <span className="text-[10px] text-stone-400">صفحة</span>
                          </div>
                        </div>
                        <div className="bg-black/60 p-2 rounded-lg border border-stone-800">
                          <div className="text-stone-400 text-[10px]">الأجزاء المنجزة</div>
                          <div className="text-sky-300 font-extrabold text-xs">
                            ~{toArabicNumeral(khatmProgress.estimatedJuzCompleted)} <span className="text-[10px] text-stone-400">من ٣٠</span>
                          </div>
                        </div>
                        <div className="bg-black/60 p-2 rounded-lg border border-stone-800">
                          <div className="text-stone-400 text-[10px]">قراءة اليوم</div>
                          <div className="text-amber-400 font-extrabold text-xs">
                            {toArabicNumeral(khatmProgress.todayPagesCount)} <span className="text-[10px] text-stone-400">صفحة</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation actions */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => {
                          setKhatmDropdownOpen(false);
                          setActiveView('khatma');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-md shadow-amber-950/30"
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          عرض ومتابعة خطة الختمة
                        </span>
                        <span className="text-[10px] bg-stone-950/20 px-1.5 py-0.2 rounded font-bold">انتقال</span>
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setKhatmDropdownOpen(false);
                            setActiveView('stats');
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-[11px] font-bold transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>إحصائيات القراءة</span>
                        </button>

                        <button
                          onClick={() => {
                            setKhatmDropdownOpen(false);
                            setActiveView('mushaf_page');
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-[11px] font-bold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>متابعة القراءة</span>
                        </button>
                      </div>

                      {/* Milestone Testing & Reset Controls */}
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                        {!khatmProgress.isCompleted ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestMilestoneCompletion();
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 transition-colors"
                            title="تجربة تفعيل احتفال إكمال الختمة ١٠٠٪ مباشرة"
                          >
                            <span>✨ تجربة إكمال الختمة (١٠٠٪)</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetKhatmProgress();
                            }}
                            className="text-stone-400 hover:text-amber-300 hover:underline flex items-center gap-1 transition-colors"
                            title="إعادة ضبط الصفحات للبدء من جديد"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>بدء ختمة جديدة</span>
                          </button>
                        )}
                        <span className="text-stone-500 font-mono text-[9px]">تحديث فوري تلقائي</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Live Voice Conversation Button (Gemini 3.8 Live API) */}
            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/60 text-xs sm:text-sm font-extrabold shadow-md shadow-amber-950/30 transition-all hover:scale-105 active:scale-95 group"
                title="محادثة صوتية حية فورية ومباشرة (Gemini 3.8 Live API)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Radio className="w-4 h-4 text-amber-400 group-hover:animate-pulse shrink-0" />
                <span className="font-extrabold whitespace-nowrap">محادثة حية</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black">Live</span>
              </button>
            )}

            {/* Main Feature Button: تشغيل وضع القرآن */}
            {onOpenQuranModeModal && (
              <button
                onClick={onOpenQuranModeModal}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 border border-amber-300 text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-950/40 transition-all hover:scale-105 active:scale-95"
                title="مشغل القرآن الصوتي (مشغل صوتي احترافي لجميع السور)"
              >
                <Headphones className="w-4 h-4 text-stone-950 animate-bounce" />
                <span className="font-extrabold whitespace-nowrap hidden md:inline">مشغل القرآن الصوتي</span>
                <span className="font-extrabold whitespace-nowrap md:hidden">المشغل</span>
              </button>
            )}

            {/* Background Audio Active Indicator & Restorer Button */}
            {isAudioActiveInBackground && onRestoreAudioPlayer && (
              <button
                onClick={onRestoreAudioPlayer}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-xs font-bold transition-all animate-pulse shadow-md"
                title="التلاوة مستمرة في الخلفية - انقر لإظهار المشغل"
              >
                <Headphones className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="hidden sm:inline">جاري الاستماع</span>
              </button>
            )}

            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs sm:text-sm border border-stone-800 transition-colors"
              title="بحث في الآيات والسور"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">بحث</span>
            </button>

            {/* Listening Mode Direct Button */}
            {onToggleListeningMode && (
              <button
                onClick={onToggleListeningMode}
                className="hidden xs:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-bold transition-all shadow-sm group"
                title="تفعيل وضع الاستماع الخاشع (إخفاء كافة الأشرطة والقوائم للتركيز التام مع استمرار الصوت)"
              >
                <Headphones className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">وضع الاستماع</span>
              </button>
            )}

            {/* Global Color Theme Switcher Button */}
            {onOpenThemeSwitcher && (
              <button
                onClick={onOpenThemeSwitcher}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 hover:border-amber-500/40 text-xs font-bold transition-all shadow-sm"
                title="تخصيص ألوان وسمة الموقع"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">السمات والألوان</span>
              </button>
            )}

            {/* Daily Notifications Button */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="hidden md:flex relative items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 hover:border-amber-500/40 text-xs font-bold transition-all shadow-sm group"
                title="ضبط تنبيهات وإشعارات الورد القرآني اليومي"
              >
                <Bell className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline">منبّه الورد</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              </button>
            )}

            {/* Android App Button */}
            {onOpenAndroidInstall && (
              <button
                onClick={onOpenAndroidInstall}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 text-xs font-bold transition-all shadow-sm group"
                title="تثبيت وتحميل تطبيق أندرويد (Android App)"
              >
                <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>تطبيق أندرويد</span>
              </button>
            )}

            {/* Direct Day / Night Switcher */}
            {onToggleSiteMode && (
              <button
                onClick={onToggleSiteMode}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                  siteMode === 'dark'
                    ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 hover:bg-amber-200 text-stone-900 border-amber-300'
                }`}
                title={siteMode === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              >
                {siteMode === 'dark' ? (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span className="hidden md:inline">وضع ليلي</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="hidden md:inline">وضع نهاري</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Mushaf Color Switcher Toggle */}
            <div className="relative">
              <button
                onClick={() => setMushafColorMenuOpen(!mushafColorMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  mushafColorMenuOpen
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-extrabold'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-stone-800'
                }`}
                title="تغيير لون ورقة المصحف الشريف"
              >
                <span className="w-3.5 h-3.5 rounded-full border border-amber-400/80 bg-amber-400 inline-block"></span>
                <span className="hidden md:inline">لون المصحف</span>
              </button>

              {/* Color Popup Menu */}
              {mushafColorMenuOpen && (
                <div className="absolute left-0 sm:right-0 mt-2 w-52 p-3 bg-black border border-amber-500/40 rounded-2xl shadow-2xl z-50 space-y-2 backdrop-blur-xl">
                  <div className="text-[11px] font-bold text-amber-400 pb-1 border-b border-stone-800 flex items-center justify-between">
                    <span>ألوان ورق المصحف</span>
                    <button onClick={() => setMushafColorMenuOpen(false)} className="text-stone-400 hover:text-white">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {mushafThemes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setPaperTheme(t.id);
                          setMushafColorMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${t.bgClass} ${t.textColor} ${
                          paperTheme === t.id ? 'ring-2 ring-amber-400 border-amber-400 shadow-md' : `${t.borderClass} opacity-85 hover:opacity-100`
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${t.borderClass} ${t.bgClass}`}></span>
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reading Settings Toggle */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-lg border transition-colors ${
                settingsOpen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
              }`}
              title="إعدادات الخط والقارئ"
            >
              <Type className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reading & Appearance Settings Panel Modal/Drawer */}
      {settingsOpen && (
        <div className="bg-black/98 border-b border-amber-500/30 p-4 sm:p-6 shadow-2xl transition-all">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-200 text-sm">
            
            {/* Theme Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sun className="w-4 h-4" />
                  تخصيص لون ورق المصحف الشريف
                </label>
                {onToggleEyeComfortMode && (
                  <button
                    onClick={onToggleEyeComfortMode}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                      eyeComfortMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                    title="ضبط تباين الألوان تلقائياً لراحة العين ليلاً"
                  >
                    <Eye className="w-3 h-3" />
                    <span>راحة العين: {eyeComfortMode ? 'مفعل' : 'معطل'}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mushafThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPaperTheme(t.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${t.bgClass} ${t.textColor} ${
                      paperTheme === t.id ? 'ring-2 ring-amber-400 border-amber-400 shadow-lg scale-102' : `${t.borderClass} opacity-80 hover:opacity-100`
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 border ${t.borderClass} ${t.bgClass}`}></span>
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Style Controls */}
            <div className="space-y-3 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Type className="w-4 h-4" />
                  حجم خط المصحف والقراءة
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                  {fontSize}px
                </span>
              </div>

              {/* Dynamic Slider Control (16px to 48px) */}
              <div className="space-y-1.5 bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                    disabled={fontSize <= 16}
                    className="w-8 h-8 flex items-center justify-center bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 rounded-xl font-bold text-xs text-stone-200 border border-stone-700 transition-all shrink-0 active:scale-95"
                    title="تصغير الخط (-2px)"
                  >
                    A-
                  </button>

                  <div className="flex-1 space-y-1">
                    <input
                      type="range"
                      min="16"
                      max="48"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-amber-500 h-2 bg-stone-700 rounded-lg cursor-pointer transition-all"
                      aria-label="تغيير حجم خط المصحف بين 16 و 48 بكسل"
                    />
                    <div className="flex justify-between text-[10px] text-stone-500 font-semibold px-0.5">
                      <span>16px (دقيق)</span>
                      <span>32px (كبير)</span>
                      <span>48px (أقصى وضوح)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                    disabled={fontSize >= 48}
                    className="w-8 h-8 flex items-center justify-center bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 rounded-xl font-bold text-xs text-stone-200 border border-stone-700 transition-all shrink-0 active:scale-95"
                    title="تكبير الخط (+2px)"
                  >
                    A+
                  </button>
                </div>

                {/* Quick Size Preset Buttons */}
                <div className="grid grid-cols-5 gap-1 pt-1.5">
                  {[
                    { label: '16px', val: 16, title: 'صغير' },
                    { label: '22px', val: 22, title: 'متوسط' },
                    { label: '28px', val: 28, title: 'افتراضي' },
                    { label: '36px', val: 36, title: 'كبير' },
                    { label: '48px', val: 48, title: 'ضخم' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setFontSize(preset.val)}
                      className={`py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        fontSize === preset.val
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                          : 'bg-stone-800/80 text-stone-400 border-stone-700/80 hover:text-stone-200 hover:bg-stone-700'
                      }`}
                      title={preset.title}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Live Real-time Visual Text Preview */}
                <div className="mt-2 pt-2 border-t border-stone-800 text-center overflow-hidden">
                  <div className="text-[10px] text-stone-400 mb-1">معاينة حية للنص القرآني:</div>
                  <div
                    className="text-amber-300 font-quran select-none transition-all duration-150 leading-relaxed py-1 px-2 bg-stone-950/60 rounded-xl border border-stone-800/80"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                </div>
              </div>

              {/* Font Family Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400">نوع الخط القرآني</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Amiri Quran', 'Scheherazade New', 'Amiri', 'Cairo'] as FontStyle[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => setFontStyle(font)}
                      className={`py-1.5 rounded-xl text-xs border transition-all ${
                        fontStyle === font
                          ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-sm'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      {font === 'Amiri Quran' ? 'مصحف' : font === 'Scheherazade New' ? 'شهرزاد' : font === 'Amiri' ? 'أميري' : 'كايرو'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Default Reciter Selection & Navigation Style */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  القارئ المفضل
                </label>
                <select
                  value={selectedReciter.id}
                  onChange={(e) => {
                    const rec = RECITERS.find(r => r.id === e.target.value);
                    if (rec) setSelectedReciter(rec);
                  }}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2 px-3 text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.subtext})
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation Style Controller */}
              {onSetNavDisplayMode && (
                <div className="space-y-1.5 pt-1 border-t border-stone-800">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    نمط شريط التنقل
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onSetNavDisplayMode('expanded')}
                      className={`flex items-center justify-center gap-1 p-1.5 rounded-lg text-xs font-bold border transition-all ${
                        navDisplayMode === 'expanded'
                          ? 'bg-amber-500 text-stone-950 border-amber-400'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>شريط كامل</span>
                    </button>
                    
                    <button
                      onClick={() => onSetNavDisplayMode('floating')}
                      className={`flex items-center justify-center gap-1 p-1.5 rounded-lg text-xs font-bold border transition-all ${
                        navDisplayMode === 'floating'
                          ? 'bg-amber-500 text-stone-950 border-amber-400'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      <Compass className="w-3 h-3" />
                      <span>أيقونة معلقة</span>
                    </button>

                    <button
                      onClick={() => onSetNavDisplayMode('hidden')}
                      className={`flex items-center justify-center gap-1 p-1.5 rounded-lg text-xs font-bold border transition-all ${
                        navDisplayMode === 'hidden'
                          ? 'bg-amber-500 text-stone-950 border-amber-400'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>إخفاء كلي</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Bar Color Theme */}
              {onSetNavTheme && (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      ألوان ونمط شريط التنقل
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {NAV_THEME_OPTIONS.find(t => t.id === navTheme)?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {NAV_THEME_OPTIONS.map((themeOpt) => {
                      const isSelected = navTheme === themeOpt.id;
                      return (
                        <button
                          key={themeOpt.id}
                          onClick={() => onSetNavTheme(themeOpt.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border text-right transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-400 shadow-md ring-2 ring-amber-500/20'
                              : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-stone-600"
                            style={{ backgroundColor: themeOpt.previewHex }}
                          />
                          <span className="truncate text-[11px]">{themeOpt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quranic Text Color Controller */}
              {onSetQuranTextColor && (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Type className="w-4 h-4" />
                      لون النص القرآني الشريف
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {QURAN_TEXT_COLOR_OPTIONS.find(c => c.id === quranTextColor)?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {QURAN_TEXT_COLOR_OPTIONS.map((txtOpt) => {
                      const isSelected = quranTextColor === txtOpt.id;
                      return (
                        <button
                          key={txtOpt.id}
                          onClick={() => onSetQuranTextColor(txtOpt.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border text-right transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-400 shadow-md ring-2 ring-amber-500/20'
                              : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-stone-500"
                            style={{ backgroundColor: txtOpt.previewHex }}
                          />
                          <span className="truncate text-[11px]">{txtOpt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verse Tracking Highlight Color Controller */}
              {onSetTrackingColor && (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      لون تمييز التتبع (الآية النشطة)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {TRACKING_COLORS.find(c => c.id === trackingColor)?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TRACKING_COLORS.map((col) => {
                      const isSelected = trackingColor === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => onSetTrackingColor(col.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border text-right transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-400 shadow-md ring-2 ring-amber-500/20'
                              : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate text-[11px]">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Listening Mode Activation Card in Settings */}
              {onToggleListeningMode && (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Headphones className="w-4 h-4" />
                      وضع الاستماع والانغماس الخاشع
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      onToggleListeningMode();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-600/30 hover:from-amber-600/50 hover:to-amber-600/50 text-amber-200 border border-amber-500/50 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span>تفعيل وضع الاستماع (إخفاء كافة القوائم للتركيز)</span>
                  </button>
                  <p className="text-[10px] text-stone-400 text-center">
                    يخفي الأشرطة والقوائم بالكامل ويجعل الشاشة مخصصة للتلاوة مع استمرار الصوت في الخلفية
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 border-b border-stone-800 px-4 py-3 space-y-1.5">
          {/* Featured Khatm Completion Card in Mobile Drawer */}
          <div 
            onClick={() => {
              setMobileMenuOpen(false);
              setActiveView('khatma');
            }}
            className={`bg-gradient-to-br ${
              khatmProgress.isCompleted
                ? 'from-amber-950/80 via-stone-900 to-emerald-950/80 border-amber-400 ring-2 ring-amber-400/30'
                : 'from-stone-950 to-stone-900 border-amber-500/40'
            } p-3.5 rounded-2xl border shadow-lg space-y-2.5 mb-2 cursor-pointer hover:border-amber-400 transition-colors relative overflow-hidden`}
          >
            {khatmProgress.isCompleted && (
              <KhatmCelebrationCanvas isCompleted={true} triggerKey={celebrationKey} density="subtle" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${khatmProgress.isCompleted ? 'bg-amber-400 text-stone-950 animate-bounce' : 'bg-amber-500/20 text-amber-400'} border border-amber-500/30`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-100 flex items-center gap-1.5">
                    <span>ختمة المصحف الشريف</span>
                    {khatmProgress.isCompleted ? (
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40 font-sans">
                        مكتملة بحمد الله 🌟
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-normal">(انقر لعرض الخطة)</span>
                    )}
                  </h4>
                  <span className="text-[10px] text-stone-400">
                    {toArabicNumeral(khatmProgress.completedPagesCount)} من ٦٠٤ صفحة مقروءة
                  </span>
                </div>
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {khatmProgress.percentageFormatted}
              </span>
            </div>

            <div className="relative w-full h-2.5 bg-black rounded-full overflow-hidden border border-stone-800 p-0.5">
              <div
                className={`h-full ${
                  khatmProgress.isCompleted
                    ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300'
                } rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(245,158,11,0.6)]`}
                style={{ width: `${Math.min(100, Math.max(khatmProgress.completedPagesCount > 0 ? 1 : 0, khatmProgress.percentage))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5 text-stone-300">
              <span>المتبقي: <strong className="text-emerald-300">{toArabicNumeral(khatmProgress.remainingPages)}</strong> صفحة</span>
              <span>اليوم: <strong className="text-amber-400">{toArabicNumeral(khatmProgress.todayPagesCount)}</strong> ص</span>
              <span>الأجزاء: <strong className="text-sky-300">~{toArabicNumeral(khatmProgress.estimatedJuzCompleted)}</strong> / ٣٠</span>
            </div>
          </div>
          {onOpenLiveVoice && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLiveVoice();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-950 via-amber-900/80 to-amber-950 text-amber-200 border border-amber-400/60 shadow-lg mb-2"
            >
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>المحادثة الصوتية المباشرة (Gemini 3.8 Live API)</span>
              </div>
              <span className="text-[11px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                مباشر Live
              </span>
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNotifications();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-950/40 text-amber-200 border border-amber-500/40 mb-2 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>تنبيهات الورد القرآني (Push Notifications)</span>
              </div>
              <span className="text-[11px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                منبّه يومي
              </span>
            </button>
          )}

          {onOpenAndroidInstall && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAndroidInstall();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 mb-2 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>تطبيق أندرويد (تثبيت وتحميل)</span>
              </div>
              <span className="text-[11px] bg-emerald-500 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                Android APK
              </span>
            </button>
          )}

          {onOpenQuranModeModal && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuranModeModal();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 border border-amber-300 shadow-lg mb-2"
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-stone-950" />
                <span>مشغل القرآن الصوتي (مشغل الصوت)</span>
              </div>
              <span className="text-[11px] bg-stone-950 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                114 سورة
              </span>
            </button>
          )}

          {onToggleListeningMode && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onToggleListeningMode();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2"
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-amber-400" />
                <span>وضع الاستماع الخاشع</span>
              </div>
              <span className="text-[11px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                إخفاء القوائم
              </span>
            </button>
          )}
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.id === 'bookmarks' && bookmarkCount > 0 && (
                  <span className="text-xs bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                    {bookmarkCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Khatm Completion Header Bottom Progress Bar Track */}
      <div 
        className="w-full bg-stone-950/90 h-[2.5px] relative overflow-visible border-t border-amber-500/20 cursor-pointer group"
        onClick={() => {
          setActiveView('khatma');
          if (khatmProgress.isCompleted) {
            triggerKhatmCelebration();
          }
        }}
        title={`نسبة ختم القرآن الكريم: ${khatmProgress.percentageFormatted} (${toArabicNumeral(khatmProgress.completedPagesCount)} من ٦٠٤ صفحة) - انقر لعرض خطة الختمة`}
      >
        <div 
          className={`h-full ${
            khatmProgress.isCompleted
              ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300'
              : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300'
          } transition-all duration-700 ease-out shadow-[0_0_10px_rgba(245,158,11,0.8)] relative`}
          style={{ width: `${Math.min(100, Math.max(khatmProgress.completedPagesCount > 0 ? 0.8 : 0, khatmProgress.percentage))}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/70 blur-[1px] animate-pulse" />
        </div>

        {/* Subtle Canvas Celebration Animation along header bottom track when 100% completed */}
        {khatmProgress.isCompleted && (
          <div className="absolute inset-x-0 -top-5 bottom-0 pointer-events-none h-8 overflow-visible">
            <KhatmCelebrationCanvas
              isCompleted={khatmProgress.isCompleted}
              triggerKey={celebrationKey}
              density="subtle"
              ambientGlow={true}
            />
          </div>
        )}
      </div>
    </header>
  );
};
