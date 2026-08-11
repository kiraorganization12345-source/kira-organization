import React, { useState, useEffect } from 'react';
import { X, BookOpen, Copy, Check, Sparkles, Languages } from 'lucide-react';
import { TAFSIRS, TRANSLATIONS } from '../data/tafsirs';
import { fetchSurahTafsir, fetchSurahTranslation, toArabicNumeral } from '../services/quranApi';

interface TafsirModalProps {
  surahId: number;
  surahName: string;
  ayahNum: number;
  ayahText: string;
  onClose: () => void;
  onOpenTadabburAI: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
  surahId,
  surahName,
  ayahNum,
  ayahText,
  onClose,
  onOpenTadabburAI
}) => {
  const [selectedTafsirId, setSelectedTafsirId] = useState<string>('ar.muyassar');
  const [tafsirContent, setTafsirContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetchSurahTafsir(surahId, selectedTafsirId)
      .then((map) => {
        setTafsirContent(map[ayahNum] || 'تعذر تحميل التفسير لهذه الآية.');
        setLoading(false);
      })
      .catch((err) => {
        setTafsirContent('حدث خطأ أثناء تحميل التفسير.');
        setLoading(false);
      });
  }, [surahId, ayahNum, selectedTafsirId]);

  const handleCopy = () => {
    const currentTafsirMeta = TAFSIRS.find(t => t.id === selectedTafsirId);
    const textToCopy = `الآية: ${ayahText} ﴿${ayahNum}﴾\nسورة ${surahName}\n\nتفسير (${currentTafsirMeta?.name || ''}):\n${tafsirContent}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-quran text-amber-900 dark:text-amber-200">
                التفسير المعتمد - سورة {surahName} (الآية {toArabicNumeral(ayahNum)})
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">اختر التفسير المناسب للقراءة والتدبر</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ayah Card Preview */}
        <div className="p-5 bg-amber-50/50 dark:bg-stone-950/40 border-b border-stone-200 dark:border-stone-800 text-right">
          <p className="font-quran text-2xl text-stone-900 dark:text-amber-100 leading-relaxed font-normal">
            {ayahText} <span className="text-amber-600 font-bold">﴿{toArabicNumeral(ayahNum)}﴾</span>
          </p>
        </div>

        {/* Tafsir Book Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto bg-stone-100 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 scrollbar-none">
          {TAFSIRS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTafsirId(t.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedTafsirId === t.id
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Tafsir Text Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-stone-500 font-semibold">جاري تحميل الشرح والتفسير...</p>
            </div>
          ) : (
            <div className="text-stone-800 dark:text-stone-200 leading-relaxed text-base sm:text-lg font-cairo space-y-3">
              <p className="whitespace-pre-line">{tafsirContent}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900">
          
          <button
            onClick={() => {
              onClose();
              onOpenTadabburAI(surahName, surahId, ayahNum, ayahText);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs hover:opacity-90 flex items-center gap-2 shadow-md shadow-amber-900/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>تدبر أكثر بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ التفسير'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
