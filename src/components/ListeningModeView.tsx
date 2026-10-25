import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  Heart, 
  Share2, 
  Volume2, 
  Volume1,
  VolumeX, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Bookmark, 
  Clock, 
  Search, 
  Folder, 
  FolderCheck,
  Grid, 
  Globe, 
  Flag, 
  Headphones, 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Check, 
  Sliders, 
  FileText, 
  Maximize2, 
  Minimize2,
  Info,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  BookOpen,
  Keyboard,
  RotateCcw
} from 'lucide-react';
import { ALL_SURAHS } from '../data/surahs';
import { RECITERS, getFullSurahAudioCandidateUrls } from '../data/reciters';
import { Reciter, Ayah } from '../types';
import { toArabicNumeral, fetchSurahDetail } from '../services/quranApi';
import playerBannerImg from '../assets/images/islamic_player_banner_1791438493946.jpg';
import { 
  getDeviceInfo, 
  setDevicePreference, 
  triggerHaptic, 
  DeviceInfo, 
  DeviceModePreference 
} from '../services/deviceService';

export interface ListeningModeViewProps {
  initialSurahId?: number;
  selectedReciter: Reciter;
  onSelectReciter: (r: Reciter) => void;
  onClose: () => void;
  onJumpToSurahReader?: (surahId: number) => void;
  favorites: number[];
  onToggleFavorite: (surahId: number) => void;
}

type ListeningSubScreen = 'home' | 'surahs' | 'player' | 'quality' | 'reciters' | 'sleeptimer' | 'info' | 'verses';

