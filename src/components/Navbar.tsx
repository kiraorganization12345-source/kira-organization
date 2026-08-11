import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Bookmark, 
  Search, 
  Calendar, 
  Clock, 
  Sun, 
  Volume2, 
  Type, 
  Compass, 
  Sparkles,
  Menu,
  X,
  Heart
} from 'lucide-react';
import { ViewMode, PaperTheme, FontStyle, Reciter } from '../types';
import { RECITERS } from '../data/reciters';
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
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <header className="sticky top-0 z-40 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-stone-100 backdrop-blur-md border-b border-amber-500/30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 space-x-reverse cursor-pointer group" onClick={() => setActiveView('surahs')}>
            <div className="relative w-11 h-11 rounded-2xl bg-stone-900 border-2 border-amber-400/80 overflow-hidden shadow-lg shadow-amber-900/40 transition-transform group-hover:scale-105 shrink-0">
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
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
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
            
            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs sm:text-sm border border-stone-700 transition-colors"
              title="بحث في الآيات والسور"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">بحث سريع</span>
            </button>

            {/* Reading Settings Toggle */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-lg border transition-colors ${
                settingsOpen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
              title="إعدادات الخط والتميمة والقارئ"
            >
              <Type className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reading & Appearance Settings Panel Modal/Drawer */}
      {settingsOpen && (
        <div className="bg-stone-850 border-b border-stone-700 bg-stone-900/98 p-4 shadow-2xl transition-all">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-200 text-sm">
            
            {/* Theme Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4" />
                نمط خلفية القراءة (الورق)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'light', name: 'فاتح', class: 'bg-[#fffdf7] text-stone-900 border-stone-300' },
                  { id: 'sepia', name: 'كريمي', class: 'bg-[#fbf0d9] text-stone-900 border-amber-300' },
                  { id: 'dark', name: 'داكن', class: 'bg-stone-900 text-stone-100 border-stone-700' },
                  { id: 'emerald', name: 'زمردي', class: 'bg-emerald-950 text-emerald-100 border-emerald-700' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPaperTheme(t.id as PaperTheme)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${t.class} ${
                      paperTheme === t.id ? 'ring-2 ring-amber-400 shadow-md' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Style Controls */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-amber-400">
                <span>حجم خط المصحف ({fontSize}px)</span>
                <span className="font-quran text-lg">بِسْمِ اللَّهِ</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(20, fontSize - 2))}
                  className="px-2.5 py-1 bg-stone-800 rounded font-bold hover:bg-stone-700 border border-stone-700"
                >
                  A-
                </button>
                <input
                  type="range"
                  min="20"
                  max="48"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <button
                  onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                  className="px-2.5 py-1 bg-stone-800 rounded font-bold hover:bg-stone-700 border border-stone-700"
                >
                  A+
                </button>
              </div>

              {/* Font Family Choice */}
              <div className="flex gap-2 pt-1">
                {(['Amiri Quran', 'Scheherazade New', 'Amiri', 'Cairo'] as FontStyle[]).map((font) => (
                  <button
                    key={font}
                    onClick={() => setFontStyle(font)}
                    className={`flex-1 py-1 rounded text-xs border ${
                      fontStyle === font
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                        : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    {font === 'Amiri Quran' ? 'مصحف' : font === 'Scheherazade New' ? 'شهرزاد' : font === 'Amiri' ? 'أميري' : 'كايرو'}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Reciter Selection */}
            <div className="space-y-2">
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

          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 border-b border-stone-800 px-4 py-3 space-y-1">
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
