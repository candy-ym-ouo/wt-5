import { createSignal, createMemo } from 'solid-js';
import type { StoreState, StoreBonus, StoreReward, StoreTab } from '../types/storeManager';
import {
  getStoreState,
  saveStoreState,
  checkAndPerformDailyReset,
  checkArrangementExpiry as checkArrangementExpiryStorage,
  getArrangementRemainingTime as getArrangementRemainingTimeStorage,
  addCoins,
  addReputation,
  activateArrangement,
  updateCustomerSatisfaction,
  updateTaskProgress,
  claimTaskReward,
  selectRandomActiveCustomer,
  getStoreBonus as calculateStoreBonus,
} from '../utils/storeManagerStorage';
import {
  getCoinRewardForBook,
  getReputationReward,
  checkCustomerSatisfaction,
} from '../data/storeManager';
import type { Book } from '../types/game';
import { getThemesForBook } from '../data/themes';
import {
  getDecorationModifiers,
  syncDecorationWithStore,
} from './decorationStore';

let initialState = getStoreState();
initialState = checkAndPerformDailyReset(initialState);

export const [storeState, setStoreState] = createSignal<StoreState>(initialState);
export const [activeStoreTab, setActiveStoreTab] = createSignal<StoreTab>('overview');
export const [showStoreManager, setShowStoreManager] = createSignal(false);
export const [showRewardPopup, setShowRewardPopup] = createSignal<StoreReward | null>(null);
export const [showTaskCompletePopup, setShowTaskCompletePopup] = createSignal<string | null>(null);

const persistState = (state: StoreState): void => {
  saveStoreState(state);
  setStoreState(state);
};

export const openStoreManager = (): void => {
  const state = checkAndPerformDailyReset(storeState());
  persistState(state);
  setShowStoreManager(true);
};

export const closeStoreManager = (): void => {
  setShowStoreManager(false);
};

const ensureArrangementChecked = (): StoreState => {
  const currentState = storeState();
  const checkedState = checkArrangementExpiryStorage(currentState);
  if (checkedState !== currentState) {
    persistState(checkedState);
    return checkedState;
  }
  return currentState;
};

export const getStoreBonus = (): StoreBonus => {
  const state = ensureArrangementChecked();
  return calculateStoreBonus(state);
};

export const getArrangementRemainingTime = (): number => {
  const state = ensureArrangementChecked();
  return getArrangementRemainingTimeStorage(state);
};

export const checkArrangementExpiry = (): void => {
  ensureArrangementChecked();
};

export const getStoreInfo = createMemo(() => {
  const state = ensureArrangementChecked();
  const bonus = calculateStoreBonus(state);
  const activeArrangement = state.activeArrangementId ? state.arrangements[state.activeArrangementId] : null;
  const activeCustomer = state.activeCustomerId ? state.customers[state.activeCustomerId] : null;
  
  const dailyTasks = Object.values(state.tasks).filter(t => t.taskType === 'daily');
  const weeklyTasks = Object.values(state.tasks).filter(t => t.taskType === 'weekly');
  const specialTasks = Object.values(state.tasks).filter(t => t.taskType === 'special');
  
  const completedDaily = dailyTasks.filter(t => t.completed).length;
  const completedWeekly = weeklyTasks.filter(t => t.completed).length;
  
  const unlockedCustomers = Object.values(state.customers).filter(c => c.unlocked).length;
  const unlockedArrangements = Object.values(state.arrangements).filter(a => a.unlocked).length;
  
  return {
    state,
    bonus,
    activeArrangement,
    activeCustomer,
    dailyTasks,
    weeklyTasks,
    specialTasks,
    completedDaily,
    completedWeekly,
    unlockedCustomers,
    unlockedArrangements,
  };
});

