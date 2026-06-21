import { createSignal, createMemo } from 'solid-js';
import type { DifficultyLevel, DifficultyMode } from '../types/game';
import {
  startGame,
  resetGame,
  gameState,
  targetBook,
  getCurrentChapter,
  hasSavedProgress,
  continueSavedGame,
  startChapterGame,
  setDifficulty,
  hasThemeProgress,
  continueThemeGame,
  hasSavedStreak,
  getSavedStreakInfo,
  startGameWithStreak,
  resumeGame,
  currentClues,
  startDailyChallenge,
  startRushGame,
  collectionCount,
  startCommissionGame,
  isCommissionMode,
  getCommissionInfo,
  getAverageSatisfaction,
} from '../store/gameStore';
import RandomEventDisplay from './RandomEventDisplay';
import Leaderboard from './Leaderboard';
import BookCollection from './BookCollection';
import ChapterSelect from './ChapterSelect';
import ThemeSelect from './ThemeSelect';
import { DIFFICULTY_CONFIGS, DIFFICULTY_LEVELS, getDifficultyConfig } from '../data/difficulty';
import { getDailyProgress, hasCompletedDailyChallenge } from '../utils/storage';
import { getStreakTitle, STREAK_INHERIT_COST } from '../data/streaks';
import { generateDailyChallenge, getTodayDateKey } from '../data/dailyChallenge';
import StoryMode from './StoryMode';

