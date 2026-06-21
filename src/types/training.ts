import type { DifficultyLevel, ClueType } from './game';
export type { ClueType };

export type TrainingTab = 'rules' | 'practice' | 'wrongBook' | 'recommend';

export interface RuleLesson {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'basic' | 'clues' | 'scoring' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    sections: {
      title: string;
      icon?: string;
      paragraphs: string[];
      tips?: string[];
      warnings?: string[];
    }[];
  };
  quiz?: RuleQuiz;
  unlocked: boolean;
  completed: boolean;
  order: number;
  estimatedTime: number;
}

export interface RuleQuiz {
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  type: 'single' | 'multiple' | 'truefalse';
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

export interface PracticeModule {
  id: string;
  title: string;
  icon: string;
  description: string;
  type: 'clue_focus' | 'speed' | 'accuracy' | 'memory' | 'genre';
  focusClueTypes?: ClueType[];
  difficulty: 'easy' | 'medium' | 'hard';
  targetScore: number;
  questionsCount: number;
  timeLimit: number;
  unlocked: boolean;
  bestScore?: number;
  completedCount: number;
  order: number;
}

export interface PracticeSession {
  moduleId: string;
  startTime: number;
  endTime?: number;
  score: number;
  correctCount: number;
  totalCount: number;
  wrongBookIds: string[];
  timeUsed: number;
}

export interface WrongBookEntry {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookGenre: string;
  bookRarity: string;
  wrongCount: number;
  lastWrongTime: number;
  wrongReasons: WrongReason[];
  mastered: boolean;
  reviewCount: number;
  correctStreak: number;
}

export type WrongReason = 
  | 'genre_confusion'
  | 'year_estimation_error'
  | 'author_unfamiliar'
  | 'shelf_position_error'
  | 'description_misunderstanding'
  | 'background_story_forget'
  | 'careless_mistake'
  | 'other';

export const WRONG_REASON_LABELS: Record<WrongReason, { label: string; icon: string }> = {
  genre_confusion: { label: '类型混淆', icon: '📚' },
  year_estimation_error: { label: '年份判断错误', icon: '📅' },
  author_unfamiliar: { label: '作者不熟悉', icon: '✍️' },
  shelf_position_error: { label: '书架位置错', icon: '🗄️' },
  description_misunderstanding: { label: '描述理解错', icon: '📝' },
  background_story_forget: { label: '背景故事遗忘', icon: '✨' },
  careless_mistake: { label: '粗心大意', icon: '😅' },
  other: { label: '其他原因', icon: '❓' },
};

export interface DifficultyRecommendation {
  recommendedLevel: DifficultyLevel;
  confidence: number;
  reasons: string[];
  currentLevelStats: LevelStats;
  nextLevelGoal: LevelGoal;
}

export interface LevelStats {
  level: DifficultyLevel;
  gamesPlayed: number;
  avgScore: number;
  avgFindTime: number;
  avgHintsUsed: number;
  accuracy: number;
  winRate: number;
}

export interface LevelGoal {
  targetLevel: DifficultyLevel;
  requirements: {
    type: 'avgScore' | 'avgFindTime' | 'avgHints' | 'accuracy' | 'winRate' | 'gamesPlayed';
    current: number;
    target: number;
    unit: string;
    description: string;
  }[];
}

export interface TrainingProgress {
  completedLessons: string[];
  passedQuizzes: string[];
  practiceModules: Record<string, {
    bestScore: number;
    completedCount: number;
    lastPlayedAt?: number;
  }>;
  wrongBooks: WrongBookEntry[];
  currentRecommendedDifficulty: DifficultyLevel;
  totalPracticeTime: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  skillLevels: Record<ClueType, number>;
}

export interface SkillLevelInfo {
  level: number;
  maxLevel: number;
  name: string;
  icon: string;
  description: string;
  xp: number;
  xpToNext: number;
}

export const CLUE_SKILL_NAMES: Record<ClueType, { name: string; icon: string }> = {
  year: { name: '年代判断', icon: '📅' },
  author: { name: '作者识别', icon: '✍️' },
  genre: { name: '类型分类', icon: '📚' },
  title: { name: '书名记忆', icon: '📖' },
  shelf: { name: '位置定位', icon: '🗄️' },
  description: { name: '描述理解', icon: '📝' },
  background: { name: '背景联想', icon: '✨' },
};
