import { createSignal, createMemo } from 'solid-js';
import type {
  SettlementState,
  SettlementData,
  SettlementContext,
  SettlementTab,
  GameResultSummary,
  SeasonProgress,
  QuestResult,
  AchievementResult,
  CodexUnlock,
  SettlementReward,
} from '../types/settlement';
import {
  gameState,
} from './gameStore';
import { updateQuestProgress, buildGameContext, consumePendingQuestRewards, consumePendingTitleUnlocks, consumePendingAchievementUnlocks } from './questStore';
import { getActivityIntegrationBonuses, processGameEnd } from './activityStore';
import { getCoins, getStoreLevel } from './storeManager';
import {
  getGamesPlayed,
  getPersonalBest,
  getLeaderboard,
  getCurrentSeason,
  getCurrentWeekNumber,
  getDailyProgress,
  getAllCollectionEntries,
  getCompletedChaptersCount,
  getAllChapterProgress,
} from '../utils/storage';
import { recordGameComplete } from './accountStore';
import { ALL_QUESTS } from '../data/quests';
import { ACHIEVEMENTS } from '../data/achievements';
import { BOOKS } from '../data/books';
import { THEME_COLLECTIONS, EASTER_EGGS, getAuthorByBookId } from '../data/codex';
import {
  getUnlockedAchievements,
  safeGetAllAchievementProgress,
  saveAllAchievementProgress,
  saveUnlockedAchievements,
  updateCollectionEntry,
} from '../utils/storage';
import {
  getCodexProgress,
  saveDiscoveryRecord,
  saveBookCodexEntry,
  saveAuthorCodexEntry,
  createDiscoveryRecord,
  checkAllEasterEggs,
  checkThemeCollectionCompletion,
} from '../utils/codexStorage';
import type { GameReplayData, Achievement, AchievementProgress } from '../types/game';
import type { DiscoveryRecord } from '../types/codex';

const initialState: SettlementState = {
  isVisible: false,
  activeTab: 'overview',
  settlementData: null,
  isProcessing: false,
  showRewardAnimations: false,
};

export const [settlementState, setSettlementState] = createSignal<SettlementState>(initialState);
export const [questResults, setQuestResults] = createSignal<QuestResult[]>([]);
export const [achievementResults, setAchievementResults] = createSignal<AchievementResult[]>([]);
export const [codexUnlocks, setCodexUnlocks] = createSignal<CodexUnlock[]>([]);
export const [totalRewards, setTotalRewards] = createSignal<SettlementReward[]>([]);

const openSettlement = (tab?: SettlementTab): void => {
  setSettlementState(prev => ({
    ...prev,
    isVisible: true,
    activeTab: tab || prev.activeTab,
  }));
};

const closeSettlement = (): void => {
  setSettlementState(prev => ({
    ...prev,
    isVisible: false,
  }));
};

const setActiveTab = (tab: SettlementTab): void => {
  setSettlementState(prev => ({
    ...prev,
    activeTab: tab,
  }));
};

