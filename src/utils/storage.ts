import type { LeaderboardEntry, ChapterProgress, SeasonInfo, PersonalBest, ThemeProgress, GameReplayData, AchievementProgress, DailyChallengeScore, DailyChallengeProgress } from '../types/game';
import { ACHIEVEMENTS } from '../data/achievements';

export const LEADERBOARD_KEY = 'old_bookstore_leaderboard';
export const ACHIEVEMENTS_KEY = 'old_bookstore_achievements';
export const ACHIEVEMENTS_PROGRESS_KEY = 'old_bookstore_achievements_progress';
export const GAME_STATS_KEY = 'old_bookstore_stats';
export const CHAPTER_PROGRESS_KEY = 'old_bookstore_chapter_progress';
export const CURRENT_CHAPTER_KEY = 'old_bookstore_current_chapter';
export const SEASON_KEY = 'old_bookstore_season';
export const PERSONAL_BEST_KEY = 'old_bookstore_personal_best';
export const STORAGE_VERSION_KEY = 'old_bookstore_storage_version';
export const THEME_PROGRESS_KEY = 'old_bookstore_theme_progress';
export const THEME_REWARDS_KEY = 'old_bookstore_theme_rewards';
export const CURRENT_THEME_KEY = 'old_bookstore_current_theme';
export const STREAK_KEY = 'old_bookstore_streak';
export const GAME_REPLAY_KEY = 'old_bookstore_replays';
export const LAST_GAME_REPLAY_KEY = 'old_bookstore_last_replay';
export const DAILY_CHALLENGE_LEADERBOARD_KEY = 'old_bookstore_daily_leaderboard';
export const DAILY_CHALLENGE_PROGRESS_KEY = 'old_bookstore_daily_progress';

const CURRENT_STORAGE_VERSION = 4;

function getWeekNumber(date: number): number {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const oneDay = 86400000;
  const dayOfYear = Math.floor(diff / oneDay) + 1;
  return Math.ceil(dayOfYear / 7);
}

function getWeekStartEnd(year: number, week: number): { start: number; end: number } {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const offset = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;
  const weekStart = new Date(year, 0, offset + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setMilliseconds(-1);
  return { start: weekStart.getTime(), end: weekEnd.getTime() };
}

export function getCurrentSeason(): SeasonInfo {
  try {
    const data = localStorage.getItem(SEASON_KEY);
    if (data) {
      const season = JSON.parse(data) as SeasonInfo;
      if (Date.now() <= season.endDate) {
        return season;
      }
    }
  } catch {}

  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3);
  const seasonNames = ['春', '夏', '秋', '冬'];
  const seasonStart = new Date(year, quarter * 3, 1);
  const seasonEnd = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999);

  const season: SeasonInfo = {
    id: `${year}-Q${quarter + 1}`,
    name: `${year}${seasonNames[quarter]}季`,
    startDate: seasonStart.getTime(),
    endDate: seasonEnd.getTime(),
  };

  localStorage.setItem(SEASON_KEY, JSON.stringify(season));
  return season;
}

export function getCurrentWeekNumber(): number {
  return getWeekNumber(Date.now());
}

export function getWeeklyLeaderboard(weekNumber?: number): LeaderboardEntry[] {
  const all = getLeaderboard();
  const week = weekNumber ?? getCurrentWeekNumber();
  const now = new Date();
  const { start, end } = getWeekStartEnd(now.getFullYear(), week);
  return all.filter(e => e.date >= start && e.date <= end);
}

export function getSeasonLeaderboard(seasonId?: string): LeaderboardEntry[] {
  const all = getLeaderboard();
  const season = seasonId ?? getCurrentSeason().id;
  return all.filter(e => e.seasonId === season || (!e.seasonId && isDateInSeason(e.date, season)));
}

