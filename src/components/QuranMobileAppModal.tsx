import React from 'react';
import { ListeningModeView } from './ListeningModeView';
import { Reciter } from '../types';

interface QuranMobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahId?: number;
  selectedReciter: Reciter;
  onSelectReciter?: (reciter: Reciter) => void;
  bookmarks: string[];
  onToggleBookmark: (bookmarkKey: string) => void;
  onOpenSurahInReader?: (surahId: number) => void;
}

export const QuranMobileAppModal: React.FC<QuranMobileAppModalProps> = ({
  isOpen,
  onClose,
  initialSurahId = 1,
  selectedReciter,
  onSelectReciter,
  bookmarks,
  onToggleBookmark,
  onOpenSurahInReader
}) => {
  if (!isOpen) return null;

  return (
    <ListeningModeView
      initialSurahId={initialSurahId}
      selectedReciter={selectedReciter}
      onSelectReciter={onSelectReciter || (() => {})}
      onClose={onClose}
      onJumpToSurahReader={onOpenSurahInReader}
      favorites={[]}
      onToggleFavorite={() => {}}
    />
  );
};
