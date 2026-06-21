import type {
  ExhibitionProgress,
  ExhibitionStats,
  ExhibitionIntegration,
  ExhibitionGameResult,
  ActivityReward,
  LimitedCollectionReward,
  RuleAdjustment
} from '../types/touringExhibition';
import type { Book, RarityLevel, DifficultyLevel } from '../types/game';
import {
  getActiveExhibitions,
  getExhibitionById
} from '../data/touringExhibition';
import { getTodayDateKey } from '../data/dailyChallenge';

export const EXHIBITION_PROGRESS_KEY = 'old_bookstore_exhibition_progress';
export const EXHIBITION_STATS_KEY = 'old_bookstore_exhibition_stats';

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
  }
}

export const getDefaultExhibitionProgress = (): Record<string, ExhibitionProgress> => ({});

export const getDefaultExhibitionStats = (): ExhibitionStats => ({
  totalExhibitionsParticipated: 0,
  totalExhibitionsCompleted: 0,
  totalCollectionPoints: 0,
  totalExhibitionRewardsClaimed: 0,
  totalLimitedBooksCollected: 0,
  currentExhibitionStreak: 0,
  longestExhibitionStreak: 0,
});

export const getExhibitionProgress = (): Record<string, ExhibitionProgress> => {
  return _readJSON<Record<string, ExhibitionProgress>>(EXHIBITION_PROGRESS_KEY, getDefaultExhibitionProgress());
};

export const saveExhibitionProgress = (progress: Record<string, ExhibitionProgress>): void => {
  _writeJSON(EXHIBITION_PROGRESS_KEY, progress);
};

export const getExhibitionStats = (): ExhibitionStats => {
  return _readJSON<ExhibitionStats>(EXHIBITION_STATS_KEY, getDefaultExhibitionStats());
};

export const saveExhibitionStats = (stats: ExhibitionStats): void => {
  _writeJSON(EXHIBITION_STATS_KEY, stats);
};

