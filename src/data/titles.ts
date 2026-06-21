import type { PlayerTitle } from '../types/account';

export const TITLES: PlayerTitle[] = [
  {
    id: 'title_newbie',
    title: '初心者',
    icon: '🌱',
    description: '刚刚踏入旧书店的新人',
    category: 'special',
    rarity: 'common',
    color: '#9ca3af',
    unlocked: true,
    condition: '默认称号，创建账号即解锁',
  },
  {
    id: 'title_first_book',
    title: '初窥门径',
    icon: '📖',
    description: '找到第一本书',
    category: 'achievement',
    rarity: 'common',
    color: '#22c55e',
    unlocked: false,
    condition: '完成成就「初窥门径」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_streak_3',
    title: '连中三元',
    icon: '🍀',
    description: '连续找到3本书',
    category: 'streak',
    rarity: 'common',
    color: '#22c55e',
    unlocked: false,
    condition: '达成3连胜',
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'title_streak_5',
    title: '手感火热',
    icon: '🔥',
    description: '连续找到5本书',
    category: 'streak',
    rarity: 'uncommon',
    color: '#f97316',
    unlocked: false,
    condition: '达成5连胜',
    requirement: { type: 'streak', value: 5 },
  },
  {
    id: 'title_streak_8',
    title: '势如破竹',
    icon: '⚡',
    description: '连续找到8本书',
    category: 'streak',
    rarity: 'uncommon',
    color: '#eab308',
    unlocked: false,
    condition: '达成8连胜',
    requirement: { type: 'streak', value: 8 },
  },
  {
    id: 'title_streak_12',
    title: '神乎其技',
    icon: '💎',
    description: '连续找到12本书',
    category: 'streak',
    rarity: 'rare',
    color: '#06b6d4',
    unlocked: false,
    condition: '达成12连胜',
    requirement: { type: 'streak', value: 12 },
  },
  {
    id: 'title_streak_16',
    title: '独孤求败',
    icon: '🏆',
    description: '连续找到16本书',
    category: 'streak',
    rarity: 'epic',
    color: '#a855f7',
    unlocked: false,
    condition: '达成16连胜',
    requirement: { type: 'streak', value: 16 },
  },
  {
    id: 'title_streak_20',
    title: '传说之境',
    icon: '👑',
    description: '连续找到20本书',
    category: 'streak',
    rarity: 'legendary',
    color: '#ef4444',
    unlocked: false,
    condition: '达成20连胜',
    requirement: { type: 'streak', value: 20 },
  },
  {
    id: 'title_streak_30',
    title: '神话级',
    icon: '🌟',
    description: '连续找到30本书',
    category: 'streak',
    rarity: 'legendary',
    color: '#ec4899',
    unlocked: false,
    condition: '达成30连胜',
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'title_collector_1',
    title: '初入书阁',
    icon: '📚',
    description: '在收藏册中收录1本书',
    category: 'collection',
    rarity: 'common',
    color: '#22c55e',
    unlocked: false,
    condition: '收藏1本书',
    requirement: { type: 'collection', value: 1 },
  },
  {
    id: 'title_collector_5',
    title: '小有所藏',
    icon: '📕',
    description: '在收藏册中收录5本书',
    category: 'collection',
    rarity: 'common',
    color: '#84cc16',
    unlocked: false,
    condition: '收藏5本书',
    requirement: { type: 'collection', value: 5 },
  },
  {
    id: 'title_collector_10',
    title: '藏书之家',
    icon: '🏠',
    description: '在收藏册中收录10本书',
    category: 'collection',
    rarity: 'uncommon',
    color: '#eab308',
    unlocked: false,
    condition: '收藏10本书',
    requirement: { type: 'collection', value: 10 },
  },
  {
    id: 'title_collector_20',
    title: '藏书名家',
    icon: '🏛️',
    description: '在收藏册中收录20本书',
    category: 'collection',
    rarity: 'rare',
    color: '#06b6d4',
    unlocked: false,
    condition: '收藏20本书',
    requirement: { type: 'collection', value: 20 },
  },
  {
    id: 'title_collector_32',
    title: '满室书香',
    icon: '👑',
    description: '在收藏册中收录全部32本书',
    category: 'collection',
    rarity: 'legendary',
    color: '#f59e0b',
    unlocked: false,
    condition: '收藏全部32本书',
    requirement: { type: 'collection', value: 32 },
  },
  {
    id: 'title_score_1000',
    title: '千分达人',
    icon: '🎯',
    description: '单局得分达到1000分',
    category: 'score',
    rarity: 'common',
    color: '#22c55e',
    unlocked: false,
    condition: '单局得分≥1000',
    requirement: { type: 'score', value: 1000 },
  },
  {
    id: 'title_score_3000',
    title: '三千勇士',
    icon: '⚔️',
    description: '单局得分达到3000分',
    category: 'score',
    rarity: 'uncommon',
    color: '#f97316',
    unlocked: false,
    condition: '单局得分≥3000',
    requirement: { type: 'score', value: 3000 },
  },
  {
    id: 'title_score_5000',
    title: '五千精锐',
    icon: '🛡️',
    description: '单局得分达到5000分',
    category: 'score',
    rarity: 'rare',
    color: '#eab308',
    unlocked: false,
    condition: '单局得分≥5000',
    requirement: { type: 'score', value: 5000 },
  },
  {
    id: 'title_score_10000',
    title: '万分大师',
    icon: '👑',
    description: '单局得分达到10000分',
    category: 'score',
    rarity: 'epic',
    color: '#a855f7',
    unlocked: false,
    condition: '单局得分≥10000',
    requirement: { type: 'score', value: 10000 },
  },
  {
    id: 'title_score_20000',
    title: '传说猎手',
    icon: '🌟',
    description: '单局得分达到20000分',
    category: 'score',
    rarity: 'legendary',
    color: '#ef4444',
    unlocked: false,
    condition: '单局得分≥20000',
    requirement: { type: 'score', value: 20000 },
  },
  {
    id: 'title_games_10',
    title: '常客',
    icon: '🎮',
    description: '累计游玩10局游戏',
    category: 'achievement',
    rarity: 'common',
    color: '#22c55e',
    unlocked: false,
    condition: '累计游玩10局',
    requirement: { type: 'games_played', value: 10 },
  },
  {
    id: 'title_games_50',
    title: '爱好者',
    icon: '🎖️',
    description: '累计游玩50局游戏',
    category: 'achievement',
    rarity: 'uncommon',
    color: '#f97316',
    unlocked: false,
    condition: '累计游玩50局',
    requirement: { type: 'games_played', value: 50 },
  },
  {
    id: 'title_games_100',
    title: '达人',
    icon: '🏆',
    description: '累计游玩100局游戏',
    category: 'achievement',
    rarity: 'rare',
    color: '#eab308',
    unlocked: false,
    condition: '累计游玩100局',
    requirement: { type: 'games_played', value: 100 },
  },
  {
    id: 'title_books_50',
    title: '博览群书',
    icon: '📚',
    description: '累计找到50本书',
    category: 'achievement',
    rarity: 'uncommon',
    color: '#22c55e',
    unlocked: false,
    condition: '累计找到50本书',
    requirement: { type: 'books_found', value: 50 },
  },
  {
    id: 'title_books_100',
    title: '学富五车',
    icon: '🎓',
    description: '累计找到100本书',
    category: 'achievement',
    rarity: 'rare',
    color: '#06b6d4',
    unlocked: false,
    condition: '累计找到100本书',
    requirement: { type: 'books_found', value: 100 },
  },
  {
    id: 'title_books_200',
    title: '万卷书行者',
    icon: '✨',
    description: '累计找到200本书',
    category: 'achievement',
    rarity: 'epic',
    color: '#a855f7',
    unlocked: false,
    condition: '累计找到200本书',
    requirement: { type: 'books_found', value: 200 },
  },
  {
    id: 'title_purist',
    title: '纯粹主义者',
    icon: '✨',
    description: '全程不使用任何道具完成一局游戏',
    category: 'special',
    rarity: 'rare',
    color: '#06b6d4',
    unlocked: false,
    condition: '完成成就「纯粹主义者」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_speed_demon',
    title: '闪电之手',
    icon: '⚡',
    description: '最快找到时间低于10秒',
    category: 'special',
    rarity: 'epic',
    color: '#eab308',
    unlocked: false,
    condition: '完成成就「闪电之手」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_master_no_hints',
    title: '无字天书',
    icon: '📜',
    description: '在大师难度下不使用提示找到一本书',
    category: 'special',
    rarity: 'legendary',
    color: '#ef4444',
    unlocked: false,
    condition: '完成成就「无字天书」',
    requirement: { type: 'achievement', value: 1, difficulty: 'master' },
  },
  {
    id: 'title_genre_master',
    title: '博采众长',
    icon: '🌈',
    description: '在收藏册中收录至少5个不同类别的书籍',
    category: 'special',
    rarity: 'rare',
    color: '#a855f7',
    unlocked: false,
    condition: '完成成就「博采众长」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_story_completed',
    title: '传承之人',
    icon: '👑',
    description: '完成剧情模式，成为旧书店的传承人',
    category: 'special',
    rarity: 'legendary',
    color: '#f59e0b',
    unlocked: false,
    condition: '完成成就「传承之人」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_story_s_rank',
    title: '完美传承',
    icon: '🌟',
    description: '在剧情模式中获得S级评价',
    category: 'special',
    rarity: 'legendary',
    color: '#ec4899',
    unlocked: false,
    condition: '完成成就「完美传承」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_season_top1',
    title: '赛季之王',
    icon: '👑',
    description: '赛季总榜排名第一',
    category: 'season',
    rarity: 'legendary',
    color: '#fbbf24',
    unlocked: false,
    condition: '赛季总榜排名第一',
    requirement: { type: 'season_rank', value: 1 },
  },
  {
    id: 'title_season_top3',
    title: '赛季前三',
    icon: '🥉',
    description: '赛季总榜排名前三',
    category: 'season',
    rarity: 'epic',
    color: '#cd7f32',
    unlocked: false,
    condition: '赛季总榜排名前三',
    requirement: { type: 'season_rank', value: 3 },
  },
  {
    id: 'title_weekly_champion',
    title: '周冠之王',
    icon: '🏆',
    description: '周榜排名第一',
    category: 'season',
    rarity: 'rare',
    color: '#fbbf24',
    unlocked: false,
    condition: '周榜排名第一',
    requirement: { type: 'season_rank', value: 1 },
  },
  {
    id: 'title_event_survivor',
    title: '处变不惊',
    icon: '🎯',
    description: '累计经历10次随机事件',
    category: 'special',
    rarity: 'uncommon',
    color: '#06b6d4',
    unlocked: false,
    condition: '完成成就「处变不惊」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_event_collector',
    title: '见多识广',
    icon: '🎪',
    description: '经历过所有类型的随机事件',
    category: 'special',
    rarity: 'rare',
    color: '#a855f7',
    unlocked: false,
    condition: '完成成就「见多识广」',
    requirement: { type: 'achievement', value: 1 },
  },
  {
    id: 'title_all_achievements',
    title: '全成就大师',
    icon: '🏅',
    description: '解锁所有成就',
    category: 'special',
    rarity: 'legendary',
    color: '#fbbf24',
    unlocked: false,
    condition: '解锁所有成就',
    requirement: { type: 'achievement', value: 100 },
  },
];

