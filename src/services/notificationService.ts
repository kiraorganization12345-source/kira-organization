/**
 * Quran Daily Push Notification & Reminder Service
 * Handles Web Notifications API, local storage configuration, audio chime, and scheduling.
 */

export interface NotificationSettings {
  enabled: boolean;
  time: string; // "HH:MM" 24-hour format e.g. "06:00"
  preset: 'fajr' | 'morning' | 'dhuhr' | 'asr' | 'maghrib' | 'night' | 'custom';
  messagePreset: string;
  customMessage: string;
  soundEnabled: boolean;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday (empty means every day)
  lastTriggeredDate: string; // YYYY-MM-DD to avoid duplicate triggers
  inAppToastEnabled: boolean;
}

export const NOTIFICATION_STORAGE_KEY = 'quran_daily_notification_settings_v1';

export const REMINDER_MESSAGE_PRESETS: { id: string; title: string; text: string }[] = [
  {
    id: 'default',
    title: 'تذكير الورد القرآني اليومي 📖',
    text: 'حان وقت وردك اليومي من كتاب الله تعالى.. نوّر قلبك بتلاوة آيات عطرة.'
  },
  {
    id: 'verse_tatmain',
    title: '﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾ ✨',
    text: 'توقف قليلاً واسترح مع القرآن الكريم.. دقيقة تلاوة تصنع يومك.'
  },
  {
    id: 'khatma_goal',
    title: 'متابعة خطة ختم القرآن 🏆',
    text: 'لا تدع اليوم يمر دون قراءة نصيبك من الصفحات لتحقيق هدف الختمة المباركة.'
  },
  {
    id: 'barakah',
    title: 'بركة اليوم والقرآن 🌿',
    text: 'القرآن شفاء وبركة وسكينة.. اقرأ وردك الآن واشعر بالطمأنينة.'
  },
  {
    id: 'night_quran',
    title: 'ورد المساء والسكينة 🌙',
    text: 'اختم يومك بخير ما يُختم به.. رتّل آيات من الذكر الحكيم قبل النوم.'
  }
];

export const TIME_PRESETS: { id: NotificationSettings['preset']; label: string; time: string; icon: string }[] = [
  { id: 'fajr', label: 'بعد الفجر', time: '05:30', icon: '🌅' },
  { id: 'morning', label: 'الضحى والصباح', time: '09:00', icon: '☀️' },
  { id: 'dhuhr', label: 'بعد الظهر', time: '13:00', icon: '☀️' },
  { id: 'asr', label: 'بعد العصر', time: '16:45', icon: '🌤️' },
  { id: 'maghrib', label: 'بعد المغرب', time: '18:45', icon: '🌇' },
  { id: 'night', label: 'المساء وقبل النوم', time: '21:30', icon: '🌙' },
  { id: 'custom', label: 'وقت مخصص', time: '18:00', icon: '⏰' }
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  time: '18:00',
  preset: 'maghrib',
  messagePreset: 'default',
  customMessage: '',
  soundEnabled: true,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // all days
  lastTriggeredDate: '',
  inAppToastEnabled: true
};

/**
 * Load settings from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Error loading notification settings:', e);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
}

/**
 * Check if Web Notifications are supported in current browser
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

/**
 * Synthesize gentle Islamic chime sound using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic bell chime notes (Pentatonic / Gentle Eastern bell frequencies)
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0, now + index * 0.12);
      gain.gain.linearRampToValueAtTime(0.25 / (index + 1), now + index * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 1.25);
    });
  } catch (err) {
    console.warn('Could not play notification chime:', err);
  }
}

/**
 * Send an immediate browser notification
 */
export function triggerBrowserNotification(title: string, body: string, sound: boolean = true): boolean {
  if (sound) {
    playNotificationSound();
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const quranIcon = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=128&auto=format&fit=crop&q=80';
    
    const notification = new Notification(title, {
      body,
      icon: quranIcon,
      badge: quranIcon,
      tag: 'quran-daily-reminder',
      dir: 'rtl',
      lang: 'ar',
      requireInteraction: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Error triggering notification:', err);
    return false;
  }
}

/**
 * Get active message title & body based on settings
 */
export function getFormattedReminderMessage(settings: NotificationSettings): { title: string; body: string } {
  if (settings.customMessage && settings.customMessage.trim().length > 0) {
    return {
      title: 'تذكير الورد القرآني 📖',
      body: settings.customMessage.trim()
    };
  }

  const preset = REMINDER_MESSAGE_PRESETS.find(p => p.id === settings.messagePreset) || REMINDER_MESSAGE_PRESETS[0];
  return {
    title: preset.title,
    body: preset.text
  };
}

/**
 * Check if reminder should trigger at current minute
 */
export function shouldTriggerNow(settings: NotificationSettings): boolean {
  if (!settings.enabled) return false;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const todayDateStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = now.getDay(); // 0 = Sun .. 6 = Sat

  // Check day of week
  if (settings.daysOfWeek && settings.daysOfWeek.length > 0 && !settings.daysOfWeek.includes(currentDayOfWeek)) {
    return false;
  }

  // Check if already triggered today
  if (settings.lastTriggeredDate === todayDateStr) {
    return false;
  }

  // Check if time matches
  return currentTimeStr === settings.time;
}
