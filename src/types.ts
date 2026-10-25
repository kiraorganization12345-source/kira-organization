export type RevelationType = 'Meccan' | 'Medinan';

export interface SurahMeta {
  id: number;
  name: string;             // e.g. الفاتحة
  englishName: string;      // e.g. Al-Fatihah
  englishTranslation: string; // e.g. The Opening
  versesCount: number;
  revelationType: RevelationType;
  revelationOrder: number;
  startPage: number;
  juz: number;
}

export interface WordData {
  id: number;
  position: number;
  textUthmani: string;
  transliteration?: string;
  translation?: string;
}

export interface Ayah {
  number: number;              // Absolute verse number in Quran (1-6236)
  numberInSurah: number;       // Verse number within surah (1..N)
  text: string;                // Uthmani text with tashkeel
  textSimple?: string;          // Simple text without tashkeel for easy search
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
  translation?: string;
  tafsir?: string;
  audioUrl?: string;
  words?: WordData[];
}

export interface SurahDetail extends SurahMeta {
  ayahs: Ayah[];
  bismillahPre?: boolean;
}

export interface Reciter {
  id: string;
  name: string;               // Arabic name
  subtext?: string;            // Riwaya or style e.g. حفص عن عاصم
  serverUrl?: string;          // MP3 base or API identifier
  bitrate?: string;
  style?: string;
}

export interface TafsirSource {
  id: string;
  name: string;
  author: string;
  language: string;
  isSimplified?: boolean;
  shortName?: string;
  description?: string;
}

export interface Bookmark {
  id: string;                  // surahId-ayahNum
  surahId: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  createdAt: number;
  note?: string;
  tags?: string[];
}

export interface ReadingHistory {
  surahId: number;
  ayahNumber: number;
  page: number;
  timestamp: number;
}

export interface KhatmaPlan {
  id: string;
  title: string;
  targetDays: number;
  startDate: string;
  completedPages: number[];
  dailyGoalPages: number;
  isCompleted: boolean;
}

export interface AthkarItem {
  id: number;
  category: 'morning' | 'evening' | 'post_prayer' | 'quranic_duas' | 'sleep' | 'wake_up' | 'mosque' | 'tasbeeh' | 'prophetic_duas' | 'ruqyah';
  title: string;
  text: string;
  count: number;
  currentCount?: number;
  reference?: string;
  benefit?: string;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  dateStr: string;
  hijriDate: string;
  city: string;
}

export type ViewMode = 'surahs' | 'listening' | 'reader' | 'mushaf_page' | 'realistic_book' | 'khatma' | 'stats' | 'bookmarks' | 'search' | 'athkar' | 'prayers' | 'ai_assistant';

export type NavDisplayMode = 'expanded' | 'floating' | 'hidden';

export type FontStyle = 'Amiri Quran' | 'Scheherazade New' | 'Amiri' | 'Cairo';

export type PaperTheme = 'dark' | 'light' | 'sepia' | 'emerald' | 'navy' | 'sand' | 'amoled' | 'cream' | 'charcoal';

export type TrackingHighlightColor = 
  | 'amber' 
  | 'green' 
  | 'red' 
  | 'blue' 
  | 'purple' 
  | 'teal' 
  | 'orange'
  | 'indigo'
  | 'rose'
  | 'mint'
  | 'gold'
  | 'bronze'
  | 'silver';

export type NavThemeColor = 'stone' | 'amber' | 'emerald' | 'navy' | 'crimson' | 'sepia';

export type QuranTextColor = 'default' | 'emerald' | 'gold' | 'sepia' | 'indigo' | 'crimson' | 'charcoal';

export type GlobalTheme = 'amber' | 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'teal' | 'sepia';

export type SiteMode = 'dark' | 'light' | 'amoled' | 'warm';
