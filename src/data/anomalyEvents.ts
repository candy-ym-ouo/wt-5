import type {
  AnomalyEvent,
  AnomalyEventType,
  DifficultyLevel,
  GameMode,
  AnomalyEventSchedule,
  AnomalyEventResult,
  AnomalyResolutionOption,
} from '../types/game';

export const ANOMALY_EVENTS: AnomalyEvent[] = [
  {
    id: 'customer_queue_jump_mild',
    type: 'customer_queue_jump',
    title: '顾客插队',
    description: '一位顾客急匆匆地插队，打断了你的找书节奏。需要快速处理这个情况。',
    icon: '👤',
    severity: 'mild',
    effects: [
      {
        type: 'time_penalty',
        value: 8,
        description: '处理纠纷扣除8秒',
      },
    ],
    resolutionOptions: [
      {
        id: 'quick_apology',
        label: '快速道歉',
        description: '礼貌地请对方排队，不浪费太多时间',
        icon: '🙏',
        cost: { time: 5 },
        reward: { score: 30 },
        successRate: 0.9,
      },
      {
        id: 'firm_stand',
        label: '坚定立场',
        description: '严肃制止插队行为，维护秩序',
        icon: '💪',
        cost: { time: 10, score: 20 },
        reward: { score: 80, streakBonus: true },
        successRate: 0.75,
      },
      {
        id: 'ignore',
        label: '忽略',
        description: '继续专注找书，不管此事',
        icon: '😐',
        cost: {},
        reward: {},
        successRate: 0.5,
      },
    ],
    autoResolveAfter: 15000,
    probability: 0.15,
    minLevel: 1,
    maxLevel: 50,
    canCoexistWithRandomEvents: true,
    triggerCondition: {
      afterBooksFound: 2,
    },
  },
  {
    id: 'customer_queue_jump_severe',
    type: 'customer_queue_jump',
    title: '插队纠纷',
    description: '多位顾客因为插队问题发生了激烈争执，整个书店都被惊动了！',
    icon: '😤',
    severity: 'severe',
    effects: [
      {
        type: 'time_penalty',
        value: 15,
        description: '严重干扰，扣除15秒',
      },
      {
        type: 'score_penalty',
        value: 50,
        description: '声誉受损，扣除50分',
      },
    ],
    resolutionOptions: [
      {
        id: 'mediate',
        label: '出面调解',
        description: '作为店长平息双方争端',
        icon: '🤝',
        cost: { time: 12, hints: 1 },
        reward: { score: 150, time: 5, streakBonus: true },
        successRate: 0.7,
      },
      {
        id: 'call_security',
        label: '呼叫安保',
        description: '请保安来处理纠纷',
        icon: '🛡️',
        cost: { score: 80 },
        reward: { time: 8 },
        successRate: 0.95,
      },
    ],
    autoResolveAfter: 20000,
    probability: 0.08,
    minLevel: 5,
    maxLevel: 50,
    difficultyRestriction: ['normal', 'hard', 'expert', 'master'],
    canCoexistWithRandomEvents: false,
    triggerCondition: {
      afterBooksFound: 5,
      consecutiveCorrect: 3,
    },
  },
  {
    id: 'book_misplaced_mild',
    type: 'book_misplaced',
    title: '书籍错架',
    description: '你发现有几本书被放错了位置，可能会影响你的判断。',
    icon: '📚',
    severity: 'mild',
    effects: [
      {
        type: 'book_misplace',
        value: 3,
        duration: 20000,
        description: '3本书位置被打乱，持续20秒',
      },
    ],
    resolutionOptions: [
      {
        id: 'quick_fix',
        label: '快速整理',
        description: '迅速将明显放错的书归位',
        icon: '🔧',
        cost: { time: 6 },
        reward: { score: 40 },
        successRate: 0.85,
      },
      {
        id: 'careful_check',
        label: '仔细核对',
        description: '花时间仔细检查所有相关书籍',
        icon: '🔍',
        cost: { time: 12 },
        reward: { score: 100, hints: 1 },
        successRate: 0.95,
      },
    ],
    autoResolveAfter: 25000,
    probability: 0.14,
    minLevel: 2,
    maxLevel: 50,
    canCoexistWithRandomEvents: true,
  },
  {
    id: 'book_misplaced_moderate',
    type: 'book_misplaced',
    title: '书架混乱',
    description: '一排书架的书籍被大面积弄乱，找书变得异常困难！',
    icon: '🗂️',
    severity: 'moderate',
    effects: [
      {
        type: 'book_misplace',
        value: 8,
        duration: 30000,
        description: '8本书位置错乱，持续30秒',
      },
      {
        type: 'layout_shuffle',
        value: 1,
        description: '部分书架布局被打乱',
      },
    ],
    resolutionOptions: [
      {
        id: 'partial_sort',
        label: '部分整理',
        description: '只整理关键区域的书籍',
        icon: '📖',
        cost: { time: 10, score: 30 },
        reward: { score: 80 },
        successRate: 0.8,
      },
      {
        id: 'full_reorganization',
        label: '全面重组',
        description: '系统性地重新整理整个书架',
        icon: '📋',
        cost: { time: 18, hints: 1 },
        reward: { score: 200, time: 5, streakBonus: true },
        successRate: 0.9,
      },
    ],
    autoResolveAfter: 30000,
    probability: 0.10,
    minLevel: 4,
    maxLevel: 50,
    difficultyRestriction: ['hard', 'expert', 'master'],
    canCoexistWithRandomEvents: false,
  },
  {
    id: 'emergency_closing_warning',
    type: 'emergency_closing',
    title: '临时闭店预警',
    description: '接到通知，书店可能需要提前闭店，时间在流逝！',
    icon: '🚪',
    severity: 'moderate',
    effects: [
      {
        type: 'time_penalty',
        value: 20,
        description: '提前闭店，扣除20秒',
      },
      {
        type: 'multiplier_decrease',
        value: 0.1,
        duration: 20000,
        description: '得分倍率降低10%，持续20秒',
      },
    ],
    resolutionOptions: [
      {
        id: 'rush_search',
        label: '加速搜索',
        description: '利用剩余时间快速找书',
        icon: '⚡',
        cost: { hints: 1 },
        reward: { score: 60, time: 5 },
        successRate: 0.7,
      },
      {
        id: 'negotiate_extension',
        label: '申请延时',
        description: '尝试争取更多营业时间',
        icon: '⏰',
        cost: { score: 100 },
        reward: { time: 25 },
        successRate: 0.6,
      },
    ],
    autoResolveAfter: 18000,
    probability: 0.10,
    minLevel: 3,
    maxLevel: 50,
    canCoexistWithRandomEvents: false,
    triggerCondition: {
      timeRemainingBelow: 60,
    },
  },
  {
    id: 'emergency_closing_critical',
    type: 'emergency_closing',
    title: '紧急闭店！',
    description: '突发情况！书店必须立即关闭，你只有很短的时间完成当前任务！',
    icon: '🚨',
    severity: 'critical',
    effects: [
      {
        type: 'time_penalty',
        value: 35,
        description: '紧急闭店，扣除35秒',
      },
      {
        type: 'streak_break',
        value: 1,
        description: '连击可能被打断',
      },
    ],
    resolutionOptions: [
      {
        id: 'emergency_finish',
        label: '紧急收尾',
        description: '拼尽全力完成当前找书任务',
        icon: '🏃',
        cost: { hints: 2, score: 50 },
        reward: { score: 300, streakBonus: true },
        successRate: 0.5,
      },
      {
        id: 'special_permission',
        label: '特殊通融',
        description: '以老顾客身份申请特殊关照',
        icon: '🎖️',
        cost: { score: 200 },
        reward: { time: 40, hints: 1 },
        successRate: 0.4,
      },
    ],
    autoResolveAfter: 12000,
    probability: 0.05,
    minLevel: 8,
    maxLevel: 50,
    difficultyRestriction: ['expert', 'master'],
    canCoexistWithRandomEvents: false,
    triggerCondition: {
      timeRemainingBelow: 45,
      afterBooksFound: 8,
    },
  },
  {
    id: 'clue_damaged_mild',
    type: 'clue_damaged',
    title: '线索污损',
    description: '一张线索卡片不小心被弄湿了，部分内容变得模糊不清。',
    icon: '💧',
    severity: 'mild',
    effects: [
      {
        type: 'clue_damage',
        value: 1,
        duration: 25000,
        description: '1个线索暂时损坏，持续25秒',
      },
    ],
    resolutionOptions: [
      {
        id: 'blot_dry',
        label: '小心擦干',
        description: '轻轻擦拭受损的线索卡片',
        icon: '🧻',
        cost: { time: 4 },
        reward: { score: 35 },
        successRate: 0.85,
      },
      {
        id: 'memorize_content',
        label: '凭记忆回忆',
        description: '努力回想卡片上的内容',
        icon: '🧠',
        cost: { time: 8 },
        reward: { score: 70, hints: 1 },
        successRate: 0.7,
      },
    ],
    autoResolveAfter: 25000,
    probability: 0.13,
    minLevel: 2,
    maxLevel: 50,
    canCoexistWithRandomEvents: true,
  },
  {
    id: 'clue_damaged_severe',
    type: 'clue_damaged',
    title: '线索大面积损坏',
    description: '意外发生！多张线索卡片被损坏，关键信息可能丢失！',
    icon: '🔥',
    severity: 'severe',
    effects: [
      {
        type: 'clue_damage',
        value: 3,
        duration: 35000,
        description: '3个线索损坏，持续35秒',
      },
      {
        type: 'hint_lock',
        value: 2,
        duration: 20000,
        description: '2种线索类型暂时无法解锁',
      },
      {
        type: 'score_penalty',
        value: 60,
        description: '损失60分',
      },
    ],
    resolutionOptions: [
      {
        id: 'emergency_recovery',
        label: '紧急修复',
        description: '使用特殊手段修复受损线索',
        icon: '🛠️',
        cost: { time: 15, score: 80 },
        reward: { score: 220, hints: 2 },
        successRate: 0.65,
      },
      {
        id: 'alternative_clues',
        label: '寻找替代线索',
        description: '从其他途径获取信息',
        icon: '🗺️',
        cost: { time: 10, hints: 1 },
        reward: { score: 150 },
        successRate: 0.8,
      },
    ],
    autoResolveAfter: 30000,
    probability: 0.06,
    minLevel: 6,
    maxLevel: 50,
    difficultyRestriction: ['hard', 'expert', 'master'],
    canCoexistWithRandomEvents: false,
  },
  {
    id: 'customer_complaint',
    type: 'customer_complaint',
    title: '顾客投诉',
    description: '一位顾客对服务表示不满，需要你出面处理。',
    icon: '😠',
    severity: 'moderate',
    effects: [
      {
        type: 'score_penalty',
        value: 40,
        description: '声誉下降，扣除40分',
      },
      {
        type: 'time_penalty',
        value: 10,
        description: '处理投诉消耗10秒',
      },
    ],
    resolutionOptions: [
      {
        id: 'sincere_apology',
        label: '真诚道歉',
        description: '诚恳地向顾客致歉并补偿',
        icon: '💐',
        cost: { score: 60, time: 6 },
        reward: { score: 120, streakBonus: true },
        successRate: 0.85,
      },
      {
        id: 'explain_policy',
        label: '解释规则',
        description: '耐心说明书店的相关规定',
        icon: '📜',
        cost: { time: 12 },
        reward: { score: 60 },
        successRate: 0.6,
      },
      {
        id: 'offer_discount',
        label: '提供优惠',
        description: '以折扣券安抚顾客情绪',
        icon: '🎫',
        cost: { hints: 1 },
        reward: { score: 180, time: 3 },
        successRate: 0.9,
      },
    ],
    autoResolveAfter: 20000,
    probability: 0.11,
    minLevel: 3,
    maxLevel: 50,
    canCoexistWithRandomEvents: true,
  },
  {
    id: 'water_leak',
    type: 'water_leak',
    title: '水管漏水',
    description: '天花板开始滴水，有书籍可能被淋湿！',
    icon: '🚿',
    severity: 'moderate',
    effects: [
      {
        type: 'time_penalty',
        value: 12,
        description: '处理漏水消耗12秒',
      },
      {
        type: 'book_obscure',
        value: 1,
        duration: 25000,
        description: '部分区域书籍视野受阻',
      },
    ],
    resolutionOptions: [
      {
        id: 'quick_containment',
        label: '快速围堵',
        description: '用容器接住漏水防止扩散',
        icon: '🪣',
        cost: { time: 8 },
        reward: { score: 90 },
        successRate: 0.8,
      },
      {
        id: 'evacuate_books',
        label: '转移书籍',
        description: '将受威胁的书籍搬到安全区域',
        icon: '📦',
        cost: { time: 15, score: 20 },
        reward: { score: 160, hints: 1, streakBonus: true },
        successRate: 0.9,
      },
    ],
    autoResolveAfter: 22000,
    probability: 0.09,
    minLevel: 4,
    maxLevel: 50,
    difficultyRestriction: ['normal', 'hard', 'expert', 'master'],
    canCoexistWithRandomEvents: true,
  },
  {
    id: 'book_theft',
    type: 'book_theft',
    title: '可疑人员',
    description: '发现有人行为鬼祟，似乎想偷书！',
    icon: '🕵️',
    severity: 'severe',
    effects: [
      {
        type: 'score_penalty',
        value: 100,
        description: '如果被盗将损失100分',
      },
      {
        type: 'consecutive_reset',
        value: 1,
        description: '连续正确记录可能被重置',
      },
    ],
    resolutionOptions: [
      {
        id: 'confront_directly',
        label: '当面质问',
        description: '直接上前阻止可疑行为',
        icon: '👮',
        cost: { time: 15, score: 30 },
        reward: { score: 250, streakBonus: true },
        successRate: 0.7,
      },
      {
        id: 'silent_observation',
        label: '暗中观察',
        description: '悄悄收集证据后再行动',
        icon: '👀',
        cost: { time: 20 },
        reward: { score: 200, hints: 2 },
        successRate: 0.85,
      },
    ],
    autoResolveAfter: 18000,
    probability: 0.05,
    minLevel: 7,
    maxLevel: 50,
    difficultyRestriction: ['hard', 'expert', 'master'],
    canCoexistWithRandomEvents: false,
    triggerCondition: {
      scoreAbove: 500,
    },
  },
  {
    id: 'power_surge',
    type: 'power_surge',
    title: '电压不稳',
    description: '灯光忽明忽暗，电力系统出现异常！',
    icon: '⚡',
    severity: 'moderate',
    effects: [
      {
        type: 'book_obscure',
        value: 1,
        duration: 15000,
        description: '照明不稳，书籍辨认困难',
      },
      {
        type: 'time_penalty',
        value: 8,
        description: '受干扰消耗8秒',
      },
    ],
    resolutionOptions: [
      {
        id: 'use_flashlight',
        label: '打开手电',
        description: '使用备用照明设备',
        icon: '🔦',
        cost: { hints: 1 },
        reward: { score: 70, time: 3 },
        successRate: 0.95,
      },
      {
        id: 'wait_it_out',
        label: '耐心等待',
        description: '等电力系统自己稳定下来',
        icon: '⏳',
        cost: { time: 12 },
        reward: { score: 40 },
        successRate: 0.7,
      },
    ],
    autoResolveAfter: 15000,
    probability: 0.08,
    minLevel: 2,
    maxLevel: 50,
    canCoexistWithRandomEvents: true,
  },
];

