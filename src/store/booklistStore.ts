import { createSignal, createMemo } from 'solid-js';
import type { Booklist, BooklistFilter, BooklistTab, BooklistProgress, BooklistChallenge, BooklistLeaderboardEntry } from '../types/booklist';
import type { Book, DifficultyLevel } from '../types/game';
import {
  generateBooklist,
  getBooksForBooklist,
  regenerateBooklistBooks,
  filterBooks,
  getAllGenres,
  getAllAuthors,
  getAllThemes,
  generateChallengesForBooklist,
  getBookByIndex,
  getNextBook,
} from '../data/booklist';
import {
  getCustomBooklists,
  saveCustomBooklist,
  deleteCustomBooklist,
  getAllBooklists,
  getBooklistProgress,
  updateBooklistProgress,
  getBooklistLeaderboard,
  saveBooklistLeaderboardEntry,
  getBooklistChallenges,
  saveBooklistChallenges,
  updateBooklistChallenge,
  setCurrentBooklistId,
  getCustomBooklistCount,
} from '../utils/booklistStorage';
import { DEFAULT_FILTER } from '../types/booklist';

const [booklistCenterVisible, setBooklistCenterVisible] = createSignal(false);
const [activeTab, setActiveTab] = createSignal<BooklistTab>('browse');
const [selectedBooklistId, setSelectedBooklistId] = createSignal<string | null>(null);
const [currentFilter, setCurrentFilter] = createSignal<BooklistFilter>({ ...DEFAULT_FILTER });
const [editorName, setEditorName] = createSignal('');
const [editorDescription, setEditorDescription] = createSignal('');
const [editorIcon, setEditorIcon] = createSignal('📚');
const [editorColor, setEditorColor] = createSignal('#B8860B');
const [editorDifficulty, setEditorDifficulty] = createSignal<DifficultyLevel>('normal');
const [previewBooklist, setPreviewBooklist] = createSignal<Booklist | null>(null);
const [booklistVersion, setBooklistVersion] = createSignal(0);

export const openBooklistCenter = (tab?: BooklistTab) => {
  if (tab) setActiveTab(tab);
  setBooklistCenterVisible(true);
  setBooklistVersion(v => v + 1);
};

export const closeBooklistCenter = () => {
  setBooklistCenterVisible(false);
  setSelectedBooklistId(null);
  setCurrentFilter({ ...DEFAULT_FILTER });
  setPreviewBooklist(null);
  setEditorName('');
  setEditorDescription('');
};

export const getBooklistCenterState = createMemo(() => ({
  isVisible: booklistCenterVisible(),
  activeTab: activeTab(),
  selectedBooklistId: selectedBooklistId(),
  currentFilter: currentFilter(),
  editorName: editorName(),
  editorDescription: editorDescription(),
  editorIcon: editorIcon(),
  editorColor: editorColor(),
  editorDifficulty: editorDifficulty(),
  previewBooklist: previewBooklist(),
}));

export const setBooklistTab = (tab: BooklistTab) => {
  setActiveTab(tab);
  setBooklistVersion(v => v + 1);
};

export const selectBooklist = (booklistId: string | null) => {
  setSelectedBooklistId(booklistId);
};

export const updateFilter = (updates: Partial<BooklistFilter>) => {
  setCurrentFilter(prev => ({ ...prev, ...updates }));
};

export const resetFilter = () => {
  setCurrentFilter({ ...DEFAULT_FILTER });
};

export const setEditorNameValue = (name: string) => {
  setEditorName(name);
};

export const setEditorDescriptionValue = (desc: string) => {
  setEditorDescription(desc);
};

export const setEditorIconValue = (icon: string) => {
  setEditorIcon(icon);
};

export const setEditorColorValue = (color: string) => {
  setEditorColor(color);
};

export const setEditorDifficultyValue = (diff: DifficultyLevel) => {
  setEditorDifficulty(diff);
};

