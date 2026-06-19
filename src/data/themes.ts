import type { ThemeChallenge, ThemeReward, RarityLevel } from '../types/game';

export const RARITY_CONFIG: Record<RarityLevel, { name: string; color: string; scoreMultiplier: number; icon: string }> = {
  common: { name: '普通', color: '#9CA3AF', scoreMultiplier: 1.0, icon: '📄' },
  uncommon: { name: '稀有', color: '#10B981', scoreMultiplier: 1.2, icon: '📗' },
  rare: { name: '珍贵', color: '#3B82F6', scoreMultiplier: 1.5, icon: '📘' },
  epic: { name: '史诗', color: '#8B5CF6', scoreMultiplier: 2.0, icon: '📕' },
  legendary: { name: '传说', color: '#F59E0B', scoreMultiplier: 3.0, icon: '📙' },
};

export const THEMES: ThemeChallenge[] = [
  {
    id: 'theme_time',
    theme: '时间与记忆',
    icon: '⏰',
    title: '时光倒流',
    description: '探索那些关于时间、记忆和永恒的文学巨著。',
    bookIds: ['b001', 'b004', 'b022', 'b030'],
    bonusScore: 800,
    requiredBooks: 3,
    unlocked: true,
  },
  {
    id: 'theme_china',
    theme: '中国古典',
    icon: '🏯',
    title: '华夏经典',
    description: '穿越千年，品读中国古典文学的不朽魅力。',
    bookIds: ['b003', 'b011', 'b017', 'b023', 'b027', 'b031'],
    bonusScore: 1000,
    requiredBooks: 4,
    unlocked: true,
  },
  {
    id: 'theme_philosophy',
    theme: '哲学智慧',
    icon: '🧠',
    title: '思想者之路',
    description: '与古今哲人对话，探寻生命与宇宙的终极答案。',
    bookIds: ['b010', 'b014', 'b020', 'b026'],
    bonusScore: 700,
    requiredBooks: 3,
    unlocked: true,
  },
  {
    id: 'theme_tech',
    theme: '技术匠心',
    icon: '💻',
    title: '代码诗人',
    description: '领略软件工程的艺术，提升编程技艺与设计思维。',
    bookIds: ['b005', 'b012', 'b019', 'b024', 'b028', 'b032'],
    bonusScore: 900,
    requiredBooks: 4,
    unlocked: true,
  },
  {
    id: 'theme_science',
    theme: '科学探索',
    icon: '🔬',
    title: '万物之理',
    description: '从微观世界到浩瀚宇宙，探索自然的奥秘。',
    bookIds: ['b004', 'b016', 'b022', 'b030'],
    bonusScore: 750,
    requiredBooks: 3,
    unlocked: true,
  },
  {
    id: 'theme_adventure',
    theme: '冒险与探索',
    icon: '🗺️',
    title: '勇敢者的旅程',
    description: '跟随主人公踏上非凡的冒险之旅。',
    bookIds: ['b007', 'b021', 'b023', 'b027'],
    bonusScore: 650,
    requiredBooks: 3,
    unlocked: true,
  },
  {
    id: 'theme_history',
    theme: '历史长河',
    icon: '🏛️',
    title: '以史为鉴',
    description: '回望历史，洞察人类文明的兴衰变迁。',
    bookIds: ['b006', 'b011', 'b017'],
    bonusScore: 600,
    requiredBooks: 2,
    unlocked: true,
  },
  {
    id: 'theme_literature',
    theme: '文学经典',
    icon: '📖',
    title: '文学殿堂',
    description: '品味世界文学史上最璀璨的明珠。',
    bookIds: ['b001', 'b002', 'b009', 'b015', 'b018', 'b025', 'b029'],
    bonusScore: 1200,
    requiredBooks: 5,
    unlocked: true,
  },
];

