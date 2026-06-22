import { createSignal, createMemo, For } from 'solid-js';
import type { BooklistTab, EraRange } from '../types/booklist';
import type { DifficultyLevel, RarityLevel } from '../types/game';
import {
  getBooklistCenterState,
  setBooklistTab,
  closeBooklistCenter,
  selectBooklist,
  getSelectedBooklist,
  getSelectedBooklistBooks,
  getSelectedProgress,
  getSelectedChallenges,
  getSelectedLeaderboard,
  getAllAvailableBooklists,
  getCustomBooklistsList,
  getFilteredBooks,
  getGenresList,
  getAuthorsList,
  getThemesList,
  addAuthorFilter,
  removeAuthorFilter,
  addGenreFilter,
  removeGenreFilter,
  addKeywordFilter,
  removeKeywordFilter,
  addRarityFilter,
  removeRarityFilter,
  addThemeFilter,
  removeThemeFilter,
  updateFilter,
  resetFilter,
  setEditorNameValue,
  setEditorDescriptionValue,
  setEditorIconValue,
  setEditorColorValue,
  setEditorDifficultyValue,
  generatePreview,
  saveCurrentBooklist,
  removeCustomBooklist,
  regenerateSelectedBooklist,
  startBooklistChallenge,
  getCustomCount,
} from '../store/booklistStore';
import { getBooklistProgress } from '../utils/booklistStorage';
import { RARITY_CONFIG } from '../data/themes';
import { ERA_LABELS } from '../types/booklist';

interface BooklistEditorProps {
  onClose: () => void;
  onStartChallenge?: (booklistId: string) => void;
}

