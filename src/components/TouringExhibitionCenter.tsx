import { createSignal, For, createMemo } from 'solid-js';
import type { ExhibitionTab, ActivityReward, TouringExhibition, RuleAdjustment, LimitedCollectionReward } from '../types/touringExhibition';
import {
  getExhibitionInfo,
  setExhibitionTab,
  claimExhibitionRewardById,
} from '../store/touringExhibitionStore';
import { BOOKS } from '../data/books';
import { RARITY_CONFIG } from '../data/themes';
import { TOURING_EXHIBITIONS } from '../data/touringExhibition';

interface TouringExhibitionCenterProps {
  onClose: () => void;
}

const TABS: { id: ExhibitionTab; label: string; icon: string }[] = [
  { id: 'overview', label: '总览', icon: '🏠' },
  { id: 'current', label: '当前展陈', icon: '🎨' },
  { id: 'upcoming', label: '即将开始', icon: '⏳' },
  { id: 'history', label: '历史展陈', icon: '📜' },
  { id: 'collection', label: '限时收藏', icon: '💎' },
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

const getDaysUntilStart = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const diff = start.getTime() - now.getTime();
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

const renderRuleAdjustments = (rules: RuleAdjustment[]) => {
  return (
    <div class="exhibition-rules">
      <div class="section-title" style="font-size: 0.95rem; margin: 0 0 8px;">📋 展陈规则修正</div>
      <div class="rules-list">
        <For each={rules}>
          {(rule) => {
            let icon = '';
            switch (rule.effectType) {
              case 'score_multiplier':
                icon = '🎯';
                break;
              case 'coin_multiplier':
                icon = '🪙';
                break;
              case 'hint_count':
                icon = '💡';
                break;
              case 'time_bonus':
                icon = '⏱️';
                break;
              case 'rarity_boost':
                icon = '💎';
                break;
              case 'difficulty_adjust':
                icon = '⚔️';
                break;
            }
            return (
              <div class="rule-item">
                <span class="rule-icon">{icon}</span>
                <div class="rule-content">
                  <div class="rule-description">{rule.description}</div>
                  {rule.condition && <div class="rule-condition">{rule.condition}</div>}
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

const renderLimitedCollection = (collections: (LimitedCollectionReward & { unlocked: boolean })[]) => {
  return (
    <div class="limited-collection">
      <div class="section-title" style="font-size: 0.95rem; margin: 12px 0 8px;">💎 限时收藏奖励</div>
      <div class="collection-list">
        <For each={collections}>
          {(collection) => {
            return (
              <div class={`collection-item ${collection.unlocked ? 'unlocked' : 'locked'}`}>
                <div class="collection-icon" style={{ color: collection.unlocked ? RARITY_CONFIG[collection.rarity].color : '#666' }}>
                  {collection.icon}
                </div>
                <div class="collection-info">
                  <div class="collection-title">{collection.title}</div>
                  <div class="collection-desc">{collection.description}</div>
                  <div class="collection-condition">
                    {collection.unlocked ? '✓ 已解锁' : `🔒 ${collection.unlockCondition}`}
                  </div>
                  <div class="collection-rarity" style={{ color: RARITY_CONFIG[collection.rarity].color }}>
                    {RARITY_CONFIG[collection.rarity].icon} {RARITY_CONFIG[collection.rarity].name}
                    {collection.exclusive && <span class="exclusive-badge">限定</span>}
                    {collection.expiresAfterExhibition && <span class="expire-badge">限时</span>}
                  </div>
                </div>
                {collection.unlocked && <span class="collection-unlocked-check">✓</span>}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default function TouringExhibitionCenter(props: TouringExhibitionCenterProps) {
  const [activeTab, setActiveTabState] = createSignal<ExhibitionTab>('overview');
  const info = createMemo(() => getExhibitionInfo());

  const handleTabChange = (tab: ExhibitionTab) => {
    setActiveTabState(tab);
    setExhibitionTab(tab);
  };

  const exhibitionProgressList = createMemo(() => {
    const progress = info().state.exhibitionProgress;
    return info().activeExhibitions.map((exhibition: TouringExhibition) => {
      const p = progress[exhibition.id];
      const currentProgress = p?.currentProgress || 0;
      return {
        ...exhibition,
        progress: currentProgress,
        completed: p?.completed || false,
        claimed: p?.claimed || false,
        foundBookIds: p?.foundBookIds || [],
        collectedBookIds: p?.collectedBookIds || [],
        percent: Math.min(100, (currentProgress / exhibition.requiredBooks) * 100),
        collectionPoints: p?.collectionPoints || 0,
      };
    });
  });

  const upcomingList = createMemo(() => {
    return info().upcomingExhibitions;
  });

  const historyList = createMemo(() => {
    const progress = info().state.exhibitionProgress;
    return info().completedExhibitions.map((exhibition: TouringExhibition) => {
      const p = progress[exhibition.id];
      return {
        ...exhibition,
        progress: p?.currentProgress || 0,
        completed: p?.completed || false,
        claimed: p?.claimed || false,
        percent: Math.min(100, ((p?.currentProgress || 0) / exhibition.requiredBooks) * 100),
      };
    });
  });

  const allLimitedCollections = createMemo(() => {
    const progress = info().state.exhibitionProgress;
    const collections: Array<LimitedCollectionReward & { unlocked: boolean; exhibitionTitle: string; exhibitionId: string }> = [];
    
    for (const ex of info().activeExhibitions) {
      const exProgress = progress[ex.id];
      const currentProgress = exProgress?.currentProgress || 0;
      for (const collection of ex.limitedCollection) {
        collections.push({
          ...collection,
          unlocked: currentProgress >= collection.unlockThreshold,
          exhibitionTitle: ex.title,
          exhibitionId: ex.id,
        });
      }
    }
    
    for (const ex of info().completedExhibitions) {
      const exProgress = progress[ex.id];
      const currentProgress = exProgress?.currentProgress || 0;
      for (const collection of ex.limitedCollection) {
        collections.push({
          ...collection,
          unlocked: currentProgress >= collection.unlockThreshold,
          exhibitionTitle: ex.title,
          exhibitionId: ex.id,
        });
      }
    }
    
    return collections;
  });

  return (
    <div class="exhibition-center-modal" onClick={props.onClose}>
      <div class="exhibition-center-content" onClick={(e) => e.stopPropagation()}>
        <div class="exhibition-header">
          <div>
            <div class="exhibition-header-title">🎪 巡回展陈</div>
            <div class="exhibition-header-subtitle">参与城市与主题展陈，赢取限时收藏奖励！</div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="exhibition-points-display">
              <span class="points-icon">💎</span>
              <div class="points-info">
                <span class="points-label">收藏积分</span>
                <span class="points-value">{Math.floor(info().totalCollectionPoints)}</span>
              </div>
            </div>
            <button class="exhibition-close-btn" onClick={props.onClose}>✕</button>
          </div>
        </div>

        <div class="exhibition-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`exhibition-tab ${activeTab() === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'current' && info().activeExhibitions.length > 0 && (
                  <span class="tab-badge">{info().activeExhibitions.length}</span>
                )}
                {tab.id === 'upcoming' && info().upcomingExhibitions.length > 0 && (
                  <span class="tab-badge">{info().upcomingExhibitions.length}</span>
                )}
                {info().unclaimedRewards > 0 && tab.id === 'current' && (
                  <span class="tab-badge unclaimed">{info().unclaimedRewards}</span>
                )}
                {tab.id === 'collection' && allLimitedCollections().filter(c => c.unlocked).length > 0 && (
                  <span class="tab-badge">{allLimitedCollections().filter(c => c.unlocked).length}</span>
                )}
              </button>
            )}
          </For>
        </div>

        <div class="exhibition-body">
          {activeTab() === 'overview' && (
            <div>
              <div class="overview-stats-grid">
                <div class="overview-stat-card">
                  <div class="stat-card-icon">🎨</div>
                  <div class="stat-card-value">{info().stats.totalExhibitionsParticipated}</div>
                  <div class="stat-card-label">参与展陈</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">✅</div>
                  <div class="stat-card-value">{info().stats.totalExhibitionsCompleted}</div>
                  <div class="stat-card-label">完成展陈</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">💎</div>
                  <div class="stat-card-value">{Math.floor(info().stats.totalCollectionPoints)}</div>
                  <div class="stat-card-label">收藏积分</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">📚</div>
                  <div class="stat-card-value">{info().stats.totalLimitedBooksCollected}</div>
                  <div class="stat-card-label">限量藏书</div>
                </div>
                <div class="overview-stat-card">
                  <div class="stat-card-icon">🎁</div>
                  <div class="stat-card-value">{info().stats.totalExhibitionRewardsClaimed}</div>
                  <div class="stat-card-label">领取奖励</div>
                </div>
              </div>

              <div class="section-title">🎨 精选展陈</div>
              {exhibitionProgressList().filter(e => e.featured).length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">🎨</div>
                  <div class="empty-state-text">暂无精选展陈</div>
                </div>
              ) : (
                <div class="exhibition-list">
                  <For each={exhibitionProgressList().filter(e => e.featured)}>
                    {(exhibition) => (
                      <div class={`exhibition-card ${exhibition.completed ? 'completed' : ''} active ${exhibition.type}`}>
                        <div class={`exhibition-card-header bg-${exhibition.backgroundStyle}`}>
                          <div class="exhibition-type-badge">
                            {exhibition.type === 'city' ? '🏙️ 城市巡展' : '🎯 主题展'}
                          </div>
                          {exhibition.cityIcon && (
                            <div class="exhibition-city-icon">{exhibition.cityIcon}</div>
                          )}
                        </div>
                        <div class="exhibition-card-body">
                          <div class="exhibition-card-title">
                            <span>{exhibition.icon}</span>
                            <span>{exhibition.title}</span>
                          </div>
                          <div class="exhibition-card-subtitle">{exhibition.subtitle}</div>
                          <div class="exhibition-meta">
                            <span class="exhibition-meta-item">📅 {formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
                            {getDaysRemaining(exhibition.endDate) <= 3 && (
                              <span class="exhibition-meta-item urgent">⏰ 仅剩{getDaysRemaining(exhibition.endDate)}天</span>
                            )}
                          </div>
                          <div class="exhibition-card-desc">{exhibition.description}</div>
                          <div class="exhibition-progress-container">
                            <div class="exhibition-progress-header">
                              <span>完成进度</span>
                              <span>{exhibition.progress}/{exhibition.requiredBooks}</span>
                            </div>
                            <div class="exhibition-progress-bar">
                              <div class={`exhibition-progress-fill ${exhibition.percent >= 80 ? 'high' : ''}`} style={{ width: `${exhibition.percent}%` }} />
                            </div>
                          </div>
                          {exhibition.completed && !exhibition.claimed && (
                            <button class="exhibition-claim-btn" onClick={() => claimExhibitionRewardById(exhibition.id)}>
                              🎁 领取完成大奖
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}

              <div class="section-title">🏙️ 城市巡展路线</div>
              <div class="city-tour-map">
                <For each={TOURING_EXHIBITIONS.filter(e => e.type === 'city').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())}>
                  {(city, idx) => {
                    const isActive = info().activeExhibitions.some(e => e.id === city.id);
                    const isCompleted = info().completedExhibitions.some(e => e.id === city.id);
                    return (
                      <div class={`city-tour-item ${isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}>
                        <div class="city-tour-dot">
                          {isCompleted ? '✓' : isActive ? city.cityIcon : '🔒'}
                        </div>
                        <div class="city-tour-info">
                          <div class="city-tour-name">{city.city} {city.cityIcon}</div>
                          <div class="city-tour-date">{formatDateRange(city.startDate, city.endDate)}</div>
                          <div class="city-tour-status">
                            {isActive ? '进行中' : isCompleted ? '已结束' : `即将开始 (${getDaysUntilStart(city.startDate)}天后)`}
                          </div>
                        </div>
                        {idx() < TOURING_EXHIBITIONS.filter(e => e.type === 'city').length - 1 && (
                          <div class="city-tour-line" />
                        )}
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          )}

          {activeTab() === 'current' && (
            <div>
              <div class="section-title">🎨 当前展陈</div>
              {exhibitionProgressList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">🎨</div>
                  <div class="empty-state-text">暂无进行中的展陈，敬请期待！</div>
                </div>
              ) : (
                <div class="exhibition-list">
                  <For each={exhibitionProgressList()}>
                    {(exhibition) => {
                      const books = exhibition.bookIds.map(id => BOOKS.find(b => b.id === id)).filter(Boolean);
                      const progress = info().state.exhibitionProgress[exhibition.id];
                      const currentProgress = progress?.currentProgress || 0;
                      const collectionsWithStatus = exhibition.limitedCollection.map(c => ({
                        ...c,
                        unlocked: currentProgress >= c.unlockThreshold,
                      }));
                      
                      return (
                        <div class={`exhibition-card ${exhibition.completed ? 'completed' : ''} active ${exhibition.type}`}>
                          <div class={`exhibition-card-header bg-${exhibition.backgroundStyle}`}>
                            <div class="exhibition-type-badge">
                              {exhibition.type === 'city' ? '🏙️ 城市巡展' : '🎯 主题展'}
                            </div>
                            <span class={`exhibition-card-status ${exhibition.claimed ? 'completed' : exhibition.completed ? 'claimable' : 'ongoing'}`}>
                              {exhibition.claimed ? '已领取' : exhibition.completed ? '可领取' : '进行中'}
                            </span>
                          </div>
                          <div class="exhibition-card-body">
                            <div class="exhibition-card-title">
                              <span>{exhibition.icon}</span>
                              <span>{exhibition.title}</span>
                            </div>
                            <div class="exhibition-card-subtitle">{exhibition.subtitle}</div>
                            <div class="exhibition-meta">
                              <span class="exhibition-meta-item">📅 {formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
                              {getDaysRemaining(exhibition.endDate) <= 5 && (
                                <span class="exhibition-meta-item urgent">🔥 仅剩{getDaysRemaining(exhibition.endDate)}天</span>
                              )}
                            </div>
                            <div class="exhibition-card-desc">{exhibition.description}</div>
                            
                            {renderRuleAdjustments(exhibition.ruleAdjustments)}

                            <div class="section-title" style="font-size: 0.95rem; margin: 12px 0 8px;">📚 展陈书单</div>
                            <div class="exhibition-books-list">
                              <For each={books}>
                                {(book: any) => {
                                  const found = exhibition.foundBookIds.includes(book.id);
                                  const isLimited = book.workshopReward;
                                  return (
                                    <div class={`theme-book-item ${found ? 'found' : ''} ${isLimited ? 'limited' : ''}`}>
                                      <div class="theme-book-icon">{book.icon || '📖'}</div>
                                      <div class="theme-book-info">
                                        <div class="theme-book-title">{book.title}</div>
                                        <div class="theme-book-author">{book.author}</div>
                                      </div>
                                      <div class={`theme-book-status ${found ? 'found' : 'not-found'}`}>
                                        {found ? '✓ 已找到' : '未找到'}
                                        {isLimited && <span class="limited-badge">限定</span>}
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>

                            <div class="exhibition-progress-container" style="margin-top: 16px;">
                              <div class="exhibition-progress-header">
                                <span>完成进度</span>
                                <span>{exhibition.progress}/{exhibition.requiredBooks} ({Math.floor(exhibition.percent)}%)</span>
                              </div>
                              <div class="exhibition-progress-bar">
                                <div class={`exhibition-progress-fill ${exhibition.percent >= 80 ? 'high' : ''}`} style={{ width: `${exhibition.percent}%` }} />
                              </div>
                            </div>

                            {renderLimitedCollection(collectionsWithStatus)}

                            {exhibition.completionReward && exhibition.completionReward.length > 0 && (
                              <div style="margin: 12px 0;">
                                <div class="section-title" style="font-size: 0.95rem; margin: 0 0 8px;">🏆 完成大奖</div>
                                {renderRewards(exhibition.completionReward)}
                              </div>
                            )}

                            {exhibition.completed && !exhibition.claimed && (
                              <button class="exhibition-claim-btn" style="margin-top: 12px;" onClick={() => claimExhibitionRewardById(exhibition.id)}>
                                🎁 领取完成大奖
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

          {activeTab() === 'upcoming' && (
            <div>
              <div class="section-title">⏳ 即将开始</div>
              {upcomingList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">⏳</div>
                  <div class="empty-state-text">暂无即将开始的展陈</div>
                </div>
              ) : (
                <div class="exhibition-list">
                  <For each={upcomingList()}>
                    {(exhibition) => (
                      <div class={`exhibition-card upcoming ${exhibition.type}`}>
                        <div class={`exhibition-card-header bg-${exhibition.backgroundStyle}`}>
                          <div class="exhibition-type-badge">
                            {exhibition.type === 'city' ? '🏙️ 城市巡展' : '🎯 主题展'}
                          </div>
                          <div class="exhibition-countdown">
                            {getDaysUntilStart(exhibition.startDate)}天后开始
                          </div>
                        </div>
                        <div class="exhibition-card-body">
                          <div class="exhibition-card-title">
                            <span>{exhibition.icon}</span>
                            <span>{exhibition.title}</span>
                          </div>
                          <div class="exhibition-card-subtitle">{exhibition.subtitle}</div>
                          <div class="exhibition-meta">
                            <span class="exhibition-meta-item">📅 {formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
                            <span class="exhibition-meta-item">⏳ {getDaysUntilStart(exhibition.startDate)}天后开始</span>
                          </div>
                          <div class="exhibition-card-desc">{exhibition.description}</div>
                          
                          {renderRuleAdjustments(exhibition.ruleAdjustments)}

                          <div class="section-title" style="font-size: 0.95rem; margin: 12px 0 8px;">📚 展陈书单预览</div>
                          <div class="exhibition-books-preview">
                            <For each={exhibition.bookIds.slice(0, 4)}>
                              {(bookId) => {
                                const book = BOOKS.find(b => b.id === bookId);
                                return book ? (
                                  <div class="book-preview-item">
                                    <span>{book.icon || '📖'}</span>
                                    <span>{book.title}</span>
                                  </div>
                                ) : null;
                              }}
                            </For>
                            {exhibition.bookIds.length > 4 && (
                              <div class="book-preview-more">+{exhibition.bookIds.length - 4} 更多</div>
                            )}
                          </div>

                          {exhibition.limitedCollection.length > 0 && (
                            <div style="margin-top: 12px;">
                              <div class="section-title" style="font-size: 0.95rem; margin: 0 0 8px;">💎 限时收藏预览</div>
                              <div class="collection-preview">
                                <For each={exhibition.limitedCollection}>
                                  {(collection) => (
                                    <div class="collection-preview-item">
                                      <span class="collection-preview-icon">{collection.icon}</span>
                                      <span class="collection-preview-title">{collection.title}</span>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </div>
          )}

          {activeTab() === 'history' && (
            <div>
              <div class="section-title">📜 历史展陈</div>
              {historyList().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">📜</div>
                  <div class="empty-state-text">暂无历史展陈记录</div>
                </div>
              ) : (
                <div class="exhibition-list">
                  <For each={historyList()}>
                    {(exhibition) => (
                      <div class={`exhibition-card history ${exhibition.type} ${exhibition.completed ? 'completed' : ''}`}>
                        <div class={`exhibition-card-header bg-${exhibition.backgroundStyle}`}>
                          <div class="exhibition-type-badge">
                            {exhibition.type === 'city' ? '🏙️ 城市巡展' : '🎯 主题展'}
                          </div>
                          <span class={`exhibition-card-status ${exhibition.completed ? 'completed' : 'expired'}`}>
                            {exhibition.completed ? (exhibition.claimed ? '已完成' : '未领取') : '未完成'}
                          </span>
                        </div>
                        <div class="exhibition-card-body">
                          <div class="exhibition-card-title">
                            <span>{exhibition.icon}</span>
                            <span>{exhibition.title}</span>
                          </div>
                          <div class="exhibition-card-subtitle">{exhibition.subtitle}</div>
                          <div class="exhibition-meta">
                            <span class="exhibition-meta-item">📅 {formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
                          </div>
                          <div class="exhibition-progress-container">
                            <div class="exhibition-progress-header">
                              <span>完成进度</span>
                              <span>{exhibition.progress}/{exhibition.requiredBooks} ({Math.floor(exhibition.percent)}%)</span>
                            </div>
                            <div class="exhibition-progress-bar">
                              <div class={`exhibition-progress-fill ${exhibition.percent >= 80 ? 'high' : ''}`} style={{ width: `${exhibition.percent}%` }} />
                            </div>
                          </div>
                          {exhibition.completed && !exhibition.claimed && (
                            <button class="exhibition-claim-btn" style="margin-top: 12px;" onClick={() => claimExhibitionRewardById(exhibition.id)}>
                              🎁 补领奖励
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

          {activeTab() === 'collection' && (
            <div>
              <div class="section-title">💎 限时收藏馆</div>
              <div style="margin-bottom: 16px; color: #a08060;">
                已解锁 {allLimitedCollections().filter(c => c.unlocked).length} / {allLimitedCollections().length} 件限量藏品
              </div>
              {allLimitedCollections().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-state-icon">💎</div>
                  <div class="empty-state-text">暂无限量藏品</div>
                </div>
              ) : (
                <div class="limited-collection-grid">
                  <For each={allLimitedCollections()}>
                    {(collection) => {
                      const book = BOOKS.find(b => b.id === collection.bookId);
                      return (
                        <div class={`collection-card ${collection.unlocked ? 'unlocked' : 'locked'}`}>
                          <div class="collection-card-icon" style={{ color: collection.unlocked ? RARITY_CONFIG[collection.rarity].color : '#666' }}>
                            {collection.icon}
                          </div>
                          <div class="collection-card-title">{collection.title}</div>
                          <div class="collection-card-exhibition">来自：{collection.exhibitionTitle}</div>
                          <div class="collection-card-desc">{collection.description}</div>
                          <div class="collection-card-rarity" style={{ color: RARITY_CONFIG[collection.rarity].color }}>
                            {RARITY_CONFIG[collection.rarity].icon} {RARITY_CONFIG[collection.rarity].name}
                          </div>
                          <div class="collection-card-condition">
                            {collection.unlocked ? '✓ 已解锁' : `🔒 ${collection.unlockCondition}`}
                          </div>
                          {book && (
                            <div class="collection-card-book">
                              <div class="collection-book-author">作者：{book.author}</div>
                              <div class="collection-book-year">出版年份：{book.year > 0 ? book.year : `公元前${-book.year}年`}</div>
                            </div>
                          )}
                          <div class="collection-card-tags">
                            {collection.exclusive && <span class="tag exclusive">限定</span>}
                            {collection.expiresAfterExhibition && <span class="tag expire">限时</span>}
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
