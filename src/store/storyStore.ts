import { createSignal } from 'solid-js';
import type { StoryState, Dialogue, DialogueLine, StorySettlement } from '../types/story';
import { BOOKSHELF_AREAS, SPECIAL_BOOKS, STORY_DIALOGUES, STORY_CHAPTERS, getAreaById, getCharacterById, getStoryChapterByAreaId, calculateStoryRating } from '../data/story';
import { getChapterProgress } from '../utils/storage';
import {
  getStorySave,
  updateAreaStatus,
  markDialogueCompleted,
  markSpecialBookRestored,
  unlockSecret,
  updateCharacterRelationship,
  startStory as startStoryStorage,
} from '../utils/storyStorage';

const createInitialState = (): StoryState => {
  const save = getStorySave();
  return {
    save,
    activeDialogue: null,
    currentDialogueLineIndex: 0,
    showAreaMap: true,
    selectedAreaId: null,
    showSpecialBookDetail: null,
    showStoryNarration: false,
    currentNarrationText: '',
    transitioning: false,
    transitionTarget: null,
  };
};

export const [storyState, setStoryState] = createSignal<StoryState>(createInitialState());

export const refreshStoryState = () => {
  const save = getStorySave();
  setStoryState(prev => ({ ...prev, save }));
};

export const startStory = () => {
  const save = startStoryStorage();
  setStoryState(prev => ({
    ...prev,
    save,
    showAreaMap: true,
    showStoryNarration: true,
    currentNarrationText: STORY_CHAPTERS[0].introNarration,
  }));
};

export const selectArea = (areaId: string) => {
  const area = getAreaById(areaId);
  if (!area) return;
  
  const state = storyState();
  const status = state.save.areasStatus[areaId];
  
  if (status === 'locked') return;
  
  setStoryState(prev => ({
    ...prev,
    selectedAreaId: areaId,
    showAreaMap: false,
  }));
  
  triggerAreaDialogue(areaId, 'on_enter');
};

export const returnToMap = () => {
  setStoryState(prev => ({
    ...prev,
    showAreaMap: true,
    selectedAreaId: null,
    activeDialogue: null,
    showStoryNarration: false,
  }));
};

export const triggerAreaDialogue = (areaId: string, trigger: string, triggerTarget?: string) => {
  const state = storyState();
  const dialogues = STORY_DIALOGUES.filter(d => {
    if (d.areaId !== areaId) return false;
    if (d.trigger !== trigger) return false;
    if (d.triggerTarget && d.triggerTarget !== triggerTarget) return false;
    if (!d.repeatable && state.save.completedDialogues.includes(d.id)) return false;
    if (d.condition) {
      if (d.condition.areasRestored !== undefined && state.save.totalAreasRestored < d.condition.areasRestored) return false;
      if (d.condition.specificAreaRestored && state.save.areasStatus[d.condition.specificAreaRestored] !== 'restored') return false;
      if (d.condition.booksFound !== undefined) return false;
      if (d.condition.hasItem && !state.save.unlockedSecrets.includes(d.condition.hasItem)) return false;
    }
    return true;
  });
  
  dialogues.sort((a, b) => b.priority - a.priority);
  
  if (dialogues.length > 0) {
    startDialogue(dialogues[0]);
  }
};

export const startDialogue = (dialogue: Dialogue) => {
  setStoryState(prev => ({
    ...prev,
    activeDialogue: dialogue,
    currentDialogueLineIndex: 0,
  }));
};

export const advanceDialogue = () => {
  const state = storyState();
  const dialogue = state.activeDialogue;
  if (!dialogue) return;
  
  const currentLine = dialogue.lines[state.currentDialogueLineIndex];
  if (currentLine && currentLine.choices && currentLine.choices.length > 0) return;
  
  const nextIndex = state.currentDialogueLineIndex + 1;
  if (nextIndex >= dialogue.lines.length) {
    completeDialogue();
  } else {
    setStoryState(prev => ({
      ...prev,
      currentDialogueLineIndex: nextIndex,
    }));
  }
};

export const selectDialogueChoice = (choiceId: string) => {
  const state = storyState();
  const dialogue = state.activeDialogue;
  if (!dialogue) return;
  
  const currentLine = dialogue.lines[state.currentDialogueLineIndex];
  if (!currentLine || !currentLine.choices) return;
  
  const choice = currentLine.choices.find(c => c.id === choiceId);
  if (!choice) return;
  
  markDialogueCompleted(dialogue.id, choiceId);
  
  if (choice.effect) {
    switch (choice.effect.type) {
      case 'reveal_secret':
        if (choice.effect.targetId) {
          unlockSecret(choice.effect.targetId);
        }
        break;
      case 'change_relationship':
        if (choice.effect.targetId && choice.effect.value) {
          updateCharacterRelationship(choice.effect.targetId, choice.effect.value);
        }
        break;
    }
  }
  
  refreshStoryState();
  
  const targetDialogue = STORY_DIALOGUES.find(d => d.id === choice.nextDialogueId);
  if (targetDialogue) {
    startDialogue(targetDialogue);
  } else {
    completeDialogue();
  }
};

