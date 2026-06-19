import { createSignal, createMemo, For } from 'solid-js';
import type { GameReplayData, RoundDetail, ClueType } from '../types/game';
import { RARITY_CONFIG } from '../data/themes';
import { DIFFICULTY_CONFIGS } from '../data/difficulty';

interface PostGameReviewProps {
  replay: GameReplayData;
  onClose: () => void;
}

type ReviewTab = 'overview' | 'rounds' | 'wrongPicks' | 'time' | 'score';

const CLUE_TYPE_LABELS: Record<ClueType, { label: string; icon: string }> = {
  year: { label: '出版年份', icon: '📅' },
  author: { label: '作者', icon: '✍️' },
  genre: { label: '类型', icon: '📚' },
  title: { label: '书名', icon: '📖' },
  shelf: { label: '书架位置', icon: '🗄️' },
  description: { label: '描述', icon: '📝' },
};

const PENALTY_LEVEL_COLORS = {
  warning: '#f59e0b',
  caution: '#f97316',
  danger: '#ef4444',
  critical: '#dc2626',
};

const PENALTY_LEVEL_ICONS = {
  warning: '⚠️',
  caution: '⚡',
  danger: '🔥',
  critical: '💀',
};

export default function PostGameReview(props: PostGameReviewProps) {
  const [activeTab, setActiveTab] = createSignal<ReviewTab>('overview');
  const [selectedRound, setSelectedRound] = createSignal<number | null>(null);

  const replay = createMemo(() => props.replay);
  const rounds = createMemo(() => replay().rounds);
  const totalRounds = createMemo(() => rounds().length);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m${Math.floor(seconds % 60)}s`;
  };

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const avgFindTime = createMemo(() => {
    const times = rounds().map(r => r.findTime);
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  });

  const fastestFind = createMemo(() => {
    const times = rounds().map(r => r.findTime);
    if (times.length === 0) return 0;
    return Math.min(...times);
  });

  const slowestFind = createMemo(() => {
    const times = rounds().map(r => r.findTime);
    if (times.length === 0) return 0;
    return Math.max(...times);
  });

  const totalWrongPicks = createMemo(() => {
    return rounds().reduce((sum, r) => sum + r.wrongPicks.length, 0);
  });

  const avgHintsUsed = createMemo(() => {
    const hints = rounds().map(r => r.hintsUsed);
    if (hints.length === 0) return 0;
    return hints.reduce((a, b) => a + b, 0) / hints.length;
  });

  const difficultyConfig = createMemo(() => {
    return DIFFICULTY_CONFIGS[replay().difficultyLevel];
  });

  const getClueUnlockProgress = (round: RoundDetail) => {
    const totalTypes = 6;
    const unlocked = round.unlockedClueTypes.length;
    return `${unlocked}/${totalTypes}`;
  };

  const getTimeDistribution = () => {
    const buckets = [
      { label: '<10s', min: 0, max: 10, count: 0 },
      { label: '10-20s', min: 10, max: 20, count: 0 },
      { label: '20-30s', min: 20, max: 30, count: 0 },
      { label: '30-60s', min: 30, max: 60, count: 0 },
      { label: '>60s', min: 60, max: Infinity, count: 0 },
    ];

    for (const round of rounds()) {
      for (const bucket of buckets) {
        if (round.findTime >= bucket.min && round.findTime < bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    return buckets;
  };

  const tabs: { id: ReviewTab; label: string; icon: string }[] = [
    { id: 'overview', label: '总览', icon: '📊' },
    { id: 'rounds', label: '目标书', icon: '📚' },
    { id: 'wrongPicks', label: '误点记录', icon: '❌' },
    { id: 'time', label: '用时分布', icon: '⏱️' },
    { id: 'score', label: '得分来源', icon: '🎯' },
  ];

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content post-game-review-modal" onClick={(e) => e.stopPropagation()}>
        <div class="review-header">
          <div class="review-title">
            <span class="review-icon">📋</span>
            <span>对局复盘</span>
            {replay().playerName && (
              <span class="review-player">— {replay().playerName}</span>
            )}
          </div>
          <div class="review-subtitle">
            {formatDate(replay().startTime)} · {difficultyConfig().icon} {difficultyConfig().name}
            {replay().difficultyMode === 'dynamic' && <span class="dynamic-badge">🔄 动态</span>}
          </div>
          {replay().isPersonalBest && (
            <div class="personal-best-badge">🏆 个人最佳记录！</div>
          )}
        </div>

        <div class="tabs review-tabs">
          <For each={tabs}>
            {(tab) => (
              <button
                class={`tab-button ${activeTab() === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            )}
          </For>
        </div>

        <div class="review-content">
          {activeTab() === 'overview' && (
            <div class="review-section">
              <div class="overview-stats">
                <div class="overview-stat-card highlight">
                  <div class="overview-stat-icon">🏆</div>
                  <div class="overview-stat-value">{replay().totalScore}</div>
                  <div class="overview-stat-label">最终得分</div>
                  {replay().rank && <div class="overview-stat-sub">预估排名 #{replay().rank}</div>}
                </div>
                <div class="overview-stat-card">
                  <div class="overview-stat-icon">📚</div>
                  <div class="overview-stat-value">{totalRounds()}</div>
                  <div class="overview-stat-label">找到书籍</div>
                </div>
                <div class="overview-stat-card">
                  <div class="overview-stat-icon">⏱️</div>
                  <div class="overview-stat-value">{formatTime(replay().totalTimeUsed)}</div>
                  <div class="overview-stat-label">总用时</div>
                </div>
                <div class="overview-stat-card">
                  <div class="overview-stat-icon">⚡</div>
                  <div class="overview-stat-value">{formatTime(avgFindTime())}</div>
                  <div class="overview-stat-label">平均用时</div>
                </div>
                <div class="overview-stat-card">
                  <div class="overview-stat-icon">💡</div>
                  <div class="overview-stat-value">{replay().totalHintsUsed}</div>
                  <div class="overview-stat-label">使用提示</div>
                </div>
                <div class="overview-stat-card">
                  <div class="overview-stat-icon">🔥</div>
                  <div class="overview-stat-value">{replay().streak.bestStreak}</div>
                  <div class="overview-stat-label">最高连胜</div>
                </div>
              </div>

              <div class="overview-summary">
                <div class="summary-item">
                  <span class="summary-label">最快找到</span>
                  <span class="summary-value">{formatTime(fastestFind())}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">最慢找到</span>
                  <span class="summary-value">{formatTime(slowestFind())}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">总误点次数</span>
                  <span class="summary-value error">{totalWrongPicks()}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">平均每轮提示</span>
                  <span class="summary-value">{avgHintsUsed().toFixed(1)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">累计扣时</span>
                  <span class="summary-value error">-{replay().wrongPenaltySummary.totalTimePenalty}s</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">累计扣分</span>
                  <span class="summary-value error">-{replay().wrongPenaltySummary.totalScorePenalty}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab() === 'rounds' && (
            <div class="review-section">
              <div class="rounds-list">
                <For each={rounds()}>
                  {(round, index) => (
                    <div
                      class={`round-item ${selectedRound() === index() ? 'selected' : ''}`}
                      onClick={() => setSelectedRound(selectedRound() === index() ? null : index())}
                    >
                      <div class="round-header">
                        <span class="round-level">第 {round.level} 关</span>
                        <span class="round-rarity" style={{ color: RARITY_CONFIG[round.rarity].color }}>
                          {RARITY_CONFIG[round.rarity].icon} {RARITY_CONFIG[round.rarity].name}
                        </span>
                        <span class="round-score">+{round.scoreEarned}</span>
                      </div>
                      <div class="round-book-info">
                        <div class="round-book-title">《{round.targetBookTitle}》</div>
                        <div class="round-book-meta">
                          {round.targetBookAuthor} · {round.targetBookYear} · {round.targetBookGenre}
                        </div>
                      </div>
                      <div class="round-stats">
                        <span class="round-stat">⏱️ {formatTime(round.findTime)}</span>
                        <span class="round-stat">💡 {round.hintsUsed}次提示</span>
                        <span class="round-stat">🔍 {getClueUnlockProgress(round)}线索</span>
                        {round.wrongPicks.length > 0 && (
                          <span class="round-stat error">❌ {round.wrongPicks.length}次误点</span>
                        )}
                      </div>

                      {selectedRound() === index() && (
                        <div class="round-detail">
                          <div class="detail-section">
                            <div class="detail-title">解锁线索</div>
                            <div class="clue-types">
                              <For each={round.unlockedClueTypes}>
                                {(type) => (
                                  <span class="clue-type-tag">
                                    {CLUE_TYPE_LABELS[type].icon} {CLUE_TYPE_LABELS[type].label}
                                  </span>
                                )}
                              </For>
                            </div>
                          </div>

                          {round.wrongPicks.length > 0 && (
                            <div class="detail-section">
                              <div class="detail-title">误点记录</div>
                              <div class="wrong-picks-mini">
                                <For each={round.wrongPicks}>
                                  {(wp) => (
                                    <div class="wrong-pick-mini-item">
                                      <span class="wp-book">《{wp.bookTitle}》</span>
                                      {wp.penalty && (
                                        <>
                                          <span 
                                            class="wp-penalty" 
                                            style={{ color: PENALTY_LEVEL_COLORS[wp.penalty.level] }}
                                          >
                                            {PENALTY_LEVEL_ICONS[wp.penalty.level]} -{wp.penalty.timePenalty}s
                                          </span>
                                          {wp.penalty.scorePenalty > 0 && (
                                            <span class="wp-penalty" style={{ color: PENALTY_LEVEL_COLORS[wp.penalty.level] }}>
                                              -{wp.penalty.scorePenalty}分
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </For>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}

          {activeTab() === 'wrongPicks' && (
            <div class="review-section">
              {totalWrongPicks() === 0 ? (
                <div class="empty-state">
                  <div class="empty-icon">🎉</div>
                  <div class="empty-title">完美表现！</div>
                  <div class="empty-desc">本局没有任何误点，继续保持！</div>
                </div>
              ) : (
                <>
                  <div class="wrong-penalty-summary">
                    <div class="wps-item">
                      <span class="wps-label">总误点次数</span>
                      <span class="wps-value error">{replay().wrongPenaltySummary.totalWrongPicks}</span>
                    </div>
                    <div class="wps-item">
                      <span class="wps-label">最高连续误点</span>
                      <span class="wps-value error">{replay().wrongPenaltySummary.maxConsecutiveWrong}</span>
                    </div>
                    <div class="wps-item">
                      <span class="wps-label">累计扣时</span>
                      <span class="wps-value error">-{replay().wrongPenaltySummary.totalTimePenalty}s</span>
                    </div>
                    <div class="wps-item">
                      <span class="wps-label">累计扣分</span>
                      <span class="wps-value error">-{replay().wrongPenaltySummary.totalScorePenalty}</span>
                    </div>
                    <div class="wps-item">
                      <span class="wps-label">提示冻结次数</span>
                      <span class="wps-value">{replay().wrongPenaltySummary.totalHintFreezes}</span>
                    </div>
                  </div>

                  <div class="wrong-picks-list">
                    <For each={rounds()}>
                      {(round) => (
                        <For each={round.wrongPicks}>
                          {(wp) => (
                            <div class={`wrong-pick-item penalty-${wp.penalty?.level || 'warning'}`}>
                              <div class="wp-header">
                                <span class="wp-level">第 {round.level} 关</span>
                                {wp.penalty && (
                                  <span class="wp-level-badge" style={{ color: PENALTY_LEVEL_COLORS[wp.penalty.level] }}>
                                    {PENALTY_LEVEL_ICONS[wp.penalty.level]} {wp.penalty.level.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div class="wp-target">
                                <span class="wp-target-label">目标：</span>
                                <span class="wp-target-book">《{round.targetBookTitle}》</span>
                              </div>
                              <div class="wp-picked">
                                <span class="wp-picked-label">误点：</span>
                                <span class="wp-picked-book">《{wp.bookTitle}》</span>
                              </div>
                              {wp.penalty && (
                                <div class="wp-penalties">
                                  <span class="wp-penalty-item">-{wp.penalty.timePenalty}秒</span>
                                  {wp.penalty.scorePenalty > 0 && (
                                    <span class="wp-penalty-item">-{wp.penalty.scorePenalty}分</span>
                                  )}
                                  {wp.penalty.hintFrozen && (
                                    <span class="wp-penalty-item freeze">
                                      ❄️ 提示冻结 {Math.ceil(wp.penalty.hintFreezeDuration / 1000)}秒
                                    </span>
                                  )}
                                </div>
                              )}
                              <div class="wp-time">{formatDate(wp.timestamp)}</div>
                            </div>
                          )}
                        </For>
                      )}
                    </For>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab() === 'time' && (
            <div class="review-section">
              <div class="time-distribution">
                <div class="time-dist-header">用时分布</div>
                <div class="time-dist-chart">
                  <For each={getTimeDistribution()}>
                    {(bucket) => {
                      const percent = totalRounds() > 0 ? (bucket.count / totalRounds()) * 100 : 0;
                      return (
                        <div class="time-bar-row">
                          <span class="time-bar-label">{bucket.label}</span>
                          <div class="time-bar-container">
                            <div 
                              class="time-bar-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span class="time-bar-count">{bucket.count} 轮</span>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>

              <div class="time-round-chart">
                <div class="time-round-title">每轮用时</div>
                <div class="time-round-bars">
                  <For each={rounds()}>
                    {(round, index) => {
                      const maxTime = slowestFind() || 1;
                      const height = (round.findTime / maxTime) * 100;
                      return (
                        <div class="time-round-bar-container">
                          <div 
                            class="time-round-bar"
                            style={{ height: `${height}%` }}
                            title={`第${round.level}关: ${formatTime(round.findTime)}`}
                          />
                          <span class="time-round-label">{index() + 1}</span>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <div class="time-round-legend">
                  <span>📊 横轴：轮次</span>
                  <span>📏 纵轴：用时（最高 {formatTime(slowestFind())}）</span>
                </div>
              </div>

              <div class="time-stats-grid">
                <div class="time-stat">
                  <span class="ts-label">总用时</span>
                  <span class="ts-value">{formatTime(replay().totalTimeUsed)}</span>
                </div>
                <div class="time-stat">
                  <span class="ts-label">平均用时</span>
                  <span class="ts-value">{formatTime(avgFindTime())}</span>
                </div>
                <div class="time-stat">
                  <span class="ts-label">最快</span>
                  <span class="ts-value good">{formatTime(fastestFind())}</span>
                </div>
                <div class="time-stat">
                  <span class="ts-label">最慢</span>
                  <span class="ts-value">{formatTime(slowestFind())}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab() === 'score' && (
            <div class="review-section">
              <div class="score-breakdown">
                <div class="score-breakdown-title">得分构成分析</div>
                
                <div class="score-bars">
                  <div class="score-bar-item">
                    <div class="score-bar-header">
                      <span class="score-bar-label">基础得分</span>
                      <span class="score-bar-value good">+{replay().scoreBreakdown.baseScore}</span>
                    </div>
                    <div class="score-bar-container">
                      <div 
                        class="score-bar-fill base"
                        style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.baseScore / replay().totalScore) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div class="score-bar-item">
                    <div class="score-bar-header">
                      <span class="score-bar-label">时间奖励</span>
                      <span class="score-bar-value good">+{replay().scoreBreakdown.timeBonus}</span>
                    </div>
                    <div class="score-bar-container">
                      <div 
                        class="score-bar-fill time"
                        style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.timeBonus / replay().totalScore) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div class="score-bar-item">
                    <div class="score-bar-header">
                      <span class="score-bar-label">连胜奖励</span>
                      <span class="score-bar-value good">+{replay().scoreBreakdown.streakBonus}</span>
                    </div>
                    <div class="score-bar-container">
                      <div 
                        class="score-bar-fill streak"
                        style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.streakBonus / replay().totalScore) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div class="score-bar-item">
                    <div class="score-bar-header">
                      <span class="score-bar-label">稀有度加成</span>
                      <span class="score-bar-value good">+{replay().scoreBreakdown.rarityBonus}</span>
                    </div>
                    <div class="score-bar-container">
                      <div 
                        class="score-bar-fill rarity"
                        style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.rarityBonus / replay().totalScore) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div class="score-bar-item penalty">
                    <div class="score-bar-header">
                      <span class="score-bar-label">提示扣分</span>
                      <span class="score-bar-value error">-{replay().scoreBreakdown.hintPenalty}</span>
                    </div>
                    <div class="score-bar-container">
                      <div 
                        class="score-bar-fill penalty"
                        style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.hintPenalty / (replay().scoreBreakdown.baseScore + replay().scoreBreakdown.timeBonus + replay().scoreBreakdown.streakBonus + replay().scoreBreakdown.rarityBonus)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div class="score-bar-item penalty">
                    <div class="score-bar-header">
                      <span class="score-bar-label">误点扣分</span>
                      <span class="score-bar-value error">-{replay().scoreBreakdown.wrongPenalty}</span>
                    </div>
                    <div class="score-bar-container">
                      <div 
                        class="score-bar-fill penalty"
                        style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.wrongPenalty / (replay().scoreBreakdown.baseScore + replay().scoreBreakdown.timeBonus + replay().scoreBreakdown.streakBonus + replay().scoreBreakdown.rarityBonus)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {replay().scoreBreakdown.powerUpPenalty > 0 && (
                    <div class="score-bar-item penalty">
                      <div class="score-bar-header">
                        <span class="score-bar-label">道具扣分</span>
                        <span class="score-bar-value error">-{replay().scoreBreakdown.powerUpPenalty}</span>
                      </div>
                      <div class="score-bar-container">
                        <div 
                          class="score-bar-fill penalty"
                          style={{ width: `${replay().totalScore > 0 ? (replay().scoreBreakdown.powerUpPenalty / (replay().scoreBreakdown.baseScore + replay().scoreBreakdown.timeBonus + replay().scoreBreakdown.streakBonus + replay().scoreBreakdown.rarityBonus)) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div class="score-multiplier-info">
                  <span class="multiplier-label">难度倍率</span>
                  <span class="multiplier-value">x{replay().scoreBreakdown.difficultyMultiplier}</span>
                </div>

                <div class="score-final">
                  <span class="score-final-label">最终得分</span>
                  <span class="score-final-value">{replay().totalScore}</span>
                </div>
              </div>

              <div class="score-round-list">
                <div class="srl-title">每轮得分</div>
                <For each={rounds()}>
                  {(round) => (
                    <div class="srl-item">
                      <span class="srl-round">第 {round.level} 关</span>
                      <span class="srl-book">《{round.targetBookTitle}》</span>
                      <span class="srl-rarity" style={{ color: RARITY_CONFIG[round.rarity].color }}>
                        {RARITY_CONFIG[round.rarity].icon}
                      </span>
                      <span class="srl-time">{formatTime(round.findTime)}</span>
                      <span class="srl-score">+{round.scoreEarned}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </div>

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
