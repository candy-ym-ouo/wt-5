import type { QuestProgress, QuestStats, QuestDailyReset, QuestConditionType } from '../types/quest';
import { ALL_QUESTS, getDailyQuestIds } from '../data/quests';
import { getTodayDateKey } from '../data/dailyChallenge';

export const QUEST_PROGRESS_KEY = 'old_bookstore_quest_progress';
export const QUEST_STATS_KEY = 'old_bookstore_quest_stats';
export const QUEST_DAILY_RESET_KEY = 'old_bookstore_quest_daily_reset';

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
  } catch {}
}

export const getDefaultQuestProgress = (): Record<string, QuestProgress> => {
  const progress: Record<string, QuestProgress> = {};
  for (const quest of ALL_QUESTS) {
    progress[quest.id] = {
      questId: quest.id,
      currentProgress: 0,
      status: quest.hidden ? 'locked' : (quest.status === 'locked' ? 'locked' : 'available'),
    };
  }
  return progress;
};

export const getDefaultQuestStats = (): QuestStats => ({
  totalCompleted: 0,
  totalClaimed: 0,
  dailyCompleted: 0,
  growthCompleted: 0,
  chapterCompleted: 0,
  hiddenCompleted: 0,
  totalCoinsEarned: 0,
  totalScoreEarned: 0,
  currentDailyStreak: 0,
  longestDailyStreak: 0,
});

export const getDefaultDailyReset = (): QuestDailyReset => ({
  lastResetDate: '',
  resetQuestIds: getDailyQuestIds(),
});

export const getQuestProgress = (): Record<string, QuestProgress> => {
  const stored = _readJSON<Record<string, QuestProgress>>(QUEST_PROGRESS_KEY, {});
  const defaults = getDefaultQuestProgress();
  const merged = { ...defaults };
  for (const [id, prog] of Object.entries(stored)) {
    if (merged[id]) {
      merged[id] = { ...merged[id], ...prog };
    }
  }
  for (const quest of ALL_QUESTS) {
    if (!merged[quest.id]) {
      merged[quest.id] = {
        questId: quest.id,
        currentProgress: 0,
        status: quest.hidden ? 'locked' : (quest.status === 'locked' ? 'locked' : 'available'),
      };
    }
  }
  return merged;
};

export const saveQuestProgress = (progress: Record<string, QuestProgress>): void => {
  _writeJSON(QUEST_PROGRESS_KEY, progress);
};

export const getQuestStats = (): QuestStats => {
  return _readJSON<QuestStats>(QUEST_STATS_KEY, getDefaultQuestStats());
};

export const saveQuestStats = (stats: QuestStats): void => {
  _writeJSON(QUEST_STATS_KEY, stats);
};

export const getQuestDailyReset = (): QuestDailyReset => {
  return _readJSON<QuestDailyReset>(QUEST_DAILY_RESET_KEY, getDefaultDailyReset());
};

export const saveQuestDailyReset = (reset: QuestDailyReset): void => {
  _writeJSON(QUEST_DAILY_RESET_KEY, reset);
};

export const shouldResetDailyQuests = (reset: QuestDailyReset): boolean => {
  const todayKey = getTodayDateKey();
  return reset.lastResetDate !== todayKey;
};

export const resetDailyQuestProgress = (
  progress: Record<string, QuestProgress>,
  reset: QuestDailyReset
): { progress: Record<string, QuestProgress>; reset: QuestDailyReset } => {
  const todayKey = getTodayDateKey();
  const updatedProgress = { ...progress };

  for (const questId of reset.resetQuestIds) {
    if (updatedProgress[questId]) {
      updatedProgress[questId] = {
        ...updatedProgress[questId],
        currentProgress: 0,
        status: 'available',
        dateKey: todayKey,
      };
    }
  }

  const updatedReset: QuestDailyReset = {
    lastResetDate: todayKey,
    resetQuestIds: getDailyQuestIds(),
  };

  return { progress: updatedProgress, reset: updatedReset };
};

export type ConditionContext = Record<string, number>;

