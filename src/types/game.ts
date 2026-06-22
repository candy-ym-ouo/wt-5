export type RarityLevel = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  shelf: number;
  position: number;
  color: string;
  width: number;
  height: number;
  description: string;
  backgroundStory: string;
  descriptionClues: string[];
  isTarget?: boolean;
  rarity: RarityLevel;
  themes: string[];
  workshopReward?: boolean;
  icon?: string;
}

export interface ThemeChallenge {
  id: string;
  theme: string;
  icon: string;
  title: string;
  description: string;
  bookIds: string[];
  bonusScore: number;
  requiredBooks: number;
  unlocked: boolean;
}

export interface ThemeProgress {
  themeId: string;
  completedBookIds: string[];
  totalScore: number;
  completedAt?: number;
}

export interface ThemeReward {
  id: string;
  themeId: string;
  title: string;
  description: string;
  icon: string;
  bonusType: 'score' | 'hints' | 'powerup';
  value: number;
  unlocked: boolean;
}

export interface Clue {
  id: string;
  title: string;
  content: string;
  type: 'author' | 'year' | 'genre' | 'title' | 'shelf' | 'description' | 'background';
  unlocked: boolean;
  order: number;
}

export type ClueType = 'author' | 'year' | 'genre' | 'title' | 'shelf' | 'description' | 'background';

export type AchievementType = 'single' | 'progressive';

export interface AchievementStage {
  id: string;
  title: string;
  description: string;
  threshold: number;
  reward?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: AchievementType;
  unlocked: boolean;
  unlockedAt?: number;
  condition: string;
  stages?: AchievementStage[];
  progressKey?: string;
  maxProgress?: number;
}

export interface AchievementProgress {
  achievementId: string;
  currentProgress: number;
  unlockedStages: string[];
  unlockedAt?: number;
  completedAt?: number;
  stageUnlockTimes?: Record<string, number>;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timeUsed: number;
  hintsUsed: number;
  date: number;
  seasonId?: string;
  weekNumber?: number;
  difficulty?: DifficultyLevel;
  streak?: number;
  bestStreak?: number;
  replayId?: string;
}

export interface SeasonInfo {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
}

export interface PersonalBest {
  highestScore: number;
  highestScoreDate: number;
  totalGamesPlayed: number;
  totalBooksFound: number;
  fastestFind: number;
  fastestFindDate: number;
  fewestHintsScore: number;
  fewestHintsDate: number;
  fewestHintsCount: number;
  longestStreak: number;
  longestStreakDate: number;
  weeklyBestScores: Record<number, number>;
  seasonBestScores: Record<string, number>;
}

export type LeaderboardTab = 'weekly' | 'overall' | 'personal' | 'achievements' | 'daily';

export type GameState = 'idle' | 'playing' | 'paused' | 'won' | 'lost' | 'chapter_complete';

export type PowerUpType = 'free_hint' | 'time_peek' | 'eliminate_wrong';

export interface PowerUpConfig {
  id: PowerUpType;
  name: string;
  description: string;
  icon: string;
  scorePenalty: number;
  initialCount: number;
  peekDuration?: number;
  eliminateCount?: number;
}

export interface PowerUpState {
  freeHints: number;
  timePeeks: number;
  eliminateWrongs: number;
  peekActive: boolean;
  peekEndTime: number;
  eliminatedBookIds: string[];
  powerUpsUsedThisRound: {
    freeHints: number;
    timePeeks: number;
    eliminateWrongs: number;
  };
  powerUpsUsedTotal: {
    freeHints: number;
    timePeeks: number;
    eliminateWrongs: number;
  };
}

export type ChapterStatus = 'locked' | 'in_progress' | 'completed';

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert' | 'master';

export interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  description: string;
  icon: string;
  initialHints: number;
  hintPenalty: number;
  wrongPenaltyTime: number;
  wrongPenaltyScore: number;
  gameTime: number;
  baseScore: number;
  scoreMultiplier: number;
  targetBookFilter?: {
    genres?: string[];
    yearRange?: [number, number];
    shelves?: number[];
  };
  clueUnlockOrder?: ClueType[];
  dynamicAdjustment: {
    enabled: boolean;
    consecutiveCorrectThreshold: number;
    avgTimeThreshold: number;
    hintUsageThreshold: number;
  };
}

export interface DifficultyAdjustmentResult {
  newLevel: DifficultyLevel;
  reason: string;
  changed: boolean;
}

export type GameMode = 'classic' | 'chapter' | 'daily' | 'rush' | 'booklist';

export type RushStageStatus = 'pending' | 'current' | 'completed' | 'failed';

export interface RushStage {
  id: string;
  stageNumber: number;
  bookId: string;
  bookTitle: string;
  status: RushStageStatus;
  scoreEarned?: number;
  timeUsed?: number;
  hintsUsed?: number;
  wrongPicks?: number;
  stageBonus?: number;
  timeBonus?: number;
}

export interface RushState {
  active: boolean;
  totalStages: number;
  currentStageIndex: number;
  stages: RushStage[];
  stageRewards: {
    stage1Bonus: number;
    stage2Bonus: number;
    stage3Bonus: number;
    completionBonus: number;
    perfectBonus: number;
  };
  totalStageBonus: number;
  totalTimeBonus: number;
  noHintStages: number;
  noWrongStages: number;
  completed: boolean;
  perfectRun: boolean;
}

export type DifficultyMode = 'fixed' | 'dynamic';

export interface ChapterTask {
  id: string;
  bookId: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  scoreEarned?: number;
  timeUsed?: number;
  hintsUsed?: number;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  theme: string;
  icon: string;
  order: number;
  tasks: ChapterTask[];
  totalScore: number;
  bonusScore: number;
  unlocked: boolean;
  status: ChapterStatus;
  currentTaskIndex: number;
}

export interface ChapterProgress {
  chapterId: string;
  currentTaskIndex: number;
  completedTasks: string[];
  totalScore: number;
  totalTime: number;
  totalHints: number;
  completedAt?: number;
}

export interface StreakTitle {
  id: string;
  title: string;
  icon: string;
  minStreak: number;
  color: string;
}

export interface StreakReward {
  id: string;
  minStreak: number;
  bonusScore: number;
  bonusTime: number;
  bonusHints: number;
  titleId?: string;
  achievementId?: string;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  bestStreakDate: number;
  streakStartTime: number;
  totalStreakBonusScore: number;
  currentTitleId: string | null;
  inheritedStreak: boolean;
}

export type PenaltyLevel = 'warning' | 'caution' | 'danger' | 'critical';

export interface WrongPenaltyEvent {
  id: string;
  timestamp: number;
  level: PenaltyLevel;
  consecutiveCount: number;
  timePenalty: number;
  scorePenalty: number;
  hintFrozen: boolean;
  hintFreezeDuration: number;
  targetBookId: string;
  wrongBookId: string;
  currentLevel: number;
}

export interface WrongPenaltyState {
  consecutiveWrong: number;
  currentLevel: PenaltyLevel | null;
  hintFreezeUntil: number;
  totalTimePenalty: number;
  totalScorePenalty: number;
  totalHintFreezes: number;
  penaltyHistory: WrongPenaltyEvent[];
  maxConsecutiveWrong: number;
}

export interface RoundDetail {
  level: number;
  targetBookId: string;
  targetBookTitle: string;
  targetBookAuthor: string;
  targetBookGenre: string;
  targetBookYear: number;
  rarity: RarityLevel;
  findTime: number;
  hintsUsed: number;
  scoreEarned: number;
  unlockedClueTypes: ClueType[];
  wrongPicks: {
    bookId: string;
    bookTitle: string;
    timestamp: number;
    penalty: WrongPenaltyEvent | null;
  }[];
  themeFilter?: {
    used: boolean;
    available: boolean;
    displayThemeId: string | null;
    isGenuine: boolean;
    judgment: ThemeFilterJudgment;
    judgmentCorrect: boolean;
    compensationScore: number;
    bonusMultiplier: number;
    layoutAffected: boolean;
  };
  randomEvent?: {
    eventId: string;
    eventType: RandomEventType;
    eventTitle: string;
    scoreAdjustment: number;
    timeAdjustment: number;
    effects: RandomEventEffect[];
  };
}

