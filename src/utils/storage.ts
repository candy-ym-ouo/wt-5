import type { LeaderboardEntry, ChapterProgress, SeasonInfo, PersonalBest, ThemeProgress, GameReplayData, AchievementProgress, DailyChallengeScore, DailyChallengeProgress, CollectionEntry } from '../types/game';
import { ACHIEVEMENTS } from '../data/achievements';
import { BOOKS } from '../data/books';

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
export const COLLECTION_KEY = 'old_bookstore_collection';
export const SEEN_EVENT_TYPES_KEY = 'old_bookstore_seen_event_types';
export const TOTAL_EVENTS_TRIGGERED_KEY = 'old_bookstore_total_events_triggered';
export const TUTORIAL_COMPLETED_KEY = 'old_bookstore_tutorial_completed';
export const TUTORIAL_STEP_KEY = 'old_bookstore_tutorial_step';

const CURRENT_STORAGE_VERSION = 4;
const CURRENT_STORAGE_VERSION_EXTENDED = 5;

let _safetyCheckPerformed = false;

function _readJSON<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function _ensureSafetyCheck(): void {
  if (_safetyCheckPerformed) return;
  try {
    sanitizeLeaderboard({ removeInvalid: true, fillDefaults: true });
    sanitizePersonalBest({ fillDefaults: true });
    sanitizeAchievements({ fillDefaults: true, removeInvalid: false });
    _safetyCheckPerformed = true;
  } catch {
    _safetyCheckPerformed = true;
  }
}

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
  _ensureSafetyCheck();
  return _readJSON<LeaderboardEntry[]>(LEADERBOARD_KEY, []);
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
  _ensureSafetyCheck();
  return _readJSON<PersonalBest>(PERSONAL_BEST_KEY, getDefaultPersonalBest());
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
  _ensureSafetyCheck();
  return _readJSON<string[]>(ACHIEVEMENTS_KEY, []);
};

export const saveUnlockedAchievements = (ids: string[]): void => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
};