export const ListeningModeView: React.FC<ListeningModeViewProps> = ({
  initialSurahId = 1,
  selectedReciter,
  onSelectReciter,
  onClose,
  onJumpToSurahReader,
  favorites,
  onToggleFavorite
}) => {
  // Device Detection and Adaptive Controls
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);
  const [devicePref, setDevicePref] = useState<DeviceModePreference>(() => deviceInfo.preference);

  useEffect(() => {
    const handleResize = () => setDeviceInfo(getDeviceInfo());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleSelectDeviceMode = (pref: DeviceModePreference) => {
    setDevicePreference(pref);
    setDevicePref(pref);
    setDeviceInfo(getDeviceInfo());
    triggerHaptic('medium');
  };

  // Navigation inside Listening Mode
  const [currentScreen, setCurrentScreen] = useState<ListeningSubScreen>('player');
  const [activeSurahId, setActiveSurahId] = useState<number>(initialSurahId || 1);
  
  // Search state in surah list
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('all');
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Quality & Riwaya setting (Screen 2)
  const [selectedRiwaya, setSelectedRiwaya] = useState<'hafs' | 'mujawwad' | 'high_quality'>('hafs');

  // Sleep Timer state (minutes remaining)
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // View frame mode: 'phone' (mockup phone container like images) or 'fullscreen' (stretched)
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Current active Surah metadata
  const currentSurah = useMemo(() => {
    return ALL_SURAHS.find(s => s.id === activeSurahId) || ALL_SURAHS[0];
  }, [activeSurahId]);

  // Full text of ayahs for current surah
  const [ayahsList, setAyahsList] = useState<Ayah[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoadingAyahs(true);
    fetchSurahDetail(activeSurahId)
      .then((detail) => {
        if (!isCancelled && detail && detail.ayahs) {
          setAyahsList(detail.ayahs);
        }
      })
      .catch((err) => {
        console.warn('Failed to load ayahs:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingAyahs(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSurahId]);

  // Audio candidate URLs for full Surah recitation
  const audioCandidates = useMemo(() => {
    return getFullSurahAudioCandidateUrls(selectedReciter.id, activeSurahId);
  }, [selectedReciter.id, activeSurahId]);

  const currentAudioUrl = audioCandidates[candidateIndex] || audioCandidates[0];

  // Initialize or change audio when surah or reciter changes
  useEffect(() => {
    setCandidateIndex(0);
    setIsLoadingAudio(true);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          setIsLoadingAudio(false);
          setIsPlaying(false);
        });
      }
    }
  }, [activeSurahId, selectedReciter.id]);

  // Handle Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoadingAudio(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleWaiting = () => {
      setIsLoadingAudio(true);
    };

    const handleCanPlay = () => {
      setIsLoadingAudio(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setIsPlaying(true);
      } else {
        handleNextSurah();
      }
    };

    const handleError = () => {
      if (candidateIndex < audioCandidates.length - 1) {
        setCandidateIndex(prev => prev + 1);
      } else {
        setIsLoadingAudio(false);
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [candidateIndex, audioCandidates, repeatMode]);

  // Play / Pause toggle
  const togglePlay = () => {
    triggerHaptic('light');
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoadingAudio(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
        })
        .catch((err) => {
          console.error("Audio playback error:", err);
          setIsLoadingAudio(false);
          setIsPlaying(false);
          if (candidateIndex < audioCandidates.length - 1) {
            setCandidateIndex(prev => prev + 1);
          }
        });
    }
  };

  // Next Surah
  const handleNextSurah = () => {
    triggerHaptic('light');
    if (isShuffle) {
      const randomId = Math.floor(Math.random() * 114) + 1;
      setActiveSurahId(randomId);
    } else {
      setActiveSurahId(prev => (prev < 114 ? prev + 1 : 1));
    }
    setIsPlaying(true);
  };

  // Prev Surah
  const handlePrevSurah = () => {
    triggerHaptic('light');
    if (currentTime > 5 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    setActiveSurahId(prev => (prev > 1 ? prev - 1 : 114));
    setIsPlaying(true);
  };

  // Seek audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Sleep Timer countdown interval
  useEffect(() => {
    if (!sleepTimerMinutes) {
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Format Time (mm:ss or hh:mm:ss)
  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filtered surahs for screen 3
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SURAHS;
    const q = searchQuery.toLowerCase().trim();
    return ALL_SURAHS.filter(s => 
      s.name.includes(q) || 
      s.englishName.toLowerCase().includes(q) || 
      String(s.id).includes(q)
    );
  }, [searchQuery]);

  // Share current recitation
  const handleShare = () => {
    triggerHaptic('light');
    if (navigator.share) {
      navigator.share({
        title: `القرآن الكريم بصوت ${selectedReciter.name}`,
        text: `استمع إلى سورة ${currentSurah.name} بصوت ${selectedReciter.name} عبر موقع التوبة`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط الاستماع للحافظة!');
    }
  };

  // Is current surah favorited
  const isCurrentSurahFavorited = favorites.includes(activeSurahId);

  // Desktop Keyboard Shortcuts Controller
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleNextSurah();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handlePrevSurah();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(prev => Math.min(1, Number((prev + 0.1).toFixed(2))));
        if (audioRef.current) audioRef.current.volume = Math.min(1, (audioRef.current.volume || 1) + 0.1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(prev => Math.max(0, Number((prev - 0.1).toFixed(2))));
        if (audioRef.current) audioRef.current.volume = Math.max(0, (audioRef.current.volume || 0) - 0.1);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted(prev => !prev);
        if (audioRef.current) audioRef.current.muted = !audioRef.current.muted;
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setCurrentScreen(prev => (prev === 'verses' ? 'player' : 'verses'));
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setCurrentScreen('sleeptimer');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, activeSurahId, candidateIndex, isMuted, volume]);

  // Mobile Touch Gestures (Swipe to skip surah / swipe up for verses)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    if (Math.abs(diffX) > 65 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        handleNextSurah();
      } else {
        handlePrevSurah();
      }
    } else if (diffY < -75 && Math.abs(diffY) > Math.abs(diffX)) {
      if (currentScreen === 'player') {
        setCurrentScreen('verses');
        triggerHaptic('light');
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const isMobileEffective = deviceInfo.type === 'mobile';
  const isTabletEffective = deviceInfo.type === 'tablet';
  const isDesktopEffective = deviceInfo.type === 'desktop';

  // Should we show phone mockup bezel?
  const showPhoneBezel = isMobileEffective && deviceInfo.actualType === 'desktop' && isPhoneFrame;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/95 backdrop-blur-2xl flex flex-col items-center justify-start min-h-screen p-2 sm:p-4 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Hidden native audio element for continuous streaming */}
      <audio 
        ref={audioRef} 
        src={currentAudioUrl} 
        preload="metadata"
      />

      {/* ======================================================== */}
      {/* TOP BAR & ADAPTIVE DEVICE CONTROLS SWITCHER              */}
      {/* ======================================================== */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-stone-300">
        
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-stone-200 hover:text-white hover:bg-stone-800 text-xs font-bold transition-all shadow-md active:scale-95"
          title="الرجوع إلى موقع التوبة"
        >
          <X className="w-4 h-4 text-amber-400" />
          <span>الخروج للوضع العادي</span>
        </button>

        {/* Adaptive Device Mode Controls Switcher */}
        <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-800 p-1 rounded-full text-xs shadow-md">
          <span className="text-[10px] text-stone-400 px-2 hidden sm:inline font-medium">نمط التحكم:</span>
          
          <button
            onClick={() => handleSelectDeviceMode('auto')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
              devicePref === 'auto'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="تلقائي (يتكيف حسب جهازك الحالي)"
          >
            <Sliders className="w-3 h-3" />
            <span className="text-[10px]">تلقائي ({deviceInfo.actualType === 'mobile' ? 'هاتف' : deviceInfo.actualType === 'tablet' ? 'لوحي' : 'حاسوب'})</span>
          </button>

          <button
            onClick={() => handleSelectDeviceMode('mobile')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
              devicePref === 'mobile'
                ? 'bg-teal-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="نمط الهاتف الذكي (مريح للمس بيد واحدة وتمرير الإبهام)"
          >
            <Smartphone className="w-3 h-3" />
            <span className="text-[10px]">هاتف 📱</span>
          </button>

          <button
            onClick={() => handleSelectDeviceMode('tablet')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
              devicePref === 'tablet'
                ? 'bg-teal-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="نمط الجهاز اللوحي (شاشة مقسمة مريحة)"
          >
            <Tablet className="w-3 h-3" />
            <span className="text-[10px]">لوحي 📟</span>
          </button>

          <button
            onClick={() => handleSelectDeviceMode('desktop')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
              devicePref === 'desktop'
                ? 'bg-teal-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="نمط الحاسوب المكتبي (شاشة استوديو واسعة واختصارات المفاتيح)"
          >
            <Monitor className="w-3 h-3" />
            <span className="text-[10px]">حاسوب 🖥️</span>
          </button>
        </div>

        {/* Bezel Toggle (only on desktop previewing mobile) */}
        {showPhoneBezel && (
          <button
            onClick={() => setIsPhoneFrame(prev => !prev)}
            className="p-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs transition-all"
            title="تكبير ملء الشاشة أو إطار الهاتف"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Decorative Title Header */}
      <div className="text-center my-1">
        <h1 className="text-base sm:text-xl font-bold font-quran text-[#14959d] dark:text-[#2dd4bf] tracking-wide drop-shadow-sm flex items-center justify-center gap-2">
          <span>القرآن الكريم بصوت {selectedReciter.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#14959d]/15 text-[#0d767d] dark:text-teal-300 font-sans border border-[#14959d]/30">
            تلاوة خاشعة بدون انترنت
          </span>
        </h1>
        <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
          <span>✨</span>
          <span>وضع الاستماع المباشر عالي النقاء متكيف لجميع الشاشات</span>
          <span>✨</span>
        </p>
      </div>

      {/* ======================================================== */}
      {/* 1. DESKTOP WIDESCREEN PANORAMIC STUDIO MODE               */}
      {/* ======================================================== */}
      {isDesktopEffective && (
        <div className="w-full max-w-6xl my-auto rounded-3xl border border-stone-800 bg-stone-900/90 shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-fade-in">
          
          {/* Panoramic Mosque Banner across top */}
          <div className="relative w-full h-44 bg-gradient-to-r from-[#07474d] via-[#0b646c] to-[#0e7c86] overflow-hidden flex flex-col justify-between p-6">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
              <img src={playerBannerImg} alt="خلفية إسلامية" className="w-full h-full object-cover" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              {/* Reciter Portrait & Name */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-white/80 p-0.5 bg-[#0a5c63] shadow-xl overflow-hidden shrink-0">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#064247] to-[#158f99] flex items-center justify-center text-white">
                    <span className="font-quran text-xl font-bold text-amber-300">
                      {selectedReciter.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                </div>
                <div className="text-white drop-shadow">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold">القارئ المختار</span>
                  <h2 className="text-2xl font-bold font-quran text-white mt-1">{selectedReciter.name}</h2>
                  <p className="text-xs text-teal-100/90">{selectedReciter.subtext || 'حفص عن عاصم - المصحف المرتل'}</p>
                </div>
              </div>

              {/* Calligraphy Holy Quran */}
              <div className="text-left font-quran hidden sm:block">
                <div className="text-3xl font-bold text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  القرآن الكريم
                </div>
                <div className="text-xs text-teal-100 tracking-widest uppercase">Holy Quran Studio</div>
              </div>

              {/* Actions: Reciter selector & Favorite */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleFavorite(activeSurahId)}
                  className={`p-2.5 rounded-xl transition-all ${
                    isCurrentSurahFavorited ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isCurrentSurahFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                >
                  <Heart className={`w-5 h-5 ${isCurrentSurahFavorited ? 'fill-red-400 text-red-400' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="مشاركة التلاوة"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Mosque Silhouette base */}
            <div className="w-full text-stone-900 pointer-events-none -mb-6">
              <svg viewBox="0 0 500 80" className="w-full h-10 fill-stone-900 preserve-3d" preserveAspectRatio="none">
                <path d="M0,80 L0,50 Q25,48 50,50 Q75,30 100,50 Q115,20 125,5 Q135,20 150,50 Q175,45 200,50 Q235,10 250,0 Q265,10 300,50 Q325,45 350,50 Q365,20 375,5 Q385,20 400,50 Q425,30 450,50 Q475,48 500,50 L500,80 Z" />
              </svg>
            </div>
          </div>

          {/* Desktop 3-Column Layout */}
          <div className="grid grid-cols-12 gap-4 p-6 min-h-[460px] bg-stone-900">
            
            {/* Column 1: Surahs Directory (4 cols) */}
            <div className="col-span-4 bg-stone-950/80 rounded-2xl border border-stone-800 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <h3 className="text-sm font-bold font-quran text-amber-200">فهرس سور القرآن الكريم</h3>
                  <span className="text-[11px] text-stone-400 font-mono">114 سورة</span>
                </div>

                {/* Search */}
                <div className="relative my-3">
                  <Search className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم السورة..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Surah List scroll */}
                <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
                  {filteredSurahs.map((s) => {
                    const isCurr = s.id === activeSurahId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveSurahId(s.id);
                          setIsPlaying(true);
                          triggerHaptic('light');
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                          isCurr 
                            ? 'bg-teal-950/60 border-teal-500/80 text-teal-200 shadow-md font-bold' 
                            : 'bg-stone-900/60 hover:bg-stone-850 border-stone-800/80 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-[10px] font-mono text-stone-400">
                            {s.id}
                          </span>
                          <div>
                            <div className="text-xs font-quran">{s.name}</div>
                            <div className="text-[10px] text-stone-500">{s.versesCount} آية • {s.type === 'meccan' ? 'مكية' : 'مدنية'}</div>
                          </div>
                        </div>

                        {isCurr && isPlaying ? (
                          <div className="flex items-center gap-0.5 text-teal-400">
                            <span className="w-1 h-3 bg-teal-400 animate-pulse"></span>
                            <span className="w-1 h-4 bg-teal-400 animate-pulse delay-75"></span>
                            <span className="w-1 h-2 bg-teal-400 animate-pulse delay-150"></span>
                          </div>
                        ) : (
                          <Play className="w-3.5 h-3.5 text-stone-500 hover:text-teal-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Quick Settings: Sleep Timer & Quality */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setCurrentScreen('sleeptimer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>مؤقت النوم {sleepTimerRemaining ? `(${Math.ceil(sleepTimerRemaining / 60)}د)` : ''}</span>
                </button>
                <button
                  onClick={() => setCurrentScreen('quality')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 transition-colors"
                >
                  <FolderCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>الجودة والرواية</span>
                </button>
              </div>
            </div>

            {/* Column 2: Center Stage Player (5 cols) */}
            <div className="col-span-5 bg-stone-950/90 rounded-2xl border border-stone-800 p-6 flex flex-col justify-between text-center relative overflow-hidden">
              <div className="space-y-4">
                {/* Surah Title */}
                <div className="space-y-1">
                  <span className="text-xs text-teal-400 font-bold">تلاوة خاشعة مرتلة</span>
                  <h2 className="text-3xl font-bold font-quran text-amber-100 drop-shadow">
                    سورة {currentSurah.name}
                  </h2>
                  <p className="text-xs text-stone-400">
                    {currentSurah.englishName} • {currentSurah.type === 'meccan' ? 'مكية' : 'مدنية'} • {toArabicNumeral(currentSurah.versesCount)} آية
                  </p>
                </div>

                {/* Animated Sound Wave Graphic */}
                <div className="h-16 flex items-center justify-center gap-1.5 py-2">
                  {[12, 28, 45, 60, 35, 50, 65, 40, 25, 48, 55, 30, 20].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: isPlaying ? `${h}px` : '10px' }}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        isPlaying ? 'bg-gradient-to-t from-teal-500 to-amber-300 animate-pulse' : 'bg-stone-800'
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Scrubber Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls Row */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    onClick={() => setIsShuffle(p => !p)}
                    className={`p-2.5 rounded-xl transition-colors ${isShuffle ? 'bg-teal-500/20 text-teal-300' : 'text-stone-500 hover:text-stone-300'}`}
                    title="خلط عشوائي"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrevSurah}
                    className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 transition-all active:scale-95 border border-stone-800"
                    title="السورة السابقة"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    onClick={togglePlay}
                    disabled={isLoadingAudio}
                    className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-600 to-teal-400 text-stone-950 flex items-center justify-center shadow-xl shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    {isLoadingAudio ? (
                      <div className="w-6 h-6 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                      <Pause className="w-7 h-7 fill-stone-950" />
                    ) : (
                      <Play className="w-7 h-7 fill-stone-950 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleNextSurah}
                    className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 transition-all active:scale-95 border border-stone-800"
                    title="السورة التالية"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    onClick={() => {
                      if (repeatMode === 'none') setRepeatMode('all');
                      else if (repeatMode === 'all') setRepeatMode('one');
                      else setRepeatMode('none');
                    }}
                    className={`p-2.5 rounded-xl transition-colors ${repeatMode !== 'none' ? 'bg-teal-500/20 text-teal-300' : 'text-stone-500 hover:text-stone-300'}`}
                    title={`التكرار: ${repeatMode}`}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Volume Slider & Speed Selector */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsMuted(p => !p)} className="text-stone-400 hover:text-amber-300">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(false);
                      if (audioRef.current) audioRef.current.volume = v;
                    }}
                    className="w-20 h-1.5 bg-stone-800 rounded appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {[0.75, 1, 1.25, 1.5].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setPlaybackSpeed(s);
                        if (audioRef.current) audioRef.current.playbackRate = s;
                      }}
                      className={`px-1.5 py-0.5 rounded ${playbackSpeed === s ? 'bg-teal-500 text-stone-950 font-bold' : 'hover:bg-stone-800 text-stone-400'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Synchronized Quran Verses Display (3 cols) */}
            <div className="col-span-3 bg-stone-950/80 rounded-2xl border border-stone-800 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span>نص آيات السورة</span>
                  </div>
                  <span className="text-[10px] text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800">قراءة متزامنة</span>
                </div>

                <div className="overflow-y-auto max-h-[340px] mt-3 pr-1 space-y-2 text-justify leading-loose font-quran text-stone-200 text-sm">
                  {activeSurahId !== 9 && (
                    <div className="text-center py-1 text-amber-300/80 text-xs border-b border-stone-800/60">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                  )}

                  {isLoadingAyahs ? (
                    <div className="py-12 text-center text-xs text-stone-500">جاري تحميل الآيات...</div>
                  ) : (
                    <div>
                      {ayahsList.map(a => (
                        <span key={a.number} className="inline hover:text-amber-300 transition-colors">
                          {a.numberInSurah === 1 && activeSurahId !== 1 && activeSurahId !== 9
                            ? a.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '')
                            : a.text}
                          <span className="inline-block mx-1 px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-300 text-[10px] border border-teal-800 select-none">
                            ﴿{toArabicNumeral(a.numberInSurah)}﴾
                          </span>{' '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {onJumpToSurahReader && (
                <button
                  onClick={() => {
                    onJumpToSurahReader(activeSurahId);
                    onClose();
                  }}
                  className="w-full mt-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 text-xs font-bold transition-all text-center"
                >
                  فتح المصحف الكامل بالقراءات ←
                </button>
              )}
            </div>

          </div>

          {/* Desktop Keyboard Shortcuts Banner */}
          <div className="bg-stone-950 px-6 py-2 border-t border-stone-800 text-[11px] text-stone-400 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 font-bold text-amber-300">
              <Keyboard className="w-3.5 h-3.5" />
              <span>اختصارات لوحة المفاتيح:</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200">Space</kbd> تشغيل/إيقاف</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200">←/→</kbd> السورة التالية/السابقة</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200">↑/↓</kbd> الصوت</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200">M</kbd> كتم</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200">S</kbd> مؤقت النوم</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200">Esc</kbd> خروج</span>
            </div>
            <div className="flex items-center gap-1 text-[#14959d]">
              <Headphones className="w-3.5 h-3.5" />
              <span>استمع بسماعات الرأس لنقاء فائق</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TABLET DUAL-PANE MODE (أجهزة لوحية / iPads)             */}
      {/* ======================================================== */}
      {isTabletEffective && (
        <div className="w-full max-w-4xl my-auto rounded-3xl border border-stone-800 bg-[#eef1f3] shadow-2xl overflow-hidden flex flex-col animate-fade-in">
          
          {/* Header */}
          <div className="bg-[#0a666e] text-white px-6 py-3 flex items-center justify-between border-b border-[#0d7d87]">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-quran font-bold">
                {selectedReciter.name.slice(0, 1)}
              </span>
              <div>
                <h3 className="font-quran font-bold text-sm">القرآن الكريم بصوت {selectedReciter.name}</h3>
                <p className="text-[10px] text-teal-100">نمط الجهاز اللوحي المزدوج</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => onToggleFavorite(activeSurahId)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                <Heart className={`w-4 h-4 ${isCurrentSurahFavorited ? 'fill-red-400 text-red-400' : ''}`} />
              </button>
              <button onClick={handleShare} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dual-Pane Body */}
          <div className="grid grid-cols-12 min-h-[480px]">
            {/* Right Pane: Surahs list (5 cols) */}
            <div className="col-span-5 bg-white border-l border-stone-200 p-4 flex flex-col justify-between">
              <div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن السورة..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#e4e7eb] border border-stone-300 text-xs text-stone-800 placeholder-stone-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[340px] pr-1">
                  {filteredSurahs.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSurahId(s.id);
                        setIsPlaying(true);
                        triggerHaptic('light');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        s.id === activeSurahId ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold' : 'bg-[#e4e7eb] hover:bg-[#d8dce2] border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-white text-stone-700 text-xs font-bold flex items-center justify-center shadow-xs">
                          {toArabicNumeral(s.id)}
                        </span>
                        <div>
                          <div className="text-xs font-quran">{s.name}</div>
                          <div className="text-[10px] text-stone-500">{s.versesCount} آية</div>
                        </div>
                      </div>
                      {s.id === activeSurahId && isPlaying ? (
                        <div className="flex items-center gap-0.5 text-teal-700">
                          <span className="w-1 h-3 bg-teal-700 animate-pulse"></span>
                          <span className="w-1 h-4 bg-teal-700 animate-pulse delay-75"></span>
                          <span className="w-1 h-2 bg-teal-700 animate-pulse delay-150"></span>
                        </div>
                      ) : (
                        <Play className="w-3.5 h-3.5 text-stone-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <span>المفضلة: {favorites.length}</span>
                <button onClick={() => setCurrentScreen('sleeptimer')} className="text-teal-700 font-bold">
                  مؤقت النوم ⏱️
                </button>
              </div>
            </div>

            {/* Left Pane: Player Stage & Verses Reader (7 cols) */}
            <div className="col-span-7 bg-white p-6 flex flex-col justify-between">
              <div>
                {/* Mosque Trim Header */}
                <div className="w-full h-32 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-800 p-4 text-white flex items-center justify-between relative overflow-hidden shadow-md mb-4">
                  <div className="relative z-10">
                    <span className="text-xs text-teal-200 font-bold">تلاوة مباركة</span>
                    <h2 className="text-2xl font-bold font-quran mt-1">سورة {currentSurah.name}</h2>
                    <p className="text-xs text-teal-100">{currentSurah.englishName} • {toArabicNumeral(currentSurah.versesCount)} آية</p>
                  </div>
                  <div className="text-left font-quran relative z-10">
                    <div className="text-xl font-bold text-amber-200">القرآن الكريم</div>
                    <div className="text-[10px] text-teal-100">{selectedReciter.name}</div>
                  </div>
                </div>

                {/* Scrubber */}
                <div className="space-y-1 mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-stone-200 rounded appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Tablet Controls */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <button onClick={() => setIsShuffle(p => !p)} className="p-2 text-stone-400 hover:text-stone-700">
                    <Shuffle className="w-5 h-5" />
                  </button>
                  <button onClick={handlePrevSurah} className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800">
                    <SkipBack className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
                  </button>
                  <button onClick={handleNextSurah} className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800">
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={() => setRepeatMode(r => r === 'all' ? 'one' : r === 'one' ? 'none' : 'all')} className="p-2 text-stone-400 hover:text-stone-700">
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Verses Toggle Button */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => setCurrentScreen(s => s === 'verses' ? 'player' : 'verses')}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-bold border border-teal-200 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>{currentScreen === 'verses' ? 'إخفاء نص الآيات' : 'عرض نص الآيات المتزامن'}</span>
                </button>
                <span className="text-[11px] text-stone-500 font-medium">🎧 إستعمل سماعات الرأس</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MOBILE FORM FACTOR (الهواتف الذكية وتصميم الصور)        */}
      {/* ======================================================== */}
      {isMobileEffective && (
        <div className={`relative w-full ${showPhoneBezel ? 'max-w-[390px] rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[9px] border-stone-800 bg-[#eef1f3]' : 'max-w-md w-full min-h-[92vh] rounded-3xl border border-stone-800 bg-[#eef1f3]'} overflow-hidden transition-all duration-300 my-auto flex flex-col justify-between animate-fade-in`}>
          
          {/* Smartphone Camera Notch (only on desktop previewing mobile frame) */}
          {showPhoneBezel && (
            <div className="absolute top-0 inset-x-0 h-6 bg-[#095f66] z-40 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-4 bg-stone-900 rounded-b-xl flex items-center justify-center gap-2">
                <div className="w-8 h-1 bg-stone-700 rounded-full"></div>
                <div className="w-2 h-2 rounded-full bg-teal-950 border border-teal-800"></div>
              </div>
            </div>
          )}

          {/* Top Bar inside Mobile */}
          <div className={`relative z-30 flex items-center justify-between px-4 ${showPhoneBezel ? 'pt-7 pb-2' : 'py-3.5'} bg-[#0a666e] text-white shadow-sm border-b border-[#0d7d87]`}>
            {currentScreen === 'home' ? (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onToggleFavorite(activeSurahId);
                }}
                className={`p-2 rounded-lg transition-transform active:scale-90 ${
                  isCurrentSurahFavorited 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
                title="تفضيل"
              >
                <Heart className={`w-4 h-4 ${isCurrentSurahFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (currentScreen === 'verses') setCurrentScreen('player');
                  else if (currentScreen === 'player') setCurrentScreen('surahs');
                  else setCurrentScreen('home');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 flex items-center gap-1"
                title="الرجوع"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="text-center flex-1 mx-2 overflow-hidden">
              <h2 className="text-xs sm:text-sm font-bold truncate text-white drop-shadow-sm font-quran">
                {currentScreen === 'home' && `الشيخ ${selectedReciter.name}`}
                {currentScreen === 'surahs' && 'القرآن الكريم (قائمة السور)'}
                {currentScreen === 'player' && `القرآن الكريم بصوت ${selectedReciter.name}`}
                {currentScreen === 'verses' && `سورة ${currentSurah.name} (عرض الآيات)`}
                {currentScreen === 'quality' && 'القرآن الكريم بجودة عالية'}
                {currentScreen === 'reciters' && 'اختيار القارئ'}
                {currentScreen === 'sleeptimer' && 'مؤقت النوم والتكرار'}
                {currentScreen === 'info' && 'عن القارئ والمصحف'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {currentScreen === 'player' && (
                <button
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    if (audioRef.current) audioRef.current.muted = nextMuted;
                    triggerHaptic('light');
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="كتم الصوت"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-90"
                title="مشاركة"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hero Banner across Home & Player */}
          {(currentScreen === 'home' || currentScreen === 'player') && (
            <div className="relative w-full h-44 sm:h-48 bg-gradient-to-b from-[#0b6a72] via-[#0d7a83] to-[#128a93] overflow-hidden flex flex-col items-center justify-end">
              <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
                <img src={playerBannerImg} alt="خلفية إسلامية" className="w-full h-full object-cover" />
              </div>

              <div className="absolute top-2 left-6 text-amber-200/70 text-xs animate-pulse">✦</div>
              <div className="absolute top-5 right-8 text-amber-100/60 text-sm animate-pulse delay-700">✧</div>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className="text-amber-200/80 text-xl font-bold font-quran drop-shadow">🌙</span>
              </div>

              {/* Reciter Portrait Medallion */}
              <div className="relative z-10 flex items-center justify-between w-full px-6 pb-4">
                <div className="relative flex items-center gap-3">
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-white/80 p-0.5 bg-[#0a5c63] shadow-lg overflow-hidden">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#064247] to-[#158f99] flex items-center justify-center text-white">
                      <span className="font-quran text-lg font-bold text-amber-300">
                        {selectedReciter.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-white drop-shadow">
                    <div className="text-[11px] text-teal-200 font-bold">القارئ المبارك</div>
                    <div className="text-xs sm:text-sm font-bold font-quran leading-tight text-white">{selectedReciter.name}</div>
                    <div className="text-[10px] text-teal-100/80">{selectedReciter.subtext || 'حفص عن عاصم - تلاوة خاشعة'}</div>
                  </div>
                </div>

                <div className="text-left font-quran">
                  <div className="text-base sm:text-lg font-bold text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">القرآن الكريم</div>
                  <div className="text-[9px] text-white/80 font-sans tracking-widest text-center uppercase">Holy Quran</div>
                </div>
              </div>

              <div className="w-full text-white pointer-events-none -mb-[1px]">
                <svg viewBox="0 0 500 80" className="w-full h-10 sm:h-12 fill-white preserve-3d" preserveAspectRatio="none">
                  <path d="M0,80 L0,50 Q25,48 50,50 Q75,30 100,50 Q115,20 125,5 Q135,20 150,50 Q175,45 200,50 Q235,10 250,0 Q265,10 300,50 Q325,45 350,50 Q365,20 375,5 Q385,20 400,50 Q425,30 450,50 Q475,48 500,50 L500,80 Z" />
                </svg>
              </div>
            </div>
          )}

          {/* Subscreen Content Card */}
          <div className="bg-white min-h-[380px] max-h-[520px] overflow-y-auto p-4 flex flex-col justify-between flex-1">
            
            {/* Screen 1: Home Menu */}
            {currentScreen === 'home' && (
              <div className="space-y-2.5 flex-1 py-1">
                <button
                  onClick={() => {
                    setCurrentScreen('surahs');
                    triggerHaptic('light');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#e4e7eb] hover:bg-[#d8dce2] active:bg-[#c9cfd7] text-stone-700 transition-all shadow-sm border border-stone-200/70"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
                    <Folder className="w-4 h-4 fill-teal-600/30" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800 flex-1 text-center font-quran">القرآن الكريم بدون انترنت</span>
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setCurrentScreen('quality');
                    triggerHaptic('light');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#e4e7eb] hover:bg-[#d8dce2] active:bg-[#c9cfd7] text-stone-700 transition-all shadow-sm border border-stone-200/70"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
                    <FolderCheck className="w-4 h-4 fill-teal-600/30" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800 flex-1 text-center font-quran">القرآن الكريم بجودة عالية</span>
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentScreen('surahs');
                    triggerHaptic('light');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#e4e7eb] hover:bg-[#d8dce2] active:bg-[#c9cfd7] text-stone-700 transition-all shadow-sm border border-stone-200/70"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-teal-600/30" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800 flex-1 text-center font-quran">المفضلة ({toArabicNumeral(favorites.length)})</span>
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setCurrentScreen('sleeptimer');
                    triggerHaptic('light');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#e4e7eb] hover:bg-[#d8dce2] active:bg-[#c9cfd7] text-stone-700 transition-all shadow-sm border border-stone-200/70"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-teal-700" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800 flex-1 text-center font-quran">
                    مؤقت النوم والتكرار {sleepTimerRemaining ? `(${Math.ceil(sleepTimerRemaining / 60)}د)` : ''}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setCurrentScreen('reciters');
                    triggerHaptic('light');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#e4e7eb] hover:bg-[#d8dce2] active:bg-[#c9cfd7] text-stone-700 transition-all shadow-sm border border-stone-200/70"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
                    <Grid className="w-4 h-4 text-teal-700" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800 flex-1 text-center font-quran">إكتشف القراء ({toArabicNumeral(RECITERS.length)})</span>
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setCurrentScreen('player');
                      triggerHaptic('light');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between shadow-md active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-quran">سورة {currentSurah.name}</div>
                        <div className="text-[10px] text-teal-200">{formatTime(currentTime)} / {formatTime(duration)}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">فتح المشغل ←</span>
                  </button>
                </div>
              </div>
            )}

            {/* Screen 2: Quality */}
            {currentScreen === 'quality' && (
              <div className="space-y-4 flex-1 py-3">
                <div className="text-center pb-2">
                  <h3 className="font-bold text-stone-800 text-sm font-quran">اختر نوع وجودة التلاوة</h3>
                  <p className="text-xs text-stone-500">جودة صوتية عالية مأخوذة من أنقى التسجيلات</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedRiwaya('hafs');
                    triggerHaptic('light');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all border ${
                    selectedRiwaya === 'hafs' ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-[#e4e7eb] border-stone-200 text-stone-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedRiwaya === 'hafs' ? 'bg-teal-600 text-white' : 'bg-stone-300'}`}>
                    {selectedRiwaya === 'hafs' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="text-center flex-1">
                    <div className="font-bold text-xs sm:text-sm font-quran">رواية حفص عن عاصم</div>
                    <div className="text-[10px] text-stone-500">المصحف المرتل الكامل برواية حفص</div>
                  </div>
                  <FolderCheck className="w-5 h-5 text-teal-700" />
                </button>

                <button
                  onClick={() => {
                    setSelectedRiwaya('mujawwad');
                    triggerHaptic('light');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all border ${
                    selectedRiwaya === 'mujawwad' ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-[#e4e7eb] border-stone-200 text-stone-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedRiwaya === 'mujawwad' ? 'bg-teal-600 text-white' : 'bg-stone-300'}`}>
                    {selectedRiwaya === 'mujawwad' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="text-center flex-1">
                    <div className="font-bold text-xs sm:text-sm font-quran">المصحف المجود</div>
                    <div className="text-[10px] text-stone-500">تلاوة خاشعة بأحكام التجويد</div>
                  </div>
                  <FolderCheck className="w-5 h-5 text-teal-700" />
                </button>

                <button
                  onClick={() => {
                    setCurrentScreen('surahs');
                    triggerHaptic('light');
                  }}
                  className="w-full mt-4 py-3 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-md"
                >
                  متابعة واختيار السور ←
                </button>
              </div>
            )}

            {/* Screen 3: Surahs List */}
            {currentScreen === 'surahs' && (
              <div className="space-y-2 flex-1 flex flex-col h-full">
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم السورة..."
                    className="w-full pr-9 pl-4 py-2 rounded-xl bg-[#e4e7eb] border border-stone-300 text-xs text-stone-800 placeholder-stone-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[360px] pr-0.5">
                  {filteredSurahs.map((surah) => {
                    const isCurr = surah.id === activeSurahId;
                    return (
                      <div
                        key={surah.id}
                        onClick={() => {
                          setActiveSurahId(surah.id);
                          setCurrentScreen('player');
                          setIsPlaying(true);
                          triggerHaptic('light');
                        }}
                        className={`cursor-pointer flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all border ${
                          isCurr ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold' : 'bg-[#e4e7eb] border-stone-200/80 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              onToggleFavorite(surah.id);
                              triggerHaptic('light');
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500"
                          >
                            <Bookmark className={`w-4 h-4 ${favorites.includes(surah.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          {isCurr && isPlaying ? (
                            <div className="flex items-center gap-0.5 text-teal-600 text-[10px]">
                              <span className="w-1 h-2.5 bg-teal-600 animate-pulse"></span>
                              <span className="w-1 h-3.5 bg-teal-600 animate-pulse delay-75"></span>
                              <span className="w-1 h-1.5 bg-teal-600 animate-pulse delay-150"></span>
                            </div>
                          ) : (
                            <Play className="w-3.5 h-3.5 text-teal-700 opacity-60" />
                          )}
                        </div>

                        <div className="flex-1 text-center px-2">
                          <div className="font-quran text-xs sm:text-sm font-bold text-stone-800">سورة {surah.name}</div>
                          <div className="text-[10px] text-stone-500">{surah.type === 'meccan' ? 'مكية' : 'مدنية'} • {toArabicNumeral(surah.versesCount)} آية</div>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 shadow-sm flex items-center justify-center font-bold text-xs text-stone-700">
                          {toArabicNumeral(surah.id)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Screen 4: Player */}
            {currentScreen === 'player' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between py-1">
                <div className="text-center space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold font-quran text-stone-900">سورة {currentSurah.name}</h3>
                  <div className="text-xs text-[#14959d] font-semibold">{currentSurah.englishName}</div>
                  <div className="text-[11px] text-stone-500 flex items-center justify-center gap-3">
                    <span>سورة : {currentSurah.type === 'meccan' ? 'مكية' : 'مدنية'}</span>
                    <span>•</span>
                    <span>{toArabicNumeral(currentSurah.versesCount)} : آياتها</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-6 py-1">
                  <button
                    onClick={() => {
                      onToggleFavorite(activeSurahId);
                      triggerHaptic('light');
                    }}
                    className={`p-2 rounded-xl transition-all ${isCurrentSurahFavorited ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}
                  >
                    <Bookmark className={`w-4 h-4 ${isCurrentSurahFavorited ? 'fill-amber-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentScreen('sleeptimer');
                      triggerHaptic('light');
                    }}
                    className="p-2 rounded-xl bg-stone-100 text-stone-600 flex items-center gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    {sleepTimerRemaining && <span className="text-[10px]">{Math.ceil(sleepTimerRemaining / 60)}د</span>}
                  </button>
                </div>

                <div className="space-y-1 px-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#14959d]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Thumb-Optimized Controls Row */}
                <div className="flex items-center justify-between px-4 py-1">
                  <button onClick={() => setIsShuffle(p => !p)} className="p-2.5 text-stone-400">
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button onClick={handlePrevSurah} className="p-2.5 text-stone-600 hover:text-stone-900">
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={isLoadingAudio}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0d7d87] to-[#16a1ab] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  >
                    {isLoadingAudio ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6 fill-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    )}
                  </button>
                  <button onClick={handleNextSurah} className="p-2.5 text-stone-600 hover:text-stone-900">
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                  <button onClick={() => setRepeatMode(r => r === 'all' ? 'one' : r === 'one' ? 'none' : 'all')} className="p-2.5 text-stone-400">
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* View Verses / Reading button */}
                <div className="pt-1 flex flex-col items-center gap-1.5 text-center">
                  <button
                    onClick={() => {
                      setCurrentScreen('verses');
                      triggerHaptic('light');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-300 transition-all active:scale-95 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>عرض الآيات وقراءة السورة أثناء الاستماع 📖</span>
                  </button>
                </div>
              </div>
            )}

            {/* Screen 5: Verses Display */}
            {currentScreen === 'verses' && (
              <div className="space-y-3 flex-1 flex flex-col h-full py-1">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <button
                    onClick={() => setCurrentScreen('player')}
                    className="flex items-center gap-1 text-xs font-bold text-teal-700 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>العودة للمشغل</span>
                  </button>
                  <div className="text-center">
                    <span className="font-quran text-sm font-bold text-stone-900">سورة {currentSurah.name}</span>
                  </div>
                  <button onClick={togglePlay} className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center">
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[350px] p-3 rounded-2xl bg-[#fafafa] border border-stone-200 shadow-inner space-y-3">
                  {activeSurahId !== 9 && (
                    <div className="text-center py-2 text-stone-800 font-quran text-base border-b border-stone-200/60">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                  )}

                  {isLoadingAyahs ? (
                    <div className="py-12 text-center text-xs text-stone-500">جاري تحميل الآيات الكريمة...</div>
                  ) : (
                    <div className="text-justify leading-loose font-quran text-base sm:text-lg text-stone-900" dir="rtl">
                      {ayahsList.map((ayah) => (
                        <span key={ayah.number} className="inline hover:text-teal-800">
                          {ayah.numberInSurah === 1 && activeSurahId !== 1 && activeSurahId !== 9
                            ? ayah.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '')
                            : ayah.text}
                          <span className="inline-block mx-1.5 px-1.5 py-0.5 text-xs font-bold text-teal-800 bg-teal-100/70 border border-teal-300 rounded-full select-none">
                            ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                          </span>{' '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-2 rounded-xl bg-teal-900 text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-white text-teal-900 flex items-center justify-center">
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div className="text-right">
                      <div className="text-[11px] font-bold font-quran">سورة {currentSurah.name}</div>
                      <div className="text-[9px] text-teal-200 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>
                    </div>
                  </div>
                  <button onClick={() => setCurrentScreen('player')} className="px-2.5 py-1 rounded-lg bg-white/20 text-[10px] font-bold text-white">
                    فتح المشغل ←
                  </button>
                </div>
              </div>
            )}

            {/* Screen 6: Reciters */}
            {currentScreen === 'reciters' && (
              <div className="space-y-2 flex-1 flex flex-col h-full">
                <div className="text-center pb-1">
                  <h3 className="font-bold text-stone-800 text-sm font-quran">اختر القارئ المفضل</h3>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[340px] pr-0.5">
                  {RECITERS.map((r) => {
                    const isSel = r.id === selectedReciter.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectReciter(r);
                          setCurrentScreen('player');
                          triggerHaptic('light');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border ${
                          isSel ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold' : 'bg-[#e4e7eb] border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="text-right flex-1">
                          <div className="text-xs sm:text-sm font-quran font-bold">{r.name}</div>
                          <div className="text-[10px] text-stone-500">{r.subtext}</div>
                        </div>
                        {isSel && <Check className="w-4 h-4 text-teal-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Screen 7: Sleep Timer */}
            {currentScreen === 'sleeptimer' && (
              <div className="space-y-3 flex-1 py-2">
                <div className="text-center pb-1">
                  <h3 className="font-bold text-stone-800 text-sm font-quran">مؤقت النوم لإيقاف التلاوة</h3>
                  <p className="text-xs text-stone-500">يتوقف الصوت تلقائياً بعد انقضاء الوقت</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setSleepTimerMinutes(mins);
                        setCurrentScreen('player');
                        triggerHaptic('light');
                      }}
                      className={`p-3 rounded-xl border text-center ${
                        sleepTimerMinutes === mins ? 'bg-teal-600 text-white font-bold' : 'bg-[#e4e7eb] text-stone-800'
                      }`}
                    >
                      <div className="text-xs sm:text-sm">{toArabicNumeral(mins)} دقيقة</div>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setSleepTimerMinutes(null);
                      setCurrentScreen('player');
                      triggerHaptic('light');
                    }}
                    className="p-3 rounded-xl border text-center bg-stone-800 text-white font-bold"
                  >
                    إلغاء المؤقت
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Reminder */}
            <div className="pt-3 border-t border-stone-200/80 mt-2 text-center">
              <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
                <Headphones className="w-3.5 h-3.5 text-[#14959d]" />
                <span>إستعمل سماعات الرأس من أجل تجربة رائعة</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
