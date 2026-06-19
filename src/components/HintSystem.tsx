import { createMemo } from 'solid-js';
import { useHint, gameState, getDifficultyInfo } from '../store/gameStore';
import { getDifficultyConfig } from '../data/difficulty';

export default function HintSystem() {
  const state = createMemo(() => gameState());
  const diffInfo = createMemo(() => getDifficultyInfo());
  const hintsRemaining = createMemo(() => state().hintsRemaining);
  const hintsUsed = createMemo(() => state().hintsUsed);
  const isPlaying = createMemo(() => state().state === 'playing');
  const isDisabled = createMemo(() => hintsRemaining() <= 0 || !isPlaying());
  const maxHints = createMemo(() => getDifficultyConfig(state().difficultyLevel).initialHints);
  const diffConfig = createMemo(() => diffInfo().config);
  const isDynamic = createMemo(() => diffInfo().mode === 'dynamic');

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
        class="hint-button"
        onClick={useHint}
        disabled={isDisabled()}
      >
        使用提示（解锁下一条线索）
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
    </div>
  );
}
