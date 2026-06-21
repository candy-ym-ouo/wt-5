import { createSignal, createMemo } from 'solid-js';
import type { ActivityState, ActivityProgress, ActivityStats, ActivityTab, ActivityGameResult, ActivityRewardPopup, ActivityReward, ActivityIntegration, ActivityInfo } from '../types/activity';
import type { Book } from '../types/game';
import {
  getActivityProgress,
  saveActivityProgress,
  getActivityStats,
  saveActivityStats,
  processBookFoundForActivities,
  processGameEndForActivities,
  claimActivityReward,
  computeActivityIntegration,
  getUnclaimedActivityRewardsCount,
} from '../utils/activityStorage';
import {
  getActiveLimitedThemeLists,
  getActiveFestivalChallenges,
  getActivePointsRewardSystems,
  ACTIVITY_ACHIEVEMENTS,
  LIMITED_THEME_LISTS,
  FESTIVAL_CHALLENGES,
  POINTS_REWARD_SYSTEMS,
} from '../data/activities';
import { getTodayDateKey } from '../data/dailyChallenge';
import { setShowRewardPopup, awardActivityRewards } from './storeManager';
import { awardActivityPowerUps } from './gameStore';

let initialProgress = getActivityProgress();
let initialStats = getActivityStats();

const initialState: ActivityState = {
  currentDateKey: getTodayDateKey(),
  activeActivityId: null,
  activityProgress: initialProgress,
  showActivityCenter: false,
  activeTab: 'overview',
};

export const [activityState, setActivityState] = createSignal<ActivityState>(initialState);
export const [activityStats, setActivityStats] = createSignal<ActivityStats>(initialStats);
export const [activityRewardPopup, setActivityRewardPopup] = createSignal<ActivityRewardPopup | null>(null);
export const [lastActivityGameResult, setLastActivityGameResult] = createSignal<ActivityGameResult | null>(null);

const persistProgress = (progress: ActivityProgress): void => {
  saveActivityProgress(progress);
  setActivityState(prev => ({ ...prev, activityProgress: progress }));
};

const persistStats = (stats: ActivityStats): void => {
  saveActivityStats(stats);
  setActivityStats(stats);
};

export const openActivityCenter = (): void => {
  setActivityState(prev => ({ ...prev, showActivityCenter: true }));
};

export const closeActivityCenter = (): void => {
  setActivityState(prev => ({ ...prev, showActivityCenter: false }));
};

export const setActivityTab = (tab: ActivityTab): void => {
  setActivityState(prev => ({ ...prev, activeTab: tab }));
};

export const setActiveActivity = (activityId: string | null): void => {
  setActivityState(prev => ({ ...prev, activeActivityId: activityId }));
};

export const applyActivityRewards = (rewards: ActivityReward[], description: string): void => {
  let totalCoins = 0;
  let totalReputation = 0;
  let totalFreeHints = 0;
  let totalTimePeeks = 0;
  let totalEliminateWrongs = 0;
  let totalScoreBonus = 0;

  for (const reward of rewards) {
    switch (reward.type) {
      case 'coins':
        totalCoins += reward.value;
        break;
      case 'score':
        totalScoreBonus += reward.value;
        break;
      case 'hints':
        totalFreeHints += reward.value;
        break;
      case 'points':
      case 'title':
      case 'decoration':
      case 'achievement':
      case 'multiplier':
        break;
      case 'powerup':
        if (reward.powerUpType === 'free_hint') {
          totalFreeHints += reward.value;
        } else if (reward.powerUpType === 'time_peek') {
          totalTimePeeks += reward.value;
        } else if (reward.powerUpType === 'eliminate_wrong') {
          totalEliminateWrongs += reward.value;
        }
        break;
    }
  }

  if (totalCoins > 0 || totalReputation > 0) {
    awardActivityRewards(totalCoins, totalReputation, description);
  }

  if (totalFreeHints > 0 || totalTimePeeks > 0 || totalEliminateWrongs > 0) {
    awardActivityPowerUps(totalFreeHints, totalTimePeeks, totalEliminateWrongs);
  }

  if (totalCoins > 0 || totalReputation > 0 || totalFreeHints > 0 || totalTimePeeks > 0 || totalEliminateWrongs > 0 || totalScoreBonus > 0) {
    setShowRewardPopup({
      coins: totalCoins,
      reputation: totalReputation,
      description: description || '活动奖励',
    });
    setTimeout(() => setShowRewardPopup(null), 3000);
  }
};

export const getActivityInfo = createMemo<ActivityInfo>(() => {
  const state = activityState();
  const progress = state.activityProgress;
  const stats = activityStats();
  const todayKey = getTodayDateKey();

  const activeThemes = getActiveLimitedThemeLists(todayKey);
  const activeFestivals = getActiveFestivalChallenges(todayKey);
  const pointsSystems = getActivePointsRewardSystems(todayKey);

  let totalPoints = 0;
  for (const system of pointsSystems) {
    totalPoints += progress.pointsRewardProgress[system.id]?.totalPoints || 0;
  }

  const unclaimedRewards = getUnclaimedActivityRewardsCount(progress);

  return {
    state,
    stats,
    activeThemes,
    activeFestivals,
    pointsSystems,
    achievements: ACTIVITY_ACHIEVEMENTS,
    isVisible: state.showActivityCenter,
    unclaimedRewards,
    totalPoints,
    todayKey,
  };
});

export const getActivityIntegrationBonuses = (): ActivityIntegration => {
  return computeActivityIntegration(activityState().activityProgress);
};

