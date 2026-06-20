import type { DifficultyLevel, RarityLevel } from './game';

export type CalendarEventType = 'workday' | 'limited' | 'festival' | 'refresh';

export type CalendarEventStatus = 'upcoming' | 'active' | 'completed' | 'expired';

export type CalendarRewardType = 'coins' | 'score' | 'hints' | 'powerup' | 'achievement' | 'multiplier' | 'theme';

export interface CalendarReward {
  type: CalendarRewardType;
  value: number;
  description?: string;
  powerUpType?: 'free_hint' | 'time_peek' | 'eliminate_wrong';
  themeId?: string;
  achievementId?: string;
}

export interface WorkdayActivity {
  id: string;
  dayOfWeek: number;
  title: string;
  description: string;
  icon: string;
  difficultyBonus?: DifficultyLevel;
  scoreMultiplier?: number;
  bonusCoinsPerBook?: number;
  rarityBoost?: RarityLevel;
  requiredBooks?: number;
  rewards: CalendarReward[];
}

export interface LimitedTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  taskType: 'find_books' | 'find_genre' | 'find_rarity' | 'consecutive_days' | 'score_threshold' | 'daily_challenge' | 'leaderboard_rank';
  target: number;
  genre?: string;
  rarity?: RarityLevel;
  leaderboardType?: 'daily' | 'weekly' | 'season';
  minRank?: number;
  rewards: CalendarReward[];
  linkedAchievementId?: string;
  linkedChallengeId?: string;
}

export interface FestivalTheme {
  id: string;
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  themeId: string;
  backgroundStyle?: string;
  bookDecorations?: string[];
  scoreMultiplier: number;
  coinMultiplier: number;
  exclusiveBooks?: string[];
  exclusiveAchievements?: string[];
  festivalRewards: CalendarReward[];
}

export interface RewardRefresh {
  id: string;
  title: string;
  description: string;
  icon: string;
  refreshType: 'daily' | 'weekly' | 'monthly' | 'festival';
  refreshHour: number;
  rewards: CalendarReward[];
  linkedTaskIds?: string[];
}

export interface CalendarDayActivity {
  dateKey: string;
  workdayActivityId: string | null;
  limitedTaskIds: string[];
  festivalThemeId: string | null;
  rewardRefreshIds: string[];
}

export interface CalendarProgress {
  limitedTaskProgress: Record<string, {
    current: number;
    completed: boolean;
    claimed: boolean;
    completedAt?: number;
    claimedAt?: number;
  }>;
  workdayCompletion: Record<string, {
    dateKey: string;
    booksFound: number;
    completed: boolean;
    claimed: boolean;
  }>;
  festivalProgress: Record<string, {
    festivalId: string;
    participationDays: string[];
    booksFound: number;
    totalScore: number;
    rewardsClaimed: boolean;
  }>;
  claimedRewards: string[];
  lastRefreshCheck: string;
}

export interface CalendarDay {
  dateKey: string;
  date: Date;
  dayOfWeek: number;
  isToday: boolean;
  workday: WorkdayActivity | null;
  limitedTasks: LimitedTask[];
  festival: FestivalTheme | null;
  refreshes: RewardRefresh[];
  progress: {
    workdayCompleted: boolean;
    workdayProgress: number;
    limitedTaskStatus: Record<string, CalendarEventStatus>;
    festivalActive: boolean;
    refreshClaimed: Record<string, boolean>;
  };
}

export interface CalendarState {
  currentDateKey: string;
  selectedDateKey: string;
  activeFestivalId: string | null;
  calendarProgress: CalendarProgress;
  showCalendar: boolean;
  currentMonth: number;
  currentYear: number;
}

export interface CalendarIntegration {
  leaderboardBonus: {
    active: boolean;
    multiplier: number;
    sourceId: string;
    sourceType: CalendarEventType;
  };
  achievementBonus: {
    active: boolean;
    bonusProgress: Record<string, number>;
    sourceId: string;
  };
  challengeBonus: {
    active: boolean;
    scoreMultiplier: number;
    coinMultiplier: number;
    sourceId: string;
  };
}

export interface CalendarStats {
  totalWorkdaysCompleted: number;
  totalLimitedTasksCompleted: number;
  totalFestivalsParticipated: number;
  totalRewardsClaimed: number;
  currentStreak: number;
  longestStreak: number;
}
