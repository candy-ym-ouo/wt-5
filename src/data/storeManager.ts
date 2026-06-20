import type { CustomerPreference, ShelfArrangement, StoreTask } from '../types/storeManager';

export const CUSTOMERS: CustomerPreference[] = [
  {
    id: 'customer_student',
    name: '文学少女',
    avatar: '👧',
    description: '喜欢文学和古典作品的大学生，每周都会来书店看书。',
    preferredGenres: ['文学', '古典', '散文'],
    preferredThemes: ['文学经典', '中国古典'],
    preferredRarities: ['rare', 'epic', 'legendary'],
    satisfaction: 50,
    maxSatisfaction: 100,
    visits: 0,
    totalSpent: 0,
    unlocked: true,
  },
  {
    id: 'customer_engineer',
    name: '程序员大叔',
    avatar: '👨‍💻',
    description: '互联网公司的技术总监，热衷于收集技术书籍。',
    preferredGenres: ['技术', '科普'],
    preferredThemes: ['技术匠心', '科学探索'],
    preferredRarities: ['rare', 'epic', 'legendary'],
    satisfaction: 30,
    maxSatisfaction: 100,
    visits: 0,
    totalSpent: 0,
    unlocked: true,
  },
  {
    id: 'customer_teacher',
    name: '历史老师',
    avatar: '👩‍🏫',
    description: '中学历史教师，对历史和哲学书籍有独到见解。',
    preferredGenres: ['历史', '哲学', '古典'],
    preferredThemes: ['历史长河', '哲学智慧', '中国古典'],
    preferredRarities: ['uncommon', 'rare', 'epic'],
    satisfaction: 40,
    maxSatisfaction: 100,
    visits: 0,
    totalSpent: 0,
    unlocked: false,
  },
  {
    id: 'customer_scientist',
    name: '科幻作家',
    avatar: '🧑‍🚀',
    description: '知名科幻小说家，寻找灵感和科学知识。',
    preferredGenres: ['科幻', '科普'],
    preferredThemes: ['科学探索', '冒险与探索', '时间与记忆'],
    preferredRarities: ['epic', 'legendary'],
    satisfaction: 20,
    maxSatisfaction: 100,
    visits: 0,
    totalSpent: 0,
    unlocked: false,
  },
  {
    id: 'customer_artist',
    name: '文艺青年',
    avatar: '🧑‍🎨',
    description: '自由艺术家，喜欢童话和富有想象力的作品。',
    preferredGenres: ['童话', '文学', '散文'],
    preferredThemes: ['文学经典', '冒险与探索'],
    preferredRarities: ['uncommon', 'rare', 'epic'],
    satisfaction: 35,
    maxSatisfaction: 100,
    visits: 0,
    totalSpent: 0,
    unlocked: false,
  },
  {
    id: 'customer_collector',
    name: '藏书家',
    avatar: '👴',
    description: '退休教授，专门收藏稀有和珍贵的古籍。',
    preferredGenres: ['古典', '历史', '哲学'],
    preferredThemes: ['中国古典', '历史长河', '哲学智慧'],
    preferredRarities: ['epic', 'legendary'],
    satisfaction: 25,
    maxSatisfaction: 100,
    visits: 0,
    totalSpent: 0,
    unlocked: false,
  },
];

export const ARRANGEMENTS: ShelfArrangement[] = [
  {
    id: 'arrange_genre',
    name: '按分类整理',
    description: '将书籍按类别分区摆放，更容易找到目标类型的书籍。',
    icon: '📚',
    arrangementType: 'genre',
    bonusType: 'score',
    bonusValue: 15,
    cost: 50,
    unlocked: true,
    active: false,
    duration: 3600,
  },
  {
    id: 'arrange_rarity',
    name: '按稀有度整理',
    description: '将稀有书籍放在显眼位置，提高遇到珍本的概率。',
    icon: '💎',
    arrangementType: 'rarity',
    bonusType: 'rare_chance',
    bonusValue: 20,
    cost: 100,
    unlocked: true,
    active: false,
    duration: 3600,
  },
  {
    id: 'arrange_theme',
    name: '按主题整理',
    description: '将相关主题的书籍放在一起，激活主题加成。',
    icon: '🎯',
    arrangementType: 'theme',
    bonusType: 'score',
    bonusValue: 25,
    cost: 80,
    unlocked: false,
    active: false,
    duration: 3600,
  },
  {
    id: 'arrange_year',
    name: '按年代整理',
    description: '按出版年份排列书籍，线索解锁速度加快。',
    icon: '📅',
    arrangementType: 'year',
    bonusType: 'clue_speed',
    bonusValue: 30,
    cost: 120,
    unlocked: false,
    active: false,
    duration: 3600,
  },
  {
    id: 'arrange_author',
    name: '按作者整理',
    description: '将同一作者的书籍放在一起，增加额外时间。',
    icon: '✍️',
    arrangementType: 'author',
    bonusType: 'time',
    bonusValue: 10,
    cost: 90,
    unlocked: false,
    active: false,
    duration: 3600,
  },
  {
    id: 'arrange_custom',
    name: '店长推荐',
    description: '精心挑选的展示位，全方位提升游戏体验。',
    icon: '⭐',
    arrangementType: 'custom',
    bonusType: 'score',
    bonusValue: 20,
    cost: 200,
    unlocked: false,
    active: false,
    duration: 7200,
  },
];