export const processBookFound = (book: Book, score: number): { coinsEarned: number; reputationEarned: number; customerSatisfied: boolean } => {
  let state = ensureArrangementChecked();
  
  syncDecorationWithStore();
  
  const activeCustomer = state.activeCustomerId ? state.customers[state.activeCustomerId] : null;
  let customerBonus = 0;
  let customerSatisfied = false;
  let satisfactionGain = 0;
  
  if (activeCustomer) {
    const bookThemes = getThemesForBook(book.id).map(t => t.id);
    const satisfactionBonus = getDecorationModifiers().satisfactionBonus;
    const satisfactionResult = checkCustomerSatisfaction(
      activeCustomer,
      book.genre,
      book.rarity,
      bookThemes,
      satisfactionBonus
    );
    customerBonus = satisfactionResult.coinBonus;
    customerSatisfied = satisfactionResult.satisfied;
    satisfactionGain = satisfactionResult.satisfactionGain;
  }
  
  const bonus = calculateStoreBonus(state);
  const baseCoins = getCoinRewardForBook(book.rarity, score, customerBonus);
  const coinsEarned = Math.floor(baseCoins * bonus.coinMultiplier);
  const reputationEarned = getReputationReward(coinsEarned, customerSatisfied);
  
  state = addCoins(state, coinsEarned);
  state = addReputation(state, reputationEarned);
  
  state = { ...state, todayBooksFound: state.todayBooksFound + 1 };
  state = { ...state, todayScoreEarned: state.todayScoreEarned + score };
  
  state = updateTaskProgress(state, 'find_books', 1);
  state = updateTaskProgress(state, 'find_genre', 1, { genre: book.genre });
  state = updateTaskProgress(state, 'find_rarity', 1, { rarity: book.rarity });
  state = updateTaskProgress(state, 'earn_coins', coinsEarned);
  
  if (activeCustomer && customerSatisfied) {
    state = updateCustomerSatisfaction(state, activeCustomer.id, satisfactionGain, coinsEarned);
    state = updateTaskProgress(state, 'satisfy_customer', 1);
    
    const updatedCustomer = state.customers[activeCustomer.id];
    if (updatedCustomer && updatedCustomer.satisfaction >= updatedCustomer.maxSatisfaction) {
      const nextCustomer = selectRandomActiveCustomer(state);
      if (nextCustomer && nextCustomer.id !== activeCustomer.id) {
        state = { ...state, activeCustomerId: nextCustomer.id };
      }
    }
  }
  
  const newlyCompletedTasks = Object.values(state.tasks).filter(
    t => t.completed && !t.claimed && t.unlocked
  );
  if (newlyCompletedTasks.length > 0) {
    const lastCompleted = newlyCompletedTasks[newlyCompletedTasks.length - 1];
    setShowTaskCompletePopup(lastCompleted.title);
    setTimeout(() => setShowTaskCompletePopup(null), 3000);
  }
  
  persistState(state);
  
  setShowRewardPopup({
    coins: coinsEarned,
    reputation: reputationEarned,
    description: customerSatisfied ? `${activeCustomer?.name}非常满意！` : '成功出售书籍',
  });
  setTimeout(() => setShowRewardPopup(null), 2500);
  
  return { coinsEarned, reputationEarned, customerSatisfied };
};

export const arrangeShelf = (arrangementId: string): { success: boolean; message: string } => {
  const state = storeState();
  const result = activateArrangement(state, arrangementId);
  
  if (result.success) {
    const updatedState = updateTaskProgress(result.state, 'arrange_shelf', 1);
    persistState(updatedState);
  }
  
  return { success: result.success, message: result.message };
};

export const claimReward = (taskId: string): { success: boolean; rewards: string[] } => {
  const state = storeState();
  const result = claimTaskReward(state, taskId);
  
  if (result.success) {
    persistState(result.state);
    
    if (result.rewards.length > 0) {
      setShowRewardPopup({
        coins: 0,
        reputation: 0,
        description: `任务奖励：${result.rewards.join('，')}`,
      });
      setTimeout(() => setShowRewardPopup(null), 3000);
    }
  }
  
  return { success: result.success, rewards: result.rewards };
};

export const setActiveCustomer = (customerId: string | null): void => {
  const state = storeState();
  
  if (customerId && !state.customers[customerId]?.unlocked) {
    return;
  }
  
  const newState = { ...state, activeCustomerId: customerId };
  persistState(newState);
};

export const getHintBonus = (): number => {
  return getStoreInfo().bonus.hintsBonus;
};

export const getTimeBonus = (): number => {
  return getStoreInfo().bonus.timeBonus;
};

export const getScoreMultiplier = (): number => {
  return getStoreInfo().bonus.scoreMultiplier;
};

export const getRareChanceBonus = (): number => {
  return getStoreInfo().bonus.rareChanceBonus;
};

export const getClueSpeedBonus = (): number => {
  return getStoreInfo().bonus.clueSpeedBonus;
};

export const spendCoins = (amount: number): boolean => {
  const state = storeState();
  if (state.coins < amount) return false;
  
  const newState = { ...state, coins: state.coins - amount };
  persistState(newState);
  return true;
};

export const getCoins = (): number => {
  return storeState().coins;
};

export const getStoreLevel = (): number => {
  return storeState().storeLevel;
};

export const awardCommissionRewards = (coins: number, reputation: number, bookTitle: string): void => {
  let state = storeState();
  state = addCoins(state, coins);
  state = addReputation(state, reputation);
  state = updateTaskProgress(state, 'earn_coins', coins);
  persistState(state);
  
  setShowRewardPopup({
    coins,
    reputation,
    description: `完成顾客委托 - 《${bookTitle}》`,
  });
  setTimeout(() => setShowRewardPopup(null), 2500);
};