function isDateInSeason(date: number, seasonId: string): boolean {
  const parts = seasonId.split('-Q');
  const year = parseInt(parts[0]);
  const quarter = parseInt(parts[1]) - 1;
  const start = new Date(year, quarter * 3, 1).getTime();
  const end = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999).getTime();
  return date >= start && date <= end;
}

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLeaderboardEntry = (entry: LeaderboardEntry): LeaderboardEntry[] => {
  const season = getCurrentSeason();
  const entryWithMeta: LeaderboardEntry = {
    ...entry,
    seasonId: season.id,
    weekNumber: getWeekNumber(entry.date),
  };

  const leaderboard = getLeaderboard();
  leaderboard.push(entryWithMeta);
  leaderboard.sort((a, b) => b.score - a.score);
  const topFifty = leaderboard.slice(0, 50);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topFifty));
  return topFifty;
};

export function getPersonalBest(): PersonalBest {
  try {
    const data = localStorage.getItem(PERSONAL_BEST_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    highestScore: 0,
    highestScoreDate: 0,
    totalGamesPlayed: 0,
    totalBooksFound: 0,
    fastestFind: 0,
    fastestFindDate: 0,
    fewestHintsScore: 0,
    fewestHintsDate: 0,
    fewestHintsCount: -1,
    longestStreak: 0,
    longestStreakDate: 0,
    weeklyBestScores: {},
    seasonBestScores: {},
  };
}

export function updatePersonalBest(update: {
  score: number;
  booksFound: number;
  findTime: number;
  hintsUsed: number;
  consecutiveCorrect: number;
}): PersonalBest {
  const best = getPersonalBest();
  const now = Date.now();
  const week = getCurrentWeekNumber();
  const season = getCurrentSeason();

  if (update.score > best.highestScore) {
    best.highestScore = update.score;
    best.highestScoreDate = now;
  }

  best.totalGamesPlayed += 1;
  best.totalBooksFound += update.booksFound;

  if (update.findTime > 0 && (best.fastestFind === 0 || update.findTime < best.fastestFind)) {
    best.fastestFind = update.findTime;
    best.fastestFindDate = now;
  }

  if (best.fewestHintsCount < 0 || update.hintsUsed < best.fewestHintsCount) {
    best.fewestHintsScore = update.score;
    best.fewestHintsDate = now;
    best.fewestHintsCount = update.hintsUsed;
  }

  if (update.consecutiveCorrect > best.longestStreak) {
    best.longestStreak = update.consecutiveCorrect;
    best.longestStreakDate = now;
  }

  if (!best.weeklyBestScores[week] || update.score > best.weeklyBestScores[week]) {
    best.weeklyBestScores[week] = update.score;
  }

  if (!best.seasonBestScores[season.id] || update.score > best.seasonBestScores[season.id]) {
    best.seasonBestScores[season.id] = update.score;
  }

  localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(best));
  return best;
}

export function isNewPersonalBest(score: number): { score: boolean; weekly: boolean; season: boolean } {
  const best = getPersonalBest();
  const week = getCurrentWeekNumber();
  const season = getCurrentSeason();
  return {
    score: score > best.highestScore,
    weekly: !best.weeklyBestScores[week] || score > best.weeklyBestScores[week],
    season: !best.seasonBestScores[season.id] || score > best.seasonBestScores[season.id],
  };
}

export function getPersonalBestRank(score: number): number {
  const all = getLeaderboard().sort((a, b) => b.score - a.score);
  for (let i = 0; i < all.length; i++) {
    if (all[i].score <= score) return i + 1;
  }
  return all.length + 1;
}

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

export const getAllAchievementProgress = (): Record<string, AchievementProgress> => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const getAchievementProgress = (achievementId: string): AchievementProgress | null => {
  const allProgress = getAllAchievementProgress();
  return allProgress[achievementId] || null;
};

export const saveAchievementProgress = (progress: AchievementProgress): void => {
  const allProgress = getAllAchievementProgress();
  allProgress[progress.achievementId] = progress;
  localStorage.setItem(ACHIEVEMENTS_PROGRESS_KEY, JSON.stringify(allProgress));
};

