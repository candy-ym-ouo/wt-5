import { createSignal } from 'solid-js';
import type { GameStore, Book, Clue, ChapterTask } from '../types/game';
import { BOOKS } from '../data/books';
import { createCluesForBook, CLUE_TEMPLATES } from '../data/clues';
import { ACHIEVEMENTS } from '../data/achievements';
import { getChapterById, getNextChapter } from '../data/chapters';
import {
  getUnlockedAchievements,
  saveUnlockedAchievements,
  incrementGamesPlayed,
  getGamesPlayed,
  getChapterProgress,
  saveChapterProgress,
  getCurrentChapterId,
  setCurrentChapterId,
} from '../utils/storage';

const GAME_TIME = 180;
const INITIAL_HINTS = 5;

const initialStore: GameStore = {
  state: 'idle',
  score: 0,
  timeRemaining: GAME_TIME,
  hintsRemaining: INITIAL_HINTS,
  hintsUsed: 0,
  currentLevel: 1,
  targetBookId: null,
  unlockedClues: [],
  unlockedAchievements: getUnlockedAchievements(),
  foundBooks: [],
  consecutiveCorrect: 0,
  currentChapterId: null,
  currentTaskIndex: 0,
  chapterScore: 0,
  chapterTimeUsed: 0,
  chapterHintsUsed: 0,
  gameMode: 'classic',
};

export const [gameState, setGameState] = createSignal<GameStore>(initialStore);
export const [currentClues, setCurrentClues] = createSignal<Clue[]>([]);
export const [targetBook, setTargetBook] = createSignal<Book | null>(null);
export const [showAchievementPopup, setShowAchievementPopup] = createSignal<string | null>(null);
export const [lastFindTime, setLastFindTime] = createSignal(0);
export const [roundStartTime, setRoundStartTime] = createSignal(0);
export const [foundGenres, setFoundGenres] = createSignal<string[]>([]);
export const [gamesPlayed, setGamesPlayed] = createSignal(getGamesPlayed());
export const [currentTask, setCurrentTask] = createSignal<ChapterTask | null>(null);
export const [chapterTasks, setChapterTasks] = createSignal<ChapterTask[]>([]);

let timerInterval: number | null = null;

const selectRandomTarget = (): Book => {
  const availableBooks = BOOKS.filter(b => !gameState().foundBooks.includes(b.id));
  if (availableBooks.length === 0) {
    return BOOKS[Math.floor(Math.random() * BOOKS.length)];
  }
  return availableBooks[Math.floor(Math.random() * availableBooks.length)];
};

const checkAchievements = () => {
  const state = gameState();
  const unlocked = [...state.unlockedAchievements];
  let newAchievement: string | null = null;

  if (state.foundBooks.length >= 1 && !unlocked.includes('first_book')) {
    unlocked.push('first_book');
    newAchievement = 'first_book';
  }

  if (state.foundBooks.length >= 5 && !unlocked.includes('bookworm')) {
    unlocked.push('bookworm');
    newAchievement = 'bookworm';
  }

  if (lastFindTime() <= 30 && lastFindTime() > 0 && !unlocked.includes('speed_reader')) {
    unlocked.push('speed_reader');
    newAchievement = 'speed_reader';
  }

  if (state.hintsUsed === 0 && state.foundBooks.length >= 1 && !unlocked.includes('no_hints')) {
    unlocked.push('no_hints');
    newAchievement = 'no_hints';
  }

  const allCluesUnlocked = currentClues().every(c => c.unlocked);
  if (allCluesUnlocked && state.foundBooks.length > 0 && !unlocked.includes('clue_collector')) {
    unlocked.push('clue_collector');
    newAchievement = 'clue_collector';
  }

  if (state.foundBooks.length >= 3 && !unlocked.includes('perfect_round')) {
    unlocked.push('perfect_round');
    newAchievement = 'perfect_round';
  }

  if (state.timeRemaining > 60 && state.state === 'won' && !unlocked.includes('time_master')) {
    unlocked.push('time_master');
    newAchievement = 'time_master';
  }

  if (foundGenres().includes('历史') && !unlocked.includes('history_buff')) {
    unlocked.push('history_buff');
    newAchievement = 'history_buff';
  }

  if (foundGenres().includes('科幻') && !unlocked.includes('sci_fi_fan')) {
    unlocked.push('sci_fi_fan');
    newAchievement = 'sci_fi_fan';
  }

  if (gamesPlayed() >= 5 && !unlocked.includes('veteran')) {
    unlocked.push('veteran');
    newAchievement = 'veteran';
  }

  if (state.gameMode === 'chapter' && !unlocked.includes('chapter_starter')) {
    unlocked.push('chapter_starter');
    newAchievement = 'chapter_starter';
  }

  if (unlocked.length !== state.unlockedAchievements.length) {
    setGameState(prev => ({ ...prev, unlockedAchievements: unlocked }));
    saveUnlockedAchievements(unlocked);
    if (newAchievement) {
      const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
      if (ach) {
        setShowAchievementPopup(ach.title);
        setTimeout(() => setShowAchievementPopup(null), 3000);
      }
    }
  }
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    setGameState(prev => {
      if (prev.state !== 'playing') return prev;
      const newTime = prev.timeRemaining - 1;
      if (newTime <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        setTimeout(() => {
          checkAchievements();
          if (gameState().gameMode === 'chapter') {
            saveChapterProgressState();
          }
        }, 0);
        return { ...prev, timeRemaining: 0, state: 'lost' };
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, 1000);
};

const setupRound = (book: Book) => {
  const clues = createCluesForBook(book.id);
  
  const firstClueContent = CLUE_TEMPLATES.year(book.year);
  clues[0].content = firstClueContent;
  
  setTargetBook(book);
  setCurrentClues(clues);
  setRoundStartTime(Date.now());
};

export const startGame = () => {
  const book = selectRandomTarget();
  setupRound(book);
  setFoundGenres([]);
  
  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: GAME_TIME,
    hintsRemaining: INITIAL_HINTS,
    hintsUsed: 0,
    currentLevel: 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: [],
    consecutiveCorrect: 0,
    gameMode: 'classic',
    currentChapterId: null,
    currentTaskIndex: 0,
    chapterScore: 0,
    chapterTimeUsed: 0,
    chapterHintsUsed: 0,
  }));

  startTimer();
};