export const getTitleById = (id: string): PlayerTitle | undefined => {
  return TITLES.find(t => t.id === id);
};

export const getTitlesByCategory = (category: string): PlayerTitle[] => {
  return TITLES.filter(t => t.category === category);
};

export const getTitlesByRarity = (rarity: string): PlayerTitle[] => {
  return TITLES.filter(t => t.rarity === rarity);
};

export const getDefaultTitle = (): PlayerTitle => {
  return TITLES[0];
};

export const getRarityName = (rarity: string): string => {
  const names: Record<string, string> = {
    common: '普通',
    uncommon: '稀有',
    rare: '珍贵',
    epic: '史诗',
    legendary: '传说',
  };
  return names[rarity] || rarity;
};

export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    streak: '连胜',
    achievement: '成就',
    collection: '收藏',
    score: '分数',
    special: '特殊',
    season: '赛季',
  };
  return names[category] || category;
};

export const checkTitleUnlock = (
  title: PlayerTitle,
  stats: {
    longestStreak: number;
    highestScore: number;
    totalGamesPlayed: number;
    totalBooksFound: number;
    collectionCount: number;
    unlockedAchievements: string[];
    seasonRank?: number;
  }
): boolean => {
  if (title.unlocked) return true;
  if (!title.requirement) return false;

  const req = title.requirement;

  switch (req.type) {
    case 'streak':
      return stats.longestStreak >= req.value;
    case 'score':
      return stats.highestScore >= req.value;
    case 'collection':
      return stats.collectionCount >= req.value;
    case 'games_played':
      return stats.totalGamesPlayed >= req.value;
    case 'books_found':
      return stats.totalBooksFound >= req.value;
    case 'season_rank':
      return stats.seasonRank !== undefined && stats.seasonRank <= req.value;
    case 'achievement':
      if (req.difficulty) {
        return stats.unlockedAchievements.some(id => 
          ACHIEVEMENT_TITLE_MAP[id] === title.id || 
          stats.unlockedAchievements.length >= req.value
        );
      }
      return stats.unlockedAchievements.length >= req.value || 
             stats.unlockedAchievements.some(id => ACHIEVEMENT_TITLE_MAP[id] === title.id);
    default:
      return false;
  }
};

const ACHIEVEMENT_TITLE_MAP: Record<string, string> = {
  'first_book': 'title_first_book',
  'purist': 'title_purist',
  'speed_demon': 'title_speed_demon',
  'master_no_hints': 'title_master_no_hints',
  'genre_master': 'title_genre_master',
  'story_completed': 'title_story_completed',
  'story_s_rank': 'title_story_s_rank',
  'weekly_champion': 'title_weekly_champion',
  'season_top3': 'title_season_top3',
  'event_survivor': 'title_event_survivor',
  'event_collector': 'title_event_collector',
};