export const getAllAchievementProgress = (): Record<string, AchievementProgress> => {
  _ensureSafetyCheck();
  return _readJSON<Record<string, AchievementProgress>>(ACHIEVEMENTS_PROGRESS_KEY, {});
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
    
    if (entry.playerName) {
      const existingIndex = dateEntries.findIndex(e => e.playerName === entry.playerName);
      if (existingIndex >= 0) {
        const existingEntry = dateEntries[existingIndex];
        if (entry.score > existingEntry.score) {
          dateEntries[existingIndex] = entry;
        } else {
          return dateEntries.sort((a, b) => b.score - a.score).slice(0, 50);
        }
      } else {
        dateEntries.push(entry);
      }
    } else {
      dateEntries.push(entry);
    }
    
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

export function getAllCollectionEntries(): Record<string, CollectionEntry> {
  try {
    const data = localStorage.getItem(COLLECTION_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function getCollectionEntry(bookId: string): CollectionEntry | null {
  const all = getAllCollectionEntries();
  return all[bookId] || null;
}

export function updateCollectionEntry(
  bookId: string,
  score: number,
  findTime: number,
  hintsUsed: number
): CollectionEntry {
  const all = getAllCollectionEntries();
  const existing = all[bookId];
  const now = Date.now();

  const entry: CollectionEntry = existing
    ? {
        ...existing,
        bestScore: Math.max(existing.bestScore, score),
        bestScoreDate: score > existing.bestScore ? now : existing.bestScoreDate,
        fastestFind: findTime < existing.fastestFind || existing.fastestFind === 0 ? findTime : existing.fastestFind,
        fastestFindDate: (findTime < existing.fastestFind || existing.fastestFind === 0) ? now : existing.fastestFindDate,
        fewestHints: hintsUsed < existing.fewestHints ? hintsUsed : existing.fewestHints,
        fewestHintsDate: hintsUsed < existing.fewestHints ? now : existing.fewestHintsDate,
        totalTimesFound: existing.totalTimesFound + 1,
        relatedAchievements: existing.relatedAchievements,
      }
    : {
        bookId,
        firstFoundAt: now,
        bestScore: score,
        bestScoreDate: now,
        fastestFind: findTime,
        fastestFindDate: now,
        fewestHints: hintsUsed,
        fewestHintsDate: now,
        totalTimesFound: 1,
        relatedAchievements: [],
      };

  all[bookId] = entry;
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(all));
  return entry;
}

export function getUnlockedCollectionCount(): number {
  return Object.keys(getAllCollectionEntries()).length;
}

export function isBookCollected(bookId: string): boolean {
  return !!getAllCollectionEntries()[bookId];
}

export function addCollectionAchievement(bookId: string, achievementId: string): void {
  const all = getAllCollectionEntries();
  const entry = all[bookId];
  if (entry && !entry.relatedAchievements.includes(achievementId)) {
    entry.relatedAchievements = [...entry.relatedAchievements, achievementId];
    all[bookId] = entry;
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(all));
  }
}

export function getSeenEventTypes(): string[] {
  try {
    const data = localStorage.getItem(SEEN_EVENT_TYPES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSeenEventTypes(types: string[]): void {
  try {
    localStorage.setItem(SEEN_EVENT_TYPES_KEY, JSON.stringify(types));
  } catch {}
}

export function addSeenEventTypes(newTypes: string[]): void {
  const existing = getSeenEventTypes();
  const merged = [...new Set([...existing, ...newTypes])];
  saveSeenEventTypes(merged);
}

export function getTotalEventsTriggered(): number {
  try {
    const data = localStorage.getItem(TOTAL_EVENTS_TRIGGERED_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementTotalEventsTriggered(count: number): void {
  const current = getTotalEventsTriggered();
  localStorage.setItem(TOTAL_EVENTS_TRIGGERED_KEY, String(current + count));
}

export function hasCompletedTutorial(): boolean {
  try {
    const data = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    return data === 'true';
  } catch {
    return false;
  }
}

export function markTutorialCompleted(): void {
  try {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  } catch {}
}

export function getTutorialCurrentStep(): number {
  try {
    const data = localStorage.getItem(TUTORIAL_STEP_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveTutorialStep(step: number): void {
  try {
    localStorage.setItem(TUTORIAL_STEP_KEY, String(step));
  } catch {}
}

export function resetTutorial(): void {
  try {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    localStorage.removeItem(TUTORIAL_STEP_KEY);
  } catch {}
}

// ============================================================================
// 存档版本升级机制 - 核心实现
// ============================================================================

export const STORAGE_BACKUP_PREFIX = 'old_bookstore_backup_';
export const STORAGE_METADATA_KEY = 'old_bookstore_storage_metadata';

export interface StorageMetadata {
  version: number;
  lastMigratedAt: number;
  lastCleanedAt: number;
  backupVersion: number;
  corruptionCount: number;
  lastCorruptionAt?: number;
}

export interface MigrationRecord {
  fromVersion: number;
  toVersion: number;
  migrate: () => void;
  description: string;
}

export interface DataValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixed: boolean;
}

export interface SanitizeOptions {
  removeInvalid?: boolean;
  fillDefaults?: boolean;
  backupBefore?: boolean;
}

interface StorageBackup {
  version: number;
  timestamp: number;
  data: Record<string, string>;
}

const migrationRegistry: MigrationRecord[] = [];

function registerMigration(
  fromVersion: number,
  toVersion: number,
  migrate: () => void,
  description: string
): void {
  migrationRegistry.push({ fromVersion, toVersion, migrate, description });
  migrationRegistry.sort((a, b) => a.fromVersion - b.fromVersion);
}

function getStorageMetadata(): StorageMetadata {
  try {
    const data = localStorage.getItem(STORAGE_METADATA_KEY);
    if (data) {
      const metadata = JSON.parse(data) as StorageMetadata;
      if (metadata.version >= 1 && typeof metadata.lastMigratedAt === 'number') {
        return metadata;
      }
    }
  } catch {}

  try {
    const oldVersionStr = localStorage.getItem(STORAGE_VERSION_KEY);
    if (oldVersionStr) {
      const oldVersion = parseInt(oldVersionStr, 10);
      if (!isNaN(oldVersion) && oldVersion >= 1) {
        const bridgedMetadata: StorageMetadata = {
          version: oldVersion,
          lastMigratedAt: 0,
          lastCleanedAt: 0,
          backupVersion: 0,
          corruptionCount: 0,
        };
        saveStorageMetadata(bridgedMetadata);
        return bridgedMetadata;
      }
    }
  } catch {}

  const defaultMetadata: StorageMetadata = {
    version: 1,
    lastMigratedAt: 0,
    lastCleanedAt: 0,
    backupVersion: 0,
    corruptionCount: 0,
  };
  return defaultMetadata;
}

function saveStorageMetadata(metadata: StorageMetadata): void {
  try {
    localStorage.setItem(STORAGE_METADATA_KEY, JSON.stringify(metadata));
  } catch {}
}

function createBackup(version: number): void {
  try {
    const metadata = getStorageMetadata();
    const backupData: Record<string, string> = {};
    
    const allKeys = Object.values({
      LEADERBOARD_KEY, ACHIEVEMENTS_KEY, ACHIEVEMENTS_PROGRESS_KEY,
      GAME_STATS_KEY, CHAPTER_PROGRESS_KEY, CURRENT_CHAPTER_KEY,
      SEASON_KEY, PERSONAL_BEST_KEY, THEME_PROGRESS_KEY, THEME_REWARDS_KEY,
      CURRENT_THEME_KEY, STREAK_KEY, GAME_REPLAY_KEY, LAST_GAME_REPLAY_KEY,
      DAILY_CHALLENGE_LEADERBOARD_KEY, DAILY_CHALLENGE_PROGRESS_KEY,
      COLLECTION_KEY, SEEN_EVENT_TYPES_KEY, TOTAL_EVENTS_TRIGGERED_KEY,
      TUTORIAL_COMPLETED_KEY, TUTORIAL_STEP_KEY,
    });

    for (const key of allKeys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        backupData[key] = value;
      }
    }

    const backup: StorageBackup = {
      version,
      timestamp: Date.now(),
      data: backupData,
    };

    const backupKey = `${STORAGE_BACKUP_PREFIX}${metadata.backupVersion + 1}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    metadata.backupVersion += 1;
    const maxBackups = 3;
    if (metadata.backupVersion > maxBackups) {
      const oldBackupKey = `${STORAGE_BACKUP_PREFIX}${metadata.backupVersion - maxBackups}`;
      localStorage.removeItem(oldBackupKey);
    }

    saveStorageMetadata(metadata);
  } catch {}
}

function restoreFromBackup(backupVersion?: number): boolean {
  try {
    const metadata = getStorageMetadata();
    const targetVersion = backupVersion ?? metadata.backupVersion;
    
    if (targetVersion <= 0) return false;

    const backupKey = `${STORAGE_BACKUP_PREFIX}${targetVersion}`;
    const backupData = localStorage.getItem(backupKey);
    
    if (!backupData) return false;

    const backup: StorageBackup = JSON.parse(backupData);
    
    for (const [key, value] of Object.entries(backup.data)) {
      localStorage.setItem(key, value);
    }

    return true;
  } catch {
    return false;
  }
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key] as Record<string, any>, source[key] as Record<string, any>) as T[Extract<keyof T, string>];
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }
  return result;
}

function getDefaultPersonalBest(): PersonalBest {
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

function getDefaultAchievementProgress(achievementId: string): AchievementProgress {
  return {
    achievementId,
    currentProgress: 0,
    unlockedStages: [],
    stageUnlockTimes: {},
  };
}



function validateLeaderboardEntry(entry: unknown): { valid: boolean; entry?: LeaderboardEntry } {
  if (!entry || typeof entry !== 'object') return { valid: false };
  
  const e = entry as Record<string, unknown>;
  
  if (typeof e.score !== 'number' || e.score < 0) return { valid: false };
  if (typeof e.date !== 'number' || e.date <= 0) return { valid: false };
  if (typeof e.id !== 'string' || e.id.length === 0) return { valid: false };
  
  const validEntry: LeaderboardEntry = {
    id: e.id,
    playerName: typeof e.playerName === 'string' ? e.playerName : '匿名玩家',
    score: e.score,
    timeUsed: typeof e.timeUsed === 'number' ? Math.max(0, e.timeUsed) : 0,
    hintsUsed: typeof e.hintsUsed === 'number' ? Math.max(0, e.hintsUsed) : 0,
    date: e.date,
    seasonId: typeof e.seasonId === 'string' ? e.seasonId : undefined,
    weekNumber: typeof e.weekNumber === 'number' ? e.weekNumber : undefined,
    difficulty: typeof e.difficulty === 'string' ? e.difficulty as any : undefined,
    streak: typeof e.streak === 'number' ? Math.max(0, e.streak) : undefined,
    bestStreak: typeof e.bestStreak === 'number' ? Math.max(0, e.bestStreak) : undefined,
    replayId: typeof e.replayId === 'string' ? e.replayId : undefined,
  };

  return { valid: true, entry: validEntry };
}

function validateAchievementProgress(progress: unknown, achievementId: string): { valid: boolean; progress?: AchievementProgress } {
  if (!progress || typeof progress !== 'object') return { valid: false };
  
  const p = progress as Record<string, unknown>;
  
  const validProgress: AchievementProgress = {
    achievementId,
    currentProgress: typeof p.currentProgress === 'number' ? Math.max(0, p.currentProgress) : 0,
    unlockedStages: Array.isArray(p.unlockedStages) ? p.unlockedStages.filter(s => typeof s === 'string') : [],
    unlockedAt: typeof p.unlockedAt === 'number' ? p.unlockedAt : undefined,
    completedAt: typeof p.completedAt === 'number' ? p.completedAt : undefined,
    stageUnlockTimes: typeof p.stageUnlockTimes === 'object' && p.stageUnlockTimes !== null
      ? p.stageUnlockTimes as Record<string, number>
      : {},
  };

  return { valid: true, progress: validProgress };
}

function validatePersonalBest(pb: unknown): { valid: boolean; pb?: PersonalBest } {
  if (!pb || typeof pb !== 'object') {
    return { valid: true, pb: getDefaultPersonalBest() };
  }
  
  const p = pb as Record<string, unknown>;
  const defaultPb = getDefaultPersonalBest();
  
  const validPb: PersonalBest = {
    highestScore: typeof p.highestScore === 'number' ? Math.max(0, p.highestScore) : defaultPb.highestScore,
    highestScoreDate: typeof p.highestScoreDate === 'number' ? Math.max(0, p.highestScoreDate) : defaultPb.highestScoreDate,
    totalGamesPlayed: typeof p.totalGamesPlayed === 'number' ? Math.max(0, p.totalGamesPlayed) : defaultPb.totalGamesPlayed,
    totalBooksFound: typeof p.totalBooksFound === 'number' ? Math.max(0, p.totalBooksFound) : defaultPb.totalBooksFound,
    fastestFind: typeof p.fastestFind === 'number' ? Math.max(0, p.fastestFind) : defaultPb.fastestFind,
    fastestFindDate: typeof p.fastestFindDate === 'number' ? Math.max(0, p.fastestFindDate) : defaultPb.fastestFindDate,
    fewestHintsScore: typeof p.fewestHintsScore === 'number' ? Math.max(0, p.fewestHintsScore) : defaultPb.fewestHintsScore,
    fewestHintsDate: typeof p.fewestHintsDate === 'number' ? Math.max(0, p.fewestHintsDate) : defaultPb.fewestHintsDate,
    fewestHintsCount: typeof p.fewestHintsCount === 'number' ? p.fewestHintsCount : defaultPb.fewestHintsCount,
    longestStreak: typeof p.longestStreak === 'number' ? Math.max(0, p.longestStreak) : defaultPb.longestStreak,
    longestStreakDate: typeof p.longestStreakDate === 'number' ? Math.max(0, p.longestStreakDate) : defaultPb.longestStreakDate,
    weeklyBestScores: typeof p.weeklyBestScores === 'object' && p.weeklyBestScores !== null
      ? p.weeklyBestScores as Record<number, number>
      : defaultPb.weeklyBestScores,
    seasonBestScores: typeof p.seasonBestScores === 'object' && p.seasonBestScores !== null
      ? p.seasonBestScores as Record<string, number>
      : defaultPb.seasonBestScores,
  };

  return { valid: true, pb: validPb };
}

export function sanitizeLeaderboard(options: SanitizeOptions = {}): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    fixed: false,
  };

  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) return result;

    if (options.backupBefore) {
      createBackup(CURRENT_STORAGE_VERSION);
    }

    const entries = JSON.parse(data);
    if (!Array.isArray(entries)) {
      result.errors.push('排行榜数据格式错误：不是数组');
      if (options.removeInvalid) {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
        result.fixed = true;
      }
      return result;
    }

    const validEntries: LeaderboardEntry[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      const validation = validateLeaderboardEntry(entries[i]);
      if (validation.valid && validation.entry) {
        if (!seenIds.has(validation.entry.id)) {
          seenIds.add(validation.entry.id);
          validEntries.push(validation.entry);
        } else {
          result.warnings.push(`排行榜条目 ${i} 存在重复 ID，已跳过`);
        }
      } else {
        result.errors.push(`排行榜条目 ${i} 无效，已${options.removeInvalid ? '移除' : '保留'}`);
        result.valid = false;
      }
    }

    validEntries.sort((a, b) => b.score - a.score);
    const topFifty = validEntries.slice(0, 50);

    if (options.removeInvalid && (result.errors.length > 0 || validEntries.length !== entries.length)) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topFifty));
      result.fixed = true;
    }
  } catch (e) {
    result.errors.push(`排行榜数据解析失败：${e}`);
    result.valid = false;
    if (options.removeInvalid) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
      result.fixed = true;
    }
  }

  return result;
}

export function sanitizeAchievements(options: SanitizeOptions = {}): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    fixed: false,
  };

  try {
    const validAchievementIds = new Set(ACHIEVEMENTS.map(a => a.id));

    const unlockedData = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (unlockedData) {
      const unlocked = JSON.parse(unlockedData);
      if (Array.isArray(unlocked)) {
        const validUnlocked = unlocked.filter(id => {
          if (typeof id !== 'string') {
            result.warnings.push(`无效的成就ID类型：${typeof id}`);
            return false;
          }
          if (!validAchievementIds.has(id)) {
            result.warnings.push(`未知的成就ID：${id}`);
            return options.removeInvalid ? false : true;
          }
          return true;
        });
        if (options.removeInvalid && validUnlocked.length !== unlocked.length) {
          localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(validUnlocked));
          result.fixed = true;
        }
      } else {
        result.errors.push('已解锁成就数据格式错误');
        if (options.removeInvalid) {
          localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([]));
          result.fixed = true;
        }
      }
    }

    const progressData = localStorage.getItem(ACHIEVEMENTS_PROGRESS_KEY);
    if (progressData) {
      const progress = JSON.parse(progressData);
      if (typeof progress === 'object' && progress !== null) {
        const sanitizedProgress: Record<string, AchievementProgress> = {};
        
        for (const [id, prog] of Object.entries(progress)) {
          if (!validAchievementIds.has(id)) {
            result.warnings.push(`成就进度包含未知ID：${id}`);
            if (!options.removeInvalid) {
              const validation = validateAchievementProgress(prog, id);
              if (validation.valid && validation.progress) {
                sanitizedProgress[id] = validation.progress;
              }
            }
            continue;
          }

          const validation = validateAchievementProgress(prog, id);
          if (validation.valid && validation.progress) {
            sanitizedProgress[id] = validation.progress;
          } else {
            result.errors.push(`成就 ${id} 进度无效，已${options.fillDefaults ? '重置' : '保留'}`);
            if (options.fillDefaults) {
              sanitizedProgress[id] = getDefaultAchievementProgress(id);
            }
          }
        }

        if (options.fillDefaults || options.removeInvalid) {
          localStorage.setItem(ACHIEVEMENTS_PROGRESS_KEY, JSON.stringify(sanitizedProgress));
          result.fixed = true;
        }
      } else {
        result.errors.push('成就进度数据格式错误');
        if (options.removeInvalid) {
          localStorage.setItem(ACHIEVEMENTS_PROGRESS_KEY, JSON.stringify({}));
          result.fixed = true;
        }
      }
    }
  } catch (e) {
    result.errors.push(`成就数据解析失败：${e}`);
    result.valid = false;
  }

  return result;
}

export function sanitizePersonalBest(options: SanitizeOptions = {}): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    fixed: false,
  };

  try {
    const data = localStorage.getItem(PERSONAL_BEST_KEY);
    if (!data) {
      if (options.fillDefaults) {
        localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(getDefaultPersonalBest()));
        result.fixed = true;
      }
      return result;
    }

    const pb = JSON.parse(data);
    const validation = validatePersonalBest(pb);
    
    if (validation.valid && validation.pb) {
      if (options.fillDefaults) {
        localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(validation.pb));
        result.fixed = true;
      }
    } else {
      result.errors.push('个人最佳数据无效');
      result.valid = false;
      if (options.removeInvalid) {
        localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(getDefaultPersonalBest()));
        result.fixed = true;
      }
    }
  } catch (e) {
    result.errors.push(`个人最佳数据解析失败：${e}`);
    result.valid = false;
    if (options.removeInvalid) {
      localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(getDefaultPersonalBest()));
      result.fixed = true;
    }
  }

  return result;
}

export function sanitizeCollection(options: SanitizeOptions = {}): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    fixed: false,
  };

  try {
    const data = localStorage.getItem(COLLECTION_KEY);
    if (!data) return result;

    const collection = JSON.parse(data);
    if (typeof collection !== 'object' || collection === null) {
      result.errors.push('收藏数据格式错误');
      if (options.removeInvalid) {
        localStorage.setItem(COLLECTION_KEY, JSON.stringify({}));
        result.fixed = true;
      }
      return result;
    }

    const validBookIds = new Set(BOOKS.map(b => b.id));
    const sanitized: Record<string, CollectionEntry> = {};

    for (const [bookId, entry] of Object.entries(collection)) {
      if (!validBookIds.has(bookId)) {
        result.warnings.push(`收藏包含未知书籍ID：${bookId}`);
        if (!options.removeInvalid) {
          sanitized[bookId] = entry as CollectionEntry;
        }
        continue;
      }

      if (!entry || typeof entry !== 'object') {
        result.errors.push(`收藏条目 ${bookId} 无效`);
        if (options.removeInvalid) continue;
      }

      sanitized[bookId] = entry as CollectionEntry;
    }

    if (options.removeInvalid && Object.keys(sanitized).length !== Object.keys(collection).length) {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(sanitized));
      result.fixed = true;
    }
  } catch (e) {
    result.errors.push(`收藏数据解析失败：${e}`);
    result.valid = false;
    if (options.removeInvalid) {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify({}));
      result.fixed = true;
    }
  }

  return result;
}

export function sanitizeDailyChallenge(options: SanitizeOptions = {}): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    fixed: false,
  };

  const maxRetentionDays = 30;
  const cutoffTime = Date.now() - maxRetentionDays * 24 * 60 * 60 * 1000;

  try {
    const leaderboardData = localStorage.getItem(DAILY_CHALLENGE_LEADERBOARD_KEY);
    if (leaderboardData) {
      const leaderboard = JSON.parse(leaderboardData);
      if (typeof leaderboard === 'object' && leaderboard !== null) {
        const sanitized: Record<string, DailyChallengeScore[]> = {};
        let cleaned = false;

        for (const [dateKey, entries] of Object.entries(leaderboard)) {
          const dateParts = dateKey.split('-').map(Number);
          if (dateParts.length !== 3) {
            result.warnings.push(`无效的日期键：${dateKey}`);
            cleaned = true;
            continue;
          }

          const entryDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getTime();
          if (entryDate < cutoffTime) {
            result.warnings.push(`清理过期的每日排行榜：${dateKey}`);
            cleaned = true;
            continue;
          }

          if (Array.isArray(entries)) {
            sanitized[dateKey] = entries.filter(e => {
              if (!e || typeof e !== 'object') return false;
              if (typeof e.score !== 'number' || e.score < 0) return false;
              return true;
            }).slice(0, 50);
          }
        }

        if (cleaned || options.removeInvalid) {
          localStorage.setItem(DAILY_CHALLENGE_LEADERBOARD_KEY, JSON.stringify(sanitized));
          result.fixed = true;
        }
      }
    }

    const progressData = localStorage.getItem(DAILY_CHALLENGE_PROGRESS_KEY);
    if (progressData) {
      const progress = JSON.parse(progressData);
      if (typeof progress === 'object' && progress !== null) {
        const sanitized: Record<string, DailyChallengeProgress> = {};
        let cleaned = false;

        for (const [dateKey, entry] of Object.entries(progress)) {
          const dateParts = dateKey.split('-').map(Number);
          if (dateParts.length !== 3) {
            cleaned = true;
            continue;
          }

          const entryDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getTime();
          if (entryDate < cutoffTime) {
            cleaned = true;
            continue;
          }

          sanitized[dateKey] = entry as DailyChallengeProgress;
        }

        if (cleaned || options.removeInvalid) {
          localStorage.setItem(DAILY_CHALLENGE_PROGRESS_KEY, JSON.stringify(sanitized));
          result.fixed = true;
        }
      }
    }
  } catch (e) {
    result.errors.push(`每日挑战数据解析失败：${e}`);
    result.valid = false;
  }

  return result;
}

export function sanitizeAllStorage(options: SanitizeOptions = {}): Record<string, DataValidationResult> {
  const results: Record<string, DataValidationResult> = {};

  if (options.backupBefore) {
    createBackup(CURRENT_STORAGE_VERSION);
  }

  results.leaderboard = sanitizeLeaderboard(options);
  results.achievements = sanitizeAchievements(options);
  results.personalBest = sanitizePersonalBest(options);
  results.collection = sanitizeCollection(options);
  results.dailyChallenge = sanitizeDailyChallenge(options);

  const metadata = getStorageMetadata();
  metadata.lastCleanedAt = Date.now();
  saveStorageMetadata(metadata);

  return results;
}

function detectCorruption(): boolean {
  try {
    const testKeys = [LEADERBOARD_KEY, ACHIEVEMENTS_KEY, PERSONAL_BEST_KEY];
    
    for (const key of testKeys) {
      const data = localStorage.getItem(key);
      if (data !== null) {
        try {
          JSON.parse(data);
        } catch {
          return true;
        }
      }
    }
    
    return false;
  } catch {
    return true;
  }
}

function handleCorruption(): void {
  const metadata = getStorageMetadata();
  metadata.corruptionCount += 1;
  metadata.lastCorruptionAt = Date.now();
  saveStorageMetadata(metadata);

  if (metadata.backupVersion > 0) {
    restoreFromBackup();
  }
}

function migrateFromV4ToV5(): void {
  try {
    sanitizeLeaderboard({ removeInvalid: true, fillDefaults: true });
    sanitizeAchievements({ fillDefaults: true, removeInvalid: true });
    sanitizePersonalBest({ fillDefaults: true });
    
    const existingProgress = getAllAchievementProgress();
    const allProgress: Record<string, AchievementProgress> = {};

    for (const achievement of ACHIEVEMENTS) {
      if (existingProgress[achievement.id]) {
        allProgress[achievement.id] = existingProgress[achievement.id];
      } else if (achievement.type === 'progressive') {
        allProgress[achievement.id] = getDefaultAchievementProgress(achievement.id);
      }
    }

    saveAllAchievementProgress(allProgress);

    const pb = getPersonalBest();
    const updatedPb = deepMerge(getDefaultPersonalBest(), pb);
    localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(updatedPb));
  } catch {}
}

registerMigration(1, 2, migrateFromV1ToV2, '添加赛季和周榜支持');
registerMigration(3, 4, migrateFromV3ToV4, '重构成就系统，添加进度追踪');
registerMigration(4, 5, migrateFromV4ToV5, '添加数据验证和字段扩展兼容');

export function runExtendedMigrations(): void {
  try {
    if (detectCorruption()) {
      handleCorruption();
    }

    const metadata = getStorageMetadata();
    const currentVersion = metadata.version;
    const targetVersion = CURRENT_STORAGE_VERSION_EXTENDED;

    if (currentVersion < targetVersion) {
      createBackup(currentVersion);
    }

    const migrationsToRun = migrationRegistry.filter(
      m => m.fromVersion >= currentVersion && m.toVersion <= targetVersion
    );

    for (const migration of migrationsToRun) {
      try {
        migration.migrate();
      } catch (e) {
        console.error(`迁移失败 (v${migration.fromVersion}->v${migration.toVersion}):`, e);
      }
    }

    metadata.version = targetVersion;
    metadata.lastMigratedAt = Date.now();
    saveStorageMetadata(metadata);

    try {
      localStorage.setItem(STORAGE_VERSION_KEY, String(targetVersion));
    } catch {}

    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - metadata.lastCleanedAt > oneWeek) {
      sanitizeAllStorage({ removeInvalid: true, fillDefaults: true });
      metadata.lastCleanedAt = Date.now();
      saveStorageMetadata(metadata);
    }

    _safetyCheckPerformed = true;
  } catch (e) {
    console.error('版本迁移执行失败:', e);
    _safetyCheckPerformed = true;
  }
}

export function getStorageVersionInfo(): { current: number; latest: number; needsUpgrade: boolean } {
  const metadata = getStorageMetadata();
  return {
    current: metadata.version,
    latest: CURRENT_STORAGE_VERSION_EXTENDED,
    needsUpgrade: metadata.version < CURRENT_STORAGE_VERSION_EXTENDED,
  };
}

export function repairAndRestore(): boolean {
  try {
    createBackup(getStorageMetadata().version);
    
    sanitizeAllStorage({ removeInvalid: true, fillDefaults: true, backupBefore: false });
    
    if (detectCorruption()) {
      const restored = restoreFromBackup();
      if (restored) {
        _safetyCheckPerformed = true;
      }
      return restored;
    }
    
    _safetyCheckPerformed = true;
    return true;
  } catch {
    const restored = restoreFromBackup();
    if (restored) {
      _safetyCheckPerformed = true;
    }
    return restored;
  }
}

export function exportAllData(): string {
  const data: Record<string, any> = {
    metadata: getStorageMetadata(),
    exportedAt: Date.now(),
    version: CURRENT_STORAGE_VERSION_EXTENDED,
    storage: {},
  };

  const allKeys = Object.values({
    LEADERBOARD_KEY, ACHIEVEMENTS_KEY, ACHIEVEMENTS_PROGRESS_KEY,
    GAME_STATS_KEY, CHAPTER_PROGRESS_KEY, CURRENT_CHAPTER_KEY,
    SEASON_KEY, PERSONAL_BEST_KEY, THEME_PROGRESS_KEY, THEME_REWARDS_KEY,
    CURRENT_THEME_KEY, STREAK_KEY, GAME_REPLAY_KEY, LAST_GAME_REPLAY_KEY,
    DAILY_CHALLENGE_LEADERBOARD_KEY, DAILY_CHALLENGE_PROGRESS_KEY,
    COLLECTION_KEY, SEEN_EVENT_TYPES_KEY, TOTAL_EVENTS_TRIGGERED_KEY,
    TUTORIAL_COMPLETED_KEY, TUTORIAL_STEP_KEY,
  });

  for (const key of allKeys) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        data.storage[key] = JSON.parse(value);
      } catch {
        data.storage[key] = value;
      }
    }
  }

  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.storage || typeof data.storage !== 'object') {
      return false;
    }

    createBackup(getStorageMetadata().version);

    for (const [key, value] of Object.entries(data.storage)) {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }

    sanitizeAllStorage({ removeInvalid: true, fillDefaults: true });
    return true;
  } catch {
    return false;
  }
}

export function safeGetLeaderboard(): LeaderboardEntry[] {
  return getLeaderboard();
}

export function safeGetAllAchievementProgress(): Record<string, AchievementProgress> {
  return getAllAchievementProgress();
}

export function safeGetPersonalBest(): PersonalBest {
  return getPersonalBest();
}
