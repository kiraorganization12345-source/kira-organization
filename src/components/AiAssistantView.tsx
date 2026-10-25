import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  User, 
  RefreshCw,
  Lightbulb,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Loader2,
  ArrowUp,
  Bookmark,
  Share2,
  Headphones,
  Sliders,
  X,
  Star,
  Quote,
  Flame,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { ALL_SURAHS } from '../data/surahs';
import { toArabicNumeral, removeTashkeel } from '../services/quranApi';

// SpeechRecognition type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type ScholarlyMode = 'tadabbur' | 'tafsir' | 'balagha' | 'qisas' | 'adkiya';
export type ScholarlyDepth = 'concise' | 'balanced' | 'detailed';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isVoiceInput?: boolean;
  mode?: ScholarlyMode;
  depth?: ScholarlyDepth;
}

interface SavedReflection {
  id: string;
  title: string;
  content: string;
  date: string;
  mode: ScholarlyMode;
}

interface AiAssistantViewProps {
  onSelectSurah?: (surahId: number) => void;
  onPlayAyah?: (surahId: number, ayahNum: number) => void;
  onOpenLiveVoice?: () => void;
}

const SCHOLARLY_MODES: { id: ScholarlyMode; label: string; icon: string; desc: string; badge: string }[] = [
  {
    id: 'tadabbur',
    label: 'تدبر وتربية',
    icon: '🌿',
    desc: 'فوائد إيمانية وتطبيقية للآيات في واقع الحياة اليومية وتزكية النفس',
    badge: 'تزكية وتطبيق'
  },
  {
    id: 'tafsir',
    label: 'تفسير موثق',
    icon: '📚',
    desc: 'بيان المعاني من أمهات التفاسير (ابن كثير، السعدي، الطبري) وأسباب النزول',
    badge: 'أمهات التفاسير'
  },
  {
    id: 'balagha',
    label: 'بلاغة وإعجاز',
    icon: '🔍',
    desc: 'أسرار النظم القرآني، الفروق اللغوية الدقيقة، ودلالات التقديم والتأخير',
    badge: 'إعجاز بياني'
  },
  {
    id: 'qisas',
    label: 'قصص وعبر',
    icon: '📜',
    desc: 'سير الأنبياء والمواقف القرآنية واستخلاص الدروس المعاصرة',
    badge: 'سير الأنبياء'
  },
  {
    id: 'adkiya',
    label: 'أدعية وسكينة',
    icon: '🤲',
    desc: 'أدعية الأنبياء، آيات الشفاء، الرقية الشرعية، وطمأنينة القلوب',
    badge: 'شفاء وسكينة'
  }
];

const DEPTH_OPTIONS: { id: ScholarlyDepth; label: string; icon: string }[] = [
  { id: 'concise', label: 'موجز سريع', icon: '⚡' },
  { id: 'balanced', label: 'شرح متزن', icon: '⚖️' },
  { id: 'detailed', label: 'تأصيل مفصل', icon: '📖' }
];

