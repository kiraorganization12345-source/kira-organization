import React, { useState, useEffect } from 'react';
import { ViewMode, PaperTheme, FontStyle, Reciter } from './types';
import { RECITERS } from './data/reciters';
import { ALL_SURAHS } from './data/surahs';
import { Navbar } from './components/Navbar';
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

  // Appearance & Audio Settings
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('sepia');
  const [fontSize, setFontSize] = useState<number>(28);
  const [fontStyle, setFontStyle] = useState<FontStyle>('Amiri Quran');
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);

  // Audio Playback State
  const [currentPlaying, setCurrentPlaying] = useState<{ surahId: number; ayahNum: number; mode?: 'verse' | 'surah' } | null>(null);

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

  // Load persistent bookmarks & favorites on mount
  useEffect(() => {
    try {
      const savedB = localStorage.getItem('quran_bookmarks_keys_v1');
      if (savedB) setBookmarks(JSON.parse(savedB));

      const savedF = localStorage.getItem('quran_favorites_v1');
      if (savedF) setFavorites(JSON.parse(savedF));
    } catch (e) {
      console.warn('LocalStorage error on init:', e);
    }
  }, []);

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
        setCurrentPlaying({ surahId: currentPlaying.surahId + 1, ayahNum: 1, mode: 'surah' });
      }
      return;
    }

    if (currentPlaying.ayahNum < currentSurah.versesCount) {
      setCurrentPlaying({ surahId: currentPlaying.surahId, ayahNum: currentPlaying.ayahNum + 1, mode: 'verse' });
    } else if (currentPlaying.surahId < 114) {
      // Move to next Surah first verse
      setCurrentPlaying({ surahId: currentPlaying.surahId + 1, ayahNum: 1, mode: 'verse' });
    }
  };

  const handlePrevAyah = () => {
    if (!currentPlaying) return;

    if (currentPlaying.mode === 'surah') {
      if (currentPlaying.surahId > 1) {
        setCurrentPlaying({ surahId: currentPlaying.surahId - 1, ayahNum: 1, mode: 'surah' });
      }
      return;
    }

    if (currentPlaying.ayahNum > 1) {
      setCurrentPlaying({ surahId: currentPlaying.surahId, ayahNum: currentPlaying.ayahNum - 1, mode: 'verse' });
    } else if (currentPlaying.surahId > 1) {
      const prevSurah = ALL_SURAHS.find(s => s.id === currentPlaying.surahId - 1);
      if (prevSurah) {
        setCurrentPlaying({ surahId: prevSurah.id, ayahNum: prevSurah.versesCount, mode: 'verse' });
      }
    }
  };

  const handleTogglePlayMode = (newMode: 'verse' | 'surah') => {
    if (!currentPlaying) return;
    setCurrentPlaying({ ...currentPlaying, mode: newMode });
  };

  // Open Surah Reader
  const handleOpenSurah = (surahId: number) => {
    setSelectedSurahId(surahId);
    setActiveView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open specific verse from Search or Bookmarks
  const handleJumpToVerse = (surahId: number, ayahNum: number) => {
    setSelectedSurahId(surahId);
    setActiveView('reader');
    setCurrentPlaying({ surahId, ayahNum });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen font-cairo ${paperTheme === 'dark' ? 'dark bg-stone-950 text-stone-100' : 'bg-amber-50/20 text-stone-900'}`}>
      
      {/* Navbar Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        selectedReciter={selectedReciter}
        setSelectedReciter={setSelectedReciter}
        paperTheme={paperTheme}
        setPaperTheme={setPaperTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontStyle={fontStyle}
        setFontStyle={setFontStyle}
        bookmarkCount={bookmarks.length}
        onOpenSearch={() => setSearchOpen(true)}
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
            fontSize={fontSize}
            fontStyle={fontStyle}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {activeView === 'mushaf_page' && (
          <PageReader
            initialPage={mushafPageNumber}
            onPageChange={setMushafPageNumber}
            onSelectSurah={handleOpenSurah}
            paperTheme={paperTheme}
            fontSize={fontSize}
            fontStyle={fontStyle}
            onPlayAyah={(surahId, ayahNum) => setCurrentPlaying({ surahId, ayahNum })}
            currentPlayingAyah={currentPlaying}
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
          onClose={() => setCurrentPlaying(null)}
          selectedReciter={selectedReciter}
          setSelectedReciter={setSelectedReciter}
          onTogglePlayMode={handleTogglePlayMode}
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

    </div>
  );
}
