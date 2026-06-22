import type { Book } from '../types/game';
import type { Booklist, BooklistFilter, BooklistChallenge, EraRange } from '../types/booklist';
import { PRESET_BOOKLISTS, DEFAULT_FILTER, ERA_RANGES } from '../types/booklist';
import { BOOKS } from './books';

export const getAllGenres = (): string[] => {
  const genres = new Set(BOOKS.map(b => b.genre));
  return Array.from(genres).sort();
};

export const getAllAuthors = (): string[] => {
  const authors = new Set(BOOKS.map(b => b.author));
  return Array.from(authors).sort();
};

export const getAllThemes = (): string[] => {
  const themes = new Set<string>();
  BOOKS.forEach(b => b.themes.forEach(t => themes.add(t)));
  return Array.from(themes).sort();
};

export const getAllKeywords = (): string[] => {
  const keywords = new Set<string>();
  BOOKS.forEach(book => {
    const words = book.description.split(/[，。、；：！？\s]+/).filter(w => w.length >= 2);
    words.forEach(w => keywords.add(w));
  });
  return Array.from(keywords).sort();
};

const matchesYearRange = (book: Book, yearRange: [number, number] | null): boolean => {
  if (!yearRange) return true;
  return book.year >= yearRange[0] && book.year <= yearRange[1];
};

const matchesEra = (book: Book, era: EraRange | null): boolean => {
  if (!era) return true;
  if (era === 'custom') return true;
  const range = ERA_RANGES[era];
  return book.year >= range[0] && book.year <= range[1];
};

const matchesKeywords = (book: Book, keywords: string[]): boolean => {
  if (keywords.length === 0) return true;
  const searchText = `${book.title} ${book.author} ${book.description} ${book.backgroundStory} ${book.descriptionClues.join(' ')}`.toLowerCase();
  return keywords.some(kw => searchText.includes(kw.toLowerCase()));
};

export const filterBooks = (filter: BooklistFilter): Book[] => {
  let filtered = [...BOOKS];

  if (filter.authors.length > 0) {
    filtered = filtered.filter(b => filter.authors.some(a => 
      b.author.toLowerCase().includes(a.toLowerCase())
    ));
  }

  if (filter.genres.length > 0) {
    filtered = filtered.filter(b => filter.genres.includes(b.genre));
  }

  if (filter.yearRange) {
    filtered = filtered.filter(b => matchesYearRange(b, filter.yearRange));
  }

  if (filter.era) {
    filtered = filtered.filter(b => matchesEra(b, filter.era));
  }

  if (filter.keywords.length > 0) {
    filtered = filtered.filter(b => matchesKeywords(b, filter.keywords));
  }

  if (filter.rarities.length > 0) {
    filtered = filtered.filter(b => filter.rarities.includes(b.rarity));
  }

  if (filter.themes.length > 0) {
    filtered = filtered.filter(b => filter.themes.some(t => b.themes.includes(t)));
  }

  return filtered;
};

export const generateBooklist = (
  name: string,
  description: string,
  filter: BooklistFilter,
  options: {
    icon?: string;
    color?: string;
    difficulty?: Booklist['difficulty'];
    targetBooks?: number;
  } = {}
): Booklist => {
  const filteredBooks = filterBooks(filter);
  
  const shuffled = [...filteredBooks].sort(() => Math.random() - 0.5);
  const count = Math.min(
    Math.max(shuffled.length, filter.minBooks),
    filter.maxBooks
  );
  const selectedBooks = shuffled.slice(0, Math.min(count, shuffled.length));

  const now = Date.now();
  const booklist: Booklist = {
    id: `custom_${now}`,
    name,
    description,
    icon: options.icon || '📚',
    color: options.color || '#B8860B',
    bookIds: selectedBooks.map(b => b.id),
    filter,
    createdAt: now,
    updatedAt: now,
    isCustom: true,
    difficulty: options.difficulty || 'normal',
    targetBooks: options.targetBooks || Math.max(3, Math.floor(selectedBooks.length * 0.6)),
    rewardCoins: selectedBooks.length * 100,
    rewardReputation: selectedBooks.length * 10,
  };

  return booklist;
};

