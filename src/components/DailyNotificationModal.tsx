import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Check, 
  X, 
  Volume2, 
  Sparkles, 
  Smartphone, 
  AlertCircle, 
  Calendar, 
  Send,
  HelpCircle,
  VolumeX,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { 
  NotificationSettings, 
  getNotificationSettings, 
  saveNotificationSettings, 
  getNotificationPermission, 
  requestNotificationPermission, 
  playNotificationSound, 
  triggerBrowserNotification, 
  getFormattedReminderMessage, 
  TIME_PRESETS, 
  REMINDER_MESSAGE_PRESETS 
} from '../services/notificationService';
import { toArabicNumeral } from '../services/quranApi';

interface DailyNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToQuran?: () => void;
}

const DAYS_OF_WEEK = [
  { id: 6, label: 'السبت' },
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الإثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
  { id: 5, label: 'الجمعة' }
];

export const DailyNotificationModal: React.FC<DailyNotificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToQuran
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [testSent, setTestSent] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setPermission(getNotificationPermission());
      setTestSent(false);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  const handleToggleEnabled = () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    
    // If enabling and permission is default, request it
    if (!settings.enabled && permission === 'default') {
      handleRequestPermission();
    }
  };

  const handleSelectPreset = (presetId: NotificationSettings['preset'], time: string) => {
    const updated = { ...settings, preset: presetId, time };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleTimeChange = (newTime: string) => {
    const updated = { ...settings, time: newTime, preset: 'custom' as const };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleToggleDay = (dayId: number) => {
    let days = [...settings.daysOfWeek];
    if (days.includes(dayId)) {
      if (days.length > 1) { // keep at least 1 day
        days = days.filter(d => d !== dayId);
      }
    } else {
      days.push(dayId);
    }
    const updated = { ...settings, daysOfWeek: days };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSelectAllDays = () => {
    const updated = { ...settings, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleMessagePresetChange = (presetId: string) => {
    const updated = { ...settings, messagePreset: presetId, customMessage: '' };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleCustomMessageChange = (text: string) => {
    const updated = { ...settings, customMessage: text };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (updated.soundEnabled) {
      playNotificationSound();
    }
  };

  const handleSendTestNotification = () => {
    const { title, body } = getFormattedReminderMessage(settings);
    
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    triggerBrowserNotification(title, body, false);

    setTestSent(true);
    setTimeout(() => {
      setTestSent(false);
    }, 4000);
  };

  const handleSaveAndClose = () => {
    saveNotificationSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-cairo overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-stone-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl text-stone-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Islamic Pattern Accent */}
        <div className="flex items-start justify-between border-b border-stone-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-200 flex items-center gap-2">
                <span>تنبيهات الورد القرآني اليومي</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Push Notifications
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                اضبط وقتاً مخصصاً لتذكيرك بقراءة ورْدك من كتاب الله يومياً وتثبيت عبادتك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Status Banner */}
        <div className={`p-4 rounded-2xl border transition-all ${
          permission === 'granted'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : permission === 'denied'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              {permission === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold">
                  {permission === 'granted' && 'إذن الإشعارات مفعل في المتصفح ✅'}
                  {permission === 'denied' && 'إشعارات المتصفح محظورة ⚠️'}
                  {permission === 'default' && 'إذن الإشعارات بانتظار الموافقة 🔔'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {permission === 'granted' && 'ستصلك التنبيهات على جهازك في الموعد المحدد حتى لو كان التطبيق مغلقاً.'}
                  {permission === 'denied' && 'يرجى النقر على قفل الأمان بجوار رابط الموقع في المتصفح والسماح بالإشعارات.'}
                  {permission === 'default' && 'انقر على الزر لتفعيل إشعارات الورد وتلقي التذكيرات اليومية.'}
                </div>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all shrink-0"
              >
                تفعيل الإشعارات الآن
              </button>
            )}
          </div>
        </div>

        {/* Master Notification Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
          <div>
            <div className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <span>تفعيل التذكير اليومي</span>
              {settings.enabled && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  مفعل
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              إرسال إشعار يومي في الوقت المحدد مع صوت تنبيه هادئ
            </p>
          </div>

          <button
            onClick={handleToggleEnabled}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 shadow-inner ${
              settings.enabled ? 'bg-amber-500' : 'bg-stone-700'
            }`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
              settings.enabled ? '-translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Time Settings & Presets */}
        <div className={`space-y-4 transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>اختر وقت التذكير بالورد:</span>
              </label>

              {/* Time display */}
              <div className="text-sm font-bold text-amber-400 font-mono bg-stone-900 px-3 py-1 rounded-xl border border-stone-800">
                {settings.time} {parseInt(settings.time.split(':')[0]) >= 12 ? 'مساءً' : 'صباحاً'}
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_PRESETS.map((p) => {
                const isSelected = settings.preset === p.id && settings.time === p.time;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id, p.time)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                        : 'bg-stone-900/90 hover:bg-stone-800 text-stone-300 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-stone-950 font-bold' : 'text-amber-400/80 font-mono'}`}>
                      {p.time}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Time Picker */}
            <div className="pt-1 flex items-center justify-between bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
              <span className="text-xs text-stone-300 font-bold">أو اختر ساعة مخصصة بدقة:</span>
              <input
                type="time"
                value={settings.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-stone-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-amber-300 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Days of Week Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>أيام التذكير الأسبوعية:</span>
              </label>

              <button
                onClick={handleSelectAllDays}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-semibold"
              >
                تحديد جميع الأيام
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = settings.daysOfWeek.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => handleToggleDay(d.id)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-800'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder Message Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>صيغة رسالة التذكير:</span>
            </label>

            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar p-1">
              {REMINDER_MESSAGE_PRESETS.map((m) => {
                const isSelected = settings.messagePreset === m.id && !settings.customMessage;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMessagePresetChange(m.id)}
                    className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm'
                        : 'bg-stone-900/70 hover:bg-stone-900 text-stone-300 border-stone-800/80'
                    }`}
                  >
                    <div className="font-bold text-amber-300 mb-0.5">{m.title}</div>
                    <div className="text-[11px] text-stone-400 line-clamp-1">{m.text}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom text override */}
            <div className="pt-1">
              <input
                type="text"
                placeholder="أو اكتب نص تذكير مخصص من اختيارك..."
                value={settings.customMessage}
                onChange={(e) => handleCustomMessageChange(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Audio Chime & In-App Toast Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/70 border border-stone-800">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-stone-200">صوت التنبيه الهادئ</div>
                  <div className="text-[10px] text-stone-400">نغمة جرس إسلامية هادئة</div>
                </div>
              </div>

              <button
                onClick={handleToggleSound}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-stone-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? '-translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Test notification button */}
            <button
              onClick={handleSendTestNotification}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>{testSent ? 'تم إرسال الإشعار بنجاح! ✅' : 'إرسال إشعار تجريبي الآن'}</span>
            </button>

          </div>

        </div>

        {/* Mobile & Android PWA Tip */}
        <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-stone-300">ملاحظة لمستخدمي الهواتف الذكية: </span>
            لضمان وصول الإشعارات بشكل دائم، يُفضل تثبيت التطبيق على الشاشة الرئيسية (PWA) من قائمة المتصفح "إضافة إلى الشاشة الرئيسية".
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            {onNavigateToQuran && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToQuran();
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors"
              >
                قراءة القرآن الآن
              </button>
            )}

            <button
              onClick={handleSaveAndClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              {savedSuccess ? 'تم الحفظ بنجاح ✓' : 'حفظ إعدادات المنبّه'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
