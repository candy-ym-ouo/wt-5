import { createMemo } from 'solid-js';
import { useHint, gameState } from '../store/gameStore';

export default function HintSystem() {
  const state = createMemo(() => gameState());
  const hintsRemaining = createMemo(() => state().hintsRemaining);
  const hintsUsed = createMemo(() => state().hintsUsed);
  const isPlaying = createMemo(() => state().state === 'playing');
  const isDisabled = createMemo(() => hintsRemaining() <= 0 || !isPlaying());

  return (
    <div class="sidebar-section">
      <div class="section-title">
        <span>💡</span>
        <span>提示系统</span>
      </div>
      <button
        class="hint-button"
        onClick={useHint}
        disabled={isDisabled()}
      >
        使用提示（解锁下一条线索）
      </button>
      <div class="hint-count">
        剩余提示：{hintsRemaining()} / 5
      </div>
      <div class="hint-count hint-small">
        已使用：{hintsUsed()} 次
      </div>
    </div>
  );
}
