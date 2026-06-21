import type { Customer, EraPreference, ThemePreference } from '../types/game';
import { BOOKS } from './books';
import { getUnlockedWorkshopRewardIds } from '../utils/workshopStorage';

const getAvailableBooks = (): Book[] => {
  const unlockedRewardIds = getUnlockedWorkshopRewardIds();
  return BOOKS.filter(b => !b.workshopReward || unlockedRewardIds.has(b.id));
};
import type { Book } from '../types/game';

export const CUSTOMERS: Customer[] = [
  { id: 'c001', name: '林教授', avatar: '👨‍🏫', personality: '严谨的学者，追求真知', satisfactionBase: 80 },
  { id: 'c002', name: '苏小姐', avatar: '👩‍💼', personality: '文艺青年，情感细腻', satisfactionBase: 85 },
  { id: 'c003', name: '王大爷', avatar: '👴', personality: '怀旧老人，喜欢老故事', satisfactionBase: 75 },
  { id: 'c004', name: '陈工程师', avatar: '👨‍💻', personality: '务实理性，重视实用', satisfactionBase: 78 },
  { id: 'c005', name: '李诗人', avatar: '🧑‍🎨', personality: '浪漫主义，充满幻想', satisfactionBase: 88 },
  { id: 'c006', name: '张医生', avatar: '👩‍⚕️', personality: '冷静客观，追求真理', satisfactionBase: 82 },
  { id: 'c007', name: '赵学生', avatar: '👧', personality: '好奇宝宝，求知欲强', satisfactionBase: 90 },
  { id: 'c008', name: '孙商人', avatar: '🧔', personality: '精明世故，讲究实用', satisfactionBase: 70 },
  { id: 'c009', name: '周法师', avatar: '🧙', personality: '神秘莫测，喜欢玄学', satisfactionBase: 86 },
  { id: 'c010', name: '吴记者', avatar: '👩‍🎤', personality: '敏锐好奇，追求深度', satisfactionBase: 84 },
  { id: 'c011', name: '郑老农', avatar: '👨‍🌾', personality: '朴实无华，喜欢接地气', satisfactionBase: 76 },
  { id: 'c012', name: '冯导演', avatar: '🎬', personality: '艺术气质，追求完美', satisfactionBase: 87 },
];

const VAGUE_DESCRIPTIONS: Record<string, string[]> = {
  '哲学智慧': [
    '想找一本能让人静下心来思考人生的书，关于存在的意义那种感觉',
    '最近对东方古代的智慧很感兴趣，想读一些关于道和无为的内容',
    '想要一本探讨人类心灵深处的书，最好是那种皇帝写的日记',
    '对西方哲学感兴趣，特别是关于理想社会和正义的讨论',
    '想找关于辩证思考、资本与劳动关系的经典著作',
  ],
  '文学经典': [
    '想读一本很厚的、能让人沉浸很久的长篇小说，最好是那种写了很多年的',
    '找一本讲家族兴衰的书，要有魔幻的色彩在里面',
    '想要一本关于时间和记忆的书，听说有个点心和茶的场景很有名',
    '想找一本写画家追求艺术的书，关于月亮和六便士的选择',
    '想读一本在荒岛上独自生活的故事，关于生存与孤独',
    '想要一本关于青春反叛的书，主人公是个十六岁的少年',
  ],
  '中国古典': [
    '想找一本中国古代的神话小说，里面有只很厉害的猴子',
    '对中国古代大家族的故事感兴趣，有个大观园的场景',
    '想读关于三国时期英雄豪杰的故事，桃园三结义那种',
    '想要一本中国历史上最有名的兵法书，作者骑着青牛出关',
    '想找关于梁山好汉的故事，一百零八将那种',
  ],
  '历史长河': [
    '想了解人类从哪里来、到哪里去，从宏观角度看人类发展',
    '想要一本关于中国历史的巨著，作者受了宫刑还坚持写完',
    '对拿破仑时代的俄国感兴趣，想读史诗级的战争小说',
    '想了解从古代到现代的人类整体历史脉络',
  ],
  '科学探索': [
    '想找一本讲宇宙和时间的科普书，作者坐在轮椅上',
    '对昆虫世界很感兴趣，想看一个人花三十年观察虫子的笔记',
    '想要了解宇宙的终极理论，从大爆炸到黑洞都有',
    '想找关于进化论和自然选择的经典著作',
  ],
  '技术匠心': [
    '作为程序员，想找一本关于代码质量和最佳实践的厚书',
    '想找一本软件工程的经典，关于设计模式的，有四个人写的',
    '想要一本算法领域的圣经，MIT四位教授写的',
    '对项目管理感兴趣，特别是关于人月神话和没有银弹的论断',
    '想找关于硅谷创业和黑客文化的随笔集',
  ],
  '冒险与探索': [
    '想找一本科幻小说，关于外星文明和黑暗森林法则的',
    '想要一个在荒岛上独自生存二十多年的故事',
    '对太空探索和人类命运的科幻巨著感兴趣',
    '想找关于飞行员和小王子的童话，写给大人看的',
    '想读关于西天取经的神话冒险，九九八十一难',
  ],
  '时间与记忆': [
    '想找一本关于记忆和时间的法国小说，有玛德莱娜蛋糕的情节',
    '对宇宙时间的起源感兴趣，科普类的就行',
    '想要一本关于万物理论和时间箭头的书',
  ],
};

