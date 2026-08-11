import React, { useState } from 'react';
import { Heart, CheckCircle, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { ATHKAR_DATA } from '../data/athkar';
import { AthkarItem } from '../types';
import { toArabicNumeral } from '../services/quranApi';

export const AthkarView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'quranic_duas'>('morning');
  const [athkarList, setAthkarList] = useState<AthkarItem[]>(ATHKAR_DATA);

  const handleIncrement = (id: number) => {
    setAthkarList(prev => prev.map(item => {
      if (item.id === id) {
        const current = item.currentCount || 0;
        if (current < item.count) {
          return { ...item, currentCount: current + 1 };
        }
      }
      return item;
    }));
  };

  const handleResetItem = (id: number) => {
    setAthkarList(prev => prev.map(item => item.id === id ? { ...item, currentCount: 0 } : item));
  };

  const filteredAthkar = athkarList.filter(a => a.category === activeCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 p-6 sm:p-8 rounded-3xl text-stone-100 shadow-xl border border-emerald-500/30 flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span>حصن المسلم والأدعية القرآنية</span>
          </div>
          <h2 className="text-3xl font-extrabold font-quran text-emerald-100">
            الأذكار والأدعية القرآنية
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm font-cairo">
            أذكار الصباح والمساء والأدعية الجامعة من كتاب الله الكريم مع عداد التكرار التفاعلي.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {[
          { id: 'morning', label: 'أذكار الصباح' },
          { id: 'evening', label: 'أذكار المساء' },
          { id: 'quranic_duas', label: 'أدعية قرآنية' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Athkar Grid/Cards */}
      <div className="space-y-4">
        {filteredAthkar.map((item) => {
          const current = item.currentCount || 0;
          const isDone = current >= item.count;

          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all ${
                isDone
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 opacity-90'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm'
              }`}
            >
              
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-quran">
                  {item.title}
                </span>
                <span className="text-xs text-stone-400 font-semibold">{item.reference}</span>
              </div>

              {/* Text */}
              <p className="py-4 font-quran text-2xl text-stone-900 dark:text-emerald-50 leading-relaxed">
                {item.text}
              </p>

              {/* Benefit badge if exists */}
              {item.benefit && (
                <div className="p-3 bg-emerald-500/10 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium mb-4">
                  💡 {item.benefit}
                </div>
              )}

              {/* Counter Button */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => handleResetItem(item.id)}
                  className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  title="إعادة التكرار"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleIncrement(item.id)}
                  disabled={isDone}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-stone-950 shadow-md'
                      : 'bg-stone-900 dark:bg-emerald-600 text-white hover:scale-105 shadow-lg'
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
        })}
      </div>

    </div>
  );
};