const buildSettlementContext = (
  replay: GameReplayData,
  isWin: boolean,
  isPersonalBest: boolean,
  rank?: number,
  rating?: string
): SettlementContext => {
  const state = gameState();
  const pb = getPersonalBest();
  const collectionEntries = getAllCollectionEntries();
  
  const foundBooks = replay.rounds.map(r => r.targetBookId);
  const foundGenres = [...new Set(replay.rounds.map(r => r.targetBookGenre))];
  
  const rarityBooksFound: Record<string, number> = {};
  for (const round of replay.rounds) {
    rarityBooksFound[round.rarity] = (rarityBooksFound[round.rarity] || 0) + 1;
  }
  
  const fastFinds: Record<number, number> = {};
  const thresholds = [10, 30, 60];
  for (const threshold of thresholds) {
    fastFinds[threshold] = replay.rounds.filter(r => r.findTime < threshold).length;
  }
  
  const noHintRounds = replay.rounds.filter(r => r.hintsUsed === 0).length;
  
  const chapterCompletions: Record<string, number> = {};
  
  const chapterProgress = getAllChapterProgress();
  for (const [chapterId, progress] of Object.entries(chapterProgress)) {
    if ((progress as { completedAt?: number }).completedAt) {
      chapterCompletions[chapterId] = (chapterCompletions[chapterId] || 0) + 1;
    }
  }
  
  return {
    gameReplay: replay,
    isWin,
    isPersonalBest,
    rank,
    rating,
    foundBooks,
    foundGenres,
    rarityBooksFound,
    totalHintsUsed: replay.totalHintsUsed,
    noHintRounds,
    powerupsUsed: {
      freeHints: state.powerUps.powerUpsUsedTotal.freeHints,
      timePeeks: state.powerUps.powerUpsUsedTotal.timePeeks,
      eliminateWrongs: state.powerUps.powerUpsUsedTotal.eliminateWrongs,
    },
    consecutiveCorrect: state.consecutiveCorrect,
    bestStreak: Math.max(state.streak.currentStreak, pb.longestStreak),
    difficulty: replay.difficultyLevel,
    gameMode: replay.gameMode,
    fastFinds,
    commissionsCompleted: state.commission.totalCommissionsCompleted,
    chaptersCompleted: getCompletedChaptersCount(),
    dailyGamesCompleted: getDailyProgress()?.completed ? 1 : 0,
    rushCompleted: state.rush.completed ? 1 : 0,
    perfectRushCompleted: state.rush.perfectRun ? 1 : 0,
    themeGamesCompleted: state.currentThemeId !== null ? 1 : 0,
    storeLevel: getStoreLevel(),
    coinsEarned: getCoins(),
    coinsSpent: 0,
    booksRepaired: 0,
    collectedBooks: Object.keys(collectionEntries).length,
    dialoguesCompleted: 0,
    roundDetails: replay.rounds,
  };
};

const processGameResult = (context: SettlementContext): GameResultSummary => {
  return {
    replay: context.gameReplay,
    isWin: context.isWin,
    isPersonalBest: context.isPersonalBest,
    rank: context.rank,
    rating: context.rating,
  };
};

const processSeasonProgress = (context: SettlementContext): SeasonProgress => {
  const pb = getPersonalBest();
  const season = getCurrentSeason();
  const weekNumber = getCurrentWeekNumber();
  const leaderboard = getLeaderboard();
  
  const score = context.gameReplay.totalScore;
  const booksFound = context.gameReplay.booksFound;
  
  let weeklyRank: number | undefined;
  let seasonRank: number | undefined;
  
  if (leaderboard.length > 0) {
    const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(e => score >= e.score) + 1;
    weeklyRank = rank === 0 ? sorted.length + 1 : rank;
    seasonRank = weeklyRank;
  }
  
  return {
    seasonId: season.id,
    weekNumber,
    gamesPlayedThisWeek: (getDailyProgress()?.completed ? 1 : 0) + 1,
    gamesPlayedThisSeason: getGamesPlayed() + 1,
    totalScoreThisWeek: (pb.weeklyBestScores[weekNumber] || 0) + score,
    totalScoreThisSeason: (pb.seasonBestScores[season.id] || 0) + score,
    bestScoreThisWeek: Math.max(pb.weeklyBestScores[weekNumber] || 0, score),
    bestScoreThisSeason: Math.max(pb.seasonBestScores[season.id] || 0, score),
    weeklyRank,
    seasonRank,
    totalBooksFoundThisWeek: booksFound,
    totalBooksFoundThisSeason: pb.totalBooksFound + booksFound,
  };
};

