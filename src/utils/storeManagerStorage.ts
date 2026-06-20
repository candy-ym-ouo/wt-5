import type { StoreState, CustomerPreference, ShelfArrangement, StoreTask, BusinessDay } from '../types/storeManager';
import { CUSTOMERS, ARRANGEMENTS, DAILY_TASKS, WEEKLY_TASKS, SPECIAL_TASKS, getStoreLevel, getStoreLevelBonus } from '../data/storeManager';
import {
  getDecorationState,
  getDecorationTimeModifier,
  getDecorationHintModifier,
  getDecorationClueSpeedModifier,
  getDecorationRareBookBonus,
} from './decorationStorage';

export const STORE_STATE_KEY = 'old_bookstore_store_manager';
export const STORE_DAILY_RESET_KEY = 'old_bookstore_store_daily_reset';

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

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

const createInitialCustomers = (): Record<string, CustomerPreference> => {
  const customers: Record<string, CustomerPreference> = {};
  CUSTOMERS.forEach(c => {
    customers[c.id] = { ...c };
  });
  return customers;
};

const createInitialArrangements = (): Record<string, ShelfArrangement> => {
  const arrangements: Record<string, ShelfArrangement> = {};
  ARRANGEMENTS.forEach(a => {
    arrangements[a.id] = { ...a };
  });
  return arrangements;
};

const createInitialTasks = (): Record<string, StoreTask> => {
  const tasks: Record<string, StoreTask> = {};
  [...DAILY_TASKS, ...WEEKLY_TASKS, ...SPECIAL_TASKS].forEach(t => {
    tasks[t.id] = { ...t };
  });
  return tasks;
};

const createInitialStoreState = (): StoreState => {
  return {
    coins: 0,
    totalCoinsEarned: 0,
    reputation: 0,
    maxReputation: 10000,
    storeLevel: 1,
    currentDay: 0,
    consecutiveDays: 0,
    businessDays: [],
    todayBooksFound: 0,
    todayCustomersServed: 0,
    todayCoinsEarned: 0,
    todayScoreEarned: 0,
    todayShelvesArranged: 0,
    customers: createInitialCustomers(),
    arrangements: createInitialArrangements(),
    tasks: createInitialTasks(),
    activeArrangementId: null,
    activeCustomerId: null,
    storeOpen: false,
    dailyResetTime: 4,
    permanentBonuses: {
      scoreMultiplier: 0,
      timeBonus: 0,
      hintsBonus: 0,
      coinMultiplier: 0,
    },
  };
};

export const getStoreState = (): StoreState => {
  const saved = _readJSON<StoreState | null>(STORE_STATE_KEY, null);
  if (saved) {
    if (!saved.permanentBonuses) {
      saved.permanentBonuses = {
        scoreMultiplier: 0,
        timeBonus: 0,
        hintsBonus: 0,
        coinMultiplier: 0,
      };
      _writeJSON(STORE_STATE_KEY, saved);
    }
    return saved;
  }
  const initial = createInitialStoreState();
  _writeJSON(STORE_STATE_KEY, initial);
  return initial;
};

export const saveStoreState = (state: StoreState): void => {
  _writeJSON(STORE_STATE_KEY, state);
};

