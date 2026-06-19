import { createSignal } from 'solid-js';
import type { GameStore, Book, Clue, ChapterTask, DifficultyLevel, DifficultyMode, ThemeChallenge, PenaltyLevel, WrongPenaltyEvent, RoundDetail, GameReplayData, AchievementProgress, ThemeFilterJudgment, ThemeFilterResult } from '../types/game';
import { BOOKS } from '../data/books';
import { createCluesForBook, CLUE_TEMPLATES } from '../data/clues';
import { ACHIEVEMENTS } from '../data/achievements';
import { getChapterById, getNextChapter } from '../data/chapters';
import {
  getDifficultyConfig,
  selectRandomTargetByDifficulty,
  adjustDifficulty,
  calculateScoreWithDifficulty,
} from '../data/difficulty';
import {
  createInitialPowerUpState,
  getPowerUpConfig,
  calculatePowerUpPenalty,
  hasUsedAnyPowerUp,
} from '../data/powerUps';
import {
  getUnlockedAchievements,
  saveUnlockedAchievements,
  getAllAchievementProgress,
  saveAllAchievementProgress,
  incrementGamesPlayed,
  getGamesPlayed,
  getChapterProgress,
  saveChapterProgress,
  getCurrentChapterId,
  setCurrentChapterId,
  updatePersonalBest,
  runMigrations,
  isNewPersonalBest,
  getPersonalBest,
  getWeeklyLeaderboard,
  getSeasonLeaderboard,
  getThemeProgress,
  saveThemeProgress,
  getUnlockedThemeRewardIds,
  saveUnlockedThemeRewardIds,
  getSavedStreak,
  saveStreak,
  clearSavedStreak,
  saveGameReplay,
  getCurrentSeason,
  getCurrentWeekNumber,
  getPersonalBestRank,
} from '../utils/storage';
import { THEMES, getThemeById, selectBookByTheme, RARITY_CONFIG, getThemesForBook, THEME_REWARDS } from '../data/themes';
import {
  STREAK_REWARDS,
  getStreakTitle,
  getStreakReward,
  getStreakBonusMultiplier,
  calculateStreakBonusScore,
  STREAK_INHERIT_COST,
} from '../data/streaks';

const DEFAULT_DIFFICULTY: DifficultyLevel = 'normal';
const DEFAULT_DIFFICULTY_MODE: DifficultyMode = 'dynamic';

const initialStore: GameStore = {
  state: 'idle',
  score: 0,
  timeRemaining: getDifficultyConfig(DEFAULT_DIFFICULTY).gameTime,
  hintsRemaining: getDifficultyConfig(DEFAULT_DIFFICULTY).initialHints,
  hintsUsed: 0,
  currentLevel: 1,
  targetBookId: null,
  unlockedClues: [],
  unlockedAchievements: getUnlockedAchievements(),
  foundBooks: [],
  consecutiveCorrect: 0,
  currentChapterId: null,
  currentTaskIndex: 0,
  chapterScore: 0,
  chapterTimeUsed: 0,
  chapterHintsUsed: 0,
  gameMode: 'classic',
  difficultyLevel: DEFAULT_DIFFICULTY,
  difficultyMode: DEFAULT_DIFFICULTY_MODE,
  difficultyHistory: [DEFAULT_DIFFICULTY],
  roundStats: {
    findTimes: [],
    hintsUsedPerRound: [],
  },
  difficultyAdjustmentReason: null,
  showDifficultyChange: false,
  lastTimeBonus: 0,
  powerUps: createInitialPowerUpState(DEFAULT_DIFFICULTY),
  currentThemeId: null,
  themeFoundBooks: [],
  themeScore: 0,
  streak: {
    currentStreak: 0,
    bestStreak: 0,
    bestStreakDate: 0,
    streakStartTime: 0,
    totalStreakBonusScore: 0,
    currentTitleId: 'streak_newbie',
    inheritedStreak: false,
  },
  showStreakPopup: false,
  lastStreakBonus: 0,
  wrongPenalty: {
    consecutiveWrong: 0,
    currentLevel: null,
    hintFreezeUntil: 0,
    totalTimePenalty: 0,
    totalScorePenalty: 0,
    totalHintFreezes: 0,
    penaltyHistory: [],
    maxConsecutiveWrong: 0,
  },
  roundDetails: [],
  currentRoundWrongPicks: [],
  themeFilter: {
    active: false,
    displayThemeId: null,
    isGenuine: false,
    usedThisRound: false,
    judgment: null,
    activationCost: {
      timePenalty: 5,
      scorePenalty: 100,
    },
  },
};

export const [gameState, setGameState] = createSignal<GameStore>(initialStore);
export const [currentClues, setCurrentClues] = createSignal<Clue[]>([]);
export const [targetBook, setTargetBook] = createSignal<Book | null>(null);
export const [showAchievementPopup, setShowAchievementPopup] = createSignal<string | null>(null);
export const [lastFindTime, setLastFindTime] = createSignal(0);
export const [roundStartTime, setRoundStartTime] = createSignal(0);
export const [foundGenres, setFoundGenres] = createSignal<string[]>([]);
export const [gameStartTime, setGameStartTime] = createSignal(0);
export const [lastRoundScore, setLastRoundScore] = createSignal(0);
export const [lastRoundStreakBonus, setLastRoundStreakBonus] = createSignal(0);

runMigrations();
export const [gamesPlayed, setGamesPlayed] = createSignal(getGamesPlayed());
export const [currentTask, setCurrentTask] = createSignal<ChapterTask | null>(null);
export const [chapterTasks, setChapterTasks] = createSignal<ChapterTask[]>([]);
export const [currentTheme, setCurrentTheme] = createSignal<ThemeChallenge | null>(null);
export const [showThemeRewardPopup, setShowThemeRewardPopup] = createSignal<string | null>(null);
export const [themeHintsUsed, setThemeHintsUsed] = createSignal(0);
export const [showWrongWarning, setShowWrongWarning] = createSignal<PenaltyLevel | null>(null);
export const [lastPenaltyInfo, setLastPenaltyInfo] = createSignal<WrongPenaltyEvent | null>(null);
export const [achievementProgress, setAchievementProgress] = createSignal<Record<string, AchievementProgress>>(getAllAchievementProgress());
export const [themeFilterResult, setThemeFilterResult] = createSignal<ThemeFilterResult | null>(null);
export const [showThemeFilterHint, setShowThemeFilterHint] = createSignal(false);

let timerInterval: number | null = null;

interface PausableTimer {
  id: number;
  startTime: number;
  duration: number;
  callback: () => void;
  paused: boolean;
  remainingTime: number;
}

const activeTimers = new Map<string, PausableTimer>();

const setPausableTimeout = (key: string, callback: () => void, duration: number): number => {
  const existingTimer = activeTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer.id);
  }

  const timerId = window.setTimeout(() => {
    callback();
    activeTimers.delete(key);
  }, duration);

  activeTimers.set(key, {
    id: timerId,
    startTime: Date.now(),
    duration,
    callback,
    paused: false,
    remainingTime: duration,
  });

  return timerId;
};

const pauseAllTimers = () => {
  const now = Date.now();
  activeTimers.forEach((timer) => {
    if (!timer.paused) {
      const elapsed = now - timer.startTime;
      timer.remainingTime = Math.max(0, timer.duration - elapsed);
      timer.paused = true;
      clearTimeout(timer.id);
    }
  });
};

const resumeAllTimers = () => {
  activeTimers.forEach((timer, timerKey) => {
    if (timer.paused) {
      timer.startTime = Date.now();
      timer.duration = timer.remainingTime;
      timer.paused = false;
      timer.id = window.setTimeout(() => {
        timer.callback();
        activeTimers.delete(timerKey);
      }, timer.remainingTime);
    }
  });
};

const clearAllTimers = () => {
  activeTimers.forEach((timer) => {
    clearTimeout(timer.id);
  });
  activeTimers.clear();
};

export const setDifficulty = (level: DifficultyLevel, mode: DifficultyMode = 'dynamic') => {
  const config = getDifficultyConfig(level);
  setGameState(prev => ({
    ...prev,
    difficultyLevel: level,
    difficultyMode: mode,
    difficultyHistory: [level],
    timeRemaining: config.gameTime,
    hintsRemaining: config.initialHints,
    powerUps: createInitialPowerUpState(level),
  }));
};

const updateProgressiveAchievement = (
  achievementId: string,
  progressValue: number
): { newStages: string[]; completed: boolean } => {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement || achievement.type !== 'progressive' || !achievement.stages) {
    return { newStages: [], completed: false };
  }

  const allProgress = achievementProgress();
  let progress = allProgress[achievementId] || {
    achievementId,
    currentProgress: 0,
    unlockedStages: [],
    stageUnlockTimes: {},
  };

  const newProgress = Math.min(progressValue, achievement.maxProgress || progressValue);
  if (newProgress <= progress.currentProgress) {
    return { newStages: [], completed: false };
  }

  const newUnlockedStages: string[] = [];
  const now = Date.now();
  const stageUnlockTimes = { ...(progress.stageUnlockTimes || {}) };

  for (const stage of achievement.stages) {
    if (newProgress >= stage.threshold && !progress.unlockedStages.includes(stage.id)) {
      newUnlockedStages.push(stage.id);
      stageUnlockTimes[stage.id] = now;
    }
  }

  const isCompleted = achievement.stages.length > 0 &&
    newProgress >= achievement.stages[achievement.stages.length - 1].threshold;

  const updatedProgress: AchievementProgress = {
    ...progress,
    currentProgress: newProgress,
    unlockedStages: [...progress.unlockedStages, ...newUnlockedStages],
    stageUnlockTimes,
    unlockedAt: progress.unlockedAt || (newUnlockedStages.length > 0 ? now : undefined),
    completedAt: isCompleted && !progress.completedAt ? now : progress.completedAt,
  };

  const newAllProgress = { ...allProgress, [achievementId]: updatedProgress };
  setAchievementProgress(newAllProgress);
  saveAllAchievementProgress(newAllProgress);

  return { newStages: newUnlockedStages, completed: isCompleted };
};