export default function GameModal() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const [showChapterSelect, setShowChapterSelect] = createSignal(false);
  const [showThemeSelect, setShowThemeSelect] = createSignal(false);
  const [showDifficultySelect, setShowDifficultySelect] = createSignal(false);
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<DifficultyLevel>('normal');
  const [difficultyMode, setDifficultyMode] = createSignal<DifficultyMode>('dynamic');
  const [showStreakInherit, setShowStreakInherit] = createSignal(false);
  const [showCollection, setShowCollection] = createSignal(false);
  const [showStoryMode, setShowStoryMode] = createSignal(false);
  
  const state = createMemo(() => gameState());
  const book = createMemo(() => targetBook());
  const gameStatus = createMemo(() => state().state);
  const chapter = createMemo(() => getCurrentChapter());
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');
  const currentDiffConfig = createMemo(() => getDifficultyConfig(state().difficultyLevel));
  const clues = createMemo(() => currentClues());
  const unlockedClueCount = createMemo(() => clues().filter(c => c.unlocked).length);
  const totalClueCount = createMemo(() => clues().length);
  
  const savedStreak = createMemo(() => getSavedStreakInfo());
  const hasStreak = createMemo(() => hasSavedStreak());
  const savedStreakTitle = createMemo(() => {
    const streak = savedStreak();
    return streak ? getStreakTitle(streak.currentStreak) : null;
  });

  const dailyChallengeData = createMemo(() => generateDailyChallenge());
  const dailyProgress = createMemo(() => getDailyProgress(getTodayDateKey()));
  const hasDailyCompleted = createMemo(() => hasCompletedDailyChallenge());
  // Commission mode (used in buttons) - keep references for future use
  void isCommissionMode;
  void getCommissionInfo;
  void getAverageSatisfaction;

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

  const handleStartGameWithStreak = () => {
    startGameWithStreak(true);
    setShowDifficultySelect(false);
    setShowStreakInherit(false);
  };

  const handleStartGameWithoutStreak = () => {
    startGame(selectedDifficulty(), difficultyMode());
    setShowDifficultySelect(false);
    setShowStreakInherit(false);
  };

  const handleStartRushGame = () => {
    startRushGame(selectedDifficulty(), difficultyMode());
    setShowDifficultySelect(false);
  };

  const handleStartCommissionGame = () => {
    startCommissionGame();
    setShowDifficultySelect(false);
  };

  const handleContinue = () => {
    if (continueSavedGame()) {
      setShowChapterSelect(false);
    }
  };

  const handleContinueTheme = () => {
    const currentThemeId = state().currentThemeId;
    if (currentThemeId && continueThemeGame(currentThemeId)) {
      setShowThemeSelect(false);
    }
  };

  const handleStartDailyChallenge = () => {
    startDailyChallenge();
  };

  return (
    <>
      {gameStatus() === 'idle' && !showChapterSelect() && !showDifficultySelect() && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">📚 旧书店寻物</div>
            <div class="modal-subtitle">
              欢迎来到神秘的旧书店！<br />
              根据线索卡片的提示，在书架上找到指定的书籍。<br />
              共 7 类线索可解锁：年代、作者、分类、书架、描述、背景故事、书名。<br />
              使用提示可以解锁更多线索，但会扣除分数。<br />
              时间有限，越快找到得分越高！
            </div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">⏱️</div>
                <div class="game-stat-label">3分钟限时</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">🔍</div>
                <div class="game-stat-label">7类线索</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">💡</div>
                <div class="game-stat-label">2-9次提示</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">🎯</div>
                <div class="game-stat-label">找书挑战</div>
              </div>
            </div>

            <div class="mode-buttons">
              <button class="modal-button story-btn" onClick={() => setShowStoryMode(true)}>
                🏚️ 剧情模式
              </button>
              <button class="modal-button" onClick={() => setShowDifficultySelect(true)}>
                🎮 经典模式
              </button>
              <button class="modal-button chapter-btn" onClick={() => setShowChapterSelect(true)}>
                📖 章节任务
              </button>
              <button class="modal-button theme-btn" onClick={() => setShowThemeSelect(true)}>
                🎯 主题挑战
              </button>
              <button class="modal-button daily-btn" onClick={handleStartDailyChallenge}>
                📆 每日挑战
                {hasDailyCompleted() && <span class="daily-badge">✓</span>}
              </button>
              <button class="modal-button rush-btn" onClick={handleStartRushGame}>
                ⚡ 闯关模式
              </button>
              <button class="modal-button commission-btn" onClick={handleStartCommissionGame}>
                🧑‍💼 顾客委托
              </button>
            </div>

            {dailyProgress() && (
              <div class="daily-mini-progress">
                <span class="daily-mini-label">今日最佳：</span>
                <span class="daily-mini-score">{dailyProgress()?.bestScore || 0} 分</span>
                <span class="daily-mini-books">({dailyProgress()?.booksFound || 0}/{dailyChallengeData().totalBooks}本)</span>
              </div>
            )}

            {hasSavedProgress() && (
              <button class="modal-button continue-btn" onClick={handleContinue}>
                ⏯️ 继续章节进度
              </button>
            )}
            
            {state().currentThemeId && hasThemeProgress(state().currentThemeId!) && (
              <button class="modal-button continue-btn" onClick={handleContinueTheme}>
                ⏯️ 继续主题挑战
              </button>
            )}
            
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              🏆 排行榜
            </button>
            <button class="modal-button secondary" onClick={() => setShowCollection(true)}>
              📖 收藏册 ({collectionCount()})
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
          {showCollection() && (
            <BookCollection onClose={() => setShowCollection(false)} />
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

            {hasStreak() && (
              <div class="streak-section">
                <div class="section-title-sm">
                  <span>🔥</span>
                  <span>连胜记录</span>
                </div>
                <div class="streak-card-summary">
                  <div class="streak-summary-main">
                    <span class="streak-summary-icon">{savedStreakTitle()?.icon}</span>
                    <span class="streak-summary-title" style={{ color: savedStreakTitle()?.color }}>
                      {savedStreakTitle()?.title}
                    </span>
                    <span class="streak-summary-count" style={{ color: savedStreakTitle()?.color }}>
                      {savedStreak()?.currentStreak} 连胜
                    </span>
                  </div>
                  <div class="streak-summary-score">
                    上局得分：{savedStreak()?.lastScore} 分
                  </div>
                </div>
              </div>
            )}

            <div class="difficulty-actions">
              <button class="modal-button secondary" onClick={() => setShowDifficultySelect(false)}>
                ← 返回
              </button>
              {hasStreak() ? (
                <button class="modal-button streak-inherit-button" onClick={() => setShowStreakInherit(true)}>
                  🎮 开始经典模式
                </button>
              ) : (
                <button class="modal-button" onClick={handleStartGameWithDifficulty}>
                  🎮 开始经典模式
                </button>
              )}
              <button class="modal-button rush-start-button" onClick={handleStartRushGame}>
                ⚡ 开始闯关模式
              </button>
              <button class="modal-button commission-start-button" onClick={handleStartCommissionGame}>
                🧑‍💼 开始顾客委托
              </button>
            </div>
          </div>
        </div>
      )}

      {showStreakInherit() && (
        <div class="modal-overlay">
          <div class="modal-content streak-inherit-modal">
            <div class="modal-title">🔥 连胜继承</div>
            <div class="modal-subtitle">
              检测到你有保存的连胜记录，可以选择继承连胜继续挑战！
            </div>

            <div class="streak-inherit-card">
              <div class="streak-inherit-header">
                <span class="streak-inherit-icon">{savedStreakTitle()?.icon}</span>
                <span class="streak-inherit-title" style={{ color: savedStreakTitle()?.color }}>
                  {savedStreakTitle()?.title}
                </span>
              </div>
              <div class="streak-inherit-stats">
                <div class="streak-inherit-stat">
                  <div class="stat-value-big">{savedStreak()?.currentStreak}</div>
                  <div class="stat-label-sm">当前连胜</div>
                </div>
                <div class="streak-inherit-stat">
                  <div class="stat-value-big">{savedStreak()?.bestStreak}</div>
                  <div class="stat-label-sm">最高连胜</div>
                </div>
                <div class="streak-inherit-stat">
                  <div class="stat-value-big">{savedStreak()?.lastScore}</div>
                  <div class="stat-label-sm">上局得分</div>
                </div>
              </div>

              <div class="inherit-warning">
                <div class="inherit-warning-title">⚠️ 继承代价</div>
                <div class="inherit-warning-content">
                  <span class="inherit-penalty">
                    初始分数 -{STREAK_INHERIT_COST.scorePenaltyPercent}%
                  </span>
                  <span class="inherit-penalty">
                    初始时间 -{STREAK_INHERIT_COST.timePenaltyPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div class="streak-inherit-actions">
              <button class="modal-button secondary" onClick={() => setShowStreakInherit(false)}>
                ← 返回
              </button>
              <button class="modal-button secondary" onClick={handleStartGameWithoutStreak}>
                🆕 全新开始
              </button>
              <button class="modal-button streak-inherit-button" onClick={handleStartGameWithStreak}>
                🔥 继承连胜
              </button>
            </div>
          </div>
        </div>
      )}

      {showChapterSelect() && gameStatus() === 'idle' && (
        <ChapterSelect onBack={() => setShowChapterSelect(false)} />
      )}

      {showThemeSelect() && gameStatus() === 'idle' && (
        <ThemeSelect onBack={() => setShowThemeSelect(false)} />
      )}

      {showStoryMode() && gameStatus() === 'idle' && (
        <StoryMode
          onBack={() => setShowStoryMode(false)}
          onStartChapter={(chapterId) => {
            resetGame();
            setShowStoryMode(false);
            setTimeout(() => {
              startChapterGame(chapterId);
            }, 100);
          }}
        />
      )}

      {gameStatus() === 'won' && (
        <div class="modal-overlay">
          <div class="modal-content simple-result-modal">
            <div class="modal-title">🎉 恭喜你！</div>
            <div class="modal-subtitle">
              你找到了《{book()?.title}》！
            </div>
            <div class="score-big">+{state().score} 分</div>
            <div class="simple-result-hint">
              正在生成详细结算报告...
            </div>
          </div>
        </div>
      )}

      {gameStatus() === 'chapter_complete' && (
        <div class="modal-overlay">
          <div class="modal-content simple-result-modal chapter-complete">
            <div class="chapter-complete-icon">🏆</div>
            <div class="modal-title">章节完成！</div>
            <div class="modal-subtitle">
              恭喜你完成了《{chapter()?.title}》的所有任务！
            </div>
            <div class="score-big">{state().chapterScore} 分</div>
            <div class="bonus-badge">
              ⭐ 通关奖励 +{chapter()?.bonusScore} 分
            </div>
            <div class="simple-result-hint">
              正在生成详细结算报告...
            </div>
          </div>
        </div>
      )}

      {gameStatus() === 'lost' && (
        <div class="modal-overlay">
          <div class="modal-content simple-result-modal">
            <div class="modal-title">⏰ 时间到！</div>
            <div class="modal-subtitle">
              很遗憾，时间用完了。<br />
              你要找的书是《{book()?.title}》。
            </div>
            <div class="score-big">{state().score} 分</div>
            <div class="simple-result-hint">
              正在生成详细结算报告...
            </div>
          </div>
        </div>
      )}

      {gameStatus() === 'paused' && (
        <div class="modal-overlay">
          <div class="modal-content pause-modal">
            <div class="modal-title">⏸️ 游戏暂停</div>
            <div class="modal-subtitle">
              游戏已暂停，休息一下再继续吧！
            </div>

            <div class="pause-stats">
              <div class="pause-stat-item">
                <div class="pause-stat-icon">⏱️</div>
                <div class="pause-stat-value">{Math.floor(state().timeRemaining / 60)}:{(state().timeRemaining % 60).toString().padStart(2, '0')}</div>
                <div class="pause-stat-label">剩余时间</div>
              </div>
              <div class="pause-stat-item">
                <div class="pause-stat-icon">🎯</div>
                <div class="pause-stat-value">{state().score}</div>
                <div class="pause-stat-label">当前得分</div>
              </div>
              <div class="pause-stat-item">
                <div class="pause-stat-icon">🔍</div>
                <div class="pause-stat-value">{unlockedClueCount()}/{totalClueCount()}</div>
                <div class="pause-stat-label">线索解锁</div>
              </div>
              <div class="pause-stat-item">
                <div class="pause-stat-icon">📖</div>
                <div class="pause-stat-value">{state().currentLevel}</div>
                <div class="pause-stat-label">{isChapterMode() ? '当前任务' : '当前关卡'}</div>
              </div>
            </div>

            {!isChapterMode() && (
              <div class="pause-difficulty-info">
                <span class="pause-diff-icon">{currentDiffConfig().icon}</span>
                <span class="pause-diff-name">{currentDiffConfig().name}难度</span>
                {state().difficultyMode === 'dynamic' && <span class="pause-diff-mode">🔄 动态</span>}
              </div>
            )}

            <button class="modal-button pause-resume-btn" onClick={resumeGame}>
              ▶️ 继续游戏
            </button>
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              🏆 排行榜
            </button>
            <button class="modal-button secondary" onClick={resetGame}>
              🏠 返回主页
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}

      <RandomEventDisplay />
    </>
  );
}
