// Service to track and manage Quran reading statistics, daily pages, completed verses, streaks & charts data

export interface DailyStat {
  date: string; // YYYY-MM-DD
  pagesCount: number;
  pagesList: number[];
  versesCount: number;
  versesList: string[]; // "surah:ayah"
  durationMinutes: number;
  sessionsCount: number;
}

export interface ReadingStatsData {
  dailyStats: Record<string, DailyStat>;
  completedVersesSet: Record<string, boolean>; // "surah:ayah"
  completedPagesSet: Record<number, boolean>;
  khatmasCompleted: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  dailyPagesGoal: number;
  dailyVersesGoal: number;
  totalMinutesRead: number;
}

const STATS_STORAGE_KEY = 'quran_reading_stats_v2';
const TOTAL_QURAN_VERSES = 6236;
const TOTAL_QURAN_PAGES = 604;

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getArabicDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[d.getDay()] || '';
}

function getArabicShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// Generate realistic starter data for the previous 14 days if user is first opening
function generateSeedStats(): ReadingStatsData {
  const dailyStats: Record<string, DailyStat> = {};
  const completedVersesSet: Record<string, boolean> = {};
  const completedPagesSet: Record<number, boolean> = {};

  const today = new Date();
  const sampleDayPattern = [6, 4, 8, 5, 10, 7, 12, 5, 9, 8, 14, 6, 11, 8];

  let currentTotalPages = 0;
  let currentTotalVerses = 0;

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const pagesCount = sampleDayPattern[13 - i] || 5;
    const versesCount = pagesCount * 15 + Math.floor(Math.random() * 10);
    const durationMinutes = pagesCount * 4 + Math.floor(Math.random() * 5);

    const pagesList: number[] = [];
    for (let p = 1; p <= pagesCount; p++) {
      const pageNum = ((currentTotalPages + p - 1) % 604) + 1;
      pagesList.push(pageNum);
      completedPagesSet[pageNum] = true;
    }
    currentTotalPages += pagesCount;

    const versesList: string[] = [];
    for (let v = 1; v <= versesCount; v++) {
      const verseKey = `1:${(currentTotalVerses + v) % 6236 + 1}`;
      versesList.push(verseKey);
      completedVersesSet[verseKey] = true;
    }
    currentTotalVerses += versesCount;

    dailyStats[dateKey] = {
      date: dateKey,
      pagesCount,
      pagesList,
      versesCount,
      versesList,
      durationMinutes,
      sessionsCount: Math.max(1, Math.floor(pagesCount / 3))
    };
  }

  return {
    dailyStats,
    completedVersesSet,
    completedPagesSet,
    khatmasCompleted: 0,
    currentStreak: 14,
    bestStreak: 14,
    lastActiveDate: getTodayKey(),
    dailyPagesGoal: 6,
    dailyVersesGoal: 50,
    totalMinutesRead: 420
  };
}

export function getReadingStats(): ReadingStatsData {
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.dailyStats) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stats from storage:', e);
  }

  // If no previous stats, create starter seed data
  const seed = generateSeedStats();
  saveReadingStats(seed);
  return seed;
}

export function saveReadingStats(stats: ReadingStatsData): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quran_khatm_progress_updated'));
    }
  } catch (e) {
    console.warn('Error saving stats to storage:', e);
  }
}

// Update streak when recording an activity
function updateStreak(stats: ReadingStatsData, todayKey: string): void {
  if (stats.lastActiveDate === todayKey) {
    return; // Already updated today
  }

  const lastDate = stats.lastActiveDate ? new Date(stats.lastActiveDate + 'T00:00:00') : null;
  const today = new Date(todayKey + 'T00:00:00');

  if (!lastDate) {
    stats.currentStreak = 1;
  } else {
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      stats.currentStreak += 1;
    } else if (diffDays > 1) {
      stats.currentStreak = 1;
    }
  }

  if (stats.currentStreak > stats.bestStreak) {
    stats.bestStreak = stats.currentStreak;
  }
  stats.lastActiveDate = todayKey;
}

