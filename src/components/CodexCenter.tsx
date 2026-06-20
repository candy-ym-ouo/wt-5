import { createMemo, For } from 'solid-js';
import {
  getCodexStateInfo,
  setActiveTab,
  selectBook,
  selectAuthor,
  selectTheme,
  selectEasterEgg,
  closeDetail,
  setFilter,
  setSortBy,
  getFilteredBooks,
  getFilteredAuthors,
  getFilteredThemes,
  getFilteredEasterEggs,
  toggleBookFav,
  toggleAuthorFav,
  isBookFav,
  isAuthorFav,
  discoveryRecords,
} from '../store/codexStore';
import { RARITY_CONFIG } from '../data/themes';
import { BOOKS } from '../data/books';
import { getAuthorByBookId } from '../data/codex';
import type { CodexTab } from '../types/codex';

interface CodexCenterProps {
  onClose: () => void;
}

const TABS: { key: CodexTab; label: string; icon: string }[] = [
  { key: 'books', label: '书籍档案', icon: '📚' },
  { key: 'authors', label: '作者信息', icon: '✍️' },
  { key: 'discoveries', label: '发现记录', icon: '🔍' },
  { key: 'themes', label: '主题套组', icon: '🎨' },
  { key: 'easterEggs', label: '隐藏彩蛋', icon: '🥚' },
];

const RARITY_OPTIONS = [
  { value: '', label: '全部稀有度' },
  { value: 'legendary', label: '传说' },
  { value: 'epic', label: '史诗' },
  { value: 'rare', label: '珍贵' },
  { value: 'uncommon', label: '稀有' },
  { value: 'common', label: '普通' },
];

const GENRE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: '文学', label: '文学' },
  { value: '古典', label: '古典' },
  { value: '科普', label: '科普' },
  { value: '技术', label: '技术' },
  { value: '历史', label: '历史' },
  { value: '哲学', label: '哲学' },
  { value: '科幻', label: '科幻' },
  { value: '散文', label: '散文' },
  { value: '童话', label: '童话' },
];

const SORT_OPTIONS = [
  { value: 'date', label: '按发现时间' },
  { value: 'name', label: '按名称' },
  { value: 'rarity', label: '按稀有度' },
  { value: 'progress', label: '按进度' },
];

