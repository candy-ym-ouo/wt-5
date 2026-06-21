import type { ActivityProgress, ActivityStats, ActivityIntegration, ActivityGameResult, ActivityReward } from '../types/activity';
import type { Book, RarityLevel } from '../types/game';
import { getActiveLimitedThemeLists, getActiveFestivalChallenges, getActivePointsRewardSystems, ACTIVITY_ACHIEVEMENTS, LIMITED_THEME_LISTS, FESTIVAL_CHALLENGES, POINTS_REWARD_SYSTEMS } from '../data/activities';
import { getTodayDateKey } from '../data/dailyChallenge';

export const ACTIVITY_PROGRESS_KEY = 'old_bookstore_activity_progress';
export const ACTIVITY_STATS_KEY = 'old_bookstore_activity_stats';
export const ACTIVITY_POPUP_KEY = 'old_bookstore_activity_popup';

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

export const getDefaultActivityProgress = (): ActivityProgress => ({
  limitedThemeProgress: {},
  festivalChallengeProgress: {},
  pointsRewardProgress: {},
  activityAchievements: {},
  claimedRewards: [],
  lastActivityCheck: '',
});

export const getDefaultActivityStats = (): ActivityStats => ({
  totalActivitiesCompleted: 0,
  totalFestivalsParticipated: 0,
  totalPointsEarned: 0,
  totalActivityRewardsClaimed: 0,
  totalActivityAchievementsUnlocked: 0,
  currentActivityStreak: 0,
  longestActivityStreak: 0,
});

export const getActivityProgress = (): ActivityProgress => {
  return _readJSON<ActivityProgress>(ACTIVITY_PROGRESS_KEY, getDefaultActivityProgress());
};

export const saveActivityProgress = (progress: ActivityProgress): void => {
  _writeJSON(ACTIVITY_PROGRESS_KEY, progress);
};

export const getActivityStats = (): ActivityStats => {
  return _readJSON<ActivityStats>(ACTIVITY_STATS_KEY, getDefaultActivityStats());
};

export const saveActivityStats = (stats: ActivityStats): void => {
  _writeJSON(ACTIVITY_STATS_KEY, stats);
};

export const updateLimitedThemeProgress = (
  progress: ActivityProgress,
  bookId: string,
  bookScore: number
): { progress: ActivityProgress; completedIds: string[] } => {
  const todayKey = getTodayDateKey();
  const activeThemes = getActiveLimitedThemeLists(todayKey);
  const completedIds: string[] = [];
  const updatedProgress = { ...progress };
  const themeProgressCopy = { ...updatedProgress.limitedThemeProgress };

  for (const theme of activeThemes) {
    if (!theme.bookIds.includes(bookId)) continue;

    const existing = themeProgressCopy[theme.id] || {
      foundBookIds: [],
      currentProgress: 0,
      totalScore: 0,
      completed: false,
      claimed: false,
    };

    if (existing.foundBookIds.includes(bookId)) continue;

    const newFoundBookIds = [...existing.foundBookIds, bookId];
    const newProgress = newFoundBookIds.length;
    const newTotalScore = existing.totalScore + bookScore;
    const isCompleted = newProgress >= theme.requiredBooks;

    themeProgressCopy[theme.id] = {
      ...existing,
      foundBookIds: newFoundBookIds,
      currentProgress: newProgress,
      totalScore: newTotalScore,
      completed: isCompleted,
      completedAt: isCompleted && !existing.completed ? Date.now() : existing.completedAt,
    };

    if (isCompleted && !existing.completed) {
      completedIds.push(theme.id);
    }
  }

  updatedProgress.limitedThemeProgress = themeProgressCopy;
  return { progress: updatedProgress, completedIds };
};

