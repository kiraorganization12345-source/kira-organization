import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Radio, 
  RefreshCw, 
  Square, 
  Send, 
  Minimize2, 
  Maximize2, 
  MessageSquare, 
  HelpCircle,
  BookOpen,
  Heart,
  ChevronDown
} from 'lucide-react';
import { GeminiLiveVoiceSession, LiveStatus } from '../services/geminiLiveService';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSurah?: (surahId: number) => void;
}

interface TranscriptTurn {
  id: string;
  isModel: boolean;
  text: string;
  time: string;
}

const VOICES = [
  { id: 'Zephyr', name: 'نسيم (Zephyr)', desc: 'هادئ، وقور، ومتزن' },
  { id: 'Aoede', name: 'عذب (Aoede)', desc: 'عذب وواضح ومتقن' },
  { id: 'Kore', name: 'نقي (Kore)', desc: 'صافٍ ولطيف النبرة' },
  { id: 'Fenrir', name: 'جهوري (Fenrir)', desc: 'فخم وعميق' },
  { id: 'Charon', name: 'ساكن (Charon)', desc: 'هادئ ومطمئن' },
  { id: 'Puck', name: 'حيوي (Puck)', desc: 'سريع وحيوي' }
];

const SUGGESTIONS = [
  {
    title: 'تفسير سورة الفاتحة',
    query: 'اشرح لي لطائف سورة الفاتحة ولماذا سميت بالسبع المثاني وأم الكتاب؟',
    icon: '📖'
  },
  {
    title: 'فضل سورة الملك',
    query: 'ما هو فضل قراءة سورة الملك المنجية من عذاب القبر قبل النوم؟',
    icon: '✨'
  },
  {
    title: 'دعاء تفريج الكرب',
    query: 'ما هي أعظم أدعية الأنبياء في القرآن لتفريج الكروب وجلب السكينة؟',
    icon: '🤲'
  },
  {
    title: 'الفتن في سورة الكهف',
    query: 'ما هي الفتن الأربع المذكورة في سورة الكهف وكيف ينجو المؤمن منها؟',
    icon: '🛡️'
  },
  {
    title: 'آيات السكينة والطمأنينة',
    query: 'اذكر لي آيات السكينة التي تبعث الراحة والاطمئنان في القلب عند الخوف أو الحزن',
    icon: '🌸'
  }
];

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectSurah
}) => {
  const [session, setSession] = useState<GeminiLiveVoiceSession | null>(null);
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [modelAudioLevel, setModelAudioLevel] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);

  const transcriptsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll transcript
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (session) {
        session.stop();
      }
    };
  }, [session]);

  const startVoiceConversation = async (voiceName = selectedVoice) => {
    setErrorMessage(null);
    if (session) {
      session.stop();
    }

    const newSession = new GeminiLiveVoiceSession({
      voice: voiceName,
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onTranscript: (text, isModel) => {
        setTranscripts((prev) => {
          // If the last message is from the same source, append or create new
          const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
          if (prev.length > 0 && prev[prev.length - 1].isModel === isModel) {
            const updated = [...prev];
            updated[updated.length - 1].text += text;
            return updated;
          }
          return [...prev, {
            id: Math.random().toString(36).substring(2, 9),
            isModel,
            text,
            time: now
          }];
        });
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onUserAudioLevel: (level) => {
        setUserAudioLevel(level);
      },
      onModelAudioLevel: (level) => {
        setModelAudioLevel(level);
      }
    });

    setSession(newSession);

    try {
      await newSession.start();
    } catch (e: any) {
      console.error('Failed to start session in modal:', e);
    }
  };

  const handleStopConversation = () => {
    if (session) {
      session.stop();
      setSession(null);
    }
    setStatus('idle');
    setUserAudioLevel(0);
    setModelAudioLevel(0);
  };

  const handleToggleMute = () => {
    if (session) {
      const muted = session.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleInterrupt = () => {
    if (session) {
      session.interrupt();
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    if (session && (status === 'listening' || status === 'speaking' || status === 'connected')) {
      session.sendText(textInput.trim());
      setTextInput('');
    } else {
      // Start session first and send text
      startVoiceConversation().then(() => {
        setTimeout(() => {
          session?.sendText(textInput.trim());
          setTextInput('');
        }, 800);
      });
    }
  };

  const handleSuggestionClick = (query: string) => {
    setTextInput(query);
    if (session && (status === 'listening' || status === 'speaking')) {
      session.sendText(query);
      setTextInput('');
    } else {
      startVoiceConversation().then(() => {
        setTimeout(() => {
          session?.sendText(query);
          setTextInput('');
        }, 1200);
      });
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setIsVoiceDropdownOpen(false);
    if (session && status !== 'idle') {
      startVoiceConversation(voiceId);
    }
  };

  if (!isOpen) return null;

  // Floating Minimized Widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 left-6 z-50 animate-fadeIn">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-stone-900/95 border-2 border-amber-500/80 text-amber-200 shadow-2xl backdrop-blur-xl">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
            <Radio className={`w-4 h-4 text-amber-400 ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`} />
            {(status === 'listening' || status === 'speaking') && (
              <span className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-60" />
            )}
          </div>

          <div className="flex flex-col text-right text-xs">
            <span className="font-bold text-amber-300">محادثة حية (Live API)</span>
            <span className="text-[10px] text-stone-400 font-mono">
              {status === 'speaking' ? 'الذكاء يتحدث...' : status === 'listening' ? 'يستمع لصوتك...' : 'متصل'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-r border-stone-800 pr-2">
            {status === 'speaking' && (
              <button
                onClick={handleInterrupt}
                title="مقاطعة الذكاء الاصطناعي"
                className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-300"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}

            <button
              onClick={handleToggleMute}
              title={isMuted ? 'إلغاء الكتم' : 'كتم الميكروفون'}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300"
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsMinimized(false)}
              title="تكبير النافذة"
              className="p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleStopConversation}
              title="إنهاء المحادثة"
              className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e0c0a] border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-950/60 flex flex-col max-h-[92vh] overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/80 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-400/50">
              <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              {(status === 'listening' || status === 'speaking') && (
                <span className="absolute inset-0 rounded-2xl border-2 border-amber-400/60 animate-ping opacity-60 pointer-events-none" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-amber-200">
                  المحادثة الصوتية المباشرة
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-stone-400">
                تحدث بحرية بصوتك واحصل على إجابات وتدبر فوري في الوقت الفعلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Minimize button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors"
              title="تصغير إلى شريط عائم واستكمال القراءة في المصحف"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close modal */}
            <button
              onClick={() => {
                handleStopConversation();
                onClose();
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
              title="إغلاق المحادثة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status Bar & Voice Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-stone-900/60 border-b border-stone-800/60 text-xs">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              status === 'speaking'
                ? 'bg-emerald-400 animate-ping'
                : status === 'listening'
                ? 'bg-amber-400 animate-pulse'
                : status === 'connecting'
                ? 'bg-blue-400 animate-bounce'
                : status === 'error'
                ? 'bg-red-500'
                : 'bg-stone-500'
            }`} />
            <span className="font-bold text-stone-300">
              {status === 'speaking' && 'الذكاء يتحدث بصوته...'}
              {status === 'listening' && 'المايك يعمل: استمع لصوتك الآن...'}
              {status === 'connecting' && 'جاري الاتصال بـ Gemini Live API...'}
              {status === 'idle' && 'جاهز، اضغط على زر التحدث للبدء'}
              {status === 'error' && 'حدث تنبيه أو خطأ في الاتصال'}
              {status === 'fallback' && 'وضع الاتصال البديل'}
            </span>
          </div>

          {/* Voice selector */}
          <div className="relative">
            <button
              onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>الصوت: {VOICES.find(v => v.id === selectedVoice)?.name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {isVoiceDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-48 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl p-1 z-30 animate-fadeIn">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs flex flex-col gap-0.5 transition-colors ${
                      selectedVoice === v.id ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className={`text-[10px] ${selectedVoice === v.id ? 'text-stone-900' : 'text-stone-400'}`}>
                      {v.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Sound Wave / Pulsing Visualizer Stage */}
        <div className="px-5 py-6 flex flex-col items-center justify-center relative bg-gradient-to-b from-stone-950 via-[#14100c] to-[#0e0c0a] border-b border-stone-800/80">
          {/* Animated Central Orb / Waveform */}
          <div className="relative flex items-center justify-center w-36 h-36 my-2">
            
            {/* Outer pulsating audio ripples */}
            {(status === 'listening' || status === 'speaking') && (
              <>
                <div 
                  className="absolute inset-0 rounded-full border-2 border-amber-500/40 animate-ping pointer-events-none"
                  style={{
                    transform: `scale(${1 + (status === 'speaking' ? modelAudioLevel : userAudioLevel) * 0.8})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <div 
                  className="absolute -inset-4 rounded-full bg-amber-500/10 blur-xl pointer-events-none"
                  style={{
                    opacity: 0.3 + (status === 'speaking' ? modelAudioLevel : userAudioLevel) * 0.7
                  }}
                />
              </>
            )}

            {/* Glowing Orb Button */}
            <button
              onClick={status === 'idle' ? () => startVoiceConversation() : handleStopConversation}
              className={`relative z-10 flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 transition-all duration-300 shadow-2xl ${
                status === 'speaking'
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-950 border-emerald-400 shadow-emerald-900/60 scale-105'
                  : status === 'listening'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-900 border-amber-300 shadow-amber-900/70 scale-105'
                  : status === 'connecting'
                  ? 'bg-stone-800 border-blue-400 animate-pulse'
                  : 'bg-gradient-to-br from-stone-800 to-stone-900 border-amber-500/50 hover:border-amber-400 hover:scale-105'
              }`}
            >
              {status === 'speaking' ? (
                <Volume2 className="w-10 h-10 text-emerald-100 animate-bounce" />
              ) : status === 'listening' ? (
                <Mic className="w-10 h-10 text-stone-950 animate-pulse" />
              ) : status === 'connecting' ? (
                <RefreshCw className="w-8 h-8 text-blue-300 animate-spin" />
              ) : (
                <Mic className="w-10 h-10 text-amber-400" />
              )}
              
              <span className={`text-[11px] font-bold mt-1 ${
                status === 'listening' ? 'text-stone-950' : 'text-amber-200'
              }`}>
                {status === 'idle' ? 'ابدأ التحدث' : status === 'speaking' ? 'الرد الصوتي' : status === 'listening' ? 'استماع...' : 'اتصال...'}
              </span>
            </button>
          </div>

          {/* Real-time Visualizer bars */}
          <div className="flex items-center justify-center gap-1.5 h-8 mt-2 w-full max-w-xs">
            {Array.from({ length: 16 }).map((_, i) => {
              const activeLevel = status === 'speaking' ? modelAudioLevel : userAudioLevel;
              const height = status === 'idle' 
                ? 4 
                : Math.max(4, Math.sin((i / 16) * Math.PI) * (activeLevel * 32 + (status === 'listening' ? 6 : 8)));
              
              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    status === 'speaking'
                      ? 'bg-emerald-400'
                      : status === 'listening'
                      ? 'bg-amber-400'
                      : 'bg-stone-700'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {/* Quick Action controls bar */}
          {status !== 'idle' && (
            <div className="flex items-center gap-3 mt-4">
              {/* Interrupt / Stop speaking button */}
              {status === 'speaking' && (
                <button
                  onClick={handleInterrupt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-md"
                  title="مقاطعة كلام الذكاء والتحدث فورياً"
                >
                  <Square className="w-3 h-3 fill-current text-amber-400" />
                  <span>مقاطعة (تحدث الآن)</span>
                </button>
              )}

              {/* Mute toggle */}
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  isMuted 
                    ? 'bg-red-950/80 border-red-500/80 text-red-200' 
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isMuted ? 'المايك مكتوم' : 'كتم المايك'}</span>
              </button>

              {/* End conversation button */}
              <button
                onClick={handleStopConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>إنهاء الجلسة</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-2 shadow-lg">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline text-red-300">إغلاق</button>
          </div>
        )}

        {/* Live Conversation Transcript Display */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] max-h-[220px] bg-[#0c0a09]/80">
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-stone-400 text-xs">
              <Sparkles className="w-6 h-6 text-amber-500/60 mb-2 animate-pulse" />
              <p className="font-bold text-stone-300">محادثة صوتية حية مدعومة بنموذج gemini-3.8-live</p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-sm">
                تكلم بصوتك وسيقوم الذكاء الاصطناعي بالرد عليك فورياً بالصوت الطبيعي، أو انقر على أحد الأسئلة المقترحة أدناه.
              </p>
            </div>
          ) : (
            transcripts.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col ${turn.isModel ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    turn.isModel
                      ? 'bg-stone-900 border border-amber-500/30 text-amber-100'
                      : 'bg-amber-600 text-stone-950 font-bold'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 opacity-70 text-[10px]">
                    <span>{turn.isModel ? 'Gemini 3.8 Live' : 'أنت'}</span>
                    <span>{turn.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap font-sans">{turn.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptsEndRef} />
        </div>

        {/* Fast Questions Suggestion Pills */}
        <div className="px-4 py-2 bg-stone-950/60 border-t border-stone-800/60">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-stone-400 text-[11px] whitespace-nowrap">مقترحات سريعة:</span>
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(item.query)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 border border-stone-800 hover:border-amber-500/50 text-[11px] whitespace-nowrap transition-colors shrink-0"
              >
                <span>{item.icon}</span>
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text fallback input bar */}
        <form
          onSubmit={handleSendText}
          className="flex items-center gap-2 p-3 bg-stone-950 border-t border-stone-800/80"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="أو اكتب سؤالك ليجيبك بالصوت في الحال..."
            className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl px-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold transition-transform hover:scale-105 shrink-0"
            title="إرسال"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>

      </div>
    </div>
  );
};
