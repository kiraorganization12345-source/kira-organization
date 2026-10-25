import React, { useState } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Check, 
  X, 
  Sparkles, 
  Eye, 
  Monitor, 
  Paintbrush,
  BookOpen,
  Sliders,
  Type,
  Maximize2,
  CheckCircle2,
  Layers,
  Flame,
  Radio
} from 'lucide-react';
import { 
  GlobalTheme, 
  PaperTheme, 
  NavThemeColor, 
  QuranTextColor, 
  TrackingHighlightColor, 
  FontStyle,
  SiteMode
} from '../types';
import { 
  GLOBAL_THEME_OPTIONS, 
  NAV_THEME_OPTIONS, 
  PAPER_THEME_OPTIONS, 
  QURAN_TEXT_COLOR_OPTIONS 
} from '../data/quranThemes';
import { TRACKING_COLORS } from '../data/highlightColors';

export interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Site-wide options
  currentTheme: GlobalTheme;
  onSelectTheme: (theme: GlobalTheme) => void;
  siteMode: SiteMode;
  onSetSiteMode: (mode: SiteMode) => void;
  navTheme?: NavThemeColor;
  onSetNavTheme?: (theme: NavThemeColor) => void;
  // Mushaf specific options
  paperTheme?: PaperTheme;
  onSetPaperTheme?: (theme: PaperTheme) => void;
  quranTextColor?: QuranTextColor;
  onSetQuranTextColor?: (color: QuranTextColor) => void;
  trackingColor?: TrackingHighlightColor;
  onSetTrackingColor?: (color: TrackingHighlightColor) => void;
  fontSize?: number;
  onSetFontSize?: (size: number) => void;
  fontStyle?: FontStyle;
  onSetFontStyle?: (style: FontStyle) => void;
  // Backwards compatibility
  onToggleSiteMode?: () => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  siteMode,
  onSetSiteMode,
  navTheme = 'stone',
  onSetNavTheme,
  paperTheme = 'dark',
  onSetPaperTheme,
  quranTextColor = 'default',
  onSetQuranTextColor,
  trackingColor = 'amber',
  onSetTrackingColor,
  fontSize = 28,
  onSetFontSize,
  fontStyle = 'Amiri Quran'
}) => {
  const [activeTab, setActiveTab] = useState<'site' | 'mushaf' | 'highlight'>('site');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-stone-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 text-stone-100 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-amber-200 font-quran">
                استوديو التحكم في الألوان والمظهر
              </h3>
              <p className="text-xs text-stone-400">
                تخصيص كامل لألوان الموقع والمصحف الشريف وخلفيات القراءة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900/80 rounded-2xl border border-stone-800 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('site')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'site'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span>ألوان الموقع والواجهة</span>
          </button>

          <button
            onClick={() => setActiveTab('mushaf')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'mushaf'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ورق وخط المصحف</span>
          </button>

          <button
            onClick={() => setActiveTab('highlight')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'highlight'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>تظليل وتتبع الآيات</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 pl-1">
          
          {/* ============================================================ */}
          {/* TAB 1: SITE-WIDE GLOBAL COLORS & THEMES                      */}
          {/* ============================================================ */}
          {activeTab === 'site' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Site Surface Mode (Dark, AMOLED, Light, Warm) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span>نمط إضاءة وخلفية الموقع بالكامل:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'dark', label: 'ليلي فاخر', desc: 'حجر بركاني مريح', icon: <Moon className="w-4 h-4 text-stone-300" /> },
                    { id: 'amoled', label: 'سواد مطلق', desc: 'AMOLED نقي 100%', icon: <span className="w-3.5 h-3.5 rounded-full bg-black border border-stone-600" /> },
                    { id: 'warm', label: 'عاجي دافئ', desc: 'أوراق عتيقة مهدئة', icon: <span className="w-3.5 h-3.5 rounded-full bg-[#fbf7ee] border border-amber-800" /> },
                    { id: 'light', label: 'نهاري مشرق', desc: 'سطوع ووضوح كامل', icon: <Sun className="w-4 h-4 text-amber-500" /> },
                  ].map((m) => {
                    const isSelected = siteMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => onSetSiteMode(m.id as SiteMode)}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/30 shadow-md'
                            : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-850'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          {m.icon}
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="font-bold text-xs">{m.label}</div>
                        <div className="text-[10px] text-stone-400">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Accent Color (Site-Wide Palette) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span>اللون الأساسي السائد للموقع (الأزرار، الإطارات، والتوهج):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GLOBAL_THEME_OPTIONS.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => onSelectTheme(theme.id)}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-stone-900 border-amber-400 ring-2 ring-amber-500/30 shadow-md'
                            : 'bg-stone-900/40 border-stone-800 hover:bg-stone-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span 
                            className="w-5 h-5 rounded-full border border-white/30 shadow-sm shrink-0 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: theme.previewHex }}
                          />
                          <div>
                            <div className={`text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>
                              {theme.name}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {theme.subtext}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Bar Color Theme */}
              {onSetNavTheme && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>لون شريط التنقل والأشرطة السفلية:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {NAV_THEME_OPTIONS.map((nt) => {
                      const isSelected = navTheme === nt.id;
                      return (
                        <button
                          key={nt.id}
                          onClick={() => onSetNavTheme(nt.id)}
                          className={`p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-stone-900 border-amber-400 ring-1 ring-amber-400/40 text-amber-200 shadow-sm'
                              : 'bg-stone-900/40 border-stone-800 text-stone-300 hover:bg-stone-850'
                          }`}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: nt.previewHex }}
                          />
                          <div className="truncate">
                            <div className="font-bold text-[11px] truncate">{nt.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: MUSHAF PAPER & TEXT COLOR                             */}
          {/* ============================================================ */}
          {activeTab === 'mushaf' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Paper Background Themes */}
              {onSetPaperTheme && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>خلفية ولون ورق المصحف الشريف:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PAPER_THEME_OPTIONS.map((pt) => {
                      const isSelected = paperTheme === pt.id;
                      return (
                        <button
                          key={pt.id}
                          onClick={() => onSetPaperTheme(pt.id)}
                          className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-stone-900 border-amber-400 ring-2 ring-amber-500/30 text-amber-100 shadow-md'
                              : 'bg-stone-900/40 border-stone-800 hover:bg-stone-850 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div 
                              className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 shadow-inner"
                              style={{ 
                                backgroundColor: pt.previewBg,
                                borderColor: pt.previewBorder 
                              }}
                            >
                              <span className="text-[9px] font-quran font-bold opacity-80">ق</span>
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs truncate">{pt.name}</div>
                              <div className="text-[9px] text-stone-400 truncate">{pt.subtext}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quran Text Color Options */}
              {onSetQuranTextColor && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <span>لون خط النص والرسم العثماني:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {QURAN_TEXT_COLOR_OPTIONS.map((tc) => {
                      const isSelected = quranTextColor === tc.id;
                      return (
                        <button
                          key={tc.id}
                          onClick={() => onSetQuranTextColor(tc.id)}
                          className={`p-2.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-stone-900 border-amber-400 ring-2 ring-amber-500/30 text-amber-200'
                              : 'bg-stone-900/40 border-stone-800 text-stone-300 hover:bg-stone-850'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: tc.previewHex }}
                            />
                            <span className="text-xs font-bold font-quran">{tc.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Font Size & Preview */}
              {onSetFontSize && (
                <div className="space-y-3 p-4 rounded-2xl bg-stone-900/50 border border-stone-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-300">حجم خط المصحف:</span>
                    <span className="font-mono text-amber-400 font-bold">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="46"
                    step="1"
                    value={fontSize}
                    onChange={(e) => onSetFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-stone-800 accent-amber-400 rounded-lg cursor-pointer"
                  />
                  {/* Live Quranic Verse Preview Box */}
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-center font-quran text-amber-200 leading-loose" style={{ fontSize: `${fontSize}px` }}>
                    بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: VERSE HIGHLIGHTING & TRACKING COLORS                  */}
          {/* ============================================================ */}
          {activeTab === 'highlight' && onSetTrackingColor && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>لون تظليل الآية المقروءة وتتبع الصوت المباشر:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TRACKING_COLORS.map((tc) => {
                  const isSelected = trackingColor === tc.id;
                  return (
                    <button
                      key={tc.id}
                      onClick={() => onSetTrackingColor(tc.id as TrackingHighlightColor)}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-stone-900 border-amber-400 ring-2 ring-amber-500/30 text-amber-200 shadow-md'
                          : 'bg-stone-900/40 border-stone-800 text-stone-300 hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: tc.hex }}
                        />
                        <div>
                          <div className="text-xs font-bold">{tc.name}</div>
                          <div className="text-[10px] text-stone-400">{tc.subtext}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Sample Highlighting Preview Box */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <div className="text-[11px] text-stone-400 font-bold">معاينة حية لتظليل الآية أثناء التلاوة:</div>
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-100 font-quran text-center text-lg leading-loose shadow-inner">
                  ﴿ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴾
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-850 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <span>يتم حفظ تفضيلات الألوان تلقائياً في جهازك</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all active:scale-95 shadow-md"
          >
            تطبيق وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
