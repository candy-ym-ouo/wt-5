import { createSignal, createMemo } from 'solid-js';
import type { CodexState, CodexTab, DiscoveryRecord } from '../types/codex';
import { BOOKS } from '../data/books';
import { AUTHORS, THEME_COLLECTIONS, EASTER_EGGS, getAuthorByBookId } from '../data/codex';
import {
  getCodexProgress,
  getDiscoveryRecords,
  saveDiscoveryRecord,
  saveBookCodexEntry,
  saveAuthorCodexEntry,
  getCodexStats,
  recordCodexVisit,
  checkAllEasterEggs,
  checkThemeCollectionCompletion,
  createDiscoveryRecord,
  toggleBookFavorite,
  toggleAuthorFavorite,
  isBookFavorite,
  isAuthorFavorite,
  getBookCodexEntries,
  getAuthorCodexEntries,
} from '../utils/codexStorage';
import {
  getCodexProgress as getCodexProgressStorage,
} from '../utils/codexStorage';
import { updateCollectionEntry, getAllCollectionEntries } from '../utils/storage';

const initialState: CodexState = {
  activeTab: 'books',
  selectedBookId: null,
  selectedAuthorId: null,
  selectedThemeId: null,
  selectedDiscoveryId: null,
  selectedEasterEggId: null,
  showDetail: false,
  filter: {},
  sortBy: 'date',
};

export const [codexState, setCodexState] = createSignal<CodexState>(initialState);
export const [showCodex, setShowCodex] = createSignal(false);
export const [showEasterEggPopup, setShowEasterEggPopup] = createSignal<string | null>(null);
export const [discoveryRecords, setDiscoveryRecords] = createSignal<DiscoveryRecord[]>(getDiscoveryRecords());
export const [newEasterEggs, setNewEasterEggs] = createSignal<string[]>([]);

export const openCodex = (tab?: CodexTab, bookId?: string, authorId?: string): void => {
  recordCodexVisit();
  const newState: CodexState = {
    ...initialState,
    activeTab: tab || 'books',
    selectedBookId: bookId || null,
    selectedAuthorId: authorId || null,
    showDetail: !!(bookId || authorId),
  };
  setCodexState(newState);
  setShowCodex(true);
};

export const closeCodex = (): void => {
  setShowCodex(false);
};

export const setActiveTab = (tab: CodexTab): void => {
  setCodexState(prev => ({
    ...prev,
    activeTab: tab,
    showDetail: false,
    selectedBookId: null,
    selectedAuthorId: null,
    selectedThemeId: null,
    selectedDiscoveryId: null,
    selectedEasterEggId: null,
  }));
};

export const selectBook = (bookId: string): void => {
  setCodexState(prev => ({
    ...prev,
    selectedBookId: bookId,
    selectedAuthorId: null,
    showDetail: true,
  }));
};

export const selectAuthor = (authorId: string): void => {
  setCodexState(prev => ({
    ...prev,
    selectedAuthorId: authorId,
    selectedBookId: null,
    showDetail: true,
  }));
};

export const selectTheme = (themeId: string): void => {
  setCodexState(prev => ({
    ...prev,
    selectedThemeId: themeId,
    showDetail: true,
  }));
};

export const selectDiscovery = (discoveryId: string): void => {
  setCodexState(prev => ({
    ...prev,
    selectedDiscoveryId: discoveryId,
    showDetail: true,
  }));
};

export const selectEasterEgg = (easterEggId: string): void => {
  setCodexState(prev => ({
    ...prev,
    selectedEasterEggId: easterEggId,
    showDetail: true,
  }));
};

export const closeDetail = (): void => {
  setCodexState(prev => ({
    ...prev,
    showDetail: false,
    selectedBookId: null,
    selectedAuthorId: null,
    selectedThemeId: null,
    selectedDiscoveryId: null,
    selectedEasterEggId: null,
  }));
};

export const setFilter = (filter: Partial<CodexState['filter']>): void => {
  setCodexState(prev => ({
    ...prev,
    filter: { ...prev.filter, ...filter },
  }));
};

export const setSortBy = (sortBy: CodexState['sortBy']): void => {
  setCodexState(prev => ({
    ...prev,
    sortBy,
  }));
};

