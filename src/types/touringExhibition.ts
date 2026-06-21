import type { RarityLevel, DifficultyLevel } from './game';
import type { ActivityReward } from './activity';

export type { ActivityReward };

export type ExhibitionType = 'city' | 'theme';

export type ExhibitionStatus = 'upcoming' | 'active' | 'completed' | 'expired';

export type ExhibitionTab = 'overview' | 'current' | 'upcoming' | 'history' | 'collection';

export interface RuleAdjustment {
  id: string;
  description: string;
  effectType: 'score_multiplier' | 'coin_multiplier' | 'hint_count' | 'time_bonus' | 'rarity_boost' | 'difficulty_adjust';
  value: number;
  condition?: string;
}

export interface LimitedCollectionReward {
  id: string;
  bookId: string;
  title: string;
  description: string;
  icon: string;
  rarity: RarityLevel;
  unlockCondition: string;
  unlockThreshold: number;
  exclusive: boolean;
  expiresAfterExhibition: boolean;
}

export interface TouringExhibition {
  id: string;
  type: ExhibitionType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  coverImage?: string;
  city?: string;
  cityIcon?: string;
  theme?: string;
  startDate: string;
  endDate: string;
  bookIds: string[];
  requiredBooks: number;
  ruleAdjustments: RuleAdjustment[];
  limitedCollection: LimitedCollectionReward[];
  rewards: ActivityReward[];
  completionReward?: ActivityReward[];
  backgroundStyle?: string;
  tags?: string[];
  featured?: boolean;
}

export interface ExhibitionProgress {
  foundBookIds: string[];
  currentProgress: number;
  totalScore: number;
  collectionPoints: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: number;
  claimedAt?: number;
  collectedBookIds: string[];
  scoreMultiplier: number;
  coinMultiplier: number;
}

export interface ExhibitionStats {
  totalExhibitionsParticipated: number;
  totalExhibitionsCompleted: number;
  totalCollectionPoints: number;
  totalExhibitionRewardsClaimed: number;
  totalLimitedBooksCollected: number;
  currentExhibitionStreak: number;
  longestExhibitionStreak: number;
}

export interface ExhibitionState {
  currentDateKey: string;
  activeExhibitionId: string | null;
  showExhibitionCenter: boolean;
  activeTab: ExhibitionTab;
  exhibitionProgress: Record<string, ExhibitionProgress>;
}

export interface ExhibitionInfo {
  state: ExhibitionState;
  stats: ExhibitionStats;
  activeExhibitions: TouringExhibition[];
  upcomingExhibitions: TouringExhibition[];
  completedExhibitions: TouringExhibition[];
  isVisible: boolean;
  unclaimedRewards: number;
  totalCollectionPoints: number;
  todayKey: string;
}

export interface ExhibitionGameResult {
  exhibitionPointsEarned: number;
  exhibitionScoreBonus: number;
  exhibitionCoinBonus: number;
  completedExhibitionIds: string[];
  unlockedCollectionIds: string[];
  scoreMultiplier: number;
  coinMultiplier: number;
}

export interface ExhibitionIntegration {
  scoreMultiplier: number;
  coinMultiplier: number;
  hintBonus: number;
  timeBonus: number;
  activeExhibitionId: string | null;
  activeExhibitionTitle: string | null;
  rarityBoost: RarityLevel | null;
  difficultyAdjust: DifficultyLevel | null;
  bonusPerBook: {
    coins: number;
    score: number;
    points: number;
  };
}
