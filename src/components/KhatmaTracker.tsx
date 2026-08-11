import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Trophy, RefreshCw, BookOpen, Flame } from 'lucide-react';
import { toArabicNumeral } from '../services/quranApi';

interface KhatmaTrackerProps {
  onGoToPage: (page: number) => void;
}

const STORAGE_KEY = 'quran_khatma_plan_v1';

export const KhatmaTracker: React.FC<KhatmaTrackerProps> = ({ onGoToPage }) => {
  const [targetDays, setTargetDays] = useState<number>(30);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [streakDays, setStreakDays] = useState<number>(1);

  // Load saved plan
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.targetDays) setTargetDays(data.targetDays);
        if (Array.isArray(data.completedPages)) setCompletedPages(data.completedPages);
        if (data.streakDays) setStreakDays(data.streakDays);
      }
    } catch (e) {
      console.warn('Failed to load khatma plan', e);
    }
  }, []);

  // Save plan changes
  const savePlan = (pages: number[], days: number) => {
    setCompletedPages(pages);
    setTargetDays(days);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        targetDays: days,
        completedPages: pages,
        streakDays
      }));
    } catch (e) {
      console.warn('Failed to save khatma plan', e);
    }
  };

  const togglePage = (p: number) => {
    let updated: number[];
    if (completedPages.includes(p)) {
      updated = completedPages.filter(x => x !== p);
    } else {
      updated = [...completedPages, p];
    }
    savePlan(updated, targetDays);
  };

  const markNextJuz = (juzNumber: number) => {
    // 1 Juz is approximately 20 pages (e.g. Juz 1 = pages 1-20)
    const startP = (juzNumber - 1) * 20 + 1;
    const endP = Math.min(604, juzNumber * 20);
    const juzPages = Array.from({ length: endP - startP + 1 }, (_, i) => startP + i);
    
    const newPages = Array.from(new Set([...completedPages, ...juzPages]));
    savePlan(newPages, targetDays);
  };

  const handleReset = () => {
    if (confirm('هل أنت تأكد من إعادة ضبط خطة الختمة؟')) {
      savePlan([], 30);
    }
  };

  const totalPages = 604;
  const progressPercent = Math.round((completedPages.length / totalPages) * 100);
  const dailyPagesGoal = Math.ceil(totalPages / targetDays);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl p-6 sm:p-10 text-stone-100 shadow-2xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="space-y-3 text-center md:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>خطة وتحدي ختم القرآن الكريم</span>
          </div>
          
          <h2 className="text-3xl font-extrabold font-quran text-amber-100">
            مُتابع الختمة والورْد اليومي
          </h2>
          
          <p className="text-stone-300 text-sm max-w-xl font-cairo leading-relaxed">
            حدد هدفك لختم القرآن الكريم وتتبع قراءتك صفحة بصفحة بسهولة للالتزام بالورْد اليومي المستمر.
          </p>
        </div>

        {/* Progress Ring Card */}
        <div className="bg-stone-850/80 p-6 rounded-2xl border border-amber-500/20 text-center space-y-2 min-w-[220px]">
          <div className="text-4xl font-extrabold text-amber-400 font-quran">
            %{toArabicNumeral(progressPercent)}
          </div>
          <div className="text-xs text-stone-300 font-semibold">
            تم إنجاز {toArabicNumeral(completedPages.length)} من {toArabicNumeral(totalPages)} صفحة
          </div>
          <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Plan Settings Row */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Days Goal Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">المدة المستهدفة للختمة:</label>
          <select
            value={targetDays}
            onChange={(e) => savePlan(completedPages, Number(e.target.value))}
            className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-sm font-bold text-amber-600 dark:text-amber-300 outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value={15}>ختمة في ١٥ يوم (٤٠ صفحة/يوم)</option>
            <option value={30}>ختمة في ٣٠ يوم (٢٠ صفحة/يوم - جزء يومياً)</option>
            <option value={60}>ختمة في ٦٠ يوم (١٠ صفحات/يوم)</option>
            <option value={90}>ختمة في ٩٠ يوم (٧ صفحات/يوم)</option>
          </select>
        </div>

        {/* Daily Goal Display */}
        <div className="space-y-1 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">المطلوب يومياً:</span>
          <div className="text-xl font-bold font-quran text-stone-900 dark:text-amber-100">
            {toArabicNumeral(dailyPagesGoal)} صفحة تقريباً ({toArabicNumeral(Math.ceil(dailyPagesGoal / 5))} صفحات بعد كل صلاة)
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة التعيين</span>
          </button>
        </div>

      </div>

      {/* Quick Juz Completion Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-quran text-stone-900 dark:text-amber-100">
          إنجاز الأجزاء السريع (٣٠ جزءاً)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 30 }, (_, i) => {
            const juzNum = i + 1;
            const startP = (juzNum - 1) * 20 + 1;
            const endP = Math.min(604, juzNum * 20);
            
            // Check how many pages in this juz are finished
            const countCompleted = completedPages.filter(p => p >= startP && p <= endP).length;
            const isFinished = countCompleted >= 20;

            return (
              <div
                key={juzNum}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isFinished
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="text-xs font-bold mb-1">الجزء {toArabicNumeral(juzNum)}</div>
                <div className="text-[10px] text-stone-400 mb-2">{countCompleted}/٢٠ صفحة</div>
                <button
                  onClick={() => markNextJuz(juzNum)}
                  className={`w-full py-1 rounded-lg text-xs font-bold transition-all ${
                    isFinished
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-amber-500 hover:text-stone-950'
                  }`}
                >
                  {isFinished ? 'مكتمل' : 'إنهاء الجزء'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pages Matrix (1 - 604) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-quran text-stone-900 dark:text-amber-100">
            جدول الصفحات التفصيلي (٦٠٤ صفحة)
          </h3>
          <span className="text-xs text-stone-500">انقر على الصفحات التي قرأتها لتعليمها بالصح</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1.5 max-h-[400px] overflow-y-auto p-2 border border-stone-100 dark:border-stone-800 rounded-2xl">
          {Array.from({ length: 604 }, (_, i) => {
            const pageNum = i + 1;
            const isDone = completedPages.includes(pageNum);

            return (
              <button
                key={pageNum}
                onClick={() => togglePage(pageNum)}
                onDoubleClick={() => onGoToPage(pageNum)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-amber-500 text-stone-950 scale-95 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 hover:bg-amber-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
                title={`صفحة ${pageNum} (نقرتين للانتقال للقراءة)`}
              >
                {toArabicNumeral(pageNum)}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
