import { createSignal } from 'solid-js';
import type { GameStore, Book, Clue, ChapterTask, DifficultyLevel, DifficultyMode, ThemeChallenge, PenaltyLevel, WrongPenaltyEvent, RoundDetail, GameReplayData, AchievementProgress, ThemeFilterJudgment, ThemeFilterResult, DailyChallenge, RushStage, RatingResult, RatingInput, RandomEvent, ActiveRandomEvent, RandomEventResult, CustomerCommission, CommissionMatchResult, EraPreference, ThemePreference, AnomalyEvent, ActiveAnomalyEvent, AnomalyEventResult, AnomalyResolutionOption } from '../types/game';
import { DEFAULT_ANOMALY_SCHEDULE } from '../types/game';
import { BOOKS } from '../data/books';
import { createCluesForBook, buildClueContent } from '../data/clues';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHARACTER_ACHIEVEMENTS } from '../data/characters';
import { getChapterById, getNextChapter } from '../data/chapters';
import {
  getDifficultyConfig,
  selectSmartTargetBook,
  selectSmartBookByTheme,
  generateSmartDailyChallenge,
  adjustDifficulty,
  calculateScoreWithDifficulty,
  getRecentBookGenresFromHistory,
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
  saveAllAchievementProgress,
  incrementGamesPlayed,
  getGamesPlayed,
  getChapterProgress,
  saveChapterProgress,
  getCurrentChapterId,
  setCurrentChapterId,
  updatePersonalBest,
  runExtendedMigrations,
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
  getDailyProgress,
  updateDailyProgress,
  markDailyCompleted,
  getDailyLeaderboard,
  saveDailyLeaderboardEntry,
  updateCollectionEntry,
  getUnlockedCollectionCount,
  getAllCollectionEntries,
  addCollectionAchievement,
  getSeenEventTypes,
  addSeenEventTypes,
  getTotalEventsTriggered,
  incrementTotalEventsTriggered,
  safeGetAllAchievementProgress,
  safeGetPersonalBest,
  safeGetLeaderboard,
  getStorageVersionInfo,
  repairAndRestore,
  sanitizeAllStorage,
  updateThemeCollectionBook,
  markThemeCollectionCompleted,
  saveThemeCollectionRankEntry,
  unlockThemeCollectionChallenge,
  getThemeCollectionProgress,
} from '../utils/storage';
import { THEMES, getThemeById, RARITY_CONFIG, getThemesForBook, THEME_REWARDS } from '../data/themes';
import { THEME_COLLECTIONS as _THEME_COLLECTIONS, getThemeCollectionById, THEME_COLLECTION_CHALLENGES } from '../data/themeCollections';
import {
  STREAK_REWARDS,
  getStreakTitle,
  getStreakReward,
  getStreakBonusMultiplier,
  calculateStreakBonusScore,
  STREAK_INHERIT_COST,
} from '../data/streaks';
import { getTodayDateKey, getDailyChallengeBooks } from '../data/dailyChallenge';
import { calculateRating } from '../data/rating';
import {
  selectRandomEvent,
  calculateRandomEventImpact,
} from '../data/randomEvents';
import {
  selectAnomalyEvent,
  resolveAnomalyEventWithOption,
} from '../data/anomalyEvents';
import {
  processBookFound,
  getStoreBonus,
  getTimeBonus,
  getHintBonus,
  awardCommissionRewards,
  getStoreLevel,
  getCoins,
  awardActivityRewards,
} from './storeManager';
import { updateQuestProgress, buildGameContext, consumePendingQuestRewards, unlockHiddenQuest } from './questStore';
import { ALL_QUESTS } from '../data/quests';
import {
  processBookFoundForCalendar,
  getCalendarIntegration,
} from './calendarStore';
import {
  getDecorationModifiers,
  syncDecorationWithStore,
} from './decorationStore';
import {
  handleChapterComplete,
  getRestoredAreasCount,
  getRestoredSpecialBooksCount,
  isStoryStarted,
  isStoryCompleted,
} from '../utils/storyStorage';
import {
  getRandomCustomer,
  getRandomTheme,
  getRandomEra,
  getRandomDescription,
  getBooksByTheme,
  getBooksByEra,
  getEraForYear,
  calculateCommissionRewards,
  DIFFICULTY_TIME_MAP,
} from '../data/commissions';
import {
  recordBookFound,
} from './codexStore';
import {
  processBookFound as processBookFoundForActivities,
  processGameEnd as processGameEndForActivities,
  getActivityIntegrationBonuses,
} from './activityStore';
import { processBookFoundForExhibition, getExhibitionIntegrationBonuses } from './touringExhibitionStore';
import { getUnlockedCharacterBookIds, updateCharacterSideQuestProgress, checkCharacterAchievements, awardCharacterAchievementReward } from './characterStore';
import { showSettlementCenter } from './settlementStore';

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
    available: false,
    active: false,
    displayThemeId: null,
    isGenuine: false,
    usedThisRound: false,
    judgment: null,
    activationCost: {
      timePenalty: 5,
      scorePenalty: 100,
    },
    layoutAffected: false,
  },
  rush: {
    active: false,
    totalStages: 3,
    currentStageIndex: 0,
    stages: [],
    stageRewards: {
      stage1Bonus: 200,
      stage2Bonus: 350,
      stage3Bonus: 500,
      completionBonus: 1000,
      perfectBonus: 800,
    },
    totalStageBonus: 0,
    totalTimeBonus: 0,
    noHintStages: 0,
    noWrongStages: 0,
    completed: false,
    perfectRun: false,
  },
  randomEvent: {
    activeEvent: null,
    showEventPopup: false,
    eventHistory: [],
    eventsTriggeredThisGame: 0,
    eventsSurvived: 0,
    lastEventTriggeredAt: 0,
  },
  commission: {
    activeCommission: null,
    completedCommissions: [],
    totalSatisfaction: 0,
    totalCommissionsCompleted: 0,
    totalCommissionsFailed: 0,
    consecutiveSuccessfulCommissions: 0,
    bestStreak: 0,
    commissionQueue: [],
    showCommissionPopup: false,
    lastCommissionResult: null,
  },
  anomalyEvent: {
    activeEvent: null,
    showEventPopup: false,
    eventHistory: [],
    eventsTriggeredThisGame: 0,
    eventsResolvedSuccessfully: 0,
    eventsFailed: 0,
    lastEventTriggeredAt: 0,
    schedule: { ...DEFAULT_ANOMALY_SCHEDULE },
    damagedClueIds: new Set<string>(),
    misplacedBookIds: new Set<string>(),
  },
  currentThemeCollectionId: null,
  themeCollectionFoundBooks: [],
  themeCollectionScore: 0,
  themeCollectionStartTime: 0,
  themeCollectionActiveChallengeId: null,
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

runExtendedMigrations();
export const [gamesPlayed, setGamesPlayed] = createSignal(getGamesPlayed());
export const [currentTask, setCurrentTask] = createSignal<ChapterTask | null>(null);
export const [chapterTasks, setChapterTasks] = createSignal<ChapterTask[]>([]);
export const [currentTheme, setCurrentTheme] = createSignal<ThemeChallenge | null>(null);
export const [showThemeRewardPopup, setShowThemeRewardPopup] = createSignal<string | null>(null);
export const [themeHintsUsed, setThemeHintsUsed] = createSignal(0);
export const [showWrongWarning, setShowWrongWarning] = createSignal<PenaltyLevel | null>(null);
export const [lastPenaltyInfo, setLastPenaltyInfo] = createSignal<WrongPenaltyEvent | null>(null);
export const [achievementProgress, setAchievementProgress] = createSignal<Record<string, AchievementProgress>>(safeGetAllAchievementProgress());
export const [themeFilterResult, setThemeFilterResult] = createSignal<ThemeFilterResult | null>(null);
export const [showThemeFilterHint, setShowThemeFilterHint] = createSignal(false);
export const [dailyChallenge, setDailyChallenge] = createSignal<DailyChallenge | null>(null);
export const [dailyChallengeScore, setDailyChallengeScore] = createSignal(0);
export const [dailyChallengeBooksFound, setDailyChallengeBooksFound] = createSignal(0);
export const [showDailyCompletePopup, setShowDailyCompletePopup] = createSignal(false);
export const [lastRushStageBonus, setLastRushStageBonus] = createSignal(0);
export const [lastRushTimeBonus, setLastRushTimeBonus] = createSignal(0);
export const [showRushCompletePopup, setShowRushCompletePopup] = createSignal(false);
export const [currentRating, setCurrentRating] = createSignal<RatingResult | null>(null);
export const [collectionCount, setCollectionCount] = createSignal(getUnlockedCollectionCount());
export const [showRandomEventPopup, setShowRandomEventPopup] = createSignal<RandomEventResult | null>(null);
export const [lastRandomEvent, setLastRandomEvent] = createSignal<ActiveRandomEvent | null>(null);
export const [shuffledBookPositions, setShuffledBookPositions] = createSignal<Record<string, { shelf: number; position: number }> | null>(null);
export const [obscuredBookIds, setObscuredBookIds] = createSignal<Set<string>>(new Set());
export const [falselyHighlightedBookIds, setFalselyHighlightedBookIds] = createSignal<Set<string>>(new Set());
export const [hiddenClueIds, setHiddenClueIds] = createSignal<Set<string>>(new Set());
export const [lockedClueTypes, setLockedClueTypes] = createSignal<Set<string>>(new Set());
export const [showCommissionResultPopup, setShowCommissionResultPopup] = createSignal(false);
export const [commissionTimeRemaining, setCommissionTimeRemaining] = createSignal(0);
export const [showAnomalyEventPopup, setShowAnomalyEventPopup] = createSignal<AnomalyEventResult | null>(null);
export const [lastAnomalyEvent, setLastAnomalyEvent] = createSignal<ActiveAnomalyEvent | null>(null);
export const [damagedClueIdsState, setDamagedClueIdsState] = createSignal<Set<string>>(new Set());
export const [misplacedBookIdsState, setMisplacedBookIdsState] = createSignal<Set<string>>(new Set());

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

const clearRandomEventEffects = () => {
  setObscuredBookIds(new Set<string>());
  setFalselyHighlightedBookIds(new Set<string>());
  setHiddenClueIds(new Set<string>());
  setLockedClueTypes(new Set<string>());
  setShuffledBookPositions(null);
};

const applyRandomEventEffects = (event: RandomEvent): void => {
  const state = gameState();
  const targetBookId = state.targetBookId;

  for (const effect of event.effects) {
    switch (effect.type) {
      case 'book_obscure': {
        const allBookIds = BOOKS.map(b => b.id);
        const shuffled = [...allBookIds].sort(() => Math.random() - 0.5);
        const obscureCount = Math.floor(shuffled.length * 0.7);
        const toObscure = new Set<string>(shuffled.slice(0, obscureCount));
        setObscuredBookIds(toObscure);
        if (effect.duration) {
          setPausableTimeout(`randomEvent_obscure_${event.id}`, () => {
            setObscuredBookIds(new Set<string>());
          }, effect.duration);
        }
        break;
      }
      case 'book_false_highlight': {
        const wrongBooks = BOOKS.filter(b => b.id !== targetBookId);
        const shuffled = [...wrongBooks].sort(() => Math.random() - 0.5);
        const toHighlight = new Set<string>(shuffled.slice(0, effect.value).map(b => b.id));
        setFalselyHighlightedBookIds(toHighlight);
        if (effect.duration) {
          setPausableTimeout(`randomEvent_highlight_${event.id}`, () => {
            setFalselyHighlightedBookIds(new Set<string>());
          }, effect.duration);
        }
        break;
      }
      case 'layout_shuffle': {
        const shuffledPositions: Record<string, { shelf: number; position: number }> = {};
        BOOKS.forEach(book => {
          const newShelf = Math.floor(Math.random() * 5);
          const newPosition = Math.floor(Math.random() * 10);
          shuffledPositions[book.id] = { shelf: newShelf, position: newPosition };
        });
        setShuffledBookPositions(shuffledPositions);
        break;
      }
      case 'hint_lock': {
        const allClueTypes = ['author', 'year', 'genre', 'title', 'shelf', 'description', 'background'];
        const shuffled = [...allClueTypes].sort(() => Math.random() - 0.5);
        const toLock = new Set<string>(shuffled.slice(0, effect.value));
        setLockedClueTypes(toLock);
        if (effect.duration) {
          setPausableTimeout(`randomEvent_lockClue_${event.id}`, () => {
            setLockedClueTypes(new Set<string>());
          }, effect.duration);
        }
        break;
      }
      case 'clue_hide': {
        const clues = currentClues();
        const unlockedClues = clues.filter(c => c.unlocked);
        if (unlockedClues.length > 0) {
          const shuffled = [...unlockedClues].sort(() => Math.random() - 0.5);
          const toHide = new Set<string>(shuffled.slice(0, effect.value).map(c => c.id));
          setHiddenClueIds(toHide);
          if (effect.duration) {
            setPausableTimeout(`randomEvent_hideClue_${event.id}`, () => {
              setHiddenClueIds(new Set<string>());
            }, effect.duration);
          }
        }
        break;
      }
      case 'clue_reveal': {
        const clues = currentClues();
        const book = targetBook();
        if (!book) break;
        
        let cluesToReveal = effect.value;
        const updatedClues = [...clues];
        
        for (let i = 0; i < updatedClues.length && cluesToReveal > 0; i++) {
          if (!updatedClues[i].unlocked) {
            const content = buildClueContent(updatedClues[i].type, book);
            updatedClues[i] = { ...updatedClues[i], unlocked: true, content };
            cluesToReveal--;
          }
        }
        
        setCurrentClues(updatedClues);
        
        const newUnlockedClues = updatedClues
          .filter(c => c.unlocked)
          .map(c => c.id);
          
        setGameState(prev => ({
          ...prev,
          unlockedClues: newUnlockedClues,
          themeFilter: {
            ...prev.themeFilter,
            available: newUnlockedClues.length >= 3 && !prev.themeFilter.usedThisRound,
          },
        }));
        break;
      }
    }
  }
};

