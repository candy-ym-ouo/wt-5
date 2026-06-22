import type { Booklist, BooklistProgress, BooklistLeaderboardEntry, BooklistChallenge } from '../types/booklist';
import { getPresetBooklists } from '../data/booklist';

const CUSTOM_BOOKLISTS_KEY = 'old_bookstore_custom_booklists';
const BOOKLIST_PROGRESS_KEY = 'old_bookstore_booklist_progress';
const BOOKLIST_LEADERBOARD_KEY = 'old_bookstore_booklist_leaderboard';
const BOOKLIST_CHALLENGES_KEY = 'old_bookstore_booklist_challenges';
const CURRENT_BOOKLIST_KEY = 'old_bookstore_current_booklist';

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
    console.warn('Failed to write to localStorage:', key);
  }
}

export const getCustomBooklists = (): Booklist[] => {
  return _readJSON<Booklist[]>(CUSTOM_BOOKLISTS_KEY, []);
};

export const saveCustomBooklist = (booklist: Booklist): void => {
  const lists = getCustomBooklists();
  const existingIndex = lists.findIndex(b => b.id === booklist.id);
  if (existingIndex >= 0) {
    lists[existingIndex] = booklist;
  } else {
    lists.push(booklist);
  }
  _writeJSON(CUSTOM_BOOKLISTS_KEY, lists);
};

export const deleteCustomBooklist = (booklistId: string): void => {
  const lists = getCustomBooklists();
  const filtered = lists.filter(b => b.id !== booklistId);
  _writeJSON(CUSTOM_BOOKLISTS_KEY, filtered);
};

export const getAllBooklists = (): Booklist[] => {
  const presets = getPresetBooklists();
  const customs = getCustomBooklists();
  return [...presets, ...customs];
};

export const getBooklistProgress = (booklistId: string): BooklistProgress | null => {
  const allProgress = _readJSON<Record<string, BooklistProgress>>(BOOKLIST_PROGRESS_KEY, {});
  return allProgress[booklistId] || null;
};

export const getAllBooklistProgress = (): Record<string, BooklistProgress> => {
  return _readJSON<Record<string, BooklistProgress>>(BOOKLIST_PROGRESS_KEY, {});
};

export const saveBooklistProgress = (booklistId: string, progress: BooklistProgress): void => {
  const allProgress = getAllBooklistProgress();
  allProgress[booklistId] = progress;
  _writeJSON(BOOKLIST_PROGRESS_KEY, allProgress);
};

export const updateBooklistProgress = (
  booklistId: string,
  updates: Partial<BooklistProgress>
): BooklistProgress => {
  const existing = getBooklistProgress(booklistId);
  const now = Date.now();
  
  const progress: BooklistProgress = existing ? { ...existing, ...updates } : {
    booklistId,
    foundBookIds: [],
    currentBookIndex: 0,
    totalScore: 0,
    totalTimeUsed: 0,
    totalHintsUsed: 0,
    bestScore: 0,
    bestScoreDate: 0,
    fastestCompletion: 0,
    fastestCompletionDate: 0,
    completions: 0,
    ...updates,
  };

  if (updates.totalScore !== undefined && updates.totalScore > progress.bestScore) {
    progress.bestScore = updates.totalScore;
    progress.bestScoreDate = now;
  }

  saveBooklistProgress(booklistId, progress);
  return progress;
};

export const getBooklistLeaderboard = (booklistId: string): BooklistLeaderboardEntry[] => {
  const allBoards = _readJSON<Record<string, BooklistLeaderboardEntry[]>>(BOOKLIST_LEADERBOARD_KEY, {});
  return allBoards[booklistId] || [];
};

export const saveBooklistLeaderboardEntry = (
  booklistId: string,
  entry: BooklistLeaderboardEntry
): void => {
  const allBoards = _readJSON<Record<string, BooklistLeaderboardEntry[]>>(BOOKLIST_LEADERBOARD_KEY, {});
  const list = allBoards[booklistId] || [];
  
  const existingIndex = list.findIndex(e => e.playerName === entry.playerName);
  if (existingIndex >= 0) {
    if (entry.score > list[existingIndex].score) {
      list[existingIndex] = entry;
    }
  } else {
    list.push(entry);
  }
  
  list.sort((a, b) => b.score - a.score);
  allBoards[booklistId] = list.slice(0, 20);
  _writeJSON(BOOKLIST_LEADERBOARD_KEY, allBoards);
};

export const getBooklistChallenges = (booklistId: string): BooklistChallenge[] => {
  const allChallenges = _readJSON<Record<string, BooklistChallenge[]>>(BOOKLIST_CHALLENGES_KEY, {});
  return allChallenges[booklistId] || [];
};

export const saveBooklistChallenges = (
  booklistId: string,
  challenges: BooklistChallenge[]
): void => {
  const allChallenges = _readJSON<Record<string, BooklistChallenge[]>>(BOOKLIST_CHALLENGES_KEY, {});
  allChallenges[booklistId] = challenges;
  _writeJSON(BOOKLIST_CHALLENGES_KEY, allChallenges);
};

export const updateBooklistChallenge = (
  booklistId: string,
  challengeId: string,
  updates: Partial<BooklistChallenge>
): BooklistChallenge | null => {
  const challenges = getBooklistChallenges(booklistId);
  const challengeIndex = challenges.findIndex(c => c.id === challengeId);
  if (challengeIndex < 0) return null;
  
  challenges[challengeIndex] = { ...challenges[challengeIndex], ...updates };
  saveBooklistChallenges(booklistId, challenges);
  return challenges[challengeIndex];
};

export const getCurrentBooklistId = (): string | null => {
  return _readJSON<string | null>(CURRENT_BOOKLIST_KEY, null);
};

export const setCurrentBooklistId = (booklistId: string | null): void => {
  _writeJSON(CURRENT_BOOKLIST_KEY, booklistId);
};

export const getCustomBooklistCount = (): number => {
  return getCustomBooklists().length;
};

export const clearAllBooklistData = (): void => {
  localStorage.removeItem(CUSTOM_BOOKLISTS_KEY);
  localStorage.removeItem(BOOKLIST_PROGRESS_KEY);
  localStorage.removeItem(BOOKLIST_LEADERBOARD_KEY);
  localStorage.removeItem(BOOKLIST_CHALLENGES_KEY);
  localStorage.removeItem(CURRENT_BOOKLIST_KEY);
};