export const updateFestivalChallengeProgress = (
  progress: ActivityProgress,
  updateType: 'find_books' | 'find_genre' | 'find_rarity' | 'score_threshold' | 'perfect_round' | 'no_hint_round' | 'daily_streak',
  value: number,
  options?: { genre?: string; rarity?: RarityLevel; score?: number }
): { progress: ActivityProgress; newStages: Record<string, string[]>; completedIds: string[] } => {
  const todayKey = getTodayDateKey();
  const activeFestivals = getActiveFestivalChallenges(todayKey);
  const newStages: Record<string, string[]> = {};
  const completedIds: string[] = [];
  const updatedProgress = { ...progress };
  const festivalProgressCopy = { ...updatedProgress.festivalChallengeProgress };

  for (const festival of activeFestivals) {
    let shouldUpdate = false;

    switch (festival.challengeType) {
      case 'find_books':
        shouldUpdate = updateType === 'find_books';
        break;
      case 'find_genre':
        shouldUpdate = updateType === 'find_genre' && options?.genre === festival.genre;
        break;
      case 'find_rarity':
        shouldUpdate = updateType === 'find_rarity' && options?.rarity === festival.rarity;
        break;
      case 'score_threshold':
        shouldUpdate = updateType === 'score_threshold';
        break;
      case 'perfect_rounds':
        shouldUpdate = updateType === 'perfect_round';
        break;
      case 'no_hint_rounds':
        shouldUpdate = updateType === 'no_hint_round';
        break;
      case 'daily_streak':
        shouldUpdate = updateType === 'daily_streak';
        break;
    }

    if (!shouldUpdate) continue;

    const existing = festivalProgressCopy[festival.id] || {
      currentProgress: 0,
      completedStages: [],
      totalScore: 0,
      completed: false,
      claimed: false,
      stageUnlockTimes: {},
    };

    let newCurrentProgress = existing.currentProgress;
    if (festival.challengeType === 'score_threshold') {
      newCurrentProgress = existing.totalScore + (options?.score || 0);
    } else {
      newCurrentProgress = existing.currentProgress + value;
    }

    const newStagesForFestival: string[] = [];
    const stageUnlockTimes = { ...(existing.stageUnlockTimes || {}) };
    const now = Date.now();

    if (festival.stages) {
      for (const stage of festival.stages) {
        if (newCurrentProgress >= stage.threshold && !existing.completedStages.includes(stage.id)) {
          newStagesForFestival.push(stage.id);
          stageUnlockTimes[stage.id] = now;
        }
      }
    }

    const isCompleted = newCurrentProgress >= festival.target;

    festivalProgressCopy[festival.id] = {
      ...existing,
      currentProgress: Math.min(newCurrentProgress, festival.target),
      totalScore: festival.challengeType === 'score_threshold' ? newCurrentProgress : existing.totalScore + (options?.score || 0),
      completedStages: [...existing.completedStages, ...newStagesForFestival],
      completed: isCompleted,
      completedAt: isCompleted && !existing.completed ? now : existing.completedAt,
      stageUnlockTimes,
    };

    if (newStagesForFestival.length > 0) {
      newStages[festival.id] = newStagesForFestival;
    }

    if (isCompleted && !existing.completed) {
      completedIds.push(festival.id);
    }
  }

  updatedProgress.festivalChallengeProgress = festivalProgressCopy;
  return { progress: updatedProgress, newStages, completedIds };
};

export const updatePointsRewardProgress = (
  progress: ActivityProgress,
  points: number,
  options?: { booksFound?: number; scoreEarned?: number; perfectRound?: boolean; noHint?: boolean }
): { progress: ActivityProgress; tierProgress: { systemId: string; tierId: string; newlyUnlocked: boolean }[] } => {
  const todayKey = getTodayDateKey();
  const activeSystems = getActivePointsRewardSystems(todayKey);
  const tierProgress: { systemId: string; tierId: string; newlyUnlocked: boolean }[] = [];
  const updatedProgress = { ...progress };
  const pointsProgressCopy = { ...updatedProgress.pointsRewardProgress };

  for (const system of activeSystems) {
    const existing = pointsProgressCopy[system.id] || {
      totalPoints: 0,
      claimedTiers: [],
      booksContributed: 0,
      scoreContributed: 0,
      perfectRounds: 0,
      noHintRounds: 0,
    };

    let earnedPoints = points * system.bonusMultiplier;
    if (options?.scoreEarned) {
      earnedPoints += options.scoreEarned * system.pointsPerScore;
    }

    const newTotalPoints = existing.totalPoints + earnedPoints;

    for (const tier of system.tiers) {
      if (newTotalPoints >= tier.pointsRequired && !existing.claimedTiers.includes(tier.id)) {
        tierProgress.push({
          systemId: system.id,
          tierId: tier.id,
          newlyUnlocked: true,
        });
      }
    }

    pointsProgressCopy[system.id] = {
      totalPoints: newTotalPoints,
      claimedTiers: existing.claimedTiers,
      booksContributed: existing.booksContributed + (options?.booksFound || 0),
      scoreContributed: existing.scoreContributed + (options?.scoreEarned || 0),
      perfectRounds: existing.perfectRounds + (options?.perfectRound ? 1 : 0),
      noHintRounds: existing.noHintRounds + (options?.noHint ? 1 : 0),
    };
  }

  updatedProgress.pointsRewardProgress = pointsProgressCopy;
  return { progress: updatedProgress, tierProgress };
};

