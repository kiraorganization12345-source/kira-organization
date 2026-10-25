import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Star, 
  PlayCircle, 
  Play,
  Sparkles, 
  Smartphone, 
  Headphones,
  ArrowLeft, 
  Bookmark, 
  Check, 
  Copy, 
  Volume2, 
  Shuffle, 
  Calendar, 
  Grid, 
  List, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight,
  Compass,
  Radio,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { SurahMeta, ViewMode } from '../types';
import { ALL_SURAHS, JUZ_LIST } from '../data/surahs';
import { toArabicNumeral, removeTashkeel } from '../services/quranApi';
import { getUnifiedMushafProgress, KhatmProgressData } from '../services/khatmProgressService';
import { triggerHaptic } from '../services/deviceService';
import heroBgImage from '../assets/images/quran_hero_bg_1786468421170.jpg';

interface SurahListProps {
  onSelectSurah: (surahId: number, autoPlay?: boolean) => void;
  onSelectJuz?: (juzNumber: number) => void;
  onPlaySurah?: (surahId: number) => void;
  favorites: number[];
  onToggleFavorite: (surahId: number) => void;
  onOpenTadabburAI: (surahName?: string, surahNumber?: number, ayahNum?: number, ayahText?: string) => void;
  onOpenQuranModeModal?: () => void;
  onGoToPage?: (page: number) => void;
  onGoTo3D?: (page: number) => void;
  onSelectView?: (view: ViewMode) => void;
  currentPlayingSurahId?: number | null;
  onPlayAyah?: (surahId: number, ayahNum: number) => void;
}

// 14 Suwar containing Tilawah Sujood
const SAJDAH_SURAHS = [7, 13, 16, 17, 19, 22, 25, 27, 32, 38, 41, 53, 84, 96];

// Popular quick search chips
const POPULAR_SURAHS = [
  { id: 18, name: 'الكهف' },
  { id: 36, name: 'يس' },
  { id: 67, name: 'الملك' },
  { id: 2, name: 'البقرة' },
  { id: 55, name: 'الرحمن' },
  { id: 56, name: 'الواقعة' },
  { id: 112, name: 'الإخلاص' }
];

// Daily Ayahs for inspiration and quick reflection
const DAILY_AYAHS = [
  {
    surahId: 13,
    surahName: 'الرعد',
    ayahNum: 28,
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    theme: 'طمأنينة وسكينة النفس',
    page: 253
  },
  {
    surahId: 2,
    surahName: 'البقرة',
    ayahNum: 186,
    text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    theme: 'قرب الله وإجابة الدعاء',
    page: 28
  },
  {
    surahId: 94,
    surahName: 'الشرح',
    ayahNum: 6,
    text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    theme: 'بشرى الفرج واليسر',
    page: 596
  },
  {
    surahId: 65,
    surahName: 'الطلاق',
    ayahNum: 3,
    text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
    theme: 'التوكل والاعتماد على الله',
    page: 558
  },
  {
    surahId: 7,
    surahName: 'الأعراف',
    ayahNum: 156,
    text: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ',
    theme: 'سعة رحمة الله تعالى',
    page: 170
  },
  {
    surahId: 20,
    surahName: 'طه',
    ayahNum: 114,
    text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    theme: 'طلب العلم والارتقاء',
    page: 320
  },
  {
    surahId: 39,
    surahName: 'الزمر',
    ayahNum: 53,
    text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    theme: 'الرجاء والمغفرة والتوبة',
    page: 464
  }
];

