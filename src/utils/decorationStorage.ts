import type {
  DecorationState,
  ShelfLayout,
  DecorationTheme,
  FurnitureItem,
  DecorationEffects,
  CombinedDecorationEffects,
} from '../types/decoration';
import {
  SHELF_LAYOUTS,
  DECORATION_THEMES,
  FURNITURE_ITEMS,
} from '../data/decoration';

export const DECORATION_STATE_KEY = 'old_bookstore_decoration';

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

const createInitialLayouts = (): Record<string, ShelfLayout> => {
  const layouts: Record<string, ShelfLayout> = {};
  SHELF_LAYOUTS.forEach(l => {
    layouts[l.id] = { ...l };
  });
  return layouts;
};

const createInitialThemes = (): Record<string, DecorationTheme> => {
  const themes: Record<string, DecorationTheme> = {};
  DECORATION_THEMES.forEach(t => {
    themes[t.id] = { ...t };
  });
  return themes;
};

const createInitialFurniture = (): Record<string, FurnitureItem> => {
  const furniture: Record<string, FurnitureItem> = {};
  FURNITURE_ITEMS.forEach(f => {
    furniture[f.id] = { ...f };
  });
  return furniture;
};

const createDefaultEffects = (): DecorationEffects => ({
  bookDistribution: {
    genreWeights: {},
    rarityWeights: {},
    themeBoost: [],
  },
  customerPreference: {
    customerBoostIds: [],
    satisfactionBonus: 0,
    visitFrequencyBonus: 0,
  },
  difficulty: {
    difficultyModifier: 0,
    timeModifier: 0,
    hintModifier: 0,
    clueSpeedModifier: 0,
    rareBookBonus: 0,
  },
});

const createInitialDecorationState = (): DecorationState => ({
  coins: 0,
  reputation: 0,
  storeLevel: 1,
  activeShelfLayoutId: 'layout_compact',
  activeThemeId: 'theme_classic',
  placedFurnitureIds: [],
  ownedLayouts: createInitialLayouts(),
  ownedThemes: createInitialThemes(),
  ownedFurniture: createInitialFurniture(),
  activeEffects: createDefaultEffects(),
});

export const getDecorationState = (): DecorationState => {
  const saved = _readJSON<DecorationState | null>(DECORATION_STATE_KEY, null);
  if (saved) {
    if (!saved.ownedLayouts || Object.keys(saved.ownedLayouts).length === 0) {
      saved.ownedLayouts = createInitialLayouts();
    }
    if (!saved.ownedThemes || Object.keys(saved.ownedThemes).length === 0) {
      saved.ownedThemes = createInitialThemes();
    }
    if (!saved.ownedFurniture || Object.keys(saved.ownedFurniture).length === 0) {
      saved.ownedFurniture = createInitialFurniture();
    }
    if (!saved.activeEffects) {
      saved.activeEffects = createDefaultEffects();
    }
    if (!saved.activeShelfLayoutId) {
      saved.activeShelfLayoutId = 'layout_compact';
    }
    if (!saved.activeThemeId) {
      saved.activeThemeId = 'theme_classic';
    }
    if (!saved.placedFurnitureIds) {
      saved.placedFurnitureIds = [];
    }
    _writeJSON(DECORATION_STATE_KEY, saved);
    return saved;
  }
  const initial = createInitialDecorationState();
  _writeJSON(DECORATION_STATE_KEY, initial);
  return initial;
};

export const saveDecorationState = (state: DecorationState): void => {
  _writeJSON(DECORATION_STATE_KEY, state);
};