export const generatePreview = () => {
  const name = editorName() || '自定义书单';
  const desc = editorDescription() || '根据你的筛选条件生成的专属书单';
  const booklist = generateBooklist(name, desc, currentFilter(), {
    icon: editorIcon(),
    color: editorColor(),
    difficulty: editorDifficulty(),
  });
  setPreviewBooklist(booklist);
};

export const saveCurrentBooklist = (): Booklist | null => {
  const preview = previewBooklist();
  if (!preview) return null;
  
  const finalBooklist: Booklist = {
    ...preview,
    name: editorName() || preview.name,
    description: editorDescription() || preview.description,
    icon: editorIcon(),
    color: editorColor(),
    difficulty: editorDifficulty(),
  };
  
  saveCustomBooklist(finalBooklist);
  
  const challenges = generateChallengesForBooklist(finalBooklist.id);
  saveBooklistChallenges(finalBooklist.id, challenges);
  
  setBooklistVersion(v => v + 1);
  return finalBooklist;
};

export const removeCustomBooklist = (booklistId: string) => {
  deleteCustomBooklist(booklistId);
  setBooklistVersion(v => v + 1);
  if (selectedBooklistId() === booklistId) {
    setSelectedBooklistId(null);
  }
};

export const regenerateSelectedBooklist = (): Booklist | null => {
  const selectedId = selectedBooklistId();
  if (!selectedId) return null;
  
  const allLists = getAllBooklists();
  const booklist = allLists.find(b => b.id === selectedId);
  if (!booklist || !booklist.isCustom) return null;
  
  const regenerated = regenerateBooklistBooks(booklist);
  saveCustomBooklist(regenerated);
  setBooklistVersion(v => v + 1);
  setPreviewBooklist(regenerated);
  return regenerated;
};

export const getAllAvailableBooklists = createMemo((): Booklist[] => {
  booklistVersion();
  return getAllBooklists();
});

export const getCustomBooklistsList = createMemo((): Booklist[] => {
  booklistVersion();
  return getCustomBooklists();
});

export const getSelectedBooklist = createMemo((): Booklist | null => {
  const id = selectedBooklistId();
  if (!id) return null;
  const allLists = getAllAvailableBooklists();
  return allLists.find(b => b.id === id) || null;
});

export const getSelectedBooklistBooks = createMemo((): Book[] => {
  const booklist = getSelectedBooklist();
  if (!booklist) return [];
  return getBooksForBooklist(booklist);
});

export const getFilteredBooks = createMemo((): Book[] => {
  return filterBooks(currentFilter());
});

export const getGenresList = createMemo((): string[] => {
  return getAllGenres();
});

export const getAuthorsList = createMemo((): string[] => {
  return getAllAuthors();
});

export const getThemesList = createMemo((): string[] => {
  return getAllThemes();
});

export const getSelectedProgress = createMemo((): BooklistProgress | null => {
  const id = selectedBooklistId();
  if (!id) return null;
  return getBooklistProgress(id);
});

export const getSelectedChallenges = createMemo((): BooklistChallenge[] => {
  const id = selectedBooklistId();
  if (!id) return [];
  
  const saved = getBooklistChallenges(id);
  if (saved.length > 0) return saved;
  
  const generated = generateChallengesForBooklist(id);
  saveBooklistChallenges(id, generated);
  return generated;
});

export const getSelectedLeaderboard = createMemo((): BooklistLeaderboardEntry[] => {
  const id = selectedBooklistId();
  if (!id) return [];
  return getBooklistLeaderboard(id);
});

export const startBooklistChallenge = (booklistId: string) => {
  setCurrentBooklistId(booklistId);
  updateBooklistProgress(booklistId, {
    currentBookIndex: 0,
    foundBookIds: [],
    totalScore: 0,
    totalTimeUsed: 0,
    totalHintsUsed: 0,
  });
};

