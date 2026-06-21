import type { TouringExhibition } from '../types/touringExhibition';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

const formatDate = (y: number, m: number, d: number): string => {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export const TOURING_EXHIBITIONS: TouringExhibition[] = [
  {
    id: 'exhibition_beijing_2026',
    type: 'city',
    title: '北京·古都书香',
    subtitle: '北京站',
    description: '穿越千年古都，品味书香韵味。本次巡展汇集了众多古典文学珍品，让你在字里行间感受京城的历史沉淀与文化底蕴。',
    icon: '🏯',
    city: '北京',
    cityIcon: '🏯',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(year, month + 1, 15),
    bookIds: ['b003', 'b011', 'b017', 'b023', 'b027', 'b031'],
    requiredBooks: 4,
    ruleAdjustments: [
      {
        id: 'rule_bj_1',
        description: '古典书籍得分 x1.5',
        effectType: 'score_multiplier',
        value: 1.5,
        condition: '仅适用于"古典"类书籍'
      },
      {
        id: 'rule_bj_2',
        description: '初始提示 +2',
        effectType: 'hint_count',
        value: 2
      },
      {
        id: 'rule_bj_3',
        description: '金币收益 x1.2',
        effectType: 'coin_multiplier',
        value: 1.2
      }
    ],
    limitedCollection: [
      {
        id: 'coll_bj_1',
        bookId: 'reward_003',
        title: '炼丹术秘典',
        description: '先秦炼丹方士的秘典，记载长生不老药的炼制方法与惊天秘密。',
        icon: '📜',
        rarity: 'legendary',
        unlockCondition: '收集5本北京展区书籍',
        unlockThreshold: 5,
        exclusive: true,
        expiresAfterExhibition: true
      },
      {
        id: 'coll_bj_2',
        bookId: 'reward_006',
        title: '茶馆遗闻录',
        description: '清末落魄文人在茶馆听来的奇闻轶事，其中隐藏着太平天国宝藏的线索。',
        icon: '🏮',
        rarity: 'rare',
        unlockCondition: '北京展区完成度达到100%',
        unlockThreshold: 6,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 1500, description: '北京站参与奖励' },
      { type: 'score', value: 2000 },
      { type: 'points', value: 300 }
    ],
    completionReward: [
      { type: 'coins', value: 3000, description: '北京站完成大奖' },
      { type: 'achievement', value: 1, achievementId: 'beijing_exhibition_complete' },
      { type: 'title', value: 1, titleId: 'beijing_book_hunter' }
    ],
    backgroundStyle: 'beijing',
    tags: ['城市巡展', '古典', '限时'],
    featured: true
  },
  {
    id: 'exhibition_shanghai_2026',
    type: 'city',
    title: '上海·摩登书影',
    subtitle: '上海站',
    description: '十里洋场，摩登时代。上海站带你领略民国时期的文学风华与现代都市的科技魅力，在传统与现代的碰撞中感受阅读的乐趣。',
    icon: '🌆',
    city: '上海',
    cityIcon: '🌆',
    startDate: formatDate(year, month + 1, 16),
    endDate: formatDate(year, month + 2, 30),
    bookIds: ['b005', 'b012', 'b019', 'b024', 'b028', 'b032'],
    requiredBooks: 5,
    ruleAdjustments: [
      {
        id: 'rule_sh_1',
        description: '技术书籍得分 x1.6',
        effectType: 'score_multiplier',
        value: 1.6,
        condition: '仅适用于"技术"类书籍'
      },
      {
        id: 'rule_sh_2',
        description: '每局时间 +15秒',
        effectType: 'time_bonus',
        value: 15
      },
      {
        id: 'rule_sh_3',
        description: '稀有度提升一级',
        effectType: 'rarity_boost',
        value: 1
      }
    ],
    limitedCollection: [
      {
        id: 'coll_sh_1',
        bookId: 'reward_004',
        title: '机械图纸集',
        description: '维多利亚时代天才工程师的私人图纸，其中一份是世界上第一台计算机的雏形。',
        icon: '⚙️',
        rarity: 'rare',
        unlockCondition: '收集4本上海展区书籍',
        unlockThreshold: 4,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 1800 },
      { type: 'score', value: 2500 },
      { type: 'powerup', value: 3, powerUpType: 'eliminate_wrong' }
    ],
    completionReward: [
      { type: 'coins', value: 3500 },
      { type: 'achievement', value: 1, achievementId: 'shanghai_exhibition_complete' },
      { type: 'title', value: 1, titleId: 'shanghai_book_hunter' }
    ],
    backgroundStyle: 'shanghai',
    tags: ['城市巡展', '科技', '限时']
  },
  {
    id: 'exhibition_chengdu_2026',
    type: 'city',
    title: '成都·诗酒年华',
    subtitle: '成都站',
    description: '天府之国，诗酒之乡。成都站以诗词歌赋与闲适生活为主题，在熊猫故乡的慢节奏中，品味文学与生活的美好交融。',
    icon: '🐼',
    city: '成都',
    cityIcon: '🐼',
    startDate: formatDate(year, month + 3, 1),
    endDate: formatDate(year, month + 4, 15),
    bookIds: ['b008', 'b013', 'b015', 'b018', 'b025', 'b029'],
    requiredBooks: 4,
    ruleAdjustments: [
      {
        id: 'rule_cd_1',
        description: '文学书籍得分 x1.4',
        effectType: 'score_multiplier',
        value: 1.4,
        condition: '仅适用于"文学"类书籍'
      },
      {
        id: 'rule_cd_2',
        description: '金币收益 x1.3',
        effectType: 'coin_multiplier',
        value: 1.3
      },
      {
        id: 'rule_cd_3',
        description: '初始提示 +3',
        effectType: 'hint_count',
        value: 3
      }
    ],
    limitedCollection: [
      {
        id: 'coll_cd_1',
        bookId: 'reward_001',
        title: '失佚的诗篇',
        description: '一位落魄诗人在漂泊中写下的诗篇，书页间夹着干枯的蓝色花瓣。',
        icon: '🌸',
        rarity: 'rare',
        unlockCondition: '收集5本成都展区书籍',
        unlockThreshold: 5,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 1200 },
      { type: 'score', value: 1800 },
      { type: 'hints', value: 8 }
    ],
    completionReward: [
      { type: 'coins', value: 2800 },
      { type: 'achievement', value: 1, achievementId: 'chengdu_exhibition_complete' }
    ],
    backgroundStyle: 'chengdu',
    tags: ['城市巡展', '文学', '限时']
  },
  {
    id: 'exhibition_time_memory',
    type: 'theme',
    title: '时间与记忆',
    subtitle: '主题展',
    description: '时间是什么？记忆可靠吗？本次主题展汇集了关于时间、记忆与存在的思考著作，让我们在阅读中探索人类认知的边界。',
    icon: '⏳',
    theme: '时间与记忆',
    startDate: formatDate(year, month, now.getDate() > 10 ? now.getDate() - 10 : 1),
    endDate: formatDate(year, month, now.getDate() + 20 > 31 ? 31 : now.getDate() + 20),
    bookIds: ['b001', 'b004', 'b022', 'b030', 'reward_005'],
    requiredBooks: 3,
    ruleAdjustments: [
      {
        id: 'rule_time_1',
        description: '科普书籍得分 x1.5',
        effectType: 'score_multiplier',
        value: 1.5,
        condition: '仅适用于"科普"类书籍'
      },
      {
        id: 'rule_time_2',
        description: '每局时间 +10秒',
        effectType: 'time_bonus',
        value: 10
      }
    ],
    limitedCollection: [
      {
        id: 'coll_time_1',
        bookId: 'reward_005',
        title: '星象观测录',
        description: '文艺复兴时期天文学家的观测记录，绘有当时所有星座与一份神秘预言。',
        icon: '✨',
        rarity: 'epic',
        unlockCondition: '主题展完成度达到100%',
        unlockThreshold: 5,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 1000 },
      { type: 'score', value: 1500 },
      { type: 'powerup', value: 2, powerUpType: 'time_peek' }
    ],
    completionReward: [
      { type: 'coins', value: 2500 },
      { type: 'achievement', value: 1, achievementId: 'time_exhibition_complete' }
    ],
    backgroundStyle: 'time',
    tags: ['主题展', '科普', '限时'],
    featured: true
  },
  {
    id: 'exhibition_adventure',
    type: 'theme',
    title: '冒险与探索',
    subtitle: '主题展',
    description: '人类的冒险精神永不止息。从南极到北极，从深海到太空，本次主题展带你跟随冒险家的脚步，探索未知的边界。',
    icon: '🗺️',
    theme: '冒险与探索',
    startDate: formatDate(year, month + 2, 1),
    endDate: formatDate(year, month + 3, 15),
    bookIds: ['b007', 'b013', 'b017', 'b021', 'b023', 'b027', 'reward_002', 'reward_007'],
    requiredBooks: 5,
    ruleAdjustments: [
      {
        id: 'rule_adv_1',
        description: '稀有书籍出现概率提升',
        effectType: 'rarity_boost',
        value: 1
      },
      {
        id: 'rule_adv_2',
        description: '得分倍率 x1.3',
        effectType: 'score_multiplier',
        value: 1.3
      },
      {
        id: 'rule_adv_3',
        description: '金币收益 x1.25',
        effectType: 'coin_multiplier',
        value: 1.25
      }
    ],
    limitedCollection: [
      {
        id: 'coll_adv_1',
        bookId: 'reward_002',
        title: '航海日志残卷',
        description: '18世纪航海家寻找传说中黄金岛的冒险日志，船队沉没后唯一幸存的记录。',
        icon: '🧭',
        rarity: 'epic',
        unlockCondition: '收集6本冒险主题书籍',
        unlockThreshold: 6,
        exclusive: true,
        expiresAfterExhibition: true
      },
      {
        id: 'coll_adv_2',
        bookId: 'reward_007',
        title: '极地探险日记',
        description: '20世纪初极地探险家向北极点进发的壮举记录，探险队唯一幸存的遗物。',
        icon: '❄️',
        rarity: 'epic',
        unlockCondition: '冒险主题展完成度100%',
        unlockThreshold: 8,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 1600 },
      { type: 'score', value: 2200 },
      { type: 'points', value: 250 }
    ],
    completionReward: [
      { type: 'coins', value: 3200 },
      { type: 'achievement', value: 1, achievementId: 'adventure_exhibition_complete' },
      { type: 'title', value: 1, titleId: 'adventure_explorer' }
    ],
    backgroundStyle: 'adventure',
    tags: ['主题展', '冒险', '限时']
  },
  {
    id: 'exhibition_philosophy',
    type: 'theme',
    title: '哲学智慧',
    subtitle: '主题展',
    description: '我是谁？我从哪里来？要到哪里去？这些永恒的问题困扰着一代又一代的思想家。本次主题展带你走进哲学的殿堂。',
    icon: '🏛️',
    theme: '哲学智慧',
    startDate: formatDate(year, month + 4, 16),
    endDate: formatDate(year, month + 5, 30),
    bookIds: ['b010', 'b014', 'b018', 'b020', 'b026'],
    requiredBooks: 4,
    ruleAdjustments: [
      {
        id: 'rule_phi_1',
        description: '哲学书籍得分 x1.5',
        effectType: 'score_multiplier',
        value: 1.5,
        condition: '仅适用于"哲学"类书籍'
      },
      {
        id: 'rule_phi_2',
        description: '初始提示 +2',
        effectType: 'hint_count',
        value: 2
      }
    ],
    limitedCollection: [
      {
        id: 'coll_phi_1',
        bookId: 'reward_003',
        title: '炼丹术秘典',
        description: '先秦炼丹方士的秘典，记载长生不老药的炼制方法与惊天秘密。',
        icon: '📜',
        rarity: 'legendary',
        unlockCondition: '哲学主题展完成度100%',
        unlockThreshold: 5,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 1400 },
      { type: 'score', value: 2000 },
      { type: 'hints', value: 10 }
    ],
    completionReward: [
      { type: 'coins', value: 3000 },
      { type: 'achievement', value: 1, achievementId: 'philosophy_exhibition_complete' }
    ],
    backgroundStyle: 'philosophy',
    tags: ['主题展', '哲学', '限时']
  },
  {
    id: 'exhibition_science_tech',
    type: 'theme',
    title: '科学探索与技术匠心',
    subtitle: '主题展',
    description: '从宇宙的起源到人工智能的未来，科学技术正在重塑我们的世界。本次主题展汇集科学普及与技术经典，探索人类文明的科技之光。',
    icon: '🔬',
    theme: '科学技术',
    startDate: formatDate(year, month + 5, 1),
    endDate: formatDate(year, month + 6, 15),
    bookIds: ['b004', 'b005', 'b012', 'b016', 'b019', 'b024', 'b028', 'b030', 'b032', 'reward_004', 'reward_005', 'reward_008'],
    requiredBooks: 6,
    ruleAdjustments: [
      {
        id: 'rule_st_1',
        description: '科普/技术书籍得分 x1.8',
        effectType: 'score_multiplier',
        value: 1.8,
        condition: '仅适用于"科普"和"技术"类书籍'
      },
      {
        id: 'rule_st_2',
        description: '稀有度提升一级',
        effectType: 'rarity_boost',
        value: 1
      },
      {
        id: 'rule_st_3',
        description: '金币收益 x1.4',
        effectType: 'coin_multiplier',
        value: 1.4
      },
      {
        id: 'rule_st_4',
        description: '每局时间 +20秒',
        effectType: 'time_bonus',
        value: 20
      }
    ],
    limitedCollection: [
      {
        id: 'coll_st_1',
        bookId: 'reward_008',
        title: '本草补遗',
        description: '明代铃医的手稿，记载许多失传草药与偏方，包括神秘的"百日眠"奇药。',
        icon: '🌿',
        rarity: 'legendary',
        unlockCondition: '收集8本科技主题书籍',
        unlockThreshold: 8,
        exclusive: true,
        expiresAfterExhibition: true
      },
      {
        id: 'coll_st_2',
        bookId: 'reward_004',
        title: '机械图纸集',
        description: '维多利亚时代天才工程师的私人图纸，其中一份是世界上第一台计算机的雏形。',
        icon: '⚙️',
        rarity: 'rare',
        unlockCondition: '收集5本科技主题书籍',
        unlockThreshold: 5,
        exclusive: true,
        expiresAfterExhibition: true
      }
    ],
    rewards: [
      { type: 'coins', value: 2000 },
      { type: 'score', value: 3000 },
      { type: 'powerup', value: 5, powerUpType: 'time_peek' },
      { type: 'points', value: 500 }
    ],
    completionReward: [
      { type: 'coins', value: 5000 },
      { type: 'achievement', value: 1, achievementId: 'science_tech_exhibition_complete' },
      { type: 'title', value: 1, titleId: 'science_explorer' }
    ],
    backgroundStyle: 'science',
    tags: ['主题展', '科学', '技术', '限时'],
    featured: true
  }
];

export const getActiveExhibitions = (dateKey: string): TouringExhibition[] => {
  return TOURING_EXHIBITIONS.filter(ex => ex.startDate <= dateKey && dateKey <= ex.endDate);
};

export const getUpcomingExhibitions = (dateKey: string): TouringExhibition[] => {
  return TOURING_EXHIBITIONS.filter(ex => dateKey < ex.startDate);
};

export const getCompletedExhibitions = (dateKey: string): TouringExhibition[] => {
  return TOURING_EXHIBITIONS.filter(ex => dateKey > ex.endDate);
};

export const getExhibitionById = (id: string): TouringExhibition | undefined => {
  return TOURING_EXHIBITIONS.find(ex => ex.id === id);
};

export const getFeaturedExhibitions = (dateKey: string): TouringExhibition[] => {
  return getActiveExhibitions(dateKey).filter(ex => ex.featured);
};
