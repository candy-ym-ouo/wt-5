export type QuestCategory = 'daily' | 'growth' | 'chapter' | 'hidden';

export type QuestStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'claimed';

export type QuestConditionType =
  | 'find_books'
  | 'find_genre_books'
  | 'find_rarity_books'
  | 'complete_games'
  | 'complete_chapters'
  | 'achieve_score'
  | 'achieve_streak'
  | 'use_hints'
  | 'use_no_hints'
  | 'use_powerup'
  | 'complete_commission'
  | 'repair_books'
  | 'collect_books'
  | 'play_difficulty'
  | 'play_daily'
  | 'play_rush'
  | 'play_theme'
  | 'spend_coins'
  | 'earn_coins'
  | 'level_up_store'
  | 'dialogue_count'
  | 'custom';

export type QuestRewardType = 'coins' | 'score' | 'hints' | 'powerup' | 'achievement' | 'title' | 'decoration' | 'points';

export interface QuestReward {
  type: QuestRewardType;
  value: number;
  description?: string;
  powerUpType?: 'free_hint' | 'time_peek' | 'eliminate_wrong';
  achievementId?: string;
  titleId?: string;
  decorationId?: string;
}

export interface QuestCondition {
  type: QuestConditionType;
  target: number;
  params?: Record<string, unknown>;
}

export interface Quest {
  id: string;
  category: QuestCategory;
  title: string;
  description: string;
  icon: string;
  order: number;
  conditions: QuestCondition[];
  rewards: QuestReward[];
  status: QuestStatus;
  resetDaily: boolean;
  hidden: boolean;
  unlockCondition?: QuestCondition;
  prerequisiteQuestIds?: string[];
  chainId?: string;
  chainOrder?: number;
  chapterId?: string;
  maxProgress: number;
  progressKey: string;
}

export interface QuestProgress {
  questId: string;
  currentProgress: number;
  status: QuestStatus;
  unlockedAt?: number;
  completedAt?: number;
  claimedAt?: number;
  dateKey?: string;
}

export interface QuestChain {
  id: string;
  title: string;
  description: string;
  icon: string;
  questIds: string[];
  completionReward?: QuestReward;
}

export interface QuestDailyReset {
  lastResetDate: string;
  resetQuestIds: string[];
}

export interface QuestStats {
  totalCompleted: number;
  totalClaimed: number;
  dailyCompleted: number;
  growthCompleted: number;
  chapterCompleted: number;
  hiddenCompleted: number;
  totalCoinsEarned: number;
  totalScoreEarned: number;
  currentDailyStreak: number;
  longestDailyStreak: number;
}

export interface QuestState {
  questProgress: Record<string, QuestProgress>;
  questStats: QuestStats;
  dailyReset: QuestDailyReset;
  activeTab: QuestCategory;
  showQuestPanel: boolean;
  showRewardPopup: QuestReward | null;
  showCompletePopup: string | null;
}

export type QuestTab = QuestCategory | 'all';

export interface QuestGroupInfo {
  category: QuestCategory;
  label: string;
  icon: string;
  quests: QuestDisplayInfo[];
  completedCount: number;
  totalCount: number;
}

export interface QuestDisplayInfo {
  quest: Quest;
  progress: QuestProgress;
  percent: number;
  isComplete: boolean;
  canClaim: boolean;
  chainInfo?: {
    chainId: string;
    chainTitle: string;
    chainPosition: number;
    chainTotal: number;
  };
}