const unlockSingleAchievement = (achievementId: string): boolean => {
  const state = gameState();
  if (state.unlockedAchievements.includes(achievementId)) {
    return false;
  }

  const now = Date.now();
  const allProgress = achievementProgress();
  const progress: AchievementProgress = {
    achievementId,
    currentProgress: 1,
    unlockedStages: [],
    unlockedAt: now,
    completedAt: now,
  };

  const newAllProgress = { ...allProgress, [achievementId]: progress };
  setAchievementProgress(newAllProgress);
  saveAllAchievementProgress(newAllProgress);

  const newUnlocked = [...state.unlockedAchievements, achievementId];
  setGameState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
  saveUnlockedAchievements(newUnlocked);

  return true;
};

export const checkAchievements = () => {
  const state = gameState();
  const unlocked = [...state.unlockedAchievements];
  let newAchievement: string | null = null;

  if (state.foundBooks.length >= 1 && !unlocked.includes('first_book')) {
    if (unlockSingleAchievement('first_book')) {
      newAchievement = 'first_book';
    }
  }

  const pb = getPersonalBest();
  const bookwormResult = updateProgressiveAchievement('bookworm', pb.totalBooksFound);
  if (bookwormResult.newStages.length > 0 && !unlocked.includes('bookworm')) {
    const newUnlocked = [...unlocked, 'bookworm'];
    setGameState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
    saveUnlockedAchievements(newUnlocked);
    newAchievement = 'bookworm';
  }

  if (lastFindTime() <= 30 && lastFindTime() > 0 && !unlocked.includes('speed_reader')) {
    if (unlockSingleAchievement('speed_reader')) {
      newAchievement = 'speed_reader';
    }
  }

  if (state.hintsUsed === 0 && 
      state.foundBooks.length >= 1 && 
      !hasUsedAnyPowerUp(state.powerUps.powerUpsUsedTotal) && 
      !unlocked.includes('no_hints')) {
    if (unlockSingleAchievement('no_hints')) {
      newAchievement = 'no_hints';
    }
  }

  const allCluesUnlocked = currentClues().every(c => c.unlocked);
  if (allCluesUnlocked && state.foundBooks.length > 0 && !unlocked.includes('clue_collector')) {
    if (unlockSingleAchievement('clue_collector')) {
      newAchievement = 'clue_collector';
    }
  }

  if (state.foundBooks.length >= 3 && !unlocked.includes('perfect_round')) {
    if (unlockSingleAchievement('perfect_round')) {
      newAchievement = 'perfect_round';
    }
  }

  if (state.timeRemaining > 60 && state.state === 'won' && !unlocked.includes('time_master')) {
    if (unlockSingleAchievement('time_master')) {
      newAchievement = 'time_master';
    }
  }

  if (foundGenres().includes('历史') && !unlocked.includes('history_buff')) {
    if (unlockSingleAchievement('history_buff')) {
      newAchievement = 'history_buff';
    }
  }

  if (foundGenres().includes('科幻') && !unlocked.includes('sci_fi_fan')) {
    if (unlockSingleAchievement('sci_fi_fan')) {
      newAchievement = 'sci_fi_fan';
    }
  }

  const veteranResult = updateProgressiveAchievement('veteran', gamesPlayed());
  if (veteranResult.newStages.length > 0 && !unlocked.includes('veteran')) {
    const newUnlocked = [...unlocked, 'veteran'];
    setGameState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
    saveUnlockedAchievements(newUnlocked);
    newAchievement = 'veteran';
  }

  if (state.gameMode === 'chapter' && !unlocked.includes('chapter_starter')) {
    if (unlockSingleAchievement('chapter_starter')) {
      newAchievement = 'chapter_starter';
    }
  }

  if (state.difficultyLevel === 'hard' && state.foundBooks.length >= 1 && !unlocked.includes('hard_book')) {
    if (unlockSingleAchievement('hard_book')) {
      newAchievement = 'hard_book';
    }
  }

  if (state.difficultyLevel === 'expert' && state.foundBooks.length >= 1 && !unlocked.includes('expert_book')) {
    if (unlockSingleAchievement('expert_book')) {
      newAchievement = 'expert_book';
    }
  }

  if (state.difficultyLevel === 'master' && state.foundBooks.length >= 1 && !unlocked.includes('master_book')) {
    if (unlockSingleAchievement('master_book')) {
      newAchievement = 'master_book';
    }
  }

  if (state.difficultyHistory.length >= 3 && !unlocked.includes('difficulty_climber')) {
    const levels = state.difficultyHistory;
    const levelOrder = ['easy', 'normal', 'hard', 'expert', 'master'];
    let maxLevel = 0;
    for (const l of levels) {
      const idx = levelOrder.indexOf(l);
      if (idx > maxLevel) maxLevel = idx;
    }
    if (maxLevel >= 2) {
      if (unlockSingleAchievement('difficulty_climber')) {
        newAchievement = 'difficulty_climber';
      }
    }
  }

  if (state.difficultyMode === 'dynamic' && !unlocked.includes('dynamic_adapter')) {
    const uniqueLevels = [...new Set(state.difficultyHistory)];
    if (uniqueLevels.length >= 3) {
      if (unlockSingleAchievement('dynamic_adapter')) {
        newAchievement = 'dynamic_adapter';
      }
    }
  }

  if (state.difficultyLevel === 'master' && 
      state.hintsUsed === 0 && 
      state.foundBooks.length >= 1 && 
      !hasUsedAnyPowerUp(state.powerUps.powerUpsUsedTotal) && 
      !unlocked.includes('master_no_hints')) {
    if (unlockSingleAchievement('master_no_hints')) {
      newAchievement = 'master_no_hints';
    }
  }

  const pbFlags = isNewPersonalBest(state.score);
  if (pbFlags.score && !unlocked.includes('personal_best_score')) {
    if (unlockSingleAchievement('personal_best_score')) {
      newAchievement = 'personal_best_score';
    }
  }

  const pb2 = getPersonalBest();
  if (pb2.fastestFind > 0 && pb2.fastestFind < 10 && !unlocked.includes('speed_demon')) {
    if (unlockSingleAchievement('speed_demon')) {
      newAchievement = 'speed_demon';
    }
  }

  if ((state.state === 'won' || state.state === 'lost') && 
      state.gameMode === 'classic' && 
      state.foundBooks.length >= 1 && 
      !unlocked.includes('season_starter')) {
    if (unlockSingleAchievement('season_starter')) {
      newAchievement = 'season_starter';
    }
  }

  const weeklyEntries = getWeeklyLeaderboard();
  const seasonEntries = getSeasonLeaderboard();

  if (weeklyEntries.length > 0 && !unlocked.includes('weekly_champion')) {
    const topWeeklyScore = weeklyEntries[0].score;
    if (state.score >= topWeeklyScore && state.score > 0) {
      if (unlockSingleAchievement('weekly_champion')) {
        newAchievement = 'weekly_champion';
      }
    }
  }

  if (seasonEntries.length > 0 && !unlocked.includes('season_top3')) {
    const sortedSeason = [...seasonEntries].sort((a, b) => b.score - a.score);
    const top3Scores = sortedSeason.slice(0, 3).map(e => e.score);
    if (state.score > 0 && (sortedSeason.length < 3 || state.score >= top3Scores[top3Scores.length - 1])) {
      if (unlockSingleAchievement('season_top3')) {
        newAchievement = 'season_top3';
      }
    }
  }

  const usedPowerUps = state.powerUps.powerUpsUsedTotal;
  if (hasUsedAnyPowerUp(usedPowerUps) && !unlocked.includes('powerup_first')) {
    if (unlockSingleAchievement('powerup_first')) {
      newAchievement = 'powerup_first';
    }
  }

  if (usedPowerUps.freeHints > 0 && usedPowerUps.timePeeks > 0 && usedPowerUps.eliminateWrongs > 0 && !unlocked.includes('powerup_collector')) {
    if (unlockSingleAchievement('powerup_collector')) {
      newAchievement = 'powerup_collector';
    }
  }

  if (usedPowerUps.timePeeks >= 5 && !unlocked.includes('peek_master')) {
    if (unlockSingleAchievement('peek_master')) {
      newAchievement = 'peek_master';
    }
  }

  if (usedPowerUps.eliminateWrongs >= 5 && !unlocked.includes('elimination_expert')) {
    if (unlockSingleAchievement('elimination_expert')) {
      newAchievement = 'elimination_expert';
    }
  }

  if (usedPowerUps.freeHints >= 10 && !unlocked.includes('free_hint_saver')) {
    if (unlockSingleAchievement('free_hint_saver')) {
      newAchievement = 'free_hint_saver';
    }
  }

  if ((state.state === 'won' || state.state === 'lost' || state.state === 'chapter_complete') &&
      state.foundBooks.length >= 1 &&
      !hasUsedAnyPowerUp(usedPowerUps) &&
      !unlocked.includes('purist')) {
    if (unlockSingleAchievement('purist')) {
      newAchievement = 'purist';
    }
  }

  if (newAchievement) {
    const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
    if (ach) {
      setShowAchievementPopup(ach.title);
      setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
    }
  }
};

