import { createSignal, createMemo } from 'solid-js';
import Bookshelf from './components/Bookshelf';
import ClueCards from './components/ClueCards';
import HintSystem from './components/HintSystem';
import AchievementList from './components/AchievementList';
import Timer from './components/Timer';
import GameModal from './components/GameModal';
import Leaderboard from './components/Leaderboard';
import BookCollection from './components/BookCollection';
import ChapterProgress from './components/ChapterProgress';
import StreakDisplay from './components/StreakDisplay';
import TutorialGuide from './components/TutorialGuide';
import CustomerCommissionPanel from './components/CustomerCommission';
import CodexCenter from './components/CodexCenter';
import DailyCalendar from './components/DailyCalendar';
import DecorationManager from './components/DecorationManager';
import { gameState, showAchievementPopup, showThemeRewardPopup, getCurrentChapter, chapterTasks, getDifficultyInfo, dismissDifficultyChange, getCurrentThemeInfo, targetBook, getStreakInfo, pauseGame, getDailyChallengeInfo, isDailyChallengeMode, getRushInfo, isRushMode, collectionCount, isCommissionMode, getCommissionInfo } from './store/gameStore';
import { showStoreManager, showRewardPopup, showTaskCompletePopup, openStoreManager, closeStoreManager, getCoins, getStoreLevel } from './store/storeManager';
import { showDecorationManager, openDecorationManager, closeDecorationManager, showDecorationNotification } from './store/decorationStore';
import { getCodexStateInfo, openCodex, closeCodex } from './store/codexStore';
import { getCalendarInfo, openCalendar, closeCalendar, getCalendarIntegration } from './store/calendarStore';
import StoreManager from './components/StoreManager';
import { getDifficultyConfig } from './data/difficulty';
import { RARITY_CONFIG } from './data/themes';