// Record a page read
export function recordPageRead(pageNumber: number, durationMinutes: number = 2, estimatedVerses: number = 15): void {
  const stats = getReadingStats();
  const todayKey = getTodayKey();

  if (!stats.dailyStats[todayKey]) {
    stats.dailyStats[todayKey] = {
      date: todayKey,
      pagesCount: 0,
      pagesList: [],
      versesCount: 0,
      versesList: [],
      durationMinutes: 0,
      sessionsCount: 0
    };
  }

  const dayStat = stats.dailyStats[todayKey];
  if (!dayStat.pagesList.includes(pageNumber)) {
    dayStat.pagesList.push(pageNumber);
    dayStat.pagesCount += 1;
    stats.completedPagesSet[pageNumber] = true;
  }

  dayStat.durationMinutes += durationMinutes;
  stats.totalMinutesRead += durationMinutes;
  dayStat.sessionsCount = Math.max(1, dayStat.sessionsCount);

  // If verses not added yet, add estimation
  if (dayStat.versesCount === 0 || dayStat.versesCount < dayStat.pagesCount * 10) {
    dayStat.versesCount += estimatedVerses;
  }

  updateStreak(stats, todayKey);
  saveReadingStats(stats);
}

// Record an individual ayah read or listened to
export function recordAyahRead(surahId: number, ayahNumber: number, durationMinutes: number = 0.5): void {
  const stats = getReadingStats();
  const todayKey = getTodayKey();

  if (!stats.dailyStats[todayKey]) {
    stats.dailyStats[todayKey] = {
      date: todayKey,
      pagesCount: 0,
      pagesList: [],
      versesCount: 0,
      versesList: [],
      durationMinutes: 0,
      sessionsCount: 0
    };
  }

  const dayStat = stats.dailyStats[todayKey];
  const verseKey = `${surahId}:${ayahNumber}`;

  if (!dayStat.versesList.includes(verseKey)) {
    dayStat.versesList.push(verseKey);
    dayStat.versesCount += 1;
    stats.completedVersesSet[verseKey] = true;
  }

  dayStat.durationMinutes += durationMinutes;
  stats.totalMinutesRead += durationMinutes;

  updateStreak(stats, todayKey);
  saveReadingStats(stats);
}

// Record multiple ayahs in a batch (e.g. full surah or page)
export function recordAyahsBatch(surahId: number, startAyah: number, endAyah: number, pageNumber?: number): void {
  const stats = getReadingStats();
  const todayKey = getTodayKey();

  if (!stats.dailyStats[todayKey]) {
    stats.dailyStats[todayKey] = {
      date: todayKey,
      pagesCount: 0,
      pagesList: [],
      versesCount: 0,
      versesList: [],
      durationMinutes: 0,
      sessionsCount: 0
    };
  }

  const dayStat = stats.dailyStats[todayKey];

  for (let a = startAyah; a <= endAyah; a++) {
    const verseKey = `${surahId}:${a}`;
    if (!dayStat.versesList.includes(verseKey)) {
      dayStat.versesList.push(verseKey);
      dayStat.versesCount += 1;
      stats.completedVersesSet[verseKey] = true;
    }
  }

  if (pageNumber && !dayStat.pagesList.includes(pageNumber)) {
    dayStat.pagesList.push(pageNumber);
    dayStat.pagesCount += 1;
    stats.completedPagesSet[pageNumber] = true;
  }

  dayStat.durationMinutes += Math.max(1, Math.round((endAyah - startAyah + 1) * 0.4));
  stats.totalMinutesRead += Math.max(1, Math.round((endAyah - startAyah + 1) * 0.4));

  updateStreak(stats, todayKey);
  saveReadingStats(stats);
}

// Update user daily goals
export function updateDailyGoals(pagesGoal: number, versesGoal: number): void {
  const stats = getReadingStats();
  stats.dailyPagesGoal = Math.max(1, pagesGoal);
  stats.dailyVersesGoal = Math.max(5, versesGoal);
  saveReadingStats(stats);
}

// Reset stats
export function resetReadingStats(): void {
  localStorage.removeItem(STATS_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('quran_khatm_progress_updated'));
  }
}

// Get chart data for last N days
export function getChartDataForDays(daysCount: number = 7) {
  const stats = getReadingStats();
  const result = [];
  const today = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const stat = stats.dailyStats[dateKey] || {
      date: dateKey,
      pagesCount: 0,
      pagesList: [],
      versesCount: 0,
      versesList: [],
      durationMinutes: 0,
      sessionsCount: 0
    };

    const isToday = i === 0;
    const isYesterday = i === 1;
    let label = getArabicDayName(dateKey);
    if (isToday) label = 'اليوم (' + label + ')';
    else if (isYesterday) label = 'أمس (' + label + ')';

    result.push({
      date: dateKey,
      shortDate: getArabicShortDate(dateKey),
      dayName: label,
      pages: stat.pagesCount,
      verses: stat.versesCount,
      minutes: Math.round(stat.durationMinutes),
      pagesGoal: stats.dailyPagesGoal,
      versesGoal: stats.dailyVersesGoal,
      completionRate: Math.min(100, Math.round((stat.pagesCount / stats.dailyPagesGoal) * 100))
    });
  }

  return result;
}

