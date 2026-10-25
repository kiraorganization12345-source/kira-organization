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
  },
  {
    id: 'indigo',
    name: 'نيلي كحلي',
    subtext: 'السافير العميق والراقي',
    hex: '#6366f1',
    badgeBg: 'bg-indigo-500',
    cardActiveClasses: 'bg-indigo-500/15 border-r-[6px] border-r-indigo-500 border-indigo-500/70 shadow-lg shadow-indigo-500/5',
    inlineActiveClasses: 'bg-indigo-400/35 dark:bg-indigo-400/30 text-indigo-950 dark:text-indigo-100 font-bold',
    bannerBadgeClasses: 'bg-indigo-500 text-white font-bold',
    borderAccent: 'border-indigo-500',
    swatchClass: 'bg-indigo-500'
  },
  {
    id: 'rose',
    name: 'وردي زهر الرمان',
    subtext: 'الوردي الفاتن اللطيف',
    hex: '#ec4899',
    badgeBg: 'bg-pink-500',
    cardActiveClasses: 'bg-pink-500/15 border-r-[6px] border-r-pink-500 border-pink-500/70 shadow-lg shadow-pink-500/5',
    inlineActiveClasses: 'bg-pink-400/35 dark:bg-pink-400/30 text-pink-950 dark:text-pink-100 font-bold',
    bannerBadgeClasses: 'bg-pink-500 text-white font-bold',
    borderAccent: 'border-pink-500',
    swatchClass: 'bg-pink-500'
  },
  {
    id: 'mint',
    name: 'أخضر نعناعي',
    subtext: 'النضارة والإشراق',
    hex: '#10b981',
    badgeBg: 'bg-emerald-400',
    cardActiveClasses: 'bg-emerald-400/20 border-r-[6px] border-r-emerald-400 border-emerald-400/80 shadow-lg shadow-emerald-400/5',
    inlineActiveClasses: 'bg-emerald-300/40 dark:bg-emerald-400/35 text-emerald-950 dark:text-emerald-50 font-bold',
    bannerBadgeClasses: 'bg-emerald-400 text-stone-950 font-bold',
    borderAccent: 'border-emerald-400',
    swatchClass: 'bg-emerald-400'
  },
  {
    id: 'gold',
    name: 'أصفر مذهب نقي',
    subtext: 'إشعاع التذهيب القرآني',
    hex: '#eab308',
    badgeBg: 'bg-yellow-400',
    cardActiveClasses: 'bg-yellow-400/20 border-r-[6px] border-r-yellow-400 border-yellow-400/80 shadow-lg shadow-yellow-400/5',
    inlineActiveClasses: 'bg-yellow-300/45 dark:bg-yellow-400/35 text-yellow-950 dark:text-yellow-50 font-bold',
    bannerBadgeClasses: 'bg-yellow-400 text-stone-950 font-bold',
    borderAccent: 'border-yellow-400',
    swatchClass: 'bg-yellow-400'
  },
  {
    id: 'bronze',
    name: 'بني عثماني نحاسي',
    subtext: 'المخطوطات القديمة',
    hex: '#b45309',
    badgeBg: 'bg-amber-700',
    cardActiveClasses: 'bg-amber-700/20 border-r-[6px] border-r-amber-700 border-amber-700/80 shadow-lg shadow-amber-700/5',
    inlineActiveClasses: 'bg-amber-600/35 dark:bg-amber-600/30 text-amber-950 dark:text-amber-100 font-bold',
    bannerBadgeClasses: 'bg-amber-700 text-amber-100 font-bold',
    borderAccent: 'border-amber-700',
    swatchClass: 'bg-amber-700'
  },
  {
    id: 'silver',
    name: 'فضي بلاتيني',
    subtext: 'هادئ ومحايد للمصحف',
    hex: '#94a3b8',
    badgeBg: 'bg-slate-400',
    cardActiveClasses: 'bg-slate-500/20 border-r-[6px] border-r-slate-400 border-slate-400/80 shadow-lg shadow-slate-400/5',
    inlineActiveClasses: 'bg-slate-400/35 dark:bg-slate-400/30 text-slate-950 dark:text-slate-100 font-bold',
    bannerBadgeClasses: 'bg-slate-400 text-stone-950 font-bold',
    borderAccent: 'border-slate-400',
    swatchClass: 'bg-slate-400'
  }
];

export const getTrackingColorConfig = (color?: string | TrackingHighlightColor): TrackingColorConfig => {
  if (!color) return TRACKING_COLORS[0];
  return TRACKING_COLORS.find(c => c.id === color) || TRACKING_COLORS[0];
};