export const triggerRandomEvent = (): RandomEventResult | null => {
  const state = gameState();
  if (state.state !== 'playing') return null;
  if (state.randomEvent.activeEvent) return null;

  const event = selectRandomEvent(
    state.currentLevel,
    state.difficultyLevel,
    state.gameMode,
    state.randomEvent.lastEventTriggeredAt
  );

  if (!event) return null;

  const impact = calculateRandomEventImpact(event);
  
  const maxDuration = Math.max(...event.effects.map(e => e.duration || 0));
  const expiresAt = maxDuration > 0 ? Date.now() + maxDuration : undefined;

  const activeEvent: ActiveRandomEvent = {
    event,
    startTime: Date.now(),
    endTime: Date.now() + 30000,
    expiresAt,
    activated: true,
    resolved: false,
    effectsApplied: false,
    roundAffected: state.currentLevel,
  };

  const now = Date.now();

  setGameState(prev => ({
    ...prev,
    timeRemaining: Math.max(prev.timeRemaining + impact.timeAdjustment, 0),
    score: Math.max(prev.score + impact.scoreAdjustment, 0),
    randomEvent: {
      ...prev.randomEvent,
      activeEvent,
      showEventPopup: true,
      eventsTriggeredThisGame: prev.randomEvent.eventsTriggeredThisGame + 1,
      lastEventTriggeredAt: now,
      eventHistory: [
        ...prev.randomEvent.eventHistory,
        {
          eventId: event.id,
          round: state.currentLevel,
          timestamp: now,
          result: event.positive ? 'positive' : 'negative',
        },
      ],
    },
  }));

  applyRandomEventEffects(event);

  incrementTotalEventsTriggered(1);

  const result: RandomEventResult = {
    event,
    scoreAdjustment: impact.scoreAdjustment,
    timeAdjustment: impact.timeAdjustment,
    messages: impact.messages,
  };

  setLastRandomEvent(activeEvent);
  setShowRandomEventPopup(result);
  setPausableTimeout(`randomEventPopup_${event.id}`, () => {
    setShowRandomEventPopup(null);
  }, 4000);

  return result;
};

export const resolveRandomEvent = (): void => {
  const state = gameState();
  if (!state.randomEvent.activeEvent) return;

  clearRandomEventEffects();

  setGameState(prev => ({
    ...prev,
    randomEvent: {
      ...prev.randomEvent,
      activeEvent: null,
      showEventPopup: false,
      eventsSurvived: prev.randomEvent.eventsSurvived + 1,
    },
  }));

  setLastRandomEvent(null);
};

export const dismissRandomEvent = (): void => {
  setGameState(prev => ({
    ...prev,
    randomEvent: {
      ...prev.randomEvent,
      showEventPopup: false,
    },
  }));
};

export const getRandomEventInfo = () => {
  const state = gameState();
  const active = state.randomEvent.activeEvent;
  return {
    activeEvent: active,
    eventHistory: state.randomEvent.eventHistory,
    eventsTriggeredThisGame: state.randomEvent.eventsTriggeredThisGame,
    eventsSurvived: state.randomEvent.eventsSurvived,
    obscuredBookIds: obscuredBookIds(),
    falselyHighlightedBookIds: falselyHighlightedBookIds(),
    hiddenClueIds: hiddenClueIds(),
    lockedClueTypes: lockedClueTypes(),
    shuffledBookPositions: shuffledBookPositions(),
  };
};

export const hasRandomEventActive = (): boolean => {
  return gameState().randomEvent.activeEvent !== null;
};

const clearAnomalyEventEffects = () => {
  setDamagedClueIdsState(new Set<string>());
  setMisplacedBookIdsState(new Set<string>());
};

const applyAnomalyEventEffects = (event: AnomalyEvent): void => {
  for (const effect of event.effects) {
    switch (effect.type) {
      case 'clue_damage': {
        const clues = currentClues();
        const unlockedClues = clues.filter(c => c.unlocked);
        if (unlockedClues.length > 0) {
          const shuffled = [...unlockedClues].sort(() => Math.random() - 0.5);
          const toDamage = new Set<string>(shuffled.slice(0, effect.value).map(c => c.id));
          setDamagedClueIdsState(toDamage);
          if (effect.duration) {
            setPausableTimeout(`anomalyEvent_damageClue_${event.id}`, () => {
              setDamagedClueIdsState(new Set<string>());
            }, effect.duration);
          }
        }
        break;
      }
      case 'book_misplace': {
        const allBookIds = BOOKS.map(b => b.id);
        const shuffled = [...allBookIds].sort(() => Math.random() - 0.5);
        const toMisplace = new Set<string>(shuffled.slice(0, effect.value));
        setMisplacedBookIdsState(toMisplace);
        if (effect.duration) {
          setPausableTimeout(`anomalyEvent_misplace_${event.id}`, () => {
            setMisplacedBookIdsState(new Set<string>());
          }, effect.duration);
        }
        break;
      }
      case 'book_obscure': {
        const allBookIds = BOOKS.map(b => b.id);
        const shuffled = [...allBookIds].sort(() => Math.random() - 0.5);
        const obscureCount = Math.floor(shuffled.length * 0.6);
        const toObscure = new Set<string>(shuffled.slice(0, obscureCount));
        setObscuredBookIds(prev => {
          const next = new Set(prev);
          toObscure.forEach(id => next.add(id));
          return next;
        });
        if (effect.duration) {
          setPausableTimeout(`anomalyEvent_obscure_${event.id}`, () => {
            setObscuredBookIds(prev => {
              const next = new Set(prev);
              toObscure.forEach(id => next.delete(id));
              return next;
            });
          }, effect.duration);
        }
        break;
      }
      case 'layout_shuffle': {
        const shuffledPositions: Record<string, { shelf: number; position: number }> = {};
        BOOKS.forEach(book => {
          const newShelf = Math.floor(Math.random() * 5);
          const newPosition = Math.floor(Math.random() * 10);
          shuffledPositions[book.id] = { shelf: newShelf, position: newPosition };
        });
        setShuffledBookPositions(shuffledPositions);
        break;
      }
      case 'hint_lock': {
        const allClueTypes = ['author', 'year', 'genre', 'title', 'shelf', 'description', 'background'];
        const shuffled = [...allClueTypes].sort(() => Math.random() - 0.5);
        const toLock = new Set<string>(shuffled.slice(0, effect.value));
        setLockedClueTypes(prev => {
          const next = new Set(prev);
          toLock.forEach(id => next.add(id));
          return next;
        });
        if (effect.duration) {
          setPausableTimeout(`anomalyEvent_lockClue_${event.id}`, () => {
            setLockedClueTypes(prev => {
              const next = new Set(prev);
              toLock.forEach(id => next.delete(id));
              return next;
            });
          }, effect.duration);
        }
        break;
      }
      case 'clue_hide': {
        const clues = currentClues();
        const unlockedClues = clues.filter(c => c.unlocked);
        if (unlockedClues.length > 0) {
          const shuffled = [...unlockedClues].sort(() => Math.random() - 0.5);
          const toHide = new Set<string>(shuffled.slice(0, effect.value).map(c => c.id));
          setHiddenClueIds(prev => {
            const next = new Set(prev);
            toHide.forEach(id => next.add(id));
            return next;
          });
          if (effect.duration) {
            setPausableTimeout(`anomalyEvent_hideClue_${event.id}`, () => {
              setHiddenClueIds(prev => {
                const next = new Set(prev);
                toHide.forEach(id => next.delete(id));
                return next;
              });
            }, effect.duration);
          }
        }
        break;
      }
      case 'streak_break': {
        setGameState(prev => ({
          ...prev,
          streak: {
            ...prev.streak,
            currentStreak: 0,
          },
        }));
        break;
      }
      case 'consecutive_reset': {
        setGameState(prev => ({
          ...prev,
          consecutiveCorrect: 0,
        }));
        break;
      }
    }
  }
};

export const triggerAnomalyEvent = (): AnomalyEventResult | null => {
  const state = gameState();
  if (state.state !== 'playing') return null;
  if (state.anomalyEvent.activeEvent) return null;

  const randomState = state.randomEvent.activeEvent;
  if (randomState && !randomState.event.canCoexistWithRandomEvents) return null;

  const event = selectAnomalyEvent(
    state.currentLevel,
    state.difficultyLevel,
    state.gameMode,
    state.anomalyEvent.schedule,
    state.anomalyEvent.lastEventTriggeredAt,
    state.anomalyEvent.eventsTriggeredThisGame,
    state.foundBooks.length,
    state.consecutiveCorrect,
    state.wrongPenalty.consecutiveWrong,
    state.timeRemaining,
    state.score
  );

  if (!event) return null;

  if (!event.canCoexistWithRandomEvents && randomState) {
    resolveRandomEvent();
  }

  const activeEvent: ActiveAnomalyEvent = {
    event,
    startTime: Date.now(),
    autoResolveAt: Date.now() + event.autoResolveAfter,
    activated: true,
    resolved: false,
    effectsApplied: false,
    roundAffected: state.currentLevel,
  };

  const now = Date.now();

  setGameState(prev => ({
    ...prev,
    anomalyEvent: {
      ...prev.anomalyEvent,
      activeEvent,
      showEventPopup: true,
      eventsTriggeredThisGame: prev.anomalyEvent.eventsTriggeredThisGame + 1,
      lastEventTriggeredAt: now,
    },
  }));

  applyAnomalyEventEffects(event);

  setLastAnomalyEvent(activeEvent);

  setPausableTimeout(`anomalyEvent_autoResolve_${event.id}`, () => {
    const currentState = gameState();
    if (currentState.anomalyEvent.activeEvent?.event.id === event.id &&
        !currentState.anomalyEvent.activeEvent.resolved) {
      resolveAnomalyEvent(null);
    }
  }, event.autoResolveAfter);

  const initialResult: AnomalyEventResult = {
    event,
    resolution: null,
    success: false,
    scoreAdjustment: 0,
    timeAdjustment: 0,
    hintAdjustment: 0,
    messages: [event.description],
    streakPreserved: false,
  };

  setShowAnomalyEventPopup(initialResult);

  return initialResult;
};

export const resolveAnomalyEvent = (option: AnomalyResolutionOption | null): AnomalyEventResult | null => {
  const state = gameState();
  if (!state.anomalyEvent.activeEvent) return null;

  const activeEvent = state.anomalyEvent.activeEvent;
  if (activeEvent.resolved) return null;

  const result = resolveAnomalyEventWithOption(activeEvent.event, option);

  clearAnomalyEventEffects();

  const now = Date.now();

  setGameState(prev => {
    const newStreak = result.streakPreserved || prev.streak.currentStreak > 0 ? prev.streak : { ...prev.streak };
    if (!result.streakPreserved) {
      const hasStreakBreak = activeEvent.event.effects.some(e => e.type === 'streak_break');
      if (hasStreakBreak && !result.success) {
        newStreak.currentStreak = 0;
      }
    }

    return {
      ...prev,
      timeRemaining: Math.max(prev.timeRemaining + result.timeAdjustment, 0),
      score: Math.max(prev.score + result.scoreAdjustment, 0),
      hintsRemaining: Math.max(prev.hintsRemaining + result.hintAdjustment, 0),
      streak: newStreak,
      anomalyEvent: {
        ...prev.anomalyEvent,
        activeEvent: {
          ...activeEvent,
          resolved: true,
          resolution: option || undefined,
          resolutionSuccess: result.success,
        },
        showEventPopup: false,
        eventsResolvedSuccessfully: prev.anomalyEvent.eventsResolvedSuccessfully + (result.success ? 1 : 0),
        eventsFailed: prev.anomalyEvent.eventsFailed + (result.success ? 0 : 1),
        eventHistory: [
          ...prev.anomalyEvent.eventHistory,
          {
            eventId: activeEvent.event.id,
            round: activeEvent.roundAffected,
            timestamp: now,
            resolutionId: option?.id,
            success: result.success,
            scoreAdjustment: result.scoreAdjustment,
            timeAdjustment: result.timeAdjustment,
          },
        ],
      },
    };
  });

  setShowAnomalyEventPopup(result);
  setLastAnomalyEvent(null);

  setPausableTimeout(`anomalyEventResult_${activeEvent.event.id}`, () => {
    setShowAnomalyEventPopup(null);
    setGameState(prev => ({
      ...prev,
      anomalyEvent: {
        ...prev.anomalyEvent,
        activeEvent: null,
      },
    }));
  }, 3000);

  return result;
};

