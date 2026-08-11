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
  Type
} from 'lucide-react';
import { SurahDetail, Ayah, PaperTheme, FontStyle, Reciter } from '../types';
import { fetchSurahDetail, fetchSurahTafsir, fetchSurahTranslation, toArabicNumeral } from '../services/quranApi';
import { ALL_SURAHS } from '../data/surahs';

interface SurahReaderProps {
  surahId: number;
  onSelectSurah: (id: number) => void;
  selectedReciter: Reciter;
  currentPlayingAyah: { surahId: number; ayahNum: number; mode?: 'verse' | 'surah' } | null;
  onPlayAyah: (surahId: number, ayahNum: number, mode?: 'verse' | 'surah') => void;
  onOpenTafsirModal: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onOpenTadabburAI: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
  paperTheme: PaperTheme;
  fontSize: number;
  fontStyle: FontStyle;
  bookmarks: string[];
  onToggleBookmark: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
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
  fontSize,
  fontStyle,
  bookmarks,
  onToggleBookmark
}) => {
  const [surahData, setSurahData] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode: 'verse_by_verse' or 'mushaf_continuous'
  const [readerMode, setReaderMode] = useState<'verse' | 'mushaf'>('verse');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);

  const activeAyahRef = useRef<HTMLDivElement | null>(null);

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

  // Scroll active playing verse into view smoothly
  useEffect(() => {
    if (currentPlayingAyah && currentPlayingAyah.surahId === surahId && activeAyahRef.current) {
      activeAyahRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [currentPlayingAyah?.surahId, currentPlayingAyah?.ayahNum, surahId]);

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
    light: 'mushaf-paper-light border-stone-200',
    sepia: 'mushaf-paper-sepia border-amber-200',
    dark: 'mushaf-paper-dark border-stone-800',
    emerald: 'mushaf-paper-emerald border-emerald-800'
  }[paperTheme];

  const fontClass = {
    'Amiri Quran': 'font-quran',
    'Scheherazade New': 'font-scheherazade',
    'Amiri': 'font-amiri',
    'Cairo': 'font-cairo'
  }[fontStyle];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Bar Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-stone-900/80 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm backdrop-blur-md">
        
        {/* Navigation back and Surah Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectSurah(1)}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold"
            title="فهرس السور"
          >
            ← الفهرس
          </button>

          <select
            value={surahId}
            onChange={(e) => onSelectSurah(Number(e.target.value))}
            className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-stone-900 dark:text-stone-100 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
          >
            {ALL_SURAHS.map((s) => (
              <option key={s.id} value={s.id}>
                {toArabicNumeral(s.id)}. سورة {s.name} ({s.versesCount} آية)
              </option>
            ))}
          </select>
        </div>

        {/* View mode switcher (Verse View vs Mushaf Continuous) */}
        <div className="flex items-center gap-2">
          
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setReaderMode('verse')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readerMode === 'verse'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
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
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>نص المصحف المتصل</span>
            </button>
          </div>

          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              showTranslation
                ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            English
          </button>

        </div>

      </div>

      {/* Main Surah Content Frame */}
      <div className={`rounded-3xl p-6 sm:p-10 shadow-xl border ${themeClasses} transition-colors duration-300 space-y-8`}>
        
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
              onClick={() => onPlayAyah(surahData.id, 1, 'surah')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-all hover:scale-105"
            >
              <Volume2 className="w-5 h-5" />
              <span>استماع للسورة كاملة متصلة بصوت {selectedReciter.name}</span>
            </button>

            <button
              onClick={() => onPlayAyah(surahData.id, 1, 'verse')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold text-sm transition-all"
            >
              <Play className="w-4 h-4" />
              <span>استماع آية بآية</span>
            </button>
          </div>

          {/* Bismillah Banner */}
          {surahData.bismillahPre && (
            <div className="pt-4 pb-2 font-quran text-2xl sm:text-4xl text-amber-900 dark:text-amber-100 select-none drop-shadow-sm">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}
        </div>

        {/* --- MODE 1: VERSE BY VERSE (التفاعلي) --- */}
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
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-400/10 to-transparent border-r-[8px] border-r-amber-500 border-amber-500/80 ring-2 ring-amber-500/70 shadow-2xl shadow-amber-500/20 scale-[1.01]'
                      : 'bg-black/5 dark:bg-white/5 border-stone-200/50 dark:border-stone-800/50 hover:border-amber-500/40'
                  }`}
                >
                  {/* Live Reciter Playing Line Banner Indicator */}
                  {isPlaying && (
                    <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 text-stone-950 font-bold text-xs shadow-lg animate-pulse">
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>يقرأ الآن الشيخ: {selectedReciter.name} ({selectedReciter.subtext})</span>
                    </div>
                  )}
                  
                  {/* Verse Text Display with Golden Highlight Line */}
                  <div className="text-right leading-[2.4] select-text pb-4" style={{ fontSize: `${fontSize}px` }}>
                    <span className={`${fontClass} font-normal tracking-wide ${
                      isPlaying ? 'text-amber-950 dark:text-amber-100 font-medium border-b-2 border-amber-400 pb-1.5' : ''
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

                  {/* Verse Controls Bar (Mobile touch optimized) */}
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

        {/* --- MODE 2: MUSHAF CONTINUOUS PARAGRAPH (النص المتصل) --- */}
        {readerMode === 'mushaf' && (
          <div className="text-justify leading-[2.6] font-quran select-text p-4 sm:p-8 rounded-2xl bg-black/5 dark:bg-white/5" style={{ fontSize: `${fontSize + 2}px` }}>
            {surahData.ayahs.map((ayah) => {
              const isPlaying = currentPlayingAyah?.surahId === surahId && currentPlayingAyah?.ayahNum === ayah.numberInSurah;
              return (
                <React.Fragment key={ayah.numberInSurah}>
                  <span
                    ref={isPlaying ? activeAyahRef : null}
                    onClick={() => onPlayAyah(surahId, ayah.numberInSurah)}
                    className={`cursor-pointer transition-all px-1.5 py-0.5 rounded ${
                      isPlaying
                        ? 'bg-amber-500/35 text-amber-950 dark:text-amber-100 font-bold border-b-4 border-amber-500 shadow-md ring-2 ring-amber-500/40 inline-block'
                        : 'hover:bg-amber-500/20'
                    }`}
                    title={`انقر للاستماع للآية ${ayah.numberInSurah}`}
                  >
                    {ayah.text}
                  </span>
                  <span className="ayah-end-symbol text-amber-600 dark:text-amber-400 font-quran text-2xl font-bold select-none mx-1">
                    ۝{toArabicNumeral(ayah.numberInSurah)}
                  </span>
                </React.Fragment>
              );
            })}
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
