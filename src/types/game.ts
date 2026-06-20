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

export type GameMode = 'classic' | 'chapter' | 'daily' | 'rush';

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
