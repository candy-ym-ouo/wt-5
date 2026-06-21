import { createSignal, createMemo } from 'solid-js';
import type { WorkshopState, WorkshopTab, RepairStage, PagePuzzlePiece, LabelItem } from '../types/workshop';
import { DAMAGED_BOOKS, REPAIR_MATERIALS } from '../data/workshop';
import {
  getWorkshopProgress,
  getWorkshopStats,
  startRepair,
  completeRepairStage,
  getCurrentWorkbenchBook,
  setCurrentWorkbenchBook,
  isBookRepaired,
  isBookInProgress,
  isBookUnlocked,
  recordWorkshopVisit,
  getAllMaterials,
} from '../utils/workshopStorage';
import { RARITY_CONFIG } from '../data/themes';

const initialState: WorkshopState = {
  activeTab: 'workbench',
  selectedBookId: null,
  showDetail: false,
  currentStage: null,
  miniGameActive: false,
  miniGameResult: null,
  filter: {},
  sortBy: 'damage',
};

export const [workshopState, setWorkshopState] = createSignal<WorkshopState>(initialState);
export const [showWorkshop, setShowWorkshop] = createSignal(false);
export const [showRewardPopup, setShowRewardPopup] = createSignal<string | null>(null);
export const [showLevelUpPopup, setShowLevelUpPopup] = createSignal<number | null>(null);
export const [puzzlePieces, setPuzzlePieces] = createSignal<PagePuzzlePiece[]>([]);
export const [labelItems, setLabelItems] = createSignal<LabelItem[]>([]);

export const openWorkshop = (tab?: WorkshopTab, bookId?: string): void => {
  recordWorkshopVisit();
  const currentBook = getCurrentWorkbenchBook();
  const newState: WorkshopState = {
    ...initialState,
    activeTab: tab || 'workbench',
    selectedBookId: bookId || currentBook,
    showDetail: !!bookId,
    currentStage: null,
  };
  setWorkshopState(newState);
  setShowWorkshop(true);
};

export const closeWorkshop = (): void => {
  setShowWorkshop(false);
};

export const setActiveTab = (tab: WorkshopTab): void => {
  setWorkshopState(prev => ({
    ...prev,
    activeTab: tab,
    showDetail: false,
    selectedBookId: null,
    currentStage: null,
    miniGameActive: false,
    miniGameResult: null,
  }));
};

export const selectBook = (bookId: string): void => {
  setWorkshopState(prev => ({
    ...prev,
    selectedBookId: bookId,
    showDetail: true,
    currentStage: null,
    miniGameActive: false,
    miniGameResult: null,
  }));
};

export const closeDetail = (): void => {
  setWorkshopState(prev => ({
    ...prev,
    showDetail: false,
    selectedBookId: null,
    currentStage: null,
    miniGameActive: false,
    miniGameResult: null,
  }));
};

export const setFilter = (filter: Partial<WorkshopState['filter']>): void => {
  setWorkshopState(prev => ({
    ...prev,
    filter: { ...prev.filter, ...filter },
  }));
};

export const setSortBy = (sortBy: WorkshopState['sortBy']): void => {
  setWorkshopState(prev => ({
    ...prev,
    sortBy,
  }));
};

export const startBookRepair = (bookId: string): boolean => {
  const success = startRepair(bookId);
  if (success) {
    setCurrentWorkbenchBook(bookId);
    setWorkshopState(prev => ({
      ...prev,
      selectedBookId: bookId,
      showDetail: true,
      currentStage: 'intake',
    }));
  }
  return success;
};

export const enterRepairStage = (stage: RepairStage): void => {
  setWorkshopState(prev => ({
    ...prev,
    currentStage: stage,
    miniGameActive: true,
    miniGameResult: null,
  }));
  
  if (stage === 'clue_patching') {
    generatePuzzlePieces();
  } else if (stage === 'labeling') {
    generateLabelItems();
  }
};