export const checkActivityAchievements = (
  progress: ActivityProgress,
  stats: ActivityStats
): { progress: ActivityProgress; stats: ActivityStats; unlockedAchievements: string[] } => {
  const unlockedAchievements: string[] = [];
  const updatedAchievements = { ...progress.activityAchievements };
  let updatedStats = { ...stats };

  const completedThemeCount = Object.values(progress.limitedThemeProgress).filter(t => t.completed).length;
  const completedFestivalCount = Object.values(progress.festivalChallengeProgress).filter(f => f.completed).length;
  const totalCompleted = completedThemeCount + completedFestivalCount;
  const totalPoints = Object.values(progress.pointsRewardProgress).reduce((sum, p) => sum + p.totalPoints, 0);
  const participatedFestivals = Object.keys(progress.festivalChallengeProgress).filter(k => {
    const p = progress.festivalChallengeProgress[k];
    return p.currentProgress > 0;
  }).length;

  const allTiersClaimed = POINTS_REWARD_SYSTEMS.some(system => {
    const p = progress.pointsRewardProgress[system.id];
    if (!p) return false;
    return system.tiers.every(tier => p.claimedTiers.includes(tier.id));
  });

  const achievementChecks: Record<string, boolean> = {
    first_activity_complete: totalCompleted >= 1,
    activity_enthusiast: totalCompleted >= 5,
    activity_master: totalCompleted >= 15,
    points_collector: totalPoints >= 1000,
    festival_participant: participatedFestivals >= 3,
    theme_list_complete: completedThemeCount >= 1,
    all_tiers_claimed: allTiersClaimed,
  };

  for (const achievement of ACTIVITY_ACHIEVEMENTS) {
    const existing = updatedAchievements[achievement.id];
    if (existing?.unlocked) continue;

    const shouldUnlock = achievementChecks[achievement.id] || false;
    if (shouldUnlock) {
      updatedAchievements[achievement.id] = {
        unlocked: true,
        unlockedAt: Date.now(),
        progress: 1,
      };
      unlockedAchievements.push(achievement.id);
      updatedStats.totalActivityAchievementsUnlocked += 1;
    }
  }

  const newProgress = { ...progress, activityAchievements: updatedAchievements };
  return { progress: newProgress, stats: updatedStats, unlockedAchievements };
};

export const computeActivityIntegration = (_progress: ActivityProgress): ActivityIntegration => {
  const todayKey = getTodayDateKey();
  const activeThemes = getActiveLimitedThemeLists(todayKey);
  const activeFestivals = getActiveFestivalChallenges(todayKey);

  let scoreMultiplier = 1;
  let coinMultiplier = 1;
  let pointsMultiplier = 1;
  let bonusCoinsPerBook = 0;
  let bonusScorePerBook = 0;
  let bonusPointsPerBook = 0;
  let activeThemeListId: string | null = null;
  let activeFestivalId: string | null = null;

  for (const theme of activeThemes) {
    scoreMultiplier = Math.max(scoreMultiplier, theme.scoreMultiplier);
    coinMultiplier = Math.max(coinMultiplier, theme.coinMultiplier);
    bonusScorePerBook = Math.max(bonusScorePerBook, theme.bonusScorePerBook);
    if (!activeThemeListId) activeThemeListId = theme.id;
  }

  for (const festival of activeFestivals) {
    if (!activeFestivalId) activeFestivalId = festival.id;
  }

  const activeSystems = getActivePointsRewardSystems(todayKey);
  for (const system of activeSystems) {
    pointsMultiplier = Math.max(pointsMultiplier, system.bonusMultiplier);
    bonusPointsPerBook += system.pointsPerBook;
  }

  const activeActivityId = activeThemeListId || activeFestivalId;

  return {
    scoreMultiplier,
    coinMultiplier,
    pointsMultiplier,
    activeActivityId,
    activeFestivalId,
    activeThemeListId,
    bonusPerBook: {
      coins: bonusCoinsPerBook,
      score: bonusScorePerBook,
      points: bonusPointsPerBook,
    },
  };
};