export const getAnomalyEventById = (id: string): AnomalyEvent | undefined => {
  return ANOMALY_EVENTS.find(e => e.id === id);
};

export const getAnomalyEventsByType = (type: AnomalyEventType): AnomalyEvent[] => {
  return ANOMALY_EVENTS.filter(e => e.type === type);
};

export const getEligibleAnomalyEvents = (
  level: number,
  difficulty: DifficultyLevel,
  gameMode: GameMode,
  schedule: AnomalyEventSchedule,
  booksFound: number,
  consecutiveCorrect: number,
  consecutiveWrong: number,
  timeRemaining: number,
  currentScore: number
): AnomalyEvent[] => {
  return ANOMALY_EVENTS.filter(event => {
    if (level < event.minLevel || level > event.maxLevel) return false;
    if (event.difficultyRestriction && !event.difficultyRestriction.includes(difficulty)) return false;
    if (event.gameModeRestriction && !event.gameModeRestriction.includes(gameMode)) return false;
    if (schedule.allowedEventTypes.length > 0 && !schedule.allowedEventTypes.includes(event.type)) return false;
    if (schedule.forbiddenEventTypes.length > 0 && schedule.forbiddenEventTypes.includes(event.type)) return false;

    if (schedule.triggerConditionsEnabled && event.triggerCondition) {
      const tc = event.triggerCondition;
      if (tc.afterBooksFound !== undefined && booksFound < tc.afterBooksFound) return false;
      if (tc.afterRounds !== undefined && level < tc.afterRounds) return false;
      if (tc.consecutiveCorrect !== undefined && consecutiveCorrect < tc.consecutiveCorrect) return false;
      if (tc.consecutiveWrong !== undefined && consecutiveWrong < tc.consecutiveWrong) return false;
      if (tc.timeRemainingBelow !== undefined && timeRemaining > tc.timeRemainingBelow) return false;
      if (tc.scoreAbove !== undefined && currentScore < tc.scoreAbove) return false;
    }

    return true;
  });
};

