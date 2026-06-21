import { BOOKS } from './books';
import type { Book, DailyChallenge, DailyChallengeBook } from '../types/game';
import { getUnlockedWorkshopRewardIds } from '../utils/workshopStorage';

const DAILY_CHALLENGE_BOOK_COUNT = 5;

const getAvailableBooks = (): Book[] => {
  const unlockedRewardIds = getUnlockedWorkshopRewardIds();
  return BOOKS.filter(b => !b.workshopReward || unlockedRewardIds.has(b.id));
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    const char = dateKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getTodayDateKey(): string {
  return getDateKey(new Date());
}

export function generateDailyChallenge(date?: Date): DailyChallenge {
  const targetDate = date || new Date();
  const dateKey = getDateKey(targetDate);
  const seed = getDateSeed(dateKey);
  const random = seededRandom(seed);

  const shuffledBooks = [...getAvailableBooks()].sort(() => random() - 0.5);
  const selectedBooks = shuffledBooks.slice(0, DAILY_CHALLENGE_BOOK_COUNT);

  const dailyBooks: DailyChallengeBook[] = selectedBooks.map((book, index) => ({
    bookId: book.id,
    order: index + 1,
  }));

  return {
    date: dateKey,
    books: dailyBooks,
    totalBooks: DAILY_CHALLENGE_BOOK_COUNT,
  };
}

export function getDailyChallengeBook(bookId: string): Book | undefined {
  return BOOKS.find(b => b.id === bookId);
}

export function getDailyChallengeBooks(challenge: DailyChallenge): Book[] {
  return challenge.books
    .sort((a, b) => a.order - b.order)
    .map(db => getDailyChallengeBook(db.bookId))
    .filter((b): b is Book => b !== undefined);
}

export function isTodayChallenge(dateKey: string): boolean {
  return dateKey === getTodayDateKey();
}
