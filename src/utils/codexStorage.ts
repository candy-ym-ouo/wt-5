import type { CodexProgress, DiscoveryRecord, CodexStats, BookCodexEntry, AuthorCodexEntry } from '../types/codex';
import { BOOKS } from '../data/books';
import { AUTHORS, THEME_COLLECTIONS, EASTER_EGGS } from '../data/codex';
import { getAllCollectionEntries } from './storage';

const CODEX_PROGRESS_KEY = 'old_bookstore_codex_progress';
const CODEX_DISCOVERIES_KEY = 'old_bookstore_codex_discoveries';
const CODEX_BOOK_ENTRIES_KEY = 'old_bookstore_codex_book_entries';
const CODEX_AUTHOR_ENTRIES_KEY = 'old_bookstore_codex_author_entries';
const CODEX_VISIT_KEY = 'old_bookstore_codex_visit';
const CODEX_FAVORITES_KEY = 'old_bookstore_codex_favorites';

function _readJSON<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function _writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export const getCodexProgress = (): CodexProgress => {
  const defaultProgress: CodexProgress = {
    collectedBookIds: [],
    discoveredAuthorIds: [],
    discoveryRecordIds: [],
    completedThemeIds: [],
    foundEasterEggIds: [],
    lastVisit: 0,
    visitCount: 0,
  };
  return _readJSON<CodexProgress>(CODEX_PROGRESS_KEY, defaultProgress);
};

export const saveCodexProgress = (progress: CodexProgress): void => {
  _writeJSON(CODEX_PROGRESS_KEY, progress);
};

export const getDiscoveryRecords = (): DiscoveryRecord[] => {
  return _readJSON<DiscoveryRecord[]>(CODEX_DISCOVERIES_KEY, []);
};

export const saveDiscoveryRecord = (record: DiscoveryRecord): DiscoveryRecord[] => {
  const records = getDiscoveryRecords();
  if (records.some(r => r.id === record.id)) return records;
  const updated = [record, ...records];
  _writeJSON(CODEX_DISCOVERIES_KEY, updated);
  
  const progress = getCodexProgress();
  if (!progress.discoveryRecordIds.includes(record.id)) {
    progress.discoveryRecordIds.push(record.id);
    saveCodexProgress(progress);
  }
  
  return updated;
};

export const getBookCodexEntries = (): Record<string, BookCodexEntry> => {
  return _readJSON<Record<string, BookCodexEntry>>(CODEX_BOOK_ENTRIES_KEY, {});
};

export const saveBookCodexEntry = (bookId: string, entry: Partial<BookCodexEntry>): BookCodexEntry => {
  const entries = getBookCodexEntries();
  const existing = entries[bookId] || {
    bookId,
    firstFoundAt: Date.now(),
    totalTimesFound: 0,
    bestScore: 0,
    bestScoreDate: Date.now(),
    fastestFind: Infinity,
    fastestFindDate: Date.now(),
    fewestHints: Infinity,
    fewestHintsDate: Date.now(),
    relatedAchievements: [],
    isFavorite: false,
    tags: [],
  };
  
  const updated: BookCodexEntry = {
    ...existing,
    ...entry,
    totalTimesFound: existing.totalTimesFound + (entry.totalTimesFound || 0),
    relatedAchievements: entry.relatedAchievements 
      ? [...new Set([...existing.relatedAchievements, ...entry.relatedAchievements])]
      : existing.relatedAchievements,
    tags: entry.tags 
      ? [...new Set([...existing.tags, ...entry.tags])]
      : existing.tags,
  };
  
  entries[bookId] = updated;
  _writeJSON(CODEX_BOOK_ENTRIES_KEY, entries);
  
  const progress = getCodexProgress();
  if (!progress.collectedBookIds.includes(bookId)) {
    progress.collectedBookIds.push(bookId);
    saveCodexProgress(progress);
  }
  
  return updated;
};