export default function App() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const [showCollection, setShowCollection] = createSignal(false);
  const state = createMemo(() => gameState());
  const diffInfo = createMemo(() => getDifficultyInfo());
  const isPlaying = createMemo(() => state().state === 'playing');
  const currentScore = createMemo(() => state().score);
  const currentLevel = createMemo(() => state().currentLevel);
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');
  const isThemeMode = createMemo(() => state().currentThemeId !== null);
  const isClassicMode = createMemo(() => !isChapterMode() && !isThemeMode());
  const currentChapter = createMemo(() => getCurrentChapter());
  const currentTheme = createMemo(() => getCurrentThemeInfo());
  const currentBook = createMemo(() => targetBook());
  const tasks = createMemo(() => chapterTasks());
  const diffConfig = createMemo(() => getDifficultyConfig(state().difficultyLevel));
  const showDiffChange = createMemo(() => state().showDifficultyChange && state().state === 'playing');
  const isDynamicMode = createMemo(() => state().difficultyMode === 'dynamic');
  const streakInfo = createMemo(() => getStreakInfo());
  const hasActiveStreak = createMemo(() => streakInfo().currentStreak > 0 && isPlaying());
  const dailyInfo = createMemo(() => getDailyChallengeInfo());
  const isDailyMode = createMemo(() => isDailyChallengeMode());
  const rushInfo = createMemo(() => getRushInfo());
  const isRushGameMode = createMemo(() => isRushMode());
  const isCommMode = createMemo(() => isCommissionMode());
  const commInfo = createMemo(() => getCommissionInfo());
  const coins = createMemo(() => getCoins());
  const storeLevel = createMemo(() => getStoreLevel());
  const codexInfo = createMemo(() => getCodexStateInfo());
  const calendarInfo = createMemo(() => getCalendarInfo());
  const calendarIntegration = createMemo(() => getCalendarIntegration());
  const [showCalendar, setShowCalendar] = createSignal(false);

  return (
    <div class="game-container">
      <header class="game-header">
        <div class="game-title">
          📚 旧书店寻物
          {isChapterMode() && currentChapter() && (
            <span class="chapter-badge">
              {currentChapter()?.icon} {currentChapter()?.title}
            </span>
          )}
          {isThemeMode() && currentTheme() && (
            <span class="theme-header-badge">
              {currentTheme()?.theme.icon} {currentTheme()?.theme.title}
            </span>
          )}
          {isDailyMode() && (
            <span class="daily-header-badge">
              📆 每日挑战
            </span>
          )}
          {isRushGameMode() && (
            <span class="rush-header-badge">
              ⚡ 闯关模式 {rushInfo()!.currentStageIndex + 1}/{rushInfo()!.total}
            </span>
          )}
          {isCommMode() && commInfo().activeCommission && (
            <span class="commission-header-badge">
              🧑‍💼 顾客委托 - {commInfo().activeCommission!.customer.avatar} {commInfo().activeCommission!.customer.name}
            </span>
          )}
          {calendarInfo().festival && (
            <span class="festival-header-badge">
              {calendarInfo().festival?.icon} {calendarInfo().festival?.title}
            </span>
          )}
          {calendarIntegration().leaderboardBonus.active && (
            <span class="calendar-bonus-badge">
              ⚡ x{calendarIntegration().leaderboardBonus.multiplier.toFixed(2)}
            </span>
          )}
          {!isChapterMode() && !isThemeMode() && !isCommMode() && isPlaying() && (
            <span class="difficulty-header-badge">
              {diffConfig().icon} {diffConfig().name}
              {isDynamicMode() && <span class="dynamic-indicator">🔄</span>}
            </span>
          )}
        </div>
        <div class="header-stats">
          <Timer />
          <div class="stat-item">
            <div class="stat-label">🎯 得分</div>
            <div class="stat-value">{currentScore()}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{isChapterMode() ? '📖 任务' : isThemeMode() ? '🎯 目标' : isRushGameMode() ? '⚡ 阶段' : '📖 关卡'}</div>
            <div class="stat-value">
              {isChapterMode() && tasks().length > 0
                ? `${currentLevel()}/${tasks().length}`
                : isThemeMode() && currentTheme()
                ? `${currentTheme()?.progress}/${currentTheme()?.required}`
                : isRushGameMode() && rushInfo()
                ? `${rushInfo()!.currentStageIndex + 1}/${rushInfo()!.total}`
                : currentLevel()}
            </div>
          </div>
          {!isChapterMode() && isPlaying() && (
            <div class="stat-item difficulty-stat">
              <div class="stat-label">⚡ 倍率</div>
              <div class="stat-value">x{diffConfig().scoreMultiplier}</div>
            </div>
          )}
          {hasActiveStreak() && isClassicMode() && (
            <StreakDisplay compact />
          )}
          {currentBook() && isPlaying() && !isCommMode() && (
            <div class="stat-item rarity-stat">
              <div class="stat-label">📚 稀有度</div>
              <div class="stat-value" style={{ color: RARITY_CONFIG[currentBook()!.rarity].color }}>
                {RARITY_CONFIG[currentBook()!.rarity].icon} {RARITY_CONFIG[currentBook()!.rarity].name}
              </div>
            </div>
          )}
          {isPlaying() && (
            <button 
              class="stat-item pause-button"
              onClick={pauseGame}
              title="暂停游戏"
            >
              <div class="stat-label">⏸️ 暂停</div>
              <div class="stat-value small-stat-value">暂停</div>
            </button>
          )}
          <button 
            class="stat-item collection-button"
            onClick={() => setShowCollection(true)}
            title="查看收藏册"
          >
            <div class="stat-label">📖 收藏</div>
            <div class="stat-value small-stat-value">{collectionCount()}</div>
          </button>
          <button 
            class="stat-item rank-button"
            onClick={() => setShowLeaderboard(true)}
            title="查看排行榜和成就"
          >
            <div class="stat-label">🏆 排行</div>
            <div class="stat-value small-stat-value">查看</div>
          </button>
          <div class="stat-item coins-stat">
            <div class="stat-label">🪙 金币</div>
            <div class="stat-value">{coins()}</div>
          </div>
          <div class="stat-item store-level-stat">
            <div class="stat-label">🏪 店铺</div>
            <div class="stat-value">Lv.{storeLevel()}</div>
          </div>
          <button 
            class="stat-item decoration-button"
            onClick={openDecorationManager}
            title="书店装修"
          >
            <div class="stat-label">🎨 装修</div>
            <div class="stat-value small-stat-value">布置</div>
          </button>
          <button 
            class="stat-item store-manager-button"
            onClick={openStoreManager}
            title="店长经营"
          >
            <div class="stat-label">👔 店长</div>
            <div class="stat-value small-stat-value">经营</div>
          </button>
          <button 
            class="stat-item codex-button"
            onClick={() => openCodex()}
            title="图鉴中心"
          >
            <div class="stat-label">📖 图鉴</div>
            <div class="stat-value small-stat-value">{codexInfo().stats.collectedBooks}/{codexInfo().stats.totalBooks}</div>
          </button>
          <button 
            class="stat-item calendar-button"
            onClick={() => {
              openCalendar();
              setShowCalendar(true);
            }}
            title="每日经营日历"
          >
            <div class="stat-label">📆 日历</div>
            <div class="stat-value small-stat-value">
              {calendarInfo().unclaimedCount > 0 ? `🎁${calendarInfo().unclaimedCount}` : '查看'}
            </div>
          </button>
        </div>
      </header>

      <main class="game-main">
        <Bookshelf />
        
        <aside class="sidebar">
          <ChapterProgress />

          {isClassicMode() && hasActiveStreak() && (
            <div class="sidebar-section streak-sidebar-section">
              <div class="section-title">
                <span>🔥</span>
                <span>连胜状态</span>
              </div>
              <StreakDisplay />
            </div>
          )}

          {isThemeMode() && currentTheme() && (
            <div class="sidebar-section theme-section">
              <div class="section-title">
                <span>{currentTheme()?.theme.icon}</span>
                <span>主题挑战进度</span>
              </div>
              <div class="theme-progress-card">
                <div class="theme-card-title">{currentTheme()?.theme.title}</div>
                <div class="theme-progress-bar">
                  <div 
                    class="theme-progress-fill"
                    style={{ width: `${currentTheme()?.percent}%` }}
                  />
                </div>
                <div class="theme-progress-info">
                  <span class="theme-progress-text">
                    {currentTheme()?.progress} / {currentTheme()?.required} 本书籍
                  </span>
                  <span class="theme-progress-score">
                    得分: {currentTheme()?.score}
                  </span>
                </div>
                {currentBook() && (
                  <div class="theme-book-rarity">
                    <span class="rarity-label">目标稀有度:</span>
                    <span 
                      class="rarity-value"
                      style={{ color: RARITY_CONFIG[currentBook()!.rarity].color }}
                    >
                      {RARITY_CONFIG[currentBook()!.rarity].icon} {RARITY_CONFIG[currentBook()!.rarity].name}
                      (x{RARITY_CONFIG[currentBook()!.rarity].scoreMultiplier})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isDailyMode() && dailyInfo() && (
            <div class="sidebar-section daily-section">
              <div class="section-title">
                <span>📆</span>
                <span>每日挑战进度</span>
              </div>
              <div class="daily-progress-card">
                <div class="daily-card-title">今日挑战</div>
                <div class="daily-progress-bar">
                  <div 
                    class="daily-progress-fill"
                    style={{ width: `${dailyInfo()?.percent}%` }}
                  />
                </div>
                <div class="daily-progress-info">
                  <span class="daily-progress-text">
                    {dailyInfo()?.progress} / {dailyInfo()?.total} 本书籍
                  </span>
                  <span class="daily-progress-score">
                    得分: {state().score}
                  </span>
                </div>
                {currentBook() && (
                  <div class="daily-book-rarity">
                    <span class="rarity-label">目标稀有度:</span>
                    <span 
                      class="rarity-value"
                      style={{ color: RARITY_CONFIG[currentBook()!.rarity].color }}
                    >
                      {RARITY_CONFIG[currentBook()!.rarity].icon} {RARITY_CONFIG[currentBook()!.rarity].name}
                      (x{RARITY_CONFIG[currentBook()!.rarity].scoreMultiplier})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isRushGameMode() && rushInfo() && (
            <div class="sidebar-section rush-section">
              <div class="section-title">
                <span>⚡</span>
                <span>闯关模式进度</span>
              </div>
              <div class="rush-progress-card">
                <div class="rush-card-title">三关挑战</div>
                <div class="rush-stages-list">
                  {rushInfo()?.stages.map((stage, index) => (
                    <div class={`rush-stage-item rush-${stage.status}`}>
                      <span class="rush-stage-num">{index + 1}</span>
                      <span class="rush-stage-status">
                        {stage.status === 'completed' ? '✅' : stage.status === 'current' ? '🎯' : '⏳'}
                      </span>
                      <span class="rush-stage-info">
                        {stage.status === 'completed' ? (
                          <>
                            <span class="rush-stage-score">+{stage.stageBonus}</span>
                            <span class="rush-stage-time">⏱️{stage.timeBonus}s</span>
                          </>
                        ) : stage.status === 'current' ? (
                          <span class="rush-stage-current">进行中</span>
                        ) : (
                          <span class="rush-stage-pending">待挑战</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div class="rush-progress-bar">
                  <div 
                    class="rush-progress-fill"
                    style={{ width: `${rushInfo()?.percent}%` }}
                  />
                </div>
                <div class="rush-progress-info">
                  <span class="rush-progress-text">
                    阶段奖励: +{rushInfo()?.totalStageBonus}
                  </span>
                  <span class="rush-progress-time">
                    时间奖励: +{rushInfo()?.totalTimeBonus}s
                  </span>
                </div>
                <div class="rush-stats-row">
                  <span class="rush-stat">💡 无提示: {rushInfo()?.noHintStages}/3</span>
                  <span class="rush-stat">🎯 无失误: {rushInfo()?.noWrongStages}/3</span>
                </div>
                {rushInfo()?.perfectRun && (
                  <div class="rush-perfect-badge">
                    ⭐ 完美通关！
                  </div>
                )}
              </div>
            </div>
          )}

          {isCommMode() && (
            <CustomerCommissionPanel />
          )}

          {!isCommMode() && (
            <div class="sidebar-section">
              <div class="section-title">
                <span>🔍</span>
                <span>当前任务</span>
              </div>
              <div class="current-task-card">
                {isPlaying() ? (
                  <>
                    <div class="task-title">找到神秘藏书</div>
                    <div class="task-desc">根据右侧线索，在书架上找到目标书籍</div>
                  </>
                ) : (
                  <div class="task-idle">开始游戏接受挑战</div>
                )}
              </div>
            </div>
          )}

          {isPlaying() && !isCommMode() && (
            <>
              <ClueCards />
              <HintSystem />
            </>
          )}

          <AchievementList />
        </aside>
      </main>

      <GameModal />

      {showAchievementPopup() && state().state !== 'paused' && (
        <div class="achievement-popup">
          <div class="achievement-popup-title">🏆 成就解锁</div>
          <div class="achievement-popup-name">{showAchievementPopup()}</div>
        </div>
      )}

      {showThemeRewardPopup() && state().state !== 'paused' && (
        <div class="theme-reward-popup">
          <div class="theme-reward-popup-title">🎁 主题奖励解锁</div>
          <div class="theme-reward-popup-name">{showThemeRewardPopup()}</div>
        </div>
      )}

      {showDiffChange() && (
        <div class="difficulty-change-popup" onClick={dismissDifficultyChange}>
          <div class="difficulty-change-icon">
            {diffConfig().icon}
          </div>
          <div class="difficulty-change-title">
            难度调整：{diffConfig().name}
          </div>
          <div class="difficulty-change-reason">
            {diffInfo().adjustmentReason}
          </div>
          <div class="difficulty-change-stats">
            <span>⏱️ +{state().lastTimeBonus}秒奖励</span>
            <span>💡 {diffConfig().initialHints}次提示</span>
            <span>⚡ x{diffConfig().scoreMultiplier}倍率</span>
          </div>
        </div>
      )}

      {showLeaderboard() && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {showCollection() && (
        <BookCollection onClose={() => setShowCollection(false)} />
      )}

      {showStoreManager() && (
        <StoreManager onClose={closeStoreManager} />
      )}

      {showDecorationManager() && (
        <DecorationManager onClose={closeDecorationManager} />
      )}

      {showDecorationNotification() && state().state !== 'paused' && (
        <div class="decoration-notification-popup">
          <div class="decoration-notification-icon">🎨</div>
          <div class="decoration-notification-text">{showDecorationNotification()}</div>
        </div>
      )}

      {showRewardPopup() && state().state !== 'paused' && (
        <div class="store-reward-popup">
          <div class="store-reward-popup-title">🎁 获得奖励</div>
          <div class="store-reward-popup-content">
            {showRewardPopup()!.coins > 0 && (
              <div class="reward-item">
                <span class="reward-icon">🪙</span>
                <span class="reward-text">+{showRewardPopup()!.coins} 金币</span>
              </div>
            )}
            {showRewardPopup()!.reputation > 0 && (
              <div class="reward-item">
                <span class="reward-icon">⭐</span>
                <span class="reward-text">+{showRewardPopup()!.reputation} 声望</span>
              </div>
            )}
            <div class="reward-description">{showRewardPopup()!.description}</div>
          </div>
        </div>
      )}

      {showTaskCompletePopup() && state().state !== 'paused' && (
        <div class="task-complete-popup">
          <div class="task-complete-popup-title">✅ 任务完成</div>
          <div class="task-complete-popup-name">{showTaskCompletePopup()}</div>
        </div>
      )}

      <TutorialGuide onClose={() => {}} />

      {codexInfo().isVisible && (
        <CodexCenter onClose={closeCodex} />
      )}

      {showCalendar() && (
        <DailyCalendar onClose={() => {
          closeCalendar();
          setShowCalendar(false);
        }} />
      )}

      {codexInfo().easterEggPopup && state().state !== 'paused' && (
        <div class="easter-egg-popup">
          <div class="easter-egg-popup-icon">🥚</div>
          <div class="easter-egg-popup-title">🎊 发现隐藏彩蛋！</div>
          <div class="easter-egg-popup-desc">{codexInfo().easterEggPopup}</div>
        </div>
      )}
    </div>
  );
}
