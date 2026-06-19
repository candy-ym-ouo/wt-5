import { createSignal, createMemo } from 'solid-js';
import type { DifficultyLevel, DifficultyMode } from '../types/game';
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
  restartCurrentTask,
  restartChapter,
  setDifficulty,
} from '../store/gameStore';
import Leaderboard from './Leaderboard';
import ChapterSelect from './ChapterSelect';
import { getNextChapter } from '../data/chapters';
import { DIFFICULTY_CONFIGS, DIFFICULTY_LEVELS, getDifficultyConfig } from '../data/difficulty';
import { isNewPersonalBest, getPersonalBestRank, getPersonalBest, getCurrentSeason, getCurrentWeekNumber } from '../utils/storage';

export default function GameModal() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const [showChapterSelect, setShowChapterSelect] = createSignal(false);
  const [showDifficultySelect, setShowDifficultySelect] = createSignal(false);
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<DifficultyLevel>('normal');
  const [difficultyMode, setDifficultyMode] = createSignal<DifficultyMode>('dynamic');
  
  const state = createMemo(() => gameState());
  const book = createMemo(() => targetBook());
  const gameStatus = createMemo(() => state().state);
  const chapter = createMemo(() => getCurrentChapter());
  const tasks = createMemo(() => chapterTasks());
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');
  const currentDiffConfig = createMemo(() => getDifficultyConfig(state().difficultyLevel));

  const personalBestFlags = createMemo(() => isNewPersonalBest(state().score));
  const personalBestRank = createMemo(() => state().score > 0 ? getPersonalBestRank(state().score) : 0);
  const personalBestData = createMemo(() => getPersonalBest());
  const season = createMemo(() => getCurrentSeason());
  const weekNum = createMemo(() => getCurrentWeekNumber());

  const handleSelectDifficulty = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    setDifficulty(level, difficultyMode());
  };

  const handleToggleDifficultyMode = () => {
    const newMode: DifficultyMode = difficultyMode() === 'dynamic' ? 'fixed' : 'dynamic';
    setDifficultyMode(newMode);
    setDifficulty(selectedDifficulty(), newMode);
  };

  const handleStartGameWithDifficulty = () => {
    startGame(selectedDifficulty(), difficultyMode());
    setShowDifficultySelect(false);
  };

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
      {gameStatus() === 'idle' && !showChapterSelect() && !showDifficultySelect() && (
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
              <button class="modal-button" onClick={() => setShowDifficultySelect(true)}>
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

      {gameStatus() === 'idle' && showDifficultySelect() && (
        <div class="modal-overlay">
          <div class="modal-content difficulty-select-modal">
            <div class="modal-title">选择难度</div>
            <div class="modal-subtitle">
              选择适合你的挑战难度，或开启动态难度让系统自动调整。
            </div>

            <div class="difficulty-mode-toggle">
              <button 
                class={`mode-toggle-btn ${difficultyMode() === 'fixed' ? 'active' : ''}`}
                onClick={handleToggleDifficultyMode}
              >
                📌 固定难度
              </button>
              <button 
                class={`mode-toggle-btn ${difficultyMode() === 'dynamic' ? 'active' : ''}`}
                onClick={handleToggleDifficultyMode}
              >
                🔄 动态难度
              </button>
            </div>

            <div class="difficulty-mode-desc">
              {difficultyMode() === 'dynamic' 
                ? '系统会根据你的表现自动调整难度，保持挑战的趣味性'
                : '保持你选择的难度不变，适合专注练习特定难度'}
            </div>

            <div class="difficulty-cards">
              {DIFFICULTY_LEVELS.map((level) => {
                const config = DIFFICULTY_CONFIGS[level];
                const isSelected = selectedDifficulty() === level;
                return (
                  <div 
                    class={`difficulty-card ${isSelected ? 'selected' : ''} difficulty-${level}`}
                    onClick={() => handleSelectDifficulty(level)}
                  >
                    <div class="difficulty-card-icon">{config.icon}</div>
                    <div class="difficulty-card-name">{config.name}</div>
                    <div class="difficulty-card-desc">{config.description}</div>
                    <div class="difficulty-card-stats">
                      <span>⏱️ {config.gameTime}s</span>
                      <span>💡 {config.initialHints}</span>
                      <span>⚡ x{config.scoreMultiplier}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div class="difficulty-detail">
              <div class="difficulty-detail-title">
                {DIFFICULTY_CONFIGS[selectedDifficulty()].icon} {DIFFICULTY_CONFIGS[selectedDifficulty()].name} 难度详情
              </div>
              <div class="difficulty-detail-grid">
                <div class="detail-item">
                  <span class="detail-label">游戏时间</span>
                  <span class="detail-value">{DIFFICULTY_CONFIGS[selectedDifficulty()].gameTime} 秒</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">初始提示</span>
                  <span class="detail-value">{DIFFICULTY_CONFIGS[selectedDifficulty()].initialHints} 次</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">提示扣分</span>
                  <span class="detail-value">{DIFFICULTY_CONFIGS[selectedDifficulty()].hintPenalty} 分/次</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">错误扣时</span>
                  <span class="detail-value">{DIFFICULTY_CONFIGS[selectedDifficulty()].wrongPenaltyTime} 秒</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">错误扣分</span>
                  <span class="detail-value">{DIFFICULTY_CONFIGS[selectedDifficulty()].wrongPenaltyScore} 分</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">得分倍率</span>
                  <span class="detail-value">x{DIFFICULTY_CONFIGS[selectedDifficulty()].scoreMultiplier}</span>
                </div>
              </div>
              {DIFFICULTY_CONFIGS[selectedDifficulty()].targetBookFilter && (
                <div class="difficulty-filter-info">
                  <span class="filter-label">📚 目标书籍范围：</span>
                  {DIFFICULTY_CONFIGS[selectedDifficulty()].targetBookFilter?.genres && (
                    <span class="filter-value">{DIFFICULTY_CONFIGS[selectedDifficulty()].targetBookFilter!.genres!.join('、')}</span>
                  )}
                  {DIFFICULTY_CONFIGS[selectedDifficulty()].targetBookFilter?.yearRange && (
                    <span class="filter-value">
                      {DIFFICULTY_CONFIGS[selectedDifficulty()].targetBookFilter!.yearRange![0]} - 
                      {DIFFICULTY_CONFIGS[selectedDifficulty()].targetBookFilter!.yearRange![1]} 年出版
                    </span>
                  )}
                </div>
              )}
            </div>

            <div class="difficulty-actions">
              <button class="modal-button secondary" onClick={() => setShowDifficultySelect(false)}>
                ← 返回
              </button>
              <button class="modal-button" onClick={handleStartGameWithDifficulty}>
                🎮 开始游戏
              </button>
            </div>
          </div>
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

            {!isChapterMode() && (
              <div class="result-difficulty">
                <span class="result-diff-icon">{currentDiffConfig().icon}</span>
                <span class="result-diff-name">{currentDiffConfig().name}</span>
                <span class="result-diff-multiplier">x{currentDiffConfig().scoreMultiplier}倍率</span>
                {state().difficultyMode === 'dynamic' && <span class="result-diff-mode">🔄 动态</span>}
              </div>
            )}

            {!isChapterMode() && (
              <div class="next-round-bonus">
                <span class="bonus-icon">⏱️</span>
                <span class="bonus-text">完成回合奖励：进入下一局时 +10 秒</span>
                {state().difficultyMode === 'dynamic' && (
                  <span class="bonus-hint">（难度提升可获得额外时间奖励）</span>
                )}
              </div>
            )}

            <div class="score-big">+{state().score} 分</div>

            {!isChapterMode() && state().score > 0 && (
              <div class="settlement-ranking">
                {(personalBestFlags().score || personalBestFlags().weekly || personalBestFlags().season) && (
                  <div class="new-record-banner">
                    {personalBestFlags().score && <span class="record-badge score-record">🏆 新最高分！</span>}
                    {personalBestFlags().weekly && <span class="record-badge weekly-record">📅 本周最佳！</span>}
                    {personalBestFlags().season && <span class="record-badge season-record">🏅 赛季最佳！</span>}
                  </div>
                )}
                <div class="ranking-row">
                  <span class="ranking-label">预估排名</span>
                  <span class="ranking-value">#{personalBestRank()}</span>
                </div>
                <div class="ranking-row">
                  <span class="ranking-label">历史最高</span>
                  <span class="ranking-value">{personalBestData().highestScore} 分</span>
                </div>
                <div class="ranking-row">
                  <span class="ranking-label">{season().name} 赛季最佳</span>
                  <span class="ranking-value">{personalBestData().seasonBestScores[season().id] ?? 0} 分</span>
                </div>
                <div class="ranking-row">
                  <span class="ranking-label">第{weekNum()}周最佳</span>
                  <span class="ranking-value">{personalBestData().weeklyBestScores[weekNum()] ?? 0} 分</span>
                </div>
              </div>
            )}
            
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
            
            {!isChapterMode() && (
              <div class="result-difficulty">
                <span class="result-diff-icon">{currentDiffConfig().icon}</span>
                <span class="result-diff-name">{currentDiffConfig().name}</span>
                <span class="result-diff-multiplier">x{currentDiffConfig().scoreMultiplier}倍率</span>
                {state().difficultyMode === 'dynamic' && <span class="result-diff-mode">🔄 动态</span>}
              </div>
            )}
            
            <div class="score-big">{state().score} 分</div>

            {!isChapterMode() && state().score > 0 && (
              <div class="settlement-ranking">
                {(personalBestFlags().score || personalBestFlags().weekly || personalBestFlags().season) && (
                  <div class="new-record-banner">
                    {personalBestFlags().score && <span class="record-badge score-record">🏆 新最高分！</span>}
                    {personalBestFlags().weekly && <span class="record-badge weekly-record">📅 本周最佳！</span>}
                    {personalBestFlags().season && <span class="record-badge season-record">🏅 赛季最佳！</span>}
                  </div>
                )}
                <div class="ranking-row">
                  <span class="ranking-label">预估排名</span>
                  <span class="ranking-value">#{personalBestRank()}</span>
                </div>
                <div class="ranking-row">
                  <span class="ranking-label">历史最高</span>
                  <span class="ranking-value">{personalBestData().highestScore} 分</span>
                </div>
              </div>
            )}
            
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
                💾 进度已保存，可随时继续挑战
              </div>
            )}

            {isChapterMode() ? (
              <>
                <button class="modal-button" onClick={restartCurrentTask}>
                  🔄 重试当前任务
                </button>
                <button class="modal-button secondary" onClick={restartChapter}>
                  🔁 重新开始章节
                </button>
              </>
            ) : (
              <button class="modal-button" onClick={() => startGame()}>
                再来一局
              </button>
            )}
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
