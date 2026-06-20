import { createMemo, createSignal, createEffect } from 'solid-js';
import { useHint, useFreeHint, useTimePeek, useEliminateWrong, getPeekTimeRemaining, gameState, getDifficultyInfo, isHintFrozen, getHintFreezeRemaining, getWrongPenaltyInfo, lockedClueTypes } from '../store/gameStore';
import { getDifficultyConfig } from '../data/difficulty';
import { POWER_UP_CONFIGS } from '../data/powerUps';
import { CLUE_TYPE_NAMES } from '../data/clues';

export default function HintSystem() {
  const state = createMemo(() => gameState());
  const diffInfo = createMemo(() => getDifficultyInfo());
  const hintsRemaining = createMemo(() => state().hintsRemaining);
  const hintsUsed = createMemo(() => state().hintsUsed);
  const isPlaying = createMemo(() => state().state === 'playing');
  const isDisabled = createMemo(() => hintsRemaining() <= 0 || !isPlaying() || isHintFrozen());
  const maxHints = createMemo(() => getDifficultyConfig(state().difficultyLevel).initialHints);
  const diffConfig = createMemo(() => diffInfo().config);
  const isDynamic = createMemo(() => diffInfo().mode === 'dynamic');
  const wrongPenaltyInfo = createMemo(() => getWrongPenaltyInfo());
  const lockedTypes = createMemo(() => lockedClueTypes());

  const powerUps = createMemo(() => state().powerUps);
  const [peekTime, setPeekTime] = createSignal(0);
  const [freezeRemaining, setFreezeRemaining] = createSignal(0);

  createEffect(() => {
    if (powerUps().peekActive) {
      const interval = setInterval(() => {
        setPeekTime(getPeekTimeRemaining());
      }, 200);
      return () => clearInterval(interval);
    } else {
      setPeekTime(0);
    }
  });

  createEffect(() => {
    if (isHintFrozen()) {
      const interval = setInterval(() => {
        setFreezeRemaining(getHintFreezeRemaining());
      }, 200);
      return () => clearInterval(interval);
    } else {
      setFreezeRemaining(0);
    }
  });

  const freeHintDisabled = createMemo(() => 
    powerUps().freeHints <= 0 || !isPlaying() || isHintFrozen()
  );

  const timePeekDisabled = createMemo(() => 
    powerUps().timePeeks <= 0 || !isPlaying() || powerUps().peekActive
  );

  const eliminateWrongDisabled = createMemo(() => 
    powerUps().eliminateWrongs <= 0 || !isPlaying()
  );

  return (
    <div class="sidebar-section">
      <div class="section-title">
        <span>💡</span>
        <span>提示系统</span>
      </div>
      
      <div class="difficulty-info">
        <div class="difficulty-badge">
          <span class="difficulty-icon">{diffConfig().icon}</span>
          <span class="difficulty-name">{diffConfig().name}</span>
          {isDynamic() && <span class="difficulty-mode">动态</span>}
        </div>
        <div class="difficulty-multiplier">
          得分倍率: x{diffConfig().scoreMultiplier}
        </div>
      </div>

      <button
        class={`hint-button ${isHintFrozen() ? 'hint-frozen' : ''}`}
        onClick={useHint}
        disabled={isDisabled()}
      >
        {isHintFrozen() 
          ? `❄️ 提示已冻结 (${freezeRemaining()}s)` 
          : '使用提示（解锁下一条线索）'}
      </button>
      <div class="hint-count">
        剩余提示：{hintsRemaining()} / {maxHints()}
      </div>
      <div class="hint-count hint-small">
        已使用：{hintsUsed()} 次
      </div>
      <div class="hint-penalty">
        每次提示扣分：{diffConfig().hintPenalty}
      </div>

      {lockedTypes().size > 0 && (
        <div class="locked-clue-types-info">
          <div class="locked-clue-title">🔒 以下线索类型暂时失效：</div>
          <div class="locked-clue-list">
            {Array.from(lockedTypes()).map(type => (
              <span class="locked-clue-tag">{CLUE_TYPE_NAMES[type as keyof typeof CLUE_TYPE_NAMES]}</span>
            ))}
          </div>
        </div>
      )}

      {wrongPenaltyInfo().consecutiveWrong > 0 && isPlaying() && (
        <div class={`consecutive-wrong-info penalty-${wrongPenaltyInfo().currentLevel || 'warning'}`}>
          <div class="wrong-info-title">
            ⚠️ 连续误选：{wrongPenaltyInfo().consecutiveWrong} 次
          </div>
          <div class="wrong-info-stats">
            累计扣时：{wrongPenaltyInfo().totalTimePenalty}s · 扣分：{wrongPenaltyInfo().totalScorePenalty}
          </div>
          {wrongPenaltyInfo().consecutiveWrong >= 2 && (
            <div class="wrong-info-hint">
              {wrongPenaltyInfo().consecutiveWrong >= 3 
                ? '已触发提示冻结！'
                : '再错1次将触发提示冻结'}
            </div>
          )}
        </div>
      )}

      <div class="section-title powerup-title">
        <span>🎁</span>
        <span>道具</span>
      </div>

      <div class="powerup-list">
        <button
          class="powerup-button"
          onClick={useFreeHint}
          disabled={freeHintDisabled()}
          title={POWER_UP_CONFIGS.free_hint.description}
        >
          <span class="powerup-icon">{POWER_UP_CONFIGS.free_hint.icon}</span>
          <span class="powerup-name">{POWER_UP_CONFIGS.free_hint.name}</span>
          <span class="powerup-count">x{powerUps().freeHints}</span>
        </button>

        <button
          class="powerup-button"
          onClick={useTimePeek}
          disabled={timePeekDisabled()}
          title={POWER_UP_CONFIGS.time_peek.description}
        >
          <span class="powerup-icon">{POWER_UP_CONFIGS.time_peek.icon}</span>
          <span class="powerup-name">{POWER_UP_CONFIGS.time_peek.name}</span>
          <span class="powerup-count">
            {powerUps().peekActive ? `${peekTime()}s` : `x${powerUps().timePeeks}`}
          </span>
        </button>

        <button
          class="powerup-button"
          onClick={useEliminateWrong}
          disabled={eliminateWrongDisabled()}
          title={POWER_UP_CONFIGS.eliminate_wrong.description}
        >
          <span class="powerup-icon">{POWER_UP_CONFIGS.eliminate_wrong.icon}</span>
          <span class="powerup-name">{POWER_UP_CONFIGS.eliminate_wrong.name}</span>
          <span class="powerup-count">x{powerUps().eliminateWrongs}</span>
        </button>
      </div>

      <div class="powerup-penalties">
        <div class="penalty-item">
          <span>{POWER_UP_CONFIGS.time_peek.icon}</span>
          <span>扣分：{POWER_UP_CONFIGS.time_peek.scorePenalty}</span>
        </div>
        <div class="penalty-item">
          <span>{POWER_UP_CONFIGS.eliminate_wrong.icon}</span>
          <span>扣分：{POWER_UP_CONFIGS.eliminate_wrong.scorePenalty}</span>
        </div>
      </div>

      {powerUps().eliminatedBookIds.length > 0 && (
        <div class="eliminated-info">
          已排除 {powerUps().eliminatedBookIds.length} 本错误书籍
        </div>
      )}
    </div>
  );
}
