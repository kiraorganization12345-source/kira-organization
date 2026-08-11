import { Reciter } from '../types';

export const RECITERS: Reciter[] = [
  {
    id: 'Alafasy_128kbps',
    name: 'مشاري راشد العفاسي',
    subtext: 'حفص عن عاصم - مرتل',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Abdul_Basit_Murattal_192kbps',
    name: 'عبد الباسط عبد الصمد (مرتل)',
    subtext: 'حفص عن عاصم - مرتل المتقن',
    bitrate: '192kbps',
    style: 'مرتل'
  },
  {
    id: 'Abdul_Basit_Mujawwad_128kbps',
    name: 'عبد الباسط عبد الصمد (مجود)',
    subtext: 'حفص عن عاصم - مجود خاشع',
    bitrate: '128kbps',
    style: 'مجود'
  },
  {
    id: 'Husary_128kbps',
    name: 'محمود خليل الحصري (مرتل)',
    subtext: 'حفص عن عاصم - معلم المتقن',
    bitrate: '128kbps',
    style: 'معلم'
  },
  {
    id: 'Husary_Mujawwad_128kbps',
    name: 'محمود خليل الحصري (مجود)',
    subtext: 'حفص عن عاصم - مجود',
    bitrate: '128kbps',
    style: 'مجود'
  },
  {
    id: 'Minshawy_Murattal_128kbps',
    name: 'محمد صديق المنشاوي (مرتل)',
    subtext: 'حفص عن عاصم - مرتل الخاشع',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Minshawy_Mujawwad_192kbps',
    name: 'محمد صديق المنشاوي (مجود)',
    subtext: 'حفص عن عاصم - مجود',
    bitrate: '192kbps',
    style: 'مجود'
  },
  {
    id: 'Muhammad_Refaat_64kbps',
    name: 'محمد رفعت',
    subtext: 'قيثارة السماء - تسجيلات خاشعة',
    bitrate: '64kbps',
    style: 'مجود'
  },
  {
    id: 'Sayeed_al_Metwally_128kbps',
    name: 'السيد متولي عبد العال',
    subtext: 'حفص عن عاصم - مجود',
    bitrate: '128kbps',
    style: 'مجود'
  },
  {
    id: 'Mostafa_Ismail_128kbps',
    name: 'مصطفى إسماعيل',
    subtext: 'سفير القرآن - مجود',
    bitrate: '128kbps',
    style: 'مجود'
  },
  {
    id: 'Mohammad_al_Tablaway_128kbps',
    name: 'محمد محمود الطبلاوي',
    subtext: 'حفص عن عاصم - مجود ومرتل',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Abdurrahmaan_As-Sudais_192kbps',
    name: 'عبد الرحمن السديس',
    subtext: 'إمام الحرم المكي',
    bitrate: '192kbps',
    style: 'مرتل'
  },
  {
    id: 'MaherAlMuaiqly128kbps',
    name: 'ماهر المعيقلي',
    subtext: 'إمام الحرم المكي',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Saood_ash-Shuraym_128kbps',
    name: 'سعود الشريم',
    subtext: 'إمام الحرم المكي السابق',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Yasser_Ad-Dussary_128kbps',
    name: 'ياسر الدوسري',
    subtext: 'إمام الحرم المكي',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Abu_Bakr_Ash-Shaatree_128kbps',
    name: 'أبو بكر الشاطري',
    subtext: 'حفص عن عاصم',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Ghamadi_40kbps',
    name: 'سعد الغامدي',
    subtext: 'حفص عن عاصم',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps',
    name: 'أحمد بن علي العجمي',
    subtext: 'حفص عن عاصم',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'Nasser_Alqatami_128kbps',
    name: 'ناصر القطامي',
    subtext: 'حفص عن عاصم',
    bitrate: '128kbps',
    style: 'مرتل'
  },
  {
    id: 'mahmoud_ali_al_banna_32kbps',
    name: 'محمود علي البنا',
    subtext: 'حفص عن عاصم - مرتل',
    bitrate: '32kbps',
    style: 'مرتل'
  },
  {
    id: 'Hudhaify_128kbps',
    name: 'علي بن عبد الرحمن الحذيفي',
    subtext: 'إمام المسجد النبوي',
    bitrate: '128kbps',
    style: 'مرتل'
  }
];

export const REFAAT_AVAILABLE_SURAHS = new Set([
  1, 2, 10, 11, 12, 17, 18, 19, 20, 48, 54, 55, 56, 69, 72, 73, 75, 76, 77, 78, 79, 81, 82, 83, 85, 86, 87, 88, 89, 96, 98, 100
]);

export const getAyahAudioCandidateUrls = (reciterId: string, surahNum: number, ayahNumInSurah: number): string[] => {
  const surahPadded = String(surahNum).padStart(3, '0');
  const ayahPadded = String(ayahNumInSurah).padStart(3, '0');
  const filename = `${surahPadded}${ayahPadded}.mp3`;

  const candidates: string[] = [];

  if (reciterId.includes('Refaat')) {
    candidates.push(`https://everyayah.com/data/Muhammad_Refaat_64kbps/${filename}`);
    candidates.push(`https://mirrors.quranicaudio.com/everyayah/Muhammad_Refaat_64kbps/${filename}`);
    candidates.push(`https://archive.org/download/Muhammad_Refaat_EveryAyah/${filename}`);
  } else if (reciterId.includes('Metwally')) {
    candidates.push(`https://everyayah.com/data/Sayeed_al_Metwally_128kbps/${filename}`);
    candidates.push(`https://mirrors.quranicaudio.com/everyayah/Sayeed_al_Metwally_128kbps/${filename}`);
    candidates.push(`https://archive.org/download/Elsayed-Metwally-Abdel-Aal/${filename}`);
  } else {
    // Standard reciters on EveryAyah & Mirrors
    candidates.push(`https://everyayah.com/data/${reciterId}/${filename}`);
    candidates.push(`https://mirrors.quranicaudio.com/everyayah/${reciterId}/${filename}`);
  }

  return Array.from(new Set(candidates));
};

