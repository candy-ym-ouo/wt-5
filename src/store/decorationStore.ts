import { createSignal, createMemo } from 'solid-js';
import type { DecorationState, DecorationTab, CombinedDecorationEffects } from '../types/decoration';
import {
  getDecorationState,
  saveDecorationState,
  calculateCombinedEffects,
  buyShelfLayout as buyShelfLayoutStorage,
  buyDecorationTheme as buyDecorationThemeStorage,
  buyFurniture as buyFurnitureStorage,
  setActiveShelfLayout as setActiveShelfLayoutStorage,
  setActiveDecorationTheme as setActiveDecorationThemeStorage,
  placeFurniture as placeFurnitureStorage,
  removeFurniture as removeFurnitureStorage,
  syncDecorationWithStore as syncDecorationWithStoreStorage,
} from '../utils/decorationStorage';
import { MAX_FURNITURE_SLOTS } from '../data/decoration';
import { storeState, spendCoins } from './storeManager';

let initialDecorationState = getDecorationState();
initialDecorationState = syncDecorationWithStoreStorage(
  initialDecorationState,
  storeState().coins,
  storeState().reputation,
  storeState().storeLevel
);

export const [decorationState, setDecorationState] = createSignal<DecorationState>(initialDecorationState);
export const [activeDecorationTab, setActiveDecorationTab] = createSignal<DecorationTab>('layout');
export const [showDecorationManager, setShowDecorationManager] = createSignal(false);
export const [showDecorationNotification, setShowDecorationNotification] = createSignal<string | null>(null);

const persistState = (state: DecorationState): void => {
  saveDecorationState(state);
  setDecorationState(state);
};

const showNotification = (message: string): void => {
  setShowDecorationNotification(message);
  setTimeout(() => setShowDecorationNotification(null), 2500);
};

export const openDecorationManager = (): void => {
  const syncedState = syncDecorationWithStoreStorage(
    decorationState(),
    storeState().coins,
    storeState().reputation,
    storeState().storeLevel
  );
  persistState(syncedState);
  setShowDecorationManager(true);
};

export const closeDecorationManager = (): void => {
  setShowDecorationManager(false);
};

export const syncDecorationWithStore = (): void => {
  const syncedState = syncDecorationWithStoreStorage(
    decorationState(),
    storeState().coins,
    storeState().reputation,
    storeState().storeLevel
  );
  persistState(syncedState);
};

export const getCombinedEffects = createMemo((): CombinedDecorationEffects => {
  return calculateCombinedEffects(decorationState());
});

export const getDecorationInfo = createMemo(() => {
  const state = decorationState();
  const effects = getCombinedEffects();

  const layouts = Object.values(state.ownedLayouts);
  const themes = Object.values(state.ownedThemes);
  const furniture = Object.values(state.ownedFurniture);

  const ownedLayouts = layouts.filter(l => l.owned);
  const ownedThemes = themes.filter(t => t.owned);
  const ownedFurniture = furniture.filter(f => f.owned);
  const placedFurniture = furniture.filter(f => f.placed);

  return {
    state,
    effects,
    layouts,
    themes,
    furniture,
    ownedLayouts,
    ownedThemes,
    ownedFurniture,
    placedFurniture,
    activeLayout: state.activeShelfLayoutId ? state.ownedLayouts[state.activeShelfLayoutId] : null,
    activeTheme: state.activeThemeId ? state.ownedThemes[state.activeThemeId] : null,
    availableSlots: MAX_FURNITURE_SLOTS - state.placedFurnitureIds.length,
  };
});

export const buyShelfLayout = (layoutId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const store = storeState();

  const result = buyShelfLayoutStorage(state, layoutId, store.coins, store.reputation);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  if (result.coinsSpent > 0) {
    const coinSpent = spendCoins(result.coinsSpent);
    if (!coinSpent) {
      showNotification('金币扣除失败');
      return { success: false, message: '金币扣除失败' };
    }
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const buyDecorationTheme = (themeId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const store = storeState();

  const result = buyDecorationThemeStorage(state, themeId, store.coins, store.reputation);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  if (result.coinsSpent > 0) {
    const coinSpent = spendCoins(result.coinsSpent);
    if (!coinSpent) {
      showNotification('金币扣除失败');
      return { success: false, message: '金币扣除失败' };
    }
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const buyFurniture = (furnitureId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const store = storeState();

  const result = buyFurnitureStorage(state, furnitureId, store.coins, store.reputation);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  if (result.coinsSpent > 0) {
    const coinSpent = spendCoins(result.coinsSpent);
    if (!coinSpent) {
      showNotification('金币扣除失败');
      return { success: false, message: '金币扣除失败' };
    }
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const setActiveShelfLayout = (layoutId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const result = setActiveShelfLayoutStorage(state, layoutId);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const setActiveDecorationTheme = (themeId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const result = setActiveDecorationThemeStorage(state, themeId);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const placeFurniture = (furnitureId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const result = placeFurnitureStorage(state, furnitureId, MAX_FURNITURE_SLOTS);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const removeFurniture = (furnitureId: string): { success: boolean; message: string } => {
  const state = decorationState();
  const result = removeFurnitureStorage(state, furnitureId);

  if (!result.success) {
    showNotification(result.message);
    return { success: false, message: result.message };
  }

  persistState(result.state);
  showNotification(result.message);
  return { success: true, message: result.message };
};

export const getDecorationModifiers = createMemo(() => {
  const effects = getCombinedEffects().totalEffects;
  return {
    difficultyModifier: effects.difficulty.difficultyModifier,
    timeModifier: effects.difficulty.timeModifier,
    hintModifier: effects.difficulty.hintModifier,
    clueSpeedModifier: effects.difficulty.clueSpeedModifier,
    rareBookBonus: effects.difficulty.rareBookBonus,
    genreWeights: effects.bookDistribution.genreWeights,
    rarityWeights: effects.bookDistribution.rarityWeights,
    themeBoosts: effects.bookDistribution.themeBoost,
    customerBoostIds: effects.customerPreference.customerBoostIds,
    satisfactionBonus: effects.customerPreference.satisfactionBonus,
    visitFrequencyBonus: effects.customerPreference.visitFrequencyBonus,
  };
});
