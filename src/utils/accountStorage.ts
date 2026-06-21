import type {
  AccountArchive,
  PlayerProfile,
  SaveSlot,
  GameRecord,
  ChallengeRecord,
  NicknameValidationResult,
  AccountMigrationResult,
  PlayerPreferences,
} from '../types/account';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PLAYER_STATS,
  DEFAULT_ARCHIVE_METADATA,
} from '../types/account';
import {
  getPersonalBest,
  getUnlockedAchievements,
  getAllAchievementProgress,
  getAllCollectionEntries,
  getLeaderboard,
  getGamesPlayed,
  getAllGameReplays,
  LEADERBOARD_KEY,
  ACHIEVEMENTS_KEY,
  ACHIEVEMENTS_PROGRESS_KEY,
  GAME_STATS_KEY,
  PERSONAL_BEST_KEY,
  COLLECTION_KEY,
  GAME_REPLAY_KEY,
} from './storage';
import { checkTitleUnlock, getDefaultTitle, TITLES } from '../data/titles';
import { ACHIEVEMENTS } from '../data/achievements';
import { BOOKS } from '../data/books';

export const ACCOUNT_STORAGE_KEY = 'old_bookstore_accounts';
export const ACTIVE_SLOT_KEY = 'old_bookstore_active_slot';
export const SAVE_SLOTS_KEY = 'old_bookstore_save_slots';
export const ACCOUNT_VERSION = 1;
export const MAX_SAVE_SLOTS = 5;
export const MAX_GAME_HISTORY = 100;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 12;

const RESERVED_NAMES = ['admin', '系统', '管理员', '官方', 'gm', 'GM'];
const INVALID_CHARS = /[<>/\\|&;$%@"()+,]/;

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
    console.error('Failed to write to localStorage:', key);
  }
}

export const validateNickname = (nickname: string): NicknameValidationResult => {
  const trimmed = nickname.trim();

  if (trimmed.length < NICKNAME_MIN_LENGTH) {
    return {
      valid: false,
      message: `昵称至少需要 ${NICKNAME_MIN_LENGTH} 个字符`,
    };
  }

  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return {
      valid: false,
      message: `昵称最多 ${NICKNAME_MAX_LENGTH} 个字符`,
    };
  }

  if (INVALID_CHARS.test(trimmed)) {
    return {
      valid: false,
      message: '昵称包含无效字符，请使用中文、英文或数字',
    };
  }

  if (RESERVED_NAMES.some(name => trimmed.toLowerCase().includes(name.toLowerCase()))) {
    return {
      valid: false,
      message: '该昵称已被保留，请使用其他昵称',
    };
  }

  return {
    valid: true,
    message: '昵称可用',
  };
};

export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createDefaultProfile = (nickname: string): PlayerProfile => {
  const now = Date.now();
  return {
    id: generatePlayerId(),
    nickname,
    avatar: '👤',
    currentTitleId: getDefaultTitle().id,
    createdAt: now,
    lastPlayedAt: now,
    totalPlayTime: 0,
    preferences: { ...DEFAULT_PREFERENCES },
  };
};

