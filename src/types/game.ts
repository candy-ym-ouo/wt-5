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
  type: 'author' | 'year' | 'genre' | 'title' | 'shelf' | 'description';
  unlocked: boolean;
  order: number;
}

export type ClueType = 'author' | 'year' | 'genre' | 'title' | 'shelf' | 'description';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  condition: string;
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

export type LeaderboardTab = 'weekly' | 'overall' | 'personal' | 'achievements';

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

export type GameMode = 'classic' | 'chapter';

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
}
