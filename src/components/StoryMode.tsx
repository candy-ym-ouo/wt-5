import { createSignal, createMemo, onMount, Show, For } from 'solid-js';
import type { BookshelfArea } from '../types/story';
import { BOOKSHELF_AREAS, SPECIAL_BOOKS, getCharacterById } from '../data/story';
import {
  storyState,
  startStory,
  selectArea,
  returnToMap,
  advanceDialogue,
  selectDialogueChoice,
  tryRestoreArea,
  hideNarration,
  showSpecialBookDetail,
  hideSpecialBookDetail,
  getStoryProgress,
  getCurrentDialogueLine,
  getAreaCharacterForCurrentArea,
  getSpecialBooksForArea,
  refreshStoryState,
  getStorySettlement,
  checkSettlementAchievements,
} from '../store/storyStore';
import { showStoryAchievementPopup } from '../store/gameStore';
import { getChapterProgress } from '../utils/storage';
import { isStoryStarted, isStoryCompleted, getRestoredAreasCount, getRestoredSpecialBooksCount } from '../utils/storyStorage';

interface StoryModeProps {
  onBack: () => void;
  onStartChapter: (chapterId: string) => void;
}

export default function StoryMode(props: StoryModeProps) {
  const [view, setView] = createSignal<'intro' | 'map' | 'area' | 'dialogue' | 'narration' | 'settlement'>('map');
  const [selectedArea, setSelectedArea] = createSignal<BookshelfArea | null>(null);
  
  const state = createMemo(() => storyState());
  const progress = createMemo(() => getStoryProgress());
  const currentLine = createMemo(() => getCurrentDialogueLine());
  const areaCharacter = createMemo(() => getAreaCharacterForCurrentArea());
  
  onMount(() => {
    refreshStoryState();
    if (!isStoryStarted()) {
      setView('intro');
    } else if (isStoryCompleted()) {
      setView('settlement');
    } else {
      setView('map');
    }
  });
  
  const handleStartStory = () => {
    startStory();
    setView('narration');
  };
  
  const handleSelectArea = (area: BookshelfArea) => {
    const s = state();
    const status = s.save.areasStatus[area.id];
    if (status === 'locked') return;
    
    setSelectedArea(area);
    selectArea(area.id);
    setView('area');
  };
  
  const handleStartChapter = (chapterId: string) => {
    props.onStartChapter(chapterId);
  };
  
  const handleRestoreArea = (areaId: string) => {
    const success = tryRestoreArea(areaId);
    if (success) {
      refreshStoryState();
    }
  };
  
  const handleAdvanceDialogue = () => {
    const line = currentLine();
    if (line && line.choices && line.choices.length > 0) return;
    advanceDialogue();
    
    const s = state();
    if (!s.activeDialogue) {
      setView(selectedArea() ? 'area' : 'map');
    }
  };
  
  const handleSelectChoice = (choiceId: string) => {
    selectDialogueChoice(choiceId);
    const s = state();
    if (!s.activeDialogue) {
      setView(selectedArea() ? 'area' : 'map');
    }
  };
  
  const handleBackToMap = () => {
    returnToMap();
    setSelectedArea(null);
    setView('map');
  };
  
  const handleNarrationContinue = () => {
    hideNarration();
    if (isStoryCompleted()) {
      setView('settlement');
    } else {
      setView('map');
    }
  };
  
  const getAreaStatusDisplay = (area: BookshelfArea): { text: string; class: string } => {
    const s = state();
    const status = s.save.areasStatus[area.id];
    switch (status) {
      case 'locked': return { text: '🔒 未解锁', class: 'locked' };
      case 'damaged': return { text: '🏚️ 待修复', class: 'damaged' };
      case 'restoring': return { text: '🔧 修复中', class: 'restoring' };
      case 'restored': return { text: '✨ 已修复', class: 'restored' };
      default: return { text: '❓ 未知', class: '' };
    }
  };
  
  const getChapterCompletionStatus = (chapterId: string) => {
    if (!chapterId) return null;
    const progress = getChapterProgress(chapterId);
    if (!progress) return 'not_started';
    if (progress.completedAt) return 'completed';
    if (progress.currentTaskIndex > 0) return 'in_progress';
    return 'not_started';
  };
  
  return (
    <div class="story-mode-overlay">
      <div class="story-mode-content">
        <Show when={view() === 'intro'}>
          <div class="story-intro">
            <div class="story-intro-book">
              <div class="story-intro-spine"></div>
              <div class="story-intro-cover">
                <div class="story-intro-icon">📚</div>
                <div class="story-intro-title">旧书店修复记</div>
                <div class="story-intro-subtitle">一段关于书、故事与传承的旅程</div>
              </div>
            </div>
            <div class="story-intro-text">
              <p>在城市最古老的街巷深处，有一间被遗忘的旧书店。</p>
              <p>书店里住着六位守护者，他们与书籍共同生活了数十年。</p>
              <p>如今，书店需要你的帮助——修复每一个区域，找回每一本珍贵的书，倾听每一段故事。</p>
              <p>你，愿意成为新的传承人吗？</p>
            </div>
            <button class="story-start-button" onClick={handleStartStory}>
              📖 开启旅程
            </button>
            <button class="story-back-button" onClick={props.onBack}>
              ← 返回
            </button>
          </div>
        </Show>
        
        <Show when={view() === 'narration'}>
          <div class="story-narration">
            <div class="story-narration-frame">
              <div class="story-narration-text">{state().currentNarrationText}</div>
            </div>
            <button class="story-narration-continue" onClick={handleNarrationContinue}>
              继续 →
            </button>
          </div>
        </Show>
        
        <Show when={view() === 'map'}>
          <div class="story-map">
            <div class="story-map-header">
              <button class="story-map-back" onClick={props.onBack}>← 返回</button>
              <div class="story-map-title">
                <span class="story-map-icon">🏚️</span>
                <span>旧书店修复记</span>
              </div>
              <div class="story-map-progress">
                <div class="story-progress-bar">
                  <div class="story-progress-fill" style={{ width: `${progress()}%` }} />
                </div>
                <span class="story-progress-text">{progress()}% 修复</span>
              </div>
            </div>
            
            <div class="story-map-stats">
              <div class="story-stat-item">
                <span class="story-stat-icon">🏗️</span>
                <span class="story-stat-value">{getRestoredAreasCount()}/{BOOKSHELF_AREAS.length}</span>
                <span class="story-stat-label">区域修复</span>
              </div>
              <div class="story-stat-item">
                <span class="story-stat-icon">📕</span>
                <span class="story-stat-value">{getRestoredSpecialBooksCount()}/{SPECIAL_BOOKS.length}</span>
                <span class="story-stat-label">珍本发现</span>
              </div>
              <div class="story-stat-item">
                <span class="story-stat-icon">💬</span>
                <span class="story-stat-value">{state().save.dialogueHistory.length}</span>
                <span class="story-stat-label">对话次数</span>
              </div>
            </div>
            
            <div class="story-area-grid">
              <For each={BOOKSHELF_AREAS}>
                {(area) => {
                  const statusDisplay = getAreaStatusDisplay(area);
                  const s = state();
                  const isLocked = s.save.areasStatus[area.id] === 'locked';
                  const isRestored = s.save.areasStatus[area.id] === 'restored';
                  const chapterStatus = area.relatedChapterId ? getChapterCompletionStatus(area.relatedChapterId) : null;
                  const specialBooks = getSpecialBooksForArea(area.id);
                  
                  return (
                    <div
                      class={`story-area-card ${isLocked ? 'locked' : ''} ${isRestored ? 'restored' : ''}`}
                      style={{ '--area-color': area.themeColor }}
                      onClick={() => !isLocked && handleSelectArea(area)}
                    >
                      <div class="area-card-bg" style={{ background: area.bgGradient }} />
                      <div class="area-card-content">
                        <div class="area-card-icon">{area.icon}</div>
                        <div class="area-card-name">{area.name}</div>
                        <div class="area-card-subtitle">{area.subtitle}</div>
                        <div class={`area-card-status ${statusDisplay.class}`}>
                          {statusDisplay.text}
                        </div>
                        
                        <Show when={chapterStatus === 'completed'}>
                          <div class="area-chapter-complete">✅ 章节完成</div>
                        </Show>
                        <Show when={chapterStatus === 'in_progress'}>
                          <div class="area-chapter-progress">🔄 进行中</div>
                        </Show>
                        
                        <Show when={specialBooks.length > 0}>
                          <div class="area-special-books">
                            <For each={specialBooks}>
                              {(book) => (
                                <span class={`area-special-book ${book.restored ? 'found' : 'hidden'}`}>
                                  {book.restored ? book.icon : '❓'}
                                </span>
                              )}
                            </For>
                          </div>
                        </Show>
                        
                        <Show when={isLocked}>
                          <div class="area-locked-overlay">
                            <span class="lock-icon">🔒</span>
                          </div>
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
            
            <Show when={isStoryCompleted()}>
              <button class="story-settlement-button" onClick={() => setView('settlement')}>
                🏆 查看结局
              </button>
            </Show>
          </div>
        </Show>
        
        <Show when={view() === 'area' && selectedArea()}>
          <div class="story-area-detail" style={{ '--area-color': selectedArea()!.themeColor }}>
            <div class="area-detail-bg" style={{ background: selectedArea()!.bgGradient }} />
            <div class="area-detail-content">
              <div class="area-detail-header">
                <button class="area-detail-back" onClick={handleBackToMap}>← 返回地图</button>
                <div class="area-detail-title-row">
                  <span class="area-detail-icon">{selectedArea()!.icon}</span>
                  <div>
                    <div class="area-detail-name">{selectedArea()!.name}</div>
                    <div class="area-detail-subtitle">{selectedArea()!.subtitle}</div>
                  </div>
                </div>
              </div>
              
              <div class="area-detail-description">
                <Show
                  when={state().save.areasStatus[selectedArea()!.id] === 'restored'}
                  fallback={selectedArea()!.damagedDescription}
                >
                  {selectedArea()!.restoredDescription}
                </Show>
              </div>
              
              <Show when={areaCharacter()}>
                <div class="area-character-card">
                  <div class="character-avatar">{areaCharacter()!.avatar}</div>
                  <div class="character-info">
                    <div class="character-name">{areaCharacter()!.name}</div>
                    <div class="character-title">{areaCharacter()!.title}</div>
                  </div>
                </div>
              </Show>
              
              <Show when={selectedArea()!.relatedChapterId}>
                <div class="area-challenge-section">
                  <div class="area-section-title">📖 章节挑战</div>
                  {(() => {
                    const chapterStatus = getChapterCompletionStatus(selectedArea()!.relatedChapterId!);
                    const areaId = selectedArea()!.id;
                    const areaStatus = state().save.areasStatus[areaId];
                    
                    return (
                      <>
                        <Show when={chapterStatus === 'not_started'}>
                          <button
                            class="area-challenge-button start"
                            onClick={() => handleStartChapter(selectedArea()!.relatedChapterId!)}
                          >
                            🎯 开始挑战
                          </button>
                        </Show>
                        <Show when={chapterStatus === 'in_progress'}>
                          <button
                            class="area-challenge-button continue"
                            onClick={() => handleStartChapter(selectedArea()!.relatedChapterId!)}
                          >
                            ⏯️ 继续挑战
                          </button>
                        </Show>
                        <Show when={chapterStatus === 'completed' && areaStatus !== 'restored'}>
                          <button
                            class="area-challenge-button restore"
                            onClick={() => handleRestoreArea(areaId)}
                          >
                            ✨ 修复此区域
                          </button>
                        </Show>
                        <Show when={chapterStatus === 'completed' && areaStatus === 'restored'}>
                          <div class="area-restored-badge">
                            ✨ 区域已修复
                          </div>
                          <button
                            class="area-challenge-button replay"
                            onClick={() => handleStartChapter(selectedArea()!.relatedChapterId!)}
                          >
                            🔄 重新挑战
                          </button>
                        </Show>
                      </>
                    );
                  })()}
                </div>
              </Show>
              
              <Show when={!selectedArea()!.relatedChapterId}>
                <div class="area-challenge-section">
                  <div class="area-section-title">🏠 入口区域</div>
                  <Show when={state().save.areasStatus[selectedArea()!.id] !== 'restored'}>
                    <button
                      class="area-challenge-button restore"
                      onClick={() => handleRestoreArea(selectedArea()!.id)}
                    >
                      ✨ 修复门厅
                    </button>
                  </Show>
                  <Show when={state().save.areasStatus[selectedArea()!.id] === 'restored'}>
                    <div class="area-restored-badge">✨ 门厅已修复</div>
                  </Show>
                </div>
              </Show>
              
              <Show when={getSpecialBooksForArea(selectedArea()!.id).length > 0}>
                <div class="area-special-section">
                  <div class="area-section-title">📕 珍本藏书</div>
                  <div class="area-special-list">
                    <For each={getSpecialBooksForArea(selectedArea()!.id)}>
                      {(book) => (
                        <div
                          class={`area-special-item ${book.restored ? 'found' : 'hidden'}`}
                          onClick={() => book.restored && showSpecialBookDetail(book.id)}
                        >
                          <span class="special-book-icon">{book.restored ? book.icon : '❓'}</span>
                          <div class="special-book-info">
                            <div class="special-book-title">
                              {book.restored ? book.title : '未发现'}
                            </div>
                            <div class="special-book-desc">
                              {book.restored ? book.description : '完成区域修复以发现珍本'}
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
              
              <Show when={state().save.areasStatus[selectedArea()!.id] === 'restored'}>
                <div class="area-rewards-section">
                  <div class="area-section-title">🎁 修复奖励</div>
                  <For each={selectedArea()!.restorationRewards}>
                    {(reward) => (
                      <div class="area-reward-item">
                        <span class="reward-check">✅</span>
                        <span class="reward-text">{reward.description}</span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
              
              <Show when={state().showSpecialBookDetail}>
                <div class="special-book-detail-overlay" onClick={hideSpecialBookDetail}>
                  <div class="special-book-detail" onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const book = SPECIAL_BOOKS.find(b => b.id === state().showSpecialBookDetail);
                      if (!book) return null;
                      return (
                        <>
                          <div class="special-detail-icon">{book.icon}</div>
                          <div class="special-detail-title">{book.title}</div>
                          <div class="special-detail-author">{book.author}</div>
                          <div class="special-detail-rarity">✨ 独特珍本</div>
                          <div class="special-detail-long-desc">{book.longDescription}</div>
                          <div class="special-detail-lore">
                            <div class="lore-title">📖 典故</div>
                            <div class="lore-text">{book.lore}</div>
                          </div>
                          <button class="special-detail-close" onClick={hideSpecialBookDetail}>关闭</button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>
        
        <Show when={state().activeDialogue && (view() === 'area' || view() === 'map')}>
          <div class="story-dialogue-overlay">
            <div class="story-dialogue-box">
              <Show when={currentLine()}>
                <div class="dialogue-speaker">
                  <Show when={currentLine()!.speaker === 'character' && currentLine()!.characterId}>
                    {(() => {
                      const char = getCharacterById(currentLine()!.characterId!);
                      return char ? (
                        <div class="speaker-info">
                          <span class="speaker-avatar">{char.avatar}</span>
                          <span class="speaker-name">{char.name}</span>
                          <Show when={currentLine()!.emotion}>
                            <span class="speaker-emotion">「{currentLine()!.emotion}」</span>
                          </Show>
                        </div>
                      ) : null;
                    })()}
                  </Show>
                  <Show when={currentLine()!.speaker === 'narrator'}>
                    <div class="speaker-info">
                      <span class="speaker-avatar">📖</span>
                      <span class="speaker-name">旁白</span>
                    </div>
                  </Show>
                  <Show when={currentLine()!.speaker === 'player'}>
                    <div class="speaker-info">
                      <span class="speaker-avatar">🧑</span>
                      <span class="speaker-name">你</span>
                    </div>
                  </Show>
                </div>
                
                <div class="dialogue-text">{currentLine()!.text}</div>
                
                <Show when={currentLine()!.choices && currentLine()!.choices!.length > 0}>
                  <div class="dialogue-choices">
                    <For each={currentLine()!.choices!}>
                      {(choice) => (
                        <button
                          class="dialogue-choice-button"
                          onClick={() => handleSelectChoice(choice.id)}
                        >
                          {choice.text}
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
                
                <Show when={!currentLine()!.choices || currentLine()!.choices!.length === 0}>
                  <button class="dialogue-advance-button" onClick={handleAdvanceDialogue}>
                    ▶ 继续
                  </button>
                </Show>
              </Show>
            </div>
          </div>
        </Show>
        
        <Show when={view() === 'settlement'}>
          {(() => {
            const settlement = getStorySettlement();
            const rating = settlement.storyRating;
            
            if (rating.grade === 'S') {
              const sRankAch = checkSettlementAchievements();
              if (sRankAch) {
                setTimeout(() => showStoryAchievementPopup(sRankAch), 500);
              }
            }
            
            return (
              <div class="story-settlement">
                <div class="settlement-title">🎊 旧书店修复完成</div>
                <div class="settlement-subtitle">所有的故事都找到了归宿</div>
                
                <div class="settlement-rating" style={{ '--rating-color': rating.grade === 'S' ? '#ffd700' : rating.grade === 'A' ? '#ff6b6b' : '#87ceeb' }}>
                  <div class="settlement-grade">{rating.grade}</div>
                  <div class="settlement-rating-title">{rating.title}</div>
                  <div class="settlement-rating-desc">{rating.description}</div>
                  <div class="settlement-rating-score">评分：{rating.score}/100</div>
                  <div class="settlement-bonus">额外奖励 +{rating.bonusScore} 分</div>
                </div>
                
                <div class="settlement-stats">
                  <div class="settlement-stat">
                    <span class="settlement-stat-value">{settlement.totalAreasRestored}</span>
                    <span class="settlement-stat-label">区域修复</span>
                  </div>
                  <div class="settlement-stat">
                    <span class="settlement-stat-value">{settlement.totalSpecialBooks}</span>
                    <span class="settlement-stat-label">珍本发现</span>
                  </div>
                  <div class="settlement-stat">
                    <span class="settlement-stat-value">{settlement.totalDialoguesViewed}</span>
                    <span class="settlement-stat-label">对话次数</span>
                  </div>
                </div>
                
                <div class="settlement-characters">
                  <div class="settlement-section-title">守护者们</div>
                  <For each={['char_grandpa', 'char_librarian', 'char_historian', 'char_scientist', 'char_philosopher', 'char_engineer']}>
                    {(charId) => {
                      const char = getCharacterById(charId);
                      if (!char) return null;
                      const relationship = state().save.characterRelationships[charId] || 0;
                      return (
                        <div class="settlement-character">
                          <span class="settlement-char-avatar">{char.avatar}</span>
                          <span class="settlement-char-name">{char.name}</span>
                          <span class="settlement-char-relationship">❤️ {relationship}</span>
                        </div>
                      );
                    }}
                  </For>
                </div>
                
                <div class="settlement-actions">
                  <button class="settlement-button" onClick={handleBackToMap}>
                    🗺️ 返回书店
                  </button>
                  <button class="settlement-button secondary" onClick={props.onBack}>
                    🏠 返回主页
                  </button>
                </div>
              </div>
            );
          })()}
        </Show>
      </div>
    </div>
  );
}