export const dismissAnomalyEventPopup = (): void => {
  setGameState(prev => ({
    ...prev,
    anomalyEvent: {
      ...prev.anomalyEvent,
      showEventPopup: false,
    },
  }));
};

export const getAnomalyEventInfo = () => {
  const state = gameState();
  const active = state.anomalyEvent.activeEvent;
  return {
    activeEvent: active,
    eventHistory: state.anomalyEvent.eventHistory,
    eventsTriggeredThisGame: state.anomalyEvent.eventsTriggeredThisGame,
    eventsResolvedSuccessfully: state.anomalyEvent.eventsResolvedSuccessfully,
    eventsFailed: state.anomalyEvent.eventsFailed,
    schedule: state.anomalyEvent.schedule,
    damagedClueIds: damagedClueIdsState(),
    misplacedBookIds: misplacedBookIdsState(),
  };
};

export const hasAnomalyEventActive = (): boolean => {
  const activeEvent = gameState().anomalyEvent.activeEvent;
  return activeEvent !== null && !activeEvent.resolved;
};

export const updateAnomalyEventSchedule = (updates: Partial<typeof DEFAULT_ANOMALY_SCHEDULE>): void => {
  setGameState(prev => ({
    ...prev,
    anomalyEvent: {
      ...prev.anomalyEvent,
      schedule: {
        ...prev.anomalyEvent.schedule,
        ...updates,
      },
    },
  }));
};

const clearAllActiveEvents = (): void => {
  resolveRandomEvent();
  clearAnomalyEventEffects();
  setGameState(prev => ({
    ...prev,
    anomalyEvent: {
      ...prev.anomalyEvent,
      activeEvent: null,
      showEventPopup: false,
    },
  }));
  setShowAnomalyEventPopup(null);
  setLastAnomalyEvent(null);
};

export const checkRandomEventAchievements = () => {
  const state = gameState();
  const unlocked = [...state.unlockedAchievements];
  const newlyUnlocked: string[] = [];

  if (state.randomEvent.eventsTriggeredThisGame >= 1 && !unlocked.includes('first_random_event')) {
    if (unlockSingleAchievement('first_random_event')) {
      newlyUnlocked.push('first_random_event');
    }
  }

  const totalTriggered = getTotalEventsTriggered();
  const survivorResult = updateProgressiveAchievement('event_survivor', totalTriggered);
  if (survivorResult.newStages.length > 0 && !unlocked.includes('event_survivor')) {
    const newUnlocked = [...unlocked, 'event_survivor'];
    setGameState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
    saveUnlockedAchievements(newUnlocked);
    newlyUnlocked.push('event_survivor');
  }

  const activeEvent = state.randomEvent.activeEvent;
  if (activeEvent && !activeEvent.event.positive && !unlocked.includes('negative_event_overcome')) {
    if (unlockSingleAchievement('negative_event_overcome')) {
      newlyUnlocked.push('negative_event_overcome');
    }
  }

  const history = state.randomEvent.eventHistory;
  if (history.length >= 3) {
    const last3 = history.slice(-3);
    if (last3.every(e => e.result === 'positive') && !unlocked.includes('lucky_streak')) {
      if (unlockSingleAchievement('lucky_streak')) {
        newlyUnlocked.push('lucky_streak');
      }
    }
  }

  if (history.length > 0) {
    const sessionTypes = history.map(e => e.eventId);
    addSeenEventTypes(sessionTypes);
    const seenTypes = new Set(getSeenEventTypes());
    const allEventIds = new Set(['power_outage', 'shelf_rearrange', 'hint_failure', 'time_warp', 'bonus_round', 'fog_of_war', 'lucky_find', 'curse_of_doubt']);
    if ([...allEventIds].every(id => seenTypes.has(id)) && !unlocked.includes('event_collector')) {
      if (unlockSingleAchievement('event_collector')) {
        newlyUnlocked.push('event_collector');
      }
    }
  }

  if (activeEvent) {
    const eventType = activeEvent.event.type;

    if (eventType === 'power_outage' && !unlocked.includes('power_outage_survivor')) {
      if (unlockSingleAchievement('power_outage_survivor')) {
        newlyUnlocked.push('power_outage_survivor');
      }
    }

    if (eventType === 'hint_failure' && state.hintsUsed === 0 && !unlocked.includes('hint_failure_overcome')) {
      if (unlockSingleAchievement('hint_failure_overcome')) {
        newlyUnlocked.push('hint_failure_overcome');
      }
    }

    if (eventType === 'time_warp' && !unlocked.includes('time_warp_master')) {
      if (unlockSingleAchievement('time_warp_master')) {
        newlyUnlocked.push('time_warp_master');
      }
    }

    if (eventType === 'shelf_rearrange' && !unlocked.includes('shelf_rearrange_survivor')) {
      if (unlockSingleAchievement('shelf_rearrange_survivor')) {
        newlyUnlocked.push('shelf_rearrange_survivor');
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    const ach = ACHIEVEMENTS.find(a => a.id === newlyUnlocked[0]);
    if (ach) {
      setShowAchievementPopup(ach.title);
      setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
    }
  }
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

  const colCount = getUnlockedCollectionCount();
  const collectorResult = updateProgressiveAchievement('collector', colCount);
  if (collectorResult.newStages.length > 0 && !unlocked.includes('collector')) {
    const newUnlocked = [...state.unlockedAchievements, 'collector'];
    setGameState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
    saveUnlockedAchievements(newUnlocked);
    if (!newAchievement) newAchievement = 'collector';
  }

  const allColEntries = getAllCollectionEntries();
  const collectedGenres = new Set(BOOKS.filter(b => allColEntries[b.id]).map(b => b.genre));
  if (collectedGenres.size >= 5 && !unlocked.includes('genre_master')) {
    if (unlockSingleAchievement('genre_master')) {
      if (!newAchievement) newAchievement = 'genre_master';
    }
  }

  if (newAchievement) {
    const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
    if (ach) {
      setShowAchievementPopup(ach.title);
      setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);

      const st = gameState();
      const lastBookId = st.foundBooks[st.foundBooks.length - 1];
      if (lastBookId && isAchievementBookRelated(newAchievement, lastBookId)) {
        addCollectionAchievement(lastBookId, newAchievement);
      }
    }
  }

  const charAchResult = checkCharacterAchievements();
  for (const charAchId of charAchResult.newlyUnlocked) {
    const charAch = CHARACTER_ACHIEVEMENTS.find(a => a.id === charAchId);
    if (charAch) {
      awardCharacterAchievementReward(charAchId);
      setShowAchievementPopup(`${charAch.icon} ${charAch.title}`);
      setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
    }
  }
};

export const checkStoryAchievements = (): string | null => {
  const state = gameState();
  const unlocked = [...state.unlockedAchievements];
  let newAchievement: string | null = null;

  if (isStoryStarted() && !unlocked.includes('story_starter')) {
    if (unlockSingleAchievement('story_starter')) {
      newAchievement = 'story_starter';
    }
  }

  const restoredCount = getRestoredAreasCount();
  if (restoredCount >= 1 && !unlocked.includes('story_first_restore')) {
    if (unlockSingleAchievement('story_first_restore')) {
      if (!newAchievement) newAchievement = 'story_first_restore';
    }
  }

  const restorerResult = updateProgressiveAchievement('story_restorer', restoredCount);
  if (restorerResult.newStages.length > 0 && !newAchievement) {
    newAchievement = 'story_restorer';
  }

  const booksCount = getRestoredSpecialBooksCount();
  const booksResult = updateProgressiveAchievement('story_special_book', booksCount);
  if (booksResult.newStages.length > 0 && !newAchievement) {
    newAchievement = 'story_special_book';
  }

  if (isStoryCompleted() && !unlocked.includes('story_completed')) {
    if (unlockSingleAchievement('story_completed')) {
      if (!newAchievement) newAchievement = 'story_completed';
    }
  }

  return newAchievement;
};

export const showStoryAchievementPopup = (achievementId: string | null) => {
  if (!achievementId) return;
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (ach) {
    setShowAchievementPopup(ach.title);
    setPausableTimeout('achievementPopup', () => setShowAchievementPopup(null), 3000);
  }
};

export const updateStoryDialogueAchievement = (dialogueCount: number): string | null => {
  const result = updateProgressiveAchievement('story_dialogue_master', dialogueCount);
  if (result.newStages.length > 0) {
    return 'story_dialogue_master';
  }
  return null;
};

export const unlockStorySRankAchievement = (): boolean => {
  const state = gameState();
  if (state.unlockedAchievements.includes('story_s_rank')) {
    return false;
  }
  return unlockSingleAchievement('story_s_rank');
};

const isAchievementBookRelated = (achievementId: string, bookId: string): boolean => {
  const book = BOOKS.find(b => b.id === bookId);
  if (!book) return false;
  const relatedIds = [
    'first_book',
    'book_10',
    'book_25',
    'book_50',
    'book_100',
    'purist',
    'hard_book',
    'speedster',
    'hint_free',
    'genre_master',
    'collector',
  ];
  if (book.genre === '文学' && achievementId === 'literature_lover') return true;
  if (book.genre === '哲学' && achievementId === 'philosopher') return true;
  if (book.genre === '历史' && achievementId === 'history_buff') return true;
  if (book.genre === '科幻' && achievementId === 'sci_fi_fan') return true;
  if ((book.rarity === 'rare' || book.rarity === 'legendary') && achievementId === 'rare_book') return true;
  return relatedIds.includes(achievementId);
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

      const st = gameState();
      const lastBookId = st.foundBooks[st.foundBooks.length - 1];
      if (lastBookId) {
        addCollectionAchievement(lastBookId, newAchievement);
      }
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
          if (gameState().gameMode === 'daily') {
            const challenge = dailyChallenge();
            if (challenge) {
              updateDailyProgress({
                date: challenge.date,
                score: gameState().score,
                booksFound: gameState().foundBooks.length,
              });
            }
          }
          updatePersonalBest({
            score: gameState().score,
            booksFound: gameState().foundBooks.length,
            findTime: lastFindTime(),
            hintsUsed: gameState().hintsUsed,
            consecutiveCorrect: gameState().consecutiveCorrect,
          });
          clearAllActiveEvents();
          checkAchievements();
          checkRandomEventAchievements();
          saveCurrentStreak();
          computeGameRating();
          
          setTimeout(() => {
            triggerGameSettlement();
          }, 300);
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
  const clues = createCluesForBook(book);

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
      const firstClueContent = buildClueContent(firstClue.type, book);
      orderedClues[0] = { ...firstClue, content: firstClueContent };
      setCurrentClues(orderedClues);
    } else {
      const firstClueContent = buildClueContent('year', book);
      clues[0].content = firstClueContent;
      setCurrentClues(clues);
    }
  } else {
    const firstClueContent = buildClueContent('year', book);
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
      available: false,
      active: false,
      displayThemeId,
      isGenuine,
      usedThisRound: false,
      judgment: null,
      activationCost: {
        timePenalty: Math.floor(3 + costMultiplier * 1),
        scorePenalty: Math.floor(50 + costMultiplier * 30),
      },
      layoutAffected: false,
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
    unlockedClueCount: state.unlockedClues.length,
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
      layoutAffected: true,
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

  syncDecorationWithStore();
  const decoModifiers = getDecorationModifiers();

  const bonusTime = getTimeBonus();
  const bonusHints = getHintBonus();
  const exhibitionIntegration = getExhibitionIntegrationBonuses();
  const exhibitionTimeBonus = Math.floor(exhibitionIntegration.timeBonus);
  const exhibitionHintBonus = Math.floor(exhibitionIntegration.hintBonus);

  const collectionEntries = getAllCollectionEntries();
  const smartSelection = selectSmartTargetBook({
    difficultyLevel: diffLevel,
    excludeIds: [],
    recentBookGenres: [],
    recentBookIds: [],
    collectionEntries,
    consecutiveCorrect: 0,
    currentLevel: 1,
    targetFamiliarRatio: 0.5,
    genreDiversityWindow: 3,
    genreWeights: decoModifiers.genreWeights,
    rarityWeights: decoModifiers.rarityWeights,
    rareBookBonusPercent: decoModifiers.rareBookBonus,
    preferredBookIds: getUnlockedCharacterBookIds(),
  });
  const book = smartSelection.book;
  setupRound(book);
  setFoundGenres([]);
  setGameStartTime(Date.now());
  
  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: config.gameTime + bonusTime + exhibitionTimeBonus,
    hintsRemaining: config.initialHints + bonusHints + exhibitionHintBonus,
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

    syncDecorationWithStore();
    const decoModifiers = getDecorationModifiers();

    const collectionEntries = getAllCollectionEntries();
    const smartSelection = selectSmartTargetBook({
      difficultyLevel: diffLevel,
      excludeIds: [],
      recentBookGenres: [],
      recentBookIds: [],
      collectionEntries,
      consecutiveCorrect: savedStreak.currentStreak,
      currentLevel: 1,
      targetFamiliarRatio: 0.3,
      genreDiversityWindow: 3,
      genreWeights: decoModifiers.genreWeights,
      rarityWeights: decoModifiers.rarityWeights,
      rareBookBonusPercent: decoModifiers.rareBookBonus,
      preferredBookIds: getUnlockedCharacterBookIds(),
    });
    const book = smartSelection.book;
    setupRound(book);
    setFoundGenres([]);
    setGameStartTime(Date.now());
    
    const newGamesPlayed = incrementGamesPlayed();
    setGamesPlayed(newGamesPlayed);

    const initialScore = Math.floor(savedStreak.lastScore * (1 - STREAK_INHERIT_COST.scorePenaltyPercent / 100));
    const initialTime = Math.floor(config.gameTime * (1 - STREAK_INHERIT_COST.timePenaltyPercent / 100));

    const streakExhibitionIntegration = getExhibitionIntegrationBonuses();
    const streakExhibitionTimeBonus = Math.floor(streakExhibitionIntegration.timeBonus);
    const streakExhibitionHintBonus = Math.floor(streakExhibitionIntegration.hintBonus);

    const streakTitle = getStreakTitle(savedStreak.currentStreak);

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      score: initialScore,
      timeRemaining: initialTime + streakExhibitionTimeBonus,
      hintsRemaining: config.initialHints + streakExhibitionHintBonus,
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
  const chapterExhibitionIntegration = getExhibitionIntegrationBonuses();
  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: defaultConfig.gameTime + Math.floor(chapterExhibitionIntegration.timeBonus),
    hintsRemaining: defaultConfig.initialHints + Math.floor(chapterExhibitionIntegration.hintBonus),
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
  const lockedTypes = lockedClueTypes();
  const lockedClue = clues.find(c => !c.unlocked && !lockedTypes.has(c.type));
  
  if (!lockedClue) return;

  const book = targetBook();
  if (!book) return;

  const content = buildClueContent(lockedClue.type, book);

  setCurrentClues(prev => prev.map(c => 
    c.id === lockedClue.id ? { ...c, unlocked: true, content } : c
  ));

  const newUnlockedClues = [...state.unlockedClues, lockedClue.id];
  
  setGameState(prev => ({
    ...prev,
    hintsRemaining: prev.hintsRemaining - 1,
    hintsUsed: prev.hintsUsed + 1,
    unlockedClues: newUnlockedClues,
    themeFilter: {
      ...prev.themeFilter,
      available: newUnlockedClues.length >= 3 && !prev.themeFilter.usedThisRound,
    },
  }));
};