export const getBooklistById = (id: string, customLists: Booklist[] = []): Booklist | undefined => {
  const custom = customLists.find(b => b.id === id);
  if (custom) return custom;
  
  const preset = PRESET_BOOKLISTS.find(b => b.id === id);
  if (preset) {
    const now = Date.now();
    const filterWithBooks = filterBooks(preset.filter);
    return {
      ...preset,
      bookIds: filterWithBooks.map(b => b.id),
      createdAt: now,
      updatedAt: now,
      isCustom: false,
    };
  }
  
  return undefined;
};

export const getBooksForBooklist = (booklist: Booklist): Book[] => {
  return BOOKS.filter(b => booklist.bookIds.includes(b.id));
};

export const regenerateBooklistBooks = (booklist: Booklist): Booklist => {
  const filteredBooks = filterBooks(booklist.filter);
  const shuffled = [...filteredBooks].sort(() => Math.random() - 0.5);
  const count = Math.min(
    Math.max(shuffled.length, booklist.filter.minBooks),
    booklist.filter.maxBooks
  );
  const selectedBooks = shuffled.slice(0, Math.min(count, shuffled.length));

  return {
    ...booklist,
    bookIds: selectedBooks.map(b => b.id),
    updatedAt: Date.now(),
  };
};

export const getPresetBooklists = (): Booklist[] => {
  const now = Date.now();
  return PRESET_BOOKLISTS.map(preset => {
    const filteredBooks = filterBooks(preset.filter);
    return {
      ...preset,
      bookIds: filteredBooks.map(b => b.id),
      createdAt: now,
      updatedAt: now,
      isCustom: false,
    };
  });
};

export const generateChallengesForBooklist = (booklistId: string): BooklistChallenge[] => {
  return [
    {
      id: `blc_${booklistId}_speed`,
      booklistId,
      title: '极速挑战',
      description: '在60秒内完成书单挑战',
      icon: '⚡',
      type: 'speed',
      target: 60,
      rewardCoins: 200,
      rewardReputation: 20,
      completed: false,
    },
    {
      id: `blc_${booklistId}_accuracy`,
      booklistId,
      title: '精准无误',
      description: '完成书单挑战且零失误',
      icon: '🎯',
      type: 'accuracy',
      target: 0,
      rewardCoins: 300,
      rewardReputation: 30,
      completed: false,
    },
    {
      id: `blc_${booklistId}_no_hint`,
      booklistId,
      title: '独立自主',
      description: '不使用任何提示完成挑战',
      icon: '💡',
      type: 'no_hint',
      target: 0,
      rewardCoins: 350,
      rewardReputation: 35,
      completed: false,
    },
    {
      id: `blc_${booklistId}_score`,
      booklistId,
      title: '高分达人',
      description: '书单挑战得分超过2000分',
      icon: '🏆',
      type: 'score',
      target: 2000,
      rewardCoins: 400,
      rewardReputation: 40,
      completed: false,
    },
    {
      id: `blc_${booklistId}_streak`,
      booklistId,
      title: '连对高手',
      description: '连续找到5本书',
      icon: '🔥',
      type: 'streak',
      target: 5,
      rewardCoins: 250,
      rewardReputation: 25,
      completed: false,
    },
  ];
};

export const calculateBooklistDifficulty = (books: Book[]): Booklist['difficulty'] => {
  if (books.length <= 3) return 'easy';
  if (books.length <= 6) return 'normal';
  if (books.length <= 10) return 'hard';
  if (books.length <= 15) return 'expert';
  return 'master';
};

export const generateDefaultFilter = (): BooklistFilter => {
  return { ...DEFAULT_FILTER };
};

export const getBookByIndex = (booklist: Booklist, index: number): Book | null => {
  if (index < 0 || index >= booklist.bookIds.length) return null;
  const bookId = booklist.bookIds[index];
  return BOOKS.find(b => b.id === bookId) || null;
};

export const getNextBook = (booklist: Booklist, currentIndex: number): Book | null => {
  return getBookByIndex(booklist, currentIndex + 1);
};