// Get weekly day-of-week averages
export function getWeeklyDistributionData() {
  const stats = getReadingStats();
  const dayBuckets: Record<number, { totalPages: number; totalVerses: number; count: number }> = {
    0: { totalPages: 0, totalVerses: 0, count: 0 }, // Sun
    1: { totalPages: 0, totalVerses: 0, count: 0 }, // Mon
    2: { totalPages: 0, totalVerses: 0, count: 0 }, // Tue
    3: { totalPages: 0, totalVerses: 0, count: 0 }, // Wed
    4: { totalPages: 0, totalVerses: 0, count: 0 }, // Thu
    5: { totalPages: 0, totalVerses: 0, count: 0 }, // Fri
    6: { totalPages: 0, totalVerses: 0, count: 0 }  // Sat
  };

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  Object.values(stats.dailyStats).forEach(s => {
    const d = new Date(s.date + 'T00:00:00');
    const dayIdx = d.getDay();
    if (dayBuckets[dayIdx]) {
      dayBuckets[dayIdx].totalPages += s.pagesCount;
      dayBuckets[dayIdx].totalVerses += s.versesCount;
      dayBuckets[dayIdx].count += 1;
    }
  });

  // Reorder starting with Saturday (السبت)
  const orderedIndices = [6, 0, 1, 2, 3, 4, 5];

  return orderedIndices.map(idx => {
    const b = dayBuckets[idx];
    const avgPages = b.count > 0 ? Number((b.totalPages / b.count).toFixed(1)) : 0;
    const avgVerses = b.count > 0 ? Math.round(b.totalVerses / b.count) : 0;
    return {
      day: dayNames[idx],
      pages: b.totalPages,
      verses: b.totalVerses,
      avgPages,
      avgVerses
    };
  });
}

// Get summary metrics
export function getReadingStatsSummary() {
  const stats = getReadingStats();
  const todayKey = getTodayKey();
  const todayStat = stats.dailyStats[todayKey] || { pagesCount: 0, versesCount: 0, durationMinutes: 0 };

  const totalVersesCompleted = Object.keys(stats.completedVersesSet || {}).length;
  const totalPagesCompleted = Object.keys(stats.completedPagesSet || {}).length;

  const totalVersesInQuran = TOTAL_QURAN_VERSES;
  const totalPagesInQuran = TOTAL_QURAN_PAGES;

  const versesCompletionPercent = Number(((totalVersesCompleted / totalVersesInQuran) * 100).toFixed(1));
  const pagesCompletionPercent = Number(((totalPagesCompleted / totalPagesInQuran) * 100).toFixed(1));

  // Calculate past 7 days totals
  const last7DaysData = getChartDataForDays(7);
  const weekPagesTotal = last7DaysData.reduce((acc, curr) => acc + curr.pages, 0);
  const weekVersesTotal = last7DaysData.reduce((acc, curr) => acc + curr.verses, 0);
  const weekMinutesTotal = last7DaysData.reduce((acc, curr) => acc + curr.minutes, 0);

  return {
    todayPages: todayStat.pagesCount,
    todayVerses: todayStat.versesCount,
    todayMinutes: Math.round(todayStat.durationMinutes),
    todayGoalPages: stats.dailyPagesGoal,
    todayGoalVerses: stats.dailyVersesGoal,
    todayGoalPercent: Math.min(100, Math.round((todayStat.pagesCount / stats.dailyPagesGoal) * 100)),
    totalVersesCompleted,
    totalVersesInQuran,
    versesCompletionPercent,
    totalPagesCompleted,
    totalPagesInQuran,
    pagesCompletionPercent,
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
    totalMinutesRead: Math.round(stats.totalMinutesRead),
    weekPagesTotal,
    weekVersesTotal,
    weekMinutesTotal,
    khatmasCompleted: stats.khatmasCompleted
  };
}