export const saveAllAchievementProgress = (progress: Record<string, AchievementProgress>): void => {
  localStorage.setItem(ACHIEVEMENTS_PROGRESS_KEY, JSON.stringify(progress));
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

function migrateFromV1ToV2(): void {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) return;
    const entries: LeaderboardEntry[] = JSON.parse(data);
    if (entries.length === 0) return;

    const needsMigration = entries.some(e => !e.seasonId);
    if (!needsMigration) return;

    const migrated = entries.map(entry => {
      if (entry.seasonId) return entry;
      const entryDate = new Date(entry.date);
      const year = entryDate.getFullYear();
      const quarter = Math.floor(entryDate.getMonth() / 3);
      const seasonId = `${year}-Q${quarter + 1}`;
      const weekNumber = getWeekNumber(entry.date);
      return { ...entry, seasonId, weekNumber };
    });

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(migrated));

    const best = getPersonalBest();
    if (best.totalGamesPlayed === 0) {
      best.totalGamesPlayed = getGamesPlayed();
      const totalBooks = migrated.reduce((sum) => sum + 1, 0);
      best.totalBooksFound = totalBooks;
      if (migrated.length > 0) {
        const top = migrated.sort((a, b) => b.score - a.score)[0];
        best.highestScore = top.score;
        best.highestScoreDate = top.date;
      }
      localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(best));
    }
  } catch {}
}

function migrateFromV3ToV4(): void {
  try {
    const existingProgress = localStorage.getItem(ACHIEVEMENTS_PROGRESS_KEY);
    if (existingProgress) return;

    const unlockedIds = getUnlockedAchievements();
    const pb = getPersonalBest();
    const gamesPlayedCount = getGamesPlayed();
    const now = Date.now();

    const progress: Record<string, AchievementProgress> = {};
    const newUnlockedIds = [...unlockedIds];

    const oldStreakAchievements: Record<string, number> = {
      'streak_3': 3,
      'streak_5': 5,
      'streak_8': 8,
      'streak_12': 12,
      'streak_16': 16,
      'streak_20': 20,
      'streak_30': 30,
    };

    let bestStreakFromOld = pb.longestStreak || 0;
    for (const [oldId, threshold] of Object.entries(oldStreakAchievements)) {
      if (unlockedIds.includes(oldId)) {
        bestStreakFromOld = Math.max(bestStreakFromOld, threshold);
      }
    }

    const progressiveAchievements = [
      {
        id: 'bookworm',
        progressValue: pb.totalBooksFound || 0,
        oldIds: ['first_book', 'bookworm', 'perfect_round'],
      },
      {
        id: 'veteran',
        progressValue: gamesPlayedCount || 0,
        oldIds: ['veteran'],
      },
      {
        id: 'streak_master',
        progressValue: bestStreakFromOld,
        oldIds: Object.keys(oldStreakAchievements),
      },
    ];

    for (const progAchv of progressiveAchievements) {
      const achievement = ACHIEVEMENTS.find(a => a.id === progAchv.id);
      if (!achievement || !achievement.stages) continue;

      let wasUnlocked = false;
      for (const oldId of progAchv.oldIds) {
        if (unlockedIds.includes(oldId)) {
          wasUnlocked = true;
          break;
        }
      }

      const currentProgress = Math.max(
        progAchv.progressValue,
        wasUnlocked ? (achievement.stages[0]?.threshold || 1) : 0
      );

      const unlockedStages: string[] = [];
      const stageUnlockTimes: Record<string, number> = {};

      for (const stage of achievement.stages) {
        if (currentProgress >= stage.threshold) {
          unlockedStages.push(stage.id);
          stageUnlockTimes[stage.id] = now;
        }
      }

      const isCompleted = achievement.stages.length > 0 &&
        currentProgress >= achievement.stages[achievement.stages.length - 1].threshold;

      if (wasUnlocked && !newUnlockedIds.includes(progAchv.id)) {
        newUnlockedIds.push(progAchv.id);
      }

      if (wasUnlocked || currentProgress > 0) {
        progress[progAchv.id] = {
          achievementId: progAchv.id,
          currentProgress,
          unlockedStages,
          stageUnlockTimes,
          unlockedAt: wasUnlocked ? now : undefined,
          completedAt: isCompleted ? now : undefined,
        };
      }
    }

    for (const id of unlockedIds) {
      if (progress[id]) continue;
      if (oldStreakAchievements[id]) continue;

      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (!achievement) continue;

      if (achievement.type === 'single') {
        progress[id] = {
          achievementId: id,
          currentProgress: 1,
          unlockedStages: [],
          unlockedAt: now,
          completedAt: now,
        };
      }
    }

    saveAllAchievementProgress(progress);

    const finalUnlockedIds = newUnlockedIds.filter(id => {
      if (oldStreakAchievements[id]) return false;
      return true;
    });
    saveUnlockedAchievements(finalUnlockedIds);
  } catch {}
}

