import { createSignal, createMemo } from 'solid-js';
import type { TrainingTab, RuleLesson, PracticeModule, DifficultyRecommendation, WrongBookEntry, ClueType } from '../types/training';
import { RULE_LESSONS, PRACTICE_MODULES } from '../data/training';
import { getTrainingProgress, markLessonCompleted, markQuizPassed, updatePracticeModuleScore, addWrongBook, markWrongBookCorrect, updateSkillLevel, addPracticeTime, incrementCorrectAnswers, getWrongBooks, calculateSkillLevelFromXp } from '../utils/trainingStorage';
import { BOOKS } from '../data/books';
import type { Book } from '../types/game';
import { DIFFICULTY_LEVELS } from '../data/difficulty';
import type { DifficultyLevel } from '../types/game';

const [trainingCenterVisible, setTrainingCenterVisible] = createSignal(false);
const [activeTab, setActiveTab] = createSignal<TrainingTab>('rules');
const [selectedLessonId, setSelectedLessonId] = createSignal<string | null>(null);
const [selectedModuleId, setSelectedModuleId] = createSignal<string | null>(null);
const [practiceActive, setPracticeActive] = createSignal(false);
const [quizActive, setQuizActive] = createSignal(false);
const [wrongBookFilter, setWrongBookFilter] = createSignal<'all' | 'unmastered' | 'mastered'>('all');

export const openTrainingCenter = (tab?: TrainingTab) => {
  if (tab) setActiveTab(tab);
  setTrainingCenterVisible(true);
};

export const closeTrainingCenter = () => {
  setTrainingCenterVisible(false);
  setSelectedLessonId(null);
  setSelectedModuleId(null);
  setPracticeActive(false);
  setQuizActive(false);
};

export const getTrainingCenterState = createMemo(() => ({
  isVisible: trainingCenterVisible(),
  activeTab: activeTab(),
  selectedLessonId: selectedLessonId(),
  selectedModuleId: selectedModuleId(),
  practiceActive: practiceActive(),
  quizActive: quizActive(),
  wrongBookFilter: wrongBookFilter(),
}));

export const setTrainingTab = (tab: TrainingTab) => {
  setActiveTab(tab);
};

export const selectLesson = (lessonId: string | null) => {
  setSelectedLessonId(lessonId);
  setQuizActive(false);
};

export const selectPracticeModule = (moduleId: string | null) => {
  setSelectedModuleId(moduleId);
  setPracticeActive(false);
};

export const startPractice = () => {
  setPracticeActive(true);
};

export const endPractice = () => {
  setPracticeActive(false);
};

export const startQuiz = () => {
  setQuizActive(true);
};

export const endQuiz = () => {
  setQuizActive(false);
};

export const setWrongBookFilterType = (filter: 'all' | 'unmastered' | 'mastered') => {
  setWrongBookFilter(filter);
};

export const getLessons = createMemo((): RuleLesson[] => {
  const progress = getTrainingProgress();
  const completedSet = new Set(progress.completedLessons);
  
  return RULE_LESSONS.map((lesson, index) => {
    const unlocked = index === 0 || progress.completedLessons.includes(RULE_LESSONS[index - 1].id);
    return {
      ...lesson,
      unlocked,
      completed: completedSet.has(lesson.id),
    };
  });
});

export const getSelectedLesson = createMemo((): RuleLesson | null => {
  const lessonId = selectedLessonId();
  if (!lessonId) return null;
  return getLessons().find(l => l.id === lessonId) || null;
});

export const getPracticeModules = createMemo((): PracticeModule[] => {
  const progress = getTrainingProgress();
  
  return PRACTICE_MODULES.map((module, index) => {
    const moduleProgress = progress.practiceModules[module.id];
    const unlocked = index < 3 || progress.totalCorrectAnswers > (index - 2) * 5;
    
    return {
      ...module,
      unlocked,
      bestScore: moduleProgress?.bestScore || 0,
      completedCount: moduleProgress?.completedCount || 0,
    };
  });
});

export const getSelectedModule = createMemo((): PracticeModule | null => {
  const moduleId = selectedModuleId();
  if (!moduleId) return null;
  return getPracticeModules().find(m => m.id === moduleId) || null;
});

export const getWrongBookList = createMemo((): WrongBookEntry[] => {
  const filter = wrongBookFilter();
  const allWrongBooks = getWrongBooks();
  
  if (filter === 'unmastered') {
    return allWrongBooks.filter(w => !w.mastered);
  } else if (filter === 'mastered') {
    return allWrongBooks.filter(w => w.mastered);
  }
  return allWrongBooks;
});

export const getTrainingStats = createMemo(() => {
  const progress = getTrainingProgress();
  const totalLessons = RULE_LESSONS.length;
  const completedLessons = progress.completedLessons.length;
  const totalModules = PRACTICE_MODULES.length;
  const completedModules = Object.values(progress.practiceModules).filter(m => m.completedCount > 0).length;
  const totalWrongBooks = progress.wrongBooks.length;
  const masteredBooks = progress.wrongBooks.filter(w => w.mastered).length;
  const totalAnswers = progress.totalCorrectAnswers + progress.totalWrongAnswers;
  const accuracy = totalAnswers > 0 ? (progress.totalCorrectAnswers / totalAnswers) * 100 : 0;

  return {
    completedLessons,
    totalLessons,
    lessonProgress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
    completedModules,
    totalModules,
    moduleProgress: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
    totalWrongBooks,
    masteredBooks,
    masteryRate: totalWrongBooks > 0 ? (masteredBooks / totalWrongBooks) * 100 : 0,
    totalPracticeTime: progress.totalPracticeTime,
    totalCorrectAnswers: progress.totalCorrectAnswers,
    totalWrongAnswers: progress.totalWrongAnswers,
    accuracy,
  };
});

