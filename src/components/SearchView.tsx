import React, { useState } from 'react';
import { Search, X, BookOpen, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { searchQuran, toArabicNumeral } from '../services/quranApi';

interface SearchViewProps {
  onClose: () => void;
  onSelectVerse: (surahId: number, ayahNum: number) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onClose, onSelectVerse }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);
    const res = await searchQuran(query);
    setResults(res);
    setSearching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Search Input Top Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-amber-500/10">
          <form onSubmit={handleSearch} className="relative flex items-center gap-2">
            <Search className="absolute right-4 w-5 h-5 text-amber-500" />
            <input
              type="text"
              autoFocus
              placeholder="ابحث عن كلمة أو آية (مثلاً: {إن مع العسر يسرا} أو {الهدى}...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pr-12 pl-24 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-cairo text-sm focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute left-12 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'بحث'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="absolute left-2 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Results Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {searching && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-semibold">جاري البحث في كامل آيات المصحف الشريف...</p>
            </div>
          )}

          {!searching && searched && results.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
              <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">لم يتم العثور على نتائج</h4>
              <p className="text-xs text-stone-500">تأكد من كتابة الكلمة بشكل صحيح دون أخطاء إملائية.</p>
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                تم العثور على {toArabicNumeral(results.length)} نتيجة في آيات القرآن الكريم:
              </div>

              {results.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectVerse(r.surahId, r.ayahNumber);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-amber-500/10 border border-stone-200 dark:border-stone-700/60 hover:border-amber-500/50 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400">
                    <span className="text-amber-700 dark:text-amber-300 font-quran text-base">
                      سُورَةُ {r.surahName} (الآية {toArabicNumeral(r.ayahNumber)})
                    </span>
                    <span>صفحة {toArabicNumeral(r.page)}</span>
                  </div>

                  <p className="font-quran text-lg text-stone-900 dark:text-amber-100 leading-relaxed">
                    {r.text} <span className="text-amber-600">﴿{toArabicNumeral(r.ayahNumber)}﴾</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {!searched && !searching && (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Sparkles className="w-10 h-10 text-amber-500/40 mx-auto" />
              <p className="text-xs">اكتب أي كلمة أو جزء من آية للبحث السريع في المصحف كاملاً.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
