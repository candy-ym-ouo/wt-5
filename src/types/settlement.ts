import type {
  GameReplayData,
  DifficultyLevel,
  GameMode,
  AchievementProgress,
  RoundDetail,
} from './game';
import type { QuestReward } from './quest';
import type { DiscoveryRecord } from './codex';

export type SettlementTab = 'overview' | 'game' | 'season' | 'quests' | 'achievements' | 'codex';

export interface GameResultSummary {
  replay: GameReplayData;
  isWin: boolean;
  isPersonalBest: boolean;
  rank?: number;
  rating?: string;
}

export interface SeasonProgress {
  seasonId: string;
  weekNumber: number;
  gamesPlayedThisWeek: number;
  gamesPlayedThisSeason: number;
  totalScoreThisWeek: number;
  totalScoreThisSeason: number;
  bestScoreThisWeek: number;
  bestScoreThisSeason: number;
  weeklyRank?: number;
  seasonRank?: number;
  totalBooksFoundThisWeek: number;
  totalBooksFoundThisSeason: number;
}

export interface QuestResult {
  questId: string;
  questTitle: string;
  category: 'daily' | 'growth' | 'chapter' | 'hidden';
  status: 'completed' | 'in_progress' | 'newly_available';
  progress: number;
  maxProgress: number;
  rewards: QuestReward[];
  claimed: boolean;
}

export interface AchievementResult {
  achievementId: string;
  achievementTitle: string;
  achievementIcon: string;
  type: 'single' | 'progressive';
  status: 'newly_unlocked' | 'stage_unlocked' | 'progress_updated';
  progress: AchievementProgress;
  newStages?: string[];
  reward?: string;
}

export interface CodexUnlock {
  type: 'book' | 'author' | 'theme' | 'easter_egg';
  id: string;
  name: string;
  icon?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isFirstDiscovery: boolean;
  discoveryRecord?: DiscoveryRecord;
}

export interface SettlementReward {
  type: 'coins' | 'score' | 'hints' | 'powerup' | 'title' | 'achievement';
  value: number;
  label: string;
  icon: string;
  powerUpType?: string;
  titleId?: string;
  achievementId?: string;
}

export interface SettlementData {
  id: string;
  timestamp: number;
  gameResult: GameResultSummary;
  seasonProgress: SeasonProgress;
  questResults: QuestResult[];
  achievementResults: AchievementResult[];
  codexUnlocks: CodexUnlock[];
  totalRewards: SettlementReward[];
  summary: {
    totalScore: number;
    totalCoins: number;
    newUnlocksCount: number;
    achievementsUnlocked: number;
    questsCompleted: number;
  };
}

export interface SettlementContext {
  gameReplay: GameReplayData;
  isWin: boolean;
  isPersonalBest: boolean;
  rank?: number;
  rating?: string;
  foundBooks: string[];
  foundGenres: string[];
  rarityBooksFound: Record<string, number>;
  totalHintsUsed: number;
  noHintRounds: number;
  powerupsUsed: {
    freeHints: number;
    timePeeks: number;
    eliminateWrongs: number;
  };
  consecutiveCorrect: number;
  bestStreak: number;
  difficulty: DifficultyLevel;
  gameMode: GameMode;
  fastFinds: Record<number, number>;
  commissionsCompleted: number;
  chaptersCompleted: number;
  dailyGamesCompleted: number;
  rushCompleted: number;
  perfectRushCompleted: number;
  themeGamesCompleted: number;
  storeLevel: number;
  coinsEarned: number;
  coinsSpent: number;
  booksRepaired: number;
  collectedBooks: number;
  dialoguesCompleted: number;
  roundDetails: RoundDetail[];
}

export interface SettlementProcessor {
  process(context: SettlementContext): Promise<void>;
  getResults(): {
    questResults: QuestResult[];
    achievementResults: AchievementResult[];
    codexUnlocks: CodexUnlock[];
    rewards: SettlementReward[];
  };
}

export interface SettlementState {
  isVisible: boolean;
  activeTab: SettlementTab;
  settlementData: SettlementData | null;
  isProcessing: boolean;
  showRewardAnimations: boolean;
}
