import { createMemo } from 'solid-js';
import {
  storeState,
  activeStoreTab,
  setActiveStoreTab,
  getStoreInfo,
  arrangeShelf,
  claimReward,
  setActiveCustomer,
} from '../store/storeManager';
import type { StoreTab } from '../types/storeManager';

const tabs: { id: StoreTab; label: string; icon: string }[] = [
  { id: 'overview', label: '经营概览', icon: '🏪' },
  { id: 'customers', label: '顾客偏好', icon: '👥' },
  { id: 'arrangement', label: '书架整理', icon: '📚' },
  { id: 'tasks', label: '任务收益', icon: '📋' },
];

interface StoreManagerProps {
  onClose: () => void;
}

export default function StoreManager(props: StoreManagerProps) {
  const info = getStoreInfo();
  const state = createMemo(() => storeState());

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  const getProgressPercent = (current: number, max: number): number => {
    return Math.min((current / max) * 100, 100);
  };

  const handleArrangeShelf = (arrangementId: string) => {
    const result = arrangeShelf(arrangementId);
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleClaimReward = (taskId: string) => {
    claimReward(taskId);
  };

  const handleSetActiveCustomer = (customerId: string | null) => {
    setActiveCustomer(customerId);
  };

  return (
    <div class="store-manager-overlay" onClick={props.onClose}>
      <div class="store-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div class="store-manager-header">
          <div class="store-manager-title">
            <span class="store-icon">🏪</span>
            <span>店长经营</span>
            <span class="store-level-badge">Lv.{state().storeLevel}</span>
          </div>
          <button class="close-button" onClick={props.onClose}>✕</button>
        </div>

        <div class="store-stats-bar">
          <div class="store-stat-item">
            <div class="store-stat-icon">💰</div>
            <div class="store-stat-info">
              <div class="store-stat-label">金币</div>
              <div class="store-stat-value">{formatNumber(state().coins)}</div>
            </div>
          </div>
          <div class="store-stat-item">
            <div class="store-stat-icon">⭐</div>
            <div class="store-stat-info">
              <div class="store-stat-label">声望</div>
              <div class="store-stat-value">{formatNumber(state().reputation)}/{formatNumber(state().maxReputation)}</div>
            </div>
          </div>
          <div class="store-stat-item">
            <div class="store-stat-icon">📅</div>
            <div class="store-stat-info">
              <div class="store-stat-label">营业天数</div>
              <div class="store-stat-value">第 {state().currentDay} 天</div>
            </div>
          </div>
          <div class="store-stat-item">
            <div class="store-stat-icon">🔥</div>
            <div class="store-stat-info">
              <div class="store-stat-label">连续营业</div>
              <div class="store-stat-value">{state().consecutiveDays} 天</div>
            </div>
          </div>
        </div>

        <div class="store-tabs">
          {tabs.map((tab) => (
            <button
              class={`store-tab ${activeStoreTab() === tab.id ? 'active' : ''}`}
              onClick={() => setActiveStoreTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div class="store-tab-content">
          {activeStoreTab() === 'overview' && (
            <div class="overview-tab">
            <div class="today-summary">
              <h3>📊 今日营业</h3>
              <div class="today-stats">
                <div class="today-stat">
                  <span class="today-stat-icon">📖</span>
                  <span class="today-stat-value">{state().todayBooksFound}</span>
                  <span class="today-stat-label">本书籍</span>
                </div>
                <div class="today-stat">
                  <span class="today-stat-icon">👥</span>
                  <span class="today-stat-value">{state().todayCustomersServed}</span>
                  <span class="today-stat-label">位顾客</span>
                </div>
                <div class="today-stat">
                  <span class="today-stat-icon">💰</span>
                  <span class="today-stat-value">{formatNumber(state().todayCoinsEarned)}</span>
                  <span class="today-stat-label">金币收入</span>
                </div>
                <div class="today-stat">
                  <span class="today-stat-icon">🧹</span>
                  <span class="today-stat-value">{state().todayShelvesArranged}</span>
                  <span class="today-stat-label">次整理</span>
                </div>
              </div>
              </div>

              <div class="active-bonuses">
                <h3>✨ 当前加成</h3>
                <div class="bonus-list">
                  <div class="bonus-item">
                  <span class="bonus-icon">📈</span>
                  <div class="bonus-info">
                    <div class="bonus-name">得分倍率</div>
                    <div class="bonus-value">x{info.bonus.scoreMultiplier.toFixed(2)}</div>
                  </div>
                  <div class="bonus-source">书店等级 Lv.{state().storeLevel}</div>
                </div>
                {info.activeArrangement && (
                  <div class="bonus-item active">
                    <span class="bonus-icon">{info.activeArrangement.icon}</span>
                    <div class="bonus-info">
                      <div class="bonus-name">{info.activeArrangement.name}</div>
                      <div class="bonus-value">+{info.activeArrangement.bonusValue}% {info.activeArrangement.bonusType === 'score' ? '得分' : info.activeArrangement.bonusType === 'time' ? '时间' : info.activeArrangement.bonusType === 'hints' ? '提示' : info.activeArrangement.bonusType === 'clue_speed' ? '线索速度' : '稀有概率'}</div>
                    </div>
                    <div class="bonus-source">书架整理</div>
                  </div>
                )}
                {info.activeCustomer && (
                  <div class="bonus-item active">
                    <span class="bonus-icon">{info.activeCustomer.avatar}</span>
                    <div class="bonus-info">
                      <div class="bonus-name">{info.activeCustomer.name}</div>
                      <div class="bonus-value">+{info.activeCustomer.satisfaction / 2}% 得分</div>
                    </div>
                    <div class="bonus-source">服务顾客</div>
                  </div>
                )}
              </div>
            </div>

            <div class="task-progress-section">
              <h3>📋 任务进度</h3>
              <div class="task-progress-row">
                <div class="task-progress-item">
                  <div class="task-progress-header">
                    <span>每日任务</span>
                    <span>{info.completedDaily}/{info.dailyTasks.length}</span>
                  </div>
                  <div class="task-progress-bar">
                    <div
                      class="task-progress-fill daily"
                      style={{ width: `${getProgressPercent(info.completedDaily, info.dailyTasks.length)}%` }}
                    />
                  </div>
                </div>
                <div class="task-progress-item">
                  <div class="task-progress-header">
                    <span>每周任务</span>
                    <span>{info.completedWeekly}/{info.weeklyTasks.length}</span>
                  </div>
                  <div class="task-progress-bar">
                    <div
                      class="task-progress-fill weekly"
                      style={{ width: `${getProgressPercent(info.completedWeekly, info.weeklyTasks.length)}%` }}
                    />
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {activeStoreTab() === 'customers' && (
            <div class="customers-tab">
              <div class="customers-header">
                <h3>👥 顾客管理</h3>
                <p class="customers-hint">选择一位顾客，为其服务，满足他们的偏好可获得额外奖励</p>
              </div>
              <div class="customers-list">
                {Object.values(state().customers).map((customer) => (
                  <div
                    class={`customer-card ${customer.unlocked ? '' : 'locked'} ${state().activeCustomerId === customer.id ? 'active' : ''}`}
                    onClick={() => customer.unlocked && handleSetActiveCustomer(state().activeCustomerId === customer.id ? null : customer.id)}
                  >
                    <div class="customer-avatar">{customer.avatar}</div>
                    <div class="customer-info">
                      <div class="customer-name">
                      {customer.name}
                      {!customer.unlocked && <span class="customer-lock">🔒</span>}
                    </div>
                    <div class="customer-desc">{customer.description}</div>
                    <div class="customer-preferences">
                      {customer.preferredGenres.map((genre) => (
                        <span class="preference-tag">{genre}</span>
                      ))}
                    </div>
                    <div class="customer-satisfaction">
                      <div class="satisfaction-bar">
                        <div
                          class="satisfaction-fill"
                          style={{ width: `${getProgressPercent(customer.satisfaction, customer.maxSatisfaction)}%` }}
                        />
                      </div>
                      <span class="satisfaction-text">
                        满意度 {customer.satisfaction}/{customer.maxSatisfaction}
                      </span>
                    </div>
                    <div class="customer-stats">
                      <span>来访 {customer.visits}次</span>
                      <span>消费 {customer.totalSpent}金币</span>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {activeStoreTab() === 'arrangement' && (
            <div class="arrangement-tab">
              <div class="arrangement-header">
                <h3>📚 书架整理</h3>
                <p class="arrangement-hint">整理书架可获得游戏加成，效果持续一段时间</p>
              </div>
              <div class="arrangement-list">
                {Object.values(state().arrangements).map((arrangement) => (
                  <div
                    class={`arrangement-card ${arrangement.unlocked ? '' : 'locked'} ${arrangement.active ? 'active' : ''}`}
                  >
                    <div class="arrangement-icon">{arrangement.icon}</div>
                    <div class="arrangement-info">
                      <div class="arrangement-name">
                        {arrangement.name}
                        {!arrangement.unlocked && <span class="arrangement-lock">🔒</span>}
                        {arrangement.active && <span class="arrangement-active">✅ 生效中</span>}
                      </div>
                      <div class="arrangement-desc">{arrangement.description}</div>
                      <div class="arrangement-bonus">
                        <span class="bonus-tag">
                          +{arrangement.bonusValue}% {arrangement.bonusType === 'score' ? '得分加成' : arrangement.bonusType === 'time' ? '额外时间' : arrangement.bonusType === 'hints' ? '额外提示' : arrangement.bonusType === 'clue_speed' ? '线索速度' : '稀有概率'}
                        </span>
                        <span class="duration-tag">⏱️ {arrangement.duration / 60}分钟</span>
                      </div>
                    </div>
                    <div class="arrangement-action">
                      <div class="arrangement-cost">
                        <span>💰</span>
                        <span>{arrangement.cost}</span>
                      </div>
                      <button
                        class="arrange-button"
                        disabled={!arrangement.unlocked || state().coins < arrangement.cost || arrangement.active}
                        onClick={() => handleArrangeShelf(arrangement.id)}
                      >
                        {arrangement.active ? '生效中' : arrangement.unlocked ? '整理' : '未解锁'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStoreTab() === 'tasks' && (
            <div class="tasks-tab">
              <div class="tasks-section">
                <h3>📅 每日任务</h3>
                <div class="tasks-list">
                  {info.dailyTasks.map((task) => (
                    <div class={`task-card ${task.completed ? 'completed' : ''} ${task.claimed ? 'claimed' : ''}`}>
                      <div class="task-icon">{task.icon}</div>
                      <div class="task-info">
                        <div class="task-name">{task.title}</div>
                        <div class="task-desc">{task.description}</div>
                        <div class="task-progress">
                          <div class="task-progress-bar-small">
                            <div
                              class="task-progress-fill-small"
                              style={{ width: `${getProgressPercent(task.progress, task.requirement.target)}%` }}
                            />
                          </div>
                          <span class="task-progress-text">
                            {task.progress}/{task.requirement.target}
                          </span>
                        </div>
                      </div>
                      <div class="task-rewards">
                        <div class="task-reward-items">
                          {task.rewards.coins && (
                            <span class="reward-item">💰 {task.rewards.coins}</span>
                          )}
                          {task.rewards.hints && (
                            <span class="reward-item">💡 {task.rewards.hints}</span>
                          )}
                          {task.rewards.scoreBonus && (
                            <span class="reward-item">📈 +{task.rewards.scoreBonus}</span>
                          )}
                        </div>
                        <button
                          class="claim-button"
                          disabled={!task.completed || task.claimed}
                          onClick={() => handleClaimReward(task.id)}
                        >
                          {task.claimed ? '已领取' : task.completed ? '领取' : '进行中'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div class="tasks-section">
                <h3>📆 每周任务</h3>
                <div class="tasks-list">
                  {info.weeklyTasks.map((task) => (
                    <div class={`task-card ${task.completed ? 'completed' : ''} ${task.claimed ? 'claimed' : ''}`}>
                      <div class="task-icon">{task.icon}</div>
                      <div class="task-info">
                        <div class="task-name">{task.title}</div>
                        <div class="task-desc">{task.description}</div>
                        <div class="task-progress">
                          <div class="task-progress-bar-small">
                            <div
                              class="task-progress-fill-small weekly"
                              style={{ width: `${getProgressPercent(task.progress, task.requirement.target)}%` }}
                            />
                          </div>
                          <span class="task-progress-text">
                            {task.progress}/{task.requirement.target}
                          </span>
                        </div>
                      </div>
                      <div class="task-rewards">
                        <div class="task-reward-items">
                          {task.rewards.coins && (
                            <span class="reward-item">💰 {task.rewards.coins}</span>
                          )}
                          {task.rewards.arrangementId && (
                            <span class="reward-item">📚 解锁整理</span>
                          )}
                          {task.rewards.customerId && (
                            <span class="reward-item">👤 解锁顾客</span>
                          )}
                        </div>
                        <button
                          class="claim-button"
                          disabled={!task.completed || task.claimed}
                          onClick={() => handleClaimReward(task.id)}
                        >
                          {task.claimed ? '已领取' : task.completed ? '领取' : '进行中'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div class="tasks-section">
                <h3>⭐ 特殊任务</h3>
                <div class="tasks-list">
                  {info.specialTasks.map((task) => (
                    <div class={`task-card ${task.unlocked ? '' : 'locked'} ${task.completed ? 'completed' : ''} ${task.claimed ? 'claimed' : ''}`}>
                      <div class="task-icon">{task.icon}</div>
                      <div class="task-info">
                        <div class="task-name">
                          {task.title}
                          {!task.unlocked && <span class="task-lock">🔒</span>}
                        </div>
                        <div class="task-desc">{task.description}</div>
                        <div class="task-progress">
                          <div class="task-progress-bar-small">
                            <div
                              class="task-progress-fill-small special"
                              style={{ width: `${getProgressPercent(task.progress, task.requirement.target)}%` }}
                            />
                          </div>
                          <span class="task-progress-text">
                            {task.progress}/{task.requirement.target}
                          </span>
                        </div>
                      </div>
                      <div class="task-rewards">
                        <div class="task-reward-items">
                          {task.rewards.coins && (
                            <span class="reward-item">💰 {task.rewards.coins}</span>
                          )}
                          {task.rewards.arrangementId && (
                            <span class="reward-item">📚 解锁整理</span>
                          )}
                          {task.rewards.customerId && (
                            <span class="reward-item">👤 解锁顾客</span>
                          )}
                        </div>
                        <button
                          class="claim-button"
                          disabled={!task.unlocked || !task.completed || task.claimed}
                          onClick={() => handleClaimReward(task.id)}
                        >
                          {task.claimed ? '已领取' : task.completed ? '领取' : task.unlocked ? '进行中' : '未解锁'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