export const selectAnomalyEvent = (
  level: number,
  difficulty: DifficultyLevel,
  gameMode: GameMode,
  schedule: AnomalyEventSchedule,
  lastEventTime: number,
  eventsTriggeredThisGame: number,
  booksFound: number,
  consecutiveCorrect: number,
  consecutiveWrong: number,
  timeRemaining: number,
  currentScore: number
): AnomalyEvent | null => {
  if (!schedule.enabled) return null;

  const now = Date.now();
  if (now - lastEventTime < schedule.minIntervalMs) return null;
  if (eventsTriggeredThisGame >= schedule.maxEventsPerGame) return null;

  const eligibleEvents = getEligibleAnomalyEvents(
    level, difficulty, gameMode, schedule,
    booksFound, consecutiveCorrect, consecutiveWrong,
    timeRemaining, currentScore
  );

  if (eligibleEvents.length === 0) return null;

  const severityWeightedEvents: AnomalyEvent[] = [];
  for (const event of eligibleEvents) {
    const weight = schedule.severityWeights[event.severity] || 0.1;
    const customProb = schedule.customProbabilities?.[event.id];
    const probability = customProb !== undefined ? customProb : event.probability;
    const finalWeight = probability * weight;
    const count = Math.ceil(finalWeight * 100);
    for (let i = 0; i < count; i++) {
      severityWeightedEvents.push(event);
    }
  }

  if (severityWeightedEvents.length === 0) {
    return eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
  }

  return severityWeightedEvents[Math.floor(Math.random() * severityWeightedEvents.length)];
};