export const createNewArchive = (nickname: string): AccountArchive => {
  const now = Date.now();
  return {
    profile: createDefaultProfile(nickname),
    stats: { ...DEFAULT_PLAYER_STATS },
    unlockedTitles: [getDefaultTitle().id],
    unlockedAchievements: [],
    achievementProgress: {},
    collection: {},
    gameHistory: [],
    challengeHistory: {},
    recentReplays: [],
    metadata: {
      ...DEFAULT_ARCHIVE_METADATA,
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const createSaveSlot = (
  slotId: number,
  archive: AccountArchive,
  isAutoSave: boolean = false
): SaveSlot => {
  const now = Date.now();
  return {
    slotId,
    slotName: `存档 ${slotId + 1}`,
    archiveId: archive.profile.id,
    createdAt: now,
    updatedAt: now,
    isActive: false,
    isAutoSave,
    preview: {
      nickname: archive.profile.nickname,
      score: archive.stats.highestScore,
      level: 1,
      booksFound: archive.stats.totalBooksFound,
      playTime: archive.profile.totalPlayTime,
      lastPlayed: archive.profile.lastPlayedAt,
    },
  };
};

export const getSaveSlots = (): SaveSlot[] => {
  return _readJSON<SaveSlot[]>(SAVE_SLOTS_KEY, []);
};

export const saveSaveSlots = (slots: SaveSlot[]): void => {
  _writeJSON(SAVE_SLOTS_KEY, slots);
};

export const getActiveSlotId = (): number | null => {
  try {
    const data = localStorage.getItem(ACTIVE_SLOT_KEY);
    return data ? parseInt(data, 10) : null;
  } catch {
    return null;
  }
};

export const setActiveSlotId = (slotId: number | null): void => {
  if (slotId === null) {
    localStorage.removeItem(ACTIVE_SLOT_KEY);
  } else {
    localStorage.setItem(ACTIVE_SLOT_KEY, String(slotId));
  }
};

export const getArchiveById = (archiveId: string): AccountArchive | null => {
  const allArchives = _readJSON<Record<string, AccountArchive>>(ACCOUNT_STORAGE_KEY, {});
  return allArchives[archiveId] || null;
};

export const saveArchive = (archive: AccountArchive): void => {
  const allArchives = _readJSON<Record<string, AccountArchive>>(ACCOUNT_STORAGE_KEY, {});
  archive.metadata.updatedAt = Date.now();
  allArchives[archive.profile.id] = archive;
  _writeJSON(ACCOUNT_STORAGE_KEY, allArchives);
};

export const deleteArchive = (archiveId: string): boolean => {
  const allArchives = _readJSON<Record<string, AccountArchive>>(ACCOUNT_STORAGE_KEY, {});
  if (allArchives[archiveId]) {
    delete allArchives[archiveId];
    _writeJSON(ACCOUNT_STORAGE_KEY, allArchives);
    return true;
  }
  return false;
};

export const getAllArchives = (): Record<string, AccountArchive> => {
  return _readJSON<Record<string, AccountArchive>>(ACCOUNT_STORAGE_KEY, {});
};

export const getCurrentArchive = (): AccountArchive | null => {
  const activeSlotId = getActiveSlotId();
  if (activeSlotId === null) return null;

  const slots = getSaveSlots();
  const activeSlot = slots.find(s => s.slotId === activeSlotId);
  if (!activeSlot) return null;

  return getArchiveById(activeSlot.archiveId);
};

export const updateSaveSlotPreview = (slotId: number, archive: AccountArchive): void => {
  const slots = getSaveSlots();
  const slotIndex = slots.findIndex(s => s.slotId === slotId);
  if (slotIndex >= 0) {
    slots[slotIndex].preview = {
      nickname: archive.profile.nickname,
      score: archive.stats.highestScore,
      level: 1,
      booksFound: archive.stats.totalBooksFound,
      playTime: archive.profile.totalPlayTime,
      lastPlayed: archive.profile.lastPlayedAt,
    };
    slots[slotIndex].updatedAt = Date.now();
    saveSaveSlots(slots);
  }
};

export const createNewSaveSlot = (
  nickname: string,
  slotId?: number
): { slot: SaveSlot; archive: AccountArchive } | null => {
  const slots = getSaveSlots();
  
  let targetSlotId = slotId;
  if (targetSlotId === undefined) {
    targetSlotId = slots.length;
    if (targetSlotId >= MAX_SAVE_SLOTS) {
      return null;
    }
  }

  if (targetSlotId >= MAX_SAVE_SLOTS) {
    return null;
  }

  const existingSlot = slots.find(s => s.slotId === targetSlotId);
  if (existingSlot) {
    deleteArchive(existingSlot.archiveId);
  }

  const archive = createNewArchive(nickname);
  const slot = createSaveSlot(targetSlotId, archive, targetSlotId === 0);

  const filteredSlots = slots.filter(s => s.slotId !== targetSlotId);
  filteredSlots.push(slot);
  saveSaveSlots(filteredSlots);

  saveArchive(archive);

  return { slot, archive };
};

export const loadSaveSlot = (slotId: number): AccountArchive | null => {
  const slots = getSaveSlots();
  const slot = slots.find(s => s.slotId === slotId);
  if (!slot) return null;

  const archive = getArchiveById(slot.archiveId);
  if (!archive) return null;

  setActiveSlotId(slotId);

  const updatedSlots = slots.map(s => ({
    ...s,
    isActive: s.slotId === slotId,
  }));
  saveSaveSlots(updatedSlots);

  return archive;
};

export const getUnlockedTitles = (archive: AccountArchive): string[] => {
  const stats = {
    longestStreak: archive.stats.longestStreak,
    highestScore: archive.stats.highestScore,
    totalGamesPlayed: archive.stats.totalGamesPlayed,
    totalBooksFound: archive.stats.totalBooksFound,
    collectionCount: Object.keys(archive.collection).length,
    unlockedAchievements: archive.unlockedAchievements,
  };

  const unlocked = new Set<string>(archive.unlockedTitles);
  
  for (const title of TITLES) {
    if (checkTitleUnlock(title, stats)) {
      unlocked.add(title.id);
    }
  }

  return Array.from(unlocked);
};

export const updateUnlockedTitles = (archive: AccountArchive): AccountArchive => {
  const unlockedTitles = getUnlockedTitles(archive);
  const newUnlocks = unlockedTitles.filter(id => !archive.unlockedTitles.includes(id));
  
  if (newUnlocks.length > 0) {
    return {
      ...archive,
      unlockedTitles,
    };
  }
  
  return archive;
};

export const addGameRecord = (
  archive: AccountArchive,
  record: Omit<GameRecord, 'id'>
): AccountArchive => {
  const newRecord: GameRecord = {
    ...record,
    id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const gameHistory = [newRecord, ...archive.gameHistory].slice(0, MAX_GAME_HISTORY);

  return {
    ...archive,
    gameHistory,
  };
};

export const updateChallengeRecord = (
  archive: AccountArchive,
  type: ChallengeRecord['type'],
  targetId: string,
  targetName: string,
  score: number,
  completed: boolean,
  rewards?: ChallengeRecord['rewards']
): AccountArchive => {
  const key = `${type}_${targetId}`;
  const existing = archive.challengeHistory[key];
  const now = Date.now();

  const record: ChallengeRecord = existing
    ? {
        ...existing,
        score,
        bestScore: Math.max(existing.bestScore, score),
        attempts: existing.attempts + 1,
        completed: existing.completed || completed,
        completedAt: completed && !existing.completed ? now : existing.completedAt,
        rewards: rewards || existing.rewards,
      }
    : {
        id: key,
        type,
        targetId,
        targetName,
        completedAt: completed ? now : 0,
        score,
        bestScore: score,
        attempts: 1,
        completed,
        rewards,
      };

  return {
    ...archive,
    challengeHistory: {
      ...archive.challengeHistory,
      [key]: record,
    },
  };
};

export const updatePlayerStatsFromGame = (
  archive: AccountArchive,
  record: Omit<GameRecord, 'id'>,
  booksFound: number
): AccountArchive => {
  const stats = { ...archive.stats };
  const now = Date.now();

  stats.totalGamesPlayed += 1;
  stats.totalBooksFound += booksFound;
  stats.totalScore += record.score;
  stats.averageScore = Math.floor(stats.totalScore / stats.totalGamesPlayed);
  stats.totalHintsUsed += record.hintsUsed;
  stats.totalWrongPicks += Math.max(0, booksFound - record.booksFound);
  
  const totalAttempts = stats.totalBooksFound + stats.totalWrongPicks;
  stats.accuracy = totalAttempts > 0 ? (stats.totalBooksFound / totalAttempts) * 100 : 0;

  if (record.isWin) {
    const totalWins = stats.modeStats[record.gameMode].completed + 1;
    stats.winRate = (totalWins / stats.totalGamesPlayed) * 100;
  }

  if (record.score > stats.highestScore) {
    stats.highestScore = record.score;
    stats.highestScoreDate = now;
  }

  if (record.streak > stats.longestStreak) {
    stats.longestStreak = record.streak;
    stats.longestStreakDate = now;
  }

  if (record.hintsUsed === 0 && booksFound > 0) {
    stats.totalNoHintRuns += 1;
    if (stats.fewestHints < 0 || record.hintsUsed < stats.fewestHints) {
      stats.fewestHints = record.hintsUsed;
      stats.fewestHintsDate = now;
    }
  }

  const diffStats = { ...stats.difficultyStats[record.difficulty] };
  diffStats.gamesPlayed += 1;
  diffStats.booksFound += booksFound;
  if (record.score > diffStats.highestScore) {
    diffStats.highestScore = record.score;
  }
  diffStats.averageScore = Math.floor(
    (diffStats.averageScore * (diffStats.gamesPlayed - 1) + record.score) / diffStats.gamesPlayed
  );
  if (record.isWin) {
    diffStats.winRate = diffStats.gamesPlayed > 0 
      ? (((diffStats.winRate / 100) * (diffStats.gamesPlayed - 1) + 1) / diffStats.gamesPlayed) * 100 
      : 100;
  } else {
    diffStats.winRate = diffStats.gamesPlayed > 0 
      ? (((diffStats.winRate / 100) * (diffStats.gamesPlayed - 1)) / diffStats.gamesPlayed) * 100 
      : 0;
  }
  stats.difficultyStats[record.difficulty] = diffStats;

  const modeStats = { ...stats.modeStats[record.gameMode] };
  modeStats.gamesPlayed += 1;
  modeStats.booksFound += booksFound;
  if (record.score > modeStats.highestScore) {
    modeStats.highestScore = record.score;
  }
  modeStats.averageScore = Math.floor(
    (modeStats.averageScore * (modeStats.gamesPlayed - 1) + record.score) / modeStats.gamesPlayed
  );
  if (record.isWin) {
    modeStats.completed += 1;
  }
  stats.modeStats[record.gameMode] = modeStats;

  return {
    ...archive,
    stats,
    profile: {
      ...archive.profile,
      lastPlayedAt: now,
    },
  };
};

export const updatePlayerPreferences = (
  archive: AccountArchive,
  preferences: Partial<PlayerPreferences>
): AccountArchive => {
  return {
    ...archive,
    profile: {
      ...archive.profile,
      preferences: {
        ...archive.profile.preferences,
        ...preferences,
      },
    },
  };
};

export const updatePlayerNickname = (
  archive: AccountArchive,
  nickname: string
): AccountArchive | null => {
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    return null;
  }

  return {
    ...archive,
    profile: {
      ...archive.profile,
      nickname: nickname.trim(),
    },
  };
};

export const updatePlayerTitle = (
  archive: AccountArchive,
  titleId: string | null
): AccountArchive => {
  if (titleId && !archive.unlockedTitles.includes(titleId)) {
    return archive;
  }

  return {
    ...archive,
    profile: {
      ...archive.profile,
      currentTitleId: titleId,
    },
  };
};

export const updatePlayerAvatar = (
  archive: AccountArchive,
  avatar: string
): AccountArchive => {
  return {
    ...archive,
    profile: {
      ...archive.profile,
      avatar,
    },
  };
};

export const updatePlayTime = (
  archive: AccountArchive,
  seconds: number
): AccountArchive => {
  return {
    ...archive,
    profile: {
      ...archive.profile,
      totalPlayTime: archive.profile.totalPlayTime + seconds,
      lastPlayedAt: Date.now(),
    },
  };
};

export const migrateFromLegacyStorage = (nickname: string): AccountMigrationResult => {
  const result: AccountMigrationResult = {
    success: true,
    migrated: 0,
    errors: [],
  };

  try {
    const personalBest = getPersonalBest();
    const unlockedAchievements = getUnlockedAchievements();
    const achievementProgress = getAllAchievementProgress();
    const collection = getAllCollectionEntries();
    const leaderboard = getLeaderboard();
    const gamesPlayed = getGamesPlayed();
    const replays = getAllGameReplays();

    const archive = createNewArchive(nickname);

    archive.stats = {
      ...archive.stats,
      totalGamesPlayed: gamesPlayed,
      totalBooksFound: personalBest.totalBooksFound,
      highestScore: personalBest.highestScore,
      highestScoreDate: personalBest.highestScoreDate,
      fastestFind: personalBest.fastestFind,
      fastestFindDate: personalBest.fastestFindDate,
      longestStreak: personalBest.longestStreak,
      longestStreakDate: personalBest.longestStreakDate,
      fewestHints: personalBest.fewestHintsCount,
      fewestHintsDate: personalBest.fewestHintsDate,
    };

    archive.unlockedAchievements = unlockedAchievements;
    archive.achievementProgress = achievementProgress;
    archive.collection = collection;

    for (const entry of leaderboard.slice(0, MAX_GAME_HISTORY)) {
      const record: GameRecord = {
        id: `legacy_${entry.id}`,
        timestamp: entry.date,
        score: entry.score,
        booksFound: 1,
        timeUsed: entry.timeUsed || 0,
        hintsUsed: entry.hintsUsed || 0,
        difficulty: entry.difficulty || 'normal',
        gameMode: 'classic',
        isWin: true,
        streak: entry.streak || 0,
        isPersonalBest: entry.score === personalBest.highestScore,
      };
      archive.gameHistory.push(record);
    }

    archive.recentReplays = replays.slice(0, 20).map(r => r.id);

    archive.unlockedTitles = getUnlockedTitles(archive);

    const slots = getSaveSlots();
    let slotId = 0;
    while (slots.some(s => s.slotId === slotId)) {
      slotId++;
    }

    if (slotId < MAX_SAVE_SLOTS) {
      const slot = createSaveSlot(slotId, archive, slotId === 0);
      slots.push(slot);
      saveSaveSlots(slots);
      saveArchive(archive);
      setActiveSlotId(slotId);
      result.migrated = 1;
    } else {
      result.success = false;
      result.errors.push('存档槽位已满，无法迁移');
    }
  } catch (e) {
    result.success = false;
    result.errors.push(`迁移失败: ${e}`);
  }

  return result;
};

export const exportArchive = (archive: AccountArchive): string => {
  const exportData = {
    version: ACCOUNT_VERSION,
    exportedAt: Date.now(),
    archive,
  };
  return JSON.stringify(exportData, null, 2);
};

export const importArchive = (
  jsonString: string,
  slotId: number
): { success: boolean; message: string; archive?: AccountArchive } => {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.archive || !data.archive.profile || !data.archive.stats) {
      return { success: false, message: '无效的存档数据格式' };
    }

    if (data.version !== ACCOUNT_VERSION) {
      return { success: false, message: `存档版本不兼容，需要版本 ${ACCOUNT_VERSION}` };
    }

    const archive = data.archive as AccountArchive;
    archive.profile.id = generatePlayerId();
    archive.metadata.createdAt = Date.now();
    archive.metadata.updatedAt = Date.now();
    archive.metadata.importedFrom = 'external';

    const validation = validateNickname(archive.profile.nickname);
    if (!validation.valid) {
      archive.profile.nickname = '玩家' + Date.now().toString().slice(-4);
    }

    const slots = getSaveSlots();
    const existingSlot = slots.find(s => s.slotId === slotId);
    if (existingSlot) {
      deleteArchive(existingSlot.archiveId);
    }

    const slot = createSaveSlot(slotId, archive, false);
    const filteredSlots = slots.filter(s => s.slotId !== slotId);
    filteredSlots.push(slot);
    saveSaveSlots(filteredSlots);
    saveArchive(archive);

    return {
      success: true,
      message: '存档导入成功',
      archive,
    };
  } catch (e) {
    return { success: false, message: `导入失败: ${e}` };
  }
};

export const hasExistingData = (): boolean => {
  const keys = [
    LEADERBOARD_KEY,
    ACHIEVEMENTS_KEY,
    ACHIEVEMENTS_PROGRESS_KEY,
    GAME_STATS_KEY,
    PERSONAL_BEST_KEY,
    COLLECTION_KEY,
    GAME_REPLAY_KEY,
  ];

  return keys.some(key => localStorage.getItem(key) !== null);
};

export const syncArchiveWithLegacyData = (archive: AccountArchive): AccountArchive => {
  const personalBest = getPersonalBest();
  const unlockedAchievements = getUnlockedAchievements();
  const achievementProgress = getAllAchievementProgress();
  const collection = getAllCollectionEntries();
  const gamesPlayed = getGamesPlayed();

  let updated = { ...archive };

  if (personalBest.highestScore > archive.stats.highestScore) {
    updated.stats.highestScore = personalBest.highestScore;
    updated.stats.highestScoreDate = personalBest.highestScoreDate;
  }

  if (personalBest.fastestFind > 0 && 
      (archive.stats.fastestFind === 0 || personalBest.fastestFind < archive.stats.fastestFind)) {
    updated.stats.fastestFind = personalBest.fastestFind;
    updated.stats.fastestFindDate = personalBest.fastestFindDate;
  }

  if (personalBest.longestStreak > archive.stats.longestStreak) {
    updated.stats.longestStreak = personalBest.longestStreak;
    updated.stats.longestStreakDate = personalBest.longestStreakDate;
  }

  if (gamesPlayed > archive.stats.totalGamesPlayed) {
    updated.stats.totalGamesPlayed = gamesPlayed;
  }

  if (personalBest.totalBooksFound > archive.stats.totalBooksFound) {
    updated.stats.totalBooksFound = personalBest.totalBooksFound;
  }

  updated.unlockedAchievements = Array.from(
    new Set([...archive.unlockedAchievements, ...unlockedAchievements])
  );

  updated.achievementProgress = {
    ...archive.achievementProgress,
    ...achievementProgress,
  };

  updated.collection = {
    ...archive.collection,
    ...collection,
  };

  updated = updateUnlockedTitles(updated);

  return updated;
};

export const getCollectionStats = (archive: AccountArchive) => {
  const collection = archive.collection;
  const bookIds = Object.keys(collection);
  
  const genres = new Set<string>();
  const rarities = new Set<string>();
  let totalTimesFound = 0;
  let totalBestScore = 0;

  for (const id of bookIds) {
    const book = BOOKS.find(b => b.id === id);
    const entry = collection[id];
    
    if (book) {
      genres.add(book.genre);
      rarities.add(book.rarity);
    }
    
    totalTimesFound += entry.totalTimesFound;
    totalBestScore += entry.bestScore;
  }

  return {
    totalCollected: bookIds.length,
    totalBooks: BOOKS.length,
    percentage: (bookIds.length / BOOKS.length) * 100,
    genres: Array.from(genres),
    genreCount: genres.size,
    rarities: Array.from(rarities),
    rarityCount: rarities.size,
    totalTimesFound,
    totalBestScore,
    averageBestScore: bookIds.length > 0 ? Math.floor(totalBestScore / bookIds.length) : 0,
  };
};

export const getAchievementStats = (archive: AccountArchive) => {
  const unlocked = archive.unlockedAchievements.length;
  const total = ACHIEVEMENTS.length;
  
  const byType: Record<string, { unlocked: number; total: number }> = {
    single: { unlocked: 0, total: 0 },
    progressive: { unlocked: 0, total: 0 },
  };

  for (const ach of ACHIEVEMENTS) {
    byType[ach.type].total++;
    if (archive.unlockedAchievements.includes(ach.id)) {
      byType[ach.type].unlocked++;
    }
  }

  let totalMax = 0;
  let totalCurrent = 0;
  for (const ach of ACHIEVEMENTS) {
    if (ach.type === 'progressive' && ach.maxProgress) {
      totalMax += ach.maxProgress;
      const prog = archive.achievementProgress[ach.id];
      totalCurrent += prog ? Math.min(prog.currentProgress, ach.maxProgress) : 0;
    } else {
      totalMax += 1;
      totalCurrent += archive.unlockedAchievements.includes(ach.id) ? 1 : 0;
    }
  }

  return {
    unlocked,
    total,
    percentage: (unlocked / total) * 100,
    byType,
    overallProgress: totalMax > 0 ? (totalCurrent / totalMax) * 100 : 0,
  };
};

export const getTitleStats = (archive: AccountArchive) => {
  const unlocked = archive.unlockedTitles.length;
  const total = TITLES.length;
  
  const byCategory: Record<string, { unlocked: number; total: number }> = {};
  const byRarity: Record<string, { unlocked: number; total: number }> = {};

  for (const title of TITLES) {
    if (!byCategory[title.category]) {
      byCategory[title.category] = { unlocked: 0, total: 0 };
    }
    byCategory[title.category].total++;
    if (archive.unlockedTitles.includes(title.id)) {
      byCategory[title.category].unlocked++;
    }

    if (!byRarity[title.rarity]) {
      byRarity[title.rarity] = { unlocked: 0, total: 0 };
    }
    byRarity[title.rarity].total++;
    if (archive.unlockedTitles.includes(title.id)) {
      byRarity[title.rarity].unlocked++;
    }
  }

  return {
    unlocked,
    total,
    percentage: (unlocked / total) * 100,
    byCategory,
    byRarity,
  };
};