export const recordBookFound = (
  bookId: string,
  score: number,
  findTime: number,
  hintsUsed: number,
  difficulty: string,
  achievementIds: string[] = []
): void => {
  updateCollectionEntry(bookId, score, findTime, hintsUsed);
  
  saveBookCodexEntry(bookId, {
    totalTimesFound: 1,
    bestScore: score,
    bestScoreDate: Date.now(),
    fastestFind: findTime,
    fastestFindDate: Date.now(),
    fewestHints: hintsUsed,
    fewestHintsDate: Date.now(),
    relatedAchievements: achievementIds,
  });
  
  const author = getAuthorByBookId(bookId);
  if (author) {
    saveAuthorCodexEntry(author.id, {
      booksRead: [bookId],
      triviaUnlocked: [`${author.id}_trivia_0`],
      quotesUnlocked: [`${author.id}_quote_0`],
    });
  }
  
  let rarity: DiscoveryRecord['rarity'] = 'common';
  const book = BOOKS.find(b => b.id === bookId);
  if (book) {
    if (book.rarity === 'epic') rarity = 'epic';
    else if (book.rarity === 'legendary') rarity = 'legendary';
    else if (book.rarity === 'rare') rarity = 'rare';
    else if (book.rarity === 'uncommon') rarity = 'uncommon';
  }
  
  const narrative = generateDiscoveryNarrative(bookId, score, findTime, hintsUsed);
  const record = createDiscoveryRecord(
    bookId,
    'first_find',
    { score, timeUsed: findTime, hintsUsed, difficulty },
    rarity,
    narrative
  );
  const updatedRecords = saveDiscoveryRecord(record);
  setDiscoveryRecords(updatedRecords);
  
  for (const theme of THEME_COLLECTIONS) {
    checkThemeCollectionCompletion(theme.id);
  }
  
  const newlyUnlocked = checkAllEasterEggs();
  if (newlyUnlocked.length > 0) {
    setNewEasterEggs(newlyUnlocked);
    const firstEgg = EASTER_EGGS.find(e => e.id === newlyUnlocked[0]);
    if (firstEgg) {
      setShowEasterEggPopup(firstEgg.name);
      setTimeout(() => setShowEasterEggPopup(null), 4000);
    }
  }
};

const generateDiscoveryNarrative = (
  bookId: string,
  score: number,
  findTime: number,
  hintsUsed: number
): string => {
  const book = BOOKS.find(b => b.id === bookId);
  if (!book) return '';
  
  const timeRating = findTime < 10 ? '闪电般' : findTime < 30 ? '快速' : findTime < 60 ? '从容' : '耐心';
  const hintRating = hintsUsed === 0 ? '完全凭借自己的智慧' : 
                     hintsUsed === 1 ? '只使用了一次提示' : 
                     `使用了${hintsUsed}次提示`;
  
  return `你在${timeRating}的时间内，${hintRating}，发现了《${book.title}》这本${book.genre}杰作。得分${score}分，这是一次出色的发现！`;
};

export const recordSpeedRecord = (
  bookId: string,
  timeUsed: number,
  difficulty: string
): void => {
  const book = BOOKS.find(b => b.id === bookId);
  const narrative = `哇！你创造了《${book?.title || bookId}》的最快发现记录，仅用时${timeUsed.toFixed(1)}秒！这真是令人惊叹的速度！`;
  const record = createDiscoveryRecord(
    bookId,
    'speed_record',
    { timeUsed, difficulty },
    'epic',
    narrative
  );
  const updatedRecords = saveDiscoveryRecord(record);
  setDiscoveryRecords(updatedRecords);
};

export const recordPerfectFind = (
  bookId: string,
  score: number,
  difficulty: string,
  consecutiveCorrect: number
): void => {
  const book = BOOKS.find(b => b.id === bookId);
  const narrative = `完美！你不使用任何提示就找到了《${book?.title || bookId}》，获得${score}分。连续正确${consecutiveCorrect}次，你正势不可挡！`;
  const record = createDiscoveryRecord(
    bookId,
    'perfect_find',
    { score, hintsUsed: 0, difficulty, consecutiveCorrect },
    'legendary',
    narrative
  );
  const updatedRecords = saveDiscoveryRecord(record);
  setDiscoveryRecords(updatedRecords);
};

export const toggleBookFav = (bookId: string): boolean => {
  const result = toggleBookFavorite(bookId);
  return result;
};

export const toggleAuthorFav = (authorId: string): boolean => {
  const result = toggleAuthorFavorite(authorId);
  return result;
};

export const isBookFav = (bookId: string): boolean => {
  return isBookFavorite(bookId);
};

export const isAuthorFav = (authorId: string): boolean => {
  return isAuthorFavorite(authorId);
};

export const getCodexStateInfo = createMemo(() => {
  const state = codexState();
  const progress = getCodexProgress();
  const stats = getCodexStats();
  const collectionEntries = getAllCollectionEntries();
  const bookEntries = getBookCodexEntries();
  const authorEntries = getAuthorCodexEntries();
  
  return {
    ...state,
    progress,
    stats,
    collectionEntries,
    bookEntries,
    authorEntries,
    isVisible: showCodex(),
    easterEggPopup: showEasterEggPopup(),
  };
});

