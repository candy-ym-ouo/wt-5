import { createSignal, createMemo, For } from 'solid-js';
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
import AccountProfile from './components/AccountProfile';
import ActivityCenter from './components/ActivityCenter';
import BookRepairWorkshop from './components/BookRepairWorkshop';
import ThemeCollectionCenter from './components/ThemeCollectionCenter';
import SettlementCenter from './components/SettlementCenter';
import TouringExhibitionCenter from './components/TouringExhibitionCenter';
import TrainingCenter from './components/TrainingCenter';
import BooklistEditor from './components/BooklistEditor';
import { gameState, showAchievementPopup, showThemeRewardPopup, getCurrentChapter, chapterTasks, getDifficultyInfo, dismissDifficultyChange, getCurrentThemeInfo, targetBook, getStreakInfo, pauseGame, getDailyChallengeInfo, isDailyChallengeMode, getRushInfo, isRushMode, collectionCount, isCommissionMode, getCommissionInfo, isThemeCollectionMode, getThemeCollectionInfo, startGame, isBooklistMode, getBooklistInfo, startBooklistGame } from './store/gameStore';
import { openTrainingCenter, getTrainingCenterState, closeTrainingCenter } from './store/trainingStore';
import { showStoreManager, showRewardPopup, showTaskCompletePopup, openStoreManager, closeStoreManager, getCoins, getStoreLevel } from './store/storeManager';
import { showDecorationManager, openDecorationManager, closeDecorationManager, showDecorationNotification } from './store/decorationStore';
import { getCodexStateInfo, openCodex, closeCodex } from './store/codexStore';
import { getCalendarInfo, openCalendar, closeCalendar, getCalendarIntegration } from './store/calendarStore';
import { showAccountModal, closeAccountModal, openAccountModal, currentNickname, currentAvatar } from './store/accountStore';
import { openActivityCenter, closeActivityCenter, activityRewardPopup, dismissActivityRewardPopup, getActivityInfo } from './store/activityStore';
import { openWorkshop, closeWorkshop, getWorkshopStateInfo, showWorkshop } from './store/workshopStore';
import { openQuestPanel, closeQuestPanel, getQuestPanelInfo, getUnclaimedQuestCount, dismissQuestPopup } from './store/questStore';
import { openCharacterPanel, closeCharacterPanel, getCharacterPanelInfo, characterState, dismissRelationshipPopup, dismissBooklistUnlockPopup, dismissAchievementUnlockPopup, dismissQuestUnlockPopup } from './store/characterStore';
import { openExhibitionCenter, closeExhibitionCenter, exhibitionState, exhibitionRewardPopup, dismissExhibitionRewardPopup, getExhibitionInfo } from './store/touringExhibitionStore';
import { openBooklistCenter, getBooklistCenterState, closeBooklistCenter } from './store/booklistStore';
import { RELATIONSHIP_THRESHOLDS, RELATIONSHIP_LEVEL_ICONS } from './types/character';
import QuestPanel from './components/QuestPanel';
import CharacterPanel from './components/CharacterPanel';
import StoreManager from './components/StoreManager';
import { getDifficultyConfig } from './data/difficulty';
import { RARITY_CONFIG } from './data/themes';

