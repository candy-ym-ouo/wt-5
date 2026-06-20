import { createSignal, createMemo } from 'solid-js';
import type { CalendarState, CalendarDay, CalendarProgress, CalendarStats, CalendarIntegration, CalendarReward } from '../types/calendar';
import type { Book } from '../types/game';
import { getCalendarState, saveCalendarProgress, getCalendarStats, saveCalendarStats, getCalendarMonth, getCalendarDay, updateWorkdayProgress, updateLimitedTaskProgress, updateFestivalProgress, claimWorkdayReward, claimLimitedTaskReward, claimRefreshReward, claimFestivalReward, checkCalendarStreak, computeCalendarIntegrationBonuses, syncLimitedTaskProgressFromStorage } from '../utils/calendarStorage';
import { getTodayDateKey } from '../data/dailyChallenge';
import { getActiveFestival, getActiveLimitedTasks, getActiveRefreshes, getWorkdayActivityByDay, LIMITED_TASKS, FESTIVAL_THEMES, REWARD_REFRESHES } from '../data/calendar';
import { setShowRewardPopup } from './storeManager';
import { checkAchievements } from './gameStore';

let initialState = getCalendarState();
initialState.calendarProgress = syncLimitedTaskProgressFromStorage(initialState.calendarProgress);

export const [calendarState, setCalendarState] = createSignal<CalendarState>(initialState);
export const [showCalendar, setShowCalendar] = createSignal(false);
export const [calendarStats, setCalendarStats] = createSignal<CalendarStats>(getCalendarStats());
export const [activeTab, setActiveTab] = createSignal<'calendar' | 'workday' | 'limited' | 'festival' | 'rewards'>('calendar');

const persistProgress = (progress: CalendarProgress): void => {
  saveCalendarProgress(progress);
  setCalendarState(prev => ({ ...prev, calendarProgress: progress }));
};

export const openCalendar = (): void => {
  const state = calendarState();
  const syncedProgress = syncLimitedTaskProgressFromStorage(state.calendarProgress);
  if (syncedProgress !== state.calendarProgress) {
    persistProgress(syncedProgress);
  }
  setShowCalendar(true);
};

export const closeCalendar = (): void => {
  setShowCalendar(false);
};

export const getCalendarInfo = createMemo(() => {
  const state = calendarState();
  const progress = state.calendarProgress;
  const todayKey = getTodayDateKey();
  const today = new Date(todayKey);
  const dayOfWeek = today.getDay();

  const workday = getWorkdayActivityByDay(dayOfWeek) || null;
  const limitedTasks = getActiveLimitedTasks(todayKey);
  const festival = getActiveFestival(todayKey) || null;
  const refreshes = getActiveRefreshes(todayKey);
  const bonuses = computeCalendarIntegrationBonuses(progress);
  const streak = checkCalendarStreak(progress);

  const workdayProgress = progress.workdayCompletion[todayKey];
  const activeLimitedTasks = limitedTasks.map(task => ({
    ...task,
    progress: progress.limitedTaskProgress[task.id]?.current || 0,
    completed: progress.limitedTaskProgress[task.id]?.completed || false,
    claimed: progress.limitedTaskProgress[task.id]?.claimed || false
  }));

  const unclaimedWorkdays = Object.values(progress.workdayCompletion).filter(w => w.completed && !w.claimed).length;
  const unclaimedLimited = Object.values(progress.limitedTaskProgress).filter(t => t.completed && !t.claimed).length;
  const unclaimedRefreshes = refreshes.filter(r => !progress.claimedRewards.includes(`${todayKey}_${r.id}`)).length;

  return {
    state,
    todayKey,
    workday,
    workdayProgress,
    limitedTasks: activeLimitedTasks,
    festival,
    refreshes,
    bonuses,
    streak,
    unclaimedCount: unclaimedWorkdays + unclaimedLimited + unclaimedRefreshes,
    activeFestivalId: festival?.id || null
  };
});

export const getCalendarMonthData = createMemo(() => {
  const state = calendarState();
  return getCalendarMonth(state.currentYear, state.currentMonth, state.calendarProgress);
});

export const selectCalendarDate = (dateKey: string): void => {
  setCalendarState(prev => ({ ...prev, selectedDateKey: dateKey }));
};

export const changeCalendarMonth = (delta: number): void => {
  setCalendarState(prev => {
    let newMonth = prev.currentMonth + delta;
    let newYear = prev.currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    return { ...prev, currentMonth: newMonth, currentYear: newYear };
  });
};

export const goToToday = (): void => {
  const now = new Date();
  setCalendarState(prev => ({
    ...prev,
    currentMonth: now.getMonth(),
    currentYear: now.getFullYear(),
    selectedDateKey: getTodayDateKey()
  }));
};