const mergeEffects = (
  base: DecorationEffects,
  addition: DecorationEffects
): DecorationEffects => {
  const result: DecorationEffects = {
    bookDistribution: {
      genreWeights: { ...base.bookDistribution.genreWeights },
      rarityWeights: { ...base.bookDistribution.rarityWeights },
      themeBoost: [...base.bookDistribution.themeBoost],
    },
    customerPreference: {
      customerBoostIds: [...base.customerPreference.customerBoostIds],
      satisfactionBonus: base.customerPreference.satisfactionBonus,
      visitFrequencyBonus: base.customerPreference.visitFrequencyBonus,
    },
    difficulty: {
      difficultyModifier: base.difficulty.difficultyModifier,
      timeModifier: base.difficulty.timeModifier,
      hintModifier: base.difficulty.hintModifier,
      clueSpeedModifier: base.difficulty.clueSpeedModifier,
      rareBookBonus: base.difficulty.rareBookBonus,
    },
  };

  for (const [genre, weight] of Object.entries(addition.bookDistribution.genreWeights)) {
    result.bookDistribution.genreWeights[genre] =
      (result.bookDistribution.genreWeights[genre] || 0) + weight;
  }

  for (const [rarity, weight] of Object.entries(addition.bookDistribution.rarityWeights)) {
    result.bookDistribution.rarityWeights[rarity] =
      (result.bookDistribution.rarityWeights[rarity] || 0) + weight;
  }

  for (const theme of addition.bookDistribution.themeBoost) {
    if (!result.bookDistribution.themeBoost.includes(theme)) {
      result.bookDistribution.themeBoost.push(theme);
    }
  }

  for (const customerId of addition.customerPreference.customerBoostIds) {
    if (!result.customerPreference.customerBoostIds.includes(customerId)) {
      result.customerPreference.customerBoostIds.push(customerId);
    }
  }

  result.customerPreference.satisfactionBonus += addition.customerPreference.satisfactionBonus;
  result.customerPreference.visitFrequencyBonus += addition.customerPreference.visitFrequencyBonus;

  result.difficulty.difficultyModifier += addition.difficulty.difficultyModifier;
  result.difficulty.timeModifier += addition.difficulty.timeModifier;
  result.difficulty.hintModifier += addition.difficulty.hintModifier;
  result.difficulty.clueSpeedModifier += addition.difficulty.clueSpeedModifier;
  result.difficulty.rareBookBonus += addition.difficulty.rareBookBonus;

  return result;
};

export const calculateCombinedEffects = (state: DecorationState): CombinedDecorationEffects => {
  let totalEffects = createDefaultEffects();
  const furnitureContributions: FurnitureItem[] = [];

  const activeLayout = state.activeShelfLayoutId
    ? state.ownedLayouts[state.activeShelfLayoutId]
    : null;
  const activeTheme = state.activeThemeId
    ? state.ownedThemes[state.activeThemeId]
    : null;

  if (activeLayout) {
    totalEffects = mergeEffects(totalEffects, activeLayout.effects);
  }

  if (activeTheme) {
    totalEffects = mergeEffects(totalEffects, activeTheme.effects);
  }

  for (const furnitureId of state.placedFurnitureIds) {
    const furniture = state.ownedFurniture[furnitureId];
    if (furniture && furniture.placed) {
      totalEffects = mergeEffects(totalEffects, furniture.effects);
      furnitureContributions.push(furniture);
    }
  }

  return {
    totalEffects,
    layoutContribution: activeLayout,
    themeContribution: activeTheme,
    furnitureContributions,
  };
};

export const recalculateActiveEffects = (state: DecorationState): DecorationState => {
  const { totalEffects } = calculateCombinedEffects(state);
  return {
    ...state,
    activeEffects: totalEffects,
  };
};

export const buyShelfLayout = (
  state: DecorationState,
  layoutId: string,
  currentCoins: number,
  currentReputation: number
): { success: boolean; state: DecorationState; message: string; coinsSpent: number } => {
  const layout = state.ownedLayouts[layoutId];
  if (!layout) {
    return { success: false, state, message: '布局不存在', coinsSpent: 0 };
  }

  if (layout.owned) {
    return { success: false, state, message: '已拥有该布局', coinsSpent: 0 };
  }

  if (!layout.unlocked && layout.unlockReputation && currentReputation < layout.unlockReputation) {
    return {
      success: false,
      state,
      message: `声望不足，需要 ${layout.unlockReputation} 声望`,
      coinsSpent: 0,
    };
  }

  if (currentCoins < layout.cost) {
    return { success: false, state, message: '金币不足', coinsSpent: 0 };
  }

  const newState = { ...state };
  newState.ownedLayouts = { ...state.ownedLayouts };
  newState.ownedLayouts[layoutId] = {
    ...layout,
    owned: true,
    unlocked: true,
  };

  return {
    success: true,
    state: newState,
    message: `成功购买「${layout.name}」`,
    coinsSpent: layout.cost,
  };
};

