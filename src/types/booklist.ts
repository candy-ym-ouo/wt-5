import type { RarityLevel, DifficultyLevel } from './game';

export type EraRange = 'ancient' | 'modern' | 'contemporary' | 'custom';

export interface BooklistFilter {
  authors: string[];
  genres: string[];
  yearRange: [number, number] | null;
  era: EraRange | null;
  keywords: string[];
  rarities: RarityLevel[];
  themes: string[];
  minBooks: number;
  maxBooks: number;
}

export interface Booklist {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bookIds: string[];
  filter: BooklistFilter;
  createdAt: number;
  updatedAt: number;
  isCustom: boolean;
  difficulty: DifficultyLevel;
  targetBooks: number;
  rewardCoins: number;
  rewardReputation: number;
  rewardTitle?: string;
}

export interface BooklistProgress {
  booklistId: string;
  foundBookIds: string[];
  currentBookIndex: number;
  totalScore: number;
  totalTimeUsed: number;
  totalHintsUsed: number;
  bestScore: number;
  bestScoreDate: number;
  fastestCompletion: number;
  fastestCompletionDate: number;
  completions: number;
  completedAt?: number;
}

export interface BooklistChallenge {
  id: string;
  booklistId: string;
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

export interface BooklistLeaderboardEntry {
  id: string;
  playerName: string;
  booklistId: string;
  score: number;
  timeUsed: number;
  hintsUsed: number;
  booksFound: number;
  date: number;
  streak?: number;
  isPerfectRun?: boolean;
}

export type BooklistTab = 'browse' | 'create' | 'my_lists' | 'ranking';

export const ERA_RANGES: Record<EraRange, [number, number]> = {
  ancient: [-1000, 1900],
  modern: [1900, 1950],
  contemporary: [1950, 2025],
  custom: [0, 0],
};

export const ERA_LABELS: Record<EraRange, string> = {
  ancient: '古代（1900年前）',
  modern: '近代（1900-1950）',
  contemporary: '当代（1950年后）',
  custom: '自定义',
};

export const DEFAULT_FILTER: BooklistFilter = {
  authors: [],
  genres: [],
  yearRange: null,
  era: null,
  keywords: [],
  rarities: [],
  themes: [],
  minBooks: 5,
  maxBooks: 15,
};

export const PRESET_BOOKLISTS: Omit<Booklist, 'createdAt' | 'updatedAt' | 'isCustom'>[] = [
  {
    id: 'preset_classical_chinese',
    name: '华夏经典',
    description: '中国古典文学四大名著及经典著作',
    icon: '🏯',
    color: '#B8860B',
    bookIds: [],
    filter: {
      ...DEFAULT_FILTER,
      genres: ['古典'],
      minBooks: 5,
      maxBooks: 10,
    },
    difficulty: 'hard',
    targetBooks: 5,
    rewardCoins: 800,
    rewardReputation: 80,
    rewardTitle: '国学爱好者',
  },
  {
    id: 'preset_world_literature',
    name: '世界文学名著',
    description: '世界各地的文学经典之作',
    icon: '🌍',
    color: '#4169E1',
    bookIds: [],
    filter: {
      ...DEFAULT_FILTER,
      genres: ['文学'],
      minBooks: 5,
      maxBooks: 12,
    },
    difficulty: 'normal',
    targetBooks: 5,
    rewardCoins: 600,
    rewardReputation: 60,
  },
  {
    id: 'preset_tech_books',
    name: '技术经典',
    description: '计算机科学与软件工程经典著作',
    icon: '💻',
    color: '#2E8B57',
    bookIds: [],
    filter: {
      ...DEFAULT_FILTER,
      genres: ['技术'],
      minBooks: 3,
      maxBooks: 8,
    },
    difficulty: 'hard',
    targetBooks: 4,
    rewardCoins: 700,
    rewardReputation: 70,
    rewardTitle: '技术达人',
  },
  {
    id: 'preset_science_popular',
    name: '科普读物',
    description: '探索自然奥秘的科普经典',
    icon: '🔬',
    color: '#4682B4',
    bookIds: [],
    filter: {
      ...DEFAULT_FILTER,
      genres: ['科普'],
      minBooks: 3,
      maxBooks: 8,
    },
    difficulty: 'easy',
    targetBooks: 4,
    rewardCoins: 500,
    rewardReputation: 50,
  },
  {
    id: 'preset_philosophy',
    name: '哲学智慧',
    description: '东西方哲学思想的经典著作',
    icon: '🧠',
    color: '#6A5ACD',
    bookIds: [],
    filter: {
      ...DEFAULT_FILTER,
      genres: ['哲学'],
      minBooks: 3,
      maxBooks: 6,
    },
    difficulty: 'hard',
    targetBooks: 3,
    rewardCoins: 650,
    rewardReputation: 65,
  },
  {
    id: 'preset_history',
    name: '历史长河',
    description: '记载人类文明兴衰的历史典籍',
    icon: '🏛️',
    color: '#CD853F',
    bookIds: [],
    filter: {
      ...DEFAULT_FILTER,
      genres: ['历史'],
      minBooks: 3,
      maxBooks: 6,
    },
    difficulty: 'normal',
    targetBooks: 3,
    rewardCoins: 550,
    rewardReputation: 55,
  },
];
