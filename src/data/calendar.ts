import type { WorkdayActivity, LimitedTask, FestivalTheme, RewardRefresh, CalendarReward } from '../types/calendar';

export const WORKDAY_ACTIVITIES: WorkdayActivity[] = [
  {
    id: 'workday_monday',
    dayOfWeek: 1,
    title: '新周伊始',
    description: '周一开张，每本书额外+5金币奖励',
    icon: '🌅',
    bonusCoinsPerBook: 5,
    scoreMultiplier: 1.05,
    requiredBooks: 3,
    rewards: [
      { type: 'coins', value: 50, description: '完成周一头号任务奖励' },
      { type: 'hints', value: 2, description: '额外提示次数' }
    ]
  },
  {
    id: 'workday_tuesday',
    dayOfWeek: 2,
    title: '探索日',
    description: '周二探索稀有书籍，稀有书出现概率提升',
    icon: '🔍',
    rarityBoost: 'rare',
    scoreMultiplier: 1.1,
    requiredBooks: 5,
    rewards: [
      { type: 'coins', value: 80, description: '探索奖励' },
      { type: 'score', value: 200, description: '探索分数奖励' }
    ]
  },
  {
    id: 'workday_wednesday',
    dayOfWeek: 3,
    title: '知识午间',
    description: '周三知识双倍，得分倍率提升',
    icon: '📚',
    scoreMultiplier: 1.2,
    requiredBooks: 4,
    rewards: [
      { type: 'multiplier', value: 1.15, description: '游戏内分数倍率加成' },
      { type: 'coins', value: 60 }
    ]
  },
  {
    id: 'workday_thursday',
    dayOfWeek: 4,
    title: '挑战日',
    description: '周四挑战模式，困难难度奖励增加',
    icon: '⚔️',
    difficultyBonus: 'hard',
    bonusCoinsPerBook: 8,
    scoreMultiplier: 1.15,
    requiredBooks: 3,
    rewards: [
      { type: 'powerup', value: 1, powerUpType: 'free_hint', description: '免费提示x1' },
      { type: 'coins', value: 100 }
    ]
  },
  {
    id: 'workday_friday',
    dayOfWeek: 5,
    title: '丰收日',
    description: '周五丰收，金币奖励翻倍',
    icon: '💰',
    bonusCoinsPerBook: 10,
    scoreMultiplier: 1.1,
    requiredBooks: 5,
    rewards: [
      { type: 'coins', value: 150, description: '周五大丰收金币' },
      { type: 'powerup', value: 1, powerUpType: 'time_peek', description: '限时透视x1' }
    ]
  },
  {
    id: 'workday_saturday',
    dayOfWeek: 6,
    title: '周末狂欢',
    description: '周六全员狂欢，全面加成',
    icon: '🎉',
    bonusCoinsPerBook: 6,
    scoreMultiplier: 1.25,
    rarityBoost: 'uncommon',
    requiredBooks: 6,
    rewards: [
      { type: 'coins', value: 120 },
      { type: 'hints', value: 3 },
      { type: 'powerup', value: 1, powerUpType: 'eliminate_wrong', description: '排除错误x1' }
    ]
  },
  {
    id: 'workday_sunday',
    dayOfWeek: 0,
    title: '宁静周日',
    description: '周日休整，大师难度解锁奖励',
    icon: '🕊️',
    difficultyBonus: 'master',
    scoreMultiplier: 1.3,
    requiredBooks: 3,
    rewards: [
      { type: 'coins', value: 200, description: '周日特别奖励' },
      { type: 'multiplier', value: 1.1, description: '下周初始加成' },
      { type: 'achievement', value: 1, achievementId: 'sunday_master' }
    ]
  }
];

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

