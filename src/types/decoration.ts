export type DecorationStyle = 'classic' | 'modern' | 'vintage' | 'zen' | 'fantasy' | 'tech';

export type DecorationRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ShelfLayoutType = 'compact' | 'spacious' | 'circular' | 'tower' | 'library' | 'maze';

export type FurnitureType = 'reading_nook' | 'coffee_corner' | 'plant_corner' | 'art_wall' | 'antique_display' | 'study_desk';

export interface BookDistributionEffect {
  genreWeights: Record<string, number>;
  rarityWeights: Record<string, number>;
  themeBoost: string[];
}

export interface CustomerPreferenceEffect {
  customerBoostIds: string[];
  satisfactionBonus: number;
  visitFrequencyBonus: number;
  unlockCustomerIds?: string[];
}

export interface DifficultyEffect {
  difficultyModifier: number;
  timeModifier: number;
  hintModifier: number;
  clueSpeedModifier: number;
  rareBookBonus: number;
}

export interface DecorationEffects {
  bookDistribution: BookDistributionEffect;
  customerPreference: CustomerPreferenceEffect;
  difficulty: DifficultyEffect;
}

export interface ShelfLayout {
  id: string;
  name: string;
  description: string;
  icon: string;
  layoutType: ShelfLayoutType;
  cost: number;
  unlocked: boolean;
  owned: boolean;
  active: boolean;
  unlockCondition: string;
  unlockReputation?: number;
  effects: DecorationEffects;
}

export interface DecorationTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  style: DecorationStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  cost: number;
  unlocked: boolean;
  owned: boolean;
  active: boolean;
  unlockCondition: string;
  unlockReputation?: number;
  effects: DecorationEffects;
}

export interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  furnitureType: FurnitureType;
  rarity: DecorationRarity;
  cost: number;
  unlocked: boolean;
  owned: boolean;
  placed: boolean;
  position?: number;
  unlockCondition: string;
  unlockReputation?: number;
  effects: DecorationEffects;
}

export interface DecorationState {
  coins: number;
  reputation: number;
  storeLevel: number;
  activeShelfLayoutId: string | null;
  activeThemeId: string | null;
  placedFurnitureIds: string[];
  ownedLayouts: Record<string, ShelfLayout>;
  ownedThemes: Record<string, DecorationTheme>;
  ownedFurniture: Record<string, FurnitureItem>;
  activeEffects: DecorationEffects;
}

export type DecorationTab = 'layout' | 'theme' | 'furniture' | 'preview';

export interface CombinedDecorationEffects {
  totalEffects: DecorationEffects;
  layoutContribution: ShelfLayout | null;
  themeContribution: DecorationTheme | null;
  furnitureContributions: FurnitureItem[];
}