export interface GameReplayData {
  id: string;
  playerName?: string;
  totalScore: number;
  totalTimeUsed: number;
  totalHintsUsed: number;
  booksFound: number;
  finalLevel: number;
  difficultyLevel: DifficultyLevel;
  difficultyMode: DifficultyMode;
  gameMode: GameMode;
  startTime: number;
  endTime: number;
  streak: {
    currentStreak: number;
    bestStreak: number;
  };
  rounds: RoundDetail[];
  wrongPenaltySummary: {
    totalWrongPicks: number;
    maxConsecutiveWrong: number;
    totalTimePenalty: number;
    totalScorePenalty: number;
    totalHintFreezes: number;
  };
  scoreBreakdown: {
    baseScore: number;
    timeBonus: number;
    streakBonus: number;
    rarityBonus: number;
    difficultyMultiplier: number;
    hintPenalty: number;
    wrongPenalty: number;
    powerUpPenalty: number;
  };
  isPersonalBest?: boolean;
  rank?: number;
  seasonId?: string;
  weekNumber?: number;
}

export type ThemeFilterJudgment = 'trusted' | 'distrusted' | null;

export interface ThemeFilterState {
  available: boolean;
  active: boolean;
  displayThemeId: string | null;
  isGenuine: boolean;
  usedThisRound: boolean;
  judgment: ThemeFilterJudgment;
  activationCost: {
    timePenalty: number;
    scorePenalty: number;
  };
  layoutAffected: boolean;
}

export interface ThemeFilterResult {
  judgmentCorrect: boolean;
  compensationScore: number;
  bonusMultiplier: number;
  details: string;
}

export interface GameStore {
  state: GameState;
  score: number;
  timeRemaining: number;
  hintsRemaining: number;
  hintsUsed: number;
  currentLevel: number;
  targetBookId: string | null;
  unlockedClues: string[];
  unlockedAchievements: string[];
  foundBooks: string[];
  consecutiveCorrect: number;
  currentChapterId: string | null;
  currentTaskIndex: number;
  chapterScore: number;
  chapterTimeUsed: number;
  chapterHintsUsed: number;
  gameMode: GameMode;
  difficultyLevel: DifficultyLevel;
  difficultyMode: DifficultyMode;
  difficultyHistory: DifficultyLevel[];
  roundStats: {
    findTimes: number[];
    hintsUsedPerRound: number[];
  };
  difficultyAdjustmentReason: string | null;
  showDifficultyChange: boolean;
  lastTimeBonus: number;
  powerUps: PowerUpState;
  currentThemeId: string | null;
  themeFoundBooks: string[];
  themeScore: number;
  streak: StreakState;
  showStreakPopup: boolean;
  lastStreakBonus: number;
  wrongPenalty: WrongPenaltyState;
  roundDetails: RoundDetail[];
  currentRoundWrongPicks: {
    bookId: string;
    bookTitle: string;
    timestamp: number;
    penalty: WrongPenaltyEvent | null;
  }[];
  themeFilter: ThemeFilterState;
  rush: RushState;
  randomEvent: RandomEventState;
  commission: CommissionState;
  anomalyEvent: AnomalyEventState;
  currentThemeCollectionId: string | null;
  themeCollectionFoundBooks: string[];
  themeCollectionScore: number;
  themeCollectionStartTime: number;
  themeCollectionActiveChallengeId: string | null;
  currentBooklistId: string | null;
  booklistFoundBooks: string[];
  booklistScore: number;
  booklistStartTime: number;
  booklistConsecutiveCorrect: number;
}

