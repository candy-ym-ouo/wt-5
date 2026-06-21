import type { LimitedThemeList, FestivalChallenge, PointsRewardSystem, ActivityAchievement } from '../types/activity';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

const formatDate = (y: number, m: number, d: number): string => {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export const LIMITED_THEME_LISTS: LimitedThemeList[] = [
  {
    id: 'theme_summer_reading',
    title: '夏日读书计划',
    description: '炎炎夏日，与书为伴。完成夏日主题书单，享受清凉阅读时光。',
    icon: '☀️',
    startDate: formatDate(year, 5, 1),
    endDate: formatDate(year, 7, 31),
    bookIds: ['b004', 'b007', 'b016', 'b021', 'b022', 'b030'],
    requiredBooks: 4,
    bonusScorePerBook: 200,
    scoreMultiplier: 1.3,
    coinMultiplier: 1.2,
    rarityBoost: 'rare',
    rewards: [
      { type: 'coins', value: 800, description: '夏日阅读奖励' },
      { type: 'score', value: 1500 },
      { type: 'powerup', value: 3, powerUpType: 'time_peek' }
    ],
    exclusiveAchievements: ['summer_reader_complete'],
    backgroundStyle: 'summer',
    tags: ['限时', '夏日', '主题书单']
  },
  {
    id: 'theme_classical_literature',
    title: '古典文学盛宴',
    description: '品味经典，感受千年文化的魅力。',
    icon: '🏯',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month + 1, 0),
    bookIds: ['b003', 'b011', 'b017', 'b023', 'b027', 'b031'],
    requiredBooks: 5,
    bonusScorePerBook: 250,
    scoreMultiplier: 1.25,
    coinMultiplier: 1.15,
    rewards: [
      { type: 'coins', value: 1000 },
      { type: 'hints', value: 10 },
      { type: 'achievement', value: 1, achievementId: 'classical_master' }
    ],
    backgroundStyle: 'classical',
    tags: ['古典', '文学', '月度']
  },
  {
    id: 'theme_tech_innovation',
    title: '科技创新月',
    description: '探索科技前沿，提升编程技艺。',
    icon: '💻',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month + 1, 15),
    bookIds: ['b005', 'b012', 'b019', 'b024', 'b028', 'b032'],
    requiredBooks: 4,
    bonusScorePerBook: 300,
    scoreMultiplier: 1.4,
    coinMultiplier: 1.3,
    difficultyBonus: 'hard',
    rewards: [
      { type: 'coins', value: 1200 },
      { type: 'powerup', value: 5, powerUpType: 'eliminate_wrong' },
      { type: 'points', value: 500 }
    ],
    exclusiveAchievements: ['tech_innovator'],
    backgroundStyle: 'tech',
    tags: ['科技', '挑战', '限时']
  },
  {
    id: 'theme_mystery_night',
    title: '深夜读书会',
    description: '神秘之夜，探索未知的故事。',
    icon: '🌙',
    startDate: formatDate(year, month, now.getDate() > 10 ? now.getDate() - 10 : 1),
    endDate: formatDate(year, month, now.getDate() + 20 > 31 ? 31 : now.getDate() + 20),
    bookIds: ['b001', 'b006', 'b018', 'b025', 'b029'],
    requiredBooks: 3,
    bonusScorePerBook: 180,
    scoreMultiplier: 1.2,
    coinMultiplier: 1.25,
    rewards: [
      { type: 'coins', value: 600 },
      { type: 'hints', value: 5 },
      { type: 'powerup', value: 2, powerUpType: 'free_hint' }
    ],
    backgroundStyle: 'night',
    tags: ['神秘', '短篇', '限时']
  }
];

