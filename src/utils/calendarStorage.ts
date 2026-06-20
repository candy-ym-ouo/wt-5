import type { CalendarProgress, CalendarState, CalendarDay, CalendarStats, LimitedTask, WorkdayActivity, FestivalTheme } from '../types/calendar';
import type { RarityLevel } from '../types/game';
import { getTodayDateKey } from '../data/dailyChallenge';
import { getWorkdayActivityByDay, getActiveLimitedTasks, getActiveFestival, getActiveRefreshes, LIMITED_TASKS, FESTIVAL_THEMES, REWARD_REFRESHES } from '../data/calendar';
import { getPersonalBest, getWeeklyLeaderboard, getSeasonLeaderboard, getDailyLeaderboard } from './storage';

export const CALENDAR_STATE_KEY = 'old_bookstore_calendar_state';
export const CALENDAR_PROGRESS_KEY = 'old_bookstore_calendar_progress';
export const CALENDAR_STATS_KEY = 'old_bookstore_calendar_stats';

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

const createInitialCalendarProgress = (): CalendarProgress => ({
  limitedTaskProgress: {},
  workdayCompletion: {},
  festivalProgress: {},
  claimedRewards: [],
  lastRefreshCheck: ''
});

const createInitialCalendarState = (): CalendarState => {
  const now = new Date();
  const todayKey = getTodayDateKey();
  return {
    currentDateKey: todayKey,
    selectedDateKey: todayKey,
    activeFestivalId: null,
    calendarProgress: createInitialCalendarProgress(),
    showCalendar: false,
    currentMonth: now.getMonth(),
    currentYear: now.getFullYear()
  };
};

export const getCalendarProgress = (): CalendarProgress => {
  const saved = _readJSON<CalendarProgress | null>(CALENDAR_PROGRESS_KEY, null);
  if (saved) return saved;
  const initial = createInitialCalendarProgress();
  _writeJSON(CALENDAR_PROGRESS_KEY, initial);
  return initial;
};

export const saveCalendarProgress = (progress: CalendarProgress): void => {
  _writeJSON(CALENDAR_PROGRESS_KEY, progress);
};

export const getCalendarState = (): CalendarState => {
  const saved = _readJSON<CalendarState | null>(CALENDAR_STATE_KEY, null);
  if (saved) {
    saved.calendarProgress = getCalendarProgress();
    return saved;
  }
  const initial = createInitialCalendarState();
  _writeJSON(CALENDAR_STATE_KEY, initial);
  return initial;
};

export const saveCalendarState = (state: CalendarState): void => {
  saveCalendarProgress(state.calendarProgress);
  const stateToSave = { ...state, calendarProgress: undefined };
  _writeJSON(CALENDAR_STATE_KEY, stateToSave);
};

export const getCalendarStats = (): CalendarStats => {
  return _readJSON<CalendarStats>(CALENDAR_STATS_KEY, {
    totalWorkdaysCompleted: 0,
    totalLimitedTasksCompleted: 0,
    totalFestivalsParticipated: 0,
    totalRewardsClaimed: 0,
    currentStreak: 0,
    longestStreak: 0
  });
};

export const saveCalendarStats = (stats: CalendarStats): void => {
  _writeJSON(CALENDAR_STATS_KEY, stats);
};

