import type { RandomEvent, DifficultyLevel, GameMode } from '../types/game';

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'power_outage',
    type: 'power_outage',
    title: '突然停电',
    description: '书店突然停电了！在黑暗中找书更加困难...',
    icon: '💡',
    effects: [
      {
        type: 'time_penalty',
        value: 15,
        description: '扣除15秒时间',
      },
      {
        type: 'book_obscure',
        value: 1,
        duration: 10000,
        description: '书籍在10秒内难以辨认',
      },
    ],
    probability: 0.12,
    minLevel: 2,
    maxLevel: 50,
    difficultyRestriction: ['normal', 'hard', 'expert', 'master'],
    positive: false,
  },
  {
    id: 'shelf_rearrange',
    type: 'shelf_rearrange',
    title: '书架重排',
    description: '管理员突然重新排列了书架！书籍位置发生了变化。',
    icon: '📚',
    effects: [
      {
        type: 'layout_shuffle',
        value: 1,
        description: '书架上的书籍被重新排列',
      },
      {
        type: 'score_penalty',
        value: 50,
        description: '扣除50分（整理混乱的时间）',
      },
    ],
    probability: 0.10,
    minLevel: 3,
    maxLevel: 50,
    positive: false,
  },
  {
    id: 'hint_failure',
    type: 'hint_failure',
    title: '提示失效',
    description: '某些线索卡片变得模糊不清，暂时无法使用...',
    icon: '❓',
    effects: [
      {
        type: 'hint_lock',
        value: 2,
        duration: 15000,
        description: '2个线索在15秒内无法解锁',
      },
      {
        type: 'clue_hide',
        value: 1,
        duration: 15000,
        description: '1个已解锁的线索暂时隐藏',
      },
    ],
    probability: 0.10,
    minLevel: 2,
    maxLevel: 50,
    difficultyRestriction: ['hard', 'expert', 'master'],
    positive: false,
  },
  {
    id: 'time_warp',
    type: 'time_warp',
    title: '时光扭曲',
    description: '神秘的力量扭曲了时间！时间流逝变得不稳定...',
    icon: '⏳',
    effects: [
      {
        type: 'time_penalty',
        value: 10,
        description: '时间加速流逝，扣除10秒',
      },
      {
        type: 'score_boost',
        value: 100,
        description: '但你获得了100分的神秘奖励',
      },
    ],
    probability: 0.08,
    minLevel: 4,
    maxLevel: 50,
    positive: false,
  },
  {
    id: 'bonus_round',
    type: 'bonus_round',
    title: '奖励回合',
    description: '幸运！这是一个奖励回合，你将获得额外的好处！',
    icon: '🎁',
    effects: [
      {
        type: 'time_bonus',
        value: 20,
        description: '获得20秒额外时间',
      },
      {
        type: 'score_boost',
        value: 150,
        description: '获得150分额外奖励',
      },
    ],
    probability: 0.10,
    minLevel: 1,
    maxLevel: 50,
    positive: true,
  },
  {
    id: 'fog_of_war',
    type: 'fog_of_war',
    title: '迷雾笼罩',
    description: '神秘的迷雾笼罩了书店，书架变得模糊不清...',
    icon: '🌫️',
    effects: [
      {
        type: 'book_obscure',
        value: 1,
        duration: 12000,
        description: '所有书籍在12秒内变得模糊',
      },
      {
        type: 'score_penalty',
        value: 30,
        description: '扣除30分',
      },
    ],
    probability: 0.08,
    minLevel: 3,
    maxLevel: 50,
    difficultyRestriction: ['expert', 'master'],
    positive: false,
  },
  {
    id: 'lucky_find',
    type: 'lucky_find',
    title: '幸运发现',
    description: '你在书架角落发现了一些有用的东西！',
    icon: '🍀',
    effects: [
      {
        type: 'clue_reveal',
        value: 2,
        description: '自动解锁2个额外线索',
      },
      {
        type: 'score_boost',
        value: 80,
        description: '获得80分额外奖励',
      },
    ],
    probability: 0.10,
    minLevel: 1,
    maxLevel: 50,
    positive: true,
  },
  {
    id: 'curse_of_doubt',
    type: 'curse_of_doubt',
    title: '怀疑诅咒',
    description: '你被怀疑的情绪笼罩，即使正确的选择也会让你犹豫...',
    icon: '😰',
    effects: [
      {
        type: 'book_false_highlight',
        value: 3,
        duration: 8000,
        description: '3本错误的书籍会被错误地高亮显示',
      },
      {
        type: 'score_penalty',
        value: 40,
        description: '扣除40分',
      },
    ],
    probability: 0.08,
    minLevel: 5,
    maxLevel: 50,
    difficultyRestriction: ['hard', 'expert', 'master'],
    positive: false,
  },
];

export const getRandomEventById = (id: string): RandomEvent | undefined => {
  return RANDOM_EVENTS.find(e => e.id === id);
};

export const getEligibleRandomEvents = (
  level: number,
  difficulty: DifficultyLevel,
  gameMode: GameMode
): RandomEvent[] => {
  return RANDOM_EVENTS.filter(event => {
    if (level < event.minLevel || level > event.maxLevel) return false;
    if (event.difficultyRestriction && !event.difficultyRestriction.includes(difficulty)) return false;
    if (event.gameModeRestriction && !event.gameModeRestriction.includes(gameMode)) return false;
    return true;
  });
};

export const selectRandomEvent = (
  level: number,
  difficulty: DifficultyLevel,
  gameMode: GameMode,
  lastEventTime: number,
  minIntervalMs: number = 15000
): RandomEvent | null => {
  const now = Date.now();
  if (now - lastEventTime < minIntervalMs) return null;

  const eligibleEvents = getEligibleRandomEvents(level, difficulty, gameMode);
  if (eligibleEvents.length === 0) return null;

  const totalProbability = eligibleEvents.reduce((sum, e) => sum + e.probability, 0);
  let random = Math.random() * totalProbability;

  for (const event of eligibleEvents) {
    random -= event.probability;
    if (random <= 0) {
      return event;
    }
  }

  return eligibleEvents[0];
};

export const calculateRandomEventImpact = (event: RandomEvent): {
  scoreAdjustment: number;
  timeAdjustment: number;
  messages: string[];
} => {
  let scoreAdjustment = 0;
  let timeAdjustment = 0;
  const messages: string[] = [];

  for (const effect of event.effects) {
    switch (effect.type) {
      case 'score_boost':
        scoreAdjustment += effect.value;
        break;
      case 'score_penalty':
        scoreAdjustment -= effect.value;
        break;
      case 'time_bonus':
        timeAdjustment += effect.value;
        break;
      case 'time_penalty':
        timeAdjustment -= effect.value;
        break;
    }
    messages.push(effect.description);
  }

  return { scoreAdjustment, timeAdjustment, messages };
};