const TABS: { key: BooklistTab; label: string; icon: string; description: string }[] = [
  { key: 'browse', label: '浏览书单', icon: '📚', description: '浏览预设书单' },
  { key: 'create', label: '创建书单', icon: '✏️', description: '自定义筛选生成书单' },
  { key: 'my_lists', label: '我的书单', icon: '📋', description: '管理自定义书单' },
  { key: 'ranking', label: '书单排行', icon: '🏆', description: '查看书单排行榜' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; icon: string; color: string }[] = [
  { value: 'easy', label: '简单', icon: '🌱', color: '#10B981' },
  { value: 'normal', label: '普通', icon: '⭐', color: '#3B82F6' },
  { value: 'hard', label: '困难', icon: '🔥', color: '#F59E0B' },
  { value: 'expert', label: '专家', icon: '💎', color: '#EF4444' },
  { value: 'master', label: '大师', icon: '👑', color: '#8B5CF6' },
];

const ICON_OPTIONS = ['📚', '📖', '📕', '📗', '📘', '📙', '🎯', '🏆', '⭐', '💎', '🔥', '🌙', '☀️', '🌈', '🎨', '🎵'];

const COLOR_OPTIONS = ['#B8860B', '#CD853F', '#8B4513', '#A0522D', '#5C4033', '#4169E1', '#2E8B57', '#6A5ACD', '#EF5350', '#42A5F5', '#66BB6A', '#FF7043', '#26A69A', '#EC407A'];

const RARITY_OPTIONS: { value: RarityLevel; label: string }[] = [
  { value: 'common', label: '普通' },
  { value: 'uncommon', label: '精良' },
  { value: 'rare', label: '稀有' },
  { value: 'epic', label: '史诗' },
  { value: 'legendary', label: '传说' },
];

export default function BooklistEditor(props: BooklistEditorProps) {
  const state = createMemo(() => getBooklistCenterState());
  const selected = createMemo(() => getSelectedBooklist());
  const selectedBooks = createMemo(() => getSelectedBooklistBooks());
  const selectedProgress = createMemo(() => getSelectedProgress());
  const selectedChallenges = createMemo(() => getSelectedChallenges());
  const allBooklists = createMemo(() => getAllAvailableBooklists());
  const customBooklists = createMemo(() => getCustomBooklistsList());
  const filteredBooks = createMemo(() => getFilteredBooks());
  const genres = createMemo(() => getGenresList());
  const authors = createMemo(() => getAuthorsList());
  const themes = createMemo(() => getThemesList());
  const customCount = createMemo(() => getCustomCount());

  const [keywordInput, setKeywordInput] = createSignal('');
  const [showSuccess, setShowSuccess] = createSignal(false);
  const [rankingBooklistId, setRankingBooklistId] = createSignal<string | null>(null);

  const handleClose = () => {
    closeBooklistCenter();
    props.onClose();
  };

  const handleStartChallenge = (booklistId: string) => {
    startBooklistChallenge(booklistId);
    if (props.onStartChallenge) {
      props.onStartChallenge(booklistId);
    }
    handleClose();
  };

  const handleAddKeyword = () => {
    const kw = keywordInput().trim();
    if (kw) {
      addKeywordFilter(kw);
      setKeywordInput('');
    }
  };

  const handleKeywordKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword();
    }
  };

  const handleGenerateAndSave = () => {
    generatePreview();
    const saved = saveCurrentBooklist();
    if (saved) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '-';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m${Math.floor(seconds % 60)}s`;
  };

  const getRankClass = (index: number): string => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  };

  const currentFilter = createMemo(() => state().currentFilter);

  const rankingBooklist = createMemo(() => {
    const id = rankingBooklistId();
    if (!id) return null;
    return allBooklists().find(b => b.id === id) || null;
  });

  const rankingData = createMemo(() => {
    const id = rankingBooklistId();
    if (!id) return [];
    return getSelectedLeaderboard();
  });

  return (
    <div class="modal-overlay" onClick={handleClose}>
      <div class="modal-content booklist-modal" onClick={(e) => e.stopPropagation()}>
        <div class="booklist-header">
          <div class="booklist-header-left">
            <span class="booklist-header-icon">📚</span>
            <div>
              <h2 class="booklist-header-title">书单编辑中心</h2>
              <p class="booklist-header-subtitle">按作者、年代、类别和关键词组合生成专属挑战书单</p>
            </div>
          </div>
          <div class="booklist-header-stats">
            <span class="booklist-stat">📚 共 {allBooklists().length} 个书单</span>
            <span class="booklist-stat">✏️ 自定义 {customCount()} 个</span>
          </div>
          <button class="modal-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div class="tabs booklist-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`tab-button ${state().activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setBooklistTab(tab.key)}
                title={tab.description}
              >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label}</span>
              </button>
            )}
          </For>
        </div>

        <div class="booklist-content">
          {state().activeTab === 'browse' && (
            <div class="booklist-browse">
              <div class="booklist-browse-intro">
                <h3>🎯 选择一个书单开始挑战</h3>
                <p>精选预设书单，涵盖文学、历史、哲学、技术等多个领域</p>
              </div>
              <div class="booklist-grid">
                <For each={allBooklists()}>
                  {(booklist) => (
                    <div
                      class={`booklist-card ${booklist.isCustom ? 'custom' : 'preset'}`}
                      style={{ '--bl-color': booklist.color }}
                      onClick={() => selectBooklist(booklist.id)}
                    >
                      <div class="bl-card-icon" style={{ background: booklist.color }}>
                        <span>{booklist.icon}</span>
                      </div>
                      <div class="bl-card-info">
                        <div class="bl-card-title">{booklist.name}</div>
                        <div class="bl-card-type">
                          {booklist.isCustom ? '✨ 自定义' : '📖 预设'}
                        </div>
                        <div class="bl-card-meta">
                          <span>📚 {booklist.bookIds.length} 本</span>
                          <span>🎯 {booklist.targetBooks} 目标</span>
                        </div>
                        <div class="bl-card-reward">
                          <span>🪙 {booklist.rewardCoins}</span>
                          <span>⭐ {booklist.rewardReputation}</span>
                        </div>
                      </div>
                      <button
                        class="bl-card-start-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChallenge(booklist.id);
                        }}
                      >
                        开始挑战
                      </button>
                    </div>
                  )}
                </For>
              </div>

              {selected() && (
                <div class="booklist-detail-panel">
                  <div class="bl-detail-header">
                    <div class="bl-detail-icon" style={{ background: selected()!.color }}>
                      {selected()!.icon}
                    </div>
                    <div class="bl-detail-info">
                      <h3>{selected()!.name}</h3>
                      <p>{selected()!.description}</p>
                    </div>
                    <button class="bl-close-detail" onClick={() => selectBooklist(null)}>✕</button>
                  </div>
                  
                  <div class="bl-detail-stats">
                    <div class="bl-stat">
                      <div class="bl-stat-icon">📚</div>
                      <div class="bl-stat-value">{selected()!.bookIds.length}</div>
                      <div class="bl-stat-label">书籍总数</div>
                    </div>
                    <div class="bl-stat">
                      <div class="bl-stat-icon">🎯</div>
                      <div class="bl-stat-value">{selected()!.targetBooks}</div>
                      <div class="bl-stat-label">目标书籍</div>
                    </div>
                    <div class="bl-stat">
                      <div class="bl-stat-icon">🏆</div>
                      <div class="bl-stat-value">{selectedProgress()?.bestScore || 0}</div>
                      <div class="bl-stat-label">最高分</div>
                    </div>
                    <div class="bl-stat">
                      <div class="bl-stat-icon">✅</div>
                      <div class="bl-stat-value">{selectedProgress()?.completions || 0}</div>
                      <div class="bl-stat-label">完成次数</div>
                    </div>
                  </div>

                  <div class="bl-detail-section">
                    <div class="bl-section-title">📖 书单包含书籍</div>
                    <div class="bl-books-list">
                      <For each={selectedBooks()}>
                        {(book, index) => (
                          <div class="bl-book-item">
                            <span class="bl-book-index">{index() + 1}</span>
                            <div class="bl-book-cover" style={{ background: book.color }}></div>
                            <div class="bl-book-info">
                              <div class="bl-book-title">{book.title}</div>
                              <div class="bl-book-author">{book.author} · {book.genre}</div>
                            </div>
                            <div
                              class="bl-book-rarity"
                              style={{ color: RARITY_CONFIG[book.rarity].color }}
                            >
                              {RARITY_CONFIG[book.rarity].icon}
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="bl-detail-section">
                    <div class="bl-section-title">⚔️ 挑战任务</div>
                    <div class="bl-challenges-grid">
                      <For each={selectedChallenges()}>
                        {(challenge) => (
                          <div class={`bl-challenge-card ${challenge.completed ? 'completed' : ''}`}>
                            <div class="bl-challenge-icon">{challenge.icon}</div>
                            <div class="bl-challenge-info">
                              <div class="bl-challenge-title">{challenge.title}</div>
                              <div class="bl-challenge-desc">{challenge.description}</div>
                            </div>
                            <div class="bl-challenge-reward">
                              <span>🪙 {challenge.rewardCoins}</span>
                              <span>⭐ {challenge.rewardReputation}</span>
                            </div>
                            {challenge.completed && <div class="bl-challenge-check">✓</div>}
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="bl-detail-actions">
                    <button
                      class="modal-button primary"
                      onClick={() => handleStartChallenge(selected()!.id)}
                    >
                      🎮 开始挑战
                    </button>
                    {selected()!.isCustom && (
                      <>
                        <button
                          class="modal-button secondary"
                          onClick={() => regenerateSelectedBooklist()}
                        >
                          🔄 重新生成
                        </button>
                        <button
                          class="modal-button danger"
                          onClick={() => {
                            if (confirm('确定要删除这个书单吗？')) {
                              removeCustomBooklist(selected()!.id);
                            }
                          }}
                        >
                          🗑️ 删除书单
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {state().activeTab === 'create' && (
            <div class="booklist-create">
              <div class="booklist-create-intro">
                <h3>✏️ 创建自定义书单</h3>
                <p>设置筛选条件，生成专属于你的挑战书单</p>
              </div>

              <div class="create-layout">
                <div class="create-filters">
                  <div class="filter-section">
                    <div class="filter-title">📝 基本信息</div>
                    <div class="filter-field">
                      <label>书单名称</label>
                      <input
                        type="text"
                        class="input-field"
                        placeholder="输入书单名称"
                        value={state().editorName}
                        onInput={(e) => setEditorNameValue(e.currentTarget.value)}
                        maxlength={20}
                      />
                    </div>
                    <div class="filter-field">
                      <label>书单描述</label>
                      <textarea
                        class="textarea-field"
                        placeholder="输入书单描述"
                        value={state().editorDescription}
                        onInput={(e) => setEditorDescriptionValue(e.currentTarget.value)}
                        rows={2}
                        maxlength={100}
                      />
                    </div>
                    <div class="filter-field">
                      <label>图标</label>
                      <div class="icon-picker">
                        <For each={ICON_OPTIONS}>
                          {(icon) => (
                            <button
                              class={`icon-option ${state().editorIcon === icon ? 'selected' : ''}`}
                              onClick={() => setEditorIconValue(icon)}
                            >
                              {icon}
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                    <div class="filter-field">
                      <label>主题色</label>
                      <div class="color-picker">
                        <For each={COLOR_OPTIONS}>
                          {(color) => (
                            <button
                              class={`color-option ${state().editorColor === color ? 'selected' : ''}`}
                              style={{ background: color }}
                              onClick={() => setEditorColorValue(color)}
                            />
                          )}
                        </For>
                      </div>
                    </div>
                    <div class="filter-field">
                      <label>难度</label>
                      <div class="difficulty-picker">
                        <For each={DIFFICULTY_OPTIONS}>
                          {(diff) => (
                            <button
                              class={`diff-option ${state().editorDifficulty === diff.value ? 'selected' : ''}`}
                              style={{ '--diff-color': diff.color }}
                              onClick={() => setEditorDifficultyValue(diff.value)}
                            >
                              <span class="diff-icon">{diff.icon}</span>
                              <span class="diff-label">{diff.label}</span>
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  </div>

                  <div class="filter-section">
                    <div class="filter-title">📚 按分类筛选</div>
                    <div class="filter-tags">
                      <For each={genres()}>
                        {(genre) => (
                          <button
                            class={`filter-tag ${currentFilter().genres.includes(genre) ? 'active' : ''}`}
                            onClick={() => {
                              if (currentFilter().genres.includes(genre)) {
                                removeGenreFilter(genre);
                              } else {
                                addGenreFilter(genre);
                              }
                            }}
                          >
                            {genre}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="filter-section">
                    <div class="filter-title">✍️ 按作者筛选</div>
                    <div class="filter-selected">
                      <For each={currentFilter().authors}>
                        {(author) => (
                          <span class="selected-tag">
                            {author}
                            <button onClick={() => removeAuthorFilter(author)}>✕</button>
                          </span>
                        )}
                      </For>
                    </div>
                    <select
                      class="select-field"
                      onChange={(e) => {
                        addAuthorFilter(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }}
                    >
                      <option value="">选择作者...</option>
                      <For each={authors()}>
                        {(author) => (
                          <option value={author} disabled={currentFilter().authors.includes(author)}>
                            {author}
                          </option>
                        )}
                      </For>
                    </select>
                  </div>

                  <div class="filter-section">
                    <div class="filter-title">🕰️ 按年代筛选</div>
                    <div class="filter-tags">
                      <For each={Object.entries(ERA_LABELS)}>
                        {([era, label]) => (
                          <button
                            class={`filter-tag ${currentFilter().era === era ? 'active' : ''}`}
                            onClick={() => {
                              updateFilter({ era: currentFilter().era === era ? null : (era as EraRange) });
                            }}
                          >
                            {label}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="filter-section">
                    <div class="filter-title">🏆 按稀有度筛选</div>
                    <div class="filter-tags">
                      <For each={RARITY_OPTIONS}>
                        {(rarity) => (
                          <button
                            class={`filter-tag rarity-tag ${currentFilter().rarities.includes(rarity.value) ? 'active' : ''}`}
                            style={{ '--rarity-color': RARITY_CONFIG[rarity.value].color }}
                            onClick={() => {
                              if (currentFilter().rarities.includes(rarity.value)) {
                                removeRarityFilter(rarity.value);
                              } else {
                                addRarityFilter(rarity.value);
                              }
                            }}
                          >
                            {RARITY_CONFIG[rarity.value].icon} {rarity.label}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="filter-section">
                    <div class="filter-title">🎯 按主题筛选</div>
                    <div class="filter-tags theme-tags">
                      <For each={themes()}>
                        {(theme) => (
                          <button
                            class={`filter-tag ${currentFilter().themes.includes(theme) ? 'active' : ''}`}
                            onClick={() => {
                              if (currentFilter().themes.includes(theme)) {
                                removeThemeFilter(theme);
                              } else {
                                addThemeFilter(theme);
                              }
                            }}
                          >
                            {theme}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="filter-section">
                    <div class="filter-title">🔍 关键词搜索</div>
                    <div class="keyword-input-row">
                      <input
                        type="text"
                        class="input-field"
                        placeholder="输入关键词后按回车添加"
                        value={keywordInput()}
                        onInput={(e) => setKeywordInput(e.currentTarget.value)}
                        onKeyPress={handleKeywordKeyPress}
                      />
                      <button class="modal-button small" onClick={handleAddKeyword}>添加</button>
                    </div>
                    <div class="filter-selected">
                      <For each={currentFilter().keywords}>
                        {(kw) => (
                          <span class="selected-tag keyword-tag">
                            🔍 {kw}
                            <button onClick={() => removeKeywordFilter(kw)}>✕</button>
                          </span>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class="filter-actions">
                    <button class="modal-button secondary" onClick={resetFilter}>
                      🔄 重置筛选
                    </button>
                    <button class="modal-button primary" onClick={handleGenerateAndSave}>
                      ✨ 生成并保存书单
                    </button>
                  </div>

                  {showSuccess() && (
                    <div class="success-message">
                      ✓ 书单创建成功！可在"我的书单"中查看
                    </div>
                  )}
                </div>

                <div class="create-preview">
                  <div class="preview-header">
                    <span>👁️ 预览</span>
                    <span class="preview-count">
                      共 {filteredBooks().length} 本符合条件
                    </span>
                  </div>
                  <div class="preview-books-list">
                    <For each={filteredBooks().slice(0, 20)}>
                      {(book) => (
                        <div class="preview-book-item">
                          <div class="preview-book-cover" style={{ background: book.color }}></div>
                          <div class="preview-book-info">
                            <div class="preview-book-title">{book.title}</div>
                            <div class="preview-book-meta">
                              {book.author} · {book.genre}
                              <span
                                class="preview-rarity"
                                style={{ color: RARITY_CONFIG[book.rarity].color }}
                              >
                                {RARITY_CONFIG[book.rarity].icon}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                    {filteredBooks().length > 20 && (
                      <div class="preview-more">
                        ...还有 {filteredBooks().length - 20} 本
                      </div>
                    )}
                    {filteredBooks().length === 0 && (
                      <div class="preview-empty">没有符合条件的书籍</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {state().activeTab === 'my_lists' && (
            <div class="booklist-my-lists">
              <div class="booklist-my-intro">
                <h3>📋 我的自定义书单</h3>
                <p>管理你创建的所有自定义书单</p>
              </div>

              {customBooklists().length === 0 ? (
                <div class="empty-state">
                  <div class="empty-icon">📝</div>
                  <div class="empty-title">还没有自定义书单</div>
                  <div class="empty-desc">去"创建书单"页面生成你的第一个专属书单吧！</div>
                  <button
                    class="modal-button primary"
                    onClick={() => setBooklistTab('create')}
                  >
                    去创建书单
                  </button>
                </div>
              ) : (
                <div class="my-booklists-grid">
                  <For each={customBooklists()}>
                    {(booklist) => (
                      <div
                        class="my-booklist-card"
                        style={{ '--mbl-color': booklist.color }}
                      >
                        <div class="mbl-header">
                          <div class="mbl-icon" style={{ background: booklist.color }}>
                            {booklist.icon}
                          </div>
                          <div class="mbl-info">
                            <div class="mbl-name">{booklist.name}</div>
                            <div class="mbl-date">创建于 {formatDate(booklist.createdAt)}</div>
                          </div>
                        </div>
                        <div class="mbl-stats">
                          <span>📚 {booklist.bookIds.length} 本</span>
                          <span>🏆 {getBooklistProgress(booklist.id)?.bestScore || 0} 最高分</span>
                          <span>✅ {getBooklistProgress(booklist.id)?.completions || 0} 次完成</span>
                        </div>
                        <div class="mbl-actions">
                          <button
                            class="modal-button small primary"
                            onClick={() => handleStartChallenge(booklist.id)}
                          >
                            开始挑战
                          </button>
                          <button
                            class="modal-button small secondary"
                            onClick={() => regenerateSelectedBooklist()}
                          >
                            重新生成
                          </button>
                          <button
                            class="modal-button small danger"
                            onClick={() => {
                              if (confirm('确定要删除这个书单吗？')) {
                                removeCustomBooklist(booklist.id);
                              }
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </div>
          )}

          {state().activeTab === 'ranking' && (
            <div class="booklist-ranking">
              <div class="booklist-ranking-intro">
                <h3>🏆 书单排行榜</h3>
                <p>查看各个书单的最高分排行</p>
              </div>

              <div class="ranking-layout">
                <div class="ranking-booklist-list">
                  <div class="rbl-title">选择书单</div>
                  <For each={allBooklists()}>
                    {(booklist) => (
                      <div
                        class={`rbl-item ${rankingBooklistId() === booklist.id ? 'active' : ''}`}
                        onClick={() => {
                          setRankingBooklistId(booklist.id);
                          selectBooklist(booklist.id);
                        }}
                      >
                        <div class="rbl-icon" style={{ background: booklist.color }}>
                          {booklist.icon}
                        </div>
                        <div class="rbl-info">
                          <div class="rbl-name">{booklist.name}</div>
                          <div class="rbl-count">{booklist.bookIds.length} 本书</div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                <div class="ranking-detail">
                  {rankingBooklist() ? (
                    <>
                      <div class="ranking-detail-header">
                        <div class="rdh-icon" style={{ background: rankingBooklist()!.color }}>
                          {rankingBooklist()!.icon}
                        </div>
                        <div class="rdh-info">
                          <div class="rdh-name">{rankingBooklist()!.name}</div>
                          <div class="rdh-desc">{rankingBooklist()!.description}</div>
                        </div>
                      </div>

                      <div class="ranking-list">
                        <For each={rankingData()}>
                          {(entry, index) => (
                            <div class="ranking-item">
                              <span class={`ranking-rank ${getRankClass(index())}`}>
                                #{index() + 1}
                              </span>
                              <span class="ranking-name">{entry.playerName}</span>
                              <span class="ranking-meta">
                                {entry.booksFound}/{rankingBooklist()!.targetBooks}本
                              </span>
                              <span class="ranking-time">{formatTime(entry.timeUsed)}</span>
                              <span class="ranking-score">{entry.score} 分</span>
                            </div>
                          )}
                        </For>
                        {rankingData().length === 0 && (
                          <div class="ranking-empty">暂无排行记录，快来挑战吧！</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div class="ranking-placeholder">
                      <div class="rp-icon">🏆</div>
                      <div class="rp-text">从左侧选择一个书单查看排行榜</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