export const checkAndPerformDailyReset = (state: StoreState): StoreState => {
  const today = getTodayDateString();
  const lastReset = state.lastDailyReset;
  
  if (lastReset === today) {
    return state;
  }
  
  const newState = { ...state };
  
  if (lastReset) {
    const lastDate = new Date(lastReset);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newState.consecutiveDays = (state.consecutiveDays || 0) + 1;
    } else if (diffDays > 1) {
      newState.consecutiveDays = 1;
    }
  } else {
    newState.consecutiveDays = 1;
  }
  
  newState.currentDay = (state.currentDay || 0) + 1;
  newState.lastDailyReset = today;
  
  newState.tasks = { ...state.tasks };
  Object.values(newState.tasks).forEach(task => {
    if (task.taskType === 'daily') {
      newState.tasks[task.id] = {
        ...task,
        progress: 0,
        completed: false,
        claimed: false,
      };
    }
  });
  
  newState.todayBooksFound = 0;
  newState.todayCustomersServed = 0;
  newState.todayCoinsEarned = 0;
  newState.todayScoreEarned = 0;
  newState.todayShelvesArranged = 0;
  
  const lastPlayDate = state.lastPlayDate;
  if (lastPlayDate && lastPlayDate !== today) {
    const businessDay: BusinessDay = {
      dayNumber: state.currentDay,
      date: lastPlayDate,
      openedAt: state.businessDays[state.businessDays.length - 1]?.openedAt || Date.now(),
      closedAt: Date.now(),
      booksFound: state.todayBooksFound,
      customersServed: state.todayCustomersServed,
      coinsEarned: state.todayCoinsEarned,
      scoreEarned: state.todayScoreEarned,
      shelvesArranged: state.todayShelvesArranged,
      tasksCompleted: Object.values(state.tasks)
        .filter(t => t.taskType === 'daily' && t.completed)
        .map(t => t.id),
      bonusMultiplier: 1,
      events: [],
    };
    newState.businessDays = [...state.businessDays, businessDay];
  }
  
  newState.lastPlayDate = today;
  newState.storeLevel = getStoreLevel(newState.reputation);
  
  saveStoreState(newState);
  return newState;
};

export const addCoins = (state: StoreState, amount: number): StoreState => {
  const newState = { ...state };
  newState.coins = state.coins + amount;
  newState.totalCoinsEarned = state.totalCoinsEarned + amount;
  newState.todayCoinsEarned = state.todayCoinsEarned + amount;
  return newState;
};

export const spendCoins = (state: StoreState, amount: number): { success: boolean; state: StoreState } => {
  if (state.coins < amount) {
    return { success: false, state };
  }
  const newState = { ...state };
  newState.coins = state.coins - amount;
  return { success: true, state: newState };
};

export const addReputation = (state: StoreState, amount: number): StoreState => {
  const newState = { ...state };
  newState.reputation = Math.min(state.reputation + amount, state.maxReputation);
  newState.storeLevel = getStoreLevel(newState.reputation);
  return newState;
};

export const unlockCustomer = (state: StoreState, customerId: string): StoreState => {
  if (!state.customers[customerId]) return state;
  const newState = { ...state };
  newState.customers = { ...state.customers };
  newState.customers[customerId] = {
    ...state.customers[customerId],
    unlocked: true,
  };
  return newState;
};

export const unlockArrangement = (state: StoreState, arrangementId: string): StoreState => {
  if (!state.arrangements[arrangementId]) return state;
  const newState = { ...state };
  newState.arrangements = { ...state.arrangements };
  newState.arrangements[arrangementId] = {
    ...state.arrangements[arrangementId],
    unlocked: true,
  };
  return newState;
};

export const activateArrangement = (state: StoreState, arrangementId: string): { success: boolean; state: StoreState; message: string } => {
  const arrangement = state.arrangements[arrangementId];
  if (!arrangement || !arrangement.unlocked) {
    return { success: false, state, message: '该整理方式尚未解锁' };
  }
  
  if (arrangement.cost > state.coins) {
    return { success: false, state, message: '金币不足' };
  }
  
  const spendResult = spendCoins(state, arrangement.cost);
  if (!spendResult.success) {
    return { success: false, state, message: '金币不足' };
  }
  
  const newState = { ...spendResult.state };
  newState.arrangements = { ...spendResult.state.arrangements };
  
  if (state.activeArrangementId && state.arrangements[state.activeArrangementId]) {
    newState.arrangements[state.activeArrangementId] = {
      ...state.arrangements[state.activeArrangementId],
      active: false,
    };
  }
  
  newState.arrangements[arrangementId] = {
    ...arrangement,
    active: true,
    activatedAt: Date.now(),
  };
  
  newState.activeArrangementId = arrangementId;
  newState.todayShelvesArranged = state.todayShelvesArranged + 1;
  
  return { success: true, state: newState, message: `已激活${arrangement.name}！` };
};