export const DAILY_TASKS: StoreTask[] = [
  {
    id: 'task_daily_find_3',
    title: '今日目标',
    description: '找到3本书籍',
    icon: '📖',
    taskType: 'daily',
    requirement: {
      type: 'find_books',
      target: 3,
    },
    rewards: {
      coins: 30,
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
  {
    id: 'task_daily_find_genre',
    title: '分类达人',
    description: '找到2本文学类书籍',
    icon: '📚',
    taskType: 'daily',
    requirement: {
      type: 'find_genre',
      target: 2,
      genre: '文学',
    },
    rewards: {
      coins: 50,
      hints: 1,
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
  {
    id: 'task_daily_arrange',
    title: '勤劳店长',
    description: '整理1次书架',
    icon: '🧹',
    taskType: 'daily',
    requirement: {
      type: 'arrange_shelf',
      target: 1,
    },
    rewards: {
      coins: 40,
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
  {
    id: 'task_daily_rare',
    title: '稀世珍宝',
    description: '找到1本稀有或以上品质的书籍',
    icon: '💎',
    taskType: 'daily',
    requirement: {
      type: 'find_rarity',
      target: 1,
      rarity: 'rare',
    },
    rewards: {
      coins: 80,
      scoreBonus: 200,
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
];

export const WEEKLY_TASKS: StoreTask[] = [
  {
    id: 'task_weekly_find_15',
    title: '周度目标',
    description: '本周找到15本书籍',
    icon: '🎯',
    taskType: 'weekly',
    requirement: {
      type: 'find_books',
      target: 15,
    },
    rewards: {
      coins: 200,
      arrangementId: 'arrange_theme',
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
  {
    id: 'task_weekly_customer',
    title: '服务之星',
    description: '满足3位顾客的需求',
    icon: '😊',
    taskType: 'weekly',
    requirement: {
      type: 'satisfy_customer',
      target: 3,
    },
    rewards: {
      coins: 150,
      customerId: 'customer_teacher',
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
  {
    id: 'task_weekly_consecutive',
    title: '坚持不懈',
    description: '连续营业5天',
    icon: '🔥',
    taskType: 'weekly',
    requirement: {
      type: 'consecutive_days',
      target: 5,
    },
    rewards: {
      coins: 300,
      hints: 3,
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
];

export const SPECIAL_TASKS: StoreTask[] = [
  {
    id: 'task_special_earn_1000',
    title: '创业初期',
    description: '累计赚取1000金币',
    icon: '💰',
    taskType: 'special',
    requirement: {
      type: 'earn_coins',
      target: 1000,
    },
    rewards: {
      coins: 200,
      arrangementId: 'arrange_year',
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: true,
  },
  {
    id: 'task_special_earn_5000',
    title: '小有成就',
    description: '累计赚取5000金币',
    icon: '🏆',
    taskType: 'special',
    requirement: {
      type: 'earn_coins',
      target: 5000,
    },
    rewards: {
      coins: 500,
      arrangementId: 'arrange_author',
      customerId: 'customer_scientist',
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: false,
  },
  {
    id: 'task_special_earn_10000',
    title: '书店大亨',
    description: '累计赚取10000金币',
    icon: '👑',
    taskType: 'special',
    requirement: {
      type: 'earn_coins',
      target: 10000,
    },
    rewards: {
      coins: 1000,
      arrangementId: 'arrange_custom',
      customerId: 'customer_collector',
    },
    progress: 0,
    completed: false,
    claimed: false,
    unlocked: false,
  },
];

export const getStoreLevel = (reputation: number): number => {
  if (reputation >= 5000) return 10;
  if (reputation >= 3500) return 9;
  if (reputation >= 2500) return 8;
  if (reputation >= 1800) return 7;
  if (reputation >= 1200) return 6;
  if (reputation >= 700) return 5;
  if (reputation >= 400) return 4;
  if (reputation >= 200) return 3;
  if (reputation >= 80) return 2;
  return 1;
};

export const getStoreLevelBonus = (level: number): { scoreMultiplier: number; coinMultiplier: number } => {
  return {
    scoreMultiplier: 1 + (level - 1) * 0.05,
    coinMultiplier: 1 + (level - 1) * 0.1,
  };
};

export const getCoinRewardForBook = (rarity: string, score: number, customerBonus: number = 0): number => {
  const baseCoins: Record<string, number> = {
    common: 5,
    uncommon: 10,
    rare: 20,
    epic: 40,
    legendary: 80,
  };
  const base = baseCoins[rarity] || 5;
  const scoreBonus = Math.floor(score / 100);
  return Math.floor((base + scoreBonus) * (1 + customerBonus / 100));
};

export const getReputationReward = (coins: number, customerSatisfied: boolean): number => {
  const base = Math.floor(coins / 10);
  return customerSatisfied ? base * 2 : base;
};

export const checkCustomerSatisfaction = (customer: CustomerPreference, bookGenre: string, bookRarity: string, bookThemes: string[], decorationSatisfactionBonus: number = 0): { satisfied: boolean; satisfactionGain: number; coinBonus: number } => {
  let matchScore = 0;
  
  if (customer.preferredGenres.includes(bookGenre)) {
    matchScore += 30;
  }
  
  if (customer.preferredRarities.includes(bookRarity)) {
    matchScore += 25;
  }
  
  for (const theme of bookThemes) {
    if (customer.preferredThemes.includes(theme)) {
      matchScore += 15;
      break;
    }
  }
  
  const satisfied = matchScore >= 40;
  const satisfactionGain = satisfied ? Math.floor((matchScore + decorationSatisfactionBonus) / 2) : Math.max(5, Math.floor(decorationSatisfactionBonus / 2));
  const coinBonus = satisfied ? matchScore + decorationSatisfactionBonus : 0;
  
  return { satisfied, satisfactionGain, coinBonus };
};
