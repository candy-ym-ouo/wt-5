import { createMemo, For } from 'solid-js';
import {
  getWorkshopStateInfo,
  setActiveTab,
  selectBook,
  closeDetail,
  setFilter,
  setSortBy,
  startBookRepair,
  enterRepairStage,
  completeCurrentStage,
  proceedToNextStage,
  exitMiniGame,
  toggleLabelSelection,
  getFilteredBooks,
  getMaterialList,
  getRepairedBooks,
  puzzlePieces,
  labelItems,
} from '../store/workshopStore';
import { DAMAGED_BOOKS, REPAIR_STAGES, DAMAGE_LEVEL_CONFIG, REPAIR_MATERIALS } from '../data/workshop';
import { RARITY_CONFIG } from '../data/themes';
import type { WorkshopTab, RepairStage } from '../types/workshop';

interface BookRepairWorkshopProps {
  onClose: () => void;
}

const TABS: { key: WorkshopTab; label: string; icon: string }[] = [
  { key: 'workbench', label: '修复工作台', icon: '🔧' },
  { key: 'collection', label: '修复珍藏', icon: '📚' },
  { key: 'materials', label: '材料仓库', icon: '🧰' },
];

const DAMAGE_OPTIONS = [
  { value: '', label: '全部破损程度' },
  { value: 'light', label: '轻微破损' },
  { value: 'moderate', label: '中度破损' },
  { value: 'severe', label: '严重破损' },
  { value: 'critical', label: '濒临散佚' },
];

const GENRE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: '文学', label: '文学' },
  { value: '古典', label: '古典' },
  { value: '科普', label: '科普' },
  { value: '技术', label: '技术' },
  { value: '历史', label: '历史' },
  { value: '哲学', label: '哲学' },
];

const RARITY_OPTIONS = [
  { value: '', label: '全部稀有度' },
  { value: 'legendary', label: '传说' },
  { value: 'epic', label: '史诗' },
  { value: 'rare', label: '珍贵' },
  { value: 'uncommon', label: '稀有' },
  { value: 'common', label: '普通' },
];

const SORT_OPTIONS = [
  { value: 'damage', label: '按破损程度' },
  { value: 'rarity', label: '按稀有度' },
  { value: 'progress', label: '按修复进度' },
  { value: 'name', label: '按名称' },
];

