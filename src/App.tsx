import { createSignal, createMemo } from 'solid-js';
import Bookshelf from './components/Bookshelf';
import ClueCards from './components/ClueCards';
import HintSystem from './components/HintSystem';
import AchievementList from './components/AchievementList';
import Timer from './components/Timer';
import GameModal from './components/GameModal';
import Leaderboard from './components/Leaderboard';
import ChapterProgress from './components/ChapterProgress';
import { gameState, showAchievementPopup, getCurrentChapter, chapterTasks, getDifficultyInfo, dismissDifficultyChange } from './store/gameStore';
import { getDifficultyConfig } from './data/difficulty';

export default function App() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const state = createMemo(() => gameState());
  const diffInfo = createMemo(() => getDifficultyInfo());
  const isPlaying = createMemo(() => state().state === 'playing');
  const currentScore = createMemo(() => state().score);
  const currentLevel = createMemo(() => state().currentLevel);
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');
  const currentChapter = createMemo(() => getCurrentChapter());
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
          {!isChapterMode() && isPlaying() && (
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
            <div class="stat-label">{isChapterMode() ? '📖 任务' : '📖 关卡'}</div>
            <div class="stat-value">
              {isChapterMode() && tasks().length > 0
                ? `${currentLevel()}/${tasks().length}`
                : currentLevel()}
            </div>
          </div>
          {!isChapterMode() && isPlaying() && (
            <div class="stat-item difficulty-stat">
              <div class="stat-label">⚡ 倍率</div>
              <div class="stat-value">x{diffConfig().scoreMultiplier}</div>
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
            <span>⏱️ {diffConfig().gameTime}秒</span>
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
