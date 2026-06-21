import type { RarityLevel, DifficultyLevel } from './game';

export type ActivityType = 'theme_list' | 'festival' | 'points_reward' | 'achievement';

export type ActivityStatus = 'upcoming' | 'active' | 'completed' | 'expired';

export type ActivityRewardType = 'coins' | 'score' | 'hints' | 'powerup' | 'achievement' | 'points' | 'title' | 'decoration' | 'multiplier';

export interface ActivityReward {
  type: ActivityRewardType;
  value: number;
  description?: string;
  powerUpType?: 'free_hint' | 'time_peek' | 'eliminate_wrong';
  achievementId?: string;
  titleId?: string;
  decorationId?: string;
}

export interface ActivityRewardPopupData {
  title: string;
  description?: string;
  coins?: number;
  points?: number;
  rewards?: ActivityReward[];
  activityId: string;
  activityType: ActivityType;
}

export interface LimitedThemeList {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  bookIds: string[];
  requiredBooks: number;
  bonusScorePerBook: number;
  scoreMultiplier: number;
  coinMultiplier: number;
  rarityBoost?: RarityLevel;
  difficultyBonus?: DifficultyLevel;
  rewards: ActivityReward[];
  exclusiveAchievements?: string[];
  backgroundStyle?: string;
  tags?: string[];
}

export interface FestivalChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  challengeType: 'find_books' | 'find_genre' | 'find_rarity' | 'score_threshold' | 'daily_streak' | 'perfect_rounds' | 'no_hint_rounds';
  target: number;
  genre?: string;
  rarity?: RarityLevel;
  stages?: FestivalChallengeStage[];
  rewards: ActivityReward[];
  completionReward?: ActivityReward[];
  exclusiveAchievements?: string[];
  backgroundStyle?: string;
  bookDecorations?: string[];
}

export interface FestivalChallengeStage {
  id: string;
  title: string;
  description: string;
  threshold: number;
  rewards: ActivityReward[];
}

export interface PointsRewardTier {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  rewards: ActivityReward[];
  claimed: boolean;
}

export interface PointsRewardSystem {
  id: string;
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  pointsPerBook: number;
  pointsPerScore: number;
  pointsPerPerfectRound: number;
  pointsPerNoHint: number;
  tiers: PointsRewardTier[];
  bonusMultiplier: number;
}

export interface ActivityAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  activityId: string;
  condition: string;
  rewards: ActivityReward[];
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ActivityProgress {
  limitedThemeProgress: Record<string, {
    foundBookIds: string[];
    currentProgress: number;
    totalScore: number;
    completed: boolean;
    claimed: boolean;
    completedAt?: number;
    claimedAt?: number;
  }>;
  festivalChallengeProgress: Record<string, {
    currentProgress: number;
    completedStages: string[];
    totalScore: number;
    completed: boolean;
    claimed: boolean;
    completedAt?: number;
    stageUnlockTimes?: Record<string, number>;
  }>;
  pointsRewardProgress: Record<string, {
    totalPoints: number;
    claimedTiers: string[];
    booksContributed: number;
    scoreContributed: number;
    perfectRounds: number;
    noHintRounds: number;
  }>;
  activityAchievements: Record<string, {
    unlocked: boolean;
    unlockedAt?: number;
    progress?: number;
  }>;
  claimedRewards: string[];
  lastActivityCheck: string;
}

export interface ActivityStats {
  totalActivitiesCompleted: number;
  totalFestivalsParticipated: number;
  totalPointsEarned: number;
  totalActivityRewardsClaimed: number;
  totalActivityAchievementsUnlocked: number;
  currentActivityStreak: number;
  longestActivityStreak: number;
}

export interface ActivityState {
  currentDateKey: string;
  activeActivityId: string | null;
  activityProgress: ActivityProgress;
  showActivityCenter: boolean;
  activeTab: ActivityTab;
}

export type ActivityTab = 'overview' | 'theme_lists' | 'festivals' | 'points' | 'achievements' | 'history';

export interface ActivityIntegration {
  scoreMultiplier: number;
  coinMultiplier: number;
  pointsMultiplier: number;
  activeActivityId: string | null;
  activeFestivalId: string | null;
  activeThemeListId: string | null;
  bonusPerBook: {
    coins: number;
    score: number;
    points: number;
  };
}

export interface ActivityGameResult {
  activityPointsEarned: number;
  activityScoreBonus: number;
  activityCoinBonus: number;
  completedActivityIds: string[];
  unlockedAchievementIds: string[];
  newFestivalStages: string[];
  pointsTierProgress: {
    systemId: string;
    tierId: string;
    newlyUnlocked: boolean;
  }[];
}

export type ActivityRewardPopup = ActivityRewardPopupData;

export interface ActivityInfo {
  state: ActivityState;
  stats: ActivityStats;
  activeThemes: LimitedThemeList[];
  activeFestivals: FestivalChallenge[];
  pointsSystems: PointsRewardSystem[];
  achievements: ActivityAchievement[];
  isVisible: boolean;
  unclaimedRewards: number;
  totalPoints: number;
  todayKey: string;
}
