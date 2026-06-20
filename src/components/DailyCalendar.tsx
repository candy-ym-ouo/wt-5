import { createMemo, For } from 'solid-js';
import {
  calendarState,
  calendarStats,
  getCalendarInfo,
  getCalendarMonthData,
  getCalendarSelectedDay,
  getCalendarIntegration,
  selectCalendarDate,
  changeCalendarMonth,
  goToToday,
  claimTodayWorkdayReward,
  claimLimitedTaskRewardById,
  claimRefreshRewardById,
  claimFestivalRewardById,
  getMonthName,
  getWeekdayName,
  formatCalendarReward,
  activeTab,
  setActiveTab
} from '../store/calendarStore';
import type { CalendarDay, LimitedTask, WorkdayActivity, FestivalTheme, RewardRefresh } from '../types/calendar';
import { WORKDAY_ACTIVITIES, FESTIVAL_THEMES } from '../data/calendar';

interface DailyCalendarProps {
  onClose: () => void;
}

export default function DailyCalendar(props: DailyCalendarProps) {
  const info = createMemo(() => getCalendarInfo());
  const monthData = createMemo(() => getCalendarMonthData());
  const selectedDay = createMemo(() => getCalendarSelectedDay());
  const integration = createMemo(() => getCalendarIntegration());
  const stats = createMemo(() => calendarStats());
  const state = createMemo(() => calendarState());

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getDayClass = (day: CalendarDay): string => {
    const classes = ['calendar-day'];
    if (day.isToday) classes.push('today');
    if (day.dateKey === state().selectedDateKey) classes.push('selected');
    if (day.workday && day.progress.workdayCompleted) classes.push('workday-completed');
    if (day.festival && day.progress.festivalActive) classes.push('festival-active');
    if (day.limitedTasks.length > 0) classes.push('has-limited');
    if (day.refreshes.length > 0 && day.refreshes.some(r => !day.progress.refreshClaimed[r.id])) {
      classes.push('has-refresh');
    }
    if (day.dayOfWeek === 0 || day.dayOfWeek === 6) classes.push('weekend');
    return classes.join(' ');
  };

  const handleDayClick = (day: CalendarDay) => {
    selectCalendarDate(day.dateKey);
  };

  const formatDateLong = (dateKey: string): string => {
    const parts = dateKey.split('-');
    return `${parseInt(parts[0])}年${parseInt(parts[1])}月${parseInt(parts[2])}日 星期${getWeekdayName(new Date(dateKey).getDay())}`;
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div class="calendar-header">
          <div class="calendar-title">
            📆 每日经营日历
          </div>
          <div class="calendar-stats-bar">
            <div class="cal-stat">
              <span class="cal-stat-icon">🔥</span>
              <span class="cal-stat-value">{stats().currentStreak}</span>
              <span class="cal-stat-label">连续天数</span>
            </div>
            <div class="cal-stat">
              <span class="cal-stat-icon">🏆</span>
              <span class="cal-stat-value">{stats().longestStreak}</span>
              <span class="cal-stat-label">最长连续</span>
            </div>
            <div class="cal-stat highlight">
              <span class="cal-stat-icon">🎁</span>
              <span class="cal-stat-value">{info().unclaimedCount}</span>
              <span class="cal-stat-label">待领奖励</span>
            </div>
            {integration().leaderboardBonus.active && (
              <div class="cal-stat bonus">
                <span class="cal-stat-icon">⚡</span>
                <span class="cal-stat-value">x{integration().leaderboardBonus.multiplier.toFixed(2)}</span>
                <span class="cal-stat-label">排行榜加成</span>
              </div>
            )}
          </div>
        </div>

        <div class="calendar-tabs">
          <button
            class={`cal-tab ${activeTab() === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 日历
          </button>
          <button
            class={`cal-tab ${activeTab() === 'workday' ? 'active' : ''}`}
            onClick={() => setActiveTab('workday')}
          >
            📋 工作日
          </button>
          <button
            class={`cal-tab ${activeTab() === 'limited' ? 'active' : ''}`}
            onClick={() => setActiveTab('limited')}
          >
            ⏳ 限时任务
          </button>
          <button
            class={`cal-tab ${activeTab() === 'festival' ? 'active' : ''}`}
            onClick={() => setActiveTab('festival')}
          >
            🎉 节日主题
          </button>
          <button
            class={`cal-tab ${activeTab() === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            🎁 奖励刷新
          </button>
        </div>

        {activeTab() === 'calendar' && (
          <div class="calendar-main">
            <div class="calendar-month-nav">
              <button class="month-nav-btn" onClick={() => changeCalendarMonth(-1)}>◀</button>
              <div class="month-title">
                {state().currentYear}年 {getMonthName(state().currentMonth)}
              </div>
              <button class="month-nav-btn" onClick={() => changeCalendarMonth(1)}>▶</button>
              <button class="today-btn" onClick={goToToday}>今天</button>
            </div>

            <div class="calendar-weekdays">
              <For each={weekDays}>
                {(wd, i) => (
                  <div class={`weekday-header ${i() === 0 || i() === 6 ? 'weekend' : ''}`}>
                    {wd}
                  </div>
                )}
              </For>
            </div>

            <div class="calendar-grid">
              <For each={monthData()}>
                {(day) => (
                  <div
                    class={getDayClass(day)}
                    onClick={() => handleDayClick(day)}
                  >
                    <div class="day-number">{day.date.getDate()}</div>
                    <div class="day-indicators">
                      {day.workday && <span class="day-indicator workday-indicator">{day.workday.icon}</span>}
                      {day.festival && day.progress.festivalActive && (
                        <span class="day-indicator festival-indicator">{day.festival.icon}</span>
                      )}
                      {day.limitedTasks.length > 0 && (
                        <span class="day-indicator limited-indicator">⏳</span>
                      )}
                      {day.refreshes.length > 0 && day.refreshes.some(r => !day.progress.refreshClaimed[r.id]) && (
                        <span class="day-indicator refresh-indicator">🎁</span>
                      )}
                      {day.progress.workdayCompleted && (
                        <span class="day-indicator completed-indicator">✓</span>
                      )}
                    </div>
                  </div>
                )}
              </For>
            </div>

            {selectedDay() && (() => {
              const day = selectedDay()!;
              return (
                <div class="selected-day-detail">
                  <div class="selected-day-header">
                    <span class="selected-day-date">{formatDateLong(day.dateKey)}</span>
                    {day.isToday && <span class="today-badge">今天</span>}
                  </div>

                  <div class="day-events-list">
                    {day.workday && (
                      <WorkdayCard
                        workday={day.workday}
                        isToday={day.isToday}
                        completed={day.progress.workdayCompleted}
                        progress={day.progress.workdayProgress}
                        claimed={day.progress.workdayCompleted && !!state().calendarProgress.workdayCompletion[day.dateKey]?.claimed}
                        onClaim={() => claimTodayWorkdayReward()}
                      />
                    )}

                    <For each={day.limitedTasks}>
                      {(task) => {
                        const taskProgress = state().calendarProgress.limitedTaskProgress[task.id];
                        return (
                          <LimitedTaskCard
                            task={task}
                            status={day.progress.limitedTaskStatus[task.id] || 'upcoming'}
                            progress={taskProgress?.current || 0}
                            completed={taskProgress?.completed || false}
                            claimed={taskProgress?.claimed || false}
                            onClaim={() => claimLimitedTaskRewardById(task.id)}
                          />
                        );
                      }}
                    </For>

                    {day.festival && day.progress.festivalActive && (
                      <FestivalCard
                        festival={day.festival}
                        progress={state().calendarProgress.festivalProgress[day.festival.id]}
                        onClaim={() => claimFestivalRewardById(day.festival!.id)}
                      />
                    )}

                    <For each={day.refreshes}>
                      {(refresh) => (
                        <RefreshCard
                          refresh={refresh}
                          claimed={day.progress.refreshClaimed[refresh.id]}
                          onClaim={() => claimRefreshRewardById(refresh.id)}
                        />
                      )}
                    </For>

                    {!day.workday && day.limitedTasks.length === 0 && !day.festival && day.refreshes.length === 0 && (
                      <div class="no-events">
                        <div class="no-events-icon">📭</div>
                        <div class="no-events-text">今日暂无活动安排</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab() === 'workday' && (
          <div class="tab-content">
            <div class="tab-section-title">📋 工作日活动</div>
            <div class="workdays-grid">
              <For each={['日', '一', '二', '三', '四', '五', '六']}>
                {(wd, i) => {
                  const actualWorkday = WORKDAY_ACTIVITIES.find(w => w.dayOfWeek === i());
                  const todayIsDay = new Date().getDay() === i();
                  const todayProgress = todayIsDay ? info().workdayProgress : null;
                  const claimed = todayIsDay && todayProgress?.claimed;

                  return (
                    <div class={`workday-grid-item ${todayIsDay ? 'today' : ''}`}>
                      <div class="workday-grid-day">周{wd}</div>
                      {actualWorkday && (
                        <>
                          <div class="workday-grid-icon">{actualWorkday.icon}</div>
                          <div class="workday-grid-title">{actualWorkday.title}</div>
                          <div class="workday-grid-desc">{actualWorkday.description}</div>
                          {actualWorkday.scoreMultiplier && (
                            <div class="workday-grid-bonus">⚡ x{actualWorkday.scoreMultiplier}</div>
                          )}
                          <div class="workday-grid-requirement">
                            目标: {actualWorkday.requiredBooks}本书
                          </div>
                          {todayIsDay && todayProgress && (
                            <div class="workday-grid-progress">
                              <div class="progress-bar">
                                <div
                                  class="progress-fill"
                                  style={{ width: `${Math.min(100, (todayProgress.booksFound / (actualWorkday.requiredBooks || 3)) * 100)}%` }}
                                />
                              </div>
                              <div class="progress-text">
                                {todayProgress.booksFound}/{actualWorkday.requiredBooks || 3}
                              </div>
                            </div>
                          )}
                          {todayIsDay && todayProgress?.completed && !claimed && (
                            <button
                              class="claim-btn small"
                              onClick={() => claimTodayWorkdayReward()}
                            >
                              领取奖励
                            </button>
                          )}
                          {claimed && <div class="claimed-badge">✓ 已领取</div>}
                        </>
                      )}
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}

        {activeTab() === 'limited' && (
          <div class="tab-content">
            <div class="tab-section-title">⏳ 进行中的限时任务</div>
            <div class="limited-tasks-list">
              <For each={info().limitedTasks}>
                {(task) => (
                  <LimitedTaskCard
                    task={task}
                    status={task.progress > 0 ? 'active' : 'upcoming'}
                    progress={task.progress}
                    completed={task.completed}
                    claimed={task.claimed}
                    onClaim={() => claimLimitedTaskRewardById(task.id)}
                  />
                )}
              </For>
              {info().limitedTasks.length === 0 && (
                <div class="no-events">
                  <div class="no-events-icon">⏳</div>
                  <div class="no-events-text">暂无进行中的限时任务</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab() === 'festival' && (
          <div class="tab-content">
            <div class="tab-section-title">🎉 节日主题活动</div>
            {info().festival ? (
              <FestivalCard
                festival={info().festival!}
                progress={state().calendarProgress.festivalProgress[info().festival!.id]}
                onClaim={() => claimFestivalRewardById(info().festival!.id)}
              />
            ) : (
              <div class="no-events">
                <div class="no-events-icon">🎊</div>
                <div class="no-events-text">当前暂无节日活动</div>
                <div class="no-events-hint">节日活动会在特殊日期开启，敬请期待！</div>
              </div>
            )}

            <div class="tab-section-title mt-lg">📅 即将到来的节日</div>
            <div class="upcoming-festivals">
              <For each={FESTIVAL_THEMES.filter(f => f.startDate > info().todayKey)}>
                {(festival) => (
                  <div class="upcoming-festival-item">
                    <span class="upcoming-festival-icon">{festival.icon}</span>
                    <span class="upcoming-festival-name">{festival.title}</span>
                    <span class="upcoming-festival-date">
                      {festival.startDate} ~ {festival.endDate}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}

        {activeTab() === 'rewards' && (
          <div class="tab-content">
            <div class="tab-section-title">🎁 今日可领取奖励</div>
            <div class="refreshes-list">
              <For each={info().refreshes}>
                {(refresh) => {
                  const claimed = state().calendarProgress.claimedRewards.includes(`${info().todayKey}_${refresh.id}`);
                  return (
                    <RefreshCard
                      refresh={refresh}
                      claimed={claimed}
                      onClaim={() => claimRefreshRewardById(refresh.id)}
                    />
                  );
                }}
              </For>
            </div>

            {integration().challengeBonus.active && (
              <div class="integration-bonus-card">
                <div class="bonus-card-title">
                  🔗 挑战模式加成
                </div>
                <div class="bonus-card-stats">
                  <div class="bonus-stat">
                    <span class="bonus-stat-label">分数倍率</span>
                    <span class="bonus-stat-value">x{integration().challengeBonus.scoreMultiplier.toFixed(2)}</span>
                  </div>
                  <div class="bonus-stat">
                    <span class="bonus-stat-label">金币倍率</span>
                    <span class="bonus-stat-value">x{integration().challengeBonus.coinMultiplier.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {integration().leaderboardBonus.active && (
              <div class="integration-bonus-card">
                <div class="bonus-card-title">
                  🏆 排行榜加成
                </div>
                <div class="bonus-card-stats">
                  <div class="bonus-stat">
                    <span class="bonus-stat-label">当前倍率</span>
                    <span class="bonus-stat-value highlight">x{integration().leaderboardBonus.multiplier.toFixed(2)}</span>
                  </div>
                </div>
                <div class="bonus-card-source">
                  来源: {integration().leaderboardBonus.sourceType === 'festival' ? '节日活动' : '工作日活动'}
                </div>
              </div>
            )}

            {integration().achievementBonus.active && (
              <div class="integration-bonus-card">
                <div class="bonus-card-title">
                  🎖️ 成就加成
                </div>
                <div class="bonus-card-desc">
                  节日活动期间，成就进度获得额外加成！
                </div>
              </div>
            )}
          </div>
        )}

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}

function WorkdayCard(props: {
  workday: WorkdayActivity;
  isToday: boolean;
  completed: boolean;
  progress: number;
  claimed: boolean;
  onClaim: () => void;
}) {
  const progressPercent = createMemo(() => {
    const required = props.workday.requiredBooks || 3;
    return Math.min(100, (props.progress / required) * 100);
  });

  return (
    <div class={`event-card workday-card ${props.completed ? 'completed' : ''} ${props.isToday ? 'today' : ''}`}>
      <div class="event-card-header">
        <span class="event-icon workday-icon">{props.workday.icon}</span>
        <span class="event-title">{props.workday.title}</span>
        <span class="event-type-badge workday-badge">工作日</span>
      </div>
      <div class="event-card-desc">{props.workday.description}</div>

      <div class="event-bonuses">
        {props.workday.scoreMultiplier && (
          <span class="bonus-tag">⚡ 分数 x{props.workday.scoreMultiplier}</span>
        )}
        {props.workday.bonusCoinsPerBook && (
          <span class="bonus-tag">🪙 +{props.workday.bonusCoinsPerBook}/本</span>
        )}
        {props.workday.rarityBoost && (
          <span class="bonus-tag">💎 稀有提升</span>
        )}
        {props.workday.difficultyBonus && (
          <span class="bonus-tag">🔥 难度加成</span>
        )}
      </div>

      <div class="event-progress">
        <div class="progress-header">
          <span>完成进度</span>
          <span>{props.progress}/{props.workday.requiredBooks || 3} 本书</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill workday-fill" style={{ width: `${progressPercent()}%` }} />
        </div>
      </div>

      <div class="event-rewards">
        <span class="rewards-label">奖励:</span>
        <For each={props.workday.rewards}>
          {(reward) => (
            <span class="reward-tag">{formatCalendarReward(reward)}</span>
          )}
        </For>
      </div>

      {props.isToday && props.completed && !props.claimed && (
        <button class="claim-btn" onClick={props.onClaim}>🎁 领取奖励</button>
      )}
      {props.claimed && <div class="claimed-badge">✓ 奖励已领取</div>}
    </div>
  );
}

function LimitedTaskCard(props: {
  task: LimitedTask;
  status: 'upcoming' | 'active' | 'completed' | 'expired';
  progress: number;
  completed: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const progressPercent = createMemo(() => {
    return Math.min(100, (props.progress / props.task.target) * 100);
  });

  const getStatusText = (): string => {
    switch (props.status) {
      case 'upcoming': return '即将开始';
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'expired': return '已过期';
    }
  };

  const getStatusClass = (): string => {
    switch (props.status) {
      case 'upcoming': return 'status-upcoming';
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'expired': return 'status-expired';
    }
  };

  const getTaskTypeText = (): string => {
    switch (props.task.taskType) {
      case 'find_books': return '找书';
      case 'find_genre': return `找${props.task.genre}类`;
      case 'find_rarity': return `找${props.task.rarity}书`;
      case 'consecutive_days': return '连续天数';
      case 'score_threshold': return '单局分数';
      case 'daily_challenge': return '每日挑战';
      case 'leaderboard_rank': return `${props.task.leaderboardType}榜前${props.task.minRank}`;
      default: return '任务';
    }
  };

  return (
    <div class={`event-card limited-card ${getStatusClass()}`}>
      <div class="event-card-header">
        <span class="event-icon limited-icon">{props.task.icon}</span>
        <span class="event-title">{props.task.title}</span>
        <span class={`event-status-badge ${getStatusClass()}`}>{getStatusText()}</span>
      </div>
      <div class="event-card-desc">{props.task.description}</div>

      <div class="event-meta">
        <span class="meta-item">📅 {props.task.startDate} ~ {props.task.endDate}</span>
        <span class="meta-item">🎯 类型: {getTaskTypeText()}</span>
        {props.task.linkedAchievementId && (
          <span class="meta-item">🏆 关联成就</span>
        )}
        {props.task.linkedChallengeId && (
          <span class="meta-item">⚔️ 关联挑战</span>
        )}
      </div>

      <div class="event-progress">
        <div class="progress-header">
          <span>完成进度</span>
          <span>{props.progress}/{props.task.target}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill limited-fill" style={{ width: `${progressPercent()}%` }} />
        </div>
      </div>

      <div class="event-rewards">
        <span class="rewards-label">奖励:</span>
        <For each={props.task.rewards}>
          {(reward) => (
            <span class="reward-tag">{formatCalendarReward(reward)}</span>
          )}
        </For>
      </div>

      {props.completed && !props.claimed && props.status !== 'expired' && (
        <button class="claim-btn" onClick={props.onClaim}>🎁 领取奖励</button>
      )}
      {props.claimed && <div class="claimed-badge">✓ 奖励已领取</div>}
    </div>
  );
}

function FestivalCard(props: {
  festival: FestivalTheme;
  progress?: {
    participationDays: string[];
    booksFound: number;
    totalScore: number;
    rewardsClaimed: boolean;
  };
  onClaim: () => void;
}) {
  const canClaim = createMemo(() => {
    return props.progress && props.progress.participationDays.length >= 1 && !props.progress.rewardsClaimed;
  });

  return (
    <div class="event-card festival-card">
      <div class="event-card-header">
        <span class="event-icon festival-icon">{props.festival.icon}</span>
        <span class="event-title">{props.festival.title}</span>
        <span class="event-type-badge festival-badge">节日主题</span>
      </div>
      <div class="event-card-desc">{props.festival.description}</div>

      <div class="event-meta">
        <span class="meta-item">📅 {props.festival.startDate} ~ {props.festival.endDate}</span>
      </div>

      <div class="festival-bonuses">
        <div class="festival-bonus-item">
          <span class="fb-label">分数倍率</span>
          <span class="fb-value highlight">x{props.festival.scoreMultiplier}</span>
        </div>
        <div class="festival-bonus-item">
          <span class="fb-label">金币倍率</span>
          <span class="fb-value highlight">x{props.festival.coinMultiplier}</span>
        </div>
        {props.festival.bookDecorations && (
          <div class="festival-bonus-item">
            <span class="fb-label">装饰</span>
            <span class="fb-value">{props.festival.bookDecorations.join(' ')}</span>
          </div>
        )}
      </div>

      {props.progress && (
        <div class="festival-progress">
          <div class="fp-item">
            <span class="fp-label">参与天数</span>
            <span class="fp-value">{props.progress.participationDays.length} 天</span>
          </div>
          <div class="fp-item">
            <span class="fp-label">节日找书</span>
            <span class="fp-value">{props.progress.booksFound} 本</span>
          </div>
          <div class="fp-item">
            <span class="fp-label">累计分数</span>
            <span class="fp-value">{props.progress.totalScore} 分</span>
          </div>
        </div>
      )}

      <div class="event-rewards">
        <span class="rewards-label">节日奖励:</span>
        <For each={props.festival.festivalRewards}>
          {(reward) => (
            <span class="reward-tag festival-reward">{formatCalendarReward(reward)}</span>
          )}
        </For>
      </div>

      {props.festival.exclusiveAchievements && props.festival.exclusiveAchievements.length > 0 && (
        <div class="exclusive-items">
          <span class="exclusive-label">🏆 专属成就:</span>
          <span class="exclusive-count">{props.festival.exclusiveAchievements.length} 个</span>
        </div>
      )}

      {canClaim() && (
        <button class="claim-btn festival-claim" onClick={props.onClaim}>🎁 领取节日奖励</button>
      )}
      {props.progress?.rewardsClaimed && <div class="claimed-badge">✓ 节日奖励已领取</div>}
    </div>
  );
}

function RefreshCard(props: {
  refresh: RewardRefresh;
  claimed: boolean;
  onClaim: () => void;
}) {
  const getRefreshTypeText = (): string => {
    switch (props.refresh.refreshType) {
      case 'daily': return '每日';
      case 'weekly': return '每周';
      case 'monthly': return '每月';
      case 'festival': return '节日';
    }
  };

  return (
    <div class={`event-card refresh-card ${props.claimed ? 'claimed' : ''}`}>
      <div class="event-card-header">
        <span class="event-icon refresh-icon">{props.refresh.icon}</span>
        <span class="event-title">{props.refresh.title}</span>
        <span class="event-type-badge refresh-badge">{getRefreshTypeText()}刷新</span>
      </div>
      <div class="event-card-desc">{props.refresh.description}</div>

      <div class="event-rewards">
        <span class="rewards-label">奖励:</span>
        <For each={props.refresh.rewards}>
          {(reward) => (
            <span class="reward-tag refresh-reward">{formatCalendarReward(reward)}</span>
          )}
        </For>
      </div>

      {!props.claimed && (
        <button class="claim-btn refresh-claim" onClick={props.onClaim}>🎁 立即领取</button>
      )}
      {props.claimed && <div class="claimed-badge">✓ 今日已领取</div>}
    </div>
  );
}
