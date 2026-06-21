import { createSignal, For, createMemo } from 'solid-js';
import type { ActivityTab, ActivityReward, LimitedThemeList, FestivalChallenge, PointsRewardSystem } from '../types/activity';
import {
  getActivityInfo,
  setActivityTab,
  claimReward,
} from '../store/activityStore';
import { BOOKS } from '../data/books';

interface ActivityCenterProps {
  onClose: () => void;
}

const TABS: { id: ActivityTab; label: string; icon: string }[] = [
  { id: 'overview', label: '总览', icon: '🏠' },
  { id: 'theme_lists', label: '主题书单', icon: '📚' },
  { id: 'festivals', label: '节日挑战', icon: '🎉' },
  { id: 'points', label: '积分奖励', icon: '⭐' },
  { id: 'achievements', label: '活动成就', icon: '🏆' },
];

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
};

const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const renderRewards = (rewards: ActivityReward[]) => {
  return (
    <div class="activity-rewards">
      <For each={rewards}>
        {(reward) => {
          let label = '';
          let icon = '';
          switch (reward.type) {
            case 'coins':
              label = `+${reward.value}`;
              icon = '🪙';
              break;
            case 'score':
              label = `+${reward.value}`;
              icon = '🎯';
              break;
            case 'hints':
              label = `+${reward.value}`;
              icon = '💡';
              break;
            case 'powerup':
              label = `x${reward.value}`;
              icon = reward.powerUpType === 'free_hint' ? '💡' : reward.powerUpType === 'time_peek' ? '👁️' : '❌';
              break;
            case 'points':
              label = `+${reward.value}`;
              icon = '⭐';
              break;
            case 'achievement':
              label = '成就';
              icon = '🏆';
              break;
            case 'title':
              label = '称号';
              icon = '👑';
              break;
            case 'decoration':
              label = '装饰';
              icon = '🎨';
              break;
            case 'multiplier':
              label = `x${reward.value}`;
              icon = '⚡';
              break;
          }
          return (
            <span class="reward-tag">
              <span class="reward-icon">{icon}</span>
              <span class="reward-text">{label}</span>
            </span>
          );
        }}
      </For>
    </div>
  );
};