export const buyDecorationTheme = (
  state: DecorationState,
  themeId: string,
  currentCoins: number,
  currentReputation: number
): { success: boolean; state: DecorationState; message: string; coinsSpent: number } => {
  const theme = state.ownedThemes[themeId];
  if (!theme) {
    return { success: false, state, message: '主题不存在', coinsSpent: 0 };
  }

  if (theme.owned) {
    return { success: false, state, message: '已拥有该主题', coinsSpent: 0 };
  }

  if (!theme.unlocked && theme.unlockReputation && currentReputation < theme.unlockReputation) {
    return {
      success: false,
      state,
      message: `声望不足，需要 ${theme.unlockReputation} 声望`,
      coinsSpent: 0,
    };
  }

  if (currentCoins < theme.cost) {
    return { success: false, state, message: '金币不足', coinsSpent: 0 };
  }

  const newState = { ...state };
  newState.ownedThemes = { ...state.ownedThemes };
  newState.ownedThemes[themeId] = {
    ...theme,
    owned: true,
    unlocked: true,
  };

  return {
    success: true,
    state: newState,
    message: `成功购买「${theme.name}」`,
    coinsSpent: theme.cost,
  };
};

export const buyFurniture = (
  state: DecorationState,
  furnitureId: string,
  currentCoins: number,
  currentReputation: number
): { success: boolean; state: DecorationState; message: string; coinsSpent: number } => {
  const furniture = state.ownedFurniture[furnitureId];
  if (!furniture) {
    return { success: false, state, message: '摆件不存在', coinsSpent: 0 };
  }

  if (furniture.owned) {
    return { success: false, state, message: '已拥有该摆件', coinsSpent: 0 };
  }

  if (!furniture.unlocked && furniture.unlockReputation && currentReputation < furniture.unlockReputation) {
    return {
      success: false,
      state,
      message: `声望不足，需要 ${furniture.unlockReputation} 声望`,
      coinsSpent: 0,
    };
  }

  if (currentCoins < furniture.cost) {
    return { success: false, state, message: '金币不足', coinsSpent: 0 };
  }

  const newState = { ...state };
  newState.ownedFurniture = { ...state.ownedFurniture };
  newState.ownedFurniture[furnitureId] = {
    ...furniture,
    owned: true,
    unlocked: true,
  };

  return {
    success: true,
    state: newState,
    message: `成功购买「${furniture.name}」`,
    coinsSpent: furniture.cost,
  };
};

export const setActiveShelfLayout = (
  state: DecorationState,
  layoutId: string
): { success: boolean; state: DecorationState; message: string } => {
  const layout = state.ownedLayouts[layoutId];
  if (!layout || !layout.owned) {
    return { success: false, state, message: '未拥有该布局' };
  }

  const newState = { ...state };
  newState.ownedLayouts = { ...state.ownedLayouts };

  if (state.activeShelfLayoutId) {
    const oldLayout = newState.ownedLayouts[state.activeShelfLayoutId];
    if (oldLayout) {
      newState.ownedLayouts[state.activeShelfLayoutId] = {
        ...oldLayout,
        active: false,
      };
    }
  }

  newState.ownedLayouts[layoutId] = {
    ...layout,
    active: true,
  };
  newState.activeShelfLayoutId = layoutId;

  return {
    success: true,
    state: recalculateActiveEffects(newState),
    message: `已切换为「${layout.name}」`,
  };
};

export const setActiveDecorationTheme = (
  state: DecorationState,
  themeId: string
): { success: boolean; state: DecorationState; message: string } => {
  const theme = state.ownedThemes[themeId];
  if (!theme || !theme.owned) {
    return { success: false, state, message: '未拥有该主题' };
  }

  const newState = { ...state };
  newState.ownedThemes = { ...state.ownedThemes };

  if (state.activeThemeId) {
    const oldTheme = newState.ownedThemes[state.activeThemeId];
    if (oldTheme) {
      newState.ownedThemes[state.activeThemeId] = {
        ...oldTheme,
        active: false,
      };
    }
  }

  newState.ownedThemes[themeId] = {
    ...theme,
    active: true,
  };
  newState.activeThemeId = themeId;

  return {
    success: true,
    state: recalculateActiveEffects(newState),
    message: `已切换为「${theme.name}」`,
  };
};

