import { createMemo, For, Show } from 'solid-js';
import type { CharacterState } from '../types/character';
import { RELATIONSHIP_THRESHOLDS, RELATIONSHIP_LEVEL_ICONS } from '../types/character';
import {
  GAME_CHARACTERS,
  ROLE_LABELS,
  getCharacterById,
  getDialogueTreesForCharacter,
  getAvailableDialogueTree,
} from '../data/characters';
import {
  characterState,
  setCharacterState,
  closeCharacterPanel,
  selectCharacter,
  setActiveTab,
  startDialogue,
  advanceDialogueNode,
  selectDialogueChoice,
  endDialogue,
  getCurrentDialogueNode,
  getSelectedCharacter,
  getRelationshipInfo,
  getCharacterBooklists,
  getCharacterSideQuests,
  getCharacterAchievementsList,
  getCharacterPanelInfo,
} from '../store/characterStore';
import { getCharacterAchievementProgress } from '../utils/characterStorage';

interface CharacterPanelProps {
  onClose: () => void;
}

export default function CharacterPanel(props: CharacterPanelProps) {
  const state = createMemo(() => characterState());
  const currentNode = createMemo(() => getCurrentDialogueNode());
  const selectedChar = createMemo(() => getSelectedCharacter());
  const panelInfo = createMemo(() => getCharacterPanelInfo());
  const booklists = createMemo(() => getCharacterBooklists());
  const sideQuests = createMemo(() => getCharacterSideQuests());
  const achievements = createMemo(() => getCharacterAchievementsList());

  const handleClose = () => {
    closeCharacterPanel();
    props.onClose();
  };

  const handleSelectCharacter = (id: string) => {
    selectCharacter(id);
  };

  const handleStartDialogue = (treeId: string) => {
    startDialogue(treeId);
  };

  const handleAdvance = () => {
    const node = currentNode();
    if (!node) return;
    if (node.choices && node.choices.length > 0) return;
    if (node.nextNodeId) {
      advanceDialogueNode(node.nextNodeId);
    } else {
      endDialogue();
    }
  };

  const handleChoice = (choiceId: string) => {
    selectDialogueChoice(choiceId);
  };

  const handleEndDialogue = () => {
    endDialogue();
  };

  const handleBack = () => {
    if (state().activeDialogueTreeId) {
      endDialogue();
      return;
    }
    if (state().selectedCharacterId) {
      selectCharacter('');
      setCharacterState(prev => ({ ...prev, selectedCharacterId: null }));
      return;
    }
  };

  const tabs: { key: CharacterState['activeTab']; label: string; icon: string }[] = [
    { key: 'characters', label: '角色', icon: '👥' },
    { key: 'booklists', label: '书单', icon: '📚' },
    { key: 'sidequests', label: '支线', icon: '📜' },
    { key: 'achievements', label: '成就', icon: '🏆' },
  ];

  const renderCharacterList = () => {
    const s = state();
    return (
      <div class="character-list">
        <For each={GAME_CHARACTERS}>
          {(char) => {
            const relInfo = createMemo(() => getRelationshipInfo(char.id));
            const hasNewDialogue = createMemo(() =>
              panelInfo().charactersWithNewDialogue.includes(char.id)
            );
            return (
              <div
                class={`character-card ${s.selectedCharacterId === char.id ? 'character-card-selected' : ''}`}
                onClick={() => handleSelectCharacter(char.id)}
                style={{ '--char-color': char.themeColor } as any}
              >
                <div class="character-card-avatar">{char.avatar}</div>
                <div class="character-card-info">
                  <div class="character-card-name">
                    {char.name}
                    <span class="character-card-role">{ROLE_LABELS[char.role]}</span>
                  </div>
                  <div class="character-card-title">{char.title}</div>
                  <div class="character-card-relationship">
                    <span
                      class="relationship-badge"
                      style={{ color: relInfo()?.color }}
                    >
                      {RELATIONSHIP_LEVEL_ICONS[relInfo()?.level || 'stranger']} {relInfo()?.label}
                    </span>
                    {relInfo() && relInfo()!.nextLevel && (
                      <div class="relationship-progress-bar">
                        <div
                          class="relationship-progress-fill"
                          style={{
                            width: `${relInfo()!.progressInLevel * 100}%`,
                            background: relInfo()!.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {hasNewDialogue() && (
                  <div class="character-new-badge">💬</div>
                )}
              </div>
            );
          }}
        </For>
      </div>
    );
  };

  const renderCharacterDetail = () => {
    const char = selectedChar();
    if (!char) return renderCharacterList();

    const s = state();
    const relInfo = getRelationshipInfo(char.id);
    const availableTree = getAvailableDialogueTree(
      char.id,
      s.relationships[char.id]?.completedDialogueTreeIds || [],
      s.relationships[char.id]?.level || 'stranger'
    );
    const completedTrees = s.relationships[char.id]?.completedDialogueTreeIds || [];
    const allTrees = getDialogueTreesForCharacter(char.id);

    return (
      <div class="character-detail">
        <div class="character-detail-header" style={{ '--char-color': char.themeColor } as any}>
          <button class="character-back-btn" onClick={handleBack}>← 返回</button>
          <div class="character-detail-avatar">{char.avatar}</div>
          <div class="character-detail-info">
            <div class="character-detail-name">{char.name}</div>
            <div class="character-detail-title-text">{char.title}</div>
            <div class="character-detail-role">{ROLE_LABELS[char.role]}</div>
          </div>
        </div>

        <div class="character-detail-body">
          <div class="character-desc-section">
            <div class="character-desc-label">人物介绍</div>
            <div class="character-desc-text">{char.description}</div>
          </div>

          <div class="character-relationship-section">
            <div class="character-relationship-header">
              <span>关系：{RELATIONSHIP_LEVEL_ICONS[relInfo?.level || 'stranger']} {relInfo?.label}</span>
              <span class="character-affinity">好感度：{relInfo?.affinity || 0}</span>
            </div>
            {relInfo && relInfo.nextLevel && (
              <div class="relationship-progress-bar-large">
                <div
                  class="relationship-progress-fill"
                  style={{
                    width: `${relInfo.progressInLevel * 100}%`,
                    background: relInfo.color,
                  }}
                />
                <span class="relationship-progress-text">
                  距离{RELATIONSHIP_THRESHOLDS[relInfo.nextLevel].label}还需{relInfo.nextLevelAffinity! - relInfo.affinity}好感
                </span>
              </div>
            )}
          </div>

          <div class="character-personality-section">
            <div class="character-personality-label">性格</div>
            <div class="character-personality-text">{char.personality}</div>
          </div>

          <div class="character-preferences">
            <div class="character-pref-likes">
              <span class="pref-label">喜欢：</span>
              <For each={char.likes}>{(l) => <span class="pref-tag pref-likes-tag">{l}</span>}</For>
            </div>
            <div class="character-pref-dislikes">
              <span class="pref-label">不喜欢：</span>
              <For each={char.dislikes}>{(d) => <span class="pref-tag pref-dislikes-tag">{d}</span>}</For>
            </div>
          </div>

          <div class="character-dialogue-section">
            <div class="character-section-title">💬 对话</div>
            {availableTree && (
              <div class="dialogue-available-card" onClick={() => handleStartDialogue(availableTree.id)}>
                <div class="dialogue-available-icon">💬</div>
                <div class="dialogue-available-info">
                  <div class="dialogue-available-title">{availableTree.title}</div>
                  <div class="dialogue-available-desc">{availableTree.description}</div>
                </div>
                <div class="dialogue-start-btn">开始对话</div>
              </div>
            )}
            {!availableTree && (
              <div class="dialogue-no-available">暂无新对话，提升好感度可解锁更多话题。</div>
            )}
            {completedTrees.length > 0 && (
              <div class="dialogue-completed-list">
                <div class="dialogue-completed-label">已完成对话：</div>
                <For each={allTrees.filter(t => completedTrees.includes(t.id))}>
                  {(tree) => (
                    <div class="dialogue-completed-item">
                      <span class="dialogue-completed-icon">✅</span>
                      <span class="dialogue-completed-title">{tree.title}</span>
                    </div>
                  )}
                </For>
              </div>
            )}
          </div>

          <div class="character-stats-section">
            <div class="character-stat">
              <span class="character-stat-label">总对话次数</span>
              <span class="character-stat-value">{relInfo?.totalDialogues || 0}</span>
            </div>
            <div class="character-stat">
              <span class="character-stat-label">位置</span>
              <span class="character-stat-value">{char.defaultLocation}</span>
            </div>
            <div class="character-stat">
              <span class="character-stat-label">出没时间</span>
              <span class="character-stat-value">{char.scheduleNote}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDialogue = () => {
    const node = currentNode();
    const s = state();
    if (!node || !s.activeDialogueTreeId) return null;

    const charId = s.selectedCharacterId || '';
    const char = getCharacterById(charId);

    return (
      <div class="dialogue-container">
        <div class="dialogue-header">
          <button class="character-back-btn" onClick={handleEndDialogue}>✕ 结束对话</button>
          <span class="dialogue-title">
            {char?.avatar} {char?.name}
          </span>
        </div>
        <div class="dialogue-body">
          <div class={`dialogue-bubble ${node.speaker === 'character' ? 'dialogue-bubble-character' : 'dialogue-bubble-player'}`}>
            {node.speaker === 'character' && (
              <div class="dialogue-avatar-small">{char?.avatar}</div>
            )}
            <div class="dialogue-text">
              {node.text}
            </div>
          </div>

          {node.choices && node.choices.length > 0 ? (
            <div class="dialogue-choices">
              <For each={node.choices}>
                {(choice) => (
                  <button
                    class="dialogue-choice-btn"
                    onClick={() => handleChoice(choice.id)}
                    style={{ '--char-color': char?.themeColor || '#8B7355' } as any}
                  >
                    {choice.text}
                  </button>
                )}
              </For>
            </div>
          ) : node.nextNodeId ? (
            <button class="dialogue-continue-btn" onClick={handleAdvance}>
              继续 →
            </button>
          ) : (
            <button class="dialogue-end-btn" onClick={handleEndDialogue}>
              结束对话
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderBooklists = () => (
    <div class="booklist-section">
      <For each={booklists()}>
        {(bl) => {
          const char = getCharacterById(bl.characterId);
          return (
            <div class={`booklist-card ${bl.unlocked ? 'booklist-card-unlocked' : 'booklist-card-locked'}`}>
              <div class="booklist-icon">{bl.icon}</div>
              <div class="booklist-info">
                <div class="booklist-title">{bl.title}</div>
                <div class="booklist-desc">{bl.description}</div>
                <div class="booklist-meta">
                  <span class="booklist-char">{char?.avatar} {char?.name}</span>
                  <span class="booklist-books">{bl.bookIds.length}本书</span>
                  <span class="booklist-require">
                    需要关系：{RELATIONSHIP_LEVEL_ICONS[bl.unlockRelationshipLevel]} {RELATIONSHIP_THRESHOLDS[bl.unlockRelationshipLevel].label}
                  </span>
                </div>
              </div>
              {bl.unlocked ? (
                <div class="booklist-status-unlocked">已解锁</div>
              ) : (
                <div class="booklist-status-locked">🔒</div>
              )}
            </div>
          );
        }}
      </For>
    </div>
  );

  const renderSideQuests = () => (
    <div class="sidequest-section">
      <For each={sideQuests()}>
        {(sq) => {
          const char = getCharacterById(sq.characterId);
          const statusLabel: Record<string, string> = {
            locked: '🔒 未解锁',
            available: '📋 可接取',
            in_progress: '⏳ 进行中',
            completed: '✅ 已完成',
            claimed: '🎁 已领取',
          };
          return (
            <div class={`sidequest-card sidequest-${sq.status}`}>
              <div class="sidequest-icon">{sq.icon}</div>
              <div class="sidequest-info">
                <div class="sidequest-title">{sq.title}</div>
                <div class="sidequest-desc">{sq.description}</div>
                <div class="sidequest-meta">
                  <span class="sidequest-char">{char?.avatar} {char?.name}</span>
                  <span class="sidequest-require">
                    需要：{RELATIONSHIP_LEVEL_ICONS[sq.unlockRelationshipLevel]} {RELATIONSHIP_THRESHOLDS[sq.unlockRelationshipLevel].label}
                  </span>
                </div>
                <div class="sidequest-objectives">
                  <For each={sq.objectives}>
                    {(obj) => (
                      <div class="sidequest-objective">
                        • {obj.description}
                      </div>
                    )}
                  </For>
                </div>
                <div class="sidequest-rewards">
                  <For each={sq.rewards}>
                    {(reward) => (
                      <span class="sidequest-reward">
                        {reward.type === 'coins' ? '🪙' : reward.type === 'score' ? '⭐' : reward.type === 'achievement' ? '🏆' : reward.type === 'relationship' ? '💕' : '🎁'}
                        {' '}{reward.description || reward.value}
                      </span>
                    )}
                  </For>
                </div>
              </div>
              <div class="sidequest-status">{statusLabel[sq.status]}</div>
            </div>
          );
        }}
      </For>
    </div>
  );

  const renderAchievements = () => (
    <div class="character-achievements-section">
      <For each={achievements()}>
        {(ach) => {
          const char = ach.characterId ? getCharacterById(ach.characterId) : null;
          const achProgress = createMemo(() => {
            const prog = getCharacterAchievementProgress();
            return prog[ach.id];
          });
          return (
            <div class={`character-achievement-card ${ach.unlocked ? 'character-achievement-unlocked' : 'character-achievement-locked'}`}>
              <div class="character-achievement-icon">{ach.icon}</div>
              <div class="character-achievement-info">
                <div class="character-achievement-title">{ach.title}</div>
                <div class="character-achievement-desc">{ach.description}</div>
                {char && (
                  <div class="character-achievement-char">{char.avatar} {char.name}</div>
                )}
                {ach.type === 'progressive' && ach.stages && (
                  <div class="character-achievement-stages">
                    <For each={ach.stages}>
                      {(stage) => (
                        <div class={`character-achievement-stage ${achProgress()?.unlockedStages?.includes(stage.id) ? 'stage-complete' : ''}`}>
                          <span class="stage-threshold">{stage.threshold}</span>
                          <span class="stage-title">{stage.title}</span>
                        </div>
                      )}
                    </For>
                  </div>
                )}
              </div>
              {ach.unlocked ? (
                <div class="character-achievement-badge">✅</div>
              ) : (
                <div class="character-achievement-badge">🔒</div>
              )}
            </div>
          );
        }}
      </For>
    </div>
  );

  const s = state();

  return (
    <div class="character-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div class="character-modal">
        <div class="character-modal-header">
          <div class="character-modal-title">👥 角色对话与关系</div>
          <button class="character-modal-close" onClick={handleClose}>✕</button>
        </div>

        {!s.activeDialogueTreeId && (
          <div class="character-modal-tabs">
            <For each={tabs}>
              {(tab) => (
                <button
                  class={`character-tab-btn ${s.activeTab === tab.key ? 'character-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon} {tab.label}
                  {tab.key === 'characters' && panelInfo().availableDialogueCount > 0 && (
                    <span class="tab-badge">{panelInfo().availableDialogueCount}</span>
                  )}
                  {tab.key === 'booklists' && (
                    <span class="tab-count">{panelInfo().unlockedBooklistCount}/{panelInfo().totalBooklistCount}</span>
                  )}
                  {tab.key === 'sidequests' && panelInfo().availableQuestCount > 0 && (
                    <span class="tab-badge">{panelInfo().availableQuestCount}</span>
                  )}
                  {tab.key === 'achievements' && (
                    <span class="tab-count">{panelInfo().unlockedAchievementCount}/{panelInfo().totalAchievementCount}</span>
                  )}
                </button>
              )}
            </For>
          </div>
        )}

        <div class="character-modal-body">
          <Show when={s.activeDialogueTreeId}>
            {renderDialogue()}
          </Show>

          <Show when={!s.activeDialogueTreeId && s.activeTab === 'characters'}>
            <Show when={s.selectedCharacterId} fallback={renderCharacterList()}>
              {renderCharacterDetail()}
            </Show>
          </Show>

          <Show when={!s.activeDialogueTreeId && s.activeTab === 'booklists'}>
            {renderBooklists()}
          </Show>

          <Show when={!s.activeDialogueTreeId && s.activeTab === 'sidequests'}>
            {renderSideQuests()}
          </Show>

          <Show when={!s.activeDialogueTreeId && s.activeTab === 'achievements'}>
            {renderAchievements()}
          </Show>
        </div>
      </div>
    </div>
  );
}
