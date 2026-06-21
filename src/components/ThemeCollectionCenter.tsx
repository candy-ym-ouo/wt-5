import { createSignal, createMemo, For } from 'solid-js';
import type { ThemeCollectionTab, ThemeCollection, ThemeCollectionChallenge } from '../types/game';
import { THEME_COLLECTIONS, getThemeCollectionById, getChallengesForCollection, THEME_COLLECTION_CHALLENGES } from '../data/themeCollections';
import { BOOKS } from '../data/books';
import { RARITY_CONFIG } from '../data/themes';
import {
  getAllThemeCollectionProgress,
  getThemeCollectionProgress,
  getCompletedThemeCollectionsCount,
  getUnlockedThemeCollectionChallenges,
  getThemeCollectionRanking,
  getTotalThemeCollectionsCollected,
  getAllCollectionEntries,
} from '../utils/storage';

interface ThemeCollectionCenterProps {
  onClose: () => void;
  onStartChallenge?: (collectionId: string) => void;
}

const TABS: { key: ThemeCollectionTab; label: string; icon: string }[] = [
  { key: 'overview', label: '总览', icon: '🏠' },
  { key: 'challenge', label: '专题挑战', icon: '⚔️' },
  { key: 'codex', label: '专题图鉴', icon: '📖' },
  { key: 'ranking', label: '专题排行', icon: '🏆' },
];

const DIFFICULTY_CONFIG: Record<ThemeCollection['difficulty'], { label: string; color: string; icon: string }> = {
  easy: { label: '入门', color: '#10B981', icon: '🌱' },
  normal: { label: '普通', color: '#3B82F6', icon: '⭐' },
  hard: { label: '困难', color: '#F59E0B', icon: '🔥' },
  expert: { label: '专家', color: '#EF4444', icon: '💎' },
};

const CHALLENGE_TYPE_CONFIG: Record<ThemeCollectionChallenge['type'], { label: string; unit: string }> = {
  speed: { label: '限时挑战', unit: '秒内完成' },
  accuracy: { label: '零失误', unit: '次失误' },
  no_hint: { label: '无提示', unit: '次提示' },
  streak: { label: '连胜', unit: '连胜' },
  score: { label: '高分挑战', unit: '分' },
};