const formatDate = (y: number, m: number, d: number): string => {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export const LIMITED_TASKS: LimitedTask[] = [
  {
    id: 'limited_weekly_find_20',
    title: '本周寻书大师',
    description: '本周内累计找到20本书籍',
    icon: '📖',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month, 31),
    taskType: 'find_books',
    target: 20,
    rewards: [
      { type: 'coins', value: 500 },
      { type: 'score', value: 1000 }
    ],
    linkedAchievementId: 'weekly_20_books'
  },
  {
    id: 'limited_weekly_score_5000',
    title: '高分达人',
    description: '本周内单局得分达到5000分',
    icon: '🏆',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month, 31),
    taskType: 'score_threshold',
    target: 5000,
    rewards: [
      { type: 'coins', value: 800 },
      { type: 'hints', value: 10 }
    ],
    linkedChallengeId: 'high_score_challenge'
  },
  {
    id: 'limited_rare_hunter',
    title: '珍本猎人',
    description: '找到5本稀有或以上书籍',
    icon: '💎',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month + 1, 0),
    taskType: 'find_rarity',
    rarity: 'rare',
    target: 5,
    rewards: [
      { type: 'coins', value: 600 },
      { type: 'powerup', value: 3, powerUpType: 'time_peek' }
    ],
    linkedAchievementId: 'rare_hunter_5'
  },
  {
    id: 'limited_history_buff',
    title: '历史爱好者月度挑战',
    description: '本月内找到8本历史类书籍',
    icon: '🏛️',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month + 1, 0),
    taskType: 'find_genre',
    genre: '历史',
    target: 8,
    rewards: [
      { type: 'coins', value: 400 },
      { type: 'theme', value: 1, themeId: 'theme_history' }
    ],
    linkedAchievementId: 'history_monthly'
  },
  {
    id: 'limited_daily_streak_7',
    title: '连续挑战周',
    description: '连续7天完成每日挑战',
    icon: '🔥',
    startDate: formatDate(year, month, now.getDate() > 7 ? now.getDate() - 7 : 1),
    endDate: formatDate(year, month, now.getDate() + 14 > 31 ? 31 : now.getDate() + 14),
    taskType: 'consecutive_days',
    target: 7,
    rewards: [
      { type: 'coins', value: 1000 },
      { type: 'powerup', value: 5, powerUpType: 'free_hint' },
      { type: 'achievement', value: 1, achievementId: 'daily_streak_7' }
    ]
  },
  {
    id: 'limited_leaderboard_top10',
    title: '冲击周榜前十',
    description: '在周排行榜进入前10名',
    icon: '🎯',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month, 31),
    taskType: 'leaderboard_rank',
    leaderboardType: 'weekly',
    minRank: 10,
    target: 10,
    rewards: [
      { type: 'coins', value: 1500 },
      { type: 'score', value: 2000 }
    ],
    linkedChallengeId: 'leaderboard_elite'
  }
];

export const FESTIVAL_THEMES: FestivalTheme[] = [
  {
    id: 'festival_spring',
    title: '春日书韵',
    description: '春日书香，万物复苏，文学类书籍加成',
    icon: '🌸',
    startDate: formatDate(year, 2, 20),
    endDate: formatDate(year, 4, 20),
    themeId: 'theme_literature_spring',
    backgroundStyle: 'spring',
    bookDecorations: ['🌸', '🌷', '🌼'],
    scoreMultiplier: 1.2,
    coinMultiplier: 1.2,
    festivalRewards: [
      { type: 'coins', value: 2000, description: '春日庆典奖励' },
      { type: 'multiplier', value: 1.1, description: '节日永久加成' }
    ],
    exclusiveAchievements: ['spring_festival_participant', 'spring_festival_master']
  },
  {
    id: 'festival_summer',
    title: '夏日书香',
    description: '炎炎夏日，科普科幻相伴',
    icon: '☀️',
    startDate: formatDate(year, 5, 21),
    endDate: formatDate(year, 7, 23),
    themeId: 'theme_sci_summer',
    backgroundStyle: 'summer',
    bookDecorations: ['☀️', '🌴', '🍉'],
    scoreMultiplier: 1.25,
    coinMultiplier: 1.15,
    festivalRewards: [
      { type: 'coins', value: 2500 },
      { type: 'hints', value: 20 }
    ],
    exclusiveAchievements: ['summer_reader']
  },
  {
    id: 'festival_mid_autumn',
    title: '中秋书月',
    description: '月圆人团圆，古典文学盛宴',
    icon: '🌕',
    startDate: formatDate(year, 8, 15),
    endDate: formatDate(year, 8, 18),
    themeId: 'theme_classic_autumn',
    backgroundStyle: 'autumn',
    bookDecorations: ['🌕', '🥮', '🎑'],
    scoreMultiplier: 1.5,
    coinMultiplier: 1.3,
    festivalRewards: [
      { type: 'coins', value: 3000, description: '中秋特别奖励' },
      { type: 'powerup', value: 10, powerUpType: 'eliminate_wrong' }
    ],
    exclusiveAchievements: ['mid_autumn_celebrant']
  },
  {
    id: 'festival_newyear',
    title: '新年书香庆典',
    description: '新年新气象，全场双倍奖励',
    icon: '🎊',
    startDate: formatDate(year, 11, 31),
    endDate: formatDate(year + 1, 0, 7),
    themeId: 'theme_newyear_celebration',
    backgroundStyle: 'festive',
    bookDecorations: ['🎊', '🎉', '✨', '🎆'],
    scoreMultiplier: 2.0,
    coinMultiplier: 1.5,
    festivalRewards: [
      { type: 'coins', value: 5000, description: '新年大礼包' },
      { type: 'hints', value: 30 },
      { type: 'multiplier', value: 1.15, description: '新年永久加成' }
    ],
    exclusiveAchievements: ['newyear_champion', 'year_round_reader']
  },
  {
    id: 'festival_world_book_day',
    title: '世界图书日',
    description: '4月23日，与书同行',
    icon: '📚',
    startDate: formatDate(year, 3, 20),
    endDate: formatDate(year, 3, 26),
    themeId: 'theme_world_book_day',
    backgroundStyle: 'bookday',
    bookDecorations: ['📚', '📖', '📕'],
    scoreMultiplier: 1.4,
    coinMultiplier: 1.4,
    festivalRewards: [
      { type: 'coins', value: 2024 },
      { type: 'score', value: 4230 },
      { type: 'achievement', value: 1, achievementId: 'world_book_day_celebrant' }
    ]
  }
];

