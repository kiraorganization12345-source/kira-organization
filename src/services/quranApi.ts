import { Ayah, SurahDetail } from '../types';
import { ALL_SURAHS } from '../data/surahs';

const CACHE_PREFIX = 'quran_cache_v2_';

// In-memory quick cache for (surah:ayah) -> pageNumber
const AYAH_PAGE_CACHE: Record<string, number> = {};

/**
 * Normalizes Arabic text by stripping diacritical marks (tashkeel)
 */
export function removeTashkeel(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

/**
 * Format numbers to eastern Arabic numerals if desired (e.g., 1 -> ١)
 */
export function toArabicNumeral(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (w) => arabicDigits[parseInt(w, 10)]);
}

/**
 * Calculates global Ayah index across the entire Quran (1 to 6236)
 */
export function getGlobalAyahNumber(surahId: number, ayahNumInSurah: number): number {
  let count = 0;
  for (let i = 1; i < surahId; i++) {
    const s = ALL_SURAHS.find(item => item.id === i);
    if (s) count += s.versesCount;
  }
  return count + ayahNumInSurah;
}

/**
 * Get the Mushaf page number (1 to 604) for a given Surah and Ayah number
 */
export async function getAyahPageNumber(surahId: number, ayahNumInSurah: number): Promise<number> {
  const key = `${surahId}:${ayahNumInSurah}`;
  if (AYAH_PAGE_CACHE[key]) {
    return AYAH_PAGE_CACHE[key];
  }

  // Check localStorage cache
  try {
    const cachedMap = localStorage.getItem(`${CACHE_PREFIX}ayah_page_map`);
    if (cachedMap) {
      const parsed = JSON.parse(cachedMap);
      if (parsed[key]) {
        AYAH_PAGE_CACHE[key] = parsed[key];
        return parsed[key];
      }
    }
  } catch (e) {
    console.warn('Ayah page map cache read error:', e);
  }

  // Fallback: estimate from Surah start page or fetch
  const surahMeta = ALL_SURAHS.find(s => s.id === surahId);
  const fallbackPage = surahMeta ? surahMeta.startPage : 1;

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumInSurah}/quran-uthmani`);
    if (response.ok) {
      const data = await response.json();
      if (data?.data?.page) {
        const page = data.data.page;
        AYAH_PAGE_CACHE[key] = page;
        
        // Save in localStorage
        try {
          const cachedMap = localStorage.getItem(`${CACHE_PREFIX}ayah_page_map`);
          const map = cachedMap ? JSON.parse(cachedMap) : {};
          map[key] = page;
          localStorage.setItem(`${CACHE_PREFIX}ayah_page_map`, JSON.stringify(map));
        } catch (err) {}

        return page;
      }
    }
  } catch (error) {
    console.warn(`Could not fetch page for ayah ${surahId}:${ayahNumInSurah}, using fallback:`, error);
  }

  return fallbackPage;
}

/**
 * Fetch complete Surah details including all Ayahs in Uthmani script
 */
export async function fetchSurahDetail(surahId: number): Promise<SurahDetail> {
  const cacheKey = `${CACHE_PREFIX}surah_${surahId}`;
  
  // Check localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.ayahs) {
        parsed.ayahs.forEach((a: Ayah) => {
          if (a.page) AYAH_PAGE_CACHE[`${surahId}:${a.numberInSurah}`] = a.page;
        });
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }

  const meta = ALL_SURAHS.find(s => s.id === surahId) || ALL_SURAHS[0];

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
    if (!response.ok) {
      throw new Error(`Failed to load surah ${surahId}`);
    }
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.ayahs) {
      const ayahs: Ayah[] = data.data.ayahs.map((item: any) => {
        const page = item.page || meta.startPage;
        AYAH_PAGE_CACHE[`${surahId}:${item.numberInSurah}`] = page;
        return {
          number: item.number,
          numberInSurah: item.numberInSurah,
          text: item.text,
          textSimple: removeTashkeel(item.text),
          juz: item.juz,
          manzil: item.manzil,
          page: page,
          ruku: item.ruku,
          hizbQuarter: item.hizbQuarter,
          sajda: item.sajda || false
        };
      });

      const surahDetail: SurahDetail = {
        ...meta,
        ayahs,
        bismillahPre: surahId !== 1 && surahId !== 9
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(surahDetail));
      } catch (e) {
        console.warn('Cache write error:', e);
      }

      return surahDetail;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error(`Error fetching surah ${surahId}:`, error);
    throw error;
  }
}

/**
 * Fetch Ayahs by page number (1 to 604) for standard Mushaf layout
 */
export async function fetchPageAyahs(pageNumber: number): Promise<{ pageNumber: number; ayahs: (Ayah & { surah: { id: number; name: string } })[] }> {
  const cacheKey = `${CACHE_PREFIX}page_${pageNumber}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
    if (!response.ok) {
      throw new Error(`Failed to load page ${pageNumber}`);
    }
    const data = await response.json();
    if (data.code === 200 && data.data && data.data.ayahs) {
      const ayahs = data.data.ayahs.map((item: any) => ({
        number: item.number,
        numberInSurah: item.numberInSurah,
        text: item.text,
        textSimple: removeTashkeel(item.text),
        juz: item.juz,
        manzil: item.manzil,
        page: item.page,
        ruku: item.ruku,
        hizbQuarter: item.hizbQuarter,
        sajda: item.sajda || false,
        surah: {
          id: item.surah.number,
          name: item.surah.name
        }
      }));

      const result = { pageNumber, ayahs };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.warn('Cache write error:', e);
      }
      return result;
    } else {
      throw new Error('Invalid page response');
    }
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error);
    throw error;
  }
}