export const startChapterGame = (chapterId: string) => {
  const chapter = getChapterById(chapterId);
  if (!chapter) return;

  const progress = getChapterProgress(chapterId);
  const startTaskIndex = progress?.currentTaskIndex || 0;
  const tasks = chapter.tasks.map((t) => ({
    ...t,
    completed: progress?.completedTasks.includes(t.id) || false,
  }));

  setChapterTasks(tasks);

  if (startTaskIndex >= tasks.length) {
    return;
  }

  const currentTaskData = tasks[startTaskIndex];
  const book = BOOKS.find(b => b.id === currentTaskData.bookId);
  if (!book) return;

  setCurrentTask(currentTaskData);
  setupRound(book);
  setFoundGenres([]);
  setCurrentChapterId(chapterId);

  const newGamesPlayed = incrementGamesPlayed();
  setGamesPlayed(newGamesPlayed);

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    score: 0,
    timeRemaining: GAME_TIME,
    hintsRemaining: INITIAL_HINTS,
    hintsUsed: 0,
    currentLevel: startTaskIndex + 1,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    foundBooks: progress?.completedTasks.map(tid => {
      const task = chapter.tasks.find(t => t.id === tid);
      return task?.bookId || '';
    }).filter(Boolean) || [],
    consecutiveCorrect: 0,
    gameMode: 'chapter',
    currentChapterId: chapterId,
    currentTaskIndex: startTaskIndex,
    chapterScore: progress?.totalScore || 0,
    chapterTimeUsed: progress?.totalTime || 0,
    chapterHintsUsed: progress?.totalHints || 0,
  }));

  startTimer();
};

export const useHint = () => {
  const state = gameState();
  if (state.hintsRemaining <= 0 || state.state !== 'playing') return;

  const clues = currentClues();
  const lockedClue = clues.find(c => !c.unlocked);
  
  if (!lockedClue) return;

  const book = targetBook();
  if (!book) return;

  let content = lockedClue.content;
  switch (lockedClue.type) {
    case 'year':
      content = CLUE_TEMPLATES.year(book.year);
      break;
    case 'author':
      content = CLUE_TEMPLATES.author(book.author);
      break;
    case 'genre':
      content = CLUE_TEMPLATES.genre(book.genre);
      break;
    case 'shelf':
      content = CLUE_TEMPLATES.shelf(book.shelf);
      break;
    case 'title':
      content = CLUE_TEMPLATES.title(book.title);
      break;
  }

  setCurrentClues(prev => prev.map(c => 
    c.id === lockedClue.id ? { ...c, unlocked: true, content } : c
  ));

  setGameState(prev => ({
    ...prev,
    hintsRemaining: prev.hintsRemaining - 1,
    hintsUsed: prev.hintsUsed + 1,
    unlockedClues: [...prev.unlockedClues, lockedClue.id],
  }));
};

