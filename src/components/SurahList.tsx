import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, Layers, Star, PlayCircle, Sparkles, Compass } from 'lucide-react';
import { SurahMeta } from '../types';
import { ALL_SURAHS, JUZ_LIST } from '../data/surahs';
import { toArabicNumeral, removeTashkeel } from '../services/quranApi';
import heroBgImage from '../assets/images/quran_hero_bg_1786468421170.jpg';

interface SurahListProps {
  onSelectSurah: (surahId: number) => void;
  onSelectJuz?: (juzNumber: number) => void;
  onPlaySurah?: (surahId: number) => void;
  favorites: number[];
  onToggleFavorite: (surahId: number) => void;
  onOpenTadabburAI: () => void;
}

export const SurahList: React.FC<SurahListProps> = ({
  onSelectSurah,
  onSelectJuz,
  onPlaySurah,
  favorites,
  onToggleFavorite,
  onOpenTadabburAI
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'meccan' | 'medinan' | 'favorites'>('all');
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'index' | 'revelation' | 'verses'>('index');

  // Filtered and sorted Surah list
  const filteredSurahs = useMemo(() => {
    let result = ALL_SURAHS;

    // Filter by type
    if (filterType === 'meccan') {
      result = result.filter(s => s.revelationType === 'Meccan');
    } else if (filterType === 'medinan') {
      result = result.filter(s => s.revelationType === 'Medinan');
    } else if (filterType === 'favorites') {
      result = result.filter(s => favorites.includes(s.id));
    }

    // Filter by Juz
    if (selectedJuz !== null) {
      result = result.filter(s => s.juz === selectedJuz);
    }

    // Search
    if (searchQuery.trim()) {
      const clean = removeTashkeel(searchQuery.trim().toLowerCase());
      result = result.filter(s => 
        removeTashkeel(s.name).includes(clean) ||
        s.englishName.toLowerCase().includes(clean) ||
        s.id.toString() === clean
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'revelation') return a.revelationOrder - b.revelationOrder;
      if (sortBy === 'verses') return b.versesCount - a.versesCount;
      return a.id - b.id;
    });
  }, [searchQuery, filterType, selectedJuz, sortBy, favorites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Hero Header Frame */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-12 text-stone-100 shadow-2xl gold-glow-border border border-amber-500/30">
        
        {/* Background Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImage}
            alt="المصحف الشريف"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/40 rtl:bg-gradient-to-l"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/30"></div>
        </div>

        {/* Decorative corner Islamic glow elements */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-stone-950/90 text-amber-300 text-xs sm:text-sm font-bold border border-amber-400/60 backdrop-blur-md shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="gold-text-gradient font-extrabold text-base">موقع التوبة</span>
            <span className="text-amber-400/60">•</span>
            <span className="text-stone-200">المصحف الشريف الإلكتروني والتلاوات الخاشعة</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-extrabold font-quran text-amber-100 leading-snug drop-shadow-2xl">
            ﴿إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ﴾
          </h2>
          
          <p className="text-stone-100 text-sm sm:text-base font-cairo font-medium leading-relaxed max-w-2xl drop-shadow-md">
            مرحباً بكم في <strong className="text-amber-300 font-bold">موقع التوبة</strong> — منصتكم القرآنية الشاملة لقراءة واستماع وتدبّر آيات كتاب الله العزيز بتلاوات مشاهير القراء، مع خيارات التفسير الميسر ومساعد التدبر الذكي.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onSelectSurah(1)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 font-extrabold hover:from-amber-300 hover:to-amber-500 transition-all shadow-xl shadow-amber-950/50 flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4" />
              ابدأ قراءة سورة الفاتحة
            </button>

            <button
              onClick={onOpenTadabburAI}
              className="px-6 py-3 rounded-2xl bg-stone-950/80 hover:bg-stone-900 text-amber-300 border border-amber-500/50 font-bold transition-all shadow-lg backdrop-blur-md flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              مساعد التدبر بالذكاء الاصطناعي
            </button>
          </div>
        </div>
      </div>

      {/* Quick Search & Filter Toolbar */}
      <div className="bg-white/90 dark:bg-stone-900/90 rounded-2xl p-4 sm:p-5 shadow-lg border border-stone-200 dark:border-stone-800 space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="ابحث باسم السورة (مثلاً: البقرة، الكهف، يس...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                مسح
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'جميع السور (114)' },
              { id: 'meccan', label: 'مكية' },
              { id: 'medinan', label: 'مدنية' },
              { id: 'favorites', label: `المفضلة (${favorites.length})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  filterType === f.id
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>

        {/* Juz Dropdown & Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-stone-500 dark:text-stone-400 font-medium">تصفية حسب الجزء:</span>
            <select
              value={selectedJuz ?? ''}
              onChange={(e) => setSelectedJuz(e.target.value ? Number(e.target.value) : null)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-1.5 px-3 text-stone-800 dark:text-stone-200 font-medium outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">جميع الأجزاء (30 جزءاً)</option>
              {JUZ_LIST.map((j) => (
                <option key={j.juzNumber} value={j.juzNumber}>
                  الجزء {toArabicNumeral(j.juzNumber)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 dark:text-stone-400 font-medium">الترتيب:</span>
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
              {[
                { id: 'index', label: 'المصحف' },
                { id: 'revelation', label: 'النزول' },
                { id: 'verses', label: 'عدد الآيات' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    sortBy === s.id
                      ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Grid of Surahs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSurahs.map((surah) => {
          const isFav = favorites.includes(surah.id);
          return (
            <div
              key={surah.id}
              onClick={() => onSelectSurah(surah.id)}
              className="group relative bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm hover:shadow-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              
              <div className="flex items-center justify-between">
                
                {/* Surah Number Frame */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center font-quran text-base border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform shrink-0">
                    {toArabicNumeral(surah.id)}
                  </div>
                  <div>
                    <h3 className="font-quran text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors tracking-wide drop-shadow-sm">
                      سُورَةُ {surah.name}
                    </h3>
                    <span className="text-xs text-stone-600 dark:text-stone-300 font-cairo font-semibold">
                      {surah.englishName}
                    </span>
                  </div>
                </div>

                {/* Favorite Star Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(surah.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isFav
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-stone-300 dark:text-stone-700 hover:text-amber-400'
                  }`}
                  title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                >
                  <Star className={`w-5 h-5 ${isFav ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {/* Badges & Meta Info */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                    surah.revelationType === 'Meccan'
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                  </span>
                  <span>{toArabicNumeral(surah.versesCount)} آية</span>
                </div>

                <div className="flex items-center gap-1 text-stone-400">
                  <span>صـ {toArabicNumeral(surah.startPage)}</span>
                  <span>•</span>
                  <span>جـ {toArabicNumeral(surah.juz)}</span>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">لم يتم العثور على سور مطابقة للبحث</h3>
          <p className="text-stone-500 text-sm">جرب البحث باسم سورة آخر أو إلغاء تصفية التصفية الحالية.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setSelectedJuz(null);
            }}
            className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      )}

    </div>
  );
};
