import { createSignal, createMemo, For } from 'solid-js';
import type { CollectionCategory } from '../types/game';
import { BOOKS } from '../data/books';
import { getAllCollectionEntries, getUnlockedCollectionCount } from '../utils/storage';
import { RARITY_CONFIG } from '../data/themes';
import { ACHIEVEMENTS } from '../data/achievements';
import { collectionCount } from '../store/gameStore';

interface BookCollectionProps {
  onClose: () => void;
}

const CATEGORIES: { key: CollectionCategory; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📚' },
  { key: '文学', label: '文学', icon: '📖' },
  { key: '古典', label: '古典', icon: '📜' },
  { key: '科普', label: '科普', icon: '🔬' },
  { key: '技术', label: '技术', icon: '💻' },
  { key: '历史', label: '历史', icon: '🏛️' },
  { key: '哲学', label: '哲学', icon: '🤔' },
  { key: '科幻', label: '科幻', icon: '🚀' },
  { key: '散文', label: '散文', icon: '🌿' },
  { key: '童话', label: '童话', icon: '⭐' },
];

export default function BookCollection(props: BookCollectionProps) {
  const [activeCategory, setActiveCategory] = createSignal<CollectionCategory>('all');
  const [selectedBookId, setSelectedBookId] = createSignal<string | null>(null);

  const allEntries = createMemo(() => {
    collectionCount();
    return getAllCollectionEntries();
  });

  const totalBooks = BOOKS.length;
  const unlockedCount = createMemo(() => getUnlockedCollectionCount());

  const filteredBooks = createMemo(() => {
    const cat = activeCategory();
    const entries = allEntries();
    return BOOKS.filter(b => cat === 'all' || b.genre === cat).map(b => ({
      book: b,
      entry: entries[b.id] || null,
      collected: !!entries[b.id],
    }));
  });

  const categoryStats = createMemo(() => {
    const entries = allEntries();
    const stats: Record<string, { total: number; collected: number }> = {};
    for (const b of BOOKS) {
      if (!stats[b.genre]) stats[b.genre] = { total: 0, collected: 0 };
      stats[b.genre].total++;
      if (entries[b.id]) stats[b.genre].collected++;
    }
    return stats;
  });

  const selectedBook = createMemo(() => {
    const id = selectedBookId();
    if (!id) return null;
    const book = BOOKS.find(b => b.id === id);
    if (!book) return null;
    const entry = allEntries()[id] || null;
    return { book, entry };
  });

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getAchievementTitle = (id: string): string => {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    return ach ? `${ach.icon} ${ach.title}` : id;
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content collection-modal" onClick={(e) => e.stopPropagation()}>
        <div class="collection-header">
          <div class="collection-title">📖 收藏册</div>
          <div class="collection-progress">
            <span class="collection-progress-text">{unlockedCount()}/{totalBooks} 已收录</span>
            <div class="collection-progress-bar">
              <div
                class="collection-progress-fill"
                style={{ width: `${totalBooks > 0 ? (unlockedCount() / totalBooks) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div class="collection-categories">
          <For each={CATEGORIES}>
            {(cat) => {
              const stats = createMemo(() => {
                if (cat.key === 'all') return { total: totalBooks, collected: unlockedCount() };
                return categoryStats()[cat.key] || { total: 0, collected: 0 };
              });
              return (
                <button
                  class={`collection-cat-btn ${activeCategory() === cat.key ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(cat.key); setSelectedBookId(null); }}
                >
                  <span class="cat-icon">{cat.icon}</span>
                  <span class="cat-label">{cat.label}</span>
                  <span class="cat-count">{stats().collected}/{stats().total}</span>
                </button>
              );
            }}
          </For>
        </div>

        {!selectedBook() ? (
          <div class="collection-grid">
            <For each={filteredBooks()}>
              {(item) => (
                <div
                  class={`collection-card ${item.collected ? 'collected' : 'locked'}`}
                  onClick={() => item.collected && setSelectedBookId(item.book.id)}
                  style={item.collected ? { '--book-color': item.book.color } : {}}
                >
                  <div class="collection-card-spine" style={{ background: item.collected ? item.book.color : '#555' }}>
                    <span class="spine-text">{item.collected ? item.book.title.slice(0, 2) : '?'}</span>
                  </div>
                  <div class="collection-card-info">
                    <div class="collection-card-title">
                      {item.collected ? item.book.title : '???'}
                    </div>
                    <div class="collection-card-author">
                      {item.collected ? item.book.author : '未发现'}
                    </div>
                    <div class="collection-card-meta">
                      <span class="collection-card-genre">{item.book.genre}</span>
                      <span
                        class="collection-card-rarity"
                        style={{ color: item.collected ? RARITY_CONFIG[item.book.rarity].color : '#888' }}
                      >
                        {item.collected ? RARITY_CONFIG[item.book.rarity].icon : '🔒'} {item.collected ? RARITY_CONFIG[item.book.rarity].name : '未解锁'}
                      </span>
                    </div>
                    {item.collected && item.entry && (
                      <div class="collection-card-stats">
                        <span class="cc-stat">🏆 {item.entry.bestScore}分</span>
                        <span class="cc-stat">⏱️ {item.entry.fastestFind.toFixed(1)}s</span>
                        <span class="cc-stat">×{item.entry.totalTimesFound}</span>
                      </div>
                    )}
                  </div>
                  {item.collected && (
                    <div class="collection-card-badge">✓</div>
                  )}
                </div>
              )}
            </For>
          </div>
        ) : (
          <div class="collection-detail">
            <button class="collection-detail-back" onClick={() => setSelectedBookId(null)}>
              ← 返回列表
            </button>
            <div class="collection-detail-header" style={{ '--book-color': selectedBook()!.book.color }}>
              <div class="detail-spine" style={{ background: selectedBook()!.book.color }}>
                <span class="detail-spine-text">{selectedBook()!.book.title}</span>
              </div>
              <div class="detail-book-info">
                <div class="detail-title">{selectedBook()!.book.title}</div>
                <div class="detail-author">{selectedBook()!.book.author}</div>
                <div class="detail-meta">
                  <span class="detail-genre">{selectedBook()!.book.genre}</span>
                  <span class="detail-year">
                    {selectedBook()!.book.year < 0
                      ? `公元前${Math.abs(selectedBook()!.book.year)}年`
                      : `${selectedBook()!.book.year}年`}
                  </span>
                  <span
                    class="detail-rarity"
                    style={{ color: RARITY_CONFIG[selectedBook()!.book.rarity].color }}
                  >
                    {RARITY_CONFIG[selectedBook()!.book.rarity].icon} {RARITY_CONFIG[selectedBook()!.book.rarity].name}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-description">{selectedBook()!.book.description}</div>
            <div class="detail-story">{selectedBook()!.book.backgroundStory}</div>

            <div class="detail-themes">
              <For each={selectedBook()!.book.themes}>
                {(theme) => <span class="detail-theme-tag">{theme}</span>}
              </For>
            </div>

            {selectedBook()!.entry && (
              <div class="detail-stats-section">
                <div class="detail-stats-title">📊 收藏记录</div>
                <div class="detail-stats-grid">
                  <div class="detail-stat-card">
                    <div class="ds-icon">📅</div>
                    <div class="ds-label">首次发现</div>
                    <div class="ds-value">{formatDate(selectedBook()!.entry.firstFoundAt)}</div>
                  </div>
                  <div class="detail-stat-card highlight">
                    <div class="ds-icon">🏆</div>
                    <div class="ds-label">最佳成绩</div>
                    <div class="ds-value">{selectedBook()!.entry.bestScore} 分</div>
                    <div class="ds-date">{formatDate(selectedBook()!.entry.bestScoreDate)}</div>
                  </div>
                  <div class="detail-stat-card">
                    <div class="ds-icon">⚡</div>
                    <div class="ds-label">最快找到</div>
                    <div class="ds-value">{selectedBook()!.entry.fastestFind.toFixed(1)} 秒</div>
                    <div class="ds-date">{formatDate(selectedBook()!.entry.fastestFindDate)}</div>
                  </div>
                  <div class="detail-stat-card">
                    <div class="ds-icon">💡</div>
                    <div class="ds-label">最少提示</div>
                    <div class="ds-value">{selectedBook()!.entry.fewestHints} 次</div>
                    <div class="ds-date">{formatDate(selectedBook()!.entry.fewestHintsDate)}</div>
                  </div>
                  <div class="detail-stat-card">
                    <div class="ds-icon">🔄</div>
                    <div class="ds-label">累计发现</div>
                    <div class="ds-value">{selectedBook()!.entry.totalTimesFound} 次</div>
                  </div>
                </div>

                {selectedBook()!.entry.relatedAchievements.length > 0 && (
                  <div class="detail-achievements">
                    <div class="da-title">🎖️ 相关成就</div>
                    <div class="da-list">
                      <For each={selectedBook()!.entry.relatedAchievements}>
                        {(achId) => (
                          <span class="da-tag">{getAchievementTitle(achId)}</span>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
