import type { WorkshopProgress, RepairStage, WorkshopStats } from '../types/workshop';
import { DAMAGED_BOOKS, WORKSHOP_LEVEL_EXP, getWorkshopLevelExp } from '../data/workshop';

const WORKSHOP_PROGRESS_KEY = 'old_bookstore_workshop_progress';

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

const defaultProgress: WorkshopProgress = {
  repairedBookIds: [],
  inProgressBookIds: [],
  materials: {
    mat_glue: 10,
    mat_paper: 15,
    mat_thread: 8,
    mat_brush: 3,
    mat_bookmark: 2,
    mat_ink: 2,
    mat_seal: 0,
    mat_cover: 0,
  },
  totalRepaired: 0,
  perfectRepairs: 0,
  currentWorkbenchBookId: null,
  lastRepairTime: 0,
  workshopLevel: 1,
  workshopExp: 0,
  unlockedBookIds: ['damaged_001', 'damaged_002', 'damaged_003', 'damaged_004'],
};

export const getWorkshopProgress = (): WorkshopProgress => {
  return _readJSON<WorkshopProgress>(WORKSHOP_PROGRESS_KEY, defaultProgress);
};

export const saveWorkshopProgress = (progress: WorkshopProgress): void => {
  _writeJSON(WORKSHOP_PROGRESS_KEY, progress);
};

export const getWorkshopStats = (): WorkshopStats => {
  const progress = getWorkshopProgress();
  const totalDamaged = DAMAGED_BOOKS.length;
  const repaired = progress.repairedBookIds.length;
  const inProgress = progress.inProgressBookIds.length;
  
  const totalMaterials = Object.values(progress.materials).reduce((sum, count) => sum + count, 0);
  
  const nextLevelExp = getWorkshopLevelExp(progress.workshopLevel);
  const currentLevelExp = getWorkshopLevelExp(progress.workshopLevel - 1);
  const expInCurrentLevel = progress.workshopExp - currentLevelExp;
  const expNeeded = nextLevelExp - currentLevelExp;
  
  const perfectRate = progress.totalRepaired > 0 
    ? Math.round((progress.perfectRepairs / progress.totalRepaired) * 100) 
    : 0;
  
  const unlockedRare = DAMAGED_BOOKS.filter(book => 
    progress.repairedBookIds.includes(book.id) && 
    (book.rarity === 'epic' || book.rarity === 'legendary')
  ).length;
  
  return {
    totalDamagedBooks: totalDamaged,
    repairedBooks: repaired,
    inProgress,
    totalMaterials,
    workshopLevel: progress.workshopLevel,
    workshopExp: expInCurrentLevel,
    nextLevelExp: expNeeded,
    perfectRepairRate: perfectRate,
    unlockedRareBooks: unlockedRare,
  };
};

export const startRepair = (bookId: string): boolean => {
  const progress = getWorkshopProgress();
  const book = DAMAGED_BOOKS.find(b => b.id === bookId);
  
  if (!book) return false;
  if (progress.repairedBookIds.includes(bookId)) return false;
  if (progress.inProgressBookIds.includes(bookId)) return false;
  if (!progress.unlockedBookIds.includes(bookId)) return false;
  
  for (const mat of book.requiredMaterials) {
    if ((progress.materials[mat.type] || 0) < mat.amount) {
      return false;
    }
  }
  
  for (const mat of book.requiredMaterials) {
    progress.materials[mat.type] -= mat.amount;
  }
  
  progress.inProgressBookIds.push(bookId);
  progress.currentWorkbenchBookId = bookId;
  
  saveWorkshopProgress(progress);
  return true;
};

export const completeRepairStage = (bookId: string, stage: RepairStage, isPerfect: boolean = false): boolean => {
  const progress = getWorkshopProgress();
  const book = DAMAGED_BOOKS.find(b => b.id === bookId);
  
  if (!book) return false;
  if (!progress.inProgressBookIds.includes(bookId)) return false;
  
  const stageIndex = book.repairStages.indexOf(stage);
  if (stageIndex === -1) return false;
  
  if (stage === 'archiving') {
    progress.inProgressBookIds = progress.inProgressBookIds.filter(id => id !== bookId);
    progress.repairedBookIds.push(bookId);
    progress.totalRepaired += 1;
    progress.lastRepairTime = Date.now();
    
    if (isPerfect) {
      progress.perfectRepairs += 1;
    }
    
    const baseExp = book.estimatedTime;
    const rarityBonus = book.rarity === 'legendary' ? 3 : book.rarity === 'epic' ? 2 : book.rarity === 'rare' ? 1.5 : 1;
    const perfectBonus = isPerfect ? 1.5 : 1;
    const expGain = Math.round(baseExp * rarityBonus * perfectBonus);
    
    progress.workshopExp += expGain;
    
    let newLevel = progress.workshopLevel;
    while (newLevel < WORKSHOP_LEVEL_EXP.length && 
           progress.workshopExp >= getWorkshopLevelExp(newLevel)) {
      newLevel += 1;
    }
    
    if (newLevel > progress.workshopLevel) {
      progress.workshopLevel = newLevel;
      const levelBonus = newLevel * 5;
      progress.materials['mat_glue'] = (progress.materials['mat_glue'] || 0) + levelBonus;
      progress.materials['mat_paper'] = (progress.materials['mat_paper'] || 0) + levelBonus;
      progress.materials['mat_thread'] = (progress.materials['mat_thread'] || 0) + levelBonus;
    }
    
    unlockNextBooks(progress);
  }
  
  saveWorkshopProgress(progress);
  return true;
};

