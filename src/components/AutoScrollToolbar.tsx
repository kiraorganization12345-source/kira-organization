import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Gauge, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  RotateCcw,
  Volume2,
  Sliders,
  MoveDown,
  MoveUp,
  ChevronsDown,
  ChevronsUp,
  ArrowDown,
  ArrowUp,
  FastForward,
  Rewind,
  Settings2
} from 'lucide-react';
import { toArabicNumeral } from '../services/quranApi';

export type ScrollSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3;

interface AutoScrollToolbarProps {
  isPlayingAudio?: boolean;
  activeAyahElement?: HTMLElement | null;
  onScrollToActiveAyah?: () => void;
  className?: string;
  defaultActive?: boolean;
  onClose?: () => void;
  onPageEndReached?: () => void;
  isImageMode?: boolean;
}

export const AutoScrollToolbar: React.FC<AutoScrollToolbarProps> = ({
  isPlayingAudio = false,
  activeAyahElement,
  onScrollToActiveAyah,
  className = '',
  defaultActive = false,
  onClose,
  onPageEndReached,
  isImageMode = false
}) => {
  const [isActive, setIsActive] = useState<boolean>(defaultActive);
  const [speed, setSpeed] = useState<number>(1);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [isPausedByTouch, setIsPausedByTouch] = useState<boolean>(false);
  const [pauseCountdown, setPauseCountdown] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const endReachedTriggeredRef = useRef<boolean>(false);

  // Speed multiplier to pixels per second
  // At 1x: ~36 pixels per second (comfortable reading pace)
  const getPixelsPerSecond = (s: number): number => {
    return Math.max(8, Math.round(s * 36));
  };

  // Helper to find the actual active scroll container
  const getScrollContainer = (): HTMLElement | Window => {
    const emulatorViewport = document.getElementById('android-app-viewport');
    if (emulatorViewport && emulatorViewport.scrollHeight > emulatorViewport.clientHeight + 10) {
      return emulatorViewport;
    }
    return window;
  };

  // Continuous smooth scrolling via requestAnimationFrame
  useEffect(() => {
    if (!isActive || isPausedByTouch) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const animateScroll = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000; // in seconds
        const basePixels = getPixelsPerSecond(speed) * delta;
        const pixelsToScroll = scrollDirection === 'down' ? basePixels : -basePixels;

        const container = getScrollContainer();

        if (container instanceof HTMLElement) {
          const currentScroll = container.scrollTop;
          const maxScroll = container.scrollHeight - container.clientHeight;

          if (scrollDirection === 'down') {
            if (currentScroll >= maxScroll - 6) {
              if (onPageEndReached && !endReachedTriggeredRef.current) {
                endReachedTriggeredRef.current = true;
                onPageEndReached();
                // Reset trigger after short delay
                setTimeout(() => {
                  endReachedTriggeredRef.current = false;
                }, 2000);
              } else if (!onPageEndReached) {
                setIsActive(false);
                return;
              }
            }
          } else {
            // Scrolling up
            if (currentScroll <= 2) {
              setIsActive(false);
              return;
            }
          }

          container.scrollBy({
            top: pixelsToScroll,
            left: 0,
            behavior: 'auto'
          });
        } else {
          // Window container
          const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
          const currentScroll = window.scrollY || window.pageYOffset;
          const windowHeight = window.innerHeight;

          if (scrollDirection === 'down') {
            if (currentScroll + windowHeight >= scrollHeight - 8) {
              if (onPageEndReached && !endReachedTriggeredRef.current) {
                endReachedTriggeredRef.current = true;
                onPageEndReached();
                setTimeout(() => {
                  endReachedTriggeredRef.current = false;
                }, 2000);
              } else if (!onPageEndReached) {
                setIsActive(false);
                return;
              }
            }
          } else {
            if (currentScroll <= 2) {
              setIsActive(false);
              return;
            }
          }

          window.scrollBy({
            top: pixelsToScroll,
            left: 0,
            behavior: 'auto'
          });
        }
      }

      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animateScroll);
    };

    requestRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive, isPausedByTouch, speed, scrollDirection, onPageEndReached]);

  // Handle user manual touch / wheel / key interaction to pause gracefully
  useEffect(() => {
    if (!isActive) return;

    const handleUserInteraction = () => {
      if (!isActive) return;

      setIsPausedByTouch(true);
      isUserInteractingRef.current = true;
      setPauseCountdown(2);

      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        setPauseCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      pauseTimeoutRef.current = setTimeout(() => {
        setIsPausedByTouch(false);
        isUserInteractingRef.current = false;
        lastTimeRef.current = null;
      }, 2000);
    };

    const container = getScrollContainer();
    const targetElement = container instanceof HTMLElement ? container : window;

    targetElement.addEventListener('wheel', handleUserInteraction, { passive: true });
    targetElement.addEventListener('touchmove', handleUserInteraction, { passive: true });

    return () => {
      targetElement.removeEventListener('wheel', handleUserInteraction);
      targetElement.removeEventListener('touchmove', handleUserInteraction);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isActive]);

  const handleToggleActive = () => {
    setIsActive(prev => !prev);
    setIsPausedByTouch(false);
    lastTimeRef.current = null;
  };

  const handleScrollToTop = () => {
    const container = getScrollContainer();
    if (container instanceof HTMLElement) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = () => {
    const container = getScrollContainer();
    if (container instanceof HTMLElement) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  const presetSpeeds: { val: number; label: string; desc: string }[] = [
    { val: 0.25, label: '0.25x', desc: 'تدبر متأنٍ' },
    { val: 0.5, label: '0.5x', desc: 'بطيء' },
    { val: 0.75, label: '0.75x', desc: 'هادئ' },
    { val: 1.0, label: '1.0x', desc: 'عادي' },
    { val: 1.5, label: '1.5x', desc: 'متوسط' },
    { val: 2.0, label: '2.0x', desc: 'سريع' },
    { val: 3.0, label: '3.0x', desc: 'سريع جداً' }
  ];

  // Minimized Compact Pill Floating Button
  if (isMinimized) {
    return (
      <aside 
        aria-label="شريط التمرير المصغر"
        className={`fixed bottom-20 left-3 sm:left-4 z-40 animate-fade-in ${className}`}
      >
        <div className="flex items-center gap-1 bg-stone-950/95 border border-amber-500/50 p-1.5 rounded-full shadow-2xl backdrop-blur-xl">
          <button
            onClick={handleToggleActive}
            className={`p-2 rounded-full font-bold transition-all active:scale-90 ${
              isActive
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
            title={isActive ? 'إيقاف التمرير' : 'تشغيل التمرير'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-300 hover:text-amber-200"
            title="توسيع لوحة التمرير والسرعات"
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>{speed}x</span>
            <Maximize2 className="w-3 h-3 text-stone-400 mr-1" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="لوحة التحكم بالتمرير التلقائي"
      className={`fixed bottom-20 left-2 right-2 sm:right-auto sm:left-4 z-40 max-w-sm sm:max-w-md mx-auto sm:mx-0 animate-fade-in font-cairo select-none ${className}`}
      dir="rtl"
    >
      <div className="bg-stone-950/95 border border-amber-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl text-stone-100 space-y-2.5">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-2 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isActive 
                ? isPausedByTouch 
                  ? 'bg-yellow-400 animate-ping' 
                  : 'bg-emerald-400 animate-pulse'
                : 'bg-stone-600'
            }`} />
            
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <MoveDown className="w-4 h-4 text-amber-400" />
              <span>التمرير التلقائي للمصحف</span>
            </span>
            {isImageMode && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                طبعة المدينة
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className={`p-1 rounded-lg transition-colors ${
                showAdvancedSettings ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="إعدادات التمرير الدقيقة"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="تصغير إلى أيقونة عائمة"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors"
                title="إغلاق التمرير"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* State Banner / Status Indicator */}
        <div className="flex items-center justify-between text-[11px] px-1 text-stone-300">
          <div>
            {isActive ? (
              isPausedByTouch ? (
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  ⏸ إيقاف مؤقت باللمس (يستأنف خلال {pauseCountdown} ث)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  ▶ يتحرك {scrollDirection === 'down' ? 'للأسفل' : 'للأعلى'} بسرعة ({speed}x)
                </span>
              )
            ) : (
              <span className="text-stone-400">التمرير متوقف • انقر بدء للتشغيل</span>
            )}
          </div>

          {isPlayingAudio && (
            <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 text-[10px]">
              <Volume2 className="w-3 h-3 animate-pulse" />
              صوت القارئ نشط
            </span>
          )}
        </div>

        {/* Horizontal Speed Selector Pills (Direct 1-click speed buttons) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-stone-400 px-1 font-bold">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>سرعة التمرير:</span>
            </span>
            <span className="text-amber-300 font-bold text-xs">{speed}x</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {presetSpeeds.map(item => {
              const isSelected = speed === item.val;
              return (
                <button
                  key={item.val}
                  onClick={() => setSpeed(item.val)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-bold ring-1 ring-amber-300 shadow-sm'
                      : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                  }`}
                  title={`${item.label} - ${item.desc}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Precision Speed Slider & Direction Toggle (Advanced Section) */}
        {showAdvancedSettings && (
          <div className="p-2 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] text-stone-300">
              <span>ضبط السرعة الدقيق:</span>
              <span className="font-bold text-amber-400">{speed.toFixed(2)}x ({getPixelsPerSecond(speed)} بيكسل/ثانية)</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
            />

            {/* Direction Selector */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-xs">
              <span className="text-stone-400 text-[11px]">اتجاه التمرير:</span>
              <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-lg border border-stone-800">
                <button
                  onClick={() => setScrollDirection('down')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    scrollDirection === 'down' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>للأسفل</span>
                </button>
                <button
                  onClick={() => setScrollDirection('up')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    scrollDirection === 'up' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ArrowUp className="w-3 h-3" />
                  <span>للأعلى</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Main Actions Bar */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* Main Play / Pause Button */}
          <button
            onClick={handleToggleActive}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
              isActive
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>بدء التمرير التلقائي</span>
              </>
            )}
          </button>

          {/* Jump to Active Verse */}
          {onScrollToActiveAyah && (
            <button
              onClick={onScrollToActiveAyah}
              className="min-h-[38px] px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 hover:border-amber-500/40 transition-colors"
              title="الانتقال للآية المقروءة حالياً"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Scroll to Top */}
          <button
            onClick={handleScrollToTop}
            className="min-h-[38px] px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors"
            title="الصعود لأعلى الصفحة"
          >
            <ChevronsUp className="w-4 h-4" />
          </button>

          {/* Scroll to Bottom */}
          <button
            onClick={handleScrollToBottom}
            className="min-h-[38px] px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors"
            title="النزول لأسفل الصفحة"
          >
            <ChevronsDown className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