export const FESTIVAL_CHALLENGES: FestivalChallenge[] = [
  {
    id: 'festival_mid_autumn_2026',
    title: '中秋书香月',
    description: '月圆人团圆，在中秋佳节完成阅读挑战，赢取丰厚奖励。',
    icon: '🌕',
    startDate: formatDate(year, 8, 10),
    endDate: formatDate(year, 8, 25),
    challengeType: 'find_books',
    target: 15,
    stages: [
      { id: 'mid_autumn_s1', title: '初尝月饼', description: '找到3本书', threshold: 3, rewards: [{ type: 'coins', value: 200 }] },
      { id: 'mid_autumn_s2', title: '赏月品书', description: '找到8本书', threshold: 8, rewards: [{ type: 'coins', value: 500 }, { type: 'hints', value: 5 }] },
      { id: 'mid_autumn_s3', title: '月圆圆满', description: '找到15本书', threshold: 15, rewards: [{ type: 'coins', value: 1000 }, { type: 'score', value: 2000 }] }
    ],
    rewards: [
      { type: 'coins', value: 500 }
    ],
    completionReward: [
      { type: 'coins', value: 2000, description: '中秋庆典大奖' },
      { type: 'achievement', value: 1, achievementId: 'mid_autumn_complete' },
      { type: 'title', value: 1, titleId: 'moon_reader' }
    ],
    exclusiveAchievements: ['mid_autumn_complete', 'mid_autumn_perfect'],
    backgroundStyle: 'autumn',
    bookDecorations: ['🌕', '🥮', '🎑', '🐇']
  },
  {
    id: 'festival_newyear_2027',
    title: '新年阅读庆典',
    description: '新年新气象，挑战极限，赢取双倍奖励！',
    icon: '🎊',
    startDate: formatDate(year, 11, 25),
    endDate: formatDate(year + 1, 0, 15),
    challengeType: 'score_threshold',
    target: 20000,
    stages: [
      { id: 'ny_s1', title: '新年起步', description: '累计得分5000', threshold: 5000, rewards: [{ type: 'coins', value: 500 }] },
      { id: 'ny_s2', title: '突飞猛进', description: '累计得分10000', threshold: 10000, rewards: [{ type: 'coins', value: 1000 }, { type: 'powerup', value: 3, powerUpType: 'time_peek' }] },
      { id: 'ny_s3', title: '登峰造极', description: '累计得分20000', threshold: 20000, rewards: [{ type: 'coins', value: 2000 }, { type: 'hints', value: 15 }] }
    ],
    rewards: [
      { type: 'multiplier', value: 2.0 }
    ],
    completionReward: [
      { type: 'coins', value: 5000, description: '新年终极大奖' },
      { type: 'achievement', value: 1, achievementId: 'newyear_champion_2027' },
      { type: 'title', value: 1, titleId: 'newyear_hero' }
    ],
    exclusiveAchievements: ['newyear_champion_2027'],
    backgroundStyle: 'festive',
    bookDecorations: ['🎊', '🎉', '✨', '🎆', '🧧']
  },
  {
    id: 'festival_world_book_day',
    title: '世界图书日挑战',
    description: '4月23日，与全世界的读者一起庆祝。',
    icon: '📚',
    startDate: formatDate(year, 3, 20),
    endDate: formatDate(year, 3, 30),
    challengeType: 'perfect_rounds',
    target: 5,
    stages: [
      { id: 'wbd_s1', title: '完美开局', description: '完美完成1局', threshold: 1, rewards: [{ type: 'score', value: 500 }] },
      { id: 'wbd_s2', title: '精益求精', description: '完美完成3局', threshold: 3, rewards: [{ type: 'coins', value: 800 }] },
      { id: 'wbd_s3', title: '图书日大师', description: '完美完成5局', threshold: 5, rewards: [{ type: 'coins', value: 1500 }, { type: 'achievement', value: 1, achievementId: 'world_book_day_master' }] }
    ],
    rewards: [
      { type: 'score', value: 423 }
    ],
    completionReward: [
      { type: 'coins', value: 2024 },
      { type: 'title', value: 1, titleId: 'book_day_celebrant' }
    ],
    exclusiveAchievements: ['world_book_day_master'],
    backgroundStyle: 'bookday',
    bookDecorations: ['📚', '📖', '📕', '📗', '📘']
  },
  {
    id: 'festival_spring_awakening',
    title: '春日觉醒',
    description: '春暖花开，让知识在心中萌芽。',
    icon: '🌸',
    startDate: formatDate(year, 2, 15),
    endDate: formatDate(year, 3, 15),
    challengeType: 'no_hint_rounds',
    target: 8,
    stages: [
      { id: 'spring_s1', title: '春风拂面', description: '独立完成2局', threshold: 2, rewards: [{ type: 'hints', value: 3 }] },
      { id: 'spring_s2', title: '百花齐放', description: '独立完成5局', threshold: 5, rewards: [{ type: 'coins', value: 600 }, { type: 'score', value: 1000 }] },
      { id: 'spring_s3', title: '春华秋实', description: '独立完成8局', threshold: 8, rewards: [{ type: 'coins', value: 1200 }, { type: 'powerup', value: 5, powerUpType: 'eliminate_wrong' }] }
    ],
    rewards: [
      { type: 'multiplier', value: 1.2 }
    ],
    completionReward: [
      { type: 'achievement', value: 1, achievementId: 'spring_awakening_complete' },
      { type: 'title', value: 1, titleId: 'spring_reader' }
    ],
    backgroundStyle: 'spring',
    bookDecorations: ['🌸', '🌷', '🌼', '🌺', '🦋']
  },
  {
    id: 'festival_rare_hunter_week',
    title: '珍本猎人周',
    description: '专找珍贵书籍，成为珍本收藏家！',
    icon: '💎',
    startDate: formatDate(year, month, now.getDate() > 5 ? now.getDate() - 5 : 1),
    endDate: formatDate(year, month, now.getDate() + 10 > 31 ? 31 : now.getDate() + 10),
    challengeType: 'find_rarity',
    rarity: 'rare',
    target: 6,
    stages: [
      { id: 'rh_s1', title: '初试牛刀', description: '找到2本珍贵书籍', threshold: 2, rewards: [{ type: 'score', value: 800 }] },
      { id: 'rh_s2', title: '渐入佳境', description: '找到4本珍贵书籍', threshold: 4, rewards: [{ type: 'coins', value: 1000 }] },
      { id: 'rh_s3', title: '珍本大师', description: '找到6本珍贵书籍', threshold: 6, rewards: [{ type: 'coins', value: 2000 }, { type: 'achievement', value: 1, achievementId: 'rare_hunter_week_master' }] }
    ],
    rewards: [
      { type: 'points', value: 300 }
    ],
    completionReward: [
      { type: 'coins', value: 3000 },
      { type: 'powerup', value: 10, powerUpType: 'time_peek' }
    ],
    exclusiveAchievements: ['rare_hunter_week_master'],
    backgroundStyle: 'treasure',
    bookDecorations: ['💎', '✨', '💠', '🔮', '👑']
  }
];

