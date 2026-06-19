import type { StreakTitle, StreakReward } from '../types/game';

export const STREAK_TITLES: StreakTitle[] = [
  {
    id: 'streak_newbie',
    title: '初心者',
    icon: '🌱',
    minStreak: 0,
    color: '#9ca3af',
  },
  {
    id: 'streak_beginner',
    title: '连中三元',
    icon: '🍀',
    minStreak: 3,
    color: '#22c55e',
  },
  {
    id: 'streak_good',
    title: '手感火热',
    icon: '🔥',
    minStreak: 5,
    color: '#f97316',
  },
  {
    id: 'streak_great',
    title: '势如破竹',
    icon: '⚡',
    minStreak: 8,
    color: '#eab308',
  },
  {
    id: 'streak_excellent',
    title: '神乎其技',
    icon: '💎',
    minStreak: 12,
    color: '#06b6d4',
  },
  {
    id: 'streak_amazing',
    title: '独孤求败',
    icon: '🏆',
    minStreak: 16,
    color: '#a855f7',
  },
  {
    id: 'streak_legendary',
    title: '传说之境',
    icon: '👑',
    minStreak: 20,
    color: '#ef4444',
  },
  {
    id: 'streak_mythic',
    title: '神话级',
    icon: '🌟',
    minStreak: 30,
    color: '#ec4899',
  },
];

export const STREAK_REWARDS: StreakReward[] = [
  {
    id: 'streak_reward_3',
    minStreak: 3,
    bonusScore: 50,
    bonusTime: 10,
    bonusHints: 0,
    titleId: 'streak_beginner',
    achievementId: 'streak_3',
  },
  {
    id: 'streak_reward_5',
    minStreak: 5,
    bonusScore: 100,
    bonusTime: 15,
    bonusHints: 1,
    titleId: 'streak_good',
    achievementId: 'streak_5',
  },
  {
    id: 'streak_reward_8',
    minStreak: 8,
    bonusScore: 200,
    bonusTime: 20,
    bonusHints: 1,
    titleId: 'streak_great',
    achievementId: 'streak_8',
  },
  {
    id: 'streak_reward_12',
    minStreak: 12,
    bonusScore: 350,
    bonusTime: 25,
    bonusHints: 2,
    titleId: 'streak_excellent',
    achievementId: 'streak_12',
  },
  {
    id: 'streak_reward_16',
    minStreak: 16,
    bonusScore: 500,
    bonusTime: 30,
    bonusHints: 2,
    titleId: 'streak_amazing',
    achievementId: 'streak_16',
  },
  {
    id: 'streak_reward_20',
    minStreak: 20,
    bonusScore: 800,
    bonusTime: 40,
    bonusHints: 3,
    titleId: 'streak_legendary',
    achievementId: 'streak_20',
  },
  {
    id: 'streak_reward_30',
    minStreak: 30,
    bonusScore: 1500,
    bonusTime: 60,
    bonusHints: 5,
    titleId: 'streak_mythic',
    achievementId: 'streak_30',
  },
];

export const getStreakTitle = (streak: number): StreakTitle => {
  let currentTitle = STREAK_TITLES[0];
  for (const title of STREAK_TITLES) {
    if (streak >= title.minStreak) {
      currentTitle = title;
    } else {
      break;
    }
  }
  return currentTitle;
};

export const getStreakReward = (streak: number): StreakReward | null => {
  const rewards = STREAK_REWARDS.filter(r => r.minStreak === streak);
  return rewards.length > 0 ? rewards[0] : null;
};

export const getStreakBonusMultiplier = (streak: number): number => {
  if (streak < 3) return 1;
  if (streak < 5) return 1.1;
  if (streak < 8) return 1.2;
  if (streak < 12) return 1.35;
  if (streak < 16) return 1.5;
  if (streak < 20) return 1.75;
  if (streak < 30) return 2;
  return 2.5;
};

export const calculateStreakBonusScore = (baseScore: number, streak: number): number => {
  const multiplier = getStreakBonusMultiplier(streak);
  return Math.floor(baseScore * (multiplier - 1));
};

export const STREAK_INHERIT_COST = {
  scorePenaltyPercent: 10,
  timePenaltyPercent: 15,
};
