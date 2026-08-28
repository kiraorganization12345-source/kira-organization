import React, { useState, useEffect } from 'react';
import { ViewMode, PaperTheme, FontStyle, Reciter, NavDisplayMode, TrackingHighlightColor } from './types';
import { RECITERS } from './data/reciters';
import { ALL_SURAHS } from './data/surahs';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SurahList } from './components/SurahList';
import { SurahReader } from './components/SurahReader';
import { PageReader } from './components/PageReader';
import { AudioPlayer } from './components/AudioPlayer';
import { TafsirModal } from './components/TafsirModal';
import { SearchView } from './components/SearchView';
import { KhatmaTracker } from './components/KhatmaTracker';
import { BookmarksNotes } from './components/BookmarksNotes';
import { AthkarView } from './components/AthkarView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { TadabburAiModal } from './components/TadabburAiModal';
import { AiAssistantView } from './components/AiAssistantView';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('surahs');
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [mushafPageNumber, setMushafPageNumber] = useState<number>(1);

  // Navigation Display Mode: 'expanded' (full bar), 'floating' (suspended floating icon), 'hidden' (completely hidden)
  const [navDisplayMode, setNavDisplayMode] = useState<NavDisplayMode>('expanded');

  // Appearance & Theme Settings (Site Mode: Dark Pure Black by default as requested; PaperTheme)
  const [siteMode, setSiteMode] = useState<'dark' | 'light'>('dark');
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('dark');
  const [trackingColor, setTrackingColor] = useState<TrackingHighlightColor>('amber');
  const [fontSize, setFontSize] = useState<number>(28);
  const [fontStyle, setFontStyle] = useState<FontStyle>('Amiri Quran');
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);
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

  // Load persistent bookmarks & favorites & comfort mode on mount
  useEffect(() => {
    try {
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

  // Synchronize site mode with html class
  useEffect(() => {
    if (siteMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [siteMode]);

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

  // Playback Navigation Handlers
  const handleNextAyah = () => {
    if (!currentPlaying) return;
    const currentSurah = ALL_SURAHS.find(s => s.id === currentPlaying.surahId);
    if (!currentSurah) return;

    if (currentPlaying.mode === 'surah') {
      if (currentPlaying.surahId < 114) {
        const nextId = currentPlaying.surahId + 1;
        setSelectedSurahId(nextId);
        setCurrentPlaying({ surahId: nextId, ayahNum: 1, mode: 'surah' });
      }
      return;
    }

    if (currentPlaying.ayahNum < currentSurah.versesCount) {
      setCurrentPlaying({ surahId: currentPlaying.surahId, ayahNum: currentPlaying.ayahNum + 1, mode: 'verse' });
    } else if (currentPlaying.surahId < 114) {
      // Move to next Surah first verse seamlessly
      const nextId = currentPlaying.surahId + 1;
      setSelectedSurahId(nextId);
      setCurrentPlaying({ surahId: nextId, ayahNum: 1, mode: 'verse' });
    }
  };

  const handlePrevAyah = () => {
    if (!currentPlaying) return;

    if (currentPlaying.mode === 'surah') {
      if (currentPlaying.surahId > 1) {
        const prevId = currentPlaying.surahId - 1;
        setSelectedSurahId(prevId);
        setCurrentPlaying({ surahId: prevId, ayahNum: 1, mode: 'surah' });
      }
      return;
    }

    if (currentPlaying.ayahNum > 1) {
      setCurrentPlaying({ surahId: currentPlaying.surahId, ayahNum: currentPlaying.ayahNum - 1, mode: 'verse' });
    } else if (currentPlaying.surahId > 1) {
      const prevSurah = ALL_SURAHS.find(s => s.id === currentPlaying.surahId - 1);
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
    setCurrentPlaying({ surahId, ayahNum });
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

  return (
    <div className={`min-h-screen font-cairo transition-colors duration-300 ${siteMode === 'dark' ? 'dark bg-black text-stone-100 islamic-bg-pattern' : 'bg-[#f8f9fa] text-stone-900'}`}>
      
      {/* Navbar Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
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
      />

      {/* Main Container Body */}
      <main className="pb-44 sm:pb-36">
        {activeView === 'surahs' && (
          <SurahList
            onSelectSurah={handleOpenSurah}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenTadabburAI={() => setActiveView('ai_assistant')}
          />
        )}

        {activeView === 'reader' && (
          <SurahReader
            surahId={selectedSurahId}
            onSelectSurah={setSelectedSurahId}
            selectedReciter={selectedReciter}
            currentPlayingAyah={currentPlaying}
            onPlayAyah={(surahId, ayahNum, mode) => setCurrentPlaying({ surahId, ayahNum, mode: mode || 'verse' })}
            onOpenTafsirModal={(surahId, surahName, ayahNum, ayahText) => setTafsirModalTarget({ surahId, surahName, ayahNum, ayahText })}
            onOpenTadabburAI={(surahName, surahNumber, ayahNum, ayahText) => setTadabburModalTarget({ surahName, surahNumber, ayahNum, ayahText })}
            paperTheme={paperTheme}
            onSetPaperTheme={handleSetPaperTheme}
            fontSize={fontSize}
            fontStyle={fontStyle}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onToggleBottomNav={toggleBottomNav}
            isBottomNavVisible={navDisplayMode === 'expanded'}
            navDisplayMode={navDisplayMode}
            onSetNavDisplayMode={handleSetNavDisplayMode}
            trackingColor={trackingColor}
            onSetTrackingColor={handleSetTrackingColor}
          />
        )}

        {activeView === 'mushaf_page' && (
          <PageReader
            initialPage={mushafPageNumber}
            onPageChange={setMushafPageNumber}
            onSelectSurah={handleOpenSurah}
            paperTheme={paperTheme}
            onSetPaperTheme={handleSetPaperTheme}
            fontSize={fontSize}
            fontStyle={fontStyle}
            onPlayAyah={(surahId, ayahNum) => setCurrentPlaying({ surahId, ayahNum })}
            currentPlayingAyah={currentPlaying}
            onToggleBottomNav={toggleBottomNav}
            isBottomNavVisible={navDisplayMode === 'expanded'}
            navDisplayMode={navDisplayMode}
            onSetNavDisplayMode={handleSetNavDisplayMode}
            trackingColor={trackingColor}
            onSetTrackingColor={handleSetTrackingColor}
          />
        )}

        {activeView === 'khatma' && (
          <KhatmaTracker
            onGoToPage={(p) => {
              setMushafPageNumber(p);
              setActiveView('mushaf_page');
            }}
          />
        )}

        {activeView === 'bookmarks' && (
          <BookmarksNotes
            onSelectVerse={handleJumpToVerse}
            onRemoveBookmark={removeBookmarkKey}
          />
        )}

        {activeView === 'athkar' && (
          <AthkarView />
        )}

        {activeView === 'prayers' && (
          <PrayerTimesView />
        )}

        {activeView === 'ai_assistant' && (
          <AiAssistantView
            onSelectSurah={handleOpenSurah}
            onPlayAyah={(surahId, ayahNum) => setCurrentPlaying({ surahId, ayahNum, mode: 'verse' })}
          />
        )}
      </main>

      {/* Bottom Sticky Audio Player */}
      {currentPlaying && (
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
        />
      )}

      {/* Persistent / Toggleable Bottom Navigation Bar */}
      <BottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        navDisplayMode={navDisplayMode}
        setNavDisplayMode={handleSetNavDisplayMode}
        isVisible={navDisplayMode === 'expanded'}
        onToggleVisibility={toggleBottomNav}
        bookmarkCount={bookmarks.length}
        hasAudioPlaying={Boolean(currentPlaying && !isAudioBarHidden)}
      />

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

    </div>
  );
}