export const computeExhibitionIntegration = (
  progress: Record<string, ExhibitionProgress>
): ExhibitionIntegration => {
  const todayKey = getTodayDateKey();
  const activeExhibitions = getActiveExhibitions(todayKey);

  let scoreMultiplier = 1;
  let coinMultiplier = 1;
  let hintBonus = 0;
  let timeBonus = 0;
  let rarityBoost: RarityLevel | null = null;
  let difficultyAdjust: DifficultyLevel | null = null;
  let activeExhibitionId: string | null = null;
  let activeExhibitionTitle: string | null = null;
  let bonusCoinsPerBook = 0;
  let bonusScorePerBook = 0;
  let bonusPointsPerBook = 0;

  for (const exhibition of activeExhibitions) {
    const exProgress = progress[exhibition.id];
    if (exProgress && exProgress.completed) continue;

    if (!activeExhibitionId) {
      activeExhibitionId = exhibition.id;
      activeExhibitionTitle = exhibition.title;
    }

    for (const rule of exhibition.ruleAdjustments) {
      switch (rule.effectType) {
        case 'score_multiplier':
          scoreMultiplier = Math.max(scoreMultiplier, rule.value);
          break;
        case 'coin_multiplier':
          coinMultiplier = Math.max(coinMultiplier, rule.value);
          break;
        case 'hint_count':
          hintBonus = Math.max(hintBonus, rule.value);
          break;
        case 'time_bonus':
          timeBonus = Math.max(timeBonus, rule.value);
          break;
        case 'rarity_boost':
          if (rule.value > 0) {
            const rarities: RarityLevel[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            const boostLevel = Math.min(rule.value, rarities.length - 1);
            rarityBoost = rarities[boostLevel];
          }
          break;
        case 'difficulty_adjust':
          if (rule.value > 0) {
            const difficulties: DifficultyLevel[] = ['easy', 'normal', 'hard', 'expert', 'master'];
            const diffLevel = Math.min(rule.value, difficulties.length - 1);
            difficultyAdjust = difficulties[diffLevel];
          }
          break;
      }
    }
  }

  return {
    scoreMultiplier,
    coinMultiplier,
    hintBonus,
    timeBonus,
    activeExhibitionId,
    activeExhibitionTitle,
    rarityBoost,
    difficultyAdjust,
    bonusPerBook: {
      coins: bonusCoinsPerBook,
      score: bonusScorePerBook,
      points: bonusPointsPerBook,
    },
  };
};

export const updateExhibitionProgress = (
  progress: Record<string, ExhibitionProgress>,
  book: Book,
  bookScore: number
): {
  progress: Record<string, ExhibitionProgress>;
  completedIds: string[];
  unlockedCollections: string[];
} => {
  const todayKey = getTodayDateKey();
  const activeExhibitions = getActiveExhibitions(todayKey);
  const completedIds: string[] = [];
  const unlockedCollections: string[] = [];
  const updatedProgress = { ...progress };

  for (const exhibition of activeExhibitions) {
    if (!exhibition.bookIds.includes(book.id)) continue;

    const existing = updatedProgress[exhibition.id] || {
      foundBookIds: [],
      currentProgress: 0,
      totalScore: 0,
      collectionPoints: 0,
      completed: false,
      claimed: false,
      collectedBookIds: [],
      scoreMultiplier: 1,
      coinMultiplier: 1,
    };

    if (existing.foundBookIds.includes(book.id)) continue;

    const newFoundBookIds = [...existing.foundBookIds, book.id];
    const newProgress = newFoundBookIds.length;
    const newTotalScore = existing.totalScore + bookScore;
    const newCollectionPoints = existing.collectionPoints + getCollectionPointsForBook(book, exhibition.ruleAdjustments);
    const isCompleted = newProgress >= exhibition.requiredBooks;

    for (const collection of exhibition.limitedCollection) {
      if (!existing.collectedBookIds.includes(collection.bookId) && newProgress >= collection.unlockThreshold) {
        unlockedCollections.push(collection.id);
      }
    }

    let scoreMult = existing.scoreMultiplier;
    let coinMult = existing.coinMultiplier;
    for (const rule of exhibition.ruleAdjustments) {
      if (rule.effectType === 'score_multiplier') {
        if (!rule.condition || (rule.condition && book.genre && rule.condition.includes(book.genre))) {
          scoreMult = Math.max(scoreMult, rule.value);
        }
      }
      if (rule.effectType === 'coin_multiplier') {
        coinMult = Math.max(coinMult, rule.value);
      }
    }

    updatedProgress[exhibition.id] = {
      ...existing,
      foundBookIds: newFoundBookIds,
      currentProgress: newProgress,
      totalScore: newTotalScore,
      collectionPoints: newCollectionPoints,
      completed: isCompleted,
      completedAt: isCompleted && !existing.completed ? Date.now() : existing.completedAt,
      collectedBookIds: [
        ...existing.collectedBookIds,
        ...unlockedCollections
          .filter(cid => !existing.collectedBookIds.includes(exhibition.limitedCollection.find(lc => lc.id === cid)?.bookId || ''))
          .map(cid => exhibition.limitedCollection.find(lc => lc.id === cid)?.bookId || '')
          .filter(Boolean)
      ],
      scoreMultiplier: scoreMult,
      coinMultiplier: coinMult,
    };

    if (isCompleted && !existing.completed) {
      completedIds.push(exhibition.id);
    }
  }

  return { progress: updatedProgress, completedIds, unlockedCollections };
};

function getCollectionPointsForBook(book: Book, _rules: RuleAdjustment[]): number {
  let basePoints = 10;
  const rarityMultipliers: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 8,
    legendary: 16,
  };
  basePoints *= rarityMultipliers[book.rarity] || 1;
  return basePoints;
}

