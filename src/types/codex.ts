export type CodexTab = 'books' | 'authors' | 'discoveries' | 'themes' | 'easterEggs';

export interface Author {
  id: string;
  name: string;
  avatar: string;
  birthYear: number;
  deathYear?: number;
  nationality: string;
  era: string;
  biography: string;
  writingStyle: string;
  famousQuotes: string[];
  bookIds: string[];
  trivia: string[];
  portraitColor: string;
}

export interface DiscoveryRecord {
  id: string;
  bookId: string;
  type: 'first_find' | 'speed_record' | 'perfect_find' | 'achievement_unlock' | 'theme_complete' | 'special_event';
  timestamp: number;
  details: {
    score?: number;
    timeUsed?: number;
    hintsUsed?: number;
    achievementId?: string;
    themeId?: string;
    eventId?: string;
    difficulty?: string;
    consecutiveCorrect?: number;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  narrative: string;
}

export interface ThemeCollection {
  id: string;
  name: string;
  icon: string;
  description: string;
  bookIds: string[];
  requiredBooks: number;
  reward: {
    type: 'title' | 'score_bonus' | 'hint_bonus' | 'special_book';
    value: string | number;
  };
  backgroundStory: string;
  relatedThemes: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EasterEgg {
  id: string;
  name: string;
  icon: string;
  description: string;
  hint: string;
  type: 'book_reference' | 'hidden_message' | 'secret_combination' | 'date_trigger' | 'sequence_trigger' | 'hidden_author';
  unlockCondition: {
    type: 'find_book' | 'find_all_books' | 'specific_sequence' | 'specific_date' | 'click_pattern' | 'achievement_unlock';
    bookId?: string;
    bookIds?: string[];
    sequence?: string[];
    date?: { month: number; day: number };
    pattern?: string[];
    achievementId?: string;
  };
  unlocked: boolean;
  unlockedAt?: number;
  reward: {
    type: 'score' | 'title' | 'hidden_story' | 'author_trivia';
    value: string | number;
  };
  content: string;
  category: 'literary_reference' | 'pop_culture' | 'developer_joke' | 'historical_fact' | 'hidden_story';
}

export interface CodexStats {
  totalBooks: number;
  collectedBooks: number;
  totalAuthors: number;
  discoveredAuthors: number;
  totalDiscoveries: number;
  totalThemes: number;
  completedThemes: number;
  totalEasterEggs: number;
  foundEasterEggs: number;
  completionPercentage: number;
}

export interface CodexProgress {
  collectedBookIds: string[];
  discoveredAuthorIds: string[];
  discoveryRecordIds: string[];
  completedThemeIds: string[];
  foundEasterEggIds: string[];
  lastVisit: number;
  visitCount: number;
}

export interface BookCodexEntry {
  bookId: string;
  firstFoundAt: number;
  totalTimesFound: number;
  bestScore: number;
  bestScoreDate: number;
  fastestFind: number;
  fastestFindDate: number;
  fewestHints: number;
  fewestHintsDate: number;
  relatedAchievements: string[];
  notes?: string;
  isFavorite: boolean;
  tags: string[];
}

export interface AuthorCodexEntry {
  authorId: string;
  discoveredAt: number;
  booksRead: string[];
  triviaUnlocked: string[];
  quotesUnlocked: string[];
  isFavorite: boolean;
}

export interface CodexState {
  activeTab: CodexTab;
  selectedBookId: string | null;
  selectedAuthorId: string | null;
  selectedThemeId: string | null;
  selectedDiscoveryId: string | null;
  selectedEasterEggId: string | null;
  showDetail: boolean;
  filter: {
    genre?: string;
    rarity?: string;
    era?: string;
    author?: string;
    theme?: string;
    search?: string;
  };
  sortBy: 'name' | 'date' | 'rarity' | 'progress';
}