export const useFreeHint = () => {
  const state = gameState();
  if (state.powerUps.freeHints <= 0 || state.state !== 'playing') return;
  if (isHintFrozen()) return;

  const clues = currentClues();
  const lockedTypes = lockedClueTypes();
  const lockedClue = clues.find(c => !c.unlocked && !lockedTypes.has(c.type));
  
  if (!lockedClue) return;

  const book = targetBook();
  if (!book) return;

  const content = buildClueContent(lockedClue.type, book);

  setCurrentClues(prev => prev.map(c => 
    c.id === lockedClue.id ? { ...c, unlocked: true, content } : c
  ));

  const newUnlockedClues = [...state.unlockedClues, lockedClue.id];
  
  setGameState(prev => ({
    ...prev,
    unlockedClues: newUnlockedClues,
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
    themeFilter: {
      ...prev.themeFilter,
      available: newUnlockedClues.length >= 3 && !prev.themeFilter.usedThisRound,
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

  const storyResult = handleChapterComplete(state.currentChapterId!);

  if (storyResult.areaRestored || storyResult.unlockedAreas.length > 0 || storyResult.unlockedSpecialBooks.length > 0) {
    if (!state.unlockedAchievements.includes('story_starter') && isStoryStarted()) {
      if (unlockSingleAchievement('story_starter')) {
        if (!newAchievement) newAchievement = 'story_starter';
      }
    }

    const restoredCount = getRestoredAreasCount();
    if (restoredCount >= 1 && !state.unlockedAchievements.includes('story_first_restore')) {
      if (unlockSingleAchievement('story_first_restore')) {
        if (!newAchievement) newAchievement = 'story_first_restore';
      }
    }

    const restorerResult = updateProgressiveAchievement('story_restorer', restoredCount);
    if (restorerResult.newStages.length > 0 && !newAchievement) {
      newAchievement = 'story_restorer';
    }

    const booksCount = getRestoredSpecialBooksCount();
    const booksResult = updateProgressiveAchievement('story_special_book', booksCount);
    if (booksResult.newStages.length > 0 && !newAchievement) {
      newAchievement = 'story_special_book';
    }

    if (isStoryCompleted() && !state.unlockedAchievements.includes('story_completed')) {
      if (unlockSingleAchievement('story_completed')) {
        if (!newAchievement) newAchievement = 'story_completed';
      }
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
  
  setTimeout(() => {
    triggerGameSettlement();
  }, 300);
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
    
    const baseScore = calculateScoreWithDifficulty(
      config.baseScore,
      state.timeRemaining,
      state.hintsUsed,
      state.difficultyLevel,
      findTime,
      powerUpPenalty
    );

    const storeBonus = getStoreBonus();
    const calendarIntegration = getCalendarIntegration();
    const calendarBonus = calendarIntegration.challengeBonus;
    const activityBonus = getActivityIntegrationBonuses();
    const exhibitionBonus = getExhibitionIntegrationBonuses();
    const combinedScoreMultiplier = storeBonus.scoreMultiplier * (calendarBonus?.scoreMultiplier || 1) * activityBonus.scoreMultiplier * exhibitionBonus.scoreMultiplier;
    const score = Math.floor(baseScore * combinedScoreMultiplier) + activityBonus.bonusPerBook.score + exhibitionBonus.bonusPerBook.score;

    processBookFound(book, score);
    processBookFoundForCalendar(book, score);
    const isPerfectRound = state.currentRoundWrongPicks.length === 0;
    processBookFoundForActivities(book, score, state.hintsUsed, isPerfectRound);
    const exhibitionResult = processBookFoundForExhibition(book, score);
    if (exhibitionResult.exhibitionCoinBonus > 0) {
      awardActivityRewards(exhibitionResult.exhibitionCoinBonus, 0, '展陈金币加成');
    }

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

    const activeRandomEvt = state.randomEvent.activeEvent;
    let evtScoreAdj = 0;
    let evtTimeAdj = 0;
    
    if (activeRandomEvt) {
      const impact = calculateRandomEventImpact(activeRandomEvt.event);
      evtScoreAdj = impact.scoreAdjustment;
      evtTimeAdj = impact.timeAdjustment;
    }

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
      randomEvent: activeRandomEvt ? {
        eventId: activeRandomEvt.event.id,
        eventType: activeRandomEvt.event.type,
        eventTitle: activeRandomEvt.event.title,
        scoreAdjustment: evtScoreAdj,
        timeAdjustment: evtTimeAdj,
        effects: activeRandomEvt.event.effects,
      } : undefined,
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
        resolveRandomEvent();
        checkAchievements();
        checkRandomEventAchievements();
        checkStreakAchievements(newStreakCount);
        computeGameRating();
        updateCollectionEntry(book.id, totalScore, findTime, state.hintsUsed);
        recordBookFound(book.id, totalScore, findTime, state.hintsUsed, state.difficultyLevel);
        setCollectionCount(getUnlockedCollectionCount());
        triggerQuestProgressOnBookFound(book, findTime, state);

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
      resolveRandomEvent();
      checkAchievements();
      checkRandomEventAchievements();
      checkStreakAchievements(newStreakCount);
      computeGameRating();
      updateCollectionEntry(book.id, totalScore, findTime, state.hintsUsed);
      recordBookFound(book.id, totalScore, findTime, state.hintsUsed, state.difficultyLevel);
      setCollectionCount(getUnlockedCollectionCount());
      triggerQuestProgressOnBookFound(book, findTime, state);
      
      setTimeout(() => {
        triggerGameSettlement();
      }, 300);
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
  
  if (state.gameMode === 'rush') {
    nextRushStage();
    return;
  }
  
  if (state.gameMode === 'daily') {
    nextDailyRound();
    return;
  }
  
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
    
    setTimeout(() => {
      triggerRandomEvent();
    }, 1000);
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
    
    syncDecorationWithStore();
    const decoModifiers = getDecorationModifiers();

    const recentGenres = getRecentBookGenresFromHistory(state.roundDetails);
    const collectionEntries = getAllCollectionEntries();
    const smartSelection = selectSmartTargetBook({
      difficultyLevel: newDifficulty,
      excludeIds: state.foundBooks,
      recentBookGenres: recentGenres,
      recentBookIds: state.foundBooks,
      collectionEntries,
      consecutiveCorrect: state.consecutiveCorrect,
      currentLevel: state.currentLevel,
      targetFamiliarRatio: 0.4,
      genreDiversityWindow: 3,
      genreWeights: decoModifiers.genreWeights,
      rarityWeights: decoModifiers.rarityWeights,
      rareBookBonusPercent: decoModifiers.rareBookBonus,
      preferredBookIds: getUnlockedCharacterBookIds(),
    });
    const book = smartSelection.book;
    setupRound(book);

    const newHistory = [...state.difficultyHistory, newDifficulty];
    const roundCompletionBonus = 10;
    
    const streakReward = getStreakReward(state.streak.currentStreak);
    const streakTimeBonus = streakReward?.bonusTime || 0;
    const streakHintBonus = streakReward?.bonusHints || 0;
    
    const storeTimeBonus = getTimeBonus();
    const storeHintBonus = getHintBonus();
    
    const nextRoundExhibitionIntegration = getExhibitionIntegrationBonuses();
    const nextRoundExhibitionTimeBonus = Math.floor(nextRoundExhibitionIntegration.timeBonus);
    const nextRoundExhibitionHintBonus = Math.floor(nextRoundExhibitionIntegration.hintBonus);
    
    const totalTimeBonus = roundCompletionBonus + timeBonus + streakTimeBonus + storeTimeBonus + nextRoundExhibitionTimeBonus;

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
      hintsRemaining: Math.min(prev.hintsRemaining + 1 + streakHintBonus + storeHintBonus + nextRoundExhibitionHintBonus, newConfig.initialHints + streakHintBonus + storeHintBonus + nextRoundExhibitionHintBonus),
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
    
    setTimeout(() => {
      triggerRandomEvent();
    }, 1000);
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

export const computeGameRating = (): RatingResult | null => {
  const state = gameState();
  const config = getDifficultyConfig(state.difficultyLevel);
  const findTimes = state.roundStats.findTimes;
  const totalTimeUsed = findTimes.length > 0
    ? findTimes.reduce((a, b) => a + b, 0)
    : (config.gameTime - state.timeRemaining);
  const avgFindTime = findTimes.length > 0
    ? findTimes.reduce((a, b) => a + b, 0) / findTimes.length
    : 0;
  const totalWrongPicks = state.wrongPenalty.penaltyHistory.length;

  const completed = state.state === 'won' || state.state === 'chapter_complete';

  if (state.foundBooks.length === 0 && state.state !== 'lost') {
    return null;
  }

  const ratingInput: RatingInput = {
    totalTimeUsed,
    totalGameTime: config.gameTime,
    avgFindTime,
    totalHintsUsed: state.hintsUsed,
    totalBooksFound: state.foundBooks.length,
    totalWrongPicks,
    bestStreak: state.streak.bestStreak,
    currentStreak: state.streak.currentStreak,
    difficultyLevel: state.difficultyLevel,
    completed,
  };

  const rating = calculateRating(ratingInput);
  setCurrentRating(rating);



  if (rating.bonusScore > 0) {
    if (state.gameMode === 'chapter') {
      setGameState(prev => ({
        ...prev,
        score: prev.score + rating.bonusScore,
        chapterScore: prev.chapterScore + rating.bonusScore,
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        score: prev.score + rating.bonusScore,
      }));
    }
  }

  return rating;
};

export const triggerGameSettlement = async (): Promise<void> => {
  const state = gameState();
  
  if (state.roundDetails.length === 0) return;
  
  const replay = generateGameReplay();
  if (!replay) return;
  
  const isWin = state.state === 'won' || state.state === 'chapter_complete';
  const isPersonalBest = isNewPersonalBest(state.score).score;
  const rank = state.score > 0 ? getPersonalBestRank(state.score) : undefined;
  const rating = currentRating()?.grade;
  
  await showSettlementCenter(replay, isWin, isPersonalBest, rank, rating);
};

export const awardActivityPowerUps = (freeHints: number, timePeeks: number, eliminateWrongs: number): void => {
  if (freeHints <= 0 && timePeeks <= 0 && eliminateWrongs <= 0) return;
  setGameState(prev => ({
    ...prev,
    powerUps: {
      ...prev.powerUps,
      freeHints: prev.powerUps.freeHints + Math.max(0, freeHints),
      timePeeks: prev.powerUps.timePeeks + Math.max(0, timePeeks),
      eliminateWrongs: prev.powerUps.eliminateWrongs + Math.max(0, eliminateWrongs),
    },
  }));
};

export const grantCharacterGameplayRewards = (score: number, hints: number): void => {
  if (score <= 0 && hints <= 0) return;
  setGameState(prev => ({
    ...prev,
    score: prev.score + Math.max(0, score),
    hintsRemaining: prev.hintsRemaining + Math.max(0, hints),
  }));
};

export const applyPendingQuestRewards = (): void => {
  const rewards = consumePendingQuestRewards();
  if (rewards.length === 0) return;

  let addHints = 0;
  let addScore = 0;
  let addFreeHints = 0;
  let addTimePeeks = 0;
  let addEliminateWrongs = 0;

  for (const reward of rewards) {
    switch (reward.type) {
      case 'hints':
        addHints += reward.value;
        break;
      case 'score':
        addScore += reward.value;
        break;
      case 'powerup':
        if (reward.powerUpType === 'free_hint') addFreeHints += reward.value;
        else if (reward.powerUpType === 'time_peek') addTimePeeks += reward.value;
        else if (reward.powerUpType === 'eliminate_wrong') addEliminateWrongs += reward.value;
        break;
    }
  }

  setGameState(prev => ({
    ...prev,
    score: prev.score + addScore,
    hintsRemaining: prev.hintsRemaining + addHints,
    powerUps: {
      ...prev.powerUps,
      freeHints: prev.powerUps.freeHints + addFreeHints,
      timePeeks: prev.powerUps.timePeeks + addTimePeeks,
      eliminateWrongs: prev.powerUps.eliminateWrongs + addEliminateWrongs,
    },
  }));
};

export const resetGame = () => {
  if (timerInterval) clearInterval(timerInterval);
  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }
  clearAllTimers();
  clearRandomEventEffects();
  setShowAchievementPopup(null);
  setShowThemeRewardPopup(null);
  setShowDailyCompletePopup(false);
  setShowRushCompletePopup(false);
  setCurrentRating(null);
  setShowRandomEventPopup(null);
  setLastRandomEvent(null);
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
  setDailyChallenge(null);
  setDailyChallengeScore(0);
  setDailyChallengeBooksFound(0);
  setLastRushStageBonus(0);
  setLastRushTimeBonus(0);
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
  const collectionEntries = getAllCollectionEntries();
  
  const smartSelection = selectSmartBookByTheme(theme.bookIds, {
    excludeIds: foundBookIds,
    recentBookGenres: [],
    recentBookIds: foundBookIds,
    collectionEntries,
    consecutiveCorrect: 0,
    currentLevel: foundBookIds.length + 1,
    targetFamiliarRatio: 0.5,
    genreDiversityWindow: 3,
  });
  
  if (!smartSelection) {
    completeThemeChallenge(themeId);
    return;
  }

  const book = smartSelection.book;

  setCurrentTheme(theme);
  setThemeHintsUsed(0);
  setupRound(book);
  setFoundGenres([]);

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  const defaultConfig = getDifficultyConfig(DEFAULT_DIFFICULTY);
  const bonusTime = getTimeBonus();
  const bonusHints = getHintBonus();
  const themeExhibitionIntegration = getExhibitionIntegrationBonuses();
  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: defaultConfig.gameTime + bonusTime + Math.floor(themeExhibitionIntegration.timeBonus),
    hintsRemaining: defaultConfig.initialHints + bonusHints + Math.floor(themeExhibitionIntegration.hintBonus),
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

  const collectionEntries = getAllCollectionEntries();
  const recentGenres = getRecentBookGenresFromHistory(state.roundDetails);
  
  const smartSelection = selectSmartBookByTheme(theme.bookIds, {
    excludeIds: state.themeFoundBooks,
    recentBookGenres: recentGenres,
    recentBookIds: state.themeFoundBooks,
    collectionEntries,
    consecutiveCorrect: state.consecutiveCorrect,
    currentLevel: state.themeFoundBooks.length + 1,
    targetFamiliarRatio: 0.4,
    genreDiversityWindow: 3,
  });
  
  if (!smartSelection) {
    setGameState(prev => ({
      ...prev,
      state: 'won',
    }));
    completeThemeChallenge(state.currentThemeId);
    return;
  }

  const book = smartSelection.book;

  const config = getDifficultyConfig(state.difficultyLevel);
  const storeTimeBonus = getTimeBonus();
  const storeHintBonus = getHintBonus();

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
    hintsRemaining: Math.min(prev.hintsRemaining + 1 + storeHintBonus, config.initialHints + storeHintBonus),
    hintsUsed: 0,
    showDifficultyChange: false,
    timeRemaining: prev.timeRemaining + storeTimeBonus,
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
  
  setTimeout(() => {
    triggerRandomEvent();
  }, 1000);
};

export const selectBookWithRarity = (bookId: string): boolean => {
  const state = gameState();
  if (state.state !== 'playing') return false;

  if (state.gameMode === 'commission' as any) {
    completeCommission(bookId);
    return true;
  }

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
    
    const storeBonus = getStoreBonus();
    const calendarIntegration = getCalendarIntegration();
    const calendarBonus = calendarIntegration.challengeBonus;
    const activityBonus = getActivityIntegrationBonuses();
    
    const themeFilterResultData = calculateThemeFilterCompensation();
    setThemeFilterResult(themeFilterResultData);

    const diffModifier = getThemeFilterDifficultyModifier();
    const exhibitionBonusRarity = getExhibitionIntegrationBonuses();
    const combinedScoreMultiplier = storeBonus.scoreMultiplier * (calendarBonus?.scoreMultiplier || 1) * activityBonus.scoreMultiplier * exhibitionBonusRarity.scoreMultiplier;
    const scoreAfterThemeFilter = Math.floor(
      (baseScoreWithRarity + themeFilterResultData.compensationScore) *
      themeFilterResultData.bonusMultiplier *
      diffModifier.scoreMultiplier *
      combinedScoreMultiplier
    ) + activityBonus.bonusPerBook.score + exhibitionBonusRarity.bonusPerBook.score;

    const finalScore = Math.max(scoreAfterThemeFilter, 100);
    processBookFound(book, finalScore);
    processBookFoundForCalendar(book, finalScore);
    const isPerfectRoundAlt = state.currentRoundWrongPicks.length === 0;
    processBookFoundForActivities(book, finalScore, state.hintsUsed, isPerfectRoundAlt);
    const exhibitionResultRarity = processBookFoundForExhibition(book, finalScore);
    if (exhibitionResultRarity.exhibitionCoinBonus > 0) {
      awardActivityRewards(exhibitionResultRarity.exhibitionCoinBonus, 0, '展陈金币加成');
    }

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

    const activeEvent = state.randomEvent.activeEvent;
    let eventScoreAdjustment = 0;
    let eventTimeAdjustment = 0;
    
    if (activeEvent) {
      const impact = calculateRandomEventImpact(activeEvent.event);
      eventScoreAdjustment = impact.scoreAdjustment;
      eventTimeAdjustment = impact.timeAdjustment;
    }

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
        available: state.themeFilter.available,
        displayThemeId: state.themeFilter.displayThemeId,
        isGenuine: state.themeFilter.isGenuine,
        judgment: state.themeFilter.judgment,
        judgmentCorrect: themeFilterResultData.judgmentCorrect,
        compensationScore: themeFilterResultData.compensationScore,
        bonusMultiplier: themeFilterResultData.bonusMultiplier,
        layoutAffected: state.themeFilter.layoutAffected,
      },
      randomEvent: activeEvent ? {
        eventId: activeEvent.event.id,
        eventType: activeEvent.event.type,
        eventTitle: activeEvent.event.title,
        scoreAdjustment: eventScoreAdjustment,
        timeAdjustment: eventTimeAdjustment,
        effects: activeEvent.event.effects,
      } : undefined,
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
      resolveRandomEvent();
      checkAchievements();
      checkRandomEventAchievements();
      checkStreakAchievements(newStreakCount);
      computeGameRating();
      updateCollectionEntry(book.id, totalScore, findTime, state.hintsUsed);
      recordBookFound(book.id, totalScore, findTime, state.hintsUsed, state.difficultyLevel);
      setCollectionCount(getUnlockedCollectionCount());

      const themesForBook = getThemesForBook(bookId);
      themesForBook.forEach(t => checkThemeRewards(t.id));
    } else if (state.gameMode === 'rush') {
      completeRushStage(bookId, findTime);

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
      resolveRandomEvent();
      checkAchievements();
      checkRandomEventAchievements();
      checkStreakAchievements(newStreakCount);
      computeGameRating();
      updateCollectionEntry(book.id, totalScore, findTime, state.hintsUsed);
      recordBookFound(book.id, totalScore, findTime, state.hintsUsed, state.difficultyLevel);
      setCollectionCount(getUnlockedCollectionCount());

      const themesForBook = getThemesForBook(bookId);
      themesForBook.forEach(t => checkThemeRewards(t.id));
    } else if (state.currentThemeCollectionId) {
      const collection = getThemeCollectionById(state.currentThemeCollectionId);
      const newTCFoundBooks = [...state.themeCollectionFoundBooks, bookId];
      const isTCCompleted = collection
        ? newTCFoundBooks.length >= collection.requiredBooks
        : false;

      setGameState(prev => ({
          ...prev,
          score: prev.score + totalScore,
          foundBooks: [...prev.foundBooks, bookId],
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          themeCollectionFoundBooks: newTCFoundBooks,
          themeCollectionScore: prev.themeCollectionScore + totalScore,
          roundStats: newRoundStats,
          roundDetails: [...prev.roundDetails, roundDetail],
          currentRoundWrongPicks: [],
          state: isTCCompleted ? 'won' : 'won',
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
        hintsUsed: state.hintsUsed,
        consecutiveCorrect: gameState().consecutiveCorrect,
      });
      resolveRandomEvent();
      checkAchievements();
      checkRandomEventAchievements();
      checkStreakAchievements(newStreakCount);
      computeGameRating();
      updateCollectionEntry(book.id, totalScore, findTime, state.hintsUsed);
      recordBookFound(book.id, totalScore, findTime, state.hintsUsed, state.difficultyLevel);
      setCollectionCount(getUnlockedCollectionCount());
      triggerQuestProgressOnBookFound(book, findTime, state);

      const tcThemesForBook = getThemesForBook(bookId);
      tcThemesForBook.forEach(t => checkThemeRewards(t.id));
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
      resolveRandomEvent();
      checkAchievements();
      checkRandomEventAchievements();
      checkStreakAchievements(newStreakCount);
      computeGameRating();
      updateCollectionEntry(book.id, totalScore, findTime, state.hintsUsed);
      setCollectionCount(getUnlockedCollectionCount());

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

export const startDailyChallenge = () => {
  const collectionEntries = getAllCollectionEntries();
  const challenge = generateSmartDailyChallenge(new Date(), collectionEntries, 5);
  const books = getDailyChallengeBooks(challenge);
  
  if (books.length === 0) return;
  
  const firstBook = books[0];
  setDailyChallenge(challenge);
  setDailyChallengeScore(0);
  setDailyChallengeBooksFound(0);
  setupRound(firstBook);
  setFoundGenres([]);
  
  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);
  
  const defaultConfig = getDifficultyConfig(DEFAULT_DIFFICULTY);
  const bonusTime = getTimeBonus();
  const bonusHints = getHintBonus();
  const dailyExhibitionIntegration = getExhibitionIntegrationBonuses();
  
  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: defaultConfig.gameTime + bonusTime + Math.floor(dailyExhibitionIntegration.timeBonus),
    hintsRemaining: defaultConfig.initialHints + bonusHints + Math.floor(dailyExhibitionIntegration.hintBonus),
    hintsUsed: 0,
    currentLevel: 1,
    targetBookId: firstBook.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: [],
    consecutiveCorrect: 0,
    gameMode: 'daily',
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
    currentThemeId: null,
    themeFoundBooks: [],
    themeScore: 0,
  }));
  
  startTimer();
};

export const nextDailyRound = () => {
  const state = gameState();
  const challenge = dailyChallenge();
  
  if (!challenge || state.gameMode !== 'daily') return;
  
  const currentIndex = state.currentLevel - 1;
  const nextIndex = currentIndex + 1;
  const books = getDailyChallengeBooks(challenge);
  
  if (nextIndex >= books.length) {
    completeDailyChallenge();
    return;
  }
  
  const nextBook = books[nextIndex];
  const config = getDifficultyConfig(state.difficultyLevel);
  
  setupRound(nextBook);
  
  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }
  
  const streakReward = getStreakReward(state.streak.currentStreak);
  const streakTimeBonus = streakReward?.bonusTime || 0;
  const streakHintBonus = streakReward?.bonusHints || 0;
  
  const storeTimeBonus = getTimeBonus();
  const storeHintBonus = getHintBonus();
  
  setGameState(prev => ({
    ...prev,
    state: 'playing',
    currentLevel: nextIndex + 1,
    targetBookId: nextBook.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    hintsRemaining: Math.min(prev.hintsRemaining + 1 + streakHintBonus + storeHintBonus, config.initialHints + streakHintBonus + storeHintBonus),
    hintsUsed: 0,
    showDifficultyChange: false,
    timeRemaining: prev.timeRemaining + streakTimeBonus + 10 + storeTimeBonus,
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
  
  setTimeout(() => {
    triggerRandomEvent();
  }, 1000);
};

const completeDailyChallenge = () => {
  const state = gameState();
  const challenge = dailyChallenge();
  
  if (!challenge) return;
  
  const dateKey = challenge.date;
  const finalScore = state.score;
  const booksFound = state.foundBooks.length;
  
  updateDailyProgress({
    date: dateKey,
    score: finalScore,
    booksFound,
  });
  
  markDailyCompleted(dateKey);
  
  setDailyChallengeScore(finalScore);
  setDailyChallengeBooksFound(booksFound);
  setShowDailyCompletePopup(true);
  
  setGameState(prev => ({
    ...prev,
    state: 'won',
  }));
  
  if (timerInterval) clearInterval(timerInterval);
  updatePersonalBest({
    score: finalScore,
    booksFound,
    findTime: lastFindTime(),
    hintsUsed: state.hintsUsed,
    consecutiveCorrect: state.consecutiveCorrect,
  });
  checkAchievements();
  computeGameRating();
};

export const getDailyChallengeInfo = () => {
  const state = gameState();
  const challenge = dailyChallenge();
  
  if (!challenge || state.gameMode !== 'daily') return null;
  
  const progress = state.currentLevel;
  const total = challenge.totalBooks;
  const percent = (progress / total) * 100;
  
  return {
    challenge,
    progress,
    total,
    percent,
    score: state.score,
    isComplete: state.foundBooks.length >= total,
  };
};

export const getTodayDailyProgress = () => {
  const dateKey = getTodayDateKey();
  return getDailyProgress(dateKey);
};

export const submitDailyScore = (playerName: string): boolean => {
  const state = gameState();
  const challenge = dailyChallenge();
  
  if (!challenge || state.gameMode !== 'daily') return false;
  if (state.foundBooks.length === 0) return false;
  
  const config = getDifficultyConfig(state.difficultyLevel);
  const timeUsed = config.gameTime - state.timeRemaining;
  
  saveDailyLeaderboardEntry({
    date: challenge.date,
    score: state.score,
    booksFound: state.foundBooks.length,
    timeUsed,
    hintsUsed: state.hintsUsed,
    playerName: playerName.trim(),
    timestamp: Date.now(),
  });
  
  return true;
};

export const getDailyLeaderboardEntries = () => {
  const dateKey = getTodayDateKey();
  return getDailyLeaderboard(dateKey);
};

export const isDailyChallengeMode = (): boolean => {
  const state = gameState();
  return state.gameMode === 'daily';
};

const generateRushBooks = (difficulty: DifficultyLevel): Book[] => {
  const books: Book[] = [];
  const usedIds: string[] = [];
  const usedGenres: string[] = [];
  const collectionEntries = getAllCollectionEntries();
  
  syncDecorationWithStore();
  const decoModifiers = getDecorationModifiers();
  
  for (let i = 0; i < 3; i++) {
    const smartSelection = selectSmartTargetBook({
      difficultyLevel: difficulty,
      excludeIds: usedIds,
      recentBookGenres: usedGenres,
      recentBookIds: usedIds,
      collectionEntries,
      consecutiveCorrect: 0,
      currentLevel: i + 1,
      targetFamiliarRatio: 0.3,
      genreDiversityWindow: 3,
      genreWeights: decoModifiers.genreWeights,
      rarityWeights: decoModifiers.rarityWeights,
      rareBookBonusPercent: decoModifiers.rareBookBonus,
      preferredBookIds: getUnlockedCharacterBookIds(),
    });
    books.push(smartSelection.book);
    usedIds.push(smartSelection.book.id);
    usedGenres.push(smartSelection.book.genre);
  }
  
  return books;
};

const calculateRushStageBonus = (
  stageIndex: number,
  findTime: number,
  hintsUsed: number,
  wrongPicks: number
): { stageBonus: number; timeBonus: number; noHint: boolean; noWrong: boolean } => {
  const rewards = initialStore.rush.stageRewards;
  let stageBonus = 0;
  let timeBonus = 0;
  let noHint = false;
  let noWrong = false;

  switch (stageIndex) {
    case 0:
      stageBonus = rewards.stage1Bonus;
      break;
    case 1:
      stageBonus = rewards.stage2Bonus;
      break;
    case 2:
      stageBonus = rewards.stage3Bonus;
      break;
  }

  if (hintsUsed === 0) {
    noHint = true;
    stageBonus = Math.floor(stageBonus * 1.3);
  }

  if (wrongPicks === 0) {
    noWrong = true;
    stageBonus = Math.floor(stageBonus * 1.2);
  }

  if (findTime < 20) {
    stageBonus = Math.floor(stageBonus * 1.25);
    timeBonus += 15;
  } else if (findTime < 40) {
    stageBonus = Math.floor(stageBonus * 1.1);
    timeBonus += 8;
  } else if (findTime < 60) {
    timeBonus += 5;
  } else {
    timeBonus += 3;
  }

  return { stageBonus, timeBonus, noHint, noWrong };
};

export const startRushGame = (difficulty?: DifficultyLevel, difficultyMode?: DifficultyMode) => {
  const state = gameState();
  const diffLevel = difficulty || state.difficultyLevel;
  const diffMode = difficultyMode || state.difficultyMode;
  const config = getDifficultyConfig(diffLevel);

  const books = generateRushBooks(diffLevel);
  const firstBook = books[0];
  setupRound(firstBook);
  setFoundGenres([]);
  setGameStartTime(Date.now());

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  const bonusTime = getTimeBonus();
  const bonusHints = getHintBonus();
  const rushExhibitionIntegration = getExhibitionIntegrationBonuses();

  const stages: RushStage[] = books.map((book, index) => ({
    id: `rush-stage-${Date.now()}-${index}`,
    stageNumber: index + 1,
    bookId: book.id,
    bookTitle: book.title,
    status: index === 0 ? 'current' : 'pending',
  }));

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: config.gameTime + bonusTime + Math.floor(rushExhibitionIntegration.timeBonus),
    hintsRemaining: config.initialHints + bonusHints + Math.floor(rushExhibitionIntegration.hintBonus),
    hintsUsed: 0,
    currentLevel: 1,
    targetBookId: firstBook.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: [],
    consecutiveCorrect: 0,
    gameMode: 'rush',
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
    currentThemeId: null,
    themeFoundBooks: [],
    themeScore: 0,
    rush: {
      active: true,
      totalStages: 3,
      currentStageIndex: 0,
      stages,
      stageRewards: initialStore.rush.stageRewards,
      totalStageBonus: 0,
      totalTimeBonus: 0,
      noHintStages: 0,
      noWrongStages: 0,
      completed: false,
      perfectRun: false,
    },
  }));

  startTimer();
};

const completeRushStage = (_bookId: string, findTime: number) => {
  const state = gameState();
  if (state.gameMode !== 'rush') return;

  const stageIndex = state.rush.currentStageIndex;
  const wrongPicks = state.currentRoundWrongPicks.length;
  const hintsUsed = state.hintsUsed;
  const totalStages = state.rush.totalStages;
  const isLastStage = stageIndex >= totalStages - 1;

  const { stageBonus, timeBonus, noHint, noWrong } = calculateRushStageBonus(
    stageIndex,
    findTime,
    hintsUsed,
    wrongPicks
  );

  setLastRushStageBonus(stageBonus);
  setLastRushTimeBonus(timeBonus);

  const newStages = state.rush.stages.map((stage, index) => {
    if (index === stageIndex) {
      return {
        ...stage,
        status: 'completed' as const,
        scoreEarned: state.score,
        timeUsed: findTime,
        hintsUsed,
        wrongPicks,
        stageBonus,
        timeBonus,
      };
    }
    if (!isLastStage && index === stageIndex + 1) {
      return {
        ...stage,
        status: 'current' as const,
      };
    }
    return stage;
  });

  const newNoHintStages = state.rush.noHintStages + (noHint ? 1 : 0);
  const newNoWrongStages = state.rush.noWrongStages + (noWrong ? 1 : 0);

  let extraBonus = 0;
  let perfectRun = false;
  let completed = false;

  if (isLastStage) {
    completed = true;
    const rewards = state.rush.stageRewards;
    extraBonus += rewards.completionBonus;
    if (newNoHintStages === totalStages && newNoWrongStages === totalStages) {
      perfectRun = true;
      extraBonus += rewards.perfectBonus;
    }
  }

  setGameState(prev => ({
    ...prev,
    score: prev.score + stageBonus + extraBonus,
    rush: {
      ...prev.rush,
      stages: newStages,
      totalStageBonus: prev.rush.totalStageBonus + stageBonus + extraBonus,
      totalTimeBonus: prev.rush.totalTimeBonus + timeBonus,
      noHintStages: newNoHintStages,
      noWrongStages: newNoWrongStages,
      completed,
      perfectRun,
    },
  }));
};

export const nextRushStage = () => {
  const state = gameState();
  if (state.gameMode !== 'rush') return;

  const nextStageIndex = state.rush.currentStageIndex + 1;

  if (nextStageIndex >= state.rush.totalStages) {
    completeRushGame();
    return;
  }

  const nextStage = state.rush.stages[nextStageIndex];
  const nextBook = BOOKS.find(b => b.id === nextStage.bookId);
  if (!nextBook) return;

  const config = getDifficultyConfig(state.difficultyLevel);
  setupRound(nextBook);

  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }

  const lastBonus = state.rush.stages[state.rush.currentStageIndex];
  const timeBonusFromLast = lastBonus?.timeBonus || 0;
  
  const storeTimeBonus = getTimeBonus();
  const storeHintBonus = getHintBonus();

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    currentLevel: nextStageIndex + 1,
    targetBookId: nextBook.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    hintsRemaining: Math.min(prev.hintsRemaining + 1 + storeHintBonus, config.initialHints + 2 + storeHintBonus),
    hintsUsed: 0,
    showDifficultyChange: false,
    timeRemaining: prev.timeRemaining + timeBonusFromLast + storeTimeBonus,
    currentRoundWrongPicks: [],
    rush: {
      ...prev.rush,
      currentStageIndex: nextStageIndex,
    },
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
  
  setTimeout(() => {
    triggerRandomEvent();
  }, 1000);
};

const completeRushGame = () => {
  const state = gameState();
  if (state.gameMode !== 'rush') return;

  setGameState(prev => ({
    ...prev,
    state: 'won',
  }));

  setShowRushCompletePopup(true);

  if (timerInterval) clearInterval(timerInterval);
  updatePersonalBest({
    score: state.score,
    booksFound: state.foundBooks.length,
    findTime: lastFindTime(),
    hintsUsed: state.hintsUsed,
    consecutiveCorrect: state.consecutiveCorrect,
  });
  checkAchievements();
  checkStreakAchievements(state.streak.currentStreak + 1);
  computeGameRating();
};

export const getRushInfo = () => {
  const state = gameState();
  if (state.gameMode !== 'rush') return null;

  const total = state.rush.totalStages;
  const completedStagesCount = state.rush.stages.filter(s => s.status === 'completed').length;
  const percent = (completedStagesCount / total) * 100;

  return {
    rush: state.rush,
    stages: state.rush.stages,
    currentStage: state.rush.stages[state.rush.currentStageIndex],
    progress: completedStagesCount,
    total,
    percent,
    currentStageIndex: state.rush.currentStageIndex,
    completedStagesCount,
    totalStageBonus: state.rush.totalStageBonus,
    totalTimeBonus: state.rush.totalTimeBonus,
    noHintStages: state.rush.noHintStages,
    noWrongStages: state.rush.noWrongStages,
    completed: state.rush.completed,
    perfectRun: state.rush.perfectRun,
    stageRewards: state.rush.stageRewards,
  };
};

export const isRushMode = (): boolean => {
  const state = gameState();
  return state.gameMode === 'rush';
};

export const restartRushGame = () => {
  const state = gameState();
  if (state.gameMode !== 'rush') return;

  const diffLevel = state.difficultyLevel;
  const diffMode = state.difficultyMode;
  resetGame();

  setTimeout(() => {
    startRushGame(diffLevel, diffMode);
  }, 50);
};

export const getDataVersionInfo = () => getStorageVersionInfo();

export const repairStorage = (): boolean => {
  const success = repairAndRestore();
  if (success) {
    setAchievementProgress(safeGetAllAchievementProgress());
    setCollectionCount(getUnlockedCollectionCount());
  }
  return success;
};

export const validateAndCleanStorage = () => {
  return sanitizeAllStorage({ removeInvalid: true, fillDefaults: true, backupBefore: true });
};

export const refreshAchievementProgress = () => {
  setAchievementProgress(safeGetAllAchievementProgress());
};

export const getSafeLeaderboard = () => safeGetLeaderboard();

export const getSafePersonalBest = () => safeGetPersonalBest();

const generateCommissionId = (): string => {
  return `comm_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const findMatchingBooksForCommission = (
  theme: ThemePreference,
  era: EraPreference
): string[] => {
  const themeBooks = getBooksByTheme(theme);
  const eraBooks = era === '任意' ? BOOKS : getBooksByEra(era);
  
  const themeBookIds = new Set(themeBooks.map(b => b.id));
  const eraBookIds = new Set(eraBooks.map(b => b.id));
  
  const intersectingIds = [...themeBookIds].filter(id => eraBookIds.has(id));
  
  if (intersectingIds.length > 0) {
    return intersectingIds;
  }
  
  return themeBooks.length > 0 
    ? themeBooks.map(b => b.id) 
    : eraBooks.map(b => b.id);
};

export const generateCommission = (): CustomerCommission => {
  const customer = getRandomCustomer();
  const theme = getRandomTheme();
  const era = getRandomEra();
  const description = getRandomDescription(theme);
  const difficulty = gameState().difficultyLevel;
  const timeLimit = DIFFICULTY_TIME_MAP[difficulty] || 90;
  const now = Date.now();
  const targetBookIds = findMatchingBooksForCommission(theme, era);
  
  const themeBooks = getBooksByTheme(theme);
  const genreHint = themeBooks.length > 0 && Math.random() > 0.5 
    ? themeBooks[Math.floor(Math.random() * themeBooks.length)].genre 
    : null;

  return {
    id: generateCommissionId(),
    customer,
    vagueDescription: description,
    eraPreference: era,
    themePreference: theme,
    genreHint,
    timeLimit,
    startTime: now,
    endTime: now + timeLimit * 1000,
    targetBookIds,
    status: 'pending',
    satisfaction: 0,
    matchedBookId: null,
    matchScore: 0,
    timeBonus: 0,
    rewardCoins: 0,
    rewardReputation: 0,
  };
};

export const matchBookToCommission = (
  bookId: string,
  commission: CustomerCommission
): CommissionMatchResult => {
  const book = BOOKS.find(b => b.id === bookId);
  if (!book) {
    return {
      isMatch: false,
      matchScore: 0,
      eraMatch: false,
      themeMatch: false,
      genreMatch: false,
      descriptionMatch: false,
      matchDetails: '未找到书籍信息',
      satisfactionDelta: -30,
    };
  }

  const bookEra = getEraForYear(book.year);
  const bookThemes = book.themes;
  const bookGenre = book.genre;

  const eraMatch = commission.eraPreference === '任意' || bookEra === commission.eraPreference;
  const themeMatch = bookThemes.includes(commission.themePreference);
  const genreMatch = !commission.genreHint || bookGenre === commission.genreHint;
  
  const descriptionKeywords = extractKeywords(commission.vagueDescription);
  const descriptionMatch = checkDescriptionMatch(book, descriptionKeywords);

  let matchScore = 0;
  const details: string[] = [];

  if (eraMatch) {
    matchScore += 25;
    details.push(`✓ 年代符合 (${bookEra})`);
  } else {
    details.push(`✗ 年代不符 (需要${commission.eraPreference}，实际${bookEra})`);
  }

  if (themeMatch) {
    matchScore += 35;
    details.push(`✓ 主题符合 (${commission.themePreference})`);
  } else {
    details.push(`✗ 主题不符 (需要${commission.themePreference})`);
  }

  if (genreMatch) {
    matchScore += 20;
    if (commission.genreHint) {
      details.push(`✓ 类型符合 (${bookGenre})`);
    }
  } else if (commission.genreHint) {
    details.push(`✗ 类型不符 (需要${commission.genreHint}，实际${bookGenre})`);
  }

  if (descriptionMatch) {
    matchScore += 20;
    details.push(`✓ 描述匹配`);
  } else {
    details.push(`○ 描述不太相关`);
  }

  const isMatch = matchScore >= 60;
  const satisfactionDelta = isMatch 
    ? Math.floor((matchScore - 60) * 1.5) + 20 
    : Math.floor(-(60 - matchScore) * 0.8);

  return {
    isMatch,
    matchScore,
    eraMatch,
    themeMatch,
    genreMatch,
    descriptionMatch,
    matchDetails: details.join('\n'),
    satisfactionDelta,
  };
};

const extractKeywords = (description: string): string[] => {
  const keywords: string[] = [];
  const patterns = [
    /玛德莱娜|蛋糕|茶|记忆/,
    /皇帝|罗马|帝王|皇室/,
    /猴子|西游记|齐天大圣|取经/,
    /三国|诸葛亮|关羽|曹操|战争/,
    /荒岛|漂流|孤岛|生存/,
    /科幻|外星人|宇宙|星球|三体/,
    /代码|编程|程序|软件|算法/,
    /哲学|人生|思考|存在|智慧/,
    /历史|古代|朝代|史记/,
    /青春|少年|反叛|成长/,
    /童话|小王子|孩子|星球/,
    /昆虫|虫子|观察|自然/,
    /宇宙|时间|黑洞|霍金/,
    /家族|兴衰|几代人|百年/,
    /画家|艺术|月亮|六便士/,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(description)) {
      keywords.push(pattern.source);
    }
  }
  
  return keywords;
};

const checkDescriptionMatch = (book: Book, keywords: string[]): boolean => {
  if (keywords.length === 0) return true;
  
  const bookText = `${book.title} ${book.description} ${book.backgroundStory} ${book.descriptionClues.join(' ')}`;
  
  let matchCount = 0;
  for (const keyword of keywords) {
    if (new RegExp(keyword).test(bookText)) {
      matchCount++;
    }
  }
  
  return matchCount >= Math.ceil(keywords.length / 2);
};

export const startCommissionGame = () => {
  const state = gameState();
  const diffLevel = state.difficultyLevel;
  const diffMode = state.difficultyMode;
  const config = getDifficultyConfig(diffLevel);

  const commission = generateCommission();
  commission.status = 'active';
  
  setCurrentClues([]);
  setTargetBook(null);
  setFoundGenres([]);
  setGameStartTime(Date.now());

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  setCommissionTimeRemaining(commission.timeLimit);

  const commissionExhibitionIntegration = getExhibitionIntegrationBonuses();

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: config.gameTime + Math.floor(commissionExhibitionIntegration.timeBonus),
    hintsRemaining: config.initialHints + Math.floor(commissionExhibitionIntegration.hintBonus),
    hintsUsed: 0,
    currentLevel: 1,
    targetBookId: null,
    unlockedClues: [],
    foundBooks: [],
    consecutiveCorrect: 0,
    gameMode: 'commission' as any,
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
    commission: {
      ...prev.commission,
      activeCommission: commission,
      showCommissionPopup: true,
    },
  }));

  startCommissionTimer();
  startTimer();
};

let commissionTimerInterval: number | null = null;

const startCommissionTimer = () => {
  if (commissionTimerInterval) clearInterval(commissionTimerInterval);
  
  commissionTimerInterval = window.setInterval(() => {
    const state = gameState();
    if (state.state !== 'playing' || state.gameMode !== ('commission' as any)) {
      if (commissionTimerInterval) clearInterval(commissionTimerInterval);
      return;
    }
    
    setCommissionTimeRemaining(prev => {
      const newTime = prev - 1;
      if (newTime <= 0) {
        if (commissionTimerInterval) clearInterval(commissionTimerInterval);
        setTimeout(() => failCommission(), 0);
        return 0;
      }
      return newTime;
    });
  }, 1000);
};

export const completeCommission = (bookId: string) => {
  const state = gameState();
  const commission = state.commission.activeCommission;
  if (!commission || commission.status !== 'active') return;

  if (commissionTimerInterval) clearInterval(commissionTimerInterval);

  const matchResult = matchBookToCommission(bookId, commission);
  const timeRemainingPct = commissionTimeRemaining() / commission.timeLimit;
  const newStreak = matchResult.isMatch 
    ? state.commission.consecutiveSuccessfulCommissions + 1 
    : 0;
  const bestStreak = Math.max(state.commission.bestStreak, newStreak);
  
  const rewards = calculateCommissionRewards(
    matchResult.matchScore,
    timeRemainingPct,
    commission.customer.satisfactionBase,
    newStreak
  );

  const satisfaction = Math.max(0, Math.min(100, 
    commission.customer.satisfactionBase + matchResult.satisfactionDelta
  ));

  const updatedCommission: CustomerCommission = {
    ...commission,
    status: matchResult.isMatch ? 'completed' : 'failed',
    satisfaction,
    matchedBookId: bookId,
    matchScore: matchResult.matchScore,
    timeBonus: Math.floor(timeRemainingPct * 30),
    rewardCoins: matchResult.isMatch ? rewards.coins : Math.floor(rewards.coins * 0.2),
    rewardReputation: matchResult.isMatch ? rewards.reputation : 0,
  };

  const bookObj = BOOKS.find(b => b.id === bookId);
  if (bookObj) {
    awardCommissionRewards(
      updatedCommission.rewardCoins,
      updatedCommission.rewardReputation,
      bookObj.title
    );
  }

  setGameState(prev => ({
    ...prev,
    score: prev.score + (matchResult.isMatch ? matchResult.matchScore * 10 : matchResult.matchScore * 2),
    commission: {
      ...prev.commission,
      activeCommission: null,
      completedCommissions: [
        ...prev.commission.completedCommissions,
        updatedCommission,
      ],
      totalSatisfaction: prev.commission.totalSatisfaction + satisfaction,
      totalCommissionsCompleted: matchResult.isMatch 
        ? prev.commission.totalCommissionsCompleted + 1 
        : prev.commission.totalCommissionsCompleted,
      totalCommissionsFailed: matchResult.isMatch 
        ? prev.commission.totalCommissionsFailed 
        : prev.commission.totalCommissionsFailed + 1,
      consecutiveSuccessfulCommissions: newStreak,
      bestStreak,
      lastCommissionResult: {
        success: matchResult.isMatch,
        satisfaction,
        rewards: {
          coins: updatedCommission.rewardCoins,
          reputation: updatedCommission.rewardReputation,
        },
        matchDetails: matchResult.matchDetails,
      },
      showCommissionPopup: true,
    },
  }));

  setShowCommissionResultPopup(true);

  if (matchResult.isMatch) {
    const commState = gameState();
    const context = buildGameContext({
      commissionsCompleted: commState.commission.totalCommissionsCompleted,
      collectedBooks: getUnlockedCollectionCount(),
      storeLevel: getStoreLevel(),
      coinsEarned: getCoins(),
    });
    updateQuestProgress(context);
  }
};

const failCommission = () => {
  const state = gameState();
  const commission = state.commission.activeCommission;
  if (!commission) return;

  const updatedCommission: CustomerCommission = {
    ...commission,
    status: 'failed',
    satisfaction: Math.max(0, commission.customer.satisfactionBase - 40),
    matchedBookId: null,
    matchScore: 0,
    timeBonus: 0,
    rewardCoins: 0,
    rewardReputation: 0,
  };

  setGameState(prev => ({
    ...prev,
    state: 'lost',
    commission: {
      ...prev.commission,
      activeCommission: null,
      completedCommissions: [
        ...prev.commission.completedCommissions,
        updatedCommission,
      ],
      totalSatisfaction: prev.commission.totalSatisfaction + updatedCommission.satisfaction,
      totalCommissionsFailed: prev.commission.totalCommissionsFailed + 1,
      consecutiveSuccessfulCommissions: 0,
      lastCommissionResult: {
        success: false,
        satisfaction: updatedCommission.satisfaction,
        rewards: { coins: 0, reputation: 0 },
        matchDetails: '⏰ 时间到！顾客不满意地离开了...',
      },
      showCommissionPopup: true,
    },
  }));

  setShowCommissionResultPopup(true);
};

export const acceptNextCommission = () => {
  setShowCommissionResultPopup(false);
  const state = gameState();
  
  if (state.commission.commissionQueue.length > 0) {
    const nextCommission = state.commission.commissionQueue[0];
    const newQueue = state.commission.commissionQueue.slice(1);
    
    nextCommission.status = 'active';
    const targetBook = BOOKS.find(b => nextCommission.targetBookIds.includes(b.id));
    if (!targetBook) return;
    
    setupRound(targetBook);
    setCommissionTimeRemaining(nextCommission.timeLimit);
    
    setGameState(prev => ({
      ...prev,
      targetBookId: targetBook.id,
      unlockedClues: [currentClues()[0]?.id || ''],
      currentLevel: prev.currentLevel + 1,
      commission: {
        ...prev.commission,
        activeCommission: nextCommission,
        commissionQueue: newQueue,
        showCommissionPopup: true,
      },
    }));
    
    startCommissionTimer();
  } else {
    generateAndStartNextCommission();
  }
};

const generateAndStartNextCommission = () => {
  const newCommission = generateCommission();
  newCommission.status = 'active';
  
  setCurrentClues([]);
  setTargetBook(null);
  setCommissionTimeRemaining(newCommission.timeLimit);
  
  setGameState(prev => ({
    ...prev,
    targetBookId: null,
    unlockedClues: [],
    currentLevel: prev.currentLevel + 1,
    commission: {
      ...prev.commission,
      activeCommission: newCommission,
      showCommissionPopup: true,
    },
  }));
  
  startCommissionTimer();
};

export const getCommissionInfo = () => {
  const state = gameState();
  const comm = state.commission.activeCommission;
  
  return {
    activeCommission: comm,
    timeRemaining: commissionTimeRemaining(),
    totalSatisfaction: state.commission.totalSatisfaction,
    totalCompleted: state.commission.totalCommissionsCompleted,
    totalFailed: state.commission.totalCommissionsFailed,
    consecutiveSuccess: state.commission.consecutiveSuccessfulCommissions,
    bestStreak: state.commission.bestStreak,
    lastResult: state.commission.lastCommissionResult,
    completedCount: state.commission.completedCommissions.length,
  };
};

export const isCommissionMode = (): boolean => {
  return gameState().gameMode === ('commission' as any);
};

export const dismissCommissionResultPopup = () => {
  setShowCommissionResultPopup(false);
  setGameState(prev => ({
    ...prev,
    commission: {
      ...prev.commission,
      showCommissionPopup: false,
    },
  }));
};

export const getAverageSatisfaction = (): number => {
  const state = gameState();
  const total = state.commission.totalCommissionsCompleted + state.commission.totalCommissionsFailed;
  if (total === 0) return 0;
  return Math.round(state.commission.totalSatisfaction / total);
};

const triggerQuestProgressOnBookFound = (book: Book, _findTime: number, state: GameStore): void => {
  const fastFinds: Record<number, number> = {};
  const recentFinds = state.roundStats.findTimes;
  for (const t of [10, 20, 30]) {
    fastFinds[t] = recentFinds.filter(ft => ft <= t).length;
  }

  const genres = foundGenres();
  const distinctGenres = new Set([...genres, book.genre]).size;

  const rarityCounts: Record<string, number> = {};
  const foundBookRarities = state.foundBooks.map(id => BOOKS.find(b => b.id === id)?.rarity).filter(Boolean);
  foundBookRarities.push(book.rarity);
  for (const r of foundBookRarities) {
    if (r) rarityCounts[r] = (rarityCounts[r] || 0) + 1;
  }

  const noHintRounds = state.roundStats.hintsUsedPerRound.filter(h => h === 0).length;

  const context = buildGameContext({
    foundBooks: state.foundBooks.length + 1,
    distinctGenres,
    rarityBooksFound: rarityCounts,
    bestScore: state.score,
    bestStreak: Math.max(state.streak.bestStreak, state.streak.currentStreak + 1),
    hintsUsed: state.hintsUsed,
    noHintRounds,
    powerupsUsed: state.powerUps.powerUpsUsedTotal.freeHints + state.powerUps.powerUpsUsedTotal.timePeeks + state.powerUps.powerUpsUsedTotal.eliminateWrongs,
    collectedBooks: getUnlockedCollectionCount(),
    storeLevel: getStoreLevel(),
    fastFinds,
  });

  const result = updateQuestProgress(context);

  for (const questId of result.newlyCompleted) {
    const quest = ALL_QUESTS.find(q => q.id === questId);
    if (quest?.hidden) {
      unlockHiddenQuest(questId);
    }
  }

  const foundBookIdsSoFar = [...state.foundBooks, book.id];
  const foundGenresSoFar = foundBookIdsSoFar
    .map(id => BOOKS.find(b => b.id === id)?.genre)
    .filter((g): g is string => !!g);
  updateCharacterSideQuestProgress({
    foundBookIds: foundBookIdsSoFar,
    foundBookGenres: foundGenresSoFar,
  });
};

export const triggerQuestProgressOnGameEnd = (params: {
  gamesCompleted: number;
  bestScore: number;
  difficultyLevel: string;
  gameMode: string;
  chaptersCompleted: number;
  chapterCompletions: Record<string, number>;
  commissionsCompleted: number;
  rushCompleted: number;
  perfectRushCompleted: number;
  dailyGamesCompleted: number;
  themeGamesCompleted: number;
  collectedBooks: number;
  bestStreak: number;
  storeLevel: number;
  coinsEarned: number;
}): void => {
  const difficultyGames: Record<string, number> = {};
  if (params.difficultyLevel && (params.gameMode === 'classic' || params.gameMode === 'chapter')) {
    difficultyGames[params.difficultyLevel] = 1;
  }

  const context = buildGameContext({
    foundBooks: 0,
    gamesCompleted: params.gamesCompleted,
    bestScore: params.bestScore,
    bestStreak: params.bestStreak,
    collectedBooks: params.collectedBooks,
    chaptersCompleted: params.chaptersCompleted,
    chapterCompletions: params.chapterCompletions,
    difficultyGamesCompleted: difficultyGames,
    dailyGamesCompleted: params.dailyGamesCompleted,
    rushCompleted: params.rushCompleted,
    perfectRushCompleted: params.perfectRushCompleted,
    themeGamesCompleted: params.themeGamesCompleted,
    commissionsCompleted: params.commissionsCompleted,
    storeLevel: params.storeLevel,
    coinsEarned: params.coinsEarned,
  });

  updateQuestProgress(context);
};

export const getThemeCollectionInfo = () => {
  const state = gameState();
  if (!state.currentThemeCollectionId) return null;
  const collection = getThemeCollectionById(state.currentThemeCollectionId);
  if (!collection) return null;
  const collected = state.themeCollectionFoundBooks.length;
  const percent = collection.bookIds.length > 0 ? (collected / collection.bookIds.length) * 100 : 0;
  return {
    collection,
    progress: collected,
    required: collection.requiredBooks,
    total: collection.bookIds.length,
    percent,
    score: state.themeCollectionScore,
    isCompleted: collected >= collection.requiredBooks,
    startTime: state.themeCollectionStartTime,
    activeChallengeId: state.themeCollectionActiveChallengeId,
  };
};

export const isThemeCollectionMode = (): boolean => {
  return gameState().currentThemeCollectionId !== null;
};

export const startThemeCollectionGame = (collectionId: string, challengeId?: string) => {
  const collection = getThemeCollectionById(collectionId);
  if (!collection) return;

  const progress = getThemeCollectionProgress(collectionId);
  const foundBookIds = progress?.collectedBookIds || [];
  const collectionEntries = getAllCollectionEntries();

  const remainingBookIds = collection.bookIds.filter(id => !foundBookIds.includes(id));
  if (remainingBookIds.length === 0) {
    return;
  }

  const smartSelection = selectSmartBookByTheme(remainingBookIds, {
    excludeIds: [],
    recentBookGenres: [],
    recentBookIds: foundBookIds,
    collectionEntries,
    consecutiveCorrect: 0,
    currentLevel: foundBookIds.length + 1,
    targetFamiliarRatio: 0.5,
    genreDiversityWindow: 3,
  });

  if (!smartSelection) return;
  const book = smartSelection.book;

  setFoundGenres([]);
  setupRound(book);

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  const defaultConfig = getDifficultyConfig(DEFAULT_DIFFICULTY);
  const bonusTime = getTimeBonus();
  const bonusHints = getHintBonus();
  const now = Date.now();

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: defaultConfig.gameTime + bonusTime,
    hintsRemaining: defaultConfig.initialHints + bonusHints,
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
    currentThemeId: null,
    themeFoundBooks: [],
    themeScore: 0,
    currentThemeCollectionId: collectionId,
    themeCollectionFoundBooks: foundBookIds,
    themeCollectionScore: progress?.bestScore || 0,
    themeCollectionStartTime: now,
    themeCollectionActiveChallengeId: challengeId || null,
  }));

  setGameStartTime(now);
  startTimer();
};

export const nextThemeCollectionRound = () => {
  const state = gameState();
  if (!state.currentThemeCollectionId) return;

  const collection = getThemeCollectionById(state.currentThemeCollectionId);
  if (!collection) return;

  const collectionEntries = getAllCollectionEntries();
  const recentGenres = getRecentBookGenresFromHistory(state.roundDetails);
  const remainingBookIds = collection.bookIds.filter(id => !state.themeCollectionFoundBooks.includes(id));

  if (remainingBookIds.length === 0 || state.themeCollectionFoundBooks.length >= collection.requiredBooks) {
    finishThemeCollectionGame();
    return;
  }

  const smartSelection = selectSmartBookByTheme(remainingBookIds, {
    excludeIds: [],
    recentBookGenres: recentGenres,
    recentBookIds: state.themeCollectionFoundBooks,
    collectionEntries,
    consecutiveCorrect: state.consecutiveCorrect,
    currentLevel: state.themeCollectionFoundBooks.length + 1,
    targetFamiliarRatio: 0.4,
    genreDiversityWindow: 3,
  });

  if (!smartSelection) {
    finishThemeCollectionGame();
    return;
  }

  const book = smartSelection.book;
  const config = getDifficultyConfig(state.difficultyLevel);
  const storeTimeBonus = getTimeBonus();
  const storeHintBonus = getHintBonus();

  setupRound(book);

  if (peekInterval) {
    clearInterval(peekInterval);
    peekInterval = null;
  }

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    currentLevel: prev.themeCollectionFoundBooks.length + 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    hintsRemaining: Math.min(prev.hintsRemaining + 1 + storeHintBonus, config.initialHints + storeHintBonus),
    hintsUsed: 0,
    showDifficultyChange: false,
    timeRemaining: prev.timeRemaining + storeTimeBonus,
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

  setTimeout(() => {
    triggerRandomEvent();
  }, 1000);
};

const finishThemeCollectionGame = () => {
  const state = gameState();
  if (!state.currentThemeCollectionId) return;

  const collection = getThemeCollectionById(state.currentThemeCollectionId);
  if (!collection) return;

  const tcProgress = getThemeCollectionProgress(state.currentThemeCollectionId);
  const isCompleted = state.themeCollectionFoundBooks.length >= collection.requiredBooks;
  const totalTimeUsed = (Date.now() - state.themeCollectionStartTime) / 1000;
  const finalScore = state.themeCollectionScore;

  const newlyCollectedBooks = state.themeCollectionFoundBooks.filter(
    id => !(tcProgress?.collectedBookIds || []).includes(id)
  );

  for (const bookId of newlyCollectedBooks) {
    const foundBook = state.roundDetails.find(rd => rd.targetBookId === bookId);
    updateThemeCollectionBook(
      state.currentThemeCollectionId,
      bookId,
      foundBook?.scoreEarned || 0,
      foundBook?.findTime || 0,
      foundBook?.hintsUsed || 0
    );
  }

  if (isCompleted) {
    markThemeCollectionCompleted(state.currentThemeCollectionId);
    processBookFoundForActivities(null as any, finalScore, state.hintsUsed, state.currentRoundWrongPicks.length === 0);
    processGameEndForActivities(finalScore, state.themeCollectionFoundBooks.length, state.hintsUsed, state.currentRoundWrongPicks.length === 0);
  }

  saveThemeCollectionRankEntry({
    playerName: '我',
    avatar: '📚',
    collectionId: state.currentThemeCollectionId,
    score: finalScore,
    booksCollected: state.themeCollectionFoundBooks.length,
    timeUsed: totalTimeUsed,
    hintsUsed: state.hintsUsed,
    date: Date.now(),
  });

  checkThemeCollectionChallenges(
    state.currentThemeCollectionId,
    state.themeCollectionActiveChallengeId,
    finalScore,
    totalTimeUsed,
    state.hintsUsed,
    state.themeCollectionFoundBooks.length,
    state.wrongPenalty.penaltyHistory.length,
    state.consecutiveCorrect
  );

  setGameState(prev => ({
    ...prev,
    state: 'won',
  }));

  if (timerInterval) clearInterval(timerInterval);
};

const checkThemeCollectionChallenges = (
  _collectionId: string,
  activeChallengeId: string | null,
  score: number,
  timeUsed: number,
  hintsUsed: number,
  _booksCollected: number,
  wrongPicks: number,
  streak: number
) => {
  if (!activeChallengeId) return;

  const challenge = THEME_COLLECTION_CHALLENGES.find((c: any) => c.id === activeChallengeId);
  if (!challenge) return;

  let completed = false;
  switch (challenge.type) {
    case 'speed':
      completed = timeUsed <= challenge.target;
      break;
    case 'accuracy':
      completed = wrongPicks <= challenge.target;
      break;
    case 'no_hint':
      completed = hintsUsed <= challenge.target;
      break;
    case 'streak':
      completed = streak >= challenge.target;
      break;
    case 'score':
      completed = score >= challenge.target;
      break;
  }

  if (completed) {
    const unlocked = unlockThemeCollectionChallenge(activeChallengeId);
    if (unlocked) {
      processBookFound(null as any, challenge.rewardCoins);
    }
  }
};