const checkStreakAchievements = (
  currentStreak: number
) => {
  const state = gameState();
  const unlocked = [...state.unlockedAchievements];
  let newAchievement: string | null = null;

  const pb = getPersonalBest();
  const bestStreak = Math.max(currentStreak, pb.longestStreak);
  const streakResult = updateProgressiveAchievement('streak_master', bestStreak);
  
  if (streakResult.newStages.length > 0 && !unlocked.includes('streak_master')) {
    const newUnlocked = [...unlocked, 'streak_master'];
    setGameState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
    saveUnlockedAchievements(newUnlocked);
    newAchievement = 'streak_master';
  }

  if (newAchievement) {
    const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
    if (ach) {
      setShowAchievementPopup(ach.title);
      setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
    }
  }
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    setGameState(prev => {
      if (prev.state !== 'playing') return prev;
      const newTime = prev.timeRemaining - 1;
      if (newTime <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        setTimeout(() => {
          if (gameState().gameMode === 'chapter') {
            saveChapterProgressState();
          }
          updatePersonalBest({
            score: gameState().score,
            booksFound: gameState().foundBooks.length,
            findTime: lastFindTime(),
            hintsUsed: gameState().hintsUsed,
            consecutiveCorrect: gameState().consecutiveCorrect,
          });
          checkAchievements();
          saveCurrentStreak();
        }, 0);
        return { ...prev, timeRemaining: 0, state: 'lost' };
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, 1000);
};

const saveCurrentStreak = () => {
  const state = gameState();
  if (state.streak.currentStreak > 0 && state.gameMode === 'classic') {
    saveStreak({
      currentStreak: state.streak.currentStreak,
      bestStreak: state.streak.bestStreak,
      bestStreakDate: state.streak.bestStreakDate,
      currentTitleId: state.streak.currentTitleId || 'streak_newbie',
      lastScore: state.score,
      lastDifficulty: state.difficultyLevel,
      savedAt: Date.now(),
    });
  }
};

const setupRound = (book: Book) => {
  const state = gameState();
  const config = getDifficultyConfig(state.difficultyLevel);
  const clues = createCluesForBook(book.id);

  if (config.clueUnlockOrder) {
    const orderedClues = config.clueUnlockOrder.map((type, index) => {
      const clue = clues.find(c => c.type === type);
      if (clue) {
        return {
          ...clue,
          order: index + 1,
          unlocked: index === 0,
          id: `${book.id}-clue-${index + 1}`,
        };
      }
      return null;
    }).filter(Boolean) as Clue[];

    if (orderedClues.length > 0) {
      const firstClue = orderedClues[0];
      let firstClueContent = firstClue.content;
      switch (firstClue.type) {
        case 'year':
          firstClueContent = CLUE_TEMPLATES.year(book.year);
          break;
        case 'author':
          firstClueContent = CLUE_TEMPLATES.author(book.author);
          break;
        case 'genre':
          firstClueContent = CLUE_TEMPLATES.genre(book.genre);
          break;
        case 'shelf':
          firstClueContent = CLUE_TEMPLATES.shelf(book.shelf);
          break;
        case 'title':
          firstClueContent = CLUE_TEMPLATES.title(book.title);
          break;
        case 'description':
          firstClueContent = CLUE_TEMPLATES.description(book.description);
          break;
      }
      orderedClues[0] = { ...firstClue, content: firstClueContent };
      setCurrentClues(orderedClues);
    } else {
      const firstClueContent = CLUE_TEMPLATES.year(book.year);
      clues[0].content = firstClueContent;
      setCurrentClues(clues);
    }
  } else {
    const firstClueContent = CLUE_TEMPLATES.year(book.year);
    clues[0].content = firstClueContent;
    setCurrentClues(clues);
  }

  setTargetBook(book);
  setRoundStartTime(Date.now());
  setThemeFilterResult(null);

  initializeThemeFilterForBook(book);
};

const initializeThemeFilterForBook = (book: Book) => {
  const state = gameState();

  const genuineChance = Math.max(0.3, 0.7 - (['easy', 'normal', 'hard', 'expert', 'master'].indexOf(state.difficultyLevel) * 0.1));
  const isGenuine = Math.random() < genuineChance;

  let displayThemeId: string | null = null;
  const bookThemes = getThemesForBook(book.id);

  if (isGenuine && bookThemes.length > 0) {
    const selectedTheme = bookThemes[Math.floor(Math.random() * bookThemes.length)];
    displayThemeId = selectedTheme.id;
  } else {
    const fakeThemes = THEMES.filter(t => !bookThemes.some(bt => bt.id === t.id));
    if (fakeThemes.length > 0) {
      const selectedFakeTheme = fakeThemes[Math.floor(Math.random() * fakeThemes.length)];
      displayThemeId = selectedFakeTheme.id;
    } else if (bookThemes.length > 0) {
      displayThemeId = bookThemes[0].id;
    }
  }

  const costMultiplier = ['easy', 'normal', 'hard', 'expert', 'master'].indexOf(state.difficultyLevel) + 1;

  setGameState(prev => ({
    ...prev,
    themeFilter: {
      active: false,
      displayThemeId,
      isGenuine,
      usedThisRound: false,
      judgment: null,
      activationCost: {
        timePenalty: Math.floor(3 + costMultiplier * 1),
        scorePenalty: Math.floor(50 + costMultiplier * 30),
      },
    },
  }));
};

export const getThemeFilterInfo = () => {
  const state = gameState();
  const tf = state.themeFilter;
  const displayTheme = tf.displayThemeId ? getThemeById(tf.displayThemeId) : null;
  return {
    ...tf,
    displayTheme,
  };
};

export const activateThemeFilter = () => {
  const state = gameState();
  if (state.state !== 'playing') return false;
  if (state.themeFilter.active || state.themeFilter.usedThisRound) return false;
  if (state.themeFilter.displayThemeId === null) return false;

  const cost = state.themeFilter.activationCost;

  setGameState(prev => ({
    ...prev,
    timeRemaining: Math.max(prev.timeRemaining - cost.timePenalty, 0),
    score: Math.max(prev.score - cost.scorePenalty, 0),
    themeFilter: {
      ...prev.themeFilter,
      active: true,
      usedThisRound: true,
    },
  }));

  setShowThemeFilterHint(true);
  setPausableTimeout('themeFilterHint', () => setShowThemeFilterHint(false), 3000);

  return true;
};

export const judgeThemeFilter = (judgment: ThemeFilterJudgment) => {
  const state = gameState();
  if (state.state !== 'playing') return;
  if (!state.themeFilter.usedThisRound) return;
  if (state.themeFilter.judgment !== null) return;

  setGameState(prev => ({
    ...prev,
    themeFilter: {
      ...prev.themeFilter,
      judgment,
    },
  }));
};

const calculateThemeFilterCompensation = (): ThemeFilterResult => {
  const state = gameState();
  const tf = state.themeFilter;
  const diffLevel = ['easy', 'normal', 'hard', 'expert', 'master'].indexOf(state.difficultyLevel);

  if (!tf.usedThisRound) {
    return {
      judgmentCorrect: true,
      compensationScore: Math.floor(80 + diffLevel * 40),
      bonusMultiplier: 1 + diffLevel * 0.05,
      details: `谨慎判断，不使用分类提示 +${Math.floor(80 + diffLevel * 40)}分`,
    };
  }

  if (tf.judgment === null) {
    return {
      judgmentCorrect: false,
      compensationScore: -tf.activationCost.scorePenalty,
      bonusMultiplier: 0.9,
      details: `使用但未判断真伪，扣除启用成本`,
    };
  }

  const judgedCorrect = (tf.judgment === 'trusted' && tf.isGenuine) ||
                       (tf.judgment === 'distrusted' && !tf.isGenuine);

  if (judgedCorrect) {
    const bonusScore = Math.floor(150 + diffLevel * 80);
    const bonusMult = 1 + 0.1 + diffLevel * 0.08;
    return {
      judgmentCorrect: true,
      compensationScore: bonusScore,
      bonusMultiplier: bonusMult,
      details: `正确判断真伪！+${bonusScore}分，得分倍率 x${bonusMult.toFixed(2)}`,
    };
  } else {
    const penaltyScore = Math.floor(100 + diffLevel * 50);
    return {
      judgmentCorrect: false,
      compensationScore: -penaltyScore,
      bonusMultiplier: 0.85,
      details: `判断错误，被干扰！-${penaltyScore}分，得分倍率 x0.85`,
    };
  }
};

export const getThemeFilterDifficultyModifier = (): { scoreMultiplier: number; description: string } => {
  const state = gameState();
  const tf = state.themeFilter;

  if (!tf.usedThisRound) {
    return {
      scoreMultiplier: 1.1,
      description: '未使用分类提示，难度加成 +10%',
    };
  }

  if (tf.judgment === null) {
    return {
      scoreMultiplier: 0.95,
      description: '使用但未判断真伪，难度减免 -5%',
    };
  }

  const judgedCorrect = (tf.judgment === 'trusted' && tf.isGenuine) ||
                       (tf.judgment === 'distrusted' && !tf.isGenuine);

  if (judgedCorrect) {
    if (tf.isGenuine) {
      return {
        scoreMultiplier: 0.85,
        description: '正确信任真实提示，难度减免 -15%',
      };
    } else {
      return {
        scoreMultiplier: 1.2,
        description: '正确识破虚假提示，难度加成 +20%',
      };
    }
  } else {
    return {
      scoreMultiplier: 0.7,
      description: '判断错误被干扰，难度减免 -30%',
    };
  }
};

export const startGame = (difficulty?: DifficultyLevel, difficultyMode?: DifficultyMode) => {
  const state = gameState();
  const diffLevel = difficulty || state.difficultyLevel;
  const diffMode = difficultyMode || state.difficultyMode;
  const config = getDifficultyConfig(diffLevel);

  const book = selectRandomTargetByDifficulty(diffLevel, []);
  setupRound(book);
  setFoundGenres([]);
  setGameStartTime(Date.now());
  
  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: config.gameTime,
    hintsRemaining: config.initialHints,
    hintsUsed: 0,
    currentLevel: 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: [],
    consecutiveCorrect: 0,
    gameMode: 'classic',
    currentChapterId: null,
    currentTaskIndex: 0,
    chapterScore: 0,
    chapterTimeUsed: 0,
    chapterHintsUsed: 0,
    difficultyLevel: diffLevel,
    difficultyMode: diffMode,
    difficultyHistory: [diffLevel],
    roundStats: {
      findTimes: [],
      hintsUsedPerRound: [],
    },
    roundDetails: [],
    currentRoundWrongPicks: [],
    difficultyAdjustmentReason: null,
    showDifficultyChange: false,
    lastTimeBonus: 0,
    powerUps: createInitialPowerUpState(diffLevel),
  }));

  startTimer();
};

