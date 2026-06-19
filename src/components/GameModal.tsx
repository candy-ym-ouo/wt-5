import { createSignal, createMemo } from 'solid-js';
import {
  startGame,
  resetGame,
  gameState,
  nextRound,
  targetBook,
  getCurrentChapter,
  chapterTasks,
  hasSavedProgress,
  continueSavedGame,
  startChapterGame,
} from '../store/gameStore';
import Leaderboard from './Leaderboard';
import ChapterSelect from './ChapterSelect';
import { getNextChapter } from '../data/chapters';

export default function GameModal() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const [showChapterSelect, setShowChapterSelect] = createSignal(false);
  const state = createMemo(() => gameState());
  const book = createMemo(() => targetBook());
  const gameStatus = createMemo(() => state().state);
  const chapter = createMemo(() => getCurrentChapter());
  const tasks = createMemo(() => chapterTasks());
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');

  const handleContinue = () => {
    if (continueSavedGame()) {
      setShowChapterSelect(false);
    }
  };

  const handleNextChapter = () => {
    const current = chapter();
    if (!current) return;
    
    const next = getNextChapter(current.id);
    if (next) {
      resetGame();
      setTimeout(() => {
        startChapterGame(next.id);
      }, 100);
    } else {
      resetGame();
    }
  };

  const hasNextChapter = createMemo(() => {
    const current = chapter();
    if (!current) return false;
    return !!getNextChapter(current.id);
  });

  return (
    <>
      {gameStatus() === 'idle' && !showChapterSelect() && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">📚 旧书店寻物</div>
            <div class="modal-subtitle">
              欢迎来到神秘的旧书店！<br />
              根据线索卡片的提示，在书架上找到指定的书籍。<br />
              使用提示可以解锁更多线索，但会扣除分数。<br />
              时间有限，越快找到得分越高！
            </div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">⏱️</div>
                <div class="game-stat-label">3分钟限时</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">💡</div>
                <div class="game-stat-label">5次提示</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">🎯</div>
                <div class="game-stat-label">找书挑战</div>
              </div>
            </div>

            <div class="mode-buttons">
              <button class="modal-button" onClick={startGame}>
                🎮 经典模式
              </button>
              <button class="modal-button chapter-btn" onClick={() => setShowChapterSelect(true)}>
                📖 章节任务
              </button>
            </div>

            {hasSavedProgress() && (
              <button class="modal-button continue-btn" onClick={handleContinue}>
                ⏯️ 继续上次进度
              </button>
            )}
            
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              🏆 排行榜
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}

      {showChapterSelect() && gameStatus() === 'idle' && (
        <ChapterSelect onBack={() => setShowChapterSelect(false)} />
      )}

      {gameStatus() === 'won' && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">🎉 恭喜你！</div>
            <div class="modal-subtitle">
              你找到了《{book()?.title}》！
            </div>
            
            <div class="score-big">+{state().score} 分</div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">{state().foundBooks.length}</div>
                <div class="game-stat-label">已找到</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().hintsUsed}</div>
                <div class="game-stat-label">使用提示</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().currentLevel}</div>
                <div class="game-stat-label">{isChapterMode() ? '当前任务' : '当前关卡'}</div>
              </div>
            </div>

            {isChapterMode() && (
              <div class="chapter-progress-summary">
                <div class="progress-label">
                  {chapter()?.icon} {chapter()?.title} - 任务进度
                </div>
                <div class="progress-mini-bar">
                  <div 
                    class="progress-mini-fill"
                    style={{ width: `${(state().currentTaskIndex + 1) / tasks().length * 100}%` }}
                  />
                </div>
                <div class="progress-mini-text">
                  {state().currentTaskIndex + 1} / {tasks().length} 任务完成
                </div>
              </div>
            )}

            <button class="modal-button" onClick={nextRound}>
              {isChapterMode() ? '下一个任务' : '下一本书'}
            </button>
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              排行榜
            </button>
            <button class="modal-button secondary" onClick={resetGame}>
              返回主页
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}

      {gameStatus() === 'chapter_complete' && (
        <div class="modal-overlay">
          <div class="modal-content chapter-complete">
            <div class="chapter-complete-icon">🏆</div>
            <div class="modal-title">章节完成！</div>
            <div class="modal-subtitle">
              恭喜你完成了《{chapter()?.title}》的所有任务！
            </div>
            
            <div class="score-big">{state().chapterScore} 分</div>
            
            <div class="bonus-badge">
              ⭐ 通关奖励 +{chapter()?.bonusScore} 分
            </div>

            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">{tasks().length}</div>
                <div class="game-stat-label">完成任务</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{Math.floor(state().chapterTimeUsed)}s</div>
                <div class="game-stat-label">总用时</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().chapterHintsUsed}</div>
                <div class="game-stat-label">使用提示</div>
              </div>
            </div>

            <div class="chapter-tasks-summary">
              {tasks().map((task, index) => (
                <div class="task-summary-item">
                  <span class="task-num">{index + 1}</span>
                  <span class="task-name">{task.title}</span>
                  <span class="task-score">+{task.scoreEarned}</span>
                </div>
              ))}
            </div>

            <div class="chapter-complete-actions">
              {hasNextChapter() ? (
                <button class="modal-button" onClick={handleNextChapter}>
                  下一章 →
                </button>
              ) : (
                <button class="modal-button" onClick={resetGame}>
                  🎉 全部通关！
                </button>
              )}
              <button class="modal-button secondary" onClick={resetGame}>
                返回主页
              </button>
            </div>
          </div>
        </div>
      )}

      {gameStatus() === 'lost' && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">⏰ 时间到！</div>
            <div class="modal-subtitle">
              很遗憾，时间用完了。<br />
              你要找的书是《{book()?.title}》。
            </div>
            
            <div class="score-big">{state().score} 分</div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">{state().foundBooks.length}</div>
                <div class="game-stat-label">找到书籍</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().currentLevel}</div>
                <div class="game-stat-label">{isChapterMode() ? '到达任务' : '到达关卡'}</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().hintsUsed}</div>
                <div class="game-stat-label">使用提示</div>
              </div>
            </div>

            {isChapterMode() && (
              <div class="chapter-save-hint">
                💾 进度已保存，下次可以继续挑战
              </div>
            )}

            <button class="modal-button" onClick={startGame}>
              {isChapterMode() ? '重新挑战' : '再来一局'}
            </button>
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              排行榜
            </button>
            <button class="modal-button secondary" onClick={resetGame}>
              返回主页
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}
    </>
  );
}