const processQuests = (context: SettlementContext): { results: QuestResult[]; rewards: SettlementReward[] } => {
  const conditionCtx = buildGameContext({
    foundBooks: context.foundBooks.length,
    distinctGenres: context.foundGenres.length,
    rarityBooksFound: context.rarityBooksFound,
    gamesCompleted: getGamesPlayed() + 1,
    bestScore: Math.max(getPersonalBest().highestScore, context.gameReplay.totalScore),
    bestStreak: context.bestStreak,
    hintsUsed: context.totalHintsUsed,
    noHintRounds: context.noHintRounds,
    powerupsUsed: context.powerupsUsed.freeHints + context.powerupsUsed.timePeeks + context.powerupsUsed.eliminateWrongs,
    commissionsCompleted: context.commissionsCompleted,
    booksRepaired: context.booksRepaired,
    collectedBooks: context.collectedBooks + context.foundBooks.length,
    chaptersCompleted: context.chaptersCompleted,
    dailyGamesCompleted: context.dailyGamesCompleted + 1,
    rushCompleted: context.rushCompleted,
    perfectRushCompleted: context.perfectRushCompleted,
    themeGamesCompleted: context.themeGamesCompleted,
    coinsEarned: context.coinsEarned,
    storeLevel: context.storeLevel,
    dialoguesCompleted: context.dialoguesCompleted,
    fastFinds: context.fastFinds,
  });
  
  const questResult = updateQuestProgress(conditionCtx);
  
  const results: QuestResult[] = [];
  const rewards: SettlementReward[] = [];
  
  for (const quest of ALL_QUESTS) {
    const progress = questResult.newlyCompleted.includes(quest.id) 
      ? { status: 'completed' as const, currentProgress: quest.maxProgress || 1 }
      : questResult.newlyAvailable.includes(quest.id)
        ? { status: 'newly_available' as const, currentProgress: 0 }
        : null;
    
    if (progress) {
      results.push({
        questId: quest.id,
        questTitle: quest.title,
        category: quest.category,
        status: progress.status,
        progress: progress.currentProgress,
        maxProgress: quest.maxProgress || 1,
        rewards: quest.rewards,
        claimed: false,
      });
      
      for (const reward of quest.rewards) {
        if (reward.type === 'coins') {
          rewards.push({
            type: 'coins',
            value: reward.value,
            label: `任务奖励: ${quest.title}`,
            icon: '💰',
          });
        } else if (reward.type === 'score') {
          rewards.push({
            type: 'score',
            value: reward.value,
            label: `任务奖励: ${quest.title}`,
            icon: '🎯',
          });
        } else if (reward.type === 'hints') {
          rewards.push({
            type: 'hints',
            value: reward.value,
            label: `任务奖励: ${quest.title}`,
            icon: '💡',
          });
        } else if (reward.type === 'powerup' && reward.powerUpType) {
          rewards.push({
            type: 'powerup',
            value: reward.value,
            label: `任务奖励: ${quest.title}`,
            icon: '⚡',
            powerUpType: reward.powerUpType,
          });
        } else if (reward.type === 'title' && reward.titleId) {
          rewards.push({
            type: 'title',
            value: 1,
            label: `称号解锁: ${reward.titleId}`,
            icon: '👑',
            titleId: reward.titleId,
          });
        } else if (reward.type === 'achievement' && reward.achievementId) {
          rewards.push({
            type: 'achievement',
            value: 1,
            label: `成就解锁: ${reward.achievementId}`,
            icon: '🏆',
            achievementId: reward.achievementId,
          });
        }
      }
    }
  }
  
  const pendingRewards = consumePendingQuestRewards();
  for (const reward of pendingRewards) {
    if (reward.type === 'coins') {
      rewards.push({
        type: 'coins',
        value: reward.value,
        label: '待领取奖励',
        icon: '💰',
      });
    } else if (reward.type === 'score') {
      rewards.push({
        type: 'score',
        value: reward.value,
        label: '待领取奖励',
        icon: '🎯',
      });
    }
  }
  
  consumePendingTitleUnlocks();
  consumePendingAchievementUnlocks();
  
  return { results, rewards };
};