export const startGameWithStreak = (inheritStreak: boolean = false) => {
  const savedStreak = getSavedStreak();
  
  if (inheritStreak && savedStreak && savedStreak.currentStreak > 0) {
    const diffLevel = savedStreak.lastDifficulty as DifficultyLevel || DEFAULT_DIFFICULTY;
    const diffMode: DifficultyMode = 'dynamic';
    const config = getDifficultyConfig(diffLevel);

    const book = selectRandomTargetByDifficulty(diffLevel, []);
    setupRound(book);
    setFoundGenres([]);
    setGameStartTime(Date.now());
    
    const newGamesPlayed = incrementGamesPlayed();
    setGamesPlayed(newGamesPlayed);

    const initialScore = Math.floor(savedStreak.lastScore * (1 - STREAK_INHERIT_COST.scorePenaltyPercent / 100));
    const initialTime = Math.floor(config.gameTime * (1 - STREAK_INHERIT_COST.timePenaltyPercent / 100));

    const streakTitle = getStreakTitle(savedStreak.currentStreak);

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      score: initialScore,
      timeRemaining: initialTime,
      hintsRemaining: config.initialHints,
      hintsUsed: 0,
      currentLevel: 1,
      targetBookId: book.id,
      unlockedClues: [currentClues()[0]?.id || ''],
      foundBooks: [],
      consecutiveCorrect: 0,
      gameMode: 'classic',
      currentChapterId: null,
      currentTaskIndex: 0,
      chapterScore: 0,
      chapterTimeUsed: 0,
      chapterHintsUsed: 0,
      difficultyLevel: diffLevel,
      difficultyMode: diffMode,
      difficultyHistory: [diffLevel],
      roundStats: {
        findTimes: [],
        hintsUsedPerRound: [],
      },
      roundDetails: [],
      currentRoundWrongPicks: [],
      difficultyAdjustmentReason: null,
      showDifficultyChange: false,
      lastTimeBonus: 0,
      powerUps: createInitialPowerUpState(diffLevel),
      streak: {
        currentStreak: savedStreak.currentStreak,
        bestStreak: Math.max(savedStreak.bestStreak, savedStreak.currentStreak),
        bestStreakDate: savedStreak.bestStreakDate,
        streakStartTime: Date.now(),
        totalStreakBonusScore: 0,
        currentTitleId: streakTitle.id,
        inheritedStreak: true,
      },
      showStreakPopup: false,
      lastStreakBonus: 0,
    }));

    if (unlockSingleAchievement('streak_inherit')) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'streak_inherit');
      if (ach) {
        setPausableTimeout('achievementPopupDelay', () => {
          setShowAchievementPopup(ach.title);
          setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
        }, 1000);
      }
    }

    clearSavedStreak();
    startTimer();
  } else {
    startGame();
  }
};

export const hasSavedStreak = (): boolean => {
  const saved = getSavedStreak();
  return saved !== null && saved.currentStreak > 0;
};

export const getSavedStreakInfo = () => {
  return getSavedStreak();
};

export const startChapterGame = (chapterId: string) => {
  const chapter = getChapterById(chapterId);
  if (!chapter) return;

  const progress = getChapterProgress(chapterId);
  const startTaskIndex = progress?.currentTaskIndex || 0;
  const tasks = chapter.tasks.map((t) => ({
    ...t,
    completed: progress?.completedTasks.includes(t.id) || false,
  }));

  setChapterTasks(tasks);

  if (startTaskIndex >= tasks.length) {
    return;
  }

  const currentTaskData = tasks[startTaskIndex];
  const book = BOOKS.find(b => b.id === currentTaskData.bookId);
  if (!book) return;

  setCurrentTask(currentTaskData);
  setupRound(book);
  setFoundGenres([]);
  setCurrentChapterId(chapterId);
  setGameStartTime(Date.now());

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  const defaultConfig = getDifficultyConfig(DEFAULT_DIFFICULTY);
  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: defaultConfig.gameTime,
    hintsRemaining: defaultConfig.initialHints,
    hintsUsed: 0,
    currentLevel: startTaskIndex + 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: progress?.completedTasks.map(tid => {
      const task = chapter.tasks.find(t => t.id === tid);
      return task?.bookId || '';
    }).filter(Boolean) || [],
    consecutiveCorrect: 0,
    gameMode: 'chapter',
    currentChapterId: chapterId,
    currentTaskIndex: startTaskIndex,
    chapterScore: progress?.totalScore || 0,
    chapterTimeUsed: progress?.totalTime || 0,
    chapterHintsUsed: progress?.totalHints || 0,
    difficultyLevel: DEFAULT_DIFFICULTY,
    difficultyMode: 'fixed',
    difficultyHistory: [DEFAULT_DIFFICULTY],
    roundStats: {
      findTimes: [],
      hintsUsedPerRound: [],
    },
    difficultyAdjustmentReason: null,
    showDifficultyChange: false,
    lastTimeBonus: 0,
    powerUps: createInitialPowerUpState(DEFAULT_DIFFICULTY),
  }));

  startTimer();
};

export const useHint = () => {
  const state = gameState();
  if (state.hintsRemaining <= 0 || state.state !== 'playing') return;
  if (isHintFrozen()) return;

  const clues = currentClues();
  const lockedClue = clues.find(c => !c.unlocked);
  
  if (!lockedClue) return;

  const book = targetBook();
  if (!book) return;

  let content = lockedClue.content;
  switch (lockedClue.type) {
    case 'year':
      content = CLUE_TEMPLATES.year(book.year);
      break;
    case 'author':
      content = CLUE_TEMPLATES.author(book.author);
      break;
    case 'genre':
      content = CLUE_TEMPLATES.genre(book.genre);
      break;
    case 'shelf':
      content = CLUE_TEMPLATES.shelf(book.shelf);
      break;
    case 'title':
      content = CLUE_TEMPLATES.title(book.title);
      break;
  }

  setCurrentClues(prev => prev.map(c => 
    c.id === lockedClue.id ? { ...c, unlocked: true, content } : c
  ));

  setGameState(prev => ({
    ...prev,
    hintsRemaining: prev.hintsRemaining - 1,
    hintsUsed: prev.hintsUsed + 1,
    unlockedClues: [...prev.unlockedClues, lockedClue.id],
  }));
};

export const useFreeHint = () => {
  const state = gameState();
  if (state.powerUps.freeHints <= 0 || state.state !== 'playing') return;
  if (isHintFrozen()) return;

  const clues = currentClues();
  const lockedClue = clues.find(c => !c.unlocked);
  
  if (!lockedClue) return;

  const book = targetBook();
  if (!book) return;

  let content = lockedClue.content;
  switch (lockedClue.type) {
    case 'year':
      content = CLUE_TEMPLATES.year(book.year);
      break;
    case 'author':
      content = CLUE_TEMPLATES.author(book.author);
      break;
    case 'genre':
      content = CLUE_TEMPLATES.genre(book.genre);
      break;
    case 'shelf':
      content = CLUE_TEMPLATES.shelf(book.shelf);
      break;
    case 'title':
      content = CLUE_TEMPLATES.title(book.title);
      break;
  }

  setCurrentClues(prev => prev.map(c => 
    c.id === lockedClue.id ? { ...c, unlocked: true, content } : c
  ));

  setGameState(prev => ({
    ...prev,
    unlockedClues: [...prev.unlockedClues, lockedClue.id],
    powerUps: {
      ...prev.powerUps,
      freeHints: prev.powerUps.freeHints - 1,
      powerUpsUsedThisRound: {
        ...prev.powerUps.powerUpsUsedThisRound,
        freeHints: prev.powerUps.powerUpsUsedThisRound.freeHints + 1,
      },
      powerUpsUsedTotal: {
        ...prev.powerUps.powerUpsUsedTotal,
        freeHints: prev.powerUps.powerUpsUsedTotal.freeHints + 1,
      },
    },
  }));
};

let peekInterval: number | null = null;

export const useTimePeek = () => {
  const state = gameState();
  if (state.powerUps.timePeeks <= 0 || state.state !== 'playing' || state.powerUps.peekActive) return;

  const config = getPowerUpConfig('time_peek');
  const duration = config.peekDuration || 8;

  if (peekInterval) {
    clearInterval(peekInterval);
  }

  const endTime = Date.now() + duration * 1000;

  setGameState(prev => ({
    ...prev,
    powerUps: {
      ...prev.powerUps,
      timePeeks: prev.powerUps.timePeeks - 1,
      peekActive: true,
      peekEndTime: endTime,
      powerUpsUsedThisRound: {
        ...prev.powerUps.powerUpsUsedThisRound,
        timePeeks: prev.powerUps.powerUpsUsedThisRound.timePeeks + 1,
      },
      powerUpsUsedTotal: {
        ...prev.powerUps.powerUpsUsedTotal,
        timePeeks: prev.powerUps.powerUpsUsedTotal.timePeeks + 1,
      },
    },
  }));

  peekInterval = window.setInterval(() => {
    const currentState = gameState();
    if (Date.now() >= currentState.powerUps.peekEndTime || !currentState.powerUps.peekActive) {
      if (peekInterval) {
        clearInterval(peekInterval);
        peekInterval = null;
      }
      setGameState(prev => ({
        ...prev,
        powerUps: {
          ...prev.powerUps,
          peekActive: false,
          peekEndTime: 0,
        },
      }));
    }
  }, 200);
};

export const getPeekTimeRemaining = (): number => {
  const state = gameState();
  if (!state.powerUps.peekActive) return 0;
  return Math.max(0, Math.ceil((state.powerUps.peekEndTime - Date.now()) / 1000));
};

export const useEliminateWrong = () => {
  const state = gameState();
  if (state.powerUps.eliminateWrongs <= 0 || state.state !== 'playing') return;

  const book = targetBook();
  if (!book) return;

  const config = getPowerUpConfig('eliminate_wrong');
  const count = config.eliminateCount || 2;

  const wrongBooks = BOOKS.filter(b => b.id !== book.id && !state.powerUps.eliminatedBookIds.includes(b.id));
  
  if (wrongBooks.length === 0) return;

  const shuffled = [...wrongBooks].sort(() => Math.random() - 0.5);
  const toEliminate = shuffled.slice(0, Math.min(count, shuffled.length));
  const eliminatedIds = toEliminate.map(b => b.id);

  setGameState(prev => ({
    ...prev,
    powerUps: {
      ...prev.powerUps,
      eliminateWrongs: prev.powerUps.eliminateWrongs - 1,
      eliminatedBookIds: [...prev.powerUps.eliminatedBookIds, ...eliminatedIds],
      powerUpsUsedThisRound: {
        ...prev.powerUps.powerUpsUsedThisRound,
        eliminateWrongs: prev.powerUps.powerUpsUsedThisRound.eliminateWrongs + 1,
      },
      powerUpsUsedTotal: {
        ...prev.powerUps.powerUpsUsedTotal,
        eliminateWrongs: prev.powerUps.powerUpsUsedTotal.eliminateWrongs + 1,
      },
    },
  }));
};

