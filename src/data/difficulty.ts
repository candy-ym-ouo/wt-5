import type { DifficultyConfig, DifficultyLevel, DifficultyAdjustmentResult, Book } from '../types/game';
import { BOOKS } from './books';

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: '入门',
    description: '适合新手，提示充足，时间充裕，扣分温和。',
    icon: '🌱',
    initialHints: 9,
    hintPenalty: 20,
    wrongPenaltyTime: 3,
    wrongPenaltyScore: 0,
    gameTime: 240,
    baseScore: 500,
    scoreMultiplier: 0.8,
    targetBookFilter: {
      genres: ['文学', '古典', '童话', '散文'],
    },
    clueUnlockOrder: ['year', 'genre', 'description', 'shelf', 'background', 'author', 'title'],
    dynamicAdjustment: {
      enabled: true,
      consecutiveCorrectThreshold: 3,
      avgTimeThreshold: 45,
      hintUsageThreshold: 0.5,
    },
  },
  normal: {
    id: 'normal',
    name: '普通',
    description: '标准难度，平衡的挑战体验。',
    icon: '📖',
    initialHints: 7,
    hintPenalty: 50,
    wrongPenaltyTime: 5,
    wrongPenaltyScore: 50,
    gameTime: 180,
    baseScore: 1000,
    scoreMultiplier: 1.0,
    clueUnlockOrder: ['year', 'author', 'genre', 'description', 'shelf', 'background', 'title'],
    dynamicAdjustment: {
      enabled: true,
      consecutiveCorrectThreshold: 3,
      avgTimeThreshold: 30,
      hintUsageThreshold: 0.3,
    },
  },
  hard: {
    id: 'hard',
    name: '困难',
    description: '提示稀缺，时间紧迫，扣分严厉。',
    icon: '🔥',
    initialHints: 5,
    hintPenalty: 80,
    wrongPenaltyTime: 8,
    wrongPenaltyScore: 100,
    gameTime: 150,
    baseScore: 1500,
    scoreMultiplier: 1.5,
    targetBookFilter: {
      genres: ['哲学', '历史', '科普', '技术'],
    },
    clueUnlockOrder: ['genre', 'description', 'year', 'shelf', 'background', 'author', 'title'],
    dynamicAdjustment: {
      enabled: true,
      consecutiveCorrectThreshold: 4,
      avgTimeThreshold: 25,
      hintUsageThreshold: 0.2,
    },
  },
  expert: {
    id: 'expert',
    name: '专家',
    description: '极限挑战，只有真正的藏书家才能驾驭。',
    icon: '🏆',
    initialHints: 3,
    hintPenalty: 120,
    wrongPenaltyTime: 12,
    wrongPenaltyScore: 200,
    gameTime: 120,
    baseScore: 2500,
    scoreMultiplier: 2.0,
    targetBookFilter: {
      yearRange: [1800, 2000],
    },
    clueUnlockOrder: ['shelf', 'description', 'year', 'background', 'genre', 'author', 'title'],
    dynamicAdjustment: {
      enabled: true,
      consecutiveCorrectThreshold: 5,
      avgTimeThreshold: 20,
      hintUsageThreshold: 0.1,
    },
  },
  master: {
    id: 'master',
    name: '大师',
    description: '传说级难度，考验你对书籍的真正理解。',
    icon: '👑',
    initialHints: 2,
    hintPenalty: 200,
    wrongPenaltyTime: 15,
    wrongPenaltyScore: 300,
    gameTime: 90,
    baseScore: 4000,
    scoreMultiplier: 3.0,
    clueUnlockOrder: ['description', 'background', 'year', 'genre', 'shelf', 'author', 'title'],
    dynamicAdjustment: {
      enabled: false,
      consecutiveCorrectThreshold: 999,
      avgTimeThreshold: 0,
      hintUsageThreshold: 0,
    },
  },
};

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'normal', 'hard', 'expert', 'master'];

export const getDifficultyConfig = (level: DifficultyLevel): DifficultyConfig => {
  return DIFFICULTY_CONFIGS[level];
};

export const filterBooksByDifficulty = (level: DifficultyLevel, excludeIds: string[] = []): Book[] => {
  const config = getDifficultyConfig(level);
  let books = BOOKS.filter(b => !excludeIds.includes(b.id));

  if (config.targetBookFilter) {
    const filter = config.targetBookFilter;
    
    if (filter.genres && filter.genres.length > 0) {
      books = books.filter(b => filter.genres!.includes(b.genre));
    }
    
    if (filter.yearRange) {
      const [minYear, maxYear] = filter.yearRange;
      books = books.filter(b => b.year >= minYear && b.year <= maxYear);
    }
    
    if (filter.shelves && filter.shelves.length > 0) {
      books = books.filter(b => filter.shelves!.includes(b.shelf));
    }
  }

  if (books.length === 0) {
    books = BOOKS.filter(b => !excludeIds.includes(b.id));
  }

  return books;
};

