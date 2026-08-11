import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini AI lazily
  let aiClient: GoogleGenAI | null = null;
  function getAi() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Quran Tadabbur & Tafsir Assistant
  app.post('/api/tadabbur', async (req, res) => {
    try {
      const { surahName, surahNumber, ayahNumber, ayahText, question } = req.body;

      if (!ayahText && !question) {
        return res.status(400).json({ error: 'محتوى الآية أو السؤال مطلوب' });
      }

      const ai = getAi();
      const prompt = `
أنت معلم ومفسر قرآن كريم متقن، هادئ وموثوق. أجب بأسلوب راقٍ وشائق باللغة العربية مع مراعاة الضوابط الشرعية المعتمدة عند أهل السنة والجماعة (مثل تفسير ابن كثير والسعدي وطبري).

المعلومات المتوفرة:
السورة: ${surahName || ''} (رقم ${surahNumber || ''})
الآية رقم: ${ayahNumber || ''}
نص الآية: ${ayahText || ''}

طلب المستخدم: ${question || 'قدم تدبراً لطيفاً وفوائد تربوية ولغوية وأسباب نزول (إن وجدت) لهذه الآية الكريمة.'}

الرجاء تنسيق الإجابة بشكل منظم يشمل:
1. المعنى العام للآية ببساطة ووضوح.
2. اللطائف اللغوية والبيانية والفوائد الإيمانية.
3. التوجيه والعمل بالآية في حياتنا اليومية.
4. أسباب النزول أو المناسبة (إن توفرت).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({
        success: true,
        answer: response.text || 'عذراً، لم أتمكن من الحصول على تدبر للآية حالياً.',
      });
    } catch (error: any) {
      console.error('Tadabbur API error:', error);
      res.status(500).json({
        error: error.message || 'حدث خطأ أثناء معالجة الطلب',
      });
    }
  });

  // Gemini AI Quran Assistant & Chat endpoint (Full AI Mode with Voice/Audio support)
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { message, audioData, mimeType, history } = req.body;

      if ((!message || typeof message !== 'string') && !audioData) {
        return res.status(400).json({ error: 'الرسالة أو التسجيل الصوتي مطلوب' });
      }

      const ai = getAi();

      const systemInstruction = `
أنت "المساعد القرآني الذكي" المتقدم لموقع التوبة.
مهمتك: مساعدة المستخدمين في تدبر القرآن الكريم، فهم معاني السور والآيات، استخراج اللطائف اللغوية والبيانية، الإجابة عن التساؤلات القرآنية والتربوية بأسلوب متزن وراقٍ وموثق وفق المنهج الإسلامي المعتمد (التفاسير الموثوقة مثل ابن كثير، السعدي، والطبري).

قواعد الإجابة:
1. استخدم اللغة العربية الفصيحة السلسة المنظمة باستخدام العناوين والنقاط لتسهيل القراءة.
2. عند الاستشهاد بالآيات القرآنية، اذكر اسم السورة ورقم الآية بصورة واضحة.
3. ركز على اللطائف التربوية والإيمانية وكيفية العمل بالقرآن في حياتنا اليومية.
4. إذا تلقيت سؤالاً صوتياً، استمع له بدقة وأجب على السؤال المطلوب بلغة عربية فصيحة سريعة ومباشرة.
5. حافظ على التوازن والوقار في جميع الإجابات.
`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item.role === 'user' || item.role === 'model') {
            contents.push({
              role: item.role,
              parts: [{ text: item.content }]
            });
          }
        }
      }

      const userParts: any[] = [];
      if (audioData) {
        userParts.push({
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioData
          }
        });
      }

      if (message) {
        userParts.push({ text: message });
      } else if (audioData) {
        userParts.push({ text: 'استمع إلى السؤال أو التسجيل الصوتي المرفق وأجب عليه بعناية وتدبر باللغة العربية الفصيحة.' });
      }

      contents.push({
        role: 'user',
        parts: userParts
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({
        success: true,
        reply: response.text || 'عذراً، لم أتمكن من معالجة إجابتك حالياً.',
      });
    } catch (error: any) {
      console.error('AI Chat API error:', error);
      res.status(500).json({
        error: error.message || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي',
      });
    }
  });

  // Helper to ensure base64 audio has a valid WAV header for PCM data
  function ensureWavHeader(base64Data: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
    const pcmBuffer = Buffer.from(base64Data, 'base64');
    // Check if RIFF header already exists
    if (pcmBuffer.length >= 12 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
      return base64Data;
    }

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcmBuffer.length, 4);
    header.write('WAVE', 8);

    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    header.writeUInt16LE(bitsPerSample, 34);

    header.write('data', 36);
    header.writeUInt32LE(pcmBuffer.length, 40);

    return Buffer.concat([header, pcmBuffer]).toString('base64');
  }

  // Gemini Realistic Text To Speech (TTS) Endpoint
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'النص مطلوب للتوليد الصوتي' });
      }

      const ai = getAi();

      // Clean markdown tags for natural speech flow
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/_/g, '')
        .replace(/`/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .trim();

      // Take first 1200 characters for optimal response speed
      const snippet = cleanText.length > 1200 ? cleanText.substring(0, 1200) + '...' : cleanText;

      const voiceName = voice || 'Zephyr';

      const interaction = await ai.interactions.create({
        model: 'gemini-3.1-flash-tts-preview',
        input: `اقرأ النص التالي بصوت متحدث عربي فصيح، دافئ، طبيعي ومريح جداً للأذن، بإلقاء هادئ ورزين: ${snippet}`,
        response_modalities: ['AUDIO'],
        generation_config: {
          speech_config: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          } as any
        } as any
      });

      let rawAudioBase64: string | null = null;
      let mimeType = 'audio/wav';

      if (interaction.output_audio) {
        rawAudioBase64 = interaction.output_audio.data;
        if (interaction.output_audio.mime_type) {
          mimeType = interaction.output_audio.mime_type;
        }
      } else {
        for (const step of interaction.steps) {
          if (step.type === 'model_output') {
            const audioContent = step.content?.find((c: any) => c.type === 'audio') as any;
            if (audioContent && audioContent.data) {
              rawAudioBase64 = audioContent.data;
              if (audioContent.mime_type) mimeType = audioContent.mime_type;
              break;
            }
          }
        }
      }

      if (!rawAudioBase64) {
        throw new Error('لم يتوفر ملف صوتي في مخرجات النموذج');
      }

      // Convert raw PCM to a valid WAV file with 44-byte RIFF header
      const wavBase64 = ensureWavHeader(rawAudioBase64, 24000, 1, 16);

      res.json({
        success: true,
        audioData: wavBase64,
        mimeType: 'audio/wav'
      });
    } catch (error: any) {
      console.error('Gemini TTS error:', error);
      res.status(500).json({
        error: error.message || 'حدث خطأ أثناء توليد القراءة الصوتية بالذكاء الاصطناعي'
      });
    }
  });

  // Prayer times API endpoint (proxying Aladhan API)
  app.get('/api/prayers', async (req, res) => {
    try {
      const lat = req.query.lat || '21.4225'; // Default Makkah
      const lng = req.query.lng || '39.8262';
      const city = req.query.city;

      let apiUrl = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=4`;
      if (city) {
        apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(String(city))}&country=&method=4`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch prayer times');
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Prayer times error:', error);
      res.status(500).json({ error: 'Failed to fetch prayer times' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quran server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