const unlockNextBooks = (progress: WorkshopProgress): void => {
  const repairedCount = progress.repairedBookIds.length;
  
  DAMAGED_BOOKS.forEach(book => {
    if (!progress.unlockedBookIds.includes(book.id)) {
      const unlockThreshold = book.repairDifficulty === 'easy' ? 2 : 
                              book.repairDifficulty === 'medium' ? 4 : 6;
      
      if (repairedCount >= unlockThreshold) {
        progress.unlockedBookIds.push(book.id);
      }
    }
  });
};

export const addMaterial = (materialId: string, amount: number): void => {
  const progress = getWorkshopProgress();
  progress.materials[materialId] = (progress.materials[materialId] || 0) + amount;
  saveWorkshopProgress(progress);
};

export const useMaterial = (materialId: string, amount: number): boolean => {
  const progress = getWorkshopProgress();
  if ((progress.materials[materialId] || 0) < amount) return false;
  progress.materials[materialId] -= amount;
  saveWorkshopProgress(progress);
  return true;
};

export const getMaterialCount = (materialId: string): number => {
  const progress = getWorkshopProgress();
  return progress.materials[materialId] || 0;
};

export const getCurrentWorkbenchBook = (): string | null => {
  const progress = getWorkshopProgress();
  return progress.currentWorkbenchBookId;
};

export const setCurrentWorkbenchBook = (bookId: string | null): void => {
  const progress = getWorkshopProgress();
  progress.currentWorkbenchBookId = bookId;
  saveWorkshopProgress(progress);
};

export const isBookRepaired = (bookId: string): boolean => {
  const progress = getWorkshopProgress();
  return progress.repairedBookIds.includes(bookId);
};

export const isBookInProgress = (bookId: string): boolean => {
  const progress = getWorkshopProgress();
  return progress.inProgressBookIds.includes(bookId);
};

export const isBookUnlocked = (bookId: string): boolean => {
  const progress = getWorkshopProgress();
  return progress.unlockedBookIds.includes(bookId);
};

export const getRepairedBookIds = (): string[] => {
  const progress = getWorkshopProgress();
  return progress.repairedBookIds;
};

export const getInProgressBookIds = (): string[] => {
  const progress = getWorkshopProgress();
  return progress.inProgressBookIds;
};

export const getUnlockedBookIds = (): string[] => {
  const progress = getWorkshopProgress();
  return progress.unlockedBookIds;
};

export const recordWorkshopVisit = (): void => {
  const progress = getWorkshopProgress();
  saveWorkshopProgress(progress);
};

export const getWorkshopLevel = (): number => {
  const progress = getWorkshopProgress();
  return progress.workshopLevel;
};

export const getWorkshopExp = (): number => {
  const progress = getWorkshopProgress();
  return progress.workshopExp;
};

export const getAllMaterials = (): Record<string, number> => {
  const progress = getWorkshopProgress();
  return progress.materials;
};

export const DAMAGED_TO_REWARD: Record<string, string> = {
  damaged_001: 'reward_001',
  damaged_002: 'reward_002',
  damaged_003: 'reward_003',
  damaged_004: 'reward_004',
  damaged_005: 'reward_005',
  damaged_006: 'reward_006',
  damaged_007: 'reward_007',
  damaged_008: 'reward_008',
};

export const getUnlockedWorkshopRewardIds = (): Set<string> => {
  const repaired = new Set(getWorkshopProgress().repairedBookIds);
  const result = new Set<string>();
  for (const [damagedId, rewardId] of Object.entries(DAMAGED_TO_REWARD)) {
    if (repaired.has(damagedId)) result.add(rewardId);
  }
  return result;
};