const processAchievements = (context: SettlementContext): { results: AchievementResult[]; rewards: SettlementReward[] } => {
  const results: AchievementResult[] = [];
  const rewards: SettlementReward[] = [];
  
  const unlockedAchievements = [...getUnlockedAchievements()];
  const allProgress = safeGetAllAchievementProgress();
  const newProgress: Record<string, AchievementProgress> = { ...allProgress };
  const newlyUnlocked: string[] = [];
  const newStageUnlocks: string[] = [];
  
  const checkAchievement = (achievement: Achievement): boolean => {
    if (unlockedAchievements.includes(achievement.id)) return false;
    
    let met = false;
    let progressValue = 0;
    
    switch (achievement.id) {
      case 'first_book':
        met = context.foundBooks.length >= 1;
        progressValue = context.foundBooks.length;
        break;
      case 'bookworm':
        progressValue = getPersonalBest().totalBooksFound + context.foundBooks.length;
        met = progressValue >= 1;
        break;
      case 'speed_reader':
        met = context.gameReplay.rounds.some(r => r.findTime <= 30);
        progressValue = met ? 1 : 0;
        break;
      case 'no_hints':
        met = context.noHintRounds >= 1 && context.foundBooks.length >= 1;
        progressValue = met ? 1 : 0;
        break;
      case 'clue_collector':
        met = context.gameReplay.rounds.some(r => r.unlockedClueTypes.length >= 7);
        progressValue = met ? 1 : 0;
        break;
      case 'perfect_round':
        met = context.foundBooks.length >= 3;
        progressValue = context.foundBooks.length;
        break;
      case 'time_master':
        met = context.isWin && context.gameReplay.totalTimeUsed < context.gameReplay.totalTimeUsed + 60;
        progressValue = met ? 1 : 0;
        break;
      case 'history_buff':
        met = context.foundGenres.includes('历史');
        progressValue = met ? 1 : 0;
        break;
      case 'sci_fi_fan':
        met = context.foundGenres.includes('科幻');
        progressValue = met ? 1 : 0;
        break;
      case 'veteran':
        progressValue = getGamesPlayed() + 1;
        met = progressValue >= 1;
        break;
      case 'streak_master':
        progressValue = context.bestStreak;
        met = progressValue >= 1;
        break;
      case 'collector':
        progressValue = context.collectedBooks + context.foundBooks.length;
        met = progressValue >= 1;
        break;
      case 'genre_master':
        progressValue = context.foundGenres.length;
        met = progressValue >= 5;
        break;
      case 'personal_best_score':
        met = context.isPersonalBest;
        progressValue = met ? 1 : 0;
        break;
      case 'speed_demon':
        met = context.gameReplay.rounds.some(r => r.findTime < 10);
        progressValue = met ? 1 : 0;
        break;
      case 'purist':
        met = (context.powerupsUsed.freeHints + context.powerupsUsed.timePeeks + context.powerupsUsed.eliminateWrongs) === 0 && context.foundBooks.length >= 1;
        progressValue = met ? 1 : 0;
        break;
      default:
        return false;
    }
    
    if (achievement.type === 'progressive' && achievement.stages) {
      const existingProgress = newProgress[achievement.id] || {
        achievementId: achievement.id,
        currentProgress: 0,
        unlockedStages: [],
      };
      
      const newStages: string[] = [];
      const now = Date.now();
      const stageUnlockTimes = { ...(existingProgress.stageUnlockTimes || {}) };
      
      for (const stage of achievement.stages) {
        if (progressValue >= stage.threshold && !existingProgress.unlockedStages.includes(stage.id)) {
          newStages.push(stage.id);
          stageUnlockTimes[stage.id] = now;
          newStageUnlocks.push(achievement.id);
        }
      }
      
      const isCompleted = achievement.stages.length > 0 &&
        progressValue >= achievement.stages[achievement.stages.length - 1].threshold;
      
      if (newStages.length > 0 || progressValue > existingProgress.currentProgress) {
        newProgress[achievement.id] = {
          ...existingProgress,
          currentProgress: Math.min(progressValue, achievement.maxProgress || progressValue),
          unlockedStages: [...existingProgress.unlockedStages, ...newStages],
          stageUnlockTimes,
          unlockedAt: existingProgress.unlockedAt || (newStages.length > 0 ? now : undefined),
          completedAt: isCompleted && !existingProgress.completedAt ? now : existingProgress.completedAt,
        };
        
        results.push({
          achievementId: achievement.id,
          achievementTitle: achievement.title,
          achievementIcon: achievement.icon,
          type: achievement.type,
          status: newStages.length > 0 ? 'stage_unlocked' : 'progress_updated',
          progress: newProgress[achievement.id],
          newStages,
        });
        
        rewards.push({
          type: 'achievement',
          value: newStages.length,
          label: `成就进度: ${achievement.title}`,
          icon: achievement.icon,
          achievementId: achievement.id,
        });
      }
      
      if (isCompleted && !unlockedAchievements.includes(achievement.id)) {
        unlockedAchievements.push(achievement.id);
        newlyUnlocked.push(achievement.id);
      }
      
      return newStages.length > 0;
    }
    
    if (met && !unlockedAchievements.includes(achievement.id)) {
      const now = Date.now();
      const progress: AchievementProgress = {
        achievementId: achievement.id,
        currentProgress: 1,
        unlockedStages: [],
        unlockedAt: now,
        completedAt: now,
      };
      
      newProgress[achievement.id] = progress;
      unlockedAchievements.push(achievement.id);
      newlyUnlocked.push(achievement.id);
      
      results.push({
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        achievementIcon: achievement.icon,
        type: achievement.type,
        status: 'newly_unlocked',
        progress,
      });
      
      rewards.push({
        type: 'achievement',
        value: 1,
        label: `成就解锁: ${achievement.title}`,
        icon: achievement.icon,
        achievementId: achievement.id,
      });
      
      return true;
    }
    
    return false;
  };
  
  for (const achievement of ACHIEVEMENTS) {
    checkAchievement(achievement);
  }
  
  if (newlyUnlocked.length > 0 || Object.keys(newProgress).length > 0) {
    saveAllAchievementProgress(newProgress);
    saveUnlockedAchievements(unlockedAchievements);
  }
  
  return { results, rewards };
};