export default function ThemeCollectionCenter(props: ThemeCollectionCenterProps) {
  const [activeTab, setActiveTab] = createSignal<ThemeCollectionTab>('overview');
  const [selectedCollectionId, setSelectedCollectionId] = createSignal<string | null>(null);

  const allProgress = createMemo(() => getAllThemeCollectionProgress());
  const allCollected = createMemo(() => getAllCollectionEntries());
  const unlockedChallenges = createMemo(() => new Set(getUnlockedThemeCollectionChallenges()));

  const totalCollections = THEME_COLLECTIONS.length;
  const completedCollections = createMemo(() => getCompletedThemeCollectionsCount());
  const totalBooksCollected = createMemo(() => getTotalThemeCollectionsCollected());

  const selectedCollection = createMemo(() => {
    const id = selectedCollectionId();
    return id ? getThemeCollectionById(id) : null;
  });

  const selectedProgress = createMemo(() => {
    const id = selectedCollectionId();
    return id ? getThemeCollectionProgress(id) : null;
  });

  const selectedChallenges = createMemo(() => {
    const id = selectedCollectionId();
    return id ? getChallengesForCollection(id) : [];
  });

  const selectedRanking = createMemo(() => {
    const id = selectedCollectionId();
    return id ? getThemeCollectionRanking(id).slice(0, 10) : [];
  });

  const getCollectionStats = (collection: ThemeCollection) => {
    const progress = allProgress()[collection.id];
    const collected = progress?.collectedBookIds.length || 0;
    const percent = collection.bookIds.length > 0 ? (collected / collection.bookIds.length) * 100 : 0;
    const isCompleted = collected >= collection.requiredBooks;
    return { collected, percent, isCompleted, progress };
  };

  const isBookCollected = (bookId: string) => !!allCollected()[bookId];

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content tc-modal" onClick={(e) => e.stopPropagation()}>
        <div class="tc-header">
          <div class="tc-title">📚 主题馆藏</div>
          <div class="tc-stats-bar">
            <span class="tc-stat">✅ 完成 {completedCollections()}/{totalCollections}</span>
            <span class="tc-stat">📖 藏书 {totalBooksCollected()}</span>
            <span class="tc-stat">⚔️ 挑战 {unlockedChallenges().size}/{THEME_COLLECTION_CHALLENGES.length}</span>
          </div>
        </div>

        <div class="tc-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`tc-tab-btn ${activeTab() === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key !== 'overview') setSelectedCollectionId(null);
                }}
              >
                <span class="tc-tab-icon">{tab.icon}</span>
                <span class="tc-tab-label">{tab.label}</span>
              </button>
            )}
          </For>
        </div>

        {activeTab() === 'overview' && (
          <div class="tc-overview">
            <div class="tc-overview-intro">
              <h3>📚 主题馆藏系统</h3>
              <p>将书籍按历史、科幻、哲学等专题成套组织，完成专题挑战解锁成就与奖励！</p>
            </div>
            <div class="tc-collection-grid">
              <For each={THEME_COLLECTIONS}>
                {(collection) => {
                  const stats = getCollectionStats(collection);
                  return (
                    <div
                      class={`tc-collection-card ${stats.isCompleted ? 'completed' : ''}`}
                      style={{ '--tc-color': collection.color }}
                      onClick={() => {
                        setSelectedCollectionId(collection.id);
                        setActiveTab('codex');
                      }}
                    >
                      <div class="tc-card-icon" style={{ background: collection.color }}>
                        <span>{collection.icon}</span>
                      </div>
                      <div class="tc-card-info">
                        <div class="tc-card-title">{collection.title}</div>
                        <div class="tc-card-category">{collection.category}</div>
                        <div class="tc-card-difficulty" style={{ color: DIFFICULTY_CONFIG[collection.difficulty].color }}>
                          {DIFFICULTY_CONFIG[collection.difficulty].icon} {DIFFICULTY_CONFIG[collection.difficulty].label}
                        </div>
                        <div class="tc-card-progress">
                          <div class="tc-progress-bar">
                            <div class="tc-progress-fill" style={{ width: `${stats.percent}%`, background: collection.color }} />
                          </div>
                          <span class="tc-progress-text">{stats.collected}/{collection.bookIds.length} 本</span>
                        </div>
                        <div class="tc-card-rewards">
                          <span>🪙 {collection.rewardCoins}</span>
                          <span>⭐ {collection.rewardReputation}</span>
                          {collection.rewardTitle && <span>🎖️ {collection.rewardTitle}</span>}
                        </div>
                      </div>
                      {stats.isCompleted && <div class="tc-card-badge">✓</div>}
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}

        {activeTab() === 'challenge' && (
          <div class="tc-challenge">
            {!selectedCollection() ? (
              <div class="tc-challenge-list">
                <div class="tc-section-title">选择专题挑战</div>
                <div class="tc-collection-grid">
                  <For each={THEME_COLLECTIONS}>
                    {(collection) => {
                      const stats = getCollectionStats(collection);
                      const challenges = getChallengesForCollection(collection.id);
                      const unlockedCount = challenges.filter(c => unlockedChallenges().has(c.id)).length;
                      return (
                        <div
                          class={`tc-collection-card challenge-card ${stats.isCompleted ? 'completed' : ''}`}
                          style={{ '--tc-color': collection.color }}
                          onClick={() => setSelectedCollectionId(collection.id)}
                        >
                          <div class="tc-card-icon" style={{ background: collection.color }}>
                            <span>{collection.icon}</span>
                          </div>
                          <div class="tc-card-info">
                            <div class="tc-card-title">{collection.title}</div>
                            <div class="tc-challenge-count">
                              ⚔️ 挑战 {unlockedCount}/{challenges.length} 完成
                            </div>
                            <div class="tc-card-progress">
                              <div class="tc-progress-bar">
                                <div class="tc-progress-fill" style={{ width: `${stats.percent}%`, background: collection.color }} />
                              </div>
                              <span class="tc-progress-text">{stats.collected}/{collection.bookIds.length}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            ) : (
              <div class="tc-challenge-detail">
                <button class="tc-back-btn" onClick={() => setSelectedCollectionId(null)}>
                  ← 返回选择
                </button>
                <div class="tc-detail-header" style={{ '--tc-color': selectedCollection()!.color }}>
                  <div class="tc-detail-icon" style={{ background: selectedCollection()!.color }}>
                    {selectedCollection()!.icon}
                  </div>
                  <div class="tc-detail-info">
                    <h3>{selectedCollection()!.title}</h3>
                    <p>{selectedCollection()!.description}</p>
                  </div>
                </div>
                <div class="tc-challenges-grid">
                  <For each={selectedChallenges()}>
                    {(challenge) => {
                      const isUnlocked = unlockedChallenges().has(challenge.id);
                      const typeConfig = CHALLENGE_TYPE_CONFIG[challenge.type];
                      return (
                        <div class={`tc-challenge-item ${isUnlocked ? 'completed' : ''}`}>
                          <div class="tc-challenge-icon">{challenge.icon}</div>
                          <div class="tc-challenge-info">
                            <div class="tc-challenge-title">
                              {challenge.title}
                              {isUnlocked && <span class="tc-challenge-badge">✓ 已完成</span>}
                            </div>
                            <div class="tc-challenge-desc">{challenge.description}</div>
                            <div class="tc-challenge-type">
                              <span class="tc-type-label">{typeConfig.label}</span>
                              <span class="tc-type-target">目标: {challenge.target} {typeConfig.unit}</span>
                            </div>
                            <div class="tc-challenge-rewards">
                              <span>🪙 +{challenge.rewardCoins}</span>
                              <span>⭐ +{challenge.rewardReputation}</span>
                            </div>
                          </div>
                          {!isUnlocked && (
                            <button
                              class="tc-start-btn"
                              onClick={() => props.onStartChallenge?.(selectedCollection()!.id)}
                            >
                              开始挑战
                            </button>
                          )}
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab() === 'codex' && (
          <div class="tc-codex">
            {!selectedCollection() ? (
              <div class="tc-codex-list">
                <div class="tc-section-title">选择专题图鉴</div>
                <div class="tc-collection-grid">
                  <For each={THEME_COLLECTIONS}>
                    {(collection) => {
                      const stats = getCollectionStats(collection);
                      return (
                        <div
                          class={`tc-collection-card codex-card ${stats.isCompleted ? 'completed' : ''}`}
                          style={{ '--tc-color': collection.color }}
                          onClick={() => setSelectedCollectionId(collection.id)}
                        >
                          <div class="tc-card-icon" style={{ background: collection.color }}>
                            <span>{collection.icon}</span>
                          </div>
                          <div class="tc-card-info">
                            <div class="tc-card-title">{collection.title}</div>
                            <div class="tc-card-progress">
                              <div class="tc-progress-bar">
                                <div class="tc-progress-fill" style={{ width: `${stats.percent}%`, background: collection.color }} />
                              </div>
                              <span class="tc-progress-text">{stats.collected}/{collection.bookIds.length} 已收录</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            ) : (
              <div class="tc-codex-detail">
                <button class="tc-back-btn" onClick={() => setSelectedCollectionId(null)}>
                  ← 返回选择
                </button>
                <div class="tc-detail-header" style={{ '--tc-color': selectedCollection()!.color }}>
                  <div class="tc-detail-icon" style={{ background: selectedCollection()!.color }}>
                    {selectedCollection()!.icon}
                  </div>
                  <div class="tc-detail-info">
                    <h3>{selectedCollection()!.title}</h3>
                    <p>{selectedCollection()!.description}</p>
                    {(() => {
                      const progress = selectedProgress();
                      if (!progress?.completedAt) return null;
                      return (
                        <div class="tc-completed-info">
                          ✅ 完成于 {formatDate(progress.completedAt)}
                          {progress.bestScore > 0 && <span> | 🏆 最佳: {progress.bestScore}分</span>}
                          {progress.fastestCompletion !== undefined && (
                            <span> | ⚡ 最快: {progress.fastestCompletion.toFixed(1)}s</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div class="tc-codex-books-grid">
                  <For each={selectedCollection()!.bookIds}>
                    {(bookId) => {
                      const book = BOOKS.find(b => b.id === bookId);
                      const collected = isBookCollected(bookId);
                      if (!book) return null;
                      return (
                        <div class={`tc-codex-book ${collected ? 'collected' : 'locked'}`}>
                          <div class="tc-book-spine" style={{ background: collected ? book.color : '#555' }}>
                            <span>{collected ? book.title.slice(0, 2) : '?'}</span>
                          </div>
                          <div class="tc-book-info">
                            <div class="tc-book-title">
                              {collected ? book.title : '???'}
                            </div>
                            <div class="tc-book-author">
                              {collected ? book.author : '未发现'}
                            </div>
                            <div class="tc-book-meta">
                              <span class="tc-book-genre">{book.genre}</span>
                              <span
                                class="tc-book-rarity"
                                style={{ color: collected ? RARITY_CONFIG[book.rarity].color : '#888' }}
                              >
                                {collected ? RARITY_CONFIG[book.rarity].icon : '🔒'} {collected ? RARITY_CONFIG[book.rarity].name : '未解锁'}
                              </span>
                            </div>
                            {collected && (
                              <div class="tc-book-year">
                                {book.year < 0 ? `公元前${Math.abs(book.year)}年` : `${book.year}年`}
                              </div>
                            )}
                          </div>
                          {collected && <div class="tc-book-badge">✓</div>}
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab() === 'ranking' && (
          <div class="tc-ranking">
            {!selectedCollection() ? (
              <div class="tc-ranking-list">
                <div class="tc-section-title">选择专题排行</div>
                <div class="tc-collection-grid">
                  <For each={THEME_COLLECTIONS}>
                    {(collection) => {
                      const ranking = getThemeCollectionRanking(collection.id);
                      return (
                        <div
                          class="tc-collection-card ranking-card"
                          style={{ '--tc-color': collection.color }}
                          onClick={() => setSelectedCollectionId(collection.id)}
                        >
                          <div class="tc-card-icon" style={{ background: collection.color }}>
                            <span>{collection.icon}</span>
                          </div>
                          <div class="tc-card-info">
                            <div class="tc-card-title">{collection.title}</div>
                            <div class="tc-ranking-count">
                              🏆 排行榜 {ranking.length} 条记录
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            ) : (
              <div class="tc-ranking-detail">
                <button class="tc-back-btn" onClick={() => setSelectedCollectionId(null)}>
                  ← 返回选择
                </button>
                <div class="tc-detail-header" style={{ '--tc-color': selectedCollection()!.color }}>
                  <div class="tc-detail-icon" style={{ background: selectedCollection()!.color }}>
                    {selectedCollection()!.icon}
                  </div>
                  <div class="tc-detail-info">
                    <h3>{selectedCollection()!.title} - 排行榜</h3>
                    <p>专题得分最高的玩家</p>
                  </div>
                </div>
                <div class="tc-ranking-table">
                  <div class="tc-ranking-header">
                    <span class="tc-rank-col">排名</span>
                    <span class="tc-player-col">玩家</span>
                    <span class="tc-score-col">得分</span>
                    <span class="tc-books-col">藏书</span>
                    <span class="tc-time-col">用时</span>
                    <span class="tc-hints-col">提示</span>
                  </div>
                  {selectedRanking().length > 0 ? (
                    <For each={selectedRanking()}>
                      {(entry, index) => (
                        <div class={`tc-ranking-row ${index() < 3 ? `top-${index() + 1}` : ''}`}>
                          <span class="tc-rank-col">
                            {index() === 0 ? '🥇' : index() === 1 ? '🥈' : index() === 2 ? '🥉' : `#${index() + 1}`}
                          </span>
                          <span class="tc-player-col">
                            {entry.avatar} {entry.playerName}
                          </span>
                          <span class="tc-score-col">{entry.score}</span>
                          <span class="tc-books-col">{entry.booksCollected}</span>
                          <span class="tc-time-col">{entry.timeUsed.toFixed(1)}s</span>
                          <span class="tc-hints-col">{entry.hintsUsed}</span>
                        </div>
                      )}
                    </For>
                  ) : (
                    <div class="tc-ranking-empty">
                      暂无排行记录，快来成为第一个上榜的玩家吧！
                    </div>
                  )}
                </div>
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