const saveChapterProgressState = () => {
  const state = gameState();
  if (state.gameMode !== 'chapter' || !state.currentChapterId) return;

  const tasks = chapterTasks();
  const completedTasks = tasks.filter(t => t.completed).map(t => t.id);
  
  const progress = {
    chapterId: state.currentChapterId,
    currentTaskIndex: state.currentTaskIndex,
    completedTasks,
    totalScore: state.chapterScore,
    totalTime: state.chapterTimeUsed,
    totalHints: state.chapterHintsUsed,
  };

  saveChapterProgress(progress as any);
  setCurrentChapterId(state.currentChapterId);
};

const completeChapter = () => {
  const state = gameState();
  const chapter = getChapterById(state.currentChapterId!);
  if (!chapter) return;

  const finalScore = state.chapterScore + chapter.bonusScore;

  const progress = {
    chapterId: state.currentChapterId!,
    currentTaskIndex: state.currentTaskIndex,
    completedTasks: chapterTasks().filter(t => t.completed).map(t => t.id),
    totalScore: finalScore,
    totalTime: state.chapterTimeUsed,
    totalHints: state.chapterHintsUsed,
    completedAt: Date.now(),
  };
  saveChapterProgress(progress as any);

  const nextChapter = getNextChapter(state.currentChapterId!);
  if (nextChapter) {
    const nextProgress = getChapterProgress(nextChapter.id);
    if (!nextProgress) {
      saveChapterProgress({
        chapterId: nextChapter.id,
        currentTaskIndex: 0,
        completedTasks: [],
        totalScore: 0,
        totalTime: 0,
        totalHints: 0,
      } as any);
    }
  }

  const unlocked = [...state.unlockedAchievements];
  let newAchievement: string | null = null;

  if (!unlocked.includes('chapter_master')) {
    unlocked.push('chapter_master');
    newAchievement = 'chapter_master';
  }

  if (state.chapterHintsUsed === 0 && !unlocked.includes('perfect_chapter')) {
    unlocked.push('perfect_chapter');
    newAchievement = 'perfect_chapter';
  }

  const allChapters = [
    'chapter_literature',
    'chapter_classics', 
    'chapter_science',
    'chapter_philosophy',
    'chapter_tech'
  ];
  
  let allCompleted = true;
  for (const chId of allChapters) {
    const chProgress = getChapterProgress(chId);
    if (!chProgress?.completedAt) {
      allCompleted = false;
      break;
    }
  }
  
  if (allCompleted && !unlocked.includes('all_chapters')) {
    unlocked.push('all_chapters');
    newAchievement = 'all_chapters';
  }

  if (unlocked.length !== state.unlockedAchievements.length) {
    setGameState(prev => ({
      ...prev,
      state: 'chapter_complete',
      chapterScore: finalScore,
      unlockedAchievements: unlocked,
    }));
    saveUnlockedAchievements(unlocked);
    if (newAchievement) {
      const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
      if (ach) {
        setTimeout(() => {
          setShowAchievementPopup(ach.title);
          setTimeout(() => setShowAchievementPopup(null), 3000);
        }, 500);
      }
    }
  } else {
    setGameState(prev => ({
      ...prev,
      state: 'chapter_complete',
      chapterScore: finalScore,
    }));
  }
};

export const selectBook = (bookId: string): boolean => {
  const state = gameState();
  if (state.state !== 'playing') return false;

  const book = targetBook();
  if (!book) return false;

  if (bookId === book.id) {
    const findTime = (Date.now() - roundStartTime()) / 1000;
    setLastFindTime(findTime);
    
    const timeBonus = Math.floor(state.timeRemaining / 10);
    const hintPenalty = state.hintsUsed * 50;
    const baseScore = 1000;
    const score = Math.max(baseScore + timeBonus * 10 - hintPenalty, 100);

    const newFoundGenres = [...foundGenres(), book.genre];
    setFoundGenres(newFoundGenres);

    if (state.gameMode === 'chapter') {
      const task = currentTask();
      if (task) {
        setChapterTasks(prev => prev.map(t =>
          t.id === task.id
            ? { ...t, completed: true, scoreEarned: score, timeUsed: findTime, hintsUsed: state.hintsUsed }
            : t
        ));

        const nextTaskIndex = state.currentTaskIndex + 1;
        const tasks = chapterTasks();
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + score,
          foundBooks: [...prev.foundBooks, bookId],
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          chapterScore: prev.chapterScore + score,
          chapterTimeUsed: prev.chapterTimeUsed + findTime,
          chapterHintsUsed: prev.chapterHintsUsed + prev.hintsUsed,
          state: nextTaskIndex >= tasks.length ? 'chapter_complete' : 'won',
        }));

        if (timerInterval) clearInterval(timerInterval);
        checkAchievements();
        saveChapterProgressState();

        if (nextTaskIndex >= tasks.length) {
          setTimeout(completeChapter, 500);
        }
      }
    } else {
      setGameState(prev => ({
        ...prev,
        score: prev.score + score,
        foundBooks: [...prev.foundBooks, bookId],
        consecutiveCorrect: prev.consecutiveCorrect + 1,
        state: 'won',
      }));

      if (timerInterval) clearInterval(timerInterval);
      checkAchievements();
    }
    return true;
  } else {
    setGameState(prev => ({
      ...prev,
      consecutiveCorrect: 0,
      timeRemaining: Math.max(prev.timeRemaining - 5, 0),
    }));
    return false;
  }
};

