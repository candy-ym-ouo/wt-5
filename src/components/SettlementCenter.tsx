import { createSignal, createMemo, For, Show } from 'solid-js';
import type { SettlementTab, SettlementData, QuestResult, AchievementResult, CodexUnlock, SettlementReward } from '../types/settlement';
import { getSettlementInfo, closeSettlement, setActiveTab } from '../store/settlementStore';
import { RARITY_CONFIG } from '../data/themes';
import { DIFFICULTY_CONFIGS } from '../data/difficulty';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const tabs: { id: SettlementTab; label: string; icon: string }[] = [
  { id: 'overview', label: '总览', icon: '🏆' },
  { id: 'game', label: '本局', icon: '🎮' },
  { id: 'season', label: '赛季', icon: '📅' },
  { id: 'quests', label: '任务', icon: '📋' },
  { id: 'achievements', label: '成就', icon: '🏅' },
  { id: 'codex', label: '图鉴', icon: '📖' },
];

export default function SettlementCenter() {
  const info = getSettlementInfo();
  const [showAllRewards, setShowAllRewards] = createSignal(false);

  const data = createMemo(() => info.settlementData);
  const isProcessing = createMemo(() => info.isProcessing);
  const isVisible = createMemo(() => info.isVisible);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m${Math.floor(seconds % 60)}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const displayedRewards = createMemo(() => {
    const rewards = info.totalRewards;
    if (showAllRewards()) return rewards;
    return rewards.slice(0, 5);
  });

  const handleTabClick = (tabId: SettlementTab) => {
    setActiveTab(tabId);
  };

  const handleClose = () => {
    closeSettlement();
  };

  const getResultColor = (isWin: boolean) => isWin ? '#22c55e' : '#ef4444';
  const getResultIcon = (isWin: boolean) => isWin ? '🎉' : '😢';
  const getResultText = (isWin: boolean) => isWin ? '胜利！' : '时间到';

  return (
    <Show when={isVisible()}>
      <div class="modal-overlay" onClick={handleClose}>
        <div class="modal-content settlement-center-modal" onClick={(e) => e.stopPropagation()}>
          <Show when={isProcessing()}>
            <div class="settlement-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">正在结算...</div>
            </div>
          </Show>

          <Show when={!isProcessing() && data()}>
            {(data) => (
              <>
                <div class="settlement-header">
                  <div class="settlement-title-row">
                    <span class="settlement-icon">{getResultIcon(data().gameResult.isWin)}</span>
                    <h2 style={{ color: getResultColor(data().gameResult.isWin) }}>
                      {getResultText(data().gameResult.isWin)}
                    </h2>
                    <Show when={data().gameResult.isPersonalBest}>
                      <span class="personal-best-badge">🏆 个人最佳！</span>
                    </Show>
                  </div>
                  <div class="settlement-subtitle">
                    {formatDate(data().timestamp)} · 
                    {DIFFICULTY_CONFIGS[data().gameResult.replay.difficultyLevel].icon} 
                    {DIFFICULTY_CONFIGS[data().gameResult.replay.difficultyLevel].name}
                    <Show when={data().gameResult.rank}>
                      <span class="rank-badge">排名 #{data().gameResult.rank}</span>
                    </Show>
                    <Show when={data().gameResult.rating}>
                      <span class="rating-badge">{data().gameResult.rating}</span>
                    </Show>
                  </div>
                </div>

                <div class="tabs settlement-tabs">
                  <For each={tabs}>
                    {(tab) => (
                      <button
                        class={`tab-button ${info.activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    )}
                  </For>
                </div>

                <div class="settlement-content">
                  <Show when={info.activeTab === 'overview'}>
                    <OverviewTab data={data()} rewards={displayedRewards()} showAll={showAllRewards()} onToggleShowAll={() => setShowAllRewards(!showAllRewards())} totalRewardsCount={info.totalRewards.length} formatTime={formatTime} formatNumber={formatNumber} />
                  </Show>

                  <Show when={info.activeTab === 'game'}>
                    <GameTab data={data()} formatTime={formatTime} formatNumber={formatNumber} />
                  </Show>

                  <Show when={info.activeTab === 'season'}>
                    <SeasonTab data={data()} formatNumber={formatNumber} />
                  </Show>

                  <Show when={info.activeTab === 'quests'}>
                    <QuestsTab quests={info.questResults} formatNumber={formatNumber} />
                  </Show>

                  <Show when={info.activeTab === 'achievements'}>
                    <AchievementsTab achievements={info.achievementResults} formatNumber={formatNumber} />
                  </Show>

                  <Show when={info.activeTab === 'codex'}>
                    <CodexTab unlocks={info.codexUnlocks} />
                  </Show>
                </div>

                <div class="settlement-footer">
                  <button class="modal-button primary" onClick={handleClose}>
                    确定
                  </button>
                </div>
              </>
            )}
          </Show>
        </div>
      </div>
    </Show>
  );
}

function OverviewTab(props: {
  data: SettlementData;
  rewards: SettlementReward[];
  showAll: boolean;
  onToggleShowAll: () => void;
  totalRewardsCount: number;
  formatTime: (s: number) => string;
  formatNumber: (n: number) => string;
}) {
  return (
    <div class="settlement-section">
      <div class="overview-main-stats">
        <div class="main-stat-card highlight">
          <div class="main-stat-icon">🏆</div>
          <div class="main-stat-value">{props.formatNumber(props.data.summary.totalScore)}</div>
          <div class="main-stat-label">最终得分</div>
        </div>
        <div class="main-stat-card">
          <div class="main-stat-icon">💰</div>
          <div class="main-stat-value">{props.formatNumber(props.data.summary.totalCoins)}</div>
          <div class="main-stat-label">获得金币</div>
        </div>
        <div class="main-stat-card">
          <div class="main-stat-icon">📚</div>
          <div class="main-stat-value">{props.data.gameResult.replay.booksFound}</div>
          <div class="main-stat-label">找到书籍</div>
        </div>
        <div class="main-stat-card">
          <div class="main-stat-icon">⏱️</div>
          <div class="main-stat-value">{props.formatTime(props.data.gameResult.replay.totalTimeUsed)}</div>
          <div class="main-stat-label">总用时</div>
        </div>
      </div>

      <div class="overview-highlights">
        <Show when={props.data.summary.newUnlocksCount > 0}>
          <div class="highlight-card unlocks">
            <span class="highlight-icon">✨</span>
            <span class="highlight-text">新解锁 {props.data.summary.newUnlocksCount} 项图鉴</span>
          </div>
        </Show>
        <Show when={props.data.summary.achievementsUnlocked > 0}>
          <div class="highlight-card achievements">
            <span class="highlight-icon">🏅</span>
            <span class="highlight-text">解锁 {props.data.summary.achievementsUnlocked} 个成就</span>
          </div>
        </Show>
        <Show when={props.data.summary.questsCompleted > 0}>
          <div class="highlight-card quests">
            <span class="highlight-icon">📋</span>
            <span class="highlight-text">完成 {props.data.summary.questsCompleted} 个任务</span>
          </div>
        </Show>
      </div>

      <div class="rewards-section">
        <div class="section-title">
          <span>🎁 奖励详情</span>
          <Show when={props.totalRewardsCount > 5}>
            <button class="toggle-show-btn" onClick={props.onToggleShowAll}>
              {props.showAll ? '收起' : `展开全部 (${props.totalRewardsCount})`}
            </button>
          </Show>
        </div>
        <div class="rewards-list">
          <For each={props.rewards}>
            {(reward) => (
              <div class={`reward-item reward-${reward.type}`}>
                <span class="reward-icon">{reward.icon}</span>
                <span class="reward-label">{reward.label}</span>
                <span class="reward-value">+{reward.value}</span>
              </div>
            )}
          </For>
          <Show when={props.rewards.length === 0}>
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <div class="empty-text">暂无额外奖励</div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

function GameTab(props: {
  data: SettlementData;
  formatTime: (s: number) => string;
  formatNumber: (n: number) => string;
}) {
  const replay = props.data.gameResult.replay;
  const rounds = replay.rounds;

  const avgFindTime = createMemo(() => {
    if (rounds.length === 0) return 0;
    return rounds.reduce((sum, r) => sum + r.findTime, 0) / rounds.length;
  });

  const totalWrongPicks = createMemo(() => {
    return rounds.reduce((sum, r) => sum + r.wrongPicks.length, 0);
  });

  return (
    <div class="settlement-section">
      <div class="game-stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{props.formatNumber(replay.totalScore)}</div>
          <div class="stat-label">总得分</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">{rounds.length}</div>
          <div class="stat-label">完成关卡</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{props.formatTime(avgFindTime())}</div>
          <div class="stat-label">平均用时</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💡</div>
          <div class="stat-value">{replay.totalHintsUsed}</div>
          <div class="stat-label">使用提示</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">{replay.streak.bestStreak}</div>
          <div class="stat-label">最高连胜</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-value">{totalWrongPicks()}</div>
          <div class="stat-label">误点次数</div>
        </div>
      </div>

      <div class="score-breakdown">
        <div class="section-title">📊 得分构成</div>
        <div class="score-bars">
          <div class="score-bar-item">
            <div class="score-bar-header">
              <span class="score-bar-label">基础得分</span>
              <span class="score-bar-value good">+{replay.scoreBreakdown.baseScore}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar-fill base" style={{ width: `${(replay.scoreBreakdown.baseScore / replay.totalScore) * 100}%` }} />
            </div>
          </div>
          <div class="score-bar-item">
            <div class="score-bar-header">
              <span class="score-bar-label">时间奖励</span>
              <span class="score-bar-value good">+{replay.scoreBreakdown.timeBonus}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar-fill time" style={{ width: `${(replay.scoreBreakdown.timeBonus / replay.totalScore) * 100}%` }} />
            </div>
          </div>
          <div class="score-bar-item">
            <div class="score-bar-header">
              <span class="score-bar-label">连胜奖励</span>
              <span class="score-bar-value good">+{replay.scoreBreakdown.streakBonus}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar-fill streak" style={{ width: `${(replay.scoreBreakdown.streakBonus / replay.totalScore) * 100}%` }} />
            </div>
          </div>
          <div class="score-bar-item">
            <div class="score-bar-header">
              <span class="score-bar-label">稀有度加成</span>
              <span class="score-bar-value good">+{replay.scoreBreakdown.rarityBonus}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar-fill rarity" style={{ width: `${(replay.scoreBreakdown.rarityBonus / replay.totalScore) * 100}%` }} />
            </div>
          </div>
          <div class="score-bar-item penalty">
            <div class="score-bar-header">
              <span class="score-bar-label">提示扣分</span>
              <span class="score-bar-value error">-{replay.scoreBreakdown.hintPenalty}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar-fill penalty" style={{ width: `${(replay.scoreBreakdown.hintPenalty / replay.totalScore) * 100}%` }} />
            </div>
          </div>
          <div class="score-bar-item penalty">
            <div class="score-bar-header">
              <span class="score-bar-label">误点扣分</span>
              <span class="score-bar-value error">-{replay.scoreBreakdown.wrongPenalty}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar-fill penalty" style={{ width: `${(replay.scoreBreakdown.wrongPenalty / replay.totalScore) * 100}%` }} />
            </div>
          </div>
        </div>
        <div class="score-multiplier-info">
          <span class="multiplier-label">难度倍率</span>
          <span class="multiplier-value">x{replay.scoreBreakdown.difficultyMultiplier}</span>
        </div>
      </div>

      <div class="rounds-list">
        <div class="section-title">📖 每轮详情</div>
        <For each={rounds}>
          {(round) => (
            <div class="round-item">
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
                <span class="round-stat">⏱️ {props.formatTime(round.findTime)}</span>
                <span class="round-stat">💡 {round.hintsUsed}次提示</span>
                <span class="round-stat">🔍 {round.unlockedClueTypes.length}/7线索</span>
                <Show when={round.wrongPicks.length > 0}>
                  <span class="round-stat error">❌ {round.wrongPicks.length}次误点</span>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function SeasonTab(props: {
  data: SettlementData;
  formatNumber: (n: number) => string;
}) {
  const season = props.data.seasonProgress;

  return (
    <div class="settlement-section">
      <div class="season-header">
        <div class="season-info">
          <div class="season-icon">📅</div>
          <div>
            <div class="season-title">第 {season.weekNumber} 周 · {season.seasonId}</div>
            <div class="season-subtitle">赛季进度更新</div>
          </div>
        </div>
        <Show when={season.weeklyRank}>
          <div class="rank-display">
            <span class="rank-label">本周排名</span>
            <span class="rank-value">#{season.weeklyRank}</span>
          </div>
        </Show>
        <Show when={season.seasonRank}>
          <div class="rank-display">
            <span class="rank-label">赛季排名</span>
            <span class="rank-value">#{season.seasonRank}</span>
          </div>
        </Show>
      </div>

      <div class="season-stats-grid">
        <div class="season-stat-card">
          <div class="season-stat-label">本周游戏</div>
          <div class="season-stat-value">{season.gamesPlayedThisWeek}</div>
          <div class="season-stat-delta">+1</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">赛季游戏</div>
          <div class="season-stat-value">{season.gamesPlayedThisSeason}</div>
          <div class="season-stat-delta">+1</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">本周得分</div>
          <div class="season-stat-value">{props.formatNumber(season.totalScoreThisWeek)}</div>
          <div class="season-stat-delta good">+{props.formatNumber(props.data.gameResult.replay.totalScore)}</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">赛季得分</div>
          <div class="season-stat-value">{props.formatNumber(season.totalScoreThisSeason)}</div>
          <div class="season-stat-delta good">+{props.formatNumber(props.data.gameResult.replay.totalScore)}</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">本周最佳</div>
          <div class="season-stat-value">{props.formatNumber(season.bestScoreThisWeek)}</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">赛季最佳</div>
          <div class="season-stat-value">{props.formatNumber(season.bestScoreThisSeason)}</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">本周找书</div>
          <div class="season-stat-value">{season.totalBooksFoundThisWeek}</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-label">赛季找书</div>
          <div class="season-stat-value">{season.totalBooksFoundThisSeason}</div>
        </div>
      </div>

      <div class="season-progress">
        <div class="section-title">📈 赛季趋势</div>
        <div class="progress-chart">
          <div class="chart-bar-row">
            <span class="chart-bar-label">本周得分</span>
            <div class="chart-bar-container">
              <div 
                class="chart-bar-fill weekly" 
                style={{ width: `${Math.min(100, (season.totalScoreThisWeek / (season.bestScoreThisWeek * 1.5)) * 100)}%` }} 
              />
            </div>
            <span class="chart-bar-value">{props.formatNumber(season.totalScoreThisWeek)}</span>
          </div>
          <div class="chart-bar-row">
            <span class="chart-bar-label">赛季得分</span>
            <div class="chart-bar-container">
              <div 
                class="chart-bar-fill season" 
                style={{ width: `${Math.min(100, (season.totalScoreThisSeason / (season.bestScoreThisSeason * 2)) * 100)}%` }} 
              />
            </div>
            <span class="chart-bar-value">{props.formatNumber(season.totalScoreThisSeason)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestsTab(props: {
  quests: QuestResult[];
  formatNumber: (n: number) => string;
}) {
  const completedQuests = createMemo(() => props.quests.filter(q => q.status === 'completed'));
  const inProgressQuests = createMemo(() => props.quests.filter(q => q.status === 'in_progress'));
  const availableQuests = createMemo(() => props.quests.filter(q => q.status === 'newly_available'));

  const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    daily: { label: '每日', icon: '📅', color: '#3b82f6' },
    growth: { label: '成长', icon: '🌱', color: '#22c55e' },
    chapter: { label: '章节', icon: '📖', color: '#a855f7' },
    hidden: { label: '隐藏', icon: '🔮', color: '#f59e0b' },
  };

  const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    completed: { label: '已完成', icon: '✅', color: '#22c55e' },
    in_progress: { label: '进行中', icon: '⏳', color: '#f59e0b' },
    newly_available: { label: '新解锁', icon: '🔓', color: '#3b82f6' },
  };

  const renderQuestCard = (quest: QuestResult) => {
    const catInfo = CATEGORY_LABELS[quest.category];
    const statusInfo = STATUS_LABELS[quest.status];
    const progressPercent = quest.maxProgress > 0 ? Math.min(100, (quest.progress / quest.maxProgress) * 100) : 100;

    return (
      <div class={`quest-card quest-${quest.status}`}>
        <div class="quest-header">
          <div class="quest-category-badge" style={{ background: catInfo.color }}>
            {catInfo.icon} {catInfo.label}
          </div>
          <div class="quest-status-badge" style={{ color: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.label}
          </div>
        </div>
        <div class="quest-title">{quest.questTitle}</div>
        <div class="quest-progress">
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style={{ width: `${progressPercent}%`, background: statusInfo.color }} />
          </div>
          <div class="quest-progress-text">
            {quest.progress} / {quest.maxProgress}
          </div>
        </div>
        <Show when={quest.rewards.length > 0}>
          <div class="quest-rewards">
            <For each={quest.rewards}>
              {(reward) => (
                <span class="quest-reward-tag">
                  {reward.type === 'coins' ? '💰' : reward.type === 'score' ? '🎯' : reward.type === 'hints' ? '💡' : '🎁'}
                  +{reward.value}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>
    );
  };

  return (
    <div class="settlement-section">
      <Show when={props.quests.length === 0}>
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">暂无任务更新</div>
          <div class="empty-desc">继续游戏，完成更多任务获取奖励！</div>
        </div>
      </Show>

      <Show when={props.quests.length > 0}>
        <Show when={completedQuests().length > 0}>
          <div class="quest-group">
            <div class="quest-group-title">✅ 已完成任务 ({completedQuests().length})</div>
            <div class="quest-grid">
              <For each={completedQuests()}>
                {(quest) => renderQuestCard(quest)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={availableQuests().length > 0}>
          <div class="quest-group">
            <div class="quest-group-title">🔓 新解锁任务 ({availableQuests().length})</div>
            <div class="quest-grid">
              <For each={availableQuests()}>
                {(quest) => renderQuestCard(quest)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={inProgressQuests().length > 0}>
          <div class="quest-group">
            <div class="quest-group-title">⏳ 进行中任务 ({inProgressQuests().length})</div>
            <div class="quest-grid">
              <For each={inProgressQuests()}>
                {(quest) => renderQuestCard(quest)}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function AchievementsTab(props: {
  achievements: AchievementResult[];
  formatNumber: (n: number) => string;
}) {
  const newlyUnlocked = createMemo(() => props.achievements.filter(a => a.status === 'newly_unlocked'));
  const stageUnlocked = createMemo(() => props.achievements.filter(a => a.status === 'stage_unlocked'));
  const progressUpdated = createMemo(() => props.achievements.filter(a => a.status === 'progress_updated'));

  const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    newly_unlocked: { label: '新解锁', icon: '🏆', color: '#f59e0b' },
    stage_unlocked: { label: '阶段达成', icon: '🎯', color: '#3b82f6' },
    progress_updated: { label: '进度更新', icon: '📊', color: '#6b7280' },
  };

  const renderAchievementCard = (achievement: AchievementResult) => {
    const statusInfo = STATUS_LABELS[achievement.status];
    const maxProgress = achievement.progress.currentProgress > 0 ? achievement.progress.currentProgress : 1;
    const progressPercent = achievement.type === 'progressive' && achievement.progress.currentProgress > 0
      ? Math.min(100, (achievement.progress.currentProgress / maxProgress) * 100)
      : 100;

    return (
      <div class={`achievement-card achievement-${achievement.status}`}>
        <div class="achievement-icon" style={{ background: `linear-gradient(135deg, ${statusInfo.color}40, ${statusInfo.color}20)` }}>
          {achievement.achievementIcon}
        </div>
        <div class="achievement-content">
          <div class="achievement-header">
            <div class="achievement-title">{achievement.achievementTitle}</div>
            <div class="achievement-type-badge">
              {achievement.type === 'progressive' ? '渐进式' : '单次'}
            </div>
          </div>
          <div class="achievement-status" style={{ color: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.label}
          </div>
          <Show when={achievement.type === 'progressive'}>
            <div class="achievement-progress">
              <div class="achievement-progress-bar">
                <div class="achievement-progress-fill" style={{ width: `${progressPercent}%`, background: statusInfo.color }} />
              </div>
              <div class="achievement-progress-text">
                {achievement.progress.currentProgress}
              </div>
            </div>
          </Show>
          <Show when={achievement.newStages && achievement.newStages.length > 0}>
            <div class="achievement-stages">
              <For each={achievement.newStages}>
                {(stage) => (
                  <span class="stage-tag">🌟 {stage}</span>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    );
  };

  return (
    <div class="settlement-section">
      <Show when={props.achievements.length === 0}>
        <div class="empty-state">
          <div class="empty-icon">🏅</div>
          <div class="empty-title">暂无成就更新</div>
          <div class="empty-desc">继续游戏，解锁更多成就！</div>
        </div>
      </Show>

      <Show when={props.achievements.length > 0}>
        <Show when={newlyUnlocked().length > 0}>
          <div class="achievement-group">
            <div class="achievement-group-title">🏆 新解锁成就 ({newlyUnlocked().length})</div>
            <div class="achievement-list">
              <For each={newlyUnlocked()}>
                {(ach) => renderAchievementCard(ach)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={stageUnlocked().length > 0}>
          <div class="achievement-group">
            <div class="achievement-group-title">🎯 阶段达成 ({stageUnlocked().length})</div>
            <div class="achievement-list">
              <For each={stageUnlocked()}>
                {(ach) => renderAchievementCard(ach)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={progressUpdated().length > 0}>
          <div class="achievement-group">
            <div class="achievement-group-title">📊 进度更新 ({progressUpdated().length})</div>
            <div class="achievement-list">
              <For each={progressUpdated()}>
                {(ach) => renderAchievementCard(ach)}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function CodexTab(props: {
  unlocks: CodexUnlock[];
}) {
  const firstDiscoveries = createMemo(() => props.unlocks.filter(u => u.isFirstDiscovery));
  const books = createMemo(() => props.unlocks.filter(u => u.type === 'book' && !u.id.includes('_perfect') && !u.id.includes('_speed')));
  const authors = createMemo(() => props.unlocks.filter(u => u.type === 'author'));
  const themes = createMemo(() => props.unlocks.filter(u => u.type === 'theme'));
  const easterEggs = createMemo(() => props.unlocks.filter(u => u.type === 'easter_egg'));
  const specialUnlocks = createMemo(() => props.unlocks.filter(u => u.id.includes('_perfect') || u.id.includes('_speed')));

  const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    book: { label: '书籍', icon: '📚', color: '#6366f1' },
    author: { label: '作者', icon: '✍️', color: '#8b5cf6' },
    theme: { label: '主题', icon: '🎨', color: '#ec4899' },
    easter_egg: { label: '彩蛋', icon: '🥚', color: '#f59e0b' },
  };

  const renderUnlockCard = (unlock: CodexUnlock) => {
    const typeInfo = TYPE_LABELS[unlock.type];
    const rarityColor = unlock.rarity ? RARITY_COLORS[unlock.rarity] : typeInfo.color;

    return (
      <div class={`codex-card codex-${unlock.type}`}>
        <div class="codex-icon" style={{ 'border-color': rarityColor } as any}>
          {unlock.icon || typeInfo.icon}
        </div>
        <div class="codex-content">
          <div class="codex-name">{unlock.name}</div>
          <div class="codex-type" style={{ color: typeInfo.color }}>
            {typeInfo.icon} {typeInfo.label}
          </div>
          <Show when={unlock.rarity}>
            <div class="codex-rarity" style={{ color: rarityColor }}>
              {unlock.rarity === 'legendary' ? '🌟' : unlock.rarity === 'epic' ? '💜' : unlock.rarity === 'rare' ? '💙' : unlock.rarity === 'uncommon' ? '💚' : '⚪'}
              {unlock.rarity === 'legendary' ? '传说' : unlock.rarity === 'epic' ? '史诗' : unlock.rarity === 'rare' ? '稀有' : unlock.rarity === 'uncommon' ? '优秀' : '普通'}
            </div>
          </Show>
          <Show when={unlock.isFirstDiscovery}>
            <div class="codex-badge first-discovery">
              ✨ 首次发现
            </div>
          </Show>
          <Show when={unlock.discoveryRecord}>
            {(record) => (
              <div class="codex-narrative">
                {record().narrative}
              </div>
            )}
          </Show>
        </div>
      </div>
    );
  };

  return (
    <div class="settlement-section">
      <Show when={firstDiscoveries().length > 0}>
        <div class="codex-highlight">
          <div class="codex-highlight-icon">✨</div>
          <div class="codex-highlight-text">
            本次共发现 <strong>{firstDiscoveries().length}</strong> 项新内容！
          </div>
        </div>
      </Show>

      <Show when={props.unlocks.length === 0}>
        <div class="empty-state">
          <div class="empty-icon">📖</div>
          <div class="empty-title">暂无新的图鉴解锁</div>
          <div class="empty-desc">继续探索，发现更多书籍和秘密！</div>
        </div>
      </Show>

      <Show when={props.unlocks.length > 0}>
        <Show when={specialUnlocks().length > 0}>
          <div class="codex-group">
            <div class="codex-group-title">🏆 特殊成就 ({specialUnlocks().length})</div>
            <div class="codex-list">
              <For each={specialUnlocks()}>
                {(unlock) => renderUnlockCard(unlock)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={books().length > 0}>
          <div class="codex-group">
            <div class="codex-group-title">📚 书籍 ({books().length})</div>
            <div class="codex-list">
              <For each={books()}>
                {(unlock) => renderUnlockCard(unlock)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={authors().length > 0}>
          <div class="codex-group">
            <div class="codex-group-title">✍️ 作者 ({authors().length})</div>
            <div class="codex-list">
              <For each={authors()}>
                {(unlock) => renderUnlockCard(unlock)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={themes().length > 0}>
          <div class="codex-group">
            <div class="codex-group-title">🎨 主题收藏 ({themes().length})</div>
            <div class="codex-list">
              <For each={themes()}>
                {(unlock) => renderUnlockCard(unlock)}
              </For>
            </div>
          </div>
        </Show>

        <Show when={easterEggs().length > 0}>
          <div class="codex-group">
            <div class="codex-group-title">🥚 复活节彩蛋 ({easterEggs().length})</div>
            <div class="codex-list">
              <For each={easterEggs()}>
                {(unlock) => renderUnlockCard(unlock)}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