export const SurahList: React.FC<SurahListProps> = ({
  onSelectSurah,
  onSelectJuz,
  onPlaySurah,
  favorites,
  onToggleFavorite,
  onOpenTadabburAI,
  onOpenQuranModeModal,
  onGoToPage,
  onGoTo3D,
  onSelectView,
  currentPlayingSurahId,
  onPlayAyah
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'meccan' | 'medinan' | 'favorites' | 'sajdah'>('all');
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'index' | 'revelation' | 'verses' | 'page'>('index');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'compact'>('cards');
  
  // Daily Ayah Inspiration index
  const [dailyAyahIndex, setDailyAyahIndex] = useState(0);
  const [copiedAyah, setCopiedAyah] = useState(false);

  // Unified Khatm Progress
  const [khatmProgress, setKhatmProgress] = useState<KhatmProgressData>(() => getUnifiedMushafProgress());

  // Last read position from storage
  const [lastReadPage, setLastReadPage] = useState<number>(1);
  const [lastReadSurah, setLastReadSurah] = useState<SurahMeta>(ALL_SURAHS[0]);

  useEffect(() => {
    // Pick daily Ayah based on day of year for consistency, with manual shuffle capability
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyAyahIndex(dayOfYear % DAILY_AYAHS.length);

    // Update khatm progress
    setKhatmProgress(getUnifiedMushafProgress());

    // Retrieve last read page
    try {
      const savedPage = localStorage.getItem('quran_last_read_page_v1');
      if (savedPage) {
        const p = parseInt(savedPage, 10);
        if (!isNaN(p) && p >= 1 && p <= 604) {
          setLastReadPage(p);
          // Find corresponding surah
          const surahMatch = [...ALL_SURAHS].reverse().find(s => s.startPage <= p) || ALL_SURAHS[0];
          setLastReadSurah(surahMatch);
        }
      }
    } catch (e) {}
  }, []);

  // Format Islamic Date and Greeting
  const dateInfo = useMemo(() => {
    const now = new Date();
    let hijriStr = '';
    try {
      const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      hijriStr = hijriFormatter.format(now);
    } catch (e) {
      hijriStr = '١٤٤٨ هـ';
    }

    const gregorianFormatter = new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const hour = now.getHours();
    let greeting = 'أهلاً بكم في رحاب القرآن الكريم';
    if (hour >= 4 && hour < 12) {
      greeting = 'صباح مبارك بنور القرآن والذكر الحكيم';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'مساء الخير والبركة في رحاب كتاب الله';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'مساء عامر بذكر الله وتلاوة آياته';
    } else {
      greeting = 'طاب ليلكم بآيات الذكر الحكيم وتدبرها';
    }

    return {
      hijri: hijriStr,
      gregorian: gregorianFormatter.format(now),
      greeting
    };
  }, []);

  const currentDailyAyah = DAILY_AYAHS[dailyAyahIndex];

  // Shuffle Ayah of the day
  const handleShuffleDailyAyah = () => {
    setDailyAyahIndex(prev => (prev + 1) % DAILY_AYAHS.length);
  };

  // Copy Ayah to clipboard
  const handleCopyAyah = () => {
    if (!currentDailyAyah) return;
    const textToCopy = `﴿${currentDailyAyah.text}﴾ [سورة ${currentDailyAyah.surahName}: ${toArabicNumeral(currentDailyAyah.ayahNum)}] — موقع التوبة`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedAyah(true);
      setTimeout(() => setCopiedAyah(false), 2500);
    }).catch(() => {});
  };

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
    } else if (filterType === 'sajdah') {
      result = result.filter(s => SAJDAH_SURAHS.includes(s.id));
    }

    // Filter by Juz
    if (selectedJuz !== null) {
      result = result.filter(s => s.juz === selectedJuz);
    }

    // Search query
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
      if (sortBy === 'page') return a.startPage - b.startPage;
      return a.id - b.id;
    });
  }, [searchQuery, filterType, selectedJuz, sortBy, favorites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      
      {/* Dynamic Hijri & Islamic Time Atmosphere Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-stone-900/60 dark:bg-stone-900/60 backdrop-blur-md border border-amber-500/20 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-bold text-amber-300 font-quran text-base">{dateInfo.greeting}</span>
        </div>
        <div className="flex items-center gap-3 text-stone-400">
          <div className="flex items-center gap-1.5 text-amber-200/90 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{dateInfo.hijri}</span>
          </div>
          <span className="text-stone-600 hidden sm:inline">•</span>
          <span className="text-stone-400 hidden sm:inline">{dateInfo.gregorian}</span>
        </div>
      </div>

      {/* Hero Header Frame with Radiant Islamic Depth */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-12 text-stone-100 shadow-2xl gold-glow-border border border-amber-500/30 radiant-hero-glow">
        
        {/* Background Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImage}
            alt="المصحف الشريف"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/85 to-stone-950/50 rtl:bg-gradient-to-l"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40"></div>
        </div>

        {/* Decorative corner Islamic glow elements */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-stone-950/85 text-amber-300 text-xs sm:text-sm font-bold border border-amber-400/50 backdrop-blur-md shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="gold-text-gradient font-extrabold text-base">موقع التوبة الإلكتروني</span>
            <span className="text-amber-400/60">•</span>
            <span className="text-stone-300 font-normal">منصة القرآن الكريم والتلاوات الخاشعة والتدبر</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-quran text-amber-100 leading-snug drop-shadow-2xl">
              ﴿إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ﴾
            </h1>
            <p className="text-stone-200 text-sm sm:text-base font-cairo font-medium leading-relaxed max-w-2xl drop-shadow-md">
              اقرأ واستمع وتدبّر آيات الذكر الحكيم في تجربة بصرية فائقة النقاء، مع صفحات مصحف المدينة عالي الدقة، وتلاوات مشاهير القراء، والتدبر الذكي المدعوم بالذكاء الاصطناعي.
            </p>
          </div>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onSelectView && (
              <button
                onClick={() => onSelectView('realistic_book')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-extrabold hover:from-amber-400 hover:to-amber-500 transition-all shadow-xl shadow-amber-950/60 flex items-center gap-2.5 text-sm transform hover:-translate-y-0.5 border border-amber-300"
              >
                <BookOpen className="w-5 h-5 text-stone-950" />
                <span>المصحف ثلاثي الأبعاد 3D (تصفح واقعي)</span>
              </button>
            )}

            {onOpenQuranModeModal && (
              <button
                onClick={onOpenQuranModeModal}
                className="px-5 py-3.5 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-500/40 font-bold transition-all shadow-lg backdrop-blur-md flex items-center gap-2.5 text-sm transform hover:-translate-y-0.5"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>مشغل وضع القرآن (الاستماع)</span>
              </button>
            )}

            {onGoToPage && (
              <button
                onClick={() => onGoToPage(lastReadPage)}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold transition-all shadow-xl shadow-emerald-950/50 flex items-center gap-2.5 text-sm transform hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4 text-emerald-200" />
                <span>تصفح المصحف (صـ {toArabicNumeral(lastReadPage)})</span>
              </button>
            )}

            <button
              onClick={() => onOpenTadabburAI()}
              className="px-5 py-3.5 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-500/40 font-bold transition-all shadow-lg backdrop-blur-md flex items-center gap-2.5 text-sm transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>مساعد التدبر الذكي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Ayah Inspiration & Daily Reflection Card */}
      {currentDailyAyah && (
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 glass-panel border border-amber-500/30 shadow-xl bg-gradient-to-br from-amber-950/30 via-stone-900/70 to-stone-950/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">آية اليوم وإلهام التدبر</span>
                <span className="text-sm font-semibold text-stone-200">سورة {currentDailyAyah.surahName} • آية {toArabicNumeral(currentDailyAyah.ayahNum)} ({currentDailyAyah.theme})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleShuffleDailyAyah}
                className="px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-xs font-medium border border-stone-700/80 transition-all flex items-center gap-1.5"
                title="تغيير الآية"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>آية أخرى</span>
              </button>

              <button
                onClick={handleCopyAyah}
                className="px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-xs font-medium border border-stone-700/80 transition-all flex items-center gap-1.5"
                title="نسخ الآية"
              >
                {copiedAyah ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>

              {onPlayAyah && (
                <button
                  onClick={() => onPlayAyah(currentDailyAyah.surahId, currentDailyAyah.ayahNum)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/40 transition-all flex items-center gap-1.5"
                  title="استماع للآية"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>استماع</span>
                </button>
              )}

              <button
                onClick={() => onOpenTadabburAI(currentDailyAyah.surahName, currentDailyAyah.surahId, currentDailyAyah.ayahNum, currentDailyAyah.text)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-extrabold hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-1.5 shadow-md shadow-amber-950/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تدبّر</span>
              </button>
            </div>
          </div>

          <div className="pt-5 text-center sm:text-right">
            <p className="font-quran text-2xl sm:text-3xl lg:text-4xl text-amber-100 font-extrabold leading-loose select-text drop-shadow-sm">
              ﴿ {currentDailyAyah.text} ﴾
            </p>
          </div>
        </div>
      )}

      {/* Featured Listening Mode Banner (المصحف المرتل الشيخ محمود علي البنا بدون انترنت) */}
      <div 
        onClick={() => {
          if (onSelectView) onSelectView('listening');
          else if (onOpenQuranModeModal) onOpenQuranModeModal();
        }}
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#07474d] via-[#0b646c] to-[#0e7c86] text-white border-2 border-teal-400/50 hover:border-teal-300 shadow-2xl cursor-pointer transition-all hover:scale-[1.005] active:scale-[0.995]"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-teal-200 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <Headphones className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black">
                  واجهة وضع الاستماع الجديدة ✦
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-900/60 text-teal-200 border border-teal-400/30">
                  تطبيق المصحف الخاشع
                </span>
              </div>
              <h3 className="font-quran text-xl sm:text-2xl font-bold text-white drop-shadow">
                القرآن الكريم بصوت الشيخ محمود علي البنا بدون انترنت
              </h3>
              <p className="text-xs sm:text-sm text-teal-100/90 font-cairo">
                مشغل خاشع كامل • السور كاملة • مؤقت النوم • جودة عالية • عرض الآيات أثناء الاستماع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-black shadow-lg transition-transform group-hover:scale-105 flex items-center gap-2">
              <Play className="w-4 h-4 fill-stone-950" />
              <span>دخول وضع الاستماع الآن</span>
            </button>
          </div>
        </div>
      </div>

      {/* Smart Bento Quick Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        
        {/* Card 0: Realistic Open Book Mushaf (المصحف الواقعي المفتوح) */}
        {onSelectView && (
          <div 
            onClick={() => onSelectView('realistic_book')}
            className="group p-5 rounded-2xl glass-panel border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer modern-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-stone-900 to-amber-900/20 shadow-lg shadow-amber-950/20"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                تقليب واقعي 3D
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-400 font-medium">مجسم 3D على حامل خشبي مع التدوير</span>
              <h4 className="font-quran text-xl font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                المصحف ثلاثي الأبعاد 3D
              </h4>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-amber-400 font-bold">
              <span>دخول المصحف ثلاثي الأبعاد</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        )}
        
        {/* Card 1: Resume Reading */}
        <div 
          onClick={() => {
            if (onGoToPage) onGoToPage(lastReadPage);
            else onSelectSurah(lastReadSurah.id);
          }}
          className="group p-5 rounded-2xl glass-panel border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer modern-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
              <Bookmark className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              موضعك الأخير
            </span>
          </div>
          <div>
            <span className="text-xs text-stone-400 font-medium">متابعة القراءة من حيث توقفت</span>
            <h4 className="font-quran text-xl font-bold text-amber-200 group-hover:text-amber-400 transition-colors">
              سورة {lastReadSurah.name} • صـ {toArabicNumeral(lastReadPage)}
            </h4>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-amber-400 font-bold">
            <span>استئناف التلاوة الآن</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Khatm Progress Tracker */}
        <div 
          onClick={() => onSelectView && onSelectView('khatma')}
          className="group p-5 rounded-2xl glass-panel border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer modern-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              %{toArabicNumeral(khatmProgress.percentageFormatted)} منجز
            </span>
          </div>
          <div>
            <span className="text-xs text-stone-400 font-medium">خطة ختمة القرآن الموحدة</span>
            <h4 className="font-quran text-xl font-bold text-emerald-200 group-hover:text-emerald-400 transition-colors">
              {toArabicNumeral(khatmProgress.completedPagesCount)} من ٦٠٤ صفحة
            </h4>
            <div className="w-full bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(3, khatmProgress.percentage))}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-emerald-400 font-bold">
            <span>تفاصيل جدول الختمة</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Dedicated Mobile Quran Mode */}
        {(onOpenQuranModeModal || onSelectView) && (
          <div 
            onClick={() => {
              if (onSelectView) onSelectView('listening');
              else if (onOpenQuranModeModal) onOpenQuranModeModal();
            }}
            className="group p-5 rounded-2xl glass-panel border border-teal-500/25 hover:border-teal-500/60 transition-all cursor-pointer modern-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden bg-gradient-to-br from-teal-950/20 to-stone-900/40"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/30 group-hover:scale-110 transition-transform">
                <Headphones className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                وضع الاستماع الخاشع
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-400 font-medium">مشغل الاستماع الكامل</span>
              <h4 className="font-quran text-xl font-bold text-teal-200 group-hover:text-teal-300 transition-colors">
                القرآن الكريم بصوت القراء
              </h4>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-teal-400 font-bold">
              <span>دخول وضع الاستماع</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card 4: High-Def Mushaf / Digital Library */}
        <div 
          onClick={() => {
            if (onSelectView) onSelectView('mushaf_page');
            else if (onGoToPage) onGoToPage(1);
          }}
          className="group p-5 rounded-2xl glass-panel border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer modern-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              ٦٠٤ صفحة
            </span>
          </div>
          <div>
            <span className="text-xs text-stone-400 font-medium">مصحف المدينة عالي الدقة</span>
            <h4 className="font-quran text-xl font-bold text-amber-200 group-hover:text-amber-400 transition-colors">
              قراءة الصفحات المتصلة
            </h4>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-amber-400 font-bold">
            <span>فتح المصحف بالصفحات</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Modern Search & Comprehensive Filter Station */}
      <div className="bg-stone-900/80 dark:bg-stone-900/80 rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 space-y-4 backdrop-blur-md">
        
        {/* Search Bar + Quick Chips */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <input
                type="text"
                placeholder="ابحث باسم السورة (مثلاً: الكهف، البقرة، يس، الملك...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-10 py-3.5 rounded-2xl bg-stone-950/70 border border-stone-700/80 text-stone-100 placeholder-stone-400 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Layout Toggle (Cards vs Compact List) */}
            <div className="flex items-center justify-end gap-1 bg-stone-950/70 p-1.5 rounded-2xl border border-stone-800">
              <button
                onClick={() => setLayoutMode('cards')}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  layoutMode === 'cards'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="عرض البطاقات الإبداعية"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">بطاقات</span>
              </button>
              <button
                onClick={() => setLayoutMode('compact')}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  layoutMode === 'compact'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="عرض القائمة المدمجة"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">قائمة</span>
              </button>
            </div>
          </div>

          {/* Quick Popular Surah Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-stone-400 font-medium shrink-0">سور شائعة:</span>
            {POPULAR_SURAHS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSearchQuery(s.name)}
                className="px-3 py-1 rounded-xl bg-stone-800/80 hover:bg-amber-500/20 text-stone-300 hover:text-amber-300 border border-stone-700 hover:border-amber-500/40 whitespace-nowrap transition-all"
              >
                سورة {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Pills & Sorting Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800 text-xs">
          
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `جميع السور (${toArabicNumeral(114)})` },
              { id: 'meccan', label: `مكية (${toArabicNumeral(86)})` },
              { id: 'medinan', label: `مدنية (${toArabicNumeral(28)})` },
              { id: 'favorites', label: `المفضلة (${toArabicNumeral(favorites.length)})` },
              { id: 'sajdah', label: `سجدات تلاوة (${toArabicNumeral(14)})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl font-bold border transition-all ${
                  filterType === f.id
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-800/80 text-stone-300 border-stone-700/80 hover:bg-stone-700/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Juz and Sorting Row */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-medium">الجزء:</span>
              <select
                value={selectedJuz ?? ''}
                onChange={(e) => setSelectedJuz(e.target.value ? Number(e.target.value) : null)}
                className="bg-stone-950/80 border border-stone-700 rounded-xl py-1.5 px-3 text-stone-200 font-medium outline-none focus:border-amber-400 text-xs"
              >
                <option value="">كافة الأجزاء (٣٠ جزءاً)</option>
                {JUZ_LIST.map((j) => (
                  <option key={j.juzNumber} value={j.juzNumber}>
                    الجزء {toArabicNumeral(j.juzNumber)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-medium">الترتيب:</span>
              <div className="flex bg-stone-950/80 p-1 rounded-xl border border-stone-800">
                {[
                  { id: 'index', label: 'المصحف' },
                  { id: 'revelation', label: 'النزول' },
                  { id: 'verses', label: 'الآيات' },
                  { id: 'page', label: 'الصفحة' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      sortBy === s.id
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Surah List: Layout Mode Cards Grid */}
      {layoutMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSurahs.map((surah) => {
            const isFav = favorites.includes(surah.id);
            const isPlaying = currentPlayingSurahId === surah.id;
            const hasSajdah = SAJDAH_SURAHS.includes(surah.id);

            return (
              <div
                key={surah.id}
                onClick={() => onSelectSurah(surah.id)}
                className={`group relative rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 modern-card-hover border ${
                  isPlaying
                    ? 'bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border-amber-400 shadow-xl shadow-amber-950/40 ring-1 ring-amber-400'
                    : 'bg-stone-900/90 dark:bg-stone-900/90 border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 shadow-sm'
                }`}
              >
                
                {/* Header Row: Medallion + Surah Name + Actions */}
                <div className="flex items-center justify-between gap-2.5">
                  
                  {/* Surah Medallion & Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    
                    {/* Islamic Calligraphic Medallion */}
                    <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-quran text-xl sm:text-2xl font-black border-2 shrink-0 transition-transform group-hover:scale-105 shadow-md ${
                      isPlaying
                        ? 'bg-amber-400 text-stone-950 border-amber-300 ring-2 ring-amber-400/60 shadow-amber-500/30'
                        : 'bg-stone-850 text-amber-300 border-amber-400/50 group-hover:bg-amber-500 group-hover:text-stone-950 group-hover:border-amber-300 shadow-stone-950/60'
                    }`}>
                      {toArabicNumeral(surah.id)}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-quran text-2xl sm:text-3xl font-black text-amber-200 group-hover:text-amber-300 transition-colors truncate drop-shadow-md">
                          سُورَةُ {surah.name}
                        </h3>
                        {hasSajdah && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 font-bold" title="تحتوي السورة على سجدة تلاوة">
                            سجدة
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-300/80 font-cairo block truncate font-medium">
                        {surah.englishName} • {surah.englishTranslation}
                      </span>
                    </div>

                  </div>

                  {/* Actions: Audio Equalizer / Play + Favorite */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    
                    {/* Live playing equalizer or Play button */}
                    {isPlaying ? (
                      <div 
                        className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center gap-0.5 h-10 px-2.5 shadow-md shadow-amber-950/50"
                        title="جاري الاستماع الآن"
                      >
                        <span className="w-1 bg-stone-950 rounded-full soundwave-bar-1"></span>
                        <span className="w-1 bg-stone-950 rounded-full soundwave-bar-2"></span>
                        <span className="w-1 bg-stone-950 rounded-full soundwave-bar-3"></span>
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSurah(surah.id, true);
                        }}
                        className="w-10 h-10 rounded-xl bg-stone-800/80 hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-stone-700/80 hover:border-amber-400 transition-all flex items-center justify-center shadow-sm"
                        title="تشغيل التلاوة الصوتية مباشرة"
                      >
                        <PlayCircle className="w-5 h-5 fill-current" />
                      </div>
                    )}

                    {/* Favorite Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(surah.id);
                      }}
                      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border active:scale-95 ${
                        isFav
                          ? 'text-amber-400 bg-amber-950/40 border-amber-500/50'
                          : 'text-stone-500 hover:text-amber-400 bg-stone-800/60 border-stone-700/60 hover:bg-stone-700/60'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                  </div>

                </div>

                {/* Footer Badges & Meta Info */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-800 text-xs text-stone-400 font-medium">
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] ${
                      surah.revelationType === 'Meccan'
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
                    }`}>
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                    <span>{toArabicNumeral(surah.versesCount)} آية</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {onGoTo3D && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          onGoTo3D(surah.startPage);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                        title="قراءة هذه السورة في المصحف ثلاثي الأبعاد 3D"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>مصحف 3D</span>
                      </button>
                    )}

                    {onGoToPage ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToPage(surah.startPage);
                        }}
                        className="hover:text-amber-300 transition-colors text-[11px] underline decoration-dotted"
                        title="الانتقال إلى أول صفحة للسورة في المصحف"
                      >
                        صـ {toArabicNumeral(surah.startPage)}
                      </button>
                    ) : (
                      <span className="text-[11px]">صـ {toArabicNumeral(surah.startPage)}</span>
                    )}
                    <span>•</span>
                    <span className="text-[11px]">جـ {toArabicNumeral(surah.juz)}</span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Layout Mode: Compact Sleek Table / List View */
        <div className="bg-stone-900/90 rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-stone-950/70 text-stone-400 text-xs border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4 text-center w-16">الرقم</th>
                  <th className="py-3 px-4">السورة</th>
                  <th className="py-3 px-4 text-center">النوع</th>
                  <th className="py-3 px-4 text-center">عدد الآيات</th>
                  <th className="py-3 px-4 text-center">الصفحة</th>
                  <th className="py-3 px-4 text-center">الجزء</th>
                  <th className="py-3 px-4 text-center">النزول</th>
                  <th className="py-3 px-4 text-center w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {filteredSurahs.map((surah) => {
                  const isFav = favorites.includes(surah.id);
                  const isPlaying = currentPlayingSurahId === surah.id;

                  return (
                    <tr 
                      key={surah.id}
                      onClick={() => onSelectSurah(surah.id)}
                      className={`hover:bg-stone-850/70 transition-colors cursor-pointer ${
                        isPlaying ? 'bg-amber-950/20 text-amber-200' : 'text-stone-300'
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-amber-400 font-quran text-base">
                        {toArabicNumeral(surah.id)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-quran text-2xl font-black text-amber-200 hover:text-amber-300 transition-colors drop-shadow-sm">
                          سُورَةُ {surah.name}
                        </div>
                        <div className="text-[11px] text-stone-400 font-cairo">
                          {surah.englishName} • {surah.englishTranslation}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          surah.revelationType === 'Meccan'
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {toArabicNumeral(surah.versesCount)} آية
                      </td>
                      <td className="py-3 px-4 text-center">
                        صـ {toArabicNumeral(surah.startPage)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        الجزء {toArabicNumeral(surah.juz)}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-400">
                        {toArabicNumeral(surah.revelationOrder)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {onGoTo3D && (
                            <button
                              onClick={() => {
                                triggerHaptic('medium');
                                onGoTo3D(surah.startPage);
                              }}
                              className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1"
                              title="قراءة في المصحف 3D"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>3D</span>
                            </button>
                          )}
                          <button
                            onClick={() => onSelectSurah(surah.id, true)}
                            className="p-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 transition-all"
                            title="تشغيل التلاوة الصوتية"
                          >
                            <PlayCircle className="w-4 h-4 fill-current" />
                          </button>
                          <button
                            onClick={() => onToggleFavorite(surah.id)}
                            className={`p-2 rounded-xl transition-all ${
                              isFav
                                ? 'text-amber-400 bg-amber-950/40'
                                : 'text-stone-500 hover:text-amber-400 bg-stone-800'
                            }`}
                            title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredSurahs.length === 0 && (
        <div className="text-center py-20 bg-stone-900/80 rounded-3xl border border-stone-800 p-8 space-y-4">
          <BookOpen className="w-14 h-14 text-stone-600 mx-auto animate-pulse" />
          <h3 className="text-xl font-bold font-quran text-stone-200">لم يتم العثور على سور مطابقة للبحث أو التصفية</h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto">
            تأكد من كتابة اسم السورة بشكل صحيح، أو أعد ضبط الفلاتر لاستعراض المصحف كاملاً.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setSelectedJuz(null);
            }}
            className="px-5 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-2xl text-xs hover:bg-amber-400 transition-all shadow-lg shadow-amber-950/50"
          >
            إعادة ضبط الفلاتر والبحث
          </button>
        </div>
      )}

    </div>
  );
};