export const processBookFoundForExhibitions = (
  progress: Record<string, ExhibitionProgress>,
  stats: ExhibitionStats,
  book: Book,
  score: number
): {
  progress: Record<string, ExhibitionProgress>;
  stats: ExhibitionStats;
  result: ExhibitionGameResult;
} => {
  let updatedProgress = progress;
  let updatedStats = stats;
  const completedExhibitionIds: string[] = [];
  const unlockedCollectionIds: string[] = [];
  let exhibitionPointsEarned = 0;
  let exhibitionScoreBonus = 0;
  let exhibitionCoinBonus = 0;

  const result = updateExhibitionProgress(updatedProgress, book, score);
  updatedProgress = result.progress;
  completedExhibitionIds.push(...result.completedIds);
  unlockedCollectionIds.push(...result.unlockedCollections);

  const integration = computeExhibitionIntegration(updatedProgress);
  exhibitionScoreBonus = Math.floor(score * (integration.scoreMultiplier - 1));
  exhibitionCoinBonus = Math.floor(score * 0.1 * (integration.coinMultiplier - 1));

  const todayKey = getTodayDateKey();
  const activeExhibitions = getActiveExhibitions(todayKey);
  for (const exhibition of activeExhibitions) {
    const exProgress = updatedProgress[exhibition.id];
    if (exProgress) {
      exhibitionPointsEarned += exProgress.collectionPoints;
    }
  }

  const participatedExhibitions = Object.keys(updatedProgress).filter(k => {
    const p = updatedProgress[k];
    return p.currentProgress > 0;
  }).length;
  updatedStats.totalExhibitionsParticipated = Math.max(updatedStats.totalExhibitionsParticipated, participatedExhibitions);

  if (completedExhibitionIds.length > 0) {
    updatedStats.totalExhibitionsCompleted += completedExhibitionIds.length;
  }

  if (unlockedCollectionIds.length > 0) {
    updatedStats.totalLimitedBooksCollected += unlockedCollectionIds.length;
  }

  updatedStats.totalCollectionPoints = Object.values(updatedProgress).reduce(
    (sum, p) => sum + p.collectionPoints, 0
  );

  const gameResult: ExhibitionGameResult = {
    exhibitionPointsEarned,
    exhibitionScoreBonus,
    exhibitionCoinBonus,
    completedExhibitionIds,
    unlockedCollectionIds,
    scoreMultiplier: integration.scoreMultiplier,
    coinMultiplier: integration.coinMultiplier,
  };

  return { progress: updatedProgress, stats: updatedStats, result: gameResult };
};

export const claimExhibitionReward = (
  progress: Record<string, ExhibitionProgress>,
  stats: ExhibitionStats,
  exhibitionId: string
): {
  progress: Record<string, ExhibitionProgress>;
  stats: ExhibitionStats;
  success: boolean;
  rewards: ActivityReward[];
} => {
  const updatedProgress = { ...progress };
  const updatedStats = { ...stats };
  let rewards: ActivityReward[] = [];
  let success = false;

  const exProgress = updatedProgress[exhibitionId];
  if (exProgress && exProgress.completed && !exProgress.claimed) {
    const exhibition = getExhibitionById(exhibitionId);
    if (exhibition && exhibition.completionReward) {
      rewards = exhibition.completionReward;
      updatedProgress[exhibitionId] = {
        ...exProgress,
        claimed: true,
        claimedAt: Date.now(),
      };
      success = true;
    }
  }

  if (success) {
    updatedStats.totalExhibitionRewardsClaimed += 1;
  }

  return { progress: updatedProgress, stats: updatedStats, success, rewards };
};

export const getUnclaimedExhibitionRewardsCount = (
  progress: Record<string, ExhibitionProgress>
): number => {
  let count = 0;
  for (const exProgress of Object.values(progress)) {
    if (exProgress.completed && !exProgress.claimed) count++;
  }
  return count;
};

export const getLimitedCollectionForExhibition = (
  exhibitionId: string,
  progress: Record<string, ExhibitionProgress>
): (LimitedCollectionReward & { unlocked: boolean })[] => {
  const exhibition = getExhibitionById(exhibitionId);
  if (!exhibition) return [];

  const exProgress = progress[exhibitionId];
  const currentProgress = exProgress?.currentProgress || 0;

  return exhibition.limitedCollection.map(collection => ({
    ...collection,
    unlocked: currentProgress >= collection.unlockThreshold,
  }));
};

export const clearExhibitionData = (): void => {
  localStorage.removeItem(EXHIBITION_PROGRESS_KEY);
  localStorage.removeItem(EXHIBITION_STATS_KEY);
};
