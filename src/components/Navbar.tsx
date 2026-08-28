import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { ViewMode, PaperTheme, FontStyle, Reciter, NavDisplayMode, TrackingHighlightColor } from '../types';
import { RECITERS } from '../data/reciters';
import { TRACKING_COLORS } from '../data/highlightColors';
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
  siteMode?: 'dark' | 'light';
  onToggleSiteMode?: () => void;
  eyeComfortMode?: boolean;
  onToggleEyeComfortMode?: () => void;
  isAudioActiveInBackground?: boolean;
  onRestoreAudioPlayer?: () => void;
  navDisplayMode?: NavDisplayMode;
  onSetNavDisplayMode?: (mode: NavDisplayMode) => void;
  trackingColor?: TrackingHighlightColor;
  onSetTrackingColor?: (color: TrackingHighlightColor) => void;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
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
  isListeningMode = false,
  onToggleListeningMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mushafColorMenuOpen, setMushafColorMenuOpen] = useState(false);

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
    { id: 'ai_assistant', label: 'وضع الذكاء الاصطناعي', icon: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> },
    { id: 'mushaf_page', label: 'قراءة بالصفحات', icon: <FileText className="w-4 h-4" /> },
    { id: 'khatma', label: 'خطة الختمة', icon: <Calendar className="w-4 h-4" /> },
    { id: 'athkar', label: 'الأذكار والادعية', icon: <Heart className="w-4 h-4" /> },
    { id: 'prayers', label: 'أوقات الصلاة', icon: <Clock className="w-4 h-4" /> },
    { id: 'bookmarks', label: 'المحفوظات', icon: <Bookmark className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/95 text-stone-100 backdrop-blur-xl border-b border-amber-500/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
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
            
            {/* Background Audio Active Indicator & Restorer Button */}
            {isAudioActiveInBackground && onRestoreAudioPlayer && (
              <button
                onClick={onRestoreAudioPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-xs font-bold transition-all animate-pulse shadow-md"
                title="التلاوة مستمرة في الخلفية - انقر لإظهار المشغل"
              >
                <Headphones className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="hidden sm:inline">جاري الاستماع</span>
              </button>
            )}

            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs sm:text-sm border border-stone-800 transition-colors"
              title="بحث في الآيات والسور"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">بحث</span>
            </button>

            {/* Listening Mode Direct Button */}
            {onToggleListeningMode && (
              <button
                onClick={onToggleListeningMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-bold transition-all shadow-sm group"
                title="تفعيل وضع الاستماع الخاشع (إخفاء كافة الأشرطة والقوائم للتركيز التام مع استمرار الصوت)"
              >
                <Headphones className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">وضع الاستماع</span>
              </button>
            )}

            {/* Direct Day / Night Switcher */}
            {onToggleSiteMode && (
              <button
                onClick={onToggleSiteMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                  siteMode === 'dark'
                    ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 hover:bg-amber-200 text-stone-900 border-amber-300'
                }`}
                title={siteMode === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              >
                {siteMode === 'dark' ? (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">وضع ليلي</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline">وضع نهاري</span>
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
        <div className="lg:hidden bg-stone-900 border-b border-stone-800 px-4 py-3 space-y-1">
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
    </header>
  );
};
