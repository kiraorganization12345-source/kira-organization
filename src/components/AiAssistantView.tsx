import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  HelpCircle, 
  Compass, 
  Bot, 
  User, 
  RefreshCw,
  Lightbulb,
  MessageSquareText,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Loader2
} from 'lucide-react';
import { ALL_SURAHS } from '../data/surahs';
import { toArabicNumeral } from '../services/quranApi';

// SpeechRecognition type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface AiAssistantViewProps {
  onSelectSurah?: (surahId: number) => void;
  onPlayAyah?: (surahId: number, ayahNum: number) => void;
}

const SAMPLE_PROMPTS = [
  'ما الفوائد الحركية والتربوية في سورة الكهف وسورة الملك؟',
  'اذكر لي أدعية الأنبياء في القرآن الكريم ومعانيها بالتفصيل',
  'ما الفرق البياني بين الرحمة والمغفرة في الآيات القرآنية؟',
  'قدم لي تدبراً وشرحاً هادئاً لسورة الفاتحة وأسرار أسمائها',
  'ما هي آيات السكينة والطمأنينة وكيف أستشعرها عند الخوف؟',
  'قصة سيدنا موسى مع الخضر في سورة الكهف والدروس المستفادة'
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  onSelectSurah,
  onPlayAyah
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `أهلاً بك في **وضع الذكاء الاصطناعي القرآني** بموقع التوبة ✨
أنا مساعدك القرآني الذكي، يسعدني مساعدتك في:
- **تدبر السور والآيات القرآنية** واستخراج اللطائف اللغوية والتربوية.
- **الإجابة عن التساؤلات الدينية والقرآنية** وفق أمهات تفاسير أهل السنة والجماعة (ابن كثير، السعدي، والطبري).
- **البحث الموضوعي والبياني** واستخراج العبر والدروس للحياة اليومية.

🎙️ **جديد**: يمكنك استخدام زر **المايكرفون (المايك)** للتحدث وإرسال أسئلتك بصوتك مباشرة!`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [selectedAyahNum, setSelectedAyahNum] = useState<number>(1);

  // Speech Recording state (MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Text To Speech state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clean up audio recorder, timers and speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopAudioRecordingStreams();
    };
  }, []);

  const stopAudioRecordingStreams = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Start MediaRecorder + SpeechRecognition
  const startRecording = async () => {
    setSpeechError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم تسجيل الصوت المباشر.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      // Timer counter
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

      // Attempt parallel WebSpeech transcript if supported
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        try {
          const recognition = new SpeechRecognitionAPI();
          recognition.lang = 'ar-SA';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) setInputMessage(transcript);
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.log('WebSpeech recognition not available or blocked in iframe, relying on MediaRecorder audio.');
        }
      }

    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      let userFriendlyError = 'تعذر الوصول للميكروفون. يرجى التأكد من سماح المتصفح باستخدامه.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyError = 'تم رفض الإذن باستعمال الميكروفون. يرجى تفعيل صلاحية الميكروفون للموقع من إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyError = 'لم يتم العثور على ميكروفون متصل بالجهاز.';
      }
      setSpeechError(userFriendlyError);
      setIsRecording(false);
      stopAudioRecordingStreams();
    }
  };

  // Stop recording and send audio blob to Gemini API
  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Clean up stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      if (audioBlob.size < 500) {
        setSpeechError('التسجيل قصير جداً، يرجى التحدث بوضوح وإعادة المحاولة.');
        return;
      }

      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        await handleSendAudioPayload(base64String, mimeType, inputMessage);
      };
      reader.readAsDataURL(audioBlob);
    };

    try {
      recorder.stop();
    } catch (e) {
      console.error('Error stopping recorder:', e);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    setIsRecording(false);
    stopAudioRecordingStreams();
    audioChunksRef.current = [];
  };

  // Format seconds to 00:00
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Helper to stop all currently playing audio
  const stopCurrentAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setTtsLoadingMsgId(null);
  };

  // Realistic AI Text-To-Speech for AI Answer (Gemini AI Voice)
  const handleSpeakText = async (text: string, msgId: string) => {
    // If currently playing or generating audio for this message, stop it
    if (speakingMsgId === msgId || ttsLoadingMsgId === msgId) {
      stopCurrentAudio();
      return;
    }

    stopCurrentAudio();
    setTtsLoadingMsgId(msgId);

    try {
      // Fetch realistic human voice from Gemini TTS API
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'zephyr' })
      });

      const data = await res.json();

      if (data.success && data.audioData) {
        // Decode base64 to binary Uint8Array
        const binary = atob(data.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setSpeakingMsgId(null);
          setTtsLoadingMsgId(null);
        };

        audio.onerror = (e) => {
          console.warn('Gemini audio playback error, falling back to WebSpeech:', e);
          URL.revokeObjectURL(audioUrl);
          fallbackWebSpeech(text, msgId);
        };

        setTtsLoadingMsgId(null);
        setSpeakingMsgId(msgId);
        await audio.play();
        return;
      } else {
        throw new Error(data.error || 'فشل الحصول على الصوت من نموذج الذكاء الاصطناعي');
      }
    } catch (err) {
      console.warn('Gemini TTS endpoint failed, using WebSpeech fallback:', err);
      setTtsLoadingMsgId(null);
      fallbackWebSpeech(text, msgId);
    }
  };

  // Fallback to browser TTS with optimized Arabic natural pitch & rate
  const fallbackWebSpeech = (text: string, msgId: string) => {
    if (!window.speechSynthesis) {
      alert('متصفحك لا يدعم القراءة الصوتية للنصوص.');
      return;
    }

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Pick natural sounding voice if installed in OS/Browser
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Maged') || v.name.includes('Tariq') || v.name.includes('Laila') || v.name.includes('Salma')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Send audio payload to server
  const handleSendAudioPayload = async (audioBase64: string, mimeType: string, transcriptText?: string) => {
    if (loading) return;

    const userMsgId = Date.now().toString();
    const displayText = transcriptText?.trim()
      ? `🎙️ تسجيل صوتي: "${transcriptText.trim()}"`
      : '🎙️ سؤال صوتي مسجّل عبر المايك';

    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: displayText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-1')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioBase64,
          mimeType: mimeType,
          message: transcriptText?.trim() || undefined,
          history: historyPayload
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'فشل الاتصال بمحرك الذكاء الاصطناعي');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `عذراً، حدث خطأ أثناء معالجة تسجيلك الصوتي: ${err.message || 'يرجى التحقق من الاتصال وإعادة المحاولة.'}`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    if (isRecording) {
      cancelRecording();
    }

    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      // Build history payload
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-1')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: historyPayload
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'فشل الاتصال بمحرك الذكاء الاصطناعي');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `عذراً، حدث خطأ أثناء معالجة إجابتك: ${err.message || 'يرجى التحقق من الاتصال وإعادة المحاولة.'}`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('هل أنت تأكد من رغبتك في مسح المحادثة؟')) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      setMessages([
        {
          id: 'welcome-1',
          role: 'model',
          content: 'تم البدء بمحادثة جديدة. كيف يمكنني مساعدتك في تدبر وتفسير القرآن الكريم اليوم؟',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnalyzeSurahAyah = () => {
    const surah = ALL_SURAHS.find(s => s.id === selectedSurahId);
    if (!surah) return;
    const prompt = `أرجو تقديم تفسير وتدبر تفصيلي ولطائف إيمانية لآية رقم ${selectedAyahNum} من سورة ${surah.name}.`;
    handleSendMessage(prompt);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 p-6 sm:p-8 border border-amber-500/30 shadow-2xl mb-6 text-stone-100">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-right">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 mb-1">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>مزود بخاصية الصوت والميكروفون 🎙️</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-amber-100">
                وضع الذكاء الاصطناعي القرآني
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                تحدث مع المساعد القرآني بصوتك مباشرة عبر المايك لتدبر الآيات واستكشاف التفاسير العميقة.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-red-950/60 hover:text-red-300 text-stone-300 border border-stone-700 text-xs font-bold transition-all"
              title="مسح المحادثة"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح المحادثة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Speech Recording Active Banner */}
      {isRecording && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-stone-900 to-red-950/90 border-2 border-red-500 text-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/50 animate-bounce">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h4 className="font-bold text-sm text-red-200">جاري تسجيل صوتك بالمايك ({formatSeconds(recordDuration)})</h4>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">تحدث بسؤالك بوضوح، وسيقوم الذكاء الاصطناعي بالاستماع لمسار صوتك والإجابة عليه مباشرة.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={stopAndSendRecording}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
              <span>إرسال التسجيل الصوتي 🎙️</span>
            </button>
            <button
              onClick={cancelRecording}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold border border-stone-700"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {speechError && (
        <div className="mb-4 p-3 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <MicOff className="w-4 h-4 text-red-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="font-bold underline text-red-300 shrink-0">إغلاق</button>
        </div>
      )}

      {/* Quick Ayah Analysis Tool Bar */}
      <div className="bg-stone-900/90 border border-amber-500/20 rounded-2xl p-4 mb-6 shadow-md backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold w-full sm:w-auto">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>تدبر آية سريعة بالذكاء الاصطناعي:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Surah Selector */}
            <select
              value={selectedSurahId}
              onChange={(e) => {
                const sId = Number(e.target.value);
                setSelectedSurahId(sId);
                setSelectedAyahNum(1);
              }}
              className="bg-stone-800 text-amber-100 border border-stone-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  سورة {s.name} ({s.versesCount} آية)
                </option>
              ))}
            </select>

            {/* Ayah Number Selector */}
            <select
              value={selectedAyahNum}
              onChange={(e) => setSelectedAyahNum(Number(e.target.value))}
              className="bg-stone-800 text-amber-100 border border-stone-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            >
              {Array.from({ length: ALL_SURAHS.find(s => s.id === selectedSurahId)?.versesCount || 7 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  الآية {toArabicNumeral(n)}
                </option>
              ))}
            </select>

            <button
              onClick={handleAnalyzeSurahAyah}
              disabled={loading}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition-transform hover:scale-105 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تدبر الآية</span>
            </button>

            {onSelectSurah && (
              <button
                onClick={() => onSelectSurah(selectedSurahId)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl border border-stone-700 flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>فتح بالمصحف</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Topics Chips */}
      <div className="mb-6">
        <p className="text-xs font-bold text-stone-400 mb-2.5 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>مقترحات أسئلة وتأملات شائعة:</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="bg-stone-800/90 hover:bg-amber-500/20 hover:border-amber-400 text-stone-200 hover:text-amber-200 border border-stone-700 rounded-xl px-3.5 py-2 text-xs transition-all text-right shadow-sm disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px] max-h-[700px]">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isAi = msg.role === 'model';
            const isSpeakingThis = speakingMsgId === msg.id;
            const isLoadingThisTts = ttsLoadingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0 mt-1 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isAi
                    ? 'bg-stone-800/90 text-stone-100 border border-stone-700/80 rounded-tr-none shadow-lg'
                    : 'bg-amber-500 text-stone-950 font-medium rounded-tl-none shadow-md'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-black/10 dark:border-white/10 text-[11px] opacity-75">
                    <span className="font-bold flex items-center gap-1">
                      {isAi ? <Sparkles className="w-3 h-3 text-amber-400" /> : <User className="w-3 h-3" />}
                      {isAi ? 'المساعد القرآني' : 'أنت'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Content formatted */}
                  <div className="whitespace-pre-wrap select-text font-cairo">
                    {msg.content}
                  </div>

                  {/* Action Copy & Speech Buttons */}
                  {isAi && (
                    <div className="mt-3 pt-2 border-t border-stone-700/50 flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleSpeakText(msg.content, msg.id)}
                        disabled={isLoadingThisTts}
                        className={`text-xs flex items-center gap-1.5 font-bold transition-all px-2.5 py-1 rounded-lg ${
                          isSpeakingThis 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                            : isLoadingThisTts
                            ? 'bg-stone-800 text-stone-400 border border-stone-700'
                            : 'text-stone-400 hover:text-amber-300 hover:bg-stone-800'
                        }`}
                        title="استمع للإجابة بصوت واقعي فصيح"
                      >
                        {isLoadingThisTts ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>جاري إعداد الصوت الواقعي...</span>
                          </>
                        ) : isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                            <span>إيقاف الصوت الواقعي</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>قراءة صوتية واقعية 🎙️</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="text-stone-400 hover:text-amber-300 text-xs flex items-center gap-1 font-bold transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الإجابة</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!isAi && (
                  <div className="w-9 h-9 rounded-xl bg-amber-500 border border-amber-400 flex items-center justify-center text-stone-950 shrink-0 mt-1 shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator state */}
          {loading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="bg-stone-800/90 border border-stone-700 text-amber-200 rounded-2xl rounded-tr-none p-4 text-xs font-bold flex items-center gap-3 shadow-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-300"></div>
                </div>
                <span>جاري البحث والتدبر بالذكاء الاصطناعي...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Field Container with Microphone button */}
        <div className="p-3 sm:p-4 bg-stone-950 border-t border-stone-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={isRecording ? stopAndSendRecording : startRecording}
              disabled={loading}
              className={`p-3 rounded-2xl font-bold transition-all shrink-0 flex items-center justify-center ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                  : 'bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-stone-700'
              }`}
              title={isRecording ? 'إيقاف وإرسال التسجيل الصوتي' : 'التحدث عبر الميكروفون (المايك)'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isRecording ? `جاري تسجيل صوتك بالمايك (${formatSeconds(recordDuration)})...` : 'اكتب سؤالك، أو اضغط المايك للتحدث بصوتك...'}
              disabled={loading}
              className={`flex-1 bg-stone-900 text-stone-100 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 placeholder:text-stone-500 dir-rtl ${
                isRecording ? 'border-red-500 ring-2 ring-red-500/50' : 'border-stone-700/80 focus:ring-amber-500/80'
              }`}
            />

            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-lg transition-all disabled:opacity-40 flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

