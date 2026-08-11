import React, { useState, useEffect } from 'react';
import { Sparkles, X, Send, BookOpen, Loader2, Copy, Check } from 'lucide-react';
import { toArabicNumeral } from '../services/quranApi';

interface TadabburAiModalProps {
  surahName?: string;
  surahNumber?: number;
  ayahNum?: number;
  ayahText?: string;
  onClose: () => void;
}

export const TadabburAiModal: React.FC<TadabburAiModalProps> = ({
  surahName,
  surahNumber,
  ayahNum,
  ayahText,
  onClose
}) => {
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Auto generate initial reflection for verse if provided
    if (ayahText) {
      fetchTadabbur();
    }
  }, [ayahText]);

  const fetchTadabbur = async (questionToAsk?: string) => {
    setLoading(true);
    setAnswer('');
    try {
      const response = await fetch('/api/tadabbur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahName,
          surahNumber,
          ayahNumber: ayahNum,
          ayahText,
          question: questionToAsk || customQuestion
        })
      });

      const data = await response.json();
      if (data.success) {
        setAnswer(data.answer);
      } else {
        setAnswer(data.error || 'حدث خطأ أثناء التواصل مع المعلم القرآني الذكي.');
      }
    } catch (e: any) {
      setAnswer('تعذر الحصول على إجابة. يرجى التحقق من مفتاح GEMINI_API_KEY أو الاتصال.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-quran text-amber-200">
                المعلم القرآني الذكي - التدبر والتأمل
              </h3>
              <p className="text-xs text-stone-300">استخراج اللطائف والفوائد الإيمانية واللغوية بأسلوب موثوق</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ayah Card Preview if available */}
        {ayahText && (
          <div className="p-4 bg-amber-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-right">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
              سُورَةُ {surahName} (الآية {toArabicNumeral(ayahNum || 1)})
            </span>
            <p className="font-quran text-xl text-stone-900 dark:text-amber-100 leading-relaxed">
              {ayahText} <span className="text-amber-600">﴿{toArabicNumeral(ayahNum || 1)}﴾</span>
            </p>
          </div>
        )}

        {/* Answer Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-bold">جاري توليد التدبر والفوائد الإيمانية والبيانية...</p>
            </div>
          ) : answer ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-sm leading-relaxed font-cairo whitespace-pre-line">
                {answer}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <BookOpen className="w-10 h-10 text-amber-500/40 mx-auto" />
              <p className="text-xs">اطرح أي سؤال حول التفسير أو أسباب النزول أو الإعجاز البياني لآيات القرآن.</p>
            </div>
          )}
        </div>

        {/* Input Question Bar */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-2">
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customQuestion.trim()) {
                fetchTadabbur(customQuestion);
              }
            }}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="اطرح سؤالاً عن هذه الآية أو موضع قرآني آخر..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="w-full pr-4 pl-24 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="absolute left-2 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال</span>
            </button>
          </form>

          {answer && (
            <div className="flex justify-end">
              <button
                onClick={handleCopy}
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-amber-500 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الإجابة'}</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