const saveChapterProgressState = () => {
  const state = gameState();
  if (state.gameMode !== 'chapter' || !state.currentChapterId) return;

  const tasks = chapterTasks();
  const completedTasks = tasks.filter(t => t.completed).map(t => t.id);
  
  const progress = {
    chapterId: state.currentChapterId,
    currentTaskIndex: state.currentTaskIndex,
    completedTasks,
    totalScore: state.chapterScore,
    totalTime: state.chapterTimeUsed,
    totalHints: state.chapterHintsUsed,
  };

  saveChapterProgress(progress as any);
  setCurrentChapterId(state.currentChapterId);
};

const completeChapter = () => {
  const state = gameState();
  const chapter = getChapterById(state.currentChapterId!);
  if (!chapter) return;

  const finalScore = state.chapterScore + chapter.bonusScore;

  const progress = {
    chapterId: state.currentChapterId!,
    currentTaskIndex: state.currentTaskIndex,
    completedTasks: chapterTasks().filter(t => t.completed).map(t => t.id),
    totalScore: finalScore,
    totalTime: state.chapterTimeUsed,
    totalHints: state.chapterHintsUsed,
    completedAt: Date.now(),
  };
  saveChapterProgress(progress as any);

  const nextChapter = getNextChapter(state.currentChapterId!);
  if (nextChapter) {
    const nextProgress = getChapterProgress(nextChapter.id);
    if (!nextProgress) {
      saveChapterProgress({
        chapterId: nextChapter.id,
        currentTaskIndex: 0,
        completedTasks: [],
        totalScore: 0,
        totalTime: 0,
        totalHints: 0,
      } as any);
    }
  }

  let newAchievement: string | null = null;

  if (!state.unlockedAchievements.includes('chapter_master')) {
    if (unlockSingleAchievement('chapter_master')) {
      newAchievement = 'chapter_master';
    }
  }

  if (state.chapterHintsUsed === 0 && 
      !hasUsedAnyPowerUp(state.powerUps.powerUpsUsedTotal) && 
      !state.unlockedAchievements.includes('perfect_chapter')) {
    if (unlockSingleAchievement('perfect_chapter')) {
      if (!newAchievement) newAchievement = 'perfect_chapter';
    }
  }

  const allChapters = [
    'chapter_literature',
    'chapter_classics', 
    'chapter_science',
    'chapter_philosophy',
    'chapter_tech'
  ];
  
  let allCompleted = true;
  for (const chId of allChapters) {
    const chProgress = getChapterProgress(chId);
    if (!chProgress?.completedAt) {
      allCompleted = false;
      break;
    }
  }
  
  if (allCompleted && !state.unlockedAchievements.includes('all_chapters')) {
    if (unlockSingleAchievement('all_chapters')) {
      if (!newAchievement) newAchievement = 'all_chapters';
    }
  }

  setGameState(prev => ({
    ...prev,
    state: 'chapter_complete',
    chapterScore: finalScore,
  }));

  if (newAchievement) {
    const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
    if (ach) {
      setPausableTimeout('achievementPopupDelay', () => {
        setShowAchievementPopup(ach.title);
        setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
      }, 500);
    }
  }
};

const calculatePenaltyForConsecutiveWrong = (
  consecutiveCount: number,
  baseTimePenalty: number,
  baseScorePenalty: number
): {
  level: PenaltyLevel;
  timePenalty: number;
  scorePenalty: number;
  hintFreeze: boolean;
  hintFreezeDuration: number;
} => {
  if (consecutiveCount <= 1) {
    return {
      level: 'warning',
      timePenalty: baseTimePenalty,
      scorePenalty: baseScorePenalty,
      hintFreeze: false,
      hintFreezeDuration: 0,
    };
  } else if (consecutiveCount === 2) {
    return {
      level: 'caution',
      timePenalty: Math.floor(baseTimePenalty * 1.5),
      scorePenalty: Math.floor(baseScorePenalty * 1.5),
      hintFreeze: false,
      hintFreezeDuration: 0,
    };
  } else if (consecutiveCount === 3) {
    return {
      level: 'danger',
      timePenalty: baseTimePenalty * 2,
      scorePenalty: baseScorePenalty * 2,
      hintFreeze: true,
      hintFreezeDuration: 5000,
    };
  } else {
    return {
      level: 'critical',
      timePenalty: baseTimePenalty * 3,
      scorePenalty: baseScorePenalty * 3,
      hintFreeze: true,
      hintFreezeDuration: 10000,
    };
  }
};