export default function BookRepairWorkshop(props: BookRepairWorkshopProps) {
  const stateInfo = createMemo(() => getWorkshopStateInfo());
  const filteredBooks = createMemo(() => getFilteredBooks());
  const materialList = createMemo(() => getMaterialList());
  const repairedBooks = createMemo(() => getRepairedBooks());

  const handleTabClick = (tab: WorkshopTab) => {
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

  const handleDamageChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setFilter({ damageLevel: target.value || undefined });
  };

  const handleRarityChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setFilter({ rarity: target.value || undefined });
  };

  const handleSortChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setSortBy(target.value as 'damage' | 'rarity' | 'progress' | 'name');
  };

  const handleStartRepair = (bookId: string) => {
    startBookRepair(bookId);
  };

  const handleEnterStage = (stage: RepairStage) => {
    enterRepairStage(stage);
  };

  const handleCompleteStage = () => {
    completeCurrentStage(true);
  };

  const handleNextStage = () => {
    proceedToNextStage();
  };

  const handleExitMiniGame = () => {
    exitMiniGame();
  };

  const handleToggleLabel = (labelId: string) => {
    toggleLabelSelection(labelId);
  };

  const getStageStatus = (book: typeof DAMAGED_BOOKS[0], stage: RepairStage): 'completed' | 'current' | 'pending' => {
    const state = stateInfo();
    const stages = book.repairStages;
    const currentIdx = state.currentStage ? stages.indexOf(state.currentStage) : -1;
    const stageIdx = stages.indexOf(stage);
    
    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'current';
    return 'pending';
  };

  const canAfford = (book: typeof DAMAGED_BOOKS[0]): boolean => {
    const materials = stateInfo().materials;
    return book.requiredMaterials.every(mat => 
      (materials[mat.type] || 0) >= mat.amount
    );
  };

  const getMaterialName = (matId: string): string => {
    const mat = REPAIR_MATERIALS.find(m => m.id === matId);
    return mat ? mat.name : matId;
  };

  const getMaterialIcon = (matId: string): string => {
    const mat = REPAIR_MATERIALS.find(m => m.id === matId);
    return mat ? mat.icon : '📦';
  };

  const getCurrentBook = () => {
    const bookId = stateInfo().selectedBookId;
    return DAMAGED_BOOKS.find(b => b.id === bookId);
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content workshop-modal" onClick={(e) => e.stopPropagation()}>
        <div class="workshop-header">
          <div class="workshop-title">
            <span class="workshop-icon">🔧</span>
            <span>书籍修复工坊</span>
          </div>
          <div class="workshop-stats">
            <div class="workshop-stat-item">
              <span class="ws-icon">📚</span>
              <span class="ws-text">{stateInfo().stats.repairedBooks}/{stateInfo().stats.totalDamagedBooks}</span>
            </div>
            <div class="workshop-stat-item">
              <span class="ws-icon">⭐</span>
              <span class="ws-text">Lv.{stateInfo().stats.workshopLevel}</span>
            </div>
            <div class="workshop-level-progress">
              <span class="wlp-label">经验</span>
              <div class="wlp-bar">
                <div 
                  class="wlp-fill" 
                  style={{ width: `${(stateInfo().stats.workshopExp / stateInfo().stats.nextLevelExp) * 100}%` }} 
                />
              </div>
              <span class="wlp-text">{stateInfo().stats.workshopExp}/{stateInfo().stats.nextLevelExp}</span>
            </div>
            <div class="workshop-stat-item">
              <span class="ws-icon">💎</span>
              <span class="ws-text">完美: {stateInfo().stats.perfectRepairRate}%</span>
            </div>
          </div>
        </div>

        <div class="workshop-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`workshop-tab-btn ${stateInfo().activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label}</span>
              </button>
            )}
          </For>
        </div>

        {!stateInfo().showDetail && !stateInfo().miniGameActive && (
          <>
            <div class="workshop-filters">
              <div class="filter-group">
                <input
                  type="text"
                  class="filter-search"
                  placeholder="搜索书籍..."
                  onInput={handleSearch}
                  value={stateInfo().filter.search || ''}
                />
              </div>
              {stateInfo().activeTab === 'workbench' && (
                <>
                  <div class="filter-group">
                    <select class="filter-select" onChange={handleDamageChange}>
                      <For each={DAMAGE_OPTIONS}>
                        {(opt) => (
                          <option value={opt.value} selected={stateInfo().filter.damageLevel === opt.value}>
                            {opt.label}
                          </option>
                        )}
                      </For>
                    </select>
                  </div>
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

            <div class="workshop-content">
              {stateInfo().activeTab === 'workbench' && (
                <div class="workshop-grid">
                  <For each={filteredBooks()}>
                    {(item) => {
                      const damageConfig = DAMAGE_LEVEL_CONFIG[item.book.damageLevel];
                      const rarityConfig = RARITY_CONFIG[item.book.rarity];
                      return (
                        <div
                          class={`workshop-card damaged-book-card ${
                            item.repaired ? 'repaired' : item.inProgress ? 'in-progress' : item.unlocked ? 'available' : 'locked'
                          }`}
                          onClick={() => item.unlocked && selectBook(item.book.id)}
                        >
                          <div class="card-damage-badge" style={{ background: damageConfig.color }}>
                            {damageConfig.icon} {damageConfig.name}
                          </div>
                          <div class="card-spine" style={{ background: item.repaired || item.unlocked ? item.book.color : '#555' }}>
                            <span class="spine-icon">
                              {item.book.rarity === 'legendary' ? '👑' : 
                               item.book.rarity === 'epic' ? '⭐' : ''}
                            </span>
                          </div>
                          <div class="card-content">
                            <div class="card-title">
                              {item.repaired || item.unlocked ? item.book.title : '???'}
                            </div>
                            <div class="card-author">
                              {item.repaired || item.unlocked ? item.book.author : '未知作者'}
                            </div>
                            <div class="card-meta">
                              <span class="card-genre">{item.book.genre}</span>
                              <span 
                                class="card-rarity"
                                style={{ color: item.repaired || item.unlocked ? rarityConfig.color : '#888' }}
                              >
                                {rarityConfig.icon} {item.repaired || item.unlocked ? rarityConfig.name : '???'}
                              </span>
                            </div>
                            <div class="card-status">
                              {item.repaired && <span class="status-badge repaired">✓ 已修复</span>}
                              {item.inProgress && <span class="status-badge in-progress">🔧 修复中</span>}
                              {!item.unlocked && !item.repaired && !item.inProgress && (
                                <span class="status-badge locked">🔒 未解锁</span>
                              )}
                              {item.unlocked && !item.repaired && !item.inProgress && (
                                <span class="status-badge available">📦 待修复</span>
                              )}
                            </div>
                          </div>
                          {item.repaired && <div class="card-badge">✓</div>}
                        </div>
                      );
                    }}
                  </For>
                </div>
              )}

              {stateInfo().activeTab === 'collection' && (
                <div class="workshop-collection">
                  {repairedBooks().length === 0 ? (
                    <div class="empty-state">
                      <div class="empty-icon">📚</div>
                      <div class="empty-text">还没有修复好的藏书</div>
                      <div class="empty-hint">去工作台修复你的第一本旧书吧！</div>
                    </div>
                  ) : (
                    <div class="workshop-grid">
                      <For each={repairedBooks()}>
                        {(book) => {
                          const rarityConfig = RARITY_CONFIG[book.rarity];
                          return (
                            <div
                              class="workshop-card repaired-book-card"
                              onClick={() => selectBook(book.id)}
                            >
                              <div class="card-spine" style={{ background: book.color }}>
                                <span class="spine-icon">
                                  {book.rarity === 'legendary' ? '👑' : 
                                   book.rarity === 'epic' ? '⭐' : ''}
                                </span>
                              </div>
                              <div class="card-content">
                                <div class="card-title">{book.title}</div>
                                <div class="card-author">{book.author}</div>
                                <div class="card-meta">
                                  <span class="card-genre">{book.genre}</span>
                                  <span 
                                    class="card-rarity"
                                    style={{ color: rarityConfig.color }}
                                  >
                                    {rarityConfig.icon} {rarityConfig.name}
                                  </span>
                                </div>
                                <div class="card-status">
                                  <span class="status-badge repaired">✨ 珍藏</span>
                                </div>
                              </div>
                              <div class="card-badge">✓</div>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  )}
                </div>
              )}

              {stateInfo().activeTab === 'materials' && (
                <div class="materials-grid">
                  <For each={materialList()}>
                    {(item) => (
                      <div class="material-card">
                        <div class="material-icon">{item.material.icon}</div>
                        <div class="material-info">
                          <div class="material-name">{item.material.name}</div>
                          <div class="material-desc">{item.material.description}</div>
                        </div>
                        <div class="material-count">
                          <span class="count-number">{item.count}</span>
                          <span class="count-label">个</span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </div>
          </>
        )}

        {stateInfo().showDetail && !stateInfo().miniGameActive && (() => {
          const book = getCurrentBook();
          if (!book) return null;
          
          const damageConfig = DAMAGE_LEVEL_CONFIG[book.damageLevel];
          const rarityConfig = RARITY_CONFIG[book.rarity];
          const isRepaired = stateInfo().progress.repairedBookIds.includes(book.id);
          const isInProgress = stateInfo().progress.inProgressBookIds.includes(book.id);
          const affordable = canAfford(book);
          const isUnlocked = stateInfo().progress.unlockedBookIds.includes(book.id);
          
          return (
            <div class="workshop-detail">
              <button class="detail-back-btn" onClick={handleBack}>
                ← 返回列表
              </button>

              <div class="book-detail">
                <div class="detail-header" style={{ '--book-color': book.color }}>
                  <div class="detail-spine" style={{ background: book.color }}>
                    <span class="detail-spine-text">{book.title}</span>
                  </div>
                  <div class="detail-book-info">
                    <div class="detail-title">{book.title}</div>
                    <div class="detail-author">{book.author}</div>
                    <div class="detail-meta">
                      <span class="detail-genre">{book.genre}</span>
                      <span class="detail-year">
                        {book.year < 0 ? `公元前${Math.abs(book.year)}年` : `${book.year}年`}
                      </span>
                      <span class="detail-rarity" style={{ color: rarityConfig.color }}>
                        {rarityConfig.icon} {rarityConfig.name}
                      </span>
                    </div>
                    <div class="detail-damage" style={{ color: damageConfig.color }}>
                      {damageConfig.icon} 破损程度: {damageConfig.name}
                    </div>
                  </div>
                </div>

                <div class="detail-description">{book.damageDescription}</div>
                <div class="detail-story">{book.backgroundStory}</div>

                <div class="detail-section">
                  <div class="section-title">🔧 修复阶段</div>
                  <div class="repair-stages-list">
                    <For each={book.repairStages}>
                      {(stage, idx) => {
                        const stageInfo = REPAIR_STAGES.find(s => s.key === stage)!;
                        const status = isInProgress ? getStageStatus(book, stage) : 
                                       isRepaired ? 'completed' : 'pending';
                        const isCurrent = isInProgress && stateInfo().currentStage === stage;
                        
                        return (
                          <div 
                            class={`repair-stage-item stage-${status}`}
                            onClick={() => isCurrent && handleEnterStage(stage)}
                          >
                            <div class="stage-number">{idx() + 1}</div>
                            <div class="stage-icon">{stageInfo.icon}</div>
                            <div class="stage-info">
                              <div class="stage-name">{stageInfo.name}</div>
                              <div class="stage-desc">{stageInfo.description}</div>
                            </div>
                            <div class="stage-status-icon">
                              {status === 'completed' && '✓'}
                              {status === 'current' && '▶'}
                              {status === 'pending' && '○'}
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>

                <div class="detail-section">
                  <div class="section-title">🧰 所需材料</div>
                  <div class="required-materials">
                    <For each={book.requiredMaterials}>
                      {(mat) => {
                        const hasEnough = (stateInfo().materials[mat.type] || 0) >= mat.amount;
                        return (
                          <div class={`required-mat-item ${hasEnough ? 'enough' : 'not-enough'}`}>
                            <span class="mat-icon">{getMaterialIcon(mat.type)}</span>
                            <span class="mat-name">{getMaterialName(mat.type)}</span>
                            <span class="mat-amount">
                              {stateInfo().materials[mat.type] || 0} / {mat.amount}
                            </span>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>

                <div class="detail-section">
                  <div class="section-title">📖 线索页预览</div>
                  <div class="clue-preview">
                    <For each={book.descriptionClues}>
                      {(clue, idx) => (
                        <div class="clue-preview-item">
                          <span class="clue-number">{idx() + 1}.</span>
                          <span class="clue-text">{clue}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <div class="detail-actions">
                  {isRepaired && (
                    <div class="repaired-notice">
                      ✨ 这本书已经修复完成，已收入珍藏
                    </div>
                  )}
                  {isInProgress && stateInfo().currentStage && (
                    <button 
                      class="modal-button primary"
                      onClick={() => handleEnterStage(stateInfo().currentStage!)}
                    >
                      继续修复
                    </button>
                  )}
                  {!isRepaired && !isInProgress && isUnlocked && (
                    <button 
                      class={`modal-button primary ${!affordable ? 'disabled' : ''}`}
                      onClick={() => affordable && handleStartRepair(book.id)}
                      disabled={!affordable}
                    >
                      {affordable ? '开始修复' : '材料不足'}
                    </button>
                  )}
                  {!isUnlocked && !isRepaired && (
                    <div class="locked-notice">
                      🔒 修复更多书籍以解锁
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {stateInfo().miniGameActive && (() => {
          const state = stateInfo();
          const currentStage = state.currentStage;
          const stageInfo = REPAIR_STAGES.find(s => s.key === currentStage);
          const book = getCurrentBook();
          
          if (state.miniGameResult === 'success') {
            return (
              <div class="mini-game-container">
                <div class="mini-game-success">
                  <div class="success-icon">✨</div>
                  <div class="success-title">修复阶段完成！</div>
                  <div class="success-desc">{stageInfo?.name} 已顺利完成</div>
                  <button class="modal-button primary" onClick={handleNextStage}>
                    进入下一阶段
                  </button>
                </div>
              </div>
            );
          }
          
          return (
            <div class="mini-game-container">
              <div class="mini-game-header">
                <button class="mini-game-back" onClick={handleExitMiniGame}>
                  ← 返回
                </button>
                <div class="mini-game-title">
                  <span class="mg-icon">{stageInfo?.icon}</span>
                  <span>{stageInfo?.name}</span>
                </div>
                <div class="mini-game-stage">{stageInfo?.description}</div>
              </div>

              <div class="mini-game-content">
                {currentStage === 'intake' && (
                  <div class="intake-game">
                    <div class="intake-book">
                      <div class="book-cover" style={{ background: book?.color }}>
                        <span class="book-title-short">
                          {book?.title.slice(0, 4)}
                        </span>
                      </div>
                    </div>
                    <div class="intake-form">
                      <div class="intake-title">书籍验收登记</div>
                      <div class="intake-desc">
                        请检查书籍破损情况，填写修复前先登记入库。
                      </div>
                      <div class="intake-checklist">
                        <div class="check-item">✓ 封面检查</div>
                        <div class="check-item">✓ 书脊检查</div>
                        <div class="check-item">✓ 书页检查</div>
                        <div class="check-item">✓ 破损登记</div>
                      </div>
                      <button class="modal-button primary" onClick={handleCompleteStage}>
                        完成验收
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === 'cleaning' && (
                  <div class="cleaning-game">
                    <div class="cleaning-area">
                      <div class="dirty-book">
                        <div 
                          class="book-surface"
                          style={{ background: book?.color }}
                        >
                          <div class="dirt-spots">
                            <div class="dirt-spot spot-1"></div>
                            <div class="dirt-spot spot-2"></div>
                            <div class="dirt-spot spot-3"></div>
                            <div class="dirt-spot spot-4"></div>
                            <div class="dirt-spot spot-5"></div>
                            <div class="dirt-spot spot-6"></div>
                          </div>
                        </div>
                      </div>
                      <div class="cleaning-tools">
                        <div class="tool-item">🧹 软毛刷</div>
                        <div class="tool-item">🧴 清洁剂</div>
                        <div class="tool-item">📄 吸水纸</div>
                      </div>
                    </div>
                    <div class="cleaning-info">
                      <div class="cleaning-title">清洁整理书页</div>
                      <div class="cleaning-desc">
                        轻轻拂去灰尘，清理污渍，让书页焕然一新。
                      </div>
                      <div class="cleaning-progress">
                        <div class="cleaning-bar">
                          <div class="cleaning-fill" style={{ width: '60%' }}></div>
                        </div>
                        <span class="cleaning-text">清洁进度: 60%</span>
                      </div>
                      <button class="modal-button primary" onClick={handleCompleteStage}>
                        完成清洁
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === 'page_repair' && (
                  <div class="page-repair-game">
                    <div class="repair-workbench">
                      <div class="torn-pages">
                        <div class="torn-page page-1">
                          <div class="page-tear"></div>
                        </div>
                        <div class="torn-page page-2">
                          <div class="page-tear"></div>
                        </div>
                        <div class="torn-page page-3">
                          <div class="page-tear"></div>
                        </div>
                      </div>
                      <div class="repair-supplies">
                        <div class="supply-item">🧴 古籍胶水</div>
                        <div class="supply-item">📜 宣纸补丁</div>
                        <div class="supply-item">🧵 装订丝线</div>
                      </div>
                    </div>
                    <div class="repair-info">
                      <div class="repair-title">修补破损书页</div>
                      <div class="repair-desc">
                        仔细修补每一页破损的书页，然后重新装订。
                      </div>
                      <div class="repair-progress">
                        <span>已修复: 2/3 页</span>
                      </div>
                      <button class="modal-button primary" onClick={handleCompleteStage}>
                        完成修复
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === 'clue_patching' && (
                  <div class="clue-patching-game">
                    <div class="puzzle-area">
                      <div class="puzzle-board">
                        <div class="puzzle-slot">
                          <For each={puzzlePieces().slice(0, 8)}>
                            {(piece) => (
                              <div 
                                class={`puzzle-piece ${piece.isPlaced ? 'placed' : ''}`}
                              >
                                {piece.content}
                              </div>
                            )}
                          </For>
                        </div>
                        <div class="puzzle-pieces-tray">
                          <For each={puzzlePieces().slice(8, 16)}>
                            {(piece) => (
                              <div class="puzzle-piece loose">{piece.content}</div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                    <div class="patching-info">
                      <div class="patching-title">补全线索页</div>
                      <div class="patching-desc">
                        将散落的文字碎片拼回正确的位置，还原书籍的线索页。
                      </div>
                      <div class="patching-progress">
                        <span>已拼合: 8/15 片</span>
                      </div>
                      <button class="modal-button primary" onClick={handleCompleteStage}>
                        完成拼合
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === 'labeling' && (
                  <div class="labeling-game">
                    <div class="labeling-area">
                      <div class="label-book-preview">
                        <div 
                          class="label-book-cover"
                          style={{ background: book?.color }}
                        >
                          <span class="label-book-title">
                            {book?.title.slice(0, 4)}
                          </span>
                        </div>
                        <div class="label-tags">
                          <For each={labelItems().filter(item => item.isSelected)}>
                            {(item) => (
                              <span class={`label-tag ${item.category}`}>
                                {item.text}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                      <div class="label-options">
                        <div class="label-category">类型标签</div>
                        <div class="label-list">
                          <For each={labelItems()}>
                            {(item) => (
                              <button
                                class={`label-option ${item.isSelected ? 'selected' : ''}`}
                                onClick={() => handleToggleLabel(item.id)}
                              >
                                {item.text}
                              </button>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                    <div class="labeling-info">
                      <div class="labeling-title">分类归档标签</div>
                      <div class="labeling-desc">
                        为这本书选择正确的分类标签，方便日后查找。
                      </div>
                      <div class="labeling-hint">
                        💡 提示：选择正确的类型和主题标签
                      </div>
                      <button class="modal-button primary" onClick={handleCompleteStage}>
                        确认标签
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === 'archiving' && (
                  <div class="archiving-game">
                    <div class="archive-shelf">
                      <div class="archive-spot empty">
                        <span>?</span>
                      </div>
                      <div class="archive-spot empty">
                        <span>?</span>
                      </div>
                      <div 
                        class="archive-book"
                        style={{ background: book?.color }}
                      >
                        <span class="archive-book-title">
                          {book?.title.slice(0, 4)}
                        </span>
                      </div>
                      <div class="archive-spot empty">
                        <span>?</span>
                      </div>
                      <div class="archive-spot empty">
                        <span>?</span>
                      </div>
                    </div>
                    <div class="archiving-info">
                      <div class="archiving-title">入藏登记</div>
                      <div class="archiving-desc">
                        将修复好的书籍放入珍藏书架，盖上藏书印，记录在册。
                      </div>
                      <div class="archiving-stamp">
                        <div class="stamp">📚 珍藏</div>
                      </div>
                      <button class="modal-button primary" onClick={handleCompleteStage}>
                        完成入藏
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
