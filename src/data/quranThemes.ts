import { QuranTextColor, NavThemeColor, GlobalTheme, PaperTheme } from '../types';

export interface QuranTextColorOption {
  id: QuranTextColor;
  name: string;
  subtext: string;
  previewHex: string;
  lightClass: string;
  darkClass: string;
  swatchClass: string;
}

export const QURAN_TEXT_COLOR_OPTIONS: QuranTextColorOption[] = [
  {
    id: 'default',
    name: 'الأسود الأصيل',
    subtext: 'الرسم العثماني المعتمد',
    previewHex: '#1c1917',
    lightClass: 'text-stone-950',
    darkClass: 'text-stone-100',
    swatchClass: 'bg-stone-900'
  },
  {
    id: 'emerald',
    name: 'أخضر قرآني زمردي',
    subtext: 'لون السكينة والطمأنينة',
    previewHex: '#065f46',
    lightClass: 'text-emerald-950',
    darkClass: 'text-emerald-300',
    swatchClass: 'bg-emerald-700'
  },
  {
    id: 'sepia',
    name: 'بني عثماني دافئ',
    subtext: 'مخطوطات المصاحف التاريخية',
    previewHex: '#78350f',
    lightClass: 'text-amber-950',
    darkClass: 'text-amber-200',
    swatchClass: 'bg-amber-800'
  },
  {
    id: 'gold',
    name: 'ذهبي عنبري ملوكي',
    subtext: 'التذهيب القرآني الرفيع',
    previewHex: '#b45309',
    lightClass: 'text-amber-900',
    darkClass: 'text-amber-300',
    swatchClass: 'bg-yellow-600'
  },
  {
    id: 'indigo',
    name: 'نيلي كحلي سافيري',
    subtext: 'مريح جداً للعين والقراءة المطولة',
    previewHex: '#1e3a8a',
    lightClass: 'text-blue-950',
    darkClass: 'text-blue-200',
    swatchClass: 'bg-blue-800'
  },
  {
    id: 'crimson',
    name: 'أحمر قرمزي ياقوتي',
    subtext: 'وضوح فائق ومميز للخط',
    previewHex: '#881337',
    lightClass: 'text-rose-950',
    darkClass: 'text-rose-300',
    swatchClass: 'bg-rose-800'
  },
  {
    id: 'charcoal',
    name: 'رمادي فحمي هادئ',
    subtext: 'تباين ناعم غير مجهد',
    previewHex: '#334155',
    lightClass: 'text-slate-800',
    darkClass: 'text-slate-200',
    swatchClass: 'bg-slate-700'
  }
];

export const getQuranTextColorClasses = (color?: QuranTextColor | string): string => {
  const found = QURAN_TEXT_COLOR_OPTIONS.find(o => o.id === color) || QURAN_TEXT_COLOR_OPTIONS[0];
  return `${found.lightClass} dark:${found.darkClass}`;
};

export interface NavThemeOption {
  id: NavThemeColor;
  name: string;
  subtext: string;
  previewHex: string;
  bgClasses: string;
  activeItemClasses: string;
  inactiveItemClasses: string;
  borderClasses: string;
}