export const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCalendarDay = (date: Date, progress: CalendarProgress): CalendarDay => {
  const dateKey = getDateKey(date);
  const todayKey = getTodayDateKey();
  const dayOfWeek = date.getDay();

  const workday = getWorkdayActivityByDay(dayOfWeek) || null;
  const limitedTasks = getActiveLimitedTasks(dateKey);
  const festival = getActiveFestival(dateKey) || null;
  const refreshes = getActiveRefreshes(dateKey);

  const workdayProgress = progress.workdayCompletion[dateKey];
  const workdayCompleted = workdayProgress?.completed || false;
  const workdayProgressValue = workdayProgress?.booksFound || 0;

  const limitedTaskStatus: Record<string, 'upcoming' | 'active' | 'completed' | 'expired'> = {};
  limitedTasks.forEach(task => {
    const taskProgress = progress.limitedTaskProgress[task.id];
    if (taskProgress?.completed) {
      limitedTaskStatus[task.id] = 'completed';
    } else if (dateKey > task.endDate) {
      limitedTaskStatus[task.id] = 'expired';
    } else if (dateKey < task.startDate) {
      limitedTaskStatus[task.id] = 'upcoming';
    } else {
      limitedTaskStatus[task.id] = 'active';
    }
  });

  const festivalActive = festival ? (dateKey >= festival.startDate && dateKey <= festival.endDate) : false;

  const refreshClaimed: Record<string, boolean> = {};
  refreshes.forEach(refresh => {
    refreshClaimed[refresh.id] = progress.claimedRewards.includes(`${dateKey}_${refresh.id}`);
  });

  return {
    dateKey,
    date,
    dayOfWeek,
    isToday: dateKey === todayKey,
    workday,
    limitedTasks,
    festival,
    refreshes,
    progress: {
      workdayCompleted,
      workdayProgress: workdayProgressValue,
      limitedTaskStatus,
      festivalActive,
      refreshClaimed
    }
  };
};

export const getCalendarMonth = (year: number, month: number, progress: CalendarProgress): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(getCalendarDay(new Date(d), progress));
  }

  return days;
};

export const updateWorkdayProgress = (
  progress: CalendarProgress,
  dateKey: string,
  booksFound: number
): CalendarProgress => {
  const todayProgress = progress.workdayCompletion[dateKey] || {
    dateKey,
    booksFound: 0,
    completed: false,
    claimed: false
  };

  const workday = getWorkdayActivityByDay(new Date(dateKey).getDay());
  const requiredBooks = workday?.requiredBooks || 3;
  const newBooksFound = todayProgress.booksFound + booksFound;
  const completed = newBooksFound >= requiredBooks;

  return {
    ...progress,
    workdayCompletion: {
      ...progress.workdayCompletion,
      [dateKey]: {
        ...todayProgress,
        booksFound: newBooksFound,
        completed
      }
    }
  };
};

export const updateLimitedTaskProgress = (
  progress: CalendarProgress,
  taskType: LimitedTask['taskType'],
  value: number,
  extra?: { genre?: string; rarity?: RarityLevel; score?: number; leaderboardType?: 'daily' | 'weekly' | 'season'; rank?: number }
): CalendarProgress => {
  const todayKey = getTodayDateKey();
  const activeTasks = getActiveLimitedTasks(todayKey);
  const newProgress = { ...progress, limitedTaskProgress: { ...progress.limitedTaskProgress } };

  for (const task of activeTasks) {
    if (task.taskType !== taskType) continue;

    if (extra?.genre && task.genre !== extra.genre) continue;
    if (extra?.rarity && task.rarity) {
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const taskRarityIndex = rarityOrder.indexOf(task.rarity);
      const valueRarityIndex = rarityOrder.indexOf(extra.rarity);
      if (valueRarityIndex < taskRarityIndex) continue;
    }

    const existingProgress = newProgress.limitedTaskProgress[task.id] || {
      current: 0,
      completed: false,
      claimed: false
    };

    let newValue = existingProgress.current;

    if (taskType === 'leaderboard_rank' && extra?.rank !== undefined && extra?.leaderboardType === task.leaderboardType) {
      if (extra.rank <= (task.minRank || 10)) {
        newValue = task.target;
      }
    } else if (taskType === 'score_threshold' && extra?.score !== undefined) {
      newValue = Math.max(newValue, extra.score >= task.target ? task.target : extra.score);
    } else if (taskType === 'consecutive_days') {
      newValue = value;
    } else {
      newValue = existingProgress.current + value;
    }

    const completed = newValue >= task.target;

    newProgress.limitedTaskProgress[task.id] = {
      ...existingProgress,
      current: Math.min(newValue, task.target),
      completed,
      completedAt: completed && !existingProgress.completed ? Date.now() : existingProgress.completedAt
    };
  }

  return newProgress;
};