const applyCalendarRewards = (rewards: CalendarReward[], sourceDescription: string): { coins: number; score: number; hints: number } => {
  let totalCoins = 0;
  let totalScore = 0;
  let totalHints = 0;

  for (const reward of rewards) {
    switch (reward.type) {
      case 'coins':
        totalCoins += reward.value;
        break;
      case 'score':
        totalScore += reward.value;
        break;
      case 'hints':
        totalHints += reward.value;
        break;
    }
  }

  if (totalCoins > 0 || totalScore > 0 || totalHints > 0) {
    const rewardItems: string[] = [];
    if (totalCoins > 0) rewardItems.push(`+${totalCoins} 金币`);
    if (totalScore > 0) rewardItems.push(`+${totalScore} 分数`);
    if (totalHints > 0) rewardItems.push(`+${totalHints} 提示`);

    setShowRewardPopup({
      coins: totalCoins,
      reputation: 0,
      description: `${sourceDescription}：${rewardItems.join('，')}`
    });
    setTimeout(() => setShowRewardPopup(null), 3000);
  }

  return { coins: totalCoins, score: totalScore, hints: totalHints };
};

export const processBookFoundForCalendar = (book: Book, score: number): { bonusCoins: number; bonusScoreMultiplier: number; bonusHints: number } => {
  const state = calendarState();
  const todayKey = getTodayDateKey();
  let progress = state.calendarProgress;

  progress = updateWorkdayProgress(progress, todayKey, 1);

  progress = updateLimitedTaskProgress(progress, 'find_books', 1);
  progress = updateLimitedTaskProgress(progress, 'find_genre', 1, { genre: book.genre });
  progress = updateLimitedTaskProgress(progress, 'find_rarity', 1, { rarity: book.rarity });

  const activeFestival = getActiveFestival(todayKey);
  if (activeFestival) {
    progress = updateFestivalProgress(progress, activeFestival.id, todayKey, 1, score);
  }

  persistProgress(progress);

  const bonuses = computeCalendarIntegrationBonuses(progress);
  const workday = getWorkdayActivityByDay(new Date(todayKey).getDay());

  let bonusCoins = workday?.bonusCoinsPerBook || 0;
  if (activeFestival) {
    bonusCoins = Math.floor(bonusCoins * activeFestival.coinMultiplier);
  }

  const newStats = checkCalendarStreak(progress);
  if (newStats.current !== calendarStats().currentStreak || newStats.longest !== calendarStats().longestStreak) {
    const updatedStats = {
      ...calendarStats(),
      currentStreak: newStats.current,
      longestStreak: newStats.longest
    };
    setCalendarStats(updatedStats);
    saveCalendarStats(updatedStats);
  }

  return {
    bonusCoins,
    bonusScoreMultiplier: bonuses.scoreMultiplier,
    bonusHints: bonuses.hintsBonus
  };
};

export const processScoreThreshold = (score: number): void => {
  const state = calendarState();
  const progress = updateLimitedTaskProgress(state.calendarProgress, 'score_threshold', 0, { score });
  persistProgress(progress);
};

export const processDailyChallengeCompletion = (booksFound: number): void => {
  const state = calendarState();
  const progress = updateLimitedTaskProgress(state.calendarProgress, 'daily_challenge', booksFound);
  persistProgress(progress);
};

export const processLeaderboardSubmission = (
  leaderboardType: 'daily' | 'weekly' | 'season',
  rank: number
): void => {
  const state = calendarState();
  const progress = updateLimitedTaskProgress(state.calendarProgress, 'leaderboard_rank', 0, {
    leaderboardType,
    rank
  });
  persistProgress(progress);
};

export const claimTodayWorkdayReward = (): { success: boolean; rewards: CalendarReward[] } => {
  const state = calendarState();
  const todayKey = getTodayDateKey();
  const result = claimWorkdayReward(state.calendarProgress, todayKey);

  if (result.success) {
    persistProgress(result.progress);
    applyCalendarRewards(result.rewards, '工作日奖励');

    const stats = calendarStats();
    const updatedStats = {
      ...stats,
      totalWorkdaysCompleted: stats.totalWorkdaysCompleted + 1,
      totalRewardsClaimed: stats.totalRewardsClaimed + 1
    };
    setCalendarStats(updatedStats);
    saveCalendarStats(updatedStats);
  }

  return { success: result.success, rewards: result.rewards };
};

export const claimLimitedTaskRewardById = (taskId: string): { success: boolean; rewards: CalendarReward[] } => {
  const state = calendarState();
  const result = claimLimitedTaskReward(state.calendarProgress, taskId);

  if (result.success) {
    persistProgress(result.progress);
    const task = LIMITED_TASKS.find(t => t.id === taskId);
    applyCalendarRewards(result.rewards, `限时任务：${task?.title || '完成'}`);

    if (task?.linkedAchievementId) {
      setTimeout(() => checkAchievements(), 100);
    }

    const stats = calendarStats();
    const updatedStats = {
      ...stats,
      totalLimitedTasksCompleted: stats.totalLimitedTasksCompleted + 1,
      totalRewardsClaimed: stats.totalRewardsClaimed + 1
    };
    setCalendarStats(updatedStats);
    saveCalendarStats(updatedStats);
  }

  return { success: result.success, rewards: result.rewards };
};

