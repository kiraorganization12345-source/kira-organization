import { useState, useEffect, useCallback } from 'react';
import { getReadingStats, saveReadingStats, recordPageRead as storageRecordPageRead } from './readingStatsStorage';

export const TOTAL_MUSHAF_PAGES = 604;
export const KHATM_STORAGE_KEY = 'quran_khatma_plan_v1';
export const KHATM_PROGRESS_EVENT = 'quran_khatm_progress_updated';

export interface KhatmProgressData {
  completedPagesCount: number;
  totalPages: number;
  percentage: number;
  percentageFormatted: string;
  remainingPages: number;
  estimatedJuzCompleted: number;
  todayPagesCount: number;
  completedPagesList: number[];
  isCompleted: boolean;
}

/**
 * Reads and merges all unique pages read across the Mushaf from both
 * readingStatsStorage and quran_khatma_plan_v1.
 */
export function getUnifiedMushafProgress(): KhatmProgressData {
  const uniquePages = new Set<number>();

  // 1. Collect pages from reading stats
  let todayPages = 0;
  try {
    const stats = getReadingStats();
    if (stats.completedPagesSet) {
      Object.keys(stats.completedPagesSet).forEach((k) => {
        const pageNum = parseInt(k, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= TOTAL_MUSHAF_PAGES && stats.completedPagesSet[pageNum]) {
          uniquePages.add(pageNum);
        }
      });
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (stats.dailyStats && stats.dailyStats[todayKey]) {
      todayPages = stats.dailyStats[todayKey].pagesCount || 0;
    }
  } catch (err) {
    console.warn('Error reading stats for unified progress:', err);
  }

  // 2. Collect pages from khatma plan
  try {
    const savedKhatma = localStorage.getItem(KHATM_STORAGE_KEY);
    if (savedKhatma) {
      const data = JSON.parse(savedKhatma);
      if (Array.isArray(data.completedPages)) {
        data.completedPages.forEach((p: any) => {
          const pageNum = parseInt(p, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= TOTAL_MUSHAF_PAGES) {
            uniquePages.add(pageNum);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Error reading khatma plan for unified progress:', err);
  }

  const completedPagesCount = Math.min(TOTAL_MUSHAF_PAGES, uniquePages.size);
  const rawPercentage = (completedPagesCount / TOTAL_MUSHAF_PAGES) * 100;
  const percentage = Number(rawPercentage.toFixed(1));
  const remainingPages = Math.max(0, TOTAL_MUSHAF_PAGES - completedPagesCount);
  
  // Calculate approximate Juz (20 pages per Juz, 30 Juz total)
  const estimatedJuzCompleted = Math.min(30, Math.floor(completedPagesCount / 20));

  return {
    completedPagesCount,
    totalPages: TOTAL_MUSHAF_PAGES,
    percentage,
    percentageFormatted: `${percentage}%`,
    remainingPages,
    estimatedJuzCompleted,
    todayPagesCount: todayPages,
    completedPagesList: Array.from(uniquePages).sort((a, b) => a - b),
    isCompleted: completedPagesCount >= TOTAL_MUSHAF_PAGES
  };
}

/**
 * Dispatches a progress update notification event to all listening components.
 */
export function notifyKhatmProgressChanged(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(KHATM_PROGRESS_EVENT, { detail: getUnifiedMushafProgress() }));
    }
  } catch (err) {
    console.warn('Failed to dispatch khatm progress event:', err);
  }
}

/**
 * Records a page read in the Mushaf, keeping readingStats and Khatma plan in sync,
 * and broadcasting dynamic update across the app.
 */
export function recordMushafPageRead(pageNumber: number, durationMinutes = 2, estimatedVerses = 15): void {
  if (pageNumber < 1 || pageNumber > TOTAL_MUSHAF_PAGES) return;

  try {
    // 1. Record in reading stats
    storageRecordPageRead(pageNumber, durationMinutes, estimatedVerses);

    // 2. Sync to khatma plan storage if not present
    const saved = localStorage.getItem(KHATM_STORAGE_KEY);
    let plan = saved ? JSON.parse(saved) : { targetDays: 30, completedPages: [], streakDays: 1 };
    if (!Array.isArray(plan.completedPages)) plan.completedPages = [];
    
    if (!plan.completedPages.includes(pageNumber)) {
      plan.completedPages.push(pageNumber);
      localStorage.setItem(KHATM_STORAGE_KEY, JSON.stringify(plan));
    }
  } catch (err) {
    console.warn('Error in recordMushafPageRead:', err);
  }

  notifyKhatmProgressChanged();
}

/**
 * Syncs pages from KhatmaTracker to reading stats and dispatches progress update.
 */
export function syncKhatmaPlanPages(pages: number[], targetDays?: number): void {
  try {
    // 1. Update Khatma plan storage
    const saved = localStorage.getItem(KHATM_STORAGE_KEY);
    const existing = saved ? JSON.parse(saved) : { targetDays: 30, streakDays: 1 };
    const updatedPlan = {
      targetDays: targetDays || existing.targetDays || 30,
      completedPages: pages,
      streakDays: existing.streakDays || 1
    };
    localStorage.setItem(KHATM_STORAGE_KEY, JSON.stringify(updatedPlan));

    // 2. Sync to reading stats
    const stats = getReadingStats();
    if (!stats.completedPagesSet) stats.completedPagesSet = {};
    
    pages.forEach((p) => {
      if (p >= 1 && p <= TOTAL_MUSHAF_PAGES) {
        stats.completedPagesSet[p] = true;
      }
    });
    saveReadingStats(stats);
  } catch (err) {
    console.warn('Error in syncKhatmaPlanPages:', err);
  }

  notifyKhatmProgressChanged();
}

/**
 * React hook that returns dynamic, reactive Khatm completion progress
 * and re-renders automatically whenever pages are read anywhere in the app.
 */
export function useKhatmProgress() {
  const [progress, setProgress] = useState<KhatmProgressData>(() => getUnifiedMushafProgress());

  const refresh = useCallback(() => {
    setProgress(getUnifiedMushafProgress());
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Listen for custom progress event
    const handleProgressUpdate = () => {
      refresh();
    };

    // Listen for storage events (e.g. cross-tab updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === KHATM_STORAGE_KEY || e.key === 'quran_reading_stats_v2') {
        refresh();
      }
    };

    window.addEventListener(KHATM_PROGRESS_EVENT, handleProgressUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(KHATM_PROGRESS_EVENT, handleProgressUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  return {
    progress,
    refresh,
    recordPage: recordMushafPageRead,
    syncPages: syncKhatmaPlanPages
  };
}