/**
 * Fetch Tafsir for a specific Surah
 */
export async function fetchSurahTafsir(surahId: number, tafsirEdition: string = 'ar.muyassar'): Promise<Record<number, string>> {
  const cacheKey = `${CACHE_PREFIX}tafsir_${surahId}_${tafsirEdition}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${tafsirEdition}`);
    if (!response.ok) {
      throw new Error(`Failed to load tafsir for surah ${surahId}`);
    }
    const data = await response.json();
    if (data.code === 200 && data.data && data.data.ayahs) {
      const tafsirMap: Record<number, string> = {};
      data.data.ayahs.forEach((item: any) => {
        tafsirMap[item.numberInSurah] = item.text;
      });

      try {
        localStorage.setItem(cacheKey, JSON.stringify(tafsirMap));
      } catch (e) {
        console.warn('Cache write error:', e);
      }

      return tafsirMap;
    }
    return {};
  } catch (error) {
    console.error(`Error fetching tafsir for surah ${surahId}:`, error);
    return {};
  }
}

/**
 * Fetch Translation for a specific Surah
 */
export async function fetchSurahTranslation(surahId: number, translationEdition: string = 'en.sahih'): Promise<Record<number, string>> {
  const cacheKey = `${CACHE_PREFIX}translation_${surahId}_${translationEdition}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${translationEdition}`);
    if (!response.ok) {
      throw new Error(`Failed to load translation for surah ${surahId}`);
    }
    const data = await response.json();
    if (data.code === 200 && data.data && data.data.ayahs) {
      const translationMap: Record<number, string> = {};
      data.data.ayahs.forEach((item: any) => {
        translationMap[item.numberInSurah] = item.text;
      });

      try {
        localStorage.setItem(cacheKey, JSON.stringify(translationMap));
      } catch (e) {
        console.warn('Cache write error:', e);
      }

      return translationMap;
    }
    return {};
  } catch (error) {
    console.error(`Error fetching translation for surah ${surahId}:`, error);
    return {};
  }
}

/**
 * Search Quran text
 */
export async function searchQuran(query: string): Promise<{
  surahId: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  page: number;
}[]> {
  if (!query.trim()) return [];

  const cleanQuery = removeTashkeel(query.trim());

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanQuery)}/all/ar`);
    if (!response.ok) {
      throw new Error('Search request failed');
    }
    const data = await response.json();
    if (data.code === 200 && data.data && data.data.matches) {
      return data.data.matches.map((item: any) => ({
        surahId: item.surah.number,
        surahName: item.surah.name,
        ayahNumber: item.numberInSurah,
        text: item.text,
        page: item.page
      }));
    }
    return [];
  } catch (error) {
    console.error('Quran search error:', error);
    return [];
  }
}
