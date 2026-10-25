import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Flame, 
  Trophy, 
  Clock, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  RefreshCw, 
  Plus, 
  Settings, 
  Award,
  Layers,
  ChevronLeft,
  Bell
} from 'lucide-react';
import { 
  getChartDataForDays, 
  getReadingStatsSummary, 
  getWeeklyDistributionData, 
  updateDailyGoals, 
  recordPageRead, 
  resetReadingStats 
} from '../services/readingStatsStorage';
import { toArabicNumeral } from '../services/quranApi';

interface ReadingStatsViewProps {
  onNavigateToSurahs?: () => void;
  onNavigateToPages?: () => void;
  onNavigateToKhatma?: () => void;
  onOpenNotifications?: () => void;
}

type TimeRange = 7 | 14 | 30;
type ChartMetric = 'pages' | 'verses' | 'minutes';

export const ReadingStatsView: React.FC<ReadingStatsViewProps> = ({
  onNavigateToSurahs,
  onNavigateToPages,
  onNavigateToKhatma,
  onOpenNotifications
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('pages');
  const [summary, setSummary] = useState(getReadingStatsSummary());
  const [chartData, setChartData] = useState(getChartDataForDays(7));
  const [weeklyData, setWeeklyData] = useState(getWeeklyDistributionData());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customPagesGoal, setCustomPagesGoal] = useState<number>(summary.todayGoalPages);
  const [customVersesGoal, setCustomVersesGoal] = useState<number>(summary.todayGoalVerses);
  const [quickAddCount, setQuickAddCount] = useState<number>(1);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Refresh statistics data
  const refreshStats = () => {
    setSummary(getReadingStatsSummary());
    setChartData(getChartDataForDays(timeRange));
    setWeeklyData(getWeeklyDistributionData());
  };

  useEffect(() => {
    setChartData(getChartDataForDays(timeRange));
  }, [timeRange]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    updateDailyGoals(customPagesGoal, customVersesGoal);
    refreshStats();
    setShowGoalModal(false);
  };

  const handleQuickAddPages = () => {
    for (let i = 0; i < quickAddCount; i++) {
      recordPageRead(Math.floor(Math.random() * 604) + 1, 3, 15);
    }
    refreshStats();
    setShowQuickAddModal(false);
  };

  const handleResetData = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط إحصائيات القراءة؟')) {
      resetReadingStats();
      refreshStats();
    }
  };

  // Metric styling
  const metricConfigs = {
    pages: {
      title: 'الصفحات المقروءة',
      color: '#f59e0b', // Amber
      gradientStart: '#f59e0b',
      gradientEnd: '#d97706',
      unit: 'صفحة',
      goalVal: summary.todayGoalPages
    },
    verses: {
      title: 'الآيات المقروءة',
      color: '#10b981', // Emerald
      gradientStart: '#10b981',
      gradientEnd: '#059669',
      unit: 'آية',
      goalVal: summary.todayGoalVerses
    },
    minutes: {
      title: 'وقت القراءة والتدبر',
      color: '#3b82f6', // Blue
      gradientStart: '#3b82f6',
      gradientEnd: '#2563eb',
      unit: 'دقيقة',
      goalVal: 20
    }
  };

  const currentMetricConfig = metricConfigs[activeMetric];

  // Quran completed verses pie chart data
  const versesPieData = [
    { name: 'الآيات المكتملة', value: summary.totalVersesCompleted, color: '#10b981' },
    { name: 'الآيات المتبقية', value: Math.max(0, summary.totalVersesInQuran - summary.totalVersesCompleted), color: '#292524' }
  ];

  // Quran completed pages pie chart data
  const pagesPieData = [
    { name: 'الصفحات المكتملة', value: summary.totalPagesCompleted, color: '#f59e0b' },
    { name: 'الصفحات المتبقية', value: Math.max(0, summary.totalPagesInQuran - summary.totalPagesCompleted), color: '#292524' }
  ];

  // Custom Chart Tooltip in Arabic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-stone-100 min-w-[200px] text-right font-cairo">
          <p className="text-xs text-amber-300 font-bold mb-1.5 border-b border-stone-800 pb-1 flex items-center justify-between">
            <span>{data.dayName}</span>
            <span className="text-stone-400 font-normal">{data.shortDate}</span>
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-amber-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> عدد الصفحات:
              </span>
              <span className="font-bold text-amber-200">{toArabicNumeral(data.pages)} صفحة</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> عدد الآيات:
              </span>
              <span className="font-bold text-emerald-200">{toArabicNumeral(data.verses)} آية</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> وقت القراءة:
              </span>
              <span className="font-bold text-blue-200">{toArabicNumeral(data.minutes)} دقيقة</span>
            </div>
            <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span>تحقيق الهدف اليومي:</span>
              <span className="font-bold text-amber-300">%{toArabicNumeral(data.completionRate)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in text-stone-100 font-cairo">
      
      {/* 1. Header Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/80 to-stone-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>لوحة التحليلات والإحصائيات القرآنية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-100 font-quran">
              إحصائيات القراءة والورْد اليومي
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تتبع عدد الصفحات والآيات المقروءة يومياً، وراقب تقدمك المستمر نحو ختم كتاب الله تعالى مع الرسوم البيانية التفاعلية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
                title="ضبط منبّه الورد والتذكيرات اليومية"
              >
                <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>منبّه الورد</span>
              </button>
            )}

            <button
              onClick={() => setShowGoalModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
              title="تعديل الهدف اليومي"
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span>تعديل الهدف</span>
            </button>

            <button
              onClick={() => setShowQuickAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title="تسجيل قراءة ورْد إضافي"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل ورْد</span>
            </button>

            <button
              onClick={refreshStats}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: اليوم (صفحات) */}
        <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400">قراءة اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-quran">
              {toArabicNumeral(summary.todayPages)}
            </span>
            <span className="text-xs text-stone-400">صفحة</span>
          </div>
          {/* Progress to daily goal */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>الهدف: {toArabicNumeral(summary.todayGoalPages)} صفحات</span>
              <span className="font-bold text-amber-400">%{toArabicNumeral(summary.todayGoalPercent)}</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary.todayGoalPercent)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: الآيات التي تم ختمها */}
        <div className="bg-stone-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400">الآيات التي تم ختمها</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-quran">
              {toArabicNumeral(summary.totalVersesCompleted)}
            </span>
            <span className="text-xs text-stone-400">من {toArabicNumeral(summary.totalVersesInQuran)} آية</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>نسبة ختم الآيات</span>
              <span className="font-bold text-emerald-400">%{toArabicNumeral(summary.versesCompletionPercent)}</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary.versesCompletionPercent)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: التتابع المستمر (Streak) */}
        <div className="bg-stone-900/90 border border-orange-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-orange-500/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400">التتابع المستمر</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-orange-400 font-quran">
              {toArabicNumeral(summary.currentStreak)}
            </span>
            <span className="text-xs text-stone-400">أيام متتالية</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400">
            <span>أفضل تتابع سابق:</span>
            <span className="font-bold text-orange-300">{toArabicNumeral(summary.bestStreak)} يوم</span>
          </div>
        </div>

        {/* Card 4: إجمالي الأسبوع ووقت القراءة */}
        <div className="bg-stone-900/90 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400">إجمالي هذا الأسبوع</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-300 font-quran">
              {toArabicNumeral(summary.weekPagesTotal)}
            </span>
            <span className="text-xs text-stone-400">صفحة ({toArabicNumeral(summary.weekVersesTotal)} آية)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400">
            <span>الوقت المقدر:</span>
            <span className="font-bold text-blue-300">{toArabicNumeral(summary.weekMinutesTotal)} دقيقة</span>
          </div>
        </div>

      </div>

      {/* 3. Main Chart Section (Recharts Bar & Area Visualizations) */}
      <div className="bg-stone-900/95 border border-stone-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        
        {/* Controls Bar: Metric Selector & Time Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          
          {/* Metric tabs */}
          <div className="flex items-center bg-stone-950 p-1 rounded-2xl border border-stone-800 gap-1">
            <button
              onClick={() => setActiveMetric('pages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMetric === 'pages'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>الصفحات المقروءة</span>
            </button>

            <button
              onClick={() => setActiveMetric('verses')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMetric === 'verses'
                  ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الآيات المقروءة</span>
            </button>

            <button
              onClick={() => setActiveMetric('minutes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMetric === 'minutes'
                  ? 'bg-blue-500 text-stone-950 shadow-md shadow-blue-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>وقت القراءة (دقائق)</span>
            </button>
          </div>

          {/* Time Range Filter (7 / 14 / 30 Days) */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs font-bold">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === 7
                  ? 'bg-stone-800 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setTimeRange(14)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === 14
                  ? 'bg-stone-800 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              آخر 14 يوماً
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === 30
                  ? 'bg-stone-800 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              آخر 30 يوماً
            </button>
          </div>

        </div>

        {/* The Recharts Bar & Line Chart Container */}
        <div className="w-full h-72 sm:h-80 dir-ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
            >
              <defs>
                {/* Amber Gradient */}
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                </linearGradient>
                {/* Emerald Gradient */}
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                </linearGradient>
                {/* Blue Gradient */}
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              
              <XAxis 
                dataKey="shortDate" 
                stroke="#78716c" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#44403c' }}
                dy={10}
              />
              
              <YAxis 
                stroke="#78716c" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#44403c' }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Daily Goal Target Line */}
              {activeMetric === 'pages' && (
                <ReferenceLine 
                  y={summary.todayGoalPages} 
                  stroke="#fbbf24" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `الهدف (${summary.todayGoalPages})`, 
                    fill: '#fbbf24', 
                    fontSize: 10, 
                    position: 'insideTopRight' 
                  }} 
                />
              )}

              {activeMetric === 'verses' && (
                <ReferenceLine 
                  y={summary.todayGoalVerses} 
                  stroke="#34d399" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `الهدف (${summary.todayGoalVerses})`, 
                    fill: '#34d399', 
                    fontSize: 10, 
                    position: 'insideTopRight' 
                  }} 
                />
              )}

              {/* Main Bar Display */}
              <Bar 
                dataKey={activeMetric} 
                fill={
                  activeMetric === 'pages' 
                    ? 'url(#amberGradient)' 
                    : activeMetric === 'verses' 
                    ? 'url(#emeraldGradient)' 
                    : 'url(#blueGradient)'
                }
                radius={[8, 8, 0, 0]}
                barSize={timeRange === 30 ? 12 : timeRange === 14 ? 22 : 36}
              />

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend and Info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md" style={{ backgroundColor: currentMetricConfig.color }}></span>
              <span>{currentMetricConfig.title} ({currentMetricConfig.unit})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-400"></span>
              <span>الورْد المستهدف يومياً</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-500">
            * يتم تسجيل الصفحات والآيات تلقائياً أثناء القراءة والاستماع داخل المصحف.
          </p>
        </div>

      </div>

      {/* 4. Secondary Row: Khatma Completion Rings & Days of Week Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Quran Verses & Pages Completion Proportion */}
        <div className="bg-stone-900/95 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-emerald-200">ختم الآيات والصفحات</h3>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                القرآن كاملاً
              </span>
            </div>

            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              إجمالي ما تم ختمه وقراءته من كتاب الله العزيز حتى الآن:
            </p>
          </div>

          {/* Dual Visual Progress Bars */}
          <div className="space-y-4">
            
            {/* Verses Progress */}
            <div className="space-y-1.5 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  الآيات التي تم ختمها:
                </span>
                <span className="font-bold text-emerald-400 font-quran text-sm">
                  {toArabicNumeral(summary.totalVersesCompleted)} / {toArabicNumeral(summary.totalVersesInQuran)}
                </span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, summary.versesCompletionPercent)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-stone-500">
                <span>المتبقي: {toArabicNumeral(summary.totalVersesInQuran - summary.totalVersesCompleted)} آية</span>
                <span className="text-emerald-300 font-bold">%{toArabicNumeral(summary.versesCompletionPercent)}</span>
              </div>
            </div>

            {/* Pages Progress */}
            <div className="space-y-1.5 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  الصفحات التي تم ختمها:
                </span>
                <span className="font-bold text-amber-400 font-quran text-sm">
                  {toArabicNumeral(summary.totalPagesCompleted)} / {toArabicNumeral(summary.totalPagesInQuran)}
                </span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, summary.pagesCompletionPercent)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-stone-500">
                <span>المتبقي: {toArabicNumeral(summary.totalPagesInQuran - summary.totalPagesCompleted)} صفحة</span>
                <span className="text-amber-300 font-bold">%{toArabicNumeral(summary.pagesCompletionPercent)}</span>
              </div>
            </div>

          </div>

          {/* Action button to Khatma Tracker */}
          {onNavigateToKhatma && (
            <button
              onClick={onNavigateToKhatma}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold border border-stone-700 transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>فتح جدول ومتابعة الختمة الشاملة</span>
            </button>
          )}

        </div>

        {/* Right: Days of the Week Reading Habit Analysis (2 cols) */}
        <div className="lg:col-span-2 bg-stone-900/95 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-amber-200">توزيع القراءة خلال أيام الأسبوع</h3>
              </div>
              <span className="text-xs text-stone-400">معدل الصفحات المقروءة</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              يوضح لك هذا الرسم أكثر الأيام التي تحرص فيها على تلاوة وتدبر القرآن الكريم لمساعدتك على الحفاظ على الورْد.
            </p>
          </div>

          {/* Day of Week Bar Chart */}
          <div className="w-full h-52 dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#78716c" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#44403c' }}
                />
                <YAxis 
                  stroke="#78716c" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#44403c' }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${toArabicNumeral(value)} صفحة`, 'إجمالي الصفحات']}
                  labelFormatter={(label) => `يوم ${label}`}
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#d97706', borderRadius: '12px', color: '#f5f5f4', direction: 'rtl' }}
                />
                <Bar 
                  dataKey="pages" 
                  fill="#f59e0b" 
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions to start reading immediately */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
            <span className="text-xs text-stone-400">جاهز لمواصلة التلاوة الآن؟</span>
            <div className="flex items-center gap-2">
              {onNavigateToPages && (
                <button
                  onClick={onNavigateToPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>قراءة المصحف بالصفحات</span>
                </button>
              )}
              {onNavigateToSurahs && (
                <button
                  onClick={onNavigateToSurahs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>فهرس السور</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 5. Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-right font-cairo">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-amber-100">تحديد الهدف القرآني اليومي</h3>
              </div>
              <button 
                onClick={() => setShowGoalModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  الهدف اليومي لعدد الصفحات:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customPagesGoal}
                    onChange={(e) => setCustomPagesGoal(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-xs text-stone-400 whitespace-nowrap">صفحات / يوم</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  (قراءة 4 صفحات يومياً = ختم المصحف الشريف خلال 5 أشهر تقريباً)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  الهدف اليومي لعدد الآيات:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={customVersesGoal}
                    onChange={(e) => setCustomVersesGoal(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 font-bold focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="text-xs text-stone-400 whitespace-nowrap">آية / يوم</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  حفظ الهدف
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Quick Add Manual Reading Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-right font-cairo">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-amber-100">تسجيل ورْد قراءة يدوي</h3>
              </div>
              <button 
                onClick={() => setShowQuickAddModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              إذا قمت بقراءة ورْدك اليومي من مصحف ورقي أو خارج التطبيق، يمكنك إضافة عدد الصفحات هنا لاحتسابها في إحصائياتك:
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-300">
                كم صفحة قرأت اليوم؟
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuickAddCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      quickAddCount === count
                        ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                        : 'bg-stone-950 text-stone-300 border border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    {toArabicNumeral(count)} {count === 1 ? 'صفحة' : count === 2 ? 'صفحتان' : 'صفحات'}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="604"
                value={quickAddCount}
                onChange={(e) => setQuickAddCount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none text-center"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleQuickAddPages}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                إضافة للإحصائيات
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. Reset Stats Footer trigger */}
      <div className="text-center pt-4">
        <button
          onClick={handleResetData}
          className="text-xs text-stone-500 hover:text-rose-400 transition-colors underline decoration-stone-700"
        >
          إعادة تعيين وبدء الإحصائيات من الصفر
        </button>
      </div>

    </div>
  );
};
