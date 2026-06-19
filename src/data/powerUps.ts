import type { PowerUpConfig, PowerUpType, DifficultyLevel } from '../types/game';

export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  free_hint: {
    id: 'free_hint',
    name: '免费提示',
    description: '免费解锁一条线索，不消耗普通提示，不扣分',
    icon: '💡',
    scorePenalty: 0,
    initialCount: 2,
  },
  time_peek: {
    id: 'time_peek',
    name: '限时透视',
    description: '在限定时间内高亮显示目标书籍位置',
    icon: '👁️',
    scorePenalty: 150,
    initialCount: 1,
    peekDuration: 8,
  },
  eliminate_wrong: {
    id: 'eliminate_wrong',
    name: '排除错误项',
    description: '自动排除2本错误的书籍，缩小选择范围',
    icon: '❌',
    scorePenalty: 100,
    initialCount: 1,
    eliminateCount: 2,
  },
};

export const getPowerUpConfig = (type: PowerUpType): PowerUpConfig => {
  return POWER_UP_CONFIGS[type];
};

export const getInitialPowerUpsByDifficulty = (difficulty: DifficultyLevel) => {
  const multipliers: Record<DifficultyLevel, number> = {
    easy: 1.5,
    normal: 1.0,
    hard: 0.7,
    expert: 0.5,
    master: 0.3,
  };
  const mult = multipliers[difficulty];

  return {
    freeHints: Math.max(1, Math.floor(POWER_UP_CONFIGS.free_hint.initialCount * mult)),
    timePeeks: Math.max(0, Math.floor(POWER_UP_CONFIGS.time_peek.initialCount * mult)),
    eliminateWrongs: Math.max(0, Math.floor(POWER_UP_CONFIGS.eliminate_wrong.initialCount * mult)),
  };
};

export const createInitialPowerUpState = (difficulty: DifficultyLevel) => {
  const initial = getInitialPowerUpsByDifficulty(difficulty);
  return {
    freeHints: initial.freeHints,
    timePeeks: initial.timePeeks,
    eliminateWrongs: initial.eliminateWrongs,
    peekActive: false,
    peekEndTime: 0,
    eliminatedBookIds: [],
    powerUpsUsedThisRound: {
      freeHints: 0,
      timePeeks: 0,
      eliminateWrongs: 0,
    },
    powerUpsUsedTotal: {
      freeHints: 0,
      timePeeks: 0,
      eliminateWrongs: 0,
    },
  };
};

export const calculatePowerUpPenalty = (
  powerUpsUsed: { freeHints: number; timePeeks: number; eliminateWrongs: number }
): number => {
  let penalty = 0;
  penalty += powerUpsUsed.freeHints * POWER_UP_CONFIGS.free_hint.scorePenalty;
  penalty += powerUpsUsed.timePeeks * POWER_UP_CONFIGS.time_peek.scorePenalty;
  penalty += powerUpsUsed.eliminateWrongs * POWER_UP_CONFIGS.eliminate_wrong.scorePenalty;
  return penalty;
};

export const hasUsedAnyPowerUp = (
  powerUpsUsed: { freeHints: number; timePeeks: number; eliminateWrongs: number }
): boolean => {
  return powerUpsUsed.freeHints > 0 || powerUpsUsed.timePeeks > 0 || powerUpsUsed.eliminateWrongs > 0;
};