export const POINTS_REWARD_SYSTEMS: PointsRewardSystem[] = [
  {
    id: 'points_seasonal_summer',
    title: '夏日积分计划',
    description: '夏日积分计划，累计积分兑换丰厚奖励！',
    icon: '⭐',
    startDate: formatDate(year, 5, 1),
    endDate: formatDate(year, 7, 31),
    pointsPerBook: 10,
    pointsPerScore: 0.5,
    pointsPerPerfectRound: 50,
    pointsPerNoHint: 30,
    bonusMultiplier: 1.0,
    tiers: [
      { id: 'summer_t1', title: '入门读者', description: '累计100积分', icon: '📖', pointsRequired: 100, claimed: false, rewards: [{ type: 'coins', value: 200 }, { type: 'hints', value: 3 }] },
      { id: 'summer_t2', title: '书海漫游者', description: '累计300积分', icon: '📚', pointsRequired: 300, claimed: false, rewards: [{ type: 'coins', value: 500 }, { type: 'powerup', value: 2, powerUpType: 'free_hint' }] },
      { id: 'summer_t3', title: '勤奋书生', description: '累计600积分', icon: '🎓', pointsRequired: 600, claimed: false, rewards: [{ type: 'coins', value: 1000 }, { type: 'score', value: 1000 }] },
      { id: 'summer_t4', title: '博学多才', description: '累计1000积分', icon: '🏆', pointsRequired: 1000, claimed: false, rewards: [{ type: 'coins', value: 2000 }, { type: 'powerup', value: 5, powerUpType: 'time_peek' }] },
      { id: 'summer_t5', title: '万卷书行者', description: '累计2000积分', icon: '👑', pointsRequired: 2000, claimed: false, rewards: [{ type: 'coins', value: 5000 }, { type: 'achievement', value: 1, achievementId: 'summer_points_master' }] }
    ]
  },
  {
    id: 'points_monthly_challenge',
    title: '月度积分挑战',
    description: '本月积分挑战，多读书多赢奖！',
    icon: '🎯',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month + 1, 0),
    pointsPerBook: 15,
    pointsPerScore: 0.3,
    pointsPerPerfectRound: 80,
    pointsPerNoHint: 50,
    bonusMultiplier: 1.2,
    tiers: [
      { id: 'monthly_t1', title: '起步', description: '累计50积分', icon: '🌱', pointsRequired: 50, claimed: false, rewards: [{ type: 'coins', value: 100 }] },
      { id: 'monthly_t2', title: '坚持', description: '累计200积分', icon: '🌿', pointsRequired: 200, claimed: false, rewards: [{ type: 'coins', value: 300 }, { type: 'hints', value: 2 }] },
      { id: 'monthly_t3', title: '精进', description: '累计500积分', icon: '🌳', pointsRequired: 500, claimed: false, rewards: [{ type: 'coins', value: 800 }, { type: 'powerup', value: 3, powerUpType: 'eliminate_wrong' }] },
      { id: 'monthly_t4', title: '卓越', description: '累计1000积分', icon: '🌟', pointsRequired: 1000, claimed: false, rewards: [{ type: 'coins', value: 1500 }, { type: 'score', value: 2000 }] }
    ]
  }
];