export const updateFestivalProgress = (
  progress: CalendarProgress,
  festivalId: string,
  dateKey: string,
  booksFound: number,
  score: number
): CalendarProgress => {
  const festivalProgress = progress.festivalProgress[festivalId] || {
    festivalId,
    participationDays: [],
    booksFound: 0,
    totalScore: 0,
    rewardsClaimed: false
  };

  const newParticipationDays = festivalProgress.participationDays.includes(dateKey)
    ? festivalProgress.participationDays
    : [...festivalProgress.participationDays, dateKey];

  return {
    ...progress,
    festivalProgress: {
      ...progress.festivalProgress,
      [festivalId]: {
        ...festivalProgress,
        participationDays: newParticipationDays,
        booksFound: festivalProgress.booksFound + booksFound,
        totalScore: festivalProgress.totalScore + score
      }
    }
  };
};

export const claimWorkdayReward = (
  progress: CalendarProgress,
  dateKey: string
): { success: boolean; progress: CalendarProgress; rewards: WorkdayActivity['rewards'] } => {
  const workdayProgress = progress.workdayCompletion[dateKey];
  if (!workdayProgress || !workdayProgress.completed || workdayProgress.claimed) {
    return { success: false, progress, rewards: [] };
  }

  const dayOfWeek = new Date(dateKey).getDay();
  const workday = getWorkdayActivityByDay(dayOfWeek);

  return {
    success: true,
    progress: {
      ...progress,
      workdayCompletion: {
        ...progress.workdayCompletion,
        [dateKey]: { ...workdayProgress, claimed: true }
      }
    },
    rewards: workday?.rewards || []
  };
};

export const claimLimitedTaskReward = (
  progress: CalendarProgress,
  taskId: string
): { success: boolean; progress: CalendarProgress; rewards: LimitedTask['rewards'] } => {
  const taskProgress = progress.limitedTaskProgress[taskId];
  if (!taskProgress || !taskProgress.completed || taskProgress.claimed) {
    return { success: false, progress, rewards: [] };
  }

  const task = LIMITED_TASKS.find(t => t.id === taskId);

  return {
    success: true,
    progress: {
      ...progress,
      limitedTaskProgress: {
        ...progress.limitedTaskProgress,
        [taskId]: { ...taskProgress, claimed: true, claimedAt: Date.now() }
      }
    },
    rewards: task?.rewards || []
  };
};

export const claimRefreshReward = (
  progress: CalendarProgress,
  dateKey: string,
  refreshId: string
): { success: boolean; progress: CalendarProgress; rewards: typeof REWARD_REFRESHES[0]['rewards'] } => {
  const rewardKey = `${dateKey}_${refreshId}`;
  if (progress.claimedRewards.includes(rewardKey)) {
    return { success: false, progress, rewards: [] };
  }

  const refresh = REWARD_REFRESHES.find(r => r.id === refreshId);

  return {
    success: true,
    progress: {
      ...progress,
      claimedRewards: [...progress.claimedRewards, rewardKey]
    },
    rewards: refresh?.rewards || []
  };
};

export const claimFestivalReward = (
  progress: CalendarProgress,
  festivalId: string
): { success: boolean; progress: CalendarProgress; rewards: FestivalTheme['festivalRewards'] } => {
  const festivalProgress = progress.festivalProgress[festivalId];
  if (!festivalProgress || festivalProgress.rewardsClaimed || festivalProgress.participationDays.length < 1) {
    return { success: false, progress, rewards: [] };
  }

  const festival = FESTIVAL_THEMES.find(f => f.id === festivalId);

  return {
    success: true,
    progress: {
      ...progress,
      festivalProgress: {
        ...progress.festivalProgress,
        [festivalId]: { ...festivalProgress, rewardsClaimed: true }
      }
    },
    rewards: festival?.festivalRewards || []
  };
};

