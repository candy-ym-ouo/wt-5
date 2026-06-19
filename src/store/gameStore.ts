import { createSignal } from 'solid-js';
import type { GameStore, Book, Clue } from '../types/game';
import { BOOKS } from '../data/books';
import { createCluesForBook, CLUE_TEMPLATES } from '../data/clues';
import { ACHIEVEMENTS } from '../data/achievements';
import { getUnlockedAchievements, saveUnlockedAchievements, incrementGamesPlayed, getGamesPlayed } from '../utils/storage';

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
};

export const [gameState, setGameState] = createSignal<GameStore>(initialStore);
export const [currentClues, setCurrentClues] = createSignal<Clue[]>([]);
export const [targetBook, setTargetBook] = createSignal<Book | null>(null);
export const [showAchievementPopup, setShowAchievementPopup] = createSignal<string | null>(null);
export const [lastFindTime, setLastFindTime] = createSignal(0);
export const [roundStartTime, setRoundStartTime] = createSignal(0);
export const [foundGenres, setFoundGenres] = createSignal<string[]>([]);
export const [gamesPlayed, setGamesPlayed] = createSignal(getGamesPlayed());

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

export const startGame = () => {
  const book = selectRandomTarget();
  const clues = createCluesForBook(book.id);
  
  const firstClueContent = CLUE_TEMPLATES.year(book.year);
  clues[0].content = firstClueContent;
  
  setTargetBook(book);
  setCurrentClues(clues);
  setRoundStartTime(Date.now());
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
    unlockedClues: [clues[0].id],
    foundBooks: [],
    consecutiveCorrect: 0,
  }));

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    setGameState(prev => {
      if (prev.state !== 'playing') return prev;
      const newTime = prev.timeRemaining - 1;
      if (newTime <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        setTimeout(checkAchievements, 0);
        return { ...prev, timeRemaining: 0, state: 'lost' };
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, 1000);
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

    setGameState(prev => ({
      ...prev,
      score: prev.score + score,
      foundBooks: [...prev.foundBooks, bookId],
      consecutiveCorrect: prev.consecutiveCorrect + 1,
      state: 'won',
    }));

    if (timerInterval) clearInterval(timerInterval);
    checkAchievements();
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
  const book = selectRandomTarget();
  const clues = createCluesForBook(book.id);
  
  const firstClueContent = CLUE_TEMPLATES.year(book.year);
  clues[0].content = firstClueContent;
  
  setTargetBook(book);
  setCurrentClues(clues);
  setRoundStartTime(Date.now());

  setGameState(prev => ({
    ...prev,
    state: 'playing',
    currentLevel: prev.currentLevel + 1,
    targetBookId: book.id,
    unlockedClues: [clues[0].id],
    hintsRemaining: Math.min(prev.hintsRemaining + 1, INITIAL_HINTS),
  }));

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    setGameState(prev => {
      if (prev.state !== 'playing') return prev;
      const newTime = prev.timeRemaining - 1;
      if (newTime <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        setTimeout(checkAchievements, 0);
        return { ...prev, timeRemaining: 0, state: 'lost' };
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, 1000);
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
};