const CATEGORIZED_PROMPTS = [
  {
    category: 'all',
    title: 'سورة الكهف والفتن الأربع',
    prompt: 'ما هي الفتن الأربع المذكورة في سورة الكهف وكيف قدم القرآن سبل النجاة منها بالتفصيل؟',
    icon: '📖',
    mode: 'tadabbur' as ScholarlyMode
  },
  {
    category: 'tafsir',
    title: 'تفسير آية الكرسي',
    prompt: 'ما هو التفسير المعتمد لآية الكرسي [البقرة: 255] ولماذا كانت أعظم آية في كتاب الله؟',
    icon: '👑',
    mode: 'tafsir' as ScholarlyMode
  },
  {
    category: 'adkiya',
    title: 'أدعية الأنبياء المستجابة',
    prompt: 'اذكر لي جوامع أدعية الأنبياء في القرآن الكريم وسر استجابتها ومعانيها التربوية',
    icon: '🤲',
    mode: 'adkiya' as ScholarlyMode
  },
  {
    category: 'balagha',
    title: 'الفرق اللغوي بين الكلمات',
    prompt: 'ما الفرق البياني في القرآن بين (جاء وأتى) و(خوف وحزن) و(الرحمة والمغفرة)؟',
    icon: '🔍',
    mode: 'balagha' as ScholarlyMode
  },
  {
    category: 'qisas',
    title: 'موسى والخضر والقدر الخفي',
    prompt: 'ما هي أعمق الدروس المستفادة من قصة سيدنا موسى مع الخضر في سورة الكهف حول حكمة الله الخفية؟',
    icon: '🌊',
    mode: 'qisas' as ScholarlyMode
  },
  {
    category: 'adkiya',
    title: 'آيات السكينة وشفاء الصدور',
    prompt: 'ما هي آيات السكينة والطمأنينة في القرآن وكيف يرقي المؤمن بها قلبه ويدفع القلق والهموم؟',
    icon: '🌸',
    mode: 'adkiya' as ScholarlyMode
  },
  {
    category: 'tadabbur',
    title: 'لطائف سورة الفاتحة',
    prompt: 'قدم لي تدبراً تربوياً بديعاً لسورة الفاتحة وكيف تبني عقيدة المسلم في كل ركعة',
    icon: '✨',
    mode: 'tadabbur' as ScholarlyMode
  },
  {
    category: 'balagha',
    title: 'إعجاز سورة الكوثر',
    prompt: 'ما هي أسرار الإعجاز البياني والعددي والبلاغي في أقصر سور القرآن (سورة الكوثر)؟',
    icon: '💎',
    mode: 'balagha' as ScholarlyMode
  }
];