const processCodex = (context: SettlementContext): { unlocks: CodexUnlock[]; rewards: SettlementReward[] } => {
  const unlocks: CodexUnlock[] = [];
  const rewards: SettlementReward[] = [];
  const collectionEntries = getAllCollectionEntries();
  
  for (const round of context.roundDetails) {
    const bookId = round.targetBookId;
    const book = BOOKS.find(b => b.id === bookId);
    if (!book) continue;
    
    const isFirstDiscovery = !collectionEntries[bookId];
    
    updateCollectionEntry(bookId, round.scoreEarned, round.findTime, round.hintsUsed);
    
    saveBookCodexEntry(bookId, {
      totalTimesFound: 1,
      bestScore: round.scoreEarned,
      bestScoreDate: Date.now(),
      fastestFind: round.findTime,
      fastestFindDate: Date.now(),
      fewestHints: round.hintsUsed,
      fewestHintsDate: Date.now(),
      relatedAchievements: [],
    });
    
    const author = getAuthorByBookId(bookId);
    if (author) {
      const codexProgress = getCodexProgress();
      const isNewAuthor = !codexProgress.discoveredAuthorIds.includes(author.id);
      
      saveAuthorCodexEntry(author.id, {
        booksRead: [bookId],
        triviaUnlocked: [`${author.id}_trivia_0`],
        quotesUnlocked: [`${author.id}_quote_0`],
      });
      
      if (isNewAuthor) {
        unlocks.push({
          type: 'author',
          id: author.id,
          name: author.name,
          icon: '✍️',
          isFirstDiscovery: true,
        });
        
        rewards.push({
          type: 'achievement',
          value: 1,
          label: `作者解锁: ${author.name}`,
          icon: '✍️',
        });
      }
    }
    
    let rarity: DiscoveryRecord['rarity'] = 'common';
    if (book.rarity === 'epic') rarity = 'epic';
    else if (book.rarity === 'legendary') rarity = 'legendary';
    else if (book.rarity === 'rare') rarity = 'rare';
    else if (book.rarity === 'uncommon') rarity = 'uncommon';
    
    const timeRating = round.findTime < 10 ? '闪电般' : round.findTime < 30 ? '快速' : round.findTime < 60 ? '从容' : '耐心';
    const hintRating = round.hintsUsed === 0 ? '完全凭借自己的智慧' : 
                       round.hintsUsed === 1 ? '只使用了一次提示' : 
                       `使用了${round.hintsUsed}次提示`;
    const narrative = `你在${timeRating}的时间内，${hintRating}，发现了《${book.title}》这本${book.genre}杰作。得分${round.scoreEarned}分，这是一次出色的发现！`;
    
    const record = createDiscoveryRecord(
      bookId,
      isFirstDiscovery ? 'first_find' : 'special_event',
      { score: round.scoreEarned, timeUsed: round.findTime, hintsUsed: round.hintsUsed, difficulty: context.difficulty },
      rarity,
      narrative
    );
    
    saveDiscoveryRecord(record);
    
    unlocks.push({
      type: 'book',
      id: bookId,
      name: book.title,
      icon: '📚',
      rarity,
      isFirstDiscovery,
      discoveryRecord: record,
    });
    
    if (isFirstDiscovery) {
      rewards.push({
        type: 'score',
        value: Math.floor(round.scoreEarned * 0.1),
        label: `首次发现奖励: ${book.title}`,
        icon: '🎉',
      });
    }
    
    if (round.hintsUsed === 0 && isFirstDiscovery) {
      unlocks.push({
        type: 'book',
        id: `${bookId}_perfect`,
        name: `${book.title} (完美发现)`,
        icon: '🏆',
        rarity: 'legendary',
        isFirstDiscovery: true,
      });
      
      rewards.push({
        type: 'score',
        value: Math.floor(round.scoreEarned * 0.2),
        label: `完美发现奖励: ${book.title}`,
        icon: '🏆',
      });
    }
    
    if (round.findTime < 10 && isFirstDiscovery) {
      unlocks.push({
        type: 'book',
        id: `${bookId}_speed`,
        name: `${book.title} (速度记录)`,
        icon: '⚡',
        rarity: 'epic',
        isFirstDiscovery: true,
      });
      
      rewards.push({
        type: 'score',
        value: 100,
        label: `速度记录奖励: ${book.title}`,
        icon: '⚡',
      });
    }
  }
  
  for (const theme of THEME_COLLECTIONS) {
    const oldProgress = getCodexProgress().completedThemeIds.includes(theme.id);
    checkThemeCollectionCompletion(theme.id);
    const newProgress = getCodexProgress().completedThemeIds.includes(theme.id);
    
    if (!oldProgress && newProgress) {
      unlocks.push({
        type: 'theme',
        id: theme.id,
        name: theme.name,
        icon: '🎨',
        isFirstDiscovery: true,
      });
      
      rewards.push({
        type: 'score',
        value: 500,
        label: `主题收集完成: ${theme.name}`,
        icon: '🎨',
      });
    }
  }
  
  const newlyUnlockedEggs = checkAllEasterEggs();
  for (const eggId of newlyUnlockedEggs) {
    const egg = EASTER_EGGS.find(e => e.id === eggId);
    if (egg) {
      unlocks.push({
        type: 'easter_egg',
        id: eggId,
        name: egg.name,
        icon: '🥚',
        rarity: 'legendary',
        isFirstDiscovery: true,
      });
      
      rewards.push({
        type: 'score',
        value: 200,
        label: `复活节彩蛋: ${egg.name}`,
        icon: '🥚',
      });
    }
  }
  
  return { unlocks, rewards };
};