export const getFilteredBooks = createMemo(() => {
  const state = codexState();
  const filter = state.filter;
  const entries = getAllCollectionEntries();
  
  let filtered = BOOKS.map(book => ({
    book,
    collected: !!entries[book.id],
  }));
  
  if (filter.genre) {
    filtered = filtered.filter(item => item.book.genre === filter.genre);
  }
  
  if (filter.rarity) {
    filtered = filtered.filter(item => item.book.rarity === filter.rarity);
  }
  
  if (filter.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.book.title.toLowerCase().includes(search) ||
      item.book.author.toLowerCase().includes(search) ||
      item.book.description.toLowerCase().includes(search)
    );
  }
  
  if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.book.title.localeCompare(b.book.title));
  } else if (state.sortBy === 'rarity') {
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    filtered.sort((a, b) => rarityOrder.indexOf(a.book.rarity) - rarityOrder.indexOf(b.book.rarity));
  } else if (state.sortBy === 'date') {
    filtered.sort((a, b) => {
      const aEntry = entries[a.book.id];
      const bEntry = entries[b.book.id];
      if (!aEntry && !bEntry) return 0;
      if (!aEntry) return 1;
      if (!bEntry) return -1;
      return bEntry.firstFoundAt - aEntry.firstFoundAt;
    });
  } else if (state.sortBy === 'progress') {
    filtered.sort((a, b) => Number(b.collected) - Number(a.collected));
  }
  
  return filtered;
});

export const getFilteredAuthors = createMemo(() => {
  const state = codexState();
  const filter = state.filter;
  const progress = getCodexProgressStorage();
  
  let filtered = AUTHORS.map(author => ({
    author,
    discovered: progress.discoveredAuthorIds.includes(author.id),
  }));
  
  if (filter.era) {
    filtered = filtered.filter(item => item.author.era === filter.era);
  }
  
  if (filter.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.author.name.toLowerCase().includes(search) ||
      item.author.biography.toLowerCase().includes(search)
    );
  }
  
  if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.author.name.localeCompare(b.author.name));
  } else if (state.sortBy === 'date') {
    filtered.sort((a, b) => {
      return b.author.birthYear - a.author.birthYear;
    });
  } else if (state.sortBy === 'progress') {
    filtered.sort((a, b) => Number(b.discovered) - Number(a.discovered));
  }
  
  return filtered;
});

export const getFilteredThemes = createMemo(() => {
  const state = codexState();
  const filter = state.filter;
  const progress = getCodexProgressStorage();
  const entries = getAllCollectionEntries();
  
  let filtered = THEME_COLLECTIONS.map(theme => {
    const collectedCount = theme.bookIds.filter(id => entries[id]).length;
    return {
      theme,
      progress: collectedCount,
      completed: collectedCount >= theme.requiredBooks,
    };
  });
  
  if (filter.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.theme.name.toLowerCase().includes(search) ||
      item.theme.description.toLowerCase().includes(search)
    );
  }
  
  if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.theme.name.localeCompare(b.theme.name));
  } else if (state.sortBy === 'progress') {
    filtered.sort((a, b) => {
      const aPercent = a.progress / a.theme.bookIds.length;
      const bPercent = b.progress / b.theme.bookIds.length;
      return bPercent - aPercent;
    });
  } else if (state.sortBy === 'date') {
    filtered.sort((a, b) => {
      const aCompleted = a.completed ? progress.completedThemeIds.indexOf(a.theme.id) : -1;
      const bCompleted = b.completed ? progress.completedThemeIds.indexOf(b.theme.id) : -1;
      return bCompleted - aCompleted;
    });
  }
  
  return filtered;
});

export const getFilteredEasterEggs = createMemo(() => {
  const state = codexState();
  const filter = state.filter;
  const progress = getCodexProgressStorage();
  
  let filtered = EASTER_EGGS.map(egg => ({
    egg,
    found: progress.foundEasterEggIds.includes(egg.id),
  }));
  
  if (filter.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.egg.name.toLowerCase().includes(search) ||
      item.egg.hint.toLowerCase().includes(search)
    );
  }
  
  if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.egg.name.localeCompare(b.egg.name));
  } else if (state.sortBy === 'progress') {
    filtered.sort((a, b) => Number(b.found) - Number(a.found));
  } else if (state.sortBy === 'date') {
    filtered.sort((a, b) => {
      const aIdx = progress.foundEasterEggIds.indexOf(a.egg.id);
      const bIdx = progress.foundEasterEggIds.indexOf(b.egg.id);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }
  
  return filtered;
});