export interface DailyChallengeBook {
  bookId: string;
  order: number;
}

export interface DailyChallenge {
  date: string;
  books: DailyChallengeBook[];
  totalBooks: number;
}

export interface DailyChallengeScore {
  date: string;
  score: number;
  booksFound: number;
  timeUsed: number;
  hintsUsed: number;
  playerName?: string;
  timestamp: number;
}

export interface DailyChallengeProgress {
  date: string;
  bestScore: number;
  bestScoreTimestamp: number;
  booksFound: number;
  attempts: number;
  completed: boolean;
}

export type RatingGrade = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface RatingScoreBreakdown {
  timeScore: number;
  hintScore: number;
  accuracyScore: number;
  streakScore: number;
  totalScore: number;
}

export interface RatingResult {
  grade: RatingGrade;
  score: number;
  breakdown: RatingScoreBreakdown;
  title: string;
  description: string;
  detailedFeedback: {
    time: string;
    hints: string;
    accuracy: string;
    streak: string;
  };
  rewardMultiplier: number;
  bonusScore: number;
}

export interface RatingInput {
  totalTimeUsed: number;
  totalGameTime: number;
  avgFindTime: number;
  totalHintsUsed: number;
  totalBooksFound: number;
  totalWrongPicks: number;
  bestStreak: number;
  currentStreak: number;
  difficultyLevel: DifficultyLevel;
  completed: boolean;
}

export interface CollectionEntry {
  bookId: string;
  firstFoundAt: number;
  bestScore: number;
  bestScoreDate: number;
  fastestFind: number;
  fastestFindDate: number;
  fewestHints: number;
  fewestHintsDate: number;
  totalTimesFound: number;
  relatedAchievements: string[];
}

export type CollectionCategory = 'all' | '文学' | '古典' | '科普' | '技术' | '历史' | '哲学' | '科幻' | '散文' | '童话';

export type RandomEventType = 
  | 'power_outage' 
  | 'shelf_rearrange' 
  | 'hint_failure' 
  | 'time_warp' 
  | 'bonus_round'
  | 'fog_of_war'
  | 'lucky_find'
  | 'curse_of_doubt';

export type RandomEventEffectType = 
  | 'time_penalty' 
  | 'time_bonus' 
  | 'score_penalty' 
  | 'score_boost' 
  | 'hint_lock' 
  | 'layout_shuffle' 
  | 'book_false_highlight' 
  | 'book_obscure'
  | 'clue_reveal'
  | 'clue_hide'
  | 'score_multiplier'
  | 'time_multiplier';

export interface RandomEventEffect {
  type: RandomEventEffectType;
  value: number;
  duration?: number;
  description: string;
}

export interface RandomEvent {
  id: string;
  type: RandomEventType;
  title: string;
  description: string;
  icon: string;
  effects: RandomEventEffect[];
  probability: number;
  minLevel: number;
  maxLevel: number;
  difficultyRestriction?: DifficultyLevel[];
  gameModeRestriction?: GameMode[];
  positive: boolean;
  canCoexistWithRandomEvents: boolean;
}

export interface ActiveRandomEvent {
  event: RandomEvent;
  startTime: number;
  endTime: number;
  expiresAt?: number;
  activated: boolean;
  resolved: boolean;
  effectsApplied: boolean;
  roundAffected: number;
}

export interface RandomEventState {
  activeEvent: ActiveRandomEvent | null;
  showEventPopup: boolean;
  eventHistory: {
    eventId: string;
    round: number;
    timestamp: number;
    result: 'positive' | 'negative' | 'neutral';
  }[];
  eventsTriggeredThisGame: number;
  eventsSurvived: number;
  lastEventTriggeredAt: number;
}

export interface RandomEventResult {
  event: RandomEvent;
  scoreAdjustment: number;
  timeAdjustment: number;
  messages: string[];
}

export interface BookFamiliarity {
  bookId: string;
  familiarityScore: number;
  totalTimesFound: number;
  avgFindTime: number;
  avgHintsUsed: number;
}