export const selectRandomTargetByDifficulty = (
  level: DifficultyLevel,
  excludeIds: string[] = []
): Book => {
  const availableBooks = filterBooksByDifficulty(level, excludeIds);
  if (availableBooks.length === 0) {
    return BOOKS[Math.floor(Math.random() * BOOKS.length)];
  }
  return availableBooks[Math.floor(Math.random() * availableBooks.length)];
};

export const getNextDifficultyLevel = (current: DifficultyLevel): DifficultyLevel | null => {
  const currentIndex = DIFFICULTY_LEVELS.indexOf(current);
  if (currentIndex < DIFFICULTY_LEVELS.length - 1) {
    return DIFFICULTY_LEVELS[currentIndex + 1];
  }
  return null;
};

export const getPrevDifficultyLevel = (current: DifficultyLevel): DifficultyLevel | null => {
  const currentIndex = DIFFICULTY_LEVELS.indexOf(current);
  if (currentIndex > 0) {
    return DIFFICULTY_LEVELS[currentIndex - 1];
  }
  return null;
};

export const adjustDifficulty = (
  currentLevel: DifficultyLevel,
  config: DifficultyConfig,
  roundStats: {
    findTimes: number[];
    hintsUsedPerRound: number[];
    consecutiveCorrect: number;
    currentLevelNum: number;
  }
): DifficultyAdjustmentResult => {
  if (!config.dynamicAdjustment.enabled) {
    return {
      newLevel: currentLevel,
      reason: '当前难度不支持动态调整',
      changed: false,
    };
  }

  if (roundStats.currentLevelNum < 3) {
    return {
      newLevel: currentLevel,
      reason: '需要更多回合数据来评估难度',
      changed: false,
    };
  }

  const { consecutiveCorrectThreshold, avgTimeThreshold, hintUsageThreshold } = config.dynamicAdjustment;
  
  const recentFindTimes = roundStats.findTimes.slice(-3);
  const avgFindTime = recentFindTimes.reduce((a, b) => a + b, 0) / recentFindTimes.length;
  
  const recentHints = roundStats.hintsUsedPerRound.slice(-3);
  const avgHintsUsed = recentHints.reduce((a, b) => a + b, 0) / recentHints.length;
  const totalClues = 7;
  const hintUsageRate = avgHintsUsed / totalClues;

  if (roundStats.consecutiveCorrect >= consecutiveCorrectThreshold && 
      avgFindTime < avgTimeThreshold && 
      hintUsageRate < hintUsageThreshold) {
    const nextLevel = getNextDifficultyLevel(currentLevel);
    if (nextLevel) {
      return {
        newLevel: nextLevel,
        reason: `连续${roundStats.consecutiveCorrect}次正确，平均用时${Math.floor(avgFindTime)}秒，表现优秀！`,
        changed: true,
      };
    }
  }

  if (roundStats.consecutiveCorrect === 0 && avgFindTime > avgTimeThreshold * 2) {
    const prevLevel = getPrevDifficultyLevel(currentLevel);
    if (prevLevel) {
      return {
        newLevel: prevLevel,
        reason: `连续出错，平均用时${Math.floor(avgFindTime)}秒，适当降低难度。`,
        changed: true,
      };
    }
  }

  return {
    newLevel: currentLevel,
    reason: '保持当前难度',
    changed: false,
  };
};

export const calculateScoreWithDifficulty = (
  baseScore: number,
  timeRemaining: number,
  hintsUsed: number,
  difficulty: DifficultyLevel,
  findTime: number,
  powerUpPenalty: number = 0
): number => {
  const config = getDifficultyConfig(difficulty);
  const timeBonus = Math.floor(timeRemaining / 10) * 10;
  const hintPenalty = hintsUsed * config.hintPenalty;
  const timeEfficiencyBonus = Math.max(0, Math.floor((config.gameTime / 2 - findTime) * 2));
  
  const rawScore = (baseScore + timeBonus + timeEfficiencyBonus - hintPenalty - powerUpPenalty) * config.scoreMultiplier;
  return Math.max(Math.floor(rawScore), 100);
};