export const NAV_THEME_OPTIONS: NavThemeOption[] = [
  {
    id: 'stone',
    name: 'حجر بركاني كلاسيكي',
    subtext: 'الداكن الأصيل مع لمسات ذهبية',
    previewHex: '#1c1917',
    bgClasses: 'bg-stone-950/95 text-stone-100',
    activeItemClasses: 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20',
    inactiveItemClasses: 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/60',
    borderClasses: 'border-stone-800'
  },
  {
    id: 'amber',
    name: 'ذهبي عنبري فاخر',
    subtext: 'طابع ذهبي مشرق وفاخر',
    previewHex: '#78350f',
    bgClasses: 'bg-stone-950/95 text-amber-100',
    activeItemClasses: 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-md shadow-amber-500/25',
    inactiveItemClasses: 'text-amber-300/60 hover:text-amber-200 hover:bg-amber-950/50',
    borderClasses: 'border-amber-600/40'
  },
  {
    id: 'emerald',
    name: 'أخضر قرآني زمردي',
    subtext: 'هدوء وسكينة خضراء',
    previewHex: '#064e3b',
    bgClasses: 'bg-[#03241b]/95 text-emerald-100',
    activeItemClasses: 'bg-emerald-500 text-stone-950 font-bold shadow-md shadow-emerald-500/25',
    inactiveItemClasses: 'text-emerald-300/60 hover:text-emerald-100 hover:bg-emerald-900/50',
    borderClasses: 'border-emerald-700/50'
  },
  {
    id: 'navy',
    name: 'كحلي ليلي ملكي',
    subtext: 'أزرق داكن وسماء الليل',
    previewHex: '#0f172a',
    bgClasses: 'bg-[#091124]/95 text-sky-100',
    activeItemClasses: 'bg-sky-500 text-stone-950 font-bold shadow-md shadow-sky-500/25',
    inactiveItemClasses: 'text-sky-300/60 hover:text-sky-100 hover:bg-sky-950/50',
    borderClasses: 'border-sky-800/40'
  },
  {
    id: 'crimson',
    name: 'قرمزي ياقوتي مميز',
    subtext: 'عنابي فاخر مع توهج راقٍ',
    previewHex: '#4c0519',
    bgClasses: 'bg-[#29040e]/95 text-rose-100',
    activeItemClasses: 'bg-rose-500 text-stone-950 font-bold shadow-md shadow-rose-500/25',
    inactiveItemClasses: 'text-rose-300/60 hover:text-rose-100 hover:bg-rose-950/50',
    borderClasses: 'border-rose-800/40'
  },
  {
    id: 'sepia',
    name: 'مخطوطة عثمانية',
    subtext: 'بني دافئ مستوحى من التراث',
    previewHex: '#38200f',
    bgClasses: 'bg-[#211309]/95 text-amber-100',
    activeItemClasses: 'bg-amber-600 text-stone-950 font-bold shadow-md shadow-amber-600/25',
    inactiveItemClasses: 'text-amber-300/60 hover:text-amber-100 hover:bg-amber-950/50',
    borderClasses: 'border-amber-800/50'
  }
];

export const getNavThemeConfig = (theme?: NavThemeColor | string): NavThemeOption => {
  return NAV_THEME_OPTIONS.find(t => t.id === theme) || NAV_THEME_OPTIONS[0];
};

export interface GlobalThemeOption {
  id: GlobalTheme;
  name: string;
  subtext: string;
  previewHex: string;
}

export const GLOBAL_THEME_OPTIONS: GlobalThemeOption[] = [
  {
    id: 'amber',
    name: 'الذهبي الملكي (الافتراضي)',
    subtext: 'تذهيب عنبري أصيل ودفء إيماني',
    previewHex: '#f59e0b'
  },
  {
    id: 'emerald',
    name: 'الأخضر الزمردي الإسلامي',
    subtext: 'رمز السلام والسكينة والروضة الشريفة',
    previewHex: '#10b981'
  },
  {
    id: 'sapphire',
    name: 'الأزرق الياقوتي (سافير)',
    subtext: 'عمق وسكينة الليل المهدئة للبصر',
    previewHex: '#3b82f6'
  },
  {
    id: 'amethyst',
    name: 'الأرجواني الأندلسي',
    subtext: 'فخامة ووقار التراث العربي',
    previewHex: '#8b5cf6'
  },
  {
    id: 'ruby',
    name: 'الأحمر الياقوتي النبيل',
    subtext: 'تباين ناصع وجاذبية بصرية فريدة',
    previewHex: '#f43f5e'
  },
  {
    id: 'teal',
    name: 'الفيروزي المحيطي الهادئ',
    subtext: 'راحة بصرية مائية ونقاء هادئ',
    previewHex: '#06b6d4'
  },
  {
    id: 'sepia',
    name: 'البني العثماني التراثي',
    subtext: 'دفء المخطوطات والورق العتيق',
    previewHex: '#d97706'
  }
];

