export interface CustomerPreference {
  id: string;
  name: string;
  avatar: string;
  description: string;
  preferredGenres: string[];
  preferredThemes: string[];
  preferredRarities: string[];
  satisfaction: number;
  maxSatisfaction: number;
  visits: number;
  totalSpent: number;
  lastVisit?: number;
  unlocked: boolean;
}

export interface ShelfArrangement {
  id: string;
  name: string;
  description: string;
  icon: string;
  arrangementType: 'genre' | 'rarity' | 'theme' | 'year' | 'author' | 'custom';
  bonusType: 'score' | 'time' | 'hints' | 'clue_speed' | 'rare_chance';
  bonusValue: number;
  cost: number;
  unlocked: boolean;
  active: boolean;
  duration: number;
  activatedAt?: number;
}

export interface StoreTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  taskType: 'daily' | 'weekly' | 'special';
  requirement: {
    type: 'find_books' | 'find_genre' | 'find_rarity' | 'arrange_shelf' | 'satisfy_customer' | 'consecutive_days' | 'earn_coins';
    target: number;
    genre?: string;
    rarity?: string;
  };
  rewards: {
    coins?: number;
    scoreBonus?: number;
    hints?: number;
    arrangementId?: string;
    customerId?: string;
  };
  progress: number;
  completed: boolean;
  claimed: boolean;
  expiresAt?: number;
  unlocked: boolean;
}

export interface BusinessDay {
  dayNumber: number;
  date: string;
  openedAt: number;
  closedAt?: number;
  booksFound: number;
  customersServed: number;
  coinsEarned: number;
  scoreEarned: number;
  shelvesArranged: number;
  tasksCompleted: string[];
  bonusMultiplier: number;
  events: string[];
}

export interface StoreState {
  coins: number;
  totalCoinsEarned: number;
  reputation: number;
  maxReputation: number;
  storeLevel: number;
  currentDay: number;
  consecutiveDays: number;
  lastPlayDate?: string;
  businessDays: BusinessDay[];
  todayBooksFound: number;
  todayCustomersServed: number;
  todayCoinsEarned: number;
  todayScoreEarned: number;
  todayShelvesArranged: number;
  customers: Record<string, CustomerPreference>;
  arrangements: Record<string, ShelfArrangement>;
  tasks: Record<string, StoreTask>;
  activeArrangementId: string | null;
  activeCustomerId: string | null;
  storeOpen: boolean;
  dailyResetTime: number;
  lastDailyReset?: string;
  permanentBonuses: {
    scoreMultiplier: number;
    timeBonus: number;
    hintsBonus: number;
    coinMultiplier: number;
  };
}

export type StoreTab = 'overview' | 'customers' | 'arrangement' | 'tasks';

export interface StoreBonus {
  scoreMultiplier: number;
  timeBonus: number;
  hintsBonus: number;
  clueSpeedBonus: number;
  rareChanceBonus: number;
  coinMultiplier: number;
}

export interface StoreReward {
  coins: number;
  reputation: number;
  description: string;
}