export default function ActivityCenter(props: ActivityCenterProps) {
  const [activeTab, setActiveTabState] = createSignal<ActivityTab>('overview');
  const info = createMemo(() => getActivityInfo());

  const handleTabChange = (tab: ActivityTab) => {
    setActiveTabState(tab);
    setActivityTab(tab);
  };

  const themeProgressList = createMemo(() => {
    const progress = info().state.activityProgress;
    return info().activeThemes.map((theme: LimitedThemeList) => {
      const p = progress.limitedThemeProgress[theme.id];
      const currentProgress = p?.currentProgress || 0;
      return {
        ...theme,
        progress: currentProgress,
        completed: p?.completed || false,
        claimed: p?.claimed || false,
        foundBookIds: p?.foundBookIds || [],
        percent: Math.min(100, (currentProgress / theme.requiredBooks) * 100),
      };
    });
  });

  const festivalProgressList = createMemo(() => {
    const progress = info().state.activityProgress;
    return info().activeFestivals.map((festival: FestivalChallenge) => {
      const p = progress.festivalChallengeProgress[festival.id];
      const currentProgress = p?.currentProgress || 0;
      return {
        ...festival,
        progress: currentProgress,
        completedStages: p?.completedStages || [],
        completed: p?.completed || false,
        claimed: p?.claimed || false,
        percent: Math.min(100, (currentProgress / festival.target) * 100),
      };
    });
  });

  const pointsSystemList = createMemo(() => {
    const progress = info().state.activityProgress;
    return info().pointsSystems.map((system: PointsRewardSystem) => {
      const p = progress.pointsRewardProgress[system.id];
      const totalPoints = p?.totalPoints || 0;
      const maxPoints = system.tiers[system.tiers.length - 1]?.pointsRequired || 100;
      return {
        ...system,
        totalPoints,
        claimedTiers: p?.claimedTiers || [],
        booksContributed: p?.booksContributed || 0,
        scoreContributed: p?.scoreContributed || 0,
        perfectRounds: p?.perfectRounds || 0,
        noHintRounds: p?.noHintRounds || 0,
        percent: Math.min(100, (totalPoints / maxPoints) * 100),
      };
    });
  });

  const achievementList = createMemo(() => {
    const progress = info().state.activityProgress;
    return info().achievements.map(achievement => ({
      ...achievement,
      unlocked: progress.activityAchievements[achievement.id]?.unlocked || false,
      unlockedAt: progress.activityAchievements[achievement.id]?.unlockedAt,
    }));
  });

  return (
    <div class="activity-center-modal" onClick={props.onClose}>
      <div class="activity-center-content" onClick={(e) => e.stopPropagation()}>
        <div class="activity-header">
          <div>
            <div class="activity-header-title">🎪 活动中心</div>
            <div class="activity-header-subtitle">参与活动赢取丰厚奖励！</div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="activity-points-display">
              <span class="points-icon">⭐</span>
              <div class="points-info">
                <span class="points-label">累计积分</span>
                <span class="points-value">{info().totalPoints}</span>
              </div>
            </div>
            <button class="activity-close-btn" onClick={props.onClose}>✕</button>
          </div>
        </div>

        <div class="activity-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`activity-tab ${activeTab() === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'theme_lists' && info().activeThemes.length > 0 && (
                  <span class="tab-badge">{info().activeThemes.length}</span>
                )}
                {tab.id === 'festivals' && info().activeFestivals.length > 0 && (
                  <span class="tab-badge">{info().activeFestivals.length}</span>
                )}
                {info().unclaimedRewards > 0 && tab.id === 'points' && (
                  <span class="tab-badge">{info().unclaimedRewards}</span>
                )}
              </button>
            )}
          </For>
        </div>

        <div class="activity-body">
          {activeTab() === 'overview' && (
            <div>
              <div class="overview-stats-grid">
                <div class="overview-stat-card">
                  <div class="stat-card-icon">🎯</div>
                  <div class="stat-card-value">{info().stats.totalActivitiesCompleted}</div>
                  <div class="stat-card-label">活动完成</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">⭐</div>
                  <div class="stat-card-value">{Math.floor(info().stats.totalPointsEarned)}</div>
                  <div class="stat-card-label">累计积分</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">🎉</div>
                  <div class="stat-card-value">{info().stats.totalFestivalsParticipated}</div>
                  <div class="stat-card-label">参与节日</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">🎁</div>
                  <div class="stat-card-value">{info().stats.totalActivityRewardsClaimed}</div>
                  <div class="stat-card-label">领取奖励</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">🏆</div>
                  <div class="stat-card-value">{info().stats.totalActivityAchievementsUnlocked}</div>
                  <div class="stat-card-label">活动成就</div>
                </div>
              </div>

              <div class="section-title">📚 进行中的主题书单</div>
              {themeProgressList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">📚</div>
                  <div class="empty-state-text">暂无进行中的主题书单</div>
                </div>
              ) : (
                <div class="activity-list">
                  <For each={themeProgressList().slice(0, 3)}>
                    {(theme) => (
                      <div class={`activity-card ${theme.completed ? 'completed' : ''} active`}>
                        <div class="activity-card-header">
                          <div>
                            <div class="activity-card-title">
                              <span>{theme.icon}</span>
                              <span>{theme.title}</span>
                            </div>
                            <div class="activity-meta">
                              <span class="activity-meta-item">📅 {formatDateRange(theme.startDate, theme.endDate)}</span>
                              {getDaysRemaining(theme.endDate) <= 3 && (
                                <span class="activity-meta-item">⏰ 仅剩{getDaysRemaining(theme.endDate)}天</span>
                              )}
                            </div>
                          </div>
                          <span class={`activity-card-status ${theme.claimed ? 'completed' : theme.completed ? 'claimable' : 'ongoing'}`}>
                            {theme.claimed ? '已领取' : theme.completed ? '可领取' : '进行中'}
                          </span>
                        </div>
                        <div class="activity-card-body">
                          <div class="activity-card-desc">{theme.description}</div>
                          <div class="activity-progress-container">
                            <div class="activity-progress-header">
                              <span>完成进度</span>
                              <span>{theme.progress}/{theme.requiredBooks}</span>
                            </div>
                            <div class="activity-progress-bar">
                              <div class={`activity-progress-fill ${theme.percent >= 80 ? 'high' : ''}`} style={{ width: `${theme.percent}%` }} />
                            </div>
                          </div>
                          <div class="activity-rewards">
                            {renderRewards(theme.rewards)}
                          </div>
                          {theme.completed && !theme.claimed && (
                            <button class="activity-claim-btn" onClick={() => claimReward(theme.id, 'theme')}>
                              🎁 领取奖励
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}

              <div class="section-title">🎉 进行中的节日挑战</div>
              {festivalProgressList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">🎉</div>
                  <div class="empty-state-text">暂无进行中的节日挑战</div>
                </div>
              ) : (
                <div class="activity-list">
                  <For each={festivalProgressList().slice(0, 3)}>
                    {(festival) => (
                      <div class={`activity-card ${festival.completed ? 'completed' : ''} active`}>
                        <div class="activity-card-header">
                          <div>
                            <div class="activity-card-title">
                              <span>{festival.icon}</span>
                              <span>{festival.title}</span>
                            </div>
                            <div class="activity-meta">
                              <span class="activity-meta-item">📅 {formatDateRange(festival.startDate, festival.endDate)}</span>
                            </div>
                          </div>
                          <span class={`activity-card-status ${festival.claimed ? 'completed' : festival.completed ? 'claimable' : 'ongoing'}`}>
                            {festival.claimed ? '已领取' : festival.completed ? '可领取' : '进行中'}
                          </span>
                        </div>
                        <div class="activity-card-body">
                          <div class="activity-card-desc">{festival.description}</div>
                          <div class="activity-progress-container">
                            <div class="activity-progress-header">
                              <span>挑战进度</span>
                              <span>{festival.progress}/{festival.target}</span>
                            </div>
                            <div class="activity-progress-bar">
                              <div class={`activity-progress-fill ${festival.percent >= 80 ? 'high' : ''}`} style={{ width: `${festival.percent}%` }} />
                            </div>
                          </div>
                          {festival.completed && !festival.claimed && (
                            <button class="activity-claim-btn" onClick={() => claimReward(festival.id, 'festival')}>
                              🎁 领取奖励
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </div>
          )}

          {activeTab() === 'theme_lists' && (
            <div>
              <div class="section-title">📚 限时主题书单</div>
              {themeProgressList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">📚</div>
                  <div class="empty-state-text">暂无主题书单活动，敬请期待！</div>
                </div>
              ) : (
                <div class="activity-list">
                  <For each={themeProgressList()}>
                    {(theme) => {
                      const books = theme.bookIds.map(id => BOOKS.find(b => b.id === id)).filter(Boolean);
                      return (
                        <div class={`activity-card ${theme.completed ? 'completed' : ''} active`}>
                          <div class="activity-card-header">
                            <div>
                              <div class="activity-card-title">
                                <span>{theme.icon}</span>
                                <span>{theme.title}</span>
                              </div>
                              <div class="activity-meta">
                                <span class="activity-meta-item">📅 {formatDateRange(theme.startDate, theme.endDate)}</span>
                                <span class="activity-meta-item">⚡ x{theme.scoreMultiplier}得分</span>
                                <span class="activity-meta-item">🪙 x{theme.coinMultiplier}金币</span>
                              </div>
                            </div>
                            <span class={`activity-card-status ${theme.claimed ? 'completed' : theme.completed ? 'claimable' : 'ongoing'}`}>
                              {theme.claimed ? '已领取' : theme.completed ? '可领取' : '进行中'}
                            </span>
                          </div>
                          <div class="activity-card-body">
                            <div class="activity-card-desc">{theme.description}</div>
                            <div class="activity-books-list">
                              <For each={books}>
                                {(book: any) => {
                                  const found = theme.foundBookIds.includes(book.id);
                                  return (
                                    <div class={`theme-book-item ${found ? 'found' : ''}`}>
                                      <div class="theme-book-icon">{book.icon || '📖'}</div>
                                      <div class="theme-book-title">{book.title}</div>
                                      <div class={`theme-book-status ${found ? 'found' : 'not-found'}`}>
                                        {found ? '✓ 已找到' : '未找到'}
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                            <div class="activity-progress-container">
                              <div class="activity-progress-header">
                                <span>完成进度</span>
                                <span>{theme.progress}/{theme.requiredBooks} ({Math.floor(theme.percent)}%)</span>
                              </div>
                              <div class="activity-progress-bar">
                                <div class={`activity-progress-fill ${theme.percent >= 80 ? 'high' : ''}`} style={{ width: `${theme.percent}%` }} />
                              </div>
                            </div>
                            <div class="section-title" style="font-size: 0.95rem; margin: 12px 0 8px;">完成奖励</div>
                            {renderRewards(theme.rewards)}
                            {theme.completed && !theme.claimed && (
                              <button class="activity-claim-btn" onClick={() => claimReward(theme.id, 'theme')} style="margin-top: 12px;">
                                🎁 领取奖励
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              )}
            </div>
          )}

          {activeTab() === 'festivals' && (
            <div>
              <div class="section-title">🎉 节日挑战</div>
              {festivalProgressList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">🎉</div>
                  <div class="empty-state-text">暂无节日挑战，敬请期待！</div>
                </div>
              ) : (
                <div class="activity-list">
                  <For each={festivalProgressList()}>
                    {(festival) => (
                      <div class={`activity-card ${festival.completed ? 'completed' : ''} active`}>
                        <div class="activity-card-header">
                          <div>
                            <div class="activity-card-title">
                              <span>{festival.icon}</span>
                              <span>{festival.title}</span>
                            </div>
                            <div class="activity-meta">
                              <span class="activity-meta-item">📅 {formatDateRange(festival.startDate, festival.endDate)}</span>
                              {getDaysRemaining(festival.endDate) <= 5 && (
                                <span class="activity-meta-item">🔥 仅剩{getDaysRemaining(festival.endDate)}天</span>
                              )}
                            </div>
                          </div>
                          <span class={`activity-card-status ${festival.claimed ? 'completed' : festival.completed ? 'claimable' : 'ongoing'}`}>
                            {festival.claimed ? '已领取' : festival.completed ? '可领取' : '进行中'}
                          </span>
                        </div>
                        <div class="activity-card-body">
                          <div class="activity-card-desc">{festival.description}</div>
                          <div class="activity-progress-container">
                            <div class="activity-progress-header">
                              <span>挑战进度</span>
                              <span>{festival.progress}/{festival.target} ({Math.floor(festival.percent)}%)</span>
                            </div>
                            <div class="activity-progress-bar">
                              <div class={`activity-progress-fill ${festival.percent >= 80 ? 'high' : ''}`} style={{ width: `${festival.percent}%` }} />
                            </div>
                          </div>
                          {festival.stages && festival.stages.length > 0 && (
                            <div style="margin: 12px 0;">
                              <div class="section-title" style="font-size: 0.95rem; margin: 0 0 8px;">挑战阶段</div>
                              <div class="points-tiers-list">
                                <For each={festival.stages}>
                                  {(stage, idx) => {
                                    const isDone = festival.completedStages.includes(stage.id);
                                    return (
                                      <div class={`points-tier-item ${isDone ? 'achieved' : ''}`}>
                                        <div class="points-tier-level">{idx() + 1}</div>
                                        <div class="points-tier-info">
                                          <div class="points-tier-name">{stage.title}</div>
                                          <div class="points-tier-requirement">{stage.description} · 目标{stage.threshold}</div>
                                          <div style="margin-top: 4px;">{renderRewards(stage.rewards)}</div>
                                        </div>
                                        {isDone ? <span style="color: #64c864;">✓</span> : <span style="color: #a08060;">🔒</span>}
                                      </div>
                                    );
                                  }}
                                </For>
                              </div>
                            </div>
                          )}
                          {festival.completionReward && festival.completionReward.length > 0 && (
                            <div style="margin: 12px 0;">
                              <div class="section-title" style="font-size: 0.95rem; margin: 0 0 8px;">🏆 完成大奖</div>
                              {renderRewards(festival.completionReward)}
                            </div>
                          )}
                          {festival.completed && !festival.claimed && (
                            <button class="activity-claim-btn" onClick={() => claimReward(festival.id, 'festival')} style="margin-top: 12px;">
                              🎁 领取完成大奖
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </div>
          )}

          {activeTab() === 'points' && (
            <div>
              <div class="section-title">⭐ 累计积分奖励</div>
              {pointsSystemList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">⭐</div>
                  <div class="empty-state-text">暂无积分活动，敬请期待！</div>
                </div>
              ) : (
                <For each={pointsSystemList()}>
                  {(system) => (
                    <div class="activity-card active" style="margin-bottom: 16px;">
                      <div class="activity-card-header">
                        <div>
                          <div class="activity-card-title">
                            <span>{system.icon}</span>
                            <span>{system.title}</span>
                          </div>
                          <div class="activity-card-desc" style="margin-top: 4px;">{system.description}</div>
                          <div class="activity-meta" style="margin-top: 8px;">
                            <span class="activity-meta-item">📚 每本书 +{system.pointsPerBook}分</span>
                            <span class="activity-meta-item">🎯 每100分 +{Math.floor(system.pointsPerScore * 100)}分</span>
                            <span class="activity-meta-item">⭐ 完美局 +{system.pointsPerPerfectRound}分</span>
                            <span class="activity-meta-item">💡 无提示 +{system.pointsPerNoHint}分</span>
                          </div>
                        </div>
                        <div style="text-align: right;">
                          <div style="font-size: 2rem; font-weight: bold; color: #ffd700;">{Math.floor(system.totalPoints)}</div>
                          <div style="font-size: 0.8rem; color: #a08060;">当前积分</div>
                        </div>
                      </div>
                      <div class="activity-card-body">
                        <div class="activity-progress-container">
                          <div class="activity-progress-header">
                            <span>总体进度</span>
                            <span>{Math.floor(system.percent)}%</span>
                          </div>
                          <div class="activity-progress-bar">
                            <div class={`activity-progress-fill ${system.percent >= 80 ? 'high' : ''}`} style={{ width: `${system.percent}%` }} />
                          </div>
                        </div>
                        <div class="activity-meta" style="margin: 12px 0;">
                          <span class="activity-meta-item">📚 贡献书籍：{system.booksContributed}</span>
                          <span class="activity-meta-item">🎯 贡献得分：{Math.floor(system.scoreContributed)}</span>
                          <span class="activity-meta-item">⭐ 完美局：{system.perfectRounds}</span>
                          <span class="activity-meta-item">💡 无提示局：{system.noHintRounds}</span>
                        </div>
                        <div class="section-title" style="font-size: 0.95rem; margin: 12px 0 8px;">奖励档位</div>
                        <div class="points-tiers-list">
                          <For each={system.tiers}>
                            {(tier) => {
                              const isUnlocked = system.totalPoints >= tier.pointsRequired;
                              const isClaimed = system.claimedTiers.includes(tier.id);
                              return (
                                <div class={`points-tier-item ${isClaimed ? 'achieved' : isUnlocked ? 'claimable' : ''}`}>
                                  <div class="points-tier-level">{tier.icon}</div>
                                  <div class="points-tier-info">
                                    <div class="points-tier-name">{tier.title}</div>
                                    <div class="points-tier-requirement">{tier.description} · 需要 {tier.pointsRequired} 积分</div>
                                    <div style="margin-top: 4px;">{renderRewards(tier.rewards)}</div>
                                  </div>
                                  {isClaimed ? (
                                    <span style="color: #64c864; font-size: 0.85rem;">✓ 已领取</span>
                                  ) : isUnlocked ? (
                                    <button class="points-tier-claim-btn" onClick={() => claimReward(system.id, 'points_tier', tier.id)}>
                                      领取
                                    </button>
                                  ) : (
                                    <span style="color: #a08060; font-size: 0.85rem;">🔒 未达成</span>
                                  )}
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              )}
            </div>
          )}

          {activeTab() === 'achievements' && (
            <div>
              <div class="section-title">🏆 活动成就</div>
              <div style="margin-bottom: 16px; color: #a08060;">
                已解锁 {achievementList().filter(a => a.unlocked).length} / {achievementList().length} 个成就
              </div>
              <div class="achievements-grid">
                <For each={achievementList()}>
                  {(achievement) => (
                    <div class={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                      <div class="achievement-card-icon">{achievement.icon}</div>
                      <div class="achievement-card-title">{achievement.title}</div>
                      <div class="achievement-card-desc">{achievement.description}</div>
                      {renderRewards(achievement.rewards)}
                      <div style="margin-top: 8px;">
                        <span class={`achievement-card-rarity ${achievement.unlocked ? 'legendary' : 'common'}`}>
                          {achievement.unlocked ? '✓ 已解锁' : '🔒 未解锁'}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
