import { createSignal, createMemo } from 'solid-js';
import type {
  AccountArchive,
  SaveSlot,
  PlayerPreferences,
  GameRecord,
  ChallengeRecord,
} from '../types/account';
import {
  getSaveSlots,
  getCurrentArchive,
  saveArchive,
  loadSaveSlot,
  createNewSaveSlot,
  updateSaveSlotPreview,
  getActiveSlotId,
  saveSaveSlots,
  deleteArchive,
  validateNickname,
  migrateFromLegacyStorage,
  hasExistingData,
  syncArchiveWithLegacyData,
  updatePlayerNickname as updateNicknameInArchive,
  updatePlayerTitle as updateTitleInArchive,
  updatePlayerAvatar as updateAvatarInArchive,
  updatePlayerPreferences as updatePrefsInArchive,
  updatePlayerStatsFromGame,
  addGameRecord as addRecordToArchive,
  updateChallengeRecord as updateChallengeInArchive,
  updateUnlockedTitles,
  updatePlayTime,
  exportArchive as exportArch,
  importArchive as importArch,
  getCollectionStats,
  getAchievementStats,
  getTitleStats,
  MAX_SAVE_SLOTS,
} from '../utils/accountStorage';
import { getTitleById } from '../data/titles';
import { gameState } from './gameStore';
import type { DifficultyLevel, GameMode } from '../types/game';

const [activeSlotId, setActiveSlotIdSignal] = createSignal<number | null>(getActiveSlotId());
const [saveSlots, setSaveSlots] = createSignal<SaveSlot[]>(getSaveSlots());
const [currentArchive, setCurrentArchive] = createSignal<AccountArchive | null>(getCurrentArchive());
const [isLoading, setIsLoading] = createSignal(false);
const [isSaving, setIsSaving] = createSignal(false);
const [lastError, setLastError] = createSignal<string | null>(null);
const [showAccountModal, setShowAccountModal] = createSignal(false);
const [newTitleUnlocked, setNewTitleUnlocked] = createSignal<string | null>(null);
const [showNicknameModal, setShowNicknameModal] = createSignal(false);

let playTimeInterval: number | null = null;

const hasActiveArchive = createMemo(() => currentArchive() !== null);
const activeSlot = createMemo(() => {
  const id = activeSlotId();
  if (id === null) return null;
  return saveSlots().find(s => s.slotId === id) || null;
});
const currentNickname = createMemo(() => currentArchive()?.profile.nickname || '未登录');
const currentAvatar = createMemo(() => currentArchive()?.profile.avatar || '👤');
const currentTitle = createMemo(() => {
  const archive = currentArchive();
  if (!archive || !archive.profile.currentTitleId) return null;
  return getTitleById(archive.profile.currentTitleId) || null;
});
const currentPreferences = createMemo(() => currentArchive()?.profile.preferences || null);
const playerStats = createMemo(() => currentArchive()?.stats || null);
const unlockedTitles = createMemo(() => currentArchive()?.unlockedTitles || []);
const unlockedAchievements = createMemo(() => currentArchive()?.unlockedAchievements || []);
const gameHistory = createMemo(() => currentArchive()?.gameHistory || []);
const challengeHistory = createMemo(() => currentArchive()?.challengeHistory || {});

const collectionStats = createMemo(() => {
  const archive = currentArchive();
  if (!archive) return null;
  return getCollectionStats(archive);
});

const achievementStats = createMemo(() => {
  const archive = currentArchive();
  if (!archive) return null;
  return getAchievementStats(archive);
});

const titleStats = createMemo(() => {
  const archive = currentArchive();
  if (!archive) return null;
  return getTitleStats(archive);
});

