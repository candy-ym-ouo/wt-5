import { createSignal, createMemo } from 'solid-js';
import type { QuestState, QuestProgress, QuestStats, QuestCategory, QuestDisplayInfo, QuestGroupInfo, QuestReward, QuestDailyReset } from '../types/quest';
import { ALL_QUESTS, CATEGORY_CONFIG, getChainForQuest } from '../data/quests';
import {
  getQuestProgress,
  saveQuestProgress,
  getQuestStats,
  saveQuestStats,
  getQuestDailyReset,
  saveQuestDailyReset,
  shouldResetDailyQuests,
  resetDailyQuestProgress,
  evaluateCondition,
  checkPrerequisitesMet,
} from '../utils/questStorage';
import type { ConditionContext } from '../utils/questStorage';

let initialProgress = getQuestProgress();
let initialStats = getQuestStats();
let initialDailyReset = getQuestDailyReset();

if (shouldResetDailyQuests(initialDailyReset)) {
  const result = resetDailyQuestProgress(initialProgress, initialDailyReset);
  initialProgress = result.progress;
  initialDailyReset = result.reset;
  saveQuestProgress(initialProgress);
  saveQuestDailyReset(initialDailyReset);
}

const initialState: QuestState = {
  questProgress: initialProgress,
  questStats: initialStats,
  dailyReset: initialDailyReset,
  activeTab: 'daily',
  showQuestPanel: false,
  showRewardPopup: null,
  showCompletePopup: null,
};

export const [questState, setQuestState] = createSignal<QuestState>(initialState);

const persistProgress = (progress: Record<string, QuestProgress>): void => {
  saveQuestProgress(progress);
  setQuestState(prev => ({ ...prev, questProgress: progress }));
};

const persistStats = (stats: QuestStats): void => {
  saveQuestStats(stats);
  setQuestState(prev => ({ ...prev, questStats: stats }));
};

const persistDailyReset = (reset: QuestDailyReset): void => {
  saveQuestDailyReset(reset);
  setQuestState(prev => ({ ...prev, dailyReset: reset }));
};

export const openQuestPanel = (tab?: QuestCategory): void => {
  setQuestState(prev => ({
    ...prev,
    showQuestPanel: true,
    activeTab: tab || prev.activeTab,
  }));
};

export const closeQuestPanel = (): void => {
  setQuestState(prev => ({ ...prev, showQuestPanel: false }));
};

export const setActiveTab = (tab: QuestCategory): void => {
  setQuestState(prev => ({ ...prev, activeTab: tab }));
};

export const checkDailyReset = (): void => {
  const state = questState();
  if (shouldResetDailyQuests(state.dailyReset)) {
    const result = resetDailyQuestProgress(state.questProgress, state.dailyReset);
    persistProgress(result.progress);
    persistDailyReset(result.reset);

    const stats = state.questStats;
    const dailyAllCompleted = Object.entries(state.questProgress)
      .filter(([id, prog]) => {
        const quest = ALL_QUESTS.find(q => q.id === id);
        return quest?.category === 'daily' && (prog.status === 'completed' || prog.status === 'claimed');
      })
      .length >= ALL_QUESTS.filter(q => q.category === 'daily' && !q.hidden).length;

    if (dailyAllCompleted) {
      const newStats: QuestStats = {
        ...stats,
        currentDailyStreak: stats.currentDailyStreak + 1,
        longestDailyStreak: Math.max(stats.longestDailyStreak, stats.currentDailyStreak + 1),
      };
      persistStats(newStats);
    } else {
      const newStats: QuestStats = {
        ...stats,
        currentDailyStreak: 0,
      };
      persistStats(newStats);
    }
  }
};

export const updateQuestProgress = (context: ConditionContext): {
  newlyCompleted: string[];
  newlyAvailable: string[];
} => {
  checkDailyReset();

  const state = questState();
  const progress = { ...state.questProgress };
  const newlyCompleted: string[] = [];
  const newlyAvailable: string[] = [];

  for (const quest of ALL_QUESTS) {
    const prog = { ...progress[quest.id] };

    if (prog.status === 'locked') {
      const prereqMet = checkPrerequisitesMet(quest.prerequisiteQuestIds, progress);
      if (prereqMet) {
        prog.status = 'available';
        progress[quest.id] = prog;
        newlyAvailable.push(quest.id);
        continue;
      }
      continue;
    }

    if (prog.status === 'claimed' || prog.status === 'completed') {
      continue;
    }

    let bestCurrent = 0;
    let allMet = true;
    for (const condition of quest.conditions) {
      const result = evaluateCondition(condition.type, condition.target, context, condition.params);
      if (!result.met) allMet = false;
      bestCurrent = Math.max(bestCurrent, result.current);
    }

    if (quest.maxProgress > 0) {
      prog.currentProgress = Math.min(bestCurrent, quest.maxProgress);
    }

    if (allMet) {
      prog.status = 'completed';
      prog.completedAt = Date.now();
      newlyCompleted.push(quest.id);
    } else if (bestCurrent > 0) {
      prog.status = 'in_progress';
      prog.unlockedAt = prog.unlockedAt || Date.now();
    }

    progress[quest.id] = prog;
  }

  persistProgress(progress);
  return { newlyCompleted, newlyAvailable };
};