export const processBookFound = (
  book: Book,
  score: number,
  hintsUsed: number,
  isPerfectRound: boolean
): ActivityGameResult => {
  const state = activityState();
  const stats = activityStats();

  const result = processBookFoundForActivities(
    state.activityProgress,
    stats,
    book,
    score,
    hintsUsed,
    isPerfectRound
  );

  persistProgress(result.progress);
  persistStats(result.stats);
  setLastActivityGameResult(result.result);

  if (result.result.completedActivityIds.length > 0 || result.result.newFestivalStages.length > 0) {
    const activityId = result.result.completedActivityIds[0] || result.result.newFestivalStages[0] || 'activity';
    const festival = FESTIVAL_CHALLENGES.find(f => f.id === activityId);
    const theme = LIMITED_THEME_LISTS.find(t => t.id === activityId);

    let rewards: ActivityReward[] = [];
    let title = '';
    let description = '';

    if (festival) {
      const completedStage = festival.stages?.find(s => result.result.newFestivalStages.includes(s.id));
      if (completedStage) {
        rewards = completedStage.rewards;
        title = `🎯 ${festival.title}`;
        description = `达成阶段：${completedStage.title}`;
      } else if (result.result.completedActivityIds.includes(festival.id)) {
        rewards = festival.completionReward || festival.rewards;
        title = `🏆 ${festival.title}`;
        description = '恭喜完成节日挑战！';
      }
    } else if (theme) {
      rewards = theme.rewards;
      title = `📚 ${theme.title}`;
      description = '恭喜完成限时主题书单！';
    }

    if (rewards.length > 0 && title) {
      applyActivityRewards(rewards, description);
      let coinReward = 0;
      let pointReward = 0;
      for (const r of rewards) {
        if (r.type === 'coins') coinReward += r.value;
        if (r.type === 'points') pointReward += r.value;
      }
      setActivityRewardPopup({
        title,
        description,
        coins: coinReward > 0 ? coinReward : undefined,
        points: pointReward > 0 ? pointReward : undefined,
        rewards,
        activityId,
        activityType: festival ? 'festival' : 'theme_list',
      });
      setTimeout(() => setActivityRewardPopup(null), 4000);
    }
  }

  if (result.result.pointsTierProgress.length > 0) {
    for (const tp of result.result.pointsTierProgress) {
      if (tp.newlyUnlocked) {
        const system = POINTS_REWARD_SYSTEMS.find(s => s.id === tp.systemId);
        const tier = system?.tiers.find(t => t.id === tp.tierId);
        if (system && tier) {
          let coinReward = 0;
          let pointReward = 0;
          for (const r of tier.rewards) {
            if (r.type === 'coins') coinReward += r.value;
            if (r.type === 'points') pointReward += r.value;
          }
          setActivityRewardPopup({
            title: `⭐ ${tier.title}`,
            description: `${system.title} 新档位解锁！`,
            coins: coinReward > 0 ? coinReward : undefined,
            points: pointReward > 0 ? pointReward : undefined,
            rewards: tier.rewards,
            activityId: tp.systemId,
            activityType: 'points_reward',
          });
          setTimeout(() => setActivityRewardPopup(null), 4000);
          break;
        }
      }
    }
  }

  return result.result;
};

export const processGameEnd = (
  totalScore: number,
  totalBooksFound: number,
  hintsUsed: number,
  isPerfectGame?: boolean
): ActivityGameResult => {
  const state = activityState();
  const stats = activityStats();

  const result = processGameEndForActivities(
    state.activityProgress,
    stats,
    totalScore,
    totalBooksFound,
    hintsUsed,
    isPerfectGame
  );

  persistProgress(result.progress);
  persistStats(result.stats);

  if (result.result.pointsTierProgress.length > 0) {
    for (const tp of result.result.pointsTierProgress) {
      if (tp.newlyUnlocked) {
        const system = POINTS_REWARD_SYSTEMS.find(s => s.id === tp.systemId);
        const tier = system?.tiers.find(t => t.id === tp.tierId);
        if (system && tier) {
          let coinReward = 0;
          let pointReward = 0;
          for (const r of tier.rewards) {
            if (r.type === 'coins') coinReward += r.value;
            if (r.type === 'points') pointReward += r.value;
          }
          setActivityRewardPopup({
            title: `⭐ ${tier.title}`,
            description: `${system.title} 新档位解锁！`,
            coins: coinReward > 0 ? coinReward : undefined,
            points: pointReward > 0 ? pointReward : undefined,
            rewards: tier.rewards,
            activityId: tp.systemId,
            activityType: 'points_reward',
          });
          setTimeout(() => setActivityRewardPopup(null), 4000);
          break;
        }
      }
    }
  }

  return result.result;
};

export const claimReward = (
  activityId: string,
  activityType: 'theme' | 'festival' | 'points_tier',
  tierId?: string
): boolean => {
  const state = activityState();
  const stats = activityStats();

  const result = claimActivityReward(
    state.activityProgress,
    stats,
    activityId,
    activityType,
    tierId
  );

  if (result.success) {
    persistProgress(result.progress);
    persistStats(result.stats);

    let description = '活动奖励领取成功';
    if (activityType === 'theme') {
      const theme = LIMITED_THEME_LISTS.find(t => t.id === activityId);
      description = theme ? `${theme.title} 完成奖励` : description;
    } else if (activityType === 'festival') {
      const festival = FESTIVAL_CHALLENGES.find(f => f.id === activityId);
      description = festival ? `${festival.title} 完成奖励` : description;
    } else if (activityType === 'points_tier' && tierId) {
      const system = POINTS_REWARD_SYSTEMS.find(s => s.id === activityId);
      const tier = system?.tiers.find(t => t.id === tierId);
      description = tier ? `${tier.title} 档位奖励` : description;
    }

    applyActivityRewards(result.rewards, description);
  }

  return result.success;
};

export const dismissActivityRewardPopup = (): void => {
  setActivityRewardPopup(null);
};