export const nextRound = () => {
  const state = gameState();
  
  if (state.gameMode === 'chapter') {
    const nextTaskIndex = state.currentTaskIndex + 1;
    const tasks = chapterTasks();
    
    if (nextTaskIndex >= tasks.length) {
      return;
    }

    const nextTask = tasks[nextTaskIndex];
    const book = BOOKS.find(b => b.id === nextTask.bookId);
    if (!book) return;

    setCurrentTask(nextTask);
    setupRound(book);

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      currentLevel: nextTaskIndex + 1,
      currentTaskIndex: nextTaskIndex,
      targetBookId: book.id,
      unlockedClues: [currentClues()[0]?.id || ''],
      hintsRemaining: Math.min(prev.hintsRemaining + 1, INITIAL_HINTS),
      hintsUsed: 0,
    }));

    startTimer();
    saveChapterProgressState();
  } else {
    const book = selectRandomTarget();
    setupRound(book);

    setGameState(prev => ({
      ...prev,
      state: 'playing',
      currentLevel: prev.currentLevel + 1,
      targetBookId: book.id,
      unlockedClues: [currentClues()[0]?.id || ''],
      hintsRemaining: Math.min(prev.hintsRemaining + 1, INITIAL_HINTS),
    }));

    startTimer();
  }
};

export const pauseGame = () => {
  setGameState(prev => ({ ...prev, state: 'paused' }));
};

export const resumeGame = () => {
  setGameState(prev => ({ ...prev, state: 'playing' }));
};

export const resetGame = () => {
  if (timerInterval) clearInterval(timerInterval);
  setGameState(initialStore);
  setCurrentClues([]);
  setTargetBook(null);
  setFoundGenres([]);
  setCurrentTask(null);
  setChapterTasks([]);
  setCurrentChapterId(null);
};

export const restartCurrentTask = () => {
  const state = gameState();
  if (state.gameMode !== 'chapter') return;
  if (!state.currentChapterId) return;

  const task = currentTask();
  if (!task) return;

  const book = BOOKS.find(b => b.id === task.bookId);
  if (!book) return;

  setupRound(book);
  setFoundGenres([]);

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    timeRemaining: GAME_TIME,
    hintsRemaining: INITIAL_HINTS,
    hintsUsed: 0,
    targetBookId: book.id,
    unlockedClues: [currentClues()[0]?.id || ''],
    consecutiveCorrect: 0,
  }));

  startTimer();
  saveChapterProgressState();
};

export const restartChapter = () => {
  const state = gameState();
  if (state.gameMode !== 'chapter') return;
  if (!state.currentChapterId) return;

  const chapterId = state.currentChapterId;
  resetGame();
  
  setTimeout(() => {
    startChapterGame(chapterId);
  }, 50);
};

export const getCurrentChapter = () => {
  const state = gameState();
  if (!state.currentChapterId) return null;
  return getChapterById(state.currentChapterId);
};

export const hasSavedProgress = (): boolean => {
  const currentChapterId = getCurrentChapterId();
  if (!currentChapterId) return false;
  
  const progress = getChapterProgress(currentChapterId);
  return progress !== null && !progress.completedAt && progress.currentTaskIndex > 0;
};

export const continueSavedGame = () => {
  const chapterId = getCurrentChapterId();
  if (!chapterId) return false;
  
  const progress = getChapterProgress(chapterId);
  if (!progress || progress.completedAt) return false;
  
  startChapterGame(chapterId);
  return true;
};
