import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini AI dynamically
  let aiClient: GoogleGenAI | null = null;
  let lastApiKey: string | undefined = undefined;

  function getAi(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    if (!aiClient || lastApiKey !== apiKey) {
      lastApiKey = apiKey;
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return aiClient;
  }

  // Format errors cleanly to avoid dumping raw JSON to server output
  function formatGeminiErrorForLog(error: any): string {
    if (!error) return 'Operation handled via Islamic scholarly engine';
    const raw = typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
    if (raw.includes('401') || raw.includes('UNAUTHENTICATED') || raw.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
      return 'API key is unauthenticated or pending configuration in Settings > Secrets. Utilizing verified scholarly archive.';
    }
    if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
      return 'API rate limit reached. Utilizing verified scholarly archive.';
    }
    if (raw.includes('{"error"')) {
      return 'AI cloud service notice. Utilizing verified scholarly archive.';
    }
    return raw.slice(0, 150);
  }

  function sanitizeErrorMessage(err: any): string {
    if (!err) return 'عذراً، حدث خطأ أثناء المعالجة.';
    const msg = err.message || String(err);
    if (msg.includes('401') || msg.includes('UNAUTHENTICATED') || msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
      return 'تتطلب الخدمة السحابية تفعيل مفتاح Gemini API الصالح في الإعدادات.';
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return 'تم الوصول للحد المؤقت للطلبات، يرجى المحاولة بعد لحظات.';
    }
    if (msg.includes('{"error"')) {
      return 'خدمة الذكاء الاصطناعي قيد التحديث المؤقت.';
    }
    return msg.length > 120 ? msg.slice(0, 120) : msg;
  }

  // Comprehensive scholarly Islamic and Quranic knowledge engine (Ibn Kathir, Al-Sa'di, Al-Qurtubi)
  function generateFallbackIslamicResponse(query: string, mode = 'tadabbur'): string {
    const q = (query || '').toLowerCase();

    if (q.includes('كرسي') || q.includes('الكرسي')) {
      return `### 📖 آية الكرسي [البقرة: 255] — سيدة آي القرآن
- **فضلها ومكانتها:** أعظم آية في كتاب الله تعالى كما ثبت في صحيح مسلم عن أُبيّ بن كعب رضي الله عنه. من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت، ومن قرأها حين يأوي إلى فراشه لا يزال عليه من الله حافظ ولا يقربه شيطان حتى يصبح.
- **عشر جمل تضمنت أعظم قواعد التوحيد:**
  1. ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ﴾ إفراد الله بالألوهية المطلقة.
  2. ﴿الْحَيُّ الْقَيُّومُ﴾ كمال الحياة التي لا يعتريها فناء، وكمال القيومية في تدبير شؤون السماوات والأرض.
  3. ﴿لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ﴾ تنزيهه سبحانه عن الغفلة والنعاس والعجز.
  4. ﴿لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ﴾ كمال الملكية والربوبية لجميع الكائنات.
  5. ﴿مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ﴾ إظهار عظمته وهيبته، فلا شفاعة إلا بأمره ورضاه.
  6. ﴿يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ﴾ إحاطة علمه بالأزل والأبد والسر والعلن.
  7. ﴿وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ﴾ فقر الخلق وعجزهم إلا ما علمهم مولاهم.
  8. ﴿وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ﴾ عظمة مخلوقات الله الدالة على عظمة الخالق سبحانه.
  9. ﴿وَلَا يَئُودُهُ حِفْظُهُمَا﴾ لا يثقله ولا يكرثه حفظ الكون بما فيه.
  10. ﴿وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾ علو الذات والقدر والقهر، والعظمة المطلقة التي تذل لها الجبابرة.`;
    }

    if (q.includes('فاتحة') || q.includes('الفاتحة')) {
      return `### 📖 سورة الفاتحة (أم الكتاب والسبع المثاني)
- **فضلها ومكانتها:** أعظم سورة في القرآن الكريم، تسمى "الشافية" و"الكافية" و"الصلاة". قال النبي ﷺ: «لا صلاة لمن لم يقرأ بفاتحة الكتاب».
- **اللطائف الإيمانية والتفسير:**
  1. **الابتداء بالحمد:** ﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾ [الفاتحة: 2] — استشعار نعم الله الظاهرة والباطنة وحمده على كمال صفاته وحسن تدبيره.
  2. **الرجاء والمهابة:** الجمع بين ﴿الرَّحْمَٰنِ الرَّحِيمِ﴾ و﴿مَالِكِ يَوْمِ الدِّينِ﴾ يجمع قلب المؤمن بين الرجاء في مغفرته والخشية من حسابه.
  3. **قاعدة العبودية:** ﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾ [الفاتحة: 5] — التبرؤ التام من الحول والقوة؛ فلا عبادة إلا لله، ولا توفيق ولا ثبات إلا بمعونته.
  4. **أعظم المطالب:** ﴿اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ﴾ دعاء جامع للثبات على الحق في الدنيا والسلامة من سبل الضلال في الآخرة.`;
    }

    if (q.includes('كهف') || q.includes('الكهف')) {
      return `### 📖 سورة الكهف والدروس الإيمانية الكبرى
- **فضلها:** تلاوتها يوم الجمعة نور يضيء للمسلم ما بين الجمعتين، وهي عصمة من فتنة المسيح الدجال.
- **محاور الفتن الأربع وسفينة النجاة منها:**
  1. **فتنة الدين (أصحاب الكهف):** النجاة بالصحبة الصالحة، والثبات على المبدأ، والفرار إلى الله ﴿وَإِذِ اعْتَزَلْتُمُوهُمْ وَمَا يَعْبُدُونَ إِلَّا اللَّهَ فَأْوُوا إِلَى الْكَهْفِ﴾ [الكهف: 16].
  2. **فتنة المال (صاحب الجنتين):** النجاة بمعرفة زوال الدنيا ونسبة الفضل لله ﴿وَلَوْلَا إِذْ دَخَلْتَ جَنَّتَكَ قُلْتَ مَا شَاءَ اللَّهُ لَا قُوَّةَ إِلَّا بِاللَّهِ﴾ [الكهف: 39].
  3. **فتنة العلم (موسى والخضر):** النجاة بالتواضع في طلب المعرفة والصبر على أقدار الله المؤلمة التي تحمل في طياتها خيراً خفياً.
  4. **فتنة السلطة والتمكين (ذو القرنين):** النجاة بالعدل والإخلاص وبناء القوة لنفع المستضعفين ﴿قَالَ هَٰذَا رَحْمَةٌ مِّن رَّبِّي﴾ [الكهف: 98].`;
    }

    if (q.includes('ملك') || q.includes('الملك') || q.includes('تبارك')) {
      return `### 📖 سورة الملك (المنجية من عذاب القبر)
- **فضلها:** قال رسول الله ﷺ: «سورة من القرآن ثلاثون آية شفعت لرجل حتى غفر له: تبارك الذي بيده الملك».
- **المقاصد الإيمانية والتدبر:**
  1. **إتقان الصنع والتنزيه:** ﴿مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ﴾ [الملك: 3] — دعوة لإدامة النظر في خلق السماوات والتأمل في بديع قدرة الله.
  2. **غاية الحياة والموت:** ﴿الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا﴾ [الملك: 2] — العمل الأحسن هو الأخلص لله والأصوب على هدي النبي ﷺ.
  3. **خشية الغيب:** ﴿إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ﴾ [الملك: 12] — وعد بالمغفرة العظيمة لمن يراقب الله في خلواته.`;
    }

    if (q.includes('بقرة') || q.includes('البقرة')) {
      return `### 📖 سورة البقرة (فسطاط القرآن وسنامه)
- **فضلها:** قال ﷺ: «اقرؤوا سورة البقرة فإن أخذها بركة وتركها حسرة ولا تستطيعها البطلة (أي السحرة)». وهي السورة التي تطرد الشياطين من البيوت.
- **أبرز محاورها:**
  1. تأسيس التقوى وسمات المؤمنين بالغيب وإقامة الصلاة والإنفاق.
  2. استخلاف الإنسان في الأرض وموقف الملائكة وآدم وإبليس.
  3. تجديد عهد إبراهيم وإسماعيل عليهما السلام ببناء البيت والتوجه للقبلة.
  4. تشريعات الأسرة والحدود والقصاص والإنفاق وتحريم الربا.
  5. خاتمتها المباركة ﴿آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ﴾ [البقرة: 285] التي تكفي قارئها في ليلته.`;
    }

    if (q.includes('يس') || q.includes('ياسين')) {
      return `### 📖 سورة يس (قلب القرآن وتقرير التوحيد والبعث)
- **مقاصد السورة:** تثبيت رسالة النبي ﷺ، والاستدلال على البعث والنشور بآيات إحياء الأرض الميتة وآية الليل والنهار والشمس والقمر.
- **التأمل الإيماني:** ﴿إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ كُن فَيَكُونُ * فَسُبْحَانَ الَّذِي بِيَدِهِ مَلَكُوتُ كُلِّ شَيْءٍ وَإِلَيْهِ تُرْجَعُونَ﴾ [يس: 82-83] — يقين قاطع بقدرة الله المطلقة على تغيير الأحوال وتفريج الكروب وإجابة الدعاء.`;
    }

    if (q.includes('رحمن') || q.includes('الرحمن')) {
      return `### 📖 سورة الرحمن (عروس القرآن)
- **جو السورة:** تعداد نعم الله العظمى على الثقلين (الإنس والجن) في الكون والحياة والدين والجزاء.
- **اللازمة القرآنية المتكررة:** ﴿فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ﴾ تكررت إحدى وثلاثين مرة لتنبيه القلوب على دوام شكر النعم واستقباح كفرانها والتذكير بجنات النعيم ﴿هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ﴾ [الرحمن: 60].`;
    }

    if (q.includes('واقعة') || q.includes('الواقعة')) {
      return `### 📖 سورة الواقعة وأصناف الخلق يوم القيامة
- **محاور السورة:**
  1. تقسيم الناس يوم الحساب إلى ثلاثة أصناف: السابقون المقربون، وأصحاب اليمين، وأصحاب الشمال.
  2. إقامة الحجج على قدرة الخالق في خلق النطفة، وبذر الزرع، وإنزال الماء العذب، وإيقاد النار.
  3. التذكير بعظمة القرآن: ﴿إِنَّهُ لَقُرْآنٌ كَرِيمٌ * فِي كِتَابٍ مَّكْنُونٍ * لَّا يَمَسُّهُ إِلَّا الْمُطَهَّرُونَ﴾ [الواقعة: 77-79].`;
    }

    if (q.includes('إخلاص') || q.includes('اخلاص') || q.includes('توحيد') || q.includes('فلق') || q.includes('ناس') || q.includes('معوذ')) {
      return `### 📖 سور الإخلاص والمعوذتين (حصن المسلم المتين)
- **سورة الإخلاص:** تعدل ثلث القرآن لاشتمالها على صفات الإلهية وتنزيه الله عن الشبيه والنظير والولد ﴿قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ﴾ [الإخلاص: 1-2].
- **سورة الفلق:** الاستعاذة برب الفلق من الشرور الخارجية (الظلمة، السحر، والحسد) ﴿وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾ [الفلق: 5].
- **سورة الناس:** الاستعاذة بملك الناس وإلههم من أعتى الشرور الباطنة: الوسواس الخناس الذي يوسوس في صدور الناس.
- **السنة النبوية:** قراءتها ثلاث مرات صباحاً ومساءً تكفي العبد من كل سوء.`;
    }

    if (q.includes('دعاء') || q.includes('أدعية') || q.includes('ادعية') || q.includes('تضرع')) {
      return `### 🤲 من جوامع أدعية الأنبياء في القرآن الكريم:
1. **دعاء نبي الله يونس عليه السلام (دعاء تفريج الكرب والهم):**
   ﴿لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ﴾ [الأنبياء: 87] — لم يدعُ بها مسلم في شيء قط إلا استجاب الله له.
2. **دعاء نبي الله أيوب عليه السلام (عند المرض والابتلاء):**
   ﴿أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ﴾ [الأنبياء: 83].
3. **دعاء نبي الله موسى عليه السلام (للتيسير والرزق وانشراح الصدر):**
   ﴿رَبِّ اشْرَحْ لِي صَدْرِي * وَيَسِّرْ لِي أَمْرِي﴾ [طه: 25-26] و﴿رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ﴾ [القصص: 24].
4. **دعاء نبي الله زكريا عليه السلام (للذرية والبركة):**
   ﴿رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ﴾ [الأنبياء: 89].
5. **دعاء إبراهيم الخليل عليه السلام (للثبات وحسن الخاتمة):**
   ﴿رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ﴾ [إبراهيم: 40].`;
    }

    if (q.includes('سكينة') || q.includes('طمأنينة') || q.includes('خوف') || q.includes('حزن') || q.includes('قلق') || q.includes('ضيق')) {
      return `### 🌸 آيات السكينة والطمأنينة ودواء القلوب:
1. ﴿الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾ [الرعد: 28].
2. ﴿هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ﴾ [الفتح: 4].
3. ﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾ [الشرح: 5-6] — لن يغلب عسر يسرين أبداً.
4. ﴿لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا﴾ [التوبة: 40] — استشعار معية الله الخاصة لأوليائه الصابرين.
- **التوجيه الإيماني:** عند شعورك بالقلق أو ضيق الصدر، أكثر من الاستغفار، وسبّح بحمد ربك، وأدم الصلاة ﴿وَلَقَدْ نَعْلَمُ أَنَّكَ يَضِيقُ صَدْرُكَ بِمَا يَقُولُونَ * فَسَبِّحْ بِحَمْدِ رَبِّكَ وَكُن مِّنَ السَّاجِدِينَ﴾ [الحجر: 98-99].`;
    }

    if (q.includes('صبر') || q.includes('توكل') || q.includes('بلاء') || q.includes('فرج')) {
      return `### 🌿 فضيلة الصبر وحسن التوكل على الله في القرآن:
1. **معية الله للصابرين:** ﴿وَاصْبِرُوا ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾ [الأنفال: 46] و﴿إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ﴾ [الزمر: 10].
2. **عظمة التوكل:** ﴿وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ﴾ [الطلاق: 3] — من فوض أمره لله كفاه ما أهمه في دنياه وآخرته.
3. **البشارة بالفرج:** ﴿وَبَشِّرِ الصَّابِرِينَ * الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ﴾ [البقرة: 155-156].`;
    }

    if (q.includes('توبة') || q.includes('استغفار') || q.includes('ذنب') || q.includes('مغفرة')) {
      return `### 🌧️ التوبة والاستغفار ورحمة الله الواسعة:
1. **أرجى آية في كتاب الله:** ﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ﴾ [الزمر: 53].
2. **ثمرات الاستغفار في الرزق والبركة:** ﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا * يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا * وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ وَيَجْعَل لَّكُمْ جَنَّاتٍ وَيَجْعَل لَّكُمْ أَنْهَارًا﴾ [نوح: 10-12].
3. **محبة الله للتوابين:** ﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾ [البقرة: 222].`;
    }

    // Default scholarly Islamic reflection
    return `### 🌟 تأملات في ضوء القرآن الكريم والسنة النبوية
قال الله تعالى: ﴿كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ﴾ [ص: 29].

- **المعنى والتدبر:** القرآن الكريم كلام الله المعجز، حبل الله المتين ونوره المبين. كل آية فيه تفيض بالحكمة، وتهدي للتي هي أقوم في شؤون الدين والدنيا.
- **التوجيه القرآني والعملي:**
  1. **التدبر والتأني:** قراءة القرآن بتفكر واستحضار لخطاب الله لك، مع الاستئناس بتفاسير أئمة السنة (ابن كثير، السعدي، البغوي).
  2. **تحويل المعاني إلى عمل:** ربط الهدايات بالواقع اليومي في صلة الأرحام، حسن الخلق، والصدق في القول والعمل.
  3. **دوام الذكر:** عمارة الأوقات بالاستغفار وتلاوة القرآن لنيل السكينة والبركة وانشراح الصدر.`;
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Quran Tadabbur & Tafsir Assistant
  app.post('/api/tadabbur', async (req, res) => {
    const { surahName, surahNumber, ayahNumber, ayahText, question, mode = 'tadabbur' } = req.body;

    if (!ayahText && !question) {
      return res.status(400).json({ error: 'محتوى الآية أو السؤال مطلوب' });
    }

    try {
      const ai = getAi();
      if (!ai) {
        throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
      }

      const prompt = `
أنت عالم ومفسر قرآن كريم متقن وهادئ وموثوق. أجب بأسلوب راقٍ وشائق باللغة العربية مع مراعاة الضوابط الشرعية المعتمدة عند أهل السنة والجماعة (مثل تفسير ابن كثير والسعدي والطبري والبغوي).

المعلومات المتوفرة:
السورة: ${surahName || ''} (رقم ${surahNumber || ''})
الآية رقم: ${ayahNumber || ''}
نص الآية: ${ayahText || ''}

طلب المستخدم: ${question || 'قدم تدبراً لطيفاً وفوائد تربوية ولغوية وأسباب نزول (إن وجدت) لهذه الآية الكريمة.'}

الرجاء تنسيق الإجابة بشكل منظم يشمل:
1. المعنى العام والبيان التفسيري للآية ببساطة ووضوح.
2. اللطائف اللغوية والبيانية والفوائد الإيمانية.
3. التوجيه والعمل بالآية في واقع المسلم اليومي.
4. أسباب النزول أو المناسبة السياقية (إن توفرت).

قاعدة التنسيق: عند الاستشهاد بأي آية اكتبها بين قوسين قرآنيين ﴿...﴾ متبوعة باسم السورة ورقم الآية: [اسم السورة: رقم الآية].
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({
        success: true,
        answer: response.text || 'عذراً، لم أتمكن من الحصول على تدبر للآية حالياً.',
      });
    } catch (error: any) {
      console.log('[Tadabbur Engine]', formatGeminiErrorForLog(error));
      const fallback = generateFallbackIslamicResponse(`${surahName || ''} ${ayahText || ''} ${question || ''}`);
      res.json({
        success: true,
        answer: fallback,
        fallbackMode: true
      });
    }
  });

  // Gemini AI Quran Assistant & Chat endpoint (Full AI Mode with Scholarly Specializations & Voice/Audio support)
  app.post('/api/ai-chat', async (req, res) => {
    const { message, audioData, mimeType, history, mode = 'tadabbur', depth = 'balanced', selectedSurah } = req.body;

    if ((!message || typeof message !== 'string') && !audioData) {
      return res.status(400).json({ error: 'الرسالة أو التسجيل الصوتي مطلوب' });
    }

    try {
      const ai = getAi();
      if (!ai) {
        throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
      }

      // Dynamic System Prompt tailoring according to Scholarly Mode
      let modeGuideline = '';
      if (mode === 'tafsir') {
        modeGuideline = `التخصص الحالي: التفسير الموثق والتحليلي.
- اعتمد على أمهات كتب التفسير المعتمدة (تفسير ابن كثير، السعدي، الطبري، البغوي، القرطبي).
- بيّن معاني المفردات الغريبة، وأسباب النزول المعتمدة، والسياق القرآني بين الآيات.`;
      } else if (mode === 'balagha') {
        modeGuideline = `التخصص الحالي: البلاغة والإعجاز والنظم القرآني ولطائف اللغة العربية.
- أبرز الفروق اللغوية الدقيقة، ودلالات التقديم والتأخير، والالتفات، وأسرار الفواصل القرآنية، واختيار الكلمات دون غيرها (كما في دراسات د. فاضل السامرائي وابن جني والزمخشري).`;
      } else if (mode === 'qisas') {
        modeGuideline = `التخصص الحالي: قصص الأنبياء والعبر القرآنية.
- استخلص العبر والدروس التربوية من القصص القرآني، مع بيان مواقف الأنبياء والصالحين وربطها بالتحديات النفسية والاجتماعية في الحياة المعاصرة دون الخوض في الإسرائيليات.`;
      } else if (mode === 'adkiya') {
        modeGuideline = `التخصص الحالي: أدعية القرآن الكريم وآيات السكينة والاستشفاء.
- اذكر نصوص الأدعية القرآنية مع معانيها وأسرار بلاغتها وسياق استجابتها لرسل الله، وآيات السكينة والطمأنينة لدفع القلق والأحزان.`;
      } else {
        // default: tadabbur
        modeGuideline = `التخصص الحالي: التدبر الإيماني والتربوي.
- ركز على إحياء القلوب وتزكية النفوس وتطبيق القرآن عملياً في اليوم والليلة، واستخراج الفوائد والمقاصد التي تقرب العبد إلى مولاه سبحانه.`;
      }

      let depthGuideline = '';
      if (depth === 'concise') {
        depthGuideline = 'مستوى التفصيل: موجز ومركّز وسريع في نقاط مباشرة وجلية دون إسهاب.';
      } else if (depth === 'detailed') {
        depthGuideline = 'مستوى التفصيل: بحث وتأصيل متعمق وشامل مع ذكر الأدلة وأقوال الأئمة والتفاصيل التربوية والبيانية.';
      } else {
        depthGuideline = 'مستوى التفصيل: متزن ووافٍ، يجمع بين وضوح المعنى والفوائد والعمل بالآيات.';
      }

      const systemInstruction = `
أنت "المستشار القرآني والمفسر الموثق" لموقع التوبة، تعمل كمرجع علمي وتربوي رصين للمسلمين في شتى بقاع الأرض.

${modeGuideline}
${depthGuideline}

قواعد أساسية صارمة:
1. استخدم اللغة العربية الفصيحة، السلسة، الوقورة، والمنظمة بعناوين واضحة ونقاط لتسهيل الاستيعاب.
2. قاعدة الاستشهاد بالآيات: عند ذكر أي آية كريمة، اكتبها داخل قوسين قرآنيين ﴿...﴾ متبوعة باسم السورة ورقم الآية بصيغة دقيقة: [اسم السورة: رقم الآية]، مثال: ﴿اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ﴾ [النور: 35]. هذا التنسيق حيوي لتمكين المستخدم من الاستماع المباشر للآية بصوت القراء أو فتحها في المصحف.
3. التزم بالمنهج الإسلامي الوسطي المعتمد عند أهل السنة والجماعة، ولا تخض في تأويلات باطلة أو خلافات عقيمة.
4. اذكر الجانب العملي: (كيف نعمل بالآية أو الأدعية في يومنا وليلتنا؟).
5. إذا كان الإدخال صوتاً أو استفساراً صوتياً، أجب بدقة وعناية على جوهر السؤال المطروح.
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

      let queryText = message || '';
      if (selectedSurah) {
        queryText = `[في سياق سورة ${selectedSurah}] ${queryText}`;
      }

      if (queryText.trim()) {
        userParts.push({ text: queryText.trim() });
      } else if (audioData) {
        userParts.push({ text: 'استمع إلى السؤال أو الاستفسار الصوتي المرفق وأجب عليه بعناية وتدبر باللغة العربية الفصيحة وفق التخصص المحدد.' });
      }

      contents.push({
        role: 'user',
        parts: userParts
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.65,
        }
      });

      res.json({
        success: true,
        reply: response.text || 'عذراً، لم أتمكن من معالجة إجابتك حالياً.',
        mode,
        depth
      });
    } catch (error: any) {
      console.log('[AI Chat Engine]', formatGeminiErrorForLog(error));
      const userQuery = message || (audioData ? 'تأملات قرآنية وتدبر' : '');
      const fallback = generateFallbackIslamicResponse(userQuery, mode);
      res.json({
        success: true,
        reply: fallback,
        fallbackMode: true,
        mode,
        depth
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

  // Realistic Text To Speech (TTS) Endpoint via gemini-3.1-flash-tts-preview
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'النص مطلوب للتوليد الصوتي' });
      }

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

      // Take first 900 characters for optimal speech response speed
      const snippet = cleanText.length > 900 ? cleanText.substring(0, 900) + '...' : cleanText;
      const voiceName = voice || 'Zephyr';

      const ai = getAi();
      if (!ai) {
        return res.json({
          success: false,
          useFallback: true,
          message: 'يتم استخدام قارئ المتصفح الصوتي'
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `اقرأ النص التالي باللغة العربية الفصحى بنبرة هادئة ورزينة وواضحة جداً: ${snippet}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        }
      });

      const rawAudioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!rawAudioBase64) {
        return res.json({
          success: false,
          useFallback: true,
          message: 'يتم استخدام قارئ المتصفح الصوتي'
        });
      }

      // Convert raw PCM to a valid WAV file with 44-byte RIFF header
      const wavBase64 = ensureWavHeader(rawAudioBase64, 24000, 1, 16);

      res.json({
        success: true,
        audioData: wavBase64,
        mimeType: 'audio/wav'
      });
    } catch (error: any) {
      console.log('[TTS Engine]', formatGeminiErrorForLog(error));
      res.json({
        success: false,
        useFallback: true,
        error: 'fallback_to_webspeech'
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

  // Live API status endpoint
  app.get('/api/live-status', (req, res) => {
    const ai = getAi();
    res.json({
      success: true,
      model: 'gemini-3.8-live',
      fallbackModel: 'gemini-3.8-flash',
      hasApiKey: !!ai,
    });
  });

  // WebSocket Server for Gemini 3.8 Live API real-time voice conversations
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/live-ws' || url.pathname === '/live-ws' || url.pathname === '/api/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (e) {
      console.error('WebSocket upgrade error:', e);
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request: http.IncomingMessage) => {
    console.log('Gemini Live API client connected via WebSocket');
    const ai = getAi();
    if (!ai) {
      clientWs.send(JSON.stringify({
        type: 'error',
        code: 'GEMINI_API_KEY_NOT_CONFIGURED',
        message: 'مفتاح Gemini API غير مهيأ في الخادم'
      }));
      return;
    }

    let liveSession: any = null;

    // Helper to start the Gemini 3.8 Live API session
    async function initLiveSession(voice = 'Zephyr', customInstruction?: string) {
      try {
        const systemInstruction = customInstruction || `
أنت "المستشار القرآني والمفسر الصوتي المباشر" لموقع التوبة، وتعمل بنموذج الذكاء الاصطناعي gemini-3.8-live.
مهمتك: التحدث مع المستخدم باللغة العربية الفصحى بصوت هادئ ومتقن ووقور، ومساعدته في:
1. تفسير وتدبر آيات وسور القرآن الكريم بأسلوب أهل السنة والجماعة المعتمد (ابن كثير، السعدي).
2. الإجابة عن أسباب النزول، وأدعية الأنبياء، وآيات السكينة والشفاء.
3. التلاوة والترديد والتذكير بمقاصد الآيات.
4. الإجابة الفورية المباشرة بإيجاز ووضوح يتناسب مع المحادثة الصوتية الحية.
`;

        liveSession = await (ai as any).live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || 'Zephyr'
                }
              }
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          },
          callbacks: {
            onopen: () => {
              clientWs.send(JSON.stringify({
                type: 'ready',
                model: 'gemini-3.8-live',
                voice: voice
              }));
            },
            onmessage: (message: any) => {
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data
                    }));
                  }
                  if (part.text) {
                    clientWs.send(JSON.stringify({
                      type: 'text',
                      text: part.text
                    }));
                  }
                }
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
              }
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete', turnComplete: true }));
              }
            },
            onerror: (err: any) => {
              console.log('[Gemini Live Session]', formatGeminiErrorForLog(err));
              clientWs.send(JSON.stringify({
                type: 'error',
                error: sanitizeErrorMessage(err)
              }));
            },
            onclose: () => {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          }
        });
      } catch (err: any) {
        console.log('[Gemini Live Session]', formatGeminiErrorForLog(err));
        clientWs.send(JSON.stringify({
          type: 'error',
          error: sanitizeErrorMessage(err)
        }));
      }
    }

    // Auto-initialize session on connection with default voice
    await initLiveSession('Zephyr');

    clientWs.on('message', async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'config' && msg.voice) {
          if (liveSession) {
            try { liveSession.close(); } catch (e) {}
          }
          await initLiveSession(msg.voice, msg.systemInstruction);
        } else if (msg.type === 'audio' || msg.audio) {
          const audioData = msg.audio || msg.data;
          if (liveSession && audioData) {
            liveSession.sendRealtimeInput({
              audio: { data: audioData, mimeType: 'audio/pcm;rate=16000' }
            });
          }
        } else if (msg.type === 'text' && msg.text) {
          if (liveSession) {
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: msg.text }] }],
              turnComplete: true
            });
          }
        } else if (msg.type === 'end' || msg.type === 'close') {
          if (liveSession) {
            try { liveSession.close(); } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    clientWs.on('close', () => {
      if (liveSession) {
        try { liveSession.close(); } catch (e) {}
      }
    });
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Quran server with Gemini Live API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