export type FamiliarityLevel = 'unfamiliar' | 'familiar' | 'mastered';

export interface SmartBookSelectionOptions {
  difficultyLevel: DifficultyLevel;
  excludeIds?: string[];
  recentBookGenres?: string[];
  recentBookIds?: string[];
  collectionEntries?: Record<string, CollectionEntry>;
  consecutiveCorrect?: number;
  currentLevel?: number;
  targetFamiliarRatio?: number;
  genreDiversityWindow?: number;
  genreWeights?: Record<string, number>;
  rarityWeights?: Record<string, number>;
  rareBookBonusPercent?: number;
  preferredBookIds?: string[];
  preferredBookBoost?: number;
}

export interface SmartBookSelectionResult {
  book: Book;
  selectionReason: string;
  familiarityLevel: FamiliarityLevel;
  isNewGenre: boolean;
}

export type EraPreference = '古代' | '近代' | '现代' | '当代' | '任意';
export type ThemePreference = string;

export interface Customer {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  satisfactionBase: number;
}

export interface CustomerCommission {
  id: string;
  customer: Customer;
  vagueDescription: string;
  eraPreference: EraPreference;
  themePreference: ThemePreference;
  genreHint: string | null;
  timeLimit: number;
  startTime: number;
  endTime: number;
  targetBookIds: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  satisfaction: number;
  matchedBookId: string | null;
  matchScore: number;
  timeBonus: number;
  rewardCoins: number;
  rewardReputation: number;
}

export interface CommissionState {
  activeCommission: CustomerCommission | null;
  completedCommissions: CustomerCommission[];
  totalSatisfaction: number;
  totalCommissionsCompleted: number;
  totalCommissionsFailed: number;
  consecutiveSuccessfulCommissions: number;
  bestStreak: number;
  commissionQueue: CustomerCommission[];
  showCommissionPopup: boolean;
  lastCommissionResult: {
    success: boolean;
    satisfaction: number;
    rewards: { coins: number; reputation: number };
    matchDetails: string;
  } | null;
}

export interface CommissionMatchResult {
  isMatch: boolean;
  matchScore: number;
  eraMatch: boolean;
  themeMatch: boolean;
  genreMatch: boolean;
  descriptionMatch: boolean;
  matchDetails: string;
  satisfactionDelta: number;
}

export interface ThemeCollection {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: '历史' | '科幻' | '哲学' | '文学' | '科学' | '技术' | '古典' | '冒险';
  color: string;
  bookIds: string[];
  requiredBooks: number;
  rewardCoins: number;
  rewardReputation: number;
  rewardTitle?: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  unlockCondition?: {
    type: 'books_collected' | 'themes_completed' | 'level_reached';
    value: number;
  };
}

export interface ThemeCollectionProgress {
  collectionId: string;
  collectedBookIds: string[];
  completedAt?: number;
  bestScore: number;
  totalAttempts: number;
  fastestCompletion?: number;
}

export interface ThemeCollectionChallenge {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  icon: string;
  type: 'speed' | 'accuracy' | 'no_hint' | 'streak' | 'score';
  target: number;
  rewardCoins: number;
  rewardReputation: number;
  progress?: number;
  completed: boolean;
  completedAt?: number;
}

export interface ThemeCollectionRankEntry {
  playerName: string;
  avatar?: string;
  collectionId: string;
  score: number;
  booksCollected: number;
  timeUsed: number;
  hintsUsed: number;
  date: number;
}

export type ThemeCollectionTab = 'overview' | 'challenge' | 'codex' | 'ranking';

export type AnomalyEventType =
  | 'customer_queue_jump'
  | 'book_misplaced'
  | 'emergency_closing'
  | 'clue_damaged'
  | 'customer_complaint'
  | 'water_leak'
  | 'book_theft'
  | 'power_surge';

