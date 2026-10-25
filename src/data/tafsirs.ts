import { TafsirSource } from '../types';

export const TAFSIRS: TafsirSource[] = [
  {
    id: 'ar.muyassar',
    name: 'التفسير الميسر',
    shortName: 'الميسر',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    description: 'تفسير معتمد وموجز، سهل العبارة ومناسب لجميع القراء',
    language: 'ar',
    isSimplified: true
  },
  {
    id: 'ar.saadi',
    name: 'تفسير السعدي (تيسير الكريم الرحمن)',
    shortName: 'السعدي',
    author: 'الشيخ عبد الرحمن بن ناصر السعدي',
    description: 'أسلوب إيماني رائق وتربوي، خالي من الحشو والتعقيد',
    language: 'ar',
    isSimplified: true
  },
  {
    id: 'ar.jalalayn',
    name: 'تفسير الجلالين',
    shortName: 'الجلالين',
    author: 'جلال الدين المحلي وجلال الدين السيوطي',
    description: 'شديد الإيجاز، يوضح الكلمات والضمائر وإعراب المعنى مباشرة',
    language: 'ar',
    isSimplified: true
  },
  {
    id: 'ar.ibnkathir',
    name: 'تفسير ابن كثير (تفسير القرآن العظيم)',
    shortName: 'ابن كثير',
    author: 'الإمام الحافظ ابن كثير الدمشقي',
    description: 'عمدة التفسير بالمأثور والأحاديث والآثار النبوية',
    language: 'ar',
    isSimplified: false
  },
  {
    id: 'ar.baghawy',
    name: 'تفسير البغوي (معالم التنزيل)',
    shortName: 'البغوي',
    author: 'الإمام الحسين بن مسعود البغوي',
    description: 'متوسط الحجم، سليم الاعتقاد جامع لآثار الصحابة والتابعين',
    language: 'ar',
    isSimplified: false
  },
  {
    id: 'ar.qurtubi',
    name: 'تفسير القرطبي (الجامع لأحكام القرآن)',
    shortName: 'القرطبي',
    author: 'الإمام محمد بن أحمد القرطبي',
    description: 'تفسير فقهي جامع يبين الأحكام الشرعية ودلائل الآيات',
    language: 'ar',
    isSimplified: false
  }
];

export const SIMPLIFIED_TAFSIRS = TAFSIRS.filter(t => t.isSimplified);
export const CLASSICAL_TAFSIRS = TAFSIRS.filter(t => !t.isSimplified);

export const TRANSLATIONS = [
  { id: 'en.sahih', name: 'English - Saheeh International', language: 'en' },
  { id: 'fr.hamidullah', name: 'Français - Muhammad Hamidullah', language: 'fr' },
  { id: 'ur.jalandhry', name: 'اردو - Fateh Muhammad Jalandhry', language: 'ur' },
  { id: 'tr.ozturk', name: 'Türkçe - Yasar Nuri Ozturk', language: 'tr' },
  { id: 'id.indonesian', name: 'Bahasa Indonesia', language: 'id' }
];