export const getAuthorCodexEntries = (): Record<string, AuthorCodexEntry> => {
  return _readJSON<Record<string, AuthorCodexEntry>>(CODEX_AUTHOR_ENTRIES_KEY, {});
};

export const saveAuthorCodexEntry = (authorId: string, entry: Partial<AuthorCodexEntry>): AuthorCodexEntry => {
  const entries = getAuthorCodexEntries();
  const existing = entries[authorId] || {
    authorId,
    discoveredAt: Date.now(),
    booksRead: [],
    triviaUnlocked: [],
    quotesUnlocked: [],
    isFavorite: false,
  };
  
  const updated: AuthorCodexEntry = {
    ...existing,
    ...entry,
    booksRead: entry.booksRead 
      ? [...new Set([...existing.booksRead, ...entry.booksRead])]
      : existing.booksRead,
    triviaUnlocked: entry.triviaUnlocked 
      ? [...new Set([...existing.triviaUnlocked, ...entry.triviaUnlocked])]
      : existing.triviaUnlocked,
    quotesUnlocked: entry.quotesUnlocked 
      ? [...new Set([...existing.quotesUnlocked, ...entry.quotesUnlocked])]
      : existing.quotesUnlocked,
  };
  
  entries[authorId] = updated;
  _writeJSON(CODEX_AUTHOR_ENTRIES_KEY, entries);
  
  const progress = getCodexProgress();
  if (!progress.discoveredAuthorIds.includes(authorId)) {
    progress.discoveredAuthorIds.push(authorId);
    saveCodexProgress(progress);
  }
  
  return updated;
};

export const recordCodexVisit = (): void => {
  const progress = getCodexProgress();
  progress.lastVisit = Date.now();
  progress.visitCount = (progress.visitCount || 0) + 1;
  saveCodexProgress(progress);
};

export const updateThemeCollectionProgress = (themeId: string, completed: boolean): void => {
  const progress = getCodexProgress();
  if (completed && !progress.completedThemeIds.includes(themeId)) {
    progress.completedThemeIds.push(themeId);
    saveCodexProgress(progress);
  } else if (!completed && progress.completedThemeIds.includes(themeId)) {
    progress.completedThemeIds = progress.completedThemeIds.filter(id => id !== themeId);
    saveCodexProgress(progress);
  }
};

export const unlockEasterEgg = (easterEggId: string): boolean => {
  const progress = getCodexProgress();
  if (progress.foundEasterEggIds.includes(easterEggId)) return false;
  
  progress.foundEasterEggIds.push(easterEggId);
  saveCodexProgress(progress);
  return true;
};

export const isEasterEggUnlocked = (easterEggId: string): boolean => {
  const progress = getCodexProgress();
  return progress.foundEasterEggIds.includes(easterEggId);
};

export const checkThemeCollectionCompletion = (themeId: string): boolean => {
  const theme = THEME_COLLECTIONS.find(t => t.id === themeId);
  if (!theme) return false;
  
  const collectionEntries = getAllCollectionEntries();
  const collectedCount = theme.bookIds.filter(id => collectionEntries[id]).length;
  const completed = collectedCount >= theme.requiredBooks;
  
  updateThemeCollectionProgress(themeId, completed);
  return completed;
};

export const checkEasterEggUnlock = (easterEggId: string): boolean => {
  const easterEgg = EASTER_EGGS.find(e => e.id === easterEggId);
  if (!easterEgg) return false;
  
  const progress = getCodexProgress();
  const collectionEntries = getAllCollectionEntries();
  const cond = easterEgg.unlockCondition;
  
  let unlocked = false;
  
  switch (cond.type) {
    case 'find_book':
      unlocked = !!collectionEntries[cond.bookId!];
      break;
    case 'find_all_books':
      unlocked = cond.bookIds!.every(id => collectionEntries[id]);
      break;
    case 'specific_sequence':
      unlocked = progress.discoveryRecordIds.length >= (cond.sequence?.length || 0);
      break;
    case 'specific_date':
      if (cond.date) {
        const now = new Date();
        unlocked = now.getMonth() + 1 === cond.date.month && now.getDate() === cond.date.day;
      }
      break;
    case 'click_pattern':
      unlocked = false;
      break;
    case 'achievement_unlock':
      unlocked = progress.discoveryRecordIds.some(id => id.includes(cond.achievementId!));
      break;
  }
  
  if (unlocked) {
    return unlockEasterEgg(easterEggId);
  }
  
  return false;
};