export function runMigrations(): void {
  try {
    const versionStr = localStorage.getItem(STORAGE_VERSION_KEY);
    const version = versionStr ? parseInt(versionStr, 10) : 1;

    if (version < 2) {
      migrateFromV1ToV2();
    }

    if (version < 4) {
      migrateFromV3ToV4();
    }

    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
  } catch {}
}

export const getAllThemeProgress = (): Record<string, ThemeProgress> => {
  try {
    const data = localStorage.getItem(THEME_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const getThemeProgress = (themeId: string): ThemeProgress | null => {
  const allProgress = getAllThemeProgress();
  return allProgress[themeId] || null;
};

export const saveThemeProgress = (progress: ThemeProgress): void => {
  const allProgress = getAllThemeProgress();
  allProgress[progress.themeId] = progress;
  localStorage.setItem(THEME_PROGRESS_KEY, JSON.stringify(allProgress));
};

export const getCurrentThemeId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_THEME_KEY);
  } catch {
    return null;
  }
};

export const setCurrentThemeId = (themeId: string | null): void => {
  if (themeId) {
    localStorage.setItem(CURRENT_THEME_KEY, themeId);
  } else {
    localStorage.removeItem(CURRENT_THEME_KEY);
  }
};

export const getUnlockedThemeRewardIds = (): string[] => {
  try {
    const data = localStorage.getItem(THEME_REWARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveUnlockedThemeRewardIds = (ids: string[]): void => {
  localStorage.setItem(THEME_REWARDS_KEY, JSON.stringify(ids));
};

export const getCompletedThemesCount = (): number => {
  const allProgress = getAllThemeProgress();
  return Object.values(allProgress).filter(p => p.completedAt).length;
};

export const clearThemeProgress = (): void => {
  localStorage.removeItem(THEME_PROGRESS_KEY);
  localStorage.removeItem(CURRENT_THEME_KEY);
  localStorage.removeItem(THEME_REWARDS_KEY);
};

export interface SavedStreakState {
  currentStreak: number;
  bestStreak: number;
  bestStreakDate: number;
  currentTitleId: string;
  lastScore: number;
  lastDifficulty: string;
  savedAt: number;
}

export const getSavedStreak = (): SavedStreakState | null => {
  try {
    const data = localStorage.getItem(STREAK_KEY);
    if (data) {
      const saved = JSON.parse(data) as SavedStreakState;
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - saved.savedAt < oneDay) {
        return saved;
      }
    }
  } catch {}
  return null;
};

export const saveStreak = (streak: SavedStreakState): void => {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify({
      ...streak,
      savedAt: Date.now(),
    }));
  } catch {}
};

export const clearSavedStreak = (): void => {
  localStorage.removeItem(STREAK_KEY);
};

export const saveGameReplay = (replay: GameReplayData): void => {
  try {
    localStorage.setItem(LAST_GAME_REPLAY_KEY, JSON.stringify(replay));
    
    const allReplays = getAllGameReplays();
    allReplays.push(replay);
    allReplays.sort((a, b) => b.totalScore - a.totalScore);
    const top20 = allReplays.slice(0, 20);
    localStorage.setItem(GAME_REPLAY_KEY, JSON.stringify(top20));
  } catch {}
};