export const THEME_OPTIONS: ThemePreference[] = [
  '哲学智慧',
  '文学经典',
  '中国古典',
  '历史长河',
  '科学探索',
  '技术匠心',
  '冒险与探索',
  '时间与记忆',
];

export const ERA_OPTIONS: EraPreference[] = ['古代', '近代', '现代', '当代', '任意'];

const THEME_TO_GENRES: Record<string, string[]> = {
  '哲学智慧': ['哲学'],
  '文学经典': ['文学', '散文', '童话'],
  '中国古典': ['古典', '哲学'],
  '历史长河': ['历史', '古典'],
  '科学探索': ['科普'],
  '技术匠心': ['技术'],
  '冒险与探索': ['科幻', '古典', '童话', '文学'],
  '时间与记忆': ['文学', '科普'],
};

export const getBooksByTheme = (theme: ThemePreference): Book[] => {
  const genres = THEME_TO_GENRES[theme] || [];
  return getAvailableBooks().filter(b => genres.includes(b.genre) || b.themes.includes(theme));
};

export const getBooksByEra = (era: EraPreference): Book[] => {
  const available = getAvailableBooks();
  switch (era) {
    case '古代':
      return available.filter(b => b.year < 1600);
    case '近代':
      return available.filter(b => b.year >= 1600 && b.year < 1900);
    case '现代':
      return available.filter(b => b.year >= 1900 && b.year < 1980);
    case '当代':
      return available.filter(b => b.year >= 1980);
    case '任意':
    default:
      return available;
  }
};

export const getEraForYear = (year: number): EraPreference => {
  if (year < 1600) return '古代';
  if (year < 1900) return '近代';
  if (year < 1980) return '现代';
  return '当代';
};

export const getRandomDescription = (theme: ThemePreference): string => {
  const descriptions = VAGUE_DESCRIPTIONS[theme] || VAGUE_DESCRIPTIONS['文学经典'];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

export const getRandomCustomer = (): Customer => {
  return CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
};

export const getRandomTheme = (): ThemePreference => {
  return THEME_OPTIONS[Math.floor(Math.random() * THEME_OPTIONS.length)];
};

export const getRandomEra = (): EraPreference => {
  const withAny: EraPreference[] = [...ERA_OPTIONS, '任意', '任意'];
  return withAny[Math.floor(Math.random() * withAny.length)];
};

export const calculateCommissionRewards = (
  matchScore: number,
  timeRemainingPercent: number,
  customerBase: number,
  streak: number
) => {
  const baseCoins = 50;
  const baseReputation = 10;
  
  const scoreMultiplier = matchScore / 100;
  const timeMultiplier = 0.5 + timeRemainingPercent * 0.5;
  const streakMultiplier = 1 + Math.min(streak * 0.1, 1);
  const customerMultiplier = customerBase / 80;
  
  const coins = Math.floor(baseCoins * scoreMultiplier * timeMultiplier * streakMultiplier * customerMultiplier);
  const reputation = Math.floor(baseReputation * scoreMultiplier * streakMultiplier * customerMultiplier);
  
  return { coins, reputation };
};

export const DIFFICULTY_TIME_MAP = {
  easy: 120,
  normal: 90,
  hard: 75,
  expert: 60,
  master: 45,
};