export const processBookFoundForActivities = (
  progress: ActivityProgress,
  stats: ActivityStats,
  book: Book,
  score: number,
  hintsUsed: number,
  isPerfectRound: boolean
): {
  progress: ActivityProgress;
  stats: ActivityStats;
  result: ActivityGameResult;
} => {
  let updatedProgress = progress;
  let updatedStats = stats;
  const completedActivityIds: string[] = [];
  const unlockedAchievementIds: string[] = [];
  const newFestivalStages: string[] = [];
  const pointsTierProgress: { systemId: string; tierId: string; newlyUnlocked: boolean }[] = [];
  let activityPointsEarned = 0;
  let activityScoreBonus = 0;
  let activityCoinBonus = 0;

  const themeResult = updateLimitedThemeProgress(updatedProgress, book.id, score);
  updatedProgress = themeResult.progress;
  completedActivityIds.push(...themeResult.completedIds);

  for (const themeId of themeResult.completedIds) {
    const theme = LIMITED_THEME_LISTS.find(t => t.id === themeId);
    if (theme) {
      activityScoreBonus += theme.bonusScorePerBook * theme.requiredBooks;
    }
  }

  const festivalResult = updateFestivalChallengeProgress(updatedProgress, 'find_books', 1);
  updatedProgress = festivalResult.progress;
  completedActivityIds.push(...festivalResult.completedIds);
  for (const [, stages] of Object.entries(festivalResult.newStages)) {
    newFestivalStages.push(...stages);
  }

  const genreResult = updateFestivalChallengeProgress(updatedProgress, 'find_genre', 1, { genre: book.genre });
  updatedProgress = genreResult.progress;
  completedActivityIds.push(...genreResult.completedIds);
  for (const [, stages] of Object.entries(genreResult.newStages)) {
    newFestivalStages.push(...stages);
  }

  const rarityResult = updateFestivalChallengeProgress(updatedProgress, 'find_rarity', 1, { rarity: book.rarity });
  updatedProgress = rarityResult.progress;
  completedActivityIds.push(...rarityResult.completedIds);
  for (const [, stages] of Object.entries(rarityResult.newStages)) {
    newFestivalStages.push(...stages);
  }

  if (isPerfectRound) {
    const perfectResult = updateFestivalChallengeProgress(updatedProgress, 'perfect_round', 1);
    updatedProgress = perfectResult.progress;
    completedActivityIds.push(...perfectResult.completedIds);
    for (const [, stages] of Object.entries(perfectResult.newStages)) {
      newFestivalStages.push(...stages);
    }
  }

  if (hintsUsed === 0) {
    const noHintResult = updateFestivalChallengeProgress(updatedProgress, 'no_hint_round', 1);
    updatedProgress = noHintResult.progress;
    completedActivityIds.push(...noHintResult.completedIds);
    for (const [, stages] of Object.entries(noHintResult.newStages)) {
      newFestivalStages.push(...stages);
    }
  }

  const integration = computeActivityIntegration(updatedProgress);
  activityPointsEarned = Math.floor(integration.bonusPerBook.points);
  activityScoreBonus += integration.bonusPerBook.score;
  activityCoinBonus += integration.bonusPerBook.coins;

  const pointsResult = updatePointsRewardProgress(updatedProgress, activityPointsEarned, {
    booksFound: 1,
    scoreEarned: score,
    perfectRound: isPerfectRound,
    noHint: hintsUsed === 0,
  });
  updatedProgress = pointsResult.progress;
  pointsTierProgress.push(...pointsResult.tierProgress);

  updatedStats.totalPointsEarned += activityPointsEarned;
  if (completedActivityIds.length > 0) {
    updatedStats.totalActivitiesCompleted += completedActivityIds.length;
  }

  const achievementResult = checkActivityAchievements(updatedProgress, updatedStats);
  updatedProgress = achievementResult.progress;
  updatedStats = achievementResult.stats;
  unlockedAchievementIds.push(...achievementResult.unlockedAchievements);

  const festivalParticipated = Object.keys(updatedProgress.festivalChallengeProgress).filter(k =>
    updatedProgress.festivalChallengeProgress[k].currentProgress > 0
  ).length;
  updatedStats.totalFestivalsParticipated = Math.max(updatedStats.totalFestivalsParticipated, festivalParticipated);

  const result: ActivityGameResult = {
    activityPointsEarned,
    activityScoreBonus,
    activityCoinBonus,
    completedActivityIds: [...new Set(completedActivityIds)],
    unlockedAchievementIds,
    newFestivalStages: [...new Set(newFestivalStages)],
    pointsTierProgress,
  };

  return { progress: updatedProgress, stats: updatedStats, result };
};

