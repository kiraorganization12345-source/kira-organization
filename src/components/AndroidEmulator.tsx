import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  BatteryMedium, 
  Volume2, 
  Smartphone, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Power, 
  Layers, 
  ChevronLeft, 
  Circle, 
  Square, 
  Triangle, 
  Compass, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Heart, 
  Clock, 
  BarChart3, 
  Calendar, 
  Bookmark, 
  Bell, 
  Moon,
  Info,
  Check,
  X
} from 'lucide-react';
import { ViewMode } from '../types';
import { toArabicNumeral } from '../services/quranApi';

export type DeviceModel = 'pixel' | 'galaxy' | 'compact' | 'flexible';
export type ChassisColor = 'obsidian' | 'emerald' | 'gold';
export type NavType = 'three_button' | 'gesture';

interface AndroidEmulatorProps {
  children: React.ReactNode;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isPlayingAudio?: boolean;
  activeModalOpen?: boolean;
  onCloseActiveModal?: () => void;
  siteMode?: 'dark' | 'light';
  onToggleSiteMode?: () => void;
}

export const AndroidEmulator: React.FC<AndroidEmulatorProps> = ({
  children,
  activeView,
  setActiveView,
  isPlayingAudio = false,
  activeModalOpen = false,
  onCloseActiveModal,
  siteMode = 'dark',
  onToggleSiteMode
}) => {
  const [deviceModel, setDeviceModel] = useState<DeviceModel>('pixel');
  const [chassisColor, setChassisColor] = useState<ChassisColor>('obsidian');
  const [navType, setNavType] = useState<NavType>('three_button');
  const [isPoweredOn, setIsPoweredOn] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showRecentsDrawer, setShowRecentsDrawer] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [batteryLevel] = useState<number>(97);
  const [showControlsHelp, setShowControlsHelp] = useState<boolean>(false);
  const [isFullWindow, setIsFullWindow] = useState<boolean>(false);

  // Live Digital Clock (updating every second)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Hardware / System UI Back Button (Android Back Button)
  const handleAndroidBack = () => {
    if (showRecentsDrawer) {
      setShowRecentsDrawer(false);
      return;
    }
    if (activeModalOpen && onCloseActiveModal) {
      onCloseActiveModal();
      return;
    }
    if (activeView !== 'surahs') {
      setActiveView('surahs');
    }
  };

  // Handle Android Home Button
  const handleAndroidHome = () => {
    setShowRecentsDrawer(false);
    if (activeModalOpen && onCloseActiveModal) {
      onCloseActiveModal();
    }
    setActiveView('surahs');
  };

  // Handle Android Recents (Multitasking) Button
  const handleAndroidRecents = () => {
    setShowRecentsDrawer(prev => !prev);
  };

  // Device Dimension Maps
  const deviceStyles: Record<DeviceModel, { width: string; height: string; label: string; ratio: string; rounded: string }> = {
    pixel: { width: 'w-full max-w-[412px]', height: 'h-[870px] max-h-[92vh]', label: 'Google Pixel 8 Pro (412x870)', ratio: '412/870', rounded: 'rounded-[48px]' },
    galaxy: { width: 'w-full max-w-[360px]', height: 'h-[800px] max-h-[92vh]', label: 'Samsung Galaxy S24 (360x800)', ratio: '360/800', rounded: 'rounded-[42px]' },
    compact: { width: 'w-full max-w-[375px]', height: 'h-[812px] max-h-[92vh]', label: 'Android Compact (375x812)', ratio: '375/812', rounded: 'rounded-[44px]' },
    flexible: { width: 'w-full max-w-[430px]', height: 'h-[890px] max-h-[94vh]', label: 'تجاوب تلقائي (Fit Window)', ratio: 'auto', rounded: 'rounded-[46px]' }
  };

  // Chassis Color Configurations
  const chassisStyles: Record<ChassisColor, { border: string; bg: string; shadow: string; ring: string; accent: string }> = {
    obsidian: {
      border: 'border-stone-800/90',
      bg: 'bg-[#121212]',
      shadow: 'shadow-[0_25px_70px_rgba(0,0,0,0.85)]',
      ring: 'ring-1 ring-stone-700/60',
      accent: 'text-amber-400'
    },
    emerald: {
      border: 'border-emerald-700/80',
      bg: 'bg-[#032e24]',
      shadow: 'shadow-[0_25px_70px_rgba(3,46,36,0.6)]',
      ring: 'ring-1 ring-emerald-500/50',
      accent: 'text-emerald-400'
    },
    gold: {
      border: 'border-amber-600/80',
      bg: 'bg-[#1c1917]',
      shadow: 'shadow-[0_25px_70px_rgba(245,158,11,0.35)]',
      ring: 'ring-1 ring-amber-400/50',
      accent: 'text-amber-300'
    }
  };

  const currentDevice = deviceStyles[deviceModel];
  const currentChassis = chassisStyles[chassisColor];

  // Quick recent apps list
  const recentCards: { id: ViewMode; title: string; subtitle: string; icon: React.ReactNode; color: string }[] = [
    { id: 'surahs', title: 'فهرس السور', subtitle: '١١٤ سورة كريمة بالترتيب العثماني', icon: <BookOpen className="w-5 h-5" />, color: 'bg-amber-500 text-stone-950' },
    { id: 'mushaf_page', title: 'المصحف الشريف', subtitle: 'قراءة الصفحات بخط مجمع الملك فهد', icon: <FileText className="w-5 h-5" />, color: 'bg-emerald-600 text-white' },
    { id: 'ai_assistant', title: 'التدبر بالذكاء الاصطناعي', subtitle: 'اسأل عن معاني القرآن وتدبر الآيات', icon: <Sparkles className="w-5 h-5" />, color: 'bg-purple-600 text-white' },
    { id: 'athkar', title: 'حصن المسلم والأذكار', subtitle: 'أذكار الصباح والمساء واليوم والليلة', icon: <Heart className="w-5 h-5" />, color: 'bg-rose-600 text-white' },
    { id: 'prayers', title: 'مواقيت الصلاة والقبلة', subtitle: 'أوقات الأذان والاتجاه الدقيق للقبلة', icon: <Clock className="w-5 h-5" />, color: 'bg-blue-600 text-white' },
    { id: 'stats', title: 'إحصائيات القراءة', subtitle: 'تتبع الصفحات والسور المقروءة يومياً', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-teal-600 text-white' },
    { id: 'khatma', title: 'خطة ختم القرآن', subtitle: 'جدول الختمة ومتابعة الإنجاز اليومي', icon: <Calendar className="w-5 h-5" />, color: 'bg-amber-600 text-white' },
    { id: 'bookmarks', title: 'العلامات المرجعية', subtitle: 'الآيات والمواضع المحفوظة للمراجعة', icon: <Bookmark className="w-5 h-5" />, color: 'bg-amber-500 text-stone-950' }
  ];

  if (isFullWindow) {
    return (
      <div className="w-full min-h-screen bg-black relative">
        {/* Floating return to emulator button */}
        <button
          onClick={() => setIsFullWindow(false)}
          className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-xl backdrop-blur-md hover:bg-stone-800"
          title="العودة لوضع محاكي هاتف أندرويد"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>وضع المحاكي</span>
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] islamic-bg-pattern flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none font-cairo">
      
      {/* ============================================================ */}
      {/* Top Emulator Studio Workbench Toolbar                        */}
      {/* ============================================================ */}
      <header className="w-full max-w-4xl mb-3 sm:mb-5 flex flex-wrap items-center justify-between gap-2.5 bg-stone-900/95 border border-stone-800 px-3.5 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl">
        
        {/* Brand & Emulator Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-stone-100 flex items-center gap-1.5">
                <span>محاكي تطبيق أندرويد</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Android 14 • Material You
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              واجهة أندرويد رسمية بأبعاد الهاتف الحقيقية وأزرار النظام التفاعلية
            </p>
          </div>
        </div>

        {/* Emulator Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* Device Model Selector */}
          <select
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value as DeviceModel)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-200 font-bold outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            title="اختيار طراز هاتف أندرويد"
          >
            <option value="pixel">📱 Pixel 8 Pro (412x870)</option>
            <option value="galaxy">📱 Galaxy S24 (360x800)</option>
            <option value="compact">📱 Android Compact (375x812)</option>
            <option value="flexible">📱 شاشة مرنة (Auto Fit)</option>
          </select>

          {/* Nav Type Selector (3-Button vs Gesture) */}
          <div className="flex items-center bg-stone-800 p-0.5 rounded-xl border border-stone-700 text-xs">
            <button
              onClick={() => setNavType('three_button')}
              className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                navType === 'three_button' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="أزرار أندرويد الثلاثة التقليدية"
            >
              <Triangle className="w-2.5 h-2.5 -rotate-90 fill-current" />
              <span className="text-[11px] hidden sm:inline">أزرار النظام</span>
            </button>
            <button
              onClick={() => setNavType('gesture')}
              className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                navType === 'gesture' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="إيماءات السحب الحديثة"
            >
              <span className="w-3 h-0.5 bg-current rounded-full inline-block" />
              <span className="text-[11px] hidden sm:inline">الإيماءات</span>
            </button>
          </div>

          {/* Chassis Color Picker */}
          <div className="flex items-center gap-1 p-1 bg-stone-800 rounded-xl border border-stone-700" title="لون هيكل الهاتف">
            <button
              onClick={() => setChassisColor('obsidian')}
              className={`w-5 h-5 rounded-full bg-stone-950 border border-stone-600 transition-transform ${chassisColor === 'obsidian' ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60'}`}
              title="أسود تيتانيوم"
            />
            <button
              onClick={() => setChassisColor('emerald')}
              className={`w-5 h-5 rounded-full bg-[#032e24] border border-emerald-500 transition-transform ${chassisColor === 'emerald' ? 'ring-2 ring-emerald-400 scale-110' : 'opacity-60'}`}
              title="أخضر زمردي"
            />
            <button
              onClick={() => setChassisColor('gold')}
              className={`w-5 h-5 rounded-full bg-amber-600 border border-amber-300 transition-transform ${chassisColor === 'gold' ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60'}`}
              title="ذهبي ملكي"
            />
          </div>

          {/* Device Power / Screen Standby Toggle */}
          <button
            onClick={() => setIsPoweredOn(prev => !prev)}
            className={`p-1.5 rounded-xl border transition-all ${
              isPoweredOn ? 'bg-stone-800 border-stone-700 text-emerald-400 hover:bg-stone-700' : 'bg-red-950/80 border-red-700 text-red-300 animate-pulse'
            }`}
            title={isPoweredOn ? 'قفل الشاشة / وضع السكون' : 'تشغيل شاشة الهاتف'}
          >
            <Power className="w-4 h-4" />
          </button>

          {/* Fullscreen Expand Toggle */}
          <button
            onClick={() => setIsFullWindow(true)}
            className="p-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-300 hover:bg-stone-700 transition-colors"
            title="عرض كامل بدون إطار الهاتف (Fullscreen)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

        </div>
      </header>

      {/* ============================================================ */}
      {/* Smartphone Chassis Frame (إطار الهاتف الذكي)                  */}
      {/* ============================================================ */}
      <div className="relative group/phone">
        
        {/* Realistic Hardware Side Buttons (Left & Right of phone body) */}
        {/* Power Button (Right) */}
        <button
          onClick={() => setIsPoweredOn(prev => !prev)}
          className="absolute -left-[5px] top-28 w-[5px] h-12 bg-stone-700 rounded-l-md hover:bg-amber-500 transition-colors cursor-pointer shadow-sm z-10"
          title="زر التشغيل / القفل (Power Button)"
        />
        {/* Volume Up Button (Right) */}
        <div className="absolute -left-[5px] top-44 w-[5px] h-10 bg-stone-700 rounded-l-md shadow-sm z-10" title="زر رفع الصوت" />
        {/* Volume Down Button (Right) */}
        <div className="absolute -left-[5px] top-56 w-[5px] h-10 bg-stone-700 rounded-l-md shadow-sm z-10" title="زر خفض الصوت" />

        {/* Outer Phone Bezel Body */}
        <div className={`relative ${currentDevice.width} ${currentDevice.height} ${currentDevice.rounded} ${currentChassis.bg} ${currentChassis.border} border-[10px] sm:border-[12px] ${currentChassis.shadow} ${currentChassis.ring} transition-all duration-300 flex flex-col overflow-hidden`}>
          
          {/* Top Speaker Ear Grill */}
          <div className="absolute top-2.5 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className="w-14 h-1 bg-stone-700/80 rounded-full" />
          </div>

          {/* ============================================================ */}
          {/* Android Status Bar (شريط الحالة العلوي للنظام)               */}
          {/* ============================================================ */}
          <div className="w-full h-8 px-4 flex items-center justify-between bg-black/95 text-stone-200 text-xs font-semibold select-none shrink-0 z-40 border-b border-white/5 backdrop-blur-md">
            
            {/* Left Status Bar: Time & Quran App Notification Icon */}
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-xs text-stone-100">{currentTime || '12:00'}</span>
              <div className="flex items-center gap-1 text-amber-400">
                <BookOpen className="w-3 h-3" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>

            {/* Center: Camera Punch Hole & Dynamic Island Notification */}
            <div className="flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Punch hole camera lens */}
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-stone-800 ring-2 ring-stone-900/90 flex items-center justify-center overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-950 ring-1 ring-blue-900/40" />
                </div>
                
                {/* Audio Dynamic Indicator (if audio playing) */}
                {isPlayingAudio && (
                  <div className="absolute -right-8 flex items-center gap-0.5 bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40 animate-pulse text-[9px] font-bold">
                    <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Status Bar: Do Not Disturb, Wi-Fi, 5G, Battery */}
            <div className="flex items-center gap-1.5 text-stone-300 text-[11px]">
              <span className="font-bold text-[10px] text-amber-300">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold text-stone-200">{batteryLevel}%</span>
                <div className="w-4 h-2.5 rounded-[3px] border border-stone-400 p-0.5 flex items-center">
                  <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* Main App Content Viewport (داخل شاشة الهاتف)                  */}
          {/* ============================================================ */}
          <div className="relative flex-1 w-full overflow-hidden bg-black android-device-screen flex flex-col">
            
            {/* If Screen is Powered Off (Standby Mode) */}
            {!isPoweredOn ? (
              <div 
                onClick={() => setIsPoweredOn(true)}
                className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
              >
                <Moon className="w-12 h-12 text-stone-700 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold font-quran text-stone-500 mb-1">{currentTime}</h3>
                <p className="text-xs text-stone-600 font-bold mb-6">شاشة الهاتف في وضع السكون</p>
                <div className="px-4 py-2 rounded-full bg-stone-900 border border-stone-800 text-amber-400 text-xs font-bold shadow-lg flex items-center gap-2">
                  <Power className="w-3.5 h-3.5" />
                  <span>انقر لتنشيط الشاشة</span>
                </div>
              </div>
            ) : (
              <div id="android-app-viewport" className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col">
                {children}
              </div>
            )}

            {/* ============================================================ */}
            {/* Android Recents Multitasking Drawer                          */}
            {/* ============================================================ */}
            {showRecentsDrawer && (
              <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl p-4 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-stone-100">التطبيقات والمهام الأخيرة</h4>
                      <p className="text-[10px] text-stone-400">انقر للانتقال الفوري إلى أي قسم</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecentsDrawer(false)}
                    className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid / Stack of Recent App Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto py-3 max-h-[60vh]">
                  {recentCards.map(card => {
                    const isCardActive = activeView === card.id;
                    return (
                      <button
                        key={card.id}
                        onClick={() => {
                          setActiveView(card.id);
                          setShowRecentsDrawer(false);
                        }}
                        className={`p-3 rounded-2xl text-right border transition-all flex items-start gap-3 md-ripple ${
                          isCardActive
                            ? 'bg-stone-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg scale-[1.02]'
                            : 'bg-stone-900/90 border-stone-800 hover:border-amber-500/40'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${card.color}`}>
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-stone-100 truncate">{card.title}</h5>
                          <p className="text-[10px] text-stone-400 line-clamp-2 mt-0.5">{card.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-stone-800 flex justify-center">
                  <button
                    onClick={() => {
                      setActiveView('surahs');
                      setShowRecentsDrawer(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    إغلاق والعودة للرئيسية
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* Android System Navigation Bar (شريط أزرار التنقل السفلي)      */}
          {/* ============================================================ */}
          <div className="w-full h-10 sm:h-11 px-6 bg-black text-stone-300 flex items-center justify-around select-none shrink-0 z-40 border-t border-stone-900/80">
            
            {navType === 'three_button' ? (
              <>
                {/* Back Button (Triangle / ◀) */}
                <button
                  onClick={handleAndroidBack}
                  className="min-h-[38px] min-w-[54px] rounded-xl flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-stone-900/80 active:scale-90 active:bg-amber-500/20 transition-all md-ripple"
                  title="زر الرجوع (Back)"
                >
                  <Triangle className="w-4 h-4 -rotate-90 fill-current" />
                </button>

                {/* Home Button (Circle / ⬤) */}
                <button
                  onClick={handleAndroidHome}
                  className="min-h-[38px] min-w-[54px] rounded-xl flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-stone-900/80 active:scale-90 active:bg-amber-500/20 transition-all md-ripple"
                  title="الشاشة الرئيسية (Home)"
                >
                  <Circle className="w-4 h-4 fill-current" />
                </button>

                {/* Recents Button (Square / ◼) */}
                <button
                  onClick={handleAndroidRecents}
                  className={`min-h-[38px] min-w-[54px] rounded-xl flex items-center justify-center transition-all md-ripple ${
                    showRecentsDrawer ? 'text-amber-400 bg-stone-800' : 'text-stone-400 hover:text-amber-400 hover:bg-stone-900/80 active:scale-90'
                  }`}
                  title="المهام والتطبيقات المفتوحة (Recent Apps)"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </>
            ) : (
              /* Gesture Pill Bar */
              <div 
                onClick={handleAndroidHome}
                className="w-32 h-1.5 bg-stone-500 hover:bg-amber-400 rounded-full cursor-pointer transition-colors active:scale-95 my-auto"
                title="شريط الإيماءات (انقر للرئيسية)"
              />
            )}

          </div>

        </div>

      </div>

      {/* Footer hint text */}
      <footer className="mt-3 text-center text-stone-500 text-xs flex items-center gap-2">
        <span>موقع التوبة الشامل للقرآن الكريم</span>
        <span>•</span>
        <span className="text-amber-400/80">تجربة أندرويد حقيقية بنظام Material Design</span>
      </footer>

    </div>
  );
};
