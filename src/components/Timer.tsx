import { gameState } from '../store/gameStore';

export default function Timer() {
  const state = gameState();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = state.timeRemaining <= 30;

  return (
    <div class="stat-item">
      <div class="stat-label">⏱️ 剩余时间</div>
      <div class={`stat-value ${isWarning ? 'time-warning' : ''}`}>
        {formatTime(state.timeRemaining)}
      </div>
    </div>
  );
}