const totalPlayTimeFormatted = createMemo(() => {
  const archive = currentArchive();
  if (!archive) return '0分钟';
  const seconds = archive.profile.totalPlayTime;
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${minutes}分钟`;
});

const initializeAccount = async (): Promise<boolean> => {
  setIsLoading(true);
  setLastError(null);

  try {
    const activeId = getActiveSlotId();
    if (activeId !== null) {
      const archive = loadSaveSlot(activeId);
      if (archive) {
        const synced = syncArchiveWithLegacyData(archive);
        saveArchive(synced);
        setCurrentArchive(synced);
        setSaveSlots(getSaveSlots());
        setActiveSlotIdSignal(activeId);
        startPlayTimeTracking();
        return true;
      }
    }

    if (hasExistingData()) {
      setShowNicknameModal(true);
    }
  } catch (e) {
    setLastError(`初始化失败: ${e}`);
  } finally {
    setIsLoading(false);
  }

  return false;
};

const createNewAccount = (nickname: string, slotId?: number): boolean => {
  setIsLoading(true);
  setLastError(null);

  try {
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setLastError(validation.message);
      setIsLoading(false);
      return false;
    }

    const result = createNewSaveSlot(nickname.trim(), slotId);
    if (!result) {
      setLastError('创建存档失败，槽位已满');
      setIsLoading(false);
      return false;
    }

    const loaded = loadSaveSlot(result.slot.slotId);
    if (loaded) {
      setCurrentArchive(loaded);
      setSaveSlots(getSaveSlots());
      setActiveSlotIdSignal(result.slot.slotId);
      setShowNicknameModal(false);
      startPlayTimeTracking();
      setIsLoading(false);
      return true;
    }
  } catch (e) {
    setLastError(`创建账号失败: ${e}`);
  }

  setIsLoading(false);
  return false;
};

const migrateExistingData = (nickname: string): boolean => {
  setIsLoading(true);
  setLastError(null);

  try {
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setLastError(validation.message);
      setIsLoading(false);
      return false;
    }

    const result = migrateFromLegacyStorage(nickname.trim());
    if (!result.success) {
      setLastError(result.errors[0] || '迁移失败');
      setIsLoading(false);
      return false;
    }

    const activeId = getActiveSlotId();
    if (activeId !== null) {
      const archive = loadSaveSlot(activeId);
      if (archive) {
        setCurrentArchive(archive);
        setSaveSlots(getSaveSlots());
        setActiveSlotIdSignal(activeId);
        setShowNicknameModal(false);
        startPlayTimeTracking();
        setIsLoading(false);
        return true;
      }
    }
  } catch (e) {
    setLastError(`迁移失败: ${e}`);
  }

  setIsLoading(false);
  return false;
};

const loadAccount = (slotId: number): boolean => {
  setIsLoading(true);
  setLastError(null);

  try {
    const archive = loadSaveSlot(slotId);
    if (!archive) {
      setLastError('加载存档失败');
      setIsLoading(false);
      return false;
    }

    const synced = syncArchiveWithLegacyData(archive);
    saveArchive(synced);

    setCurrentArchive(synced);
    setSaveSlots(getSaveSlots());
    setActiveSlotIdSignal(slotId);
    startPlayTimeTracking();
    setIsLoading(false);
    return true;
  } catch (e) {
    setLastError(`加载存档失败: ${e}`);
  }

  setIsLoading(false);
  return false;
};

const saveCurrentArchive = (): boolean => {
  const archive = currentArchive();
  const slotId = activeSlotId();

  if (!archive || slotId === null) {
    setLastError('没有活动的存档');
    return false;
  }

  setIsSaving(true);

  try {
    const updated = updateUnlockedTitles(archive);
    
    const newTitles = updated.unlockedTitles.filter(id => !archive.unlockedTitles.includes(id));
    if (newTitles.length > 0) {
      const title = getTitleById(newTitles[0]);
      if (title) {
        setNewTitleUnlocked(title.title);
        setTimeout(() => setNewTitleUnlocked(null), 4000);
      }
    }

    saveArchive(updated);
    updateSaveSlotPreview(slotId, updated);
    setCurrentArchive(updated);
    setSaveSlots(getSaveSlots());
    setIsSaving(false);
    return true;
  } catch (e) {
    setLastError(`保存存档失败: ${e}`);
  }

  setIsSaving(false);
  return false;
};

const updatePlayerNickname = (nickname: string): boolean => {
  const archive = currentArchive();
  if (!archive) return false;

  const updated = updateNicknameInArchive(archive, nickname);
  if (!updated) {
    setLastError('昵称无效');
    return false;
  }

  setCurrentArchive(updated);
  saveArchive(updated);
  
  const slotId = activeSlotId();
  if (slotId !== null) {
    updateSaveSlotPreview(slotId, updated);
    setSaveSlots(getSaveSlots());
  }

  return true;
};

const updatePlayerTitle = (titleId: string | null): boolean => {
  const archive = currentArchive();
  if (!archive) return false;

  const updated = updateTitleInArchive(archive, titleId);
  setCurrentArchive(updated);
  saveArchive(updated);
  return true;
};

const updatePlayerAvatar = (avatar: string): boolean => {
  const archive = currentArchive();
  if (!archive) return false;

  const updated = updateAvatarInArchive(archive, avatar);
  setCurrentArchive(updated);
  saveArchive(updated);
  return true;
};

const updatePlayerPreferences = (preferences: Partial<PlayerPreferences>): boolean => {
  const archive = currentArchive();
  if (!archive) return false;

  const updated = updatePrefsInArchive(archive, preferences);
  setCurrentArchive(updated);
  saveArchive(updated);
  return true;
};

const recordGameComplete = (
  score: number,
  booksFound: number,
  timeUsed: number,
  hintsUsed: number,
  difficulty: DifficultyLevel,
  gameMode: GameMode,
  isWin: boolean,
  streak: number,
  isPersonalBest: boolean = false,
  rating?: string,
  replayId?: string
): void => {
  const archive = currentArchive();
  if (!archive) return;

  const record: Omit<GameRecord, 'id'> = {
    timestamp: Date.now(),
    score,
    booksFound,
    timeUsed,
    hintsUsed,
    difficulty,
    gameMode,
    isWin,
    streak,
    isPersonalBest,
    rating,
    replayId,
  };

  let updated = addRecordToArchive(archive, record);
  updated = updatePlayerStatsFromGame(updated, record, booksFound);
  updated = updateUnlockedTitles(updated);

  const newTitles = updated.unlockedTitles.filter(id => !archive.unlockedTitles.includes(id));
  if (newTitles.length > 0) {
    const title = getTitleById(newTitles[0]);
    if (title) {
      setNewTitleUnlocked(title.title);
      setTimeout(() => setNewTitleUnlocked(null), 4000);
    }
  }

  setCurrentArchive(updated);
  saveCurrentArchive();
};

const recordChallengeComplete = (
  type: ChallengeRecord['type'],
  targetId: string,
  targetName: string,
  score: number,
  completed: boolean,
  rewards?: ChallengeRecord['rewards']
): void => {
  const archive = currentArchive();
  if (!archive) return;

  const updated = updateChallengeInArchive(archive, type, targetId, targetName, score, completed, rewards);
  setCurrentArchive(updated);
  saveArchive(updated);
};

const deleteSaveSlot = (slotId: number): boolean => {
  const slot = saveSlots().find(s => s.slotId === slotId);
  if (!slot) return false;

  if (slot.isAutoSave && saveSlots().filter(s => s.isAutoSave).length <= 1) {
    setLastError('至少保留一个自动存档槽位');
    return false;
  }

  deleteArchive(slot.archiveId);
  
  const remainingSlots = saveSlots().filter(s => s.slotId !== slotId);
  saveSaveSlots(remainingSlots);
  setSaveSlots(remainingSlots);

  if (activeSlotId() === slotId) {
    setActiveSlotIdSignal(null);
    setCurrentArchive(null);
    stopPlayTimeTracking();
  }

  return true;
};

const renameSaveSlot = (slotId: number, newName: string): boolean => {
  const slots = saveSlots();
  const slotIndex = slots.findIndex(s => s.slotId === slotId);
  if (slotIndex < 0) return false;

  const trimmed = newName.trim();
  if (trimmed.length === 0 || trimmed.length > 20) return false;

  slots[slotIndex].slotName = trimmed;
  slots[slotIndex].updatedAt = Date.now();
  saveSaveSlots(slots);
  setSaveSlots([...slots]);
  return true;
};

const exportCurrentArchive = (): string | null => {
  const archive = currentArchive();
  if (!archive) return null;
  return exportArch(archive);
};

const importArchive = (jsonString: string, slotId: number): boolean => {
  const result = importArch(jsonString, slotId);
  if (!result.success) {
    setLastError(result.message);
    return false;
  }

  setSaveSlots(getSaveSlots());
  return true;
};

const startPlayTimeTracking = (): void => {
  stopPlayTimeTracking();
  playTimeInterval = window.setInterval(() => {
    const archive = currentArchive();
    if (archive && gameState().state === 'playing') {
      const updated = updatePlayTime(archive, 1);
      setCurrentArchive(updated);
    }
  }, 1000);
};

const stopPlayTimeTracking = (): void => {
  if (playTimeInterval) {
    clearInterval(playTimeInterval);
    playTimeInterval = null;
  }
};

const openAccountModal = () => { setShowAccountModal(true); };
const closeAccountModal = () => { setShowAccountModal(false); };
const openNicknameModal = () => { setShowNicknameModal(true); };
const closeNicknameModal = () => { setShowNicknameModal(false); };

const getAccountInfo = () => ({
  hasActiveArchive: hasActiveArchive(),
  nickname: currentNickname(),
  avatar: currentAvatar(),
  title: currentTitle(),
  stats: playerStats(),
  preferences: currentPreferences(),
  unlockedTitles: unlockedTitles(),
  unlockedAchievements: unlockedAchievements(),
  collectionStats: collectionStats(),
  achievementStats: achievementStats(),
  titleStats: titleStats(),
  totalPlayTime: totalPlayTimeFormatted(),
  gameHistory: gameHistory(),
  challengeHistory: challengeHistory(),
});

const getAccountState = () => ({
  isLoading: isLoading(),
  isSaving: isSaving(),
  lastError: lastError(),
  showAccountModal: showAccountModal(),
  showNicknameModal: showNicknameModal(),
  newTitleUnlocked: newTitleUnlocked(),
  activeSlotId: activeSlotId(),
  saveSlots: saveSlots(),
  maxSlots: MAX_SAVE_SLOTS,
});

initializeAccount();

export {
  activeSlotId,
  saveSlots,
  currentArchive,
  isLoading,
  isSaving,
  lastError,
  showAccountModal,
  showNicknameModal,
  newTitleUnlocked,
  hasActiveArchive,
  activeSlot,
  currentNickname,
  currentAvatar,
  currentTitle,
  currentPreferences,
  playerStats,
  unlockedTitles,
  unlockedAchievements,
  gameHistory,
  challengeHistory,
  collectionStats,
  achievementStats,
  titleStats,
  totalPlayTimeFormatted,
  initializeAccount,
  createNewAccount,
  migrateExistingData,
  loadAccount,
  saveCurrentArchive,
  updatePlayerNickname,
  updatePlayerTitle,
  updatePlayerAvatar,
  updatePlayerPreferences,
  recordGameComplete,
  recordChallengeComplete,
  deleteSaveSlot,
  renameSaveSlot,
  exportCurrentArchive,
  importArchive,
  openAccountModal,
  closeAccountModal,
  openNicknameModal,
  closeNicknameModal,
  getAccountInfo,
  getAccountState,
  validateNickname,
};