export const ACTIVITY_ACHIEVEMENTS: ActivityAchievement[] = [
  {
    id: 'first_activity_complete',
    title: '活动初体验',
    description: '完成第一个活动任务',
    icon: '🎯',
    activityId: 'general',
    condition: 'complete any activity',
    rewards: [{ type: 'coins', value: 100 }],
    unlocked: false
  },
  {
    id: 'activity_enthusiast',
    title: '活动爱好者',
    description: '累计完成5个活动',
    icon: '🎪',
    activityId: 'general',
    condition: 'complete 5 activities',
    rewards: [{ type: 'coins', value: 500 }],
    unlocked: false
  },
  {
    id: 'activity_master',
    title: '活动大师',
    description: '累计完成15个活动',
    icon: '🏆',
    activityId: 'general',
    condition: 'complete 15 activities',
    rewards: [{ type: 'coins', value: 2000 }, { type: 'title', value: 1, titleId: 'activity_master_title' }],
    unlocked: false
  },
  {
    id: 'points_collector',
    title: '积分收藏家',
    description: '累计获得1000活动积分',
    icon: '⭐',
    activityId: 'points_reward',
    condition: 'earn 1000 activity points',
    rewards: [{ type: 'score', value: 1000 }],
    unlocked: false
  },
  {
    id: 'festival_participant',
    title: '节日参与者',
    description: '参与3个节日挑战活动',
    icon: '🎉',
    activityId: 'festival',
    condition: 'participate 3 festivals',
    rewards: [{ type: 'coins', value: 800 }],
    unlocked: false
  },
  {
    id: 'theme_list_complete',
    title: '书单达人',
    description: '完整完成一个限时主题书单',
    icon: '📋',
    activityId: 'theme_list',
    condition: 'complete a limited theme list',
    rewards: [{ type: 'hints', value: 5 }],
    unlocked: false
  },
  {
    id: 'all_tiers_claimed',
    title: '全勤之星',
    description: '领取一个积分系统的全部档位奖励',
    icon: '💫',
    activityId: 'points_reward',
    condition: 'claim all tiers in a points system',
    rewards: [{ type: 'coins', value: 3000 }],
    unlocked: false
  }
];

export const getActiveLimitedThemeLists = (dateKey: string): LimitedThemeList[] => {
  return LIMITED_THEME_LISTS.filter(theme => theme.startDate <= dateKey && dateKey <= theme.endDate);
};

export const getActiveFestivalChallenges = (dateKey: string): FestivalChallenge[] => {
  return FESTIVAL_CHALLENGES.filter(festival => festival.startDate <= dateKey && dateKey <= festival.endDate);
};

export const getActivePointsRewardSystems = (dateKey: string): PointsRewardSystem[] => {
  return POINTS_REWARD_SYSTEMS.filter(system => system.startDate <= dateKey && dateKey <= system.endDate);
};

export const getActivityById = (activityId: string): LimitedThemeList | FestivalChallenge | PointsRewardSystem | ActivityAchievement | undefined => {
  const theme = LIMITED_THEME_LISTS.find(t => t.id === activityId);
  if (theme) return theme;
  const festival = FESTIVAL_CHALLENGES.find(f => f.id === activityId);
  if (festival) return festival;
  const points = POINTS_REWARD_SYSTEMS.find(p => p.id === activityId);
  if (points) return points;
  const achievement = ACTIVITY_ACHIEVEMENTS.find(a => a.id === activityId);
  if (achievement) return achievement;
  return undefined;
};
