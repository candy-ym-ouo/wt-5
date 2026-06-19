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
}

export interface Clue {
  id: string;
  title: string;
  content: string;
  type: 'author' | 'year' | 'genre' | 'title' | 'shelf' | 'description';
  unlocked: boolean;
  order: number;
}

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
}

export type GameState = 'idle' | 'playing' | 'paused' | 'won' | 'lost' | 'chapter_complete';

export type ChapterStatus = 'locked' | 'in_progress' | 'completed';

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
  gameMode: 'classic' | 'chapter';
}
