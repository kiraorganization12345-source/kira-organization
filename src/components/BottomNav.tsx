import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  FileText, 
  Bookmark, 
  Sparkles, 
  Heart, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Compass,
  Layers,
  Headphones,
  X,
  BarChart3,
  Search,
  Sliders,
  Settings2,
  Moon,
  Sun,
  Smartphone,
  Volume2,
  Palette,
  Bell,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Mic,
  ArrowRight,
  Trophy,
  Radio
} from 'lucide-react';
import { ViewMode, NavDisplayMode, NavThemeColor, PaperTheme, FontStyle, Reciter, SiteMode } from '../types';
import { getNavThemeConfig, PAPER_THEME_OPTIONS } from '../data/quranThemes';
import { RECITERS } from '../data/reciters';
import { triggerHaptic, getDeviceInfo, setDevicePreference, DeviceModePreference } from '../services/deviceService';
import { toArabicNumeral } from '../services/quranApi';
import { useKhatmProgress } from '../services/khatmProgressService';

interface BottomNavProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  bookmarkCount: number;
  navDisplayMode: NavDisplayMode;
  setNavDisplayMode: (mode: NavDisplayMode) => void;
  hasAudioPlaying?: boolean;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
  navTheme?: NavThemeColor;
  // Controls transferred from top bar:
  onOpenSearch?: () => void;
  onOpenThemeSwitcher?: () => void;
  onOpenNotifications?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenAndroidInstall?: () => void;
  onOpenQuranModeModal?: () => void;
  siteMode?: SiteMode;
  onToggleSiteMode?: () => void;
  eyeComfortMode?: boolean;
  onToggleEyeComfortMode?: () => void;
  selectedReciter?: Reciter;
  onSelectReciter?: (reciter: Reciter) => void;
  paperTheme?: PaperTheme;
  onSetPaperTheme?: (theme: PaperTheme) => void;
  fontSize?: number;
  onSetFontSize?: (size: number) => void;
  isAudioActiveInBackground?: boolean;
  onRestoreAudioPlayer?: () => void;
  onBackToSurahs?: () => void;
  // Backwards compatibility
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  setActiveView,
  bookmarkCount,
  navDisplayMode,
  setNavDisplayMode,
  hasAudioPlaying = false,
  isListeningMode = false,
  onToggleListeningMode,
  navTheme = 'stone',
  onOpenSearch,
  onOpenThemeSwitcher,
  onOpenNotifications,
  onOpenLiveVoice,
  onOpenAndroidInstall,
  onOpenQuranModeModal,
  siteMode = 'dark',
  onToggleSiteMode,
  eyeComfortMode = false,
  onToggleEyeComfortMode,
  selectedReciter,
  onSelectReciter,
  paperTheme = 'dark',
  onSetPaperTheme,
  fontSize = 28,
  onSetFontSize,
  isAudioActiveInBackground = false,
  onRestoreAudioPlayer,
  onBackToSurahs,
  isVisible,
  onToggleVisibility
}) => {
  // State for the popup menu when in 'floating' mode
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  // State for the Quick Tools & Settings Drawer (All transferred from top bar)
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const [devicePref, setDevicePref] = useState<DeviceModePreference>('auto');

  const { progress: khatmProgress } = useKhatmProgress();

  // Smart Bottom Navigation Auto-Hide & Reveal on Scroll
  const [isBottomNavScrolledVisible, setIsBottomNavScrolledVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          if (currentScrollY < 60) {
            setIsBottomNavScrolledVisible(true);
          } else if (currentScrollY > lastScrollYRef.current + 10) {
            // Scrolling down -> hide bottom bar seamlessly
            setIsBottomNavScrolledVisible(false);
            setFloatingMenuOpen(false);
            setToolsDrawerOpen(false);
          } else if (currentScrollY < lastScrollYRef.current - 12) {
            // Scrolling up -> reveal bottom bar smoothly
            setIsBottomNavScrolledVisible(true);
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

  useEffect(() => {
    try {
      const info = getDeviceInfo();
      setDevicePref(info.preference);
    } catch (e) {}
  }, []);

  const handleDeviceChange = (pref: DeviceModePreference) => {
    setDevicePreference(pref);
    setDevicePref(pref);
    triggerHaptic('medium');
    // If phone preference selected, suggest smaller font
    if (pref === 'mobile' && onSetFontSize && fontSize > 22) {
      onSetFontSize(20);
    }
  };

  const themeConfig = getNavThemeConfig(navTheme);

  // If in Listening Mode, the navigation is completely removed
  if (isListeningMode) {
    return null;
  }

  // Derive active mode
  const currentMode: NavDisplayMode = navDisplayMode || (isVisible === false ? 'hidden' : 'expanded');

  // Primary navigation views
  const primaryNavItems: { id: ViewMode; label: string; icon: React.ReactNode; isAccent?: boolean }[] = [
    { id: 'surahs', label: 'السور', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'realistic_book', label: 'مصحف 3D', icon: <BookOpen className="w-5 h-5 text-amber-400" />, isAccent: true },
    { id: 'mushaf_page', label: 'الصفحات', icon: <FileText className="w-5 h-5" /> },
    { id: 'listening', label: 'الاستماع', icon: <Headphones className="w-5 h-5 text-teal-400" /> },
    { id: 'khatma', label: 'الختمة', icon: <Calendar className="w-5 h-5 text-emerald-400" /> }
  ];

  // Secondary views inside drawer
  const moreViews: { id: ViewMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'realistic_book', label: 'المصحف ثلاثي الأبعاد 3D', icon: <BookOpen className="w-5 h-5 text-amber-400" />, desc: 'مجسم 3D كامل على حامل خشبي مع التدوير الحر' },
    { id: 'athkar', label: 'الأذكار والادعية', icon: <Heart className="w-5 h-5 text-rose-400" />, desc: 'حصن المسلم وأذكار الصباح والمساء' },
    { id: 'stats', label: 'إحصائيات القراءة', icon: <BarChart3 className="w-5 h-5 text-emerald-400" />, desc: 'متابعة الصفحات والوقت' },
    { id: 'prayers', label: 'أوقات الصلاة والقبلة', icon: <Clock className="w-5 h-5 text-blue-400" />, desc: 'مواقيت الصلوات الخمس' },
    { id: 'ai_assistant', label: 'التدبر بالذكاء الاصطناعي', icon: <Sparkles className="w-5 h-5 text-amber-400" />, desc: 'إجابات وتدبر قرآني موثوق' },
    { id: 'bookmarks', label: 'المحفوظات والعلامات', icon: <Bookmark className="w-5 h-5 text-amber-300" />, desc: `${bookmarkCount} آية محفوظة` }
  ];

  return (
    <>
      {/* ============================================================ */}
      {/* 1. COMPLETELY HIDDEN MODE: Subtle Floating Restore Trigger   */}
      {/* ============================================================ */}
      {currentMode === 'hidden' && (
        <div className="fixed bottom-4 left-4 z-40 animate-fade-in">
          <div className="group relative flex items-center bg-black/95 text-amber-300 border border-amber-500/50 shadow-2xl backdrop-blur-xl rounded-full px-3 py-1.5 hover:bg-stone-900 transition-all text-xs font-bold gap-2">
            <button
              onClick={() => setNavDisplayMode('floating')}
              className="flex items-center gap-1.5 hover:text-amber-200 transition-colors"
              title="إظهار أيقونة التنقل المعلقة"
            >
              <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>التنقل</span>
            </button>
            <button
              onClick={() => setNavDisplayMode('expanded')}
              className="text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-stone-950 px-2 py-0.5 rounded-full transition-colors font-bold"
              title="توسيع شريط التنقل كاملاً"
            >
              شريط كامل
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MINIMIZED SUSPENDED FLOATING ICON (أيقونة معلقة صغيرة)     */}
      {/* ============================================================ */}
      {currentMode === 'floating' && (
        <div className="fixed bottom-5 left-4 sm:left-6 z-40 animate-fade-in">
          
          {/* Floating Menu Popover */}
          {floatingMenuOpen && (
            <div className="absolute bottom-16 left-0 w-80 bg-stone-950 text-stone-100 border border-amber-500/50 rounded-3xl shadow-2xl shadow-black backdrop-blur-2xl p-4 mb-2 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
              
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-200">التنقل السريع المعلق</h5>
                    <p className="text-[10px] text-stone-400">اختر القسم أو افتح الأدوات</p>
                  </div>
                </div>

                <button
                  onClick={() => setFloatingMenuOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Views */}
              <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {[...primaryNavItems, ...moreViews].map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveView(item.id);
                        setFloatingMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-right transition-all text-xs font-bold border ${
                        isActive
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                          : 'bg-stone-900/90 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white'
                      }`}
                    >
                      <div className="shrink-0">{item.icon}</div>
                      <span className="truncate block font-cairo">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    setFloatingMenuOpen(false);
                    setToolsDrawerOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-500 hover:text-stone-950 transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>الأدوات والإعدادات</span>
                </button>

                <button
                  onClick={() => {
                    setNavDisplayMode('expanded');
                    setFloatingMenuOpen(false);
                  }}
                  className="py-2 px-3 rounded-xl bg-stone-900 text-stone-300 border border-stone-800 text-xs font-bold hover:text-white transition-all"
                  title="توسيع لشريط كامل"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* Suspended Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setFloatingMenuOpen(!floatingMenuOpen);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-black/95 text-stone-100 border-2 border-amber-500/60 hover:border-amber-400 shadow-2xl backdrop-blur-xl hover:scale-105 active:scale-95 transition-all"
              title="فتح التنقل السريع"
            >
              <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="text-xs font-bold text-amber-200">التنقل</span>
            </button>

            <button
              onClick={() => setToolsDrawerOpen(true)}
              className="p-2.5 rounded-full bg-black/90 hover:bg-stone-800 text-amber-400 border border-amber-500/40 shadow-xl transition-all"
              title="فتح أدوات وإعدادات التطبيق"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Background Active Audio Indicator Pill (Restores audio player on tap) */}
      {isAudioActiveInBackground && onRestoreAudioPlayer && (
        <aside aria-label="مشغل الصوت بالخلفية" className="fixed bottom-20 sm:bottom-24 inset-x-0 flex justify-center z-40 px-3">
          <button
            onClick={onRestoreAudioPlayer}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-extrabold text-xs shadow-2xl border border-amber-300 hover:scale-105 active:scale-95 transition-all animate-bounce"
            title="التلاوة مستمرة في الخلفية - انقر لإظهار المشغل الصوتي"
          >
            <Headphones className="w-4 h-4 text-stone-950 animate-pulse" />
            <span>التلاوة مستمرة بالخلفية • انقر لإظهار المشغل</span>
          </button>
        </aside>
      )}

      {/* ============================================================ */}
      {/* 3. EXPANDED FULL BOTTOM BAR WITH ALL TRANSFERRED CONTROLS    */}
      {/* ============================================================ */}
      <div 
        className={`fixed left-0 right-0 z-30 transition-all duration-300 transform ${
          currentMode === 'expanded' && isBottomNavScrolledVisible
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0 pointer-events-none'
        } ${hasAudioPlaying ? 'bottom-[88px] sm:bottom-[76px]' : 'bottom-0'}`}
      >
        <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-2">
          <nav className={`${themeConfig.bgClasses} border ${themeConfig.borderClasses} rounded-2xl sm:rounded-3xl shadow-2xl shadow-black backdrop-blur-xl px-2 py-1.5 flex items-center justify-between gap-1`}>
            
            {/* Primary Navigation Views */}
            <div className="flex items-center flex-1 justify-around overflow-x-auto no-scrollbar gap-1">
              {primaryNavItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveView(item.id);
                    }}
                    className={`relative flex-1 min-w-[52px] sm:min-w-[64px] shrink-0 flex flex-col items-center justify-center py-1.5 px-1.5 sm:px-2 rounded-xl transition-all active:scale-95 ${
                      isActive
                        ? themeConfig.activeItemClasses
                        : themeConfig.inactiveItemClasses
                    }`}
                  >
                    <div className="relative">
                      {item.icon}
                    </div>
                    <span className="text-[10px] sm:text-[11px] mt-0.5 whitespace-nowrap font-cairo font-bold">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Transferred Actions: Search + Tools Drawer Trigger */}
            <div className="flex items-center gap-1 border-r border-stone-800 pr-1.5 mr-1 shrink-0">
              
              {/* Quick Search in Quran */}
              {onOpenSearch && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenSearch();
                  }}
                  className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-stone-300 hover:text-amber-300 hover:bg-stone-800/60 transition-all active:scale-95"
                  title="البحث في آيات وسور القرآن الكريم"
                >
                  <Search className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold font-cairo">بحث</span>
                </button>
              )}

              {/* Transferred Tools & Controls Drawer Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setToolsDrawerOpen(true);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-2 sm:px-2.5 rounded-xl transition-all active:scale-95 border ${
                  toolsDrawerOpen
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-bold'
                    : 'bg-stone-900/90 text-amber-300 hover:bg-stone-800 border-amber-500/40'
                }`}
                title="لوحة الأدوات والإعدادات المنقولة من الشريط العلوي"
              >
                <div className="relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  {bookmarkCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-amber-400 text-stone-950 text-[8px] font-black flex items-center justify-center">
                      {bookmarkCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold font-cairo">الأدوات</span>
              </button>

              {/* Collapse into Floating Icon button */}
              <button
                onClick={() => setNavDisplayMode('floating')}
                className="hidden sm:flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-800/40 transition-colors"
                title="تقليص نمط التنقل لأيقونة معلقة"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="text-[9px]">تقليص</span>
              </button>
            </div>

          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. COMPREHENSIVE TOOLS & SETTINGS DRAWER                     */}
      {/* (All controls transferred from the top bar into navigation)  */}
      {/* ============================================================ */}
      {toolsDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setToolsDrawerOpen(false)}
        >
          <div 
            className="w-full sm:max-w-xl bg-stone-950 border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-stone-100 animate-slideUp max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-amber-200 font-quran">
                    أدوات وإعدادات التطبيق
                  </h4>
                  <p className="text-[11px] text-stone-400 font-cairo">
                    جميع خيارات التحكم والقرآن المتاحة في شريط التنقل
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setToolsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Khatm Progress Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-300 block font-quran">
                  ختمة القرآن الكريم
                </span>
                <span className="text-xs text-stone-300 block">
                  أنجزت {toArabicNumeral(khatmProgress.completedPagesCount)} من ٦٠٤ صفحة ({toArabicNumeral(khatmProgress.percentage)}%)
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveView('khatma');
                  setToolsDrawerOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-md hover:bg-amber-400 transition-all shrink-0"
              >
                عرض الخطة
              </button>
            </div>

            {/* 2. Device Mode Preference (هاتف / تابلت / كمبيوتر) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-300 block">
                📱 نمط العرض ونوع الجهاز (Phone / Tablet / Desktop):
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: 'auto', label: 'تلقائي' },
                  { id: 'mobile', label: 'هاتف' },
                  { id: 'tablet', label: 'تابلت' },
                  { id: 'desktop', label: 'كمبيوتر' }
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDeviceChange(d.id as any)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      devicePref === d.id
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {devicePref === 'mobile' && (
                <p className="text-[11px] text-amber-300 font-cairo">
                  ✓ وضع الهاتف مفعل: خط القرآن مدمج ومناسب تماماً لشاشات الهواتف الذكية.
                </p>
              )}
            </div>

            {/* 3. Reciter Selector */}
            {onSelectReciter && selectedReciter && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-stone-300 block">
                  🎙️ القارئ المختار للتلاوة الصوتية:
                </span>
                <select
                  value={selectedReciter.id}
                  onChange={(e) => {
                    const r = RECITERS.find(rec => rec.id === e.target.value);
                    if (r) onSelectReciter(r);
                  }}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-amber-200 font-bold text-xs outline-none focus:border-amber-400"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      الشيخ {r.name} - {r.subtext}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Paper Theme Color Bubbles */}
            {onSetPaperTheme && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-300 block">
                  📜 لون ورق المصحف الشريف:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PAPER_THEME_OPTIONS.slice(0, 6).map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => onSetPaperTheme(pt.id as PaperTheme)}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        paperTheme === pt.id
                          ? 'border-amber-400 ring-2 ring-amber-400/40 bg-stone-850 text-amber-200'
                          : 'border-stone-800 bg-stone-900/80 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-stone-600 shadow-sm" style={{ backgroundColor: pt.previewBg }} />
                      <span className="text-[10px] truncate">{pt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Font Size Quick Scaler */}
            {onSetFontSize && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
                <span className="font-bold text-stone-300">حجم خط القرآن:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetFontSize(Math.max(16, fontSize - 2))}
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-bold text-sm transition-all flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-amber-300 text-sm">
                    {fontSize}
                  </span>
                  <button
                    onClick={() => onSetFontSize(Math.min(46, fontSize + 2))}
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-bold text-sm transition-all flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 6. Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
              
              {/* Site Mode: Dark / Light */}
              {onToggleSiteMode && (
                <button
                  onClick={onToggleSiteMode}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-bold transition-all"
                >
                  {siteMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
                  <span>{siteMode === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                </button>
              )}

              {/* Eye Comfort Mode */}
              {onToggleEyeComfortMode && (
                <button
                  onClick={onToggleEyeComfortMode}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    eyeComfortMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
                  }`}
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>{eyeComfortMode ? 'راحة العين: مفعل' : 'وضع راحة العين'}</span>
                </button>
              )}

              {/* Daily Reminder Notifications */}
              {onOpenNotifications && (
                <button
                  onClick={() => {
                    setToolsDrawerOpen(false);
                    onOpenNotifications();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-bold transition-all"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>تنبيهات الورد</span>
                </button>
              )}

              {/* Install PWA Mobile App */}
              {onOpenAndroidInstall && (
                <button
                  onClick={() => {
                    setToolsDrawerOpen(false);
                    onOpenAndroidInstall();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-bold transition-all"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>تثبيت للهاتف</span>
                </button>
              )}

              {/* Dedicated Quran Audio Player Mode */}
              {onOpenQuranModeModal && (
                <button
                  onClick={() => {
                    setToolsDrawerOpen(false);
                    onOpenQuranModeModal();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
                >
                  <Headphones className="w-4 h-4 text-amber-400" />
                  <span>مشغل القرآن الصوتي</span>
                </button>
              )}

              {/* Theme Studio / Colors */}
              {onOpenThemeSwitcher && (
                <button
                  onClick={() => {
                    setToolsDrawerOpen(false);
                    onOpenThemeSwitcher();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-bold transition-all"
                >
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>السمات والألوان</span>
                </button>
              )}

              {/* Live Voice AI */}
              {onOpenLiveVoice && (
                <button
                  onClick={() => {
                    setToolsDrawerOpen(false);
                    onOpenLiveVoice();
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-600/30 to-emerald-600/30 hover:from-amber-600/40 hover:to-emerald-600/40 text-amber-200 border border-amber-500/50 text-xs font-bold transition-all shadow-md"
                >
                  <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>تحدث مع المساعد الصوتي القرآني المباشر (Gemini Live)</span>
                </button>
              )}

            </div>

            {/* Additional Sections Quick Jump */}
            <div className="pt-2 border-t border-stone-800 space-y-1.5">
              <span className="text-[11px] font-bold text-stone-400 block">أقسام إضافية:</span>
              <div className="grid grid-cols-2 gap-2">
                {moreViews.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setActiveView(v.id);
                      setToolsDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all text-xs font-bold ${
                      activeView === v.id
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
                    }`}
                  >
                    <div className="shrink-0">{v.icon}</div>
                    <div className="truncate">
                      <span className="block truncate">{v.label}</span>
                      <span className="text-[9px] text-stone-400 block truncate">{v.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </>
  );
};