export const claimRefreshRewardById = (refreshId: string): { success: boolean; rewards: CalendarReward[] } => {
  const state = calendarState();
  const todayKey = getTodayDateKey();
  const result = claimRefreshReward(state.calendarProgress, todayKey, refreshId);

  if (result.success) {
    persistProgress(result.progress);
    const refresh = REWARD_REFRESHES.find(r => r.id === refreshId);
    applyCalendarRewards(result.rewards, `奖励刷新：${refresh?.title || '领取'}`);

    const stats = calendarStats();
    const updatedStats = {
      ...stats,
      totalRewardsClaimed: stats.totalRewardsClaimed + 1
    };
    setCalendarStats(updatedStats);
    saveCalendarStats(updatedStats);
  }

  return { success: result.success, rewards: result.rewards };
};

export const claimFestivalRewardById = (festivalId: string): { success: boolean; rewards: CalendarReward[] } => {
  const state = calendarState();
  const result = claimFestivalReward(state.calendarProgress, festivalId);

  if (result.success) {
    persistProgress(result.progress);
    const festival = FESTIVAL_THEMES.find(f => f.id === festivalId);
    applyCalendarRewards(result.rewards, `节日主题奖励：${festival?.title || '完成'}`);

    const stats = calendarStats();
    const updatedStats = {
      ...stats,
      totalFestivalsParticipated: stats.totalFestivalsParticipated + 1,
      totalRewardsClaimed: stats.totalRewardsClaimed + 1
    };
    setCalendarStats(updatedStats);
    saveCalendarStats(updatedStats);
  }

  return { success: result.success, rewards: result.rewards };
};

export const getCalendarIntegration = createMemo((): CalendarIntegration => {
  const info = getCalendarInfo();
  const festival = info.festival;
  const workday = info.workday;

  let leaderboardMultiplier = 1;
  let achievementBonusActive = false;
  let challengeScoreMultiplier = 1;
  let challengeCoinMultiplier = 1;
  let sourceId = '';
  let sourceType: 'workday' | 'limited' | 'festival' | 'refresh' = 'workday';

  if (festival) {
    leaderboardMultiplier = festival.scoreMultiplier;
    achievementBonusActive = true;
    challengeScoreMultiplier = festival.scoreMultiplier;
    challengeCoinMultiplier = festival.coinMultiplier;
    sourceId = festival.id;
    sourceType = 'festival';
  } else if (workday?.scoreMultiplier) {
    leaderboardMultiplier = workday.scoreMultiplier;
    challengeScoreMultiplier = workday.scoreMultiplier;
    sourceId = workday.id;
    sourceType = 'workday';
  }

  const streak = info.streak;
  if (streak.current >= 3) {
    leaderboardMultiplier *= 1 + (streak.current * 0.02);
    challengeScoreMultiplier *= 1 + (streak.current * 0.02);
    challengeCoinMultiplier *= 1 + (streak.current * 0.01);
  }

  return {
    leaderboardBonus: {
      active: leaderboardMultiplier !== 1,
      multiplier: leaderboardMultiplier,
      sourceId,
      sourceType
    },
    achievementBonus: {
      active: achievementBonusActive,
      bonusProgress: {},
      sourceId
    },
    challengeBonus: {
      active: challengeScoreMultiplier !== 1 || challengeCoinMultiplier !== 1,
      scoreMultiplier: challengeScoreMultiplier,
      coinMultiplier: challengeCoinMultiplier,
      sourceId
    }
  };
});

export const getCalendarSelectedDay = createMemo((): CalendarDay | null => {
  const state = calendarState();
  try {
    const date = new Date(state.selectedDateKey);
    return getCalendarDay(date, state.calendarProgress);
  } catch {
    return null;
  }
});

export const getMonthName = (month: number): string => {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return names[month];
};

export const getWeekdayName = (dayOfWeek: number): string => {
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return names[dayOfWeek];
};

export const formatCalendarReward = (reward: CalendarReward): string => {
  switch (reward.type) {
    case 'coins':
      return `🪙 ${reward.value} 金币`;
    case 'score':
      return `🎯 ${reward.value} 分数`;
    case 'hints':
      return `💡 ${reward.value} 提示`;
    case 'powerup':
      if (reward.powerUpType === 'free_hint') return `🎁 免费提示 x${reward.value}`;
      if (reward.powerUpType === 'time_peek') return `👁️ 限时透视 x${reward.value}`;
      if (reward.powerUpType === 'eliminate_wrong') return `❌ 排除错误 x${reward.value}`;
      return `🎁 道具 x${reward.value}`;
    case 'multiplier':
      return `⚡ 倍率 x${reward.value}`;
    case 'theme':
      return `🎨 主题解锁`;
    case 'achievement':
      return `🏆 成就解锁`;
    default:
      return reward.description || '奖励';
  }
};
