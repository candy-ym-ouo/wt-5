import type { TrainingProgress, WrongBookEntry, WrongReason, ClueType } from '../types/training';

export const TRAINING_PROGRESS_KEY = 'old_bookstore_training_progress';

const DEFAULT_TRAINING_PROGRESS: TrainingProgress = {
  completedLessons: [],
  passedQuizzes: [],
  practiceModules: {},
  wrongBooks: [],
  currentRecommendedDifficulty: 'easy',
  totalPracticeTime: 0,
  totalCorrectAnswers: 0,
  totalWrongAnswers: 0,
  skillLevels: {
    year: 0,
    author: 0,
    genre: 0,
    title: 0,
    shelf: 0,
    description: 0,
    background: 0,
  },
};

function _readJSON<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function _writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export function getTrainingProgress(): TrainingProgress {
  const data = _readJSON<TrainingProgress>(TRAINING_PROGRESS_KEY, null as unknown as TrainingProgress);
  if (!data) {
    return { ...DEFAULT_TRAINING_PROGRESS };
  }
  return {
    ...DEFAULT_TRAINING_PROGRESS,
    ...data,
    skillLevels: {
      ...DEFAULT_TRAINING_PROGRESS.skillLevels,
      ...(data.skillLevels || {}),
    },
  };
}

export function saveTrainingProgress(progress: TrainingProgress): void {
  _writeJSON(TRAINING_PROGRESS_KEY, progress);
}

export function markLessonCompleted(lessonId: string): TrainingProgress {
  const progress = getTrainingProgress();
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    saveTrainingProgress(progress);
  }
  return progress;
}

export function markQuizPassed(quizId: string): TrainingProgress {
  const progress = getTrainingProgress();
  if (!progress.passedQuizzes.includes(quizId)) {
    progress.passedQuizzes.push(quizId);
    saveTrainingProgress(progress);
  }
  return progress;
}

export function updatePracticeModuleScore(moduleId: string, score: number): TrainingProgress {
  const progress = getTrainingProgress();
  if (!progress.practiceModules[moduleId]) {
    progress.practiceModules[moduleId] = {
      bestScore: 0,
      completedCount: 0,
    };
  }
  const moduleProgress = progress.practiceModules[moduleId];
  moduleProgress.bestScore = Math.max(moduleProgress.bestScore, score);
  moduleProgress.completedCount += 1;
  moduleProgress.lastPlayedAt = Date.now();
  saveTrainingProgress(progress);
  return progress;
}

export function addWrongBook(
  bookId: string,
  bookInfo: {
    title: string;
    author: string;
    genre: string;
    rarity: string;
  },
  reason: WrongReason
): TrainingProgress {
  const progress = getTrainingProgress();
  const existing = progress.wrongBooks.find(w => w.bookId === bookId);

  if (existing) {
    existing.wrongCount += 1;
    existing.lastWrongTime = Date.now();
    if (!existing.wrongReasons.includes(reason)) {
      existing.wrongReasons.push(reason);
    }
    existing.correctStreak = 0;
    existing.mastered = false;
  } else {
    progress.wrongBooks.push({
      bookId,
      bookTitle: bookInfo.title,
      bookAuthor: bookInfo.author,
      bookGenre: bookInfo.genre,
      bookRarity: bookInfo.rarity,
      wrongCount: 1,
      lastWrongTime: Date.now(),
      wrongReasons: [reason],
      mastered: false,
      reviewCount: 0,
      correctStreak: 0,
    });
  }

  progress.totalWrongAnswers += 1;
  saveTrainingProgress(progress);
  return progress;
}

export function markWrongBookCorrect(bookId: string): TrainingProgress {
  const progress = getTrainingProgress();
  const existing = progress.wrongBooks.find(w => w.bookId === bookId);

  if (existing) {
    existing.correctStreak += 1;
    existing.reviewCount += 1;
    if (existing.correctStreak >= 3) {
      existing.mastered = true;
    }
    progress.totalCorrectAnswers += 1;
    saveTrainingProgress(progress);
  }

  return progress;
}

export function getWrongBooks(onlyUnmastered: boolean = false): WrongBookEntry[] {
  const progress = getTrainingProgress();
  let books = [...progress.wrongBooks];
  
  if (onlyUnmastered) {
    books = books.filter(w => !w.mastered);
  }
  
  return books.sort((a, b) => b.wrongCount - a.wrongCount);
}

export function updateSkillLevel(clueType: ClueType, xp: number): TrainingProgress {
  const progress = getTrainingProgress();
  const currentXp = progress.skillLevels[clueType] || 0;
  progress.skillLevels[clueType] = currentXp + xp;
  saveTrainingProgress(progress);
  return progress;
}

export function getSkillLevel(clueType: ClueType): number {
  const progress = getTrainingProgress();
  return progress.skillLevels[clueType] || 0;
}

export function calculateSkillLevelFromXp(xp: number): { level: number; xpToNext: number; xpInLevel: number } {
  const xpPerLevel = 100;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const xpInLevel = xp % xpPerLevel;
  const xpToNext = xpPerLevel - xpInLevel;
  return { level, xpToNext, xpInLevel };
}

export function updateRecommendedDifficulty(level: string): TrainingProgress {
  const progress = getTrainingProgress();
  progress.currentRecommendedDifficulty = level as any;
  saveTrainingProgress(progress);
  return progress;
}

export function addPracticeTime(seconds: number): TrainingProgress {
  const progress = getTrainingProgress();
  progress.totalPracticeTime += seconds;
  saveTrainingProgress(progress);
  return progress;
}

export function incrementCorrectAnswers(count: number = 1): TrainingProgress {
  const progress = getTrainingProgress();
  progress.totalCorrectAnswers += count;
  saveTrainingProgress(progress);
  return progress;
}

export function resetTrainingProgress(): void {
  _writeJSON(TRAINING_PROGRESS_KEY, { ...DEFAULT_TRAINING_PROGRESS });
}