export const claimQuestReward = (questId: string): QuestReward[] | null => {
  const state = questState();
  const progress = { ...state.questProgress };
  const quest = ALL_QUESTS.find(q => q.id === questId);

  if (!quest) return null;
  const prog = progress[questId];
  if (!prog || prog.status !== 'completed') return null;

  const updatedProg: QuestProgress = {
    ...prog,
    status: 'claimed',
    claimedAt: Date.now(),
  };
  progress[questId] = updatedProg;
  persistProgress(progress);

  let stats = { ...state.questStats };
  stats.totalClaimed += 1;

  const totalCoins = quest.rewards
    .filter(r => r.type === 'coins')
    .reduce((sum, r) => sum + r.value, 0);
  const totalScore = quest.rewards
    .filter(r => r.type === 'score')
    .reduce((sum, r) => sum + r.value, 0);

  stats.totalCoinsEarned += totalCoins;
  stats.totalScoreEarned += totalScore;

  switch (quest.category) {
    case 'daily':
      stats.dailyCompleted += 1;
      break;
    case 'growth':
      stats.growthCompleted += 1;
      break;
    case 'chapter':
      stats.chapterCompleted += 1;
      break;
    case 'hidden':
      stats.hiddenCompleted += 1;
      break;
  }
  stats.totalCompleted += 1;

  persistStats(stats);

  setQuestState(prev => ({
    ...prev,
    showRewardPopup: quest.rewards[0] || null,
    showCompletePopup: quest.title,
  }));

  setTimeout(() => {
    setQuestState(prev => ({
      ...prev,
      showRewardPopup: null,
      showCompletePopup: null,
    }));
  }, 3000);

  return quest.rewards;
};

export const dismissQuestPopup = (): void => {
  setQuestState(prev => ({
    ...prev,
    showRewardPopup: null,
    showCompletePopup: null,
  }));
};

export const getQuestGroupInfo = createMemo((): QuestGroupInfo[] => {
  const state = questState();
  const categories: QuestCategory[] = ['daily', 'growth', 'chapter', 'hidden'];
  const result: QuestGroupInfo[] = [];

  for (const cat of categories) {
    const config = CATEGORY_CONFIG[cat];
    const questsInCategory = ALL_QUESTS.filter(q => q.category === cat);

    const displayInfos: QuestDisplayInfo[] = questsInCategory.map(quest => {
      const prog = state.questProgress[quest.id] || {
        questId: quest.id,
        currentProgress: 0,
        status: 'locked' as const,
      };

      const percent = quest.maxProgress > 0
        ? Math.min(100, Math.round((prog.currentProgress / quest.maxProgress) * 100))
        : 0;

      const isComplete = prog.status === 'completed' || prog.status === 'claimed';
      const canClaim = prog.status === 'completed';

      const chain = getChainForQuest(quest.id);
      const chainInfo = chain ? {
        chainId: chain.id,
        chainTitle: chain.title,
        chainPosition: chain.questIds.indexOf(quest.id) + 1,
        chainTotal: chain.questIds.length,
      } : undefined;

      return {
        quest,
        progress: prog,
        percent,
        isComplete,
        canClaim,
        chainInfo,
      };
    });

    const visibleInfos = cat === 'hidden'
      ? displayInfos.filter(d => d.progress.status !== 'locked' || !d.quest.hidden)
      : displayInfos;

    const completedCount = displayInfos.filter(d => d.isComplete).length;

    result.push({
      category: cat,
      label: config.label,
      icon: config.icon,
      quests: visibleInfos,
      completedCount,
      totalCount: questsInCategory.length,
    });
  }

  return result;
});

export const getQuestStatsInfo = createMemo(() => {
  const state = questState();
  return state.questStats;
});

export const getUnclaimedQuestCount = createMemo((): number => {
  const state = questState();
  let count = 0;
  for (const quest of ALL_QUESTS) {
    const prog = state.questProgress[quest.id];
    if (prog && prog.status === 'completed') {
      count += 1;
    }
  }
  return count;
});