export const calculateAnomalyEventImpact = (event: AnomalyEvent): {
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

export const resolveAnomalyEventWithOption = (
  event: AnomalyEvent,
  option: AnomalyResolutionOption | null
): AnomalyEventResult => {
  let scoreAdjustment = 0;
  let timeAdjustment = 0;
  let hintAdjustment = 0;
  const messages: string[] = [];
  let streakPreserved = false;
  let success = true;

  const baseImpact = calculateAnomalyEventImpact(event);
  scoreAdjustment += baseImpact.scoreAdjustment;
  timeAdjustment += baseImpact.timeAdjustment;
  messages.push(...baseImpact.messages);

  if (option) {
    success = Math.random() < option.successRate;

    if (option.cost.time) timeAdjustment -= option.cost.time;
    if (option.cost.score) scoreAdjustment -= option.cost.score;
    if (option.cost.hints) hintAdjustment -= option.cost.hints;

    if (success) {
      if (option.reward.time) timeAdjustment += option.reward.time;
      if (option.reward.score) scoreAdjustment += option.reward.score;
      if (option.reward.hints) hintAdjustment += option.reward.hints;
      if (option.reward.streakBonus) streakPreserved = true;

      if (option.reward.time) messages.push(`获得 ${option.reward.time} 秒时间奖励`);
      if (option.reward.score) messages.push(`获得 ${option.reward.score} 分奖励`);
      if (option.reward.hints) messages.push(`获得 ${option.reward.hints} 个提示`);
      if (option.reward.streakBonus) messages.push('连击得以保持！');
    } else {
      messages.push(`${option.label} 失败了...`);
      scoreAdjustment -= 30;
    }
  } else {
    success = false;
    messages.push('未及时处理，事件自动结束');
  }

  return {
    event,
    resolution: option,
    success,
    scoreAdjustment,
    timeAdjustment,
    hintAdjustment,
    messages,
    streakPreserved,
  };
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'mild': return '#4CAF50';
    case 'moderate': return '#FF9800';
    case 'severe': return '#F44336';
    case 'critical': return '#9C27B0';
    default: return '#757575';
  }
};

export const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case 'mild': return '轻微';
    case 'moderate': return '中等';
    case 'severe': return '严重';
    case 'critical': return '紧急';
    default: return '未知';
  }
};
