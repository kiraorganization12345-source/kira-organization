import React, { useState, useEffect } from 'react';
import { Headphones, X, Volume2, Sparkles, Compass, EyeOff, Eye } from 'lucide-react';
import { ViewMode, PaperTheme, FontStyle, Reciter, NavDisplayMode, TrackingHighlightColor, QuranTextColor, NavThemeColor, GlobalTheme, SiteMode } from './types';
import { RECITERS } from './data/reciters';
import { ALL_SURAHS } from './data/surahs';
import { toArabicNumeral } from './services/quranApi';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SurahList } from './components/SurahList';
import { SurahReader } from './components/SurahReader';
import { PageReader } from './components/PageReader';
import { RealisticMushafBook } from './components/RealisticMushafBook';
import { AudioPlayer } from './components/AudioPlayer';
import { TafsirModal } from './components/TafsirModal';
import { SearchView } from './components/SearchView';
import { KhatmaTracker } from './components/KhatmaTracker';
import { BookmarksNotes } from './components/BookmarksNotes';
import { AthkarView } from './components/AthkarView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { TadabburAiModal } from './components/TadabburAiModal';
import { AiAssistantView } from './components/AiAssistantView';
import { QuranMobileAppModal } from './components/QuranMobileAppModal';
import { ListeningModeView } from './components/ListeningModeView';
import { ThemeSwitcherModal } from './components/ThemeSwitcherModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { ReadingStatsView } from './components/ReadingStatsView';
import { DailyNotificationModal } from './components/DailyNotificationModal';
import { InAppNotificationToast } from './components/InAppNotificationToast';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  shouldTriggerNow, 
  getFormattedReminderMessage, 
  playNotificationSound, 
  triggerBrowserNotification 
} from './services/notificationService';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('surahs');
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [mushafPageNumber, setMushafPageNumber] = useState<number>(1);

  // Android Native PWA Install State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAndroidInstalled, setIsAndroidInstalled] = useState<boolean>(false);
  const [isAndroidInstallModalOpen, setIsAndroidInstallModalOpen] = useState<boolean>(false);

  // Live API Voice Conversation Modal State (gemini-3.8-live)
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState<boolean>(false);

  // Mobile App Quran Mode Modal State
  const [isQuranModeModalOpen, setIsQuranModeModalOpen] = useState<boolean>(false);

  // Global Theme Switcher Modal State
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState<boolean>(false);
  const [globalTheme, setGlobalTheme] = useState<GlobalTheme>('amber');

  // Listening Mode (Zero Distractions: All navbars, sidebars and headers hidden while audio plays in background)
  const [isListeningMode, setIsListeningMode] = useState<boolean>(false);

  // Navigation Display Mode: 'expanded' (full bar), 'floating' (suspended floating icon), 'hidden' (completely hidden)
  const [navDisplayMode, setNavDisplayMode] = useState<NavDisplayMode>('expanded');

  // Appearance & Theme Settings (Site Mode: Dark Pure Black by default as requested; PaperTheme)
  const [siteMode, setSiteMode] = useState<SiteMode>('dark');
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('dark');
  const [trackingColor, setTrackingColor] = useState<TrackingHighlightColor>('amber');
  const [quranTextColor, setQuranTextColor] = useState<QuranTextColor>('default');
  const [navTheme, setNavTheme] = useState<NavThemeColor>('stone');
  const [fontSize, setFontSize] = useState<number>(28);
  const [fontStyle, setFontStyle] = useState<FontStyle>('Amiri Quran');
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(() => {
    return RECITERS.find(r => r.id.includes('banna')) || RECITERS[0];
  });
  const [eyeComfortMode, setEyeComfortMode] = useState<boolean>(true);

  // Audio Playback State
  const [currentPlaying, setCurrentPlaying] = useState<{ surahId: number; ayahNum: number; mode?: 'verse' | 'surah' } | null>(null);
  const [isAudioBarHidden, setIsAudioBarHidden] = useState<boolean>(false);

  // Bookmarks & Favorites
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<number[]>([1, 18, 36, 55, 67, 112]);

  // Modals
  const [tafsirModalTarget, setTafsirModalTarget] = useState<{
    surahId: number;
    surahName: string;
    ayahNum: number;
    ayahText: string;
  } | null>(null);

  const [tadabburModalTarget, setTadabburModalTarget] = useState<{
    surahName?: string;
    surahNumber?: number;
    ayahNum?: number;
    ayahText?: string;
  } | null>(null);

  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // Daily Quran Notifications & Reminders State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [inAppToast, setInAppToast] = useState<{ title: string; body: string } | null>(null);

  // Background Reminder Scheduler Loop
  useEffect(() => {
    const checkNotificationTrigger = () => {
      try {
        const settings = getNotificationSettings();
        if (shouldTriggerNow(settings)) {
          const { title, body } = getFormattedReminderMessage(settings);

          // 1. Play chime sound if enabled
          if (settings.soundEnabled) {
            playNotificationSound();
          }

          // 2. Trigger native Web Notification
          triggerBrowserNotification(title, body, false);

          // 3. Show In-App Reminder Toast
          if (settings.inAppToastEnabled) {
            setInAppToast({ title, body });
          }

          // 4. Update last triggered date to prevent repeat today
          const todayDateStr = new Date().toISOString().split('T')[0];
          saveNotificationSettings({
            ...settings,
            lastTriggeredDate: todayDateStr
          });
        }
      } catch (err) {
        console.warn('Error checking notification schedule:', err);
      }
    };

    // Initial check
    checkNotificationTrigger();

    // Check every 20 seconds
    const intervalId = setInterval(checkNotificationTrigger, 20000);

    return () => clearInterval(intervalId);
  }, []);

  // Load persistent bookmarks & favorites & comfort mode on mount
  useEffect(() => {
    // Detect standalone mode (already installed as Android App)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsAndroidInstalled(true);
    }

    // Capture Android BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAndroidInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredInstallPrompt) {
      // If prompt not available yet, open guide
      setIsAndroidInstallModalOpen(true);
      return;
    }
    try {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsAndroidInstalled(true);
      }
      setDeferredInstallPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  useEffect(() => {
    try {
      const savedGlobalTheme = localStorage.getItem('quran_global_theme_v1');
      if (savedGlobalTheme === 'amber' || savedGlobalTheme === 'emerald' || savedGlobalTheme === 'sapphire' || savedGlobalTheme === 'amethyst' || savedGlobalTheme === 'ruby') {
        setGlobalTheme(savedGlobalTheme);
      }

      const savedSiteMode = localStorage.getItem('quran_site_mode_v1');
      if (savedSiteMode === 'light' || savedSiteMode === 'dark') {
        setSiteMode(savedSiteMode);
      }

      const savedPaperTheme = localStorage.getItem('quran_paper_theme_v1');
      if (savedPaperTheme) {
        setPaperTheme(savedPaperTheme as PaperTheme);
      }

      const savedNavMode = localStorage.getItem('quran_nav_display_mode_v1');
      if (savedNavMode === 'expanded' || savedNavMode === 'floating' || savedNavMode === 'hidden') {
        setNavDisplayMode(savedNavMode as NavDisplayMode);
      }

      const savedTrackingColor = localStorage.getItem('quran_tracking_color_v1');
      if (savedTrackingColor) {
        setTrackingColor(savedTrackingColor as TrackingHighlightColor);
      }

      const savedQuranTextColor = localStorage.getItem('quran_text_color_v1');
      if (savedQuranTextColor) {
        setQuranTextColor(savedQuranTextColor as QuranTextColor);
      }

      const savedNavTheme = localStorage.getItem('quran_nav_theme_v1');
      if (savedNavTheme) {
        setNavTheme(savedNavTheme as NavThemeColor);
      }

      const savedFontSize = localStorage.getItem('quran_font_size_v1');
      if (savedFontSize) {
        const parsed = parseInt(savedFontSize, 10);
        if (!isNaN(parsed) && parsed >= 16 && parsed <= 48) {
          setFontSize(parsed);
        }
      }

      const savedFontStyle = localStorage.getItem('quran_font_style_v1');
      if (savedFontStyle) {
        setFontStyle(savedFontStyle as FontStyle);
      }

      const savedB = localStorage.getItem('quran_bookmarks_keys_v1');
      if (savedB) setBookmarks(JSON.parse(savedB));

      const savedF = localStorage.getItem('quran_favorites_v1');
      if (savedF) setFavorites(JSON.parse(savedF));

      const savedComfort = localStorage.getItem('quran_eye_comfort_v1');
      if (savedComfort !== null) setEyeComfortMode(JSON.parse(savedComfort));
    } catch (e) {
      console.warn('LocalStorage error on init:', e);
    }
  }, []);

  // Synchronize site mode and global theme with html element
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', siteMode);
    if (siteMode === 'light' || siteMode === 'warm') {
      document.documentElement.classList.remove('dark');
      if (siteMode === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [siteMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', globalTheme);
  }, [globalTheme]);

  const handleSetSiteMode = (mode: SiteMode) => {
    setSiteMode(mode);
    try {
      localStorage.setItem('quran_site_mode_v1', mode);
    } catch (e) {}
  };

  const handleSetGlobalTheme = (newTheme: GlobalTheme) => {
    setGlobalTheme(newTheme);
    try {
      localStorage.setItem('quran_global_theme_v1', newTheme);
    } catch (e) {}
  };

  // Save paper theme on change
  const handleSetPaperTheme = (newTheme: PaperTheme) => {
    setPaperTheme(newTheme);
    try {
      localStorage.setItem('quran_paper_theme_v1', newTheme);
    } catch (e) {}
  };

  const handleSetTrackingColor = (newColor: TrackingHighlightColor) => {
    setTrackingColor(newColor);
    try {
      localStorage.setItem('quran_tracking_color_v1', newColor);
    } catch (e) {}
  };

  const handleSetQuranTextColor = (newColor: QuranTextColor) => {
    setQuranTextColor(newColor);
    try {
      localStorage.setItem('quran_text_color_v1', newColor);
    } catch (e) {}
  };

  const handleSetNavTheme = (newTheme: NavThemeColor) => {
    setNavTheme(newTheme);
    try {
      localStorage.setItem('quran_nav_theme_v1', newTheme);
    } catch (e) {}
  };

  const handleSetFontSize = (newSize: number) => {
    const clamped = Math.max(16, Math.min(48, newSize));
    setFontSize(clamped);
    try {
      localStorage.setItem('quran_font_size_v1', clamped.toString());
    } catch (e) {}
  };

  const handleSetFontStyle = (newStyle: FontStyle) => {
    setFontStyle(newStyle);
    try {
      localStorage.setItem('quran_font_style_v1', newStyle);
    } catch (e) {}
  };

  const toggleSiteMode = () => {
    const nextMode = siteMode === 'dark' ? 'light' : 'dark';
    setSiteMode(nextMode);
    try {
      localStorage.setItem('quran_site_mode_v1', nextMode);
    } catch (e) {}
  };

  // Eye comfort mode auto-adjust based on time of day
  useEffect(() => {
    if (!eyeComfortMode) return;
    const hour = new Date().getHours();
    const isNight = hour >= 19 || hour < 6;
    if (isNight && paperTheme === 'light') {
      setPaperTheme('sepia');
    }
  }, [eyeComfortMode]);

  // Keep selectedSurahId in sync when audio advances to the next Surah
  useEffect(() => {
    if (currentPlaying && currentPlaying.surahId !== selectedSurahId) {
      setSelectedSurahId(currentPlaying.surahId);
    }
  }, [currentPlaying?.surahId, selectedSurahId]);

  const toggleEyeComfortMode = () => {
    const nextVal = !eyeComfortMode;
    setEyeComfortMode(nextVal);
    try {
      localStorage.setItem('quran_eye_comfort_v1', JSON.stringify(nextVal));
    } catch (e) {}
  };

  // Save Bookmarks
  const toggleBookmark = (surahId: number, surahName: string, ayahNum: number, ayahText: string) => {
    const key = `${surahId}-${ayahNum}`;
    let updatedKeys: string[];
    
    if (bookmarks.includes(key)) {
      updatedKeys = bookmarks.filter(k => k !== key);
    } else {
      updatedKeys = [...bookmarks, key];
      
      // Save item detailed object in localStorage for BookmarksNotes view
      try {
        const savedObjs = localStorage.getItem('quran_bookmarks_v1');
        const list = savedObjs ? JSON.parse(savedObjs) : [];
        const newItem = {
          id: key,
          surahId,
          surahName,
          ayahNumber: ayahNum,
          ayahText,
          createdAt: Date.now()
        };
        const newList = [newItem, ...list.filter((x: any) => x.id !== key)];
        localStorage.setItem('quran_bookmarks_v1', JSON.stringify(newList));
      } catch (e) {
        console.warn('Bookmark save error:', e);
      }
    }

    setBookmarks(updatedKeys);
    try {
      localStorage.setItem('quran_bookmarks_keys_v1', JSON.stringify(updatedKeys));
    } catch (e) {
      console.warn('Bookmark keys save error:', e);
    }
  };

  const removeBookmarkKey = (key: string) => {
    const updated = bookmarks.filter(k => k !== key);
    setBookmarks(updated);
    try {
      localStorage.setItem('quran_bookmarks_keys_v1', JSON.stringify(updated));
      const savedObjs = localStorage.getItem('quran_bookmarks_v1');
      if (savedObjs) {
        const list = JSON.parse(savedObjs);
        localStorage.setItem('quran_bookmarks_v1', JSON.stringify(list.filter((x: any) => x.id !== key)));
      }
    } catch (e) {
      console.warn('Bookmark deletion error:', e);
    }
  };

  // Save Favorites
  const toggleFavorite = (surahId: number) => {
    let updated: number[];
    if (favorites.includes(surahId)) {
      updated = favorites.filter(id => id !== surahId);
    } else {
      updated = [...favorites, surahId];
    }
    setFavorites(updated);
    try {
      localStorage.setItem('quran_favorites_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Favorite save error:', e);
    }
  };

  // Playback Navigation Handlers (Continuous playback through the entire Quran)
  const handleNextAyah = () => {
    if (!currentPlaying) return;
    const currentSurah = ALL_SURAHS.find(s => s.id === currentPlaying.surahId);
    if (!currentSurah) return;

    if (currentPlaying.mode === 'surah') {
      const nextId = currentPlaying.surahId < 114 ? currentPlaying.surahId + 1 : 1;
      setSelectedSurahId(nextId);
      setCurrentPlaying({ surahId: nextId, ayahNum: 1, mode: 'surah' });
      return;
    }

    if (currentPlaying.ayahNum < currentSurah.versesCount) {
      setCurrentPlaying({ surahId: currentPlaying.surahId, ayahNum: currentPlaying.ayahNum + 1, mode: 'verse' });
    } else {
      // Move to next Surah first verse seamlessly (cycles from 114 to 1 for full Mushaf continuity)
      const nextId = currentPlaying.surahId < 114 ? currentPlaying.surahId + 1 : 1;
      setSelectedSurahId(nextId);
      setCurrentPlaying({ surahId: nextId, ayahNum: 1, mode: 'verse' });
    }
  };

  const handlePrevAyah = () => {
    if (!currentPlaying) return;

    if (currentPlaying.mode === 'surah') {
      const prevId = currentPlaying.surahId > 1 ? currentPlaying.surahId - 1 : 114;
      setSelectedSurahId(prevId);
      setCurrentPlaying({ surahId: prevId, ayahNum: 1, mode: 'surah' });
      return;
    }

    if (currentPlaying.ayahNum > 1) {
      setCurrentPlaying({ surahId: currentPlaying.surahId, ayahNum: currentPlaying.ayahNum - 1, mode: 'verse' });
    } else {
      const prevSurahId = currentPlaying.surahId > 1 ? currentPlaying.surahId - 1 : 114;
      const prevSurah = ALL_SURAHS.find(s => s.id === prevSurahId);
      if (prevSurah) {
        setSelectedSurahId(prevSurah.id);
        setCurrentPlaying({ surahId: prevSurah.id, ayahNum: prevSurah.versesCount, mode: 'verse' });
      }
    }
  };

  const handleTogglePlayMode = (newMode: 'verse' | 'surah') => {
    if (!currentPlaying) return;
    setCurrentPlaying({ ...currentPlaying, mode: newMode });
  };

  // Open Surah Reader and automatically start audio playback
  const handleOpenSurah = (surahId: number, autoPlay: boolean = true) => {
    setSelectedSurahId(surahId);
    setActiveView('reader');
    if (autoPlay) {
      setCurrentPlaying({ surahId, ayahNum: 1, mode: 'verse' });
      setIsAudioBarHidden(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open specific verse from Search or Bookmarks
  const handleJumpToVerse = (surahId: number, ayahNum: number) => {
    setSelectedSurahId(surahId);
    setActiveView('reader');
    setCurrentPlaying({ surahId, ayahNum, mode: 'verse' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetNavDisplayMode = (mode: NavDisplayMode) => {
    setNavDisplayMode(mode);
    try {
      localStorage.setItem('quran_nav_display_mode_v1', mode);
    } catch (e) {}
  };

  const toggleBottomNav = () => {
    if (navDisplayMode === 'expanded') {
      handleSetNavDisplayMode('floating');
    } else if (navDisplayMode === 'floating') {
      handleSetNavDisplayMode('hidden');
    } else {
      handleSetNavDisplayMode('expanded');
    }
  };

  // Dedicated Authentic Islamic Listening Mode Experience (Matching user screenshots)
  const handleOpenListeningMode = (surahId?: number) => {
    if (surahId) setSelectedSurahId(surahId);
    setIsListeningMode(true);
    setActiveView('listening');
  };

  const handleCloseListeningMode = () => {
    setIsListeningMode(false);
    if (activeView === 'listening') {
      setActiveView('surahs');
    }
  };

  const toggleListeningMode = () => {
    if (isListeningMode || activeView === 'listening') {
      handleCloseListeningMode();
    } else {
      handleOpenListeningMode();
    }
  };

  const currentPlayingSurahMeta = currentPlaying ? ALL_SURAHS.find(s => s.id === currentPlaying.surahId) : null;

  const isAnyModalOpen = Boolean(
    searchOpen ||
    tafsirModalTarget ||
    tadabburModalTarget ||
    isQuranModeModalOpen ||
    isLiveVoiceModalOpen ||
    isThemeSwitcherOpen ||
    isAndroidInstallModalOpen ||
    isNotificationModalOpen ||
    inAppToast
  );

  const handleCloseActiveModal = () => {
    if (searchOpen) {
      setSearchOpen(false);
      return;
    }
    if (isLiveVoiceModalOpen) {
      setIsLiveVoiceModalOpen(false);
      return;
    }
    if (tafsirModalTarget) {
      setTafsirModalTarget(null);
      return;
    }
    if (tadabburModalTarget) {
      setTadabburModalTarget(null);
      return;
    }
    if (isQuranModeModalOpen) {
      setIsQuranModeModalOpen(false);
      return;
    }
    if (isThemeSwitcherOpen) {
      setIsThemeSwitcherOpen(false);
      return;
    }
    if (isAndroidInstallModalOpen) {
      setIsAndroidInstallModalOpen(false);
      return;
    }
    if (isNotificationModalOpen) {
      setIsNotificationModalOpen(false);
      return;
    }
    if (inAppToast) {
      setInAppToast(null);
      return;
    }
  };

  const isListeningActive = isListeningMode || activeView === 'listening';

  return (
    <div className={`min-h-screen font-cairo transition-colors duration-300 ${siteMode === 'dark' ? 'dark bg-black text-stone-100 islamic-bg-pattern' : 'bg-[#f8f9fa] text-stone-900'}`}>
      
      {/* Dedicated Authentic Islamic Listening Mode Experience (Matching user screenshots) */}
      {isListeningActive && (
        <ListeningModeView
          initialSurahId={selectedSurahId || 1}
          selectedReciter={selectedReciter}
          onSelectReciter={setSelectedReciter}
          onClose={handleCloseListeningMode}
          onJumpToSurahReader={(surahId) => {
            handleOpenSurah(surahId, false);
            handleCloseListeningMode();
          }}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Navbar Header (Shown on main Surahs index; hides automatically when navigating into specific views for full-screen app-in-app immersion) */}
      {!isListeningActive && activeView === 'surahs' && (
        <Navbar
          activeView={activeView}
          setActiveView={(view) => {
            if (view === 'listening') {
              handleOpenListeningMode();
            } else {
              handleCloseListeningMode();
              setActiveView(view);
            }
          }}
          selectedReciter={selectedReciter}
          setSelectedReciter={setSelectedReciter}
          paperTheme={paperTheme}
          setPaperTheme={handleSetPaperTheme}
          fontSize={fontSize}
          setFontSize={handleSetFontSize}
          fontStyle={fontStyle}
          setFontStyle={handleSetFontStyle}
          bookmarkCount={bookmarks.length}
          onOpenSearch={() => setSearchOpen(true)}
          siteMode={siteMode}
          onToggleSiteMode={toggleSiteMode}
          eyeComfortMode={eyeComfortMode}
          onToggleEyeComfortMode={toggleEyeComfortMode}
          isAudioActiveInBackground={Boolean(currentPlaying && isAudioBarHidden)}
          onRestoreAudioPlayer={() => setIsAudioBarHidden(false)}
          navDisplayMode={navDisplayMode}
          onSetNavDisplayMode={handleSetNavDisplayMode}
          trackingColor={trackingColor}
          onSetTrackingColor={handleSetTrackingColor}
          quranTextColor={quranTextColor}
          onSetQuranTextColor={handleSetQuranTextColor}
          navTheme={navTheme}
          onSetNavTheme={handleSetNavTheme}
          isListeningMode={isListeningActive}
          onToggleListeningMode={toggleListeningMode}
          onOpenQuranModeModal={() => handleOpenListeningMode()}
          globalTheme={globalTheme}
          onOpenThemeSwitcher={() => setIsThemeSwitcherOpen(true)}
          onOpenAndroidInstall={() => setIsAndroidInstallModalOpen(true)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceModalOpen(true)}
        />
      )}

      {/* Main Container Body (Rendered when not in dedicated listening view) */}
      {!isListeningActive && (
        <main className={activeView === 'realistic_book' ? 'pb-0' : 'pb-44 sm:pb-36'}>
          {activeView === 'surahs' && (
            <SurahList
              onSelectSurah={handleOpenSurah}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenTadabburAI={(name, num, ayahNum, ayahText) => {
                if (name && num && ayahNum && ayahText) {
                  setTadabburModalTarget({ surahName: name, surahNumber: num, ayahNum, ayahText });
                } else {
                  setActiveView('ai_assistant');
                }
              }}
              onOpenQuranModeModal={() => handleOpenListeningMode()}
              onGoToPage={(p) => {
                setMushafPageNumber(p);
                setActiveView('mushaf_page');
              }}
              onGoTo3D={(p) => {
                setMushafPageNumber(p);
                setActiveView('realistic_book');
              }}
              onSelectView={(v) => {
                if (v === 'listening') {
                  handleOpenListeningMode();
                } else {
                  setActiveView(v);
                }
              }}
            currentPlayingSurahId={currentPlaying?.surahId ?? null}
            onPlayAyah={(surahId, ayahNum) => {
              setCurrentPlaying({ surahId, ayahNum, mode: 'verse' });
              setIsAudioBarHidden(false);
            }}
          />
        )}

        {activeView === 'reader' && (
          <SurahReader
            surahId={selectedSurahId}
            onSelectSurah={setSelectedSurahId}
            onBackToSurahs={() => setActiveView('surahs')}
            selectedReciter={selectedReciter}
            currentPlayingAyah={currentPlaying}
            onPlayAyah={(surahId, ayahNum, mode) => setCurrentPlaying({ surahId, ayahNum, mode: mode || 'verse' })}
            onOpenTafsirModal={(surahId, surahName, ayahNum, ayahText) => setTafsirModalTarget({ surahId, surahName, ayahNum, ayahText })}
            onOpenTadabburAI={(surahName, surahNumber, ayahNum, ayahText) => setTadabburModalTarget({ surahName, surahNumber, ayahNum, ayahText })}
            paperTheme={paperTheme}
            onSetPaperTheme={handleSetPaperTheme}
            fontSize={fontSize}
            onSetFontSize={handleSetFontSize}
            fontStyle={fontStyle}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onToggleBottomNav={toggleBottomNav}
            isBottomNavVisible={navDisplayMode === 'expanded'}
            navDisplayMode={navDisplayMode}
            onSetNavDisplayMode={handleSetNavDisplayMode}
            trackingColor={trackingColor}
            onSetTrackingColor={handleSetTrackingColor}
            quranTextColor={quranTextColor}
            isListeningMode={isListeningMode}
            onToggleListeningMode={toggleListeningMode}
          />
        )}

        {activeView === 'mushaf_page' && (
          <PageReader
            initialPage={mushafPageNumber}
            onPageChange={setMushafPageNumber}
            onSelectSurah={handleOpenSurah}
            onBackToSurahs={() => setActiveView('surahs')}
            paperTheme={paperTheme}
            onSetPaperTheme={handleSetPaperTheme}
            fontSize={fontSize}
            fontStyle={fontStyle}
            onPlayAyah={(surahId, ayahNum) => setCurrentPlaying({ surahId, ayahNum, mode: 'verse' })}
            currentPlayingAyah={currentPlaying}
            onOpenTafsirModal={(surahId, surahName, ayahNum, ayahText) => setTafsirModalTarget({ surahId, surahName, ayahNum, ayahText })}
            onOpenTadabburAI={(surahName, surahNumber, ayahNum, ayahText) => setTadabburModalTarget({ surahName, surahNumber, ayahNum, ayahText })}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onToggleBottomNav={toggleBottomNav}
            isBottomNavVisible={navDisplayMode === 'expanded'}
            navDisplayMode={navDisplayMode}
            onSetNavDisplayMode={handleSetNavDisplayMode}
            trackingColor={trackingColor}
            onSetTrackingColor={handleSetTrackingColor}
            quranTextColor={quranTextColor}
            isListeningMode={isListeningMode}
            onToggleListeningMode={toggleListeningMode}
            onOpenThemeStudio={() => setIsThemeSwitcherOpen(true)}
            onSwitchToRealisticBook={() => setActiveView('realistic_book')}
          />
        )}

        {activeView === 'realistic_book' && (
          <RealisticMushafBook
            initialPage={mushafPageNumber}
            onPageChange={setMushafPageNumber}
            onBackToSurahs={() => setActiveView('surahs')}
            selectedReciter={selectedReciter}
            currentPlayingAyah={currentPlaying}
            onPlayAyah={(surahId, ayahNum) => setCurrentPlaying({ surahId, ayahNum, mode: 'verse' })}
            onOpenTafsirModal={(surahId, surahName, ayahNum, ayahText) => setTafsirModalTarget({ surahId, surahName, ayahNum, ayahText })}
            onOpenTadabburAI={(surahName, surahNumber, ayahNum, ayahText) => setTadabburModalTarget({ surahName, surahNumber, ayahNum, ayahText })}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            paperTheme={paperTheme}
          />
        )}

        {activeView === 'khatma' && (
          <KhatmaTracker
            onGoToPage={(p) => {
              setMushafPageNumber(p);
              setActiveView('mushaf_page');
            }}
            onOpenStats={() => setActiveView('stats')}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onBackToSurahs={() => setActiveView('surahs')}
          />
        )}

        {activeView === 'stats' && (
          <ReadingStatsView
            onNavigateToSurahs={() => setActiveView('surahs')}
            onNavigateToPages={() => setActiveView('mushaf_page')}
            onNavigateToKhatma={() => setActiveView('khatma')}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
          />
        )}

        {activeView === 'bookmarks' && (
          <BookmarksNotes
            onSelectVerse={handleJumpToVerse}
            onRemoveBookmark={removeBookmarkKey}
            onBackToSurahs={() => setActiveView('surahs')}
          />
        )}

        {activeView === 'athkar' && (
          <AthkarView
            onBackToSurahs={() => setActiveView('surahs')}
          />
        )}

        {activeView === 'prayers' && (
          <PrayerTimesView
            onBackToSurahs={() => setActiveView('surahs')}
          />
        )}

        {activeView === 'ai_assistant' && (
          <AiAssistantView
            onSelectSurah={handleOpenSurah}
            onPlayAyah={(surahId, ayahNum) => setCurrentPlaying({ surahId, ayahNum, mode: 'verse' })}
            onOpenLiveVoice={() => setIsLiveVoiceModalOpen(true)}
          />
        )}
      </main>
      )}

      {/* Bottom Sticky Audio Player */}
      {currentPlaying && !isListeningActive && (
        <AudioPlayer
          currentPlaying={currentPlaying}
          onNextAyah={handleNextAyah}
          onPrevAyah={handlePrevAyah}
          onClose={() => {
            setCurrentPlaying(null);
            setIsAudioBarHidden(false);
          }}
          selectedReciter={selectedReciter}
          setSelectedReciter={setSelectedReciter}
          onTogglePlayMode={handleTogglePlayMode}
          isAudioBarHidden={isAudioBarHidden}
          onToggleAudioBarHidden={setIsAudioBarHidden}
          onAudioTimeProgress={(surahId, ayahNum) => {
            setCurrentPlaying(prev => (prev ? { ...prev, surahId, ayahNum } : { surahId, ayahNum, mode: 'surah' }));
          }}
        />
      )}

      {/* Persistent / Toggleable Bottom Navigation Bar (Hidden in Listening Mode) */}
      {!isListeningActive && (
        <BottomNav
          activeView={activeView}
          setActiveView={(view) => {
            if (view === 'listening') {
              handleOpenListeningMode();
            } else {
              handleCloseListeningMode();
              setActiveView(view);
            }
          }}
          navDisplayMode={navDisplayMode}
          setNavDisplayMode={handleSetNavDisplayMode}
          navTheme={navTheme}
          isVisible={navDisplayMode === 'expanded'}
          onToggleVisibility={toggleBottomNav}
          bookmarkCount={bookmarks.length}
          hasAudioPlaying={Boolean(currentPlaying && !isAudioBarHidden)}
          isListeningMode={isListeningActive}
          onToggleListeningMode={toggleListeningMode}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenThemeSwitcher={() => setIsThemeSwitcherOpen(true)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceModalOpen(true)}
          onOpenAndroidInstall={() => setIsAndroidInstallModalOpen(true)}
          onOpenQuranModeModal={() => handleOpenListeningMode()}
          siteMode={siteMode}
          onToggleSiteMode={toggleSiteMode}
          eyeComfortMode={eyeComfortMode}
          onToggleEyeComfortMode={toggleEyeComfortMode}
          selectedReciter={selectedReciter}
          onSelectReciter={setSelectedReciter}
          paperTheme={paperTheme}
          onSetPaperTheme={handleSetPaperTheme}
          fontSize={fontSize}
          onSetFontSize={handleSetFontSize}
          isAudioActiveInBackground={Boolean(currentPlaying && isAudioBarHidden)}
          onRestoreAudioPlayer={() => setIsAudioBarHidden(false)}
          onBackToSurahs={() => setActiveView('surahs')}
        />
      )}

      {/* Search Modal */}
      {searchOpen && (
        <SearchView
          onClose={() => setSearchOpen(false)}
          onSelectVerse={handleJumpToVerse}
        />
      )}

      {/* Tafsir Modal */}
      {tafsirModalTarget && (
        <TafsirModal
          surahId={tafsirModalTarget.surahId}
          surahName={tafsirModalTarget.surahName}
          ayahNum={tafsirModalTarget.ayahNum}
          ayahText={tafsirModalTarget.ayahText}
          onClose={() => setTafsirModalTarget(null)}
          onOpenTadabburAI={(surahName, surahNumber, ayahNum, ayahText) => setTadabburModalTarget({ surahName, surahNumber, ayahNum, ayahText })}
        />
      )}

      {/* AI Tadabbur Modal */}
      {tadabburModalTarget && (
        <TadabburAiModal
          surahName={tadabburModalTarget.surahName}
          surahNumber={tadabburModalTarget.surahNumber}
          ayahNum={tadabburModalTarget.ayahNum}
          ayahText={tadabburModalTarget.ayahText}
          onClose={() => setTadabburModalTarget(null)}
        />
      )}

      {/* Dedicated Quran Audio Player Modal (تشغيل وضع القرآن) */}
      <QuranMobileAppModal
        isOpen={isQuranModeModalOpen}
        onClose={() => setIsQuranModeModalOpen(false)}
        initialSurahId={selectedSurahId || 1}
        selectedReciter={selectedReciter}
        onSelectReciter={setSelectedReciter}
        bookmarks={bookmarks}
        onToggleBookmark={(key) => {
          setBookmarks(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
          );
        }}
        onOpenSurahInReader={(surahId) => handleOpenSurah(surahId, true)}
      />

      {/* Global Theme & Mode Switcher Modal */}
      <ThemeSwitcherModal
        isOpen={isThemeSwitcherOpen}
        onClose={() => setIsThemeSwitcherOpen(false)}
        currentTheme={globalTheme}
        onSelectTheme={handleSetGlobalTheme}
        siteMode={siteMode}
        onSetSiteMode={handleSetSiteMode}
        navTheme={navTheme}
        onSetNavTheme={handleSetNavTheme}
        paperTheme={paperTheme}
        onSetPaperTheme={handleSetPaperTheme}
        quranTextColor={quranTextColor}
        onSetQuranTextColor={handleSetQuranTextColor}
        trackingColor={trackingColor}
        onSetTrackingColor={handleSetTrackingColor}
        fontSize={fontSize}
        onSetFontSize={handleSetFontSize}
        fontStyle={fontStyle}
        onSetFontStyle={handleSetFontStyle}
      />

      {/* Android App & APK Installation Modal */}
      <AndroidInstallModal
        isOpen={isAndroidInstallModalOpen}
        onClose={() => setIsAndroidInstallModalOpen(false)}
        installPrompt={deferredInstallPrompt}
        onTriggerInstall={handleTriggerInstall}
        isInstalled={isAndroidInstalled}
      />

      {/* Daily Quran Push Notifications & Reminder Modal */}
      <DailyNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onNavigateToQuran={() => {
          setActiveView('mushaf_page');
          setIsNotificationModalOpen(false);
        }}
      />

      {/* Gemini 3.8 Live API Voice Conversation Studio Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceModalOpen}
        onClose={() => setIsLiveVoiceModalOpen(false)}
        onSelectSurah={handleOpenSurah}
      />

      {/* In-App Daily Reminder Toast Notification */}
      {inAppToast && (
        <InAppNotificationToast
          title={inAppToast.title}
          body={inAppToast.body}
          onOpenQuran={() => {
            setActiveView('mushaf_page');
            setInAppToast(null);
          }}
          onSnooze={() => {
            setInAppToast(null);
          }}
          onDismiss={() => {
            setInAppToast(null);
          }}
        />
      )}

      </div>
  );
}
