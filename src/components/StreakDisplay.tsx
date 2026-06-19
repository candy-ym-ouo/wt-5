import { createMemo } from 'solid-js';
import { getStreakInfo } from '../store/gameStore';
import { getStreakTitle, getStreakReward } from '../data/streaks';

interface StreakDisplayProps {
  compact?: boolean;
}

export default function StreakDisplay(props: StreakDisplayProps) {
  const streakInfo = createMemo(() => getStreakInfo());
  const title = createMemo(() => getStreakTitle(streakInfo().currentStreak));
  const nextReward = createMemo(() => {
    const current = streakInfo().currentStreak;
    return getStreakReward(current + 1);
  });

  if (streakInfo().currentStreak === 0 && props.compact) {
    return null;
  }

  if (props.compact) {
    return (
      <div class="streak-display compact">
        <span class="streak-icon">{title().icon}</span>
        <span class="streak-count">{streakInfo().currentStreak}</span>
        <span class="streak-label">连胜</span>
      </div>
    );
  }

  const badgeStyle = {
    'border-color': title().color,
  } as any;

  const textColorStyle = {
    color: title().color,
  } as any;

  const progressStyle = {
    width: nextReward() 
      ? `${(streakInfo().currentStreak / (nextReward()?.minStreak || 1)) * 100}%`
      : '0%',
    'background-color': title().color,
  } as any;

  return (
    <div class="streak-display-card">
      <div class="streak-header">
        <div class="streak-title-badge" style={badgeStyle}>
          <span class="streak-badge-icon">{title().icon}</span>
          <span class="streak-badge-title" style={textColorStyle}>
            {title().title}
          </span>
        </div>
        <div class="streak-count-large" style={textColorStyle}>
          {streakInfo().currentStreak}
          <span class="streak-unit">局连胜</span>
        </div>
      </div>

      {nextReward() && (
        <div class="streak-progress-section">
          <div class="streak-progress-label">
            下一个奖励：{nextReward()!.minStreak} 连胜
          </div>
          <div class="streak-progress-bar">
            <div
              class="streak-progress-fill"
              style={progressStyle}
            />
          </div>
          <div class="streak-reward-preview">
            {nextReward()!.bonusScore > 0 && (
              <span class="streak-reward-item">+{nextReward()!.bonusScore} 分</span>
            )}
            {nextReward()!.bonusTime > 0 && (
              <span class="streak-reward-item">+{nextReward()!.bonusTime} 秒</span>
            )}
            {nextReward()!.bonusHints > 0 && (
              <span class="streak-reward-item">+{nextReward()!.bonusHints} 提示</span>
            )}
          </div>
        </div>
      )}

      <div class="streak-stats">
        <div class="streak-stat">
          <div class="streak-stat-value">{streakInfo().bestStreak}</div>
          <div class="streak-stat-label">最高连胜</div>
        </div>
        <div class="streak-stat">
          <div class="streak-stat-value">x{streakInfo().multiplier.toFixed(1)}</div>
          <div class="streak-stat-label">分数加成</div>
        </div>
        <div class="streak-stat">
          <div class="streak-stat-value">{streakInfo().totalBonusScore}</div>
          <div class="streak-stat-label">连胜奖励分</div>
        </div>
      </div>

      {streakInfo().inherited && (
        <div class="streak-inherited-badge">
          🔥 继承连胜
        </div>
      )}
    </div>
  );
}
