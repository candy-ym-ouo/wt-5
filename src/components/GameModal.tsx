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
  nextThemeRound,
  getCurrentThemeInfo,
  hasThemeProgress,
  continueThemeGame,
  hasSavedStreak,
  getSavedStreakInfo,
  startGameWithStreak,
  resumeGame,
  currentClues,
  getWrongPenaltyInfo,
  startDailyChallenge,
  getDailyChallengeInfo,
  isDailyChallengeMode,
  startRushGame,
  getRushInfo,
  isRushMode,
  restartRushGame,
  lastRushStageBonus,
  lastRushTimeBonus,
  currentRating,
  collectionCount,
} from '../store/gameStore';
import RandomEventDisplay from './RandomEventDisplay';
import { getGradeInfo } from '../data/rating';
import Leaderboard from './Leaderboard';
import BookCollection from './BookCollection';
import ChapterSelect from './ChapterSelect';
import ThemeSelect from './ThemeSelect';
import { getNextChapter } from '../data/chapters';
import { DIFFICULTY_CONFIGS, DIFFICULTY_LEVELS, getDifficultyConfig } from '../data/difficulty';
import { RARITY_CONFIG } from '../data/themes';
import { isNewPersonalBest, getPersonalBestRank, getPersonalBest, getCurrentSeason, getCurrentWeekNumber, getDailyProgress, hasCompletedDailyChallenge } from '../utils/storage';
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
  const tasks = createMemo(() => chapterTasks());
  const isChapterMode = createMemo(() => state().gameMode === 'chapter');
  const isThemeMode = createMemo(() => state().currentThemeId !== null);
  const currentDiffConfig = createMemo(() => getDifficultyConfig(state().difficultyLevel));
  const themeInfo = createMemo(() => getCurrentThemeInfo());
  const clues = createMemo(() => currentClues());
  const unlockedClueCount = createMemo(() => clues().filter(c => c.unlocked).length);
  const totalClueCount = createMemo(() => clues().length);
  const wrongPenaltyInfo = createMemo(() => getWrongPenaltyInfo());
  
  const savedStreak = createMemo(() => getSavedStreakInfo());
  const hasStreak = createMemo(() => hasSavedStreak());
  const savedStreakTitle = createMemo(() => {
    const streak = savedStreak();
    return streak ? getStreakTitle(streak.currentStreak) : null;
  });

  const personalBestFlags = createMemo(() => isNewPersonalBest(state().score));
  const personalBestRank = createMemo(() => state().score > 0 ? getPersonalBestRank(state().score) : 0);
  const personalBestData = createMemo(() => getPersonalBest());
  const season = createMemo(() => getCurrentSeason());
  const weekNum = createMemo(() => getCurrentWeekNumber());
  
  const dailyChallengeData = createMemo(() => generateDailyChallenge());
  const dailyProgress = createMemo(() => getDailyProgress(getTodayDateKey()));
  const hasDailyCompleted = createMemo(() => hasCompletedDailyChallenge());
  const isDailyMode = createMemo(() => isDailyChallengeMode());
  const dailyInfo = createMemo(() => getDailyChallengeInfo());
  const isRushGameMode = createMemo(() => isRushMode());
  const rushInfo = createMemo(() => getRushInfo());
  const lastStageBonus = createMemo(() => lastRushStageBonus());
  const lastStageTimeBonus = createMemo(() => lastRushTimeBonus());
  const rating = createMemo(() => currentRating());
  const gradeInfo = createMemo(() => {
    const r = rating();
    return r ? getGradeInfo(r.grade) : null;
  });

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

            {rating() && gradeInfo() && (
              <div class="rating-section">
                <div class="rating-main">
                  <div class="rating-grade-badge" style={{ color: gradeInfo()!.color }}>
                    <span class="rating-grade-icon">{gradeInfo()!.icon}</span>
                    <span class="rating-grade-text">{rating()!.grade}</span>
                  </div>
                  <div class="rating-info">
                    <div class="rating-title" style={{ color: gradeInfo()!.color }}>
                      {rating()!.title}
                    </div>
                    <div class="rating-score">综合评分：{rating()!.score}/100</div>
                  </div>
                </div>
                <div class="rating-description">{rating()!.description}</div>

                <div class="rating-breakdown">
                  <div class="rating-breakdown-title">评分明细</div>
                  <div class="rating-breakdown-grid">
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">⏱️</span>
                      <span class="rb-label">用时</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.timeScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.timeScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">💡</span>
                      <span class="rb-label">提示使用</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.hintScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.hintScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">🎯</span>
                      <span class="rb-label">准确率</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.accuracyScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.accuracyScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">🔥</span>
                      <span class="rb-label">连胜</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.streakScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.streakScore}</span>
                    </div>
                  </div>
                </div>

                <div class="rating-feedback">
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.time}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.hints}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.accuracy}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.streak}</div>
                </div>

                <div class="rating-reward">
                  <div class="rating-reward-title">评级奖励</div>
                  <div class="rating-reward-badge">
                    <span class="rr-multiplier">x{rating()!.rewardMultiplier}</span>
                    <span class="rr-label">奖励倍率</span>
                  </div>
                  <div class="rating-reward-bonus">
                    额外奖励 +{rating()!.bonusScore} 分
                  </div>
                </div>
              </div>
            )}

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

            {(wrongPenaltyInfo().penaltyHistory.length > 0 || wrongPenaltyInfo().maxConsecutiveWrong > 0) && (
              <div class="penalty-stats">
                <div class="penalty-stats-title">📊 误选统计复盘</div>
                <div class="penalty-stats-grid">
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">总误选次数</span>
                    <span class="penalty-stat-value">{wrongPenaltyInfo().penaltyHistory.length}</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">最高连续误选</span>
                    <span class="penalty-stat-value">{wrongPenaltyInfo().maxConsecutiveWrong}</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">累计扣时</span>
                    <span class="penalty-stat-value penalty-negative">-{wrongPenaltyInfo().totalTimePenalty}s</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">累计扣分</span>
                    <span class="penalty-stat-value penalty-negative">-{wrongPenaltyInfo().totalScorePenalty}</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">提示冻结次数</span>
                    <span class="penalty-stat-value">{wrongPenaltyInfo().totalHintFreezes}</span>
                  </div>
                </div>
                {wrongPenaltyInfo().penaltyHistory.length > 0 && (
                  <div class="penalty-history">
                    <div class="penalty-history-title">误选记录</div>
                    <div class="penalty-history-list">
                      {wrongPenaltyInfo().penaltyHistory.slice(-5).map((event) => (
                        <div class={`penalty-history-item penalty-${event.level}`}>
                          <span class="penalty-level-badge">
                            {event.level === 'warning' ? '⚠️' : event.level === 'caution' ? '⚡' : event.level === 'danger' ? '🔥' : '💀'}
                          </span>
                          <span class="penalty-history-count">×{event.consecutiveCount}</span>
                          <span class="penalty-history-penalty">-{event.timePenalty}s</span>
                          {event.scorePenalty > 0 && <span class="penalty-history-penalty">-{event.scorePenalty}分</span>}
                          {event.hintFrozen && <span class="penalty-history-freeze">❄️{Math.ceil(event.hintFreezeDuration/1000)}s</span>}
                          <span class="penalty-history-level">关卡{event.currentLevel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {isThemeMode() && themeInfo() && (
              <div class="theme-progress-summary">
                <div class="theme-progress-label">
                  {themeInfo()?.theme.icon} {themeInfo()?.theme.title} - 挑战进度
                </div>
                <div class="theme-progress-bar">
                  <div 
                    class="theme-progress-fill"
                    style={{ width: `${themeInfo()?.percent}%` }}
                  />
                </div>
                <div class="theme-progress-text">
                  {themeInfo()?.progress} / {themeInfo()?.required} 本书籍完成
                  {themeInfo()?.isComplete && <span class="theme-complete-badge">✓ 挑战完成！</span>}
                </div>
                {themeInfo()?.isComplete && (
                  <div class="theme-bonus-badge">
                    ⭐ 通关奖励 +{themeInfo()?.theme.bonusScore} 分
                  </div>
                )}
              </div>
            )}

            {isDailyMode() && dailyInfo() && (
              <div class="daily-progress-summary">
                <div class="daily-progress-label">
                  📆 每日挑战 - 进度
                </div>
                <div class="daily-progress-bar">
                  <div 
                    class="daily-progress-fill"
                    style={{ width: `${dailyInfo()?.percent}%` }}
                  />
                </div>
                <div class="daily-progress-text">
                  {dailyInfo()?.progress} / {dailyInfo()?.total} 本书籍完成
                  {dailyInfo()?.isComplete && <span class="daily-complete-badge">✓ 挑战完成！</span>}
                </div>
              </div>
            )}

            {isRushGameMode() && rushInfo() && (
              <div class="rush-progress-summary">
                <div class="rush-progress-label">
                  ⚡ 闯关模式 - 第 {rushInfo()!.completedStagesCount} 阶段完成
                </div>
                <div class="rush-stage-rewards">
                  <div class="rush-reward-item">
                    <span class="rush-reward-icon">🎯</span>
                    <span class="rush-reward-label">阶段奖励</span>
                    <span class="rush-reward-value positive">+{lastStageBonus()} 分</span>
                  </div>
                  <div class="rush-reward-item">
                    <span class="rush-reward-icon">⏱️</span>
                    <span class="rush-reward-label">时间奖励</span>
                    <span class="rush-reward-value positive">+{lastStageTimeBonus()} 秒</span>
                  </div>
                </div>
                <div class="rush-stages-mini">
                  {rushInfo()!.stages.map((stage, index) => (
                    <div class={`rush-stage-mini-item rush-${stage.status}`}>
                      <span class="rush-stage-mini-num">{index + 1}</span>
                      <span class="rush-stage-mini-status">
                        {stage.status === 'completed' ? '✓' : stage.status === 'current' ? '●' : '○'}
                      </span>
                    </div>
                  ))}
                </div>
                <div class="rush-progress-bar">
                  <div 
                    class="rush-progress-fill"
                    style={{ width: `${rushInfo()!.percent}%` }}
                  />
                </div>
                <div class="rush-progress-text">
                  {rushInfo()!.completedStagesCount} / {rushInfo()!.total} 阶段完成
                  累计阶段奖励: +{rushInfo()!.totalStageBonus} 分
                </div>
                {rushInfo()!.completed && rushInfo()!.perfectRun && (
                  <div class="rush-perfect-run">
                    ⭐⭐⭐ 完美通关！额外 +{rushInfo()!.stageRewards.perfectBonus} 分
                  </div>
                )}
                {rushInfo()!.completed && (
                  <div class="rush-completion-bonus">
                    🏆 通关奖励 +{rushInfo()!.stageRewards.completionBonus} 分
                  </div>
                )}
              </div>
            )}

            {book() && (
              <div class="book-rarity-info">
                <span class="rarity-icon" style={{ color: RARITY_CONFIG[book()!.rarity].color }}>
                  {RARITY_CONFIG[book()!.rarity].icon}
                </span>
                <span class="rarity-name" style={{ color: RARITY_CONFIG[book()!.rarity].color }}>
                  {RARITY_CONFIG[book()!.rarity].name}
                </span>
                <span class="rarity-multiplier">
                  x{RARITY_CONFIG[book()!.rarity].scoreMultiplier} 得分倍率
                </span>
              </div>
            )}

            <button class="modal-button" onClick={isThemeMode() ? nextThemeRound : nextRound}>
              {isChapterMode() ? '下一个任务' : isThemeMode() ? '下一本书籍' : isDailyMode() ? '下一本挑战书' : isRushGameMode() && rushInfo()?.completed ? '🎉 挑战完成！' : isRushGameMode() ? '进入下一阶段 →' : '下一本书'}
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

            {rating() && gradeInfo() && (
              <div class="rating-section">
                <div class="rating-main">
                  <div class="rating-grade-badge" style={{ color: gradeInfo()!.color }}>
                    <span class="rating-grade-icon">{gradeInfo()!.icon}</span>
                    <span class="rating-grade-text">{rating()!.grade}</span>
                  </div>
                  <div class="rating-info">
                    <div class="rating-title" style={{ color: gradeInfo()!.color }}>
                      {rating()!.title}
                    </div>
                    <div class="rating-score">综合评分：{rating()!.score}/100</div>
                  </div>
                </div>
                <div class="rating-description">{rating()!.description}</div>

                <div class="rating-breakdown">
                  <div class="rating-breakdown-title">评分明细</div>
                  <div class="rating-breakdown-grid">
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">⏱️</span>
                      <span class="rb-label">用时</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.timeScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.timeScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">💡</span>
                      <span class="rb-label">提示使用</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.hintScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.hintScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">🎯</span>
                      <span class="rb-label">准确率</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.accuracyScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.accuracyScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">🔥</span>
                      <span class="rb-label">连胜</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.streakScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.streakScore}</span>
                    </div>
                  </div>
                </div>

                <div class="rating-feedback">
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.time}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.hints}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.accuracy}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.streak}</div>
                </div>

                <div class="rating-reward">
                  <div class="rating-reward-title">评级奖励</div>
                  <div class="rating-reward-badge">
                    <span class="rr-multiplier">x{rating()!.rewardMultiplier}</span>
                    <span class="rr-label">奖励倍率</span>
                  </div>
                  <div class="rating-reward-bonus">
                    额外奖励 +{rating()!.bonusScore} 分
                  </div>
                </div>
              </div>
            )}

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

            {rating() && gradeInfo() && (
              <div class="rating-section">
                <div class="rating-main">
                  <div class="rating-grade-badge" style={{ color: gradeInfo()!.color }}>
                    <span class="rating-grade-icon">{gradeInfo()!.icon}</span>
                    <span class="rating-grade-text">{rating()!.grade}</span>
                  </div>
                  <div class="rating-info">
                    <div class="rating-title" style={{ color: gradeInfo()!.color }}>
                      {rating()!.title}
                    </div>
                    <div class="rating-score">综合评分：{rating()!.score}/100</div>
                  </div>
                </div>
                <div class="rating-description">{rating()!.description}</div>

                <div class="rating-breakdown">
                  <div class="rating-breakdown-title">评分明细</div>
                  <div class="rating-breakdown-grid">
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">⏱️</span>
                      <span class="rb-label">用时</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.timeScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.timeScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">💡</span>
                      <span class="rb-label">提示使用</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.hintScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.hintScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">🎯</span>
                      <span class="rb-label">准确率</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.accuracyScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.accuracyScore}</span>
                    </div>
                    <div class="rating-breakdown-item">
                      <span class="rb-icon">🔥</span>
                      <span class="rb-label">连胜</span>
                      <div class="rb-bar-container">
                        <div class="rb-bar-fill" style={{ width: `${rating()!.breakdown.streakScore}%` }} />
                      </div>
                      <span class="rb-score">{rating()!.breakdown.streakScore}</span>
                    </div>
                  </div>
                </div>

                <div class="rating-feedback">
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.time}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.hints}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.accuracy}</div>
                  <div class="rating-feedback-item">{rating()!.detailedFeedback.streak}</div>
                </div>

                <div class="rating-reward">
                  <div class="rating-reward-title">评级奖励</div>
                  <div class="rating-reward-badge">
                    <span class="rr-multiplier">x{rating()!.rewardMultiplier}</span>
                    <span class="rr-label">奖励倍率</span>
                  </div>
                  <div class="rating-reward-bonus">
                    额外奖励 +{rating()!.bonusScore} 分
                  </div>
                </div>
              </div>
            )}

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

            {(wrongPenaltyInfo().penaltyHistory.length > 0 || wrongPenaltyInfo().maxConsecutiveWrong > 0) && (
              <div class="penalty-stats">
                <div class="penalty-stats-title">📊 误选统计复盘</div>
                <div class="penalty-stats-grid">
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">总误选次数</span>
                    <span class="penalty-stat-value">{wrongPenaltyInfo().penaltyHistory.length}</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">最高连续误选</span>
                    <span class="penalty-stat-value">{wrongPenaltyInfo().maxConsecutiveWrong}</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">累计扣时</span>
                    <span class="penalty-stat-value penalty-negative">-{wrongPenaltyInfo().totalTimePenalty}s</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">累计扣分</span>
                    <span class="penalty-stat-value penalty-negative">-{wrongPenaltyInfo().totalScorePenalty}</span>
                  </div>
                  <div class="penalty-stat-item">
                    <span class="penalty-stat-label">提示冻结次数</span>
                    <span class="penalty-stat-value">{wrongPenaltyInfo().totalHintFreezes}</span>
                  </div>
                </div>
                {wrongPenaltyInfo().penaltyHistory.length > 0 && (
                  <div class="penalty-history">
                    <div class="penalty-history-title">误选记录</div>
                    <div class="penalty-history-list">
                      {wrongPenaltyInfo().penaltyHistory.slice(-5).map((event) => (
                        <div class={`penalty-history-item penalty-${event.level}`}>
                          <span class="penalty-level-badge">
                            {event.level === 'warning' ? '⚠️' : event.level === 'caution' ? '⚡' : event.level === 'danger' ? '🔥' : '💀'}
                          </span>
                          <span class="penalty-history-count">×{event.consecutiveCount}</span>
                          <span class="penalty-history-penalty">-{event.timePenalty}s</span>
                          {event.scorePenalty > 0 && <span class="penalty-history-penalty">-{event.scorePenalty}分</span>}
                          {event.hintFrozen && <span class="penalty-history-freeze">❄️{Math.ceil(event.hintFreezeDuration/1000)}s</span>}
                          <span class="penalty-history-level">关卡{event.currentLevel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isChapterMode() && state().streak.bestStreak > 0 && (
              <div class="streak-summary-lost">
                <div class="streak-save-badge">
                  🔥 连胜已保存：{state().streak.bestStreak} 连胜
                </div>
                {state().streak.currentStreak === 0 && state().streak.bestStreak > 0 && (
                  <div class="streak-save-hint">
                    下局可选择继承连胜继续挑战！
                  </div>
                )}
              </div>
            )}

            {isChapterMode() && (
              <div class="chapter-save-hint">
                💾 进度已保存，可随时继续挑战
              </div>
            )}

            {isDailyMode() && dailyInfo() && (
              <div class="daily-progress-summary">
                <div class="daily-progress-label">
                  📆 每日挑战 - 进度
                </div>
                <div class="daily-progress-bar">
                  <div 
                    class="daily-progress-fill"
                    style={{ width: `${dailyInfo()?.percent}%` }}
                  />
                </div>
                <div class="daily-progress-text">
                  {state().foundBooks.length} / {dailyInfo()?.total} 本书籍完成
                </div>
                <div class="daily-best-hint">
                  💾 今日最佳成绩：{dailyProgress()?.bestScore || 0} 分
                </div>
              </div>
            )}

            {isRushGameMode() && rushInfo() && (
              <div class="rush-progress-summary">
                <div class="rush-progress-label">
                  ⚡ 闯关模式 - 挑战中断
                </div>
                <div class="rush-stages-mini">
                  {rushInfo()?.stages.map((stage, index) => (
                    <div class={`rush-stage-mini-item rush-${stage.status}`}>
                      <span class="rush-stage-mini-num">{index + 1}</span>
                      <span class="rush-stage-mini-status">
                        {stage.status === 'completed' ? '✓' : stage.status === 'current' ? '✗' : '○'}
                      </span>
                    </div>
                  ))}
                </div>
                <div class="rush-progress-text">
                  完成: {rushInfo()?.currentStageIndex} / {rushInfo()?.total} 阶段
                  累计得分: {state().score} 分
                </div>
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
            ) : isDailyMode() ? (
              <>
                <button class="modal-button" onClick={handleStartDailyChallenge}>
                  🔄 再挑战一次
                </button>
              </>
            ) : isRushGameMode() ? (
              <>
                <button class="modal-button rush-restart-button" onClick={restartRushGame}>
                  ⚡ 重新闯关
                </button>
              </>
            ) : (
              <>
                {hasStreak() ? (
                  <button class="modal-button streak-inherit-button" onClick={() => setShowStreakInherit(true)}>
                    🔥 继承连胜再战
                  </button>
                ) : (
                  <button class="modal-button" onClick={() => startGame()}>
                    再来一局
                  </button>
                )}
              </>
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
