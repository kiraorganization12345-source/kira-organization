import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { ViewMode, NavDisplayMode } from '../types';

interface BottomNavProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  bookmarkCount: number;
  navDisplayMode: NavDisplayMode;
  setNavDisplayMode: (mode: NavDisplayMode) => void;
  hasAudioPlaying?: boolean;
  isListeningMode?: boolean;
  onToggleListeningMode?: () => void;
  // Optional backwards compatibility
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
  isVisible,
  onToggleVisibility
}) => {
  // State for the popup menu when in 'floating' (minimized suspended icon) mode
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);

  // If in Listening Mode, the navigation is completely removed
  if (isListeningMode) {
    return null;
  }

  // Derive active mode
  const currentMode: NavDisplayMode = navDisplayMode || (isVisible === false ? 'hidden' : 'expanded');

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'surahs', label: 'السور', icon: <BookOpen className="w-5 h-5" />, description: 'فهرس سور القرآن الكريم' },
    { id: 'mushaf_page', label: 'المصحف', icon: <FileText className="w-5 h-5" />, description: 'القراءة بالصفحات الشريفة' },
    { id: 'ai_assistant', label: 'التدبر الذكي', icon: <Sparkles className="w-5 h-5 text-amber-400" />, description: 'مساعد الذكاء الاصطناعي القرآني' },
    { id: 'athkar', label: 'الأذكار', icon: <Heart className="w-5 h-5 text-rose-400" />, description: 'حصن المسلم والأذكار اليومية' },
    { id: 'prayers', label: 'الصلوات', icon: <Clock className="w-5 h-5 text-blue-400" />, description: 'مواقيت الصلاة الدقيقة والقبلة' },
    { id: 'khatma', label: 'الختمة', icon: <Calendar className="w-5 h-5 text-emerald-400" />, description: 'متابعة جدول ختم القرآن' },
    { id: 'bookmarks', label: 'المحفوظات', icon: <Bookmark className="w-5 h-5 text-amber-300" />, description: 'الآيات والعلامات المرجعية' }
  ];

  const activeItem = navItems.find(i => i.id === activeView) || navItems[0];

  return (
    <>
      {/* ============================================================ */}
      {/* 1. COMPLETELY HIDDEN MODE: Subtle Floating Restore Trigger   */}
      {/* ============================================================ */}
      {currentMode === 'hidden' && (
        <div className="fixed bottom-4 left-4 z-40 animate-fade-in">
          <div className="group relative flex items-center">
            <button
              onClick={() => setNavDisplayMode('floating')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/90 text-amber-300 border border-amber-500/40 shadow-2xl backdrop-blur-xl hover:bg-stone-900 hover:scale-105 active:scale-95 transition-all text-xs font-bold"
              title="إظهار أيقونة التنقل المعلقة"
            >
              <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>التنقل</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNavDisplayMode('expanded');
                }}
                className="mr-1 text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-stone-950 px-1.5 py-0.5 rounded-full transition-colors"
                title="توسيع الشريط كاملاً"
              >
                شريط كامل
              </button>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MINIMIZED SUSPENDED FLOATING ICON (أيقونة معلقة صغيرة)     */}
      {/* ============================================================ */}
      {currentMode === 'floating' && (
        <div className="fixed bottom-5 left-4 sm:left-6 z-40 animate-fade-in">
          
          {/* Floating Menu Popover (when clicked) */}
          {floatingMenuOpen && (
            <div className="absolute bottom-16 left-0 w-72 sm:w-80 bg-black/95 text-stone-100 border border-amber-500/50 rounded-3xl shadow-2xl shadow-black backdrop-blur-2xl p-3 sm:p-4 mb-2 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
              
              {/* Header inside popover */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-200">القائمة السريعة للتنقل</h5>
                    <p className="text-[10px] text-stone-400">اختر القسم أو غيّر نمط العرض</p>
                  </div>
                </div>

                <button
                  onClick={() => setFloatingMenuOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Navigation Items */}
              <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setFloatingMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-right transition-all text-xs font-bold border ${
                        isActive
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md scale-102'
                          : 'bg-stone-900/90 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white hover:border-amber-500/30'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isActive ? 'bg-stone-950/20 text-stone-950' : 'bg-black/50 text-amber-300'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <span className="truncate block font-cairo">{item.label}</span>
                        {item.id === 'bookmarks' && bookmarkCount > 0 && (
                          <span className="text-[9px] text-amber-400 font-normal">({bookmarkCount} محفوظ)</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Display Mode Switcher Controls inside Popover */}
              <div className="pt-2 border-t border-stone-800 space-y-1.5 text-[11px]">
                {onToggleListeningMode && (
                  <button
                    onClick={() => {
                      setFloatingMenuOpen(false);
                      onToggleListeningMode();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-stone-950 font-bold transition-all shadow-sm"
                  >
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span>تفعيل وضع الاستماع الخاشع</span>
                  </button>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setNavDisplayMode('expanded');
                      setFloatingMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-amber-300 border border-stone-800 hover:border-amber-400 transition-all font-bold"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>توسيع لشريط كامل</span>
                  </button>

                  <button
                    onClick={() => {
                      setNavDisplayMode('hidden');
                      setFloatingMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-800 transition-all font-bold"
                    title="إخفاء شريط التنقل كلياً"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>إخفاء كلي</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* The Suspended Floating Action Icon/Pill */}
          <div className="flex items-center gap-2">
            
            {/* Primary Suspended Circular/Pill Badge */}
            <button
              onClick={() => setFloatingMenuOpen(!floatingMenuOpen)}
              className={`group relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-black/95 text-stone-100 border-2 transition-all duration-300 shadow-2xl backdrop-blur-xl hover:scale-105 active:scale-95 ${
                floatingMenuOpen 
                  ? 'border-amber-400 ring-4 ring-amber-500/20 bg-amber-950/40 text-amber-200' 
                  : 'border-amber-500/60 hover:border-amber-400 shadow-amber-500/10'
              }`}
              title="فتح قائمة التنقل السريع المصغرة"
            >
              {/* Pulsing indicator ring */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-black"></span>
              </span>

              {/* Active Section Icon */}
              <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-sm shrink-0">
                {activeItem.icon}
              </div>

              {/* Current Active Section Label */}
              <div className="text-right flex flex-col items-start pr-1">
                <span className="text-[11px] font-bold text-amber-200 leading-tight font-cairo">
                  {activeItem.label}
                </span>
                <span className="text-[9px] text-stone-400 leading-tight hidden sm:block">
                  تنقل معلق
                </span>
              </div>

              {/* Toggle Chevron */}
              <div className="text-stone-400 group-hover:text-amber-300 mr-1">
                {floatingMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Quick Expand to Full Bar direct mini button */}
            <button
              onClick={() => setNavDisplayMode('expanded')}
              className="p-2 rounded-full bg-black/90 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-800 hover:border-amber-500/40 shadow-lg backdrop-blur-md transition-all"
              title="توسيع لشريط التنقل الكامل"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 3. EXPANDED FULL BOTTOM BAR MODE (الشريط الكامل التقليدي)      */}
      {/* ============================================================ */}
      <div 
        className={`fixed left-0 right-0 z-30 transition-all duration-300 transform ${
          currentMode === 'expanded' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        } ${hasAudioPlaying ? 'bottom-[88px] sm:bottom-[76px]' : 'bottom-0'}`}
      >
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-2">
          <nav className="bg-black/95 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black backdrop-blur-xl px-2 py-1.5 flex items-center justify-around text-stone-300">
            
            {/* Nav Items */}
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`relative flex flex-col items-center justify-center py-1.5 px-2 sm:px-3 rounded-xl transition-all ${
                    isActive
                      ? 'text-amber-300 font-extrabold bg-amber-500/15 scale-105'
                      : 'hover:text-stone-100 hover:bg-stone-900/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="relative">
                    {item.icon}
                    {item.id === 'bookmarks' && bookmarkCount > 0 && (
                      <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center shadow">
                        {bookmarkCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] mt-0.5 whitespace-nowrap font-cairo">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5"></span>
                  )}
                </button>
              );
            })}

            {/* Quick Action: Collapse into Floating Icon (تقليص لأيقونة معلقة) */}
            <div className="flex items-center gap-1 border-r border-stone-800 pr-1 mr-1">
              <button
                onClick={() => setNavDisplayMode('floating')}
                className="flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-xl text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                title="تقليص نمط التنقل إلى أيقونة صغيرة معلقة"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="text-[9px] whitespace-nowrap hidden sm:inline">تقليص</span>
              </button>

              <button
                onClick={() => setNavDisplayMode('hidden')}
                className="hidden md:flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-stone-500 hover:text-stone-300 hover:bg-stone-900/40 transition-colors"
                title="إخفاء شريط التنقل تماماً"
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-[9px] whitespace-nowrap">إخفاء</span>
              </button>
            </div>

          </nav>
        </div>
      </div>
    </>
  );
};