export const getBooklistStartInfo = createMemo(() => {
  const booklist = getSelectedBooklist();
  const progress = getSelectedProgress();
  return {
    booklist,
    progress,
    totalBooks: booklist?.bookIds.length || 0,
    targetBooks: booklist?.targetBooks || 0,
    bestScore: progress?.bestScore || 0,
    completions: progress?.completions || 0,
  };
});

export const getCustomCount = createMemo(() => {
  booklistVersion();
  return getCustomBooklistCount();
});

export const addAuthorFilter = (author: string) => {
  if (!author.trim()) return;
  setCurrentFilter(prev => {
    if (prev.authors.includes(author)) return prev;
    return { ...prev, authors: [...prev.authors, author] };
  });
};

export const removeAuthorFilter = (author: string) => {
  setCurrentFilter(prev => ({
    ...prev,
    authors: prev.authors.filter(a => a !== author),
  }));
};

export const addGenreFilter = (genre: string) => {
  setCurrentFilter(prev => {
    if (prev.genres.includes(genre)) return prev;
    return { ...prev, genres: [...prev.genres, genre] };
  });
};

export const removeGenreFilter = (genre: string) => {
  setCurrentFilter(prev => ({
    ...prev,
    genres: prev.genres.filter(g => g !== genre),
  }));
};

export const addKeywordFilter = (keyword: string) => {
  if (!keyword.trim()) return;
  setCurrentFilter(prev => {
    if (prev.keywords.includes(keyword)) return prev;
    return { ...prev, keywords: [...prev.keywords, keyword] };
  });
};

export const removeKeywordFilter = (keyword: string) => {
  setCurrentFilter(prev => ({
    ...prev,
    keywords: prev.keywords.filter(k => k !== keyword),
  }));
};

export const addRarityFilter = (rarity: string) => {
  setCurrentFilter(prev => {
    if (prev.rarities.includes(rarity as any)) return prev;
    return { ...prev, rarities: [...prev.rarities, rarity as any] };
  });
};

export const removeRarityFilter = (rarity: string) => {
  setCurrentFilter(prev => ({
    ...prev,
    rarities: prev.rarities.filter(r => r !== rarity),
  }));
};

export const addThemeFilter = (theme: string) => {
  setCurrentFilter(prev => {
    if (prev.themes.includes(theme)) return prev;
    return { ...prev, themes: [...prev.themes, theme] };
  });
};

export const removeThemeFilter = (theme: string) => {
  setCurrentFilter(prev => ({
    ...prev,
    themes: prev.themes.filter(t => t !== theme),
  }));
};

export const getCurrentTargetBook = (booklistId: string, currentIndex: number): Book | null => {
  const allLists = getAllBooklists();
  const booklist = allLists.find(b => b.id === booklistId);
  if (!booklist) return null;
  return getBookByIndex(booklist, currentIndex);
};

export const advanceToNextBook = (booklistId: string, currentIndex: number): Book | null => {
  const allLists = getAllBooklists();
  const booklist = allLists.find(b => b.id === booklistId);
  if (!booklist) return null;
  return getNextBook(booklist, currentIndex);
};

export const submitBooklistScore = (
  booklistId: string,
  playerName: string,
  score: number,
  timeUsed: number,
  hintsUsed: number,
  booksFound: number
) => {
  const entry: BooklistLeaderboardEntry = {
    id: Date.now().toString(),
    playerName,
    booklistId,
    score,
    timeUsed,
    hintsUsed,
    booksFound,
    date: Date.now(),
  };
  saveBooklistLeaderboardEntry(booklistId, entry);
  setBooklistVersion(v => v + 1);
};

export const completeBooklistChallenge = (booklistId: string, challengeId: string) => {
  const now = Date.now();
  updateBooklistChallenge(booklistId, challengeId, {
    completed: true,
    completedAt: now,
  });
  setBooklistVersion(v => v + 1);
};
