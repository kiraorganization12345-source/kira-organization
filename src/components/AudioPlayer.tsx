import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Volume1,
  X, 
  Sparkles,
  AlertCircle,
  FileText,
  Music,
  EyeOff,
  Minimize2,
  Maximize2,
  ChevronDown,
  Headphones,
  RotateCcw,
  RotateCw,
  Moon,
  Clock,
  Search,
  Sliders,
  Check,
  Radio,
  Layers,
  BookOpen,
  Flame,
  Info
} from 'lucide-react';
import { Reciter } from '../types';
import { 
  RECITERS, 
  getAyahAudioCandidateUrls, 
  getFullSurahAudioCandidateUrls 
} from '../data/reciters';
import { ALL_SURAHS } from '../data/surahs';
import { toArabicNumeral, removeTashkeel } from '../services/quranApi';
import quranBrandIcon from '../assets/images/quran_brand_icon_1786468911622.jpg';

export interface PlayingTarget {
  surahId: number;
  ayahNum: number;
  mode?: 'verse' | 'surah';
}

export interface AudioPlayerProps {
  currentPlaying: PlayingTarget | null;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onClose: () => void;
  selectedReciter: Reciter;
  setSelectedReciter: (r: Reciter) => void;
  onTogglePlayMode?: (mode: 'verse' | 'surah') => void;
  isAudioBarHidden?: boolean;
  onToggleAudioBarHidden?: (hidden: boolean) => void;
  onAudioTimeProgress?: (surahId: number, ayahNum: number, currentTime: number, duration: number) => void;
}

const formatAudioTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentPlaying,
  onNextAyah,
  onPrevAyah,
  onClose,
  selectedReciter,
  setSelectedReciter,
  onTogglePlayMode,
  isAudioBarHidden = false,
  onToggleAudioBarHidden,
  onAudioTimeProgress
}) => {
  // Playback & Sound State
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<number>(1); // 1 = once, 3, 5, 10, 99 = infinite loop
  const [repeatCount, setRepeatCount] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBarHiddenInternal, setIsBarHiddenInternal] = useState(isAudioBarHidden);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Advanced Professional Modals & Popovers
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [isReciterModalOpen, setIsReciterModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isVolumePopoverOpen, setIsVolumePopoverOpen] = useState(false);
  const [isSpeedPopoverOpen, setIsSpeedPopoverOpen] = useState(false);

  // Reciter Picker Search & Filters
  const [reciterSearch, setReciterSearch] = useState('');
  const [reciterStyleFilter, setReciterStyleFilter] = useState<string>('all');

  // Sleep Timer (in minutes or 'surah')
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState<number | null>(null);

  // Audio HTML Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerIntervalRef = useRef<any>(null);

  const isBarHidden = onToggleAudioBarHidden ? isAudioBarHidden : isBarHiddenInternal;

  const setBarHidden = (hidden: boolean) => {
    setIsBarHiddenInternal(hidden);
    if (onToggleAudioBarHidden) {
      onToggleAudioBarHidden(hidden);
    }
  };

  const playMode = currentPlaying?.mode || 'verse';

  const repeatCountRef = useRef(repeatCount);
  repeatCountRef.current = repeatCount;

  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;

  const candidateIndexRef = useRef(candidateIndex);
  candidateIndexRef.current = candidateIndex;

  const onNextAyahRef = useRef(onNextAyah);
  onNextAyahRef.current = onNextAyah;

  const onAudioTimeProgressRef = useRef(onAudioTimeProgress);
  onAudioTimeProgressRef.current = onAudioTimeProgress;

  const currentSurah = currentPlaying ? ALL_SURAHS.find(s => s.id === currentPlaying.surahId) : null;

  // Reset fallback candidate index when target verse, surah, reciter, or mode changes
  useEffect(() => {
    setCandidateIndex(0);
    setAudioError(null);
    setRepeatCount(0);
  }, [currentPlaying?.surahId, currentPlaying?.ayahNum, selectedReciter.id, playMode]);

  // Audio candidate URLs (Ayah-by-Ayah or Full Surah)
  const candidateUrls = currentPlaying
    ? (playMode === 'surah'
        ? getFullSurahAudioCandidateUrls(selectedReciter.id, currentPlaying.surahId)
        : getAyahAudioCandidateUrls(selectedReciter.id, currentPlaying.surahId, currentPlaying.ayahNum))
    : [];

  const candidateUrlsRef = useRef(candidateUrls);
  candidateUrlsRef.current = candidateUrls;

  const audioUrl = candidateUrls[candidateIndex] || candidateUrls[0] || '';

  // Background preload of the next verse audio to eliminate latency and ensure smooth recitation
  useEffect(() => {
    if (!currentPlaying || playMode === 'surah') return;

    const currentSurahMeta = ALL_SURAHS.find(s => s.id === currentPlaying.surahId);
    if (!currentSurahMeta) return;

    let nextSurahId = currentPlaying.surahId;
    let nextAyahNum = currentPlaying.ayahNum + 1;

    if (nextAyahNum > currentSurahMeta.versesCount) {
      if (nextSurahId < 114) {
        nextSurahId += 1;
        nextAyahNum = 1;
      } else {
        return;
      }
    }

    const nextCandidates = getAyahAudioCandidateUrls(selectedReciter.id, nextSurahId, nextAyahNum);
    if (nextCandidates.length > 0) {
      const preloadTag = new Audio();
      preloadTag.src = nextCandidates[0];
      preloadTag.preload = 'auto';
    }
  }, [currentPlaying?.surahId, currentPlaying?.ayahNum, selectedReciter.id, playMode]);

  // Setup Audio instance and handlers
  useEffect(() => {
    if (!audioUrl) return;

    let isSubscribed = true;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    // Pause previous playback before updating source
    audio.pause();
    audio.src = audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    const handleLoadedMetadata = () => {
      if (!isSubscribed) return;
      setDuration(audio.duration || 0);
      setAudioError(null);
    };

    const handleTimeUpdate = () => {
      if (!isSubscribed) return;
      const curr = audio.currentTime || 0;
      const dur = audio.duration || 0;
      setCurrentTime(curr);

      if (dur > 0 && currentPlaying && currentPlaying.mode === 'surah' && onAudioTimeProgressRef.current) {
        const currentSurahMeta = ALL_SURAHS.find(s => s.id === currentPlaying.surahId);
        if (currentSurahMeta && currentSurahMeta.versesCount > 0) {
          const ratio = Math.min(0.999, Math.max(0, curr / dur));
          const estAyah = Math.min(
            currentSurahMeta.versesCount,
            Math.max(1, Math.floor(ratio * currentSurahMeta.versesCount) + 1)
          );
          onAudioTimeProgressRef.current(currentPlaying.surahId, estAyah, curr, dur);
        }
      }
    };

    const handleEnded = () => {
      if (!isSubscribed) return;
      const nextCount = repeatCountRef.current + 1;
      if (repeatModeRef.current === 99 || nextCount < repeatModeRef.current) {
        setRepeatCount(nextCount);
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setRepeatCount(0);
        onNextAyahRef.current();
      }
    };

    const handleError = () => {
      if (!isSubscribed) return;
      console.warn(`Audio load failed for candidate ${candidateIndexRef.current}: ${audioUrl}`);
      const nextIndex = candidateIndexRef.current + 1;
      if (nextIndex < candidateUrlsRef.current.length) {
        setCandidateIndex(nextIndex);
      } else {
        // Universal mirror fallback to Alafasy
        const fallbackUrls = currentPlaying ? getAyahAudioCandidateUrls('Alafasy_128kbps', currentPlaying.surahId, currentPlaying.ayahNum) : [];
        if (fallbackUrls.length > 0 && selectedReciter.id !== 'Alafasy_128kbps') {
          audio.src = fallbackUrls[0];
          audio.play().catch(() => {});
        } else {
          const modeLabel = playMode === 'surah' ? 'التسجيل المتصل للسورة' : 'التلاوة بآية بآية';
          setAudioError(`${modeLabel} غير متوفر حالياً بصوت (${selectedReciter.name}). جاري الانتقال للآية التالية...`);
          setTimeout(() => {
            if (isSubscribed) onNextAyahRef.current();
          }, 2500);
        }
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (isSubscribed) {
            setIsPlaying(true);
            setAudioError(null);
          }
        })
        .catch((err) => {
          if (!isSubscribed) return;
          if (err.name === 'NotAllowedError') {
            setIsPlaying(false);
          } else {
            const nextIndex = candidateIndexRef.current + 1;
            if (nextIndex < candidateUrlsRef.current.length) {
              setCandidateIndex(nextIndex);
            }
          }
        });
    }

    return () => {
      isSubscribed = false;
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Change Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setIsSpeedPopoverOpen(false);
  };

  // Skip 10 Seconds Forward / Backward
  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(duration, Math.max(0, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  // Mute / Unmute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.8;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (sleepSecondsLeft === null) {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      return;
    }

    if (sleepSecondsLeft <= 0) {
      // Time is up! Gently pause audio and clean up
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setSleepTimerMinutes(null);
      setSleepSecondsLeft(null);
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      return;
    }

    sleepTimerIntervalRef.current = setInterval(() => {
      setSleepSecondsLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepSecondsLeft]);

  // Set Sleep Timer Handler
  const handleSetSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepSecondsLeft(null);
    } else {
      setSleepSecondsLeft(minutes * 60);
    }
    setIsSleepModalOpen(false);
  };

  // Filtered Reciters for the Reciter Picker
  const filteredReciters = RECITERS.filter(r => {
    const matchesSearch = !reciterSearch.trim() || 
      removeTashkeel(r.name).toLowerCase().includes(removeTashkeel(reciterSearch).toLowerCase()) ||
      (r.subtext && removeTashkeel(r.subtext).toLowerCase().includes(removeTashkeel(reciterSearch).toLowerCase()));

    const matchesStyle = reciterStyleFilter === 'all' || 
      (reciterStyleFilter === 'murattal' && (r.style === 'مرتل' || !r.style)) ||
      (reciterStyleFilter === 'mujawwad' && r.style === 'مجود') ||
      (reciterStyleFilter === 'muallim' && r.style === 'معلم');

    return matchesSearch && matchesStyle;
  });

  if (!currentPlaying || !currentSurah) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING MINI-PLAYER WIDGET (عند تصغير الشريط للاستماع في الخلفية)      */}
      {/* ========================================================================= */}
      {isBarHidden && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 animate-fadeIn" dir="rtl">
          <div className="bg-stone-950/95 text-stone-100 border border-amber-500/50 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-[0_15px_40px_rgba(0,0,0,0.85)] ring-1 ring-amber-400/30 backdrop-blur-2xl flex items-center gap-2.5 sm:gap-3">
            
            {/* Pulsing Audio Artwork / Icon */}
            <div 
              onClick={() => setBarHidden(false)}
              className="relative w-10 h-10 rounded-xl overflow-hidden bg-stone-900 border border-amber-500/60 flex items-center justify-center cursor-pointer group shrink-0"
              title="انقر لفتح شريط المشغل الكامل"
            >
              <img 
                src={quranBrandIcon} 
                alt="شعار القرآن" 
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'rotate-6 scale-110' : ''}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Headphones className="w-4 h-4 text-amber-300" />
              </div>
              {isPlaying && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            {/* Surah & Reciter Info */}
            <div 
              onClick={() => setBarHidden(false)}
              className="cursor-pointer max-w-[130px] sm:max-w-[180px] text-right"
              title="انقر لتوسيع المشغل"
            >
              <div className="text-xs font-bold text-amber-200 truncate font-quran flex items-center gap-1">
                <span>سورة {currentSurah.name}</span>
                {playMode === 'verse' && (
                  <span className="text-[10px] text-amber-400/90 font-mono">({toArabicNumeral(currentPlaying.ayahNum)})</span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 truncate flex items-center gap-1 mt-0.5">
                <span>{selectedReciter.name}</span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5 mr-1 h-2.5">
                    <span className="w-0.5 h-1.5 bg-amber-400 animate-pulse" />
                    <span className="w-0.5 h-2.5 bg-amber-400 animate-pulse delay-75" />
                    <span className="w-0.5 h-1 bg-amber-400 animate-pulse delay-150" />
                  </span>
                )}
              </div>
            </div>

            {/* Quick Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex items-center justify-center active:scale-95 hover:scale-105 transition-transform shadow-md shrink-0"
              title={isPlaying ? 'إيقاف مؤقت' : 'استئناف'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-stone-950" /> : <Play className="w-4 h-4 fill-stone-950 ml-0.5" />}
            </button>

            {/* Next Verse */}
            <button
              onClick={onNextAyah}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-200 hover:bg-stone-850 transition-colors shrink-0"
              title="الآية التالية"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Expand to Full Dock */}
            <button
              onClick={() => setBarHidden(false)}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 border border-stone-800 transition-colors shrink-0"
              title="إظهار الشريط الكامل"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Stop & Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-800 transition-colors shrink-0"
              title="إيقاف التلاوة وإغلاق"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LUXURY FLOATING AUDIO DOCK (شريط المشغل الفاخر المطور)                   */}
      {/* ========================================================================= */}
      <div 
        dir="rtl"
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 p-2 sm:p-4 pointer-events-none ${
          isBarHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="max-w-6xl mx-auto pointer-events-auto">
          
          <div className="relative rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-stone-950/95 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-amber-400/20 px-3 sm:px-5 py-3 transition-all">
            
            {/* Golden top progress track line */}
            <div className="absolute top-0 left-4 right-4 h-1 bg-stone-800/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
              
              {/* Left Column: Reciter, Surah Calligraphy & Animated Visualizer */}
              <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-3">
                
                <div className="flex items-center gap-3">
                  
                  {/* Ornate Rotating Disc */}
                  <div 
                    onClick={() => setIsTheaterOpen(true)}
                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-amber-500/50 p-0.5 bg-gradient-to-tr from-amber-950 to-stone-900 shadow-md shadow-amber-500/20 cursor-pointer group shrink-0"
                    title="فتح شاشة الاستماع والتدبر المكبرة (Theater Mode)"
                  >
                    <img 
                      src={quranBrandIcon} 
                      alt="شعار التلاوة" 
                      className={`w-full h-full object-cover rounded-xl transition-transform duration-1000 ${
                        isPlaying ? 'scale-105 rotate-12' : 'group-hover:scale-105'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold font-quran text-base sm:text-lg text-amber-200 flex items-center gap-1.5">
                        <span>سُورَةُ {currentSurah.name}</span>
                        {playMode === 'verse' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                            ﴿ الآية {toArabicNumeral(currentPlaying.ayahNum)} ﴾
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            السورة كاملة
                          </span>
                        )}
                      </h4>

                      {/* Repetition indicator if repeating */}
                      {repeatMode > 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          <span>تكرار {repeatCount + 1}/{repeatMode === 99 ? '∞' : repeatMode}</span>
                        </span>
                      )}

                      {/* Sleep timer remaining pill */}
                      {sleepSecondsLeft !== null && sleepSecondsLeft > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-bold font-mono flex items-center gap-1">
                          <Moon className="w-3 h-3 text-indigo-400 animate-pulse" />
                          <span>{formatAudioTime(sleepSecondsLeft)}</span>
                        </span>
                      )}
                    </div>

                    {/* Reciter Selector Trigger & Equalizer */}
                    <div className="flex items-center gap-2.5 mt-0.5 text-xs">
                      <button
                        onClick={() => setIsReciterModalOpen(true)}
                        className="text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1 font-bold group"
                        title="تغيير القارئ والرواية"
                      >
                        <span className="text-stone-400 font-normal">القارئ:</span>
                        <span className="underline decoration-amber-500/40 underline-offset-4">{selectedReciter.name}</span>
                        <ChevronDown className="w-3 h-3 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                      </button>

                      {/* Animated frequency equalizer bars */}
                      {isPlaying && (
                        <div className="flex items-end gap-0.5 h-3.5 px-1.5 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                          <span className="w-0.5 bg-amber-400 animate-pulse h-2" />
                          <span className="w-0.5 bg-amber-300 animate-pulse h-3.5 delay-100" />
                          <span className="w-0.5 bg-amber-400 animate-pulse h-1.5 delay-200" />
                          <span className="w-0.5 bg-amber-300 animate-pulse h-3 delay-75" />
                          <span className="w-0.5 bg-amber-400 animate-pulse h-2 delay-150" />
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* Mobile Quick Action Buttons: Minimize & Close */}
                <div className="flex md:hidden items-center gap-1.5">
                  <button
                    onClick={() => setIsTheaterOpen(true)}
                    className="p-2 rounded-xl bg-stone-900 text-amber-300 border border-stone-800"
                    title="الوضع المسرحي المكبر"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBarHidden(true)}
                    className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-amber-200 border border-stone-800"
                    title="إخفاء للشريط المصغر"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-red-400 border border-stone-800"
                    title="إغلاق التلاوة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Center Column: Interactive Controls & Timeline */}
              <div className="flex flex-col items-center gap-1.5 w-full md:w-5/12 lg:w-4/12">
                
                {/* Control Buttons Group */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                  
                  {/* Repeat Mode Cycle */}
                  <button
                    onClick={() => {
                      const modes = [1, 3, 5, 10, 99];
                      const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
                      setRepeatMode(modes[nextIdx]);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                      repeatMode > 1
                        ? 'bg-amber-500 text-stone-950 shadow-md ring-1 ring-amber-400'
                        : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                    }`}
                    title="تكرار الآية للحفظ والتدبر"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{repeatMode === 99 ? '∞' : repeatMode === 1 ? '1x' : `${repeatMode}x`}</span>
                  </button>

                  {/* 10s Backward */}
                  <button
                    onClick={() => seekRelative(-10)}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-200 border border-stone-800 flex items-center justify-center active:scale-95"
                    title="رجوع 10 ثوانٍ"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Previous Verse / Surah */}
                  <button
                    onClick={onPrevAyah}
                    className="p-2.5 rounded-full hover:bg-stone-850 text-stone-300 hover:text-white flex items-center justify-center active:scale-95"
                    title={playMode === 'surah' ? 'السورة السابقة' : 'الآية السابقة'}
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Center Main Play / Pause Button */}
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all ring-2 ring-amber-400/50 shrink-0"
                    title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-stone-950" />
                    ) : (
                      <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
                    )}
                  </button>

                  {/* Next Verse / Surah */}
                  <button
                    onClick={onNextAyah}
                    className="p-2.5 rounded-full hover:bg-stone-850 text-stone-300 hover:text-white flex items-center justify-center active:scale-95"
                    title={playMode === 'surah' ? 'السورة التالية' : 'الآية التالية'}
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* 10s Forward */}
                  <button
                    onClick={() => seekRelative(10)}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-200 border border-stone-800 flex items-center justify-center active:scale-95"
                    title="تقديم 10 ثوانٍ"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Play Mode: Verse vs Surah Toggle */}
                  {onTogglePlayMode && (
                    <button
                      onClick={() => onTogglePlayMode(playMode === 'verse' ? 'surah' : 'verse')}
                      className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 border border-stone-800 text-xs font-bold flex items-center gap-1 active:scale-95"
                      title={playMode === 'verse' ? 'التحويل للاستماع للسورة كاملة متصلة' : 'التحويل للاستماع آية بآية'}
                    >
                      {playMode === 'verse' ? <FileText className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{playMode === 'verse' ? 'آية' : 'سورة'}</span>
                    </button>
                  )}

                </div>

                {/* Smooth Custom Timeline Track */}
                <div className="w-full flex items-center gap-2.5 text-xs text-stone-400 font-mono dir-ltr select-none">
                  <span className="w-10 text-right text-[11px] text-stone-300">{formatAudioTime(currentTime)}</span>
                  <div className="relative flex-1 group py-1.5 flex items-center cursor-pointer">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => {
                        const newT = Number(e.target.value);
                        if (audioRef.current) {
                          audioRef.current.currentTime = newT;
                          setCurrentTime(newT);
                        }
                      }}
                      className="w-full h-1.5 bg-stone-800 accent-amber-400 rounded-lg cursor-pointer transition-all group-hover:h-2"
                    />
                  </div>
                  <span className="w-10 text-left text-[11px] text-stone-500">{formatAudioTime(duration)}</span>
                </div>

              </div>

              {/* Right Column: Speed, Sleep Timer, Volume, Theater & Close (Desktop) */}
              <div className="hidden md:flex items-center gap-2">
                
                {/* Speed Toggle */}
                <button
                  onClick={() => {
                    const speeds = [0.75, 1, 1.25, 1.5];
                    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
                    handleSpeedChange(speeds[nextIdx]);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 border border-stone-800 text-xs font-bold transition-all active:scale-95"
                  title="تغيير سرعة التلاوة"
                >
                  {playbackRate}x
                </button>

                {/* Sleep Timer Trigger */}
                <button
                  onClick={() => setIsSleepModalOpen(true)}
                  className={`p-2 rounded-xl transition-all active:scale-95 text-xs flex items-center gap-1 ${
                    sleepSecondsLeft !== null
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-amber-200 border border-stone-800'
                  }`}
                  title="مؤقت النوم الإيماني"
                >
                  <Moon className="w-4 h-4" />
                </button>

                {/* Volume Slider Popover */}
                <div className="relative">
                  <button
                    onClick={toggleMute}
                    onMouseEnter={() => setIsVolumePopoverOpen(true)}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors"
                    title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    )}
                  </button>

                  {/* Volume Slider Flyout */}
                  {isVolumePopoverOpen && (
                    <div 
                      onMouseLeave={() => setIsVolumePopoverOpen(false)}
                      className="absolute bottom-12 left-1/2 -translate-x-1/2 p-3 bg-stone-900/95 border border-amber-500/40 rounded-2xl shadow-xl backdrop-blur-xl flex flex-col items-center gap-2 z-50 animate-fadeIn"
                    >
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="h-20 -rotate-90 my-6 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Theater / Fullscreen Mode */}
                <button
                  onClick={() => setIsTheaterOpen(true)}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 hover:text-amber-200 border border-stone-800 hover:border-amber-500/40 transition-all active:scale-95"
                  title="توسيع للوضع المسرحي الفاخر"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Hide to Mini Pill */}
                <button
                  onClick={() => setBarHidden(true)}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-amber-200 border border-stone-800 transition-colors"
                  title="تصغير الشريط في الخلفية"
                >
                  <EyeOff className="w-4 h-4" />
                </button>

                {/* Stop & Close Completely */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-500/40 transition-colors"
                  title="إيقاف التلاوة وإغلاق المشغل"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* Error Notification Banner if fallback happens */}
            {audioError && (
              <div className="mt-2 p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{audioError}</span>
                </div>
                <button onClick={() => setAudioError(null)} className="text-stone-400 hover:text-white text-xs">✕</button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LUXURY THEATER / FULLSCREEN PLAYER MODAL (شاشة الاستماع والتدبر المكبرة) */}
      {/* ========================================================================= */}
      {isTheaterOpen && (
        <div 
          dir="rtl"
          className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-2xl text-stone-100 flex flex-col justify-between p-4 sm:p-8 animate-fadeIn"
        >
          {/* Header of Theater */}
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full pb-4 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Headphones className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold font-quran text-base text-amber-200">وضع الاستماع والتدبر القرآني</h3>
                <p className="text-[11px] text-stone-400">تلاوة خاشعة بصوت {selectedReciter.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reciter Button inside theater */}
              <button
                onClick={() => setIsReciterModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-amber-300 border border-stone-800 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>تغيير القارئ</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Close Theater Button */}
              <button
                onClick={() => setIsTheaterOpen(false)}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors"
                title="العودة للشريط السفلي"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Stage: Surah Ornate Medallion & Calligraphy */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full my-6 text-center space-y-6">
            
            {/* Medallion Card */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-600/20 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
              
              <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full border-4 border-amber-500/40 bg-stone-900/90 shadow-2xl flex flex-col items-center justify-center p-4 ring-8 ring-amber-500/10">
                <span className="text-amber-400/80 text-xs font-quran mb-1">سُورَة</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-quran text-amber-200 tracking-wide">
                  {currentSurah.name}
                </h2>
                
                {playMode === 'verse' ? (
                  <div className="mt-2 text-sm px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                    ﴿ الآية {toArabicNumeral(currentPlaying.ayahNum)} ﴾
                  </div>
                ) : (
                  <div className="mt-2 text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    تلاوة السورة كاملة
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 text-[11px] text-stone-400">
                  <span>{currentSurah.revelationType === 'Meccan' ? 'مكية 🕋' : 'مدنية 🕌'}</span>
                  <span>•</span>
                  <span>{currentSurah.versesCount} آية</span>
                  <span>•</span>
                  <span>جزء {currentSurah.juz}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Simulated Waveform Spectrum */}
            <div className="w-full flex items-center justify-center gap-1 sm:gap-1.5 h-12 px-4">
              {Array.from({ length: 28 }).map((_, i) => {
                const isActive = isPlaying;
                // Generate alternating rhythmic heights
                const heightMod = ((i * 7) % 10) + 2;
                return (
                  <div
                    key={i}
                    className={`w-1 sm:w-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-t from-amber-500 to-amber-300 animate-pulse'
                        : 'bg-stone-800'
                    }`}
                    style={{
                      height: isActive ? `${heightMod * 3.5}px` : '6px',
                      animationDelay: `${(i % 5) * 100}ms`
                    }}
                  />
                );
              })}
            </div>

          </div>

          {/* Bottom Stage: Big Controls & Timeline in Theater */}
          <div className="max-w-2xl mx-auto w-full space-y-4 pb-4">
            
            {/* Timeline Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const newT = Number(e.target.value);
                  if (audioRef.current) {
                    audioRef.current.currentTime = newT;
                    setCurrentTime(newT);
                  }
                }}
                className="w-full h-2 bg-stone-800 accent-amber-400 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 font-mono dir-ltr">
                <span>{formatAudioTime(currentTime)}</span>
                <span>{formatAudioTime(duration)}</span>
              </div>
            </div>

            {/* Big Controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              
              {/* Repeat Mode */}
              <button
                onClick={() => {
                  const modes = [1, 3, 5, 10, 99];
                  const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
                  setRepeatMode(modes[nextIdx]);
                }}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  repeatMode > 1 ? 'bg-amber-500 text-stone-950 shadow-lg' : 'bg-stone-900 text-stone-400 border border-stone-800'
                }`}
                title="تكرار الآية للحفظ"
              >
                <Repeat className="w-4 h-4" />
                <span>{repeatMode === 99 ? 'دائم' : `${repeatMode}x`}</span>
              </button>

              {/* 10s back */}
              <button
                onClick={() => seekRelative(-10)}
                className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800"
                title="رجوع 10 ثوانٍ"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Prev */}
              <button
                onClick={onPrevAyah}
                className="p-3.5 rounded-full hover:bg-stone-850 text-stone-200 hover:text-white active:scale-95"
                title="السابق"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              {/* Big Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-stone-950 flex items-center justify-center shadow-xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all ring-4 ring-amber-400/40"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-stone-950" />
                ) : (
                  <Play className="w-8 h-8 fill-stone-950 ml-1" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNextAyah}
                className="p-3.5 rounded-full hover:bg-stone-850 text-stone-200 hover:text-white active:scale-95"
                title="التالي"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              {/* 10s forward */}
              <button
                onClick={() => seekRelative(10)}
                className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800"
                title="تقديم 10 ثوانٍ"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Sleep timer button in theater */}
              <button
                onClick={() => setIsSleepModalOpen(true)}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  sleepSecondsLeft !== null ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50' : 'bg-stone-900 text-stone-400 border border-stone-800'
                }`}
                title="مؤقت النوم"
              >
                <Moon className="w-4 h-4" />
                {sleepSecondsLeft !== null && <span>{formatAudioTime(sleepSecondsLeft)}</span>}
              </button>

            </div>

            {/* Quick Speed Selector Pills in Theater */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs">
              <span className="text-stone-500 font-bold ml-2">سرعة القراءة:</span>
              {[0.75, 1, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    playbackRate === s
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PROFESSIONAL RECITER SELECTOR MODAL (نافذة اختيار القارئ والرواية)     */}
      {/* ========================================================================= */}
      {isReciterModalOpen && (
        <div 
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div className="bg-stone-950 border border-amber-500/40 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Radio className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-200 font-quran">اختر القارئ والتلاوة</h3>
                  <p className="text-xs text-stone-400">نخبة من كبار قراء العالم الإسلامي مع مختلف الروايات</p>
                </div>
              </div>
              <button
                onClick={() => setIsReciterModalOpen(false)}
                className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Style Filter */}
            <div className="p-3 sm:p-4 border-b border-stone-850 space-y-3 bg-stone-900/40">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم الشيخ (مثال: عبد الباسط، المنشاوي، رفعت...)"
                  value={reciterSearch}
                  onChange={(e) => setReciterSearch(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700/80 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {reciterSearch && (
                  <button 
                    onClick={() => setReciterSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Style Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
                {[
                  { id: 'all', label: 'جميع القراء' },
                  { id: 'murattal', label: 'مرتل خاشع' },
                  { id: 'mujawwad', label: 'مجود متقن' },
                  { id: 'muallim', label: 'مصحف معلم' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setReciterStyleFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                      reciterStyleFilter === st.id
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Reciters List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {filteredReciters.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  لا يوجد قراء يطابقون بحثك "{reciterSearch}"
                </div>
              ) : (
                filteredReciters.map((r) => {
                  const isSelected = selectedReciter.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedReciter(r);
                        setIsReciterModalOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/80 text-amber-100 shadow-sm ring-1 ring-amber-500/40'
                          : 'bg-stone-900/60 hover:bg-stone-850 border-stone-800 text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-amber-300'
                        }`}>
                          {r.name.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-sm font-quran text-amber-100 group-hover:text-amber-200">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {r.subtext || 'حفص عن عاصم'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.style && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700 font-bold">
                            {r.style}
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-850 bg-stone-900/40 flex items-center justify-between text-xs text-stone-400">
              <span>القراء المتاحون: {filteredReciters.length}</span>
              <button 
                onClick={() => setIsReciterModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SLEEP TIMER MODAL (مؤقت النوم الإيماني لإيقاف التلاوة بعد مدة)         */}
      {/* ========================================================================= */}
      {isSleepModalOpen && (
        <div 
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div className="bg-stone-950 border border-indigo-500/40 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Moon className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-indigo-200 font-quran">مؤقت النوم الإيماني</h3>
                  <p className="text-[11px] text-stone-400">إيقاف التلاوة بهدوء بعد انتهاء المدة</p>
                </div>
              </div>
              <button
                onClick={() => setIsSleepModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-900 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Timer Status */}
            {sleepSecondsLeft !== null && sleepSecondsLeft > 0 ? (
              <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-center space-y-1">
                <div className="text-xs text-indigo-300">المؤقت نشط حالياً:</div>
                <div className="text-2xl font-mono font-bold text-indigo-100">
                  {formatAudioTime(sleepSecondsLeft)}
                </div>
                <button
                  onClick={() => handleSetSleepTimer(null)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline font-bold"
                >
                  إلغاء المؤقت الحالي
                </button>
              </div>
            ) : null}

            {/* Duration Options */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '15 دقيقة', min: 15 },
                { label: '30 دقيقة', min: 30 },
                { label: '45 دقيقة', min: 45 },
                { label: '60 دقيقة', min: 60 },
              ].map((opt) => (
                <button
                  key={opt.min}
                  onClick={() => handleSetSleepTimer(opt.min)}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                    sleepTimerMinutes === opt.min
                      ? 'bg-indigo-500 text-stone-950 shadow-md ring-2 ring-indigo-400'
                      : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSetSleepTimer(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-white text-xs font-bold transition-colors"
            >
              إيقاف المؤقت (تشغيل مستمر)
            </button>

          </div>
        </div>
      )}

    </>
  );
};