export const evaluateCondition = (
  conditionType: QuestConditionType,
  target: number,
  context: ConditionContext,
  params?: Record<string, unknown>
): { met: boolean; current: number } => {
  switch (conditionType) {
    case 'find_books': {
      const maxTime = (params?.maxTime as number) || 0;
      if (maxTime > 0) {
        const fastFinds = context['fast_finds_under_' + maxTime] || 0;
        return { met: fastFinds >= target, current: fastFinds };
      }
      const found = context['found_books'] || 0;
      return { met: found >= target, current: found };
    }
    case 'find_genre_books': {
      const genres = context['distinct_genres'] || 0;
      return { met: genres >= target, current: genres };
    }
    case 'find_rarity_books': {
      const rarity = (params?.rarity as string) || 'legendary';
      const found = context['rarity_books_' + rarity] || 0;
      return { met: found >= target, current: found };
    }
    case 'complete_games': {
      const completed = context['games_completed'] || 0;
      return { met: completed >= target, current: completed };
    }
    case 'complete_chapters': {
      const chapterId = params?.chapterId as string | undefined;
      if (chapterId) {
        const chapterCompleted = context['chapter_' + chapterId] || 0;
        return { met: chapterCompleted >= target, current: chapterCompleted };
      }
      const total = context['chapters_completed'] || 0;
      return { met: total >= target, current: total };
    }
    case 'achieve_score': {
      const score = context['best_score'] || 0;
      return { met: score >= target, current: score };
    }
    case 'achieve_streak': {
      const streak = context['best_streak'] || 0;
      return { met: streak >= target, current: streak };
    }
    case 'use_hints': {
      const hints = context['hints_used'] || 0;
      return { met: hints >= target, current: hints };
    }
    case 'use_no_hints': {
      const noHintRounds = context['no_hint_rounds'] || 0;
      return { met: noHintRounds >= target, current: noHintRounds };
    }
    case 'use_powerup': {
      const powerups = context['powerups_used'] || 0;
      return { met: powerups >= target, current: powerups };
    }
    case 'complete_commission': {
      const commissions = context['commissions_completed'] || 0;
      return { met: commissions >= target, current: commissions };
    }
    case 'repair_books': {
      const repaired = context['books_repaired'] || 0;
      return { met: repaired >= target, current: repaired };
    }
    case 'collect_books': {
      const collected = context['collected_books'] || 0;
      return { met: collected >= target, current: collected };
    }
    case 'play_difficulty': {
      const difficulty = (params?.difficulty as string) || 'normal';
      const diffGames = context['difficulty_' + difficulty + '_completed'] || 0;
      return { met: diffGames >= target, current: diffGames };
    }
    case 'play_daily': {
      const dailyGames = context['daily_games_completed'] || 0;
      return { met: dailyGames >= target, current: dailyGames };
    }
    case 'play_rush': {
      const perfect = params?.perfect as boolean | undefined;
      if (perfect) {
        const perfectRushes = context['perfect_rush_completed'] || 0;
        return { met: perfectRushes >= target, current: perfectRushes };
      }
      const rushGames = context['rush_completed'] || 0;
      return { met: rushGames >= target, current: rushGames };
    }
    case 'play_theme': {
      const themeGames = context['theme_games_completed'] || 0;
      return { met: themeGames >= target, current: themeGames };
    }
    case 'spend_coins': {
      const spent = context['coins_spent'] || 0;
      return { met: spent >= target, current: spent };
    }
    case 'earn_coins': {
      const earned = context['coins_earned'] || 0;
      return { met: earned >= target, current: earned };
    }
    case 'level_up_store': {
      const level = context['store_level'] || 1;
      return { met: level >= target, current: level };
    }
    case 'dialogue_count': {
      const dialogues = context['dialogues_completed'] || 0;
      return { met: dialogues >= target, current: dialogues };
    }
    case 'custom': {
      const customKey = (params?.key as string) || 'custom';
      const customValue = context[customKey] || 0;
      return { met: customValue >= target, current: customValue };
    }
    default:
      return { met: false, current: 0 };
  }
};

export const checkPrerequisitesMet = (
  prerequisiteIds: string[] | undefined,
  progress: Record<string, QuestProgress>
): boolean => {
  if (!prerequisiteIds || prerequisiteIds.length === 0) return true;
  return prerequisiteIds.every(id => {
    const prog = progress[id];
    return prog && (prog.status === 'completed' || prog.status === 'claimed');
  });
};