export const getSkillLevels = createMemo(() => {
  const progress = getTrainingProgress();
  const skillEntries = Object.entries(progress.skillLevels) as [ClueType, number][];
  
  return skillEntries.map(([type, xp]) => {
    const levelInfo = calculateSkillLevelFromXp(xp);
    return {
      type,
      xp,
      level: levelInfo.level,
      xpToNext: levelInfo.xpToNext,
      xpInLevel: levelInfo.xpInLevel,
    };
  });
});

export const completeLesson = (lessonId: string) => {
  markLessonCompleted(lessonId);
};

export const passQuiz = (quizId: string, score: number) => {
  markQuizPassed(quizId);
  updateSkillLevel('title', Math.floor(score / 10));
};

export const completePractice = (moduleId: string, score: number, correctCount: number, wrongBookIds: string[], timeUsed: number) => {
  updatePracticeModuleScore(moduleId, score);
  addPracticeTime(timeUsed);
  incrementCorrectAnswers(correctCount);
  
  const module = PRACTICE_MODULES.find(m => m.id === moduleId);
  if (module?.focusClueTypes) {
    module.focusClueTypes.forEach(clueType => {
      updateSkillLevel(clueType, correctCount * 5);
    });
  }
  
  if (wrongBookIds.length > 0) {
    wrongBookIds.forEach(bookId => {
      const book = BOOKS.find(b => b.id === bookId);
      if (book) {
        addWrongBook(bookId, {
          title: book.title,
          author: book.author,
          genre: book.genre,
          rarity: book.rarity,
        }, 'other');
      }
    });
  }
};

export const reviewCorrect = (bookId: string) => {
  markWrongBookCorrect(bookId);
  incrementCorrectAnswers(1);
};

export const generateDifficultyRecommendation = (): DifficultyRecommendation => {
  const progress = getTrainingProgress();
  const stats = getTrainingStats();
  
  let recommendedLevel: DifficultyLevel = 'easy';
  let confidence = 0.5;
  const reasons: string[] = [];

  const totalAnswers = progress.totalCorrectAnswers + progress.totalWrongAnswers;
  const accuracy = totalAnswers > 0 ? progress.totalCorrectAnswers / totalAnswers : 0;
  const completedLessons = progress.completedLessons.length;

  if (completedLessons >= 2 && accuracy >= 0.7 && stats.totalCorrectAnswers >= 20) {
    recommendedLevel = 'normal';
    confidence = 0.6;
    reasons.push('已完成基础课程，掌握了基本规则');
    reasons.push('练习准确率达到70%以上');
  }
  
  if (completedLessons >= 4 && accuracy >= 0.8 && stats.totalCorrectAnswers >= 50) {
    recommendedLevel = 'hard';
    confidence = 0.7;
    reasons.push('已完成中级课程，熟悉各种线索');
    reasons.push('练习准确率达到80%以上');
    reasons.push('累计正确答题超过50道');
  }
  
  if (completedLessons >= 6 && accuracy >= 0.85 && stats.totalCorrectAnswers >= 100 && stats.masteryRate >= 0.5) {
    recommendedLevel = 'expert';
    confidence = 0.75;
    reasons.push('已完成高级课程，掌握高级技巧');
    reasons.push('练习准确率达到85%以上');
    reasons.push('累计正确答题超过100道');
    reasons.push('错题掌握率超过50%');
  }

  if (reasons.length === 0) {
    reasons.push('建议从入门难度开始，循序渐进');
    reasons.push('完成基础课程后可挑战更高难度');
  }

  const currentLevelStats = {
    level: recommendedLevel,
    gamesPlayed: totalAnswers,
    avgScore: 0,
    avgFindTime: 0,
    avgHintsUsed: 0,
    accuracy: accuracy * 100,
    winRate: accuracy * 100,
  };

  const currentIndex = DIFFICULTY_LEVELS.indexOf(recommendedLevel);
  const nextLevel = currentIndex < DIFFICULTY_LEVELS.length - 1 
    ? DIFFICULTY_LEVELS[currentIndex + 1] 
    : null;

  const nextLevelGoal = nextLevel ? {
    targetLevel: nextLevel,
    requirements: [
      {
        type: 'accuracy' as const,
        current: accuracy * 100,
        target: 75,
        unit: '%',
        description: '准确率达到75%',
      },
      {
        type: 'gamesPlayed' as const,
        current: totalAnswers,
        target: currentIndex === 0 ? 20 : 50,
        unit: '题',
        description: `累计练习${currentIndex === 0 ? 20 : 50}道题`,
      },
      {
        type: 'avgHints' as const,
        current: 0,
        target: 3,
        unit: '次',
        description: '平均提示使用控制在3次以内',
      },
    ],
  } : {
    targetLevel: recommendedLevel,
    requirements: [],
  };

  return {
    recommendedLevel,
    confidence,
    reasons,
    currentLevelStats,
    nextLevelGoal,
  };
};

export function getRandomWrongBook(): Book | null {
  const wrongBooks = getWrongBooks(true);
  if (wrongBooks.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * wrongBooks.length);
  const wrongBook = wrongBooks[randomIndex];
  
  return BOOKS.find(b => b.id === wrongBook.bookId) || null;
}