export const placeFurniture = (
  state: DecorationState,
  furnitureId: string,
  maxSlots: number = 4
): { success: boolean; state: DecorationState; message: string } => {
  const furniture = state.ownedFurniture[furnitureId];
  if (!furniture || !furniture.owned) {
    return { success: false, state, message: '未拥有该摆件' };
  }

  if (furniture.placed) {
    return { success: false, state, message: '该摆件已放置' };
  }

  if (state.placedFurnitureIds.length >= maxSlots) {
    return { success: false, state, message: `摆件位已满（最多 ${maxSlots} 个）` };
  }

  const newState = { ...state };
  newState.ownedFurniture = { ...state.ownedFurniture };
  newState.ownedFurniture[furnitureId] = {
    ...furniture,
    placed: true,
    position: state.placedFurnitureIds.length,
  };
  newState.placedFurnitureIds = [...state.placedFurnitureIds, furnitureId];

  return {
    success: true,
    state: recalculateActiveEffects(newState),
    message: `已放置「${furniture.name}」`,
  };
};

export const removeFurniture = (
  state: DecorationState,
  furnitureId: string
): { success: boolean; state: DecorationState; message: string } => {
  const furniture = state.ownedFurniture[furnitureId];
  if (!furniture || !furniture.placed) {
    return { success: false, state, message: '该摆件未放置' };
  }

  const newState = { ...state };
  newState.ownedFurniture = { ...state.ownedFurniture };
  newState.ownedFurniture[furnitureId] = {
    ...furniture,
    placed: false,
    position: undefined,
  };
  newState.placedFurnitureIds = state.placedFurnitureIds.filter(id => id !== furnitureId);

  return {
    success: true,
    state: recalculateActiveEffects(newState),
    message: `已移除「${furniture.name}」`,
  };
};

export const syncDecorationWithStore = (
  decorationState: DecorationState,
  coins: number,
  reputation: number,
  storeLevel: number
): DecorationState => {
  const newState = { ...decorationState };

  newState.ownedLayouts = { ...decorationState.ownedLayouts };
  for (const layout of Object.values(newState.ownedLayouts)) {
    if (!layout.unlocked && layout.unlockReputation && reputation >= layout.unlockReputation) {
      newState.ownedLayouts[layout.id] = { ...layout, unlocked: true };
    }
  }

  newState.ownedThemes = { ...decorationState.ownedThemes };
  for (const theme of Object.values(newState.ownedThemes)) {
    if (!theme.unlocked && theme.unlockReputation && reputation >= theme.unlockReputation) {
      newState.ownedThemes[theme.id] = { ...theme, unlocked: true };
    }
  }

  newState.ownedFurniture = { ...decorationState.ownedFurniture };
  for (const furniture of Object.values(newState.ownedFurniture)) {
    if (!furniture.unlocked && furniture.unlockReputation && reputation >= furniture.unlockReputation) {
      newState.ownedFurniture[furniture.id] = { ...furniture, unlocked: true };
    }
  }

  newState.coins = coins;
  newState.reputation = reputation;
  newState.storeLevel = storeLevel;

  return newState;
};

export const getDecorationDifficultyModifier = (state: DecorationState): number => {
  return state.activeEffects.difficulty.difficultyModifier;
};

export const getDecorationTimeModifier = (state: DecorationState): number => {
  return state.activeEffects.difficulty.timeModifier;
};

export const getDecorationHintModifier = (state: DecorationState): number => {
  return state.activeEffects.difficulty.hintModifier;
};

export const getDecorationClueSpeedModifier = (state: DecorationState): number => {
  return state.activeEffects.difficulty.clueSpeedModifier;
};

export const getDecorationRareBookBonus = (state: DecorationState): number => {
  return state.activeEffects.difficulty.rareBookBonus;
};

export const getDecorationGenreWeights = (state: DecorationState): Record<string, number> => {
  return state.activeEffects.bookDistribution.genreWeights;
};

export const getDecorationRarityWeights = (state: DecorationState): Record<string, number> => {
  return state.activeEffects.bookDistribution.rarityWeights;
};

export const getDecorationThemeBoosts = (state: DecorationState): string[] => {
  return state.activeEffects.bookDistribution.themeBoost;
};

export const getDecorationCustomerBoosts = (state: DecorationState): string[] => {
  return state.activeEffects.customerPreference.customerBoostIds;
};

export const getDecorationSatisfactionBonus = (state: DecorationState): number => {
  return state.activeEffects.customerPreference.satisfactionBonus;
};

export const clearDecorationData = (): void => {
  localStorage.removeItem(DECORATION_STATE_KEY);
};
