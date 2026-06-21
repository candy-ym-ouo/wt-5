import { createSignal, createMemo, For, onCleanup } from 'solid-js';
import { getPracticeModules, getSelectedModule, selectPracticeModule, startPractice, endPractice, completePractice } from '../../store/trainingStore';
import { BOOKS } from '../../data/books';
import type { Book } from '../../types/game';
import type { PracticeModule } from '../../types/training';

export default function PracticeCenter() {
  const modules = createMemo(() => getPracticeModules());
  const selectedModule = createMemo(() => getSelectedModule());
  const [currentQuestionIndex, setCurrentQuestionIndex] = createSignal(0);
  const [practiceQuestions, setPracticeQuestions] = createSignal<Book[]>([]);
  const [currentOptions, setCurrentOptions] = createSignal<Book[]>([]);
  const [correctCount, setCorrectCount] = createSignal(0);
  const [wrongBookIds, setWrongBookIds] = createSignal<string[]>([]);
  const [timeRemaining, setTimeRemaining] = createSignal(0);
  const [showResult, setShowResult] = createSignal(false);
  const [finalScore, setFinalScore] = createSignal(0);
  const [questionStartTime, setQuestionStartTime] = createSignal(0);
  const [totalTimeUsed, setTotalTimeUsed] = createSignal(0);
  const [filterType, setFilterType] = createSignal<'all' | 'clue_focus' | 'genre' | 'speed' | 'accuracy' | 'memory'>('all');

  let timerInterval: number | null = null;

  const filteredModules = createMemo(() => {
    if (filterType() === 'all') return modules();
    return modules().filter(m => m.type === filterType());
  });

  const generateQuestions = (module: PracticeModule) => {
    const shuffled = [...BOOKS].sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(module.questionsCount, shuffled.length));
    return questions;
  };

  const generateOptions = (correctBook: Book) => {
    const otherBooks = BOOKS.filter(b => b.id !== correctBook.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [correctBook, ...otherBooks].sort(() => Math.random() - 0.5);
    return options;
  };

  const handleSelectModule = (moduleId: string) => {
    const module = modules().find(m => m.id === moduleId);
    if (module?.unlocked) {
      selectPracticeModule(moduleId);
      setShowResult(false);
      setCorrectCount(0);
      setWrongBookIds([]);
    }
  };

  const handleStartPractice = () => {
    const module = selectedModule();
    if (!module) return;

    const questions = generateQuestions(module);
    setPracticeQuestions(questions);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setWrongBookIds([]);
    setTimeRemaining(module.timeLimit);
    setQuestionStartTime(Date.now());
    setTotalTimeUsed(0);
    setShowResult(false);

    if (questions.length > 0) {
      setCurrentOptions(generateOptions(questions[0]));
    }

    startPractice();
    startTimer();
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endTimer();
          finishPractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const handleSelectAnswer = (book: Book) => {
    const questions = practiceQuestions();
    const currentQuestion = questions[currentQuestionIndex()];
    if (!currentQuestion) return;

    const questionTimeUsed = Math.floor((Date.now() - questionStartTime()) / 1000);
    setTotalTimeUsed(prev => prev + questionTimeUsed);

    const isCorrect = book.id === currentQuestion.id;
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongBookIds(prev => [...prev, currentQuestion.id]);
    }

    if (currentQuestionIndex() < questions.length - 1) {
      const nextIndex = currentQuestionIndex() + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentOptions(generateOptions(questions[nextIndex]));
      setQuestionStartTime(Date.now());
    } else {
      finishPractice();
    }
  };

  const finishPractice = () => {
    endTimer();
    const module = selectedModule();
    if (!module) return;

    const totalQuestions = practiceQuestions().length;
    const score = totalQuestions > 0 ? Math.round((correctCount() / totalQuestions) * 100) : 0;
    
    setFinalScore(score);
    setShowResult(true);
    endPractice();

    completePractice(
      module.id,
      score,
      correctCount(),
      wrongBookIds(),
      totalTimeUsed()
    );
  };

  const handleBackToList = () => {
    endTimer();
    selectPracticeModule(null);
    endPractice();
    setShowResult(false);
  };

  const handleRetry = () => {
    handleStartPractice();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  onCleanup(() => {
    endTimer();
  });

  const moduleTypeLabels: Record<string, { label: string; icon: string }> = {
    all: { label: '全部', icon: '📋' },
    clue_focus: { label: '线索专项', icon: '🔍' },
    genre: { label: '类型专项', icon: '📚' },
    speed: { label: '速度训练', icon: '⚡' },
    accuracy: { label: '准确度训练', icon: '🎯' },
    memory: { label: '记忆训练', icon: '🧠' },
  };

  if (selectedModule() && practiceActive() && !showResult()) {
    const module = selectedModule()!;
    const currentBook = practiceQuestions()[currentQuestionIndex()];
    const totalQuestions = practiceQuestions().length;
    const progress = ((currentQuestionIndex() + 1) / totalQuestions) * 100;

    return (
      <div class="practice-session">
        <div class="practice-session-header">
          <button class="practice-back-btn" onClick={handleBackToList}>
            ← 退出练习
          </button>
          <div class="practice-session-info">
            <span class="practice-module-name">{module.title}</span>
            <span class="practice-progress-text">
              第 {currentQuestionIndex() + 1} / {totalQuestions} 题
            </span>
          </div>
          <div class={`practice-timer ${timeRemaining() < 30 ? 'warning' : ''}`}>
            ⏱️ {formatTime(timeRemaining())}
          </div>
        </div>

        <div class="practice-progress-bar">
          <div class="practice-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div class="practice-question-area">
          <div class="practice-question-card">
            <div class="question-type-badge">
              {module.type === 'clue_focus' && '线索推断题'}
              {module.type === 'genre' && '类型判断题'}
              {module.type === 'speed' && '快速选择题'}
              {module.type === 'accuracy' && '精准判断题'}
              {module.type === 'memory' && '记忆回忆题'}
            </div>
            
            <div class="practice-question-content">
              {module.type === 'genre' && (
                <>
                  <p class="question-prompt">根据以下描述，判断这是哪本书？</p>
                  <div class="book-description-box">
                    <p class="book-desc-text">"{currentBook?.description}"</p>
                    <p class="book-author-hint">作者：{currentBook?.author}</p>
                    <p class="book-year-hint">出版年份：{currentBook?.year}</p>
                  </div>
                </>
              )}
              
              {module.type === 'clue_focus' && module.focusClueTypes?.includes('year') && (
                <>
                  <p class="question-prompt">根据年代线索，这可能是哪本书？</p>
                  <div class="clue-box">
                    <span class="clue-label">📅 年代线索</span>
                    <span class="clue-content">{currentBook?.year} 年</span>
                  </div>
                  <p class="question-hint">提示：注意书籍的出版年份</p>
                </>
              )}

              {module.type === 'clue_focus' && module.focusClueTypes?.includes('author') && (
                <>
                  <p class="question-prompt">根据作者线索，这可能是哪本书？</p>
                  <div class="clue-box">
                    <span class="clue-label">✍️ 作者线索</span>
                    <span class="clue-content">{currentBook?.author}</span>
                  </div>
                  <p class="question-hint">提示：想想这位作者的著名作品</p>
                </>
              )}

              {module.type === 'clue_focus' && module.focusClueTypes?.includes('description') && (
                <>
                  <p class="question-prompt">根据描述线索，这可能是哪本书？</p>
                  <div class="clue-box">
                    <span class="clue-label">📝 描述线索</span>
                    <span class="clue-content">{currentBook?.description}</span>
                  </div>
                </>
              )}

              {module.type === 'speed' && (
                <>
                  <p class="question-prompt">快速识别这本书！</p>
                  <div class="book-info-box">
                    <h4 class="book-title-display">《{currentBook?.title}》</h4>
                    <p class="book-sub-info">{currentBook?.author} · {currentBook?.year}</p>
                  </div>
                  <p class="question-hint">请从选项中选出对应的书籍</p>
                </>
              )}

              {module.type === 'accuracy' && (
                <>
                  <p class="question-prompt">请仔细判断：这描述的是哪本书？</p>
                  <div class="detailed-description-box">
                    <p class="desc-title">📖 详细描述</p>
                    <p class="desc-text">{currentBook?.description}</p>
                    <p class="desc-story">✨ 背景故事：{currentBook?.backgroundStory?.substring(0, 100)}...</p>
                  </div>
                </>
              )}

              {module.type === 'memory' && (
                <>
                  <p class="question-prompt">凭记忆回答：这本书的作者是？</p>
                  <div class="memory-question-box">
                    <h4 class="memory-book-title">《{currentBook?.title}》</h4>
                  </div>
                  <p class="question-hint">不要看其他信息，凭记忆选择！</p>
                </>
              )}
            </div>
          </div>

          <div class="practice-options-grid">
            <For each={currentOptions()}>
              {(option) => (
                <button
                  class="practice-option-card"
                  onClick={() => handleSelectAnswer(option)}
                >
                  <div class="option-book-info">
                    <div 
                      class="option-book-spine" 
                      style={{ background: option.color }}
                    />
                    <div class="option-book-details">
                      <span class="option-book-title">《{option.title}》</span>
                      <span class="option-book-author">{option.author}</span>
                      <span class="option-book-genre">{option.genre} · {option.year}</span>
                    </div>
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="practice-session-footer">
          <div class="practice-stats-inline">
            <span>✅ 正确：{correctCount()}</span>
            <span>❌ 错误：{wrongBookIds().length}</span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedModule() && showResult()) {
    const module = selectedModule()!;
    const passed = finalScore() >= module.targetScore;
    const isNewBest = finalScore() > (module.bestScore || 0);

    return (
      <div class="practice-result">
        <div class="result-icon">
          {passed ? '🎉' : '💪'}
        </div>
        <h3 class="result-title">
          {passed ? '练习完成！' : '继续加油！'}
        </h3>
        
        <div class="result-score-circle">
          <svg viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="none" 
              stroke="rgba(255,255,255,0.1)" 
              stroke-width="8"
            />
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="none" 
              stroke={passed ? '#ffd700' : '#f59e0b'} 
              stroke-width="8"
              stroke-dasharray={`${finalScore() * 2.51} 251`}
              stroke-linecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="score-center">
            <span class="score-number">{finalScore()}</span>
            <span class="score-label">分</span>
          </div>
        </div>

        {isNewBest && (
          <div class="new-best-badge">🏆 新纪录！</div>
        )}

        <div class="result-stats">
          <div class="result-stat-item">
            <span class="stat-icon">✅</span>
            <span class="stat-value">{correctCount()}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="result-stat-item">
            <span class="stat-icon">❌</span>
            <span class="stat-value">{wrongBookIds().length}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="result-stat-item">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{formatTime(totalTimeUsed())}</span>
            <span class="stat-label">用时</span>
          </div>
          <div class="result-stat-item">
            <span class="stat-icon">🎯</span>
            <span class="stat-value">{module.targetScore}分</span>
            <span class="stat-label">目标</span>
          </div>
        </div>

        {wrongBookIds().length > 0 && (
          <div class="result-wrong-books">
            <p class="wrong-books-title">这些书需要多加练习：</p>
            <div class="wrong-books-mini-list">
              <For each={wrongBookIds()}>
                {(bookId) => {
                  const book = BOOKS.find(b => b.id === bookId);
                  return book ? (
                    <span class="wrong-book-mini">《{book.title}》</span>
                  ) : null;
                }}
              </For>
            </div>
          </div>
        )}

        <div class="result-actions">
          <button class="modal-button secondary" onClick={handleBackToList}>
            返回列表
          </button>
          <button class="modal-button primary" onClick={handleRetry}>
            再来一次
          </button>
        </div>
      </div>
    );
  }

  if (selectedModule()) {
    const module = selectedModule()!;
    
    return (
      <div class="practice-module-detail">
        <button class="practice-back-btn" onClick={handleBackToList}>
          ← 返回列表
        </button>

        <div class="module-detail-header">
          <span class="module-detail-icon">{module.icon}</span>
          <div>
            <h3 class="module-detail-title">{module.title}</h3>
            <p class="module-detail-desc">{module.description}</p>
          </div>
          {module.bestScore && module.bestScore > 0 && (
            <div class="module-best-score">
              <span class="best-label">最高分</span>
              <span class="best-value">{module.bestScore}分</span>
            </div>
          )}
        </div>

        <div class="module-info-grid">
          <div class="module-info-item">
            <span class="info-icon">📊</span>
            <span class="info-label">难度</span>
            <span class="info-value">
              {module.difficulty === 'easy' && '🌱 简单'}
              {module.difficulty === 'medium' && '📖 中等'}
              {module.difficulty === 'hard' && '🔥 困难'}
            </span>
          </div>
          <div class="module-info-item">
            <span class="info-icon">📝</span>
            <span class="info-label">题数</span>
            <span class="info-value">{module.questionsCount} 题</span>
          </div>
          <div class="module-info-item">
            <span class="info-icon">⏱️</span>
            <span class="info-label">时限</span>
            <span class="info-value">{Math.floor(module.timeLimit / 60)} 分钟</span>
          </div>
          <div class="module-info-item">
            <span class="info-icon">🎯</span>
            <span class="info-label">目标分</span>
            <span class="info-value">{module.targetScore} 分</span>
          </div>
          <div class="module-info-item">
            <span class="info-icon">📈</span>
            <span class="info-label">已完成</span>
            <span class="info-value">{module.completedCount} 次</span>
          </div>
          <div class="module-info-item">
            <span class="info-icon">🏆</span>
            <span class="info-label">最高分</span>
            <span class="info-value">{module.bestScore || 0} 分</span>
          </div>
        </div>

        {module.type === 'clue_focus' && module.focusClueTypes && (
          <div class="module-clue-focus">
            <h4 class="section-title">🔍 重点练习线索</h4>
            <div class="focus-clue-tags">
              <For each={module.focusClueTypes}>
                {(clueType) => (
                  <span class="focus-clue-tag">
                    {clueType === 'year' && '📅 年代'}
                    {clueType === 'author' && '✍️ 作者'}
                    {clueType === 'genre' && '📚 类型'}
                    {clueType === 'shelf' && '🗄️ 书架'}
                    {clueType === 'description' && '📝 描述'}
                    {clueType === 'background' && '✨ 背景'}
                  </span>
                )}
              </For>
            </div>
          </div>
        )}

        <div class="module-tips">
          <h4 class="section-title">💡 练习建议</h4>
          <ul class="tips-list">
            <li>先仔细阅读题目，不要着急作答</li>
            <li>遇到不会的题目可以先跳过（但会算错）</li>
            <li>练习结束后查看错题，重点复习</li>
            <li>多次练习可以提高熟练度</li>
          </ul>
        </div>

        <div class="module-start-section">
          <button 
            class="modal-button primary large" 
            onClick={handleStartPractice}
            disabled={!module.unlocked}
          >
            {module.unlocked ? '🚀 开始练习' : '🔒 未解锁'}
          </button>
          {!module.unlocked && (
            <p class="unlock-hint">完成更多基础练习后解锁</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div class="practice-modules-list">
      <div class="practice-filter-tabs">
        <For each={Object.entries(moduleTypeLabels)}>
          {([type, info]) => (
            <button
              class={`filter-tab ${filterType() === type ? 'active' : ''}`}
              onClick={() => setFilterType(type as any)}
            >
              <span class="filter-icon">{info.icon}</span>
              <span class="filter-label">{info.label}</span>
            </button>
          )}
        </For>
      </div>

      <div class="practice-modules-grid">
        <For each={filteredModules()}>
          {(module) => (
            <div
              class={`practice-module-card ${module.unlocked ? '' : 'locked'} ${module.completedCount > 0 ? 'played' : ''}`}
              onClick={() => handleSelectModule(module.id)}
            >
              <div class="pm-card-header">
                <span class="pm-icon">{module.icon}</span>
                <div class="pm-status">
                  {!module.unlocked && <span class="pm-badge locked">🔒 未解锁</span>}
                  {module.unlocked && module.completedCount > 0 && (
                    <span class="pm-badge played">已玩 {module.completedCount} 次</span>
                  )}
                  {module.unlocked && module.completedCount === 0 && (
                    <span class="pm-badge new">新</span>
                  )}
                </div>
              </div>
              
              <h5 class="pm-title">{module.title}</h5>
              <p class="pm-desc">{module.description}</p>
              
              <div class="pm-footer">
                <span class="pm-difficulty">
                  {module.difficulty === 'easy' && '🌱 简单'}
                  {module.difficulty === 'medium' && '📖 中等'}
                  {module.difficulty === 'hard' && '🔥 困难'}
                </span>
                <span class="pm-questions">{module.questionsCount}题</span>
                {module.bestScore && module.bestScore > 0 && (
                  <span class="pm-best">🏆 {module.bestScore}分</span>
                )}
              </div>

              {module.bestScore && module.bestScore > 0 && (
                <div class="pm-progress-bar">
                  <div 
                    class="pm-progress-fill" 
                    style={{ width: `${Math.min(100, (module.bestScore / module.targetScore) * 100)}%` }} 
                  />
                </div>
              )}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function practiceActive(): boolean {
  return false;
}