export const checkAllEasterEggs = (): string[] => {
  const newlyUnlocked: string[] = [];
  for (const egg of EASTER_EGGS) {
    if (!isEasterEggUnlocked(egg.id)) {
      if (checkEasterEggUnlock(egg.id)) {
        newlyUnlocked.push(egg.id);
      }
    }
  }
  return newlyUnlocked;
};

export const getCodexStats = (): CodexStats => {
  const progress = getCodexProgress();
  const totalBooks = BOOKS.length;
  const collectedBooks = progress.collectedBookIds.length;
  const totalAuthors = AUTHORS.length;
  const discoveredAuthors = progress.discoveredAuthorIds.length;
  const totalDiscoveries = getDiscoveryRecords().length;
  const totalThemes = THEME_COLLECTIONS.length;
  const completedThemes = progress.completedThemeIds.length;
  const totalEasterEggs = EASTER_EGGS.length;
  const foundEasterEggs = progress.foundEasterEggIds.length;
  
  const totalItems = totalBooks + totalAuthors + totalThemes + totalEasterEggs;
  const completedItems = collectedBooks + discoveredAuthors + completedThemes + foundEasterEggs;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  return {
    totalBooks,
    collectedBooks,
    totalAuthors,
    discoveredAuthors,
    totalDiscoveries,
    totalThemes,
    completedThemes,
    totalEasterEggs,
    foundEasterEggs,
    completionPercentage,
  };
};

export const createDiscoveryRecord = (
  bookId: string,
  type: DiscoveryRecord['type'],
  details: Partial<DiscoveryRecord['details']>,
  rarity: DiscoveryRecord['rarity'],
  narrative: string
): DiscoveryRecord => {
  const record: DiscoveryRecord = {
    id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    bookId,
    type,
    timestamp: Date.now(),
    details: details as DiscoveryRecord['details'],
    rarity,
    narrative,
  };
  return record;
};

export const getFavorites = (): { books: string[]; authors: string[] } => {
  return _readJSON(CODEX_FAVORITES_KEY, { books: [], authors: [] });
};

export const toggleBookFavorite = (bookId: string): boolean => {
  const favorites = getFavorites();
  const index = favorites.books.indexOf(bookId);
  if (index >= 0) {
    favorites.books.splice(index, 1);
  } else {
    favorites.books.push(bookId);
  }
  _writeJSON(CODEX_FAVORITES_KEY, favorites);
  return index < 0;
};

export const toggleAuthorFavorite = (authorId: string): boolean => {
  const favorites = getFavorites();
  const index = favorites.authors.indexOf(authorId);
  if (index >= 0) {
    favorites.authors.splice(index, 1);
  } else {
    favorites.authors.push(authorId);
  }
  _writeJSON(CODEX_FAVORITES_KEY, favorites);
  return index < 0;
};

export const isBookFavorite = (bookId: string): boolean => {
  return getFavorites().books.includes(bookId);
};

export const isAuthorFavorite = (authorId: string): boolean => {
  return getFavorites().authors.includes(authorId);
};

export const clearAllCodexData = (): void => {
  localStorage.removeItem(CODEX_PROGRESS_KEY);
  localStorage.removeItem(CODEX_DISCOVERIES_KEY);
  localStorage.removeItem(CODEX_BOOK_ENTRIES_KEY);
  localStorage.removeItem(CODEX_AUTHOR_ENTRIES_KEY);
  localStorage.removeItem(CODEX_VISIT_KEY);
  localStorage.removeItem(CODEX_FAVORITES_KEY);
};