export default function App() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const [showCollection, setShowCollection] = createSignal(false);
  const [showThemeCollection, setShowThemeCollection] = createSignal(false);
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
  const isTCMode = createMemo(() => isThemeCollectionMode());
  const tcInfo = createMemo(() => getThemeCollectionInfo());
  const isBLMode = createMemo(() => isBooklistMode());
  const blInfo = createMemo(() => getBooklistInfo());
  const coins = createMemo(() => getCoins());
  const storeLevel = createMemo(() => getStoreLevel());
  const codexInfo = createMemo(() => getCodexStateInfo());
  const calendarInfo = createMemo(() => getCalendarInfo());
  const calendarIntegration = createMemo(() => getCalendarIntegration());
  const activityInfo = createMemo(() => getActivityInfo());
  const questPanelInfo = createMemo(() => getQuestPanelInfo());
  const questUnclaimed = createMemo(() => getUnclaimedQuestCount());
  const charPanelInfo = createMemo(() => getCharacterPanelInfo());
  const exhibitionInfo = createMemo(() => getExhibitionInfo());
  const [showCalendar, setShowCalendar] = createSignal(false);
  const [showQuests, setShowQuests] = createSignal(false);
  const [showBooklist, setShowBooklist] = createSignal(false);
  const booklistState = createMemo(() => getBooklistCenterState());

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
          {isTCMode() && tcInfo() && (
            <span class="tc-header-badge" style={{ 'border-color': tcInfo()!.collection.color }}>
              {tcInfo()!.collection.icon} {tcInfo()!.collection.title} {tcInfo()!.progress}/{tcInfo()!.required}
            </span>
          )}
          {isBLMode() && blInfo() && (
            <span class="bl-header-badge" style={{ 'border-color': blInfo()!.booklist.color }}>
              {blInfo()!.booklist.icon} {blInfo()!.booklist.name} {blInfo()!.progress}/{blInfo()!.total}
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
            class="stat-item theme-collection-button"
            onClick={() => setShowThemeCollection(true)}
            title="主题馆藏"
          >
            <div class="stat-label">📚 主题</div>
            <div class="stat-value small-stat-value">馆藏</div>
          </button>
          <button 
            class="stat-item booklist-button"
            onClick={() => {
              openBooklistCenter();
              setShowBooklist(true);
            }}
            title="书单挑战"
          >
            <div class="stat-label">📑 书单</div>
            <div class="stat-value small-stat-value">挑战</div>
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
          <button 
            class="stat-item activity-button"
            onClick={openActivityCenter}
            title="活动中心"
          >
            <div class="stat-label">🎉 活动</div>
            <div class="stat-value small-stat-value">
              {activityInfo().unclaimedRewards > 0 ? `🎁${activityInfo().unclaimedRewards}` : '中心'}
            </div>
          </button>
          <button 
            class="stat-item activity-button"
            onClick={openExhibitionCenter}
            title="巡回展陈"
            style={{ 'border-color': '#ff9632 !important' }}
          >
            <div class="stat-label">🎪 巡展</div>
            <div class="stat-value small-stat-value">
              {exhibitionInfo().unclaimedRewards > 0 ? `🎁${exhibitionInfo().unclaimedRewards}` : '展陈'}
            </div>
          </button>
          <button 
            class="stat-item workshop-button"
            onClick={() => openWorkshop()}
            title="书籍修复工坊"
          >
            <div class="stat-label">🔧 工坊</div>
            <div class="stat-value small-stat-value">
              修复
            </div>
          </button>
          <button
            class="stat-item quest-button"
            onClick={() => {
              openQuestPanel();
              setShowQuests(true);
            }}
            title="任务中心"
          >
            <div class="stat-label">📋 任务</div>
            <div class="stat-value small-stat-value">
              {questUnclaimed() > 0 ? `🎁${questUnclaimed()}` : '查看'}
            </div>
          </button>
          <button
            class="stat-item character-button-header"
            onClick={() => openCharacterPanel()}
            title="角色关系"
          >
            <div class="stat-label">💬 角色</div>
            <div class="stat-value small-stat-value">
              {charPanelInfo().availableDialogueCount > 0 ? `💬${charPanelInfo().availableDialogueCount}` : '互动'}
            </div>
          </button>
          <button 
            class="stat-item training-button"
            onClick={() => openTrainingCenter()}
            title="教学与练习中心"
          >
            <div class="stat-label">🎓 教学</div>
            <div class="stat-value small-stat-value">练习</div>
          </button>
          <button 
            class="stat-item account-button"
            onClick={openAccountModal}
            title="账号档案"
          >
            <div class="stat-label">👤 账号</div>
            <div class="stat-value small-stat-value">
              <span class="account-avatar-header">{currentAvatar()}</span>
              {currentNickname().length > 6 ? currentNickname().substring(0, 6) + '...' : currentNickname()}
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

          {isBLMode() && blInfo() && (
            <div class="sidebar-section bl-section">
              <div class="section-title">
                <span>{blInfo()!.booklist.icon}</span>
                <span>书单挑战进度</span>
              </div>
              <div class="bl-progress-card" style={{ '--bl-color': blInfo()!.booklist.color }}>
                <div class="bl-card-title">{blInfo()!.booklist.name}</div>
                <div class="bl-progress-bar">
                  <div 
                    class="bl-progress-fill"
                    style={{ width: `${blInfo()?.percent}%` }}
                  />
                </div>
                <div class="bl-progress-info">
                  <span class="bl-progress-text">
                    {blInfo()?.progress} / {blInfo()?.total} 本书籍
                  </span>
                  <span class="bl-progress-score">
                    得分: {blInfo()?.score}
                  </span>
                </div>
                {currentBook() && (
                  <div class="bl-book-rarity">
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
                {blInfo()?.consecutiveCorrect && blInfo()!.consecutiveCorrect >= 3 && (
                  <div class="bl-streak-badge">
                    🔥 连对 {blInfo()!.consecutiveCorrect} 本
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
      <SettlementCenter />

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

      {showAccountModal() && (
        <AccountProfile onClose={closeAccountModal} />
      )}

      {activityInfo().isVisible && (
        <ActivityCenter onClose={closeActivityCenter} />
      )}

      {activityRewardPopup() && state().state !== 'paused' && (
        <div class="activity-reward-popup" onClick={dismissActivityRewardPopup}>
          <div class="activity-reward-popup-title">🎊 活动奖励</div>
          <div class="activity-reward-popup-name">{activityRewardPopup()?.title}</div>
          <div class="activity-reward-popup-content">
            {activityRewardPopup()?.coins && activityRewardPopup()!.coins! > 0 && (
              <div class="reward-item">
                <span class="reward-icon">🪙</span>
                <span class="reward-text">+{activityRewardPopup()!.coins} 金币</span>
              </div>
            )}
            {activityRewardPopup()?.points && activityRewardPopup()!.points! > 0 && (
              <div class="reward-item">
                <span class="reward-icon">⭐</span>
                <span class="reward-text">+{activityRewardPopup()!.points} 积分</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showWorkshop() && (
        <BookRepairWorkshop onClose={closeWorkshop} />
      )}

      {getWorkshopStateInfo().rewardPopup && state().state !== 'paused' && (
        <div class="workshop-reward-popup">
          <div class="workshop-reward-popup-title">📚 修复完成</div>
          <div class="workshop-reward-popup-text">{getWorkshopStateInfo().rewardPopup}</div>
        </div>
      )}

      {showQuests() && questPanelInfo().isVisible && (
        <QuestPanel onClose={() => {
          closeQuestPanel();
          setShowQuests(false);
        }} />
      )}

      {questPanelInfo().showCompletePopup && state().state !== 'paused' && (
        <div class="quest-complete-notification" onClick={() => dismissQuestPopup()}>
          <div class="quest-complete-notification-title">🎉 任务完成</div>
          <div class="quest-complete-notification-name">{questPanelInfo().showCompletePopup}</div>
        </div>
      )}

      {charPanelInfo().isVisible && (
        <CharacterPanel onClose={closeCharacterPanel} />
      )}

      {characterState().showRelationshipPopup && state().state !== 'paused' && (
        <div class="relationship-popup" onClick={() => dismissRelationshipPopup()}>
          <div style={{ 'font-size': '2rem', 'margin-bottom': '8px' }}>
            {RELATIONSHIP_LEVEL_ICONS[characterState().showRelationshipPopup!.newLevel] || '💕'}
          </div>
          <div style={{ color: '#ffd700', 'font-weight': 'bold', 'font-size': '1.1rem' }}>
            关系升级！
          </div>
          <div style={{ color: '#f5e6d3', 'font-size': '0.9rem', 'margin-top': '4px' }}>
            与{characterState().showRelationshipPopup!.characterId}的关系提升至
            {RELATIONSHIP_THRESHOLDS[characterState().showRelationshipPopup!.newLevel]?.label || characterState().showRelationshipPopup!.newLevel}
          </div>
        </div>
      )}

      {characterState().showBooklistUnlockPopup && state().state !== 'paused' && (
        <div class="relationship-popup" onClick={() => dismissBooklistUnlockPopup()}>
          <div style={{ 'font-size': '2rem', 'margin-bottom': '8px' }}>📚</div>
          <div style={{ color: '#ffd700', 'font-weight': 'bold', 'font-size': '1.1rem' }}>
            专属书单解锁！
          </div>
          <div style={{ color: '#f5e6d3', 'font-size': '0.9rem', 'margin-top': '4px' }}>
            新的专属书单已开启
          </div>
        </div>
      )}

      {characterState().showAchievementUnlockPopup && state().state !== 'paused' && (
        <div class="relationship-popup" onClick={() => dismissAchievementUnlockPopup()}>
          <div style={{ 'font-size': '2rem', 'margin-bottom': '8px' }}>🏅</div>
          <div style={{ color: '#ffd700', 'font-weight': 'bold', 'font-size': '1.1rem' }}>
            特殊成就解锁！
          </div>
          <div style={{ color: '#f5e6d3', 'font-size': '0.9rem', 'margin-top': '4px' }}>
            你获得了一个角色专属成就
          </div>
        </div>
      )}

      {characterState().showQuestUnlockPopup && state().state !== 'paused' && (
        <div class="relationship-popup" onClick={() => dismissQuestUnlockPopup()}>
          <div style={{ 'font-size': '2rem', 'margin-bottom': '8px' }}>📜</div>
          <div style={{ color: '#ffd700', 'font-weight': 'bold', 'font-size': '1.1rem' }}>
            支线任务解锁！
          </div>
          <div style={{ color: '#f5e6d3', 'font-size': '0.9rem', 'margin-top': '4px' }}>
            新的支线任务已开启
          </div>
        </div>
      )}

      {showThemeCollection() && (
        <ThemeCollectionCenter onClose={() => setShowThemeCollection(false)} />
      )}

      {exhibitionState().showExhibitionCenter && (
        <TouringExhibitionCenter onClose={closeExhibitionCenter} />
      )}

      {exhibitionRewardPopup() && state().state !== 'paused' && (
        <div class="activity-reward-popup" onClick={dismissExhibitionRewardPopup}>
          <div class="activity-reward-popup-title">🎊 巡展奖励</div>
          <div class="activity-reward-popup-name">{exhibitionRewardPopup()?.title}</div>
          <div class="activity-reward-popup-content">
            {exhibitionRewardPopup()?.coins && exhibitionRewardPopup()!.coins! > 0 && (
              <div class="reward-item">
                <span class="reward-icon">🪙</span>
                <span class="reward-text">+{exhibitionRewardPopup()!.coins} 金币</span>
              </div>
            )}
            {exhibitionRewardPopup()?.points && exhibitionRewardPopup()!.points! > 0 && (
              <div class="reward-item">
                <span class="reward-icon">💎</span>
                <span class="reward-text">+{exhibitionRewardPopup()!.points} 收藏积分</span>
              </div>
            )}
            <For each={exhibitionRewardPopup()?.rewards?.filter(r => r.type === 'achievement') || []}>
              {() => (
                <div class="reward-item">
                  <span class="reward-icon">🏆</span>
                  <span class="reward-text">成就解锁</span>
                </div>
              )}
            </For>
            <For each={exhibitionRewardPopup()?.rewards?.filter(r => r.type === 'title') || []}>
              {() => (
                <div class="reward-item">
                  <span class="reward-icon">👑</span>
                  <span class="reward-text">称号解锁</span>
                </div>
              )}
            </For>
          </div>
          <div class="reward-description">{exhibitionRewardPopup()?.description}</div>
        </div>
      )}

      {getTrainingCenterState().isVisible && (
        <TrainingCenter 
          onClose={closeTrainingCenter} 
          onStartGame={(difficulty) => {
            closeTrainingCenter();
            startGame(difficulty, 'dynamic');
          }}
        />
      )}

      {showBooklist() && booklistState().isVisible && (
        <BooklistEditor 
          onClose={() => {
            closeBooklistCenter();
            setShowBooklist(false);
          }}
          onStartChallenge={(booklistId) => {
            closeBooklistCenter();
            setShowBooklist(false);
            startBooklistGame(booklistId);
          }}
        />
      )}
    </div>
  );
}
