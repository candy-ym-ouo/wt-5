export type RepairStage = 'intake' | 'cleaning' | 'page_repair' | 'clue_patching' | 'labeling' | 'archiving' | 'completed';

export type DamageLevel = 'light' | 'moderate' | 'severe' | 'critical';

export type WorkshopTab = 'workbench' | 'collection' | 'achievements' | 'materials';

export interface DamagedBook {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  damageLevel: DamageLevel;
  damageDescription: string;
  repairStages: RepairStage[];
  currentStage: RepairStage;
  requiredMaterials: { type: string; amount: number }[];
  rewardBookId: string;
  backgroundStory: string;
  descriptionClues: string[];
  themes: string[];
  repairDifficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  unlocked: boolean;
}

export interface RepairMaterial {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  value: number;
}

export interface RepairTask {
  bookId: string;
  stage: RepairStage;
  progress: number;
  startTime: number;
  completed: boolean;
}

export interface WorkshopProgress {
  repairedBookIds: string[];
  inProgressBookIds: string[];
  materials: Record<string, number>;
  totalRepaired: number;
  perfectRepairs: number;
  currentWorkbenchBookId: string | null;
  lastRepairTime: number;
  workshopLevel: number;
  workshopExp: number;
  unlockedBookIds: string[];
}

export interface WorkshopState {
  activeTab: WorkshopTab;
  selectedBookId: string | null;
  showDetail: boolean;
  currentStage: RepairStage | null;
  miniGameActive: boolean;
  miniGameResult: 'success' | 'fail' | null;
  filter: {
    damageLevel?: string;
    genre?: string;
    rarity?: string;
    search?: string;
  };
  sortBy: 'damage' | 'rarity' | 'progress' | 'name';
}

export interface WorkshopStats {
  totalDamagedBooks: number;
  repairedBooks: number;
  inProgress: number;
  totalMaterials: number;
  workshopLevel: number;
  workshopExp: number;
  nextLevelExp: number;
  perfectRepairRate: number;
  unlockedRareBooks: number;
}

export interface PagePuzzlePiece {
  id: string;
  content: string;
  correctPosition: number;
  currentPosition: number;
  isPlaced: boolean;
}

export interface LabelItem {
  id: string;
  text: string;
  category: 'genre' | 'theme' | 'era' | 'author';
  isCorrect: boolean;
  isSelected: boolean;
}
