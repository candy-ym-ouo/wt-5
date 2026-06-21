import { createSignal, createMemo, For } from 'solid-js';
import {
  getAccountInfo,
  getAccountState,
  updatePlayerNickname,
  updatePlayerTitle,
  updatePlayerAvatar,
  updatePlayerPreferences,
  loadAccount,
  createNewAccount,
  deleteSaveSlot,
  renameSaveSlot,
  exportCurrentArchive,
  importArchive,
  saveCurrentArchive,
} from '../store/accountStore';
import { TITLES, getRarityName, getCategoryName } from '../data/titles';
import type { AccountTab, TitleFilter } from '../types/account';
import type { DifficultyLevel } from '../types/game';

interface AccountProfileProps {
  onClose: () => void;
}

const TABS: { key: AccountTab; label: string; icon: string }[] = [
  { key: 'profile', label: '账号信息', icon: '👤' },
  { key: 'stats', label: '战绩统计', icon: '📊' },
  { key: 'titles', label: '称号收藏', icon: '🏆' },
  { key: 'history', label: '历史记录', icon: '📜' },
  { key: 'saves', label: '存档管理', icon: '💾' },
  { key: 'settings', label: '偏好设置', icon: '⚙️' },
];

const AVATAR_OPTIONS = ['👤', '👨‍💼', '👩‍💼', '🧙‍♂️', '🧙‍♀️', '📚', '🎓', '🎨', '🎯', '🏆', '⭐', '🌟', '🔮', '📖', '✍️', '🎭'];

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
  expert: '专家',
  master: '大师',
};

