/**
 * Device detection and adaptive controls service
 * Detects device form factors (mobile, tablet, desktop), touch capabilities,
 * orientation, and provides keyboard shortcuts and haptic feedback.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceModePreference = 'auto' | 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  actualType: DeviceType;
  isTouch: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  hasKeyboard: boolean;
  devicePixelRatio: number;
  preference: DeviceModePreference;
}

const STORAGE_KEY = 'tawbah_device_mode_preference';

/**
 * Detect actual physical hardware device type based on viewport and user agent
 */
export function getActualDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTabletUA = /ipad|tablet|(android(?!.*mobile))/i.test(ua);

  if (isTabletUA || (isTouch && width >= 768 && width <= 1024)) {
    return 'tablet';
  }

  if (isMobileUA || width < 768) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Get stored preference or 'auto'
 */
export function getDevicePreference(): DeviceModePreference {
  try {
    const val = localStorage.getItem(STORAGE_KEY) as DeviceModePreference;
    if (val === 'mobile' || val === 'tablet' || val === 'desktop' || val === 'auto') {
      return val;
    }
  } catch (e) {}
  return 'auto';
}

/**
 * Set user preference for device mode
 */
export function setDevicePreference(pref: DeviceModePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch (e) {}
}

/**
 * Get comprehensive active device info
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      actualType: 'desktop',
      isTouch: false,
      isPortrait: false,
      isLandscape: true,
      screenWidth: 1920,
      screenHeight: 1080,
      hasKeyboard: true,
      devicePixelRatio: 1,
      preference: 'auto'
    };
  }

  const actualType = getActualDeviceType();
  const preference = getDevicePreference();
  const activeType: DeviceType = preference === 'auto' ? actualType : preference;

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isPortrait = window.innerHeight > window.innerWidth;

  return {
    type: activeType,
    actualType: actualType,
    isTouch,
    isPortrait,
    isLandscape: !isPortrait,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    hasKeyboard: actualType === 'desktop' || !isTouch,
    devicePixelRatio: window.devicePixelRatio || 1,
    preference
  };
}

/**
 * Trigger subtle haptic feedback on touch devices supporting vibration
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 40, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30]);
        break;
    }
  } catch (e) {
    // Ignore unsupported
  }
}