export const getLastGameReplay = (): GameReplayData | null => {
  try {
    const data = localStorage.getItem(LAST_GAME_REPLAY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const getAllGameReplays = (): GameReplayData[] => {
  try {
    const data = localStorage.getItem(GAME_REPLAY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getGameReplayById = (id: string): GameReplayData | null => {
  const all = getAllGameReplays();
  return all.find(r => r.id === id) || null;
};

export const getGameReplayByScore = (score: number): GameReplayData | null => {
  const all = getAllGameReplays();
  return all.find(r => r.totalScore === score) || null;
};

export const clearGameReplays = (): void => {
  localStorage.removeItem(GAME_REPLAY_KEY);
  localStorage.removeItem(LAST_GAME_REPLAY_KEY);
};

export function getDailyLeaderboard(dateKey?: string): DailyChallengeScore[] {
  try {
    const data = localStorage.getItem(DAILY_CHALLENGE_LEADERBOARD_KEY);
    if (!data) return [];
    const allEntries: Record<string, DailyChallengeScore[]> = JSON.parse(data);
    const targetDate = dateKey || getTodayDateKey();
    return allEntries[targetDate] || [];
  } catch {
    return [];
  }
}

export function saveDailyLeaderboardEntry(entry: DailyChallengeScore): DailyChallengeScore[] {
  try {
    const data = localStorage.getItem(DAILY_CHALLENGE_LEADERBOARD_KEY);
    const allEntries: Record<string, DailyChallengeScore[]> = data ? JSON.parse(data) : {};
    
    const dateEntries = allEntries[entry.date] || [];
    dateEntries.push(entry);
    dateEntries.sort((a, b) => b.score - a.score);
    const topFifty = dateEntries.slice(0, 50);
    allEntries[entry.date] = topFifty;
    
    localStorage.setItem(DAILY_CHALLENGE_LEADERBOARD_KEY, JSON.stringify(allEntries));
    return topFifty;
  } catch {
    return [];
  }
}

export function getDailyProgress(dateKey?: string): DailyChallengeProgress | null {
  try {
    const data = localStorage.getItem(DAILY_CHALLENGE_PROGRESS_KEY);
    if (!data) return null;
    const allProgress: Record<string, DailyChallengeProgress> = JSON.parse(data);
    const targetDate = dateKey || getTodayDateKey();
    return allProgress[targetDate] || null;
  } catch {
    return null;
  }
}

export function updateDailyProgress(update: {
  date: string;
  score: number;
  booksFound: number;
}): DailyChallengeProgress {
  try {
    const data = localStorage.getItem(DAILY_CHALLENGE_PROGRESS_KEY);
    const allProgress: Record<string, DailyChallengeProgress> = data ? JSON.parse(data) : {};
    
    const existing = allProgress[update.date];
    const now = Date.now();
    
    const progress: DailyChallengeProgress = {
      date: update.date,
      bestScore: existing ? Math.max(existing.bestScore, update.score) : update.score,
      bestScoreTimestamp: existing && existing.bestScore >= update.score 
        ? existing.bestScoreTimestamp 
        : now,
      booksFound: existing ? Math.max(existing.booksFound, update.booksFound) : update.booksFound,
      attempts: (existing?.attempts || 0) + 1,
      completed: existing?.completed || false,
    };
    
    allProgress[update.date] = progress;
    localStorage.setItem(DAILY_CHALLENGE_PROGRESS_KEY, JSON.stringify(allProgress));
    return progress;
  } catch {
    return {
      date: update.date,
      bestScore: update.score,
      bestScoreTimestamp: Date.now(),
      booksFound: update.booksFound,
      attempts: 1,
      completed: false,
    };
  }
}

export function markDailyCompleted(dateKey: string): void {
  try {
    const data = localStorage.getItem(DAILY_CHALLENGE_PROGRESS_KEY);
    const allProgress: Record<string, DailyChallengeProgress> = data ? JSON.parse(data) : {};
    
    if (allProgress[dateKey]) {
      allProgress[dateKey].completed = true;
      localStorage.setItem(DAILY_CHALLENGE_PROGRESS_KEY, JSON.stringify(allProgress));
    }
  } catch {}
}

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyBestScore(dateKey?: string): number {
  const progress = getDailyProgress(dateKey);
  return progress?.bestScore || 0;
}

export function hasCompletedDailyChallenge(dateKey?: string): boolean {
  const progress = getDailyProgress(dateKey);
  return progress?.completed || false;
}