export const THEME_REWARDS: ThemeReward[] = [
  {
    id: 'reward_time_1',
    themeId: 'theme_time',
    title: '时间旅行者',
    description: '完成"时光倒流"主题挑战',
    icon: '⏳',
    bonusType: 'score',
    value: 500,
    unlocked: false,
  },
  {
    id: 'reward_time_2',
    themeId: 'theme_time',
    title: '记忆大师',
    description: '不使用提示完成"时光倒流"主题',
    icon: '🧠',
    bonusType: 'hints',
    value: 2,
    unlocked: false,
  },
  {
    id: 'reward_china_1',
    themeId: 'theme_china',
    title: '国学大师',
    description: '完成"华夏经典"主题挑战',
    icon: '🎓',
    bonusType: 'score',
    value: 800,
    unlocked: false,
  },
  {
    id: 'reward_china_2',
    themeId: 'theme_china',
    title: '四书五经',
    description: '找到所有中国古典书籍',
    icon: '📜',
    bonusType: 'powerup',
    value: 1,
    unlocked: false,
  },
  {
    id: 'reward_philosophy_1',
    themeId: 'theme_philosophy',
    title: '智慧之人',
    description: '完成"思想者之路"主题挑战',
    icon: '💡',
    bonusType: 'score',
    value: 600,
    unlocked: false,
  },
  {
    id: 'reward_tech_1',
    themeId: 'theme_tech',
    title: '架构师',
    description: '完成"代码诗人"主题挑战',
    icon: '🏗️',
    bonusType: 'score',
    value: 700,
    unlocked: false,
  },
  {
    id: 'reward_tech_2',
    themeId: 'theme_tech',
    title: '10x工程师',
    description: '不使用提示完成"代码诗人"主题',
    icon: '⚡',
    bonusType: 'powerup',
    value: 2,
    unlocked: false,
  },
  {
    id: 'reward_science_1',
    themeId: 'theme_science',
    title: '科学家',
    description: '完成"万物之理"主题挑战',
    icon: '🔭',
    bonusType: 'score',
    value: 650,
    unlocked: false,
  },
  {
    id: 'reward_adventure_1',
    themeId: 'theme_adventure',
    title: '探险家',
    description: '完成"勇敢者的旅程"主题挑战',
    icon: '🧭',
    bonusType: 'hints',
    value: 3,
    unlocked: false,
  },
  {
    id: 'reward_history_1',
    themeId: 'theme_history',
    title: '历史学家',
    description: '完成"以史为鉴"主题挑战',
    icon: '📚',
    bonusType: 'score',
    value: 550,
    unlocked: false,
  },
  {
    id: 'reward_literature_1',
    themeId: 'theme_literature',
    title: '文学巨匠',
    description: '完成"文学殿堂"主题挑战',
    icon: '👑',
    bonusType: 'score',
    value: 1000,
    unlocked: false,
  },
  {
    id: 'reward_all_themes',
    themeId: 'all',
    title: '主题大师',
    description: '完成所有主题挑战',
    icon: '🏆',
    bonusType: 'score',
    value: 2000,
    unlocked: false,
  },
];

export const getThemeById = (id: string): ThemeChallenge | undefined => {
  return THEMES.find(t => t.id === id);
};

export const getThemesForBook = (bookId: string): ThemeChallenge[] => {
  return THEMES.filter(t => t.bookIds.includes(bookId));
};

export const getRewardsForTheme = (themeId: string): ThemeReward[] => {
  return THEME_REWARDS.filter(r => r.themeId === themeId || r.themeId === 'all');
};

export const selectBookByTheme = (themeId: string, excludeIds: string[] = []): string | null => {
  const theme = getThemeById(themeId);
  if (!theme) return null;
  
  const availableBooks = theme.bookIds.filter(id => !excludeIds.includes(id));
  if (availableBooks.length === 0) return null;
  
  return availableBooks[Math.floor(Math.random() * availableBooks.length)];
};