const calculateActivityBonuses = (context: SettlementContext): SettlementReward[] => {
  const rewards: SettlementReward[] = [];
  const activityBonuses = getActivityIntegrationBonuses();
  
  const coinBonus = activityBonuses.bonusPerBook.coins * context.gameReplay.booksFound;
  if (coinBonus > 0) {
    rewards.push({
      type: 'coins',
      value: coinBonus,
      label: '活动金币加成',
      icon: '🎪',
    });
  }
  
  if (activityBonuses.scoreMultiplier > 1) {
    const bonusScore = Math.floor(context.gameReplay.totalScore * (activityBonuses.scoreMultiplier - 1));
    rewards.push({
      type: 'score',
      value: bonusScore,
      label: `活动得分加成 x${activityBonuses.scoreMultiplier.toFixed(2)}`,
      icon: '🎪',
    });
  }
  
  return rewards;
};

const buildSettlementData = (
  gameResult: GameResultSummary,
  seasonProgress: SeasonProgress,
  questResults: QuestResult[],
  achievementResults: AchievementResult[],
  codexUnlocks: CodexUnlock[],
  allRewards: SettlementReward[]
): SettlementData => {
  const totalScore = allRewards
    .filter(r => r.type === 'score')
    .reduce((sum, r) => sum + r.value, 0) + gameResult.replay.totalScore;
  
  const totalCoins = allRewards
    .filter(r => r.type === 'coins')
    .reduce((sum, r) => sum + r.value, 0);
  
  return {
    id: `settlement_${Date.now()}`,
    timestamp: Date.now(),
    gameResult,
    seasonProgress,
    questResults,
    achievementResults,
    codexUnlocks,
    totalRewards: allRewards,
    summary: {
      totalScore,
      totalCoins,
      newUnlocksCount: codexUnlocks.filter(u => u.isFirstDiscovery).length,
      achievementsUnlocked: achievementResults.filter(a => a.status === 'newly_unlocked').length,
      questsCompleted: questResults.filter(q => q.status === 'completed').length,
    },
  };
};