const generatePuzzlePieces = (): void => {
  const bookId = workshopState().selectedBookId;
  const book = DAMAGED_BOOKS.find(b => b.id === bookId);
  if (!book) return;
  
  const clues = book.descriptionClues;
  const pieces: PagePuzzlePiece[] = [];
  
  clues.forEach((clue, idx) => {
    const words = clue.split('');
    words.forEach((char, charIdx) => {
      pieces.push({
        id: `piece_${idx}_${charIdx}`,
        content: char,
        correctPosition: idx * 20 + charIdx,
        currentPosition: Math.floor(Math.random() * 100),
        isPlaced: false,
      });
    });
  });
  
  setPuzzlePieces(pieces.sort(() => Math.random() - 0.5));
};

const generateLabelItems = (): void => {
  const bookId = workshopState().selectedBookId;
  const book = DAMAGED_BOOKS.find(b => b.id === bookId);
  if (!book) return;
  
  const items: LabelItem[] = [];
  
  items.push({
    id: 'label_genre_correct',
    text: book.genre,
    category: 'genre',
    isCorrect: true,
    isSelected: false,
  });
  
  const wrongGenres = ['文学', '历史', '哲学', '科普', '技术', '古典', '科幻'].filter(g => g !== book.genre);
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(Math.random() * wrongGenres.length);
    items.push({
      id: `label_genre_wrong_${i}`,
      text: wrongGenres[idx],
      category: 'genre',
      isCorrect: false,
      isSelected: false,
    });
    wrongGenres.splice(idx, 1);
  }
  
  book.themes.forEach((theme, idx) => {
    items.push({
      id: `label_theme_correct_${idx}`,
      text: theme,
      category: 'theme',
      isCorrect: true,
      isSelected: false,
    });
  });
  
  const wrongThemes = ['文学经典', '历史长河', '哲学智慧', '科学探索', '技术匠心', '冒险与探索', '时间与记忆', '中国古典'].filter(t => !book.themes.includes(t));
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(Math.random() * wrongThemes.length);
    items.push({
      id: `label_theme_wrong_${i}`,
      text: wrongThemes[idx],
      category: 'theme',
      isCorrect: false,
      isSelected: false,
    });
    wrongThemes.splice(idx, 1);
  }
  
  setLabelItems(items.sort(() => Math.random() - 0.5));
};

export const toggleLabelSelection = (labelId: string): void => {
  setLabelItems(prev => prev.map(item => 
    item.id === labelId ? { ...item, isSelected: !item.isSelected } : item
  ));
};

export const completeCurrentStage = (isPerfect: boolean = false): boolean => {
  const state = workshopState();
  const bookId = state.selectedBookId;
  const stage = state.currentStage;
  
  if (!bookId || !stage) return false;
  
  const success = completeRepairStage(bookId, stage, isPerfect);
  
  if (success) {
    const book = DAMAGED_BOOKS.find(b => b.id === bookId);
    if (book) {
      const currentIndex = book.repairStages.indexOf(stage);
      if (currentIndex < book.repairStages.length - 1) {
        setWorkshopState(prev => ({
          ...prev,
          miniGameActive: false,
          miniGameResult: isPerfect ? 'success' : 'success',
        }));
      } else {
        setWorkshopState(prev => ({
          ...prev,
          miniGameActive: false,
          miniGameResult: 'success',
          currentStage: 'completed',
        }));
        
        const rarityConfig = RARITY_CONFIG[book.rarity];
        setShowRewardPopup(`🎉 修复完成！《${book.title}》已收入珍藏！${rarityConfig.icon}${rarityConfig.name}稀有度藏书已加入寻书内容池，下一局游戏可能遇到！`);
        setTimeout(() => setShowRewardPopup(null), 4000);
        
        const stats = getWorkshopStats();
        const progress = getWorkshopProgress();
        if (progress.workshopLevel > stats.workshopLevel) {
          setShowLevelUpPopup(progress.workshopLevel);
          setTimeout(() => setShowLevelUpPopup(null), 3000);
        }
      }
    }
  }
  
  return success;
};