export const getQuestPanelInfo = createMemo(() => {
  const state = questState();
  const groups = getQuestGroupInfo();
  const stats = getQuestStatsInfo();
  const unclaimed = getUnclaimedQuestCount();

  return {
    isVisible: state.showQuestPanel,
    activeTab: state.activeTab,
    groups,
    stats,
    unclaimedCount: unclaimed,
    showRewardPopup: state.showRewardPopup,
    showCompletePopup: state.showCompletePopup,
  };
});

export const buildGameContext = (params: {
  foundBooks?: number;
  distinctGenres?: number;
  rarityBooksFound?: Record<string, number>;
  gamesCompleted?: number;
  bestScore?: number;
  bestStreak?: number;
  hintsUsed?: number;
  noHintRounds?: number;
  powerupsUsed?: number;
  commissionsCompleted?: number;
  booksRepaired?: number;
  collectedBooks?: number;
  chaptersCompleted?: number;
  chapterCompletions?: Record<string, number>;
  difficultyGamesCompleted?: Record<string, number>;
  dailyGamesCompleted?: number;
  rushCompleted?: number;
  perfectRushCompleted?: number;
  themeGamesCompleted?: number;
  coinsSpent?: number;
  coinsEarned?: number;
  storeLevel?: number;
  dialoguesCompleted?: number;
  fastFinds?: Record<number, number>;
}): ConditionContext => {
  const ctx: ConditionContext = {};

  if (params.foundBooks !== undefined) ctx['found_books'] = params.foundBooks;
  if (params.distinctGenres !== undefined) ctx['distinct_genres'] = params.distinctGenres;
  if (params.gamesCompleted !== undefined) ctx['games_completed'] = params.gamesCompleted;
  if (params.bestScore !== undefined) ctx['best_score'] = params.bestScore;
  if (params.bestStreak !== undefined) ctx['best_streak'] = params.bestStreak;
  if (params.hintsUsed !== undefined) ctx['hints_used'] = params.hintsUsed;
  if (params.noHintRounds !== undefined) ctx['no_hint_rounds'] = params.noHintRounds;
  if (params.powerupsUsed !== undefined) ctx['powerups_used'] = params.powerupsUsed;
  if (params.commissionsCompleted !== undefined) ctx['commissions_completed'] = params.commissionsCompleted;
  if (params.booksRepaired !== undefined) ctx['books_repaired'] = params.booksRepaired;
  if (params.collectedBooks !== undefined) ctx['collected_books'] = params.collectedBooks;
  if (params.chaptersCompleted !== undefined) ctx['chapters_completed'] = params.chaptersCompleted;
  if (params.dailyGamesCompleted !== undefined) ctx['daily_games_completed'] = params.dailyGamesCompleted;
  if (params.rushCompleted !== undefined) ctx['rush_completed'] = params.rushCompleted;
  if (params.perfectRushCompleted !== undefined) ctx['perfect_rush_completed'] = params.perfectRushCompleted;
  if (params.themeGamesCompleted !== undefined) ctx['theme_games_completed'] = params.themeGamesCompleted;
  if (params.coinsSpent !== undefined) ctx['coins_spent'] = params.coinsSpent;
  if (params.coinsEarned !== undefined) ctx['coins_earned'] = params.coinsEarned;
  if (params.storeLevel !== undefined) ctx['store_level'] = params.storeLevel;
  if (params.dialoguesCompleted !== undefined) ctx['dialogues_completed'] = params.dialoguesCompleted;

  if (params.rarityBooksFound) {
    for (const [rarity, count] of Object.entries(params.rarityBooksFound)) {
      ctx['rarity_books_' + rarity] = count;
    }
  }

  if (params.chapterCompletions) {
    for (const [chapterId, count] of Object.entries(params.chapterCompletions)) {
      ctx['chapter_' + chapterId] = count;
    }
  }

  if (params.difficultyGamesCompleted) {
    for (const [diff, count] of Object.entries(params.difficultyGamesCompleted)) {
      ctx['difficulty_' + diff + '_completed'] = count;
    }
  }

  if (params.fastFinds) {
    for (const [time, count] of Object.entries(params.fastFinds)) {
      ctx['fast_finds_under_' + time] = count;
    }
  }

  return ctx;
};

export const getDailyQuestProgress = createMemo((): { completed: number; total: number; percent: number } => {
  const state = questState();
  const dailyQuests = ALL_QUESTS.filter(q => q.category === 'daily' && !q.hidden);
  const completed = dailyQuests.filter(q => {
    const prog = state.questProgress[q.id];
    return prog && (prog.status === 'completed' || prog.status === 'claimed');
  }).length;
  const total = dailyQuests.length;
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
});