export type AnomalyEventSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type AnomalyEventEffectType =
  | 'time_penalty'
  | 'time_bonus'
  | 'score_penalty'
  | 'score_boost'
  | 'hint_lock'
  | 'hint_consume'
  | 'book_obscure'
  | 'book_misplace'
  | 'clue_damage'
  | 'clue_hide'
  | 'clue_reveal'
  | 'layout_shuffle'
  | 'consecutive_reset'
  | 'streak_break'
  | 'commission_fail'
  | 'multiplier_decrease'
  | 'multiplier_increase';

export interface AnomalyEventEffect {
  type: AnomalyEventEffectType;
  value: number;
  duration?: number;
  description: string;
  targetId?: string;
}

export type AnomalyResolutionType = 'time' | 'score' | 'hint' | 'choice' | 'immediate';

export interface AnomalyResolutionOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  cost: {
    time?: number;
    score?: number;
    hints?: number;
  };
  reward: {
    time?: number;
    score?: number;
    hints?: number;
    streakBonus?: boolean;
  };
  successRate: number;
}

export interface AnomalyEvent {
  id: string;
  type: AnomalyEventType;
  title: string;
  description: string;
  icon: string;
  severity: AnomalyEventSeverity;
  effects: AnomalyEventEffect[];
  resolutionOptions: AnomalyResolutionOption[];
  autoResolveAfter: number;
  probability: number;
  minLevel: number;
  maxLevel: number;
  difficultyRestriction?: DifficultyLevel[];
  gameModeRestriction?: GameMode[];
  canCoexistWithRandomEvents: boolean;
  triggerCondition?: {
    afterRounds?: number;
    afterBooksFound?: number;
    consecutiveCorrect?: number;
    consecutiveWrong?: number;
    timeRemainingBelow?: number;
    scoreAbove?: number;
  };
}

export interface ActiveAnomalyEvent {
  event: AnomalyEvent;
  startTime: number;
  autoResolveAt: number;
  expiresAt?: number;
  activated: boolean;
  resolved: boolean;
  resolution?: AnomalyResolutionOption;
  resolutionSuccess?: boolean;
  effectsApplied: boolean;
  roundAffected: number;
}

export interface AnomalyEventSchedule {
  enabled: boolean;
  minIntervalMs: number;
  maxEventsPerGame: number;
  allowedEventTypes: AnomalyEventType[];
  forbiddenEventTypes: AnomalyEventType[];
  severityWeights: Record<AnomalyEventSeverity, number>;
  customProbabilities?: Record<string, number>;
  triggerConditionsEnabled: boolean;
}

export interface AnomalyEventState {
  activeEvent: ActiveAnomalyEvent | null;
  showEventPopup: boolean;
  eventHistory: {
    eventId: string;
    round: number;
    timestamp: number;
    resolutionId?: string;
    success: boolean;
    scoreAdjustment: number;
    timeAdjustment: number;
  }[];
  eventsTriggeredThisGame: number;
  eventsResolvedSuccessfully: number;
  eventsFailed: number;
  lastEventTriggeredAt: number;
  schedule: AnomalyEventSchedule;
  damagedClueIds: Set<string>;
  misplacedBookIds: Set<string>;
}

export interface AnomalyEventResult {
  event: AnomalyEvent;
  resolution: AnomalyResolutionOption | null;
  success: boolean;
  scoreAdjustment: number;
  timeAdjustment: number;
  hintAdjustment: number;
  messages: string[];
  streakPreserved: boolean;
}

export const DEFAULT_ANOMALY_SCHEDULE: AnomalyEventSchedule = {
  enabled: true,
  minIntervalMs: 20000,
  maxEventsPerGame: 5,
  allowedEventTypes: [
    'customer_queue_jump',
    'book_misplaced',
    'emergency_closing',
    'clue_damaged',
    'customer_complaint',
    'water_leak',
    'book_theft',
    'power_surge',
  ],
  forbiddenEventTypes: [],
  severityWeights: {
    mild: 0.40,
    moderate: 0.35,
    severe: 0.20,
    critical: 0.05,
  },
  triggerConditionsEnabled: true,
};
