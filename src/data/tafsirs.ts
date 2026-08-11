import { TafsirSource } from '../types';

export const TAFSIRS: TafsirSource[] = [
  {
    id: 'ar.muyassar',
    name: 'التفسير الميسر',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    language: 'ar'
  },
  {
    id: 'ar.saadi',
    name: 'تفسير السعدي (تيسير الكريم الرحمن)',
    author: 'الشيخ عبد الرحمن بن ناصر السعدي',
    language: 'ar'
  },
  {
    id: 'ar.ibnkathir',
    name: 'تفسير ابن كثير (تفسير القرآن العظيم)',
    author: 'الإمام ابن كثير الدمشقي',
    language: 'ar'
  },
  {
    id: 'ar.jalalayn',
    name: 'تفسير الجلالين',
    author: 'جلال الدين المحلي وجلال الدين السيوطي',
    language: 'ar'
  },
  {
    id: 'ar.baghawy',
    name: 'تفسير البغوي (معالم التنزيل)',
    author: 'الإمام البغوي',
    language: 'ar'
  },
  {
    id: 'ar.qurtubi',
    name: 'تفسير القرطبي (الجامع لأحكام القرآن)',
    author: 'الإمام القرطبي',
    language: 'ar'
  }
];

export const TRANSLATIONS = [
  { id: 'en.sahih', name: 'English - Saheeh International', language: 'en' },
  { id: 'fr.hamidullah', name: 'Français - Muhammad Hamidullah', language: 'fr' },
  { id: 'ur.jalandhry', name: 'اردو - Fateh Muhammad Jalandhry', language: 'ur' },
  { id: 'tr.ozturk', name: 'Türkçe - Yasar Nuri Ozturk', language: 'tr' },
  { id: 'id.indonesian', name: 'Bahasa Indonesia', language: 'id' }
];