export default function AccountProfile(props: AccountProfileProps) {
  const [activeTab, setActiveTab] = createSignal<AccountTab>('profile');
  const [titleFilter, setTitleFilter] = createSignal<TitleFilter>('all');
  const [editingNickname, setEditingNickname] = createSignal(false);
  const [nicknameInput, setNicknameInput] = createSignal('');
  const [editingSlotId, setEditingSlotId] = createSignal<number | null>(null);
  const [slotNameInput, setSlotNameInput] = createSignal('');
  const [showImportModal, setShowImportModal] = createSignal(false);
  const [importData, setImportData] = createSignal('');
  const [importSlotId, setImportSlotId] = createSignal<number>(0);

  const accountInfo = createMemo(() => getAccountInfo());
  const accountState = createMemo(() => getAccountState());

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  const filteredTitles = createMemo(() => {
    const unlocked = accountInfo().unlockedTitles;
    const filter = titleFilter();
    
    return TITLES.filter(title => {
      if (filter === 'unlocked') return unlocked.includes(title.id);
      if (filter === 'locked') return !unlocked.includes(title.id);
      return true;
    });
  });

  const handleNicknameEdit = () => {
    setNicknameInput(accountInfo().nickname);
    setEditingNickname(true);
  };

  const handleNicknameSave = () => {
    const result = updatePlayerNickname(nicknameInput());
    if (result) {
      setEditingNickname(false);
    }
  };

  const handleAvatarSelect = (avatar: string) => {
    updatePlayerAvatar(avatar);
  };

  const handleTitleSelect = (titleId: string | null) => {
    updatePlayerTitle(titleId);
  };

  const handleSlotEdit = (slotId: number, currentName: string) => {
    setEditingSlotId(slotId);
    setSlotNameInput(currentName);
  };

  const handleSlotRename = (slotId: number) => {
    if (renameSaveSlot(slotId, slotNameInput())) {
      setEditingSlotId(null);
    }
  };

  const handleSlotLoad = (slotId: number) => {
    if (loadAccount(slotId)) {
      saveCurrentArchive();
    }
  };

  const handleSlotDelete = (slotId: number) => {
    if (confirm('确定要删除这个存档吗？此操作不可恢复。')) {
      deleteSaveSlot(slotId);
    }
  };

  const handleCreateSlot = () => {
    const nickname = prompt('请输入昵称：', '玩家');
    if (nickname) {
      const emptySlot = accountState().saveSlots.find(s => !s.archiveId) || 
        (accountState().saveSlots.length < accountState().maxSlots 
          ? { slotId: accountState().saveSlots.length } 
          : null);
      if (emptySlot) {
        createNewAccount(nickname, emptySlot.slotId);
      }
    }
  };

  const handleExport = () => {
    const data = exportCurrentArchive();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wt5-archive-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = () => {
    if (importData().trim()) {
      const result = importArchive(importData(), importSlotId());
      if (result) {
        setShowImportModal(false);
        setImportData('');
      }
    }
  };

  const handlePreferenceChange = (key: keyof NonNullable<ReturnType<typeof getAccountInfo>['preferences']>, value: any) => {
    if (accountInfo().preferences) {
      updatePlayerPreferences({ [key]: value });
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
        <div class="account-header">
          <div class="account-title">
            <span class="account-icon">👤</span>
            <span>账号档案</span>
          </div>
          <div class="account-summary">
            <div class="summary-item">
              <span class="si-icon">📚</span>
              <span class="si-text">{accountInfo().collectionStats?.totalCollected || 0}/{accountInfo().collectionStats?.totalBooks || 0}</span>
            </div>
            <div class="summary-item">
              <span class="si-icon">🏆</span>
              <span class="si-text">{accountInfo().achievementStats?.unlocked || 0}/{accountInfo().achievementStats?.total || 0}</span>
            </div>
            <div class="summary-item">
              <span class="si-icon">🎖️</span>
              <span class="si-text">{accountInfo().titleStats?.unlocked || 0}/{accountInfo().titleStats?.total || 0}</span>
            </div>
            <div class="summary-item">
              <span class="si-icon">⏱️</span>
              <span class="si-text">{accountInfo().totalPlayTime}</span>
            </div>
          </div>
        </div>

        <div class="account-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`account-tab-btn ${activeTab() === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label}</span>
              </button>
            )}
          </For>
        </div>

        <div class="account-content">
          {activeTab() === 'profile' && (
            <div class="profile-section">
              <div class="profile-card">
                <div class="profile-avatar-section">
                  <div class="profile-avatar">{accountInfo().avatar}</div>
                  <div class="avatar-selector">
                    <div class="selector-label">选择头像：</div>
                    <div class="avatar-grid">
                      <For each={AVATAR_OPTIONS}>
                        {(avatar) => (
                          <button
                            class={`avatar-option ${accountInfo().avatar === avatar ? 'selected' : ''}`}
                            onClick={() => handleAvatarSelect(avatar)}
                            title={avatar}
                          >
                            {avatar}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </div>

                <div class="profile-info">
                  <div class="profile-nickname-row">
                    {editingNickname() ? (
                      <div class="nickname-edit">
                        <input
                          type="text"
                          value={nicknameInput()}
                          onInput={(e) => setNicknameInput(e.target.value)}
                          maxlength={12}
                          class="nickname-input"
                        />
                        <button class="btn btn-small btn-primary" onClick={handleNicknameSave}>保存</button>
                        <button class="btn btn-small" onClick={() => setEditingNickname(false)}>取消</button>
                      </div>
                    ) : (
                      <>
                        <h2 class="profile-nickname">{accountInfo().nickname}</h2>
                        <button class="btn-icon" onClick={handleNicknameEdit} title="修改昵称">✏️</button>
                      </>
                    )}
                  </div>

                  <div class="profile-title-row">
                    <span class="profile-label">当前称号：</span>
                    {accountInfo().title ? (
                      <span class="current-title" style={{ color: accountInfo().title!.color }}>
                        {accountInfo().title!.icon} {accountInfo().title!.title}
                      </span>
                    ) : (
                      <span class="text-muted">未设置</span>
                    )}
                  </div>

                  <div class="profile-stats-grid">
                    <div class="profile-stat-card">
                      <div class="ps-icon">🎮</div>
                      <div class="ps-label">总游戏局数</div>
                      <div class="ps-value">{accountInfo().stats?.totalGamesPlayed || 0}</div>
                    </div>
                    <div class="profile-stat-card">
                      <div class="ps-icon">📖</div>
                      <div class="ps-label">累计找书</div>
                      <div class="ps-value">{accountInfo().stats?.totalBooksFound || 0}</div>
                    </div>
                    <div class="profile-stat-card highlight">
                      <div class="ps-icon">🏆</div>
                      <div class="ps-label">最高得分</div>
                      <div class="ps-value">{accountInfo().stats?.highestScore || 0}</div>
                      <div class="ps-date">{accountInfo().stats?.highestScoreDate ? formatDate(accountInfo().stats!.highestScoreDate) : ''}</div>
                    </div>
                    <div class="profile-stat-card">
                      <div class="ps-icon">⚡</div>
                      <div class="ps-label">最快找到</div>
                      <div class="ps-value">{accountInfo().stats?.fastestFind ? accountInfo().stats!.fastestFind.toFixed(1) + 's' : '-'}</div>
                    </div>
                    <div class="profile-stat-card">
                      <div class="ps-icon">🔥</div>
                      <div class="ps-label">最长连胜</div>
                      <div class="ps-value">{accountInfo().stats?.longestStreak || 0}</div>
                    </div>
                    <div class="profile-stat-card">
                      <div class="ps-icon">🎯</div>
                      <div class="ps-label">准确率</div>
                      <div class="ps-value">{accountInfo().stats?.accuracy ? (accountInfo().stats!.accuracy * 100).toFixed(1) + '%' : '-'}</div>
                    </div>
                  </div>

                  <div class="profile-dates">
                    <div class="date-item">
                      <span class="date-label">创建时间：</span>
                      <span>{accountInfo().stats ? formatDate(accountInfo().stats!.highestScoreDate) : '-'}</span>
                    </div>
                    <div class="date-item">
                      <span class="date-label">总游戏时长：</span>
                      <span>{accountInfo().totalPlayTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab() === 'stats' && (
            <div class="stats-section">
              <div class="stats-overview">
                <h3 class="section-title">📊 总览统计</h3>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value-large">{accountInfo().stats?.totalScore || 0}</div>
                    <div class="stat-label">累计总得分</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value-large">{accountInfo().stats?.averageScore || 0}</div>
                    <div class="stat-label">平均得分</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value-large">{accountInfo().stats?.winRate ? (accountInfo().stats!.winRate * 100).toFixed(1) + '%' : '0%'}</div>
                    <div class="stat-label">胜率</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value-large">{accountInfo().stats?.totalPerfectRuns || 0}</div>
                    <div class="stat-label">完美通关</div>
                  </div>
                </div>
              </div>

              <div class="stats-difficulty">
                <h3 class="section-title">🎚️ 难度统计</h3>
                <div class="difficulty-stats-grid">
                  <For each={Object.entries(accountInfo().stats?.difficultyStats || {})}>
                    {([diff, stats]) => (
                      <div class="difficulty-stat-card">
                        <div class="diff-header">
                          <span class="diff-name">{DIFFICULTY_LABELS[diff as DifficultyLevel]}</span>
                        </div>
                        <div class="diff-stats">
                          <div class="diff-stat-item">
                            <span class="dsi-label">游戏局数</span>
                            <span class="dsi-value">{stats.gamesPlayed}</span>
                          </div>
                          <div class="diff-stat-item">
                            <span class="dsi-label">找到书籍</span>
                            <span class="dsi-value">{stats.booksFound}</span>
                          </div>
                          <div class="diff-stat-item">
                            <span class="dsi-label">最高分</span>
                            <span class="dsi-value">{stats.highestScore}</span>
                          </div>
                          <div class="diff-stat-item">
                            <span class="dsi-label">平均分</span>
                            <span class="dsi-value">{stats.averageScore}</span>
                          </div>
                          <div class="diff-stat-item">
                            <span class="dsi-label">胜率</span>
                            <span class="dsi-value">{(stats.winRate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="stats-mode">
                <h3 class="section-title">🎮 模式统计</h3>
                <div class="mode-stats-grid">
                  <For each={Object.entries(accountInfo().stats?.modeStats || {})}>
                    {([mode, stats]) => (
                      <div class="mode-stat-card">
                        <div class="mode-header">
                          <span class="mode-name">{
                            mode === 'classic' ? '经典模式' :
                            mode === 'chapter' ? '剧情模式' :
                            mode === 'daily' ? '每日挑战' : '闯关模式'
                          }</span>
                        </div>
                        <div class="mode-stats">
                          <div class="mode-stat-item">
                            <span class="msi-label">游戏局数</span>
                            <span class="msi-value">{stats.gamesPlayed}</span>
                          </div>
                          <div class="mode-stat-item">
                            <span class="msi-label">找到书籍</span>
                            <span class="msi-value">{stats.booksFound}</span>
                          </div>
                          <div class="mode-stat-item">
                            <span class="msi-label">最高分</span>
                            <span class="msi-value">{stats.highestScore}</span>
                          </div>
                          <div class="mode-stat-item">
                            <span class="msi-label">完成次数</span>
                            <span class="msi-value">{stats.completed}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}

          {activeTab() === 'titles' && (
            <div class="titles-section">
              <div class="titles-filter">
                <button
                  class={`filter-btn ${titleFilter() === 'all' ? 'active' : ''}`}
                  onClick={() => setTitleFilter('all')}
                >
                  全部
                </button>
                <button
                  class={`filter-btn ${titleFilter() === 'unlocked' ? 'active' : ''}`}
                  onClick={() => setTitleFilter('unlocked')}
                >
                  已解锁 ({accountInfo().titleStats?.unlocked || 0})
                </button>
                <button
                  class={`filter-btn ${titleFilter() === 'locked' ? 'active' : ''}`}
                  onClick={() => setTitleFilter('locked')}
                >
                  未解锁 ({(accountInfo().titleStats?.total || 0) - (accountInfo().titleStats?.unlocked || 0)})
                </button>
              </div>

              <div class="titles-grid">
                <For each={filteredTitles()}>
                  {(title) => {
                    const isUnlocked = accountInfo().unlockedTitles.includes(title.id);
                    const isSelected = accountInfo().title?.id === title.id;
                    return (
                      <div
                        class={`title-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
                        onClick={() => isUnlocked && handleTitleSelect(isSelected ? null : title.id)}
                      >
                        <div class="title-icon" style={{ color: isUnlocked ? title.color : '#666' }}>
                          {title.icon}
                        </div>
                        <div class="title-info">
                          <div class="title-name" style={{ color: isUnlocked ? title.color : '#666' }}>
                            {title.title}
                          </div>
                          <div class="title-desc">{isUnlocked ? title.description : '???'}</div>
                          <div class="title-meta">
                            <span class="title-category">{getCategoryName(title.category)}</span>
                            <span class="title-rarity" style={{ color: isUnlocked ? title.color : '#666' }}>
                              {getRarityName(title.rarity)}
                            </span>
                          </div>
                          {!isUnlocked && (
                            <div class="title-condition">
                              💡 {title.condition}
                            </div>
                          )}
                          {isSelected && (
                            <div class="title-selected-badge">✓ 已装备</div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          )}

          {activeTab() === 'history' && (
            <div class="history-section">
              <div class="history-tabs">
                <h3 class="section-title">🎮 游戏记录</h3>
              </div>
              <div class="game-history-list">
                {accountInfo().gameHistory.length === 0 ? (
                  <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <div class="empty-text">暂无游戏记录</div>
                    <div class="empty-hint">开始游戏后记录将显示在这里</div>
                  </div>
                ) : (
                  <For each={accountInfo().gameHistory.slice().reverse().slice(0, 50)}>
                    {(record) => (
                      <div class={`history-item ${record.isWin ? 'win' : 'lose'}`}>
                        <div class="hi-result">
                          {record.isWin ? '✅' : '❌'}
                        </div>
                        <div class="hi-content">
                          <div class="hi-score">
                            <span class="hi-score-value">{record.score}</span>
                            <span class="hi-score-label">分</span>
                            {record.isPersonalBest && <span class="hi-badge pb">🏆 新纪录</span>}
                            {record.rating && <span class="hi-badge rating">⭐ {record.rating}</span>}
                          </div>
                          <div class="hi-meta">
                            <span>📖 {record.booksFound}本书</span>
                            <span>⏱️ {formatTime(record.timeUsed)}</span>
                            <span>💡 {record.hintsUsed}次提示</span>
                            <span>🔥 {record.streak}连胜</span>
                          </div>
                          <div class="hi-meta-secondary">
                            <span class={`diff-badge ${record.difficulty}`}>{DIFFICULTY_LABELS[record.difficulty]}</span>
                            <span class="mode-badge">{
                              record.gameMode === 'classic' ? '经典' :
                              record.gameMode === 'chapter' ? '剧情' :
                              record.gameMode === 'daily' ? '每日' : '闯关'
                            }</span>
                            <span class="hi-date">{formatDate(record.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                )}
              </div>
            </div>
          )}

          {activeTab() === 'saves' && (
            <div class="saves-section">
              <div class="saves-header">
                <h3 class="section-title">💾 存档槽位</h3>
                <div class="saves-actions">
                  <button class="btn btn-small" onClick={() => setShowImportModal(true)}>
                    📥 导入存档
                  </button>
                  <button class="btn btn-small" onClick={handleExport}>
                    📤 导出当前存档
                  </button>
                  {accountState().saveSlots.filter(s => s.archiveId).length < accountState().maxSlots && (
                    <button class="btn btn-small btn-primary" onClick={handleCreateSlot}>
                      ➕ 新建存档
                    </button>
                  )}
                </div>
              </div>

              <div class="saves-grid">
                <For each={accountState().saveSlots}>
                  {(slot) => (
                    <div class={`save-slot-card ${slot.isActive ? 'active' : ''} ${!slot.archiveId ? 'empty' : ''}`}>
                      {slot.isActive && <div class="active-indicator">● 当前</div>}
                      {!slot.archiveId ? (
                        <div class="empty-slot" onClick={() => handleCreateSlot()}>
                          <div class="empty-slot-icon">➕</div>
                          <div class="empty-slot-text">空存档位</div>
                          <div class="empty-slot-hint">点击创建新存档</div>
                        </div>
                      ) : (
                        <>
                          <div class="slot-header">
                            {editingSlotId() === slot.slotId ? (
                              <div class="slot-name-edit">
                                <input
                                  type="text"
                                  value={slotNameInput()}
                                  onInput={(e) => setSlotNameInput(e.target.value)}
                                  maxlength={20}
                                  class="slot-name-input"
                                />
                                <button class="btn-icon" onClick={() => handleSlotRename(slot.slotId)}>✓</button>
                                <button class="btn-icon" onClick={() => setEditingSlotId(null)}>✕</button>
                              </div>
                            ) : (
                              <>
                                <h4 class="slot-name">{slot.slotName}</h4>
                                <button class="btn-icon" onClick={() => handleSlotEdit(slot.slotId, slot.slotName)}>✏️</button>
                              </>
                            )}
                            {slot.isAutoSave && <span class="auto-save-badge">自动</span>}
                          </div>
                          
                          <div class="slot-preview">
                            <div class="sp-avatar">{slot.preview.thumbnail || '👤'}</div>
                            <div class="sp-info">
                              <div class="sp-nickname">{slot.preview.nickname}</div>
                              <div class="sp-stats">
                                <span>📖 {slot.preview.booksFound}本书</span>
                                <span>🎯 {slot.preview.score}分</span>
                              </div>
                              <div class="sp-time">
                                ⏱️ {formatTime(slot.preview.playTime)}
                              </div>
                              <div class="sp-date">
                                📅 {formatDate(slot.preview.lastPlayed)}
                              </div>
                            </div>
                          </div>

                          <div class="slot-actions">
                            {!slot.isActive && (
                              <button class="btn btn-small btn-primary" onClick={() => handleSlotLoad(slot.slotId)}>
                                📂 加载
                              </button>
                            )}
                            {slot.isActive && (
                              <button class="btn btn-small" disabled>
                                ✓ 当前使用中
                              </button>
                            )}
                            <button 
                              class="btn btn-small btn-danger" 
                              onClick={() => handleSlotDelete(slot.slotId)}
                              disabled={slot.isActive && accountState().saveSlots.filter(s => s.isAutoSave).length <= 1}
                            >
                              🗑️ 删除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}

          {activeTab() === 'settings' && (
            <div class="settings-section">
              <h3 class="section-title">⚙️ 偏好设置</h3>
              
              <div class="settings-grid">
                <div class="setting-item">
                  <label class="setting-label">🎨 主题</label>
                  <select 
                    class="setting-select"
                    value={accountInfo().preferences?.theme || 'default'}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  >
                    <option value="default">默认主题</option>
                    <option value="dark">深色主题</option>
                    <option value="light">浅色主题</option>
                    <option value="sepia">护眼模式</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="setting-label">🎚️ 默认难度</label>
                  <select 
                    class="setting-select"
                    value={accountInfo().preferences?.difficulty || 'normal'}
                    onChange={(e) => handlePreferenceChange('difficulty', e.target.value)}
                  >
                    <option value="easy">简单</option>
                    <option value="normal">普通</option>
                    <option value="hard">困难</option>
                    <option value="expert">专家</option>
                    <option value="master">大师</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="setting-label">🔄 难度模式</label>
                  <select 
                    class="setting-select"
                    value={accountInfo().preferences?.difficultyMode || 'dynamic'}
                    onChange={(e) => handlePreferenceChange('difficultyMode', e.target.value)}
                  >
                    <option value="fixed">固定难度</option>
                    <option value="dynamic">动态调整</option>
                  </select>
                </div>

                <div class="setting-item toggle">
                  <label class="setting-label">🔊 音效</label>
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={accountInfo().preferences?.soundEnabled ?? true}
                      onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item toggle">
                  <label class="setting-label">🎵 音乐</label>
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={accountInfo().preferences?.musicEnabled ?? true}
                      onChange={(e) => handlePreferenceChange('musicEnabled', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item toggle">
                  <label class="setting-label">📖 新手教程</label>
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={accountInfo().preferences?.showTutorial ?? true}
                      onChange={(e) => handlePreferenceChange('showTutorial', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item toggle">
                  <label class="setting-label">💾 自动保存</label>
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={accountInfo().preferences?.autoSave ?? true}
                      onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div class="settings-actions">
                <button class="btn btn-primary" onClick={saveCurrentArchive}>
                  💾 保存设置
                </button>
              </div>
            </div>
          )}
        </div>

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>

      {showImportModal() && (
        <div class="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div class="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>📥 导入存档</h3>
            <p class="modal-subtitle-text">请粘贴存档数据的 JSON 内容：</p>
            <textarea
              class="import-textarea"
              value={importData()}
              onInput={(e) => setImportData(e.target.value)}
              placeholder='{"archive": {...}}'
              rows={8}
            />
            <div class="import-slot-select">
              <label>导入到槽位：</label>
              <select 
                value={importSlotId()}
                onChange={(e) => setImportSlotId(Number(e.target.value))}
              >
                <For each={accountState().saveSlots}>
                  {(slot) => (
                    <option value={slot.slotId}>
                      槽位 {slot.slotId + 1}: {slot.slotName || '空'}
                    </option>
                  )}
                </For>
              </select>
            </div>
            <div class="modal-actions">
              <button class="btn" onClick={() => setShowImportModal(false)}>取消</button>
              <button class="btn btn-primary" onClick={handleImport}>导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