export const processGameEndForActivities = (
  progress: ActivityProgress,
  stats: ActivityStats,
  totalScore: number,
  totalBooksFound: number,
  hintsUsed: number,
  isPerfectGame?: boolean
): {
  progress: ActivityProgress;
  stats: ActivityStats;
  result: ActivityGameResult;
} => {
  let updatedProgress = progress;
  let updatedStats = stats;
  const completedActivityIds: string[] = [];
  const unlockedAchievementIds: string[] = [];
  const newFestivalStages: string[] = [];
  const pointsTierProgress: { systemId: string; tierId: string; newlyUnlocked: boolean }[] = [];
  let activityPointsEarned = 0;

  const scoreThresholdResult = updateFestivalChallengeProgress(updatedProgress, 'score_threshold', 0, { score: totalScore });
  updatedProgress = scoreThresholdResult.progress;
  completedActivityIds.push(...scoreThresholdResult.completedIds);
  for (const [, stages] of Object.entries(scoreThresholdResult.newStages)) {
    newFestivalStages.push(...stages);
  }

  if (isPerfectGame) {
    const perfectResult = updateFestivalChallengeProgress(updatedProgress, 'perfect_round', 1);
    updatedProgress = perfectResult.progress;
    completedActivityIds.push(...perfectResult.completedIds);
    for (const [, stages] of Object.entries(perfectResult.newStages)) {
      newFestivalStages.push(...stages);
    }
  }

  if (hintsUsed === 0 && totalBooksFound > 0) {
    const noHintResult = updateFestivalChallengeProgress(updatedProgress, 'no_hint_round', 1);
    updatedProgress = noHintResult.progress;
    completedActivityIds.push(...noHintResult.completedIds);
    for (const [, stages] of Object.entries(noHintResult.newStages)) {
      newFestivalStages.push(...stages);
    }
  }

  const integration = computeActivityIntegration(updatedProgress);
  activityPointsEarned = Math.floor(totalScore * integration.pointsMultiplier);

  const pointsResult = updatePointsRewardProgress(updatedProgress, activityPointsEarned, {
    booksFound: totalBooksFound,
    scoreEarned: totalScore,
    perfectRound: isPerfectGame || false,
    noHint: totalBooksFound > 0 && hintsUsed === 0,
  });
  updatedProgress = pointsResult.progress;
  pointsTierProgress.push(...pointsResult.tierProgress);

  updatedStats.totalPointsEarned += activityPointsEarned;
  if (completedActivityIds.length > 0) {
    updatedStats.totalActivitiesCompleted += completedActivityIds.length;
  }

  const achievementResult = checkActivityAchievements(updatedProgress, updatedStats);
  updatedProgress = achievementResult.progress;
  updatedStats = achievementResult.stats;
  unlockedAchievementIds.push(...achievementResult.unlockedAchievements);

  const festivalParticipated = Object.keys(updatedProgress.festivalChallengeProgress).filter(k =>
    updatedProgress.festivalChallengeProgress[k].currentProgress > 0
  ).length;
  updatedStats.totalFestivalsParticipated = Math.max(updatedStats.totalFestivalsParticipated, festivalParticipated);

  const result: ActivityGameResult = {
    activityPointsEarned,
    activityScoreBonus: 0,
    activityCoinBonus: 0,
    completedActivityIds: [...new Set(completedActivityIds)],
    unlockedAchievementIds,
    newFestivalStages: [...new Set(newFestivalStages)],
    pointsTierProgress,
  };

  return { progress: updatedProgress, stats: updatedStats, result };
};

