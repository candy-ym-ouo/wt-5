import type { CollectionEntry, AchievementProgress, DifficultyLevel, GameMode } from './game';

export type TitleCategory = 'streak' | 'achievement' | 'collection' | 'score' | 'special' | 'season';
export type TitleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PlayerTitle {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: TitleCategory;
  rarity: TitleRarity;
  color: string;
  unlocked: boolean;
  unlockedAt?: number;
  condition: string;
  requirement?: {
    type: 'streak' | 'score' | 'collection' | 'achievement' | 'games_played' | 'books_found' | 'season_rank' | 'special';
    value: number;
    difficulty?: DifficultyLevel;
  };
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: string;
  currentTitleId: string | null;
  createdAt: number;
  lastPlayedAt: number;
  totalPlayTime: number;
  preferences: PlayerPreferences;
}

export interface PlayerPreferences {
  theme: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: DifficultyLevel;
  difficultyMode: 'fixed' | 'dynamic';
  showTutorial: boolean;
  autoSave: boolean;
}

export interface PlayerStats {
  totalGamesPlayed: number;
  totalBooksFound: number;
  totalScore: number;
  averageScore: number;
  highestScore: number;
  highestScoreDate: number;
  fastestFind: number;
  fastestFindDate: number;
  longestStreak: number;
  longestStreakDate: number;
  fewestHints: number;
  fewestHintsDate: number;
  totalHintsUsed: number;
  totalWrongPicks: number;
  accuracy: number;
  winRate: number;
  totalPerfectRuns: number;
  totalNoHintRuns: number;
  difficultyStats: Record<DifficultyLevel, DifficultyStats>;
  modeStats: Record<GameMode, ModeStats>;
}

export interface DifficultyStats {
  gamesPlayed: number;
  booksFound: number;
  highestScore: number;
  averageScore: number;
  winRate: number;
}

export interface ModeStats {
  gamesPlayed: number;
  booksFound: number;
  highestScore: number;
  averageScore: number;
  completed: number;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  score: number;
  booksFound: number;
  timeUsed: number;
  hintsUsed: number;
  difficulty: DifficultyLevel;
  gameMode: GameMode;
  isWin: boolean;
  streak: number;
  isPersonalBest?: boolean;
  rating?: string;
  replayId?: string;
}

export interface ChallengeRecord {
  id: string;
  type: 'daily' | 'theme' | 'chapter' | 'rush' | 'commission';
  targetId: string;
  targetName: string;
  completedAt: number;
  score: number;
  bestScore: number;
  attempts: number;
  completed: boolean;
  rating?: string;
  rewards?: {
    coins?: number;
    reputation?: number;
    items?: string[];
  };
}

export interface AccountArchive {
  profile: PlayerProfile;
  stats: PlayerStats;
  unlockedTitles: string[];
  unlockedAchievements: string[];
  achievementProgress: Record<string, AchievementProgress>;
  collection: Record<string, CollectionEntry>;
  gameHistory: GameRecord[];
  challengeHistory: Record<string, ChallengeRecord>;
  recentReplays: string[];
  metadata: ArchiveMetadata;
}

export interface ArchiveMetadata {
  archiveVersion: number;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
  importedFrom?: string;
}

export interface SaveSlot {
  slotId: number;
  slotName: string;
  archiveId: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  isAutoSave: boolean;
  preview: SaveSlotPreview;
}

export interface SaveSlotPreview {
  nickname: string;
  score: number;
  level: number;
  booksFound: number;
  playTime: number;
  lastPlayed: number;
  thumbnail?: string;
}

export interface AccountStore {
  activeSlotId: number | null;
  saveSlots: SaveSlot[];
  currentArchive: AccountArchive | null;
  isLoading: boolean;
  isSaving: boolean;
  lastError: string | null;
}

export interface NicknameValidationResult {
  valid: boolean;
  message: string;
  suggested?: string;
}

export interface AccountMigrationResult {
  success: boolean;
  migrated: number;
  errors: string[];
}

export const DEFAULT_PREFERENCES: PlayerPreferences = {
  theme: 'default',
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
  difficultyMode: 'dynamic',
  showTutorial: true,
  autoSave: true,
};

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  totalGamesPlayed: 0,
  totalBooksFound: 0,
  totalScore: 0,
  averageScore: 0,
  highestScore: 0,
  highestScoreDate: 0,
  fastestFind: 0,
  fastestFindDate: 0,
  longestStreak: 0,
  longestStreakDate: 0,
  fewestHints: -1,
  fewestHintsDate: 0,
  totalHintsUsed: 0,
  totalWrongPicks: 0,
  accuracy: 0,
  winRate: 0,
  totalPerfectRuns: 0,
  totalNoHintRuns: 0,
  difficultyStats: {
    easy: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, winRate: 0 },
    normal: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, winRate: 0 },
    hard: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, winRate: 0 },
    expert: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, winRate: 0 },
    master: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, winRate: 0 },
  },
  modeStats: {
    classic: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, completed: 0 },
    chapter: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, completed: 0 },
    daily: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, completed: 0 },
    rush: { gamesPlayed: 0, booksFound: 0, highestScore: 0, averageScore: 0, completed: 0 },
  },
};

export const DEFAULT_ARCHIVE_METADATA: ArchiveMetadata = {
  archiveVersion: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  schemaVersion: 1,
};

export type AccountTab = 'profile' | 'stats' | 'titles' | 'history' | 'saves' | 'settings';
export type TitleFilter = 'all' | 'unlocked' | 'locked';