export const REWARD_REFRESHES: RewardRefresh[] = [
  {
    id: 'refresh_daily_morning',
    title: '每日早间签到',
    description: '每日早间登录领取签到奖励',
    icon: '🌅',
    refreshType: 'daily',
    refreshHour: 0,
    rewards: [
      { type: 'coins', value: 30, description: '每日签到金币' },
      { type: 'hints', value: 1, description: '每日提示' }
    ],
    linkedTaskIds: ['daily_signin']
  },
  {
    id: 'refresh_daily_evening',
    title: '晚间营业奖励',
    description: '每日晚间营业奖励刷新',
    icon: '🌙',
    refreshType: 'daily',
    refreshHour: 18,
    rewards: [
      { type: 'coins', value: 50 },
      { type: 'score', value: 100 }
    ]
  },
  {
    id: 'refresh_weekly_monday',
    title: '每周一刷新',
    description: '周一刷新周任务和奖励',
    icon: '📅',
    refreshType: 'weekly',
    refreshHour: 0,
    rewards: [
      { type: 'coins', value: 200 },
      { type: 'hints', value: 5 },
      { type: 'powerup', value: 1, powerUpType: 'time_peek' }
    ],
    linkedTaskIds: ['limited_weekly_find_20', 'limited_weekly_score_5000']
  },
  {
    id: 'refresh_monthly_start',
    title: '月初大礼包',
    description: '每月首日领取月度奖励',
    icon: '🎁',
    refreshType: 'monthly',
    refreshHour: 0,
    rewards: [
      { type: 'coins', value: 1000 },
      { type: 'hints', value: 15 },
      { type: 'powerup', value: 3, powerUpType: 'free_hint' },
      { type: 'powerup', value: 3, powerUpType: 'eliminate_wrong' },
      { type: 'multiplier', value: 1.05, description: '本月专属加成' }
    ]
  }
];

export function getWorkdayActivityByDay(dayOfWeek: number): WorkdayActivity | undefined {
  return WORKDAY_ACTIVITIES.find(w => w.dayOfWeek === dayOfWeek);
}

export function getActiveLimitedTasks(dateKey: string): LimitedTask[] {
  return LIMITED_TASKS.filter(task => {
    return task.startDate <= dateKey && dateKey <= task.endDate;
  });
}

export function getActiveFestival(dateKey: string): FestivalTheme | undefined {
  return FESTIVAL_THEMES.find(festival => {
    return festival.startDate <= dateKey && dateKey <= festival.endDate;
  });
}

export function getActiveRefreshes(dateKey: string): RewardRefresh[] {
  const date = new Date(dateKey);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  return REWARD_REFRESHES.filter(refresh => {
    if (refresh.refreshType === 'daily') return true;
    if (refresh.refreshType === 'weekly') return dayOfWeek === 1;
    if (refresh.refreshType === 'monthly') return dayOfMonth === 1;
    return false;
  });
}

export function getCalendarRewardsSummary(): {
  workdayRewards: CalendarReward[];
  activeLimitedRewards: CalendarReward[];
  festivalRewards: CalendarReward[];
  refreshRewards: CalendarReward[];
} {
  return {
    workdayRewards: WORKDAY_ACTIVITIES.flatMap(w => w.rewards),
    activeLimitedRewards: LIMITED_TASKS.flatMap(t => t.rewards),
    festivalRewards: FESTIVAL_THEMES.flatMap(f => f.festivalRewards),
    refreshRewards: REWARD_REFRESHES.flatMap(r => r.rewards)
  };
}