export const processSettlement = async (
  replay: GameReplayData,
  isWin: boolean,
  isPersonalBest: boolean,
  rank?: number,
  rating?: string
): Promise<SettlementData> => {
  setSettlementState(prev => ({ ...prev, isProcessing: true }));
  
  try {
    const context = buildSettlementContext(replay, isWin, isPersonalBest, rank, rating);
    
    const gameResult = processGameResult(context);
    const seasonProgress = processSeasonProgress(context);
    const { results: questResultsData, rewards: questRewards } = processQuests(context);
    const { results: achievementResultsData, rewards: achievementRewards } = processAchievements(context);
    const { unlocks: codexUnlocksData, rewards: codexRewards } = processCodex(context);
    const activityRewards = calculateActivityBonuses(context);
    
    const allRewards = [...questRewards, ...achievementRewards, ...codexRewards, ...activityRewards];
    
    processGameEnd(
      replay.totalScore,
      replay.booksFound,
      replay.totalHintsUsed,
      replay.rounds.filter(r => r.hintsUsed === 0).length === replay.booksFound
    );
    
    recordGameComplete(
      replay.totalScore,
      replay.booksFound,
      replay.totalTimeUsed,
      replay.totalHintsUsed,
      replay.difficultyLevel,
      replay.gameMode,
      isWin,
      replay.streak.currentStreak,
      isPersonalBest,
      rating,
      replay.id
    );
    
    const settlementData = buildSettlementData(
      gameResult,
      seasonProgress,
      questResultsData,
      achievementResultsData,
      codexUnlocksData,
      allRewards
    );
    
    setQuestResults(questResultsData);
    setAchievementResults(achievementResultsData);
    setCodexUnlocks(codexUnlocksData);
    setTotalRewards(allRewards);
    
    setSettlementState(prev => ({
      ...prev,
      settlementData,
      isProcessing: false,
      showRewardAnimations: true,
    }));
    
    return settlementData;
  } catch (error) {
    console.error('Settlement processing failed:', error);
    setSettlementState(prev => ({ ...prev, isProcessing: false }));
    throw error;
  }
};

export const showSettlementCenter = async (
  replay: GameReplayData,
  isWin: boolean,
  isPersonalBest: boolean,
  rank?: number,
  rating?: string
): Promise<void> => {
  await processSettlement(replay, isWin, isPersonalBest, rank, rating);
  openSettlement('overview');
};

export const getSettlementInfo = createMemo(() => {
  const state = settlementState();
  return {
    isVisible: state.isVisible,
    activeTab: state.activeTab,
    settlementData: state.settlementData,
    isProcessing: state.isProcessing,
    showRewardAnimations: state.showRewardAnimations,
    questResults: questResults(),
    achievementResults: achievementResults(),
    codexUnlocks: codexUnlocks(),
    totalRewards: totalRewards(),
  };
});

export {
  openSettlement,
  closeSettlement,
  setActiveTab,
  buildSettlementContext,
  processGameResult,
  processSeasonProgress,
  processQuests,
  processAchievements,
  processCodex,
};
