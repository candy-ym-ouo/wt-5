import type { DifficultyConfig, DifficultyLevel, DifficultyAdjustmentResult, Book, CollectionEntry, BookFamiliarity, FamiliarityLevel, SmartBookSelectionOptions, SmartBookSelectionResult, DailyChallenge, DailyChallengeBook } from '../types/game';
import { BOOKS } from './books';
import { getDateKey } from './dailyChallenge';
import type { RarityLevel } from '../types/game';
import { getUnlockedWorkshopRewardIds } from '../utils/workshopStorage';

const RARITY_ORDER: RarityLevel[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

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
  const unlockedRewardIds = getUnlockedWorkshopRewardIds();

  let books = BOOKS.filter(b => {
    if (excludeIds.includes(b.id)) return false;
    if (b.workshopReward && !unlockedRewardIds.has(b.id)) return false;
    return true;
  });

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
    books = BOOKS.filter(b => {
      if (excludeIds.includes(b.id)) return false;
      if (b.workshopReward && !unlockedRewardIds.has(b.id)) return false;
      return true;
    });
  }

  return books;
};

export const selectRandomTargetByDifficulty = (
  level: DifficultyLevel,
  excludeIds: string[] = []
): Book => {
  const availableBooks = filterBooksByDifficulty(level, excludeIds);
  if (availableBooks.length === 0) {
    const fallbackPool = BOOKS.filter(b => !b.workshopReward);
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
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

export const calculateBookFamiliarity = (
  bookId: string,
  collectionEntries: Record<string, CollectionEntry>
): BookFamiliarity => {
  const entry = collectionEntries[bookId];
  
  if (!entry) {
    return {
      bookId,
      familiarityScore: 0,
      totalTimesFound: 0,
      avgFindTime: 0,
      avgHintsUsed: 0,
    };
  }

  const { totalTimesFound, fastestFind, fewestHints } = entry;
  
  const timesFactor = Math.min(totalTimesFound / 5, 1) * 0.4;
  
  const timeScore = fastestFind > 0 ? Math.max(0, 1 - fastestFind / 120) : 0;
  const timeFactor = timeScore * 0.3;
  
  const hintScore = Math.max(0, 1 - fewestHints / 7);
  const hintFactor = hintScore * 0.3;
  
  const familiarityScore = Math.max(0, Math.min(1, timesFactor + timeFactor + hintFactor));

  return {
    bookId,
    familiarityScore,
    totalTimesFound,
    avgFindTime: fastestFind,
    avgHintsUsed: fewestHints,
  };
};

export const getFamiliarityLevel = (score: number): FamiliarityLevel => {
  if (score >= 0.7) return 'mastered';
  if (score >= 0.3) return 'familiar';
  return 'unfamiliar';
};



export const selectSmartTargetBook = (
  options: SmartBookSelectionOptions
): SmartBookSelectionResult => {
  const {
    difficultyLevel,
    excludeIds = [],
    recentBookGenres = [],
    recentBookIds = [],
    collectionEntries = {},
    consecutiveCorrect = 0,
    currentLevel = 1,
    targetFamiliarRatio = 0.4,
    genreDiversityWindow = 3,
    genreWeights = {},
    rarityWeights = {},
    rareBookBonusPercent = 0,
  } = options;

  let availableBooks = filterBooksByDifficulty(difficultyLevel, [
    ...excludeIds,
    ...recentBookIds,
  ]);

  if (availableBooks.length === 0) {
    availableBooks = BOOKS.filter(b => {
      if (excludeIds.includes(b.id)) return false;
      if (b.workshopReward) return false;
      return true;
    });
  }

  if (availableBooks.length === 0) {
    const fallbackPool = BOOKS.filter(b => !b.workshopReward);
    const fallbackBook = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    return {
      book: fallbackBook,
      selectionReason: '可用书籍不足，随机选择',
      familiarityLevel: 'unfamiliar',
      isNewGenre: true,
    };
  }

  const recentGenresSet = new Set(
    recentBookGenres.slice(-genreDiversityWindow)
  );

  const booksWithDiversityBoost = availableBooks.map(book => {
    const isNewGenre = !recentGenresSet.has(book.genre);
    const diversityBoost = isNewGenre ? 0.3 : 0;

    let decorationGenreBoost = 0;
    if (genreWeights && genreWeights[book.genre]) {
      decorationGenreBoost = Math.min(genreWeights[book.genre] / 100, 0.5);
    }

    let decorationRarityBoost = 0;
    if (rarityWeights && rarityWeights[book.rarity]) {
      decorationRarityBoost = Math.min(rarityWeights[book.rarity] / 100, 0.4);
    }

    if (rareBookBonusPercent && rareBookBonusPercent > 0) {
      const rarityIndex = RARITY_ORDER.indexOf(book.rarity);
      if (rarityIndex >= 2) {
        decorationRarityBoost += Math.min((rareBookBonusPercent / 100) * (rarityIndex - 1), 0.3);
      }
    }

    return { book, diversityBoost, isNewGenre, decorationGenreBoost, decorationRarityBoost };
  });

  const newGenreBooks = booksWithDiversityBoost.filter(b => b.isNewGenre);
  const hasNewGenreOption = newGenreBooks.length > 0;

  const shouldPreferFamiliar = determineFamiliarPreference(
    consecutiveCorrect,
    currentLevel,
    targetFamiliarRatio
  );

  const booksWithFamiliarity = booksWithDiversityBoost.map(({ book, diversityBoost, isNewGenre, decorationGenreBoost, decorationRarityBoost }) => {
    const familiarity = calculateBookFamiliarity(book.id, collectionEntries);
    const familiarityLevel = getFamiliarityLevel(familiarity.familiarityScore);
    
    let score = diversityBoost + decorationGenreBoost + decorationRarityBoost;
    
    if (shouldPreferFamiliar) {
      score += familiarity.familiarityScore * 0.5;
    } else {
      score += (1 - familiarity.familiarityScore) * 0.5;
    }

    score += Math.random() * 0.2;

    return {
      book,
      familiarity,
      familiarityLevel,
      score,
      isNewGenre,
    };
  });

  let finalCandidates = booksWithFamiliarity;
  
  const hasDecorationPreference = Object.keys(genreWeights || {}).length > 0 || Object.keys(rarityWeights || {}).length > 0 || (rareBookBonusPercent && rareBookBonusPercent > 0);
  
  if (!hasDecorationPreference && hasNewGenreOption && recentGenresSet.size >= 2) {
    const diversityCandidates = booksWithFamiliarity.filter(b => b.isNewGenre);
    if (diversityCandidates.length >= 3) {
      finalCandidates = diversityCandidates;
    }
  }

  const sorted = finalCandidates.sort((a, b) => b.score - a.score);
  
  const topCount = Math.min(5, sorted.length);
  const topCandidates = sorted.slice(0, topCount);
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  let reason = '';
  if (hasDecorationPreference) {
    reason = '根据书店装修偏好选择书籍';
  } else if (selected.isNewGenre) {
    reason = '选择了新类型书籍，保持多样性';
  } else if (shouldPreferFamiliar) {
    reason = '选择了熟悉的书籍，巩固节奏';
  } else {
    reason = '选择了新书籍，增加挑战';
  }

  return {
    book: selected.book,
    selectionReason: reason,
    familiarityLevel: selected.familiarityLevel,
    isNewGenre: selected.isNewGenre,
  };
};

const determineFamiliarPreference = (
  consecutiveCorrect: number,
  currentLevel: number,
  targetRatio: number
): boolean => {
  if (currentLevel <= 2) {
    return Math.random() < 0.6;
  }

  if (consecutiveCorrect >= 3) {
    return Math.random() < 0.2;
  }

  if (consecutiveCorrect === 0 && currentLevel > 3) {
    return Math.random() < 0.7;
  }

  return Math.random() < targetRatio;
};

export const getRecentBookGenresFromHistory = (
  roundDetails: { targetBookGenre: string }[]
): string[] => {
  return roundDetails.map(r => r.targetBookGenre);
};

export const selectSmartBookByTheme = (
  themeBookIds: string[],
  options: Omit<SmartBookSelectionOptions, 'difficultyLevel'> & { difficultyLevel?: DifficultyLevel }
): SmartBookSelectionResult | null => {
  const {
    excludeIds = [],
    recentBookGenres = [],
    recentBookIds = [],
    collectionEntries = {},
    consecutiveCorrect = 0,
    currentLevel = 1,
    targetFamiliarRatio = 0.4,
    genreDiversityWindow = 3,
  } = options;

  if (themeBookIds.length === 0) return null;

  let availableBooks = BOOKS.filter(b => 
    themeBookIds.includes(b.id) && 
    !excludeIds.includes(b.id) &&
    !recentBookIds.includes(b.id)
  );

  if (availableBooks.length === 0) {
    availableBooks = BOOKS.filter(b => 
      themeBookIds.includes(b.id) && 
      !excludeIds.includes(b.id)
    );
  }

  if (availableBooks.length === 0) {
    availableBooks = BOOKS.filter(b => themeBookIds.includes(b.id));
  }

  if (availableBooks.length === 0) return null;

  const recentGenresSet = new Set(
    recentBookGenres.slice(-genreDiversityWindow)
  );

  const booksWithDiversityBoost = availableBooks.map(book => {
    const isNewGenre = !recentGenresSet.has(book.genre);
    const diversityBoost = isNewGenre ? 0.3 : 0;
    return { book, diversityBoost, isNewGenre };
  });

  const newGenreBooks = booksWithDiversityBoost.filter(b => b.isNewGenre);
  const hasNewGenreOption = newGenreBooks.length > 0;

  const shouldPreferFamiliar = determineFamiliarPreference(
    consecutiveCorrect,
    currentLevel,
    targetFamiliarRatio
  );

  const booksWithFamiliarity = booksWithDiversityBoost.map(({ book, diversityBoost, isNewGenre }) => {
    const familiarity = calculateBookFamiliarity(book.id, collectionEntries);
    const familiarityLevel = getFamiliarityLevel(familiarity.familiarityScore);
    
    let score = diversityBoost;
    
    if (shouldPreferFamiliar) {
      score += familiarity.familiarityScore * 0.5;
    } else {
      score += (1 - familiarity.familiarityScore) * 0.5;
    }

    score += Math.random() * 0.2;

    return {
      book,
      familiarity,
      familiarityLevel,
      score,
      isNewGenre,
    };
  });

  let finalCandidates = booksWithFamiliarity;
  
  if (hasNewGenreOption && recentGenresSet.size >= 2) {
    const diversityCandidates = booksWithFamiliarity.filter(b => b.isNewGenre);
    if (diversityCandidates.length >= 2) {
      finalCandidates = diversityCandidates;
    }
  }

  const sorted = finalCandidates.sort((a, b) => b.score - a.score);
  
  const topCount = Math.min(3, sorted.length);
  const topCandidates = sorted.slice(0, topCount);
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  let reason = '';
  if (selected.isNewGenre) {
    reason = '主题内选择了新类型书籍，保持多样性';
  } else if (shouldPreferFamiliar) {
    reason = '主题内选择了熟悉的书籍，巩固节奏';
  } else {
    reason = '主题内选择了新书籍，增加挑战';
  }

  return {
    book: selected.book,
    selectionReason: reason,
    familiarityLevel: selected.familiarityLevel,
    isNewGenre: selected.isNewGenre,
  };
};

export const generateSmartDailyChallenge = (
  date: Date = new Date(),
  collectionEntries: Record<string, CollectionEntry> = {},
  bookCount: number = 5
): DailyChallenge => {
  const dateKey = getDateKey(date);
  
  const selectedBooks: Book[] = [];
  const usedGenres: string[] = [];
  const usedIds: string[] = [];

  for (let i = 0; i < bookCount; i++) {
    const availableBooks = BOOKS.filter(b => !usedIds.includes(b.id));
    if (availableBooks.length === 0) break;

    const recentGenresSet = new Set(usedGenres.slice(-3));

    const booksWithScores = availableBooks.map(book => {
      const isNewGenre = !recentGenresSet.has(book.genre);
      const diversityBoost = isNewGenre ? 0.3 : 0;
      
      const familiarity = calculateBookFamiliarity(book.id, collectionEntries);
      const familiarityScore = familiarity.familiarityScore;

      let familiarityWeight = 0;
      if (i === 0) {
        familiarityWeight = familiarityScore * 0.4;
      } else if (i >= bookCount - 2) {
        familiarityWeight = (1 - familiarityScore) * 0.4;
      } else {
        const midRatio = (i - 1) / Math.max(1, bookCount - 3);
        familiarityWeight = (1 - midRatio) * familiarityScore * 0.4 + midRatio * (1 - familiarityScore) * 0.4;
      }

      const score = diversityBoost + familiarityWeight + Math.random() * 0.15;

      return { book, score, isNewGenre };
    });

    const sorted = booksWithScores.sort((a, b) => b.score - a.score);
    const topCandidates = sorted.slice(0, Math.min(5, sorted.length));
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    selectedBooks.push(selected.book);
    usedIds.push(selected.book.id);
    usedGenres.push(selected.book.genre);
  }

  const dailyBooks: DailyChallengeBook[] = selectedBooks.map((book, index) => ({
    bookId: book.id,
    order: index + 1,
  }));

  return {
    date: dateKey,
    books: dailyBooks,
    totalBooks: bookCount,
  };
};