export interface PaperThemeOption {
  id: PaperTheme;
  name: string;
  subtext: string;
  previewBg: string;
  previewBorder: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const PAPER_THEME_OPTIONS: PaperThemeOption[] = [
  {
    id: 'dark',
    name: 'داكن بركاني ملكي',
    subtext: 'مريح للعين مع تباين راقٍ',
    previewBg: '#0c0a09',
    previewBorder: '#d97706',
    bgClass: 'bg-stone-950 text-stone-100',
    borderClass: 'border-amber-500/40',
    textClass: 'text-stone-100'
  },
  {
    id: 'amoled',
    name: 'سواد مطلق (AMOLED)',
    subtext: 'أسود نقي 100% موفر للطاقة',
    previewBg: '#000000',
    previewBorder: '#78716c',
    bgClass: 'bg-black text-stone-100',
    borderClass: 'border-stone-800',
    textClass: 'text-stone-100'
  },
  {
    id: 'sepia',
    name: 'مخطوطة أندلسية عتيقة',
    subtext: 'أوراق المصاحف التاريخية الخالدة',
    previewBg: '#211309',
    previewBorder: '#b45309',
    bgClass: 'bg-[#1f1208] text-amber-100',
    borderClass: 'border-amber-700/50',
    textClass: 'text-amber-100'
  },
  {
    id: 'emerald',
    name: 'روضة زمردية هادئة',
    subtext: 'خضرة السكينة النبوية المريحة',
    previewBg: '#03241b',
    previewBorder: '#059669',
    bgClass: 'bg-[#021d16] text-emerald-100',
    borderClass: 'border-emerald-600/50',
    textClass: 'text-emerald-100'
  },
  {
    id: 'navy',
    name: 'سماء كحلية ليلية',
    subtext: 'أزرق عميق لتدبر آناء الليل',
    previewBg: '#091124',
    previewBorder: '#2563eb',
    bgClass: 'bg-[#060c1b] text-sky-100',
    borderClass: 'border-blue-700/50',
    textClass: 'text-sky-100'
  },
  {
    id: 'cream',
    name: 'بيج عاجي هادئ',
    subtext: 'ورق كريمي دافئ مهدئ للبصر',
    previewBg: '#fbf7ee',
    previewBorder: '#b45309',
    bgClass: 'bg-[#fbf7ee] text-amber-950',
    borderClass: 'border-amber-700/30',
    textClass: 'text-amber-950'
  },
  {
    id: 'sand',
    name: 'رملي صحراوي دافئ',
    subtext: 'طابع هادئ مائل للصفرة المريحة',
    previewBg: '#fef3c7',
    previewBorder: '#d97706',
    bgClass: 'bg-amber-50 text-stone-900',
    borderClass: 'border-amber-400/40',
    textClass: 'text-stone-900'
  },
  {
    id: 'light',
    name: 'أبيض ناصع معتمد',
    subtext: 'إشراقة النهار المعتادة للمطالعة',
    previewBg: '#ffffff',
    previewBorder: '#9ca3af',
    bgClass: 'bg-white text-stone-950',
    borderClass: 'border-stone-300',
    textClass: 'text-stone-950'
  },
  {
    id: 'charcoal',
    name: 'رمادي فحمي مخملي',
    subtext: 'أناقة حيادية بلا إجهاد بصري',
    previewBg: '#1e293b',
    previewBorder: '#64748b',
    bgClass: 'bg-slate-900 text-slate-100',
    borderClass: 'border-slate-700',
    textClass: 'text-slate-100'
  }
];

export const getPaperThemeConfig = (theme?: PaperTheme | string): PaperThemeOption => {
  return PAPER_THEME_OPTIONS.find(p => p.id === theme) || PAPER_THEME_OPTIONS[0];
};
