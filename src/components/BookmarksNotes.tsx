import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Edit3, Save, Sparkles, BookOpen, Share2 } from 'lucide-react';
import { Bookmark as BookmarkType } from '../types';
import { toArabicNumeral } from '../services/quranApi';

interface BookmarksNotesProps {
  onSelectVerse: (surahId: number, ayahNum: number) => void;
  onRemoveBookmark: (id: string) => void;
  onBackToSurahs?: () => void;
}

const NOTES_STORAGE_KEY = 'quran_user_notes_v1';

export const BookmarksNotes: React.FC<BookmarksNotesProps> = ({ onSelectVerse, onRemoveBookmark, onBackToSurahs }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Load saved bookmarks and notes
  useEffect(() => {
    try {
      const savedB = localStorage.getItem('quran_bookmarks_v1');
      if (savedB) {
        const parsed = JSON.parse(savedB);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed);
        }
      }

      const savedN = localStorage.getItem(NOTES_STORAGE_KEY);
      if (savedN) {
        setNotesMap(JSON.parse(savedN));
      }
    } catch (e) {
      console.warn('Failed loading bookmarks/notes', e);
    }
  }, []);

  const handleSaveNote = (key: string) => {
    const updated = { ...notesMap, [key]: noteText };
    setNotesMap(updated);
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving note', e);
    }
    setEditingKey(null);
    setNoteText('');
  };

  const handleRemove = (key: string) => {
    onRemoveBookmark(key);
    setBookmarks(prev => prev.filter(b => b.id !== key));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 p-6 sm:p-8 rounded-3xl text-stone-100 shadow-xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>المحفوظات والتدبر الشخصي</span>
          </div>
          <h2 className="text-3xl font-extrabold font-quran text-amber-100">
            الآيات المحفوظة والتأملات
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm font-cairo">
            سجل خواطرك وتأملاتك الإيمانية مع الآيات التي تود العودة إليها مجدداً.
          </p>
        </div>

        {onBackToSurahs && (
          <button
            onClick={onBackToSurahs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900/80 hover:bg-amber-600 text-amber-200 hover:text-stone-950 border border-amber-500/30 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
          >
            <span>← فهرس السور</span>
          </button>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="space-y-4">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
            <Bookmark className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">لا توجد آيات محفوظة بعد</h3>
            <p className="text-stone-500 text-sm">
              أثناء قراءة السور، يمكنك النقر على أيقونة الإشارة المرجعية لثبيت الآية وكتابة خواطرك حولها.
            </p>
          </div>
        ) : (
          bookmarks.map((bm) => {
            const currentNote = notesMap[bm.id] || '';
            const isEditing = editingKey === bm.id;

            return (
              <div
                key={bm.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm hover:border-amber-500/50 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-quran text-lg">
                      سُورَةُ {bm.surahName} (الآية {toArabicNumeral(bm.ayahNumber)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectVerse(bm.surahId, bm.ayahNumber)}
                      className="px-3 py-1 bg-amber-500 text-stone-950 font-bold rounded-lg hover:bg-amber-400"
                    >
                      انتقل للآية
                    </button>
                    <button
                      onClick={() => handleRemove(bm.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500"
                      title="حذف الحفظ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Verse Text */}
                <p className="font-quran text-xl text-stone-900 dark:text-amber-100 leading-relaxed bg-amber-50/50 dark:bg-stone-950/40 p-4 rounded-xl border border-amber-200/40 dark:border-amber-500/10">
                  {bm.ayahText} <span className="text-amber-600">﴿{toArabicNumeral(bm.ayahNumber)}﴾</span>
                </p>

                {/* Personal Note Section */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                    <span>التدون والتأمل الشخصي:</span>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingKey(bm.id);
                          setNoteText(currentNote);
                        }}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{currentNote ? 'تعديل التدوينة' : 'إضافة تأمل'}</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="اكتب تأاملك أو الخاطرة الإيمانية حول هذه الآية..."
                        className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                      ></textarea>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleSaveNote(bm.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>حفظ التدوينة</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    currentNote && (
                      <p className="text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl italic">
                        "{currentNote}"
                      </p>
                    )
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