const SAVED_REFLECTIONS_KEY = 'quran_saved_ai_reflections_v1';

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  onSelectSurah,
  onPlayAyah,
  onOpenLiveVoice
}) => {
  // Mode & Depth State
  const [activeMode, setActiveMode] = useState<ScholarlyMode>('tadabbur');
  const [activeDepth, setActiveDepth] = useState<ScholarlyDepth>('balanced');
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [savedReflections, setSavedReflections] = useState<SavedReflection[]>([]);
  const [promptCategoryFilter, setPromptCategoryFilter] = useState<string>('all');

  // Messages State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `بسم الله الرحمن الرحيم، مرحباً بك في **المستشار القرآني الموثق** 🌿

يسعدني مرافقتك في رحاب كتاب الله عز وجل، من خلال دراسة محكمة تجمع بين:
- 🌿 **التدبر الإيماني والتربوي**: ربط الآيات بواقع حياتك وعملك اليومي.
- 📚 **التفسير الموثق**: من أمهات كتب السلف (ابن كثير، السعدي، الطبري، البغوي).
- 🔍 **البلاغة والإعجاز**: كشف اللطائف اللغوية والفروق البيانية ودقائق النظم القرآني.
- 📜 **قصص الأنبياء والعبر**: استخلاص الحِكم الربانية من مواقف الرسل الكرام.
- 🤲 **الأدعية والسكينة**: جوامع الدعاء وآيات الشفاء والطمأنينة.

✨ **تنبيه ذكي**: كل آية يُستشهد بها ستجد بجانبها زراً تفاعلياً 🎧 **للاستماع لتلاوتها** بصوت قارئك المفضل أو 📖 **فتحها في المصحف** مباشرة!`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      mode: 'tadabbur',
      depth: 'balanced'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedId, setBookmarkedId] = useState<string | null>(null);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [selectedAyahNum, setSelectedAyahNum] = useState<number>(1);

  // Audio Playback Settings & State
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Voice Recording (MediaRecorder) State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load Saved Reflections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_REFLECTIONS_KEY);
      if (saved) {
        setSavedReflections(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed loading saved reflections', e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      stopAudioRecordingStreams();
    };
  }, []);

  const stopAudioRecordingStreams = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    setSpeechError(null);
    stopCurrentAudio();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم تسجيل الصوت المباشر.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
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

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

      // WebSpeech transcription attempt
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
          console.log('WebSpeech recognition not supported or denied, fallback to audio upload.');
        }
      }

    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      let userFriendlyError = 'تعذر الوصول للميكروفون. يرجى التأكد من سماح المتصفح باستخدامه.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyError = 'تم رفض الإذن بالميكروفون. يرجى تفعيل صلاحية الميكروفون للموقع من إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyError = 'لم يتم العثور على ميكروفون متصل بالجهاز.';
      }
      setSpeechError(userFriendlyError);
      setIsRecording(false);
      stopAudioRecordingStreams();
    }
  };

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

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      if (audioBlob.size < 400) {
        setSpeechError('التسجيل الصوتي قصير جداً، يرجى التحدث بوضوح وإعادة المحاولة.');
        return;
      }

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

  const cancelRecording = () => {
    setIsRecording(false);
    stopAudioRecordingStreams();
    audioChunksRef.current = [];
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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

  // High-Quality Text-To-Speech
  const handleSpeakText = async (text: string, msgId: string) => {
    if (speakingMsgId === msgId || ttsLoadingMsgId === msgId) {
      stopCurrentAudio();
      return;
    }

    stopCurrentAudio();
    setTtsLoadingMsgId(msgId);

    try {
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/_/g, '')
        .replace(/`/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .trim();

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice })
      });

      const data = await res.json();

      if (data.success && data.audioData) {
        const binary = atob(data.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = playbackSpeed;
        audioPlayerRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setSpeakingMsgId(null);
          setTtsLoadingMsgId(null);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          fallbackWebSpeech(text, msgId);
        };

        setTtsLoadingMsgId(null);
        setSpeakingMsgId(msgId);
        await audio.play().catch(() => {
          fallbackWebSpeech(text, msgId);
        });
        return;
      } else {
        setTtsLoadingMsgId(null);
        fallbackWebSpeech(text, msgId);
        return;
      }
    } catch {
      setTtsLoadingMsgId(null);
      fallbackWebSpeech(text, msgId);
    }
  };

  const fallbackWebSpeech = (text: string, msgId: string) => {
    if (!window.speechSynthesis) return;

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = playbackSpeed * 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Maged') || v.name.includes('Tariq') || v.name.includes('Salma')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Send Voice Payload
  const handleSendAudioPayload = async (audioBase64: string, mimeType: string, transcriptText?: string) => {
    if (loading) return;

    const userMsgId = Date.now().toString();
    const displayText = transcriptText?.trim() || 'سؤال صوتي مسجّل بالميكروفون';

    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: displayText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isVoiceInput: true,
      mode: activeMode,
      depth: activeDepth
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
          history: historyPayload,
          mode: activeMode,
          depth: activeDepth
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg: Message = {
          id: aiMsgId,
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          mode: activeMode,
          depth: activeDepth
        };
        setMessages(prev => [...prev, aiMsg]);
        setTimeout(() => {
          handleSpeakText(data.reply, aiMsgId);
        }, 300);
      } else {
        throw new Error(data.error || 'فشل الاتصال بمحرك الذكاء الاصطناعي');
      }
    } catch (err: any) {
      let cleanErrorMessage = 'تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. يرجى إعادة المحاولة.';
      if (err.message && !err.message.includes('{') && !err.message.includes('401')) {
        cleanErrorMessage = err.message;
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `عذراً، ${cleanErrorMessage}`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Send Text Message
  const handleSendMessage = async (customText?: string, overrideMode?: ScholarlyMode) => {
    if (isRecording) {
      cancelRecording();
    }

    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const useMode = overrideMode || activeMode;

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      mode: useMode,
      depth: activeDepth
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!customText) setInputMessage('');
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
          message: textToSend.trim(),
          history: historyPayload,
          mode: useMode,
          depth: activeDepth
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          mode: useMode,
          depth: activeDepth
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'فشل الاتصال بمحرك الذكاء الاصطناعي');
      }
    } catch (err: any) {
      let cleanErrorMessage = 'تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. يرجى إعادة المحاولة.';
      if (err.message && !err.message.includes('{') && !err.message.includes('401')) {
        cleanErrorMessage = err.message;
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `عذراً، ${cleanErrorMessage}`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    stopCurrentAudio();
    setMessages([
      {
        id: 'welcome-1',
        role: 'model',
        content: 'تم البدء بمحادثة قرآنية جديدة. اختر تخصصك أو اطرح سؤالك الصوتي أو النصي مباشرة.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        mode: activeMode,
        depth: activeDepth
      }
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (text: string, title?: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'فائدة قرآنية من المساعد الذكي',
          text: text
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId('share-' + Date.now());
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Save AI Reflection to User's Saved Refections
  const handleSaveReflection = (msg: Message) => {
    const firstLine = msg.content.split('\n')[0].replace(/[#*]/g, '').trim() || 'فائدة قرآنية وتدبر';
    const newSaved: SavedReflection = {
      id: msg.id,
      title: firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine,
      content: msg.content,
      date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }),
      mode: msg.mode || activeMode
    };

    const updated = [newSaved, ...savedReflections.filter(s => s.id !== msg.id)];
    setSavedReflections(updated);
    try {
      localStorage.setItem(SAVED_REFLECTIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
    setBookmarkedId(msg.id);
    setTimeout(() => setBookmarkedId(null), 2200);
  };

  const handleRemoveSavedReflection = (id: string) => {
    const updated = savedReflections.filter(s => s.id !== id);
    setSavedReflections(updated);
    try {
      localStorage.setItem(SAVED_REFLECTIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAnalyzeSurahAyah = () => {
    const surah = ALL_SURAHS.find(s => s.id === selectedSurahId);
    if (!surah) return;
    const modeLabel = SCHOLARLY_MODES.find(m => m.id === activeMode)?.label || 'تدبر';
    const prompt = `أرجو تقديم [${modeLabel}] تفصيلي وموثق للآية رقم (${toArabicNumeral(selectedAyahNum)}) من سورة ${surah.name}.`;
    handleSendMessage(prompt);
  };

  // Match Quran Ayah citations like [البقرة: 255] or [الكهف: 10]
  const renderFormattedMessage = (content: string) => {
    // Split into lines
    const lines = content.split('\n');

    return (
      <div className="space-y-3">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-1.5" />;

          // Headings (### or ##)
          if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            const headingText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={lineIdx} className="font-bold text-amber-300 font-quran text-base mt-3 mb-1 border-r-2 border-amber-500 pr-2">
                {headingText}
              </h4>
            );
          }

          // Standalone Quranic Verse block with ﴿ ... ﴾
          const hasQuranQuote = trimmed.includes('﴿') && trimmed.includes('﴾');

          // Render line with interactive Ayah badges
          return (
            <div key={lineIdx} className={hasQuranQuote ? 'my-2 p-2.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-amber-100 font-quran text-[15px] leading-loose shadow-inner' : 'text-stone-200 leading-[1.85]'}>
              {parseLineWithBadges(trimmed)}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to parse line for citations like [البقرة: 255] and transform into clickable chips
  const parseLineWithBadges = (line: string) => {
    // Regex for [سورة: آية]
    const citationRegex = /\[(?:سورة\s+)?([^:\]]+):\s*([0-9٠-٩]+)(?:-[0-9٠-٩]+)?\]/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(line)) !== null) {
      // Text before citation
      if (match.index > lastIndex) {
        elements.push(formatInlineMarkdown(line.substring(lastIndex, match.index)));
      }

      const rawSurahName = match[1].trim();
      const rawAyahNum = match[2].trim();

      // Convert Arabic numerals to standard number if needed
      const normalizedAyahNum = parseInt(
        rawAyahNum.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()),
        10
      );

      // Find Surah in ALL_SURAHS
      const cleanTargetName = removeTashkeel(rawSurahName);
      const matchedSurah = ALL_SURAHS.find(s => {
        const sClean = removeTashkeel(s.name);
        return sClean === cleanTargetName || sClean.includes(cleanTargetName) || cleanTargetName.includes(sClean);
      });

      if (matchedSurah && normalizedAyahNum > 0) {
        elements.push(
          <span
            key={`badge-${match.index}`}
            className="inline-flex items-center gap-1.5 mx-1 px-2.5 py-0.5 rounded-full bg-stone-800 border border-amber-500/50 text-amber-300 text-xs font-bold align-middle shadow-sm"
          >
            <span className="font-quran">[{matchedSurah.name}: {toArabicNumeral(normalizedAyahNum)}]</span>
            
            {/* Play Recitation Button */}
            {onPlayAyah && (
              <button
                type="button"
                onClick={() => onPlayAyah(matchedSurah.id, normalizedAyahNum)}
                className="w-5 h-5 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 flex items-center justify-center transition-colors"
                title={`استماع لتلاوة الآية ${normalizedAyahNum} من سورة ${matchedSurah.name}`}
              >
                <Headphones className="w-3 h-3" />
              </button>
            )}

            {/* Jump to Surah in Mushaf */}
            {onSelectSurah && (
              <button
                type="button"
                onClick={() => onSelectSurah(matchedSurah.id)}
                className="w-5 h-5 rounded-full bg-stone-700/60 hover:bg-amber-400 hover:text-stone-950 text-stone-300 flex items-center justify-center transition-colors"
                title={`فتح سورة ${matchedSurah.name} في المصحف`}
              >
                <BookOpen className="w-3 h-3" />
              </button>
            )}
          </span>
        );
      } else {
        // Just the raw match if not found
        elements.push(<span key={`raw-${match.index}`} className="font-bold text-amber-400">{match[0]}</span>);
      }

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      elements.push(formatInlineMarkdown(line.substring(lastIndex)));
    }

    return elements.length > 0 ? elements : formatInlineMarkdown(line);
  };

  // Helper for bold and italic markdown
  const formatInlineMarkdown = (text: string) => {
    // Highlight **bold** text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-amber-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-28" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-stone-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-quran text-amber-100 flex items-center gap-2">
              <span>المستشار القرآني الموثق</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-normal">
                AI Scholarly Studio
              </span>
            </h1>
            <p className="text-xs text-stone-400">تدبر وتفسير رصين، صوت طبيعي، وربط تفاعلي بآيات المصحف الشريف</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Live Voice Studio Button */}
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-stone-950 text-xs font-black shadow-lg shadow-amber-950/40 border border-amber-300 transition-all hover:scale-105 active:scale-95"
              title="محادثة صوتية حية فورية بنموذج Gemini 3.8 Live"
            >
              <Radio className="w-3.5 h-3.5 text-stone-950 animate-pulse" />
              <span>محادثة صوتية حية</span>
              <span className="text-[10px] bg-stone-950 text-amber-300 px-1.5 py-0.2 rounded font-black">Live</span>
            </button>
          )}

          {/* Saved Reflections Library Button */}
          <button
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-stone-800 text-xs font-bold transition-all shadow-sm"
            title="الفوائد والتدبرات المحفوظة"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>المحفوظات</span>
            {savedReflections.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold font-mono">
                {savedReflections.length}
              </span>
            )}
          </button>

          {/* New Chat */}
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-red-300 border border-stone-800 text-xs font-bold transition-all"
            title="بدء جلسة جديدة"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">جلسة جديدة</span>
          </button>
        </div>
      </div>

      {/* Gemini 3.8 Live Voice Studio Hero Banner */}
      {onOpenLiveVoice && (
        <div className="mb-5 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/70 via-stone-900/90 to-amber-950/70 border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-100">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-950/50 shrink-0">
              <Radio className="w-6 h-6 animate-pulse text-stone-950" />
              <span className="absolute inset-0 rounded-2xl border-2 border-amber-300 animate-ping opacity-40 pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-amber-200">
                  المحادثة الصوتية المباشرة (Gemini 3.8 Live API)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  صوت فوري حي
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                تحدث مع الذكاء الاصطناعي بصوتك في الوقت الحقيقي بدون كتابة، مع ميزة المقاطعة اللحظية وتدبر القرآن.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLiveVoice}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Mic className="w-4 h-4 text-stone-950" />
            <span>ابدأ المحادثة الصوتية الآن</span>
          </button>
        </div>
      )}

      {/* Scholarly Specialization Pills Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>تخصص البحث والتدبر:</span>
          </span>
          {/* Depth selector */}
          <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-800 p-0.5 rounded-xl text-[11px] font-bold">
            {DEPTH_OPTIONS.map((depth) => (
              <button
                key={depth.id}
                onClick={() => setActiveDepth(depth.id)}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  activeDepth === depth.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>{depth.icon}</span>
                <span>{depth.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5 Scholarly Mode Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SCHOLARLY_MODES.map((mode) => {
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-100 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{mode.icon}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                    isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}>
                    {mode.badge}
                  </span>
                </div>
                <div className={`text-xs font-bold font-quran ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                  {mode.label}
                </div>
                <p className="text-[10px] text-stone-400/80 line-clamp-1 mt-0.5">
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speech Error Banner */}
      {speechError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <MicOff className="w-4 h-4 text-red-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="font-bold underline text-red-300 shrink-0">إغلاق</button>
        </div>
      )}

      {/* Quick Ayah Selector Accordion / Capsule */}
      <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3 mb-5 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold w-full sm:w-auto">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>تحليل آية من المصحف مباشرة:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSurahId}
              onChange={(e) => {
                const sId = Number(e.target.value);
                setSelectedSurahId(sId);
                setSelectedAyahNum(1);
              }}
              className="bg-stone-800 text-stone-200 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  سورة {s.name} ({s.versesCount} آية)
                </option>
              ))}
            </select>

            <select
              value={selectedAyahNum}
              onChange={(e) => setSelectedAyahNum(Number(e.target.value))}
              className="bg-stone-800 text-stone-200 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500"
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
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>استخراج الفوائد</span>
            </button>

            {onSelectSurah && (
              <button
                onClick={() => onSelectSurah(selectedSurahId)}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl border border-stone-700 flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>فتح بالمصحف</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Inquiries / Inspiration Cards */}
      {messages.length <= 1 && (
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>نماذج استفسارات وتدبرات ملهمة:</span>
            </p>

            {/* Filter pills */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'tadabbur', label: 'تدبر' },
                { id: 'tafsir', label: 'تفسير' },
                { id: 'balagha', label: 'بلاغة' },
                { id: 'adkiya', label: 'أدعية' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPromptCategoryFilter(f.id)}
                  className={`px-2 py-0.5 rounded-lg ${
                    promptCategoryFilter === f.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {CATEGORIZED_PROMPTS
              .filter(item => promptCategoryFilter === 'all' || item.mode === promptCategoryFilter)
              .slice(0, 4)
              .map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveMode(item.mode);
                    handleSendMessage(item.prompt, item.mode);
                  }}
                  disabled={loading}
                  className="text-right p-3 rounded-2xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 text-stone-200 hover:text-amber-100 transition-all flex flex-col justify-between group shadow-sm disabled:opacity-50 min-h-[90px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] text-amber-400/80 font-bold group-hover:text-amber-300">اسأل الآن ←</span>
                  </div>
                  <div className="text-xs font-bold text-amber-200 mb-0.5 line-clamp-1">{item.title}</div>
                  <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Messages Canvas */}
      <div className="space-y-6 mb-6">
        {messages.map((msg) => {
          const isAi = msg.role === 'model';
          const isSpeakingThis = speakingMsgId === msg.id;
          const isLoadingThisTts = ttsLoadingMsgId === msg.id;
          const isBookmarked = bookmarkedId === msg.id || savedReflections.some(s => s.id === msg.id);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {/* AI Scholarly Avatar */}
              {isAi && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/30 border border-amber-400/60 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed ${
                isAi
                  ? 'bg-stone-900/90 text-stone-100 border border-stone-800 rounded-tr-none shadow-md'
                  : 'bg-amber-500 text-stone-950 font-medium rounded-tl-none shadow-md'
              }`}>
                {/* Header line inside bubble */}
                <div className="flex items-center justify-between gap-4 mb-2.5 pb-2 border-b border-black/10 dark:border-white/10 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {isAi ? (
                        <span className="text-amber-300 font-bold font-quran flex items-center gap-1">
                          <span>المستشار القرآني</span>
                          {msg.mode && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {SCHOLARLY_MODES.find(m => m.id === msg.mode)?.label}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>{msg.isVoiceInput ? '🎙️ سؤالك الصوتي' : 'أنت'}</span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">{msg.timestamp}</span>
                </div>

                {/* Formatted Content */}
                <div className="select-text font-cairo text-sm">
                  {isAi ? renderFormattedMessage(msg.content) : msg.content}
                </div>

                {/* AI Bottom Action Bar */}
                {isAi && (
                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Natural Voice Audio Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeakText(msg.content, msg.id)}
                        disabled={isLoadingThisTts}
                        className={`text-xs flex items-center gap-1.5 font-bold transition-all px-3 py-1.5 rounded-full ${
                          isSpeakingThis 
                            ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md' 
                            : isLoadingThisTts
                            ? 'bg-stone-800 text-stone-400 border border-stone-700'
                            : 'bg-stone-800/90 text-stone-300 hover:text-amber-300 hover:bg-stone-800 border border-stone-700/60'
                        }`}
                        title="استمع للإجابة بنبرة صوتية واقعية"
                      >
                        {isLoadingThisTts ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>جاري توليد الصوت...</span>
                          </>
                        ) : isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>إيقاف الصوت</span>
                            {/* Animated wave sound bars */}
                            <span className="flex items-center gap-0.5 mr-1 h-3">
                              <span className="w-0.5 h-2 bg-stone-950 animate-pulse" />
                              <span className="w-0.5 h-3 bg-stone-950 animate-pulse delay-75" />
                              <span className="w-0.5 h-1.5 bg-stone-950 animate-pulse delay-150" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>استماع بالصوت الطبيعي</span>
                          </>
                        )}
                      </button>

                      {/* Voice Settings dropdown / speed toggle */}
                      {isSpeakingThis && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
                          <button
                            onClick={() => {
                              const newRate = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 0.8 : 1.0;
                              setPlaybackSpeed(newRate);
                              if (audioPlayerRef.current) audioPlayerRef.current.playbackRate = newRate;
                            }}
                            className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 text-amber-300"
                            title="تغيير سرعة القراءة"
                          >
                            {playbackSpeed}x
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Secondary Actions: Bookmark, Copy, Share */}
                    <div className="flex items-center gap-1.5">
                      {/* Bookmark / Save to reflections */}
                      <button
                        onClick={() => handleSaveReflection(msg)}
                        className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                          isBookmarked
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                        }`}
                        title="حفظ الفائدة في مكتبة التدبرات"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">{isBookmarked ? 'محفوظة' : 'حفظ'}</span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={() => handleShare(msg.content)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs transition-colors flex items-center gap-1"
                        title="مشاركة الفائدة"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">مشاركة</span>
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs transition-colors flex items-center gap-1"
                        title="نسخ النص"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">{copiedId === msg.id ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* User Avatar */}
              {!isAi && (
                <div className="w-8 h-8 rounded-full bg-amber-500 border border-amber-400 flex items-center justify-center text-stone-950 shrink-0 mt-0.5 shadow-sm font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="bg-stone-900/90 border border-stone-800 text-stone-300 rounded-3xl rounded-tr-none p-4 text-xs font-bold flex items-center gap-3 shadow-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-300"></div>
              </div>
              <span className="text-amber-200 font-quran">
                جاري التأصيل والتفسير واستنباط اللطائف من المراجع المعتمدة...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Active Voice Studio Overlay Banner */}
      {isRecording && (
        <div className="fixed bottom-24 inset-x-4 max-w-xl mx-auto z-40 p-4 rounded-3xl bg-stone-950 border-2 border-amber-500 shadow-2xl flex items-center justify-between gap-3 text-stone-100 animate-fadeIn">
          <div className="flex items-center gap-3">
            {/* Pulsing Microphone */}
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/50">
              <Mic className="w-6 h-6 animate-pulse" />
              <span className="absolute inset-0 rounded-2xl border-2 border-red-400 animate-ping opacity-75 pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold text-sm text-red-200">الاستماع لصوتك وتسجيل السؤال...</span>
              </div>
              <p className="text-xs text-stone-400 font-mono mt-0.5">
                المدة: {formatSeconds(recordDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={stopAndSendRecording}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
              <span>إرسال</span>
            </button>
            <button
              onClick={cancelRecording}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Floating / Sticky Input Bar */}
      <div className="sticky bottom-4 z-30 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-stone-900/95 border border-stone-800 shadow-2xl backdrop-blur-xl transition-all focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20"
        >
          {/* Animated Microphone Voice Input Button */}
          <button
            type="button"
            onClick={isRecording ? stopAndSendRecording : startRecording}
            disabled={loading}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isRecording
                ? 'bg-red-600 text-white gemini-mic-pulse shadow-lg shadow-red-600/50'
                : 'bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-stone-700/60'
            }`}
            title={isRecording ? 'إيقاف وإرسال التسجيل الصوتي' : 'التحدث بالميكروفون (المايك)'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isRecording 
                ? `جاري الاستماع والتسجيل (${formatSeconds(recordDuration)})...` 
                : `اسأل في [${SCHOLARLY_MODES.find(m => m.id === activeMode)?.label}] أو اضغط المايك للتحدث...`
            }
            disabled={loading}
            className="flex-1 bg-transparent text-stone-100 placeholder:text-stone-500 text-xs sm:text-sm px-2 py-2 outline-none border-none font-cairo"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-stone-950 flex items-center justify-center transition-all shrink-0 shadow-md active:scale-95"
            title="إرسال السؤال"
          >
            <ArrowUp className="w-5 h-5 font-bold" />
          </button>
        </form>
      </div>

      {/* Saved Reflections Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950 text-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-bold">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-quran text-amber-200">الفوائد والتدبرات القرآنية المحفوظة</h3>
                  <p className="text-xs text-stone-400">مجموع التدبرات التي حفظتها للرجوع إليها في أي وقت</p>
                </div>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {savedReflections.length === 0 ? (
                <div className="py-12 text-center text-stone-500 space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto text-stone-700" />
                  <p className="text-sm">لم تقم بحفظ أي فائدة قرآنية بعد.</p>
                  <p className="text-xs text-stone-600">اضغط على زر (حفظ) أسفل أي إجابة ليتم تدوينها هنا تلقائياً.</p>
                </div>
              ) : (
                savedReflections.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-stone-850 border border-stone-800 text-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold font-quran">
                          {SCHOLARLY_MODES.find(m => m.id === item.mode)?.label || 'تدبر'}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">{item.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(item.content, item.id)}
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-200 text-xs"
                          title="نسخ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSavedReflection(item.id)}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-400 text-xs"
                          title="حذف من المحفوظات"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs leading-relaxed font-cairo text-stone-300 whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                      {item.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-end">
              <button
                onClick={() => setShowSavedModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