export const checkCalendarStreak = (progress: CalendarProgress): { current: number; longest: number } => {
  const today = new Date();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const sortedDates = Object.keys(progress.workdayCompletion)
    .filter(k => progress.workdayCompletion[k].completed)
    .sort();

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const date = new Date(sortedDates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - (sortedDates.length - 1 - i));

    if (getDateKey(date) === getDateKey(expectedDate)) {
      tempStreak++;
    } else {
      break;
    }
  }
  currentStreak = tempStreak;

  tempStreak = 0;
  let prevDate: Date | null = null;
  for (const dateKey of sortedDates) {
    const date = new Date(dateKey);
    if (prevDate) {
      const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
};

export const computeCalendarIntegrationBonuses = (
  progress: CalendarProgress
): { scoreMultiplier: number; coinMultiplier: number; hintsBonus: number } => {
  const todayKey = getTodayDateKey();
  const today = new Date(todayKey);
  const dayOfWeek = today.getDay();
  const workday = getWorkdayActivityByDay(dayOfWeek);
  const festival = getActiveFestival(todayKey);

  let scoreMultiplier = 1;
  let coinMultiplier = 1;
  let hintsBonus = 0;

  if (workday?.scoreMultiplier) {
    scoreMultiplier *= workday.scoreMultiplier;
  }

  if (festival) {
    scoreMultiplier *= festival.scoreMultiplier;
    coinMultiplier *= festival.coinMultiplier;
  }

  const streak = checkCalendarStreak(progress);
  if (streak.current >= 3) {
    scoreMultiplier *= 1 + (streak.current * 0.02);
    coinMultiplier *= 1 + (streak.current * 0.01);
  }

  return { scoreMultiplier, coinMultiplier, hintsBonus };
};

export const syncLimitedTaskProgressFromStorage = (progress: CalendarProgress): CalendarProgress => {
  let updatedProgress = { ...progress };

  const pb = getPersonalBest();
  const dailyLeaderboard = getDailyLeaderboard(getTodayDateKey());
  const weeklyLeaderboard = getWeeklyLeaderboard();
  const seasonLeaderboard = getSeasonLeaderboard();

  const activeTasks = getActiveLimitedTasks(getTodayDateKey());

  for (const task of activeTasks) {
    if (task.taskType === 'find_books') {
      updatedProgress = updateLimitedTaskProgress(updatedProgress, 'find_books', 0);
    }
    if (task.taskType === 'score_threshold' && pb.highestScore > 0) {
      updatedProgress = updateLimitedTaskProgress(updatedProgress, 'score_threshold', 0, { score: pb.highestScore });
    }
    if (task.taskType === 'leaderboard_rank') {
      let rank = -1;
      let leaderboard: Array<{ playerName?: string }> = [];
      if (task.leaderboardType === 'daily') leaderboard = dailyLeaderboard;
      else if (task.leaderboardType === 'weekly') leaderboard = weeklyLeaderboard;
      else leaderboard = seasonLeaderboard;

      for (let i = 0; i < leaderboard.length; i++) {
        if (leaderboard[i].playerName === '我' || leaderboard[i].playerName === 'Player') {
          rank = i + 1;
          break;
        }
      }
      if (rank > 0) {
        updatedProgress = updateLimitedTaskProgress(updatedProgress, 'leaderboard_rank', 0, {
          leaderboardType: task.leaderboardType,
          rank
        });
      }
    }
  }

  const streak = checkCalendarStreak(progress);
  updatedProgress = updateLimitedTaskProgress(updatedProgress, 'consecutive_days', streak.current);

  return updatedProgress;
};

export const clearCalendarData = (): void => {
  localStorage.removeItem(CALENDAR_STATE_KEY);
  localStorage.removeItem(CALENDAR_PROGRESS_KEY);
  localStorage.removeItem(CALENDAR_STATS_KEY);
};
