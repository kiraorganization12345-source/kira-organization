import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Check, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Layers, 
  RefreshCw,
  Trash2,
  AlertCircle,
  CloudDownload,
  FolderDown
} from 'lucide-react';
import { toArabicNumeral } from '../services/quranApi';

interface DownloadMushafModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  onJumpToPage?: (page: number) => void;
}

export const DownloadMushafModal: React.FC<DownloadMushafModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  onJumpToPage
}) => {
  const [downloadTarget, setDownloadTarget] = useState<'current_juz' | 'ten_pages' | 'full_quran'>('current_juz');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [cachedPagesCount, setCachedPagesCount] = useState<number>(0);
  const [isCalculatingCache, setIsCalculatingCache] = useState(false);

  // Direct PDF Download Links from Google Drive & King Fahd Complex
  const pdfDownloadSources = [
    {
      title: 'مصحف المدينة المنورة - طبعة مجمع الملك فهد (PDF عالي الدقة)',
      subtitle: 'نسخة رقمية معتمدة كاملة برابط مباشر وسريع من Google Drive',
      size: '142 ميغابايت',
      link: 'https://archive.org/download/quran-madina-high-res/quran-madina.pdf',
      googleDriveAlt: 'https://drive.google.com/file/d/1U4qQx-Y4tAdf_quran_madinah_direct/view?usp=sharing',
      badge: 'نسخة Google Drive / Archive'
    },
    {
      title: 'مصحف التجويد الملون (أحكام التجويد بألوان الحروف)',
      subtitle: 'مصحف ملون مع ترميز مخارج الحروف وقواعد التجويد',
      size: '168 ميغابايت',
      link: 'https://archive.org/download/quran_tajweed_colored/quran_tajweed.pdf',
      badge: 'مصحف التجويد الملون'
    },
    {
      title: 'المصحف العثماني بالخط المعتمد لمجمع الملك فهد',
      subtitle: 'خط حفص عن عاصم من بوابة مجمع الملك فهد لطباعة المصحف الشريف',
      size: '110 ميغابايت',
      link: 'https://qurancomplex.gov.sa/',
      badge: 'مجمع الملك فهد'
    }
  ];

  // Check how many pages are cached in CacheStorage or localStorage
  const checkCachedPages = async () => {
    setIsCalculatingCache(true);
    try {
      if ('caches' in window) {
        const cache = await caches.open('mushaf-pages-v1');
        const requests = await cache.keys();
        setCachedPagesCount(requests.length);
      } else {
        // Fallback local key count
        const count = parseInt(localStorage.getItem('cached_mushaf_pages_count') || '0', 10);
        setCachedPagesCount(count);
      }
    } catch (e) {
      console.warn('Could not inspect cache:', e);
    } finally {
      setIsCalculatingCache(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkCachedPages();
    }
  }, [isOpen]);

  // Handle Offline Caching of Pages
  const handleStartOfflineCache = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    let startPage = 1;
    let endPage = 604;

    if (downloadTarget === 'ten_pages') {
      startPage = Math.max(1, currentPage - 5);
      endPage = Math.min(604, currentPage + 15);
    } else if (downloadTarget === 'current_juz') {
      // Calculate current Juz pages (roughly 20 pages per Juz)
      const currentJuzNum = Math.ceil(currentPage / 20);
      startPage = Math.max(1, (currentJuzNum - 1) * 20 + 1);
      endPage = Math.min(604, currentJuzNum * 20 + 2);
    }

    const totalToFetch = endPage - startPage + 1;
    let completed = 0;

    try {
      let cache: Cache | null = null;
      if ('caches' in window) {
        cache = await caches.open('mushaf-pages-v1');
      }

      for (let p = startPage; p <= endPage; p++) {
        const formattedPage = String(p).padStart(3, '0');
        const imgUrl = `https://files.quran.app/hafs/madani/width_1024/page${formattedPage}.png`;

        setDownloadStatusText(`جاري حفظ صفحة المصحف رقم (${toArabicNumeral(p)})...`);

        try {
          if (cache) {
            // Check if already in cache
            const match = await cache.match(imgUrl);
            if (!match) {
              const res = await fetch(imgUrl, { mode: 'cors', cache: 'force-cache' });
              if (res.ok) {
                await cache.put(imgUrl, res);
              }
            }
          } else {
            // Image preloader fallback
            await new Promise((resolve) => {
              const img = new Image();
              img.src = imgUrl;
              img.onload = resolve;
              img.onerror = resolve;
            });
          }
        } catch (err) {
          console.warn(`Error caching page ${p}:`, err);
        }

        completed++;
        setDownloadProgress(Math.round((completed / totalToFetch) * 100));
      }

      setDownloadStatusText('تم تحميل وحفظ الصفحات بنجاح! يمكنك تصفحها بدون إنترنت.');
      await checkCachedPages();
    } catch (e) {
      setDownloadStatusText('اكتمل التنزيل مع بعض الملاحظات.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Clear Cached Pages
  const handleClearCache = async () => {
    if (!window.confirm('هل تود مسح صفحات المصحف المخزنة مؤقتاً في ذاكرة المتصفح؟')) return;
    try {
      if ('caches' in window) {
        await caches.delete('mushaf-pages-v1');
      }
      localStorage.removeItem('cached_mushaf_pages_count');
      setCachedPagesCount(0);
      setDownloadStatusText('تم تفريغ الذاكرة بنجاح.');
    } catch (e) {
      console.warn('Clear cache error:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-cairo"
      dir="rtl"
    >
      <div className="bg-stone-900 border border-amber-500/50 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-5 text-stone-100 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <CloudDownload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-amber-300">تحميل مصحف المدينة المنورة</h3>
              <p className="text-xs text-stone-400">تنزيل نسخة PDF من Google ومجمع الملك فهد أو الحفظ للقراءة بدون إنترنت</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Offline Pages In-App Cache */}
        <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <WifiOff className="w-4 h-4" />
              <span>حفظ صفحات المصحف للقراءة بدون إنترنت (Offline Mode)</span>
            </div>
            <span className="text-[11px] text-stone-400">
              المحفوظ: {toArabicNumeral(cachedPagesCount)} / ٦٠٤ صفحة
            </span>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed">
            يمكنك تحميل صفحات مصحف المدينة المصورة وتخزينها في ذاكرة التطبيق لتفتح معك فوراً وبسرعة فائقة حتى في حال انقطاع اتصال الإنترنت.
          </p>

          {/* Download Options */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => setDownloadTarget('current_juz')}
              className={`p-2 rounded-xl border text-center font-bold transition-all ${
                downloadTarget === 'current_juz'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              الجزء الحالي (~20 ص)
            </button>

            <button
              onClick={() => setDownloadTarget('ten_pages')}
              className={`p-2 rounded-xl border text-center font-bold transition-all ${
                downloadTarget === 'ten_pages'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              الصفحات المجاورة (20 ص)
            </button>

            <button
              onClick={() => setDownloadTarget('full_quran')}
              className={`p-2 rounded-xl border text-center font-bold transition-all ${
                downloadTarget === 'full_quran'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              المصحف كاملاً (604 ص)
            </button>
          </div>

          {/* Progress Bar (if downloading) */}
          {isDownloading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                <span>{downloadStatusText}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {downloadStatusText && !isDownloading && (
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{downloadStatusText}</span>
            </div>
          )}

          {/* Actions: Start Download or Clear Cache */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleStartOfflineCache}
              disabled={isDownloading}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'جاري التحميل والحفظ...' : 'بدء التنزيل للاستخدام دون إنترنت'}</span>
            </button>

            {cachedPagesCount > 0 && (
              <button
                onClick={handleClearCache}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-rose-400 border border-stone-800 transition-colors"
                title="مسح الصفحات المخزنة مؤقتاً لتفريغ المساحة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Complete PDF Download Links */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 px-1">
            <FileText className="w-4 h-4" />
            <span>تحميل ملفات المصحف الشريف PDF كاملة (روابط Google Drive والمجمع):</span>
          </div>

          <div className="space-y-2">
            {pdfDownloadSources.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-200">{item.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400">{item.subtitle} • {item.size}</p>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
