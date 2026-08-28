import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles,
  AlertCircle,
  FileText,
  Music,
  EyeOff,
  Eye,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Headphones
} from 'lucide-react';
import { Reciter } from '../types';
import { 
  RECITERS, 
  getAyahAudioCandidateUrls, 
  getFullSurahAudioCandidateUrls 
} from '../data/reciters';
import { ALL_SURAHS } from '../data/surahs';
import { toArabicNumeral } from '../services/quranApi';
import quranBrandIcon from '../assets/images/quran_brand_icon_1786468911622.jpg';

export interface PlayingTarget {
  surahId: number;
  ayahNum: number;
  mode?: 'verse' | 'surah';
}

interface AudioPlayerProps {
  currentPlaying: PlayingTarget | null;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onClose: () => void;
  selectedReciter: Reciter;
  setSelectedReciter: (r: Reciter) => void;
  onTogglePlayMode?: (mode: 'verse' | 'surah') => void;
  isAudioBarHidden?: boolean;
  onToggleAudioBarHidden?: (hidden: boolean) => void;
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
  onToggleAudioBarHidden
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<number>(1); // 1 = once then next, 3 = 3 times, 5 = 5 times, 99 = infinite
  const [repeatCount, setRepeatCount] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBarHiddenInternal, setIsBarHiddenInternal] = useState(isAudioBarHidden);
  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const currentSurah = currentPlaying ? ALL_SURAHS.find(s => s.id === currentPlaying.surahId) : null;

  // Reset fallback candidate index when verse, surah, reciter, or mode changes
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

  // Background preload of the next verse audio to eliminate latency and prevent recitation disconnection
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
      setCurrentTime(audio.currentTime || 0);
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
        // As a safeguard, try fallback to Alafasy or notify
        const fallbackUrls = currentPlaying ? getAyahAudioCandidateUrls('Alafasy_128kbps', currentPlaying.surahId, currentPlaying.ayahNum) : [];
        if (fallbackUrls.length > 0 && selectedReciter.id !== 'Alafasy_128kbps') {
          console.log('Falling back to universal audio mirror...');
          audio.src = fallbackUrls[0];
          audio.play().catch(() => {});
        } else {
          const modeLabel = playMode === 'surah' ? 'التسجيل المتصل للسورة' : 'التلاوة بآية بآية';
          setAudioError(`${modeLabel} غير متوفر حالياً بصوت القارئ (${selectedReciter.name}). جاري المتابعة...`);
          // Auto advance after 2 seconds to not break flow if single verse missing
          setTimeout(() => {
            if (isSubscribed) onNextAyahRef.current();
          }, 2000);
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
          console.warn('Auto play attempt error:', err);
          const nextIndex = candidateIndexRef.current + 1;
          if (nextIndex < candidateUrlsRef.current.length) {
            setCandidateIndex(nextIndex);
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

  // Handle Play/Pause
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
  };

  if (!currentPlaying || !currentSurah) return null;

  return (
    <>
      {/* Floating Mini Background-Listening Widget when Player Bar is Minimized/Hidden */}
      {isBarHidden && (
        <div className="fixed bottom-4 right-4 sm:right-6 z-50 animate-bounce-subtle">
          <div className="bg-black/95 text-stone-100 border border-amber-500/50 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black backdrop-blur-xl flex items-center gap-3">
            
            {/* Pulsing Audio Waves / Equalizer animation */}
            <div 
              onClick={() => setBarHidden(false)}
              className="flex items-center gap-2 cursor-pointer group"
              title="انقر لاستعادة شريط المشغل الكامل"
            >
              <div className="relative w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Headphones className="w-5 h-5 animate-pulse" />
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-ping" />
                )}
              </div>

              <div className="max-w-[140px] sm:max-w-[200px]">
                <div className="text-xs font-bold text-amber-200 truncate font-quran">
                  {playMode === 'surah' ? `سُورَةُ ${currentSurah.name}` : `سُورَةُ ${currentSurah.name} (${toArabicNumeral(currentPlaying.ayahNum)})`}
                </div>
                <div className="text-[10px] text-stone-400 truncate flex items-center gap-1">
                  <span>{selectedReciter.name}</span>
                  <span className="text-amber-400/80">• جاري في الخلفية</span>
                </div>
              </div>
            </div>

            {/* Quick Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center hover:scale-105 transition-transform shadow-md"
              title={isPlaying ? 'إيقاف مؤقت' : 'استئناف'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-stone-950" /> : <Play className="w-4 h-4 fill-stone-950 ml-0.5" />}
            </button>

            {/* Restore Full Player Bar */}
            <button
              onClick={() => setBarHidden(false)}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 hover:border-amber-500/40 transition-colors"
              title="إظهار شريط المشغل الكامل"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Stop Audio Completely */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors"
              title="إيقاف التلاوة وإغلاق الصوت نهائياً"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

      {/* Main Bottom Audio Player Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/95 text-stone-100 border-t border-amber-500/30 backdrop-blur-2xl shadow-2xl shadow-black transition-all duration-300 p-3 sm:p-4 ${
        isBarHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Reciter & Verse/Surah Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black border border-amber-400/80 overflow-hidden shadow-lg shadow-amber-500/20 shrink-0">
                <img 
                  src={quranBrandIcon} 
                  alt="شعار القرآن الكريم" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold font-quran text-lg text-amber-200">
                    {playMode === 'surah' ? (
                      <span>تلاوة سُورَةُ {currentSurah.name} كاملة</span>
                    ) : (
                      <span>سُورَةُ {currentSurah.name} - الآية {toArabicNumeral(currentPlaying.ayahNum)}</span>
                    )}
                  </h4>
                  {selectedReciter.id.includes('Refaat') && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-sans font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      الشيخ محمد رفعت
                    </span>
                  )}
                  {selectedReciter.id.includes('Metwally') && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-sans font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      الشيخ السيد متولي
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span>القارئ: {selectedReciter.name}</span>
                  {selectedReciter.subtext && <span className="text-stone-500">({selectedReciter.subtext})</span>}
                </div>
              </div>
            </div>

            {/* Mobile Actions: Hide to background & Close */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setBarHidden(true)}
                className="p-2 rounded-xl bg-stone-900 text-amber-300 border border-stone-800 hover:bg-stone-800 text-xs flex items-center gap-1"
                title="إخفاء الشريط مع استمرار الصوت في الخلفية"
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-[10px]">إخفاء</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-white"
                title="إيقاف التلاوة وإغلاق المشغل"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {audioError && (
            <div className="w-full bg-amber-950/80 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-xl text-xs flex flex-col sm:flex-row items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{audioError}</span>
              </div>
              {onTogglePlayMode && (
                <button
                  onClick={() => onTogglePlayMode(playMode === 'verse' ? 'surah' : 'verse')}
                  className="px-3 py-1 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 shrink-0"
                >
                  {playMode === 'verse' ? 'تجربة استماع السورة كاملة' : 'تجربة استماع الآيات منفصلة'}
                </button>
              )}
            </div>
          )}

          {/* Center Controls & Timeline */}
          <div className="flex flex-col items-center gap-2 w-full md:w-2/5">
            
            <div className="flex items-center gap-3">
              
              {/* Play Mode Switcher Toggle */}
              {onTogglePlayMode && (
                <div className="flex bg-stone-800 p-0.5 rounded-lg border border-stone-700 text-[11px] font-bold">
                  <button
                    onClick={() => onTogglePlayMode('verse')}
                    className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                      playMode === 'verse' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-white'
                    }`}
                    title="استماع آية بآية"
                  >
                    <FileText className="w-3 h-3" />
                    <span className="hidden sm:inline">آية بآية</span>
                  </button>
                  <button
                    onClick={() => onTogglePlayMode('surah')}
                    className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                      playMode === 'surah' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-white'
                    }`}
                    title="استماع للسورة كاملة متصلة"
                  >
                    <Music className="w-3 h-3" />
                    <span className="hidden sm:inline">السورة كاملة</span>
                  </button>
                </div>
              )}

              {/* Repeat Mode */}
              <button
                onClick={() => {
                  const modes = [1, 3, 5, 99];
                  const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
                  setRepeatMode(modes[nextIdx]);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  repeatMode > 1
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400 hover:text-white'
                }`}
                title="تكرار المقطع"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{repeatMode === 99 ? 'تكرار دائم' : repeatMode === 1 ? 'مرة واحدة' : `${repeatMode}x`}</span>
              </button>

              {/* Prev Ayah / Surah */}
              <button
                onClick={onPrevAyah}
                className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white"
                title={playMode === 'surah' ? 'السورة السابقة' : 'الآية السابقة'}
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-stone-950" /> : <Play className="w-6 h-6 fill-stone-950 ml-0.5" />}
              </button>

              {/* Next Ayah / Surah */}
              <button
                onClick={onNextAyah}
                className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white"
                title={playMode === 'surah' ? 'السورة التالية' : 'الآية التالية'}
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Speed Selector */}
              <div className="flex bg-stone-800 rounded-lg p-0.5 text-xs">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      playbackRate === speed ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

            </div>

            {/* Progress Seek Bar */}
            <div className="w-full flex items-center gap-2 text-xs text-stone-400 font-mono dir-ltr">
              <span>{formatAudioTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Number(e.target.value);
                    setCurrentTime(Number(e.target.value));
                  }
                }}
                className="w-full accent-amber-500 h-1 bg-stone-700 rounded-lg cursor-pointer"
              />
              <span>{formatAudioTime(duration)}</span>
            </div>

          </div>

          {/* Right Reciter Selector, Hide to Background Button & Close (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            
            <select
              value={selectedReciter.id}
              onChange={(e) => {
                const rec = RECITERS.find(r => r.id === e.target.value);
                if (rec) setSelectedReciter(rec);
              }}
              className="bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-amber-200 font-semibold outline-none focus:ring-1 focus:ring-amber-500"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  القارئ: {r.name}
                </option>
              ))}
            </select>

            {/* Hide to Background Button (Keeps Audio Playing!) */}
            <button
              onClick={() => setBarHidden(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/60 transition-all text-xs font-bold shadow-sm"
              title="إخفاء شريط المشغل مع استمرار التلاوة في الخلفية"
            >
              <EyeOff className="w-4 h-4" />
              <span>إخفاء في الخلفية</span>
            </button>

            {/* Close / Stop Audio Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-red-950 text-stone-400 hover:text-red-400 border border-stone-700 hover:border-red-500/40 transition-colors"
              title="إيقاف التلاوة وإغلاق المشغل"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>
      </div>
    </>
  );
};

