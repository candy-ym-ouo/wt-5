import { useHint, gameState } from '../store/gameStore';

export default function HintSystem() {
  const state = gameState();

  return (
    <div class="sidebar-section">
      <div class="section-title">
        <span>💡</span>
        <span>提示系统</span>
      </div>
      <button
        class="hint-button"
        onClick={useHint}
        disabled={state.hintsRemaining <= 0 || state.state !== 'playing'}
      >
        使用提示（解锁下一条线索）
      </button>
      <div class="hint-count">
        剩余提示：{state.hintsRemaining} / 5
      </div>
      <div class="hint-count hint-small">
        已使用：{state.hintsUsed} 次
      </div>
    </div>
  );
}