export const updateCustomerSatisfaction = (
  state: StoreState,
  customerId: string,
  satisfactionGain: number,
  coinsSpent: number
): StoreState => {
  const customer = state.customers[customerId];
  if (!customer || !customer.unlocked) return state;
  
  const newState = { ...state };
  newState.customers = { ...state.customers };
  newState.customers[customerId] = {
    ...customer,
    satisfaction: Math.min(customer.satisfaction + satisfactionGain, customer.maxSatisfaction),
    visits: customer.visits + 1,
    totalSpent: customer.totalSpent + coinsSpent,
    lastVisit: Date.now(),
  };
  newState.todayCustomersServed = state.todayCustomersServed + 1;
  
  return newState;
};

export const updateTaskProgress = (
  state: StoreState,
  taskType: string,
  value: number,
  extra?: { genre?: string; rarity?: string }
): StoreState => {
  const newState = { ...state };
  newState.tasks = { ...state.tasks };
  
  Object.values(newState.tasks).forEach(task => {
    if (task.completed || task.claimed || !task.unlocked) return;
    if (task.requirement.type !== taskType) return;
    
    if (extra?.genre && task.requirement.genre !== extra.genre) return;
    if (extra?.rarity) {
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const taskRarityIndex = rarityOrder.indexOf(task.requirement.rarity || 'common');
      const valueRarityIndex = rarityOrder.indexOf(extra.rarity);
      if (valueRarityIndex < taskRarityIndex) return;
    }
    
    const newProgress = Math.min(task.progress + value, task.requirement.target);
    newState.tasks[task.id] = {
      ...task,
      progress: newProgress,
      completed: newProgress >= task.requirement.target,
    };
  });
  
  return newState;
};

export const claimTaskReward = (state: StoreState, taskId: string): { success: boolean; state: StoreState; rewards: string[] } => {
  const task = state.tasks[taskId];
  if (!task || !task.completed || task.claimed) {
    return { success: false, state, rewards: [] };
  }
  
  let newState = { ...state };
  const rewards: string[] = [];
  
  if (!newState.permanentBonuses) {
    newState.permanentBonuses = {
      scoreMultiplier: 0,
      timeBonus: 0,
      hintsBonus: 0,
      coinMultiplier: 0,
    };
  } else {
    newState.permanentBonuses = { ...newState.permanentBonuses };
  }
  
  if (task.rewards.coins) {
    newState = addCoins(newState, task.rewards.coins);
    rewards.push(`+${task.rewards.coins} 金币`);
  }
  
  if (task.rewards.scoreBonus) {
    newState.permanentBonuses.scoreMultiplier += task.rewards.scoreBonus;
    rewards.push(`+${task.rewards.scoreBonus}% 永久分数加成`);
  }
  
  if (task.rewards.hints) {
    newState.permanentBonuses.hintsBonus += task.rewards.hints;
    rewards.push(`+${task.rewards.hints} 永久提示加成`);
  }
  
  if (task.rewards.arrangementId) {
    newState = unlockArrangement(newState, task.rewards.arrangementId);
    const arrangement = newState.arrangements[task.rewards.arrangementId];
    if (arrangement) {
      rewards.push(`解锁整理方式：${arrangement.name}`);
    }
  }
  
  if (task.rewards.customerId) {
    newState = unlockCustomer(newState, task.rewards.customerId);
    const customer = newState.customers[task.rewards.customerId];
    if (customer) {
      rewards.push(`解锁顾客：${customer.name}`);
    }
  }
  
  newState.tasks = { ...newState.tasks };
  newState.tasks[taskId] = { ...task, claimed: true };
  
  return { success: true, state: newState, rewards };
};

export const selectRandomActiveCustomer = (state: StoreState): CustomerPreference | null => {
  const unlockedCustomers = Object.values(state.customers).filter(c => c.unlocked);
  if (unlockedCustomers.length === 0) return null;
  
  const weightedCustomers = unlockedCustomers.map(c => ({
    customer: c,
    weight: c.satisfaction > 70 ? 3 : c.satisfaction > 40 ? 2 : 1,
  }));
  
  const totalWeight = weightedCustomers.reduce((sum, wc) => sum + wc.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const wc of weightedCustomers) {
    random -= wc.weight;
    if (random <= 0) {
      return wc.customer;
    }
  }
  
  return weightedCustomers[0].customer;
};