export const claimActivityReward = (
  progress: ActivityProgress,
  stats: ActivityStats,
  activityId: string,
  activityType: 'theme' | 'festival' | 'points_tier',
  tierId?: string
): { progress: ActivityProgress; stats: ActivityStats; success: boolean; rewards: ActivityReward[] } => {
  const updatedProgress = { ...progress };
  const updatedStats = { ...stats };
  let rewards: ActivityReward[] = [];
  let success = false;

  if (activityType === 'theme') {
    const themeProgress = updatedProgress.limitedThemeProgress[activityId];
    if (themeProgress && themeProgress.completed && !themeProgress.claimed) {
      const theme = LIMITED_THEME_LISTS.find(t => t.id === activityId);
      if (theme) {
        rewards = theme.rewards;
        updatedProgress.limitedThemeProgress = {
          ...updatedProgress.limitedThemeProgress,
          [activityId]: { ...themeProgress, claimed: true, claimedAt: Date.now() },
        };
        success = true;
      }
    }
  } else if (activityType === 'festival') {
    const festivalProgress = updatedProgress.festivalChallengeProgress[activityId];
    if (festivalProgress && festivalProgress.completed && !festivalProgress.claimed) {
      const festival = FESTIVAL_CHALLENGES.find(f => f.id === activityId);
      if (festival && festival.completionReward) {
        rewards = festival.completionReward;
        updatedProgress.festivalChallengeProgress = {
          ...updatedProgress.festivalChallengeProgress,
          [activityId]: { ...festivalProgress, claimed: true },
        };
        success = true;
      }
    }
  } else if (activityType === 'points_tier' && tierId) {
    const pointsProgress = updatedProgress.pointsRewardProgress[activityId];
    const system = POINTS_REWARD_SYSTEMS.find(s => s.id === activityId);
    if (pointsProgress && system && !pointsProgress.claimedTiers.includes(tierId)) {
      const tier = system.tiers.find(t => t.id === tierId);
      if (tier && pointsProgress.totalPoints >= tier.pointsRequired) {
        rewards = tier.rewards;
        updatedProgress.pointsRewardProgress = {
          ...updatedProgress.pointsRewardProgress,
          [activityId]: {
            ...pointsProgress,
            claimedTiers: [...pointsProgress.claimedTiers, tierId],
          },
        };
        success = true;
      }
    }
  }

  if (success) {
    updatedProgress.claimedRewards = [...updatedProgress.claimedRewards, `${activityId}_${tierId || activityType}`];
    updatedStats.totalActivityRewardsClaimed += 1;
  }

  return { progress: updatedProgress, stats: updatedStats, success, rewards };
};

export const getUnclaimedActivityRewardsCount = (progress: ActivityProgress): number => {
  let count = 0;

  for (const themeProgress of Object.values(progress.limitedThemeProgress)) {
    if (themeProgress.completed && !themeProgress.claimed) count++;
  }

  for (const festivalProgress of Object.values(progress.festivalChallengeProgress)) {
    if (festivalProgress.completed && !festivalProgress.claimed) count++;
  }

  for (const [systemId, pointsProgress] of Object.entries(progress.pointsRewardProgress)) {
    const system = POINTS_REWARD_SYSTEMS.find(s => s.id === systemId);
    if (system) {
      for (const tier of system.tiers) {
        if (pointsProgress.totalPoints >= tier.pointsRequired && !pointsProgress.claimedTiers.includes(tier.id)) {
          count++;
        }
      }
    }
  }

  return count;
};