export default function CodexCenter(props: CodexCenterProps) {
  const stateInfo = createMemo(() => getCodexStateInfo());
  const filteredBooks = createMemo(() => getFilteredBooks());
  const filteredAuthors = createMemo(() => getFilteredAuthors());
  const filteredThemes = createMemo(() => getFilteredThemes());
  const filteredEasterEggs = createMemo(() => getFilteredEasterEggs());

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleTabClick = (tab: CodexTab) => {
    setActiveTab(tab);
  };

  const handleBack = () => {
    closeDetail();
  };

  const handleSearch = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setFilter({ search: target.value || undefined });
  };

  const handleGenreChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setFilter({ genre: target.value || undefined });
  };

  const handleRarityChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setFilter({ rarity: target.value || undefined });
  };

  const handleSortChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setSortBy(target.value as 'name' | 'date' | 'rarity' | 'progress');
  };

  const toggleBookFavorite = (bookId: string, e: Event) => {
    e.stopPropagation();
    toggleBookFav(bookId);
  };

  const toggleAuthorFavorite = (authorId: string, e: Event) => {
    e.stopPropagation();
    toggleAuthorFav(authorId);
  };

  const getDiscoveryTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      first_find: '首次发现',
      speed_record: '速度记录',
      perfect_find: '完美发现',
      achievement_unlock: '成就解锁',
      theme_complete: '主题完成',
      special_event: '特殊事件',
    };
    return labels[type] || type;
  };

  const getDiscoveryTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      first_find: '✨',
      speed_record: '⚡',
      perfect_find: '💎',
      achievement_unlock: '🏆',
      theme_complete: '🎯',
      special_event: '🎁',
    };
    return icons[type] || '📌';
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content codex-modal" onClick={(e) => e.stopPropagation()}>
        <div class="codex-header">
          <div class="codex-title">
            <span class="codex-icon">📖</span>
            <span>图鉴中心</span>
          </div>
          <div class="codex-stats">
            <div class="codex-stat-item">
              <span class="cs-icon">📚</span>
              <span class="cs-text">{stateInfo().stats.collectedBooks}/{stateInfo().stats.totalBooks}</span>
            </div>
            <div class="codex-stat-item">
              <span class="cs-icon">✍️</span>
              <span class="cs-text">{stateInfo().stats.discoveredAuthors}/{stateInfo().stats.totalAuthors}</span>
            </div>
            <div class="codex-stat-item">
              <span class="cs-icon">🎨</span>
              <span class="cs-text">{stateInfo().stats.completedThemes}/{stateInfo().stats.totalThemes}</span>
            </div>
            <div class="codex-stat-item">
              <span class="cs-icon">🥚</span>
              <span class="cs-text">{stateInfo().stats.foundEasterEggs}/{stateInfo().stats.totalEasterEggs}</span>
            </div>
            <div class="codex-completion">
              <span class="cc-label">总进度</span>
              <div class="cc-bar">
                <div class="cc-fill" style={{ width: `${stateInfo().stats.completionPercentage}%` }} />
              </div>
              <span class="cc-percent">{stateInfo().stats.completionPercentage}%</span>
            </div>
          </div>
        </div>

        <div class="codex-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`codex-tab-btn ${stateInfo().activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label}</span>
              </button>
            )}
          </For>
        </div>

        {!stateInfo().showDetail ? (
          <>
            <div class="codex-filters">
              <div class="filter-group">
                <input
                  type="text"
                  class="filter-search"
                  placeholder="搜索..."
                  onInput={handleSearch}
                  value={stateInfo().filter.search || ''}
                />
              </div>
              {stateInfo().activeTab === 'books' && (
                <>
                  <div class="filter-group">
                    <select class="filter-select" onChange={handleGenreChange}>
                      <For each={GENRE_OPTIONS}>
                        {(opt) => (
                          <option value={opt.value} selected={stateInfo().filter.genre === opt.value}>
                            {opt.label}
                          </option>
                        )}
                      </For>
                    </select>
                  </div>
                  <div class="filter-group">
                    <select class="filter-select" onChange={handleRarityChange}>
                      <For each={RARITY_OPTIONS}>
                        {(opt) => (
                          <option value={opt.value} selected={stateInfo().filter.rarity === opt.value}>
                            {opt.label}
                          </option>
                        )}
                      </For>
                    </select>
                  </div>
                </>
              )}
              <div class="filter-group">
                <select class="filter-select" onChange={handleSortChange}>
                  <For each={SORT_OPTIONS}>
                    {(opt) => (
                      <option value={opt.value} selected={stateInfo().sortBy === opt.value}>
                        {opt.label}
                      </option>
                    )}
                  </For>
                </select>
              </div>
            </div>

            <div class="codex-content">
              {stateInfo().activeTab === 'books' && (
                <div class="codex-grid">
                  <For each={filteredBooks()}>
                    {(item) => (
                      <div
                        class={`codex-card book-card ${item.collected ? 'collected' : 'locked'}`}
                        onClick={() => item.collected && selectBook(item.book.id)}
                      >
                        <div class="card-spine" style={{ background: item.collected ? item.book.color : '#555' }}>
                          <span class="spine-icon">{item.book.rarity === 'legendary' ? '👑' : item.book.rarity === 'epic' ? '⭐' : ''}</span>
                        </div>
                        <div class="card-content">
                          <div class="card-title">
                            {item.collected ? item.book.title : '???'}
                            <button
                              class={`fav-btn ${isBookFav(item.book.id) ? 'favorited' : ''}`}
                              onClick={(e) => item.collected && toggleBookFavorite(item.book.id, e)}
                            >
                              {isBookFav(item.book.id) ? '❤️' : '🤍'}
                            </button>
                          </div>
                          <div class="card-author">
                            {item.collected ? item.book.author : '未发现'}
                          </div>
                          <div class="card-meta">
                            <span class="card-genre">{item.book.genre}</span>
                            <span
                              class="card-rarity"
                              style={{ color: item.collected ? RARITY_CONFIG[item.book.rarity].color : '#888' }}
                            >
                              {RARITY_CONFIG[item.book.rarity].icon} {item.collected ? RARITY_CONFIG[item.book.rarity].name : '???'}
                            </span>
                          </div>
                          {item.collected && stateInfo().collectionEntries[item.book.id] && (
                            <div class="card-stats">
                              <span class="cs-mini">🏆 {stateInfo().collectionEntries[item.book.id].bestScore}</span>
                              <span class="cs-mini">⏱️ {stateInfo().collectionEntries[item.book.id].fastestFind.toFixed(1)}s</span>
                            </div>
                          )}
                        </div>
                        {item.collected && (
                          <div class="card-badge">✓</div>
                        )}
                      </div>
                    )}
                  </For>
                </div>
              )}

              {stateInfo().activeTab === 'authors' && (
                <div class="codex-grid">
                  <For each={filteredAuthors()}>
                    {(item) => (
                      <div
                        class={`codex-card author-card ${item.discovered ? 'collected' : 'locked'}`}
                        onClick={() => item.discovered && selectAuthor(item.author.id)}
                      >
                        <div class="author-avatar" style={{ background: item.discovered ? item.author.portraitColor : '#555' }}>
                          <span class="avatar-icon">{item.discovered ? item.author.avatar : '?'}</span>
                        </div>
                        <div class="card-content">
                          <div class="card-title">
                            {item.discovered ? item.author.name : '???'}
                            <button
                              class={`fav-btn ${isAuthorFav(item.author.id) ? 'favorited' : ''}`}
                              onClick={(e) => item.discovered && toggleAuthorFavorite(item.author.id, e)}
                            >
                              {isAuthorFav(item.author.id) ? '❤️' : '🤍'}
                            </button>
                          </div>
                          <div class="card-author">
                            {item.discovered ? `${item.author.nationality} · ${item.author.era}` : '未发现'}
                          </div>
                          {item.discovered && (
                            <div class="card-meta">
                              <span class="card-birth">
                                {item.author.birthYear < 0 
                                  ? `公元前${Math.abs(item.author.birthYear)}年` 
                                  : `${item.author.birthYear}年`}
                                {item.author.deathYear && ` - ${item.author.deathYear < 0 ? `公元前${Math.abs(item.author.deathYear)}年` : `${item.author.deathYear}年`}`}
                              </span>
                            </div>
                          )}
                          {item.discovered && (
                            <div class="card-stats">
                              <span class="cs-mini">📚 作品: {item.author.bookIds.length}</span>
                              <span class="cs-mini">💡 已读: {stateInfo().authorEntries[item.author.id]?.booksRead.length || 0}</span>
                            </div>
                          )}
                        </div>
                        {item.discovered && (
                          <div class="card-badge">✓</div>
                        )}
                      </div>
                    )}
                  </For>
                </div>
              )}

              {stateInfo().activeTab === 'discoveries' && (
                <div class="discovery-list">
                  {(() => {
                    const records = discoveryRecords();
                    const sortedRecords = [...records]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 50);
                    
                    if (sortedRecords.length === 0) {
                      return (
                        <div class="empty-state">
                          <div class="empty-icon">🔍</div>
                          <div class="empty-text">还没有发现记录</div>
                          <div class="empty-hint">开始游戏，发现你的第一本书吧！</div>
                        </div>
                      );
                    }
                    
                    return (
                      <For each={sortedRecords}>
                        {(record) => {
                          const book = BOOKS.find(b => b.id === record.bookId);
                          const rarityConfig = RARITY_CONFIG[record.rarity];
                          return (
                            <div class="discovery-item">
                              <div class="di-icon" style={{ background: rarityConfig?.color || '#888' }}>
                                {getDiscoveryTypeIcon(record.type)}
                              </div>
                              <div class="di-content">
                                <div class="di-title">
                                  {getDiscoveryTypeLabel(record.type)}: {book?.title || record.bookId}
                                </div>
                                <div class="di-narrative">{record.narrative}</div>
                                <div class="di-meta">
                                  <span class="di-rarity" style={{ color: rarityConfig?.color }}>
                                    {rarityConfig?.icon} {rarityConfig?.name}
                                  </span>
                                  <span class="di-date">{formatDate(record.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    );
                  })()}
                </div>
              )}

              {stateInfo().activeTab === 'themes' && (
                <div class="codex-grid">
                  <For each={filteredThemes()}>
                    {(item) => (
                      <div
                        class={`codex-card theme-card ${item.completed ? 'collected' : 'locked'}`}
                        onClick={() => selectTheme(item.theme.id)}
                      >
                        <div class="theme-icon-large">{item.theme.icon}</div>
                        <div class="card-content">
                          <div class="card-title">{item.theme.name}</div>
                          <div class="card-author">{item.theme.description.slice(0, 50)}...</div>
                          <div class="theme-progress">
                            <div class="theme-progress-bar">
                              <div
                                class="theme-progress-fill"
                                style={{ width: `${(item.progress / item.theme.bookIds.length) * 100}%` }}
                              />
                            </div>
                            <span class="theme-progress-text">
                              {item.progress}/{item.theme.bookIds.length} ({item.theme.requiredBooks}解锁)
                            </span>
                          </div>
                          <div class="card-stats">
                            <span class="cs-mini">🎁 奖励: {item.theme.reward.value}</span>
                            <span class={`difficulty-badge ${item.theme.difficulty}`}>
                              {item.theme.difficulty === 'easy' ? '简单' : item.theme.difficulty === 'medium' ? '中等' : '困难'}
                            </span>
                          </div>
                        </div>
                        {item.completed && (
                          <div class="card-badge">✓</div>
                        )}
                      </div>
                    )}
                  </For>
                </div>
              )}

              {stateInfo().activeTab === 'easterEggs' && (
                <div class="codex-grid">
                  <For each={filteredEasterEggs()}>
                    {(item) => (
                      <div
                        class={`codex-card easter-egg-card ${item.found ? 'collected' : 'locked'}`}
                        onClick={() => item.found && selectEasterEgg(item.egg.id)}
                      >
                        <div class="egg-icon">
                          {item.found ? item.egg.icon : '❓'}
                        </div>
                        <div class="card-content">
                          <div class="card-title">
                            {item.found ? item.egg.name : '???'}
                          </div>
                          <div class="card-author">
                            {item.found ? item.egg.description.slice(0, 40) + '...' : item.egg.hint}
                          </div>
                          <div class="card-meta">
                            <span class={`category-badge ${item.egg.category}`}>
                              {item.egg.category === 'literary_reference' ? '文学典故' :
                               item.egg.category === 'pop_culture' ? '流行文化' :
                               item.egg.category === 'developer_joke' ? '程序员梗' :
                               item.egg.category === 'historical_fact' ? '历史趣闻' : '隐藏故事'}
                            </span>
                          </div>
                          {item.found && (
                            <div class="card-stats">
                              <span class="cs-mini">🎁 {item.egg.reward.type === 'score' ? `+${item.egg.reward.value}分` : item.egg.reward.value}</span>
                            </div>
                          )}
                        </div>
                        {item.found && (
                          <div class="card-badge">✓</div>
                        )}
                      </div>
                    )}
                  </For>
                </div>
              )}
            </div>
          </>
        ) : (
          <div class="codex-detail">
            <button class="detail-back-btn" onClick={handleBack}>
              ← 返回列表
            </button>

            {stateInfo().selectedBookId && (() => {
              const book = BOOKS.find(b => b.id === stateInfo().selectedBookId);
              const entry = stateInfo().collectionEntries[stateInfo().selectedBookId!];
              const author = getAuthorByBookId(stateInfo().selectedBookId!);
              if (!book) return null;

              return (
                <div class="book-detail">
                  <div class="detail-header" style={{ '--book-color': book.color }}>
                    <div class="detail-spine" style={{ background: book.color }}>
                      <span class="detail-spine-text">{book.title}</span>
                    </div>
                    <div class="detail-book-info">
                      <div class="detail-title">
                        {book.title}
                        <button
                          class={`fav-btn large ${isBookFav(book.id) ? 'favorited' : ''}`}
                          onClick={() => toggleBookFav(book.id)}
                        >
                          {isBookFav(book.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div class="detail-author">{book.author}</div>
                      <div class="detail-meta">
                        <span class="detail-genre">{book.genre}</span>
                        <span class="detail-year">
                          {book.year < 0 ? `公元前${Math.abs(book.year)}年` : `${book.year}年`}
                        </span>
                        <span
                          class="detail-rarity"
                          style={{ color: RARITY_CONFIG[book.rarity].color }}
                        >
                          {RARITY_CONFIG[book.rarity].icon} {RARITY_CONFIG[book.rarity].name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-description">{book.description}</div>
                  <div class="detail-story">{book.backgroundStory}</div>

                  <div class="detail-themes">
                    <For each={book.themes}>
                      {(theme) => <span class="detail-theme-tag">{theme}</span>}
                    </For>
                  </div>

                  {author && (
                    <div class="detail-author-section" onClick={() => selectAuthor(author.id)}>
                      <div class="das-label">✍️ 作者</div>
                      <div class="das-content">
                        <div class="das-avatar" style={{ background: author.portraitColor }}>
                          {author.avatar}
                        </div>
                        <div class="das-info">
                          <div class="das-name">{author.name}</div>
                          <div class="das-nationality">{author.nationality} · {author.era}</div>
                        </div>
                        <div class="das-arrow">→</div>
                      </div>
                    </div>
                  )}

                  {entry && (
                    <div class="detail-stats-section">
                      <div class="detail-stats-title">📊 收藏记录</div>
                      <div class="detail-stats-grid">
                        <div class="detail-stat-card">
                          <div class="ds-icon">📅</div>
                          <div class="ds-label">首次发现</div>
                          <div class="ds-value">{formatDate(entry.firstFoundAt)}</div>
                        </div>
                        <div class="detail-stat-card highlight">
                          <div class="ds-icon">🏆</div>
                          <div class="ds-label">最佳成绩</div>
                          <div class="ds-value">{entry.bestScore} 分</div>
                          <div class="ds-date">{formatDate(entry.bestScoreDate)}</div>
                        </div>
                        <div class="detail-stat-card">
                          <div class="ds-icon">⚡</div>
                          <div class="ds-label">最快找到</div>
                          <div class="ds-value">{entry.fastestFind.toFixed(1)} 秒</div>
                          <div class="ds-date">{formatDate(entry.fastestFindDate)}</div>
                        </div>
                        <div class="detail-stat-card">
                          <div class="ds-icon">💡</div>
                          <div class="ds-label">最少提示</div>
                          <div class="ds-value">{entry.fewestHints} 次</div>
                          <div class="ds-date">{formatDate(entry.fewestHintsDate)}</div>
                        </div>
                        <div class="detail-stat-card">
                          <div class="ds-icon">🔄</div>
                          <div class="ds-label">累计发现</div>
                          <div class="ds-value">{entry.totalTimesFound} 次</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {stateInfo().selectedAuthorId && (() => {
              const authorEntry = stateInfo().authorEntries[stateInfo().selectedAuthorId!];
              if (!authorEntry) return null;
              
              const author = getAuthorByBookId(authorEntry.booksRead[0]);
              if (!author) return null;

              return (
                <div class="author-detail">
                  <div class="detail-header author-header" style={{ '--portrait-color': author.portraitColor }}>
                    <div class="detail-portrait" style={{ background: author.portraitColor }}>
                      <span class="portrait-icon">{author.avatar}</span>
                    </div>
                    <div class="detail-author-info">
                      <div class="detail-title">
                        {author.name}
                        <button
                          class={`fav-btn large ${isAuthorFav(author.id) ? 'favorited' : ''}`}
                          onClick={() => toggleAuthorFav(author.id)}
                        >
                          {isAuthorFav(author.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div class="detail-author-meta">
                        <span>{author.nationality}</span>
                        <span>·</span>
                        <span>{author.era}</span>
                      </div>
                      <div class="detail-lifespan">
                        {author.birthYear < 0 ? `公元前${Math.abs(author.birthYear)}年` : `${author.birthYear}年`}
                        {author.deathYear && ` - ${author.deathYear < 0 ? `公元前${Math.abs(author.deathYear)}年` : `${author.deathYear}年`}`}
                      </div>
                    </div>
                  </div>

                  <div class="detail-bio">{author.biography}</div>
                  
                  <div class="detail-writing-style">
                    <div class="dws-label">✍️ 写作风格</div>
                    <div class="dws-content">{author.writingStyle}</div>
                  </div>

                  <div class="detail-quotes">
                    <div class="dq-label">💬 名言</div>
                    <div class="dq-list">
                      <For each={author.famousQuotes.slice(0, 3)}>
                        {(quote) => (
                          <div class="dq-item">
                            <span class="dq-quote">"{quote}"</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="detail-books">
                    <div class="db-label">📚 作品</div>
                    <div class="db-list">
                      <For each={author.bookIds}>
                        {(bookId) => {
                          const book = BOOKS.find(b => b.id === bookId);
                          const collected = !!stateInfo().collectionEntries[bookId];
                          return book ? (
                            <div
                              class={`db-item ${collected ? 'collected' : 'locked'}`}
                              onClick={() => collected && selectBook(bookId)}
                            >
                              <div class="db-spine" style={{ background: collected ? book.color : '#555' }} />
                              <div class="db-info">
                                <div class="db-title">{collected ? book.title : '???'}</div>
                                <div class="db-year">
                                  {book.year < 0 ? `公元前${Math.abs(book.year)}` : book.year}
                                </div>
                              </div>
                              {collected && <div class="db-check">✓</div>}
                            </div>
                          ) : null;
                        }}
                      </For>
                    </div>
                  </div>

                  <div class="detail-trivia">
                    <div class="dt-label">🎯 趣闻</div>
                    <div class="dt-list">
                      <For each={author.trivia.slice(0, 3)}>
                        {(trivia, idx) => (
                          <div class="dt-item">
                            <span class="dt-number">{idx() + 1}</span>
                            <span class="dt-text">{trivia}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              );
            })()}

            {stateInfo().selectedThemeId && (() => {
              const themeData = filteredThemes().find(t => t.theme.id === stateInfo().selectedThemeId);
              if (!themeData) return null;
              const { theme, progress } = themeData;

              return (
                <div class="theme-detail">
                  <div class="detail-header theme-header">
                    <div class="detail-theme-icon">{theme.icon}</div>
                    <div class="detail-theme-info">
                      <div class="detail-title">{theme.name}</div>
                      <div class="detail-author">{theme.description}</div>
                      <div class="detail-progress-info">
                        <span>进度: {progress}/{theme.bookIds.length}</span>
                        <span>·</span>
                        <span>需 {theme.requiredBooks} 本解锁奖励</span>
                        <span>·</span>
                        <span class={`difficulty-badge ${theme.difficulty}`}>
                          {theme.difficulty === 'easy' ? '简单' : theme.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-progress-large">
                    <div class="dpl-bar">
                      <div
                        class="dpl-fill"
                        style={{ width: `${(progress / theme.bookIds.length) * 100}%` }}
                      />
                    </div>
                    <div class="dpl-text">
                      {progress >= theme.requiredBooks 
                        ? `🎉 已完成！获得奖励: ${theme.reward.value}`
                        : `还需要找到 ${theme.requiredBooks - progress} 本书即可解锁奖励`}
                    </div>
                  </div>

                  <div class="detail-background-story">
                    <div class="dbs-label">📖 背景故事</div>
                    <div class="dbs-content">{theme.backgroundStory}</div>
                  </div>

                  <div class="detail-theme-books">
                    <div class="dtb-label">📚 包含书籍</div>
                    <div class="dtb-list">
                      <For each={theme.bookIds}>
                        {(bookId) => {
                          const book = BOOKS.find(b => b.id === bookId);
                          const collected = !!stateInfo().collectionEntries[bookId];
                          return book ? (
                            <div
                              class={`dtb-item ${collected ? 'collected' : 'locked'}`}
                              onClick={() => collected && selectBook(bookId)}
                            >
                              <div class="dtb-spine" style={{ background: collected ? book.color : '#555' }} />
                              <div class="dtb-info">
                                <div class="dtb-title">{collected ? book.title : '???'}</div>
                                <div class="dtb-author">{collected ? book.author : '未发现'}</div>
                              </div>
                              {collected ? (
                                <div class="dtb-status collected">✓</div>
                              ) : (
                                <div class="dtb-status locked">🔒</div>
                              )}
                            </div>
                          ) : null;
                        }}
                      </For>
                    </div>
                  </div>
                </div>
              );
            })()}

            {stateInfo().selectedEasterEggId && (() => {
              const eggData = filteredEasterEggs().find(e => e.egg.id === stateInfo().selectedEasterEggId);
              if (!eggData || !eggData.found) return null;
              const { egg } = eggData;

              return (
                <div class="easter-egg-detail">
                  <div class="detail-header easter-egg-header">
                    <div class="detail-easter-icon">{egg.icon}</div>
                    <div class="detail-easter-info">
                      <div class="detail-title">{egg.name}</div>
                      <div class="detail-author">{egg.description}</div>
                      <div class="detail-easter-meta">
                        <span class={`category-badge ${egg.category}`}>
                          {egg.category === 'literary_reference' ? '文学典故' :
                           egg.category === 'pop_culture' ? '流行文化' :
                           egg.category === 'developer_joke' ? '程序员梗' :
                           egg.category === 'historical_fact' ? '历史趣闻' : '隐藏故事'}
                        </span>
                        <span>·</span>
                        <span>🎁 {egg.reward.type === 'score' ? `+${egg.reward.value}分` : egg.reward.value}</span>
                      </div>
                    </div>
                  </div>

                  <div class="easter-egg-content">
                    <div class="eec-label">🔍 彩蛋内容</div>
                    <div class="eec-text">{egg.content}</div>
                  </div>

                  <div class="easter-egg-hint">
                    <div class="eeh-label">💡 解锁提示</div>
                    <div class="eeh-text">{egg.hint}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