export const proceedToNextStage = (): void => {
  const state = workshopState();
  const bookId = state.selectedBookId;
  const currentStage = state.currentStage;
  
  if (!bookId || !currentStage) return;
  
  const book = DAMAGED_BOOKS.find(b => b.id === bookId);
  if (!book) return;
  
  const currentIndex = book.repairStages.indexOf(currentStage);
  if (currentIndex < book.repairStages.length - 1) {
    const nextStage = book.repairStages[currentIndex + 1];
    setWorkshopState(prev => ({
      ...prev,
      currentStage: nextStage,
      miniGameActive: false,
      miniGameResult: null,
    }));
  }
};

export const exitMiniGame = (): void => {
  setWorkshopState(prev => ({
    ...prev,
    miniGameActive: false,
    miniGameResult: null,
  }));
};

export const getWorkshopStateInfo = createMemo(() => {
  const state = workshopState();
  const stats = getWorkshopStats();
  const progress = getWorkshopProgress();
  const materials = getAllMaterials();
  
  return {
    ...state,
    stats,
    progress,
    materials,
    isVisible: showWorkshop(),
    rewardPopup: showRewardPopup(),
    levelUpPopup: showLevelUpPopup(),
  };
});

export const getFilteredBooks = createMemo(() => {
  const state = workshopState();
  const filter = state.filter;
  
  let filtered = DAMAGED_BOOKS.map(book => ({
    book,
    unlocked: isBookUnlocked(book.id),
    inProgress: isBookInProgress(book.id),
    repaired: isBookRepaired(book.id),
  }));
  
  if (filter.damageLevel) {
    filtered = filtered.filter(item => item.book.damageLevel === filter.damageLevel);
  }
  
  if (filter.genre) {
    filtered = filtered.filter(item => item.book.genre === filter.genre);
  }
  
  if (filter.rarity) {
    filtered = filtered.filter(item => item.book.rarity === filter.rarity);
  }
  
  if (filter.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.book.title.toLowerCase().includes(search) ||
      item.book.author.toLowerCase().includes(search) ||
      item.book.damageDescription.toLowerCase().includes(search)
    );
  }
  
  if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.book.title.localeCompare(b.book.title));
  } else if (state.sortBy === 'rarity') {
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    filtered.sort((a, b) => rarityOrder.indexOf(a.book.rarity) - rarityOrder.indexOf(b.book.rarity));
  } else if (state.sortBy === 'damage') {
    const damageOrder = ['critical', 'severe', 'moderate', 'light'];
    filtered.sort((a, b) => damageOrder.indexOf(a.book.damageLevel) - damageOrder.indexOf(b.book.damageLevel));
  } else if (state.sortBy === 'progress') {
    filtered.sort((a, b) => {
      if (a.repaired && !b.repaired) return -1;
      if (!a.repaired && b.repaired) return 1;
      if (a.inProgress && !b.inProgress) return -1;
      if (!a.inProgress && b.inProgress) return 1;
      return 0;
    });
  }
  
  return filtered;
});

export const getMaterialList = createMemo(() => {
  const materials = getAllMaterials();
  return REPAIR_MATERIALS.map(mat => ({
    material: mat,
    count: materials[mat.id] || 0,
  }));
});

export const getRepairedBooks = createMemo(() => {
  const repairedIds = getWorkshopProgress().repairedBookIds;
  return DAMAGED_BOOKS.filter(book => repairedIds.includes(book.id));
});

export const getInProgressBooks = createMemo(() => {
  const inProgressIds = getWorkshopProgress().inProgressBookIds;
  return DAMAGED_BOOKS.filter(book => inProgressIds.includes(book.id));
});
