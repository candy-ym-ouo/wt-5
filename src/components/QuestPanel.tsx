import { createMemo, For, Show } from 'solid-js';
import type { QuestCategory, QuestDisplayInfo, QuestGroupInfo, QuestReward } from '../types/quest';
import { CATEGORY_CONFIG } from '../data/quests';
import {
  questState,
  closeQuestPanel,
  setActiveTab,
  claimQuestReward,
  dismissQuestPopup,
  getQuestGroupInfo,
  getQuestStatsInfo,
  getUnclaimedQuestCount,
} from '../store/questStore';

interface QuestPanelProps {
  onClose: () => void;
}

export default function QuestPanel(props: QuestPanelProps) {
  const groups = createMemo(() => getQuestGroupInfo());
  const stats = createMemo(() => getQuestStatsInfo());
  const unclaimedCount = createMemo(() => getUnclaimedQuestCount());
  const state = createMemo(() => questState());

  const handleClose = () => {
    closeQuestPanel();
    props.onClose();
  };

  const handleTabClick = (tab: QuestCategory) => {
    setActiveTab(tab);
  };

  const handleClaim = (questId: string) => {
    claimQuestReward(questId);
  };

  const renderReward = (reward: QuestReward) => {
    const icons: Record<string, string> = {
      coins: '🪙',
      score: '⭐',
      hints: '💡',
      powerup: '🎁',
      achievement: '🏆',
      title: '🎖️',
      decoration: '🎨',
      points: '📈',
    };
    const icon = icons[reward.type] || '🎁';
    const label = reward.description || `${reward.value}`;
    return (
      <span class="quest-reward-item">
        {icon} {label}
      </span>
    );
  };

  const renderQuestCard = (info: QuestDisplayInfo) => {
    const statusClass = () => {
      switch (info.progress.status) {
        case 'locked': return 'quest-card-locked';
        case 'available': return 'quest-card-available';
        case 'in_progress': return 'quest-card-in-progress';
        case 'completed': return 'quest-card-completed';
        case 'claimed': return 'quest-card-claimed';
        default: return '';
      }
    };

    const statusLabel = () => {
      switch (info.progress.status) {
        case 'locked': return '🔒 未解锁';
        case 'available': return '📋 可接取';
        case 'in_progress': return '🔄 进行中';
        case 'completed': return '✅ 可领奖';
        case 'claimed': return '🎉 已完成';
        default: return '';
      }
    };

    return (
      <div class={`quest-card ${statusClass()}`}>
        <div class="quest-card-header">
          <span class="quest-card-icon">{info.quest.icon}</span>
          <div class="quest-card-title-row">
            <span class="quest-card-title">{info.quest.title}</span>
            <Show when={info.chainInfo}>
              <span class="quest-chain-badge">
                🔗 {info.chainInfo!.chainTitle} ({info.chainInfo!.chainPosition}/{info.chainInfo!.chainTotal})
              </span>
            </Show>
          </div>
          <span class={`quest-status-badge quest-status-${info.progress.status}`}>
            {statusLabel()}
          </span>
        </div>
        <div class="quest-card-desc">{info.quest.description}</div>
        <Show when={info.quest.maxProgress > 0 && info.progress.status !== 'locked'}>
          <div class="quest-progress-section">
            <div class="quest-progress-bar">
              <div
                class="quest-progress-fill"
                style={{ width: `${info.percent}%` }}
              />
            </div>
            <div class="quest-progress-text">
              {info.progress.currentProgress} / {info.quest.maxProgress}
            </div>
          </div>
        </Show>
        <div class="quest-rewards-row">
          <For each={info.quest.rewards}>
            {(reward) => renderReward(reward)}
          </For>
        </div>
        <Show when={info.canClaim}>
          <button
            class="quest-claim-button"
            onClick={() => handleClaim(info.quest.id)}
          >
            🎁 领取奖励
          </button>
        </Show>
        <Show when={info.progress.status === 'claimed'}>
          <div class="quest-claimed-mark">✅ 已领取</div>
        </Show>
      </div>
    );
  };

  const renderGroup = (group: QuestGroupInfo) => (
    <div class="quest-group">
      <div class="quest-group-header">
        <span class="quest-group-icon">{group.icon}</span>
        <span class="quest-group-label">{group.label}</span>
        <span class="quest-group-count">
          {group.completedCount}/{group.totalCount}
        </span>
      </div>
      <div class="quest-group-list">
        <For each={group.quests}>
          {(info) => renderQuestCard(info)}
        </For>
      </div>
    </div>
  );

  return (
    <div class="quest-panel-overlay" onClick={handleClose}>
      <div class="quest-panel" onClick={(e) => e.stopPropagation()}>
        <div class="quest-panel-header">
          <h2 class="quest-panel-title">📋 任务中心</h2>
          <div class="quest-panel-stats">
            <span class="quest-stat-item">
              🏆 已完成: {stats().totalCompleted}
            </span>
            <span class="quest-stat-item">
              🎁 待领奖: {unclaimedCount()}
            </span>
            <span class="quest-stat-item">
              🪙 累计金币: {stats().totalCoinsEarned}
            </span>
            <Show when={stats().currentDailyStreak > 0}>
              <span class="quest-stat-item quest-streak-stat">
                🔥 日常连续: {stats().currentDailyStreak}天
              </span>
            </Show>
          </div>
          <button class="quest-panel-close" onClick={handleClose}>✕</button>
        </div>

        <div class="quest-tabs">
          <For each={Object.entries(CATEGORY_CONFIG)}>
            {([key, config]) => (
              <button
                class={`quest-tab ${state().activeTab === key ? 'quest-tab-active' : ''}`}
                onClick={() => handleTabClick(key as QuestCategory)}
                style={{ '--tab-color': config.color }}
              >
                <span class="quest-tab-icon">{config.icon}</span>
                <span class="quest-tab-label">{config.label}</span>
                <Show when={(groups().find(g => g.category === key)?.completedCount ?? 0) > 0}>
                  <span class="quest-tab-badge">
                    {groups().find(g => g.category === key)?.completedCount}
                  </span>
                </Show>
              </button>
            )}
          </For>
        </div>

        <div class="quest-panel-body">
          <Show when={state().activeTab === 'daily'}>
            {renderGroup(groups().find(g => g.category === 'daily')!)}
          </Show>
          <Show when={state().activeTab === 'growth'}>
            {renderGroup(groups().find(g => g.category === 'growth')!)}
          </Show>
          <Show when={state().activeTab === 'chapter'}>
            {renderGroup(groups().find(g => g.category === 'chapter')!)}
          </Show>
          <Show when={state().activeTab === 'hidden'}>
            {renderGroup(groups().find(g => g.category === 'hidden')!)}
          </Show>
        </div>

        <Show when={state().showCompletePopup}>
          <div class="quest-complete-popup" onClick={dismissQuestPopup}>
            <div class="quest-complete-popup-title">🎉 任务完成！</div>
            <div class="quest-complete-popup-name">{state().showCompletePopup}</div>
          </div>
        </Show>
      </div>
    </div>
  );
}
