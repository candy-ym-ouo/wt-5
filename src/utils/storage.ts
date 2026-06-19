import type { LeaderboardEntry, ChapterProgress } from '../types/game';

export const LEADERBOARD_KEY = 'old_bookstore_leaderboard';
export const ACHIEVEMENTS_KEY = 'old_bookstore_achievements';
export const GAME_STATS_KEY = 'old_bookstore_stats';
export const CHAPTER_PROGRESS_KEY = 'old_bookstore_chapter_progress';
export const CURRENT_CHAPTER_KEY = 'old_bookstore_current_chapter';

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLeaderboardEntry = (entry: LeaderboardEntry): LeaderboardEntry[] => {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  const topTen = leaderboard.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topTen));
  return topTen;
};

export const getUnlockedAchievements = (): string[] => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveUnlockedAchievements = (ids: string[]): void => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
};

export const getGamesPlayed = (): number => {
  try {
    const data = localStorage.getItem(GAME_STATS_KEY);
    if (data) {
      const stats = JSON.parse(data);
      return stats.gamesPlayed || 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

export const incrementGamesPlayed = (): number => {
  const current = getGamesPlayed();
  const newCount = current + 1;
  localStorage.setItem(GAME_STATS_KEY, JSON.stringify({ gamesPlayed: newCount }));
  return newCount;
};

export const getAllChapterProgress = (): Record<string, ChapterProgress> => {
  try {
    const data = localStorage.getItem(CHAPTER_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const getChapterProgress = (chapterId: string): ChapterProgress | null => {
  const allProgress = getAllChapterProgress();
  return allProgress[chapterId] || null;
};

export const saveChapterProgress = (progress: ChapterProgress): void => {
  const allProgress = getAllChapterProgress();
  allProgress[progress.chapterId] = progress;
  localStorage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify(allProgress));
};

export const getCurrentChapterId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_CHAPTER_KEY);
  } catch {
    return null;
  }
};

export const setCurrentChapterId = (chapterId: string | null): void => {
  if (chapterId) {
    localStorage.setItem(CURRENT_CHAPTER_KEY, chapterId);
  } else {
    localStorage.removeItem(CURRENT_CHAPTER_KEY);
  }
};

export const getUnlockedChapterIds = (): string[] => {
  const allProgress = getAllChapterProgress();
  const unlocked: string[] = [];
  
  let prevCompleted = true;
  const chapterOrder = [
    'chapter_literature',
    'chapter_classics', 
    'chapter_science',
    'chapter_philosophy',
    'chapter_tech'
  ];
  
  for (const id of chapterOrder) {
    if (prevCompleted || allProgress[id]) {
      unlocked.push(id);
    }
    if (allProgress[id]?.completedAt) {
      prevCompleted = true;
    } else if (id !== 'chapter_literature') {
      prevCompleted = false;
    }
  }
  
  if (unlocked.length === 0) {
    unlocked.push('chapter_literature');
  }
  
  return unlocked;
};

export const getCompletedChaptersCount = (): number => {
  const allProgress = getAllChapterProgress();
  return Object.values(allProgress).filter(p => p.completedAt).length;
};

export const clearChapterProgress = (): void => {
  localStorage.removeItem(CHAPTER_PROGRESS_KEY);
  localStorage.removeItem(CURRENT_CHAPTER_KEY);
};
