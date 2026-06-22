import { createSignal, createMemo, For } from 'solid-js';
import { getWrongBookList, setWrongBookFilterType, reviewCorrect, getTrainingStats, getTrainingCenterState } from '../../store/trainingStore';
import { WRONG_REASON_LABELS } from '../../types/training';
import { BOOKS } from '../../data/books';
import type { Book } from '../../types/game';

export default function WrongBookReview() {
  const wrongBooks = createMemo(() => getWrongBookList());
  const stats = createMemo(() => getTrainingStats());
  const filter = createMemo(() => getTrainingCenterState().wrongBookFilter);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewCorrectCount, setReviewCorrectCount] = useState(0);
  const [showReviewResult, setShowReviewResult] = useState(false);
  const [sortBy, setSortBy] = useState<'wrongCount' | 'lastWrong' | 'rarity'>('wrongCount');

  function useState<T>(initial: T): [() => T, (v: T | ((prev: T) => T)) => void] {
    const [signal, setSignal] = createSignal(initial);
    return [signal, setSignal as (v: T | ((prev: T) => T)) => void];
  }

  const sortedWrongBooks = createMemo(() => {
    const books = [...wrongBooks()];
    if (sortBy() === 'wrongCount') {
      return books.sort((a, b) => b.wrongCount - a.wrongCount);
    } else if (sortBy() === 'lastWrong') {
      return books.sort((a, b) => b.lastWrongTime - a.lastWrongTime);
    } else {
      const rarityOrder: Record<string, number> = {
        'legendary': 5,
        'epic': 4,
        'rare': 3,
        'uncommon': 2,
        'common': 1,
      };
      return books.sort((a, b) => (rarityOrder[b.bookRarity] || 0) - (rarityOrder[a.bookRarity] || 0));
    }
  });

  const unmasteredCount = createMemo(() => wrongBooks().filter(w => !w.mastered).length);
  const masteredCount = createMemo(() => wrongBooks().filter(w => w.mastered).length);
  
  const reviewBooks = createMemo(() => {
    const currentFilter = filter();
    if (currentFilter === 'mastered') {
      return wrongBooks().filter(w => w.mastered);
    } else if (currentFilter === 'unmastered') {
      return wrongBooks().filter(w => !w.mastered);
    }
    return wrongBooks();
  });

  const getBookDetail = (bookId: string): Book | undefined => {
    return BOOKS.find(b => b.id === bookId);
  };

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleSelectBook = (bookId: string) => {
    if (!reviewMode()) {
      setSelectedBookId(selectedBookId() === bookId ? null : bookId);
    }
  };

  const handleStartReview = () => {
    if (reviewBooks().length === 0) return;
    setReviewMode(true);
    setCurrentReviewIndex(0);
    setReviewCorrectCount(0);
    setShowReviewResult(false);
  };

  const handleReviewAnswer = (isCorrect: boolean) => {
    const books = reviewBooks();
    const currentBook = books[currentReviewIndex()];
    
    if (isCorrect && currentBook) {
      reviewCorrect(currentBook.bookId);
      setReviewCorrectCount(prev => prev + 1);
    }

    if (currentReviewIndex() < books.length - 1) {
      setCurrentReviewIndex(prev => prev + 1);
    } else {
      setShowReviewResult(true);
    }
  };

  const handleEndReview = () => {
    setReviewMode(false);
    setShowReviewResult(false);
    setCurrentReviewIndex(0);
    setReviewCorrectCount(0);
  };

  const filterTabs = [
    { id: 'all', label: '全部', icon: '📋' },
    { id: 'unmastered', label: '待掌握', icon: '📝' },
    { id: 'mastered', label: '已掌握', icon: '✅' },
  ];

  if (reviewMode() && showReviewResult()) {
    const total = reviewBooks().length;
    const correct = reviewCorrectCount();
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div class="wrong-book-review-result">
        <div class="review-result-icon">
          {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
        </div>
        <h3 class="review-result-title">
          {accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '不错哦！' : '继续努力！'}
        </h3>
        <div class="review-result-score">
          <span class="score-num">{accuracy}</span>
          <span class="score-unit">%</span>
        </div>
        <p class="review-result-desc">本次复习正确率</p>
        
        <div class="review-stats">
          <div class="review-stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-value">{total}</span>
            <span class="stat-label">总题数</span>
          </div>
          <div class="review-stat-item">
            <span class="stat-icon">✅</span>
            <span class="stat-value">{correct}</span>
            <span class="stat-label">答对</span>
          </div>
          <div class="review-stat-item">
            <span class="stat-icon">❌</span>
            <span class="stat-value">{total - correct}</span>
            <span class="stat-label">答错</span>
          </div>
        </div>

        <div class="review-result-actions">
          <button class="modal-button secondary" onClick={handleEndReview}>
            返回列表
          </button>
          <button class="modal-button primary" onClick={handleStartReview}>
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  if (reviewMode()) {
    const books = reviewBooks();
    const currentWrongBook = books[currentReviewIndex()];
    const currentBook = currentWrongBook ? getBookDetail(currentWrongBook.bookId) : null;
    const progress = books.length > 0 ? ((currentReviewIndex() + 1) / books.length) * 100 : 0;

    if (!currentBook) {
      return (
        <div class="wrong-book-empty">
          <div class="empty-icon">📚</div>
          <h4>没有错题</h4>
          <p>太棒了，你已经掌握了所有书籍！</p>
          <button class="modal-button secondary" onClick={handleEndReview}>
            返回
          </button>
        </div>
      );
    }

    return (
      <div class="wrong-book-review-mode">
        <div class="review-header">
          <button class="review-back-btn" onClick={handleEndReview}>
            ← 退出复习
          </button>
          <div class="review-progress-info">
            <span>第 {currentReviewIndex() + 1} / {books.length} 题</span>
          </div>
          <div class="review-progress-bar">
            <div class="review-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div class="review-question-card">
          <div class="review-question-type">📝 错题复习</div>
          
          <div class="review-book-info">
            <h4 class="review-book-title">《{currentBook.title}》</h4>
            <p class="review-book-author">作者：{currentBook.author}</p>
            <p class="review-book-year">出版年份：{currentBook.year}</p>
            <p class="review-book-genre">类型：{currentBook.genre}</p>
          </div>

          <div class="review-question">
            <p class="question-text">请回忆这本书的描述，然后判断你是否记得。</p>
            <div class="review-book-description">
              <p class="desc-text">"{currentBook.description}"</p>
            </div>
          </div>

          <div class="wrong-reasons-tags">
            <span class="reason-title">上次错误原因：</span>
            <For each={currentWrongBook?.wrongReasons || []}>
              {(reason) => (
                <span class="wrong-reason-tag">
                  {WRONG_REASON_LABELS[reason]?.icon} {WRONG_REASON_LABELS[reason]?.label}
                </span>
              )}
            </For>
          </div>
        </div>

        <div class="review-actions">
          <button class="review-btn wrong" onClick={() => handleReviewAnswer(false)}>
            ❌ 没记住
          </button>
          <button class="review-btn correct" onClick={() => handleReviewAnswer(true)}>
            ✅ 记住了
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="wrong-book-container">
      <div class="wrong-book-stats">
        <div class="wb-stat-card">
          <span class="wb-stat-icon">📚</span>
          <div class="wb-stat-info">
            <span class="wb-stat-value">{stats().totalWrongBooks}</span>
            <span class="wb-stat-label">总错题数</span>
          </div>
        </div>
        <div class="wb-stat-card">
          <span class="wb-stat-icon">📝</span>
          <div class="wb-stat-info">
            <span class="wb-stat-value">{unmasteredCount()}</span>
            <span class="wb-stat-label">待掌握</span>
          </div>
        </div>
        <div class="wb-stat-card">
          <span class="wb-stat-icon">✅</span>
          <div class="wb-stat-info">
            <span class="wb-stat-value">{masteredCount()}</span>
            <span class="wb-stat-label">已掌握</span>
          </div>
        </div>
        <div class="wb-stat-card">
          <span class="wb-stat-icon">📈</span>
          <div class="wb-stat-info">
            <span class="wb-stat-value">{stats().masteryRate.toFixed(1)}%</span>
            <span class="wb-stat-label">掌握率</span>
          </div>
        </div>
      </div>

      <div class="wrong-book-toolbar">
        <div class="filter-tabs">
          <For each={filterTabs}>
            {(tab) => (
              <button
                class={`filter-tab small ${filter() === tab.id ? 'active' : ''}`}
                onClick={() => setWrongBookFilterType(tab.id as any)}
              >
                {tab.icon} {tab.label}
              </button>
            )}
          </For>
        </div>

        <div class="sort-selector">
          <span class="sort-label">排序：</span>
          <select value={sortBy()} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="wrongCount">错误次数</option>
            <option value="lastWrong">最近错误</option>
            <option value="rarity">稀有度</option>
          </select>
        </div>

        <button 
          class="start-review-btn"
          onClick={handleStartReview}
          disabled={reviewBooks().length === 0}
        >
          🔄 {filter() === 'all' ? '开始复习' : filter() === 'unmastered' ? '复习待掌握' : '复习已掌握'}
        </button>
      </div>

      {wrongBooks().length === 0 ? (
        <div class="wrong-book-empty">
          <div class="empty-icon">🎉</div>
          <h4>太棒了！</h4>
          <p>暂时没有错题，继续保持哦！</p>
          <p class="empty-hint">多做练习，错题会自动记录在这里</p>
        </div>
      ) : (
        <div class="wrong-book-list">
          <For each={sortedWrongBooks()}>
            {(wrongBook) => {
              const book = getBookDetail(wrongBook.bookId);
              const isExpanded = selectedBookId() === wrongBook.bookId;
              
              return (
                <div
                  class={`wrong-book-item ${wrongBook.mastered ? 'mastered' : ''} ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => handleSelectBook(wrongBook.bookId)}
                >
                  <div class="wb-item-header">
                    <div class="wb-book-spine" style={{ background: book?.color || '#8B4513' }} />
                    <div class="wb-book-info">
                      <h5 class="wb-book-title">《{wrongBook.bookTitle}》</h5>
                      <p class="wb-book-meta">
                        {wrongBook.bookAuthor} · {wrongBook.bookGenre}
                      </p>
                    </div>
                    
                    <div class="wb-stats">
                      <span class="wb-wrong-count">
                        ❌ {wrongBook.wrongCount}次
                      </span>
                      {wrongBook.mastered && (
                        <span class="wb-mastered-badge">✅ 已掌握</span>
                      )}
                      {!wrongBook.mastered && wrongBook.correctStreak > 0 && (
                        <span class="wb-streak-badge">🔥 {wrongBook.correctStreak}连胜</span>
                      )}
                    </div>
                    
                    <span class="wb-expand-icon">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {isExpanded && book && (
                    <div class="wb-item-detail">
                      <div class="detail-section">
                        <span class="detail-label">出版年份：</span>
                        <span class="detail-value">{book.year} 年</span>
                      </div>
                      <div class="detail-section">
                        <span class="detail-label">所在书架：</span>
                        <span class="detail-value">第 {book.shelf} 层</span>
                      </div>
                      <div class="detail-section">
                        <span class="detail-label">书籍描述：</span>
                        <p class="detail-desc">{book.description}</p>
                      </div>
                      <div class="detail-section">
                        <span class="detail-label">背景故事：</span>
                        <p class="detail-desc">{book.backgroundStory}</p>
                      </div>
                      <div class="detail-section">
                        <span class="detail-label">错误原因：</span>
                        <div class="wrong-reasons-list">
                          <For each={wrongBook.wrongReasons}>
                            {(reason) => (
                              <span class="wrong-reason-tag small">
                                {WRONG_REASON_LABELS[reason]?.icon} {WRONG_REASON_LABELS[reason]?.label}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                      <div class="detail-section">
                        <span class="detail-label">复习次数：</span>
                        <span class="detail-value">{wrongBook.reviewCount} 次</span>
                      </div>
                      <div class="detail-section">
                        <span class="detail-label">最近错误：</span>
                        <span class="detail-value">{formatDate(wrongBook.lastWrongTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </For>
        </div>
      )}
    </div>
  );
}
