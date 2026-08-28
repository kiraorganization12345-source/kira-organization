import { TrackingHighlightColor } from '../types';

export interface TrackingColorConfig {
  id: TrackingHighlightColor;
  name: string;
  subtext: string;
  hex: string;
  badgeBg: string;
  cardActiveClasses: string;
  inlineActiveClasses: string;
  bannerBadgeClasses: string;
  borderAccent: string;
  swatchClass: string;
}

export const TRACKING_COLORS: TrackingColorConfig[] = [
  {
    id: 'amber',
    name: 'ذهبي عنبري',
    subtext: 'الأصيل الكلاسيكي',
    hex: '#f59e0b',
    badgeBg: 'bg-amber-500',
    cardActiveClasses: 'bg-amber-500/15 border-r-[6px] border-r-amber-500 border-amber-500/70 shadow-lg shadow-amber-500/5',
    inlineActiveClasses: 'bg-amber-400/35 dark:bg-amber-400/30 text-amber-950 dark:text-amber-100 font-bold',
    bannerBadgeClasses: 'bg-amber-500 text-stone-950 font-bold',
    borderAccent: 'border-amber-500',
    swatchClass: 'bg-amber-500'
  },
  {
    id: 'green',
    name: 'أخضر قرآني',
    subtext: 'الزمردي الهادئ',
    hex: '#10b981',
    badgeBg: 'bg-emerald-500',
    cardActiveClasses: 'bg-emerald-500/15 border-r-[6px] border-r-emerald-500 border-emerald-500/70 shadow-lg shadow-emerald-500/5',
    inlineActiveClasses: 'bg-emerald-400/35 dark:bg-emerald-400/30 text-emerald-950 dark:text-emerald-100 font-bold',
    bannerBadgeClasses: 'bg-emerald-500 text-stone-950 font-bold',
    borderAccent: 'border-emerald-500',
    swatchClass: 'bg-emerald-500'
  },
  {
    id: 'red',
    name: 'أحمر ياقوتي',
    subtext: 'تمييز بارز وواضح',
    hex: '#f43f5e',
    badgeBg: 'bg-rose-500',
    cardActiveClasses: 'bg-rose-500/15 border-r-[6px] border-r-rose-500 border-rose-500/70 shadow-lg shadow-rose-500/5',
    inlineActiveClasses: 'bg-rose-400/35 dark:bg-rose-400/30 text-rose-950 dark:text-rose-100 font-bold',
    bannerBadgeClasses: 'bg-rose-500 text-white font-bold',
    borderAccent: 'border-rose-500',
    swatchClass: 'bg-rose-500'
  },
  {
    id: 'blue',
    name: 'أزرق سماوي',
    subtext: 'النيلي المريح للعين',
    hex: '#0284c7',
    badgeBg: 'bg-sky-500',
    cardActiveClasses: 'bg-sky-500/15 border-r-[6px] border-r-sky-500 border-sky-500/70 shadow-lg shadow-sky-500/5',
    inlineActiveClasses: 'bg-sky-400/35 dark:bg-sky-400/30 text-sky-950 dark:text-sky-100 font-bold',
    bannerBadgeClasses: 'bg-sky-500 text-stone-950 font-bold',
    borderAccent: 'border-sky-500',
    swatchClass: 'bg-sky-500'
  },
  {
    id: 'purple',
    name: 'بنفسجي ملكي',
    subtext: 'الأرجواني الفاخر',
    hex: '#a855f7',
    badgeBg: 'bg-purple-500',
    cardActiveClasses: 'bg-purple-500/15 border-r-[6px] border-r-purple-500 border-purple-500/70 shadow-lg shadow-purple-500/5',
    inlineActiveClasses: 'bg-purple-400/35 dark:bg-purple-400/30 text-purple-950 dark:text-purple-100 font-bold',
    bannerBadgeClasses: 'bg-purple-500 text-white font-bold',
    borderAccent: 'border-purple-500',
    swatchClass: 'bg-purple-500'
  },
  {
    id: 'teal',
    name: 'فيروزي مائي',
    subtext: 'البحري المنعش',
    hex: '#14b8a6',
    badgeBg: 'bg-teal-500',
    cardActiveClasses: 'bg-teal-500/15 border-r-[6px] border-r-teal-500 border-teal-500/70 shadow-lg shadow-teal-500/5',
    inlineActiveClasses: 'bg-teal-400/35 dark:bg-teal-400/30 text-teal-950 dark:text-teal-100 font-bold',
    bannerBadgeClasses: 'bg-teal-500 text-stone-950 font-bold',
    borderAccent: 'border-teal-500',
    swatchClass: 'bg-teal-500'
  },
  {
    id: 'orange',
    name: 'برتقالي مشرق',
    subtext: 'المرجاني الدافئ',
    hex: '#f97316',
    badgeBg: 'bg-orange-500',
    cardActiveClasses: 'bg-orange-500/15 border-r-[6px] border-r-orange-500 border-orange-500/70 shadow-lg shadow-orange-500/5',
    inlineActiveClasses: 'bg-orange-400/35 dark:bg-orange-400/30 text-orange-950 dark:text-orange-100 font-bold',
    bannerBadgeClasses: 'bg-orange-500 text-stone-950 font-bold',
    borderAccent: 'border-orange-500',
    swatchClass: 'bg-orange-500'
  }
];

export const getTrackingColorConfig = (color?: string | TrackingHighlightColor): TrackingColorConfig => {
  if (!color) return TRACKING_COLORS[0];
  return TRACKING_COLORS.find(c => c.id === color) || TRACKING_COLORS[0];
};
