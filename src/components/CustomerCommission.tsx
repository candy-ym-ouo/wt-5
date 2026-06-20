import { createMemo, Component } from 'solid-js';
import { getCommissionInfo, isCommissionMode, getAverageSatisfaction, acceptNextCommission, dismissCommissionResultPopup, showCommissionResultPopup } from '../store/gameStore';

const getEraColor = (era: string): string => {
  const colors: Record<string, string> = {
    '古代': '#DAA520',
    '近代': '#CD853F',
    '现代': '#4682B4',
    '当代': '#32CD32',
    '任意': '#9370DB',
  };
  return colors[era] || '#888';
};

const getSatisfactionColor = (score: number): string => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const getSatisfactionEmoji = (score: number): string => {
  if (score >= 80) return '😍';
  if (score >= 60) return '😊';
  if (score >= 40) return '😐';
  return '😞';
};

const CustomerCommissionPanel: Component = () => {
  const info = createMemo(() => getCommissionInfo());
  const isCommMode = createMemo(() => isCommissionMode());
  const avgSatisfaction = createMemo(() => getAverageSatisfaction());
  const showResult = createMemo(() => showCommissionResultPopup());

  if (!isCommMode()) return null;

  const commission = info().activeCommission;
  const lastResult = info().lastResult;
  const timePct = commission ? (info().timeRemaining / commission.timeLimit) * 100 : 0;

  return (
    <>
      <div class="commission-panel">
        {commission && (
          <div class="commission-active-card">
            <div class="commission-header">
              <div class="customer-info">
                <span class="customer-avatar">{commission.customer.avatar}</span>
                <div class="customer-details">
                  <div class="customer-name">{commission.customer.name}</div>
                  <div class="customer-personality">{commission.customer.personality}</div>
                </div>
              </div>
              <div class="commission-timer-display">
                <div class={`timer-ring ${timePct < 25 ? 'timer-critical' : timePct < 50 ? 'timer-warning' : ''}`}>
                  <svg viewBox="0 0 36 36" class="timer-svg">
                    <path
                      class="timer-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      class="timer-fg"
                      stroke-dasharray={`${timePct}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span class="timer-text">{info().timeRemaining}s</span>
                </div>
              </div>
            </div>

            <div class="commission-body">
              <div class="vague-description-box">
                <div class="description-label">💬 顾客需求</div>
                <div class="vague-description-text">
                  "{commission.vagueDescription}"
                </div>
              </div>

              <div class="preference-tags">
                <div class="preference-item">
                  <span class="pref-icon">📅</span>
                  <span class="pref-label">年代偏好</span>
                  <span 
                    class="pref-tag era-tag" 
                    style={{ background: getEraColor(commission.eraPreference) }}
                  >
                    {commission.eraPreference}
                  </span>
                </div>
                <div class="preference-item">
                  <span class="pref-icon">🎯</span>
                  <span class="pref-label">主题需求</span>
                  <span class="pref-tag theme-tag">
                    {commission.themePreference}
                  </span>
                </div>
                {commission.genreHint && (
                  <div class="preference-item">
                    <span class="pref-icon">💡</span>
                    <span class="pref-label">类型暗示</span>
                    <span class="pref-tag genre-tag">
                      {commission.genreHint}
                    </span>
                  </div>
                )}
              </div>

              <div class="commission-hint-box">
                <div class="hint-icon">🔍</div>
                <div class="hint-text">请在真实书架中寻找符合顾客需求的书籍，点击书籍封面来完成委托！</div>
              </div>
            </div>
          </div>
        )}

        <div class="commission-stats">
          <div class="stat-row">
            <div class="stat-item-sm">
              <span class="stat-icon-sm">✅</span>
              <span class="stat-value-sm">{info().totalCompleted}</span>
              <span class="stat-label-sm">完成</span>
            </div>
            <div class="stat-item-sm">
              <span class="stat-icon-sm">❌</span>
              <span class="stat-value-sm">{info().totalFailed}</span>
              <span class="stat-label-sm">失败</span>
            </div>
            <div class="stat-item-sm">
              <span class="stat-icon-sm">🔥</span>
              <span class="stat-value-sm">{info().consecutiveSuccess}</span>
              <span class="stat-label-sm">连胜</span>
            </div>
            <div class="stat-item-sm">
              <span class="stat-icon-sm">⭐</span>
              <span 
                class="stat-value-sm"
                style={{ color: getSatisfactionColor(avgSatisfaction()) }}
              >
                {avgSatisfaction()}%
              </span>
              <span class="stat-label-sm">满意度</span>
            </div>
          </div>
          {info().bestStreak > 0 && (
            <div class="best-streak-row">
              🏆 最佳连胜: {info().bestStreak}
            </div>
          )}
        </div>
      </div>

      {showResult() && lastResult && (
        <div class="commission-result-overlay" onClick={dismissCommissionResultPopup}>
          <div class="commission-result-modal" onClick={e => e.stopPropagation()}>
            <div class={`result-header ${lastResult.success ? 'result-success' : 'result-fail'}`}>
              <span class="result-icon">
                {lastResult.success ? '🎉' : '😔'}
              </span>
              <span class="result-title">
                {lastResult.success ? '委托成功！' : '委托未达成'}
              </span>
            </div>

            <div class="result-satisfaction">
              <div class="satisfaction-emoji">
                {getSatisfactionEmoji(lastResult.satisfaction)}
              </div>
              <div class="satisfaction-score-display">
                <div 
                  class="satisfaction-bar"
                  style={{ 
                    width: `${lastResult.satisfaction}%`,
                    background: getSatisfactionColor(lastResult.satisfaction)
                  }}
                />
              </div>
              <div 
                class="satisfaction-text"
                style={{ color: getSatisfactionColor(lastResult.satisfaction) }}
              >
                满意度 {lastResult.satisfaction}%
              </div>
            </div>

            <div class="match-details-box">
              <div class="match-details-title">📋 匹配详情</div>
              <pre class="match-details-content">
                {lastResult.matchDetails}
              </pre>
            </div>

            <div class="result-rewards">
              <div class="rewards-title">🎁 获得奖励</div>
              <div class="rewards-row">
                <div class="reward-item">
                  <span class="reward-icon">🪙</span>
                  <span class="reward-value">+{lastResult.rewards.coins}</span>
                  <span class="reward-label">金币</span>
                </div>
                <div class="reward-item">
                  <span class="reward-icon">⭐</span>
                  <span class="reward-value">+{lastResult.rewards.reputation}</span>
                  <span class="reward-label">声望</span>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <button 
                class="action-btn action-secondary"
                onClick={dismissCommissionResultPopup}
              >
                结束委托
              </button>
              <button 
                class="action-btn action-primary"
                onClick={acceptNextCommission}
              >
                接下一个委托
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerCommissionPanel;