export const getFullSurahAudioCandidateUrls = (reciterId: string, surahNum: number): string[] => {
  const surahPadded = String(surahNum).padStart(3, '0');
  const candidates: string[] = [];

  if (reciterId.includes('Refaat')) {
    candidates.push(`https://server14.mp3quran.net/refaat/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/mohamed_refaat/${surahPadded}.mp3`);
    candidates.push(`https://archive.org/download/Muhammad_Refaat_Full_Quran/${surahPadded}.mp3`);
  } else if (reciterId.includes('Metwally')) {
    candidates.push(`https://server11.mp3quran.net/metwaly/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/sayeed_al_metwally/${surahPadded}.mp3`);
    candidates.push(`https://archive.org/download/Elsayed-Metwally-Abdel-Aal/${surahPadded}.mp3`);
  } else if (reciterId.includes('Basit_Murattal')) {
    candidates.push(`https://server7.mp3quran.net/basit/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/abdul_basit_murattal/${surahPadded}.mp3`);
  } else if (reciterId.includes('Basit_Mujawwad')) {
    candidates.push(`https://server7.mp3quran.net/basit/Mujawwad/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/abdul_basit_mujawwad/${surahPadded}.mp3`);
  } else if (reciterId.includes('Husary_Mujawwad')) {
    candidates.push(`https://server13.mp3quran.net/hssr/Mujawwad/${surahPadded}.mp3`);
  } else if (reciterId.includes('Husary')) {
    candidates.push(`https://server13.mp3quran.net/hssr/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/mahmood_khalil_al-husaree/${surahPadded}.mp3`);
  } else if (reciterId.includes('Minshawy_Mujawwad')) {
    candidates.push(`https://server10.mp3quran.net/minsh/Mujawwad/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/muhammad_siddeeq_al-minshawee_mujawwad/${surahPadded}.mp3`);
  } else if (reciterId.includes('Minshawy')) {
    candidates.push(`https://server10.mp3quran.net/minsh/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/muhammad_siddeeq_al-minshawee/${surahPadded}.mp3`);
  } else if (reciterId.includes('Mostafa_Ismail')) {
    candidates.push(`https://server8.mp3quran.net/mustafa/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/mustafa_ismail/${surahPadded}.mp3`);
  } else if (reciterId.includes('Tablaway')) {
    candidates.push(`https://server10.mp3quran.net/tblba/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/mohammad_al_tablaway/${surahPadded}.mp3`);
  } else if (reciterId.includes('Sudais')) {
    candidates.push(`https://server11.mp3quran.net/sds/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/abdurrahmaan_as-sudais/${surahPadded}.mp3`);
  } else if (reciterId.includes('Maher')) {
    candidates.push(`https://server12.mp3quran.net/maher/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/maher_256/${surahPadded}.mp3`);
  } else if (reciterId.includes('Shuraym')) {
    candidates.push(`https://server7.mp3quran.net/shri/${surahPadded}.mp3`);
  } else if (reciterId.includes('Dussary')) {
    candidates.push(`https://server11.mp3quran.net/yasser/${surahPadded}.mp3`);
  } else if (reciterId.includes('Shaatree')) {
    candidates.push(`https://server11.mp3quran.net/shatri/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/abu_bakr_ash-shaatree/${surahPadded}.mp3`);
  } else if (reciterId.includes('Ghamadi')) {
    candidates.push(`https://server7.mp3quran.net/s_gmd/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/${surahPadded}.mp3`);
  } else if (reciterId.includes('Ajamy')) {
    candidates.push(`https://server10.mp3quran.net/ajm/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/ahmed_ibn_ali_al-ajamy/${surahPadded}.mp3`);
  } else if (reciterId.includes('Alqatami')) {
    candidates.push(`https://server6.mp3quran.net/qtm/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/nasser_alqatami/${surahPadded}.mp3`);
  } else if (reciterId.includes('banna')) {
    candidates.push(`https://server8.mp3quran.net/bna/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/mahmoud_ali_al_banna/${surahPadded}.mp3`);
  } else if (reciterId.includes('Hudhaify')) {
    candidates.push(`https://server9.mp3quran.net/hudhaify/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/ali_huthayfi/${surahPadded}.mp3`);
  } else {
    // Default Alafasy
    candidates.push(`https://server8.mp3quran.net/afs/${surahPadded}.mp3`);
    candidates.push(`https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${surahPadded}.mp3`);
  }

  return Array.from(new Set(candidates));
};

export const getAyahAudioUrl = (reciterId: string, surahNum: number, ayahNumInSurah: number): string => {
  return getAyahAudioCandidateUrls(reciterId, surahNum, ayahNumInSurah)[0];
};

