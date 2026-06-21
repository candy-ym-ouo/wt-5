import { createSignal, createMemo } from 'solid-js';
import type {
  ExhibitionState,
  ExhibitionStats,
  ExhibitionTab,
  ExhibitionGameResult,
  ActivityReward,
  ExhibitionInfo,
  ExhibitionIntegration,
} from '../types/touringExhibition';
import type { Book } from '../types/game';
import {
  getExhibitionProgress,
  saveExhibitionProgress,
  getExhibitionStats,
  saveExhibitionStats,
  processBookFoundForExhibitions,
  claimExhibitionReward,
  computeExhibitionIntegration,
  getUnclaimedExhibitionRewardsCount,
} from '../utils/touringExhibitionStorage';
import {
  getActiveExhibitions,
  getUpcomingExhibitions,
  getCompletedExhibitions,
  TOURING_EXHIBITIONS,
  getExhibitionById,
} from '../data/touringExhibition';
import { getTodayDateKey } from '../data/dailyChallenge';
import { setShowRewardPopup, awardActivityRewards } from './storeManager';
import { awardActivityPowerUps } from './gameStore';

let initialProgress = getExhibitionProgress();
let initialStats = getExhibitionStats();

const initialState: ExhibitionState = {
  currentDateKey: getTodayDateKey(),
  activeExhibitionId: null,
  showExhibitionCenter: false,
  activeTab: 'overview',
  exhibitionProgress: initialProgress,
};

export const [exhibitionState, setExhibitionState] = createSignal<ExhibitionState>(initialState);
export const [exhibitionStats, setExhibitionStats] = createSignal<ExhibitionStats>(initialStats);
export const [exhibitionRewardPopup, setExhibitionRewardPopup] = createSignal<{
  title: string;
  description: string;
  coins?: number;
  points?: number;
  rewards: ActivityReward[];
  exhibitionId: string;
} | null>(null);
export const [lastExhibitionGameResult, setLastExhibitionGameResult] = createSignal<ExhibitionGameResult | null>(null);

const persistProgress = (progress: Record<string, any>): void => {
  saveExhibitionProgress(progress);
  setExhibitionState(prev => ({ ...prev, exhibitionProgress: progress }));
};

const persistStats = (stats: ExhibitionStats): void => {
  saveExhibitionStats(stats);
  setExhibitionStats(stats);
};

export const openExhibitionCenter = (): void => {
  setExhibitionState(prev => ({ ...prev, showExhibitionCenter: true }));
};

export const closeExhibitionCenter = (): void => {
  setExhibitionState(prev => ({ ...prev, showExhibitionCenter: false }));
};

export const setExhibitionTab = (tab: ExhibitionTab): void => {
  setExhibitionState(prev => ({ ...prev, activeTab: tab }));
};

export const setActiveExhibition = (exhibitionId: string | null): void => {
  setExhibitionState(prev => ({ ...prev, activeExhibitionId: exhibitionId }));
};

export const applyExhibitionRewards = (rewards: ActivityReward[], description: string): void => {
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
      case 'powerup':
        if (reward.powerUpType === 'free_hint') {
          totalFreeHints += reward.value;
        } else if (reward.powerUpType === 'time_peek') {
          totalTimePeeks += reward.value;
        } else if (reward.powerUpType === 'eliminate_wrong') {
          totalEliminateWrongs += reward.value;
        }
        break;
      case 'points':
      case 'title':
      case 'decoration':
      case 'achievement':
      case 'multiplier':
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
      description: description || '巡回展陈奖励',
    });
    setTimeout(() => setShowRewardPopup(null), 3000);
  }
};

export const getExhibitionInfo = createMemo<ExhibitionInfo>(() => {
  const state = exhibitionState();
  const stats = exhibitionStats();
  const todayKey = getTodayDateKey();

  const activeExhibitions = getActiveExhibitions(todayKey);
  const upcomingExhibitions = getUpcomingExhibitions(todayKey);
  const completedExhibitions = getCompletedExhibitions(todayKey);

  const unclaimedRewards = getUnclaimedExhibitionRewardsCount(state.exhibitionProgress);

  return {
    state,
    stats,
    activeExhibitions,
    upcomingExhibitions,
    completedExhibitions,
    isVisible: state.showExhibitionCenter,
    unclaimedRewards,
    totalCollectionPoints: stats.totalCollectionPoints,
    todayKey,
  };
});

export const getExhibitionIntegrationBonuses = (): ExhibitionIntegration => {
  return computeExhibitionIntegration(exhibitionState().exhibitionProgress);
};

export const processBookFoundForExhibition = (
  book: Book,
  score: number
): ExhibitionGameResult => {
  const state = exhibitionState();
  const stats = exhibitionStats();

  const result = processBookFoundForExhibitions(
    state.exhibitionProgress,
    stats,
    book,
    score
  );

  persistProgress(result.progress);
  persistStats(result.stats);
  setLastExhibitionGameResult(result.result);

  if (result.result.completedExhibitionIds.length > 0) {
    const exhibitionId = result.result.completedExhibitionIds[0];
    const exhibition = getExhibitionById(exhibitionId);

    if (exhibition) {
      const rewards = exhibition.completionReward || exhibition.rewards;
      applyExhibitionRewards(rewards, `${exhibition.title} 完成奖励`);

      let coinReward = 0;
      let pointReward = 0;
      for (const r of rewards) {
        if (r.type === 'coins') coinReward += r.value;
        if (r.type === 'points') pointReward += r.value;
      }

      setExhibitionRewardPopup({
        title: `🎉 ${exhibition.title}`,
        description: '恭喜完成巡回展陈！',
        coins: coinReward > 0 ? coinReward : undefined,
        points: pointReward > 0 ? pointReward : undefined,
        rewards,
        exhibitionId,
      });
      setTimeout(() => setExhibitionRewardPopup(null), 4000);
    }
  }

  if (result.result.unlockedCollectionIds.length > 0) {
    const collectionId = result.result.unlockedCollectionIds[0];
    for (const ex of TOURING_EXHIBITIONS) {
      const collection = ex.limitedCollection.find(c => c.id === collectionId);
      if (collection) {
        setExhibitionRewardPopup({
          title: `📚 限时收藏解锁`,
          description: `${collection.title} 已加入收藏！`,
          rewards: [{ type: 'score', value: 500 }],
          exhibitionId: ex.id,
        });
        setTimeout(() => setExhibitionRewardPopup(null), 4000);
        break;
      }
    }
  }

  return result.result;
};

export const claimExhibitionRewardById = (exhibitionId: string): boolean => {
  const state = exhibitionState();
  const stats = exhibitionStats();

  const result = claimExhibitionReward(
    state.exhibitionProgress,
    stats,
    exhibitionId
  );

  if (result.success) {
    persistProgress(result.progress);
    persistStats(result.stats);

    const exhibition = getExhibitionById(exhibitionId);
    const description = exhibition ? `${exhibition.title} 完成奖励` : '巡回展陈奖励';
    applyExhibitionRewards(result.rewards, description);
  }

  return result.success;
};

export const dismissExhibitionRewardPopup = (): void => {
  setExhibitionRewardPopup(null);
};
