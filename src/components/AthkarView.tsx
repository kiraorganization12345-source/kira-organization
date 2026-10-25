import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  CheckCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Search, 
  Sparkles, 
  Moon, 
  Sun, 
  ShieldCheck, 
  BookOpen,
  ArrowRight,
  Flame,
  Volume2
} from 'lucide-react';
import { ATHKAR_DATA } from '../data/athkar';
import { AthkarItem } from '../types';
import { toArabicNumeral } from '../services/quranApi';
import { triggerHaptic } from '../services/deviceService';

interface AthkarViewProps {
  onBackToSurahs?: () => void;
}

export const AthkarView: React.FC<AthkarViewProps> = ({ onBackToSurahs }) => {
  const [activeCategory, setActiveCategory] = useState<AthkarItem['category']>('morning');
  const [athkarList, setAthkarList] = useState<AthkarItem[]>(ATHKAR_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const categories = [
    { id: 'morning', label: 'أذكار الصباح', icon: '☀️' },
    { id: 'evening', label: 'أذكار المساء', icon: '🌙' },
    { id: 'post_prayer', label: 'بعد الصلاة', icon: '🕌' },
    { id: 'sleep', label: 'أذكار النوم', icon: '🛏️' },
    { id: 'wake_up', label: 'الاستيقاظ', icon: '🌅' },
    { id: 'tasbeeh', label: 'تسابيح واستغفار', icon: '📿' },
    { id: 'quranic_duas', label: 'أدعية قرآنية', icon: '📖' },
    { id: 'prophetic_duas', label: 'أدعية نبوية', icon: '🤲' },
    { id: 'ruqyah', label: 'الرقية الشرعية', icon: '🛡️' },
    { id: 'mosque', label: 'أذكار المسجد', icon: '🕋' }
  ];

  const handleIncrement = (id: number) => {
    triggerHaptic('light');
    setAthkarList(prev => prev.map(item => {
      if (item.id === id) {
        const current = item.currentCount || 0;
        if (current < item.count) {
          if (current + 1 === item.count) {
            triggerHaptic('success');
          }
          return { ...item, currentCount: current + 1 };
        }
      }
      return item;
    }));
  };

  const handleResetItem = (id: number) => {
    triggerHaptic('light');
    setAthkarList(prev => prev.map(item => item.id === id ? { ...item, currentCount: 0 } : item));
  };

  const handleResetAllCategory = () => {
    triggerHaptic('medium');
    setAthkarList(prev => prev.map(item => {
      if (item.category === activeCategory) {
        return { ...item, currentCount: 0 };
      }
      return item;
    }));
  };

  const handleCopy = (item: AthkarItem) => {
    const textToCopy = `${item.title}\n\n${item.text}\n\n${item.reference ? `المصدر: ${item.reference}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAthkar = useMemo(() => {
    return athkarList.filter(a => {
      const matchesCategory = searchQuery.trim() ? true : a.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        a.title.includes(searchQuery) || 
        a.text.includes(searchQuery) ||
        (a.benefit && a.benefit.includes(searchQuery));
      return matchesCategory && matchesSearch;
    });
  }, [athkarList, activeCategory, searchQuery]);

  const categoryCompletedCount = useMemo(() => {
    const currentCategoryItems = athkarList.filter(a => a.category === activeCategory);
    return currentCategoryItems.filter(a => (a.currentCount || 0) >= a.count).length;
  }, [athkarList, activeCategory]);

  const totalCategoryItems = useMemo(() => {
    return athkarList.filter(a => a.category === activeCategory).length;
  }, [athkarList, activeCategory]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      
      {/* Immersive Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 p-5 sm:p-7 rounded-3xl text-stone-100 shadow-xl border border-emerald-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Heart className="w-4 h-4 text-emerald-400" />
              <span>مكتبة الأذكار والأدعية وحصن المسلم</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-emerald-100">
              الأذكار اليومية والأدعية الجامعة
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm font-cairo">
              أذكار الصباح والمساء والصلوات والنوم والرقى الشرعية مع عداد التكرار الذكي.
            </p>
          </div>

          {onBackToSurahs && (
            <button
              onClick={onBackToSurahs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900/80 hover:bg-emerald-600 text-stone-200 hover:text-white border border-emerald-500/30 text-xs sm:text-sm font-bold transition-all shadow-md"
            >
              <span>فهرس السور</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>

        {/* Category Completion Progress Bar */}
        {!searchQuery && totalCategoryItems > 0 && (
          <div className="mt-5 pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الإنجاز في هذا القسم: {toArabicNumeral(categoryCompletedCount)} من {toArabicNumeral(totalCategoryItems)} أذكار</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36 sm:w-48 h-2.5 bg-stone-800 rounded-full overflow-hidden border border-emerald-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${(categoryCompletedCount / totalCategoryItems) * 100}%` }}
                />
              </div>
              <button
                onClick={handleResetAllCategory}
                className="hover:text-amber-300 transition-colors underline decoration-dotted text-[11px]"
                title="إعادة تصفير عدادات هذا القسم"
              >
                إعادة تصفير القسم
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في نصوص الأذكار أو الأدعية أو الفضائل..."
          className="w-full pr-12 pl-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-200 px-2 py-1 bg-stone-800 rounded-lg"
          >
            مسح
          </button>
        )}
      </div>

      {/* Category Tabs Scrollable */}
      {!searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const count = athkarList.filter(a => a.category === cat.id).length;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat.id as any);
                }}
                className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-102'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-850'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}>
                  {toArabicNumeral(count)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Athkar Grid/Cards */}
      <div className="space-y-4">
        {filteredAthkar.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
            <Heart className="w-12 h-12 text-stone-400 mx-auto opacity-50" />
            <h3 className="font-bold text-lg text-stone-300 font-quran">لا توجد نتائج مطابقة لبحثك</h3>
            <p className="text-xs text-stone-400 font-cairo">جرب البحث بكلمات أخرى أو اختر تصنيفاً من القائمة أعلاه</p>
          </div>
        ) : (
          filteredAthkar.map((item) => {
            const current = item.currentCount || 0;
            const isDone = current >= item.count;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-7 rounded-3xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-sm'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-emerald-500/40'
                }`}
              >
                
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-sm sm:text-base text-emerald-700 dark:text-emerald-400 font-quran">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.reference && (
                      <span className="text-[11px] sm:text-xs text-stone-400 font-semibold bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                        {item.reference}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(item)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 transition-colors"
                      title="نسخ الذكر"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Text with high legibility */}
                <p className="py-4 font-quran text-xl sm:text-2xl text-stone-900 dark:text-emerald-50 leading-relaxed text-justify select-text">
                  {item.text}
                </p>

                {/* Benefit badge if exists */}
                {item.benefit && (
                  <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium mb-4 flex items-start gap-2">
                    <span className="shrink-0 text-sm">💡</span>
                    <span>{item.benefit}</span>
                  </div>
                )}

                {/* Counter Interactive Row */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => handleResetItem(item.id)}
                    className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-1 text-xs"
                    title="إعادة التكرار إلى الصفر"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تصفير</span>
                  </button>

                  <button
                    onClick={() => handleIncrement(item.id)}
                    disabled={isDone}
                    className={`px-5 sm:px-7 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-3 transition-all active:scale-95 shadow-md ${
                      isDone
                        ? 'bg-emerald-500 text-stone-950 font-extrabold cursor-default'
                        : 'bg-stone-900 dark:bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-stone-950" />
                        <span>تم بحمد الله ({toArabicNumeral(item.count)})</span>
                      </>
                    ) : (
                      <>
                        <span>التكرار ({toArabicNumeral(current)} / {toArabicNumeral(item.count)})</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
