import { createSignal, createMemo } from 'solid-js';
import Bookshelf from './components/Bookshelf';
import ClueCards from './components/ClueCards';
import HintSystem from './components/HintSystem';
import AchievementList from './components/AchievementList';
import Timer from './components/Timer';
import GameModal from './components/GameModal';
import Leaderboard from './components/Leaderboard';
import ChapterProgress from './components/ChapterProgress';
import { gameState, showAchievementPopup, showThemeRewardPopup, getCurrentChapter, chapterTasks, getDifficultyInfo, dismissDifficultyChange, getCurrentThemeInfo, targetBook } from './store/gameStore';
import { getDifficultyConfig } from './data/difficulty';
import { RARITY_CONFIG } from './data/themes';

export default function App() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const state = createMemo(() => gameState());
  const diffInfo = createMemo(() => getDifficultyInfo());
  const isPlaying = createMemo(() => state().state === 'playing');
  const currentScore = createMemo(() => state().score);
  const currentLevel = createMemo(() => state().currentLevel);
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');
  const isThemeMode = createMemo(() => state().currentThemeId !== null);
  const currentChapter = createMemo(() => getCurrentChapter());
  const currentTheme = createMemo(() => getCurrentThemeInfo());
  const currentBook = createMemo(() => targetBook());
  const tasks = createMemo(() => chapterTasks());
  const diffConfig = createMemo(() => getDifficultyConfig(state().difficultyLevel));
  const showDiffChange = createMemo(() => state().showDifficultyChange && state().state === 'playing');
  const isDynamicMode = createMemo(() => state().difficultyMode === 'dynamic');

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
          {!isChapterMode() && !isThemeMode() && isPlaying() && (
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
            <div class="stat-label">{isChapterMode() ? '📖 任务' : isThemeMode() ? '🎯 目标' : '📖 关卡'}</div>
            <div class="stat-value">
              {isChapterMode() && tasks().length > 0
                ? `${currentLevel()}/${tasks().length}`
                : isThemeMode() && currentTheme()
                ? `${currentTheme()?.progress}/${currentTheme()?.required}`
                : currentLevel()}
            </div>
          </div>
          {!isChapterMode() && isPlaying() && (
            <div class="stat-item difficulty-stat">
              <div class="stat-label">⚡ 倍率</div>
              <div class="stat-value">x{diffConfig().scoreMultiplier}</div>
            </div>
          )}
          {currentBook() && isPlaying() && (
            <div class="stat-item rarity-stat">
              <div class="stat-label">📚 稀有度</div>
              <div class="stat-value" style={{ color: RARITY_CONFIG[currentBook()!.rarity].color }}>
                {RARITY_CONFIG[currentBook()!.rarity].icon} {RARITY_CONFIG[currentBook()!.rarity].name}
              </div>
            </div>
          )}
          <button 
            class="stat-item rank-button"
            onClick={() => setShowLeaderboard(true)}
            title="查看排行榜和成就"
          >
            <div class="stat-label">🏆 排行</div>
            <div class="stat-value small-stat-value">查看</div>
          </button>
        </div>
      </header>

      <main class="game-main">
        <Bookshelf />
        
        <aside class="sidebar">
          <ChapterProgress />

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

          {isPlaying() && (
            <>
              <ClueCards />
              <HintSystem />
            </>
          )}

          <AchievementList />
        </aside>
      </main>

      <GameModal />

      {showAchievementPopup() && (
        <div class="achievement-popup">
          <div class="achievement-popup-title">🏆 成就解锁</div>
          <div class="achievement-popup-name">{showAchievementPopup()}</div>
        </div>
      )}

      {showThemeRewardPopup() && (
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
    </div>
  );
}
