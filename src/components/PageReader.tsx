import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Play, Bookmark, BookOpen, Volume2 } from 'lucide-react';
import { fetchPageAyahs, toArabicNumeral } from '../services/quranApi';
import { PaperTheme, FontStyle, Reciter } from '../types';

interface PageReaderProps {
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onSelectSurah: (surahId: number) => void;
  paperTheme: PaperTheme;
  fontSize: number;
  fontStyle: FontStyle;
  onPlayAyah: (surahId: number, ayahNum: number) => void;
  currentPlayingAyah: { surahId: number; ayahNum: number } | null;
}

export const PageReader: React.FC<PageReaderProps> = ({
  initialPage = 1,
  onPageChange,
  onSelectSurah,
  paperTheme,
  fontSize,
  fontStyle,
  onPlayAyah,
  currentPlayingAyah
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

  const activeAyahRef = React.useRef<HTMLSpanElement | null>(null);

  // Auto-scroll active playing verse on page view
  useEffect(() => {
    if (currentPlayingAyah && activeAyahRef.current) {
      activeAyahRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [currentPlayingAyah?.surahId, currentPlayingAyah?.ayahNum]);

  // Extract Surah names present on this page
  const pageSurahs = Array.from(new Set(pageAyahs.map(a => a.surah.name)));
  const pageJuz = pageAyahs.length > 0 ? pageAyahs[0].juz : 1;

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Page Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-stone-900/80 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm backdrop-blur-md">
        
        {/* Prev Page Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الصفحة السابقة</span>
        </button>

        {/* Jump To Page Input */}
        <form onSubmit={handleJumpPage} className="flex items-center gap-2">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
            صفحة {toArabicNumeral(currentPage)} من ٦٠٤
          </span>
          <input
            type="number"
            min="1"
            max="604"
            placeholder="انتقل لصفحة..."
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            className="w-24 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500 text-center font-bold"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-stone-800 text-amber-300 text-xs font-bold hover:bg-stone-700"
          >
            ذهاب
          </button>
        </form>

        {/* Next Page Button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage >= 604}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
        >
          <span>الصفحة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>

      </div>

      {/* Mushaf Page View Box */}
      <div className={`rounded-3xl p-6 sm:p-10 shadow-xl border ${themeClasses} min-h-[600px] flex flex-col justify-between space-y-6 transition-all duration-300 quran-frame`}>
        
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
                    className={`cursor-pointer transition-all px-1.5 py-0.5 rounded ${
                      isPlaying
                        ? 'bg-amber-500/35 text-amber-950 dark:text-amber-100 font-bold border-b-4 border-amber-500 shadow-md ring-2 ring-amber-500/40 inline-block'
                        : 'hover:bg-amber-500/20'
                    }`}
                    title={`سورة ${ayah.surah.name} - الآية ${ayah.numberInSurah} (انقر للاستماع)`}
                  >
                    {ayah.text}
                  </span>

                  {/* Verse End Marker */}
                  <span className="ayah-end-symbol text-amber-600 dark:text-amber-400 font-quran text-2xl font-bold select-none">
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