export const checkArrangementExpiry = (state: StoreState): StoreState => {
  if (!state.activeArrangementId || !state.arrangements[state.activeArrangementId]) {
    return state;
  }
  
  const arrangement = state.arrangements[state.activeArrangementId];
  if (!arrangement.active || !arrangement.activatedAt || !arrangement.duration) {
    return state;
  }
  
  const now = Date.now();
  const expiresAt = arrangement.activatedAt + arrangement.duration * 60 * 1000;
  
  if (now >= expiresAt) {
    const newState = { ...state };
    newState.arrangements = { ...state.arrangements };
    newState.arrangements[state.activeArrangementId] = {
      ...arrangement,
      active: false,
    };
    newState.activeArrangementId = null;
    return newState;
  }
  
  return state;
};

export const getArrangementRemainingTime = (state: StoreState): number => {
  if (!state.activeArrangementId || !state.arrangements[state.activeArrangementId]) {
    return 0;
  }
  
  const arrangement = state.arrangements[state.activeArrangementId];
  if (!arrangement.active || !arrangement.activatedAt || !arrangement.duration) {
    return 0;
  }
  
  const now = Date.now();
  const expiresAt = arrangement.activatedAt + arrangement.duration * 60 * 1000;
  return Math.max(0, Math.floor((expiresAt - now) / 1000));
};

export const getStoreBonus = (state: StoreState) => {
  let scoreMultiplier = 1;
  let timeBonus = 0;
  let hintsBonus = 0;
  let clueSpeedBonus = 0;
  let rareChanceBonus = 0;
  let coinMultiplier = 1;
  
  const levelBonus = getStoreLevelBonus(state.storeLevel);
  scoreMultiplier *= levelBonus.scoreMultiplier;
  coinMultiplier *= levelBonus.coinMultiplier;
  
  if (state.permanentBonuses) {
    scoreMultiplier += state.permanentBonuses.scoreMultiplier / 100;
    timeBonus += state.permanentBonuses.timeBonus;
    hintsBonus += state.permanentBonuses.hintsBonus;
    coinMultiplier += state.permanentBonuses.coinMultiplier / 100;
  }
  
  const checkedState = checkArrangementExpiry(state);
  if (checkedState.activeArrangementId && checkedState.arrangements[checkedState.activeArrangementId]) {
    const arrangement = checkedState.arrangements[checkedState.activeArrangementId];
    switch (arrangement.bonusType) {
      case 'score':
        scoreMultiplier += arrangement.bonusValue / 100;
        break;
      case 'time':
        timeBonus += arrangement.bonusValue;
        break;
      case 'hints':
        hintsBonus += arrangement.bonusValue;
        break;
      case 'clue_speed':
        clueSpeedBonus += arrangement.bonusValue;
        break;
      case 'rare_chance':
        rareChanceBonus += arrangement.bonusValue;
        break;
    }
  }
  
  const activeCustomer = state.activeCustomerId ? state.customers[state.activeCustomerId] : null;
  if (activeCustomer) {
    const satisfactionBonus = activeCustomer.satisfaction / 200;
    scoreMultiplier += satisfactionBonus;
    coinMultiplier += satisfactionBonus / 2;
  }
  
  try {
    const decorationState = getDecorationState();
    timeBonus += getDecorationTimeModifier(decorationState);
    hintsBonus += getDecorationHintModifier(decorationState);
    clueSpeedBonus += getDecorationClueSpeedModifier(decorationState);
    rareChanceBonus += getDecorationRareBookBonus(decorationState);
  } catch (e) {
  }
  
  return {
    scoreMultiplier,
    timeBonus,
    hintsBonus,
    clueSpeedBonus,
    rareChanceBonus,
    coinMultiplier,
  };
};

export const clearStoreData = (): void => {
  localStorage.removeItem(STORE_STATE_KEY);
  localStorage.removeItem(STORE_DAILY_RESET_KEY);
};
