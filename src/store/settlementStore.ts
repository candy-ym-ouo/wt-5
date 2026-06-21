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
import { pendingQuestRewards, questState } from './questStore';
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
  safeGetAllAchievementProgress,
} from '../utils/storage';
import { recordGameComplete } from './accountStore';
import { ALL_QUESTS } from '../data/quests';
import { ACHIEVEMENTS } from '../data/achievements';
import { BOOKS } from '../data/books';
import { THEME_COLLECTIONS, EASTER_EGGS, getAuthorByBookId } from '../data/codex';
import {
  getCodexProgress,
  getBookCodexEntries,
  getAuthorCodexEntries,
  getDiscoveryRecords,
} from '../utils/codexStorage';
import type { GameReplayData } from '../types/game';
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
  const results: QuestResult[] = [];
  const rewards: SettlementReward[] = [];
  
  const gameStartTime = context.gameReplay.startTime;
  const allProgress = questState().questProgress;
  
  for (const quest of ALL_QUESTS) {
    const progress = allProgress[quest.id];
    if (!progress) continue;
    
    const isNewlyCompleted = progress.status === 'completed' && progress.completedAt && progress.completedAt >= gameStartTime;
    const isNewlyAvailable = progress.status === 'available' && progress.unlockedAt && progress.unlockedAt >= gameStartTime;
    
    if (isNewlyCompleted || isNewlyAvailable) {
      results.push({
        questId: quest.id,
        questTitle: quest.title,
        category: quest.category,
        status: isNewlyCompleted ? 'completed' : 'newly_available',
        progress: progress.currentProgress,
        maxProgress: quest.maxProgress || 1,
        rewards: quest.rewards,
        claimed: false,
      });
      
      if (isNewlyCompleted) {
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
  }
  
  const pendingRewards = pendingQuestRewards();
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
  
  return { results, rewards };
};

const processAchievements = (context: SettlementContext): { results: AchievementResult[]; rewards: SettlementReward[] } => {
  const results: AchievementResult[] = [];
  const rewards: SettlementReward[] = [];
  
  const gameStartTime = context.gameReplay.startTime;
  const allProgress = safeGetAllAchievementProgress();
  
  for (const achievement of ACHIEVEMENTS) {
    const progress = allProgress[achievement.id];
    if (!progress) continue;
    
    const isNewlyUnlocked = progress.unlockedAt && progress.unlockedAt >= gameStartTime;
    const isNewlyCompleted = progress.completedAt && progress.completedAt >= gameStartTime;
    
    let newStages: string[] = [];
    if (achievement.type === 'progressive' && achievement.stages && progress.stageUnlockTimes) {
      newStages = achievement.stages
        .filter(stage => {
          const unlockTime = progress.stageUnlockTimes![stage.id];
          return unlockTime && unlockTime >= gameStartTime;
        })
        .map(stage => stage.id);
    }
    
    if (isNewlyUnlocked || isNewlyCompleted || newStages.length > 0) {
      let status: 'newly_unlocked' | 'stage_unlocked' | 'progress_updated' = 'progress_updated';
      if (isNewlyUnlocked && achievement.type !== 'progressive') {
        status = 'newly_unlocked';
      } else if (newStages.length > 0) {
        status = 'stage_unlocked';
      }
      
      results.push({
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        achievementIcon: achievement.icon,
        type: achievement.type,
        status,
        progress,
        newStages,
      });
      
      if (isNewlyUnlocked || newStages.length > 0) {
        rewards.push({
          type: 'achievement',
          value: newStages.length > 0 ? newStages.length : 1,
          label: `成就${newStages.length > 0 ? '阶段解锁' : '解锁'}: ${achievement.title}`,
          icon: achievement.icon,
          achievementId: achievement.id,
        });
      }
    }
  }
  
  return { results, rewards };
};

const processCodex = (context: SettlementContext): { unlocks: CodexUnlock[]; rewards: SettlementReward[] } => {
  const unlocks: CodexUnlock[] = [];
  const rewards: SettlementReward[] = [];
  
  const gameStartTime = context.gameReplay.startTime;
  
  const bookEntries = getBookCodexEntries();
  const authorEntries = getAuthorCodexEntries();
  const allDiscoveryRecords = getDiscoveryRecords();
  const codexProgress = getCodexProgress();
  
  for (const round of context.roundDetails) {
    const bookId = round.targetBookId;
    const book = BOOKS.find(b => b.id === bookId);
    if (!book) continue;
    
    const bookEntry = bookEntries[bookId];
    const isFirstDiscovery = bookEntry && bookEntry.firstFoundAt >= gameStartTime;
    
    let rarity: DiscoveryRecord['rarity'] = 'common';
    if (book.rarity === 'epic') rarity = 'epic';
    else if (book.rarity === 'legendary') rarity = 'legendary';
    else if (book.rarity === 'rare') rarity = 'rare';
    else if (book.rarity === 'uncommon') rarity = 'uncommon';
    
    const discoveryRecord = allDiscoveryRecords.find(
      r => r.bookId === bookId && r.timestamp >= gameStartTime
    );
    
    unlocks.push({
      type: 'book',
      id: bookId,
      name: book.title,
      icon: '📚',
      rarity,
      isFirstDiscovery,
      discoveryRecord,
    });
    
    if (isFirstDiscovery) {
      rewards.push({
        type: 'score',
        value: Math.floor(round.scoreEarned * 0.1),
        label: `首次发现奖励: ${book.title}`,
        icon: '🎉',
      });
    }
    
    const author = getAuthorByBookId(bookId);
    if (author) {
      const authorEntry = authorEntries[author.id];
      const isNewAuthor = authorEntry && authorEntry.discoveredAt >= gameStartTime;
      
      if (isNewAuthor && !unlocks.some(u => u.id === author.id)) {
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
    const isCompleted = codexProgress.completedThemeIds.includes(theme.id);
    if (isCompleted) {
      const alreadyAdded = unlocks.some(u => u.id === theme.id);
      if (!alreadyAdded) {
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
  }
  
  for (const eggId of codexProgress.foundEasterEggIds) {
    const egg = EASTER_EGGS.find(e => e.id === eggId);
    if (egg) {
      const alreadyAdded = unlocks.some(u => u.id === eggId);
      if (!alreadyAdded) {
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