export const completeDialogue = () => {
  const state = storyState();
  const dialogue = state.activeDialogue;
  if (!dialogue) return;
  
  if (!state.save.completedDialogues.includes(dialogue.id)) {
    markDialogueCompleted(dialogue.id);
  }
  
  refreshStoryState();
  
  setStoryState(prev => ({
    ...prev,
    activeDialogue: null,
    currentDialogueLineIndex: 0,
  }));
};

export const restoreArea = (areaId: string) => {
  const area = getAreaById(areaId);
  if (!area) return;
  
  updateAreaStatus(areaId, 'restored');
  
  for (const bookId of area.specialBookIds) {
    const specialBook = SPECIAL_BOOKS.find(b => b.id === bookId);
    if (specialBook && specialBook.unlockCondition.type === 'complete_area' && specialBook.unlockCondition.areaId === areaId) {
      markSpecialBookRestored(bookId);
    }
  }
  
  const chapter = getStoryChapterByAreaId(areaId);
  if (chapter) {
    showNarration(chapter.completionNarration);
  }
  
  if (areaId !== 'area_entrance') {
    triggerAreaDialogue('area_entrance', 'on_restore', areaId);
  }
  
  refreshStoryState();
};

export const checkAreaRestoration = (areaId: string): boolean => {
  const area = getAreaById(areaId);
  if (!area) return false;
  
  if (!area.relatedChapterId) {
    const state = storyState();
    return state.save.areasStatus[areaId] === 'restored';
  }
  
  const chapterProgress = getChapterProgress(area.relatedChapterId);
  return !!chapterProgress?.completedAt;
};

export const tryRestoreArea = (areaId: string): boolean => {
  const area = getAreaById(areaId);
  if (!area) return false;
  
  if (!area.relatedChapterId) {
    restoreArea(areaId);
    return true;
  }
  
  const chapterProgress = getChapterProgress(area.relatedChapterId);
  if (!chapterProgress?.completedAt) return false;
  
  restoreArea(areaId);
  return true;
};

export const showNarration = (text: string) => {
  setStoryState(prev => ({
    ...prev,
    showStoryNarration: true,
    currentNarrationText: text,
  }));
};

export const hideNarration = () => {
  setStoryState(prev => ({
    ...prev,
    showStoryNarration: false,
    currentNarrationText: '',
  }));
};

export const showSpecialBookDetail = (bookId: string) => {
  setStoryState(prev => ({
    ...prev,
    showSpecialBookDetail: bookId,
  }));
};

export const hideSpecialBookDetail = () => {
  setStoryState(prev => ({
    ...prev,
    showSpecialBookDetail: null,
  }));
};

export const getStorySettlement = (): StorySettlement => {
  const save = getStorySave();
  const rating = calculateStoryRating({
    totalAreasRestored: save.totalAreasRestored,
    totalSpecialBooks: save.restoredSpecialBooks.length,
    totalDialoguesViewed: save.dialogueHistory.length,
    completionTime: save.completedAt ? save.completedAt - save.startedAt : 0,
  });
  
  return {
    totalAreasRestored: save.totalAreasRestored,
    totalSpecialBooks: save.restoredSpecialBooks.length,
    totalDialoguesViewed: save.dialogueHistory.length,
    totalCoinsSpent: 0,
    totalPlayTime: save.completedAt ? save.completedAt - save.startedAt : Date.now() - save.startedAt,
    completionTime: save.completedAt ? save.completedAt - save.startedAt : 0,
    storyRating: rating,
  };
};

export const getAvailableAreas = () => {
  const state = storyState();
  return BOOKSHELF_AREAS.filter(area => {
    const status = state.save.areasStatus[area.id];
    return status !== 'locked';
  });
};

export const getStoryProgress = (): number => {
  const state = storyState();
  const totalAreas = BOOKSHELF_AREAS.length;
  const restored = state.save.totalAreasRestored;
  return Math.floor((restored / totalAreas) * 100);
};

export const getCurrentDialogueLine = (): DialogueLine | null => {
  const state = storyState();
  if (!state.activeDialogue) return null;
  return state.activeDialogue.lines[state.currentDialogueLineIndex] || null;
};

export const getAreaCharacterForCurrentArea = () => {
  const state = storyState();
  const areaId = state.selectedAreaId;
  if (!areaId) return null;
  const area = getAreaById(areaId);
  if (!area) return null;
  return getCharacterById(area.characterId);
};

export const getSpecialBooksForArea = (areaId: string) => {
  const state = storyState();
  const area = getAreaById(areaId);
  if (!area) return [];
  return SPECIAL_BOOKS.filter(b => area.specialBookIds.includes(b.id)).map(b => ({
    ...b,
    restored: state.save.restoredSpecialBooks.includes(b.id),
  }));
};
