import React from 'react';
import { Bell, BookOpen, X, Clock, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';

interface InAppNotificationToastProps {
  title: string;
  body: string;
  onOpenQuran: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  title,
  body,
  onOpenQuran,
  onSnooze,
  onDismiss
}) => {
  return (
    <div 
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-bounce-short font-cairo shadow-2xl"
      dir="rtl"
    >
      <div className="bg-stone-950/95 border-2 border-amber-400/80 rounded-2xl p-4 text-stone-100 shadow-2xl backdrop-blur-2xl ring-1 ring-amber-500/30">
        
        {/* Top bar with Icon and Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                منبّه الورد القرآني
              </span>
              <h4 className="text-sm font-bold text-amber-200 line-clamp-1">
                {title}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <p className="text-xs text-stone-300 mt-2.5 leading-relaxed bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80">
          {body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-800/80">
          <button
            onClick={onOpenQuran}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قراءة الورد الآن</span>
          </button>

          <button
            onClick={onSnooze}
            className="inline-flex items-center gap-1 py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 text-xs font-semibold transition-colors"
            title="تذكيري بعد 15 دقيقة"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>تأجيل ١٥ د</span>
          </button>
        </div>

      </div>
    </div>
  );
};