const handleWrongPenalty = (bookId: string) => {
  const state = gameState();
  const book = targetBook();
  if (!book) return;

  const wrongBook = BOOKS.find(b => b.id === bookId);
  const config = getDifficultyConfig(state.difficultyLevel);
  const newConsecutiveWrong = state.wrongPenalty.consecutiveWrong + 1;
  const penalty = calculatePenaltyForConsecutiveWrong(
    newConsecutiveWrong,
    config.wrongPenaltyTime,
    config.wrongPenaltyScore
  );

  const now = Date.now();
  const event: WrongPenaltyEvent = {
    id: `penalty-${now}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: now,
    level: penalty.level,
    consecutiveCount: newConsecutiveWrong,
    timePenalty: penalty.timePenalty,
    scorePenalty: penalty.scorePenalty,
    hintFrozen: penalty.hintFreeze,
    hintFreezeDuration: penalty.hintFreezeDuration,
    targetBookId: book.id,
    wrongBookId: bookId,
    currentLevel: state.currentLevel,
  };

  const hintFreezeUntil = penalty.hintFreeze ? now + penalty.hintFreezeDuration : state.wrongPenalty.hintFreezeUntil;

  setGameState(prev => ({
    ...prev,
    consecutiveCorrect: 0,
    timeRemaining: Math.max(prev.timeRemaining - penalty.timePenalty, 0),
    score: Math.max(prev.score - penalty.scorePenalty, 0),
    wrongPenalty: {
      ...prev.wrongPenalty,
      consecutiveWrong: newConsecutiveWrong,
      currentLevel: penalty.level,
      hintFreezeUntil,
      totalTimePenalty: prev.wrongPenalty.totalTimePenalty + penalty.timePenalty,
      totalScorePenalty: prev.wrongPenalty.totalScorePenalty + penalty.scorePenalty,
      totalHintFreezes: prev.wrongPenalty.totalHintFreezes + (penalty.hintFreeze ? 1 : 0),
      penaltyHistory: [...prev.wrongPenalty.penaltyHistory, event],
      maxConsecutiveWrong: Math.max(prev.wrongPenalty.maxConsecutiveWrong, newConsecutiveWrong),
    },
    currentRoundWrongPicks: [
      ...prev.currentRoundWrongPicks,
      {
        bookId,
        bookTitle: wrongBook?.title || '未知书籍',
        timestamp: now,
        penalty: event,
      },
    ],
  }));

  setLastPenaltyInfo(event);
  setShowWrongWarning(penalty.level);
  setPausableTimeout(`wrongWarning-${penalty.level}`, () => {
    setShowWrongWarning(null);
  }, 2000);
};

const resetWrongPenaltyForRound = () => {
  setGameState(prev => ({
    ...prev,
    wrongPenalty: {
      ...prev.wrongPenalty,
      consecutiveWrong: 0,
      currentLevel: null,
      hintFreezeUntil: 0,
    },
  }));
};

export const isHintFrozen = (): boolean => {
  const state = gameState();
  return state.wrongPenalty.hintFreezeUntil > Date.now();
};

export const getHintFreezeRemaining = (): number => {
  const state = gameState();
  const remaining = state.wrongPenalty.hintFreezeUntil - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
};

export const getWrongPenaltyInfo = () => {
  const state = gameState();
  return {
    ...state.wrongPenalty,
    hintFrozen: isHintFrozen(),
    hintFreezeRemaining: getHintFreezeRemaining(),
  };
};

export const selectBook = (bookId: string): boolean => {
  const state = gameState();
  if (state.state !== 'playing') return false;

  if (state.powerUps.eliminatedBookIds.includes(bookId)) {
    return false;
  }

  const book = targetBook();
  if (!book) return false;

  const config = getDifficultyConfig(state.difficultyLevel);

  if (bookId === book.id) {
    const findTime = (Date.now() - roundStartTime()) / 1000;
    setLastFindTime(findTime);
    
    resetWrongPenaltyForRound();
    
    const powerUpPenalty = calculatePowerUpPenalty(state.powerUps.powerUpsUsedThisRound);
    
    const score = calculateScoreWithDifficulty(
      config.baseScore,
      state.timeRemaining,
      state.hintsUsed,
      state.difficultyLevel,
      findTime,
      powerUpPenalty
    );

    const newFoundGenres = [...foundGenres(), book.genre];
    setFoundGenres(newFoundGenres);

    const newRoundStats = {
      findTimes: [...state.roundStats.findTimes, findTime],
      hintsUsedPerRound: [...state.roundStats.hintsUsedPerRound, state.hintsUsed],
    };

    const clues = currentClues();
    const unlockedClueTypes = clues.filter(c => c.unlocked).map(c => c.type);

    const streakResult = handleStreakOnSuccess(score);
    const totalScore = score + streakResult.streakBonus;

    const roundDetail: RoundDetail = {
      level: state.currentLevel,
      targetBookId: book.id,
      targetBookTitle: book.title,
      targetBookAuthor: book.author,
      targetBookGenre: book.genre,
      targetBookYear: book.year,
      rarity: book.rarity,
      findTime,
      hintsUsed: state.hintsUsed,
      scoreEarned: totalScore,
      unlockedClueTypes,
      wrongPicks: state.currentRoundWrongPicks,
    };

    setLastRoundScore(score);
    setLastRoundStreakBonus(streakResult.streakBonus);
    const newStreakCount = state.streak.currentStreak + 1;
    const newTitleId = streakResult.newTitle || state.streak.currentTitleId;
    const bestStreak = Math.max(state.streak.bestStreak, newStreakCount);
    const bestStreakDate = bestStreak > state.streak.bestStreak ? Date.now() : state.streak.bestStreakDate;

    if (state.gameMode === 'chapter') {
      const task = currentTask();
      if (task) {
        setChapterTasks(prev => prev.map(t =>
          t.id === task.id
            ? { ...t, completed: true, scoreEarned: totalScore, timeUsed: findTime, hintsUsed: state.hintsUsed }
            : t
        ));

        const nextTaskIndex = state.currentTaskIndex + 1;
        const tasks = chapterTasks();
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + totalScore,
          foundBooks: [...prev.foundBooks, bookId],
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          chapterScore: prev.chapterScore + totalScore,
          chapterTimeUsed: prev.chapterTimeUsed + findTime,
          chapterHintsUsed: prev.chapterHintsUsed + prev.hintsUsed,
          roundStats: newRoundStats,
          roundDetails: [...prev.roundDetails, roundDetail],
          currentRoundWrongPicks: [],
          state: nextTaskIndex >= tasks.length ? 'chapter_complete' : 'won',
          streak: {
            ...prev.streak,
            currentStreak: newStreakCount,
            bestStreak,
            bestStreakDate,
            totalStreakBonusScore: prev.streak.totalStreakBonusScore + streakResult.streakBonus,
            currentTitleId: newTitleId,
            streakStartTime: prev.streak.streakStartTime || Date.now(),
          },
          lastStreakBonus: streakResult.streakBonus,
        }));

        if (timerInterval) clearInterval(timerInterval);
        saveChapterProgressState();
        updatePersonalBest({
          score: gameState().score,
          booksFound: gameState().foundBooks.length,
          findTime,
          hintsUsed: state.hintsUsed,
          consecutiveCorrect: gameState().consecutiveCorrect,
        });
        checkAchievements();
        checkStreakAchievements(newStreakCount);

        if (nextTaskIndex >= tasks.length) {
          setTimeout(completeChapter, 500);
        }
      }
    } else {
      setGameState(prev => ({
          ...prev,
          score: prev.score + totalScore,
          foundBooks: [...prev.foundBooks, bookId],
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          roundStats: newRoundStats,
          roundDetails: [...prev.roundDetails, roundDetail],
          currentRoundWrongPicks: [],
          state: 'won',
          streak: {
            ...prev.streak,
            currentStreak: newStreakCount,
            bestStreak,
            bestStreakDate,
            totalStreakBonusScore: prev.streak.totalStreakBonusScore + streakResult.streakBonus,
            currentTitleId: newTitleId,
            streakStartTime: prev.streak.streakStartTime || Date.now(),
          },
          lastStreakBonus: streakResult.streakBonus,
        }));

      if (timerInterval) clearInterval(timerInterval);
      updatePersonalBest({
        score: gameState().score,
        booksFound: gameState().foundBooks.length,
        findTime,
        hintsUsed: gameState().hintsUsed,
        consecutiveCorrect: gameState().consecutiveCorrect,
      });
      checkAchievements();
      checkStreakAchievements(newStreakCount);
    }
    return true;
  } else {
    handleStreakOnFail();
    handleWrongPenalty(bookId);
    return false;
  }
};

const handleStreakOnSuccess = (baseScore: number): {
  streakBonus: number;
  timeBonus: number;
  hintBonus: number;
  newTitle: string | null;
  achievementId: string | null;
} => {
  const state = gameState();
  const newStreak = state.streak.currentStreak + 1;
  
  let streakBonus = 0;
  let timeBonus = 0;
  let hintBonus = 0;
  let newTitle: string | null = null;
  let achievementId: string | null = null;

  streakBonus = calculateStreakBonusScore(baseScore, newStreak);

  const reward = getStreakReward(newStreak);
  if (reward) {
    streakBonus += reward.bonusScore;
    timeBonus = reward.bonusTime;
    hintBonus = reward.bonusHints;
    achievementId = reward.achievementId || null;
    
    const oldTitle = state.streak.currentTitleId;
    const newTitleInfo = getStreakTitle(newStreak);
    if (newTitleInfo.id !== oldTitle) {
      newTitle = newTitleInfo.id;
    }
  } else {
    const newTitleInfo = getStreakTitle(newStreak);
    if (newTitleInfo.id !== state.streak.currentTitleId) {
      newTitle = newTitleInfo.id;
    }
  }

  return { streakBonus, timeBonus, hintBonus, newTitle, achievementId };
};

const handleStreakOnFail = () => {
  const state = gameState();
  if (state.streak.currentStreak === 0) return;

  const bestStreak = Math.max(state.streak.bestStreak, state.streak.currentStreak);
  const bestStreakDate = bestStreak > state.streak.bestStreak 
    ? Date.now() 
    : state.streak.bestStreakDate;

  if (state.gameMode === 'classic') {
    saveStreak({
      currentStreak: state.streak.currentStreak,
      bestStreak,
      bestStreakDate,
      currentTitleId: state.streak.currentTitleId || 'streak_newbie',
      lastScore: state.score,
      lastDifficulty: state.difficultyLevel,
      savedAt: Date.now(),
    });
  }

  setGameState(prev => ({
    ...prev,
    streak: {
      ...prev.streak,
      currentStreak: 0,
      bestStreak,
      bestStreakDate,
      currentTitleId: 'streak_newbie',
      inheritedStreak: false,
    },
  }));
};

export const generateGameReplay = (playerName?: string): GameReplayData | null => {
  const state = gameState();
  if (state.gameMode !== 'classic') return null;
  if (state.roundDetails.length === 0) return null;

  const config = getDifficultyConfig(state.difficultyLevel);
  const season = getCurrentSeason();
  const weekNum = getCurrentWeekNumber();
  
  const totalTimeUsed = config.gameTime - state.timeRemaining;
  const pbFlags = isNewPersonalBest(state.score);
  const rank = state.score > 0 ? getPersonalBestRank(state.score) : 0;

  let baseScore = 0;
  let timeBonus = 0;
  let streakBonus = 0;
  let rarityBonus = 0;
  let hintPenalty = 0;
  let wrongPenalty = state.wrongPenalty.totalScorePenalty;
  let powerUpPenalty = 0;

  for (const round of state.roundDetails) {
    baseScore += Math.floor(round.scoreEarned * 0.6);
    if (round.findTime < 30) {
      timeBonus += Math.floor(round.scoreEarned * 0.15);
    }
    const rarityConfig = RARITY_CONFIG[round.rarity];
    if (rarityConfig && rarityConfig.scoreMultiplier > 1) {
      rarityBonus += Math.floor(round.scoreEarned * (rarityConfig.scoreMultiplier - 1) / rarityConfig.scoreMultiplier);
    }
    hintPenalty += round.hintsUsed * config.hintPenalty;
  }

  streakBonus = state.streak.totalStreakBonusScore;

  const powerUpUsed = state.powerUps.powerUpsUsedTotal;
  if (powerUpUsed.freeHints > 0) powerUpPenalty += powerUpUsed.freeHints * 10;
  if (powerUpUsed.timePeeks > 0) powerUpPenalty += powerUpUsed.timePeeks * 15;
  if (powerUpUsed.eliminateWrongs > 0) powerUpPenalty += powerUpUsed.eliminateWrongs * 20;

  const replay: GameReplayData = {
    id: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    playerName,
    totalScore: state.score,
    totalTimeUsed,
    totalHintsUsed: state.hintsUsed,
    booksFound: state.foundBooks.length,
    finalLevel: state.currentLevel,
    difficultyLevel: state.difficultyLevel,
    difficultyMode: state.difficultyMode,
    gameMode: state.gameMode,
    startTime: gameStartTime(),
    endTime: Date.now(),
    streak: {
      currentStreak: state.streak.currentStreak,
      bestStreak: state.streak.bestStreak,
    },
    rounds: state.roundDetails,
    wrongPenaltySummary: {
      totalWrongPicks: state.wrongPenalty.penaltyHistory.length,
      maxConsecutiveWrong: state.wrongPenalty.maxConsecutiveWrong,
      totalTimePenalty: state.wrongPenalty.totalTimePenalty,
      totalScorePenalty: state.wrongPenalty.totalScorePenalty,
      totalHintFreezes: state.wrongPenalty.totalHintFreezes,
    },
    scoreBreakdown: {
      baseScore,
      timeBonus,
      streakBonus,
      rarityBonus,
      difficultyMultiplier: config.scoreMultiplier,
      hintPenalty,
      wrongPenalty,
      powerUpPenalty,
    },
    isPersonalBest: pbFlags.score,
    rank,
    seasonId: season.id,
    weekNumber: weekNum,
  };

  return replay;
};

export const saveCurrentGameReplay = (playerName?: string): GameReplayData | null => {
  const replay = generateGameReplay(playerName);
  if (replay) {
    saveGameReplay(replay);
  }
  return replay;
};

export const getStreakInfo = () => {
  const state = gameState();
  const title = getStreakTitle(state.streak.currentStreak);
  const nextReward = STREAK_REWARDS.find(r => r.minStreak > state.streak.currentStreak);
  const multiplier = getStreakBonusMultiplier(state.streak.currentStreak);
  
  return {
    currentStreak: state.streak.currentStreak,
    bestStreak: state.streak.bestStreak,
    title,
    nextReward,
    multiplier,
    totalBonusScore: state.streak.totalStreakBonusScore,
    inherited: state.streak.inheritedStreak,
  };
};

export const showStreakNotification = () => {
  setGameState(prev => ({ ...prev, showStreakPopup: true }));
  setTimeout(() => {
    setGameState(prev => ({ ...prev, showStreakPopup: false }));
  }, 3000);
};

export const dismissStreakPopup = () => {
  setGameState(prev => ({ ...prev, showStreakPopup: false }));
};

export const nextRound = () => {
  const state = gameState();
  
  if (state.gameMode === 'chapter') {
    const nextTaskIndex = state.currentTaskIndex + 1;
    const tasks = chapterTasks();
    
    if (nextTaskIndex >= tasks.length) {
      return;
    }

    const nextTask = tasks[nextTaskIndex];
    const book = BOOKS.find(b => b.id === nextTask.bookId);
    if (!book) return;

    const config = getDifficultyConfig(state.difficultyLevel);

    setCurrentTask(nextTask);
    setupRound(book);

    if (peekInterval) {
      clearInterval(peekInterval);
      peekInterval = null;
    }

    const streakReward = getStreakReward(state.streak.currentStreak);
    const streakTimeBonus = streakReward?.bonusTime || 0;
    const streakHintBonus = streakReward?.bonusHints || 0;

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      currentLevel: nextTaskIndex + 1,
      currentTaskIndex: nextTaskIndex,
      targetBookId: book.id,
      unlockedClues: [currentClues()[0]?.id || ''],
      hintsRemaining: Math.min(prev.hintsRemaining + 1 + streakHintBonus, config.initialHints + streakHintBonus),
      hintsUsed: 0,
      showDifficultyChange: false,
      timeRemaining: prev.timeRemaining + streakTimeBonus,
      powerUps: {
        ...prev.powerUps,
        peekActive: false,
        peekEndTime: 0,
        eliminatedBookIds: [],
        powerUpsUsedThisRound: {
          freeHints: 0,
          timePeeks: 0,
          eliminateWrongs: 0,
        },
      },
    }));

    startTimer();
    saveChapterProgressState();
  } else {
    let newDifficulty = state.difficultyLevel;
    let adjustmentReason: string | null = null;
    let showChange = false;
    let timeBonus = 0;

    if (state.difficultyMode === 'dynamic') {
      const config = getDifficultyConfig(state.difficultyLevel);
      const adjustment = adjustDifficulty(
        state.difficultyLevel,
        config,
        {
          findTimes: state.roundStats.findTimes,
          hintsUsedPerRound: state.roundStats.hintsUsedPerRound,
          consecutiveCorrect: state.consecutiveCorrect,
          currentLevelNum: state.currentLevel,
        }
      );
      newDifficulty = adjustment.newLevel;
      adjustmentReason = adjustment.reason;
      showChange = adjustment.changed;

      const levelOrder: DifficultyLevel[] = ['easy', 'normal', 'hard', 'expert', 'master'];
      const oldIdx = levelOrder.indexOf(state.difficultyLevel);
      const newIdx = levelOrder.indexOf(newDifficulty);
      if (newIdx > oldIdx) {
        timeBonus = (newIdx - oldIdx) * 15;
      }
    }

    const newConfig = getDifficultyConfig(newDifficulty);
    const book = selectRandomTargetByDifficulty(newDifficulty, state.foundBooks);
    setupRound(book);

    const newHistory = [...state.difficultyHistory, newDifficulty];
    const roundCompletionBonus = 10;
    
    const streakReward = getStreakReward(state.streak.currentStreak);
    const streakTimeBonus = streakReward?.bonusTime || 0;
    const streakHintBonus = streakReward?.bonusHints || 0;
    
    const totalTimeBonus = roundCompletionBonus + timeBonus + streakTimeBonus;

    if (peekInterval) {
      clearInterval(peekInterval);
      peekInterval = null;
    }

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      currentLevel: prev.currentLevel + 1,
      targetBookId: book.id,
      unlockedClues: [currentClues()[0]?.id || ''],
      hintsRemaining: Math.min(prev.hintsRemaining + 1 + streakHintBonus, newConfig.initialHints + streakHintBonus),
      hintsUsed: 0,
      difficultyLevel: newDifficulty,
      difficultyHistory: newHistory,
      difficultyAdjustmentReason: adjustmentReason,
      showDifficultyChange: showChange,
      timeRemaining: prev.timeRemaining + totalTimeBonus,
      lastTimeBonus: totalTimeBonus,
      powerUps: {
        ...prev.powerUps,
        peekActive: false,
        peekEndTime: 0,
        eliminatedBookIds: [],
        powerUpsUsedThisRound: {
          freeHints: 0,
          timePeeks: 0,
          eliminateWrongs: 0,
        },
      },
    }));

    if (showChange) {
      setPausableTimeout('difficultyChange', () => {
        setGameState(prev => ({ ...prev, showDifficultyChange: false }));
      }, 3000);
    }

    startTimer();
  }
};

let pauseStartTime = 0;
let savedPeekEndTime = 0;

export const pauseGame = () => {
  const state = gameState();
  if (state.state !== 'playing') return;

  pauseStartTime = Date.now();

  if (state.powerUps.peekActive && peekInterval) {
    savedPeekEndTime = state.powerUps.peekEndTime;
    clearInterval(peekInterval);
    peekInterval = null;
  }

  pauseAllTimers();

  setGameState(prev => ({ ...prev, state: 'paused' }));
};

export const resumeGame = () => {
  const state = gameState();
  if (state.state !== 'paused') return;

  const pauseDuration = Date.now() - pauseStartTime;

  if (state.powerUps.peekActive && savedPeekEndTime > 0) {
    const newPeekEndTime = savedPeekEndTime + pauseDuration;
    
    peekInterval = window.setInterval(() => {
      const currentState = gameState();
      if (Date.now() >= currentState.powerUps.peekEndTime || !currentState.powerUps.peekActive) {
        if (peekInterval) {
          clearInterval(peekInterval);
          peekInterval = null;
        }
        setGameState(prev => ({
          ...prev,
          powerUps: {
            ...prev.powerUps,
            peekActive: false,
            peekEndTime: 0,
          },
        }));
      }
    }, 200);

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      powerUps: {
        ...prev.powerUps,
        peekEndTime: newPeekEndTime,
      },
    }));
  } else {
    setGameState(prev => ({ ...prev, state: 'playing' }));
  }

  resumeAllTimers();

  pauseStartTime = 0;
  savedPeekEndTime = 0;
};

export const resetGame = () => {
  if (timerInterval) clearInterval(timerInterval);
  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }
  clearAllTimers();
  setShowAchievementPopup(null);
  setShowThemeRewardPopup(null);
  setGameState(prev => ({ ...prev, showDifficultyChange: false }));
  setGameState(initialStore);
  setCurrentClues([]);
  setTargetBook(null);
  setFoundGenres([]);
  setCurrentTask(null);
  setChapterTasks([]);
  setCurrentChapterId(null);
  setCurrentTheme(null);
  setThemeHintsUsed(0);
};

export const restartCurrentTask = () => {
  const state = gameState();
  if (state.gameMode !== 'chapter') return;
  if (!state.currentChapterId) return;

  const task = currentTask();
  if (!task) return;

  const book = BOOKS.find(b => b.id === task.bookId);
  if (!book) return;

  const config = getDifficultyConfig(state.difficultyLevel);

  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }

  setupRound(book);
  setFoundGenres([]);

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    timeRemaining: config.gameTime,
    hintsRemaining: config.initialHints,
    hintsUsed: 0,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    consecutiveCorrect: 0,
    powerUps: {
      ...prev.powerUps,
      peekActive: false,
      peekEndTime: 0,
      eliminatedBookIds: [],
      powerUpsUsedThisRound: {
        freeHints: 0,
        timePeeks: 0,
        eliminateWrongs: 0,
      },
    },
  }));

  startTimer();
  saveChapterProgressState();
};

export const getDifficultyInfo = () => {
  const state = gameState();
  return {
    level: state.difficultyLevel,
    mode: state.difficultyMode,
    config: getDifficultyConfig(state.difficultyLevel),
    history: state.difficultyHistory,
    showChange: state.showDifficultyChange,
    adjustmentReason: state.difficultyAdjustmentReason,
  };
};

export const dismissDifficultyChange = () => {
  setGameState(prev => ({ ...prev, showDifficultyChange: false }));
};

export const restartChapter = () => {
  const state = gameState();
  if (state.gameMode !== 'chapter') return;
  if (!state.currentChapterId) return;

  const chapterId = state.currentChapterId;
  resetGame();
  
  setTimeout(() => {
    startChapterGame(chapterId);
  }, 50);
};

export const getCurrentChapter = () => {
  const state = gameState();
  if (!state.currentChapterId) return null;
  return getChapterById(state.currentChapterId);
};

export const hasSavedProgress = (): boolean => {
  const currentChapterId = getCurrentChapterId();
  if (!currentChapterId) return false;
  
  const progress = getChapterProgress(currentChapterId);
  return progress !== null && !progress.completedAt && progress.currentTaskIndex > 0;
};

export const continueSavedGame = () => {
  const chapterId = getCurrentChapterId();
  if (!chapterId) return false;
  
  const progress = getChapterProgress(chapterId);
  if (!progress || progress.completedAt) return false;
  
  startChapterGame(chapterId);
  return true;
};

export const startThemeGame = (themeId: string) => {
  const theme = getThemeById(themeId);
  if (!theme) return;

  const progress = getThemeProgress(themeId);
  const foundBookIds = progress?.completedBookIds || [];
  const bookId = selectBookByTheme(themeId, foundBookIds);
  
  if (!bookId) {
    completeThemeChallenge(themeId);
    return;
  }

  const book = BOOKS.find(b => b.id === bookId);
  if (!book) return;

  setCurrentTheme(theme);
  setThemeHintsUsed(0);
  setupRound(book);
  setFoundGenres([]);

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  const defaultConfig = getDifficultyConfig(DEFAULT_DIFFICULTY);
  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: defaultConfig.gameTime,
    hintsRemaining: defaultConfig.initialHints,
    hintsUsed: 0,
    currentLevel: foundBookIds.length + 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: foundBookIds,
    consecutiveCorrect: 0,
    gameMode: 'classic',
    currentChapterId: null,
    currentTaskIndex: 0,
    chapterScore: 0,
    chapterTimeUsed: 0,
    chapterHintsUsed: 0,
    difficultyLevel: DEFAULT_DIFFICULTY,
    difficultyMode: 'fixed',
    difficultyHistory: [DEFAULT_DIFFICULTY],
    roundStats: {
      findTimes: [],
      hintsUsedPerRound: [],
    },
    difficultyAdjustmentReason: null,
    showDifficultyChange: false,
    lastTimeBonus: 0,
    powerUps: createInitialPowerUpState(DEFAULT_DIFFICULTY),
    currentThemeId: themeId,
    themeFoundBooks: foundBookIds,
    themeScore: progress?.totalScore || 0,
  }));

  startTimer();
};

const saveThemeProgressState = () => {
  const state = gameState();
  if (!state.currentThemeId) return;

  const progress = {
    themeId: state.currentThemeId,
    completedBookIds: state.themeFoundBooks,
    totalScore: state.themeScore,
  };

  saveThemeProgress(progress as any);
};

const completeThemeChallenge = (themeId: string) => {
  const theme = getThemeById(themeId);
  if (!theme) return;

  const state = gameState();
  const finalScore = state.themeScore + theme.bonusScore;

  const progress = {
    themeId,
    completedBookIds: state.themeFoundBooks,
    totalScore: finalScore,
    completedAt: Date.now(),
  };
  saveThemeProgress(progress as any);

  checkThemeRewards(themeId);
};

const checkThemeRewards = (themeId: string) => {
  const state = gameState();
  const theme = getThemeById(themeId);
  if (!theme) return;

  const unlockedRewards = [...getUnlockedThemeRewardIds()];
  let newReward: string | null = null;

  const allCompleted = state.themeFoundBooks.length >= theme.bookIds.length;
  const noHints = themeHintsUsed() === 0 && !hasUsedAnyPowerUp(state.powerUps.powerUpsUsedTotal);

  const rewards = THEME_REWARDS.filter(r => r.themeId === themeId || r.themeId === 'all');
  
  for (const reward of rewards) {
    if (unlockedRewards.includes(reward.id)) continue;

    let shouldUnlock = false;

    if (reward.themeId === themeId && allCompleted) {
      if (reward.id.endsWith('_1')) {
        shouldUnlock = true;
      } else if (reward.id.endsWith('_2') && noHints) {
        shouldUnlock = true;
      }
    }

    if (reward.themeId === 'all') {
      const allThemesCompleted = THEMES.every(t => {
        const tp = getThemeProgress(t.id);
        return tp?.completedAt !== undefined;
      });
      if (allThemesCompleted) {
        shouldUnlock = true;
      }
    }

    if (shouldUnlock) {
      unlockedRewards.push(reward.id);
      newReward = reward.id;

      if (reward.bonusType === 'score') {
        setGameState(prev => ({
          ...prev,
          themeScore: prev.themeScore + reward.value,
        }));
      } else if (reward.bonusType === 'hints') {
        setGameState(prev => ({
          ...prev,
          hintsRemaining: prev.hintsRemaining + reward.value,
        }));
      } else if (reward.bonusType === 'powerup') {
        setGameState(prev => ({
          ...prev,
          powerUps: {
            ...prev.powerUps,
            freeHints: prev.powerUps.freeHints + reward.value,
          },
        }));
      }
    }
  }

  if (unlockedRewards.length !== getUnlockedThemeRewardIds().length) {
    saveUnlockedThemeRewardIds(unlockedRewards);
    if (newReward) {
      const reward = THEME_REWARDS.find(r => r.id === newReward);
      if (reward) {
        setShowThemeRewardPopup(reward.title);
        setPausableTimeout('themeRewardPopup', () => setShowThemeRewardPopup(null), 3000);
      }
    }
  }
};

export const nextThemeRound = () => {
  const state = gameState();
  if (!state.currentThemeId) return;

  const theme = getThemeById(state.currentThemeId);
  if (!theme) return;

  const bookId = selectBookByTheme(state.currentThemeId, state.themeFoundBooks);
  
  if (!bookId) {
    setGameState(prev => ({
      ...prev,
      state: 'won',
    }));
    completeThemeChallenge(state.currentThemeId);
    return;
  }

  const book = BOOKS.find(b => b.id === bookId);
  if (!book) return;

  const config = getDifficultyConfig(state.difficultyLevel);

  setupRound(book);

  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    currentLevel: prev.themeFoundBooks.length + 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    hintsRemaining: Math.min(prev.hintsRemaining + 1, config.initialHints),
    hintsUsed: 0,
    showDifficultyChange: false,
    powerUps: {
      ...prev.powerUps,
      peekActive: false,
      peekEndTime: 0,
      eliminatedBookIds: [],
      powerUpsUsedThisRound: {
        freeHints: 0,
        timePeeks: 0,
        eliminateWrongs: 0,
      },
    },
  }));

  startTimer();
  saveThemeProgressState();
};

export const selectBookWithRarity = (bookId: string): boolean => {
  const state = gameState();
  if (state.state !== 'playing') return false;

  if (state.powerUps.eliminatedBookIds.includes(bookId)) {
    return false;
  }

  const book = targetBook();
  if (!book) return false;

  const config = getDifficultyConfig(state.difficultyLevel);

  if (bookId === book.id) {
    const findTime = (Date.now() - roundStartTime()) / 1000;
    setLastFindTime(findTime);
    
    resetWrongPenaltyForRound();
    
    const powerUpPenalty = calculatePowerUpPenalty(state.powerUps.powerUpsUsedThisRound);
    
    const rarityConfig = RARITY_CONFIG[book.rarity];
    const rarityMultiplier = rarityConfig.scoreMultiplier;
    
    const baseScore = calculateScoreWithDifficulty(
      config.baseScore,
      state.timeRemaining,
      state.hintsUsed,
      state.difficultyLevel,
      findTime,
      powerUpPenalty
    );
    
    const baseScoreWithRarity = Math.floor(baseScore * rarityMultiplier);
    
    const themeFilterResultData = calculateThemeFilterCompensation();
    setThemeFilterResult(themeFilterResultData);

    const diffModifier = getThemeFilterDifficultyModifier();
    const scoreAfterThemeFilter = Math.floor(
      (baseScoreWithRarity + themeFilterResultData.compensationScore) *
      themeFilterResultData.bonusMultiplier *
      diffModifier.scoreMultiplier
    );

    const streakResult = handleStreakOnSuccess(Math.max(scoreAfterThemeFilter, 100));
    const totalScore = streakResult.streakBonus + Math.max(scoreAfterThemeFilter, 100);
    const newStreakCount = state.streak.currentStreak + 1;
    const newTitleId = streakResult.newTitle || state.streak.currentTitleId;
    const bestStreak = Math.max(state.streak.bestStreak, newStreakCount);
    const bestStreakDate = bestStreak > state.streak.bestStreak ? Date.now() : state.streak.bestStreakDate;

    const newFoundGenres = [...foundGenres(), book.genre];
    setFoundGenres(newFoundGenres);

    const newRoundStats = {
      findTimes: [...state.roundStats.findTimes, findTime],
      hintsUsedPerRound: [...state.roundStats.hintsUsedPerRound, state.hintsUsed],
    };

    const roundDetail: RoundDetail = {
      level: state.currentLevel,
      targetBookId: book.id,
      targetBookTitle: book.title,
      targetBookAuthor: book.author,
      targetBookGenre: book.genre,
      targetBookYear: book.year,
      rarity: book.rarity,
      findTime,
      hintsUsed: state.hintsUsed,
      scoreEarned: totalScore,
      unlockedClueTypes: [],
      wrongPicks: state.currentRoundWrongPicks,
      themeFilter: {
        used: state.themeFilter.usedThisRound,
        displayThemeId: state.themeFilter.displayThemeId,
        isGenuine: state.themeFilter.isGenuine,
        judgment: state.themeFilter.judgment,
        judgmentCorrect: themeFilterResultData.judgmentCorrect,
        compensationScore: themeFilterResultData.compensationScore,
        bonusMultiplier: themeFilterResultData.bonusMultiplier,
      },
    };

    if (state.currentThemeId) {
      setThemeHintsUsed(prev => prev + state.hintsUsed);
      
      const newThemeFoundBooks = [...state.themeFoundBooks, bookId];
      const theme = getThemeById(state.currentThemeId);
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + totalScore,
        foundBooks: [...prev.foundBooks, bookId],
        consecutiveCorrect: prev.consecutiveCorrect + 1,
        themeFoundBooks: newThemeFoundBooks,
        themeScore: prev.themeScore + totalScore,
        roundStats: newRoundStats,
        roundDetails: [...prev.roundDetails, roundDetail],
        currentRoundWrongPicks: [],
        state: newThemeFoundBooks.length >= (theme?.requiredBooks || theme?.bookIds.length || 0) ? 'won' : 'won',
        streak: {
          ...prev.streak,
          currentStreak: newStreakCount,
          bestStreak,
          bestStreakDate,
          totalStreakBonusScore: prev.streak.totalStreakBonusScore + streakResult.streakBonus,
          currentTitleId: newTitleId,
          streakStartTime: prev.streak.streakStartTime || Date.now(),
        },
        lastStreakBonus: streakResult.streakBonus,
      }));

      if (timerInterval) clearInterval(timerInterval);
      saveThemeProgressState();
      updatePersonalBest({
        score: gameState().score,
        booksFound: gameState().foundBooks.length,
        findTime,
        hintsUsed: state.hintsUsed,
        consecutiveCorrect: gameState().consecutiveCorrect,
      });
      checkAchievements();
      checkStreakAchievements(newStreakCount);

      const themesForBook = getThemesForBook(bookId);
      themesForBook.forEach(t => checkThemeRewards(t.id));
    } else {
      setGameState(prev => ({
          ...prev,
          score: prev.score + totalScore,
          foundBooks: [...prev.foundBooks, bookId],
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          roundStats: newRoundStats,
          roundDetails: [...prev.roundDetails, roundDetail],
          currentRoundWrongPicks: [],
          state: 'won',
          streak: {
            ...prev.streak,
            currentStreak: newStreakCount,
            bestStreak,
            bestStreakDate,
            totalStreakBonusScore: prev.streak.totalStreakBonusScore + streakResult.streakBonus,
            currentTitleId: newTitleId,
            streakStartTime: prev.streak.streakStartTime || Date.now(),
          },
          lastStreakBonus: streakResult.streakBonus,
        }));

      if (timerInterval) clearInterval(timerInterval);
      updatePersonalBest({
        score: gameState().score,
        booksFound: gameState().foundBooks.length,
        findTime,
        hintsUsed: gameState().hintsUsed,
        consecutiveCorrect: gameState().consecutiveCorrect,
      });
      checkAchievements();
      checkStreakAchievements(newStreakCount);

      const themesForBook = getThemesForBook(bookId);
      themesForBook.forEach(t => checkThemeRewards(t.id));
    }
    return true;
  } else {
    handleStreakOnFail();
    handleWrongPenalty(bookId);
    return false;
  }
};

export const getCurrentThemeInfo = () => {
  const state = gameState();
  if (!state.currentThemeId) return null;
  
  const theme = getThemeById(state.currentThemeId);
  if (!theme) return null;

  const progress = state.themeFoundBooks.length;
  const required = theme.requiredBooks || theme.bookIds.length;
  const percent = (progress / required) * 100;

  return {
    theme,
    progress,
    required,
    percent,
    score: state.themeScore,
    isComplete: progress >= required,
  };
};

export const hasThemeProgress = (themeId: string): boolean => {
  const progress = getThemeProgress(themeId);
  return progress !== null && !progress.completedAt && progress.completedBookIds.length > 0;
};

export const continueThemeGame = (themeId: string): boolean => {
  const progress = getThemeProgress(themeId);
  if (!progress || progress.completedAt) return false;
  
  startThemeGame(themeId);
  return true;
};
